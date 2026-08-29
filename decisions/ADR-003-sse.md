# ADR-003 — SSE en lugar de WebSocket para el tiempo real

Estado: aceptada · Fecha: 2026-08-29

## Decisión
Snapshot JSON cacheable + stream Server-Sent Events con `Last-Event-ID`, fallback a polling cada 30 s.

## Motivo
Flujo unidireccional servidor → cliente. SSE reconecta solo, atraviesa proxies y HTTP/2 sin fricción y no requiere infraestructura adicional. WebSocket no aporta nada y complica CDN y móviles.

## Consecuencias
Un proceso asíncrono aguanta el pico previsto. Si hace falta más, se escala horizontalmente con Redis pub/sub (ver ADR-001).
