---
id: SPEC-002
tipo: ledger
epica: EPIC-001
---
# Ledger — SPEC-002 Test de espejo entre fuentes automaticas

## Resumen
- Fase: **en-revision (tercera vuelta)**. La segunda verificación devolvió **un
  solo finding en rojo**, y queda cerrado:
  - **F-SPEC-002-V5** (bloqueante, CA-10): faltaba el **séptimo** de los siete
    fixtures que el CA enumera —el paso 2 de la regla de decisión, *señales
    fuertes contradictorias*—. Escrito, y **comprobado por mutación**: borrando
    la rama `input.independent && input.strongMirror` de `verdict.ts` la suite
    se pone roja (3 fallos en 2 ficheros) donde antes seguía entera verde.
    Commit `eb5c4b4`. **Cero cambios en código de producción.**
  - **F-SPEC-002-20** (no bloqueante): los cuatro tests que no mordían todo lo
    que su nombre prometía, apretados. Commit `2a407fe`. Tampoco toca
    producción.
  Nada más de esta ronda: los cuatro findings de la primera vuelta siguen
  cerrados y no se han reabierto.
- Fase anterior: **en-revision (segunda vuelta)**. Implementada por `sdd-implementador` el
  2026-08-31 sobre la spec **aprobada** por Alberto Fojo ese mismo día, y
  **corregida el mismo día contra el texto ENMENDADO** —enmienda 1, ratificada
  entera por el gate— tras el RED de `sdd-verificador`. Los cuatro findings de esa
  verificación están cerrados:
  - **F-SPEC-002-V1 y -V3** (bloqueante + su gemelo): la grafía deja de dictar
    veredicto y pasa a contarse en clave propia (CA-10.4, CA-15.4, CA-13).
    Commit `a6b1f62`.
  - **F-SPEC-002-V2**: la negativa de CA-5 nombra los seis pares y el umbral.
    Commit `377ef21`.
  - **F-SPEC-002-V4** (bloqueante): los dos CLI arrancan bajo Node, con test que
    ejecuta el flujo real de los dos. Commit `22cbe42`.
- Rama: `ft/SPEC-002-test-de-espejo-entre-fuentes-automaticas`
- **Modelo canónico intacto.** Cero cambios en `src/model/`, cero
  `migrations/0002`, SPEC-001 no reabierta. Todo lo nuevo cuelga de
  `src/mirror/`, y reutiliza `src/raw/` (`RawStore`, `rawKey`, `captureThenParse`,
  `DiskRawStore`, `BlobRawStore`) y `src/model/ids.ts` (`SourceId`,
  `CompetitionId`, `MatchId`, `InstantSchema`) tal cual.
- **La fase B no toca Postgres.** Lee del `RawStore` y escribe un fichero, como
  dice la spec en *Entidades y reglas afectadas*.

## Gates de calidad (reejecutados en local el 2026-08-31, tercera vuelta)

No hay CI: esta salida es local y nadie la pasa por nosotros.

```
$ node --version
v26.4.0

$ npx oxlint --version
Version: 1.80.0

$ npm run lint

> marcador@0.0.1 lint
> oxlint --type-aware

lint exit=0
(sin hallazgos: oxlint --type-aware sale 0 y no imprime nada)

$ npx tsc --noEmit
tsc exit=0
(sin salida: 0 errores)

$ npx vitest run

 RUN  v4.1.11 /Users/albertofojo/src/tremen-dev/marcador.gal

 Test Files  46 passed (46)
      Tests  415 passed (415)
Type Errors  no errors
   Duration  1.28s
```

Base de esta ronda: **46 ficheros / 409 casos**. Ahora **46 / 415**: **+6 casos y
cero ficheros nuevos** —los seis entran en ficheros que ya existían, que es lo
que corresponde cuando lo que falta es una red y no una conducta—. Reparto:
`verdict-content.test.ts` +3 (el séptimo fixture y sus dos hermanos),
`pair.test.ts` +1 (el mismo paso por la ruta del par), `lead.test.ts` +2 (la
frontera de τ de punta a punta). Los apretones de `rn02.test.ts`,
`archive.test.ts` y `no-extractor.test.ts` no añaden casos: refuerzan los que
había.

De esos 415, **145 son de SPEC-002** (22 ficheros `.test.ts` bajo
`tests/mirror/`), más el fichero de tipo `tests/mirror/analysis/statuses.test-d.ts`,
que corre dentro del `typecheck` de vitest y no cuenta como caso. Los 270
restantes son SPEC-001, que sigue verde y sin tocar.

**Cero cambios en código de producción en esta ronda.** Medido, no afirmado:

```
$ git diff --stat 5af5aaf..HEAD -- src/
(vacío)
```

**El lint sigue sin ser ciego, y ahora cubre lo nuevo.** Medido por cobertura y
no por exit code:

```
$ npx oxlint --type-aware --debug=files | wc -l          → 118 ficheros
$ ... | grep -c 'src/mirror'                             → 25   (los 25 que hay)
$ ... | grep -c 'tests/mirror'                           → 32   (los 32 que hay)
$ ... | grep -c 'cli'                                    → 9
```

Reparto por fichero:

| Fichero | Casos |
|---|---|
| `tests/mirror/capture/rate-limit.test.ts` | 5 |
| `tests/mirror/capture/robots.test.ts` | 9 |
| `tests/mirror/capture/no-parse.test.ts` | 5 |
| `tests/mirror/capture/no-extractor.test.ts` | 2 |
| `tests/mirror/capture/archive.test.ts` | 5 |
| `tests/mirror/window.test.ts` | 8 |
| `tests/mirror/analysis/extract.test.ts` | 7 |
| `tests/mirror/analysis/pairing.test.ts` | 7 |
| `tests/mirror/analysis/lead.test.ts` | **14** |
| `tests/mirror/analysis/verdict-time.test.ts` | 6 |
| `tests/mirror/analysis/verdict-content.test.ts` | **11** |
| `tests/mirror/analysis/sample-size.test.ts` | 5 |
| `tests/mirror/analysis/rn02.test.ts` | 5 |
| `tests/mirror/analysis/report.test.ts` | 13 |
| `tests/mirror/analysis/citations.test.ts` | 5 |
| `tests/mirror/analysis/pair.test.ts` | **7** |
| `tests/mirror/analysis/determinism.test.ts` | 4 |
| `tests/mirror/analysis/invalid-window.test.ts` | 4 |
| `tests/mirror/analysis/findings.test.ts` | 6 |
| `tests/mirror/analysis/sources.test.ts` | 4 |
| `tests/mirror/analysis/spelling.test.ts` | 10 |
| `tests/mirror/cli/cli.test.ts` | 3 |
| **Total SPEC-002** | **145** |

**Suites de integración de SPEC-001 (`npm run test:db`, `npm run test:blob`) no
reejecutadas**: SPEC-002 no toca base de datos ni el modelo, y la fase B no
necesita Postgres. Si el verificador quiere el conjunto completo, siguen ahí.

### Comprobaciones por mutación (que los tests muerden)

Cuatro tests pasaron en verde en su primera ejecución porque la conducta ya
estaba escrita por el CA anterior. Para que eso no se lea como cobertura
fantasma, se mutó el código y se comprobó que la suite se pone roja:

| Mutación | Suite | Resultado |
|---|---|---|
| `#record(..., 'failed', ...)` → `'ok'` en el `catch` del capturador | `no-parse.test.ts` | 1 fallo (`expected 'ok' to be 'failed'`) |
| `difference_ms > tauMs` → `>=` en `classifyLead` | `lead.test.ts` | 1 fallo (el caso de 90 s exactos) |
| Se elimina la puerta `n_comparable < N_MIN` | `sample-size.test.ts` | 2 fallos |
| CA-4: se comprueba dentro del propio test que el orden ingenuo (instantes sin normalizar) sale MAL | `archive.test.ts` caso 3 | el test afirma el orden erróneo explícitamente |
| **Ronda 2** — se devuelve el voto a la grafía (`persistent.length + spelling.length > 0` en las dos funciones de veredicto) | `spelling.test.ts` | **5 fallos de 10** (casos 1, 3, 5, 6 y 9): los dos sentidos del veredicto y la prosa |
| **Ronda 3** — se borra la rama `input.independent && input.strongMirror` de `decide()` (`verdict.ts:187-194`), que es la mutación exacta con la que el verificador levantó F-SPEC-002-V5 | `verdict-content.test.ts` + `pair.test.ts` | **3 fallos en 2 ficheros** (antes: la suite entera verde). Salida literal abajo |
| **Ronda 3** — `difference_ms > tauMs` → `>=` en `classifyLead` | `lead.test.ts` | **3 fallos**: los unitarios 3 y 6 **y ahora el 13**, que es el de punta a punta y el que faltaba (F-SPEC-002-20) |

### La mutación de F-SPEC-002-V5, con su salida

Es la evidencia del finding y por eso va literal. **Antes** del séptimo fixture,
esa misma mutación dejaba `Test Files 23 passed · Tests 139 passed`: el paso 2 de
la regla de decisión podía desaparecer sin que nada se enterase. Con el fixture
puesto, la misma mutación produce:

```
$ python3 -c "…"   # borra la rama de decide() en src/mirror/analysis/verdict.ts
mutado: rama input.independent && input.strongMirror eliminada

$ npx vitest run tests/mirror

 ❯ tests/mirror/analysis/pair.test.ts (7 tests | 1 failed) 282ms
     × (g) adelantos mutuos y error replicado a la vez → INCONCLUSO por señales contradictorias

 FAIL  tests/mirror/analysis/pair.test.ts > CA-15 — independencia mutua > (g) …
AssertionError: expected 'INDEPENDIENTE' to be 'INCONCLUSO' // Object.is equality

 FAIL  tests/mirror/analysis/verdict-content.test.ts > CA-10, regla de decisión paso 2 … > (g) …
AssertionError: expected 'INDEPENDIENTE' to be 'INCONCLUSO' // Object.is equality

 FAIL  tests/mirror/analysis/verdict-content.test.ts > CA-10, regla de decisión paso 2 … > (g-bis) …
AssertionError: expected 'INDEPENDIENTE' to be 'INCONCLUSO' // Object.is equality

 Test Files  2 failed | 21 passed (23)
      Tests  3 failed | 140 passed (143)

$ git checkout -- src/mirror/analysis/verdict.ts
$ npx vitest run tests/mirror
 Test Files  23 passed (23)
      Tests  143 passed (143)
```

Los tres fallos son exactamente el veredicto que el verificador midió a mano: sin
el paso 2, la ventana sale `INDEPENDIENTE / adelantos` y la bandera
`rn02_segunda_via_entre_automaticas` se va a **`true`** —la dirección peligrosa
del §Problema—. La mutación se hizo **sobre el árbol y se revirtió con
`git checkout`**; `git diff --stat 5af5aaf..HEAD -- src/` sale vacío.

