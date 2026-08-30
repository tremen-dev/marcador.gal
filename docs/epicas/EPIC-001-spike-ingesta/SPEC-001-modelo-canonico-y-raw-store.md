---
id: SPEC-001
tipo: spec
epica: EPIC-001
estado: hecho
aprobada-por: Alberto Fojo
historial:
  - {estado: borrador, fecha: 2026-08-29, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-08-29, por: Alberto Fojo}
  - {estado: en-progreso, fecha: 2026-08-29, por: sdd-implementador}
  - {estado: en-revision, fecha: 2026-08-29, por: sdd-verificador}
  - {estado: hecho, fecha: 2026-08-29, por: sdd-verificador}
---
# SPEC-001 — Modelo canónico y raw store

## Problema

EPIC-001 tiene que producir cuatro cifras (latencia, cobertura, conflictos,
operación) cruzando `Observation` y `Decision`. Hoy no existe ni una cosa ni la
otra: no hay dónde escribir lo que dice una fuente, ni dónde escribir lo que
publicamos, ni dónde guardar la respuesta cruda que RN-10 exige guardar **antes**
de parsearla.

Todo lo demás de la épica —adaptadores, cron, motor, snapshot, panel— se apoya en
esta pieza. Y el propio `_epica.md` dice que el modelo canónico y el raw store
son de lo poco que **no se tira** al pasar a producción. Es decir: es la parte
del spike que más barato es hacer bien y más cara es rehacer.

El riesgo real no es que el modelo esté incompleto. Es que los invariantes que
sostienen el proyecto (D-3, D-5, D-6, RN-09, RN-10, RN-12, RN-13) queden como
convención documentada en vez de como restricción ejecutable. Una convención se
salta un sábado a las 18:00 con tres partidos sin datos y prisa. Un tipo que no
compila y un `CHECK` de Postgres que revienta el `INSERT`, no.

De ahí el criterio que gobierna esta spec: **cada invariante se hace imposible
antes que validable**, y en el nivel más duro disponible — primero el tipo de
TypeScript, después la restricción de Postgres, y solo si ninguno de los dos
llega, un test de comportamiento.

Reglas que esta spec debe hacer cumplir y verificar:

- **RN-10** — la respuesta cruda se guarda antes de parsearse. El **orden**
  importa y tiene que ser testeable, no prometido.
- **RN-12** — toda `Decision` registra `rule` y `supporting_observation_ids`.
- **RN-13** — las `Observation` son inmutables: ni `UPDATE` ni `DELETE`.
- **RN-09** — nunca se publica sobre un equipo sin alias **confirmado por una
  persona**. El modelo tiene que distinguir alias confirmado de propuesto.

## Usuarios / roles afectados

- **sdd-implementador** de las specs siguientes de EPIC-001 (adaptadores, motor,
  snapshot, panel, bot). Todas importan de aquí; ninguna define entidades
  propias.
- **Frontend** (snapshot y página mínima por polling): importa los tipos
  TypeScript derivados de los esquemas zod. Es la razón declarada de elegir Node
  en ADR-001, y esta spec es donde esa razón se cobra o se pierde.
- **sdd-verificador**: los CA de todas las specs posteriores citan estas
  entidades.
- **Operador humano del spike** (el autor): confirma alias (RN-09) y corrige
  desde el panel. Sus correcciones entran por el mismo modelo, sin puerta
  trasera (D-3 / RN-08).

## Criterios de aceptación

> Convención: los tests de tipo viven en `tests/types/*.test-d.ts` y se verifican
> con `npm run typecheck`. Se usa `// @ts-expect-error` porque **invierte la
> prueba**: si el invariante se rompe, la línea deja de dar error y `tsc` falla
> con *"Unused '@ts-expect-error' directive"*. Un test de tipo que se degrada en
> silencio no es un test.
>
> `tsconfig.json` debe tener `strict: true` y `exactOptionalPropertyTypes: true`;
> sin esto último varios CA de esta spec no muerden.

### Modelo canónico

- **CA-1** — *Los cinco esquemas existen y son la única fuente del tipo.*
  Dado el módulo `src/model/`, cuando se importa, entonces exporta los esquemas
  zod `CompetitionSchema`, `TeamSchema`, `TeamAliasSchema`, `MatchSchema`,
  `ObservationSchema` y `DecisionSchema`, y los tipos `Competition`, `Team`,
  `TeamAlias`, `Match`, `Observation`, `Decision` derivados **exclusivamente**
  con `z.infer`.
  **Test:** una tabla por entidad con (a) un fixture válido que `.parse()`
  acepta, y (b) para **cada** campo requerido, una copia del fixture sin ese
  campo que `.safeParse()` rechaza. Falla si alguien añade un campo requerido sin
  su caso, porque el caso (b) se genera recorriendo las claves del fixture, no a
  mano.

- **CA-2** — *Los tipos cruzan a frontend sin deformarse.*
  Dado cualquier valor parseado de las seis entidades, cuando se serializa con
  `JSON.stringify` y se vuelve a parsear con el mismo esquema, entonces el
  resultado es `deepEqual` al original.
  Y dado `src/app/_contract/model-client.tsx`, un componente marcado
  `'use client'` que importa los seis tipos con `import type` y construye un
  valor de cada uno, cuando se ejecuta `npm run typecheck`, entonces pasa.
  **Por qué es un CA y no un detalle:** ADR-001 eligió Node por este contrato
  compartido. Si no hay un test que lo demuestre, la decisión no tiene evidencia.

