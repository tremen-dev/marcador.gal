---
id: SPEC-012
tipo: spec
epica: EPIC-002
estado: aprobada
aprobada-por: Alberto Fojo
historial:
  - {estado: borrador, fecha: 2026-09-02, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-09-02, por: Alberto Fojo}
---
# SPEC-012 — Cron de ingesta: el tick que abre ventanas por partido y persiste Observation

> Sigue la descomposición orientativa de `_epica.md` —adaptador ✓ (SPEC-008) ·
> frontera RN-11 ✓ (SPEC-009) · calendario y repositorios ✓ (SPEC-010) ·
> catálogo de alias ✓ (SPEC-011) · **cron de ingesta** · motor · bot · panel ·
> snapshot · cifras—. Su precondición explícita está satisfecha: SPEC-009
> («su fecha real es antes de que el cron despliegue algo que pida a un
> tercero») es `hecho` desde el 2026-09-02. Y la de ADR-009 §6 —ninguna
> ingesta arranca sin decisión de retención— la satisface **ADR-020**, que
> nace con esta spec.
>
> Trae **dos ADRs en `borrador`**: **ADR-019** (la semántica del tick sin
> proceso vivo: ventanas por partido, medición acotada por jornadas
> declaradas, y el estado durable que faltaba —la vigencia del `robots.txt`—)
> y **ADR-020** (la retención del archivo de las jornadas de medición y el
> `raw_ref` colgante como estado declarado).

## Problema

**Todo el camino de la ingesta existe y nadie lo recorre.** El adaptador pide,
archiva y lee (SPEC-008); el ritmo de RN-11 sobrevive al proceso (CA-14); el
calendario da los partidos y sus horas (SPEC-010); el resolver real convierte
nombres de fuente en `MatchId` con confirmación humana detrás (SPEC-011); y
`ObservationStore` guarda con replay inofensivo (SPEC-010). Pero **ninguna
`Observation` ha llegado nunca a la base desde una fuente**, porque no hay
nada que dispare el camino: el cron de planificación es el comentario «todavía
sin escribir» de `CLAUDE.md` desde SPEC-008.

Sin el cron no se mide nada: la **latencia** necesita observaciones fechadas
mientras el partido ocurre, la **cobertura** necesita saber qué partidos
tuvieron fuente viva, y los **conflictos** necesitan observaciones que puedan
discrepar. Tres de las cuatro cifras de la épica están detrás de este tramo.

Y desplegarlo es exactamente el momento contra el que el proyecto lleva tres
specs preparándose. La épica lo dice de SPEC-009 («la infracción es latente
[…] y deja de serlo el día del cron») y vale para todo lo demás: el día del
cron, cada estado que viva en memoria de instancia miente. El ritmo ya está
cerrado (CA-14), pero **la vigencia del `robots.txt` no**: `RobotsGate`
cachea política y sello de intento en un `Map` de instancia, y en Vercel cada
tick es una instancia nueva (ADR-004) — el gate pediría el `robots.txt` en
cada arranque en frío, hasta una petición por minuto y origen. Es
F-SPEC-008-V13 un módulo más allá, medible con la misma vara, y esta spec
existe también para cerrarlo **antes** del primer despliegue (ADR-019 §4).

Hay además una frontera que no es técnica: un cron a 1/minuto con un
calendario de 34 jornadas cargado es, si nadie lo acota, **el sondeo continuo
sobre el que ADR-008 §5.2 dice que no hay lectura benigna**. La épica manda
calcular «las ventanas por partido dentro del tick»; ADR-019 §2 y §3 fijan
qué es una ventana y qué acota el conjunto: el tick solo mira partidos en
ventana **dentro de jornadas de medición declaradas**, una lista cerrada que
nace vacía y cuya primera entrada real espera el dictamen de
`sdd-legal-datos` (SPEC-008 notas §7).

**Lo que esta spec no arregla, dicho en la primera línea:** no escribe
ninguna `Decision` —el motor es la spec siguiente, y «publicado» sigue sin
ocurrir (RN-08, D-3)—, no produce ninguna cifra, no declara ninguna jornada
real y no carga ni calendario ni alias reales.

## Usuarios / roles afectados

