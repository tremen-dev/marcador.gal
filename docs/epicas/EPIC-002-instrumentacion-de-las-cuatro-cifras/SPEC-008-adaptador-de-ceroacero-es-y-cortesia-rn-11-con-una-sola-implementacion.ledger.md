---
id: SPEC-008
tipo: ledger
epica: EPIC-002
---
# Ledger — SPEC-008 Adaptador de ceroacero.es y cortesia RN-11 con una sola implementacion

## Resumen
- Fase: **en-revision** (tras la TERCERA vuelta de implementación). Las dos primeras verificaciones salieron **RED**; el 2026-09-01 Alberto Fojo arbitró dos enmiendas y esta vuelta las aplica: **CA-2 sustituido entero** (contención de capacidad, CA-2.1..CA-2.8) y **CA-14 nuevo** (el ritmo de RN-11 sobrevive al proceso, con `migrations/0002`). Ver *Tercera vuelta*, al final.
- **Las dos suites están verdes y las dos salidas literales están en el ledger**: `npm test` 748/748 y `npm run test:db` **144/144 contra un Postgres real**. `DATABASE_URL_TEST` estaba disponible, así que **ningún criterio de CA-14 queda UNMET**. Para correrlo desde un worktree hacen falta los dos pasos de **F-SPEC-008-17**.
- **31 mutaciones** corridas en esta vuelta; 29 mueren. Las dos que sobreviven lo hacen por diseño y están nombradas: **N4** es la pérdida que el arbitraje firmó (CA-2.8, F-SPEC-008-20) y **N6a** es un control cuyo resultado esperado es verde. Y **N1 encontró un agujero real** en el propio guardián nuevo, que se arregló antes de cerrar.
- Rama: `ft/SPEC-008-adaptador-ceroacero` (creada sobre `88c359b`)
- Commits: `a95b5ca` (CA-1 + traslado ADR-014 §1) · `377091d` (CA-2 viejo, CA-4..CA-13) · `e542193` (veredicto del verificador) · el commit de la segunda vuelta (F-SPEC-008-V1 y F-SPEC-008-V4) · `691bcd0` (el arbitraje de Alberto aplicado a la spec) · **tercera vuelta**: `22fb1c9` (CA-14), `ff93e89` (CA-2 enmendado), `b8a9021`, `d8a30c3`, `7abaf8e` (los dos arreglos que salieron de romper)

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 — comodín `*` y ancla `$` (F-SPEC-002-23) | `src/polite/robots.ts` (`patternToRegExp`, desempate por longitud con `Allow` ganando el empate) | `tests/polite/robots.test.ts` casos 1-18 | M1, M2, M3, M4, V1, V2 corridas por el verificador: las seis mueren en casos nominados de `tests/polite/robots.test.ts`. Las dos mitades del cambio de ADR-014 §2 están probadas **por separado**: comodín y ancla (casos 1-8) y desempate por longitud con el `Allow` ganando el empate (casos 9-11). | ✅ |
| CA-2 (enmendado) — contención de capacidad, CA-2.1..CA-2.8 | **No toca `src/`.** `tests/polite/support/capability.ts` declara `SCAN_ROOTS`, `ALLOWED_PACKAGES`, `ENTRY_POINTS`, `CONTAINED_DIRS` y los detectores; `tests/mirror/support/imports.ts` ensanchado (efecto lateral, `import()` dinámico, `.tsx`) — es lo único que CA-2.5 exige tocar. Consumidores sin cambio: `src/polite/{robots,http,user-agent,rate-limit,clock,policy}.ts`, `src/mirror/`, `src/ingest/`, `src/site/crawler-page.tsx` | **CA-2.1 y CA-2.2**: `tests/polite/containment.test.ts` casos 1-13 (1 la trampa muerde · 2 `src/ingest/` con el `globalFetcher` real · 3 la CLI de captura conducida entera · 4-5 con doble, cero disparos · **6** control positivo F-SPEC-008-V6 · **7** control positivo F-SPEC-008-V7 · 8-9 contención de conjuntos · **10-11** controles de CA-2.2 · 12-13 el residuo de CA-2.8, acotado). **CA-2.3..CA-2.7**: `tests/polite/architecture.test.ts` casos 1-19 (1-2 CA-2.6 · 3-7 CA-2.3, el **5** es la evasión V7 · 8-12 CA-2.4, el **10** es la evasión V6 y el **12** el antirruido · 13-17 CA-2.5, el **16** es el huérfano · 18-19 CA-2.7, sin exenciones) | **Segunda vuelta (obsoleta, CA-2 fue sustituido el 2026-09-01).** Las tres evasiones de la primera (V4, V5, V6) **mueren**, y sus controles no son decorativos: vaciar `NETWORK_MODULE`, `ROBOTS_WORD` o `UA_PARTS` pone rojo el caso 7 (W25, W26, W27). **Pero el guardián se sigue rodeando, ahora por tres caminos nuevos que el verificador escribió y ejecutó con la suite entera en verde**: (V6') `const { fetch: send } = globalThis` con la clave de cabecera armada por `['User','Agent'].join('-')` — 705/705 en verde y `lint exit=0` con una segunda puerta de salida viva en `src/ingest/`; (V7') `await import('node:' + 'https')`, que se cuela entre `NETWORK_MODULE` y `COMPUTED_IMPORT`; (V8') un **segundo parser de `robots.txt` funcional dentro de `src/site/robots-txt.ts`**, uno de los dos ficheros exentos — 705/705 en verde. Y dos huecos en los propios controles: el caso 8 vigila la **lista** de exenciones pero no el **mecanismo** —cambiarla por un patrón `startsWith('site/')` deja 435/435 en verde (W29)— y `COMPUTED_IMPORT` no tiene control positivo: apagarlo no pone rojo nada (W30). Ver **F-SPEC-008-V6..V10**. | ⚠️ |
| CA-3 — el traslado no cambia comportamiento | traslado sin fachada; `src/mirror/` conserva `capturer.ts`, `ports.ts`, `thresholds.ts` con rutas nuevas | `tests/mirror/**` (48 ficheros, 347 casos con `tests/site` y `tests/docs`). **Cambios en suites cerradas: CINCO ficheros, no uno** (recuento corregido, F-SPEC-008-V2). Solo uno es una aserción reescrita de verdad; los otros cuatro son literales que nombran una ruta que se movió, autorizados por ADR-014 §1 y semánticamente iguales: 1) `tests/mirror/user-agent.test.ts` — el caso 15 **se sustituyó** por dos casos nuevos (15 y 16) y es la única enmienda de fondo (F-SPEC-008-1); 2) `tests/mirror/capture/no-parse.test.ts`, caso final — `expect(reachable).toContain('src/mirror/thresholds.ts')` → `'src/polite/rate-limit.ts'`; **no es una ruta de `import`, es la aserción**, y cambia porque `MIN_REQUEST_INTERVAL_MS` salió de `thresholds.ts` y el `Capturer` ya no alcanza ese módulo (sigue diciendo lo mismo: «el capturador alcanza el limitador»); 3) `tests/site/crawler-page.test.ts`, caso 2 — el literal esperado pasa de `'mirror/user-agent.ts'` a `'polite/user-agent.ts'`; 4) `tests/mirror/capture/robots.test.ts`, caso 8 — el directorio escaneado; 5) `tests/mirror/capture/redirects.test.ts`, caso 4 — ídem | `npx vitest run tests/mirror tests/site tests/docs` → 48 ficheros / 347 casos en verde, reproducido por el verificador. Ningún caso borrado (ocurrencias de `test(` en esas rutas: 340 en `main`, 341 en HEAD). La enmienda del caso 15 está **aceptada por el gate humano** —ADR-014 §1 la vuelve falsa por decisión firmada— y el guardián nuevo muerde: V13 (copia literal de la cadena en `src/site/`) y V14 (cambiar la versión declarada) mueren en 2 y 4 casos. **El recuento del ledger es incorrecto**: hay cuatro ficheros más de suites cerradas con cambios que no son rutas de `import`. Ver **F-SPEC-008-V2**. | ⚠️ |
| CA-4 — archivar antes de parsear (RN-10) | `src/ingest/adapter.ts` (`capture` vía `captureThenParse`, lanza sin envolver) | `tests/ingest/adapter.test.ts` casos 1-5 | M5, M7, M8, M13, V3b, V3c y V9 mueren en `adapter` 1-5. El `put` precede al lector, el `raw_ref` devuelto es el que llevan todas las `Observation`, y un `put` fallido no deja resultado parcial ni error envuelto. | ✅ |
| CA-5 — robots / UA / sin redirección (RN-11) | `src/ingest/adapter.ts` (`assertUserAgent` primero, luego el limitador, luego `PolicyGate` y `politeFetch`) | `tests/ingest/adapter.test.ts` casos 5-9. El **caso 8 se reescribió en la segunda vuelta**: pedía dos veces para asertar dos cosas, y desde que `capture()` respeta el limitador la segunda llamada es un `skipped` y no un rechazo. Ahora captura **una vez** y asienta las dos aserciones sobre el mismo error. Es de esta spec, no de una cerrada | M5, M6 y V10 mueren en `adapter` 5-9. Los tres escenarios están: política prohibitiva (cero peticiones al objetivo, motivo con la ruta y RN-11), user-agent vacío (`MissingUserAgentError` antes de abrir política, tocar el archivo o mirar el `robots.txt` — el doble del `PolicyGate` registra que no le preguntaron) y 3xx (`RedirectNotFollowedError`, `Location` en el motivo, nada archivado bajo la competición). | ✅ |
| CA-6 — `robots.txt` obtenido, archivado y caducado | `src/polite/policy.ts` (`RobotsGate`, `ROBOTS_MAX_AGE_MS`, `ROBOTS_COMPETITION_ID`) | `tests/ingest/robots-policy.test.ts` casos 1-9 | M7, M8, V3b y V3c mueren en `robots-policy` 1-9. La clave `ceroacero/robots/2026-09-06/…z-<12hex>.txt` está asertada literalmente; las 6 h se comprueban por arriba y por abajo; se falla cerrado en las tres formas (nunca obtenida, caducada, petición fallida). Salvedad menor: V3 —parsear antes de archivar **sin** usar el resultado antes del `put`— sobrevive. Ver **F-SPEC-008-V3**. | ✅ |
| CA-7 — 1 pet./min por competición dentro | `src/polite/rate-limit.ts` (`MIN_REQUEST_INTERVAL_MS`, `turnLimitMs`, puerto `RateLimit`, `MemoryRateLimit`, `rateLimitSkipReason`) + `src/ingest/adapter.ts`: **el turno se toma y se sella en UN paso** dentro de `capture()`, que es la única entrada pública al camino de red; `tick()` lo toma él mismo y entra por `#captureGranted`, para que un turno suprimido **siga sin producir registro** y para no gastar dos turnos por petición | `tests/ingest/adapter.test.ts` casos 10-16, sin una aserción cambiada en la tercera vuelta (el **14** es la sonda del verificador vuelta test: diez `capture()` con el reloj parado; el **15** que el limitador es por par y no un cerrojo global; el **16** que un pase no gasta dos turnos) | **F-SPEC-008-V4 CERRADO.** Sonda propia del verificador (fichero temporal, borrado), siete escenarios y todos verdes: doce `capture()` con el reloj parado sobre el mismo par → **1 petición**; dos competiciones intercaladas → 1 cada una; `tick()` seguido de `capture()` en el mismo instante → 1 por par; `tick()` a t y a t+60 s → 2 por par, luego la doble consulta **no gasta dos turnos**; 59 999 ms suprime y 60 000 ms deja pasar; ocho `capture()` concurrentes con respuesta diferida → 1, luego el sello va antes del `await`. Mutaciones propias: W12 (`tick()` pierde su `isDue`) muere en `adapter` 11 y 13 —la segunda consulta no es código muerto— y W14 (`assertUserAgent` movido después del gate) muere en `adapter` 6, luego el orden del §CA-5.2 sigue protegido. **Salvedad que no es de este CA pero hereda la spec del cron**: el limitador es un campo de instancia; una instancia nueva por invocación —la forma real de Vercel Cron, ADR-004 «no hay proceso vivo»— envía 10 peticiones en el mismo minuto (F-SPEC-008-V13). | ✅ |
| CA-8 — extracción de ceroacero, fixtures sintéticos | `src/ingest/ceroacero.ts` (`CEROACERO_SHAPE`, `tableExtractor`) | `tests/ingest/ceroacero.test.ts` casos 1-10 · fixtures `tests/fixtures/ceroacero.ts` | M13 y M14 mueren en `ceroacero` 1-10: las cinco ramas, el marcador, la hora y las tres formas de fila ilegible están cubiertas, y el segundo señuelo del fixture hace que ensanchar el `rowSelector` sea rojo. `tests/fixtures/ceroacero.ts` es sintético y escrito a mano; **ningún HTML real de terceros versionado** en la rama (comprobado sobre `git ls-files` y sobre el diff completo contra `main`). Salvedad viva: **F-SPEC-008-2** —solo la rama `scheduled` está calibrada contra el archivo—. V11 sobrevive pero es **equivalente**: `scheduled` implica `kickoff !== null` por construcción de `statusFromResult`. | ⚠️ |
| CA-9 — forma de la `Observation` (RN-01, ADR-006) | `src/ingest/observations.ts` (`readRows`) + `src/ingest/sources.ts` (`RN01_WEIGHTS`) | `tests/ingest/observations.test.ts` casos 1-7 · `tests/ingest/registry.test.ts` casos 4-6 | Segunda vuelta, mutaciones propias: W9 (`observed_at` pierde la `Z`) mata 20 casos, W13 (`confidence` fijado dentro del adaptador) mata `registry` 4 y 5, W17 (la `Observation` sale sin congelar) mata `observations` 6. **Salvedad nueva en CA-9.1**: el caso 1 —«valida contra `ObservationSchema` antes de salir del adaptador»— vuelve a validar **en el test** (`expect(() => ObservationSchema.parse(observations[0])).not.toThrow()`), así que no distingue «el adaptador validó» de «el dato era válido». Sustituir el `ObservationSchema.parse` del adaptador por un `Object.freeze` con cast deja **435/435 en verde** (W18). Ver **F-SPEC-008-V11**. | ⚠️ |
| CA-10 — replay determinista | `src/ingest/observations.ts` (`observationId`, digest de `raw_ref` + `source_ref`) | `tests/ingest/observations.test.ts` casos 8-10 | M11 muere en `observations` 10. Determinismo, independencia del orden de las filas y `id` distintos para dos capturas del mismo partido, los tres comprobados; el `id` es un digest de `raw_ref` + `source_ref`. | ✅ |
| CA-11 — una fuente es configuración | `src/ingest/sources.ts` (`sourceRegistry`, `SourceEntry`, `DEFAULT_SOURCES`) | `tests/ingest/registry.test.ts` casos 1-7 | M10 muere en `registry` 4-5. La fuente de juguete —`futgal`, peso 1.0, forma de página propia— queda capturable y legible sin tocar ninguna firma ni ningún módulo salvo el registro, y el peso viaja del registro al `confidence`. | ✅ |
| CA-12 — no publica nada (RN-08, arquitectura) | `src/ingest/` entero: ninguna referencia a `Decision` | `tests/ingest/no-decision.test.ts` casos 1-3 (el 2 es el control positivo) | M16 muere en `no-decision` 1. El control positivo del caso 2 existe y se comprobó que muerde; el caso 3 recorre el camino real y comprueba que del adaptador solo salen `observations` y `unresolved`. | ✅ |
| CA-13 — la identidad no se adivina (RN-09) | `src/ingest/ports.ts` (`MatchResolver`, definido y no implementado) + `readRows` | `tests/ingest/observations.test.ts` casos 11-15 | M12 muere en `observations` 11-14. No hay ninguna rama que fabrique un `MatchId`, lo normalice por parecido o lo tome del texto de la fuente; la fila no resuelta vuelve íntegra en su lista aparte. | ✅ |
| **CA-14.1** — un solo paso, no dos | `src/polite/rate-limit.ts` (`interface RateLimit`, una operación: `takeTurn`) + `src/ingest/adapter.ts` (`rateLimit: RateLimit` **obligatorio**, sin `?` y sin `??`; ya no construye ninguno) | `tests/polite/rate-limit.test.ts` casos 1-4 (el 2 exige que `isDue`/`stamp` no exista en ningún sitio de `src/`; el 4 que el puerto sea obligatorio) | — | 🚧 |
| **CA-14.2** — instancia nueva por tick | `src/db/rate-limit.ts` (`PostgresRateLimit`) + `migrations/0002_request_rhythm.sql` | `tests/db/rate-limit.test.ts` casos 3 y 4, sobre `tests/ingest/support/cold-start.ts` (diez `SourceAdapter` construidos por separado, cada uno con su puerto recién creado, compartiendo solo el almacén durable) | — | 🚧 |
| **CA-14.3** — control positivo, el que nombra el defecto | la implementación en memoria, sin cambios | `tests/ingest/adapter.test.ts` casos 17 y 18: la misma batería contra `MemoryRateLimit` da **diez** peticiones y el caso lo afirma como esperado (F-SPEC-008-V13); el 18 es el contraste con el puerto compartido | — | 🚧 |
| **CA-14.4** — dos que llegan a la vez, uno solo sale | `src/db/rate-limit.ts`, `insert … on conflict … where … returning …` | `tests/db/rate-limit.test.ts` casos 5 y 6 (dos y diez concesiones concurrentes sobre el mismo par y el mismo instante) | — | 🚧 |
| **CA-14.5** — una batería, dos implementaciones | `MemoryRateLimit` y `PostgresRateLimit` | `tests/polite/rate-limit-contract.ts` (7 casos, escrita UNA vez, invocada y no recolectada, como `tests/raw/contract.ts`): corre en `tests/polite/rate-limit.test.ts` y en `tests/db/rate-limit.test.ts`. El caso 5 es la cláusula de no acumular que `/robot` publica | — | 🚧 |
| **CA-14.6** — el número vive donde vivía | `MIN_REQUEST_INTERVAL_MS` y `turnLimitMs` en `src/polite/rate-limit.ts`; `src/db/rate-limit.ts` recibe el instante límite y su SQL no lleva ni intervalo ni cifra | caso 6 de la batería de contrato (corre con 10 000 ms contra las dos) + `tests/db/rate-limit.test.ts` caso 7 (la sentencia no contiene ningún dígito ni la palabra `interval`) + `tests/polite/rate-limit.test.ts` caso 7 | — | 🚧 |
| **CA-14.7** — se falla cerrado | `src/ingest/adapter.ts`: `capture()` propaga sin envolver; `tick()` registra `failed` con el motivo y no pide nada | `tests/ingest/adapter.test.ts` casos 19 y 20 | — | 🚧 |
| **CA-14.8** — el instrumento se queda como está | `src/mirror/capture/capturer.ts` (`rateLimit?` con default en memoria, y el motivo escrito) + `src/mirror/cli/capturar.ts` (lo construye explícitamente) | `tests/polite/rate-limit.test.ts` casos 5-8 (la CLI construye la de memoria; **ningún módulo bajo `src/ingest/` la nombra**) | — | 🚧 |
| **CA-14.9** — lo que NO promete | sin código: es una frontera | `tests/ingest/adapter.test.ts` caso 12 (un turno concedido cuya petición falla **se ha gastado**) + `tests/polite/rate-limit.test.ts` casos 5-6 (`src/mirror/` fuera) | — | 🚧 |

