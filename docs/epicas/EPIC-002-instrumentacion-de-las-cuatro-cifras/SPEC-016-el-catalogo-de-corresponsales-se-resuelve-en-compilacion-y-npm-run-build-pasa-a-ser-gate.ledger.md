---
id: SPEC-016
tipo: ledger
epica: EPIC-002
---
# Ledger — SPEC-016 El catálogo de corresponsales se resuelve en compilación, y npm run build pasa a ser gate

## Resumen
- Fase: **borrador** (escrita el 2026-09-03 por `sdd-arquitecto`). La fuente de
  verdad es el frontmatter de la spec. **Pendiente de gate humano**; ningún rol
  `sdd-*` puede firmar `aprobada`.
- Rama: **`ft/SPEC-015-bot-corresponsal`** (worktree `.claude/worktrees/spec-015`).
  **No es la rama que le tocaría por nombre, y es a propósito**: decisión de
  Alberto Fojo del 2026-09-03. El PR #23 no se puede fusionar sin este arreglo,
  porque metería en `main` un árbol que no compila; así que el arreglo viaja en
  el mismo PR aunque sea de otra spec, y el PR pasa a ser «el bot, y compila».
  Menos puro que un PR apilado, y mucho más seguro.
- **No hay ADR nuevo.** El juicio está razonado en «Entidades y reglas
  afectadas» de la spec y resumido en la nota 2 del gate: ADR-022 §2 ya decía
  «importado como módulo», así que esto lo **restaura**, no lo supersede.
  Revisable por quien firma.
- **Enmienda escrita en el ledger de SPEC-015** (`## Enmienda — 2026-09-03`),
  por la vía de ADR-015: F-SPEC-015-14 se quedó corto y su disparador llegaba
  semanas tarde. El cuerpo de SPEC-015 no se ha tocado.

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1.1 — sin lectura de disco, `import` estático con `with { type: 'json' }` | | | | ❌ |
| CA-1.2 — sigue pasando por `parseCatalog` (zod, todo-o-nada) | | | | ❌ |
| CA-1.3 — `loadCatalog` síncrona; los llamantes dejan el `await` | | | | ❌ |
| CA-1.4 — `emptyCatalog` no es el camino de fallo | | | | ❌ |
| CA-2.1 — registro cerrado temporada → catálogo importado | | | | ❌ |
| CA-2.2 — clave del registro ≡ campo `season` del JSON | | | | ❌ |
| CA-2.3 — `ACTIVE_SEASON` es clave del registro | | | | ❌ |
| CA-2.4 — temporada no declarada ⇒ lanza, nunca catálogo vacío | | | | ❌ |
| CA-2.5 — cada clave tiene su fichero en `corresponsais/` | | | | ❌ |
| CA-3.1 — `npm run build` en verde | | | | ❌ |
| CA-3.2 — `npm run typecheck` en verde | | | | ❌ |
| CA-3.3 — `lint`, `test` y `test:db` sin regresión | | | | ❌ |
| CA-4.1 — script `gates` en `package.json`, los cuatro en orden | | | | ❌ |
| CA-4.2 — `test:db` queda fuera de `gates`, y se dice por qué | | | | ❌ |
| CA-4.3 — `.sdd.json` nombra el comando | | | | ❌ |
| CA-4.4 — `CLAUDE.md` dice `npm run gates` y por qué | | | | ❌ |
| CA-4.5 — test que afirma que el script contiene los cuatro | | | | ❌ |
| CA-5.1 — declarado lo que el gate del build NO alcanza | | | | ❌ |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-016/. Informe HTML opcional: _qa/SPEC-016/informe.html -->
No aplica: esta spec no toca ninguna superficie visible. La evidencia es la
salida de `npm run gates`.

## Salvedades / follow-ups
<!-- IDs F-SPEC-016-1, F-SPEC-016-2… con destino (spec futura o EPIC-MEJORA). -->
Previstos ya al especificar; el implementador y el verificador los confirman o
los desmienten, y añaden los suyos.

- **F-SPEC-016-1 (previsto) — No hay CI: el gate lo ejecuta una persona.**
  `npm run gates` hace que el gate sea *un* comando, no que alguien lo corra.
  **Destino: spec propia de CI**; **disparador: el primer trabajo que no pase
  por una sesión con `sdd-verificador`, o el segundo despliegue roto.**
- **F-SPEC-016-2 (previsto) — El gate del build no ve una lectura de disco
  calculada en ejecución.** Atrapa `new URL(x, import.meta.url)`, que el
  empaquetador resuelve en compilación; **no** atrapa
  `readFile(join(process.cwd(), …))`, que compila y falla en producción. Quedan
  vivas dos apariciones del mismo patrón —`src/db/migrate.ts:14` y
  `src/mirror/cli/node-resolve.ts:27`—, legítimas hoy **sólo** mientras esos
  módulos no entren en el grafo de importación de ninguna ruta; que `main`
  compile limpio es la prueba de que hoy no están. **Destino: EPIC-MEJORA**;
  **disparador: el día que un módulo con `import.meta.url` entre en el grafo de
  una ruta, o el primer fallo en producción por un fichero que no viajó.**
- **F-SPEC-016-3 (previsto) — Cambiar de temporada exige mover dos sitios.**
  `ACTIVE_SEASON` (`src/ingest/measurement.ts`) y el registro de
  `src/bot/catalog.ts`. CA-2.3 hace que olvidarse sea un test rojo; no lo hace
  imposible. **Destino: la spec que abra la temporada 2027/28**; **disparador:
  el primer cambio de `ACTIVE_SEASON`.**

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->
1. **Hecho:** la spec, este ledger y la enmienda en el ledger de SPEC-015. Cero
   líneas de código o de test tocadas — `sdd-arquitecto` no implementa.
2. **Lo siguiente es el gate humano.** Sin firma de una persona no se implementa
   (`.sdd.json`, `gates.requireSpec`). Las dos cosas que la firma tiene que
   mirar con lupa están en las notas 2 y 3 de la spec: **por qué no hay
   ADR-024**, y **por qué el gate del build entra aquí y no en spec propia**.
3. **Para quien implemente:** el punto de entrada es
   `src/bot/catalog.ts` (25 líneas de código real) y su único consumidor de
   producción es `src/bot/webhook.ts:productionBotPorts`. El test que hoy pasa
   en verde y seguirá pasando es `tests/bot/correspondents.test.ts:72`; hay que
   quitarle el `await` (CA-1.3).
4. **Reproducir el defecto antes de arreglarlo:** `npm run build` en esta rama
   falla con `Can't resolve '../../corresponsais'`. En `main` no falla. Ese es
   el rojo de partida.
5. **Ojo con `npm run test:db`:** rama de Neon compartida entre worktrees
   (F-SPEC-015-8). Comprobar `ps aux | grep vitest` antes.
