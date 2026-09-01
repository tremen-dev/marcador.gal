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
| CA-1 | `src/mirror/user-agent.ts` (`USER_AGENT`, `USER_AGENT_CONTACT`, comentario de cabecera reescrito) | `tests/mirror/user-agent.test.ts` casos 1-7: igualdad literal con la cadena aprobada; composición desde `USER_AGENT_PRODUCT`/`_VERSION`; token congelado; ASCII y `medicion` sin tilde; casa con `USER_AGENT_PATTERN` sin tocarlo; la cabecera cita la fecha, F-SPEC-002-1 y dónde vive ahora RN-11; y no lleva ninguna dirección de correo | Leído `src/mirror/user-agent.ts` entero y ejecutados los casos 1-7. **Mutación** en copia aislada del repo (`scratchpad/shadow`; árbol real intacto, `git status` vacío antes y después): cambiar el propósito a `medicion de latencia e cobertura` pone en rojo los casos 1 y 2 — el literal muerde de verdad. Cabecera leída: cita `2026-08-31`, `F-SPEC-002-1`, dice que la razón está agotada («the reason is spent: do not restore the mailbox») y dónde vive ahora la otra mitad de RN-11. `USER_AGENT_PATTERN` intacto: el `git diff main` del fichero no lo toca | ✅ |
| CA-2 | `src/site/crawler-page.tsx` (`import { USER_AGENT }`, `<code>{USER_AGENT}</code>`) | `tests/site/crawler-page.test.ts` casos 1-3: el HTML de las dos rutas contiene la cadena exacta; el escaneo de `src/` entero exige que NADIE contenga la cadena montada y que `medicion de latencia` solo aparezca en `mirror/user-agent.ts`; y el caso 3 la compara además contra un literal para que no pase comparándose consigo misma | **Dos mutaciones.** (1) Transcribir la cadena a mano en `src/i18n/gl.ts` → rojo el caso 2, el escaneo de `src/`. (2) Cambiar `USER_AGENT` → rojo el caso 3; el caso 1, que compara contra la constante, sigue **verde**, así que el caso 3 (literal) es el que sostiene el CA y está bien que exista. Sobre el HTML realmente servido por `next build && next start` (`127.0.0.1:3311`): la cadena exacta aparece una vez en cada ruta | ✅ |
| CA-3 | `src/mirror/user-agent.ts`, `src/i18n/gl.ts`, `src/i18n/es.ts` (namespace `crawler`) | `tests/mirror/user-agent.test.ts` caso 8 (la cadena) y `tests/site/crawler-page.test.ts` caso 4 (el HTML de las dos rutas): ni `SPEC-`, ni `RN-`, ni `EPIC-`, ni `ADR-` | Sobre el HTML **servido**, `grep -oiE 'SPEC-|RN-|EPIC-|ADR-'` → cero coincidencias en `/robot` y `/es/robot`, incluidos los payloads `/_next/`. Igual sobre `USER_AGENT` | ✅ |
| CA-4 | `src/mirror/user-agent.ts` (`USER_AGENT_CONTACT = 'https://marcador.gal/robot'`) | `tests/mirror/user-agent.test.ts` casos 9-11: **literal** `https://marcador.gal/robot`, igualdad con `${SITE_ORIGIN}${CRAWLER_PATH.gl}` y literales para `SITE_ORIGIN` y `CRAWLER_PATH.gl`, y ya no es un `mailto:`. **La mitad de producción —que la URL responda `200` en el sitio desplegado— es del verificador** | Mitad de código verde: `USER_AGENT_CONTACT` es el literal `https://marcador.gal/robot` y además `=== ${SITE_ORIGIN}${CRAWLER_PATH.gl}`. **Mutación** devolviendo el `mailto:`: 10 casos en rojo en 5 ficheros, incluido `contact.test.ts` caso 2. **La mitad de producción NO se puede comprobar hoy**: `dig marcador.gal A` → `82.98.135.43` (aparcamiento de Dinahosting) y `curl -L https://marcador.gal/robot` → `000`, sin respuesta. La spec dice que esa comprobación «no es opcional», así que el CA queda **parcial**, no cerrado | ⚠️ |
| CA-5 | `src/site/crawler-page.tsx` (primer bloque: `intro` + `contact` con `withMailbox`), `src/site/mailbox-link.tsx`, buzón desde `src/site/contact.ts` | `tests/site/crawler-page.test.ts` casos 5-7: `href="mailto:${MAILBOX}"` presente; su posición en el documento es **anterior al segundo encabezado**; y la frase que dice que ahí se pide que paremos y que se para se sirve entera | HTML servido: `href="mailto:ola@tremen.dev"` presente; offset del `mailto:` **1178 < 1321** (2.º encabezado) en gl y **1189 < 1332** en es — medido por mí sobre mi propio servidor, coincide con lo archivado. **Mutación**: mover el bloque `contact` al final de la página → rojo el caso 6. La frase entera se sirve (caso 7) | ✅ |
| CA-6 | `src/i18n/crawler-bundle.ts` (contrato), `src/i18n/gl.ts` y `src/i18n/es.ts` (namespace `crawler`, una clave por afirmación), `src/i18n/crawler.ts`, `src/site/crawler-page.tsx` | `tests/site/crawler-page.test.ts` casos 8-17: las seis claves existen y no están vacías en las dos lenguas; las seis se sirven enteras; el tope en número; robots.txt sin excepción y «hai fontes que hoxe non lemos»; no republicación e informe interno; crudo antes de interpretar + 30/90 días + una prórroga; cómo pedir que pare; y **nada más** (lista negra de producto, D-1, sin script, sin fecha, sin URL absoluta ajena) | Las seis claves existen, no están vacías y se sirven enteras en las dos lenguas. **Las afirmaciones se han comprobado contra el código EN EJECUCIÓN, no leyéndolo** (probes propias, `scratchpad/*.probe.ts`): (a) `MIN_REQUEST_INTERVAL_MS === 60_000` y el tope es por par (fuente, competición) — dos competiciones del mismo sitio dan dos peticiones, y a los 59 s ninguna; (b) **las no gastadas no se acumulan**: tres minutos parado producen UNA petición, no tres; (c) el user-agent que sale por el cable es exactamente el publicado. Sobre el HTML servido: sin `<form>`, `<input>`, `<img>`, sin `<script src>` externo, sin `Set-Cookie`, sin año, y la única URL absoluta es la nuestra dentro del user-agent (SPEC-004 CA-6, CA-7, CA-9, CA-10 importados). **Salvedad del 360 px: comprobado leyendo `globals.css` (`main { overflow-wrap: anywhere }` + `max-width: 34rem`), NO con navegador** — ver F-SPEC-005-V3 | ✅ |
| CA-7 | `src/app/(gl)/robot/page.tsx`, `src/app/(es)/es/robot/page.tsx` | `tests/site/crawler-routes.test.ts` casos 1-5: `/robot` y `/es/robot` fijados con **literales**; existe el directorio de ruta de cada una; ninguna redirección las tiene por origen; el único comodín es el de `www` y sale del ápice; y la dirección del user-agent es la del ápice. **El `200` sin `3xx` sobre el despliegue es del verificador** (medido en local: ver Evidencia) | Local, sobre el build de producción: `curl -o /dev/null -L` da `num_redirects=0 code=200` para `/robot` y para `/es/robot`; control negativo, `/` da `308`. Casos 1-5 verdes. **La mitad de producción sigue pendiente**, misma causa que CA-4: el DNS no apunta | ⚠️ |
| CA-8 | `docs/negocio/carta-rfgf-acceso.md` (párrafo «O que fago e o que non» y notas finales) | `tests/docs/carta-y-rastro.test.ts` casos 1-3: la carta contiene `USER_AGENT` exacta y en una sola línea; no contiene ninguna de las dos formas viejas; y sigue pidiendo `User-agent: marcador.gal` / `Allow: /`, que es lo que empareja | Casos 1-3 verdes; leída la carta. Cita la cadena exacta en una sola línea, no queda rastro de ninguna de las dos formas viejas y sigue pidiendo `User-agent: marcador.gal` / `Allow: /`. **Mutación** de la constante → rojo el caso 1: el acoplamiento carta↔código es real | ✅ |
| CA-9 | Sin código nuevo: se **usa** `src/mirror/capture/robots.ts`, que no se toca | `tests/mirror/user-agent.test.ts` casos 12-14, con fixture **sintético** escrito en el propio test (ADR-009 §3): con el grupo que pide la carta las dos rutas quedan permitidas; sin él, el comodín deja fuera a las dos; y la misma línea empareja con la cadena vieja y con la nueva, que es lo que hace barato el cambio | Casos 12-14 verdes. Fixture sintético escrito dentro del propio test: no entra ningún `robots.txt` ajeno en el repositorio (ADR-009 §3). Leído `parseRobots`: empareja por `userAgent.split('/')[0]`, que es por lo que la misma línea vale con la cadena vieja y con la nueva | ✅ |
| CA-10 | `src/mirror/user-agent.ts`, y nada más dentro de `src/mirror/` | `tests/mirror/user-agent.test.ts` caso 15: `git diff --name-only main -- src/mirror/` y ningún fichero distinto de `src/mirror/user-agent.ts`. Suite completa, `typecheck` y `lint` en Evidencia | `git diff --stat main -- src/mirror/` → **`src/mirror/user-agent.ts | 26 +++++++-------`, un solo fichero, 19 inserciones y 7 borrados**, y `--name-only` no devuelve ningún otro. Gates ejecutados enteros por mí el 2026-09-01: `npm run lint` (`oxlint --type-aware`) **exit 0, sin salida**; `npm run typecheck` (`tsc --noEmit`) **sin errores**; `npx vitest run --typecheck` → **66 ficheros, 591 tests, todos verdes, `Type Errors  no errors`** | ✅ |
| CA-11 | `docs/epicas/EPIC-001-spike-ingesta/SPEC-002-…​.ledger.md`, sección «Referencia cruzada — 2026-08-31» | `tests/docs/carta-y-rastro.test.ts` casos 4-5: el ledger de SPEC-002 nombra a SPEC-005 y lleva la cadena nueva; y la nota dice que la razón registrada al cerrar F-SPEC-002-1 caducó, con fecha y con el `mailto:` nombrado | Casos 4-5 verdes; leída la sección «Referencia cruzada — 2026-08-31» del ledger de SPEC-002: nombra a SPEC-005, lleva la cadena nueva, y dice con fecha que la razón de F-SPEC-002-1 caducó, nombrando el `mailto:` | ✅ |
| CA-12 | Texto escrito y **pendiente de los dos dictámenes**. `sdd-implementador` no los puede pedir | Sin test: es un CA de proceso. Los literales íntegros, en las dos lenguas, están transcritos abajo en «Salvedades» para llevarlos a `/sdd-lingua` y a `/sdd-legal-datos` | **Los dos dictámenes registrados abajo, y las tres cosas que el CA exige, resueltas una a una.** `/sdd-lingua`: **OBS-1 APLICADA** — `docs/fundacion/dominio.md:107` trae la fila, con la forma galega `xanela de observación` y el fin de la ventana anclado en el `fetched_at` de la última captura; comprobada por mí contra ADR-009 §2 y contra `retention.ts:50-51`, y las tres coinciden. **OBS-2 JUSTIFICADA** como decisión deliberada de registro. `/sdd-legal-datos`: emitido, concluyente y sin pedir cambio de texto; su DUDOSO **cerrado con constancia escrita** y con los dos riesgos separados en F-SPEC-005-V2, el segundo con destino de ADR | ✅ |
| CA-13 | `src/i18n/gl.ts`, `src/i18n/es.ts` (namespace `crawler`): la regla general, sin citar a nadie | `tests/site/crawler-page.test.ts` casos 18-19: ni `futgal`, ni `ceroacero`, ni `besoccer`, ni `resultados-futbol`, ni `rfgf` en el HTML de las dos rutas, sin acentos y en minúsculas; y el caso 19 comprueba que la prohibición **no** alcanza a `/proxecto`, que sigue nombrando las competiciones (SPEC-004 CA-8.2) | HTML servido: cero coincidencias de `futgal|ceroacero|besoccer|resultados-futbol|rfgf` en las dos rutas, sin acentos y en minúsculas. **Mutación**: añadir «como futgal.es» al literal `robots` de `gl.ts` → rojo el caso 18. Y comprobado que la prohibición **no** ha derramado sobre `/proxecto`, que sigue sirviendo «Preferente Futgal G1» y «Terceira RFEF G1»: no hay autocensura | ✅ |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

