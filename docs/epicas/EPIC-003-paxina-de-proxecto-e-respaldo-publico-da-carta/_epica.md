---
id: EPIC-003
tipo: epica
estado: hecho
historial:
  - {estado: borrador, fecha: 2026-08-31, por: sdd-producto}
  - {estado: aprobada, fecha: 2026-08-31, por: Alberto Fojo}
  - {estado: en-progreso, fecha: 2026-09-01, por: sdd-orquestador}
  - {estado: en-revision, fecha: 2026-09-01, por: sdd-orquestador}
  - {estado: hecho, fecha: 2026-09-01, por: Alberto Fojo}
aprobada-por: Alberto Fojo
---
# EPIC-003 — Páxina de proxecto e respaldo público da carta

> Nace el 2026-08-31 a petición de Alberto Fojo, que pidió «avanzar en la landing
> porque voy a enviar la carta a la RFGF y necesito una identidad detrás para que
> la petición tenga peso». **Esta épica no es esa landing.** Al abrir la petición
> apareció que la landing descrita en `docs/negocio/marca.md` —hero con mockup,
> lista de espera, «queres patrocinar?»— haría a la carta **más débil**, no más
> fuerte. Lo que sí falta es otra cosa, más pequeña y más útil.

## Objetivo

Dar **respaldo público y verificable** a la carta a la RFGF
(`docs/negocio/carta-rfgf-acceso.md`): un sitio en `marcador.gal` donde cualquiera
—empezando por quien reciba la carta— pueda comprobar quién está detrás, qué se
está midiendo y **cómo se lee**, sin que en ningún momento se prometa un producto.

**El hueco que cierra.** La carta afirma cosas comprobables: que se identifica con
un user-agent concreto, que va a una petición por minuto y competición, que
respeta `robots.txt`, que no republica datos de terceros y que hay un buzón que se
lee. Hoy **no hay ningún sitio donde verificar nada de eso**. La carta pide
confianza a un desconocido y la única prueba que ofrece es su propia palabra. Eso
sí es un déficit real, y no es el mismo problema que «no tenemos landing».

**Por qué ahora, si el roadmap baja la interfaz y la marca.** El criterio de corte
dice: *«baja todo lo que dependa de una cifra que aún no tenemos»*. Esta épica es
admisible justamente porque **no depende de ninguna cifra**. No enseña marcadores,
no enseña mockup, no promete producto y no cambia si las cuatro métricas salen
bien o mal. Lo que enseña —quiénes somos y cómo rastreamos— ya es cierto hoy y
seguirá siéndolo pase lo que pase con EPIC-001. La landing de `marca.md` sigue
abajo, y sigue dependiendo del informe.

**El daño que evita.** La carta lleva una nota explícita de su autor: *«Dos cosas
que NO hay que hacer en este correo: prometer un producto que aún no existe, y
pedir el acuerdo de datos»*, y su texto se presenta como *«un proxecto persoal,
aínda sen publicar»*. Esa modestia es el activo del ask: pide dos líneas de
`robots.txt`, no materia prima. Si la carta enlazase a una página con formulario
de lista de espera y llamada a patrocinadores, el lector la releería como una
operación comercial pidiendo su dato gratis. El peso ganado por un lado se perdería
entero por el otro.

## Precondición humana — RESUELTA el 2026-08-31

**`marcador.gal` está contratado.** Alberto Fojo lo registró en Dinahosting el
2026-08-31. Verificado en WHOIS y DNS ese mismo día: `Registrar: DINAHOSTING S.L.`,
expiración de registro 2027-08-31, estado `addPeriod`, delegado a
`ns{,2,3,4}.dinahosting.com` y resolviendo a `82.98.135.43`. **Con esto cae el
riesgo abierto** que `contexto.md`, `marca.md` y el roadmap arrastraban desde el
2026-08-29: el nombre ya es seguro.

