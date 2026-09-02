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
| CA-1 | `src/ingest/windows.ts` | `tests/ingest/windows.test.ts` (9 casos: bordes de ventana, jornada `[from,to)`, lista vacía, POST en su único sitio, cadena `Z`) | Leído el fichero y los 9 casos: los cuatro bordes exactos de la ventana, `[from,to)` con un caso por borde, lista vacía → nada, POST movido en su único sitio (parámetro `MatchWindowBounds`, el 150 no está repetido en `src/`), instante no-`Z` revienta con nombre. `npm test` verde | ✅ |
| CA-2 | `src/ingest/tick.ts` (`runIngestTick`, `composeTickPorts`), `src/ingest/measurement.ts` | `tests/db/ingest-tick.test.ts` casos 1–3, 8–9 (una petición al par elegible, ritmo durable con composición nueva por tick, sin elegibles nada, instante `Z`) | Conducido contra Neon real vía `npm run test:db`: caso 3 una petición al elegible y cero al otro, `request_rhythm` sin fila del no elegible; caso 8 composición NUEVA en el mismo minuto → nada; caso 9 +60 s → una página; casos 1–2 sin elegibles/lista vacía → ni turno ni fila; `summary.at`, `observed_at` y `attempted_at` son la cadena `Z` del reloj inyectado | ✅ |
| CA-3 | `src/polite/policy-durable.ts` (`DurablePolicyGate`, `robotsTurnKey`) | `tests/polite/policy-durable.test.ts` (7 casos, mitad de unidad) + `tests/db/ingest-tick.test.ts` casos 3, 9–13 (conducción: 3.1 orden robots→página, 3.2 sin robots dentro de 6 h, 3.3 caducidad, 3.4 fallo cerrado + turno, 3.5 control positivo con `RobotsGate` en memoria, 3.7 URL prohibida). 3.6: `parseRobots` reutilizado — comprobable en el diff | Los 7+6 casos ejecutados en verde con base real. 3.1 robots ANTES que la página y archivado bajo `ceroacero/robots/` antes de parsear; 3.2 caso 9: cero robots con composición nueva; 3.3 caso 10: a las 6 h exactas lo pide UNA vez; 3.4 caso 11: fallo cerrado, motivo con RN-11, y un solo intento de robots en el minuto entre dos ticks; 3.5 caso 12: `[1,1]` afirmado como esperado (ver observación en veredicto); 3.6 comprobado en el diff — `policy-durable.ts` importa `parseRobots` y no parsea nada más, y `RobotsGate` no lee el archivo para decidir (solo su `Map`); 3.7 caso 13: `skipped` con la frase de `robotsSkipReason`, cero bytes de página | ✅ |
| CA-4 | `src/ingest/tick.ts` (`settle`: relectura del archivo, resolver real, `append`) | `tests/db/ingest-tick.test.ts` casos 4–7, 14 (una fila validada con `raw_ref` del tick, no resueltos íntegros, temporada declarada, replay inofensivo, `decisions` vacía) | Caso 4: EXACTAMENTE una fila, `ObservationSchema.parse` sobre lo leído de la base, `source ceroacero`, `confidence 0.7` (del registro, `RN01_WEIGHTS.aggregator`), `observed_at = T1`, `raw_ref` del objeto archivado por ese tick y `match_id` del calendario; caso 5: los DOS nombres de la fila irresoluble íntegros en el registro; caso 14: cambiar la temporada declarada deja la misma fila sin resolver; caso 7: replay del mismo cuerpo archivado deja `observations` idéntica y sin tocar la red; caso 6: `decisions` vacía | ✅ |
| CA-5 | `migrations/0005_ingest_attempts.sql`, `src/ingest/attempts.ts`, `src/db/ingest-attempts.ts` | `tests/db/ingest-attempts.test.ts` casos 4–6 (fila entera, motivo obligatorio, `reject_amendment`) + `tests/db/ingest-tick.test.ts` casos 5, 8, 15–16 (5.1 fallo no impide el siguiente; 5.3 suprimido/no elegible sin fila) | Fila entera con instante `Z`, `CHECK (outcome='ok') = (reason is null)` verificado en las dos direcciones y `outcome` inventado rechazado; caso 15 (archivo revienta) y 16 (persistencia revienta): `failed` con motivo y el segundo par se intenta igual; `update`/`delete` rechazados por `reject_amendment` en la base; suprimido y no elegible sin fila (casos 1, 2, 8) | ✅ |
| CA-6 | `migrations/0005_ingest_attempts.sql` | `tests/db/ingest-attempts.test.ts` casos 1–3 (`['0001'..'0005']`, segunda `[]`, columnas); paridad sin entradas nuevas y suite `tests/db/` previa intacta: `npm run test:db` completo | `migrate` → `['0001'..'0005']` y segunda `[]` contra esquema vacío real; `tests/db/parity.test.ts` sin diff contra `main` y sin mención a `ingest_attempts` (no es modelo canónico); suite `tests/db/` 21/21 en verde. SALVEDAD: la letra «sin tocar una aserción» se incumple en `tests/db/alias-schema.test.ts` (2 aserciones enumerantes → derivadas de `readMigrations`), F-SPEC-012-3; sustancia íntegra (0004 existe y es cuarta, `['0001'..'0004']` en orden, 8/8 casos), enmienda ADR-015 registrada en el ledger de SPEC-011 | ⚠️ |
| CA-7 | `src/ingest/cron.ts` (`cronIngestHandler`), `src/app/api/cron/ingest/route.ts` | `tests/ingest/cron.test.ts` (4 casos: sin header, bearer malo, sin `CRON_SECRET` con header, 200 con resumen JSON; espía afirma no-invocación) | Los 4 casos en verde: 401 sin invocar el tick (espía a 0) en los tres rechazos, incluido `CRON_SECRET` ausente Y vacío con header presente (fallo cerrado); 200 con el resumen JSON. Leído el diff de `route.ts`: 19 líneas, solo liga `cronIngestHandler({tick: productionCronTick, env: process.env})` al App Router — cero lógica de ingesta. Entrada declarada en `ENTRY_POINTS` con motivo | ✅ |
| CA-8 | `vercel.json`, `CRON_INGEST_PATH` en `src/ingest/cron.ts` | `tests/ingest/vercel-cron.test.ts` (2 casos: un cron `* * * * *` contra la constante; el fichero de la ruta existe donde ella dice) | UN cron, `schedule` `* * * * *`, `path` comparado contra `CRON_INGEST_PATH` importada (ningún segundo literal), y `src/app/api/cron/ingest/route.ts` existe donde la constante dice. `vercel.json` leído: exactamente eso y nada más | ✅ |
| CA-9 | `src/ingest/tick.ts` (la consulta de elegibilidad va antes que toda petición) | `tests/ingest/tick-fails-closed.test.ts` (1 caso: `Sql` roto → cero peticiones, cero archivo, error nombrando la causa) | Caso en verde: `composeTickPorts` con `Sql` que revienta → cero peticiones (ni robots ni página), `store.size === 0`, y el error sale nombrando `database is down: connection refused`. En el código la consulta `listKickoffsBetween` es lo primero que toca la base, antes de todo fetch | ✅ |
| CA-10 | — | salidas literales abajo; recuento fichero a fichero contra `main` sin pérdidas (solo altas); `ENTRY_POINTS` +1 con motivo | Los tres gates ejecutados por el verificador (salidas literales abajo, coinciden con las del implementador). Recuento propio contra `main`: cero ficheros de test borrados; los tres tocados conservan sus casos (`alias-schema` 8→8, `architecture` 50→50, `containment` 21→21); resto de suites byte-idéntico a `main` (git diff). Diffs del guardián con motivo escrito en el propio fichero: `ENTRY_POINTS` +ruta, enumeración de `src/polite/` +`policy-durable.ts`, `DRIVEN` +ruta. Ningún paquete ni global nuevo | ✅ |

