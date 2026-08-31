---
id: SPEC-005
tipo: ledger
epica: EPIC-003
---
# Ledger — SPEC-005 Página del rastreador y alineamiento del user-agent declarado

## Resumen
- Fase: **borrador**. Escrita por `sdd-arquitecto` el 2026-08-31. Espera gate
  humano. **No empieza antes que SPEC-004**: si se implementa primero, el
  user-agent apuntaría a un 404 en cada petición — el defecto exacto que
  F-SPEC-002-1 evitó.
- **Único fichero de producción que toca la épica**: `src/mirror/user-agent.ts`.
  CA-10 lo comprueba con `git diff --stat`.
- **CA-12 bloquea el cierre por partida doble**: dictamen de `/sdd-lingua`
  sobre el texto, y de `/sdd-legal-datos` sobre las tres afirmaciones
  jurídicas (robots.txt, no republicación, retención).
- Rama: `ft/SPEC-005-pagina-del-rastreador-y-alineamiento-del-user-agent-declarado`
- **CA-13 cierra la pregunta que estaba abierta**: `/robot` NO cita a futgal
  ni a ninguna otra fuente (Alberto Fojo, 2026-08-31). El caso concreto se
  queda en la carta. El test se aplica al HTML de `/robot`, no al bundle
  entero: `/proxecto` si nombra las competiciones (SPEC-004 CA-8.2).
- **El riesgo residual de ADR-011 esta ACEPTADO** por Alberto Fojo el
  2026-08-31, con CA-5 como unica compensacion.
