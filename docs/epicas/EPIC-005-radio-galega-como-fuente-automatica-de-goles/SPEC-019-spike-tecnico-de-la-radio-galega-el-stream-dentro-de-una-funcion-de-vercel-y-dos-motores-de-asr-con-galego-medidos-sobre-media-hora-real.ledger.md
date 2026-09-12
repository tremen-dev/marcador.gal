---
id: SPEC-019
tipo: ledger
epica: EPIC-005
---
# Ledger — SPEC-019 Spike técnico de la Radio Galega — el stream dentro de una función de Vercel y dos motores de ASR con galego, medidos sobre media hora real

## Resumen
- Fase: en-revision (2026-09-13, `sdd-implementador`; aprobada el 2026-09-12 por Alberto Fojo; ADR-028 y ADR-029 aprobados el mismo día). Spike desechable: el código va en `spikes/radio/`, fuera de `rutasVigiladas`, y se borra al cerrar la épica.
- Rama: `ft/SPEC-019-spike-tecnico-radio-galega` (ya publicada en origin).
- **Estado real (2026-09-13):** el instrumento entero está escrito y probado con dobles (72 casos en `spikes/radio/test/`, todo sintético); **no se ha capturado ni un segmento ni se ha mandado un byte a ningún motor**, porque CA-0.2, CA-0.3 y CA-0.4 siguen pendientes del operador. Y hay **una contradicción entre CA-7.1/CA-7.2 y el guardián de SPEC-009 CA-2** que solo el gate puede resolver (F-SPEC-019-1).

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-0 | No es de código. CA-0.1 y CA-0.2 decididos en el gate (abajo); **CA-0.2 sin DPA archivado, CA-0.3 y CA-0.4 PENDIENTES del operador**. El código lo hace cumplir: `spikes/radio/src/cli/transcribe.ts` y `relay.ts` se niegan a mandar audio a un motor que no esté en `SPIKE_DPA_ACKNOWLEDGED`; `src/cli/robots.ts` archiva el `robots.txt` del host de `SPIKE_STREAM_URL` y sale 1 si lo prohíbe | Verificador: lee este ledger; hoy no hay `fetched_at` de ningún segmento con el que comparar | | ❌ |
| CA-1 | `spikes/radio/api/listen.ts` (función, solo cableado), `src/handler.ts` (Bearer `SPIKE_SECRET` con fallo cerrado; `minutes` 11 por defecto, tope 12), `src/listen.ts` (robots.txt archivado y obedecido → lista → segmentos a la cadencia del stream; JSON de CA-1.1; `sha256` en el nombre; `region` de `VERCEL_REGION`), `src/hls.ts`, `src/robots.ts`, `src/container.ts`, `src/archive.ts` (Blob privado en la función), `vercel.json` (`maxDuration: 800`, sin crons), `src/report.ts::overlapBetween` (CA-1.3). **BLOQUEADO por CA-0**: no hay proyecto temporal de Vercel (la CLI `vercel` no está instalada en esta máquina) ni URL de stream, así que ninguna invocación ha corrido | `test/listen.test.ts` (8 casos: robots antes del primer segmento, parada con `Disallow`/robots inalcanzable, User-Agent en toda petición, cadencia = TARGETDURATION y ≤ 1 lista por segmento, huecos por salto de secuencia y por fallo de descarga, índice y report archivados), `test/hls.test.ts`, `test/robots.test.ts`, `test/container.test.ts`, `test/handler.test.ts` (401 sin secreto y con secreto malo, tope de minutos), `test/report.test.ts::overlapBetween`. Extremo a extremo contra un servidor HLS sintético local (2026-09-13, no versionado) | | ❌ |
| CA-2 | `src/asr/port.ts` (bytes dentro, bytes fuera; `parse` separado de `send`), `src/asr/google.ts` (STT v2 `recognize`, `chirp_2`, `gl-ES`, `autoDecodingConfig`, sin `diarizationConfig`), `src/asr/openai.ts` (`audio/transcriptions`, `gpt-4o-transcribe`, `language=gl`, `response_format=json`), `src/asr/run.ts` (nativo primero y WAV si rechaza o vacío —CA-2.1—; crudo archivado en `asr/<motor>/<trozo>.<contenedor>.<origen>.<instante>.<status>.json` ANTES de parsear —CA-2.2—; rechazo con el motivo del motor y `outcome: rejected`, nunca `empty` —CA-2.3—; `parameters` exactos sin credenciales —CA-2.4—), `src/chunks.ts` (20 y 30 s por fronteras de segmento), `src/transcode.ts` (`ffmpeg` solo en el portátil), `src/cli/transcribe.ts`. **BLOQUEADO por CA-0.2**: sin DPA archivado ni claves, ningún motor ha recibido audio | `test/asr.test.ts` (7 casos con dobles: forma de las dos peticiones, credencial ausente de `parameters`, `mentionsForbidden() === []`, tres desenlaces por motor, orden crudo → transcripción → meta, fallback a WAV tras rechazo, negativa a decodificar dentro de la función), `test/chunks.test.ts` (6) | | ❌ |
| CA-3 | `src/corpus.ts` (forma del corpus escrito a mano con `score: null` = «sin marcador explícito»; hoja ciega con letras aleatorias y clave aparte —CA-3.3—; `unblind()` con tasas completas y parciales; `werRows()` sobre los minutos de referencia), `src/wer.ts` (S/I/D por Levenshtein de palabras; normalización declarada: minúsculas, sin acentos, sin puntuación —CA-3.4—), `src/cli/judge.ts`, `src/report.ts::hitRateTable/werTable`. **BLOQUEADO por CA-0**: sin audio no hay corpus | `test/wer.test.ts` (12 casos: idénticas 0, sustitución 1/5, inserción 1/4, eliminación 1/4, combinación 3/6, normalización, referencia vacía rechazada, WER > 1, agregado), `test/corpus.test.ts` (2: hoja sin nombre de motor, clave que lo restaura, tasas por motor × longitud; WER sobre trozos que cubren la referencia contando los que faltan). `npm test` en `spikes/radio/`: 72/72 (2026-09-13) | | ❌ |
| CA-4 | `src/latency.ts` (p50/p95 por rango más cercano, por motor × trozo × origen × contenedor, solo sobre respuestas aceptadas; suma trozo + p95 contra 60 s y 120 s —CA-4.3—), modo `relay` de `src/handler.ts` + `src/cli/relay.ts` (CA-4.2: sube el trozo a Blob e invoca la función, que lo manda al motor desde su región y archiva el crudo con `origin: vercel`), `src/report.ts::latencyTable`. **BLOQUEADO por CA-0** | `test/latency-cost.test.ts` (percentiles de 1..20 → 10 y 19; agrupación y exclusión de rechazos; márgenes), `test/handler.test.ts` (relay archiva el crudo con origen `vercel`; 404/400 con nombre) | | ❌ |
| CA-5 | `src/cost.ts` (precios de lista del 2026-09-12 con fecha; unión de ventanas `[kickoff − 10, kickoff + 150)` copiadas de `src/ingest/windows.ts` con fecha; +10 % de solape; por jornada / 2 jornadas / 34; coste de función a 6 invocaciones por hora —CA-5.3—; lectura del calendario declarado con conversión `Europe/Madrid` por `Intl`), `src/report.ts::priceTable/projectionTable` (nombra la jornada usada), `src/cli/report.ts --costs data/costs.json --calendar ../../calendario/2026-27`. **BLOQUEADO por CA-0** (cifras medidas) y **`calendario/2026-27/` no existe en el repositorio** (F-SPEC-019-3) | `test/latency-cost.test.ts` (unión de intervalos; DST; jornada 1 sintética de dos competiciones → 570 min y 627 con solape; proyección 10.03 / 20.06 / 341.09 $; 57 invocaciones), `test/report.test.ts` (tabla de precios «¿coinciden?»; proyección con la jornada nombrada) | | ❌ |
| CA-6 | `docs/epicas/EPIC-005-.../hallazgos/spike-radio-galega.md`: **plantilla con las seis secciones en orden y ninguna cifra**, marcada como tal en su primer párrafo; `src/cli/report.ts` genera las tablas de CA-6.2 desde `data/` citando ficheros. **BLOQUEADO por CA-0**: sin captura no hay informe | Verificador: comprueba las seis secciones; hoy son huecos `⟨…⟩` | | ❌ |
| CA-7 | CA-7.1: `git diff main --stat` (2026-09-13, abajo) cambia solo `spikes/`, `docs/` y las tres líneas (`tsconfig.json` exclude `"spikes"`, `.oxlintrc.json` ignorePatterns `"/spikes/"`, `.gitignore` `spikes/*/data/`); nada en `src/`, `tests/`, `migrations/`, `vercel.json`, `package.json`, `reglas.md`. CA-7.3: `git ls-files spikes/` = 49 ficheros, todos código/config/tests, comprobados **por contenido** (ninguno empieza por `0x47…0x47` ni por sync ADTS); `wer.test.ts` no lee nada fuera de literales. CA-7.4: `MEASUREMENT_WINDOWS = []` e `INDEPENDENT_PAIRS = []` intactos. **CA-7.2 RED: `npm run gates` sale `exit=1`** —ver F-SPEC-019-1 (el guardián de SPEC-009 CA-2 no admite código versionado fuera de las raíces sin exclusión declarada en `tests/`, que CA-7.1 prohíbe tocar) y F-SPEC-019-2 (rojo preexistente en la rama, ajeno al spike)—. CA-7.5: no hay proyecto que borrar (no se creó) | Salidas literales abajo, en «Evidencia de CA-7» | | ❌ |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-019/. Informe HTML opcional: _qa/SPEC-019/informe.html -->

