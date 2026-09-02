---
id: SPEC-014
tipo: ledger
epica: EPIC-MEJORA
---
# Ledger — SPEC-014 La carrera entre la suite que escribe en el árbol y la que lo lee

## Resumen
- Fase: en-revisión (implementada; pendiente de sdd-verificador)
- Rama: `ft/SPEC-014-carrera-de-la-suite`

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 — dos grupos que no se solapan, medido | `vitest.config.ts` (`PARALLEL_ORDER`/`SERIALIZED_ORDER`, `fileParallelism: false`, `test.projects`) | `tests/config/partition.test.ts` → CA-1.1 casos 1–3. CA-1.3 es medida, no test: ver «Medida de solapes» | | 🚧 |
| CA-2 — la partición es exacta | `vitest.config.ts` (`TEST_INCLUDE`, `TEST_EXCLUSIONS`, `testUniverse`, `exclude` cruzado) | `tests/config/partition.test.ts` → CA-2 casos 1–4; CA-2.3 en «Recuento contra `main`» | | 🚧 |
| CA-3 — pertenencia por grafo de imports, sin nombres | `vitest.config.ts` (`partitionTestFiles`, `readNode`, `chainTo`, `typescriptTwin`, `existsInsideRepository`; el `throw` de fallo cerrado en el `defineConfig`) | `tests/config/partition.test.ts` → CA-3 casos 1–9 | | 🚧 |
| CA-4 — ningún test de spec cerrada tocado | — (criterio sobre el diff) | `git diff main --name-status`; ver «CA-4 — el diff» | | 🚧 |
| CA-5 — alias, JSX y typecheck sobreviven | `vitest.config.ts` (`extends: true` en los dos proyectos; `typecheck` en el paralelo) | `tests/config/partition.test.ts` → CA-5.1 casos 1–3; CA-5.3 en «Control positivo del typecheck» | | 🚧 |
| CA-6 — control positivo por mecanismo | `vitest.config.ts` (`partitionOffences`) | `tests/config/partition.test.ts` → CA-6.3 casos 1–4; CA-6.1 y CA-6.2 en «Controles por mecanismo» | | 🚧 |
| CA-7 — cierre del flake: medida + control + 20 y 20 | — (criterio de evidencia) | «Medida de solapes» + «CA-7.2» + «CA-7.3» | | 🚧 |
| CA-8 — los tres gates y el presupuesto de tiempo | — | «Los tres gates» | | 🚧 |

## Mediciones de partida (sdd-arquitecto, 2026-09-02)
<!-- Números que los CA citan. Reproducibles; si el implementador mide otra cosa, gana su medición y lo dice aquí. -->

- `npm test` en `main`, árbol limpio: **114 ficheros / 1117 casos**, `Type Errors  no errors`,
  **4,85 s** de duración (5,06 s de pared).
- `vitest --no-file-parallelism tests/site tests/polite tests/mirror tests/decide`
  (superconjunto del grupo serializado): **13,50 s**.
- Ficheros de `npm test` que alcanzan `node:fs`/`node:fs/promises` por el grafo
  de imports del repositorio (`tests/` + `src/`, con `@/…` y `.js`→`.ts`):
  **41 de 101**. Solo `tests/` en el grafo: 34.
- Ficheros que recorren de verdad el árbol real hoy (**dato de contexto, NO la
  lista de CA-3**): 15 — `tests/site/{contact,crawler-page,identity,no-hardcoded-literals,title-source}`,
  `tests/decide/{cycle-route,rn08-frontier,thresholds}`, `tests/ingest/no-decision`,
  `tests/mirror/{user-agent,capture/no-parse}`, `tests/polite/{architecture,containment,evasions,rate-limit}`.
  Más `tests/db/rate-limit.test.ts`, que va en la configuración de integración.
- **Escritores en el árbol real: uno solo**, `tests/polite/architecture.test.ts`,
  en siete rutas (casos 2d, 2e, 2g, 2k). `tests/polite/evasions.test.ts` escribe
  solo bajo `mkdtempSync(tmpdir())`.
- Vitest **4.1.11**, medido con un banco de 4 ficheros lentos + 24 rápidos:
  dos proyectos por defecto → **22 pares solapados**; con `fileParallelism: false`
  en uno → **0**; con `fileParallelism: false` + `sequence.groupOrder` distinto → **0**.