- **`sdd-implementador`**: construye la elegibilidad y la composición del tick
  en `src/ingest/`, el `PolicyGate` durable en `src/polite/`, la ruta
  `src/app/api/cron/ingest`, `vercel.json`, `migrations/0005` y las suites.
  La rama tiene que nombrar `SPEC-012`, o el hook `require-spec` deniega la
  escritura sobre `src/` y `tests/`. Necesita `DATABASE_URL_TEST` desde CA-2.
- **`sdd-verificador`**: corre `npm run lint`, `npm test` y `npm run test:db`;
  sin `DATABASE_URL_TEST` los criterios con base son **UNMET, no *skipped***
  (gate del 2026-08-29). Tiene que conducir el tick **construyendo la
  composición de nuevo por tick**, como un arranque en frío (SPEC-008 CA-14),
  y comprobar los controles positivos de CA-3: son los que nombran el defecto.
- **El operador del spike** (el autor, RN-01): es quien declarará cada jornada
  de medición —una entrada con motivo en la lista de ADR-019 §3, con su fecha
  de purga escrita antes (ADR-020 §3)— y quien purga y acusa después. Esta
  spec no le declara ninguna; le deja el mecanismo y el fallo cerrado si no
  hay nada declarado.
- **`sdd-legal-datos`**, consultivo con la pregunta de SPEC-008 notas §7
  **todavía sin contestar**: capturar una jornada entera de `ceroacero.es`.
  Esta spec la convierte en precondición operativa con sitio exacto: **antes
  de declarar la primera jornada de medición**, no antes de escribir código.
- **`sdd-arquitecto`**, como autor de la spec del motor: hereda `observations`
  llenándose por jornada, el registro de intentos como fuente de la lista de
  fallos, y que el `raw_ref` colgante es estado declarado (ADR-020 §4).
- **`sdd-documentalista`**: `vercel.json` y la ruta del cron son estructura
  nueva; el runbook de jornada de medición (declarar → dictamen → cargar →
  purgar → acusar) es suyo tras el GREEN.

## Diseño

### §1. El tick es composición, no código nuevo de captura

El tick conduce piezas de tres specs `hecho` **sin modificar sus ficheros**
(ADR-011 §6): decide qué pares son elegibles (§2), y por cada uno recorre
`SourceAdapter.capture` → `read` (SPEC-008) con el `catalogMatchResolver`
real (SPEC-011) y persiste con `ObservationStore.append` (SPEC-010). Las
implementaciones son las durables y las de producción: `PostgresRateLimit`,
el `PolicyGate` durable de §3, `BlobRawStore`, `systemClock`. Ningún módulo
de `src/ingest/` puede construir la implementación en memoria del ritmo —eso
ya lo fija SPEC-008 CA-14.8 y esta spec lo hereda, no lo reescribe.

La temporada activa que el resolver necesita es **configuración declarada**
junto al registro de fuentes (SPEC-011: «la temporada la entrega la
configuración del llamante, nunca se deduce»).

### §2. Elegibilidad: ventana por partido dentro de jornada declarada (ADR-019 §2 y §3)

Un partido está en ventana en `t` si `kickoff − PRE ≤ t < kickoff + POST`
(`PRE` = 10 min, `POST` = 150 min, constantes nombradas en un solo sitio). Un
par (fuente, competición) es elegible si algún partido suyo está en ventana
**y** su `kickoff` cae dentro de una jornada de medición declarada — la lista
cerrada de intervalos con motivo, que nace **vacía**. La consulta es
`MatchStore.listKickoffsBetween(t − POST, t + PRE)`, escrita en SPEC-010 para
este consumidor.

Un par no elegible no gasta turno, no produce petición y no deja registro.
Sin jornadas declaradas o sin calendario cargado, el tick no hace nada: el
fallo cerrado aquí es el estado natural, no un modo de error.

### §3. La vigencia del `robots.txt` sobrevive al proceso (ADR-019 §4)

Un `PolicyGate` nuevo en `src/polite/` —la cortesía tiene un solo dueño,
ADR-014— reparte la memoria entre lo que ya existe: **el archivo recuerda lo
que volvió** (la política vigente es el `robots.txt` más reciente del raw
store bajo `<source>/robots/` con `fetched_at` dentro de las 6 h, releído y
parseado con `parseRobots` — ningún parser nuevo), y **`request_rhythm`
recuerda lo que salió** (el derecho a intentar un refresco se toma con el
`takeTurn` de SPEC-008 CA-14, clave `robots/<origin>`, intervalo 1 min como
techo de reintento). Vigente → no se pide; sin política y sin refresco
logrado → fallo cerrado y motivo registrado. El refresco archiva antes de
parsear (RN-10) bajo la clave de ADR-014 §3.4. `RobotsGate` en memoria se
queda como está: es el del instrumento supervisado (CA-14.8, F-SPEC-002-2).

