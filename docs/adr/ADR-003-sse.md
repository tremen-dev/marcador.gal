---
id: ADR-003
tipo: adr
estado: aprobada
historial:
  - {estado: borrador, fecha: 2026-08-29, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-08-29, por: Alberto Fojo}
aprobada-por: Alberto Fojo
---
# ADR-003: SSE en lugar de WebSocket para el tiempo real

- Deciders: propone sdd-arquitecto. **Aprobado por Alberto Fojo el 2026-08-29.**
- Specs relacionadas: ninguna en EPIC-001 — la implementación queda fuera del spike (ver abajo).
- Relacionado: ADR-004 (plataforma).

## Contexto

El flujo de datos hacia el cliente es estrictamente unidireccional: el servidor
publica Decisions, el cliente nunca escribe. La audiencia está en el móvil, en un
campo, un sábado por la tarde, con mala cobertura (principio de producto: móvil
primero con red mala), y la carga se concentra en pocas horas del fin de semana.

## Decisión

Snapshot JSON cacheable + stream de **Server-Sent Events** con `Last-Event-ID`,
y fallback a polling del snapshot cada 30 s con ETag.

**La implementación queda fuera de EPIC-001.** Ninguna de las cuatro métricas del
spike necesita transporte en tiempo real: todas salen de cruzar `Observation` y
`Decision` en la base de datos, y «publicado» se mide como «Decision escrita». La
página mínima del spike lee el snapshot por polling. El día que el plan original
dedicaba a SSE se reasigna a instrumentar las métricas, que es lo que decide el
proyecto. SSE entra con la épica de producto.

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
- **En Vercel (ADR-004) SSE se degrada justo donde importa.** La duración máxima de
  función es de 300 s en Hobby y hasta 800 s en Pro: toda conexión muere al llegar
  al tope y reconecta. `Last-Event-ID` lo cubre —el diseño ya lo preveía— pero un
  sábado con miles de clientes es una tormenta de reconexiones periódica. Y cada
  conexión abierta paga **memoria provisionada** aunque esperar I/O no cuente como
  CPU activa. Es el punto donde la plataforma elegida es peor para este producto.
- **El bus interno desaparece.** `LISTEN/NOTIFY` necesita conexión persistente desde
  un proceso vivo, que en serverless no existe. Cuando SSE entre en producción hay
  que resolverlo (sondeo de la BD, Redis/Upstash, o primitivas de Vercel): **ADR
  propio**.
- El pico previsto (miles de conexiones simultáneas) **no está medido**, y el spike
  no lo va a medir porque SSE queda fuera de su alcance.
- Este ADR fija el **protocolo**, no su coste. Si al instrumentar producción el
  gasto de SSE en Vercel resulta desproporcionado, lo que se revisa es ADR-004
  (plataforma), no esta decisión.

## Alternativas consideradas

- **WebSocket.** Rechazado: no aporta nada con un flujo unidireccional y complica
  CDN, proxies y reconexión en móviles.
- **Solo polling del snapshot.** Es el fallback, y **es lo que usa EPIC-001**. Como
  vía principal en producción no basta: a 30 s de intervalo, sumado a la latencia
  de ingesta, se come el presupuesto de los 120 s.
