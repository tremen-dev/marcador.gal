---
id: EPIC-MEJORA
tipo: epica
estado: borrador
historial:
  - {estado: borrador, fecha: 2026-09-01, por: sdd-producto}
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

## Inventario al 2026-09-01

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

**Cuatro de las cinco son barreras que no muerden, no funciones que faltan.** Es
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
- **Arreglar nada hoy.** Ninguna de las cinco entradas bloquea EPIC-003 ni la
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