*(El conteo de 143 de este bloque es el de la mutación de F-SPEC-002-V5, hecha
antes de tocar F-SPEC-002-20; el total final de la ronda es 145.)*

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 (RN-11) ni una petición de más | `src/mirror/capture/capturer.ts` (limitador por par, `#isDue` + `#lastRequestAt`), `src/mirror/capture/ports.ts` (`pairKey`), `src/mirror/thresholds.ts` (`MIN_REQUEST_INTERVAL_MS`) | `tests/mirror/capture/rate-limit.test.ts` (5): hora simulada con `FakeClock` ticando cada 10 s → ≤ 60 y ≥ 59 peticiones por par; ninguna pareja de peticiones del mismo par a < 60 s; **caso 3** fija la lectura declarada de RN-11 (6 peticiones en el mismo minuto, una por par); un tick suprimido no registra tick | `npx vitest run` → `rate-limit.test.ts` 5/5. El limitador vive en `Capturer.#isDue` (`epochMs - last >= MIN_REQUEST_INTERVAL_MS`) y `#lastRequestAt` se sella **antes** del `await` y **antes** del chequeo de robots, así que una respuesta lenta no compra turno. El caso 1 mide en las dos direcciones (≤ 60 **y** ≥ 59 peticiones por par en la hora simulada, ticando cada 10 s), o sea que no se pasa «protegiendo» sin pedir nada; el caso 3 fija la lectura declarada de RN-11 —6 peticiones, 6 URL, **1 solo instante**— y con un tope global saldría 1. **Comprobado además por el camino real (ronda 2):** fase A de verdad contra un servidor local, `duration_minutes:1 / tick_seconds:30` → el segundo tick **no produce ninguna petición y no añade registro**; el servidor recibió exactamente 2 peticiones (una por par permitido) en el minuto | ✅ |
| CA-2 (RN-11) cortesía comprobable | `src/mirror/capture/robots.ts` (`parseRobots`, `robotsRegistry`, `robotsSkipReason`), `src/mirror/capture/http.ts` (`politeRequest`, `politeFetch`, `MissingUserAgentError`), `src/mirror/user-agent.ts` | `tests/mirror/capture/robots.test.ts` (9): ruta prohibida → 0 peticiones + 1 omisión con motivo que nombra la ruta; ruta permitida → 1 petición con la UA exacta; host sin robots cargado → omitido (no se presume permiso); **caso 8** lee el fuente de `src/mirror/capture/*.ts` y falla si `.fetch(` aparece fuera de `http.ts`. `tests/mirror/cli/cli.test.ts` caso 1 (ronda 2) lo comprueba además **por el camino real**: un servidor local recibe las peticiones del CLI y la UA que llega es `USER_AGENT` exacta | `npx vitest run` → `robots.test.ts` 9/9. El caso 8 recorre `src/mirror/capture/*.ts` y exige `callers === ['http.ts']`: la puerta única es una aserción, no una promesa; `politeRequest` lanza `MissingUserAgentError` **antes** de cualquier I/O. **Ejecutado el camino real (ronda 2):** `node src/mirror/cli/capturar-cli.ts` contra un servidor local con un `robots.txt` que prohíbe `/resultados` → el servidor registra 2 peticiones (`/futgal`, `/ceroacero`), **ninguna** a `/resultados`, y las dos llevan `User-Agent: marcador.gal/0.0.1 (+https://github.com/tremen-dev/marcador.gal; medicion SPEC-002, RN-11)`; el tick prohibido queda `"outcome":"skipped","reason":"robots.txt disallows /resultados (RN-11)"`. **Salvedad F-SPEC-002-1 (histórica, ronda 3):** la **forma** de la UA estaba probada contra `USER_AGENT_PATTERN`; el **contacto** era un marcador de posición sobre un dominio sin contratar, y RN-11 pide identificación que responda. **CERRADA en la verificación posterior del 2026-08-31 (commit `82eaeb7`, un solo fichero: `src/mirror/user-agent.ts`, comprobado con `git show --stat`).** Remedido **por el cable y con literal propio del verificador**, no importando la constante: sonda independiente que levanta un servidor local y lanza el CLI real `node src/mirror/cli/capturar-cli.ts config.json ventana.json` → el servidor recibe 1 petición y la cabecera que llega es exactamente `marcador.gal/0.0.1 (+mailto:ola@tremen.dev; medicion SPEC-002, RN-11)`, sin rastro del contacto viejo, con el tick `outcome: ok` y archivado. `USER_AGENT_PATTERN` sigue siendo una red que **muerde**: rechaza 12 UA degradadas —`marcador/1.0`, sin contacto, contacto vacío, contacto sin esquema, `ftp://`, `tel:`, sin propósito, propósito vacío, versión de dos componentes, `Mozilla/5.0 …` y la cadena vacía— y acepta solo la buena. `parseRobots` elige **el mismo grupo** con el contacto nuevo que con el viejo (el token sale de `userAgent.split('/')[0]` = `marcador.gal`, que el contacto no toca): sobre un robots.txt con `BadBot`, `marcador.gal` y `*`, los tres veredictos son idénticos antes y después, obedece a su grupo nombrado y no al de `BadBot`. Suite completa reejecutada: 46/46 ficheros, 415/415 casos, `oxlint --type-aware` exit 0, `tsc --noEmit` exit 0 | ✅ |
| CA-3 (RN-10, D-5) la fase A archiva y no parsea | `src/mirror/capture/capturer.ts` (`captureThenParse` con parser identidad; sin modo degradado) | `tests/mirror/capture/no-parse.test.ts` (5): `put` que lanza → tick `failed` con motivo, `raw_ref` null, y la ventana sigue; **estructura**: grafo de imports desde `src/mirror/capture/**` no alcanza `src/mirror/analysis/**` (+ control de que el grafo no está vacío). `tests/mirror/capture/no-extractor.test.ts` (2): con `@/mirror/analysis/extract` sustituido por un espía, una ventana de 10 ticks —sana y con el store roto— no lo llama ni una vez. `tests/mirror/cli/cli.test.ts` caso 1 (ronda 2): tras correr la fase A de verdad, cada `raw_ref` del registro devuelve bytes con `store.get()`. **Ronda 3 (F-SPEC-002-20):** el caso 2 lleva ya el guardián que le faltaba, `expect(ticks).toHaveLength(10)` **antes** del `every`, así que no puede pasar en vacío si ese camino dejase de producir ticks | `npx vitest run` → `no-parse.test.ts` 5/5 y `no-extractor.test.ts` 2/2. `grep -rn "analysis/" src/mirror/capture/` no devuelve nada: la fase A no alcanza la fase B. La comprobación estructural no es decorativa —el caso 5 exige que el grafo **sí** alcance `src/raw/capture.ts`, así que un grafo vacío no lo pondría verde por silencio—. En la fase A ejecutada de verdad (ronda 2), cada `raw_ref` del registro devuelve bytes en disco. **Ronda 3 — F-SPEC-002-20 (a) atendida:** `no-extractor.test.ts` lleva ya `expect(ticks).toHaveLength(10)` delante del `every`, así que el camino no puede pasar en vacío. Lo cuento como cerrado y **no lo mido por mutación**: es un guardián contra un `[]`, y la única mutación que lo pondría rojo sería romper el helper de test, no el código de producción. Declarado como tal, igual que lo declara el implementador | ✅ |
| CA-4 (ADR-005, ADR-006) el archivo es la línea de tiempo | `src/mirror/instants.ts` (`canonicalInstant`, `normalizeInstant`: ISO con ms siempre), `src/mirror/capture/capturer.ts` (normaliza antes de archivar); `rawKey`/`DiskRawStore` de SPEC-001 sin tocar | `tests/mirror/capture/archive.test.ts` (5): `list()` del prefijo del par; claves barajadas y reordenadas como cadenas reproducen el orden temporal (12 capturas); **caso 3** archiva instantes desordenados y con formatos mezclados y demuestra que el ISO literal ordena MAL (`17-00-00.500z` antes que `17-00-00z`); `fetched_at` es cadena ISO UTC, nunca `Date`; la clave es exactamente la de `rawKey()`. **Ronda 3 (F-SPEC-002-20):** el caso 5 deja de sacar el digest de la propia clave bajo prueba —una expectativa construida con su sujeto solo comprueba que una cadena es igual a sí misma— y lo calcula aquí, con `createHash('sha256')` sobre el cuerpo | `npx vitest run` → `archive.test.ts` 5/5 contra `DiskRawStore` real. El caso 3 muerde: afirma **primero** que el orden ingenuo sale mal (`17-00-00.500z` antes que `17-00-00z`) y después que con `canonicalInstant` el orden por cadena reproduce el cronológico. **Comprobado sobre el archivo que escribió la fase A real (ronda 2):** clave `futgal/rfef-tercera-g1/2026-08-31/2026-08-31t09-54-12.640z-d282ada1d743.html` —exactamente la forma de `rawKey()` de SPEC-001, sin entidades nuevas— y el `meta` guardado dice `"fetched_at":"2026-08-31T09:54:12.640Z"`: cadena ISO 8601 UTC, nunca `Date` (ADR-006). **Ronda 3 — F-SPEC-002-20 (c) atendida y medida por mutación.** El caso 5 ya no saca el digest de su propio sujeto: lo calcula con `createHash('sha256')` sobre el cuerpo y fija además la extensión. **Muerde:** mutando `rawKey` en la copia (`src/raw/store.ts:74`, `slice(0, 12)` → `slice(2, 14)`) el caso 5 se pone rojo (`archive.test.ts` 1 fallo de 5); con la forma anterior —`key.split('-').pop()`— esa mutación era invisible, porque las dos mitades de la expectativa salían del mismo `rawKey` mutado | ✅ |
| CA-5 una ventana a medias no produce veredicto | `src/mirror/window.ts` (`windowCoverage`, `windowValidity`, `assertWindowValid`, `InvalidWindowError`, `MIN_TICK_SUCCESS_RATIO`), `src/mirror/analysis/analyze.ts` (lo llama antes que nada). **Ronda 2 (F-SPEC-002-V2, enmienda §6):** `InvalidWindowError` recibe ahora `validity.coverage` entera además de `below` y la expone en `error.coverage`; el mensaje lleva **los seis pares** —peor primero, que es el que decide—, cada uno marcado `BELOW`/`ok`, más el recuento contra el umbral exigido | `tests/mirror/window.test.ts` (7): 95 % válida, 85 % inválida, **100 % + 50 % inválida** con la media (75 %) explícitamente descartada, 90 % exacto pasa, ventana vacía inválida, el error nombra el par y su cobertura. `tests/mirror/analysis/invalid-window.test.ts` (4): la fase B **se niega** (`InvalidWindowError`) sobre la ventana degradada y dicta veredicto sobre la sana. **Ronda 2:** `window.test.ts` **caso 8** monta los seis pares reales con uno al 50 % y exige que el mensaje nombre los **seis** con su ratio, el umbral, y la distinción `BELOW`/`ok` de un vistazo; `invalid-window.test.ts` **caso 4** comprueba que ese mensaje llega igual desde la fase B, nombrando los pares sanos; y `tests/mirror/cli/cli.test.ts` **caso 3** ata la otra mitad que pedía la enmienda —sobre una ventana inválida el CLI sale con error y **no se crea `hallazgos/`**—, que hasta ahora se cumplía por construcción y no estaba atado. Salvedad **F-SPEC-002-10** | **Cerrado F-SPEC-002-V2, comprobado ejecutando.** Ventana de **seis** pares reales con uno al 50 %, pasada a la fase B por el CLI: `InvalidWindowError: CA-5: refusing to judge an invalid window — 1 of 6 (source, competition) pairs below the required 90 % of successful ticks. Coverage of every pair: ceroacero/futgal-preferente-g1 at 50.0 % (3/6) BELOW; ceroacero/rfef-tercera-g1 at 100.0 % (6/6) ok; futgal/futgal-preferente-g1 at 100.0 % (6/6) ok; futgal/rfef-tercera-g1 at 100.0 % (6/6) ok; resultados-futbol/futgal-preferente-g1 at 100.0 % (6/6) ok; resultados-futbol/rfef-tercera-g1 at 100.0 % (6/6) ok`. Los **seis**, peor primero, con ratio, recuento contra el umbral y la marca `BELOW`/`ok`: el operador ve la salud de la ventana entera. Y **no se creó `hallazgos/`**. Mutación propia sobre una copia del repo (`coverage` → `below` en el mensaje): `window.test.ts` caso 8 y `invalid-window.test.ts` caso 4 se ponen rojos, o sea que los dos tests muerden. `analyze()` llama `assertWindowValid` en su primera línea, antes de leer el archivo. Salvedades **F-SPEC-002-10** (ratificada) y **F-SPEC-002-16** (abierta, para una eventual enmienda 2) | ✅ |
| CA-6 (RN-09) el cruce se declara a mano | `src/mirror/analysis/pairing.ts` (`PairingSchema` estricto, `buildPairingIndex`, `UnmappedMatchError`, `AmbiguousPairingError`) | `tests/mirror/analysis/pairing.test.ts` (7): identidad no mapeada → `UnmappedMatchError` con los dos equipos, la ref y la fuente en el mensaje; **«UD Ourense» / «Ourense CF» no se unen** y una tercera grafía no declarada tampoco cae en ninguno de los dos; una ref reclamada por dos partidos es error del fichero; el esquema rechaza una clave de más. No hay ninguna rama de parecido de cadenas en el módulo | `npx vitest run` → `pairing.test.ts` 7/7. Releído `pairing.ts` entero: no hay distancia de cadenas, ni normalización de nombres, ni fallback — la resolución es un `Map` de `source_ref`. **Ejecutado el caso real:** quitando `m4` del `pairing.json` de un archivo propio, el CLI aborta con `UnmappedMatchError: CA-6: ceroacero reports a match the pairing file does not map: Racing Villalbes 4 - Bergantinos FC 4 (ceroacero ref "m4"). Add it to the pairing file; it will not be matched by name similarity.` y **no escribe nada** en `hallazgos/`. El caso 4 del test es el ejemplo de `dominio.md` («UD Ourense» / «Ourense CF» no se unen) y además exige que una tercera grafía no declarada lance en vez de caer en la más parecida | ✅ |
| CA-7 el análisis es función del archivo | `src/mirror/analysis/timeline.ts` (ordena las claves él mismo), `src/mirror/analysis/analyze.ts` (sin reloj, sin red, sin BD) | `tests/mirror/analysis/determinism.test.ts` (4): dos ejecuciones → JSON byte a byte idéntico; claves invertidas y barajadas → idéntico; **dos relojes de sistema distintos** (`vi.setSystemTime`, 2026 y 2027) → idéntico; y el informe no está vacío (> 1000 bytes) para que la comparación mida algo | `npx vitest run` → `determinism.test.ts` 4/4. **Comprobado por el camino real, con fixture propio:** dos ejecuciones del CLI sobre el mismo archivo → `cmp` sin diferencias; y una tercera con el orden de los ticks **invertido** en `ventana.json` → informe idéntico byte a byte. `analyze()` no toca `Date.now()`, ni red, ni Postgres; `timeline.ts` ordena las claves él mismo y `comparePair` itera `[...values.keys()].sort()`. El caso 4 del test evita el verde por informe vacío (> 1000 bytes, 2 fuentes) | ✅ |
| CA-8 adelanto, retraso y empate con τ | `src/mirror/analysis/compare.ts` (`classifyLead`), `src/mirror/thresholds.ts` (`TAU_MS = 90 s`) | `tests/mirror/analysis/lead.test.ts` (**14**): tabla de límites 89 / **90** / 91 s en los dos sentidos (90 s exactos = empate, porque el criterio es estrictamente mayor); `first_seen` indefinido en una, en la otra y en las dos; la diferencia observada se registra con signo. El reparto de diferencias viaja en el informe (`observed_differences_s`), probado en `report.test.ts` caso 7. **Ronda 3 (F-SPEC-002-20): la frontera ya se ejerce de punta a punta.** Casos **13 y 14**: dos ventanas que difieren en **un segundo** sobre los mismos dos partidos —el candidato muestrea desfasado y publica el gol exactamente 90 s (caso 13) o 91 s (caso 14) antes que futgal—; a 90 s `leads_b = 0` y el veredicto **no** es INDEPENDIENTE, a 91 s son 2 adelantos en 2 partidos → INDEPENDIENTE con `rn02 = true`. Comprobado por mutación: `>` → `>=` en `classifyLead` pone rojo el caso **13** además de los unitarios 3 y 6, que era justo lo que antes no pasaba | `npx vitest run` → `lead.test.ts` **14/14**. **Probado por mí** (probe propio ejecutado en una copia del repo, 6/6): 91 s → `lead_b`, **90 s exactos → `tie`**, 89 s → `tie`, y los tres simétricos; `first_seen` indefinido → `only_a` / `only_b` / `neither` y **nunca** adelanto —importa, porque tratar un ausente como adelanto infinito dejaría que un partido que falta en una página probase la independencia de la otra—. `classifyLead` usa `>` estricto contra `tauMs`. El reparto observado viaja en el informe: mis informes reales llevan `observed_differences_s` junto a `thresholds.tau_ms`. **Ronda 3 — F-SPEC-002-20 (d) atendida, y el gap que yo declaré está cerrado.** La frontera se ejerce ahora a través de `comparePair` + `verdictAgainstReference` sobre dos ventanas que difieren en **un segundo** (casos 13 y 14), con `observed_differences_ms` asertado para que la ventana sea la que dice ser. **Muerde:** mutando `classifyLead` en la copia (`>` → `>=`, las dos líneas) salen **3 fallos** en `lead.test.ts` —los unitarios 3 y 6 **y el 13**—, donde en la ronda 2 solo caían los dos unitarios. Los casos 13 y 14 no son tautológicos en la otra dirección: fijan valores concretos (`leads_b` 0 vs 2, `lead_matches_b` 2, veredicto y bandera de RN-02 en los dos sentidos), no una relación entre campos del mismo objeto | ✅ |
| CA-9 un adelanto prueba independencia | `src/mirror/analysis/verdict.ts` (`verdictAgainstReference`, `leadsAreEnough`), `src/mirror/thresholds.ts` (`MIN_LEAD_EVENTS`, `MIN_LEAD_MATCHES`) | `tests/mirror/analysis/verdict-time.test.ts` (6): **(a)** 2 adelantos en 2 partidos → INDEPENDIENTE; **(b)** 2 adelantos en el MISMO partido → no INDEPENDIENTE; **(c)** S siempre 5 min por detrás y sin error replicado → **INCONCLUSO, no ESPEJO** (el corazón del criterio, con `leads_b = 0`, `leads_a > 0`, N ≥ 10 comprobados uno a uno); (d) un solo adelanto no basta; (e) 3 en 3 partidos → INDEPENDIENTE. Salvedades **F-SPEC-002-5** y **F-SPEC-002-6** | `npx vitest run` → `verdict-time.test.ts` 6/6. El caso (b) separa eventos de partidos (`leads_b === 2`, `lead_matches_b === 1` → no INDEPENDIENTE). **El corazón del criterio, reproducido con fixture propio y pasado por el CLI real:** 8 partidos, las dos candidatas **cinco minutos por detrás** de futgal en todos, 12 capturas → `INCONCLUSO / sin_senal`, `adelantos_suyos=0`, `retrasos=8`, `N=16`, `indicio=false`. **No es ESPEJO**, que es exactamente lo que el CA (c) exige. El «si y solo si» está acotado a la señal temporal, como ratifica la enmienda §3: `independent` es `leadsAreEnough(...)` **O** `persistent_discrepancies.length > 0`, y ese término ya no puede contener grafía | ✅ |
| CA-10 las señales que no dependen del reloj | `src/mirror/analysis/compare.ts` (`isRetraction`, `replicatedErrors`, `contentDivergences` por rondas, exclusivos), `src/mirror/thresholds.ts` (`MIN_PERSISTENT_CAPTURES`). **Ronda 2 (F-SPEC-002-V1, enmienda §1):** `DiscrepancyFact` baja a los **tres** hechos que deciden (`existence`, `kickoff`, `finished_result`) y la grafía sale a un tipo propio, `SpellingDivergence`; `contentDivergences` calcula las dos listas en una sola pasada, con la misma vara de medir, y `comparePair` las devuelve separadas. `verdictAgainstReference` no necesita filtro: `persistent_discrepancies` ya no puede contener grafía | `tests/mirror/analysis/verdict-content.test.ts` (**11**): **(a)** error transitorio replicado → ESPEJO **citando las cuatro claves**, y las cuatro existen en el store; (a-bis) un error que solo comete F no es replicado; **(b)** S con un hecho que F no tiene → no ESPEJO por error replicado; **(c)** horarios distintos en 2 capturas que convergen → **no** persistente; **(d)** los mismos en 3 capturas → INDEPENDIENTE; (e) partido que solo una fuente tiene → discrepancia de existencia; y que bajar un marcador es retractarse mientras subirlo es jugar. **Ronda 2:** `tests/mirror/analysis/spelling.test.ts` (10) trae el caso que el CA declara que «no puede faltar» — **caso 1**: doce partidos en reposo, tres de ellos escritos distinto por cada fuente, persistentes en las 4 capturas, N = 12 ≥ N_min, cero de todo lo demás → **INCONCLUSO/`sin_senal`**, no INDEPENDIENTE, con `rn02=false`; **caso 2**: la divergencia aparece contada y **citada**, y cada clave existe en el store (CA-14); **caso 4**: se comprueba que la ventana no tenía ninguna otra señal, o sea que el caso 1 mide lo que dice medir; **caso 5**: un ESPEJO por indicio sigue siendo ESPEJO con grafías divergentes (no dicta hacia ESPEJO tampoco); **caso 6**: dos ventanas que **solo** difieren en cómo se escriben tres nombres producen los **tres** veredictos idénticos, que es «sin voto en las dos direcciones» dicho como aserción. Mutación comprobada: devolver el voto a la grafía pone 5 de los 10 en rojo. **Ronda 3 (F-SPEC-002-V5): el séptimo fixture, que faltaba.** Nuevo bloque *«CA-10, regla de decisión paso 2 — señales fuertes contradictorias»* en `verdict-content.test.ts`, tres casos: **(g)** 2 adelantos de S en 2 partidos **más** un error replicado —la retractación `1-0 → 0-0` cae en el **mismo minuto** en las dos fuentes, para que no aporte adelanto propio y las dos señales se puedan contar por separado— → **INCONCLUSO / `senales_contradictorias`**, con `rn02 = false` (CA-12), y el test comprueba **antes** que las dos señales están y superan su mínimo declarado (`n_comparable ≥ 10`, `leads_b = 2`, `lead_matches_b = 2`, `replicated_errors = 1`), o si no estaría asertando INCONCLUSO por el motivo equivocado; **(g-bis)** el **mismo archivo por el camino real de `analyze()`**, asertando el veredicto y la bandera en el informe y que la contradicción queda auditable (CA-14: las 4 claves raw del error replicado y ≥ 2 adelantos citados, para que una persona pueda abrir las capturas y decidir cuál de las dos señales mintió); **(g-ter)** un **indicio** de espejo —sincronía entera: cero exclusivos, cero adelantos en las **dos** direcciones, mitad temporal `completa`— concurriendo con una discrepancia persistente **no** dispara el paso 2: **cede** ante la señal fuerte y el veredicto es el INDEPENDIENTE del paso 3, que es lo que la spec dice expresamente. Salvedades **F-SPEC-002-4**, **F-SPEC-002-5**, **F-SPEC-002-7**, **F-SPEC-002-9** (ratificadas), **F-SPEC-002-19** (abierta) | **Cerrado F-SPEC-002-V5, comprobado mutando y no leyendo.** Los siete fixtures que el CA enumera están, y el séptimo muerde. **La mutación exacta con la que levanté el finding, repetida en la tercera vuelta** sobre una copia aislada del repo (`scratchpad/mut`, con su propio `node_modules`; el árbol de trabajo real quedó intacto, `git status` vacío antes y después). Baseline de la copia: `Test Files 46 passed (46) · Tests 415 passed (415)`. Borrada la rama `input.independent && input.strongMirror` de `decide()` (`src/mirror/analysis/verdict.ts:187-194`): `Test Files 2 failed \| 21 passed (23) · Tests 3 failed \| 142 passed (145)`, y los tres fallos son exactamente los del paso 2 —`verdict-content.test.ts (g)`, `(g-bis)` y `pair.test.ts (g)`—, los tres con `AssertionError: expected 'INDEPENDIENTE' to be 'INCONCLUSO'`. En la ronda 2 esa misma mutación dejaba la suite entera verde. **Rojos por el motivo correcto, no por cualquier motivo:** los fallos caen en la aserción del **veredicto**, después de las guardas, o sea que las guardas pasan también bajo mutación y la ventana tiene de verdad las dos señales. Probe propio sobre esa ventana, con y sin la rama: `{n:14, leads_b:2, lead_matches_b:2, repl:1}` → sin mutar `INCONCLUSO / senales_contradictorias / rn02=false`; mutada, **`INDEPENDIENTE / adelantos / rn02=true`**. Es la dirección peligrosa del §Problema, y ahora tiene red. **Las tres cosas por las que un fixture así se cuela pasando en vacío, comprobadas una a una:** (1) **el caso asserta antes las dos señales fuertes y sus mínimos** —`n_comparable ≥ 10`, `leads_b === 2`, `lead_matches_b === 2`, `replicated_errors` de longitud **1**—, todo igualdades exactas, así que no puede estar dando INCONCLUSO por muestra insuficiente ni por ningún otro motivo; la retractación cae en el **mismo minuto** en las dos fuentes y por eso no aporta adelanto propio. (2) **el indicio cede y no dispara el paso 2** (`g-ter`): sincronía entera —`temporal_half='completa'`, `exclusives_b=0`, `leads_a=0`, `leads_b=0`, N ≥ 10, todo asertado— concurriendo con discrepancia persistente → `INDEPENDIENTE / discrepancia_persistente`, el paso 3. **Medido por mutación propia:** promoviendo el indicio a señal fuerte (`strongMirror: … \|\| lockstep`) el caso `(g-ter)` se pone rojo junto a `(d)` y `report.test.ts:13`. (3) **el paso equivalente del par está cubierto** — ver CA-15. Sigue en pie lo cerrado en la ronda 2 y no se ha reabierto: la grafía no vota en ninguna dirección (mutación de la ronda 2: 5 fallos de 10 en `spelling.test.ts`), 10.2 sigue dictando y 10.1 mide retractación y no gol. Salvedades **F-SPEC-002-4, -5, -7, -9** (ratificadas), **F-SPEC-002-19** (abierta) | ✅ |
| CA-11 la muestra insuficiente es un veredicto | `src/mirror/analysis/verdict.ts` (puerta `n_comparable < N_MIN` antes de todo), `src/mirror/thresholds.ts` (`N_MIN = 10`) | `tests/mirror/analysis/sample-size.test.ts` (5): N = 9 → INCONCLUSO con motivo `muestra_insuficiente`; el informe lleva **el N observado y el N_min exigido** en las dos secciones (fuente y par); con N = 9 no se dicta ni ESPEJO ni INDEPENDIENTE; **N = 10 sí dicta veredicto**. Mutación: quitar la puerta pone la suite roja | `npx vitest run` → `sample-size.test.ts` 5/5; el N observado **y** el N_min exigido viajan en las dos secciones (fuente y par). **Reproducido con fixture propio de 4 partidos por el CLI real:** `INCONCLUSO / muestra_insuficiente`, `N=8`, `N_min=10`, `rn02=false` en las dos fuentes **y** en el par, sin dictar ni ESPEJO ni INDEPENDIENTE. La puerta `n_comparable < N_MIN` es la primera línea de `verdictAgainstReference` y de `verdictBetweenCandidates`: es el paso 1 de la regla de decisión, tal como pide la enmienda §5 | ✅ |
| CA-12 (RN-02) lo desconocido no es independencia | `src/mirror/analysis/verdict.ts` (`rn02_segunda_via_entre_automaticas` se fija en `decide()` y en `insufficient()`, en ninguna otra rama) | `tests/mirror/analysis/rn02.test.ts` (5): tabla sobre los tres veredictos producidos por tres ventanas distintas —INDEPENDIENTE → `true`, ESPEJO → `false`, INCONCLUSO → `false`—; el par lleva la misma bandera con la misma regla; **caso 5** recorre la función de decisión con cinco análisis sintéticos y comprueba `bandera === (veredicto === 'INDEPENDIENTE')` sin excepción. **Ronda 3 (F-SPEC-002-20):** el **caso 4** deja de ser relacional —comparaba dos campos del mismo objeto y pasaba con cualquier veredicto— y fija los veredictos **primero**, sobre **tres** ventanas. Al hacerlo aparece asertado el hueco que CA-15 existe para cerrar: en `bothIndependentPlan()` las dos candidatas **sí** son INDEPENDIENTE de futgal (`rn02 = true` en las dos) y el **par** sale **ESPEJO** con `rn02 = false`, porque son espejos **entre sí**. Se añade `mutualLeadsPlan()` a `tests/mirror/support/plans.ts` para el caso en que el par sí se gana el `true` (adelantos mutuos 2 y 2, CA-15.1) | `npx vitest run` → `rn02.test.ts` 5/5. `grep -n "rn02_segunda_via" src/mirror/` → la bandera se escribe en **exactamente dos** sitios (`decide()` e `insufficient()` en `verdict.ts`). **Comprobado sobre los ocho informes que generé yo:** `true` únicamente en las dos ventanas que salen INDEPENDIENTE (discrepancia de horario persistente; adelantos mutuos del par) y `false` en las seis restantes —ESPEJO por indicio, ESPEJO por error replicado, ESPEJO por adelantos en una sola dirección, INCONCLUSO sin señal, INCONCLUSO por muestra insuficiente e INCONCLUSO por señales contradictorias—. El invariante `bandera === (veredicto === 'INDEPENDIENTE')` se sostiene sin excepción. **Ronda 3 — F-SPEC-002-20 (b) atendida y medida por mutación.** El caso 4 deja de ser relacional: fija veredictos concretos sobre **tres** ventanas. **Muerde:** anulando el indicio en el par (`weakMirror: lockstep` → `false` en `verdictBetweenCandidates`), el **único** test rojo de las 145 es precisamente `rn02.test.ts` caso 4 —con la forma relacional anterior esa mutación era invisible—. Y no se ha vuelto tautológico en la otra dirección: asserta cadenas literales (`'ESPEJO'`, `'INDEPENDIENTE'`) y booleanos, no una igualdad entre dos campos del mismo objeto. De paso queda asertado el hueco que CA-15 existe para cerrar: en `bothIndependentPlan()` las dos candidatas salen `rn02 = true` contra futgal y el **par** sale `ESPEJO` con `rn02 = false` | ✅ |
| CA-13 veredicto accionable; el parcial es un veredicto | `src/mirror/analysis/report.ts` (esquema zod **local a la spec**, `z.strictObject` en todo), `src/mirror/analysis/analyze.ts`, `src/mirror/analysis/prose.ts`, `src/mirror/analysis/findings.ts`. **Ronda 2 (F-SPEC-002-V3, enmienda §1):** `spelling_divergences` es clave propia en `CountersSchema` **y** en `PairCountersSchema`, con `SpellingDivergenceEvidenceSchema` (campos `spelling_a`/`spelling_b`, sus `raw_keys`) en `EvidenceSchema`. Y `team_spelling` **sale del enum** `DiscrepancyFactSchema`: el fallo deja de ser representable en vez de quedar desaconsejado, que es lo que el CA pide al llamar «invitación» al contador compartido. `prose.ts` gana `spellingNote()`, que dice que se registran, que **no dictan** y por qué —el agregador rinde el nombre desde su propia base de equipos—, y para qué se conservan; `findings.ts`, su fila en las dos tablas | `tests/mirror/analysis/report.test.ts` (13): el JSON valida; **una clave de más y una de menos lo invalidan igual**; lleva los cinco umbrales, la ventana y la cobertura por par; un veredicto por candidata y uno para el par; un párrafo en prosa por fuente que nombra RN-02; **caso 8** — fixture solo de contenido → valida, dicta veredicto y marca la temporal `pendiente` con la ventana prevista, y los contadores temporales son `null`; **casos 11-13** — la advertencia de la métrica de conflictos aparece si ninguna candidata es INDEPENDIENTE (en JSON **y** en prosa, con `hard_cut_15_percent_applies: false`) y no aparece si una lo es. `tests/mirror/analysis/findings.test.ts` (6): el documento vive en `docs/epicas/EPIC-001-spike-ingesta/hallazgos/test-de-espejo.md`, el JSON al lado, lleva umbrales y advertencia, y es determinista. **Ronda 2:** `spelling.test.ts` **caso 7** (la clave propia existe en fuente y par, y las persistentes quedan en 0 sobre el fixture solo-de-grafía), **caso 8** (el esquema **rechaza** `fact: 'team_spelling'` en una discrepancia persistente), **casos 9-10** (la prosa lo dice cuando las hay y **no** habla de ellas cuando no las hay). Y `tests/mirror/cli/cli.test.ts` **caso 2** comprueba que el generador se puede ejecutar de verdad: `npm run mirror:analizar` escribe el `.md` y el `.json` y saca los tres veredictos por consola. Salvedad **F-SPEC-002-12** (aún no hay hallazgo escrito: no ha habido ventana) | **Cerrado F-SPEC-002-V3, comprobado ejecutando.** `report.test.ts` 13/13 y `findings.test.ts` 6/6. **Medido sobre el informe que escribió el CLI con mi fixture:** `Object.keys(counters)` = `n_comparable, n_min, exclusive_to_source, exclusive_to_reference, replicated_errors, persistent_discrepancies, `**`spelling_divergences`**`, temporal`, con `spelling_divergences=8` y `persistent_discrepancies=0` sobre la ventana que **solo** difiere en grafía; el par lleva la suya. Probe propio (6/6 en copia del repo): una clave de más invalida, una de menos invalida, **quitar `spelling_divergences` de `counters` o de `pair.counters` invalida** —o sea que es obligatoria, no opcional— y `fact: 'team_spelling'` en una discrepancia persistente **no es representable**. La prosa dice «Aparte, y sin voto: 8 divergencias de grafía … la grafía **no dicta** veredicto (CA-10.4) …» y el `.md` las lleva en su propia fila de la tabla. Informe parcial: ventana en reposo con el cuarto argumento → `halves:{"content":"completa","temporal":"pendiente","planned_temporal_window":"xornada do 12-13 de setembro de 2026"}` y `counters.temporal=null`, válido y con veredicto. Advertencia de conflictos: presente (`hard_cut_15_percent_applies:false`, en JSON **y** en prosa) cuando ninguna candidata es INDEPENDIENTE, y `null` en la ventana en que las dos lo son. **F-SPEC-002-12 no cuenta en contra:** el CA exige el **generador**, y lo he ejecutado entero por el camino del operador | ✅ |
| CA-14 (RN-12 por analogía) cada afirmación cita sus capturas | `src/mirror/analysis/analyze.ts` (`eventEvidence`, `evidenceOf`), `src/mirror/analysis/compare.ts` (arrastra `raw_key` en `first_seen`, en los errores replicados y en las discrepancias) | `tests/mirror/analysis/citations.test.ts` (5): sobre una ventana con adelantos, exclusivos **y** error replicado, se recorren **todas** las claves citadas y `store.get()` devuelve algo para cada una; el recorrido mide algo (> 10 claves y los tres tipos presentes); cada adelanto cita 2 capturas y cada error replicado exactamente 4 distintas; y una clave inventada devuelve `null`, o sea que la comprobación sabe fallar. **Ronda 2:** el recorrido de `citedKeys` incluye ahora `evidence.spelling_divergences` —CA-10.4 les quita el voto, no la cita—, y `spelling.test.ts` caso 2 comprueba una a una las claves de la grafía contra el store | `npx vitest run` → `citations.test.ts` 5/5. **Comprobado contra el archivo de mi propia ventana:** recorridas todas las claves de `raw_keys` del informe —adelantos, exclusivos, errores replicados **y divergencias de grafía**— → 10 claves citadas, **0 colgadas**; control negativo: una clave inventada no existe en el store. En el fixture de retractación, el error replicado cita exactamente **4** capturas. Las citas no se fabrican: los fixtures entran por el camino real (`store.put()` de HTML → `store.get()` → extractor real). La enmienda le quita el voto a la grafía, no la cita, y así está | ✅ |
| CA-15 (RN-02) el cruce de las dos candidatas | `src/mirror/analysis/verdict.ts` (`verdictBetweenCandidates`, `errorSignature`), `src/mirror/analysis/analyze.ts` (`pairReport` con el reparto de errores replicados). **Ronda 2 (15.4):** `verdictBetweenCandidates` sigue leyendo `persistent_discrepancies.length > 0`, pero ese término ya no puede contener grafía —sale de raíz en `compare.ts`—, así que la simetría de 15.4 se cumple por construcción y no por un filtro que alguien pueda olvidar. El par lleva su propio `counters.spelling_divergences` y su prosa lo nombra | `tests/mirror/analysis/pair.test.ts` (**7**): **(a)** adelantos mutuos 2 y 2 → INDEPENDIENTE con motivo `adelantos_mutuos`; **(b)** C1 adelanta 4 veces y C2 nunca → ESPEJO con `espejo_de: ceroacero`; **(c)** error replicado por las dos y **ausente de futgal** → `origen_comun_distinto_de_futgal: true` y la prosa lo nombra; **(d)** el mismo error presente también en futgal → cuenta en `replicated_errors_also_in_reference`; **(e)** N < 10 → INCONCLUSO y el par no habilita la segunda vía; (f) 2 adelantos en una sola dirección no son independencia mutua. **Ronda 2:** `spelling.test.ts` **caso 3** — sobre la ventana en que las tres fuentes solo difieren en la grafía, el par sale **INCONCLUSO** con `rn02=false` y `spelling_divergences = 3`, donde antes salía INDEPENDIENTE; el **caso 6** lo incluye en la comparación de veredictos con y sin divergencia. **Ronda 3 (F-SPEC-002-V5, la mitad del par):** caso **(g)** — el paso 2 de la regla de decisión llega al par por su propia ruta, adelantos **mutuos** (2 y 2, la fuerte-independiente de 15.1) concurriendo con un error replicado (15.2) → **INCONCLUSO / `senales_contradictorias`**, `espejo_de = null` y `rn02 = false`; y `origen_comun_distinto_de_futgal` **sobrevive** al veredicto indeciso con sus 4 claves citadas, que es la red de CA-14 sobre la que se apoya el arbitraje de F-SPEC-002-8. Salvedad nueva **F-SPEC-002-21** (el adelanto en una sola dirección entra en el par como señal *fuerte* de espejo, y la regla de decisión de CA-10 no lo dice) | **Cerrado el arrastre de F-SPEC-002-V1 por 15.4, y cerrada la mitad del par de F-SPEC-002-V5.** `pair.test.ts` **7/7**. **El paso 2 llega al par por su propia ruta y su red muerde:** con la rama de `decide()` borrada en la copia, `pair.test.ts (g)` es uno de los tres rojos (`expected 'INDEPENDIENTE' to be 'INCONCLUSO'`), o sea que la ruta del par no descansa sobre el test de la ruta contra futgal. El caso asserta **antes** que las dos señales están y superan el listón **doble** de 15.1 —`lead_matches_first ≥ 2` **y** `lead_matches_second ≥ 2`, adelantos en las dos direcciones— más `replicated_errors_total === 1`, y después `INCONCLUSO / senales_contradictorias`, `espejo_de = null`, `rn02 = false` y `origen_comun_distinto_de_futgal = true` con sus 4 claves citadas: el veredicto queda indeciso, la evidencia de 15.2 no. Comprobado además que el listón de 15.1 no se puede rebajar sin que salte la suite: mutando `independent = mutual \|\| oneWay \|\| …` el caso (b) se pone rojo. **Reproducido con fixtures propios por el CLI real:** (a) cada candidata adelanta a la otra 2 veces en 2 partidos → `INDEPENDIENTE / adelantos_mutuos`, `rn02=true`, `espejo_de=null`; (b) adelantos 4 / 0 en una sola dirección → **no** es independencia: `ESPEJO / adelantos_en_una_sola_direccion` con `espejo_de=ceroacero` y `rn02=false`; (e) N=8 < N_min → `INCONCLUSO / muestra_insuficiente`, `rn02=false`. (c) y (d) las cubre `pair.test.ts` con el reparto en `replicated_errors_also_in_reference` / `replicated_errors_absent_from_reference`, `origen_comun_distinto_de_futgal` y la prosa nombrando «aguas arriba» — la distinción que solo este cruce puede producir. **15.4:** sobre la ventana en que las tres fuentes solo difieren en la grafía, el par sale `INCONCLUSO` con `rn02=false` y `spelling_divergences=8`; sobre la **misma** ventana con las grafías iguales, el veredicto del par es **el mismo**. La simetría se cumple por construcción y no por un filtro que alguien pueda olvidar: `team_spelling` ya no puede entrar en `persistent_discrepancies` | ✅ |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

