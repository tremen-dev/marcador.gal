---
id: SPEC-001
tipo: ledger
epica: EPIC-001
---
# Ledger — SPEC-001 Modelo canónico y raw store

## Resumen
- Fase: **aprobada** por Alberto Fojo el 2026-08-29. Lista para sdd-implementador.
- **Enmendada el 2026-08-29 por sdd-arquitecto** (F-SPEC-001-9 y F-SPEC-001-10,
  arbitrados por el humano). La spec gana **CA-18** y **CA-19**, reescribe
  **CA-14** y amplía **CA-7**. El contrato contra el que verifica
  `sdd-verificador` es el texto **enmendado**; ver *Historial de enmiendas* al
  final de la spec. `estado` sigue `en-progreso`, sin tocar.

## Decisiones del gate humano (2026-08-29)

- **Entorno de verificación:** rama de test de **Neon** (desechable por ejecución)
  y store de **Vercel Blob real**. Mismo motor que producción. `DATABASE_URL_TEST`
  y `BLOB_READ_WRITE_TOKEN` son requisito: sin ellos, CA-9 y CA-13..CA-17 están
  **incumplidos**, no saltados. La salida del comando va pegada aquí, con los
  casos ejecutados visibles.
- **Normalización de alias (CA-5):** se mantiene tacaña. El spike mide el coste
  real de RN-09; relajarla, si procede, será una decisión posterior con cifras y
  por ADR.
- **ADR-006:** se mantiene como ADR, no se pliega en esta spec. Aprobado el mismo
  día.
- Rama: `ft/SPEC-001-modelo-canonico-y-raw-store`

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 esquemas zod y tipos | `src/model/{ids,competition,team,match,observation,decision,index}.ts` | `tests/model/schemas.test.ts` — tabla generada por entidad (51 casos) | | ❌ |
| CA-2 round-trip JSON y frontend | `src/model/*`, `src/app/_contract/model-client.tsx` | `tests/model/roundtrip.test.ts` (12) + `npx tsc --noEmit` | | ❌ |
| CA-3 RN-12 nivel tipo | `src/model/decision.ts`, `src/model/ids.ts` (brands) | `tests/types/rn12.test-d.ts` (4 × `@ts-expect-error`) + `tests/model/rn12.test.ts` | | ❌ |
| CA-4 RN-09 nivel tipo | `src/model/team.ts` (unión discriminada) | `tests/types/rn09.test-d.ts` (3 × `@ts-expect-error`) + `tests/model/rn09.test.ts` | | ❌ |
| CA-5 RN-09 resolución de alias | `src/model/team.ts` → `resolveConfirmedAlias`, `normalizeAlias` | `tests/model/alias.test.ts` (12, casos 1–6 de la spec) | | ❌ |
| CA-6 RN-13 nivel tipo y runtime | `src/model/observation.ts`, `src/model/decision.ts` (`.readonly()`), `src/db/ports.ts` | `tests/types/rn13.test-d.ts` (7 × `@ts-expect-error`) + `tests/model/rn13.test.ts` | | ❌ |
| CA-7 marcador según estado | `src/model/observation.ts` (unión discriminada por `status`) | `tests/model/scores.test.ts` (25) + `tests/types/scores.test-d.ts` | | ❌ |
| CA-8 MatchQualifier en galego | `src/model/qualifier.ts`, `src/i18n/gl.ts` | `tests/model/qualifier.test.ts` + `tests/types/qualifier.test-d.ts` | | ❌ |
| CA-9 contrato RawStore ×2 | `src/raw/store.ts`, `src/raw/disk.ts`, `src/raw/blob.ts` | Batería única `tests/raw/contract.ts`. Disco: `tests/raw/disk.test.ts` **VERDE**. Blob: `tests/raw/blob.contract.test.ts` **PENDIENTE DE VERIFICACIÓN** (`npm run test:blob`) | | ❌ |
| CA-10 clave determinista y segura | `src/raw/key.ts`, `src/raw/store.ts` (`rawKey`) | `tests/raw/key.test.ts` (28) + `tests/raw/disk.test.ts` (CA-10.4) + bloque CA-10.3 de `contract.ts` | | ❌ |
| CA-11 RN-10 orden raw→parse | `src/raw/capture.ts` | `tests/raw/capture.test.ts` (6, con store espía y cola de microtareas) | | ❌ |
| CA-12 RN-10 raw_ref obligatorio | `src/raw/key.ts` (`RawRefSchema`), `src/model/observation.ts`; columna `not null` en `migrations/0001` | zod: `tests/model/raw-ref.test.ts` **VERDE**. Columna `NOT NULL`: **PENDIENTE DE VERIFICACIÓN** | | ❌ |
| CA-13 migración idempotente | `migrations/0001_canonical_model.sql`, `src/db/migrate.ts`, `src/db/cli.ts` | `tests/db/migrate.test.ts` **PENDIENTE DE VERIFICACIÓN**; canario verde: `tests/migrations/discovery.test.ts` | | ❌ |
| CA-14 paridad esquema↔zod | `migrations/0001_canonical_model.sql`, `tests/schema-keys.ts` | `tests/db/parity.test.ts` **PENDIENTE DE VERIFICACIÓN**; el extractor sí está verde: `tests/model/schema-keys.test.ts` | | ❌ |
| CA-15 RN-12 nivel Postgres | `migrations/0001_canonical_model.sql` (CHECKs + trigger `decisions_supporting_observations_exist`) | `tests/db/rn12.test.ts` **PENDIENTE DE VERIFICACIÓN** | | ❌ |
| CA-16 RN-13 nivel Postgres | `migrations/0001_canonical_model.sql` (`reject_amendment` + dos triggers FOR EACH ROW) | `tests/db/rn13.test.ts` **PENDIENTE DE VERIFICACIÓN** | | ❌ |
| CA-17 RN-09 nivel Postgres | `migrations/0001_canonical_model.sql` (CHECKs de `team_aliases`, PK `(alias, source, season)`, `matches_two_different_teams`) | `tests/db/rn09.test.ts` **PENDIENTE DE VERIFICACIÓN** | | ❌ |
| CA-18 coherencia marcador/estado de `Decision` (tipo + zod + Postgres) | | | | ❌ |
| CA-19 `rule` restringido a RN-01..RN-07 (tipo + zod + Postgres) | | | | ❌ |

