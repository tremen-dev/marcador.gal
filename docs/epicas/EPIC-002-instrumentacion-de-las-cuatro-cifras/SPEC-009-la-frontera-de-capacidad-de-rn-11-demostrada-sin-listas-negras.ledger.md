---
id: SPEC-009
tipo: ledger
epica: EPIC-002
---
# Ledger — SPEC-009 La frontera de capacidad de RN-11, demostrada sin listas negras

## Resumen
- Fase: **`hecho`** — aprobada por Alberto Fojo el 2026-09-01,
  implementada por `sdd-implementador` el 2026-09-02 (primera vuelta, ver
  «Primera vuelta» abajo), **verificada RED el 2026-09-02** (primera
  verificación: F-SPEC-009-V1 y V2, las dos formas de la duodécima evasión,
  medidas con los tres gates en verde), **segunda vuelta de implementación el
  2026-09-02** (ver «Segunda vuelta» abajo): V1 cerrada con mecanismo —el paseo
  refusa los symlinks por construcción, nombrándose—, V2 escrita como residuo
  dentro del criterio con E12b como superviviente medida, V3 corregida, V4 con
  destino propuesto por escrito. **Y segunda verificación GREEN el 2026-09-02**
  (ver «Veredicto del verificador — segunda vuelta» abajo): S1/S2 repetidas
  mueren nombrándose, F sobrevive como lo que el criterio ya declara, y las
  variantes nuevas que busqué o mueren o quedan medidas como F-SPEC-009-V5 (no
  bloqueante).
- **Esta spec no empieza de cero: hereda el expediente de SPEC-008.** Las once
  evasiones, los cuatro mecanismos superados, las cinco verificaciones y las
  cuatro enmiendas viven en
  `SPEC-008-adaptador-de-ceroacero-es-y-cortesia-rn-11-con-una-sola-implementacion.ledger.md`,
  y **no se copian aquí**. El §2 y el §3 de la spec los resumen con su
  identificador; el material entero está allí.
- **Lo que la saca de SPEC-008** está escrito en aquel ledger, bajo
  `## Enmienda — 2026-09-01: CA-2 se queda ⚠️ con su residuo escrito, y la
  frontera de capacidad sale a SPEC-009`. Allí queda **CA-2 como ⚠️**, y aquí se
  mudan **F-SPEC-008-V34** (CA-1) y **F-SPEC-008-V35** (CA-2).
