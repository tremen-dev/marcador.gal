---
id: SPEC-004
tipo: ledger
epica: EPIC-003
---
# Ledger — SPEC-004 Sitio público de proyecto en marcador.gal: i18n, contenido y despliegue

## Resumen
- Fase: **corregida tras el RED, esperando re-verificación** (2026-08-31,
  segunda vuelta: F-SPEC-004-5 y F-SPEC-004-6 arreglados, commits `0270eaf` y
  `2aaccb8`; F-SPEC-004-7 intacto a propósito). Escrita por `sdd-arquitecto`
  el 2026-08-31, aprobada por Alberto Fojo el 2026-08-31, implementada por
  `sdd-implementador` el 2026-08-31 en `ft/SPEC-004-sitio-publico-de-proyecto`.
  **Va primero**: SPEC-005 necesita que `https://marcador.gal/robot` resuelva
  antes de meter esa URL en el user-agent que se envía a terceros.
- **Dos cosas impiden hoy el cierre, y ninguna es código:** el DNS sin apuntar
  (CA-1) y el dictamen de `/sdd-lingua` sobre el texto íntegro de los dos
  bundles (CA-12). Ver «Cómo retomar».
- **CA-1 tiene una mitad no-código**: apuntar el DNS de `marcador.gal` en
  Dinahosting al despliegue de Vercel. Es acción humana y hoy el dominio
  resuelve a `82.98.135.43`, el aparcamiento del registrador.
- **CA-12 bloquea el cierre**: sin dictamen de `/sdd-lingua` sobre el texto
  íntegro de los dos bundles, la spec no pasa a `hecho`.
- Rama: `ft/SPEC-004-sitio-publico-de-proyecto` (la creó el humano acortada;
  el nombre largo que preveía el borrador no llegó a usarse)
