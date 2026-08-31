---
id: SPEC-004
tipo: ledger
epica: EPIC-003
---
# Ledger — SPEC-004 Sitio público de proyecto en marcador.gal: i18n, contenido y despliegue

## Resumen
- Fase: **implementada, esperando verificación**. Escrita por `sdd-arquitecto`
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
| CA-1 | `src/site/redirects.ts`, `next.config.ts`, `src/site/routes.ts` (`SITE_ORIGIN`) | `tests/site/redirects.test.ts` 1–5 | | 🚧 |
| CA-2 | `src/app/(gl)/layout.tsx`, `src/app/(gl)/proxecto/page.tsx`, `src/site/document.tsx`, `src/i18n/gl.ts` | `tests/site/pages.test.ts` 1–3 | | 🚧 |
| CA-3 | `src/app/(es)/layout.tsx`, `src/app/(es)/es/proxecto/page.tsx`, `src/i18n/es.ts`, `src/site/project-page.tsx` (`<nav>`) | `tests/site/pages.test.ts` 4–6 | | 🚧 |
| CA-4 | `src/i18n/site-bundle.ts`, `src/i18n/site.ts`, `src/i18n/gl.ts`, `src/i18n/es.ts` | `tests/site/bundles.test-d.ts` (a), `tests/site/i18n.test.ts` 1–4 (b) | | 🚧 |
| CA-5 | — (es una barrera, no código de producción) | `tests/site/no-hardcoded-literals.test.ts` 1–2 | | 🚧 |
| CA-6 | `src/i18n/gl.ts`, `src/i18n/es.ts`, `src/site/project-page.tsx` | `tests/site/pages.test.ts` 7–9 | | 🚧 |
| CA-7 | `src/i18n/gl.ts`, `src/i18n/es.ts` | `tests/site/i18n.test.ts` 5–6 | | 🚧 |
| CA-8 | `src/site/project-page.tsx`, `src/i18n/*`, `src/site/routes.ts` | `tests/site/pages.test.ts` 10–14; `tests/site/i18n.test.ts` 7–8 (longitud de 8.1) | | 🚧 |
| CA-9 | `src/app/globals.css`, `src/site/document.tsx` | `tests/site/pages.test.ts` 15, 17 | | 🚧 |
| CA-10 | `src/site/document.tsx`, `src/app/robots.txt/route.ts` (`force-static`) | `tests/site/pages.test.ts` 16, 18 | | 🚧 |
| CA-11 | `src/site/robots-txt.ts`, `src/app/robots.txt/route.ts` | `tests/site/robots.test.ts` 1–6 | | 🚧 |
| CA-12 | — | — (no es código: dictamen humano/consultivo) | | ❌ |
| CA-13 | `src/site/contact.ts` | `tests/site/contact.test.ts` 1–4 | | 🚧 |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-004/. Informe HTML opcional: _qa/SPEC-004/informe.html -->

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
