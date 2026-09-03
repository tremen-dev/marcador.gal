---
id: SPEC-016
tipo: spec
epica: EPIC-002
estado: aprobada
aprobada-por: Alberto Fojo
historial:
  - {estado: borrador, fecha: 2026-09-03, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-09-03, por: Alberto Fojo}
---
# SPEC-016 — El catálogo de corresponsales se resuelve en compilación, y `npm run build` pasa a ser gate

## Problema

**El despliegue de Vercel falla desde SPEC-015 y ningún gate lo vio.** Reproducido
en local, en `ft/SPEC-015-bot-corresponsal`, el 2026-09-03:

```
./src/bot/catalog.ts:25:42
Error: Module not found: Can't resolve '../../corresponsais'
> 25 | export const CATALOG_DIR = fileURLToPath(new URL('../../corresponsais', import.meta.url));

Import trace:
  App Route:
    ./src/bot/catalog.ts
    ./src/bot/webhook.ts
    ./src/app/api/telegram/webhook/route.ts
```

`main` compila limpio; la causa es de esta rama.

**Por qué falla.** El empaquetador de Next trata `new URL(x, import.meta.url)`
como una **referencia a un recurso que se resuelve en compilación**, no como el
cálculo de ruta que es bajo Node. Intenta resolver `../../corresponsais` como
módulo, y es un directorio fuera de `src/`.

**Por qué ningún gate lo vio, que es lo que de verdad importa.** Los gates del
proyecto son `npm run lint`, `npm test` y `npm run test:db`. **`npm run build` no
es un gate, y `npm run typecheck` tampoco.** Y hay un test que ejerce el cargador
—`tests/bot/correspondents.test.ts:72` llama a `loadCatalog`— y **pasa en
verde**, porque bajo Node la expresión es un cálculo de ruta perfectamente
normal. Sólo el empaquetador la lee como recurso. Los tests y el build no pueden
discrepar más que exactamente aquí: **este es el único punto ciego que la suite
no puede ver por construcción**, y por eso el arreglo solo no basta.

No es un fallo del implementador ni del verificador. Verificaron contra la letra
de la spec, y la letra no incluía compilar. **La letra es lo que hay que
arreglar.**

**Lo que hay debajo, y que hoy no está medido.** Aunque se corrigiese la
resolución, leer un directorio del repositorio desde una función serverless
depende de que el rastreador de ficheros de Next lo incluya en el paquete, y una
ruta **calculada en ejecución** no se rastrea. Eso era F-SPEC-015-14, con
disparador «la primera jornada declarada con el bot encendido» — semanas tarde.
Resolver el catálogo en compilación **elimina las dos capas a la vez**.

Reglas en juego: **RN-09** (el catálogo es la mitad declarada por una persona de
la que depende que un `correspondent_id` exista), y por dependencia todo lo que
el bot sostiene de **RN-08** y **RN-12** — hoy el webhook devuelve 500 antes de
llegar a ninguna de ellas, porque ni siquiera se despliega.

## Usuarios / roles afectados

- **El corresponsal**: hoy no puede usar el bot en absoluto; la ruta no existe en
  producción porque el despliegue no compila.
- **Quien da un alta o una baja**: el precio sigue siendo un despliegue
  (ADR-022 §2), pero ahora también lo es **declarar una temporada nueva**, y eso
  hay que decirlo en voz alta y no descubrirlo el 1 de julio.
- **sdd-implementador y sdd-verificador**, de esta spec en adelante: el juego de
  gates que tienen que pasar y ejecutar cambia.
- **sdd-orquestador**: el gate de calidad que anuncia en cada ciclo cambia.

## Criterios de aceptación

### CA-1 — El catálogo entra en el paquete en tiempo de compilación

- **CA-1.1**: Dado `src/bot/catalog.ts`, cuando se lee su código, entonces **no
  contiene ninguna lectura de disco ni ningún cálculo de ruta**: desaparecen
  `readFile`, `fileURLToPath`, `join` y la constante `CATALOG_DIR`, y el
  contenido del catálogo llega por **`import` estático** del fichero JSON
  versionado (`corresponsais/2026-27.json`), con atributo de tipo
  (`with { type: 'json' }`) para que Node y el empaquetador lo lean igual.
- **CA-1.2**: Dado el catálogo importado, cuando se construye el objeto que
  consume el bot, entonces **sigue pasando por `parseCatalog`** de
  `src/bot/correspondents.ts`: la validación zod y el todo-o-nada de SPEC-015
  CA-2 **no se relajan**, y un `correspondent_id` que no case
  `corresponsal-\d+` sigue rechazando el fichero entero. Un test lo ejerce con
  un catálogo sintético inválido.
