---
id: SPEC-013
tipo: ledger
epica: EPIC-002
---
# Ledger — SPEC-013 Motor de decisiones: el reducer puro de RN-01..RN-07 y el ciclo que lo ejecuta

## Resumen
- Fase: aprobada y **lista para implementar**. SPEC-013 y ADR-021 firmadas por
  Alberto Fojo el 2026-09-02; las cuatro lecturas de ADR-021 §8 ya están en
  `reglas.md`; F-SPEC-013-1 **cerrado** por el gate ese mismo día (salida b) y
  CA-6 reescrito en consecuencia. No queda ninguna decisión pendiente.
- Rama: `ft/SPEC-013-motor-de-decisiones`
- **Verificada el 2026-09-02: RED.** 14/15 CA cerrados; **CA-13 ❌** por
  **F-SPEC-013-7** (la frontera de RN-08 no ve un `import * as`, medido con los
  tres gates en verde). La spec vuelve a `en-progreso`.
- **Segunda vuelta, 2026-09-02 (`sdd-implementador`): F-SPEC-013-7 cerrado.** La
  frontera de RN-08 ve ahora el namespace y cinco formas más de la misma familia,
  cada mecanismo con su control positivo; la evasión del verificador se reprodujo
  **en rojo** antes de borrarla. Dos ficheros tocados, los dos de CA-13, commit
  `175403d`. Gates: `lint` exit=0 · `npm test` **114/1117** · `test:db` 22/276.
  Queda **F-SPEC-013-9** para el gate: una frase en el texto de CA-13.3 que este
  rol no puede escribir. La spec vuelve a `en-revision`.

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 — pesos y roles de RN-01, fallo cerrado | `src/decide/roles.ts` (tabla `SOURCE_ROLES`, `roleOf` con `UnknownSourceRoleError`, `isHuman`, `isOfficial`; pesos importados de `RN01_WEIGHTS`, nunca copiados) | `tests/decide/roles.test.ts` casos 1–8 (rol⊂claves de `RN01_WEIGHTS`, `defaultRegistry()` cubierto, fallo cerrado con nombre, `isHuman` por los seis roles) · `tests/decide/rules-qualification.test.ts` casos 1–2 (CA-1.2: `ceroacero` con `confidence: 0.95` sale confirmada, y con el peso de la tabla no) | Leído `src/decide/roles.ts`: `Rn01Role = keyof typeof RN01_WEIGHTS`, así que un rol fuera de la tabla de RN-01 **no compila**; los números se importan y no se copian. `defaultRegistry()` solo trae `ceroacero`, que tiene rol. Fallo cerrado comprobado en el código (`roleOf` lanza `UnknownSourceRoleError` con el nombre de la fuente, sin rama de defecto) y en los casos 4–5. CA-1.2 verificado contra `isConfirmed`, que compara `observation.confidence` y nunca la tabla. `isHuman` = operator ∨ correspondent, seis casos. | ✅ |
| CA-2 — RN-02/RN-03 en las cinco ramas | `src/decide/rules.ts` (`decide`: `isConfirmed`, `supporting`, condición de emisión por tupla publicada) | `tests/decide/rules-qualification.test.ts` casos 3–11 (cinco ramas una a una; CA-2.1 caso 5; CA-2.2 casos 6–7 incluidos los caminos de RN-06 timeout y RN-07; CA-2.3 caso 8 —diez entradas `time`, cero decisiones—; CA-2.4 casos 9–11) | Cinco ramas ejercidas una a una con su `provisional` esperado; `scheduled` de 0.7 → `true`, `postponed` del operador → `false`. En el reducer `provisional = !isConfirmed(support)` se calcula en **todos** los caminos antes de emitir, incluidos el timeout de RN-06 y el silencio de RN-07 (casos 6–7). CA-2.3 verificado: `unchanged` compara la tupla publicada más el flag de RN-07, y diez entradas `time` dan cero decisiones. `decided_at === now`, `version = previous+1|1` y apoyo no vacío en las cinco ramas. | ✅ |
| CA-3 — independencia declarada, lista vacía | `src/decide/independence.ts` (`IndependentPair`, `INDEPENDENT_PAIRS` VACÍA, `declareIndependence`, `PRODUCTION_INDEPENDENCE`) · `src/decide/rules.ts` (`isConfirmed`, vía 2) | `tests/decide/independence.test.ts` casos 1–6 (simetría, falsedad por defecto con `(ceroacero, besoccer)`, forma de la lista) · `tests/decide/rules-qualification.test.ts` casos 12–17 (CA-3.2 lista inyectada confirma con las dos ids; CA-3.3 una en 0.5 no; CA-3.4 caso 16: con `PRODUCTION_CONFIG` el mismo escenario sale provisional) | `INDEPENDENT_PAIRS` está vacía en el fichero; `declareIndependence` es simétrica, rechaza `a === b` y no se contagia. `(ceroacero, besoccer)` falso con la relación de producción. Con lista inyectada, las dos observaciones entran en `supporting_observation_ids`; con una en 0.5 no confirma (la vía filtra por `>= independentWeight`). CA-3.4 verificado con `PRODUCTION_CONFIG` real, no con un doble. | ✅ |
| CA-4 — precedencia del operador (RN-01) | `src/decide/rules.ts` (`rank` —empate a 1.0 lo rompe el operador—, `operatorPrecedence`, `conflictOf` con el árbitro) | `tests/decide/rules-precedence.test.ts` casos 1–6 (publica lo del operador confirmado con `rule: RN-01`; CA-4.1 sin alerta y sin retención, también pasada la gracia; CA-4.2 simétrico y el corresponsal que pierde por peso; CA-4.3 gana aunque cambie el estado) | `rank` rompe el empate a 1.0 por `isOperator` **antes** que por recencia, así que el operador gana también cuando la oficial llega después (caso 4). `conflictOf` devuelve `null` si entre las discrepantes hay oficial u operador → sin alerta y sin retención, también pasada la gracia entera (caso 3). El corresponsal pierde por peso en `rank`, no por rol (caso 5). `operatorPrecedence` entra en el escalón 1 aunque cambie el estado (caso 6). | ✅ |
| CA-5 — RN-04: monotonía y retención | `src/decide/rules.ts` (bloque RN-04: `goesDown`, `jump`, `seconded`; la retención devuelve la propuesta a lo publicado y la cadena sigue) | `tests/decide/rules-precedence.test.ts` casos 7–16 (5.1 retención de bajada; 5.2 corresponsal 0.8 y operador 1.0 con `rule: RN-04`; 5.3 salto de 3 retenido, liberado por segunda fuente con las dos ids, borde en 2 y en 3; 5.4 ≥ 0.9 publica de inmediato; 5.5 sin previa RN-04 no aplica) | Bloque RN-04 leído: bajada bloqueada salvo `isOfficial ∨ isHuman`; salto `jump > bigJumpGoals` **y** `lead.confidence < confirmedWeight` retenido hasta `seconded`. Bordes 2 vs 3 goles verificados a los dos lados (casos 12–13). ≥ 0.9 publica de inmediato desde operador y desde oficial. Sin previa, el bloque entero no entra (guardado por `previous !== null`). La `Observation` retenida no se toca. **Nota no bloqueante en F-SPEC-013-8.** | ✅ |
| CA-6 — RN-05: conflicto, alerta y gracia | `src/decide/rules.ts` (`conflictOf`: huella de la discrepancia, árbitro oficial/operador, plazo desde la más reciente) · `src/decide/thresholds.ts` (`CONFLICT_GRACE_MS`) | `tests/decide/rules-conflict.test.ts` casos 1–17 — **letra nueva**: 6.1 casos 1–2 (publica la más reciente, provisional, `held` null); 6.2 casos 3–5 (antes del borde SÍ hay `Decision` y ninguna alerta; después ninguna `Decision`, alerta y `held: RN-05`); 6.3 casos 6–8; 6.4 caso 9 (dos fuentes alternándose no retroceden); 6.5 casos 10–11; 6.6 casos 12–13 (diez `time` → una fila; otros valores → segunda); 6.7 casos 14–15; 6.8 casos 16–17 | Letra NUEVA verificada contra el fichero de hoy (ocho subpuntos). Los dos casos de borde afirman cosas **distintas**: 3 (antes) `decision != null` y `alerts == []`; 4 (después) `decision == null`, `held.rule == 'RN-05'` y una alerta. CA-6.4 conducido paso a paso: la secuencia publicada es `1-0, 2-0` y las bajadas las bloquea RN-04, no RN-05. Huella de la discrepancia = `fingerprint`, así que diez `time` dan una fila y otros valores dan otra. `CONFLICT_GRACE_MS` en un solo sitio, movido desde el test y solo mueve ese borde. | ✅ |
| CA-7 — RN-06: transiciones y tabla cerrada | `src/decide/rules.ts` (`transitionAllowed`, timeout de `kickoff + 110 min` tras RN-04) · `src/decide/thresholds.ts` (`LIVE_LEAD_MS`, `FINISH_TIMEOUT_MS`) | `tests/decide/rules-transitions.test.ts` casos 1–16 (7.1 borde `kickoff − 2 min` a los dos lados; 7.2 las tres vías + una sola automática no cierra + borde del timeout; 7.3 el `finished` por timeout sin apoyo que lo diga → *pendente de confirmar*; 7.4 `postponed`/`suspended`; 7.5 caso 14 enumera las 20 transiciones y exige vacío el resto, casos 15–16 la oficial y el humano a los cinco estados) · `tests/decide/thresholds.test.ts` casos 1–6 (CA-7.6) | `transitionAllowed` leído: privilegiado (oficial ∨ humano) pasa a cualquier estado; automática solo `scheduled→live` (con el umbral) y `live→finished` con `agreeingCount >= 2`. Caso 14 enumera las 20 transiciones, exige 18 vacías y las comprueba una a una. Timeout de RN-06 aplicado **después** de RN-04, con borde a un ms. El `finished` por timeout sale sin apoyo que diga `finished` → *pendente de confirmar*. Umbrales con cita y declaración única (`thresholds.test.ts` 5–6). Nota: el instante exacto `kickoff − 2 min` se trata como «después» (inclusivo); el CA no fija ese punto. | ✅ |
| CA-8 — RN-07: silencio publicado y alertado | `src/decide/rules.ts` (`silence`, `shouldRaiseSilence`, la tupla publicada incluye «la regla es RN-07») · `src/decide/thresholds.ts` (`SILENCE_MS`) | `tests/decide/rules-silence.test.ts` casos 1–12 (8.1 borde de 15 min a los dos lados + alerta; 8.2 una vez por episodio y episodio nuevo tras volver la señal; 8.3 al volver, `RN-03` y deja de ser *sen sinal*, aunque no cambie nada más; 8.4 solo `live`; 8.5 sin observaciones no produce nada) | Borde de 15 min a un ms a cada lado. El episodio se cierra con `shouldRaiseSilence` (alerta anterior más vieja que la última observación), verificado con diez `time` (cero) y con un episodio nuevo (una). `silence` solo si `proposed.status === 'live'`, así que `scheduled` y `finished` no producen nada. Salir del silencio emite aunque no cambie el marcador, porque el flag de RN-07 entra en la tupla publicada (caso 8). Sin observaciones, `decide` devuelve `NOTHING` (RN-12). | ✅ |
| CA-9 — RN-12: la regla decisiva | `src/decide/attribution.ts` (`ATTRIBUTION_ORDER` + `CONDITIONS`, una sola declaración del orden) | `tests/decide/attribution.test.ts` casos 1–15 (un caso por escalón, un caso por par adyacente, las 32 combinaciones sin RN-05, vocabulario cerrado, RN-02/RN-03 nunca concurren) · `tests/decide/rules-attribution.test.ts` casos 1–10 (los tres pares que el CA nombra, atravesando el reducer; CA-9.1 casos 5–8) | `ATTRIBUTION_ORDER = ['RN-01','RN-04','RN-07','RN-06']` es **una** declaración y el suelo es `provisional ? 'RN-03' : 'RN-02'`. Un caso por escalón, por par adyacente y por los no adyacentes; las 32 combinaciones no producen jamás `RN-05` y sí las seis que pueden salir. Verificado además en el reducer: `RN-05` solo aparece en `held`, nunca en `Decision.rule` (el tipo `DecisionRule` y el `CHECK` de 0001 son la segunda red). Los tres pares que el CA nombra, atravesados de verdad. | ✅ |
| CA-10 — los cuatro cualificadores derivados | `src/decide/qualifier.ts` (`qualifierOf`, pura y total, en el orden de ADR-021 §6) | `tests/decide/qualifier.test.ts` casos 1–12 (uno por valor, orden, totalidad sobre 5 estados × 2 × 6 reglas × 3 apoyos, `finished` con apoyo que lo dice, y `sen_sinal` + `provisional: true` a la vez) · `tests/decide/cycle-route.test.ts` casos 9–10 y `tests/db/decide-cycle.test.ts` caso 4 (CA-10.4: ninguna columna nueva) | `qualifierOf` es pura, total y en el orden de ADR-021 §6, comprobado sobre 5 estados × 2 × 6 reglas × 3 formas de apoyo. `finished` con apoyo que lo dice no es *pendente*. `sen_sinal` + `provisional: true` conviven. CA-10.4 verificado por mí en el diff contra `main`: `src/model/` intacto y `migrations/` sin `alter table` sobre `decisions`/`observations`; las diez columnas de `decisions` leídas de `information_schema` contra Postgres real. Sin literales de UI nuevos: los cuatro valores ya estaban en `src/model/qualifier.ts` (SPEC-001). | ✅ |
| CA-11 — aplicador, versión arbitrada, `alerts` | `src/decide/apply.ts` (`applyEngine`, reintento único ante `DecisionVersionConflictError`) · `src/db/alerts.ts` (`PostgresAlertStore`) · `migrations/0006_alerts.sql` · `src/decide/ports.ts` (`AlertStore`, `LatestAlerts`) · `src/decide/alert.ts` (esquemas zod, NO modelo canónico) | `tests/db/decide-cycle.test.ts` casos 1–12 (fila válida releída con `DecisionSchema`, apoyo del mismo partido, `decided_at` como cadena `Z`; 11.1 las seis migraciones y segunda ejecución `[]` + columnas de `alerts`; 11.2 `update` y `delete` rechazados; 11.3/11.4 casos 8–10 con escritura concurrente REAL; 11.5 casos 11–12) — **requiere `DATABASE_URL_TEST`** | `npm run test:db` corrido por mí contra Postgres real (`DATABASE_URL_TEST` del `.env.local`, endpoint *pooler*, que **sí** resolvió en esta máquina): 22 ficheros / 276 casos en verde. Fila releída y `DecisionSchema.parse`-ada, apoyo del mismo partido comprobado con una consulta, `decided_at` como cadena `Z`. `migrate` → seis versiones y `[]` la segunda vez; `alerts` con sus seis columnas; `update`/`delete` rechazados por `reject_amendment`. Conflicto de versión provocado con escritura concurrente **real**: un choque → versión 2 con dos intentos; dos choques → `abandoned`, sin lanzar, con motivo. Ciclo sin decisión: cero filas. | ✅ |
| CA-12 — el ciclo dentro del tick y la ruta | `src/decide/cycle.ts` (`runCycle`, `composeCyclePorts`, `productionCycle`) · `src/app/api/cron/ingest/route.ts` (UNA línea: `tick: productionCycle`) · enmienda de ADR-015 en el ledger de SPEC-012 | `tests/db/decide-cycle.test.ts` casos 13–16 (una invocación persiste `Observation` Y `Decision`; el motor después de la ingesta; fuera de ventana nada; un fallo del motor no revierte la ingesta) · `tests/decide/cycle-route.test.ts` casos 1–8 (12.2 la ruta y `src/ingest/cron.ts` intacto; 12.3 las cinco partes de las DOS enmiendas; 12.4 nadie de las specs cerradas importa `@/decide`) · `tests/ingest/cron.test.ts` y `tests/ingest/vercel-cron.test.ts` pasan sin tocar una aserción | Una invocación de `runCycle` persiste la `Observation` y escribe la `Decision`: `decisions` deja de estar vacía (caso 13, base real). El motor corre después de `runIngestTick` y sobre los mismos elegibles; fuera de ventana, cero peticiones y cero filas. Diff contra `main` leído por mí: `src/ingest/`, `src/polite/`, `src/calendar/`, `src/alias/` y `src/model/` **sin una línea**; `route.ts` cambia el `import` y la línea de composición y nada más; `vercel.json` sin tocar y sus dos casos verdes; `tests/ingest/cron.test.ts` intacto. Las **dos** enmiendas de ADR-015 están en el ledger de SPEC-012 con sus cinco partes; el índice `grep` pasa de 10 a 12 entradas, ambas reales. | ✅ |
| CA-13 — RN-08: la frontera y su residuo | **Segunda vuelta (F-SPEC-013-7 cerrado).** `tests/decide/support/rn08.ts`: `DECISION_WRITERS` sigue con DOS entradas y su motivo y `DECISION_CAPABILITY_NAMES` con los tres nombres —ninguna lista se tocó—; `decisionImportOffences` mira ahora **tres deletreos del mismo nombre** (binding · referencia desnuda · **lectura de miembro** `algo.PostgresDecisionStore`, vía `reading.namespaceReads`, que es por donde entró la evasión) y **falla cerrado** ante un módulo que el compilador nombra y el lector no enumeró (`import d = require(…)`) y ante un especificador no literal; `decisionHandoverOffences` es **nuevo y es el tercer mecanismo**: la superficie ILEGIBLE de un módulo con capacidad —`import * as`, `import()` dinámico, `export *`, `export * as`, import de solo efecto—, que resuelve el especificador con el resolvedor del lector heredado y consulta **la misma** `DECISION_WRITERS` leída en la otra dirección; `decisionOffences` compone los tres. El lector se sigue heredando (`tests/polite/support/capability.ts` + `tests/mirror/support/imports.ts`), sin abrir el compilador ni pasear el árbol | `tests/decide/rn08-frontier.test.ts` casos 1–25 (renumerado: eran 16). Nuevos: **6** (la evasión exacta de F-SPEC-013-7, roja por los DOS mecanismos del grafo), **7** (alias del namespace y `const d = await import(…)`), **8** (`import d = require(…)`, rojo por «el compilador nombra un módulo que el lector no enumeró»), **9** (especificador no literal), **11** (las cuatro formas de entregar la superficie entera), **12** (`(await import(…)).PostgresDecisionStore`, que el mecanismo de nombres NO puede ver y el de superficie sí), **13** (control del nuevo detector: vaciar la lista lo apaga, y el árbol real da vacío), **19** (segundo residuo: la capacidad entregada como tipo estructural), **20** (la reexportación en cadena NO es residuo: roja en los dos extremos y en el consumidor). Conservados con su letra: 4, 5, 10 (antiguo 6), 14–15 (textual), 16–17 (13.2), 18 (13.3 SQL compuesto), 21 (destino y disparador, ahora los DOS), 22–23 (13.4), 24–25 (13.5) | **ROJO, medido.** El mecanismo estático NO cierra lo que el criterio afirma cerrar. Con `src/probe/evasion.ts` = `import * as d from '@/db/decisions'` + `new d.PostgresDecisionStore(sql)` —un módulo fuera de `DECISION_WRITERS` que obtiene la capacidad— `npm run lint` sale `exit=0` y `npm test` **114/114 ficheros, 1108/1108 casos**, con `tests/decide/rn08-frontier.test.ts` **16/16 en verde**, `tests/polite` 124/124 y `tests/site/contact.test.ts` 5/5. Causa: `decisionImportOffences` mira `specifier.bindings[].name` (un namespace binding se llama `*`) y `reading.bareIdentifiers`, que **excluye** el miembro de un `PropertyAccessExpression`; el mecanismo textual tampoco muerde porque el nombre de la tabla no aparece. El re-export sí es rojo (probado: 2 casos en rojo), así que el fichero **sí se escanea**: lo que falla es el detector, no el escaneo. Esa laguna **no es el residuo declarado** (nombre de tabla compuesto en ejecución), y ADR-016 §6 obliga a declararla dentro del criterio. Precedente en el mismo fichero que hereda el lector: `capability.ts` tiene `namespaceOffences` exactamente por esto. Ver **F-SPEC-013-7**. Lo demás de CA-13 sí está: dos entradas con motivo, controles positivos por mecanismo, fichero inparseable rojo, sin exenciones por nombre, `src/ingest/` limpio y la dirección del grafo. | ❌ |
| CA-14 — replay determinista | `src/decide/replay.ts` (`replayMatch`, `replayInstants`, sin reloj ni base) | `tests/decide/replay.test.ts` casos 1–9 (material sintético archivado y releído por `adapter.read` sin red; 14.1 comparación profunda dos veces + el log de la jornada; 14.3 `Date.now` envenenado con su control positivo; 14.4 `tests/fixtures/` sin un byte de HTML de terceros) · `tests/db/decide-cycle.test.ts` caso 17 (**CA-14.2**: el replay coincide con el log del ciclo REAL) | Replay determinista comprobado con comparación profunda del objeto entero, dos veces y por los tres partidos. Material sintético archivado en el raw store y releído por `adapter.read`, con `spy.requests == []`: ni una petición. La línea temporal es minuto a minuto (116 instantes). `Date.now` envenenado y el replay entero sigue igual, con su control positivo de que el veneno muerde. CA-14.2 contra el ciclo **real** en Postgres: reglas, versiones, tuplas, `decided_at` y apoyos idénticos (caso 17 de `tests/db/decide-cycle.test.ts`). `tests/fixtures/` solo `.ts` (ADR-009). | ✅ |
| CA-15 — los tres gates y las suites enteras | — | **Segunda vuelta (2026-09-02):** `npm run lint` exit=0 · `npm test` 114 ficheros / **1117** casos · `npm run test:db` 22 ficheros / 276 casos. Recuento fichero a fichero contra el commit anterior (`fa4e654`) por reporter JSON: 114/1108 → 114/1117, **cero ficheros añadidos, cero eliminados y UNO con recuento distinto** —`tests/decide/rn08-frontier.test.ts` 16 → 25, que es el fichero de CA-13 y nace en esta rama—. Contra `main` sigue sin cambiar ningún fichero previo | Los tres gates corridos por mí, salidas literales abajo: `lint` exit=0 · `npm test` 114/1108 · `npm run test:db` 22/276. **Recuento fichero a fichero contra `main` verificado de forma independiente** (reporter JSON en un worktree de `main` y en `HEAD`): 100 ficheros / 919 casos → 114 / 1108, **14 ficheros añadidos, 0 eliminados y 0 con recuento distinto**. `ALLOWED_PACKAGES`, `ENTRY_POINTS` y las enumeraciones de `tests/polite/` no se tocaron (diff vacío en `tests/polite` y `tests/mirror`). | ✅ |


## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

**RED — 2026-09-02, `sdd-verificador`.** Catorce de los quince criterios están
cerrados con evidencia propia. **CA-13 no lo está, y no por letra pequeña: la
frontera de RN-08 no cierra lo que el criterio dice que cierra, y se ha medido**
(F-SPEC-013-7). Es exactamente el defecto que ADR-016 existe para impedir —un
mecanismo que enumera lo permitido y deja fuera del conjunto medido una forma de
cruzar la capacidad, sin declararla como residuo—, y SPEC-009 existe porque este
trabajo se subestimó una vez.

**Los tres gates, corridos por el verificador el 2026-09-02:**

```
$ npm run lint
> oxlint --type-aware
(sin salida; exit=0)

$ npm test
 Test Files  114 passed (114)
      Tests  1108 passed (1108)
 Type Errors  no errors

$ npm run test:db
 Test Files  22 passed (22)
      Tests  276 passed (276)
```

`DATABASE_URL_TEST` estaba disponible, así que **CA-11 y CA-12 se juzgaron
contra Postgres real**, no como UNMET. Nota operativa: el endpoint *pooler* de
`.env.local` **sí** resolvió por `getaddrinfo` en esta ejecución
(`dns.lookup` → `3.126.61.111`), así que F-SPEC-013-6 no se reprodujo; no se
tocó `.env.local`. No había ninguna otra ejecución de `test:db` en curso
(`ps aux | grep vitest` → 0) antes de arrancar.

