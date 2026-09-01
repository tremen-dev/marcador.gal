---
id: SPEC-008
tipo: ledger
epica: EPIC-002
---
# Ledger — SPEC-008 Adaptador de ceroacero.es y cortesia RN-11 con una sola implementacion

## Resumen
- Fase: **en-revisión** (implementación terminada el 2026-09-01, pendiente de verificación)
- Rama: `ft/SPEC-008-adaptador-ceroacero` (creada sobre `88c359b`)
- Commits: `a95b5ca` (CA-1 + traslado ADR-014 §1) · `377091d` (CA-2, CA-4..CA-13)

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 — comodín `*` y ancla `$` (F-SPEC-002-23) | `src/polite/robots.ts` (`patternToRegExp`, desempate por longitud con `Allow` ganando el empate) | `tests/polite/robots.test.ts` casos 1-18 | | 🚧 |
| CA-2 — una sola cortesía RN-11 (arquitectura) | `src/polite/{robots,http,user-agent,rate-limit,clock,policy}.ts`; consumidores: `src/mirror/`, `src/ingest/`, `src/site/crawler-page.tsx` | `tests/polite/architecture.test.ts` casos 1-6 (el 6 es el control positivo por destino) | | 🚧 |
| CA-3 — el traslado no cambia comportamiento | traslado sin fachada; `src/mirror/` conserva `capturer.ts`, `ports.ts`, `thresholds.ts` con rutas nuevas | `tests/mirror/**` (48 ficheros, 347 casos con `tests/site` y `tests/docs`) — **una aserción enmendada**: `tests/mirror/user-agent.test.ts` caso 15 | | ⚠️ |
| CA-4 — archivar antes de parsear (RN-10) | `src/ingest/adapter.ts` (`capture` vía `captureThenParse`, lanza sin envolver) | `tests/ingest/adapter.test.ts` casos 1-5 | | 🚧 |
| CA-5 — robots / UA / sin redirección (RN-11) | `src/ingest/adapter.ts` (`assertUserAgent` primero, `PolicyGate`, `politeFetch`) | `tests/ingest/adapter.test.ts` casos 5-9 | | 🚧 |
| CA-6 — `robots.txt` obtenido, archivado y caducado | `src/polite/policy.ts` (`RobotsGate`, `ROBOTS_MAX_AGE_MS`, `ROBOTS_COMPETITION_ID`) | `tests/ingest/robots-policy.test.ts` casos 1-9 | | 🚧 |
| CA-7 — 1 pet./min por competición dentro | `src/polite/rate-limit.ts` (`RateLimiter`) + `src/ingest/adapter.ts` (`tick`) | `tests/ingest/adapter.test.ts` casos 10-13 | | 🚧 |
| CA-8 — extracción de ceroacero, fixtures sintéticos | `src/ingest/ceroacero.ts` (`CEROACERO_SHAPE`, `tableExtractor`) | `tests/ingest/ceroacero.test.ts` casos 1-10 · fixtures `tests/fixtures/ceroacero.ts` | | ⚠️ |
| CA-9 — forma de la `Observation` (RN-01, ADR-006) | `src/ingest/observations.ts` (`readRows`) + `src/ingest/sources.ts` (`RN01_WEIGHTS`) | `tests/ingest/observations.test.ts` casos 1-7 · `tests/ingest/registry.test.ts` casos 4-6 | | 🚧 |
| CA-10 — replay determinista | `src/ingest/observations.ts` (`observationId`, digest de `raw_ref` + `source_ref`) | `tests/ingest/observations.test.ts` casos 8-10 | | 🚧 |
| CA-11 — una fuente es configuración | `src/ingest/sources.ts` (`sourceRegistry`, `SourceEntry`, `DEFAULT_SOURCES`) | `tests/ingest/registry.test.ts` casos 1-7 | | 🚧 |
| CA-12 — no publica nada (RN-08, arquitectura) | `src/ingest/` entero: ninguna referencia a `Decision` | `tests/ingest/no-decision.test.ts` casos 1-3 (el 2 es el control positivo) | | 🚧 |
| CA-13 — la identidad no se adivina (RN-09) | `src/ingest/ports.ts` (`MatchResolver`, definido y no implementado) + `readRows` | `tests/ingest/observations.test.ts` casos 11-15 | | 🚧 |

