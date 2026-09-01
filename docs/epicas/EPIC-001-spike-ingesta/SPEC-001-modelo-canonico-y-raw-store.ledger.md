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
| CA-1 esquemas zod y tipos | `src/model/{ids,competition,team,match,observation,decision,index}.ts` | `tests/model/schemas.test.ts` — tabla generada por entidad (51 casos) | `npm test` → 23 ficheros / 270 casos, 0 saltados. Tabla (b) generada recorriendo `Object.keys(fixture)`: no es lista a mano. Las seis entidades presentes en `src/model/index.ts`, tipos por `z.infer`. | ✅ |
| CA-2 round-trip JSON y frontend | `src/model/*`, `src/app/_contract/model-client.tsx` | `tests/model/roundtrip.test.ts` (12) + `npx tsc --noEmit` | Round-trip verde para las seis. `npx tsc --noEmit --listFiles` confirma que `src/app/_contract/model-client.tsx` está DENTRO del programa de tsc; `npm run typecheck` sale 0. | ✅ |
| CA-3 RN-12 nivel tipo | `src/model/decision.ts`, `src/model/ids.ts` (brands) | `tests/types/rn12.test-d.ts` (**5** × `@ts-expect-error`: el caso 3 gana el literal `rule: 'RN-13'` por la enmienda) + `tests/model/rn12.test.ts` (6) | 5 × `@ts-expect-error` vivos: `tsc` sale 0, luego cada directiva SE USA (una directiva sin usar rompería el build). Caso 4 NO se rechaza en runtime — `.brand()` no existe en runtime (F-SPEC-001-6); el test lo fija explícitamente y la red real es el trigger de CA-15.4, verificado en Postgres. | ⚠️ |
| CA-4 RN-09 nivel tipo | `src/model/team.ts` (unión discriminada) | `tests/types/rn09.test-d.ts` (3 × `@ts-expect-error`) + `tests/model/rn09.test.ts` | 3 × `@ts-expect-error` vivos + runtime: `confirmed_by: ''` y `proposed` con confirmador rechazados por `safeParse`. | ✅ |
| CA-5 RN-09 resolución de alias | `src/model/team.ts` → `resolveConfirmedAlias`, `normalizeAlias` | `tests/model/alias.test.ts` (12, casos 1–6 de la spec) | 12 casos verdes; los seis de la spec presentes uno a uno, incluidos NFD/NFC (5b) y acentos/mayúsculas/puntuación → `null` (6, 6b). `resolveConfirmedAlias` no tiene rama que devuelva TeamId desde `proposed`: `continue` sobre `status !== 'confirmed'`. | ✅ |
| CA-6 RN-13 nivel tipo y runtime | `src/model/observation.ts`, `src/model/decision.ts` (`.readonly()`), `src/db/ports.ts` | `tests/types/rn13.test-d.ts` (7 × `@ts-expect-error`) + `tests/model/rn13.test.ts` | 7 × `@ts-expect-error` vivos + `Equals<keyof ObservationStore, 'append'|'getById'|'listByMatch'>` (igualdad invariante, sin holgura). Runtime: `Object.isFrozen` true y asignación lanza, en Observation y en Decision. | ✅ |
| CA-7 marcador según estado (tipo + zod + **Postgres**) | `src/model/observation.ts` (unión discriminada por `status`), `src/model/score.ts` (la regla de marcador, escrita una vez), `migrations/0001_canonical_model.sql` (`observations_score_matches_status`, `observations_scores_non_negative`) | `tests/model/scores.test.ts` (35, sobre la tabla compartida `tests/fixtures/score-cases.ts`) + `tests/types/scores.test-d.ts` + canario verde en `tests/migrations/discovery.test.ts`. Nivel Postgres: `tests/db/scores.test.ts` **VERDE** — bloque CA-7, **27 casos** (21 de la tabla compartida + los 6 `INSERT` nominales de CA-7), `npm run test:db` del 2026-08-30, 0 saltados. | zod: 35 casos sobre `tests/fixtures/score-cases.ts`. Tipo: estrechamiento verificado. **Postgres verificado contra Neon**: 21 casos de la tabla compartida + los 6 `INSERT` nominales; `observations_score_matches_status` y `observations_scores_non_negative` rechazan y aceptan según la tabla. | ✅ |
| CA-8 MatchQualifier en galego | `src/model/qualifier.ts`, `src/i18n/gl.ts` | `tests/model/qualifier.test.ts` + `tests/types/qualifier.test-d.ts` | Unión exacta en ambos sentidos (`Exclude` × 2) + `@ts-expect-error` sobre `pending_confirmation`. Runtime: `MATCH_QUALIFIERS` == claves de `gl.qualifiers`, y los literales coinciden con `dominio.md` líneas 47-50. | ✅ |
| CA-9 contrato RawStore ×2 | `src/raw/store.ts`, `src/raw/disk.ts`, `src/raw/blob.ts` | Batería única `tests/raw/contract.ts`. Disco: `tests/raw/disk.test.ts` **VERDE**. Blob: `tests/raw/blob.contract.test.ts` **VERDE** — `npm run test:blob` del 2026-08-30 contra el store real: **22/22, 0 saltados**. Disco 24/24 dentro de `npm test`. | **Blob real verificado**: `npm run test:blob` → 22/22, 0 saltados, contra el store `marcador-gal`. La batería es el MISMO fichero `tests/raw/contract.ts` invocado dos veces. Cubiertos byte no-UTF-8, trampa de prefijo `preferente` vs `preferente-b`, metadatos `deepEqual`, idempotencia y 300 KB íntegros. Salvedad: la rama `RawKeyConflictError` de CA-9.6 es inalcanzable por el puerto (clave direccionable por contenido, F-SPEC-001-8) y solo se ejercita en disco; en `BlobRawStore` la guarda existe pero no está probada. | ⚠️ |
| CA-10 clave determinista y segura | `src/raw/key.ts`, `src/raw/store.ts` (`rawKey`) | `tests/raw/key.test.ts` (28) + `tests/raw/disk.test.ts` (CA-10.4) + bloque CA-10.3 de `contract.ts` | 28 casos puros + bloque CA-10.3 en las DOS implementaciones (validación antes de cualquier E/S: los rechazos en Blob tardan 0 ms) + CA-10.4 comparando el árbol del padre del raíz antes/después. Salvedad: el instante de la clave va normalizado (`2026-03-21t17-00-00.000z`) y no en ISO literal, porque el ISO literal viola el charset que exige la propia CA-10.3 (F-SPEC-001-7). `addRandomSuffix: false` presente en `src/raw/blob.ts`. | ⚠️ |
| CA-11 RN-10 orden raw→parse | `src/raw/capture.ts` | `tests/raw/capture.test.ts` (6, con store espía y cola de microtareas) | 6 casos con store espía: orden `['put','parse']`, `put` pendiente → `parse` no llamada tras agotar micro y macrotareas, `put` que rechaza → `parse` nunca llamada y el error propaga, y `parse` recibe el `RawRef` de `put`. | ✅ |
| CA-12 RN-10 raw_ref obligatorio | `src/raw/key.ts` (`RawRefSchema`), `src/model/observation.ts`; columna `not null` en `migrations/0001` | zod: `tests/model/raw-ref.test.ts` **VERDE** (7). Columna `NOT NULL`: **aplicada y comprobada, pero SIN test de rechazo propio.** Lo que hay hoy, todo verde el 2026-08-30: el canario textual `tests/migrations/discovery.test.ts` caso `'CA-12 raw_ref is NOT NULL'` (lee el 0001, sin BD) y `tests/db/parity.test.ts` (36), que ve `raw_ref` en `observations` contra `information_schema` — pero compara **nombres** de columna, no nulabilidad. Consultado a mano el esquema aplicado en la rama de test: `is_nullable = 'NO'`, `observations_raw_ref_not_null` y `observations_raw_ref_check CHECK (length(raw_ref) > 0)`. **Ningún caso intenta el `INSERT` con `raw_ref` nulo o vacío para ver a Postgres rechazarlo** → F-SPEC-001-27. | zod: ausente, `null`, `''`, solo espacios y clave con forma inválida rechazados. **Postgres verificado**: `raw_ref text not null check (length(raw_ref) > 0)` aplicado en la rama de Neon; paridad CA-14 verde sobre `observations`. | ✅ |
| CA-13 migración idempotente | `migrations/0001_canonical_model.sql`, `src/db/migrate.ts`, `src/db/cli.ts` | `tests/db/migrate.test.ts` **VERDE** — 3/3 (`npm run test:db`, 2026-08-30). Además he ejecutado el comando literal dos veces sobre la base ya migrada (`DATABASE_URL`, rama `main`): `npm run db:migrate` → `schema is up to date; nothing applied` en ambas — eso evidencia la **mitad idempotente**; la mitad «base vacía → aplica 0001 y aparecen las seis tablas» la cubre `migrate.test.ts`, que arranca de `drop schema public cascade`; canario verde: `tests/migrations/discovery.test.ts` (19) | **Verificado con el comando literal.** Sobre la rama de test vaciada (`drop schema public cascade` → 0 tablas): 1ª ejecución de `npm run db:migrate` → `applied: 0001`, seis tablas + `schema_migrations`; 2ª ejecución → `schema is up to date; nothing applied`, `schema_migrations` con una sola fila `0001`. Además `tests/db/migrate.test.ts` 3/3. | ✅ |
| CA-14 paridad esquema↔zod (contrato reescrito) | `migrations/0001_canonical_model.sql`, `tests/schema-keys.ts` | `tests/db/parity.test.ts` **reescrito contra la letra nueva** (mapas con motivo, `zodOnly` con tabla verificada y FK comprobada contra `information_schema`, fallo por entrada muerta, listas cerradas) — **VERDE**: 36 casos (6 de nombres de columna + 30 de «cada excepción, justificada de una en una»), `npm run test:db` del 2026-08-30; el extractor sigue verde aparte: `tests/model/schema-keys.test.ts` (6) | 36 casos verdes contra `information_schema`. Las cuatro condiciones de la letra nueva comprobadas: listas cerradas (igualdad de conjuntos), entradas muertas fallan, motivo vacío falla, y cada `zodOnly` verifica tabla existente + FK real (`team_aliases → teams`). El extractor tiene test propio y lanza si devuelve 0 claves, así que CA-14 no puede pasar comparando dos conjuntos vacíos. | ✅ |
| CA-15 RN-12 nivel Postgres | `migrations/0001_canonical_model.sql` (CHECKs + trigger `decisions_supporting_observations_exist`) | `tests/db/rn12.test.ts` **VERDE** — 9 casos (6 en el bloque `decisions` + 3 en `version`), `npm run test:db` del 2026-08-30, 0 saltados | 9 casos verdes en Postgres real: `NOT NULL`, `decisions_rule_shape`, `decisions_has_support`, y el trigger rechazando tanto un id inexistente como uno que existe pero es de OTRO partido. `UNIQUE (match_id, version)` implementado como PK (más fuerte) + `decisions_version_positive`. | ✅ |
| CA-16 RN-13 nivel Postgres | `migrations/0001_canonical_model.sql` (`reject_amendment` + dos triggers FOR EACH ROW) | `tests/db/rn13.test.ts` **VERDE** — 5 casos (2 `observations` append-only + 2 `decisions` append-only + 1 `TRUNCATE` sigue funcionando), `npm run test:db` del 2026-08-30 | 5 casos verdes: `UPDATE` y `DELETE` lanzan `append-only` en `observations` y en `decisions`, y la fila se relee con su valor original. `TRUNCATE ... CASCADE` sí funciona y tiene test explícito; los triggers son `FOR EACH ROW` y el canario falla si aparece `or truncate`. | ✅ |
| CA-17 RN-09 nivel Postgres | `migrations/0001_canonical_model.sql` (CHECKs de `team_aliases`, PK `(alias, source, season)`, `matches_two_different_teams`) | `tests/db/rn09.test.ts` **VERDE** — 9 casos (8 en `team_aliases` + 1 en `matches`), `npm run test:db` del 2026-08-30 | 9 casos verdes: confirmado sin `confirmed_by`, sin `confirmed_at` y con cadena vacía fallan; `proposed` con confirmador falla; `(alias, source, season)` duplicado falla (PK); `status` desconocido falla; `matches_two_different_teams` falla. Control positivo incluido. | ✅ |
| CA-18 coherencia marcador/estado de `Decision` (tipo + zod + Postgres) | `src/model/decision.ts` (unión discriminada por `status`, cinco ramas), `src/model/score.ts` (la misma regla que `Observation`), `migrations/0001_canonical_model.sql` (`decisions_score_matches_status`, `decisions_scores_non_negative`) | Tipo: `tests/types/ca18.test-d.ts` (4 × `@ts-expect-error` + 4 controles bien formados + estrechamiento) **VERDE**. Zod: `tests/model/ca18.test.ts` (31) sobre `tests/fixtures/score-cases.ts`, **el mismo fichero de datos que CA-7** — **VERDE**. Postgres: `tests/db/scores.test.ts` **VERDE** — bloque CA-18, **27 casos** (21 de la tabla compartida + los 6 `INSERT` que CA-18.3 nombra), simétrico caso a caso con el bloque CA-7 del mismo fichero (54 en total), `npm run test:db` del 2026-08-30; canario verde en `tests/migrations/discovery.test.ts` (incluida la comparación textual de los dos CHECK) | Tipo: 4 × `@ts-expect-error` vivos, cada uno emparejado con un control bien formado de la misma rama que compila limpio (F-SPEC-001-18), más el estrechamiento en las cuatro ramas. Zod: 31 casos sobre el MISMO `tests/fixtures/score-cases.ts` que CA-7. **Postgres verificado**: 21 casos + los seis `INSERT` que CA-18.3 nombra, cada uno fallando por la constraint que la spec nombra. El canario compara texto a texto los dos CHECK. | ✅ |
| CA-19 `rule` restringido a RN-01..RN-07 (tipo + zod + Postgres) | `src/model/decision.ts` (`DECISION_RULES` con siete miembros), `migrations/0001_canonical_model.sql` (`decisions_rule_shape` pasa a lista cerrada) | Tipo: `tests/types/ca19.test-d.ts` (2 × `@ts-expect-error`) + el caso 3-bis de `tests/types/rn12.test-d.ts` **VERDE**. Zod: `tests/model/ca19.test.ts` (15, tabla sobre RN-08..RN-13) **VERDE**. Postgres: `tests/db/ca19.test.ts` **VERDE** — 14 casos, todos bajo `CA-19 — decisions_rule_shape is a closed list`, `npm run test:db` del 2026-08-30; canario verde: el 0001 ya no contiene `rule ~ '^RN-` | Tipo: 2 × `@ts-expect-error` vivos + el 3-bis de CA-3. Zod: tabla completa RN-08..RN-13 + RN-99 rechazadas, las siete del motor aceptadas. **Postgres verificado**: `decisions_rule_shape` es lista cerrada (14 casos), `rule ~ '^RN-` ya no aparece en 0001. | ✅ |

