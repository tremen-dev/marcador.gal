---
id: SPEC-008
tipo: spec
epica: EPIC-002
estado: en-progreso
aprobada-por: Alberto Fojo
historial:
  - {estado: borrador, fecha: 2026-09-01, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-09-01, por: Alberto Fojo}
  - {estado: en-progreso, fecha: 2026-09-01, por: sdd-implementador}
  - {estado: en-revision, fecha: 2026-09-01, por: sdd-implementador}
  - {estado: en-progreso, fecha: 2026-09-01, por: sdd-orquestador}
  - {estado: en-revision, fecha: 2026-09-01, por: sdd-implementador}
  - {estado: en-progreso, fecha: 2026-09-01, por: sdd-verificador}
  - {estado: en-revision, fecha: 2026-09-01, por: sdd-implementador}
  - {estado: en-progreso, fecha: 2026-09-01, por: sdd-verificador}
  - {estado: en-revision, fecha: 2026-09-01, por: sdd-implementador}
  - {estado: en-progreso, fecha: 2026-09-01, por: sdd-verificador}
  - {estado: en-revision, fecha: 2026-09-01, por: sdd-implementador}
  - {estado: en-progreso, fecha: 2026-09-01, por: sdd-verificador}
  - {estado: en-revision, fecha: 2026-09-01, por: sdd-implementador}
  - {estado: en-progreso, fecha: 2026-09-01, por: sdd-verificador}
---
# SPEC-008 — Adaptador de `ceroacero.es` y cortesía RN-11 con una sola implementación

## Problema

**EPIC-002 tiene que producir cuatro cifras sobre «el dato publicado», y hoy no
hay ni un solo camino desde una fuente hasta una `Observation`.** `src/ingest/`
no existe. Lo que existe —`src/model/`, `src/raw/`, `src/db/` (SPEC-001) y el
instrumento de `src/mirror/` (SPEC-002, SPEC-003)— es el andamio: modelo
canónico, archivo, puertos de repositorio y una máquina de captura cortés que
nadie de producción puede usar todavía.

Esta spec abre ese camino por su primer tramo, y **solo por el primero**: pedir
una página a `ceroacero.es` respetando RN-11, archivarla antes de mirarla
(RN-10), leer sus filas y convertirlas en `Observation` del modelo canónico.
Nada de eso se publica: publicar es escribir una `Decision`, y eso solo lo hace
el motor (RN-08, D-3).

`ceroacero.es` no es «una fuente más»: es **la única fuente automática
capturable** que tiene el proyecto. `futgal.es`, la oficial y de peso 1.0,
prohíbe el rastreo en su `robots.txt` y RN-11 obliga a respetarlo (ADR-008 §1).
`besoccer.es` sirve armazones vacíos. `resultados-futbol.com` no es una cuarta
fuente sino un 301 a besoccer. Queda una, de peso 0.7
(`hallazgos/fontes-capturables.md`).

### El daño concreto que esta spec existe para evitar: F-SPEC-002-23

Hay, además, un incumplimiento de RN-11 **vivo en `main` y silencioso**.
`parseRobots` (`src/mirror/capture/robots.ts`) empareja rutas con
`path.startsWith(rule.path)`, así que trata el `*` de una ruta como **carácter
literal**. Frente al `robots.txt` real de besoccer, que publica
`Disallow: /ajax*` y `Disallow: /scripts*` en un grupo cuya otra línea es
`Allow: /`:

- `/ajax/algo` no empieza por la cadena literal `/ajax*`,
- la regla **no casa**,
- gana el `Allow: /` del mismo grupo,
- y `isAllowed('https://www.besoccer.es/ajax/algo')` devuelve **`true`**.

El comodín `*` y el ancla `$` son parte de RFC 9309, y `Disallow: /foo*` es un
idioma corriente. El acumulado de varios grupos `User-agent: *` **sí** funciona:
el fallo es solo el comodín.

**Por qué muerde ahora y no antes.** En la ventana de SPEC-003 los objetivos son
páginas HTML de competición y las dos rutas afectadas quedan fuera. En EPIC-002
no: **los marcadores en vivo de los agregadores suelen venir de endpoints
`/ajax…`**, que es exactamente lo que un adaptador querría mirar, exactamente lo
que besoccer prohíbe y exactamente lo que nuestro parser deja pasar. Un adaptador
de esta épica que los use **incumpliría RN-11 sin que ningún test se pusiera
rojo**.

El ledger de SPEC-002 lo ruta a esta spec con nombre y apellidos: *«Destino:
`sdd-arquitecto`, como CA de la primera spec de adaptador de EPIC-002»*. Es
**CA-1**.

### Y una segunda mitad del mismo daño: la cortesía no tiene dueño

Las tres obligaciones de RN-11 están implementadas **una sola vez**, dentro del
instrumento de medición de EPIC-001. Si `src/ingest/` se escribe la suya, el
proyecto pasa a tener **dos** implementaciones de una regla dura cuyo modo de
fallo es una petición que sale, se sirve y no vuelve. F-SPEC-002-23 es la prueba
documentada de que un defecto así vive semanas sin que nada se ponga rojo.
**ADR-014** decide dónde vive la cortesía y que es una sola; esta spec lo
ejecuta.

## Usuarios / roles afectados

- **`sdd-implementador`**: construye `src/polite/` y `src/ingest/`, y —desde la
  enmienda del 2026-09-01— `migrations/0002` y la implementación durable del
  ritmo. La rama tiene que nombrar `SPEC-008`, o el hook `require-spec` deniega la
  escritura sobre `src/` y `tests/` (`.sdd.json`, `rutasVigiladas`).
- **`sdd-verificador`**: juzga contra estos CA. **CA-12** y las mitades estáticas
  de **CA-2** (CA-2.3..CA-2.6) y de **CA-14.8** son **tests de arquitectura**, no
  de comportamiento; **CA-2.1 y CA-2.2** son contención en ejecución, y se
  verifican conduciendo los puntos de entrada con trampas, no buscando texto. Y
  hay que correr **dos** suites: `npm test` y `npm run test:db` (CA-14).
- **El operador del spike** (el autor, RN-01): calibra los selectores de
  `ceroacero.es` mirando el HTML **ya archivado**, y es quien sufre si el
  adaptador miente.
- **`sdd-arquitecto`**, como autor de las specs siguientes de EPIC-002: hereda de
  aquí el puerto del adaptador, el registro de fuentes y el puerto de resolución
  de identidad. Si esta spec los deja mal, el motor los arrastra.
- **`sdd-legal-datos`**, **consultivo con una pregunta concreta y sin contestar**
  (ver *Notas para el gate humano* §7): ADR-008 §5.2 llama «medición, no
  producción» a una ventana acotada de una hora, y esta spec construye la
  máquina de un sondeo que corre **una jornada entera**. No es la misma cosa y
  nadie la ha dictaminado.
- **`sdd-competicion`**, consultivo: los nombres que escribe la fuente no son los
  canónicos de la RFGF, y qué es canónico lo dicta ella (`dominio.md`).

## Diseño

### §1. Qué hace y qué no hace un adaptador

Un **adaptador de fuente** (`dominio.md`) hace cuatro cosas y ninguna más:

1. **Pide** la página de una competición a su fuente, por la única puerta de
   salida de `src/polite/` (RN-11, ADR-014).
2. **Archiva** la respuesta cruda en el raw store **antes de mirarla**, por
   `captureThenParse` (RN-10, D-5).
3. **Lee** las filas de la página en la forma en que la fuente las escribe.
4. **Construye** `Observation` del modelo canónico, pidiendo la identidad del
   partido a un puerto que no implementa.

Lo que **no** hace, y no es omisión sino frontera: no decide (RN-08), no
persiste, no resuelve alias (RN-09), no publica y no sabe qué hora es más allá
del reloj que le inyectan.

### §2. Por qué el adaptador es la primera spec de la épica, y no el cron

El encargo dejaba abierta la alternativa. Cuatro razones, y la primera y la
tercera bastan:

1. **F-SPEC-002-23 es un incumplimiento abierto de una regla dura**, y su
   domicilio natural es la spec que decide dónde vive la cortesía RN-11 —es
   decir, la que levanta `src/ingest/`—. El cron programa *cuándo* se pide; no
   tiene por qué ser el dueño de *cómo*.
2. **El cron necesita saber qué programa.** Programa adaptadores, uno por par
   (fuente, competición). Escribir el planificador antes que la cosa planificada
   obliga a inventarle una interfaz y luego a corregirla.
3. **La calibración contra HTML real tiene fecha de caducidad, y es cercana.**
   Las seis capturas de `ceroacero.es` del 2026-08-31 —227 y 252 KB, con 50
   apariciones de equipos reales cada una— viven en `raw/`, fuera de git, y
   **ADR-009 fija su purga el 2026-09-30**, con techo duro el 2026-11-29. Son el
   único HTML real de la fuente que el proyecto tiene y del que puede disponer.
   El calendario, en cambio, se carga a mano y no caduca.
4. **El adaptador concentra los desconocidos.** Nadie ha parseado nunca una
   página de `ceroacero.es`. El calendario es un fichero escrito a mano. Ante dos
   trabajos con la misma dependencia mutua débil, va primero el que puede
   sorprender.

**La dependencia con el calendario existe y se resuelve con un puerto, no con un
orden.** Una `Observation` necesita `match_id`, y los partidos los carga la spec
del calendario. El adaptador pide esa resolución a `MatchResolver`, un puerto que
esta spec **define y no implementa**: aquí lo satisface un doble en los tests, y
lo implementa de verdad la spec del calendario y la del catálogo de alias. Eso es
lo que hace que el orden entre las dos no sea una apuesta.

### §3. Una fuente es configuración, no estructura

La épica y el roadmap lo fijan y esta spec no puede contradecirlo: *«si mañana
llega el sí, futgal entra como un adaptador más y un peso en la configuración; no
se rehace el motor»*.

Traducido a la forma del código: existe un **registro de fuentes** con una
entrada por fuente —`SourceId`, peso de RN-01, y la URL de cada competición— y el
adaptador **lee su peso de ahí**, no de una constante propia. Añadir `futgal`
(1.0) o una tercera candidata es añadir una entrada y su función de extracción.
Lo prueba CA-11 añadiendo una fuente de juguete.

**Los pesos de RN-01 viven en un solo sitio.** Hoy están repartidos entre la
regla y la cabeza de quien la lee; a partir de esta spec, la tabla de RN-01 tiene
una representación ejecutable y única, y `confidence` de una `Observation` sale
de ella.

La entrada de `ceroacero` **no hay que inventarla**: sus URL y sus
`competition_id` están verificados y en uso en `ventanas/jornada-1/config.json`,
que es con lo que se capturó el archivo del 2026-08-31.

