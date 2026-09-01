---
id: SPEC-004
tipo: ledger
epica: EPIC-003
---
# Ledger — SPEC-004 Sitio público de proyecto en marcador.gal: i18n, contenido y despliegue

## Resumen
- Fase: **GREEN en la tercera vuelta** (2026-08-31, `sdd-verificador`).
  F-SPEC-004-8 **está resuelto y comprobado rompiendo**: `measuring` ya no
  atribuye a una competición lo que le pasa a una fuente, y el caso 10 de
  `i18n.test.ts` fija ahora el hecho verdadero. Sin regresión en nada de lo que
  se había dado por bueno. **CA-12 cierra** con el dictamen de `/sdd-lingua` más
  su reemisión sobre la cláusula nueva. Los cuatro CA que quedan en ⚠️ son DNS,
  despliegue y SPEC-005: **ninguno es trabajo de código de esta spec**.
- Fase anterior: **RED en la segunda vuelta** (2026-08-31, `sdd-verificador`).
  F-SPEC-004-5 y F-SPEC-004-6 **están resueltos y comprobados rompiendo**, pero
  la reescritura de `measuring` introdujo **una afirmación nueva y falsa**
  (F-SPEC-004-8) sobre las competiciones de la propia federación destinataria de
  la carta, y el caso 10 de `i18n.test.ts` la deja **fijada por un test**.
  **CA-12 sí queda cerrado** con el dictamen de `/sdd-lingua` de esta fecha,
  pero habrá que reemitirlo sobre la clave que vuelva a cambiar.
- Fase anterior: corregida tras el primer RED (segunda vuelta del implementador:
  commits `0270eaf` y `2aaccb8`; F-SPEC-004-7 intacto a propósito). Escrita por `sdd-arquitecto`
  el 2026-08-31, aprobada por Alberto Fojo el 2026-08-31, implementada por
  `sdd-implementador` el 2026-08-31 en `ft/SPEC-004-sitio-publico-de-proyecto`.
  **Va primero**: SPEC-005 necesita que `https://marcador.gal/robot` resuelva
  antes de meter esa URL en el user-agent que se envía a terceros.
