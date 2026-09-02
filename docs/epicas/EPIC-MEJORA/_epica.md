---
id: EPIC-MEJORA
tipo: epica
estado: aprobada
historial:
  - {estado: borrador, fecha: 2026-09-01, por: sdd-producto}
  - {estado: aprobada, fecha: 2026-09-01, por: Alberto Fojo}
aprobada-por: Alberto Fojo
---
# EPIC-MEJORA — Mejoras y deuda técnica

> Nace el 2026-09-01 porque **no existía y se estaba usando igualmente**. El
> hallazgo es de `/sdd-arquitecto` al especificar SPEC-006: seis artefactos
> —desde el ledger de SPEC-001, cerrado hace días— rutaban trabajo «a
> EPIC-MEJORA», y EPIC-MEJORA no era un directorio, ni una entrada del roadmap,
> ni una fila del tablero. Era **un buzón sin buzón**: todo lo mandado ahí estaba
> de hecho enterrado en ledgers de specs cerradas, que nadie relee.

## Objetivo

Ser el destino **real** de la deuda técnica que las specs deciden no arreglar en
su propio alcance: un sitio donde un hallazgo aplazado siga siendo visible
después de que su spec se cierre.

**Lo que esta épica arregla no es ninguno de los findings: es que se pierdan.**
Aplazar bien es sano —ampliar el alcance de una spec por conveniencia es cómo se
degrada la disciplina que ha sostenido EPIC-003—, pero aplazar a un sitio que no
existe es lo mismo que olvidar, con mejor conciencia.

## Criterios de éxito

Esta épica no se cierra: es un bucket y vive mientras viva el proyecto. Cumple su
función cuando son verdad las tres cosas:

1. **Ningún ledger ruta a un destino inexistente.** Si una spec escribe «destino
   EPIC-MEJORA», aquí hay una entrada que lo recoge.
2. **Cada entrada dice qué la despierta.** Un finding sin disparador es un
   finding olvidado con otro nombre. El disparador puede ser una fecha, una spec
   futura, o un hecho («el día que haya CI»).
3. **Lo que sube de aquí, sube por su valor**, no por antigüedad. Nada asciende a
   *Ahora* sin aportar evidencia para el go/no-go o desbloquear algo con plazo.

## Inventario actualizado al 2026-09-03

Todo lo que hoy estaba rutado aquí y vivía solo dentro de ledgers. Los IDs son
los originales: **no se renumeran**, para que el rastro desde su spec siga
funcionando.

