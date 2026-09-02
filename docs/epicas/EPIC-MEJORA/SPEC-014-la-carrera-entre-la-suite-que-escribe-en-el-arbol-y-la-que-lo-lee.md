---
id: SPEC-014
tipo: spec
epica: EPIC-MEJORA
estado: en-progreso
aprobada-por: Alberto Fojo
historial:
  - {estado: borrador, fecha: 2026-09-02, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-09-02, por: Alberto Fojo}
  - {estado: en-progreso, fecha: 2026-09-02, por: sdd-implementador}
  - {estado: en-revision, fecha: 2026-09-02, por: sdd-implementador}
  - {estado: en-progreso, fecha: 2026-09-02, por: sdd-verificador}
---
# SPEC-014 — La carrera entre la suite que escribe en el árbol y la que lo lee

Cierra **F-SPEC-013-10**, la única entrada del inventario de EPIC-MEJORA que su
disparador subió a *Ahora* (*«ya cuesta gates y ha dejado de ser argumento»*).

## Problema

**`npm test` es rojo una de cada cinco veces sin que nada esté roto**, y lo está
en `main`, no en una rama. Está medido dos veces por `sdd-verificador` el
2026-09-02: 1 de 5 ejecuciones en `main`, 2 de 8 en la rama de SPEC-013, con
**tres víctimas distintas** —`tests/site/contact.test.ts`,
`tests/site/title-source.test.ts`, `tests/polite/evasions.test.ts`—.

### La causa, verificada sobre el árbol de hoy

`tests/polite/architecture.test.ts` **escribe ficheros reales dentro del
repositorio** y los borra en su `finally`. No es un descuido: es la sustancia de
sus controles positivos. Los casos 2d, 2e, 2g y 2k reproducen agujeros medidos
—un fichero que `git` no lista pero el escaneo sí tiene que ver (ADR-016 §4)—, y
esa reproducción **solo es cierta si el fichero existe de verdad**. Escribe hoy
en siete rutas:

`src/ingest/robots/hidden-control.ts` · `src/ingest/extension-control.mts` ·
`src/ingest/extension-control-js.mjs` · `src/app/(gl)/js-control/route.js` ·
`robots/side-control.ts` · `extension-control-outside-the-roots.mts` ·
`extension-control-outside-the-roots.js`

Al mismo tiempo, **catorce ficheros de test más recorren ese mismo árbol** en
otros *workers*, por tres caminos distintos: `readSourceFiles` de
`tests/site/source-scan.ts`, `readSourceTree` de `tests/support/source-tree.ts`,
y el paseo de `tests/polite/support/capability.ts` (`scanRepository`,
`repositorySources`, `scannedSources`), al que se suma el de
`tests/mirror/support/imports.ts` y el `readdir` propio de
`tests/mirror/user-agent.test.ts`. Vitest ejecuta ficheros en paralelo; el árbol
del repositorio es estado compartido y nadie lo declara como tal.

De ahí las dos formas de fallo, que son la misma causa:

1. **Un fichero de más** en una aserción sobre el conjunto:
   `+ "ingest/robots/hidden-control.ts"`.
2. **`ENOENT`** entre el `readdir` y el `readFile`, si el borrado cae en medio:
   `ENOENT … src/ingest/extension-control.mts`.

**Corrección a la investigación de partida, medida hoy:** el escritor es **uno
solo**, no dos. `tests/polite/evasions.test.ts` escribe únicamente bajo
`mkdtempSync(tmpdir())` y su propio comentario explica por qué —*«un segundo
fichero real bajo `src/` desde ESTA suite correría en paralelo con aquel escaneo
y lo pondría rojo por el motivo equivocado»*—. Es **víctima**, no escritor. Que
el autor de esa suite ya hubiera visto la carrera y la esquivara a mano dentro de
su fichero es, por sí solo, el argumento de que la disciplina no basta: el
siguiente que necesite escribir en el árbol no leerá ese comentario.

### Por qué no es solo una molestia