- **Al cierre de la tercera vuelta queda UNA cosa, y no es código:** el DNS sin
  apuntar (CA-1) y el despliegue. CA-12 está cerrado. Ver «Qué falta por acción
  humana y qué por trabajo».
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
| CA-1 | `src/site/redirects.ts`, `next.config.ts`, `src/site/routes.ts` (`SITE_ORIGIN`) | `tests/site/redirects.test.ts` 1–5 | **Mitad de código: verde**, y no por leer el test. Contra `next build && next start` local: `/`→`308 location: /proxecto`, `/es`→`308 /es/proxecto`, `Host: www.marcador.gal` + `/`→`308 https://marcador.gal`, `+ /proxecto`→`308 https://marcador.gal/proxecto`; destinos `200`. Mutaciones M10/M10b/M10c (www deja de ir primera · `permanent:false` · `/proxecto` se mueve): las tres ponen rojo `redirects.test.ts`. **Mitad de infraestructura: SIN cumplir.** 2026-08-31: `dig +short marcador.gal` y `www.marcador.gal` → `82.98.135.43`; `curl http://marcador.gal/` devuelve `200` con la página de aparcamiento de Dinahosting (`css/parking.css`); `https://` no responde (sin TLS). No hay despliegue publicado. Acción humana pendiente, no fallo del implementador. **CIERRA CONTRA PRODUCCIÓN — 2026-09-01, `sdd-verificador`, con herramienta propia contra `https://marcador.gal`.** DNS: `dig +short marcador.gal A` → `64.29.17.65` y `216.198.79.1` (Vercel); ya **no** es `82.98.135.43`. TLS válido: `openssl s_client` → `subject=CN=marcador.gal`, emisor Let's Encrypt, `notBefore=Sep 1 03:57:58 2026`, `notAfter=Nov 30 2026`; `curl` devuelve `ssl_verify_result=0` en las 11 direcciones probadas. Cadenas medidas con `curl -sSI -L --max-redirs 10`: `https://marcador.gal/` → `308 location: /proxecto` → `200`; `/es` → `308 /es/proxecto` → `200`; `https://www.marcador.gal/` → `308 location: https://marcador.gal/` → `308 /proxecto` → `200` (`num_redirects=2`, **destino final en el ápice**); `www/proxecto` y `www/robot` → `308` al ápice, `num_redirects=1`; `http://marcador.gal/` → `308` a `https` → `308` → `200`. **Sin bucle: comprobado explícitamente con límite de saltos, ningún salto va del ápice a `www`, y `location:` del ápice nunca contiene `www`.** Confirmado además en navegador real (Chrome): navegar a `https://www.marcador.gal/` termina en `https://marcador.gal/proxecto`, `location.host === 'marcador.gal'`, sin `ERR_TOO_MANY_REDIRECTS`. Servidor: `server: Vercel`, `x-matched-path: /proxecto`; **cero rastro de la página de aparcamiento**: `grep -icE 'dinahosting|parking|aparcamiento'` sobre los cuatro HTML servidos → `0` en los cuatro | ✅ |
| CA-2 | `src/app/(gl)/layout.tsx`, `src/app/(gl)/proxecto/page.tsx`, `src/site/document.tsx`, `src/i18n/gl.ts` | `tests/site/pages.test.ts` 1–3 | Verde sobre el HTML **realmente servido**, no solo sobre `renderToStaticMarkup`: `<html lang="gl">` confirmado en el DOM con Playwright. Prueba propia más dura que la suite: resté del `innerText` de `/proxecto` los trece valores del bundle `gl` y el **residuo es la cadena vacía** — no hay una sola palabra visible fuera del bundle. Mutación M12 (`lang="en"` fijo): rojo | ✅ |
| CA-3 | `src/app/(es)/layout.tsx`, `src/app/(es)/es/proxecto/page.tsx`, `src/i18n/es.ts`, `src/site/project-page.tsx` (`<nav>`) | `tests/site/pages.test.ts` 4–6 | `/es/proxecto` → `200`, `<html lang="es">`, texto del bundle `es`. **Comprobado con JavaScript desactivado en Playwright**: clic en el conmutador → `/es/proxecto` (`lang=es`), clic de vuelta → `/proxecto` (`lang=gl`). Es un `<a href>` real, no un manejador. Mutación M14 (`<button onClick>`): rojo | ✅ |
| CA-4 | `src/i18n/site-bundle.ts`, `src/i18n/site.ts`, `src/i18n/gl.ts`, `src/i18n/es.ts` | `tests/site/bundles.test-d.ts` (a), `tests/site/i18n.test.ts` 1–4 (b) | (a) y (b) muerden: M1 (quitar `otherLanguage` de `es.site`) y M2 (añadir `tagline` solo a `es`) ponen rojo los casos 1 y 2. `tsc --noEmit --listFiles` confirma que los 24 ficheros nuevos de `src/site`, `src/i18n`, `src/app` y `tests/site` están **dentro** del programa de tsc | ✅ |
| CA-5 | — (es una barrera, no código de producción) | `tests/site/no-hardcoded-literals.test.ts` 1–2 (el filtro `.ts`/`.tsx` vive ahora aquí, que es donde es cierto) | **Re-verificado en la segunda vuelta: mover el filtro de extensión NO lo degradó.** Las seis mutaciones de la primera vuelta se replantaron una a una y **las seis siguen poniendo rojo el caso 2**: texto JSX en `project-page.tsx` (M3), en un **layout** (D4), en una **page** de ruta (D4b); literal como hijo `{'Ola'}` (M3c); atributo visible `aria-label` (M3b) y `title` en `document.tsx` (D4c). Y una séptima nueva, contra el modo de fallo que abre mover un filtro: **D6**, hacer que `readSourceFiles` devuelva el conjunto vacío → rojo el caso 1, que existe para eso | ✅ |
| CA-6 | `src/i18n/gl.ts`, `src/i18n/es.ts`, `src/site/project-page.tsx` | `tests/site/pages.test.ts` 7–9 | Verificado **sobre el HTML servido por `next start`**, no sobre el proxy de la suite: sin `<form`, `<input`, `<img`; cero términos de la lista negra; cero años `19xx/20xx`; cero URL absolutas. Mutaciones M4 (bundle), D5 (solo en un `h2`), M4b (`<img>`), M4d (`<form><input>`), M4c (fecha 2027): cinco rojos. Salvedad de alcance en el veredicto (F-SPEC-004-7: la suite mira `renderToStaticMarkup`, no la salida real de Next) | ✅ |
| CA-7 | `src/i18n/gl.ts`, `src/i18n/es.ts` | `tests/site/i18n.test.ts` 5–6 | Lista negra: muerde con `relevo` (M5) y con `marcadorgalego` (M5b), y desacentúa antes de mirar. **Y la mitad que es lectura, hecha**: «marcador.gal é un proxecto de tremen.dev, levado por Alberto Fojo. Non hai empresa nin equipo detrás: unha soa persoa traballando por conta propia. O enderezo de contacto é ola@tremen.dev.» Nombra a tremen.dev y a Alberto Fojo, **no se apoya en ningún proyecto anterior, no hay historia y no hay insinuación de sucesión**. D-1 respetada | ✅ |
| CA-8 | `src/site/project-page.tsx`, `src/i18n/*`, `src/site/routes.ts` | `tests/site/pages.test.ts` 10–14; `tests/site/i18n.test.ts` 7–8 (longitud de 8.1), 9–10 (8.2: el 9 no admite medición en curso **ni la atribución a «una de las dos competiciones»**; el 10, reapuntado en la tercera vuelta, exige que `measuring` diga «fuente oficial» + «las dos competiciones» + `robots.txt`, que es el hecho verdadero) | 8.1 presente, 3 oraciones en las dos lenguas, buzón interpolado desde la constante (M6-bis 5 oraciones → rojo). **8.2, contenido: intacto tras la reescritura.** Seis mutaciones nuevas sobre el texto nuevo —quitar `Terceira RFEF G1` (M17), los dos nombres canónicos en `es` (M17b), `conflitos` (M17c), `latencia` (M17d), `operación manual` (M17e), `cobertura` (M17f)— ponen **las seis** rojo el caso 11. Las cuatro cifras y los dos nombres canónicos siguen enteros en el **HTML servido** por `next build && next start`, en las dos lenguas. **8.2, veracidad: VERDE en la tercera vuelta — F-SPEC-004-8 resuelto.** La cláusula falsa se fue y la que la sustituye es la que sostiene `dominio.md:57` («futgal.es … **Fuente oficial** de las dos competiciones del spike … **Hoy no capturable** (ADR-008 §1)»). Comprobado rompiendo, 12 mutaciones nuevas y **las 12 muerden**: V1/V2 (vuelve «unha das dúas competicións non se pode ler hoxe» / «una de las dos competiciones no se puede leer hoy») → **2 rojos cada una**, casos 9 **y** 10; V3/V4 (cae «oficial») → rojo el 10; V5/V6 («das dúas competicións» → «dunha competición» / «de una competición») → rojo el 10; V7/V8 (cae `robots.txt`) → rojo el 10; V9/V10 (vuelve el presente en el párrafo) y V11/V12 (vuelve el presente en el titular) → rojo el 9. **8.2, contenido: sin regresión.** R1–R6 (cae `latencia`, `cobertura`, `conflitos`, `operación manual`, `Terceira RFEF G1`, `Preferente Futgal G1`, repartidas entre las dos lenguas) → **las seis** ponen rojo `pages.test.ts` 11, que no se tocó. Sobre el HTML **servido** por `next build && next start`: las cuatro cifras y los dos nombres canónicos presentes en las dos lenguas, cero de las doce formas prohibidas del caso 9, cero terceros nombrados (`futgal.es`, `ceroacero`, `besoccer`, `flashscore`, `sofascore`). Nombres canónicos contra `dominio.md:108-110`: correctos, y **sin traducir en el bundle `es`**, que es lo que manda `CLAUDE.md` §Lenguas. **La omisión deliberada (que las dos competiciones sí se leen hoy de una fuente no oficial) está dictaminada HONESTA**, ver el veredicto. 8.1 presente, 3 oraciones en las dos lenguas (R9b y R9c, llevarla a cinco → rojo el caso 7), buzón interpolado desde la constante (R12 → 2 rojos). 8.3 y 8.4 presentes, sin fecha ni condicional. **8.5: CERRADO el 2026-09-01 contra producción.** El residual era que el enlace existía y devolvía `404`; SPEC-005 lo resolvió y el despliegue lo confirma: `/proxecto` sirve `href="/robot"` y esa ruta da `200`, `/es/proxecto` sirve `href="/es/robot"` y da `200`. Medido sobre `https://marcador.gal`, no sobre el repositorio. La dependencia de SPEC-005 (F-SPEC-004-2) queda saldada | ✅ |
| CA-9 | `src/app/globals.css`, `src/site/document.tsx` | `tests/site/pages.test.ts` 15, 17 | **Playwright, herramienta propia, no la suite.** Viewports 360, 320 y 1280 px × 2 lenguas × JS activado y desactivado (12 combinaciones): `scrollWidth === clientWidth` en todas, **cero elementos desbordando** el ancho de ventana, cero peticiones a origen externo, `<meta name="viewport" content="width=device-width, initial-scale=1">` presente. Con **JS desactivado el texto es idéntico y el conmutador navega**. Mutaciones M11 (`@font-face` remota) y M11b (`<script src=https://…>`): rojo. **Re-medido en la segunda vuelta sobre el texto nuevo, que es más largo** (Chromium por CDP; ver nota de herramienta en el veredicto): las mismas 12 combinaciones, `scrollWidth === clientWidth` en las doce (320/320, 360/360, 1280/1280), **cero elementos desbordando**, cero peticiones a origen externo, `meta viewport` presente. El párrafo largo no rompió nada | ✅ |
| CA-10 | `src/site/document.tsx`, `src/app/robots.txt/route.ts` (`force-static`) | `tests/site/pages.test.ts` 16, 18 | `curl -sD -` sobre `/`, `/es`, `/proxecto`, `/es/proxecto` y `/robots.txt`: **ninguna respuesta lleva `Set-Cookie`**. Playwright tras navegar las dos páginas y las dos redirecciones: **0 cookies en el contexto, `document.cookie` vacío, 0 claves en `localStorage`/`sessionStorage`, 0 peticiones fuera del origen**. El único identificador del HTML es el `buildId` de Next, constante por build y no por visitante. Mutación M15 (`next/headers`): rojo. **RE-COMPROBADO SOBRE EL DESPLIEGUE — 2026-09-01, `sdd-verificador`.** `curl -sS -D -` con tarro de cookies (`-c`/`-b`) sobre **once** direcciones de `https://marcador.gal`, incluidas **las de redirección y los 404**: `/`, `/es`, `/proxecto`, `/es/proxecto`, `/robot`, `/es/robot`, `/robots.txt`, `www/`, `http://` y dos rutas inexistentes. `grep -ic 'set-cookie'` sobre las cabeceras completas → **`0`**; el tarro de cookies queda **vacío**. Inventario íntegro de cabeceras que devuelve Vercel, sin excepción: `accept-ranges`, `access-control-allow-origin`, `age`, `cache-control`, `content-disposition`, `content-length`, `content-type`, `date`, `etag`, `last-modified`, `location`, `refresh`, `server`, `strict-transport-security`, `vary`, `x-matched-path`, `x-nextjs-prerender`, `x-nextjs-stale-time`, `x-vercel-cache`, `x-vercel-id`. **`x-vercel-id` sí aparece y NO es un rastro del visitante**: cinco peticiones del *mismo* cliente a `/proxecto` dan cinco valores distintos (`cdg1::jpf4h-…`, `x4g4c-…`, `cdm5m-…`, `l45mr-…`, `nfw4x-…`) y tres clientes con user-agent distinto dan otros tres — **varía por petición, no por visitante: es un identificador de traza de la petición, no un identificador estable, y por tanto no permite reidentificar a nadie**. `etag` es lo contrario y tampoco es rastro: **constante entre clientes** (`"7fdd6b5e…"` idéntico en las ocho peticiones) porque es el hash del contenido, no del visitante. Prueba empírica de que el cuerpo no lleva identificador por visitante: dos descargas con user-agent y `X-Forwarded-For` distintos dan **el mismo sha256** en las cuatro páginas. Navegador real (Chrome) sobre `/proxecto` y `/robot`: `document.cookie.length === 0`, `localStorage` con **0 claves**, y `performance.getEntriesByType('resource')` filtrado por origen ajeno → **`[]`**, con los 6 recursos todos bajo `https://marcador.gal/_next/…`. **Dos observaciones que dejo escritas en vez de callarlas, ninguna incumple el CA:** (a) el chunk `3me6c85b_ajsw.js`, que las cuatro páginas cargan, trae de Next un camino que inyectaría `https://vercel.live/_next-live/feedback/feedback.js` — pero está **condicionado a que el navegador ya traiga la cookie `__vercel_toolbar=1`**, que este sitio nunca fija (cero `Set-Cookie`) y que solo tiene quien haya activado la barra de Vercel; con visitante normal el camino no se ejecuta y el navegador confirma 0 peticiones externas; (b) `https://marcador.gal/_vercel/speed-insights/script.js` responde `200` —es ruta de plataforma, existe en todo despliegue de Vercel— pero **ningún HTML ni ningún chunk servido la referencia** (`grep 'speed-insights'` sobre los 4 HTML y los 7 assets → 0), así que **nada la carga y no se emite ninguna baliza**; `/_vercel/insights/script.js`, `/_vercel/insights/view` y `/va/script.js` dan `404`. Analítica de terceros: `grep` de `google-analytics|googletagmanager|gtag|plausible|matomo|umami|posthog|sentry|hotjar|clarity|fathom` sobre los assets servidos → solo falsos positivos de `toStringTag` | ✅ |
| CA-11 | `src/site/robots-txt.ts`, `src/app/robots.txt/route.ts` | `tests/site/robots.test.ts` 1–6 | Servido de verdad: `200`, `content-type: text/plain; charset=utf-8`, cuerpo exacto `# marcador.gal — ola@tremen.dev\n\nUser-agent: *\nAllow: /\n`. Lo genera la ruta, no hay `public/robots.txt`. Sin ningún `Disallow`. `parseRobots` + `USER_AGENT` propios dan `isAllowed` verdadero para `/`, `/proxecto`, `/es/proxecto`, `/robot` y `/es/robot`. El buzón sale interpolado (M9b, escribirlo a mano → rojo por dos tests) y M9 (`Disallow: /proxecto`) → rojo. **COMPROBADO EN `https://marcador.gal/robots.txt` — 2026-09-01, `sdd-verificador`, y no leyendo el fichero del repositorio sino pasándole los BYTES SERVIDOS a nuestro parser.** Servido: `200`, `content-type: text/plain; charset=utf-8`, `content-disposition: inline; filename="robots.txt"`, `x-matched-path: /robots.txt` (**lo genera la ruta de la aplicación**, no hay fichero suelto), 58 bytes, `sha256 c59595827bdba0eee78c180dbe6abc7be78b9e168b3118c10282949e0bbe5bd4`. Volcado byte a byte con `xxd`: `# marcador.gal — ola@tremen.dev\n\nUser-agent: *\nAllow: /\n` — el guion largo es `e2 80 94` y el buzón es el de la constante única de CA-13. **Ningún `Disallow`, de ninguna clase.** Los 58 bytes descargados se pasaron a `parseRobots` de `src/mirror/capture/robots.ts` con el `USER_AGENT` real de `src/mirror/user-agent.ts` (`marcador.gal/0.0.1 (+https://marcador.gal/robot; medicion de latencia)`), ejecutando el módulo de producción, no una copia: el token de emparejamiento sale `marcador.gal` y coincide con `USER_AGENT_PRODUCT`; el grupo `marcador.gal` no existe, cae al comodín `*` y **`isAllowed` es verdadero para `/`, `/proxecto`, `/es/proxecto`, `/robot`, `/es/robot` y `/robots.txt`**. **La comprobación no es vacua, y lo demuestro con dos controles negativos en la misma ejecución**: con `User-agent: *` / `Disallow: /`, `isAllowed('/proxecto')` → `false`; con `Disallow: /robot`, `isAllowed('/robot')` → `false` y `isAllowed('/proxecto')` → `true`. Nos comemos nuestra propia comida y el plato responde | ✅ |
| CA-12 | — | — (no es código: dictamen humano/consultivo) | **Dictamen de `/sdd-lingua` emitido el 2026-08-31 sobre el texto íntegro de `src/i18n/gl.ts` de la segunda vuelta: CORRECTO.** Transcrito abajo, con las dos observaciones no bloqueantes y la excepción consciente anotada. Comprobado por el verificador que el dictamen es **sobre esta redacción y no sobre la anterior**: las dieciséis formas que cita (`Que se vai medir`, `Para que`, `Quen está detrás`, `conflitos`, `produto`, `estudo`, `ficheiro`, `enderezo`, `aínda`, `páxina`, `rastrexador`, `por conta propia`, `fan falta`, `respectalo`, `Como se len`, `otherLanguage`) siguen **todas** en el `gl.ts` de hoy. **CIERRA en la tercera vuelta con la reemisión** sobre la única cláusula que se movió (`git diff 8d47a9e..HEAD -- src/i18n/*.ts`: cambia **solo** la última cláusula de `measuring`, en las dos lenguas). Reemisión transcrita abajo; sus ocho formas (`rastrexa`, `das dúas competicións`, `polas que`, `razóns`, `o seu ficheiro`, `estudo`, `respectalo`, `parado`) verificadas presentes en el fichero de hoy, y `gl.ts`/`es.ts` sin tocar desde `95f89e2` | ✅ |
| CA-13 | `src/site/contact.ts` | `tests/site/contact.test.ts` 1–5 (5: el escaneo cubre `src/` entero, no solo TypeScript); `tests/site/source-scan.ts` (`readSourceFiles` sin filtro de extensión) | 13.1 y 13.2 ✅ (`MAILBOX = 'ola@tremen.dev'`, único `export const` del módulo; M8 → rojo). 13.4 ✅ y **muerde**: borrar «must still be read» de la cabecera pone rojo el caso 3 (M8b). 13.3 muerde donde importa —correo en otro `.ts` de `src/` (M7), escrito en un bundle (M6b), escrito a mano en `robots-txt.ts` (M9b)— y la excepción de `mirror/user-agent.ts` **se autoliquida**: simulé el cambio de SPEC-005 y el test se pone rojo (D1). **F-SPEC-004-6 resuelto, y comprobado rompiendo, no leyendo el diff**: (D3) `soporte@marcador.gal` en un comentario y en un `content:` de `src/app/globals.css` → **rojo** el caso 2; (D3b) el mismo correo en `src/site/NOTAS.txt`, una extensión que nadie previó → **rojo** el caso 2; (D3c) reintroducir el filtro `.ts`/`.tsx` dentro de `readSourceFiles` → **rojo** el caso 5, así que **el arreglo se vigila a sí mismo** y no puede deshacerse en silencio. M7, M6b, M9b y M8/M8b siguen mordiendo | ✅ |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

