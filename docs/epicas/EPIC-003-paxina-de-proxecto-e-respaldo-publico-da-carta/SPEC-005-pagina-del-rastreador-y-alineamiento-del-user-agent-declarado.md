---
id: SPEC-005
tipo: spec
epica: EPIC-003
estado: aprobada
aprobada-por: Alberto Fojo
historial:
  - {estado: borrador, fecha: 2026-08-31, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-08-31, por: Alberto Fojo}
---
# SPEC-005 — Página del rastreador y alineamiento del user-agent declarado

## Problema

**Hoy la carta y el código dicen cosas distintas, y una de las dos es falsa.**

| Dónde | Cadena |
|---|---|
| `src/mirror/user-agent.ts:25` (lo que se **envía**) | `marcador.gal/0.0.1 (+mailto:ola@tremen.dev; medicion SPEC-002, RN-11)` |
| `docs/negocio/carta-rfgf-acceso.md` (lo que se **afirma**) | `marcador.gal/0.0.1 (+mailto:ola@tremen.dev; medicion RN-11)` |

La divergencia no es el problema entero, es el síntoma. Hay tres defectos, y el
tercero es el que decide:

1. **La cadena filtra vocabulario interno.** `SPEC-002` y `RN-11` no significan
   nada fuera de este repositorio. A quien audita un log le dicen que se le ha
   colado una herramienta interna, no quién llama a su puerta.
2. **El `+` no lleva a ninguna parte que se pueda leer.** Apunta a un buzón. Un
   buzón sirve para quejarse; el técnico de la RFGF que reciba la carta no quiere
   quejarse, quiere **comprobar**. `user-agent.ts` deja escrito que se eligió
   `mailto:` sobre una URL porque «ese dominio no está contratado, y un contacto
   que no resuelve es peor que ninguno» (F-SPEC-002-1, cerrado por el gate el
   2026-08-31). **`marcador.gal` se contrató ese mismo día: la razón caducó.**
3. **`SPEC-002` es un identificador que rota, y lo que se le pide a la RFGF es
   una identidad que se quede quieta.** SPEC-003 ya existe; EPIC-002 traerá
   adaptadores bajo specs nuevas. La carta pide que escriban
   `User-agent: marcador.gal` en su `robots.txt` —una línea que queda pública y
   auditable en su servidor— y nuestro propósito declarado seguiría el número de
   la spec de turno. **Este es el argumento operativo, y es el que manda sobre
   los otros dos, que son de estilo.**

**Y hay un cuarto problema, que es el que da sentido a esta spec entera:** las
cinco afirmaciones comprobables de la carta —el user-agent literal, el tope de
una petición por minuto y competición, el respeto a `robots.txt`, la no
republicación y el buzón que se lee— **no están publicadas en ningún sitio**. La
carta pide confianza y ofrece su propia palabra como única prueba.

Reglas implicadas: **RN-11** (robots.txt, user-agent identificado, máximo 1
petición/minuto por competición), **ADR-008 §1** (futgal.es no es capturable
mientras su `robots.txt` diga `Disallow: /`), **ADR-009** (retención del raw
store), **ADR-011** (la forma estable del user-agent, que esta spec ejecuta).

**Por qué es una spec y no una nota en un ledger.** `USER_AGENT` pertenece a
SPEC-002, que está `hecho` y verificada GREEN. Tocarlo no es corregir un texto:
es modificar código de producción de una spec cerrada. En este proyecto el código
entra por una spec aprobada (`.sdd.json`, `gates.requireSpec`) y un ledger es
**evidencia de verificación, no autorización de cambio**. El razonamiento
completo y las dos alternativas descartadas —anotar en el ledger de SPEC-002, o
reabrir SPEC-002— están en **ADR-011 §6**.

## Usuarios / roles afectados

- **El técnico de la RFGF.** Público objetivo, una persona, y la razón de que
  esta página exista antes que ninguna otra.
- **Cualquier operador de un sitio que vea `marcador.gal` en su log.** Es a quien
  RN-11 le debe una identidad y un sitio donde pedir que paremos.
- **Alberto Fojo**: aprobó la forma exacta de la cadena nueva (2026-08-31) y
  decide en el gate las dos preguntas abiertas de abajo.
- **`/sdd-lingua`**, consultivo y **bloqueante para el cierre**: todo el texto
  visible de `/robot` en las dos lenguas.
- **`/sdd-legal-datos`**, consultivo y **bloqueante para el cierre**: las dos
  afirmaciones de esta página que son de naturaleza jurídica —«no republicamos» y
  la política de retención—, porque publicadas dejan de ser postura interna y
  pasan a ser compromiso frente a terceros.
