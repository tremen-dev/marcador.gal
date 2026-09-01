---
id: SPEC-008
tipo: ledger
epica: EPIC-002
---
# Ledger — SPEC-008 Adaptador de ceroacero.es y cortesia RN-11 con una sola implementacion

## Resumen
- Fase: **en-revisión** — verificada el 2026-09-01 por `sdd-verificador`: **RED**. Ver *Veredicto del verificador*.
- Rama: `ft/SPEC-008-adaptador-ceroacero` (creada sobre `88c359b`)
- Commits: `a95b5ca` (CA-1 + traslado ADR-014 §1) · `377091d` (CA-2, CA-4..CA-13)

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 — comodín `*` y ancla `$` (F-SPEC-002-23) | `src/polite/robots.ts` (`patternToRegExp`, desempate por longitud con `Allow` ganando el empate) | `tests/polite/robots.test.ts` casos 1-18 | M1, M2, M3, M4, V1, V2 corridas por el verificador: las seis mueren en casos nominados de `tests/polite/robots.test.ts`. Las dos mitades del cambio de ADR-014 §2 están probadas **por separado**: comodín y ancla (casos 1-8) y desempate por longitud con el `Allow` ganando el empate (casos 9-11). | ✅ |
| CA-2 — una sola cortesía RN-11 (arquitectura) | `src/polite/{robots,http,user-agent,rate-limit,clock,policy}.ts`; consumidores: `src/mirror/`, `src/ingest/`, `src/site/crawler-page.tsx` | `tests/polite/architecture.test.ts` casos 1-6 (el 6 es el control positivo por destino) | M15 muere en `architecture` 2, 3 y 4, y el control positivo del caso 6 es real. **Pero el guardián se rodea por tres caminos, demostrados ejecutando** (V4, V5 y V6 sobreviven con la suite entera en verde): una segunda puerta de salida con `node:https.request` y cabecera de clave computada; un segundo parser de `robots.txt` sin literales entrecomillados ni los nombres declarados; y una segunda composición de la cadena declarada fuera de `src/polite/`. Ver **F-SPEC-008-V1**. | ⚠️ |
| CA-3 — el traslado no cambia comportamiento | traslado sin fachada; `src/mirror/` conserva `capturer.ts`, `ports.ts`, `thresholds.ts` con rutas nuevas | `tests/mirror/**` (48 ficheros, 347 casos con `tests/site` y `tests/docs`) — **una aserción enmendada**: `tests/mirror/user-agent.test.ts` caso 15 | `npx vitest run tests/mirror tests/site tests/docs` → 48 ficheros / 347 casos en verde, reproducido por el verificador. Ningún caso borrado (ocurrencias de `test(` en esas rutas: 340 en `main`, 341 en HEAD). La enmienda del caso 15 está **aceptada por el gate humano** —ADR-014 §1 la vuelve falsa por decisión firmada— y el guardián nuevo muerde: V13 (copia literal de la cadena en `src/site/`) y V14 (cambiar la versión declarada) mueren en 2 y 4 casos. **El recuento del ledger es incorrecto**: hay cuatro ficheros más de suites cerradas con cambios que no son rutas de `import`. Ver **F-SPEC-008-V2**. | ⚠️ |
| CA-4 — archivar antes de parsear (RN-10) | `src/ingest/adapter.ts` (`capture` vía `captureThenParse`, lanza sin envolver) | `tests/ingest/adapter.test.ts` casos 1-5 | M5, M7, M8, M13, V3b, V3c y V9 mueren en `adapter` 1-5. El `put` precede al lector, el `raw_ref` devuelto es el que llevan todas las `Observation`, y un `put` fallido no deja resultado parcial ni error envuelto. | ✅ |
| CA-5 — robots / UA / sin redirección (RN-11) | `src/ingest/adapter.ts` (`assertUserAgent` primero, `PolicyGate`, `politeFetch`) | `tests/ingest/adapter.test.ts` casos 5-9 | M5, M6 y V10 mueren en `adapter` 5-9. Los tres escenarios están: política prohibitiva (cero peticiones al objetivo, motivo con la ruta y RN-11), user-agent vacío (`MissingUserAgentError` antes de abrir política, tocar el archivo o mirar el `robots.txt` — el doble del `PolicyGate` registra que no le preguntaron) y 3xx (`RedirectNotFollowedError`, `Location` en el motivo, nada archivado bajo la competición). | ✅ |
| CA-6 — `robots.txt` obtenido, archivado y caducado | `src/polite/policy.ts` (`RobotsGate`, `ROBOTS_MAX_AGE_MS`, `ROBOTS_COMPETITION_ID`) | `tests/ingest/robots-policy.test.ts` casos 1-9 | M7, M8, V3b y V3c mueren en `robots-policy` 1-9. La clave `ceroacero/robots/2026-09-06/…z-<12hex>.txt` está asertada literalmente; las 6 h se comprueban por arriba y por abajo; se falla cerrado en las tres formas (nunca obtenida, caducada, petición fallida). Salvedad menor: V3 —parsear antes de archivar **sin** usar el resultado antes del `put`— sobrevive. Ver **F-SPEC-008-V3**. | ✅ |
| CA-7 — 1 pet./min por competición dentro | `src/polite/rate-limit.ts` (`RateLimiter`) + `src/ingest/adapter.ts` (`tick`) | `tests/ingest/adapter.test.ts` casos 10-13 | M9 y V7 mueren en `adapter` 10-13; el sello antes del `await` está probado con el escenario realista. **Pero el ritmo lo puede imponer quien llama**: `SourceAdapter.capture()` es público y no consulta el limitador. Sonda del verificador (fichero temporal, borrado): diez llamadas seguidas a `capture()` con el reloj parado producen **diez peticiones** al mismo par (source, competición). En SPEC-002 el equivalente, `Capturer.#capture`, es privado y solo `tick()` es público. Ver **F-SPEC-008-V4**. | ⚠️ |
| CA-8 — extracción de ceroacero, fixtures sintéticos | `src/ingest/ceroacero.ts` (`CEROACERO_SHAPE`, `tableExtractor`) | `tests/ingest/ceroacero.test.ts` casos 1-10 · fixtures `tests/fixtures/ceroacero.ts` | M13 y M14 mueren en `ceroacero` 1-10: las cinco ramas, el marcador, la hora y las tres formas de fila ilegible están cubiertas, y el segundo señuelo del fixture hace que ensanchar el `rowSelector` sea rojo. `tests/fixtures/ceroacero.ts` es sintético y escrito a mano; **ningún HTML real de terceros versionado** en la rama (comprobado sobre `git ls-files` y sobre el diff completo contra `main`). Salvedad viva: **F-SPEC-008-2** —solo la rama `scheduled` está calibrada contra el archivo—. V11 sobrevive pero es **equivalente**: `scheduled` implica `kickoff !== null` por construcción de `statusFromResult`. | ⚠️ |
| CA-9 — forma de la `Observation` (RN-01, ADR-006) | `src/ingest/observations.ts` (`readRows`) + `src/ingest/sources.ts` (`RN01_WEIGHTS`) | `tests/ingest/observations.test.ts` casos 1-7 · `tests/ingest/registry.test.ts` casos 4-6 | M10, V8, V9 y V12 mueren. Los cinco puntos verificados uno a uno: `ObservationSchema.parse` y no un cast, `confidence` leído del registro, `observed_at` como cadena ISO 8601 con `Z` (ADR-006: el único `Date` del código nuevo es el conversor transitorio de `src/polite/clock.ts`, documentado), `raw_ref` obligatorio y apuntando a lo archivado, y salida congelada. | ✅ |
| CA-10 — replay determinista | `src/ingest/observations.ts` (`observationId`, digest de `raw_ref` + `source_ref`) | `tests/ingest/observations.test.ts` casos 8-10 | M11 muere en `observations` 10. Determinismo, independencia del orden de las filas y `id` distintos para dos capturas del mismo partido, los tres comprobados; el `id` es un digest de `raw_ref` + `source_ref`. | ✅ |
| CA-11 — una fuente es configuración | `src/ingest/sources.ts` (`sourceRegistry`, `SourceEntry`, `DEFAULT_SOURCES`) | `tests/ingest/registry.test.ts` casos 1-7 | M10 muere en `registry` 4-5. La fuente de juguete —`futgal`, peso 1.0, forma de página propia— queda capturable y legible sin tocar ninguna firma ni ningún módulo salvo el registro, y el peso viaja del registro al `confidence`. | ✅ |
| CA-12 — no publica nada (RN-08, arquitectura) | `src/ingest/` entero: ninguna referencia a `Decision` | `tests/ingest/no-decision.test.ts` casos 1-3 (el 2 es el control positivo) | M16 muere en `no-decision` 1. El control positivo del caso 2 existe y se comprobó que muerde; el caso 3 recorre el camino real y comprueba que del adaptador solo salen `observations` y `unresolved`. | ✅ |
| CA-13 — la identidad no se adivina (RN-09) | `src/ingest/ports.ts` (`MatchResolver`, definido y no implementado) + `readRows` | `tests/ingest/observations.test.ts` casos 11-15 | M12 muere en `observations` 11-14. No hay ninguna rama que fabrique un `MatchId`, lo normalice por parecido o lo tome del texto de la fuente; la fila no resuelta vuelve íntegra en su lista aparte. | ✅ |

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

