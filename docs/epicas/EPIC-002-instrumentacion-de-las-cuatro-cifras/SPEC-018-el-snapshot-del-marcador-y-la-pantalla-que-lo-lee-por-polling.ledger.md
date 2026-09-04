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

---

# Enmiendas y ratificaciones de `sdd-arquitecto` — 2026-09-04

> Escritas tras leer las ocho salvedades del implementador, **antes** de que la
> spec pase al verificador. **En los tres casos en que un criterio pedía algo que
> no se podía hacer como estaba escrito, el implementador declaró en vez de
> forzar, y eso es lo correcto**: ADR-016 §6 obliga a declarar lo que un
> mecanismo no alcanza, y forzar un import sin uso o un literal imposible habría
> dado un verde que no mide nada.
>
> **La spec está `en-revision`, no `hecho`, así que su cuerpo podría editarse
> (ADR-015 gobierna las cerradas).** No se edita: la implementación se hizo contra
> este texto y el veredicto se va a emitir contra él. Mover la letra ahora sería
> mover la portería debajo del verificador. **Todo va aquí, con la forma de
> ADR-015 §3.**

## Enmienda — 2026-09-04: CA-18.4 ordena tres enmiendas y hacen falta cuatro (F-SPEC-018-1)

**1. Qué afirmaba y por qué era razonable.** CA-18.4 enumera **tres** enmiendas de
ADR-015 —SPEC-004, SPEC-005 y SPEC-007— y las tres se dedujeron de un inventario
de lo que publicar vuelve falso: dos afirmaciones publicadas y una barrera que
deja de cubrir. Era razonable porque **ese inventario se hizo sobre el contenido**,
que es donde estaba el problema visible.

**2. Qué lo invalida.** El título que el **gate del 2026-09-04** eligió —
`marcador.gal` a secas, CA-13.5— **es el nombre del dominio**, y eso colisiona con
dos aserciones de **SPEC-006** que ningún inventario de contenido podía anticipar:
el caso 6 de `titles-i18n.test.ts` (`site.heading` **también** es `marcador.gal`)
y el caso 3 de `title-source.test.ts` (el dominio aparece por construcción en once
ficheros de `src/`). **No hay forma de implementar la decisión del gate sin tocar
las dos**, y la alternativa —`O marcador — marcador.gal`— la descartó el gate
expresamente.

**3. Con qué se sustituye, y si hay menos red.** **CA-18.4 se lee ahora con
cuatro entradas: SPEC-004, SPEC-005, SPEC-007 y SPEC-006.** La cuarta está escrita
en el ledger de SPEC-006 con sus cinco puntos, y **no relaja ningún predicado**:
añade una colisión declarada **por identidad de clave y de valor**, atada por una
aserción propia que vuelve a morder si el título deja de valer `marcador.gal`.
**Hay menos red en un solo sitio y está dicho allí**: el caso 3 de
`title-source.test.ts` deja de detectar a quien escriba `marcador.gal` a mano como
título en un módulo de `src/` que no sea de ruta. Lo cubre el caso 2 y el caso 5
de `document-titles.test.ts`, que mira el HTML servido.

**Y lo que NO es una enmienda, porque CA-17.2(ii) y CA-13.6 lo distinguen:** que
el censo `PAGES` del caso 4 crezca de dos a tres. Es **el dato de un guardián cuyo
dato cambió** —el sitio ganó una página— y la regla que guarda no cambia una
letra.

**4. El veredicto de SPEC-006 sigue en pie.** Su GREEN del 2026-09-01 está intacto
y **la letra de CA-2 y de CA-3 sigue satisfecha entera**: lo que se acota son dos
aserciones que iban **más allá** de la letra de su CA. Detalle en su ledger, §3 y
§4.

**5. Qué lo despierta.** Que el título deje de valer `marcador.gal` —hay que
**retirar** las exenciones, no dejarlas—, o que aparezca un segundo título que
colisione: entonces deja de ser una colisión y pasa a ser un patrón, y lo que toca
no es una tercera exención sino rehacer el mecanismo del caso 3.