## **GREEN (segunda vuelta)** — 2026-09-01, `sdd-verificador`

> **Primera vuelta: RED**, 2026-09-01, por CA-12: el dictamen de `/sdd-lingua`
> traía OBS-1 como acción requerida y no estaba ni aplicada ni justificada.
> **Se aplicó** — una fila en `docs/fundacion/dominio.md`, ni una palabra
> publicada tocada — y **CA-12 cierra**. Se deja escrito el rechazo porque el
> gate mordió donde tenía que morder.

**Once CA en ✅ y dos en ⚠️. Las dos salvedades son ajenas al código de esta
spec: CA-4 y CA-7 esperan a que el DNS apunte, que es acción humana de
SPEC-004.** Varios de los ✅ se sostienen bajo mutación, no bajo lectura.

Lo que la página afirma es cierto: lo he comprobado ejecutando el código, no
leyéndolo. El tope de una por minuto y par, la no acumulación, el user-agent que
sale por el cable y —la afirmación más fuerte de todas, porque es la que un
tercero puede contrastar con sus propios registros— **que a un origen sin
política cargada no se le pide nada**. Esa última la rompí a propósito: con un
registro que no contiene el origen del objetivo, y con un registro vacío, el
capturador hace **cero** peticiones y anota el tick como `skipped`; con la misma
configuración pero política del mismo origen, pide. «Silence is not consent» no
es un comentario, es comportamiento.