- **CA-3 (RN-12, nivel tipo)** — *Una `Decision` sin trazabilidad no compila.*
  Dado `tests/types/rn12.test-d.ts`, cuando se ejecuta `npm run typecheck`,
  entonces pasa, y el fichero contiene un `// @ts-expect-error` sobre cada uno
  de estos cuatro literales:
  1. una `Decision` sin `rule`;
  2. una `Decision` con `supporting_observation_ids: []`;
  3. una `Decision` con `rule: 'RN-99'`;
  4. una `Decision` cuyo `supporting_observation_ids` contiene un `MatchId` en
     lugar de un `ObservationId`.
  **Implica:** `rule` es `z.enum([...RN-01..RN-13])` no opcional;
  `supporting_observation_ids` es `.nonempty()` (tipo `[ObservationId, ...ObservationId[]]`,
  por lo que `[]` es error de compilación, no de validación); los identificadores
  llevan `.brand<'ObservationId'>()` y `.brand<'MatchId'>()`.
  El mismo fichero de casos se reutiliza en runtime: `DecisionSchema.safeParse`
  rechaza los cuatro.

- **CA-4 (RN-09, nivel tipo)** — *Un alias confirmado sin persona no compila.*
  Dado que `TeamAliasSchema` es una unión discriminada por `status`, cuando se
  ejecuta `npm run typecheck`, entonces `tests/types/rn09.test-d.ts` pasa con un
  `// @ts-expect-error` sobre:
  1. `{ status: 'confirmed', ... }` sin `confirmed_by`;
  2. `{ status: 'confirmed', ... }` sin `confirmed_at`;
  3. `{ status: 'proposed', ..., confirmed_by: 'alberto' }` (campo ajeno a la
     rama, que `exactOptionalPropertyTypes` + unión discriminada rechazan).
  Y `TeamAliasSchema.safeParse` rechaza además `{ status: 'confirmed',
  confirmed_by: '' }`: `confirmed_by` es `.min(1)`, porque una cadena vacía es
  exactamente la forma que toma "nadie lo confirmó".

- **CA-5 (RN-09, comportamiento)** — *Solo un alias confirmado resuelve.*
  Dada `resolveConfirmedAlias(catalog, { source, season, alias })`, entonces:
  1. alias `confirmed` para `(source, season)` → devuelve su `TeamId`;
  2. alias `proposed` para `(source, season)` → devuelve `null`;
  3. alias `confirmed` para otra `source` → `null`;
  4. alias `confirmed` para otra `season` → `null`;
  5. alias que difiere solo en espacios de sobra o en forma Unicode (NFD vs NFC)
     → resuelve (la normalización es `trim` + colapso de espacios internos +
     `normalize('NFC')`, y **nada más**);
  6. alias que difiere en mayúsculas/minúsculas, en puntuación o en acentos
     → `null`.
  El caso 6 es deliberado y es la parte que hay que mirar en el gate: ver
  *Notas para el gate humano*.
  La función no tiene rama que devuelva un `TeamId` a partir de un alias
  `proposed`; el test 2 falla si alguien la añade.

- **CA-6 (RN-13, nivel tipo y runtime)** — *Una `Observation` no se puede
  modificar.*
  Dado que `ObservationSchema` termina en `.readonly()`, entonces:
  1. `tests/types/rn13.test-d.ts` pasa `npm run typecheck` con
     `// @ts-expect-error` sobre `obs.home_score = 3` y sobre
     `obs.status = 'finished'`;
  2. en runtime, `expect(() => { (obs as any).home_score = 9 }).toThrow()` — el
     objeto sale congelado del `.parse()`;
  3. el puerto `ObservationStore` expone exactamente `append`, `getById` y
     `listByMatch`; `// @ts-expect-error` sobre `store.update(...)` y sobre
     `store.delete(...)` (no hay método que borrar: nunca existió).
  Lo mismo aplica a `DecisionSchema` y a `DecisionStore` (`append`, `getLatestByMatch`,
  `listByMatch`): dominio.md define `Decision` como log append-only.

- **CA-7 — Marcador y estado son coherentes por construcción.**
  Dado que `ObservationSchema` es una unión discriminada por `status`, entonces
  `.safeParse` acepta y rechaza así:
  | `status` | `home_score` / `away_score` | resultado |
  |---|---|---|
  | `live`, `finished`, `suspended` | enteros ≥ 0 | acepta |
  | `live`, `finished`, `suspended` | `null` o ausentes | **rechaza** |
  | `scheduled`, `postponed` | `null` | acepta |
  | `scheduled`, `postponed` | cualquier número | **rechaza** |
  | cualquiera | `-1` o `1.5` | **rechaza** |
  Y `tests/types/scores.test-d.ts` demuestra el estrechamiento: dentro de
  `if (obs.status === 'live')`, `obs.home_score` es `number` y no
  `number | null` — comprobado con un `// @ts-expect-error` sobre una asignación
  a `null`.
  `suspended` lleva marcador porque un partido suspendido en el minuto 60 tiene
  uno; `postponed` no, porque no se jugó.
  `confidence` es `z.number().min(0).max(1)`; rechaza `1.5` y `-0.1`.
  **Añadido por la enmienda 2026-08-29 §1 (nivel Postgres).** La tabla
  `observations` lleva además `CHECK` con la misma tabla de verdad —marcador no
  nulo si y solo si `status in ('live','finished','suspended')`— y `CHECK` de no
  negatividad. Estaba implementado sin estar especificado; queda especificado
  para que CA-7 y CA-18 sean el mismo criterio aplicado a las dos tablas, y para
  que el verificador tenga contra qué juzgarlo.

