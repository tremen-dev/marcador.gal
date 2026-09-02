# Carga del catálogo de alias declarado

Procedimiento para cargar el catálogo de alias de una fuente y temporada en Postgres. El catálogo vincula las grafías con las que una fuente escribe nombres de equipos con los `TeamId` canónicos del calendario declarado (SPEC-010).

## Paso previo: dictamen de dominio

Antes de la primera carga real de una fuente y temporada, `sdd-competicion` debe confirmar:

1. **Emparejamiento fuente-equipo.** Cada `alias` declarado corresponde a un equipo real de `TeamId` válido en el calendario (verificar en `calendario/<temporada>/<competition_id>.json` y `docs/fundacion/dominio.md`).
2. **Formato de la fuente.** Las grafías vienen tal cual la fuente las escribe, incluyendo mayúsculas y acentos —no se normalizan antes de guardar.

Sin estos dictámenes, no se carga.

## Formato del fichero

El fichero vive en `alias/<temporada>/<source_id>.json` (p. ej. `alias/2026-27/ceroacero.json`) y debe validar contra el esquema `AliasesSchema` de `src/alias/catalog.ts`. Ejemplo:

```json
{
  "source": "ceroacero",
  "season": "2026/27",
  "declared_by": "Alberto Fojo",
  "declared_at": "2026-09-05T10:00:00Z",
  "source_note": "Grafías lidas na páxina da competición o 2026-09-05",
  "aliases": [
    { "alias": "Ourense", "team_id": "ud-ourense" },
    { "alias": "UD Ourense", "team_id": "ud-ourense" },
    { "alias": "Celta de Vigo B", "team_id": "rc-celta-b" }
  ]
}
```

**Validación:**
- `source` en forma *kebab-case* (p. ej. `ceroacero`, `besoccer`)
- `season` en forma RFGF: `YYYY/YY` (p. ej. `2026/27`, como en `calendario/`)
- `declared_by`: persona que lo declaró, cadena no vacía
- `declared_at`: hora ISO 8601 UTC (se normaliza a `Z` al cargar)
- `aliases` contiene **al menos una** entrada: no se puede cargar una lista vacía
- Cada `team_id` es *kebab-case* (`ud-ourense`, `rc-celta-b`, etc.) y **debe existir en el calendario** (tabla `teams`)
- Cada `alias` es la grafía exacta tal cual la escribe la fuente, cadena no vacía
- **Dos entradas cuya forma normalizada colisione se rechazan** (normalización: trim, colapso de espacios internos, NFC). Ejemplo: «UD Ourense» y «UD  Ourense» (doble espacio) son una colisión
- Un mismo equipo puede tener muchas entradas (p. ej. «Ourense» y «UD Ourense» para `ud-ourense`); una misma grafía, solo una

Mayúsculas y acentos son significativos: si la fuente escribe «CELTA B» y «Celta B», son dos entradas diferentes.

## Carga

Con el fichero validado y listo:

```bash
DATABASE_URL=postgresql://… npm run alias:cargar -- alias/2026-27/ceroacero.json
```

**Requisitos:**
- `DATABASE_URL` apunta a la base de datos objetivo (producción o test)
- Base ya migrada (`npm run db:migrate` debe salir con `schema is up to date`)
- `migrations/0004` aplicada (tabla `alias_loads` y sistema de auditoría)
- Todos los `team_id` en el fichero existen en `teams` (tabla `teams` debe tener los equipos del calendario)
- Permisos de escritura en las tablas `team_aliases` y `alias_loads`

**Comportamiento: reemplazo transaccional**

La carga **reemplaza el catálogo entero** de esa `(source, season)`:

1. Valida el fichero entero con el esquema antes de tocar la base
2. En una transacción:
   - Borra todas las filas de `team_aliases` para ese `(source, season)` (sea cual sea su estado)
   - Inserta exactamente las del fichero, todas como `confirmed`, con `confirmed_by = declared_by` y `confirmed_at = declared_at` (normalizado a `Z`)
   - Un `team_id` que no exista en `teams` rechaza la carga entera, nombrándolo
3. Las filas de **otras fuentes u otras temporadas no se tocan**
4. Inserta una fila en `alias_loads` (auditoría append-only): `source`, `season`, `declared_by`, `declared_at`, `loaded_at` (hora UTC del servidor), `file_digest` (SHA256 del fichero), `aliases_count`, `inserted`, `removed`