**Por qué RED, en una línea:** el dictamen de `/sdd-lingua` trae una acción
requerida (OBS-1) que no está ni aplicada ni justificada, y CA-12 exige
literalmente «correcciones aplicadas o justificadas una a una».

### Gates, ejecutados enteros por mí

```
$ npm run lint            → oxlint --type-aware · exit 0, sin salida
$ npm run typecheck       → tsc --noEmit · sin errores
$ npx vitest run --typecheck
                          → Test Files  66 passed (66)
                                 Tests  591 passed (591)
                            Type Errors  no errors
$ git diff --stat main -- src/mirror/
                          → src/mirror/user-agent.ts | 26 +++++++-------
                            1 file changed, 19 insertions(+), 7 deletions(-)
```

Coincide con la referencia de partida (66 ficheros, 591 tests) y con CA-10.

**Reejecutados enteros en la segunda vuelta, el 2026-09-01, después de la fila
del glosario, en vez de darlo por hecho:** `npm run lint` exit 0 sin salida,
`npm run typecheck` sin errores, `npx vitest run --typecheck` →
**66 ficheros / 591 tests / `Type Errors  no errors`**. Cifras idénticas: la
corrección de OBS-1 **no movió un solo test**, que es lo que cabía esperar de un
cambio de una línea en un glosario. `git status` en la segunda vuelta: dos
ficheros modificados, `docs/fundacion/dominio.md` (**1 inserción, 0 borrados**) y
este ledger. Ni código, ni tests, ni bundles, ni una palabra publicada.