Las aserciones que se caen al azar son **precisamente las barreras**: el
guardián de la frontera de RN-11 (ADR-014 §4, SPEC-008/009), el de RN-08
(SPEC-013 CA-13), el del anonimato de ADR-012 y el de las URL de ADR-010. Un
gate que se pone rojo al azar enseña a **volver a correrlo hasta que salga
verde**, que es exactamente el hábito por el que un rojo de verdad pasa sin que
nadie lo mire. Y **no hay CI** (F-SPEC-004-3): el único guardián de esas reglas
es esta suite, corrida a mano.

Además atribuye el fallo al trabajo que tenga delante: SPEC-013 gastó dos vueltas
de verificación explicando que un rojo no era suyo.

## Usuarios / roles afectados

- **`sdd-verificador`**, que es quien paga hoy el coste: un rojo que no distingue
  su causa lo obliga a reproducir en `main` antes de poder emitir veredicto.
- **`sdd-implementador`**, que recibe rojos que no ha causado.
- **Toda spec futura de EPIC-002 en adelante**: hereda la regla de pertenencia de
  CA-3 en cuanto escriba un fichero de test.

## Criterios de aceptación

### CA-1 — Los dos grupos existen y **no se solapan nunca**, y eso se mide

**Dado** `vitest.config.ts`, **cuando** se declara la partición de la suite de
`npm test` en dos proyectos —uno **serializado** (el que puede tocar el sistema
de ficheros, CA-3) y otro **paralelo**—, **entonces**:

- **CA-1.1 (forma).** El proyecto serializado lleva `fileParallelism: false` y un
  `sequence.groupOrder` **estrictamente mayor** que el del paralelo. Un test que
  importa `vitest.config.ts` lo afirma sobre el objeto resuelto, sin releer el
  fichero como texto.
- **CA-1.2 (los dos mecanismos son necesarios, y por qué).** Medido hoy sobre
  vitest **4.1.11**, que es la versión instalada:
  `sequence.groupOrder` es el mecanismo **documentado** —*«If you don't set this
  option, all projects run in parallel»*, `SequenceOptions.groupOrder`—;
  `fileParallelism: false` sin él dio también cero solapes en la medición, pero
  esa garantía es **emergente y no está escrita**, y una suite no se apoya en
  eso. Los dos van, y el criterio los nombra por separado porque CA-6 apaga cada
  uno.
- **CA-1.3 (medida, no estadística).** Una ejecución de `npm test` con
  `--reporter=json` produce un `startTime` y un `endTime` por fichero. Sobre esa
  salida: **cero pares solapados** entre un fichero del grupo serializado y
  cualquier otro fichero de la ejecución —del otro grupo o del suyo—. Dos
  ficheros solapan si `aInicio < bFin ∧ bInicio < aFin`. Esta medida es
  **determinista**: es la prueba de que la carrera está cerrada, y las
  ejecuciones verdes de CA-7 son solo la red.

*De dónde sale:* no de una regla de negocio, sino de que las barreras que la
carrera derriba son las de RN-08 y RN-11. El mecanismo es nuevo y por eso lleva
su control positivo en CA-6 (ADR-016 §3.4).

### CA-2 — La partición es **exacta**: ni un fichero fuera, ni uno en los dos

**Dado** el conjunto de ficheros que `npm test` ejecutaba antes de esta spec
(**114 ficheros / 1117 casos**, medido en `main` el 2026-09-02), **cuando** se
aplica la partición, **entonces** un test afirma que:

- **CA-2.1** la unión de los ficheros seleccionados por los dos proyectos es
  **igual** a ese conjunto —derivado del glob `tests/**/*.test.ts` menos las
  exclusiones ya declaradas en `vitest.config.ts`, no de una lista escrita a
  mano—;
- **CA-2.2** la intersección es **vacía**;
- **CA-2.3** el recuento de `npm test` es 114 ficheros más los que esta spec
  añada, y **1117 casos más los que esta spec añada**, sin ningún fichero previo
  con recuento distinto.

*Por qué es un CA y no una obviedad:* una partición por listas de `include` falla
en silencio hacia el lado peligroso. Un fichero que se cae de las dos listas
**deja de ejecutarse y nada se pone rojo** — la barrera desaparece y el gate sale
verde. Es el modo de fallo de F-SPEC-004-3 con otra cara.