> **Columnas Verif. y Estado reconfirmadas por sdd-verificador en la SEGUNDA
> reverificación del 2026-08-30**, con evidencia obtenida de cero: los cinco
> gates reejecutados y medidos por **cobertura**, no solo por código de salida;
> los 19 CA releídos contra el texto enmendado; el esquema aplicado leído
> directamente de `pg_constraint` / `information_schema` en la rama de Neon; y
> **31 mutaciones** sobre una copia aislada del repositorio para comprobar que
> cada suite se pone roja cuando el invariante que dice defender se rompe
> (tabla en el veredicto). 16 ✅ y 3 ⚠️ (CA-3, CA-9, CA-10), las tres con
> salvedad declarada, motivo escrito y control compensatorio verificado.
>
> La columna **Test** de CA-9, CA-12, CA-13..CA-19 conserva marcas
> «PENDIENTE DE VERIFICACIÓN» escritas por el implementador cuando no había
> credenciales. Están **caducas**: esas suites han corrido contra Neon y Vercel
> Blob reales. No las toco porque esa columna no es del verificador
> (F-SPEC-001-26).

> **Filas añadidas por sdd-arquitecto (enmienda 2026-08-29), sin rellenar
> Implementado/Test/Verif.** CA-18 y CA-19 están **sin empezar**.
> **Criterios reabiertos por la misma enmienda, aunque su fila ya estuviera
> escrita:** CA-7 (gana el nivel Postgres para `observations` — el `CHECK` ya
> está en `migrations/0001`, pero no estaba especificado ni tiene test propio),
> CA-14 (contrato reescrito: `tests/db/parity.test.ts` cumple hoy la letra
> antigua, no la nueva) y CA-3 (su caso 3 gana el literal `rule: 'RN-13'` cuando
> se aplique CA-19). El implementador tiene que volver sobre los tres.

> **Al día por sdd-implementador (segunda tanda, 2026-08-29).** Los cinco
> criterios que dejaba abiertos la nota anterior están implementados: CA-18 y
> CA-19 completos en tipo y zod y escritos en Postgres, CA-7 con su nivel de
> Postgres escrito, CA-14 reescrito contra la letra nueva y CA-3 con el literal
> `rule: 'RN-13'` en su caso 3. La columna Estado sigue siendo del verificador y
> no se toca.

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

### Segunda tanda — aplicación de la enmienda (sdd-implementador, 2026-08-29)

