---
id: SPEC-003
tipo: ledger
epica: EPIC-001
---
# Ledger — SPEC-003 Test de espejo sin referencia: el cruce entre candidatas

## Resumen
- Fase: **en revisión, segunda vuelta**. Spec **aprobada por Alberto Fojo el
  2026-08-31** e implementada por `sdd-implementador` el mismo día. Los 15 CA
  tienen código y test.
- **2026-08-31, cierre del RED (`sdd-implementador`).** La verificación devolvió
  RED con **una sola causa raíz**: ningún test de nivel informe construía un
  desenlace INCONCLUSO. Cerrado **sin tocar `src/`** — el diff de esta vuelta son
  tres ficheros de `tests/`—, porque la conducta ya era correcta y lo que faltaba
  era la red. Los seis planes de CA-6 viven ahora en **una sola tabla**
  (`REASON_PLANS`, en `tests/mirror/support/referenceless.ts`) que consumen a la
  vez el barrido de veredicto y los cuatro barridos de nivel informe: tenerla dos
  veces es cómo se llegó a que el veredicto se recorriese entero y el informe se
  probase sobre dos planes que daban los dos ESPEJO. Suite: **55 ficheros / 498
  casos**. Las **tres mutaciones** de esta vuelta se reprodujeron y muerden (ver
  *Los tests muerden*). Las columnas *Verif.* y *Estado* y el *Veredicto* siguen
  siendo del verificador y describen el RED de la vuelta anterior; no los he
  tocado.
- **El bloqueante previo está levantado:** ADR-008 §5 (capturar `besoccer.es`)
  quedó firmado por el gate el 2026-08-31, con sus cuatro límites, y ADR-009
  levantó el §5.3.
- **Sigue sin correrse ninguna ventana real**, y no puede correrse todavía: por
  ADR-009 §4, la fecha de purga se escribe en ESTE ledger **antes** de capturar,
  y no está escrita (F-SPEC-003-8).
- **2026-08-31, antes del gate: entra CA-15** (`sdd-arquitecto`). ADR-009 quedó
  **aprobado** ese mismo día con la opción B —30 días desde el fin de la ventana,
  una prórroga escrita, techo duro de 90— y su §5 dejaba pendiente «un CA que meta
  la fecha de purga en el informe», con destino SPEC-003 mientras siguiera en
  `borrador`. El gate lo pidió y entra. **Se añade CA-15 y nada más**: los CA-1 a
  CA-14 no se tocan y **no se renumera nada**. Coherencia arrastrada, sin cambiar
  ningún criterio: *Entidades* (ADR-005 deja de decir «retención sin definir» y se
  añade ADR-009), *Fuera de alcance* (el plazo está decidido; lo que entra es solo
  su declaración en el informe), notas del gate **§7** (los dos pasos de runbook de
  ADR-009 §4) y **§8.4** (qué queda por firmar). **La spec sigue en `borrador`.**
- Rama: **`ft/SPEC-003-test-de-espejo-sin-referencia`** (sacada de
  `ft/SPEC-002-test-de-espejo-entre-fuentes-automaticas`, cuyo PR #2 está abierto,
  verificado GREEN y esperando merge humano; por eso el trabajo no va allí). El
  nombre difiere del que anotó `sdd-arquitecto` en este mismo resumen; manda la
  rama real.
