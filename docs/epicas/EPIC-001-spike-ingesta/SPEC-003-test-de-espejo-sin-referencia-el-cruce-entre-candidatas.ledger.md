---
id: SPEC-003
tipo: ledger
epica: EPIC-001
---
# Ledger — SPEC-003 Test de espejo sin referencia: el cruce entre candidatas

## Resumen
- Fase: **borrador**. Spec escrita por `sdd-arquitecto` el 2026-08-31 y **sin
  firmar**: el estado `aprobada` lo firma una persona. Nada implementado.
  **Bloqueante previo a implementar:** ADR-008 §5 (capturar `besoccer.es`). Sin
  esa firma no hay par que cruzar y esta spec no tiene nada que medir.
- Rama: `ft/SPEC-002-test-sin-referencia` (sacada de
  `ft/SPEC-002-test-de-espejo-entre-fuentes-automaticas`, cuyo PR #2 está abierto,
  verificado GREEN y esperando merge humano; por eso el trabajo no va allí)

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 modo declarado y no inferible | | | | ❌ |
| CA-2 veredictos por candidata: no medidos | | | | ❌ |
| CA-3 origen comun probado vs atribuido | | | | ❌ |
| CA-4 INDEPENDIENTE no es emitible | | | | ❌ |
| CA-5 (RN-02) la bandera es false siempre | | | | ❌ |
| CA-6 regla de decision del modo | | | | ❌ |
| CA-7 adelanto en una sola direccion no nombra espejo | | | | ❌ |
| CA-8 pares declarados; cero intentos = 0 % | | | | ❌ |
| CA-9 la negativa de CA-5 sobre los pares declarados | | | | ❌ |
| CA-10 (RN-11) ninguna peticion cambia de host en silencio | | | | ❌ |
| CA-11 limitaciones declaradas, en JSON y en prosa | | | | ❌ |
| CA-12 advertencia de conflictos incondicional | | | | ❌ |
| CA-13 fichero de hallazgo propio | | | | ❌ |
| CA-14 lo heredado se hereda, y se prueba | | | | ❌ |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-003/. Informe HTML opcional: _qa/SPEC-003/informe.html -->

## Salvedades / follow-ups
<!-- IDs F-SPEC-003-1, F-SPEC-003-2… con destino (spec futura o EPIC-MEJORA). -->

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->
