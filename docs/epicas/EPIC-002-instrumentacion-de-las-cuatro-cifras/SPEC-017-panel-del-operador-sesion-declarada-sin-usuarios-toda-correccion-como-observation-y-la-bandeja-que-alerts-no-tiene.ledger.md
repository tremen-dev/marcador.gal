---
id: SPEC-017
tipo: ledger
epica: EPIC-002
---
# Ledger — SPEC-017 Panel del operador: sesión declarada sin usuarios, toda corrección como `Observation`, y la bandeja que `alerts` no tiene

## Resumen
- Fase: **`en-revision`** — escrita por `sdd-arquitecto` el 2026-09-03, firmada
  por Alberto Fojo el 2026-09-03, implementada por `sdd-implementador` el
  2026-09-03. La fuente de verdad es el frontmatter de la spec. **LOS TRECE
  CRITERIOS ENTREGADOS.** CA-10 estuvo congelado unas horas por el cambio de
  rumbo del mismo día, se reescribió de 7 a 15 subpuntos con **ADR-026**, y se
  implementó entero (ver *CA-10 descongelado*). **Lista para `sdd-verificador`.**
- Rama: `ft/SPEC-017-panel-do-operador`
- ADRs que trae, los dos **aprobados por Alberto Fojo el 2026-09-03**. CA-1,
  CA-7, CA-8, CA-10 y CA-11 los ejecutan literalmente. **ADR-025 §4 quedó
  superseded parcialmente por ADR-026** (`2278cb1`, aprobado el mismo día), que
  hace vinculante `docs/diseno/` y es la letra bajo la que CA-10 se implementó.
  De ADR-025 **sobreviven enteros §2, §3, §4.1 y §5**, y ahora son permanentes:
  el sistema de diseño **no tiene foco, ni teclado, ni componentes de
  formulario, ni suelo de toque**, así que no supersede nada de lo que ellos
  cubren.
  - **ADR-024** — el panel: sesión declarada sin sistema de usuarios, el vale de
    acción, toda operación como `Observation` por la puerta estrecha, la bandeja,
    el registro de operación y la llave de la jornada.
  - **ADR-025** — el suelo de interfaz mientras EPIC-004 está congelada: foco
    visible, teclado, toque de 44 px, y estilos que no comparten una línea con
    `globals.css`.
- **Precondición de CA-9.6 — CUMPLIDA el 2026-09-03.** El gate firmó la nota §3
  de la spec: **los cuatro cualificadores se traducen al castellano**, descartando
  dejarlos en galego como vocabulario de marca. `sdd-arquitecto` escribió ese
  mismo día la tabla en `docs/fundacion/dominio.md` —dos columnas nuevas, *Literal
  galego* y *Literal castellano*, con la forma de la tabla de estados— y la nota
  fechada que la explica. **CA-9.6 deja de estar bloqueado y el cuerpo de la spec
  no cambia**: el criterio ya rutaba al glosario, que es donde ahora está la
  respuesta.

## Respuestas del gate humano — 2026-09-03 (Alberto Fojo)

Las tres preguntas que la spec llevaba al gate, contestadas:

1. **¿Se traducen los cuatro cualificadores al castellano? → SÍ.** Ver arriba.
   *Provisional* y *Confirmado* quedan idénticos en las dos lenguas; *Pendente de
   confirmar* → **Pendiente de confirmar**; *Sen sinal* → **Sin señal**. Los
   **identificadores** de `MATCH_QUALIFIERS` **siguen en galego** (SPEC-001 CA-8):
   lo que gana forma castellana es el literal, nunca la clave.
2. **¿El hallazgo del runbook sale a EPIC-MEJORA o se cierra aquí? → Se cierra
   aquí, en CA-3.8.** La misma línea cubre `corresponsal/` y `operador/`, y así la
   purga del archivo del bot deja de depender de que alguien recuerde un prefijo
   que no está escrito en ninguna parte.