**Nota sobre el proceso, que merece quedar escrita.** El ledger de SPEC-006
terminaba diciendo: «si al implementar aparece que hay que modificar un test […],
la instrucción es **parar y devolver a arquitectura**, no añadir una excepción».
El implementador **añadió la excepción y además paró y devolvió**, dejándola
marcada con «⚠ EXIGE UNA ENMIENDA … que sólo `sdd-arquitecto` puede firmar». Es la
lectura correcta de esa instrucción con una suite que tiene que quedar verde para
poder ser verificada, y es la razón de que esto se resuelva en una vuelta.

## Enmienda — 2026-09-04: CA-6.5 pide que crezca un censo que la implementación correcta no hace crecer (F-SPEC-018-3)

**1. Qué afirmaba y por qué era razonable.** CA-6.5: «la aserción derivada del
caso que enumera quién cruza los nombres vigilados crece en una entrada, con su
motivo en el mismo diff — que es literalmente lo que hicieron SPEC-015 con
`engine-entry.ts` y SPEC-017 con `read-entry.ts`». Era razonable **porque las dos
puertas anteriores lo hicieron así**: las dos componían `PostgresDecisionStore`
dentro de `src/decide/`, cruzaban un nombre vigilado y el censo del caso 10 de
`tests/decide/rn08-frontier.test.ts` creció con ellas.

**2. Qué lo invalida.** La tercera puerta **no necesita la segunda**.
`src/decide/board-entry.ts` lee en lote con SQL propio —`distinct on (match_id) …
order by match_id, version desc`— porque `PostgresDecisionStore` **no expone esa
consulta**, y ponerla ahí habría exigido editar `src/db/decisions.ts`, fichero de
una spec cerrada con un test de tipos sobre su puerto. Así que **no importa
ninguno de los tres nombres vigilados y el censo no crece**. CA-6.5 queda **sin
cumplir por imposibilidad, no por omisión**.

**3. Con qué se sustituye, y la red que falta.** **Se sustituye por nada, y hay
que decir lo que eso deja al aire.** Lo que CA-6.5 quería —que la lista de quién
puede leer decisiones no crezca en silencio— **sigue cubierto para el camino que
vigila**: el mecanismo es **por importación**, `src/decide/` sigue siendo la
primera entrada de `DECISION_WRITERS`, y `board-entry.ts` está dentro, así que no
hay ninguna capacidad nueva ni ninguna frontera cruzada. **Lo que el mecanismo no
ve, y ahora hay un ejemplo real dentro del repositorio: SQL crudo contra
`decisions` escrito dentro de un escritor declarado.** El censo del caso 10 deja
de ser un inventario de «quién puede leer decisiones de la base» y pasa a ser lo
que siempre midió de verdad: «quién importa el almacén». **Es la misma familia que
F-SPEC-013-11** —la capacidad obtenida por una vía que los gates no miran— y se
apunta al lado de aquélla.

**4. El veredicto puede seguir en pie.** El subpunto es **⚠, no ✅**: se declara
incumplido con su motivo, y el verificador decide si la spec cierra con esa
salvedad —como cerró SPEC-008 CA-2, ⚠ con su residuo escrito—. **Forzar un import
sin uso para que el censo creciera habría sido peor**: un verde que no mide nada
en el guardián más importante que tiene RN-08.

**5. Qué lo despierta.** La **cuarta** puerta de la familia
`engine-entry`/`read-entry`/`board-entry`. Si hay una cuarta, lo que hay que
revisar no es esta enmienda: es **si la frontera de SPEC-013 CA-13 debe mirar
también la tabla y no sólo los nombres importados**, que es el arreglo que
cerraría esto y F-SPEC-013-11 a la vez.

## Enmienda — 2026-09-04: CA-2.6 (iii) dice más de lo que ADR-027 §3.a dice, y más de lo que es posible (F-SPEC-018-5)

**1. Qué afirmaba y por qué era razonable.** CA-2.6 (iii): la ruta de
`/api/board` «no se documenta en ningún sitio — un caso afirma que su ruta **no
aparece en `src/i18n/`, ni en `src/site/`, ni en ningún fichero servido**». La
intención era buena y sigue siéndolo: **un endpoint que no se ofrece a nadie no se
anuncia**, que es una de las cuatro cosas que lo mantienen fuera del punto 5 del
disparador de re-dictamen.