> **Filas añadidas por sdd-arquitecto (enmienda 2026-08-29), sin rellenar
> Implementado/Test/Verif.** CA-18 y CA-19 están **sin empezar**.
> **Criterios reabiertos por la misma enmienda, aunque su fila ya estuviera
> escrita:** CA-7 (gana el nivel Postgres para `observations` — el `CHECK` ya
> está en `migrations/0001`, pero no estaba especificado ni tiene test propio),
> CA-14 (contrato reescrito: `tests/db/parity.test.ts` cumple hoy la letra
> antigua, no la nueva) y CA-3 (su caso 3 gana el literal `rule: 'RN-13'` cuando
> se aplique CA-19). El implementador tiene que volver sobre los tres.

### Estado de la verificación por tanda (sdd-implementador, 2026-08-29)

**Verificado de verdad ahora** (`npx tsc --noEmit` en 0 y `npx vitest run` con
19 ficheros / 205 casos y typecheck activo): CA-1 a CA-8, CA-10, CA-11, la
mitad zod de CA-12 y la mitad de disco de CA-9.

**Escrito pero NO verificable en esta tanda**, porque `DATABASE_URL_TEST` y
`BLOB_READ_WRITE_TOKEN` todavía no existen: la mitad de Blob de CA-9, la
columna `NOT NULL` de CA-12 y CA-13 a CA-17. Están **pendientes de
verificación**, nunca cumplidos.

Esos tests **no se saltan**. Viven en `vitest.integration.config.ts`, fuera del
comando por defecto, y **lanzan al importarse** si falta la credencial.
Comprobado:

```
$ npm run test:db
MissingDatabaseUrlError: DATABASE_URL_TEST is not set. SPEC-001 CA-13..CA-17
must run against a real (Neon test branch) Postgres; the gate of 2026-08-29
ruled that without it those criteria are UNMET, not skipped.
 Test Files  5 failed (5)   → exit 1

$ npm run test:blob
Error: BLOB_READ_WRITE_TOKEN is missing. SPEC-001 CA-9 requires the contract
battery to run against a REAL Vercel Blob store; the gate of 2026-08-29 ruled
that without it CA-9 is UNMET, not skipped.
 Test Files  1 failed (1)   → exit 1
```

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