3. **La sesión de ADR-024 §3 y partir la decisión en dos ADR → sin objeción.** El
   juicio de `sdd-arquitecto` queda en pie en los dos casos. El disparador de
   reapertura de la sesión sigue escrito y sin cambios: **el segundo operador**.

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 — sesión, fallo cerrado, frontera del secreto, sin anunciarse | `src/admin/session.ts` · `src/admin/handler.ts` (`adminHandler`, `unauthorized`) · `src/admin/view/markup.ts` (`document`, la `meta`) | `tests/admin/session.test.ts` casos 1-18 · `tests/admin/frontier.test.ts` casos 1-11 (CA-1.7, 1.8, 1.9, 1.11) · `tests/admin/document.test.ts` casos 1-3 (CA-1.10) | | |
| CA-2 — toda operación es `Observation`; `DECISION_WRITERS` no crece | `src/admin/observation.ts` · `src/admin/actions.ts` · `src/admin/handler.ts` (`onAction`) · `src/admin/ports.ts` (`AdminPorts`) | `tests/admin/flow.test.ts` casos 1-3 · `tests/admin/frontier.test.ts` casos 12-19 · `tests/types/spec017-admin.test-d.ts` (CA-2.5) | | |
| CA-3 — RN-10: archivo antes de parsear, lista blanca, motivo verbatim | `src/admin/redact.ts` · `src/admin/archive.ts` · `docs/procedimientos/jornada-de-medicion.md` (paso 2 bis y paso 3) | `tests/admin/archive.test.ts` casos 1-15 · `tests/docs/purga.test.ts` casos 1-4 (CA-3.8) | | |
| CA-4 — RN-12: la cadena llega al operador y su motivo; modelo intacto | `src/admin/handler.ts` (paso 7 y 9) · `migrations/0008_admin.sql` | `tests/db/admin-flow.test.ts` casos 12-16 · `tests/db/admin-schema.test.ts` casos 15-16 (CA-4.3) · `tests/admin/flow.test.ts` casos 4-5 (CA-4.2) | | |
| CA-5 — lo que el operador puede hacer y cómo lo trata el motor | `src/admin/actions.ts` (`proposalFor`) · `src/admin/observation.ts` · `src/decide/read-entry.ts` | `tests/db/admin-flow.test.ts` casos 1-13 (los siete subpuntos, contra Postgres y con el motor real) | | |
| CA-6 — la bandeja, el acuse trazable, `alerts` intacta, `migrations/0008` | `migrations/0008_admin.sql` · `src/db/admin.ts` · `src/admin/alerts.ts` · `src/admin/handler.ts` (`onAcknowledge`) | `tests/db/admin-schema.test.ts` casos 1-14 · `tests/db/admin-flow.test.ts` casos 17-19 · `tests/admin/board.test.ts` casos 1-4 · `tests/admin/flow.test.ts` caso 3 (CA-6.6) | | |
| CA-7 — el vale de acción: CSRF y cronómetro | `src/admin/ticket.ts` · `src/admin/view/markup.ts` (`ticketField`, `hidden`) | `tests/admin/ticket.test.ts` casos 1-9 | | |
| CA-8 — la cuarta cifra medible, declarada como cota inferior | `src/admin/ports.ts` (`OperatorActionRecord`) · `src/db/admin.ts` (`PostgresOperatorActionLog`) · `src/admin/handler.ts` (`record`) | `tests/admin/flow.test.ts` casos 6-9 · `tests/db/admin-flow.test.ts` caso 20 (CA-8.3 contra la base) | | |
| CA-9 — galego por defecto, castellano con paridad, cero literales | `src/i18n/admin-bundle.ts` · `src/i18n/admin.ts` · `src/i18n/gl.ts` y `es.ts` (espacios `admin` y `qualifiers`) | `tests/admin/i18n.test.ts` casos 1-16 · `tests/types/spec017-admin.test-d.ts` (CA-9.1, 9.3, 9.7) · `tests/admin/frontier.test.ts` casos 20-23 (CA-9.2, 9.5) · `tests/site/i18n.test.ts` caso 4 (enmendado) | | |
| CA-10 — **REESCRITO 2026-09-03 (ADR-026)**: el sistema de diseño, sobre el suelo de ADR-025, sin heredar lo que el sistema no cumple | `src/design/tokens.ts` y `system.ts` (dueño único, tabla y divergencias) · `src/admin/view/styles.ts` (la hoja, sin un valor propio) · `src/admin/view/markup.ts` y `pages.ts` (clases de estado y cualificador, gesto de `Escape`) · `public/fonts/` (cinco caras de Geist autoalojadas + OFL) | `tests/design/parity.test.ts` casos 1-17 (CA-10.2..10.6) · `tests/admin/style.test.ts` casos 1-32 (CA-10.1, 10.6..10.13) · **CA-10.14 A MANO**: `_qa/SPEC-017/` — cuatro capturas a 360 × 640, `CA-10.14-medidas.json` y `README.md` | | |
| CA-11 — nace apagado, y la llave es el partido, no el reloj | `src/admin/handler.ts` (`declaredMatches`, el paso 6) · `src/ingest/measurement.ts` (sin tocar: nace vacía) | `tests/admin/flow.test.ts` casos 10-13 | | |
| CA-12 — lo que el operador ve para poder arbitrar | `src/admin/board.ts` · `src/admin/view/pages.ts` · `src/decide/read-entry.ts` | `tests/admin/board.test.ts` casos 5-10 · `tests/admin/document.test.ts` casos 8-10 | | |
| CA-13 — puntos de entrada declarados; el panel no le pide nada a nadie | `src/app/(gl)/admin/route.ts` · `src/app/(es)/es/admin/route.ts` · `tests/polite/support/capability.ts` (`ENTRY_POINTS`) | `tests/admin/frontier.test.ts` casos 24-28 | | |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

_Sin veredicto: la spec acaba de entrar en `en-revision` (2026-09-03)._

**Nota para el verificador, escrita por adelantado porque esta spec tiene dos
centros y uno de ellos no se parece a los anteriores:**

1. **CA-1, CA-2 y CA-13 son fronteras de capacidad en la forma de ADR-016.** Son
   las que dicen si esta spec protege algo o solo lo promete. Comprueba los
   controles positivos uno por uno, apaga cada mecanismo y mira el rojo, y **lee
   los residuos declarados dentro de cada criterio**: si falta un residuo es
   *finding* con destino `sdd-arquitecto`, no una corrección del test. El caso de
   SPEC-013 que afirma que `DECISION_WRITERS` tiene **exactamente dos entradas**
   tiene que pasar sin que nadie lo toque — si alguien lo tocó, ése es el hallazgo.
2. **CA-10 ESTÁ IMPLEMENTADO ENTERO, en la letra NUEVA de quince subpuntos.**
   Lee la sección *CA-10 descongelado — evidencia subpunto a subpunto* antes de
   empezar: dice qué caso sostiene cada uno. Tres cosas que conviene mirar con
   lupa porque son las que decidirían un RED:
   - **la paridad de tokens** (`tests/design/parity.test.ts`) es una lista
     cerrada en la forma de ADR-016: apaga sus cuatro controles positivos uno a
     uno y mira el rojo, y **lee la lista de divergencias**: son tres, motivadas
     en ADR-026 §3.4, y una cuarta sin ADR detrás sería el hallazgo;
   - **`docs/diseno/` y `src/app/globals.css` siguen intactos** en el diff;
   - **`_qa/SPEC-017/` es la mitad manual y está hecha**, con Chrome real y las
     medidas sin retocar. Si algo de ahí no te cuadra, el `README.md` de ese
     directorio dice cómo reproducirlo.
   **Y hay una asimetría honesta que declarar**: los subpuntos 1 a 13 son
   estáticos y no ven un diseño calculado; el 14 lo vio un navegador y el 15 es
   un residuo declarado, no una promesa.
3. **`npm run gates`** (typecheck → lint → build → test, SPEC-016) **y**
   `npm run test:db` aparte. Sin `DATABASE_URL_TEST` los criterios con base son
   **UNMET, no *skipped*** (gate del 2026-08-29). CA-4, CA-5 y CA-6 son de base.
4. **Comprueba en el diff que `src/app/globals.css` y `docs/diseno/` siguen
   intactos.** Es la clase de regla que solo se incumple sin querer, y con
   CA-10 implementado es MÁS necesaria, no menos: ahora el panel **deriva** del
   sistema, y la tentación de «arreglar» el artefacto para que el panel salga
   bien es real. ADR-026 §3.7 lo prohíbe; lo que se mueve, se mueve en la lista
   de divergencias.
