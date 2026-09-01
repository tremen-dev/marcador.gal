---
id: SPEC-009
tipo: spec
epica: EPIC-002
estado: en-revision
aprobada-por: Alberto Fojo
historial:
  - {estado: borrador, fecha: 2026-09-01, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-09-01, por: Alberto Fojo}
  - {estado: en-progreso, fecha: 2026-09-01, por: sdd-implementador}
  - {estado: en-revision, fecha: 2026-09-02, por: sdd-implementador}
---
# SPEC-009 — La frontera de capacidad de RN-11, demostrada sin listas negras

> **Nace el 2026-09-01, sacada de SPEC-008 por decisión de Alberto Fojo.** No es
> una spec nueva escrita desde cero: **hereda cinco verificaciones, once evasiones
> escritas y medidas, cuatro mecanismos y cuatro enmiendas**. Todo ese material
> vive en el ledger de SPEC-008 y aquí se cita por su identificador, no se copia.
>
> **Lo que la hace existir**: SPEC-008 entregó el adaptador de `ceroacero.es`, el
> ritmo durable de RN-11 y el arreglo del comodín de `robots.txt` — trece de sus
> catorce CA están ✅ o ⚠️ arbitradas—. Lo único que no termina es **CA-2**, y ha
> dejado de ser el alcance de aquella spec para ser un problema por derecho
> propio. CA-2 queda allí ⚠️ con su residuo escrito (ledger de SPEC-008,
> «Enmienda — 2026-09-01: CA-2 se queda ⚠️ con su residuo escrito, y la frontera
> de capacidad sale a SPEC-009»); lo que se muda aquí es la frontera.

## Problema

**ADR-014 §4 prohíbe que nadie fuera de `src/polite/` le pida bytes a un
tercero, y RN-11 es regla dura. Hoy esa prohibición se puede incumplir con dos
formas distintas de código, las dos medidas mandando una petición real sin
`User-Agent`, sin `robots.txt` y sin turno, con los tres gates en verde.**

No es una sospecha: son **F-SPEC-008-V34** y —hasta que SPEC-008 lo cierre—
**F-SPEC-008-V33**, escritas, ejecutadas y contadas contra un servidor local
propio por el `sdd-verificador` el 2026-09-01.

El modo de fallo de RN-11 es el peor que hay: **una petición que sale, se sirve y
no vuelve**. No lanza, no deja excepción, no pone roja ninguna suite. Y hay
prueba documental de que la convención escrita no basta: **F-SPEC-002-23** —el
comodín `*` tratado como carácter literal dentro de la única implementación de
RN-11— vivió semanas en `main` sin que nada se pusiera rojo.

Encima de eso hay una afirmación pública. `/robot` publica, en galego y en
castellano, con el propósito declarado de que un tercero nos audite (SPEC-005,
ADR-011), que solo `src/polite/` habla con una fuente y que se pide como mucho
una vez por minuto. **Una frontera que no se puede demostrar convierte esa página
en una afirmación falsa a terceros**, y eso es RN-11 incumplida más una mentira.

### Por qué esto no se arregla dentro de SPEC-008

Porque **el diagnóstico ha cambiado de nivel**. Las cuatro primeras vueltas
fueron *«el mecanismo se puede rodear»*; la quinta es otra cosa: **el criterio
esconde una lista negra**, y eso es exactamente lo que **ADR-016 §3.5 —aprobado
el 2026-09-01 e inmutable— prohíbe**:

> *«Una lista de lo permitido no vale por llamarse así: vale si admitir una
> entrada no obliga a nadie a saber de antemano si esa entrada es la capacidad
> que la frontera cierra. En cuanto la condición de admisión se escribe como
> "…y que no sea de éstos", la lista negra ha vuelto, un nivel más adentro y
> donde nadie la mira.»*

`CAPABILITY_NAMES` es **una lista negra de nueve nombres viviendo dentro de
CA-2.4**, y CA-2.4 afirma además, con esas palabras, un conjunto *«cerrado por el
lenguaje»* que **está medido abierto**: `process` es un global del anfitrión, no
de ECMAScript, y `process.getBuiltinModule(id)` es API estable desde Node 22 que
devuelve cualquier módulo interno **sin ningún `import`**. Taparlo añadiendo
`process` a la lista es añadir un nombre a una lista negra: es el defecto
volviendo, no el arreglo.

Cambiar la naturaleza de ese criterio no es un arreglo de implementación dentro
de una spec que ya entregó lo suyo: es una spec.

## Usuarios / roles afectados

- **`sdd-implementador`**: construye el cierre nuevo. Es trabajo de `tests/` y de
  configuración; **el objetivo declarado es no tocar `src/`**, y si alguna
  parte lo exigiera hay que decirlo antes y no descubrirlo al final (CA-6). La
  rama tiene que nombrar `SPEC-009`, o el hook `require-spec` deniega la
  escritura sobre `src/` y `tests/` (`.sdd.json`, `rutasVigiladas`).
