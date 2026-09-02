---
id: SPEC-010
tipo: ledger
epica: EPIC-002
---
# Ledger — SPEC-010 Calendario declarado a mano y repositorios de Observation y Decision en Postgres

## Resumen
- **LO ÚLTIMO (2026-09-02): SEGUNDA VUELTA DE VERIFICACIÓN, GREEN, y la spec
  pasa a `hecho`.** Los once CA ✅ con evidencia propia del verificador (ver
  *Veredicto del verificador → Segunda vuelta*). F-1 reproducido y cerrado
  contra el Postgres de test: `append(o)` dos veces con `observed_at` sin
  milisegundos devuelve la fila guardada sin error, `getById` es `toEqual` a lo
  devuelto, una fila, y con `away_score` distinto sigue siendo
  `ObservationConflictError`. CA-4, CA-6 y CA-8 re-verificados con sondas
  propias porque el diff de la vuelta los toca; el cierre de F-SPEC-010-10 se
  sostiene (la CLI real rechaza el hueco horario y la hora ambigua en 85–116 ms
  con `DATABASE_URL` apuntando a un host inexistente o sin `DATABASE_URL`).
  Gates del verificador: `lint exit=0`, `typecheck exit=0`, `npm test`
  842/842 (90 ficheros), `npm run test:db` 210/210 (14 ficheros); recuento caso
  a caso frente a la primera vuelta (+1 `command`, +3 `declared`, +4
  `observations`, +1 `decisions`, ninguna suite cerrada cambia) y frente a
  `main` (842 − 65 = 777; 210 − 66 = 144). Dos salvedades nuevas menores
  (F-SPEC-010-11, F-SPEC-010-12) a EPIC-MEJORA; para el gate humano quedan
  F-SPEC-010-1, -2, -5 y -9.
- **Antes (2026-09-02): SEGUNDA VUELTA DE IMPLEMENTACIÓN, F-1 corregido y
  F-SPEC-010-10 cerrado, y la spec vuelve a `en-revision`.** Ver *«Segunda
  vuelta — corrección de F-1 y F-SPEC-010-10»*, antes de *Cómo retomar*. Dos
  commits de código (`22e6c05` CA-7, `9a7f380` CA-6) y el de este ledger.
  `PostgresObservationStore.append` normaliza `observed_at` a la forma
  almacenada al entrar y compara sobre ella (sin `Date`, con `@/polite/clock`);
  `PostgresDecisionStore.append` hace lo mismo con `decided_at` para no quedar
  asimétrico. Y `declareCalendar` valida ahora el fichero ENTERO, horas
  incluidas: un kickoff inexistente o ambiguo sale por el paso 1 de la CLI sin
  abrir conexión. Gates: `lint exit=0`, `typecheck exit=0`, `npm test`
  **842/842** (90 ficheros; +4 en `tests/calendar`), `npm run test:db`
  **210/210** (14 ficheros; +5 en `tests/db`). Nueve ficheros tocados, todos de
  esta spec; `_harness.ts`, `parity.test.ts` y `src/db/ports.ts` sin diff.
- **Antes (2026-09-02): PRIMERA VUELTA DE VERIFICACIÓN, RED por un solo
  criterio, y la spec vuelve a `en-progreso`.** Diez CA ✅ con evidencia propia
  del verificador (sondas contra el Postgres de test y la CLI real, además de
  las suites); **CA-7 ❌** porque `append` del mismo objeto `Observation` con
  `observed_at` sin milisegundos (válido para `InstantSchema`) lanza
  `ObservationConflictError` en la segunda llamada (F-1, ver *Veredicto del
  verificador*). Gates del verificador: `lint exit=0`, `typecheck exit=0`,
  `npm test` 838/838, `test:db` 205/205; recuento caso a caso contra `main`
  cuadra (777 + 61, 144 + 61). Una salvedad nueva, **F-SPEC-010-10**, y
  F-SPEC-010-6 confirmado por medición.
- **Antes (2026-09-02): PRIMERA VUELTA DE IMPLEMENTACIÓN, los once CA con
  test, y la spec pasa a `en-revision`.** Ver *«Primera vuelta — lo que se
  implementó y cómo»*, al final. Los tres gates verdes con `DATABASE_URL_TEST`
  disponible: `lint exit=0`, `npm test` **838/838** (90 ficheros; en `main`,
  777/777 en 81), `npm run test:db` **205/205** (14 ficheros; en `main`,
  144/144 en 8). **Ninguna suite cerrada pierde un fichero**: `tests/mirror` 43,
  `tests/site` 15, `tests/docs` 1, `tests/model` 12, `tests/raw` 5,
  `tests/ingest` 8 y `tests/polite` 6, iguales que en `main`; `tests/db` pasa de
  9 a 15 y `tests/types` de 7 a 9, todo añadido. **La semilla de
  `tests/db/_harness.ts` no se ha tocado** y las nueve suites previas de
  `tests/db/` pasan sin una aserción cambiada (CA-4.9, CA-10.3); el test de
  paridad de SPEC-001 CA-14 pasa **sin ninguna entrada nueva** (CA-10.2).
  Directorios nuevos: `src/calendar/`, `tests/calendar/`, `tests/stores/`.
  Fichero nuevo fuera de la spec pero exigido por ella: `src/db/arrays.ts`
  (F-SPEC-010-6). Once commits en la rama, uno por CA o grupo coherente.
  Cuatro salvedades nuevas (F-SPEC-010-6..9) y seis decisiones tomadas sin que
  la spec las fijara, listadas abajo para el verificador.
- Trae **ADR-017** (`aprobada` el 2026-09-02 con la spec), que fija dónde vive el
  calendario, cómo se identifica un partido y las dos semánticas de
  persistencia. La spec lo ejecuta entero.
- Cierra **F-SPEC-001-3** (implementación Postgres de `ObservationStore` y
  `DecisionStore`) **sin reabrir SPEC-001**: los puertos no cambian. Al cerrar,
  el ledger de SPEC-001 recibe una referencia cruzada (ADR-011 §6): eso es del
  documentalista, tras el GREEN.
