# Contexto maestro — marcador.gal

> Documento vivo: TODO lo que un agente (o una persona) necesita para situarse.
> Se actualiza al cambiar el rumbo; la historia fina vive en ADRs y specs.
> Última actualización: 2026-08-31 (contrato de dominio verificado).

## Qué es y en qué punto está

Marcador de resultados del fútbol galego (Preferente, Primeira e Segunda Galega,
femenino) y de las divisiones nacionales, en directo, en una sola pantalla y en
galego. Relevo con nombre e imagen propios de la desaparecida marcadorgalego.gal
— **inspiración, no sucesión** (D-1).

**Punto actual: cero líneas de código.** El repositorio contiene documentación
fundacional, tres ADRs en borrador y el esqueleto de `pyproject.toml`. No existe
`src/`. El trabajo inmediato es **EPIC-001 — Spike de ingesta**: una semana de
medición sobre Terceira RFEF G1 + Preferente Futgal G1 para responder con números
si el proyecto es viable. Ver `docs/roadmap.md`.

El nombre y dominio **marcador.gal** están decididos y contratados (2026-08-31, Dinahosting; expira 2027-08-31).

## Stack y arquitectura (as-built, 2026-08-31)

SPEC-004 está `hecho` (verificada GREEN). Sitio público en `marcador.gal` con soporte i18n galego/castellano.

**Infraestructura y despliegue:**
- Node 22 · TypeScript · Next.js (App Router) · cheerio · zod · grammY · Postgres · vitest (ADR-001).
- Desplegado en **Vercel Pro** (ADR-004). Sin scheduler en proceso (Vercel Cron a 1/min), sin disco persistente, sin `LISTEN/NOTIFY`.
- Raw store como puerto: Vercel Blob en producción, disco en local y tests (ADR-005).
- Tiempo real: snapshot cacheable + SSE con `Last-Event-ID` (ADR-003). **Su implementación queda fuera de EPIC-001**: la página del spike lee el snapshot por polling.

**Fuentes y medición (propuesto, no verificado):**
- Cuatro fuentes en el spike: futgal.es (oficial, no capturable hoy: ADR-008), ceroacero y resultados-futbol.com (contraste), bot de Telegram (corresponsal) (ADR-002).
- Test de espejo el día 2 para saber si son independientes antes de construir el motor.

**Sitio público (EPIC-003, SPEC-004):**
- Rutas en galego/castellano (`src/app/(gl)/`, `src/app/(es)/`): `/proxecto` y `/robot` (respaldo de la carta a la RFGF).
- Componentes reutilizables en `src/site/`; bundles i18n galego/castellano en `src/i18n/` con paridad de claves (D-2, CA-4).
- Sin JavaScript en el cliente, sin fuentes remotas, sin analítica, cero cookies (CA-9, CA-10). Legible con mala cobertura.
- Mecanismo de i18n escrito a mano: Next.js App Router con route groups por idioma (ADR-010 — despliegue compartido con el futuro producto).
- Dominio `marcador.gal` registrado en Dinahosting, expira 2027-08-31; DNS sin apuntar a Vercel todavía (CA-1, acción humana).
- `robots.txt` propio (generado dinámicamente, SPEC-004 CA-11); se respeta el de terceros (RN-11).

**Motor de decisiones (propuesto):**
Estructura de código prevista: `src/ingest/` adaptadores + cron · `src/decide/` modelo canónico (zod) + motor · `src/api/` snapshot · `src/admin/` panel móvil de correcciones y alertas.

El corazón del diseño vive en `docs/fundacion/reglas.md` (RN-01..RN-13) y `docs/fundacion/dominio.md` (Observation / Decision). **SPEC-005** (alineamiento de user-agent y página del rastreador, `aprobada` 2026-08-31) va después de SPEC-004 porque consume la constante única del buzón que SPEC-004 crea (SPEC-004 CA-13) y solo añade claves a los bundles de i18n que SPEC-004 estableció.

## Decisiones clave hasta hoy

- `FOUNDATION.md` — D-1 a D-7, locked.
- [ADR-001](../adr/ADR-001-stack.md) — Stack del spike · **aprobada**
- [ADR-002](../adr/ADR-002-fuentes-spike.md) — Fuentes del spike · **aprobada**
- [ADR-003](../adr/ADR-003-sse.md) — SSE en lugar de WebSocket · **aprobada**
- [ADR-004](../adr/ADR-004-plataforma.md) — Plataforma: Vercel Pro · **aprobada**
- [ADR-005](../adr/ADR-005-raw-store.md) — Raw store: puerto Blob + disco · **aprobada**

Los tres primeros se escribieron **antes** de adoptar tremen-sdd y se reabrieron a
propósito al migrar (2026-08-29). ADR-001 se reescribió por completo —de Python a
Node— al entrar Vercel en la ecuación. **Los cinco quedaron firmados por Alberto
Fojo el 2026-08-29** y son ya inmutables: cambiarlos exige un ADR que los
supersede.

## Riesgos y preguntas abiertas

Detalle completo en `retos.md`. Los que condicionan el trabajo inmediato:

- **¿Son ceroacero y resultados-futbol.com independientes de futgal, o espejos?**
  Si todas son espejos, RN-02 no es aplicable y casi todo se publica provisional.
  Es la pregunta técnica más importante de EPIC-001, y por eso se responde el
  **día 2** con el test de espejo, no en el informe final (ADR-002).
- **¿Expone algo usable el backend de la app de la RFGF?** Si no, futgal.es es la
  única fuente oficial y la latencia será la que sea.
- **¿Cuántos minutos de operación manual cuesta una jornada?** Es la cifra que
  dice si el proyecto escala sin una comunidad de corresponsales. Medirla
  honestamente es responsabilidad del autor, que en el spike es el corresponsal.
- **Legal:** los resultados son hechos sin copyright, pero la extracción
  sistemática de bases de datos está protegida en la UE (derecho *sui generis*) y
  las ToS de los agregadores prohíben scraping. **El riesgo está en cómo se
  obtiene el dato, no en el dato.** Escudos de clubes: marcas registradas, hace
  falta política de uso.
- **Coste de plataforma:** Vercel Pro son ~216 €/año antes del primer euro de
  patrocinio, y es ~4× un VPS equivalente para esta carga (ADR-004). La decisión
  se reevalúa con las métricas de EPIC-001 en la mano; Cloudflare Workers quedó
  sin evaluar a fondo y es candidata.
- **Sostenibilidad:** el proyecto debe pagarse (D-7). Ver
  `docs/negocio/monetizacion.md`. La ayuda PR858A no es realista antes de enero
  de 2028 y exige empresa constituida.
- **Marca y presencia digital aún por asegurar:** Dominio contratado (2026-08-31, Dinahosting), pero quedan pendientes los handles en redes sociales y la comprobación en OEPM de que no hay registro previo de la marca. Esta última es previa a invertir en identidad visual.
