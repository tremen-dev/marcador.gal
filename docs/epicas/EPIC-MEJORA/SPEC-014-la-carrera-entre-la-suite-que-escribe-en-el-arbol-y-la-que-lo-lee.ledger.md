---
id: SPEC-014
tipo: ledger
epica: EPIC-MEJORA
---
# Ledger — SPEC-014 La carrera entre la suite que escribe en el árbol y la que lo lee

## Resumen
- Fase: borrador (spec escrita, pendiente de gate humano)
- Rama: `ft/SPEC-014-carrera-de-la-suite`

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 — dos grupos que no se solapan, medido | | | | ❌ |
| CA-2 — la partición es exacta | | | | ❌ |
| CA-3 — pertenencia por grafo de imports, sin nombres | | | | ❌ |
| CA-4 — ningún test de spec cerrada tocado | | | | ❌ |
| CA-5 — alias, JSX y typecheck sobreviven | | | | ❌ |
| CA-6 — control positivo por mecanismo | | | | ❌ |
| CA-7 — cierre del flake: medida + control + 20 y 20 | | | | ❌ |
| CA-8 — los tres gates y el presupuesto de tiempo | | | | ❌ |

## Mediciones de partida (sdd-arquitecto, 2026-09-02)
<!-- Números que los CA citan. Reproducibles; si el implementador mide otra cosa, gana su medición y lo dice aquí. -->

- `npm test` en `main`, árbol limpio: **114 ficheros / 1117 casos**, `Type Errors  no errors`,
  **4,85 s** de duración (5,06 s de pared).
- `vitest --no-file-parallelism tests/site tests/polite tests/mirror tests/decide`
  (superconjunto del grupo serializado): **13,50 s**.
- Ficheros de `npm test` que alcanzan `node:fs`/`node:fs/promises` por el grafo
  de imports del repositorio (`tests/` + `src/`, con `@/…` y `.js`→`.ts`):
  **41 de 101**. Solo `tests/` en el grafo: 34.
- Ficheros que recorren de verdad el árbol real hoy (**dato de contexto, NO la
  lista de CA-3**): 15 — `tests/site/{contact,crawler-page,identity,no-hardcoded-literals,title-source}`,
  `tests/decide/{cycle-route,rn08-frontier,thresholds}`, `tests/ingest/no-decision`,
  `tests/mirror/{user-agent,capture/no-parse}`, `tests/polite/{architecture,containment,evasions,rate-limit}`.
  Más `tests/db/rate-limit.test.ts`, que va en la configuración de integración.
- **Escritores en el árbol real: uno solo**, `tests/polite/architecture.test.ts`,
  en siete rutas (casos 2d, 2e, 2g, 2k). `tests/polite/evasions.test.ts` escribe
  solo bajo `mkdtempSync(tmpdir())`.
- Vitest **4.1.11**, medido con un banco de 4 ficheros lentos + 24 rápidos:
  dos proyectos por defecto → **22 pares solapados**; con `fileParallelism: false`
  en uno → **0**; con `fileParallelism: false` + `sequence.groupOrder` distinto → **0**.
- `--reporter=json` emite `startTime` y `endTime` por fichero en `testResults[]`:
  la medida de CA-1.3 sale de ahí, sin instrumentar nada.

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-014/. Informe HTML opcional: _qa/SPEC-014/informe.html -->

No aplica: esta spec no tiene superficie de UI. La evidencia es la salida literal
de las ejecuciones de CA-6 y CA-7.

## Salvedades / follow-ups
<!-- IDs F-SPEC-014-1, F-SPEC-014-2… con destino (spec futura o EPIC-MEJORA). -->

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->

Spec escrita y en `borrador` el 2026-09-02 por `sdd-arquitecto`, sobre la rama
`ft/SPEC-014-carrera-de-la-suite` (sin PR, sin push). **No la firma ningún rol
`sdd-*`**: el paso a `aprobada` lo registra el orquestador con el nombre de la
persona. No se ha escrito ningún ADR, y el punto 1 de las notas al gate explica
por qué y qué habría que hacer si el gate discrepa.