- Rama: `ft/SPEC-010-calendario-y-repositorios`, worktree
  `.claude/worktrees/spec-010`, sin push ni PR.

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 — el calendario declarado se valida entero y nombra la fila que falla | `src/calendar/schedule.ts` (`ScheduleSchema`, `parseSchedule`, `InvalidScheduleError`, `SCHEDULE_TIMEZONES`); fixture sintético `tests/fixtures/calendar.ts` | `tests/calendar/schedule.test.ts` — el fixture valida; variantes 1..12, cada una con `round N` / `team X` en el mensaje; además temporada `YYYY/YY` y un error por línea (18 casos, `npm test`) | 2026-09-02 · `npm test` 838/838, `tests/calendar/schedule.test.ts` 18/18. Sonda propia fuera del repo (`ca1-probe.ts`, scratchpad) sobre las variantes 7, 8, 9, 10, 12 y `venue: ''`: todas rechazadas con `InvalidScheduleError`; cuando hay fila, el mensaje la nombra (`round 2, match rc-celta-b-cd-exemplo: kickoff has to be written as YYYY-MM-DD HH:MM (got …)`, `round 0: Too small…`, `team UD_Ourense: … kebab-case`); cuando no la hay (7, 9) nombra el campo. Fixture sintético: equipos inventados salvo `UD Ourense`/`RC Celta B`, que ya usa `tests/fixtures/model.ts` (ADR-009 ✓). | ✅ |
| CA-2 — hora local a cadena ISO UTC en el borde; lo inexistente se rechaza | `src/calendar/time.ts` (`wallTimeToInstant`, `NonexistentWallTimeError`, `AmbiguousWallTimeError`, `MalformedWallTimeError`); `Intl` de Node, sin dependencia; `Date` solo aquí | `tests/calendar/time.test.ts` — los seis casos de la spec (verano, invierno, víspera y día del cambio, hueco de marzo, hora repetida de octubre), `InstantSchema`, medianoche; `tests/types/calendar-time.test-d.ts` — devuelve `Instant`, no `Date` (CA-2.1). CA-2.2 y CA-2.3 son de lectura del diff: `package.json` no gana dependencia; `grep -n '\bDate\b' src/calendar src/db/{calendar,observations,decisions,matches,arrays}.ts` da solo `time.ts` | 2026-09-02 · `tests/calendar/time.test.ts` 9/9 con los seis instantes de la spec (verano, invierno, víspera y día del cambio, hueco de marzo → `NonexistentWallTimeError`, hora repetida → `AmbiguousWallTimeError`). 2.1: `tests/types/calendar-time.test-d.ts` bajo el `typecheck` de vitest («Type Errors no errors») y sonda `tsc` propia (tsconfig en scratchpad): `const d: Date = wallTimeToInstant(…)` sin directiva → `TS2322 Type 'string' is not assignable to type 'Date'`. 2.2: `git diff main -- package.json package-lock.json` solo añade el script `calendario:cargar`; ninguna dependencia. 2.3: `grep -n '\bDate\b'` sobre `src/calendar/*.ts` y los cinco ficheros nuevos de `src/db/`: en código solo `time.ts` (7 apariciones); en los demás aparece únicamente en comentarios que dicen que no aparece. | ✅ |
| CA-3 — identidad de partido derivada y estable | `src/calendar/ids.ts` (`matchId`, `seasonSlug`) | `tests/calendar/ids.test.ts` — el ejemplo literal de ADR-017 §3, determinismo, local/visitante intercambiados, jornada distinta, `MatchIdSchema` y `^[a-z0-9-]+$` (6 casos) | 2026-09-02 · `tests/calendar/ids.test.ts` 6/6, el ejemplo literal de ADR-017 §3 incluido. En la carga real (sonda E) `matches.id` es exactamente `futgal-preferente-g1-2026-27-j1-ud-ourense-rc-celta-b` y no cambia al mover el kickoff. | ✅ |
| CA-4 — carga upsert transaccional, sin borrado, identidad inmutable | `src/calendar/declared.ts` (`declareCalendar`, `readCalendarFile`, `declaredMatches`; mitad pura) y `src/db/calendar.ts` (`loadSchedule`, `LoadResult`, `CompetitionRedefinedError`; una transacción; desde la segunda vuelta consume `file.matches` en vez de reconvertir, F-SPEC-010-10); `src/db/arrays.ts` (literales de array); `migrations/0003` (trigger `matches_identity_is_immutable`, índices `matches_one_home_per_round` / `matches_one_away_per_round`) | `tests/db/calendar-load.test.ts` «CA-4» — 4.1 tablas exactas, ids de CA-3 y kickoffs de CA-2; 4.2 recarga idéntica (`inserted: []`, `updated: []`, tablas iguales); 4.3 kickoff+venue cambiados → `updated`, id fijo; 4.4 partido menos → `orphans`, sigue en la base; 4b huérfanos solo en jornadas declaradas; 4.5 `Observation` sobrevive a la recarga; 4.6 `home_id`/`away_id`/`round`/`competition_id` rechazados por la base con «immutable … RN-13», `kickoff`/`venue` admitidos; 4.7 competición redefinida → `CompetitionRedefinedError` y snapshot igual; 4.8 fila manual colisionando con `matches_one_home_per_round` → la carga falla y ningún snapshot cambia, `calendar_loads` vacía. 4.9: `_harness.ts` sin diff (`git diff main -- tests/db/_harness.ts` vacío) y las nueve suites previas verdes. Pura: `tests/calendar/declared.test.ts` (digest, JSON roto, kickoff inexistente/ambiguo nombrando jornada y partido) | 2026-09-02 (2ª vuelta) · Diff de la vuelta toca `src/db/calendar.ts` (consume `file.matches`) y `src/calendar/declared.ts` (`DeclaredCalendar.matches`), leídos: `loadSchedule` ya no convierte nada y sigue siendo una sola `sql.begin`. Sonda propia contra el Postgres de test tras `drop schema` + `migrate`: 4.1 `inserted=4`, ids de CA-3 y kickoffs `15:00Z`/`16:00Z`/`10:00Z`/`15:00Z` (CA-2); 4.2 recarga `inserted=[] updated=[]` y `competitions`/`teams`/`matches` `deepStrictEqual` antes y después; 4.3 kickoff+venue → `updated=[j1-ud-ourense-rc-celta-b]`, fila con hora y campo nuevos, id fijo; 4.4 partido menos → `orphans=[j2-rc-celta-b-cd-exemplo]` y sigue en la base; 4.5 la `Observation` sigue apuntando al mismo `match_id` con la FK en pie; 4.6 `home_id`/`round`/`competition_id` → `23001` «immutable (ADR-017…)», `kickoff`/`venue` admitidos; 4.7 `CompetitionRedefinedError` y snapshot de las cuatro tablas igual; 4.8 fila manual `(competition_id, round 1, home cd-novo)` bajo otro id + fichero que la declara → `23505 matches_one_home_per_round`, snapshot igual incluida `calendar_loads` y el equipo nuevo del fichero **no** insertado. `tests/db/calendar-load.test.ts` 18/18. 1ª vuelta: `tests/db/calendar-load.test.ts` 18/18 contra el Postgres de test (4.1–4.8 y 4b). 4.9: `git diff main -- tests/db/_harness.ts tests/db/parity.test.ts src/db/ports.ts` vacío; las nueve suites previas de `tests/db/` suman 144/144, igual que `main`. Sondas propias contra la base: `update matches set id = …` también rechazado por `matches_identity_is_immutable`; la carga real por CLI dos veces con el mismo fichero → `inserted 0 / updated 0 / orphans 0`; con kickoff movido y un partido menos → `updated 1`, `orphans 1` nombrado y el partido sigue en `matches`. | ✅ |
| CA-5 — cada carga deja constancia (`calendar_loads`, append-only) | `src/db/calendar.ts` paso 5; `migrations/0003` (`calendar_loads`, `calendar_loads_are_immutable` con `reject_amendment` de 0001, `check (length(declared_by) > 0)`) | `tests/db/calendar-load.test.ts` «CA-5» — una fila con `competition_id`, `declared_by`, `declared_at` normalizado de `+02:00` a `Z`, `loaded_at` del reloj falso, `file_digest` = sha256 de los bytes, `rounds = [1,2]`, `matches_count 4`, `inserted 4`, `updated 0`; 5.1 segunda carga añade otra fila con `inserted = 0`; contadores tras una carga con un `updated`; 5.2 `update`/`delete` rechazados («append-only»); 5.3 `declared_by = ''` rechazado por el `CHECK` | 2026-09-02 · `calendar-load.test.ts` «CA-5» 5/5: `declared_at` `+02:00` → `2026-09-02T08:00:00.000Z`, `loaded_at` del reloj falso, sha256 de los bytes, `rounds [1,2]`, 5.1 segunda fila con `inserted 0`, 5.2 «append-only», 5.3 CHECK. Sonda E: cuatro cargas reales (una por `loadSchedule`, tres por CLI) → filas `calendar_loads` id 1..4 con `inserted/updated` 4/0, 0/0, 0/0, 0/1 y `matches_count` 4, 4, 4, 3; la carga inválida no dejó fila. | ✅ |
| CA-6 — CLI `calendario:cargar`, recuentos y fallos claros | `src/calendar/cli.ts` (punto de entrada; hook de resolución + import dinámico, como los CLI de SPEC-002), `src/calendar/command.ts` (`main(argv, io)` con `env`, `stdout`, `stderr`, `openClient`, `load` inyectados; código de salida 0/1); `package.json` script `calendario:cargar`; `tests/polite/support/capability.ts` `ENTRY_POINTS` += `src/calendar/cli.ts` con motivo. **Segunda vuelta (F-SPEC-010-10)**: el paso 1 valida también las horas, porque `declareCalendar` (`src/calendar/declared.ts`) calcula `DeclaredCalendar.matches`; un kickoff inexistente o ambiguo sale con `InvalidScheduleError` antes de `requireDatabaseUrl` y de `openClient` | `tests/calendar/command.test.ts` (`npm test`) — fichero válido: `inserted`/`updated`/`orphans` (con ids)/`load id` en stdout, exit 0, cliente cerrado; inválido: error de CA-1 nombrando la fila, exit 1, **`openClient` no llamado**; fichero inexistente; sin `DATABASE_URL`: exit 1 con «DATABASE_URL is not set»; sin ruta: usage; carga fallida: exit 1 y cliente cerrado; **dos casos arrancan `node src/calendar/cli.ts` de verdad** (inválido, y válido sin `DATABASE_URL`); **segunda vuelta**: fichero con `2027-03-28 02:30` → exit 1, `opened` vacío, `end()` no llamado, `round 2, match sd-inventada-ud-ourense` y `does not exist` en stderr, sin «load failed» (10 casos en el fichero; rojo antes del cambio). `tests/db/cli.test.ts` — `main` con cliente real: 4/0/0 y el id de la fila; 0/1/1 nombrando el huérfano; competición redefinida → exit 1 sin fila nueva. `tests/polite/architecture.test.ts` 17 (ENTRY_POINTS versionado) sigue verde, 91/91 | 2026-09-02 (2ª vuelta) · `src/calendar/command.ts` leído: solo cambia el comentario; el orden sigue siendo `readCalendarFile` → `requireDatabaseUrl` → `openClient`, y `readCalendarFile` ahora incluye la conversión de hora (`declareCalendar`). CLI real (`node src/calendar/cli.ts`, sonda propia): fichero válido con `DATABASE_URL` real → exit 0, `inserted: 0 / updated: 1 / orphans: 1 / orphan (still in the database): manual-colision / teams inserted: 0 / load id: 5`; hueco horario `2027-03-28 02:30` con `DATABASE_URL=postgres://…@example.invalid` → exit 1 en 116 ms, `round 2, match sd-inventada-ud-ourense: kickoff 2027-03-28 02:30 does not exist in Europe/Madrid`, sin «load failed»; hora ambigua `2026-10-25 02:30` sin `DATABASE_URL` → exit 1, `round 1, match ud-ourense-rc-celta-b: … is ambiguous`; inválido CA-1 → exit 1 nombrando la fila; válido sin `DATABASE_URL` → exit 1 `DATABASE_URL is not set`. `calendar_loads` 4 → 5: solo la carga válida dejó fila. `tests/calendar/command.test.ts` 10/10, `tests/db/cli.test.ts` 3/3. **F-SPEC-010-10 cerrado de verdad**: el error del hueco sale antes de que exista cliente (host inexistente y sin URL dan el mismo mensaje en < 120 ms). 1ª vuelta: `tests/calendar/command.test.ts` 9/9 (dos arranques reales de `node src/calendar/cli.ts`) y `tests/db/cli.test.ts` 3/3 con cliente real. Sonda E, CLI real con `DATABASE_URL` apuntando a la rama de test: fichero válido dos veces → exit 0 y `inserted: 0 / updated: 0 / orphans: 0 / teams inserted: 0 / load id: N`; fichero con kickoff movido y un partido menos → `updated: 1 / orphans: 1` con el id del huérfano; fichero inválido de CA-1 → exit 1 nombrando la fila y `openClient` sin llamar (test). `ENTRY_POINTS` gana `src/calendar/cli.ts` con motivo; `ALLOWED_PACKAGES` sin diff. **Nota de forma**: la spec dice «`main` recibe `sql` y `argv` … como `migrate.main`», pero `migrate.main()` no recibe nada; aquí `main(argv, io)` recibe `openClient: (url) => Sql`, que es lo que permite afirmar «sin haber abierto conexión». Se acepta como cumplimiento del CA. El idioma de la salida (inglés) no lo fija el CA: F-SPEC-010-9 queda para el gate. Ver también F-SPEC-010-10. | ✅ |
| CA-7 — `PostgresObservationStore`: append idempotente, conflicto nombrado | `src/db/observations.ts` (`PostgresObservationStore`, `ObservationConflictError`); `insert … on conflict (id) do nothing returning`, y si no devuelve fila, lee y compara. **Segunda vuelta (F-1)**: `storedForm` normaliza `observed_at` a la forma que la base devuelve (`.000Z`) al entrar, tras zod y antes de la primera consulta, con `instantOf(epochMsOf(…))` de `@/polite/clock` (sin `Date`, CA-2.3); la escritura y `sameObservation` ven esa forma | `tests/db/observations.test.ts` — **segunda vuelta**, describe «CA-7.1 and CA-7.4 — an observed_at WITHOUT milliseconds (F-1)», 4 casos: 7.1 `append('…:40:00Z')` devuelve la forma almacenada y `getById` la lee `toEqual`; 7.4 replay del mismo objeto sin milisegundos → una fila, sin error (**rojo antes del cambio**, `ObservationConflictError` en `:88`); 7.4 replay con la forma almacenada; 7.5 mismo id sin milisegundos y `away_score` distinto sigue siendo conflicto (14 casos en el fichero). Primera vuelta: 7.1 `append` devuelve la guardada, `getById` `toEqual`, `observed_at` cadena `Z` con `InstantSchema`, salida congelada, semilla legible con `confidence` numérico; 7.2 `listByMatch` por `observed_at` y luego `id` (empate forzado), solo ese partido, `[]` y `null` en desconocidos; 7.4 replay: una fila y la segunda llamada devuelve la guardada; 7.5 mismo id y `home_score` distinto → `ObservationConflictError` nombrando el id, la fila conserva lo primero; 7.6 `match_id` inexistente → `code 23503` «foreign key», sin envolver. **7.3** en `tests/stores/entry-validation.test.ts` (`npm test`): `Sql` espía con `Proxy` que cuenta y lanza; `scheduled` con `home_score: 1` → `ZodError` y **0 llamadas**; control positivo: una válida sí llega al espía. **7.7** en `tests/types/spec010-stores.test-d.ts`: `@ts-expect-error` sobre `update`/`delete`, y `keyof` de la clase igual al del puerto | 2026-09-02 (2ª vuelta) · **F-1 reproducido y cerrado.** Sonda propia contra el Postgres de test con el objeto literal del finding (`observed_at: '2026-09-06T15:40:00Z'`, `InstantSchema.safeParse` → `true`): `append#1` devuelve `…15:40:00.000Z` congelado; `append#2` del mismo objeto **no lanza** y devuelve la misma fila; `getById` `deepStrictEqual` a lo devuelto por las dos llamadas; `count(*)` = 1; el replay con la forma `.000Z` también es inofensivo; `away_score: 3` bajo el mismo id → `ObservationConflictError` y la fila conserva `away_score=0`. En conexión fresca (primera sentencia) igual. Borde: `observed_at` con seis decimales entra y sale como `.123Z` en `append` y `getById` (F-SPEC-010-12). 7.3: `storedForm` se ejecuta **después** de `ObservationSchema.parse` y no toca SQL (`src/db/observations.ts:90`); el espía de `tests/stores/entry-validation.test.ts` sigue en 0 llamadas (5/5). CA-2.3: `grep -n '\bDate\b'` sobre `src/db/observations.ts` y `src/db/decisions.ts` da solo comentarios; el conversor es `instantOf(epochMsOf(…))` de `src/polite/clock.ts`. 7.6 `23503 observations_match_id_fkey` sin envolver; 7.2 orden `observed_at, id`. `tests/db/observations.test.ts` 14/14. **CA-7.1 con la Decisión 7**: «`append(o)` devuelve la `Observation` guardada; `getById` devuelve un valor `toEqual` al que se guardó» — lo guardado es la forma almacenada, `append` la devuelve y `getById` es `toEqual` a ella; ambas grafías satisfacen `InstantSchema` y ADR-006. Cumple tal como está escrito. 1ª vuelta: `tests/db/observations.test.ts` 10/10; 7.3 `tests/stores/entry-validation.test.ts` 5/5 con el espía; 7.7 `spec010-stores.test-d.ts` y sonda `tsc` propia (`update`/`delete` → `TS2339` en las dos clases). **Pero CA-7.4 no se sostenía para toda `Observation` válida**: sonda A contra el Postgres de test, `append(o)` dos veces con `o.observed_at = '2026-09-06T15:40:00Z'` (sin milisegundos; `InstantSchema` = `z.iso.datetime({ offset: false })` lo acepta) → la primera devuelve `…15:40:00.000Z` (≠ `o`, así que 7.1 `toEqual` tampoco), la segunda lanza `ObservationConflictError` porque `sameObservation` compara `observed_at` con `===` (`src/db/observations.ts:54-55`, `:82-88`). Con `.000Z` sí es idempotente. **Finding F-1**, cerrado en la 2ª vuelta (`22e6c05`). | ✅ |
| CA-8 — `PostgresDecisionStore`: versiones contiguas, una gana | `src/db/decisions.ts` (`PostgresDecisionStore`, `DecisionVersionConflictError`, `isVersionConflict`: `23505` sobre `decisions_pkey` o `23000` del trigger); `migrations/0003` (`decisions_versions_are_contiguous`, **AFTER INSERT**, ver decisión 2); array como literal `pgTextArray(...)::text[]`. **Segunda vuelta**: `storedForm` normaliza `decided_at` igual que CA-7, para que los dos repositorios traten un instante de la misma manera (nota del verificador en F-1; ningún CA lo exige) | `tests/db/decisions.test.ts` — **segunda vuelta**: un caso de simetría, `decided_at: '…:01Z'` → `append` devuelve `.000Z` y `getLatestByMatch` lo lee `toEqual` (12 casos en el fichero; ya pasaba antes del cambio porque `append` devuelve la fila de la base, se deja como red). Primera vuelta: 8.1 v1 guardada, `getLatestByMatch` `toEqual`, congelada, `decided_at` `Z`, tupla no vacía, `rule` en `DECISION_RULES`, `null` sin decisiones; 8.2 v2 tras v1 vigente; v3 tras v1 → `DecisionVersionConflictError` («not contiguous»); v2 sobre vacío → conflicto; misma versión dos veces → conflicto y la primera queda; 8.3 log ascendente y solo ese partido; 8.4 soporte de otro partido → `decisions_supporting_observations_exist`, `23503`, **no** envuelto; **8.5 dos `append` concurrentes con `version: 1` desde dos `connect()` distintos → exactamente 1 éxito y 1 `DecisionVersionConflictError`, después `version: 1` vigente y una fila** (Postgres real); 8.6 segunda red: `insert` SQL con `'RN-13'` → `decisions_rule_shape`. **8.6 (zod)** en `tests/stores/entry-validation.test.ts`: `rule: 'RN-13'` y soporte vacío → `ZodError`, 0 llamadas, control positivo. **8.7** en `tests/types/spec010-stores.test-d.ts` | 2026-09-02 (2ª vuelta) · `src/db/decisions.ts` leído: `storedForm` tras `DecisionSchema.parse`, sin SQL, sin `Date`; el resto del módulo sin cambios. Sonda propia: `decided_at: '…15:42:00Z'` entra y `append` devuelve `.000Z` congelado, `getLatestByMatch` `deepStrictEqual`; `v2` sobre vacío, `v3` tras `{1}` y `v1` repetida → `DecisionVersionConflictError`; carrera `v2`/`v2`/`v3` desde tres conexiones frescas → `VersionConflict | OK | VersionConflict`, log `[1,2]`, vigente 2; salto por SQL → `23000` «not contiguous: the next version is 3»; 8.4 soporte de otro partido → `23503` «supporting observation … does not exist for match …» sin envolver; 8.6 `'RN-13'` por SQL → `23514 decisions_rule_shape`; zod con espía 0 llamadas. `tests/db/decisions.test.ts` 12/12. 1ª vuelta: `tests/db/decisions.test.ts` 11/11 contra el Postgres de test, 8.5 con dos `connect()`; 8.6 zod con espía y CHECK por SQL; 8.7 tipos + sonda `tsc`. Sonda B propia: carrera `v2`/`v2`/`v3` sobre `{1}` desde **tres** conexiones frescas → un `DecisionVersionConflictError`, dos éxitos y log final `[1,2,3]` sin hueco; `insert` SQL directo con `version 5` sobre `{1,2,3}` → `23000` «not contiguous: the next version is 4». El trigger es `AFTER INSERT` y comprueba «existe la versión inmediatamente anterior o la nueva es 1»: bajo READ COMMITTED equivale a `version = max + 1` de ADR-017 §5 (una versión superior a las visibles no puede existir sin violar la propia contigüidad) y la clave primaria arbitra el empate. Cumple. | ✅ |
| CA-9 — `PostgresMatchStore`: lecturas parseadas, ordenadas, por intervalo | `src/calendar/ports.ts` (`MatchStore`, puerto nuevo: `getById`, `listByRound`, `listByTeams`, `listKickoffsBetween`), `src/db/matches.ts` (`PostgresMatchStore`) | `tests/db/matches.test.ts` — sobre la carga de los dos fixtures: `getById` `toEqual` con `kickoff` `Z` y `venue` `null` donde toca, desconocido → `null`; `listByRound(…, 1)` por kickoff e id y nada de la 2, jornada inexistente `[]`; `listByTeams` par ordenado → uno, invertido → `[]`, otra competición → `[]`; `listKickoffsBetween` de las dos competiciones con `from` igual a un kickoff (entra) y `to` igual a dos kickoffs (salen), y con `to` + 1 ms entran los dos ordenados por kickoff e id; intervalo vacío `[]`; todo por `MatchSchema.parse` | 2026-09-02 · `tests/db/matches.test.ts` 11/11 contra el Postgres de test: `getById` `toEqual` con `kickoff` `Z` y `venue null`; `listByRound` por kickoff e id, jornada inexistente `[]`; `listByTeams` par, invertido y otra competición; `listKickoffsBetween` con `from` incluido y `to` excluido sobre dos competiciones, y `to` + 1 ms deja entrar los dos del borde ordenados. SQL leído: `order by kickoff asc, id asc`, casts `::timestamptz`, `MatchSchema.parse` en toda salida. | ✅ |
| CA-10 — `migrations/0003` en orden, sin columnas nuevas en el canónico | `migrations/0003_declared_calendar.sql` — a mano: dos índices únicos, `matches_identity_is_immutable` (BEFORE UPDATE), `decisions_versions_are_contiguous` (AFTER INSERT), tabla `calendar_loads` con `calendar_loads_are_immutable` (`reject_amendment` reutilizado) | `tests/db/calendar-schema.test.ts` — `migrate` sobre esquema vacío devuelve `['0001','0002','0003']` y luego `[]`; 10.1 tabla, índices, triggers y funciones **leídos de la migración con regex** y buscados en `information_schema`/`pg_indexes`; 10.2 columnas exactas de `calendar_loads` y `tests/db/parity.test.ts` **sin diff**; 10.3 toda `tests/db/` previa verde; 10.4 cabecera a mano, sin marcas de generador. `tests/migrations/discovery.test.ts` sigue verde | 2026-09-02 · `tests/db/calendar-schema.test.ts` 8/8: `migrate` → `['0001','0002','0003']` y luego `[]` (también en la sonda propia sobre esquema vacío); nombres leídos de la migración con regex y hallados en `information_schema`/`pg_indexes`; columnas exactas de `calendar_loads`. 10.2: `tests/db/parity.test.ts` 36/36 y sin diff frente a `main`; `src/model/` sin diff. 10.3: 144/144 previos. 10.4: `migrations/0003_declared_calendar.sql` leído entero — SQL a mano, dos índices únicos, dos funciones plpgsql, una tabla, `reject_amendment` reutilizado, sin ORM. | ✅ |
| CA-11 — los tres gates, las dos suites, las suites cerradas enteras | — | **Segunda vuelta**, salidas literales en *«Segunda vuelta»* §Gates: `lint exit=0`, `typecheck exit=0`, `npm test` 842/842 (90 ficheros), `test:db` 210/210 (14 ficheros); 842 − 4 = 838 y 210 − 5 = 205 cuadran con la primera vuelta; `git diff --numstat e14d8ad..HEAD -- tests` borra 3 líneas, las dos `declareCalendar(…).schedule` sustituidas por `parseSchedule` y un blanco, ninguna aserción. Primera vuelta: `lint exit=0`, `npm test` 838/838, `test:db` 205/205. El recuento **caso a caso** es del verificador | 2026-09-02 (2ª vuelta) · Cuatro gates del verificador (salidas literales en *Veredicto → Segunda vuelta*): `lint exit=0`, `typecheck exit=0`, `npm test` 842/842 (90 ficheros, 0 skipped/todo), `npm run test:db` 210/210 (14 ficheros). Caso a caso con `--reporter=json` frente a la 1ª vuelta: `tests/calendar/command` 9→10, `tests/calendar/declared` 6→9, `tests/db/observations` 10→14, `tests/db/decisions` 11→12; `tests/mirror` 244, `tests/site` 98, `tests/docs` 5, `tests/model` 186, `tests/raw` 58, `tests/ingest` 69, `tests/polite` 91, `tests/migrations` 19, `tests/types` 9, `tests/stores` 11 y los ocho ficheros previos de `tests/db` (144) **sin cambio**. Frente a `main`: 842 − 65 nuevos (`calendar` 52, `stores` 11, `types` 2) = 777; 210 − 66 nuevos = 144. `git diff main --numstat -- tests src`: **0 líneas borradas**. `git diff e14d8ad..HEAD --numstat -- tests`: 3 borradas en `tests/calendar/declared.test.ts`, leídas: la línea de `import` (ahora trae también `parseSchedule`) y dos `const schedule = declareCalendar(…).schedule` sustituidas por `parseSchedule(…)`; ninguna aserción. `grep -rnE '(it|test|describe)\.(skip|only|todo)'` sobre `tests/` y `src/` vacío. `package.json` frente a `main`: solo el script `calendario:cargar`; `src/db/ports.ts`, `tests/db/_harness.ts`, `tests/db/parity.test.ts`, `src/model/`, `migrations/0001`/`0002` sin diff. 1ª vuelta: Cuatro gates ejecutados por el verificador (salidas literales en *Veredicto*): `lint exit=0`, `typecheck exit=0`, `npm test` 838/838 (90 ficheros, 0 skipped), `npm run test:db` 205/205 (14 ficheros, 0 skipped). Caso a caso con `--reporter=json`: `tests/mirror` 244, `tests/site` 98, `tests/docs` 5, `tests/model` 186, `tests/raw` 58, `tests/ingest` 69, `tests/polite` 91, `tests/migrations` 19, `tests/types` 9 (7 + 2 nuevos); `tests/db` previos 144 (`ca19` 14, `migrate` 3, `parity` 36, `rate-limit` 14, `rn09` 9, `rn12` 9, `rn13` 5, `scores` 54) + 61 nuevos = 205. `git diff main --numstat -- tests src` no tiene **ninguna línea borrada** en ningún fichero, y 838 − 61 nuevos = 777 y 205 − 61 = 144 coinciden con la línea base de `main`. Ningún `.skip`/`.only`/`.todo` añadido. | ✅ |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