### Nota posterior — 2026-08-31 (`sdd-verificador`): CA-2 pasa a ✅, F-SPEC-002-1 cerrada

Verificación **posterior y estrecha**, de un solo criterio. No revisa ni sustituye
el GREEN de la tercera vuelta que sigue más abajo: ese veredicto queda intacto, y
de los 15 CA solo se toca la fila de CA-2. La spec sigue en `hecho`, que es
terminal.

**Qué había.** CA-2 quedó en ⚠️ por **F-SPEC-002-1**: la *forma* de la User-Agent
estaba probada, pero el *contacto* era un marcador de posición
(`https://github.com/tremen-dev/marcador.gal`, una URL supuesta sobre un dominio
sin contratar). RN-11 pide «identificar el user-agent», y un contacto que no
resuelve no identifica a nadie.

**Qué mido ahora**, sin leer la constante y sin importarla —el literal esperado lo
escribo yo en la sonda—, sobre `82eaeb7`:

1. **La UA que viaja de verdad.** Servidor HTTP local + el CLI real
   (`node src/mirror/cli/capturar-cli.ts`) por el camino del operador: la cabecera
   que **recibe el servidor** es, carácter a carácter,
   `marcador.gal/0.0.1 (+mailto:ola@tremen.dev; medicion SPEC-002, RN-11)`.
   Ni rastro del contacto viejo. El tick queda `ok` y archivado.