### CA-12 — REGISTRO DE LOS DOS DICTÁMENES

#### (a) `/sdd-lingua` — 2026-08-31 · galego **CORRECTO**, con dos observaciones

> Correctas: `le`, `leamos`, `poida`, `abonda`, `anaco`, `doutro xeito`,
> `lémolo`, `respectámolo`, `a análise` en femenino, y los diacríticos `dá` y
> `só` bien puestos. `otherLanguage: 'Castellano'` sigue siendo la excepción
> consciente ya anotada en SPEC-004.
>
> **OBS-1 (acción requerida):** `xanela de observación` es término de dominio,
> aparece en texto público y **no está en `docs/fundacion/dominio.md`**, que solo
> tiene la forma castellana «ventana de observación». `CLAUDE.md` es tajante: «Si
> un término falta, se añade allí **antes** de usarse». Falta la fila del
> glosario.
>
> **OBS-2 (decisión, no error):** salto de registro. La carta trata de vostede
> («Escríbolles», «dígano») y `/robot` **tutea** («Se **prefires** que non leamos
> **o teu** sitio»). El lector previsto pasa de una a otra. No es incorrecto;
> tiene que ser deliberado.

**Resolución del verificador, una a una:**

- **OBS-1 → APLICADA. Cierra.** En la primera vuelta bloqueó, y con una
  corrección al dictamen que lo agravaba: `dominio.md` no tenía «solo la forma
  castellana», **no tenía ninguna de las dos**. Ahora `docs/fundacion/dominio.md:107`
  trae la fila, y **la he comprobado en vez de aceptarla**:
  1. **Define el término**: «Periodo acotado durante el que se ejecuta la captura
     de una sesión de medición».
  2. **Trae la forma galega** que es la que va a texto público —`xanela de
     observación`— y la marca como literal de i18n (D-2). Sin eso la fila no
     habría cerrado nada: lo que se publica es el galego.
  3. **Ancla el fin de la ventana**, que era mi objeción de fondo: «30 días desde
     el **fin de la ventana** (el `fetched_at` de la última captura)».
     **Comprobado a tres bandas y coinciden las tres**: ADR-009 §2 dice
     literalmente «El plazo corre desde el **fin de la ventana** (el `fetched_at`
     de la última captura)», y `src/mirror/analysis/referenceless/retention.ts:50-51`
     documenta `fin_de_ventana` como «idéntico a `window.end`: el mayor
     `fetched_at` archivado». Glosario, ADR y código dicen lo mismo. **El reloj
     de la promesa publicada ya tiene un punto de partida calculable y
     canónico**, que es exactamente lo que faltaba.
  4. **No se confunde con `jornada`**, que es el riesgo de ponerla en
     *Competición y calendario*: la propia fila lo dice —«no del calendario de
     competición»— y `jornada` dice «Round de una competición». Colocarla justo
     antes del término con el que podría confundirse es acierto editorial, no
     descuido. La sección no es la ideal —es un término de operación, no de
     competición—, y eso no da para retener nada.