- **CA-13 (buzon en un solo sitio) nace de una decision de Alberto Fojo del
  2026-08-31**: `ola@tremen.dev` es provisional; en produccion sera alguno
  `@marcador.gal`. Lo que NO se puede atar con un test es que el buzon viejo
  siga leyendose tras migrar: riesgo escrito, no verificable.

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 | `src/site/redirects.ts`, `next.config.ts`, `src/site/routes.ts` (`SITE_ORIGIN`) | `tests/site/redirects.test.ts` 1–5 | **Mitad de código: verde**, y no por leer el test. Contra `next build && next start` local: `/`→`308 location: /proxecto`, `/es`→`308 /es/proxecto`, `Host: www.marcador.gal` + `/`→`308 https://marcador.gal`, `+ /proxecto`→`308 https://marcador.gal/proxecto`; destinos `200`. Mutaciones M10/M10b/M10c (www deja de ir primera · `permanent:false` · `/proxecto` se mueve): las tres ponen rojo `redirects.test.ts`. **Mitad de infraestructura: SIN cumplir.** 2026-08-31: `dig +short marcador.gal` y `www.marcador.gal` → `82.98.135.43`; `curl http://marcador.gal/` devuelve `200` con la página de aparcamiento de Dinahosting (`css/parking.css`); `https://` no responde (sin TLS). No hay despliegue publicado. Acción humana pendiente, no fallo del implementador | ⚠️ |
| CA-2 | `src/app/(gl)/layout.tsx`, `src/app/(gl)/proxecto/page.tsx`, `src/site/document.tsx`, `src/i18n/gl.ts` | `tests/site/pages.test.ts` 1–3 | Verde sobre el HTML **realmente servido**, no solo sobre `renderToStaticMarkup`: `<html lang="gl">` confirmado en el DOM con Playwright. Prueba propia más dura que la suite: resté del `innerText` de `/proxecto` los trece valores del bundle `gl` y el **residuo es la cadena vacía** — no hay una sola palabra visible fuera del bundle. Mutación M12 (`lang="en"` fijo): rojo | ✅ |
| CA-3 | `src/app/(es)/layout.tsx`, `src/app/(es)/es/proxecto/page.tsx`, `src/i18n/es.ts`, `src/site/project-page.tsx` (`<nav>`) | `tests/site/pages.test.ts` 4–6 | `/es/proxecto` → `200`, `<html lang="es">`, texto del bundle `es`. **Comprobado con JavaScript desactivado en Playwright**: clic en el conmutador → `/es/proxecto` (`lang=es`), clic de vuelta → `/proxecto` (`lang=gl`). Es un `<a href>` real, no un manejador. Mutación M14 (`<button onClick>`): rojo | ✅ |
| CA-4 | `src/i18n/site-bundle.ts`, `src/i18n/site.ts`, `src/i18n/gl.ts`, `src/i18n/es.ts` | `tests/site/bundles.test-d.ts` (a), `tests/site/i18n.test.ts` 1–4 (b) | (a) y (b) muerden: M1 (quitar `otherLanguage` de `es.site`) y M2 (añadir `tagline` solo a `es`) ponen rojo los casos 1 y 2. `tsc --noEmit --listFiles` confirma que los 24 ficheros nuevos de `src/site`, `src/i18n`, `src/app` y `tests/site` están **dentro** del programa de tsc | ✅ |
| CA-5 | — (es una barrera, no código de producción) | `tests/site/no-hardcoded-literals.test.ts` 1–2 (el filtro `.ts`/`.tsx` vive ahora aquí, que es donde es cierto) | La barrera muerde en **todos** los ficheros del sitio, no solo donde es cómodo: texto JSX en `project-page.tsx` (M3), en un **layout** (D4), en una **page** de ruta (D4b); literal como hijo `{'Ola'}` (M3c); atributo visible `aria-label` (M3b) y `title` en `document.tsx` (D4c). Seis mutaciones, seis rojos | ✅ |
| CA-6 | `src/i18n/gl.ts`, `src/i18n/es.ts`, `src/site/project-page.tsx` | `tests/site/pages.test.ts` 7–9 | Verificado **sobre el HTML servido por `next start`**, no sobre el proxy de la suite: sin `<form`, `<input`, `<img`; cero términos de la lista negra; cero años `19xx/20xx`; cero URL absolutas. Mutaciones M4 (bundle), D5 (solo en un `h2`), M4b (`<img>`), M4d (`<form><input>`), M4c (fecha 2027): cinco rojos. Salvedad de alcance en el veredicto (F-SPEC-004-7: la suite mira `renderToStaticMarkup`, no la salida real de Next) | ✅ |
| CA-7 | `src/i18n/gl.ts`, `src/i18n/es.ts` | `tests/site/i18n.test.ts` 5–6 | Lista negra: muerde con `relevo` (M5) y con `marcadorgalego` (M5b), y desacentúa antes de mirar. **Y la mitad que es lectura, hecha**: «marcador.gal é un proxecto de tremen.dev, levado por Alberto Fojo. Non hai empresa nin equipo detrás: unha soa persoa traballando por conta propia. O enderezo de contacto é ola@tremen.dev.» Nombra a tremen.dev y a Alberto Fojo, **no se apoya en ningún proyecto anterior, no hay historia y no hay insinuación de sucesión**. D-1 respetada | ✅ |
| CA-8 | `src/site/project-page.tsx`, `src/i18n/*`, `src/site/routes.ts` | `tests/site/pages.test.ts` 10–14; `tests/site/i18n.test.ts` 7–8 (longitud de 8.1), 9–10 (8.2 no afirma medición en curso, y dice por qué una fuente no se lee) | 8.1 presente, 3 oraciones en las dos lenguas, buzón interpolado desde la constante (M6-bis 5 oraciones → rojo; M6-ter 2 oraciones → rojo). 8.2 nombra las cuatro cifras y **sí** las dos competiciones canónicas, sin autocensura. 8.3 y 8.4 presentes, sin fecha ni condicional. **8.5: el enlace existe pero `/robot` devuelve `404`** (comprobado con `curl` y Playwright) — dependencia conocida de SPEC-005 (F-SPEC-004-2). **Y hay un hallazgo mío: F-SPEC-004-5**, el texto de 8.2 afirma en presente una medición que hoy no ocurre | ⚠️ |
| CA-9 | `src/app/globals.css`, `src/site/document.tsx` | `tests/site/pages.test.ts` 15, 17 | **Playwright, herramienta propia, no la suite.** Viewports 360, 320 y 1280 px × 2 lenguas × JS activado y desactivado (12 combinaciones): `scrollWidth === clientWidth` en todas, **cero elementos desbordando** el ancho de ventana, cero peticiones a origen externo, `<meta name="viewport" content="width=device-width, initial-scale=1">` presente. Con **JS desactivado el texto es idéntico y el conmutador navega**. Mutaciones M11 (`@font-face` remota) y M11b (`<script src=https://…>`): rojo | ✅ |
| CA-10 | `src/site/document.tsx`, `src/app/robots.txt/route.ts` (`force-static`) | `tests/site/pages.test.ts` 16, 18 | `curl -sD -` sobre `/`, `/es`, `/proxecto`, `/es/proxecto` y `/robots.txt`: **ninguna respuesta lleva `Set-Cookie`**. Playwright tras navegar las dos páginas y las dos redirecciones: **0 cookies en el contexto, `document.cookie` vacío, 0 claves en `localStorage`/`sessionStorage`, 0 peticiones fuera del origen**. El único identificador del HTML es el `buildId` de Next, constante por build y no por visitante. Mutación M15 (`next/headers`): rojo. Pendiente de re-comprobar sobre el despliegue: las cabeceras que añade Vercel no se observan en local | ⚠️ |
| CA-11 | `src/site/robots-txt.ts`, `src/app/robots.txt/route.ts` | `tests/site/robots.test.ts` 1–6 | Servido de verdad: `200`, `content-type: text/plain; charset=utf-8`, cuerpo exacto `# marcador.gal — ola@tremen.dev\n\nUser-agent: *\nAllow: /\n`. Lo genera la ruta, no hay `public/robots.txt`. Sin ningún `Disallow`. `parseRobots` + `USER_AGENT` propios dan `isAllowed` verdadero para `/`, `/proxecto`, `/es/proxecto`, `/robot` y `/es/robot`. El buzón sale interpolado (M9b, escribirlo a mano → rojo por dos tests) y M9 (`Disallow: /proxecto`) → rojo. Pendiente comprobarlo en `https://marcador.gal/robots.txt` cuando haya despliegue | ⚠️ |
| CA-12 | — | — (no es código: dictamen humano/consultivo) | **No hay dictamen de `/sdd-lingua` en este ledger.** El CA es explícitamente bloqueante para el cierre: sin él la spec no pasa a `hecho`. Gestión humana en curso, no fallo del implementador | ❌ |
| CA-13 | `src/site/contact.ts` | `tests/site/contact.test.ts` 1–5 (5: el escaneo cubre `src/` entero, no solo TypeScript); `tests/site/source-scan.ts` (`readSourceFiles` sin filtro de extensión) | 13.1 y 13.2 ✅ (`MAILBOX = 'ola@tremen.dev'`, único `export const` del módulo; M8 → rojo). 13.4 ✅ y **muerde**: borrar «must still be read» de la cabecera pone rojo el caso 3 (M8b). 13.3 muerde donde importa —correo en otro `.ts` de `src/` (M7), escrito en un bundle (M6b), escrito a mano en `robots-txt.ts` (M9b)— y la excepción de `mirror/user-agent.ts` **se autoliquida**: simulé el cambio de SPEC-005 y el test se pone rojo (D1). **Pero el escaneo solo lee `.ts`/`.tsx`, y el CA dice «cualquier punto de `src/`»**: metí `soporte@marcador.gal` en `src/app/globals.css` y **no lo detecta** (D3). F-SPEC-004-6 | ⚠️ |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