| `competition_id` | URL |
|---|---|
| `futgal-preferente-g1` | `https://www.ceroacero.es/edicion/galicia-preferente-autonomica-grupo-1-26-27/222309` |
| `rfef-tercera-g1` | `https://www.ceroacero.es/edicion/tercera-division-grupo-1-galicia-2026-27/220459` |

Son las mismas dos claves con las que están archivadas las seis capturas que
CA-8 manda mirar, y **el `robots.txt` de `ceroacero.es` prohíbe una sola ruta**,
`/zzmap_v3.php`, que no es ninguna de estas dos (verificado el 2026-08-31,
`dominio.md`).

### §4. El ritmo de RN-11 se cumple dentro, no fuera — y sobrevive al proceso

> *Enmendado el 2026-09-01, arbitrado por Alberto Fojo. El texto original y el
> motivo del cambio están en el ledger: «Arbitraje del gate humano — 2026-09-01»
> §2 y «Enmienda — 2026-09-01: el estado durable del limitador de RN-11 entra en
> SPEC-008 (F-SPEC-008-V13)».*

RN-11 dice **1 petición/minuto por competición**. El limitador vive **dentro** del
camino del adaptador, como ya vive dentro del `Capturer` y por el mismo motivo
escrito allí: un cron que dispare cada diez segundos, un bucle local supervisado
y un test con reloj falso tienen que ser **igual de incapaces** de excederlo.

**Dentro de un proceso, eso no basta.** ADR-004 dice que en Vercel **no hay
proceso vivo**: cada tick del cron es una instancia nueva, así que un limitador
que sea un campo de instancia nace sin memoria en cada arranque en frío, y diez
ticks en el mismo minuto mandan diez peticiones. Está **medido**, no supuesto
(F-SPEC-008-V13). El techo de Vercel Cron (1/min) tapa el camino nominal por
accidente de tarificación y no por diseño, y no tapa una invocación manual, un
reintento, un despliegue solapado ni una segunda ruta que capture.

Por eso el **último instante de petición por par (fuente, competición) es estado
durable**, y la concesión del turno es **un solo paso atómico**: conceder y
sellar a la vez, nunca consultar y luego sellar —entre los dos pasos cabe otra
instancia—. Es **CA-14**, y el mecanismo está decidido: una tabla en
`migrations/0002` y una sentencia `insert … on conflict … where … returning …`
que devuelve fila cuando concede y ninguna cuando niega. El motivo de elegir eso
y no el raw store como índice está en el ledger; el resumen es que el archivo
registra lo que **volvió** y RN-11 cuenta lo que **salió**.

**El instrumento de `src/mirror/` se queda con el limitador en memoria**, y no es
una excepción tolerada: corre en un solo proceso, durante una hora, con el
operador delante (F-SPEC-002-2, y es el mismo argumento con el que ADR-014 §3
justificó el `RobotsGate`). La frontera es exacta: **lo que se despliega usa el
durable; lo que un operador supervisa a mano, no.**

Y esto no es higiene interna. Lo que `/robot` publica en galego y en castellano
—*«Como máximo unha petición por minuto a cada sitio e por cada competición. As
peticións non gastadas non se acumulan»*— es una afirmación a terceros cuyo
propósito entero es que nos auditen (SPEC-005, ADR-011). **Producción tiene que
poder cumplirla, no solo los tests.**

Consecuencias que el cron heredará y conviene decir aquí: **un tick suprimido no
es un tick fallido** —no produce petición y no cuenta como cobertura perdida—, y
**un turno concedido cuya petición falla se ha gastado**, porque RN-11 cuenta
peticiones que salen y no respuestas que vuelven.

### §5. El archivo es la memoria, y el replay es lo que lo paga

RN-10 obliga a archivar antes de parsear, y ese coste solo se recupera si el
archivo puede **volver a ejecutarse**. Por eso el adaptador se parte en dos
funciones que no se llaman entre sí:

- `capture(...)` — pide, archiva, y devuelve el `RawRef` y los bytes.
- `read(bytes, rawRef, at)` — no toca la red ni el reloj, y de bytes archivados
  produce `Observation`.

Con esa costura, reprocesar una jornada entera con un parser corregido es correr
`read` sobre el archivo, y **los tests de replay del motor** (spec siguiente)
tienen de dónde salir. CA-10 exige que ese replay sea **determinista**: los
mismos bytes y el mismo resolver producen las mismas `Observation`, `id`
incluido. Un `id` aleatorio convertiría cada replay en datos nuevos y RN-13
—las `Observation` son inmutables— en una promesa sin filo.

### §6. Lo que la fuente escribe no es lo que publicamos

`ceroacero.es` escribe los nombres de los equipos a su manera; los canónicos son
los de la RFGF (`dominio.md`, D-2). El adaptador **no traduce, no adivina y no
normaliza a canónico**: entrega el texto tal cual como parte de la identidad de
la fila y deja que `MatchResolver` decida. Si el resolver no resuelve, **no hay
`Observation`** y la fila se reporta con su texto íntegro para que una persona la
mire. Es RN-09 leída en su versión fuerte: *nunca se publica un resultado sobre
un equipo sin alias confirmado por una persona*.

## Criterios de aceptación

- **CA-1 — El comodín `*` y el ancla `$` de `robots.txt` (F-SPEC-002-23).**
  Dado un `robots.txt` **sintético** con un grupo `User-agent: *` que contiene
  `Allow: /`, `Disallow: /scripts*` y `Disallow: /ajax*`,
  cuando se pregunta por `https://www.besoccer.es/ajax/algo` y por
  `https://www.besoccer.es/scripts/x.js`,
  entonces `isAllowed` devuelve **`false`** para las dos, y devuelve `true` para
  `https://www.besoccer.es/competicion/resultados/galicia/2027/grupo1`.
  Y además, en el mismo criterio:
  1. `Disallow: /*.pdf$` prohíbe `/a/b.pdf` y **permite** `/a/b.pdf?x=1`, porque
     `$` ancla el final de la ruta.
  2. `Disallow: /a*b` prohíbe `/a/x/b` y permite `/a/x`.
  3. El desempate entre un `Allow` y un `Disallow` que casan se hace por
     **longitud del patrón**, y a igual longitud **gana el `Allow`** (RFC 9309).
  4. **No se rompe nada de lo que ya funcionaba**, y hay un caso por cada cosa:
     el acumulado de varios grupos `User-agent: *`; `Disallow:` con valor vacío
     significando «nada prohibido»; el grupo específico ganando al `*`; un
     origen sin política cargada quedando **denegado**; y
     `Disallow: /edicion/` + `Allow: /edicion/publica/` significando lo que su
     autor quiso.

