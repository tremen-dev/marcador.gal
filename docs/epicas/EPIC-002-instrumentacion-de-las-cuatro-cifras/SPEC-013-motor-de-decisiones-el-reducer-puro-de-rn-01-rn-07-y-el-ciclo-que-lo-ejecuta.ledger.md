---
id: SPEC-013
tipo: ledger
epica: EPIC-002
---
# Ledger — SPEC-013 Motor de decisiones: el reducer puro de RN-01..RN-07 y el ciclo que lo ejecuta

## Resumen
- Fase: borrador (spec y ADR-021 escritos, pendientes del gate humano)
- Rama: `ft/SPEC-013-motor-de-decisiones`

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 — pesos y roles de RN-01, fallo cerrado | | | | ❌ |
| CA-2 — RN-02/RN-03 en las cinco ramas | | | | ❌ |
| CA-3 — independencia declarada, lista vacía | | | | ❌ |
| CA-4 — precedencia del operador (RN-01) | | | | ❌ |
| CA-5 — RN-04: monotonía y retención | | | | ❌ |
| CA-6 — RN-05: conflicto, alerta y gracia | | | | ❌ |
| CA-7 — RN-06: transiciones y tabla cerrada | | | | ❌ |
| CA-8 — RN-07: silencio publicado y alertado | | | | ❌ |
| CA-9 — RN-12: la regla decisiva | | | | ❌ |
| CA-10 — los cuatro cualificadores derivados | | | | ❌ |
| CA-11 — aplicador, versión arbitrada, `alerts` | | | | ❌ |
| CA-12 — el ciclo dentro del tick y la ruta | | | | ❌ |
| CA-13 — RN-08: la frontera y su residuo | | | | ❌ |
| CA-14 — replay determinista | | | | ❌ |
| CA-15 — los tres gates y las suites enteras | | | | ❌ |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-013/. Informe HTML opcional: _qa/SPEC-013/informe.html -->

Previsión: **no aplica**. La spec no tiene superficie de UI. La única HTTP es la
ruta del cron que ya existe (SPEC-012 CA-7), cuyos cuatro casos deben seguir en
verde sin tocar una aserción (CA-12.2).

## Salvedades / follow-ups
<!-- IDs F-SPEC-013-1, F-SPEC-013-2… con destino (spec futura o EPIC-MEJORA). -->

Ninguna todavía. Dos residuos ya **declarados por la spec** antes de
implementar, que el implementador no tiene que descubrir y el verificador no
tiene que levantar como hallazgo:

- **Residuo de CA-13.3** — la frontera de RN-08 no alcanza al nombre de tabla
  compuesto en tiempo de ejecución. Declarado dentro del propio criterio, como
  ADR-016 §6 obliga. **Destino: EPIC-MEJORA**; disparador: el día que un módulo
  fuera de `src/decide/` y de `src/db/` necesite escribir en la base.
- **Residuo de §Fuera de alcance** — la tabla de pesos de RN-01 vive en
  `src/ingest/sources.ts`, que es vocabulario del motor en el módulo de
  ingesta. **Destino: EPIC-MEJORA**; disparador: la próxima spec que ya tenga
  que tocar ese fichero por otro motivo.

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->

**Estado (2026-09-02, sdd-arquitecto):** spec en `borrador` y **ADR-021 en
`borrador`**, los dos pendientes del gate humano. No hay una línea de `src/` ni
de `tests/` escrita, y no puede haberla: `gates.requireSpec` exige la spec
`aprobada`.

Lo que tiene que pasar **antes** de que el implementador empiece, en este orden:

1. **Firma de ADR-021.** Sus §8.1 a §8.4 fijan cuatro lecturas de RN-01..RN-07 y
   catorce de los quince CA cuelgan de ellas. Si el gate cambia una, cambian sus
   criterios.
2. **`sdd-arquitecto` traslada las cuatro lecturas de ADR-021 §8 a
   `reglas.md`** como aclaraciones fechadas, con el precedente exacto de las de
   RN-01 y RN-03. Las reglas viven en `reglas.md`, no en un ADR.
3. **Firma de la spec**, y solo entonces `en-progreso`.

Para el implementador, cuando llegue el turno:

- **Empezar por `src/decide/rules.ts` y `attribution.ts`**, que son puros y no
  necesitan base: CA-1 a CA-10 se cierran enteros con `npm test`.
- **`DATABASE_URL_TEST` hace falta desde CA-11.** Sin él, CA-11 y CA-12 son
  UNMET, no *skipped*.
- **`src/ingest/`, `src/polite/`, `src/calendar/` y `src/alias/` no se tocan**
  (CA-12.4). La **única** línea autorizada fuera de `src/decide/`, `src/db/` y
  `migrations/` es la función que `src/app/api/cron/ingest/route.ts` le inyecta
  al handler (CA-12.2), y esa línea obliga a escribir la enmienda de ADR-015 en
  el ledger de SPEC-012 (CA-12.3).
- **El lector de CA-13 se hereda, no se escribe**: es el del compilador que
  sostiene la frontera de SPEC-008/SPEC-009 (ADR-016 §5 bis: un solo lector).