## Salvedades / follow-ups
<!-- IDs F-SPEC-019-1, F-SPEC-019-2… con destino (spec futura o EPIC-MEJORA). -->

- **F-SPEC-019-1 — CA-7.1 y CA-7.2 no pueden ser ciertos a la vez con CA-7.3, y lo decide el gate.** El guardián de SPEC-009 CA-2 (`tests/polite/architecture.test.ts`, casos CA-2.6 nº 1, 2j y 2l) exige que **todo fichero de código del árbol entero** —`.ts .tsx .mts .cts .js`, por `git ls-files` en el caso 1 y por paseo del árbol en 2j— caiga bajo una raíz de `SCAN_ROOTS` o bajo una entrada de `SCAN_EXCLUSIONS` con motivo. La spec (§Entidades, ADR-016) da por hecho que «el spike queda fuera de `SCAN_ROOTS` porque está fuera de `src/`»: **no es así**; estar fuera de las raíces sin exclusión declarada es exactamente lo que ese guardián pone en rojo. Medido el 2026-09-13: con `spikes/radio/` versionado, el caso 1 lista los 43 `.ts` del spike, 2j añade los ~2 200 de `spikes/radio/node_modules/` y 2l refusa sus 7 symlinks de `.bin/`; con el directorio apartado del árbol, 2j y 2l pasan y el caso 1 sigue rojo (git sigue listando los ficheros). **La única salida que el propio guardián nombra** es una entrada `{ path: 'spikes/', motive: … }` en `SCAN_EXCLUSIONS` (`tests/polite/support/capability.ts`) y su reflejo en la lista literal del caso 2b: **dos ficheros de `tests/` de specs en `hecho`**, que CA-7.1 prohíbe tocar y que solo se tocan por ADR-011 §6 con referencia cruzada en los ledgers de SPEC-008/SPEC-009. No es una exención por nombre de fichero (ADR-016 §3) sino una frontera de directorio con motivo, como la de `docs/diseno/`; pero **no es decisión del implementador**. Alternativas: (a) esa exclusión declarada, con enmienda de SPEC-019 CA-7.1 en este ledger por ADR-015 y referencia cruzada en SPEC-009; (b) no versionar el código del spike (contradice CA-7.3 y el modo en que el verificador lo lee); (c) sacar el spike a otro repositorio. **Destino: gate humano, antes de la verificación.** Mientras tanto, `npm run gates` está en rojo por esta causa y por F-SPEC-019-2.
- **F-SPEC-019-2 — Rojo preexistente en la rama, ajeno al spike:** `tests/board/runbook.test.ts` caso 8 (SPEC-018 CA-19.5) exige que `docs/procedimientos/calendario-de-compromisos.md` contenga «Nueve de estas diez fechas» y tenga **10** filas de fecha; el commit `dd16eec` (docs de EPIC-005, anterior a esta implementación) añadió cuatro filas (14) y reescribió el párrafo como «Nueve de las diez fechas originales…». Es el dato de un guardián cuyo dato cambió: arreglarlo es editar ese test (fichero de SPEC-018, `hecho`) por ADR-011 §6, o devolver el párrafo y el recuento a lo que el test afirma. **No lo toca el spike.** Destino: orquestador (es de la rama, no de esta spec).
- **F-SPEC-019-3 — `calendario/2026-27/` no existe en el repositorio.** CA-5.2 toma «la jornada 1 de `calendario/2026-27/`»; hoy no hay ningún calendario declarado versionado (F-SPEC-010-1 sigue abierto: nadie ha dictaminado copiar el calendario de la RFGF). `npm run report` lo dice en la salida y deja la proyección sin jornada. Antes de la tarde de captura, o el operador declara la jornada 1 de las dos competiciones en `calendario/2026-27/` por el procedimiento de `carga-del-calendario.md`, o el informe proyecta sobre una jornada escrita a mano en `data/` y lo dice. Destino: operador (handoff).
- **F-SPEC-019-4 — El proyecto temporal de Vercel no se ha creado.** La CLI `vercel` no está instalada ni autenticada en esta máquina (`vercel whoami`: command not found). `spikes/radio/vercel.json` y las instrucciones exactas están en `spikes/radio/README.md`. Destino: operador (handoff).
- **F-SPEC-019-5 — Lo que los dobles no prueban, con nombre:** (i) que `@vercel/blob` 2.8.0 acepte `access: 'private'` contra un store real (tipado sí; ejecutado no); (ii) que Speech-to-Text v2 sirva `chirp_2` con `gl-ES` en `europe-west4` (la ubicación por defecto elegida para que el audio no salga de la UE; `GOOGLE_STT_LOCATION` y `GOOGLE_STT_MODEL` lo cambian); (iii) que `gpt-4o-transcribe` acepte `language=gl` (Whisper sí lo lista); (iv) que la firma Web (`export function GET(request: Request)`) de `api/listen.ts` sea la que Vercel Functions usa para un proyecto sin framework con Node 22 — si no, es `(req, res)` y un cambio de veinte líneas. Las cuatro se comprueban el día de la captura con las claves delante, no antes. Destino: handoff.
- **F-SPEC-019-6 — Segundo parser de `robots.txt`, fuera de `src/`.** `spikes/radio/src/robots.ts` reproduce la lectura RFC 9309 de `src/polite/robots.ts` (grupo más específico, `*` y `$`, el más largo gana, empate a `Allow`) más la semántica de estado (404/410 = sin restricciones; 403, 5xx y red caída = prohibido). ADR-014 prohíbe un segundo parser **dentro de las raíces que escanea**; éste vive fuera y se borra con el spike. Se anota para que nadie lo mueva a `src/`. Destino: se cierra al borrar `spikes/`.

