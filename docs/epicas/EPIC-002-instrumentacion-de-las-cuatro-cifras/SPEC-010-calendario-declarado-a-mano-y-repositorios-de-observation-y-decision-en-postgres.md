---
id: SPEC-010
tipo: spec
epica: EPIC-002
estado: en-progreso
aprobada-por: Alberto Fojo
historial:
  - {estado: borrador, fecha: 2026-09-01, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-09-02, por: Alberto Fojo}
  - {estado: en-progreso, fecha: 2026-09-02, por: sdd-implementador}
  - {estado: en-revision, fecha: 2026-09-02, por: sdd-implementador}
  - {estado: en-progreso, fecha: 2026-09-02, por: sdd-verificador}
---
# SPEC-010 — Calendario declarado a mano y repositorios de Observation y Decision en Postgres

> Primera spec del resto de EPIC-002 tras SPEC-008 (`hecho`) y SPEC-009
> (`aprobada`, en implementación). Sigue la descomposición orientativa de
> `_epica.md` —«calendario y repositorios de `Observation`/`Decision`»— y la
> razón de que vaya primero es aritmética, no de gusto: **todo lo que viene
> después escribe o lee estas filas**. El catálogo de alias resuelve contra
> equipos y partidos que hoy no existen en la base; el cron abre ventanas sobre
> `kickoff` que nadie ha cargado; el motor escribe `Decision` en un repositorio
> que SPEC-001 definió y nadie implementó (F-SPEC-001-3); y las cuatro cifras se
> calculan sobre filas.
>
> Trae **ADR-017** (`borrador`): dónde vive el calendario, cómo se identifica un
> partido, y las dos semánticas de persistencia que ningún ADR había escrito.

## Problema

**Entre el adaptador de SPEC-008 y el motor de decisiones hay dos huecos, y los
dos son de persistencia.**

**1. Nada se guarda.** El adaptador devuelve `Observation` en memoria y las
suelta (SPEC-008 §1: «no persiste»). `src/db/ports.ts` define `ObservationStore`
y `DecisionStore` desde SPEC-001 CA-6, y su cabecera dice, con esas palabras,
que «las implementaciones Postgres pertenecen a la primera spec que las
necesite» (F-SPEC-001-3). La épica define **publicado** como «`Decision`
escrita» (RN-08), y hoy no hay dónde escribirla. Las cuatro cifras son
aritmética sobre filas: latencia (`decided_at` contra el cronómetro), cobertura
(partidos con al menos una `Observation` `live` sobre los partidos declarados),
conflictos (observaciones que discrepan por partido) y operación (minutos que
una persona tarda en hacer lo que este sistema le pide, la carga del calendario
incluida).

**2. No hay calendario.** `MatchResolver` (SPEC-008) necesita partidos contra los
que resolver, y `matches` existe vacía desde `migrations/0001`. La épica dice
que **«la lista de partidos la declara una persona a mano»** porque no hay
calendario oficial capturable (ADR-008 §1), y que eso hay que decirlo junto a la
cifra de cobertura. Pero no hay formato, ni cargador, ni registro de quién
declaró qué ni cuándo. Y la única fuente automática no puede ser el
denominador: medir la cobertura de `ceroacero.es` contra la lista de partidos de
`ceroacero.es` es medir uno contra sí mismo (ADR-017 §*Contexto*).

**Por qué las dos cosas en una spec.** Comparten migración, arnés de tests
(`tests/db/_harness.ts`, `DATABASE_URL_TEST`) y consumidor inmediato: el
resolver de la spec siguiente necesita a la vez equipos, partidos y algún sitio
donde dejar las `Observation` que produce. Partirlas daría dos specs de una
migración cada una y una dependencia entre ellas que no aporta nada.

**Lo que esta spec no arregla y conviene decir en la primera línea:** no produce
ninguna cifra, no escribe ninguna `Decision` y no captura nada. Deja el suelo.

## Usuarios / roles afectados

- **`sdd-implementador`**: construye `migrations/0003`, las implementaciones
  Postgres de los puertos, el esquema del calendario declarado, su cargador y su
  CLI, y las suites en `tests/db/` y `tests/calendar/`. La rama tiene que nombrar
  `SPEC-010` (`ft/SPEC-010-calendario-y-repositorios` ya existe), o el hook
  `require-spec` deniega la escritura sobre `src/` y `tests/`. Necesita
  `DATABASE_URL_TEST` desde el primer CA con base.
- **`sdd-verificador`**: corre **dos** suites (`npm test` y `npm run test:db`)
  y sin `DATABASE_URL_TEST` los criterios con base son **UNMET, no *skipped***
  (gate del 2026-08-29). Tiene que ejecutar la carga **dos veces** con el mismo
  fichero, y los casos concurrentes **contra el Postgres real**: un doble en
  memoria no puede demostrar CA-8.5.
- **El operador del spike** (el autor, RN-01): es quien escribe a mano el
  calendario real de las dos competiciones a partir del calendario público de la
  RFGF, quien lo carga desde su máquina con credenciales de producción, y quien
  aparece en `declared_by`. **Sus minutos cuentan** para la cifra de operación
  manual: escribir 34 jornadas de dos competiciones a mano es trabajo, y la
  épica manda medirlo honestamente. Esta spec no le escribe el fichero: le da el
  formato, el validador y el cargador.