### GREEN (tercera vuelta) — 2026-08-31, `sdd-verificador`

**Nueve CA en ✅ y cuatro en ⚠️, y las cuatro salvedades son ajenas al código de
esta spec:** DNS sin apuntar (CA-1), cabeceras del despliegue (CA-10),
`robots.txt` sobre el dominio real (CA-11) y `/robot`, que es SPEC-005 (CA-8.5).
La propia spec autoriza por escrito la última («mientras SPEC-005 no esté hecha,
el enlace es lo único de este CA que puede quedar pendiente») y sus notas 4 y 5
autorizan las otras tres.

**F-SPEC-004-8 está resuelto, y se comprobó rompiendo, no leyendo el diff.**
Las doce mutaciones que replantan la falsedad —en sus dos mitades y en las dos
lenguas— **muerden las doce**, y la recaída literal muerde **por partida doble**,
en el caso 9 y en el 10. La barrera dejó de proteger el error: el caso 10 fija
ahora los tres tramos que cargan el hecho verdadero (`a fonte oficial` /
`la fuente oficial`, `das duas competicions` / `de las dos competiciones`,
`robots.txt`) y el caso 9 añadió a su lista negra la recaída concreta.

**El hecho que la página afirma ahora está en el repositorio, literalmente.**
`docs/fundacion/dominio.md:57`: «**futgal.es** — Web pública de la RFGF … **Fuente
oficial** de las dos competiciones del spike, peso 1.0 (RN-01). **Hoy no
capturable** (ADR-008 §1)». Y la carta pide exactamente eso, para las dos:
`carta-rfgf-acceso.md:48-52`.

**Sin regresión, y comprobado plantando de nuevo lo que ya se había dado por
bueno.** 24 mutaciones más, **23 muerden**: CA-8.2 contenido (R1–R6, las seis al
caso 11 de `pages.test.ts`, que no se tocó), CA-8.1 longitud (R9b, R9c), CA-4
paridad (R7), CA-6 lista negra y fechas (R10, R11), CA-7 sucesión (R8), CA-5
barrera de literales (C1, C2, y C3 contra el conjunto vacío), CA-11 (C4, C5),
CA-13 en todos sus puntos (C6 correo en otro `.ts`, C7 en el `.css` —el arreglo
de F-SPEC-004-6 sigue firme—, C8, C9 el contrato de migración, C10 el valor,
R12 escrito a mano en el bundle) y CA-1 mitad de código (C11). La que no muerde
va abajo, con las demás sondas.