5. **Mira con lupa `src/decide/read-entry.ts` (F-SPEC-017-1)**, que es la única
   desviación estructural de la spec, y las cuatro entradas nuevas de
   `tests/polite/support/capability.ts` (F-SPEC-017-4).

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-017/. Informe HTML opcional: _qa/SPEC-017/informe.html -->

**`_qa/SPEC-017/` ESTÁ VACÍO A PROPÓSITO, y no es un descuido.** Las tres
capturas de CA-10.7 se hacen sobre una pantalla con estilos, y **CA-10 quedó
congelado el 2026-09-03** a la espera de ADR-026 (ver *Cambio de rumbo*). Hacer
las capturas ahora sería fotografiar un panel sin apariencia decidida y volver a
hacerlas después.

| CA | Captura | Fichero |
|---|---|---|
| CA-10.14 | Acceso a 360 × 640, con el foco visible sobre el primer campo | `CA-10.14-gl-360x640-acceso-foco.png` |
| CA-10.14 | Tablero a 360 × 640, con el foco visible sobre el primer control y **la alerta abierta arriba** | `CA-10.14-gl-360x640-taboleiro-foco.png` |
| CA-10.14 | Formulario de corrección a 360 × 640, foco visible, sin scroll horizontal | `CA-10.14-gl-360x640-correccion-foco.png` |
| CA-10.14 | La vuelta del foco tras `Escape`, con el motivo ya vaciado | `CA-10.14-gl-360x640-escape-foco-devolto.png` |
| CA-10.14 | Las medidas que devolvió el navegador, sin retocar | `CA-10.14-medidas.json` |
| CA-12 | El tablero con la alerta abierta primero — es la misma captura del tablero | `CA-10.14-gl-360x640-taboleiro-foco.png` |

**Cómo se hizo y qué encontró: `_qa/SPEC-017/README.md`.** Se hizo con **Chrome
real**, conducido por CDP desde un guion que vive en `_qa/` y **no en `tests/`**,
porque la spec decidió no meter un navegador automatizado en el proyecto
(ADR-025 §5) y esto no es una suite: es el instrumento de una comprobación
manual, y no lo corre ningún gate.

## Cambio de rumbo — 2026-09-03: CA-10 queda CONGELADO a la espera de ADR-026

**Qué pasó, con fecha, para que nadie lo lea como un CA abandonado.** Con la
implementación ya en marcha —y con la hoja de estilos del panel escrita y sus
aserciones en verde— **Alberto Fojo decidió que `docs/diseno/` es el sistema de
diseño del proyecto y que el panel del operador lo sigue también**. Eso
contradice **ADR-025 §4.2 y §4.3**, que prohíben a una interfaz de medición
importar, derivar o copiar nada de `docs/diseno/`, y `sdd-arquitecto` está
escribiendo **ADR-026** para superseder parcialmente ese punto. Hasta que esté
firmado, la regla vieja sigue escrita y **ya se sabe que va a caer**.

**Qué se congela: CA-10 entero** —foco visible, toque de 44 px, dígitos
tabulares, hoja de estilos aislada— **y la mitad manual de CA-10.7**, que no se
ha hecho: no hay ninguna captura en `_qa/SPEC-017/` y no debe haberla todavía.

**Qué se retiró, y por qué se retiró en vez de dejarse:**

- `src/admin/view/styles.ts`, con su paleta propia (`#ffffff` / `#101010` /
  `#0b3d91`). Escribirla ahora era escribir una paleta para tirar.
- El `<style>` en línea del documento y el guion de progresión de `Escape`
  (ADR-025 §2.5, que viaja con CA-10).
- `tests/admin/view.test.ts` entero. Una de sus aserciones decía que **ningún
  color de `docs/diseno/` aparece en la hoja del panel**; bajo ADR-026 eso será
  exactamente lo contrario de lo que hay que afirmar. Una aserción que dice lo
  opuesto de la regla que viene no es cobertura: es una trampa para quien la lea
  después.

**Qué sobrevive, porque no es estilo**, y vive ahora en
`tests/admin/document.test.ts`: que el panel **no se anuncia** (CA-1.10, que es
de ADR-024 y no de ADR-025), que su documento **no carga nada de fuera**, que
**no renderiza ninguna imagen** (ADR-013 §4 y §5), que **cada estado y cada
cualificador es un nodo de texto que lo nombra** (ADR-013 §2 — y ADR-013 sigue
mandando entero) y lo que CA-12 exige que el operador tenga delante.

**Qué entrega el panel mientras tanto: MARCADO SEMÁNTICO SIN APARIENCIA
DECIDIDA.** Ni un color, ni una tipografía, ni un token inventado. Las clases
`score`, `instant`, `num` y `scroller` siguen en el marcado como **enganches**,
porque son estructura y no apariencia; qué hacen con ellas los tokens de
`docs/diseno/` lo decide CA-10 cuando se descongele.

**Los otros doce criterios no cambian y están implementados y probados.**

**Y hay un punto abierto que el arquitecto tiene que resolver y que afecta a
este panel**, anotado aquí para que no se pierda: el sistema de `docs/diseno/`
pinta `provisional` como excepción y en este proyecto `provisional` es el estado
**normal** (entrada 1 del inventario de EPIC-004). El tablero de este panel ya
está construido **sin** apoyarse en esa decisión —se ordena por lo que necesita
a una persona, no por cualificador (CA-12.3)—, así que la resolución de ADR-026
no debería obligar a reescribirlo.

### Contestado — ADR-026 escrito, y qué cambia en CA-10 (`sdd-arquitecto`, 2026-09-03)

**Tu punto abierto era el correcto y era el que bloqueaba.** Lo resuelve
**ADR-026 §2**, en la dirección que suponías: **ninguno de los dos cualificadores
se apaga**. Los dos van con el color de texto principal, **los dos llevan
etiqueta** —también `confirmado`, que el sistema deja mudo porque «el normal no se
anuncia»— y lo que los distingue es el texto, no la falta de color. **Tu tablero
no se reescribe**: ordenar por lo que necesita a una persona era lo correcto y
CA-12.3 no cambia. Y **retirar `tests/admin/view.test.ts` fue el juicio correcto**:
su aserción decía lo contrario de ADR-026 §3.