### RED — 2026-08-31, `sdd-verificador`

Once de trece CA verdes con evidencia propia. **RED por un hallazgo de contenido
que daña exactamente la carta que esta épica existe para respaldar**
(F-SPEC-004-5), más una barrera que no cubre lo que su CA pide (F-SPEC-004-6).
Aparte, dos cosas que no son trabajo de código y que en cualquier caso impiden
cerrar: el DNS sin apuntar (CA-1) y el dictamen de `/sdd-lingua` (CA-12).

El código está bien hecho. La suite **no se ha dado por buena**: se replicó el
repositorio en una copia aislada y se plantaron **37 mutaciones**; 33 pusieron
rojo el test que les tocaba. Las cuatro que no muerden están documentadas abajo.

**Gates, ejecutados por el verificador el 2026-08-31 en local (no hay CI):**

- `npm run lint` → `oxlint --type-aware`: **exit 0, sin una sola incidencia**.
  Comprobado además que el gate **mira de verdad el código nuevo**: planté
  redeclaraciones simultáneas en `src/site/routes.ts`,
  `src/site/project-page.tsx`, `src/site/contact.ts`, `src/i18n/es.ts`,
  `src/app/robots.txt/route.ts`, `src/app/(gl)/proxecto/page.tsx` y
  `tests/site/pages.test.ts`, y oxlint reportó **los siete**.