## Gates (CA-10) — salidas literales

- `npm run lint` → `oxlint --type-aware` → **exit 0**, sin avisos.
- `npm test` → `Test Files  100 passed (100) · Tests  919 passed (919) · Type Errors  no errors` (exit 0).
- `npm run test:db` → `Test Files  21 passed (21) · Tests  259 passed (259) · Duration 145.81s` (exit 0) — la suite `tests/db/` previa entera más las dos altas de esta spec, contra la Neon test branch real.
- Recuento contra `main` (mismo patrón que SPEC-009 CA-7): ningún fichero de suite cerrada pierde casos — `tests/polite/architecture.test.ts` 50→50, `tests/polite/containment.test.ts` 21→21, resto sin tocar. Altas: `tests/ingest/{windows,cron,vercel-cron,tick-fails-closed}.test.ts`, `tests/polite/policy-durable.test.ts`, `tests/db/{ingest-attempts,ingest-tick}.test.ts`.
- Diffs con motivo en el guardián (SPEC-008 CA-2.3, previstos por CA-10): `ENTRY_POINTS` gana `src/app/api/cron/ingest/route.ts`; el caso 2 de `architecture.test.ts` (enumeración de `src/polite/`) gana `policy-durable.ts`; el caso 13 de `containment.test.ts` añade la ruta a `DRIVEN` — los tres con su motivo escrito en el propio fichero. Ningún paquete ni global nuevo: `Response.json` se evitó usando `new Response` (la superficie concedida).

