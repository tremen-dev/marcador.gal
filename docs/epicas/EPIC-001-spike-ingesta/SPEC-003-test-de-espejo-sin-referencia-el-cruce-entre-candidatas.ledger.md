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
- **2026-08-31, antes del gate: entra CA-15** (`sdd-arquitecto`). ADR-009 quedó
  **aprobado** ese mismo día con la opción B —30 días desde el fin de la ventana,
  una prórroga escrita, techo duro de 90— y su §5 dejaba pendiente «un CA que meta
  la fecha de purga en el informe», con destino SPEC-003 mientras siguiera en
  `borrador`. El gate lo pidió y entra. **Se añade CA-15 y nada más**: los CA-1 a
  CA-14 no se tocan y **no se renumera nada**. Coherencia arrastrada, sin cambiar
  ningún criterio: *Entidades* (ADR-005 deja de decir «retención sin definir» y se
  añade ADR-009), *Fuera de alcance* (el plazo está decidido; lo que entra es solo
  su declaración en el informe), notas del gate **§7** (los dos pasos de runbook de
  ADR-009 §4) y **§8.4** (qué queda por firmar). **La spec sigue en `borrador`.**
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
| CA-15 (ADR-009) el informe declara su fecha de purga | | | | ❌ |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-003/. Informe HTML opcional: _qa/SPEC-003/informe.html -->

## Salvedades / follow-ups
<!-- IDs F-SPEC-003-1, F-SPEC-003-2… con destino (spec futura o EPIC-MEJORA). -->

- **F-SPEC-003-1 — El informe de SPEC-002 no lleva bloque de retención, y ADR-009
  §1 también cubre su ventana.** ADR-009 fija el plazo para **todas** las ventanas
  de medición de EPIC-001, incluida la de SPEC-002 si la RFGF autoriza a capturar
  futgal. CA-15 mete el bloque `retencion_del_archivo` **solo** en el informe del
  modo `sin-referencia`: el del modo `con-referencia` no puede tocarse sin mover el
  contrato de SPEC-002, que está `hecho` y cuyo PR #2 espera merge con un GREEN que
  dejaría de significar lo que dice (CA-14 exige además que su suite siga verde sin
  cambiar una sola expectativa). **Consecuencia declarada:** si algún día se corre
  la ventana con referencia, su informe llevará la fecha de purga solo en el
  ledger. **Destino:** una eventual enmienda 2 de SPEC-002, o la spec que reabra
  ese modo — lo que llegue antes. No bloquea nada hoy: hoy ese modo no es
  ejecutable, que es la razón de existir de esta spec.
- **F-SPEC-003-2 — La purga no la sostiene ningún test, y CA-15 no la sostiene
  tampoco.** CA-15 hace verificable que el informe **declare** su fecha; que
  alguien **borre** los bytes ese día es una anotación manual en este ledger
  (ADR-009 §4), y ADR-009 lo firma sabiéndolo. **Destino:** la decisión de
  retención de producción (ADR-009 §6, F-SPEC-001-1), que tiene que ser automática
  porque allí no hay operador en el bucle.

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->
