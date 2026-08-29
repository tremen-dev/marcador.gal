# ADR-001 — Stack del spike

Estado: aceptada · Fecha: 2026-08-29

## Decisión
Python 3.12 con FastAPI, httpx, APScheduler, selectolax, python-telegram-bot, pydantic y Postgres. Un solo VPS. Sin colas, sin Kubernetes, sin Redis.

## Motivo
El spike es medición: prima velocidad de construcción y ecosistema de parsing. Node/TypeScript sería igual de válido; Python gana por selectolax/BeautifulSoup y por la rapidez con FastAPI + SSE.

## Consecuencias
Si en producción hay varios procesos de API, LISTEN/NOTIFY se sustituye por Redis pub/sub (nuevo ADR).
