---
id: SPEC-002
tipo: ledger
epica: EPIC-001
---
# Ledger — SPEC-002 Test de espejo entre fuentes automaticas

## Resumen
- Fase: **en-revision (segunda vuelta)**. Implementada por `sdd-implementador` el
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

## Gates de calidad (reejecutados en local el 2026-08-31, tras el RED)

No hay CI: esta salida es local y nadie la pasa por nosotros.

```
$ npx oxlint --version
Version: 1.80.0

$ npm run lint

> marcador@0.0.1 lint
> oxlint --type-aware

exit=0
(sin hallazgos: oxlint --type-aware sale 0 y no imprime nada)

$ npx tsc --noEmit
exit=0
(sin salida: 0 errores)

$ npx vitest run

 RUN  v4.1.11 /Users/albertofojo/src/tremen-dev/marcador.gal

 Test Files  46 passed (46)
      Tests  409 passed (409)
Type Errors  no errors
   Duration  1.19s
```

Base antes de esta ronda: 44 ficheros / 394 casos. Ahora **46 / 409**: +15 casos
y +2 ficheros (`tests/mirror/analysis/spelling.test.ts`, 10; `tests/mirror/cli/
cli.test.ts`, 3; más 1 en `window.test.ts` y 1 en `invalid-window.test.ts`).