- `npm run typecheck` → `tsc --noEmit`: **limpio, exit 0**.
- `npx vitest run --typecheck`:
  `Test Files 62 passed (62) · Tests 541 passed (541) · Type Errors no errors`.
  Sin `.skip`, `.only`, `.todo`, `.skipIf` ni `.runIf` en todo `tests/`.
- `npm run build`: compila y prerenderiza `/proxecto`, `/es/proxecto` y
  `/robots.txt` como estáticos.
- **Sin regresiones**: `git diff a9032cc~1..HEAD` no toca un solo fichero de
  `tests/` fuera de `tests/site/`, ni `src/model/`, `src/db/`, `src/mirror/` ni
  `migrations/`. Se borran `src/app/layout.tsx` y `src/app/page.tsx`, que eran
  el esqueleto de Next y no sostenían ningún CA de SPEC-001
  (`src/app/_contract/model-client.tsx`, que sí lo sostiene, sigue en su sitio y
  dentro del programa de tsc).

**Verificado con herramienta propia, no dando por buena la suite:** servidor real
(`next build && next start`) con `curl -sD -` sobre las seis rutas; Playwright
sobre 12 combinaciones de viewport/lengua/JS; `dig` y `curl` contra el dominio
real; y las 37 mutaciones en copia aislada.

### Hallazgos

- **F-SPEC-004-5 — BLOQUEANTE. La página afirma en presente una medición que hoy
  no ocurre, y contradice a la carta en el punto que la sostiene.** El bundle
  dice «Agora mesmo o proxecto **está a medir** catro cousas sobre as fontes
  públicas de resultados… **As competicións medidas son** Terceira RFEF G1 e
  Preferente Futgal G1» (y su gemela en castellano). Hoy eso no es cierto: la
  ventana de observación **no se ha corrido**, EPIC-001 no tiene ninguna de sus
  cuatro cifras, y la fuente de Preferente Futgal G1 —`futgal.es`— **no es
  capturable** porque su `robots.txt` nos lo prohíbe y RN-11 obliga a respetarlo
  (ADR-008 §1; `docs/roadmap.md`, «bloqueante nuevo, y el más caro»). La carta a
  la RFGF lo dice con todas las letras: «**Hoxe non o fago**, precisamente porque
  o seu `robots.txt` non mo permite». El técnico que reciba la carta y siga el
  enlace lee lo contrario, sobre **su propia competición**: en el mejor caso el
  sitio desmiente la carta, en el peor se lee como la admisión de que ya los
  estamos rastreando contra su `robots.txt`. Es el riesgo que la épica nombra
  —«una carta desmentida por su propio enlace»— materializado. **CA-8.2 fija el
  contenido (las cuatro cifras y las dos competiciones), no el tiempo verbal**:
  hay redacción veraz que lo cumple («o que se vai medir», «as competicións do
  estudo son»). Arreglo: reescribir `measuring` en `src/i18n/gl.ts` y
  `src/i18n/es.ts` de modo que no afirme una medición en curso, manteniendo las
  cuatro cifras y los dos nombres canónicos. **Tiene que caer antes del dictamen
  de CA-12**, para que `/sdd-lingua` revise el texto definitivo y no este.

- **F-SPEC-004-6 — CA-13.3 no cubre «cualquier punto de `src/`».**
  `tests/site/source-scan.ts:29` descarta todo lo que no acabe en `.ts`/`.tsx`,
  así que el escaneo **no mira `src/app/globals.css`**, que es un fichero de
  `src/` y que además se sirve al público. Demostrado: con
  `soporte@marcador.gal` en un comentario y en un `content:` de `globals.css`,
  `contact.test.ts` sigue verde. Es exactamente el escenario que CA-13 existe
  para impedir —una dirección que se queda atrás cuando el resto migra— y el
  arreglo es de dos líneas: que `readSourceFiles` acepte también `.css` (o que
  el escaneo de CA-13.3 recorra todos los ficheros de `src/`, sea cual sea su
  extensión, y deje el filtro de extensión solo para CA-5, que sí habla de JSX).

