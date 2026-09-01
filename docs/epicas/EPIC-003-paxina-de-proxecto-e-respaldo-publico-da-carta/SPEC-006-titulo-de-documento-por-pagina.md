---
id: SPEC-006
tipo: spec
epica: EPIC-003
estado: en-revision
aprobada-por: Alberto Fojo
historial:
  - {estado: borrador, fecha: 2026-09-01, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-09-01, por: Alberto Fojo}
  - {estado: en-progreso, fecha: 2026-09-01, por: sdd-implementador}
  - {estado: en-revision, fecha: 2026-09-01, por: sdd-implementador}
---
# SPEC-006 — Título de documento por página

## Problema

**`/robot` se presenta como «O proxecto».**

El técnico de la RFGF recibe la carta, ve el user-agent
`marcador.gal/0.0.1 (+https://marcador.gal/robot; medicion de latencia)`, abre
esa dirección — y la pestaña de su navegador le dice **«O proxecto —
marcador.gal»**. En castellano, «El proyecto — marcador.gal». La página del
rastreador hereda el título de la página de proyecto.

| Ruta | `<title>` servido hoy | El que le corresponde |
|---|---|---|
| `/proxecto` | `O proxecto — marcador.gal` | ese |
| `/robot` | `O proxecto — marcador.gal` | el del rastreador |
| `/es/proxecto` | `El proyecto — marcador.gal` | ese |
| `/es/robot` | `El proyecto — marcador.gal` | el del rastreador |

Está **medido, no deducido**: `sdd-verificador` lo comprobó sobre el servidor
real y lo registró como **F-SPEC-005-1**; yo lo he vuelto a reproducir desde
cero sobre un `next build` de esta rama (ver *Diseño*, punto 0). El HTML
archivado en `_qa/SPEC-005/servido-gl-robot.html` lo enseña en claro.

**No es cosmética, y el motivo es exactamente el de EPIC-003.** La épica existe
para que la carta *«no quede desmentida por su propio enlace»*, y su público
objetivo no es una audiencia: es **una persona**, el técnico que decide si esto
es serio. El título del documento es lo primero que esa persona lee — antes que
el `<h1>`, porque la pestaña se pinta antes de que llegue el cuerpo, y es lo que
queda si guarda el enlace en marcadores o lo pega en un correo interno. Una
página que se anuncia como otra cosa es un traspié de credibilidad justo en el
único sitio donde la credibilidad es el producto.

Y es un **hueco de la propia épica**: entre sus criterios de éxito está *«Galego
por defecto, castellano opcional — D-2, literales en ficheros de i18n desde el
primer día, dictamen de `/sdd-lingua` sobre todo el texto visible»*. El título es
texto visible en galego y en castellano; hoy sale de un bundle, pero **del bundle
equivocado**, y su versión del rastreador **no existe** en ninguna lengua.

Reglas implicadas: **D-2** de `FOUNDATION.md` (galego por defecto, castellano
opcional, literales en i18n y nunca incrustados). No hay ninguna RN-xx en juego:
esto no toca ingesta, ni decisión, ni datos.

## Usuarios / roles afectados

- **El técnico de la RFGF.** El mismo lector único de SPEC-005, y la razón de que
  esta corrección vaya **antes** de mandar la carta y no después.
- **Cualquiera que llegue a `/robot` desde un log.** Ve el título en la pestaña y
  en el historial antes que ninguna otra cosa de la página.
- **`/sdd-lingua`**, consultivo y **bloqueante para el cierre**: los cuatro
  títulos son texto visible al usuario, en las dos lenguas (CA-5). Igual que en
  SPEC-004 CA-12 y SPEC-005 CA-12, no lo puede pedir `sdd-implementador`.
- **`sdd-verificador`**: CA-4 en particular, que es el que impide que arreglar un
  título rompa dos specs cerradas.
- **Alberto Fojo**: aprueba, y decide en el gate las dos preguntas de abajo.

## Diseño