- **Nada de SPEC-002 se ha reescrito.** Sus 24 ficheros de test no tienen ni una
  línea de diferencia respecto de la base (`git diff --name-only` desde
  `3b633e9`), y de su código solo se han tocado, de forma **aditiva**,
  `src/mirror/window.ts`, `src/mirror/capture/{http,ports,capturer}.ts` — que es
  lo que CA-8, CA-9 y CA-10 piden y lo que su enunciado llama «regresión
  obligatoria».

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 modo declarado y no inferible | `src/mirror/analysis/mode.ts` (`ModalReportSchema`, `analyzeInMode`) · `src/mirror/analysis/referenceless/report.ts` (`modo`, `referencia`) | `tests/mirror/analysis/referenceless-report.test.ts` 1-3 (las cuatro combinaciones) · `tests/mirror/analysis/modes.test-d.ts` (`undeclared`, `invented`) | Las cuatro combinaciones pasan. **La prueba invertida muerde**: retirando las cinco directivas `@ts-expect-error` de `modes.test-d.ts`, `npx tsc --noEmit` da `modes.test-d.ts(28,47): error TS2379 … Property 'modo' is missing`. Residual F-SPEC-003-5 (el sobre `con-referencia`) aceptado: no lo ejecuta nadie hoy. | ✅ |
| CA-2 veredictos por candidata: no medidos | `src/mirror/analysis/referenceless/report.ts` (`UnmeasuredCandidateVerdictsSchema`, `UNMEASURED_CANDIDATE_VERDICTS`) | `tests/mirror/analysis/referenceless-report.test.ts` 4-7 y **25** (el bloque entero, `motivo` incluido, sobre los **seis** desenlaces de `REASON_PLANS`, INCONCLUSO incluido; y el barrido de claves `sources`/`reference` en los seis) | **1.ª vuelta:** bloque exigido por el esquema, `sources: []` no representable, y mi barrido propio de claves sobre **20 formas** no encuentra `sources` ni `reference` en ningún JSON. Salvedad entonces: los casos 4-5 solo corrían sobre un informe ESPEJO y mutar el `motivo` **solo en INCONCLUSO** dejaba la suite en 55/495 verde. **2.ª vuelta — cerrada.** El caso 25 recorre los **seis** desenlaces de `REASON_PLANS` (tres INCONCLUSO, contados por mí) y comprueba el bloque **entero** (`toEqual(UNMEASURED_CANDIDATE_VERDICTS)`) **más** los literales «robots.txt», «Disallow: /» y «RN-11» **escritos en el test**, no tomados del módulo; y repite en los seis el barrido de claves `sources`/`reference`. **Mutación B reproducida por mí:** `motivo → 'no medidos'` solo en la rama INCONCLUSO → `Tests 2 failed | 496 passed (498)`, casos 25 y 26, con `AssertionError: expected 'no medidos' to contain 'robots.txt'`. | ✅ |
| CA-3 origen comun probado vs atribuido | `src/mirror/analysis/referenceless/verdict.ts` (`verdictWithoutReference`, un solo parámetro) · `.../referenceless/report.ts` (`origen_comun_probado`, `atribucion_de_origen`, `origen_atribuido_a`) · `.../referenceless/analyze.ts` (`replicated_errors_total`, sin las dos categorías de la referencia) | `tests/mirror/analysis/referenceless-report.test.ts` 8-10 · `tests/mirror/analysis/referenceless-verdict.test.ts` 15-16 (estructural: arity 1, sin `errorSignature`) | `analyzeWithoutReference` no tiene parámetro de referencia y `verdictWithoutReference.length === 1`. Sobre **20 formas + 300 fuzz** propios: `origen_comun_probado === (replicated_errors_total > 0)` siempre, `atribucion_de_origen === 'no_comprobada'` y `origen_atribuido_a === null` siempre. **Mutación reproducida:** `origen_comun_probado = true` fijo → 2 casos en rojo (`referenceless-report` 9, `referenceless-verdict` 3). | ✅ |
| CA-4 INDEPENDIENTE no es emitible | `src/mirror/analysis/referenceless/verdict.ts` (`ReferencelessVerdict`, `decide`) | `tests/mirror/analysis/referenceless-verdict.test.ts` 1-2, 11 · `tests/mirror/analysis/modes.test-d.ts` (`independiente`, `fromReport`) | **Búsqueda adversarial propia sin resultado**: 20 formas construidas para forzar el sí (adelantos mutuos 4/8/20/40, discrepancias persistentes 1/5/12, mutuos+persistentes+exclusivos, error replicado + mutuos + persistentes) más **300 planes al azar** → veredicto siempre en {ESPEJO, INCONCLUSO}. **Mutación reproducida:** admitir `'INDEPENDIENTE'` en el tipo → `tsc`: `analyze.ts(150,5) TS2322` + `modes.test-d.ts(39,1) TS2578`. Sin la directiva: `TS2322: Type '"INDEPENDIENTE"' is not assignable to type 'ReferencelessVerdict'`. | ✅ |
| CA-5 (RN-02) la bandera es false siempre | `src/mirror/analysis/referenceless/verdict.ts` (literal `false`) · `.../referenceless/prose.ts` (`whyFalse`) | `tests/mirror/analysis/referenceless-verdict.test.ts` 11 (`REASON_PLANS`: los 6 motivos y los 2 veredictos), 12 (estructural: ninguna rama escribe `true`) · `modes.test-d.ts` (`flag`) | **`true` no es representable por los dos caminos, comprobado:** en el tipo (`typeof report.pair.rn02_…` es `false`; sin la directiva, `modes.test-d.ts(50,7): error TS2322: Type 'true' is not assignable to type 'false'`) y en zod (`z.literal(false)`). En las **320** ejecuciones adversariales la bandera es `false` y la prosa lleva «Por qué la bandera de RN-02 es false». **Mutación reproducida:** una rama escribe `true` en INCONCLUSO → 3 casos en rojo (`muestra_insuficiente`, `independencia_no_demostrable_sin_referencia`, `sin_senal`) **más** `modes.test-d.ts`. El tercer clause de la spec dice «cinco motivos» y el test recorre **seis**: superconjunto, no incumplimiento (F-SPEC-003-3). **2.ª vuelta — la tabla compartida NO ha debilitado este barrido, comprobado:** el fichero de veredicto sigue en **21 casos** (los mismos), el cuerpo del caso 11 es **idéntico línea a línea** al de la vuelta anterior (`git show 8445cc4:…`), las seis entradas se movieron **verbatim** a `REASON_PLANS` (mismos planes, y `pair` es solo un alias de `candidatesPlan`, que construye el mismo `Map`), y el tipo de la tabla **se estrechó** de `string` a `ReferencelessReason`. No se relajó ninguna aserción. | ✅ |
| CA-6 regla de decision del modo | `src/mirror/analysis/referenceless/verdict.ts` (`decide`, cinco ramas en orden) | `tests/mirror/analysis/referenceless-verdict.test.ts` 3-10 (una por rama + desempate 2 sobre 3 + orden 3 antes que 4) | Ocho casos: una por rama, el desempate 2>3 y el orden 3>4, y cada uno asserta **primero** que la señal está y supera su mínimo. **Mutación reproducida** (rama 2 deja de mandar sobre la 3): `1 failed / 494 passed`, y el rojo es exactamente el caso 9. | ✅ |
| CA-7 adelanto en una sola direccion no nombra espejo | `src/mirror/analysis/referenceless/verdict.ts` (`espejo_de: null`) · `.../referenceless/report.ts` (`espejo_de: z.null()`) | `tests/mirror/analysis/referenceless-verdict.test.ts` 7, 13-14 · `modes.test-d.ts` (`mirrorOf`) | `espejo_de` es `null` en las **320** ejecuciones adversariales, recorriendo el JSON entero a cualquier profundidad. Sin la directiva: `modes.test-d.ts(54,7): error TS2322: Type '"ceroacero"' is not assignable to type 'null'`. | ✅ |
| CA-8 pares declarados; cero intentos = 0 % | `src/mirror/window.ts` (`DeclaredPair`, `WindowLog.declared_pairs`, `windowCoverage`) · `src/mirror/capture/capturer.ts` (`log()`) | `tests/mirror/analysis/declared-pairs.test.ts` 1-4, 7 (el 2 es el que demuestra que arregla algo) | Los declarados entran primero y a cero, `attempted === 0 → ratio 0`, que cae bajo cualquier umbral. El caso 2 (mismo registro sin el conjunto declarado → válido) demuestra que arregla algo. El caso 7 comprueba que quien declara es el capturador. Residual F-SPEC-003-7 (un `targets` mal escrito en el config) aceptado y con destino. | ✅ |
| CA-9 la negativa de CA-5 sobre los pares declarados | `src/mirror/window.ts` (`InvalidWindowError`, sin la constante «seis») · `src/mirror/cli/analizar-sin-referencia.ts` | `tests/mirror/analysis/declared-pairs.test.ts` 5-6 · `tests/mirror/cli/referenceless-cli.test.ts` 2 (sale con error y no crea `hallazgos/`) | El mensaje nombra los cuatro pares con ratio, marca `BELOW`/`ok` y el umbral. El caso de CLI arranca `node` como subproceso: sale con error, `stderr` lleva `2 of 4 (source, competition) pairs` y `90 %`, y `hallazgos/` **no existe**. | ✅ |
| CA-10 (RN-11) ninguna peticion cambia de host en silencio | `src/mirror/capture/http.ts` (`RedirectNotFollowedError`, `politeFetch`, `globalFetcher` con `redirect: 'manual'`) · `src/mirror/capture/ports.ts` (`HttpResponse.location`) | `tests/mirror/capture/redirects.test.ts` 1-4 (301 real contra servidor local; 200 sin regresión; estructural de puerta única) | Verificado con **servidores reales, no dobles**, y ampliado por mí a **301, 302, 303, 307 y 308**: en los cinco, 0 capturas archivadas, tick `failed`, `raw_ref: null`, motivo con el código, la URL pedida y el `Location`. Y el contador del host de destino queda **en cero**: el otro host nunca recibe una petición. Un 200 se sigue archivando. La puerta es única: `globalThis.fetch` solo aparece en `http.ts` y siempre con `redirect: 'manual'`; `robots.txt` se lee de fichero, no de red. | ✅ |
| CA-11 limitaciones declaradas, en JSON y en prosa | `src/mirror/analysis/referenceless/report.ts` (`DECLARED_LIMITATIONS`) · `.../referenceless/prose.ts` | `tests/mirror/analysis/referenceless-report.test.ts` 11-13 y **24** · los seis planes en `tests/mirror/support/referenceless.ts` (`REASON_PLANS`) | **1.ª vuelta: RED** — el caso 11 recorría dos planes (`MIRRORED`, `REPLICATED`), los dos ESPEJO, y ningún informe INCONCLUSO se construía en toda la suite; degradar el texto solo en INCONCLUSO dejaba la suite 55/495 verde. **2.ª vuelta — cerrada, y contado por mí, no leído.** Instrumenté `analyzeWithoutReference` para volcar `verdict`+`reason` de **cada** informe que se construye en la suite entera: llegan los **seis** motivos, **3 INCONCLUSO** (`muestra_insuficiente`, `independencia_no_demostrable_sin_referencia`, `sin_senal`) y **3 ESPEJO** — exactamente lo declarado; antes eran 3 planes y los 3 ESPEJO. Los casos 11 y 12 recorren los seis, comparan el bloque **entero** (`toEqual(DECLARED_LIMITATIONS)`) y además exigen **frases literales escritas en el test**. **Mutación A reproducida:** degradar `limitaciones_declaradas` y `conflict_metric_warning.text` solo en la rama INCONCLUSO → `Tests 3 failed | 495 passed (498)`, casos 11, 12 y 14. **Y no es tautológico:** degradando las **propias constantes del módulo** (`DECLARED_LIMITATIONS`, `REFERENCELESS_CONFLICT_WARNING_TEXT`) la suite se pone roja igual → `2 failed`, casos 11 y 14. | ✅ |
| CA-12 advertencia de conflictos incondicional | `src/mirror/analysis/referenceless/report.ts` (`REFERENCELESS_CONFLICT_WARNING`, no nulable) | `tests/mirror/analysis/referenceless-report.test.ts` 14-15 y **24** | **1.ª vuelta: RED** — el caso 14 recorría dos planes, ambos ESPEJO; sustituir `text` solo en los desenlaces INCONCLUSO dejaba la suite 55/495 verde. **2.ª vuelta — cerrada.** El caso 14 recorre los **seis** motivos y por tanto **los dos veredictos** (medido: 3 y 3), compara el **texto entero** (`toBe(REFERENCELESS_CONFLICT_WARNING_TEXT)`), sigue exigiendo `hard_cut_15_percent_applies: false`, que **no** sea el `CONFLICT_METRIC_WARNING_TEXT` de SPEC-002 y el literal «ninguna se ha medido», escrito en el test. **Mutación A reproducida:** el caso 14 es uno de los tres rojos. El caso 15 (no nulable) se mantiene sin tocar. | ✅ |
| CA-13 fichero de hallazgo propio | `src/mirror/analysis/referenceless/findings.ts` | `tests/mirror/analysis/referenceless-findings.test.ts` 1-7 · `tests/mirror/cli/referenceless-cli.test.ts` 1 | Los dos ficheros propios se escriben, los de SPEC-002 quedan byte a byte intactos, el `.md` declara el modo en su primera línea y el `.json` lleva `modo`/`referencia: null`. **Salvedad sobre la cláusula «cada uno de los cuatro»:** el `.md` de SPEC-002 no nombra su modo. La justificación registrada en F-SPEC-003-4 —«CA-14 lo impide»— era **falsa y lo medí**. **2.ª vuelta:** el texto **se ha corregido y lo he vuelto a medir** — añadiendo `(modo \`con-referencia\`, SPEC-002)` a esa cabecera la suite sale **55 ficheros / 498 casos verde**, así que el coste técnico sigue siendo cero. El texto nuevo de F-SPEC-003-4 **es honesto**: retracta la afirmación falsa nombrándola, registra la medición, da el motivo real —no reabrir SPEC-002, que está `hecho` con su PR #2 verificado GREEN esperando merge— y **declara explícitamente que la decisión no es suya sino del gate humano**. No pretende que la conducta esté forzada. **La salvedad se mantiene, y no por el motivo escrito sino por la conducta:** la cabecera **no se ha tocado**, así que la cláusula «cada uno [de los cuatro] dice en su primera línea qué modo lo produjo» sigue sin cumplirse para el `.md` de SPEC-002. El *Test* del CA sí está entero (los dos ficheros propios se escriben, los de SPEC-002 quedan byte a byte intactos, y el `.md` y el `.json` de este modo llevan el modo). **Decisión pendiente del humano.** | ⚠️ |
| CA-14 lo heredado se hereda, y se prueba | `src/mirror/analysis/referenceless/analyze.ts` (reutiliza `comparePair`, `readArchive`, `DECLARED_THRESHOLDS`) | `tests/mirror/analysis/referenceless-inherited.test.ts` 1-9 · suite de SPEC-001+SPEC-002 aislada: **47 ficheros / 415 casos**, sin una sola expectativa cambiada (ver *Gates*) | **Ni un test de SPEC-002 se ha tocado:** `git diff --name-status 3b633e9..HEAD` no marca ningún fichero de `tests/` como `M`; los 10 de SPEC-003 son `A`. Suite aislada reproducida por mí: **47 ficheros / 415 casos**, idéntica a la base. El renombrado `pair.sources` → `pair.candidatas` vive **solo** en el esquema nuevo (`referenceless/report.ts`): `src/mirror/analysis/report.ts` no está en el diff y su informe sigue validando contra `MirrorReportSchema` sin `modo` (caso 23). Determinismo verificado por mí con **cuatro relojes** (2026-01-01, 2026-12-31, 2027-06-15, 2099-01-01): un solo JSON y un solo `.md`. Todas las claves citadas resuelven con `store.get()`. **2.ª vuelta — el congelado aguanta, remedido:** `git diff --name-status 3b633e9..HEAD -- tests/` sigue sin marcar **ni un** fichero de SPEC-002 como `M` (los 10 de SPEC-003 son `A`), y la suite aislada vuelve a salir **47 ficheros / 415 casos**, idéntica a la base. `src/` **no se ha tocado en esta vuelta**: `git diff --name-status 8445cc4..HEAD` son cinco ficheros, dos de `docs/` y tres de `tests/`. | ✅ |
| CA-15 (ADR-009) el informe declara su fecha de purga | `src/mirror/analysis/referenceless/retention.ts` · `.../referenceless/report.ts` (`ArchiveRetentionSchema`, `end` no nulable) · `.../referenceless/prose.ts` (`proseRetention`) | `tests/mirror/analysis/retention.test.ts` 1-7 · `tests/mirror/analysis/referenceless-report.test.ts` 16-22 y **26** (las ocho claves y las tres fechas, recomputadas a mano, sobre los **seis** desenlaces) · `tests/mirror/analysis/referenceless-inherited.test.ts` 3 (determinismo con dos relojes) | **Aritmética recomputada a mano, sin las utilidades del proyecto:** `end = 2026-09-05T17:09:00.000Z` → `purga_prevista = 2026-10-05T17:09:00.000Z` (`Date.parse(end)+30·86 400 000`) y `purga_maxima = 2026-12-04T17:09:00.000Z` (+90 d); coinciden al milisegundo. `fin_de_ventana === window.end`. **El ancla es el archivo y no el log**, comprobado por mí con un tick `failed` **seis horas** posterior a la última captura `ok`: las tres fechas no se mueven. **Ninguna ruta consulta el reloj**, comprobado con cuatro `vi.setSystemTime` distintos → JSON y `.md` byte a byte idénticos. **Mutación reproducida:** anclar en `Date.now()` → **10 casos en rojo en 4 ficheros** (el ledger declaraba 9 en 3), incluidos los tres de determinismo y el estructural de `Date.now()`. **Salvedad de la 1.ª vuelta, ahora cerrada:** el CA dice «Dado **cualquier** informe de este modo» y ningún informe INCONCLUSO se probaba; degradar `purga_prevista` solo en INCONCLUSO dejaba la suite 55/495 verde. **2.ª vuelta:** el caso 26 recorre los **seis** desenlaces —tres de ellos INCONCLUSO— y en cada uno comprueba las ocho claves, `fin_de_ventana === window.end`, las dos fechas recomputadas con aritmética propia del test (`+30`/`+90 × 86 400 000 ms`, constantes literales) y que la **prosa** repite las tres. **Mutación B reproducida por mí:** `purga_prevista → purga_maxima` solo en INCONCLUSO → `2 failed | 496 passed`, con `expected '2026-12-04T17:09:00.000Z' to be '2026-10-05T17:09:00.000Z'`. | ✅ |