- **CA-8 — Los cualificadores de dominio.md son un tipo, y en galego.**
  Dado `src/model/qualifier.ts`, entonces exporta
  `type MatchQualifier = 'provisional' | 'confirmado' | 'pendente_de_confirmar' | 'sen_sinal'`.
  **Test:** un test de tipo comprueba que la unión tiene exactamente esos cuatro
  miembros (`Exclude<MatchQualifier, ...> extends never`), y un test de runtime
  comprueba que `MATCH_QUALIFIERS` (el array) coincide con las claves del bundle
  de i18n galego. Falla si alguien angliciza un valor a `pending_confirmation`.
  Los **identificadores** van en inglés (`MatchQualifier`); los **valores** son
  términos de dominio.md y no se traducen (CLAUDE.md §Lenguas, D-2).
  La derivación (qué cualificador corresponde a qué `Decision`) está **fuera de
  alcance**: ver esa sección.

### Raw store (RN-10, ADR-005)

- **CA-9 — El puerto tiene tres operaciones y una sola batería las prueba.**
  Dada la interfaz `RawStore` con `put(meta, body)`, `get(key)` y
  `list(prefix)`, y dado el fichero **único** `tests/raw/contract.ts` que exporta
  `rawStoreContract(nombre, crearStore)`, entonces se invoca dos veces —
  `DiskRawStore` sobre un directorio temporal y `BlobRawStore` sobre Vercel Blob —
  y ambas ejecuciones pasan los mismos casos:
  1. `put` y luego `get` devuelve **los mismos bytes**, incluido un cuerpo con un
     byte no válido en UTF-8 (el raw no es texto: es lo que devolvió la fuente);
  2. `get` de una clave inexistente devuelve `null`, no lanza;
  3. `list(prefix)` devuelve exactamente las claves con ese prefijo y ninguna
     más, incluida la trampa de un prefijo que es prefijo textual de otro
     (`futgal/preferente` no debe traer `futgal/preferente-b`);
  4. `list` de un espacio vacío devuelve `[]`;
  5. los metadatos vuelven `deepEqual` a los que se escribieron;
  6. `put` de **los mismos bytes** sobre una clave existente es idempotente y no
     falla; `put` de bytes **distintos** sobre una clave existente lanza
     `RawKeyConflictError` (el raw es un archivo, no un caché: RN-13 en espíritu);
  7. un cuerpo de 300 KB (el tamaño real de una respuesta, según ADR-005)
     va y vuelve intacto.
  **Verificación:** el CA no está satisfecho con la ejecución contra disco sola.
  El ledger tiene que llevar pegada la salida de la ejecución contra Vercel Blob
  real. Ver *Notas para el gate humano*.