Pendiente. Requisito explícito de la spec (Notas para el gate humano §3):
**CA-9 y CA-13..CA-17 no pueden marcarse ✅ con la suite en modo `skip`.**
El verificador debe pegar aquí la salida de:

```
DATABASE_URL_TEST=... npm run test -- tests/db
BLOB_READ_WRITE_TOKEN=... npm run test -- tests/raw
npm run typecheck
```

mostrando los casos **ejecutados**, no saltados. Una suite verde por ausencia de
credenciales es un RED, no un GREEN.

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-001/. Informe HTML opcional: _qa/SPEC-001/informe.html -->
n-a: esta spec no tiene superficie de UI.

## Salvedades / follow-ups
<!-- IDs F-SPEC-001-1, F-SPEC-001-2… con destino (spec futura o EPIC-MEJORA). -->
Abiertas ya en el momento de redactar (ver *Notas para el gate humano* de la spec):

- **F-SPEC-001-1** — Política de retención del raw store. ADR-005 la deja abierta
  y avisa de crecimiento monótono. Destino: antes de producción, ADR propio.
- **F-SPEC-001-2** — `CLAUDE.md` contradice ADR-001 (sección Stack sigue en
  Python/FastAPI) y su sección Estructura no contempla `src/model/`, `src/raw/`,
  `src/db/` ni `migrations/`. Destino: el humano, fuera del pipeline de specs.
- **F-SPEC-001-3** — Implementación de `ObservationStore` y `DecisionStore` contra
  Postgres. Aquí solo se definen los puertos. Destino: la primera spec que los
  necesite (previsiblemente la del motor de decisiones).
- **F-SPEC-001-4** — Mapa de pesos por fuente (RN-01). Destino: spec del motor.

Abiertas por sdd-implementador al implementar (2026-08-29). Las cuatro primeras
son **contradicciones o huecos de la spec**, resueltas de la forma que se indica
para poder avanzar; el verificador y el humano tienen la última palabra.

- **F-SPEC-001-5** — *CA-3 y zod 4.* La spec pide `.nonempty()` para
  `supporting_observation_ids` «(tipo `[ObservationId, ...ObservationId[]]`)».
  Zod 4 cambió `.nonempty()` a una simple comprobación de longitud mínima y el
  tipo inferido sigue siendo `T[]`, así que `[]` **compilaría** y el caso 2 de
  CA-3 se caería. Implementado con `z.tuple([ObservationIdSchema],
  ObservationIdSchema)`, que sí infiere la tupla no vacía. Comprobado
  invirtiendo la prueba: con `.nonempty()` `tsc` falla por *"Unused
  '@ts-expect-error' directive"*. Destino: confirmar la desviación en la
  verificación; no requiere cambio de spec más allá de la nota.

- **F-SPEC-001-6** — *CA-3, caso 4, no puede ser un caso de runtime.* La spec
  dice que «`DecisionSchema.safeParse` rechaza los cuatro». El cuarto (un
  `MatchId` donde va un `ObservationId`) es **imposible** de rechazar en
  runtime: `.brand()` de zod no tiene representación en tiempo de ejecución, y
  un `MatchId` y un `ObservationId` son la misma cadena. Implementado como
  invariante solo de tipo, con un test que **fija ese hecho** para que nadie
  crea que `safeParse` le protege ahí. La red de runtime de ese caso es el
  trigger de CA-15.4. Destino: verificador.

- **F-SPEC-001-7** — *CA-10.1 contra CA-10.3.* El formato de clave incluye
  `<fetched_at ISO>`, y un ISO 8601 lleva `T`, `Z` y `:`, todos fuera del
  charset `[a-z0-9._/-]` que CA-10.3 exige. Resuelto normalizando el instante
  dentro de la clave: minúsculas y `:` → `-`
  (`2026-03-21t17-00-00.000z`). Sigue siendo legible, que es la razón por la
  que ADR-006 eligió ISO. Destino: confirmar la interpretación.

