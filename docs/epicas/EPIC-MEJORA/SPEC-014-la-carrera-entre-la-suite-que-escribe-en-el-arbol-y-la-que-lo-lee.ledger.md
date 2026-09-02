---
id: SPEC-014
tipo: ledger
epica: EPIC-MEJORA
---
# Ledger — SPEC-014 La carrera entre la suite que escribe en el árbol y la que lo lee

## Resumen
- Fase: **en-revision** — 2.ª vuelta entregada el 2026-09-02. La 1.ª se verificó
  **RED**: siete CA en verde o con salvedad aceptada y **CA-3 en rojo** por tres
  evasiones medidas (F-SPEC-014-7, F-SPEC-014-8, F-SPEC-014-9). Los tres findings
  están cerrados dentro de `vitest.config.ts`, con las cinco evasiones
  reproducidas y su control emparejado, **sin tocar ningún fichero de una spec
  cerrada** (ADR-015 no ha entrado). Ver «Evidencia de la 2.ª vuelta».
- Rama: `ft/SPEC-014-carrera-de-la-suite`

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 — dos grupos que no se solapan, medido | `vitest.config.ts` (`PARALLEL_ORDER`/`SERIALIZED_ORDER`, `fileParallelism: false`, `test.projects`) | `tests/config/partition.test.ts` → CA-1.1 casos 1–3. CA-1.3 es medida, no test: ver «Medida de solapes» | Reproducido. Forma: los 3 casos de CA-1.1 verdes sobre el objeto resuelto. Medida propia sobre `--reporter=json`, 3 ejecuciones en la rama + 1 en worktree limpio: **0 pares solapados que toquen al serializado** en las 4 (42 S / 73 P), con 101–126 pares dentro del paralelo | ✅ |
| CA-2 — la partición es exacta | `vitest.config.ts` (`RUN_INCLUDE` = `TEST_INCLUDE` + `TYPE_TEST_INCLUDE`, `TEST_EXCLUSIONS`, `suffixOf`, `testUniverse`, `exclude` cruzado en `test` y en `typecheck`) | `tests/config/partition.test.ts` → CA-2 casos 1–6 (el 5 y el 6 son de la 2.ª vuelta: F-SPEC-014-7); CA-2.3 en «Recuento contra `main`» | Medido contra la selección REAL de vitest (`vitest list --filesOnly --project=…`), no contra la función: unión 42+73=115 **idéntica** al glob `tests/**/*.test.ts` menos exclusiones (101) más los 14 `.test-d.ts`; intersección vacía (`comm -12` sin salida). Recuento fichero a fichero contra `main` por reporter JSON: 114→115 ficheros, 1117→1140 casos, **0 eliminados, 0 con menos casos**, 1 nuevo | ✅ |
| CA-3 — pertenencia por grafo de imports, sin nombres | `vitest.config.ts` (`partitionTestFiles`, `readNode`, `chainTo`, `typescriptTwin`; y de la 2.ª vuelta: `FILE_SYSTEM_BUILTIN` + `isFileSystemModule` en vez de la lista de dos grafías, y `unfollowable` —que pregunta a `isCodeFile`/`SCAN_EXTENSIONS`— en vez de `existsInsideRepository`; el `throw` de fallo cerrado en el `defineConfig`) | `tests/config/partition.test.ts` → CA-3 casos 1–14. De la 2.ª vuelta: 10 y 11 (la capacidad cerrada contra `builtinModules`/`isBuiltin`), 12 (control emparejado `.ts`/`.mts`/`.cts` con ficheros reales), 13 (`../globals.css` sigue callando), 14 (lo que no existe sigue rojo) | **RED.** Tres evasiones escritas por el verificador caen en el grupo PARALELO alcanzando el árbol real, con el guardián 23/23 verde y `lint` exit 0: (1) un `.test-d.ts` con `import { readdirSync } from 'node:fs'` — la grafía exacta que el criterio nombra —, porque `testUniverse()` solo enumera `*.test.ts` y los 14 `.test-d.ts` corren en el paralelo **sin ser juzgados nunca**; (2) `import { readFileSync } from 'fs'` y `from 'fs/promises'`, que `FILE_SYSTEM_MODULES` no lista; (3) un helper `.mts`/`.cts` que importa `node:fs`, tragado **en silencio** por `existsInsideRepository`. Control emparejado: el mismo helper como `.ts` → serializado. F-SPEC-014-7/8/9 | ❌ |
| CA-4 — ningún test de spec cerrada tocado | — (criterio sobre el diff) | `git diff main --name-status`; ver «CA-4 — el diff» | Reproducido. `git diff main --stat`: solo `vitest.config.ts` (M) y `tests/config/partition.test.ts` (A) bajo código; el resto es `docs/`. `git diff main -- tests/polite/support/capability.ts` = **0 líneas**, luego `ALLOWED_PACKAGES`, `ENTRY_POINTS`, `SCAN_ROOTS`, `SCAN_EXCLUSIONS`, `SCAN_EXTENSIONS` y `ALLOWED_GLOBALS` byte-idénticos. CA-4.3 medido arriba | ✅ |
| CA-5 — alias, JSX y typecheck sobreviven | `vitest.config.ts` (`extends: true` en los dos proyectos; `typecheck` en **los dos** desde la 2.ª vuelta, mismo glob y mismo `tsconfig`, cada uno excluyendo al otro grupo) | `tests/config/partition.test.ts` → CA-5.1 casos 1–3; CA-5.3 en «Control positivo del typecheck», ahora con un control por grupo | Reproducido. `@/…` resuelve en **40 ficheros del serializado y 71 del paralelo**, todos verdes; JSX se renderiza en los dos grupos (`tests/site/pages.test.ts` serializado, `tests/site/i18n.test.ts` paralelo). Los 14 `.test-d.ts` corren, `Type Errors  no errors` en las 24 ejecuciones. Control positivo propio: quitando el `@ts-expect-error` de `tests/types/qualifier.test-d.ts` → **exit 1** con `TypeCheckError: Type '"pending_confirmation"' is not assignable…`; restaurado → 115/1140 verde | ✅ |
| CA-6 — control positivo por mecanismo | `vitest.config.ts` (`partitionOffences`) | `tests/config/partition.test.ts` → CA-6.3 casos 1–4; CA-6.1 y CA-6.2 en «Controles por mecanismo» | CA-6.1 reproducido: quitando `fileParallelism: false` → **0 → 198 pares solapados dentro del serializado** y el caso 2 de CA-1.1 rojo. CA-6.3 reproducido (casos 1–4 verdes; el 4 recorre los 42 ficheros uno a uno). **CA-6.2 no reproduce tal como está escrito** — igualando `groupOrder` medí 0 solapes entre grupos en 3 ejecuciones, igual que el implementador. Salvedad aceptada con residuo: apagar `groupOrder` sí pone rojo un caso nombrado (ADR-016 §3.4 literal) y encontré un control **dentro del repositorio** que el expediente no tenía (F-SPEC-014-10) | ⚠️ |
| CA-7 — cierre del flake: medida + control + 20 y 20 | — (criterio de evidencia) | «CA-1.3 / CA-7.1 — la medida de solapes» (0 pares) + «CA-7.2» (5 rojas de 20) + «CA-7.3» (20 verdes de 20) | Las tres piezas reproducidas por el verificador: **7.1** 0 pares solapados (4 mediciones); **7.2** sobre el árbol de `main` en worktree, **3 rojas de 31 ejecuciones** con la firma conocida (`tests/site/contact.test.ts > CA-13 … 5. el escaneo cubre TODO src/`, `expected […124] to deeply equal […125]`) — el flake se reproducía; **7.3** **20 verdes de 20** consecutivas en la rama, 14,03–14,86 s. Salvedad: «la carrera no puede darse» solo alcanza a la pertenencia que CA-3 calcula hoy, y CA-3 está en rojo | ⚠️ |
| CA-8 — los tres gates y el presupuesto de tiempo | — | «Los tres gates» | Los tres corridos por el verificador, sin CI. `npm run lint` exit 0 sin una línea; `npm test` 115/115 ficheros, 1140/1140 casos, `Type Errors  no errors`, **13,56 s de pared** contra el techo de 60 s; `npm run test:db` 22/22 y 276/276 en 164,35 s con `ps aux \| grep vitest.mjs` en 0 antes de arrancar y `git diff main -- vitest.integration.config.ts` = 0 líneas | ✅ |

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

