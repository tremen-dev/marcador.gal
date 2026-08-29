---
id: SPEC-001
tipo: spec
epica: EPIC-001
estado: en-progreso
aprobada-por: Alberto Fojo
historial:
  - {estado: borrador, fecha: 2026-08-29, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-08-29, por: Alberto Fojo}
  - {estado: en-progreso, fecha: 2026-08-29, por: sdd-implementador}
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

- **CA-14 — El esquema y los esquemas zod no pueden separarse en silencio.**
  Dado el esquema aplicado, cuando un test consulta `information_schema.columns`
  para cada tabla, entonces el conjunto de nombres de columna es **igual** al
  conjunto de claves del esquema zod correspondiente, salvo una lista explícita
  y declarada en el propio test de columnas solo-BD (`created_at`).
  Este es el test que falla el día que alguien añade un campo a `Observation` y
  se olvida de la migración, o al revés.

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