- **F-SPEC-001-8** — *CA-9.6 tiene una rama inalcanzable.* «`put` de bytes
  distintos sobre una clave existente lanza `RawKeyConflictError`» no puede
  ocurrir a través del puerto, porque la clave es **direccionable por
  contenido** (CA-10.1 mete el sha256 del cuerpo en la clave) y por tanto bytes
  distintos van a claves distintas (CA-10.2). La guarda está implementada en
  las dos implementaciones y se prueba donde **sí** es alcanzable —un archivo
  editado desde fuera— en `tests/raw/disk.test.ts`. En la batería de contrato
  queda la idempotencia y la no colisión. Destino: verificador.

- **F-SPEC-001-9** — *CA-14 contra el refinamiento §1 de la spec.* El
  refinamiento dice que `Team.aliases[]` es una lista de `TeamAlias`; CA-17
  exige que los alias sean su propia tabla con su propio `UNIQUE`. Ambas cosas
  a la vez hacen que `aliases` sea una clave zod **sin columna**, y CA-14 solo
  prevé excepciones de columnas solo-BD (`created_at`). Resuelto declarando en
  `tests/db/parity.test.ts` **dos** listas explícitas (`dbOnly` y `zodOnly`),
  con `aliases` como única entrada de la segunda y el motivo escrito al lado.
  Destino: el arquitecto, si quiere que CA-14 recoja la excepción.

  > **RESUELTO por sdd-arquitecto (2026-08-29). CA-14 reescrito.** La solución de
  > dos listas es la dirección correcta —la excepción tiene que estar declarada,
  > no inferida— pero tal como estaba, `zodOnly` es una lista abierta: cualquier
  > campo que alguien olvide migrar se calla añadiendo su nombre ahí, y el test
  > deja de ser la red antideriva y pasa a ser un formulario. CA-14 conserva las
  > dos listas y les pone tres cierres:
  > 1. cada entrada lleva **motivo escrito** (mapa, no array de nombres) y el
  >    motivo vacío falla;
  > 2. cada entrada de `zodOnly` declara la **tabla** donde vive el dato, y el
  >    test comprueba contra `information_schema` que existe y tiene **FK** hacia
  >    la tabla de la que se excluye la clave. Un campo sin migrar no tiene tabla
  >    a la que apuntar: la única salida sigue siendo migrarlo;
  > 3. una entrada **no usada** falla, en las dos listas. Las excepciones no
  >    sobreviven al campo que las justificaba.
  > Se descartó la alternativa de sacar `aliases` de `TeamSchema` (con un
  > `TeamWithAliases` aparte): contradice `dominio.md`, que define `Team` como
  > `(id, canonical_name, aliases[])`, y compra la paridad al precio de deformar
  > el modelo canónico para que se parezca a las tablas — que es exactamente lo
  > contrario de lo que CA-14 defiende.
  > Trabajo para el implementador: `tests/db/parity.test.ts` cumple la letra
  > antigua, no la nueva.

- **F-SPEC-001-10** — *La coherencia marcador/estado de `Decision` no está
  especificada.* CA-7 habla solo de `Observation`. Se ha implementado
  `Decision.home_score`/`away_score` como `int >= 0` **nullable sin más**, es
  decir sin unión discriminada: no inventar una regla que la spec no da. La
  consecuencia es que hoy `DecisionSchema` acepta `status: 'scheduled'` con
  marcador `5`, que es lo que publicamos y probablemente no debería pasar.
  Destino: decisión del arquitecto (¿se extiende CA-7 a `Decision`?).

  > **RESUELTO por sdd-arquitecto (2026-08-29), tras el arbitraje del humano
  > («no me gusta, déjalo bien hecho»). Añadido CA-18.** El hallazgo tiene razón
  > en no inventar, y la spec tenía el agujero: lo que se publica estaba **menos**
  > protegido que lo que se observa, al revés de como debe ser, y en contra del
  > principio rector de la propia spec. `DecisionSchema` pasa a ser unión
  > discriminada por `status`, con las mismas cinco ramas y la misma tabla de
  > verdad que `ObservationSchema`, y con red en los tres niveles: tipo
  > (`@ts-expect-error`), zod (`safeParse`) y Postgres
  > (`decisions_score_matches_status` + `decisions_scores_non_negative`).
  > Se ha creado CA-18 en vez de ampliar CA-7 para no reabrir un criterio ya
  > implementado a medio verificar y para que el nivel Postgres viva junto a
  > CA-15..CA-17. CA-7 sí gana una línea: el `CHECK` de `observations` estaba
  > implementado sin estar especificado.
  > **La segunda mitad de la pregunta —`provisional` y `rule` frente al estado—**
  > se responde así: `rule` **sí** se restringe (CA-19, RN-01..RN-07: `dominio.md`
  > dice «la regla del motor»); `provisional` **no**, porque `reglas.md` no da el
  > dato. Ver F-SPEC-001-13/14/15.