## Gates de calidad (los ejecutó `sdd-implementador`; no hay CI)

Base antes de tocar nada: **46 ficheros / 415 casos**. Al cerrar la primera
vuelta: **55 ficheros / 495 casos**.

**Segunda vuelta (cierre del RED).** Base de esta vuelta: **55 / 495**. Los tres
casos nuevos (24, 25 y 26 de `referenceless-report.test.ts`) suman **498**; los
casos 11, 12 y 14 se extendieron en su sitio, así que no cambian el conteo.
Salida literal al cerrar:

```
$ npm run lint

> marcador@0.0.1 lint
> oxlint --type-aware


$ npx tsc --noEmit
(sin salida: sin errores)

$ npx vitest run

 RUN  v4.1.11 /Users/albertofojo/src/tremen-dev/marcador.gal


 Test Files  55 passed (55)
      Tests  498 passed (498)
Type Errors  no errors
```

**`src/` no se ha tocado en esta vuelta.** `git diff --name-only 8445cc4..HEAD`
son tres ficheros, los tres de `tests/`:
`tests/mirror/analysis/referenceless-report.test.ts`,
`tests/mirror/analysis/referenceless-verdict.test.ts` y
`tests/mirror/support/referenceless.ts`. Nada en `src/` lo exigía: el veredicto y
el informe ya se comportaban bien en las seis ramas —lo comprobó el verificador y
lo he vuelto a comprobar—, y lo que faltaba era la red.