### CA-3 — La pertenencia al grupo serializado la decide el **grafo de imports**, no una lista de nombres

**Dado** un fichero de test, **cuando** se decide en qué grupo corre, **entonces**
la regla es una y solo una:

> Un fichero de test pertenece al grupo **serializado** si y solo si su grafo de
> imports transitivo **dentro del repositorio** —él mismo más todo módulo de
> `tests/` y de `src/` que alcance— contiene `node:fs` o `node:fs/promises`.

- **CA-3.1.** Un test lo comprueba en las dos direcciones, sobre los ficheros de
  verdad: ningún fichero del grupo paralelo alcanza `node:fs`/`node:fs/promises`,
  y **todo** fichero que lo alcanza está en el serializado.
- **CA-3.2.** El grafo se lee con el **lector que ya existe** —el AST del
  compilador de `tests/polite/support/capability.ts` / `tests/mirror/support/imports.ts`—
  y **no se escribe un segundo lector ni una expresión regular** (ADR-016 §5 bis,
  obligación 1: *un solo lector para todo el criterio*). La resolución incluye
  `@/…` y la sustitución `.js` → `.ts` del compilador.
- **CA-3.3 (falla cerrado, y se demuestra).** Un fichero que el lector no sepa
  parsear, o un especificador literal que no sepa colocar, es **rojo
  nombrándose**, no un `null` silencioso. Hay un caso que lo demuestra (ADR-016
  §5 bis, obligación 2). Es la misma clase de defecto que F-SPEC-013-12, y se
  cierra aquí en vez de heredarse.
- **CA-3.4 (ninguna exención por nombre).** El criterio **no admite ninguna lista
  de ficheros exentos, ni por nombre ni por patrón de ruta** (ADR-016 §3.3). Si
  un fichero necesitara una excepción, es RED y hay que rediseñar, no tolerar.
- **CA-3.5 — el residuo, escrito dentro del criterio** (ADR-016 §6). Este
  mecanismo **no promete** ver un fichero que alcance el sistema de ficheros
  **sin un `import` estático de `node:fs`/`node:fs/promises` dentro del grafo del
  repositorio**: por `node:child_process`, por `process.getBuiltinModule`, por un
  especificador dinámico no literal, o a través de una dependencia de
  `node_modules` (`@vercel/blob`, `postgres`, `next`). Es la misma familia de
  residuo que SPEC-009 declara en E12b. **Medido hoy: cero ficheros de test caen
  ahí.** Disparador de cierre: el primer test que llegue al árbol por una de esas
  vías; la salida sería contención en ejecución (ADR-016 §5), no otra lista.

**Por qué esta regla y no la estrecha.** La lista natural sería *«los que
recorren el árbol real»*: hoy quince, y la tengo enumerada. Es **más rápida y
está mal**: esa lista está cerrada por **mi lectura del código**, que es
exactamente lo que ADR-016 §3.1 llama *una lista cerrada por nuestra
imaginación*, y su decimosexta entrada la escribe alguien que no leerá esta spec.
*«Puede alcanzar el sistema de ficheros»* está cerrada por el **grafo de módulos
que resuelve el compilador**, que existe fuera del test. El precio es medido y se
paga a propósito: **41 de los 101 ficheros** de `npm test` caen en el grupo
serializado, y **26 de ellos no tocan el árbol compartido** (usan `tmpdir`). Eso
es tiempo, y el tiempo tiene su presupuesto en CA-8 y su salida escrita en
*Fuera de alcance*.

### CA-4 — Ni un test de una spec cerrada se toca, ni un guardián se debilita

**Dado** que `tests/polite/architecture.test.ts` (SPEC-008/009),
`tests/site/*.test.ts` (SPEC-004/005/007) y `tests/decide/*.test.ts` (SPEC-013)
son de specs en **`hecho`**, **cuando** se mide `git diff main`, **entonces**:

- **CA-4.1.** Los únicos ficheros de código tocados son `vitest.config.ts` y el
  fichero **nuevo** del guardián. **Cero líneas** cambiadas en cualquier otro
  fichero bajo `tests/` o `src/`.
- **CA-4.2.** `ALLOWED_PACKAGES`, `ENTRY_POINTS`, `SCAN_ROOTS`,
  `SCAN_EXCLUSIONS`, `SCAN_EXTENSIONS` y `ALLOWED_GLOBALS` quedan
  **byte-idénticos**. Si el guardián nuevo necesitara ensanchar alguno, es una
  **salvedad al gate**, no un diff callado.
- **CA-4.3.** Recuento fichero a fichero contra `main` por reporter JSON: **cero
  ficheros eliminados y cero con recuento de casos menor**.

*Cita:* **ADR-015**. Si esta spec acabara necesitando editar el cuerpo de un test
de una spec cerrada, no se edita: se enmienda en el ledger de esa spec y se sube
al gate. **No está previsto que haga falta, y ésa es la gracia del diseño:** la
corrección vive entera en la configuración.

### CA-5 — La partición no se lleva por delante la configuración compartida

**Dado** que `vitest.config.ts` hoy declara tres cosas de las que dependen suites
cerradas —`resolve.alias` de `@`, `oxc.jsx.runtime: 'automatic'` (SPEC-004 CA-2 y
CA-3) y el proyecto de `typecheck` sobre `tests/**/*.test-d.ts`—, **cuando** se
parte en dos proyectos, **entonces**:

- **CA-5.1.** Un test de cada grupo resuelve un import por `@/…` y un test que
  renderiza JSX pasa en el grupo que le toque: la configuración compartida se
  declara **una vez** y la reciben los dos, no se copia.
- **CA-5.2.** Los `.test-d.ts` siguen ejecutándose, con el mismo conjunto y el
  mismo `tsconfig`, y `npm test` sigue diciendo `Type Errors  no errors`.
- **CA-5.3 (control positivo).** Quitar un `@ts-expect-error` de un `.test-d.ts`
  deja el run **rojo** —la *prueba invertida* de SPEC-001 CA-3/CA-4/CA-6 sigue
  mordiendo—; se restaura y vuelve a verde. La salida literal de las dos
  ejecuciones va al ledger.

### CA-6 — Control positivo **por mecanismo**, no por batería

**Dado** que tres mecanismos sostienen esta corrección, **cuando** se apaga
**cada uno por separado** y sin ninguna otra mutación, **entonces** cada apagado
produce un fallo **nombrado y medible**:

- **CA-6.1.** Quitar `fileParallelism: false` del grupo serializado → la medida
  de intervalos de CA-1.3 muestra **solapes dentro del grupo serializado**.
- **CA-6.2.** Igualar los dos `sequence.groupOrder` → la medida de CA-1.3 muestra
  **solapes entre los dos grupos**.
- **CA-6.3.** Mover un fichero que alcanza `node:fs` al grupo paralelo → el
  guardián de CA-3.1 se pone **rojo nombrando ese fichero**.

Se apaga, se mide, **se restaura**, y las tres salidas literales van al ledger.
Un mecanismo sin su control es ceremonia (**ADR-016 §3.4**). Nótese que los dos
primeros se miden con la medida de intervalos y **no** esperando a que caiga el
flake: apagar el mecanismo no garantiza un rojo, garantiza un **solape**.

### CA-7 — Cómo se da por cerrado un flake probabilístico

**Dado** que el defecto cae ~1 de cada 5 ejecuciones, **cuando** se declara
cerrado, **entonces** hacen falta las tres piezas, **en este orden de
autoridad**, y las tres con salida literal en el ledger:

- **CA-7.1 — la medida (CA-1.3).** Es la prueba. Cero pares solapados: la carrera
  no puede darse, no es que hoy no se haya dado.