### Segunda vuelta — GREEN (2026-09-02, sdd-verificador)

**GREEN.** Los once CA se cumplen tal como están escritos. F-1 está cerrado
con reproducción propia del caso del finding; CA-4, CA-6 y CA-8 —los que el
diff de esta vuelta toca fuera de CA-7— se han re-verificado con sondas
propias, no solo con los tests del implementador; el resto reutiliza la
evidencia de la primera vuelta porque `git diff e14d8ad..HEAD` no toca ninguno
de sus ficheros (`src/calendar/{schedule,time,ids,ports,cli}.ts`,
`src/db/{matches,arrays}.ts`, `migrations/0003`, fixtures y sus tests sin
diff). La spec pasa a `hecho`.

**Cómo se ha verificado.** Solo artefactos: spec, ADR-017 §5, ADR-006,
ADR-009, ADR-014, ADR-016, código, tests y lo observado al ejecutar. Además de
las dos suites y los cuatro gates, dos sondas propias fuera del repositorio
(scratchpad `v2/db-probe.ts`, `v2/db-probe2.ts`, no commiteadas) contra el
Postgres de test (`DATABASE_URL_TEST`, `ps aux | grep -c '[v]itest'` = 0
antes de cada uso de la base): `drop schema` + `migrate`, carga del fixture
con `loadSchedule`, el caso literal de F-1, los dos repositorios con casos que
los tests no tienen (conexión fresca, seis decimales, tres conexiones en
carrera, soporte de otro partido), CA-4.3–4.8 con snapshots
`deepStrictEqual` de las cuatro tablas, y **cinco arranques de la CLI real**
(`node src/calendar/cli.ts`): válido con `DATABASE_URL` real, hueco horario
contra `example.invalid`, hora ambigua sin `DATABASE_URL`, inválido CA-1
contra `example.invalid`, válido sin `DATABASE_URL`.