**Recuento fichero a fichero contra `main` (CA-15), medido de forma
independiente** con el reporter JSON de vitest sobre un worktree de `main` y
sobre `HEAD`: **100 ficheros / 919 casos → 114 / 1108**; **14 ficheros añadidos**
—los catorce bajo `tests/decide/`—, **0 eliminados** y **0 con recuento
distinto**. En `test:db`, 22/276 con `tests/db/decide-cycle.test.ts` (17 casos)
como único fichero nuevo y `tests/db/ingest-attempts.test.ts` con el mismo
recuento. `tests/polite/` y `tests/mirror/` con diff vacío: ni `ALLOWED_PACKAGES`,
ni `ENTRY_POINTS`, ni las enumeraciones se tocaron.

**Índice de enmiendas de ADR-015:** `grep -rn "^## Enmienda —" docs/epicas/`
pasa de **10** a **12**. Las dos nuevas están en el ledger de SPEC-012 —la letra
de su CA-7 y la aserción enumerante de su CA-6—, las dos con las cinco partes de
ADR-015 §3 y las dos reales. Ninguna falsa.

**Diff contra `main` en `src/` y `tests/`, leído entero:** de las specs cerradas
solo se tocan dos ficheros, los dos autorizados y los dos con enmienda escrita —
`src/app/api/cron/ingest/route.ts` (el `import` y la línea de composición) y
`tests/db/ingest-attempts.test.ts` (el caso 1 generalizado, mismo recuento).
`src/ingest/`, `src/polite/`, `src/calendar/`, `src/alias/` y `src/model/` sin
una línea.