## Veredicto del verificador

**GREEN** — 2026-09-02, `sdd-verificador`. 9/10 CA en ✅ y CA-6 en ⚠️ con la
salvedad escrita (F-SPEC-012-3), juzgada aceptable: la letra «sin tocar una
aserción» de CA-6 es internamente contradictoria con su propia primera cláusula
(`migrate` → `['0001'..'0005']`), y la vía sancionada para exactamente este caso
es ADR-015, seguida al pie de la letra (enmienda en el ledger de SPEC-011,
sustancia de su CA-8 íntegra, 8/8 casos). El gate humano la ratifica en el PR.

Los tres gates los ejecuté yo (salidas literales abajo, sección Gates):
`npm run lint` exit 0 · `npm test` 100 ficheros / 919 tests / sin errores de
tipos, exit 0 · `npm run test:db` 21 ficheros / 259 tests contra la Neon test
branch real, exit 0. Recuento contra `main` hecho de nuevo por mí: cero
pérdidas, tres altas de suite (`tests/ingest/` ×4 ficheros ya existía el
directorio, `tests/polite/policy-durable.test.ts`, `tests/db/` ×2).

El flujo real está conducido de verdad, con composición construida DE NUEVO por
tick como exige la spec: los 16 casos de `tests/db/ingest-tick.test.ts` recorren
fuente → robots archivado antes de parsear → página archivada → relectura del
archivo → resolver real de SPEC-011 con temporada declarada →
`ObservationStore.append` contra Postgres real, y `decisions` queda vacía
(RN-08). Los ficheros `hecho` de SPEC-008/010/011 están intactos (git diff
contra `main`: cero cambios en `src/mirror/`, `src/calendar/`, `src/alias/`,
`src/ingest/{adapter,ceroacero,observations,ports,sources}.ts`). ADR-019 y
ADR-020 están `aprobada` firmados por Alberto Fojo (2026-09-02): los CA se
juzgaron contra la decisión firmada.

**Observación (no bloquea, sin F):** el control positivo de CA-3.5 (caso 12 de
`ingest-tick.test.ts`) usa un raw store NUEVO por composición en vez del
compartido de la conducción de CA-3.2, así que su `[1,1]` no discrimina por sí
solo entre el gate en memoria y el durable (con archivo vacío ambos pedirían).
La demostración completa existe en agregado: el caso 9 (durable, archivo
compartido → CERO robots) más la lectura del código (`RobotsGate.allows` nunca
consulta el archivo para decidir: solo su `Map`) cierran el argumento. Si
alguien quiere el control en un solo caso, es cambiar `store` por el compartido
— EPIC-MEJORA como mucho.