2. **La red puede fallar.** `USER_AGENT_PATTERN` rechaza 12 UA degradadas —entre
   ellas contacto ausente, vacío, sin esquema, `ftp:`, `tel:`, y un `Mozilla/5.0`
   camuflado— y acepta solo la buena. No es un patrón que diga que sí a todo.
3. **El grupo de robots.txt no se mueve.** `parseRobots` deriva el token de
   `userAgent.split('/')[0]`, que el contacto no toca: con un robots.txt de tres
   grupos (`BadBot`, `marcador.gal`, `*`), los veredictos son **idénticos** con la
   UA nueva y con la vieja, obedece a su grupo nombrado y no al de `BadBot`.
4. **Nada más se coló.** `git show --stat 82eaeb7` → 1 fichero, 6 inserciones,
   3 borrados, todo en `src/mirror/user-agent.ts`.
5. **El resto sigue en pie.** `npm run lint` (`oxlint --type-aware`) exit 0;
   `npx tsc --noEmit` exit 0; `npx vitest run` → **46/46 ficheros, 415/415 casos**,
   la línea base exacta. Sin regresión.

**El juicio que se me pidió: ¿`mailto:ola@tremen.dev` satisface RN-11?** Sí, y no
por deferencia al gate. RN-11 exige que quien recibe nuestras peticiones pueda
saber quién pregunta y adónde quejarse. La cadena nombra el producto
(`marcador.gal`), la versión, el propósito (`medicion SPEC-002, RN-11`) y un canal
de contacto con esquema. Que el contacto esté **fuera** del dominio del producto no
lo debilita: RN-11 pide un canal que funcione, no un canal en un dominio concreto,
y un buzón en un dominio que existe es estrictamente más identificable que una URL
sobre un dominio sin contratar. El razonamiento del gate se sostiene.

**Lo que sí he podido comprobar del mundo:** `tremen.dev` resuelve en DNS (A/AAAA)
y **tiene MX** publicados (`route1/2/3.mx.cloudflare.net`), o sea que el dominio
existe y está configurado para **aceptar correo**. Eso es más de lo que tenía el
contacto anterior.

**Lo que queda como afirmación del humano, y lo digo explícitamente:** que el buzón
`ola@` exista tras ese MX y que **alguien lo lea**. Eso no se puede verificar desde
el repositorio ni enviando correo desde aquí, y no lo he verificado. Es una
afirmación de Alberto Fojo, fechada el 2026-08-31 y escrita en la cabecera de
`src/mirror/user-agent.ts`. Si el buzón no se leyera, RN-11 volvería a estar
incumplido **sin que ningún test se pusiera rojo**: es la clase de compromiso que
solo una persona puede sostener.

**F-SPEC-002-1: cerrada.** CA-2 pasa de ⚠️ a ✅. Con ello los **15 CA de SPEC-002
quedan en verde**, sin salvedades vivas en la matriz.

---

**GREEN — 2026-08-31 (`sdd-verificador`), tercera vuelta.** Verificado contra el
**texto enmendado** (enmienda 1 del 2026-08-31, ratificada entera por el gate),
que es el contrato vigente. **14 CA en verde y 1 con salvedad conocida y
aceptada (CA-2, F-SPEC-002-1).** El único rojo de la segunda vuelta,
**F-SPEC-002-V5**, queda cerrado, y lo cierro **mutando, no leyendo**. Los
cuatro findings de la primera vuelta siguen cerrados y ninguno se ha reabierto.

**Gates automáticos: todos verdes.**

```
$ node --version           v26.4.0
$ npx oxlint --version     Version: 1.80.0
$ npm run lint             → oxlint --type-aware, exit 0, sin hallazgos
$ npx tsc --noEmit         → exit 0, sin salida
$ npx vitest run           → Test Files 46 passed (46) · Tests 415 passed (415)
                             Type Errors no errors · Duration 1.28s
```

Reparto medido, no citado: **145 casos bajo `tests/mirror/`** (SPEC-002, `npx
vitest run tests/mirror` → 23/23 ficheros) y **270 del resto** (SPEC-001, verde
y sin tocar). Ni un `.skip`, `.only` ni `.todo` en `tests/` — comprobado con
grep, porque una suite verde por omisión no es una suite verde. Las suites de
integración (`test:db`, `test:blob`) no se reejecutan: SPEC-002 no toca Postgres
ni Blob, y el diff de esta ronda no roza `src/` en absoluto.

**Cero cambios en código de producción en esta ronda, medido y no aceptado de
palabra.** Es la otra mitad de lo que había que juzgar aquí:

```
$ git diff --stat 5af5aaf..HEAD -- src/      → vacío
$ git diff --stat a6b1f62..HEAD -- src/      → vacío   (último commit de código de la ronda 2)
$ git diff --stat 5af5aaf..HEAD
  …ledger.md | 442 ++-      …SPEC-002….md | 2 +
  tests/mirror/analysis/lead.test.ts | 92 ++-      pair.test.ts | 52 +
  tests/mirror/analysis/rn02.test.ts | 38 ±       verdict-content.test.ts | 98 ++-
  tests/mirror/capture/archive.test.ts | 10 ±     no-extractor.test.ts | 4 +
  tests/mirror/support/plans.ts | 11 +
```

Las dos líneas de la spec son **solo frontmatter** —dos entradas de `historial`,
las transiciones de estado de la ronda—: el texto del contrato no se ha tocado,
comprobado con `git diff` sobre el fichero. Y `git status` sale vacío: las
mutaciones de abajo se hicieron sobre una **copia aislada** en scratchpad, con
su propio `node_modules`, no sobre el árbol de trabajo.

**El lint NO es ciego (F-SPEC-001-22 no se repite).** Medido por cobertura y no
por exit code:

```
$ npx oxlint --type-aware --debug=files | wc -l          → 118 ficheros
$ ... | grep -c 'src/mirror'                             → 25   (los 25 que hay)
$ ... | grep -c 'tests/mirror'                           → 32   (los 32 que hay)
$ comm -23 <(find src/mirror tests/mirror -name '*.ts' | sort) <(...)  → vacío
$ npx oxlint -A all -W style tests/mirror/analysis/{verdict-content,pair,lead}.test.ts
                                                         → emite diagnósticos
```

No queda ningún fichero fuera, y el reporter forzado habla **sobre los tres
ficheros de test que cambiaron en esta ronda**: el silencio de `npm run lint` es
limpieza real y no ausencia de mirada.

### F-SPEC-002-V5 — CERRADO, y cerrado mutando

Era el único rojo, y lo que había que juzgar en esta ronda. **No lo doy por
bueno porque el test exista: lo doy por bueno porque lo he puesto rojo yo.**

Sobre una copia aislada del repo (`scratchpad/mut`, con su propio
`node_modules`; baseline reproducido allí, `46 ficheros / 415 casos`), borrando
la rama `input.independent && input.strongMirror` de `decide()`
—`src/mirror/analysis/verdict.ts:187-194`, la mutación exacta con la que levanté
el finding—:

```
$ npx vitest run tests/mirror
 FAIL  tests/mirror/analysis/pair.test.ts > CA-15 — independencia mutua
       > (g) adelantos mutuos y error replicado a la vez → INCONCLUSO por señales contradictorias
       AssertionError: expected 'INDEPENDIENTE' to be 'INCONCLUSO'
 FAIL  tests/mirror/analysis/verdict-content.test.ts > CA-10, regla de decisión paso 2 …
       > (g) adelanto probado y error replicado a la vez → INCONCLUSO …
       AssertionError: expected 'INDEPENDIENTE' to be 'INCONCLUSO'
 FAIL  tests/mirror/analysis/verdict-content.test.ts > CA-10, regla de decisión paso 2 …
       > (g-bis) el mismo archivo, por el camino real del informe …
       AssertionError: expected 'INDEPENDIENTE' to be 'INCONCLUSO'

 Test Files  2 failed | 21 passed (23)
      Tests  3 failed | 142 passed (145)
```

En la segunda vuelta esa misma mutación dejaba `23 passed / 139 passed`: la
suite entera verde. Ahora hay red, en las **dos** rutas —contra futgal y en el
par— y ninguna descansa sobre la otra.

**Y se pone rojo por el motivo correcto.** Los tres fallos caen en la aserción
del **veredicto**, que va después de las guardas, o sea que las guardas siguen
pasando bajo mutación: la ventana tiene de verdad las dos señales fuertes. Probe
propio sobre esa misma ventana, con y sin la rama:

```
sin mutar:  {n:14, leads_b:2, lead_matches_b:2, repl:1}
            verdict INCONCLUSO · reason senales_contradictorias · rn02 false
mutada:     {n:14, leads_b:2, lead_matches_b:2, repl:1}
            verdict INDEPENDIENTE · reason adelantos · rn02 TRUE
```

Ese `true` es la dirección peligrosa del §Problema, y ahora tiene red.

**Las tres formas de colarse en vacío que pedía mirar, comprobadas una a una:**

1. **El caso asserta antes las dos señales fuertes y sus mínimos**, con
   igualdades exactas y no con `>` sueltos: `n_comparable ≥ 10`, `leads_b === 2`,
   `lead_matches_b === 2` (dos partidos distintos, que es el mínimo declarado de
   CA-9) y `replicated_errors` de longitud **1**. No puede estar dictando
   INCONCLUSO por muestra insuficiente ni por ausencia de señal. El fixture está
   construido para que las dos señales se cuenten por separado: la retractación
   cae en el **mismo minuto** en las dos fuentes, así que no aporta adelanto
   propio, y los dos adelantos son m1 y m2 y nada más.