## Veredicto del verificador — RED (2026-09-01, `sdd-verificador`)

**RED.** Diez de los trece CA quedan ✅ con mutación propia que muerde. Tres
quedan ⚠️, y **una de esas tres no la ha aceptado nadie y es la que bloquea**:
las dos barreras que sostienen RN-11 en esta spec —el test de arquitectura de
CA-2 y el limitador de CA-7— **se pueden rodear**, y lo demuestro ejecutando, no
leyendo. Lo demás está muy bien: las dieciséis mutaciones que el ledger declara
las repetí una a una y **las dieciséis mueren**; ninguna la di por buena de
palabra.

**Lo primero de todo, porque es irreversible si se incumple: no hay HTML real de
terceros versionado.** `tests/fixtures/ceroacero.ts` es sintético y escrito a
mano; el diff completo contra `main` no añade un solo fichero `.html`, y los
únicos `.html` del repositorio son páginas propias en `_qa/` y el sistema de
diseño en `docs/diseno/`. ADR-009 §3 se respeta.

### Gates, corridos por el verificador en esta rama

`npm run lint` — **verde**. Salida literal:

```
> marcador@0.0.1 lint
> oxlint --type-aware

exit=0
```

Y comprobado rompiendo, porque un linter que no mira nada también sale con 0:
escribí `src/ingest/_verif-lint-probe.ts` con un `debugger`, y el gate cayó.
Salida literal, con el fichero sonda ya borrado:

```
> marcador@0.0.1 lint
> oxlint --type-aware

src/ingest/_verif-lint-probe.ts:3:3: error eslint(no-debugger): `debugger` statement is not allowed help: Remove the debugger statement
exit=1
```

`npm test` — **verde**. Salida literal:

```
> marcador@0.0.1 test
> vitest run

 RUN  v4.1.11 /Users/albertofojo/src/tremen-dev/marcador.gal/.claude/worktrees/agent-a52fc6b13a95e1541

 Test Files  79 passed (79)
      Tests  700 passed (700)
Type Errors  no errors
   Start at  13:16:04
   Duration  1.98s (transform 1.91s, setup 0ms, import 7.12s, tests 6.52s, environment 4ms, typecheck 263ms)
```

Las suites de las specs cerradas (SPEC-002 a SPEC-007), aparte y enteras:

```
$ npx vitest run tests/mirror tests/site tests/docs
 RUN  v4.1.11 /Users/albertofojo/src/tremen-dev/marcador.gal/.claude/worktrees/agent-a52fc6b13a95e1541

 Test Files  48 passed (48)
      Tests  347 passed (347)
Type Errors  no errors
   Duration  1.52s
```

Y ningún caso desapareció por el camino: ocurrencias de `test(` en
`tests/mirror tests/site tests/docs`, **340 en `main` y 341 en HEAD** (el que
sube es el caso 16 nuevo de `user-agent.test.ts`).

**Sobre el gate de calidad roto en `main`:** ya no lo está en esta rama. El
`ignorePatterns` de `.oxlintrc.json` lleva `/docs/diseno/`, y la sonda de arriba
demuestra que el linter sigue mirando `src/`. **F-SPEC-008-5 queda cerrado.**

### Mutaciones

**Las dieciséis del ledger, repetidas por el verificador: las dieciséis mueren.**
Cada una aplicada sola sobre el árbol limpio, corrida contra
`tests/polite tests/ingest tests/mirror tests/site tests/docs` (430 casos) y
revertida; `git status` vacío antes y después de todas.

