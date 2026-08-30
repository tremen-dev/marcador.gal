---
id: EPIC-001
tipo: epica
estado: aprobada
aprobada-por: Alberto Fojo
historial:
  - {estado: borrador, fecha: 2026-08-29, por: sdd-producto}
  - {estado: aprobada, fecha: 2026-08-31, por: Alberto Fojo}
---
# EPIC-001 — Spike de ingesta

> Origen: §§1, 8 y 9 de `docs/fundacion/spike-ingesta-propuesta.md`.

## Objetivo

Responder **con números, no con opiniones**, a una pregunta: ¿podemos servir el
fútbol galego y el nacional en una pantalla, en tiempo casi real, con un esfuerzo
de operación asumible?

Esta épica es **medición, no producto**. Su entregable no es una aplicación: es
un informe con cuatro cifras y una lista de fallos observados. Lo que se
construye es el andamio mínimo para poder medir.

Por qué ahora: sin estas cuatro cifras no se puede decidir si el proyecto existe,
ni negociar con la RFGF, ni dimensionar el coste de operación que sostiene D-7.

## Criterios de éxito

La épica se cierra cuando las cuatro métricas están medidas sobre **dos jornadas
reales**, con verificación manual a cronómetro en 10 partidos.

| Métrica | Cómo se mide | Umbral aceptable |
|---|---|---|
| **Latencia** | Segundos entre el gol real (verificado a mano en 10 partidos) y el dato publicado | < 120 s en directo, < 10 min resultado final |
| **Cobertura** | % de partidos con al menos una fuente viva durante el juego | > 90 % |
| **Conflictos** | % de partidos con desacuerdo entre fuentes en algún momento | Informativo; **> 15 % obliga a rediseñar el motor** |
| **Operación** | Minutos de intervención manual por jornada | < 30 min |

Éxito de la épica ≠ umbrales cumplidos. **Medir honestamente y no cumplir también
es éxito**: la épica falla solo si termina sin cifras fiables.

## Alcance

**Dentro:**
- Dos competiciones: **Tercera RFEF grupo 1** (representa lo nacional) y
  **Preferente Futgal grupo 1** (representa lo galego).
- Modelo canónico (zod), raw store (RN-10, ADR-005) y planificación por Vercel
  Cron a 1/min con calendario cargado a mano.
- **Test de espejo el día 2** (ADR-002): una hora de observación para saber si
  ceroacero y resultados-futbol.com son independientes de futgal *antes* de
  construir el motor sobre esa hipótesis.
- Adaptadores de futgal.es, ceroacero.es y resultados-futbol.com; bot de Telegram
  con parseo LLM y confirmación humana (ADR-002).
- Catálogo de alias de los 36 equipos, confirmado por una persona (RN-09).
- Motor de decisiones con RN-01..RN-07 y tests de replay sobre HTML guardado.
- Snapshot y **una página HTML sin diseño** que lo lee **por polling**: tabla de
  partidos, marcador, estado, hora del último dato y color para provisional /
  confirmado / *sen sinal*.
- **Instrumentación de las cuatro métricas.** Es el entregable, no un extra: sin
  ella la épica no produce nada.
- Panel mínimo de alertas y correcciones, usable desde el móvil.
- Exploración del tráfico de la app de la RFGF (proxy local), **solo** para
  conocer datos y latencia.

**Fuera (aparcado a propósito, no por descuido):**
- **La implementación de SSE** (ADR-003). La decisión del protocolo está tomada,
  pero ninguna de las cuatro métricas la necesita: todas salen de cruzar
  `Observation` y `Decision`, y «publicado» se mide como «Decision escrita». El
  día que el plan original le dedicaba se reasigna a instrumentar las métricas.
- Interfaz definitiva, identidad visual, landing.
- Usuarios, cuentas, notificaciones push.
- Más competiciones (Primeira/Segunda Galega, femenino, Primera, Segunda).
- Proveedor de pago (API-Football, BeSoccer API) y X API.
- Patrocinio, dominio, logo.

## Specs

<!-- El estado por spec vive en el frontmatter de cada spec; el tablero agregado se regenera con /sdd-tablero (docs/tablero.md). No mantengas listas de specs a mano aquí. -->

Sin specs todavía. Descomposición prevista, a redactar por `/sdd-arquitecto`:
modelo canónico (zod) + raw store · cron de planificación y calendario ·
**test de espejo (día 2)** · adaptador futgal · adaptador ceroacero · adaptador
resultados-futbol.com · bot de Telegram · motor de decisiones · snapshot + página
mínima por polling · panel de alertas · instrumentación de las cuatro métricas.

Las specs no pueden empezar hasta que ADR-001 (stack) y ADR-004 (plataforma) estén
firmados: ambos determinan la forma de casi todas ellas.

## Riesgos

- **Bloqueo o cambio de una fuente a mitad de jornada.** Mitigación: dos fuentes
  por competición desde el día 1 y raw store para reprocesar (RN-10).
- **La app de la RFGF no expone nada usable.** Entonces futgal.es es la única
  oficial y la latencia será la que sea; el dato va al informe y a la conversación
  con la federación.
- **Todas las fuentes automáticas resultan espejos de futgal.** RN-02 deja de ser
  aplicable y casi todo se publica provisional. Es un hallazgo, no un fallo, pero
  cambia el diseño del motor — y por eso se comprueba el día 2, no el lunes final.
- **Los límites de Vercel muerden más de lo previsto** (ADR-004): frecuencia mínima
  de 1/min en vez de 30–60 s, y sin proceso vivo hay que escribir a mano la lógica
  de ventanas por partido que APScheduler daba hecha.
- **Horarios cambiados y aplazamientos.** Refresco de calendario cada 6 h;
  `postponed` solo por fuente oficial (RN-06).
- **El humano no está.** El corresponsal en el spike es el autor. Medir los
  minutos honestamente, porque esa cifra decide si el proyecto escala sin
  comunidad de corresponsales.
- **Plazo.** El plan original es de una semana (§8 del documento fuente) con
  jornada real en fin de semana. Es agresivo; el riesgo se acepta porque el
  entregable es medición, no código de producción.

## Lo que queda para producción

El modelo canónico, el raw store, la interfaz de adaptadores y el motor con
reglas trazables **no se tiran**. Lo que cambia en producción es la lista de
fuentes (acuerdo con RFGF, proveedor nacional de pago, corresponsales reales) y
la interfaz.