**Alcance del cambio de esta vuelta**, `git diff 8d47a9e..HEAD`: `src/i18n/gl.ts`
(7 líneas), `src/i18n/es.ts` (7 líneas), `tests/site/i18n.test.ts` y este ledger.
**Nada** en `src/model/`, `src/db/`, `src/mirror/`, `src/app/`, `src/site/`,
`migrations/` ni en `tests/` fuera de `tests/site/`. El diff de los bundles toca
**solo la última cláusula** de `measuring`.

**Gates, ejecutados el 2026-08-31 en local (no hay CI), con su salida literal:**

- `npm run lint` → `oxlint --type-aware`: **exit 0**, sin una sola línea de
  salida.
- `npm run typecheck` → `tsc --noEmit`: **exit 0**, sin una sola línea de salida.
- `npx vitest run --typecheck`: **exit 0** —
  `Test Files 62 passed (62) · Tests 544 passed (544) · Type Errors no errors`.
  Mismas cifras que la vuelta anterior: no se añadió ni se perdió ningún test.
  Sin `.skip`, `.only`, `.todo`, `.skipIf` ni `.runIf` en todo `tests/`.
- `npx next build`: **exit 0**, prerenderiza `/proxecto`, `/es/proxecto`,
  `/robots.txt` y `/_not-found` como estáticos.

**Verificado con herramienta propia, no dando por buena la suite:**

- **Servidor real** (`next build && next start`, puerto 3211) con `curl -sD -`
  sobre las siete direcciones: `/`→`308 /proxecto`, `/es`→`308 /es/proxecto`,
  `Host: www.marcador.gal` + `/`→`308 https://marcador.gal`, `+ /proxecto`→`308
  https://marcador.gal/proxecto`, las dos páginas `200`, `/robots.txt` `200
  text/plain; charset=utf-8`, `/robot` `404`. **Ninguna respuesta lleva
  `Set-Cookie`.**
- **Sobre el HTML servido** (10 356 y 10 887 bytes): cero de las doce formas de
  medición en presente, cero términos de la lista negra de CA-6, cero de
  sucesión de CA-7, cero terceros nombrados, cero años `19xx/20xx`, cero URL
  absolutas, cero `<form`/`<input`/`<img`; los seis `<script src>` son todos
  `/_next/…`, mismo origen.
- **Navegador real** (Chrome for Testing 149 por CDP), **12 combinaciones** de
  viewport × lengua × JS (320/360/1280 px): `scrollWidth === clientWidth` en las
  doce, **lista de elementos que desbordan el ancho de ventana vacía en las
  doce**, peticiones a origen externo **0**, cookies del contexto **0**,
  `document.cookie` vacío, `localStorage`+`sessionStorage` **0 claves**,
  `<meta name="viewport" content="width=device-width, initial-scale=1">` en las
  doce. Medidas en `_qa/SPEC-004/CA-9-CA-10-medidas-tercera-vuelta.json`.
- **Prueba de texto más dura que la suite:** al `innerText` del DOM servido se le
  restaron las cadenas literales de los bundles; el residuo es **solo los
  titulares en versalitas** (los pone `text-transform` en CSS) y el hueco del
  buzón interpolado. **No hay una sola palabra visible fuera de los bundles**, en
  ninguna de las dos lenguas. HTML servido archivado en
  `_qa/SPEC-004/servido-{gl,es}-proxecto.html`.
- **CA-11 contra los bytes servidos, no contra el generador:** se pasó el cuerpo
  descargado de `http://…/robots.txt` por `parseRobots` de
  `src/mirror/capture/robots.ts` con nuestro propio `USER_AGENT`, e `isAllowed`
  es verdadero para `/`, `/proxecto`, `/es/proxecto`, `/robot`, `/es/robot` y
  `/robots.txt`.
- **Dominio real:** `dig +short marcador.gal` y `www.marcador.gal` →
  `82.98.135.43`; `http://marcador.gal/` responde `200` con la página de
  aparcamiento (`parking`, `<title>marcador.gal</title>`); `https://` no
  responde. CA-1 sigue con su mitad de infraestructura sin cumplir.
- **26 mutaciones en copia aislada** del repositorio (`rsync` sin `.git`,
  `node_modules` clonado). **25 muerden**; la que no, y las tres sondas, abajo.

#### Dictamen sobre la omisión deliberada: HONESTA, y además obligada por CA-8

El implementador dejó fuera un hecho verdadero —que las dos competiciones **sí**
se pueden leer hoy de una fuente no oficial (`fontes-capturables.md:34-35`, 50
nombres de equipo en cada una)—. **No es engaño por omisión.** Cuatro razones,
en orden de peso:

1. **La página no afirma exhaustividad, y lo dice dos veces.** Habla de «as
   fontes públicas de resultados», en **plural** y en genérico, y cierra con
   «esa é **unha das razóns** polas que o estudo está parado». Señalar que la
   cuenta está incompleta es lo contrario de dar a entender que está completa.
2. **La inferencia falsa no se sigue de nada que la página diga.** «La fuente
   oficial no se rastrea» no implica «no se lee nada en ninguna parte»; el
   plural «fontes» va justo en contra. Es exactamente lo que distinguía al texto
   rechazado: «unha das dúas competicións non se pode ler» sí acarreaba la
   implicatura de que la otra sí, porque contrastar una de dos **es** afirmar
   algo de la otra. La redacción de hoy no contrasta nada.
3. **El lector previsto llega desde la carta, y la carta ya se lo ha dicho.**
   `carta-rfgf-acceso.md:44-45`: «buscando hoxe “Preferente Futgal grupo 1
   resultados” aparecen **oito agregadores privados** e ningunha ligazón a
   futgal.es». Ese es el argumento fuerte de la carta. Una página no puede
   engañar a un lector sobre un hecho que el documento del que viene le acaba de
   poner delante, con más detalle del que la página daría.
4. **Decirlo incumpliría CA-8.** El CA enumera cinco afirmaciones y cierra: «El
   sitio **no dice nada más**: la épica cierra cuando cada afirmación
   comprobable tiene su sitio *y* cuando no hay nada de sobra». Nombrar o
   insinuar a un tercero no está entre las cinco, y arrastraría además una
   cuestión de `/sdd-legal-datos` que nadie ha dictaminado.

Y hay un hecho que remata el juicio: lo omitido no describe **actividad**, sino
**capacidad**. Aquella captura fueron «quince minutos … interrumpidos a
propósito», sin `ventana.json` ni cobertura medida
(`fontes-capturables.md:112-115`). La frase de la página que gobierna esto —«A
medición aínda non comezou e non hai ningunha cifra»— **es literalmente
verdadera**, y es justo la que impide la lectura peor: que ya se esté
rastreando algo contra un `robots.txt`. **Cerrado, no es finding.**

#### La mutación que no muerde y las tres sondas, dichas para que consten

Ninguna bloquea; se registran porque el rol obliga a decir lo que la barrera no
ve, y **las cuatro son limitaciones de forma, no defectos del texto de hoy**,
que he leído entero.

- **C12 — renombrar `PROJECT_PATH.gl` de `/proxecto` a otra cosa no pone rojo
  ningún test.** `redirects.test.ts` y `pages.test.ts` leen la constante de forma
  **simbólica**, así que comparan el valor consigo mismo; el directorio del App
  Router (`src/app/(gl)/proxecto/`) seguiría sirviendo la ruta vieja y la
  redirección apuntaría a un 404. ADR-010 §5 dice que estas URL no se mueven
  nunca, y **hoy no se han movido** —comprobado sobre el servidor real—, pero la
  promesa de permanencia no la sostiene ninguna aserción. El caso 5 sí atrapa el
  otro modo de fallo (meter `/proxecto` como *origen* de una redirección).
  **Destino: F-SPEC-004-9, EPIC-MEJORA o SPEC-005.**
- **P1 — el caso 10 fija palabras, no la proposición.** Invertir la negación
  («a fonte oficial das dúas competicións **si** se rastrexa») conserva los tres
  tramos y **pasa**. Es la limitación intrínseca de una lista de tramos y es la
  razón de que el CA pida además la lectura del verificador, hecha.
- **P2 — nombrar a un tercero en `measuring` no pone rojo nada.** La lista negra
  de terceros es de SPEC-005; hoy no hay ninguno en el HTML servido, comprobado.
- **P3 — un `measuring` reducido a la sarta de tramos exigidos pasa la suite.**
  Ningún test mide que el párrafo sea prosa. Es lo esperable y lo cubre la
  lectura.