### §4. El registro de intentos (ADR-019 §5)

`migrations/0005`: una tabla append-only (`reject_amendment`, como
`calendar_loads`) con una fila por **intento** de un par elegible — instante,
par, `outcome` (`ok`/`skipped`/`failed`), motivo, `raw_ref`, número de
`Observation` persistidas y **los nombres íntegros de las filas no
resueltas** (RN-09: la cola de trabajo del catálogo de alias). Un tick sin
pares elegibles y un turno suprimido por el minuto no escriben nada (SPEC-008
§4). Instantes como cadena `Z` (ADR-006).

### §5. La ruta y su declaración (ADR-019 §1)

`vercel.json` declara un único cron a `* * * * *` hacia la ruta del App
Router. La ruta exige `Authorization: Bearer <CRON_SECRET>`, falla cerrado
sin la variable, **delega entera** en la función del tick de `src/ingest/` y
devuelve el resumen como JSON. La lógica no vive en la ruta: así el tick
queda bajo el alcance del test de arquitectura de SPEC-008 CA-12 y **esta
spec no escribe ningún test de arquitectura nuevo** (ADR-016 no aplica).

### §6. Dónde termina, exactamente

En `ObservationStore.append`. El tick no construye ni escribe ninguna
`Decision` (RN-08, D-3), no publica, no calcula cifras y no toca el motor,
que no existe. Reprocesar un cuerpo ya archivado (`read` + `append` de nuevo)
es inofensivo por construcción: ids deterministas (SPEC-008 CA-10) y `append`
idempotente (SPEC-010 CA-7.4).

## Criterios de aceptación

- **CA-1 — La elegibilidad es una función pura con los bordes exactos
  (ADR-019 §2 y §3).**
  Dada la función de elegibilidad de `src/ingest/` con `PRE` = 10 min y
  `POST` = 150 min como constantes nombradas, un conjunto de partidos
  sintéticos y una lista de jornadas de medición,
  cuando se calcula la selección en un instante `t` (cadena ISO `Z`, nunca
  `Date`),
  entonces: un partido con `kickoff = t + PRE` es elegible y con
  `kickoff = t + PRE + 1 min` no; con `kickoff = t − POST + 1 min` es
  elegible y con `kickoff = t − POST` no (intervalo `[kickoff − PRE,
  kickoff + POST)`); un partido en ventana cuyo `kickoff` cae fuera de toda
  jornada declarada **no** es elegible; con la lista de jornadas **vacía**
  nada es elegible; los bordes `[from, to)` de una jornada declarada se fijan
  con un caso cada uno; y un test cambia `POST` **en su único sitio** y ve
  moverse el borde — el número no está repetido. Función pura, `npm test`.

- **CA-2 — El tick solo conduce pares elegibles, con el ritmo durable, y
  construido de nuevo por tick (RN-11, ADR-004, SPEC-008 CA-14).**
  Dado `DATABASE_URL_TEST` con las migraciones aplicadas, dos competiciones
  cargadas con `loadSchedule` (una con un partido en ventana dentro de una
  jornada declarada, la otra sin nada en ventana), un reloj falso y un
  `HttpFetcher` doble,
  cuando corre el tick,
  entonces sale **una** petición de página —hacia la competición elegible— y
  ninguna hacia la otra, y `request_rhythm` no tiene fila del par no
  elegible. Y además:
  1. Un segundo tick **con composición construida de nuevo** (arranque en
     frío) en el mismo minuto no manda ninguna petición de página; con el
     reloj adelantado 60 s, manda una.
  2. Con ninguna competición elegible, el tick no manda nada, no toma ningún
     turno y no escribe ninguna fila de registro.
  3. El instante del tick sale del `Clock` inyectado y viaja como cadena `Z`
     de punta a punta (ADR-006).

