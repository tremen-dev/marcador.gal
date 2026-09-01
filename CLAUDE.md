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

Fase: **spike de ingesta** (`EPIC-001`), paralelo con **sitio público de proyecto** (`EPIC-003`).
- EPIC-001: Objetivo: medir latencia, cobertura, conflictos y minutos de operación manual con Terceira RFEF G1 + Preferente Futgal G1. Código: `src/model/`, `src/raw/`, `src/db/` (SPEC-001), `src/mirror/` (SPEC-002 y SPEC-003), `migrations/0001` aplicada. Las tres specs están hechas y verificadas GREEN. `src/ingest/`, `src/decide/` y `src/api/` siguen sin existir.
- EPIC-003: **Todas cuatro specs `hecho`** (SPEC-004, 005, 006, 007 verificadas GREEN, 2026-08-31 a 2026-09-01). Sitio público en `marcador.gal`: galego por defecto, castellano en `/es`; `/proxecto` y `/robot` en ambas lenguas con paridad de contenido. Componentes en `src/site/`, bundles i18n en `src/i18n/`, rutas en `src/app/(gl)/` y `src/app/(es)/`. `robots.txt` generado dinámicamente. El sitio no nombra a ninguna persona y se presenta bajo el paraguas de tremen.dev (ADR-012). User-agent declarado: `marcador.gal/0.0.1 (+https://marcador.gal/robot; medicion de latencia)` (ADR-011).
- EPIC-004: **aprobada y CONGELADA de nacimiento** (2026-09-01). Guarda el sistema de diseño del marcador (`docs/diseno/`) y no se descongela hasta el go/no-go. Si vas a tocar interfaz, léela antes: su inventario tiene dos entradas que ya disparan —qué cualificador es el estado normal, y que el panel del operador no tiene ningún diseño.

**La ventana de observación no se ha corrido, y hoy no se puede correr entera.**
`futgal.es` prohíbe el rastreo en su `robots.txt` y RN-11 obliga a respetarlo, así
que la fuente oficial **no es capturable** (ADR-008). SPEC-002 queda a la espera de
que lo sea; SPEC-003 mide lo que sí se puede medir sin ella. EPIC-001 **no tiene
todavía ninguna de sus cuatro cifras**.

Hay **trece ADRs**, todos **aprobados e inmutables** (ADR-001 a ADR-013). Para
cambiar uno aprobado, escribe otro ADR que lo supersede; no lo edites. ADR-008 y
ADR-009 superseden **parcialmente** a ADR-002 y ADR-005: lee siempre el que
supersede antes de apoyarte en el viejo. **ADR-013 fija la semántica visual del
marcador**
—el acento de marca nunca es un color de estado, ningún estado se codifica solo
con color, dígitos tabulares, sin escudos— y te obliga en cuanto toques
interfaz, aunque sea una página mínima de medición.

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

Gate de calidad: `npm run lint` → `oxlint --type-aware`. Lo exige `.sdd.json`
(`gates.calidad`) y lo ejecuta el Verificador. **No hay CI todavía**: hoy solo
corre en local, así que nadie lo pasa por ti.

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
src/db/       cliente postgres.js, runner de migraciones, puertos (SPEC-001)
migrations/   SQL numerado, aplicado en orden (ADR-006)
src/mirror/   test de espejo (SPEC-002, SPEC-003): dos fases que no se importan
              capture/  fase A: pide, respeta robots y archiva sin parsear (RN-10, RN-11)
              analysis/ fase B: analiza en frío desde el archivo, con referencia
              analysis/referenceless/  fase B sin referencia (SPEC-003)
              cli/      capturar · analizar · analizar-sin-referencia
src/ingest/   adaptadores por fuente + cron de planificación
src/decide/   motor de decisiones (RN-01..RN-07)
src/api/      snapshot (+ stream SSE, fuera de EPIC-001)
src/admin/    panel mínimo de correcciones y alertas (móvil)
src/app/      Next.js App Router (ADR-001, ADR-004)
  (gl)/       rutas en galego: /proxecto, /robot (SPEC-004, SPEC-005, EPIC-003)
  (es)/       rutas en castellano: /es/proxecto, /es/robot (SPEC-004, SPEC-005)
  robots.txt/ ruta dinámica que genera robots.txt (SPEC-004 CA-11)
  globals.css estilos globales, sin dependencias externas (SPEC-004 CA-9)
src/site/     componentes y utilidades compartidas por el sitio público (EPIC-003)
              contact.ts, redirects.ts, routes.ts, document.tsx, project-page.tsx, robots-txt.ts
src/i18n/     bundles de i18n con paridad galego/castellano (SPEC-004 CA-4, EPIC-003)
              gl.ts, es.ts (bundles del sitio público, D-2)
              site-bundle.ts, site.ts (tipos y contrato)
              El bundle para la interfaz del marcador vive aquí también; cada spec aporta su espacio de nombres
tests/        model/ raw/ db/ types/ mirror/ site/ · fixtures/ SOLO sintéticos
raw/          raíz de DiskRawStore en local; NO versionado

FOUNDATION.md            constitución (D-1..D-8 locked)
docs/tablero.md          estado agregado (GENERADO)
docs/roadmap.md          secuencia de épicas
docs/fundacion/          contexto, visión, dominio, reglas, retos
docs/epicas/             épicas y sus specs
docs/adr/                ADRs
docs/procedimientos/     runbooks operativos (la ventana de observación)
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