- **OBS-2 → ACEPTADA como está, y queda anotada.** No es un CA: ningún criterio
  de SPEC-005 ni de SPEC-004 habla de registro ni de tratamiento. Y la asimetría
  tiene una razón que se sostiene sola: la carta tiene **un** destinatario
  institucional y `/robot` tiene **cualquier** operador que vea un nombre en su
  log. Tutear en la página es coherente con «abonda con pedilo». Lo que no puede
  pasar es que sea un descuido, así que queda escrito aquí como deliberado. Si
  Alberto Fojo prefiere lo contrario, es una línea en los dos bundles y ningún
  test se entera — o sea, barato ahora y barato después: **no justifica retener
  la spec**.

#### (b) `/sdd-legal-datos` — 2026-08-31 · verificado contra el código

> **Ciertas y comprobables:** el tope por par sitio-competición y la no
> acumulación (`capturer.ts`: `epochMs - last >= MIN_REQUEST_INTERVAL_MS`,
> sellado **antes** del `await` y **antes** de la comprobación de robots); y «si
> no tenemos cargada la política de un sitio, tampoco le pedimos nada»
> (`robots.ts`: «An origin with no policy loaded is DISALLOWED. Silence is not
> consent», `robotsRegistry` → `false` ante origen desconocido). «No
> republicamos» es cierto hoy.
>
> **DUDOSO — F-SPEC-005-6:** la página promete «Ese arquivo bórrase aos 30 días
> de rematar a xanela de observación» y **no existe código de purga**: no hay
> retención, caducidad ni borrado en `src/raw/`, `src/db/` ni `migrations/`;
> ADR-009 §98 lo admite. La promesa es real pero manual, sin CI que la vigile.
> Agravante: la ventana **aún no se ha corrido**, así que el plazo no ha
> empezado a contar y la obligación se activará en silencio. **Segundo riesgo:**
> ADR-009 fija la retención del archivo de **medición** y deja **sin fijar la de
> producción** (F-SPEC-001-1); la página habla en general, así que el día que
> haya producción con otro plazo, la página pasa a ser falsa sin que nadie la
> toque.
>
> **No se recomienda cambiar el texto:** declarar el plazo es correcto y cierto
> como compromiso. Riesgo global **bajo**, sin necesidad de revisión profesional.

**Resolución del verificador:**

- Las tres afirmaciones «ciertas y comprobables» **las he reverificado yo por mi
  cuenta**, ejecutando (ver F-SPEC-005-V0 más abajo). Coinciden.
- **La ausencia de purga la he confirmado de forma independiente**: no hay
  ninguna llamada de borrado en `src/raw/` ni en `src/db/`, y
  `src/mirror/analysis/referenceless/retention.ts` **no purga nada** — solo
  calcula y declara tres fechas dentro del informe, y ni siquiera consulta la
  hora. La promesa publicada no tiene ejecutor automático.
- **NO BLOQUEA CA-12, y queda CERRADO con esta constancia escrita.** El dictamen
  es concluyente en lo que el CA le pide —los puntos 3, 4 y 5— y su recomendación
  explícita es **no cambiar el texto**. Un «DUDOSO» que se resuelve en «el texto
  es correcto, el riesgo es de cumplimiento y es bajo» es un dictamen emitido, no
  un dictamen pendiente.
- **La constancia, dicha entera, porque exigí que no se quedara en el párrafo del
  dictamen. Son DOS riesgos distintos y solo uno estaba a la vista:**
  1. **La promesa de 30 días no tiene ejecutor automático.** Es un compromiso
     **manual**, y como la ventana no se ha corrido, el plazo no ha empezado a
     contar: **la obligación se activará en silencio** el día que se corra.
     Mitigado en parte por la fila nueva del glosario, que al menos deja el
     punto de partida definido y calculable. **Destino: EPIC-MEJORA, junto a
     F-SPEC-005-4 — sin CI nadie vigila esto.**
  2. **ADR-009 fija la retención de MEDICIÓN y deja la de PRODUCCIÓN sin fijar**
     (F-SPEC-001-1; el propio ADR-009 lo dice: «No fija el plazo de producción»).
     La página habla **en general**. El día que haya producción con otro plazo,
     **la página pasa a ser falsa sin que nadie la toque y sin que ningún test se
     entere**. Este es el que importa, porque no depende de que alguien olvide
     una tarea: se rompe solo. **Destino: ADR que fije la retención de
     producción, ANTES de que exista producción.** Queda como F-SPEC-005-V2.

