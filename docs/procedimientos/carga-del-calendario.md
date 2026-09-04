# Carga del calendario declarado

Procedimiento para cargar el calendario de una competición y temporada en Postgres.

## Regla dura: de dónde NO se saca el calendario

**El calendario declarado no se deriva de ninguna fuente rastreada, ni a mano ni
con un LLM sobre su HTML.** Es dictamen vinculante de `sdd-legal-datos`
(SPEC-018 CA-3.8, ADR-027 §6.1) y **es la mejor pieza defensiva que tiene este
proyecto ahora que publica**: la selección, el orden y los nombres son
**nuestros**, y lo que se toma de un tercero se reduce a **un campo volátil por
partido**. Un fichero escrito a mano y uno derivado del HTML de la fuente **son
el mismo fichero** una vez cargados: **nada en el código lo protege y esta línea
es lo único que hay.**

**Y con la precisión que importa, porque la lectura mala es la que perjudica:**
lo prohibido es derivarlo **de la fuente rastreada**. Una persona que consulta
con su navegador el calendario publicado por la RFGF y **lo teclea** no incumple
nada —**RN-11 gobierna la petición automatizada, no la lectura humana**— y es
además la mejor posición defensiva disponible.

## La parada de emergencia: parar es vaciar `MEASUREMENT_WINDOWS`

**Si ZOS, Lda. o la RFGF piden que se pare, se para primero y se dictamina
después. Y parar es vaciar la lista de `src/ingest/measurement.ts`** (SPEC-018
CA-3.9, ADR-027 §3.b). Con la lista vacía:

- **el cron no pide nada** a ningún tercero (SPEC-012), y
- **el marcador sirve lista vacía con cero consultas** y dice por qué está
  apagado (SPEC-018 CA-3.2).

**No hay que tocar una línea de lógica.** Está escrito aquí porque **el día que
haga falta nadie va a leer un ADR**, y porque el botón ya existe y nadie lo
sabrá si no está en el runbook. **En la duda, se para.**

## Paso previo: dictamen de dominio

Antes de la primera carga real, `sdd-competicion` debe confirmar:

1. **Nombres canónicos.** Los 36 equipos en el fichero tienen nombre canónico de la RFGF (verificar en `docs/fundacion/dominio.md`).
2. **Estructura.** Un equipo juega como mucho un partido por jornada (RN-04 lo prohíbe en las reglas, pero el cargador es la única defensa en la base).

Sin estos dictámenes, no se carga.

## Formato del fichero

El fichero vive en `calendario/<temporada>/<competition_id>.json` y debe validar contra el esquema `ScheduleSchema` de `src/calendar/schedule.ts`. Ejemplo:

```json
{
  "competition": { "id": "futgal-preferente-g1", "name": "Preferente Futgal", "season": "2026/27", "group": "1" },
  "timezone": "Europe/Madrid",
  "declared_by": "Alberto Fojo",
  "declared_at": "2026-09-02T10:00:00Z",
  "source_note": "Calendario público da RFGF, lido a man o 2026-09-02",
  "teams": [
    { "id": "ud-ourense", "canonical_name": "UD Ourense" },
    { "id": "rc-celta-b", "canonical_name": "RC Celta B" }
  ],
  "rounds": [
    {
      "round": 1,
      "matches": [
        { "home_id": "ud-ourense", "away_id": "rc-celta-b", "kickoff": "2026-09-06 17:00", "venue": "O Couto" }
      ]
    }
  ]
}
```

**Validación:**
- `season` en forma RFGF: `YYYY/YY`
- `timezone`: solo `Europe/Madrid` (lista cerrada)
- `kickoff` en forma local: `YYYY-MM-DD HH:MM` (se convierte a UTC en la carga)
- `teams` único por competición (la segunda carga puede renombrar si cambia el nombre canónico)
- `declared_by` y `declared_at` quedan registrados en la auditoría (`calendar_loads`)

## Carga

Con el fichero validado y listo:

```bash
DATABASE_URL=postgresql://… npm run calendario:cargar -- calendario/2026-27/futgal-preferente-g1.json
```

**Requisitos:**
- `DATABASE_URL` apunta a la base de datos objetivo (producción o test)
- Base ya migrada (`npm run db:migrate` debe salir con `schema is up to date`)
- Permisos de escritura en las tablas `competitions`, `teams`, `matches`, `calendar_loads`

**Salida esperada (éxito):**
```
inserted: N / updated: M / orphans: K / teams inserted: T / load id: L
```

- `inserted`: partidos nuevos
- `updated`: partidos cuyo `kickoff` o `venue` cambió; el `id` no cambia
- `orphans`: partidos que estaban en la base y no están en el nuevo fichero, pero siguen ahí (nunca se borran)
- `teams inserted`: equipos que no existían
- `load id`: identificador único de esta carga en `calendar_loads`

**Errores:**

- Si el fichero no valida (schema, hora inexistente o ambigua), **sale sin abrir conexión**: `exit 1`, mensaje de fila y campo.
- Si la base rechaza (equipos renombrados de forma incoherente, restricción única violada), **sale con `exit 1`** y mensaje de la base, sin escribir nada (`calendar_loads` vacío para esa carga).

## Retomar después de fallo

La tabla `calendar_loads` es append-only y registra cada intento:

```sql
SELECT * FROM calendar_loads ORDER BY loaded_at DESC LIMIT 1;
```

- `inserted`, `updated`, `orphans`: qué hizo la última carga que tuvo éxito
- `file_digest`: hash SHA256 del fichero; si cambia sin recargar, `calendar_loads.file_digest` lo detecta

Para forzar una recarga del mismo fichero (ej. después de correcciones en la base):

1. Corregir el fichero o la base según sea
2. Volver a ejecutar el comando; si el fichero es idéntico y está en la base, `inserted=0 / updated=0`
3. Si cambió el fichero, `updated` o `inserted` serán distintos de cero

## Auditoría

Toda la información de quién cargó qué y cuándo vive en `calendar_loads`:

- `competition_id`, `season`: identificación única de la carga
- `declared_by`: operador que declaró el calendario
- `declared_at`: hora declarada de lectura del calendario oficial
- `loaded_at`: hora UTC de la carga en la base (reloj del servidor)
- `file_digest`: SHA256 del fichero, permite detectar cambios sin recargar
- `rounds`, `matches_count`: lo que se cargó
- `inserted`, `updated`: lo que cambió en esa pasada

## Cuando cambia la hora (finales de octubre)

**Los horarios cambian en bloque con el paso a horario de invierno**
(`sdd-competicion` T7, ADR-027 §Consecuencias negativas): los campos sin
iluminación homologada —mayoría en Preferente— adelantan sus horas y **el
calendario declarado se recarga casi entero**.

Consecuencia que hay que mirar ese fin de semana: **cualquier caché servirá
horas viejas**, y quien llegue tarde al campo culpará al marcador. La caché del
marcador es corta y compartida (10 s, `src/api/freshness.ts`), así que se pasa
sola; lo que no se pasa solo es **el calendario sin recargar**.

**Disparador: el cambio de hora.** Recargar el fichero de cada competición
afectada y comprobar en el marcador que las horas servidas son las nuevas.
