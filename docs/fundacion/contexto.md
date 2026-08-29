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

- Python 3.12 · FastAPI · httpx · APScheduler · selectolax · python-telegram-bot ·
  pydantic · Postgres. Un VPS. Sin colas, sin Kubernetes, sin Redis (ADR-001).
- Tres fuentes en el spike: futgal.es (oficial), ceroacero (contraste), bot de
  Telegram (corresponsal) (ADR-002).
- Tiempo real: snapshot JSON cacheable + SSE con `Last-Event-ID`, fallback a
  polling cada 30 s (ADR-003).

Estructura de código prevista (aún sin crear):
`src/ingest/` adaptadores + scheduler · `src/decide/` modelo canónico + motor ·
`src/api/` snapshot + stream · `src/admin/` panel móvil de correcciones y alertas ·
`tests/` replay de jornadas sobre HTML guardado · `raw/` respuestas crudas (no versionadas).

El corazón del diseño está en `docs/fundacion/reglas.md` (RN-01..RN-13) y
`docs/fundacion/dominio.md` (Observation / Decision). Eso es lo que no se tira
cuando cambie la lista de fuentes o la interfaz.

## Decisiones clave hasta hoy

- `FOUNDATION.md` — D-1 a D-7, locked.
- [ADR-001](../adr/ADR-001-stack.md) — Stack del spike · **borrador**
- [ADR-002](../adr/ADR-002-fuentes-spike.md) — Fuentes del spike · **borrador**
- [ADR-003](../adr/ADR-003-sse.md) — SSE en lugar de WebSocket · **borrador**

Los tres se escribieron **antes** de adoptar tremen-sdd y se reabrieron a
propósito al migrar (2026-08-29): son aproximaciones razonadas, no decisiones
firmadas. Ninguno pasa a `aprobada` sin gate humano explícito.

## Riesgos y preguntas abiertas

Detalle completo en `retos.md`. Los que condicionan el trabajo inmediato:

- **¿Es ceroacero fuente independiente o espejo de futgal?** Si es espejo, RN-02
  no es aplicable en el spike y casi todo se publica provisional. Es la pregunta
  técnica más importante de EPIC-001.
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
- **Sostenibilidad:** el proyecto debe pagarse (D-7). Ver
  `docs/negocio/monetizacion.md`. La ayuda PR858A no es realista antes de enero
  de 2028 y exige empresa constituida.
- **Dominio y marca sin contratar:** `marcador.gal` decidido, no registrado.
  Riesgo abierto hasta que se contrate.
