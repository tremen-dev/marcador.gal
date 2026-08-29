---
id: ADR-001
tipo: adr
estado: aprobada
historial:
  - {estado: borrador, fecha: 2026-08-29, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-08-29, por: Alberto Fojo}
aprobada-por: Alberto Fojo
---
# ADR-001: Stack — Node/TypeScript

- Deciders: propone sdd-arquitecto. **Aprobado por Alberto Fojo el 2026-08-29.**
- Specs relacionadas: pendientes (EPIC-001).
- Relacionado: ADR-004 (plataforma), ADR-005 (raw store).

> Reescrito el 2026-08-29. La versión anterior elegía Python 3.12 + FastAPI. Como
> nunca pasó del estado `borrador`, se reescribe en lugar de supersederse.

## Contexto

Tres hechos aparecieron después de la redacción original y cambian la decisión:

1. **La plataforma es Vercel** (ADR-004). Eso elimina el proceso always-on que
   justificaba APScheduler y `LISTEN/NOTIFY`, y convierte el despliegue en el
   criterio dominante.
2. **El frontend es la mitad del producto.** Un tablero denso en tiempo real
   consume un contrato — el snapshot y el evento SSE
   `{match_id, status, score, provisional, version}` — que cambia cada vez que
   cambia el motor de decisiones. Mantenerlo a mano en dos lenguajes es una
   fuente permanente de desincronización silenciosa.
3. **El autor trabaja mayoritariamente en Node.** De los repos de tremen.dev,
   siete son Node y dos Python. En un spike de una semana la fluidez del autor
   pesa más que cualquier diferencia de biblioteca.

Y el argumento de la versión original —«Python gana por selectolax»— no se
sostiene: a 1 petición por minuto y competición (RN-11) el rendimiento del parser
es irrelevante, y `cheerio` cubre el mismo trabajo.

## Decisión

**Node 22 LTS con TypeScript en modo estricto.**

- **Framework:** Next.js (App Router). Un único proyecto y un único despliegue
  contienen frontend, rutas de API (snapshot y stream) y las funciones de cron de
  ingesta.
- **HTTP saliente:** `fetch` nativo (undici), con ETag / If-Modified-Since donde
  la fuente lo soporte.
- **Parsing HTML:** `cheerio`.
- **Modelo y validación:** `zod`. Un único esquema define el modelo canónico,
  valida la salida JSON del LLM (RN-09) y **exporta el tipo TypeScript que el
  frontend importa**. Ese es el punto entero de la decisión.
- **Postgres:** driver serverless con pooling (a confirmar en la spec: Neon
  serverless driver frente a `postgres.js` con pooler).
- **Telegram:** `grammY` en modo webhook, que encaja de forma natural con
  funciones sin estado.
- **Planificación:** Vercel Cron (ADR-004). **No hay scheduler en proceso.**
- **Tests:** `vitest`, con replay de jornadas sobre HTML guardado.

## Consecuencias

### Positivas
- Un solo lenguaje de la ingesta a la pantalla, y un solo tipo para el contrato
  snapshot/SSE. No hay codegen que mantener ni que se pueda pudrir.
- Un solo despliegue en vez de dos servicios.
- El autor va a máxima velocidad, que es la variable crítica de un spike de una
  semana.

### Negativas / follow-ups
- **`pyproject.toml` queda obsoleto** y hay que sustituirlo por `package.json`.
- Se pierde `pydantic` frente a `zod` en validación de datos anidados complejos.
  Aceptable: el modelo canónico es plano.
- Se pierde APScheduler. La lógica de ventanas por partido (30–60 s en juego,
  5 min en la hora previa, 30 min las 3 h posteriores) hay que escribirla a mano
  **dentro** de un cron de 1/min que decide en cada tick qué toca sondear. Es más
  código, y la spec del scheduler tiene que hacerse cargo de ello.
- Se pierde `pytest`, que es mejor que `vitest` para el replay parametrizado.
  Diferencia menor.

## Alternativas consideradas

- **Python 3.12 + FastAPI** (la decisión original). Sigue siendo perfectamente
  viable: en Vercel es preset oficial con detección automática, streaming activado
  por defecto, Python 3.12/3.13/3.14 y `uv` sin configuración. **No se rechaza por
  penalización de plataforma** —esa suposición era falsa— sino por el contrato
  compartido con el frontend y por la fluidez del autor. `pydantic` es superior a
  `zod`, y APScheduler y `pytest` también; no basta.
- **Go.** Mejor para un ingestor de larga vida y consumo bajo. Rechazado: no encaja
  con Vercel, no comparte tipos con el frontend, y el autor no lo usa en ningún
  repo.
- **Bun.** Más rápido y con runtime soportado en Vercel. Rechazado para el spike:
  no aporta nada que decida ninguna de las cuatro métricas y añade riesgo de
  ecosistema en una semana.