- Rama: `ft/SPEC-009-frontera-de-capacidad-rn-11`

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 — lista blanca de identificadores globales, con superficie y motivo | `tests/mirror/support/imports.ts` (`freeReferences`: el checker decide libre/ligado; ambient no liga; tipo se exime; shorthand se juzga por su valor) · `tests/polite/support/capability.ts` (`ALLOWED_GLOBALS`, 20 entradas con `asValue`+superficie+motivo; `capabilityOffences` juzga SOLO contra lo declarado; `CAPABILITY_NAMES` borrada) | `tests/polite/architecture.test.ts` casos 8, 9, 10, 11, 11b (conservados, mensajes nuevos) y 11c (V34 literal: rojo por superficie, `process.env` verde), 11d (lista invertida, como 4c), 11e (ambient), 11f (shorthand), 11g (CA-1.4), 11h (dos ejes + motivo + lista negra borrada + cada entrada usada) | 1ª verif. (2026-09-02): M1 repetida → ROJO ×3 (`architecture` 8, 11c y **E11** — no 11h, ver V3); **V34 real** (`src/ingest/vdoor9.ts`, fichero de verdad) → ROJO en 8 por superficie, más 13 por huérfano; mutación ambient-off → ROJO 11e; **medición CA-1.6 re-derivada por mí**: 89 ficheros, 182 refs libres, **21 distintos** — idéntica al ledger; `CAPABILITY_NAMES` borrada (grep, 11h) | ✅ |
| CA-2 — la cobertura fuera de las raíces no la decide `git` | `tests/polite/support/capability.ts` (`repositorySources()`: el árbol entero, con el mismo paseo y las mismas declaraciones que `scannedSources()`; 6 exclusiones nuevas con motivo — `tests/`, `.git/`, `.next/`, `.claude/`, `raw/`, `next-env.d.ts`; `.gitignore` intacto) · **2ª vuelta (F-SPEC-009-V1)**: `walkTree` clasifica todo dirent de forma EXHAUSTIVA (`TreeWalk`): fichero juzgado, directorio recorrido, exclusión declarada, o **refusal nombrándose** — un symlink (o cualquier dirent que no sea fichero ni directorio) es rojo por construcción salvo exclusión declarada con motivo; `walkRefusals()` lo expone, con `base` parametrizable solo para la batería | `tests/polite/architecture.test.ts` casos 2j (cobertura por árbol; el paseo mide fuera de las raíces; dentro, árbol = lectura), 2k (control positivo V35: `git` no lo ve, el importador no ofende, el árbol lo pone rojo), 2b actualizado (las 8 exclusiones, cada una con motivo), **2l** (árbol real sin refusals + control positivo con nombre propio: symlink de fichero en `robots/` y de directorio bajo `src/ingest/`) · `evasions.test.ts` **E12a** (S1, S2 y el symlink de DIRECTORIO sobre árbol sintético con el paseo y las listas reales; la exclusión declarada sigue siendo la única salida) | 1ª verif.: V35 real → ROJO 2j; M2 → ROJO 2k; **pero un symlink era invisible a las tres listas** (F-SPEC-009-V1). **2ª verif. (2026-09-02): V1 CERRADA con mecanismo** — S1+S2 repetidas tal cual → ROJO en 2l nombrando los dos; symlink de DIRECTORIO real bajo `src/ingest/` → ROJO; symlink con extensión no-código (`src/db/notes.txt`) → refusado también; M4 (salto silencioso repuesto) → ROJO ×2 (E12a + 2l). Variante nueva medida: directorio `chmod 000` bajo una raíz queda fuera en silencio (`catch → return`), pero no puede ni versionarse (`git add` → Permission denied) ni ejecutarse → F-SPEC-009-V5, no bloqueante | ✅ |
| CA-3 — las once evasiones, como batería ejecutable | `tests/polite/evasions.test.ts` (E1..E11 nombradas, cada una contra su mecanismo; E2/E3/E7 como supervivencias comprobadas) · **2ª vuelta**: la duodécima ENTRÓ en la batería como manda CA-3.3, en sus dos formas — **E12a** (V1, muere contra `walkRefusals`) y **E12b** (V2, sobrevive como residuo declarado, como N4) —, y la cabecera registra las doce y reserva el sitio de la decimotercera | `tests/polite/evasions.test.ts` **14 casos** + N4 reproducida dentro de E7 (el parser funcional en `src/site/robots-txt.ts` NO ofende); las mutaciones R/Q/N de SPEC-008 siguen matando los mismos casos (spot-check R5 abajo) | E1..E11 ejecutadas en verde; E7/N4 sobrevive (debe); M1/M2/R5/ambient-off matan casos nombrados. La cabecera dice dónde entra la duodécima — **y la duodécima ya existe, en dos formas (V1 y V2): entra en la batería con el arreglo**. 2ª verif.: E12a y E12b están, corren en verde (14/14), la cabecera registra las doce y reserva la decimotercera; M4 mata E12a, borrar el residuo mata E12b | ✅ |
| CA-4 — lo que la frontera NO promete, dentro del criterio | `tests/polite/containment.test.ts` (describe «SPEC-009 CA-4»: residuos 1, 2a, 2b y 4 con ejemplo ejecutable, siempre a 127.0.0.1) · `tests/polite/evasions.test.ts` (describe «CA-4.3»: `z` de `zod`) · **2ª vuelta (F-SPEC-009-V2)**: el residuo del cierre estático se ENSANCHA y va escrito, medible, dentro del criterio — docstring de `capabilityOffences` en `capability.ts`: el miembro sobre una expresión que NO es identificador libre no se juzga jamás, a ningún nivel, y por `constructor.constructor` todo valor alcanza `Function`; sin cierre posible sin lista negra (ADR-016 §3.5), con nota al gate (F-SPEC-009-6) | `containment` casos CA-4.1 (rama no ejecutada: cero disparos), CA-4.2a (UDP no pasa por el socket), CA-4.2b+CA-4.4 (subproceso: el servidor local recibe, la trampa registra cero) · `evasions` CA-4.3 (superficie concedida, contenido sin juzgar) y **E12b** (la expresión medida sobrevive a los dos juicios, ENTREGA `node:child_process` en el proceso del test sin mandar un byte, y el párrafo del residuo tiene que seguir en el guardián: borrarlo es rojo) | 1ª verif.: los cuatro residuos con ejemplo ejecutable, **pero el residuo declarado era menor que el real** (F-SPEC-009-V2). **2ª verif. (2026-09-02): V2 CERRADA como residuo declarado** — F (`src/db/fdoor.ts`) repetida tal cual → sobrevive con lint=0 y 117/117, **y eso es hoy lo que el criterio declara** (docstring de `capabilityOffences`, F-SPEC-009-V2 nombrado con el ejemplo); borrar el párrafo del residuo sin borrar el caso → ROJO en E12b; el texto cubre las variantes que busqué (miembro sobre ligadura importada, sobre local, a cualquier profundidad); nota al gate en F-SPEC-009-6 | ✅ |
| CA-5 — lo construido no se rehace, y sigue mordiendo | Sin cambios en los mecanismos: `readModule` intacto (solo GANA `freeReferences`), la trampa del socket intacta, `ALLOWED_PACKAGES` y la concesión por superficie intactos, `scannedSources` mismo paseo (extraído a `walkTree` compartido) · **2ª vuelta**: `readModule`, `freeReferences`, la trampa, `ALLOWED_PACKAGES` y `ALLOWED_GLOBALS` sin una línea de diff; lo único que cambia es que el paseo compartido GANA la clasificación exhaustiva de dirents (CA-2), sigue siendo UNO y las dos listas siguen derivando de él | Spot-check R5 (la octava en `#captureGranted`): roja en las DOS mitades — `architecture` 3 + `containment` 2, 4, 8, 9, igual que en SPEC-008. Casos 14, 15, 16, 17 de `containment` y 2d, 2g, 2i, 3b..3g, 4..4h de `architecture` sin perder ni una aserción. La propiedad de RN-11 (denegar por defecto) la comprueban los casos 1 y 15 de `containment`, intactos | R5 repetida por mí: ROJO en las dos mitades (`architecture` 3 + `containment` 2, 4, 8, 9), revertida con diff vacío. Diff de `tests/mirror/support/imports.ts` leído entero: `readModule` solo gana `freeReferences`. La trampa y `ALLOWED_PACKAGES` sin una línea de diff | ✅ |
| CA-6 — no se toca `src/` | `git diff main -- src/ migrations/ .gitignore` → vacío (comprobado 2026-09-02, y REPETIDO tras la segunda vuelta: los dos commits nuevos tocan solo `tests/polite/`). Todo el trabajo vive en `tests/` y en este ledger | — (es una propiedad del diff, no un caso) | `git diff main -- src/ migrations/ .gitignore` → 0 líneas, repetido por mí (2026-09-02). Árbol de trabajo limpio. Ningún HTML de terceros añadido (ADR-009 §3) | ✅ |
| CA-7 — los tres gates y las suites cerradas enteras | Salidas literales en «Primera vuelta» y en «Segunda vuelta» abajo: 2ª vuelta `lint exit=0` · `npm test` **803/803** (82 ficheros) · `test:db` **144/144** con `DATABASE_URL_TEST` real (al primer intento) | Recuento fichero a fichero contra `main`: solo cambia `tests/polite` (`architecture` 41→**50**, `containment` 17→20, `evasions` +**14**); `tests/mirror`, `tests/site`, `tests/docs`, `tests/model`, `tests/raw`, `tests/db` y `tests/types` idénticos fichero a fichero (el único fichero fuera de `tests/polite/` con diff es `tests/mirror/support/imports.ts`, el soporte de la 1ª vuelta, y no es una suite) | 1ª verif.: `lint exit=0` · 800/800 · 144/144 (flake DNS F-SPEC-008-21). **2ª verif. (2026-09-02), corridos por mí en worktree limpio con `npm ci`**: `lint exit=0` · `npm test` **803/803** (82 ficheros) · `test:db` **144/144 al primer intento**. Recuento: `tests/polite` con reporter JSON da `architecture` 50 · `containment` 20 · `evasions` 14, idéntico al declarado; el diff entero contra `main` son 5 ficheros de `tests/` + los 2 docs de la spec, así que las suites cerradas son byte a byte las de `main` | ✅ |

## Primera vuelta — la lista negra se borra y la cobertura deja de ser de `git` (2026-09-02, `sdd-implementador`)

### 1. CA-1: quién decide qué es libre es el compilador, no un análisis propio

La pregunta cara de esta spec —distinguir un identificador **libre** de uno
ligado— **no se contesta con un análisis de ámbitos escrito por nosotros**: eso
sería una lista de formas de declarar, la familia exacta de defecto que ADR-016
§5 bis nombra. Se le pregunta al **checker** del mismo compilador que ya lee la
frontera (`typescript/unstable/sync`, `project.checker.getSymbolAtLocation` en
lote): una referencia es libre cuando el checker no resuelve símbolo, cuando el
símbolo no tiene declaraciones (`globalThis` es así), cuando ninguna declaración
vive en el propio fichero, **o cuando las del fichero son todas ambient** —
`declare const fetch`, `declare global { var sneak }`, un `.d.ts` — porque una
declaración ambient **no emite ligadura**: en el JavaScript emitido esa
referencia llega al global del anfitrión. Los tres agujeros que un lector
ingenuo tendría se midieron antes de escribir el mecanismo y llevan caso:
ambient (11e), `declare global` (11e) y la propiedad shorthand `{ fetch }`, que
para el árbol es a la vez nombre de declaración y referencia al valor, y se
juzga por `getShorthandAssignmentValueSymbol` (11f).

**Las posiciones de tipo se eximen** por el mismo principio que exime a
`import type` en CA-2.3: la emisión las borra enteras (`verbatimModuleSyntax`,
type erasure), así que no cruzan ninguna capacidad y exigirles superficie sería
peaje. Qué es posición de tipo sale del árbol —el rango
`FirstTypeNode..LastTypeNode` del propio compilador, los type parameters y la
mitad borrada de una heritage clause (`implements`, y el `extends` de una
interfaz; **el `extends` de una CLASE es uso de valor y se juzga**, y por eso
`Error` tiene `asValue: true`)—.