**Lo que hace falta para volver a verificar:** cerrar F-SPEC-013-7 o —si el gate
humano prefiere aceptarlo— declararlo como residuo **dentro de CA-13**, que es lo
que ADR-016 §6 pide y lo que la spec ya hizo con el SQL compuesto. El verificador
no elige entre las dos: la primera es un diff en `tests/decide/support/rn08.ts`
con su control positivo; la segunda es una decisión de alcance y, por la nota 6
del gate de la propia spec, «hay que decirlo **antes**, no en la verificación».

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-013/. Informe HTML opcional: _qa/SPEC-013/informe.html -->

Previsión: **no aplica**. La spec no tiene superficie de UI. La única HTTP es la
ruta del cron que ya existe (SPEC-012 CA-7), cuyos cuatro casos deben seguir en
verde sin tocar una aserción (CA-12.2).

**Confirmado por el verificador: no aplica.** No hay superficie de UI en el
diff, ni ruta nueva, ni literal visible al usuario. Los cuatro casos de
`tests/ingest/cron.test.ts` y los dos de `tests/ingest/vercel-cron.test.ts`
siguen en verde con el fichero **intacto** (diff vacío). `_qa/SPEC-013/` no se
crea, y Playwright no se usa porque no hay nada que mirar.

## Salvedades / follow-ups
<!-- IDs F-SPEC-013-1, F-SPEC-013-2… con destino (spec futura o EPIC-MEJORA). -->