- **CA-7.2 — control positivo del flake, antes del arreglo.** **20 ejecuciones**
  de `npm test` sobre `main` (o sobre la rama con la partición revertida) tienen
  que dar **al menos una roja** con una de las dos firmas conocidas
  (`+ "ingest/robots/hidden-control.ts"`, o `ENOENT … extension-control`). Con
  p ≈ 0,2, la probabilidad de cero rojas en 20 es ≈ **1,2 %**: si sale cero, el
  flake **no se estaba reproduciendo** y CA-7.3 no demuestra nada. Sin esta pieza
  la evidencia es una anécdota.
- **CA-7.3 — la red, después.** **20 ejecuciones consecutivas** de `npm test`
  sobre la rama, **todas verdes**. Con p ≈ 0,2 sin corregir, la probabilidad de
  20 verdes seguidas es ≈ **1,2 %**.

**Una sola ejecución verde no cierra este CA, y decirlo es la mitad del
criterio.** El verificador que acepte menos de las tres piezas está aceptando el
mismo argumento que ha costado dos vueltas en SPEC-013.

### CA-8 — Los tres gates y el presupuesto de tiempo

**Dado** el gate de calidad de `.sdd.json` y **ADR-007**, **cuando** se cierra la
spec, **entonces**:

- **CA-8.1.** `npm run lint` → `oxlint --type-aware` → **exit 0**, sin avisos.
- **CA-8.2.** `npm test` verde con el recuento de CA-2.3.
- **CA-8.3.** `npm run test:db` **sin cambios**: esta spec no toca
  `vitest.integration.config.ts`. Se corre para demostrarlo, con
  `ps aux | grep vitest.mjs` en 0 antes de arrancar (F-SPEC-010-7).
- **CA-8.4 — presupuesto.** `npm test` **no pasa de 60 s de pared**. Medido hoy
  para calibrar: **4,85 s** la suite entera en paralelo, y **13,5 s** serializando
  `tests/site` + `tests/polite` + `tests/mirror` + `tests/decide`, que es un
  **superconjunto** del grupo serializado. Si se pasa del presupuesto es **RED**,
  y la salida es el residuo declarado en *Fuera de alcance* —el cerrojo
  compartido—, **nunca** una lista más estrecha que reintroduzca el juicio que
  CA-3 quita.

## Entidades y reglas afectadas

- **ADR-016** — gobierna el guardián de CA-3, que es una frontera de capacidad
  (*solo el grupo serializado puede alcanzar el sistema de ficheros*): §3.1
  (lista cerrada por algo que existe fuera del test → el grafo de módulos),
  §3.3 (ninguna exención por nombre → CA-3.4), §3.4 (control por mecanismo →
  CA-6), §5 bis (un solo lector, falla cerrado → CA-3.2 y CA-3.3), §6 (el residuo
  dentro del criterio → CA-3.5). **Su §4 no aplica**: el escaneo de CA-3 no
  recorre el árbol de código, recorre el grafo de imports de los ficheros que la
  configuración selecciona, y CA-2 ya exige que esa selección cubra el conjunto
  entero.
- **ADR-015** — gobierna CA-4: el cuerpo de una spec cerrada no se edita.
- **ADR-007** — oxlint con reglas *type-aware* es el gate de calidad (CA-8.1).
- **ADR-001** — vitest es el runner del stack; esta spec no lo cambia, lo
  configura.
- **RN-08** y **RN-11** — no se tocan: son las reglas cuyas barreras el flake
  derriba, y el motivo de que esto suba a *Ahora*.
- **ADR-014 §4**, **ADR-010 §5**, **ADR-012 §1** — las otras tres fronteras cuyos
  guardianes viven en los ficheros afectados.
- No hay término nuevo para `docs/fundacion/dominio.md`: esta spec no toca el
  dominio, toca la infraestructura de pruebas.

## Fuera de alcance

- **El cerrojo compartido** (exclusivo para escritores, compartido para lectores).
  Es la solución **mejor y más cara**: o trae una dependencia —y `ALLOWED_PACKAGES`
  es una frontera cerrada que habría que justificar con motivo escrito— o se
  escribe a mano, y entonces esto deja de ser un diff de configuración y pasa a
  ser código con sus propios modos de fallo. **Destino: EPIC-MEJORA;
  disparador: el día que `npm test` roce el presupuesto de CA-8.4, o el día que
  un test necesite tocar el árbol y no pueda serializarse.**