## Qué se construyó, y dónde

```
src/polite/            la cortesía RN-11, con un solo dueño (ADR-014 §1)
  robots.ts            RobotsPolicy, parseRobots (RFC 9309), robotsRegistry, robotsSkipReason
  http.ts              puertos HTTP, assertUserAgent, politeRequest, politeFetch, globalFetcher, 3 errores
  user-agent.ts        USER_AGENT y las constantes de ADR-011
  rate-limit.ts        MIN_REQUEST_INTERVAL_MS, RateLimiter, pairKey, rateLimitSkipReason
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

**Estos son los de la PRIMERA vuelta y se conservan como estaban.** Los vigentes
—los dos verdes— están en *Segunda vuelta*; el `npm run lint` rojo de aquí lo
cerró el verificador añadiendo `/docs/diseno/` a `ignorePatterns`
(**F-SPEC-008-5**, cerrado).

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
- **F-SPEC-008-9 — El detector (a) de CA-2 vive con dos exenciones nombradas, y
  eso es lo que cuesta ensancharlo.** `site/robots-txt.ts` y
  `mirror/analysis/referenceless/report.ts` escriben las palabras del formato
  sin analizar el de nadie —uno **genera** el nuestro, el otro **cita** el de
  futgal en una frase en castellano—, así que quedan exentos de `ROBOTS_WORD` y
  solo de él: `ROBOTS_FIELD` y `ROBOTS_SYMBOL` les siguen aplicando, y el caso 8
  lo comprueba. Es más flojo que no tener exención ninguna, y se dice: un
  segundo parser escondido **dentro de esos dos ficheros concretos** solo lo
  cazarían los otros dos detectores. Se aceptó porque la alternativa —tocar
  código de SPEC-003 y SPEC-004, dos specs `hecho`, para que dejen de escribir
  una palabra que escriben con razón— es peor y CA-3 la prohíbe. Destino:
  **EPIC-MEJORA**, si algún día conviene un detector semántico (quién *lee*
  bytes de un `robots.txt`) en vez de uno textual.
- **F-SPEC-008-10 — Los detectores de CA-2 siguen siendo textuales, y por tanto
  siguen siendo una lista de lo que ya sabemos escribir.** Las tres evasiones
  del verificador están cerradas y viven como control positivo en `EVASIONS`,
  pero el guardián no es una prueba: es una barrera calibrada contra los
  ataques conocidos. La forma correcta de mantenerlo es **añadir la cuarta
  evasión a `EVASIONS` el día que alguien la encuentre**, y el comentario de
  cabecera del fichero lo dice para quien llegue sin este ledger. Destino:
  **`sdd-verificador`** de cada spec futura que toque `src/polite/`.
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


## Segunda vuelta — respuesta al RED (2026-09-01, `sdd-implementador`)

Los **dos bloqueantes** están arreglados, y el tercer finding —el recuento falso
del ledger— corregido arriba, en la fila de CA-3. Los otros dos hallazgos del
verificador (**F-SPEC-008-V3** y **F-SPEC-008-V5**) van a **EPIC-MEJORA** y no se
tocan aquí, por encargo explícito del orquestador.

### F-SPEC-008-V1 — CA-2: las tres evasiones mueren, y ninguna toca `src/`

Es un solo fichero de tests, `tests/polite/architecture.test.ts`, como el
verificador anticipó. Los tres detectores dejan de ser literales:

| Evasión (V4, V5, V6) | Por qué pasaba | Qué la mata ahora |
|---|---|---|
| Segunda puerta de salida: `import { request } from 'node:https'`, cabecera por clave computada (`'User-' + 'Agent'`) | `callsPlatformFetch` solo conoce `fetch`, y el CA dice «o **equivalente**» | `NETWORK_MODULE`: se prohíbe **importar** la puerta —`node:http(s)`, `http2`, `net`, `tls`, `dgram`, `dns`, `child_process` y los clientes HTTP de terceros—, más `NETWORK_GLOBAL` (`XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`) y `COMPUTED_IMPORT` (un `import()` cuyo especificador no se puede leer). Se vigila el `import` y no la llamada porque el `import` es lo que no se puede escribir de veinte maneras. `UA_SPLIT` caza además la clave partida |
| Segundo parser con `/^\s*disallow\s*:/i` y ningún nombre de `ROBOTS_SYMBOL` | el detector miraba el token **entrecomillado y exacto**, y una regex no lo está | `ROBOTS_WORD`: la palabra del campo escrita como sea —cadena, regex o identificador—. RFC 9309 fija los nombres: no hay parser que no los escriba |
| Segunda composición de la cadena declarada desde las constantes exportadas, sin el literal del propósito | ni `UA_HEADER` ni `UA_LITERAL` casan si no se asigna a un nombre `USER_AGENT*` | `UA_PARTS`: `USER_AGENT_PRODUCT`, `_VERSION` y `_CONTACT` son de `src/polite/` y solo ahí se leen. Quien necesite la cadena importa `USER_AGENT`, ya compuesta |

Dos decisiones que conviene mirar, porque son las que pagan el ensanche:

1. **Los `import` se quitan del texto antes de aplicar los detectores (a) y (b)**
   —`withoutModuleSpecifiers`—. Sin eso, `from '@/polite/user-agent'` contaría
   como la palabra `user-agent` y el detector se volvería ruido en cinco
   ficheros. El detector (c) sí mira los especificadores, que es donde vive.
2. **`ROBOTS_WORD` tiene DOS exenciones, nombradas una a una**:
   `site/robots-txt.ts` —que **genera** el nuestro (SPEC-004 CA-11)— y
   `mirror/analysis/referenceless/report.ts` —que **cita** el de futgal dentro
   de una frase en castellano—. Van por nombre y no por patrón, y el **caso 8**
   comprueba que la lista es exactamente esa, que los dos ficheros existen, que
   los dos siguen necesitando la exención y que **ninguno queda exento de
   `ROBOTS_FIELD` ni de `ROBOTS_SYMBOL`**: la exención es solo de la palabra
   suelta. Una exención por patrón sería un agujero; ésta es un diff visible.

El **caso 7** es el control positivo nuevo: las tres evasiones, cada una contra
el detector que le toca —uno a uno, para que no pase en verde porque otro las
cazó de rebote— y una segunda vuelta que exige que el **guardián viejo NO las
cace**. Esa segunda mitad es la prueba, dentro del propio test, de que el
ensanche hacía falta.

### F-SPEC-008-V4 — CA-7: el limitador se consulta en la única entrada pública

`SourceAdapter.capture()` es API pública y ahora **consulta y sella el
limitador** antes de nada que salga a la red. Orden dentro de `capture()`:

1. `assertUserAgent` — va **primero** porque una UA vacía es defecto nuestro, no
   un turno del ritmo, y no se contesta con un `skipped`.
2. `isDue` → si no toca, `{ kind: 'skipped', reason: rateLimitSkipReason(key) }`.
3. `stamp` — **antes del `await`** y antes de mirar el `robots.txt`, igual que
   estaba en el `tick`, y por los mismos dos motivos escritos allí.
4. política, `politeFetch`, `captureThenParse`.

**La costura del §5 no se toca**: `capture()` y `read()` siguen sin llamarse, y
el replay desde el archivo sigue siendo `read` sobre los bytes. Se prefirió esto
a hacer `capture()` privado —la otra salida que el verificador ofrecía— porque
esa habría metido la costura de replay dentro de `tick()`, que es justo lo que
§5 separa.

`tick()` **conserva su propia consulta a `isDue`**, y la duplicación es
deliberada y está comentada en el código: `capture()` impone el ritmo por su
cuenta, pero el pase del cron necesita saber algo que `capture()` no le puede
decir —que un turno suprimido **no produce registro**—. Convertirlo en un
`skipped` lo leería como cobertura perdida. La mutación **M20** prueba que esa
segunda consulta no es código muerto.

Se añadió `rateLimitSkipReason` en `src/polite/rate-limit.ts`, junto al
limitador y por el mismo motivo por el que `robotsSkipReason` vive junto a la
política: el archivo es lo único del spike que le sobrevive, y un `skipped` cuyo
motivo nadie puede leer es un agujero en él.

**Una aserción de esta spec se reescribió por el arreglo**, y va dicha: el caso
8 de `tests/ingest/adapter.test.ts` (CA-5.3) pedía dos veces con el mismo
instante para asertar dos cosas del mismo error; con el limitador dentro, la
segunda es un `skipped`. Ahora captura una vez y aserta las dos cosas sobre el
error que devuelve. **No es una suite cerrada**: es de SPEC-008.

### Mutaciones de la segunda vuelta

Siete más, aplicadas una a una sobre el árbol limpio y revertidas. `git status`
vacío antes y después de cada una. Las tres primeras **no son mutaciones
sintéticas: son las tres evasiones del verificador escritas como ficheros reales
de `src/`**, que es como él las demostró.

| # | Mutación | CA | Casos que se pusieron rojos |
|---|---|---|---|
| M17 | `capture()` deja de consultar el limitador (el estado que encontró el verificador) | CA-7 | `adapter` 14, 15 |
| M18 | el limitador de `capture()` usa una llave global (`pairKey('*','*')`) en vez de la del par | CA-7 | `adapter` 4, 5, 10, 11, 13, 14, 15, 16 · `robots-policy` 7 |
| M19 | el sello se mueve al final, solo si la captura terminó bien (la M9 vieja, en su sitio nuevo) | CA-7 | `adapter` 12, 13 |
| M20 | `tick()` deja de consultar `isDue` y delega todo en `capture()` | CA-7 | `adapter` 11, 13 |
| M21 | `src/ingest/back-door.ts`: `node:https` + cabecera por clave computada (**V4 real**) | CA-2 | `architecture` 3, 4 |
| M22 | `src/ingest/second-robots.ts`: parser con `/^\s*disallow\s*:/i` (**V5 real**) | CA-2 | `architecture` 2 |
| M23 | `src/site/second-ua.ts`: la cadena recompuesta desde las constantes, sin el literal (**V6 real**) | CA-2 | `architecture` 3 |

Y **tres mutaciones sobre los detectores nuevos**, para comprobar que el control
positivo del caso 7 no es decorativo: vaciar `NETWORK_MODULE` mata el caso 7 por
la evasión 1; vaciar `ROBOTS_WORD` lo mata por la 2 **y mata también el caso 8**;
vaciar `UA_PARTS` lo mata por la 3.

**Dato que vale la pena registrar, del M23**: la evasión 3 se corrió contra
`tests/polite tests/mirror tests/site` enteros y murió **en un solo caso** —el
nuevo—, con los otros 367 en verde. Es la confirmación ejecutada de que el
guardián de `tests/mirror/user-agent.test.ts` (casos 15 y 16) **no la cazaba**, y
por tanto de que F-SPEC-008-V1 era cierto y sigue siendo el sustituto más débil
que ya reconocía F-SPEC-008-1.

### Gates de la segunda vuelta

`npm run lint` — **verde**. Salida literal:

```
> marcador@0.0.1 lint
> oxlint --type-aware

exit=0
```

`npm test` — **verde**. Salida literal:

```
> marcador@0.0.1 test
> vitest run

 RUN  v4.1.11 /Users/albertofojo/src/tremen-dev/marcador.gal/.claude/worktrees/agent-ac00ce90e4739f6ad

 Test Files  79 passed (79)
      Tests  705 passed (705)
Type Errors  no errors
   Start at  13:43:33
   Duration  1.79s (transform 1.63s, setup 0ms, import 6.61s, tests 7.37s, environment 4ms, typecheck 144ms)
```

Cinco casos más que en la primera vuelta (700 → 705): dos en
`tests/polite/architecture.test.ts` y tres en `tests/ingest/adapter.test.ts`.
**Ninguno borrado.**

Y las suites de las specs cerradas, **sin mover una coma respecto a la primera
vuelta** —que es lo que había que demostrar, porque el arreglo no las toca—:

```
$ npx vitest run tests/mirror tests/site tests/docs
 RUN  v4.1.11 /Users/albertofojo/src/tremen-dev/marcador.gal/.claude/worktrees/agent-ac00ce90e4739f6ad

 Test Files  48 passed (48)
      Tests  347 passed (347)
Type Errors  no errors
   Duration  1.46s
```

## Cómo retomar (handoff)

**Todo está en `ft/SPEC-008-adaptador-ceroacero`. Sin push y sin PR: el merge es
humano.** La spec queda en `en-revision` para la segunda verificación.

Lo que hay que mirar antes que nada, en este orden:

1. **Los dos bloqueantes están cerrados y hay que volver a atacarlos.**
   F-SPEC-008-V1 (CA-2) y F-SPEC-008-V4 (CA-7) tienen ahora barrera con
   mutación propia que muerde —M17 a M23, más el vaciado de los tres detectores
   nuevos—. El sitio por donde volver a intentarlo es *Segunda vuelta*: la
   cuarta evasión, si existe, entra en `EVASIONS` de
   `tests/polite/architecture.test.ts`.
2. **F-SPEC-008-1**: la enmienda del caso 15 de `tests/mirror/user-agent.test.ts`
   sigue siendo la única de fondo sobre una spec cerrada, y **está aceptada por
   el gate humano**. El recuento de la fila de CA-3 ya está corregido: son cinco
   ficheros, cuatro de ellos literales de ruta.
3. **F-SPEC-008-2**: cuatro de las cinco ramas de `status` son convención y no
   observación. Está aislado en `CEROACERO_SHAPE`.
4. **F-SPEC-008-7**: el dictamen de `sdd-legal-datos` sobre `ceroacero.es` en
   régimen de ingesta sigue **sin pedir**, y va antes de la primera jornada
   real. El código no se ha corrido contra la fuente ni una vez.

**F-SPEC-008-V3** (RN-10 del `robots.txt` sostenido por la forma de
`captureThenParse` y no por un test) y **F-SPEC-008-V5** (el `pairKey(target)`
que sobrevive en `src/mirror/capture/ports.ts`) **no se han tocado aquí**: van a
**EPIC-MEJORA** por encargo explícito, y siguen tal cual el verificador los
dejó.

Lo que **no** hay que hacer: implementar `MatchResolver` de verdad (es la spec
del calendario y la del catálogo de alias), ni el cron, ni el motor. El puerto
está definido y doblado a propósito.

Para volver a calibrar contra el archivo antes del **2026-09-30** (purga de
ADR-009): las capturas viven en `raw/objects/ceroacero/…` del checkout
principal, fuera de git, y el extractor se corre sobre ellas con
`extractCeroacero(new Uint8Array(await readFile(ruta)))`.


## Veredicto del verificador — segunda vuelta: RED (2026-09-01, `sdd-verificador`)

**RED.** De los dos bloqueantes de la primera vuelta, **uno queda cerrado y
comprobado** (F-SPEC-008-V4, CA-7) y **el otro sigue abierto** (CA-2): el
guardián de «una sola cortesía» mata las tres evasiones que se le enseñaron y
**vuelve a dejar tres caminos abiertos**, los tres escritos por el verificador
con sus propias manos y demostrados ejecutando, no leyendo.

**Lo primero, porque es lo irreversible: no hay HTML real de terceros
versionado.** `git ls-files` no lista un solo `.html` de un tercero —los únicos
`.html` del repositorio son páginas propias en `_qa/` (SPEC-004..006) y el
sistema de diseño en `docs/diseno/`—; `tests/fixtures/ceroacero.ts` es sintético
y escrito a mano, con equipos inventados (`Atlético Sintético`, `CF Quimera`) y
la forma calibrada contra el archivo de `raw/`, que está fuera de git. El diff
contra la base de la rama no añade ningún fichero binario ni `.html`. **ADR-009
§3 se respeta.** Y no quedó **ningún fichero de mutación olvidado en `src/`**:
el árbol lista 84 ficheros y ninguno es `back-door.ts`, `second-robots.ts`,
`second-ua.ts` ni `_verif-*`; `git status` está limpio antes y después de toda
la campaña.

### Gates, corridos por el verificador en esta rama

`npm run lint` — **verde**. Salida literal:

```
> marcador@0.0.1 lint
> oxlint --type-aware

