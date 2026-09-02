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

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 — pesos y roles de RN-01, fallo cerrado | `src/decide/roles.ts` (tabla `SOURCE_ROLES`, `roleOf` con `UnknownSourceRoleError`, `isHuman`, `isOfficial`; pesos importados de `RN01_WEIGHTS`, nunca copiados) | `tests/decide/roles.test.ts` casos 1–8 (rol⊂claves de `RN01_WEIGHTS`, `defaultRegistry()` cubierto, fallo cerrado con nombre, `isHuman` por los seis roles) · `tests/decide/rules-qualification.test.ts` casos 1–2 (CA-1.2: `ceroacero` con `confidence: 0.95` sale confirmada, y con el peso de la tabla no) | | ❌ |
| CA-2 — RN-02/RN-03 en las cinco ramas | `src/decide/rules.ts` (`decide`: `isConfirmed`, `supporting`, condición de emisión por tupla publicada) | `tests/decide/rules-qualification.test.ts` casos 3–11 (cinco ramas una a una; CA-2.1 caso 5; CA-2.2 casos 6–7 incluidos los caminos de RN-06 timeout y RN-07; CA-2.3 caso 8 —diez entradas `time`, cero decisiones—; CA-2.4 casos 9–11) | | ❌ |
| CA-3 — independencia declarada, lista vacía | `src/decide/independence.ts` (`IndependentPair`, `INDEPENDENT_PAIRS` VACÍA, `declareIndependence`, `PRODUCTION_INDEPENDENCE`) · `src/decide/rules.ts` (`isConfirmed`, vía 2) | `tests/decide/independence.test.ts` casos 1–6 (simetría, falsedad por defecto con `(ceroacero, besoccer)`, forma de la lista) · `tests/decide/rules-qualification.test.ts` casos 12–17 (CA-3.2 lista inyectada confirma con las dos ids; CA-3.3 una en 0.5 no; CA-3.4 caso 16: con `PRODUCTION_CONFIG` el mismo escenario sale provisional) | | ❌ |
| CA-4 — precedencia del operador (RN-01) | `src/decide/rules.ts` (`rank` —empate a 1.0 lo rompe el operador—, `operatorPrecedence`, `conflictOf` con el árbitro) | `tests/decide/rules-precedence.test.ts` casos 1–6 (publica lo del operador confirmado con `rule: RN-01`; CA-4.1 sin alerta y sin retención, también pasada la gracia; CA-4.2 simétrico y el corresponsal que pierde por peso; CA-4.3 gana aunque cambie el estado) | | ❌ |
| CA-5 — RN-04: monotonía y retención | `src/decide/rules.ts` (bloque RN-04: `goesDown`, `jump`, `seconded`; la retención devuelve la propuesta a lo publicado y la cadena sigue) | `tests/decide/rules-precedence.test.ts` casos 7–16 (5.1 retención de bajada; 5.2 corresponsal 0.8 y operador 1.0 con `rule: RN-04`; 5.3 salto de 3 retenido, liberado por segunda fuente con las dos ids, borde en 2 y en 3; 5.4 ≥ 0.9 publica de inmediato; 5.5 sin previa RN-04 no aplica) | | ❌ |
| CA-6 — RN-05: conflicto, alerta y gracia | `src/decide/rules.ts` (`conflictOf`: huella de la discrepancia, árbitro oficial/operador, plazo desde la más reciente) · `src/decide/thresholds.ts` (`CONFLICT_GRACE_MS`) | `tests/decide/rules-conflict.test.ts` casos 1–17 — **letra nueva**: 6.1 casos 1–2 (publica la más reciente, provisional, `held` null); 6.2 casos 3–5 (antes del borde SÍ hay `Decision` y ninguna alerta; después ninguna `Decision`, alerta y `held: RN-05`); 6.3 casos 6–8; 6.4 caso 9 (dos fuentes alternándose no retroceden); 6.5 casos 10–11; 6.6 casos 12–13 (diez `time` → una fila; otros valores → segunda); 6.7 casos 14–15; 6.8 casos 16–17 | | ❌ |
| CA-7 — RN-06: transiciones y tabla cerrada | `src/decide/rules.ts` (`transitionAllowed`, timeout de `kickoff + 110 min` tras RN-04) · `src/decide/thresholds.ts` (`LIVE_LEAD_MS`, `FINISH_TIMEOUT_MS`) | `tests/decide/rules-transitions.test.ts` casos 1–16 (7.1 borde `kickoff − 2 min` a los dos lados; 7.2 las tres vías + una sola automática no cierra + borde del timeout; 7.3 el `finished` por timeout sin apoyo que lo diga → *pendente de confirmar*; 7.4 `postponed`/`suspended`; 7.5 caso 14 enumera las 20 transiciones y exige vacío el resto, casos 15–16 la oficial y el humano a los cinco estados) · `tests/decide/thresholds.test.ts` casos 1–6 (CA-7.6) | | ❌ |
| CA-8 — RN-07: silencio publicado y alertado | `src/decide/rules.ts` (`silence`, `shouldRaiseSilence`, la tupla publicada incluye «la regla es RN-07») · `src/decide/thresholds.ts` (`SILENCE_MS`) | `tests/decide/rules-silence.test.ts` casos 1–12 (8.1 borde de 15 min a los dos lados + alerta; 8.2 una vez por episodio y episodio nuevo tras volver la señal; 8.3 al volver, `RN-03` y deja de ser *sen sinal*, aunque no cambie nada más; 8.4 solo `live`; 8.5 sin observaciones no produce nada) | | ❌ |
| CA-9 — RN-12: la regla decisiva | `src/decide/attribution.ts` (`ATTRIBUTION_ORDER` + `CONDITIONS`, una sola declaración del orden) | `tests/decide/attribution.test.ts` casos 1–15 (un caso por escalón, un caso por par adyacente, las 32 combinaciones sin RN-05, vocabulario cerrado, RN-02/RN-03 nunca concurren) · `tests/decide/rules-attribution.test.ts` casos 1–10 (los tres pares que el CA nombra, atravesando el reducer; CA-9.1 casos 5–8) | | ❌ |
| CA-10 — los cuatro cualificadores derivados | `src/decide/qualifier.ts` (`qualifierOf`, pura y total, en el orden de ADR-021 §6) | `tests/decide/qualifier.test.ts` casos 1–12 (uno por valor, orden, totalidad sobre 5 estados × 2 × 6 reglas × 3 apoyos, `finished` con apoyo que lo dice, y `sen_sinal` + `provisional: true` a la vez) · `tests/decide/cycle-route.test.ts` casos 9–10 y `tests/db/decide-cycle.test.ts` caso 4 (CA-10.4: ninguna columna nueva) | | ❌ |
| CA-11 — aplicador, versión arbitrada, `alerts` | `src/decide/apply.ts` (`applyEngine`, reintento único ante `DecisionVersionConflictError`) · `src/db/alerts.ts` (`PostgresAlertStore`) · `migrations/0006_alerts.sql` · `src/decide/ports.ts` (`AlertStore`, `LatestAlerts`) · `src/decide/alert.ts` (esquemas zod, NO modelo canónico) | `tests/db/decide-cycle.test.ts` casos 1–12 (fila válida releída con `DecisionSchema`, apoyo del mismo partido, `decided_at` como cadena `Z`; 11.1 las seis migraciones y segunda ejecución `[]` + columnas de `alerts`; 11.2 `update` y `delete` rechazados; 11.3/11.4 casos 8–10 con escritura concurrente REAL; 11.5 casos 11–12) — **requiere `DATABASE_URL_TEST`** | | ❌ |
| CA-12 — el ciclo dentro del tick y la ruta | `src/decide/cycle.ts` (`runCycle`, `composeCyclePorts`, `productionCycle`) · `src/app/api/cron/ingest/route.ts` (UNA línea: `tick: productionCycle`) · enmienda de ADR-015 en el ledger de SPEC-012 | `tests/db/decide-cycle.test.ts` casos 13–16 (una invocación persiste `Observation` Y `Decision`; el motor después de la ingesta; fuera de ventana nada; un fallo del motor no revierte la ingesta) · `tests/decide/cycle-route.test.ts` casos 1–8 (12.2 la ruta y `src/ingest/cron.ts` intacto; 12.3 las cinco partes de las DOS enmiendas; 12.4 nadie de las specs cerradas importa `@/decide`) · `tests/ingest/cron.test.ts` y `tests/ingest/vercel-cron.test.ts` pasan sin tocar una aserción | | ❌ |
| CA-13 — RN-08: la frontera y su residuo | `tests/decide/support/rn08.ts` (`DECISION_WRITERS` con DOS entradas y su motivo, `DECISION_CAPABILITY_NAMES`, los dos mecanismos) — el lector se hereda de `tests/polite/support/capability.ts` | `tests/decide/rn08-frontier.test.ts` casos 1–16 (conjunto vacío sobre el árbol real; 13.1 control positivo por mecanismo —import, tipo, lista de nombres vaciada, mecanismo textual—; 13.2 fichero inparseable rojo + un solo lector; 13.3 el residuo con su ejemplo ejecutable, destino y disparador; 13.4 sin exenciones por nombre; 13.5 `src/ingest/` limpio y la dirección del grafo) | | ❌ |
| CA-14 — replay determinista | `src/decide/replay.ts` (`replayMatch`, `replayInstants`, sin reloj ni base) | `tests/decide/replay.test.ts` casos 1–9 (material sintético archivado y releído por `adapter.read` sin red; 14.1 comparación profunda dos veces + el log de la jornada; 14.3 `Date.now` envenenado con su control positivo; 14.4 `tests/fixtures/` sin un byte de HTML de terceros) · `tests/db/decide-cycle.test.ts` caso 17 (**CA-14.2**: el replay coincide con el log del ciclo REAL) | | ❌ |
| CA-15 — los tres gates y las suites enteras | — | `npm run lint` exit=0 · `npm test` 114 ficheros / 1108 casos · `npm run test:db` 22 ficheros / 276 casos. Recuento fichero a fichero contra `main`: **ningún fichero previo cambia de recuento** (comparación por reporter JSON, abajo) | | ❌ |


## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-013/. Informe HTML opcional: _qa/SPEC-013/informe.html -->

Previsión: **no aplica**. La spec no tiene superficie de UI. La única HTTP es la
ruta del cron que ya existe (SPEC-012 CA-7), cuyos cuatro casos deben seguir en
verde sin tocar una aserción (CA-12.2).

## Salvedades / follow-ups
<!-- IDs F-SPEC-013-1, F-SPEC-013-2… con destino (spec futura o EPIC-MEJORA). -->

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

**Estado (2026-09-02, sdd-implementador):** los quince CA implementados con TDD,
los tres gates en verde, todo commiteado en `ft/SPEC-013-motor-de-decisiones`
(sin push, sin PR: lo hace el orquestador tras el GREEN). La spec está en
`en-revision`.

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
2. **Los controles positivos de CA-13** (casos 4–9 de
   `tests/decide/rn08-frontier.test.ts`): son los que dicen si la frontera de
   RN-08 mide algo. El caso 6 enumera exactamente los tres ficheros que cruzan
   la capacidad hoy.
3. **F-SPEC-013-4**, que es la única lectura de RN-01/RN-12 que esta
   implementación fija y que un CA podría leer de otra manera.
4. **`npm run test:db` necesita `DATABASE_URL_TEST`** y, en esta máquina, el
   endpoint **directo** de Neon (F-SPEC-013-6). Sin él, CA-11 y CA-12 son
   **UNMET, no *skipped***.

**Salidas literales de los tres gates (2026-09-02):**

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

**Recuento fichero a fichero contra `main` (CA-15).** Comparación por reporter
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