### CA-4 y CA-7 en ⚠️: por qué eso es GREEN y no una espera

**El criterio, explícito, porque de él depende qué se le cuenta a Alberto.**

La spec dice de la comprobación en producción que «no es opcional», y es verdad:
por eso CA-4 y CA-7 quedan **⚠️ y no ✅**, y por eso no se dan por vistos. La
pregunta distinta es si eso retiene la spec entera, y la respuesta es **no**, por
tres razones que no son la simetría con SPEC-004.

1. **Es exactamente el mismo tipo de salvedad que este mismo gate ya aceptó.**
   SPEC-004 cerró `hecho` con **cuatro** ⚠️, y la primera de ellas —CA-1— es la
   misma causa raíz: el DNS sin apuntar. Retener SPEC-005 por lo que ya se dejó
   pasar en su dependencia no protege nada; solo mueve el pendiente de sitio.
2. **La asimetría que sí existe está fenceada por escrito, y no por mí.** El
   pendiente de SPEC-004 era pasivo (nadie puede leer la página). El de SPEC-005
   es potencialmente activo: la cadena que **enviamos** apunta a una URL que no
   resuelve. Pero eso solo ocurre si algo la envía, y **hoy nada la envía**:
   `USER_AGENT` sale al mundo por **un solo camino** —`Capturer` → `politeFetch`,
   por el CLI `mirror:capturar`—, la ventana no se ha corrido y EPIC-001 está
   bloqueada. Nuestro propio `robots.txt` **no** imprime la cadena
   (`src/site/robots-txt.ts`), así que tampoco se publica por ahí. Y la carta,
   el otro artefacto que la expondría, lleva su propio interlock escrito: «no
   mandes esta carta hasta que esa dirección responda `200`».
3. **La verificación pendiente es de infraestructura, no de programa.** No hay
   una línea de código que escribir ni un test que añadir: el día que el DNS
   apunte, `curl -sIL https://marcador.gal/robot` cierra las dos mitades sin
   tocar el repositorio.

**LA CONDICIÓN, Y ES DURA.** Este ⚠️ es aceptable **mientras no se corra ninguna
ventana de captura**. En el momento en que alguien ejecute `mirror:capturar` con
el DNS todavía sin apuntar, la URL muerta sale por el cable en cada petición a un
tercero y **el ⚠️ deja de ser una comprobación pendiente para convertirse en un
defecto vivo**: es el defecto exacto que F-SPEC-002-1 evitaba, reintroducido, y
justo ante quien más caro cuesta. Queda como **F-SPEC-005-V5**.

### Lo que comprobé rompiendo

Todas las mutaciones sobre una **copia aislada** del repositorio
(`scratchpad/shadow`, con `node_modules` enlazado). El árbol real quedó intacto:
`git status` vacío antes y después. Baseline de la copia idéntica a la del repo:
66 ficheros / 591 tests.

| Mutación | Resultado | Qué demuestra |
|---|---|---|
| `medicion de latencia` → `medicion de latencia e cobertura` | **5 rojos / 3 ficheros**: `user-agent.test.ts` 1 y 2, `crawler-page.test.ts` 3, `carta-y-rastro.test.ts` 1 y 4 | El literal está congelado de verdad (CA-1), y la carta y el ledger de SPEC-002 están acoplados a la constante (CA-8, CA-11) |
| `USER_AGENT_CONTACT` → `mailto:ola@tremen.dev` | **10 rojos / 5 ficheros**, incluidos `contact.test.ts` 2 y `crawler-routes.test.ts` 5 | CA-4 muerde, y **la barrera del buzón de SPEC-004 CA-13 sigue mordiendo**: la excepción se borró y el escaneo quedó como igualdad exacta |
| Transcribir la cadena a mano en `gl.ts` | **1 rojo**: `crawler-page.test.ts` 2 | «Se importa, no se transcribe» es una aserción, no una costumbre (CA-2) |
| Mover el bloque `contact` al final de la página | **1 rojo**: `crawler-page.test.ts` 6 | La única compensación del riesgo de ADR-011 tiene red (CA-5) |
| Añadir «como futgal.es» al literal `robots` de `gl.ts` | **1 rojo**: `crawler-page.test.ts` 18 | CA-13 no es decorativo |

Y **tres pruebas propias contra el código en ejecución** (no mutación: probes
escritas por mí, fuera del repositorio):