Fuera de los CA: **el mecanismo entero queda desplegable pero inerte** —
`MEASUREMENT_WINDOWS` nace vacía en `src/ingest/measurement.ts` y lo verifiqué
(la lista es `[]` y los casos 1–2 demuestran que con ella nada sale) — y la
primera jornada real sigue teniendo sus dos precondiciones escritas (dictamen
de `sdd-legal-datos` y fecha de purga, ADR-020 §3).

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-012/. Informe HTML opcional: _qa/SPEC-012/informe.html -->

No aplica: la spec no tiene superficie de UI. La única HTTP es la ruta del
cron, verificada por sus 4 casos de handler y la lectura del diff.

## Salvedades / follow-ups
<!-- IDs F-SPEC-012-1, F-SPEC-012-2… con destino (spec futura o EPIC-MEJORA). -->

- **F-SPEC-012-1 — Los dos términos de `dominio.md` siguen sin añadirse.** La spec manda añadir «ventana de partido» y «jornada de medición declarada» «en el mismo commit que esta spec», y el commit de la spec (`c7bc6b7`) no los trajo. El implementador intentó añadirlos transcribiendo ADR-019 §2 y §3 y el hook de documentos de verdad lo denegó (dueños: `sdd-arquitecto`, `sdd-producto`), que es lo correcto. El texto propuesto va en el informe del implementador; **destino: `sdd-arquitecto` antes del cierre de la spec** — el glosario manda añadir un término antes de usarse, y ya se usa.
- **F-SPEC-012-3 — CA-6 dice «sin tocar una aserción» y hubo que tocar dos, y es una contradicción interna de la spec, no una licencia.** `tests/db/alias-schema.test.ts` (SPEC-011 CA-8) afirmaba `toHaveLength(4)` y `['0001'..'0004']`: la propia decisión de CA-6 (añadir `0005`) las vuelve falsas sin defecto — la forma exacta de F-SPEC-008-1, que `tests/db/migrate.test.ts` ya resolvió generalizando la enumeración. Se aplicó el mismo arreglo, conservando TODO lo que el caso afirmaba (0004 existe y es cuarta; las cuatro primeras versiones en orden; primera pasada aplica todo, segunda nada; una fila por versión) y sin perder ningún caso (recuento 21→21 del fichero intacto en número). **La letra de CA-6 queda incumplida a sabiendas; decide el gate humano** — la alternativa era un RED mecánico por una aserción que enumeraba.
- **F-SPEC-012-2 — El borde exacto `kickoff = t + PRE` no entra en la consulta, sí en el predicado.** La spec fija la consulta literal `listKickoffsBetween(t − POST, t + PRE)`, cuyo intervalo es `from ≤ kickoff < to` (SPEC-010): un partido con `kickoff` exactamente igual a `t + PRE` es elegible para la función pura de CA-1 pero la consulta de ese tick no lo trae; entra en el tick siguiente (60 s después, aún 9 min antes del kickoff). Efecto máximo: un tick de retraso en el instante exacto de apertura de ventana, con reloj a granularidad de minuto. Se implementó la letra de la spec; si se quiere cerrar el borde es un `+1 ms` en el `to` — **destino: EPIC-MEJORA** (o el gate decide que el comportamiento actual es el querido).

**Juicio del verificador sobre las tres salvedades (2026-09-02):**

- **F-SPEC-012-1 — aceptable con residuo, y con dueño y plazo.** Verifiqué que
  «ventana de partido» y «jornada de medición declarada» NO están en
  `dominio.md` (grep), y que la spec los usa. El implementador no puede
  añadirlos (hook de documentos de verdad, correcto) ni yo tampoco. No cuelga
  de ningún CA, así que no tumba el veredicto, pero es un mandato del cuerpo de
  la spec («en el mismo commit que esta spec») que sigue incumplido: **el
  orquestador tiene que encargárselo a `sdd-arquitecto` antes del merge del
  PR**, no «algún día».
