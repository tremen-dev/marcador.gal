---
id: SPEC-004
tipo: spec
epica: EPIC-003
estado: hecho
aprobada-por: Alberto Fojo
historial:
  - {estado: borrador, fecha: 2026-08-31, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-08-31, por: Alberto Fojo}
  - {estado: en-progreso, fecha: 2026-08-31, por: sdd-verificador}
  - {estado: en-revision, fecha: 2026-08-31, por: sdd-verificador}
  - {estado: hecho, fecha: 2026-08-31, por: sdd-verificador}
---
# SPEC-004 — Sitio público de proyecto en marcador.gal: i18n, contenido y despliegue

## Problema

**La carta a la RFGF pide confianza a un desconocido y no ofrece dónde
comprobarla.** `docs/negocio/carta-rfgf-acceso.md` se presenta como «un proxecto
persoal, aínda sen publicar» y firma con un correo. Quien la reciba —un técnico
de la federación— no tiene hoy ningún sitio al que ir a ver si esto es serio. Ese
es el hueco que EPIC-003 abre y esta spec cubre su primera mitad: **quién está
detrás y qué se está midiendo**.

Hay además dos daños concretos, hoy:

1. **`marcador.gal` sirve un anuncio de hosting.** El dominio se contrató el
   2026-08-31 en Dinahosting y resuelve a `82.98.135.43`, que es su página de
   aparcamiento. Poner esa dirección en una carta institucional cuando lo que
   aparece es publicidad del registrador es peor que no ponerla.
2. **D-2 nunca se ha ejercido.** `src/i18n/gl.ts` existe con cuatro
   cualificadores y su propia cabecera dice que «el bundle castellano y el resto
   de literales de la interfaz pertenecen a la spec que construya la UI». No hay
   bundle `es`, no hay mecanismo de resolución y no hay ninguna barrera que
   impida que la primera página que se escriba incruste los literales. **Esta es
   esa spec.** Si la barrera no existe antes del primer literal, D-2 se incumple
   el primer día y se arrastra.

**El daño de hacerlo mal no es una página fea: es una carta desmentida por su
propio enlace.** El riesgo principal que la épica nombra —«la deriva hacia la
landing»— empieza aquí, porque esta es la spec que decide qué frases hay en el
sitio. Por eso «no hay promesa de producto» está escrito abajo como criterio de
aceptación con test, y no como recomendación de estilo.

Reglas implicadas: **D-1** (nombre e imagen propios, no sucesión), **D-2**
(galego por defecto, castellano opcional, i18n desde el primer literal),
**D-8** (densidad, legible con mala cobertura), **RN-11** (cortesía de rastreo:
aquí en su reverso, tener nuestro propio `robots.txt` bien puesto).

## Usuarios / roles afectados

- **El técnico de la RFGF que recibe la carta.** Es el público objetivo, y es
  **una persona**. La épica lo dice sin rodeos: éxito no es visitas.
- **Alberto Fojo**, como autor de la carta y como la identidad que el sitio
  publica. Decide en el gate el contenido de «quen está detrás» (ver notas).
- **`/sdd-lingua`**, consultivo y **bloqueante para el cierre**: dictamina todo
  el texto visible de los dos bundles. `sdd-arquitecto` y `sdd-implementador` no
  redactan galego a ciegas.
- **`sdd-implementador`**: construye. **`sdd-verificador`**: comprueba contra
  estos CA, incluido el sitio ya desplegado.
- **Quien opere el DNS** (Alberto, en el panel de Dinahosting): CA-1 tiene una
  mitad que no es código.

## Diseño: cuatro decisiones de forma que gobiernan los CA

Van aquí y no repetidas en cada criterio.

### 1. La lengua va en la URL, no en el cliente

El castellano es una **ruta propia y estable** (`/es/...`), no un estado de
navegador. Tres motivos, y ninguno es de gusto: la carta tiene que poder enlazar
una de las dos; quien audita un log necesita poder guardar la dirección exacta
que vio; y un conmutador que dependa de JavaScript rompe el criterio de mala
cobertura. El galego **no lleva prefijo**, porque es el idioma por defecto (D-2)
y la estructura de URL es el sitio más barato donde decir eso.