**CA-10 pasa de 7 a 15 subpuntos**, y lo demás de la spec no cambia. Se pudo
reescribir porque **la spec no está cerrada** (ADR-015 gobierna las cerradas).

**Corrección al paso 1 de tu plan de retomada, y es importante: `src/design/` NO
se construye solo de `_tokens.css`.** Al inventariar el artefacto entero
aparecieron seis hechos que no se sabían, y dos de ellos cambian el trabajo:

1. **`_tokens.css` no lo usa ningún artboard.** Los seis `.dc.html` duplican su
   `<style>` y escriben hexadecimales en línea. Es un **documento de referencia**,
   no la definición ejecutable. Por eso ADR-026 §3.2 construye `src/design/` de
   **tres** fuentes: los 13 colores y 2 familias de `_tokens.css`, **las escalas
   declaradas en prosa en `Main.dc.html`** (paso de 4 px, radios 8·10·14·999, los
   cinco roles tipográficos) y **los tres colores en uso sin token** —`#131211`,
   `#1E1A16`, `#1D1A16`—.
2. **El sistema no tiene tokens de espaciado, radio, sombra, tamaño ni peso**, y
   **incumple sus propias escalas** (huecos de 3, 5, 6, 7, 10, 14, 28; radios 7,
   12, 6). **Se adopta lo declarado, no lo practicado**, y **CA-10.4 declara que
   esa mitad ningún test la puede comprobar**: ahí la adherencia la sostiene la
   revisión humana.
3. **Cero foco, cero teclado, cero componentes de formulario** en los diez
   ficheros. Tu paso 2 acertaba: **ADR-025 §2 y §3 sobreviven enteros** porque el
   sistema no cubre nada de lo que ellos cubren. Y **CA-10.15 declara** que los
   controles del panel **hay que inventarlos dentro del lenguaje del sistema**,
   que no es lo mismo que aplicarlo.
4. **`provisional` va solo por color en Móvil y en Global**: el sistema incumple
   **ADR-013 §2** dentro de sí mismo. **No se hereda** (ADR-026 §4.1) — la
   etiqueta va siempre, en todas las anchuras.
5. **`?` y `!` como etiquetas, y `FIN`/`APR`/`DESC` como estados**: intraducibles
   y fuera de `dominio.md`. **No se heredan** (§4.2, §4.3). Y **`Directo` aparece
   en siete ficheros** donde `dominio.md` dice *En xogo* (§4.4).
6. **El botón primario del sistema sale a ≈43 px y la fila compacta a ≈34 px**,
   con la concesión declarada en voz alta. **Gana ADR-025 §3** (§4.5).

**El `@import` de Google Fonts no llega al código** (§3.5): fuentes autoalojadas,
solo los pesos que se usan, y **ninguna petición a un tercero desde el navegador
de quien abre el panel**. Es CA-10.6, y la spec que elija el mecanismo declara la
dependencia nueva.

**Sigue todo congelado hasta que Alberto Fojo firme ADR-026**, que está en
`borrador`.

## CA-10 descongelado — evidencia subpunto a subpunto (`sdd-implementador`, 2026-09-03)

**ADR-026 quedó `aprobada` (commit `2278cb1`) y CA-10 se implementó entero**, en
la letra nueva del arquitecto: quince subpuntos, no siete. Aquí va cada uno con
lo que lo sostiene, para que el verificador no tenga que reconstruirlo.

**Gates de esta pasada, con el CSS de CA-10 dentro** (medidos sobre `1c9dd45`):
`npm run gates` → **137 ficheros, 1515 casos, todos verdes**, `Type Errors: no
errors`, `next build` con `ƒ /admin` y `ƒ /es/admin` en la tabla de rutas;
`npm run test:db` → **26 ficheros, 339 casos, todos verdes**.

### Los tokens (ADR-026 §3)

| # | Qué pide | Evidencia |
|---|---|---|
| **10.1** | Un solo domicilio; el panel no declara ni un color, ni una familia, ni un radio, ni un valor de escala | `src/design/tokens.ts` y `src/design/system.ts`. `tests/admin/style.test.ts` **casos 1-5**: el módulo de la hoja no tiene **ni un** `#rrggbb`, ni `rgb(`, ni `hsl(`; toda `font-family` fuera de un `@font-face` es `var(--sans)` o `var(--mono)`; fuera del `:root` **generado** no queda un solo hexadecimal, y cada `var(--x)` apunta a una fila de la tabla. **Control positivo (caso 5)**: un `#rrggbb` en la hoja pone rojo el mismo mecanismo del caso 1 |
| **10.2** | Paridad token a token, con tabla de correspondencia y lista cerrada de divergencias; el complemento vacío | `tests/design/parity.test.ts` **casos 1-9**. El mecanismo es **uno solo y parametrizado** (`parityOffences`), así que los controles ejercitan el mismo predicado y no una comprobación escrita dentro del caso. **Cuatro controles positivos**: torcer un valor (caso 5), **vaciar la tabla** (caso 6: quedan huérfanos los 15 tokens que no son divergencia), **vaciar las divergencias** (caso 7: `--fg-prov` queda huérfano, que es exactamente el que falta) y **añadir un token nuevo** al sistema (caso 8: rojo nombrándose, sin que nadie sepa que existe) |
| **10.3** | Las divergencias son las tres de ADR-026 §3.4 y ninguna más | `tests/design/parity.test.ts` **casos 10-12**: la lista tiene **exactamente tres** entradas, en ese orden, cada una con más de 120 caracteres de motivo; `--fg-prov` no existe en el código **ni por nombre ni por valor**; y ningún nombre emitido contiene `marca`, `directo` ni `alerta`, con la traducción escrita y auditable |
| **10.4** | Residuo: la paridad solo cubre color y familia | `tests/design/parity.test.ts` **casos 13-15**, y está escrito en la cabecera de `src/design/tokens.ts` y en el propio bloque `describe`. El caso 13 **mide** que el sistema no tiene ni un token de espaciado, radio, sombra o tamaño; el 14 y el 15 comprueban que las escalas del código son las **declaradas en prosa** en `Main.dc.html` (`4 · 8 · 12 · 16 · 24 · 32 · 48`, `Radios 8 · 10 · 14 · 999`) y que los cinco roles son los que el sistema nombra con su par `px / peso`. **Destino: EPIC-004; disparador: el deshielo** |
| **10.5** | `docs/diseno/` no se edita | `tests/design/parity.test.ts` **caso 16**: `_tokens.css` sigue con su `@import`, su `--fg-prov` y su `--directo` **intactos**. Y en el diff: `docs/diseno/` no aparece |
| **10.6** | Fuentes autoalojadas; el panel no le pide nada a ningún tercero | `tests/admin/style.test.ts` **casos 6-8** y `tests/design/parity.test.ts` **caso 17**: ni la hoja ni el marcado nombran `fonts.googleapis.com`, `fonts.gstatic.com`, ningún `@import` ni ningún `https?://`; las cinco caras existen en `public/fonts/` con su OFL; y **no se sirve ninguna cara que no esté declarada** (el directorio y `LOADED_FACES` son el mismo conjunto). Comprobado además **en el navegador**: `document.fonts.check('16px Geist')` y `'16px "Geist Mono"'` → `true` |