- **F-SPEC-013-7 — BLOQUEANTE (CA-13). La frontera de RN-08 no ve un `import * as`,
  y esa laguna no está declarada.** Levantado por `sdd-verificador` el
  2026-09-02, **medido**, no razonado.

  **Qué afirma CA-13.** «El conjunto de ficheros que importan
  `PostgresDecisionStore`, `DecisionVersionConflictError` o el tipo
  `DecisionStore` y **no** están en `DECISION_WRITERS` es **vacío**.»

  **La evasión, con su reproducción exacta.** Un fichero nuevo bajo una raíz ya
  declarada, fuera de `DECISION_WRITERS`:

  ```ts
  // src/probe/evasion.ts
  import postgres from 'postgres';
  import * as d from '@/db/decisions';

  export function evade(sql: postgres.Sql): unknown {
    return new d.PostgresDecisionStore(sql);
  }
  ```

  Con ese fichero en el árbol: `npm run lint` **exit=0**; `npm test`
  **114 ficheros / 1108 casos, todos en verde**; `tests/decide/rn08-frontier.test.ts`
  **16/16**; `tests/polite` **124/124**; `tests/site/contact.test.ts` **5/5**. Es
  decir: **los tres gates no se enteran**.

  **Por qué el mecanismo no lo ve.** `decisionImportOffences` cruza dos cosas:
  los `specifier.bindings[].name` —y el binding de un namespace se llama `*`, no
  `PostgresDecisionStore`— y `reading.bareIdentifiers`, que por construcción
  **excluye** el identificador que es `parent.name` de un
  `PropertyAccessExpression`, que es exactamente `d.PostgresDecisionStore`. El
  mecanismo textual tampoco muerde: el nombre de la tabla no aparece en ninguna
  plantilla. **El fichero sí se escanea** —lo prueba el control cruzado: un
  `export { PostgresDecisionStore } from '@/db/decisions';` en la misma ruta pone
  el caso 3 y el 15 en **rojo**—, así que lo que falla es el detector, no el
  escaneo ni las raíces.

  **Por qué esto no es el residuo ya declarado.** CA-13.3 declara un residuo
  concreto: el **nombre de tabla compuesto en tiempo de ejecución**, donde la
  capacidad no cruza ninguna frontera de módulo. Aquí la capacidad **sí cruza
  una frontera de módulo, con un `import` estático y literal**, que es
  precisamente lo que el mecanismo dice cerrar. ADR-016 §6 obliga a declarar lo
  que el mecanismo no alcanza **dentro del criterio**; esto no está declarado en
  ninguna parte.

  **Y el precedente vive en el fichero que este guardián hereda.**
  `tests/polite/support/capability.ts` tiene `namespaceOffences` escrito para
  esta misma forma, con el motivo dicho: «a namespace is the whole export object
  handed over in one binding, so without this the surface would be a formality».
  El lector se heredó; la lección, no.

  **Gravedad, dicha sin inflar.** Hoy no hay ningún fichero así en el árbol: el
  caso 3 sobre el árbol real es honestamente vacío y la lista de tres cruces del
  caso 6 es correcta. Lo que está roto es la **garantía**, no el estado: RN-08
  dice que el motor es la única puerta, y hoy esa puerta se rodea con una línea
  que ningún gate ve.

  **Destino: esta spec, antes del GREEN.** Cerrar es un diff en
  `tests/decide/support/rn08.ts` —mirar `reading.namespaceReads` (o los bindings
  de tipo `namespace`) contra los especificadores vigilados— **con su control
  positivo**, que es lo que ADR-016 §3.4 pide por mecanismo. La alternativa
  legítima es que el gate humano lo acepte como residuo, y entonces se escribe
  dentro de CA-13.3 con destino y disparador; pero eso es alcance, y la nota 6
  del gate de esta misma spec dice que se decide **antes**, no aquí.

  **Cierre — 2026-09-02, `sdd-implementador` (salida «a»: se cierra, no se
  convierte en residuo).** El diff está en `tests/decide/support/rn08.ts` y
  `tests/decide/rn08-frontier.test.ts`, commit `175403d`, y no toca ninguna otra
  cosa: `DECISION_WRITERS` sigue con dos entradas, `DECISION_CAPABILITY_NAMES`
  con tres nombres, y `ALLOWED_PACKAGES`, `ENTRY_POINTS` y las enumeraciones de
  `tests/polite/` sin una línea.

  **Qué mira ahora el mecanismo del NOMBRE.** Tres deletreos del mismo nombre en
  vez de dos: el binding de un `import`/`export`, la referencia desnuda, y la
  **lectura de miembro** —`file.reading.namespaceReads` con `member` en la lista
  vigilada—, que es exactamente lo que el lector heredado ya publicaba y este
  guardián no leía. Cubre de una vez el namespace (`d.X`), su alias
  (`const a = d; a.X`) y el `const d = await import(…); d.X`. Y falla cerrado,
  antes de mirar ningún nombre, ante dos cosas que antes pasaban en silencio: un
  módulo que **el compilador nombra** y este lector no enumeró —así entra
  `import d = require('@/db/decisions')`, cuya declaración el lector no modela—
  y un especificador que no es un literal estático.

  **Y un tercer mecanismo, independiente del nombre.** `decisionHandoverOffences`
  cierra la forma en la que el nombre no hace falta: la **superficie ilegible de
  un módulo con capacidad** —`import * as`, `import()` dinámico, `export *`,
  `export * as`, import de solo efecto—. No es una segunda lista: resuelve el
  especificador con el resolvedor del lector heredado y consulta **la misma**
  `DECISION_WRITERS`, leída en la otra dirección; vaciarla apaga los dos
  mecanismos a la vez, y eso es un caso (13). Es el único que puede ver
  `(await import('@/db/decisions')).PostgresDecisionStore`, donde el miembro
  cuelga de una expresión y no de un identificador: el lector no publica ahí
  ninguna lectura de miembro, y el caso 12 lo afirma en las dos direcciones.

  **La evasión del verificador, reproducida antes y después.** Con
  `src/probe/evasion.ts` —el fichero literal del hallazgo— en el árbol: con el
  guardián de la vuelta anterior, `tests/decide/rn08-frontier.test.ts` **16/16
  en verde**; con el guardián nuevo, **tres casos en rojo**, y los mensajes
  nombran lo que se prohíbe:

  ```
  × 3. el conjunto de ficheros que cruzan la capacidad … es VACÍO
    + "src/probe/evasion.ts: crosses `PostgresDecisionStore` and is not a declared decision writer",
    + "src/probe/evasion.ts: binds the whole namespace `d` of the decision writer src/db/decisions.ts",
  × 10. vaciar la lista de NOMBRES VIGILADOS deja el mecanismo sin medir nada
    + "src/probe/evasion.ts",
  × 13. y vaciar la lista apaga también ESTE mecanismo, que es su control
    + "src/probe/evasion.ts: binds the whole namespace `d` of the decision writer src/db/decisions.ts",
  ```

  Y otras tres formas de la misma familia, escritas como ficheros **reales** bajo
  `src/` y medidas igual, no afirmadas: `export * from '@/db/decisions'` →
  *hands over the whole namespace of the decision writer src/db/decisions.ts*;
  `new (await import('@/db/decisions')).PostgresDecisionStore(sql)` →
  *dynamic import() of the decision writer src/db/decisions.ts*;
  `import d = require('@/db/decisions')` → *the compiler names @/db/decisions and
  the reader did not enumerate it* (y además `tsc` lo rechaza con TS1202: dos
  redes independientes). **Las cuatro sondas se borraron**: el árbol queda limpio.

  **La reexportación en cadena no es residuo, y lleva su caso (20):** quien
  reexporta el nombre lo nombra en su cláusula —incluso renombrándolo, porque el
  binding es el nombre tal y como lo exporta el módulo—, quien reexporta el
  módulo entero entrega la superficie ilegible de un módulo con capacidad, y el
  consumidor vuelve a deletrear el nombre en su propio fichero. Los tres extremos
  son rojos, así que el nombre no llega a nadie sin escribirse donde el lector
  mira.

  **Lo que sigue sin alcanzarse está escrito**, con destino y disparador, en el
  comentario de módulo de `tests/decide/support/rn08.ts` y afirmado por los casos
  19 y 21: la capacidad entregada como **tipo estructural, sin nombrarla**. Ver
  **F-SPEC-013-10**, que es la mitad que este rol no puede escribir: el texto del
  criterio.

- **F-SPEC-013-8 — NO BLOQUEANTE. Una corrección del corresponsal que llega
  tarde queda retenida por RN-05, y CA-5.2 no lo mira.** Levantado por
  `sdd-verificador` el 2026-09-02 leyendo el orden de evaluación.

  **El caso.** La `Decision` vigente es 2-1 sostenida por `ceroacero`, cuya
  última observación sigue diciendo 2-1. Llega una del **corresponsal** (0.8)
  que dice 1-1. Como RN-05 se evalúa antes que RN-04 (F-SPEC-013-3, declarado) y
  el corresponsal **no es árbitro** —`conflictOf` solo exime a la oficial y al
  operador, que es lo que dicen RN-05 y su salvedad—, pasada `CONFLICT_GRACE` la
  discrepancia es conflicto: no se publica nada y se abre alerta `RN-05`.

  **Por qué no bloquea.** La letra de CA-5.2 se cumple en el escenario que el
  criterio describe y en el que el ciclo real produce: con un tick por minuto, la
  primera pasada tras la observación del corresponsal cae **dentro** de la
  gracia y publica. El caso 8 de `tests/decide/rules-precedence.test.ts` prueba
  la escena con la observación del corresponsal sola, sin la de `ceroacero`; la
  escena completa **también** publica dentro de la gracia. Y hoy no hay puerta
  por la que entre una observación de corresponsal.

  **Destino: la spec del bot de Telegram** (EPIC-002, la siguiente), junto a
  **F-SPEC-013-2**, que es el mismo vecindario: qué pasa cuando el humano de
  peso 0.8 contradice a la automática. **Disparador: el día que exista esa
  puerta.**