20 ejecuciones consecutivas de `npm test` sobre la rama, con el árbol limpio
(`git status --short` vacío) y sin tocar un fichero entre medias:

```
 1 VERDE 13,58s   6 VERDE 13,97s  11 VERDE 14,06s  16 VERDE 14,09s
 2 VERDE 13,68s   7 VERDE 14,04s  12 VERDE 14,10s  17 VERDE 14,02s
 3 VERDE 13,94s   8 VERDE 14,12s  13 VERDE 14,04s  18 VERDE 14,12s
 4 VERDE 13,96s   9 VERDE 13,96s  14 VERDE 13,99s  19 VERDE 14,01s
 5 VERDE 13,99s  10 VERDE 14,07s  15 VERDE 14,12s  20 VERDE 14,13s
```

**20 de 20 verdes**, y las tres cifras idénticas en las veinte:

```
  20  Test Files  115 passed (115)
  20       Tests  1140 passed (1140)
  20 Type Errors  no errors
```

Con p ≈ 0,2 sin corregir, la probabilidad de 20 verdes seguidas es ≈ 1,2 %. La
autoridad sigue estando en la medida de solapes (CA-7.1): esto es la red, no la
prueba.

**Las tres piezas de CA-7, juntas:** medida de solapes = **0 pares**; control
positivo antes = **5 rojas de 20**; red después = **20 verdes de 20**.

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

## Evidencia de la 2.ª vuelta (sdd-implementador, 2026-09-02)

Encargo: los tres findings bloqueantes del veredicto RED —F-SPEC-014-7, -8 y -9—,
los tres dentro de `vitest.config.ts` y **sin tocar ningún fichero de una spec
cerrada** (`git diff main -- tests/polite/support/capability.ts` sigue en 0
líneas). Los otros siete CA no se han tocado salvo donde el arreglo lo exigía, y
donde se movieron se dice abajo.

**El grupo de cada fichero se mide como lo midió el verificador**: con lo que
vitest selecciona de verdad, `vitest list --filesOnly --project=…`, y nunca con
`partitionTestFiles`. Juzgar el mecanismo con el propio mecanismo es lo que dejó
pasar las tres evasiones.

### Qué cambió en `vitest.config.ts`

1. **`FILE_SYSTEM_MODULES` (una lista de dos literales) → `FILE_SYSTEM_BUILTIN` +
   `isFileSystemModule()`** (F-SPEC-014-8). La pertenencia deja de ser una
   enumeración de grafías y pasa a ser una regla sobre el espacio de builtins de
   Node: el prefijo `node:` es opcional, y la capacidad es el builtin `fs` con
   todo lo que cuelga de `fs/`. **La cierra Node**: el guardián barre
   `builtinModules` **entero**, en las dos grafías, y exige que la regla acepte
   exactamente la familia `fs` y **rechace todos los demás builtins**.
2. **`existsInsideRepository()` → `unfollowable()`** (F-SPEC-014-9). Antes
   preguntaba una sola cosa —«¿existe esta ruta?»— y callaba si la respuesta era
   sí. Ahora distingue tres desenlaces y **solo uno puede callar**: no nombra
   nada del árbol → rojo; nombra un **fichero de código** → rojo; existe y no es
   código (`../globals.css`) → sin arista y sin ruido. Y **qué es código no se
   decide aquí**: lo decide `isCodeFile`/`SCAN_EXTENSIONS`, la única declaración
   del repositorio, con su motivo por entrada y la historia de F-SPEC-008-V33
   escrita dentro. No hay una segunda lista.
3. **`RUN_INCLUDE`, y el typecheck en los dos grupos** (F-SPEC-014-7). Había dos
   listas de lo que corre y una era corta. Ahora los proyectos y el paseo derivan
   de la misma constante, y el guardián se pone rojo si un proyecto selecciona
   por un glob que esa constante no conoce. El `typecheck` pasa a declararse en
   los **dos** proyectos —mismo glob, mismo `tsconfig`, cada uno excluyendo al
   otro grupo—, que es lo que le da al mecanismo **dónde poner** un `.test-d.ts`
   que alcance el sistema de ficheros.

### Las cinco evasiones del verificador, reproducidas

Ronda A — los tres que ahora se colocan. Los helpers `.ts`, `.mts` y `.cts` son
**el mismo fichero byte a byte** (md5 `f7f16d0a016033219ef175b5690135d7` los tres):