**CA-1.6, la medición primero y el número al ledger**: el escaneo entero (89
ficheros, 3 686 referencias de identificador) usa **182 referencias libres en
posición de valor**, que se reducen a **21 identificadores distintos**. Veinte
son la lista (`ALLOWED_GLOBALS`, cada uno con `asValue`, superficie y motivo);
el vigésimo primero es `globalThis`, que **deliberadamente no es entrada**: su
único uso es la puerta (`src/polite/http.ts`, ADR-014 §4) y el caso 9 lo fija
como LA ofensa única de `src/polite/` en vez de concederlo en todas partes. La
lista **no es desproporcionada** — no hay finding para `sdd-arquitecto` — y el
caso 11h exige además que **cada entrada la use hoy el escaneo real**: la lista
no puede ensancharse «por si acaso».

`CAPABILITY_NAMES` está **borrada, no envuelta** (11h lo comprueba sobre el
fuente del guardián), y la lista invertida de 11d demuestra que el juicio sale
solo de lo declarado: con una superficie invertida, `getBuiltinModule` pasa y
`env` es rojo. El control positivo 11c es la undécima evasión **literal**:
`process.getBuiltinModule('node:child_process')` es rojo **por superficie** —
`process` está concedido con `[argv, env, stdout]` — y `process.env` no lo es.

### 2. CA-2: la cobertura recorre el árbol, y quedar fuera es una decisión con motivo

`repositorySources()` recorre el árbol **entero** del repositorio con el mismo
paseo (`walkTree`, extraído y compartido — nunca un segundo) y las mismas
declaraciones que `scannedSources()`. Todo lo que el paseo no visita lo tapa
una exclusión **declarada con su motivo**: seis nuevas — `tests/` (el guardián
mismo), `.git/`, `.next/`, `.claude/` (worktrees de agentes), `raw/` (ADR-005 /
ADR-009) y `next-env.d.ts` —, y `.gitignore` **no se toca**. El filtro a mano
`!path.startsWith('tests/')` de `versionedSources()` desaparece: pregunta a la
misma declaración. El control 2k reproduce F-SPEC-008-V35 con nombre propio
(`robots/side-control.ts`, como 2d/2g no pisan la mutación del verificador):
`git` no lo ve, `resolvesInsideRepository` acepta la ruta desde
`src/ingest/adapter.ts` (el importador no ofendería), y el árbol lo pone rojo.
Los directorios sin código de hoy (`_qa/`, `ventanas/`, `robots/`, `.vercel/`,
`.ai-context/`) **no se excluyen a propósito**: si un día aparece código ahí, el
caso 2j se pone rojo y fuerza la decisión declarada, que es literalmente lo que
CA-2 pide.

### 3. CA-3 y CA-4: la batería, y el residuo con ejemplo

`tests/polite/evasions.test.ts` es la batería: las once formas del §2 de la
spec como casos nombrados E1..E11, cada una ejecutada contra el mecanismo que
la mata hoy — y las supervivencias **también ejecutadas**: E2 (el parser por
regex dejó de ser infracción, CA-2.8), E3 (el guardián de la segunda
composición del UA es la cadena declarada; su mecanismo —el literal congelado
vive en exactamente un fichero de `src/`— se corre aquí sobre la misma lista de
ficheros del escaneo), y E7/N4: el fichero real `src/site/robots-txt.ts` **con
un parser funcional añadido** no ofende a ningún mecanismo estático. **N4 sigue
sobreviviendo y este caso es el que haría visible un cierre por accidente.**
E10 se reproduce **sin escribir en disco** (overlay del lector): la
reproducción en disco es el control 2g de `architecture.test.ts`, y un segundo
fichero real bajo `src/` desde esta suite correría en paralelo con aquel
escaneo y lo pondría rojo por el motivo equivocado. La cabecera dice dónde
entra la duodécima (CA-3.3).

Los cuatro residuos de CA-4 llevan ejemplo ejecutable, todos contra
`127.0.0.1`: una rama de red que nadie ejecuta no dispara nada (CA-4.1); UDP
por `node:dgram` sale del proceso sin pasar por
`net.Socket.prototype.connect` (CA-4.2a); un subproceso no hereda la trampa —
el servidor local **recibe** su petición con **cero** disparos registrados — y
eso demuestra a la vez que la trampa vive en el proceso del test y no en la
plataforma (CA-4.2b + CA-4.4); y `z` de `zod` es la superficie concedida cuyo
contenido nadie juzga (CA-4.3, en la batería por ser estático).

### 4. Gates — las TRES salidas literales (2026-09-02, este checkout)

```
$ npm run lint
> marcador@0.0.1 lint
> oxlint --type-aware
(sin diagnósticos; exit=0)

$ npm test
 Test Files  82 passed (82)
      Tests  800 passed (800)
Type Errors  no errors
   Duration  4.38s

$ npm run test:db        # DATABASE_URL_TEST real, desde .env.local
 Test Files  8 passed (8)
      Tests  144 passed (144)
   Duration  53.38s
```

**Recuento fichero a fichero contra `main` (777 → 800)**: el diff completo es
`tests/polite/architecture.test.ts` 41→49, `tests/polite/containment.test.ts`
17→20 y `tests/polite/evasions.test.ts` +12 (nuevo). Las suites cerradas —
`tests/mirror` (16 ficheros), `tests/site` (14), `tests/docs` (1),
`tests/model` (13), `tests/raw` (2 en la suite rápida), `tests/db` (144/144 en
integración) y `tests/types` (7) — **idénticas fichero a fichero**: ninguna
pierde un caso.

### 5. Mutaciones de esta vuelta, aplicadas y revertidas

| # | Mutación | Resultado |
|---|---|---|
| M1 | `ALLOWED_GLOBALS` sin la entrada `process` | **ROJO ×3**: `architecture` 8, 11c y `evasions` E11 *(corregido en la 2ª vuelta por F-SPEC-009-V3: esta fila decía «11h», y 11h no puede ponerse rojo por QUITAR una entrada — vigila que las que están se usen. El ×3 era cierto; el tercer caso, no)* |
| M2 | `repositorySources()` devuelta a `git` (`versionedSources`) | **ROJO**: `architecture` 2k — la reproducción exacta de V35 deja de verse |
| M3 | R5 de SPEC-008: la octava evasión repuesta en `#captureGranted` de `src/ingest/adapter.ts` | **ROJO EN LAS DOS MITADES**, igual que documenta SPEC-008: `architecture` 3 + `containment` 2, 4, 8, 9. Revertida; `git diff main -- src/` vacío |

Y el ciclo RED→GREEN de TDD quedó medido en la propia vuelta: los 10 casos
nuevos/actualizados de CA-1 corrieron **rojos** contra el guardián viejo antes
de escribir `freeReferences` y `ALLOWED_GLOBALS`.

## Veredicto del verificador — primera vuelta: RED (2026-09-02, `sdd-verificador`)