**Verificado de verdad ahora** (`npx tsc --noEmit` en 0 y `npx vitest run` con
**23 ficheros / 270 casos** y typecheck activo, frente a los 19/205 de la
primera tanda): la mitad de tipo y la mitad de zod de **CA-18** y de **CA-19**,
el caso 3-bis de **CA-3**, y **CA-7** sigue verde tras pasar a la tabla de casos
compartida. Los 205 casos anteriores siguen todos en verde; ninguno se ha
borrado ni relajado.

**Escrito y NO verificable**, por seguir sin `DATABASE_URL_TEST`: el nivel
Postgres de CA-7 y de CA-18 (`tests/db/scores.test.ts`), el de CA-19
(`tests/db/ca19.test.ts`) y el CA-14 reescrito (`tests/db/parity.test.ts`).
`npm run test:db` pasa de 5 a **7 ficheros que fallan al importarse**, sigue
saliendo con **exit 1** y sigue sin saltarse nada.

Cómo está montada la simetría CA-7 ↔ CA-18, que es lo que pedía la spec:

- **Un solo dato.** `tests/fixtures/score-cases.ts` es la tabla de verdad
  (28 casos) y la consumen `tests/model/scores.test.ts` (CA-7),
  `tests/model/ca18.test.ts` (CA-18) y `tests/db/scores.test.ts` (los dos
  niveles de Postgres). Divergir exige editar ese fichero, que es justamente el
  sitio donde una divergencia se lee como una decisión.
- **Una sola regla.** `src/model/score.ts` contiene `ScoreSchema`,
  `scoredShape` y `unscoredShape`, y de ahí salen las cinco ramas de
  `Observation` y las cinco de `Decision`. No son la misma regla escrita dos
  veces: son la misma regla.
- **Un solo `CHECK`.** `decisions_score_matches_status` es carácter por carácter
  `observations_score_matches_status`, y `tests/migrations/discovery.test.ts`
  compara los dos textos y falla si dejan de coincidir (canario sin BD, verde).

### Tercera tanda — la infraestructura ya existe (sdd-implementador, 2026-08-30)

Encargo: **F-SPEC-001-26**, las marcas «PENDIENTE DE VERIFICACIÓN» de la columna
Test. Eran ciertas cuando se escribieron y han dejado de serlo: `.env.local`
tiene hoy `DATABASE_URL`, `DATABASE_URL_TEST` y `BLOB_READ_WRITE_TOKEN` contra
infraestructura real. **No he actualizado la columna sobre la palabra de nadie:
he vuelto a ejecutar los cinco gates yo mismo** y he escrito lo observado, CA a
CA. Node v26.4.0.

```
$ npm run lint        → exit 0
$ npm run typecheck   → exit 0
$ npm test            → 23 ficheros / 270 casos, 0 fallos, 0 saltados
$ npm run test:db     → 7 ficheros / 130 casos, 0 fallos, 0 saltados  (44 s)
$ npm run test:blob   → 1 fichero  /  22 casos, 0 fallos, 0 saltados  (21 s)
$ npm run db:migrate  → «schema is up to date; nothing applied» (×2)
```

Reparto por fichero de `npm run test:db`, que es lo que sostiene fila a fila la
columna Test (contado con el reporter JSON, no a ojo):

| Fichero | Casos | CA |
|---|---|---|
| `tests/db/scores.test.ts` | 54 | CA-7 (27) y CA-18 (27) |
| `tests/db/parity.test.ts` | 36 | CA-14 |
| `tests/db/ca19.test.ts` | 14 | CA-19 |
| `tests/db/rn09.test.ts` | 9 | CA-17 |
| `tests/db/rn12.test.ts` | 9 | CA-15 |
| `tests/db/rn13.test.ts` | 5 | CA-16 |
| `tests/db/migrate.test.ts` | 3 | CA-13 |

**Diez filas corregidas**, no nueve: además de las nueve que nombra
F-SPEC-001-26 (CA-9, CA-12, CA-13..CA-19), **CA-7 arrastraba la misma marca
caduca** en su nivel Postgres. F-SPEC-001-26 no la lista, pero era igual de
falsa y la columna es mía, así que la he corregido también.

**Una marca NO se ha vuelto verde: CA-12.** Al ir a buscar la evidencia resulta
que el `NOT NULL` de `raw_ref` está **aplicado** —lo he leído del esquema vivo
de la rama de test: `is_nullable = 'NO'`, más
`observations_raw_ref_not_null` y `observations_raw_ref_check`— pero **ningún
test lo ejercita**: `parity.test.ts` compara nombres de columna, no nulabilidad,
y el canario de `discovery.test.ts` lee el texto del `.sql`, no la base. La
marca caduca tapaba un hueco real, no solo una credencial que faltaba. Queda
escrito en la fila y abierto como **F-SPEC-001-27**.

No he tocado código, ni la spec, ni los ADR, ni `migrations/`, ni las columnas
Verif./Estado, ni el veredicto. Sin commit.

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

**GREEN — 2026-08-30 (segunda reverificación), sdd-verificador.**

Evidencia obtenida de cero, sin apoyarme en los dos veredictos anteriores ni en
su mapa de evidencia. Los **19 CA están satisfechos**: 16 ✅ y 3 ⚠️ con salvedad
declarada, motivo escrito y control compensatorio verificado. El bloqueante del
veredicto anterior —**F-SPEC-001-22**, el gate de lint ciego sobre `src/raw/` y
`tests/raw/`— **está reparado y lo he comprobado por trampa**, no por lectura
del diff.

### Los gates, medidos por cobertura y no solo por exit code

```
$ npm run lint        → exit 0
  npx oxlint --type-aware --format=github
  Found 0 warnings and 0 errors.
  Finished in 155ms on 61 files with 185 rules using 14 threads.
$ npm run typecheck   → exit 0
$ npm test            → 23 ficheros / 270 casos, 0 saltados, Type Errors: no errors
$ npm run test:db     → 7 ficheros / 130 casos, 0 saltados
$ npm run test:blob   → 1 fichero / 22 casos, 0 saltados
```

**61 de 61.** El árbol tiene exactamente 61 ficheros `.ts`/`.tsx` fuera de
`node_modules`, y oxlint analiza los 61 — antes eran 51, con `src/raw/` y
`tests/raw/` fuera. `.oxlintrc.json` lleva hoy el patrón anclado (`"/raw/"`,
junto a `/.next/`, `/out/`, `/dist/`, `/coverage/`), que era el arreglo de una
línea que pedía F-SPEC-001-22.

No me basta con contar ficheros: **planté errores obvios en seis puntos del
árbol a la vez** (`src/raw/capture.ts`, `tests/raw/contract.ts`,
`src/model/score.ts`, `tests/db/parity.test.ts`, `src/app/page.tsx`,
`tests/types/rn12.test-d.ts`) y el gate reportó **los seis**, 14 hallazgos, exit
1. En la tanda anterior los de `raw/` pasaban callando.

Y **`--type-aware` no es decorativo**: una promesa flotante en `src/raw/capture.ts`
—precisamente la forma que tendría una regresión de CA-11/RN-10— sale como
`typescript(no-floating-promises)` con el flag y no sale sin él.

Los dos hallazgos `vitest(require-mock-type-parameters)` que el veredicto
anterior destapó en `tests/raw/capture.test.ts:55` y `:68` están resueltos
(`vi.fn<RawParser<string>>`), no silenciados: la regla sigue en `deny` vía
`categories.correctness: "error"`.

**Ningún gate mira menos que todo el árbol.** Comprobado además que los 31
ficheros de test del repositorio corren bajo algún comando (23 en `npm test`, 8
en la configuración de integración; conjuntos comparados fichero a fichero, sin
huérfanos), y que **no hay un solo** `.skip`, `.todo`, `.only`, `.skipIf` ni
`.runIf` en `tests/`. `npx tsc --noEmit --listFiles` mete los 61 ficheros en el
programa, incluidos los siete `tests/types/*.test-d.ts` y
`src/app/_contract/model-client.tsx`; `tsconfig.json` lleva `strict: true` y
`exactOptionalPropertyTypes: true`, sin los cuales varios CA no morderían.

### Por qué las suites cuentan como evidencia: 31 mutaciones

Una suite verde no prueba nada por sí sola. Copia aislada del repositorio, una
mutación cada vez, restaurando entre mutaciones. **Las 31 fueron detectadas**,
salvo las dos que se señalan abajo como huecos y que no incumplen ningún CA:

| Mutación | Rompe | Detectada por |
|---|---|---|
| `Competition.name` pasa a `.optional()` | CA-1 | 1 caso (tabla generada) |
| `InstantSchema` parsea a `Date` | CA-2 | 15 casos + `tsc` exit 1 |
| tupla → `z.array().nonempty()` | CA-3 | `tsc` exit 1 (directiva sin usar) |
| `confirmed_by` pierde `.min(1)` | CA-4 | 1 caso |
| `resolveConfirmedAlias` acepta `proposed` | CA-5.2 | 1 caso |
| `normalizeAlias` añade `toLowerCase()` | CA-5.6 | 1 caso |
| `ObservationSchema` pierde `.readonly()` | CA-6 | 2 casos + `tsc` exit 1 |
| `ScoreSchema` pierde `.min(0)` | CA-7, CA-18 | 6 casos zod |
| `ScoreSchema` pasa de `z.int()` a `z.number()` | CA-7, CA-18 | 6 casos zod |
| `confidence` pierde el rango [0,1] | CA-7 | 2 casos |
| `pendente_de_confirmar` → `pending_confirmation` | CA-8 | 3 casos + `tsc` exit 1 |
| la clave i18n galega se desvía de `MATCH_QUALIFIERS` | CA-8 | 3 casos + `tsc` exit 1 |
| `keyHasPrefix` pasa a `startsWith` textual | CA-9.3 | 1 caso |
| `put` deja de lanzar `RawKeyConflictError` | CA-9.6 | 1 caso |
| `addRandomSuffix: true` en Blob | CA-9 (Blob) | 9 casos contra el store real |
| `rawKey` pierde el sha256 del cuerpo | CA-10.2 | 4 casos |
| `assertValidRawKey` deja de validar | CA-10.3, CA-10.4 | 15 casos |
| `assertValidRawPrefix` deja de validar | CA-10.3 | 15 casos |
| `parse` arranca antes de que resuelva `put` | CA-11 | 3 casos |
| `RawRefSchema` pierde el regex de forma de clave | CA-12 | 2 casos |
| `observations.raw_ref` pierde `NOT NULL` | CA-12 (Postgres) | 1 caso (canario de `0001`) |
| `migrate` deja de filtrar lo ya aplicado | CA-13 | 1 caso en Postgres |
| `observations` gana una columna no declarada | CA-14 | 1 caso en Postgres |
| `rule` pierde `NOT NULL` | CA-15.1 | 1 caso en Postgres |
| `decisions_has_support` neutralizado | CA-15.3 | 1 caso en Postgres |
| se cae el trigger de observaciones de apoyo | CA-15.4 | 2 casos en Postgres |
| `decisions_version_positive` neutralizado | CA-15 | 1 caso en Postgres |
| se cae `observations_are_immutable` | CA-16 | 2 casos en Postgres |
| se cae `decisions_are_immutable` | CA-16 | 2 casos en Postgres |
| `team_aliases_confirmed_needs_person` neutralizado | CA-17.1 | 2 casos en Postgres |
| `team_aliases_proposed_has_no_person` neutralizado | CA-17.2 | 1 caso en Postgres |
| `team_aliases_confirmer_not_empty` neutralizado | CA-17 | 1 caso en Postgres |
| `team_aliases_status_known` neutralizado | CA-17.4 | 1 caso en Postgres |
| PK `(alias, source, season)` ensanchada | CA-17.3 | 1 caso en Postgres |
| `matches_two_different_teams` neutralizado | CA-17 | 1 caso en Postgres |
| se cae `observations_score_matches_status` | CA-7 (Postgres) | 10 casos en Postgres |
| se cae `decisions_score_matches_status` | CA-18.3 | 10 casos en Postgres |
| `observations_scores_non_negative` neutralizado | CA-7 (Postgres) | 4 casos en Postgres |
| `decisions_scores_non_negative` neutralizado | CA-18.3 | 4 casos en Postgres |
| `decisions_rule_shape` vuelve al regex | CA-19.3 | 7 casos en Postgres |
| `DECISION_RULES` gana `'RN-13'` | CA-19 | 3 casos + `tsc` exit 1 |

**La puerta trasera de CA-14 sigue cerrada.** Añadí `minute` a
`ObservationSchema` sin migrarlo y traté de callar el test declarándolo en
`zodOnly` apuntando a `team_aliases` —una tabla que sí existe—. Falla:
`zodOnly["minute"]: "team_aliases" has no foreign key towards "observations"`.
La única salida sigue siendo migrar el campo.

**Dos mutaciones NO detectadas**, ninguna de ellas un incumplimiento de CA:
ensanchar la PK de `decisions` a `(match_id, version, decided_at)` deja las 270
+ 130 verdes (ver F-SPEC-001-25), y quitar `'use client'` de
`model-client.tsx` no rompe nada (CA-2 pide que el fichero exista con la
directiva y que `typecheck` pase; lo he verificado leyéndolo, pero nada lo
defiende de una regresión).

### El esquema aplicado, leído de la base y no del fichero

Sobre la rama de test de Neon (**PostgreSQL 18.6**) vaciada y remigrada, leído
de `pg_constraint`, `information_schema` y `pg_trigger`:

- `observations.raw_ref` → `is_nullable = NO` (CA-12).
- PK `decisions (match_id, version)` y PK `team_aliases (alias, source, season)`
  (CA-15, CA-17.3).
- Los CHECK que la spec nombra, uno a uno: `observations_score_matches_status` y
  `decisions_score_matches_status` **con el mismo texto normalizado**,
  `observations_scores_non_negative`, `decisions_scores_non_negative`,
  `decisions_has_support`, `decisions_version_positive`,
  `decisions_rule_shape` como **lista cerrada** de RN-01..RN-07 (ya no un
  regex), `team_aliases_confirmed_needs_person`,
  `team_aliases_proposed_has_no_person`, `team_aliases_confirmer_not_empty`,
  `team_aliases_status_known`, `matches_two_different_teams`.
- Los tres triggers, `FOR EACH ROW`: `decisions_supporting_observations_exist`,
  `observations_are_immutable`, `decisions_are_immutable`.

### CA-13, con el comando literal de la spec

Rama de test vaciada (`drop schema public cascade` → **0 tablas**), y después el
comando que nombra el criterio, no la función que hay debajo:

```
$ npm run db:migrate     → applied: 0001
$ npm run db:migrate     → schema is up to date; nothing applied
tables: competitions, decisions, matches, observations, schema_migrations,
        team_aliases, teams
schema_migrations rows: [{"version":"0001", ...}]      pg: 18.6
```

### CA-9, contra Vercel Blob real

`npm run test:blob` → **22/22, 0 saltados**, contra el store `marcador-gal`. Es
el **mismo fichero** `tests/raw/contract.ts` que corre contra disco: una sola
batería invocada dos veces, sin segunda copia. Cubiertos el byte no válido en
UTF-8, la trampa de prefijo `preferente` vs `preferente-b`, los metadatos
`deepEqual`, la idempotencia y los 300 KB íntegros. Que corre de verdad lo prueba
la mutación `addRandomSuffix: true`, que tumba 9 de los 22.

### Salvedades aceptadas (⚠️, no ✅)

Reexaminadas de cero y confirmadas. Las tres nacen de contradicciones internas
del texto de la spec, están declaradas por el implementador y tienen control
compensatorio verificado:

- **CA-3** (F-SPEC-001-6) — el caso 4 no puede ser de runtime: `.brand()` de zod
  no existe en tiempo de ejecución. `tests/model/rn12.test.ts` **fija** ese hecho
  con una aserción explícita (`safeParse(...).success` es `true`) en vez de
  ocultarlo, y la red real es el trigger de CA-15.4, verificado en Postgres
  rechazando tanto un id inexistente como uno de otro partido.
- **CA-9** (F-SPEC-001-8) — la rama `RawKeyConflictError` es inalcanzable por el
  puerto (la clave es direccionable por contenido) y solo se ejercita contra
  disco, con un archivo editado desde fuera. En `BlobRawStore` la guarda existe
  y no tiene test.
- **CA-10** (F-SPEC-001-7) — el instante de la clave va normalizado
  (`2026-03-21t17-00-00.000z`), no en ISO literal, porque el ISO literal viola el
  charset que exige la propia CA-10.3. Es la única lectura consistente de la spec.

**F-SPEC-001-5** (tupla en vez de `.nonempty()`, por el cambio de zod 4),
**F-SPEC-001-18** (la directiva de CA-18.1 va sobre la declaración, emparejada
con un control bien formado de la misma rama) y **F-SPEC-001-19** (los casos
`absent` y `fractional` no bajan a Postgres) se aceptan sin salvedad: leídos uno
a uno en el fichero, con su motivo escrito, y confirmados por mutación o por
lectura directa.

### Lo que queda abierto y NO bloquea

- **F-SPEC-001-24 — `.oxlintrc.json` y ADR-007 siguen sin versionar.** Es el
  único punto que hay que resolver antes de que la rama salga de esta máquina.
- **F-SPEC-001-25** — la PK `(match_id, version)` no está discriminada por su
  propio test.
- **F-SPEC-001-26** — marcas «PENDIENTE DE VERIFICACIÓN» caducas en la columna
  Test de la matriz.
- **F-SPEC-001-21** — nada en Postgres rechaza un marcador fraccionario: lo
  redondea. El comentario del test ya lo dice; el hueco es del motor.