- **F-SPEC-013-1 — CERRADO por el gate el 2026-09-02 (Alberto Fojo), salida
  (b).** La gracia de RN-05 retenía la publicación, y eso costaba hasta 3 min de
  latencia contra un presupuesto de 120 s. Levantado por `sdd-arquitecto` el
  2026-09-02, **después de la firma**, al trasladar las lecturas de ADR-021 §8 a
  `reglas.md`.

  **Resolución.** `CONFLICT_GRACE` gobierna **solo la alerta**. Durante la
  gracia se publica la observación más reciente marcada *provisional* (RN-03);
  el plazo decide únicamente si se abre alerta, que es lo único que ADR-021 §8.2
  dice que gobierna. **ADR-021 y `reglas.md` no se tocan** y quedan como están:
  la elección era de la spec sobre lo que el ADR dejó abierto.

  **Qué se corrigió en el cuerpo de la spec** (`aprobada`, no `hecho`, así que
  se corrige directamente): **CA-6.1** pasa a decir que durante la gracia se
  publica y `held` es `null`; **CA-6.2** recoge lo que antes decían 6.1 y 6.2
  juntos —pasado el plazo sí es conflicto: alerta, ninguna `Decision`, la
  vigente se mantiene, `held` nombra `RN-05`— con sus dos casos de borde
  afirmando ahora cosas distintas a cada lado; **CA-6.3** es nuevo y fija que el
  plazo gobierna solo la alerta y con qué regla se atribuye lo publicado durante
  ella; **CA-6.4** es nuevo y cierra la oscilación (la monotonía de RN-04 sigue
  aplicando durante la gracia, así que dos fuentes alternándose no hacen
  retroceder el marcador); **CA-6.5** es el antiguo 6.3, y su valor pasa a ser
  que **no hubo alerta** —ya no hay nada retenido que liberar—. Los antiguos
  6.4, 6.5 y 6.6 corren a **6.6, 6.7 y 6.8** sin cambiar de texto.

  **De rebote, dos referencias cruzadas:** **CA-9.1** («RN-05 nunca aparece en
  `rule`») ahora cita CA-6.2 en vez de CA-6.1 y dice explícitamente con qué
  regla se registra lo publicado durante la gracia —el orden normal de RN-12,
  nunca `RN-05`—; y la nota 3 del gate apunta a CA-6.8. La línea de RN-05 en
  *Entidades y reglas afectadas* se precisa igual. **CA-2 no se movió**: su
  «el motor no emite una `Decision` por tick» sigue en pie, porque una entrada
  `time` no trae observación nueva y la tupla publicada no cambia.

  **Lo que no cambió y conviene saber:** el diagnóstico sigue siendo el mismo
  —hoy es **latente**, con una sola fuente automática capturable (ADR-008 §1) no
  puede haber discrepancia entre dos— pero la letra se arregló **antes** de
  implementarla, que era el punto.

  **Y no se escribió bajo `## Enmienda —`, a propósito.** ADR-015 §2 reserva ese
  encabezado para un CA de una spec **cerrada** que ha dejado de poder ser
  cierto, y lo hace índice (`grep -rn "^## Enmienda —" docs/epicas/`). Aquí la
  spec está `aprobada` y no `hecho`, no hay veredicto que anotar y el cuerpo se
  corrige directamente. Comprobado tras el cambio: el `grep` sigue devolviendo
  diez enmiendas reales y ninguna falsa.

  <details><summary>Diagnóstico original, tal como se levantó</summary>

  **Qué dice la spec.** CA-6.1 y CA-6.2 son explícitos: ante dos fuentes ≥ 0.7
  que discrepan y ninguna oficial, «no se emite ninguna `Decision`», y «antes de
  ese plazo no hay alerta **y tampoco hay `Decision`**». La publicación queda
  retenida durante toda la ventana de gracia, y CA-6.3 solo publica cuando la
  rezagada se pone al día.

  **Qué se ve al escribirlo en `reglas.md`.** ADR-021 §8.2 —firmado— define
  cuándo una discrepancia **es** un conflicto: cuando persiste pasada la gracia.
  De ahí se sigue que **antes** de la gracia no es un conflicto, y si no lo es,
  RN-05 no ha disparado y quien debería decidir es RN-03: *mejor provisional a
  tiempo que confirmado tarde*. La spec eligió lo contrario —retener— y no es una
  contradicción con el ADR, que no dice qué pasa durante la gracia; es una
  **elección de la spec sobre lo que el ADR dejó abierto**, tomada sin ponerla al
  lado de la primera cifra de la épica.

  **Por qué importa.** Con dos fuentes, cada gol produce una discrepancia
  transitoria mientras la segunda no lo ve. Reteniendo, cada gol se publicaría
  con hasta `CONFLICT_GRACE` = **3 min** de retraso; el umbral de la métrica de
  latencia de EPIC-002 es **< 120 s**. La regla que existe para no inflar la
  **tercera** cifra desactivaría la **primera**.

  **Por qué no es urgente y aun así hay que decidirlo antes de implementar.** Hoy
  es **latente**, como lo fue la infracción de SPEC-009: solo hay una fuente
  automática capturable (ADR-008 §1), así que no puede haber discrepancia entre
  dos. Deja de serlo el día que vuelva `futgal.es` o entre una segunda fuente —
  que es exactamente el día en el que menos ganas hay de descubrirlo. Y CA-6 se
  implementa **ahora**: escribir la letra actual y cambiarla después cuesta el
  doble.

  **Las dos salidas, y la recomendación.** (a) Dejar CA-6 como está y aceptar el
  coste el día que haya dos fuentes. (b) Publicar durante la gracia lo que dice
  la observación más reciente, marcado *provisional* (RN-03), y que la gracia
  gobierne **solo la alerta** —que es lo único que ADR-021 §8.2 dice que
  gobierna—. **Recomendación de `sdd-arquitecto`: (b)**, y es un cambio de la
  letra de CA-6.1 y CA-6.2, no del ADR ni de `reglas.md`, que quedan intactos.

  **Destino: gate humano, antes de que empiece la implementación de CA-6.**

  **Y no es una enmienda de ADR-015, a propósito.** ADR-015 §2 reserva el
  encabezado `## Enmienda —` para un CA de una spec **cerrada** que ha dejado de
  poder ser cierto, y hace de ese encabezado el índice
  (`grep -rn "^## Enmienda —" docs/epicas/`). Aquí no se ha invalidado nada:
  CA-6 sigue siendo implementable y testable tal como está escrito, la spec está
  `aprobada` y no `hecho`, y no hay ningún veredicto que anotar. Meterlo bajo ese
  encabezado ensuciaría el índice que ADR-015 hace load-bearing.

  </details>

- **F-SPEC-013-2 — Un corresponsal que baja el marcador más de dos goles cae
  entre las dos frases de RN-04, y ninguna manda sobre la otra.** Levantado por
  `sdd-arquitecto` el 2026-09-02 al escribir la aclaración de RN-04 en
  `reglas.md`. **Decisión del gate ese mismo día (Alberto Fojo): se deja abierto
  y sin tocar** — ni quinta aclaración en `reglas.md`, ni cambio en CA-5.

  **El caso, concreto.** La `Decision` vigente dice 5-1. Llega una observación
  del **corresponsal** (0.8) que dice 1-1. Las dos frases de RN-04 apuntan en
  direcciones opuestas y las dos son literales:
  - la **monotonía** se lo **permite**, porque el corresponsal es humano
    —«operador **o** corresponsal», RN-01— y RN-04 deja bajar a la fuente
    oficial o a un humano;
  - la **retención del salto** se lo **retiene**, porque el salto es de más de
    dos goles y su peso es 0.8, por debajo del 0.9 que la aclaración firmada el
    2026-09-02 dejó fuera del alcance de la retención.

  **Y es el caso realista, no el rebuscado:** el corresponsal que se queda sin
  cobertura veinte minutos y escribe cuando la recupera manda de una vez lo que
  vio en ese rato. Un salto grande desde el campo es exactamente lo que se
  espera de esa fuente, no una anomalía.

  **Por qué no se cierra ahora.** No puede darse: **no hay puerta de entrada
  para observaciones de corresponsal**. El bot de Telegram es la spec que la
  trae, y es quien tendrá delante el comportamiento real de la fuente para
  decidir con evidencia en vez de por simetría.

  **Destino: la spec del bot de Telegram** (EPIC-002, la siguiente).
  **Disparador: el día que exista esa puerta** — la primera spec que permita
  persistir una `Observation` con `source` de corresponsal.

  **Estado hoy en el código:** ninguno. CA-5 no lo cubre —CA-5.2 solo prueba una
  bajada de un gol— y **no se le añade nada**: la spec queda deliberadamente
  silenciosa, que es distinto de haberlo resuelto sin mirar.