- **Fase: implementada, a la espera de verificación** (`sdd-implementador`,
  2026-08-31). Rama real: `ft/SPEC-005-pagina-del-rastreador`. **CA-12 sigue
  abierto por partida doble**: ningún literal de `/robot` tiene dictamen.

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 | `src/mirror/user-agent.ts` (`USER_AGENT`, `USER_AGENT_CONTACT`, comentario de cabecera reescrito) | `tests/mirror/user-agent.test.ts` casos 1-7: igualdad literal con la cadena aprobada; composición desde `USER_AGENT_PRODUCT`/`_VERSION`; token congelado; ASCII y `medicion` sin tilde; casa con `USER_AGENT_PATTERN` sin tocarlo; la cabecera cita la fecha, F-SPEC-002-1 y dónde vive ahora RN-11; y no lleva ninguna dirección de correo | | ❌ |
| CA-2 | `src/site/crawler-page.tsx` (`import { USER_AGENT }`, `<code>{USER_AGENT}</code>`) | `tests/site/crawler-page.test.ts` casos 1-3: el HTML de las dos rutas contiene la cadena exacta; el escaneo de `src/` entero exige que NADIE contenga la cadena montada y que `medicion de latencia` solo aparezca en `mirror/user-agent.ts`; y el caso 3 la compara además contra un literal para que no pase comparándose consigo misma | | ❌ |
| CA-3 | `src/mirror/user-agent.ts`, `src/i18n/gl.ts`, `src/i18n/es.ts` (namespace `crawler`) | `tests/mirror/user-agent.test.ts` caso 8 (la cadena) y `tests/site/crawler-page.test.ts` caso 4 (el HTML de las dos rutas): ni `SPEC-`, ni `RN-`, ni `EPIC-`, ni `ADR-` | | ❌ |
| CA-4 | `src/mirror/user-agent.ts` (`USER_AGENT_CONTACT = 'https://marcador.gal/robot'`) | `tests/mirror/user-agent.test.ts` casos 9-11: **literal** `https://marcador.gal/robot`, igualdad con `${SITE_ORIGIN}${CRAWLER_PATH.gl}` y literales para `SITE_ORIGIN` y `CRAWLER_PATH.gl`, y ya no es un `mailto:`. **La mitad de producción —que la URL responda `200` en el sitio desplegado— es del verificador** | | ❌ |
| CA-5 | `src/site/crawler-page.tsx` (primer bloque: `intro` + `contact` con `withMailbox`), `src/site/mailbox-link.tsx`, buzón desde `src/site/contact.ts` | `tests/site/crawler-page.test.ts` casos 5-7: `href="mailto:${MAILBOX}"` presente; su posición en el documento es **anterior al segundo encabezado**; y la frase que dice que ahí se pide que paremos y que se para se sirve entera | | ❌ |
| CA-6 | `src/i18n/crawler-bundle.ts` (contrato), `src/i18n/gl.ts` y `src/i18n/es.ts` (namespace `crawler`, una clave por afirmación), `src/i18n/crawler.ts`, `src/site/crawler-page.tsx` | `tests/site/crawler-page.test.ts` casos 8-17: las seis claves existen y no están vacías en las dos lenguas; las seis se sirven enteras; el tope en número; robots.txt sin excepción y «hai fontes que hoxe non lemos»; no republicación e informe interno; crudo antes de interpretar + 30/90 días + una prórroga; cómo pedir que pare; y **nada más** (lista negra de producto, D-1, sin script, sin fecha, sin URL absoluta ajena) | | ❌ |
| CA-7 | `src/app/(gl)/robot/page.tsx`, `src/app/(es)/es/robot/page.tsx` | `tests/site/crawler-routes.test.ts` casos 1-5: `/robot` y `/es/robot` fijados con **literales**; existe el directorio de ruta de cada una; ninguna redirección las tiene por origen; el único comodín es el de `www` y sale del ápice; y la dirección del user-agent es la del ápice. **El `200` sin `3xx` sobre el despliegue es del verificador** (medido en local: ver Evidencia) | | ❌ |
| CA-8 | `docs/negocio/carta-rfgf-acceso.md` (párrafo «O que fago e o que non» y notas finales) | `tests/docs/carta-y-rastro.test.ts` casos 1-3: la carta contiene `USER_AGENT` exacta y en una sola línea; no contiene ninguna de las dos formas viejas; y sigue pidiendo `User-agent: marcador.gal` / `Allow: /`, que es lo que empareja | | ❌ |
| CA-9 | Sin código nuevo: se **usa** `src/mirror/capture/robots.ts`, que no se toca | `tests/mirror/user-agent.test.ts` casos 12-14, con fixture **sintético** escrito en el propio test (ADR-009 §3): con el grupo que pide la carta las dos rutas quedan permitidas; sin él, el comodín deja fuera a las dos; y la misma línea empareja con la cadena vieja y con la nueva, que es lo que hace barato el cambio | | ❌ |
| CA-10 | `src/mirror/user-agent.ts`, y nada más dentro de `src/mirror/` | `tests/mirror/user-agent.test.ts` caso 15: `git diff --name-only main -- src/mirror/` y ningún fichero distinto de `src/mirror/user-agent.ts`. Suite completa, `typecheck` y `lint` en Evidencia | | ❌ |
| CA-11 | `docs/epicas/EPIC-001-spike-ingesta/SPEC-002-…​.ledger.md`, sección «Referencia cruzada — 2026-08-31» | `tests/docs/carta-y-rastro.test.ts` casos 4-5: el ledger de SPEC-002 nombra a SPEC-005 y lleva la cadena nueva; y la nota dice que la razón registrada al cerrar F-SPEC-002-1 caducó, con fecha y con el `mailto:` nombrado | | ❌ |
| CA-12 | Texto escrito y **pendiente de los dos dictámenes**. `sdd-implementador` no los puede pedir | Sin test: es un CA de proceso. Los literales íntegros, en las dos lenguas, están transcritos abajo en «Salvedades» para llevarlos a `/sdd-lingua` y a `/sdd-legal-datos` | | ❌ |
| CA-13 | `src/i18n/gl.ts`, `src/i18n/es.ts` (namespace `crawler`): la regla general, sin citar a nadie | `tests/site/crawler-page.test.ts` casos 18-19: ni `futgal`, ni `ceroacero`, ni `besoccer`, ni `resultados-futbol`, ni `rfgf` en el HTML de las dos rutas, sin acentos y en minúsculas; y el caso 19 comprueba que la prohibición **no** alcanza a `/proxecto`, que sigue nombrando las competiciones (SPEC-004 CA-8.2) | | ❌ |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-005/. Informe HTML opcional: _qa/SPEC-005/informe.html -->

**Sobre el HTML realmente servido** por `next build && next start`
(`127.0.0.1:3111`, 2026-08-31). Archivado en `_qa/SPEC-005/servido-gl-robot.html`
y `_qa/SPEC-005/servido-es-robot.html`.