```
$ npx vitest list --filesOnly --project=serialized | grep zz-
[serialized] tests/zz-control-ts.test.ts            -> tests/support/zz-control-helper.ts   (CONTROL)
[serialized] tests/zz-evasion-bare-fs.test.ts       import { readFileSync } from 'fs'
[serialized] tests/zz-evasion-bare-fsp.test.ts      import { readdir } from 'fs/promises'
[serialized] tests/types/zz-evasion.test-d.ts       import { readdirSync } from 'node:fs'
$ npx vitest list --filesOnly --project=parallel | grep zz-
(sin salida)
```

Las cuatro estaban en `[parallel]` antes de esta vuelta. El guardián, con ellas
dentro: **30 passed (30)**.

Ronda B — los dos que ahora **paran la suite nombrándose**, que es lo que CA-3.3
promete:

```
$ npx vitest list --filesOnly
Error: SPEC-014: the import graph cannot be read, so the partition cannot be drawn:
tests/zz-evasion-cts.test.ts: ./support/zz-evasion-helper2.cts names a file of code this reader cannot follow
tests/zz-evasion-mts.test.ts: ./support/zz-evasion-helper.mts names a file of code this reader cannot follow

$ npm test ; echo $?
Error: SPEC-014: the import graph cannot be read, so the partition cannot be drawn: …
1
```

**El control emparejado es lo que lo convierte en medición:** el mismo helper,
byte a byte, `.ts` → `[serialized]` sin un diagnóstico; `.mts` y `.cts` → rojo
nombrando cada fichero. Antes: `.ts` → serializado, `.mts` y `.cts` → paralelo,
en silencio.

Las sondas se borraron; `git status --short` vacío y `--untracked-files=all` sin
una línea.

### Los controles positivos nuevos, dentro de la suite

Los tres arreglos llevan el suyo (ADR-016 §3.4), y **cada uno está cerrado por
algo que no es esta configuración**:

- **CA-3 caso 10** — barre las **128 grafías de builtin** que este Node acepta
  (`builtinModules` + `isBuiltin`) y exige que `isFileSystemModule` acepte
  exactamente `['fs', 'fs/promises', 'node:fs', 'node:fs/promises']` y rechace el
  resto. Con ancla: `BUILTIN_SPELLINGS.length > 50`, para que un
  `builtinModules` vacío no deje pasar el caso con los dos lados vacíos.
- **CA-3 caso 11** — la mitad negativa, una a una: `fs-extra`, `fsevents`,
  `./fs`, `@/fs`, `@/raw/disk.ts`, `node:fsx` fuera; las cuatro grafías dentro.
- **CA-3 caso 12** — el control emparejado de arriba, **con ficheros reales en el
  árbol** (ADR-016 §4: la reproducción solo es cierta si el fichero existe), en
  `try/finally`. Corre en el grupo serializado, que es lo que esta spec existe
  para hacer seguro.
- **CA-3 caso 13** — el control de que la mitad que **sí** puede callar sigue
  callando: `../globals.css` cierra el paseo sin diagnóstico. Sin él, «falla
  cerrado» se podría haber comprado poniendo todo rojo.
- **CA-3 caso 14** — y lo que no existe sigue siendo rojo con su mensaje propio,
  para que un rojo diga **cuál** de los tres desenlaces ocurrió.
- **CA-2 casos 5 y 6** — que el universo cubra todos los globs que los proyectos
  declaran, y que cada `.test-d.ts` caiga en exactamente un grupo.
- **CA-5.1 caso 3** — el typecheck declarado en los dos, con el mismo glob y el
  mismo `tsconfig`, y cada `exclude` igual al otro grupo.

Y un control medido a mano del caso límite del diseño nuevo: **un grupo con cero
`.test-d.ts`** (todos excluidos) no rompe nada —`Type Errors  no errors`, 42
ficheros— y el guardián lo caza (`CA-5.2 … expected [ 'tests/**/*.test-d.ts', …
(73) ] to deeply equal [ …(72) ]`).

### Lo que el mecanismo encontró al empezar a mirar

Al entrar los `.test-d.ts` en el universo, el grafo colocó **uno de verdad** en
el grupo serializado: `tests/types/spec011-alias-store.test-d.ts`. No es una
sonda, es un fichero del repositorio. La partición pasa de **42 S / 73 P** a
**43 S / 72 P**, y el mecanismo deja de ser vacío sobre ese conjunto.

### CA-1.3 / CA-7.1 — la medida de solapes, rehecha

El grupo de cada fichero sale de `vitest list --filesOnly --project=…`, no de
`partitionTestFiles`. Cuatro ejecuciones:

```
ficheros con intervalo en el informe: 115   (43 serializados / 72 paralelos)
pares solapados en total:                              133 / 124 / 111 / 92
pares solapados que tocan al grupo serializado (CA-1.3):  0 /   0 /   0 /  0
  de ellos, dentro del serializado (CA-6.1):              0 /   0 /   0 /  0
  de ellos, entre los dos grupos (CA-6.2):                0 /   0 /   0 /  0
hueco P->S: 414,9 / 404,9 / 414,7 / 410,9 ms
```

**Cero en las cuatro**, y el hueco P→S coincide con los 403–429 ms que midió el
verificador. Todos los pares solapados son dentro del paralelo, que es para lo
que existe.

**Y una precisión que la medida obliga a hacer (F-SPEC-014-11):** los 14
`.test-d.ts` aparecen en el informe con **intervalo de longitud cero**
(`startTime === endTime`, el mismo instante para los catorce), así que la regla
de solape no los alcanza. Coherente con lo medido: **vitest 4.1.11 no ejecuta un
`.test-d.ts` en tiempo de ejecución** —un `writeFileSync` dentro de uno no llegó
a correr—. Los conteos de arriba son de los 101 ficheros con intervalo real.

### CA-6.1 y CA-6.2 — los controles por mecanismo, rehechos sobre la partición nueva

```
CA-6.1 — quitando `fileParallelism: false` del grupo serializado:
  pares solapados en total:                              361
  pares solapados que tocan al serializado:              220
    dentro del serializado (CA-6.1):                     220
      S tests/alias/catalog.test.ts >< S tests/polite/architecture.test.ts
      S tests/alias/catalog.test.ts >< S tests/polite/evasions.test.ts
      …
  y el guardián: FAIL … CA-1.1 … 2. el grupo serializado lleva `fileParallelism: false`
                 AssertionError: expected undefined to be false

CA-6.2 — igualando los dos `groupOrder`:
  FAIL … CA-1.1 … 3. y un `sequence.groupOrder` estrictamente mayor que el del paralelo
  AssertionError: expected 0 to be greater than 0
```

