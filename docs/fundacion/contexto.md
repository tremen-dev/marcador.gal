# Contexto maestro — marcador.gal

> Documento vivo: TODO lo que un agente (o una persona) necesita para situarse.
> Se actualiza al cambiar el rumbo; el estado fino spec a spec vive en
> `docs/tablero.md` (generado, no editar), la intención y secuencia en
> `docs/roadmap.md`, y la historia fina en ADRs y specs.
> Última actualización: 2026-09-03 (SPEC-015 y SPEC-016 entregadas y verificadas GREEN: el bot y el gate del build; veinticuatro ADRs).
> corresponsal existe; veintitrés ADRs).

## Qué es y en qué punto está

Marcador de resultados del fútbol galego (Preferente, Primeira e Segunda Galega,
femenino) y de las divisiones nacionales, en directo, en una sola pantalla y en
galego. Relevo con nombre e imagen propios de la desaparecida marcadorgalego.gal
— **inspiración, no sucesión** (D-1).

**Punto actual: quince specs `hecho` y verificadas GREEN, veinticuatro ADRs
`aprobada` e inmutables.** Hay código en `src/model/`, `src/raw/` y `src/db/`
(SPEC-001); en `src/mirror/`, con sus dos fases `capture/` y `analysis/` que no
se importan entre sí (SPEC-002, SPEC-003); en `src/app/`, `src/site/` e
`src/i18n/`, el sitio público de `marcador.gal` (SPEC-004 a SPEC-007); en
`src/polite/`, `src/ingest/`, `src/calendar/` y `src/alias/`, el camino entero
de la ingesta (SPEC-008 a SPEC-012); y desde hoy en **`src/decide/`, el motor de
decisiones** (SPEC-013). `migrations/0001` a `0007`, aplicadas. El bot de Telegram del corresponsal (SPEC-015) lleva la proposición del marcador al piso de la confirmación: el LLM propone dentro de una lista cerrada y una persona confirma, con dos ADRs nuevos (ADR-022, ADR-023).

**Lo que cambió hoy y mueve el punto del proyecto: la `Decision` ya se
escribe.** El motor de RN-01..RN-07 existe, está verificado GREEN y **corre
dentro del tick de ingesta**, no en un cron propio (ADR-021, ADR-019): el ciclo
de `src/decide/cycle.ts` ingiere y decide en la misma invocación, porque un
segundo cron regalaría hasta 60 s de un presupuesto de latencia de 120 s. Con
eso **`decisions` deja de estar vacía**, que era **la** precondición de las
cuatro cifras: la épica define «publicado» como `Decision` escrita, así que la
instrumentación queda desbloqueada.

**Siguen sin existir** `src/api/` (snapshot) y `src/admin/` (panel del
operador).

Tres épicas en juego, cada una en un punto distinto:

- **EPIC-001 — Spike de ingesta**, `aprobada` y **bloqueada de hecho**: sus tres
  specs están hechas y, aun así, no tiene ninguna de las cuatro cifras que
  prometía — `futgal.es` prohíbe el rastreo (ADR-008, RN-11) y solo queda una
  fuente automática capturable. Veredicto el **2026-09-08**, diga lo que diga la
  RFGF.
- **EPIC-002 — Instrumentación de las cuatro cifras**, `aprobada`, descongelada
  el 2026-09-01: **es donde está el trabajo ahora**, y lleva **nueve specs en
  `hecho`**, todas entre el 2026-09-01 y el 2026-09-03 — SPEC-008 (adaptador de
  `ceroacero.es` y la cortesía de RN-11 con un solo dueño, con ADR-014),
  SPEC-009 (esa frontera demostrada sin listas negras, con ADR-016), SPEC-010
  (calendario declarado y repositorios, con ADR-017), SPEC-011 (catálogo de
  alias y resolver, con ADR-018), SPEC-012 (el cron de ingesta, con ADR-019 y
  ADR-020) y **SPEC-013** (el motor de decisiones, con ADR-021), **SPEC-015** (bot de Telegram del corresponsal, con ADR-022 y ADR-023) y **SPEC-016** (el catálogo se resuelve en compilación, `npm run build` pasa a ser gate)). .Quedan
  cuatro, y el orden no es el obvio:** bot de Telegram · panel del operador ·
  snapshot y página mínima por polling · las cuatro cifras. El bot y el panel
  van **antes** que el snapshot porque con una sola fuente automática son la
  única ruta a un marcador *confirmado*.