- Siguen vigentes las **cuatro** de la primera vuelta (contador de oraciones con
  punto y coma; excepción de CA-13.3 por fichero; añadir una clave a `SiteBundle`
  y a los dos bundles; promesa de producto redactada fuera de la lista negra).
  Leídos los dos bundles enteros hoy: no hay nada parecido a ninguna de ellas.

**Nota de herramienta, dicha porque el contrato lo exige y porque sigue igual que
en la vuelta anterior:** el paquete npm de Playwright **no está instalado** en
esta máquina y no hay red autorizada para descargarlo; sí está el Chromium de su
caché, que se condujo **directamente por CDP** (mismo motor, mismas medidas). Lo
que **no** se pudo hacer, otra vez, es **capturar pantalla**:
`Page.captureScreenshot` con `captureBeyondViewport` y el flag `--screenshot` de
`chrome-headless-shell` **se cuelgan sin error** en este entorno, probados los
dos. CA-9 se cierra con **medidas numéricas sobre las 12 combinaciones**, que es
lo que el CA pide («no hay scroll horizontal»), y con el `innerText` y el HTML
servidos, archivados en `_qa/SPEC-004/`. Las cuatro PNG de `_qa/SPEC-004/` siguen
siendo de la **primera** vuelta y **no reflejan el párrafo `measuring` actual**:
se dicen desactualizadas en vez de disimularlo.

### RED (segunda vuelta) — 2026-08-31, `sdd-verificador`

**Los dos findings de trabajo están resueltos de verdad**, comprobados
replantando el fallo y no leyendo el diff. F-SPEC-004-6 además se vigila a sí
mismo: deshacer el arreglo pone rojo un test. CA-5 **no se degradó** al mover el
filtro de extensiones: las seis mutaciones de la primera vuelta siguen mordiendo
y hay una séptima contra el modo de fallo que ese movimiento abría. CA-8.2
conserva **las cuatro cifras y los dos nombres canónicos**, y seis mutaciones
nuevas lo demuestran.

**RED por un hallazgo nuevo, y es del mismo tipo que el que motivó el primero.**
Al quitar la afirmación de una medición en curso se metió otra afirmación falsa
en su lugar: «unha das dúas competicións non se pode ler hoxe, porque o ficheiro
`robots.txt` da súa fonte non o permite». La evidencia del propio repositorio
dice lo contrario en las dos mitades (F-SPEC-004-8). Y esta vez **la falsedad
está fijada por un test** —el caso 10 exige que ese párrafo mencione
`robots.txt`—, así que ya no es un descuido de redacción: es una barrera
apuntando al sitio equivocado.

**CA-12 se cierra en esta vuelta** con el dictamen de `/sdd-lingua` (abajo),
verificado como emitido sobre el texto de la segunda vuelta y no sobre el
anterior. Queda ⚠️ y no ✅ solo porque F-SPEC-004-8 obliga a reescribir
`measuring`, que es donde viven cuatro de las formas dictaminadas.

**Gates, ejecutados el 2026-08-31 en local (no hay CI), con su salida literal:**

- `npm run lint` → `oxlint --type-aware`: **exit 0**, sin una sola línea de
  salida.
- `npm run typecheck` → `tsc --noEmit`: **exit 0**, sin una sola línea de salida.
- `npx vitest run --typecheck`: **exit 0** —
  `Test Files 62 passed (62) · Tests 544 passed (544) · Type Errors no errors`
  (541 en la primera vuelta, +3).
- `npx next build`: **exit 0**, prerenderiza `/proxecto`, `/es/proxecto`,
  `/robots.txt` y `/_not-found` como estáticos.
- **Alcance del cambio**: `git diff 9415645..HEAD` toca `src/i18n/{gl,es}.ts`,
  `tests/site/{contact,i18n,no-hardcoded-literals}.test.ts`,
  `tests/site/source-scan.ts` y el ledger. **Nada** en `src/model/`, `src/db/`,
  `src/mirror/`, `migrations/` ni en `tests/` fuera de `tests/site/`.

**Cómo se comprobó, rompiendo:** el repositorio se replicó en una copia aislada
(`rsync` sin `.git`, `node_modules` clonado) y se plantaron **26 mutaciones**
en esta vuelta. **Las 26 muerden**, cada una en el test que le toca. Además,
servidor real (`next build && next start`) con `curl -sD -` sobre las seis
rutas, y navegador real sobre las 12 combinaciones de viewport × lengua × JS.

**Nota de herramienta, dicha porque el contrato lo exige:** el paquete npm de
Playwright **no está instalado** en esta máquina (`npx playwright` pide
descargarlo y no hay red autorizada para ello); sí está el Chromium de su caché.
Se condujo ese Chromium **directamente por CDP** —mismo motor, mismas medidas—
para las 12 combinaciones. Lo que **no** se pudo hacer es **capturar pantalla**:
`Page.captureScreenshot` y el flag `--screenshot` se cuelgan en este entorno, sin
error. Las cuatro PNG de `_qa/SPEC-004/` son de la **primera** vuelta y por tanto
**no reflejan el párrafo `measuring` actual**. CA-9 se cierra aquí con medidas
numéricas, que son más fuertes que una imagen para lo que el CA pide; la
evidencia visual queda desactualizada y se anota como tal.

### RED (primera vuelta) — 2026-08-31, `sdd-verificador`

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

- **F-SPEC-004-9 — la permanencia de las URL no la sostiene ninguna aserción.**
  `redirects.test.ts` y `pages.test.ts` leen `PROJECT_PATH` y `CRAWLER_PATH` de
  forma simbólica, así que renombrar la constante compara el valor consigo mismo
  y **no pone rojo nada**, aunque el directorio del App Router siga sirviendo la
  ruta vieja y la redirección pase a apuntar a un 404. ADR-010 §5 dice que estas
  direcciones no se mueven **nunca**, y CA-1 y la sección de diseño 2 lo tratan
  como el compromiso central de la spec; hoy no se han movido —comprobado sobre
  el servidor real— pero mañana podrían moverse en silencio. El arreglo es una
  aserción literal (`expect(PROJECT_PATH.gl).toBe('/proxecto')` y sus tres
  gemelas) o comprobar que existe el directorio de ruta correspondiente.
  **No bloquea:** el estado de hoy es correcto y el CA se verifica sobre el
  resultado. **Destino: EPIC-MEJORA, o SPEC-005, que ya va a tocar
  `CRAWLER_PATH`.**

- **F-SPEC-004-8 — RESUELTO en la tercera vuelta (commit `95f89e2`).** La
  cláusula falsa se fue de las dos lenguas y la sustituye el hecho que sostiene
  `dominio.md:57`: **la fuente oficial de las dos** competiciones no se rastrea
  porque su `robots.txt` no lo permite, y eso es **una de las razones** por las
  que el estudio está parado. La barrera dejó de proteger el error: el caso 10
  fija los tres tramos del hecho verdadero y el caso 9 sumó la recaída concreta a
  su lista negra. Comprobado rompiendo: doce mutaciones (V1–V12), **las doce
  muerden**, y la recaída literal muerde por partida doble. La omisión que queda
  —que las dos competiciones sí se leen hoy de una fuente no oficial— está
  **dictaminada honesta** en el veredicto de la tercera vuelta. Texto original
  del finding, abajo, para quien necesite el contexto.