Ninguno toca un CA. El estado pasa a **hecho**.


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

  **CERRADO el 2026-08-31 (sdd-arquitecto), RATIFICADO por Alberto Fojo en el
  gate del 2026-08-31.** Enmendada RN-03 en `reglas.md` con una cláusula de
  alcance:
  *provisional* califica la `Decision` entera —el marcador donde lo hay, el
  estado en `scheduled` y `postponed`—; RN-02 y RN-03 se aplican en las cinco
  ramas porque están escritas sobre el peso y la independencia de las
  observaciones y nunca sobre el marcador; y toda `Decision` publicada es o
  confirmada o provisional (`provisional` ⟺ no se cumple RN-02). El ejemplo que
  sostiene la cláusula en `reglas.md` es una `Decision` `scheduled` con un solo
  agregador de 0.7, elegido porque no dependía de si el corresponsal cuenta como
  «humano» en RN-06 —pregunta que quedó abierta al cerrar esta entrada y que el
  gate del 2026-08-31 respondió **sí**, así que el `postponed` por corresponsal
  de esta entrada también vale y está ahora escrito en RN-01. Añadida la
  simetría en RN-02 y corregida la
  celda *provisional* de `dominio.md`, que describía el cualificador como si
  fuese siempre un marcador en gris. Es derivación, no decisión nueva: no se ha
  fijado ningún umbral. **No se ha tocado código**: el comentario de
  `src/model/decision.ts` que llama a `provisional` «a free boolean in all five
  branches, on purpose» queda desactualizado, y lo corrige la spec del motor,
  que es quien deriva el valor.

- **F-SPEC-001-15** — *`rule` es una sola y las reglas concurren.* `dominio.md`
  fija **una** `rule` por `Decision`, pero `reglas.md` dice que RN-01..RN-07 se
  aplican **en orden** y varias pueden satisfacerse a la vez: una transición
  `scheduled → live` con una única fuente de peso 0.8 cumple RN-06 *y* RN-03.
  `reglas.md` no dice cuál se registra. Si se resuelve tarde, el spike acaba con
  un campo `rule` cuyo valor depende de quién escribió cada rama del motor —
  y `rule` es la mitad de RN-12. Destino: spec del motor de decisiones, con
  `reglas.md` como fuente.

  **Elevado al gate el 2026-08-31 por sdd-arquitecto: no era cerrable por
  derivación.** No hay en las fuentes nada que elija entre las políticas
  posibles, y las tres candidatas tenían costes distintos —una de ellas cambia
  el modelo canónico y `migrations/0001`, ya en `main`—, así que decidirlo sin
  el humano habría sido inventar.

  **CERRADO el 2026-08-31 por Alberto Fojo en el gate.** Política elegida: se
  registra la **regla decisiva**, aquella cuyo efecto no es recuperable del
  resto de la fila, con orden de desempate explícito
  **RN-01 → RN-04 → RN-07 → RN-06 → RN-02/RN-03**. Escrita en **RN-12** de
  `reglas.md`, que es donde vive `rule`, con la salvedad de RN-05 (normalmente
  no emite `Decision`; su cláusula enmendada enruta a RN-01) y con la razón: la
  cláusula «se aplican **en orden**» gobierna la **evaluación** del reducer, no
  la **atribución**, y leerla como atribución haría de `rule` un sinónimo de la
  columna `provisional`. Añadido en la cabecera del bloque del motor un puntero
  a RN-12 para que «en orden» no se pueda volver a leer de dos maneras.
  **Modelo intacto:** `rule` sigue siendo un solo valor de RN-01..RN-07; no hay
  `migrations/0002` ni se reabre el contrato de SPEC-001. Ya no bloquea la spec
  del motor.

Abiertas por sdd-implementador al aplicar la enmienda (2026-08-29, segunda
tanda). La primera es un hueco de un documento de verdad; las otras tres son
desviaciones de forma, resueltas y declaradas para que el verificador las juzgue.

- **F-SPEC-001-16** — *La cabecera de `reglas.md` se contradice con su propio
  cuerpo.* Dice «RN-08 a **RN-12** son invariantes del proyecto», pero el
  documento define RN-08..**RN-13** y RN-13 está en la sección «Invariantes del
  proyecto». Es exactamente el corte que CA-19 usa como fuente para decidir qué
  puede citar una `Decision`, así que un off-by-one ahí es una trampa: leído al
  pie de la letra, RN-13 no sería ni motor ni invariante. Se ha implementado
  CA-19 según el **cuerpo** del documento y según el texto de la spec
  (motor = RN-01..RN-07), que es lo que el gate arbitró. **No he tocado
  `reglas.md`**: es documento de verdad y no es mío. Destino: el humano o
  sdd-producto, una línea.

- **F-SPEC-001-17** — *RN-01 y RN-05 cambiaron hoy y NO tocan esta spec.* RN-01
  incorpora al operador humano con peso 1.0, su precedencia sobre la RFGF, la
  distinción frente al corresponsal (0.8) y `resultados-futbol.com` (0.7); RN-05
  añade que una discrepancia en la que interviene el operador no es conflicto.
  Revisado `src/model/`: **no hay nada que cambiar**, y meterlo aquí sería
  ampliar el alcance por mi cuenta. Razones, en orden:
  1. la propia spec pone el **mapa de pesos por fuente** de RN-01 en *Fuera de
     alcance* con nombre y apellidos: «aquí `confidence` es solo un número en
     [0,1] y `source` un identificador. Quién vale 0.9 y quién 0.7 lo decide la
     spec del motor, que es quien tiene que responder por ello»;
  2. `source` es `SourceIdSchema`, una cadena marcada, **no un enum**: añadir
     una fuente no toca el modelo. Que el operador sea una fuente más es
     precisamente lo que hace que RN-08 y D-3 se sostengan (una corrección del
     panel entra por la misma puerta, sin trasera);
  3. `confidence` es `z.number().min(0).max(1)`, así que 1.0 ya es
     representable, y la **precedencia** del operador sobre la RFGF no es un
     número: es una regla de desempate, es decir, motor.
  Lo que sí cierra RN-01 es **F-SPEC-001-13**, que estaba abierta contra esta
  spec. Destino: spec del motor (junto con F-SPEC-001-4, que es el mismo mapa).

- **F-SPEC-001-18** — *CA-18.1: dónde puede ir el `@ts-expect-error`.* La spec
  pide la directiva «sobre cada uno de estos cuatro literales». Con
  `DecisionSchema` ya convertido en unión discriminada, TypeScript reporta el
  error de un literal que no encaja **en la declaración** y no en la propiedad
  culpable (comprobado: la directiva sobre `home_score: 5` queda *sin usar* y
  `tsc` falla). Las cuatro directivas van por tanto sobre la declaración. Una
  directiva sobre toda una declaración es más ciega —se tragaría una errata en
  otra parte del literal—, así que cada caso lleva al lado un **control bien
  formado de la misma rama** que tiene que compilar limpio: si una rama se
  rompiera por otro motivo, el par deja de cuadrar. El estrechamiento (la
  segunda mitad de CA-18.1) sí va a nivel de propiedad, como en CA-7.
  Destino: verificador.

- **F-SPEC-001-19** — *Dos casos de la tabla compartida no bajan a Postgres.*
  `tests/db/scores.test.ts` recorre la misma tabla que las mitades zod salvo dos
  familias, y el motivo está escrito en el fichero: (a) los casos `absent`,
  porque un `INSERT` que no nombra una columna manda `NULL` y Postgres no puede
  distinguir «ausente» de «nulo» —el caso `null` ya los cubre—; y (b) los casos
  `fractional`, porque `1.5` es irrepresentable en una columna `integer` y quien
  lo rechaza es el tipo de la columna, no el `CHECK`. La lista de `INSERT` que
  la propia CA-18.3 enumera tampoco los incluye. Destino: verificador.

Abiertas por sdd-verificador al verificar (2026-08-30).

- **F-SPEC-001-20 — `npm run lint` no ha corrido nunca. BLOQUEANTE del
  veredicto anterior.** `package.json` declara el script, `eslint@9` está
  instalado y `.sdd.json` pide gate de calidad, pero no hay `eslint.config.*` en
  el repositorio y nunca lo ha habido. Sale con exit 2 sin analizar un solo
  fichero. Destino: el implementador o el humano, antes de reverificar.

  > **CERRADO por reparación, verificado el 2026-08-30 (reverificación).** El
  > script es hoy `oxlint --type-aware`, con `.oxlintrc.json` en el repositorio y
  > ADR-007 registrando la decisión. Comprobado que el linter analiza de verdad y
  > no calla: sobre un fichero trampa fuera del proyecto reporta
  > `no-const-assign`, `no-dupe-keys` y `no-unused-vars` y sale con exit 1.
  > **Ojo:** la reparación llegó con un agujero propio, F-SPEC-001-22, que es el
  > bloqueante nuevo. `.oxlintrc.json` y ADR-007 están **sin versionar** (`??` en
  > `git status`): sin commitear, el gate no existe para nadie más.