exit=0
```

Comprobado rompiendo, porque un linter que no mira nada también sale con 0:
`src/ingest/_verif-lint-probe.ts` con un `debugger`. Salida literal, con el
fichero sonda ya borrado:

```
> marcador@0.0.1 lint
> oxlint --type-aware

src/ingest/_verif-lint-probe.ts:2:3: error eslint(no-debugger): `debugger` statement is not allowed help: Remove the debugger statement
exit=1
```

`npm test` — **verde**. Salida literal:

```
> marcador@0.0.1 test
> vitest run

 RUN  v4.1.11 /Users/albertofojo/src/tremen-dev/marcador.gal/.claude/worktrees/agent-aa4357f2797245d24

 Test Files  79 passed (79)
      Tests  705 passed (705)
Type Errors  no errors
   Start at  14:00:58
   Duration  1.69s (transform 1.83s, setup 0ms, import 6.90s, tests 7.11s, environment 4ms, typecheck 108ms)
```

Las suites de las specs cerradas (SPEC-002 a SPEC-007), aparte y enteras:

```
$ npx vitest run tests/mirror tests/site tests/docs
 RUN  v4.1.11 /Users/albertofojo/src/tremen-dev/marcador.gal/.claude/worktrees/agent-aa4357f2797245d24

 Test Files  48 passed (48)
      Tests  347 passed (347)
Type Errors  no errors
   Duration  1.48s