### 2. Las URL de contenido son permanentes desde el primer día

`/proxecto` es la dirección canónica de la página de proyecto y no se mueve
nunca. `/` **redirige** a ella (308). Parece un rodeo y no lo es: ADR-010 reserva
`/` para el producto, y el día que el producto ocupe la raíz, cualquier enlace
que la carta, un correo o un tercero hayan guardado tiene que seguir funcionando.
La épica entera trata de no publicar cosas que después se convierten en mentiras;
una URL que se rompe es una de ellas.

### 3. El sitio no ejecuta nada en el cliente y no pide nada a nadie

Ni analítica (fuera de alcance por la épica), ni fuentes remotas, ni scripts de
terceros, ni cookies, ni imágenes. No es minimalismo estético: es D-8 —legible
con mala cobertura— y es lo que hace que «no medimos a quien nos visita» sea
comprobable abriendo el inspector, en vez de una promesa.

### 4. El mecanismo de i18n se escribe a mano

Dos lenguas y tres rutas no justifican una dependencia. Añadir `next-intl` o
equivalente sería una decisión de stack sobre ADR-001, y por tanto **material de
ADR**: esta spec lo prohíbe explícitamente sin uno. Lo que sí fija la spec es el
**contrato** —paridad de claves, cero literales incrustados, cero JavaScript
necesario—; la forma concreta la elige `sdd-implementador`.

## Criterios de aceptación

- **CA-1 (el dominio deja de ser un aparcamiento)**: Dado el proyecto Vercel
  `marcador-gal`, ya vinculado en `.vercel/project.json`, y el DNS de
  `marcador.gal` apuntado a Vercel desde Dinahosting, cuando se pide
  `https://marcador.gal/`, entonces responde con TLS válido y un `308` a
  `https://marcador.gal/proxecto`, que responde `200`; y `https://www.marcador.gal/`
  responde `308` al ápice. **En ninguna de las respuestas aparece contenido de la
  página de aparcamiento de Dinahosting.** El apuntado de DNS es acción humana;
  el verificador comprueba el **resultado**, no el clic, con `curl -sIL` sobre
  las tres direcciones.

- **CA-2 (galego por defecto)**: Dado un visitante sin ninguna preferencia
  declarada, cuando pide `/proxecto`, entonces el documento sirve
  `<html lang="gl">` y **todo** su texto visible procede del bundle `gl`.

- **CA-3 (castellano, con URL propia y sin JavaScript)**: Dado el mismo
  contenido, cuando se pide `/es/proxecto`, entonces responde `200` con
  `<html lang="es">` y texto del bundle `es`; y en las dos páginas existe un
  enlace `<a href>` —no un botón con manejador— que lleva a la otra lengua.
  Test: las dos rutas devuelven el `lang` correcto y un literal propio de su
  bundle, y el enlace cruzado existe en el HTML servido.

- **CA-4 (paridad de bundles)**: Dado los bundles `gl` y `es`, cuando corre la
  suite, entonces (a) los dos satisfacen el **mismo** tipo de bundle del sitio,
  de modo que `npm run typecheck` falla si a uno le falta una clave; y (b) un
  test en ejecución compara los conjuntos de claves y falla si difieren en un
  solo elemento, **en cualquier dirección**. La paridad se exige sobre el
  espacio de nombres del **sitio**; `qualifiers` sigue siendo de `gl.ts` y de la
  spec que construya la interfaz del marcador, como su propia cabecera declara.

- **CA-5 (ningún literal incrustado)**: Dado los ficheros de ruta y componente
  del sitio, cuando corre la suite, entonces un test **lee el código fuente** y
  falla si encuentra texto visible que no proceda de un bundle de i18n. Precedente
  y forma: el caso 8 de `tests/mirror/capture/robots.test.ts`, que recorre
  `src/mirror/capture/*.ts` y falla si `.fetch(` aparece fuera de `http.ts`. La
  barrera tiene que ser una aserción, no una costumbre: D-2 dice «nunca
  hardcodeados» y esta es la única forma de que eso sea cierto dentro de un año.