- **EPIC-003 — Páxina de proxecto e respaldo público da carta**, **`hecho`**
  desde el 2026-09-01, la **primera épica del proyecto que llegó ahí**: entregó
  el sitio público que respalda la carta a la RFGF.

**EPIC-004** (sistema de diseño del marcador, `docs/diseno/`) está `aprobada` y
**congelada a propósito** hasta el go/no-go. **EPIC-MEJORA**, `aprobada` desde el
2026-09-01, es el bucket de deuda técnica del proyecto: su inventario, al día el
2026-09-03, tiene **treinta y dos entradas**, cada una con su disparador escrito.

El nombre y dominio **marcador.gal** están decididos y contratados (2026-08-31,
Dinahosting; expira 2027-08-31).

## Stack y arquitectura (as-built, 2026-09-03)

- Node 22 · TypeScript · Next.js (App Router) · cheerio · zod · grammY ·
  Postgres · vitest (ADR-001). Desplegado en **Vercel Pro** (ADR-004): sin
  scheduler en proceso (Vercel Cron a 1/min), sin disco persistente, sin
  `LISTEN/NOTIFY`.
- Raw store como puerto: Vercel Blob en producción, disco en local y tests
  (ADR-005). Retención de 30 días desde el fin de ventana, prórroga escrita,
  techo duro 90 (ADR-009), y **ADR-020** ancla la del archivo de cada jornada de
  medición a su fecha de fin. La purga sigue **sin ejecutor automático**: es
  ceremonia de una persona y ningún test se pone rojo si nadie la hace.
- Tiempo real: snapshot cacheable + SSE (ADR-003). La decisión del protocolo
  está tomada y **su implementación sigue fuera de alcance**, en EPIC-001 y
  también en EPIC-002: ninguna de las cuatro cifras la necesita, porque
  «publicado» se mide como `Decision` escrita. El snapshot que sí entra es por
  polling.

**Fuentes: de las tres candidatas del spike, solo una es capturable hoy.**
`futgal.es` (oficial, peso 1.0) prohíbe el rastreo en su `robots.txt` y RN-11
obliga a respetarlo (ADR-008 §1); `besoccer.es` (0.7) sirve armazones vacíos,
con el dato tras un `Disallow`. Solo `ceroacero.es` (0.7) queda. **Consecuencia
por aritmética, no por hipótesis:** la segunda vía de RN-02 —dos fuentes
independientes de peso ≥ 0.7— está cerrada, no hay dos. Con una sola fuente
automática, nada llega a *confirmado* sin una persona: el bot del corresponsal
y el panel del operador (`src/admin/`, aún sin escribir) son la única ruta a un
marcador confirmado. **Y desde SPEC-013 eso no es una intención sino código:** la
lista de pares declarados independientes que abriría la segunda vía de RN-02
nace **vacía**, la relación es falsa por defecto y hay un criterio que afirma que
hoy ningún par la satisface (ADR-021 §7). La rama existe, se prueba entera con
dobles, y en producción está inerte.

Estructura del motor, **ya escrita**: `src/polite/` (la cortesía de RN-11, con un
solo dueño, ADR-014) · `src/ingest/` (adaptador y cron, SPEC-008 y SPEC-012) ·
`src/calendar/` y `src/alias/` (calendario declarado y catálogo de alias,
SPEC-010 y SPEC-011) · **`src/decide/` (RN-01..RN-07, SPEC-013)**, con el reducer
puro, la atribución de RN-12, los cualificadores derivados sin columna nueva, el
registro de alertas y el ciclo. **Falta** `src/api/` (snapshot) y `src/admin/`
(panel móvil). El corazón del diseño sigue viviendo en
`docs/fundacion/reglas.md` (RN-01..RN-13) y `docs/fundacion/dominio.md`, y las
cuatro aclaraciones de RN-01, RN-04, RN-05 y RN-06 del 2026-09-02 son las que
hicieron ejecutable el motor.

## Decisiones clave hasta hoy