| # | Casos que se pusieron rojos al mutar |
|---|---|
| M1 comodín literal | `robots` 1, 2, 4, 5, 7 |
| M2 sin ancla `$` | `robots` 5 |
| M3 el empate lo gana el primero del fichero | `robots` 10 |
| M4 origen sin política permitido | `robots` 15 · `mirror/capture/robots` 3 |
| M5 se ignora `decision.allowed` | `adapter` 5 (CA-4), 5 (CA-5), 13 · `robots-policy` 7, 9 |
| M6 sin `assertUserAgent` al principio | `adapter` 6 |
| M7 el gate refresca en cada llamada | `adapter` 5 · `robots-policy` 4, 5, 6, 8 |
| M8 el gate permite sin política | `adapter` 5 · `robots-policy` 7, 9 |
| M9 sello solo si el intento fue `ok` | `adapter` 12, 13 |
| M10 `confidence` fijado dentro del adaptador | `registry` 4, 5 |
| M11 `observationId` deja de mirar el `raw_ref` | `observations` 10 |
| M12 se fabrica el `MatchId` desde el `source_ref` | `observations` 11, 12, 13, 14 |
| M13 `rowSelector` ensanchado | `ceroacero` 1-6 · `adapter` 2 |
| M14 sin aborto de la fila puntuable sin marcador | `ceroacero` 9b |
| M15 segunda cortesía en `src/mirror/thresholds.ts` | `architecture` 2, 3, 4 |
| M16 `DecisionStore` en `src/ingest/sources.ts` | `no-decision` 1 |

Única discrepancia con el ledger, y es de detalle: M2 mata el caso **5**, no el
6. Mi variante deja el `$` dentro del patrón en vez de quitarlo del final, así
que el efecto observable cambia de lado. Muere igual.

**Catorce mutaciones propias. Once mueren, una es equivalente, y tres sobreviven
—las tres en el mismo sitio.**

| # | Mutación del verificador | Resultado |
|---|---|---|
| V1 | la ruta que se compara con `robots.txt` pierde el query string | ROJO: `robots` 6, 18 |
| V2 | el grupo `*` gana al específico | ROJO: `robots` 17 · `user-agent` 12, 14 |
| V3 | el `robots.txt` se parsea antes del `put`, sin usarlo antes | **VERDE — sobrevive** (F-SPEC-008-V3) |
| V3b | …y además se cachea antes del `put` (RN-10 roto de verdad) | ROJO: `adapter` 5 |
| V3c | el `robots.txt` no se archiva en absoluto | ROJO: `adapter` 1, 5 · `robots-policy` 2, 3, 5 |
| V4 | segunda puerta de salida con `node:https.request` y clave de cabecera computada | **VERDE — sobrevive** (F-SPEC-008-V1) |
| V5 | segundo parser de `robots.txt` sin literales entrecomillados ni los nombres declarados | **VERDE — sobrevive** (F-SPEC-008-V1) |
| V6 | segunda composición de la cadena declarada fuera de `src/polite/` | **VERDE — sobrevive** (F-SPEC-008-V1) |
| V7 | el limitador se apaga en el `tick` | ROJO: `adapter` 10, 11, 12, 13 |
| V8 | `observed_at` pasa a ser un `Date` (ADR-006) | ROJO: 20 casos en 4 ficheros |
| V9 | el `raw_ref` de la `Observation` deja de ser el archivado | ROJO: `adapter` 2 · `registry` 2 |
| V10 | se sigue la redirección en vez de fallar | ROJO: `adapter` 8 · `mirror/capture/redirects` 1, 2 |
| V11 | `kickoff` inventado (`'00:00'`) para un `scheduled` sin hora | VERDE, pero **equivalente**: `statusFromResult` solo devuelve `scheduled` cuando `kickoff !== null`, así que la rama es inalcanzable |
| V12 | la `Observation` se construye sin `ObservationSchema.parse` | ROJO: `observations` 6 |
| V13 | copia literal de la cadena declarada en `src/site/` | ROJO: `user-agent` 15 · `crawler-page` 2 |
| V14 | cambia `USER_AGENT_VERSION` | ROJO: `user-agent` 1 · `crawler-page` 3 · `carta-y-rastro` 1, 4 |