```

**Y ningún caso desapareció, contado fichero a fichero contra `main` y no por el
total.** `git grep -c 'test(' <ref> -- tests/mirror tests/site tests/docs` sobre
las dos referencias da 44 ficheros en cada una, y el `diff` de los dos recuentos
tiene **una sola línea**:

```
31c31
< tests/mirror/user-agent.test.ts:15
---
> tests/mirror/user-agent.test.ts:16
```

Es decir: ni un fichero de suite cerrada perdió un caso, y el único que se mueve
sube de 15 a 16 —la enmienda ya aceptada de F-SPEC-008-1—. Ningún fichero de
test fue borrado (`git diff --stat` contra la base de la rama no lista ninguna
supresión en esas rutas).

**CA-3, recuento verificado.** El diff contra la base de la rama sobre
`tests/mirror tests/site tests/docs` toca 15 ficheros; **11 son sólo rutas de
`import`** y **4 son literales o aserciones**, exactamente los que el ledger
declara ahora: `user-agent.test.ts` (la enmienda de fondo, aceptada por el gate
humano), `no-parse.test.ts` (`'src/mirror/thresholds.ts'` → `'src/polite/rate-limit.ts'`),
`crawler-page.test.ts` caso 2, y los directorios escaneados de `robots.test.ts`
caso 8 y `redirects.test.ts` caso 4. **F-SPEC-008-V2 queda cerrado.**

### La costura de replay del §5 sigue intacta

Sonda propia (fichero temporal, borrado): tras un `capture()`, un adaptador
**nuevo**, con un fetcher que **estalla** si alguien lo toca y con el reloj
movido a 2027, ejecuta `read()` dos veces sobre los bytes archivados. Resultado:
cero peticiones nuevas, `Observation` idénticas entre las dos pasadas, todas con
el `raw_ref` de la captura, el `observed_at` de la captura (no el del reloj
nuevo), `confidence` 0.7 y congeladas. Y cinco `read()` seguidos con el limitador
recién sellado devuelven filas las cinco veces: **el limitador no estorba al
replay**, que es lo que había que comprobar después del arreglo de CA-7.
`capture()` y `read()` siguen sin llamarse.

### Mutaciones del verificador — 26 aplicadas, una a una, revertidas

`git status` vacío antes y después de cada una. Corridas contra
`tests/polite tests/ingest tests/mirror tests/site tests/docs` (435 casos).

| # | Mutación | CA | Resultado |
|---|---|---|---|
| W1 | el comodín vuelve a ser literal (el fallo de F-SPEC-002-23) | CA-1 | ROJO: `robots` 1, 2, 4, 5, 7 |
| W2 | el patrón ancla SIEMPRE el final | CA-1.1 | ROJO: 10 casos en 3 suites |
| W3 | el empate lo gana el primero del fichero | CA-1.3 | ROJO: `robots` 10 |
| W4 | un origen sin política cargada queda PERMITIDO | CA-1.4 | ROJO: `robots` 15 · `mirror/capture/robots` 3 |
| W5 | se leen bytes ANTES del `put` sin usarlos | CA-4 | **VERDE — sobrevive** (F-SPEC-008-V12) |
| W6b | el fallo del `put` se envuelve en un `skipped` | CA-4 | ROJO: `adapter` 3, 4 |
| W7 | la vigencia del `robots.txt` pasa a 1 ms | CA-6.1 | ROJO: `robots-policy` 4, 6, 8, 9 |
| W8 | el gate permite cuando no hay política | CA-6.3 | ROJO: `adapter` 5 · `robots-policy` 7, 9 |
| W9 | `observed_at` pierde la `Z` | CA-9.3 | ROJO: 20 casos |
| W10 | el `id` deja de ser determinista (contador) | CA-10 | ROJO: 20 casos |
| W11 | la fila sin resolver se publica con `MatchId` fabricado | CA-13 | ROJO: `observations` 11-14 |
| W12 | `tick()` pierde su propia consulta al limitador | CA-7 | ROJO: `adapter` 11, 13 |
| W13 | el `confidence` se fija dentro del adaptador | CA-11 | ROJO: `registry` 4, 5 |
| W14 | `assertUserAgent` se mueve DESPUÉS del gate de robots | CA-5.2 | ROJO: `adapter` 6 |
| W15 | `Aplazado` pasa a leerse como `scheduled` | CA-8 | ROJO: `ceroacero` 4 |
| W16 | la fila puntuable sin marcador ya no aborta | CA-8 | ROJO: `ceroacero` 9b |
| W17 | la `Observation` sale sin congelar | CA-9.5 | ROJO: `observations` 6 |
| W18 | la `Observation` sale sin `ObservationSchema.parse` | CA-9.1 | **VERDE — sobrevive** (F-SPEC-008-V11) |
| W19 | la fila sin los dos nombres se omite en silencio | CA-8 | ROJO: `ceroacero` 7, 8 |
| W20 | `20:00` se lee también como marcador 20-0 | CA-8 | ROJO: `ceroacero` 4, 5, 6 |
| W21 | `DecisionStore` entra en `src/ingest/observations.ts` | CA-12 | ROJO: `no-decision` 1 |
| W22 | se sigue la redirección en vez de fallar | CA-5.3 | ROJO: `adapter` 8 · `redirects` 1, 2 |
| W23 | el `robots.txt` se parsea ANTES del `put` | CA-6 | **VERDE — sobrevive** (= F-SPEC-008-V3, ya rutado) |
| W25 | se vacía `NETWORK_MODULE` | CA-2 | ROJO: `architecture` 7 |
| W26 | se vacía `ROBOTS_WORD` | CA-2 | ROJO: `architecture` 7, 8 |
| W27 | se vacía `UA_PARTS` | CA-2 | ROJO: `architecture` 7 |
| W28 | la lista de exenciones crece con un tercer fichero | CA-2 | ROJO: `architecture` 8 |
| W29 | la exención pasa de nominal a patrón (`startsWith('site/')`) | CA-2 | **VERDE — sobrevive** (F-SPEC-008-V9) |
| W30 | `COMPUTED_IMPORT` se apaga | CA-2 | **VERDE — sobrevive** (F-SPEC-008-V10) |

Descartada por **equivalente**, y se dice en vez de contarla: sustituir
`RN01_WEIGHTS.aggregator` por el literal `0.7` en `sources.ts` sobrevive, pero
es el mismo número escrito de otra manera; lo que CA-9.2 protege —que el
adaptador no tenga su propia constante— lo mata W13.

### Las evasiones que el verificador escribió, y cuáles murieron

Cuatro intentos nuevos, ninguno una variante cosmética de los tres de la primera
vuelta. **Tres sobreviven.**

| # | Evasión escrita por el verificador | Resultado |
|---|---|---|
| V6' | `src/ingest/side-door.ts`: `const { fetch: send } = globalThis;` + `const KEY = ['User','Agent'].join('-'); headers[KEY] = ua; await send(url, { headers })` | **SOBREVIVE**: `npm test` 705/705 y `npm run lint` `exit=0` |
| V7' | `src/ingest/late-door.ts`: `await import('node:' + 'https')` y `gate.request(url).end()` | **SOBREVIVE**: `architecture` 8/8 en verde |
| — | variante con `await import(MOD)` (especificador en variable) | MUERE: `architecture` 4, por `COMPUTED_IMPORT` |
| V8' | un parser real de `robots.txt` (`/^\s*disallow\s*:/iu`, función `forbids`) **dentro de `src/site/robots-txt.ts`**, uno de los dos exentos | **SOBREVIVE**: `npm test` 705/705 |

### Findings del verificador — segunda vuelta

- **F-SPEC-008-V6 — ❌ BLOQUEANTE, CA-2 (ADR-014 §4, tercera prohibición): la
  cuarta evasión existe, y es la más natural de todas.** Fichero
  `src/ingest/side-door.ts`, ocho líneas, con la suite **entera en verde** y el
  linter en `exit=0`:

  ```ts
  const { fetch: send } = globalThis;
  const KEY = ['User', 'Agent'].join('-');

  export async function ask(url: string, ua: string): Promise<number> {
    const headers: Record<string, string> = {};
    headers[KEY] = ua;
    const res = await send(url, { headers });
    return res.status;
  }
  ```

  Por qué se cuela por los tres detectores a la vez: `callsPlatformFetch` busca
  `fetch(` o `globalThis.fetch(` y aquí la llamada es `send(`; no hay `import`,
  luego `NETWORK_MODULE` y `COMPUTED_IMPORT` no aplican; `NETWORK_GLOBAL` no
  lista `globalThis`; `UA_HEADER` pide `'user-agent':` con dos puntos y aquí la
  clave es una variable; `UA_SPLIT` pide una concatenación con `+` y aquí es un
  `join`; y `ROBOTS_WORD` no encuentra `user-agent` porque la cadena nunca se
  escribe entera. **Es una segunda puerta de salida a un tercero, viva en
  `src/ingest/`, con RN-11 sin cumplir y nada rojo.** Destino:
  **`sdd-implementador`** — pero léase antes *Lo que necesita decisión humana*.

- **F-SPEC-008-V7 — ❌ BLOQUEANTE, CA-2: `NETWORK_MODULE` y `COMPUTED_IMPORT`
  dejan un hueco entre los dos.** `await import('node:' + 'https')` empieza por
  comilla, así que `COMPUTED_IMPORT` —que exige que tras `import(` NO venga una
  comilla— no casa; y el literal que `NETWORK_MODULE` ve es `'node:'`, que no
  contiene ninguno de los nombres de módulo de la lista. La variante honesta
  `await import(MOD)` sí muere. Destino: **`sdd-implementador`**.

- **F-SPEC-008-V8 — ❌ BLOQUEANTE, CA-2: por la exención nominal se cuela un
  segundo parser de `robots.txt` de verdad, y no es teoría.** Añadidas al final
  de `src/site/robots-txt.ts` —uno de los dos ficheros de `ROBOTS_PROSE`— estas
  líneas dejan `npm test` en **705/705**:

  ```ts
  const FIELD = /^\s*disallow\s*:/iu;

  export function forbids(txt: string, path: string): boolean {
    return txt
      .split('\n')
      .filter((line) => FIELD.test(line))
      .some((line) => path.startsWith(line.slice(line.indexOf(':') + 1).trim()));
  }
  ```

  Los dos detectores que siguen aplicando a un fichero exento —`ROBOTS_FIELD`,
  que pide el token **entrecomillado y exacto**, y `ROBOTS_SYMBOL`, que pide uno
  de cinco **nombres declarados**— no ven ninguno de los dos. El ledger lo
  anticipaba como **F-SPEC-008-9** y lo rutaba a EPIC-MEJORA; deja de ser una
  salvedad teórica en cuanto se demuestra ejecutando, y cae dentro de
  `src/site/`, que es uno de los tres destinos que CA-2 nombra. Destino:
  **`sdd-implementador` / decisión de spec** (ver abajo).

- **F-SPEC-008-V9 — ❌ CA-2: el caso 8 vigila la lista de exenciones, pero no el
  mecanismo, que es lo que su propio comentario dice vigilar.** El comentario
  reza «Una exención por patrón se convierte en un agujero en cuanto alguien
  crea un fichero que encaje. Éstas van por nombre». Cambiar
  `if (ROBOTS_PROSE.includes(file.path)) return false;` por
  `if (ROBOTS_PROSE.includes(file.path) || file.path.startsWith('site/')) return false;`
  deja **435/435 en verde** (W29): el array sigue teniendo dos nombres y el caso
  8 sigue contento, mientras `src/site/` entero queda exento. Destino:
  **`sdd-implementador`**.

- **F-SPEC-008-V10 — ⚠️ CA-2: `COMPUTED_IMPORT` no tiene control positivo.**
  Apagarlo (`W30`) no pone rojo nada: las tres evasiones de `EVASIONS` mueren
  por `NETWORK_MODULE`, `ROBOTS_WORD` y `UA_PARTS`, ninguna por esta rama.
  Funciona —mató mi variante `await import(MOD)`— pero nadie se enteraría el día
  que alguien la borre por ruidosa. Destino: **`sdd-implementador`**, junto con
  V7.

- **F-SPEC-008-V11 — ⚠️ CA-9.1: el caso que nombra el criterio no muerde.**
  `test('1. valida contra ObservationSchema antes de salir del adaptador')` hace
  `expect(() => ObservationSchema.parse(observations[0])).not.toThrow()`: valida
  **en el test**, no comprueba que el adaptador validara. Sustituir el
  `ObservationSchema.parse` de `readRows` por un `Object.freeze` con cast deja
  **435/435 en verde** (W18). El caso 6 —salida congelada— es el que hoy sostiene
  ese punto, y sostiene RN-13, no ADR-001. Un `confidence` fuera de rango llegado
  del registro saldría del adaptador sin que nada se pusiera rojo. Destino:
  **`sdd-implementador`**; es un caso de test, no toca `src/`.

- **F-SPEC-008-V12 — ⚠️ CA-4: RN-10 para la página está sostenido por la forma
  de `captureThenParse`, no por un test — igual que el `robots.txt`.** Insertar
  en `capture()`, antes del `captureThenParse`, un
  `new TextDecoder().decode(response.body).length` deja **435/435 en verde**
  (W5). Es F-SPEC-008-V3 con la página en vez del `robots.txt`: hoy el código es
  correcto y la estructura lo protege bien, pero el caso 1 mide el orden
  `put` ↔ *callback*, no el orden `put` ↔ *primer byte leído*. Destino:
  **EPIC-MEJORA**, junto a F-SPEC-008-V3, del que es hermano exacto.

- **F-SPEC-008-V13 — ⚠️ No es de CA-7, pero lo hereda la spec del cron y no está
  escrito en ningún sitio: el limitador es memoria de instancia.** Con una
  instancia nueva de `SourceAdapter` por llamada —que es la forma real de Vercel
  Cron, donde ADR-004 dice «no hay proceso vivo»— diez `capture()` con el reloj
  parado envían **diez peticiones** al mismo par. Dentro de una instancia el
  ritmo se cumple (verificado arriba), y CA-7 pide exactamente eso, así que **no
  bloquea**; pero §4 de la spec promete que «un cron que dispare cada diez
  segundos» sea *igual de incapaz* de excederlo, y hoy no lo es. El techo de
  Vercel Cron (1/min) lo tapa por accidente, no por diseño, y `src/mirror/`
  arrastra la misma limitación. Destino: **`sdd-arquitecto`**, como CA explícito
  de la spec del cron (el último instante por par tiene que sobrevivir al
  proceso).

- **F-SPEC-008-V14 — ⚠️ CA-2: el escaneo cubre `src/`, y ADR-014 §4 dice
  también «en un script».** `readSourceTree()` recorre `src/` entero y ninguna
  otra raíz. Hoy no hay agujero real —no existe `scripts/`, y las tres CLI viven
  en `src/mirror/cli/`—, así que se anota y no se cuenta como bloqueante. El día
  que aparezca un script fuera de `src/`, la prohibición deja de estar vigilada
  sin que nadie se entere. Destino: **EPIC-MEJORA**.

### Salvedades previas, revisadas una a una

- **F-SPEC-008-V4** (CA-7): **CERRADO**, comprobado con sonda propia de siete
  escenarios y con W12/W14. Ver la fila de CA-7.
- **F-SPEC-008-V2** (recuento de CA-3): **CERRADO**, el recuento del ledger
  coincide fichero a fichero con el diff.
- **F-SPEC-008-V1** (las tres evasiones de la primera vuelta): **cerrado para
  esas tres**, y sus controles muerden (W25, W26, W27). Lo que no está cerrado es
  el criterio: ver V6', V7' y V8'.
- **F-SPEC-008-1** (CA-3, la aserción enmendada): **aceptada por el gate humano**
  y no revisitada, por encargo. Sigue ⚠️.
- **F-SPEC-008-2** (CA-8, solo `scheduled` calibrada): **ratificada** y no
  revisitada, por encargo. Sigue ⚠️.
- **F-SPEC-008-3**, **F-SPEC-008-4**, **F-SPEC-008-6**, **F-SPEC-008-8**:
  ratificadas, ninguna bloquea.
- **F-SPEC-008-5** (gate de calidad): sigue **cerrado**; `npm run lint` en verde
  y la sonda del `debugger` demuestra que el linter sigue mirando `src/`.
- **F-SPEC-008-7** (el dictamen legal): **sigue sin pedir**, y el verificador
  vuelve a confirmar el hecho que lo hace tolerable hoy: en esta rama **nada se
  ha corrido contra `ceroacero.es`**; todo corre contra dobles y fixtures
  sintéticos.
- **F-SPEC-008-9** (las dos exenciones nominales): **deja de ser teórica**. Ver
  F-SPEC-008-V8 y F-SPEC-008-V9.
- **F-SPEC-008-V3** y **F-SPEC-008-V5**: intactas, siguen rutadas a EPIC-MEJORA.
  V3 gana un hermano, F-SPEC-008-V12.

### Lo que necesita decisión humana

1. **Ésta es la segunda de las tres vueltas, y lo que falta ya no parece trabajo
   de implementación.** El patrón de las dos vueltas es el mismo: se enseñan tres
   evasiones, se cierran las tres con detectores textuales nuevos, y aparecen tres
   más. No es negligencia del implementador —las tres primeras están bien
   cerradas y sus controles muerden—: es que **CA-2, tal como está escrito
   («busca … cualquier llamada a `globalThis.fetch` o equivalente … entonces no
   encuentra ninguna»), no es alcanzable con detección textual**, y el propio
   ledger ya lo admite en F-SPEC-008-10. Gastar la tercera vuelta en cerrar V6',
   V7' y V8' produce, con toda probabilidad, una cuarta tanda.
2. **Hay una salida que no es textual y que ya existe en el repositorio.**
   `tests/mirror/support/imports.ts` implementa `reachableModules(entry)`, un
   recorrido del grafo de `import`. La forma semántica de (c) es: *ningún fichero
   de `src/` fuera de `polite/` alcanza, por el grafo de imports, un módulo de
   red ni `globalThis.fetch`* — y la de (a): *nadie fuera de `polite/` alcanza el
   punto donde se leen bytes de un `robots.txt`*. Eso caza V6', V7' y V8' de
   golpe y no depende de cómo se escriba la línea. **No lo decido yo**: cambia el
   mecanismo que CA-2 describe y es trabajo de `sdd-arquitecto` sobre la spec.
3. **La alternativa honesta es estrechar CA-2 por escrito.** Si se acepta que el
   guardián es «una barrera calibrada contra las evasiones enumeradas, que crece
   cuando aparece la siguiente» —que es lo que el código entrega hoy y lo que
   F-SPEC-008-10 describe—, entonces CA-2 debería decir eso y no «no encuentra
   ninguna», y el criterio pasaría a ⚠️ aceptada en vez de ❌. **Es una firma
   humana, no una decisión del verificador.**
4. **F-SPEC-008-V8 tiene además un componente que la spec bloquea.** Cerrar la
   exención de `site/robots-txt.ts` bien exigiría tocar código de SPEC-004 —una
   spec `hecho`— y CA-3 lo prohíbe. Cualquier arreglo que no sea semántico va a
   chocar con eso.
5. **La pregunta legal (F-SPEC-008-7) sigue abierta** y es del humano: el
   dictamen de `sdd-legal-datos` sobre `ceroacero.es` en régimen de ingesta, antes
   de correr la primera jornada.
6. Las 6 h de ADR-014 §3.2 y la licencia de `competition_id: 'robots'` están
   firmadas; verificadas tal como están escritas y no reabiertas.

**La spec vuelve a `en-progreso`** firmada por `sdd-verificador`, para que el
hook `require-spec` no deniegue la escritura al siguiente implementador.


## Enmienda — 2026-09-01: CA-2 pasa de detección textual a contención de capacidad

**Estado: PROPUESTA. Pendiente de arbitraje de Alberto Fojo.** Nada de lo que
sigue está firmado. **El cuerpo de la spec no se ha tocado**: CA-2 sigue diciendo
en `SPEC-008…md` exactamente lo que Alberto firmó esta mañana, y la spec sigue en
`en-progreso`. Escrita por `sdd-arquitecto`, que no aprueba sus propios
artefactos.

**Por qué en el ledger y no en el cuerpo de la spec.** Se usa la forma de
**ADR-015 §2 y §3** (`borrador`, escrito hoy, vive en la rama
`ft/enmienda-spec-005-ca-10` y **no está en esta rama**) **por analogía, y se
dice que es por analogía**: su caso literal es el de una spec `hecho`, y SPEC-008
está `en-progreso`. Lo que se comparte es el hecho que importa: **una persona
firmó este CA con fecha, esta misma mañana, y lo que sigue lo cambia**. Reescribir
en silencio el texto que Alberto aprobó borraría la diferencia entre «Alberto
aprobó esto» y «Alberto aprobó algo parecido», que es la razón entera por la que
ADR-015 existe. El precedente de arbitraje a mitad de vuelo de este repositorio
—`## Arbitraje del gate humano` en el ledger de SPEC-001, y su tanda
«aplicación de la enmienda»— es el mismo camino: la enmienda se escribe, el
humano la arbitra, y **otra tanda posterior la aplica**.

Se cubren los cinco puntos que ADR-015 §3 declara obligatorios, en §1 (qué
afirmaba y por qué era razonable), §2 (qué lo invalida), §3 y §4 (con qué se
sustituye y qué red se pierde), §5 (si el veredicto sigue en pie) y §5 (qué lo
despierta).

**Lo que esta enmienda NO hace:** no reabre **ADR-014**, que es `aprobada` e
inmutable; no toca `src/` ni `tests/`; no cambia el estado de la spec; y no
exige modificar una sola línea de `src/site/robots-txt.ts` (SPEC-004, `hecho`)
ni de `src/mirror/analysis/referenceless/report.ts` (SPEC-003, `hecho`), que es
lo que **CA-3** prohíbe.

### 1. Qué exigía CA-2, y por qué era razonable

CA-2 exige que, fuera de `src/polite/`, un test de arquitectura no encuentre
**ninguna** de las tres cosas que **ADR-014 §4** prohíbe: análisis de un
`robots.txt`, construcción de la cabecera `User-Agent`, y «cualquier llamada a
`globalThis.fetch` **o equivalente** dirigida a un tercero».

Era razonable, y hay que decirlo antes de cambiarlo, porque la enmienda no
corrige un error:

- **El modo de fallo de RN-11 es silencioso.** Una petición que sale, se sirve y
  no vuelve. No hay excepción en un log ni test que se ponga rojo solo. ADR-014
  §4 dice, con razón, que «una prohibición que solo vive en un ADR es una
  prohibición que se incumple el día que nadie relee el ADR — que es exactamente
  cómo nació F-SPEC-002-23».
- **Hay prueba documental de que la convención no basta.** F-SPEC-002-23 vivió
  semanas en `main` sin que nada se pusiera rojo.
- **Un test de arquitectura es barato** y no necesita ejecutar el sistema.

Y el criterio **funcionó en su parte más cara**: la mutación M15 y las tres
evasiones de la primera vuelta (F-SPEC-008-V1) están cerradas con control
positivo que muerde (W25, W26, W27, verificado). No se enmienda por flojo. Se
enmienda porque su mecanismo no puede terminar.

### 2. Qué lo invalida

**El propio expediente, en dos vueltas idénticas.** El patrón está medido y no
se discute: se enseñan tres evasiones, se cierran las tres con detectores nuevos
que sí muerden, y aparecen tres más. Hoy sobreviven, con `npm test` en 705/705 y
`npm run lint` en `exit=0`:

| Evasión | Por qué se cuela |
|---|---|
| **F-SPEC-008-V6** — `const { fetch: send } = globalThis;` con `['User','Agent'].join('-')` | La llamada es `send(`, no `fetch(`; no hay `import`, luego `NETWORK_MODULE` y `COMPUTED_IMPORT` no aplican; `NETWORK_GLOBAL` no lista `globalThis`; y la cadena `user-agent` no se escribe nunca entera |
| **F-SPEC-008-V7** — `await import('node:' + 'https')` | Empieza por comilla, luego `COMPUTED_IMPORT` no casa; el literal que ve `NETWORK_MODULE` es `'node:'` |
| **F-SPEC-008-V8** — un parser real dentro de `src/site/robots-txt.ts`, uno de los dos ficheros con exención nominal | `ROBOTS_FIELD` pide el token entrecomillado exacto y `ROBOTS_SYMBOL` uno de cinco nombres declarados; una regex `/^\s*disallow\s*:/iu` no es ninguno de los dos |

**La razón de fondo, que ya está escrita en el propio ledger antes de que ningún
verificador la demostrara** (F-SPEC-008-10): *«los detectores son textuales, y
por tanto siguen siendo una lista de lo que ya sabemos escribir»*. Una lista de
formas de escribir una llamada crece con la imaginación de quien la rodea, y esa
lista no tiene última entrada. **CA-2, tal como está escrito, describe un
resultado —"no encuentra ninguna"— que su mecanismo no puede alcanzar.** No es
un defecto del implementador: es una promesa que el mecanismo no puede cumplir.

Y hay un segundo motivo, independiente y estructural, que **la enmienda hace
tratable y el criterio viejo no**: la salida limpia para F-SPEC-008-V8 exigiría
tocar `src/site/robots-txt.ts`, que es de **SPEC-004** (`hecho`), y **CA-3 lo
prohíbe**. Un criterio que solo se puede satisfacer violando otro criterio de la
misma spec está atascado por construcción.

### 3. Con qué se sustituye: el texto literal del CA-2 enmendado

Lo que sigue es el texto propuesto, entero, para sustituir el CA-2 actual. La
decisión de mecanismo —detección semántica en vez de textual— es de Alberto,
tomada hoy; **el texto concreto es de `sdd-arquitecto` y él no lo ha visto**.

> **CA-2 — Una sola puerta de salida, y se demuestra enumerando lo permitido
> (ADR-014 §1 y §4).**
>
> *El criterio deja de buscar lo prohibido: **enumera lo permitido y exige que el
> resto sea vacío**. Las tres listas que lo sostienen no son listas de formas de
> escribir una llamada —ésas crecen con la imaginación de quien las rodea—, sino
> listas cerradas por algo que no fijamos nosotros: la superficie de salida de la
> plataforma, las dependencias que ya tenemos, y las maneras que ECMAScript da de
> obtener una capacidad.*
>
> **CA-2.1 — Contención en ejecución: la única salida que se dispara es la de
> `src/polite/http.ts`.**
> Dado un test que, **antes de importar ningún módulo de `src/`**, sustituye por
> trampas todas las salidas de red de la plataforma —`globalThis.fetch` y los
> módulos `node:http`, `node:https`, `node:http2`, `node:net`, `node:tls`,
> `node:dgram`—,
> cuando se conducen los puntos de entrada declarados de `src/ingest/` y las CLI
> de `src/mirror/` **con el `globalFetcher` real**,
> entonces toda trampa que se dispara se atribuye, por su pila, a
> `src/polite/http.ts`, y el número de disparos coincide con el de llamadas a
> `politeFetch`;
> y cuando se conducen los mismos puntos de entrada **con un `HttpFetcher`
> doble**, **no se dispara ninguna trampa**.
> La trampa se instala **antes** de cualquier `import` de `src/` porque una
> segunda puerta puede capturar la referencia en el ámbito del módulo, que es
> exactamente la forma de F-SPEC-008-V6; instalarla después la dejaría pasar.
> Quedan fuera de la atribución las salidas que abren `@vercel/blob` y
> `postgres`: son nuestra propia infraestructura y no un tercero, están en la
> lista de CA-2.3, y RN-11 habla de la fuente, no del almacén.
>
> **CA-2.2 — Ninguna petición sale sin que la política real haya dicho que sí.**
> Bajo la misma trampa, con el `RobotsPolicy` de `src/polite/robots.ts`
> instrumentado,
> entonces el conjunto de URL que llegaron a una trampa está **contenido** en el
> de las URL sobre las que la política real fue consultada y contestó `true`,
> con una sola excepción nombrada: el `robots.txt` de un origen, que es la única
> petición que ninguna política puede gatear (ADR-014 §3.1).
> El test se pone rojo si sale una petición cuyo permiso lo concedió otro código.
>
> **CA-2.3 — Cierre de imports: todo especificador es un literal de una lista de
> lo permitido.**
> Dado todo `.ts`/`.tsx` bajo las raíces declaradas en CA-2.6,
> entonces cada especificador de módulo —estático, de efecto lateral o
> dinámico— es (i) una ruta relativa o `@/…` que resuelve dentro del
> repositorio, o (ii) una **cadena literal presente en `ALLOWED_PACKAGES`**, que
> hoy es exactamente `node:crypto`, `node:fs`, `node:fs/promises`, `node:module`,
> `node:path`, `node:url`, `@vercel/blob`, `cheerio`, `next`, `postgres`,
> `react` y `zod`;
> y **un especificador que no sea un literal estático** —`import(MOD)`,
> `import('node:' + 'https')`— es **rojo por construcción**, también dentro de
> `src/polite/`.
> `node:module` entra en la lista con su motivo escrito: `src/mirror/cli/node-resolve.ts`
> registra un hook de resolución para poder ejecutar las CLI en TypeScript. Es la
> única capacidad de resolución de módulos fuera de `src/polite/`, y va nombrada,
> no tolerada en silencio.
>
> **CA-2.4 — La capacidad global no se toma prestada fuera de `src/polite/`.**
> Fuera de `src/polite/` no aparece el identificador `globalThis`, ni un uso
> desnudo de los globales de red de la plataforma (`fetch`, `XMLHttpRequest`,
> `WebSocket`, `EventSource`, `navigator`), ni `eval`, ni `new Function`, ni
> `require`.
> Sin un `import`, ECMAScript da exactamente tres maneras de alcanzar una
> capacidad: el objeto global, un identificador global desnudo, y `eval`/`Function`.
> CA-2.3 cierra el `import`; ésta cierra las otras tres. Es un conjunto cerrado
> por el lenguaje, no por nosotros.
> **Se cumple hoy sin tocar una línea**: `globalThis` aparece una sola vez en
> todo `src/`, dentro de `globalFetcher`.
>
> **CA-2.5 — Nada huérfano en los tres destinos que el CA nombra.**
> Todo `.ts`/`.tsx` bajo `src/ingest/`, `src/polite/` y `src/site/` es
> alcanzable, por el grafo de `import`, desde `ENTRY_POINTS` —la lista declarada
> de puntos de entrada del repositorio: `next.config.ts`, las rutas de
> `src/app/`, las CLI, y el API público de `src/ingest/`—.
> Un fichero que nadie importa es **rojo**: para dejar de serlo hay que
> importarlo —y entonces le aplican CA-2.3 y CA-2.4 y lo alcanza CA-2.1— o hay
> que añadirlo a `ENTRY_POINTS`, que es un diff visible en un fichero que se
> llama así.
> `reachableModules` de `tests/mirror/support/imports.ts` implementa el
> recorrido y **hay que ensancharlo primero**: hoy solo lee
> `import`/`export … from '…'`, así que no ve ni los `import` de efecto lateral
> —`src/app/(gl)/layout.tsx` usa uno— ni los `import()` dinámicos —las tres
> `src/mirror/cli/*-cli.ts` usan uno—. Mientras no los vea, el cierre no es un
> cierre. El ensanche es parte de este CA y no toca `src/`.
>
> **CA-2.6 — El escaneo cubre todo el código del repositorio, no solo `src/`.**
> Las raíces del escaneo van declaradas, y un caso exige que **todo `.ts`/`.tsx`
> versionado fuera de `tests/` caiga bajo una de ellas**.
> No es hipotético: **`next.config.ts` es código ejecutable que hoy queda entero
> fuera del escaneo**, y `src/site/redirects.ts` solo es alcanzable desde ahí.
> ADR-014 §4 dice «en un script»; hoy no hay `scripts/`, pero sí hay
> configuración ejecutable en la raíz.
>
> **CA-2.7 — Cada mecanismo lleva su control positivo, y las evasiones vivas se
> escriben como controles.**
> Apagar cualquiera de CA-2.1..CA-2.6 pone rojo al menos un caso nombrado. Y las
> evasiones que hoy sobreviven se escriben como control positivo, cada una contra
> el mecanismo que le toca: `const { fetch: send } = globalThis` con
> `['User','Agent'].join('-')` (F-SPEC-008-V6) → CA-2.4 en estático y CA-2.1 en
> ejecución; `await import('node:' + 'https')` (F-SPEC-008-V7) → CA-2.3; un
> fichero nuevo en `src/ingest/` que nadie importa → CA-2.5.
> **No queda ninguna exención por nombre de fichero.** CA-2 deja de mirar
> palabras, así que `src/site/robots-txt.ts` y
> `src/mirror/analysis/referenceless/report.ts` dejan de necesitar una, y con la
> lista desaparece el agujero de F-SPEC-008-V9. Ninguno de los dos ficheros
> cambia (CA-3).
>
> **CA-2.8 — Lo que este criterio NO promete, dicho dentro del criterio.**
> No prohíbe que exista, fuera de `src/polite/`, una función que lea el texto de
> un `robots.txt`: prohíbe que **decida** (CA-2.2) y prohíbe que la petición
> salga por otro sitio (CA-2.1, CA-2.3, CA-2.4). El segundo parser de
> F-SPEC-008-V8 **deja de ser una evasión porque deja de ser una infracción**: no
> manda un byte y no puede abrir una puerta.
> Y CA-2.1 solo ve los caminos que se ejecutan. El residuo es finito y
> nombrable: **código alcanzable desde `ENTRY_POINTS` cuya rama de red no la
> ejecuta ningún test**. Estrecharlo es cuestión de cobertura, no de detección, y
> no es de esta spec.

### 4. Qué se gana y qué se pierde. Sin suavizar

**Se gana, y es lo que cierra el bucle de las dos vueltas:**

1. **Las listas cambian de naturaleza.** Dejan de enumerar *formas de escribir*
   —abiertas, infinitas, calibradas contra lo que ya sabemos— y pasan a enumerar
   *lo que ya existe*: las seis salidas de red de Node, las doce dependencias que
   tenemos, las cuatro maneras que da el lenguaje de obtener una capacidad. Esas
   listas crecen **cuando llega una dependencia real**, que es un diff revisable,
   y no cuando alguien inventa una forma nueva de escribir `fetch`. Es la
   respuesta directa a F-SPEC-008-10.
2. **La trampa se pone sobre la capacidad, no sobre el texto.** `const { fetch:
   send } = globalThis` obtiene la trampa, porque la trampa **es** lo que hay en
   `globalThis.fetch`. `await import('node:' + 'https')` obtiene el módulo
   simulado, porque la simulación está en el registro de módulos y no en el
   texto del especificador. Ninguna de las dos depende de cómo se escriba la
   línea.
3. **Desaparecen las exenciones y su agujero.** F-SPEC-008-9 y F-SPEC-008-V9
   dejan de existir, no se mitigan.
4. **CA-2.2 es más fuerte que lo que había.** El criterio viejo comprobaba la
   *ausencia de unas palabras*; nunca comprobó que la política real se hubiera
   consultado antes de cada petición. Ahora sí.
5. **Se cumple hoy sin tocar código de specs cerradas.** Comprobado sobre el
   árbol: `globalThis` aparece una vez y está en `src/polite/http.ts`; ningún
   fichero de `src/` importa un módulo de red; los doce especificadores de
   paquete son los de la lista.

**Se pierde, y hay que verlo antes de firmar:**

1. **CA-2 deja de comprobar mecánicamente la primera prohibición de ADR-014 §4.**
   El ADR sigue prohibiendo «un segundo parser de `robots.txt` en el
   repositorio» —eso no se toca y sigue vigente como regla—, pero **CA-2 ya no lo
   mecaniza**. Pasa a sostenerse en revisión humana y en el argumento de que un
   parser que no puede decidir es inerte. Es **menos red que antes** sobre ese
   punto concreto, y es el precio de que el criterio pueda terminar.
2. **La contención de CA-2.1 solo alcanza lo que se ejecuta.** Un fichero
   importado desde `ENTRY_POINTS` cuya rama de red no ejecute ningún test no
   dispara la trampa. Lo estrecha CA-2.5 (nada huérfano) y lo cierra la
   cobertura, que no es de esta spec. Dicho al revés, y es lo justo: **las siete
   evasiones que el verificador escribió en dos vueltas son todas código muerto**
   —ninguna mandó jamás un paquete—, así que el criterio nuevo es más fuerte en
   el eje que importa (paquetes que salen) y más débil en el eje de código
   latente que nadie llama.
3. **El criterio nuevo es más caro de construir.** Un fichero de tests deja de
   bastar: hay que ensanchar `reachableModules`, montar la instalación de
   trampas antes de los `import`, y declarar `ENTRY_POINTS`, `ALLOWED_PACKAGES` y
   las raíces. Es trabajo de `tests/` y de configuración; **no toca `src/`**.
4. **`ALLOWED_PACKAGES` se puede ensanchar.** Añadir `undici` a la lista es una
   línea. Pero es **una línea en un fichero que se llama así**, en un diff que un
   revisor lee, y no una forma nueva de escribir una llamada que nadie ve. La
   diferencia entre las dos cosas es la enmienda entera.

### 5. Si el veredicto sigue en pie, y qué despierta esto

**No hay veredicto que sostener: SPEC-008 está `en-progreso` y su última
verificación es RED.** La enmienda no rescata un GREEN ni anota uno emitido; lo
que hace es cambiar el criterio contra el que la tercera verificación va a
juzgar. Los doce CA restantes no se tocan y su evidencia sigue valiendo.

**Qué la despierta**, en el sentido de ADR-015 §3.5 —bajo qué condición concreta
habría que recuperar un guardián equivalente al que se retira:

- **El día que un módulo de `src/` fuera de `polite/` necesite *usar* un veredicto
  de permiso sobre una URL de un tercero.** Ese día CA-2.2 se pone roja sola, que
  es exactamente lo que se quiere; si alguien la relaja para dejarlo pasar, hay
  que volver a tener un guardián sobre la primera prohibición de ADR-014 §4.
- **El día que aparezca una evasión que no sea código muerto** —una que llegue a
  mandar un paquete—. Sería la señal de que CA-2.1 no la alcanzó por falta de
  cobertura, y entonces el residuo del punto 2 deja de ser aceptable.
- **El día que `ALLOWED_PACKAGES` crezca con un cliente HTTP.** No está
  prohibido; está obligado a ser visible. Si crece sin que nadie lo discuta, el
  mecanismo se ha vuelto ceremonia.

### 6. Qué findings vuelve *moot* esta enmienda, y cuáles siguen vivos

| Finding | Qué pasa con la enmienda |
|---|---|
| **F-SPEC-008-9** (dos exenciones nominales del detector (a)) | **MOOT.** No hay detector de palabras, luego no hay exenciones |
| **F-SPEC-008-V9** (el caso 8 vigila la lista de exenciones, no el mecanismo) | **MOOT**, por lo mismo: desaparece la lista que vigilaba |
| **F-SPEC-008-V10** (`COMPUTED_IMPORT` sin control positivo) | **MOOT.** El detector desaparece; lo sustituye CA-2.3, y CA-2.7 exige control positivo para **cada** mecanismo, que es la enfermedad de la que V10 era un síntoma |
| **F-SPEC-008-V6** (`const { fetch: send } = globalThis`) | **CERRADO por dos vías**: CA-2.4 en estático, CA-2.1 en ejecución |
| **F-SPEC-008-V7** (`import('node:' + 'https')`) | **CERRADO** por CA-2.3: el especificador no es un literal de la lista, y un especificador no literal es rojo por construcción |
| **F-SPEC-008-V8** (segundo parser dentro de un fichero exento) | **NO se caza: deja de ser infracción** (CA-2.8). Es la pérdida del §4.1, y es la única forma de cerrarlo sin tocar `src/site/robots-txt.ts`, que **CA-3 prohíbe** |
| **F-SPEC-008-10** (los detectores son una lista de lo que sabemos escribir) | **SUPERADO, no borrado.** Las listas invierten su naturaleza (§4.1), pero nace un residuo nuevo y distinto: la cobertura de CA-2.1 (§4.2, CA-2.8). El finding se cierra y su sombra queda escrita dentro del propio CA |
| **F-SPEC-008-V14** (el escaneo cubre `src/`, ADR-014 §4 dice «en un script») | **DEJA DE ESTAR RUTADO A EPIC-MEJORA Y SE CIERRA AQUÍ**, en CA-2.6. Y era peor de lo que decía: no es que «el día que aparezca un script», es que **`next.config.ts` existe hoy** y queda entero fuera del escaneo |
| **F-SPEC-008-V11** (CA-9.1 no muerde), **F-SPEC-008-V12** y **F-SPEC-008-V3** (RN-10 sostenido por la estructura), **F-SPEC-008-V5**, **F-SPEC-008-1**, **F-SPEC-008-2**, **F-SPEC-008-7** | **INTACTOS.** Esta enmienda no los toca ni los mueve de destino |

### 7. Segunda enmienda, más pequeña: §4 promete de más, y F-SPEC-008-V13

**Esto es una enmienda distinta y se firma aparte.** Toca el §4 del *Diseño* de
la spec, no un CA.

**Lo que dice §4 hoy:** el limitador vive dentro del camino del adaptador, para
que «un cron que dispare cada diez segundos, un bucle local supervisado y un
test con reloj falso» sean *«igual de incapaces de excederlo»*.

**Lo que es cierto:** eso vale **dentro de un proceso**, y ahí está verificado
—CA-7 quedó ✅ con sonda propia de siete escenarios y con M17..M20 y W12
muriendo—. **Entre procesos no vale**: el limitador es un campo de instancia
(`#lastRequestAt`), y ADR-004 dice que en Vercel **no hay proceso vivo**, así que
cada tick del cron es una instancia nueva. El verificador midió **diez peticiones
al mismo par en el mismo minuto** por esa vía (F-SPEC-008-V13).

**Lo que decido, y por qué:**

1. **El verificador tiene razón en no bloquear, y el ruteo del *arreglo* a la
   spec del cron es correcto.** Persistir el último instante por par exige estado
   durable, y estado durable es o el raw store —que no es un índice; ADR-014 ya
   rechazó por esa razón la tabla `robots_policies`— o Postgres, y Postgres es
   `migrations/0002`, que SPEC-008 pone **explícitamente fuera de alcance**.
   Meterlo aquí sería reventar el alcance de una spec que va por su tercera vuelta
   el mismo día en que se firmó. El domicilio correcto es la spec del cron, cuyo
   asunto es precisamente el estado del planificador.
2. **Pero dejarlo solo como «CA de la spec del cron» es insuficiente, y por eso
   esta enmienda dice algo ya.** Dos motivos, y el segundo es el que me preocupa:
   - **§4 promete hoy algo que el código no entrega.** Un lector de la spec sale
     creyendo que el cron no puede excederlo. Se enmienda el alcance de la
     promesa: **dentro de un proceso**, CA-7 la entrega; **entre procesos**,
     SPEC-008 no la entrega y deja de prometerla.
   - **La promesa está publicada, en dos lenguas, en la página cuyo propósito
     entero es que un tercero nos audite.** `src/i18n/gl.ts` y `src/i18n/es.ts`
     dicen en `/robot`: *«Como máximo unha petición por minuto a cada sitio e por
     cada competición»*. Eso es SPEC-005 y ADR-011. Una promesa pública que
     producción no puede cumplir no es una barrera floja: es **RN-11 incumplida
     más una afirmación falsa a terceros**, y RN-11 es regla dura.
3. **Hoy la infracción es latente, no consumada, y ésa es la diferencia
   exacta.** `src/ingest/` no está cableado a nada, no hay cron, no hay
   despliegue que capture, y el verificador confirmó dos veces que **nada se ha
   corrido nunca contra `ceroacero.es`**. Se convierte en infracción real **el
   día que se despliegue algo que pida**.
4. **De ahí la forma que propongo, que es una precondición y no un follow-up:**

> **Precondición de despliegue (propuesta, para la spec del cron).** Ninguna ruta
> ni cron desplegado puede emitir una petición hacia un tercero mientras el
> último instante de petición por par (fuente, competición) **no sobreviva al
> proceso**. Es CA bloqueante de la spec del cron, no salvedad: mientras no se
> cumpla, lo que `/robot` publica en galego y en castellano no es cierto en
> producción.

5. **Y una advertencia que conviene que quede escrita: el techo de Vercel Cron no
   es una garantía.** Que el plan no deje programar por debajo de 1/min tapa el
   camino nominal por accidente de tarificación, no por diseño, y no tapa una
   invocación manual, un reintento, un despliegue solapado ni una segunda ruta
   que capture. `src/mirror/` arrastra la misma limitación, y **ahí es tolerable
   por el motivo que F-SPEC-002-2 ya escribió** —la ventana dura una hora y el
   operador está delante—; en producción no hay ninguna de las dos cosas, que es
   literalmente el argumento con el que ADR-014 §3 justificó el `RobotsGate`.

### 8. Qué se le pide a Alberto que firme

Cuatro firmas separadas, a propósito, porque son cuatro decisiones distintas:

1. **El cambio de mecanismo de CA-2** —de detección textual a contención de
   capacidad más cierre de imports— con el texto literal de §3. Es lo que Alberto
   ya decidió; lo que no ha visto es el texto.
2. **La pérdida del §4.1, explícitamente**: CA-2 deja de comprobar
   mecánicamente que no exista un segundo parser de `robots.txt`, y pasa a
   comprobar que ninguno pueda decidir. ADR-014 §4 no se toca y sigue
   prohibiéndolo como regla. **Ésta es la firma incómoda y va suelta.**
3. **La enmienda de §4 y la precondición de despliegue de F-SPEC-008-V13** (§7),
   incluido que el arreglo va a la spec del cron y que allí es **bloqueante**.
4. **Si esto debe ser un ADR.** El mecanismo que propone §3 —cómo se verifica en
   este repositorio una frontera de arquitectura— constriñe a toda spec futura
   que escriba un test de arquitectura, y eso es materia de ADR, no de CA. **No
   lo he escrito**: no se me encargó, y un segundo artefacto sin firmar no ayuda
   al gate de hoy. Si Alberto quiere que ate a las specs siguientes, es un
   ADR-016 y lo escribo aparte.

Nada de esto se aplica hasta que Alberto arbitre. Cuando lo haga, la aplicación
—sustituir el CA-2 del cuerpo de la spec y anotar aquí que se aplicó— es una
tanda posterior, como la «Segunda tanda — aplicación de la enmienda» del ledger
de SPEC-001.


## Arbitraje del gate humano — 2026-09-01 (Alberto Fojo)

Cierra las tres cosas que la *Enmienda — 2026-09-01* dejó sin arbitrar: su §8
pedía cuatro firmas, se conceden tres y la cuarta se convierte en encargo.
**Nada de esto cambia el estado de la spec**, que sigue `en-progreso` con su
última verificación en RED, ni toca `src/` ni `tests/`. Lo que sí hace, por
primera vez en este expediente, es **aplicarse al cuerpo de SPEC-008**: la
enmienda estaba escrita y sin arbitrar, y su propio cierre decía que la
aplicación —sustituir el CA-2 del cuerpo y anotar aquí que se aplicó— sería una
tanda posterior, como la «Segunda tanda — aplicación de la enmienda» del ledger
de SPEC-001. **Ésta es esa tanda.**

### 1. CA-2 se firma tal cual, y la pérdida se firma con él

**Alberto Fojo firma el texto literal de la *Enmienda — 2026-09-01* §3**, entero
y sin retoques: CA-2 pasa de detección textual a contención de capacidad más
cierre de imports, con sus ocho apartados CA-2.1..CA-2.8. Queda aplicado al
cuerpo de la spec con esta misma fecha.

**Y firma la pérdida a sabiendas.** Se registra como hecho fechado, no como
salvedad: CA-2 **deja de mecanizar la primera prohibición de ADR-014 §4**. Un
segundo parser de `robots.txt` podrá existir en el repositorio aunque no pueda
**decidir** ni abrir una puerta de salida. La regla de ADR-014 §4 **sigue vigente
y no se toca** —ADR-014 es `aprobada` e inmutable—, pero a partir de hoy se
sostiene en **revisión humana** y en el argumento de que un parser que no puede
decidir es inerte, no en un test que se ponga rojo solo.

Lo que despierta esa pérdida está escrito en la *Enmienda* §5 y no se repite. El
primero es el operativo: **el día que un módulo fuera de `src/polite/` necesite
usar un veredicto de permiso sobre la URL de un tercero, CA-2.2 se pone roja
sola**; si alguien la relaja para dejarlo pasar, hay que recuperar un guardián
sobre la primera prohibición.

**Texto que queda sustituido**, conservado aquí íntegro porque es lo que Alberto
firmó la mañana del 2026-09-01, y ADR-015 §1 existe precisamente para que la
diferencia entre «Alberto aprobó esto» y «Alberto aprobó algo parecido» no se
borre:

> - **CA-2 — Una sola implementación de la cortesía RN-11 (ADR-014).**
>   Dado el árbol del repositorio,
>   cuando un test de arquitectura busca fuera de `src/polite/` (a) cualquier
>   análisis de un `robots.txt`, (b) cualquier construcción de la cabecera
>   `User-Agent`, y (c) cualquier llamada a `globalThis.fetch` o equivalente
>   dirigida a un tercero,
>   entonces **no encuentra ninguna**; `src/mirror/`, `src/ingest/` y
>   `src/site/crawler-page.tsx` importan de `src/polite/`, y el test **falla** si
>   se le añade una segunda implementación en cualquiera de los tres.

### 2. F-SPEC-008-V13 se arregla en SPEC-008, contra la recomendación de `sdd-arquitecto`

**La recomendación era rutar el arreglo a la spec del cron** (*Enmienda* §7.1):
exige estado durable, y estado durable es o el raw store o `migrations/0002`,
ambos fuera del alcance firmado, en una spec que va por su tercera vuelta el
mismo día en que se aprobó.

**Alberto la ha oído entera y decide lo contrario: entra aquí.** El motivo que da
—y queda como el motivo de la decisión— es que la promesa de `/robot` está
publicada a terceros en dos lenguas y **no se retira**; una barrera que producción
no puede cumplir es RN-11 incumplida **más** una afirmación falsa a terceros, y
eso no viaja a otra spec.

Consecuencias que asume con la decisión, puestas delante antes de tomarla:

- **Ensancha el alcance de una spec aprobada.** No es añadir un CA: entran
  `migrations/0002` y una implementación de persistencia. Se registra como
  **enmienda de alcance** en la sección siguiente.
- **Una migración es irreversible en la práctica** (ADR-006: no hay rollback;
  deshacer es escribir la siguiente).
- **Parte del criterio nuevo solo se puede verificar contra un Postgres real.**
  SPEC-008 era hasta hoy verificable entera con `npm test`; con CA-14 necesita
  también `npm run test:db` y `DATABASE_URL_TEST`. El gate del 2026-08-29
  dictaminó que sin esa variable los criterios que dependen de ella son **UNMET,
  no *skipped***, y ese dictamen aplica igual aquí.

**La vía descartada explícitamente**: retirar o suavizar la promesa de `/robot`.
Alberto la descarta. `src/i18n/gl.ts:101` y `src/i18n/es.ts:80` siguen diciendo
lo que dicen, y el código pasa a tener que cumplirlo.

### 3. ADR-016 se encarga

La cuarta firma que pedía la *Enmienda* §8.4 —*«si esto debe ser un ADR»*— se
contesta **sí**. Materia: cómo se demuestra en este proyecto una frontera de
capacidad —enumerar lo permitido y exigir que el resto sea vacío— y qué obliga
eso a toda spec futura que escriba un test de arquitectura. Escrito el 2026-09-01
en `docs/adr/ADR-016-como-se-demuestra-una-frontera-de-capacidad-se-enumera-lo-permitido-y-el-resto-tiene-que-ser-vacio.md`,
en **`borrador`**: lo firma una persona, y `sdd-arquitecto` no aprueba sus
propios artefactos.

El ADR fija **la regla general**; SPEC-008 CA-2 es **su primera aplicación**.
Nada de lo específico de esta spec —las listas concretas, los puntos de entrada,
los paquetes permitidos— vive en el ADR.

### 4. Lo que este arbitraje NO toca

No reabre **ADR-014** ni ningún ADR aprobado. No cambia el estado de SPEC-008 ni
su frontmatter. No toca `src/`, `tests/`, `docs/roadmap.md`, `CLAUDE.md` ni el
`_epica.md` de EPIC-002. No revisita los seis puntos ya arbitrados y verificados
—las 6 h de ADR-014 §3.2, la licencia de `competition_id: 'robots'`,
F-SPEC-008-1, F-SPEC-008-2 y las ratificadas—. Y **no contesta la pregunta legal**
(F-SPEC-008-7): el dictamen de `sdd-legal-datos` sobre `ceroacero.es` en régimen
de ingesta sigue sin pedir, y sigue siendo precondición de correr la primera
jornada, no de escribir el código.


## Enmienda — 2026-09-01: el estado durable del limitador de RN-11 entra en SPEC-008 (F-SPEC-008-V13)

**Estado: ARBITRADA por Alberto Fojo el 2026-09-01** (sección anterior, §2).
Escrita por `sdd-arquitecto`, que no aprueba sus propios artefactos y que
**recomendó lo contrario**: la recomendación consta entera y la decisión es del
humano.

Se usa la forma de **ADR-015 §2 y §3** por analogía, y se dice que es por
analogía: su caso literal es el de una spec `hecho`, y SPEC-008 está
`en-progreso`. Lo que se comparte es el hecho que importa —una persona firmó este
alcance con fecha, y esto lo ensancha—, y se cubren los cinco puntos que ADR-015
§3 declara obligatorios: §1 y §2 (qué decía y qué lo invalida), §3 y §4 (qué
entra y con qué mecanismo), §5 (qué se pierde), §6 (si el veredicto sigue en pie)
y §7 (qué la despierta).

### 1. Qué decía «Fuera de alcance», y por qué era razonable

El texto firmado la mañana del 2026-09-01 dice, literalmente:

> - **La persistencia.** La implementación Postgres de `ObservationStore` y
>   `DecisionStore` sigue siendo de «la primera spec que la necesite»
>   (F-SPEC-001-3), y esta no la necesita: devuelve `Observation`, no las guarda.
>   **Tampoco hay `migrations/0002`.**

Y el §2 del *Diseño* apoya el orden entero de la épica sobre esa base: esta spec
abre el camino **por su primer tramo, y solo por el primero**. Era razonable por
tres motivos que siguen siendo ciertos:

- **La spec devuelve `Observation`, no las guarda.** Sin persistencia del modelo
  canónico no hace falta base de datos, y no haberla necesitado es lo que dejaba
  a esta spec verificable entera con `npm test`.
- **`migrations/0002` es irreversible en la práctica** (ADR-006). Añadir una
  migración es una decisión que no se deshace, solo se sucede.
- **ADR-014 acababa de rechazar una tabla** —`robots_policies`— *«por
  desproporción: añade una migración irreversible para guardar un documento que el
  raw store ya sabe guardar»*. Meter otra tabla el mismo día, en la spec que
  ejecuta ese ADR, pedía un motivo mejor que el que había entonces.

### 2. Qué lo invalida

**F-SPEC-008-V13**, medido por el verificador en la segunda vuelta: con una
instancia nueva de `SourceAdapter` por llamada —que es la forma real de Vercel
Cron, donde **ADR-004** dice que no hay proceso vivo— **diez `capture()` con el
reloj parado envían diez peticiones al mismo par**. El limitador es
`#lastRequestAt`, un `Map` en un campo de instancia: nace vacío en cada arranque
en frío.

Lo que convierte eso de anotación en ensanche de alcance es lo que hay publicado
encima. `/robot` afirma, en galego y en castellano, ante terceros y con el
propósito declarado de que nos auditen (SPEC-005, ADR-011):

> *«Como máximo unha petición por minuto a cada sitio e por cada competición. As
> peticións non gastadas non se acumulan: un minuto sen pedir non dá dereito a
> dúas no seguinte.»*

Una promesa pública que producción no puede cumplir no es una barrera floja: es
**RN-11 incumplida más una afirmación falsa a terceros**. RN-11 es regla dura, y
el no-negociable de legalidad de `FOUNDATION.md` la repite.

Hoy la infracción es **latente, no consumada** —`src/ingest/` no está cableado a
nada, no hay cron, no hay despliegue, y el verificador confirmó dos veces que
nada se ha corrido nunca contra `ceroacero.es`—. Se vuelve real **el día que se
despliegue algo que pida**. Ésa es exactamente la ventana en la que arreglarlo
cuesta lo mínimo, y es el argumento del humano.

### 3. Qué entra, y dónde queda la frontera nueva

**Entra en SPEC-008:**

1. Un **puerto del ritmo** con **una sola operación**: conceder el turno y
   sellarlo a la vez. No un par consultar/sellar — entre los dos pasos cabe otra
   instancia, y ése es el fallo que se arregla.
2. Dos implementaciones del puerto: la **en memoria** (el `Map` de hoy, que se
   queda sirviendo a `src/mirror/` y a los tests unitarios) y la **durable**.
3. **`migrations/0002`**: una tabla, la clave del par y el último instante de
   petición.
4. El `SourceAdapter` deja de construirse su propio limitador y **exige** el
   puerto, igual que ya exige `robots: PolicyGate`.
5. **CA-14**, con su control positivo y su batería de contrato.

**No entra, y la frontera es exacta:** ni `ObservationStore` ni `DecisionStore`
en Postgres —siguen siendo de «la primera spec que la necesite», F-SPEC-001-3—,
ni calendario, ni catálogo de alias, ni cron, ni motor, ni ventanas por partido.
**Ninguna `Observation` y ninguna `Decision` tocan la base de datos en esta
spec.** Lo único que se persiste es un instante por par: es cortesía, no modelo
canónico.

Se sustituye, por tanto, la línea de *Fuera de alcance* citada en §1 por su
versión enmendada, que dice lo mismo salvo en la mitad que cambia. Y se reescribe
el §4 del *Diseño*, que hoy promete de más (era la *Enmienda* §7 anterior, ahora
absorbida aquí: **acotar la promesa a «dentro de un proceso» deja de ser
suficiente por sí sola**, porque el arreglo entra en esta spec y §4 tiene que
decir que entra).

### 4. El mecanismo elegido: `migrations/0002`. Y por qué no el raw store

Las dos vías estaban nombradas en la *Enmienda* §7.1. Se elige la migración, y el
motivo no es de gusto.

**Por qué el raw store como índice se descarta.** Por dos defectos que no son de
coste sino de corrección, y cualquiera de los dos basta:

1. **El archivo registra lo que volvió, y RN-11 cuenta lo que salió.** Una
   petición que sale y falla —un 500, un *timeout*, un 3xx que produce
   `RedirectNotFollowedError`, un `robots.txt` que no se sirve— **no archiva
   nada**. La instancia siguiente no vería ninguna clave y pediría otra vez de
   inmediato. El resultado es que **la fuente que más falla es la que más ráfaga
   recibe**: el peor comportamiento posible, y el contrario del que RN-11 pide.
2. **No se puede sellar antes del `await`**, que es lo que convierte el ritmo en
   una barrera y no en una estadística. La clave del raw store solo existe cuando
   la respuesta ya volvió; entre la consulta y el sellado cabe la petición
   entera. Dos instancias concurrentes leerían las dos «me toca» y saldrían las
   dos — que es literalmente el escenario de V13.

Y dos motivos más, que solos no bastarían pero que confirman:

3. **La clave lleva el día como segmento**, así que una consulta correcta cruza el
   límite de medianoche listando dos prefijos, y en producción cada `list` es una
   llamada de red a Vercel Blob por tick y por par.
4. **ADR-009 lo purga a los 30 días.** Un almacén diseñado para ser borrado no
   puede ser la memoria de una barrera de cumplimiento. Y ADR-014 dejó escrito que
   el raw store no tiene índice propio: *«si algún día el raw store crece un
   índice propio, esto es lo primero que se recoloca»*. Hacerlo índice hoy sería
   tomar por la puerta de atrás una decisión que un ADR aprobado aplazó.

**Por qué la migración sí, aunque sea más cara.** Porque Postgres da la única
propiedad que el problema pide y el archivo no puede dar: **conceder y sellar en
un solo paso atómico**. Una sentencia `insert … on conflict (pair) do update …
where <el último instante es anterior al límite> returning …` devuelve fila
cuando concede el turno y ninguna cuando lo niega, y **dos instancias
concurrentes no pueden ganar las dos**. Eso es estrictamente más de lo que daba
el `Map`: sobrevive al proceso *y* es correcto bajo concurrencia, que es lo que
un reintento del cron, una invocación manual o un despliegue solapado necesitan.

Además —y no es adorno— el `do update` fija el último instante **al instante
actual**, no al anterior más un minuto, así que **los turnos no se acumulan**,
que es la segunda frase exacta de lo que `/robot` promete.

**Lo que ADR-014 rechazó era otra cosa**, y conviene decirlo para que esto no se
lea como una contradicción: rechazó guardar en una tabla **un documento** que el
raw store ya sabe guardar, versionar por instante y purgar. Aquí no se guarda un
documento: se guarda **un instante que hay que comparar y sustituir
atómicamente**, que es exactamente para lo que sirve una base de datos y para lo
que un almacén de objetos no sirve. La proporción es distinta porque el problema
es distinto.

### 5. Qué se lleva por delante. Sin suavizar

1. **`migrations/0002` es irreversible en la práctica.** ADR-006 no tiene
   rollback: deshacer es escribir `0003`. Se acepta a cambio de que la migración
   sea del tamaño mínimo —una tabla— y de que no arrastre nada del modelo
   canónico.
2. **SPEC-008 deja de ser verificable con un solo comando.** Hasta hoy `npm test`
   la cubría entera. CA-14.4 y la mitad durable de CA-14.2, CA-14.5 y CA-14.6
   necesitan `npm run test:db` con `DATABASE_URL_TEST`, y el **gate del
   2026-08-29** dictaminó que sin esa variable esos criterios son **UNMET, no
   *skipped***. Es un ensanche real de lo que el verificador tiene que correr, y
   el implementador tiene que dejar en el ledger las **dos** salidas.
3. **El camino de ingesta gana una dependencia de Postgres que no tenía.** En
   producción, un tick sin base de datos **no manda nada** (CA-14.7). Es fallo
   cerrado, coherente con ADR-014 §3.3, y significa que una caída de la base de
   datos es cobertura perdida. Es la decisión correcta —lo contrario es incumplir
   RN-11 justo cuando peor se está— pero hay que verla escrita.
4. **La tercera vuelta crece.** Era «reescribir un test de arquitectura»; pasa a
   ser eso **más** una migración, un puerto, dos implementaciones y una batería de
   contrato. Es la última vuelta que el método permite. La lista cerrada de lo que
   hay que hacer va en el informe del encargo, para que no se gaste adivinando.
5. **`src/mirror/` no se arregla, y no se va a arreglar en esta spec.** Sigue con
   el limitador en memoria (CA-14.8). Es defendible por el motivo que F-SPEC-002-2
   escribió y ADR-014 §3 reutilizó —un proceso, una hora, el operador delante—
   pero es una **asimetría**, y el día que alguien ejecute dos CLI de espejo a la
   vez contra la misma competición, RN-11 se incumple sin que nada avise.
   **Destino: EPIC-MEJORA**, y queda dicho aquí para que no se descubra por
   sorpresa.
6. **Un turno concedido cuya petición falla se ha gastado.** No hay reserva ni
   devolución. Es deliberado y está escrito dentro de CA-14.9, pero significa que
   un tercero inestable reduce nuestra cobertura además de la suya.

### 6. Si el veredicto sigue en pie

**No hay veredicto que sostener:** SPEC-008 está `en-progreso` y su última
verificación es RED. Esta enmienda no rescata un GREEN ni anota uno emitido:
añade un criterio contra el que la tercera verificación va a juzgar. Los CA
existentes no se tocan —salvo CA-2, que sustituye la *Enmienda* anterior, ya
arbitrada— y su evidencia sigue valiendo.

**CA-7 sigue siendo cierto y sigue verificado.** Dice lo que dice sobre una
instancia y lo entrega; CA-14 no lo contradice, lo extiende al caso que CA-7 no
podía ver. Las dos piezas conviven porque hablan de cosas distintas: CA-7, del
ritmo dentro de una ejecución; CA-14, de que la memoria del ritmo sobreviva a la
ejecución.

### 7. Qué la despierta

- **El día que el ritmo tenga que contarse por algo que no sea el par (fuente,
  competición).** Hoy la clave es el par porque así lo dice RN-11. Si alguna vez
  hay que limitar por origen, por franja o por partido, la tabla deja de valer y
  hay que decidir de nuevo, no ensanchar en silencio.
- **El día que `src/mirror/` se despliegue, se automatice, o se corra a la vez
  desde dos sitios.** Ese día muere el argumento de CA-14.8 y la asimetría del
  §5.5 pasa de anotada a bloqueante.
- **El día que alguien pida seguir capturando con la base de datos caída.** Eso es
  pedir relajar CA-14.7, y entonces hay que recuperar por otra vía la demostración
  de que el ritmo se cumple.

### 8. Qué findings cierra y cuáles mueve

| Finding | Qué pasa |
|---|---|
| **F-SPEC-008-V13** | **DEJA DE ESTAR RUTADO A LA SPEC DEL CRON Y SE CIERRA AQUÍ**, en CA-14. La «precondición de despliegue» que proponía la *Enmienda* §7.4 **desaparece**: no hace falta una precondición para lo que la propia spec entrega |
| **F-SPEC-008-V4** (CA-7) | **INTACTO y cerrado.** CA-7 no cambia |
| Los demás | Sin cambio respecto de lo que dice la *Enmienda* §6 |

Y una asimetría nueva, nombrada en §5.5, que **no existía como finding**:
`src/mirror/` conserva el limitador en memoria. Destino: **EPIC-MEJORA**.


## Tercera vuelta — CA-2 enmendado y CA-14 nuevo (2026-09-01, `sdd-implementador`)

Se aplican las dos enmiendas que Alberto Fojo arbitró el 2026-09-01: **CA-2
sustituido entero** (contención de capacidad, CA-2.1..CA-2.8) y **CA-14 nuevo**
(el ritmo de RN-11 sobrevive al proceso), con el ensanche de alcance que trae
`migrations/0002` y la implementación durable.

**Las dos suites corren y las dos están verdes**, con `DATABASE_URL_TEST` puesto:
`npm test` **748/748** y `npm run test:db` **144/144**. Las salidas literales van
abajo. `npm run lint` en `exit=0`, comprobado rompiendo.

### 1. CA-2: qué se hizo, y por qué esto sí puede terminar

El mecanismo viejo enumeraba **formas de escribir una llamada**, y esa lista no
tiene última entrada: siete evasiones en dos vueltas. El nuevo enumera **lo que
existe** y exige que el resto sea vacío.

| Pieza | Dónde | Qué cierra |
|---|---|---|
| `tests/mirror/support/imports.ts`, ensanchado | ve `import 'x'`, `import('x')` y —por fin— resuelve `.tsx`, que leía y descartaba | Sin las tres aristas, CA-2.5 no era un cierre: `src/site/` entero habría quedado «inalcanzable» y el criterio habría pasado en verde diciendo lo contrario de lo que dice |
| `tests/polite/support/capability.ts` | `SCAN_ROOTS`, `ALLOWED_PACKAGES`, `ENTRY_POINTS`, `CONTAINED_DIRS`, y los detectores | Las tres listas declaradas, cada una con su motivo escrito |
| `tests/polite/architecture.test.ts`, reescrito | CA-2.3, CA-2.4, CA-2.5, CA-2.6, CA-2.7 | El cierre estático |
| `tests/polite/containment.test.ts`, nuevo | CA-2.1 y CA-2.2 | La contención en ejecución |

**`ROBOTS_PROSE` y toda exención por nombre de fichero están borradas.** Con la
lista desaparece el agujero de F-SPEC-008-V9, y el caso 19 vigila el
**mecanismo**: lee el propio guardián y exige que no vuelva a mirar
`file.path` para perdonar a nadie. `src/site/robots-txt.ts` y
`src/mirror/analysis/referenceless/report.ts` **no cambian una línea** (CA-3);
pasan por los mismos detectores que todos los demás, sin atajo.

**Cómo se instalan las trampas, que es lo que hace que esto no se rodee.**
`tests/polite/containment.test.ts` **no tiene un solo `import` estático de
`@/…`** (salvo un `import type`, que `verbatimModuleSyntax` borra por completo).
Los seis `vi.mock` de los módulos de red se izan por encima de todo; el
`globalThis.fetch` se sustituye en el cuerpo del módulo; y `src/` entra después,
por `await import()`. Eso es lo que hace que `const { fetch: send } =
globalThis` **obtenga la trampa** —la trampa *es* lo que hay en
`globalThis.fetch`— y que `await import('node:' + 'https')` **obtenga el módulo
simulado** —la simulación vive en el registro de módulos, no en el texto del
especificador—. Ninguna de las dos depende de cómo se escriba la línea, y las
dos están escritas como controles positivos (casos 6 y 7).

**Lo que se conduce con el `globalFetcher` real**: el API público de
`src/ingest/` (`SourceAdapter.tick()`) y **la CLI de captura entera**
(`capturar.main`, con un `config.json` sintético en un directorio temporal y un
`process.chdir` acotado). Con un `HttpFetcher` doble, los mismos caminos
disparan **cero** trampas. El residuo de CA-2.8 queda **acotado por un caso**
(el 13): ningún punto de entrada que no se conduzca **puede alcanzar
`src/polite/http.ts`** por el grafo de imports, y los dos que sí se conducen sí
la alcanzan.

### 2. CA-14: qué se hizo

```
src/polite/rate-limit.ts   MIN_REQUEST_INTERVAL_MS, turnLimitMs,
                           interface RateLimit { takeTurn },  MemoryRateLimit
src/polite/clock.ts        + instantOf(epochMs), inverso de epochMsOf: `Date`
                           sigue confinado a este fichero (ADR-006)
migrations/0002_request_rhythm.sql   una tabla: pair (pk) + last_request_at
src/db/rate-limit.ts       PostgresRateLimit: insert … on conflict … where …
                           returning …, SQL etiquetado, sin ORM
src/ingest/adapter.ts      exige el puerto; toma el turno UNA vez por petición
src/mirror/capture/capturer.ts + cli/capturar.ts   la de memoria, explícita
```

Se borró `RateLimiter` (el par `isDue`/`stamp`). **No queda ninguna forma de
preguntar sin sellar**, y un caso lo vigila sobre todo `src/`.

**El puerto tiene una operación por el motivo exacto del defecto**: entre
preguntar y sellar cabe otra instancia. Eso obligó a un cambio de forma en
`tick()`, y conviene decirlo porque toca CA-7: `tick()` **toma el turno él
mismo** y entra por un `#captureGranted` privado, en vez de llamar a
`capture()`. Si llamara a `capture()` gastaría dos turnos por petición; si no
tomara el turno, no podría saber que **un turno suprimido no produce registro**,
que es literalmente lo que CA-7 pide. **CA-7 no perdió una sola aserción**: sus
siete casos (10-16) pasan sin tocar una coma, y las mutaciones M-E y M-G lo
prueban.

**`assertUserAgent` se movió al principio del bucle de `tick()`**, antes de
tomar el turno: tomar un turno para una petición que no va a salir gastaría un
minuto de RN-11 en nada, y CA-5.2 pide «antes de cualquier I/O» — y con el
puerto durable, tomar el turno **es** I/O.

### 3. Gates — las dos suites, salidas literales

`DATABASE_URL_TEST` **estaba disponible**, así que **ningún criterio de CA-14
queda UNMET por falta de credencial**. Cómo se consiguió en un worktree está en
**F-SPEC-008-17**, y el verificador va a necesitar los mismos dos pasos.

`npm test` — **verde**:

```
> marcador@0.0.1 test
> vitest run

 RUN  v4.1.11 /Users/albertofojo/src/tremen-dev/marcador.gal/.claude/worktrees/agent-a970d43a2cb5aa6be


 Test Files  81 passed (81)
      Tests  748 passed (748)
Type Errors  no errors
   Start at  16:07:39
   Duration  1.78s (transform 1.73s, setup 0ms, import 6.90s, tests 7.97s, environment 4ms, typecheck 133ms)
```

`npm run test:db` — **verde**, contra un Postgres real (rama de test de Neon):

```
> marcador@0.0.1 test:db
> node --env-file-if-exists=.env.local ./node_modules/vitest/vitest.mjs run --config vitest.integration.config.ts tests/db


 RUN  v4.1.11 /Users/albertofojo/src/tremen-dev/marcador.gal/.claude/worktrees/agent-a970d43a2cb5aa6be


 Test Files  8 passed (8)
      Tests  144 passed (144)
   Start at  16:07:46
   Duration  50.51s (transform 74ms, setup 0ms, import 270ms, tests 49.63s, environment 0ms)
```

`npm run lint` — **verde**:

```
> marcador@0.0.1 lint
> oxlint --type-aware

exit=0
```

Y comprobado rompiendo, porque un linter que no mira nada también sale con 0.
Salida literal, con el fichero sonda ya borrado:

```
> marcador@0.0.1 lint
> oxlint --type-aware

src/ingest/_lint-probe.ts:1:7: error eslint(no-unused-vars): Variable 'debugger_probe' is declared but never used. Unused variables should start with a '_'. help: Consider removing this declaration.
src/ingest/_lint-probe.ts:3:3: error eslint(no-debugger): `debugger` statement is not allowed help: Remove the debugger statement
exit=1
```

**CA-3, comprobado fichero a fichero.** `git grep -c 'test(' <ref> -- tests/mirror
tests/site tests/docs` sobre `main` y sobre `HEAD` da 44 ficheros en cada una y
el `diff` de los recuentos tiene **una sola línea**, la enmienda ya aceptada de
la primera vuelta:

```
< main:tests/mirror/user-agent.test.ts:15
> HEAD:tests/mirror/user-agent.test.ts:16
```

**Esta vuelta no tocó ninguna aserción de `tests/mirror/`, `tests/site/` ni
`tests/docs/`.** El diff de esta tanda sobre suites cerradas son **dos
ficheros**: `tests/mirror/support/imports.ts` —un módulo de soporte, ensanchado,
que es exactamente lo que CA-2.5 manda hacer— y `tests/db/migrate.test.ts`, que
sí lleva una aserción enmendada y va como **F-SPEC-008-16**.

**Nada irreversible.** `git ls-files` no lista un solo `.html` de un tercero: los
únicos `.html` del repositorio siguen siendo páginas propias en `_qa/` y el
sistema de diseño en `docs/diseno/`. Los fixtures de `tests/fixtures/` no se
tocaron. **ADR-009 §3 se respeta.** Y no quedó ningún fichero de mutación
olvidado: `git status` está limpio.

### 4. Mutaciones — 31 aplicadas, una a una, revertidas

`git status` vacío antes y después de cada una. Las de CA-2 y las de memoria
corridas contra `tests/polite tests/ingest tests/mirror tests/site tests/docs
tests/migrations` (497 casos); las durables contra `npm run test:db`.

**CA-2 — diecisiete. Quince mueren; una sobrevive porque debe, y otra reveló un
agujero real que se arregló.**

| # | Mutación | Resultado |
|---|---|---|
| N1 | `src/ingest/side-door.ts` con `const { fetch: send } = globalThis` y `['User','Agent'].join('-')` (**F-SPEC-008-V6 escrita como fichero real**) | **SOBREVIVIÓ la primera vez** → agujero real encontrado y cerrado (ver §5). Ahora **ROJO**: `architecture` 8 (CA-2.4) y 13 (CA-2.5) |
| N2 | `src/ingest/late-door.ts` con `await import('node:' + 'https')` y `await import(MOD)` (**F-SPEC-008-V7 real**) | ROJO: `architecture` 3 (CA-2.3) y 13 |
| N3 | un fichero limpio y huérfano en `src/ingest/` | ROJO: `architecture` 13 |
| N4 | un parser real de `robots.txt` **dentro de `src/site/robots-txt.ts`** (**F-SPEC-008-V8 real**) | **VERDE — sobrevive, y así se firmó.** CA-2.8: deja de ser una infracción porque no manda un byte y no abre una puerta. Es la pérdida del arbitraje, no un defecto (F-SPEC-008-20) |
| N5 | segunda puerta **en el camino conducido**: `capture()` usa `globalThis.fetch` en vez de `politeFetch` | ROJO: **20 casos**, entre ellos `containment` 2 y 4 (CA-2.1) y `architecture` 8 |
| N6a | `globalFetcher` captura la referencia en el ámbito del módulo (`const captured = globalThis.fetch`) | **VERDE, y es el resultado esperado**: la trampa se instala ANTES del import, así que la captura obtiene la trampa. Reveló además un caso frágil, arreglado (§5) |
| N6b | lo mismo, **más** la trampa instalada DESPUÉS de los `import` de `src/` | ROJO: **6 casos** de `containment` (1, 2, 3, 8, 9, 10). Es la prueba ejecutada de que el orden es lo que sostiene CA-2.1 |
| N7 | los detectores de capacidad (CA-2.4) apagados | ROJO: `architecture` 9, 10, 11 |
| N8 | `ALLOWED_PACKAGES` crece con `node:https` | ROJO: `architecture` 4 |
| N9 | `SCAN_ROOTS` reducido a `['src/']` | ROJO: `architecture` 1 (CA-2.6) |
| N10 | el lector deja de ver los `import()` dinámicos | ROJO: `architecture` 5, 14, 15 · `containment` 13 |
| N11 | el lector deja de ver los `import` de efecto lateral | ROJO: `architecture` 14 |
| N12 | la resolución deja de aceptar `.tsx` (el estado en que estaba) | ROJO: `architecture` 3, 13, 15 |
| N13 | un especificador no literal deja de ser ofensa | ROJO: `architecture` 5 |
| N14 | la atribución por pila apagada (CA-2.1) | ROJO: `containment` 6, 7 |
| N15 | la contención de conjuntos apagada (CA-2.2) | ROJO: `containment` 10, 11 |
| N16 | `ENTRY_POINTS` pierde `next.config.ts` | ROJO: `architecture` 13, 15 |

**CA-14 — catorce. Las catorce mueren.**

| # | Mutación | Resultado |
|---|---|---|
| M-A | `MemoryRateLimit` concede siempre | ROJO: 14 casos (contrato 2, 5, 6, 7 · `adapter` 10-15, 18 · `mirror/capture/rate-limit` 1, 2, 4) |
| M-B | sella `último + intervalo` en vez del instante actual (**los turnos se acumulan**) | ROJO: contrato **5**, la cláusula que `/robot` publica |
| M-C | el límite pasa de `>` a `>=` (frontera del minuto) | ROJO: 10+ casos en tres suites |
| M-D | `capture()` deja de tomar el turno | ROJO: `adapter` 14, 15, 18, 19 |
| M-E | un turno negado en `tick()` **produce registro** (rompe CA-7) | ROJO: `adapter` 11, 13 |
| M-F | un fallo del puerto en `tick()` se trata como concedido (**falla abierto**) | ROJO: `adapter` 20 |
| M-G | el turno se toma DESPUÉS del gate de robots y del `await` | ROJO: `adapter` 14, 15, 18, 19 |
| M-H | el `Capturer` deja de consultar el ritmo | ROJO: `mirror/capture/rate-limit` 1, 2, 4 |
| M-I | la CLI de `src/mirror/` deja de construir la implementación en memoria | ROJO: `rate-limit` 5 (CA-14.8) |
| M-J | un módulo de `src/ingest/` nombra `MemoryRateLimit` | ROJO: `rate-limit` 6 (CA-14.8) |
| P1 | `PostgresRateLimit` pierde su `where`: concede siempre | ROJO: **8 casos** de `test:db`, entre ellos CA-14.2 con `expected 10 to be 1` —la reproducción exacta de F-SPEC-008-V13— y las dos de concurrencia de CA-14.4 |
| P2 | el `where` pasa de `<=` a `<` | ROJO: 5 casos de `test:db` (contrato 3, 6, 7 · CA-14.2 caso 4 · CA-14.6) |
| P3 | el `do update` sella el **instante límite** en vez del actual (**los turnos se acumulan**) | ROJO: contrato **5** contra Postgres |
| P4 | `turnLimitMs` ignora el intervalo | ROJO: 6+ casos de `test:db` |

**Nada se descartó por equivalente en esta vuelta.**

### 5. Dos cosas que encontró el propio ejercicio de romper, y que se arreglaron

Van dichas porque son la prueba de que las mutaciones no fueron ceremonia.

1. **N1 sobrevivió a la primera, y no era un fallo del detector: era del
   escaneo.** `versionedSources()` usaba `git ls-files`, que **solo lista lo
   commiteado**. Un `src/ingest/side-door.ts` recién escrito no aparecía, así
   que la evasión más natural de todas convivía con la suite entera en verde —
   y eso es exactamente cómo el verificador demostró las siete evasiones de las
   dos vueltas anteriores: escribiendo ficheros, sin commit. Corregido a
   `git ls-files --cached --others --exclude-standard`. Sin haber corrido N1,
   CA-2 habría llegado a la tercera verificación con el mismo agujero de
   siempre y un aparato nuevo encima.
2. **N6a reveló un caso frágil.** El caso 9 de CA-2.2 reasignaba
   `globalThis.fetch` **después** de los `import` para servir un `robots.txt`
   prohibitivo. Con un módulo que captura la referencia en su ámbito, ese caso
   medía el orden de las asignaciones y no la contención. La respuesta simulada
   pasó a ser una variable que la trampa lee, y la trampa no se toca nunca más.

### 6. Salvedades nuevas

- **F-SPEC-008-15 — ⚠️ `ALLOWED_PACKAGES` tiene TRECE entradas y el CA enumera
  doce.** CA-2.3 dice «hoy es exactamente» doce paquetes; CA-2.6 obliga a que el
  escaneo cubra **todo** el `.ts`/`.tsx` versionado fuera de `tests/`, y eso
  arrastra `vitest.config.ts` y `vitest.integration.config.ts`, que importan
  `vitest/config`. Las dos mitades del criterio no se encuentran: la lista se
  escribió mirando `src/` y las raíces se escribieron más anchas. **Se resolvió
  declarando `vitest/config` con su motivo escrito**, que es lo que el propio CA
  manda hacer cuando llega una dependencia real, en vez de estrechar las raíces
  —que habría dejado dos ficheros ejecutables fuera del escaneo y es justo lo
  que CA-2.6 existe para impedir—. **No es un cliente HTTP y el caso 4 lo
  vigila.** Se dice aquí, y no se esconde, porque es una desviación del texto
  literal del CA que Alberto firmó. Destino: **gate humano / `sdd-arquitecto`**.
  **CERRADO el 2026-09-01** — ver *«Arbitraje del gate humano — 2026-09-01: la
  treceava entrada de `ALLOWED_PACKAGES`»*, al final de este ledger: la entrada
  se aprueba, CA-2.3 se reescribe para exigir la **forma** de la lista y no su
  contenido, y el crecimiento de `ALLOWED_PACKAGES` **deja de ser materia de
  gate humano**. La implementación no cambia una línea.
- **F-SPEC-008-16 — ⚠️ una aserción de `tests/db/migrate.test.ts` (SPEC-001
  CA-13, spec `hecho`) se enmendó, y es la segunda de todo el expediente.**
  Decía `expect(applied).toEqual(['0001'])` y `expect(await appliedVersions())
  .toEqual(['0001'])`: **enumeraba** las migraciones. `migrations/0002` la vuelve
  falsa **por decisión firmada** —la enmienda de alcance del 2026-09-01—, no por
  defecto; misma forma que F-SPEC-008-1. Se conservó su propósito derivando la
  lista esperada de `readMigrations()` y exigiendo además que sea no vacía y que
  contenga `0001` **y** `0002`, para que no pueda pasar en verde descubriendo
  nada. Los dos casos siguen probando lo que CA-13 dice: la primera pasada aplica
  todo lo pendiente y levanta las tablas, la segunda no aplica nada. Destino:
  **gate humano**.
- **F-SPEC-008-17 — ⚠️ `npm run test:db` no arranca desde un worktree, y el
  verificador se va a chocar con esto.** Dos motivos, los dos de entorno y
  ninguno de la spec: (1) el script usa la ruta literal
  `./node_modules/vitest/vitest.mjs`, y un worktree de agente no tiene
  `node_modules` —Node resuelve hacia arriba para `npm test`, pero una ruta
  literal no—; (2) `.env.local` está en `.gitignore`, así que
  `DATABASE_URL_TEST` no viaja al worktree. Se resolvió **sin tocar el
  repositorio**: un enlace simbólico de `node_modules` al del checkout
  principal y una copia de `.env.local` (ambos ignorados por git; `git status`
  quedó limpio). El arreglo de verdad es una línea en `package.json` —usar
  `vitest` del `PATH` en vez de la ruta literal—, pero toca configuración fuera
  del alcance de esta spec. Destino: **EPIC-MEJORA**.
- **F-SPEC-008-18 — ⚠️ la asimetría de `src/mirror/`, ahora nombrada como
  finding.** El instrumento se queda con el ritmo **en memoria** (CA-14.8) y es
  defendible hoy por el motivo que F-SPEC-002-2 escribió —una hora, un proceso,
  el operador delante—. **Se rompe el día que alguien corra dos CLI de espejo a
  la vez contra la misma competición**: RN-11 se incumpliría sin que nada
  avisara, y no hay ningún test que pueda verlo desde dentro de un proceso.
  Cablearlo al puerto durable es una línea en `capturar.ts` el día que se
  decida. Destino: **EPIC-MEJORA**.
- **F-SPEC-008-19 — ⚠️ `PostgresRateLimit` no tiene sitio de construcción en
  producción, y no puede tenerlo todavía.** `src/db/rate-limit.ts` es
  inalcanzable desde `ENTRY_POINTS`, igual que `src/db/ports.ts`: quien lo va a
  construir es el cron, que no existe. **No es rojo** —CA-2.5 solo alcanza a
  `src/ingest/`, `src/polite/` y `src/site/`— y no es un descuido: es la forma
  exacta en que esta spec entrega la pieza para que la spec del cron la enchufe
  en vez de heredarla como precondición. El día que exista el cron, esa spec
  tiene que **construirlo ahí y no volver a un limitador de instancia**.
  Destino: **la spec del cron de EPIC-002**.
- **F-SPEC-008-20 — ⚠️ la pérdida firmada, medida.** El segundo parser de
  `robots.txt` dentro de `src/site/robots-txt.ts` (F-SPEC-008-V8) **sigue
  conviviendo con la suite entera en verde** — comprobado, mutación N4. Es lo
  que CA-2.8 dice y lo que el arbitraje del 2026-09-01 §1 firmó a sabiendas:
  ADR-014 §4 sigue prohibiéndolo como regla, y a partir de ahora esa prohibición
  **se sostiene en revisión humana**. No hay CI, así que esa revisión humana es
  literalmente una persona leyendo un diff. Se deja medido y no supuesto.
  Destino: **gate humano**, cada vez que se toque `src/site/` o `src/mirror/`.
- **F-SPEC-008-21 — ⚠️ el endpoint de Neon resuelve de forma intermitente en
  esta máquina.** Tres veces durante esta tanda `npm run test:db` falló entero
  con `getaddrinfo ENOTFOUND` mientras `nslookup` y `dscacheutil` sí resolvían;
  una consulta al resolutor del sistema lo destapaba y la siguiente ejecución
  iba bien. **No es un fallo de la spec ni del código**, y conviene que el
  verificador lo sepa antes de leerlo como criterio UNMET: si `test:db` cae con
  `ENOTFOUND`, se repite. Destino: **EPIC-MEJORA / entorno**.

### 7. Lo que esta vuelta NO tocó, a propósito

- **`src/site/robots-txt.ts` y `src/mirror/analysis/referenceless/report.ts`**:
  ni una línea. CA-3 lo prohíbe, y con CA-2 enmendado ya no lo necesitaban.
- **`ObservationStore` ni `DecisionStore` en Postgres**: siguen siendo de «la
  primera spec que los necesite» (F-SPEC-001-3). `migrations/0002` es **solo**
  el ritmo: una tabla, la clave del par y un instante. Ninguna `Observation` y
  ninguna `Decision` tocan la base de datos.
- **CA-7, ADR-014, la spec, `docs/roadmap.md`, `CLAUDE.md`** ni ninguna otra
  épica.
- **El dictamen legal (F-SPEC-008-7)**: no se pidió. Sigue abierto, es del
  humano, y es precondición de correr la primera jornada, no de escribir el
  código. **El código sigue sin haberse corrido contra `ceroacero.es` ni una
  sola vez**: todo corre contra dobles, trampas y fixtures sintéticos.
- **F-SPEC-008-V3, V5, V11, V12**: intactos, siguen rutados donde estaban.

### 8. Cómo retomar (handoff)

**Todo está en `ft/SPEC-008-adaptador-ceroacero`. Sin push y sin PR: el merge es
humano.** La spec queda en `en-revision` para la tercera verificación.

Para correr `npm run test:db` desde un worktree hacen falta los dos pasos de
**F-SPEC-008-17**, y sin ellos **los criterios de CA-14 son UNMET, no
*skipped*** (gate del 2026-08-29). Con ellos, las dos suites están verdes y las
salidas literales están en §3.

Lo que hay que mirar antes que nada, en este orden:

1. **CA-2 es un mecanismo nuevo entero**, no un parche sobre el anterior. La
   cuarta evasión, si existe, ya no se cierra añadiendo un detector: o entra por
   `ALLOWED_PACKAGES` —y entonces es un diff de una línea que alguien firma— o
   se dispara en `containment.test.ts` sin atribución. **N4 sigue sobreviviendo
   y tiene que seguir sobreviviendo**: es la pérdida firmada de CA-2.8.
2. **F-SPEC-008-15**: la lista de paquetes tiene trece entradas y el CA enumera
   doce. Es lo primero que un verificador va a encontrar y está declarado.
3. **F-SPEC-008-16**: la segunda aserción enmendada de una spec cerrada
   (`tests/db/migrate.test.ts`), forzada por `migrations/0002`.
4. **F-SPEC-008-18 y F-SPEC-008-19**: la asimetría de `src/mirror/` y el hecho
   de que el puerto durable no tenga todavía sitio de construcción en
   producción.
5. **F-SPEC-008-7**: el dictamen legal sigue **sin pedir**, y va antes de la
   primera jornada real.

Lo que **no** hay que hacer: implementar `MatchResolver` de verdad, ni el cron,
ni el motor, ni `ObservationStore`/`DecisionStore` en Postgres. Y no volver a
un limitador de instancia en `src/ingest/`: el puerto es obligatorio y sin
default a propósito.


## Arbitraje del gate humano — 2026-09-01: la treceava entrada de `ALLOWED_PACKAGES` (Alberto Fojo)

Cierra **F-SPEC-008-15**, la desviación que la tercera vuelta declaró: CA-2.3
decía que la lista «hoy es exactamente» **doce** paquetes y la implementación
tiene **trece**. **No cambia el estado de la spec** —SPEC-008 sigue
`en-revision`— ni toca `src/`, `tests/` ni `migrations/`. Lo que sí hace es
aplicarse al cuerpo de SPEC-008: **CA-2.3 queda reescrito**, y el texto anterior
se conserva aquí íntegro.

### 1. El hecho, y por qué la treceava entrada no era evitable

`vitest/config` entra en `ALLOWED_PACKAGES` **arrastrado por el propio CA-2.6**:
el escaneo tiene que cubrir todo el `.ts` versionado fuera de `tests/`, y eso
incluye `vitest.config.ts` y `vitest.integration.config.ts`, que son código
ejecutable en la raíz del repositorio y que importan el ayudante de
configuración de vitest. La lista se escribió mirando `src/` y las raíces se
escribieron más anchas; las dos mitades del criterio no se encontraban.

**La salida que el implementador tomó es la correcta**: declarar la entrada con
su motivo escrito, que es lo que el propio criterio manda hacer cuando llega una
dependencia real. La alternativa —estrechar las raíces— habría dejado **dos
ficheros ejecutables fuera del cierre**, que es exactamente lo que CA-2.6 existe
para impedir. `vitest/config` no es un cliente HTTP ni una puerta de salida, y
el caso 4 de `tests/polite/architecture.test.ts` lo vigila por nombre.

**Alberto Fojo lo aprueba.**

### 2. Y da una instrucción sobre el criterio, no sobre el caso

> «Sí, y que no vuelva a pasar. No es importante que vayan creciendo, es lo
> natural.»

Lo que gobierna de aquí en adelante **no es el caso concreto de `vitest/config`,
es esto**: el crecimiento de `ALLOWED_PACKAGES` **no vuelve a subir como
pregunta al humano**. Una lista de lo permitido que crece cuando llega una
dependencia real está funcionando como se diseñó; declararlo como desviación
cada vez convierte el mecanismo en peaje y gasta el gate humano en lo que
precisamente no lo necesita.

Tiene apoyo en el argumento con el que se firmó la enmienda de CA-2, y se cita
porque es el mismo razonamiento leído hasta el final (*Enmienda — 2026-09-01*
§4.4): *«Añadir `undici` a la lista es una línea. Pero es una línea en un fichero
que se llama así, en un diff que un revisor lee, y no una forma nueva de escribir
una llamada que nadie ve. La diferencia entre las dos cosas es la enmienda
entera.»* Si la garantía es el **diff revisable**, entonces el diff revisable es
suficiente, y pedir además una firma no añade red: añade fricción.

### 3. Qué se reescribe, y qué no se afloja

**CA-2.3 pasa a exigir la forma de la lista y no su contenido**, con tres
obligaciones: que exista como identificador exportado de un fichero que se llama
así y sea **cerrada en cada momento**; que **ninguna entrada sea una puerta de
salida** (módulo de red de la plataforma o cliente HTTP), vigilado por el caso 4;
y que **toda entrada nueva llegue con su motivo escrito junto a la lista**, en el
mismo diff que la añade. La enumeración de trece entradas queda en el CA como
**fotografía fechada que orienta y no manda**.

**Lo que no se toca, porque es de donde viene la fuerza del criterio:** la lista
sigue siendo **cerrada en cada momento** —lo que no está en ella es rojo— y **un
especificador que no sea un literal estático sigue siendo rojo por
construcción**, también dentro de `src/polite/`, aunque el paquete al que apunte
sí esté en la lista. Aflojar cualquiera de las dos **sí** es un cambio de
criterio y **sí** exige firma humana, igual que meter en la lista una puerta de
salida.

**Consecuencia operativa para el verificador**: una lista con más entradas que la
fotografía del CA **no es un criterio incumplido** y no hay que declararla. Lo
que sí hay que mirar en el diff es que cada entrada nueva traiga motivo y que
ninguna sea una puerta de salida.

**Texto sustituido**, conservado aquí íntegro porque es lo que Alberto firmó el
2026-09-01 y porque la diferencia entre «Alberto aprobó esto» y «Alberto aprobó
algo parecido» no se reconstruye después (ADR-015 §1):

> **CA-2.3 — Cierre de imports: todo especificador es un literal de una lista de
> lo permitido.**
> Dado todo `.ts`/`.tsx` bajo las raíces declaradas en CA-2.6,
> entonces cada especificador de módulo —estático, de efecto lateral o
> dinámico— es (i) una ruta relativa o `@/…` que resuelve dentro del
> repositorio, o (ii) una **cadena literal presente en `ALLOWED_PACKAGES`**, que
> hoy es exactamente `node:crypto`, `node:fs`, `node:fs/promises`, `node:module`,
> `node:path`, `node:url`, `@vercel/blob`, `cheerio`, `next`, `postgres`,
> `react` y `zod`;
> y **un especificador que no sea un literal estático** —`import(MOD)`,
> `import('node:' + 'https')`— es **rojo por construcción**, también dentro de
> `src/polite/`.
> `node:module` entra en la lista con su motivo escrito: `src/mirror/cli/node-resolve.ts`
> registra un hook de resolución para poder ejecutar las CLI en TypeScript. Es la
> única capacidad de resolución de módulos fuera de `src/polite/`, y va nombrada,
> no tolerada en silencio.

### 4. La implementación existente no cambia una línea

Se comprobó antes de escribir el texto, porque una redacción nueva que obligue a
tocar `tests/` invalidaría la evidencia de una implementación recién terminada:

- **Existe y es cerrada**: `ALLOWED_PACKAGES` es un identificador exportado de
  `tests/polite/support/capability.ts`, y los casos 3, 5, 6 y 7 de
  `tests/polite/architecture.test.ts` sostienen el cierre y la literalidad.
- **Ninguna entrada es una puerta de salida**: caso 4, que lo comprueba contra
  trece nombres —los seis módulos de red de Node, `node:dns`,
  `node:child_process` y cinco clientes HTTP—.
- **Las entradas que no se explican solas llevan motivo**: `node:module` y
  `vitest/config`, los dos escritos en el bloque de cabecera de la lista.
- **Ningún test aserta el contenido ni la longitud de la lista**, así que la
  fotografía del CA no está mecanizada en ningún sitio y no puede envejecer mal.

### 5. Lo mismo le pasaba a ADR-016, y se corrigió

**ADR-016 §3.1** decía «cerrada por algo que **no fijamos nosotros**», y la lista
de dependencias **sí la fijamos nosotros** y crece. Leído así, el ADR pedía una
lista inmutable, que es el mismo defecto que CA-2.3 tenía en pequeño. Corregido
el 2026-09-01: §3.1 dice ahora **cerrada en cada momento**, y §3.2 que crecer es
un diff con motivo y **nunca un arbitraje**. **Sigue en `borrador`**: lo firma
una persona y `sdd-arquitecto` no aprueba sus propios artefactos.

### 6. Lo que este arbitraje NO toca

No cambia el estado de SPEC-008 ni su frontmatter. No toca `src/`, `tests/`,
`migrations/`, `docs/roadmap.md`, `CLAUDE.md` ni ninguna otra épica. No reabre
ningún ADR aprobado. No revisita CA-2.1, CA-2.2 ni CA-2.4..CA-2.8, ni la pérdida
firmada de CA-2.8 (**N4 sigue sobreviviendo y tiene que seguir sobreviviendo**,
F-SPEC-008-20). Y no contesta la pregunta legal (**F-SPEC-008-7**), que sigue
sin pedir y sigue siendo precondición de correr la primera jornada.
