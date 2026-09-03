# Declaración de una jornada de medición

Procedimiento para declarar una jornada de medición en la lista cerrada y versionada de `src/ingest/measurement.ts`. Una jornada de medición es un intervalo `[from, to)` sobre `kickoff`s de partidos, fuera del cual el cron de ingesta no solicita datos a ninguna fuente (ADR-019 §3, ADR-020 §1). El despliegue es estructuralmente incapaz de sondear fuera de esas jornadas declaradas.

## Paso previo: dos precondiciones sin las que no se declara

Antes de escribir la entrada en la lista de `src/ingest/measurement.ts`, **ambas** precondiciones deben estar cumplidas y escritas. Una jornada sin ellas **no se declara**.

### 1. Dictamen de `sdd-legal-datos` sobre el régimen de la jornada

La primera jornada real requiere un dictamen de `sdd-legal-datos` sobre si `ceroacero.es` permite capturar una jornada entera en régimen de medición (ADR-020 §3, SPEC-008 notas §7). Este es un **bloqueo permanente**: una jornada real de verdad no se escribe sin él.

Para jornadas posteriores de la misma competición y temporada: si el régimen no cambió respecto a la jornada anterior, el dictamen previo sigue siendo válido; si cambió (p. ej., división de grupos, cambio de formato), se pide uno nuevo.

**Dónde escribirlo:** en el ledger de la spec que gobierna la medición (hoy `SPEC-012` en sus enmiendas, o el de la épica EPIC-002 si se extiende a futuro) antes de la entrada de jornada.

### 2. Fecha de purga escrita de antemano

**La fecha de purga se escribe en la lista de `src/ingest/measurement.ts` junto a la entrada de la jornada**, como parte de la misma entrada (ver *Formato* abajo). Esta fecha es la del fin de la retención automática (ADR-020 §2):

- **30 días desde el fin de la ventana de medición** (el `to` del intervalo declarado)
- **Una prórroga escrita y motivada en el ledger de esta spec** antes de que expire el plazo original
- **Techo duro de 90 días desde el `to`**

**Sin acuse de purga anterior, no se declara la jornada siguiente.** Ver *Purga manual* abajo.

## Formato de `src/ingest/measurement.ts`

La lista vive en `src/ingest/measurement.ts` bajo la exportación `MEASUREMENT_WINDOWS`. Ejemplo:

```typescript
export const MEASUREMENT_WINDOWS = [
  {
    from: "2026-09-14T14:00:00Z",
    to: "2026-09-15T23:59:59Z",
    reason: "Jornada 1 de Preferente Futgal, 2026-27, medida 2026-09-15",
    purgue_at: "2026-10-15T23:59:59Z"  // 30 días desde el `to`
  },
  {
    from: "2026-09-21T14:00:00Z",
    to: "2026-09-22T23:59:59Z",
    reason: "Jornada 2 de Preferente Futgal, 2026-27, medida 2026-09-22",
    purgue_at: "2026-10-22T23:59:59Z"
  }
] as const;
```

**Validación (aplicada en la compilación de TypeScript):**
- `from` y `to` son cadenas ISO 8601 UTC (z mayúscula normalizadas a `Z`)
- `from < to` (el intervalo no es vacío)
- `reason` es una cadena no vacía con el contexto humano: jornada, competición, temporada, fecha de medición
- `purgue_at` es cadena ISO 8601 UTC, ≥ `to + 30 días` y < `to + 90 días`
- **Ninguna entrada de la lista se borra ni se edita**: el cron registra todos los intentos, y reescribir una jornada pasada reescribe la historia. Se añaden nuevas entradas; las viejas quedan de auditoría.

## Cómo declara el operador una jornada

Con el dictamen y la fecha de purga listos:

### 1. Escribir la entrada en `src/ingest/measurement.ts`

