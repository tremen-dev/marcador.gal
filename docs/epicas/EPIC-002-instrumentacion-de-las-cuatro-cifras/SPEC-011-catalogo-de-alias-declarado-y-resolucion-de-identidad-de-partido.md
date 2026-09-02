---
id: SPEC-011
tipo: spec
epica: EPIC-002
estado: en-revision
aprobada-por: Alberto Fojo
historial:
  - {estado: borrador, fecha: 2026-09-02, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-09-02, por: Alberto Fojo}
  - {estado: en-progreso, fecha: 2026-09-02, por: sdd-implementador}
  - {estado: en-revision, fecha: 2026-09-02, por: sdd-implementador}
---
# SPEC-011 — Catálogo de alias declarado y resolución de identidad de partido

> Sigue la descomposición orientativa de `_epica.md` —calendario y repositorios
> ✓ (SPEC-010) · **catálogo de alias** · cron · motor · bot · panel · snapshot ·
> cifras— y cierra el hueco que SPEC-008 dejó abierto con esas palabras en
> `src/ingest/ports.ts`: `MatchResolver`, «DEFINED HERE AND NOT IMPLEMENTED.
> The real one is the alias catalogue with its human confirmation plus the
> loaded calendar». El calendario ya está (SPEC-010, `hecho`); esta spec es el
> catálogo con su confirmación humana, y el resolver que une las dos mitades.
>
> Trae **ADR-018** (`borrador`): el catálogo es una declaración humana por
> fuente y temporada que se **reemplaza** al cargar —la contradicción
> deliberada con el «no borrar» de ADR-017 §2, con su motivo—, y la identidad
> se resuelve **todo o nada**, sin ninguna heurística.

## Problema

**RN-09 dice que nunca se publica un resultado sobre un equipo sin alias
confirmado por una persona, y hoy el sistema obedece esa regla de la única
manera que puede: no resolviendo nada.**

El adaptador de SPEC-008 entrega los nombres tal como `ceroacero.es` los
escribe y le pide la identidad a un `MatchResolver` que no existe: en los tests
lo satisface un doble, y en la realidad **toda fila caería en `unresolved`**.
La ingesta real —el cron, la spec siguiente— produciría exactamente cero
`Observation`. Con una sola fuente automática de peso 0.7, además, el catálogo
no es solo la llave de la ingesta: el bot del corresponsal, que es media ruta a
*confirmado*, también nombra equipos y también choca con RN-09.

Las piezas para resolver existen todas menos una. `team_aliases` está en la
base desde `migrations/0001`, con RN-09 a nivel de `CHECK` (una confirmación
sin persona no se puede escribir). `TeamAlias`, la normalización única de
comparación y `resolveConfirmedAlias` —que solo resuelve alias confirmados—
están en `src/model/team.ts` desde SPEC-001. `MatchStore.listByTeams` da los
partidos de un par ordenado desde SPEC-010. **Lo que no existe es cómo se
llena la tabla** —de dónde salen las filas, con qué confirmación, qué pasa al
recargar— **ni el resolver que la consume.** Eso es esta spec, y lo decide
ADR-018.

**Lo que esta spec no arregla, dicho en la primera línea:** no captura nada, no
persiste ninguna `Observation` fuera de sus tests, no escribe ninguna
`Decision` y no produce ninguna cifra. Y **no escribe el fichero real de los 36
equipos**: entrega el formato, el validador, el cargador y el resolver; el
fichero real es un acto del operador con sus dictámenes delante (§*Fuera de
alcance*).

## Usuarios / roles afectados

- **`sdd-implementador`**: construye `src/alias/` (esquema, puerto, resolver,
  CLI), `src/db/aliases.ts` (cargador y repositorio), `migrations/0004`, y las
  suites en `tests/alias/` y `tests/db/`. La rama tiene que nombrar `SPEC-011`
  (p. ej. `ft/SPEC-011-catalogo-de-alias`), o el hook `require-spec` deniega la
  escritura sobre `src/` y `tests/`. Necesita `DATABASE_URL_TEST` desde CA-2.
- **`sdd-verificador`**: corre **dos** suites (`npm test` y `npm run test:db`)
  y sin `DATABASE_URL_TEST` los criterios con base son **UNMET, no *skipped***
  (gate del 2026-08-29). Tiene que ejecutar la carga **dos veces** con el mismo
  fichero y una tercera con el fichero modificado (CA-2), y comprobar que la
  entrada retirada **deja de resolver** — el reemplazo es la decisión central
  de ADR-018 y es lo que hay que ver funcionar.
