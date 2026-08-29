---
id: ADR-003
tipo: adr
estado: borrador
historial:
  - {estado: borrador, fecha: 2026-08-29, por: sdd-arquitecto}
---
# ADR-003: SSE en lugar de WebSocket para el tiempo real

- Deciders: propone sdd-arquitecto; aprueba el humano. **Sin aprobar todavía**: redactado antes de adoptar tremen-sdd y reabierto a propósito al migrar (2026-08-29).
- Specs relacionadas: pendientes (EPIC-001).

## Contexto

El flujo de datos hacia el cliente es estrictamente unidireccional: el servidor
publica Decisions, el cliente nunca escribe. La audiencia está en el móvil, en un
campo, un sábado por la tarde, con mala cobertura (principio de producto: móvil
primero con red mala), y la carga se concentra en pocas horas del fin de semana.

## Decisión

Snapshot JSON cacheable + stream de **Server-Sent Events** con `Last-Event-ID`,
y fallback a polling del snapshot cada 30 s con ETag.

- `GET /api/board?competitions=…` → estado completo con `version` global, cacheable en CDN 10 s.
- `GET /api/stream` → un evento por Decision nueva `{match_id, status, score, provisional, version}`.
- Al reconectar, el cliente manda `Last-Event-ID` y recibe lo que se perdió; si la
  distancia es grande, pide un snapshot nuevo.

## Consecuencias

### Positivas
- SSE reconecta solo y atraviesa proxies y HTTP/2 sin fricción.
- Cero infraestructura adicional respecto a lo ya elegido en ADR-001.
- El fallback a polling garantiza que ninguna pantalla se queda congelada, que es
  el escenario real en un campo con mala cobertura.

### Negativas / follow-ups
- Un solo proceso asíncrono debería aguantar el pico previsto (unos miles de
  conexiones simultáneas). **No está medido**: el spike no genera esa carga.
- Escalar a varios procesos de API obliga a sustituir `LISTEN/NOTIFY` por Redis
  pub/sub (ver ADR-001), en un ADR propio.

## Alternativas consideradas

- **WebSocket.** Rechazado: no aporta nada con un flujo unidireccional y complica
  CDN, proxies y reconexión en móviles.
- **Solo polling del snapshot.** Es el fallback, no la vía principal: a 30 s de
  intervalo no se cumple el umbral de latencia del spike (< 120 s en directo)
  cuando se suma a la latencia de ingesta.