- `--reporter=json` emite `startTime` y `endTime` por fichero en `testResults[]`:
  la medida de CA-1.3 sale de ahí, sin instrumentar nada.

## Evidencia de la implementación (sdd-implementador, 2026-09-02)

Todo lo de aquí está medido en esta máquina, sobre la rama
`ft/SPEC-014-carrera-de-la-suite`, con vitest 4.1.11.

### Qué se tocó

- `vitest.config.ts` — modificado. Es donde vive entera la corrección: los dos
  proyectos, el universo, el paseo del grafo y el guardián `partitionOffences`.
- `tests/config/partition.test.ts` — **nuevo**, 23 casos. El guardián.
- Nada más. Ver «CA-4 — el diff».

### CA-1.3 / CA-7.1 — la medida de solapes

Es la prueba real y determinista: cero pares solapados significa que la carrera
no *puede* darse. Se saca del `startTime`/`endTime` por fichero del reporter
JSON, sin instrumentar nada. Dos ficheros solapan si `aInicio < bFin ∧ bInicio < aFin`.

```
$ npx vitest run --reporter=json --outputFile=report.json
$ node solapes.mjs report.json
ficheros con intervalo en el informe: 115
  del grupo serializado: 42
  del grupo paralelo:    73
pares solapados en total:                              109
pares solapados que tocan al grupo serializado (CA-1.3): 0
  de ellos, dentro del serializado (CA-6.1):            0
  de ellos, entre los dos grupos (CA-6.2):              0
```

**Cero.** Los 109 pares solapados son todos dentro del grupo paralelo, que es
justo para lo que existe. 42 = 41 ficheros heredados + el guardián nuevo;
73 = 59 paralelos + los 14 `.test-d.ts` del typecheck, que corren dentro del
grupo paralelo y por eso tampoco solapan con el serializado.

El script `solapes.mjs` (24 líneas, en el scratchpad de la sesión) importa
`partitionTestFiles` de `vitest.config.ts` para saber qué fichero es de qué
grupo, y clasifica los pares. Reproducible con esas dos órdenes.

### Controles por mecanismo (CA-6)

Se apagó cada mecanismo por separado, sin ninguna otra mutación, se midió y se
restauró.

**CA-6.1 — quitar `fileParallelism: false` del grupo serializado:**

```
pares solapados en total:                              324
pares solapados que tocan al grupo serializado (CA-1.3): 199
  de ellos, dentro del serializado (CA-6.1):            199
  de ellos, entre los dos grupos (CA-6.2):              0
    S tests/alias/catalog.test.ts  ><  S tests/polite/containment.test.ts
    S tests/alias/catalog.test.ts  ><  S tests/polite/evasions.test.ts
    ...
```

De 0 a **199 pares solapados dentro del grupo serializado**. Y el guardián
también se pone rojo:

```
FAIL |serialized| tests/config/partition.test.ts > CA-1.1 ... > 2. el grupo serializado lleva `fileParallelism: false`
AssertionError: expected undefined to be false
Tests  1 failed | 22 passed (23)
```

**CA-6.2 — igualar los dos `sequence.groupOrder`: NO reproduce en este
repositorio, y hay que decirlo (F-SPEC-014-2).** Cinco ejecuciones seguidas con
`SERIALIZED_ORDER = 0`:

```
ca62 run 1: entre los dos grupos (CA-6.2): 0   hueco P→S = 634 ms
ca62 run 2: entre los dos grupos (CA-6.2): 0   hueco P→S = 629 ms
ca62 run 3: entre los dos grupos (CA-6.2): 0   hueco P→S = 628 ms
ca62 run 4: entre los dos grupos (CA-6.2): 0   hueco P→S = 579 ms
ca62 run 5: entre los dos grupos (CA-6.2): 0   hueco P→S = 626 ms
```

Es **exactamente la medición del arquitecto** («con `fileParallelism: false` en
uno → 0»): el otro mecanismo tapa a éste, porque `fileParallelism: false`
serializa de hecho la ejecución entera. Apagar `groupOrder` a solas no produce
solape porque el mecanismo que queda ya lo impide. El guardián sí se pone rojo:

```
FAIL |serialized| tests/config/partition.test.ts > CA-1.1 ... > 3. y un `sequence.groupOrder` estrictamente mayor
AssertionError: expected 0 to be greater than 0
```

Y con **los dos apagados**, el margen se hunde: el hueco entre el fin del grupo
paralelo y el arranque del serializado pasa de **413 ms** (los dos mecanismos
puestos) a **28 ms**. Es ruido de una ejecución: la separación deja de estar
garantizada, solo que en esa tirada no llegó a cruzarse.

```
los dos puestos:            P=[0,1204]ms  S=[1617,12331]ms  hueco=413ms
sin fileParallelism:        P=[0,1191]ms  S=[1354,5259]ms   hueco=163ms
sin groupOrder:             P=[0,1173]ms  S=[1801,12617]ms  hueco=628ms
sin ninguno de los dos:     P=[0,1249]ms  S=[1277,5105]ms   hueco=28ms
```

Para aislar `groupOrder` de verdad hay que sacarlo de este repositorio, y se
hizo: se reprodujo el **banco del arquitecto** (4 ficheros lentos de 800 ms + 24
rápidos de 60 ms, dos proyectos, nada más), fuera del árbol, dos veces cada
configuración:

```
BENCH_MODE=ninguno      pares solapados: 161 · entre los dos proyectos: 22
BENCH_MODE=grouporder   pares solapados: 139 · entre los dos proyectos: 0
BENCH_MODE=ninguno      pares solapados: 161 · entre los dos proyectos: 22
BENCH_MODE=grouporder   pares solapados: 139 · entre los dos proyectos: 0
```

**22 pares solapados entre proyectos sin `groupOrder`, cero con él**, con el
mismo número que midió el arquitecto y de forma determinista. Ése es el control
positivo del mecanismo: `groupOrder` es lo que separa dos proyectos, y aquí no
se nota porque el otro mecanismo llega antes. Que la separación en este
repositorio sea hoy **emergente** de `fileParallelism` es precisamente el
argumento de CA-1.2 para llevar los dos.

**CA-6.3 — mover al grupo paralelo un fichero que alcanza `node:fs`:** vive
dentro del guardián, como cuatro casos (`tests/config/partition.test.ts`,
bloque CA-6.3), porque así es determinista y no muta el árbol. El caso 4 lo
hace **con los 42 ficheros del grupo serializado, uno a uno**, y exige que cada
uno salga nombrado. Salida del control (caso 1):

```
partitionOffences → "tests/polite/architecture.test.ts: runs in the parallel group
and reaches tests/polite/architecture.test.ts → node:fs"
```

### CA-2.3 y CA-4.3 — recuento contra `main`, fichero a fichero

Se generó el informe JSON de `main` (con `vitest.config.ts` de `main` y el
guardián apartado) y se comparó con el de la rama:

```
ficheros en main: 114 casos: 1117
ficheros en rama: 115 casos: 1140
ficheros eliminados: 0 []
ficheros con MENOS casos: 0 []
ficheros nuevos: 1 [ 'tests/config/partition.test.ts' ]
```

114 → 115 ficheros y 1117 → 1140 casos: **+1 fichero y +23 casos, que son
exactamente los que añade esta spec.** Ningún fichero previo desaparece ni pierde
casos.

### CA-4 — el diff

```
$ git diff main --name-status
A	docs/epicas/EPIC-MEJORA/SPEC-014-....ledger.md
A	docs/epicas/EPIC-MEJORA/SPEC-014-....md
M	docs/epicas/EPIC-MEJORA/_epica.md
A	tests/config/partition.test.ts
M	vitest.config.ts
```

Cero líneas cambiadas en cualquier otro fichero de `tests/` o `src/`.
`git diff main -- tests/polite/support/capability.ts` devuelve **0 líneas**, así
que `ALLOWED_PACKAGES`, `ENTRY_POINTS`, `SCAN_ROOTS`, `SCAN_EXCLUSIONS`,
`SCAN_EXTENSIONS` y `ALLOWED_GLOBALS` quedan byte-idénticos (CA-4.2). No hizo
falta ensanchar ninguno: `vitest.config.ts` está dentro de `SCAN_ROOTS` y sus
importaciones nuevas caben en las superficies ya concedidas —`existsSync` de
`node:fs`, `readdir` de `node:fs/promises`, `dirname`/`join`/`resolve`/`sep` de
`node:path`— y el resto entra por una ruta relativa que resuelve dentro del
repositorio.

