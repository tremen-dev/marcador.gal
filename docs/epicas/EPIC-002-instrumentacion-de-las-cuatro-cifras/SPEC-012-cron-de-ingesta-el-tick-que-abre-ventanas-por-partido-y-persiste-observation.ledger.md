---
id: SPEC-012
tipo: ledger
epica: EPIC-002
---
# Ledger — SPEC-012 Cron de ingesta: el tick que abre ventanas por partido y persiste Observation

## Resumen
- Fase: en-revision (implementación completa, pendiente de verificación)
- Rama: `ft/SPEC-012-cron-de-ingesta`

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 | `src/ingest/windows.ts` | `tests/ingest/windows.test.ts` (9 casos: bordes de ventana, jornada `[from,to)`, lista vacía, POST en su único sitio, cadena `Z`) | | 🚧 |
| CA-2 | `src/ingest/tick.ts` (`runIngestTick`, `composeTickPorts`), `src/ingest/measurement.ts` | `tests/db/ingest-tick.test.ts` casos 1–3, 8–9 (una petición al par elegible, ritmo durable con composición nueva por tick, sin elegibles nada, instante `Z`) | | 🚧 |
| CA-3 | `src/polite/policy-durable.ts` (`DurablePolicyGate`, `robotsTurnKey`) | `tests/polite/policy-durable.test.ts` (7 casos, mitad de unidad) + `tests/db/ingest-tick.test.ts` casos 3, 9–13 (conducción: 3.1 orden robots→página, 3.2 sin robots dentro de 6 h, 3.3 caducidad, 3.4 fallo cerrado + turno, 3.5 control positivo con `RobotsGate` en memoria, 3.7 URL prohibida). 3.6: `parseRobots` reutilizado — comprobable en el diff | | 🚧 |
| CA-4 | `src/ingest/tick.ts` (`settle`: relectura del archivo, resolver real, `append`) | `tests/db/ingest-tick.test.ts` casos 4–7, 14 (una fila validada con `raw_ref` del tick, no resueltos íntegros, temporada declarada, replay inofensivo, `decisions` vacía) | | 🚧 |
| CA-5 | `migrations/0005_ingest_attempts.sql`, `src/ingest/attempts.ts`, `src/db/ingest-attempts.ts` | `tests/db/ingest-attempts.test.ts` casos 4–6 (fila entera, motivo obligatorio, `reject_amendment`) + `tests/db/ingest-tick.test.ts` casos 5, 8, 15–16 (5.1 fallo no impide el siguiente; 5.3 suprimido/no elegible sin fila) | | 🚧 |
| CA-6 | `migrations/0005_ingest_attempts.sql` | `tests/db/ingest-attempts.test.ts` casos 1–3 (`['0001'..'0005']`, segunda `[]`, columnas); paridad sin entradas nuevas y suite `tests/db/` previa intacta: `npm run test:db` completo | | 🚧 |
| CA-7 | `src/ingest/cron.ts` (`cronIngestHandler`), `src/app/api/cron/ingest/route.ts` | `tests/ingest/cron.test.ts` (4 casos: sin header, bearer malo, sin `CRON_SECRET` con header, 200 con resumen JSON; espía afirma no-invocación) | | 🚧 |
| CA-8 | `vercel.json`, `CRON_INGEST_PATH` en `src/ingest/cron.ts` | `tests/ingest/vercel-cron.test.ts` (2 casos: un cron `* * * * *` contra la constante; el fichero de la ruta existe donde ella dice) | | 🚧 |
| CA-9 | `src/ingest/tick.ts` (la consulta de elegibilidad va antes que toda petición) | `tests/ingest/tick-fails-closed.test.ts` (1 caso: `Sql` roto → cero peticiones, cero archivo, error nombrando la causa) | | 🚧 |
| CA-10 | — | salidas literales abajo; recuento fichero a fichero contra `main` sin pérdidas (solo altas); `ENTRY_POINTS` +1 con motivo | | 🚧 |

## Gates (CA-10) — salidas literales

- `npm run lint` → `oxlint --type-aware` → **exit 0**, sin avisos.
- `npm test` → `Test Files  100 passed (100) · Tests  919 passed (919) · Type Errors  no errors` (exit 0).
- `npm run test:db` → `Test Files  21 passed (21) · Tests  259 passed (259) · Duration 145.81s` (exit 0) — la suite `tests/db/` previa entera más las dos altas de esta spec, contra la Neon test branch real.
- Recuento contra `main` (mismo patrón que SPEC-009 CA-7): ningún fichero de suite cerrada pierde casos — `tests/polite/architecture.test.ts` 50→50, `tests/polite/containment.test.ts` 21→21, resto sin tocar. Altas: `tests/ingest/{windows,cron,vercel-cron,tick-fails-closed}.test.ts`, `tests/polite/policy-durable.test.ts`, `tests/db/{ingest-attempts,ingest-tick}.test.ts`.
- Diffs con motivo en el guardián (SPEC-008 CA-2.3, previstos por CA-10): `ENTRY_POINTS` gana `src/app/api/cron/ingest/route.ts`; el caso 2 de `architecture.test.ts` (enumeración de `src/polite/`) gana `policy-durable.ts`; el caso 13 de `containment.test.ts` añade la ruta a `DRIVEN` — los tres con su motivo escrito en el propio fichero. Ningún paquete ni global nuevo: `Response.json` se evitó usando `new Response` (la superficie concedida).

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-012/. Informe HTML opcional: _qa/SPEC-012/informe.html -->

