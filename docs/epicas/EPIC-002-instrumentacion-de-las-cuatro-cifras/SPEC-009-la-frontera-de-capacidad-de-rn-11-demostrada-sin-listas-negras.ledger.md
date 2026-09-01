---
id: SPEC-009
tipo: ledger
epica: EPIC-002
---
# Ledger — SPEC-009 La frontera de capacidad de RN-11, demostrada sin listas negras

## Resumen
- Fase: **`borrador`** — escrita el 2026-09-01 por `sdd-arquitecto`, **sin
  aprobar**: la firma es de una persona y ningún rol `sdd-*` puede darla.
- **Esta spec no empieza de cero: hereda el expediente de SPEC-008.** Las once
  evasiones, los cuatro mecanismos superados, las cinco verificaciones y las
  cuatro enmiendas viven en
  `SPEC-008-adaptador-de-ceroacero-es-y-cortesia-rn-11-con-una-sola-implementacion.ledger.md`,
  y **no se copian aquí**. El §2 y el §3 de la spec los resumen con su
  identificador; el material entero está allí.
- **Lo que la saca de SPEC-008** está escrito en aquel ledger, bajo
  `## Enmienda — 2026-09-01: CA-2 se queda ⚠️ con su residuo escrito, y la
  frontera de capacidad sale a SPEC-009`. Allí queda **CA-2 como ⚠️**, y aquí se
  mudan **F-SPEC-008-V34** (CA-1) y **F-SPEC-008-V35** (CA-2).
- Rama: `ft/SPEC-009-la-frontera-de-capacidad-de-rn-11-demostrada-sin-listas-negras`

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 — lista blanca de identificadores globales, con superficie y motivo | | | | ❌ |
| CA-2 — la cobertura fuera de las raíces no la decide `git` | | | | ❌ |
| CA-3 — las once evasiones, como batería ejecutable | | | | ❌ |
| CA-4 — lo que la frontera NO promete, dentro del criterio | | | | ❌ |
| CA-5 — lo construido no se rehace, y sigue mordiendo | | | | ❌ |
| CA-6 — no se toca `src/` | | | | ❌ |
| CA-7 — los tres gates y las suites cerradas enteras | | | | ❌ |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-009/. Informe HTML opcional: _qa/SPEC-009/informe.html -->

## Salvedades / follow-ups
<!-- IDs F-SPEC-009-1, F-SPEC-009-2… con destino (spec futura o EPIC-MEJORA). -->

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->

**No hay trabajo empezado: la spec está en `borrador` y espera firma humana.**
Lo que hay que mirar antes que nada, en este orden:

1. **La decisión abierta del gate**: (a) lista blanca de identificadores globales
   con superficie y motivo, o (b) aceptar la lista negra y escribir el residuo
   dentro del criterio. Está en la spec §4 y en sus *Notas para el gate humano*
   §1 y §2. **Sin esa firma no empieza nada.**
2. **El coste de (a) no está medido**, y CA-1.6 lo pone como primera tarea:
   cuántos identificadores libres distintos usa hoy el escaneo, y qué hace falta
   para que el lector distinga un identificador **libre** de uno ligado
   (`bareIdentifiers` recoge hoy los dos).
3. **Dónde vive lo que se hereda**: `tests/mirror/support/imports.ts` (el lector
   del compilador) y `tests/polite/support/capability.ts` (las listas y los
   detectores). Los guardianes son `tests/polite/architecture.test.ts` y
   `tests/polite/containment.test.ts`.
4. **N4 tiene que seguir sobreviviendo** (CA-3.2): es la pérdida que Alberto Fojo
   firmó el 2026-09-01 en CA-2.8 de SPEC-008.
5. **Para correr las tres suites desde un worktree**: `npm ci` **dentro** del
   worktree y copiar `.env.local` del checkout principal (para
   `DATABASE_URL_TEST`). Nunca un symlink, nunca `git add -f`. Si `test:db` da
   `ENOTFOUND` contra Neon, es DNS: repetir (F-SPEC-008-21).
