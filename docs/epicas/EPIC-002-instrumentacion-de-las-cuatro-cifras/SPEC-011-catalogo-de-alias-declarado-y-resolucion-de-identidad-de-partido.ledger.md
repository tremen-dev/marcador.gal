---
id: SPEC-011
tipo: ledger
epica: EPIC-002
---
# Ledger — SPEC-011 Catálogo de alias declarado y resolución de identidad de partido

## Resumen

- **LO ÚLTIMO (2026-09-02): implementación completa, en `en-revision`, a la
  espera del verificador.** Los 9 CA implementados CA a CA con TDD en la rama
  `ft/SPEC-011-catalogo-de-alias`. Gates: `npm run lint` exit=0; `npm test`
  **896/896** (95 ficheros, sin errores de tipo); `npm run test:db` **237/237**
  (19 ficheros, contra la rama de Neon). Los tests de capacidad de SPEC-009
  pasan **117/117 sin ningún global nuevo concedido** y con `ENTRY_POINTS`
  ganando exactamente una línea (`src/alias/cli.ts`, con motivo).
- Código nuevo: `src/alias/` (catalog, ports, resolver, command, cli),
  `src/db/aliases.ts`, `migrations/0004_alias_loads.sql`. **Ningún fichero de
  una spec cerrada bajo `src/` se toca** (el diff contra `main` en `src/` son
  solo ficheros nuevos, ADR-011 §6). En `tests/`: suites nuevas
  (`tests/alias/`, cinco ficheros en `tests/db/`, un `.test-d.ts`, el fixture
  sintético `tests/fixtures/aliases.ts`) y **una** suite cerrada retocada —
  `tests/db/calendar-schema.test.ts`, dos aserciones enumerantes que
  `migrations/0004` deja falsas por decisión; enmendado por ADR-015 en el
  ledger de SPEC-010 («Enmienda — 2026-09-02»), mismo recuento de casos (8/8).
- 2026-09-02 (mañana): la spec nace en `borrador` junto con ADR-018; ambos
  firmados `aprobada` por Alberto Fojo el mismo día. El término **catálogo de
  alias declarado** ya está en `dominio.md`.

## Criterios de aceptación

| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 esquema del fichero | `src/alias/catalog.ts` (`AliasCatalogSchema`, `parseAliasCatalog`, `InvalidCatalogError` que nombra entrada o campo; colisiones tras `normalizeAlias` cerradas en `superRefine`; `declareAliasCatalog`/`readAliasCatalogFile` con digest sha256 reutilizando `sha256Hex` de SPEC-010); fixture sintético `tests/fixtures/aliases.ts` (6 entradas, `ud-ourense` con tres grafías, una con acento) | `tests/alias/catalog.test.ts` — 12 casos: el fixture valida entero; las 10 variantes del CA rechazadas nombrando entrada/campo (kebab-case, alias vacío, doble espacio, NFC compuesta/descompuesta vía `́`, duplicado exacto, `declared_by` vacío, `2026-27`, `CeroACero`, instante inválido, `aliases: []`); y un no-objeto. `npm test`, puro | — | ⬜ |
| CA-2 carga con reemplazo transaccional | `src/db/aliases.ts` `loadAliasCatalog(sql, file, { clock })`: una transacción — `team_id` ausente de `teams` rechaza entero nombrándolo (`UnknownTeamError`), delete+insert del `(source, season)` completo (`proposed` incluidas), otras fuentes/temporadas intactas, `confirmed_by`/`confirmed_at` de la declaración normalizado a `Z` (`instantOf(epochMsOf(…))`), fila en `alias_loads` al final; nada escrito si algo falla. `pgTextArray` para el `any(…)` (F-SPEC-010-6) | `tests/db/alias-load.test.ts` §CA-2 — 7 casos: tabla exacta + `inserted`/`removed`; recarga idéntica `[]/[]`; añadida+retirada+reapuntada con las tres nombradas y la retirada sin resolver vía `resolveConfirmedAlias` sobre `listBySource` real; `besoccer` y `2027/28` intactas; `proposed` barrida; equipo fantasma rechaza entero sin cambiar tabla ni `alias_loads`; todo-o-nada con reloj roto que revienta el último insert de la transacción. Requiere `DATABASE_URL_TEST` | — | ⬜ |
| CA-3 registro `alias_loads` inmutable | `migrations/0004` + el insert final de `loadAliasCatalog` (digest de los bytes, `loaded_at` del `Clock` inyectado, recuentos coherentes con el resultado) | `tests/db/alias-load.test.ts` §CA-3 — 4 casos: fila completa con digest sha256 verificado en el test, `loaded_at` del reloj congelado, `declared_at` en `Z`; segunda carga = segunda fila con `inserted = 0`; `update`/`delete` rechazados por `reject_amendment`; `declared_by = ''` rechazado por la base | — | ⬜ |
| CA-4 `PostgresAliasStore` | `src/db/aliases.ts` `PostgresAliasStore.listBySource`: parse por `TeamAliasSchema.readonly()` (congelado sin conceder `Object.freeze`), orden `alias, team_id`, la rama `proposed` construida sin los `null` de SQL (los `never` de SPEC-001 no admiten `null`) | `tests/db/alias-store.test.ts` — 3 casos (completo/congelado/ordenado con `InstantSchema` sobre `confirmed_at`; nada de otra fuente/temporada; `proposed` sin rastro de confirmación). Muerde: mutación temporal (sin `.readonly()`, otro orden) → 1 caso en rojo, restaurado. Tipo: `tests/types/spec011-alias-store.test-d.ts` — sin `insert`/`update`/`delete` (`@ts-expect-error` invertido) y superficie == puerto | — | ⬜ |
| CA-5 resolver todo o nada (dobles) | `src/alias/resolver.ts` `catalogMatchResolver({source, season, aliases, matches})`: `resolveConfirmedAlias` reutilizado (el diff no reimplementa comparación), `listByTeams`, exactamente uno o `null`; sin `canonical_name`, sin `source_ref`/`kickoff`, sin reloj ni red. `src/alias/ports.ts` `AliasStore.listBySource` (un método, `proposed` incluidas) | `tests/alias/resolver.test.ts` — 6 casos sobre dobles en memoria con el `MatchId` derivado de `declaredMatches` (no inventado): grafía con espacios de más + Unicode descompuesta resuelve exacto; desconocidos → `null` (3 combinaciones); canónico sin alias → `null`; `proposed` → `null`; cero y dos partidos → `null`; `source_ref`/`kickoff` irrelevantes y caja significativa. `npm test`, puro | — | ⬜ |
| CA-6 integración real punta a punta | (composición: sin código nuevo — ese es el punto del CA) | `tests/db/alias-resolution.test.ts` — 2 casos contra la base real: `resolve` con `PostgresAliasStore` + `PostgresMatchStore` devuelve `futgal-preferente-g1-2026-27-j1-ud-ourense-rc-celta-b` exacto; `readRows` de SPEC-008 (sin tocar) con este resolver → **una** `Observation` con ese `match_id` y la fila desconocida **entera** en `unresolved`. Nota honesta: pasó a la primera — cada pieza ya había pasado su propio rojo→verde; el CA es el encaje | — | ⬜ |
| CA-7 CLI `alias:cargar` | `src/alias/cli.ts` (hook de resolución + import dinámico, como los CLI existentes), `src/alias/command.ts` (`main(argv, io)` inyectado; orden: fichero entero → `requireDatabaseUrl` → `openClient`; lo retirado se lista por grafía como «no longer resolves»); `package.json` script; `tests/polite/support/capability.ts` `ENTRY_POINTS` += `src/alias/cli.ts` con motivo — **lo único tocado en `tests/polite/`** | `tests/alias/command.test.ts` — 9 casos (`npm test`): válido → recuentos + load id, exit 0, cliente cerrado; inválido → error CA-1 nombrando entrada, **`openClient` sin llamar**; inexistente; sin `DATABASE_URL` → «DATABASE_URL is not set»; sin ruta → usage; carga fallida → exit 1 y cliente cerrado; **dos arranques reales de `node src/alias/cli.ts`**. `tests/db/alias-cli.test.ts` — 3 casos con cliente real: 6/0 + id; retirada nombrada; fantasma → exit 1 sin fila nueva | — | ⬜ |
| CA-8 `migrations/0004` | `migrations/0004_alias_loads.sql`: una tabla (`alias_loads`, identity PK, `declared_by` no vacío, digest `^[0-9a-f]{64}$`, `aliases_count >= 1`) y un trigger (`reject_amendment` de 0001 reutilizado, sin función propia). SQL a mano, sin ORM, sin rollback | `tests/db/alias-schema.test.ts` — 8 casos: cuarta en disco; `migrate` → `['0001','0002','0003','0004']` y luego `[]`; tabla y trigger leídos **de la migración**; sin función propia; el SQL ejecutable no nombra `team_aliases` ni altera nada; los `CHECK`s de CA-17 muerden por SQL directo (sin persona, y persona vacía); a mano. CA-8.3: `parity.test.ts` verde **sin entrada nueva** (sus mapas no cambian en el diff) | — | ⬜ |
| CA-9 gates y suites cerradas | — | `npm run lint` exit=0 · `npm test` 95 ficheros / **896 passed**, Type Errors: no errors · `npm run test:db` 19 ficheros / **237 passed** (salidas literales abajo). `tests/polite` 117/117 **sin global nuevo**; diff de `tests/` contra `main`: solo altas salvo `calendar-schema.test.ts` (8 casos antes y después, ver enmienda) y las 5 líneas de `capability.ts` (1 entrada + motivo) | — | ⬜ |

