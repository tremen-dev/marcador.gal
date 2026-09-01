---
id: ADR-010
tipo: adr
estado: borrador
historial:
  - {estado: borrador, fecha: 2026-08-31, por: sdd-arquitecto}
---
# ADR-010: Un solo despliegue para el sitio de proyecto y el futuro producto

- Deciders: propone `sdd-arquitecto`, a partir de la decisión que **EPIC-003 deja
  explícitamente abierta** («si este sitio es un despliegue aparte o comparte
  proyecto Vercel y repositorio con el futuro producto … es material de ADR»).
  **Aprueba: Alberto Fojo.**
- Specs relacionadas: **SPEC-004** (la ejecuta: dominio, routing, i18n),
  **SPEC-005** (depende de ella: la página del rastreador importa `USER_AGENT`
  del mismo proyecto). Aguas abajo, toda spec de interfaz de EPIC-002 y del
  producto hereda esta base.
- Relacionado: **ADR-001** (stack y despliegue único), **ADR-004** (Vercel Pro).
  **No supersede a ninguno**: aplica ADR-001 a un caso que ADR-001 no
  contemplaba, porque cuando se escribió no había sitio público.

## Contexto

EPIC-003 necesita un sitio público en `marcador.gal` que respalde la carta a la
RFGF. Los hechos, todos verificados el 2026-08-31:

- **El dominio ya es nuestro.** `marcador.gal` registrado en Dinahosting,
  expiración 2027-08-31, delegado a `ns{,2,3,4}.dinahosting.com` y resolviendo a
  `82.98.135.43`, que es **su página de aparcamiento**. Apuntarlo al despliegue
  está sin hacer.
- **El repositorio ya está vinculado a un proyecto de Vercel.**
  `.vercel/project.json` → `projectName: marcador-gal`. La infraestructura del
  despliegue compartido existe; lo que falta es decidir si es la que se usa.
- **ADR-001 ya decidió despliegue único**: «un único proyecto y un único
  despliegue contienen frontend, rutas de API (snapshot y stream) y las funciones
  de cron de ingesta». Lo decidió para el producto, con el sitio público fuera
  del horizonte.
- **ADR-004 factura por asiento**, 20 $/usuario/mes. Un segundo proyecto en la
  misma cuenta **no cuesta dinero**. El coste de separar no es económico, es de
  operación y de acoplamiento.
- **Next.js y `src/app` ya están en el repositorio**, con `layout.tsx`,
  `page.tsx` —que hoy renderiza literalmente `marcador.gal`— y
  `_contract/model-client.tsx`.

**La pregunta no es de infraestructura, es de qué garantiza el diseño.** El
criterio de éxito duro de EPIC-003 es que la cadena del user-agent publicada
coincida **carácter a carácter** con la que se envía: «si divergen, el sitio
miente». Ya hay una divergencia real y viva entre `src/mirror/user-agent.ts` y la
carta, producida por el único mecanismo que existe cuando dos artefactos separados
tienen que decir lo mismo: la transcripción a mano.

## Decisión

**El sitio de proyecto y el futuro producto comparten repositorio, aplicación
Next.js y proyecto de Vercel.** Concretamente:

1. **Un repositorio** (este) y **una aplicación** (`src/app`, App Router,
   ADR-001). El sitio son rutas más del mismo árbol.
2. **Un proyecto de Vercel**, el ya vinculado `marcador-gal`, con `main` como
   rama de producción.
3. **Dominio:** `marcador.gal` (ápice) es el canónico y apunta a Vercel;
   `www.marcador.gal` redirige `308` al ápice. El nombre corto es el que viaja en
   la carta.
4. **Routing por lengua:** galego **sin prefijo**, castellano bajo `/es`. La
   lengua está en la URL y no en el estado del cliente (D-2 hecho estructura).
5. **URL permanentes.** `/proxecto` y `/robot` —con sus gemelas `/es/proxecto` y
   `/es/robot`— **no se mueven nunca**. `/` redirige hoy a `/proxecto` y **queda
   reservada para el producto**. `/robot` es la más dura de las dos: viaja dentro
   del user-agent de cada petición que hacemos, y terceros la van a copiar en sus
   logs y en su `robots.txt`. Romperla no es un 404, es una identidad que se
   evapora.
6. **Nada que la aplicación publique sobre sí misma se transcribe.** Lo importa.
   `USER_AGENT` es el primer caso y el que decide este ADR. **El buzón de
   contacto es el segundo**, y llegó después: Alberto Fojo decidió el 2026-08-31
   que `ola@tremen.dev` es provisional y que en producción será alguno
   `@marcador.gal`. Aparece en `/proxecto`, en `/robot` y posiblemente en el
   `robots.txt` propio —tres sitios, una sola definición (SPEC-004 CA-13)—, y en
   un solo despliegue eso es una constante compartida en lugar de tres copias que
   migran por separado. Es la misma propiedad que la razón decisiva de abajo,
   aplicada a un valor que **sabemos** que va a cambiar.