**Gates, salidas literales del verificador (worktree, 2026-09-02):**

```
$ npm run lint
> marcador@0.0.1 lint
> oxlint --type-aware
lint exit=0

$ npm run typecheck
> marcador@0.0.1 typecheck
> tsc --noEmit
typecheck exit=0

$ npm test
 Test Files  90 passed (90)
      Tests  842 passed (842)
Type Errors  no errors
   Duration  4.46s (transform 2.29s, setup 0ms, import 9.50s, tests 13.14s, environment 4ms, typecheck 116ms)
test exit=0

$ npm run test:db
Test Files  14 passed (14)
      Tests  210 passed (210)
   Duration  95.70s (transform 121ms, setup 0ms, import 477ms, tests 94.12s, environment 1ms)
test:db exit=0
```

Recuento caso a caso (`--reporter=json`, `test:db`):

```
tests/db previos (SPEC-001, SPEC-008): ca19 14 · migrate 3 · parity 36 · rate-limit 14 · rn09 9 · rn12 9 · rn13 5 · scores 54 = 144 (igual que main)
tests/db de SPEC-010: calendar-load 18 · calendar-schema 8 · cli 3 · decisions 12 (11 en la 1ª vuelta) · matches 11 · observations 14 (10 en la 1ª vuelta) = 66
TOTAL 210 (1ª vuelta 205; main 144); passed=210 failed=0 pending=0 todo=0
```

**F-1, reproducido y cerrado.** Con el objeto literal del finding
(`observed_at: '2026-09-06T15:40:00Z'`):

```
F-1 InstantSchema acepta '2026-09-06T15:40:00Z': true
F-1 append#1 devuelve observed_at=2026-09-06T15:40:00.000Z frozen=true InstantSchema=true
F-1 append#2 (mismo objeto, sin ms) OK sin error; observed_at=2026-09-06T15:40:00.000Z
7.1 getById toEqual append#1: toEqual OK
7.4 getById toEqual append#2: toEqual OK
7.4 filas con id obs-probe-noms: 1
7.5 mismo id sin ms, away_score distinto: lanza ObservationConflictError [esperado]
7.5 la fila conserva away_score=0 (primero=0)
7.4 replay con la forma .000Z: ACEPTADO (no lanza)
7.x conexión fresca, append#1 como primera sentencia: 2026-09-06T15:45:00.000Z
7.x conexión fresca, append#2: 2026-09-06T15:45:00.000Z
```

**Lo que se ha mirado con lupa en esta vuelta y se acepta, con la razón
escrita** (además de los siete puntos de la primera vuelta, que siguen en pie):