| Comprobación | `/robot` | `/es/robot` |
|---|---|---|
| Código de respuesta, sin `3xx` por delante (CA-7) | `200` | `200` |
| Cadena `USER_AGENT` exacta en el HTML (CA-2) | sí | sí |
| `SPEC-` / `RN-` / `EPIC-` / `ADR-` (CA-3) | ninguno | ninguno |
| `mailto:ola@tremen.dev` antes del 2.º encabezado (CA-5) | offset 1178 < 1321 | offset 1189 < 1332 |
| `futgal` · `ceroacero` · `besoccer` · `resultados-futbol` · `rfgf` (CA-13) | ninguno | ninguno |
| URL absolutas de terceros | ninguna | ninguna |
| `<script src>` externos | ninguno (12 `<script>`, todos `/_next/…`, **igual que `/proxecto`**) | ídem |
| Años (`19xx`/`20xx`) | ninguno | ninguno |

**Gates, ejecutados enteros el 2026-08-31 con el árbol final:**

- `npx vitest run --typecheck` → **66 ficheros, 591 tests, todos verdes**, `Type Errors  no errors`. Partida: 62 ficheros / 544 tests.
- `npx oxlint --type-aware` → **exit 0**, sin salida.
- `npx next build` → compila, y prerenderiza `/robot` y `/es/robot` como estáticas.
- `git diff --name-only main -- src/mirror/` → **`src/mirror/user-agent.ts`, y solo ese** (CA-10).

## Salvedades / follow-ups
<!-- IDs F-SPEC-005-1, F-SPEC-005-2… con destino (spec futura o EPIC-MEJORA). -->

### CA-12 — LOS DOS DICTÁMENES ESTÁN PENDIENTES, Y BLOQUEAN EL CIERRE

`sdd-implementador` no puede pedirlos. **Ningún literal de abajo está dado por
bueno**: son el texto escrito, no el texto aprobado.

- **`/sdd-lingua`**: todo el texto visible de `/robot` y `/es/robot`, íntegro.
- **`/sdd-legal-datos`**: los puntos 3, 4 y 5 de CA-6 —respeto a `robots.txt`,
  no republicación y retención—, que publicados dejan de ser postura interna y
  pasan a ser compromiso frente a terceros.
- **Y una tercera cosa que la spec no previó**: el párrafo reescrito de
  `docs/negocio/carta-rfgf-acceso.md` (CA-8) también es galego visible por un
  tercero, y también va sin dictamen.

**Los literales, para llevarlos a los dictámenes.** Galego (`gl.crawler` de
`src/i18n/gl.ts`), en el orden en que se leen:

- `heading`: «O rastrexador de marcador.gal»
- `intro`: «Esta páxina explica como marcador.gal le páxinas públicas de resultados de fútbol: con que nome se identifica, con que ritmo pide, que respecta e que fai co que le. Está aquí para que calquera que vexa ese nome no seu rexistro de acceso poida comprobalo sen ter que preguntar.»
- `contact`: «Se prefires que non leamos o teu sitio, escribe a {mailbox} e deixamos de facelo. Abonda con pedilo: non fai falta alegar nada nin dar explicacións.»
- `userAgentHeading`: «Con que nome nos identificamos»
- `userAgent`: «En cada petición vai esta cadea de identificación, e é exactamente esta:»
- `userAgentNote`: «O primeiro anaco, o que vai antes da barra, é o nome co que se nos pode nomear nun ficheiro robots.txt; é o único que miramos ao comprobar se un sitio nos deixa pasar.»
- `rateHeading`: «Con que frecuencia»
- `rate`: «Como máximo unha petición por minuto a cada sitio e por cada competición. As peticións non gastadas non se acumulan: un minuto sen pedir non dá dereito a dúas no seguinte.»
- `robotsHeading`: «O ficheiro robots.txt»
- `robots`: «Respectamos sempre o ficheiro robots.txt do sitio. Se unha regra que nos afecta prohibe unha ruta, non a pedimos, e non hai excepción: non a levanta identificarse doutro xeito, nin baixar aínda máis o ritmo, nin que a medición dure só unha hora. E se non temos cargada a política dun sitio, tampouco lle pedimos nada. Hai fontes que hoxe non lemos precisamente por iso.»
- `noRepublishHeading`: «Que non facemos co que lemos»
- `noRepublish`: «Non republicamos os datos de ninguén. Isto é unha medición, e o resultado é un informe interno. Non hai marcador público, nin ficheiro de datos, nin nada que se poida consultar fóra do proxecto.»
- `storageHeading`: «Que gardamos e canto tempo»
- `storage`: «Gardamos a resposta tal e como chega, antes de interpretala, para poder repetir a análise sen ter que pedir nada outra vez. Ese arquivo bórrase aos 30 días de rematar a xanela de observación. Pódese prorrogar unha soa vez, por escrito e motivada, e nunca máis alá dos 90 días.»
- `stopHeading`: «Como pedir que pare»
- `stop`: «Escribe a {mailbox} e paramos. Abonda con pedilo. Tamén serve engadir unha regra no teu propio robots.txt: lémolo antes de cada xanela de observación e respectámolo.»
- `otherLanguage`: «Castellano»

