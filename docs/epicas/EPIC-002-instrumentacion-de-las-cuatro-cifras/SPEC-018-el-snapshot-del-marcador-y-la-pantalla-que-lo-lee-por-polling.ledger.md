---
id: SPEC-018
tipo: ledger
epica: EPIC-002
---
# Ledger — SPEC-018 El snapshot del marcador y la pantalla que lo lee por polling

## Resumen
- Fase: `en-revision` — implementada el 2026-09-04 por `sdd-implementador`.
  **ADR-027 aprobado** el 2026-09-04. Gate de calidad **verde**:
  `npm run gates` (147 ficheros, 1710 casos, 0 errores de tipo) y
  `npm run test:db` (27 ficheros, 345 casos) por separado.
- Decidido en el gate del 2026-09-04 por Alberto Fojo: **el marcador se
  publica** (salida B), en `/marcador` y `/es/marcador`, **no en la raíz**;
  título `marcador.gal` a secas; `/api/board` sigue sirviendo JSON (R1 del rol
  legal considerada y descartada, y el residuo escrito).
- Dictámenes de dominio: `dictamenes-SPEC-018.md` (los tres roles, copiados enteros;
  `sdd-legal-datos` dictaminó **dos veces**, y el segundo manda donde hablen de lo mismo).
- Rama: `ft/SPEC-018-snapshot-e-paxina-minima`

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 | `src/api/` (5 ficheros) · `src/board/` (6) · `src/app/api/board/route.ts` · `src/app/(gl)/marcador/route.ts` · `src/app/(es)/es/marcador/route.ts` · `tests/polite/support/capability.ts` (`ENTRY_POINTS`) | `tests/board/frontier.test.ts` 1–9 (con controles positivos 3, 7, 9) · `tests/polite/containment.test.ts` 13 (heredado) | | ❌ |
| CA-2 | `src/api/handler.ts` · `src/api/freshness.ts` · `src/board/handler.ts` · `src/board/view/markup.ts` · `src/site/project-page.tsx` · `src/site/crawler-page.tsx` | `tests/board/frontier.test.ts` 10–13 · `tests/board/document.test.ts` 1–8 (control positivo 3) | | ❌ |
| CA-3 | `src/api/handler.ts` (`boardSnapshotOf`, `asksForSomethingArbitrary`) · `src/api/contract.ts` (`PUBLISHED_COMPETITIONS`) · `src/api/snapshot.ts` · `docs/procedimientos/carga-del-calendario.md` | `tests/board/snapshot.test.ts` 1–10 (control positivo 7) · `tests/board/runbook.test.ts` 1–3 | | ❌ |
| CA-4 | `src/api/snapshot.ts` (pura, sin reloj) · `src/api/ports.ts` (sólo lectura) · `src/decide/board-entry.ts` | `tests/board/frontier.test.ts` 14–21 (controles positivos 16, 21) · `tests/board/snapshot.test.ts` 31 | | ❌ |
| CA-5 | `src/api/contract.ts` (`PUBLISHED_FIELDS`) · `src/api/snapshot.ts` | `tests/board/snapshot.test.ts` 11–16 (control positivo 13) | | ❌ |
| CA-6 | `src/decide/board-entry.ts` · `src/api/ports.ts` (`BoardReader`) | `tests/board/frontier.test.ts` 22–23 · `tests/db/board-batch.test.ts` 1–5 (`npm run test:db`) | | ❌ |
| CA-7 | `src/api/freshness.ts` · `src/api/handler.ts` (`etagOf`, `matchesEtag`) · `src/api/snapshot.ts` (`version`) | `tests/board/snapshot.test.ts` 17–24 | | ❌ |
| CA-8 | `src/board/handler.ts` (`minutesSince`, `lastDataOf`) · `src/board/view/markup.ts` (`transportNotice`) · `src/board/view/styles.ts` (`.transport`) · `src/i18n/board-bundle.ts` | `tests/board/document.test.ts` 9–16 (control positivo 13, 15) · `tests/board/snapshot.test.ts` 32 | | ❌ |
| CA-9 | `src/board/handler.ts` · `src/board/view/refresh.ts` | `tests/board/document.test.ts` 17–21 | | ❌ |
| CA-10 | `src/board/handler.ts` (`boardRowMarkup`) · `src/api/snapshot.ts` | `tests/board/document.test.ts` 22–29 (control positivo 27) | | ❌ |
| CA-11 | `src/api/snapshot.ts` (`compareBoardRows`) · `src/board/order.ts` | `tests/board/snapshot.test.ts` 25–30 (control positivo 28) · `tests/board/frontier.test.ts` 24 | | ❌ |
| CA-12 | `src/board/handler.ts` · `src/board/view/styles.ts` · `src/i18n/qualifiers.ts` | `tests/board/document.test.ts` 30–34 (control positivo 32) · `tests/board/style.test.ts` 17–18 | | ❌ |
| CA-13 | `src/i18n/board-bundle.ts` · `src/i18n/board.ts` · `src/i18n/qualifiers-bundle.ts` · `src/i18n/qualifiers.ts` · `src/i18n/gl.ts` · `src/i18n/es.ts` · `src/i18n/titles-bundle.ts` · `src/board/sources.ts` | `tests/board/document.test.ts` 35–43 (control positivo 41) · `tests/types/spec018-board.test-d.ts` 1–5 · `tests/site/titles-i18n.test.ts` 4 · `tests/site/document-titles.test.ts` 1–5 · `tests/site/robots.test.ts` 4 | | ❌ |
| CA-14 | `src/i18n/gl.ts` · `src/i18n/es.ts` (espacio `board`) | `tests/board/voice.test.ts` 1–10 (controles positivos 2, 7, 10) | | ❌ |
| CA-15 | `src/board/view/styles.ts` · `src/design/tokens.ts` (`MEASURE`, `HAIRLINE_PX`) · `src/admin/view/styles.ts` | `tests/board/style.test.ts` 1–18 (control positivo 3) · `tests/design/scale.test.ts` 1–6 (control positivo 5) | | ❌ |
| CA-16 | — (no lo implementa el implementador: es del verificador, con capturas en `_qa/SPEC-018/`) | — | | ❌ |
| CA-17 | `tests/site/url-permanence.test.ts` · censos de `PAGES`, `ROUTES` y rutas de `robots.test.ts` | `tests/site/url-permanence.test.ts` 1 | | ❌ |
| CA-18 | `src/i18n/gl.ts` · `src/i18n/es.ts` · `src/i18n/site-bundle.ts` · `src/i18n/crawler-bundle.ts` · `src/site/project-page.tsx` · `src/site/crawler-page.tsx` · ledgers de SPEC-004, SPEC-005 y SPEC-007 | `tests/site/crawler-page.test.ts` 12, 12 bis/ter/quater · `tests/site/identity.test.ts` 1–4 · `tests/board/no-contradiction.test.ts` 1–6 (control positivo 2, 3) · `tests/board/document.test.ts` 8 | | ❌ |
| CA-19 | `docs/procedimientos/calendario-de-compromisos.md` | `tests/board/runbook.test.ts` 4–9 | | ❌ |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-018/. Informe HTML opcional: _qa/SPEC-018/informe.html -->

