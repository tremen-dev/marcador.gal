---
id: ADR-004
tipo: adr
estado: aprobada
historial:
  - {estado: borrador, fecha: 2026-08-29, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-08-29, por: Alberto Fojo}
aprobada-por: Alberto Fojo
---
# ADR-004: Plataforma de despliegue — Vercel Pro

- Deciders: propone sdd-arquitecto. **Aprobado por Alberto Fojo el 2026-08-29.**
- Specs relacionadas: pendientes (EPIC-001).
- Relacionado: ADR-001 (stack), ADR-003 (SSE), ADR-005 (raw store).

## Contexto

La decisión original (un VPS pequeño) daba por hecho un proceso always-on. Al
poner Vercel sobre la mesa hay que decidir con los límites reales de la
plataforma, verificados en su documentación el 2026-08-29:

- **Vercel Cron:** Hobby permite **una ejecución al día**; expresiones más
  frecuentes fallan en el despliegue. Pro y Enterprise bajan a **1/minuto** con
  precisión por minuto.
- **Sistema de ficheros efímero:** solo `/tmp`, sin persistencia entre
  invocaciones. No hay raw store en disco (ADR-005).
- **Duración máxima de función:** Hobby 300 s; Pro 300 s por defecto, 800 s
  máximo, 1800 s en beta.
- **Facturación:** CPU activa + memoria provisionada. Esperar I/O no cuenta como
  CPU activa.
- **Plan Hobby:** restringido a **uso no comercial y personal** por las *fair use
  guidelines*. Pro cuesta **20 $ por usuario y mes**.

El análisis de coste comparado, para la misma carga:

| Opción | €/mes | Nota |
|---|---|---|
| Vercel Pro | ~18 € | Obligatorio: Hobby no puede ingerir (cron 1/día) |
| Hetzner CX22 | ~4,50 € | Todo en una máquina, precio estable al monetizar |
| Servidor propio (`infra-claude-server`) | 0 € | Enlace doméstico, sin SLA |

Vercel es la opción **más cara** para esta carga, y hay una razón estructural: el
trabajo es sondeo constante 24/7 más conexiones largas concentradas el sábado. Es
uso de recursos continuo y predecible — el mejor caso para tarifa plana y el peor
para facturación por invocación y por GB-hora. El serverless ahorra cuando el
tráfico es intermitente y casi siempre cero; aquí **nunca es cero**, porque el
planificador corre siempre.

## Decisión

**Vercel Pro**, asumiendo el sobrecoste (~13,50 €/mes frente a un VPS) a cambio de
cero operación: `git push` y desplegado, sin gestionar Postgres, TLS, systemd,
copias de seguridad ni despliegues.

Consecuencias operativas que la decisión arrastra:
- La ingesta va en **Vercel Cron a 1/minuto**, no en un scheduler en proceso.
  Coincide exactamente con el techo que impone RN-11 (máx. 1 petición/minuto por
  competición), así que no se pierde frecuencia real frente al plan original.
- El raw store va a object storage, no a disco (ADR-005).
- **No hay `LISTEN/NOTIFY`**: requiere conexión persistente desde un proceso vivo.
  El bus interno del diseño original desaparece.

## Consecuencias

### Positivas
- Servir el snapshot es donde Vercel es netamente mejor: CDN, cache de 10 s y
  autoescalado a 30.000 de concurrencia. **El pico del sábado deja de ser un
  problema de operación.**
- El webhook de Telegram encaja de forma natural: es un POST puntual.
- Un solo despliegue para frontend, API e ingesta (ADR-001).
- El tiempo de setup ahorrado es tiempo real, y el spike se mide en días.

### Negativas / follow-ups
- **Coste 4× el de un VPS equivalente**, en un proyecto cuya sostenibilidad es un
  no-negociable (D-7). Son ~216 €/año antes de tener un solo euro de patrocinio.
- **SSE se degrada** (ADR-003): las conexiones mueren al llegar al máximo de
  duración y reconectan, y cada conexión abierta paga memoria provisionada aunque
  no consuma CPU. Es el punto donde la plataforma es peor para este producto, y
  cae justo sobre su función principal.
- **Frecuencia mínima de 1/min**, frente a los 30–60 s del plan original.
- Sin `LISTEN/NOTIFY` hay que resolver el bus de otra forma cuando SSE entre en
  producción (sondeo de la BD, Redis/Upstash, o primitivas de Vercel). **ADR
  propio, no un cambio silencioso.**
- **Esta decisión debe reevaluarse con las métricas de EPIC-001 en la mano.** Si
  el coste de servir SSE a escala resulta desproporcionado, el reparto natural es
  servir en Vercel e ingerir en un worker always-on.

## Alternativas consideradas

- **Servidor propio (`infra-claude-server`), 0 €.** Ubuntu 24.04 con systemd,
  copias programadas y Tailscale, ya en marcha. Para EPIC-001 es suficiente: la
  ingesta solo hace peticiones salientes y el spike **no tiene público**.
  Rechazado por operación, no por capacidad. Límite real: enlace residencial sin
  SLA, inservible para servir un marcador público un sábado a las 18:00.
- **Hetzner CX22, ~4,50 €/mes.** Máquina limpia y desechable, IP fija, uptime
  real, y conserva APScheduler, `LISTEN/NOTIFY` y raw store en disco. Es la opción
  más barata con SLA y probablemente la forma de producción. Rechazada por coste
  de operación.
- **Cloudflare Workers.** Cron Triggers hasta 1/minuto, R2 sin coste de egreso y
  un plan de pago de 5 $/mes. Sensiblemente más barata que Vercel para esta forma
  de carga. **No evaluada a fondo**: sus límites de streaming y de duración no se
  verificaron. Queda como candidata para la reevaluación posterior a EPIC-001.
- **Vercel Hobby.** Descartado por dos motivos independientes y cada uno
  suficiente: cron limitado a 1/día, y prohibición de uso comercial que choca de
  frente con D-7.