De esos 409, **139 son de SPEC-002** (22 ficheros bajo `tests/mirror/`), más el
fichero de tipo `tests/mirror/analysis/statuses.test-d.ts`, que corre dentro del
`typecheck` de vitest y no cuenta como caso. Los 270 restantes son SPEC-001, que
sigue verde y sin tocar.

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
| `tests/mirror/analysis/lead.test.ts` | 12 |
| `tests/mirror/analysis/verdict-time.test.ts` | 6 |
| `tests/mirror/analysis/verdict-content.test.ts` | 8 |
| `tests/mirror/analysis/sample-size.test.ts` | 5 |
| `tests/mirror/analysis/rn02.test.ts` | 5 |
| `tests/mirror/analysis/report.test.ts` | 13 |
| `tests/mirror/analysis/citations.test.ts` | 5 |
| `tests/mirror/analysis/pair.test.ts` | 6 |
| `tests/mirror/analysis/determinism.test.ts` | 4 |
| `tests/mirror/analysis/invalid-window.test.ts` | 4 |
| `tests/mirror/analysis/findings.test.ts` | 6 |
| `tests/mirror/analysis/sources.test.ts` | 4 |
| `tests/mirror/analysis/spelling.test.ts` | 10 |
| `tests/mirror/cli/cli.test.ts` | 3 |
| **Total SPEC-002** | **139** |

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

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 (RN-11) ni una petición de más | `src/mirror/capture/capturer.ts` (limitador por par, `#isDue` + `#lastRequestAt`), `src/mirror/capture/ports.ts` (`pairKey`), `src/mirror/thresholds.ts` (`MIN_REQUEST_INTERVAL_MS`) | `tests/mirror/capture/rate-limit.test.ts` (5): hora simulada con `FakeClock` ticando cada 10 s → ≤ 60 y ≥ 59 peticiones por par; ninguna pareja de peticiones del mismo par a < 60 s; **caso 3** fija la lectura declarada de RN-11 (6 peticiones en el mismo minuto, una por par); un tick suprimido no registra tick | `npx vitest run` → `tests/mirror/capture/rate-limit.test.ts` 5/5 verdes. El limitador vive en `Capturer.#isDue` (`epochMs - last >= MIN_REQUEST_INTERVAL_MS`) y `#lastRequestAt` se sella **antes** del `await` y **antes** del chequeo de robots, así que una respuesta lenta no compra turno. El caso 3 fija la lectura declarada de RN-11: `await capturer.tick()` con 6 targets → `spy.requests.length === 6`, 6 URL distintas, **1 solo instante**. El caso 1 mide en las dos direcciones (≤ 60 **y** ≥ 59 en la hora), o sea que no se puede pasar «protegiendo» sin pedir nada | ✅ |
| CA-2 (RN-11) cortesía comprobable | `src/mirror/capture/robots.ts` (`parseRobots`, `robotsRegistry`, `robotsSkipReason`), `src/mirror/capture/http.ts` (`politeRequest`, `politeFetch`, `MissingUserAgentError`), `src/mirror/user-agent.ts` | `tests/mirror/capture/robots.test.ts` (9): ruta prohibida → 0 peticiones + 1 omisión con motivo que nombra la ruta; ruta permitida → 1 petición con la UA exacta; host sin robots cargado → omitido (no se presume permiso); **caso 8** lee el fuente de `src/mirror/capture/*.ts` y falla si `.fetch(` aparece fuera de `http.ts`. `tests/mirror/cli/cli.test.ts` caso 1 (ronda 2) lo comprueba además **por el camino real**: un servidor local recibe las peticiones del CLI y la UA que llega es `USER_AGENT` exacta | `npx vitest run` → `robots.test.ts` 9/9 verdes. Leído el código: `politeRequest` lanza `MissingUserAgentError` **antes** de cualquier I/O y es el único constructor de peticiones; el caso 8 recorre `src/mirror/capture/*.ts` quitando comentarios de bloque y exige `callers === ['http.ts']`, así que la puerta única es una aserción y no una promesa. Ruta prohibida → 0 peticiones + tick `skipped` con la ruta en el motivo; host sin robots cargado → `skipped` (no se presume permiso). **Salvedad:** el contacto de la UA es un marcador de posición (`+https://github.com/tremen-dev/marcador.gal`, dominio sin contratar) — la **forma** está probada contra `USER_AGENT_PATTERN`, el **valor** no responde. Es **F-SPEC-002-1**, abierto, y RN-11 pide identificación real antes de la ventana | ⚠️ |
| CA-3 (RN-10, D-5) la fase A archiva y no parsea | `src/mirror/capture/capturer.ts` (`captureThenParse` con parser identidad; sin modo degradado) | `tests/mirror/capture/no-parse.test.ts` (5): `put` que lanza → tick `failed` con motivo, `raw_ref` null, y la ventana sigue; **estructura**: grafo de imports desde `src/mirror/capture/**` no alcanza `src/mirror/analysis/**` (+ control de que el grafo no está vacío). `tests/mirror/capture/no-extractor.test.ts` (2): con `@/mirror/analysis/extract` sustituido por un espía, una ventana de 10 ticks —sana y con el store roto— no lo llama ni una vez. `tests/mirror/cli/cli.test.ts` caso 1 (ronda 2): tras correr la fase A de verdad, cada `raw_ref` del registro devuelve bytes con `store.get()` | `npx vitest run` → `no-parse.test.ts` 5/5 y `no-extractor.test.ts` 2/2 verdes. El «parser» de la fase A es la identidad (`(_body, ref) => ref`) y no hay costura para otro. La comprobación estructural no es decorativa: `reachableModules()` resuelve `@/…` y rutas relativas sobre el fuente real y el caso 4 exige lista vacía de `src/mirror/analysis`; el caso 5 comprueba que el grafo alcanza `src/raw/capture.ts` y `src/mirror/thresholds.ts`, o sea que un grafo vacío no lo pondría verde por silencio | ✅ |
| CA-4 (ADR-005, ADR-006) el archivo es la línea de tiempo | `src/mirror/instants.ts` (`canonicalInstant`, `normalizeInstant`: ISO con ms siempre), `src/mirror/capture/capturer.ts` (normaliza antes de archivar); `rawKey`/`DiskRawStore` de SPEC-001 sin tocar | `tests/mirror/capture/archive.test.ts` (5): `list()` del prefijo del par; claves barajadas y reordenadas como cadenas reproducen el orden temporal (12 capturas); **caso 3** archiva instantes desordenados y con formatos mezclados y demuestra que el ISO literal ordena MAL (`17-00-00.500z` antes que `17-00-00z`); `fetched_at` es cadena ISO UTC, nunca `Date`; la clave es exactamente la de `rawKey()` | `npx vitest run` → `archive.test.ts` 5/5 verdes, contra `DiskRawStore` real en `mkdtemp`. Verificado que el caso 3 muerde de verdad: afirma **primero** que el orden ingenuo sale mal (`naive[0]` contiene `17-00-00.500z` y `naive[1]` contiene `17-00-00z`) y después que con `canonicalInstant` el orden por cadena reproduce el cronológico. `fetched_at` se comprueba `typeof === 'string'` y contra `/^\d{4}-…\.\d{3}Z$/` (ADR-006), y el caso 5 iguala la clave a `rawKey(meta, body)` de SPEC-001, sin entidades nuevas | ✅ |
| CA-5 una ventana a medias no produce veredicto | `src/mirror/window.ts` (`windowCoverage`, `windowValidity`, `assertWindowValid`, `InvalidWindowError`, `MIN_TICK_SUCCESS_RATIO`), `src/mirror/analysis/analyze.ts` (lo llama antes que nada). **Ronda 2 (F-SPEC-002-V2, enmienda §6):** `InvalidWindowError` recibe ahora `validity.coverage` entera además de `below` y la expone en `error.coverage`; el mensaje lleva **los seis pares** —peor primero, que es el que decide—, cada uno marcado `BELOW`/`ok`, más el recuento contra el umbral exigido | `tests/mirror/window.test.ts` (7): 95 % válida, 85 % inválida, **100 % + 50 % inválida** con la media (75 %) explícitamente descartada, 90 % exacto pasa, ventana vacía inválida, el error nombra el par y su cobertura. `tests/mirror/analysis/invalid-window.test.ts` (4): la fase B **se niega** (`InvalidWindowError`) sobre la ventana degradada y dicta veredicto sobre la sana. **Ronda 2:** `window.test.ts` **caso 8** monta los seis pares reales con uno al 50 % y exige que el mensaje nombre los **seis** con su ratio, el umbral, y la distinción `BELOW`/`ok` de un vistazo; `invalid-window.test.ts` **caso 4** comprueba que ese mensaje llega igual desde la fase B, nombrando los pares sanos; y `tests/mirror/cli/cli.test.ts` **caso 3** ata la otra mitad que pedía la enmienda —sobre una ventana inválida el CLI sale con error y **no se crea `hallazgos/`**—, que hasta ahora se cumplía por construcción y no estaba atado. Salvedad **F-SPEC-002-10** | **RED — F-SPEC-002-V2.** La mitad vieja del CA está bien (7/7 + 3/3 verdes; el peor par decide, la media del 75 % está descartada explícitamente, 90 % exacto pasa, y `analyze()` llama `assertWindowValid` en su primera línea, antes de leer el archivo). Lo que **no** está es la obligación que trae la enmienda §6: «el error lleva la cobertura de **los seis pares**, no solo la de los que bajaron del umbral, más el umbral exigido». `InvalidWindowError` solo recibe `validity.below` (`src/mirror/window.ts:110-125`), así que los sanos no aparecen. Probado con una ventana de 6 pares reales, uno al 50 %: `PARES TOTALES : 6` · `PARES < UMBRAL : 1` · mensaje = `CA-5: refusing to judge an invalid window — below 90 % successful ticks: ceroacero/rfef-tercera-g1 at 50.0 % (30/60)` · `NOMBRA LOS SANOS?: futgal/rfef-tercera-g1=false futgal/futgal-preferente-g1=false resultados-futbol/rfef-tercera-g1=false`. El operador no ve «la salud de la ventana entera» ni sabe qué repetir. Falta además el test que la enmienda añade: **no existe ninguno que compruebe que sobre una ventana inválida no se crea fichero en `hallazgos/`** (se cumple por construcción —`analyze` lanza antes de `writeFindings`— pero no está atado) | ❌ |
| CA-6 (RN-09) el cruce se declara a mano | `src/mirror/analysis/pairing.ts` (`PairingSchema` estricto, `buildPairingIndex`, `UnmappedMatchError`, `AmbiguousPairingError`) | `tests/mirror/analysis/pairing.test.ts` (7): identidad no mapeada → `UnmappedMatchError` con los dos equipos, la ref y la fuente en el mensaje; **«UD Ourense» / «Ourense CF» no se unen** y una tercera grafía no declarada tampoco cae en ninguno de los dos; una ref reclamada por dos partidos es error del fichero; el esquema rechaza una clave de más. No hay ninguna rama de parecido de cadenas en el módulo | `npx vitest run` → `pairing.test.ts` 7/7 verdes. Leído `src/mirror/analysis/pairing.ts` entero: no hay distancia de cadenas, ni normalización de nombres, ni fallback — la resolución es un `Map` de `source_ref` y punto. El caso 4 es el ejemplo de `dominio.md` («UD Ourense» / «Ourense CF» no se unen) **y** comprueba que una tercera grafía no declarada lanza en vez de caer en la más parecida, que es la mitad que de verdad importa. `UnmappedMatchError` nombra los dos equipos, la ref y la fuente; `AmbiguousPairingError` trata una ref reclamada dos veces como error del fichero y no como desempate | ✅ |
| CA-7 el análisis es función del archivo | `src/mirror/analysis/timeline.ts` (ordena las claves él mismo), `src/mirror/analysis/analyze.ts` (sin reloj, sin red, sin BD) | `tests/mirror/analysis/determinism.test.ts` (4): dos ejecuciones → JSON byte a byte idéntico; claves invertidas y barajadas → idéntico; **dos relojes de sistema distintos** (`vi.setSystemTime`, 2026 y 2027) → idéntico; y el informe no está vacío (> 1000 bytes) para que la comparación mida algo | `npx vitest run` → `determinism.test.ts` 4/4 verdes. Comprobado en el fuente que la pureza es estructural y no accidental: `analyze()` no toca `Date.now()` ni la red ni Postgres, `timeline.ts` ordena las claves él mismo, `comparePair` itera `[...values.keys()].sort()` y `roundsOf` agrupa por instante ordenando por cadena. La comparación es `JSON.stringify` exacto, con claves en orden, invertidas y barajadas, y con `vi.setSystemTime` en 2026 y en 2027. El caso 4 evita el verde por informe vacío (> 1000 bytes, 2 fuentes) | ✅ |
| CA-8 adelanto, retraso y empate con τ | `src/mirror/analysis/compare.ts` (`classifyLead`), `src/mirror/thresholds.ts` (`TAU_MS = 90 s`) | `tests/mirror/analysis/lead.test.ts` (12): tabla de límites 89 / **90** / 91 s en los dos sentidos (90 s exactos = empate, porque el criterio es estrictamente mayor); `first_seen` indefinido en una, en la otra y en las dos; la diferencia observada se registra con signo. El reparto de diferencias viaja en el informe (`observed_differences_s`), probado en `report.test.ts` caso 7 | `npx vitest run` → `lead.test.ts` 12/12 verdes. La tabla de límites está escrita entera y en los dos sentidos: 91 s → `lead_b`, **90 s exactos → `tie`**, 89 s → `tie`, y sus tres simétricos. `classifyLead` usa `>` estricto contra `tauMs` (`compare.ts:52-54`), coherente con el texto del CA. Los tres casos de `first_seen` indefinido salen `only_a` / `only_b` / `neither` y **nunca** adelanto —importa, porque tratar un ausente como adelanto infinito dejaría que un partido que falta en una página probase la independencia de la otra—. El reparto observado viaja en el informe como `observed_differences_s` junto a `thresholds.tau_ms` (`report.test.ts` casos 3 y 7) | ✅ |
| CA-9 un adelanto prueba independencia | `src/mirror/analysis/verdict.ts` (`verdictAgainstReference`, `leadsAreEnough`), `src/mirror/thresholds.ts` (`MIN_LEAD_EVENTS`, `MIN_LEAD_MATCHES`) | `tests/mirror/analysis/verdict-time.test.ts` (6): **(a)** 2 adelantos en 2 partidos → INDEPENDIENTE; **(b)** 2 adelantos en el MISMO partido → no INDEPENDIENTE; **(c)** S siempre 5 min por detrás y sin error replicado → **INCONCLUSO, no ESPEJO** (el corazón del criterio, con `leads_b = 0`, `leads_a > 0`, N ≥ 10 comprobados uno a uno); (d) un solo adelanto no basta; (e) 3 en 3 partidos → INDEPENDIENTE. Salvedades **F-SPEC-002-5** y **F-SPEC-002-6** | `npx vitest run` → `verdict-time.test.ts` 6/6 verdes. El «si y solo si» está acotado a la señal temporal, como ratifica la enmienda §3: `verdictAgainstReference` calcula `leadsAreEnough(leads_b, lead_matches_b)` **O** `persistent_discrepancies.length > 0`. El caso (c) —el corazón— está y muerde: 6 partidos, S cinco minutos por detrás, `leads_b === 0`, `leads_a > 0`, 0 errores replicados, N ≥ 10 → **INCONCLUSO**, con una aserción explícita de que no es ESPEJO. (b) separa eventos de partidos (`leads_b === 2`, `lead_matches_b === 1` → no INDEPENDIENTE). Mutación comprobada por el implementador (`> tauMs` → `>=`) y confirmada por el caso 3 de `lead.test.ts`. **El CA se cumple en sus propios términos**; que INDEPENDIENTE se alcance por un camino ilegítimo es fallo de CA-10, no de este | ✅ |
| CA-10 las señales que no dependen del reloj | `src/mirror/analysis/compare.ts` (`isRetraction`, `replicatedErrors`, `contentDivergences` por rondas, exclusivos), `src/mirror/thresholds.ts` (`MIN_PERSISTENT_CAPTURES`). **Ronda 2 (F-SPEC-002-V1, enmienda §1):** `DiscrepancyFact` baja a los **tres** hechos que deciden (`existence`, `kickoff`, `finished_result`) y la grafía sale a un tipo propio, `SpellingDivergence`; `contentDivergences` calcula las dos listas en una sola pasada, con la misma vara de medir, y `comparePair` las devuelve separadas. `verdictAgainstReference` no necesita filtro: `persistent_discrepancies` ya no puede contener grafía | `tests/mirror/analysis/verdict-content.test.ts` (8): **(a)** error transitorio replicado → ESPEJO **citando las cuatro claves**, y las cuatro existen en el store; (a-bis) un error que solo comete F no es replicado; **(b)** S con un hecho que F no tiene → no ESPEJO por error replicado; **(c)** horarios distintos en 2 capturas que convergen → **no** persistente; **(d)** los mismos en 3 capturas → INDEPENDIENTE; (e) partido que solo una fuente tiene → discrepancia de existencia; y que bajar un marcador es retractarse mientras subirlo es jugar. **Ronda 2:** `tests/mirror/analysis/spelling.test.ts` (10) trae el caso que el CA declara que «no puede faltar» — **caso 1**: doce partidos en reposo, tres de ellos escritos distinto por cada fuente, persistentes en las 4 capturas, N = 12 ≥ N_min, cero de todo lo demás → **INCONCLUSO/`sin_senal`**, no INDEPENDIENTE, con `rn02=false`; **caso 2**: la divergencia aparece contada y **citada**, y cada clave existe en el store (CA-14); **caso 4**: se comprueba que la ventana no tenía ninguna otra señal, o sea que el caso 1 mide lo que dice medir; **caso 5**: un ESPEJO por indicio sigue siendo ESPEJO con grafías divergentes (no dicta hacia ESPEJO tampoco); **caso 6**: dos ventanas que **solo** difieren en cómo se escriben tres nombres producen los **tres** veredictos idénticos, que es «sin voto en las dos direcciones» dicho como aserción. Mutación comprobada: devolver el voto a la grafía pone 5 de los 10 en rojo. Salvedades **F-SPEC-002-4**, **F-SPEC-002-5**, **F-SPEC-002-7**, **F-SPEC-002-9** (ratificadas), **F-SPEC-002-19** (nueva) | **RED — F-SPEC-002-V1, el bloqueante.** La enmienda §1 (CA-10.4) **no está implementada**: `team_spelling` sigue en la lista `FACTS` de `persistentDiscrepancies` (`src/mirror/analysis/compare.ts:350-355`) y `verdictAgainstReference` hace `independent = … O persistent_discrepancies.length > 0` (`verdict.ts:62-64`), sin filtrar el hecho. **La grafía dicta veredicto, que es exactamente lo que el CA prohíbe** («no entra en ningún veredicto, ni hacia ESPEJO ni hacia INDEPENDIENTE»). Medido, no deducido: fixture de 6 partidos en que las tres fuentes coinciden en `status` y marcador y solo difieren en cómo escriben los nombres → `n_comparable = 12`, `leads_a/leads_b = 0 0`, `exclusives = 0 0`, `replicated_errors = 0`, `persistent facts = [team_spelling ×6]`, **`VERDICT = INDEPENDIENTE / discrepancia_persistente`, `rn02 = true`**. Sobre el informe completo salen las **tres** cosas INDEPENDIENTE con `rn02=true` y sin advertencia de conflictos. Es la confianza falsa del §Problema, producida por la única señal que no lleva información. Falta también el test que el CA declara innegociable: **no hay ningún caso «grafías distintas y persistentes en 3 capturas, sin ninguna otra señal → NO INDEPENDIENTE»** (`grep -rn spelling tests/` solo devuelve un comentario en `pairing.test.ts`). 10.2 sigue con **cuatro** hechos donde la enmienda deja tres. Lo demás de CA-10 sí está: `isRetraction` implementa la retractación ratificada (baja de marcador o estado que regresa) y `verdict-content.test.ts` 8/8 cubre error replicado con las 4 claves, gol normal que no lo es, 2 capturas que convergen vs 3 que no, y exclusivos; la regla de decisión de `decide()` es total y ordenada y coincide con el texto enmendado (contradicción → INCONCLUSO; el indicio cede ante lo fuerte; *sincronía* bidireccional y con `temporal_half === 'completa'`) | ❌ |
| CA-11 la muestra insuficiente es un veredicto | `src/mirror/analysis/verdict.ts` (puerta `n_comparable < N_MIN` antes de todo), `src/mirror/thresholds.ts` (`N_MIN = 10`) | `tests/mirror/analysis/sample-size.test.ts` (5): N = 9 → INCONCLUSO con motivo `muestra_insuficiente`; el informe lleva **el N observado y el N_min exigido** en las dos secciones (fuente y par); con N = 9 no se dicta ni ESPEJO ni INDEPENDIENTE; **N = 10 sí dicta veredicto**. Mutación: quitar la puerta pone la suite roja | `npx vitest run` → `sample-size.test.ts` 5/5 verdes. La puerta es la primera línea de `verdictAgainstReference` y de `verdictBetweenCandidates` (`n_comparable < N_MIN` → `insufficient()`), o sea que es el paso 1 de la regla de decisión de CA-10 tal como la enmienda §5 lo pide. N = 9 → INCONCLUSO / `muestra_insuficiente` en las dos secciones, con `n_comparable` **y** `n_min` en el JSON de fuente y de par; N = 10 exacto dicta veredicto. Con N = 9 se comprueba explícitamente que no sale ni ESPEJO ni INDEPENDIENTE, que es la mitad que evita el falso verde | ✅ |
| CA-12 (RN-02) lo desconocido no es independencia | `src/mirror/analysis/verdict.ts` (`rn02_segunda_via_entre_automaticas` se fija en `decide()` y en `insufficient()`, en ninguna otra rama) | `tests/mirror/analysis/rn02.test.ts` (5): tabla sobre los tres veredictos producidos por tres ventanas distintas —INDEPENDIENTE → `true`, ESPEJO → `false`, INCONCLUSO → `false`—; el par lleva la misma bandera con la misma regla; **caso 5** recorre la función de decisión con cinco análisis sintéticos y comprueba `bandera === (veredicto === 'INDEPENDIENTE')` sin excepción | `npx vitest run` → `rn02.test.ts` 5/5 verdes. Comprobado en el fuente que la bandera se fija en **exactamente dos** sitios (`decide()` e `insufficient()` en `verdict.ts`) y que en las cinco ramas vale `true` solo en la de INDEPENDIENTE; `grep -n "rn02_segunda_via" src/mirror/` no encuentra ninguna otra escritura. El caso 5 recorre la función de decisión con análisis sintéticos y exige `bandera === (veredicto === 'INDEPENDIENTE')`. **El invariante se sostiene**: lo que falla en CA-10 es que se llegue a INDEPENDIENTE sin derecho, no que la bandera lo siga mal — pero es justo por eso por lo que el bug de la grafía sale del informe como `rn02_segunda_via_entre_automaticas: true` | ✅ |
| CA-13 veredicto accionable; el parcial es un veredicto | `src/mirror/analysis/report.ts` (esquema zod **local a la spec**, `z.strictObject` en todo), `src/mirror/analysis/analyze.ts`, `src/mirror/analysis/prose.ts`, `src/mirror/analysis/findings.ts`. **Ronda 2 (F-SPEC-002-V3, enmienda §1):** `spelling_divergences` es clave propia en `CountersSchema` **y** en `PairCountersSchema`, con `SpellingDivergenceEvidenceSchema` (campos `spelling_a`/`spelling_b`, sus `raw_keys`) en `EvidenceSchema`. Y `team_spelling` **sale del enum** `DiscrepancyFactSchema`: el fallo deja de ser representable en vez de quedar desaconsejado, que es lo que el CA pide al llamar «invitación» al contador compartido. `prose.ts` gana `spellingNote()`, que dice que se registran, que **no dictan** y por qué —el agregador rinde el nombre desde su propia base de equipos—, y para qué se conservan; `findings.ts`, su fila en las dos tablas | `tests/mirror/analysis/report.test.ts` (13): el JSON valida; **una clave de más y una de menos lo invalidan igual**; lleva los cinco umbrales, la ventana y la cobertura por par; un veredicto por candidata y uno para el par; un párrafo en prosa por fuente que nombra RN-02; **caso 8** — fixture solo de contenido → valida, dicta veredicto y marca la temporal `pendiente` con la ventana prevista, y los contadores temporales son `null`; **casos 11-13** — la advertencia de la métrica de conflictos aparece si ninguna candidata es INDEPENDIENTE (en JSON **y** en prosa, con `hard_cut_15_percent_applies: false`) y no aparece si una lo es. `tests/mirror/analysis/findings.test.ts` (6): el documento vive en `docs/epicas/EPIC-001-spike-ingesta/hallazgos/test-de-espejo.md`, el JSON al lado, lleva umbrales y advertencia, y es determinista. **Ronda 2:** `spelling.test.ts` **caso 7** (la clave propia existe en fuente y par, y las persistentes quedan en 0 sobre el fixture solo-de-grafía), **caso 8** (el esquema **rechaza** `fact: 'team_spelling'` en una discrepancia persistente), **casos 9-10** (la prosa lo dice cuando las hay y **no** habla de ellas cuando no las hay). Y `tests/mirror/cli/cli.test.ts` **caso 2** comprueba que el generador se puede ejecutar de verdad: `npm run mirror:analizar` escribe el `.md` y el `.json` y saca los tres veredictos por consola. Salvedad **F-SPEC-002-12** (aún no hay hallazgo escrito: no ha habido ventana) | **RED — F-SPEC-002-V3.** El grueso del CA está y es bueno: `report.test.ts` 13/13 y `findings.test.ts` 6/6 verdes, `z.strictObject` en todo el esquema (clave de más y clave de menos invalidan igual), los cinco umbrales y la cobertura por par viajan dentro, el informe solo-de-contenido valida con la temporal `pendiente` y los contadores temporales `null`, y la advertencia de la métrica de conflictos aparece y desaparece según corresponda, en JSON **y** en prosa. Lo que falta es lo que trae la enmienda §1: **la clave propia de las divergencias de grafía no existe**. `Object.keys(counters)` = `n_comparable, n_min, exclusive_to_source, exclusive_to_reference, replicated_errors, persistent_discrepancies, temporal` — ninguna de grafía. Peor: **se suman a las persistentes**, que es lo que el CA prohíbe con todas las letras. Medido sobre el fixture solo-de-grafía: `persistent_discrepancies = 6`, `facts en evidencia = team_spelling`, y la prosa generada dice literalmente «*0 errores replicados y 6 discrepancias persistentes … ceroacero cuenta como fuente independiente a efectos de RN-02 … permite publicar confirmado*». La prosa **no menciona en ningún caso** que la grafía se registra y no dicta (`prose.ts` no tiene ni una rama para ello). Es exactamente el «contador compartido» que el CA llama «invitación a reintroducir el fallo», solo que ni siquiera hay discriminador que filtrar. **F-SPEC-002-12** sigue abierta y **no se cuenta en contra**: el CA no exige el hallazgo escrito, y fabricarlo sin ventana sería peor | ❌ |
| CA-14 (RN-12 por analogía) cada afirmación cita sus capturas | `src/mirror/analysis/analyze.ts` (`eventEvidence`, `evidenceOf`), `src/mirror/analysis/compare.ts` (arrastra `raw_key` en `first_seen`, en los errores replicados y en las discrepancias) | `tests/mirror/analysis/citations.test.ts` (5): sobre una ventana con adelantos, exclusivos **y** error replicado, se recorren **todas** las claves citadas y `store.get()` devuelve algo para cada una; el recorrido mide algo (> 10 claves y los tres tipos presentes); cada adelanto cita 2 capturas y cada error replicado exactamente 4 distintas; y una clave inventada devuelve `null`, o sea que la comprobación sabe fallar. **Ronda 2:** el recorrido de `citedKeys` incluye ahora `evidence.spelling_divergences` —CA-10.4 les quita el voto, no la cita—, y `spelling.test.ts` caso 2 comprueba una a una las claves de la grafía contra el store | `npx vitest run` → `citations.test.ts` 5/5 verdes. Las citas no se fabrican: los fixtures entran por el camino real (`store.put()` de HTML → `store.get()` → extractor real), así que las claves citadas son claves que existen. El recorrido cubre los cuatro bloques de evidencia de las dos fuentes **y** del par (> 10 claves, los tres tipos presentes), cada adelanto cita 2 capturas y cada error replicado exactamente 4 **distintas**, y el caso 5 comprueba que una clave inventada devuelve `null`, o sea que el test sabe ponerse rojo. Las divergencias de grafía también arrastran sus `raw_key`, como pide la enmienda; el problema es **dónde** viajan, y eso es CA-13 | ✅ |
| CA-15 (RN-02) el cruce de las dos candidatas | `src/mirror/analysis/verdict.ts` (`verdictBetweenCandidates`, `errorSignature`), `src/mirror/analysis/analyze.ts` (`pairReport` con el reparto de errores replicados). **Ronda 2 (15.4):** `verdictBetweenCandidates` sigue leyendo `persistent_discrepancies.length > 0`, pero ese término ya no puede contener grafía —sale de raíz en `compare.ts`—, así que la simetría de 15.4 se cumple por construcción y no por un filtro que alguien pueda olvidar. El par lleva su propio `counters.spelling_divergences` y su prosa lo nombra | `tests/mirror/analysis/pair.test.ts` (6): **(a)** adelantos mutuos 2 y 2 → INDEPENDIENTE con motivo `adelantos_mutuos`; **(b)** C1 adelanta 4 veces y C2 nunca → ESPEJO con `espejo_de: ceroacero`; **(c)** error replicado por las dos y **ausente de futgal** → `origen_comun_distinto_de_futgal: true` y la prosa lo nombra; **(d)** el mismo error presente también en futgal → cuenta en `replicated_errors_also_in_reference`; **(e)** N < 10 → INCONCLUSO y el par no habilita la segunda vía; (f) 2 adelantos en una sola dirección no son independencia mutua. **Ronda 2:** `spelling.test.ts` **caso 3** — sobre la ventana en que las tres fuentes solo difieren en la grafía, el par sale **INCONCLUSO** con `rn02=false` y `spelling_divergences = 3`, donde antes salía INDEPENDIENTE; el **caso 6** lo incluye en la comparación de veredictos con y sin divergencia | **RED — arrastra F-SPEC-002-V1 por 15.4.** Los apartados 1, 2 y 3 están y son sólidos: `pair.test.ts` 6/6 verdes, el listón sube de verdad (`mutual = aLeads && bLeads`, y (f) confirma que 2 en una sola dirección no bastan), los adelantos unidireccionales marcan `espejo_de` con la rezagada tratada como espejo, y la distinción que solo este CA puede producir está implementada con `errorSignature` y contada en dos claves separadas —`replicated_errors_also_in_reference` vs `replicated_errors_absent_from_reference`— con `origen_comun_distinto_de_futgal` y la prosa nombrándolo («aguas arriba»). **15.4 no está:** `verdictBetweenCandidates` usa el mismo `persistent_discrepancies.length > 0` sin filtrar `team_spelling` (`verdict.ts:132`), así que la grafía dicta también aquí. Medido: en el fixture donde las tres fuentes solo difieren en la grafía, el par sale `INDEPENDIENTE / discrepancia_persistente / rn02=true`. Y el CA avisa de que en este cruce el argumento es **más** fuerte, porque las dos candidatas son dos agregadores con base de equipos propia: la señal dispararía incluso para dos reventas literales del mismo feed | ❌ |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