- **El operador del spike** (el autor, RN-01): escribirá a mano el fichero real
  de alias de `ceroacero.es` —36 equipos, las grafías que la fuente use— y lo
  cargará desde su máquina. **Sus minutos cuentan** para la cifra de operación
  manual, como los del calendario (SPEC-010). Esta spec le da el formato, el
  validador y el cargador; el fichero real no está en su alcance.
- **`sdd-competicion`**, consultivo: cada entrada del fichero real une una
  grafía de la fuente con un `TeamId` del calendario, y que ese emparejamiento
  sea el correcto —que «Celta B» de ceroacero sea el `rc-celta-b` de la RFGF y
  no otro— es dictamen suyo, junto con el que SPEC-010 ya le pide para los
  nombres canónicos. Antes de la primera carga real, no antes de aprobar esto.
- **`sdd-legal-datos`**, consultivo: versionar en el repositorio las grafías
  con las que una fuente escribe nombres de equipos (notas §6). Es menor que la
  pregunta del calendario (SPEC-010 notas §1) y conviene despacharlas juntas.
- **`sdd-arquitecto`**, como autor de las specs siguientes: el cron construye
  el resolver con `(source, season)` de su configuración y le pasa las filas;
  el bot hereda que una recarga del fichero **reemplaza** el catálogo de su
  fuente y temporada (ADR-018 §*Lo que no decide*); el panel hereda que
  confirmar sin editar ficheros es una capacidad que hoy no existe.
- **`sdd-documentalista`**: `src/alias/` y `alias/` son directorios nuevos;
  `CLAUDE.md` §Estructura y el runbook de carga (junto al del calendario) son
  suyos, después del GREEN.

## Diseño

### §1. Qué es el catálogo de alias declarado

Un fichero JSON **por fuente y temporada**, escrito por una persona, que une
cada grafía con la que esa fuente escribe un equipo con el `TeamId` canónico
del calendario declarado, junto con **quién lo declaró y cuándo**. Vive
versionado en `alias/<temporada>/<source_id>.json` (temporada en la forma
`2026-27`, como en `calendario/`) y se carga en Postgres con una CLI.
**Declararlo es confirmarlo** (ADR-018 §1): cada entrada aterriza en
`team_aliases` como `confirmed`, con `confirmed_by` y `confirmed_at` del
fichero. Término nuevo en `dominio.md` (§*Fuentes y organismos*), añadido por
esta spec.

**Ninguna llamada a un LLM forma parte del mecanismo** (ADR-018 §1): RN-09
permite que un LLM proponga, no lo exige, y una petición de red fuera de
`politeFetch` está prohibida (ADR-014 §4). La vía de proposición dentro del
sistema llega con el bot. El cargador tampoco hace peticiones: RN-11 no se
ejerce.

### §2. La forma del fichero

Un esquema zod en `src/alias/catalog.ts` es el contrato; lo que sigue lo
ilustra y no lo sustituye:

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

Lo que el esquema exige, cada cosa con su test en CA-1:

- `source` es *kebab-case* (`SourceIdSchema` + patrón), y **a propósito no se
  valida contra el registro de ingesta** (`src/ingest/sources.ts`): el
  corresponsal también escribe nombres y su fuente no vive en ese registro.
- `season` en la forma de la RFGF, `2026/27`, la misma que el calendario.
- `declared_by` es una persona: cadena no vacía, como en SPEC-010. La cadena
  vacía es la forma que toma «nadie lo declaró».
- `declared_at` es un instante ISO 8601 (se normaliza a `Z` al cargar).
- `aliases` tiene **al menos una** entrada: reemplazar por la lista vacía es
  vaciar el catálogo, que es otro acto y hoy no tiene spec (ADR-018 §*Lo que
  no decide*).
- Cada `team_id` es *kebab-case* (`TeamIdSchema` + patrón); cada `alias` es
  cadena no vacía.
- **Dos entradas cuya forma normalizada colisione se rechazan** — la
  normalización es la única de SPEC-001 CA-5 (`normalizeAlias`: trim, colapso
  de espacios internos, NFC). Es el conflicto que la clave primaria de la base
  no puede ver, porque compara texto exacto (ADR-018 §4): se cierra aquí, como
  el caso cruzado del calendario se cierra en su esquema (SPEC-010 §3).
- Un mismo equipo puede tener muchas entradas; una misma grafía, solo una.

Mayúsculas y acentos son **significativos** (SPEC-001 CA-5, gate 2026-08-29):
si la fuente escribe «CELTA B» y «Celta B», son dos entradas. Esta spec hereda
esa decisión y no la reabre.