Hoy apunta al aparcamiento de Dinahosting, no a Vercel. **Apuntarlo al despliegue
es trabajo de esta épica**, y va con la decisión de arquitectura que está más
abajo.

**Sigue pendiente, y ya no bloquea nada de aquí: la comprobación en OEPM** de que
no hay registro previo (`marca.md`, desde el 2026-08-29). Deja de ser previa al
gasto —el dominio ya está pagado— y pasa a ser previa a **invertir en identidad
visual**, que es donde `marca.md` la sitúa y donde el dinero es serio.

**La carta ya no espera a un plazo externo.** Solo espera a que exista la página
que enlaza y a la corrección del user-agent.

## Criterios de éxito

La épica se cierra cuando **cada afirmación comprobable de la carta tiene su
correspondencia pública en el sitio**, y cuando el sitio **no dice nada más**.

| Criterio | Cómo se comprueba |
|---|---|
| **Todo lo que la carta afirma, está publicado** | Recorrer la carta afirmación a afirmación: user-agent literal, tope de 1 pet/min y competición, respeto a `robots.txt`, no republicación, buzón de contacto. Cada una tiene su frase en el sitio |
| **El user-agent publicado es idéntico al que se envía** | La cadena de la página coincide **carácter a carácter** con `USER_AGENT` de `src/mirror/user-agent.ts`. Si divergen, el sitio miente. Ver abajo: hoy **la carta ya diverge** |
| **El user-agent no contiene identificadores internos** | Ni `SPEC-NNN` ni `RN-NN` en la cadena que ve un tercero. La convergencia se hace **cambiando el código**, no la carta: ver abajo |
| **La URL del user-agent lleva a una página que existe** | Hoy el `+` del user-agent apunta a un `mailto:`. Al terminar apunta a una página que explica el rastreador **y que sigue llevando el buzón**, que es la convención que espera quien audita un log |
| **No hay promesa de producto** | El sitio **no** contiene: formulario de lista de espera, mockup o captura del marcador, mención a patrocinio, ni fecha de lanzamiento. Es criterio de aceptación, no una nota de estilo: incumplirlo daña la carta |
| **No se presenta como sucesión** | Ninguna mención a marcadorgalego.gal como antecesora, ni marca ni recursos suyos (**D-1**) |
| **Galego por defecto, castellano opcional** | **D-2**. Literales en ficheros de i18n desde el primer día, nunca incrustados. Dictamen de `/sdd-lingua` sobre todo el texto visible |
| **Se abre con mala cobertura** | Es principio de producto, no un lujo: móvil primero. Sin fuentes externas ni scripts que bloqueen el render |

### Hallazgo al escribir esta épica: el user-agent filtra vocabulario interno

Planteado por Alberto Fojo el 2026-08-31 —*«¿es buena idea enviar a la RFGF algo
a tan bajo nivel?»*— y comprobado contra `src/mirror/user-agent.ts:26`:

| Dónde | Cadena |
|---|---|
| Código (`USER_AGENT`) | `marcador.gal/0.0.1 (+mailto:ola@tremen.dev; medicion SPEC-002, RN-11)` |
| Carta a la RFGF | `marcador.gal/0.0.1 (+mailto:ola@tremen.dev; medicion RN-11)` |

Divergen, pero **la conclusión no es alinear la carta con el código: es al revés**.
`SPEC-002` y `RN-11` no significan nada fuera de este repositorio. A quien audita
un log le dicen que se le ha colado una herramienta interna.

**Y el argumento fuerte no es de estilo, es operativo.** `SPEC-002` es un
identificador que rota: SPEC-003 ya existe y EPIC-002 traerá adaptadores bajo
specs nuevas. Un user-agent cuyo propósito sigue el número de spec **es una
identidad que no se queda quieta**, y lo que se le pide a la RFGF es justamente
que escriba una identidad estable en su `robots.txt`.