8. **`append` devuelve la «forma almacenada» (Decisión 7) y CA-7.1.** El CA
   dice «`append(o)` devuelve la `Observation` guardada; `getById(o.id)`
   devuelve un valor `toEqual` al que se guardó». No dice «`toEqual` a `o`».
   Lo que se guardó es la fila con `observed_at` como la base lo entrega
   (`.000Z`); `append` devuelve exactamente eso y `getById` es `toEqual` a
   ello (medido con `deepStrictEqual`). Las dos grafías son el mismo instante
   y las dos satisfacen `InstantSchema` y ADR-006 («cadena ISO 8601 UTC con
   `Z`»). Devolver la cadena literal de entrada sería mentir sobre la fila y
   rompería `toEqual` entre `append` y `getById`. Cumple tal como está escrito.
9. **La normalización ocurre después de zod y antes de SQL (CA-7.3, CA-8.6).**
   `storedForm(ObservationSchema.parse(observation))`
   (`src/db/observations.ts:90`) y su gemelo en `decisions.ts:98`: `parse`
   primero, `instantOf(epochMsOf(…))` después, ninguna consulta entre medias.
   El espía de `tests/stores/entry-validation.test.ts` sigue en 0 llamadas y
   el control positivo sigue llegando al SQL.
10. **`Date` sigue fuera de `src/db/` (CA-2.3).** `grep -n '\bDate\b'` sobre
    `src/calendar/*.ts` y los cinco ficheros de `src/db/` de esta spec: código
    solo en `src/calendar/time.ts` (6 líneas); en `observations.ts`,
    `decisions.ts`, `calendar.ts`, `matches.ts`, `declared.ts` y `schedule.ts`
    aparece únicamente en comentarios. El conversor que usan los repositorios
    es el de `src/polite/clock.ts`, donde `Date` ya estaba permitido como
    transitorio (ADR-014 §1, SPEC-008).
11. **El cierre de F-SPEC-010-10 se sostiene.** `declareCalendar` calcula
    `matches` tras `parseSchedule`, así que `readCalendarFile` (paso 1 de
    `main`) lanza `InvalidScheduleError` para el hueco de marzo y la hora
    repetida de octubre antes de `requireDatabaseUrl` (paso 2) y de
    `openClient` (paso 3). Medido con la CLI real y `DATABASE_URL` apuntando a
    `example.invalid`: exit 1 en 116 ms con el mensaje de la fila y sin «load
    failed»; un intento de conexión habría dado `ENOTFOUND` u otro mensaje.
    `loadSchedule` consume `file.matches` y ya no importa `declaredMatches`;
    sigue siendo una única `sql.begin`. Los dos tests de `declaredMatches`
    cambian solo cómo construyen el `Schedule` (`parseSchedule` en vez de
    `declareCalendar(…).schedule`, que ahora rechaza ese fichero); sus
    aserciones son las mismas.
12. **Simetría en `PostgresDecisionStore` (CA-8).** Ningún CA la exige; la
    sonda muestra que `decided_at` sin milisegundos entra, sale `.000Z`
    congelado y `getLatestByMatch` es `deepStrictEqual`. Todo lo demás del
    módulo —`isVersionConflict`, la carrera, el trigger— se ha vuelto a
    ejercer y responde igual que en la primera vuelta.
13. **Tres líneas borradas en `tests/` frente a `e14d8ad`.** Leídas una a una:
    un `import` que gana `parseSchedule` y las dos construcciones del punto
    11. Frente a `main`, cero líneas borradas en `tests/` y `src/`.

**Salvedades abiertas para el gate humano** (ninguna bloquea el GREEN; la
decisión es de quien firma):

- **F-SPEC-010-9** — el texto del CLI está en inglés (`report()` en
  `src/calendar/command.ts`), como `db:migrate` y los CLI de SPEC-002. La spec
  no fija idioma y `sdd-lingua` no ha dictaminado. Si el gate decide galego,
  es un cambio de una función con sus literales en i18n; si no, EPIC-MEJORA
  con los otros tres CLI.
- **F-SPEC-010-1** — dictamen de `sdd-legal-datos` antes de commitear el
  primer fichero real de `calendario/`.
- **F-SPEC-010-2** — dictamen de `sdd-competicion` sobre nombres canónicos y
  «un partido por jornada» antes de la primera carga real (paso previo del
  runbook).
- **F-SPEC-010-5** — la reinterpretación de «refresco cada 6 h» de la épica
  (ADR-017 §2) es de `sdd-producto` si el gate la acepta.

**Nuevas en esta vuelta**, ninguna bloqueante: F-SPEC-010-11 y F-SPEC-010-12,
en *Salvedades*.

**Estado:** la spec pasa a `hecho` (rol del verificador). Para el
documentalista: `CLAUDE.md` §Estructura (`src/calendar/`, `tests/calendar/`,
`tests/stores/`, `src/db/arrays.ts`, `migrations/0003`), el runbook de carga,
la referencia cruzada en el ledger de SPEC-001 (F-SPEC-001-3 cerrado) y las
salvedades F-SPEC-010-3, -4, -6, -7, -8, -11, -12 a EPIC-MEJORA.

### Primera vuelta — RED (2026-09-02, sdd-verificador)

**RED por un criterio: CA-7.4 (y con él la mitad `toEqual` de CA-7.1).** Los
otros diez CA se cumplen tal como están escritos, con evidencia propia además
de los tests del implementador. Los cuatro gates están verdes y ninguna suite
cerrada pierde un caso. El fallo es pequeño y está acotado a
`src/db/observations.ts`; la vuelta siguiente debería ser corta.

**Cómo se ha verificado.** Solo artefactos: spec, ADR-017, ADR-006, ADR-009,
ADR-014, ADR-016, código, tests y lo observado al ejecutar. Además de las dos
suites, cuatro sondas propias fuera del repositorio (scratchpad, no
commiteadas): una de tipos con `tsc` y un `tsconfig` que extiende el del
proyecto; una de `parseSchedule` sobre variantes de CA-1; y una contra el
Postgres de test (`DATABASE_URL_TEST`, comprobado antes que ningún otro
`vitest` de integración corriera) que hace `drop schema` + `migrate`, carga el
fixture con `loadSchedule`, ejerce los dos repositorios con casos que los tests
no tienen, y **arranca la CLI real cuatro veces** (mismo fichero dos veces,
fichero cambiado, fichero con kickoff inexistente) con `DATABASE_URL`
apuntando a esa rama.

**Gates, salidas literales del verificador (worktree, 2026-09-02):**

```
$ npm run lint
> marcador@0.0.1 lint
> oxlint --type-aware
lint exit=0

$ npm run typecheck
> marcador@0.0.1 typecheck
> tsc --noEmit
typecheck exit=0

$ npm test
 Test Files  90 passed (90)
      Tests  838 passed (838)
Type Errors  no errors
test exit=0

$ npm run test:db
 Test Files  14 passed (14)
      Tests  205 passed (205)
   Duration  98.52s
test:db exit=0
```

**Findings (RED):**

- **F-1 — `PostgresObservationStore.append` no es idempotente para una
  `Observation` válida cuyo `observed_at` no lleva milisegundos (CA-7.4; y
  CA-7.1 `toEqual`).** `InstantSchema` es `z.iso.datetime({ offset: false })` y
  acepta `2026-09-06T15:40:00Z` igual que `2026-09-06T15:40:00.000Z`;
  `dominio.md` solo exige «cadena ISO 8601 en UTC con sufijo `Z`». La fila
  vuelve de la base como `.000Z` (conversor de `createClient`), y
  `sameObservation` compara columna a columna con `===`
  (`src/db/observations.ts:54-55`), así que el segundo `append` del **mismo**
  objeto ve «contenido distinto» y lanza `ObservationConflictError`
  (`:82-88`). El replay determinista de SPEC-008 CA-10 —la razón de CA-7.4
  según ADR-017 §5— deja de ser inofensivo para ese productor.
  - **Reproducir** (contra el Postgres de test, con las tres migraciones y el
    fixture cargado):
    ```ts
    const o = { id: 'obs-probe-noms', match_id: 'futgal-preferente-g1-2026-27-j1-ud-ourense-rc-celta-b',
      source: 'ceroacero', observed_at: '2026-09-06T15:40:00Z', status: 'live',
      home_score: 1, away_score: 0, confidence: 0.7, raw_ref: 'ceroacero/…/….html' };
    await store.append(o);   // devuelve observed_at '2026-09-06T15:40:00.000Z' (≠ o)
    await store.append(o);   // esperado: la fila guardada, sin error (CA-7.4)
    ```
    **Obtenido:** `ObservationConflictError: observation obs-probe-noms already
    exists with different content: an Observation is never rewritten (RN-13)…`.
    Con `observed_at: '…:41:00.000Z'` el mismo experimento es idempotente, y
    con `away_score` distinto el conflicto sí es un conflicto.
  - **Dónde:** `src/db/observations.ts` (`append`, `sameObservation`). Una vía
    sin `Date` en el módulo: normalizar `valid.observed_at` a la forma
    canónica al entrar con `instantOf(epochMsOf(…))` de `@/polite/clock` (como
    ya hace `src/db/calendar.ts` con `declared_at`) y comparar sobre esa forma;
    o comparar `stored` con el resultado de volver a parsear lo normalizado.
    Y **un caso en `tests/db/observations.test.ts`** con `observed_at` sin
    milisegundos para 7.1 y 7.4, que hoy solo prueban la forma `.000Z`.
  - Nota: `PostgresDecisionStore.append` tiene la misma asimetría (`decided_at`
    `Z` entra, `.000Z` sale), pero ningún CA le pide idempotencia y `toEqual`
    de CA-8.1 se prueba con `.000Z`. No es finding; se anota para que la
    corrección de F-1 no lo deje asimétrico si el implementador prefiere
    normalizar en los dos.

**Lo que se ha mirado con lupa y se acepta, con la razón escrita:**