**Y una sonda que no es una mutación, sino una llamada al API público** (fichero
temporal en `tests/ingest/`, ya borrado): construir un `SourceAdapter` completo,
con `RobotsGate` real y el limitador puesto, y llamar **diez veces seguidas a
`adapter.capture()` con el reloj parado**. Salen **diez peticiones** al mismo par
(fuente, competición) dentro del mismo minuto simulado:

```
PETICIONES AL OBJETIVO EN EL MISMO MINUTO: 10
AssertionError: expected 10 to be less than or equal to 1
```

### Findings del verificador

- **F-SPEC-008-V1 — ❌ BLOQUEANTE, CA-2: el guardián de la cortesía deja tres
  caminos abiertos, y los tres se demuestran ejecutando.** El test de
  arquitectura muerde para las formas que modela (M15 y su control positivo lo
  confirman), pero sus tres detectores son literales y nominales, no semánticos.
  Con la suite **entera en verde** conviven:
  1. **Una segunda puerta de salida a un tercero** que no usa `fetch`:
     `import { request } from 'node:https'` y `request(url, { headers })`, con la
     cabecera puesta por clave computada (`const key = 'User-' + 'Agent'`). El CA
     dice literalmente «cualquier llamada a `globalThis.fetch` **o equivalente**»
     y `callsPlatformFetch` no sabe reconocer ninguna equivalente. Es también la
     tercera prohibición de ADR-014 §4 —pedir a un tercero sin pasar por
     `politeFetch`— y la de modo de fallo más silencioso.
  2. **Un segundo parser de `robots.txt`** que no escribe los tokens
     entrecomillados (`/^\s*disallow\s*:/i` en vez de `'disallow'`) ni declara
     ninguno de los cinco nombres que busca `ROBOTS_SYMBOL`.
  3. **Una segunda composición de la cadena declarada** fuera de `src/polite/`,
     armada desde las constantes exportadas, sin el literal
     `medicion de latencia` ni una asignación a `USER_AGENT*`.
  Destino: **`sdd-implementador`**, en esta misma spec. Es trabajo de un solo
  fichero de tests y no toca `src/`.

- **F-SPEC-008-V2 — ⚠️ CA-3: el ledger cuenta una aserción enmendada y son
  cinco ficheros.** La enmienda del caso 15 está aceptada por el gate humano y no
  se discute; lo que hay que corregir es el recuento, porque CA-3 pedía pararse
  ante cualquier aserción enmendada y el ledger es donde eso queda escrito.
  Además del caso 15/16 de `tests/mirror/user-agent.test.ts` (F-SPEC-008-1) y de
  los directorios escaneados de `robots.test.ts` caso 8 y `redirects.test.ts`
  caso 4 (F-SPEC-008-4), cambian:
  - `tests/mirror/capture/no-parse.test.ts`, caso final:
    `expect(reachable).toContain('src/mirror/thresholds.ts')` →
    `expect(reachable).toContain('src/polite/rate-limit.ts')`. **No es una ruta
    de `import`**: es la aserción, y cambia porque `MIN_REQUEST_INTERVAL_MS` salió
    de `thresholds.ts` y el `Capturer` ya no alcanza ese módulo. Está autorizado
    por ADR-014 §1 y la aserción sigue diciendo lo mismo («el capturador alcanza
    el limitador»), pero no está declarado en ningún sitio.
  - `tests/site/crawler-page.test.ts`, caso 2: el literal esperado pasa de
    `'mirror/user-agent.ts'` a `'polite/user-agent.ts'`.
  Destino: **`sdd-implementador`** (una corrección de ledger, no de código).

- **F-SPEC-008-V3 — ⚠️ CA-6: RN-10 para el `robots.txt` está sostenido por la
  estructura, no por un test.** Mover el `parseRobots` fuera del callback de
  `captureThenParse` —parsear los bytes y archivarlos después, sin usar el
  resultado antes del `put`— **no pone rojo nada** (V3). Hoy el código es
  correcto y la forma de `captureThenParse` lo protege bien; lo que falta es un
  caso que asegure el orden *bytes leídos después del `put`* para el
  `robots.txt`, como el caso 1 de `adapter.test.ts` lo asegura para la página.
  Cualquier variante que además **use** el resultado antes de archivar sí muere
  (V3b, V3c), así que el daño posible hoy es acotado. Destino: **EPIC-MEJORA**.