- **`sdd-verificador`**: hereda **la única batería de ataque que este proyecto ha
  construido** —las once evasiones— y le toca escribir la duodécima. Su trabajo
  aquí no es leer el guardián: es **romperlo ejecutando**, que es lo que ha
  funcionado cinco veces seguidas.
- **`sdd-arquitecto`**, como autor de las siete specs restantes de EPIC-002:
  RN-08, RN-09 y RN-10 van a pedir exactamente esta forma (ADR-016 §*Contexto*).
  Lo que aquí se decida sobre el grano de la concesión lo heredan todas.
- **El operador del spike** (el autor, RN-01): es quien responde ante un tercero
  si una petición sale sin permiso, y es quien firmó la promesa de `/robot`.
- **Quien nos audite desde fuera**: `/robot` existe para eso. Es el único rol de
  esta spec que no es nuestro.

## Diseño

### §1. Lo que esta spec hereda, y por qué no empieza de cero

Cinco vueltas de verificación han producido tres cosas que **funcionan, están
medidas y no se rehacen**. Escribirlas otra vez sería tirar el trabajo que hizo
falta para encontrarlas.

1. **El lector del compilador** (`readModule`, `tests/mirror/support/imports.ts`).
   Abre el proyecto real con `typescript/unstable/sync` y clasifica con
   `typescript/unstable/ast`; devuelve `specifiers`, `compilerModules`,
   `unparseable`, `namespaceReads` y `bareIdentifiers`. **Es correcto y está
   comprobado rompiendo**: la novena evasión muere en sus tres escrituras
   (R1..R3), apagar el cruce contra `compilerModules` es rojo (R10), apagar el
   rojo por `unparseable` es rojo (R11), y dejar de enumerar `export … from` es
   rojo contra el propio compilador (R12). `moduleSpecifiers` y
   `withoutImportStatements` están **borrados, no envueltos**: no queda una
   segunda manera de averiguar qué importa un fichero.
2. **La trampa sobre `net.Socket.prototype.connect`**
   (`tests/polite/containment.test.ts`, 17 casos). **Deniega por defecto**, y eso
   es lo que más importa de todo lo construido: **ninguna petición de ningún test
   de este repositorio puede llegar a un tercero, y es mecanismo, no
   disciplina** (RN-11). Trae sus tres controles medidos —que ve a una
   dependencia de `node_modules`, que puede **negar** y no solo contar, y que el
   punto es una **propiedad** y no un símbolo— más el control del orden de
   instalación.
3. **El cierre por superficie de los imports** (`ALLOWED_PACKAGES`, entrada +
   superficie + motivo, catorce entradas). `fromURL` es rojo **sin que nadie lo
   nombre**, y el caso 4c lo demuestra juzgando con una lista sintética
   invertida. Es ADR-016 §3.5 aplicado y funcionando.

**Y una lista de ficheros que ya es suya**: `SCAN_ROOTS` y `SCAN_EXCLUSIONS`
declaradas con su motivo, y `scannedSources()` recorriendo el árbol de ficheros
en vez de preguntarle a `git ls-files --exclude-standard`.

**Lo que se rehace es exactamente una cosa: `CAPABILITY_NAMES`**, la lista negra
de nueve nombres que sostiene CA-2.4. Y se ensancha otra: la lista de cobertura,
que fuera de las raíces sigue saliendo de `git` (F-SPEC-008-V35).

### §2. Las once evasiones: la batería de ataque, y qué las mató

Es material de partida, no anécdota. Cada una es código real que alguien escribió
y ejecutó, con los gates en verde en el momento de escribirla. **Las que siguen
vivas están en negrita.**