## Precondiciones y purga (CA-0, §3 de la spec)
<!-- Lo escribe el operador ANTES de capturar: CA-0.1 copia del consentimiento o decisión del gate · CA-0.2 DPA por motor o decisión del gate · CA-0.3 URL del stream y origen · CA-0.4 fecha de purga. Y DESPUÉS: acuse de purga con fecha, rutas y recuento; acuse del borrado del proyecto temporal de Vercel (CA-7.5). -->

### Decisiones del gate — 2026-09-12, Alberto Fojo (registradas por `sdd-arquitecto`)

- **CA-0.1 — El spike corre con la declaración del consentimiento, sin
  esperar la copia.** El registro
  `docs/legal/2026-09-12-consentimiento-crtvg-radio-galega.md` existe
  (declarado por Alberto Fojo el 2026-09-12; frontmatter `estado: alcance
  declarado; copia del documento PENDIENTE de adjuntar`) y su alcance declarado
  cubre grabar y archivar el audio, transcribir, y el tratamiento automático
  por proveedores terceros de ASR y LLM. **La copia del documento NO está
  adjunta.** En el gate del 2026-09-12 Alberto Fojo decidió explícitamente la
  opción «correr ya» de §Notas 1: el spike captura media hora de emisión con la
  declaración como única constancia, con el argumento escrito en la spec —riesgo
  acotado, material purgado a los 30 días, comunicado por el propio titular— y
  con el dictamen de `sdd-legal-datos` del mismo día (`dictamenes-EPIC-005.md`
  §0 V1), que lo califica de riesgo acotado y decisión de gate. **Lo que no
  cambia:** la copia sigue pendiente y **sigue siendo precondición de la
  primera spec de código de la épica** (ADR-028 §4, disparador 1 del registro,
  dictamen V1) —ninguna pasa a `en-progreso` sin ella—. Esta constancia es
  anterior a cualquier captura: a fecha de hoy no hay ningún segmento
  archivado.