De **0 a 220** pares dentro del serializado (eran 198–199 con 42 ficheros). La
salvedad de CA-6.2 **no cambia**: este arreglo no toca ese mecanismo, y lo que
dicen F-SPEC-014-2 y F-SPEC-014-10 sigue en pie tal cual.

### CA-5.3 — control positivo del typecheck, ahora uno POR GRUPO

El typecheck se declara en los dos proyectos, así que la prueba invertida de
SPEC-001 se comprueba en los dos:

```
grupo PARALELO — quitando el @ts-expect-error de tests/types/qualifier.test-d.ts:20
  TypeCheckError: Type '"pending_confirmation"' is not assignable to type
  '"confirmado" | "pendente_de_confirmar" | "provisional" | "sen_sinal"'.
   Test Files  1 failed | 114 passed (115)

grupo SERIALIZADO — quitando el @ts-expect-error de tests/types/spec011-alias-store.test-d.ts:20
  TypeCheckError: Property 'insert' does not exist on type 'PostgresAliasStore'.
   Test Files  1 failed | 114 passed (115)

restaurados:
   Test Files  115 passed (115)
        Tests  1147 passed (1147)
  Type Errors  no errors
```

Muerde en los dos. Sin el segundo control, «el typecheck sigue vivo» habría sido
una afirmación sobre un proyecto y una suposición sobre el otro.

### CA-2.3 y CA-4.3 — recuento contra `main`, fichero a fichero

`main` corrido en un `git worktree` desechable, informe JSON contra informe JSON:

```
ficheros en main: 114 casos: 1117
ficheros en rama: 115 casos: 1147
ficheros eliminados: 0 []
ficheros con MENOS casos: 0 []
ficheros nuevos: 1 [ 'tests/config/partition.test.ts' ]
```

**+1 fichero y +30 casos**, que son exactamente los 30 del guardián. Y contra la
selección real de vitest: unión **115 = 101 del glob menos exclusiones + 14
`.test-d.ts`**, idéntica al glob; intersección **vacía** (`comm -12` sin salida).

### CA-4 — el diff, sin cambios de forma

```
$ git diff main --name-status
A	docs/…/SPEC-014-….ledger.md
A	docs/…/SPEC-014-….md
M	docs/epicas/EPIC-MEJORA/_epica.md
A	tests/config/partition.test.ts
M	vitest.config.ts

$ git diff main -- tests/polite/support/capability.ts        | wc -l → 0
$ git diff main -- vitest.integration.config.ts              | wc -l → 0
$ git diff main --name-only -- src/ tests/ | grep -v partition.test.ts → (nada)
```

Los únicos ficheros de código son `vitest.config.ts` y el guardián nuevo, y
`capability.ts` queda **byte-idéntico**: `ALLOWED_PACKAGES`, `ENTRY_POINTS`,
`SCAN_ROOTS`, `SCAN_EXCLUSIONS`, `SCAN_EXTENSIONS` y `ALLOWED_GLOBALS` sin tocar
(CA-4.2). **`SCAN_EXTENSIONS` se importa, no se ensancha.**

### CA-7.3 — la red, 20 de 20 sobre la partición nueva

```
 1 VERDE 13,66s   6 VERDE 14,17s  11 VERDE 14,15s  16 VERDE 14,24s
 2 VERDE 13,82s   7 VERDE 14,23s  12 VERDE 14,19s  17 VERDE 14,24s
 3 VERDE 13,90s   8 VERDE 14,11s  13 VERDE 14,21s  18 VERDE 14,19s
 4 VERDE 14,01s   9 VERDE 14,15s  14 VERDE 14,24s  19 VERDE 14,19s
 5 VERDE 14,08s  10 VERDE 14,20s  15 VERDE 14,16s  20 VERDE 14,20s
```

Las veinte con `115 passed (115)`, `1147 passed (1147)` y `Type Errors  no
errors`. La autoridad sigue siendo CA-7.1.

### Los tres gates (CA-8), salida literal

```
$ npm run lint
> marcador@0.0.1 lint
> oxlint --type-aware
$ echo $?
0
```

Exit 0, sin una línea de aviso.

```
$ /usr/bin/time -p npm test
 Test Files  115 passed (115)
      Tests  1147 passed (1147)
Type Errors  no errors
   Duration  12.67s (transform 2.37s, setup 0ms, import 9.49s, tests 9.39s, environment 5ms, typecheck 285ms)
real 13.96
```

```
$ ps aux | grep '[v]itest.mjs' | wc -l
       0
$ /usr/bin/time -p npm run test:db
 Test Files  22 passed (22)
      Tests  276 passed (276)
   Duration  168.31s (transform 183ms, setup 0ms, import 873ms, tests 165.72s, environment 1ms)
real 168.53
```

**CA-8.4: 13,66–14,24 s de pared contra el techo de 60 s.** Sin cambio material
respecto a los 13,56 s de la primera vuelta —el typecheck en dos proyectos cuesta
unos 150 ms más (285–318 ms frente a 133 ms)— y queda un **76 % de margen**.

### CA que se movieron de rebote, con su motivo

- **CA-2** se ensancha: el universo ya no es «`*.test.ts`», es «todo lo que los
  dos proyectos ejecutan». Lo exige F-SPEC-014-7, que es un finding de CA-3: la
  afirmación de CA-3.1 es sobre el grupo entero, y el grupo entero incluye los
  `.test-d.ts`. El recuento no cambia (115 ficheros, los mismos).
- **CA-5.2** cambia de forma sin cambiar de fondo: el typecheck pasa de un
  proyecto a los dos. Mismo glob, mismo `tsconfig`, mismo conjunto de 14
  ficheros, y ahora con control positivo en cada grupo. Era la única manera de
  que el mecanismo tuviera **dónde poner** un `.test-d.ts` que alcance el
  sistema de ficheros sin inventar una exención (CA-3.4).
- **CA-1.3, CA-6.1, CA-7.3** se volvieron a medir porque la partición cambió de
  42/73 a 43/72. Los tres dan lo mismo o mejor.
- **CA-4, CA-6.2, CA-6.3, CA-8** no se tocaron.

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

### RED — 2026-09-02, `sdd-verificador`