- **`sdd-verificador`**: los CA de abajo, y muy en particular CA-9 y CA-10, que
  son los que impiden que «alinear una cadena» rompa algo.

## Diseño: tres decisiones de forma

### 1. La página no transcribe la cadena: la importa

Es la única razón arquitectónica de peso del despliegue compartido (**ADR-010**).
Si `/robot` escribiera el user-agent a mano, el criterio de la épica —«coincide
carácter a carácter, si divergen el sitio miente»— dependería de que nadie se
olvide de actualizar dos sitios. Ya sabemos qué pasa con eso: es exactamente
cómo la carta y el código llegaron a divergir. En el mismo proyecto, la página
hace `import { USER_AGENT }` y la identidad **es estructural**, no editorial. Es
el mismo argumento con el que ADR-001 eligió Node: un solo tipo para el contrato.

### 2. El literal se congela, y eso es el objetivo, no el efecto secundario

Hoy **ningún test fija la cadena** —todos importan `USER_AGENT`— y por eso
cambiarla es barato. A partir de esta spec deja de serlo: CA-1 congela el
propósito y el contacto con una igualdad literal. Es deliberado. La cadena pasa a
ser **un compromiso público que un tercero escribe en su servidor**, y cambiarla
en silencio tiene que doler. El coste, dicho entero: cualquier cambio futuro
rompe ese test a propósito y exige una spec.

Lo que **no** se congela es la versión: `USER_AGENT` se compone de
`USER_AGENT_PRODUCT` y `USER_AGENT_VERSION`, y subir de `0.0.1` no rompe nada.
Lo que sí queda congelado aparte es el **token de producto**, `marcador.gal`,
porque es la clave por la que emparejan los `robots.txt` ajenos
(`src/mirror/capture/robots.ts:37` hace `userAgent.split('/')[0]`): cambiarlo
invalidaría cada línea que un tercero haya escrito para nosotros.

### 3. El buzón no se pierde al mover el `+`

RN-11 pide que un operador tenga **dónde quejarse**. Al pasar el `+` de un
`mailto:` a una URL, eso solo sigue siendo cierto si la URL lleva el buzón
delante. Por eso CA-5 no dice «la página menciona un correo»: dice que
`ola@tremen.dev` está en el **primer bloque**, antes de cualquier otro
encabezado de sección, como enlace `mailto:`. Sin esa cláusula el cambio sería
una regresión contra lo que F-SPEC-002-1 protegía, no una mejora.

## Criterios de aceptación

- **CA-1 (la cadena nueva, y su comentario)**: Dado `src/mirror/user-agent.ts`,
  cuando corre la suite, entonces:
  1. `USER_AGENT` es exactamente
     `` `${USER_AGENT_PRODUCT}/${USER_AGENT_VERSION} (+https://marcador.gal/robot; medicion de latencia)` ``
     —es decir, la cadena desplegada hoy es
     `marcador.gal/0.0.1 (+https://marcador.gal/robot; medicion de latencia)`,
     la forma que **aprobó Alberto Fojo el 2026-08-31**;
  2. `USER_AGENT_PRODUCT === 'marcador.gal'`, con un test propio que dice en su
     nombre por qué está congelado (es la clave de emparejamiento de terceros);
  3. `USER_AGENT` sigue casando con `USER_AGENT_PATTERN`, **sin tocar el patrón**:
     ya acepta `https?://` además de `mailto:`;
  4. el comentario de cabecera del fichero deja escrito que el contacto es una
     URL **porque el dominio se contrató el 2026-08-31**, que eso agota la razón
     registrada en F-SPEC-002-1, y que la exigencia de RN-11 —dónde quejarse— la
     cumple ahora la página, que lleva el buzón. Lo comprueba el verificador
     leyendo: un comentario que documenta una razón caducada es una trampa para
     quien lo lea dentro de seis meses.
  `medicion` va **sin tilde** a propósito: los valores de cabecera HTTP están
  definidos sobre US-ASCII, y una tilde ahí viaja como bytes opacos. No es un
  descuido de ortografía; el texto en galego con sus tildes vive en la página.

- **CA-2 (identidad página ↔ código, carácter a carácter)**: Dado `/robot` y
  `/es/robot`, cuando se renderizan, entonces el HTML contiene la cadena
  `USER_AGENT` **exacta**, obtenida importando la constante; y un test que **lee
  el código fuente** falla si el literal aparece escrito a mano en cualquier
  bundle de i18n o componente del sitio. Es el criterio de la épica —«si divergen,
  el sitio miente»— convertido en imposible en vez de en recordatorio.