| Finding | Qué es | Disparador |
|---|---|---|
| **F-SPEC-004-3 · F-SPEC-005-4** | **No hay CI.** El gate de calidad solo corre en local, así que nadie lo pasa por ti. Y desde SPEC-005 muerde más: `/robot` publica RN-11 como compromiso **auditable por terceros con sus propios registros**; si `src/mirror/` deja de cumplirlo, no es un test en rojo, es **una mentira publicada**. | El día que exista una segunda persona tocando el repositorio, o antes si se corre una ventana real. Es el que más sube de valor con el tiempo |
| **F-SPEC-005-V2** (primer riesgo) | **La purga de 30 días no tiene ejecutor.** No hay nada en `src/raw/`, `src/db/` ni `migrations/`; `retention.ts` solo **declara** fechas en el informe, sin consultar la hora. Es compromiso manual, publicado en `/robot`, y el reloj **arranca al terminar una ventana que aún no se ha corrido**: se activará en silencio | El fin de la primera ventana de observación. **Ese día empieza a correr un plazo publicado** |
| **F-SPEC-004-9 · F-SPEC-005-2** | **La permanencia de las URL no la vigila ningún test.** Renombrar `PROJECT_PATH.gl` no pone rojo nada: las aserciones comparan la constante consigo misma. ADR-010 §5 dice que estas URL **no se mueven nunca**. `CRAWLER_PATH` sí quedó fijado con literales en SPEC-005 | Cualquier trabajo que toque rutas del sitio. La barrera correcta es **una sola sobre las cuatro URL**; escribirla a trozos es cómo llegó a estar a medias |
| **F-SPEC-004-7** | **Las barreras de contenido miran un HTML que no es el que se sirve.** `pages.test.ts` afirma sobre `renderToStaticMarkup`, no sobre la salida real. Hoy no hay diferencia que importe, pero un `metadata` con `openGraph`, un favicon remoto o un script en un layout futuro **entrarían sin poner nada rojo** | La primera vez que se añada `metadata`, un favicon o un script a un layout |
| **F-SPEC-005-V3** | **La legibilidad a 360 px no se ha visto en un navegador.** Aquí no hay Playwright y el único MCP de navegador exige que una persona elija. Se cerró por lectura de la hoja de estilo, que es argumento sólido pero **no es una captura** | Cualquier cambio de maquetación, o el día que haya un entorno con navegador automatizable |
| **F-SPEC-006-1** | **El gate `require-spec` no admite que una rama lleve dos specs.** `parseSpecId` deduce la spec **solo** del nombre de rama; en `ft/SPEC-005-…` resuelve SPEC-005, que está `hecho`, y **deniega todo `Write`/`Edit`** sobre `src/` y `tests/` aunque la spec en curso esté aprobada — nunca llega a mirarla. Rodearlo con `bash` funciona, pero se pierde también el `PostToolUse` de calidad | La próxima vez que dos specs compartan rama. **No es hipotético: pasó el 2026-09-01 con SPEC-006**, por una razón de despliegue que volverá a darse |
| **F-SPEC-006-3** | **La segunda capa de esa defensa no existe.** La cabecera de `core/lib/require-spec.mjs` dice que la regla la invocan **dos** capas —el hook L1 y un `pre-commit` L2 en `tools/githooks/pre-commit.mjs`—, y ese fichero **no está ni en el repositorio ni en el plugin**; `.git/hooks` solo tiene `.sample` y `core.hooksPath` está sin configurar (verificado el 2026-09-01). Cuando el L1 se esquivó **no había nada detrás**: los commits entraron sin que nada reevaluara la regla. **Corrección al hallazgo original:** no es instalar un hook, es que **nunca se escribió**, y es del plugin `tremen-sdd`, no solo de este repositorio | Antes de que haya una segunda persona commiteando. Va con F-SPEC-004-3: son la misma ausencia de red |
| **F-SPEC-007-10** | **Que la página no hable en primera persona del singular no lo vigila nadie.** El anonimato de ADR-012 no vive solo en la ausencia del nombre: el texto dice «e respondemos» en plural y `non se rastrexa` impersonal, y **no hay una sola primera persona del singular** en las cuatro rutas (medido: `eu`, `yo`, `fago`, `hago`, `respondo`, `teño`, `quero`, `escribo`, `soy`… → cero). Un futuro «respondo» o «fago» **rompería ADR-012 §1 sin tocar ningún nombre**, con las barreras de `identity` en verde | La primera spec que escriba texto visible nuevo. Es una barrera, no un arreglo |
| **F-SPEC-007-7** | **El guardián del alcance de la lista negra tiene un camino abierto.** Vigila la *entrada* que lee el caso 18 de `crawler-page.test.ts`, no su cuerpo: escribir el ensanche **dentro** del caso 18 deja 18 y 19 en verde. Cerrarlo exige extraer la entrada a una constante compartida, es decir tocar un fichero de SPEC-005, que está `hecho`. Todos los demás caminos están cubiertos y verificados | Cualquier trabajo que ya tenga que tocar `crawler-page.test.ts` por otro motivo |
| **F-SPEC-007-9** | **El caso 16 cuenta apariciones, no URL distintas**, que es lo contrario de lo que dice SPEC-007 CA-2.4. Hoy no produce ningún RED falso porque su entrada es `renderToStaticMarkup` y la copia RSC solo existe en el HTML servido. Desviación hacia el lado estricto. **Arreglo de una línea**: `[...new Set(absolute)]` | El día que ese test pase a mirar el HTML servido, o cualquier trabajo que toque `pages.test.ts` |
| **F-SPEC-007-6** | **El paraguas puede caerse y nadie se entera.** `marcador.gal` ya no nombra a nadie: dice que es un proyecto de tremen.dev y enlaza allí. Si ese enlace deja de responder, la página queda **sin nombre y sin paraguas** —solo el buzón— y **ningún test lo detecta**, porque la suite no sale a la red. Es la dependencia de un sitio fuera del repositorio que ADR-012 asume por escrito | Cualquier verificación futura del sitio, o el día que haya CI que pueda hacer una petición de salida |
| **F-SPEC-010-3** | **El caso cruzado de «un partido por jornada» solo lo cierra el cargador.** La base de tests de `tests/db/_harness.ts` lo viola a propósito (ADR-017 §3) y SPEC-010 CA-4.9 prohíbe tocarlo; ningún `CHECK` en Postgres lo vigila. Si alguien inserta partidos directamente por SQL, el cargador los rechazará pero la base los albergará. | Cualquier trabajo que toque `_harness.ts` o la primera vez que alguien inserte partidos por SQL fuera del cargador |
| **F-SPEC-010-4** | **Fichero cargado vs. copia en `calendario/` sin vigilancia.** `calendar_loads.file_digest` permite detectar divergencia, no vigilarla. Si el fichero versionado cambia sin recargar, nadie se entera. | El día que haya CI (junto a F-SPEC-004-3 · F-SPEC-005-4) |
| **F-SPEC-010-6** | **`postgres.js` serializa mal un array JS en la primera sentencia de una conexión nueva.** Medido en SPEC-010 CA-8.5: dos `connect()` frescos dan `column "supporting_observation_ids" is of type text[] but expression is of type text`. Resuelto en SPEC-010 con literales en `src/db/arrays.ts`. Queda fuera: `tests/db/rn12`, `rn13`, `ca19`, `scores` siguen usando `sql.array` porque no es su primera sentencia. | Cualquier código de `src/` que pase un array JS como parámetro a `postgres.js` |
| **F-SPEC-010-7** | **La rama de Neon de `DATABASE_URL_TEST` se comparte entre worktrees.** Dos `test:db` concurrentes se corrompen: un proceso ve `relation "competitions" does not exist` de otro que hizo `drop schema`. Mitigación: comprobar `ps aux | grep vitest.mjs` antes de ejecutar. | Dos specs con base implementándose en paralelo; disparador de infraestructura: una rama de Neon por worktree o cerrojo en `tests/db/_harness.ts` |
| **F-SPEC-010-8** | **`src/calendar/cli.ts` importa `registerProjectResolution` de `src/mirror/cli/node-resolve.ts`.** El hook de resolución para `@/…` vive en el directorio del instrumento de SPEC-002, que no es su domicilio neutro. Esta spec no lo mueve (sería tocar SPEC-002, `hecho`, sin motivo suyo). | El tercer CLI fuera de `src/mirror/`: mover `node-resolve.ts` a un `src/cli/` o similar |
| **F-SPEC-010-11** | **`PostgresMatchStore` devuelve objetos no congelados; los otros dos repositorios sí.** `MatchSchema` (SPEC-001) no termina en `.readonly()` y `ObservationSchema`/`DecisionSchema` sí. CA-9 solo exige «todo sale por `MatchSchema.parse`»; CA-7.1 sí exige congelado. No es incumplimiento: es asimetría heredada del modelo canónico, fuera del alcance de SPEC-010. | La primera spec que toque `src/model/match.ts` o que necesite mutar un `Match` leído |
| **F-SPEC-010-12** | **Un instante con más de tres decimales se trunca a milisegundos en silencio.** `InstantSchema` acepta `2026-09-06T15:46:00.123456Z`; `storedForm` lo convierte y se escribe/se lee `…:00.123Z`. Coherente con el conversor de `createClient` que ya perdía microsegundos. Ningún CA lo contradice y ningún productor actual emite más de tres decimales (`toISOString`). | Una fuente o un `Clock` que emita instantes con precisión mayor que el milisegundo |
| **F-SPEC-012-2** | **El borde exacto `kickoff = t + PRE` no entra en la consulta, sí en el predicado.** La spec fija la consulta literal `listKickoffsBetween(t − POST, t + PRE)`, cuyo intervalo es `from ≤ kickoff < to` (SPEC-010): un partido con `kickoff` exactamente igual a `t + PRE` es elegible para la función pura de CA-1 pero la consulta de ese tick no lo trae; entra en el tick siguiente (60 s después, aún 9 min antes del kickoff). Efecto máximo: un tick de retraso en el instante exacto de apertura de ventana, con reloj a granularidad de minuto. | Especificar si el comportamiento actual es el querido, o cerrar el borde con `+1 ms` en el `to` |
| **F-SPEC-013-10** | **Carrera entre dos suites de specs cerradas.** `tests/polite/architecture.test.ts` caso 2d escribe un fichero real bajo `src/` y lo borra en su `finally`, mientras cualquier caso que enumere `src/` por `tests/site/source-scan.ts` puede pillarlo en medio. Manifestado tres veces con tres víctimas distintas (`tests/site/contact.test.ts`, `tests/site/title-source.test.ts`, `tests/polite/evasions.test.ts`); el verificador lo reprodujo también en `main` (1 de cada 5 ejecuciones); en la rama SPEC-013, 2 de 8. | Ya cuesta gates y ha dejado de ser argumento. Subir a *Ahora*. |
| **F-SPEC-013-11** | **La capacidad se puede obtener de la API pública del propio motor, y los tres gates no lo ven.** `composeCyclePorts(input).decisions.append(decision)` pasa todos los gates sin usar los tres nombres vigilados. El fichero no importa `PostgresDecisionStore`, `DecisionVersionConflictError` ni `DecisionStore`, así que la letra de CA-13 es cierta. Es un residuo de la familia de CA-13.3: el módulo no recibe la capacidad por inyección, la **obtiene** de la superficie exportada de un escritor declarado. | La próxima spec que toque `src/decide/cycle.ts` o el día que `composeCyclePorts` deje de ser superficie pública. La alternativa: que la letra de CA-13.3 nombre este residuo con los otros dos. |
| **F-SPEC-013-12** | **El resolvedor del mecanismo de RN-08 no es el del compilador, y ante un especificador que no sabe colocar se calla en vez de fallar cerrado.** `@/db/decisions.js` resuelve bien en TypeScript pero `moduleOf` devuelve `null` porque no implementa la sustitución `.js` → `.ts` del compilador. Un `null` que significa «no sé colocarlo» y un `null` que significa «es un paquete» son el mismo valor. Ejemplo: `import * as d from '@/db/decisions.js'` con acceso computado `d[key]`. | Cualquier spec que toque `tests/decide/support/rn08.ts` o `tests/mirror/support/imports.ts`. El arreglo: que `moduleOf` distinga los dos casos y que el mecanismo del nombre mire también `kind === 'computed'`. |
| **F-SPEC-013-13** | **El «control positivo» de CA-14.3 no controla nada, y el veneno no alcanza la forma en que este repositorio lee el reloj.** El caso 7 envena `Date.now` pero `new Date()` no lo usa; `new Date()` es exactamente cómo SPEC-013 lee el reloj. La pureza es cierta (verificada por grep), pero hoy la sostiene un grep, no un guardián. | La próxima spec que toque `src/decide/replay.ts` o que necesite demostrar pureza de nuevo. El veneno correcto es el de `new Date`, no el de `Date.now`. |
| **F-SPEC-015-9** | **El sistema de diseño dice *Directo* donde el producto dice *En xogo*.** El gate fijó el 2026-09-03 que `live` se dice de **una** sola manera, *En xogo*, en toda superficie (`docs/fundacion/dominio.md`, SPEC-015). `docs/diseno/` usa *Directo* como etiqueta de filtro en **siete** ficheros —`_logic.js`, `Componentes.dc.html`, `Escritorio.dc.html`, `Global.dc.html`, `Movil.dc.html`, `canvas.json` y `sistema-de-deseno-marcador-gal.html`; medido el 2026-09-03, y los `.dc.html` los genera `build.mjs` desde `.tpl.html` + `_logic.js`, así que el origen real son menos— y **EPIC-004 está congelada**, así que no se tocan hoy. No es un fallo del sistema de diseño: es una decisión posterior que lo desalinea | **El día que se construya la interfaz del marcador**, que es cuando esos literales dejan de ser un mockup y pasan a ser texto visible. Se arregla con el descongelado de EPIC-004, no antes |
| **F-SPEC-013-14** | **Inventario de ocho aserciones que no pueden fallar**, levantadas en la reverificación de CA-13. Ninguna deja un subpunto sin cubrir donde no haya otra aserción que sí mida, salvo una (el control de que `ALL_ROLES` sea exacto) cubierta por lectura del código. Afectan `tests/decide/rules-qualification.test.ts` (líneas 185, 196, 321–325), `tests/decide/roles.test.ts` (81, 97–101), `tests/decide/rules-conflict.test.ts` (126, 212) y `tests/decide/thresholds.test.ts` (80–103). | Cualquier spec que toque esos cinco ficheros de `tests/decide/`. Se arreglan de una vez porque son la misma clase de deuda. |


