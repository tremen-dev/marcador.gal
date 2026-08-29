---
id: ADR-001
tipo: adr
estado: borrador
historial:
  - {estado: borrador, fecha: 2026-08-29, por: sdd-arquitecto}
---
# ADR-001: Stack del spike de ingesta

- Deciders: propone sdd-arquitecto; aprueba el humano. **Sin aprobar todavía**: redactado antes de adoptar tremen-sdd y reabierto a propósito al migrar (2026-08-29).
- Specs relacionadas: pendientes (EPIC-001).

## Contexto

El spike de ingesta (EPIC-001) es una medición de una semana, no un producto:
hay que construir adaptadores HTTP, un parser de HTML, un scheduler, un motor de
decisiones y un stream en tiempo real, y tenerlo en pie antes de la primera
jornada real. Lo que prima es velocidad de construcción y madurez del ecosistema
de parsing, no rendimiento ni escalabilidad.

Ninguna fuente del spike expone streams: todo lo "en directo" es polling de
terceros (ADR-002), así que el cuello de botella es la ingesta, no servir.

## Decisión

Python 3.12 con FastAPI, httpx, APScheduler, selectolax, python-telegram-bot,
pydantic y Postgres. Un solo VPS. Sin colas, sin Kubernetes, sin Redis.

## Consecuencias

### Positivas
- selectolax y el ecosistema de parsing de Python cubren el trabajo real del spike.
- FastAPI da API y SSE (ADR-003) sin infraestructura extra.
- pydantic sirve tanto para el modelo canónico como para validar la salida JSON del LLM.

### Negativas / follow-ups
- El bus interno se apoya en `LISTEN/NOTIFY` de Postgres. Si en producción hay
  varios procesos de API, hay que sustituirlo por Redis pub/sub — **decisión de
  otro ADR**, no un cambio silencioso de este.
- Nada de lo elegido está validado bajo la carga de un sábado por la tarde: el
  spike no la mide.

## Alternativas consideradas

- **Node/TypeScript.** Igual de válido y con mejor historia de tipos compartidos
  entre backend y frontend. Rechazado por el ecosistema de parsing y por la
  rapidez de FastAPI + SSE en el plazo de una semana. Si el spike se alarga o el
  frontend crece, la comparación vuelve a estar abierta.
- **Colas / Kubernetes / Redis desde el día uno.** Rechazado: complejidad
  operativa que el spike no necesita y que enmascararía la métrica que importa
  (minutos de operación manual por jornada).