## Salvedades / follow-ups
<!-- IDs F-SPEC-012-1, F-SPEC-012-2… con destino (spec futura o EPIC-MEJORA). -->

- **F-SPEC-012-1 — Los dos términos de `dominio.md` siguen sin añadirse.** La spec manda añadir «ventana de partido» y «jornada de medición declarada» «en el mismo commit que esta spec», y el commit de la spec (`c7bc6b7`) no los trajo. El implementador intentó añadirlos transcribiendo ADR-019 §2 y §3 y el hook de documentos de verdad lo denegó (dueños: `sdd-arquitecto`, `sdd-producto`), que es lo correcto. El texto propuesto va en el informe del implementador; **destino: `sdd-arquitecto` antes del cierre de la spec** — el glosario manda añadir un término antes de usarse, y ya se usa.
- **F-SPEC-012-3 — CA-6 dice «sin tocar una aserción» y hubo que tocar dos, y es una contradicción interna de la spec, no una licencia.** `tests/db/alias-schema.test.ts` (SPEC-011 CA-8) afirmaba `toHaveLength(4)` y `['0001'..'0004']`: la propia decisión de CA-6 (añadir `0005`) las vuelve falsas sin defecto — la forma exacta de F-SPEC-008-1, que `tests/db/migrate.test.ts` ya resolvió generalizando la enumeración. Se aplicó el mismo arreglo, conservando TODO lo que el caso afirmaba (0004 existe y es cuarta; las cuatro primeras versiones en orden; primera pasada aplica todo, segunda nada; una fila por versión) y sin perder ningún caso (recuento 21→21 del fichero intacto en número). **La letra de CA-6 queda incumplida a sabiendas; decide el gate humano** — la alternativa era un RED mecánico por una aserción que enumeraba.
- **F-SPEC-012-2 — El borde exacto `kickoff = t + PRE` no entra en la consulta, sí en el predicado.** La spec fija la consulta literal `listKickoffsBetween(t − POST, t + PRE)`, cuyo intervalo es `from ≤ kickoff < to` (SPEC-010): un partido con `kickoff` exactamente igual a `t + PRE` es elegible para la función pura de CA-1 pero la consulta de ese tick no lo trae; entra en el tick siguiente (60 s después, aún 9 min antes del kickoff). Efecto máximo: un tick de retraso en el instante exacto de apertura de ventana, con reloj a granularidad de minuto. Se implementó la letra de la spec; si se quiere cerrar el borde es un `+1 ms` en el `to` — **destino: EPIC-MEJORA** (o el gate decide que el comportamiento actual es el querido).

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->

**Estado (2026-09-02, sdd-implementador):** los diez CA implementados con TDD, gates en verde, todo commiteado en `ft/SPEC-012-cron-de-ingesta` (sin push: lo hace el orquestador tras el GREEN).

- **Código nuevo:** `src/ingest/windows.ts` (elegibilidad pura, PRE/POST), `src/ingest/measurement.ts` (jornadas declaradas — VACÍA — y `ACTIVE_SEASON`), `src/ingest/attempts.ts` (puerto del registro), `src/ingest/tick.ts` (`runIngestTick` + `composeTickPorts`), `src/ingest/cron.ts` (`CRON_INGEST_PATH`, `cronIngestHandler`, `productionCronTick`), `src/polite/policy-durable.ts` (`DurablePolicyGate`), `src/db/ingest-attempts.ts`, `migrations/0005_ingest_attempts.sql`, `src/app/api/cron/ingest/route.ts`, `vercel.json`.
- **Ficheros `hecho` de SPEC-008/010/011: intactos** (ADR-011 §6). Los tres únicos tests previos tocados son diffs con motivo: `capability.ts` (ENTRY_POINTS +1), `architecture.test.ts` caso 2 (+`policy-durable.ts` en la enumeración de polite), `containment.test.ts` caso 13 (DRIVEN +ruta), y la enmienda F-SPEC-008-1-style de `alias-schema.test.ts` (F-SPEC-012-3).
- **Para verificar:** conducir el tick con composición nueva por tick (los tests de `tests/db/ingest-tick.test.ts` son exactamente esa conducción); los controles positivos de CA-3.5 están en el caso 12 de ese fichero y en `policy-durable.test.ts`; CA-3.6 (ningún parser nuevo) se comprueba en el diff — `policy-durable.ts` importa `parseRobots` y no parsea nada por su cuenta.
- **Pendiente de otros roles:** F-SPEC-012-1 (términos de `dominio.md`, bloqueados por el hook de documentos de verdad — texto propuesto en el informe del implementador), decisión del gate sobre F-SPEC-012-3 (letra de CA-6) y F-SPEC-012-2 (borde `t + PRE` de la consulta). El runbook de jornada de medición es del documentalista tras el GREEN.
- **Despliegue (fuera de esta spec):** `CRON_SECRET` tiene que existir en el entorno de Vercel o el cron responderá 401 a todo (fallo cerrado deliberado, CA-7); `DATABASE_URL` y `BLOB_READ_WRITE_TOKEN` los leen `productionCronTick`/`BlobRawStore`.