**2. Qué lo invalida. Es un error mío de redacción, no una decisión posterior.**
La coletilla «ni en ningún fichero servido» **es imposible por construcción**: la
pantalla se refresca **pidiéndosela**, así que la ruta viaja dentro del `fetch`
del guion, que es un fichero servido. **ADR-027 §3.a, que es la fuente que este
subpunto parafrasea, dice lo correcto y no dice eso**: «no se documenta en ningún
sitio —ni en `/robot`, ni en `/proxecto`, **ni con un enlace**—». La spec parafraseó
de más.

**3. Con qué se sustituye.** **Se lee con la letra del ADR, que es la que manda.**
El caso 4 de `tests/board/document.test.ts` afirma exactamente eso: la ruta no
aparece en `src/i18n/` ni en `src/site/`, y en el documento **nunca como `<a
href>` ni como prosa**. **No hay menos red que la que el ADR pedía**: hay menos que
la que la spec escribió, y lo que la spec escribió de más era inalcanzable. La
diferencia entre «no aparece» y «no se anuncia» es justo la que separa una
condición comprobable de una imposible.

**4. El veredicto sigue en pie.** El subpunto se juzga **contra la letra de
ADR-027 §3.a**, y así cumplido es ✅. Un CA no puede exigir más que el ADR del que
deriva sin decir por qué, y aquí no había ningún porqué: era un descuido.

**5. Qué lo despierta.** Que el refresco deje de pedir `/api/board` —por ejemplo,
si se toma la recomendación **R1** del segundo dictamen y el refresco devuelve
fragmento HTML por otra ruta—. Ese día la coletilla vuelve a ser alcanzable y
conviene recuperarla.

## Enmienda — 2026-09-04: CA-13.8 pide dos cosas que no pueden ser ciertas del mismo mecanismo (F-SPEC-018-8)

**1. Qué afirmaba y por qué era razonable.** CA-13.8 exige, a la vez, que el
número de fuentes automáticas del aviso **se derive** de `DEFAULT_SOURCES` y que
declarar una segunda fuente **«ponga rojo un caso nombrado hasta que el aviso se
corrija»**. Las dos mitades venían del dictamen y las dos son buenas por separado:
la derivación evita que el aviso mienta, y el control positivo evita que la
derivación sea una promesa.

**2. Qué lo invalida. Otro error mío, y es de lógica.** **Lo derivado no miente, y
por tanto no puede enrojecer.** Si el número sale de `DEFAULT_SOURCES`, declarar
una segunda fuente lo actualiza solo y no hay nada que se ponga rojo. Pedir las
dos cosas del mismo mecanismo es pedir que un valor sea a la vez correcto por
construcción y detectable como incorrecto.

**3. Con qué se sustituye, y la red que queda.** **Se conserva la derivación, que
es la mitad que protege del riesgo real** —un aviso público falso sobre la propia
actividad, que es el vector del art. 5 de la Ley 3/1991 que el dictamen nombra—.
Y la mitad de control positivo se sustituye por lo que sí es cierto y sí es
observable: **con una segunda fuente el aviso cambia de forma**, de singular a
plural, y el caso 41 de `tests/board/document.test.ts` lo ejerce. **La red que
falta, dicha sin suavizar: nada obliga a releer el resto del aviso.** El número se
corrige solo; **la frase que lo acompaña —«así que lo normal es que el marcador sea
provisional y llegue con atraso»— no**, y con dos fuentes independientes de peso
≥ 0.7 esa frase podría dejar de ser cierta (RN-02, segunda vía).

**4. El veredicto sigue en pie.** El subpunto es ✅ en su mitad de derivación y la
otra mitad se sustituye por una comprobación equivalente en lo que se puede
comprobar. **Lo que sostiene el resto no es un test: es una fila con fecha** —el
ajuste del aviso el **2026-09-07**, tras verificar `lapreferente.com` el **06**—,
que es exactamente el reparto (c) que CA-19 declara y que CA-19.6 dice que no es
una barrera.