- **CA-2 — Una sola puerta de salida, y se demuestra enumerando lo permitido
  (ADR-014 §1 y §4; ADR-016 es la regla general y éste su primer caso).**

  > *Sustituye, el 2026-09-01, al CA-2 que Alberto Fojo firmó esa misma mañana.
  > El texto anterior, el motivo del cambio y **la pérdida que se firmó con él**
  > están en el ledger: «Arbitraje del gate humano — 2026-09-01» §1 y
  > «Enmienda — 2026-09-01: CA-2 pasa de detección textual a contención de
  > capacidad».*
  >
  > *Y **CA-2.1 y CA-2.3 se volvieron a escribir ese mismo día**, tras la tercera
  > verificación: la octava evasión mandó un paquete de verdad entrando por
  > `ALLOWED_PACKAGES`, y la contención en ejecución no la vio. Los dos textos
  > anteriores y las mediciones están en «Enmienda — 2026-09-01: CA-2 cierra por
  > la superficie que se importa, y la trampa baja al socket». **CA-2.2 y
  > CA-2.4..CA-2.8 no se tocan.***
  >
  > *Y tras la **cuarta** verificación, **CA-2.3 se reescribió por tercera vez y
  > CA-2.6 se amplió**: el grano de la concesión estaba bien y el lector no —un
  > `import` que no empezaba la línea no se veía **y no fallaba cerrado**—, y la
  > lista de ficheros del escaneo heredaba las exclusiones de `.gitignore`. Los
  > textos anteriores y las mediciones están en «Enmienda — 2026-09-01: el cierre
  > estático lo lee el compilador, y la lista de ficheros deja de heredarse de
  > `.gitignore`» (F-SPEC-008-V27 y F-SPEC-008-V28). **CA-2.1, CA-2.2, CA-2.4,
  > CA-2.5, CA-2.7 y CA-2.8 no se tocan**, y el grano de la concesión —superficie
  > y no paquete, literalidad, motivo escrito— tampoco.*
  >
  > *Y tras la **quinta** verificación, **este criterio deja de perseguirse
  > entero en esta spec**. **CA-2 queda ⚠️, nunca ✅**, con su residuo escrito
  > dentro de sí mismo (ADR-016 §6). Lo único que se cierra aquí es
  > **F-SPEC-008-V33** —la lista de extensiones que el escaneo lee, en CA-2.6—,
  > porque es una línea y llega a producción. **F-SPEC-008-V34** (el conjunto de
  > CA-2.4, medido abierto, y su lista negra de nueve nombres) y
  > **F-SPEC-008-V35** (la cobertura fuera de las raíces) quedan escritos como
  > residuo y **se mudan a SPEC-009**, cuya materia es la frontera de capacidad
  > por derecho propio. Motivo, medición y qué lo despierta: ledger, «Enmienda —
  > 2026-09-01: CA-2 se queda ⚠️ con su residuo escrito, y la frontera de
  > capacidad sale a SPEC-009». **CA-2.1, CA-2.2, CA-2.7 y CA-2.8 no se tocan**,
  > y el grano de la concesión —superficie y no paquete, literalidad, motivo
  > escrito, un solo lector— tampoco. De **CA-2.3 y CA-2.5** cambia una sola
  > cosa, y es la misma en las dos: **sobre qué ficheros corren**, que pasa a ser
  > la declaración de CA-2.6 en vez de un `.ts`/`.tsx` escrito dentro de cada
  > criterio. F-SPEC-008-V33 estaba rutada a los dos.*

  *El criterio deja de buscar lo prohibido: **enumera lo permitido y exige que el
  resto sea vacío**. Las tres listas que lo sostienen no son listas de formas de
  escribir una llamada —ésas crecen con la imaginación de quien las rodea—, sino
  listas cerradas por algo que no fijamos nosotros: la superficie de salida de la
  plataforma, las dependencias que ya tenemos, y las maneras que ECMAScript da de
  obtener una capacidad.*

  **CA-2.1 — Contención en ejecución: la trampa va sobre el socket, y la única
  salida que se dispara es la de `src/polite/http.ts`.**

  > *Sustituye, el 2026-09-01, al CA-2.1 que Alberto Fojo firmó esa misma mañana.
  > El texto anterior, **la medición que lo desmiente** y lo que el mecanismo
  > nuevo sigue sin alcanzar están en el ledger: «Enmienda — 2026-09-01: CA-2
  > cierra por la superficie que se importa, y la trampa baja al socket» §2 y §3.
  > El texto viejo afirmaba que se sustituyen por trampas **todas** las salidas de
  > red de la plataforma. **Es falso, y está medido**: la evasión salió por el
  > camino que ese CA conduce y la trampa registró **cero disparos**.*

  Dado un test que, **antes de importar ningún módulo de `src/`**, instala una
  trampa sobre **el punto por el que pasa toda salida de socket del proceso** —el
  que ve la conexión cualquiera que sea el módulo que la abre, y **también cuando
  la abre una dependencia de `node_modules`**, que no pasa por el registro de
  módulos que el runner sustituye—,
  cuando se conducen los puntos de entrada declarados de `src/ingest/` y las CLI
  de `src/mirror/` **con el `globalFetcher` real**,
  entonces toda trampa que se dispara se atribuye, por su pila, a
  `src/polite/http.ts`, y el número de disparos coincide con el de llamadas a
  `politeFetch`;
  y cuando se conducen los mismos puntos de entrada **con un `HttpFetcher`
  doble**, **no se dispara ninguna trampa**.

  **La trampa no se da por buena porque exista: se mide, y los dos controles son
  parte del criterio.**
  1. **Que ve a una dependencia.** Una salida abierta por una dependencia de
     `node_modules` —la forma medida es `cheerio.fromURL` contra un **servidor
     local propio**, nunca contra un tercero (RN-11)— **dispara la trampa**. Con
     el mecanismo anterior salía el paquete y la trampa disparaba **cero** veces:
     este caso es la reproducción exacta de F-SPEC-008-V15.
  2. **Que puede negar, no solo contar.** Una trampa que rechaza en vez de
     delegar deja el paquete **sin llegar al servidor local**. La que cuenta y no
     puede impedir demuestra observación, no contención.

  **El orden de instalación es uno de los mecanismos de este criterio, y cuenta
  como tal a efectos de CA-2.7.** La trampa se instala antes de cualquier
  `import` de `src/` porque una segunda puerta puede capturar la referencia en el
  ámbito del módulo, que es exactamente la forma de F-SPEC-008-V6. **Un caso
  propio tiene que ponerse rojo si la instalación se mueve después del primer
  `import` de `src/`**, sin ninguna otra mutación que lo acompañe (F-SPEC-008-V17:
  hoy moverla sola deja los trece casos en verde).

  Quedan fuera de la atribución las salidas que abren `@vercel/blob` y
  `postgres`: son nuestra propia infraestructura y no un tercero, están
  declaradas en CA-2.3, y RN-11 habla de la fuente, no del almacén.

  *(Medido el 2026-09-01 sobre Node 26, y va aquí para que nadie lo redescubra:
  el punto que cumple la propiedad es `net.Socket.prototype.connect` —lo
  atraviesan `cheerio.fromURL` por `undici`, `globalThis.fetch`, `node:http` y un
  `net.Socket` a pelo, y también el TLS, porque `TLSSocket` no tiene `connect`
  propio—. Una trampa puesta **solo** sobre `net.connect` **no ve `node:http`**,
  que captura su fábrica de conexión al cargarse. El criterio exige la
  **propiedad**, no el símbolo: si la plataforma mueve el punto, se mueve el punto
  y no el criterio.)*

  **Lo que esta contención NO alcanza, dicho aquí y no en un follow-up
  (ADR-016 §6). No sustituye al residuo de CA-2.8: se suma a él.**
  - **Solo ve lo que se ejecuta.** Código alcanzable desde `ENTRY_POINTS` cuya
    rama de red no ejerza ningún caso no dispara nada. Es cuestión de cobertura,
    no de detección, y no es de esta spec.
  - **Solo ve lo que sale por un socket.** UDP (`node:dgram`), un subproceso que
    pida por su cuenta (`node:child_process`) o un binario nativo no pasan por
    ahí. Su único cierre es el **estático**: no son entradas de CA-2.3 y CA-2.4
    cierra `require`. El día que alguno entre como dependencia real, este criterio
    deja de cubrirlo y hay que ensancharlo **con la medida delante**, no con un
    nombre en una lista.
  - **Demuestra qué puede salir desde este repositorio, no qué hace la plataforma
    en producción.** La trampa vive en el proceso del test.

  **CA-2.2 — Ninguna petición sale sin que la política real haya dicho que sí.**
  Bajo la misma trampa, con el `RobotsPolicy` de `src/polite/robots.ts`
  instrumentado,
  entonces el conjunto de URL que llegaron a una trampa está **contenido** en el
  de las URL sobre las que la política real fue consultada y contestó `true`,
  con una sola excepción nombrada: el `robots.txt` de un origen, que es la única
  petición que ninguna política puede gatear (ADR-014 §3.1).
  El test se pone rojo si sale una petición cuyo permiso lo concedió otro código.

  **CA-2.3 — Cierre de imports: no se concede un paquete, se concede una
  superficie; y quien lee el código es el compilador.**

  > *Reescrito el 2026-09-01, por tercera vez en el mismo día. Los dos textos
  > anteriores se conservan íntegros en el ledger con su motivo: el del arbitraje
  > «la treceava entrada de `ALLOWED_PACKAGES`», en «Enmienda — 2026-09-01: CA-2
  > cierra por la superficie que se importa, y la trampa baja al socket» §1; y el
  > que éste sustituye, en «Enmienda — 2026-09-01: el cierre estático lo lee el
  > compilador, y la lista de ficheros deja de heredarse de `.gitignore`» §1.*
  >
  > *La primera reescritura pasó de conceder **paquetes** a conceder
  > **superficies**, porque `cheerio` estaba en la lista y **es un cliente HTTP**
  > —desde la 1.0 exporta `fromURL`—: once líneas en `src/ingest/preflight.ts`
  > mandaron una petición real **sin User-Agent, sin `robots.txt` y sin turno**,
  > con la suite en 748/748 (F-SPEC-008-V15). **Ese grano no se toca aquí y sale
  > reforzado.** Lo que cambia en esta tercera es **con qué se lee**: el texto
  > anterior se apoyaba en un lector de expresiones regulares que anclaba sus
  > patrones a principio de sentencia, y por ahí entró la novena evasión —`const
  > noop = 0; import { execFileSync } from 'node:child_process';` en
  > `src/db/preflight9.ts`, `lint exit=0` y **762/762 en verde**, con
  > `node:child_process` **entero fuera de la lista** y una petición de verdad
  > saliendo sin User-Agent, sin `robots.txt` y sin turno—. **Doce caracteres
  > separaban verde de rojo**, y el lector no falló cerrado: **calló**
  > (F-SPEC-008-V27).*

  Dado todo fichero de código bajo las raíces declaradas en CA-2.6 —**las
  extensiones son las que CA-2.6 declara, y no otra lista escrita aquí**
  (F-SPEC-008-V33)—,
  entonces cada especificador de módulo —estático, de efecto lateral o
  dinámico— es (i) una ruta relativa o `@/…` que resuelve dentro del
  repositorio, o (ii) una **cadena literal que es una entrada declarada de la
  lista de lo permitido**;
  y **cada nombre que cruza esa frontera está en la superficie que esa entrada
  declara**: el de un `import` con nombre —el nombre original, no su alias—, el
  `default`, y **cada miembro que se lee de un espacio de nombres**
  (`import * as ns` obliga a que todo `ns.x` esté declarado). **Lo que no está,
  es rojo, y no hace falta que nadie sepa que existe.**

  **Y los especificadores y las cláusulas salen del árbol sintáctico que produce
  el compilador de TypeScript —el mismo que compila este proyecto—, no de un
  patrón de texto.** Es lo único que cambia respecto al texto anterior, y es lo
  que hace cierto el «cada» de arriba: **quien lee el diff tiene que leer lo
  mismo que el compilador**. Tres obligaciones sobre el lector, y las tres son
  comprobables:

  1. **Un solo lector, y lo usa todo el criterio.** No hay una segunda manera de
     averiguar qué importa un fichero. Lo usan el cierre de CA-2.3, el recorrido
     del grafo de CA-2.5 y **el control del orden de instalación de CA-2.1**, que
     hoy lee su propio fichero con una expresión regular anclada igual y hereda
     el mismo defecto (F-SPEC-008-V27, segunda mitad). Un caso que necesite saber
     qué importa un fichero y se escriba su propio patrón es el mecanismo
     volviendo por la puerta de atrás.
  2. **Nada se pierde en silencio, y esto se comprueba contra el compilador y no
     contra nosotros.** Para cada fichero, la enumeración del lector **cubre la
     lista de módulos que el propio compilador registra para ese fichero**: si el
     compilador nombra un módulo que el lector no enumeró, el fichero es
     **rojo**. Y son rojo, nombrando el fichero: un fichero que el compilador no
     puede parsear, y un nodo que nombra un módulo en una forma que el lector no
     sabe clasificar. **«Falla cerrado» deja de ser una afirmación y pasa a ser
     un caso**: el mecanismo anterior lo prometía y la medición lo desmintió.
  3. **La posición en la línea no cambia el veredicto.** Control positivo propio,
     escrito como la reproducción de F-SPEC-008-V27: el mismo `import` de un
     paquete que no es entrada de la lista es **rojo** escrito al principio de la
     línea, escrito detrás de otra sentencia en la misma línea, y como segundo
     `import` de una línea que ya tiene otro. Si algún día los tres no dan lo
     mismo, el lector volvió a ser un lector de texto.

  Siguen siendo **rojo por construcción**, también dentro de `src/polite/`:
  - un **especificador que no sea un literal estático** —`import(MOD)`,
    `import('node:' + 'https')`—;
  - un **acceso computado** sobre el espacio de nombres de una entrada
    —`ns['from' + 'URL']`—, por el mismo motivo y con la misma forma;
  - un **`import()` dinámico de una entrada de paquete**, que entrega el espacio
    de nombres entero y no se puede cerrar en el sitio del `import`;
  - un **`import` de efecto lateral sobre una entrada de paquete**, que no
    importa ningún nombre y por tanto no puede satisfacer este cierre.

  Los dos últimos dejan de serlo el día que una entrada declare esa forma con su
  motivo escrito, que es un diff y no un arbitraje. **`import type` no cuenta**:
  `verbatimModuleSyntax` lo borra entero, no cruza ninguna capacidad, y exigirle
  superficie sería peaje. Una entrada con superficie **vacía** —hoy `next` y
  `react`— es exactamente eso: un paquete del que este repositorio no toma
  ninguna capacidad.

  Lo que este criterio le exige a la lista son tres cosas, y ninguna es un
  contenido concreto:
  1. **Que exista, como identificador exportado de un solo fichero que se llama
     como lo que declara**, y que sea **cerrada en cada momento en sus dos ejes**:
     qué entradas hay, y qué nombres concede cada una. Lo que no está es rojo,
     hoy y con el tamaño que tenga. Un especificador no literal es rojo aunque el
     paquete al que apunte sí esté.
  2. **Que la concesión sea del grano de la capacidad.** Ésta sustituye a la
     obligación vieja —«que ninguna entrada sea una puerta de salida»— y la
     sustituye por lo que le pasó: se mecanizó con **una lista de trece nombres
     prohibidos**, y `cheerio` entró porque nadie sabía que lo era. Había quedado
     **una lista negra viva dentro del criterio que vino a sustituirlas**. Con la
     concesión por superficie **la pregunta desaparece**: nadie tiene que decidir
     si un paquete es una puerta, porque el paquete no se concede. `fromURL` es
     rojo sin que nadie lo nombre, y lo mismo le pasará al siguiente. **No se
     añade ningún nombre a ninguna lista negra: se borra la lista negra.**
  3. **Que toda entrada nueva —y todo nombre nuevo dentro de una superficie—
     llegue con su motivo escrito junto a la lista**, en el mismo diff que lo
     añade.

  **Que la lista crezca no es un defecto ni un arbitraje: es lo natural**
  (Alberto Fojo, 2026-09-01), **y eso vale igual para los nombres de una
  superficie**. Cada uno es *una línea en un fichero que se llama así, en un diff
  que un revisor lee*, y no una forma nueva de escribir una llamada que nadie ve.
  Por eso **añadir una entrada o un nombre no vuelve a subir al gate humano**, y
  una lista más larga que la de ayer no es una desviación que haya que declarar
  ni un criterio incumplido.
  **Lo que sí sigue siendo un cambio de criterio, y sí exige firma humana:**
  quitar la exigencia de literalidad —de especificadores o de accesos—, quitar la
  de que lo nuevo llegue con su motivo, **conceder un espacio de nombres entero
  en vez de una superficie**, o **declarar en una superficie un nombre cuyo
  trabajo es pedirle bytes a un tercero**. Eso último es todo lo que queda de la
  obligación vieja, y es lo único que sigue pidiendo una firma.

  **El lector se paga con una entrada de la lista, y va dicho aquí porque es la
  primera de su especie.** `typescript` es ya una dependencia declarada del
  proyecto —es lo que compila esto— y a partir de este criterio es también la
  herramienta con la que se lee: entra en la lista **con su motivo escrito**,
  como cualquier otra, y con la superficie que el lector toma y ni un nombre
  más. Es la primera entrada cuyo único importador vive en `tests/`, que está
  fuera de las raíces de CA-2.6; se declara igual, porque una lista de
  dependencias en la que no está la del propio guardián miente sobre lo que este
  repositorio usa. **Ningún nombre de esa superficie le pide bytes a un
  tercero**, que es lo único que habría exigido una firma.

  **Lo que este cierre NO promete** (ADR-016 §6). Son cinco cosas, y las tres
  primeras no cambian:
  - Cierra **un nivel**: el que cruza la frontera del módulo. Un nombre concedido
    que sea a su vez un objeto con capacidad dentro —`z`, de `zod`, es el caso
    vivo— **no queda cerrado por dentro**, y cerrarlo un nivel más sería peaje
    sin daño medido que lo justifique.
  - Un nombre concedido que **sí** sea una puerta de salida no lo caza este
    criterio: lo caza **CA-2.1 si se ejecuta**, y si no se ejecuta, lo único que
    queda es el diff y la firma.
  - **Es sintaxis, no semántica.** El árbol dice qué nombres cruzan la frontera;
    no dice qué hacen. Y la superficie que una entrada declara es **lo que
    nosotros escribimos**, no lo que el paquete instalado exporta: declarar un
    nombre que no existe es inofensivo, pero este criterio no lo detecta.
  - **Juzga el especificador tal como está escrito, no lo que resuelve.** Un
    literal `'cheerio'` se juzga contra la entrada `cheerio` diga lo que diga el
    árbol de `node_modules`. Cerrar eso es asunto del `package-lock.json` y de
    quien instala, no de un test de arquitectura.
  - **El compilador solo lee lo que este criterio le da a leer, que son los
    `import`.** Las otras tres maneras de alcanzar una capacidad las cierra
    CA-2.4, **y ésas se siguen leyendo como texto**: un identificador escrito con
    escapes Unicode —`globalThi\u0073`— es el mismo identificador para el
    compilador y no para un patrón. Queda escrito aquí, y no como *follow-up*,
    porque es el mismo defecto un criterio más allá; lo estrecha CA-2.1 cuando el
    código se ejecuta, y cerrarlo del todo es barato **el día que alguien lo
    necesite**, porque el árbol ya está ahí.

  *Fotografía del día en que se escribió —orienta, no manda—*: catorce entradas
  —trece, más `typescript`, que entra con este texto— y
  su superficie tal como el árbol la alcanza hoy — `node:crypto` (`createHash`),
  `node:fs` (`existsSync`), `node:fs/promises`
  (`mkdir`, `readFile`, `readdir`, `writeFile`), `node:module` (`registerHooks`),
  `node:path` (`dirname`, `join`, `relative`, `resolve`, `sep`), `node:url`
  (`fileURLToPath`, `pathToFileURL`), `@vercel/blob` (`get`, `list`, `put`),
  **`cheerio` (`load`, y nada más: `fromURL` queda fuera y ésa es la evasión
  cerrada)**, `next` (vacía), `postgres` (`default`), `react` (vacía),
  **`typescript`** (lo que el lector toma del API del compilador y nada más),
  `vitest/config` (`defineConfig`) y `zod` (`z`). Tres entradas llevan su motivo
  escrito porque no se explican solas: **`typescript`**, porque es el lector de
  CA-2.3 y porque su único importador vive en `tests/`; **`node:module`**, porque
  `src/mirror/cli/node-resolve.ts` registra un hook de resolución para poder
  ejecutar las CLI en TypeScript —es la única capacidad de resolución de módulos
  fuera de `src/polite/`, y va nombrada, no tolerada en silencio—; y
  **`vitest/config`**, porque CA-2.6 obliga a escanear `vitest.config.ts` y
  `vitest.integration.config.ts`, que son código ejecutable versionado fuera de
  `tests/`.

  **Y una consecuencia que conviene ver, porque es la mitad barata del arreglo:**
  este cierre corre sobre **todas** las raíces de CA-2.6, no sobre los tres
  directorios de `CONTAINED_DIRS`. Por eso cierra también la **variante huérfana**
  de la octava evasión —la que vivía en `src/db/` y no veían ni CA-2.5 ni
  CA-2.1—, que es donde caen 66 de los 86 `.ts`/`.tsx` de `src/`.

  **CA-2.4 — La capacidad global no se toma prestada fuera de `src/polite/`.**
  Fuera de `src/polite/` no aparece el identificador `globalThis`, ni un uso
  desnudo de los globales de red de la plataforma (`fetch`, `XMLHttpRequest`,
  `WebSocket`, `EventSource`, `navigator`), ni `eval`, ni `new Function`, ni
  `require`.
  Sin un `import`, ECMAScript da exactamente tres maneras de alcanzar una
  capacidad: el objeto global, un identificador global desnudo, y `eval`/`Function`.
  CA-2.3 cierra el `import`; ésta cierra las otras tres. Es un conjunto cerrado
  por el lenguaje, no por nosotros.
  **Se cumple hoy sin tocar una línea**: `globalThis` aparece una sola vez en
  todo `src/`, dentro de `globalFetcher`.

  **Lo que este criterio NO promete, y está medido** (ADR-016 §6). *Añadido el
  2026-09-01 tras la quinta verificación. El texto de arriba **no se borra**,
  porque es lo que se firmó; lo que sigue dice en qué es falso, que es lo que
  ADR-015 §3.3 pide y lo que ADR-016 §6 obliga a escribir dentro del propio
  criterio.*

  1. **El conjunto no está cerrado por el lenguaje: está cerrado por nueve
     nombres.** `process` es un global del **anfitrión**, no de ECMAScript, y
     desde Node 22 `process.getBuiltinModule(id)` es API **estable** que devuelve
     cualquier módulo interno **sin ningún `import`**. Medido: un `.ts` corriente
     bajo una raíz, escaneado y alcanzable desde `ENTRY_POINTS`, con
     `const cp = process.getBuiltinModule('node:child_process');` deja
     `lint exit=0`, `npm test` **772/772** y `tests/polite` **86/86**, y manda una
     petición real —contra un servidor local propio— **sin `User-Agent`, sin
     `robots.txt` y sin turno** (F-SPEC-008-V34). CA-2.3 no la ve porque no hay
     `import` que juzgar, y CA-2.1 tampoco, porque `node:child_process` no pasa
     por `net.Socket.prototype.connect`.
  2. **El mecanismo es una lista negra viviendo dentro del criterio.**
     `CAPABILITY_NAMES` son nueve nombres prohibidos, que es exactamente lo que
     **ADR-016 §3.5 —aprobado el 2026-09-01 e inmutable— prohíbe**: una lista de
     lo permitido no puede esconder una lista de lo prohibido en su condición de
     admisión. Es el mismo defecto que CA-2.3 borró de `ALLOWED_PACKAGES`, un
     criterio más allá y donde nadie miró.
  3. **Y no se tapa añadiendo `process` a la lista.** Lo dice el propio CA-2.3
     con esas palabras: *«no se añade ningún nombre a ninguna lista negra: se
     borra la lista negra»*. Un nombre más taparía este caso y dejaría abierto el
     siguiente.

  **Por eso CA-2 queda ⚠️ y nunca ✅**, y cerrar esta mitad —enumerar los
  identificadores globales **permitidos**, con superficie y motivo, como
  `ALLOWED_PACKAGES`— es materia de **SPEC-009** y de una firma humana, no de un
  parche aquí. **Qué lo despierta**: el día que se firme el criterio de SPEC-009,
  o —antes— el día que algo de `src/` se despliegue y pida a un tercero, porque
  entonces esta infracción deja de ser latente.

  **CA-2.5 — Nada huérfano en los tres destinos que el CA nombra.**
  Todo fichero de código —con las extensiones que CA-2.6 declara— bajo
  `src/ingest/`, `src/polite/` y `src/site/` es
  alcanzable, por el grafo de `import`, desde `ENTRY_POINTS` —la lista declarada
  de puntos de entrada del repositorio: `next.config.ts`, las rutas de
  `src/app/`, las CLI, y el API público de `src/ingest/`—.
  Un fichero que nadie importa es **rojo**: para dejar de serlo hay que
  importarlo —y entonces le aplican CA-2.3 y CA-2.4 y lo alcanza CA-2.1— o hay
  que añadirlo a `ENTRY_POINTS`, que es un diff visible en un fichero que se
  llama así.
  `reachableModules` de `tests/mirror/support/imports.ts` implementa el
  recorrido y **hay que ensancharlo primero**: hoy solo lee
  `import`/`export … from '…'`, así que no ve ni los `import` de efecto lateral
  —`src/app/(gl)/layout.tsx` usa uno— ni los `import()` dinámicos —las tres
  `src/mirror/cli/*-cli.ts` usan uno—. Mientras no los vea, el cierre no es un
  cierre. El ensanche es parte de este CA y no toca `src/`.

  **CA-2.6 — El escaneo cubre todo el código del repositorio, no solo `src/`; su
  lista de ficheros no la decide `git`, y qué extensiones considera código va
  declarado.**

  > *Ampliado el 2026-09-01. Lo anterior no se afloja: se le añade de dónde sale
  > la lista de ficheros. Motivo y medición en el ledger: «Enmienda —
  > 2026-09-01: el cierre estático lo lee el compilador, y la lista de ficheros
  > deja de heredarse de `.gitignore`» §1 y §2 (F-SPEC-008-V28).*
  >
  > *Ampliado por segunda vez el 2026-09-01, tras la quinta verificación. Otra
  > vez no se afloja nada: se le añade **qué extensiones se leen**, que era la
  > tercera lista escrita dentro de una función en vez de declarada. Motivo y
  > medición en el ledger: «Enmienda — 2026-09-01: CA-2 se queda ⚠️ con su
  > residuo escrito, y la frontera de capacidad sale a SPEC-009» §3
  > (F-SPEC-008-V33). **Es lo único que esa enmienda manda arreglar dentro de
  > esta spec.***

  Las raíces del escaneo van declaradas, y un caso exige que **todo fichero de
  código versionado fuera de `tests/` caiga bajo una de ellas**.
  No es hipotético: **`next.config.ts` es código ejecutable que hoy queda entero
  fuera del escaneo**, y `src/site/redirects.ts` solo es alcanzable desde ahí.
  ADR-014 §4 dice «en un script»; hoy no hay `scripts/`, pero sí hay
  configuración ejecutable en la raíz.

  Y además, porque una frontera que audita ficheros la decide su lista de
  ficheros:

  1. **La lista de lo que se lee sale del árbol de ficheros bajo las raíces
     declaradas, no de una herramienta que excluye por otros motivos.** Hoy sale
     de `git ls-files --exclude-standard`, así que **hereda `.gitignore`**, y
     `.gitignore:17` esconde `**/robots/*` —por una razón legítima y que no se
     toca: los `robots.txt` de terceros que ADR-009 §3 mantiene fuera del
     repositorio—. Medido: un `src/ingest/robots/side.ts` con un
     `cheerio.fromURL` sin restricción deja `tests/polite` en **76/76**
     (F-SPEC-008-V28). Ninguna regla que exista para otra cosa puede decidir qué
     código se audita.
  2. **Las exclusiones del escaneo son suyas, van declaradas en el mismo fichero
     que las raíces y cada una lleva su motivo**, como las entradas de CA-2.3.
     Hoy la única que se justifica sola es `node_modules/`, que no es código
     nuestro.
  3. **Control positivo, y es la reproducción exacta de F-SPEC-008-V28**: un
     fichero bajo una raíz del escaneo, dentro de un directorio que `.gitignore`
     esconde, **se lee y se juzga** como cualquier otro. El caso se pone rojo el
     día que la lista vuelva a derivarse de las exclusiones de git.
  4. **Lo que `git` sigue decidiendo, porque es de lo que es autoridad**: qué
     está versionado. El caso de cobertura —«todo fichero de código versionado
     fuera de `tests/` cae bajo una raíz»— puede seguir preguntándoselo. Lo que
     no puede es decidir **qué se lee**: la cobertura y la lectura son dos listas
     distintas, y la segunda tiene que ser la más ancha de las dos bajo las
     raíces.

  Y una tercera cosa, porque una frontera que audita ficheros la decide también
  **qué considera un fichero de código**:

  5. **Las extensiones que el escaneo lee van declaradas junto a `SCAN_ROOTS`,
     con su motivo escrito**, exactamente como ya van las exclusiones — y **no
     escritas dentro de la función que recorre el árbol** ni dentro de un
     pathspec de `git`. Hoy son las de TypeScript que este proyecto compila y
     ejecuta: **`.ts`, `.tsx`, `.mts` y `.cts`**. La lista es cerrada en cada
     momento: una extensión nueva es un diff con motivo, como una entrada de
     `ALLOWED_PACKAGES`, y **nunca un arbitraje**.
  6. **La cobertura pregunta por la misma declaración, no por una segunda.** El
     caso del punto anterior —«todo fichero de código versionado fuera de
     `tests/` cae bajo una raíz»— deriva su pathspec **de esa misma lista**. Dos
     listas de extensiones son dos oportunidades de que una se quede corta, y es
     literalmente lo que pasó: `scannedSources()` filtraba con
     `endsWith('.ts') || endsWith('.tsx')` y `versionedSources()` le pasaba a
     `git` el pathspec `'*.ts', '*.tsx'`, **y ninguna de las dos casaba con
     `.mts`**.
  7. **Control positivo, y es la reproducción exacta de F-SPEC-008-V33**: un
     `src/ingest/door.mts` bajo una raíz del escaneo, con un `import` de un
     paquete que **no** es entrada de `ALLOWED_PACKAGES`, es **rojo** — y es rojo
     **por el mismo caso** por el que lo es el mismo fichero renombrado a `.ts`.
     Hoy el `.mts` deja `lint exit=0`, `npm test` **772/772** y `tests/polite`
     **86/86**, y **se commitea con un `git add` normal**: a diferencia de
     F-SPEC-008-V28, que necesitaba `git add -f`, **este fichero llega a
     producción**. La única diferencia entre verde y rojo es **una letra en el
     nombre del fichero**.

  **Lo que esta parte NO promete** (ADR-016 §6): un fichero fuera de todas las
  raíces sigue sin leerse, y eso es deliberado —`tests/` es el caso vivo—; lo que
  el criterio garantiza es que **quedar fuera sea una decisión declarada en las
  raíces**, no un efecto colateral de otra regla.

  **Y una cosa que sí prometía y no entrega, escrita aquí y no en un
  *follow-up*** *(añadido el 2026-09-01)*: **fuera de las raíces, la lista de
  cobertura la sigue decidiendo `.gitignore`**. `versionedSources()` le pregunta a
  `git`, y `git` no ve lo que `.gitignore` esconde, así que un `robots/side.ts`
  **en la raíz del repositorio** —importado desde `src/ingest/adapter.ts` con una
  ruta relativa que `resolvesInsideRepository` acepta— no lo echa de menos nadie:
  medido, `lint exit=0`, `npm test` **772/772**, `tests/polite` **86/86**, y
  `git status` no enseña nada (F-SPEC-008-V35). Es la lección del punto 1 una capa
  más afuera: la **lectura** dejó de heredar `.gitignore` bajo las raíces, la
  **cobertura** no. Es más estrecho que F-SPEC-008-V33 —hace falta `git add -f`
  para commitearlo— y **no se cierra aquí**: se muda a **SPEC-009**.
  **`.gitignore` no se toca**: protege lo que ADR-009 §3 hace irreversible.

  **CA-2.7 — Cada mecanismo lleva su control positivo, y las evasiones vivas se
  escriben como controles.**
  Apagar cualquiera de CA-2.1..CA-2.6 pone rojo al menos un caso nombrado. Y las
  evasiones que hoy sobreviven se escriben como control positivo, cada una contra
  el mecanismo que le toca: `const { fetch: send } = globalThis` con
  `['User','Agent'].join('-')` (F-SPEC-008-V6) → CA-2.4 en estático y CA-2.1 en
  ejecución; `await import('node:' + 'https')` (F-SPEC-008-V7) → CA-2.3; un
  fichero nuevo en `src/ingest/` que nadie importa → CA-2.5.
  **No queda ninguna exención por nombre de fichero.** CA-2 deja de mirar
  palabras, así que `src/site/robots-txt.ts` y
  `src/mirror/analysis/referenceless/report.ts` dejan de necesitar una, y con la
  lista desaparece el agujero de F-SPEC-008-V9. Ninguno de los dos ficheros
  cambia (CA-3).

  **CA-2.8 — Lo que este criterio NO promete, dicho dentro del criterio.**
  No prohíbe que exista, fuera de `src/polite/`, una función que lea el texto de
  un `robots.txt`: prohíbe que **decida** (CA-2.2) y prohíbe que la petición
  salga por otro sitio (CA-2.1, CA-2.3, CA-2.4). El segundo parser de
  F-SPEC-008-V8 **deja de ser una evasión porque deja de ser una infracción**: no
  manda un byte y no puede abrir una puerta.
  Y CA-2.1 solo ve los caminos que se ejecutan. El residuo es finito y
  nombrable: **código alcanzable desde `ENTRY_POINTS` cuya rama de red no la
  ejecuta ningún test**. Estrecharlo es cuestión de cobertura, no de detección, y
  no es de esta spec.