- **CA-10 — La clave es determinista y no se puede escapar del store.**
  Dado `rawKey(meta, body)`, entonces:
  1. los mismos `meta` y `body` producen la misma clave, con el formato
     `<source>/<competition_id>/<YYYY-MM-DD>/<fetched_at ISO>-<sha256(body) primeros 12 hex>.<ext>`;
  2. cuerpos distintos con los mismos `meta` producen claves distintas;
  3. `get` y `list` rechazan, **en ambas implementaciones y antes de tocar
     E/S**, claves que contengan `..`, empiecen por `/`, contengan `\` o
     caracteres fuera de `[a-z0-9._/-]`, lanzando `InvalidRawKeyError`;
  4. tras intentar los casos del punto 3 contra `DiskRawStore`, no existe ningún
     fichero nuevo fuera de su directorio raíz (se comprueba listando el padre
     del raíz antes y después).
  **Nota para quien implemente:** `BlobRawStore` debe llamar a `put` con
  `addRandomSuffix: false`. Por defecto Vercel Blob añade un sufijo aleatorio al
  *pathname* y la clave devuelta deja de ser la calculada — con lo que los casos
  1 y 6 de CA-9 fallan solo en la implementación de Blob, que es justo la que no
  corre en local.

- **CA-11 (RN-10) — Guardar el crudo ocurre antes de parsear, y se puede probar.**
  Dada `captureThenParse(store, meta, body, parse)`, entonces:
  1. con un `RawStore` espía, `store.put` se registra **antes** de la primera
     llamada a `parse`;
  2. si `store.put` devuelve una promesa aún pendiente, `parse` **no** ha sido
     llamada (se comprueba tras agotar la cola de microtareas): el `await` es
     real, no un `void`;
  3. si `store.put` rechaza, `parse` **nunca** se llama y `captureThenParse`
     rechaza con ese mismo error — no hay parseo degradado ni "seguimos sin raw";
  4. `parse` recibe como segundo argumento el `RawRef` devuelto por `put`, de
     forma que la `Observation` que salga de ahí ya tiene su `raw_ref` y no puede
     inventárselo.
  Esta función es el **único** camino sancionado de una respuesta cruda a un
  parser. Las specs de adaptadores la usarán; que no exista otro camino es
  responsabilidad de sus CA, no de esta.

- **CA-12 (RN-10, modelo) — Ninguna `Observation` existe sin su crudo.**
  `Observation.raw_ref` es requerido, `.min(1)` y con el formato de clave de
  CA-10; `.safeParse` rechaza ausente, `null` y `''`. En Postgres la columna es
  `NOT NULL`. Aplica **también** a las observaciones del corresponsal de Telegram
  y a las correcciones del panel: ver *Notas para el gate humano*.

### Postgres y migración (ADR-006)

- **CA-13 — La migración levanta el esquema y es idempotente.**
  Dada una base de datos vacía, cuando se ejecuta `npm run db:migrate`, entonces
  existen las tablas `competitions`, `teams`, `team_aliases`, `matches`,
  `observations` y `decisions`, y `schema_migrations` contiene la fila `0001`.
  Cuando se ejecuta **por segunda vez**, entonces termina con éxito, no aplica
  nada y `schema_migrations` sigue con una sola fila.

- **CA-14 — El esquema y los esquemas zod no pueden separarse en silencio, y
  cada excepción se justifica de una en una.**
  *(Reescrito por la enmienda 2026-08-29 §2. Ver Historial de enmiendas.)*
  Dado el esquema aplicado, cuando un test consulta `information_schema.columns`
  para cada tabla, entonces el conjunto de nombres de columna es **igual** al
  conjunto de claves del esquema zod correspondiente —tomando la **unión** de las
  ramas cuando el esquema es una unión discriminada—, salvo las excepciones
  declaradas en el propio test como **dos mapas con motivo escrito**, nunca como
  listas de nombres sueltos:
  1. `dbOnly: Record<columna, motivo>` — columnas que existen solo en Postgres.
     Hoy, `created_at` en las seis tablas.
  2. `zodOnly: Record<clave, { table: string; reason: string }>` — claves del
     modelo canónico que **no** son una columna porque son una **relación
     materializada en su propia tabla**. Hoy la única entrada legítima es
     `Team.aliases → team_aliases`, que nace del refinamiento §1 de esta spec
     junto con CA-17.
  Y el test hace cumplir estas cuatro condiciones, que son las que convierten la
  excepción en un puente declarado y no en un agujero:
  1. **La excepción de zod tiene que señalar dónde vive el dato.** Para cada
     entrada de `zodOnly`, el test comprueba contra `information_schema` que la
     tabla declarada en `table` **existe** y que tiene una clave foránea hacia la
     tabla de la que se excluye la clave. Un campo que alguien olvidó migrar no
     tiene tabla a la que apuntar, así que no puede esconderse aquí: la única
     forma de silenciarlo sería inventarse una tabla y su FK, que es
     exactamente el trabajo que se estaba olvidando.
  2. **No hay excepciones muertas.** Toda entrada de `dbOnly` y de `zodOnly`
     tiene que ser *usada*: si la columna declarada en `dbOnly` ya no existe, o
     si la clave declarada en `zodOnly` ya no está en el esquema zod, el test
     **falla**. Una lista de excepciones que sobrevive al campo que la
     justificaba es la forma en que estas redes se pudren.
  3. **Sin motivo no hay excepción.** `motivo` y `reason` son cadenas con
     `.length > 0`; una entrada con el motivo vacío falla el test.
  4. **Las dos listas son cerradas.** Cualquier diferencia entre columnas y
     claves que no esté en uno de los dos mapas falla, sin nivel de aviso
     intermedio.
  Este es el test que falla el día que alguien añade un campo a `Observation` y
  se olvida de la migración, o al revés. La condición 1 es la que impide que ese
  mismo día alguien lo "arregle" metiendo el campo en `zodOnly`.
  **Si algún día aparece una relación legítima que no puede llevar FK**, se
  enmienda CA-14 explícitamente para admitirla; no se relaja la comprobación
  sobre la marcha.

- **CA-15 (RN-12, nivel Postgres) — La base de datos también sabe RN-12.**
  Dada la tabla `decisions`, entonces estos cuatro `INSERT` fallan y el quinto
  pasa:
  1. `rule` a `NULL` → viola `NOT NULL`;
  2. `rule = 'lo que sea'` → viola `CHECK (rule ~ '^RN-[0-9]{2}$')`;
  3. `supporting_observation_ids = '{}'` → viola
     `CHECK (cardinality(supporting_observation_ids) >= 1)`;
  4. `supporting_observation_ids` con un id que no existe en `observations`, **o**
     que existe pero pertenece a **otro** `match_id` → el trigger
     `decisions_supporting_observations_exist` lanza excepción;
  5. una `Decision` bien formada, con dos observaciones del mismo partido → se
     inserta.
  El caso 4 es el que justifica el trigger: un array no admite clave foránea, y
  sin él RN-12 se cumple "de mentira" (hay ids, pero pueden ser basura).
  Además, `UNIQUE (match_id, version)` y `CHECK (version >= 1)`.

- **CA-16 (RN-13, nivel Postgres) — El motor de la base rechaza la enmienda.**
  Dada una fila en `observations`, cuando se ejecuta
  `UPDATE observations SET home_score = 9 WHERE id = ...`, entonces lanza
  excepción; cuando se ejecuta `DELETE FROM observations WHERE id = ...`, entonces
  lanza excepción; y tras ambos intentos la fila sigue con su valor original
  (se relee y se compara).
  Lo mismo para `decisions`.
  `TRUNCATE observations, decisions CASCADE` **sí** funciona, porque `TRUNCATE`
  no dispara triggers de fila — y sin eso los propios tests no podrían limpiar.
  Hay un test explícito para esto, para que nadie "arregle" el trigger
  añadiéndole una variante `TRUNCATE`.

- **CA-17 (RN-09, nivel Postgres) — La base también exige la persona.**
  Dada la tabla `team_aliases`, entonces:
  1. `INSERT` con `status = 'confirmed'` y `confirmed_by IS NULL` falla
     (`CHECK`: `status <> 'confirmed' OR (confirmed_by IS NOT NULL AND confirmed_at IS NOT NULL)`);
  2. `INSERT` con `status = 'proposed'` y `confirmed_by` no nulo falla;
  3. `INSERT` de un segundo alias con el mismo `(alias, source, season)` falla
     (`UNIQUE`), porque un mismo texto de una misma fuente no puede apuntar a dos
     equipos;
  4. `INSERT` con `status` fuera de `('proposed','confirmed')` falla.
  Y en `matches`, `CHECK (home_id <> away_id)`.

### Coherencia de lo que publicamos (enmienda 2026-08-29)

- **CA-18 (D-6, simetría con CA-7) — Lo que se publica está protegido al menos
  tanto como lo que se observa.**
  Hoy la asimetría va al revés: `ObservationSchema` es una unión discriminada que
  hace imposible un marcador sin partido jugado, y `DecisionSchema` lleva
  `home_score` / `away_score` como `z.int().min(0).nullable()` sueltos, de modo
  que una `Decision` con `status: 'scheduled'` y marcador `5-3` parsea sin
  protestar. Es el agujero justo en la entidad que sale a pantalla.
  Dado que `DecisionSchema` pasa a ser una **unión discriminada por `status`**
  con exactamente las mismas cinco ramas y la misma regla de marcador que
  `ObservationSchema`, entonces:
  1. **Nivel tipo — no compila.** `tests/types/ca18.test-d.ts` pasa
     `npm run typecheck` con un `// @ts-expect-error` sobre cada uno de estos
     cuatro literales:
     a. una `Decision` con `status: 'scheduled'` y `home_score: 5`;
     b. una `Decision` con `status: 'postponed'` y `away_score: 0`;
     c. una `Decision` con `status: 'live'` y `home_score: null`;
     d. una `Decision` con `status: 'finished'` sin `home_score`.
     Y el mismo fichero demuestra el estrechamiento: dentro de
     `if (decision.status === 'live')`, `decision.home_score` es `number` y no
     `number | null`, comprobado con un `// @ts-expect-error` sobre una
     asignación a `null`.
  2. **Nivel zod — no parsea.** `DecisionSchema.safeParse` acepta y rechaza
     según la **misma** tabla de CA-7:
     | `status` | `home_score` / `away_score` | resultado |
     |---|---|---|
     | `live`, `finished`, `suspended` | enteros ≥ 0 | acepta |
     | `live`, `finished`, `suspended` | `null` o ausentes | **rechaza** |
     | `scheduled`, `postponed` | `null` | acepta |
     | `scheduled`, `postponed` | cualquier número | **rechaza** |
     | cualquiera | `-1` o `1.5` | **rechaza** |
     El test comparte la tabla de casos con el de CA-7 —un solo fichero de datos,
     dos esquemas— porque si un día divergen tiene que ser una decisión escrita y
     no un descuido de mantenimiento.
  3. **Nivel Postgres — no entra.** La tabla `decisions` lleva
     `constraint decisions_score_matches_status` con la misma forma que
     `observations_score_matches_status`, y `constraint
     decisions_scores_non_negative`. **Test:** cuatro `INSERT` que fallan
     (`scheduled` con marcador; `postponed` con marcador; `live` con marcador
     nulo; `finished` con `home_score = -1`) y dos que pasan (`live` 1-0 y
     `scheduled` con marcador nulo).
  **Por qué un CA nuevo y no una ampliación de CA-7:** CA-7 está implementado y
  cerrado en su mitad de tipos; reabrirlo dejaría el criterio a medio verificar
  en la matriz del ledger. CA-18 es un criterio con su propia fila, su propia
  evidencia y su propio nivel de Postgres, junto a CA-15..CA-17, que es donde
  vive el resto de la red de la base de datos.
  **Efecto sobre criterios ya escritos:** CA-1 (el fixture de `Decision` pasa a
  ser el de una rama), CA-2 (round-trip sobre la unión), CA-6 (`.readonly()` se
  aplica sobre la unión, como en `Observation`) y CA-14 (`schemaKeys` toma la
  unión de ramas, cosa que ya hace para `Observation` y `TeamAlias`) siguen
  cumpliéndose sin cambio de texto. La forma del cambio en `src/model/decision.ts`
  es la de `src/model/observation.ts`, no una nueva.
  Cierra F-SPEC-001-10.