**Siete de los ocho criterios están donde dicen que están, y los medí yo. CA-3 no,
y CA-3 es la frontera de capacidad de esta spec.** La corrección funciona para el
árbol de hoy —cero pares solapados, veinte verdes de veinte, el recuento intacto—
pero el mecanismo que decide **quién** corre serializado deja pasar tres formas de
alcanzar el sistema de ficheros, y en las tres el gate entero sale verde. Es la
forma exacta de fallo que ADR-016 existe para no repetir, y el propio repositorio
tiene una de ellas documentada con nombre y fecha (F-SPEC-008-V33, cuyo motivo
está escrito en `SCAN_EXTENSIONS`).

Todo lo de abajo está medido en esta máquina el 2026-09-02, sobre
`ft/SPEC-014-carrera-de-la-suite` en `6b598ee` con el árbol limpio, vitest 4.1.11.
El grupo de cada fichero **no se leyó de `partitionTestFiles`** sino de lo que
vitest selecciona de verdad (`vitest list --filesOnly --project=…`), para no
juzgar el mecanismo con el propio mecanismo. Las evasiones se escribieron en un
`git worktree` desechable: el árbol del repositorio no se tocó en ningún momento.

#### Lo que sí está (y lo reproduje entero)

- **La medida de CA-1.3, cuatro veces: 0 pares solapados que toquen al grupo
  serializado.** 42 ficheros S, 73 P, 101–126 pares solapados todos dentro del
  paralelo, hueco P→S de 403–429 ms.
- **La partición es exacta contra la selección real de vitest**: unión 115 =
  glob (101) + `.test-d.ts` (14), intersección vacía, 0 ficheros eliminados y
  0 con recuento menor contra `main`.
- **Los tres gates**, corridos por mí, con sus tiempos.
- **CA-6.1 muerde de verdad**: 0 → 198 pares dentro del serializado.
- **CA-7.2 se reproduce**: el flake existía y lo vi, con la firma conocida.

#### Lo que no está: CA-3

Tres ficheros de test escritos por el verificador **alcanzan el árbol real y
corren en el grupo paralelo**, con `tests/config/partition.test.ts` en 23/23 y
`npm run lint` en exit 0:

```
$ npx vitest list --filesOnly | grep zz-
[parallel]   tests/types/zz-evasion.test-d.ts          import { readdirSync } from 'node:fs'
[parallel]   tests/zz-evasion-bare-fs.test.ts          import { readFileSync } from 'fs'
[parallel]   tests/zz-evasion-bare-fsp.test.ts         import { readdir } from 'fs/promises'
[parallel]   tests/zz-evasion-mts.test.ts              -> tests/support/zz-evasion-helper.mts
[parallel]   tests/zz-evasion-cts.test.ts              -> tests/support/zz-evasion-helper2.cts
[serialized] tests/zz-control-ts.test.ts               -> tests/support/zz-control-helper.ts   (CONTROL)
```

El control emparejado es lo que lo convierte en medición y no en opinión:
`zz-control-helper.ts` y `zz-evasion-helper.mts` son **el mismo fichero byte a
byte**, con `import { readdirSync } from 'node:fs'`. El `.ts` cae en el
serializado; el `.mts` y el `.cts`, en el paralelo. Decide la extensión, y decide
en silencio.

De las cuatro vías que CA-3.5 declara como residuo, **el especificador dinámico no
literal es la única que el guardián sí caza**, y lo caza bien:

```
FAIL |serialized| tests/config/partition.test.ts > CA-3 … > 9. CA-3.5 — el residuo declarado, medido
AssertionError: expected [ 'tests/zz-evasion-dynamic.test.ts' ] to deeply equal []
```

Las tres de arriba **no están declaradas en CA-3.5** y no las caza nadie. Detalle
en F-SPEC-014-7, F-SPEC-014-8 y F-SPEC-014-9.

#### Sobre la salvedad de CA-6.2: aceptada, y con un control mejor que el que trae

Reproduje la salvedad: con `fileParallelism: false` puesto, igualar `groupOrder`
da **0 solapes entre grupos** en tres ejecuciones (huecos de 650, 652 y 658 ms).
El implementador no se equivoca y lo dice sin adornos.

No tumba el criterio, por tres razones **medidas**:

1. La obligación literal de **ADR-016 §3.4** —*apagar cada mecanismo pone rojo al
   menos un caso nombrado*— **se cumple para los dos**. Lo comprobé apagando cada
   uno por separado: `fileParallelism` → `CA-1.1 … 2.` rojo; `groupOrder` →
   `CA-1.1 … 3. y un sequence.groupOrder estrictamente mayor`,
   `AssertionError: expected 0 to be greater than 0`.
2. **`groupOrder` no es decorativo, y hay control dentro del repositorio** — uno
   que el expediente no encontró y que no necesita salir a un banco sintético.
   Se aísla apagando primero al mecanismo que lo tapa (F-SPEC-014-10):

   ```
   fileParallelism FUERA + groupOrder distinto → entre los dos grupos: 0        (hueco 177 ms)
   fileParallelism FUERA + groupOrder igualado → entre los dos grupos: 0 / 1 / 0 (huecos 32 / −1 / 12 ms)
                                                 P tests/model/qualifier.test.ts >< S tests/polite/evasions.test.ts
   ```

   Un hueco **negativo** es el grupo serializado arrancando antes de que el
   paralelo termine, y la víctima del par es `tests/polite/evasions.test.ts`, una
   de las tres del flake original.
3. El mecanismo es el **documentado** de vitest 4.1.11, y el otro no.

Queda ⚠️ y no ✅ porque el criterio, tal como está escrito, pide algo que su
propio diseño impide observar. Es un defecto de redacción del CA, no del código.

#### Mis números de CA-7, aparte de los del implementador

- **CA-7.1 — la medida.** 4 ejecuciones, **0 pares solapados** que toquen al
  serializado en las cuatro.
- **CA-7.2 — el control positivo, sobre `main`.** En un `git worktree` de `main`:
  **31 ejecuciones, 3 rojas.** Las 20 de `npm test` salieron verdes; las 11 con
  `--reporter=json` dieron 3 rojas. Firma literal de la que pude capturar:

  ```
  run 6 exit=1 success=false files=114 failing=1 site/contact.test.ts
     CA-13 — el buzón en un solo sitio 5. el escaneo cubre TODO src/, no solo los ficheros de TypeScript
     :: AssertionError: expected [ 'alias/catalog.ts', …(124) ] to deeply equal [ 'alias/catalog.ts', …(125) ]
  ```

  Es la forma 1 del problema —*un fichero de más*— sobre una de las tres víctimas
  que la spec nombra. El flake se reproducía; CA-7.3 dice algo.