| Probe | Resultado |
|---|---|
| Objetivo cuyo origen **no está** en el `robotsRegistry` | **0 peticiones**, tick `skipped`. Con registro **vacío**, 0 peticiones. Con política del **mismo** origen, 1 petición. **Denegar por defecto es cierto** |
| Cabecera que sale por el cable | `marcador.gal/0.0.1 (+https://marcador.gal/robot; medicion de latencia)` — **lo enviado es exactamente lo publicado** |
| Ritmo | `MIN_REQUEST_INTERVAL_MS === 60_000`; a los 59 s no se pide y a los 60 s sí; dos competiciones del mismo sitio son dos peticiones; **tres minutos parado producen UNA petición, no tres** |

### Regresión sobre SPEC-004: comprobada y descartada

`withMailbox` se extrajo de `project-page.tsx` a `src/site/mailbox-link.tsx`,
que es código de una spec `hecho`. Rendericé `/proxecto` y `/es/proxecto` en el
árbol de SPEC-004 (`git archive e629d06`, sin `checkout`) y en esta rama, y
**diff los cuatro HTML: idénticos byte a byte en las dos lenguas**. La
afirmación del implementador es cierta. Y de propina, `/proxecto` ya sirve
`<a href="/robot">`: la mitad pendiente de SPEC-004 CA-8.5 queda cubierta.

### Evidencia archivada: verificada

`_qa/SPEC-005/servido-{gl,es}-robot.html` **coinciden con lo que yo he servido**
salvo el `buildId` de Next (`"b":"hfs5HE…"` vs `"fmBf47…"`), que cambia en cada
build y no es contenido. Mismo tamaño exacto, 12 691 y 13 301 bytes. La
evidencia del commit `3a77b45` es fiel.

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-005/. Informe HTML opcional: _qa/SPEC-005/informe.html -->

> **NO HAY CAPTURAS, Y ESO ES UN HUECO DECLARADO, NO UNA OMISIÓN.** En este
> entorno **no hay Playwright**: el único MCP de navegador disponible es
> `claude-in-chrome`, que conduce el Chrome real del humano y exige que una
> persona elija el navegador antes de actuar — algo que un subagente sin canal
> con el humano no puede hacer. Consecuencia concreta: **el «sin scroll
> horizontal a 360 px» de SPEC-004 CA-9, que SPEC-005 CA-6 importa, no se ha
> visto en un navegador.** Se ha comprobado leyendo la única hoja de estilo del
> sitio, donde `main { max-width: 34rem; overflow-wrap: anywhere }` hace que la
> cadena del user-agent —el único token largo e irrompible de la página— parta
> en vez de empujar. Es un argumento sólido, no una observación. Queda como
> F-SPEC-005-V3.


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

### Hallazgos del verificador

- **F-SPEC-005-V0 — las afirmaciones de la página, reverificadas ejecutando.**
  No es un defecto: es la constancia de que las cinco afirmaciones comprobables
  no se han dado por buenas leyendo el código. Denegar por defecto, el tope por
  par, la no acumulación y la identidad cabecera↔página están medidas contra el
  programa corriendo, con probes propias fuera del repositorio. **Destino:
  ninguno, es evidencia.**

- **F-SPEC-005-V1 — CERRADO el 2026-09-01.** `xanela de observación` /
  `ventana de observación` ya está en el glosario canónico
  (`docs/fundacion/dominio.md:107`), con la forma galega marcada como literal de
  i18n y el fin de la ventana anclado en el `fetched_at` de la última captura.
  Verificado a tres bandas contra ADR-009 §2 y `retention.ts:50-51`: coinciden.
  **Coste real del arreglo: una línea, cero palabras publicadas tocadas, cero
  tests movidos** (66/591 antes y después) — que es lo que un gate bien puesto
  debe costar. **Destino: ninguno, cerrado.**

- **F-SPEC-005-V2 — ABIERTO. La retención publicada: dos riesgos, no uno.**
  Recoge el DUDOSO de `/sdd-legal-datos` —cerrado en CA-12 con la constancia de
  arriba— y lo deja con destino. Confirmado de forma independiente: **no hay
  purga** en `src/raw/`, `src/db/` ni `migrations/`, y `retention.ts` solo
  **declara** tres fechas dentro del informe, sin consultar siquiera la hora.
  1. **El plazo de 30 días es un compromiso manual y se activará en silencio**,
     porque la ventana aún no se ha corrido. **Destino: EPIC-MEJORA**, con
     F-SPEC-005-4 (sin CI, nada de esto lo vigila nadie).
  2. **La retención de PRODUCCIÓN no está fijada por ningún ADR** (ADR-009: «No
     fija el plazo de producción»; F-SPEC-001-1). La página habla en general, así
     que el día que haya producción con otro plazo **la página pasa a ser falsa
     sola**, sin que nadie la edite y sin que ningún test se entere. **Destino:
     ADR que fije la retención de producción, antes de que exista producción.**
  El texto de la página **no se cambia**: declarar el plazo es correcto y cierto
  como compromiso, y así lo dictaminó `/sdd-legal-datos`.