- **CA-0.2 — DPA por motor, sin exención para el spike.** Decidido en el gate
  del 2026-09-12 (§Notas 2, recomendación «no eximir», y dictamen V4): **ningún
  motor recibe audio real sin la copia fechada de su DPA en `docs/legal/`**.
  Los dos motores son **Google Cloud Speech-to-Text v2 (Chirp)** y **OpenAI
  (`gpt-4o-transcribe` / Whisper)**, el segundo por decisión del gate sobre
  §Notas 3; **AssemblyAI solo como tercero si su cobertura de galego se
  confirma con fecha**, y con su propio DPA. **Estado a 2026-09-12: ninguno de
  los dos DPA está en `docs/legal/`.** Es lo que el operador tiene que
  completar antes de capturar (ver handoff).
- **CA-0.3 — URL del stream: PENDIENTE del operador.** Tiene que escribir aquí,
  con fecha, **la URL exacta que se va a usar y de dónde sale**: (a) la oficial
  entregada por la CRTVG —lo que ADR-028 §4 y el dictamen V3 piden—, o (b) la
  pública de listados de terceros
  (`https://crtvg-radiogalega-hls.flumotion.cloud/playlist.m3u8`, consultada el
  2026-09-12) **con esa anotación explícita** y con la constancia de que se pidió
  la oficial. En los dos casos, el `robots.txt` del host de esa URL se archiva
  antes que el primer segmento (CA-1.2) y su contenido se cita en el informe
  (CA-6.1); el 2026-09-12 ese host no respondía desde este entorno (dictamen
  V3).