**Cobertura del linter, medida y no supuesta** (F-SPEC-001-22: en SPEC-001 el
bloqueante fue un `npm run lint` en verde que no miraba los ficheros nuevos).
`npx oxlint --type-aware --debug=files` lista los 19 ficheros nuevos, uno por uno:

```
src/mirror/analysis/mode.ts
src/mirror/analysis/referenceless/analyze.ts
src/mirror/analysis/referenceless/findings.ts
src/mirror/analysis/referenceless/prose.ts
src/mirror/analysis/referenceless/report.ts
src/mirror/analysis/referenceless/retention.ts
src/mirror/analysis/referenceless/verdict.ts
src/mirror/cli/analizar-sin-referencia-cli.ts
src/mirror/cli/analizar-sin-referencia.ts
tests/mirror/analysis/declared-pairs.test.ts
tests/mirror/analysis/modes.test-d.ts
tests/mirror/analysis/referenceless-findings.test.ts
tests/mirror/analysis/referenceless-inherited.test.ts
tests/mirror/analysis/referenceless-report.test.ts
tests/mirror/analysis/referenceless-verdict.test.ts
tests/mirror/analysis/retention.test.ts
tests/mirror/capture/redirects.test.ts
tests/mirror/cli/referenceless-cli.test.ts
tests/mirror/support/referenceless.ts
```

(Los 19 ficheros nuevos y `tests/mirror/support/referenceless.ts` siguen
listados uno por uno tras el cambio; los tres ficheros tocados en esta vuelta
están en esa lista.)

**CA-14, la suite de SPEC-002 aislada.** Excluyendo solo los nueve ficheros
nuevos, la suite anterior sale exactamente como estaba, con el mismo número de
casos y sin una expectativa cambiada:

```
$ npx vitest run --exclude ... (los 9 ficheros de SPEC-003)

 Test Files  47 passed (47)
      Tests  415 passed (415)
Type Errors  no errors
```

(47 y no 46 porque el fichero `.test-d.ts` de SPEC-003 entra igualmente por la
configuración de `typecheck`, que tiene su propio `include`; los **415 casos** son
la cifra que importa y es idéntica a la base.)

## Los tests muerden: comprobación por mutación

En SPEC-002 un CA entero pasó dos verificaciones con la conducta implementada y
**sin red**: borrar la rama dejaba la suite verde. Aquí cada declaración
*load-bearing* se ha mutado a propósito y se ha comprobado que la suite se pone
roja. Todas las mutaciones se revirtieron.

| Mutación | Qué se rompió | Resultado |
|---|---|---|
| **CA-6, rama 2 sobre la 3.** El error replicado deja de mandar sobre los adelantos mutuos (`replicated_errors.length > 0 && !(aLeads && bLeads)`) | el desempate que aparta este modo del paso 2 de SPEC-002 CA-10 | `referenceless-verdict` **caso 9 en rojo**, resto verde (1 failed / 20 passed) |
| **CA-5.** Una rama escribe `true` en `rn02_segunda_via_entre_automaticas` cuando el veredicto es INCONCLUSO | la bandera deja de ser `false` en todos los desenlaces | **3 casos en rojo** (`muestra_insuficiente`, `independencia_no_demostrable_sin_referencia`, `sin_senal`) |
| **CA-3.** `origen_comun_probado` pasa a ser `true` siempre | «no lo hemos comprobado» se vuelve indistinguible de «lo hemos probado» | **2 casos en rojo** (`referenceless-verdict` 3, `referenceless-report` 9) |
| **CA-2.** El informe recupera una clave llamada `sources`, a `[]` | la lista vacía que se lee como «se midió y no salió nada» | **2 casos en rojo** (`referenceless-report` 6 y 7) |
| **CA-15.** `archiveRetention` ancla en `Date.now()` en vez de en `window.end` | el determinismo de SPEC-002 CA-7, que es lo que permite verificar una ventana no presenciada | **9 casos en rojo** en tres ficheros, incluidos los tres de determinismo y el estructural de `Date.now()` |
| **CA-4.** `ReferencelessVerdict` admite `'INDEPENDIENTE'` | el dominio de veredictos del modo | `tsc` falla: `TS2322` en `analyze.ts` y **`TS2578: Unused '@ts-expect-error'`** en `modes.test-d.ts` |
| **CA-1.** `ModalAnalyzeInput` admite omitir `modo` | «el punto de entrada exige el modo, no hay valor por defecto» | `tsc` falla con **`TS2578: Unused '@ts-expect-error'`** en `modes.test-d.ts:27` |

Los CA-8, CA-9, CA-10 y CA-13 no necesitaron mutación: se escribieron en RED
—test primero, fallando por la conducta ausente— y la salida roja consta en el
ciclo (`declared_pairs` inexistente, `outcome: 'ok'` donde debía haber `failed`,
`redirect: 'manual'` ausente de `http.ts`, módulo de hallazgo inexistente).

### Segunda vuelta: las mutaciones del RED, y que ahora sí muerden

El encargo es explícito y tiene razón: **un test que existe no es un test que
muerde.** Las dos mutaciones que el verificador describe se reprodujeron **antes**
de escribir nada, para ver el fallo con mis propios ojos, y **después** con los
tests puestos. Se corrieron por separado, una por hallazgo. Todas revertidas
(`git checkout --`; árbol limpio, comprobado).

**Paso 0 — reproducir el fallo.** Con las dos degradaciones a la vez y los tests
de la primera vuelta, la suite entera sigue verde, exactamente como se midió:

```
$ npx vitest run          # mutación V1+V2, tests de la vuelta anterior

 Test Files  55 passed (55)
      Tests  495 passed (495)
Type Errors  no errors
```

**Mutación A (F-SPEC-003-V1) — CA-11 y CA-12.** En `analyze.ts`, con
`MUT = pair.verdict === 'INCONCLUSO'`: la afirmación `independiente_no_emitible`
pierde su texto (41 caracteres, para que el esquema siga validando) y
`conflict_metric_warning.text` se sustituye por `'texto degradado para
INCONCLUSO'` — **solo en la rama INCONCLUSO**.

```
 ❯ tests/mirror/analysis/referenceless-report.test.ts (26 tests | 3 failed) 481ms
     × 11. las cinco afirmaciones están en el JSON de los SEIS motivos, íntegras 87ms
     × 12. y la prosa las repite en castellano corrido, en los seis 5ms
     × 14. está en los DOS veredictos y en los seis motivos, y su texto no es el de SPEC-002 1ms

 Test Files  1 failed | 54 passed (55)
      Tests  3 failed | 495 passed (498)
Type Errors  no errors
```