- **CA-19 (RN-12, alcance de `rule`) — Una `Decision` solo puede citar una regla
  del motor.**
  Dado que `rule` pasa a ser `z.enum(['RN-01', … , 'RN-07'])` —siete miembros, no
  trece—, entonces:
  1. **Nivel tipo:** `tests/types/ca19.test-d.ts` pasa `npm run typecheck` con
     `// @ts-expect-error` sobre `rule: 'RN-13'` y sobre `rule: 'RN-99'`.
  2. **Nivel zod:** `DecisionSchema.safeParse` rechaza `'RN-08'` … `'RN-13'` y
     `'RN-99'`, y acepta las siete restantes. El test recorre
     `['RN-08','RN-09','RN-10','RN-11','RN-12','RN-13']` como tabla, para que
     añadir una RN nueva a `reglas.md` no lo deje a medias.
  3. **Nivel Postgres:** `constraint decisions_rule_shape` deja de ser
     `CHECK (rule ~ '^RN-[0-9]{2}$')` y pasa a ser
     `CHECK (rule in ('RN-01','RN-02','RN-03','RN-04','RN-05','RN-06','RN-07'))`.
     **Test:** `INSERT` con `rule = 'RN-13'` falla; con `rule = 'RN-06'` pasa.
     El caso `'RN-99'` de CA-15.2 sigue fallando, ahora por la lista y no por la
     forma.
  **No es una regla de negocio nueva; es leer el glosario.** `dominio.md` define
  `rule` como «la regla **del motor** (RN-xx) que produjo una Decision», y
  `reglas.md` separa por secciones RN-01..RN-07 («Motor de decisiones») de
  RN-08..RN-13 («Invariantes del proyecto»). Ninguna de las invariantes puede
  producir una `Decision`: RN-08 dice por dónde pasa, RN-09 y RN-10 dicen cuándo
  **no** se publica y qué se guarda antes, RN-11 es cortesía de red, y RN-12 y
  RN-13 hablan de la propia `Decision`. Una `Decision` con `rule: 'RN-13'` es
  trazabilidad de mentira: cumple CA-3 y no dice nada.
  Las decisiones originadas por una corrección humana del panel sí tienen regla
  del motor a la que apuntar: RN-04 («salvo que lo diga la fuente oficial o un
  humano») y RN-06 («`postponed` / `suspended` **solo** por fuente oficial o
  humano»). No hace falta ninguna RN de fuera del motor para ellas.
  **Constriñe la spec del motor**, y por eso va en criterio propio: si el gate
  prefiere mantener las trece, se retira CA-19 sin tocar CA-18 ni ningún otro
  criterio. Ver *Notas para el gate humano* §7.
  Cierra la segunda mitad de la pregunta de F-SPEC-001-10.