- **F-SPEC-001-21 — un marcador fraccionario NO se rechaza en Postgres: se
  redondea.** El motivo escrito en `tests/db/scores.test.ts` y en
  F-SPEC-001-19 dice que `1.5` «es irrepresentable en una columna `integer`».
  Comprobado contra la rama de Neon: `select 1.5::integer` devuelve **2**.
  Postgres no rechaza, redondea, así que un `INSERT` con `home_score = 1.5`
  entraría como `2`. No incumple ningún CA —ni CA-7 ni CA-18.3 piden ese caso en
  Postgres, y zod sí lo rechaza en las dos entidades—, pero el motivo escrito en
  el test es **falso** y quien lo lea creerá que hay una red que no existe.
  Es el único punto donde la doctrina «imposible antes que validable» tiene un
  hueco en la capa de Postgres. Destino: corregir el comentario, y decidir en la
  spec del motor si el hueco merece un `CHECK` o si zod basta.

  > **Comentario CORREGIDO, verificado el 2026-08-30.** `tests/db/scores.test.ts`
  > dice ahora que «Postgres does NOT refuse `1.5` in an `integer` column: it
  > rounds it». Comprobado de nuevo contra la rama de Neon: `select 1.5::integer`
  > → **2**, `select 2.5::integer` → **3**, y `insert ... home_score = -1` sí
  > rebota contra `observations_scores_non_negative`. El texto del test ya
  > describe la realidad. **El hueco sigue abierto**: nada en Postgres rechaza un
  > marcador fraccionario, lo redondea. No incumple ningún CA —ni CA-7 ni CA-18.3
  > lo piden en Postgres, y zod lo rechaza en las dos entidades—. Destino: spec
  > del motor.

Abiertas por sdd-verificador en la reverificación (2026-08-30).

- **F-SPEC-001-22 — el gate de lint es ciego sobre `src/raw/` y `tests/raw/`.
  BLOQUEANTE de este veredicto.** `.oxlintrc.json` lleva `"raw"` en
  `ignorePatterns` sin anclar a la raíz, así que casa con cualquier directorio
  llamado `raw`. Resultado: `npm run lint` sale 0 **sobre 51 de los 61** ficheros
  `.ts`/`.tsx` del árbol, y los 10 excluidos son exactamente
  `src/raw/{store,key,disk,blob,capture}.ts` y
  `tests/raw/{contract,disk,key,capture,blob.contract}.ts` — la implementación de
  CA-9..CA-12 y su batería de contrato. Comprobado que un `const` reasignado y
  una clave duplicada dentro de `src/raw/capture.ts` **pasan** el gate mientras
  los mismos errores en `src/model/score.ts` lo rompen. Y anclando el patrón
  (`"raw"` → `"/raw/"`), sin tocar nada más, el proyecto **no pasa su propio
  lint**: dos `vitest(require-mock-type-parameters)` en
  `tests/raw/capture.test.ts:55` y `:68`, regla que el propio proyecto pone en
  `deny` vía `categories.correctness: "error"`.
  El `raw/` de la raíz que el patrón quería excluir contiene solo `.gitkeep` y
  ningún TypeScript, así que el patrón no protege nada.
  Destino: el implementador o el humano, antes de reverificar. Arreglo: anclar el
  patrón (o borrarlo) y resolver los dos hallazgos que aparecen debajo.

  > **CERRADO por reparación, verificado el 2026-08-30 (segunda
  > reverificación).** `.oxlintrc.json` lleva hoy `"/raw/"` anclado y
  > `npm run lint` analiza **61 de 61** ficheros con 185 reglas, exit 0. No lo
  > doy por bueno por leer el diff: planté errores obvios simultáneos en
  > `src/raw/capture.ts`, `tests/raw/contract.ts`, `src/model/score.ts`,
  > `tests/db/parity.test.ts`, `src/app/page.tsx` y
  > `tests/types/rn12.test-d.ts`, y el gate reportó **los seis** (14 hallazgos,
  > exit 1). Los dos `vitest(require-mock-type-parameters)` de
  > `tests/raw/capture.test.ts:55` y `:68` están **resueltos**
  > (`vi.fn<RawParser<string>>`), no silenciados: la regla sigue en `deny`.
  > Comprobado además que `--type-aware` engancha de verdad —una promesa
  > flotante en `src/raw/capture.ts` sale como
  > `typescript(no-floating-promises)` con el flag y no sale sin él—.

- **F-SPEC-001-23 — el cuerpo de ADR-007 contradice su frontmatter.** El
  frontmatter dice `estado: aprobada` y `aprobada-por: Alberto Fojo` (2026-08-30),
  pero el cuerpo mantiene «Deciders: propone sdd-arquitecto. **Pendiente de
  aprobación humana.**» y «la decisión está implementada y verificada, pero **no
  aprobada**». No toca ningún CA de SPEC-001 y no bloquea; es una línea que
  corregir para que el ADR no se lea al revés de como está firmado. Destino: el
  arquitecto o el humano.

  > **CERRADO, verificado el 2026-08-30 (segunda reverificación).** El cuerpo dice
  > hoy «Deciders: propone sdd-arquitecto. **Aprobado por Alberto Fojo el
  > 2026-08-30.**», coherente con su frontmatter. El ADR añade además, por su
  > cuenta, la nota de que se escribió después del cambio y que eso es una
  > desviación registrada del método, no un precedente.

Abiertas por sdd-verificador en la segunda reverificación (2026-08-30).

- **F-SPEC-001-24 — `.oxlintrc.json` y ADR-007 siguen SIN VERSIONAR.** `git status`
  los da como `??`. No incumple ningún CA y no impide el GREEN —la verificación
  juzga el árbol de trabajo tal como está, y en él el gate existe y muerde—, pero
  **es lo único que hay que resolver antes de que la rama salga de esta máquina**.
  Medido el coste real de que falten: sin `.oxlintrc.json`, `npm run lint` sigue
  saliendo 0 pero con **111 reglas en vez de 185**; entre las 74 que se pierden
  está todo el plugin `vitest`, que es justo el que destapó los dos hallazgos de
  `tests/raw/capture.test.ts`. Es decir: quien clone el repositorio hoy hereda un
  gate materialmente más flojo que el que ADR-007 describe, y ADR-007 tampoco
  está ahí para contarlo. Destino: el humano — un commit.

- **F-SPEC-001-25 — el `UNIQUE (match_id, version)` de CA-15 no está
  discriminado por su test.** `insertDecision` de `tests/db/rn12.test.ts` fija
  `decided_at` a un literal constante en todas las filas, así que el caso «dos
  decisiones no pueden compartir `(match_id, version)`» seguiría pasando aunque
  alguien ensanchara la PK. Comprobado: con
  `primary key (match_id, version, decided_at)` las 270 + 130 quedan verdes. El
  invariante **sí está** en el esquema —lo he leído en `information_schema`— y el
  test sí prueba el rechazo del duplicado; lo que falta es la red contra esa
  regresión concreta. Arreglo de una línea: variar `decided_at` entre las dos
  inserciones del caso. Destino: el implementador, sin prisa.

- **F-SPEC-001-26 — marcas «PENDIENTE DE VERIFICACIÓN» caducas en la matriz.** La
  columna Test de CA-9, CA-12, CA-13, CA-14, CA-15, CA-16, CA-17, CA-18 y CA-19
  todavía dice «PENDIENTE DE VERIFICACIÓN», texto escrito cuando no había
  credenciales. Esas suites han corrido contra Neon y Vercel Blob reales
  (130 + 22 casos, 0 saltados) en las dos últimas reverificaciones. No lo corrijo
  yo: la columna Test es del implementador. Un ledger que se contradice consigo
  mismo se lee mal a la tercera lectura. Destino: el implementador.

  > **RESUELTO — 2026-08-30, sdd-implementador.** Corregidas las nueve filas que
  > nombra el hallazgo **y CA-7**, que arrastraba la misma marca sin estar en la
  > lista: diez en total. La evidencia la he obtenido de cero reejecutando los
  > cinco gates (ver *Tercera tanda*), no copiando el veredicto. Salvo una: la
  > mitad `NOT NULL` de **CA-12** no pasa a verde porque no hay test que la
  > ejercite — se abre **F-SPEC-001-27**.