- **F-SPEC-013-3 — La lectura de RN-05 antes que RN-04 en la cadena de
  evaluación, declarada y no descubierta.** `reglas.md` lista RN-04 antes que
  RN-05, y el reducer evalúa el conflicto **primero**. El motivo está escrito
  en el comentario de módulo de `src/decide/rules.ts`: pasada la gracia, RN-05
  dice que el conflicto **no se publica**, punto, así que no queda ningún
  marcador cuya monotonía siga en cuestión; con el orden literal, `held`
  nombraría `RN-04` en la mitad de los conflictos —siempre que la más reciente
  de las dos discrepantes fuese la más baja— y CA-6.2 solo se cumpliría por
  suerte. Durante la gracia no hay conflicto, así que RN-04 gobierna entera,
  que es justo lo que pide CA-6.4. **No necesita decisión**: se levanta aquí
  para que el verificador la juzgue como lectura declarada y no como hallazgo.

- **F-SPEC-013-4 — «Escalón 1 de RN-12» se implementa exigiendo DISCREPANCIA, y
  CA-9 podría leerse sin ella.** `operatorPrecedence` es cierto cuando el
  operador lidera **y** alguna otra fuente dice algo distinto; un operador solo,
  sin nadie que le contradiga, se registra por el escalón que corresponda
  (`RN-06` si cambia el estado, `RN-02` si no). Es la letra de RN-12 —«la
  `Decision` **resuelve una discrepancia** por precedencia del operador… por
  qué ganó el operador un empate no está en ninguna otra columna»— y lo que
  evita es que `rule` se vuelva un sinónimo de la columna `source` del apoyo.
  Pero **CA-9 dice «una decisión del operador que además cambia el estado
  registra `RN-01`» sin nombrar la discrepancia**, y CA-4.3 lo dice dentro de
  un escenario que sí la tiene. Los tests de esta rama (CA-4 y CA-9 caso 3) se
  escriben **con** discrepancia, que es el escenario que los dos CA describen.
  **Destino: gate humano**, y si la lectura amplia es la buena es un diff de una
  condición en `src/decide/rules.ts` con su caso. **Disparador: la spec del
  panel**, que es la que traerá observaciones de operador de verdad.

- **F-SPEC-013-5 — `productionCronTick` se queda sin llamante en producción.**
  La ruta del cron inyecta ahora `productionCycle` (CA-12.2). `productionCronTick`
  sigue exportado en `src/ingest/cron.ts` —fichero de una spec `hecho`, que no se
  toca— y ya no describe lo que corre cada minuto. Está escrito en el punto 3 de
  la enmienda de ADR-015 del ledger de SPEC-012. **Destino: EPIC-MEJORA**;
  **disparador: la próxima spec que ya tenga que tocar `src/ingest/cron.ts` por
  otro motivo**.

- **F-SPEC-013-6 — `DATABASE_URL_TEST` apunta al *pooler* de Neon y `getaddrinfo`
  no lo resuelve en esta máquina.** Medido el 2026-09-02: `dns.lookup` de Node
  devuelve `ENOTFOUND` para
  `ep-soft-river-b1ocpgd1-pooler.c-5.eu-central-1.aws.neon.tech`, mientras
  `dns.resolve4`, `host` y `dscacheutil` lo resuelven sin problema, y el
  endpoint **directo** —el mismo nombre sin `-pooler`— sí resuelve por
  `getaddrinfo`. `npm run test:db` se corrió exportando `DATABASE_URL_TEST` con
  el endpoint directo; **no se tocó `.env.local`**. Es de entorno, no de código,
  y no cambia lo que los criterios miden: es la misma base. **Destino: nota
  operativa para quien vuelva a correr el gate** (y EPIC-MEJORA si se repite en
  otras máquinas). Súmese a F-SPEC-010-7: la rama de Neon es compartida entre
  worktrees y dos ejecuciones concurrentes se corrompen entre sí.

- **F-SPEC-013-9 — El texto de CA-13 no nombra el residuo que el mecanismo nuevo
  deja, y este rol no puede escribirlo.** Levantado por `sdd-implementador` el
  2026-09-02 al cerrar F-SPEC-013-7.

  **Qué queda fuera.** La capacidad entregada de forma **estructural, sin
  nombrarla**: un módulo que reciba por inyección un
  `{ append: (d: Decision) => Promise<void> }` escrito como tipo anónimo nunca
  deletrea `DecisionStore`, y un mecanismo de **nombres** —que es lo que
  ADR-016 §3.1 pide— no puede verlo. Cerrarlo pide comparar **tipos**, no
  nombres. Hoy no puede pasar sin complicidad: quien compone tiene que tener la
  capacidad, y el único que la tiene es `src/decide/`.

  **Dónde está declarado hoy.** En el comentario de módulo de
  `tests/decide/support/rn08.ts`, con destino y disparador, y afirmado por dos
  casos: el **19** lo ejercita —los tres mecanismos dan vacío sobre un fichero
  que recibe el almacén estructuralmente— y el **21** exige que el módulo lleve
  escritos **dos** «Destino: EPIC-MEJORA; disparador: …», uno por residuo.

  **Por qué es un follow-up y no una omisión.** ADR-016 §6 dice, con esas
  palabras, que la obligación de escribir el residuo **dentro del texto del
  criterio** es «la que este ADR le pone al **autor de la spec**». El
  implementador no edita la spec (contrato del rol), así que la mitad ejecutable
  está hecha y la mitad de letra no puede estarlo desde aquí.

  **Matiz honesto sobre la gravedad.** La letra de CA-13 promete que es vacío «el
  conjunto de ficheros que **importan** `PostgresDecisionStore`,
  `DecisionVersionConflictError` o el tipo `DecisionStore`». Un módulo que recibe
  la capacidad estructuralmente **no importa ninguno de los tres**, así que no
  falsea lo que el criterio afirma —a diferencia de la evasión de F-SPEC-013-7,
  que sí importaba el nombre por namespace—. El mecanismo, además, cierra ahora
  **más** de lo que el criterio promete. Aun así, ADR-016 §6 pide que lo que no
  se alcanza esté nombrado dentro del criterio.

  **Texto propuesto para CA-13.3**, para que sea un paste y no una redacción:
  «**Y un segundo residuo, del mismo rango:** este mecanismo es de **nombres**, y
  no alcanza a la capacidad entregada como **tipo estructural** —un módulo que
  reciba `{ append, getLatestByMatch }` escrito a mano nunca deletrea
  `DecisionStore`—. Cerrarlo pediría comparar tipos. **Destino: EPIC-MEJORA**;
  **disparador: el día que un módulo fuera de `src/decide/` reciba un almacén de
  decisiones por inyección.**»

  **Destino: `sdd-arquitecto` bajo firma del gate, antes del GREEN.** Es una
  frase en CA-13.3 de una spec que está `en-progreso`, no una enmienda de
  ADR-015 (la spec no está cerrada).

- **F-SPEC-013-10 — NO BLOQUEANTE. Carrera entre dos suites cerradas:
  `tests/polite/architecture.test.ts` caso 2d escribe un fichero real bajo `src/`
  y `tests/site/contact.test.ts` caso 5 enumera `src/` a la vez.** Levantado por
  `sdd-implementador` el 2026-09-02, **medido**: en una de cinco ejecuciones de
  `npm test`, `contact.test.ts` caso 5 falló con
  `+ "ingest/robots/hidden-control.ts"` en la lista escaneada. Es el fichero que
  el control positivo de F-SPEC-008-V28 escribe y borra dentro de su `finally`;
  los dos ficheros corren en workers distintos y `src/` es estado compartido.

  **No lo trae esta spec:** los dos ficheros son de specs `hecho` (SPEC-008 y
  SPEC-004), ninguno se toca en esta rama y su recuento no cambia. Las otras
  cuatro ejecuciones dieron 114/1117. **Destino: EPIC-MEJORA**; **disparador: la
  próxima spec que tenga que tocar cualquiera de los dos ficheros**, o la
  segunda vez que un gate se caiga por esto.