| # | Forma | Qué mecanismo la dejó pasar | Cómo murió |
|---|---|---|---|
| 1 | `import { request } from 'node:https'` + cabecera por clave computada (`'User-' + 'Agent'`) | Textual: `callsPlatformFetch` solo conocía `fetch(` | `NETWORK_MODULE` (2ª vuelta); hoy CA-2.3 —no es entrada de la lista— y CA-2.1 |
| 2 | Segundo parser de `robots.txt` con `/^\s*disallow\s*:/i` | Textual: el detector pedía el token **entrecomillado y exacto** | `ROBOTS_WORD` (2ª vuelta); hoy **deja de ser infracción** (CA-2.8) |
| 3 | Segunda composición de la cadena declarada del User-Agent desde las constantes exportadas | Textual: `UA_HEADER`/`UA_LITERAL` pedían una asignación a `USER_AGENT*` | `UA_PARTS` (2ª vuelta); hoy lo cubre `tests/mirror/user-agent.test.ts` |
| 4 | `const { fetch: send } = globalThis` + `['User','Agent'].join('-')` (F-SPEC-008-V6) | Textual: la llamada es `send(`, y `NETWORK_GLOBAL` no listaba `globalThis` | CA-2.4 en estático **y** CA-2.1 en ejecución. Vive como control positivo (`architecture` 10, `containment` 6) |
| 5 | `await import('node:' + 'https')` (F-SPEC-008-V7) | Textual: el hueco entre `NETWORK_MODULE` y `COMPUTED_IMPORT` | CA-2.3: un especificador no literal es **rojo por construcción**. Control positivo (`architecture` 5, `containment` 7) |
| 6 | `await import(MOD)`, con el especificador en una variable | — | Murió en el sitio, contra `COMPUTED_IMPORT` |
| 7 | Un parser real de `robots.txt` **dentro de un fichero exento** (F-SPEC-008-V8) | La exención **nominal** por nombre de fichero | **No murió: dejó de ser infracción.** Es la pérdida que Alberto Fojo firmó a sabiendas (CA-2.8, F-SPEC-008-20). **N4 sobrevive y tiene que seguir sobreviviendo** (184/184) |
| 8 | `cheerio.fromURL` en `src/ingest/preflight.ts` (F-SPEC-008-V15) | **La lista de paquetes**: `cheerio` estaba concedido entero y **es** un cliente HTTP. La obligación «ninguna entrada es una puerta» se mecanizaba con **trece nombres prohibidos** | La concesión por **superficie** (CA-2.3) y la trampa en el socket (CA-2.1): R5 → `architecture` 3 + `containment` 2, 4, 8, 9 |
| 9 | `const noop = 0; import { execFileSync } from 'node:child_process';` (F-SPEC-008-V27) | **El lector**: tres expresiones regulares ancladas a principio de sentencia. **No falló cerrado: calló** | El lector del compilador: R1, R2 y R3 → `architecture` 3 en las **tres** escrituras |
| 10 | **`src/ingest/door.mts`**: un `.mts` bajo una raíz del escaneo (F-SPEC-008-V33) | **La lista de extensiones**, escrita dentro de dos funciones: ni `scannedSources()` ni el pathspec de `versionedSources()` casan con `.mts`/`.cts` | **Se cierra en SPEC-008**, por la enmienda del 2026-09-01: es una línea y llega a producción |
| 11 | **`process.getBuiltinModule('node:child_process')`** (F-SPEC-008-V34) | **`CAPABILITY_NAMES`**: nueve nombres prohibidos dentro de CA-2.4. Sin ningún `import` que CA-2.3 pueda juzgar, y `node:child_process` no pasa por un socket | **VIVA. Es la materia de esta spec.** |

Y un hueco que no es una evasión numerada pero es de la misma familia:
**F-SPEC-008-V35** — fuera de `SCAN_ROOTS`, la lista de **cobertura** sigue
saliendo de `versionedSources()`, y `git` no ve lo que `.gitignore` esconde. Un
`robots/side.ts` en la raíz del repositorio, importado con una ruta relativa que
`resolvesInsideRepository` acepta, deja `lint exit=0`, `npm test` 772/772 y
`tests/polite` 86/86.

**La octava, la novena, la décima y la undécima mandaron un paquete de verdad.**
Las siete primeras eran código muerto: ninguna mandó jamás un byte.

### §3. Los cuatro mecanismos, y por qué cada uno fue superado

Para que nadie reinvente el primero. Cada fila es una vuelta entera de
implementación y verificación.

| Mecanismo | Qué era | Por qué se superó |
|---|---|---|
| **1. Detección textual** (vueltas 1-2) | Una batería de patrones sobre el árbol de ficheros: `callsPlatformFetch`, `NETWORK_MODULE`, `NETWORK_GLOBAL`, `COMPUTED_IMPORT`, `ROBOTS_WORD`, `UA_PARTS`, más dos exenciones **por nombre de fichero** | Enumeraba **formas de escribir una llamada**, y esa lista no tiene última entrada: **siete evasiones en dos vueltas**. El diagnóstico estaba escrito en el propio ledger *antes* de que ningún verificador lo demostrara (F-SPEC-008-10) |
| **2. Contención de capacidad con `vi.mock`, y lista de paquetes** (vuelta 3) | `ALLOWED_PACKAGES` concediendo **paquetes enteros**; trampas sustituyendo los módulos de red en el registro del runner | Dos defectos a la vez, los dos medidos: la lista tenía **una lista negra en su condición de admisión** (`cheerio` entró porque nadie sabía que era un cliente HTTP), y la trampa registró **cero disparos mientras salía un paquete** —`undici` vive en `node_modules`, que vitest externaliza, así que sus `node:net`/`node:tls` no pasan por el registro que `vi.mock` sustituye— |
| **3. Concesión por superficie, y trampa en el socket** (vuelta 4) | La lista concede **nombres**, no paquetes; la trampa baja a `net.Socket.prototype.connect` y **deniega por defecto** | El **lector** era una expresión regular anclada a principio de línea. Doce caracteres separaban verde de rojo, y `node:child_process` —entero fuera de la lista— entraba igual. **Y no fallaba cerrado: callaba** |
| **4. El lector del compilador, y la lista de ficheros propia** (vuelta 5) | `readModule` sobre el árbol de `typescript/unstable/*`; `scannedSources()` sobre el árbol de ficheros, con exclusiones propias y con motivo | **El agujero se movió del lector a las listas**: la de extensiones (`.mts`, F-SPEC-008-V33) y la de identificadores globales (`CAPABILITY_NAMES`, F-SPEC-008-V34). Las dos son listas escritas dentro de una función, no declaradas |