## Qué se construyó, y dónde

```
src/polite/            la cortesía RN-11, con un solo dueño (ADR-014 §1)
  robots.ts            RobotsPolicy, parseRobots (RFC 9309), robotsRegistry, robotsSkipReason
  http.ts              puertos HTTP, assertUserAgent, politeRequest, politeFetch, globalFetcher, 3 errores
  user-agent.ts        USER_AGENT y las constantes de ADR-011
  rate-limit.ts        MIN_REQUEST_INTERVAL_MS, RateLimiter, pairKey
  clock.ts             Clock, systemClock, epochMsOf
  policy.ts            PolicyGate, RobotsGate: obtener, archivar, caducar (ADR-014 §3)

src/ingest/            el primer adaptador de producción
  ports.ts             SourceRow, RowExtractor, UnreadableRowError, MatchResolver, ReadResult
  ceroacero.ts         RowShape, tableExtractor, CEROACERO_SHAPE, extractCeroacero
  sources.ts           RN01_WEIGHTS, SourceEntry, sourceRegistry, CEROACERO_ENTRY, DEFAULT_SOURCES
  observations.ts      observationId, readRows
  adapter.ts           SourceAdapter: capture(), read(), tick()
```

Se borraron `src/mirror/user-agent.ts`, `src/mirror/capture/robots.ts` y
`src/mirror/capture/http.ts`. **Sin fachada de compatibilidad**: no queda ningún
reexport, así que no hay dos nombres para la misma cosa.

## Gates

`npm test` — **verde**, salida literal:

```
 RUN  v4.1.11 /Users/albertofojo/src/tremen-dev/marcador.gal/.claude/worktrees/agent-a8dc0237b70954bbc

 Test Files  79 passed (79)
      Tests  700 passed (700)
Type Errors  no errors
   Start at  13:08:02
   Duration  1.72s (transform 1.73s, setup 0ms, import 6.84s, tests 7.07s, environment 4ms, typecheck 108ms)
```

Y las suites de las specs cerradas, corridas aparte (CA-3):

```
$ npx vitest run tests/mirror tests/site tests/docs
 Test Files  48 passed (48)
      Tests  347 passed (347)
Type Errors  no errors
```

`npm run lint` — **rojo, y no por esta spec**. Salida literal:

```
> marcador@0.0.1 lint
> oxlint --type-aware

docs/diseno/_logic.js:3:9: error: Expected a semicolon or an implicit semicolon after a statement, but found none help: Try inserting a semicolon here
```

**Ese error ya estaba en `88c359b`**, el commit desde el que nace esta rama: se
comprobó guardando el trabajo (`git stash -u`) y corriendo el gate sobre el árbol
limpio, que devolvió `exit=1` con exactamente esa línea. `docs/diseno/_logic.js`
es un fragmento del sistema de diseño de EPIC-004 —**aprobada y congelada**— que
oxlint intenta parsear como JavaScript completo y no lo es. No se toca: es de
otra épica y está congelada (F-SPEC-008-5).

Sobre las rutas que esta spec sí posee el gate está limpio:

```
$ npx oxlint --type-aware src tests
exit=0
```

## Mutaciones comprobadas

**Dieciséis mutaciones**, aplicadas una a una y revertidas. Cada una nombra el
CA que protege y los casos que se pusieron rojos.