- **CA-3 — La vigencia del `robots.txt` sobrevive al proceso, y el control
  positivo nombra el defecto (ADR-019 §4, ADR-014, RN-10, RN-11).**
  Dado el escenario de CA-2 con el raw store compartido entre composiciones,
  cuando se conducen ticks sucesivos construyendo el `PolicyGate` durable de
  nuevo cada vez,
  entonces:
  1. El primer tick pide el `robots.txt` del origen **antes** que la página,
     lo archiva bajo `<source>/robots/…` **antes de parsearlo** (RN-10, clave
     de ADR-014 §3.4), y captura la página.
  2. Un tick posterior dentro de las 6 h, **con composición nueva**, captura
     la página **sin pedir el `robots.txt`**: cero peticiones de robots en el
     fetcher, la política se releyó del archivo.
  3. Pasadas las 6 h del reloj falso, el siguiente tick lo pide **una** vez y
     sigue.
  4. Si el origen no sirve `robots.txt`, no sale ninguna petición de página
     (fallo cerrado), el intento queda registrado con su motivo, y los
     reintentos de robots quedan limitados por el turno durable: dos ticks en
     el mismo minuto producen **un** intento de robots, no dos.
  5. **Control positivo, y es el que nombra el defecto:** la misma conducción
     de CA-3.2 con el `RobotsGate` en memoria pide el `robots.txt` **en cada
     composición nueva**, y el caso lo afirma como resultado esperado — es la
     reproducción del defecto latente que esta spec cierra, como SPEC-008
     CA-14.3 hizo con el ritmo.
  6. La política se parsea con `parseRobots` de `src/polite/robots.ts`:
     ningún parser nuevo (ADR-014 §4, comprobado en el diff, sin test de
     arquitectura nuevo).
  7. Una URL que la política prohíbe deja el intento en `skipped` con la
     frase de `robotsSkipReason`, sin petición de página y sin bytes
     archivados (hereda SPEC-008 CA-5.1; un caso lo conduce por el tick).

- **CA-4 — De la página archivada a `Observation` persistida, con el resolver
  real y la temporada declarada (RN-01, RN-09, RN-10, ADR-006).**
  Dado el escenario de CA-2 con el catálogo de alias cargado
  (`loadAliasCatalog`: dos filas `confirmed` que cubren un partido, y una
  grafía de un tercer equipo solo `proposed`) y un fetcher doble que sirve un
  fixture **sintético** con la forma de `ceroacero.es` —una fila resoluble
  `live` 2-1, y una fila cuyos equipos no resuelven—,
  cuando corre el tick,
  entonces `observations` contiene **exactamente una** fila: `source:
  'ceroacero'`, `confidence: 0.7` leído del registro (RN-01), `observed_at`
  igual al instante del reloj falso como cadena `Z`, `raw_ref` apuntando al
  objeto archivado por ese mismo tick, y validada (es la salida de
  `ObservationSchema.parse`). Y además:
  1. La fila no resuelta **no** produce `Observation` y sus dos nombres
     íntegros quedan en el registro del intento (RN-09, SPEC-008 CA-13).
  2. La temporada que el tick entrega al resolver es la configuración
     declarada: un test la cambia y la misma fila **deja de resolver** — la
     temporada no se deduce de ningún dato (SPEC-011).
  3. **Reprocesar es inofensivo**: volver a ejecutar la lectura y el `append`
     sobre el **mismo cuerpo archivado** deja `observations` idéntica — ids
     deterministas (SPEC-008 CA-10) más `append` idempotente (SPEC-010
     CA-7.4), comprobados juntos por primera vez.
  4. Tras todo lo anterior, **`decisions` está vacía** (RN-08, D-3): el tick
     no escribió ninguna, y la frontera estática la sigue guardando SPEC-008
     CA-12, que alcanza todo `src/ingest/`; esta spec no añade tests de
     arquitectura (ADR-016 no aplica).

- **CA-5 — El registro de intentos es durable, completo y append-only
  (ADR-019 §5, RN-13 por analogía).**
  Dado el tick de CA-4,
  entonces el registro tiene una fila por intento con par, instante `Z`,
  `outcome`, motivo (`null` en `ok`), `raw_ref`, contador de `Observation`
  persistidas y los nombres no resueltos. Y:
  1. Un intento cuyo archivo o persistencia revienta queda `failed` con el
     motivo, y **el fallo de un par no impide el intento del siguiente** en
     el mismo tick.
  2. `update` y `delete` sobre el registro **los rechaza la base**
     (`reject_amendment`).
  3. Un tick sin pares elegibles (CA-2.2) y un turno suprimido (CA-2.1) no
     escriben **ninguna** fila.