### §3. La carga: reemplazo transaccional por fuente y temporada, con registro

`loadAliasCatalog(sql, file, { clock })` en `src/db/aliases.ts` (la mitad con
SQL; la mitad pura —esquema y validación— en `src/alias/`), según ADR-018 §2:

1. Valida el fichero entero con el esquema antes de tocar la base.
2. En **una transacción**: borra todas las filas de `team_aliases` de ese
   `(source, season)` —el estado que tengan— e inserta exactamente las del
   fichero, todas `confirmed`, con `confirmed_by = declared_by` y
   `confirmed_at = declared_at` normalizado a `Z`. Un `team_id` que no exista
   en `teams` **rechaza la carga entera** nombrándolo: los equipos los declara
   el calendario (SPEC-010), no este fichero.
3. Las filas de **otras fuentes u otras temporadas no se tocan**.
4. Inserta una fila en `alias_loads` (`migrations/0004`, *append-only* con el
   `reject_amendment` de `0001`): `source`, `season`, `declared_by`,
   `declared_at`, `loaded_at` (del `Clock` inyectado, `systemClock` por
   defecto), `file_digest` (sha256 de los bytes), `aliases_count`, `inserted`,
   `removed`.
5. Devuelve un `LoadResult` con las entradas insertadas, las **retiradas**
   (estaban en la base para ese `(source, season)` y no vienen en el fichero),
   y el `id` de la fila de carga.

Si cualquier paso falla, **nada queda escrito**, ni la fila de carga.

**Por qué reemplaza y no «reporta huérfanos» como el calendario:** un alias no
es un hecho con historia colgando —nada le apunta por clave ajena—, es
**enrutado vigente**, y un alias confirmado que sobra seguiría enrutando
observaciones al partido equivocado mientras exista (ADR-018 §*Contexto*). La
auditoría no se pierde: filas vigentes con `confirmed_by`, registro de cargas
con digest, e historial de git del fichero.

### §4. El puerto y el repositorio

- `AliasStore` es un puerto **nuevo** en `src/alias/ports.ts` — un solo método,
  `listBySource(source, season)`, que devuelve los `TeamAlias` de esa fuente y
  temporada, `proposed` incluidos: quien filtra por estado es
  `resolveConfirmedAlias`, no el puerto. Escribir va por `loadAliasCatalog` y
  por ningún otro sitio: sin `insert`, `update` ni `delete`, como `MatchStore`.
- `PostgresAliasStore` en `src/db/aliases.ts`. Toda lectura sale por
  `TeamAliasSchema.parse` (la unión discriminada de SPEC-001); los instantes
  cruzan como cadena `Z` y `Date` no aparece (ADR-006).

### §5. El resolver: todo o nada

`catalogMatchResolver({ source, season, aliases, matches })` en
`src/alias/resolver.ts` implementa **el `MatchResolver` de `src/ingest/ports.ts`
tal cual**, sin tocar ese fichero (ADR-011 §6), con la semántica de ADR-018 §3:

1. Busca `home_name` y `away_name` con `resolveConfirmedAlias` de
   `src/model/team.ts` —**se reutiliza, no se reimplementa**— sobre el catálogo
   de `AliasStore`: solo resuelve un alias `confirmed`, con coincidencia exacta
   tras `normalizeAlias`.
2. Si los dos resuelven, pregunta
   `MatchStore.listByTeams(competitionId, homeId, awayId)`.
3. Con **exactamente un** partido, ese es el `MatchId`. Con cero o con más de
   uno, `null`: la ambigüedad no se desempata por hora ni por ninguna
   heurística — la fila vuelve entera a una persona (SPEC-008 CA-13).

Lo que el resolver **no** hace, para que nadie lo añada por ayudar: no compara
contra `canonical_name` (que la fuente acierte el nombre canónico no es una
confirmación, RN-09); no usa `source_ref` ni `kickoff` de la fila; no lee el
reloj ni la red. Con el mismo catálogo, el mismo calendario y los mismos
bytes resuelve lo mismo: el replay determinista de SPEC-008 CA-10 se conserva.
La temporada **se le pasa** (del registro/configuración del llamante), no se
deduce de nada.

### §6. Lo que esta spec hereda y no rehace

- `team_aliases` y sus `CHECK`s de RN-09 (`migrations/0001`, SPEC-001 CA-17):
  **no se altera ni una constraint**. `migrations/0004` solo añade
  `alias_loads`.