- **F-SPEC-012-3 — aceptable con residuo; es la salvedad de CA-6 (⚠️).**
  Contradicción interna de la spec, resuelta por la única vía legal (ADR-015).
  Leí el diff de `alias-schema.test.ts`: todo lo que SPEC-011 CA-8 afirmaba
  sigue afirmado (0004 en disco y cuarta, `['0001'..'0004']` en orden, primera
  pasada todo / segunda nada, una fila por versión), 8→8 casos, y la enmienda
  en el ledger de SPEC-011 tiene las cinco partes de ADR-015 §3. La red menor
  está dicha sin suavizar y su nuevo dueño (`ingest-attempts.test.ts`) enumera
  las cinco. Ratificación final: gate humano en el PR.
- **F-SPEC-012-2 — aceptable con residuo; destino EPIC-MEJORA.** Comprobado en
  el código: la consulta es literalmente la que la spec fija
  (`listKickoffsBetween(t − POST, t + PRE)`, intervalo `[from, to)` en
  SPEC-010), y el predicado puro de CA-1 es literalmente el de ADR-019 §2. La
  discrepancia en el borde `kickoff = t + PRE` es de la spec consigo misma, no
  del implementador; efecto máximo un tick de retraso (60 s) en la apertura de
  ventana, dentro aún de los 10 min de PRE. Ningún CA la toca. Si se quiere
  cerrar, es un diff de una línea con su test — EPIC-MEJORA.

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->

**Estado (2026-09-02, sdd-implementador):** los diez CA implementados con TDD, gates en verde, todo commiteado en `ft/SPEC-012-cron-de-ingesta` (sin push: lo hace el orquestador tras el GREEN).

- **Código nuevo:** `src/ingest/windows.ts` (elegibilidad pura, PRE/POST), `src/ingest/measurement.ts` (jornadas declaradas — VACÍA — y `ACTIVE_SEASON`), `src/ingest/attempts.ts` (puerto del registro), `src/ingest/tick.ts` (`runIngestTick` + `composeTickPorts`), `src/ingest/cron.ts` (`CRON_INGEST_PATH`, `cronIngestHandler`, `productionCronTick`), `src/polite/policy-durable.ts` (`DurablePolicyGate`), `src/db/ingest-attempts.ts`, `migrations/0005_ingest_attempts.sql`, `src/app/api/cron/ingest/route.ts`, `vercel.json`.
- **Ficheros `hecho` de SPEC-008/010/011: intactos** (ADR-011 §6). Los tres únicos tests previos tocados son diffs con motivo: `capability.ts` (ENTRY_POINTS +1), `architecture.test.ts` caso 2 (+`policy-durable.ts` en la enumeración de polite), `containment.test.ts` caso 13 (DRIVEN +ruta), y la enmienda F-SPEC-008-1-style de `alias-schema.test.ts` (F-SPEC-012-3).
- **Para verificar:** conducir el tick con composición nueva por tick (los tests de `tests/db/ingest-tick.test.ts` son exactamente esa conducción); los controles positivos de CA-3.5 están en el caso 12 de ese fichero y en `policy-durable.test.ts`; CA-3.6 (ningún parser nuevo) se comprueba en el diff — `policy-durable.ts` importa `parseRobots` y no parsea nada por su cuenta.
- **Pendiente de otros roles:** F-SPEC-012-1 (términos de `dominio.md`, bloqueados por el hook de documentos de verdad — texto propuesto en el informe del implementador), decisión del gate sobre F-SPEC-012-3 (letra de CA-6) y F-SPEC-012-2 (borde `t + PRE` de la consulta). El runbook de jornada de medición es del documentalista tras el GREEN.
- **Despliegue (fuera de esta spec):** `CRON_SECRET` tiene que existir en el entorno de Vercel o el cron responderá 401 a todo (fallo cerrado deliberado, CA-7); `DATABASE_URL` y `BLOB_READ_WRITE_TOKEN` los leen `productionCronTick`/`BlobRawStore`.

## Enmienda — 2026-09-02: F-SPEC-012-1 cerrado

