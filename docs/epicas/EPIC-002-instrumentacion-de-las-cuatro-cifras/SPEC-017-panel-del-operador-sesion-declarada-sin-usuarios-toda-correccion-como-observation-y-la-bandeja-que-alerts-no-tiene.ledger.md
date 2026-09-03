---
id: SPEC-017
tipo: ledger
epica: EPIC-002
---
# Ledger — SPEC-017 Panel del operador: sesión declarada sin usuarios, toda corrección como `Observation`, y la bandeja que `alerts` no tiene

## Resumen
- Fase: **`en-revision`** — escrita por `sdd-arquitecto` el 2026-09-03, firmada
  por Alberto Fojo el 2026-09-03, implementada por `sdd-implementador` el
  2026-09-03. La fuente de verdad es el frontmatter de la spec. **Doce de los
  trece criterios entregados; CA-10 CONGELADO por el cambio de rumbo del mismo
  día (ver más abajo). Lista para `sdd-verificador`.**
- Rama: `ft/SPEC-017-panel-do-operador`
- ADRs que trae, los dos **aprobados por Alberto Fojo el 2026-09-03**. CA-1,
  CA-7, CA-8, CA-10 y CA-11 los ejecutan literalmente. **ADR-025 §4 va a ser
  superseded parcialmente por ADR-026**, en curso: es el motivo por el que CA-10
  está congelado.
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
| CA-10 — **REESCRITO 2026-09-03 (ADR-026)**: el sistema de diseño, sobre el suelo de ADR-025, sin heredar lo que el sistema no cumple | **CONGELADO el 2026-09-03** — ver *Cambio de rumbo*. No hay hoja de estilos y el panel entrega marcado semántico sin apariencia decidida | **Ninguno, a propósito.** `tests/admin/view.test.ts` se retiró porque afirmaba lo contrario de lo que ADR-026 va a decir | | ❌ |
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
2. **CA-10 ENTERO ESTÁ CONGELADO desde el 2026-09-03, y CA-10.7 con él.** No
   busques la hoja de estilos ni las capturas de `_qa/SPEC-017/`: no existen, y no
   deben existir todavía. El motivo, con fecha y con lo que se retiró, está en la
   sección **Cambio de rumbo** de este ledger. **Un CA-10 sin implementar no es un
   CA-10 incumplido: es un CA-10 aplazado por decisión del humano**, y lo que hay
   que verificar de él hoy es exactamente eso — que no hay hoja de estilos, que el
   panel emite marcado semántico sin apariencia decidida, y que no queda ninguna
   aserción diciendo lo contrario de lo que ADR-026 va a decir.
3. **`npm run gates`** (typecheck → lint → build → test, SPEC-016) **y**
   `npm run test:db` aparte. Sin `DATABASE_URL_TEST` los criterios con base son
   **UNMET, no *skipped*** (gate del 2026-08-29). CA-4, CA-5 y CA-6 son de base.
4. **Comprueba en el diff que `src/app/globals.css` y `docs/diseno/` siguen
   intactos.** Es la clase de regla que solo se incumple sin querer, y sigue
   valiendo con CA-10 congelado: ninguno de los dos se ha tocado.
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

| CA | Captura esperada | Estado |
|---|---|---|
| CA-10.14 | Tablero a 360 × 640, con el foco visible sobre el primer control | **CONGELADA** (ADR-026) |
| CA-10.14 | Formulario de corrección a 360 × 640, con el foco visible y sin scroll horizontal | **CONGELADA** (ADR-026) |
| CA-10.14 | El paso de confirmación, y la vuelta del foco tras `Escape` | **CONGELADA** (ADR-026) |
| CA-12 | El tablero con una alerta abierta arriba y el orden de la cola | Pendiente del verificador |

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
- **F-SPEC-017-2 — las rutas del panel son `route.ts`, no `page.tsx`, y eso
  tiene una consecuencia que conviene leer.** Un manejador de ruta **no lo
  envuelve ningún layout**, así que `src/app/globals.css` —que importan los dos
  layouts raíz del sitio público— **nunca se carga en el documento del panel**.
  Con una `page.tsx` bajo `(gl)/` sí se cargaría, y el panel habría heredado la
  base clara del sitio sin que nadie lo decidiera. Era la lectura correcta bajo
  ADR-025 §4; con ADR-026 en camino **hay que volver a mirarlo**, porque el
  enganche de `docs/diseno/` puede querer otra cosa. **Destino: CA-10, cuando se
  descongele.**
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
- **F-SPEC-017-8 — CA-10 congelado.** Ver *Cambio de rumbo* arriba. **Destino:
  este mismo ledger, en cuanto ADR-026 esté firmado.**