**RED — 2026-08-31 (`sdd-verificador`).** Verificado contra el **texto enmendado**
de la spec (enmienda 1 del 2026-08-31, ratificada entera por el gate), que es el
contrato vigente. 9 CA en verde, 1 con salvedad, **5 en rojo**.

**Gates automáticos: todos verdes.**

```
$ npx oxlint --version
Version: 1.80.0
$ npm run lint            → oxlint --type-aware, exit 0, sin hallazgos
$ npx tsc --noEmit        → exit 0, sin salida
$ npx vitest run          → Test Files 44 passed (44) · Tests 394 passed (394)
                            Type Errors no errors · Duration 850ms
```

**El lint NO es ciego (F-SPEC-001-22 no se repite).** Medido por cobertura y no
por exit code, que es como se coló en SPEC-001:

```
$ npx oxlint --type-aware --debug=files | wc -l          → 115 ficheros
$ ... | grep -c 'src/mirror'                             → 24   (los 24 que hay)
$ ... | grep -c 'tests/mirror'                           → 30   (los 30 que hay)
$ npx oxlint -A all -W style src/mirror | tail           → emite diagnósticos
```

La última línea es la que cierra la duda: con el silencio de `--type-aware` no se
distingue «limpio» de «no ha mirado», así que se forzó al reporter a hablar sobre
esos mismos ficheros. Habla. El silencio de `npm run lint` es limpieza real.