**La lección que atraviesa las cuatro, y que esta spec existe para no repetir:**
cada vez que el mecanismo se apoyó en **una lista escrita por nosotros de lo que
sabemos que está mal**, la evasión siguiente entró por lo que no sabíamos. Cada
vez que se apoyó en **algo que existe fuera del test** —la gramática del
lenguaje, el árbol del compilador, el punto por el que pasa un socket, la
superficie exportada de un paquete— aguantó.

### §4. La pregunta abierta que motiva la spec

**Es lo primero que el gate humano tiene que decidir, y no lo decide
`sdd-arquitecto`.**

CA-2.4 de SPEC-008 dice, con estas palabras, que sin un `import` *«ECMAScript da
exactamente tres maneras de alcanzar una capacidad: el objeto global, un
identificador global desnudo, y `eval`/`Function`»*, y que es *«un conjunto
cerrado por el lenguaje, no por nosotros»*. **Eso está medido falso**: `process`
no es de ECMAScript sino del anfitrión, y `process.getBuiltinModule` entrega
cualquier módulo interno sin `import`.

Hay exactamente dos salidas honestas, y **son las dos que esta spec pone delante
del gate**:

**(a) Lista blanca de identificadores globales, con superficie y motivo.** La
misma forma que `ALLOWED_PACKAGES`, un criterio más allá: un fichero declara qué
identificadores **libres** puede usar y qué se lee de cada uno.
`process.getBuiltinModule` sería rojo **sin que nadie tenga que saber que
existe**, igual que `fromURL`. Es la respuesta que ADR-016 §3.5 pide
literalmente —*«bajar el grano de la concesión hasta que la pregunta se conteste
sola»*—.

**(b) Aceptar la lista negra y escribir el residuo dentro del criterio**
(ADR-016 §6). Es más barato, es honesto si se escribe, y deja la frontera
declaradamente incompleta.

**Lo que hoy no es aceptable es donde estamos**: un criterio que afirma un
conjunto cerrado que está medido abierto. Un criterio verdadero y estrecho vale
más que uno amplio y falso (ADR-016 §6).

**Esta spec propone (a)** y la escribe como CA-1, porque es lo que la doctrina ya
firmada pide y porque (b) deja viva una evasión que manda paquetes. Pero
**(a) tiene un coste que no está medido y hay que decirlo antes de firmar**:

- **El lector de hoy no resuelve símbolos.** `bareIdentifiers` recoge *todo*
  identificador usado como referencia —locales, importados y globales por igual—.
  Para que una lista blanca sea del tamaño de los globales y no del tamaño del
  repositorio, el lector tiene que saber distinguir un identificador **libre** de
  uno ligado, y eso es trabajo nuevo sobre el árbol. **No está medido**, y
  medirlo es la primera tarea de la implementación, no la última (CA-1 y notas
  del gate §2).
- **La lista puede ser larga.** `URL`, `TextDecoder`, `console`, `Error`,
  `Promise`, `JSON`, `Math`, `Uint8Array`… son globales legítimos que este
  repositorio usa. **Cuántos son exactamente no está medido.** Si resultara
  desproporcionado, ése es el argumento honesto a favor de (b), y el sitio de
  darlo es el gate y no la cuarta vuelta.

### §5. Dónde queda la frontera con SPEC-008

**Se queda en SPEC-008, y no se toca aquí:**

- **CA-1** (el comodín `*` y el ancla `$` de `robots.txt`), **CA-4..CA-13** y
  **CA-14** entero (el ritmo durable de RN-11, con `migrations/0002` y sus 144
  casos contra un Postgres real). Están entregados y verificados.
- **CA-3** ⚠️ (F-SPEC-008-1) y **CA-8** ⚠️ (F-SPEC-008-2), arbitradas y no
  revisitadas.
- **CA-2.8 y su pérdida firmada**: un segundo parser de `robots.txt` puede
  existir mientras no pueda decidir ni abrir una puerta. **N4 tiene que seguir
  sobreviviendo.** Esa firma es de Alberto Fojo, del 2026-09-01, y esta spec
  **no la reabre**.
- **F-SPEC-008-V33**, la décima evasión, que SPEC-008 cierra en su CA-2.6
  enmendado porque es una línea y llega a producción.
- **CA-2 entero, como ⚠️ con su residuo escrito.** Sigue siendo el criterio de
  aquella spec y sigue mordiendo para todo lo que ya cierra.

**Se muda aquí:**