## Salvedades / follow-ups

**F-SPEC-018-1 — `titles.scoreboard = 'marcador.gal'` rompe DOS guardianes de
SPEC-006, y hacen falta una decisión y una enmienda que CA-18.4 no ordenó.**
El gate decidió el título **`marcador.gal` a secas**. Ese valor **es el nombre
del dominio**, y eso lo hace estructuralmente incompatible con dos aserciones
de SPEC-006, que está cerrada y GREEN:
1. `tests/site/titles-i18n.test.ts` caso 6 — «ningún título es un valor de los
   que el sitio sirve en su cuerpo». `site.heading` **también** es
   `marcador.gal`: es el `<h1>` de `/proxecto` desde SPEC-004.
2. `tests/site/title-source.test.ts` caso 3 — «cada título vive en el bundle de
   su lengua y en ningún otro punto de `src/`». El dominio aparece por
   construcción en once ficheros (`polite/user-agent.ts`, `site/contact.ts`,
   `site/routes.ts`, `site/robots-txt.ts`…).
**No hay forma de implementar la decisión del gate sin tocar los dos.** La
alternativa —`O marcador — marcador.gal`, que el dictamen de `sdd-lingua` §1.1
proponía como primera opción— pasaría los dos sin tocar nada, y el gate la
descartó expresamente. Lo hecho, declarándolo: en cada caso se añade **una
colisión declarada por identidad de clave Y de valor**, con su motivo escrito y
con una aserción nueva que la ata (`scoreboard` vuelve a ser rojo en cuanto deje
de valer `marcador.gal`). **Ninguna otra clave se relaja.** Pero eso **es tocar
una aserción de una spec cerrada sin la enmienda de ADR-015 que la ampare**, y
CA-18.4 ordena tres enmiendas —SPEC-004, SPEC-005, SPEC-007— y no una cuarta
sobre SPEC-006. **Destino: `sdd-arquitecto`, que es quien puede firmar esa
cuarta enmienda o decidir el título alternativo. Disparador: la verificación de
esta spec.**