Editar `src/ingest/measurement.ts` y añadir una entrada a `MEASUREMENT_WINDOWS` con:
- `from`: kickoff del primer partido de la jornada (hora UTC exacta)
- `to`: kickoff del último partido de la jornada + 1 segundo (o fin del día si la jornada es de un solo día)
- `reason`: texto que documente la jornada, competición, temporada y fecha de medición
- `purgue_at`: fin de retención = `to + 30 días`

Ejemplo real (Preferente Futgal, temporada 2026-27, jornada 1):

```typescript
{
  from: "2026-09-14T14:00:00Z",  // Hora del primer partido
  to: "2026-09-15T23:59:59Z",     // Fin de la ventana (sábado y domingo)
  reason: "Jornada 1 de Preferente Futgal, 2026-27, medida 2026-09-15",
  purgue_at: "2026-10-15T23:59:59Z"  // 30 días exactos
}
```

**En el ledger de esta spec:** Anotar la nueva jornada declarada con fecha exacta, dictamen citado, y referencia al commit.

### 2. Verificar que `CRON_SECRET` existe en Vercel

Antes de desplegar, comprobar que la variable de entorno `CRON_SECRET` está configurada en el proyecto de Vercel. Sin ella, el cron responderá 401 a todas las invocaciones de Vercel Cron y **no ejecutará ningún trabajo** (fallo cerrado deliberado, CA-7). Vercel no notifica de secretos faltantes en el despliegue; el primer tick fallará silenciosamente en 401.

Para configurarla:

```bash
# En la web de Vercel > Proyecto > Settings > Environment Variables
# Añadir: CRON_SECRET = <valor secreto aleatorio de al menos 32 caracteres>
```

El secreto se usa en la ruta `src/app/api/cron/ingest/route.ts` como `Authorization: Bearer ${process.env.CRON_SECRET}`.

### 3. Desplegar

```bash
git add src/ingest/measurement.ts
git commit -m "docs(EPIC-002): jornada N declarada, purgue_at YYYY-MM-DD"
git push origin [rama]
```

El CI ejecutará `npm run lint` y `npm run test` (gates de calidad, ADR-007). Una vez en `main`, Vercel despliega automáticamente y Vercel Cron comienza a invocar el endpoint cada minuto.

**El cron ya está corriendo.** La primera ejecución ocurre en el próximo minuto exacto (límite de granularidad de Vercel Cron).

## Retención del archivo de la jornada

### Plazo: 30 + prórroga + techo de 90 días desde el `to`

Cada jornada guarda bytes reales en Blob (~50–150 MB por jornada, estimado): páginas de competiciones, `robots.txt` de fuentes, y registros de intentos en `ingest_attempts`.

**El plazo de retención** es:
- **30 días desde el fin de la ventana** (`to` del intervalo) — cubre recalibración de extractores y replay de la jornada con parsers corregidos
- **Una prórroga escrita y motivada**, antes de que expire el plazo original, en el ledger de esta spec — permite extender si faltan verificaciones
- **Techo duro de 90 días desde el `to`** — ninguna prórroga se extiende más allá

Esto es exactamente el régimen B de ADR-009 §2, aplicado a la jornada como unidad en vez de a la ventana de una hora de EPIC-001.

### Purga manual con ceremonia (ADR-009 §4, ADR-020 §3)

La purga **la ejecuta el operador** en tres pasos, en Blob de producción:

#### Paso 1: Escribir la fecha de purga ANTES de correr la jornada

Ya está hecha: la fecha de purga va en `src/ingest/measurement.ts` junto a la entrada de la jornada.

#### Paso 2: Anotar en el ledger de esta spec ANTES de purgar

Cuando se acerque la fecha de purga (día `to + 30` o con prórroga, día de expiración):

```markdown
## Purga — jornada N (fecha real): borrados P prefijos, K claves

Jornada: [from, to) de [reason]
Purgue_at: YYYY-MM-DD
Prefijos purgados: `objects/ceroacero/preferent-futgal/YYYY-MM-DD/`, `meta/ceroacero/preferent-futgal/YYYY-MM-DD/`
Claves borradas: N
Acusado por: [operador]
Fecha real de purga: YYYY-MM-DDTHH:MM:SSZ
```