Castellano (`es.crawler` de `src/i18n/es.ts`), mismas claves:

- `heading`: «El rastreador de marcador.gal»
- `intro`: «Esta página explica cómo marcador.gal lee páginas públicas de resultados de fútbol: con qué nombre se identifica, con qué ritmo pide, qué respeta y qué hace con lo que lee. Está aquí para que cualquiera que vea ese nombre en su registro de acceso pueda comprobarlo sin tener que preguntar.»
- `contact`: «Si prefieres que no leamos tu sitio, escribe a {mailbox} y dejamos de hacerlo. Basta con pedirlo: no hace falta alegar nada ni dar explicaciones.»
- `userAgentHeading`: «Con qué nombre nos identificamos»
- `userAgent`: «En cada petición va esta cadena de identificación, y es exactamente esta:»
- `userAgentNote`: «El primer trozo, el que va antes de la barra, es el nombre con el que se nos puede nombrar en un fichero robots.txt; es lo único que miramos al comprobar si un sitio nos deja pasar.»
- `rateHeading`: «Con qué frecuencia»
- `rate`: «Como máximo una petición por minuto a cada sitio y por cada competición. Las peticiones no gastadas no se acumulan: un minuto sin pedir no da derecho a dos en el siguiente.»
- `robotsHeading`: «El fichero robots.txt»
- `robots`: «Respetamos siempre el fichero robots.txt del sitio. Si una regla que nos afecta prohíbe una ruta, no la pedimos, y no hay excepción: no la levanta identificarse de otra manera, ni bajar todavía más el ritmo, ni que la medición dure solo una hora. Y si no tenemos cargada la política de un sitio, tampoco le pedimos nada. Hay fuentes que hoy no leemos precisamente por eso.»
- `noRepublishHeading`: «Qué no hacemos con lo que leemos»
- `noRepublish`: «No republicamos los datos de nadie. Esto es una medición, y el resultado es un informe interno. No hay marcador público, ni fichero de datos, ni nada que se pueda consultar fuera del proyecto.»
- `storageHeading`: «Qué guardamos y cuánto tiempo»
- `storage`: «Guardamos la respuesta tal y como llega, antes de interpretarla, para poder repetir el análisis sin tener que pedir nada otra vez. Ese archivo se borra a los 30 días de terminar la ventana de observación. Se puede prorrogar una sola vez, por escrito y motivada, y nunca más allá de los 90 días.»
- `stopHeading`: «Cómo pedir que pare»
- `stop`: «Escribe a {mailbox} y paramos. Basta con pedirlo. También sirve añadir una regla en tu propio robots.txt: lo leemos antes de cada ventana de observación y lo respetamos.»
- `otherLanguage`: «Galego»

### De dónde sale cada afirmación de hecho de la página

Las dos vueltas fallidas de SPEC-004 fallaron por afirmar cosas razonadas en vez
de leídas. Esta página afirma hechos ante quien puede contrastarlos con sus
propios registros, así que cada uno lleva su fuente. **Si una frase no aparece
aquí, no está en la página.**