**Mutación B (F-SPEC-003-V2) — CA-2 y CA-15.** Con el mismo interruptor:
`veredictos_por_candidata.motivo` pasa a `'no medidos'` —una cadena no vacía, así
que el esquema la acepta— y `purga_prevista` se falsea a `purga_maxima`. Otra vez
**solo en INCONCLUSO**.

```
 ❯ tests/mirror/analysis/referenceless-report.test.ts (26 tests | 2 failed) 601ms
     × 25. (CA-2) el bloque de veredictos no medidos es el mismo en los seis 3ms
     × 26. (CA-15) las tres fechas se sostienen en los seis, recomputadas a mano 0ms

 Test Files  1 failed | 54 passed (55)
      Tests  2 failed | 496 passed (498)
Type Errors  no errors
```

```
AssertionError: expected 'no medidos' to contain 'robots.txt'

Expected: "robots.txt"
Received: "no medidos"

 ❯ tests/mirror/analysis/referenceless-report.test.ts:405:28
```

**Mutación C — la red de la red, que no estaba en los hallazgos y hace falta.**
Las dos anteriores prueban que los barridos muerden *mientras la tabla siga
cubriendo los seis motivos*. Si alguien la degrada, los barridos volverían a
pasar sin mirar nunca un INCONCLUSO, que es literalmente el fallo de la primera
vuelta reaparecido por otra puerta. Mutación: en `REASON_PLANS`, la entrada
`independencia_no_demostrable_sin_referencia` pasa a un plan que da ESPEJO.

```
 ❯ tests/mirror/analysis/referenceless-verdict.test.ts (21 tests | 1 failed) 343ms
     × 11. independencia_no_demostrable_sin_referencia no habilita la segunda vía 10ms
 ❯ tests/mirror/analysis/referenceless-report.test.ts (26 tests | 5 failed) 664ms
     × 11. las cinco afirmaciones están en el JSON de los SEIS motivos, íntegras 83ms
     × 14. está en los DOS veredictos y en los seis motivos, y su texto no es el de SPEC-002 1ms
     × 24. el barrido cubre de verdad los dos veredictos y los seis motivos 0ms
     × 25. (CA-2) el bloque de veredictos no medidos es el mismo en los seis 1ms
     × 26. (CA-15) las tres fechas se sostienen en los seis, recomputadas a mano 2ms

 Test Files  2 failed | 53 passed (55)
      Tests  6 failed | 492 passed (498)
Type Errors  no errors
```

Que la mutación C ponga rojos **los dos** ficheros es el punto de haber dejado
una sola tabla: el barrido de veredicto y los de informe comparten planes, así
que no pueden volver a divergir en silencio.

**Un error mío, y lo dejo escrito porque el caso 24 lo cazó.** Escribí primero
`toHaveLength(4)` para los INCONCLUSO de la tabla; son **tres**
(`muestra_insuficiente`, `independencia_no_demostrable_sin_referencia` y
`sin_senal`) frente a tres ESPEJO. El caso falló contra la conducta real antes de
que yo corrigiese la cuenta, que es para lo que sirve escribir el test primero.

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

### Segunda vuelta — GREEN

**GREEN — 2026-08-31, `sdd-verificador`, segunda verificación.** 14 CA en ✅ y
**1 en ⚠️** (CA-13, salvedad justificada y aceptada, con una decisión que es del
gate humano). El RED de la primera vuelta queda más abajo, íntegro y sin
reescribir.

**Los gates, medidos otra vez y no heredados.** `npm run lint` (oxlint
`--type-aware`) limpio, y su **cobertura medida** (F-SPEC-001-22):
`npx oxlint --type-aware --debug=files` lista **137 ficheros** y entre ellos, uno
por uno, **los tres tocados en esta vuelta** —
`tests/mirror/analysis/referenceless-report.test.ts`,
`tests/mirror/analysis/referenceless-verdict.test.ts` y
`tests/mirror/support/referenceless.ts`. `npx tsc --noEmit` sin salida y con
exit 0. `npx vitest run`: **55 ficheros / 498 casos**, la base declarada. Ni un
`.skip`, `.only` ni `.todo` en `tests/` ni en `src/` (`grep -rnE
'\.(skip|only|todo)\s*[\(\`]'`: sin resultados). **CA-14 sigue congelando
SPEC-002**: suite aislada **47 ficheros / 415 casos**, y `git diff --name-status
3b633e9..HEAD -- tests/` no marca ningún fichero suyo como `M`.

**Que ahora sí se construyen informes INCONCLUSO: contado, no leído.** Instrumenté
`analyzeWithoutReference` en un worktree aislado para volcar `verdict` y `reason`
de **cada** informe que la suite entera construye. Llegan al generador **48
informes** que cubren **los seis motivos**, y el reparto por veredicto es
exactamente el declarado:

```
  27 ESPEJO      sin_contenido_propio
  17 ESPEJO      error_replicado
   1 ESPEJO      adelantos_en_una_sola_direccion
   1 INCONCLUSO  muestra_insuficiente
   1 INCONCLUSO  independencia_no_demostrable_sin_referencia
   1 INCONCLUSO  sin_senal
```

**3 INCONCLUSO y 3 ESPEJO.** En la vuelta anterior eran tres planes y los tres
ESPEJO: la causa raíz del RED está cerrada en su raíz y no en su síntoma.

**Las tres mutaciones declaradas se reproducen, con la cifra exacta.** Cada una
por separado, en worktree, revertidas después:

| Mutación | Declarado | Medido |
|---|---|---|
| **A** — `limitaciones_declaradas` + `conflict_metric_warning.text` degradados **solo** en la rama INCONCLUSO | 3 failed | `Tests 3 failed \| 495 passed (498)` — casos **11, 12 y 14** |
| **B** — `veredictos_por_candidata.motivo` vaciado y `purga_prevista` falseada a `purga_maxima`, **solo** en INCONCLUSO | 2 failed | `Tests 2 failed \| 496 passed (498)` — casos **25 y 26**, con `expected 'no medidos' to contain 'robots.txt'` y `expected '2026-12-04T…' to be '2026-10-05T…'` |
| **C** — la entrada INCONCLUSO de `REASON_PLANS` pasa a un plan que da ESPEJO | 6 failed | `Tests 6 failed \| 492 passed (498)` en **dos ficheros**: `referenceless-verdict` 11 y `referenceless-report` 11, 14, **24**, 25 y 26 |

**El caso 24 hace lo que dice, y lo he atacado por su punto débil.** No basta con
que caiga junto a los demás en la mutación C, porque ahí también caen los
barridos. Lo probé **degenerando la tabla del todo**: quité de `REASON_PLANS` las
**tres** entradas INCONCLUSO, dejándola con un solo veredicto — que es literalmente
el estado en que estaba la suite cuando devolví RED. Resultado: `Tests 1 failed |
494 passed (495)`, y **el único rojo es el caso 24**. Los cinco barridos (11, 12,
14, 25, 26) pasan en verde, vacuamente, sobre seis informes que ya no cubren más
que ESPEJO. Es exactamente la red de la red que se anunciaba, y es la **única**
que queda en pie en ese escenario.

**Y no es tautológico**, que era el otro riesgo. Dos comprobaciones:
1. Encogí **también el enum del módulo** (`ReferencelessReasonSchema`) para que
   acompañase a la tabla degenerada, de modo que la aserción contra `options`
   dejase de morder. El caso 24 **sigue rojo**: los conteos `toHaveLength(3)` y
   el conjunto `['ESPEJO','INCONCLUSO']` son literales del test y no derivan del
   módulo.