### 0. La causa que dio el implementador: confirmada la premisa, desmentida la conclusión

El implementador de SPEC-005 dejó escrito, en la cabecera de
`src/i18n/crawler-bundle.ts`, que *«`<title>` lo emite `SiteDocument`, que es un
root layout y no puede recibir nada de la página que envuelve. Arreglarlo
significa mover `<title>` fuera del documento y **a cada página**»*.

**La premisa es cierta y la he comprobado**: `src/site/document.tsx` emite
`<title>{siteBundle(locale).documentTitle}</title>` y solo recibe `locale` y
`children`; los dos root layouts (`src/app/(gl)/layout.tsx`,
`src/app/(es)/layout.tsx`) le pasan una constante literal. Un root layout de App
Router no puede leer nada de la página que envuelve. De ahí que las cuatro rutas
compartan un único título.

**La conclusión no lo es.** No hace falta mover ningún `<title>` de JSX a ninguna
página: el framework ya decidido en ADR-001 tiene un mecanismo de primera clase
para exactamente esto — **cada `page.tsx` exporta sus propios metadatos** y Next
los emite en `<head>`. No se escribe un `<title>` en ninguna parte; se declara un
dato. La diferencia importa porque decide el diseño: la alternativa que el
implementador imaginaba —un `<title>` de JSX en cada página— reintroduce a mano
lo que F-SPEC-005-V4 señala, y esta no.

**Medido, no supuesto.** Sobre una copia aislada del árbol de esta rama
(`git archive HEAD`, sin `checkout`, `node_modules` clonado; el árbol real quedó
intacto y `git status` vacío antes y después), con `npx next build`:

| Comprobación | Resultado |
|---|---|
| Antes: título de las cuatro rutas | las cuatro dicen «O proxecto» / «El proyecto» — **defecto reproducido** |
| Después: título de las cuatro rutas | `/proxecto` y `/es/proxecto` intactos; `/robot` y `/es/robot` sirven el suyo |
| ¿El título acaba en `<head>`? | **sí**, y no queda ningún `<title>` después de `</head>` |
| `/proxecto` y `/es/proxecto`: `<head>` | **idéntico byte a byte**, `<title>` incluido y en la misma posición |
| `/proxecto` y `/es/proxecto`: marcado de `<body>` | **idéntico byte a byte** (1 735 y 1 775 bytes) |
| Suite completa, `typecheck`, `oxlint --type-aware` | **verdes, sin tocar un solo test de SPEC-004 ni de SPEC-005** |

### 1. El título es un dato de la página, no marcado del documento

`SiteDocument` deja de emitir `<title>`. Cada una de las cuatro rutas declara el
suyo desde su propio módulo, tomándolo de i18n. El shell del documento vuelve a
ser lo que su cabecera dice que es —el único sitio donde una lengua se convierte
en `<html lang>`— y deja de decidir por páginas que no conoce.

**Quitar el `<title>` de `SiteDocument` no es opcional, es forzoso, y eso está
medido también:** si se dejan los dos mecanismos a la vez, el HTML servido de
`/robot` sale con **dos `<title>`**, y el primero —el que gana en el navegador—
es el equivocado. El defecto sobreviviría al arreglo. Por eso este movimiento
toca código de SPEC-004 por necesidad y no por comodidad, y por eso CA-4 existe.

### 2. Los títulos viven en un espacio de nombres propio de i18n

Ni en `SiteBundle` ni en `CrawlerBundle`: en uno nuevo, con su contrato
compartido por las dos lenguas y una clave por página.

**El argumento es el que ya está escrito en el repositorio**, en la cabecera de
`src/i18n/crawler-bundle.ts`: el namespace del rastreador se separó del del sitio
porque *«los tests de paridad y presencia de la página de proyecto recorren cada
clave del namespace del sitio; meter ahí claves de otra página haría falsa esa
aserción»*. Un título es el caso extremo de eso: **no se sirve en el cuerpo de
ninguna página**, así que ningún test de presencia sobre el HTML lo va a
encontrar nunca.