- **CA-3 (sin identificadores internos)**: Dado `USER_AGENT` y el HTML servido de
  `/robot` en las dos lenguas, cuando corre la suite, entonces ninguno contiene
  `SPEC-`, `RN-`, `EPIC-` ni `ADR-`. Ni la cadena ni la página que la explica
  hablan el idioma del repositorio: la página existe para alguien de fuera.

- **CA-4 (la URL del `+` es la que existe)**: Dado `USER_AGENT_CONTACT`, cuando
  corre la suite, entonces vale `https://marcador.gal/robot`; y el verificador
  comprueba en el sitio ya desplegado que esa dirección exacta responde `200`.
  La comprobación en producción no es opcional: es la mitad del criterio de la
  épica «la URL del user-agent lleva a una página que existe».

- **CA-5 (el buzón sigue delante)**: Dado `/robot` y `/es/robot`, cuando se
  renderizan, entonces el buzón aparece como enlace `mailto:` **en el primer
  bloque de la página, antes de cualquier otro encabezado de sección**,
  acompañado de una frase que dice que ahí se pide que paremos y que se para.
  Test: el `mailto:` está presente y su posición en el documento es anterior a la
  del segundo encabezado. La dirección sale de la **constante única de SPEC-004
  CA-13** —hoy `ola@tremen.dev`— y el test la compara contra esa constante, no
  contra un literal escrito aquí: es **el valor de hoy, no una constante del
  diseño**, y Alberto Fojo ya ha dicho (2026-08-31) que en producción será
  alguno `@marcador.gal`. Este CA es la **única compensación** del riesgo
  residual que el gate acepta en ADR-011: si la dirección se cae de aquí, el
  user-agent deja de llevar a ningún contacto.

- **CA-6 (las afirmaciones comprobables de la carta, publicadas)**: Dado `/robot`
  en las dos lenguas, cuando se renderiza, entonces contiene estas afirmaciones,
  **cada una con su propia clave de i18n** y su propio test de presencia:
  1. **La cadena literal del user-agent** (ya cubierta por CA-2, aquí como
     contenido de la página).
  2. **El tope: una petición por minuto y competición** (RN-11), dicho en número,
     no en adjetivo.
  3. **Se respeta `robots.txt` siempre**: un `Disallow` que nos afecte nos deja
     fuera, sin excepción, y no lo levanta ni un user-agent distinto, ni un tope
     más bajo, ni la brevedad de la ventana (ADR-008 §1). Y que **hoy hay
     fuentes que no leemos precisamente por eso** — dicho así, en general, **sin
     citar a ninguna** (CA-13).
  4. **No se republica el dato de terceros.** Esto es medición; el resultado es
     un informe interno.
  5. **Qué se hace con lo leído y cuánto se guarda**: se archiva la respuesta
     cruda antes de parsearla y se borra según ADR-009 —30 días desde el fin de
     la ventana, una prórroga escrita, techo duro de 90.
  6. **Cómo pedir que paremos**, y que basta con pedirlo.
  Y **nada más**: la página no anuncia producto, no pide correo y no vende nada.
  Los CA-6, CA-7, CA-9 y CA-10 de SPEC-004 —lista negra de promesa de producto,
  D-1, mala cobertura, cero analítica— **se aplican también a estas rutas**, sin
  reescribirlos aquí.

- **CA-7 (`/robot` responde directo, no por redirección)**: Dado
  `https://marcador.gal/robot`, cuando se pide, entonces responde `200`
  directamente, sin `3xx` intermedio, y `/es/robot` hace lo mismo para el
  castellano. Motivo: la dirección viaja en cada petición que hacemos y un
  tercero la va a copiar en su `robots.txt` o en su lista de bloqueo. **Su
  permanencia es una restricción de ADR-010**, no de esta spec: `/robot` no se
  mueve nunca, aunque el producto ocupe el resto del sitio.

- **CA-8 (la carta deja de divergir)**: Dado `docs/negocio/carta-rfgf-acceso.md`,
  cuando corre la suite, entonces un test lee el fichero y exige que contenga la
  cadena `USER_AGENT` **exacta**, y que no contenga la vieja. La carta es hoy el
  único documento que cita la cadena fuera del código, y ya divergió una vez.
  (Ver la nota 3 del gate: qué pasa con este test el día que la carta se archive.)