### Lo que NO se hereda del sistema (ADR-026 §4)

| # | Qué pide | Evidencia |
|---|---|---|
| **10.7** | Ningún cualificador se apaga; los dos llevan etiqueta, `confirmado` incluido; nada por debajo de 4.5:1 | `tests/admin/style.test.ts` **casos 9-11 y 13**. El caso 9 afirma la regla `.q-provisional,.q-confirmado{color:var(--fg)}` y que **ninguno de los dos aparece en una segunda regla**. El **caso 10 recorre el árbol renderizado para los CUATRO cualificadores** y afirma que la celda existe y su texto es el literal del bundle — `confirmado` incluido, que es el que el sistema deja mudo. El caso 13 **calcula** el contraste (luminancia relativa de WCAG) de `fg`, `fgMuted`, `amber`, `alert` y `accentLive` contra `--bg` **y** contra `--bg-elevated`: todos ≥ 4.5:1. **Control positivo (caso 11)**: apagar uno o dejarlo mudo rompe la regla que el caso 9 afirma |
| **10.8** | `confirmado` no se pinta con el acento de marca | `tests/admin/style.test.ts` **caso 12**: ninguna regla `.q-…` **ni ninguna regla `.s-…`** contiene `--brand` |
| **10.9** | Literales del glosario, nunca un glifo ni una abreviatura; `live` es *En xogo* | `tests/admin/style.test.ts` **casos 14-16**: los cinco estados salen de `statusesBundle`; `live` es **En xogo** / **En juego** y el documento **no contiene `Directo`**; y no aparece `FIN`, `APR` ni `DESC`. Medido también en el navegador: `s-live = "En xogo"` |

### El suelo de ADR-025, que el sistema no cubre

| # | Qué pide | Evidencia |
|---|---|---|
| **10.10** | Foco visible ≥ 2 px y ≥ 3:1, sin `outline:none` sin sustituto, sin `tabindex` positivo, `Escape` que devuelve el foco | `tests/admin/style.test.ts` **casos 17-23**. El anillo es `outline:2px solid var(--fg)` con offset; el contraste se **calcula** contra los tres fondos (`bg`, `bg-elevated`, `bg-step`); no hay `outline:none` ni `outline:0`; ningún `tabindex` positivo; nada modal. **Control positivo (caso 20)**: quitar el sustituto pone rojo el caso 17. **`Escape` comprobado en el navegador**: el `textarea` queda vacío y el foco pasa al enlace `[data-cancel]` con su anillo (`04-escape-foco-devolto.png`) |
| **10.11** | Toque ≥ 44 × 44 px como constante en un solo sitio, y campos ≥ 16 px | `tests/admin/style.test.ts` **casos 24-26**: `TOUCH_TARGET_PX` se declara **una vez** en `src/design/tokens.ts`, la hoja **no escribe el `44` ni una vez** (lo interpola), la regla cubre `a, button, input, select, textarea, summary`, y `INPUT_FONT_PX` es 16 y **gana** sobre el rol `team` del sistema, que es 15. Medido en el navegador: `input`, `select`, `button` y `a` a **44 px** de alto y `font-size: 16px` |
| **10.12** | Nada solo por color, dígitos tabulares, ninguna imagen | `tests/admin/style.test.ts` **casos 27-29**: **cada** nodo con clase `s-…` o `q-…` del árbol renderizado tiene texto dentro; `tabular-nums` y `'tnum' 1` sobre `.num, .score, .instant`; cero `<img>`, `<svg>` y `<picture>` en las dos pantallas; ni `background-image` ni ningún `url(` que no sea una cara propia |
| **10.13** | Hoja propia, alcanzable solo desde las rutas del panel, y `globals.css` sin editar ni cargar | `tests/admin/style.test.ts` **casos 30-32**: ningún módulo de `src/admin/` importa CSS ni nada de `@/site/`; el documento del panel **no contiene ni `--paper`, ni `--ink`, ni ninguno de los cinco colores de `globals.css`**; y la hoja **no se sirve por ninguna URL** — va en línea, que es la lectura más estricta de lo que sobrevive de ADR-025 §4.2. En el diff, `src/app/globals.css` intacto |

### Lo que solo ve un navegador

| # | Qué pide | Evidencia |
|---|---|---|
| **10.14** | A 360 × 640, teclado solo, foco visible en cada parada, `Escape`, sin scroll horizontal, capturas | **HECHO A MANO** con **Chrome real** a 360 × 640: `_qa/SPEC-017/`, cuatro capturas, `CA-10.14-medidas.json` y `README.md` con el método y los números. `document.scrollWidth / clientWidth = 360 / 360` en las dos pantallas; la tabla ancha scrollea **dentro de `.scroller`** (856 vs 344); del `select` al `textarea` en **3 tabuladores**; el motivo se escribió **con el teclado**. **Encontró un defecto que ningún test estático veía** —la tabla partía los nombres canónicos de la RFGF carácter a carácter a 360 px— y está arreglado (`width:max-content;min-width:100%`), con la captura tomada **después** |
| **10.15** | Residuo: el sistema no trae ni un componente de formulario ni un estado de foco | Declarado en la cabecera de `src/admin/view/styles.ts`, donde se escribe: los controles del panel **son nuevos y solo su vocabulario es del sistema**. Este criterio **no promete** que el panel salga dibujado del sistema, solo que no se aparte de él. **Destino: EPIC-004, cuya entrada 3 sigue abierta sobre el artefacto; disparador: el deshielo** |