**Y también está medido.** Con `documentTitle` mantenido dentro de `SiteBundle`,
`tests/site/pages.test.ts` casos **2 y 5** se ponen **rojos** —«todo el texto
visible de `/proxecto` sale del bundle `gl`»— porque la clave sigue en el
namespace y ya no aparece en el marcado. Arreglarlo por ahí obligaría a **añadir
una excepción a un test de SPEC-004**, es decir a aflojar una barrera de una spec
cerrada y verificada. Sacando los títulos a su propio namespace, esos dos tests
**no se tocan y siguen verdes**: la barrera sigue mordiendo exactamente igual.

### 3. La lengua sigue viniendo de la ruta, no del cliente

Cada ruta declara su título con su lengua fijada en el código, como ya hace con
su `locale`: `/robot` es galego y `/es/robot` es castellano (D-2, SPEC-004
§Diseño). No se resuelve nada en tiempo de ejecución y no hay negociación de
idioma. Nada de esto añade JavaScript, ni peticiones, ni fuentes: el sitio sigue
sin pedirle nada a nadie (SPEC-004 CA-10).

## Criterios de aceptación

- **CA-1 (cada ruta sirve su propio título, y el del rastreador no es el del
  proyecto)**: Dadas las cuatro rutas del sitio, cuando se renderizan, entonces
  cada una emite un `<title>` que es **el valor de su propia clave de i18n**, y
  los cuatro títulos son **distintos entre sí dos a dos**. En particular
  `/robot` **no** sirve el título de `/proxecto` ni `/es/robot` el de
  `/es/proxecto` — que es el defecto F-SPEC-005-1, escrito como aserción.
  **Test**: importa los cuatro módulos de ruta —por su ruta literal, los cuatro
  nombrados uno a uno— y compara el título declarado por cada uno contra la clave
  del bundle que le toca; y comprueba que el conjunto de los cuatro títulos tiene
  cuatro elementos. **Verificador**: los cuatro `<title>` sobre el HTML realmente
  servido, no solo sobre el módulo. La barrera muerde: intercambiar la clave
  entre `/robot` y `/proxecto` tiene que poner rojo el caso.

- **CA-2 (el título es texto de i18n, y ningún escaneo lo deja pasar
  incrustado)**: Dado el código fuente de `src/app/` y `src/site/`, cuando corre
  la suite, entonces **ningún título declarado por una ruta es una cadena escrita
  a mano**: sale de una función del espacio de nombres de i18n. **Este CA no es
  una repetición de SPEC-004 CA-5, es su hueco**: el escaneo de
  `tests/site/no-hardcoded-literals.test.ts` busca texto en JSX y literales en
  atributos visibles (`title=`, `alt=`, `content=`…), y un título declarado como
  dato —`title: 'algo'`, con dos puntos y no con igual— **pasa por debajo de las
  tres reglas**. Comprobado leyendo el fichero. **Test**: en un fichero nuevo,
  reutilizando el ayudante compartido `tests/site/source-scan.ts`, falla si en
  los módulos de ruta aparece un título literal. La barrera muerde: escribir
  `'O rastrexador — marcador.gal'` a mano en una ruta tiene que ponerlo rojo.

- **CA-3 (los títulos, en su propio espacio de nombres, con paridad de lenguas)**:
  Dado el mecanismo de i18n, cuando corre la suite, entonces (a) existe un
  contrato de títulos —un tipo— que **las dos lenguas satisfacen**, de forma que
  añadir una página y olvidar una lengua es un fallo de `npm run typecheck` y no
  una pestaña vacía; (b) las dos lenguas tienen **exactamente las mismas claves**
  y ninguna vacía, con un test en tiempo de ejecución, como ya hace
  `tests/site/i18n.test.ts` con el namespace del sitio; y (c) el namespace del
  sitio **ya no contiene el título**, de modo que los casos 2 y 5 de
  `tests/site/pages.test.ts` siguen recorriendo solo texto que de verdad se
  sirve. La barrera muerde: quitar una clave de una lengua tiene que romper el
  `typecheck`.