- **CA-3 — El traslado no cambia el comportamiento del instrumento.**
  Dada la suite `tests/mirror/` tal como está en `main`,
  cuando se corre después de mover los módulos a `src/polite/`,
  entonces pasa **entera**, sin modificar una sola aserción: lo único que cambia
  en esos ficheros son rutas de `import`. Igual para `tests/site/`, cuyo
  `crawler-page` sigue publicando la UA literal de ADR-011.
  *(Si para que pase hubiera que enmendar una aserción, el traslado está mal
  hecho y se para: CA-3 es la prueba de que ADR-014 §1 fue un traslado y no una
  reescritura.)*

- **CA-4 — Archivar antes de parsear, sin modo degradado (RN-10).**
  Dado un `RawStore` doble y una respuesta 200 con cuerpo,
  cuando el adaptador captura una competición,
  entonces el `put` del raw store ocurre **antes** de que el lector vea un solo
  byte; el `raw_ref` que devuelve es el que llevan todas las `Observation`
  resultantes; y si el `put` **falla**, no se parsea nada, no se produce ninguna
  `Observation` y el error sale sin envolver en un resultado parcial.

- **CA-5 — Ninguna petición sale sin permiso, sin identificarse o cambiando de
  host (RN-11, ADR-011, ADR-008 §2).**
  Dado un adaptador con un `HttpFetcher` doble, entonces, en tres escenarios:
  1. **Política que prohíbe la URL objetivo** → **no sale ninguna petición**, no
     se archivan bytes, y el motivo registrado es la frase de `robotsSkipReason`,
     que nombra la ruta y cita RN-11.
  2. **User-agent vacío** → `MissingUserAgentError` **antes de cualquier I/O**;
     y en el camino normal, la petición lleva exactamente `USER_AGENT` y esa
     cadena satisface `USER_AGENT_PATTERN`.
  3. **La fuente responde 3xx** → `RedirectNotFollowedError`, **cero bytes
     archivados** y el `Location` en el motivo. La URL contra la que se consultó
     `robots.txt` y la que se descargó son la misma **por construcción**, así que
     ninguna respuesta se archiva bajo un `SourceId` ajeno.