**La purga solo se ejecuta con este acuse escrito.** Sin él, la siguiente jornada **no se declara**.

#### Paso 2 bis: los prefijos que la purga borra, y son TRES familias

**Escrito el 2026-09-03 (SPEC-017 CA-3.8). Hasta hoy esta ceremonia solo
nombraba el archivo de las fuentes automáticas, y las dos vías humanas
dependían de que alguien se acordase de un prefijo que no estaba escrito en
ninguna parte.** La purga no tiene ejecutor automático (ADR-009 §4), así que un
prefijo que no está aquí **sobrevive a su jornada sin que ningún test se ponga
rojo**.

Una jornada de medición deja archivo bajo **tres** familias de prefijo, y las
tres se purgan con ella:

| Prefijo | Qué guarda | Ancla de retención |
|---|---|---|
| `<fuente>/<competition_id>/<día>/` — hoy `ceroacero/…` | Las respuestas crudas de las fuentes automáticas (RN-10), con sus dos raíces `objects/` y `meta/`. | ADR-020 §2 |
| **`corresponsal/`** | Los mensajes, las propuestas del modelo y las confirmaciones del bot del corresponsal (SPEC-015). Su segundo segmento es el **tipo de evento** —`mensaxe`, `proposta`, `confirmacion`—, no un `competition_id`: **un solo prefijo para la purga**, y es la irregularidad que ADR-023 §2 declara. | ADR-023 §2, ADR-020 §2 |
| **`operador/`** | Los objetos crudos de cada acción del panel del operador (SPEC-017). Su segundo segmento es el **tipo de acción** —`correccion`, `estado`, `ratificacion`, `acuse`—, por el mismo motivo y con la misma irregularidad declarada (ADR-024 §6). | ADR-024 §6, ADR-020 §2 |

**Las dos familias humanas son las que llevan texto escrito por una persona** —el
mensaje del corresponsal y el motivo del operador—, así que son justo las que
peor envejecen si sobreviven a su jornada. Los `Observation` persisten con su
`raw_ref` apuntando a un objeto borrado, que es estado legítimo declarado
(ADR-020 §4).

#### Paso 3: Ejecutar la purga en Blob

Con la `@vercel/blob` instalada localmente y credenciales de Blob:

```bash
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_…" node << 'PURGE'
import { del } from '@vercel/blob';

// LAS TRES FAMILIAS DEL PASO 2 bis, cada una con sus dos raíces.
const prefixes = [
  "objects/ceroacero/preferent-futgal/2026-09-14/",
  "meta/ceroacero/preferent-futgal/2026-09-14/",
  // El archivo del bot del corresponsal (SPEC-015, ADR-023 §2).
  "objects/corresponsal/",
  "meta/corresponsal/",
  // El archivo del panel del operador (SPEC-017, ADR-024 §6).
  "objects/operador/",
  "meta/operador/",
];

let purged = 0;
for (const prefix of prefixes) {
  const deleted = await del([{ prefix }]);
  purged += deleted.deleted.length;
}

console.log(`Purgadas ${purged} claves`);
console.log(`Prefijos: ${prefixes.join(", ")}`);
PURGE
```

**Las dos familias humanas se purgan ENTERAS y no por día**, y hay que saber por
qué: sus claves llevan el tipo de evento donde toda fuente automática lleva un
`competition_id`, así que el prefijo no tiene un día por el que cortar más
arriba. Mientras haya **una** jornada declarada a la vez —que es el régimen que
ADR-019 §3 entrega— purgar la familia entera y purgar la jornada son lo mismo.
El día que haya dos jornadas vivas a la vez, esto hay que estrecharlo por día
dentro de la clave.