### Lo que devuelve la spec

Los tres primeros son **la misma causa**: la enmienda 1 se escribió y se firmó
**después** del commit de implementación (`d508efa` es anterior a `2eb0bb0`), y el
arbitraje del gate afirma que «nada de esto toca código». Para seis de los siete
follow-ups es cierto. **Para F-SPEC-002-9 no lo es**, y es justamente el que el
propio arbitraje llama «la única de las siete que cambia un veredicto». El
implementador lo había dicho: «está implementado como pide la spec … no lo he
hecho porque contradice el texto de la spec». La spec cambió; el código no.

- **F-SPEC-002-V1 (bloqueante) — la grafía sigue dictando veredicto.** CA-10.4 y
  CA-15.4. `team_spelling` continúa en `FACTS` (`compare.ts:350-355`) y entra en
  `persistent_discrepancies`, que es el término que hace `independent` en
  `verdict.ts:62-64` y `132`. Demostrado con una ventana en que las tres fuentes
  coinciden en todo salvo en cómo escriben los nombres —0 adelantos, 0 exclusivos,
  0 errores replicados, N = 12—: **las tres cruces salen INDEPENDIENTE con
  `rn02_segunda_via_entre_automaticas: true`**, sin advertencia de conflictos, y
  la prosa generada dice «permite publicar confirmado». Es palabra por palabra la
  confianza falsa del §Problema, y con RN-02 abriendo su segunda vía sobre una
  independencia no demostrada. Falta además el test que CA-10 declara que «no
  puede faltar».