- **CA-6 — La política de un origen se obtiene, se archiva y caduca (ADR-014 §3).**
  Dado un reloj falso y un origen sin política vigente,
  cuando el adaptador va a pedir algo a ese origen,
  entonces primero pide su `robots.txt` por la misma puerta cortés, lo **archiva
  antes de parsearlo** con clave `<source>/robots/<día>/<instante>-<digest>.txt`,
  y solo después captura. Y:
  1. Dentro de las **6 h** siguientes **no vuelve a pedirlo**, aunque haya
     decenas de ticks.
  2. Pasadas las 6 h, lo pide **una vez** y sigue.
  3. Si esa petición **falla**, o si nunca hubo política, **no sale ninguna
     petición hacia ese origen** y el tick registra el motivo. Se falla cerrado.

- **CA-7 — El ritmo lo impone el adaptador, no quien lo llama (RN-11).**
  Dado un reloj falso, una fuente y **dos** competiciones,
  cuando se invoca el tick del adaptador cada 20 s durante 5 minutos simulados,
  entonces salen **como mucho 5** peticiones por par (fuente, competición) —el
  instante se sella **antes** del `await`, para que una respuesta lenta no le
  compre turno al siguiente— y los ticks suprimidos **no** producen registro de
  fallo ni de petición.