**Nueve de las once son barreras que no muerden, no funciones que faltan.** Es
el patrón de esta deuda y conviene verlo: el proyecto tiene tests que comprueban
cosas ciertas y aún no comprueban que sigan siéndolo.

**Aviso para quien recoja esto:** el inventario se hizo sobre los ledgers de
SPEC-001, SPEC-003, SPEC-004, SPEC-005 y SPEC-006. **No se recorrieron uno a uno
todos los findings de SPEC-004**, que es el ledger más largo del proyecto. Quien
escriba la primera spec de esta épica debería releerlo entero antes.

## Alcance

**Dentro:** recoger, mantener y priorizar deuda técnica aplazada por otras
specs; escribir las specs que la resuelvan cuando su disparador llegue.

**Fuera (aparcado a propósito, no por descuido):**
- **Arreglar nada hoy.** Ninguna de las once entradas bloquea EPIC-003 ni la
  carta a la RFGF. Crear la épica y vaciarla el mismo día sería cambiar un
  problema de visibilidad por uno de prioridad.
- **Los bugs**, que son de `EPIC-FIX`; **la infraestructura**, de `EPIC-INFRA`;
  **el mantenimiento rutinario**, de `EPIC-MANT`. Esta épica es para lo que
  funciona y podría funcionar mejor.