- **CA-1.3**: Dado `loadCatalog`, cuando se llama, entonces es **síncrona**: ya
  no hay E/S que esperar. Los puntos de llamada
  (`src/bot/webhook.ts:productionBotPorts`, `tests/bot/correspondents.test.ts`)
  dejan de usar `await` sobre ella.
- **CA-1.4**: Dado `emptyCatalog`, cuando se conserva, entonces **no es el
  camino de fallo de `loadCatalog`** (ver CA-2.4): sigue siendo sólo lo que su
  nombre dice, un catálogo vacío construido a propósito.

### CA-2 — La temporada se selecciona por un registro declarado, no por un nombre de fichero

Un `import` estático fija la temporada en compilación. Eso no se puede evitar; lo
que sí se puede es **hacerlo explícito y que romperse sea un test rojo y no un
500 en producción**.

- **CA-2.1**: Dado `src/bot/catalog.ts`, cuando se lee, entonces declara un
  **registro cerrado** de temporada → catálogo importado, con **una entrada por
  fichero de `corresponsais/`** — hoy exactamente una: `'2026/27'`. Añadir una
  temporada es añadir un `import` y una entrada: **una línea de código y un
  despliegue**, que es el mismo precio que ADR-022 §2 ya aceptó para un alta.
- **CA-2.2**: Dado el registro, cuando un test lo recorre, entonces **para cada
  entrada la clave es idéntica al campo `season` de su JSON**. Esto es lo que
  impide que copiar el fichero del año pasado bajo una clave nueva sirva la
  temporada equivocada en silencio.
- **CA-2.3**: Dado `ACTIVE_SEASON` de `src/ingest/measurement.ts` —que **ya era
  la constante que fija la temporada en compilación** desde SPEC-012, y a la que
  el catálogo simplemente se alinea—, cuando un test lo comprueba, entonces
  **es una clave del registro**. El día que `ACTIVE_SEASON` pase a `'2027/28'`
  sin fichero, falla un test antes de que falle un despliegue.
- **CA-2.4**: Dada una temporada que no está en el registro, cuando se llama a
  `loadCatalog`, entonces **lanza con un error distinguible que nombra la
  temporada pedida y las declaradas**, y **nunca devuelve un catálogo vacío**.
  El motivo está en el diseño de SPEC-015: el bot se entrega apagado y un
  catálogo vacío es **la configuración normal**, así que un vacío por error es
  indistinguible del funcionamiento correcto. Fallo cerrado y ruidoso, no
  silencioso.
- **CA-2.5**: Dado el registro, cuando un test lo recorre, entonces para cada
  clave existe el fichero `corresponsais/<catalogFileName(clave)>` en disco.
  `catalogFileName` se conserva por eso: deja de ser cálculo de ejecución y pasa
  a ser **la convención de nombres que un test hace cumplir** a quien añada un
  fichero. Este test lee disco, y puede: corre bajo Node, nunca dentro del
  paquete.

### CA-3 — El despliegue compila

- **CA-3.1**: Dado el árbol de la rama, cuando se ejecuta `npm run build`,
  entonces **termina con éxito**, y en particular no aparece
  `Can't resolve '../../corresponsais'`.
- **CA-3.2**: Dado el árbol de la rama, cuando se ejecuta `npm run typecheck`,
  entonces termina con éxito. El `import` de JSON necesita `resolveJsonModule`,
  que ya está en `tsconfig.json`; si hiciera falta tocar `tsconfig.json`, se
  toca y se justifica en el ledger.
- **CA-3.3**: Dados `npm run lint`, `npm test` y `npm run test:db`, cuando se
  ejecutan, entonces siguen en verde. **Ninguna regresión**: esta spec no
  cambia comportamiento observable del bot.

### CA-4 — `npm run build` y `npm run typecheck` pasan a ser gate, y el gate es un solo comando

Un gate que hay que acordarse de correr no es un gate. Los cuatro comandos que no
necesitan base de datos se declaran como **uno**, para que no se pueda pasar
medio gate por descuido.

- **CA-4.1**: Dado `package.json`, cuando se lee, entonces existe el script
  **`gates`**, que encadena, **en este orden y parando en el primer fallo**:
  `typecheck` → `lint` → `build` → `test`. El orden es de coste creciente y de
  diagnóstico decreciente: los errores de tipos son los más baratos y los más
  legibles.