- **F-SPEC-002-V3 — el contador de grafía no existe.** CA-13. Las divergencias se
  **suman** a `counters.persistent_discrepancies` en vez de viajar en clave
  propia, y la prosa no dice en ningún caso que se registran y no dictan. El CA
  prohíbe esto explícitamente («no se suman … en ninguna clave del JSON ni en la
  prosa»).
- **F-SPEC-002-V2 — la negativa de CA-5 es muda a medias.** El error nombra solo
  los pares caídos; la enmienda §6 exige **los seis**, para que el operador vea la
  salud de la ventana entera y sepa qué repetir. Falta también el test de que
  sobre una ventana inválida no se escribe nada en `hallazgos/` (se cumple por
  construcción, pero nada lo ata).

Y uno que no viene de la enmienda y que ningún test podía ver, porque ningún test
ejecuta el flujo real:

- **F-SPEC-002-V4 (bloqueante) — los dos CLI no arrancan.** `src/mirror/cli/
  capturar.ts` y `analizar.ts` importan con el alias `@/…`, que resuelven vitest y
  `tsc` por configuración pero **no Node**, que es quien los corre. No hay campo
  `imports` en `package.json` ni `--experimental-*` en los scripts:

  ```
  $ npm run mirror:capturar
  Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@/raw' imported from
    /…/src/mirror/cli/capturar.ts
  $ npm run mirror:analizar   → el mismo error
  ```

  No es un patrón heredado: `npm run db:migrate` de SPEC-001 funciona (`schema is
  up to date; nothing applied`) porque `src/db/cli.ts` importa en relativo. Con
  esto, **la ventana de observación no se puede correr** y el hallazgo de CA-13 no
  se puede generar por el procedimiento que el propio handoff documenta. El código
  de dentro está probado; la puerta por la que se entra, no.