- `TeamAlias`, `normalizeAlias`, `resolveConfirmedAlias` (`src/model/team.ts`)
  y `MatchStore` (`src/calendar/ports.ts`): se consumen sin tocar sus ficheros.
- `createClient`, `migrate`, `requireDatabaseUrl` y el arnés de `tests/db/`
  —`connect`, `resetAndMigrate`, `seed`, `truncateFacts`— **sin tocar la
  semilla**. Las suites nuevas limpian lo suyo.
- `systemClock` y `Clock` de `src/polite/clock.ts` (ADR-014 §1), inyectable en
  el cargador.
- El cierre de imports por superficie y los tests de capacidad de SPEC-009
  juzgan todo el código nuevo: los módulos de esta spec importan `node:crypto`
  (`createHash`), `node:fs/promises` (`readFile`), `zod` (`z`) y `postgres`
  (`default`), todos ya concedidos con esa superficie (SPEC-010 §6). **Esta
  spec no necesita ningún global nuevo ni ninguna concesión nueva**; la CLI es
  un punto de entrada y va a `ENTRY_POINTS` con su motivo (diff con motivo,
  ADR-016 §3.2), y esa línea es **lo único** que esta spec toca en
  `tests/polite/`. No escribe ningún test de arquitectura propio.

## Criterios de aceptación

- **CA-1 — El catálogo declarado se valida entero, y lo que una persona escribe
  mal se rechaza nombrando la entrada.**
  Dado el fixture **sintético** `tests/fixtures/aliases.ts` —fuente
  `ceroacero`, temporada `2026/27`, grafías inventadas para los cuatro equipos
  del fixture de calendario de SPEC-010, con al menos un equipo con dos
  entradas—,
  cuando se parsea con el esquema de `src/alias/catalog.ts`,
  entonces valida, y **cada una** de estas variantes es rechazada con un error
  que nombra la entrada o el campo: (1) `team_id` que no es *kebab-case*
  (`UD_Ourense`); (2) `alias: ""`; (3) dos entradas cuya forma normalizada
  colisiona («UD Ourense» y «UD  Ourense», doble espacio); (4) colisión por
  forma Unicode (la misma grafía con acento compuesto y descompuesto); (5) la
  misma entrada exacta dos veces; (6) `declared_by: ""`; (7) `season:
  "2026-27"` (la forma del fichero es `2026/27`); (8) `source: "CeroACero"`;
  (9) `declared_at` que no es ISO 8601; (10) `aliases: []`. Este criterio **no
  toca la red ni la base**: es una función pura y corre en `npm test`.

- **CA-2 — La carga reemplaza el catálogo de su fuente y temporada, entero, en
  una transacción, y no toca nada más (ADR-018 §2).**
  Dado `DATABASE_URL_TEST`, un esquema limpio con las cuatro migraciones, el
  calendario sintético de SPEC-010 cargado (sus equipos existen en `teams`) y
  el fixture de CA-1,
  cuando se ejecuta `loadAliasCatalog` con un reloj falso,
  entonces:
  1. `team_aliases` contiene **exactamente** las entradas del fichero para
     `(ceroacero, 2026/27)`, todas `confirmed`, con `confirmed_by` igual a
     `declared_by` y `confirmed_at` igual a `declared_at` normalizado a `Z`; el
     resultado las lista en `inserted` y `removed` es `[]`.
  2. Cargar **el mismo fichero otra vez** deja la tabla idéntica y devuelve
     `inserted: []`, `removed: []`.
  3. Cargar una copia con una entrada **añadida**, una **retirada** y una
     **reapuntada** (la misma grafía hacia otro `team_id`) deja la tabla igual
     al fichero nuevo; el resultado nombra las tres; y la retirada **ya no
     resuelve**: `resolveConfirmedAlias` sobre `listBySource` devuelve `null`
     para ella.
  4. Una fila de otra fuente (`besoccer`) y una de otra temporada (`2027/28`),
     preinsertadas por SQL, **siguen intactas** tras la carga.
  5. Una fila `proposed` de la misma fuente y temporada, preinsertada por SQL,
     **desaparece con la carga**: el reemplazo no respeta estado (ADR-018 §2;
     la spec del bot tendrá que contar con ello).
  6. Un fichero con un `team_id` que no existe en `teams` **rechaza la carga
     entera** nombrándolo, y ninguna tabla —`alias_loads` incluida— ha
     cambiado.
  7. **Todo o nada**: con un fallo inducido a mitad de transacción (p. ej. una
     restricción que el test fuerza), ninguna tabla ha cambiado.
  8. La semilla de `tests/db/_harness.ts` **no se modifica**, y toda la suite
     `tests/db/` anterior a esta spec sigue verde sin tocar una aserción.