- **CA-7.3 — la red, sobre la rama.** **20 verdes de 20** consecutivas, árbol
  limpio, sin tocar nada entre medias, 14,03–14,86 s cada una:

  ```
   1 VERDE 14,76s   6 VERDE 14,64s  11 VERDE 14,13s  16 VERDE 14,03s
   2 VERDE 14,47s   7 VERDE 14,85s  12 VERDE 14,07s  17 VERDE 14,09s
   3 VERDE 14,64s   8 VERDE 14,55s  13 VERDE 14,08s  18 VERDE 14,19s
   4 VERDE 14,32s   9 VERDE 14,19s  14 VERDE 14,09s  19 VERDE 14,06s
   5 VERDE 14,71s  10 VERDE 14,16s  15 VERDE 14,18s  20 VERDE 14,04s
  ```

#### Los tres gates, salida literal

```
$ npm run lint
> marcador@0.0.1 lint
> oxlint --type-aware
$ echo $?
0
```

```
$ time npm test
 Test Files  115 passed (115)
      Tests  1140 passed (1140)
Type Errors  no errors
   Duration  12.32s (transform 2.11s, setup 0ms, import 9.03s, tests 9.28s, environment 4ms, typecheck 120ms)
npm test  24.84s user 5.82s system 225% cpu 13.564 total
```

```
$ ps aux | grep '[v]itest.mjs' | wc -l
       0
$ time npm run test:db
 Test Files  22 passed (22)
      Tests  276 passed (276)
   Duration  164.35s (transform 193ms, setup 0ms, import 886ms, tests 161.75s, environment 1ms)
npm run test:db  6.92s user 1.64s system 5% cpu 2:44.56 total
```

**CA-8.4: 13,56 s de pared contra un presupuesto de 60 s.** 77 % de margen.

#### Qué hace falta para volver

Los tres findings bloqueantes viven enteros en `vitest.config.ts` y **ninguno
obliga a tocar un fichero de una spec cerrada**, así que ADR-015 no entra:

1. Que el universo que se juzga cubra **todo lo que los dos proyectos ejecutan**,
   `.test-d.ts` incluidos — o que el criterio declare, dentro de sí, que no los
   alcanza (F-SPEC-014-7).
2. Que `FILE_SYSTEM_MODULES` se cierre contra **los builtins que Node acepta** y
   no contra dos grafías (F-SPEC-014-8).
3. Que `existsInsideRepository` deje de tragar en silencio un especificador cuya
   extensión es una **extensión de código** — `SCAN_EXTENSIONS` ya las enumera con
   su motivo — y vuelva a fallar cerrado como promete CA-3.3 (F-SPEC-014-9).

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

- **F-SPEC-014-6 — F-SPEC-013-12 se cierra para este mecanismo, no para los
  otros dos.** CA-3.3 dice que el defecto de F-SPEC-013-12 —un `null` que
  significa «no sé colocar el especificador» indistinguible de un `null` que
  significa «es un paquete»— «se cierra aquí en vez de heredarse». Se cerró
  **dentro de `vitest.config.ts`**: `readNode` distingue los tres casos
  (paquete → se ignora; literal relativo o `@/…` que no resuelve → rojo
  nombrándose; `.js`/`.jsx`/`.mjs`/`.cjs` → se reintenta con la extensión de
  TypeScript, `typescriptTwin`). **`tests/decide/support/rn08.ts` y
  `tests/mirror/support/imports.ts` siguen con el defecto**, porque son ficheros
  de specs cerradas y CA-4 prohíbe tocarlos.
  *Destino:* F-SPEC-013-12 sigue abierto en el inventario de EPIC-MEJORA con su
  disparador intacto. Esta spec no lo cierra; le quita una víctima.

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

### Findings del verificador (2026-09-02)

- **F-SPEC-014-7 — BLOQUEANTE. Los 14 `.test-d.ts` corren en el grupo paralelo y
  el mecanismo no los juzga nunca.** `testUniverse()` filtra
  `entry.endsWith('.test.ts')`, y `tests/types/qualifier.test-d.ts` no termina en
  `.test.ts`. Consecuencia: los `.test-d.ts` no están en `universe`, luego no
  están ni en `serialized` ni en `parallel`, luego **ningún proyecto los excluye**
  y corren en los dos — en la práctica solo dan resultado en el paralelo, que es
  el único con `typecheck.enabled`. Ese es justamente el «73 = 59 paralelos + los
  14 `.test-d.ts`» que el propio ledger escribe.
  *Medido:* un fichero nuevo `tests/types/zz-evasion.test-d.ts` con
  `import { readdirSync } from 'node:fs'` y un `test()` que hace
  `readdirSync('src')` sale `[parallel]` en `vitest list`, y
  `tests/config/partition.test.ts` da **23 passed (23)**. No hace falta ninguna
  grafía rara: es **la grafía exacta que CA-3 nombra**.
  *Por qué es RED y no residuo:* CA-3.1 afirma que «ningún fichero del grupo
  paralelo alcanza `node:fs`», y el grupo paralelo contiene hoy 14 ficheros que el
  guardián no mira. La afirmación es más ancha que su mecanismo, que es lo que
  ADR-016 §6 prohíbe.
  *Salida:* o el universo cubre lo que los proyectos ejecutan, o CA-3.5 lo declara
  y el guardián asserta que ningún `.test-d.ts` alcanza el árbol. *Sin acción
  sobre specs cerradas.*

- **F-SPEC-014-8 — BLOQUEANTE. `FILE_SYSTEM_MODULES` enumera dos de las cuatro
  grafías que Node acepta para la misma capacidad.** `node:fs` y
  `node:fs/promises` están; `fs` y `fs/promises` no. Node importa las cuatro.
  *Medido:* `tests/zz-evasion-bare-fs.test.ts` con
  `import { readFileSync } from 'fs'` y `tests/zz-evasion-bare-fsp.test.ts` con
  `import { readdir } from 'fs/promises'` —los dos leyendo el árbol real— salen
  **`[parallel]`**, el guardián sigue en 23/23 y
  `npx oxlint --type-aware <los tres ficheros>` **sale exit 0**: la regla que
  obligaría al prefijo (`unicorn/prefer-node-protocol`) es de categoría *style* y
  `.oxlintrc.json` solo activa `correctness`. Nada en el repositorio lo impide, y
  `tests/` está **fuera** de `SCAN_ROOTS`, así que la frontera de ADR-014 §4
  tampoco los ve.
  *Por qué es RED:* ADR-016 §3.1 —el único no negociable— pide que la lista esté
  cerrada por algo que exista fuera del test. La lista de builtins de Node existe
  fuera del test; una pareja de grafías escogidas a mano, no.
  *Salida:* cerrar la pertenencia contra el builtin, no contra el literal.