- **F-SPEC-004-7 — las barreras de CA-6, CA-9 y CA-10 miran un HTML que no es el
  que se sirve.** `tests/site/pages.test.ts` afirma sobre
  `renderToStaticMarkup(layout + page)`. Lo que Next sirve de verdad lleva
  además `<head>`, la carga útil RSC y el andamiaje del `not-found` en inglés.
  **Hoy no hay diferencia que importe** —lo comprobé sobre el HTML servido: cero
  términos de la lista negra, cero `<form`/`<input`/`<img`, cero años, cero URL
  absolutas, cero orígenes externos— pero un `metadata` con `openGraph`, un
  favicon remoto o un script en un layout futuro entrarían por ahí sin poner
  ningún test rojo. Destino: EPIC-MEJORA o SPEC-005, según convenga.

- **Cuatro mutaciones que NO muerden, dichas para que consten**, ninguna
  bloqueante: (1) el contador de oraciones de CA-8.1 no ve cinco cláusulas unidas
  por punto y coma —el texto real tiene tres oraciones y el modo de fallo con
  puntos sí se detecta—; (2) la excepción de CA-13.3 es por fichero, así que un
  **segundo** correo dentro de `src/mirror/user-agent.ts` pasaría —fichero de 30
  líneas que SPEC-005 va a tocar entera—; (3) añadir una clave al contrato
  `SiteBundle` **y** a los dos bundles no lo detecta ningún test, que es lo
  esperable: «el sitio no dice nada más» lo sostienen el render y la lectura del
  verificador; (4) una promesa de producto redactada fuera de la lista negra
  («moi pronto poderás seguir todos os partidos aquí») pasa la suite — CA-6 pide
  «al menos» esos términos, y lo demás es lectura. Lo he leído: hoy no hay nada
  parecido en los bundles.

### Sobre la contradicción de CA-13.3, dictaminada

**La solución implementada es aceptable y CA-13.3 no queda RED por ella.** La
spec se contradice sola: exige un test que falle si aparece un correo en `src/`
y a la vez prohíbe tocar `src/mirror/`, donde hoy vive uno
(`USER_AGENT_CONTACT = 'mailto:ola@tremen.dev'`). No se puede cumplir lo primero
sin incumplir lo segundo, y el implementador **no eligió el camino cómodo**: la
excepción está escrita como **igualdad exacta** de la lista de infractores, no
como subconjunto ni como `filter` que ignore `mirror/`. Lo verifiqué en lugar de
creérmelo: sustituí el `mailto:` por `https://marcador.gal/robot` —el cambio que
hará SPEC-005— y `contact.test.ts` **se pone rojo**, obligando a borrar la línea.
Es una excepción que se autoliquida, está anotada como F-SPEC-004-1 con destino
SPEC-005, y sigue mordiendo en todos los sitios donde el riesgo es real. Lo que
sí queda RED en CA-13 es otra cosa, F-SPEC-004-6: la extensión del escaneo.

### Qué falta por acción humana y qué por trabajo

- **Humano (no cuenta como fallo del implementador):** apuntar el DNS de
  `marcador.gal` a Vercel y publicar el despliegue (CA-1); el dictamen de
  `/sdd-lingua` sobre el texto íntegro de los dos bundles (CA-12); proteger las
  URL de preview antes de enlazar el sitio (F-SPEC-004-4).
- **Trabajo:** F-SPEC-004-5 y F-SPEC-004-6 (implementador, esta spec);
  F-SPEC-004-7 (donde decida arquitectura); `/robot`, que hoy es 404
  (F-SPEC-004-2, SPEC-005).
- **La spec NO se ha transicionado de estado**: el encargo de esta verificación
  prohíbe expresamente editar la spec, así que no se ejecutó
  `estado.mjs … en-progreso`. Queda para quien conduzca el pipeline.

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-004/. Informe HTML opcional: _qa/SPEC-004/informe.html -->

Capturas tomadas con Playwright (Chromium) contra `next start` en local, a
360 px de ancho y `deviceScaleFactor: 2`, página completa.