## Entidades y reglas afectadas

Fuentes de verdad, **referenciadas y no duplicadas**:

- `docs/fundacion/dominio.md` — `Competition`, `Team`, `Match`, `Observation`,
  `Decision`, `rule`, `raw store`; estados `scheduled` / `live` / `finished` /
  `postponed` / `suspended`; cualificadores *provisional*, *confirmado*,
  *pendente de confirmar*, *sen sinal*.
- `docs/fundacion/reglas.md` — RN-09, RN-10, RN-12, RN-13 (hechas cumplir aquí);
  RN-01..RN-08 y RN-11 (citadas, implementadas en otras specs).
- **ADR-001** — Node 22, TypeScript estricto, zod, vitest. Confirma aquí el punto
  que dejó abierto: el driver de Postgres es **`postgres.js`** (ya en
  `package.json`), no el driver serverless de Neon. Motivo: `postgres.js` es
  agnóstico del proveedor, y ADR-004 pide reevaluar la plataforma después del
  spike; atar el acceso a datos a Neon sería atarse antes de tiempo.
- **ADR-004** — sin proceso vivo, sin disco persistente, sin `LISTEN/NOTIFY`.
- **ADR-005** — `RawStore` como puerto con dos implementaciones y **una sola**
  batería de contrato.
- **ADR-006** (esta spec lo origina) — migraciones en SQL numerado, y tiempos
  como cadena ISO 8601 UTC en el modelo canónico.
- **FOUNDATION.md** — D-2 (galego, i18n), D-3 (el motor es la única puerta),
  D-5 (raw antes de parsear), D-6 (fiabilidad trazable).

Refinamientos que esta spec introduce sobre dominio.md, **sin contradecirlo**:

1. `Team.aliases[]` deja de ser una lista de cadenas y pasa a ser una lista de
   `TeamAlias`, unión discriminada `proposed` / `confirmed`, con
   `(alias, source, season)` como identidad. Es lo que exige RN-09: dominio.md ya
   dice "un LLM propone, una persona confirma", pero la tupla no dejaba sitio
   para el estado.
2. `Observation.raw_ref` es **obligatorio siempre**, sin excepción por fuente.
3. Los cualificadores no son campos nuevos: se **derivan** de
   `(status, provisional, tiempo desde la última observación)`. *pendente de
   confirmar* es `status = 'finished'` con `provisional = true`; *sen sinal* es
   `status = 'live'` sin observación reciente (RN-07). La `Decision` mantiene
   exactamente la tupla de dominio.md.

Estructura de ficheros propuesta:

```
src/model/     ids.ts competition.ts team.ts match.ts observation.ts
               decision.ts qualifier.ts index.ts
src/raw/       store.ts (puerto, rawKey, errores) disk.ts blob.ts capture.ts
src/db/        client.ts (postgres.js) migrate.ts ports.ts
migrations/    0001_canonical_model.sql
tests/model/ tests/raw/ tests/db/ tests/types/
tests/raw/contract.ts        la batería única de CA-9
tests/fixtures/raw/          HTML versionado para el replay (ADR-005)
raw/                         raíz de DiskRawStore en local; NO versionado
```

## Fuera de alcance

Aparcado a propósito:

- **Adaptadores de fuentes.** `captureThenParse` define el hueco donde encajan;
  no hay ni un selector de `cheerio` en esta spec.
- **Motor de decisiones (RN-01..RN-07).** Incluido el **mapa de pesos por
  fuente** de RN-01: aquí `confidence` es solo un número en [0,1] y `source` un
  identificador. Quién vale 0.9 y quién 0.7 lo decide la spec del motor, que es
  quien tiene que responder por ello.
- **La derivación del cualificador.** Esta spec define el tipo `MatchQualifier`
  (CA-8); la función que lo calcula necesita el umbral de 15 minutos de RN-07 y
  por tanto pertenece al motor o al snapshot.
- **Cron, ventanas de sondeo, calendario.** Spec propia.
- **API de snapshot, SSE, UI, panel de alertas, bot de Telegram.**
- **Repositorios completos.** Aquí solo se definen los puertos
  `ObservationStore` y `DecisionStore` con la superficie mínima que CA-6 exige;
  su implementación contra Postgres puede venir con la spec que primero los
  necesite.
- **Política de retención del raw store.** ADR-005 la deja abierta y avisa de que
  crece de forma monótona. No es un problema en una semana de spike; sí antes de
  producción.
- **Migraciones 0002 en adelante.**

- **La relación entre `provisional` y `status` en una `Decision`** (añadido por
  la enmienda 2026-08-29 §3). Se ha buscado y **no está en `reglas.md`**: RN-03
  define *provisional* solo sobre la publicación de un **marcador**, y no dice
  nada de una `Decision` sin marcador (`scheduled`, `postponed`). Fijar aquí
  «`provisional` es `false` cuando no hay marcador» sería inventarse una regla de
  negocio, así que `provisional` sigue siendo un `boolean` libre en las cinco
  ramas de CA-18. Los huecos concretos están descritos en *Notas para el gate
  humano* §8, y abiertos como salvedades en el ledger.