- **F-SPEC-014-9 — BLOQUEANTE. `existsInsideRepository` falla ABIERTO, y CA-3.3
  promete lo contrario.** En `readNode`, un especificador literal que
  `resolveModule` no coloca y cuyo `typescriptTwin` tampoco, **se descarta con un
  `continue` sin arista y sin diagnóstico** si la ruta existe en el árbol. Como
  `resolveModule` solo prueba `.ts`, `.tsx`, `index.ts` e `index.tsx`, y
  `typescriptTwin` solo traduce `.js`/`.jsx`/`.mjs`/`.cjs`, **cualquier módulo
  `.mts` o `.cts` real cae por ese `continue`**.
  *Control emparejado, medido:* un helper con
  `import { readdirSync } from 'node:fs'`, copiado byte a byte a tres nombres —
  `.ts` → el importador sale **`[serialized]`**; `.mts` y `.cts` → **`[parallel]`**,
  guardián 23/23, sin una línea de diagnóstico.
  *Alcance hoy:* instrumenté el paseo y ese `continue` se dispara **2 veces**, las
  dos por `src/app/(gl)|(es)/layout.tsx -> ../globals.css`. El agujero es
  **latente**, no activo: hoy la partición es correcta. Pero es latente igual que
  lo fue el de F-SPEC-008-V33, cuyo motivo está escrito literalmente en
  `SCAN_EXTENSIONS`: *«un `src/ingest/door.mts` con `node:child_process` dejó los
  tres gates en verde porque ninguna de las dos listas lo cazaba»*. Esta spec
  reintroduce ese punto ciego en un lector nuevo, y F-SPEC-014-4 lo describe como
  inofensivo —*«esto solo dice si una ruta se escapa del árbol»*—, que es la
  media verdad: también decide, callando, que un módulo de verdad no tiene
  aristas.
  *Salida:* distinguir «existe y no es un módulo que yo siga» (CSS, JSON) de
  «existe, es código y no sé colocarlo» → rojo nombrándose. La lista de qué es
  código ya existe y ya trae su motivo: `SCAN_EXTENSIONS`.

- **F-SPEC-014-10 — no bloqueante, corrige a F-SPEC-014-2: `groupOrder` SÍ tiene
  control positivo dentro del repositorio.** El expediente concluye que hay que
  salir a un banco sintético fuera del árbol porque `fileParallelism: false` tapa
  al otro mecanismo. Cierto — y la salida es apagar primero al que tapa. Medido
  por el verificador, tres ejecuciones por configuración:

  ```
  fileParallelism FUERA + groupOrder distinto → entre los dos grupos: 0        (hueco P→S 177 ms)
  fileParallelism FUERA + groupOrder igualado → entre los dos grupos: 0 / 1 / 0 (huecos 32 / −1 / 12 ms)
                                                 P tests/model/qualifier.test.ts >< S tests/polite/evasions.test.ts
  ```

  No es determinista (1 par en 3 ejecuciones), así que no sirve como caso de la
  suite tal cual; sí sirve como **control por mecanismo de ADR-016 §3.4 medido en
  el repositorio**, que es lo que CA-6.2 pedía. El banco externo del implementador
  (22 → 0) sigue siendo la evidencia más fuerte y no se descarta.
  *Destino:* EPIC-MEJORA, junto a F-SPEC-014-2. *Disparador:* que alguien
  reescriba CA-6.2 en términos medibles; ya no hace falta código nuevo, solo
  redactar el apagado como *«los dos fuera vs. solo `fileParallelism` fuera»*.

### Findings de la 2.ª vuelta (sdd-implementador, 2026-09-02)

- **F-SPEC-014-4, actualizado: el precio ya no es hipotético, se paga en cada
  ejecución.** La primera vuelta escribió la resolución a mano en
  `vitest.config.ts` para evitar tres avisos de Vite, y ese ahorro es
  exactamente lo que produjo F-SPEC-014-9. Esta vuelta importa
  `isCodeFile`/`SCAN_EXTENSIONS` de `tests/polite/support/capability.ts`, así que
  **`npm test` imprime ahora, por stderr, tres veces por ejecución**:

  ```
  (!) Your Vite config uses features that are unsupported by `configLoader: 'native'`…
    - import "../../mirror/support/imports" without a file extension (tests/polite/support/capability.ts:47:8)
    - import "../../support/source-tree" without a file extension (tests/polite/support/capability.ts:48:31)
    - import "../../mirror/support/imports" without a file extension (tests/polite/support/capability.ts:49:53)
  ```

  Es ruido, no un fallo: la configuración carga, los tres gates salen verdes y
  `oxlint` no dice nada. Se paga a propósito, porque las tres salidas eran:
  escribir una segunda lista de extensiones (**el defecto que `SCAN_EXTENSIONS`
  existe para cerrar**, ADR-016 §3.1), editar un fichero de una spec cerrada
  (ADR-015, prohibido por el encargo), o silenciarlo con
  `VITE_CONFIG_NATIVE_IGNORE_WARNING` (tapar un aviso de compatibilidad futura).
  *Destino:* EPIC-MEJORA, con el disparador que ya tenía —el día que otra spec
  toque `capability.ts`, se le añaden las extensiones a esos tres imports y el
  ruido desaparece— y ahora **con coste visible**, que es lo que le faltaba al
  disparador para dispararse.