**RED, con dos findings bloqueantes, y el mecanismo de esta vuelta es en lo
demás CORRECTO: lo comprobé rompiéndolo por cinco sitios y muerde por los
cinco.** M1 (`process` fuera de la lista) → ROJO ×3; V34 reproducida con un
fichero REAL (`src/ingest/vdoor9.ts`) → ROJO en `architecture` 8 **por
superficie**, con el mensaje exacto; V35 reproducida con un `robots/side.ts`
real en la raíz, invisible a `git status` → ROJO en 2j; M2 (la cobertura
devuelta a `git`) → ROJO en 2k; ambient-off → ROJO en 11e; R5 (la octava en
`#captureGranted`) → ROJO en las DOS mitades, igual que en SPEC-008. La
medición de CA-1.6 la re-derivé yo con el mismo lector: **89 ficheros, 182
referencias libres, 21 identificadores distintos** — idéntica a la del
implementador, lista proporcionada, sin finding para `sdd-arquitecto`. Gates:
`lint exit=0`, `npm test` 800/800, `test:db` 144/144 (tras el flake de DNS
F-SPEC-008-21), suites cerradas idénticas fichero a fichero contra `main`
(79/79). `git diff main -- src/ migrations/ .gitignore` vacío.

**Pero la duodécima existe, la escribí y la ejecuté, y son DOS — las dos con
los tres gates en verde.** La primera (F-SPEC-009-V1) falsifica CA-2 con sus
propias palabras: un **symlink** de código es invisible a las tres listas a la
vez, y quedar fuera del escaneo vuelve a NO ser una decisión declarada. La
segunda (F-SPEC-009-V2) demuestra que el residuo declarado de CA-4 es menor
que el residuo real: la capacidad `eval` se alcanza sin escribir `eval`, ni
`Function`, ni ningún identificador libre. Las dos entran en la batería como
manda CA-3.3, y ninguna exige tocar `src/` ni reabrir nada firmado.

Estado por CA: CA-1 ✅ · CA-2 ❌ (V1) · CA-3 ✅ · CA-4 ❌ (V2) · CA-5 ✅ ·
CA-6 ✅ · CA-7 ✅. Las cuatro salvedades del implementador
(F-SPEC-009-1..4): **1, 2 y 3 aceptadas** tal como están escritas; la **4 se
queda corta** — su texto declara el grano «primer nivel de miembro sobre un
global concedido», y V2 mide que el hueco real es más ancho: el miembro sobre
una expresión que NO es identificador no se juzga jamás, a ningún nivel.

### Mutaciones de esta vuelta (todas aplicadas en un worktree desechable y revertidas; el checkout de la rama no se tocó)

| # | Mutación / ataque | Resultado |
|---|---|---|
| M1 | `ALLOWED_GLOBALS` sin la entrada `process` | **ROJO ×3**: `architecture` 8, 11c y `evasions` E11 (no 11h — ver V3) |
| M2 | `repositorySources()` delegada en `versionedSources()` | **ROJO**: `architecture` 2k |
| V34-real | `src/ingest/vdoor9.ts` con `process.getBuiltinModule('node:child_process')` | **ROJO**: `architecture` 8 (`does not declare \`getBuiltinModule\` in its surface`) + 13 |
| V35-real | `robots/side.ts` en la raíz, con `cheerio.fromURL`; `git status` vacío | **ROJO**: `architecture` 2j |
| amb-off | `isAmbientDeclaration` devuelve siempre `false` | **ROJO**: `architecture` 11e |
| R5 | La octava evasión repuesta en `#captureGranted` de `src/ingest/adapter.ts` | **ROJO EN LAS DOS MITADES**: `architecture` 3 + `containment` 2, 4, 8, 9. Revertida, diff vacío |
| **S1/S2** | **Symlink** `robots/evil-link.ts` (raíz) y `src/ingest/robots/evil.ts` (bajo raíz), destino con `cheerio.fromURL`, el segundo IMPORTADO desde `adapter.ts` | **VERDE TOTAL: lint exit=0, `tests/polite` 114/114, `npm test` 800/800, typecheck limpio** → F-SPEC-009-V1 |
| **F** | `src/db/fdoor.ts`: `const cp = (''.constructor.constructor)("return process.getBuiltinModule('node:child_process')")()` | **VERDE TOTAL: lint exit=0, `tests/polite` 114/114** → F-SPEC-009-V2 |

## Segunda vuelta — el paseo decide los symlinks, y el residuo de `eval` se escribe donde se juzga (2026-09-02, `sdd-implementador`)

Dos findings bloqueantes, dos arreglos, y ninguno toca `src/` (CA-6). Los dos
ciclos fueron TDD medido: los casos nuevos corrieron ROJOS contra el guardián
viejo antes de escribir el mecanismo (E12a y 2l cayeron con `walkRefusals is
not a function`; la aserción de E12b sobre el texto del criterio cayó con el
residuo aún sin escribir, mientras sus mitades estática y dinámica ya pasaban —
que es exactamente lo que una superviviente debe hacer).

### 1. F-SPEC-009-V1 → cerrado con mecanismo: el paseo clasifica TODO dirent, y refusa nombrándose

El defecto era un cuarto destino silencioso: un dirent de symlink no es
`isFile()` ni `isDirectory()` y `walkTree` lo saltaba sin raíz, sin exclusión y
sin motivo. Ahora el paseo es **exhaustivo y declarado**: fichero juzgado,
directorio recorrido, exclusión declarada con motivo, o **refusal rojo por
construcción, nombrándose** — para un symlink y para cualquier otra cosa que la
plataforma pueda poner en un directorio (FIFO, socket: lo que el paseo no sabe
clasificar es rojo, nunca silencio, la misma obligación que ADR-016 §5 bis le
pone al lector). El paseo **no sigue el enlace**: resolverlo auditaría un
fichero de fuera del repositorio bajo una ruta de dentro, y un symlink de
directorio injertaría un árbol ajeno entero. La única salida sigue siendo una
exclusión declarada con su motivo, comprobada en sus dos formas (dentro de una
exclusión no se entra; un symlink EN una ruta excluida tampoco se refusa).

- `walkRefusals(extensions?, exclusions?, base?)` expone las refusals del árbol
  entero; `base` existe SOLO para que la batería reproduzca sobre un árbol
  sintético fuera del repositorio — un symlink real escrito por E12a correría
  en paralelo con el guardián vivo de `architecture.test.ts` y lo pondría rojo
  por el motivo equivocado (el mismo razonamiento que E10 sin disco).
- **Caso 2l** (`architecture.test.ts`, CA-2.6): el árbol real no tiene hoy
  ninguna refusal, y el control positivo con nombre propio
  (`robots/refusal-control.ts` y `src/ingest/refusal-control-tree`, colgantes a
  propósito y preguntados con `lstatSync`, porque `existsSync` sigue el enlace
  y mentiría) comprueba las dos formas medidas — y que refusar NO es leer:
  ninguno entra en la lista de ficheros de nadie.
- **E12a** (batería, CA-3.3): S1, S2 y el symlink de DIRECTORIO, con el paseo y
  las listas reales sobre árbol sintético.

### 2. F-SPEC-009-V2 → el residuo se ensancha y se ESCRIBE dentro del criterio, con E12b como superviviente medida