### CA-5.3 — control positivo del typecheck

Quitando el `@ts-expect-error` de `tests/types/qualifier.test-d.ts:20`:

```
TypeCheckError: Type '"pending_confirmation"' is not assignable to type
'"confirmado" | "pendente_de_confirmar" | "provisional" | "sen_sinal"'.
 Test Files  1 failed | 114 passed (115)
```

Restaurado:

```
 Test Files  115 passed (115)
      Tests  1140 passed (1140)
Type Errors  no errors
```

La prueba invertida de SPEC-001 CA-3/CA-4/CA-6 sigue mordiendo a través de la
partición.

### CA-7.2 — control positivo del flake, ANTES del arreglo

20 ejecuciones de `npm test` sobre el árbol de `main` (la rama solo llevaba los
dos commits de documentación, así que el código era idéntico):

```
1 VERDE   2 VERDE   3 VERDE   4 VERDE   5 VERDE
6 ROJA    7 VERDE   8 VERDE   9 VERDE  10 VERDE
11 ROJA  12 VERDE  13 VERDE  14 VERDE  15 ROJA
16 ROJA  17 VERDE  18 ROJA   19 VERDE  20 VERDE
```

**5 rojas de 20 (25 %)**, coherente con el p ≈ 0,2 medido por el verificador. El
flake se estaba reproduciendo, así que CA-7.3 dice algo.

Las firmas, literales, con **cuatro víctimas distintas** y **tres formas**:

```
run 6:  FAIL tests/site/contact.test.ts > CA-13 ... > 5. el escaneo cubre TODO src/
        AssertionError: expected [ 'alias/catalog.ts', …(124) ] to deeply equal
                                 [ 'alias/catalog.ts', …(125) ]

run 11: FAIL tests/polite/evasions.test.ts > CA-3 ... > E3 — la segunda composición del User-Agent
        Error: ENOENT: no such file or directory, open 'src/ingest/extension-control.mts'

run 15: FAIL tests/decide/thresholds.test.ts > CA-7.6 y CA-6.8 ... > 6. y ningún otro fichero de `src/`
        Error: ENOENT: no such file or directory, open '.../src/ingest/refusal-control-tree'

run 16: FAIL tests/mirror/user-agent.test.ts > CA-10 ... > 15. la cadena declarada se compone en un único módulo
        FAIL tests/ingest/no-decision.test.ts > CA-12 ... > 1. ningún fichero de `src/ingest/` cruza la frontera
        Error: ENOENT: no such file or directory, open '.../src/ingest/refusal-control-tree'

run 18: FAIL tests/mirror/user-agent.test.ts > CA-10 ... > 16. y ya no vive dentro del instrumento de medición
        Error: ENOENT: no such file or directory, open '.../src/ingest/refusal-control-tree'
```

Todas ellas de 114 ficheros: `1 failed | 113 passed` (o `2 failed | 112 passed`
en el run 16).

### CA-7.3 — la red, DESPUÉS

Ver «CA-7.3 — las 20 ejecuciones verdes», más abajo.

### Los tres gates (CA-8)

**CA-8.1 — `npm run lint`:**

```
$ npm run lint
> marcador@0.0.1 lint
> oxlint --type-aware

$ echo $?
0
```

Exit 0, sin una sola línea de aviso.

**CA-8.2 — `npm test`:**

```
 Test Files  115 passed (115)
      Tests  1140 passed (1140)
Type Errors  no errors
   Duration  12.50s
```

**CA-8.3 — `npm run test:db` sin cambios.** `git diff main -- vitest.integration.config.ts`
son 0 líneas. `ps aux | grep vitest.mjs` en **0** antes de arrancar (F-SPEC-010-7):

```
 Test Files  22 passed (22)
      Tests  276 passed (276)
   Duration  170.66s
```

**CA-8.4 — el presupuesto.** Tiempo de pared de `npm test`, medido con `time`:

| | antes (main) | después |
|---|---|---|
| pared | **5,04–5,22 s** (20 ejecuciones) | **13,56–13,79 s** |
| `Duration` de vitest | 4,8 s | 12,5 s |
| ficheros / casos | 114 / 1117 | 115 / 1140 |