- **CA-4 (no se rompe nada de SPEC-004 ni de SPEC-005, y se demuestra)**: Dado
  que este cambio **toca código de SPEC-004** —`src/site/document.tsx`, los
  bundles y las dos rutas de proyecto—, cuando termina, entonces:
  1. `npm run test`, `npm run typecheck` y `npm run lint` pasan **enteros**;
  2. **ningún fichero de test de SPEC-004 ni de SPEC-005 se modifica**: acotado a
     `tests/`, el diff **contra el commit de SPEC-005 anterior a esta spec** —no
     contra `main`, ver nota 7 del gate— no devuelve ningún fichero ya existente;
     lo nuevo de esta spec va en **ficheros nuevos**. Si al implementar resulta
     imposible, es un **RED** y una vuelta al arquitecto, no una excepción
     añadida a mano;
  3. el HTML servido de `/proxecto` y de `/es/proxecto` es, frente al del árbol
     de SPEC-005, **idéntico byte a byte en `<head>` y en el marcado de
     `<body>`**, `<title>` incluido y en la misma posición. Solo pueden diferir
     el `buildId` de Next —que cambia en cada build y no es contenido— y la carga
     RSC en línea, donde el nodo del título cambia de sitio. **Es alcanzable: lo
     he medido** (Diseño, punto 0). Precedente exacto de la comprobación: la
     sección «Regresión sobre SPEC-004» del ledger de SPEC-005, con
     `git archive` y sin `checkout`.

- **CA-5 (dictamen de `/sdd-lingua`, bloqueante para el cierre)**: Dados los
  **cuatro** títulos, cuando la spec pide pasar a `hecho`, entonces el ledger
  contiene el dictamen de `/sdd-lingua` sobre los cuatro, con fecha y con cada
  observación **aplicada o justificada una a una**. Sin él la spec no cierra.
  Alcance del dictamen, dicho para que no se estire: los dos títulos nuevos del
  rastreador, y la confirmación de que los dos de proyecto siguen valiendo tal
  cual al mudarse de espacio de nombres. Es la misma cláusula que SPEC-004 CA-12
  y SPEC-005 CA-12, y por la misma razón: es texto visible al usuario (D-2).

- **CA-6 (F-SPEC-005-V4 cerrado: no queda ningún `<title>` en el cuerpo)**: Dado
  el código de `src/site/` y `src/app/`, cuando corre la suite, entonces **no
  aparece ningún elemento `<title>` en JSX**; y sobre el HTML servido de las
  cuatro rutas, el `<title>` está dentro de `<head>` y **no hay ninguno después
  de `</head>`**. Esto cierra F-SPEC-005-V4 y **no es un extra**: sin quitar el
  `<title>` de `SiteDocument`, el HTML sale con **dos** títulos y el primero —el
  que gana— es el equivocado, así que el defecto sobreviviría al arreglo. Nota de
  honestidad para el ledger: hoy V4 es un problema **del fuente, no del HTML
  servido**; React iza el `<title>` a `<head>` y por eso nunca rompió nada
  observable (se ve en `_qa/SPEC-005/servido-gl-robot.html`). Se arregla porque
  el diseño lo obliga, no porque estuviera doliendo.

## Entidades y reglas afectadas

- **D-2** de `FOUNDATION.md`: galego por defecto, castellano opcional, literales
  en i18n y nunca incrustados. Es la única decisión constitucional en juego.
- **ADR-001** (Next.js App Router): el mecanismo de metadatos por página es del
  framework ya decidido. Esta spec **no elige stack** y no necesita ADR nuevo.
- **ADR-010 §5**: las cuatro direcciones no se mueven. Esta spec **no toca
  ninguna ruta ni ninguna redirección**; solo añade un dato a cada módulo.
- **SPEC-004**: aporta `src/site/document.tsx`, el mecanismo de i18n y las dos
  rutas de proyecto. Esta spec le quita el `<title>` al documento y le mueve una
  clave de bundle. **Está `hecho`: CA-4 es lo que separa esto de romperla.**
