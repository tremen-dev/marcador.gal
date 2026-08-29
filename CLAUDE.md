# CLAUDE.md — Marcador (nombre pendiente)

Marcador de resultados del fútbol galego y de las divisiones nacionales en una sola pantalla. Relevo, con nombre e imagen propios, de la desaparecida marcadorgalego.gal. Este documento orienta a Claude Code en este repositorio.

## Estado actual
Fase: **spike de ingesta** (una semana). Objetivo: medir latencia, cobertura, conflictos y minutos de operación manual con Tercera RFEF G1 + Preferente Futgal G1. Ver `docs/05-spike-ingesta.md`.

## Disciplina
- Nada se construye sin una spec aprobada en `specs/` con `status: approved`. Las specs `draft` o `proposed` se discuten, no se implementan.
- Toda decisión de arquitectura queda en `decisions/ADR-NNN-*.md`. Si vas a tomar una, escribe el ADR primero.
- Roles del pipeline SDD del autor: Visionario, Arquitecto, Implementador, Verificador, Frontend, Legal, Fiscal. Cuando actúes, di desde qué rol lo haces.
- El Verificador comprueba contra la spec, no contra la intención.

## Lenguas
- Documentación, specs, ADRs y commits: **galego**.
- Código, identificadores y comentarios: **inglés**.
- Todo texto visible al usuario (UI, bot, notificaciones): **galego** por defecto, con castellano como opción. Los literales van en ficheros de i18n desde el primer día; nunca hardcodeados.
- Nombres de equipos y competiciones: los canónicos de la RFGF.

## Stack (ADR-001)
Python 3.12 · FastAPI · httpx · APScheduler · selectolax · python-telegram-bot · pydantic · Postgres. Sin colas, sin Kubernetes, sin Redis hasta que un ADR lo justifique.

## Estructura
```
src/ingest/   adaptadores por fuente + scheduler
src/decide/   modelo canónico + motor de decisiones
src/api/      snapshot + stream SSE
src/admin/    panel mínimo de correcciones y alertas (móvil)
tests/        replay de jornadas sobre HTML guardado
raw/          respuestas crudas de fuentes (no versionar contenido)
docs/         documentos fundacionales
specs/        especificaciones
decisions/    ADRs
```

## Reglas duras
- Ninguna fuente publica un marcador sin pasar por el motor de decisiones (`SPEC-002`).
- Un LLM nunca es la única fuente de un marcador. Sirve para alias de equipos y para parsear mensajes de corresponsal, siempre con salida JSON validada y confirmación humana.
- Scraping: respetar robots.txt, user-agent identificado, máximo 1 petición/minuto por competición. Es medición, no producción.
- Toda respuesta cruda se guarda en `raw/` antes de parsearse.
- Cada Decision registra la regla aplicada y las observaciones que la sostienen.

## Principios de marca (para Frontend y cualquier texto)
- Fútbol en galego, urbano o no. Nada de tópicos rurales en imagen ni tono. La Preferente se juega en Vigo, A Coruña, Ourense y Ferrol igual que en cualquier vila.
- El producto es densidad: todo en una pantalla, números tabulares, legible con mala cobertura.
- No presentarse como continuación de Marcador Galego; inspiración, no sucesión.

## Lo que NO está en alcance del spike
Interfaz definitiva, usuarios, notificaciones push, más competiciones, patrocinio, nombre y logo.
