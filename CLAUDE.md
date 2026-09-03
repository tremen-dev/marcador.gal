# CLAUDE.md — marcador.gal

Marcador de resultados del fútbol galego y de las divisiones nacionales en una
sola pantalla. Relevo, con nombre e imagen propios, de la desaparecida
marcadorgalego.gal. Este documento orienta a Claude Code en este repositorio.

## Cómo se trabaja aquí

Estándar **tremen-sdd**. Antes de tocar nada:

1. Lee `FOUNDATION.md` — constitución del proyecto, decisiones **D-1..D-8 locked**.
   Solo un ADR aceptado puede reinterpretarlas.
2. Lee `docs/fundacion/contexto.md` — contexto maestro: dónde estamos y por qué.
3. Todo trabajo entra por `/sdd-orquestador`. **Nada se codea sin SPEC aprobada.**
   El estado `aprobada` lo firma una persona; ningún rol `sdd-*` puede firmarlo.
4. El estado vive en el frontmatter de cada artefacto. `docs/tablero.md` es
   **generado**: regenéralo con `/sdd-tablero`, nunca lo edites a mano.
5. Toda decisión de arquitectura es un ADR en `docs/adr/`. Si vas a tomar una,
   escribe el ADR primero. Un ADR aceptado es inmutable: para cambiarlo, otro ADR
   que lo supersede.
6. El Verificador comprueba contra la spec, no contra la intención.

Roles: `/sdd-orquestador` (entrada), `/sdd-producto`, `/sdd-arquitecto`,
`/sdd-implementador`, `/sdd-verificador`, `/sdd-documentalista`, `/sdd-como-vamos`.
Roles de dominio consultivos: `/sdd-competicion`, `/sdd-legal-datos`,
`/sdd-lingua`. Dictaminan y citan fuente; no implementan.

## Estado actual

Fase: **EPIC-002 — instrumentación de las cuatro cifras**. `EPIC-001` sigue
bloqueada hasta su veredicto y `EPIC-003` ya está **cerrada**.
- EPIC-002: Objetivo: las cuatro cifras (latencia, cobertura, conflictos, minutos de operación manual) que salieron de EPIC-001 el 2026-08-31. **SPEC-008** (adaptador de `ceroacero.es` y cortesía RN-11 con una sola implementación) está **`hecho`** (2026-09-01), junto con **ADR-014**. De su CA-2, que no terminaba, nació **SPEC-009** (la frontera de capacidad de RN-11, demostrada sin listas negras), en `hecho` (2026-09-02). **SPEC-010** (calendario declarado y repositorios), está **`hecho`** (2026-09-02). **SPEC-011** (catálogo de alias y resolver), está **`hecho`** (2026-09-02), junto con **ADR-018**. **SPEC-012** (cron de ingesta, el tick que abre ventanas y persiste Observation), está **`hecho`** (2026-09-02), junto con **ADR-019**. **SPEC-013** (motor de decisiones, el reducer puro de RN-01..RN-07 y el ciclo que lo ejecuta), está **`hecho`** (2026-09-02), junto con **ADR-021**. **SPEC-015** (bot de Telegram del corresponsal, validación humana de propuestas), está **`hecho`** (2026-09-03), junto con **ADR-022** y **ADR-023**. **SPEC-016** (el catálogo de corresponsales se resuelve en compilación, `npm run build` pasa a ser gate), está **`hecho`** (2026-09-03); restaura lo que ADR-022 §2 ya decía. `src/ingest/`, `src/polite/`, `src/calendar/`, `src/alias/`, `src/decide/` y `src/bot/` ya existen.
- EPIC-001: Objetivo: responder, **antes de construir el motor**, la pregunta de la que depende su diseño —¿hay fuentes automáticas usables, y son independientes entre sí?—, la precondición no medida de **RN-02**. Es medición, no producto: el entregable es un **veredicto con evidencia citada** (espejo, independiente o inconcluso) y el instrumento reutilizable que lo produce. Código que deja: `src/model/`, `src/raw/`, `src/db/` (SPEC-001), `src/mirror/` (SPEC-002 y SPEC-003), `migrations/0001` aplicada. Las tres specs están hechas y verificadas GREEN. **Veredicto: 2026-09-08.**
- EPIC-003: **`hecho`** (2026-09-01, firmada por Alberto Fojo) — primera épica del proyecto en llegar ahí. Sus cuatro specs (SPEC-004, 005, 006, 007) verificadas GREEN, 2026-08-31 a 2026-09-01. Sitio público en `marcador.gal`: galego por defecto, castellano en `/es`; `/proxecto` y `/robot` en ambas lenguas con paridad de contenido. Componentes en `src/site/`, bundles i18n en `src/i18n/`, rutas en `src/app/(gl)/` y `src/app/(es)/`. `robots.txt` generado dinámicamente. El sitio no nombra a ninguna persona y se presenta bajo el paraguas de tremen.dev (ADR-012). User-agent declarado: `marcador.gal/0.0.1 (+https://marcador.gal/robot; medicion de latencia)` (ADR-011).
- EPIC-004: **aprobada y CONGELADA de nacimiento** (2026-09-01). Guarda el sistema de diseño del marcador (`docs/diseno/`) y no se descongela hasta el go/no-go. Si vas a tocar interfaz, léela antes: su inventario tiene dos entradas que ya disparan —qué cualificador es el estado normal, y que el panel del operador no tiene ningún diseño.
- EPIC-MEJORA: **aprobada** (2026-09-01). Bucket de deuda técnica sin plazo ni gate, hallazgos inventariados con su disparador escrito: destino de lo que una spec decide no arreglar.