1. **Trigger `AFTER INSERT` frente a «exige `version = max + 1`» de ADR-017
   §5.** La comprobación «existe la versión inmediatamente anterior o la nueva
   es 1» es equivalente bajo READ COMMITTED: no puede existir una versión
   visible mayor que la nueva sin que la contigüidad ya estuviera rota. La
   sonda B (tres conexiones frescas, `v2`/`v2`/`v3` sobre `{1}`) deja `[1,2,3]`
   sin hueco y un solo conflicto; el `insert` SQL con salto → `23000`. La
   forma difiere del texto del ADR; la garantía es la misma. Cumple CA-8.
2. **`InvalidScheduleError` en vez de `ZodError`.** CA-1 pide «un error que
   nombra la jornada y el partido o el equipo»; lo hace, y mejor que un
   `ZodError` crudo (la sonda CA-1 muestra `round 2, match
   rc-celta-b-cd-exemplo: kickoff …`). Cumple.
3. **`main(argv, io)` con `openClient` en lugar de «recibe `sql`».** La frase
   de la spec cita `migrate.main`, que no recibe nada. La inyección de una
   fábrica es lo que permite el test «`openClient` no llamado» de CA-6. Cumple.
4. **`src/db/arrays.ts`, fichero que la spec no nombra.** Existe por
   F-SPEC-010-6, y la sonda D lo **confirma**: en la primera sentencia de una
   conexión fresca, `sql.array(['x','y'])::text[]` da `malformed array literal:
   "x,y"`. Sin él la CLI (conexión fresca) fallaría en `teams … = any(…)`. No
   contradice ningún CA; queda como salvedad ya registrada.
5. **`teams_renamed` en `LoadResult`**, `id` incluido en la identidad
   inmutable, `season` estrechada solo en el esquema del fichero: ampliaciones
   compatibles con la spec, ninguna resta.
6. **Fixtures**: `tests/fixtures/calendar.ts` es sintético (ADR-009); los dos
   nombres reales (`UD Ourense`, `RC Celta B`) ya estaban en
   `tests/fixtures/model.ts` y la spec los pide expresamente en CA-1.
7. **`Date` nombrado en comentarios** de `declared.ts`, `schedule.ts` y los
   repositorios («`Date` does not appear here»): no es código; CA-2.3 se
   cumple.

**Estado:** la spec vuelve a `en-progreso` (rol del verificador, precedente
de SPEC-008). Cuando F-1 esté corregido, basta rehacer CA-7 y los cuatro
gates; el resto de la evidencia de esta vuelta sigue siendo válida mientras
`git diff` de esta vuelta a la siguiente no toque otros ficheros.

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-010/. Informe HTML opcional: _qa/SPEC-010/informe.html -->
n-a: esta spec no tiene superficie de UI.

## Salvedades / follow-ups
<!-- IDs F-SPEC-010-1, F-SPEC-010-2… con destino (spec futura o EPIC-MEJORA). -->

Abiertas ya al redactar (ver *Notas para el gate humano* de la spec):

- **F-SPEC-010-1** — Dictamen de `sdd-legal-datos` sobre versionar en el
  repositorio una lista de partidos federativa copiada a mano. Destino: **antes
  de commitear el primer fichero real** de `calendario/`; no bloquea la
  aprobación del mecanismo.
- **F-SPEC-010-2** — Dictamen de `sdd-competicion` sobre los nombres canónicos
  del fichero real y sobre la asunción «un equipo juega como mucho un partido
  por jornada». Destino: paso previo del runbook de carga
  (`sdd-documentalista`).
- **F-SPEC-010-3** — El caso cruzado de «un partido por jornada» solo lo cierra
  el cargador, no la base, porque la semilla de `tests/db/_harness.ts` lo viola a
  propósito (ADR-017 §3). Destino: **EPIC-MEJORA**, disparador «la primera vez que
  alguien inserte partidos por SQL fuera del cargador» o «cualquier trabajo que
  ya toque `_harness.ts`».
- **F-SPEC-010-4** — La divergencia entre el fichero versionado y la copia
  cargada no la avisa nada: `calendar_loads.file_digest` permite detectarla, no
  vigilarla. Destino: **EPIC-MEJORA**, disparador «el día que haya CI» (con
  F-SPEC-004-3 · F-SPEC-005-4).
- **F-SPEC-010-5** — `_epica.md` de EPIC-002 dice «refresco cada 6 h» del
  calendario y ADR-017 §2 lo reinterpreta. Destino: `sdd-producto`, si el gate
  acepta la reinterpretación.

Abiertas en la primera vuelta de implementación (2026-09-02):

- **F-SPEC-010-6** — **`postgres.js` serializa mal un array JS en la primera
  sentencia de una conexión nueva.** Medido en CA-8.5: dos `connect()` frescos y
  `sql.array([...])` como parámetro dan `column "supporting_observation_ids" is
  of type text[] but expression is of type text` y, con cast, `malformed array
  literal: "obs-0001,obs-0002"`. El driver infiere el tipo del parámetro al
  construir la consulta a partir de un mapa de tipos que solo rellena después
  de conectar; en la conexión compartida de los tests funciona porque ya no es
  la primera sentencia. Es exactamente la situación de dos instancias del motor
  en Vercel, cada una con su conexión (ADR-004). Resuelto en esta spec
  escribiendo los literales nosotros (`src/db/arrays.ts`: `pgTextArray`,
  `pgIntArray`, con cast `::text[]` / `::integer[]`) en los dos repositorios que
  pasan arrays. **Queda fuera:** los tests de SPEC-001 (`tests/db/rn12`, `rn13`,
  `ca19`, `scores`) siguen usando `sql.array` y pasan porque no es su primera
  sentencia; no se tocan (CA-4.9). Destino: **EPIC-MEJORA**, disparador «cualquier
  código de `src/` que pase un array JS como parámetro a `postgres.js`».
- **F-SPEC-010-7** — **La rama de Neon de `DATABASE_URL_TEST` la comparten los
  worktrees, y dos `test:db` a la vez se corrompen mutuamente.** Medido: durante
  esta implementación el checkout principal (SPEC-009) corrió `test:db` contra
  la misma rama y un `calendar-load.test.ts` vio `relation "competitions" does
  not exist` (el otro proceso había hecho `drop schema`) y, en otra vuelta, las
  filas de la semilla de `_harness.ts` dentro de un esquema que este proceso
  acababa de truncar. Ninguna aserción de esta spec es falsa por ello —el
  arnés hace `drop schema … cascade` por fichero— pero el resultado de una
  ejecución concurrente no es evidencia de nada. Mitigación aquí: comprobar
  `ps aux | grep vitest.mjs` antes de cada `test:db` y repetir. Destino:
  **EPIC-MEJORA** (junto a F-SPEC-008-21, el `ENOTFOUND`), disparador «dos specs
  con base implementándose en paralelo»: una rama de Neon por worktree o un
  cerrojo en `tests/db/_harness.ts`. El verificador tiene que hacer la misma
  comprobación antes de correr `test:db`.
- **F-SPEC-010-8** — **`src/calendar/cli.ts` importa
  `registerProjectResolution` de `src/mirror/cli/node-resolve.ts`.** El hook de
  resolución que Node necesita para `@/…` y los imports sin extensión de
  `src/model/` vive en el directorio del instrumento de SPEC-002 y no tiene
  domicilio neutro; esta spec no lo mueve (sería tocar SPEC-002, `hecho`, sin
  motivo suyo) y lo importa desde allí, como haría cualquier CLI nuevo. Destino:
  **EPIC-MEJORA**, disparador «el tercer CLI fuera de `src/mirror/`»: mover
  `node-resolve.ts` a un `src/cli/` o similar, con una entrada en
  `ALLOWED_PACKAGES` para `node:module` que ya no hable de `src/mirror/`.
- **F-SPEC-010-9** — **El texto del CLI está en inglés**, como `db:migrate`
  (`src/db/migrate.ts`) y los CLI de SPEC-002 (`capturar.ts`). CLAUDE.md
  §Lenguas manda galego con castellano para «todo texto visible al usuario»; el
  operador del spike es el autor y el CLI es herramienta interna, y el
  precedente del repositorio es inglés, pero la spec no lo fija y `sdd-lingua`
  no ha dictaminado. Destino: **gate de esta spec** (si se decide galego, es un
  cambio de una función, `report()` en `src/calendar/command.ts`, con sus
  literales en i18n); si no, **EPIC-MEJORA** con los otros tres CLI.

Abiertas en la primera vuelta de verificación (2026-09-02, sdd-verificador):

- **F-SPEC-010-10** — **Un `kickoff` inexistente o ambiguo se rechaza dentro
  de `loadSchedule`, no en el paso 1 de la CLI.** `readCalendarFile` valida el
  esquema pero la conversión de hora (`declaredMatches`) ocurre en
  `src/db/calendar.ts:98`, ya con el cliente creado por
  `src/calendar/command.ts:96`. Medido con la CLI real: fichero con `2027-03-28
  02:30` → exit 1, la fila nombrada, ninguna consulta ejecutada (la conversión
  va antes de `sql.begin`), pero el mensaje sale como `load failed, nothing
  was written: the declared calendar is invalid: …` y `openClient` se ha
  llamado. No es un CA incumplido: CA-6 habla del «error de CA-1», y la lista
  de CA-1 no incluye el hueco horario; §4 paso 1 dice «con el esquema». Sí es
  lo contrario de lo que promete la cabecera de `src/calendar/declared.ts`
  («validated WHOLE before anything downstream sees it»). Destino: **misma
  vuelta que F-1 si el implementador quiere** (mover `declaredMatches` a
  `declareCalendar`, o llamarlo en `main` antes de `requireDatabaseUrl`, y un
  caso en `command.test.ts` con `opened` vacío para ese fichero); si no,
  **EPIC-MEJORA** con disparador «el primer operador que lea `load failed`
  para un fichero que nunca llegó a la base».
  **CERRADA en la segunda vuelta (2026-09-02, sdd-implementador, `9a7f380`)**:
  `DeclaredCalendar` lleva `matches`, calculado en `declareCalendar`, así que
  el hueco o la ambigüedad horaria salen por el paso 1 de `main` antes de
  `requireDatabaseUrl` y de `openClient`; `loadSchedule` consume
  `file.matches`. Caso en `tests/calendar/command.test.ts` con `opened` vacío y
  sin «load failed»; comprobado con la CLI real sin `DATABASE_URL` (exit 1,
  `round 2, match sd-inventada-ud-ourense: kickoff 2027-03-28 02:30 does not
  exist in Europe/Madrid`). Nada queda para EPIC-MEJORA.