- **CA-6 (no hay promesa de producto)**: Dado el HTML servido de **todas** las
  rutas del sitio en las dos lenguas, cuando corre la suite, entonces no contiene
  ningún `<form`, ningún `<input`, ningún `<img`, y ninguno de los términos de una
  lista negra que incluye al menos —en galego, castellano e inglés— *patrocinio,
  patrocinar, patrocinador, sponsor, lista de espera, lista de agarda, newsletter,
  subscríbete, apúntate, próximamente, en breve, lanzamento, lanzamiento*. Y
  tampoco contiene ninguna fecha futura presentada como fecha de disponibilidad.
  Es criterio de aceptación por decisión de la épica: incumplirlo daña la carta.

- **CA-7 (D-1: inspiración, no sucesión)**: Dado los dos bundles, cuando corre la
  suite, entonces no aparece la cadena `marcadorgalego` ni ninguna de *relevo,
  sucesor, sucesora, sucesión, continuación, continuadora, herdeiro, herdeira,
  volve, regresa*. Y el verificador **lee** el texto de «quen está detrás» y
  comprueba contra D-1 que nombra a tremen.dev y a Alberto Fojo sin apoyarse en
  ningún proyecto anterior. La lista negra atrapa el descuido; la lectura atrapa
  la insinuación, que es el riesgo real que la épica señala en esta sección.

- **CA-8 (lo que la página de proyecto tiene que decir)**: Dado `/proxecto` y
  `/es/proxecto`, cuando se renderizan, entonces cada una de estas afirmaciones
  está presente, **cada una con su propia clave de i18n** y su propio test de
  presencia:
  1. **Quién está detrás**: tremen.dev y Alberto Fojo, con el buzón de contacto
     como enlace `mailto:`, **tomado de la constante única de CA-13** y no
     escrito en el bundle. **Tres o cuatro frases, y ni una más**: un test cuenta
     las oraciones de esa clave y falla a partir de la quinta. No lleva historia
     del fútbol galego en internet, ni de por qué existe un hueco, ni mención a
     ningún proyecto anterior — CA-7 lo comprueba por lista negra, esta cláusula
     lo comprueba por longitud. Es donde la épica avisa que se incumple D-1, y el
     límite existe para que `sdd-implementador` no improvise ahí.
  2. **Qué se está midiendo**: latencia, cobertura, conflictos y minutos de
     operación manual, sobre Terceira RFEF G1 e Preferente Futgal G1.
  3. **Para qué**: decidir si el proyecto es viable. El resultado es un **informe
     interno**, no un producto.
  4. **Que todavía no hay producto**, dicho sin fecha y sin condicional que suene
     a promesa.
  5. **Un enlace a `/robot`**, la página del rastreador (SPEC-005). Mientras
     SPEC-005 no esté hecha, el enlace es lo único de este CA que puede quedar
     pendiente, y así se anota en el ledger.
  El sitio **no dice nada más**: la épica cierra cuando cada afirmación
  comprobable tiene su sitio *y* cuando no hay nada de sobra.

- **CA-9 (mala cobertura y móvil primero)**: Dado el HTML servido, cuando corre
  la suite, entonces no contiene ningún `<script src>` a un origen externo,
  ningún `<link rel="stylesheet">` a un origen externo, ninguna `@font-face` que
  descargue de fuera, y la página es completamente legible con JavaScript
  desactivado. Y, en un viewport de 360 px de ancho, **no hay scroll horizontal**
  —lo comprueba el verificador con Playwright, que es su herramienta para UI—.

- **CA-10 (nada de analítica ni de rastro del visitante)**: Dado una petición a
  cualquier ruta del sitio, cuando se inspecciona la respuesta, entonces no lleva
  ninguna cabecera `Set-Cookie`, y el HTML no contiene ningún identificador de
  sesión ni ninguna petición a un tercero. La épica deja la analítica fuera a
  propósito: mediría a un público de una persona a cambio de meter tratamiento de
  datos personales y un dictamen de `/sdd-legal-datos` en una página que existe
  para generar confianza.