**Lo que hace el cambio barato y seguro** (comprobado el 2026-08-31):
- El emparejamiento de `robots.txt` usa **solo el token de producto**:
  `src/mirror/capture/robots.ts:37` hace `userAgent.split('/')[0]` → `marcador.gal`.
  La línea que añada la RFGF sigue emparejando diga lo que diga el propósito.
- **Ningún test fija el literal.** Todos importan `USER_AGENT`;
  `robots.test.ts:117` solo exige `USER_AGENT_PATTERN` y `toContain('marcador.gal')`,
  y el patrón acepta cualquier propósito (`[^)]+`). Cambiarlo no pone SPEC-002 en
  rojo.

**Y el dominio reabre la otra mitad.** `user-agent.ts` deja escrito que el
contacto es un `mailto:` y **no** una URL de `marcador.gal` porque *«ese dominio
no está contratado, y un contacto que no resuelve es peor que ninguno»*
(F-SPEC-002-1, cerrado por el gate el 2026-08-31). Contratado el dominio ese mismo
día, la razón caduca. El `+` puede apuntar a la página del rastreador, que es
donde el «por qué» cabe en prosa y en galego en vez de comprimido en un
paréntesis.

**Ojo: `USER_AGENT` es de SPEC-002, que está `hecho`.** Tocarlo no es una
corrección de texto, es modificar una spec verificada. Cómo se registra —spec
propia de EPIC-003, nota en el ledger de SPEC-002, o ADR— es de `/sdd-arquitecto`.

**Éxito ≠ visitas.** Esta página no capta a nadie y no lleva analítica. Su público
objetivo es **una persona**: el técnico de la RFGF que reciba la carta y quiera
saber si esto es serio. Si además sirve para responder «¿y esto quién es?» a un
periodista o a un club, bien; no es lo que se mide.

## Alcance

**Dentro:**
- **Sitio estático mínimo en `marcador.gal`**, en el stack ya decidido (ADR-001,
  ADR-004): quién está detrás (tremen.dev, Alberto Fojo), qué se está midiendo y
  por qué, y que **todavía no hay producto**.
- **Página del rastreador**, destino del `+` del user-agent: la cadena literal,
  la frecuencia, la política de `robots.txt`, qué se hace con lo leído y a quién
  escribir para que pare. Es la que de verdad respalda la carta.
- **`robots.txt` propio del sitio.** Pedimos que otros lo respeten; empezar por
  tener el nuestro bien puesto no es cosmético.
- **i18n galego/castellano** desde el primer literal (D-2, `CLAUDE.md`).
- **Alinear el user-agent emitido con la URL publicada**, tocando `src/mirror/`.
  Es el único código de producción que esta épica roza, y es lo que convierte la
  página en verificable en vez de decorativa.

**Fuera (aparcado a propósito, no por descuido):**
- **La landing de `marca.md`**: hero, mockup del marcador, tres frases de
  producto, ligas cubiertas, **formulario de lista de espera**, «queres
  patrocinar?». Sigue en *Más adelante* y sigue esperando al informe. No es
  timidez: hoy el mockup sería inventado y la lista de espera contradiría la carta.
- **Analítica.** Nada de medir visitas. Añade tratamiento de datos personales y
  un dictamen de `/sdd-legal-datos` a cambio de una cifra que no decide nada aquí.
- **Identidad visual y logo.** El logo a 48 px, la paleta y el manual de marca
  siguen en `marca.md` y siguen abajo. Esta página se apaña con tipografía y
  espacio.
- **Redes sociales, nota de prensa y salida pública** (Código Cero, Praza, Nós
  Diario, clubes). Eso es lanzamiento, y no hay nada que lanzar.
- **Cualquier dato de fútbol.** Ni un marcador, ni una clasificación, ni un
  calendario. En esta épica el sitio no toca `src/model/` ni la base de datos.
- **Contratar el dominio y comprobar OEPM.** Son precondición humana, arriba.

## Specs

<!-- El estado por spec vive en el frontmatter de cada spec; el tablero agregado se regenera con /sdd-tablero (docs/tablero.md). No mantengas listas de specs a mano aquí. -->