- **F-SPEC-010-6, confirmado por el verificador**: la sonda D reproduce el
  fallo del driver en la primera sentencia de una conexión fresca (`malformed
  array literal: "x,y"`). La salvedad y su destino no cambian; se anota que ya
  no es solo palabra del implementador.

Abiertas en la segunda vuelta de verificación (2026-09-02, sdd-verificador):

- **F-SPEC-010-11** — **`PostgresMatchStore` devuelve objetos no congelados;
  los otros dos repositorios sí.** `MatchSchema` (SPEC-001, `src/model/match.ts`)
  no termina en `.readonly()` y `ObservationSchema`/`DecisionSchema` sí, así
  que `getById` de `matches` sale con `Object.isFrozen === false` (medido).
  CA-9 solo exige «todo sale por `MatchSchema.parse`», que se cumple; CA-7.1
  sí exige congelado y se cumple. No es un finding: es una asimetría heredada
  del modelo canónico, fuera del alcance de esta spec (tocar `src/model/` es
  reabrir SPEC-001). Destino: **EPIC-MEJORA**, disparador «la primera spec que
  toque `src/model/match.ts` o que necesite mutar un `Match` leído».
- **F-SPEC-010-12** — **Un instante con más de tres decimales se trunca a
  milisegundos al entrar en los repositorios, en silencio.** `InstantSchema`
  (`z.iso.datetime({ offset: false })`) acepta `2026-09-06T15:46:00.123456Z`;
  `storedForm` lo convierte con `instantOf(epochMsOf(…))` y se escribe y se lee
  `…:00.123Z` (medido: `append` y `getById` coinciden, el replay es
  idempotente). Es coherente con el conversor de `createClient`
  (`new Date(value).toISOString()`), que ya perdía los microsegundos al leer,
  así que la normalización solo adelanta al borde de entrada una pérdida que
  ocurría al salir. Ningún CA lo contradice y ningún productor actual emite
  más de tres decimales (`toISOString`). Destino: **EPIC-MEJORA**, disparador
  «una fuente o un `Clock` que emita instantes con precisión mayor que el
  milisegundo», junto a la decisión de si `InstantSchema` debe estrechar los
  decimales a tres.

## Decisiones del implementador (sin fijar en la spec; para el verificador)

1. **`InvalidScheduleError` y no `ZodError` crudo.** CA-1 pide «un error que
   nombra la jornada y el partido o el equipo». `parseSchedule` envuelve los
   `issues` de zod en un error propio con una línea por problema, y a los
   fallos de campo (kebab-case, `kickoff`, `round`) les antepone la fila leída
   del fichero de entrada (`round 2, match rc-celta-b-cd-exemplo: …`) y el
   valor recibido (`(got "UD_Ourense")`). `ScheduleSchema` sigue exportado para
   quien quiera zod puro.
2. **El trigger de contigüidad es `AFTER INSERT`, no `BEFORE`.** Un `BEFORE`
   hablaba antes que el `CHECK decisions_version_positive` y que la clave
   primaria de 0001, y `tests/db/rn12.test.ts` (SPEC-001 CA-15) afirma con dos
   aserciones cuál de esos dos nombra un duplicado y un cero; con `BEFORE`
   caían las dos (medido) y CA-4.9 prohíbe tocarlas. El `AFTER` comprueba que
   exista la versión inmediatamente anterior (o que la nueva sea 1); la
   concurrencia la sigue arbitrando la clave primaria. El repositorio mapea las
   dos formas (`23505` sobre `decisions_pkey`, `23000` «not contiguous») al
   mismo `DecisionVersionConflictError`.
3. **`LoadResult` lleva `teams_renamed` además de lo que §4.5 enumera.** §4.2
   dice que el renombrado de un `canonical_name` «el resultado lo dice»; la
   lista de §4.5 no lo recoge. Se devuelve la lista de `TeamId` renombrados y
   el CLI la imprime.
4. **`matches_identity_is_immutable` rechaza también cambiar `id`.** CA-4.6
   enumera `home_id`, `away_id`, `round`, `competition_id`; el `id` se deriva de
   ellos y cambiarlo suelto dejaría huérfanas las claves ajenas igual, así que
   el trigger lo incluye.
5. **El esquema del calendario estrecha `season` a `^\d{4}/\d{2}$`** (§2: «en la
   forma de la RFGF, `2026/27`») **sin tocar `SeasonSchema` del modelo canónico**,
   que sigue siendo `z.string().min(1)` (SPEC-001). Y `declared_at` admite
   offset en el fichero (`+02:00`) y se normaliza a `Z` al cargar con
   `instantOf(epochMsOf(...))` de `src/polite/clock.ts`, sin `Date` en el cargador.
6. **`loadSchedule(sql, file, { clock })` recibe un `DeclaredCalendar`** (bytes +
   digest + calendario validado, de `declareCalendar`/`readCalendarFile`), no
   una ruta: así el CLI puede validar y rechazar **antes** de abrir conexión
   (CA-6) y los tests cargan desde memoria. La ruta la lee `readCalendarFile`,
   el único I/O de fichero del módulo.

Tomadas en la segunda vuelta (2026-09-02):

7. **El instante se normaliza al entrar, en los dos repositorios, y `append`
   devuelve la forma almacenada.** CA-7.1 dice «`append(o)` devuelve la
   `Observation` guardada; `getById(o.id)` devuelve un valor `toEqual` al que
   se guardó»: lo que se guardó es lo que `append` devuelve, con el instante
   como la base lo entrega (`.000Z`), y `getById` es `toEqual` a eso. No se
   intenta devolver la cadena literal que entró: sería mentir sobre lo que hay
   en la base y rompería `toEqual` entre `append` y `getById`. La comparación
   de CA-7.5 se hace sobre esa forma, así que un instante escrito de dos
   maneras es el mismo instante y un `away_score` distinto sigue siendo
   conflicto. `Date` no entra en `src/db/`: se usa `instantOf(epochMsOf(…))` de
   `src/polite/clock.ts`, como ya hacía `src/db/calendar.ts` con `declared_at`.
   `PostgresDecisionStore` recibe la misma normalización aunque ningún CA se la
   pida, porque el verificador señaló la asimetría y porque dos repositorios
   con dos criterios para un instante es una regla que deja de ser una.
8. **`DeclaredCalendar.matches` en vez de convertir en el cargador.** De las
   dos vías que ofrecía F-SPEC-010-10 (mover la conversión a `declareCalendar`
   o llamarla en `main`), la primera: así hay UNA conversión, la cabecera de
   `declared.ts` vuelve a ser cierta para todo el que llame a
   `declareCalendar`, y `loadSchedule` recibe filas listas. `declaredMatches`
   sigue exportado para quien tenga un `Schedule` sin bytes. Los dos tests de
   `declaredMatches` que construían el `schedule` con `declareCalendar(…)`
   pasan a construirlo con `parseSchedule`, porque `declareCalendar` ahora
   rechaza ese fichero; sus aserciones no cambian.

## Primera vuelta — lo que se implementó y cómo (2026-09-02, sdd-implementador)

**Orden seguido**: CA-1 → CA-2 → CA-3 (puras) → CA-10 (migración) → CA-4/CA-5
(carga) → CA-7 → CA-8 → CA-9 (repositorios) → CA-6 (CLI) → CA-11. Cada CA con
su test en rojo antes del código (fallo por módulo ausente o por aserción,
comprobado en cada caso), luego verde. Dos rojos que no eran «módulo ausente»
y que cambiaron el diseño: el trigger `BEFORE` que rompía SPEC-001 CA-15
(decisión 2) y el array JS en la primera sentencia de una conexión nueva
(F-SPEC-010-6).

**Commits** (rama `ft/SPEC-010-calendario-y-repositorios`, sobre `98a641f`):
`2a4ece2` CA-1 · `9948c89` CA-2 · `5f66e57` CA-3 · `6ab7832` en-progreso ·
`df02def` CA-10 · `ecf1a5d` CA-4 y CA-5 · `a2efac9` CA-7 · `2a10045` CA-8 ·
`51c959c` CA-9 · `aff51e7` CA-6 · y el commit de este ledger y del paso a
`en-revision`.

**Gates, salidas literales (2026-09-02, worktree, `DATABASE_URL_TEST` disponible,
sin otro `vitest` corriendo contra la rama al arrancar):**

```
$ npm run lint
> marcador@0.0.1 lint
> oxlint --type-aware
lint exit=0

$ npm run typecheck
> marcador@0.0.1 typecheck
> tsc --noEmit
typecheck exit=0

$ npm test
 Test Files  90 passed (90)
      Tests  838 passed (838)
Type Errors  no errors
   Start at  01:30:21
   Duration  4.42s (transform 2.06s, setup 0ms, import 9.32s, tests 13.01s, environment 4ms, typecheck 125ms)
exit=0

$ npm run test:db
 Test Files  14 passed (14)
      Tests  205 passed (205)
   Start at  01:28:42
   Duration  95.64s (transform 122ms, setup 0ms, import 484ms, tests 94.15s, environment 1ms)
exit=0
```

Línea base en `main` (misma máquina, antes de tocar nada): `npm test` 777/777
en 81 ficheros; `npm run test:db` 144/144 en 8 ficheros (la primera ejecución
dio `ENOTFOUND` contra Neon y se repitió: F-SPEC-008-21).