- **CA-3 — Cada carga deja constancia de quién declaró el catálogo, cuándo y
  con qué fichero, y esa constancia es inmutable (ADR-018 §2).**
  Dada la carga de CA-2.1,
  entonces `alias_loads` tiene **una** fila con `source`, `season`,
  `declared_by`, `declared_at` normalizado a `Z`, `loaded_at` igual al instante
  del reloj falso (cadena `Z`), `file_digest` igual al sha256 hex de los bytes
  del fichero, `aliases_count` y los contadores `inserted`/`removed` coherentes
  con el resultado. Y:
  1. La segunda carga de CA-2.2 añade **otra** fila, con `inserted = 0`: cargar
     es un hecho aunque no cambie nada.
  2. `update alias_loads …` y `delete from alias_loads …` **los rechaza la
     base** (`reject_amendment`, RN-13 por analogía).
  3. `insert into alias_loads (…, declared_by, …) values (…, '', …)` **lo
     rechaza la base**: la cadena vacía es «nadie».

- **CA-4 — `PostgresAliasStore`: el catálogo se lee parseado, completo y en
  orden estable.**
  Dada la carga de CA-2.1,
  entonces `listBySource('ceroacero', '2026/27')` devuelve los `TeamAlias` del
  fichero —cada uno salido de `TeamAliasSchema.parse`, congelado, con
  `confirmed_at` como **cadena** que satisface `InstantSchema`—, ordenados por
  `alias` y luego `team_id`, y **nada** de otra fuente ni de otra temporada.
  Una fila `proposed` insertada por SQL directo (válida para los `CHECK`s de
  `0001`) vuelve como la rama `proposed` de la unión, sin rastro de
  confirmación. El puerto **no tiene** `insert`, `update` ni `delete`: un
  `.test-d.ts` con `@ts-expect-error` lo fija, como SPEC-010 CA-7.7.

- **CA-5 — El resolver resuelve todo o nada, solo con alias confirmados, y no
  usa nada más que catálogo y calendario (ADR-018 §3, RN-09).**
  Dados un `AliasStore` y un `MatchStore` **dobles en memoria** con el catálogo
  y el calendario sintéticos, y `catalogMatchResolver` construido con
  `(ceroacero, 2026/27)`,
  entonces (función sin red ni reloj; corre en `npm test`):
  1. Una fila cuyos `home_name`/`away_name` son grafías confirmadas —una de
     ellas con espacios de más y forma Unicode descompuesta, que
     `normalizeAlias` iguala— resuelve **exactamente** al `MatchId` derivado
     del partido único de ese par (el de SPEC-010 CA-3).
  2. Si el nombre de casa, el de fuera, o los dos no están en el catálogo,
     devuelve `null`. La fila **no se toca**: el llamante de SPEC-008 ya la
     entrega entera en `unresolved`.
  3. Un nombre igual al `canonical_name` de un equipo **sin** alias confirmado
     devuelve `null`: coincidir con el nombre canónico no es una confirmación.
  4. Un alias `proposed` para ese mismo nombre devuelve `null`: solo resuelve
     lo confirmado. El resolver usa `resolveConfirmedAlias` de
     `src/model/team.ts` y no reimplementa la comparación; el verificador lo
     comprueba leyendo el diff.
  5. Con el par resuelto pero `listByTeams` devolviendo `[]`, `null`;
     devolviendo **dos** partidos, `null`: la ambigüedad no se desempata.
  6. Dos filas idénticas salvo `source_ref` y `kickoff` resuelven **igual**; y
     una grafía confirmada con otra caja («celta de vigo b» frente a «Celta de
     Vigo B») devuelve `null`: mayúsculas significativas (SPEC-001 CA-5).

- **CA-6 — Las piezas encajan de verdad: catálogo cargado + calendario cargado
  + resolver real producen la `Observation` con la identidad correcta.**
  Dado `DATABASE_URL_TEST`, el calendario sintético de SPEC-010 y el catálogo
  de CA-1 cargados, y `catalogMatchResolver` construido sobre
  `PostgresAliasStore` y `PostgresMatchStore` reales,
  entonces:
  1. `resolve` de una fila con dos grafías confirmadas devuelve el `MatchId`
     derivado exacto (`futgal-preferente-g1-2026-27-j…`), contra la base real.
  2. `readRows` de SPEC-008 (`src/ingest/observations.ts`, sin tocarlo) con
     este resolver, sobre filas sintéticas con una fila resoluble y una con un
     nombre desconocido, devuelve **una** `Observation` con ese `match_id` y la
     fila desconocida **entera** en `unresolved` (SPEC-008 CA-13). Es la
     primera vez que el hueco «DEFINED HERE AND NOT IMPLEMENTED» se cierra con
     código real de las dos puntas.

