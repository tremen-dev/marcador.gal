---
id: SPEC-005
tipo: ledger
epica: EPIC-003
---
# Ledger — SPEC-005 Página del rastreador y alineamiento del user-agent declarado

## Resumen
- Fase: **borrador**. Escrita por `sdd-arquitecto` el 2026-08-31. Espera gate
  humano. **No empieza antes que SPEC-004**: si se implementa primero, el
  user-agent apuntaría a un 404 en cada petición — el defecto exacto que
  F-SPEC-002-1 evitó.
- **Único fichero de producción que toca la épica**: `src/mirror/user-agent.ts`.
  CA-10 lo comprueba con `git diff --stat`.
- **CA-12 bloquea el cierre por partida doble**: dictamen de `/sdd-lingua`
  sobre el texto, y de `/sdd-legal-datos` sobre las tres afirmaciones
  jurídicas (robots.txt, no republicación, retención).
- Rama: `ft/SPEC-005-pagina-del-rastreador-y-alineamiento-del-user-agent-declarado`
- **CA-13 cierra la pregunta que estaba abierta**: `/robot` NO cita a futgal
  ni a ninguna otra fuente (Alberto Fojo, 2026-08-31). El caso concreto se
  queda en la carta. El test se aplica al HTML de `/robot`, no al bundle
  entero: `/proxecto` si nombra las competiciones (SPEC-004 CA-8.2).
- **El riesgo residual de ADR-011 esta ACEPTADO** por Alberto Fojo el
  2026-08-31, con CA-5 como unica compensacion.

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 | | | | ❌ |
| CA-2 | | | | ❌ |
| CA-3 | | | | ❌ |
| CA-4 | | | | ❌ |
| CA-5 | | | | ❌ |
| CA-6 | | | | ❌ |
| CA-7 | | | | ❌ |
| CA-8 | | | | ❌ |
| CA-9 | | | | ❌ |
| CA-10 | | | | ❌ |
| CA-11 | | | | ❌ |
| CA-12 | | | | ❌ |
| CA-13 | | | | ❌ |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-005/. Informe HTML opcional: _qa/SPEC-005/informe.html -->

## Salvedades / follow-ups
<!-- IDs F-SPEC-005-1, F-SPEC-005-2… con destino (spec futura o EPIC-MEJORA). -->

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->
