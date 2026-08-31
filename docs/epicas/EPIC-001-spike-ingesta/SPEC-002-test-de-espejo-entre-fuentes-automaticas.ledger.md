---
id: SPEC-002
tipo: ledger
epica: EPIC-001
---
# Ledger — SPEC-002 Test de espejo entre fuentes automaticas

## Resumen
- Fase: **en-revision**. Implementada por `sdd-implementador` el 2026-08-31 sobre
  la spec **aprobada** por Alberto Fojo ese mismo día. Los 15 CA tienen código y
  test; siete llevan salvedad declarada (ver *Salvedades / follow-ups*), y dos de
  ellas —**F-SPEC-002-4** y **F-SPEC-002-5**— resuelven contradicciones reales
  entre criterios y necesitan ratificación del gate.
- Rama: `ft/SPEC-002-test-de-espejo-entre-fuentes-automaticas`
- **Modelo canónico intacto.** Cero cambios en `src/model/`, cero
  `migrations/0002`, SPEC-001 no reabierta. Todo lo nuevo cuelga de
  `src/mirror/`, y reutiliza `src/raw/` (`RawStore`, `rawKey`, `captureThenParse`,
  `DiskRawStore`, `BlobRawStore`) y `src/model/ids.ts` (`SourceId`,
  `CompetitionId`, `MatchId`, `InstantSchema`) tal cual.
- **La fase B no toca Postgres.** Lee del `RawStore` y escribe un fichero, como
  dice la spec en *Entidades y reglas afectadas*.

## Gates de calidad (ejecutados en local el 2026-08-31)

No hay CI: esta salida es local y nadie la pasa por nosotros.

```
$ npm run lint

> marcador@0.0.1 lint
> oxlint --type-aware

(sin hallazgos: oxlint --type-aware sale 0 y no imprime nada)

$ npx tsc --noEmit
(sin salida: 0 errores)

$ npx vitest run

 RUN  v4.1.11 /Users/albertofojo/src/tremen-dev/marcador.gal

 Test Files  44 passed (44)
      Tests  394 passed (394)
 Type Errors  no errors
   Duration  877ms
```

De esos 394, **124 son de SPEC-002** (21 ficheros bajo `tests/mirror/`), más el
fichero de tipo `tests/mirror/analysis/statuses.test-d.ts`, que corre dentro del
`typecheck` de vitest y no cuenta como caso. Los 270 restantes son SPEC-001, que
sigue verde y sin tocar.

Reparto por fichero:

| Fichero | Casos |
|---|---|
| `tests/mirror/capture/rate-limit.test.ts` | 5 |
| `tests/mirror/capture/robots.test.ts` | 9 |
| `tests/mirror/capture/no-parse.test.ts` | 5 |
| `tests/mirror/capture/no-extractor.test.ts` | 2 |
| `tests/mirror/capture/archive.test.ts` | 5 |
| `tests/mirror/window.test.ts` | 7 |
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
| `tests/mirror/analysis/invalid-window.test.ts` | 3 |
| `tests/mirror/analysis/findings.test.ts` | 6 |
| `tests/mirror/analysis/sources.test.ts` | 4 |
| **Total SPEC-002** | **124** |

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

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 (RN-11) ni una petición de más | `src/mirror/capture/capturer.ts` (limitador por par, `#isDue` + `#lastRequestAt`), `src/mirror/capture/ports.ts` (`pairKey`), `src/mirror/thresholds.ts` (`MIN_REQUEST_INTERVAL_MS`) | `tests/mirror/capture/rate-limit.test.ts` (5): hora simulada con `FakeClock` ticando cada 10 s → ≤ 60 y ≥ 59 peticiones por par; ninguna pareja de peticiones del mismo par a < 60 s; **caso 3** fija la lectura declarada de RN-11 (6 peticiones en el mismo minuto, una por par); un tick suprimido no registra tick | | ❌ |
| CA-2 (RN-11) cortesía comprobable | `src/mirror/capture/robots.ts` (`parseRobots`, `robotsRegistry`, `robotsSkipReason`), `src/mirror/capture/http.ts` (`politeRequest`, `politeFetch`, `MissingUserAgentError`), `src/mirror/user-agent.ts` | `tests/mirror/capture/robots.test.ts` (9): ruta prohibida → 0 peticiones + 1 omisión con motivo que nombra la ruta; ruta permitida → 1 petición con la UA exacta; host sin robots cargado → omitido (no se presume permiso); **caso 8** lee el fuente de `src/mirror/capture/*.ts` y falla si `.fetch(` aparece fuera de `http.ts` | | ❌ |
| CA-3 (RN-10, D-5) la fase A archiva y no parsea | `src/mirror/capture/capturer.ts` (`captureThenParse` con parser identidad; sin modo degradado) | `tests/mirror/capture/no-parse.test.ts` (5): `put` que lanza → tick `failed` con motivo, `raw_ref` null, y la ventana sigue; **estructura**: grafo de imports desde `src/mirror/capture/**` no alcanza `src/mirror/analysis/**` (+ control de que el grafo no está vacío). `tests/mirror/capture/no-extractor.test.ts` (2): con `@/mirror/analysis/extract` sustituido por un espía, una ventana de 10 ticks —sana y con el store roto— no lo llama ni una vez | | ❌ |
| CA-4 (ADR-005, ADR-006) el archivo es la línea de tiempo | `src/mirror/instants.ts` (`canonicalInstant`, `normalizeInstant`: ISO con ms siempre), `src/mirror/capture/capturer.ts` (normaliza antes de archivar); `rawKey`/`DiskRawStore` de SPEC-001 sin tocar | `tests/mirror/capture/archive.test.ts` (5): `list()` del prefijo del par; claves barajadas y reordenadas como cadenas reproducen el orden temporal (12 capturas); **caso 3** archiva instantes desordenados y con formatos mezclados y demuestra que el ISO literal ordena MAL (`17-00-00.500z` antes que `17-00-00z`); `fetched_at` es cadena ISO UTC, nunca `Date`; la clave es exactamente la de `rawKey()` | | ❌ |
| CA-5 una ventana a medias no produce veredicto | `src/mirror/window.ts` (`windowCoverage`, `windowValidity`, `assertWindowValid`, `InvalidWindowError`, `MIN_TICK_SUCCESS_RATIO`), `src/mirror/analysis/analyze.ts` (lo llama antes que nada) | `tests/mirror/window.test.ts` (7): 95 % válida, 85 % inválida, **100 % + 50 % inválida** con la media (75 %) explícitamente descartada, 90 % exacto pasa, ventana vacía inválida, el error nombra el par y su cobertura. `tests/mirror/analysis/invalid-window.test.ts` (3): la fase B **se niega** (`InvalidWindowError`) sobre la ventana degradada y dicta veredicto sobre la sana. Salvedad **F-SPEC-002-10** | | ❌ |
| CA-6 (RN-09) el cruce se declara a mano | `src/mirror/analysis/pairing.ts` (`PairingSchema` estricto, `buildPairingIndex`, `UnmappedMatchError`, `AmbiguousPairingError`) | `tests/mirror/analysis/pairing.test.ts` (7): identidad no mapeada → `UnmappedMatchError` con los dos equipos, la ref y la fuente en el mensaje; **«UD Ourense» / «Ourense CF» no se unen** y una tercera grafía no declarada tampoco cae en ninguno de los dos; una ref reclamada por dos partidos es error del fichero; el esquema rechaza una clave de más. No hay ninguna rama de parecido de cadenas en el módulo | | ❌ |
| CA-7 el análisis es función del archivo | `src/mirror/analysis/timeline.ts` (ordena las claves él mismo), `src/mirror/analysis/analyze.ts` (sin reloj, sin red, sin BD) | `tests/mirror/analysis/determinism.test.ts` (4): dos ejecuciones → JSON byte a byte idéntico; claves invertidas y barajadas → idéntico; **dos relojes de sistema distintos** (`vi.setSystemTime`, 2026 y 2027) → idéntico; y el informe no está vacío (> 1000 bytes) para que la comparación mida algo | | ❌ |
| CA-8 adelanto, retraso y empate con τ | `src/mirror/analysis/compare.ts` (`classifyLead`), `src/mirror/thresholds.ts` (`TAU_MS = 90 s`) | `tests/mirror/analysis/lead.test.ts` (12): tabla de límites 89 / **90** / 91 s en los dos sentidos (90 s exactos = empate, porque el criterio es estrictamente mayor); `first_seen` indefinido en una, en la otra y en las dos; la diferencia observada se registra con signo. El reparto de diferencias viaja en el informe (`observed_differences_s`), probado en `report.test.ts` caso 7 | | ❌ |
| CA-9 un adelanto prueba independencia | `src/mirror/analysis/verdict.ts` (`verdictAgainstReference`, `leadsAreEnough`), `src/mirror/thresholds.ts` (`MIN_LEAD_EVENTS`, `MIN_LEAD_MATCHES`) | `tests/mirror/analysis/verdict-time.test.ts` (6): **(a)** 2 adelantos en 2 partidos → INDEPENDIENTE; **(b)** 2 adelantos en el MISMO partido → no INDEPENDIENTE; **(c)** S siempre 5 min por detrás y sin error replicado → **INCONCLUSO, no ESPEJO** (el corazón del criterio, con `leads_b = 0`, `leads_a > 0`, N ≥ 10 comprobados uno a uno); (d) un solo adelanto no basta; (e) 3 en 3 partidos → INDEPENDIENTE. Salvedades **F-SPEC-002-5** y **F-SPEC-002-6** | | ❌ |
| CA-10 las señales que no dependen del reloj | `src/mirror/analysis/compare.ts` (`isRetraction`, `replicatedErrors`, `persistentDiscrepancies` por rondas, exclusivos), `src/mirror/thresholds.ts` (`MIN_PERSISTENT_CAPTURES`) | `tests/mirror/analysis/verdict-content.test.ts` (8): **(a)** error transitorio replicado → ESPEJO **citando las cuatro claves**, y las cuatro existen en el store; (a-bis) un error que solo comete F no es replicado; **(b)** S con un hecho que F no tiene → no ESPEJO por error replicado; **(c)** horarios distintos en 2 capturas que convergen → **no** persistente; **(d)** los mismos en 3 capturas → INDEPENDIENTE; (e) partido que solo una fuente tiene → discrepancia de existencia; y que bajar un marcador es retractarse mientras subirlo es jugar. Salvedades **F-SPEC-002-4**, **F-SPEC-002-5**, **F-SPEC-002-7**, **F-SPEC-002-9** | | ❌ |
| CA-11 la muestra insuficiente es un veredicto | `src/mirror/analysis/verdict.ts` (puerta `n_comparable < N_MIN` antes de todo), `src/mirror/thresholds.ts` (`N_MIN = 10`) | `tests/mirror/analysis/sample-size.test.ts` (5): N = 9 → INCONCLUSO con motivo `muestra_insuficiente`; el informe lleva **el N observado y el N_min exigido** en las dos secciones (fuente y par); con N = 9 no se dicta ni ESPEJO ni INDEPENDIENTE; **N = 10 sí dicta veredicto**. Mutación: quitar la puerta pone la suite roja | | ❌ |
| CA-12 (RN-02) lo desconocido no es independencia | `src/mirror/analysis/verdict.ts` (`rn02_segunda_via_entre_automaticas` se fija en `decide()` y en `insufficient()`, en ninguna otra rama) | `tests/mirror/analysis/rn02.test.ts` (5): tabla sobre los tres veredictos producidos por tres ventanas distintas —INDEPENDIENTE → `true`, ESPEJO → `false`, INCONCLUSO → `false`—; el par lleva la misma bandera con la misma regla; **caso 5** recorre la función de decisión con cinco análisis sintéticos y comprueba `bandera === (veredicto === 'INDEPENDIENTE')` sin excepción | | ❌ |
| CA-13 veredicto accionable; el parcial es un veredicto | `src/mirror/analysis/report.ts` (esquema zod **local a la spec**, `z.strictObject` en todo), `src/mirror/analysis/analyze.ts`, `src/mirror/analysis/prose.ts`, `src/mirror/analysis/findings.ts` | `tests/mirror/analysis/report.test.ts` (13): el JSON valida; **una clave de más y una de menos lo invalidan igual**; lleva los cinco umbrales, la ventana y la cobertura por par; un veredicto por candidata y uno para el par; un párrafo en prosa por fuente que nombra RN-02; **caso 8** — fixture solo de contenido → valida, dicta veredicto y marca la temporal `pendiente` con la ventana prevista, y los contadores temporales son `null`; **casos 11-13** — la advertencia de la métrica de conflictos aparece si ninguna candidata es INDEPENDIENTE (en JSON **y** en prosa, con `hard_cut_15_percent_applies: false`) y no aparece si una lo es. `tests/mirror/analysis/findings.test.ts` (6): el documento vive en `docs/epicas/EPIC-001-spike-ingesta/hallazgos/test-de-espejo.md`, el JSON al lado, lleva umbrales y advertencia, y es determinista. Salvedad **F-SPEC-002-12** (aún no hay hallazgo escrito: no ha habido ventana) | | ❌ |
| CA-14 (RN-12 por analogía) cada afirmación cita sus capturas | `src/mirror/analysis/analyze.ts` (`eventEvidence`, `evidenceOf`), `src/mirror/analysis/compare.ts` (arrastra `raw_key` en `first_seen`, en los errores replicados y en las discrepancias) | `tests/mirror/analysis/citations.test.ts` (5): sobre una ventana con adelantos, exclusivos **y** error replicado, se recorren **todas** las claves citadas y `store.get()` devuelve algo para cada una; el recorrido mide algo (> 10 claves y los tres tipos presentes); cada adelanto cita 2 capturas y cada error replicado exactamente 4 distintas; y una clave inventada devuelve `null`, o sea que la comprobación sabe fallar | | ❌ |
| CA-15 (RN-02) el cruce de las dos candidatas | `src/mirror/analysis/verdict.ts` (`verdictBetweenCandidates`, `errorSignature`), `src/mirror/analysis/analyze.ts` (`pairReport` con el reparto de errores replicados) | `tests/mirror/analysis/pair.test.ts` (6): **(a)** adelantos mutuos 2 y 2 → INDEPENDIENTE con motivo `adelantos_mutuos`; **(b)** C1 adelanta 4 veces y C2 nunca → ESPEJO con `espejo_de: ceroacero`; **(c)** error replicado por las dos y **ausente de futgal** → `origen_comun_distinto_de_futgal: true` y la prosa lo nombra; **(d)** el mismo error presente también en futgal → cuenta en `replicated_errors_also_in_reference`; **(e)** N < 10 → INCONCLUSO y el par no habilita la segunda vía; (f) 2 adelantos en una sola dirección no son independencia mutua | | ❌ |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

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
- **F-SPEC-002-13 — §6 de las notas del gate sigue abierto, y no es mío.**
  `docs/epicas/EPIC-001-spike-ingesta/_epica.md` y `docs/roadmap.md` siguen
  afirmando el corte duro del 15 % **sin condición**. La advertencia de CA-13
  vive dentro del informe, así que el escenario está cubierto donde la spec lo
  pedía, pero los dos documentos de `sdd-producto` siguen diciendo la versión
  vieja. No los he tocado.
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
src/mirror/cli/                 capturar.ts / analizar.ts (+ sus dos entradas -cli.ts)
tests/mirror/                   124 casos + un fichero .test-d.ts
```

**Cómo se corre la ventana (fase A).**

1. Guardar el `robots.txt` de los tres sitios en disco (uno por origen).
2. Escribir `config.json` contra `WindowConfigSchema`
   (`src/mirror/capture/config.ts`): etiqueta de ventana, `duration_minutes`,
   `tick_seconds` (20 va bien: el limitador es quien cumple RN-11, no el bucle),
   los seis `targets` y `robots_files`.
3. `npm run mirror:capturar -- config.json ventana.json`. Sin
   `BLOB_READ_WRITE_TOKEN` archiva en `raw/` (ya ignorado por git); con él, en
   Vercel Blob. Escribe el registro de ticks en `ventana.json`.

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

**Qué falta, en orden.**

1. Que el gate se pronuncie sobre **F-SPEC-002-4, -5, -6, -7** (contradicciones
   resueltas por interpretación) y sobre **F-SPEC-002-9** (`team_spelling`, la
   única que puede falsear el veredicto en la dirección peligrosa).
2. Poner un contacto real en la User-Agent (**F-SPEC-002-1**).
3. Correr la ventana. La mitad de contenido no necesita partidos en juego; la
   temporal sí, y el informe sale igual con ella `pendiente`.
4. `sdd-documentalista`: runbook (**F-SPEC-002-14**) y, si el gate lo aprueba,
   el §6 de la spec (**F-SPEC-002-13**).

**Lo que NO se ha tocado, a propósito:** `src/model/`, `migrations/`,
`docs/fundacion/`, `FOUNDATION.md`, los ADR, `_epica.md` y `roadmap.md`. Ni un
`migrations/0002`. SPEC-001 sigue verde y cerrada.


## Arbitraje del gate humano — 2026-08-31 (Alberto Fojo)

Ratifica **las siete** interpretaciones que la enmienda 1 del 2026-08-31 lleva al
cuerpo de la spec. **La enmienda queda firmada entera**: a partir de aquí el
texto enmendado es el contrato, y es contra él —y no contra el texto aprobado por
la mañana— contra el que juzga `sdd-verificador`.

Registrado en tres tandas el mismo día, según se fueron desglosando: F-4, -5, -6
y -7; luego F-8 y F-10; luego F-9. El gate levantó además **F-SPEC-002-16** al
firmar el -10.

Nada de esto toca código: los siete puntos ratifican lo que
`sdd-implementador` ya había implementado y `sdd-arquitecto` ya había escrito en
la spec. El frontmatter `estado` sigue `en-revision`, sin tocar.

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