- **`sdd-competicion`**, consultivo: los nombres canónicos de los 36 equipos y
  de las dos competiciones que vayan en el fichero real son suyos de dictaminar,
  y esta spec **no los escribe**. Lo que sí asume del dominio, y pide que
  confirme, está en §3: un equipo juega como mucho un partido por jornada; y **no**
  asume el formato a doble vuelta.
- **`sdd-legal-datos`**, consultivo con una pregunta concreta y sin contestar
  (notas §1): versionar en el repositorio una lista de partidos federativa
  copiada a mano.
- **`sdd-arquitecto`**, como autor de las specs siguientes: el catálogo de alias
  implementa `MatchResolver` sobre `MatchStore.listByTeams`; el cron usa
  `MatchStore.listKickoffsBetween`; el motor usa los dos repositorios y hereda
  que **la versión la arbitra la base** (ADR-017 §5); las cifras leen
  `calendar_loads` para decir quién declaró el denominador.
- **`sdd-documentalista`**: `src/calendar/` es un directorio nuevo y `calendario/`
  otro; `CLAUDE.md` §Estructura y el runbook de carga son suyos, después del
  GREEN.

## Diseño

### §1. Qué es el calendario declarado

Un fichero JSON por competición y temporada, escrito por una persona, que
declara la competición, los equipos con su nombre canónico de la RFGF y los
partidos por jornada con hora local y campo, junto con **quién lo declaró y
cuándo**. Es el denominador de la cobertura y la lista contra la que el resolver
identifica partidos. Vive versionado en `calendario/<temporada>/<competition_id>.json`
y se carga en Postgres con una CLI. Término nuevo en `dominio.md`
(§*Competición y calendario*), añadido por esta spec.

**No se obtiene de ninguna fuente por red.** El cargador no hace ninguna
petición: RN-11 no se ejerce porque no hay a quién pedirle nada (ADR-017 §1).

### §2. La forma del fichero

Un esquema zod en `src/calendar/schedule.ts` es el contrato; lo que sigue lo
ilustra y no lo sustituye:

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

Lo que el esquema exige, cada cosa con su test en CA-1:

- `competition` es una `Competition` del modelo canónico (`CompetitionSchema`);
  `season` en la forma de la RFGF, `2026/27`.
- `timezone` es una lista cerrada de **un** valor, `Europe/Madrid`. Un segundo
  valor es un diff con motivo (ADR-016 §3.2 por analogía), nunca un arbitraje.
- `declared_by` es una persona: cadena no vacía. La cadena vacía es la forma que
  toma «nadie lo declaró», exactamente como `confirmed_by` en `team_aliases`.
- `declared_at` es un instante ISO 8601 (se normaliza a `Z` al cargar).
- Los `id` de equipo son *kebab-case* (`^[a-z0-9]+(-[a-z0-9]+)*$`), únicos en el
  fichero, y **cada `home_id`/`away_id` de un partido está declarado en `teams`**.
- `home_id ≠ away_id`; `round ≥ 1`; una jornada aparece una sola vez; un equipo
  aparece **como mucho una vez por jornada**, sea de local o de visitante.
- `kickoff` es hora de pared `YYYY-MM-DD HH:MM` en la zona del fichero; `venue`
  es cadena no vacía o `null` (como `Match.venue`).

Los nombres que van en `canonical_name` y en `competition.name` son los
**canónicos de la RFGF** (`dominio.md`, D-2). El esquema **no puede saber** si
lo son; lo dictamina `sdd-competicion` sobre el fichero real, y el runbook de
carga tiene que pedir ese dictamen antes de cargar por primera vez.

### §3. Identidad y lo que la base garantiza

`MatchId = <competition_id>-<temporada>-j<round>-<home_id>-<away_id>`, con
`2026/27 → 2026-27` (ADR-017 §3). Derivada, determinista, estable ante cambios de
hora. `(competition_id, round, home_id, away_id)` es inmutable en la base;
`kickoff` y `venue` son mutables.

**Lo que la base garantiza sola** (`migrations/0003`): identidad inmutable
(trigger), un equipo no juega dos veces de local ni dos de visitante en la misma
jornada (dos índices únicos), versiones de `Decision` contiguas (trigger),
`calendar_loads` *append-only* (el `reject_amendment` de `0001`, reutilizado).

**Lo que solo el cargador garantiza, y se dice aquí (ADR-016 §6 por
analogía):** el caso **cruzado** —un equipo de local en un partido y de
visitante en otro de la misma jornada— lo rechaza el esquema del fichero y **no
la base**. El motivo está en ADR-017 §3: la semilla de `tests/db/_harness.ts`
(SPEC-001, `hecho`) tiene exactamente esa forma en la jornada 23 para sus
pruebas de RN-12, y bajar el invariante a la base exigiría tocar el soporte de
una spec cerrada. Una fila metida a mano por SQL puede violarlo; el calendario
declarado no.