- **CA-7 — La CLI carga un fichero contra `DATABASE_URL`, cuenta lo que hizo y
  falla con claridad.**
  Dado `npm run alias:cargar -- <ruta>` (`src/alias/cli.ts`, con la misma forma
  que `src/calendar/cli.ts`),
  entonces: con un fichero válido escribe en `stdout` los recuentos de
  insertados y retirados y el `id` de la fila de carga, y sale con `0`; con un
  fichero inválido escribe el error de CA-1 nombrando la entrada y sale con `1`
  **sin haber abierto conexión**; sin `DATABASE_URL` sale con `1` con el
  mensaje de `MissingDatabaseUrlError`. El `main` recibe `sql` y `argv`
  inyectados para poder probarse sin proceso hijo. La CLI es un punto de
  entrada nuevo: **se añade a `ENTRY_POINTS` con su motivo** (ADR-016 §3.2), y
  esa línea es lo único que esta spec toca en `tests/polite/`.

- **CA-8 — `migrations/0004` se aplica en orden, sin rollback, y no toca lo que
  `0001` ya garantiza (ADR-006).**
  Dado un esquema vacío,
  cuando se ejecuta `migrate`,
  entonces devuelve `['0001', '0002', '0003', '0004']` en ese orden y una
  segunda ejecución devuelve `[]`. Y:
  1. `information_schema` muestra `alias_loads` y sus triggers *append-only*
     **con los nombres que la migración declara** (el test los lee de la
     migración, no los repite).
  2. **`team_aliases` no cambia**: ni columnas ni constraints nuevas; los
     `CHECK`s de SPEC-001 CA-17 siguen ahí y un caso lo comprueba insertando
     por SQL directo una confirmación sin persona, que la base rechaza.
  3. El test de paridad de SPEC-001 CA-14 (`tests/db/parity.test.ts`) pasa
     **sin ninguna entrada nueva** en sus mapas de excepciones: `alias_loads`
     no es modelo canónico, como `calendar_loads` no lo es.
  4. La migración está escrita a mano, con SQL etiquetado y **sin ORM**; el
     verificador lo comprueba leyendo el diff.

- **CA-9 — Los tres gates, las dos suites, y las suites cerradas enteras.**
  `npm run lint` en `exit=0`, `npm test` y `npm run test:db` en verde, con las
  **tres salidas literales en el ledger**. `DATABASE_URL_TEST` es obligatorio:
  sin él CA-2, CA-3, CA-4, CA-6 y CA-8 son **UNMET, no *skipped*** (gate del
  2026-08-29). Y **ninguna suite cerrada pierde un caso**: recuento fichero a
  fichero de `tests/mirror`, `tests/site`, `tests/docs`, `tests/model`,
  `tests/raw`, `tests/db`, `tests/calendar`, `tests/ingest`, `tests/polite` y
  `tests/types` contra `main`, como exigen SPEC-009 CA-7 y las verificaciones
  de SPEC-010. Los tests de capacidad de SPEC-009 pasan **sin ningún global
  nuevo concedido** y con `ENTRY_POINTS` ganando exactamente una línea (CA-7).

## Entidades y reglas afectadas

**Reglas de negocio** (`docs/fundacion/reglas.md`, no se duplican aquí):

- **RN-09** — la regla central. Se ejecuta entera: la confirmación humana es la
  declaración firmada del fichero (ADR-018 §1, CA-2.1), solo lo confirmado
  resuelve (CA-5.4), el nombre canónico sin alias no resuelve (CA-5.3), y lo
  que no resuelve vuelve entero a una persona (CA-5.2, CA-6.2). El LLM ni
  aparece: su vía llega con el bot y seguirá exigiendo confirmación humana.
- **RN-01** — los pesos no se tocan; el resolver no sabe de confianzas. La
  `confidence` sigue saliendo del registro de SPEC-008.
- **RN-08** — sigue sin escribirse ninguna `Decision`; esta spec produce
  identidad, no publicación.
- **RN-10 / RN-11** — no se ejercen: ni el cargador ni el resolver reciben ni
  piden un solo byte de ningún tercero (§1, ADR-018 §2).