**Esa pregunta ya tiene respuesta, y no la dio el test de espejo sino la aritmética: no hay dos fuentes automáticas capturables, solo `ceroacero.es` (peso 0.7).** La segunda vía de RN-02 —dos fuentes independientes de peso ≥ 0.7 que coinciden— queda **cerrada**, así que **nada llega a *confirmado* sin una persona**: el bot del corresponsal y el panel del operador son la única ruta a un marcador confirmado.

**La ventana de observación no se ha corrido, y hoy no se puede correr entera.**
`futgal.es` prohíbe el rastreo en su `robots.txt` y RN-11 obliga a respetarlo, así
que la fuente oficial **no es capturable** (ADR-008). SPEC-002 queda a la espera de
que lo sea; SPEC-003 mide lo que sí se puede medir sin ella. EPIC-002 **tiene ya el tick de ingesta y el motor de decisiones funcionando, y falta colegir las cuatro cifras tras abrir la ventana**.

Hay **veinticuatro ADRs**, todos **aprobados e inmutables**. Para cambiar uno
aprobado, escribe otro ADR que lo supersede; no lo edites. ADR-008 y ADR-009
superseden **parcialmente** a ADR-002 y ADR-005: lee siempre el que supersede
antes de apoyarte en el viejo. **ADR-013 fija la semántica visual del marcador**
—el acento de marca nunca es un color de estado, ningún estado se codifica solo
con color, dígitos tabulares, sin escudos— y te obliga en cuanto toques
interfaz, aunque sea una página mínima de medición. **ADR-014 fija que la
cortesía de RN-11 tiene un solo dueño**: sale de `src/mirror/` a `src/polite/`
(`robots.ts`, `http.ts`, `user-agent.ts`, `rate-limit.ts`), sin fachada de
compatibilidad. Prohíbe, con test de arquitectura, un segundo parser de
`robots.txt`, construir el `User-Agent` fuera de `src/polite/http.ts`, o pedir a
un tercero sin pasar por `politeFetch`; y su `robots.txt` se archiva en el raw
store antes de parsearse (RN-10, sin excepción por tipo de respuesta), con
vigencia de 6 h y **fallo cerrado**. Lo trajo **SPEC-008** (EPIC-002), ya
`hecho`: `src/mirror/` dejó de ser el domicilio de la cortesía. **ADR-015 fija
qué hacer cuando una decisión posterior invalida un CA de una spec cerrada**: el
cuerpo de la spec **no se edita nunca**; se enmienda en su **ledger** bajo
`## Enmienda — <fecha>: <qué la invalida>`, que es también el índice
(`grep -rn "^## Enmienda —" docs/epicas/`). **ADR-016 fija cómo se demuestra una
frontera de capacidad**: se enumera lo permitido y se exige que el resto sea
vacío, con listas cerradas contra algo que existe fuera del test, sin
exenciones por nombre de fichero, con control positivo por cada mecanismo, y
declarando dentro del propio CA lo que el mecanismo no alcanza — obligatorio
para toda spec que escriba un test de arquitectura. **ADR-017 fija el calendario declarado como lista de partidos de autoridad y versionado**: dónde vive el calendario (`calendario/<temporada>/<competition_id>.json`, versionado), cómo se identifica un partido (`match_id` derivado y estable de competición, jornada, equipos), y las dos semánticas de persistencia (transaccional en `calendar_loads`, con trigger de identidad inmutable). Lo trae **SPEC-010** (EPIC-002), ya `hecho`: `src/calendar/` e implementaciones Postgres de los puertos de SPEC-001 (F-SPEC-001-3 cerrado). **ADR-019 fija el tick de ingesta**: sin proceso vivo, ventanas por partido, medición acotada y estado durable (SPEC-012 `hecho`). **ADR-020 fija la retención del archivo de las jornadas de medición**: 30 días desde el fin de la ventana, prórroga escrita, techo de 90 (SPEC-012 `hecho`). **ADR-021 fija el motor de decisiones**: reducer puro sobre los dos logs (Observation y Decision), ejecutado dentro del tick, con la alerta como tabla y el cualificador derivado (SPEC-013 `hecho`).