- **CA-8 — Extracción de `ceroacero.es`: media fila es peor que ninguna.**
  Dados fixtures **sintéticos** que reproducen la forma de la página de
  competición de `ceroacero.es` —una jornada con un partido `scheduled` con hora,
  uno `live` con marcador, uno `finished`, uno `postponed` y **una fila que no se
  puede leer entera**—,
  cuando se lee el cuerpo archivado,
  entonces se obtiene por cada partido legible su identidad tal como la escribe
  la fuente, los dos nombres tal como los escribe la fuente, el `status` de las
  cinco ramas del modelo, el marcador cuando lo hay y la hora cuando la hay; y la
  fila ilegible **aborta nombrándose**, sin producir media fila y sin inventarle
  un valor.
  **Restricción irreversible y no negociable:** la calibración de los selectores
  se hace mirando el HTML **archivado en `raw/`**; los fixtures de `tests/` son
  **sintéticos**, escritos a mano. **Nunca se versiona HTML real de terceros**
  (ADR-009): git no se purga, se reescribe.

- **CA-9 — La `Observation` que produce el adaptador (RN-01, RN-13, ADR-006).**
  Dada una fila `live` 2-1 resuelta por el `MatchResolver`,
  entonces la `Observation` que sale:
  1. valida contra `ObservationSchema` **antes** de salir del adaptador;
  2. lleva `source: 'ceroacero'` y `confidence: 0.7` **leído del registro de
     fuentes** (RN-01), no de una constante dentro del adaptador — un test lo
     prueba cambiando el peso en el registro y viendo cambiar el `confidence`;
  3. lleva `observed_at` como **cadena ISO 8601 UTC con `Z`**, tomada del reloj
     inyectado, **nunca un `Date`** (ADR-006);
  4. lleva `raw_ref` obligatorio y apuntando al objeto que CA-4 archivó;
  5. sale **congelada**, y ningún camino del adaptador la reescribe (RN-13).

- **CA-10 — El replay desde el archivo es determinista.**
  Dados los mismos bytes archivados, el mismo `MatchResolver` y el mismo
  `observed_at`,
  cuando se ejecuta la lectura dos veces,
  entonces las dos ejecuciones producen `Observation` **idénticas, `id`
  incluido**: el `id` se deriva de datos del archivo —`raw_ref` y la identidad de
  la fila— y no de un contador ni de un aleatorio. Ejecutar la lectura sobre dos
  capturas distintas del mismo partido produce, en cambio, `id` distintos.

- **CA-11 — Una fuente es una entrada del registro, no una rama en el código.**
  Dado el registro de fuentes,
  cuando un test añade una fuente ficticia con su peso y su función de
  extracción,
  entonces queda capturable y legible **sin tocar ninguna firma ni ningún módulo
  existente** salvo el propio registro. El test se escribe como la simulación
  literal de «llega el sí de la RFGF»: se añade `futgal` con peso 1.0 y se
  comprueba que el diff necesario es una entrada.

- **CA-12 — El adaptador no publica nada (RN-08, D-3).**
  Dado cualquier camino de ejecución del adaptador,
  entonces no se construye ni se escribe ninguna `Decision`; un test de
  arquitectura comprueba que **`src/ingest/` no menciona `DecisionStore`** ni
  ningún constructor de `Decision`, y falla si alguien lo añade. Publicar es
  escribir una `Decision`, y la única puerta es el motor.

- **CA-13 — La identidad no se adivina nunca (RN-09).**
  Dado un `MatchResolver` que resuelve dos de tres filas,
  cuando el adaptador convierte filas en `Observation`,
  entonces produce **dos** `Observation` y **ninguna** por la tercera; la fila no
  resuelta se devuelve en una lista aparte, con su identidad y sus dos nombres
  íntegros; y no existe ningún camino que fabrique un `MatchId`, lo normalice por
  parecido o lo tome del texto de la fuente.

- **CA-14 — El ritmo de RN-11 sobrevive al proceso (RN-11, ADR-004, ADR-006).**

  > *Criterio añadido el 2026-09-01 por la enmienda de alcance que Alberto Fojo
  > arbitró ese día, contra la recomendación de `sdd-arquitecto`. Motivo,
  > mecanismo descartado y coste están en el ledger: «Enmienda — 2026-09-01: el
  > estado durable del limitador de RN-11 entra en SPEC-008 (F-SPEC-008-V13)».*

  *La forma real de producción es **una instancia nueva por tick**: ADR-004 dice
  que en Vercel no hay proceso vivo. Un limitador que sea un campo de instancia
  cumple RN-11 dentro de una ejecución y no la cumple entre ejecuciones —diez
  peticiones al mismo par en el mismo minuto, medidas—. Este criterio no se
  comprueba con un proceso largo: se comprueba **construyendo el adaptador de
  nuevo**, como lo construye un arranque en frío.*

  **CA-14.1 — Un solo paso, no dos.**
  El puerto del ritmo expone **una** operación: conceder el turno y sellarlo a la
  vez. Un test comprueba que el adaptador **no tiene ninguna forma de preguntar
  sin sellar**: entre preguntar y sellar cabe otra instancia, y ése es
  exactamente el fallo que se está arreglando. El puerto es **obligatorio** en
  las opciones del `SourceAdapter`, sin default permisivo, igual que `robots`.

  **CA-14.2 — Instancia nueva por tick.**
  Dado un reloj falso detenido y **diez `SourceAdapter` construidos por
  separado**, cada uno con su propio puerto del ritmo recién creado y
  compartiendo únicamente el almacén durable,
  cuando cada uno captura una vez el mismo par (fuente, competición),
  entonces **sale exactamente una petición**, y las otras nueve devuelven
  `skipped` con la frase de `rateLimitSkipReason`.
  Con el reloj adelantado 60 s entre construcciones, salen **diez**.

  **CA-14.3 — Control positivo, y es el que nombra el defecto.**
  La misma batería corrida contra la implementación **en memoria** da **diez
  peticiones**, y el caso lo afirma como resultado esperado: es la reproducción
  exacta de F-SPEC-008-V13 y la prueba de que CA-14.2 no pasa por casualidad.

  **CA-14.4 — Dos que llegan a la vez, uno solo sale.**
  Dadas dos concesiones **concurrentes** sobre el mismo par y el mismo instante,
  **exactamente una** obtiene el turno. Se comprueba contra el almacén durable
  real: es el caso que producen una invocación manual, un reintento del cron o un
  despliegue solapado, y el único que un doble en memoria no puede simular.

  **CA-14.5 — Una batería de contrato, dos implementaciones.**
  La semántica del puerto **dentro de una instancia** —concede, niega dentro del
  minuto, concede pasado el minuto, y **un minuto sin pedir no da derecho a dos
  peticiones en el siguiente**— se escribe **una vez** y corre contra las dos
  implementaciones, como `tests/raw/contract.ts` corre contra disco y Blob
  (ADR-005). La supervivencia **entre** instancias no es parte de esta batería:
  es CA-14.2, y solo la implementación durable la pasa. La cláusula del no
  acumular no es adorno: es lo que `/robot` promete literalmente en galego y en
  castellano (`src/i18n/gl.ts`, `src/i18n/es.ts`, SPEC-005).

  **CA-14.6 — El número vive donde vivía, y el SQL no lo repite.**
  El intervalo sigue siendo `MIN_REQUEST_INTERVAL_MS` de
  `src/polite/rate-limit.ts`; la implementación durable recibe el **instante
  límite ya calculado** y no escribe ningún intervalo en su SQL. Un test cambia
  el intervalo en un solo sitio y ve cambiar el comportamiento de las dos
  implementaciones. Acceso con `postgres.js` y SQL etiquetado, **sin ORM**;
  migración `migrations/0002_<slug>.sql`, en orden y sin rollback (ADR-006).

  **CA-14.7 — Se falla cerrado.**
  Si la concesión **falla** —no hay base de datos configurada, la consulta
  revienta—, **no sale ninguna petición**, no se archiva nada, no se produce
  ninguna `Observation` y el tick registra el motivo. Sin estado del ritmo no hay
  ritmo demostrable, y ADR-014 §3.3 ya fijó que en producción eso se resuelve
  cerrando.

  **CA-14.8 — El instrumento se queda como está, y se dice por qué.**
  `src/mirror/` sigue usando la implementación en memoria. No es una excepción
  tolerada: es el motivo que F-SPEC-002-2 escribió y ADR-014 §3 reutilizó —la
  ventana dura una hora, corre en **un** proceso, y el operador está delante—. Un
  test comprueba que las CLI de `src/mirror/` siguen construyendo la
  implementación en memoria y que **ningún módulo bajo `src/ingest/` puede
  construirla**.

  **CA-14.9 — Lo que este criterio NO promete.**
  No hay reserva de turno ni reintento: **un turno concedido cuya petición
  después falla se ha gastado**, y el par espera al minuto siguiente. Es
  deliberado —RN-11 cuenta peticiones que **salen**, no respuestas que vuelven— y
  es lo que impide que un tercero caído se lleve una ráfaga. Tampoco cubre a
  `src/mirror/` (CA-14.8), ni dice nada del ritmo del `robots.txt`, que ADR-014
  §3.2 contabiliza aparte.

  **Cómo se corre.** CA-14.1, CA-14.3, CA-14.8, CA-14.9 y la mitad en memoria de
  CA-14.5 van en `npm test`. CA-14.4 y la mitad durable de CA-14.2, CA-14.5 y
  CA-14.6 van en `npm run test:db` y **necesitan `DATABASE_URL_TEST`**: sin él son
  **UNMET, no *skipped*** (gate del 2026-08-29). El ledger tiene que llevar las
  dos salidas.