2. **Un indicio no dispara el paso 2: cede.** El caso `(g-ter)` monta la
   sincronía entera —`temporal_half = 'completa'`, `exclusives_b = 0`,
   `leads_a = 0`, `leads_b = 0`, N ≥ 10, los cinco asertados— concurriendo con
   una discrepancia persistente, y exige el `INDEPENDIENTE /
   discrepancia_persistente` del paso 3. **Medido por mutación propia:**
   promoviendo el indicio a señal fuerte (`strongMirror: replicated_errors > 0
   || lockstep`) el caso `(g-ter)` se pone rojo junto a `(d)` y al caso 13 de
   `report.test.ts` — o sea que el indicio está realmente presente en esa
   ventana y el «cede» se mide contra algo.
3. **El paso equivalente del par está cubierto** y por su propia ruta: `pair.test.ts
   (g)` usa el listón **doble** de CA-15.1 —adelantos mutuos, `lead_matches_first
   ≥ 2` y `lead_matches_second ≥ 2`— más el error replicado, y comprueba además
   que `origen_comun_distinto_de_futgal` **sobrevive** al veredicto indeciso con
   sus cuatro claves citadas (CA-14), que es la red sobre la que el gate apoyó
   el arbitraje de F-SPEC-002-8.

Los **siete** fixtures que CA-10 enumera están ahora en el árbol: (a) y su
hermano (a-bis), (b), (c), (d) y (e) en `verdict-content.test.ts`, el de la
grafía en `spelling.test.ts` casos 1-2, y el séptimo en el bloque nuevo.

### La maquinaria de resolución de módulos (F-SPEC-002-V4), juzgada aparte

Se pedía mirarla con lupa y esto es lo que hay. **Los dos CLI arrancan y hacen
el trabajo completo**, no solo dejan de dar `ERR_MODULE_NOT_FOUND`:

- **Fase A, ejecutada de verdad** contra un servidor local: pide, respeta el
  `robots.txt`, manda la UA declarada, archiva bajo `rawKey()` y escribe el
  registro. Salida y evidencia en las filas de CA-1, CA-2, CA-3 y CA-4.
- **Fase B, ejecutada de verdad** ocho veces, con ocho archivos construidos por
  mí y no por los helpers del proyecto: escribe el `.md` y el `.json` en
  `hallazgos/`, saca los tres veredictos y aborta cuando debe.
- `npm run mirror:capturar` y `npm run mirror:analizar` sin argumentos llegan a
  su `main` y fallan con el mensaje de uso —o sea que el grafo entero
  (`@/raw/…`, `@/model/…`, `@/mirror/…`) resolvió— en vez de con
  `ERR_MODULE_NOT_FOUND`.

**El hook es estrecho.** `registerHooks` solo reescribe cuando el
**importador** vive bajo `src/` (`parentURL.startsWith(SRC_URL)`, con la barra
final, así que un hermano `srcfoo/` no entra), solo resuelve a un `.ts` que
**existe**, y todo lo demás cae a `nextResolve` intacto: `node_modules` no
cambia de significado, los especificadores desnudos (`zod`, `node:fs`) no se
tocan, y un `./algo.css` no se convierte en nada. Lo registran **solo** los dos
`-cli.ts` y nadie más (`grep -rn registerProjectResolution src tests`), así que
no entra en el build de Next ni en vitest. Sobrevive a `npx tsc --noEmit` y está
dentro de la cobertura de `oxlint --type-aware`. El import dinámico de `main`
después del registro es necesario y está bien razonado en el comentario.

Y el test que lo cubre muerde: comentando `registerProjectResolution()` en los
dos entries sobre una copia del repo, `cli.test.ts` reproduce el fallo original
—`Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@/raw' imported from
…/src/mirror/cli/capturar.ts`— en sus tres casos.

Queda declarado y **no lo cuento en contra de ningún CA** porque ninguno fija un
suelo de Node: **F-SPEC-002-17** (el hook exige Node ≥ 22.15 y `engines` promete
`>= 22`). Aquí corre Node 26.4.0.

### Los 13 CA que ya estaban en verde: comprobado que esta ronda no los rompe

No los rehago enteros, y no hace falta: **el diff de la ronda no toca `src/` ni
una línea**, así que ninguna conducta ha cambiado; la suite completa sigue verde
(415/415, +6 casos y ni un fichero nuevo); y los cinco ficheros de test que
cambiaron solo **añaden** casos o **aprietan** aserciones existentes —ninguna
aserción se ha borrado ni relajado, leído el diff línea a línea—. Los apretones
de (b), (c) y (d) de F-SPEC-002-20 caen sobre CA-12, CA-4 y CA-8, y los tres
siguen ✅ con evidencia nueva y más fuerte que la que tenían.

### Lo que cierro de la primera vuelta (recomprobado: sigue cerrado)

Los cuatro, comprobados por mí contra el código y ejecutando, no por lo que dice
la matriz:

- **F-SPEC-002-V1 y -V3 (el bloqueante y su gemelo) — CERRADOS.** La grafía no
  vota **en ninguna dirección**. Fixture mío de 12 partidos en reposo cuya única
  diferencia son los nombres: `INCONCLUSO / sin_senal`, `rn02=false` en las tres
  cruces, `spelling_divergences=12`, `persistent_discrepancies=0`. Fixture en
  lockstep con y sin divergencia: **ESPEJO en las dos**, así que tampoco la
  bloquea. Y dos ventanas idénticas salvo en la grafía producen informes
  **idénticos** una vez quitadas las claves de grafía. El contador vive en su
  clave propia, es **obligatorio** en el esquema (quitarlo invalida), y
  `fact: 'team_spelling'` ya no es representable en una discrepancia
  persistente. Control positivo: CA-10.2 sigue dictando —horarios distintos y
  persistentes en 3 rondas → `INDEPENDIENTE / discrepancia_persistente`—, o sea
  que no se neutralizó la señal entera al quitarle la grafía.
- **F-SPEC-002-V2 — CERRADO.** El error de CA-5 nombra los **seis** pares con su
  ratio, el umbral y la marca `BELOW`/`ok`, peor primero, y sobre una ventana
  inválida no se crea `hallazgos/`. Salida completa en la fila de CA-5.
- **F-SPEC-002-V4 — CERRADO.** Arriba.

### Lo que devuelve la spec

**Nada. Cero findings nuevos en la tercera vuelta.** Ni bloqueantes ni de
calidad: audité fichero por fichero los cinco tests que cambiaron y los cuatro
apretones de F-SPEC-002-20, y ninguno se ha vuelto tautológico en la otra
dirección —los tres que pueden medirse con una mutación de producción la
resisten, y el cuarto es un guardián declarado como tal—.

*Lo que sigue es el texto de la segunda vuelta, conservado porque es el finding
que esta ronda cierra. **Ya no está abierto**: ver «F-SPEC-002-V5 — CERRADO, y
cerrado mutando», arriba.*

- **F-SPEC-002-V5 (bloqueante en la 2.ª vuelta, CERRADO en la 3.ª) — la regla de
  decisión tenía un paso sin test, y se perdía en silencio.** CA-10 enumera
  **siete** fixtures. Entonces había seis. El
  séptimo —«adelanto probado y error replicado a la vez → INCONCLUSO por
  señales contradictorias»— **no existe**:

  ```
  $ grep -rn 'senales_contradictorias' src tests
  src/mirror/analysis/verdict.ts:34
  src/mirror/analysis/verdict.ts:190
  ```

  La conducta **sí** está implementada y la comprobé a mano: ventana propia con
  2 adelantos en 2 partidos **y** un error replicado → `INCONCLUSO /
  senales_contradictorias / rn02=false`, que es lo que la enmienda §5 manda.
  Lo que falta es la red. Mutación sobre una copia del repo, borrando la rama
  `input.independent && input.strongMirror` (`verdict.ts:187-194`):

  ```
  $ npx vitest run tests/mirror
   Test Files  23 passed (23)
        Tests  139 passed (139)
  ```

  La suite entera sigue verde, y esa misma ventana pasa a **`INDEPENDIENTE /
  adelantos / rn02_segunda_via_entre_automaticas: true`**. Es decir: el paso 2
  de la regla de decisión —el que el gate ratificó explícitamente en
  F-SPEC-002-8, «el orden importa: la contradicción gana sobre la
  independencia»— puede desaparecer sin que nada se entere, y lo que sale por la
  puerta es un `true` en la bandera que gobierna RN-02. Es la dirección
  peligrosa del §Problema, y es exactamente la clase de agujero que la sección
  *Comprobaciones por mutación* de este ledger existe para cerrar; no se aplicó
  a esta rama.

  **Cómo se cierra:** un fixture más en `verdict-content.test.ts` (o en
  `verdict-time.test.ts`), con la forma que el CA nombra, asertando `verdict ===
  'INCONCLUSO'`, `reason === 'senales_contradictorias'` y
  `rn02_segunda_via_entre_automaticas === false`. El archivo con el que lo
  reproduje es de construcción trivial: un partido con retractación replicada
  por F y S, dos partidos en los que S adelanta a F, y relleno hasta N ≥ 10.
  No hay que tocar código de producción.

### Lo que NO cuenta en contra

- **F-SPEC-002-12** (no hay `hallazgos/` en el repo porque no ha habido
  ventana). Ningún CA exige el documento escrito: CA-13 exige el **generador**,
  y esta vez lo ejecuté entero por el camino del operador, ocho veces. Fabricar
  un hallazgo sin ventana sería lo peor que podría hacer esta spec.
- **F-SPEC-002-17** (suelo de Node). Ningún CA fija el anfitrión; la spec dice
  expresamente que «los CA restringen el archivo y el ritmo, no el anfitrión».
  Va abajo, para el humano.
- **F-SPEC-002-2, -3, -11, -16, -19.** Declaradas, fuera del texto de los CA o
  dirigidas a otros roles.
- **F-SPEC-002-21** (nueva, de la tercera vuelta). La comprobé contra el código
  y el hecho es cierto: `verdictBetweenCandidates` calcula `strongMirror =
  replicated_errors.length > 0 || oneWay`, mientras que la regla de decisión de
  CA-10 define *fuerte-espejo* como «≥ 1 error replicado» y nada más. **No la
  cuento en contra de CA-15**, por dos razones: es código de la primera vuelta,
  no de esta, y es una lectura defendible de CA-15.1 —«entonces la rezagada se
  trata como espejo de la otra»—, que es texto del CA. Y **doy por buena la
  decisión de no atarla con un test**: escribir una red alrededor de una
  interpretación que la spec no contiene es exactamente lo que devolví en la
  segunda vuelta por el otro lado. Yerra hacia el lado seguro de CA-12
  (`rn02 = false` en los tres desenlaces). Va abajo, para el humano.

### F-SPEC-002-20 — CERRADO en la tercera vuelta, los cuatro puntos

Lo levanté en la segunda vuelta al auditar fichero por fichero. Está atendido, y
**tres de los cuatro los he medido por mutación sobre la copia aislada**; el
cuarto es un guardián que ninguna mutación de producción puede medir, y se
declara así en vez de contarlo como probado:

| Punto | Cómo lo mido | Resultado |
|---|---|---|
| (a) `no-extractor.test.ts` sin `toHaveLength` | no medible: guardián contra `[]` | lleva ya `toHaveLength(10)` delante del `every`. Declarado, no medido |
| (b) `rn02.test.ts` caso 4 relacional | `weakMirror: lockstep` → `false` en `verdictBetweenCandidates` | **1 fallo, y es exactamente el caso 4** de las 145. Con la forma relacional anterior, invisible |
| (c) `archive.test.ts` digest sacado de su propio sujeto | `rawKey`: `slice(0, 12)` → `slice(2, 14)` | **caso 5 rojo**. Con `key.split('-').pop()`, invisible: las dos mitades salían del mismo `rawKey` mutado |
| (d) la frontera de τ nunca de punta a punta | `classifyLead`: `>` → `>=` | **3 fallos** en `lead.test.ts` —unitarios 3 y 6 **y el 13**, el de punta a punta—. En la 2.ª vuelta solo caían los dos unitarios |

Ninguno se ha vuelto tautológico en la otra dirección: (b) y (d) fijan cadenas y
números concretos (`'ESPEJO'`, `'INDEPENDIENTE'`, `leads_b` 0 vs 2,
`observed_differences_ms` con el gap real), no relaciones entre campos del mismo
objeto; (c) deriva el digest del cuerpo y fija además la extensión.

*Texto original de la segunda vuelta, conservado:*

- `tests/mirror/capture/no-extractor.test.ts:71` — `ticks.every(t => t.outcome
  === 'failed')` sin `toHaveLength(10)` al lado, y `[].every()` es `true`: si
  ese camino llegase a producir cero ticks, el caso pasaría vacío. Su hermano,
  el caso 1, sí lleva el guardián.
- `tests/mirror/analysis/rn02.test.ts:68-73` (caso 4) — compara dos campos del
  **mismo** objeto (`bandera === (verdict === 'INDEPENDIENTE')`), así que pasa
  con cualquier veredicto; no fija que `lockstepPlan()` no sea INDEPENDIENTE ni
  que `bothIndependentPlan()` lo sea. Lo sostienen los casos 1-3.
- `tests/mirror/capture/archive.test.ts:171` — la mitad del digest de la clave
  esperada se extrae de la propia clave bajo prueba; lo que ata el formato es la
  línea 170 (`toBe(rawKey(meta, body))`).
- **La frontera de τ no se ejerce nunca de punta a punta.** `lead.test.ts`
  cubre 89 / 90 / 91 s en los dos sentidos, pero solo a nivel de `classifyLead`:
  todos los adelantos de los fixtures distan minutos, así que un cambio de `>` a
  `>=` dentro de `analyze()` solo lo caza ese fichero unitario.

**Destino:** `sdd-implementador`, junto con el fixture de F-SPEC-002-V5. Sin
prisa y sin riesgo de veredicto. *(Hecho: commit `2a407fe`.)*

### Lo que necesita decisión del humano

- **F-SPEC-002-1 (la única ⚠️, en CA-2).** La UA que sale por el cable es
  `marcador.gal/0.0.1 (+https://github.com/tremen-dev/marcador.gal; medicion
  SPEC-002, RN-11)` — lo vi en el servidor. La **forma** está probada; el
  **valor** no responde y el dominio no está contratado. RN-11 pide
  identificación de verdad: hay que ponerla **antes de la ventana real**, no
  antes del merge. Es la salvedad conocida y aceptada, y por eso CA-2 queda ⚠️ y
  no ✅.
- **F-SPEC-002-17 — el mínimo de Node.** `node-resolve.ts` usa
  `module.registerHooks()`, añadida en **22.15.0**, y `package.json` promete
  `>= 22`. Hoy no muerde (aquí, Node 26.4.0), pero en 22.0–22.14 los dos CLI
  fallarían por falta de la API. Subir `engines` es decisión suya o de
  `sdd-arquitecto` por ADR; no la toma el verificador.
- **F-SPEC-002-15 — `sdd-legal-datos` sigue sin dictaminar.** La spec lo lista
  como consultivo y la ventana es scraping de tres sitios a la vez. No bloquea
  el merge; sí debería preceder a la ventana real.
- **F-SPEC-002-21 — el adelanto en una sola dirección, en el par, entra como
  señal FUERTE de espejo.** Consecuencia que nadie ha firmado: una ventana con
  adelantos en una sola dirección **y** una discrepancia persistente (15.3, que
  dicta INDEPENDIENTE) cae en el paso 2 y sale INCONCLUSO, ni ESPEJO ni
  INDEPENDIENTE. No bloquea —los tres desenlaces dan `rn02 = false`— y no lo
  cuento en contra de ningún CA. **Destino:** `sdd-arquitecto`, para una
  eventual enmienda 2, junto con **F-SPEC-002-16** y **F-SPEC-002-19**.

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-002/. Informe HTML opcional: _qa/SPEC-002/informe.html -->

No aplica: SPEC-002 no tiene interfaz. Todo lo verificable es archivo, JSON y
documento generado.

## Salvedades / follow-ups