### Enmienda escrita fuera de esta spec (ADR-015)

El gate decidió traducir los cualificadores, así que `src/i18n/es.ts` gana el
espacio de nombres `qualifiers` y **una aserción de SPEC-004 CA-4 deja de ser
cierta** (`expect(es).not.toHaveProperty('qualifiers')`). El cuerpo de SPEC-004
**no se edita**; la enmienda está escrita en su ledger, bajo
`## Enmienda — 2026-09-03`, y el caso sigue afirmando lo que CA-4 protege de
verdad: que `qualifiers` **no entra en la paridad del sitio**.


## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->

**Estado al 2026-09-03, al terminar `sdd-implementador`.** En
`ft/SPEC-017-panel-do-operador`, cuatro commits sobre `81a10f5`:

1. `ba0be1c` — el esqueleto de `src/admin/`, `migrations/0008`, `src/db/admin.ts`,
   `src/decide/read-entry.ts`, las dos rutas y la enmienda de ADR-015 en el
   ledger de SPEC-004.
2. `6263f27` — las suites sin base (sesión, vale, archivo, bandeja, tablero,
   i18n, fronteras) y la edición del runbook de purga.
3. `81f0cd5` — las suites contra Postgres: el esquema de `0008` y la jornada
   sintética del panel con el motor real.
4. `62c8da5` — el congelado de CA-10: se retiran la hoja de estilos y sus
   aserciones (ver *Cambio de rumbo*).

**Gates, medidos:**

- `npm run gates` (typecheck → lint → build → test): **135 ficheros, 1466 casos,
  typecheck sin errores, `oxlint --type-aware` a exit 0, `next build` con
  `ƒ /admin` y `ƒ /es/admin` en la tabla de rutas.**
- `npm run test:db` aparte: **26 ficheros, 339 casos.**

**Lo que falta, y es exactamente una cosa: CA-10.** Está congelado a la espera
de **ADR-026**, que va a superseder parcialmente ADR-025 §4 para que el panel
siga `docs/diseno/`. Cuando esté firmado, lo que hay que hacer es:

1. Escribir la hoja del panel **derivando del sistema** —y ojo: **de tres
   fuentes, no solo de `_tokens.css`**, que no lo usa ningún artboard; ver la
   corrección al paso 1 en *Contestado* y ADR-026 §3.2— —paleta
   oscura, Geist / Geist Mono, `tabular-nums`— en vez de declarar valores
   propios, y engancharla desde `src/admin/view/markup.ts` (`document`), que hoy
   emite el documento **sin ninguna hoja**. Los enganches ya están en el marcado:
   `score`, `instant`, `num`, `scroller`, `soft`, `notice`, `row`, `data-cancel`.
2. Reponer el suelo de ADR-025 §2 y §3 —foco visible ≥ 2 px y ≥ 3:1, toque de
   44 px como constante nombrada en un solo sitio, campos ≥ 16 px, `Escape` que
   cancela y devuelve el foco— **comprobando que ADR-026 no lo baja**: §2 y §3
   son suelo y un sistema de diseño puede subirlos, no bajarlos (ADR-025 §1).
3. Rehacer la suite de CA-10.1 a CA-10.6. **El fichero anterior está en el
   historial** (`tests/admin/view.test.ts`, commit `6263f27`) y buena parte se
   reaprovecha tal cual: el cálculo de contraste por luminancia relativa, el
   control positivo que apaga el contorno, el conteo del `44`, y las aserciones
   de dígitos tabulares y de cero imágenes. **Lo que NO se reaprovecha son las
   dos aserciones que separaban el panel de `docs/diseno/`**: bajo ADR-026 dicen
   lo contrario.
4. Hacer la mitad manual de CA-10.7 con navegador y dejar las tres capturas en
   `_qa/SPEC-017/`.
5. Resolver, con `sdd-arquitecto`, el punto abierto que ADR-026 arrastra: el
   sistema pinta `provisional` como excepción y aquí es el estado **normal**.

**Lo que NO hay que rehacer:** los otros doce criterios están implementados y
probados, y `src/admin/` está entero salvo `view/styles.ts`. El orden de
peldaños del arquitecto se siguió con dos desviaciones, las dos escritas arriba:
`src/decide/read-entry.ts` (F-SPEC-017-1) y el peldaño 6, que se hizo **sin la
mitad de estilos** por el cambio de rumbo.

**Y una advertencia para quien retome:** el panel **entrega apagado y hay que
dejarlo así**. `MEASUREMENT_WINDOWS` sigue vacía, `ADMIN_OPERATORS` no existe y
`ADMIN_SESSION_SECRET` tampoco. Encenderlo es un acto posterior con su propia
ceremonia (F-SPEC-017-3).

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