Descompuesta por `/sdd-arquitecto` el 2026-08-31 en **dos specs**, en `borrador`
y esperando gate. La frontera, en una línea: **SPEC-004 responde *quién está
detrás y qué se está midiendo*; SPEC-005 responde *cómo se lee y cómo se para*.**

- **SPEC-004 — Sitio público de proyecto en marcador.gal: i18n, contenido y
  despliegue.** El mecanismo de i18n galego/castellano con paridad de bundles y
  cero literales incrustados, la página de proyecto, el `robots.txt` propio y el
  apuntado del dominio. **Va primero**, y no por comodidad: SPEC-005 mete
  `https://marcador.gal/robot` dentro del user-agent que se envía a terceros, y
  esa URL tiene que resolver antes o se reintroduce el defecto que F-SPEC-002-1
  evitó.
- **SPEC-005 — Página del rastreador y alineamiento del user-agent declarado.**
  `/robot`, las cinco afirmaciones comprobables de la carta, y el cambio de
  `USER_AGENT` en `src/mirror/user-agent.ts` — el único fichero de producción que
  esta épica toca.

Dos apartamientos de la descomposición orientativa, y por qué: el **`robots.txt`
propio va con SPEC-004** y no con la página del rastreador, porque es una
propiedad del *origen* y dejarlo para después significaría publicar el sitio sin
política de rastreo el día que se vuelve público, que es justo cuando la épica
dice que no es cosmético. Y el **despliegue del dominio va con SPEC-004** en vez
de en spec propia, para no meter un gate humano más en una épica con plazo
externo detrás.

**La decisión técnica que la épica dejaba abierta está decidida: ADR-010** — el
sitio **comparte** repositorio, aplicación y proyecto de Vercel con el futuro
producto. La razón decisiva no es de coste ni de operación: es que en un solo
proyecto la página **importa** `USER_AGENT` y la identidad entre lo publicado y
lo enviado es una propiedad del programa, mientras que separados solo puede
sostenerse transcribiendo — que es exactamente cómo el código y la carta llegaron
a divergir. **ADR-011** registra la forma estable del user-agent, por qué el
propósito no puede llevar identificadores que roten, y por qué el cambio se hace
bajo SPEC-005 y no anotando el ledger de SPEC-002 ni reabriéndola.

## Riesgos

- **La deriva hacia la landing.** Es el riesgo principal y es de manual: la
  página empieza siendo cuatro párrafos honestos y termina con un formulario
  «total, ya que estamos». El día que eso pase, la carta que se mandó apuntando
  ahí queda desmentida por su propio enlace. Por eso «no hay promesa de producto»
  está escrito como criterio de aceptación y no como recomendación.
- **La página es un compromiso público, y el código tiene que sostenerlo.**
  Publicar «vamos a una petición por minuto y respetamos `robots.txt`» convierte
  una regla interna (RN-11) en una afirmación auditable por terceros con sus
  propios logs. Si `src/mirror/` deja de cumplirla, no es un test en rojo: es una
  mentira publicada, justo ante quien más caro cuesta. **Y no hay CI**, así que
  hoy nada lo detecta automáticamente.
- **D-1 se incumple precisamente en la sección «quen está detrás».** Es donde
  apetece contar la historia, y contar la historia es a un renglón de presentarse
  como relevo de marcadorgalego.gal. Inspiración, no sucesión, y el parecido de
  nombre ya está señalado como riesgo de comunicación en `marca.md`.
- **OEPM sigue sin comprobar y el dominio ya está pagado.** El orden barato se
  perdió, pero el gasto grande —identidad visual, logo, manual— aún está por
  delante y sigue detrás de esa comprobación.
- **Retrasa la carta.** Es la única acción del proyecto con plazo externo. Ya no
  espera al dominio, pero sí a esta épica. Si se alarga, hay que poder decidir
  mandarla sin enlace y con el user-agent corregido a mano: se sostiene sola,
  porque el argumento del `robots.txt` bloqueando a Googlebot no necesita
  respaldo web.