| CA | Captura | Qué prueba |
|---|---|---|
| CA-9, CA-2 | `_qa/SPEC-004/CA-9-gl-360-json.png` | `/proxecto` a 360 px con JS activado: sin scroll horizontal, todo el texto del bundle `gl` |
| CA-9, CA-2 | `_qa/SPEC-004/CA-9-gl-360-jsoff.png` | La misma con **JavaScript desactivado**: idéntica, legible entera |
| CA-9, CA-3 | `_qa/SPEC-004/CA-9-es-360-json.png` | `/es/proxecto` a 360 px con JS activado |
| CA-9, CA-3 | `_qa/SPEC-004/CA-9-es-360-jsoff.png` | La misma con **JavaScript desactivado** |

Medidas que acompañan a las capturas (12 combinaciones de viewport × lengua × JS,
360/320/1280 px): `scrollWidth === clientWidth` en todas, lista de elementos que
desbordan el ancho de ventana **vacía**, peticiones a origen externo **0**,
cookies **0**, `localStorage`+`sessionStorage` **0 claves**.

## Salvedades / follow-ups
<!-- IDs F-SPEC-004-1, F-SPEC-004-2… con destino (spec futura o EPIC-MEJORA). -->

- **F-SPEC-004-1 — CA-13.3 tiene hoy UNA excepción, y es de SPEC-005.** El test
  que lee `src/` entero pide que no aparezca ninguna dirección de correo fuera
  de `src/site/contact.ts`. Hoy `src/mirror/user-agent.ts:19` la lleva dentro de
  `USER_AGENT_CONTACT` (`mailto:ola@tremen.dev`). SPEC-004 tiene prohibido tocar
  `src/mirror/` —lo dice su propia sección de entidades afectadas— y SPEC-005 la
  sustituye por `https://marcador.gal/robot` (ADR-011 §4). La excepción está
  escrita en `tests/site/contact.test.ts` como **igualdad exacta**, no como
  subconjunto: el día que SPEC-005 quite el correo, el test se pone rojo y hay
  que borrar la línea. Es la única forma de que una excepción salga de un
  repositorio. **Destino: SPEC-005.**
- **F-SPEC-004-2 — CA-8.5 enlaza a `/robot`, que hoy es un 404.** La página del
  rastreador es SPEC-005. La spec ya lo contempla («mientras SPEC-005 no esté
  hecha, el enlace es lo único de este CA que puede quedar pendiente»). Riesgo
  real: el sitio no debe enlazarse desde la carta hasta que SPEC-005 esté hecha,
  o la carta la desmiente su propio enlace. **Destino: SPEC-005.**
- **F-SPEC-004-3 — sin CI, nada de esto lo comprueba nadie por ti.** El lint
  type-aware, la suite y `next build` corren solo en local. El sitio es un
  compromiso público (EPIC-003 §Riesgos) y hoy la única barrera es la
  disciplina. **Destino: EPIC-MEJORA.**
- **F-SPEC-004-4 — protección de previews antes de enlazar el sitio.** ADR-010
  §Consecuencias lo deja como follow-up: las URL de preview de Vercel son
  alcanzables por quien tenga el enlace y exponen borradores de una página que
  es un compromiso público. Es configuración de Vercel, no código. **Destino:
  acción humana antes de mandar la carta.**
- **Añadido `@types/react-dom` como devDependency.** Lo pide
  `renderToStaticMarkup` en los tests. No es decisión de stack: `react-dom` ya
  era dependencia desde ADR-001 y esto es su paquete de tipos.
- **`next build` reescribió `tsconfig.json` por su cuenta** (`jsx` de `preserve`
  a `react-jsx`, e `include` con `.next/dev/types`). Cambio obligatorio de
  Next 16, no una decisión de esta spec. `vitest.config.ts` fija el runtime de
  JSX explícitamente para no depender de ese campo.

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->

### Segunda vuelta — 2026-08-31, `sdd-implementador`, tras el RED

Se corrigieron **los dos findings de trabajo**, y solo esos. F-SPEC-004-7 se
deja **intacto a propósito**: el verificador lo dejó como no bloqueante y su
destino lo decide arquitectura.