- **F-SPEC-001-27 — el `NOT NULL` de `raw_ref` (CA-12) está aplicado pero no
  probado.** Al buscar la evidencia para retirar la marca caduca de CA-12
  aparece que nadie prueba esa mitad de la CA. La columna existe y es correcta
  en el esquema vivo (`is_nullable = 'NO'`, `observations_raw_ref_not_null`,
  `observations_raw_ref_check CHECK (length(raw_ref) > 0)`), pero:
  `tests/db/parity.test.ts` compara **nombres** de columna contra
  `information_schema`, no nulabilidad; y el caso
  `'CA-12 raw_ref is NOT NULL'` de `tests/migrations/discovery.test.ts` es un
  canario **textual** sobre el `.sql`, que seguiría verde aunque la migración no
  se hubiera aplicado nunca. Falta el caso barato y directo: dos `INSERT` en
  `observations`, uno con `raw_ref` nulo y otro con `''`, esperando que Postgres
  los rechace — el mismo patrón que ya usan `rn09/rn12/rn13.test.ts`. Sitio
  natural: `tests/db/rn12.test.ts` o un `tests/db/ca12.test.ts`. No es un
  agujero de comportamiento (la restricción está puesta y zod ya rechaza en el
  modelo, `tests/model/raw-ref.test.ts`, 7 casos), es un agujero de red: hoy
  alguien puede quitar el `not null` del 0001 y solo se entera el canario
  textual. Destino: esta misma spec si se reabre; si no, la primera spec que
  toque `observations`.

  > Nota lateral, no la abro como hallazgo aparte porque es cosmética y toca
  > código: varios ficheros de test conservan cabeceras caducas del mismo tipo
  > que las de la matriz — p. ej. `tests/db/parity.test.ts` empieza con
  > `NOT YET VERIFIED: needs DATABASE_URL_TEST`. Hoy corre y sale verde. No lo
  > he tocado porque el encargo era el ledger y no toco código.

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->
Rama `ft/SPEC-001-modelo-canonico-y-raw-store`, **sin push**. La enmienda del
2026-08-29 está aplicada entera.

> **Estado a 2026-08-30 (sdd-implementador). Lo que sigue a partir de «Hecho y
> verde de verdad» quedó escrito cuando faltaban las credenciales y se conserva
> como registro: SUS DOS LISTAS DE «lo siguiente, en cuanto existan
> `DATABASE_URL_TEST` y `BLOB_READ_WRITE_TOKEN`» YA ESTÁN HECHAS.** Las
> credenciales existen (`.env.local`, no versionado), la migración está aplicada
> y las suites de infraestructura corren verdes: `npm run test:db` 7 ficheros /
> 130 casos y `npm run test:blob` 22 casos, 0 saltados en ambas. Los tres tests
> que la lista señalaba como «los que nunca han corrido» —`parity`, `scores`,
> `ca19`— corren sin haber necesitado retoque. No queda infraestructura
> pendiente. Lo único abierto de mi lado es **F-SPEC-001-27** (falta el test del
> `NOT NULL` de `raw_ref`), y la nota de más abajo «No transicionado a
> `en-revision`» está caduca: la spec ya pasó por `en-revision` y está en `hecho`
> por decisión del verificador, no mía.

**Hecho y verde de verdad:** todo el modelo canónico (`src/model/`, ahora con
`score.ts` y con `DecisionSchema` como unión discriminada), el i18n galego
mínimo (`src/i18n/gl.ts`), los puertos (`src/db/ports.ts`) y el raw store sobre
disco (`src/raw/{key,store,disk,capture}.ts`). `npx tsc --noEmit` sale 0 y
`npx vitest run` da **23 ficheros / 270 casos** con el typecheck de los
`.test-d.ts` activo.

**Escrito y sin verificar, esperando credenciales:** `src/raw/blob.ts`,
`migrations/0001_canonical_model.sql`, `src/db/{client,migrate,cli}.ts` y las
suites `tests/db/*.test.ts` (siete ficheros) y `tests/raw/blob.contract.test.ts`.

**Lo siguiente, en cuanto existan `DATABASE_URL_TEST` (rama de test de Neon,
desechable) y `BLOB_READ_WRITE_TOKEN`:**

1. `npm run db:migrate` contra la rama de Neon.
2. `npm run test:db` y `npm run test:blob`, y pegar la salida en el veredicto.
   Ojo: `tests/db/_harness.ts` hace `drop schema public cascade` — apuntar solo
   a una rama desechable.
3. Revisar F-SPEC-001-5 a F-SPEC-001-8: son contradicciones reales de la spec
   resueltas por interpretación. F-SPEC-001-9 y F-SPEC-001-10 **ya están
   resueltos** por la enmienda del arquitecto (2026-08-29).

**Trabajo de la enmienda del 2026-08-29: HECHO.** Los cuatro puntos que dejaba
abiertos esta sección están aplicados —CA-18, CA-19, CA-14 y el nivel Postgres
de CA-7— y sus ficheros están en la matriz. Todo entró **dentro de
`migrations/0001_canonical_model.sql`**, que sigue sin aplicarse a ninguna base;
no hay `0002` ni la debe haber.

**Lo único que queda es infraestructura, no código.** En cuanto existan
`DATABASE_URL_TEST` (rama de test de Neon, desechable) y `BLOB_READ_WRITE_TOKEN`:

1. `npm run db:migrate` contra la rama de Neon.
2. `npm run test:db` (siete ficheros: `migrate`, `parity`, `rn09`, `rn12`,
   `rn13`, `scores`, `ca19`) y `npm run test:blob`, y pegar la salida en el
   veredicto. Ojo: `tests/db/_harness.ts` hace `drop schema public cascade` —
   apuntar solo a una rama desechable.
3. Los tres tests que nunca han corrido son los más nuevos y los más probables
   de necesitar un retoque de forma —no de fondo— la primera vez:
   `tests/db/parity.test.ts` (consulta `information_schema.constraint_column_usage`,
   que exige que el rol sea dueño de las restricciones), `tests/db/scores.test.ts`
   y `tests/db/ca19.test.ts`.
4. Revisar F-SPEC-001-5 a F-SPEC-001-8 y F-SPEC-001-16 a F-SPEC-001-19: son
   interpretaciones y desviaciones de forma declaradas, no trabajo pendiente.

**No transicionado a `en-revision`:** siguen faltando por verificar los CA que
dependen de credenciales. El estado lo mueve el humano o el verificador.


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
  *(Los dos quedaron cerrados en el gate del 2026-08-31; ver el bloque siguiente.)*


## Arbitraje del gate humano — 2026-08-31 (Alberto Fojo)

Cierra los dos follow-ups que el gate del 2026-08-29 dejó vivos. **Nada de esto
toca código, `migrations/` ni el veredicto de SPEC-001**, que sigue `hecho`/GREEN
y mergeada: todo el cambio vive en `docs/fundacion/`.

- **F-SPEC-001-15 RESUELTO. `rule` registra la regla *decisiva*.** De tres
  políticas propuestas por sdd-arquitecto, se elige la que registra la regla
  cuyo efecto **no es recuperable del resto de la fila**, con orden de desempate
  explícito **RN-01 → RN-04 → RN-07 → RN-06 → RN-02/RN-03**. Motivo del humano:
  *registrar la excepcional y no la rutinaria es lo único que hace que `rule`
  añada algo sobre las columnas que ya existen.* RN-02/RN-03 ya están en
  `provisional` y RN-06 en el delta de `status`; RN-01, RN-04 y RN-07 no están
  en ninguna parte. Salvedad de RN-05: normalmente no emite `Decision`, y su
  cláusula enmendada enruta a RN-01. Vive en **RN-12**, con un puntero desde la
  cabecera del motor aclarando que «se aplican en orden» es **evaluación**, no
  atribución. **Rechazadas:** «gana el número más bajo aplicable» (haría de
  `rule` un duplicado de `provisional`) y «`rule` pasa a lista» (obligaría a
  tocar el modelo canónico y `migrations/0001`, ya en `main`, y a reabrir el
  contrato de una spec hecha y verde). **Desbloquea la spec del motor.**

- **F-SPEC-001-14 RATIFICADO.** La enmienda de RN-03 queda firme: *provisional*
  califica la `Decision` entera —el marcador donde lo hay, el **estado** en
  `scheduled` y `postponed`—, y toda `Decision` publicada es o confirmada o
  provisional. Era derivación, no decisión: RN-02 y RN-03 siempre estuvieron
  escritas sobre el peso de las observaciones y nunca sobre el marcador.

- **«Humano» en RN-04 y RN-06 incluye al corresponsal.** Pregunta que
  sdd-arquitecto levantó al cerrar F-SPEC-001-14. Respuesta: **sí**. Donde esas
  reglas dicen «fuente oficial o humano» caben **operador y corresponsal**;
  *operador* es el término específico que la enmienda de RN-01 introdujo para el
  peso 1.0 y la precedencia, y **no estrecha «humano»** en reglas anteriores.
  Consecuencia querida: un corresponsal solo (0.8) **puede aplazar un partido**,
  y esa `Decision` `postponed` se publica *provisional*. Lo que distingue al
  operador no es el permiso sino el peso. Escrito en RN-01, con punteros desde
  RN-04 y RN-06, y en `dominio.md`, que no tenía entrada para **operador** pese a
  que `reglas.md` usaba el término desde el 2026-08-29 — hueco de glosario
  cerrado de paso.