Las cuatro primeras son **contradicciones reales del texto de la spec**,
resueltas por interpretación razonada y declaradas aquí, no resueltas en
silencio. Necesitan una firma del gate o una enmienda de `sdd-arquitecto`.
*(Las siete —F-4 a F-10— quedaron cerradas el 2026-08-31: enmienda 1 de
`sdd-arquitecto` en el cuerpo de la spec, ratificada entera por el gate en el
bloque final de este ledger.)*

- **F-SPEC-002-4 — «error replicado» necesitaba definición operativa, y la
  literal vacía el criterio.** CA-10.1 dice: «F reporta para `m` un valor `v` y
  después lo sustituye por `v'`; S reporta también `v` y después `v'`». Leído a
  la letra, **cada gol** es un valor sustituido por otro, y cada gol lo reportan
  todas las fuentes: cualquier par saldría ESPEJO por el camino fuerte. Lo que
  el *Diseño §2* y `dominio.md` nombran es otra cosa —«un error **transitorio**
  … el mismo marcador equivocado y la misma corrección»—, así que lo
  implementado es la **retractación**: un cambio que va hacia atrás (marcador
  que baja, que es justo lo que RN-04 prohíbe sin fuente oficial o humano, o
  estado que regresa). `isRetraction` en `src/mirror/analysis/compare.ts`, con
  test propio. **Destino:** ratificación del gate o enmienda de CA-10.1.
- **F-SPEC-002-5 — CA-10 (segunda cláusula de ESPEJO) contradice a CA-9 (c).**
  CA-10 dicta ESPEJO «si hay 0 exclusivos de S con N ≥ N_min y **0 adelantos**».
  CA-9 (c) exige que «S siempre 5 min por detrás de F, sin error replicado» dé
  **INCONCLUSO y no ESPEJO**, y lo llama «el corazón del criterio». Una fuente 5
  minutos por detrás tiene 0 exclusivos, N alto y 0 adelantos **suyos**: las dos
  reglas dan resultados opuestos sobre el mismo dato. Resuelto leyendo «0
  adelantos» como **ningún adelanto en ninguna de las dos direcciones** (todo
  evento comparable, empate). Con esa lectura las dos son verdad a la vez: la
  fuente meramente lenta acumula retrasos y la cláusula no dispara, y el espejo
  que va sincronizado sí. **Destino:** ratificación del gate.
- **F-SPEC-002-6 — el «si y solo si» de CA-9 choca con CA-10.2.** CA-9 dice que
  se dicta INDEPENDIENTE «**si y solo si** S adelanta…»; CA-10.2 dice que se
  dicta INDEPENDIENTE «si hay ≥ 1 discrepancia persistente». Implementado como
  **O lógico**, entendiendo que el «si y solo si» de CA-9 acota la señal
  *temporal* y no el veredicto entero —que es lo que dice la tabla del *Diseño
  §2*, donde las dos filas prueban INDEPENDIENTE—. **Destino:** ratificación.
- **F-SPEC-002-7 — la cláusula débil de ESPEJO tenía que quedar cerrada en una
  ventana en reposo.** En el día 2 no hay cambios de valor: todos los eventos
  son el estado inicial, todo sale empate y no hay exclusivos, así que la
  cláusula «0 exclusivos + N ≥ N_min + 0 adelantos» dispararía **siempre** y el
  día 2 dictaría ESPEJO. El *Diseño §4* dice lo contrario con todas las letras:
  «si no las encuentra → INCONCLUSO». Implementado exigiendo que la **mitad
  temporal esté `completa`** —al menos un cambio de valor que vieran las dos
  fuentes— para que esa cláusula pueda disparar. Test: `report.test.ts` caso 9.
  **Destino:** ratificación.
- **F-SPEC-002-8 — dos señales fuertes contradictorias.** La spec no dice qué
  hacer si aparecen a la vez un adelanto probado y un error replicado (un espejo
  no puede adelantar, así que una de las dos está mal y no sabemos cuál).
  Implementado como **INCONCLUSO con motivo `senales_contradictorias`**, que por
  CA-12 es el lado seguro. Una señal *débil* (la cláusula de F-SPEC-002-5) no
  contradice: cede ante una fuerte. **Destino:** spec del motor / ratificación.
- **F-SPEC-002-9 — `team_spelling` como hecho de discrepancia persistente es
  peligroso, y es el único follow-up que pido mirar antes de la ventana.**
  CA-10.2 lista «grafía del equipo» entre los hechos cuya discrepancia
  persistente dicta **INDEPENDIENTE**. Está implementado como pide la spec (con
  la normalización tacaña de `normalizeAlias`, RN-09). El problema: dos sitios
  distintos escriben los nombres distinto **casi siempre** —cada agregador tiene
  su propia base de equipos, aunque copie los marcadores—, así que esta señal
  disparará para cualquier par real y dictará INDEPENDIENTE de todo contra todo.
  Eso es exactamente la dirección peligrosa del §Problema: confianza falsa. Mi
  recomendación es degradarla a **indicio** que se registra y no dicta, dejando
  el veredicto a las otras tres. No lo he hecho porque contradice el texto de la
  spec. **Destino:** enmienda de `sdd-arquitecto` antes de la ventana real.
- **F-SPEC-002-10 — «la fase B se niega» está implementado como excepción.**
  CA-5 dice que sobre una ventana inválida la fase B «se niega a dictar
  veredicto»; se ha implementado como `InvalidWindowError` (no se produce
  informe en absoluto), por contraste deliberado con CA-11, donde la muestra
  corta **sí** es un veredicto. Si el gate prefiere un informe con veredictos
  INCONCLUSO y la ventana marcada inválida, es un cambio de tres líneas.
- **F-SPEC-002-1 — CERRADA del todo el 2026-08-31.** El contacto es
  `mailto:ola@tremen.dev` (commit `82eaeb7`, CA-2 verificado ✅ midiendo la
  cabecera que recibe un servidor real), y **el gate confirma que lee ese
  buzón** — la única mitad que ningún test podía comprobar. RN-11 queda cumplida
  en su cláusula de identificación. *Texto original, para el registro:*
- **F-SPEC-002-1 — el contacto de la User-Agent es un marcador de posición.**
  `src/mirror/user-agent.ts` emite
  `marcador.gal/0.0.1 (+https://github.com/tremen-dev/marcador.gal; medicion SPEC-002, RN-11)`.
  La **forma** está probada (identificable + contacto). El **valor** no: el
  dominio no está contratado y esa URL de repositorio es una suposición. RN-11
  pide un user-agent identificado de verdad: alguien tiene que poner ahí un
  contacto que responda antes de la ventana real.
- **F-SPEC-002-2 — robots.txt no se pide dentro del bucle de ticks.** Lo carga
  el operador antes de la ventana (`robots_files` del fichero de configuración,
  rutas a los `robots.txt` guardados). Motivo: una petición de robots dentro del
  bucle es una petición que el presupuesto de RN-11 no contabiliza, y la
  política de un sitio no cambia en una hora. Consecuencia: **obtener los
  robots.txt es trabajo del operador**, y un host sin política cargada se omite
  (no se presume permiso).
- **F-SPEC-002-3 — los selectores del extractor son datos, no código.** Las tres
  páginas reales no se han visto y no se pueden ver antes de la ventana;
  inventar selectores sería ficción con un test alrededor. Lo implementado es la
  maquinaria (`tableExtractor`, probada), y la calibración por fuente se carga
  de un fichero JSON validado (`ExtractorCalibrationSchema`). Una fuente sin
  calibrar **falla por su nombre** (`UncalibratedSourceError`) en vez de extraer
  cero partidos en silencio. Es exactamente lo que compra el diseño de dos
  fases: calibrar **después** de la ventana, contra el archivo, cuantas veces
  haga falta.
- **F-SPEC-002-11 — el kickoff se normaliza solo a `HH:MM`.** Sin fecha: dos
  fuentes que discrepen únicamente en el **día** del partido no se detectan como
  discrepancia de horario. Se puede ampliar sin volver a capturar.
- **F-SPEC-002-12 — no hay documento de hallazgo todavía.** `hallazgos/` no
  existe porque no ha habido ventana, y escribir un informe con datos inventados
  sería lo peor que podría hacer esta spec. El generador está probado y el CLI
  lo escribe: `npm run mirror:analizar`.
- **F-SPEC-002-13 — CERRADO el 2026-08-31, y no era mío.** Lo daba por abierto
  porque el implementador de la primera vuelta trabajaba con contexto aislado y
  no vio los commits. Comprobado hoy contra el árbol: la coletilla está en
  `docs/roadmap.md:50` y en `_epica.md:39` (commit `da9c6dc`), y *espejo*,
  *independiente* e *inconcluso* están en `dominio.md` (commit `c8b6cfc`). Nada
  pendiente. Yo no he tocado ninguno de los tres.
- **F-SPEC-002-14 — falta la entrada de runbook de los dos comandos.** El
  procedimiento de la ventana (qué fichero de configuración, cómo se guarda el
  `robots.txt`, cómo se escribe el emparejamiento) está en los comentarios de
  cabecera de `src/mirror/capture/config.ts` y de los dos CLI, y resumido abajo
  en el handoff, pero no en `docs/`. Destino: `sdd-documentalista`.
- **F-SPEC-002-15 — `sdd-legal-datos` no ha dictaminado.** La spec lo lista como
  consultivo (ToS de ceroacero y de resultados-futbol.com, RN-11 sobre tres
  sitios a la vez). El código respeta robots.txt, identifica la UA y no baja de
  1 petición/minuto por par, pero el dictamen de ToS no está pedido.

- **F-SPEC-002-16 — CA-5 invalida la ventana entera cuando falla un solo par.**
  Levantado por el gate (Alberto Fojo) el 2026-08-31 al ratificar
  **F-SPEC-002-10**, y explícitamente **fuera** de esa ratificación: es texto de
  CA-5 ya aprobado el 2026-08-31, no lo trae la enmienda 1. El análisis es **por
  par** contra futgal, así que una caída de ceroacero contamina el par
  (ceroacero, futgal) y deja limpio el par (resultados-futbol, futgal). CA-5, en
  cambio, marca `invalida` la ventana **completa** en cuanto cualquiera de los
  seis pares baja del 90 % de ticks exitosos, y por F-SPEC-002-10 eso significa
  que no se escribe informe **de nada**. Consecuencia: una caída de red en un
  sitio cuesta el dato de los otros dos y obliga a repetir la hora entera.
  **No se cambia ahora**, a propósito: el corte total es el conservador y nadie
  ha corrido todavía una ventana real, así que no hay cifra de cuántas veces
  muerde. **Destino:** enmienda 2 de `sdd-arquitecto` si la primera ventana real
  se cae por un solo sitio. Lo que habría que decidir entonces es si la validez
  pasa a ser **por par** —informe con veredicto solo para los pares sanos y los
  excluidos nombrados— o sigue siendo por ventana.

Las tres siguientes son de la **segunda vuelta** (corrección del RED del
2026-08-31). Ninguna bloquea la ventana; las tres se declaran para no resolverlas
en silencio.

- **F-SPEC-002-17 — el hook de resolución exige Node ≥ 22.15, y `engines` dice
  `>= 22`.** `src/mirror/cli/node-resolve.ts` usa `module.registerHooks()`, que
  es la variante **síncrona** y en el mismo hilo, añadida en Node **22.15.0**. En
  este equipo corre Node 26 y en Vercel el runtime es 22.x reciente, así que hoy
  no muerde; pero `package.json` promete `>= 22` a secas y en 22.0–22.14 los dos
  CLI fallarían por falta de la API, no por el alias. **No he tocado `engines`**:
  subir el mínimo del proyecto entero es decisión suya, no efecto colateral de un
  fix de SPEC-002. **Destino:** el humano, o `sdd-arquitecto` si prefiere fijarlo
  por ADR.
- **F-SPEC-002-18 — `src/raw/` y `src/model/` no son ejecutables por Node por sí
  solos.** No es cosa nueva ni de esta spec: sus imports relativos van **sin
  extensión** (`from './store'`, `from './ids'`) y ESM no resuelve extensiones.
  `src/db/cli.ts` funciona por casualidad —su grafo no llega a ninguno de los
  dos—. Por eso el fix de F-SPEC-002-V4 es un hook y no rutas relativas: la
  alternativa era editar `src/model/team.ts`, que el encargo prohíbe y que la
  spec pide reutilizar «tal cual». El hook lo cubre para los dos CLI de SPEC-002
  y **para nadie más**: el primer CLI de otra spec que importe `src/raw/`
  tropezará igual. **Destino:** quien escriba las specs de adaptadores; el
  arreglo de verdad es una línea por fichero en `src/raw/` y `src/model/`, y es
  reabrir SPEC-001.
- **F-SPEC-002-19 — la divergencia de grafía se mide con la vara de CA-10.2, y
  CA-10.4 no declara umbral.** CA-10.4 dice «F y S escriben distinto el nombre de
  un equipo del mismo partido … se cuenta». Leído a la letra, cualquier
  divergencia en cualquier captura contaría. Lo implementado exige la **misma
  persistencia** que la señal de la que salió —`MIN_PERSISTENT_CAPTURES = 3`
  rondas de ambas fuentes—, que es lo que ya calculaba el código verificado en
  CA-14 y lo que el propio CA nombra en su test («grafías distintas y
  persistentes en 3 capturas»). Consecuencia declarada: una divergencia que
  aparece en 1 o 2 capturas y converge **no se cuenta**, así que el contador es
  un suelo y no un censo de alias. Como la señal no vota, el riesgo es de
  subregistro y no de veredicto; pero si el catálogo de alias de RN-09 va a
  alimentarse de aquí (que es una de las dos razones por las que la spec la
  conserva), conviene decidirlo. **Destino:** `sdd-arquitecto`, sin prisa.

Las dos siguientes son de la **tercera vuelta** (cierre del RED del 2026-08-31,
F-SPEC-002-V5).

- **F-SPEC-002-20 — ATENDIDA en la tercera vuelta, los cuatro puntos.** Commit
  `2a407fe`, sin tocar código de producción y sin arriesgar el rojo principal.
  **(a)** `no-extractor.test.ts:71` lleva ya `toHaveLength(10)` delante del
  `every`. **(b)** `rn02.test.ts` caso 4 fija los veredictos primero, sobre tres
  ventanas, y de paso deja asertado el hueco de CA-15 (las dos candidatas,
  independientes de futgal y espejos entre sí). **(c)** `archive.test.ts:171`
  calcula el digest desde el cuerpo con `createHash`, no desde la clave bajo
  prueba. **(d)** la frontera de τ se ejerce de punta a punta (`lead.test.ts`
  13-14) y muerde: la mutación `>` → `>=` la pone roja, cosa que antes solo
  hacían los casos unitarios. **Lo que queda dicho y no hecho:** (a) y (c) son
  guardianes —no fabrican un rojo nuevo por sí solos, cierran un camino por el
  que el caso podría pasar en vacío— y así se declaran; la única mutación que
  los mediría sería romper el propio helper de test, así que no se ha hecho.
- **F-SPEC-002-21 — en el par, el adelanto en una sola dirección entra como
  señal FUERTE de espejo, y la regla de decisión de CA-10 no dice eso.** Lo veo
  al escribir el caso (g) de `pair.test.ts` y **no lo toco**: es código de la
  primera vuelta, y cambiarlo sería tocar producción sin ningún CA que lo pida.
  El hecho: `verdictBetweenCandidates` calcula
  `strongMirror = replicated_errors.length > 0 || oneWay`, mientras que la regla
  de decisión de CA-10 define *fuerte-espejo* como «≥ 1 error replicado (10.1)»
  y nada más. Es una lectura defendible de CA-15.1 —«la rezagada se trata como
  espejo de la otra»— pero tiene una consecuencia que nadie ha firmado: una
  ventana con adelantos en **una sola** dirección **y** una discrepancia
  persistente (15.3, que dicta INDEPENDIENTE) cae en el paso 2 y sale
  **INCONCLUSO por señales contradictorias**, ni ESPEJO ni INDEPENDIENTE. No hay
  ningún test que fije ese caso, y no lo he escrito **a propósito**: atar con un
  test una interpretación que la spec no contiene es exactamente lo que la
  segunda vuelta reprochó. Yerra hacia el lado seguro de CA-12 —`rn02 = false`
  en los tres desenlaces posibles—, así que no bloquea nada. **Destino:**
  `sdd-arquitecto`, para una eventual enmienda 2, junto con F-SPEC-002-16.