- **CA-6 — `migrations/0005` se aplica en orden y no toca el modelo canónico
  (ADR-006).**
  Dado un esquema vacío,
  cuando se ejecuta `migrate`,
  entonces devuelve `['0001','0002','0003','0004','0005']` y una segunda
  ejecución devuelve `[]`; el test de paridad de SPEC-001 CA-14 pasa **sin
  entradas nuevas** en sus excepciones (el registro de intentos no es modelo
  canónico, como `request_rhythm` no lo es); y toda la suite `tests/db/`
  previa pasa sin tocar una aserción ni la semilla.

- **CA-7 — La ruta del cron autentica, falla cerrado y delega (ADR-019 §1).**
  Dado el handler de la ruta con la función del tick y el entorno inyectados
  (probables sin proceso hijo, como `migrate.main`),
  entonces: sin header `Authorization` responde **401** y la función del tick
  **no se invoca** (ni turno, ni petición, ni fila — un espía lo afirma); con
  un bearer distinto de `CRON_SECRET`, igual; **sin `CRON_SECRET` en el
  entorno**, rechaza y no invoca nada, aunque el header traiga algo (fallo
  cerrado); con el bearer correcto responde **200** con el resumen JSON del
  tick (contadores de intentos por `outcome`). La ruta delega entera y no
  contiene lógica de ingesta: el verificador lo comprueba leyendo el diff.
  La ruta es entrada del repositorio por la regla ya declarada («las rutas de
  `src/app/`», SPEC-008 CA-2.5).

- **CA-8 — `vercel.json` declara exactamente el cron decidido (ADR-004,
  ADR-019 §1).**
  Dado `vercel.json`,
  cuando un test lo lee,
  entonces declara **un** cron, con `schedule` exactamente `* * * * *` y
  `path` exactamente la ruta de CA-7 — el path se compara contra una
  constante declarada en `src/ingest/` de la que deriva la ubicación del
  fichero de la ruta, no contra un segundo literal escrito en el test (un
  `route.ts` de Next no puede exportar constantes propias, así que la
  constante vive fuera y un caso comprueba que el fichero de la ruta existe
  donde ella dice).

- **CA-9 — Sin base de datos no sale nada (RN-11, SPEC-008 CA-14.7).**
  Dado el tick compuesto con un `Sql` que revienta,
  cuando corre,
  entonces **ninguna petición llega al fetcher** —ni de robots ni de
  página—, no se archiva nada y el error del tick sale nombrando la causa. Es
  la herencia de CA-14.7 conducida por el punto de entrada real.

- **CA-10 — Los tres gates, las dos suites, y las suites cerradas enteras.**
  `npm run lint` en `exit=0`, `npm test` y `npm run test:db` en verde, con
  las tres salidas literales en el ledger. Sin `DATABASE_URL_TEST`, CA-2,
  CA-3, CA-4, CA-5 y CA-6 son **UNMET, no *skipped*** (gate del 2026-08-29).
  Y ningún caso de suite cerrada se pierde: recuento fichero a fichero contra
  `main` de `tests/mirror`, `tests/site`, `tests/docs`, `tests/model`,
  `tests/raw`, `tests/db`, `tests/ingest`, `tests/polite`, `tests/alias`,
  `tests/calendar`, `tests/stores` y `tests/types`, como exige SPEC-009 CA-7.
  Si el implementador necesita una entrada o un nombre nuevo en
  `ALLOWED_PACKAGES` o `ENTRY_POINTS`, es un diff con motivo (SPEC-008
  CA-2.3), no un arbitraje.

## Entidades y reglas afectadas

**Reglas de negocio** (`docs/fundacion/reglas.md`, no se duplican aquí):

- **RN-06** — sus umbrales (kickoff − 2 min, kickoff + 110 min) son la
  justificación de `PRE` y `POST` (ADR-019 §2); el tick no implementa ninguna
  transición: eso es del motor.
- **RN-08** — el tick termina en `Observation` y no escribe ninguna
  `Decision` (CA-4.4); «publicado» sigue sin ocurrir.
- **RN-09** — solo resuelve el catálogo confirmado, vía el resolver de
  SPEC-011; lo no resuelto queda íntegro en el registro para una persona
  (CA-4.1).
- **RN-10** — la página y el `robots.txt` se archivan antes de parsearse
  (CA-3.1, CA-4); heredado de `captureThenParse`, conducido aquí de punta a
  punta por primera vez en el camino de producción.