## Entidades y reglas afectadas

**Reglas de negocio** (`docs/fundacion/reglas.md`, no se duplican aquí):

- **RN-01** — peso 0.7 de `ceroacero.es`; el `confidence` de la `Observation` es
  ese peso, y sale del registro de fuentes (CA-9, CA-11).
- **RN-08** — el adaptador no publica; la única puerta es el motor (CA-12).
- **RN-09** — sin identidad resuelta por el catálogo de alias no hay
  `Observation` (CA-13). El catálogo y su confirmación humana son de otra spec.
- **RN-10** — archivo antes de parseo, sin modo degradado (CA-4), y también para
  el `robots.txt` (CA-6).
- **RN-11** — `robots.txt` obedecido de verdad (CA-1, CA-5, CA-6), user-agent
  identificado (CA-5) y 1 petición/minuto por competición **dentro de una
  instancia** (CA-7) **y entre instancias** (CA-14).
- **RN-12** — no aplica aquí y se dice por qué: solo una regla del motor produce
  una `Decision`, y esta spec no produce ninguna.
- **RN-13** — las `Observation` salen congeladas y el adaptador no reescribe
  ninguna (CA-9.5, CA-10).

**ADRs:**

- **ADR-014** (esta épica, **`aprobada`** el 2026-09-01) — dónde vive la cortesía
  y que es una sola. Esta spec lo ejecuta entero: §1 en CA-2 y CA-3, §2 en CA-1, §3 en CA-6,
  §4 en CA-2.
- **ADR-008 §1** — `futgal.es` no es capturable; §2 — la segunda candidata es
  `besoccer.es` y ninguna respuesta se archiva bajo un `SourceId` ajeno (CA-5.3);
  §5.2 — «es medición, no producción», con la pregunta abierta de las notas §7.
- **ADR-009** — retención del archivo (purga prevista el **2026-09-30**, techo el
  2026-11-29) y la prohibición **irreversible** de versionar HTML real de
  terceros (CA-8).
- **ADR-006** — instantes como cadena ISO 8601 UTC, nunca `Date` (CA-9.3);
  `postgres.js` y SQL etiquetado, sin ORM, y migraciones numeradas y **sin
  rollback** — que a partir de la enmienda del 2026-09-01 **sí** aplican aquí, en
  `migrations/0002` y en la implementación durable del ritmo (CA-14.6).
- **ADR-016** (**`aprobada`** el 2026-09-01, escrito ese mismo día por encargo del
  gate) — cómo se demuestra una frontera de capacidad: enumerar lo permitido y
  exigir que el resto sea vacío. **CA-2 es su primera aplicación**; el ADR fija
  la regla general y esta spec no la redefine. Desde que está aprobado, su
  **§3.5** —una lista de lo permitido no puede esconder una lista de lo prohibido
  en su condición de admisión— es lo que deja a **CA-2.4 en ⚠️** y lo que manda
  su cierre a SPEC-009; y su **§6** es lo que obliga a que el residuo esté
  escrito dentro del criterio y no en un *follow-up*.
- **ADR-015** (**`aprobada`** el 2026-09-01) — la forma de una enmienda sobre un
  criterio ya firmado. Es la que usan, por analogía declarada, las **cinco**
  enmiendas del ledger de esta spec.
- **ADR-005** — `RawStore` como puerto: Vercel Blob en producción, disco en local
  y tests. Esta spec no lo toca; lo usa.
- **ADR-011** — forma estable del user-agent declarado; la mitad de RN-11 que se
  delega en `/robot` sigue delegada, y `src/site/crawler-page.tsx` sigue
  publicando la cadena literal (CA-3, CA-5.2).
- **ADR-004** — Vercel: sin proceso vivo, sin disco y con el cron a 1/min, que
  coincide con el techo de RN-11. Es lo que obliga a CA-6.
- **ADR-001** — `zod` como fuente única del modelo canónico; la `Observation` se
  valida contra su esquema antes de salir (CA-9.1).

**Términos de `dominio.md`** que esta spec consume y no redefine: `Observation`,
`raw store`, `RawStore`, `raw_ref`, `Match`, `Team`, `alias`, `ceroacero.es`,
**adaptador de fuente** (entrada añadida el 2026-09-01 por esta spec), los cinco
estados de un partido y la representación del tiempo.

## Fuera de alcance

Aparcado a propósito, no por descuido. Cada línea tiene dueño futuro.

- **La frontera de capacidad, a partir del 2026-09-01** (enmienda del ledger «CA-2
  se queda ⚠️ con su residuo escrito, y la frontera de capacidad sale a
  SPEC-009»). CA-2 sigue vivo y sigue mordiendo para todo lo que ya cierra, pero
  **queda ⚠️ y nunca ✅**: lo que le falta —enumerar los identificadores globales
  permitidos en vez de prohibir nueve (F-SPEC-008-V34), y que la cobertura fuera
  de las raíces deje de decidirla `.gitignore` (F-SPEC-008-V35)— es de
  **SPEC-009**, junto con la batería de las once evasiones. Lo único que se cierra
  aquí es **F-SPEC-008-V33**, en CA-2.6.

- **El motor de decisiones (RN-01..RN-07) y cualquier `Decision`.** Nace con
  **una sola vía en RN-02**: con una única fuente automática de peso 0.7, nada
  llega a *confirmado* por vía automática. Es dato de partida, no incógnita.
- **El cron de planificación, el calendario y las ventanas por partido.** Esta
  spec deja el limitador y el puerto listos —y, desde la enmienda del
  2026-09-01, también **el estado durable del ritmo** (CA-14), que ya no viaja a
  la spec del cron—; quién dispara el tick y cuándo sigue siendo de ella. La spec
  del cron hereda un limitador que **ya** sobrevive al proceso, y no una
  precondición de despliegue que cumplir.
- **El catálogo de alias de los 36 equipos y su confirmación humana (RN-09).**
  Aquí solo se define y se dobla el puerto `MatchResolver`.
- **La persistencia del modelo canónico.** La implementación Postgres de
  `ObservationStore` y `DecisionStore` sigue siendo de «la primera spec que la
  necesite» (F-SPEC-001-3), y ésta no la necesita: devuelve `Observation`, no las
  guarda. **Ninguna `Observation` y ninguna `Decision` tocan la base de datos en
  esta spec**, ni el calendario, ni el catálogo de alias.
  **Enmendado el 2026-09-01 (arbitraje de Alberto Fojo):** `migrations/0002`
  **sí entra**, y solo para el estado durable del ritmo de RN-11 —una tabla, la
  clave del par y un instante (CA-14)—. El texto que decía «tampoco hay
  `migrations/0002`» queda sustituido; el original, el motivo y el mecanismo
  descartado están en el ledger.
- **El adaptador de `besoccer.es`.** Sirve armazones vacíos y su dato vive tras
  un `Disallow: /ajax*` que, **a partir de CA-1, por fin se respeta de verdad**.
  Su superficie servida no encaja en el modelo (`hallazgos/fontes-capturables.md`).
- **El adaptador de `futgal.es`.** No es capturable (ADR-008 §1). Entra el día
  que lo sea, y entonces es **una entrada del registro** (CA-11), no una
  reescritura.
- **El bot de Telegram (corresponsal, 0.8) y el panel del operador (1.0).** Son,
  con una sola fuente automática, la **única ruta a un marcador confirmado**, y
  van antes que la página y que las cifras — pero no aquí.
- **El snapshot y la página mínima por polling.**
  **Aviso para quien escriba esa spec, y no lo va a encontrar en otro sitio:**
  es la que **despierta la entrada 1 del inventario de EPIC-004**. El sistema de
  diseño pinta `provisional` en gris y como excepción, y con una sola fuente
  automática `provisional` pasa a ser el estado **normal**. Eso no se arregla
  cambiando un color: cambia **cuál es la fila por defecto**. EPIC-004 está
  `aprobada` y **congelada**; hay que leer su inventario antes de dibujar la
  primera tabla, aunque sea una página mínima de medición, y ADR-013 obliga en
  cuanto se toque interfaz.
- **La implementación de SSE** (ADR-003). La decisión está tomada y ninguna
  métrica la necesita: «publicado» se mide como `Decision` escrita.
- **La instrumentación de las cuatro cifras** y su declaración de degradación.
  Es el entregable de la épica; esta spec solo construye el primer tramo del
  camino que las hace medibles.
- **La purga del raw store del 2026-09-30** (ADR-009). No tiene ejecutor y es
  entrada de EPIC-MEJORA. Esta spec **depende** de que no se haya ejecutado antes
  de calibrar; ver notas §5.

## Notas para el gate humano

> **Estado de estas notas tras el arbitraje del 2026-09-01.** Los puntos 1..8 son
> los del gate original y siguen tal cual; los puntos 3 y 4 quedaron **firmados**
> ese día y no se reabren. Los puntos **9 y 10** los añade la aplicación de las
> dos enmiendas que Alberto Fojo arbitró. Los puntos **11 y 12** los añade la
> tercera enmienda —la reescritura de CA-2.1 y CA-2.3 tras la tercera
> verificación—. Los puntos **13 y 14** los añade la cuarta —el lector de CA-2.3
> pasa a ser el compilador y la lista de ficheros deja de salir de `git`—. Y los
> puntos **15 y 16** los añade la quinta enmienda —**CA-2 se queda ⚠️ y la
> frontera de capacidad sale a SPEC-009**—, que es lo último que hay que mirar y
> lo único que cambia el alcance de lo que esta spec dice entregar.

Lo que hay que mirar con lupa antes de firmar. Los siete puntos son decisiones,
no detalles, y cuatro de ellos son preguntas abiertas de verdad.