**F-SPEC-012-1 — Los dos términos de `dominio.md` ya están añadidos** (commit `692b2d4`, sdd-arquitecto). Terminología canónica registrada: **ventana de partido** (intervalo `[kickoff − PRE, kickoff + POST)` de elegibilidad) y **jornada de medición declarada** (intervalo declarado de ingesta, lista cerrada y versionada).

## Enmienda — 2026-09-02: SPEC-013 cambia la LETRA de CA-7 — la ruta delega en el ciclo del motor

**Esto es una enmienda, no una reapertura.** SPEC-012 sigue en `hecho`, su
veredicto sigue siendo GREEN y no se ha tocado una línea del cuerpo de la spec.
La forma es la de ADR-015 §2 y §3, y quien la registra es quien invalida
(ADR-015 §5): **ADR-021 §4 la anunció en su propia decisión**, nombrando el CA,
y SPEC-013 CA-12.3 la exige por escrito antes de dar el criterio por cerrado.

1. **Qué afirmaba CA-7 y por qué era razonable.** CA-7 exige que
   `src/app/api/cron/ingest/route.ts` autentique con `CRON_SECRET`, falle
   cerrado sin él, no contenga lógica y **«delegue entera en la función del
   tick de `src/ingest/`»**. Cuando se escribió, el tick ERA todo el trabajo de
   la invocación: SPEC-012 termina en `ObservationStore.append` y su CA-4.4
   afirma, como resultado esperado, que `decisions` sigue vacía. Con el motor
   sin existir, «la función del tick de `src/ingest/`» y «todo el trabajo de la
   invocación» eran la misma frase.

2. **Qué lo invalida.** **ADR-021 §4** (aprobado por Alberto Fojo el
   2026-09-02) y **SPEC-013 CA-12**: el motor de decisiones corre **dentro del
   mismo tick, después de la ingesta y en la misma invocación**, y el ciclo
   completo vive en `src/decide/cycle.ts`, que llama a `runIngestTick`. El
   motivo que decide es la **latencia** —la cifra de EPIC-002 exige < 120 s y
   un segundo cron regalaría hasta 60 s de un presupuesto que la ingesta ya
   gasta a medias—, y el motivo que fija la DIRECCIÓN es RN-08: SPEC-008 CA-12
   prohíbe que `src/ingest/` mencione `DecisionStore`, así que es el motor
   quien llama a la ingesta y nunca al revés.

3. **Con qué se sustituye, y si la red que queda es menor.** La ruta pasa a
   inyectar `productionCycle` (`@/decide/cycle`) en lugar de
   `productionCronTick` (`@/ingest/cron`). Es **una línea** —más la línea del
   `import`— y **nada más** del fichero cambia. La sustancia de CA-7 queda
   entera y sigue mecanizada por el mismo guardián: los **cuatro casos** de
   `tests/ingest/cron.test.ts` pasan **sin tocar una aserción**, porque
   `cronIngestHandler` sigue recibiendo la función por inyección y sigue sin
   invocarla cuando la autenticación falla. `src/ingest/cron.ts` **no se toca**:
   conserva `CRON_INGEST_PATH`, `cronIngestHandler` y `productionCronTick`.
   **La red NO es menor, y se dice sin suavizar dónde sí cambia algo:**
   `productionCronTick` deja de tener llamante en producción — sigue exportado,
   sigue probado por los casos que lo cubrían y ya no describe lo que el cron
   hace. Quien lea `src/ingest/cron.ts` buscando «qué corre cada minuto» tiene
   que ir a `src/decide/cycle.ts`. Esa desorientación es el precio, y esta
   enmienda es el sitio donde queda escrita.

4. **El veredicto sigue en pie.** El GREEN de SPEC-012 (2026-09-02) juzgó la
   autenticación, el fallo cerrado, la ausencia de lógica en la ruta y el
   `vercel.json` con **un** cron a `* * * * *`; nada de eso ha cambiado.
   **CA-8 sigue intacto y comprobado por su propio test sin tocarlo**
   (`tests/ingest/vercel-cron.test.ts`, dos casos). Lo único que cambia es
   **qué función** se le inyecta al handler.