- **Reescribir `tests/polite/architecture.test.ts` para que no escriba en el
  árbol real.** Sería tocar dos specs `hecho` (SPEC-008 y SPEC-009) por ADR-015,
  y sería además **quitarle la sustancia al control**: sus casos 2d/2e/2g/2k
  demuestran que un fichero que `git` no lista **sí** lo ve el escaneo (ADR-016
  §4), y eso solo es cierto con un fichero de verdad.
- **`vitest.integration.config.ts` y la concurrencia *entre* configuraciones.**
  Dentro de `npm run test:db` hay un lector del árbol
  (`tests/db/rate-limit.test.ts`) y **ningún escritor**, así que la carrera no
  existe ahí. Que dos configuraciones corran a la vez es **F-SPEC-010-7**, que ya
  está inventariado con su disparador y su mitigación; **no se recoge aquí a
  propósito**, para no confundir dos problemas con la misma cara.
- **CI** (F-SPEC-004-3). Sin CI, las 40 ejecuciones de CA-7 las corre una persona
  en local. Esta spec no la crea.
- **Las demás entradas del inventario.** Las revisé una a una buscando alguna que
  cayera en este mismo diff: la única adyacente es F-SPEC-010-7, y queda fuera por
  lo dicho arriba. Ninguna otra toca `vitest.config.ts`.

## Notas para el gate humano

1. **No hay ADR, y es una decisión que te toca ratificar.** La regla de CA-3
   —*«un fichero de test que pueda alcanzar el sistema de ficheros corre
   serializado»*— obliga a toda spec futura, y eso suele pedir ADR. No lo he
   escrito por tres razones: **ADR-016 ya es el domicilio** de la forma del
   guardián; la decisión es **reversible** y su escalada está escrita como
   residuo; y el guardián de CA-3 hace la regla **mecánica**, así que no depende
   de que nadie relea un documento — que es justo el fallo que ADR-014 §4
   describe. Si prefieres que sea un ADR, es barato ahora y caro después.
2. **Corrección a la investigación de partida.** El encargo daba **dos**
   escritores en el árbol; hay **uno**. `tests/polite/evasions.test.ts` escribe
   solo en `tmpdir` y lo dice en su propio comentario. No cambia el diseño —el
   grupo serializado se decide por CA-3, no por quién escribe— pero sí cambia el
   diagnóstico, y conviene que conste.
3. **El precio, sin adornos.** 41 de 101 ficheros pasan a correr en serie, y 26
   de ellos no tocan el árbol compartido. Es deliberado: la lista estrecha es más
   rápida y está cerrada por mi lectura del código. Si te parece caro, la
   alternativa honesta no es estrechar la lista, es el cerrojo — y entonces esto
   deja de ser una spec pequeña.
4. **`groupOrder` es el mecanismo que aguanta.** Medí las tres configuraciones en
   vitest 4.1.11: con los dos proyectos por defecto hay solape (22 pares
   solapados en la medición); con `fileParallelism: false` en uno, cero; con
   `fileParallelism: false` **y** `groupOrder` distinto, cero. Solo la segunda
   garantía está **documentada**, así que van las dos. La propuesta de partida
   llevaba solo `fileParallelism`, y **no habría bastado por escrito**.
5. **Coste de verificación: 40 ejecuciones de `npm test`** (20 antes con el
   arreglo revertido, 20 después). A ~5 s en paralelo y quizá ~20 s serializado,
   son unos diez minutos de reloj. Es el precio de cerrar un flake sin mentir, y
   está en CA-7.
6. **Dos números que decidir antes de lanzar al implementador**, porque los he
   fijado yo: el **presupuesto de 60 s** de CA-8.4 y las **20 ejecuciones** de
   CA-7. Los 60 s son holgados a propósito (hoy son 4,85 s); las 20 dan un 98,8 %
   de potencia contra p = 0,2. Bajar de 20 debilita CA-7 hasta dejarlo
   decorativo.