### Salidas literales de los gates (2026-09-02, implementador)

```
$ npm run lint
> oxlint --type-aware
(exit=0)

$ npm test
 Test Files  95 passed (95)
      Tests  896 passed (896)
Type Errors  no errors

$ npm run test:db
 Test Files  19 passed (19)
      Tests  237 passed (237)
```

## Decisiones tomadas por el implementador (no fijadas por la spec)

1. **Enmienda ADR-015 sobre SPEC-010 CA-10.** `migrations/0004` deja falsas
   las dos aserciones que enumeraban `['0001','0002','0003']` en
   `tests/db/calendar-schema.test.ts` — la forma exacta de F-SPEC-008-16.
   Registrada en el ledger de SPEC-010 («Enmienda — 2026-09-02», cinco
   puntos), aserciones derivadas de `readMigrations` conservando la sustancia
   (0003 tercera, orden, idempotencia), recuento de casos intacto. Ver
   F-SPEC-011-1: la letra de CA-2.8 no era satisfacible.
2. **`inserted`/`removed` a nivel de par `(alias → team_id)`.** La entrada
   reapuntada de CA-2.3 aparece en las dos listas: su par nuevo en `inserted`
   y su par viejo en `removed`. Es lo que hace verdad «el resultado nombra las
   tres» y deja la recarga idéntica en `[]/[]`.
3. **Fallo inducido de CA-2.7**: un `Clock` que devuelve `'not-an-instant'`
   revienta el insert de `alias_loads` — el **último** paso de la transacción,
   después del delete y los inserts — y ninguna tabla cambia.
4. **«Congelado» de CA-4 = `TeamAliasSchema.readonly()`**, como hace
   `ObservationSchema`: congela el parse sin conceder `Object.freeze` (la
   superficie de `Object` solo tiene `entries`, y CA-9 prohíbe concesiones).
5. **`aliases_count >= 1` en la base** (el calendario usa `>= 0` para
   `matches_count`): el esquema del fichero impide el catálogo vacío
   (CA-1.10), así que una fila con 0 sería siempre mentira.
6. **La CLI escribe en inglés**, la misma forma que `calendario:cargar` y
   `db:migrate`. Cae bajo el juicio pendiente de F-SPEC-010-9; ver
   F-SPEC-011-2.
7. **El resolver relee `listBySource` en cada `resolve`**: la copia que se lee
   es la de Postgres (ADR-004) y el determinismo no depende de cachear — con
   el mismo catálogo, calendario y bytes resuelve lo mismo. Quien quiera
   amortizar la lectura por tick lo decide la spec del cron con su `AliasStore`.
8. **`UnknownTeamError` nombra el primer `team_id` ausente** (como el «naming
   it» del CA, en singular); el mensaje dice qué hacer (cargar antes el
   calendario o corregir la entrada).
9. **`tests/db/alias-cli.test.ts` existe sin que el CA lo exija letra a
   letra**: «cuenta lo que hizo» contra recuentos de verdad, el mismo patrón
   que SPEC-010 usó en `tests/db/cli.test.ts`.

## Salvedades / follow-ups