- **CA-4.2**: Dado `npm run test:db`, cuando se considera su sitio, entonces
  **queda fuera de `gates`** y sigue siendo un comando aparte: necesita
  `DATABASE_URL_TEST` y una rama de Neon compartida entre worktrees
  (F-SPEC-015-8), y meterlo dentro haría que el gate fallase por motivos que no
  son del código. Sigue siendo obligatorio para el verificador; simplemente no
  es este comando.
- **CA-4.3**: Dado `.sdd.json`, cuando se lee, entonces `gates.calidad` deja de
  ser un `true` mudo y **nombra el comando** (`"calidad": "npm run gates"`).
  Nada del núcleo tremen-sdd valida ese fichero, así que esto es declaración
  para quien lee, no mecanismo — y por eso no es el único sitio (ver CA-4.4).
- **CA-4.4**: Dado `CLAUDE.md`, cuando se lee su párrafo «Gate de calidad»,
  entonces dice **`npm run gates`** y enumera los cuatro comandos que encadena,
  con la frase que este episodio deja escrita: **`npm test` no puede ver lo que
  sólo ve el empaquetador**. Se actualiza también la mención de que no hay CI.
- **CA-4.5**: Dado un test bajo `tests/`, cuando se ejecuta, entonces afirma que
  el script `gates` de `package.json` **existe y contiene los cuatro** (`typecheck`,
  `lint`, `build`, `test`). Es una aserción modesta y se declara como tal: **no
  prueba que el gate se ejecute**, sólo hace que quitarle un comando sea una
  ofensa visible en vez de un descuido. Quién lo ejecuta sigue siendo una
  persona o un rol, no una máquina (ver «Fuera de alcance»).

### CA-5 — Lo que este arreglo NO garantiza queda escrito

La honestidad que pide ADR-016 sobre lo que un mecanismo no alcanza, aplicada
aquí aunque esta spec no escriba ningún test de arquitectura.

- **CA-5.1**: Dado el ledger de esta spec, cuando se cierra, entonces declara
  que **el gate del build atrapa la referencia estática a un recurso
  (`new URL(x, import.meta.url)`) pero NO atrapa una lectura de disco calculada
  en ejecución** —`readFile(join(process.cwd(), …))` compila perfectamente y
  falla en producción—, y que el proyecto tiene **otras dos apariciones vivas
  del mismo patrón**, `src/db/migrate.ts:14` (`MIGRATIONS_DIR`) y
  `src/mirror/cli/node-resolve.ts:27`, **legítimas hoy sólo mientras esos
  módulos no entren en el grafo de importación de ninguna ruta**. Que `main`
  compile limpio es la prueba de que hoy no están. Se registra como follow-up
  con su disparador.

## Entidades y reglas afectadas

- **ADR-022 §2** (aprobado, inmutable). Dice, con estas palabras, que el
  catálogo vive «versionado en `corresponsais/<temporada>.json`, validado con
  zod **y importado como módulo**». **Esta spec no lo supersede: lo restaura.**
  La implementación de SPEC-015 se desvió de la letra del ADR al leerlo con
  `readFile`; el arreglo vuelve al mecanismo que el ADR ya había decidido.
  Tampoco cambian el artefacto (mismo fichero, mismo sitio, misma zod, sin dato
  personal) ni el precio declarado («dar de alta exige un despliegue»). **No
  hace falta un ADR-024.** Lo único que ADR-022 §2 no dijo —qué pasa con dos
  ficheros de temporada— vive por debajo de su nivel y es exactamente lo que
  CA-2 resuelve. *Este juicio es revisable en el gate: si quien firma cree que
  el registro cerrado de temporadas constriñe trabajo futuro más de lo que una
  spec puede, se escribe el ADR y esta spec se apoya en él.*
- **ADR-015** (aprobado). La vía por la que se corrige F-SPEC-015-14 sin tocar
  el cuerpo de SPEC-015: enmienda en su ledger, ya escrita bajo
  `## Enmienda — 2026-09-03: F-SPEC-015-14 se quedó corto`.
- **ADR-016** (aprobado). No aplica su ceremonia porque esta spec **no escribe
  ningún test de arquitectura**: el guardián del arreglo es el propio
  empaquetador (CA-3.1), que es un mecanismo real y no una lista. Lo que sí se
  toma de él es la obligación de declarar lo que el mecanismo no alcanza
  (CA-5.1).
- **ADR-004** (aprobado). Sin proceso vivo y sin disco: el catálogo en el
  paquete es la forma que encaja con la plataforma, no un atajo.
- **SPEC-015 CA-2** (`hecho`). Su todo-o-nada zod y su frontera «el cargador del
  mapeo no lee ningún fichero del repositorio» **siguen intactos**: esta spec
  toca `src/bot/catalog.ts`, nunca `src/bot/correspondents.ts`.