- **F-SPEC-008-V4 — ❌ BLOQUEANTE, CA-7: el limitador de RN-11 se rodea por el
  API público del propio adaptador.** `SourceAdapter.capture()` es público y no
  consulta `#limiter`; solo `tick()` lo hace. Diez llamadas a `capture()` con el
  reloj parado producen diez peticiones al mismo par (sonda de arriba). CA-7 dice
  que «el ritmo lo impone el adaptador, **no quien lo llama**», y §4 de la spec
  exige que un cron a diez segundos, **un bucle local supervisado** y un test con
  reloj falso sean *igual de incapaces* de excederlo; un bucle local que llame a
  `capture()` no lo es. **Es además una pérdida de garantía respecto al
  instrumento que ADR-014 vino a centralizar**: en `src/mirror/capture/capturer.ts`
  el equivalente `#capture` es **privado** y la única entrada pública es `tick()`.
  Arreglo posible sin romper la costura de §5: que `capture()` consulte y selle el
  limitador, o que deje de ser público y la costura de replay la dé `tick()`
  devolviendo los bytes. Destino: **`sdd-implementador`**, en esta misma spec.

- **F-SPEC-008-V5 — ⚠️ Queda una capa de compatibilidad pequeña que ADR-014 §1
  prohíbe.** `src/mirror/capture/ports.ts` conserva un `pairKey(target)` que
  delega en `politePairKey(source, competition_id)`. No es un reexport —cambia la
  firma— pero deja dos nombres para la misma cosa, que es justo lo que el ADR
  quiere evitar, y ningún test lo impide. Destino: **EPIC-MEJORA**.

### Salvedades del implementador, revisadas una a una

- **F-SPEC-008-1** (CA-3, aserción enmendada): **aceptada por el gate humano**,
  y el guardián sustituto **sí muerde** para lo que dice cubrir (V13 y V14
  mueren en cuatro casos de tres suites distintas). El propio ledger reconoce que
  es más débil que el viejo, y lo es: V6 muestra un camino que se le escapa.
  Queda ⚠️, nunca ✅. Sigue viva.
- **F-SPEC-008-2** (CA-8, solo `scheduled` calibrada): **ratificada**. Es honesta,
  está aislada en `CEROACERO_SHAPE` y su destino —la primera jornada real— es el
  correcto. Sigue viva.
- **F-SPEC-008-3** (el traslado se llevó reloj y puertos HTTP): **ratificada**.
  El razonamiento se sostiene mirando el código: `http.ts` no compila sin sus
  puertos y dejar el reloj en el instrumento invertiría la dependencia que
  ADR-014 endereza. `Date` queda confinado a `src/polite/clock.ts` como conversor
  transitorio, que es lo que ADR-006 permite.
- **F-SPEC-008-4** (los tests de lo trasladado siguen en `tests/mirror/`):
  **ratificada**, y en efecto hace comprobable CA-3.
- **F-SPEC-008-5** (gate de calidad rojo en `main`): **cerrado**. Ver arriba.
- **F-SPEC-008-6**, **F-SPEC-008-7**, **F-SPEC-008-8**: **ratificadas**, ninguna
  bloquea esta verificación. La séptima —el dictamen de `sdd-legal-datos` sobre
  `ceroacero.es` en régimen de ingesta— sigue **sin contestar**, y el verificador
  confirma el hecho que la hace tolerable hoy: **el código no se ha corrido
  contra `ceroacero.es` ni una sola vez** en esta rama; todo corre contra dobles
  y fixtures sintéticos.

### Lo que necesita decisión humana

1. **Los dos bloqueantes son de implementación, no de gate.** F-SPEC-008-V1 y
   F-SPEC-008-V4 se arreglan con tests y un cambio de visibilidad; no piden
   reabrir ADR-014 ni la spec.
2. **La pregunta legal (F-SPEC-008-7) sigue abierta** y es del humano: pedir el
   dictamen de `sdd-legal-datos` **antes de correr la primera jornada**.
3. Las 6 h de ADR-014 §3.2 y la licencia de `competition_id: 'robots'` están
   firmadas y no las reabro; solo dejo constancia de que las verifiqué tal como
   están escritas.


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