No hay mecanismo que cierre `constructor.constructor` sin lista negra: juzgar
`constructor` por su nombre sería un nombre otra vez (ADR-016 §3.5), y el
verificador lo dijo con esas palabras. El arreglo honesto es el de ADR-016 §6:
el párrafo del residuo vive ahora en el docstring de `capabilityOffences`
(`capability.ts`), nombrado de forma medible — el miembro se juzga SOLO cuando
su base es un identificador libre; sobre cualquier otra expresión (un literal,
un resultado, un local) no se juzga jamás, a ningún nivel, y por
`constructor.constructor` todo valor alcanza `Function`: la capacidad `eval` es
alcanzable sin escribir `eval`, `Function` ni ningún identificador libre. Lo
que lo estrecha es la trampa de CA-2.1 (el byte sigue teniendo que salir por un
socket de este proceso); lo que lo cerraría es la cobertura, que este proyecto
no mide (EPIC-MEJORA, ADR-016 §Consecuencias negativas 2).

**E12b** (batería, describe CA-4.3) lo mantiene medible con tres aserciones:
la reproducción literal del verificador sobrevive a los DOS juicios estáticos
(`importOffences` y `capabilityOffences` vacíos — `process` solo existe dentro
de una cadena); la expresión ENTREGA `node:child_process` entero en el proceso
del test, sin mandar un byte (RN-11: se demuestra que se podría, no se pide
nada); y el párrafo del residuo tiene que seguir escrito en el guardián —
borrarlo sin borrar el caso es rojo. Es superviviente A PROPÓSITO, como N4:
matarla exigiría un mecanismo nuevo con firma, y este caso es el que lo haría
visible. La nota al gate va en F-SPEC-009-6. F-SPEC-009-4 queda ensanchada como
pidió el veredicto.

### 3. F-SPEC-009-V3 y V4

La fila M1 de la primera vuelta está corregida (el tercer rojo es `evasions`
E11, no 11h), con la corrección anotada en la propia fila para que el mapa de
mutaciones no envejezca mal. Y F-SPEC-008-V36, V38 y V39 tienen destino
propuesto por escrito en F-SPEC-009-5, porque ninguno cabe en los CA firmados
de esta spec y cerrarla sin decirlo los dejaría huérfanos otra vez.

### 4. Gates — las TRES salidas literales (2026-09-02, este checkout)

```
$ npm run lint
> marcador@0.0.1 lint
> oxlint --type-aware
(sin diagnósticos; exit=0)

$ npm test
 Test Files  82 passed (82)
      Tests  803 passed (803)
Type Errors  no errors
   Duration  4.40s

$ npm run test:db        # DATABASE_URL_TEST real, desde .env.local
 Test Files  8 passed (8)
      Tests  144 passed (144)
   Duration  52.92s
```

**Recuento fichero a fichero contra `main` (777 → 803)**: el diff completo de
suites es `tests/polite/architecture.test.ts` 41→**50**,
`tests/polite/containment.test.ts` 17→20 y `tests/polite/evasions.test.ts`
+**14**. Las suites cerradas — `tests/mirror`, `tests/site`, `tests/docs`,
`tests/model`, `tests/raw`, `tests/db` (144/144 en integración) y
`tests/types` — **idénticas fichero a fichero**: ninguna pierde un caso. El
único fichero con diff fuera de `tests/polite/` es
`tests/mirror/support/imports.ts` (el soporte de la primera vuelta), que no es
una suite.

### 5. Mutaciones de esta vuelta, aplicadas y revertidas

| # | Mutación / ataque | Resultado |
|---|---|---|
| S1+S2 | **La duodécima del verificador, repetida tal cual**: symlink `robots/evil-link.ts` (raíz) y `src/ingest/robots/evil.ts` (bajo raíz), destino con `cheerio.fromURL` fuera del repositorio | **ROJO**: `architecture` 2l, nombrando LOS DOS — `robots/evil-link.ts: a symbolic link, which the walk refuses by construction (F-SPEC-009-V1)` y su gemelo bajo `src/ingest/`. Revertida; árbol limpio |
| M4 | El paseo devuelto al salto silencioso (`isSymbolicLink() → continue` sin refusal) | **ROJO ×2**: `evasions` E12a + `architecture` 2l (control positivo). Revertida |
| F | La segunda forma repetida tal cual: `src/db/fdoor.ts` con `(''.constructor.constructor)("return process.getBuiltinModule('node:child_process')")()` | **VERDE — sobrevive, y AHORA es lo que el criterio declara**: 117/117, el residuo escrito la nombra y E12b la mantiene medible. Revertida |
| (RED de TDD) | E12b con el párrafo del residuo aún sin escribir en `capability.ts` | **ROJO**: `expected … to match /F-SPEC-009-V2/` — borrar el texto del criterio sin borrar el caso es rojo |

## Veredicto del verificador — segunda vuelta: GREEN (2026-09-02, `sdd-verificador`)

**GREEN. Los dos bloqueantes están atendidos de verdad, lo comprobé repitiendo
mis propias evasiones y buscando variantes, y nada de lo que estaba ✅
regresó.**

- **F-SPEC-009-V1 → cerrada con mecanismo, verificado rompiendo.** S1+S2
  repetidas tal cual (symlinks reales `robots/evil-link.ts` y
  `src/ingest/robots/evil.ts` hacia un fichero con `cheerio.fromURL` fuera del
  repositorio) → **ROJO en `architecture` 2l nombrando los dos**. Variantes que
  el arreglo también mata: symlink de **directorio** real bajo una raíz
  (`src/ingest/vendor` → árbol externo) → ROJO nombrándose; symlink con
  extensión que no es de código (`src/db/notes.txt`) → refusado igual (la
  refusal no depende del nombre, que es lo correcto). M4 (el paseo devuelto al
  salto silencioso) → ROJO ×2: E12a + 2l. La única variante que sobrevive es un
  directorio `chmod 000` bajo una raíz (el `catch → return` de `readdirSync` es
  silencioso), y está medida como **no bloqueante**: F-SPEC-009-V5 abajo.
- **F-SPEC-009-V2 → cerrada como residuo declarado, y es medible.** F repetida
  tal cual (`src/db/fdoor.ts` con
  `(''.constructor.constructor)("return process.getBuiltinModule('node:child_process')")()`)
  → sobrevive con `lint exit=0` y `tests/polite` 117/117, **y eso es hoy
  exactamente lo que el criterio declara**: el párrafo del residuo vive en el
  docstring de `capabilityOffences`, nombra F-SPEC-009-V2 y el ejemplo, y
  **borrarlo sin borrar el caso es ROJO en E12b** (mutación repetida por mí).
  El texto ensanchado cubre las variantes que busqué — miembro sobre una
  ligadura importada (`load.constructor.…`), sobre un local, a cualquier
  profundidad — porque declara el hueco entero («sobre cualquier otra
  expresión, jamás, a ningún nivel»), no un caso. La decisión de pagar o no un
  mecanismo queda donde debe: gate humano (F-SPEC-009-6).
- **F-SPEC-009-V3 → verificada cierta**: M1 repetida por mí (la entrada
  `process` fuera de `ALLOWED_GLOBALS`) → ROJO ×3 en `architecture` 8, 11c y
  `evasions` **E11**, exactamente lo que la fila corregida dice.