**F-SPEC-018-2 — `docs/fundacion/dominio.md` NO se ha editado: el harness me lo
impide, y CA-17.1 queda sin cumplir.**
Las tres entradas de CA-17.1 están **firmadas por Alberto Fojo en el gate del
2026-09-04** y el encargo me pedía escribirlas. `docs/fundacion/dominio.md` es
un **documento de verdad** cuyos dueños son `sdd-arquitecto` y `sdd-producto`, y
el harness rechaza la escritura con ese motivo — que es también lo que dice mi
contrato de rol («PROHIBIDO … editar documentos de verdad»). **El texto exacto
de las tres entradas va en el informe final**, listo para pegar. El resto de la
spec avanzó sin ellas, como CA-17.1 permite expresamente. **Destino:
`sdd-arquitecto`. Disparador: inmediato — el glosario tiene que estar escrito
antes de que la pantalla se despliegue, porque `Casa`/`Fóra` ya son texto
visible.**

**F-SPEC-018-3 — CA-6.5 no se puede cumplir como está escrito: la puerta de
lectura en lote NO cruza ningún nombre vigilado.**
CA-6.5 exige que «la aserción derivada del caso que enumera quién cruza los
nombres vigilados crezca en una entrada» — el caso 10 de
`tests/decide/rn08-frontier.test.ts`, que hoy lista cinco ficheros. Ese caso
mide quién cruza `PostgresDecisionStore`, `DecisionVersionConflictError` o
`DecisionStore`. **`src/decide/board-entry.ts` no cruza ninguno**: la lectura en
lote necesita SQL propio —`distinct on (match_id) … order by version desc`— que
`PostgresDecisionStore` no expone, y escribirla ahí habría exigido editar
`src/db/decisions.ts`, fichero de una spec cerrada cuyo puerto un test de tipos
sujeta. Se escribió el SQL dentro de `board-entry.ts`, que es legítimo porque
`src/decide/` es la primera entrada de `DECISION_WRITERS`. **Consecuencia: el
censo del caso 10 sigue en cinco entradas y CA-6.5 queda sin cumplir por
imposibilidad, no por omisión.** Forzar un import sin uso para que el censo
creciera habría sido peor. **Destino: `sdd-verificador` / `sdd-arquitecto`;
disparador: la verificación de esta spec.**

**F-SPEC-018-4 — la barrera de 1.ª persona deja fuera una forma más de las
cuatro que CA-14.2 enumera: `min`.**
CA-14.2 declara fuera de la lista cerrada las formas ambiguas `son`, `vin`/`vi`,
`mi` y `sei`/`sé`. Hay una quinta que el dictamen no previó: **`min`**, pronombre
galego de 1.ª persona tras preposición, **que es también la abreviatura de
*minuto*** que el propio `sdd-lingua` §3.2 propone en cinco literales de esta
pantalla («Actualizado hai {n} min»). Incluirla pondría rojo texto correcto
escrito por el mismo dictamen. Queda declarada en el propio test con su motivo,
que es el criterio con el que él deja fuera las otras cuatro. **Destino:
EPIC-MEJORA; disparador: el día que la barrera pase de lista de formas a
análisis morfológico.**

**F-SPEC-018-5 — CA-2.6 (iii) no se puede cumplir literalmente: la ruta del
contrato SÍ aparece en el documento servido.**
CA-2.6 (iii) dice que la ruta de `/api/board` «no aparece en `src/i18n/`, ni en
`src/site/`, ni en ningún fichero servido». Las dos primeras se cumplen y hay
caso. La tercera **es imposible**: la pantalla se refresca pidiéndosela, así que
la ruta viaja dentro del `fetch` del guion. Se implementó lo que **ADR-027 §3.a**
dice, que es lo que la spec parafrasea: «no se documenta en ningún sitio —ni en
`/robot`, ni en `/proxecto`, **ni con un enlace**». El caso 4 de
`tests/board/document.test.ts` afirma exactamente eso: fuera de `src/i18n/` y
`src/site/`, y en el documento **nunca como `<a href>` ni como prosa**.
**Destino: `sdd-arquitecto`, si quiere afinar la redacción del CA; sin
disparador — el ADR ya dice lo correcto.**

**F-SPEC-018-6 — `src/db/board.ts` es un fichero nuevo que la spec no nombra.**
§1 de la spec lista los ficheros de `src/api/` y `src/board/` y no menciona
dónde viven las implementaciones Postgres de los dos lectores de nombres
canónicos. Se creó `src/db/board.ts` —fichero **nuevo**, no una edición— en vez
de importar `src/db/admin.ts`, que **lleva plantillas de escritura**
(`alert_acks`, `operator_actions`) y las habría puesto en el grafo de una
superficie cuyo criterio entero es que no escribe nada (CA-4.1). **Destino:
ninguno, es una decisión de forma; se declara para que el verificador no la lea
como alcance de más.**