- **CA-0.4 — Fecha de purga: PENDIENTE del operador.** Tiene que escribir
  aquí, **antes de capturar**, la fecha de la sesión de captura y la de purga
  (**30 días** después; techo 90 con una prórroga escrita, §3 de la spec), y
  **después** el acuse de purga con fecha, rutas y recuento, más el acuse del
  borrado del proyecto temporal de Vercel (CA-7.5).
- **Proyecto temporal de Vercel** (§Notas 4): aprobado en el gate del
  2026-09-12. Se crea con *Root Directory* `spikes/radio`, solo vistas previas
  protegidas, y se borra al cerrar la spec.

## Evidencia de CA-7 (2026-09-13, `sdd-implementador`)

**CA-7.1 — `git diff main --stat` (resumen; 65 ficheros):** fuera de `spikes/radio/**` y de `docs/**`, cambian **exactamente** `.gitignore` (+4: comentario y `spikes/*/data/`), `.oxlintrc.json` (+1 −1: `"/spikes/"` en `ignorePatterns`) y `tsconfig.json` (+1 −1: `"spikes"` en `exclude`). Ningún fichero de `src/`, `tests/`, `migrations/`, `vercel.json`, `package.json` ni `docs/fundacion/reglas.md` aparece con cambios de esta implementación (los de `docs/` anteriores a ella son del arquitecto, commits `bf544f1..dd16eec`).