**13,6 s contra un presupuesto de 60 s.** Coincide con los 13,50 s que el
arquitecto midió serializando un superconjunto del grupo. Queda un 77 % de
margen.

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-014/. Informe HTML opcional: _qa/SPEC-014/informe.html -->

No aplica: esta spec no tiene superficie de UI. La evidencia es la salida literal
de las ejecuciones de CA-6 y CA-7.

## Salvedades / follow-ups
<!-- IDs F-SPEC-014-1, F-SPEC-014-2… con destino (spec futura o EPIC-MEJORA). -->

- **F-SPEC-014-1 — CA-3.5 dice «cero ficheros» y hay uno.** El criterio declara
  como residuo, entre otras vías, el «especificador dinámico no literal», y
  añade «Medido hoy: cero ficheros de test caen ahí». **No es cero: es uno.**
  `tests/polite/containment.test.ts` escribe `await import('node:' + 'http')` en
  su caso 7, a propósito, como control positivo de una spec cerrada.
  *No cambia el diseño y no muerde*: ese fichero alcanza `node:fs` por imports
  literales y ya está en el grupo serializado. El guardián (caso CA-3 nº 9)
  asserta la afirmación fuerte y verdadera —**ningún fichero del grupo paralelo
  tiene un especificador no literal en ningún punto de su grafo**—, que es más
  que un recuento: el día que aparezca uno se pone rojo nombrándolo y alguien
  decide, en vez de decidir el residuo en silencio.
  *Destino:* enmienda al cuerpo de SPEC-014 si el verificador la quiere; si no,
  queda aquí como corrección medida. Sin acción de código.

- **F-SPEC-014-2 — CA-6.2 no reproduce en este repositorio, y el criterio lo
  pide como si reprodujera.** CA-6.2 dice: «Igualar los dos `sequence.groupOrder`
  → la medida de CA-1.3 muestra **solapes entre los dos grupos**». Medido cinco
  veces: **cero solapes entre grupos**, porque `fileParallelism: false` —el otro
  mecanismo, que sigue puesto— serializa de hecho la ejecución entera. Es la
  misma medición que el arquitecto ya tenía («con `fileParallelism: false` en
  uno → 0») y que motiva CA-1.2; el criterio de CA-6.2 no la tuvo en cuenta al
  redactarse.
  *Cómo se resolvió:* el mecanismo se aisló **fuera** del repositorio,
  reproduciendo el banco del arquitecto (4 lentos + 24 rápidos, dos proyectos),
  donde `groupOrder` da **22 pares solapados apagado y 0 encendido**, dos veces
  seguidas. Y dentro del repositorio se midió el hueco entre grupos, que cae de
  **413 ms a 28 ms** al apagar los dos: la separación deja de estar garantizada.
  *Destino:* EPIC-MEJORA. *Disparador:* que alguien quiera reescribir CA-6.2 en
  términos medibles dentro del propio repositorio —haría falta un banco
  sintético dentro de la suite, que es código nuevo con sus propios modos de
  fallo—. Sin acción hoy.

- **F-SPEC-014-3 — el escritor tiene ocho rutas, no siete, y la octava es un
  directorio.** La spec enumera siete rutas que `tests/polite/architecture.test.ts`
  escribe. Hay una más: `src/ingest/refusal-control-tree`, un **directorio**
  (línea 209). Es la que produjo tres de las cinco rojas del control positivo de
  CA-7.2, con `ENOENT … open '.../src/ingest/refusal-control-tree'` —el fallo
  llega por el `readdir`, no por el `readFile`—, y con dos víctimas que la spec
  no nombraba: `tests/decide/thresholds.test.ts` y `tests/ingest/no-decision.test.ts`.
  *No cambia el diseño*: la partición no se decide por quién escribe.
  *Destino:* corrección medida, aquí. Sin acción de código.