- **CA-11 (nuestro propio `robots.txt`, y comprobado con nuestro propio parser)**:
  Dado `https://marcador.gal/robots.txt`, cuando se pide, entonces responde `200`
  con `text/plain`, lo **genera la aplicación** (no es un fichero suelto que se
  pueda desincronizar de las rutas), permite el rastreo del sitio entero y **no
  contiene ningún `Disallow` que afecte a `/proxecto` ni a `/robot`**. Y un test
  aplica `parseRobots` de `src/mirror/capture/robots.ts` a nuestro propio
  `robots.txt` con nuestro propio `USER_AGENT` y exige `isAllowed` verdadero para
  `/`, `/proxecto` y `/robot`. Pedimos a la RFGF que respete el nuestro; comernos
  nuestra propia comida con nuestro propio parser es la forma barata de que eso
  no sea una frase. Si el fichero incluye un comentario con el buzón —cortesía
  habitual y bienvenida—, **sale de la constante de CA-13**, no escrito a mano:
  un `robots.txt` es exactamente uno de los sitios donde una dirección se queda
  olvidada cuando el resto migra.

- **CA-12 (dictamen de lengua, bloqueante para el cierre)**: Dado el texto
  completo de los dos bundles, cuando la spec pide pasar a `hecho`, entonces el
  ledger contiene el **dictamen de `/sdd-lingua`** con fecha, sobre el texto
  íntegro y no sobre una muestra, y cada corrección aparece aplicada o
  justificada una a una. **Sin ese dictamen la spec no cierra.** El galego de
  este sitio lo va a leer una federación: es exactamente el caso para el que
  existe la autoridad de lengua.

- **CA-13 (el buzón vive en un solo sitio, porque va a migrar)**: Dado que la
  dirección de contacto es **provisional** —decisión de Alberto Fojo el
  2026-08-31: «de momento será `ola@tremen.dev`, pero en producción será alguno
  `@marcador.gal`»—, cuando corre la suite, entonces:
  1. existe **una** constante de configuración con la dirección, en un módulo
     propio del sitio, fuera de los bundles de i18n —un bundle por lengua ya
     serían dos copias—;
  2. su valor **hoy** es `ola@tremen.dev`;
  3. un test **lee el código fuente** y falla si la cadena `ola@tremen.dev`
     —o cualquier dirección de correo— aparece en cualquier punto de `src/`
     fuera de ese módulo. Los literales de i18n que hablen del buzón **lo
     interpolan**, no lo incrustan;
  4. el comentario de cabecera de ese módulo lleva escrito **el contrato de la
     migración**: el día que la dirección se mueva a `@marcador.gal`,
     `ola@tremen.dev` **tiene que seguir leyéndose** mientras la carta ya
     enviada y los logs de terceros lo sigan citando.
  El punto 4 no es decoración. La migración ocurrirá editando exactamente esa
  línea, así que es el único sitio del repositorio donde la advertencia llega a
  quien la necesita en el momento en que la necesita. Lo que **no** se puede
  atar con un test es que el buzón viejo se siga leyendo: eso ocurre fuera de
  este código, en un proveedor de correo, y ninguna suite lo observa. Queda como
  riesgo escrito, aquí y en ADR-011, y es la misma advertencia que ya llevan las
  notas finales de `docs/negocio/carta-rfgf-acceso.md`.

## Entidades y reglas afectadas

- **D-1**, **D-2**, **D-8** de `FOUNDATION.md` (locked).
- **RN-11** de `docs/fundacion/reglas.md`, en su reverso: nuestro propio
  `robots.txt` (CA-11).
- **ADR-001** (Next.js App Router, TypeScript estricto; ninguna dependencia nueva
  de i18n sin ADR), **ADR-004** (Vercel Pro), **ADR-010** (un solo despliegue,
  routing y permanencia de URL — es el ADR que esta spec ejecuta).
- **`src/i18n/gl.ts`** existe y **no se rompe**: el espacio de nombres del sitio
  se añade junto a `qualifiers`, que sigue perteneciendo a SPEC-001 y a la spec
  de la interfaz del marcador.