**CA-7.2 — `npm run gates` (2026-09-13 00:05, raíz):**
```
> marcador@0.0.1 typecheck   → tsc --noEmit            (sin salida: OK)
> marcador@0.0.1 lint        → oxlint --type-aware     (OK)
> marcador@0.0.1 build       → next build              ✓ Compiled successfully in 387ms
> marcador@0.0.1 test        → vitest run
 FAIL  |serialized| tests/board/runbook.test.ts > CA-19 … > 8. CA-19.5 — el párrafo de cierre ya no dice «cuatro de estas cinco fechas»
   AssertionError: expected '---\ntipo: procedimiento…' to contain 'Nueve de estas diez fechas'
 FAIL  |serialized| tests/polite/architecture.test.ts > CA-2.6 … > 1. todo fichero de código versionado fuera de `tests/` cae bajo una raíz declarada
   AssertionError: expected [ 'spikes/radio/api/listen.ts', …(42) ] to deeply equal []
 FAIL  |serialized| tests/polite/architecture.test.ts > CA-2.6 … > 2j. la cobertura sale del ÁRBOL DE FICHEROS, no de `git` (SPEC-009 CA-2)
   AssertionError: expected [ …(2212) ] to deeply equal []          (spikes/radio/node_modules/**)
 FAIL  |serialized| tests/polite/architecture.test.ts > CA-2.6 … > 2l. un symlink NO queda fuera en silencio: el paseo lo REFUSA, nombrándose (F-SPEC-009-V1)
   AssertionError: expected [ …(7) ] to deeply equal []             (spikes/radio/node_modules/.bin/{nanoid,node-which,rolldown,tsc,vite,vitest,why-is-node-running})
 Test Files  2 failed | 145 passed (147)
      Tests  4 failed | 1713 passed (1717)
 Type Errors  no errors
exit=1
```
Typecheck, lint y build **no ven el spike** (las tres líneas de §1 funcionan). El test sí, por F-SPEC-019-1; el otro rojo es F-SPEC-019-2. Con `spikes/` apartado del árbol (medido): 2j y 2l pasan, el caso 1 y el de runbook siguen rojos.

**CA-7.3 — `git ls-files spikes/`:** 49 ficheros: `.env.example`, `.gitignore`, `api/listen.ts`, `package.json`, `package-lock.json`, `tsconfig.json`, `vercel.json`, `vitest.config.ts`, 28 bajo `src/` y 15 bajo `test/` (13 suites, 2 fixtures sintéticas: `playlists.ts`, `calendar.ts`). Comprobación por contenido (primeros 376 bytes de cada uno): ninguno tiene `0x47` en 0 y 188 (MPEG-TS) ni sync ADTS; no hay nada bajo `data/` (ignorado por `.gitignore` de raíz y del spike). `wer.test.ts` solo usa literales.

**CA-7.4:** `src/ingest/measurement.ts:41 export const MEASUREMENT_WINDOWS: readonly MeasurementWindow[] = [];` · `src/decide/independence.ts:40 export const INDEPENDENT_PAIRS: readonly IndependentPair[] = [];` — sin cambios en la rama.

**CA-7.5:** no aplica todavía: el proyecto temporal no se ha creado (F-SPEC-019-4); `marcador-gal` no ha recibido ningún despliegue de esta rama (no hay `vercel` en esta máquina y no se ha hecho push desde aquí).

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->

**Estado (2026-09-13, `sdd-implementador`):** todo el instrumento está en `spikes/radio/` (léase `spikes/radio/README.md`: es el manual de la tarde), con 72 tests con dobles en verde (`cd spikes/radio && npm install && npm test`) y probado de punta a punta contra un servidor HLS sintético. **Nada real capturado ni enviado.** Spec en `en-revision` para que el verificador juzgue lo que hoy es juzgable (CA-3.4, la forma de CA-1/CA-2/CA-4/CA-5 con dobles, CA-7.1/7.3/7.4) y para que el gate decida F-SPEC-019-1 antes de la tarde de captura. Lo que queda, en orden:

**A. Decisión del gate (antes de nada):** F-SPEC-019-1 — cómo se hace verde CA-7.2 con el spike versionado. Si la respuesta es la exclusión declarada `spikes/` en `SCAN_EXCLUSIONS` (+ lista del caso 2b), es un diff de `tests/polite/` por ADR-011 §6 con referencia cruzada en los ledgers de SPEC-008/SPEC-009 y enmienda de CA-7.1 aquí por ADR-015; lo escribe quien el gate diga, no este rol por su cuenta. Y F-SPEC-019-2 (rojo de la rama, ajeno al spike) al orquestador.

**B. Lo que escribe el operador en este ledger, antes de capturar (CA-0):**
1. **CA-0.2:** aceptar los DPA de Google Cloud y de OpenAI por autoservicio y guardar copia fechada en `docs/legal/` (un fichero por proveedor: fecha de aceptación, versión del texto, cláusulas de transferencia; patrón ADR-023 §6.4). Solo entonces, `SPIKE_DPA_ACKNOWLEDGED=google,openai` en `spikes/radio/.env.local` y en el proyecto temporal. Sin esa variable, `transcribe` y `relay` se niegan (salida 1, nombrando el motor).
2. **CA-0.3:** escribir aquí la URL exacta y su origen (oficial de la CRTVG / pública de listados con la anotación y la constancia de haber pedido la oficial). Ponerla en `SPIKE_STREAM_URL`. Ejecutar `npm run robots` en `spikes/radio/`: archiva `data/robots/<host>-<fecha>-<status>.txt` y **sale 0 solo si el `robots.txt` permite la ruta** (404/410 = sin restricciones; 403, 5xx o red caída = parar y escribirlo; no se puentea con el consentimiento). Citar el fichero y lo que dice en CA-0.3 y luego en CA-6.1.
3. **CA-0.4:** fecha de la sesión y fecha de purga (+30 días; techo 90 con una prórroga escrita).
4. **La media hora:** sábado o domingo con Terceira RFEF G1 en juego durante *Galicia en goles*; programa, fecha y hora previstas, escritos aquí. Si no salen veinte frases de gol, se alarga en la misma sesión hasta sesenta minutos (más invocaciones), no hay segunda sesión.
5. **F-SPEC-019-3:** declarar la jornada 1 de las dos competiciones en `calendario/2026-27/` (procedimiento `carga-del-calendario.md`; no hace falta cargarla en Postgres para el spike, solo el JSON) o asumir que CA-5.2 proyecta sobre una jornada escrita a mano en `data/` y decirlo en el informe.

**C. El proyecto temporal de Vercel (F-SPEC-019-4):** `npm i -g vercel && vercel login`; en `spikes/radio/`, `vercel link` creando un proyecto **nuevo** `marcador-spike-radio` (**nunca** enlazar `marcador-gal`), Root Directory `spikes/radio`, Fluid compute activado, Deployment Protection activada, un store de Blob **propio**; variables de `.env.example` con `vercel env add <VAR> preview`; `vercel deploy` (vista previa; anotar la URL). Comprobar F-SPEC-019-5 (iv) con `curl -H "Authorization: Bearer $SPIKE_SECRET" "https://<deployment>/api/listen?minutes=0.2"`: si responde JSON, la firma Web vale.