## Reglas duras

Las reglas de negocio viven **numeradas y en un solo sitio**:
`docs/fundacion/reglas.md` (**RN-01..RN-13**). Cítalas por su número desde specs,
ADRs y commits; no las repitas aquí ni las parafrasees en el código. Las que más
se incumplen por descuido:

- **RN-08**: ninguna fuente publica un marcador sin pasar por el motor de decisiones.
- **RN-09**: un LLM nunca es la única fuente de un marcador. Alias y parseo de
  mensajes de corresponsal: salida JSON validada **y confirmación humana**.
- **RN-10**: toda respuesta cruda se guarda en el raw store **antes** de parsearse.
- **RN-11**: scraping con robots.txt, user-agent identificado y máximo 1
  petición/minuto por competición. Es medición, no producción.
- **RN-12**: cada Decision registra la regla aplicada y las observaciones que la
  sostienen.
- **ADR-009**: el raw store **no se guarda para siempre** — 30 días desde el fin
  de la ventana, una prórroga escrita, techo duro de 90. Y **nunca se versiona
  HTML real de terceros** en el repositorio: `tests/fixtures/` es solo sintético.
  Lo segundo es irreversible si se incumple, porque git no se purga, se reescribe.

El glosario canónico está en `docs/fundacion/dominio.md`. Si un término falta, se
añade allí **antes** de usarse.

## Lenguas

- Documentación, specs, ADRs y commits: **castellano**.
- Código, identificadores y comentarios: **inglés**.
- Todo texto visible al usuario (UI, bot, notificaciones): **galego** por defecto,
  con castellano como opción (**D-2**). Los literales van en ficheros de i18n
  desde el primer día; nunca hardcodeados.
- Nombres de equipos y competiciones: los **canónicos de la RFGF**. No se traducen
  (ver `dominio.md`).

## Stack y plataforma (ADR-001, ADR-004, ADR-006, ADR-007, aprobados)

Node 22 · TypeScript estricto · Next.js (App Router) · cheerio · zod · grammY ·
Postgres · vitest. Linter: **oxlint** con reglas type-aware (`.oxlintrc.json`,
ADR-007). Desplegado en **Vercel Pro**.

Gate de calidad: **`npm run gates`**, que encadena, en este orden y parando en
el primer fallo, `npm run typecheck` → `npm run lint` → `npm run build` →
`npm test`. El orden es de coste creciente y diagnóstico decreciente. Lo exige
`.sdd.json` (`gates.calidad`) y lo ejecuta el Verificador. `npm run test:db`
queda **fuera** y sigue siendo un comando aparte —necesita `DATABASE_URL_TEST` y
una rama de Neon compartida entre worktrees—, pero es igual de obligatorio.