- **F-SPEC-014-11 — vitest no ejecuta los `.test-d.ts`, y eso acota lo que la
  medida de CA-1.3 alcanza.** Medido con una sonda: un `writeFileSync` dentro de
  un `.test-d.ts` **no llegó a correr** (vitest 4.1.11 los typechequea, no los
  importa). Coherente con el informe JSON, donde los catorce salen con
  **intervalo de longitud cero** —el mismo instante en `startTime` y `endTime`—,
  así que la regla `aInicio < bFin ∧ bInicio < aFin` **no puede** contarlos: los
  recuentos de solape son sobre los 101 ficheros con intervalo real.
  *Consecuencia para el expediente:* la evasión de F-SPEC-014-7 era una
  **afirmación falsa** de CA-3.1 antes que un camino vivo al árbol, y esa
  afirmación es la que había que hacer verdadera —que es lo que se ha hecho—.
  *Destino:* EPIC-MEJORA. *Disparador:* que vitest empiece a ejecutar los
  `.test-d.ts` (o que se les active `typecheck.runtime`); entonces CA-1.3 tendría
  intervalos que medir y habría que rehacer el conteo con ellos dentro. Sin
  acción de código hoy.

- **F-SPEC-014-12 — el fallo cerrado tiene precio, y conviene saberlo antes de
  pagarlo: un `.mts` o `.cts` real alcanzable desde un test para la suite
  entera.** `resolveModule` (de `tests/mirror/support/imports.ts`, spec cerrada)
  solo devuelve `.ts`, `.tsx` e `index.*`, así que este lector **no puede
  seguir** un módulo `.mts`/`.cts` — y desde esta vuelta, en vez de tragárselo en
  silencio, se niega a arrancar nombrándolo. Es lo que CA-3.3 pide y lo que
  F-SPEC-014-9 exige, pero significa que el día que alguien escriba un
  `src/…/x.mts` importado desde un test, `npm test` no arranca hasta que se
  decida qué hacer. **Eso es la funcionalidad, no el defecto**: decide una
  persona en vez de decidir el silencio.
  *Destino:* EPIC-MEJORA. *Disparador:* el primer `.mts`/`.cts` real del
  repositorio. *Salida:* ensanchar `resolveModule` en `capability.ts`/`imports.ts`
  para que ofrezca las extensiones de `SCAN_EXTENSIONS` — un solo sitio, la misma
  lista— lo que hoy sería editar una spec cerrada (ADR-015) y por eso no se hace
  aquí.

- **F-SPEC-014-13 — el guardián se sigue midiendo con su propio mecanismo; el
  contraste con la selección real de vitest es manual.** Los casos de
  `tests/config/partition.test.ts` preguntan a `partitionTestFiles()` y al objeto
  que `defineConfig` resuelve. Eso basta para la forma y para la regla, pero **no
  responde «¿qué ficheros mete vitest de verdad en cada proyecto?»**, que es la
  pregunta con la que el verificador encontró las tres evasiones. Esta vuelta lo
  ha contrastado a mano —`vitest list --filesOnly --project=…`, y de ahí salen la
  tabla de evasiones y el grupo de cada fichero en la medida de solapes— pero
  **nada lo obliga en la suite**.
  *Por qué no se ha metido dentro:* obligaría a lanzar vitest desde vitest, dos
  subprocesos por ejecución con su propia carga de configuración (F-SPEC-014-5
  mide 323 ms cada una), y es código nuevo con sus propios modos de fallo dentro
  de la spec que existe para quitar modos de fallo. *Lo que sí se ha cerrado por
  construcción* es la causa de las tres evasiones: ya no hay dos listas de lo que
  corre (`RUN_INCLUDE`), la capacidad la cierra `builtinModules` y las
  extensiones las cierra `SCAN_EXTENSIONS` — ninguna de las tres es «mi lectura
  del código».
  *Destino:* EPIC-MEJORA. *Disparador:* la primera vez que la partición vuelva a
  discrepar de la selección real de vitest, o el día que el presupuesto de CA-8.4
  tenga sitio de sobra para dos `vitest list` dentro de la suite.

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

---

### 2.ª vuelta — 2026-09-02, `sdd-implementador`

Los **tres findings bloqueantes del veredicto RED están cerrados**, los tres
dentro de `vitest.config.ts` y sin tocar ningún fichero de una spec cerrada
(ADR-015 no ha entrado). Rama `ft/SPEC-014-carrera-de-la-suite`, cuatro commits
nuevos, **sin PR y sin push**. La spec vuelve a `en-revision`.

- **F-SPEC-014-8** → la capacidad es una regla sobre los builtins de Node
  (`FILE_SYSTEM_BUILTIN` + `isFileSystemModule`), cerrada por `builtinModules` e
  `isBuiltin` desde el guardián. Las dos evasiones de grafía desnuda pasan a
  `[serialized]`.
- **F-SPEC-014-9** → `unfollowable()` distingue los tres desenlaces y solo el
  asset puede callar; **qué es código lo dice `SCAN_EXTENSIONS`**, importada, no
  reescrita. El `.mts` y el `.cts` paran la suite nombrándose; el `.ts` gemelo
  byte a byte sigue en `[serialized]`.
- **F-SPEC-014-7** → `RUN_INCLUDE` es la única declaración de lo que corre, y el
  `typecheck` se declara en los dos grupos. El `.test-d.ts` con `node:fs` pasa a
  `[serialized]`, y con él un fichero real del repositorio,
  `tests/types/spec011-alias-store.test-d.ts`. La partición es **43 S / 72 P**.

**Lo que hay que saber para no romperlo, además de los cuatro puntos de arriba:**

5. **Ninguna de las tres listas de esta configuración está escrita a mano.** La
   capacidad la cierra `builtinModules` (Node), lo que es código lo cierra
   `SCAN_EXTENSIONS` (`tests/polite/support/capability.ts`, con motivo por
   entrada) y lo que corre lo cierra `RUN_INCLUDE`, de donde derivan a la vez los
   `include` de los proyectos y el filtro del paseo. Si un día alguna de las tres
   se queda corta, **la respuesta no es añadirle una entrada a mano**: es
   preguntar por qué la fuente externa no la trae.
6. **Si `npm test` dice `names a file of code this reader cannot follow`**, hay
   un `.mts`/`.cts` (o un `.js` real) importado desde el grafo de un test que
   este lector no sabe seguir. No es un mecanismo que aflojar: ver F-SPEC-014-12.
7. **Los tres avisos de Vite por ejecución son conocidos y están declarados**
   (F-SPEC-014-4). No se silencian.

**Findings abiertos tras esta vuelta:** `F-SPEC-014-1` a `F-SPEC-014-5`,
`F-SPEC-014-10` (los de la 1.ª vuelta y del verificador, ninguno bloqueante) y
los tres nuevos `F-SPEC-014-11`, `-12` y `-13`. **Ninguno bloqueante.**