**Lo que se asume del dominio y se pide confirmar a `sdd-competicion`:** que en
Preferente Futgal G1 y Terceira RFEF G1 un equipo juega como mucho un partido
por jornada. **Lo que no se asume:** el formato a doble vuelta. Por eso
`MatchStore.listByTeams(competition, home, away)` devuelve una lista y no un
partido: en liga a doble vuelta tendrá cero o uno, y si un día no es así, el
puerto no miente.

### §4. La carga: upsert transaccional, sin borrado, con registro

`loadSchedule(sql, file, { clock })` en `src/db/calendar.ts` (la mitad con SQL;
la mitad pura —esquema, hora, identidad— en `src/calendar/`):

1. Valida el fichero entero con el esquema antes de tocar la base.
2. En **una transacción**: upsert de `competitions` (insert si no existe; si
   existe con `name`/`season`/`group` distintos, **rechaza**: la competición no
   se redefine desde un calendario); upsert de `teams` por `id` (insert;
   `canonical_name` se actualiza si cambió, y el resultado lo dice); upsert de
   `matches` por `id` derivado: insert, o `update` de `kickoff`/`venue` si
   cambiaron, o nada.
3. Calcula **huérfanos**: partidos en la base de esa competición **y de las
   jornadas que el fichero declara** que no están en el fichero. Los reporta.
   **No borra nada.**
4. Inserta una fila en `calendar_loads` con `competition_id`, `declared_by`,
   `declared_at`, `loaded_at` (del `Clock` inyectado, `systemClock` por defecto),
   `file_digest` (sha256 de los bytes), `rounds` (las jornadas del fichero),
   `matches_count`, `inserted`, `updated`.
5. Devuelve un `LoadResult` con listas de `MatchId` insertados, actualizados,
   huérfanos, el número de equipos insertados y el `id` de la fila de carga.

Si cualquier paso falla, **nada queda escrito**, ni la fila de carga.

### §5. Los repositorios

- `PostgresObservationStore` (`src/db/observations.ts`) y `PostgresDecisionStore`
  (`src/db/decisions.ts`) implementan **los puertos de `src/db/ports.ts` tal
  cual**: no se añade ni quita un método (SPEC-001 CA-6, `hecho`).
- `MatchStore` es un puerto **nuevo** en `src/calendar/ports.ts` —`getById`,
  `listByRound`, `listByTeams`, `listKickoffsBetween`— con `PostgresMatchStore`
  en `src/db/matches.ts`.
- Toda lectura sale por `.parse()` del esquema zod correspondiente; toda
  escritura entra por él. Los instantes cruzan como cadena `Z` (la conversión
  vive en `createClient`, ADR-006) y **`Date` no aparece** en ninguno de estos
  módulos.
- `ObservationStore.append`: idempotente ante la **misma** `Observation`,
  `ObservationConflictError` ante otra con el mismo `id` (ADR-017 §5).
- `DecisionStore.append`: la base exige `version = max + 1`; ante dos escrituras
  concurrentes de la misma versión gana **una**, y la otra recibe
  `DecisionVersionConflictError`, distinguible de cualquier otro fallo.

### §6. Lo que esta spec hereda y no rehace

- `createClient` con el conversor de instantes, `migrate`, `requireDatabaseUrl`
  y `requireTestDatabaseUrl` (SPEC-001). El cargador y la CLI los usan.
- El arnés de `tests/db/` —`connect`, `resetAndMigrate`, `seed`, `truncateFacts`—
  **sin tocar la semilla**. Las suites nuevas limpian lo suyo.
- `systemClock` y `Clock` de `src/polite/clock.ts`: el único sitio donde se lee
  el reloj (ADR-014 §1), inyectable en el cargador.
- La trampa del socket de SPEC-008 CA-2.1 y el cierre de imports por superficie
  (CA-2.3): los módulos nuevos importan `node:crypto` (`createHash`),
  `node:fs/promises` (`readFile`), `zod` (`z`) y `postgres` (`default`), todos ya
  en la lista con esa superficie. **Si el implementador necesita una entrada o un
  nombre nuevo, es un diff con motivo en `ALLOWED_PACKAGES`**, no un arbitraje;
  y la CLI nueva es un punto de entrada, así que va a `ENTRY_POINTS` con su
  motivo. Esta spec **no escribe ningún test de arquitectura** propio.

## Criterios de aceptación

- **CA-1 — El calendario declarado se valida entero antes de tocar nada, y lo
  que una persona escribe mal se rechaza nombrando la fila.**
  Dado el fixture **sintético** `tests/fixtures/calendar.ts` —dos jornadas, cuatro
  equipos con nombres canónicos de los que ya usa el repositorio (`UD Ourense`,
  `RC Celta B`, …), un `venue: null`—,
  cuando se parsea con el esquema de `src/calendar/schedule.ts`,
  entonces valida, y **cada una** de estas variantes es rechazada con un error
  que nombra la jornada y el partido o el equipo: (1) un `home_id` que no está en
  `teams`; (2) `home_id === away_id`; (3) el mismo equipo dos veces de local en
  una jornada; (4) dos veces de visitante; (5) **local en un partido y visitante
  en otro de la misma jornada** —el caso cruzado, que solo aquí se cierra (§3)—;
  (6) dos `teams` con el mismo `id`; (7) `declared_by: ""`; (8) un `id` que no es
  *kebab-case* (`UD_Ourense`); (9) `timezone: "UTC"`; (10) `round: 0`; (11) la
  misma jornada declarada dos veces; (12) `kickoff` sin la forma `YYYY-MM-DD
  HH:MM`. Este criterio **no toca la red ni la base**: es una función pura y
  corre en `npm test`.