- **La retención publicada en `/robot` se vuelve falsa sola el día que exista
  producción.** ADR-009 fija el plazo del archivo de **medición** —30 días desde
  el fin de la ventana, una prórroga escrita, techo duro de 90— y deja **sin
  fijar el de producción** (lo dice el propio ADR; F-SPEC-001-1), mientras que la
  página promete ese plazo **en general**: el día que haya producción con otro
  plazo, la página pasa a ser falsa **sin que nadie la edite y sin que ningún test
  se entere**. No depende de que alguien olvide una tarea; se rompe solo.
  **Disparador: la primera spec que persista datos en producción no se aprueba sin
  un ADR que fije la retención de producción** — es precondición de su gate, no
  trabajo de esta épica. Escribir ese ADR hoy sería inventar un plazo sin
  producción, sin modelo de datos de producción y sin dictamen de
  `/sdd-legal-datos`, y ADR-009 dejó ese número sin fijar **a propósito**. **No
  obliga a tocar el texto de `/robot`**: `/sdd-legal-datos` dictaminó el
  2026-08-31 que declarar el plazo es correcto y cierto como compromiso, con
  riesgo global bajo. Viene de F-SPEC-005-V2 (segundo riesgo), registrado el
  2026-09-01.
- **«Non republicamos os datos de ninguén» tampoco sobrevive a producción, y no
  es solo esa frase: es el párrafo.** Lo planteó Alberto Fojo el 2026-09-01. El
  texto de `/robot` dice «Non republicamos os datos de ninguén. **Isto é unha
  medición, e o resultado é un informe interno. Non hai marcador público**…»: las
  dos frases siguientes no son adorno, son **la justificación**, y la tercera
  describe justamente lo que el proyecto existe para construir. El día que haya
  marcador público, las tres son falsas a la vez. Y falla por dos sitios: en
  lenguaje llano —se mostrarían datos obtenidos de otro— y en el sentido del
  **derecho *sui generis*** (`retos.md`), porque publicar sistemáticamente lo
  extraído es reutilización. El proyecto ya lo tenía escrito: **ADR-002 §76-78**
  —«las ToS de ceroacero restringen el scraping; en producción hay que
  sustituirla o licenciarla»—. **La defensa real es RN-08**: lo que se publica es
  una `Decision` propia, no el dato ajeno. Pero ese argumento vale lo que valga
  la pluralidad de fuentes, y EPIC-001 descubrió que **hoy hay una sola fuente
  automática capturable**: con una sola, una `Decision` es el dato de ceroacero
  con pasos intermedios. El argumento no es falso, está **vacío hoy**, y se
  llenará con corresponsales, autorización de la RFGF o una fuente licenciada.
- **Y el patrón, que importa más que las dos frases sueltas: `/robot` está
  escrito en presente de un proyecto que no tiene producción.** Son ya **dos**
  afirmaciones con fecha de caducidad —la retención y esta—, las dos con la misma
  forma: se vuelven falsas solas, sin que nadie las edite y sin que ningún test
  se entere. Parchear frase por frase cuando alguien se da cuenta es peor que
  asumirlo. **Disparador: antes de que exista producción, `/robot` se
  re-dictamina entero** —`/sdd-legal-datos` y `/sdd-lingua`— como precondición,
  no como tarea. La pregunta *sui generis* con ToS de por medio está marcada
  además como **revisión profesional**: no es para hoy, es para antes de publicar
  el primer marcador.
- **Coste de oportunidad.** Es la primera vez que el proyecto construye algo que
  no es medición. Es poco trabajo, pero EPIC-001 sigue bloqueada y EPIC-002 sin
  empezar: esta épica no puede convertirse en el sitio cómodo donde refugiarse
  del problema difícil, que es que hay una sola fuente capturable.