- **F-SPEC-002-22 — el capturador sigue redirecciones y comprueba robots.txt
  sobre la URL pedida, no sobre la final.** Levantado por `sdd-legal-datos` el
  2026-08-31. `globalFetcher` (`src/mirror/capture/http.ts`) llama a
  `globalThis.fetch` sin `redirect: 'manual'`, así que sigue un 3xx en silencio;
  `capturer.#capture` consulta `this.#robots.isAllowed(target.url)` **antes** de
  pedir, sobre la URL de destino declarada. Si un objetivo redirige a otro origen
  —y hoy pasa: `resultados-futbol.com` hace 301 entero a `besoccer.es`—
  pedimos permiso a un robots.txt y descargamos de otro host, archivando su HTML
  bajo el `SourceId` equivocado. **Incumple RN-11 sin que ningún test se ponga
  rojo**, y mete en el archivo una fuente mal etiquetada, que es la clase de
  contaminación que esta spec existe para evitar. Arreglo previsible: `redirect:
  'manual'`, y tratar un 3xx como tick fallido con motivo, o revalidar robots
  sobre la URL final antes de archivar. **Destino:** `sdd-arquitecto` — toca CA-2
  y CA-3, así que es enmienda, no fix.

## Dictamen de `sdd-legal-datos` — 2026-08-31 (cierra F-SPEC-002-15)

Consulta encargada por el gate al cerrar la spec. **Fecha de consulta de todas
las fuentes en línea: 2026-08-31.** Advisory: aquí no se implementa nada.

### Veredicto en una línea

**INCORRECTO para futgal.es. CORRECTO, con condiciones, para ceroacero.es.
DUDOSO para la fuente que la spec llama resultados-futbol.com, que ya no
existe.** La ventana **no se puede correr como está configurada**, y el motivo no
es legal fino: es RN-11, regla dura del proyecto.

### 1. futgal.es prohíbe el rastreo a todo el mundo menos a tres bots

`https://www.futgal.es/robots.txt` (HTTP 200, `Last-Modified: Fri, 27 Mar 2026`),
literal:

```
User-agent: Twitterbot
Disallow:

User-agent: Mediapartners-Google
Disallow:

User-agent: AmazonAdBot

Allow: /

User-agent: *
Disallow: /
```

Nuestro user-agent cae en `*`. **`Disallow: /` es todo el sitio.** RN-11 obliga a
respetar robots.txt y el no-negociable de `FOUNDATION.md` lo repite para el
spike, así que esto no admite ponderación: **capturar futgal.es hoy incumple una
regla dura propia**, antes que cualquier consideración de ToS o de derecho de
bases de datos.

**El código hace lo correcto y por eso duele.** `robotsRegistry` resuelve por
origen y `capturer.#capture` consulta `isAllowed` antes de pedir nada, así que
los seis ticks por minuto de futgal saldrían **todos** como `skipped`. Con
cobertura 0 % en dos pares, **CA-5 declara la ventana inválida y la fase B se
niega a escribir informe**. El sistema se protege solo; lo que no puede es
inventar permiso.

**Consecuencia de diseño, y es de producto, no mía:** futgal es la **referencia**
contra la que se miden las dos candidatas. Sin referencia no hay test de espejo,
y sin test de espejo no se sabe si RN-02 tiene segunda vía. Caminos posibles, por
orden de limpieza: **(a)** autorización escrita de la RFGF —que es de todos modos
el objetivo estratégico declarado en `retos.md`, y una autorización entre partes
sí desplaza al robots.txt—; **(b)** otra superficie oficial cuyo robots lo
permita; **(c)** rediseñar el test con otra referencia, lo que cambia lo que mide.
El roadmap dice que la conversación con la RFGF «solo tiene sentido con el informe
en la mano», y el informe necesita a la RFGF: **ese círculo hay que romperlo por
decisión de producto**, no de ingeniería. Destino: `sdd-producto`, y
probablemente un ADR que supersede la lista de fuentes de ADR-002.

### 2. resultados-futbol.com ya no existe: es besoccer.es

`https://www.resultados-futbol.com/robots.txt` → **HTTP 301** (`Location:
https://www.besoccer.es/robots.txt?redirected=rf`, `server: Varnish`). La raíz
del dominio hace lo mismo. **El dominio entero está redirigido**; ADR-002 ya
anotaba «resultados-futbol.com (BeSoccer)», pero hoy no es una marca de BeSoccer:
es un 301.

Operador real, de su propia página legal: **BESOCCER SOLUTIONS S.L.**, CIF
B-93693042, Calle Jesús Arambarri 1, 29004 Málaga.

**Riesgo técnico que esto crea, y que ningún test detecta.** `globalFetcher` usa
`globalThis.fetch` sin `redirect: 'manual'`, o sea que **sigue el 301 en
silencio**. La comprobación de robots se hace sobre la URL **pedida**
(`isAllowed(target.url)`), no sobre la final. Resultado: pediríamos permiso al
robots.txt de un origen y descargaríamos de **otro**, archivando HTML de
besoccer.es bajo el `SourceId` `resultados-futbol`. Eso es **incumplir RN-11 sin
que nada se ponga rojo**, y además contamina el archivo con una fuente mal
etiquetada — precisamente lo que el §Problema de esta spec llama confianza falsa.
Levanto **F-SPEC-002-22** por ello.

`https://www.besoccer.es/robots.txt`: `User-agent: *` con `Allow: /` y solo
`/scripts*` y `/ajax*` prohibidos; bloquea por nombre a `Fetch`, `ia_archiver`,
`MSIECrawler`, `WebStripper` y `WebZIP`. **Nuestro UA no está bloqueado.** El
robots, por sí solo, permite.

**Pero su página legal no.** `https://www.besoccer.es/legal`, literal: «El
contenido dispuesto en el sitio web no podrá ser reproducido ni en todo ni en
parte, ni transmitido, **ni registrado por ningún sistema de recuperación de
información**, en ninguna forma ni en ningún medio, a menos que se cuente con la
autorización previa, por escrito, de BESOCCER SOLUTIONS.» Guardar la respuesta
cruda en el raw store **es** registrarla en un sistema de recuperación de
información. Es decir: **RN-10 choca de frente con esta cláusula**, y es la
respuesta a la pregunta (4) del encargo — sí, el archivo crudo cambia las cosas,
y cambia solo aquí.

Matiz que no es coartada: son condiciones *browse-wrap* (no hay clic de
aceptación ni registro), y su oponibilidad a quien no las acepta está discutida.
No me apoyo en eso para dar un correcto: lo dejo como **dudoso** y marcado para
**revisión profesional**.

### 3. ceroacero.es: robots permisivo, y la afirmación de ADR-002 no la he podido verificar

`https://www.ceroacero.es/robots.txt` (HTTP 200, Cloudflare) prohíbe **una sola
ruta**: `Disallow: /zzmap_v3.php`. Todo lo demás está permitido para `*`. Las
páginas de competición que la ventana necesita **no están prohibidas**.

Operador: **ZOS, Lda.**, Rua 28 de Janeiro 350 T17, 4400-335 Vila Nova de Gaia
(Portugal), NIF 508 565 804.

**Aviso sobre un documento de verdad.** ADR-002 afirma: «Las ToS de ceroacero
restringen el scraping». **He buscado esa página y no la he encontrado.** El pie
del sitio ofrece `quemsomos.php`, `helpdesk.php`, `pub.php`, `privacidade.php`,
`enviar_sugest.php` y `rss.php`; `privacidade.php` es política de privacidad
(RGPD) y **no contiene ninguna cláusula sobre acceso automatizado, robots,
scraping ni reutilización de la base de datos**. No digo que la afirmación de
ADR-002 sea falsa —ausencia de prueba no es prueba de ausencia, y pudo haber
una ToS que ya no está—: digo que **hoy no tiene fuente**, y un ADR aprobado
sostiene con ella una parte de su razonamiento. Los ADR son inmutables, así que
esto no se corrige editándolo: se anota aquí y, si importa, se supersede.

### 4. Derecho *sui generis*: la inversión que casi nadie espera

Directiva 96/9/CE art. 7; en España, LPI arts. 133-137. Protege contra la
extracción/reutilización de una parte sustancial, **y también** contra la
extracción «repetida y sistemática» de partes no sustanciales que entre en
conflicto con la explotación normal (art. 7.5).

La jurisprudencia que gobierna este caso es del mismo deporte: **TJUE,
*Fixtures Marketing* (C-46/02, C-338/02, C-444/02) y *British Horseracing Board
v. William Hill* (C-203/02), todas de 9 de noviembre de 2004.** Doctrina: los
recursos empleados en **crear** los datos no cuentan para la «inversión
sustancial»; solo cuentan los de **obtenerlos, verificarlos y presentarlos**. El
calendario y los resultados que genera el propio organizador de la competición
**no** fundan un derecho *sui generis*.

**La consecuencia se lee al revés de lo que uno esperaría, y conviene que el
proyecto la interiorice:** la **RFGF/futgal**, que *crea* el dato, es la que
probablemente **no** tiene derecho *sui generis* sobre él; **ceroacero y
BeSoccer**, que lo *obtienen y verifican* de terceros, son quienes plausiblemente
**sí** lo tienen. O sea: la fuente que legalmente es más segura de reutilizar es
justo la que nos cierra la puerta por robots.txt, y las que la abren son las que
tienen el derecho más fuerte. No es una paradoja: es que robots.txt y el derecho
de bases de datos protegen cosas distintas.

Sobre el volumen: una ventana de una hora, dos competiciones, 8-16 partidos, 60
capturas por par, es **cuantitativamente insustancial** y difícilmente entra en
conflicto con la explotación normal de nadie. **En producción, un sondeo continuo
sobre muchas competiciones es exactamente el art. 7.5** y ahí no hay lectura
benigna: se licencia o se acuerda. Es lo que ya dice el no-negociable de
`FOUNDATION.md`, y este dictamen lo confirma en vez de ampliarlo.

**Excepción de minería de datos (TDM).** Directiva (UE) 2019/790 art. 4,
transpuesta por el RDL 24/2021. Permite reproducciones para minería de obras
lícitamente accesibles **salvo reserva expresa del titular «de manera adecuada,
como medios de lectura mecánica» para contenidos en línea**. Aplicado a cada
fuente: ceroacero **no reserva** (robots permisivo) → la excepción ampara la
medición; **futgal reserva de la forma más legible por máquina que existe**
(`Disallow: /`) → la excepción **no** está disponible; besoccer no reserva por
robots pero sí por texto legal, que no es lectura mecánica → **discutido**. El
art. 4 exige además conservar las copias **solo mientras sean necesarias para la
minería**, lo que conecta con el punto siguiente.

### 5. Datos personales, y una deuda de SPEC-001 que se vuelve legal

Las páginas de competición que la fase A archiva contienen, según el sitio,
**nombres de jugadores, árbitros y entrenadores**: datos personales de personas
identificables. No he inspeccionado el HTML real de las tres páginas —no se ha
corrido ninguna ventana— así que esto es una **advertencia condicionada**: si esos
nombres aparecen, entran al raw store.

Y el raw store **no tiene política de retención**: ADR-005 la deja explícitamente
abierta («no está definida») y **F-SPEC-001-1** sigue viva por eso. Mientras fue
higiene, era deuda técnica. Con datos personales dentro, es **minimización y
plazo de conservación del RGPD (art. 5.1.c y 5.1.e)**, y además es lo que el art.
4 TDM exige para no perder la excepción. Base legal defendible para la medición:
interés legítimo (art. 6.1.f). **La retención indefinida no es defendible.**
Recomendación: fijar plazo antes de la ventana, aunque sea uno corto y groseramente
conservador; es más barato que discutirlo después con datos dentro.

### Nivel de riesgo y revisión profesional

| Fuente | robots.txt | ToS | *Sui generis* | Dictamen |
|---|---|---|---|---|
| futgal.es | **prohíbe todo** | no consultadas | improbable (*Fixtures*) | **INCORRECTO — no capturar** |
| ceroacero.es | permite | no encontradas | plausible | **CORRECTO** para la ventana acotada |
| besoccer.es | permite | prohíben registrar | plausible | **DUDOSO** — revisión profesional |

**Requieren revisión profesional antes de exponerse:** la cláusula de BeSoccer
contra RN-10, y cualquier acuerdo con la RFGF. No soy abogado y el proyecto no
tiene uno.

**Invariantes afectados:** RN-10, RN-11, el no-negociable de legalidad de la
obtención del dato (`FOUNDATION.md`), ADR-002 (lista de fuentes y afirmación
sobre las ToS de ceroacero), ADR-005 (retención), F-SPEC-001-1.

**Specs a revisar:** SPEC-002 (configuración de la ventana) y la spec del motor,
que hereda la lista de fuentes y sus pesos.


- **F-SPEC-002-23 — `parseRobots` trata el `*` de una ruta como carácter
  literal, no como comodín, y por eso **incumple un `Disallow` real**.**
  Levantado por el gate el 2026-08-31 al preparar la ventana, ejecutando el
  parser del proyecto contra los `robots.txt` reales. `besoccer.es` publica
  `Disallow: /scripts*` y `Disallow: /ajax*`; nuestro `isAllowed()` devuelve
  **`true`** para `https://www.besoccer.es/scripts/x.js` y para
  `https://www.besoccer.es/ajax/algo`. Causa exacta: el emparejamiento es
  `path.startsWith(rule.path)` (`src/mirror/capture/robots.ts`), y la ruta
  `/scripts/x.js` no empieza por la cadena literal `/scripts*`, así que la regla
  **no casa** y gana el `Allow: /` del mismo grupo. El comodín `*` y el ancla `$`
  son parte del estándar de facto (RFC 9309) y `Disallow: /foo*` es un idioma
  común.
  **No muerde en la ventana de SPEC-003**: los objetivos son páginas HTML de
  competición, y las dos rutas afectadas quedan fuera. **Sí muerde en EPIC-002**,
  y de la peor manera: los marcadores en vivo de los agregadores suelen venir de
  endpoints `/ajax…`, que es exactamente lo que besoccer prohíbe y lo que
  nuestro parser deja pasar. Un adaptador de EPIC-002 que los use **incumpliría
  RN-11 sin que ningún test se pusiera rojo**.
  Nota adicional: el acumulado de varios grupos `User-agent: *` **sí** funciona
  —las reglas se suman por agente—, así que el fallo es solo el comodín.
  **Destino:** `sdd-arquitecto`, como CA de la primera spec de adaptador de
  EPIC-002. No se arregla aquí: SPEC-002 está `hecho` y mergeada, y esto es
  código con contrato verificado.

## Cómo retomar (handoff)

**Qué hay.** Todo bajo `src/mirror/`, dos fases que no se importan la una a la
otra:

```
src/mirror/thresholds.ts        τ, N_min, mínimos de adelanto, capturas de persistencia
src/mirror/instants.ts          ISO 8601 UTC como cadena; `Date` solo como convertidor
src/mirror/ids.ts               constructores de SourceId / CompetitionId / MatchId
src/mirror/user-agent.ts        la UA declarada y el patrón que la valida
src/mirror/window.ts            registro de ticks, cobertura por par, validez (CA-5)
src/mirror/capture/             FASE A — ports, http, robots, config, capturer
src/mirror/analysis/            FASE B — extract, sources, pairing, timeline, compare,
                                verdict, report, prose, findings, analyze
src/mirror/cli/                 capturar.ts / analizar.ts (+ sus dos entradas -cli.ts
                                y node-resolve.ts, el hook que hace que Node
                                resuelva `@/…` y los imports sin extensión)
tests/mirror/                   145 casos + un fichero .test-d.ts
```