- **F-SPEC-001-11** — *`RawObjectMeta` es mínima a propósito*: `source`,
  `competition_id`, `fetched_at` y `ext`, que es lo que la clave necesita. Los
  adaptadores querrán guardar URL, código de estado y `content-type`. Destino:
  la spec de adaptadores.

- **F-SPEC-001-12** — *Andamio tocado.* Para poder cumplir el encargo se
  añadieron: `allowImportingTsExtensions` en `tsconfig.json` (Node 22 ejecuta
  TypeScript directamente y `npm run db:migrate` lo necesita), los `exclude` de
  `vitest.config.ts`, `vitest.integration.config.ts` y los scripts `db:migrate`,
  `test:db`, `test:blob` y `test:integration`. Ninguna dependencia nueva.

Abiertas por sdd-arquitecto al enmendar (2026-08-29). Las tres son **huecos de
`reglas.md`** detectados al preguntarse si `provisional` interactúa con el
estado. **No se han rellenado**: son reglas de negocio y no las escribe el
arquitecto sobre una spec.

- **F-SPEC-001-13** — *RN-01 no da peso a la corrección humana del panel.* La
  tabla de pesos cubre RFGF 1.0, API de pago 0.9, corresponsal confirmado 0.8,
  agregador 0.7 y tuit de club 0.5. El **operador corrigiendo desde el panel** no
  aparece, y no es lo mismo que un corresponsal. Sin ese peso, RN-02 y RN-03 no
  pueden decidir si una `Decision` nacida del panel sale *confirmado* o
  *provisional* — y RN-04 y RN-06 le dan a ese humano poder de bajar un marcador
  y de aplazar un partido. Destino: `reglas.md`, vía sdd-producto o el humano;
  bloquea de hecho a la spec del motor.

- **F-SPEC-001-14** — *RN-03 no define* provisional *para una `Decision` sin
  marcador.* RN-03 habla de publicar un marcador; `scheduled` y `postponed` no
  publican ninguno. No se ha fijado nada en CA-18: `provisional` sigue siendo un
  `boolean` libre en las cinco ramas. Prohibir `provisional` sin marcador sería
  inventar; y hoy, con RN-01 y RN-06 tal como están, una `Decision` `postponed`
  **provisional** es derivable (un corresponsal de peso 0.8 aplaza), así que
  prohibirla contradiría `reglas.md` en vez de completarlo. Destino: `reglas.md`.

- **F-SPEC-001-15** — *`rule` es una sola y las reglas concurren.* `dominio.md`
  fija **una** `rule` por `Decision`, pero `reglas.md` dice que RN-01..RN-07 se
  aplican **en orden** y varias pueden satisfacerse a la vez: una transición
  `scheduled → live` con una única fuente de peso 0.8 cumple RN-06 *y* RN-03.
  `reglas.md` no dice cuál se registra. Si se resuelve tarde, el spike acaba con
  un campo `rule` cuyo valor depende de quién escribió cada rama del motor —
  y `rule` es la mitad de RN-12. Destino: spec del motor de decisiones, con
  `reglas.md` como fuente.

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->
Rama `ft/SPEC-001-modelo-canonico-y-raw-store`, cuatro commits, **sin push**.