Y dos residuos ya **declarados por la spec** antes de implementar, que el
implementador no tiene que descubrir y el verificador no tiene que levantar como
hallazgo:

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

**Estado (2026-09-02, sdd-implementador, SEGUNDA VUELTA tras el RED):** el único
CA abierto era **CA-13**, y **F-SPEC-013-7 está cerrado** (salida «a»: se cierra,
no se convierte en residuo). Commit `175403d` en
`ft/SPEC-013-motor-de-decisiones`, **dos ficheros tocados y ninguno más**:
`tests/decide/support/rn08.ts` y `tests/decide/rn08-frontier.test.ts`. Los tres
gates, corridos de nuevo enteros: `lint` exit=0 · `npm test` **114/1117** ·
`npm run test:db` **22/276**. La spec vuelve a `en-revision`.

**Lo que el verificador debería intentar primero, porque es lo que falló:**
reescribir su evasión y sus variantes. Están todas como casos —6, 7, 8, 9, 11,
12, 20— y tres de ellas se reprodujeron además como ficheros **reales** bajo
`src/` antes de borrarlas. Si encuentra una forma nueva, el sitio donde mirar es
`decisionImportOffences` (el nombre, en sus tres deletreos) y
`decisionHandoverOffences` (la superficie ilegible de un módulo con capacidad).
**Lo que sigue sin alcanzarse está escrito y es F-SPEC-013-9**, que necesita una
frase de `sdd-arquitecto` en el texto de CA-13.3: el implementador no edita la
spec.

**Estado de la primera vuelta (2026-09-02, sin cambios salvo CA-13):** los quince
CA implementados con TDD, todo commiteado en la misma rama (sin push, sin PR: lo
hace el orquestador tras el GREEN).

- **Código nuevo:** `src/decide/` entero —`rules.ts` (el reducer puro),
  `attribution.ts`, `qualifier.ts`, `roles.ts`, `independence.ts`,
  `thresholds.ts`, `alert.ts`, `ports.ts`, `apply.ts`, `replay.ts`,
  `cycle.ts`—, `src/db/alerts.ts` y `migrations/0006_alerts.sql`.
- **Fuera de `src/decide/`, `src/db/` y `migrations/` se tocó UNA cosa:**
  `src/app/api/cron/ingest/route.ts`, la función que inyecta al handler
  (CA-12.2), con su enmienda de ADR-015 escrita en el ledger de SPEC-012.
  `src/ingest/`, `src/polite/`, `src/calendar/`, `src/alias/` y `src/model/`
  **intactos** (CA-12.4, comprobable en el diff y por el caso 7 de
  `tests/decide/cycle-route.test.ts`).
- **Un test de suite cerrada se generalizó, con la vía sancionada:** el caso 1
  de `tests/db/ingest-attempts.test.ts` enumeraba `['0001'…'0005']` y
  `migrations/0006` lo volvió falso **por decisión**. Se generalizó conservando
  todo lo que afirmaba y la enmienda está escrita (F-SPEC-012-3, ADR-015).
  Ningún otro fichero previo cambia, ni de contenido ni de recuento.
- **`ALLOWED_PACKAGES`, `ENTRY_POINTS` y las enumeraciones de `tests/polite/`
  NO se tocaron**: no hizo falta ninguna entrada nueva. `src/decide/` entra en
  el escaneo por las raíces que SPEC-008 CA-2.6 ya declaraba y es alcanzable
  desde la ruta del cron, que ya era `ENTRY_POINTS`.

**Lo que el verificador tiene que mirar con lupa, en este orden:**

1. **CA-6 con la letra NUEVA.** `tests/decide/rules-conflict.test.ts` está
   escrito contra el CA-6 de ocho subpuntos (commit `ae05a98`): durante la
   gracia **se publica** la más reciente marcada provisional y `held` es `null`;
   pasada la gracia no hay `Decision`, hay alerta y `held` nombra `RN-05`.
2. **Los controles positivos de CA-13** (casos 4–15 de
   `tests/decide/rn08-frontier.test.ts`, renumerados en la segunda vuelta): son
   los que dicen si la frontera de RN-08 mide algo, y ahora son **tres
   mecanismos con su control cada uno** (ADR-016 §3.4). El caso **10** enumera
   exactamente los tres ficheros que cruzan la capacidad hoy; el **6** es la
   evasión de F-SPEC-013-7 escrita como caso; el **12** es la forma que el
   mecanismo de nombres **no puede** ver y el de superficie sí; el **13** apaga
   el detector nuevo vaciando la lista.
3. **F-SPEC-013-4**, que es la única lectura de RN-01/RN-12 que esta
   implementación fija y que un CA podría leer de otra manera.
4. **`npm run test:db` necesita `DATABASE_URL_TEST`** y, en esta máquina, el
   endpoint **directo** de Neon (F-SPEC-013-6). Sin él, CA-11 y CA-12 son
   **UNMET, no *skipped***.

**Salidas literales de los tres gates — SEGUNDA VUELTA (2026-09-02, con
F-SPEC-013-7 cerrado):**

```
$ npm run lint
> marcador@0.0.1 lint
> oxlint --type-aware
(sin salida; exit=0)

$ npm test
 Test Files  114 passed (114)
      Tests  1117 passed (1117)
 Type Errors  no errors

$ npm run test:db
 Test Files  22 passed (22)
      Tests  276 passed (276)
```

`npm test` se corrió **cinco veces**: cuatro en 114/1117 y una con
`tests/site/contact.test.ts` caso 5 en rojo por una carrera entre dos suites
cerradas que esta rama no toca — está medida y escrita en **F-SPEC-013-10**.
`npm run test:db` se corrió con `ps aux | grep vitest` en **0** antes de
arrancar, y el endpoint del `.env.local` resolvió sin tocar el fichero.

**Recuento fichero a fichero de la segunda vuelta**, por reporter JSON de
`npm test` contra el commit anterior (`fa4e654`): **114 ficheros / 1108 casos →
114 / 1117**; **cero ficheros añadidos, cero eliminados y exactamente uno con
recuento distinto** —`tests/decide/rn08-frontier.test.ts`, 16 → 25, que es el
fichero de CA-13 y nace en esta rama—. Ningún fichero previo a la rama se movió.

**Recuento fichero a fichero contra `main` (CA-15), primera vuelta.** Comparación por reporter
JSON de `npm test` antes y después: **base 100 ficheros / 919 casos → 114
ficheros / 1108 casos**, con **catorce ficheros nuevos, todos bajo
`tests/decide/`**, y **ningún fichero previo con recuento distinto** —cero en
`tests/mirror`, `tests/site`, `tests/docs`, `tests/model`, `tests/raw`,
`tests/ingest`, `tests/polite`, `tests/alias`, `tests/calendar`, `tests/stores`,
`tests/types` y `tests/migrations`—. En `npm run test:db`: **21 ficheros / 259
casos → 22 / 276**, con **un fichero nuevo** (`tests/db/decide-cycle.test.ts`,
17 casos) y el recuento de `tests/db/ingest-attempts.test.ts` **sin cambiar**
(su caso 1 se generalizó, no se borró).

**Lo que esta spec NO entrega, y estaba dicho:** ninguna de las cuatro cifras,
ninguna pantalla, ninguna entrada humana real. Lo que sí: **`decisions` deja de
estar vacía** —caso 13 de `tests/db/decide-cycle.test.ts`, contra Postgres real—
y `alerts` existe para que la tercera cifra tenga materia.