**5. Qué lo despierta.** La declaración de una segunda fuente en
`DEFAULT_SOURCES`. Ese día **hay que releer el aviso entero**, no sólo mirar que
el número cambió; y si RN-02 recupera su segunda vía, la frase sobre *provisional*
es lo primero que hay que revisar.

## Ratificaciones, sin enmienda porque no invalidan ningún criterio

- **F-SPEC-018-2 — el glosario. CERRADO HOY.** El implementador no podía escribir
  `docs/fundacion/dominio.md` porque es documento de verdad y sus dueños somos
  `sdd-arquitecto` y `sdd-producto`; **hizo lo correcto parando**. Las tres
  entradas de **CA-17.1**, firmadas por Alberto Fojo en el gate del 2026-09-04,
  **están escritas** en el mismo cambio que esta enmienda: `descanso` no es un
  estado (entrada de resolución tras la nota de norma de *Estados de un partido*),
  la sección nueva **Los dos lados de un partido** con `Casa`/`Fóra`, y la línea
  bajo la tabla de cualificadores diciendo que un partido sin `Decision` **no tiene
  cualificador**. **CA-17.1 pasa a ser verificable**, y el desfase que CLAUDE.md
  prohíbe —término en el código antes que en el glosario— queda cerrado.
- **F-SPEC-018-4 — `min` fuera de la lista de 1.ª persona. Ratificado.** Es la
  quinta forma ambigua de la misma familia que CA-14.2 ya declara con cuatro, y el
  motivo es el mejor posible: **`min` es la abreviatura de *minuto* que el propio
  `sdd-lingua` §3.2 propone en cinco literales de esta pantalla**, así que
  incluirla pondría rojo texto correcto escrito por el mismo dictamen que redactó
  la barrera. Queda declarada en el test con su motivo, que es el criterio con el
  que CA-14.2 deja fuera las otras cuatro. **No necesita enmienda: CA-14.2 ya
  ordena declarar las ambiguas, y ésta es una más.** **Destino: EPIC-MEJORA;
  disparador: el día que la barrera pase de lista de formas a análisis
  morfológico.**
- **F-SPEC-018-6 — `src/db/board.ts`. Ratificado, y la decisión es la correcta.**
  §1 de la spec lista los ficheros de `src/api/` y `src/board/` y no dice dónde
  viven las implementaciones Postgres de los lectores de nombres canónicos. Un
  fichero **nuevo** es mejor que importar `src/db/admin.ts`, que **lleva plantillas
  de escritura** (`alert_acks`, `operator_actions`) y las habría metido en el grafo
  de una superficie cuyo criterio entero es que **no escribe nada** (CA-4.1). **No
  hay enmienda porque no hay criterio invalidado**: §1 es diseño, no contrato, y su
  omisión no relaja nada. Se ratifica por escrito para que el verificador no lo lea
  como alcance de más.
- **F-SPEC-018-7 — `src/ingest/sources.ts` en el grafo de la pantalla pública.
  Ratificado con incomodidad.** Es el precio de que CA-13.8 exija **derivar** en vez
  de teclear, y la alternativa —teclear el número y compararlo— daba control
  positivo pero no derivación, que es justo la mitad que protege del aviso falso.
  **No compromete ninguna frontera**: el grafo de las tres rutas no alcanza
  `src/polite/http.ts` y el caso 6 de `tests/board/frontier.test.ts` lo afirma.
  Queda que `cheerio` y el extractor de `ceroacero` viajan en el paquete de una
  página pública a cambio de una cifra. **Destino: EPIC-MEJORA; disparador: la
  primera vez que el tamaño del paquete de `/marcador` sea un problema medido** —y
  el arreglo natural es extraer el censo de fuentes a un módulo sin parser, no
  volver a teclear el número.
- **CA-16 no es de nadie de esta sesión.** Es la mitad que sólo ve un navegador y
  la hace el **verificador**, con capturas en `_qa/SPEC-018/` cotejadas byte a byte
  contra lo que el manejador sirve (F-SPEC-017-17: Chrome por MCP no alcanza
  `localhost` en este entorno).