- **F-SPEC-004-5 (bloqueante), commit `2aaccb8`.** `measuring` reescrita en las
  dos lenguas. Ya no afirma una medición en curso: dice que el proyecto **está
  preparado para medir**, que las competiciones **del estudio** son Terceira
  RFEF G1 y Preferente Futgal G1, que la medición **no ha empezado y no hay
  ninguna cifra**, y que **una de las dos no se puede leer hoy porque el
  `robots.txt` de su fuente no lo permite y respetarlo es una norma del
  proyecto**. Ese último tramo es nuevo y es el que hace que el sitio **refuerce
  la carta en vez de contradecirla**: la carta dice «hoxe non o fago,
  precisamente porque o seu `robots.txt` non mo permite». **No se nombra a
  ningún tercero** — la lista negra de terceros es de SPEC-005, pero el espíritu
  ya aplica aquí. Las cuatro cifras y los dos nombres canónicos de CA-8.2 siguen
  enteros y `pages.test.ts` 11 los sigue comprobando.
  - Cayeron con ella dos claves más que llevaban la **misma** afirmación en
    presente y que el finding no nombraba: `measuringHeading` («Que se está a
    medir» → «Que se vai medir»; «Qué se está midiendo» → «Qué se va a medir») y
    el final de `noProduct` («…e que se está a medir» → «…e que se vai medir»).
    Dejar el titular en presente sobre un párrafo en futuro habría sido la misma
    mentira con otra tipografía.
  - **Barrera nueva contra la recaída**: `tests/site/i18n.test.ts` casos 9 y 10.
    El 9 es una lista negra desacentuada (`esta a medir`, `esta midiendo`,
    `competicions medidas`…) con la misma forma que las de CA-6 y CA-7; el 10
    exige que `measuring` mencione `robots.txt`, que es la afirmación que
    sostiene la carta. Los dos **en rojo antes** del cambio.
- **F-SPEC-004-6, commit `0270eaf`.** Reproducido primero: con
  `soporte@marcador.gal` en un comentario y en un `content:` de
  `src/app/globals.css`, `contact.test.ts` seguía verde. `readSourceFiles`
  (`tests/site/source-scan.ts`) **ya no filtra por extensión**: recorre `src/`
  entero, que es lo que dice CA-13.3. El filtro `.ts`/`.tsx` se movió a
  `siteSources()` de `no-hardcoded-literals.test.ts`, que es CA-5 y sí habla de
  JSX. Caso 5 nuevo en `contact.test.ts`: compara el escaneo con un recorrido de
  `src/` **independiente del ayudante**, para no dar por buena la misma decisión
  que vigila. Con el correo plantado, el caso 2 ahora sale rojo; retirado, todo
  verde.
  - **La excepción de `mirror/user-agent.ts` no se ha tocado**: sigue siendo
    igualdad exacta y sigue autoliquidándose cuando llegue SPEC-005
    (F-SPEC-004-1).

**Gates de esta vuelta, en local (no hay CI):** `npm run lint` →
`oxlint --type-aware` **exit 0, sin una sola incidencia**; `npm run typecheck` →
`tsc --noEmit` **exit 0**; `npx vitest run --typecheck` →
**62 ficheros, 544 tests, `Type Errors no errors`** (541 antes, +3: `contact` 5 e
`i18n` 9 y 10). `npm run build` prerenderiza `/proxecto`, `/es/proxecto` y
`/robots.txt`. Comprobado además sobre el HTML **realmente servido** por
`next build && next start`: el texto nuevo aparece en las dos lenguas, y siguen
en cero los términos de la lista negra de CA-6, los años, las URL absolutas, los
`<form`/`<input`/`<img` y las cabeceras `Set-Cookie`.

**CA-12 sigue ❌ y ahora sobre texto nuevo.** El dictamen de `/sdd-lingua` está
pendiente y tiene que caer **sobre esta redacción**, no sobre la anterior. Las
claves que cambiaron y que lingua no ha visto todavía son `measuring`,
`measuringHeading` y `noProduct` en `gl` y en `es`. `sdd-implementador` **no da
por bueno** el galego: lo escribió para que fuese verdad, no para que fuese
correcto.

**La spec NO se transicionó de estado**: el encargo de esta vuelta lo prohíbe
expresamente. Queda para quien conduzca el pipeline.

### Primera vuelta

**Rama:** `ft/SPEC-004-sitio-publico-de-proyecto`. Siete commits, del `a9032cc`
al `c7b2cf5`. Sin push, sin PR.

