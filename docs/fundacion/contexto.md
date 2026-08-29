# Contexto maestro — marcador.gal

> Documento vivo: TODO lo que un agente (o una persona) necesita para situarse.
> Se actualiza al cambiar el rumbo; la historia fina vive en ADRs y specs.
> Última actualización: 2026-08-29 (adopción de tremen-sdd).

## Qué es y en qué punto está

Marcador de resultados del fútbol galego (Preferente, Primeira e Segunda Galega,
femenino) y de las divisiones nacionales, en directo, en una sola pantalla y en
galego. Relevo con nombre e imagen propios de la desaparecida marcadorgalego.gal
— **inspiración, no sucesión** (D-1).

**Punto actual: cero líneas de código.** El repositorio contiene documentación
fundacional, tres ADRs en borrador y el esqueleto de `pyproject.toml`. No existe
`src/`. El trabajo inmediato es **EPIC-001 — Spike de ingesta**: una semana de
medición sobre Tercera RFEF G1 + Preferente Futgal G1 para responder con números
si el proyecto es viable. Ver `docs/roadmap.md`.

El nombre **marcador.gal** está decidido; **el dominio aún no está contratado**.

## Stack y arquitectura (resumen as-built)

**As-built: nada.** Lo siguiente es lo *propuesto*, y vive en ADRs en borrador
que aún no han pasado el gate humano:

- Node 22 · TypeScript · Next.js (App Router) · cheerio · zod · grammY · Postgres ·
  vitest (ADR-001).
- Desplegado en **Vercel Pro** (ADR-004). Sin scheduler en proceso (Vercel Cron a
  1/min), sin disco persistente, sin `LISTEN/NOTIFY`.
- Cuatro fuentes en el spike: futgal.es (oficial), ceroacero y
  resultados-futbol.com (contraste), bot de Telegram (corresponsal) (ADR-002).
  Test de espejo el día 2 para saber si son independientes antes de construir el
  motor.
- Raw store como puerto: Vercel Blob en producción, disco en local y tests
  (ADR-005).
- Tiempo real: snapshot cacheable + SSE con `Last-Event-ID` (ADR-003). **Su
  implementación queda fuera de EPIC-001**: la página del spike lee el snapshot
  por polling.

Estructura de código prevista (aún sin crear):
`src/ingest/` adaptadores + cron · `src/decide/` modelo canónico (zod) + motor ·
`src/api/` snapshot · `src/admin/` panel móvil de correcciones y alertas ·
`tests/` replay de jornadas sobre HTML guardado · `raw/` respuestas crudas en local.

El corazón del diseño está en `docs/fundacion/reglas.md` (RN-01..RN-13) y
`docs/fundacion/dominio.md` (Observation / Decision). Eso es lo que no se tira
cuando cambie la lista de fuentes o la interfaz.

## Decisiones clave hasta hoy

- `FOUNDATION.md` — D-1 a D-7, locked.
- [ADR-001](../adr/ADR-001-stack.md) — Stack del spike · **borrador**
- [ADR-002](../adr/ADR-002-fuentes-spike.md) — Fuentes del spike · **borrador**
- [ADR-003](../adr/ADR-003-sse.md) — SSE en lugar de WebSocket · **borrador**
- [ADR-004](../adr/ADR-004-plataforma.md) — Plataforma: Vercel Pro · **borrador**
- [ADR-005](../adr/ADR-005-raw-store.md) — Raw store: puerto Blob + disco · **borrador**

Los tres primeros se escribieron **antes** de adoptar tremen-sdd y se reabrieron a
propósito al migrar (2026-08-29). ADR-001 se reescribió por completo —de Python a
Node— al entrar Vercel en la ecuación. **Ninguno de los cinco está firmado**, y
ninguno pasa a `aprobada` sin gate humano explícito.

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
- **Dominio y marca sin contratar:** `marcador.gal` decidido, no registrado.
  Riesgo abierto hasta que se contrate.