**Hecho y verde de verdad:** todo el modelo canónico (`src/model/`), el i18n
galego mínimo (`src/i18n/gl.ts`), los puertos (`src/db/ports.ts`) y el raw store
sobre disco (`src/raw/{key,store,disk,capture}.ts`). `npx tsc --noEmit` sale 0 y
`npx vitest run` da 19 ficheros / 205 casos con el typecheck de los
`.test-d.ts` activo.

**Escrito y sin verificar, esperando credenciales:** `src/raw/blob.ts`,
`migrations/0001_canonical_model.sql`, `src/db/{client,migrate,cli}.ts` y las
suites `tests/db/*.test.ts` y `tests/raw/blob.contract.test.ts`.

**Lo siguiente, en cuanto existan `DATABASE_URL_TEST` (rama de test de Neon,
desechable) y `BLOB_READ_WRITE_TOKEN`:**

1. `npm run db:migrate` contra la rama de Neon.
2. `npm run test:db` y `npm run test:blob`, y pegar la salida en el veredicto.
   Ojo: `tests/db/_harness.ts` hace `drop schema public cascade` — apuntar solo
   a una rama desechable.
3. Revisar F-SPEC-001-5 a F-SPEC-001-8: son contradicciones reales de la spec
   resueltas por interpretación. F-SPEC-001-9 y F-SPEC-001-10 **ya están
   resueltos** por la enmienda del arquitecto (2026-08-29).

**Trabajo nuevo que deja la enmienda del 2026-08-29** (sdd-implementador; el
arquitecto no toca código):

1. **CA-18** — convertir `DecisionSchema` en unión discriminada por `status`,
   con las mismas cinco ramas que `ObservationSchema`; añadir
   `tests/types/ca18.test-d.ts` (4 `@ts-expect-error` + estrechamiento), la
   mitad zod compartiendo tabla de casos con `tests/model/scores.test.ts`, y en
   `migrations/0001` los `CHECK` `decisions_score_matches_status` y
   `decisions_scores_non_negative` con su suite de integración.
2. **CA-19** — reducir `DECISION_RULES` a `RN-01..RN-07`, sustituir
   `decisions_rule_shape` por una lista cerrada, y añadir `rule: 'RN-13'` al
   caso 3 de CA-3.
3. **CA-14** — reescribir `tests/db/parity.test.ts` contra el contrato nuevo:
   mapas con motivo, `zodOnly` con tabla verificada y FK comprobada, y fallo por
   entrada no usada.
4. **CA-7** — test explícito del `CHECK` de `observations` a nivel Postgres (la
   restricción ya está escrita en `migrations/0001`; le falta el caso).

La migración `0001` todavía **no se ha aplicado a ninguna base**: los cambios de
CA-18 y CA-19 van dentro de ella, no en una `0002`.

**No transicionado a `en-revision`:** faltan seis CA por verificar. El estado lo
mueve el humano o el verificador cuando estén los diecisiete.


## Arbitraje del gate humano — 2026-08-29 (Alberto Fojo)

- **CA-19 se mantiene.** El motor nace con vocabulario cerrado: si aparece un caso
  que ninguna de RN-01..RN-07 describe, se añade una RN a `reglas.md` en vez de
  reciclar una etiqueta que no lo explica. RN-12 es la mitad del valor del spike y
  no se sostiene con `rule` mintiendo.
- **F-SPEC-001-13 RESUELTO.** RN-01 incorpora al **operador humano con peso 1.0** y
  una cláusula de precedencia sobre la RFGF. Detalle que hubo que resolver al
  escribirlo: 1.0 no está *por encima* de la RFGF sino empatado, y con RN-05 tal
  como estaba el empate lo ganaba la oficial — el operador no habría podido
  corregir a futgal. Se añadió precedencia explícita en RN-01 y una salvedad en
  RN-05 (una discrepancia con el operador no es conflicto: se resuelve y se
  publica). Coherente con RN-04 y RN-06, que ya trataban a «la fuente oficial o un
  humano» como pares. Desbloquea la spec del motor.
- **F-SPEC-001-14 y F-SPEC-001-15 siguen abiertos.** Qué significa *provisional* en
  una Decision sin marcador, y cuál de las reglas concurrentes se registra en
  `rule`. Ninguno bloquea SPEC-001; ambos son de `reglas.md` y hay que cerrarlos
  antes de la spec del motor.