- **F-SPEC-008-V34** — `CAPABILITY_NAMES` como lista negra, y el conjunto de
  CA-2.4 medido abierto. Es CA-1.
- **F-SPEC-008-V35** — la lista de cobertura fuera de las raíces. Es CA-2.
- **La batería de las once evasiones** como material vivo y ejecutable. Es CA-3.
- **La obligación de ADR-016 §6** sobre esta frontera concreta: decir dentro del
  criterio qué no promete. Es CA-4.

### §6. Un aviso sobre la urgencia, porque una spec que no la sitúa se prioriza mal

**Las once evasiones son código que nadie ha escrito salvo para probarlas, y
nada de este repositorio se ha corrido nunca contra `ceroacero.es`.** El
verificador lo ha confirmado **cinco veces**, y desde la cuarta vuelta no es
disciplina sino mecanismo: la trampa del socket deniega todo lo que no sea
`127.0.0.1`. Lo único que ha salido a la red en todo el expediente ha ido a un
servidor local propio y a la rama de test de Neon.

Eso **no** las hace irrelevantes:

- RN-11 falla en silencio, y F-SPEC-002-23 es la prueba de que un defecto así
  vive semanas en `main`;
- `/robot` publica la promesa **como auditable por terceros** (SPEC-005,
  ADR-011), y una promesa que no se puede demostrar es una afirmación falsa;
- el día que exista el cron, `src/ingest/` se cablea a un despliegue y la
  infracción pasa de **latente** a **consumada**.

Pero sí sitúa la urgencia: **hoy no hay ninguna petición saliendo por la puerta
equivocada, porque no hay ninguna petición saliendo**. Esta spec va **antes de
que el cron despliegue algo que pida**, y esa es su fecha real. No va antes que
el bot de Telegram ni que el panel del operador, que son la única ruta a un
marcador confirmado (`_epica.md` de EPIC-002).

## Criterios de aceptación

- **CA-1 — La capacidad global se concede, no se prohíbe: lista blanca de
  identificadores libres, con superficie y motivo (F-SPEC-008-V34, ADR-016 §3.5).**

  > *Éste es el criterio que el gate humano tiene que decidir. `sdd-arquitecto`
  > propone la forma (a) del §4 y escribe su coste no medido; la alternativa (b)
  > —aceptar la lista negra y escribir el residuo dentro del criterio— está en
  > las notas del gate §1 y es una firma distinta.*

  Dado todo fichero de código bajo las raíces declaradas del escaneo,
  cuando se enumeran, **desde el árbol del compilador**, los identificadores que
  el fichero usa como referencia **libre** —los que no declara él, no le llegan
  por un `import` juzgado por el cierre de imports, y no son ligadura de ningún
  ámbito que los contenga—,
  entonces cada uno es (i) una **entrada declarada de una lista de identificadores
  globales permitidos**, con su **motivo escrito junto a la lista**, y **cada
  miembro que se lee de él está en la superficie que esa entrada declara**; o
  (ii) **rojo, nombrando el fichero y el identificador**.
  **Lo que no está, es rojo, y no hace falta que nadie sepa que existe.**

  1. **No queda ninguna lista de nombres prohibidos.** Un caso lo comprueba como
     el 4c de SPEC-008 comprueba `ALLOWED_PACKAGES`: **conduciendo el juicio con
     una lista sintética invertida**. Si quedara un nombre cableado —o una lista
     de «globales seguros» escondida en la condición de admisión— ese caso la
     destapa.
  2. **Control positivo, y es la reproducción exacta de F-SPEC-008-V34**:
     `const cp = process.getBuiltinModule('node:child_process');` en un `.ts`
     corriente, bajo una raíz y alcanzable desde `ENTRY_POINTS`, es **rojo**
     **sin que `process` aparezca en ninguna lista de nombres prohibidos**. Y
     `process.env`, si alguna entrada lo declara con su motivo, **no** lo es: es
     la prueba de que el grano es la superficie y no el identificador.
  3. **Lo que ya moría, sigue muriendo.** `globalThis` (F-SPEC-008-V6), un
     `fetch` desnudo, `XMLHttpRequest`, `WebSocket`, `EventSource`, `navigator`,
     `eval`, `new Function` y `require` siguen siendo rojos fuera de
     `src/polite/`, y los casos que hoy lo prueban (`architecture` 8..12) no
     pierden ni una aserción.
  4. **Un identificador declarado no es una capacidad tomada prestada**, y el
     falso positivo que la quinta vuelta corrigió no vuelve: el miembro `fetch`
     de la interfaz `HttpFetcher` (`src/polite/http.ts:32`) **no** es una ofensa.
     Un caso lo fija.
  5. **Los escapes Unicode no cambian el veredicto** (`globalThis`): se lee
     del árbol, y el árbol no tiene texto. Es el caso 11b de SPEC-008 y **se
     conserva**.
  6. **El tamaño de la lista se mide antes de decidir su forma, y el número va al
     ledger.** El primer trabajo de la implementación es contar cuántos
     identificadores libres distintos usa hoy el escaneo; si el número hace la
     lista desproporcionada, **eso es un finding con destino `sdd-arquitecto` y
     gate humano**, no una excusa para aflojar el criterio ni para escribirlo a
     medias.