- **SPEC-012** (`hecho`). `ACTIVE_SEASON` es suya y se cita, no se duplica.
- **RN-09**, **RN-08**, **RN-12**: sostenidas por dependencia, no modificadas.

## Fuera de alcance

- **CI.** Hoy no hay (CLAUDE.md lo dice). Ejecutar `npm run gates` en cada push
  es la conclusión natural de este episodio y **merece su propia spec**: toca
  proveedor, secretos, coste y la rama de Neon compartida. Declararlo aquí sin
  construirlo sería peor que no declararlo. Follow-up con disparador.
- **Comprobar el arreglo en un despliegue real de Vercel.** Sigue dependiendo de
  la ceremonia de encendido del bot; lo que esta spec cierra es que ya no hay
  nada que comprobar sobre el rastreo de ficheros, porque no se rastrea ningún
  fichero.
- **Cambiar el precio de un alta.** Sigue costando un despliegue (ADR-022 §2).
  Llevar el catálogo a entorno o a tabla es la forma de ADR-018 que ADR-022
  rechazó a propósito, y se descartó otra vez hoy en el gate.
- **Cualquier cambio de comportamiento del bot.** Ni la ventana, ni el LLM, ni
  el archivo, ni el motor.
- **Arreglar `src/db/migrate.ts` ni `src/mirror/cli/node-resolve.ts`.** Su
  patrón es legítimo mientras vivan bajo Node. Sólo se inventaría (CA-5.1).

## Notas para el gate humano

1. **La decisión de fondo ya la tomaste hoy** (2026-09-03): importar el JSON
   directamente, descartando arreglar la lectura de disco y descartando llevar
   el catálogo a entorno o a tabla. Esta spec sólo la escribe.

2. **Lo que sí es juicio mío y puedes tumbar: no hay ADR-024.** El argumento
   está en «Entidades». En resumen: ADR-022 §2 **ya decía «importado como
   módulo»**, así que esto restaura el ADR en vez de superseder-lo, y ni el
   artefacto ni el precio cambian. Si no compras el argumento, dilo y escribo el
   ADR antes de que nadie implemente.

3. **Lo segundo que es juicio mío: el gate del build entra aquí y no en una spec
   propia.** El motivo no es comodidad. Si el gate se difiere, la verificación
   de **este mismo arreglo** consistiría en que alguien se acuerde de correr
   `npm run build` a mano — exactamente el hueco que causó el defecto—, y la
   siguiente spec nacería con el mismo punto ciego. Un disparador del tipo «la
   próxima vez que se rompa el build» llega, por construcción, **después** del
   daño. Lo que sí saco fuera es la **CI**, que es donde el trabajo de verdad
   crece y donde hay decisiones (proveedor, secretos, coste) que no son de esta
   spec.

4. **La respuesta a «¿habría fallado alguna spec ya cerrada este gate?»: no, y
   hay evidencia directa** — `main` compila limpio, comprobado hoy en un
   worktree aparte. Y hay un porqué que conviene entender: las specs de EPIC-003
   (sitio público) y SPEC-012 (ruta de cron) **ya pasaban por el empaquetador de
   hecho**, porque el sitio se despliega en Vercel; el despliegue ha venido
   haciendo de gate accidental para ellas. Las que nunca lo pisaron
   —`src/mirror/`, `src/calendar/`, `src/alias/`, los CLI— corren sólo bajo Node,
   donde el patrón es correcto. **SPEC-015 es la primera spec que mete código de
   fuera del sitio dentro de una ruta**, y por eso es la primera que rompe.
   El riesgo no es histórico, es futuro: el día que un módulo con
   `import.meta.url` entre en el grafo de una ruta (CA-5.1).

5. **La consecuencia que hay que aceptar con los ojos abiertos:** el catálogo de
   la temporada queda fijado en compilación. Ya lo estaba de facto
   —`ACTIVE_SEASON` es una constante desde SPEC-012—, pero ahora son dos sitios
   que hay que mover a la vez para cambiar de temporada. CA-2.3 convierte
   olvidarse en un test rojo; **no lo convierte en imposible.**

6. **Colisión de numeración detectada en el ledger de SPEC-015:** existen **dos**
   entradas `F-SPEC-015-14`, una del implementador (el catálogo en disco) y otra
   del verificador (el escaneo que no mira dentro de los ledgers). La enmienda
   de hoy renumera la segunda como **F-SPEC-015-16** y lo dice. No hay pérdida
   de información; sólo dejaba de ser citable.

7. **Ninguna pregunta bloqueante.** Si apruebas tal cual, el implementador tiene
   todo lo que necesita.