2. Degradé las **propias constantes** que los barridos comparan
   (`DECLARED_LIMITATIONS`, `REFERENCELESS_CONFLICT_WARNING_TEXT`) — el caso de
   «una constante comparada consigo misma». La suite se pone roja igual:
   `2 failed`, casos **11 y 14**, porque junto al `toEqual`/`toBe` contra el
   módulo los casos exigen **frases literales escritas en el test** («espejo de
   futgal», «robots.txt», «RN-11», «no de quién», «fuente oficial», «ninguna se
   ha medido», «Disallow: /»). El texto se compara **entero** y además se ancla
   fuera del módulo.

**La tabla compartida no ha debilitado el barrido de veredicto.** Antes había dos
tablas; ahora una, y el riesgo era que la unificación relajase el lado que ya
estaba bien. No lo ha hecho: el fichero de veredicto sigue en **21 casos**, el
cuerpo del caso 11 es **idéntico línea a línea** al de `8445cc4`, las seis
entradas se movieron **verbatim** (`pair` es un alias de `candidatesPlan`, que
construye el mismo `Map`), y el tipo de la tabla **se estrechó** de `string` a
`ReferencelessReason`. Ninguna aserción perdida.

**Los 11 CA que ya estaban en ✅ no se han rehecho, y no se han roto.** El diff de
la vuelta son **cinco ficheros** —dos de `docs/` y tres de `tests/`—, `src/` **no
se ha tocado** (`git diff --name-status 8445cc4..HEAD`), y de los dos de `docs/`
uno es este ledger y el otro son **dos líneas de historial** en el frontmatter de
la spec, que es lo que escribe `estado.mjs`: el cuerpo de la spec no tiene ni un
carácter de diferencia. Suite completa y suite aislada de SPEC-002 en verde.

**Los dos puntos abiertos, tratados como corresponde.**
- **F-SPEC-003-4 — el texto corregido es honesto.** Volví a medir el hecho en que
  se apoya: con `(modo con-referencia, SPEC-002)` añadido a la cabecera del
  hallazgo de SPEC-002 la suite sale **55 / 498 verde**, o sea coste técnico cero.
  El texto nuevo nombra la afirmación falsa y la retracta, registra la medición,
  da el motivo real —no reabrir SPEC-002, `hecho`, con su PR #2 verificado GREEN
  esperando merge— y **dice que la decisión no es suya**. No disfraza una
  preferencia de imposibilidad, que es lo que hacía el texto viejo. **La cabecera
  sigue sin tocarse y CA-13 se queda en ⚠️**: es conducta, no redacción, y la
  decisión es del gate humano.
- **F-SPEC-003-8 — mantengo el criterio.** La fecha de purga sigue sin escribirse
  en el ledger, y sigue **sin ser incumplimiento de ningún CA**: ADR-009 §4.1 es
  una precondición del operador **antes** de correr la ventana, la spec la deja
  fuera de alcance y la ventana no se ha corrido. Nada nuevo lo cambia. Bloqueante
  **operativo** del humano, no del código.

**Observación menor, sin efecto sobre ningún CA.** El comentario de la línea 188
de `referenceless-report.test.ts` dice «cuatro de los seis son INCONCLUSO»; son
**tres**. La aserción del caso 24 y el comentario de la línea 387 dicen tres, que
es lo correcto y lo que he medido. Es un comentario obsoleto, no una aserción.

### Primera vuelta — RED (se conserva íntegro)

**RED — 2026-08-31, `sdd-verificador`.** 11 CA en ✅, 2 en ⚠️ y **2 en ❌**.

**Los gates automáticos pasan y no son el problema.** `npm run lint` (oxlint
`--type-aware`) sale limpio y su **cobertura está medida y no supuesta**
(F-SPEC-001-22): `npx oxlint --type-aware --debug=files` lista los 19 ficheros
nuevos **y los 4 tocados de SPEC-002**, uno por uno. `npx tsc --noEmit` sin
salida. `npx vitest run`: **55 ficheros / 495 casos**, sin un solo `.skip`,
`.only` ni `.todo` en `tests/` ni en `src/`. La suite de SPEC-001+SPEC-002
aislada sale en **47 ficheros / 415 casos**, idéntica a la base, y **ningún
fichero de test suyo aparece como modificado** en `git diff --name-status
3b633e9..HEAD`.

**Las tres declaraciones que el gate firmó se sostienen, y las he atacado.**
Construí 20 fixtures adversariales —adelantos mutuos de 4, 8, 20 y 40 partidos;
discrepancias persistentes de 1, 5 y 12; las dos a la vez; error replicado
concurriendo con las dos— más **300 planes generados al azar**, y en las 320
ejecuciones el veredicto cae siempre en {ESPEJO, INCONCLUSO}, la bandera de RN-02
es `false` recorriendo el JSON a cualquier profundidad, y `espejo_de` es `null`.
`true` no es representable **por los dos caminos**: en el tipo
(`TS2322: Type 'true' is not assignable to type 'false'` al retirar la directiva)
y en zod (`z.literal(false)`). Ninguna ruta consume firmas de la referencia: el
parámetro no existe, `verdictWithoutReference.length === 1`, y `analyze.ts` del
modo no importa nada de futgal. **Las siete mutaciones declaradas se reprodujeron
todas** (una de ellas más severa de lo anunciado: la de `Date.now()` pone 10
casos en rojo en 4 ficheros, no 9 en 3), y las cinco directivas
`@ts-expect-error` de `modes.test-d.ts` muerden: retiradas, `tsc` da los cinco
errores esperados. CA-10 lo verifiqué contra **servidores reales** y en los cinco
códigos 3xx (301, 302, 303, 307, 308): cero bytes archivados, tick `failed` con
código + URL + `Location`, y **el host de destino no recibe ni una petición**.

**Por qué es RED, y es una sola causa raíz.** *Ningún test de nivel informe
construye jamás un desenlace INCONCLUSO.* Los tres únicos planes que llegan a
`analyzeWithoutReference` en toda la suite —`MIRRORED`, `REPLICATED` y `rich()`—
dan los tres **ESPEJO** (`sin_contenido_propio`, `error_replicado`,
`error_replicado`). Y CA-11 («un informe de **cada uno de los cinco motivos**»),
CA-12 («los informes de **los dos veredictos** y de los cinco motivos»), CA-2
(«dado **el** informe de este modo») y CA-15 («dado **cualquier** informe de este
modo») son criterios sobre *todo* informe. Lo medí con dos mutaciones que
degradan el informe **solo cuando el veredicto es INCONCLUSO**: la suite se queda
en **55 ficheros / 495 casos verde** mientras `limitaciones_declaradas` pierde una
afirmación, `conflict_metric_warning.text` se sustituye, el `motivo` de
`veredictos_por_candidata` se vacía y `purga_prevista` se falsea. Es exactamente
el fallo que costó una vuelta en SPEC-002 —conducta implementada y sin red— y
cae sobre la mitad del dominio de veredictos que la propia spec llama la más
probable de leer con desconfianza.

**Lo que NO es un hallazgo.** F-SPEC-003-3 (la spec dice «cinco motivos» y CA-6
define seis) no es incumplimiento: los tests de CA-5 recorren los seis, que es
superconjunto. F-SPEC-003-8 (la fecha de purga no está escrita) tampoco: ADR-009
§4.1 es una **precondición del operador antes de correr la ventana**, la spec la
declara fuera de alcance y la ventana no se ha corrido; queda como bloqueante
operativo del humano, no del código. F-SPEC-003-5 y F-SPEC-003-6 se aceptan como
residuales declarados.