- **CA-2 — La lista de cobertura no le pregunta a `git` lo que `git` no puede
  contestar (F-SPEC-008-V35).**
  El caso que hace que **quedar fuera del escaneo sea una decisión declarada** no
  puede derivarse de `git ls-files --exclude-standard`, porque `.gitignore`
  esconde `**/robots/*` por una razón legítima y ajena (ADR-009 §3, y **no se
  toca**).
  Dado el árbol de ficheros del repositorio,
  cuando se enumera el código que queda **fuera** de las raíces del escaneo,
  entonces cada fichero que quede fuera lo hace por una **raíz o una exclusión
  declaradas con su motivo**, y no por una regla escrita para otra cosa.
  **Control positivo, reproducción exacta de F-SPEC-008-V35**: un `robots/side.ts`
  en la raíz del repositorio, importado desde `src/ingest/adapter.ts` con una
  ruta relativa que `resolvesInsideRepository` acepta, **es rojo** — hoy deja
  `lint exit=0`, `npm test` 772/772 y `tests/polite` 86/86, y no aparece en
  `git status`.

- **CA-3 — Las once evasiones son una batería ejecutable, y cada mecanismo lleva
  su control (ADR-016 §3.4).**
  Las once formas del §2 viven en el repositorio **como casos**, cada una contra
  el mecanismo que le toca, y **apagar cualquier mecanismo del criterio pone rojo
  al menos un caso nombrado**.
  1. Las que hoy mueren, siguen muriendo, y se comprueba **ejecutando**: las
     mutaciones R1..R13, Q1..Q8 y N1..N16 del ledger de SPEC-008 nombran el
     fichero y el caso de cada una. Una regresión aquí es un rojo, no una nota.
  2. **La que sobrevive a propósito va nombrada**: **N4** —el segundo parser de
     `robots.txt` dentro de `src/site/robots-txt.ts`— **tiene que seguir
     sobreviviendo**. Es la pérdida que Alberto Fojo firmó (CA-2.8 de SPEC-008,
     F-SPEC-008-20), y un cierre que la matara *por accidente* sería un cambio de
     criterio sin firma.
  3. **La duodécima entra aquí el día que aparezca.** El comentario de cabecera
     de la batería lo dice, para quien llegue sin este expediente.

- **CA-4 — Lo que esta frontera NO promete, dicho dentro del criterio y de forma
  medible (ADR-016 §6).**
  El criterio lleva escrito, en su propio texto, el residuo que su mecanismo no
  alcanza, nombrado de manera que se pueda medir. Como mínimo, y ninguno de los
  cuatro es negociable a la baja:
  1. **La contención en ejecución solo ve lo que se ejecuta.** Código alcanzable
     desde `ENTRY_POINTS` cuya rama de red no ejerza ningún caso no dispara nada.
     Es cuestión de **cobertura**, y este proyecto no la mide.
  2. **La trampa solo ve lo que sale por un socket.** UDP (`node:dgram`), un
     subproceso y un binario nativo no pasan por ahí; su único cierre es el
     estático, y **esta spec existe porque ese cierre falló dos veces**. El día
     que uno entre como dependencia real hay que ensanchar la trampa **con la
     medida delante**.
  3. **El cierre estático es sintaxis, no semántica, y de un nivel.** El árbol
     dice qué nombres cruzan la frontera; no dice qué hacen. Y una superficie
     concedida cuyo contenido tenga capacidad dentro no queda cerrada por dentro
     (`z`, de `zod`, es el caso vivo).
  4. **Demuestra qué puede salir desde este repositorio, no qué hace la
     plataforma en producción.** La trampa vive en el proceso del test.
  Un caso comprueba que cada residuo declarado **es alcanzable con un ejemplo**:
  un residuo que nadie puede escribir no es un residuo, es una excusa.

- **CA-5 — Lo que ya funciona no se rehace, y se demuestra que sigue mordiendo.**
  Dado el trabajo de las vueltas 4 y 5 de SPEC-008,
  cuando termina esta spec,
  entonces **el lector del compilador, la trampa que deniega por defecto y el
  cierre por superficie siguen siendo los mismos mecanismos**, y las mutaciones
  que los sujetan siguen matando los mismos casos: la octava evasión repuesta en
  `#captureGranted` es roja en las **dos** mitades, la novena es roja en sus
  **tres** escrituras, y un fichero bajo `src/**/robots/` es rojo **dos veces**.
  **Y sigue en pie la propiedad que hace segura toda la suite**: con la trampa
  puesta, **ninguna petición de ningún test puede llegar a un tercero** (RN-11).
  Un caso lo comprueba negando.