- **RN-13** — `alias_loads` es *append-only* por analogía (CA-3.2).
  **`team_aliases` no es materia de RN-13**: un alias es configuración de
  enrutado, no un hecho histórico, y su reemplazo es la decisión de ADR-018 §2
  con la auditoría preservada en tres sitios.

**ADRs:**

- **ADR-018** (`borrador`, nace con esta spec) — declaración humana por fuente
  y temporada (§1, §2), reemplazo transaccional registrado (§3, CA-2, CA-3),
  resolución todo o nada (§5, CA-5). Esta spec lo ejecuta entero; si el gate
  cambia el ADR, cambian CA-1..CA-5.
- **ADR-017** (`aprobada`) — el calendario da los equipos (`teams` es la clave
  ajena que CA-2.6 exige) y los partidos (`listByTeams`, CA-5.5, CA-6); la
  identidad derivada de SPEC-010 CA-3 es lo que el resolver devuelve.
- **ADR-014** (`aprobada`) — sin peticiones fuera de `politeFetch`: la razón de
  que no haya vía LLM aquí (§1); `Clock` como único reloj (§3 del diseño).
- **ADR-016** (`aprobada`) — esta spec no escribe ningún test de arquitectura;
  el diff con motivo en `ENTRY_POINTS` (CA-7) y la declaración explícita de lo
  que solo el fichero garantiza (§2, ADR-018 §4) son su forma aplicada.
- **ADR-006** (`aprobada`) — instantes como cadena `Z` (CA-2.1, CA-3, CA-4),
  SQL a mano, `migrations/0004` sin rollback (CA-8).
- **ADR-011 §6** — `src/model/team.ts`, `src/db/ports.ts`, `src/ingest/*` y
  `src/calendar/ports.ts` son de specs `hecho` y **no se tocan**: se consumen
  (CA-5.4, CA-6.2).
- **ADR-001** — zod en todos los bordes (`AliasCatalog` al entrar,
  `TeamAliasSchema` al salir de la base).

**Términos de `dominio.md`** que esta spec consume: `alias`, `Team`,
`TeamAlias`, `Match`, `adaptador de fuente`, `calendario declarado`, la
normalización de SPEC-001 CA-5 y la representación del tiempo. **Añade uno**:
**catálogo de alias declarado** (§*Fuentes y organismos*), en el mismo commit
que esta spec.

## Fuera de alcance

Aparcado a propósito, no por descuido. Cada línea tiene dueño.

- **El fichero real de los 36 equipos.** Lo escribe el operador, después del
  fichero real del calendario (que tampoco existe aún) y con los dictámenes de
  `sdd-competicion` (el emparejamiento grafía→equipo) y `sdd-legal-datos`
  (notas §6) delante. Esta spec entrega formato, validador, cargador y
  fixtures **sintéticos**; ni una grafía real.
- **La vía LLM de proposición** (estado `proposed` escrito por el sistema,
  salida JSON validada, transporte y llave). Es del bot de Telegram, que
  tendrá que reconciliarla con ADR-014 y con el reemplazo de ADR-018 §2.
- **La confirmación desde el panel** sin editar ficheros, y cualquier
  corrección en caliente durante una jornada. Hasta el panel, un alias nuevo
  en directo es una fila en `unresolved` y cobertura degradada por catálogo.
- **El bucle de realimentación de `unresolved`** (alertas, listado de nombres
  sin resolver para que el operador amplíe el fichero): es del cron y del
  panel. Aquí las filas sin resolver ya vuelven enteras (SPEC-008 CA-13).
- **Vaciar un catálogo** (reemplazar por la lista vacía). El esquema lo impide
  (CA-1.10); si algún día hace falta, es una spec con sus CA, como borrar
  partidos.
- **El cron de ingesta.** Esta spec le deja el resolver construible con
  `(source, season)` de su configuración; ventanas, frecuencia y persistencia
  de `Observation` reales son suyos, con la precondición de ADR-009 §6 intacta.
- **Los alias de `futgal.es` y de cualquier fuente futura**: un fichero más
  por fuente, sin cambio de mecanismo (ADR-018 §*Lo que no decide*).
- **Tocar `src/model/team.ts`, `src/db/ports.ts`, `src/ingest/*` o
  `src/calendar/*`**: todo se consume tal cual (ADR-011 §6).

## Notas para el gate humano

Lo que hay que mirar con lupa antes de firmar. Cada punto lleva la
recomendación de `sdd-arquitecto`; **la decisión es de quien firma**.