- **F-SPEC-004-8 (texto original del finding de la segunda vuelta) — la página
  afirma un hecho que la evidencia del propio repositorio desmiente.**
  El texto nuevo de `measuring` dice, en las dos lenguas: «A medición aínda non
  comezou e non hai ningunha cifra: **unha das dúas competicións non se pode ler
  hoxe**, porque o ficheiro `robots.txt` da súa fonte non o permite» / «una de
  las dos competiciones no se puede leer hoy…». **Es falso en sus dos mitades,
  y la fuente que lo desmiente es `docs/epicas/EPIC-001-spike-ingesta/hallazgos/fontes-capturables.md`:**
  1. **No es una de las dos: `ceroacero.es` sirve las dos.** La tabla del
     hallazgo mide 50 nombres de equipo reales en Preferente Futgal G1 (227 KB)
     **y** 50 en Terceira RFEF G1 (251 KB). Hoy **las dos** competiciones se
     pueden leer, de la misma fuente y sin incumplir nada.
  2. **Lo que no se puede leer no es una competición: es una fuente**, y afecta
     a las dos por igual. `futgal.es` es la fuente **oficial de ambas** y su
     `robots.txt` prohíbe el rastreo (ADR-008 §1). Eso es exactamente lo que
     dice la carta —«necesito ler as páxinas públicas de Terceira RFEF G1 **e**
     Preferente Futgal G1 … hoxe non o fago»—: **las dos**, no una.
  3. **Y el motivo real por el que no hay cifras tampoco es ese.** EPIC-001 está
     bloqueada porque **solo hay una fuente automática capturable**
     (`ceroacero.es`): `besoccer.es` responde 200 con 130–146 KB y **cero**
     nombres de equipo, y su dato vive tras un `Disallow: /ajax*`. SPEC-003 mide
     el cruce **entre dos** candidatas, así que no es ejecutable por aritmética
     (`docs/roadmap.md`, «EPIC-001 … BLOQUEADA»).
  **Por qué bloquea, y no es purismo:** el lector previsto es un técnico de la
  RFGF que llega desde la carta. La carta pide permiso para **las dos**
  competiciones en `futgal.es`; el sitio le dice que **una** no se puede leer.
  La inferencia natural es que la otra sí se está leyendo —y de la fuente que la
  carta nombra—, que es literalmente el malentendido que F-SPEC-004-5 existía
  para evitar. Es «una carta desmentida por su propio enlace» otra vez, con otra
  frase.
  **Agravante: la falsedad está fijada por un test.** `tests/site/i18n.test.ts`
  caso 10 («dice por qué una de las dos competiciones no se puede leer hoy»)
  exige que `measuring` contenga `robots.txt`. La barrera es correcta en forma y
  está apuntando al hecho equivocado, así que hoy **protege el error**.
  **Arreglo.** Reescribir la cláusula final de `measuring` en `src/i18n/gl.ts` y
  `src/i18n/es.ts` de modo que sea verdad. Lo que hay que conservar y lo que
  no:
  - **Conservar** las cuatro cifras y los dos nombres canónicos de CA-8.2
    (`pages.test.ts` 11 lo comprueba), y que no se afirme medición en curso
    (`i18n.test.ts` 9).
  - **Conservar** la mención a `robots.txt`: es lo que hace que el sitio
    **refuerce** la carta, y el instinto del implementador ahí era bueno.
  - **Decir la verdad**, que es más favorable a la carta que la frase actual: la
    **fuente oficial** de las dos competiciones no se rastrea porque su
    `robots.txt` no lo permite y respetarlo es una norma del proyecto. No hay
    que nombrar a ningún tercero para decir eso —el implementador ya evitó
    hacerlo, y bien—, pero **sí** hay que dejar de decir «una de las dos
    competiciones».
  - **No inventar** el motivo del bloqueo si no se quiere entrar en él: basta
    con no atribuirlo a una competición. Si se prefiere decirlo, el motivo real
    es que hoy no hay dos fuentes automáticas que cruzar.
  - **Reapuntar el caso 10** para que exprese la afirmación corregida, y valorar
    añadir a la lista negra del caso 9 las formas `unha das dúas competicions` /
    `una de las dos competiciones`, que es la recaída concreta.
  **Y después, `/sdd-lingua` otra vez sobre `measuring`**: el dictamen de CA-12
  cubre la redacción de hoy, no la que venga.

- **F-SPEC-004-5 — RESUELTO en la segunda vuelta (commit `2aaccb8`).** El texto
  ya no afirma una medición en curso, ni en el párrafo ni en el titular ni en
  `noProduct`. Comprobado rompiendo, sobre el texto nuevo: M16 («está a medir»
  en `gl`), M16b («estamos midiendo» en `es`), M16c («As competicións medidas
  son»), M16d (titular en presente sobre párrafo en futuro) → **los cuatro rojos**
  en `i18n.test.ts` 9. Y confirmado sobre el **HTML servido** por
  `next build && next start`: cero coincidencias de las ocho formas en presente,
  en las dos lenguas. **La afirmación que lo sustituye es otro problema, y es
  F-SPEC-004-8.** Texto original del finding, abajo, para quien necesite el
  contexto.

- **F-SPEC-004-6 — RESUELTO en la segunda vuelta (commit `0270eaf`).**
  `readSourceFiles` ya no filtra por extensión y el filtro `.ts`/`.tsx` vive en
  `siteSources()` de `no-hardcoded-literals.test.ts`, que es CA-5 y sí habla de
  JSX. Comprobado rompiendo: (D3) el correo replantado en `src/app/globals.css`
  → **rojo**; (D3b) el mismo correo en `src/site/NOTAS.txt`, una extensión que
  nadie previó → **rojo**; (D3c) reintroducir el filtro dentro del ayudante →
  **rojo** el caso 5 nuevo, que compara el escaneo con un recorrido de `src/`
  independiente. El arreglo **no se puede deshacer en silencio**, que es lo que
  se le pedía. CA-5 no perdió nada al mudarse el filtro: sus seis mutaciones
  siguen mordiendo, más D6 contra el conjunto vacío.

- **F-SPEC-004-5 (texto original del finding de la primera vuelta) — La página
  afirma en presente una medición que hoy
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

- **F-SPEC-004-6 (texto original del finding de la primera vuelta) — CA-13.3 no cubría «cualquier punto de `src/`».**
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

### Reemisión del dictamen de lengua sobre `measuring` — CA-12, 2026-08-31

Emitida por la autoridad de lengua sobre la **cláusula nueva** de `measuring`
(commit `95f89e2`). El resto de los dos bundles no cambió —`git diff
8d47a9e..HEAD -- src/i18n/*.ts` mueve **solo** la última cláusula— y sigue
cubierto por el dictamen íntegro de más abajo.

> **CORRECTO.** `rastrexa` es forma correcta de *rastrexar* y coherente con
> `rastrexador`, ya dictaminado. `das dúas competicións`, `polas que`, `razóns`:
> contracciones y plurales correctos. `o seu ficheiro` concuerda con *ficheiro* y
> no con *fonte*, que es lo correcto en galego. `estudo` correcto, `respectalo`
> mantiene el enclítico, `parado` es forma normativa RAG. Sin cambios pendientes.
>
> Sigue vigente del dictamen anterior: `otherLanguage: 'Castellano'` es
> **excepción consciente** (convención de conmutador, simétrica con `'Galego'` en
> `es.ts`), ya anotada en el ledger. Y la observación cosmética sobre `about`
> («levado por» → «que leva») **no bloquea**: queda como deuda menor, no como
> finding.

**Comprobación del verificador, que no da la reemisión por buena sin mirar:** las
ocho formas que cita (`rastrexa`, `das dúas competicións`, `polas que`, `razóns`,
`o seu ficheiro`, `estudo`, `respectalo`, `parado`) están **todas** en el `gl.ts`
de hoy, y ni `gl.ts` ni `es.ts` se han tocado desde `95f89e2`. Sumada al dictamen
íntegro de abajo, **CA-12 queda cubierto sin hueco** y pasa a ✅.

**Alcance, dicho con precisión:** `/sdd-lingua` es la autoridad de la **lingua
galega**, así que los dos dictámenes son sobre `src/i18n/gl.ts`, que es
exactamente lo que la spec teme («el galego de este sitio lo va a leer una
federación»). El bundle `es.ts` lo he leído yo como verificador: castellano
correcto, paralelo frase a frase al galego, y con los nombres de competición
**sin traducir**, que es lo que manda `CLAUDE.md` §Lenguas y confirma
`dominio.md:108-110`.

### Dictamen de `/sdd-lingua` — CA-12, 2026-08-31

Emitido por la autoridad de lengua sobre `src/i18n/gl.ts`, **texto íntegro y no
una muestra**, contra norma RAG. Sobre la redacción de la segunda vuelta
(commit `2aaccb8`).

> **Dictamen: CORRECTO.** Sin acentos diacríticos en interrogativos
> (`Que se vai medir`, `Para que`, `Quen está detrás`), que es el error típico y
> no está. `conflitos` (no *conflictos*), `produto` (no *producto*), `estudo`
> (no *estudio*), los tres castellanismos clásicos, correctos. `ficheiro`,
> `enderezo`, `aínda`, `páxina`, `rastrexador` (de *rastrexar*),
> `por conta propia`, `fan falta`, enclítico `respectalo`: correctos.
> `Como se len` es la forma correcta de *ler* en 3ª persoa do plural.
>
> Dos observaciones **no bloqueantes**: (a) `otherLanguage: 'Castellano'` en el
> bundle galego **no** es castellanismo sino convención de conmutador —cada
> lengua se nombra en sí misma, y `es.ts` hace lo simétrico con `'Galego'`—;
> dictamen correcto, pero **anótalo en el ledger como excepción consciente**,
> porque el siguiente que lo lea lo "corregirá" a *Castelán* creyéndolo un
> descuido; la forma normativa RAG es *castelán* si algún día pesa el requisito
> de publicación íntegramente en galego de la PR858A. (b) `about` dice «levado
> por Alberto Fojo», que calca al castellano *llevado por*; más idiomático sería
> «que leva Alberto Fojo». Cosmético, no bloquea.