**D. La tarde, en este orden (comandos literales en `spikes/radio/README.md`):** tres invocaciones de 11 min (`inv-1`, `inv-2` a los 10 min exactos de `inv-1`, `inv-3`), con `curl --max-time 800`; `npm run pull` por invocación; `npm run chunk`; `npm run transcribe` (nativo → WAV; `--containers both` para la tabla completa); `npm run relay -- --url … --length 20 --count 10` y otra vez con `--length 30` (CA-4.2), y `pull` de nuevo; una persona escribe `data/corpus/inv-1.json` (forma en `src/corpus.ts`, offsets en segundos de `chunks/all.<ext>`, **criterio escrito antes de juzgar**); `npm run judge -- --session inv-1 build`, rellenar la hoja a ciegas, `tally`; leer los paneles de facturación **después** y escribir `data/costs.json` con capturas en `data/costs/`; `npm run report -- --sessions inv-1,inv-2,inv-3 --corpus inv-1 --costs data/costs.json --calendar ../../calendario/2026-27` → pegar `data/report/<fecha>.md` en `hallazgos/spike-radio-galega.md` (plantilla con las seis secciones y huecos `⟨…⟩`) y escribir §3–§6 a mano. Si el proyecto temporal no está, `npm run listen -- --minutes 30` captura en el portátil con el mismo código (sirve para CA-2..CA-5; **no mide CA-1**).

**E. Al cerrar (CA-0.4, CA-7.5):** `npm run purge -- --session inv-N --blob` por cada sesión (`--all` borra también corpus, hojas y robots locales); pega el JSON del acuse (fecha, rutas, recuentos) aquí; `vercel project rm marcador-spike-radio` y borrar su store de Blob desde el panel; acuse aquí con fecha. Después, borrar `spikes/` y las tres líneas de raíz cuando la épica cierre.

**Variables (todas en `spikes/radio/.env.example`):** `SPIKE_STREAM_URL`, `SPIKE_SECRET`, `BLOB_READ_WRITE_TOKEN` (del store del proyecto temporal), `SPIKE_DPA_ACKNOWLEDGED`, `GOOGLE_PROJECT_ID`, `GOOGLE_STT_LOCATION` (`europe-west4`), `GOOGLE_STT_MODEL` (`chirp_2`), `GOOGLE_ACCESS_TOKEN` **o** `GOOGLE_API_KEY`, `OPENAI_API_KEY`, `OPENAI_ASR_MODEL` (`gpt-4o-transcribe`). Ninguna en el `.env.example` de la raíz: el spike no comparte entorno con el producto.

---

**Estado anterior (2026-09-12, `sdd-arquitecto`):** spec `aprobada`, sin una línea de
código todavía. Las decisiones del gate están arriba. **Antes de que
`sdd-implementador` capture un solo segmento, una persona tiene que hacer
cuatro cosas, y ninguna es automatizable:**

1. **Aceptar los DPA de Google Cloud y de OpenAI** por la vía de autoservicio
   de cada cuenta y **guardar copia fechada en `docs/legal/`** (un fichero por
   proveedor, con fecha de aceptación, versión del texto y cláusulas de
   transferencia; patrón ADR-023 §6.4). Sin las dos copias, CA-0.2 no se
   cumple y no se manda audio a ningún motor. Si se prueba AssemblyAI, tercer
   DPA y cita fechada de su cobertura de galego.
2. **Pedir a la CRTVG la URL oficial del stream** junto con la copia del
   consentimiento, **o decidir usar la pública de listados de terceros** y
   escribirlo en CA-0.3 con esa anotación. Comprobar y archivar el
   `robots.txt` de ese host antes del primer segmento.
3. **Fijar y escribir la fecha de purga** en CA-0.4 (fecha de captura + 30
   días).
4. **Elegir la media hora:** un sábado o domingo con partidos de **Terceira
   RFEF G1 en juego durante *Galicia en goles***, y escribir programa, fecha y
   hora previstas. Si la media hora no da veinte frases de gol, se alarga en la
   misma sesión hasta sesenta minutos (§2 de la spec); no hay segunda sesión.

**Lo que no bloquea el spike pero sí lo que viene detrás:** la copia del
consentimiento (precondición de la primera spec de código, ADR-028 §4) y el
re-dictamen de ADR-027 §3.d.8 (precondición de la tercera spec; el dictamen del
2026-09-12 dice que se pide cuando esa spec esté en borrador).

**Dónde seguir:** con las cuatro constancias de CA-0 escritas, crear el proyecto
temporal de Vercel, `spikes/radio/` con las tres líneas de configuración de
raíz (§1), y capturar en el orden de §2.