- **F-SPEC-009-V4 → cerrada por F-SPEC-009-5**: V36, V38 y V39 tienen destino
  propuesto por escrito (EPIC-MEJORA, con disparadores), pendiente solo de la
  confirmación de `sdd-arquitecto` + gate humano al cierre, que es lo que el
  finding pedía.
- **Regresiones**: R5 repetida (la octava evasión repuesta en `adapter.ts`) →
  ROJO en `architecture` 3, revertida con `git diff main -- src/` en 0 líneas;
  los 20 casos de `containment` (la trampa que deniega por defecto, RN-11) y
  los recuentos 50/20/14 de `tests/polite` en verde; suites cerradas byte a
  byte las de `main` (el diff entero de la rama son 5 ficheros de `tests/` y
  los 2 docs). Gates corridos por mí en worktree limpio: `lint exit=0` ·
  `npm test` **803/803** · `test:db` **144/144** al primer intento. CA-6:
  `git diff main -- src/ migrations/ .gitignore` → 0 líneas; ningún HTML de
  terceros (ADR-009 §3).

Estado por CA: CA-1 ✅ · CA-2 ✅ · CA-3 ✅ · CA-4 ✅ · CA-5 ✅ · CA-6 ✅ ·
CA-7 ✅. Salvedades vivas para el gate humano al cierre: F-SPEC-009-4 y 6 (el
residuo de `constructor.constructor`, declarado y con superviviente medida),
F-SPEC-009-5 (destinos propuestos para V36/V38/V39) y F-SPEC-009-V5 (abajo, no
bloqueante).

### Mutaciones y ataques de esta verificación (todos en un worktree desechable, revertidos; el checkout de la rama no se tocó)

| # | Mutación / ataque | Resultado |
|---|---|---|
| S1+S2 | Mis symlinks de la 1ª verificación, repetidos tal cual | **ROJO**: `architecture` 2l, nombrando los dos |
| S3 | Symlink de DIRECTORIO real: `src/ingest/vendor` → árbol externo con código | **ROJO**: 2l, `src/ingest/vendor: a symbolic link…` |
| S4 | Symlink `src/db/notes.txt` (extensión no-código) hacia fichero externo | **ROJO**: refusado igual — la refusal no mira la extensión |
| S5 | `src/ingest/secret/` con `evil.ts` (`cheerio.fromURL`) dentro y `chmod 000` | **VERDE en silencio** (refusals `[]`, `tests/polite` 102/102) — pero `git add` → *Permission denied*: no puede versionarse ni ejecutarse → F-SPEC-009-V5, no bloqueante |
| F | `src/db/fdoor.ts`, repetida tal cual | **VERDE — sobrevive, y es lo que el criterio declara** (117/117); E12b y el docstring la nombran |
| M-res | Borrar el párrafo del residuo del docstring de `capabilityOffences` | **ROJO**: E12b (`expected … to match /F-SPEC-009-V2/`) |
| M4 | El paseo devuelto al salto silencioso de symlinks | **ROJO ×2**: E12a + `architecture` 2l |
| M1 | `ALLOWED_GLOBALS` sin la entrada `process` | **ROJO ×3**: `architecture` 8, 11c, `evasions` E11 — la fila corregida por V3 es exacta |
| R5 | La octava evasión (`fromURL`) repuesta en `src/ingest/adapter.ts` | **ROJO**: `architecture` 3. Revertida, diff vacío |

## Evidencia visual

No aplica: esta spec no tiene interfaz. Toda la evidencia es de ejecución y
está en la tabla de mutaciones y en las salidas literales de los gates.

## Salvedades / follow-ups
<!-- IDs F-SPEC-009-1, F-SPEC-009-2… con destino (spec futura o EPIC-MEJORA). -->

- **F-SPEC-009-V1 — CERRADA en la 2ª vuelta y verificada el 2026-09-02** (el
  paseo refusa por construcción; S1/S2 y las variantes S3/S4 mueren en 2l
  nombrándose; M4 la mata dos veces). *Texto original:* ❌ BLOQUEANTE, y falsifica CA-2 con sus propias palabras:
  un SYMLINK de código es invisible a las TRES listas a la vez.** `walkTree`
  acepta solo `entry.isFile()` y baja solo por `entry.isDirectory()`, y un
  dirent de symlink no es ninguna de las dos cosas: **se salta en silencio**,
  sin raíz, sin exclusión y sin motivo — «una regla escrita para otra cosa» ni
  siquiera: un accidente de `readdirSync(withFileTypes)`. Medido dos veces el
  2026-09-02: (S1) `robots/evil-link.ts` → fichero con `cheerio.fromURL` fuera
  del repositorio, escondido por `.gitignore:17` — `tests/polite` **114/114**;
  (S2) `src/ingest/robots/evil.ts`, **bajo una raíz del escaneo**, importado
  desde `src/ingest/adapter.ts` (`import { sideAsk } from './robots/evil'`) —
  `lint exit=0`, `npm test` **800/800**, typecheck limpio, y el fichero con
  `fromURL` no lo juzga NADIE: `scannedSources()` no lo lee (symlink),
  `versionedSources()` no lo lista (`.gitignore`), `repositorySources()` no lo
  visita, 2c no compara nada (las dos listas lo pierden a la vez) y el
  especificador relativo de `adapter.ts` resuelve dentro del repositorio. Es
  la familia de V33/V35 un mecanismo más allá, y con symlinks de DIRECTORIO el
  agujero es un árbol entero. **Arreglo en `tests/`**: el paseo tiene que
  decidir los symlinks de forma DECLARADA — rojo por construcción nombrándose,
  o resolver y juzgar —, y la evasión entra en la batería (E12a, CA-3.3).
  **Destino: `sdd-implementador`, esta spec.**
- **F-SPEC-009-V2 — CERRADA en la 2ª vuelta como residuo declarado y
  verificada el 2026-09-02** (el docstring de `capabilityOffences` la nombra
  con su ejemplo; E12b la mantiene medible; borrar el texto es rojo; la
  decisión de pagar un mecanismo queda en F-SPEC-009-6, gate humano). *Texto
  original:* ❌ BLOQUEANTE por ADR-016 §6: el residuo declarado es
  MENOR que el residuo real.** La capacidad `eval` es alcanzable sin nombrar
  `eval`, `Function`, ni NINGÚN identificador libre:
  `(''.constructor.constructor)("return process.getBuiltinModule('node:child_process')")()`
  en `src/db/fdoor.ts` deja `lint exit=0` y `tests/polite` **114/114**, y
  entrega `node:child_process` entero (medido 2026-09-02). `capabilityOffences`
  juzga miembros SOLO cuando la base es un identificador libre; el miembro
  sobre un literal —o sobre cualquier valor local— no se juzga jamás, y por la
  cadena `constructor.constructor` TODO valor alcanza `Function`. CA-1.3
  mantiene rojos los NOMBRES `eval`/`Function`, pero la capacidad que esos
  nombres guardan queda abierta, y ningún residuo escrito de CA-4 la nombra de
  forma medible (CA-4.3 habla de «superficie concedida»; aquí no se concede
  nada). No veo mecanismo que la cierre sin lista negra (`constructor` cableado
  sería un nombre otra vez, ADR-016 §3.5). **Arreglo honesto**: el residuo se
  ESCRIBE dentro del criterio con este ejemplo, y la evasión entra en la
  batería como superviviente medida (E12b), como N4 — si el gate humano
  prefiere pagar un mecanismo, es su firma, no la mía. **Destino:
  `sdd-implementador` (texto del residuo + caso), con nota al gate.**