**`npm test` no puede ver lo que sólo ve el empaquetador**: el build entró en el
gate porque SPEC-015 dejó en `src/bot/catalog.ts` un `new URL(x, import.meta.url)`
que bajo Node es un cálculo de ruta normal —suite entera en verde— y que
Turbopack lee como recurso a resolver en compilación. El despliegue falló y
ningún gate lo vio (SPEC-016). **No hay CI todavía**: `npm run gates` hace que el
gate sea *un* comando, no que alguien lo corra; hoy solo corre en local, así que
nadie lo pasa por ti.

Consecuencias que se olvidan y rompen cosas:
- **No hay scheduler en proceso.** La ingesta va en Vercel Cron a 1/minuto, que
  coincide con el techo de RN-11. Las ventanas por partido se calculan dentro del
  tick.
- **No hay disco.** Sistema de ficheros efímero: el raw store es un puerto con
  Vercel Blob en producción y disco en local y tests (ADR-005).
- **No hay `LISTEN/NOTIFY`.** Sin proceso vivo no hay bus interno.
- `zod` define el modelo canónico, valida la salida JSON del LLM (RN-09) **y
  exporta el tipo que consume el frontend**. Ese contrato único es la razón de
  elegir Node; no lo dupliques a mano.
- **El modelo canónico vive en `src/model/`, no en `src/decide/`.** Lo importa el
  frontend; no puede colgar del motor.
- **Los instantes son cadenas ISO 8601 UTC, nunca `Date`** (ADR-006). `Date` no
  sobrevive a `JSON.stringify`/`parse` y el tipo cruza al cliente por JSON.
- Acceso a datos con `postgres.js` y SQL etiquetado. **Sin ORM**: RN-12 y RN-13
  viven en triggers de plpgsql y en `CHECK` sobre arrays (ADR-006).
- Migraciones: `migrations/NNNN_slug.sql` en orden, sin rollback automático.
  Deshacer es escribir la migración siguiente.

## Estructura