| # | Mutación | CA | Casos que se pusieron rojos |
|---|---|---|---|
| M1 | `patternToRegExp` vuelve al emparejamiento literal (`escapeRegExp(body)`: el fallo de F-SPEC-002-23) | CA-1 | `robots` 1, 2, 4, 5, 7 |
| M2 | se ignora el ancla `$` (`anchored = false`) | CA-1.1 | `robots` 6 |
| M3 | el empate lo gana el primero del fichero, no el `Allow` | CA-1.3 | `robots` 10 |
| M4 | `robotsRegistry` permite un origen sin política cargada | CA-1.4 | `robots` 15 |
| M5 | el adaptador ignora `decision.allowed` | CA-5.1 | `adapter` 5 (CA-4), 5 (CA-5), 13 · `robots-policy` 7, 9 |
| M6 | se quita `assertUserAgent` del inicio de `capture()` | CA-5.2 | `adapter` 6 |
| M7 | el `RobotsGate` refresca en cada llamada (sin ventana de 6 h) | CA-6.1, CA-6.2 | `robots-policy` 4, 5, 6, 8 · `adapter` 5 (CA-4) |
| M8 | el `RobotsGate` permite cuando no hay política en vigor | CA-6.3 | `robots-policy` 7, 9 · `adapter` 5 (CA-4) |
| M9 | el sello del limitador se hace **solo si el intento fue `ok`** | CA-7 | `adapter` 12, 13 |
| M10 | `confidence` fijado a `0.7` dentro del adaptador | CA-9.2, CA-11 | `registry` 4, 5 |
| M11 | `observationId` deja de mirar el `raw_ref` | CA-10 | `observations` 10 |
| M12 | `readRows` fabrica el `MatchId` desde el `source_ref` | CA-13 | `observations` 11, 13, 14 |
| M13 | `rowSelector` ensanchado a `tr, li.game`, fuera de la tarjeta de la jornada | CA-8 | `ceroacero` 1-6 · `adapter` 2 |
| M14 | se quita el aborto de la fila puntuable sin marcador legible | CA-8 | `ceroacero` 9b |
| M15 | segunda cortesía en `src/mirror/thresholds.ts` (cabecera UA, token `'disallow'`, `fetch(`) | CA-2 | `architecture` 2, 3, 4 |
| M16 | `import('@/db/ports').DecisionStore` dentro de `src/ingest/sources.ts` | CA-12 | `no-decision` 1 |

**Tres mutaciones sobrevivieron a la primera, y obligaron a reforzar los
tests.** Es exactamente para lo que existe el ejercicio, así que van dichas:

- **M6 sobrevivió** porque `politeRequest` ya lanzaba dentro de `politeFetch`, y
  el test no sabía distinguir «antes de cualquier I/O» de «antes de la primera
  petición». Se extrajo **`PolicyGate` como puerto** y el caso 6 pasa un doble
  que registra *si le preguntaron*: con la UA vacía no se abre política, no se
  toca el archivo y no se mira el `robots.txt`. Ahora muere.
- **M13 sobrevivió** porque el fixture solo tenía un señuelo —el widget de
  cabecera— que no lleva `td.vs`. Se le añadió una **segunda tabla con la misma
  forma de fila fuera de `#fixture_games`**; la página real lleva varias
  `table.zztable.stats`. Ahora muere.
- **M14 sobrevivió** porque el único caso de fila rota se caía antes, al no poder
  leer el estado. Se añadió el caso **9b** (`Suspendido` sin marcador: un estado
  declarado que exige cifra y no la trae). Ahora muere.

Y **una mutación se descartó por equivalente, no por conveniente**: mover el
`stamp` del limitador a *después* de `await this.#attempt(...)` no cambia nada,
porque `#attempt` no lanza nunca. Se sustituyó por M9 —sellar solo en caso de
éxito—, que es el error realista que el orden protege: sin él, un objetivo que
falla o que está prohibido se reintentaría en **cada** pase del cron.

## Calibración contra el archivo real (CA-8)

Los selectores se calibraron **mirando el HTML archivado en `raw/`**, no
versionándolo (ADR-009). El extractor se corrió sobre dos de las seis capturas
del 2026-08-31 y leyó **18 filas por página** (jornada 1 y jornada 2), con la
identidad, los dos nombres tal como los escribe la fuente —acentos y `ñ`
incluidos— y la hora:

```
/partido/2026-09-06-cd-arenteiro-cd-barco/12459912  CD Arenteiro · CD Barco · scheduled · 20:00
/partido/2026-09-06-cd-boiro-coruna-montaneros/12459919  CD Boiro · Coruña Montañeros · scheduled · 18:00
/partido/2026-09-06-sofan-ad-mino/12460493  Sofán · AD Miño · scheduled · 18:30
```

Lo calibrado: `#fixture_games` como tarjeta de la jornada, una `<tr>` por
partido, la identidad en el `href` `/partido/…` dentro de `td.vs`, los dos
nombres en las dos celdas `td.text` en orden local-visitante, y `HH:MM` en
`td.vs` para un partido no jugado.

## Salvedades / follow-ups

- **F-SPEC-008-1 — ⚠️ CA-3: una aserción de `tests/mirror/` se enmendó, y hay que
  decirlo entero.** El caso 15 de `tests/mirror/user-agent.test.ts` (SPEC-005
  CA-10) comparaba `git diff --name-only main -- src/mirror/` y exigía que el
  único fichero tocado fuera `src/mirror/user-agent.ts`. **ADR-014 §1 la vuelve
  falsa por decisión firmada**: el traslado toca seis ficheros de ese directorio
  a propósito. Ningún reescrito de rutas la salva —apuntada a `src/polite/` lista
  los módulos nuevos y falla igual—, así que no es «el traslado está mal hecho»
  sino «el guardián caducó». Se conservó su **propósito** (que cambiar la cadena
  declarada siga siendo un cambio de un solo fichero) con dos casos nuevos que
  escanean `src/` y exigen que `medicion de latencia` y `USER_AGENT_PRODUCT =`
  vivan en `polite/user-agent.ts` y en ningún otro sitio, más un caso que
  comprueba que ya no viven dentro del instrumento. **El guardián nuevo es más
  débil que el viejo**: solapa con el caso 2 de `tests/site/crawler-page.test.ts`
  y no vigila el diff. Destino: **gate humano** — es la única aserción enmendada
  y CA-3 pedía que se parara si hacía falta enmendar alguna.
- **F-SPEC-008-2 — ⚠️ CA-8: solo la rama `scheduled` está calibrada contra HTML
  real.** Las seis capturas del 2026-08-31 son de la víspera de la jornada 1, así
  que **ninguna fila jugada existía en ellas**. Lo que las otras cuatro ramas
  escriben en `td.vs` —marcador `N-N`, clase `live`, la palabra `Aplazado`,
  `Suspendido`— es una **convención declarada, no una observación**. Está aislada
  en `CEROACERO_SHAPE`, así que recalibrar el día que se capture una página en
  vivo es editar ese objeto y nada más. Destino: **la spec del cron / la primera
  jornada real de EPIC-002**, que es la primera que capturará partidos en juego.
- **F-SPEC-008-3 — El traslado se llevó dos piezas que ADR-014 §1 no lista.**
  `Clock`/`systemClock` (de `src/mirror/capture/ports.ts`) y los puertos HTTP
  (`HttpRequest`, `HttpResponse`, `HttpFetcher`) tuvieron que ir a `src/polite/`
  con ellos: `http.ts` no compila sin sus puertos, y dejar el reloj en el
  instrumento habría obligado a `src/ingest/` a escribirse un segundo
  `systemClock` —«el único sitio donde se lee el reloj de pared», dice su propio
  comentario— o a importar de `src/mirror/`, que es la dirección de dependencia
  que el ADR rechaza. Se añadió además `epochMsOf` en `src/polite/clock.ts`,
  que duplica en tres líneas lo que `src/mirror/instants.ts` hace con su propio
  contrato de error. Destino: **`sdd-arquitecto`**, por si quiere una nota en
  ADR-014 o unificar los dos convertidores.
- **F-SPEC-008-4 — Los tests de los módulos trasladados siguen en
  `tests/mirror/`.** `tests/mirror/capture/robots.test.ts` y
  `redirects.test.ts` prueban hoy código de `src/polite/` desde el árbol de
  tests del instrumento; solo cambió la ruta del directorio que escanean. Se
  dejaron ahí **a propósito**, para que «la suite `tests/mirror/` pasa entera»
  (CA-3) siga siendo literalmente comprobable por el verificador. Moverlos es
  trabajo de higiene posterior. Destino: **EPIC-MEJORA**.