- **CA-9 (lo que se le pide a la RFGF sigue funcionando)**: Dado un `robots.txt`
  sintético con exactamente lo que la carta pide —un grupo
  `User-agent: marcador.gal` / `Allow: /` junto a un comodín `User-agent: *` /
  `Disallow: /`—, cuando se aplica `parseRobots(texto, USER_AGENT)` con la cadena
  **nueva**, entonces `isAllowed` es verdadero para las rutas de las dos
  competiciones. Y con el mismo fichero **sin** el grupo `marcador.gal`,
  `isAllowed` es falso. Es la comprobación de que la petición de la carta sigue
  siendo válida después del cambio, y de que el emparejamiento por token de
  producto —no por la cadena entera— es lo que la hace barata. Fixture
  **sintético**, como exige ADR-009 §3: nunca HTML ni `robots.txt` real de un
  tercero en el repositorio.

- **CA-10 (SPEC-002 y SPEC-003 siguen verdes, y el cambio es de un fichero)**:
  Dado el cambio, cuando se ejecuta `npm run test`, `npm run typecheck` y
  `npm run lint`, entonces todo pasa; y `git diff --stat` acotado a `src/mirror/`
  muestra **un solo fichero modificado, `user-agent.ts`**. Ninguna otra línea de
  `src/mirror/` se toca. Este CA es lo que separa «alinear una cadena» de
  «reabrir una spec cerrada», y sin él la frontera de ADR-011 §6 sería una
  intención.

- **CA-11 (rastro en el ledger de SPEC-002)**: Dado que `USER_AGENT` era código
  de SPEC-002, cuando esta spec llega a `hecho`, entonces el ledger de SPEC-002
  lleva una **referencia cruzada** —no una autorización— que dice que SPEC-005
  cambió la constante, en qué fecha, y que la razón registrada al cerrar
  F-SPEC-002-1 (elegir `mailto:` sobre una URL) **caducó con la contratación del
  dominio**. Sin esa línea, quien lea el ledger cerrado dentro de un año creerá
  que el `mailto:` sigue vigente y que el código lo contradice.

- **CA-12 (dictámenes de lengua y de datos, bloqueantes para el cierre)**: Dado
  el texto completo de `/robot` en las dos lenguas, cuando la spec pide pasar a
  `hecho`, entonces el ledger contiene (a) el **dictamen de `/sdd-lingua`** sobre
  el texto íntegro, con fecha y correcciones aplicadas o justificadas una a una;
  y (b) el **dictamen de `/sdd-legal-datos`** sobre los puntos 3, 4 y 5 de CA-6
  —respeto a `robots.txt`, no republicación y retención—, que publicados dejan de
  ser postura interna y pasan a ser compromiso frente a terceros. Sin los dos, la
  spec no cierra.

- **CA-13 (la página del rastreador no cita a ningún tercero)**: Dado el HTML
  servido de `/robot` y `/es/robot`, cuando corre la suite, entonces **no
  aparece** ninguna de las cadenas `futgal`, `ceroacero`, `besoccer`,
  `resultados-futbol` ni `rfgf`, en ninguna grafía ni capitalización. La página
  dice que respetamos todo `robots.txt` y que hay fuentes que hoy no leemos por
  eso; **no dice cuáles**.

  **La prohibición es de estas dos rutas, no del sitio.** `/proxecto` nombra
  «Terceira RFEF G1» y «Preferente Futgal G1» porque son los nombres canónicos
  de las competiciones que se están midiendo (SPEC-004 CA-8.2), y esos son
  nombres de competición, no señalamientos de fuente. El test tiene que aplicarse
  sobre el HTML de `/robot`, no sobre el bundle entero, o chocará con SPEC-004.

  **Decidido por Alberto Fojo el 2026-08-31**, resolviendo una pregunta que
  `sdd-arquitecto` había dejado abierta a propósito. La opción contraria era
  fuerte —nombrar a futgal.es es la prueba más contundente de que la política se
  cumple cuando duele— y se rechaza porque señalar en público a un tercero por su
  `robots.txt`, en la web propia, se lee como presión aunque no se pretenda. **El
  caso concreto se queda en la carta**, que es donde tiene un destinatario y una
  conversación. La lista es más ancha que `futgal` a propósito: la razón vale
  igual para cualquier fuente, y una lista negra que solo atrape el caso de hoy
  se queda corta el día que haya otro.

## Entidades y reglas afectadas

- **RN-11** de `docs/fundacion/reglas.md`: es la regla que esta página hace
  auditable por terceros. **RN-10** y **ADR-009** en el punto 5 de CA-6.