- **RN-11** — ritmo durable entre instancias (CA-2), robots con fallo cerrado
  y vigencia durable (CA-3), y **medición acotada**: el despliegue no puede
  sondear fuera de las jornadas declaradas (CA-1).
- **RN-12** — no aplica y se dice por qué: ninguna `Decision` se produce aquí.
- **RN-13** — el registro de intentos es append-only por analogía (CA-5.2);
  las `Observation` persistidas quedan bajo el régimen ya escrito (SPEC-010).

**ADRs:**

- **ADR-019** (`borrador`, nace con esta spec) — el tick entero: §1 en CA-7 y
  CA-8, §2 y §3 en CA-1 y CA-2, §4 en CA-3, §5 en CA-5, §6 en CA-4. Si el
  gate lo cambia, cambian esos CA.
- **ADR-020** (`borrador`, nace con esta spec) — la retención por jornada y el
  `raw_ref` colgante declarado. No tiene CA propio ejecutable: su ceremonia es
  del operador y del runbook, y su frontera de validez es la lista de ADR-019
  §3.
- **ADR-004** — Vercel Cron a 1/min, sin proceso vivo: es la forma entera de
  esta spec (CA-2.1, CA-8).
- **ADR-014** — un solo dueño de la cortesía: el gate durable vive en
  `src/polite/` y no hay segundo parser (CA-3.6); §3.2 las 6 h y su
  contabilidad aparte; §3.4 la clave del robots archivado.
- **ADR-008 §5.2** — la línea entre medición y sondeo: la acota ADR-019 §3 y
  la ejerce CA-1.
- **ADR-009 §6** — la precondición de retención, satisfecha por ADR-020 para
  este régimen; F-SPEC-001-1 sigue abierta para producción.
- **ADR-006** — instantes como cadena `Z` en todo el camino (CA-1, CA-2.3,
  CA-5), `migrations/0005` sin rollback (CA-6), SQL etiquetado sin ORM.
- **ADR-016** — esta spec **no escribe ningún test de arquitectura**; la
  frontera estática la siguen guardando los de SPEC-008, que alcanzan los
  módulos nuevos por CA-2.3/CA-2.6 (raíces) y CA-12 (`src/ingest/`).
- **ADR-011 §6** — SPEC-008, 010 y 011 son `hecho`: sus ficheros no se tocan;
  el tick compone sobre sus API públicas.
- **ADR-017 §5** y **ADR-018** — las semánticas de persistencia y resolución
  que el tick consume tal cual (CA-4).

**Términos de `dominio.md`** que esta spec consume: `Observation`, `raw
store`, `raw_ref`, `Match`, `adaptador de fuente`, `calendario declarado`,
`catálogo de alias`, los cinco estados y la representación del tiempo.
**Añade dos**, en el mismo commit que esta spec: **ventana de partido** y
**jornada de medición declarada** (ADR-019 §2 y §3).

## Fuera de alcance

Aparcado a propósito, no por descuido. Cada línea tiene dueño.

- **Declarar la primera jornada de medición real.** Es un acto del operador
  con dos precondiciones escritas: el dictamen de `sdd-legal-datos` sobre el
  régimen de jornada (SPEC-008 notas §7) y la fecha de purga escrita antes
  (ADR-020 §3). La lista se entrega **vacía**.
- **Cargar el calendario y el catálogo de alias reales.** Siguen donde
  SPEC-010 y SPEC-011 los dejaron: actos del operador con sus dictámenes.
- **El motor de decisiones (RN-01..RN-07) y cualquier `Decision`.** Es la
  spec siguiente; hereda `observations` llenándose por jornada y el registro
  de intentos como materia de la lista de fallos.
- **Las cuatro cifras y su declaración de degradación.** Faltan el motor, el
  bot, el panel y el snapshot por delante.
- **El bot de Telegram y el panel del operador.** El orden de la épica los
  pone antes que el snapshot y las cifras; no antes que esto.
- **La purga y su ceremonia.** ADR-020 la decide; ejecutarla es del operador
  y documentarla del runbook. Ningún test la vigila, y eso está firmado en
  ADR-009 §4 y repetido en ADR-020 §3.
- **La retención de la ingesta continua de producción.** F-SPEC-001-1 sigue
  abierta; ADR-020 §1 fija la frontera de validez de lo decidido aquí.