- **CA-6 — Esta spec no toca `src/`, y si tuviera que tocarlo se dice antes.**
  Dado el diff de la rama,
  entonces no hay ninguna modificación bajo `src/`, `migrations/` ni
  `.gitignore`. Si la implementación descubre que el cierre exige mover código de
  producción —por ejemplo, que un fichero de `src/` use hoy un identificador
  global que nadie quiere declarar—, **eso es un finding con destino gate humano
  antes de escribir el cambio**, no un commit.
  *(Las cinco vueltas de SPEC-008 se hicieron enteras sin tocar `src/`, así que
  no es una aspiración: es lo que ha pasado cinco veces.)*

- **CA-7 — Los tres gates, y las suites cerradas enteras.**
  `npm run lint` en `exit=0`, `npm test` y `npm run test:db` en verde, con las
  **tres salidas literales en el ledger**. `DATABASE_URL_TEST` es obligatorio:
  sin él los criterios que dependen de él son **UNMET, no *skipped*** (gate del
  2026-08-29).
  Y **ninguna suite cerrada pierde un caso**: recuento fichero a fichero de
  `tests/mirror`, `tests/site`, `tests/docs`, `tests/model`, `tests/raw`,
  `tests/db` y `tests/types` contra `main`, como lo hacen las cinco
  verificaciones de SPEC-008.

## Entidades y reglas afectadas

**Reglas de negocio** (`docs/fundacion/reglas.md`, no se duplican aquí):

- **RN-11** — la regla que esta frontera demuestra: `robots.txt` obedecido,
  user-agent identificado y 1 petición/minuto por competición. Su modo de fallo
  es silencioso, y por eso necesita guardián y no convención.
- **RN-08, RN-09, RN-10** — no son de esta spec, pero **heredan su forma**: las
  tres son fronteras que van a pedir el mismo mecanismo en las specs siguientes
  de EPIC-002 (ADR-016 §*Contexto*).

**ADRs:**

- **ADR-016** (`aprobada`, inmutable) — **es la ley de esta spec, y esta spec no
  la redefine.** §2 (se enumera lo permitido y el resto tiene que ser vacío),
  §3.1..§3.5 (las cinco obligaciones de una lista de lo permitido, y en especial
  §3.5, que es lo que hace bloqueante a F-SPEC-008-V34), §4 (las raíces y la
  lista de ficheros, que es F-SPEC-008-V35), §5 y §5 bis (la contención en
  ejecución y su gemelo estático) y **§6** (el criterio dice, dentro del
  criterio, qué no promete: es CA-4).
- **ADR-014** (`aprobada`, inmutable) — **§1 y §4**: la cortesía tiene un solo
  dueño y vive en `src/polite/`. Esta spec **no lo reabre**: demuestra lo que él
  decide. Su primera prohibición —un segundo parser de `robots.txt`— sigue
  sostenida en revisión humana desde el arbitraje del 2026-09-01, y eso tampoco
  se reabre aquí.
- **ADR-015** (`aprobada`) — la forma de una enmienda sobre un criterio firmado.
  Es la que usa la enmienda del ledger de SPEC-008 que saca esta materia de allí.
- **ADR-009 §3** — `.gitignore:17` (`**/robots/*`) **no se toca**: protege algo
  que es irreversible si se incumple, porque git no se purga, se reescribe. CA-2
  arregla el escaneo, no la regla.
- **ADR-007** — oxlint con reglas *type-aware*. ADR-016 lo deja dicho: un CA
  puede apoyarse en el linter, **no puede agotarse en él**. Y está medido que
  `lint exit=0` convive con las cuatro evasiones que mandaron un paquete.
- **ADR-011** — la forma estable del user-agent declarado, y la mitad de RN-11
  que se delega en `/robot`.
- **ADR-004** — Vercel: la trampa vive en el proceso del test y no en producción
  (CA-4.4).

**Términos de `dominio.md`** que esta spec consume y no redefine: `robots.txt`,
`raw store`, **adaptador de fuente**, `ceroacero.es`.

## Fuera de alcance

Aparcado a propósito, no por descuido.

- **Todo lo que SPEC-008 entregó, que es casi toda SPEC-008.** No se reabre
  **ADR-014**, ni el adaptador de `ceroacero.es`, ni el ritmo durable de RN-11
  (CA-14, `migrations/0002`, las dos implementaciones del puerto y sus 144 casos
  contra un Postgres real), ni el comodín de `robots.txt` (CA-1), ni `CA-4..CA-13`.
  **Ni una línea de `src/` se toca por esta spec** (CA-6).
- **La pérdida firmada de CA-2.8.** Un segundo parser de `robots.txt` puede
  existir mientras no pueda decidir ni abrir una puerta. **N4 sobrevive**, y
  cerrarla sería un cambio de criterio que exige otra firma humana.
- **CA-3 y CA-8 de SPEC-008** (⚠️ arbitradas): la aserción enmendada del guardián
  del user-agent y la calibración de las cuatro ramas de `CEROACERO_SHAPE`.