**Cómo se cierra.** Tres cosas, ninguna de ellas un cambio de conducta:
1. **CA-11 y CA-12** — extender los casos 11, 12 y 14 de
   `referenceless-report.test.ts` a un informe **por cada uno de los seis
   motivos** de CA-6, con al menos un INCONCLUSO. Los planes ya existen en
   `referenceless-verdict.test.ts` caso 11.
2. **CA-2 y CA-15** — añadir a esos mismos barridos la comprobación del `motivo`
   («robots.txt», «RN-11») y de las tres fechas del bloque de retención sobre un
   informe INCONCLUSO.
3. **CA-13 / F-SPEC-003-4** — corregir el motivo registrado: la cabecera del
   hallazgo de SPEC-002 **se puede** tocar sin romper su suite (medido: 55/495
   verde). Si se decide no tocarla, el motivo es «no reabrir SPEC-002» (§Diseño 1,
   §8), no CA-14.

Nada de esto exige tocar `src/`. Con esas tres, y con la mutación
correspondiente comprobada, la spec vuelve a verificación.

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-003/. Informe HTML opcional: _qa/SPEC-003/informe.html -->

No aplica: SPEC-003 no tiene superficie de UI. La evidencia es de línea de
comandos y está transcrita en la matriz y en el veredicto. Las dos
verificaciones se hicieron sobre un `git worktree` aislado en `HEAD` —`8445cc4`
la primera, `7448b9e` la segunda— para poder instrumentar y mutar sin tocar el
árbol de trabajo. El worktree se retiró al terminar (`git worktree remove` +
`prune`) y el árbol queda como estaba salvo este ledger.

## Salvedades / follow-ups
<!-- IDs F-SPEC-003-1, F-SPEC-003-2… con destino (spec futura o EPIC-MEJORA). -->

- **F-SPEC-003-1 — El informe de SPEC-002 no lleva bloque de retención, y ADR-009
  §1 también cubre su ventana.** ADR-009 fija el plazo para **todas** las ventanas
  de medición de EPIC-001, incluida la de SPEC-002 si la RFGF autoriza a capturar
  futgal. CA-15 mete el bloque `retencion_del_archivo` **solo** en el informe del
  modo `sin-referencia`: el del modo `con-referencia` no puede tocarse sin mover el
  contrato de SPEC-002, que está `hecho` y cuyo PR #2 espera merge con un GREEN que
  dejaría de significar lo que dice (CA-14 exige además que su suite siga verde sin
  cambiar una sola expectativa). **Consecuencia declarada:** si algún día se corre
  la ventana con referencia, su informe llevará la fecha de purga solo en el
  ledger. **Destino:** una eventual enmienda 2 de SPEC-002, o la spec que reabra
  ese modo — lo que llegue antes. No bloquea nada hoy: hoy ese modo no es
  ejecutable, que es la razón de existir de esta spec.
- **F-SPEC-003-2 — La purga no la sostiene ningún test, y CA-15 no la sostiene
  tampoco.** CA-15 hace verificable que el informe **declare** su fecha; que
  alguien **borre** los bytes ese día es una anotación manual en este ledger
  (ADR-009 §4), y ADR-009 lo firma sabiéndolo. **Destino:** la decisión de
  retención de producción (ADR-009 §6, F-SPEC-001-1), que tiene que ser automática
  porque allí no hay operador en el bucle.

- **F-SPEC-003-3 — CA-5 y CA-11 dicen «los cinco motivos de CA-6», y CA-6 define
  seis.** La regla de decisión tiene **cinco ramas** pero **seis motivos**
  distintos, porque la rama 4 emite `sin_contenido_propio` o
  `adelantos_en_una_sola_direccion` según cuál disparó. Los tests de CA-5 y CA-11
  recorren los **seis**, que es superconjunto de los cinco y no deja ninguno sin
  cubrir; no se ha resuelto la contradicción de redacción en silencio ni se ha
  tocado el texto de la spec. **Destino:** aclaración en una eventual enmienda de
  SPEC-003, o nota del verificador. No cambia ninguna conducta.
- **F-SPEC-003-4 — CA-13 pide que «cada uno» de los cuatro ficheros diga en su
  primera línea qué modo lo produjo, y el `.md` de SPEC-002 no lo dice.**
  *(Motivo corregido el 2026-08-31 tras F-SPEC-003-V3; lo que sigue sustituye al
  texto anterior, que era falso.)*

  Su *Test* solo exige que «el `.md` y el `.json`» de **este** modo lleven el
  modo, y eso está hecho.

  **Lo que decía este follow-up y no es cierto:** que tocar la cabecera del
  hallazgo de SPEC-002 rompería su suite y que CA-14 lo impide. **No lo impide, y
  está medido:** el verificador añadió `(modo con-referencia, SPEC-002)` a esa
  primera línea y la suite entera salió **55 / 495 verde**, porque ninguna
  expectativa de SPEC-002 asserta esa línea. CA-14 no dice nada de esto.

  **El motivo verdadero, que es el que se sostiene:** **no reabrir SPEC-002.**
  SPEC-002 está en `hecho`, que es terminal, y su **PR #2 está abierto, verificado
  GREEN y esperando merge humano**. Su salida es el artefacto contra el que se
  emitió ese GREEN; cambiarla ahora —aunque ningún test se ponga rojo— mueve lo
  verificado por debajo de una verificación ya firmada, que es exactamente el
  argumento del §Diseño 1 de esta spec y el mismo que sostiene a F-SPEC-003-1 y
  F-SPEC-003-5. **Que se pueda no es que se deba.**

  Mientras tanto los dos ficheros se distinguen igual por su **nombre**
  (`test-de-espejo.md` frente a `test-de-espejo-sin-referencia.md`) y el de este
  modo dice además, en su segundo párrafo, que **no** es el informe de SPEC-002.

  **La cabecera no se ha tocado, y no es mía la decisión de tocarla**: queda para
  el gate humano, con el coste real ya medido (ninguno técnico, y uno de
  procedimiento). **Destino:** el mismo que F-SPEC-003-1 — enmienda 2 de SPEC-002
  o la spec que reabra ese modo.
- **F-SPEC-003-5 — La rama `con-referencia` de la unión de CA-1 es un sobre, no
  el informe que SPEC-002 emite hoy.** CA-1 exige una unión discriminada con las
  dos ramas, y la rama del modo con referencia se ha construido extendiendo
  `MirrorReportSchema` con `modo` y `referencia`, **sin tocar** ni el esquema ni
  el `analyze` de SPEC-002, que siguen emitiendo exactamente lo que emitían.
  **Consecuencia declarada:** si algún día se corre el modo con referencia a
  través de `analyzeInMode`, su JSON llevará `reference` (de SPEC-002) y
  `referencia` (del sobre), redundantes. Hoy no lo corre nadie: ese modo no es
  ejecutable, que es la razón de existir de esta spec. **Destino:** el mismo que
  F-SPEC-003-1.
- **F-SPEC-003-6 — `EmptyArchiveError`, un caso que ningún CA nombra.** Una
  ventana que pasa la validez de CA-5 pero cuyo archivo no rinde ni una captura
  legible no tiene `window.end`, y por CA-15.2 un informe sin fecha de purga no es
  un informe de este modo. Se lanza un error con nombre en vez de emitir un
  informe con una fecha inventada o nula. No está en ningún CA; se declara por si
  el verificador prefiere otra cosa. **Destino:** nota. No bloquea.