## Notas para el gate humano

Cinco cosas que conviene mirar con lupa antes de firmar, más una que no es de
esta spec pero se ha visto al escribirla.

**1. La normalización de alias es deliberadamente tacaña (CA-5, caso 6).**
Se resuelve por igualdad exacta tras `trim`, colapso de espacios y `NFC`. Nada
de ignorar mayúsculas, ni acentos, ni puntuación. Consecuencia: "Ourense CF",
"ourense cf" y "Ourense C.F." son **tres** aliases distintos y cada uno necesita
su confirmación humana. Es más trabajo manual, y el trabajo manual es una de las
cuatro métricas de la épica — así que esta decisión **empeora una cifra que
estamos midiendo**.
El motivo para elegirla igualmente: la alternativa —hacer *matching* laxo— hace
que el sistema empareje solo un alias que nadie confirmó, y eso es exactamente
lo que RN-09 y D-4 prohíben. Prefiero que el spike mida el coste real de RN-09
que enseñar una cifra bonita bajo una regla relajada a escondidas.
**Si el humano prefiere lo contrario**, la decisión es suya y es defendible; lo
que pido es que se tome explícitamente y se anote, no que se relaje después
cuando duela.

> **RESUELTO EN EL GATE (2026-08-29, Alberto Fojo).** Se mantiene la normalización
> tacaña. El spike mide el coste real de RN-09; si la métrica de operación se
> dispara por variantes ortográficas, ese dato es un resultado del spike y la
> relajación se decide entonces, con cifras y por ADR — no sobre la marcha.

**2. `raw_ref` obligatorio también para el corresponsal y para el panel (CA-12).**
dominio.md no dice si `raw_ref` admite nulo. Lo hago obligatorio para todas las
fuentes, lo que implica que **una corrección hecha a mano desde el panel escribe
antes su payload en el raw store**. Suena excesivo para un formulario. Lo
sostengo porque una corrección humana es la observación más consecuente del
sistema (RN-04 y RN-06 le dan poder de bajar un marcador y de aplazar un
partido), y porque la excepción convertiría el invariante en una unión
discriminada con una rama sin crudo — es decir, en algo que se puede saltar. Cero
excepciones es más fácil de verificar que una.

**3. Los CA-13 a CA-17 no se pueden verificar sin un Postgres de verdad, y CA-9
no se verifica del todo sin un Vercel Blob de verdad.**
Estos tests se saltan si faltan `DATABASE_URL_TEST` o `BLOB_READ_WRITE_TOKEN`, lo
que crea el peor fallo posible en un gate: una suite **verde porque no probó
nada**. Por eso lo digo aquí en vez de dejarlo al criterio del verificador:
**CA-9 y CA-13..CA-17 solo se dan por cumplidos con la salida del comando pegada
en el ledger**, mostrando los casos ejecutados y no saltados.

> **RESUELTO EN EL GATE (2026-08-29, Alberto Fojo).** La verificación corre contra
> una **rama de test de Neon**, desechable por ejecución, y contra un **store de
> Vercel Blob real**. Se verifica sobre el mismo motor que producción, no sobre un
> contenedor que puede diferir en el comportamiento de triggers o de `timestamptz`.
> `DATABASE_URL_TEST` y `BLOB_READ_WRITE_TOKEN` son requisito de la
> implementación, no opcionales: si faltan, los CA afectados están **incumplidos**,
> no saltados.

**4. Escribo un ADR que no me pidieron: ADR-006.**
Se me encargó "solo la spec". Al redactarla aparecieron dos decisiones que
constriñen todas las specs siguientes y que ningún ADR aprobado cubre: **cómo se
migra el esquema** (SQL numerado con runner mínimo, sin ORM) y **cómo se
representa el tiempo** (cadena ISO 8601 UTC, no `Date`, para que el mismo tipo
cruce a frontend por JSON sin deformarse). Mi contrato de rol dice que una
decisión que constriñe trabajo futuro va a ADR, no enterrada en una spec. Queda
en `borrador` para que se apruebe o se rechace junto con esta spec — y si se
prefiere que vivan dentro de la spec, se retira sin coste.
El driver (`postgres.js`) **no** va en ese ADR: ADR-001 dijo explícitamente "a
confirmar en la spec", así que se confirma aquí.

**5. Diecisiete CA es mucho para una spec.**
Es consciente: nueve de ellos son un mismo invariante probado en dos niveles (el
tipo y Postgres), porque el encargo pedía justamente que fuese imposible y no
solo validado. Si al gate le parece de más, el recorte natural y honesto es
renunciar a la capa de Postgres (CA-15, CA-16, CA-17) y quedarse con la de tipos,
no al revés: los triggers son la red que sigue puesta cuando alguien escribe SQL
a mano un sábado. Pero es una spec de andamio para un spike de una semana y ese
recorte es discutible.

**6. Fuera de esta spec, pero lo he visto: `CLAUDE.md` está desactualizado.**
Su sección **Stack** sigue diciendo "Python 3.12 · FastAPI · httpx · APScheduler ·
selectolax · python-telegram-bot · pydantic", y ADR-001 —aprobado— dice Node 22 +
TypeScript + Next.js + zod. Un fichero de instrucciones que contradice un ADR
aprobado es una trampa para el siguiente implementador. Su sección **Estructura**
tampoco contempla `src/model/`, `src/raw/`, `src/db/` ni `migrations/`, y coloca
"modelo canónico" dentro de `src/decide/` — cosa que ya no encaja, porque el
modelo lo importa el frontend y no debería colgar del motor.
No lo toco: no es mío ni es esta spec. Lo dejo señalado para que lo arregle quien
corresponda.