### Lo que NO cuenta en contra

- **F-SPEC-002-12** (no hay `hallazgos/` porque no ha habido ventana). Ningún CA
  exige el documento escrito: CA-13 exige el **generador**, y está probado. Inventar
  un hallazgo sin ventana sería lo peor que podría hacer esta spec.
- **F-SPEC-002-3, -11, -14, -15, -16.** Declaradas, fuera del texto de los CA o
  dirigidas a otros roles.

### Lo que necesita decisión del humano

- **F-SPEC-002-1 (única ⚠️, en CA-2).** La UA emite un contacto inventado
  (`+https://github.com/tremen-dev/marcador.gal`, con el dominio sin contratar). La
  **forma** está probada; el **valor** no responde, y RN-11 pide identificación de
  verdad. Antes de la ventana real, no antes del merge.
- **El arbitraje del 2026-08-31 dice «nada de esto toca código»** y para
  F-SPEC-002-9 no es así. Conviene que quede constancia de que la ratificación de
  F-9 **sí** encargaba trabajo, y que este RED es su ejecución pendiente y no una
  reapertura de lo firmado.

### Cómo se cierra

Nada de esto es rediseño. V1 y V3 son la misma pieza: sacar `team_spelling` de
`persistent_discrepancies`, computarlo aparte, darle clave propia en
`CountersSchema` y `PairCountersSchema`, su rama en `prose.ts`, y los dos tests que
los CA nombran. V2 es pasar la cobertura entera a `InvalidWindowError`. V4 es
elegir rutas relativas o declarar el alias donde Node lo vea. La spec se ha movido
a `en-progreso`; el resto —CA-1, -3, -4, -6, -7, -8, -9, -11, -12, -14— está
verificado y no hay que volver a tocarlo.

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
tests/mirror/                   139 casos + un fichero .test-d.ts
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
4. Mirar **F-SPEC-002-17** (mínimo de Node) y **F-SPEC-002-19** (umbral de la
   grafía) cuando toque; ninguno bloquea.
5. `sdd-documentalista`: runbook (**F-SPEC-002-14**).

**Lo que NO se ha tocado, a propósito:** `src/model/`, `src/raw/`, `src/db/`,
`migrations/`, `docs/fundacion/`, `FOUNDATION.md`, los ADR, `_epica.md` y
`roadmap.md`. Ni un `migrations/0002`. Tampoco el texto de la spec ni las
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