- **Señalado para la spec del motor, no es hueco de `reglas.md`:** los cuatro
  cualificadores de `dominio.md` **no son derivables** del booleano `provisional`.
  *pendente de confirmar* (RN-06, `finished` por timeout) y *sen sinal* (RN-07)
  no tienen dónde vivir en la fila de `Decision`. SPEC-001 CA-8 dejó la
  derivación explícitamente fuera de alcance, así que no es deuda de esta spec:
  es trabajo que la spec del motor tiene que resolver, y conviene que lo sepa
  antes de empezar y no a mitad.


## Enmienda — 2026-09-01: `migrations/0002` invalida la aserción de CA-13

**Esto es una enmienda, no una reapertura y no una autorización.** SPEC-001
sigue en `hecho`, su veredicto sigue siendo **GREEN** y **no se ha tocado una
sola línea del cuerpo de la spec**: CA-13 dice hoy exactamente lo que decía el
2026-08-29, porque un CA es el contrato contra el que se emitió un veredicto y
no se reescribe. Lo que esta sección registra es un cambio en el **alcance** de
ese veredicto, que es de lo que un ledger da fe (ADR-011 §6).

La forma —encabezado de nombre fijo y cinco puntos— es la de **ADR-015 §2 y
§3**, que nace el 2026-09-01 en `borrador` y **no está firmado**. Esta nota no
depende de que se firme: el hecho que registra es de hoy. Es la **segunda vez en
el mismo día** que ADR-015 se aplica antes de estar firmado —la primera es la
enmienda de SPEC-005 CA-10—, y por decisión de **Alberto Fojo** este caso recibe
el mismo trato que aquél. `grep -rn "^## Enmienda —" docs/epicas/` es el índice.

### 1. Qué afirmaba CA-13, y por qué era razonable

CA-13 exige que `npm run db:migrate` levante el esquema sobre una base vacía y
sea **idempotente**: existen las seis tablas, `schema_migrations` contiene la
fila `0001`, y una segunda ejecución termina con éxito, no aplica nada y deja
`schema_migrations` **con una sola fila**.

Su guardián es `tests/db/migrate.test.ts`, que lo mecanizaba **enumerando**:
`expect(applied).toEqual(['0001'])` y
`expect(await appliedVersions()).toEqual(['0001'])`.

Era razonable, y lo sigue siendo como razonamiento. El 2026-08-29 `0001` era la
única migración que existía y la que la propia spec levanta; una lista literal
es la aserción más fuerte que se podía escribir —dice a la vez *qué* se aplicó y
*que no se aplicó nada más*—, y ese «nada más» es la mitad idempotente del
criterio. Una aserción derivada del descubridor habría sido, ese día,
estrictamente más débil: podía pasar en verde descubriendo cero migraciones.

### 2. Qué lo invalida

**`migrations/0002_request_rhythm.sql`**, que entra en el alcance de **SPEC-008**
por la **«Enmienda — 2026-09-01: el estado durable del limitador de RN-11 entra
en SPEC-008 (F-SPEC-008-V13)»**, arbitrada por **Alberto Fojo** el 2026-09-01
(ledger de SPEC-008, «Arbitraje del gate humano — 2026-09-01» §2). La enmienda
ensancha el «Fuera de alcance» que decía **«Tampoco hay `migrations/0002`»**, y
lo hace **contra la recomendación de `sdd-arquitecto`**, que proponía rutar el
arreglo a la spec del cron; el motivo del humano consta entero allí: la promesa
de 1 petición/minuto está publicada a terceros en `/robot`, en galego y en
castellano, y no se retira.

Es una **decisión firmada, no un descuido**: desde el momento en que existe una
segunda migración, una aserción que enumera `['0001']` no puede ser cierta, y
reapuntarla a `['0001', '0002']` la dejaría falsa otra vez el día de `0003`.
Misma forma que **F-SPEC-008-1** (SPEC-005 CA-10 invalidada por ADR-014 §1), y
descubierta igual: como test en rojo en la rama de otra spec.

Conviene dejar dicho que **la enmienda de alcance de SPEC-008 no lo vio**: su §5
enumera con cuidado lo que se lleva por delante —la irreversibilidad de la
migración, que SPEC-008 deja de ser verificable con un solo comando, la
dependencia de Postgres del camino de ingesta— pero **no dice que un CA de
SPEC-001 dejara de ser satisfacible**. Lo levantó el implementador de SPEC-008 en
la tercera vuelta, como **F-SPEC-008-16**.

### 3. Con qué se sustituye, y por qué la red **no** es menor

`tests/db/migrate.test.ts` deriva ahora la lista esperada del propio descubridor
del runner, `readMigrations()`, y **exige que no sea vacía y que contenga `0001`
y `0002`**. Los dos casos siguen probando lo que CA-13 dice: la primera pasada
aplica todo lo pendiente y levanta las seis tablas; la segunda **no aplica nada**
y `schema_migrations` queda con **una fila por versión y ninguna de más**. La
evidencia de la sustitución vive en el ledger de SPEC-008 (tercera vuelta,
F-SPEC-008-16), no aquí.

**La red que queda es equivalente, y esto es lo que distingue esta enmienda de
la de SPEC-005 CA-10** —donde el sustituto era honestamente más débil y así se
escribió—:

- **La mitad idempotente se conserva entera.** «Una sola fila» pasa a «una fila
  por versión, y ninguna más»: es la misma aserción de igualdad, contra una lista
  que ya no es un literal envejecible.
- **El agujero obvio de una aserción derivada está tapado.** El riesgo de
  derivar del descubridor es pasar en verde sin descubrir nada; las dos
  comprobaciones añadidas —lista no vacía, y contiene `0001` **y** `0002`— lo
  cierran. Un `readMigrations()` roto pone el caso rojo.
- **Queda una diferencia real, y se dice sin suavizar**: la aserción vieja
  fallaba el día que apareciera una migración **inesperada**; la nueva no, porque
  la que aparece entra por el mismo descubridor del que se deriva la expectativa.
  Ese deber —vigilar que no se cuele una migración que nadie decidió— **ya no
  vive en CA-13**. Hoy lo cubre la revisión de un diff que añade un fichero a
  `migrations/`, que es exactamente el mismo mecanismo que ADR-006 asume cuando
  dice que deshacer una migración es escribir la siguiente. **Y no hay CI**, así
  que esa revisión es literalmente una persona leyendo el diff.

### 4. El GREEN de SPEC-001 sigue en pie

Lo que cambió es el mundo alrededor del criterio, **no la calidad de la
verificación**. El 2026-08-30 CA-13 se comprobó con el comando literal de la
spec y con evidencia pegada en este mismo ledger: rama de test vaciada
(`drop schema public cascade` → 0 tablas), `npm run db:migrate` → `applied:
0001`, seis tablas más `schema_migrations`; segunda ejecución → `schema is up to
date; nothing applied`, `schema_migrations` con una sola fila `0001`; y
`tests/db/migrate.test.ts` 3/3 contra Postgres real. **Ese hecho ocurrió y no lo
deshace ninguna decisión posterior.**

SPEC-001 responde de que el runner aplique en orden lo pendiente y no repita lo
aplicado, y eso **sigue siendo cierto** con dos migraciones: lo demuestra la
misma suite, verde en la tercera vuelta de SPEC-008 (`npm run test:db` 144/144
contra un Postgres real). **Nada de esta enmienda degrada el veredicto ni pide
reverificar SPEC-001.** El estado `hecho` no se toca: es terminal.

### 5. Qué lo despierta

Hay que recuperar un guardián equivalente al literal en cuanto se dé
**cualquiera** de estas condiciones:

1. **`readMigrations()` deja de ser la única puerta de descubrimiento** —un
   segundo camino que aplique SQL sin pasar por él—. Ese día la expectativa
   derivada y lo aplicado dejan de venir de la misma fuente, y la aserción deja
   de comprobar nada.
2. **Aparece una migración que nadie decidió**, o una que un diff introduce sin
   spec ni ADR que la ampare. Sería la prueba de que el deber que CA-13 dejó de
   cubrir hacía falta mecanizado, y el guardián renace como una lista firmada de
   versiones esperadas, en la spec que la traiga.
3. **`migrations/` gana rollback, ramas o reordenación.** Hoy ADR-006 dice que se
   aplican en orden y sin deshacer; si eso cambia, «una fila por versión» deja de
   ser la forma correcta de decir idempotente y hay que decidir de nuevo.
4. **La suite de `tests/db/` deja de correrse contra un Postgres real** —sin
   `DATABASE_URL_TEST`, CA-13 está **UNMET, no *skipped***, por el gate del
   2026-08-29—. Sin ejecución no hay guardián de ninguna clase.

Mientras ninguna se dé, la diferencia del §3 es **conocida, aceptada y con
fecha**, no un descuido.