**La razón decisiva es la 6.** En un solo proyecto, la página del rastreador hace
`import { USER_AGENT } from '@/mirror/user-agent'` y la identidad entre lo
publicado y lo enviado **es una propiedad del programa**, comprobable por el
compilador y por un test. En dos proyectos solo puede sostenerse copiando la
cadena, es decir, con la misma disciplina que ya falló entre el código y la carta.
Es el mismo argumento con el que ADR-001 eligió Node: un solo esquema para el
contrato que cruza la frontera, porque mantenerlo a mano en dos sitios es «una
fuente permanente de desincronización silenciosa».

Las razones 1 a 3 son secundarias y no habrían bastado solas: cero coste
adicional, cero operación adicional, un solo apuntado de DNS, y la mecánica de
i18n que D-2 exige escrita una vez en lugar de dos.

## Consecuencias

### Positivas
- **El criterio de éxito de EPIC-003 pasa de ser una promesa a ser un tipo.** La
  divergencia deja de poder ocurrir por descuido.
- El sitio es estático y se sirve desde el CDN de Vercel, que es exactamente
  donde ADR-004 dice que la plataforma es netamente mejor.
- El producto **hereda esta base**: el mecanismo de i18n, el `robots.txt`
  generado por la aplicación y el layout ya existirán cuando llegue la interfaz
  del marcador. No hay que rehacerlos ni migrarlos.
- Una sola configuración de dominio, un solo certificado, un solo pipeline.

### Negativas / follow-ups
- **Un fallo de build en `src/ingest/` tumba la promoción de una página que
  terceros están auditando.** Es el coste real de compartir, y hoy es teórico
  —`src/ingest/` no existe y no hay cron desplegado—, pero dejará de serlo con
  EPIC-002. Mitigación parcial: el sitio es prerenderizado y el despliegue
  anterior sigue servido hasta que uno nuevo se promueve. **Follow-up:** si esto
  llega a morder, la salida es la alternativa B de abajo, y es un cambio de
  configuración sobre tres rutas, no una reescritura.
- **Los despliegues de vista previa exponen borradores de una página que es un
  compromiso público.** Las URL de preview de Vercel no se indexan, pero son
  alcanzables por quien tenga el enlace. **Follow-up: activar la protección de
  despliegue sobre previews antes de que el sitio se enlace en la carta.**
- **`/` deja de ser el sitio de proyecto el día que llegue el producto**, y hay
  que quitar la redirección. Este ADR es el registro de por qué `/proxecto`
  existe desde el primer día, para que ese cambio sea una línea y no una
  discusión.
- El proyecto de Vercel acumula las cuotas de las dos cosas (funciones, crons).
  Irrelevante hoy: el sitio no tiene ninguna.
- **`/robot` se vuelve una dependencia operativa del rastreador** (ADR-011): si
  el sitio cae, el contacto del user-agent apunta a un 404. La consecuencia se
  registra entera allí, porque es donde se decide meterla en la cadena.

## Alternativas consideradas

- **Proyecto de Vercel y repositorio aparte.** Rechazada, y es la que el defecto
  central descarta: el sitio no podría importar `USER_AGENT` y la identidad entre
  lo publicado y lo enviado volvería a depender de que nadie olvide actualizar
  dos sitios. Además duplicaría el mecanismo de i18n que D-2 obliga a tener en
  todo lo visible, y necesitaría su propio ADR para reinterpretar el despliegue
  único de ADR-001.
- **Mismo repositorio, dos proyectos de Vercel** (monorepo con dos directorios
  raíz). **Es la alternativa fuerte**, y resuelve la objeción principal: el
  código sigue compartido, así que el `import` sobrevive, y a cambio se gana
  aislamiento de despliegue —el sitio no se cae porque el ingestor no compile—.
  Rechazada **por proporción, no por diseño**: son tres rutas estáticas sin
  tráfico, y el aislamiento se compra con un segundo proyecto, una segunda
  configuración de dominio y un cambio en la herramienta de build, hoy, para un
  riesgo que hoy no existe. Queda **explícitamente disponible**: es el primer
  sitio al que ir si el follow-up de arriba se activa, y no requiere mover
  ninguna URL.
- **Alojamiento estático fuera de Vercel** (páginas de Dinahosting, GitHub
  Pages). Es lo más barato y lo más aislado. Rechazada por el mismo motivo que la
  primera —se pierde el `import`— y porque parte el stack en dos contra ADR-001 a
  cambio de ahorrar cero euros, ya que Vercel Pro se paga por asiento.
- **Servir el sitio desde el ápice y el producto desde un subdominio**
  (`app.marcador.gal`). Rechazada: el producto es lo que la gente va a buscar
  escribiendo `marcador.gal`, y regalarle el nombre corto a una página que existe
  para respaldar una carta es hipotecar el activo por comodidad de hoy. La
  redirección de `/` a `/proxecto` resuelve lo mismo sin gastar el ápice.
- **Dejar el dominio aparcado y mandar la carta sin enlace.** No es una
  alternativa de arquitectura: es el plan de contingencia que EPIC-003 registra
  en sus riesgos, y sigue vigente si esta épica se alarga.