- No toca `src/model/`, `src/db/`, `src/mirror/` ni `migrations/`. **Cero
  migraciones**, cero base de datos: esta spec no tiene estado.

## Fuera de alcance

- **La página del rastreador `/robot`, el alineamiento del user-agent y las
  afirmaciones técnicas de la carta** (tope de 1 pet/min, respeto a `robots.txt`,
  no republicación, retención). Son **SPEC-005**. La frontera: esta spec responde
  *quién está detrás y qué se está midiendo*; SPEC-005 responde *cómo se lee y
  cómo se para*.
- **La landing de `marca.md`** entera: hero, mockup, tres frases de producto,
  ligas cubiertas, lista de espera, «queres patrocinar?». Sigue en *Más adelante*
  del roadmap y sigue esperando al informe. `marca.md` ya lleva la nota que
  distingue las dos cosas.
- **Identidad visual, logo y paleta.** Esta página se apaña con tipografía y
  espacio. La comprobación en OEPM sigue siendo previa a invertir ahí.
- **Analítica**, en cualquier forma, propia o de terceros (CA-10).
- **Cualquier dato de fútbol**: ni un marcador, ni una clasificación, ni un
  calendario.
- **Redes sociales, nota de prensa y salida pública.** No hay nada que lanzar.
- **Contratar handles y comprobar OEPM**: acción humana, fuera del código.

## Notas para el gate humano

1. **«Quen está detrás»: decidido, y ya no queda a criterio del implementador.**
   Tres o cuatro frases, sin historia del fútbol galego en internet y sin
   mención a ningún proyecto anterior. Está escrito como cláusula de CA-8.1 —con
   un test que cuenta oraciones— además de la lista negra de CA-7. Es un juicio
   de oficio de `sdd-arquitecto`, no una pregunta que se llevara a Alberto: la
   lista negra ya cubre lo que de verdad arriesga D-1, y el límite de longitud
   cubre el resto, que es la tentación de narrar.
2. **El buzón es `ola@tremen.dev` HOY, y va a cambiar.** Decisión de Alberto
   Fojo el 2026-08-31: «de momento será `ola@tremen.dev`, pero en producción
   será alguno `@marcador.gal`». La spec lo trata como **valor de configuración,
   no como constante del diseño** (CA-13): una sola definición, todo lo demás la
   referencia, y migrar es **una edición**. Lo que el gate tiene que ver con
   claridad es lo que **no** queda atado: que el buzón viejo siga leyéndose
   después de migrar ocurre en un proveedor de correo, fuera de este código, y
   **ningún test lo detectará**. Si deja de leerse mientras la carta enviada y
   los logs de terceros lo citan, RN-11 vuelve a estar incumplida en silencio.
   Lo máximo que la spec consigue es poner la advertencia en la línea que habrá
   que editar (CA-13.4). El resto es disciplina humana, y es la misma que ya
   piden las notas finales de la carta.
3. **`www` → ápice, y no al revés.** Decisión de CA-1, sin misterio: el nombre
   corto es el que va en la carta. Se puede invertir en el gate; después es un
   cambio de DNS y de configuración, no de código.
4. **CA-1 tiene una mitad que solo puedes hacer tú**: apuntar el DNS de
   `marcador.gal` en Dinahosting al despliegue de Vercel. Hasta que eso ocurra,
   `sdd-verificador` no puede cerrar el CA aunque el código esté perfecto. Si
   quieres que el trabajo avance en paralelo, se puede verificar contra la URL
   `*.vercel.app` y dejar CA-1 en ⚠️ hasta el apuntado.
5. **El orden con SPEC-005 importa y no es negociable.** SPEC-005 pone
   `https://marcador.gal/robot` dentro del user-agent que se envía a terceros.
   Esa URL **tiene que resolver antes**, o se repite exactamente el defecto que
   F-SPEC-002-1 quiso evitar: un contacto que no responde. Primero esta spec,
   después SPEC-005.
6. **Coste de oportunidad, que la épica pide no perder de vista.** Esto es lo
   primero que el proyecto construye que no es medición. Son dos specs pequeñas
   y tienen un plazo externo detrás (la carta). No debería crecer.