`FOUNDATION.md` fija D-1 a D-8, locked. Los **veintitrés ADRs** (`docs/adr/`,
listado completo en `docs/tablero.md`) están **aprobados e inmutables**; dos
reabren parcialmente a otros dos ya aprobados, sin editarlos:
[ADR-008](../adr/ADR-008-fuentes-capturables-del-spike-tras-el-dictamen-legal.md)
retira `futgal.es` del conjunto capturable y reabre a
[ADR-002](../adr/ADR-002-fuentes-spike.md); ADR-009 fija la retención del raw
store y reabre a ADR-005.
[ADR-011](../adr/ADR-011-identidad-publica-del-rastreador-forma-estable-del-user-agent.md)
y [ADR-012](../adr/ADR-012-identidad-publica-del-sitio-sin-nombre-con-paraguas-y-con-buzon-delante.md)
fijan la identidad pública del rastreador y del sitio, sin nombrar a nadie, bajo
el paraguas de tremen.dev.
[ADR-013](../adr/ADR-013-semantica-visual-del-marcador-el-acento-de-marca-nunca-es-un-color-de-estado.md)
fija la semántica visual del marcador —el acento de marca nunca es un color de
estado, ningún estado se codifica solo con color, dígitos tabulares, sin
escudos— y obliga en cuanto se toque interfaz. **ADR-014** —el dueño único de la
cortesía de RN-11, que es `src/polite/`— ya está **aprobada**, como los
veintiuno: hoy no queda ningún ADR en `borrador`.

Los que gobiernan el camino recién construido, y que hay que leer antes de
tocarlo: **ADR-017** (el calendario declarado como lista de partidos de
autoridad y versionado), **ADR-019** (el tick sin proceso vivo: ventanas por
partido, medición acotada a jornadas declaradas y estado durable), **ADR-020**
(la retención del archivo de esas jornadas, y el `raw_ref` colgante como estado
declarado) y **ADR-021** (el motor: reducer puro sobre los dos logs, ejecutado
dentro del tick, con la alerta como tabla y el cualificador derivado). Dos más
son de método y muerden en cualquier spec: **ADR-015** —el cuerpo de una spec
cerrada no se edita, se enmienda en su ledger— y **ADR-016** —una frontera de
capacidad se demuestra enumerando lo permitido y exigiendo que el resto sea
vacío, con lo que el mecanismo no alcanza declarado dentro del propio
criterio—.

## Riesgos y preguntas abiertas

Detalle completo en `retos.md`. Lo que condiciona el trabajo inmediato:

- **¿Contesta la RFGF antes del 2026-09-08?** La carta se envió el 2026-09-01 a
  `info@futgal.es` pidiendo dos líneas en su `robots.txt`, no un acuerdo de
  datos. Sin respuesta ese día, se da por no contestada y no se insiste — ni por
  teléfono ni por otra vía. Diga lo que diga, EPIC-001 se cierra ese día.
- **¿Hay una tercera candidata?** `lapreferente.com` sirve HTML real con el
  nombre canónico de la competición, pero no se le ha visto directo; se
  comprueba con partidos en juego, ventana el domingo 2026-09-06.
- **Lo desplegado está construido y hoy está INERTE, y es lo que bloquea las
  cuatro cifras.** El cron corre cada minuto, pero `MEASUREMENT_WINDOWS`
  (`src/ingest/measurement.ts`) **nace vacía** y sin jornada de medición
  declarada el tick no pide nada: el despliegue es estructuralmente incapaz de
  sondear la temporada (ADR-019 §3). Declarar la primera jornada es un acto del
  operador con **dos precondiciones escritas** (ADR-020 §3): el **dictamen de
  `sdd-legal-datos`** sobre capturar jornadas enteras de `ceroacero.es` —la
  pregunta de SPEC-008 notas §7, **todavía sin pedir**— y la **fecha de purga
  escrita antes** de correrla. Igual siguen sin cargarse el calendario y el
  catálogo de alias reales. **Nada de esto es código: es ceremonia pendiente**,
  y hasta que ocurra no hay ni una `Observation` ni una `Decision` de verdad.
- **Legal:** los resultados son hechos sin copyright, pero la extracción
  sistemática de bases de datos está protegida en la UE (derecho *sui generis*)
  y las ToS de los agregadores prohíben scraping. El riesgo está en cómo se
  obtiene el dato, no en el dato. Escudos de clubes: marcas registradas.
- **Coste y sostenibilidad:** Vercel Pro son ~216 €/año antes del primer euro
  de patrocinio, ~4× un VPS equivalente (ADR-004); se reevalúa con las cuatro
  cifras de EPIC-002. El proyecto debe pagarse (D-7): ver
  `docs/negocio/monetizacion.md`.
- **Marca:** la comprobación en OEPM está contestada a medias — «marcador»
  ocupado, «marcador.gal» libre, revisión profesional pendiente. Mientras siga
  pendiente, no se produce ningún activo de marca; la denominación es siempre
  **marcador.gal**, nunca «marcador» a secas.

Las fechas con plazo de todo lo anterior —incluida la purga del raw store del
2026-09-30 (ADR-009)— se reúnen en un índice único:
`docs/procedimientos/calendario-de-compromisos.md`.