### Lo que la fuente cuesta, dicho entero

Se autoaloja **copiando cinco caras `.woff2` del paquete `geist@1.7.2` de Vercel
a `public/fonts/`**, con su `LICENSE.txt` (OFL 1.1) al lado. **No se añade
ninguna dependencia de npm**: nada de `src/` importa el paquete, así que
`ALLOWED_PACKAGES` no cambia. Los pesos son **exactamente los que los roles
usados piden**: Geist 400, 500 y 600, y Geist Mono 500 y 600 — 256 KB en total.

**El rol `display` (44 / 800) no se carga, y no es un descuido**: el panel no lo
usa —no tiene ficha de partido, tiene una cola de trabajo y formularios— y
cargar su cara sería cargar un peso que nadie usa (ADR-026 §3.5). El rol **queda
declarado** en `src/design/tokens.ts` porque ése es el domicilio del lenguaje del
sistema para toda interfaz, y la ficha del snapshot lo va a querer. **Y quien
llegue ahí tiene una decisión esperándole, escrita en el propio módulo:** Vercel
distribuye el peso 800 de Geist **solo en cursiva** como cara estática; las
verticales son 700 y 900. El 800 exacto pide la cara variable, que es un fichero
con todos los pesos dentro — y eso cambia «solo los pesos que se usan» por una
sola petición. Es un compromiso real y **es de la spec que primero necesite
`display`**, no de ésta (F-SPEC-017-10).

## Salvedades / follow-ups
<!-- IDs F-SPEC-017-1, F-SPEC-017-2… con destino (spec futura o EPIC-MEJORA). -->

**Lo que ya estaba declarado en el cuerpo de la spec** —el vale que no es de un
solo uso (CA-7.5), la cota inferior de `operator_actions` (CA-8.4), el límite de
la lista blanca ante el contenido del motivo (CA-3.9), las dos implementaciones
de comparación en tiempo constante, F-SPEC-013-11 contestado sin cerrarse
(CA-2.6), las entradas 1 y 5 del inventario de EPIC-004 y F-SPEC-001-1— **no se
renumera aquí: se cita**, y cada uno tiene su caso que lo repite donde el
mecanismo juzga.

Lo que la implementación abre, con su id:

- **F-SPEC-017-1 — `src/decide/read-entry.ts` es una DESVIACIÓN DECLARADA del
  §1 de la spec, y es la decisión más importante que tomé.** El §1 dice que
  `src/decide/` «no se edita». CA-12.1 y CA-12.2 exigen que el panel enseñe la
  `Decision` vigente y **el log entero**, y la frontera de SPEC-013 CA-13 hace
  eso **imposible desde fuera de `src/decide/`** por sus dos mecanismos:
  `PostgresDecisionStore`/`DecisionStore` son rojos en cualquier fichero que no
  sea escritor declarado, y **nombrar la tabla `decisions` en una plantilla SQL
  también**. Así que no cabía ni en `src/admin/` ni en `src/db/admin.ts`.
  Lo resolví con **un FICHERO NUEVO en `src/decide/`**, con la forma y el
  precedente exactos de `engine-entry.ts`, que SPEC-015 añadió para la mitad de
  escritura: devuelve **valores** (`Decision`), ningún almacén, se importa **por
  nombre**, no alcanza `src/polite/http.ts`, y **`DECISION_WRITERS` sigue
  teniendo dos entradas** (caso 12 de `tests/admin/frontier.test.ts` y caso 1 de
  `tests/decide/rn08-frontier.test.ts`, sin tocar una aserción). Lo único que
  crece es la **aserción derivada** del caso 10 de ese fichero —la enumeración
  de quién cruza los nombres—, con el motivo escrito en el mismo diff, que es
  literalmente lo que hizo SPEC-015 con `engine-entry.ts`.
  **Destino: ratificación de `sdd-arquitecto`.** Si prefiere otra forma, es un
  fichero y su test; no toca nada más.
- **F-SPEC-017-2 — CERRADO el 2026-09-03, revisado con ADR-026 firmado: las
  rutas siguen siendo `route.ts` y no `page.tsx`.** El motivo está escrito en
  los dos ficheros de ruta, que es donde se decide, y son **cuatro**:
  1. **`src/app/globals.css` no se edita NI SE CARGA.** ADR-025 §4.1 sigue
     INTACTO (ADR-026 §5) y un manejador de ruta **no lo envuelve ningún
     layout**, así que la hoja del sitio nunca entra en este documento. Con una
     `page.tsx` bajo `(gl)/` sí entraría.
  2. **ADR-026 §3.6 hace el panel oscuro-only** y el sitio público sirve claro
     por defecto. Bajo una página, las **dos bases opuestas** compartirían
     documento; así **no se tocan por construcción**, que es el estado que la
     entrada 6 del inventario de EPIC-004 describe como el bueno. Un caso lo
     afirma (`style.test.ts` 31): el documento del panel no lleva ni `--paper`,
     ni `--ink`, ni ninguno de los cinco colores de `globals.css`.
  3. **CA-13.3 y CA-13.4 dejarían de tener sujeto.** Una `page.tsx` no
     construye ninguna `Response`, así que «se construye con
     `new Response(JSON.stringify(…))` y nunca con `Response.json`» sería un
     criterio sobre nada.
  4. **La fuente se autoaloja igual, y de forma más auditable**: `@font-face`
     escrito en nuestra propia hoja, con una URL de nuestro origen que un test
     lee (`style.test.ts` 7).
  **El precio, dicho en voz alta y no escondido:** se pierde la optimización de
  `next/font` —el `preload` automático de la cara y las métricas de la fuente de
  respaldo, que reducen el salto de maquetación al cargar—. Es el coste de la
  decisión, no un efecto secundario que se descubra después. **Se revisa el día
  que el panel deje de ser un manejador de ruta**, y si eso pasa, `next/font`
  vuelve a estar sobre la mesa.