- **F-SPEC-005-V3 — el 360 px no se ha visto en un navegador.** Ver la nota de
  *Evidencia visual*. No hay Playwright en este entorno. **Destino: comprobación
  humana de un minuto, o el primer verificador que tenga navegador.** No
  bloquea: el argumento del CSS es concluyente para esta página.

- **F-SPEC-005-V4 — `<title>` se emite dentro de `<body>`.** `SiteDocument`
  pone `<title>` bajo `<body>` y no bajo `<head>`. React lo iza y el navegador
  lo tolera, así que no rompe nada observable, pero es código de SPEC-004 y
  conviene que no sorprenda a quien mire el HTML servido. **Destino: junto a
  F-SPEC-005-1, que toca el mismo sitio.** No bloquea.

- **F-SPEC-005-V5 — el orden obligatorio de la spec está invertido, y la
  ventana es el disparador.** La nota 4 del gate dice que SPEC-005 no debía
  implementarse antes de que `https://marcador.gal/robot` resolviera. Se ha
  implementado antes, porque su dependencia —SPEC-004 CA-1— cerró en ⚠️ por la
  misma causa. **Hoy es inocuo**: nada emite la cadena (ver el veredicto). **Deja
  de serlo en cuanto se corra una ventana de captura con el DNS sin apuntar.**
  **Destino: acción humana, y es PREVIA tanto a mandar la carta como a correr
  cualquier ventana.** No es trabajo de implementación.

### Sobre los hallazgos que abrió el implementador

Los he juzgado, no dados por buenos:

- **F-SPEC-005-1 (el `<title>` heredado) — RATIFICADO, y NO es RED.** Recorrí
  los trece CA de SPEC-005 y los cuatro de SPEC-004 que CA-6 importa (SPEC-004
  CA-6, CA-7, CA-9, CA-10): **ninguno menciona el título del documento**, ni
  directamente ni por consecuencia. CA-3 prohíbe identificadores internos y el
  título no lleva ninguno; SPEC-004 CA-5 exige que el texto visible venga de un
  bundle, y viene — del bundle equivocado, que es otra cosa. La decisión de no
  tocarlo es correcta: arreglarlo es mover `<title>` fuera del root layout, o
  sea código de una spec cerrada, exactamente la frontera que CA-10 protege.
  **Pero es visible para el único lector que esta página tiene**, y «O proxecto»
  encabezando la página del rastreador es lo primero que ve el técnico de la
  RFGF. **Destino confirmado: decisión de arquitectura, y merece ADR o spec
  corta antes de mandar la carta, no después.**
- **F-SPEC-005-2 (`PROJECT_PATH` sin aserción literal) — CONFIRMADO.**
  Comprobado: las cinco referencias a `PROJECT_PATH` en `tests/` comparan el
  valor consigo mismo. `CRAWLER_PATH` sí está fijado con literales (`/robot`,
  `/es/robot`) y además con `existsSync` del directorio de ruta, así que la
  mitad que esta spec sí tenía que cubrir está cubierta. Ningún CA de SPEC-005
  alcanza a `PROJECT_PATH`. **No ampliar alcance fue lo correcto. Destino:
  EPIC-MEJORA.**
- **F-SPEC-005-3 (el `git add -A` de `c203ba1`) — CONFIRMADO, y no cuenta como
  fallo de CA.** El commit mezcla los dos ADR, las dos specs, la épica, `_qa/` y
  cambios de `CLAUDE.md`, `docs/fundacion/`, `docs/roadmap.md` y
  `docs/tablero.md` con el código de la página. Verificado que no falta nada.
  Es higiene de git y decisión humana antes del PR. **El detalle que importó
  para F-SPEC-005-V1**: ese mismo commit **editó `docs/fundacion/dominio.md`** y
  aun así el término no entró — la fila llegó en la segunda vuelta, después del
  RED. Es la mejor prueba de que el gate hacía falta.
- **F-SPEC-005-4 (sin CI) y F-SPEC-005-5 (la carta no se puede mandar) —
  RATIFICADOS.** F-SPEC-005-5 lo he medido: `dig marcador.gal A` →
  `82.98.135.43`, el aparcamiento de Dinahosting, y `https://marcador.gal/robot`
  no responde. Es la razón de que CA-4 y CA-7 queden ⚠️ y no ✅.
- **La extracción de `withMailbox` — VERIFICADA SIN REGRESIÓN.** HTML de
  `/proxecto` y `/es/proxecto` idéntico byte a byte antes y después. Ver el
  veredicto.

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