| Frase de la página | Fuente, con fichero y línea |
|---|---|
| La cadena de identificación literal | `src/mirror/user-agent.ts:37` — se importa, no se transcribe |
| «o nome co que se nos pode nomear nun ficheiro robots.txt; é o único que miramos» | `src/mirror/capture/robots.ts:37`: `userAgent.split('/')[0]`. Lo que va tras la barra no participa |
| «unha petición por minuto a cada sitio e por cada competición» | RN-11 (`docs/fundacion/reglas.md:136-138`) y `src/mirror/thresholds.ts:16-20`, que lo lee como un par (fuente, competición) — es decir, **a cada sitio** una por minuto. `src/mirror/capture/capturer.ts:92-95` |
| «As peticións non gastadas non se acumulan» | `src/mirror/capture/capturer.ts:92-95` y `:102`: el instante se sella antes del `await` y el `#isDue` compara contra el último envío, no contra un presupuesto acumulado |
| «Respectamos sempre o ficheiro robots.txt» | RN-11; `src/mirror/capture/capturer.ts:104-107`, que registra el tick como `skipped` y no pide |
| «non a levanta identificarse doutro xeito, nin baixar aínda máis o ritmo, nin que a medición dure só unha hora» | ADR-008 §1 y `docs/epicas/EPIC-001-spike-ingesta/hallazgos/fontes-capturables.md:53`: «No hay salida técnica: apuntar ahí sería incumplir RN-11 a sabiendas» |
| «se non temos cargada a política dun sitio, tampouco lle pedimos nada» | `src/mirror/capture/robots.ts:13-15` (cabecera: «An origin with no policy loaded is DISALLOWED») y `:56-67` (`robotsRegistry`) |
| «Hai fontes que hoxe non lemos precisamente por iso» | `hallazgos/fontes-capturables.md:66` («no es capturable: su `robots.txt` prohíbe el rastreo») y `:50-53` (la única superficie con el dato está bajo un `Disallow`). **En general y sin citar a ninguna**, que es CA-13 |
| «Non republicamos os datos de ninguén… o resultado é un informe interno» | `docs/negocio/carta-rfgf-acceso.md:63-64` («Non republico os seus datos: isto é medición, e o resultado é un informe interno») |
| «Gardamos a resposta tal e como chega, antes de interpretala» | RN-10 (`docs/fundacion/reglas.md:132-134`) y `src/mirror/capture/capturer.ts:111-123` (`captureThenParse`, con el parser de la fase A como identidad) |
| «bórrase aos 30 días… unha soa vez… nunca máis alá dos 90 días» | ADR-009 §2, líneas 159-160 y 147 |
| «Escribe a {mailbox} e paramos. Abonda con pedilo» | RN-11 (identificación con dónde quejarse) y `docs/negocio/carta-rfgf-acceso.md:69` («se prefiren que non o faga, dígano e non o fago») |
| «lémolo antes de cada xanela de observación» | `src/mirror/capture/robots.ts:5-11` (F-SPEC-002-2: el operador lo carga una vez, antes de la ventana) |

### Hallazgos

- **F-SPEC-005-1 — `/robot` hereda el `<title>` de la página de proyecto.** El
  HTML servido de `/robot` dice `O proxecto — marcador.gal`, y el de `/es/robot`
  dice `El proyecto — marcador.gal`. **Comprobado sobre el servidor real**, no
  deducido. La causa es estructural: `<title>` lo emite `SiteDocument`, que es un
  **root layout** y no puede recibir nada de la página que envuelve. Arreglarlo
  significa mover `<title>` del documento a cada página —código de SPEC-004 que
  **ningún CA de SPEC-005 pide**—, así que no se ha tocado y la clave
  `documentTitle` **no** existe en `CrawlerBundle`; el motivo queda escrito en la
  cabecera de `src/i18n/crawler-bundle.ts`. No rompe ningún CA (ninguno habla del
  título) pero es visible para el destinatario de la carta, que es el único
  lector que esta página tiene. **Destino: decisión de arquitectura.**
- **F-SPEC-005-2 — F-SPEC-004-9 queda cerrado SOLO para `/robot` y `/es/robot`.**
  `tests/site/crawler-routes.test.ts` casos 1-2 fijan las dos direcciones con
  **literales** y comprueban además que existe el directorio del App Router de
  cada una, así que un renombrado silencioso de `CRAWLER_PATH` ya se pone rojo.
  **`PROJECT_PATH.gl` y `PROJECT_PATH.es` siguen sin ninguna aserción literal**:
  renombrarlas sigue comparando el valor consigo mismo. No se ha arreglado
  porque ningún CA de esta spec lo pide y ampliar el alcance por cuenta propia no
  es del implementador. **Destino: EPIC-MEJORA o donde decida arquitectura.**
- **F-SPEC-005-3 — el commit `c203ba1` arrastró trabajo ajeno a esta spec.** Un
  `git add -A` metió en ese commit los dos ADR y las dos specs que estaban
  `untracked`, las capturas de `_qa/SPEC-004/` y las modificaciones pendientes de
  `CLAUDE.md`, `README.md`, `docs/fundacion/`, `docs/roadmap.md` y
  `docs/tablero.md`. **No se ha perdido nada** —que era el riesgo declarado— y
  todo está en la rama, pero el commit mezcla dos cosas. No se ha rehecho porque
  el encargo prohíbe `git reset`. **Destino: decisión humana antes del PR.**
