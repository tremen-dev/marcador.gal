---
id: SPEC-003
tipo: ledger
epica: EPIC-001
---
# Ledger — SPEC-003 Test de espejo sin referencia: el cruce entre candidatas

## Resumen
- Fase: **en revisión**. Spec **aprobada por Alberto Fojo el 2026-08-31** e
  implementada por `sdd-implementador` el mismo día. Los 15 CA tienen código y
  test; falta la verificación adversarial.
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
| CA-1 modo declarado y no inferible | `src/mirror/analysis/mode.ts` (`ModalReportSchema`, `analyzeInMode`) · `src/mirror/analysis/referenceless/report.ts` (`modo`, `referencia`) | `tests/mirror/analysis/referenceless-report.test.ts` 1-3 (las cuatro combinaciones) · `tests/mirror/analysis/modes.test-d.ts` (`undeclared`, `invented`) | | 🚧 |
| CA-2 veredictos por candidata: no medidos | `src/mirror/analysis/referenceless/report.ts` (`UnmeasuredCandidateVerdictsSchema`, `UNMEASURED_CANDIDATE_VERDICTS`) | `tests/mirror/analysis/referenceless-report.test.ts` 4-7 | | 🚧 |
| CA-3 origen comun probado vs atribuido | `src/mirror/analysis/referenceless/verdict.ts` (`verdictWithoutReference`, un solo parámetro) · `.../referenceless/report.ts` (`origen_comun_probado`, `atribucion_de_origen`, `origen_atribuido_a`) · `.../referenceless/analyze.ts` (`replicated_errors_total`, sin las dos categorías de la referencia) | `tests/mirror/analysis/referenceless-report.test.ts` 8-10 · `tests/mirror/analysis/referenceless-verdict.test.ts` 15-16 (estructural: arity 1, sin `errorSignature`) | | 🚧 |
| CA-4 INDEPENDIENTE no es emitible | `src/mirror/analysis/referenceless/verdict.ts` (`ReferencelessVerdict`, `decide`) | `tests/mirror/analysis/referenceless-verdict.test.ts` 1-2, 11 · `tests/mirror/analysis/modes.test-d.ts` (`independiente`, `fromReport`) | | 🚧 |
| CA-5 (RN-02) la bandera es false siempre | `src/mirror/analysis/referenceless/verdict.ts` (literal `false`) · `.../referenceless/prose.ts` (`whyFalse`) | `tests/mirror/analysis/referenceless-verdict.test.ts` 11 (tabla de 6 motivos × 2 veredictos), 12 (estructural: ninguna rama escribe `true`) · `modes.test-d.ts` (`flag`) | | 🚧 |
| CA-6 regla de decision del modo | `src/mirror/analysis/referenceless/verdict.ts` (`decide`, cinco ramas en orden) | `tests/mirror/analysis/referenceless-verdict.test.ts` 3-10 (una por rama + desempate 2 sobre 3 + orden 3 antes que 4) | | 🚧 |
| CA-7 adelanto en una sola direccion no nombra espejo | `src/mirror/analysis/referenceless/verdict.ts` (`espejo_de: null`) · `.../referenceless/report.ts` (`espejo_de: z.null()`) | `tests/mirror/analysis/referenceless-verdict.test.ts` 7, 13-14 · `modes.test-d.ts` (`mirrorOf`) | | 🚧 |
| CA-8 pares declarados; cero intentos = 0 % | `src/mirror/window.ts` (`DeclaredPair`, `WindowLog.declared_pairs`, `windowCoverage`) · `src/mirror/capture/capturer.ts` (`log()`) | `tests/mirror/analysis/declared-pairs.test.ts` 1-4, 7 (el 2 es el que demuestra que arregla algo) | | 🚧 |
| CA-9 la negativa de CA-5 sobre los pares declarados | `src/mirror/window.ts` (`InvalidWindowError`, sin la constante «seis») · `src/mirror/cli/analizar-sin-referencia.ts` | `tests/mirror/analysis/declared-pairs.test.ts` 5-6 · `tests/mirror/cli/referenceless-cli.test.ts` 2 (sale con error y no crea `hallazgos/`) | | 🚧 |
| CA-10 (RN-11) ninguna peticion cambia de host en silencio | `src/mirror/capture/http.ts` (`RedirectNotFollowedError`, `politeFetch`, `globalFetcher` con `redirect: 'manual'`) · `src/mirror/capture/ports.ts` (`HttpResponse.location`) | `tests/mirror/capture/redirects.test.ts` 1-4 (301 real contra servidor local; 200 sin regresión; estructural de puerta única) | | 🚧 |
| CA-11 limitaciones declaradas, en JSON y en prosa | `src/mirror/analysis/referenceless/report.ts` (`DECLARED_LIMITATIONS`) · `.../referenceless/prose.ts` | `tests/mirror/analysis/referenceless-report.test.ts` 11-13 | | 🚧 |
| CA-12 advertencia de conflictos incondicional | `src/mirror/analysis/referenceless/report.ts` (`REFERENCELESS_CONFLICT_WARNING`, no nulable) | `tests/mirror/analysis/referenceless-report.test.ts` 14-15 | | 🚧 |
| CA-13 fichero de hallazgo propio | `src/mirror/analysis/referenceless/findings.ts` | `tests/mirror/analysis/referenceless-findings.test.ts` 1-7 · `tests/mirror/cli/referenceless-cli.test.ts` 1 | | 🚧 |
| CA-14 lo heredado se hereda, y se prueba | `src/mirror/analysis/referenceless/analyze.ts` (reutiliza `comparePair`, `readArchive`, `DECLARED_THRESHOLDS`) | `tests/mirror/analysis/referenceless-inherited.test.ts` 1-9 · suite de SPEC-001+SPEC-002 aislada: **47 ficheros / 415 casos**, sin una sola expectativa cambiada (ver *Gates*) | | 🚧 |
| CA-15 (ADR-009) el informe declara su fecha de purga | `src/mirror/analysis/referenceless/retention.ts` · `.../referenceless/report.ts` (`ArchiveRetentionSchema`, `end` no nulable) · `.../referenceless/prose.ts` (`proseRetention`) | `tests/mirror/analysis/retention.test.ts` 1-7 · `tests/mirror/analysis/referenceless-report.test.ts` 16-22 · `tests/mirror/analysis/referenceless-inherited.test.ts` 3 (determinismo con dos relojes) | | 🚧 |