**Ficheros nuevos**: `src/calendar/{schedule,time,ids,declared,ports,command,cli}.ts`,
`src/db/{calendar,observations,decisions,matches,arrays}.ts`,
`migrations/0003_declared_calendar.sql`, `tests/fixtures/calendar.ts`,
`tests/calendar/{schedule,time,ids,declared,command}.test.ts`,
`tests/stores/{entry-validation,pg-array-literal}.test.ts`,
`tests/types/{calendar-time,spec010-stores}.test-d.ts`,
`tests/db/{calendar-schema,calendar-load,observations,decisions,matches,cli}.test.ts`.
**Ficheros tocados**: `package.json` (script `calendario:cargar`),
`tests/polite/support/capability.ts` (una entrada en `ENTRY_POINTS` con motivo).
**Sin tocar**: `src/db/ports.ts`, `src/db/client.ts`, `src/db/migrate.ts`,
`migrations/0001`, `migrations/0002`, `tests/db/_harness.ts`,
`tests/db/parity.test.ts`, `src/model/`, `src/ingest/`, `src/polite/`,
`ALLOWED_PACKAGES`, ningún ADR ni el cuerpo de la spec.

## Segunda vuelta — corrección de F-1 y F-SPEC-010-10 (2026-09-02, sdd-implementador)

**Encargo**: el único finding RED (F-1, CA-7.4 y la mitad `toEqual` de
CA-7.1) y, opcional, F-SPEC-010-10. Los dos hechos con TDD: test en rojo que
reproduce el fallo, corrección, verde, commit. Nada más se ha tocado.

**F-1 — qué pasaba y qué cambia.** `InstantSchema` acepta `…:00Z` y la base
devuelve `…:00.000Z`; `sameObservation` comparaba con `===` y el replay del
mismo objeto lanzaba `ObservationConflictError`. Ahora `append` hace
`storedForm(ObservationSchema.parse(observation))`: zod primero (CA-7.3, el
espía sigue en 0 llamadas), después el instante a la forma almacenada con
`instantOf(epochMsOf(…))` de `@/polite/clock`, y todo lo demás — insert,
lectura, comparación — trabaja sobre esa forma. `PostgresDecisionStore.append`
recibe la misma `storedForm` sobre `decided_at`. `Date` sigue sin aparecer en
`src/db/` (`grep -n '\bDate\b'` sobre `src/calendar/*.ts` y los cinco
ficheros de `src/db/` de esta spec: solo `time.ts`, cinco líneas de código).

**F-SPEC-010-10 — qué pasaba y qué cambia.** La conversión de hora vivía en
`loadSchedule`, con el cliente ya abierto; el operador leía «load failed,
nothing was written» para un fichero que nunca llegó a la base.
`DeclaredCalendar` gana `matches: readonly Match[]`, calculado en
`declareCalendar` tras `parseSchedule`; `loadSchedule` desestructura
`{ schedule, matches }` del fichero y ya no importa `declaredMatches`. La CLI
no cambia de código: su paso 1 (`readCalendarFile`) rechaza ahora también el
hueco de marzo y la hora repetida de octubre, antes de `requireDatabaseUrl`.

**Rojo → verde, medido.** `tests/db/observations.test.ts` «7.4: append twice
of the same object…» falló antes del cambio con `ObservationConflictError` en
`src/db/observations.ts:88`; los otros tres casos nuevos de F-1 y el de
simetría de `decisions.test.ts` ya pasaban (documentan la forma devuelta) y
se dejan como red. Los cuatro casos nuevos de `tests/calendar/` fallaron antes
del cambio (`declareCalendar` no lanzaba; `opened` tenía un elemento).

**Commits** (sobre `e14d8ad`): `22e6c05` fix CA-7 (F-1) · `9a7f380` fix CA-6
(F-SPEC-010-10) · y el commit de este ledger y del paso a `en-revision`.

**Ficheros tocados** (nueve, todos de esta spec): `src/db/observations.ts`,
`src/db/decisions.ts`, `src/db/calendar.ts`, `src/calendar/declared.ts`,
`src/calendar/command.ts` (solo el comentario de cabecera),
`tests/db/observations.test.ts` (+4), `tests/db/decisions.test.ts` (+1),
`tests/calendar/declared.test.ts` (+3, dos construcciones cambiadas),
`tests/calendar/command.test.ts` (+1). **Sin diff**: `tests/db/_harness.ts`,
`tests/db/parity.test.ts`, `src/db/ports.ts`, `src/model/`, `src/polite/`,
`migrations/`, `package.json`, el cuerpo de la spec y los ADR.

**Gates, salidas literales (2026-09-02, worktree, `DATABASE_URL_TEST`
disponible, `ps aux | grep -c '[v]itest.mjs'` = 0 al arrancar `test:db`):**

```
$ npm run lint
> marcador@0.0.1 lint
> oxlint --type-aware
lint exit=0

$ npm run typecheck
> marcador@0.0.1 typecheck
> tsc --noEmit
typecheck exit=0

$ npm test
 Test Files  90 passed (90)
      Tests  842 passed (842)
Type Errors  no errors
   Duration  4.45s (transform 2.11s, setup 0ms, import 9.14s, tests 13.13s, environment 4ms, typecheck 138ms)
test exit=0

$ npm run test:db
 Test Files  14 passed (14)
      Tests  210 passed (210)
   Duration  97.50s (transform 119ms, setup 0ms, import 477ms, tests 95.95s, environment 1ms)
test:db exit=0
```

Frente a la primera vuelta: 838 → 842 (+4, `tests/calendar`), 205 → 210 (+5,
`tests/db`); mismos 90 y 14 ficheros. Ningún `.skip`/`.only`/`.todo`.

**Sonda con la CLI real** (scratchpad, no commiteada): fichero del fixture con
`2027-03-28 02:30` en la jornada 2, `env -u DATABASE_URL node
src/calendar/cli.ts <fichero>` → exit 1, stderr `the declared calendar is
invalid: round 2, match sd-inventada-ud-ourense: kickoff 2027-03-28 02:30 does
not exist in Europe/Madrid: the clock skips it`. Sin `DATABASE_URL` no puede
haber abierto conexión; el mensaje ya no dice «load failed».

**Salvedades nuevas**: ninguna. **Cerrada**: F-SPEC-010-10. F-SPEC-010-9 (idioma
del CLI) sigue para el gate, sin cambios.

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->

**Spec `hecho` (2026-09-02, segunda vuelta de verificación GREEN).** Sin
push ni PR: el orquestador decide el merge. Queda para el gate humano lo
listado en *Veredicto → Segunda vuelta → Salvedades abiertas para el gate
humano* (F-SPEC-010-9 sobre el idioma del CLI la primera) y para
`sdd-documentalista` el cierre documental (punto 5 abajo, más F-SPEC-010-11 y
-12 a EPIC-MEJORA). Lo que hay que saber para seguir:

1. **Antes de correr `test:db`, comprobar que nadie más lo está corriendo**
   contra la misma rama de Neon (`ps aux | grep vitest.mjs`): el checkout
   principal comparte `DATABASE_URL_TEST` y un run concurrente da fallos que no
   son de esta spec (F-SPEC-010-7). Si da `ENOTFOUND`, repetir (F-SPEC-008-21).
2. **Las dos suites**: `npm test` (842) y `npm run test:db` (210). Sin
   `DATABASE_URL_TEST`, CA-4, CA-5, CA-6 (mitad db), CA-7 (salvo 7.3 y 7.7),
   CA-8 (salvo 8.6-zod y 8.7), CA-9 y CA-10 son UNMET, no skipped.
3. **Lo que el verificador tiene que mirar con más cuidado** (también en el
   informe al orquestador): el trigger `AFTER INSERT` (decisión 2) frente al
   texto de ADR-017 §5 «exige `version = max + 1`»; `InvalidScheduleError`
   frente a «rechazada con un error» de CA-1; el idioma del CLI (F-SPEC-010-9);
   que `Date` solo aparezca en `src/calendar/time.ts` (CA-2.3, se lee, no se
   testea); que `ALLOWED_PACKAGES` no ganó entradas y `ENTRY_POINTS` una con
   motivo (CA-6); que `src/db/arrays.ts` es un fichero que la spec no nombra y
   existe por F-SPEC-010-6.
4. **Dónde vive cada cosa**: mitad pura del calendario en `src/calendar/`
   (`schedule` → `declared` → `ids`/`time`); mitad con SQL en `src/db/`
   (`calendar.ts` carga, `observations.ts`, `decisions.ts`, `matches.ts`
   repositorios, `arrays.ts` literales). El puerto nuevo `MatchStore` está en
   `src/calendar/ports.ts`; los de SPEC-001 siguen en `src/db/ports.ts` sin
   diff.
5. **Para el documentalista, tras el GREEN**: `CLAUDE.md` §Estructura
   (`src/calendar/`, `tests/calendar/`, `tests/stores/`, `src/db/arrays.ts`,
   `migrations/0003`), el runbook `docs/procedimientos/carga-del-calendario.md`
   (con el dictamen de `sdd-competicion` como paso previo y `npm run
   calendario:cargar -- calendario/<temporada>/<competition_id>.json`), la
   referencia cruzada en el ledger de SPEC-001 (F-SPEC-001-3 cerrado), y las
   cuatro salvedades nuevas a EPIC-MEJORA.
6. **Para la spec siguiente** (catálogo de alias / `MatchResolver`):
   `PostgresMatchStore.listByTeams(competition, home, away)` devuelve lista;
   `PostgresObservationStore.append` es idempotente ante la misma
   `Observation`, escriba su `observed_at` con o sin milisegundos, y devuelve
   siempre la forma almacenada (`.000Z`), igual que `PostgresDecisionStore`
   con `decided_at`; `PostgresDecisionStore.append` lanza
   `DecisionVersionConflictError` y el motor tiene que decidir qué hacer con él.
   `declareCalendar` devuelve también `matches`: quien cargue un calendario
   desde memoria ya tiene las filas convertidas.