- **F-SPEC-009-V3 — CERRADA: fila corregida en la 2ª vuelta, y verificada
  cierta el 2026-09-02 (M1 repetida → 8, 11c, E11).** *Texto original:* nota, no bloqueante: la fila M1 del implementador dice
  «rojo ×3: architecture 8, 11c, 11h», y lo medido es 8, 11c y `evasions`
  E11.** 11h no puede ponerse rojo por QUITAR una entrada (vigila que las que
  están se usen). El ×3 es cierto; el tercer caso, no. Va dicho para que el
  mapa de mutaciones no envejezca mal. **Destino: corregir la fila en la
  siguiente vuelta.**
- **F-SPEC-009-V4 — CERRADA por F-SPEC-009-5: los tres heredados tienen destino
  propuesto por escrito, a confirmar por `sdd-arquitecto` + gate humano al
  cierre.** *Texto original:* abierto heredado, no de esta vuelta: F-SPEC-008-V36, V38 y
  V39 fueron rutados «destino SPEC-009» en el ledger de SPEC-008 y esta spec
  no los cubre en ningún CA ni los nombra en su «Fuera de alcance».**
  Comprobado: `resolveModule()` conserva su lista propia `.ts`/`.tsx` (V36,
  falla cerrado — sigue siendo un rojo falso esperando al primer `.mts`
  legítimo), y la exclusión de `docs/diseno/` sigue siendo por directorio y más
  ancha que su motivo (V38/V39). Ninguno es bloqueante aquí; los tres necesitan
  destino nuevo escrito antes del cierre de esta spec. **Destino:
  `sdd-arquitecto` al cerrar la spec (re-rutar o declararlos residual).**
- **F-SPEC-009-V5 — no bloqueante, medido en la 2ª verificación (2026-09-02):
  un directorio ilegible bajo una raíz queda fuera del escaneo en silencio.**
  `walkTree` envuelve `readdirSync` en `catch { return }`: un
  `src/ingest/secret/` con un `evil.ts` (`cheerio.fromURL`) dentro y
  `chmod 000` deja `walkRefusals()` vacío y `tests/polite` 102/102 — un cuarto
  destino silencioso, la misma familia que V1 («lo que el paseo no sabe
  clasificar es rojo, nunca silencio»). **No bloquea porque el estado oculto es
  inerte, y está medido**: `git add` falla con *Permission denied* (no puede
  versionarse ni llegar a producción — git no conserva permisos de directorio),
  Node tampoco puede importarlo, y volverlo legible lo pone rojo en el acto. A
  diferencia de V1, no existe ningún estado en que el código esté a la vez
  oculto y vivo. Arreglo de una línea si se quiere: refusar el `readdir`
  fallido salvo `ENOENT`. **Destino: EPIC-MEJORA**, disparador: la próxima vez
  que alguien toque `walkTree`.
- **Sobre las salvedades del implementador**: F-SPEC-009-1 (mensajes nuevos)
  **aceptada** — misma aserción, mensaje del mecanismo que la emite;
  F-SPEC-009-2 (exención de posiciones de tipo) **aceptada** — busqué una vía
  de capacidad por posición de tipo y no la hay: la vía que encontré (V2) no
  pasa por tipos; F-SPEC-009-3 (directorios hoy vacíos sin excluir)
  **aceptada** — es el comportamiento especificado; F-SPEC-009-4 (primer nivel
  de miembro) **se queda corta**: V2 mide que el hueco real incluye el miembro
  sobre expresiones que no son identificador, a cualquier nivel. Su texto se
  ensancha con el arreglo de V2.

- **F-SPEC-009-1 — Los mensajes de ofensa de `capabilityOffences` cambiaron de
  forma.** CA-1.3 dice que los casos 8..12 «no pierden ni una aserción»; no
  pierden ninguna —mismo número, misma fuerza, cada forma sigue roja— pero los
  **literales esperados** pasaron del formato de la lista negra
  (`src/polite/http.ts: globalThis`) al del mecanismo nuevo
  (``src/polite/http.ts: `globalThis` is not a declared global identifier``).
  Conservar los literales viejos habría exigido un mapa nombre→etiqueta, que es
  una lista de nombres otra vez. Va dicho aquí para que el verificador lo
  juzgue como lo que es: la misma aserción con el mensaje del mecanismo que la
  emite. **Destino: el veredicto de esta spec.**
- **F-SPEC-009-2 — La exención de las posiciones de tipo es una decisión de
  mecanismo, y va argumentada, no escondida.** Un identificador libre usado
  SOLO en posición de tipo (`Promise<void>` en una anotación, `NodeJS.Process`)
  no se juzga: la emisión lo borra entero, no cruza capacidad, y es el mismo
  principio firmado para `import type` en CA-2.3. El coste de no eximirlas
  sería una lista del tamaño de los tipos del repositorio, no de sus
  capacidades. Si el verificador encuentra una vía en que una posición de tipo
  obtenga capacidad en ejecución, eso es una duodécima evasión y entra en la
  batería. **Destino: el veredicto de esta spec.**
- **F-SPEC-009-3 — La lista de cobertura no excluye los directorios hoy vacíos
  de código (`_qa/`, `ventanas/`, `robots/`, `.vercel/`, `.ai-context/`), a
  propósito.** Si un fichero con extensión de código aparece en uno, el caso 2j
  se pone rojo y fuerza la decisión declarada — que es lo que CA-2 pide. El
  efecto lateral honesto: quien deje un `.ts` suelto en `_qa/` pondrá roja la
  suite de la frontera. Es el precio correcto y va dicho, como el «fichero
  basura bajo una raíz es rojo» de CA-2.6. **Sin destino: es el comportamiento
  especificado.**
- **F-SPEC-009-4 — el juicio de miembros alcanza EXACTAMENTE un nivel, y solo
  sobre una base que sea identificador libre.** *(Ensanchada en la 2ª vuelta,
  como pidió el veredicto de la 1ª: el texto original decía solo «primer nivel
  de miembro», y F-SPEC-009-V2 midió que el hueco real es más ancho.)* Dos
  mitades: (a) `freeReferences` juzga el primer nivel
  (`process.getBuiltinModule`), no los siguientes (`process.env.X`) — la misma
  línea de grano que las superficies de `ALLOWED_PACKAGES`; y (b) **el miembro
  sobre una expresión que NO es un identificador libre no se juzga jamás, a
  ningún nivel** — un literal, el resultado de una llamada, un valor local — y
  por `constructor.constructor` todo valor alcanza `Function`
  (F-SPEC-009-V2). Las dos mitades están hoy ESCRITAS dentro del criterio
  (docstring de `capabilityOffences`) y la segunda tiene superviviente medida
  en la batería (E12b). **Sin destino: residuo declarado del criterio (ADR-016
  §6), con la nota al gate en F-SPEC-009-6.**