**Cada corrección, aplicada o justificada una a una, como pide CA-12:**

| # | Observación | Resolución |
|---|---|---|
| (a) | `otherLanguage: 'Castellano'` no es *castelán* | **Justificada, NO se cambia. EXCEPCIÓN CONSCIENTE.** Es la convención de conmutador de lengua: cada lengua se nombra en sí misma, y `es.ts` hace lo simétrico con `'Galego'`. **Aviso a quien venga: esto no es un descuido y "corregirlo" a *Castelán* rompe la simetría.** La forma normativa RAG *castelán* solo entra si algún día pesa el requisito de publicación íntegramente en galego de la PR858A |
| (b) | «levado por Alberto Fojo» calca *llevado por* | **Pendiente, cosmética y no bloqueante.** «que leva Alberto Fojo» es más idiomático. Cae en la misma pasada que F-SPEC-004-8 si se quiere, pero **cuidado**: `about` está bajo el contador de oraciones de CA-8.1 (`i18n.test.ts` 7, tres o cuatro y ni una más) |

**Comprobación del verificador, que no da el dictamen por bueno sin mirar:** las
dieciséis formas citadas están todas en el `gl.ts` de hoy y `git log` confirma
que el fichero no se ha tocado desde `2aaccb8`, así que el dictamen es **sobre
el texto actual**. **Lo que no cubre:** la reescritura que exige F-SPEC-004-8.
Cuatro de las formas dictaminadas (`estudo`, `ficheiro`, `respectalo`,
`fan falta`) viven dentro de `measuring`. Cuando esa clave cambie, hay que
**reemitir el dictamen sobre ella** en las dos lenguas. Por eso CA-12 queda ⚠️ y
no ✅: el trabajo está hecho, pero sobre un texto que va a moverse.

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

**Al cierre de la tercera vuelta (2026-08-31) — GREEN:**

- **Trabajo de código de esta spec: NINGUNO.** Los tres findings bloqueantes
  (F-SPEC-004-5, -6, -8) están resueltos y comprobados rompiendo.
- **Humano, y es lo único que separa al sitio de estar publicado:** apuntar el
  DNS de `marcador.gal` en Dinahosting a Vercel y publicar el despliegue (CA-1);
  proteger las URL de preview antes de enlazar el sitio (F-SPEC-004-4). Hecho
  eso, quedan por re-comprobar **sobre el despliegue** las mitades de CA-10
  (cabeceras que añade Vercel) y CA-11 (`https://marcador.gal/robots.txt`), que
  en local están verdes.
- **Otras specs:** `/robot`, hoy `404` (CA-8.5, F-SPEC-004-2, SPEC-005);
  F-SPEC-004-7 (donde decida arquitectura); F-SPEC-004-9, nuevo y no bloqueante.
- **Orden, que no es negociable:** el sitio **no se enlaza desde la carta** hasta
  que SPEC-005 esté hecha y `/robot` resuelva. Es la nota 5 de la spec y es lo
  que evita repetir F-SPEC-002-1.
- **Deuda menor abierta a propósito:** la observación (b) del dictamen de lengua
  («levado por» → «que leva» en `about`). Cosmética, no bloqueante, y `about`
  está bajo el contador de oraciones de CA-8.1.
- **La spec SÍ se transicionó** a `hecho` en esta vuelta, por
  `estado.mjs … --por sdd-verificador`, que es lo que el rol manda con GREEN.
  **Dicho para que conste:** como ninguna de las dos vueltas anteriores la movió
  de `aprobada`, la máquina de estados obligó a pasar por `en-progreso` y
  `en-revision` antes de `hecho`. Los tres saltos quedan en el `historial` del
  frontmatter con fecha y actor; ninguno es un juicio distinto del GREEN.

**Al cierre de la segunda vuelta (2026-08-31):**

- **Humano (no cuenta como fallo del implementador):** apuntar el DNS de
  `marcador.gal` a Vercel y publicar el despliegue (CA-1) — hoy `dig` sigue
  devolviendo `82.98.135.43` para el ápice y para `www`, `http://marcador.gal/`
  responde `200` con la página de aparcamiento y `https://` no responde;
  proteger las URL de preview antes de enlazar el sitio (F-SPEC-004-4).
  **CA-12 ya no está en esta lista: el dictamen está emitido y transcrito
  arriba**, salvo la reemisión sobre `measuring` que arrastra F-SPEC-004-8.
- **Trabajo:** **F-SPEC-004-8** (implementador, esta spec, y es el único
  bloqueante que queda de código); F-SPEC-004-7 (donde decida arquitectura);
  `/robot`, que hoy es 404 (F-SPEC-004-2, SPEC-005). La observación (b) de
  lengua, cosmética, si se quiere aprovechar la misma pasada.
- **Resueltos:** F-SPEC-004-5 y F-SPEC-004-6.
- **La spec NO se ha transicionado de estado** en ninguna de las dos vueltas: el
  encargo de la verificación prohíbe expresamente editar la spec, así que no se
  ejecutó `estado.mjs … en-progreso`. Queda para quien conduzca el pipeline.

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-004/. Informe HTML opcional: _qa/SPEC-004/informe.html -->

| CA | Evidencia | Qué prueba |
|---|---|---|
| CA-9, CA-10 | `_qa/SPEC-004/CA-9-CA-10-medidas-tercera-vuelta.json` | Las 12 combinaciones de viewport × lengua × JS medidas en Chrome for Testing 149 por CDP: `scrollWidth`/`clientWidth`, elementos que desbordan, peticiones externas, cookies, `localStorage`/`sessionStorage`, `meta viewport`, `lang` y el `innerText` completo de cada una |
| CA-2, CA-3, CA-6, CA-8 | `_qa/SPEC-004/servido-gl-proxecto.html` y `servido-es-proxecto.html` | El HTML **realmente servido** por `next build && next start` en la tercera vuelta, sobre el que se hicieron las comprobaciones de contenido |

> **Las cuatro PNG siguen DESACTUALIZADAS: son de la primera vuelta** y muestran
> el párrafo `measuring` **anterior** a `2aaccb8`. En la segunda vuelta y en la
> tercera no se pudieron rehacer: el paquete npm de Playwright no está
> instalado en la máquina y, conduciendo el Chromium de su caché por CDP,
> `Page.captureScreenshot` y el flag `--screenshot` **se cuelgan sin error**. Se
> dice en vez de disimularlo. CA-9 se re-verificó con **medidas numéricas** en
> las mismas 12 combinaciones (ver la fila de CA-9), que es lo que el CA pide;
> las imágenes quedan como evidencia de maquetación, no de texto. Rehacerlas
> cuando haya despliegue o Playwright instalado.

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

- **F-SPEC-004-9 — la permanencia de las URL no la vigila ningún test.** Ver el
  finding completo arriba. **Destino: EPIC-MEJORA o SPEC-005.**
- **~~CA-12 necesita una reemisión~~ — HECHA en la tercera vuelta**, transcrita
  arriba en «Reemisión del dictamen de lengua sobre `measuring`». Texto original
  de la salvedad, abajo. **CA-12 cerrado.** La tercera
  vuelta reescribió **solo la última cláusula** de `measuring` (`gl` y `es`);
  todo lo demás de los dos bundles sigue byte a byte como lo dictaminó
  `/sdd-lingua` el 2026-08-31. Lo que hay que llevarle son las dos frases nuevas
  del galego —«A medición aínda non comezou e non hai ningunha cifra. A fonte
  oficial das dúas competicións non se rastrexa, porque o seu ficheiro robots.txt
  non o permite e respectalo é unha norma do proxecto: esa é unha das razóns
  polas que o estudo está parado.»— y su paralelo castellano. Formas nuevas a
  mirar: `rastrexa` (coherente con `rastrexador`, que ya iba dictaminado),
  `parado`, `polas que`. **Destino: acción consultiva antes de cerrar CA-12.**
- **La observación (b) del dictamen de lengua sigue pendiente a propósito.**
  «levado por Alberto Fojo» → «que leva Alberto Fojo» es cosmética y no
  bloqueante, y vive en `about`, no en `measuring`. La tercera vuelta tenía **un
  solo finding** de alcance y no se metió ahí: `about` está bajo el contador de
  oraciones de CA-8.1 y tocarlo sin necesidad es exactamente el tipo de trabajo
  no especificado que el rol prohíbe. **Destino: quien recoja la reemisión de
  CA-12, si se quiere.**

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->

### Tercera vuelta — 2026-08-31, `sdd-implementador`, tras el segundo RED