1. **Se toca código de dos specs `hecho` y verificadas GREEN.** El traslado a
   `src/polite/` mueve ficheros de SPEC-002 y SPEC-003, y CA-1 **cambia el
   comportamiento** de `parseRobots`, que es código con contrato verificado. Está
   autorizado por el propio ledger de SPEC-002 —rutó F-SPEC-002-23 aquí
   explícitamente— pero conviene decirlo entero: **después de esto, el GREEN de
   esas dos specs se sostiene sobre su suite, no sobre la inmovilidad de su
   código.** CA-3 es la red.

2. **Hay un cambio de comportamiento adicional al comodín, y va desnudo a
   propósito: el desempate.** Hoy, ante dos patrones de igual longitud que casan,
   gana el que aparece primero en el fichero. CA-1.3 lo cambia a «gana el
   `Allow`», que es RFC 9309. Es **más permisivo** en un caso muy estrecho.
   Podría dejarse fuera y no lo dejo, porque tener la única implementación de
   RN-11 con un desempate propio es la semilla del siguiente F-SPEC-002-23.
   **Es una firma aparte de la del arreglo.**

3. **Las 6 h de vigencia del `robots.txt` son un número elegido, no medido**
   (ADR-014 §3.2). Se apoya en el refresco de 6 h que la épica fija para el
   calendario. Bajarlo cuesta peticiones a terceros; subirlo cuesta obedecer más
   tarde una restricción nueva. **¿Se firma 6 h?**

4. **`competition_id: 'robots'` en la clave del raw store es una licencia
   consciente** (ADR-014 §3.4): la clave se lee bien
   (`ceroacero/robots/2026-09-06/…txt`), no toca `src/raw/key.ts` y evita una
   migración. La alternativa limpia es una tabla y un `migrations/0002`
   irreversible. **¿Se acepta la licencia o se prefiere la migración?**

5. **Hay una fecha que empuja, y es la única de esta spec: el 2026-09-30.** Las
   seis capturas de `ceroacero.es` del 2026-08-31 son el único HTML real de la
   fuente del que disponemos, y ADR-009 fija su purga ese día. **Calibrar los
   selectores después obliga a capturar de nuevo**, lo que es posible pero
   consume presupuesto de RN-11 y voluntad. No es motivo para aprobar deprisa; es
   motivo para no aprobar tarde.

6. **La rama de implementación tiene que nombrar `SPEC-008`.** El hook
   `require-spec` deduce la spec del nombre de la rama y deniega la escritura
   sobre `src/` y `tests/` si no la encuentra. La rama en la que nace esta spec
   —`ft/EPIC-002-primeira-spec-adaptador`— **no sirve para implementarla**.

7. **La pregunta que no es mía y no está contestada: ¿esto sigue siendo
   medición?** ADR-008 §5.2 acepta el riesgo de capturar «para la ventana acotada
   de SPEC-003 — una hora, dos competiciones», y dice que **«un sondeo continuo
   sobre muchas competiciones *es* el art. 7.5 de la Directiva 96/9/CE y ahí no
   hay lectura benigna»**. Esta spec construye la máquina de un sondeo que corre
   **una jornada entera**, dos veces, sobre dos competiciones. Dos no son muchas
   y una jornada no es continuo — pero **la línea no está trazada por nadie**, y
   yo no soy quien para trazarla. `sdd-legal-datos` no ha dictaminado sobre
   `ceroacero.es` en régimen de ingesta; su dictamen del 2026-08-31 la marca
   **CORRECTO para la ventana acotada**, con esas tres palabras. **Recomiendo
   pedir el dictamen antes de correr la primera jornada, no antes de escribir el
   código**: el código es igual de legal escrito que sin escribir, y el dictamen
   puede cambiar el ritmo o el alcance, que son configuración (CA-11).

8. **Lo que esta spec deliberadamente no promete.** No produce ninguna de las
   cuatro cifras, no publica un marcador y no deja el sistema capaz de hacerlo.
   Al terminar habrá `Observation` en memoria, un archivo que sabe reproducirse y
   una regla dura que por fin se cumple. Medir sigue estando a cinco specs de
   distancia, y el desglose propuesto va en el informe de este encargo, no aquí:
   el desglose es orientativo hasta que cada spec se escriba.

9. **CA-2 ya no mecaniza la primera prohibición de ADR-014 §4, y eso está
   firmado.** Un segundo parser de `robots.txt` puede existir mientras no pueda
   decidir ni abrir una puerta. La regla del ADR sigue vigente y pasa a
   sostenerse en **revisión humana**. **No hay CI**: el gate de calidad corre en
   local, así que esa revisión humana es literalmente una persona leyendo un
   diff. Es la firma incómoda del 2026-09-01 y conviene releerla cada vez que se
   toque `src/site/` o `src/mirror/`.

10. **La spec deja de ser verificable con un solo comando.** CA-14 mete
    `migrations/0002` —irreversible en la práctica, ADR-006— y parte de su
    evidencia solo existe contra un Postgres real: `npm run test:db` con
    `DATABASE_URL_TEST`, y sin él esos criterios son **UNMET, no *skipped***.
    Además, el camino de ingesta gana una dependencia de base de datos que no
    tenía: **un tick sin ella no manda nada** (CA-14.7). Es fallo cerrado y es lo
    correcto, pero significa que una caída de Postgres es cobertura perdida, y
    esa cifra es uno de los cuatro entregables de la épica.

11. **CA-2.1 y CA-2.3 se han reescrito por segunda vez el mismo día, y este texto
    Alberto no lo ha visto.** La **decisión** —cerrar las dos mitades que la
    tercera verificación dejó abiertas— es suya, del 2026-09-01; el **texto
    literal** es de `sdd-arquitecto`, y por eso la spec sigue en `en-progreso`.
    Lo que hay que mirar con lupa son dos cosas concretas:
    - **La concesión por superficie encarece cada dependencia nueva**: ya no es
      una línea por paquete, sino una línea por paquete **y una por nombre**. Es
      deliberado, y por la doctrina ya firmada («que crezca es lo natural») **no
      vuelve al gate**. Si eso se considera demasiado peaje, el sitio de decirlo
      es ahora y no en la cuarta verificación.
    - **Lo único que sigue exigiendo firma humana** es declarar en una superficie
      un nombre cuyo trabajo sea pedirle bytes a un tercero. Todo lo demás de la
      lista es diff revisable.

12. **CA-2.1 deja de apoyarse en una lista de módulos y pasa a apoyarse en una
    propiedad del runtime, medida hoy.** Consecuencias que van dichas antes de
    firmar: si Node mueve el punto por el que pasa un socket, el criterio sigue
    siendo cierto pero **el test hay que reescribirlo**, y no se enterará nadie
    hasta que se reescriba —el control positivo de la dependencia es lo que
    avisa—. Y el residuo nuevo es real: **UDP, un subproceso y un binario nativo
    no pasan por un socket de `node:net`**, así que la contención en ejecución no
    los ve y su único cierre es el estático de CA-2.3 y CA-2.4. Está escrito
    dentro del propio CA-2.1, como ADR-016 §6 obliga, y no como follow-up.

13. **El cierre estático pasa a costar una dependencia de compilador, y eso es
    una decisión con precio.** Hasta hoy CA-2.3 se sostenía en expresiones
    regulares —baratas, sin dependencias, y **rotas tres veces por el mismo
    motivo**: se comían media sentencia, anclaban a principio de línea, y ahora
    la lista de ficheros—. A partir de aquí el guardián de una regla dura
    depende del API del compilador de TypeScript, que en la 7.x está publicado
    como **`unstable`**. Lo que eso significa, dicho antes de firmar: **una
    subida de `typescript` puede romper el test**, y romperlo es lo bueno —falla
    ruidosamente, no en silencio—, pero es trabajo que aparecerá sin avisar. La
    alternativa era seguir tapando patrones de uno en uno, que es lo que el
    verificador desaconseja con tres medidas delante. **La decisión es de Alberto
    Fojo, del 2026-09-01; el texto es de `sdd-arquitecto` y él no lo ha visto.**

14. **Lo que este cambio deliberadamente NO arregla, para que no se lea de más.**
    Sigue habiendo una mitad de CA-2 que se lee como texto: CA-2.4, las tres
    maneras de alcanzar una capacidad sin `import`. Está escrito dentro de
    CA-2.3 y no se cierra aquí porque nadie lo ha medido roto — y este expediente
    enseña que **la medida va antes que el ensanche**, no al revés. Si el gate
    prefiere cerrarlo ya que el árbol está ahí, el sitio de decirlo es ahora.
    *(La quinta verificación lo midió roto: es F-SPEC-008-V34, y va al punto 15.
    Esta nota se conserva tal cual porque es lo que se escribió entonces.)*

15. **CA-2 se queda ⚠️ y nunca ✅, y la frontera de capacidad sale de esta spec.**
    Es la decisión de Alberto Fojo del 2026-09-01, y lo que hay que mirar es que
    **la spec deja de prometer lo que su título de CA-2 dice**. Lo que sí
    entrega, y no es poco: el cierre de imports por superficie leído con el
    compilador, la contención en ejecución sobre `net.Socket.prototype.connect`
    —que **deniega por defecto**, así que ninguna petición de ningún test puede
    llegar a un tercero, y eso es mecanismo y no disciplina— y la contención de
    conjuntos contra la política real. Lo que **no** alcanza queda medido y
    escrito dentro de los propios criterios: **F-SPEC-008-V34** (el conjunto de
    CA-2.4 está medido abierto y su mecanismo es una lista negra de nueve
    nombres) y **F-SPEC-008-V35** (fuera de las raíces, la cobertura la decide
    `.gitignore`), más los residuos ya firmados de CA-2.1 y CA-2.8. **Lo único
    que se arregla aquí es F-SPEC-008-V33**, la lista de extensiones de CA-2.6,
    porque es una línea y **el fichero que la aprovecha se commitea con un
    `git add` normal**: llega a producción. Lo demás es **SPEC-009**.

16. **Y lo que hay que mirar con más lupa, porque es lo que aún no está
    contestado.** SPEC-009 nace en `borrador` con **una pregunta abierta de
    verdad**: si CA-2.4 pasa a **enumerar los identificadores globales
    permitidos** —lista blanca con superficie y motivo, como `ALLOWED_PACKAGES`—
    o si se acepta la lista negra y el residuo se escribe dentro del criterio
    (ADR-016 §6). `sdd-arquitecto` propone lo primero y **dice que su coste no
    está medido**: el lector de hoy no resuelve símbolos, y cuántos globales
    distintos usa el escaneo no está contado. **Si el gate quiere ese número
    antes de firmar, el sitio de pedirlo es la aprobación de SPEC-009 y no la de
    ésta.**