**Estado de los gates, ejecutados en local el 2026-08-31:**
- `npm run lint` → `oxlint --type-aware`: **sin una sola incidencia**.
- `npx vitest run`: **62 ficheros, 541 tests, todos verdes** (incluye los 510 que
  ya había). `Type Errors no errors`.
- `npm run typecheck` → `tsc --noEmit`: limpio.
- `npm run build`: compila y prerenderiza `/proxecto`, `/es/proxecto` y
  `/robots.txt` como estáticos.
- Comprobado además contra `next start` con `curl`: `/` → 308 a `/proxecto`,
  `/es` → 308 a `/es/proxecto`, `Host: www.marcador.gal` → 308 a
  `https://marcador.gal/...`, las dos páginas 200, `robots.txt` 200 con
  `text/plain; charset=utf-8`, y **ninguna respuesta con `Set-Cookie`**.

**Lo que NO está hecho y por qué:**

1. **CA-1, mitad no-código: el DNS sigue sin apuntar.** Comprobado hoy:
   `marcador.gal` y `www.marcador.gal` resuelven a `82.98.135.43`, el
   aparcamiento de Dinahosting. Es acción de Alberto Fojo en el panel del
   registrador y **ningún test la observa**. Hasta que ocurra, CA-1 no puede
   cerrarse aunque el código esté completo, y el verificador solo puede
   comprobarlo contra la URL `*.vercel.app`. **Tampoco hay despliegue**: el
   proyecto Vercel `marcador-gal` está vinculado, pero esta rama no se ha
   subido ni promovido (el implementador no hace push).
2. **CA-12: falta el dictamen de `/sdd-lingua`, y es bloqueante para el
   cierre.** El texto íntegro de los dos bundles está escrito
   (`src/i18n/gl.ts` y `src/i18n/es.ts`, clave `site`) y **no está validado**.
   `sdd-implementador` no lo da por bueno: son doce claves por lengua y las va a
   leer una federación. Hay que pasarlas enteras, no una muestra, y aplicar o
   justificar cada corrección una a una.
3. **CA-8.5 enlaza a `/robot`, que aún no existe** (F-SPEC-004-2).
4. **CA-9 (360 px sin scroll horizontal) y CA-10 (cabeceras de la respuesta) no
   se pueden cerrar con la suite.** Los tests unitarios cubren lo que se ve en
   el HTML y en la hoja de estilo; el ancho y las cabeceras son del verificador,
   con Playwright y con `curl`, sobre el despliegue.

**Dónde está cada cosa:**
- `src/i18n/site-bundle.ts` — el contrato de claves, el tipo que los dos
  bundles satisfacen. Añadir una clave aquí y olvidar una lengua es un fallo de
  `npm run typecheck`.
- `src/i18n/site.ts` — `SITE_LOCALES`, `siteBundle(locale)`, `otherLocale`.
  Mecanismo escrito a mano: **añadir `next-intl` o equivalente exige un ADR**.
- `src/site/contact.ts` — el buzón. **Una sola línea**, con el contrato de
  migración en su cabecera (CA-13.4).
- `src/site/routes.ts` — `PROJECT_PATH`, `CRAWLER_PATH`, `SITE_ORIGIN`. Las URL
  no se mueven (ADR-010 §5). SPEC-005 consume `CRAWLER_PATH`.
- `src/site/redirects.ts` — la lista de 308. La regla de `www` va **la primera**.
  Importa `./routes` con ruta relativa **a propósito**: el transpilador de
  `next.config.ts` no resuelve el alias `@/`.
- `src/site/project-page.tsx` y `src/site/document.tsx` — la página y el
  documento. Cero literales, cero cliente.
- `src/site/robots-txt.ts` + `src/app/robots.txt/route.ts` — el `robots.txt`,
  generado y `force-static`.

**Trampas que ya costaron una vuelta:**
- El transpilador de `next.config.ts` no resuelve `@/`; usa rutas relativas en
  todo lo que la config importe.
- `oxlint --type-aware` rechaza el segundo argumento de `expect`, `toThrow` sin
  mensaje, `children` como prop y tests cuyas aserciones viven en un ayudante.
  Recoge los incumplimientos en una lista y afirma `toEqual([])`.
- La barrera de CA-5 y el escaneo de CA-13.3 **quitan comentarios antes de
  mirar**: la prosa que explica que no hay `@font-face` no puede contar como un
  `@font-face`.
