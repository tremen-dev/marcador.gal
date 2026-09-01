# Contexto maestro — marcador.gal

> Documento vivo: TODO lo que un agente (o una persona) necesita para situarse.
> Se actualiza al cambiar el rumbo; el estado fino spec a spec vive en
> `docs/tablero.md` (generado, no editar), la intención y secuencia en
> `docs/roadmap.md`, y la historia fina en ADRs y specs.
> Última actualización: 2026-09-01 (EPIC-003 cerrada, primera épica en `hecho`).

## Qué es y en qué punto está

Marcador de resultados del fútbol galego (Preferente, Primeira e Segunda Galega,
femenino) y de las divisiones nacionales, en directo, en una sola pantalla y en
galego. Relevo con nombre e imagen propios de la desaparecida marcadorgalego.gal
— **inspiración, no sucesión** (D-1).

**Punto actual: siete specs `hecho` y verificadas GREEN, trece ADRs `aprobada`
e inmutables.** Hay código en `src/model/`, `src/raw/` y `src/db/` con
`migrations/0001` aplicada (SPEC-001); en `src/mirror/`, con sus dos fases
`capture/` y `analysis/` que no se importan entre sí (SPEC-002, SPEC-003); y en
`src/app/`, `src/site/` e `src/i18n/`, el sitio público de `marcador.gal`
(SPEC-004 a SPEC-007). **Siguen sin existir** `src/ingest/`, `src/decide/`,
`src/api/` y `src/admin/`: el motor de decisiones (RN-01..RN-07) todavía no se
ha escrito.

Tres épicas en juego, cada una en un punto distinto:

- **EPIC-001 — Spike de ingesta**, `aprobada` y **bloqueada de hecho**: sus tres
  specs están hechas y, aun así, no tiene ninguna de las cuatro cifras que
  prometía — `futgal.es` prohíbe el rastreo (ADR-008, RN-11) y solo queda una
  fuente automática capturable. Veredicto el **2026-09-08**, diga lo que diga la
  RFGF.
- **EPIC-002 — Instrumentación de las cuatro cifras**, `aprobada`, descongelada
  el 2026-09-01: **es donde está el trabajo ahora**. Su primera spec, SPEC-008
  (adaptador de `ceroacero.es` y cortesía RN-11), y ADR-014 (dueño único de esa
  cortesía) están en `borrador`, esperando firma humana.
- **EPIC-003 — Páxina de proxecto e respaldo público da carta**, **`hecho`**
  desde hoy, la **primera épica del proyecto que llega ahí**: entregó el sitio
  público que respalda la carta a la RFGF.

**EPIC-004** (sistema de diseño del marcador, `docs/diseno/`) está `aprobada` y
**congelada a propósito** hasta el go/no-go. **EPIC-MEJORA**, `aprobada` hoy, es
el bucket de deuda técnica del proyecto, con once *findings* inventariados.

El nombre y dominio **marcador.gal** están decididos y contratados (2026-08-31,
Dinahosting; expira 2027-08-31).

## Stack y arquitectura (as-built, 2026-09-01)

- Node 22 · TypeScript · Next.js (App Router) · cheerio · zod · grammY ·
  Postgres · vitest (ADR-001). Desplegado en **Vercel Pro** (ADR-004): sin
  scheduler en proceso (Vercel Cron a 1/min), sin disco persistente, sin
  `LISTEN/NOTIFY`.
- Raw store como puerto: Vercel Blob en producción, disco en local y tests
  (ADR-005). Retención de 30 días desde el fin de ventana, prórroga escrita,
  techo duro 90 (ADR-009).
- Tiempo real: snapshot cacheable + SSE (ADR-003), fuera del alcance de
  EPIC-001.

**Fuentes: de las tres candidatas del spike, solo una es capturable hoy.**
`futgal.es` (oficial, peso 1.0) prohíbe el rastreo en su `robots.txt` y RN-11
obliga a respetarlo (ADR-008 §1); `besoccer.es` (0.7) sirve armazones vacíos,
con el dato tras un `Disallow`. Solo `ceroacero.es` (0.7) queda. **Consecuencia
por aritmética, no por hipótesis:** la segunda vía de RN-02 —dos fuentes
independientes de peso ≥ 0.7— está cerrada, no hay dos. Con una sola fuente
automática, nada llega a *confirmado* sin una persona: el bot del corresponsal
y el panel del operador (`src/admin/`, aún sin escribir) son la única ruta a un
marcador confirmado.

Estructura prevista para el motor, todavía sin escribir: `src/ingest/`
(adaptadores + cron) · `src/decide/` (RN-01..RN-07) · `src/api/` (snapshot) ·
`src/admin/` (panel móvil). El corazón del diseño vive en
`docs/fundacion/reglas.md` (RN-01..RN-13) y `docs/fundacion/dominio.md`.

## Decisiones clave hasta hoy

`FOUNDATION.md` fija D-1 a D-8, locked. Los **trece ADRs** (`docs/adr/`,
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
escudos— y obliga en cuanto se toque interfaz. **ADR-014**, sobre el dueño único
de la cortesía RN-11, está en `borrador` junto a SPEC-008, esperando firma
humana.

## Riesgos y preguntas abiertas

Detalle completo en `retos.md`. Lo que condiciona el trabajo inmediato:

- **¿Contesta la RFGF antes del 2026-09-08?** La carta se envió el 2026-09-01 a
  `info@futgal.es` pidiendo dos líneas en su `robots.txt`, no un acuerdo de
  datos. Sin respuesta ese día, se da por no contestada y no se insiste — ni por
  teléfono ni por otra vía. Diga lo que diga, EPIC-001 se cierra ese día.
- **¿Hay una tercera candidata?** `lapreferente.com` sirve HTML real con el
  nombre canónico de la competición, pero no se le ha visto directo; se
  comprueba con partidos en juego, ventana el domingo 2026-09-06.
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
