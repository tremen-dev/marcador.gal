---
id: SPEC-009
tipo: ledger
epica: EPIC-002
---
# Ledger — SPEC-009 La frontera de capacidad de RN-11, demostrada sin listas negras

## Resumen
- Fase: **`en-revision`** — aprobada por Alberto Fojo el 2026-09-01,
  implementada por `sdd-implementador` el 2026-09-02 (primera vuelta, ver
  «Primera vuelta» abajo). Espera verificación.
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
| CA-1 — lista blanca de identificadores globales, con superficie y motivo | `tests/mirror/support/imports.ts` (`freeReferences`: el checker decide libre/ligado; ambient no liga; tipo se exime; shorthand se juzga por su valor) · `tests/polite/support/capability.ts` (`ALLOWED_GLOBALS`, 20 entradas con `asValue`+superficie+motivo; `capabilityOffences` juzga SOLO contra lo declarado; `CAPABILITY_NAMES` borrada) | `tests/polite/architecture.test.ts` casos 8, 9, 10, 11, 11b (conservados, mensajes nuevos) y 11c (V34 literal: rojo por superficie, `process.env` verde), 11d (lista invertida, como 4c), 11e (ambient), 11f (shorthand), 11g (CA-1.4), 11h (dos ejes + motivo + lista negra borrada + cada entrada usada) | | ❌ |
| CA-2 — la cobertura fuera de las raíces no la decide `git` | `tests/polite/support/capability.ts` (`repositorySources()`: el árbol entero, con el mismo paseo y las mismas declaraciones que `scannedSources()`; 6 exclusiones nuevas con motivo — `tests/`, `.git/`, `.next/`, `.claude/`, `raw/`, `next-env.d.ts`; `.gitignore` intacto) | `tests/polite/architecture.test.ts` casos 2j (cobertura por árbol; el paseo mide fuera de las raíces; dentro, árbol = lectura), 2k (control positivo V35: `git` no lo ve, el importador no ofende, el árbol lo pone rojo), 2b actualizado (las 8 exclusiones, cada una con motivo) | | ❌ |
| CA-3 — las once evasiones, como batería ejecutable | `tests/polite/evasions.test.ts` (E1..E11 nombradas, cada una contra su mecanismo; E2/E3/E7 como supervivencias comprobadas; cabecera con el sitio de la duodécima) | `tests/polite/evasions.test.ts` 11 casos + N4 reproducida dentro de E7 (el parser funcional en `src/site/robots-txt.ts` NO ofende); las mutaciones R/Q/N de SPEC-008 siguen matando los mismos casos (spot-check R5 abajo) | | ❌ |
| CA-4 — lo que la frontera NO promete, dentro del criterio | `tests/polite/containment.test.ts` (describe «SPEC-009 CA-4»: residuos 1, 2a, 2b y 4 con ejemplo ejecutable, siempre a 127.0.0.1) · `tests/polite/evasions.test.ts` (describe «CA-4.3»: `z` de `zod`) | `containment` casos CA-4.1 (rama no ejecutada: cero disparos), CA-4.2a (UDP no pasa por el socket), CA-4.2b+CA-4.4 (subproceso: el servidor local recibe, la trampa registra cero) · `evasions` CA-4.3 (superficie concedida, contenido sin juzgar) | | ❌ |
| CA-5 — lo construido no se rehace, y sigue mordiendo | Sin cambios en los mecanismos: `readModule` intacto (solo GANA `freeReferences`), la trampa del socket intacta, `ALLOWED_PACKAGES` y la concesión por superficie intactos, `scannedSources` mismo paseo (extraído a `walkTree` compartido) | Spot-check R5 (la octava en `#captureGranted`): roja en las DOS mitades — `architecture` 3 + `containment` 2, 4, 8, 9, igual que en SPEC-008. Casos 14, 15, 16, 17 de `containment` y 2d, 2g, 2i, 3b..3g, 4..4h de `architecture` sin perder ni una aserción. La propiedad de RN-11 (denegar por defecto) la comprueban los casos 1 y 15 de `containment`, intactos | | ❌ |
| CA-6 — no se toca `src/` | `git diff main -- src/ migrations/ .gitignore` → vacío (comprobado 2026-09-02). Todo el trabajo vive en `tests/` y en este ledger | — (es una propiedad del diff, no un caso) | | ❌ |
| CA-7 — los tres gates y las suites cerradas enteras | Salidas literales en «Primera vuelta» abajo: `lint exit=0` · `npm test` 800/800 (82 ficheros) · `test:db` 144/144 con `DATABASE_URL_TEST` real | Recuento fichero a fichero contra `main`: solo cambia `tests/polite` (`architecture` 41→49, `containment` 17→20, `evasions` +12); `tests/mirror`, `tests/site`, `tests/docs`, `tests/model`, `tests/raw`, `tests/db` y `tests/types` idénticos fichero a fichero | | ❌ |

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
| M1 | `ALLOWED_GLOBALS` sin la entrada `process` | **ROJO ×3**: `architecture` 8, 11c, 11h |
| M2 | `repositorySources()` devuelta a `git` (`versionedSources`) | **ROJO**: `architecture` 2k — la reproducción exacta de V35 deja de verse |
| M3 | R5 de SPEC-008: la octava evasión repuesta en `#captureGranted` de `src/ingest/adapter.ts` | **ROJO EN LAS DOS MITADES**, igual que documenta SPEC-008: `architecture` 3 + `containment` 2, 4, 8, 9. Revertida; `git diff main -- src/` vacío |

Y el ciclo RED→GREEN de TDD quedó medido en la propia vuelta: los 10 casos
nuevos/actualizados de CA-1 corrieron **rojos** contra el guardián viejo antes
de escribir `freeReferences` y `ALLOWED_GLOBALS`.

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-009/. Informe HTML opcional: _qa/SPEC-009/informe.html -->

## Salvedades / follow-ups
<!-- IDs F-SPEC-009-1, F-SPEC-009-2… con destino (spec futura o EPIC-MEJORA). -->

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
- **F-SPEC-009-4 — `freeReferences` juzga el primer nivel de miembro
  (`process.getBuiltinModule`), no los niveles siguientes
  (`process.env.X`).** Es la misma línea de grano que las superficies de
  `ALLOWED_PACKAGES` y está declarada como residuo en CA-4.3: una superficie
  concedida no queda cerrada por dentro. **Sin destino: residuo declarado del
  criterio.**

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->

**Implementación terminada (2026-09-02), spec en `en-revision`. Lo siguiente es
la verificación.** Estado real:

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
   siendo el mapa (spot-check R5 repetido en esta vuelta, mismo resultado). La
   duodécima evasión, si aparece, entra como caso en `evasions.test.ts` (su
   cabecera lo dice). Las cuatro salvedades F-SPEC-009-1..4 son deliberadas y
   esperan su juicio, no arreglo.
4. **N4 sigue sobreviviendo** (CA-3.2) y ahora tiene caso propio: E7/N4 en la
   batería reproduce el parser funcional y exige que NO ofenda.
5. **Para correr las tres suites desde un worktree**: `npm ci` **dentro** del
   worktree y copiar `.env.local` del checkout principal (para
   `DATABASE_URL_TEST`). Nunca un symlink, nunca `git add -f`. Si `test:db` da
   `ENOTFOUND` contra Neon, es DNS: repetir (F-SPEC-008-21).