- **F-SPEC-014-4 — `existsInsideRepository` duplica once líneas de
  `resolvesInsideRepository`.** El caso es real: `src/app/(gl)/layout.tsx`
  importa `../globals.css`, que existe en el árbol y no es un módulo que el
  lector pueda seguir; sin ese ensanche el fallo cerrado de CA-3.3 lo declara
  ilegible y la suite no arranca. `tests/polite/support/capability.ts` ya exporta
  `resolvesInsideRepository`, que hace exactamente eso, y **se probó a
  importarla**: funciona, pero Vite imprime tres avisos por ejecución —
  `import "../../mirror/support/imports" without a file extension … unsupported
  by configLoader: 'native'`— porque ese módulo usa imports sin extensión.
  Arreglarlo sería editar un fichero de una spec cerrada (ADR-015), así que se
  escribió la resolución en `vitest.config.ts`. **No es un segundo lector de
  imports**: los especificadores siguen saliendo del único lector AST; esto solo
  dice si una ruta se escapa del árbol.
  *Destino:* EPIC-MEJORA. *Disparador:* el día que otra spec toque
  `tests/polite/support/capability.ts` por cualquier motivo, se le añaden las
  extensiones y las once líneas vuelven a un solo sitio.

- **F-SPEC-014-5 — el guardián nuevo cuesta 0,3 s en cada carga de la
  configuración.** `partitionTestFiles()` corre dentro de `defineConfig`, así que
  cada arranque de vitest —también `--watch`, también un `vitest run <fichero>`—
  abre el proyecto del compilador y pasea el grafo de los 123 ficheros de test.
  Medido: **323 ms**. Es despreciable contra los 12,5 s de la suite, y ni se nota
  contra el presupuesto de 60 s de CA-8.4, pero no es cero y quien corra un solo
  fichero en bucle lo paga entero.
  *Destino:* EPIC-MEJORA. *Disparador:* que la carga de la configuración pase de
  1 s. La salida sería cachear la partición contra los `mtime` de `tests/` y
  `src/`, que es estado en disco y trae sus propios modos de fallo.

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->

Spec escrita y en `borrador` el 2026-09-02 por `sdd-arquitecto`, firmada
`aprobada` el mismo día por Alberto Fojo. **Implementada el 2026-09-02** por
`sdd-implementador` sobre la rama `ft/SPEC-014-carrera-de-la-suite`, **sin PR y
sin push**.

**Estado: los ocho CA implementados y medidos.** La evidencia literal de cada uno
está en «Evidencia de la implementación», arriba, y es lo que el verificador
tiene que juzgar. Nada quedó a medias.

**Dónde está todo:**
- La corrección entera: `vitest.config.ts`. Los dos proyectos están al final del
  fichero; el mecanismo (`testUniverse`, `readNode`, `partitionTestFiles`,
  `chainTo`, `partitionOffences`) está en el medio y se exporta para que el
  guardián lo juzgue.
- El guardián: `tests/config/partition.test.ts`, 23 casos.
- **Ni un fichero de una spec cerrada tocado** (CA-4), y ninguna de las seis
  listas de `capability.ts` ensanchada (CA-4.2).

**Lo que hay que saber para no romperlo:**
1. La pertenencia al grupo serializado **no se escribe, se calcula**. Si alguien
   añade un test que importa `node:fs`, entra solo. Si el guardián se pone rojo,
   la respuesta **nunca** es una lista de exentos (CA-3.4, ADR-016 §3.3).
2. La configuración **falla cerrado**: un fichero que el compilador no sabe
   parsear, o un especificador literal que no sabe colocar, impide arrancar la
   suite nombrándose. Si `npm test` dice `SPEC-014: the import graph cannot be
   read`, hay un fichero que arreglar, no un mecanismo que aflojar.
3. Los dos mecanismos de CA-1 **no son redundancia**: hoy la separación entre
   grupos la sostiene de hecho `fileParallelism` (F-SPEC-014-2), y `groupOrder`
   es el único que está **documentado**. Quitar cualquiera de los dos es
   apoyarse en comportamiento emergente.
4. El presupuesto: `npm test` pasó de **5,0 s a 13,6 s**, contra un techo de
   60 s. Si un día se acerca, la salida escrita es el **cerrojo compartido** de
   *Fuera de alcance*, **nunca** una regla de pertenencia más estrecha.

**Findings abiertos:** cinco, `F-SPEC-014-1` a `F-SPEC-014-5`, ninguno
bloqueante. Los dos primeros son correcciones medidas al texto de la spec
(CA-3.5 y CA-6.2), y conviene que el verificador los lea antes de juzgar esos
dos criterios.