- **SPEC-005**: aporta `/robot`, `/es/robot` y el namespace `crawler`. Esta spec
  **no toca su texto**, ni su user-agent, ni sus rutas: le añade un título que
  vive fuera de su namespace. Cierra sus hallazgos F-SPEC-005-1 y F-SPEC-005-V4.
- **No toca** `src/mirror/`, `src/model/`, `src/db/` ni `migrations/`. Cero
  migraciones. Cero cambios en `next.config.ts`.

## Fuera de alcance

- **`PROJECT_PATH` sin aserción literal (F-SPEC-004-9 / F-SPEC-005-2).** Sigue
  abierto y **esta spec no lo cierra**, dicho por escrito para que no se dé por
  hecho. Destino: **EPIC-MEJORA**, **decidido por Alberto Fojo el 2026-09-01** en
  el gate (nota 2). Razón: es una barrera sobre la **permanencia de las URL del
  sitio** —ADR-010 §5, que cubre las cuatro direcciones—, no sobre títulos;
  escribirla aquí la dejaría a medias otra vez, cubriendo las dos rutas que este
  arreglo toca y no el conjunto que el ADR protege.
- **La retención de producción (F-SPEC-005-V2, segundo riesgo).** No es materia
  de spec y no entra aquí. Destino: **ADR nuevo**. Ver la nota 3 del gate.
- **Descripciones, `og:`, `twitter:`, canónicas, `hreflang`, favicon,
  `sitemap.xml`.** Es la deriva obvia: en cuanto una página declara metadatos,
  apetece declararlos todos. Nada de eso lo pide EPIC-003, nada de eso lo lee el
  destinatario de la carta, y `og:` es material de la landing de `marca.md`, que
  sigue aparcada. **Esta spec añade títulos y nada más.**
- **Cambiar el texto de `/proxecto` o de `/robot`.** Ni una palabra del cuerpo.
  Los dos títulos de proyecto se mudan de sitio **con su valor intacto**.
- **Tocar rutas, redirecciones, `robots.txt` o el user-agent.** Nada de eso.
- **CI.** F-SPEC-004-3 / F-SPEC-005-4 siguen abiertos y siguen en EPIC-MEJORA.

## Notas para el gate humano

1. **Esto toca código de una spec cerrada, y no hay forma de evitarlo.** El
   `<title>` de `SiteDocument` es de SPEC-004 y **hay que quitarlo**: dejarlo
   sirve dos títulos y el equivocado gana. Lo que sí se puede garantizar, y está
   escrito como CA-4, es que **el HTML de `/proxecto` no cambia** y que **ningún
   test existente se modifica**. Lo he medido antes de escribir el CA, así que no
   te estoy pidiendo que apruebes una esperanza. Si al implementar hiciera falta
   tocar un test de SPEC-004, la instrucción es **parar**, no negociar.

2. **DECIDIDO — `PROJECT_PATH` NO sube a esta spec. Alberto Fojo, 2026-09-01.**
   Era la única pregunta abierta del gate y ya no lo es: la aserción literal de
   `PROJECT_PATH` (F-SPEC-004-9 / F-SPEC-005-2) **se queda fuera de SPEC-006** y
   su destino sigue siendo **EPIC-MEJORA**.

   **El argumento por el que la decisión es buena, y no un aplazamiento:** hoy
   renombrar `/proxecto` no pone rojo ningún test, mientras `/robot` sí quedó
   fijado con literales en SPEC-005, y ADR-010 §5 dice que **ninguna de las
   cuatro** direcciones se mueve nunca. La barrera correcta es por tanto **una
   sola, sobre las cuatro URL**. Escribirla aquí cubriría otra vez solo las dos
   que este arreglo toca — y escribirla a trozos es exactamente cómo llegó a
   estar a medias. Que costara cinco líneas era cierto y **no era la razón para
   meterla**: barato no es lo mismo que en su sitio.

   **Lo que esto deja pendiente, dicho para que no se pierda:** el hueco sigue
   abierto y sin barrera hasta que EPIC-MEJORA lo recoja. No lo cubre ningún CA
   de esta spec, ni siquiera de refilón.