1. **La carga reemplaza en vez de conservar, y eso contradice a sabiendas el
   patrón de ADR-017 §2.** El calendario nunca borra; el catálogo borra todo lo
   de su fuente y temporada y pone lo del fichero. El motivo está en ADR-018
   §*Contexto*: un alias que sobra enruta mal mientras exista, y nada le apunta
   por clave ajena. **Recomendación:** firmarlo; la simetría con el calendario
   sería estética, la asimetría es de fondo. Es la decisión central del ADR.
2. **«Declarar es confirmar» es una lectura de RN-09/D-4 sin LLM.** RN-09
   permite que un LLM proponga; aquí no hay LLM y la confirmación es el
   fichero firmado. No se afloja nada —sigue habiendo exactamente una persona
   confirmando, con nombre e instante— y se evita una llamada de red que
   ADR-014 prohíbe fuera de `politeFetch`. **Recomendación:** firmar; la vía
   LLM entra con el bot, que es su sitio natural, y `proposed` sigue sin poder
   llegar a `confirmed` sin una persona.
3. **La ambigüedad no se desempata: dos partidos posibles = fila sin
   resolver.** En liga a doble vuelta `listByTeams` devuelve cero o uno, así
   que en la práctica no dispara; si un día una competición no es a doble
   vuelta, las filas de ese par caerán en `unresolved` en vez de adivinarse.
   **Recomendación:** aceptar; desempatar por hora usaría el reloj y rompería
   el replay determinista (ADR-018 §*Alternativas*).
4. **Una recarga barre las filas `proposed` de su fuente y temporada**
   (CA-2.5). Hoy nada escribe `proposed`; el día que el bot lo haga, su spec
   tiene que decidir dónde viven sus proposiciones. Está escrito en ADR-018
   §*Lo que no decide* como mina con cartel. **Recomendación:** aceptar así y
   exigir que la spec del bot lo trate explícitamente.
5. **Mayúsculas y acentos significativos obligan a una entrada por variante
   tipográfica real.** Es la decisión ya firmada de SPEC-001 CA-5 (gate
   2026-08-29); esta spec la hereda y el precio se paga en líneas de fichero.
   **Recomendación:** no reabrir; si la fuente real resulta caótica en caja,
   la evidencia de la ventana de observación es lo que justificaría otro ADR.
6. **Se versionarán en el repositorio las grafías con las que `ceroacero.es`
   escribe equipos.** Es menos que la pregunta pendiente del calendario
   (SPEC-010 notas §1: una lista federativa copiada a mano) pero es un dato
   tomado de la web de un tercero, escrito a mano. **Recomendación:** aprobar
   el mecanismo y despachar las dos preguntas juntas con `sdd-legal-datos`
   antes del primer fichero real, como ya se recomendó allí.
7. **La épica dice «catálogo de alias de los 36 equipos» y esta spec no trae
   ninguno de los 36.** Igual que SPEC-010 con las 34 jornadas: la spec entrega
   el mecanismo, el contenido real es un acto del operador —bloqueado por el
   fichero real del calendario y los dictámenes— y **sus minutos cuentan** para
   la cifra de operación manual. **Recomendación:** aceptar el corte; medir
   esos minutos es parte del entregable de la épica, no un fallo de esta spec.
8. **Confirmar en caliente no se puede hasta el panel.** Un alias nuevo que
   aparezca un domingo en directo exige editar el fichero y cargar desde un
   portátil con credenciales: mientras tanto, filas en `unresolved` y cobertura
   perdida **por catálogo, no por fuente**. La declaración de degradación de la
   cifra tiene que poder distinguirlo, y `alias_loads` es lo que le deja decir
   cuándo se cargó por última vez. **Recomendación:** aceptar como límite
   conocido del spike y dato para la spec del panel.
9. **`migrations/0004` es irreversible en la práctica** (ADR-006): una tabla y
   sus triggers. Deshacer es escribir `0005`. **Recomendación:** firmar; no
   toca `team_aliases` ni ninguna tabla existente (CA-8.2).
10. **Lo que esta spec deliberadamente no promete.** No captura, no persiste
    ninguna `Observation` fuera de sus tests, no escribe ninguna `Decision`, no
    produce ninguna cifra y no trae grafías reales. Al terminar, el
    `MatchResolver` de SPEC-008 tiene por fin una implementación real (CA-6
    lo demuestra de punta a punta), y la spec del cron tiene todas las piezas
    para producir las primeras `Observation` persistidas del proyecto.