- **F-SPEC-008-V33**, que cierra SPEC-008. Si al empezar esta spec siguiera
  abierto, se hereda; pero **no es su materia**.
- **La cobertura de tests como métrica.** Es lo único que cierra el residuo de
  CA-4.1, y este proyecto no la mide, no tiene CI y no hay dato para fijar un
  umbral. ADR-016 §*Consecuencias negativas* 2 ya lo dejó anotado como el sitio
  al que va ese residuo el día que la cobertura exista. **EPIC-MEJORA.**
- **Los findings de SPEC-008 rutados a otro sitio**: F-SPEC-008-V3 y V12 (RN-10
  sostenido por la estructura), V5 (`pairKey` duplicado), V18 (CA-2.2 es
  contención de conjuntos y no emparejamiento por petición), V20 (`escapeRegExp`
  sin red), V21 (el `kickoff` en las cinco ramas), V24, V26, V29..V32. Ninguno se
  arregla aquí, y ninguno cambia de destino por esta spec.
- **El cron, el calendario, el catálogo de alias, el motor, el bot y el panel.**
  Siguen siendo las specs que EPIC-002 tiene por delante, y **van antes que las
  cifras**.
- **La pregunta legal (F-SPEC-008-7).** El dictamen de `sdd-legal-datos` sobre
  `ceroacero.es` **en régimen de ingesta** sigue sin pedir. Es precondición de
  correr la primera jornada, no de escribir código, y esta spec no corre nada
  contra nadie.
- **Una regla de linter que sustituya al criterio.** Legítima como complemento
  barato de la mitad de `import` (ADR-016, *Alternativas*), nunca como la prueba
  de la frontera: no alcanza al global desnudo, ni a la alcanzabilidad, ni a la
  contención en ejecución, y su evidencia no viaja con el ledger.

## Notas para el gate humano

Lo que hay que mirar con lupa antes de firmar. **La primera es una pregunta
abierta de verdad y las demás son consecuencias.**

1. **La decisión que esta spec pone delante, y no es de `sdd-arquitecto`: (a) o
   (b) del §4.** O CA-2.4 pasa a **enumerar los identificadores globales
   permitidos** —lista blanca con superficie y motivo, como `ALLOWED_PACKAGES`, y
   todo lo demás rojo—, o se acepta la lista negra y **el residuo se escribe
   dentro del criterio** (ADR-016 §6). La spec propone (a) y escribe (b) como
   alternativa honesta. **Lo que no se puede firmar es lo de hoy**: un criterio
   que afirma un conjunto «cerrado por el lenguaje» que está **medido abierto**.
2. **(a) tiene un coste que NO está medido, y lo digo antes de que se firme.**
   El lector de hoy no resuelve símbolos: `bareIdentifiers` recoge todo
   identificador usado como referencia. Distinguir un identificador **libre** de
   uno ligado es trabajo nuevo sobre el árbol, y **cuántos globales distintos usa
   hoy el escaneo tampoco está contado**. CA-1.6 lo convierte en la primera
   tarea, con salida al ledger, precisamente para que la desproporción —si la
   hay— aparezca en la primera vuelta y no en la cuarta. **Si el gate prefiere
   que se mida antes de firmar, es una petición razonable y el sitio de hacerla
   es ahora.**
3. **Esta es la sexta vuelta del mismo problema, y conviene decirlo entero.**
   Cinco verificaciones, cuatro enmiendas, once evasiones. El patrón ha cambiado
   dos veces de nivel —del texto al mecanismo, y del mecanismo al criterio—, y
   cada cambio ha sido correcto y ha destapado el siguiente. **No hay garantía de
   que éste sea el último**, y quien firme debería contar con una vuelta más.
   Lo que sí ha cambiado es que las tres piezas caras están construidas y
   medidas; lo que queda es una lista.
4. **La urgencia es real pero no es hoy** (§6). Nada se ha corrido nunca contra
   `ceroacero.es`, y desde la cuarta vuelta eso es mecanismo y no disciplina. La
   fecha real de esta spec es **antes de que el cron despliegue algo que pida**,
   no antes del bot ni del panel.
5. **Sacar esta spec mueve el desglose de EPIC-002.** El `_epica.md` habla de
   ocho specs orientativas y `docs/roadmap.md` de la secuencia. **Esta spec no
   los toca**: es trabajo de `sdd-producto`, y va dicho aquí para que no se
   descubra por sorpresa.
6. **La rama de implementación tiene que nombrar `SPEC-009`.** El hook
   `require-spec` deduce la spec del nombre de la rama y deniega la escritura
   sobre `src/` y `tests/` si no la encuentra.
7. **Lo que esta spec deliberadamente no promete.** No mueve ninguna de las
   cuatro cifras, no publica un marcador, no captura nada y no deja el sistema
   capaz de hacerlo. Lo que entrega es que **una regla dura tenga un guardián que
   no se pueda rodear con un nombre que a nadie se le había ocurrido**.