Registrar la salida real de claves borradas en el ledger (paso 2).

**Se firma sabiendo lo que ADR-009 §4 firmó:** la ceremonia es la red, y el operador en el bucle es la razón de que se acepte aquí y no se aceptaría en producción.

## Nota sobre observaciones colgantes

Cuando se purga el archivo de una jornada, sus `Observation` persisten en la base de datos pero su `raw_ref` **apunta a un objeto borrado** (ADR-020 §4). Esto es un estado legítimo, no un error:

- El `raw_ref` sigue siendo **verificable contra una copia** (contiene el digest)
- El `raw_ref` deja de ser **recuperable**
- **Ningún código puede tratar un acceso fallido como corrupción.** Quien necesite los bytes está fuera del plazo de retención, y esa es la respuesta.

El motor (spec siguiente) hereda esto como dato de partida: decide sobre `Observation`, no sobre bytes, y no exige al archivo nada en caliente.

## Ejemplo: declarar jornada 1 de Preferente Futgal 2026-27

### Precondiciones

1. **Dictamen de `sdd-legal-datos`.** Ya recibido: `ceroacero.es` permite captura de jornada completa en régimen de medición, con auditoría de intentos y archivos (art. 4 TDM, art. 5.1.e).

2. **Fecha de purga.** Jornada jugada 2026-09-14 y 2026-09-15 (sábado y domingo). Fin de ventana (`to`): 2026-09-15T23:59:59Z. Purga automática el 2026-10-15T23:59:59Z (30 días exactos).

### Ejecución

#### 1. Editar `src/ingest/measurement.ts`

```typescript
export const MEASUREMENT_WINDOWS = [
  {
    from: "2026-09-14T14:00:00Z",
    to: "2026-09-15T23:59:59Z",
    reason: "Jornada 1 de Preferente Futgal, 2026-27, medida 2026-09-15 por SPEC-012",
    purgue_at: "2026-10-15T23:59:59Z"
  }
] as const;
```

#### 2. Anotar en el ledger de SPEC-012

```markdown
## Declaración — Jornada 1 de Preferente Futgal 2026-27

**Dictamen:** sdd-legal-datos confirmó permiso de `ceroacero.es`, 2026-09-02.
**Intervalo:** 2026-09-14T14:00:00Z a 2026-09-15T23:59:59Z (sábado-domingo).
**Purga:** 2026-10-15T23:59:59Z (30 días desde fin de ventana).
**Declarado por:** Alberto Fojo, 2026-09-15.
**Commit:** abc1234
```

#### 3. Verificar `CRON_SECRET` en Vercel

```bash
# Consultar Settings > Environment Variables en la web de Vercel
# Confirmar que CRON_SECRET está presente
```

#### 4. Desplegar y observar

```bash
git add src/ingest/measurement.ts docs/epicas/EPIC-002-…/SPEC-012-….ledger.md
git commit -m "docs(SPEC-012): jornada 1 de Preferente Futgal 2026-27 declarada, purgue_at 2026-10-15"
git push origin ft/SPEC-012-…
```

Desde ese minuto, el cron invocará `/api/cron/ingest` cada minuto y registrará intentos en `ingest_attempts` para todos los partidos dentro del intervalo.

#### 5. Purga (30 días después)

El 2026-10-15 o antes (si hay prórroga motivada en el ledger):

```markdown
## Purga — Jornada 1

**Intervalo:** 2026-09-14 / 2026-09-15.
**Prefijos:** `objects/ceroacero/preferent-futgal/2026-09-14/`, `objects/ceroacero/preferent-futgal/2026-09-15/`, `meta/ceroacero/preferent-futgal/2026-09-14/`, `meta/ceroacero/preferent-futgal/2026-09-15/`.
**Claves borradas:** 187.
**Purgado por:** Alberto Fojo.
**Fecha real:** 2026-10-15T16:30:00Z.
```

Con este acuse escrito, la jornada 2 puede ser declarada.