- **F-SPEC-003-7 — `declared_pairs` lo escribe el capturador desde sus propios
  `targets`, así que no ve un `targets` mal escrito en el fichero de
  configuración.** CA-8 nombra dos disparadores: «un `targets` mal escrito» y «un
  `robots.txt` que no se cargó y dejó la fuente fuera». Lo implementado cierra
  todo lo que ocurre **después** de que el capturador reciba sus objetivos: un
  registro truncado, uno fusionado a mano, una corrida que murió a media hora, o
  un análisis lanzado sobre un log al que le falta un par — en todos esos casos el
  par ausente sale a `0.0 % (0/0)` e invalida la ventana. Lo que **no** puede
  detectar es un par que nunca estuvo en el `config.json`, porque entonces no está
  ni en los ticks ni en la declaración. Cerrar eso del todo exigiría que el
  conjunto de cuatro pares viviese fuera del config —en el runbook— y se comparase
  contra él, y el runbook es de `sdd-documentalista` (spec, *Notas para el gate*
  §7). **Destino:** la segunda entrada de runbook del modo sin referencia.
- **F-SPEC-003-8 — BLOQUEANTE OPERATIVO: la fecha de purga no está escrita, y sin
  ella la ventana no se corre.** ADR-009 §4.1 es explícito: «la fecha de purga se
  escribe ANTES de capturar, junto al registro de ventana y en el ledger de la
  spec que la gobierna. Una ventana cuya fecha de purga no esté escrita **no se
  corre**». Este ledger todavía no la tiene. **CA-15 mete la fecha dentro del
  informe y no mete la purga en ningún test** (F-SPEC-003-2): ningún test se
  pondrá rojo si nadie la escribe y ningún test se pondrá rojo si nadie purga.
  **Lo sostiene el humano, no el código.** **Destino:** el operador, antes de la
  ventana; y el acuse, después.

### Hallazgos de `sdd-verificador` (2026-08-31)

**Los tres quedan CERRADOS en la segunda verificación (2026-08-31).** V1 y V2:
`REASON_PLANS` lleva ahora los seis desenlaces al generador de informes —conté
**3 INCONCLUSO y 3 ESPEJO** instrumentando el generador—, los barridos 11, 12,
14, 25 y 26 los recorren enteros y las mutaciones A y B ponen rojos 3 y 2 casos
respectivamente. V3: el texto de F-SPEC-003-4 está corregido y es honesto (ver
*Veredicto*, segunda vuelta). Se conservan abajo como rastro.


- **F-SPEC-003-V1 — BLOQUEANTE (CA-11, CA-12): ningún test de nivel informe
  construye un desenlace INCONCLUSO.** Los tres planes que llegan a
  `analyzeWithoutReference` en toda la suite dan ESPEJO. CA-11 pide un informe por
  cada motivo de CA-6 y CA-12 pide los dos veredictos; se prueban dos motivos, los
  dos ESPEJO. **Medido:** degradando `limitaciones_declaradas` y
  `conflict_metric_warning.text` **solo** cuando el veredicto es INCONCLUSO, la
  suite sigue en 55 ficheros / 495 casos verde. **Destino:** esta spec, antes de
  volver a verificación.
- **F-SPEC-003-V2 — CA-2 y CA-15 comparten la misma causa raíz.** Con la misma
  técnica, mutar `veredictos_por_candidata.motivo` y `retencion_del_archivo`
  **solo en INCONCLUSO** deja la suite verde. La presencia y los literales de los
  dos bloques sí están garantizados por el esquema en toda ruta; su contenido, no.
  **Destino:** el mismo barrido de F-SPEC-003-V1.
- **F-SPEC-003-V3 — el motivo registrado en F-SPEC-003-4 es falso.** Añadir el
  modo a la primera línea del hallazgo de SPEC-002 **no rompe ninguna
  expectativa**: la suite entera sale 55 / 495 verde con la cabecera cambiada,
  porque ningún test suyo asserta esa línea. La decisión de no tocarla puede
  mantenerse, pero su motivo es «no reabrir SPEC-002» (§Diseño 1, §8), no CA-14.
  **Destino:** corregir el texto de F-SPEC-003-4.

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->

**Dónde está todo.** Rama `ft/SPEC-003-test-de-espejo-sin-referencia`, **siete**
commits sobre `3b633e9` (la aprobación de la spec): los cinco de la primera
vuelta, el ledger del verificador y el de esta. Árbol limpio, sin push y sin PR:
eso es del humano.

**Qué cambió en la segunda vuelta, en dos frases.** Los seis planes de CA-6 son
ahora **una sola tabla** (`REASON_PLANS` en
`tests/mirror/support/referenceless.ts`) y los barridos de nivel informe la
recorren entera, así que hay un informe por motivo y **tres de ellos son
INCONCLUSO**; el caso 24 impide que la tabla vuelva a degenerar en solo-ESPEJO.
**`src/` no se tocó**: el diff son tres ficheros de `tests/`.

**Qué hay de nuevo, en dos frases.** El modo sin referencia vive entero bajo
`src/mirror/analysis/referenceless/` —esquema, veredicto, retención, prosa,
hallazgo y análisis— más `src/mirror/analysis/mode.ts`, que es la unión
discriminada por `modo` y el único punto de entrada que exige declararlo. Se
corre con `npm run mirror:analizar-sin-referencia -- <log.json> <pairing.json>
<calibracion.json> [ventana-temporal]`.

**Lo aditivo sobre SPEC-002, que es lo único suyo que se ha tocado:**
`WindowLog.declared_pairs` y `windowCoverage` (CA-8/CA-9), `HttpResponse.location`
y `politeFetch` + `globalFetcher` con `redirect: 'manual'` (CA-10), y
`Capturer.log()`, que ahora declara los pares que se le encargaron. Todo
opcional o aditivo: su suite sale con los mismos 415 casos y sin una expectativa
cambiada.

**Lo que NO se ha hecho, a propósito:** no se ha tocado `src/model/`, `src/db/`,
`migrations/`, `docs/fundacion/`, `FOUNDATION.md`, ningún ADR, `_epica.md` ni
`docs/roadmap.md`; no hay `migrations/0002`; no se ha añadido `delete` al puerto
`RawStore` (ADR-009 §5); no se ha editado el texto de SPEC-003 ni el hallazgo ni
el runbook; no se ha inventado ni un selector CSS ni un dato de página real —la
calibración es un fichero de datos que el operador escribe **después** de la
ventana, contra el archivo.

**Qué falta, en orden:**
1. `sdd-verificador`, **segunda pasada**, contra el texto de SPEC-003. Las
   columnas *Verif.* y *Estado* de la matriz y el veredicto son suyos y siguen
   describiendo el RED anterior; no los he tocado. Lo que hay que rejuzgar son
   **CA-11 y CA-12** (❌) y **CA-2, CA-13 y CA-15** (⚠️), más la regresión de
   CA-14 (suite de SPEC-002: 47 / 415, sin cambios, y ningún test suyo como `M`).
   Para CA-13 lo que cambió es el **texto** de F-SPEC-003-4, no la conducta: la
   cabecera del hallazgo de SPEC-002 sigue sin tocarse, y por qué está escrito
   arriba.
2. **El operador, antes de capturar:** escribir aquí la fecha de purga
   (F-SPEC-003-8). Sin eso la ventana no se corre, por ADR-009 §4.
3. `sdd-documentalista`: la segunda entrada de runbook para el modo sin
   referencia —`docs/procedimientos/ventana-de-observacion-espejo.md` está escrito
   para la ventana de seis pares con referencia—, los dos pasos de purga de
   ADR-009 §4, y los dos términos que el gate mandó a `dominio.md` (*origen común*
   y *atribución de origen*, spec §6). Nada de eso es mío y no lo he hecho.
4. Merge de SPEC-002 (PR #2) antes o después de este trabajo: esta rama sale de
   la suya, así que el PR de SPEC-003 la incluirá si aquel no se ha mergeado
   antes.