- **CA-2 — La hora local se convierte en el borde a cadena ISO 8601 UTC con `Z`,
  y lo que no existe se rechaza (ADR-006, ADR-017 §4).**
  Dada la función de conversión de `src/calendar/time.ts`,
  cuando se le da una hora de pared en `Europe/Madrid`,
  entonces: `2026-09-06 17:00 → 2026-09-06T15:00:00.000Z` (verano);
  `2027-01-17 17:00 → 2027-01-17T16:00:00.000Z` (invierno);
  `2026-10-24 17:00 → 2026-10-24T15:00:00.000Z` y
  `2026-10-25 17:00 → 2026-10-25T16:00:00.000Z` (la víspera y el día del cambio a
  invierno); `2027-03-28 02:30` **se rechaza** nombrando la hora como inexistente;
  `2026-10-25 02:30` **se rechaza** como ambigua. Y además:
  1. El resultado satisface `InstantSchema` y su tipo es `Instant`; un test de
     tipo (`.test-d.ts`) comprueba que la función no devuelve `Date`.
  2. `package.json` no gana ninguna dependencia para esto: la conversión usa
     `Intl` de Node. El verificador lo comprueba en el diff.
  3. `Date` aparece **solo** en `src/calendar/time.ts`, como conversor transitorio,
     igual que en `src/polite/clock.ts`; ningún otro módulo de `src/calendar/` ni
     de los tres repositorios lo nombra. Se comprueba leyendo el código, no con
     un test de arquitectura.

- **CA-3 — La identidad de un partido se deriva y es estable (ADR-017 §3).**
  Dada `matchId(competitionId, season, round, homeId, awayId)` en
  `src/calendar/ids.ts`,
  entonces `('futgal-preferente-g1', '2026/27', 1, 'ud-ourense', 'rc-celta-b')`
  produce exactamente `futgal-preferente-g1-2026-27-j1-ud-ourense-rc-celta-b`;
  la misma entrada produce la misma salida; intercambiar local y visitante
  produce **otro** `id`; cambiar la jornada produce otro `id`; el resultado
  satisface `MatchIdSchema` y casa con `^[a-z0-9-]+$`. Función pura, `npm test`.

- **CA-4 — La carga es un upsert transaccional que nunca borra y que no toca la
  identidad (ADR-017 §2 y §3).**
  Dado `DATABASE_URL_TEST`, un esquema limpio con las tres migraciones y el
  fixture sintético de CA-1,
  cuando se ejecuta `loadSchedule` con un reloj falso,
  entonces:
  1. `competitions`, `teams` y `matches` contienen exactamente lo que el fichero
     declara; cada `matches.id` es el de CA-3; cada `kickoff` es el instante UTC
     de CA-2; el resultado lista todos los partidos en `inserted`.
  2. Cargar **el mismo fichero otra vez** deja las tablas idénticas y devuelve
     `inserted: []`, `updated: []`.
  3. Cargar una copia del fichero con el `kickoff` y el `venue` de un partido
     cambiados devuelve ese `id` en `updated`, la fila tiene la hora y el campo
     nuevos, y **el `id` no cambia**.
  4. Cargar una copia con un partido **menos** devuelve ese `id` en `orphans`, y
     el partido **sigue en la base**.
  5. Una `Observation` escrita contra un partido **sobrevive a la recarga** de
     CA-4.3: sigue apuntando al mismo `match_id` y la clave ajena sigue en pie.
  6. `update matches set home_id = …` sobre un partido cargado **lo rechaza la
     base** con un error que nombra RN-13 o la inmutabilidad de la identidad;
     `update matches set kickoff = …` **lo admite**. Igual para `round` y
     `away_id` y `competition_id` (rechazados) y `venue` (admitido).
  7. Cargar un fichero cuya `competition` tiene el mismo `id` que una ya cargada
     pero otro `name` **se rechaza** y la base no cambia.
  8. **Todo o nada**: con una fila preinsertada a mano que colisione con el
     índice único `(competition_id, round, home_id)` bajo otro `id`, la carga
     falla, y **ninguna** tabla —`calendar_loads` incluida— ha cambiado.
  9. La semilla de `tests/db/_harness.ts` **no se modifica**, y toda la suite
     `tests/db/` anterior a esta spec sigue verde sin tocar una aserción.

- **CA-5 — Cada carga deja constancia de quién declaró el calendario, cuándo, y
  con qué fichero (ADR-017 §2).**
  Dada la carga de CA-4.1,
  entonces `calendar_loads` tiene **una** fila con `competition_id`,
  `declared_by` igual al del fichero, `declared_at` normalizado a `Z`,
  `loaded_at` igual al instante del reloj falso (cadena `Z`), `file_digest` igual
  al sha256 hex de los bytes del fichero, `rounds = {1,2}`, `matches_count` y los
  contadores `inserted`/`updated` coherentes con el resultado. Y:
  1. La segunda carga de CA-4.2 añade **otra** fila, con `inserted = 0`: cargar es
     un hecho aunque no cambie nada.
  2. `update calendar_loads …` y `delete from calendar_loads …` **los rechaza la
     base** (`reject_amendment`, RN-13 por analogía): una carga es un hecho
     histórico.
  3. `insert into calendar_loads (…, declared_by, …) values (…, '', …)` **lo
     rechaza la base**: la cadena vacía es «nadie».