---

*Notas añadidas por la enmienda del 2026-08-29 (ver Historial de enmiendas).*

**7. CA-19 constriñe una spec que todavía no existe.**
Reducir `rule` a RN-01..RN-07 es, en mi lectura, lo que `dominio.md` ya dice
(«la regla **del motor**»). Pero el efecto práctico es que la spec del motor de
decisiones nace con el vocabulario cerrado: cuando llegue el caso raro que no
encaja en las siete, no podrá etiquetarlo con una RN de las otras, tendrá que
**añadir una RN nueva a `reglas.md`** — lo cual, dicho sea de paso, es lo que
quiero que pase, porque obliga a escribir la regla en vez de a reutilizar una
etiqueta que no la describe.
Lo que pido en el gate es que se mire eso concretamente. Si se prefiere dejar las
trece, CA-19 se retira entero y no arrastra nada: CA-18 no depende de él.

**8. Dos huecos de `reglas.md` que he encontrado y NO he rellenado.**
Se me pidió pensar si `provisional` interactúa con el estado. Sí interactúa, y la
respuesta honesta es que `reglas.md` no da el dato para fijarlo:

- **H-1 — RN-01 no da peso a una corrección hecha desde el panel.** La tabla de
  pesos cubre RFGF 1.0, API de pago 0.9, *corresponsal confirmado* 0.8, agregador
  0.7 y tuit de club 0.5. El **operador humano corrigiendo desde el panel** no
  está, y no es lo mismo que un corresponsal (uno envía, el otro arbitra). Sin
  ese número, RN-02 y RN-03 no pueden decir si una `Decision` originada en el
  panel sale *confirmado* o *provisional*. Consecuencia directa para esta spec:
  no puedo fijar ninguna relación entre `provisional` y `status`, porque el caso
  «aplazado por un humano» cae justo dentro del hueco.
- **H-2 — RN-03 no define *provisional* para una `Decision` sin marcador.**
  «Si solo hay una fuente con peso < 0.9 se publica igualmente, marcado
  *provisional*» habla de publicar un marcador. Una `Decision` `scheduled` o
  `postponed` no publica marcador. ¿Es `provisional = true` ahí un valor
  imposible, o simplemente uno que la UI ignora? Lo primero sería una restricción
  más que meter en CA-18; lo segundo, un campo con un valor sin sentido pero
  inocuo. No lo decido: es una regla de negocio y no es mía.
  Nótese que hoy, con RN-01 y RN-06 tal como están, una `Decision` `postponed`
  **provisional** es perfectamente derivable —un corresponsal (0.8) aplaza y
  RN-03 la marca provisional—, así que prohibirla sería contradecir `reglas.md`,
  no completarlo.
- **H-3, relacionado y para la spec del motor** — `rule` es **una** sola regla
  (`dominio.md`), pero las reglas se aplican **en orden** y varias pueden
  concurrir: una transición `scheduled → live` por una única fuente de peso 0.8
  satisface RN-06 *y* RN-03 a la vez. `reglas.md` no dice cuál se registra.
  No lo resuelvo aquí porque no es del modelo, es del motor; pero si se resuelve
  tarde, el spike acaba con un campo `rule` cuyo valor depende de quién escribió
  cada rama.

Los tres quedan abiertos en el ledger como salvedades. **Rellenarlos es de
`sdd-producto` o del humano sobre `reglas.md`, no del arquitecto sobre una
spec.**

## Historial de enmiendas

- **2026-08-29 — enmienda 1 (sdd-arquitecto).** Motivo: hallazgos
  **F-SPEC-001-9** y **F-SPEC-001-10** del ledger, arbitrados por Alberto Fojo
  («déjalo bien hecho» para el segundo; «que decida el arquitecto» para el
  primero). La spec estaba `aprobada` y en curso, así que el cambio se registra
  aquí y en el ledger, y `sdd-verificador` juzga contra **este** texto. El
  frontmatter `estado` no se toca: sigue `en-progreso`.
  1. **Añadido CA-18** — coherencia marcador/estado de `Decision` en los tres
     niveles (tipo, zod, Postgres). Cierra F-SPEC-001-10. Se añade además a CA-7
     el nivel Postgres para `observations`, que estaba implementado sin estar
     especificado.
  2. **Reescrito CA-14** — la paridad esquema↔zod admite ahora dos mapas de
     excepciones (`dbOnly`, `zodOnly`), cada entrada con motivo escrito; una
     entrada de `zodOnly` tiene que nombrar la tabla que sostiene el dato y el
     test comprueba que existe y tiene FK; las entradas no usadas fallan. Cierra
     F-SPEC-001-9.
  3. **Añadido CA-19** — `rule` restringido a las siete reglas del motor
     (RN-01..RN-07). Retirable en el gate sin arrastrar nada.
  4. **Declarado fuera de alcance** el vínculo `provisional` × `status`, con los
     tres huecos de `reglas.md` que lo impiden descritos en *Notas para el gate
     humano* §8. No se rellenan.
  Criterios tocados: CA-7 (ampliado), CA-14 (reescrito), CA-18 y CA-19 (nuevos).
  Criterios afectados sin cambio de texto: CA-1, CA-2, CA-3 (su caso 3 gana el
  literal `rule: 'RN-13'` por CA-19), CA-6, CA-15.2 (su `CHECK` lo sustituye
  CA-19.3).