**Salida esperada (éxito):**
```
inserted: N / updated: M / removed: K / aliases: A / load id: L
```

- `inserted`: nuevas entradas
- `updated`: entradas que cambiaron (mismo `(source, season, alias)` con distinto `team_id`)
- `removed`: entradas que estaban en la base para ese `(source, season)` y no vienen en el nuevo fichero
- `aliases`: total de entradas cargadas
- `load id`: identificador único de esta carga en `alias_loads`

**Errores:**

- Si el fichero no valida (esquema, colisión de formato normalizado, `team_id` no *kebab-case*), **sale sin abrir conexión**: `exit 1`, mensaje de la entrada y campo.
- Si un `team_id` no existe en `teams`, **sale con `exit 1`**, nombrándolo.
- Si la base rechaza (restricción única violada), **sale con `exit 1`** y mensaje de la base, sin escribir nada (`alias_loads` vacío para esa carga).

Si cualquier paso falla, **nada queda escrito**, ni la fila de carga.

## Retomar después de fallo

La tabla `alias_loads` es *append-only* y registra cada intento:

```sql
SELECT * FROM alias_loads 
WHERE source = 'ceroacero' AND season = '2026/27'
ORDER BY loaded_at DESC LIMIT 1;
```

- `inserted`, `updated`, `removed`: qué hizo la última carga que tuvo éxito
- `file_digest`: hash SHA256 del fichero; si cambia sin recargar, se detecta

Para forzar una recarga del mismo fichero (ej. después de correcciones en la base):

1. Corregir el fichero o la base según sea
2. Volver a ejecutar el comando; si el fichero es idéntico y está en la base, `inserted=0 / updated=0 / removed=0`
3. Si cambió el fichero, `inserted`, `updated` o `removed` serán distintos de cero

## Auditoría

Toda la información de quién cargó qué y cuándo vive en `alias_loads`:

- `source`, `season`: identificación única de la carga
- `declared_by`: operador que declaró el catálogo (del fichero)
- `declared_at`: hora declarada de la lectura de la fuente (del fichero, ISO 8601 normalizado a `Z`)
- `loaded_at`: hora UTC de la carga en la base (reloj del servidor)
- `file_digest`: SHA256 del fichero, permite detectar cambios sin recargar
- `aliases_count`: número de entradas cargadas
- `inserted`, `updated`, `removed`: cambios en esa pasada

Por qué el catálogo **reemplaza y no «reporta huérfanos»** como el calendario: un alias no es un hecho con historia colgando (nada le apunta por clave ajena), es **enrutado vigente**, y un alias confirmado que sobra seguiría enrutando observaciones al partido equivocado mientras exista (ADR-018). La auditoría no se pierde: filas vigentes con `confirmed_by`, registro de cargas con digest, e historial de git del fichero.

## Ejemplo: cargar el catálogo real de ceroacero

El operador escribe manualmente el fichero de los 36 equipos de ceroacero con las grafías que la fuente usa, declarándose a sí mismo:

```bash
# Crear el directorio si no existe
mkdir -p alias/2026-27

# El fichero contiene los 36 equipos con sus grafías
cat > alias/2026-27/ceroacero.json << 'ALIASES'
{
  "source": "ceroacero",
  "season": "2026/27",
  "declared_by": "Alberto Fojo",
  "declared_at": "2026-09-05T10:00:00Z",
  "source_note": "Grafías de ceroacero.es, lidas a mano el 2026-09-05",
  "aliases": [
    { "alias": "Ourense", "team_id": "ud-ourense" },
    { "alias": "UD Ourense", "team_id": "ud-ourense" },
    …
  ]
}
ALIASES

# Cargar en la base
DATABASE_URL=postgresql://user:pass@host/db npm run alias:cargar -- alias/2026-27/ceroacero.json
```

Si sale con error:
- Revisar que todos los `team_id` existen en el calendario
- Revisar que no hay dos aliases cuya forma normalizada colisione
- Revisar que `season` es `YYYY/YY` (no `YYYY-YY`)
- Si el error viene de la base, ver `alias_loads` para inspeccionar la última carga

Una vez OK, la identidad de partidos se resuelve automáticamente: el resolver de SPEC-011 usa este catálogo confirmado para mapear las filas de `ceroacero.es` a `TeamId`.