- **F-SPEC-005-4 — sin CI, nada de esto lo comprueba nadie.** Heredado de
  F-SPEC-004-3, y aquí muerde más: la página publica RN-11 como compromiso
  auditable por terceros con sus propios registros. Si `src/mirror/` deja de
  cumplirla no es un test en rojo, es una mentira publicada. **Destino:
  EPIC-MEJORA.**
- **F-SPEC-005-5 — la carta sigue sin poder mandarse.** CA-4 y CA-7 solo quedan
  cerrados del todo cuando `https://marcador.gal/robot` responde `200` en
  producción, y eso depende de apuntar el DNS a Vercel (SPEC-004 CA-1, acción
  humana pendiente). Hasta entonces el user-agent que sale por el cable apunta a
  una dirección que no resuelve, que es **el defecto exacto que F-SPEC-002-1
  evitaba**. La nota está escrita también en la propia carta. **Destino: acción
  humana, y es previa a enviar.**

### Fuera de los CA, y por qué

- **`tests/site/contact.test.ts`: borrada la excepción `PENDING_SPEC_005`.** No es
  ampliación de alcance, es lo contrario: al salir el `mailto:` de
  `user-agent.ts` ese test se puso rojo, tal y como SPEC-004 lo diseñó
  (F-SPEC-004-1, igualdad exacta y no subconjunto). La línea se borra, que es la
  única forma en que una excepción sale de un repositorio.
- **`src/site/mailbox-link.tsx`: el helper `withMailbox` se extrae de
  `project-page.tsx` y se comparte.** `/robot` necesita el mismo enlace, y dos
  implementaciones del mismo enlace habrían puesto de vuelta la segunda copia de
  la dirección —en el marcado en vez de en la cadena—, que es justo lo que
  SPEC-004 CA-13 existe para impedir. **El HTML de `/proxecto` no cambia**: mismo
  JSX, misma salida. Es lo único que se ha tocado del código de SPEC-004 más allá
  de añadir claves a los bundles.

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->

**Rama: `ft/SPEC-005-pagina-del-rastreador`**, creada desde
`ft/SPEC-004-sitio-publico-de-proyecto` (no desde `main`: SPEC-004 es
dependencia). Cuatro commits, todos con `Refs: SPEC-005`:

1. `aae9bbf` — la cadena nueva en `src/mirror/user-agent.ts` + sus tests + la
   excepción de SPEC-004 borrada.
2. `c203ba1` — `/robot` y `/es/robot` (y el arrastre de F-SPEC-005-3).
3. `4fa91d8` — la carta y la referencia cruzada en el ledger de SPEC-002.
4. `3a77b45` — el HTML servido, archivado en `_qa/SPEC-005/`.

**Hecho:** los trece CA tienen implementación y test salvo CA-12, que es de
proceso. Suite 591/591, `typecheck` limpio, `oxlint --type-aware` exit 0,
`next build` prerenderiza las dos rutas nuevas.

**Lo que falta, en orden:**

1. **Los dos dictámenes de CA-12** (`/sdd-lingua` y `/sdd-legal-datos`). Los
   literales íntegros están transcritos arriba. **Sin los dos, la spec no
   cierra**, y ningún literal de la página está dado por bueno.
2. **La verificación sobre el despliegue**: `https://marcador.gal/robot` y
   `/es/robot` respondiendo `200` sin `3xx` (CA-4 y CA-7). Depende de apuntar el
   DNS, que sigue siendo acción humana de SPEC-004.
3. **Decidir F-SPEC-005-1** (el `<title>` heredado) y **F-SPEC-005-3** (el commit
   que arrastró trabajo ajeno).

**Lo que NO se ha hecho a propósito, y no es un olvido:** no se ha transicionado
el estado de la spec con `estado.mjs` —el encargo lo prohibía explícitamente—,
así que sigue en `aprobada` y no en `en-progreso`/`en-revision`. No se ha hecho
push ni PR. No se ha invocado ningún rol consultivo. No se ha tocado
`src/model/`, `src/db/` ni `migrations/`, y de `src/mirror/` solo `user-agent.ts`.