```
src/model/    modelo canónico en zod + tipos derivados (SPEC-001)
src/raw/      puerto RawStore: store.ts, disk.ts, blob.ts, capture.ts (SPEC-001)
src/db/       cliente postgres.js, runner de migraciones, puertos, rate-limit.ts (SPEC-001, SPEC-008);
              calendar.ts, observations.ts, decisions.ts, matches.ts, arrays.ts (SPEC-010);
              aliases.ts (SPEC-011); ingest-attempts.ts (SPEC-012); alerts.ts (SPEC-013);
              bot.ts (SPEC-015)
migrations/   SQL numerado, aplicado en orden (ADR-006); 0001, 0002, 0003, 0004, 0005, 0006 y 0007 aplicadas
src/polite/   cortesía RN-11 con un solo dueño (ADR-014, SPEC-008): robots.ts,
              http.ts, user-agent.ts, rate-limit.ts, policy.ts, policy-durable.ts, clock.ts.
              src/mirror/ ya no es su domicilio
src/mirror/   test de espejo (SPEC-002, SPEC-003): dos fases que no se importan
              capture/  fase A: pide, respeta robots y archiva sin parsear (RN-10, RN-11)
              analysis/ fase B: analiza en frío desde el archivo, con referencia
              analysis/referenceless/  fase B sin referencia (SPEC-003)
              cli/      capturar · analizar · analizar-sin-referencia
src/alias/    catálogo de alias declarado (SPEC-011): catalog.ts, ports.ts, resolver.ts,
              cli.ts, command.ts
src/ingest/   adaptador de ceroacero.es (SPEC-008), cron de ingesta (SPEC-012):
              adapter.ts, ceroacero.ts, observations.ts, ports.ts, sources.ts,
              windows.ts, tick.ts, measurement.ts, attempts.ts, cron.ts
src/calendar/ calendario declarado a mano (SPEC-010): schedule.ts, time.ts, ids.ts,
              declared.ts, ports.ts, cli.ts, command.ts
src/decide/   motor de decisiones (SPEC-013, RN-01..RN-07): rules.ts, roles.ts,
              independence.ts, thresholds.ts, attribution.ts, qualifier.ts, alert.ts,
              apply.ts, cycle.ts, replay.ts, ports.ts, engine-entry.ts (SPEC-015)
src/bot/      bot de Telegram del corresponsal (SPEC-015, RN-09): telegram.ts, webhook.ts,
              correspondents.ts, catalog.ts, archive.ts, candidates.ts, windows.ts,
              observation.ts, proposal.ts, llm.ts, prompt.ts, redact.ts, commands.ts,
              card.ts, ports.ts
src/api/      snapshot (+ stream SSE, fuera de EPIC-001)
src/admin/    panel mínimo de correcciones y alertas (móvil)
src/app/      Next.js App Router (ADR-001, ADR-004)
  (gl)/       rutas en galego: /proxecto, /robot (SPEC-004, SPEC-005, EPIC-003)
  (es)/       rutas en castellano: /es/proxecto, /es/robot (SPEC-004, SPEC-005)
  api/cron/   cron de ingesta `/api/cron/ingest` (SPEC-012)
  api/telegram/webhook/  webhook de Telegram `/api/telegram/webhook` (SPEC-015)
  robots.txt/ ruta dinámica que genera robots.txt (SPEC-004 CA-11)
  globals.css estilos globales, sin dependencias externas (SPEC-004 CA-9)
src/site/     componentes y utilidades compartidas por el sitio público (EPIC-003)
              contact.ts, redirects.ts, routes.ts, document.tsx, project-page.tsx, robots-txt.ts
src/i18n/     bundles de i18n con paridad galego/castellano (SPEC-004 CA-4, EPIC-003)
              gl.ts, es.ts (bundles del sitio público, D-2)
              site-bundle.ts, site.ts (tipos y contrato)
              bot-bundle.ts, bot.ts (bundle del bot, SPEC-015)
              crawler-bundle.ts, crawler.ts (bundle del mirror, SPEC-002/003)
              statuses-bundle.ts, statuses.ts (estados de marcador)
              titles-bundle.ts, titles.ts (títulos de página)
tests/        model/ raw/ db/ alias/ calendar/ stores/ types/ mirror/ site/ decide/ bot/ · fixtures/ SOLO sintéticos
corresponsais/ catálogo declarado de correspondent_id por temporada (SPEC-015);
              mapeo telegram_user_id → correspondent_id NO se versiona, va en TELEGRAM_CORRESPONDENTS (ADR-022 §2)
raw/          raíz de DiskRawStore en local; NO versionado

FOUNDATION.md            constitución (D-1..D-8 locked)
docs/tablero.md          estado agregado (GENERADO)
docs/roadmap.md          secuencia de épicas
docs/fundacion/          contexto, visión, dominio, reglas, retos
docs/epicas/             épicas y sus specs
docs/adr/                ADRs
docs/procedimientos/     runbooks operativos: ventana de observación, carga del calendario, carga de
              alias, jornada de medición; calendario-de-compromisos.md (fechas con plazo)
docs/negocio/            monetización y marca
docs/diseno/             sistema de diseño del marcador: fuentes, tokens y lienzo (EPIC-004)
```

## Principios de marca (para Frontend y cualquier texto)

- Fútbol en galego, urbano o no. Nada de tópicos rurales en imagen ni tono. La
  Preferente se juega en Vigo, A Coruña, Ourense y Ferrol igual que en cualquier
  vila.
- El producto es densidad: todo en una pantalla, números tabulares, legible con
  mala cobertura.
- No presentarse como continuación de Marcador Galego; inspiración, no sucesión
  (**D-1**).

## Lo que NO está en alcance del spike

Interfaz definitiva, usuarios, notificaciones push, más competiciones,
patrocinio, logo. El nombre y dominio ya están decididos y contratados (marcador.gal,
2026-08-31, Dinahosting; expira 2027-08-31).