- **CA-6 — La CLI carga un fichero contra `DATABASE_URL`, cuenta lo que hizo, y
  falla con claridad.**
  Dado `npm run calendario:cargar -- <ruta>` (`src/calendar/cli.ts`, con la misma
  forma que `src/db/cli.ts`),
  entonces: con un fichero válido escribe en `stdout` los recuentos de
  insertados, actualizados y huérfanos y el `id` de la fila de carga, y sale con
  `0`; con un fichero inválido escribe el error de CA-1 nombrando la fila y sale
  con `1` **sin haber abierto conexión**; sin `DATABASE_URL` sale con `1` con el
  mensaje de `MissingDatabaseUrlError`. El `main` recibe `sql` y `argv`
  inyectados para poder probarse sin proceso hijo, como `migrate.main`.
  La CLI es un punto de entrada nuevo del repositorio: **se añade a
  `ENTRY_POINTS` con su motivo** (SPEC-008 CA-2.5, ADR-016 §3.2).

- **CA-7 — `PostgresObservationStore`: lo que un adaptador produce se guarda, se
  lee igual, y no se reescribe (RN-13, ADR-006, ADR-017 §5).**
  Dado el esquema limpio, la semilla de `_harness.ts` y `observationFixture`
  adaptada a la semilla,
  entonces:
  1. `append(o)` devuelve la `Observation` guardada; `getById(o.id)` devuelve un
     valor `toEqual` al que se guardó, con `observed_at` como **cadena** que
     satisface `InstantSchema`, y **congelado** (es la salida de
     `ObservationSchema.parse`).
  2. `listByMatch(matchId)` devuelve solo las de ese partido, ordenadas por
     `observed_at` ascendente y luego por `id`; `getById` de un `id` desconocido
     devuelve `null`.
  3. `append` **valida al entrar**: un objeto con `status: 'scheduled'` y
     `home_score: 1` es rechazado por zod **antes** de ejecutar SQL (el test lo
     comprueba con un `Sql` espía que no recibe ninguna consulta).
  4. **Replay inofensivo**: `append(o)` dos veces deja **una** fila y la segunda
     llamada devuelve la fila guardada sin error.
  5. **Conflicto**: `append` de otra `Observation` con el mismo `id` y distinto
     `home_score` lanza `ObservationConflictError` y la fila conserva el
     contenido **primero**.
  6. `append` con un `match_id` inexistente falla por la clave ajena, y el error
     sale sin envolver.
  7. La clase **no tiene** `update` ni `delete`: un `.test-d.ts` con
     `@ts-expect-error` lo fija, como SPEC-001 CA-6 hizo con el puerto.

- **CA-8 — `PostgresDecisionStore`: versiones contiguas y una sola vigente, y lo
  arbitra la base (RN-12, ADR-004, ADR-017 §5).**
  Dado el esquema limpio y la semilla,
  entonces:
  1. `append` de una `Decision` con `version: 1` se guarda; `getLatestByMatch`
     la devuelve `toEqual`, con `decided_at` como cadena `Z`,
     `supporting_observation_ids` como tupla no vacía y `rule` dentro de
     `DECISION_RULES`; `getLatestByMatch` de un partido sin decisiones devuelve
     `null`.
  2. `version: 2` después de `1` se guarda y pasa a ser la vigente; `version: 3`
     después de `1` **la rechaza la base** (contigüidad); `version: 1` como
     primera es obligatoria: `version: 2` sobre un partido vacío se rechaza.
  3. `listByMatch` devuelve el log entero, versión ascendente.
  4. `append` con un `supporting_observation_ids` que no pertenece al partido
     falla por el trigger de SPEC-001 (`decisions_supporting_observations_exist`)
     y el error sale sin envolver: esta spec no lo reimplementa, lo hereda.
  5. **Dos a la vez, una gana**: dos `append` **concurrentes** (`Promise.all`)
     con `version: 1` sobre el mismo partido y dos conexiones distintas
     producen exactamente **un** éxito y **un** `DecisionVersionConflictError`;
     después, `getLatestByMatch` devuelve `version: 1` y `listByMatch` tiene una
     fila. Se comprueba **contra el Postgres real**, como SPEC-008 CA-14.4.
  6. `append` **valida al entrar**: `rule: 'RN-13'` es rechazado por zod antes de
     ejecutar SQL (mismo espía que CA-7.3); el `CHECK` de SPEC-001 CA-19 sigue
     ahí como segunda red y un caso lo comprueba insertando por SQL directo.
  7. Sin `update` ni `delete`, igual que CA-7.7.