- **F-SPEC-017-3 — `ADMIN_OPERATORS` y `ADMIN_SESSION_SECRET` no están
  documentadas en ningún runbook ni en `.env.example`.** ADR-024 §Consecuencias
  lo dejó dicho —«van al runbook de configuración»— y esta spec no declara ese
  fichero entre lo que toca, así que no lo he tocado. Sin esas dos variables el
  panel **falla cerrado y es ruidoso a propósito**, así que no rompe nada; lo que
  falta es la instrucción de cómo generarlas (`ADMIN_OPERATORS` guarda el
  **digest** SHA-256 hex del secreto, nunca el secreto). **Destino:
  `sdd-documentalista` tras el GREEN.**
- **F-SPEC-017-4 — `tests/polite/support/capability.ts` crece en cuatro
  entradas, y las cuatro necesitan el ojo del verificador.** `node:crypto` gana
  `createHmac` en su superficie (la sesión y el vale se firman con HMAC-SHA-256,
  ADR-024 §3 y §4), y `ALLOWED_GLOBALS` gana `Array` (`isArray`, para no fiarse
  de la forma de un vale decodificado), `URLSearchParams` (leer el cuerpo de un
  formulario) y `encodeURIComponent` (el enlace propio al detalle de un
  partido). **Ninguna de las cuatro le pide bytes a un tercero**, que es lo único
  que habría necesitado una firma humana, y las cuatro llegan con su motivo
  escrito. **Destino: revisión del verificador en el diff.**
- **F-SPEC-017-5 — un `match_id` o un `alert_id` que no existen NO dejan fila en
  `operator_actions`.** Está declarado en el propio `handler.ts`, donde se
  decide: el objetivo de una fila es una **clave ajena** a `matches` o a
  `alerts` (migración 0008), así que una fila sobre un partido que no existe no
  es representable — y tampoco es un acto de operación, porque este panel nunca
  sirvió un formulario para él. Lo que CA-8.2 nombra —«partido fuera de
  jornada»— **sí deja su fila**, y hay caso (caso 12 de `flow.test.ts`).
  **Destino: EPIC-MEJORA si alguien quiere contar también los envíos con
  objetivo inexistente; disparador: el día que eso pase alguna vez.**
- **F-SPEC-017-6 — la purga del archivo humano es POR FAMILIA, no por día.** El
  renglón de runbook de CA-3.8 borra `objects/operador/` y `objects/corresponsal/`
  enteros, y no puede cortar por día: sus claves llevan el **tipo de evento**
  donde toda fuente automática lleva un `competition_id`, que es la
  irregularidad que ADR-023 §2 y ADR-024 §6 declaran. Mientras haya **una**
  jornada declarada a la vez —el régimen que ADR-019 §3 entrega— purgar la
  familia y purgar la jornada son lo mismo. **Disparador: dos jornadas
  declaradas vivas a la vez.** Está escrito también en el runbook.
- **F-SPEC-017-7 — CA-9.4 pasa, y su alcance real es más estrecho de lo que
  suena.** `tests/site/no-hardcoded-literals.test.ts` sigue verde, las dos rutas
  nuevas están dentro de `siteSources()` y **no se añadió ninguna excepción**.
  Pero sus tres reglas son de JSX y **solo se aplican a los `.tsx`**, y las
  rutas del panel son `.ts`: lo que de verdad guarda los literales del panel es
  CA-9.3 —`AdminText`, cuyo constructor no se exporta, así que un literal en
  `src/admin/` **no compila**— más el mecanismo de `frontier.test.ts` que
  prohíbe cualquier literal visible de estado o de cualificador. Se dice aquí
  para que nadie lea CA-9.4 como si cubriera más de lo que cubre.
- **F-SPEC-017-8 — CERRADO el 2026-09-03. CA-10 estaba congelado y ya no lo
  está.** ADR-026 quedó `aprobada` (`2278cb1`), el arquitecto reescribió el
  criterio de 7 a 15 subpuntos, y los quince están implementados y probados: ver
  *CA-10 descongelado — evidencia subpunto a subpunto*. La hoja de estilos
  volvió, esta vez **derivada del sistema** y sin un valor propio, y la suite de
  estilo vive en `tests/admin/style.test.ts` y `tests/design/parity.test.ts` —
  **no** en el `tests/admin/view.test.ts` que se retiró, cuyas aserciones decían
  lo contrario de lo que ADR-026 acabó diciendo.

Y lo que la implementación de CA-10 abre:

- **F-SPEC-017-9 — el rol `display` del sistema no tiene cara estática vertical
  en el peso que declara.** El sistema escribe `display: 44 / 800` y Vercel
  distribuye el 800 de Geist **solo en cursiva**; las verticales son 700
  (`Bold`) y 900 (`Black`). El panel **no usa `display`**, así que aquí no
  muerde y su cara no se carga; la ficha de partido del snapshot sí lo va a
  usar, y tendrá que elegir entre la **cara variable** —un fichero con todos los
  pesos, que cambia «solo los pesos que se usan» por una sola petición— y
  desviarse a 700 o 900 **declarándolo como divergencia**. Está escrito en
  `src/design/tokens.ts`, junto a `LOADED_FACES`. **Destino: la spec del
  snapshot; disparador: la primera interfaz que use el rol `display`.**
- **F-SPEC-017-10 — la adherencia a la escala no la comprueba nada, y no es
  culpa de esta spec.** `_tokens.css` declara **color y familia y nada más**:
  cero tokens de espaciado, radio, sombra, tamaño, peso o duración (medido,
  caso 13 de `parity.test.ts`). El espaciado, los radios, la escala tipográfica
  y la densidad **no se pueden comparar contra nada**, así que ahí la adherencia
  la sostiene la revisión humana. Lo declara ADR-026 §3.3, lo repite CA-10.4 y
  lo repite la cabecera de `src/design/tokens.ts`. **Destino: EPIC-004**,
  convertir sus escalas en tokens; **disparador: el deshielo.**
- **F-SPEC-017-11 — el guardián de `telegram_user_id` de SPEC-015 CA-10.4 tiene
  un modo de FALSO POSITIVO sobre datos comprimidos que su criterio no
  declara.** Una de las capturas de `_qa/SPEC-017/`, tal como Chrome la
  escribió, llevaba en su flujo de compresión una tirada de once dígitos, y el
  caso 28 de `tests/bot/frontier.test.ts` la marcó como un identificador de
  Telegram. **No se tocó el guardián ni su lista de exclusiones**: su premisa
  —«un identificador escrito dentro de un binario está igual de versionado»— es
  correcta y es de una spec cerrada. Se **recodificó el PNG** sin pérdida (mismo
  tamaño, mismos píxeles) y el flujo nuevo ya no lleva la tirada. Lo que queda
  abierto es que **el mecanismo puede volver a dar rojo por azar** con cualquier
  captura futura, y su criterio no lo dice. **Destino: `sdd-arquitecto`;
  disparador: la segunda vez que ocurra** — que con la interfaz del marcador
  produciendo capturas es cuestión de tiempo.