Se corrigió **F-SPEC-004-8 y solo eso**, commit `95f89e2`. F-SPEC-004-7 sigue
intacto a propósito (fuera de alcance por decisión previa), y no se tocó nada de
lo que el verificador dio por bueno: ni el escaneo de `src/` de CA-13.3, ni las
listas negras de CA-6/CA-7, ni `src/mirror/`, `src/model/`, `src/db/` ni
`migrations/`.

**Texto nuevo de `measuring`, literal, para el dictamen de lengua.**

`src/i18n/gl.ts`:

> «O proxecto está preparado para medir catro cousas sobre as fontes públicas de
> resultados: a latencia con que aparece cada marcador, a cobertura dos partidos,
> os conflitos entre fontes e os minutos de operación manual que fan falta. As
> competicións do estudo son Terceira RFEF G1 e Preferente Futgal G1. A medición
> aínda non comezou e non hai ningunha cifra. A fonte oficial das dúas
> competicións non se rastrexa, porque o seu ficheiro robots.txt non o permite e
> respectalo é unha norma do proxecto: esa é unha das razóns polas que o estudo
> está parado.»

`src/i18n/es.ts`:

> «El proyecto está preparado para medir cuatro cosas sobre las fuentes públicas
> de resultados: la latencia con la que aparece cada marcador, la cobertura de
> los partidos, los conflictos entre fuentes y los minutos de operación manual
> que hacen falta. Las competiciones del estudio son Terceira RFEF G1 y
> Preferente Futgal G1. La medición todavía no ha empezado y no hay ninguna
> cifra. La fuente oficial de las dos competiciones no se rastrea, porque su
> fichero robots.txt no lo permite y respetarlo es una norma del proyecto: esa es
> una de las razones por las que el estudio está parado.»

**Cambia solo la última cláusula.** Las dos primeras frases —las cuatro cifras y
los dos nombres canónicos— están intactas desde `2aaccb8`, así que el dictamen de
CA-12 sigue cubriéndolas; lo nuevo que hay que dictaminar es la tercera y la
cuarta frase.

**De dónde sale cada afirmación que queda en `measuring`.** Es la corrección del
patrón que falló dos veces: una frase sin fuente citable no va en la página.

| Afirmación en la página | Fuente |
|---|---|
| Se van a medir latencia, cobertura, conflictos y minutos de operación manual | `SPEC-004…md:166-167` (CA-8.2); `docs/epicas/EPIC-002-instrumentacion-de-las-cuatro-cifras/_epica.md` |
| Las competiciones del estudio son Terceira RFEF G1 y Preferente Futgal G1 | `SPEC-004…md:167` (CA-8.2); `CLAUDE.md` §Estado actual; nombres canónicos de `docs/fundacion/dominio.md` |
| La medición aún no ha comenzado y no hay ninguna cifra | `hallazgos/fontes-capturables.md:112-115` («No es una ventana de observación… No hay `ventana.json`, y por tanto no hay cobertura medida ni veredicto»); `CLAUDE.md` §Estado actual («EPIC-001 no tiene todavía ninguna de sus cuatro cifras») |
| La fuente **oficial** de las **dos** competiciones no se rastrea, porque su `robots.txt` no lo permite | `hallazgos/fontes-capturables.md:66-67` («`futgal.es`, la **oficial** y de peso 1.0, no es capturable: su `robots.txt` prohíbe el rastreo (ADR-008 §1)»). Que la fuente oficial es la de **las dos** y no la de una: `docs/negocio/carta-rfgf-acceso.md:48-52` («necesito ler as páxinas públicas de Terceira RFEF G1 **e** Preferente Futgal G1 … Hoxe non o fago, precisamente porque o seu `robots.txt` non mo permite») |
| Respetarlo es una norma del proyecto | RN-11 en `docs/fundacion/reglas.md`, regla dura de `FOUNDATION.md`; misma frase que la carta, `carta-rfgf-acceso.md:51-52` |
| **Esa es una de las razones** por las que el estudio está parado | Deliberadamente «una de»: `hallazgos/fontes-capturables.md:64` y `:71-73` dicen que el bloqueo real es que **solo hay una fuente automática capturable** y SPEC-003 cruza **dos**. La página no entra en ese motivo (obligaría a nombrar terceros), pero **tampoco lo atribuye** a la fuente oficial: por eso «una de las razones» y no «la razón» |

**Lo que la página deliberadamente NO dice, y por qué.** Que las dos
competiciones **sí** se pueden leer hoy de una fuente no oficial
(`fontes-capturables.md:34-35`: 50 nombres de equipo en cada una) es verdad, pero
decirlo obligaría a nombrar a un tercero o a insinuarlo, y CA-6 y el criterio del
finding lo excluyen. No decirlo no engaña a nadie: la página no afirma que no se
lea nada, afirma que la **oficial** no se rastrea, que es lo que la carta pide.

**Tests reapuntados** (`tests/site/i18n.test.ts`):
- **Caso 10**, renombrado a «dice que la fuente oficial de las DOS competiciones
  no se rastrea, y por qué». Ya no basta con que aparezca `robots.txt`: fija tres
  tramos por lengua, desacentuados —`a fonte oficial` / `la fuente oficial`,
  `das duas competicions` / `de las dos competiciones`, y `robots.txt`—. Se fijan
  tramos y no la frase entera para que la redacción pueda mejorarse sin poder
  perder el hecho.
- **Caso 9**, lista negra `NOT_MEASURING_YET` ampliada con
  `unha das duas competicions` y `una de las dos competiciones`, desacentuadas
  como el resto. Esta recaída concreta ya no puede volver en silencio.
- `pages.test.ts` 11 (cuatro cifras + dos nombres canónicos) **no se tocó** y
  sigue verde.

**Comprobado rompiendo, no leyendo el diff.** Los dos casos estaban **en rojo
antes** del cambio (9 por las dos formas nuevas, 10 por «fuente oficial»
ausente). Cinco mutaciones sobre el texto nuevo, revertidas por copia y
verificadas idénticas al terminar: **M18** (vuelve «unha das dúas competicións
non se pode ler hoxe» en `gl`) → **2 rojos** (9 y 10); **M18b** (lo mismo en
`es`) → **2 rojos**; **M18c** (cae «oficial» en `gl`) → rojo el 10; **M18d**
(«de las dos competiciones» → «de una competición» en `es`) → rojo el 10;
**M18e** (cae `robots.txt` en `gl`) → rojo el 10.

**Sobre el HTML realmente servido** por `next build && next start` (puerto 3117,
`/proxecto` y `/es/proxecto`, 10 356 y 10 945 bytes): cero coincidencias de las
doce formas prohibidas del caso 9 —las diez viejas y las dos nuevas—; cero
menciones a terceros (`futgal.es`, `ceroacero`, `besoccer`); presentes
`latencia`, `cobertura`, `operación manual`, `conflitos`/`conflictos`,
`Terceira RFEF G1`, `Preferente Futgal G1` y `robots.txt` en las dos lenguas;
cero años `19xx/20xx` y cero URL absolutas (CA-6 sigue entera).

**Gates de esta vuelta, en local (no hay CI):** `npm run lint` →
`oxlint --type-aware` **exit 0, sin una sola incidencia**; `npm run typecheck` →
`tsc --noEmit` **exit 0**; `npx vitest run --typecheck` → **62 ficheros, 544
tests, todo verde, `Type Errors no errors`**; `npx next build` → **compilado, 5
páginas estáticas**. Mismas cifras que la referencia de la vuelta anterior: no se
añadió ni se perdió ningún test, solo se reapuntó uno.

**Lo que sigue sin desbloquear el implementador:** el DNS (CA-1), `/robot`
(SPEC-005, CA-8.5), la mitad de CA-10/CA-11 que solo se ve sobre el despliegue, y
**la reemisión del dictamen de `/sdd-lingua` sobre `measuring`** — el de CA-12
cubre la redacción anterior de esa clave, no esta.

### Segunda re-verificación — 2026-08-31, `sdd-verificador`

**Estado en una línea: doce de trece CA verdes o con salvedad aceptada, y un
solo bloqueante de código.** Empieza por **F-SPEC-004-8**: es una frase de
`measuring` en `src/i18n/gl.ts` y `src/i18n/es.ts`, más reapuntar el caso 10 de
`tests/site/i18n.test.ts`. No toques nada más de la barrera: F-SPEC-004-5 y
F-SPEC-004-6 están bien resueltos y sus mutaciones muerden. Después,
`/sdd-lingua` sobre la clave reescrita en las dos lenguas, y CA-12 cierra.

Lo que **no** desbloquea el implementador y sigue igual: el DNS (CA-1), `/robot`
(SPEC-005, CA-8.5) y la mitad de CA-10/CA-11 que solo se ve sobre el despliegue.

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