- **CA-9 — `PostgresMatchStore`: el calendario se lee parseado, ordenado y por
  intervalo.**
  Dada la carga de CA-4.1,
  entonces: `getById` devuelve el `Match` `toEqual` al declarado (tras CA-2 y
  CA-3), con `kickoff` como cadena `Z` y `venue` `null` donde el fichero lo
  dejó; `getById` desconocido → `null`. `listByRound(competition, 1)` devuelve
  los de la jornada 1 ordenados por `kickoff` y luego `id`, y nada de la 2.
  `listByTeams(competition, home, away)` devuelve la lista de partidos con ese
  par ordenado —en el fixture, uno— y `[]` con el par invertido si no existe.
  `listKickoffsBetween(from, to)` devuelve, de **todas** las competiciones, los
  partidos con `from ≤ kickoff < to`, ordenados por `kickoff`: un test con dos
  competiciones cargadas y un intervalo que corta entre dos partidos lo fija en
  los dos bordes. Todo sale por `MatchSchema.parse`.

- **CA-10 — `migrations/0003` se aplica en orden, sin rollback, y no rompe lo
  que `0001` y `0002` ya garantizan (ADR-006).**
  Dado un esquema vacío,
  cuando se ejecuta `migrate`,
  entonces devuelve `['0001', '0002', '0003']` en ese orden y una segunda
  ejecución devuelve `[]`. Y:
  1. `information_schema` muestra la tabla `calendar_loads`, los dos índices
     únicos sobre `matches` y los dos triggers nuevos, **con los nombres que la
     migración declara** (el test los lee de la migración, no los repite).
  2. **No hay columnas nuevas en ninguna tabla del modelo canónico**: el test de
     paridad de SPEC-001 CA-14 (`tests/db/parity.test.ts`) pasa **sin ninguna
     entrada nueva** en sus mapas de excepciones. `calendar_loads` no es modelo
     canónico, como `request_rhythm` no lo es.
  3. Toda la suite `tests/db/` previa pasa entera, sin tocar una aserción ni la
     semilla (es CA-4.9, dicho desde la migración).
  4. La migración está escrita a mano, con SQL etiquetado en los repositorios y
     **sin ORM**; el verificador lo comprueba leyendo el diff.

- **CA-11 — Los tres gates, las dos suites, y las suites cerradas enteras.**
  `npm run lint` en `exit=0`, `npm test` y `npm run test:db` en verde, con las
  **tres salidas literales en el ledger**. `DATABASE_URL_TEST` es obligatorio:
  sin él CA-4, CA-5, CA-7 (salvo 7.3 y 7.7), CA-8 (salvo 8.6 y 8.7), CA-9 y
  CA-10 son **UNMET, no *skipped*** (gate del 2026-08-29). Y **ninguna suite
  cerrada pierde un caso**: recuento fichero a fichero de `tests/mirror`,
  `tests/site`, `tests/docs`, `tests/model`, `tests/raw`, `tests/db`,
  `tests/ingest`, `tests/polite` y `tests/types` contra `main`, como hacen las
  verificaciones de SPEC-008 y como SPEC-009 CA-7 exige.

## Entidades y reglas afectadas

**Reglas de negocio** (`docs/fundacion/reglas.md`, no se duplican aquí):

- **RN-08** — publicar es escribir una `Decision`; aquí nace **la capacidad** de
  escribirla (CA-8), no el permiso. Quién puede llamar a `DecisionStore.append`
  es la frontera que la spec del motor demuestra como ADR-016 manda. Esta spec
  no escribe ninguna `Decision` fuera de sus tests.
- **RN-09** — la identidad no se adivina: el calendario da los partidos contra
  los que el catálogo de alias resolverá (CA-9 `listByTeams`); unir nombres de
  fuente con equipos sigue siendo de otra spec y exige confirmación humana.
- **RN-10** — no aplica: el cargador no recibe respuestas de ningún tercero. La
  `Observation` que se guarda ya trae su `raw_ref` obligatorio (SPEC-001) y el
  repositorio no lo relaja (CA-7.1).
- **RN-11** — no se ejerce: ninguna petición nueva sale de ningún módulo de esta
  spec (§1, §6).
- **RN-12** — cada `Decision` guardada lleva `rule` y `supporting_observation_ids`
  válidos: zod al entrar, `CHECK` y trigger de SPEC-001 en la base (CA-8.4,
  CA-8.6).
- **RN-13** — `observations` y `decisions` siguen *append-only* (SPEC-001 CA-16)
  y esta spec añade la semántica de `append` ante un `id` repetido (CA-7.4,
  CA-7.5), extiende la inmutabilidad a `calendar_loads` (CA-5.2) y a la
  **identidad** de `matches` (CA-4.6).

**ADRs:**

- **ADR-017** (`borrador`, nace con esta spec) — el calendario es una declaración
  humana versionada que vive en Postgres (§1, §2), identidad derivada e inmutable
  (§3), hora local al borde (§4), y las dos semánticas de persistencia (§5). Esta
  spec lo ejecuta entero; si el gate cambia el ADR, cambian CA-1..CA-5 y CA-7..CA-8.
- **ADR-006** (`aprobada`) — SQL a mano sin ORM, `migrations/0003` sin rollback
  (CA-10), instantes como cadena `Z` (CA-2, CA-7.1, CA-8.1, CA-9), zod al salir de
  la base (CA-7, CA-8, CA-9).