- **F-SPEC-011-1** — **CA-2.8/CA-9 dicen «sin tocar una aserción» y dos
  aserciones de `tests/db/calendar-schema.test.ts` están tocadas.** No era
  satisfacible a la letra: CA-8 ordena `migrations/0004` y esas dos aserciones
  enumeraban las migraciones, así que con 0004 en disco la suite cerrada
  estaba en rojo. Resuelto por la vía que ADR-015 fija (enmienda en el ledger
  de SPEC-010, aserción derivada, sustancia y recuento intactos), con el
  precedente de F-SPEC-008-16. **El verificador tiene que juzgar esta
  desviación explícitamente**; si la considera fuera de lo enmendable, es RED
  y vuelve aquí.
- **F-SPEC-011-2** — el texto de la CLI está en inglés, como todos los
  comandos del repositorio. Es la misma cuestión abierta de F-SPEC-010-9 y
  debería despacharse para todos los comandos a la vez, no por spec.
- **F-SPEC-011-3** — `alias/` (el directorio de ficheros reales) no existe
  aún y no debe existir: el fichero real de los 36 equipos es del operador,
  tras el calendario real y los dictámenes de `sdd-competicion` y
  `sdd-legal-datos` (§Fuera de alcance, notas §6-7 de la spec). Nada que
  hacer en esta spec; que nadie lo «complete» por ayudar.
- **F-SPEC-011-4** — el reemplazo barre las filas `proposed` de su
  `(source, season)` (CA-2.5, probado). Mina con cartel para la spec del bot,
  ya escrita en ADR-018 §*Lo que no decide*; se repite aquí para que el
  arquitecto del bot la encuentre también por `grep F-SPEC-011`.

## Para el verificador

1. **Los dos comandos de suites**: `npm test` y `npm run test:db` (este último
   con `DATABASE_URL_TEST`; sin él, CA-2, CA-3, CA-4, CA-6 y CA-8 son UNMET).
   Comprobar que no hay otro vitest colgando de la misma rama de Neon
   (`ps aux | grep vitest`, F-SPEC-010-7); un `ENOTFOUND` de Neon es DNS,
   repetir (F-SPEC-008-21).
2. **La carga dos veces + la tercera con fichero modificado** (CA-2): está
   mecanizada en `tests/db/alias-load.test.ts` casos 2 y 3, y se puede ver a
   mano con `npm run alias:cargar` contra la rama de test (el flujo real está
   en `tests/db/alias-cli.test.ts`). Lo central de ADR-018: la retirada
   **deja de resolver** en esa misma carga.
3. **Leer el diff, no solo correr**: que `src/alias/resolver.ts` usa
   `resolveConfirmedAlias` y no reimplementa la comparación (CA-5.4); que la
   migración es SQL a mano (CA-8.4); que `parity.test.ts` no ganó entradas
   (CA-8.3); que `ENTRY_POINTS` ganó exactamente una línea y `ALLOWED_GLOBALS`
   / `ALLOWED_PACKAGES` ninguna (CA-9); que `src/ingest/`, `src/model/`,
   `src/calendar/` y `src/db/ports.ts` no tienen diff.
4. **La desviación F-SPEC-011-1** (enmienda sobre SPEC-010) es la única
   edición a una suite cerrada: juzgarla contra ADR-015 y su precedente.
5. Recuento fichero a fichero contra `main` (CA-9): el diff de `tests/` solo
   añade ficheros salvo lo dicho arriba.

## Cómo retomar (handoff)

1. Rama: `ft/SPEC-011-catalogo-de-alias`, todo commiteado, spec en
   `en-revision`. Sin push (prohibido al implementador).
2. Si el verificador da RED: los findings vuelven a `sdd-implementador` en
   esta misma rama; el ledger y la spec son la memoria (no hay otra).
3. Si da GREEN: el humano firma `hecho`; después `sdd-documentalista` —
   `CLAUDE.md` §Estructura (`src/alias/`, `tests/alias/`, `src/db/aliases.ts`,
   `migrations/0004`, script `alias:cargar`), runbook de carga de alias junto
   al del calendario, tablero.
4. Para la spec siguiente (el cron): el resolver se construye con
   `catalogMatchResolver({ source, season, aliases: new PostgresAliasStore(sql),
   matches: new PostgresMatchStore(sql) })` — `(source, season)` de SU
   configuración; `loadAliasCatalog` está en `src/db/aliases.ts` y el formato
   del fichero en `src/alias/catalog.ts`. El fichero real de alias sigue sin
   existir (F-SPEC-011-3) y sus minutos de escritura cuentan para la cifra de
   operación manual.