- **ADR-008 §1**: el caso real del `Disallow` que se respeta. **ADR-011**: la
  forma del user-agent y dónde se registra el cambio. **ADR-010**: despliegue
  compartido —de donde sale la posibilidad de importar la constante— y
  permanencia de `/robot`.
- **`src/mirror/user-agent.ts`**: único fichero de producción que esta épica
  toca (CA-10). `USER_AGENT_PATTERN` **no cambia**.
- **`src/mirror/capture/robots.ts`**: se **usa** en los tests (CA-9), no se
  modifica.
- **`docs/negocio/carta-rfgf-acceso.md`**: se actualiza la cadena citada (CA-8).
- Depende de **SPEC-004**, que aporta el sitio, el mecanismo de i18n, el dominio
  resolviendo y **la constante única del buzón (SPEC-004 CA-13)**, que esta spec
  consume y no redefine. No empieza antes.
- No toca `src/model/`, `src/db/` ni `migrations/`. Cero migraciones.

## Fuera de alcance

- **El contenido de la página de proyecto** («quen está detrás», qué se mide):
  es SPEC-004. Frontera: SPEC-004 responde *quién y qué*; esta responde *cómo se
  lee y cómo se para*.
- **El mecanismo de i18n, el `robots.txt` propio del sitio y el despliegue.**
  SPEC-004. Aquí solo se **añaden claves** a los bundles que aquélla creó.
- **Cambiar el tope de peticiones, el conjunto de fuentes o la política de
  robots.** Esta spec **publica** lo que RN-11 y ADR-008 ya dicen; no los
  reinterpreta. Si algo de la página no se corresponde con el código, se corrige
  la página o se abre una spec, nunca se afloja la regla.
- **Mandar la carta.** Es acción humana con plazo externo, y sigue siendo de
  Alberto.
- **Reabrir SPEC-002 o volver a verificarla.** CA-10 comprueba que sigue verde;
  eso es todo lo que se le debe.
- **Publicar métricas, estado del spike o cualquier cifra.** No hay ninguna, y la
  épica no depende de que la haya.

## Notas para el gate humano

1. **Riesgo residual: ACEPTADO por Alberto Fojo el 2026-08-31.** El buzón deja de
   viajar en la cabecera. Hoy, un operador que ve `marcador.gal` en su log tiene
   el correo delante aunque no exista ninguna web; después del cambio tiene una
   URL, y si `marcador.gal` está caído en ese momento, no tiene nada. Es una
   regresión real frente a lo que F-SPEC-002-1 protegía, y su **única**
   compensación es CA-5 —el buzón en el primer bloque—, que solo sirve mientras
   la página responda. Se le presentó así y lo aceptó explícitamente; queda
   registrado en ADR-011 §Consecuencias para que dentro de un año no parezca un
   descuido. **No se pueden llevar las dos cosas en la cadena**: la convención
   del user-agent es un solo `+`, y dos contactos romperían
   `USER_AGENT_PATTERN` y la forma aprobada.
2. **Pregunta cerrada: `/robot` NO nombra a futgal.es.** Decidido por Alberto
   Fojo el 2026-08-31. Regla general —respetamos todo `robots.txt` y hay fuentes
   que hoy no leemos por eso—, sin citar a nadie; el caso concreto se queda en la
   carta, en privado. Está atado como **CA-13**, con lista negra verificable y
   más ancha que `futgal`, y ya no queda a criterio de nadie en implementación.
3. **CA-8 acopla un test a un documento de negocio.** Es la mecanización de «la
   carta no puede volver a divergir», y el defecto que corrige ya ocurrió. Pero
   `carta-rfgf-acceso.md` es un borrador que tú vas a mandar: el día que se envíe
   y se archive, ese test señalará un fichero histórico. **No es un problema
   ahora y conviene que no sorprenda después**; cuando llegue, se cierra con una
   línea en el ledger o se traslada al documento que la sustituya.
4. **Orden obligatorio.** SPEC-004 primero. Si esta spec se implementa antes de
   que `https://marcador.gal/robot` resuelva, el user-agent apuntaría a un 404 en
   cada petición: el defecto exacto que F-SPEC-002-1 evitó, reintroducido por la
   puerta de atrás.
5. **Lo que congelas al aprobar.** La cadena deja de ser barata de cambiar
   (CA-1). Es intencionado y es el punto de la spec, pero significa que si dentro
   de tres meses quieres otra redacción del propósito, cuesta una spec. Si tienes
   dudas sobre la palabra `latencia` —que es lo único que describe el propósito—,
   este gate es el momento barato de cambiarla; después no lo es.