- **ADR-004** (`aprobada`) — sin disco ni proceso vivo: por eso el calendario vive
  en Postgres y se carga desde fuera (§4), y por eso la contigüidad de versiones
  la arbitra la base (CA-8.5).
- **ADR-008 §1** — la fuente oficial no es capturable: es la razón de que el
  calendario sea declarado y no capturado.
- **ADR-009 §6** — la retención de producción sigue sin fijar y es precondición
  de **la ingesta continua**, que esta spec no arranca (notas §3).
- **ADR-014 §1 y §3.2** — `Clock` de `src/polite/clock.ts` es el único reloj
  (§6); y las 6 h del `robots.txt` pierden el ancla del «refresco del
  calendario» sin perder su motivo (ADR-017 §*Contexto*, notas §2).
- **ADR-016** — esta spec **no escribe ningún test de arquitectura**, así que no
  le aplica; lo que sí toma de él es la forma de decir qué no promete (§3) y que
  ensanchar `ALLOWED_PACKAGES` o `ENTRY_POINTS` es un diff con motivo (§6,
  CA-6).
- **ADR-011 §6** — SPEC-001 y SPEC-008 son `hecho`; esta spec cierra
  F-SPEC-001-3 y consume `MatchResolver` sin tocar sus ficheros. El ledger de
  SPEC-001 recibe una **referencia cruzada** al cerrar.
- **ADR-001** — zod como fuente única del modelo (`CompetitionSchema`,
  `MatchSchema`, `ObservationSchema`, `DecisionSchema` en todos los bordes).

**Términos de `dominio.md`** que esta spec consume: `Competition`, `Team`,
`Match`, `Observation`, `Decision`, `rule`, `raw_ref`, `jornada`, los cinco
estados y la representación del tiempo. **Añade uno**: **calendario declarado**
(§*Competición y calendario*), en el mismo commit que esta spec.

## Fuera de alcance

Aparcado a propósito, no por descuido. Cada línea tiene dueño.

- **El fichero real de las dos competiciones.** Lo escribe el operador a mano,
  con dictamen de `sdd-competicion` sobre los nombres, y **no antes** del
  dictamen de `sdd-legal-datos` de las notas §1. Esta spec entrega el formato, el
  validador, el cargador y fixtures **sintéticos**; ni una jornada real.
- **El catálogo de alias y la implementación de `MatchResolver`** (RN-09). Aquí
  hay `MatchStore.listByTeams`; la unión con los nombres de fuente y la
  confirmación humana son la spec siguiente.
- **El cron, las ventanas por partido y su frecuencia.** `listKickoffsBetween`
  es la consulta; el intervalo y el ritmo son del cron, que hereda además la
  precondición de ADR-009 §6.
- **El motor de decisiones** y cualquier `Decision` real. Y con él **la frontera
  de RN-08** —quién puede escribir— demostrada según ADR-016.
- **La retención de producción** (ADR-009 §6, F-SPEC-001-1 estrechado). No se
  toca y no se cumple aquí: se cumple en la spec que ingiera de forma continua.
- **Borrar partidos o equipos.** El cargador reporta huérfanos y no borra. Si
  algún día hace falta, es una spec con sus CA.
- **Automatizar el calendario** desde cualquier fuente, `futgal.es` incluida el
  día que sea capturable. Cambia el denominador de una cifra del go/no-go: ADR
  propio.
- **El snapshot y la página mínima.** Cuando lleguen, leerán `getLatestByMatch`
  por partido; si necesitan «las vigentes de una competición», es un método nuevo
  de `DecisionStore`… y ése **sí** toca el puerto de SPEC-001, así que se decide
  entonces y no aquí.
- **El runbook de carga** (`docs/procedimientos/`) y `CLAUDE.md` §Estructura
  para `src/calendar/` y `calendario/`: `sdd-documentalista`, tras el GREEN.
- **La revisión de `tests/db/_harness.ts`** para bajar a la base el caso cruzado
  de «un partido por jornada». Posible por ADR-011 §6; no vale lo que cuesta hoy
  (§3, ADR-017 §3).
- **SPEC-009 y todo lo que hereda de SPEC-008.** Esta spec no toca
  `tests/polite/` salvo la línea de `ENTRY_POINTS` de CA-6, y si SPEC-009 se
  mergea antes, esa línea se reubica donde SPEC-009 haya dejado la lista.

## Notas para el gate humano

Lo que hay que mirar con lupa antes de firmar. Cada punto lleva la
recomendación de `sdd-arquitecto`; **la decisión es de quien firma**.

1. **Se va a versionar en el repositorio una lista de partidos publicada por la
   RFGF, copiada a mano, y nadie ha dictaminado si se puede.** La épica ya
   decidió que el denominador «lo declara una persona a mano»; lo nuevo es que
   quede escrito en `git`. No es HTML de terceros (ADR-009 §3) y una lista de
   partidos no lleva datos personales, pero `sdd-legal-datos` no se ha
   pronunciado sobre copiar un calendario federativo. **Recomendación:** aprobar
   el mecanismo ahora y **pedir el dictamen antes de commitear el primer fichero
   real**, que es cuando existe algo que dictaminar. Si el dictamen fuera
   contrario, el cargador funciona igual con un fichero fuera del repositorio;
   lo que se perdería es la auditoría por commit, no la spec.