- **Reprocesar jornadas desde el archivo como herramienta (CLI de replay).**
  CA-4.3 demuestra que es posible e inofensivo; empaquetarlo es de la spec
  que lo necesite (el motor, con sus tests de replay).
- **Alertas de cualquier tipo** (RN-05, RN-07 hablan del panel, que no
  existe). El registro de intentos es lo que las alimentará.
- **La retención del registro de intentos.** Filas propias, sin terceros
  dentro; si algún día pesa, EPIC-MEJORA.

## Notas para el gate humano

Lo que hay que mirar con lupa antes de firmar. Cada punto lleva la
recomendación de `sdd-arquitecto`; **la decisión es de quien firma**.

1. **Esta es la spec que despliega lo primero que pide a un tercero, y hay
   una pregunta legal abierta a propósito.** El dictamen de `sdd-legal-datos`
   sobre capturar jornadas enteras de `ceroacero.es` (SPEC-008 notas §7)
   sigue sin pedirse. Esta spec lo convierte en precondición de **declarar la
   primera jornada**, no de aprobar el código — la misma línea que SPEC-008
   trazó («el código es igual de legal escrito que sin escribir»).
   **Recomendación:** aprobar, y pedir el dictamen antes de la primera
   entrada en la lista de jornadas.
2. **ADR-019 trae tres números elegidos sin evidencia**: `PRE` = 10 min,
   `POST` = 150 min, y 1 min de reintento del robots. Cada uno vive en un
   solo sitio y es revisable con la primera jornada delante.
   **Recomendación:** firmarlos como están y revisarlos con datos, como se
   hizo con las 6 h de ADR-014 §3.2.
3. **ADR-020 lee «ingesta continua» (ADR-009 §6) como «no es esto».** El
   argumento es estructural —la lista cerrada de jornadas de ADR-019 §3 hace
   al despliegue incapaz de sondear sin fin— pero la lectura es arbitrable, y
   la alternativa honesta es bloquear esta spec hasta escribir la retención
   automática de producción. **Recomendación:** aceptar la lectura; la
   frontera de validez está escrita en ADR-020 §1 y el residuo
   (F-SPEC-001-1) sigue abierto y nombrado.
4. **La purga vuelve a depender de una persona, y ahora en Blob de
   producción.** Es la parte débil de ADR-020 y está dicha con las mismas
   palabras que en ADR-009: ningún test se pone rojo si nadie purga.
   **Recomendación:** firmar con la ceremonia (fecha antes, acuse después,
   sin acuse no hay jornada siguiente) y exigir el runbook antes de la
   primera jornada.
5. **El `raw_ref` colgante pasa a ser estado declarado** (ADR-020 §4). Es la
   única lectura compatible con RN-13, pero constriñe al motor y al snapshot:
   nadie puede tratar un `get` fallido del archivo como corrupción.
   **Recomendación:** firmarlo ahora, que aún no hay ninguna fila que pueda
   colgar.
6. **Se cierra un defecto latente de código `hecho` sin tocarlo**: el
   `RobotsGate` en memoria queda relegado al instrumento (donde es correcto)
   y el camino de producción usa el gate durable nuevo. El GREEN de SPEC-008
   no se reabre —sus ficheros no cambian— pero la composición de producción
   deja de usar una de sus piezas tal cual. CA-3.5 es el control que nombra
   el defecto. **Recomendación:** mirar CA-3 entero; es el corazón técnico de
   la spec.
7. **El endpoint del cron es una URL pública con secreto.** Sin
   `CRON_SECRET` configurado, el cron **no corre** (fallo cerrado, CA-7): un
   despliegue mal configurado se manifiesta como cobertura cero, no como
   sondeo sin control. **Recomendación:** aceptar; la alternativa (correr sin
   secreto) deja el registro de intentos escribible por terceros.
8. **`vercel.json` nace con esta spec** y es la primera configuración de
   despliegue versionada más allá de Next. CA-8 la fija contra la ruta real.
   **Recomendación:** firmar; es un fichero de cuatro líneas con un test.
9. **Lo que esta spec deliberadamente no promete.** No produce cifras, no
   publica, no decide, no declara jornadas y no captura nada hasta que una
   persona declare una jornada con sus precondiciones cumplidas. Al terminar,
   el proyecto tiene por primera vez el camino completo fuente → archivo →
   `Observation` persistida, desplegable y estructuralmente incapaz de
   excederse — y el motor tiene, por fin, algo que leer.