3. **F-SPEC-005-V2 es un ADR, y su momento NO es antes de la carta.** El riesgo
   es real: ADR-009 fija la retención del archivo de **medición** y deja **sin
   fijar la de producción**; `/robot` promete el plazo **en general**, así que el
   día que exista producción con otro plazo **la página se vuelve falsa sola**,
   sin que nadie la edite y sin que ningún test se entere. Es la clase de defecto
   que da miedo, porque no depende de que nadie olvide nada. **Mi criterio, en
   tres partes:**
   - **Es ADR, no spec.** Fija una política que constriñe trabajo futuro; no hay
     nada que implementar hoy.
   - **Pero escribirlo hoy sería inventar.** No hay producción, no hay modelo de
     datos de producción y no hay dictamen de `/sdd-legal-datos` sobre un plazo
     que nadie ha propuesto. Un ADR que fija un número sacado de la nada es peor
     que el hueco: lo tapa. ADR-009 dejó ese plazo sin fijar **a propósito**.
   - **Su disparador correcto es la primera spec que persista datos en
     producción**, y ahí es **precondición**: esa spec no se aprueba sin el ADR.
     Hoy la acción barata y suficiente es **registrarlo como riesgo abierto de
     EPIC-003 con ese disparador**, para que no dependa de que alguien se acuerde.
   - **Lo que NO hace falta: retocar el texto de `/robot`.** `/sdd-legal-datos`
     dictaminó explícitamente que declarar el plazo es correcto y cierto como
     compromiso, y el riesgo global es bajo. **Esto no retrasa la carta.**

4. **Los títulos que se escriban son texto en galego y en castellano y necesitan
   `/sdd-lingua` (CA-5), que solo puedes pedir tú.** Igual que en las dos specs
   anteriores. Los dos de proyecto ya están dictaminados y no cambian de valor;
   los dos del rastreador son nuevos. Es lo único de esta spec con un gate humano
   dentro, y es lo que marca cuándo cierra.

5. **Lo que congelas al aprobar: el título deja de ser propiedad del documento.**
   A partir de aquí, **toda página nueva del sitio declara su título o no tiene
   ninguno** — no hay herencia que la tape. Es intencionado: una pestaña vacía se
   ve, un título heredado y falso no, y eso es justo lo que ha pasado. El coste
   es una línea por página nueva y una clave por lengua, con el `typecheck`
   avisando si falta.

6. **Orden respecto a la carta.** Esta spec es **previa a mandarla**, por tu
   petición explícita y porque el enlace del user-agent es lo que el
   destinatario abre. No es previa a apuntar el DNS: son independientes, y el DNS
   (SPEC-004 CA-1, F-SPEC-005-5) sigue siendo la otra cosa pendiente y sigue
   siendo tuya.

7. **DECIDIDO — se implementa sobre `ft/SPEC-005-pagina-del-rastreador`, no en
   rama propia. Alberto Fojo, 2026-09-01.** Va dentro del **PR #8**, y la razón
   es de despliegue, no de comodidad: SPEC-005 publica el user-agent que apunta a
   `/robot`, así que si las dos entraran por *merges* distintos habría una
   ventana en la que **`main` desplegaría el sitio con el título equivocado** —
   justo el defecto que esta spec corrige, publicado. Consecuencia para CA-4: la
   comparación de `git diff --name-only main -- tests/` y la del HTML de
   `/proxecto` se hacen contra el árbol de **SPEC-005 ya integrada en la rama**,
   no contra `main`, o darían por cambio de SPEC-006 lo que es de SPEC-005.
   Precedente del método: la sección «Regresión sobre SPEC-004» del ledger de
   SPEC-005, con `git archive <sha>` y sin `checkout`.