- **F-SPEC-008-5 — El gate de calidad está rojo en `main`, por un fichero de
  EPIC-004.** `npm run lint` falla con `docs/diseno/_logic.js:3:9`. El fichero es
  un fragmento de lógica compartido a mano por los artboards del sistema de
  diseño; no es JavaScript completo y oxlint no puede parsearlo. **Ya fallaba en
  `88c359b`**, antes de esta rama. La reparación es de una línea —añadir
  `docs/` (o `/docs/diseno/`) a `ignorePatterns` de `.oxlintrc.json`— pero toca
  configuración de ADR-007 y un artefacto de una épica **congelada**, así que no
  se hace aquí. Destino: **gate humano**, y es un bloqueante para que el
  verificador pueda declarar el gate de calidad verde.
- **F-SPEC-008-6 — `SourceRow` duplica la forma de `ExtractedMatch`.**
  `src/mirror/analysis/extract.ts` tiene un DTO con los mismos siete campos, y
  `src/ingest/ports.ts` declara el suyo porque `src/ingest/` no puede colgar del
  instrumento. No es una regla duplicada —es un DTO— pero conviene que alguien
  decida si el modelo canónico debería alojar la forma «fila tal como la escribe
  la fuente». Destino: **`sdd-arquitecto`**, en la spec del motor.
- **F-SPEC-008-7 — La pregunta legal sigue sin contestar, y esta spec no la
  contestó.** SPEC-008 §7 de las notas del gate: `sdd-legal-datos` dictaminó
  `ceroacero.es` **CORRECTO para la ventana acotada**, y esta spec construye la
  máquina de un sondeo de una jornada entera. La spec misma recomienda pedir el
  dictamen **antes de correr la primera jornada, no antes de escribir el
  código**. El código está escrito y **no se ha corrido contra ceroacero.es ni
  una sola vez**: todo lo que hay aquí corre contra dobles y fixtures
  sintéticos. Destino: **gate humano / `sdd-legal-datos`**, antes de la primera
  captura real.
- **F-SPEC-008-8 — Ninguna de las cuatro cifras se mueve.** Es lo que la spec
  prometía (§8 de las notas) y se cumple: hay `Observation` en memoria, un
  archivo que sabe reproducirse y una regla dura que por fin se cumple. No hay
  cron, ni calendario, ni catálogo de alias, ni motor, ni persistencia, ni
  `migrations/0002`. Destino: **`sdd-arquitecto`**, para las specs siguientes de
  EPIC-002.

## Cómo retomar (handoff)

**Todo está en `ft/SPEC-008-adaptador-ceroacero`, dos commits sobre `88c359b`.
Sin push y sin PR: el merge es humano.**

Lo que hay que mirar antes que nada, en este orden:

1. **F-SPEC-008-1**: la única aserción enmendada de una spec cerrada. Si el gate
   no acepta la enmienda, CA-3 no cierra y hay que decidir qué se hace con el
   caso 15 de `tests/mirror/user-agent.test.ts`.
2. **F-SPEC-008-5**: el gate `npm run lint` está rojo por `docs/diseno/_logic.js`,
   que no es de esta spec y ya fallaba en `main`. Sin esa decisión, el gate de
   calidad no puede declararse verde en ningún sitio del proyecto.
3. **F-SPEC-008-2**: cuatro de las cinco ramas de `status` son convención y no
   observación. Está aislado en `CEROACERO_SHAPE`.

Lo que **no** hay que hacer: implementar `MatchResolver` de verdad (es la spec
del calendario y la del catálogo de alias), ni el cron, ni el motor. El puerto
está definido y doblado a propósito.

Para volver a calibrar contra el archivo antes del **2026-09-30** (purga de
ADR-009): las capturas viven en `raw/objects/ceroacero/…` del checkout
principal, fuera de git, y el extractor se corre sobre ellas con
`extractCeroacero(new Uint8Array(await readFile(ruta)))`.