- **F-SPEC-017-12 — el guion de la comprobación manual se versiona con
  extensión `.txt`.** `.mjs` es una extensión de CÓDIGO declarada en
  `SCAN_EXTENSIONS` (SPEC-008 CA-2.6), y un fichero de código fuera de las
  raíces del escaneo es **rojo** — con razón, porque así es como F-SPEC-008-V37
  metió una ruta viva sin auditar. El guion **no es código que el repositorio
  ejecute**: es el instrumento de una persona haciendo una comprobación manual,
  y no lo corre ningún gate. Se guarda legible y **fuera del conjunto que la
  frontera audita, sin ensanchar ninguna lista de exclusiones**. **Destino: la
  spec que automatice la comprobación** (ADR-025 §5, disparador ya escrito: la
  primera spec que construya la interfaz del marcador).

### Enmienda escrita fuera de esta spec (ADR-015)

El gate decidió traducir los cualificadores, así que `src/i18n/es.ts` gana el
espacio de nombres `qualifiers` y **una aserción de SPEC-004 CA-4 deja de ser
cierta** (`expect(es).not.toHaveProperty('qualifiers')`). El cuerpo de SPEC-004
**no se edita**; la enmienda está escrita en su ledger, bajo
`## Enmienda — 2026-09-03`, y el caso sigue afirmando lo que CA-4 protege de
verdad: que `qualifiers` **no entra en la paridad del sitio**.


## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->

**Estado al 2026-09-03, al terminar `sdd-implementador`. LOS TRECE CRITERIOS
ESTÁN ENTREGADOS.** En `ft/SPEC-017-panel-do-operador`, sobre `81a10f5`:

| Commit | Qué trae |
|---|---|
| `ba0be1c` | El esqueleto de `src/admin/`, `migrations/0008`, `src/db/admin.ts`, `src/decide/read-entry.ts`, las dos rutas, y la enmienda de ADR-015 en el ledger de SPEC-004 |
| `6263f27` | Las suites sin base: sesión, vale, archivo, bandeja, tablero, i18n y fronteras, más la edición del runbook de purga |
| `81f0cd5` | Las suites contra Postgres: el esquema de `0008` y la jornada del panel con el motor real |
| `62c8da5` | El congelado de CA-10: se retiran la hoja de estilos y sus aserciones |
| `1c9dd45` | **CA-10 descongelado**: `src/design/`, la hoja derivada del sistema, las fuentes autoalojadas, y la comprobación manual con navegador |
| `2de2b9f` · `571b643` · `212fc85` | El ledger: evidencia visual, los quince subpuntos de CA-10, y los hallazgos |

**Gates, medidos sobre `1c9dd45`, con el CSS de CA-10 dentro:**

- `npm run gates` (typecheck → lint → build → test): **137 ficheros, 1515 casos,
  todos verdes**; `Type Errors: no errors`; `next build` con `ƒ /admin` y
  `ƒ /es/admin` en la tabla de rutas.
- `npm run test:db` aparte: **26 ficheros, 339 casos, todos verdes**.

**Lo que NO queda pendiente de esta spec.** No hay ningún criterio a medias y no
hay ningún trozo de CA-10 aplazado: la hoja está escrita, la paridad se
comprueba, las fuentes se sirven de nuestro origen y la mitad manual está hecha
con capturas. Lo que queda son **hallazgos con destino escrito** —F-SPEC-017-1,
3, 5, 6, 7, 9, 10, 11 y 12— y los residuos que el cuerpo de la spec ya declaraba.

**Lo que sigue esperando a alguien que no soy yo:**

- **`sdd-verificador`**: el veredicto. Empieza por las tres fronteras de ADR-016
  (CA-1, CA-2, CA-13), por la paridad de tokens de CA-10.2, y por el diff de
  `docs/diseno/` y `globals.css`.
- **`sdd-producto`**: el **cambio de alcance de EPIC-004** (ADR-026 §6) en su
  `_epica.md` y en el roadmap. **No es trabajo de esta spec y sin él el ADR y la
  épica se contradicen desde el día uno.**
- **`sdd-documentalista`**, tras el GREEN: `src/admin/`, `src/design/` y
  `public/fonts/` son estructura nueva en `CLAUDE.md`; `migrations/0008`, una
  migración más; y **F-SPEC-017-3** —cómo se generan `ADMIN_OPERATORS` (el
  **digest** SHA-256 hex, nunca el secreto) y `ADMIN_SESSION_SECRET`— sigue sin
  runbook.

**Y una advertencia para quien retome, que es la misma de antes y no ha
cambiado:** el panel **entrega apagado y hay que dejarlo así**.
`MEASUREMENT_WINDOWS` sigue vacía —se declaró una jornada temporal para la
comprobación manual y **se revirtió antes de commitear**, verificado en el
diff—, `ADMIN_OPERATORS` no existe y `ADMIN_SESSION_SECRET` tampoco. Encenderlo
es un acto posterior con su propia ceremonia.

---

**Follow-up que no es de esta spec pero nace de su ADR, anotado aquí para que no
se pierda:** `sdd-producto` tiene que escribir el **cambio de alcance de
EPIC-004** en su `_epica.md` y en `docs/roadmap.md` (ADR-026 §6) — salen de ella
el panel del operador y los tokens como código, **entra** la reparación del
propio artefacto (escalas como tokens, foco, componentes de formulario, la
etiqueta de `provisional` en las tres vistas, el vocabulario alineado con
`dominio.md`), y su **entrada 1 queda cerrada** por ADR-026 §2 mientras la 2, 3,
4 y 6 siguen abiertas. **Si esa edición no ocurre, el ADR y la épica se
contradicen desde el día uno**, que es exactamente la patología que hizo nacer a
EPIC-004. **No es trabajo de `sdd-arquitecto`: las épicas y el roadmap son de
`sdd-producto`.**