- **F-SPEC-009-5 — destino propuesto, por escrito, para los tres heredados que
  esta spec no cubre (cierra F-SPEC-009-V4).** F-SPEC-008-V36, V38 y V39
  fueron rutados «destino SPEC-009» en el ledger de SPEC-008 y ningún CA
  firmado de esta spec los alcanza; dejarlos sin destino al cerrar sería
  perderlos otra vez. Propuesta del implementador, para que `sdd-arquitecto` y
  el gate humano la confirmen o la muevan al cerrar la spec:
  1. **F-SPEC-008-V36** (la cuarta lista de extensiones, en `resolveModule()`
     de `tests/mirror/support/imports.ts`): **EPIC-MEJORA.** Su modo de fallo
     es un **rojo falso, nunca un verde falso** — un `.mts`/`.cts`/`.js`/`.mjs`
     legítimo quedaría huérfano y pondría rojo `architecture` 13 —, así que no
     es un agujero de frontera sino deuda de ergonomía. Disparador (el mismo
     que ya tiene escrito): el día que entre en el repositorio un fichero
     legítimo de esas extensiones. No se arregla aquí porque tocar el
     resolvedor mueve el conjunto `reachable` del que dependen los casos 13,
     15, 16 y 17 (CA-5: lo construido no se rehace).
  2. **F-SPEC-008-V38 y V39** (lo que cuesta la exclusión de `docs/diseno/`, y
     que es por directorio y más ancha que su motivo): **EPIC-MEJORA, como una
     sola entrada.** Son un residuo declarado de CA-2.6 de SPEC-008 que CA-2 de
     esta spec no reabre — la exclusión sigue siendo una decisión declarada con
     motivo, que es lo que ambos CA piden. Disparadores (los que V38/V39 ya
     traen escritos): el día que algo bajo una raíz importe algo de
     `docs/diseno/`, o el día que EPIC-004 se descongele y sus fuentes pasen a
     ser código desplegado.
  **Destino: `sdd-arquitecto` + gate humano al cierre de esta spec, con esta
  propuesta delante.**
- **F-SPEC-009-6 — nota al gate humano: el residuo de `constructor.constructor`
  queda DECLARADO, no cerrado, y cambiar eso es una firma.** La segunda forma
  de la duodécima (F-SPEC-009-V2) sobrevive a propósito como residuo escrito
  (ADR-016 §6): no se conoce mecanismo que la cierre sin lista negra — juzgar
  `constructor` por su nombre sería un nombre otra vez (§3.5), y el verificador
  llegó a la misma conclusión. Si el gate prefiere **pagar un mecanismo**
  (p. ej. juzgar TODO acceso a miembro cuyo nombre coincida con uno «peligroso»
  sea cual sea la base, que es una lista negra asumida y dicha, o exigir
  cobertura en ejecución, que hoy no se mide), esa es su firma, no la del
  implementador ni la del verificador. Mientras tanto la contención real es la
  trampa de CA-2.1: la expresión entrega la capacidad, pero el byte sigue sin
  poder salir de un test hacia un tercero. **Destino: gate humano de esta
  spec.**

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->

**Segunda verificación GREEN (2026-09-02): la spec está en `hecho`.** Queda
para el gate humano al cierre: confirmar los destinos de F-SPEC-009-5
(V36/V38/V39 → EPIC-MEJORA), la nota F-SPEC-009-6 (el residuo de
`constructor.constructor`, declarado, con E12b de superviviente) y
F-SPEC-009-V5 (el directorio ilegible, EPIC-MEJORA). El cierre mecánico
(tablero, índices) es de `sdd-documentalista`.

Lo que sigue es el handoff de la segunda vuelta de implementación, que quedó
así verificado:

Los cuatro findings de la primera están atendidos:
**V1** cerrada con mecanismo (`walkTree` clasifica todo dirent; `walkRefusals`;
caso 2l + E12a), **V2** escrita como residuo dentro del criterio (docstring de
`capabilityOffences`) con E12b como superviviente medida y nota al gate
(F-SPEC-009-6), **V3** corregida en la fila M1 de la primera vuelta, **V4** con
destino propuesto por escrito (F-SPEC-009-5, a confirmar por `sdd-arquitecto` y
gate humano al cierre). Gates: `lint exit=0` · `npm test` **803/803** ·
`test:db` **144/144**. `git diff main -- src/ migrations/ .gitignore` sigue
vacío. Commits de la vuelta: `919942a` (V1) y `417f232` (V2), más el del
ledger.

**Para el verificador, lo nuevo de esta vuelta**: las mutaciones S1/S2 de tu
primera verificación ahora mueren en `architecture` 2l nombrándose (repetidas
tal cual, ver tabla de la segunda vuelta); el control 2l usa **nombres
propios** (`robots/refusal-control.ts`, `src/ingest/refusal-control-tree`), así
que tus symlinks y los suyos conviven; E12a reproduce sobre árbol sintético
fuera del repositorio (mismo paseo, mismas listas, `base` parametrizada) para
no correr en paralelo contra el guardián vivo; y la F de `src/db/fdoor.ts`
sigue VERDE **a propósito** — es E12b y el residuo escrito, no un olvido.

Lo que sigue es el handoff de la implementación de la primera vuelta, que
sigue siendo válido:

1. **La firma del gate fue (a)**: lista blanca de identificadores globales con
   superficie y motivo (Alberto Fojo, 2026-09-01). Implementada: quién decide
   libre/ligado es el **checker** (`freeReferences` en
   `tests/mirror/support/imports.ts`); la lista es `ALLOWED_GLOBALS` en
   `tests/polite/support/capability.ts` (20 entradas, cada una con `asValue`,
   superficie y motivo). La medición de CA-1.6 dio **21 identificadores libres
   distintos** — lista proporcionada, sin finding para `sdd-arquitecto`.
2. **Dónde vive cada cosa**: el lector y `freeReferences` en
   `tests/mirror/support/imports.ts`; listas, exclusiones, `walkTree`,
   `repositorySources` y los dos juicios en
   `tests/polite/support/capability.ts`; los guardianes en
   `tests/polite/architecture.test.ts` (estático) y
   `tests/polite/containment.test.ts` (ejecución + residuos CA-4); la batería
   de las once evasiones en `tests/polite/evasions.test.ts`.
3. **Para el verificador**: las mutaciones R1..R13/Q/N de SPEC-008 siguen
   siendo el mapa (spot-check R5 repetido en la primera vuelta, mismo
   resultado). La duodécima ya entró (E12a y E12b); la decimotercera, si
   aparece, entra como caso en `evasions.test.ts` (su cabecera lo dice). Las
   salvedades F-SPEC-009-1..6 son deliberadas y esperan juicio, no arreglo
   (la 4 ya ensanchada como pidió tu veredicto; la 5 y la 6 son de la segunda
   vuelta).
4. **N4 sigue sobreviviendo** (CA-3.2) y ahora tiene caso propio: E7/N4 en la
   batería reproduce el parser funcional y exige que NO ofenda.
5. **Para correr las tres suites desde un worktree**: `npm ci` **dentro** del
   worktree y copiar `.env.local` del checkout principal (para
   `DATABASE_URL_TEST`). Nunca un symlink, nunca `git add -f`. Si `test:db` da
   `ENOTFOUND` contra Neon, es DNS: repetir (F-SPEC-008-21).