5. **Qué lo despierta.** El día que el ciclo deje de caber en una invocación de
   Vercel —con veinte competiciones, no con dos— la respuesta escrita en
   ADR-021 §Consecuencias es **partir el cron**, no adelgazar el motor; y ese
   día `vercel.json` declararía dos crones y CA-8 dejaría de ser cierto de
   verdad, lo que exigiría su propia enmienda. También lo despierta cualquier
   cambio que devuelva lógica a `route.ts`: la sustancia de CA-7 es que la ruta
   no decide nada, y eso no lo enmienda esta nota.

Registrado por `sdd-implementador` de SPEC-013 (ADR-015 §5).

## Enmienda — 2026-09-02: `migrations/0006` invalida la aserción enumerante de CA-6

**Esto es una enmienda, no una reapertura.** SPEC-012 sigue en `hecho` y su
veredicto sigue siendo GREEN. Es la **quinta** vez que una migración nueva
rompe una aserción que enumera las migraciones (F-SPEC-008-16 sobre SPEC-001
CA-13; SPEC-008 CA-14 sobre la misma; SPEC-010 CA-10; SPEC-011 CA-8), y la
enmienda de SPEC-011 la dejó anticipada palabra por palabra: «heredará esta
misma enmienda el día de `0006`». Es F-SPEC-012-3 llegando a su vencimiento.

1. **Qué afirmaba CA-6 y por qué era razonable.** CA-6 exige que
   `migrations/0005` se aplique en orden tras `0001..0004`, sin rollback, y que
   una segunda ejecución no aplique nada. Su guardián,
   `tests/db/ingest-attempts.test.ts`, lo mecanizaba **enumerando**:
   `expect(await migrate(sql)).toEqual(['0001','0002','0003','0004','0005'])`.
   El 2026-09-02 `0005` era la última migración y la lista literal era la
   aserción más fuerte escribible.

2. **Qué lo invalida.** `migrations/0006_alerts.sql`, que **SPEC-013 CA-11**
   (aprobada por Alberto Fojo el 2026-09-02) ordena crear, con ADR-021 §5: la
   tabla `alerts`, append-only, que es la materia prima de la tercera cifra de
   EPIC-002. Desde que existe una sexta migración, una aserción que enumera
   cinco no puede ser cierta, y reapuntarla a seis la dejaría falsa otra vez el
   día de `0007`.

3. **Con qué se sustituye, y si la red que queda es menor.** El caso 1 pasa a
   derivarse del descubridor (`readMigrations`), conservando entera la
   sustancia de CA-6: `migrate` aplica **exactamente lo que hay en disco**, en
   orden lexicográfico (comprobado), las **cinco** versiones que CA-6 conocía
   siguen estando (comprobadas una a una), la lista tiene al menos cinco
   entradas —así que no puede pasar descubriendo nada— y la segunda ejecución
   sigue devolviendo `[]` (caso 2, intacto). La red **ES menor** en el mismo
   punto que en las cuatro enmiendas anteriores y se dice sin suavizar: el caso
   ya no falla si aparece una migración posterior que CA-6 no conocía. Desde
   hoy esa información la da `tests/db/decide-cycle.test.ts` (SPEC-013 CA-11.1),
   que enumera las seis y heredará esta misma enmienda el día de `0007`. Ningún
   otro caso del fichero cambia; el recuento del fichero no cambia.

4. **El veredicto sigue en pie.** El GREEN de SPEC-012 juzgó la migración
   `0005` y el registro durable de intentos contra la base real; nada de eso ha
   cambiado. Lo único que cambia es cómo el guardián nombra «todas las
   migraciones».

5. **Qué lo despierta.** El mismo despertador que las cuatro anteriores: si
   `readMigrations` dejara de ser la autoridad sobre qué hay en disco, la
   aserción derivada quedaría ciega y habría que volver a una lista cerrada con
   dueño declarado.

Registrado por `sdd-implementador` de SPEC-013 (quien invalida, registra,
ADR-015 §5).