2. **«Refresco cada 6 h» se reinterpreta, y eso toca el texto de una épica
   aprobada.** `_epica.md` dice «calendario, cargado a mano, con refresco cada
   6 h»; ADR-017 §2 dice que sin fuente de la que refrescar, refrescar es que una
   persona recargue, y el cron lee Postgres en cada tick. Y ADR-014 §3.2 ancló
   las 6 h del `robots.txt` en esa cadencia. **Recomendación:** aceptar la
   reinterpretación —no cambia ninguna regla, quita un mecanismo sin objeto— y
   dejar las 6 h de ADR-014 como están, que su propio texto ya declara
   «revisable con evidencia». La frase de la épica es de `sdd-producto`; no se
   toca desde aquí.
3. **Hay una precondición escrita en EPIC-003 que hay que leer con esta spec
   delante:** «la primera spec que persista datos en producción no se aprueba
   sin un ADR que fije la retención de producción» (riesgos de EPIC-003, viene
   de F-SPEC-005-V2; ADR-009 §6 lo formula como precondición de **la ingesta
   continua**). Esta spec persiste `Observation` y `Decision` —que RN-13 hace
   permanentes y que ninguna retención puede borrar— y un calendario; **no
   escribe un solo byte crudo ni ingiere nada**. **Recomendación:** leerla como
   ADR-009 §6 la escribe —ata a la spec que arranque el cron— y aprobar ésta.
   Si el gate la lee literalmente, esta spec queda `bloqueada` hasta que exista
   ese ADR, y ADR-009 §6 dice que hoy no se puede escribir sin inventar.
4. **`migrations/0003` es irreversible en la práctica** (ADR-006) e incluye un
   trigger sobre `decisions` que **constriñe al motor**: `version = max + 1`, y
   la base arbitra entre instancias. **Recomendación:** firmarlo; la alternativa
   —el llamante calcula su versión y espera estar solo— es F-SPEC-008-V13 con
   otra entidad.
5. **`ObservationStore.append` idempotente ante la misma `Observation`** (CA-7.4)
   es una semántica nueva, no escrita en SPEC-001. La alternativa es fallar
   siempre ante un `id` repetido. **Recomendación:** idempotente; es lo que hace
   inofensivo el replay determinista de SPEC-008 CA-10 y no afloja RN-13, porque
   el contenido distinto **sí** falla (CA-7.5).
6. **La identidad del partido se deriva de los `id` de equipo que una persona
   escribe.** Corregir un `id` mal escrito después de cargar crea partidos nuevos
   y deja huérfanos los viejos, que el cargador reporta y no borra.
   **Recomendación:** aceptar; es el precio de que las `Observation` sobrevivan a
   los cambios de hora, que son lo frecuente. El dictamen de `sdd-competicion`
   antes de la primera carga es la red.
7. **El caso cruzado de «un partido por jornada» lo cierra el cargador y no la
   base**, porque la semilla de SPEC-001 lo viola a propósito (§3).
   **Recomendación:** aceptar así, con la limitación escrita en CA-1 y ADR-017
   §3. Si se prefiere bajarlo a la base, hay que tocar `tests/db/_harness.ts`
   (ADR-011 §6) y esta spec crecería un CA.
8. **Lo que se asume del dominio sin dictamen:** que un equipo juega como mucho
   un partido por jornada. **No** se asume la doble vuelta. **Recomendación:**
   aprobar sin esperar; pedir a `sdd-competicion` que lo confirme junto con los
   nombres del fichero real, que es cuando hace falta.
9. **La hora se convierte con `Intl` y sin dependencia**, con los seis casos de
   CA-2 fijados, cambio de hora incluido. Es un sitio donde este proyecto no
   tenía nada escrito y donde un error es silencioso. **Recomendación:** mirar
   los seis casos y firmar.
10. **`src/calendar/` y `calendario/` son directorios nuevos**, y la CLI es un
    punto de entrada nuevo (`ENTRY_POINTS`). `CLAUDE.md` §Estructura se queda
    atrás hasta que `sdd-documentalista` pase. **Recomendación:** aceptar; es lo
    normal de cada spec.
11. **Cargar exige credenciales de producción en el portátil de una persona**, y
    no hay runbook. **Recomendación:** que `sdd-documentalista` escriba
    `docs/procedimientos/carga-del-calendario.md` tras el GREEN, con el dictamen
    de `sdd-competicion` como paso previo a la primera carga.
12. **La fecha del frontmatter es 2026-09-01 por indicación del orquestador**,
    aunque el reloj local pasó al 2026-09-02 mientras se escribía. Si el gate
    prefiere la fecha de calendario real, es un cambio de una línea en la spec,
    el ledger y ADR-017.
13. **Lo que esta spec deliberadamente no promete.** No produce ninguna cifra,
    no escribe ninguna `Decision` fuera de sus tests, no captura nada y no deja
    el sistema capaz de publicar. Al terminar habrá un calendario declarado que
    se puede cargar y auditar, y tres repositorios sobre los que el catálogo de
    alias, el cron y el motor pueden por fin escribirse.