## Gates de calidad (los ejecutó `sdd-implementador`; no hay CI)

Base antes de tocar nada: **46 ficheros / 415 casos**. Salida literal al cerrar:

```
$ npm run lint

> marcador@0.0.1 lint
> oxlint --type-aware


$ npx tsc --noEmit
(sin salida: sin errores)

$ npx vitest run

 RUN  v4.1.11 /Users/albertofojo/src/tremen-dev/marcador.gal


 Test Files  55 passed (55)
      Tests  495 passed (495)
Type Errors  no errors
```

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

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-003/. Informe HTML opcional: _qa/SPEC-003/informe.html -->

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
  primera línea qué modo lo produjo, y el `.md` de SPEC-002 no lo dice.** Su
  *Test* solo exige que «el `.md` y el `.json`» de **este** modo lleven el modo, y
  eso está hecho; tocar la cabecera del hallazgo de SPEC-002 movería su salida, y
  CA-14 exige que su suite siga verde sin cambiar una sola expectativa. Hoy los
  dos ficheros se distinguen igual por su **nombre**
  (`test-de-espejo.md` frente a `test-de-espejo-sin-referencia.md`) y el de este
  modo dice además, en su segundo párrafo, que **no** es el informe de SPEC-002.
  **Destino:** el mismo que F-SPEC-003-1 — enmienda 2 de SPEC-002 o la spec que
  reabra ese modo.
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

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->

**Dónde está todo.** Rama `ft/SPEC-003-test-de-espejo-sin-referencia`, cinco
commits sobre `3b633e9` (la aprobación de la spec). Árbol limpio, sin push y sin
PR: eso es del humano.

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
1. `sdd-verificador`, contra el texto de SPEC-003. Las columnas *Verif.* y
   *Estado* de la matriz y el veredicto son suyos; no los he tocado.
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