**F-SPEC-018-7 — el registro de fuentes está en el grafo de la pantalla
pública.**
CA-13.8 exige que el número de fuentes automáticas se **derive** de
`DEFAULT_SOURCES`, así que `src/board/sources.ts` importa `src/ingest/sources.ts`
y con él `cheerio` y el extractor de `ceroacero`. **No compromete ninguna
frontera** —el grafo de las tres rutas no alcanza `src/polite/http.ts`, y el
caso 6 de `tests/board/frontier.test.ts` lo afirma— pero es peso en el paquete
de una página pública a cambio de una cifra. La alternativa —teclear el número y
compararlo en un test— habría dado control positivo pero no derivación.
**Destino: EPIC-MEJORA; disparador: la primera vez que el tamaño del paquete de
`/marcador` sea un problema medido.**

**F-SPEC-018-8 — el aviso de degradación no puede ponerse rojo por sí solo.**
CA-13.8 pide a la vez que el número **se derive** y que declarar una segunda
fuente **ponga rojo un caso nombrado hasta que el aviso se corrija**. Las dos
cosas no pueden ser ciertas del mismo mecanismo: lo derivado nunca miente y por
tanto nunca enrojece. Lo implementado: el número se deriva, y la elección entre
el literal **singular** y el **plural** es lo que cambia visiblemente con una
segunda fuente (caso 41 de `tests/board/document.test.ts` lo ejerce). Quien
declare `lapreferente.com` el **2026-09-06** verá el aviso cambiar de forma y
tendrá que releerlo entero — y por eso el ajuste tiene **fila propia el
2026-09-07** en el calendario de compromisos. **Destino: la spec de
instrumentación; disparador: la verificación de `lapreferente.com`.**

## Cómo retomar (handoff)

**Rama:** `ft/SPEC-018-snapshot-e-paxina-minima`, tres commits, sin push.
**Gate:** `npm run gates` VERDE (147 ficheros / 1710 casos / 0 errores de tipo)
y `npm run test:db` VERDE (27 / 345), corridos por separado el 2026-09-04.

**Qué está hecho.** Los diecisiete criterios que dependen de código, con sus
suites en `tests/board/` y sus controles positivos. La corrección de CA-18 va
**en el mismo cambio** que la publicación: los tres literales reescritos, los
enlaces desde `/proxecto` y `/robot`, la barrera de identidad ensanchada, y las
**tres enmiendas de ADR-015** escritas en los ledgers de SPEC-004, SPEC-005 y
SPEC-007 con sus cinco puntos. Ningún cuerpo de spec cerrada se ha tocado y
ningún frontmatter se ha movido.

**Qué falta, y no lo puede hacer el implementador.**

1. **CA-16 — la mitad de navegador.** A 360 × 640, teclado, foco visible, sin
   desplazamiento horizontal del cuerpo, y el refresco y su fallo. Capturas en
   `_qa/SPEC-018/`, cotejadas byte a byte contra lo que el manejador sirve, que
   es el procedimiento que F-SPEC-017-17 dejó establecido —**Chrome por MCP no
   alcanza `localhost` en este entorno**—. Es del verificador.
2. **CA-17.1 — las tres entradas de `docs/fundacion/dominio.md`.** Firmadas por
   el gate, **no escritas**: el fichero es documento de verdad y el harness
   rechaza la escritura (F-SPEC-018-2). El texto exacto está en el informe de
   esta sesión, listo para pegar por `sdd-arquitecto`.
3. **F-SPEC-018-1** — la colisión de `titles.scoreboard` con dos guardianes de
   SPEC-006 necesita o una cuarta enmienda de ADR-015 o el título alternativo.
   **Es lo primero que hay que mirar en la revisión.**
4. **CA-19 entero** — cuatro filas nuevas del calendario de compromisos. Están
   **escritas**, no cumplidas: no se despliega antes del 2026-09-08 y no antes
   de avisar a la RFGF, y **ningún test sostiene ninguna de las dos**.

**Y dos cosas que esta spec NO enciende, y sin las cuales la pantalla sale
vacía:** `calendario/` no existe en el repositorio y `MEASUREMENT_WINDOWS` sigue
vacía. Las dos son acciones de runbook. La mitigación está implementada y
comprobada: la pantalla vacía **dice por qué** está vacía y distingue «no hay
partidos» de «no se declaró ninguno» (casos 2 y 3 de `snapshot.test.ts`).