- **La retención de producción** (F-SPEC-005-V2, *segundo* riesgo). No es deuda
  técnica sino una política sin fijar: es **ADR**, y su disparador está escrito
  en los riesgos de EPIC-003 — la primera spec que persista datos en producción
  no se aprueba sin él.

## Specs

<!-- El estado por spec vive en el frontmatter de cada spec; el tablero agregado se regenera con /sdd-tablero (docs/tablero.md). No mantengas listas de specs a mano aquí. -->

Ninguna, y es lo correcto hoy: el inventario de arriba es el entregable de esta
épica en su primer día.

## Riesgos

- **Que se convierta en el mismo agujero con nombre propio.** Un bucket sin
  disparadores es un cementerio ordenado. Por eso el criterio de éxito 2 exige
  que cada entrada diga qué la despierta, y por eso la tabla tiene esa columna.
- **Que absorba trabajo que debería bloquear una spec.** Rutar aquí es una
  decisión, no un descarte: si un finding hace falsa una afirmación publicada,
  no es deuda, es un fallo, y va a `EPIC-FIX` o a la spec que lo causó.
- **Que nadie la mire.** No tiene plazo externo ni gate que la fuerce. La
  defensa prevista es el criterio 1: cuando una spec vaya a rutar aquí, quien la
  escriba tiene que encontrar la entrada, y si no está, añadirla.