**Los dos CLI arrancan** (F-SPEC-002-V4, commit `22cbe42`). Antes no: `@/…` lo
resuelven vitest y `tsc` por configuración y Node no, que es quien los corre.
`src/mirror/cli/node-resolve.ts` declara el alias en el tercer sitio donde tenía
que existir; los dos `-cli.ts` lo registran y **después** importan su `main`
dinámicamente, porque un import estático se enlazaría antes de que el hook
existiese. Lo prueba `tests/mirror/cli/cli.test.ts`, que arranca los dos comandos
como subprocesos: es la única suite del repo que hace HTTP y toca el disco por el
camino del operador.

**Cómo se corre la ventana (fase A).**

1. Guardar el `robots.txt` de los tres sitios en disco (uno por origen).
2. Escribir `config.json` contra `WindowConfigSchema`
   (`src/mirror/capture/config.ts`): etiqueta de ventana, `duration_minutes`,
   `tick_seconds` (20 va bien: el limitador es quien cumple RN-11, no el bucle),
   los seis `targets` y `robots_files`.
3. `npm run mirror:capturar -- config.json ventana.json`. Sin
   `BLOB_READ_WRITE_TOKEN` archiva en `raw/` (ya ignorado por git); con él, en
   Vercel Blob. Escribe el registro de ticks en `ventana.json`. El bucle ya no
   duerme un intervalo entero después del **último** tick: la ventana terminó y
   esperar solo retrasaba el registro que el operador espera.

**Cómo se analiza (fase B), tantas veces como haga falta.**

4. Escribir el emparejamiento a mano contra `PairingSchema`
   (`src/mirror/analysis/pairing.ts`): un `match_id` canónico y la identidad que
   usa cada fuente. Son los 8-16 partidos de la ventana. Si falta uno, la fase B
   **aborta** nombrándolo; no lo adivina.
5. Escribir `calibracion.json` contra `ExtractorCalibrationSchema`: los
   selectores CSS de cada fuente, mirando el HTML **ya archivado** (F-SPEC-002-3).
6. `npm run mirror:analizar -- ventana.json pairing.json calibracion.json "xornada do …"`.
   Escribe `docs/epicas/EPIC-001-spike-ingesta/hallazgos/test-de-espejo.{md,json}`
   y saca los tres veredictos por consola. El cuarto argumento solo se usa si la
   mitad temporal queda `pendiente`.

**Qué cambió en la tercera vuelta.** Solo tests: **cero** líneas de producción
(`git diff --stat 5af5aaf..HEAD -- src/` sale vacío). El séptimo fixture de
CA-10 —el paso 2 de la regla de decisión— vive en `verdict-content.test.ts`,
bloque *«CA-10, regla de decisión paso 2 — señales fuertes contradictorias»*, y
su gemelo del par en `pair.test.ts` caso (g). **Cómo se comprueba que muerden,
si hace falta repetirlo:** borrar la rama `input.independent &&
input.strongMirror` de `decide()` en `src/mirror/analysis/verdict.ts` y correr
`npx vitest run tests/mirror` — tienen que salir 3 fallos en 2 ficheros; antes
del fixture salía la suite entera verde. Restaurar con
`git checkout -- src/mirror/analysis/verdict.ts`.

**Qué falta, en orden.** (Reescrito en la segunda vuelta: F-SPEC-002-4 a -10
están ratificados y **ejecutados**, y F-SPEC-002-13 está cerrado.)

1. Poner un contacto real en la User-Agent (**F-SPEC-002-1**). Es lo único que
   el gate tiene que resolver **antes** de la ventana: RN-11 pide identificación
   de verdad y hoy la UA emite un dominio sin contratar. La **forma** está
   probada; el **valor** no responde. No lo he inventado.
2. Pedir el dictamen de `sdd-legal-datos` (**F-SPEC-002-15**), que la spec lista
   como consultivo y sigue sin pedirse.
3. Correr la ventana. La mitad de contenido no necesita partidos en juego; la
   temporal sí, y el informe sale igual con ella `pendiente`. Con la enmienda
   ejecutada, el resultado por defecto del día 2 es **INCONCLUSO**, que por CA-12
   deja el motor con una sola vía en RN-02: es el coste declarado y asumido.
4. Mirar **F-SPEC-002-17** (mínimo de Node), **F-SPEC-002-19** (umbral de la
   grafía) y **F-SPEC-002-21** (el adelanto en una sola dirección como señal
   fuerte de espejo en el par) cuando toque; ninguno bloquea.
5. `sdd-documentalista`: runbook (**F-SPEC-002-14**).

**Lo que NO se ha tocado, a propósito:** `src/model/`, `src/raw/`, `src/db/`,
`migrations/`, `docs/fundacion/`, `FOUNDATION.md`, los ADR, `_epica.md` y
`roadmap.md`. En la tercera vuelta, tampoco `src/` **entero**. Ni un `migrations/0002`. Tampoco el texto de la spec ni las
columnas *Verif.*/*Estado* de la matriz. SPEC-001 sigue verde y cerrada: sus 270
casos pasan sin un solo cambio en su código, y la razón de que el fix de
F-SPEC-002-V4 sea un hook y no rutas relativas es exactamente esa
(**F-SPEC-002-18**).


## Arbitraje del gate humano — 2026-08-31 (Alberto Fojo)

Ratifica **las siete** interpretaciones que la enmienda 1 del 2026-08-31 lleva al
cuerpo de la spec. **La enmienda queda firmada entera**: a partir de aquí el
texto enmendado es el contrato, y es contra él —y no contra el texto aprobado por
la mañana— contra el que juzga `sdd-verificador`.

Registrado en tres tandas el mismo día, según se fueron desglosando: F-4, -5, -6
y -7; luego F-8 y F-10; luego F-9. El gate levantó además **F-SPEC-002-16** al
firmar el -10.

**Corregido el 2026-08-31, tras la verificación.** Este bloque afirmaba que
«nada de esto toca código». Es cierto para **seis** de los siete: ratifican lo
que `sdd-implementador` ya había implementado. **Para F-SPEC-002-9 es falso**, y
era previsible: el implementador lo dijo con todas las letras —«no lo he hecho
porque contradice el texto de la spec»—, así que ratificar la enmienda que
cambia ese texto es precisamente **encargar** el cambio de código. Lo detectó
`sdd-verificador` (RED del 2026-08-31, findings V1 y V3). El error es de quien
transcribió el arbitraje, no de la decisión: la decisión sigue firme y es la que
el implementador tiene que ejecutar ahora.

El frontmatter `estado` quedó `en-revision` al firmar; `sdd-verificador` lo movió
a `en-progreso` al emitir RED.

- **F-SPEC-002-4 RATIFICADO. «Error replicado» es retractación replicada.** Solo
  cuenta la sustitución que va hacia atrás: marcador que baja (RN-04) o estado
  que regresa. Motivo aceptado: la lectura literal hace de **cada gol** un error
  replicado —y los goles los reportan todas las fuentes—, así que cualquier par
  saldría ESPEJO por el camino fuerte y el criterio quedaría vacío. Se asumen
  los dos límites que CA-10.1 declara: **(a)** un error corregido hacia arriba es
  indistinguible del retardo de refresco con este instrumento y no se detecta;
  **(b)** una retractación real del mundo —un gol anulado que las dos fuentes
  deshacen honestamente— produce un falso ESPEJO. Los dos yerran hacia el lado
  seguro de CA-12, y las cuatro claves raw quedan citadas para que una persona lo
  mire.
- **F-SPEC-002-5 RATIFICADO. «0 adelantos» se lee en las dos direcciones
  (*sincronía*).** Motivo aceptado: leído como «0 adelantos **de S**», CA-10
  contradice frontalmente a CA-9 (c) sobre el mismo dato —una fuente cinco
  minutos por detrás tiene 0 exclusivos, N alto y 0 adelantos suyos—, y CA-9 (c)
  es «el corazón del criterio». Con la lectura bidireccional las dos reglas son
  verdad a la vez: la fuente lenta acumula **retrasos**, la sincronía no se
  cumple y la cláusula débil no dispara. Es además la única lectura bajo la cual
  la cláusula lleva información, porque «nunca es más rápida» es compatible con
  espejo y con independiente-lento (*Diseño §2*).
- **F-SPEC-002-6 RATIFICADO. El «si y solo si» de CA-9 acota la señal temporal,
  no el veredicto.** Los caminos a INDEPENDIENTE son dos —adelantos y
  discrepancia persistente— y no hay más. Motivo aceptado: es lo que la tabla del
  *Diseño §2* ya decía con dos filas, y esa es la sección que gobierna. Restaura
  el diseño, no lo cambia.
- **F-SPEC-002-7 RATIFICADO. La cláusula débil de ESPEJO exige la mitad temporal
  `completa`.** Motivo aceptado: en una ventana en reposo no hay ningún cambio de
  valor, todo sale empate y no hay exclusivos, así que sin este requisito la
  cláusula dispararía **siempre** y el día 2 dictaría ESPEJO de todo contra todo
  —contra el *Diseño §4*, que dice «si no las encuentra → INCONCLUSO»—. Sin al
  menos un cambio de valor que vieran las dos fuentes, «no hay adelantos» es un
  hecho sobre la ventana y no sobre las fuentes.

- **F-SPEC-002-8 RATIFICADO. Dos señales fuertes de signo contrario dan
  INCONCLUSO, y la regla de decisión pasa a ser total y ordenada.** No era una
  contradicción del texto sino un silencio: la spec listaba las señales sueltas y
  no decía qué pasa cuando concurren. Motivo aceptado: un espejo no puede
  adelantar y dos fuentes independientes no se retractan igual, así que cuando
  aparecen las dos **una está mal y no sabemos cuál**; por CA-12 el lado seguro es
  INCONCLUSO. Se ratifica también el **orden** —la contradicción (paso 2) gana
  sobre la independencia (paso 3), aun a costa de perder un INDEPENDIENTE que
  quizá era legítimo— y que un **indicio cede** ante una señal fuerte en vez de
  contradecirla, porque si no «S no aporta nada propio» cancelaría un adelanto
  probado.
  **Interacción declarada con F-SPEC-002-4, asumida por el gate:** el escenario
  realista que dispara el paso 2 no es un espejo que adelanta —eso no existe—
  sino el falso positivo que CA-10.1 ya declara: un gol anulado de verdad que las
  dos fuentes deshacen honestamente. Si cae en una ventana con adelantos, el par
  se va a INCONCLUSO por culpa de ese falso positivo. La red es CA-14: las cuatro
  claves raw quedan citadas y una persona puede abrir las capturas y verlo. **La
  resolución manual de ese caso no está en la spec** y no se añade ahora.
- **F-SPEC-002-10 RATIFICADO. La negativa de CA-5 es una negativa: no se escribe
  fichero.** Motivo aceptado, en dos partes. **(a)** No es asimetría rota con
  CA-11: CA-11 habla del **mundo** —ventana buena, fútbol tranquilo, el hallazgo
  es real y la respuesta es ampliar la ventana— y CA-5 habla del **instrumento**,
  que falló justo en la dirección peligrosa, porque un hueco de captura *fabrica*
  adelantos y los adelantos son lo que se lee como independencia. **(b)** El
  argumento decisivo es sobre el fichero: el consumidor real de
  `hallazgos/test-de-espejo.json` es la spec del motor, que no va a releer este
  ledger para saber si la ventana valía. Un informe bien formado sobre una
  ventana rota es indistinguible en el disco de uno legítimo; su **ausencia** no
  se malinterpreta.
  **Coste asumido:** no hay rescate parcial. El archivo crudo se conserva (RN-10
  se cumplió) pero no es analizable, la spec **no define fusionar dos ventanas**,
  y hay que repetir la hora entera. Ver **F-SPEC-002-16**, levantado al firmar
  esto.

- **F-SPEC-002-9 RATIFICADO. La grafía del equipo deja de dictar veredicto.** Era
  el dictamen que el gate encargó a `sdd-arquitecto` sin dirigir la respuesta, y
  es **la única de las siete que cambia un veredicto**. CA-10.2 baja de cuatro
  hechos a tres y la grafía pasa a **CA-10.4**: se computa, se cuenta en su propia
  clave, se cita con sus claves raw (CA-14) y **no entra en ningún veredicto**.
  Motivo aceptado: toda la fuerza probatoria de 10.2 está en que **un espejo
  converge**, y la grafía es justo el campo donde un espejo **no converge por
  construcción** —un agregador copia el marcador y rinde el nombre desde su propia
  base de equipos—, así que la señal dispara con la misma probabilidad bajo las
  dos hipótesis y **no lleva información**. Dictar con ella daría INDEPENDIENTE de
  todo contra todo, con RN-02 abriendo su segunda vía sobre una independencia no
  demostrada: exactamente la confianza falsa que nombra el §Problema. Pesó también
  que era el único de los cuatro hechos ausente de la tabla del *Diseño §2*, que
  es la sección que gobierna.
  **Coste asumido, dicho entero:** la mitad de contenido pierde una de sus cuatro
  señales y encontrará **menos INDEPENDIENTE el día 2**; el resultado por defecto
  pasa a ser INCONCLUSO, que por CA-12 deja el motor con **una sola vía en
  RN-02**. No rompe el *Diseño §4*, lo restaura: «si no las encuentra →
  INCONCLUSO». La señal se conserva registrada porque es la superficie de
  auditoría del emparejamiento manual de CA-6 y el primer insumo del catálogo de
  alias de RN-09.

**Consecuencia querida y asumida.** Los cuatro empujan en la misma dirección: el
test dicta **INCONCLUSO más veces**. No es pérdida. Por CA-12, INCONCLUSO se
trata como espejo y el motor se diseña con una sola vía en RN-02, que es lo que
hay que hacer mientras no haya prueba. El riesgo que nombra el §Problema es el
contrario —confianza falsa, RN-02 abriendo su segunda vía sobre una
independencia inventada— y estas cuatro lecturas se apartan de él.

**Señalado, sin decisión, para la ventana real:** **τ = 90 s** es la bisagra
entre «espejo acompasado» e «independiente lenta» en la sincronía de
F-SPEC-002-5, y es hipótesis, no verdad. Queda cubierto por CA-8, que obliga al
informe a publicar τ y el reparto de diferencias observadas: un τ mal elegido se
ve en los datos y se recalcula **sin volver a capturar**. Mirarlo con el primer
informe en la mano.

### Estado de la enmienda 1: firmada entera

Los siete follow-ups que motivaron la enmienda (**F-SPEC-002-4, -5, -6, -7, -8,
-9 y -10**) quedan ratificados. No queda ninguna interpretación pendiente de
firma, así que **la spec tiene un texto cerrado contra el que verificar** y
`sdd-verificador` puede entrar.

Lo que la firma **no** cierra, y sigue abierto en *Salvedades / follow-ups*:
**F-SPEC-002-1** (contacto real en la User-Agent, RN-11, antes de la ventana),
**F-SPEC-002-12** (no hay hallazgo porque no ha habido ventana),
**F-SPEC-002-14** (runbook en `docs/`, para `sdd-documentalista`),
**F-SPEC-002-15** (`sdd-legal-datos` no ha dictaminado) y **F-SPEC-002-16**
(granularidad de CA-5, para una eventual enmienda 2). **F-SPEC-002-13** ya estaba
cerrado por los commits `da9c6dc` y `c8b6cfc`, que además metieron *espejo*,
*independiente* e *inconcluso* en `dominio.md` — el trámite que el §7 de las
*Notas para el gate humano* dejaba condicionado a esta firma.
