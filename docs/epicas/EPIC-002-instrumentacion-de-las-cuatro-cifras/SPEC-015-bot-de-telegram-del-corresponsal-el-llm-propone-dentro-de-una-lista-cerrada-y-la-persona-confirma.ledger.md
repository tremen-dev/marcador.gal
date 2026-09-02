---
id: SPEC-015
tipo: ledger
epica: EPIC-002
---
# Ledger — SPEC-015 Bot de Telegram del corresponsal: el LLM propone dentro de una lista cerrada y la persona confirma

## Resumen
- Fase: **en-revisión** (implementada el 2026-09-03). La fuente de verdad es el
  frontmatter de la spec.
- Rama: `ft/SPEC-015-bot-corresponsal` (worktree `.claude/worktrees/spec-015`).
- **ADR-022** y **ADR-023** están **aprobados** (Alberto Fojo, 2026-09-03).
- **Catorce de los quince criterios implementados.** CA-5 va **parcial y a
  propósito**: su precondición —proveedor de LLM elegido y DPA guardado y
  fechado en `docs/legal/`— no está cumplida (ADR-023 §6.4), así que
  `src/bot/models/` **no existe**. Todo lo demás de CA-5 sí: el puerto, el
  constructor del prompt, el esquema zod con sus cinco formas de rechazo, la
  frontera de quién puede llamar, el test de fuga sobre el prompt renderizado y
  los subpuntos 9 y 10. Detalle en «CA-5: qué quedó hecho y qué falta».
- **El bot se entrega APAGADO**, que es la consecuencia querida (ADR-022 §7): la
  lista de jornadas de medición está vacía, el catálogo de corresponsales está
  vacío, el mapeo no existe y no hay adaptador de modelo. Con la configuración
  de producción, un mensaje de cualquiera recibe una frase neutra y deja **cero
  objetos crudos, cero filas y cero llamadas al modelo**.

## Respuestas del gate — 2026-09-03, Alberto Fojo

Las tres preguntas bloqueantes de las notas §6 de la spec. **Dos cerradas, una
aplazada con matiz.** Se anotan aquí con fecha y autor porque el ledger es donde
un verificador irá a buscar por qué el artefacto dice lo que dice.

**Y el alcance de estas respuestas, dicho antes que nada:** son firmas sobre el
**contenido** de decisiones concretas, **no** la aprobación formal de la spec ni
de los dos ADR. **Los tres frontmatter siguen en `borrador`** y ahí se quedan
hasta que el gate lo diga.

| # | Pregunta | Respuesta del 2026-09-03 | Dónde aterrizó |
|---|---|---|---|
| 1 | Plazo de retención del archivo del corresponsal | **FIRMADA: sí, régimen B extendido** — 30 días desde el fin de la jornada, una prórroga escrita y motivada, techo duro de 90 | ADR-023 §2, **sin cambios**: se firma tal como estaba escrito |
| 2 | Proveedor de LLM y su DPA | **NO decidido, aplazado a la implementación a propósito** | ADR-023 **§3 bis** (nuevo) y §6.4 (reforzado); SPEC-015 CA-5 (precondición) y notas §6.2 |
| 3 | ¿`live` es *En xogo* o *Directo*? | **DECIDIDO: «En xogo» siempre**, una sola forma en todo el producto. Descarta expresamente la distinción estado/filtro que recomendaba `sdd-lingua` | `docs/fundacion/dominio.md`; SPEC-015 notas §3 y *Fuera de alcance*; EPIC-MEJORA (inventario) |

**Añadido del gate el 2026-09-03, sobre la misma pregunta 2: el proveedor tiene
que quedar preparado para intercambiarse** —se valorarán también familias como
Kimi o Qwen, no solo las dos obvias—. **No es una elección y no amplía el
alcance**: la elección sigue aplazada. Lo que cambia son dos cosas, y la segunda
es la que no se ve:

- **Diseño.** La llamada va detrás de un **puerto** (`src/bot/llm.ts`) con un
  adaptador por proveedor (`src/bot/models/`). Se quedan de este lado, y no se
  mueven: el constructor del prompt, el esquema zod (RN-09), el archivado de la
  respuesta cruda (RN-10) y la frontera ADR-016 de quién puede llamar. **ADR-022
  §6 reescrito** —dejaba fijado «Anthropic» como proveedor, que contradecía el
  aplazamiento— y **CA-5 crece con los subpuntos 9 y 10**. La decisión previa de
  «cliente delgado sin SDK» empujaba en esa dirección pero **no era una
  frontera**; ahora se exige y es comprobable.
- **Legal, y con letra grande. ADR-023 §3 ter, nuevo.** El puerto abarata el
  cambio **en código y solo en código**. El dictamen analizó **un** proveedor y
  ese análisis **no se hereda**: cada candidato reabre contrato de encargado, base
  de la transferencia, retención del subencargado y si entrena con el contenido.
  Kimi (Moonshot) y Qwen (Alibaba) son chinos y **China no tiene decisión de
  adecuación**, así que no hay art. 45: art. 46 más **evaluación de impacto de la
  transferencia**, sobre texto libre con datos de terceros y posiblemente de
  salud. **Materialmente más duro, no equivalente.** La única variante que
  simplifica es **pesos abiertos en infraestructura propia o europea**, que
  elimina transferencia y encargo enteros; queda **nombrada como opción a
  evaluar primero**, con la cautela escrita de que **no se ha comprobado nada** de
  su disponibilidad ni de su licencia. §7 pasa de cuatro a **cinco** puntos de
  revisión profesional.

**Sobre la 2, y por qué generó texto nuevo en vez de una línea.** La respuesta
literal fue: *«no estoy seguro, y el principal motivo es el precio. si puedo usar
mi suscripción, sin duda anthropic, si tengo que ir por api, tengo que analizarlo
bien, lo veremos cuando toque la implementación»*. El aplazamiento es legítimo y
la spec ya estaba escrita sin fijar proveedor, así que **el aplazamiento no
cambia nada**. Lo que sí había que corregir es la **premisa**: una suscripción de
consumo no habilita llamadas programáticas desde un servidor desplegado, así que
la disyuntiva «suscripción contra API» no existe —para este bot solo hay API— y
el precio, medido, es de céntimos por jornada. Quedó escrito en **ADR-023 §3
bis** y no en una nota de coste **por una razón que no es de domicilio sino de
consecuencia**: quien crea que va por suscripción creerá también que no hay nada
que contratar, y de ahí se salta el art. 28. La premisa falsa tenía una
consecuencia jurídica, así que vive en el ADR que gobierna el encargo del
tratamiento.

**Sobre la 3, lo que abrió.** Decidir una sola forma desalinea las **siete**
apariciones de *Directo* en `docs/diseno/` (medidas, no heredadas del dictamen,
que decía cinco). **EPIC-004 está congelada y no se
toca**: entrada de inventario en EPIC-MEJORA con disparador escrito —el día que
se construya la interfaz del marcador—. Destino EPIC-MEJORA y no EPIC-004 por su
forma: es un hallazgo con disparador, que es exactamente lo que ese bucket
inventaría, y anotarlo en una épica congelada sería descongelarla para escribir
una fila.

## Dictámenes de dominio — anotados, con la regla dura cumplida

`sdd-lingua` y `sdd-legal-datos` dictaminaron sobre SPEC-015 el **2026-09-02**.
Los dos llevan la regla dura del rol consultivo: **el dictamen tiene que quedar
por escrito en la spec o en su ledger**. Está cumplida, y no con un resumen:

> **`docs/epicas/EPIC-002-instrumentacion-de-las-cuatro-cifras/dictamenes-SPEC-015.md`**
> — los dos informes **enteros y literales**, con sus fuentes y sus fechas de
> consulta.

**No se vuelven a pedir.** El único disparador para re-consultar está escrito en
ADR-023 (*Consecuencias*): que entre fútbol base —menores— en los partes de
corresponsal.

**Dónde aterrizó cada dictamen** (índice para el verificador, no sustituto del
texto):

| Punto del dictamen | Dónde vive ahora |
|---|---|
| legal §1 — clasificación por poder identificador | ADR-022 §3; SPEC-015 CA-3.1, CA-3.2 |
| legal §2 — RN-10 con update **redactado**, y por qué NO es lo que ADR-009 rechazó | ADR-022 §3 (párrafo entero, deliberadamente literal); CA-3.4 |
| legal §2 — el hueco de retención sin dueño | **ADR-023** completo; precondición, no follow-up (precedente ADR-008 §5.3) |
| legal §2 — la clave raw sin `competition_id` conocido | ADR-022 §3, resuelto con lista cerrada de tipos de evento; CA-4.4 |
| legal §3 — el LLM como encargado del tratamiento | ADR-023 §3; CA-5.4, CA-5.5, CA-5.8 |
| legal §3 — el tipo de entrada que no puede llevar identidad | ADR-022 §6; CA-5.1, CA-5.2 |
| legal §3.5 — ¿se archiva la respuesta del LLM? | **Sí**, decidido explícitamente: ADR-022 §3; CA-4.1, CA-4.3 |
| legal §4 — base jurídica, y el choque consentimiento ⇄ RN-13 | ADR-023 §4; CA-14.7 (ningún botón de consentimiento) |
| legal §4 — el responsable y ADR-012 | ADR-023 §5; SPEC-015 *Fuera de alcance*; nota §5 del gate |
| legal §4 — qué dice el bot y cuándo | ADR-023 §5; CA-14 entero |
| legal §5 — `correspondent_id` declarado, no `telegram_user_id` ni hash | ADR-022 §2; CA-2.8, CA-8.5, CA-10 |
| legal §5 — `Observation.source` sigue siendo `corresponsal` | ADR-022 §2; CA-8.1, con el caso que mide el fallo cerrado |
| legal §5 — un solo domicilio para el `correspondent_id` | ADR-022 §2 y §4; CA-10 entero |
| legal §6 — lista cerrada, y el rechazado que no deja rastro | CA-2.1, CA-2.2 |
| legal §6 — el mapeo no se versiona jamás (ADR-009 §3 citado) | ADR-022 §2; CA-2.5, CA-10.4 |
| legal §7.a — el texto libre no llega a lo publicado | CA-9.5 |
| legal §7.d — `secret_token` y rechazo antes de archivar | ADR-022 §1; CA-1 |
| legal §7.e — dos eventos entrantes, y los objetos colgantes | ADR-022 §3; CA-4.3 |
| legal §7.i — deriva de finalidad hacia D-7 | ADR-023 *Consecuencias*, destino EPIC-MEJORA |
| lingua §1 — registro: tuteo, imperativo, sin emoji decorativo | CA-7.6, CA-12; nota §7 del gate |
| lingua §2 — juego de comandos, y **no `/estado`** | CA-12.4 |
| lingua §3 — espacio de nombres `bot`, contrato compartido | CA-12.1, CA-12.2 |
| lingua §3 — la lengua **nunca** del `language_code` | ADR-022 §8; CA-11 entero |
| lingua §4.2 — los cinco estados no están en `dominio.md` | nota §3 del gate; CA-12.5 |
| lingua §4.2 — *En xogo* / *Directo* | nota §3 del gate: **firma humana** |
| lingua §4.4 — el hueco de `qualifiers` en `es.ts` | *Fuera de alcance* + nota §4: destino spec del marcador |
| lingua §5 — trampas del galego (pronombres, `estar a`, hipergaleguismos) | material del implementador al escribir el bundle; el dictamen es la referencia |

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 | `src/bot/webhook.ts` (`telegramWebhookHandler`, `constantTimeEquals`), `src/bot/telegram.ts` (`webhookBody`), `src/app/api/telegram/webhook/route.ts` | `tests/bot/webhook.test.ts` 1–8; `tests/bot/frontier.test.ts` 40–42; `tests/bot/observation.test.ts` 14–16 | | 🚧 |
| CA-2 | `src/bot/correspondents.ts`, `src/bot/catalog.ts`, `corresponsais/2026-27.json`, `migrations/0007` (`bot_rejections`), `src/db/bot.ts` (`PostgresRejectionCounter`) | `tests/bot/frontier.test.ts` 1–13; `tests/bot/correspondents.test.ts` 1–12; `tests/bot/webhook.test.ts` 9–12; `tests/db/bot-schema.test.ts` 4–7, 10 | | 🚧 |
| CA-3 | `src/bot/redact.ts` (`ARCHIVED_KEYS`, `redact`, `keyPaths`) | `tests/bot/redact.test.ts` 1–13; `tests/fixtures/telegram.ts` | | 🚧 |
| CA-4 | `src/bot/archive.ts` (`ARCHIVE_EVENT_KINDS`, `archiveThenParse`), `src/bot/webhook.ts` | `tests/bot/webhook.test.ts` 16–22; `tests/db/bot-flow.test.ts` 5 | | 🚧 |
| CA-5 | `src/bot/llm.ts` (puerto), `src/bot/prompt.ts`, `src/bot/proposal.ts`. **`src/bot/models/` NO existe** (precondición ADR-023 §6.4) | `tests/bot/webhook.test.ts` 23–28; `tests/bot/frontier.test.ts` 14–20; `tests/bot/observation.test.ts` 9–10; `tests/types/spec015-bot.test-d.ts` | | ⚠️ |
| CA-6 | `src/bot/candidates.ts`, `src/bot/windows.ts`, `src/bot/proposal.ts`, `src/bot/card.ts` | `tests/bot/candidates.test.ts` 1–12; `tests/bot/webhook.test.ts` 29–32; `tests/bot/frontier.test.ts` 21–23 | | 🚧 |
| CA-7 | `src/bot/webhook.ts` (`onCallback`), `src/bot/card.ts`, `src/bot/ports.ts`, `src/db/bot.ts` | **`tests/db/bot-flow.test.ts` 1** (contra Postgres); `tests/bot/webhook.test.ts` 33–39 | | 🚧 |
| CA-8 | `src/bot/observation.ts` | `tests/bot/observation.test.ts` 1–6; `tests/db/bot-flow.test.ts` 2–7; `tests/bot/candidates.test.ts` 11–12 | | 🚧 |
| CA-9 | `src/decide/engine-entry.ts` (`runEngineForMatch`), `src/bot/webhook.ts` (`runEngine`) | `tests/bot/observation.test.ts` 7–8, 8b–8c; `tests/bot/frontier.test.ts` 24–26; `tests/db/bot-flow.test.ts` 8–10; `tests/types/spec015-bot.test-d.ts`; `tests/decide/rn08-frontier.test.ts` (suite cerrada, pasa) | | 🚧 |
| CA-10 | `migrations/0007`, `src/db/bot.ts`, `.env.example` | `tests/db/bot-schema.test.ts` 8–11; `tests/db/bot-flow.test.ts` 11–13; `tests/bot/frontier.test.ts` 27–30 | | 🚧 |
| CA-11 | `src/i18n/bot.ts` (`DEFAULT_BOT_LOCALE`), `src/bot/webhook.ts`, `migrations/0007` (`correspondent_state.locale`) | `tests/bot/webhook.test.ts` 40–43; `tests/bot/frontier.test.ts` 31–33; `tests/bot/i18n.test.ts` 19 | | 🚧 |
| CA-12 | `src/i18n/bot-bundle.ts`, `src/i18n/bot.ts`, `src/i18n/statuses-bundle.ts`, `src/i18n/statuses.ts`, `src/i18n/gl.ts`, `src/i18n/es.ts`, `src/bot/commands.ts`, `src/bot/telegram.ts` | `tests/bot/i18n.test.ts` 1–18; `tests/bot/frontier.test.ts` 34–39; `tests/bot/observation.test.ts` 11–13; `tests/types/spec015-bot.test-d.ts` | | 🚧 |
| CA-13 | `src/bot/candidates.ts` (`matchdayIsOpen`), `src/ingest/measurement.ts` (lista vacía, sin tocar) | `tests/bot/webhook.test.ts` 13–15; `tests/bot/candidates.test.ts` 7–9, 9b–9c | | 🚧 |
| CA-14 | `src/i18n/bot-bundle.ts` (claves `notice*`), `src/bot/webhook.ts` (`noticeText`, `/baixa`), `migrations/0007` (`notice_sent_at`, `opted_out_at`) | `tests/bot/webhook.test.ts` 44–51 | | 🚧 |
| CA-15 | `migrations/0007` | Salidas literales abajo; `tests/db/bot-schema.test.ts` 1–3 | | 🚧 |

## CA-5: qué quedó hecho, qué falta, y por qué

**La precondición está escrita en el propio criterio y en ADR-023 §6.4: sin
proveedor de LLM elegido y sin DPA guardado y fechado en `docs/legal/`, el
adaptador no se escribe.** `docs/legal/` no existe todavía (F-SPEC-015-6). No se
escribe un cliente contra un proveedor sin contrato de encargado del
tratamiento, aunque el código fuese idéntico.

**Hecho, y probado contra un doble del modelo:**

| Subpunto | Estado | Dónde |
|---|---|---|
| 5.1 — el tipo de entrada no puede llevar identidad | ✅ | `src/bot/prompt.ts`; `tests/types/spec015-bot.test-d.ts` |
| 5.2 — fuga sobre el prompt RENDERIZADO | ✅ | `tests/bot/webhook.test.ts` 23 |
| 5.3 — ni prompt ni esquema nombran a una persona | ✅ | `tests/bot/webhook.test.ts` 24 |
| 5.4 — frontera `LLM_CALLERS`, complemento vacío + control positivo | ✅ | `tests/bot/support/frontier.ts`; `tests/bot/frontier.test.ts` 14–17 |
| 5.5 — la entrada en la lista de lo permitido de SALIDA | ❌ | **No procede todavía: no hay cliente que declarar.** Ver abajo |
| 5.6 — las cinco formas de rechazo | ✅ | `src/bot/proposal.ts`; `tests/bot/webhook.test.ts` 26 (×5), 27, 28 |
| 5.7 — el identificador del modelo, solo en su adaptador | ✅ (en su forma más fuerte) | `tests/bot/frontier.test.ts` 20: **ningún** fichero del dominio contiene nada con forma de identificador de modelo |
| 5.8 — residuo declarado | ✅ | `tests/bot/webhook.test.ts` 25; cabecera de `src/bot/prompt.ts` |
| 5.9 — el resto del bot compone contra el PUERTO | ✅ | `src/bot/llm.ts`; `tests/bot/observation.test.ts` 9–10. **La prueba es la suite entera**: los catorce criterios corren con un doble del modelo |
| 5.10 — ninguna forma propietaria cruza, con control positivo | ✅ | `tests/bot/frontier.test.ts` 18–19 |

**Lo único que falta es `src/bot/models/<proveedor>.ts`**: el cliente delgado
que hace un `POST` con cuerpo JSON. Y con él, dos cosas más que hoy no se pueden
hacer sin él:

1. **CA-5.5**, la entrada en la lista de lo permitido de salida
   (`ALLOWED_PACKAGES` / `ALLOWED_GLOBALS` de `tests/polite/support/capability.ts`)
   **con su motivo escrito y visible en el diff**. Hoy no hay ninguna llamada de
   salida que declarar, así que declararla sería declarar una capacidad que
   nadie ejerce — exactamente lo contrario de lo que ADR-016 pide.
2. **CA-5.7 en su forma literal** —«el identificador del modelo vive en una
   constante nombrada dentro de su adaptador»—, que hoy se afirma en su forma
   más fuerte: no vive en ningún sitio.

**Y una advertencia que hay que repetir aquí porque el puerto engaña**
(ADR-023 §3 ter, F-SPEC-015-11): escribir ese adaptador es un fichero **en
código y solo en código**. Cada proveedor candidato reabre entero el análisis
del §3 —contrato de encargado, base de la transferencia, retención del
subencargado, y si entrena con el contenido— y **ninguna de esas respuestas
viaja con el adaptador**.

## Decisiones tomadas donde la spec dejaba margen

Cinco, todas con su razón, para que el verificador no tenga que reconstruirlas.

**1. El puerto del modelo recibe el PROMPT RENDERIZADO, no `{ text, candidates }`.**
ADR-022 §6 esboza «entra el texto y los candidatos, sale una propuesta ya
validada o un rechazo», y la firma implementada es
`propose(prompt: string): Promise<ModelAnswer>` con `ModelAnswer` en bytes. Lo
decide **CA-4.1**: exige afirmar que *«el `put` del mensaje termina antes de que
`buildPrompt` sea llamado»* y que *«el `put` de la respuesta del LLM [ocurre]
antes de que se valide con zod»*, y un orden solo se puede afirmar sobre
llamadas que hace el dominio. Si el adaptador construyese el prompt y validase
la salida, las dos mitades del orden serían inafirmables. Además es lo que el
propio ADR-022 §6 quiere: de las cuatro cosas que «se quedan de este lado», dos
son el constructor del prompt y el archivado de la respuesta cruda. Está escrito
en la cabecera de `src/bot/llm.ts`.

**2. `bot_proposals.match_id` es NULO mientras la identidad la decide la
persona.** CA-6.4 pide que «más de un candidato plausible ⇒ la persona elige en
un teclado con los nombres canónicos, y hasta que elige no hay `Observation`».
Para que ese teclado lleve a algún sitio hay que guardar lo que el modelo sí
entendió —marcador, minuto, estado— sin partido. La alternativa era no guardar
nada y pedirle a la persona que reescriba, que cumple la letra y tira su
trabajo. `ProposalStore` gana `pick()`; la `Observation` sigue siendo imposible
sin `match_id`, y el tipo lo impone (`ConfirmedProposal`).

**3. `/parar` hace lo mismo que `/baixa`.** El dictamen de `sdd-lingua` §2 los
trae como dos comandos y describe `/parar` como «deixar de recibir avisos». El
bot **no empuja nada a nadie** —las notificaciones están fuera de alcance por
nombre—, así que el único «aviso» que puede dejar de mandar es su propia
respuesta. Hacer que `/parar` prometiera otra cosa sería prometer lo que el
sistema no hace, que es el mismo fallo que CA-14.6 prohíbe en el acuse de la
baja.

**4. `src/bot/telegram.ts` contesta POR EL CUERPO DE LA RESPUESTA del webhook, y
el adaptador de grammY queda diferido.** Es la decisión más consecuente de las
cinco y está entera en la cabecera del módulo. Telegram permite contestar al
propio `POST` con la llamada al método en el cuerpo, y ese camino **no necesita
ninguna capacidad de salida nueva**. Importar `grammy` sí: sería una entrada
nueva en `ALLOWED_PACKAGES` cuyo trabajo es *pedirle bytes a un tercero*, y la
cabecera de esa lista dice que eso **necesita firma humana** — y CA-15.3 prevé
**una** entrada nueva en esa lista, atada a un criterio que está aplazado
(CA-5.5). Un implementador no toma esa firma. Lo que sí se entrega es el
**puerto** `TelegramApi` contra el que todo compone, y el payload de
`setMyCommands` construido desde el bundle (CA-12.3). **F-SPEC-015-13.**

**5. Las dos plantillas estructurales de la tarjeta —`{label}: {value}` y
`{home} - {away}`— viven en `src/i18n/bot.ts`, fuera de `BotBundle`.** No son
texto en ninguna lengua —el dictamen escribe `cardMatch` como literalmente
`{home} - {away}` en las dos—, y meterlas en el contrato obligaría al caso de
paridad de CA-12.1 a declarar dos claves como legítimamente idénticas. Fuera del
módulo de i18n harían falta un `as`, que es el único hueco que CA-12.2 existe
para cerrar.

## Los tres gates — salidas literales del 2026-09-03

```
$ npm run lint

> marcador@0.0.1 lint
> oxlint --type-aware

EXIT=0
```

```
$ npm test

 RUN  v4.1.11 /Users/albertofojo/src/tremen-dev/marcador.gal/.claude/worktrees/spec-015

 Test Files  122 passed (122)
      Tests  1294 passed (1294)
Type Errors  no errors
```

```
$ npm run test:db

 RUN  v4.1.11 /Users/albertofojo/src/tremen-dev/marcador.gal/.claude/worktrees/spec-015

 Test Files  24 passed (24)
      Tests  300 passed (300)
```

`npx tsc --noEmit` sale limpio (CA-15.1).

### El recuento, fichero a fichero: NINGÚN FICHERO DE TEST PREVIO CAMBIA

Medido con el reportero JSON de vitest sobre `eaae265` (la rama antes de esta
spec) y sobre `HEAD`, comparando el número de casos **por fichero**:

| | Ficheros | Casos |
|---|---|---|
| `npm test` antes | 114 | 1117 |
| `npm test` ahora | 122 | 1294 |
| `npm run test:db` antes | 22 | 276 |
| `npm run test:db` ahora | 24 | 300 |

- **Ficheros previos con recuento cambiado: NINGUNO.**
- **Ficheros previos desaparecidos: NINGUNO.**
- Ficheros nuevos en `npm test` (8): `tests/bot/webhook.test.ts` 55,
  `tests/bot/frontier.test.ts` 42, `tests/bot/i18n.test.ts` 19,
  `tests/bot/candidates.test.ts` 18, `tests/bot/observation.test.ts` 18,
  `tests/bot/redact.test.ts` 13, `tests/bot/correspondents.test.ts` 12,
  `tests/types/spec015-bot.test-d.ts` (typecheck, 0 casos de ejecución).
  Suman **177**, que es exactamente 1294 − 1117.
- Ficheros nuevos en `npm run test:db` (2): `tests/db/bot-flow.test.ts` 13 y
  `tests/db/bot-schema.test.ts` 11. Suman **24**, que es 300 − 276.

### CA-15.3 — las desviaciones en suites cerradas, y son TRES

CA-15.3 prevé **dos**. Hay una tercera, forzada por un guardián existente, y se
declara aquí en vez de esconderla:

1. **`tests/db/decide-cycle.test.ts`** — `migrations/0007` en la aserción que
   enumera migraciones. **Prevista.** El propio caso de SPEC-013 dejó escrito
   que heredaría esta enmienda «el día de `0007`». La aserción sigue enumerando
   todo lo que hay en disco, así que sigue sin poder pasar descubriendo nada.
2. **`tests/decide/rn08-frontier.test.ts` caso 10** — `src/decide/engine-entry.ts`
   en la aserción **derivada** de qué ficheros cruzan un nombre con capacidad.
   **No prevista literalmente por CA-15.3, y no es relajación**: la lista de
   módulos con capacidad (`DECISION_WRITERS`) **no se toca**, porque
   `src/decide/` ya estaba dentro. Lo que crece es la enumeración de quién la
   cruza — es decir, el propio control positivo midiendo un fichero nuevo. El
   precedente de cómo se enmienda una aserción derivada es **F-SPEC-011-1**, y
   el motivo está escrito en el mismo diff.
3. **`tests/polite/support/capability.ts`** — `ENTRY_POINTS` gana
   `src/app/api/telegram/webhook/route.ts`. **Obligada por el guardián**: el
   caso 17 de `architecture.test.ts` exige que `ENTRY_POINTS` nombre **todas**
   las rutas de `src/app/`, así que una ruta nueva sin entrada es roja. Es
   crecimiento de una lista declarada con su motivo escrito, exactamente como
   SPEC-012 hizo con la ruta del cron. Ninguna aserción cambia.

**Ninguna otra suite cerrada se ha tocado.** Las de SPEC-008, SPEC-009,
SPEC-010, SPEC-011 y SPEC-012 pasan sin una sola modificación.

### F-SPEC-013-10 confirmado y MEDIDO: la carrera es previa a esta spec

`npm test` es **intermitente en la rama base**, sin una sola línea de SPEC-015:
medido el 2026-09-03, **1 de cada 6 ejecuciones** sobre `eaae265`. La causa son
los controles positivos de `tests/polite/architecture.test.ts`, que **escriben
ficheros y directorios reales bajo `src/`** y los borran después, mientras
vitest corre los ficheros de test en paralelo; cualquier suite que enumere
`src/` puede listar uno y encontrárselo borrado al leerlo (`ENOENT`).

Lo que se hizo, y lo que no:

- **Mis suites están endurecidas**: `scanned()` (`tests/bot/support/frontier.ts`)
  reintenta el **escaneo entero** ante un `ENOENT`, hasta cinco veces, y
  propaga si no lo consigue. No perdona un fichero: reintenta la foto. Con eso,
  `tests/bot/` no ha fallado en **más de veinte ejecuciones seguidas**.
- **Las suites que siguen fallando son previas y no son mías**:
  `tests/site/title-source.test.ts` y `tests/site/contact.test.ts`, las dos de
  specs cerradas (SPEC-004, SPEC-006), y las dos por la misma carrera.
  **Tocarlas sería tocar specs cerradas sin causa propia.**
- **Consecuencia práctica para el verificador**: si `npm test` falla enumerando
  `src/` con un `ENOENT` sobre algo llamado `hidden-control`, `vprobe`,
  `refusal-control-tree` o parecido, **es esto**. Vuelve a correrlo. Está
  inventariado en EPIC-MEJORA (F-SPEC-013-10) y anticipado por F-SPEC-015-7.

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-015/. Informe HTML opcional: _qa/SPEC-015/informe.html -->

Nota: el bot no tiene interfaz web. La evidencia visual útil aquí es la
**conversación real** —mensaje, tarjeta, botón, acuse— en las dos lenguas, y
tiene un problema de método: correrla contra Telegram real exige un bot
registrado, un secreto y un corresponsal mapeado, es decir **encender el bot**,
que tiene seis precondiciones fuera del código (ADR-023 §6). Mientras no estén,
la evidencia es la de los dobles. **Que el verificador lo diga así en su
veredicto y no lo dé por visto.**

## Salvedades / follow-ups
<!-- IDs F-SPEC-015-1, F-SPEC-015-2… con destino (spec futura o EPIC-MEJORA). -->

Abiertas ya al escribir la spec, para que nadie las descubra a mitad:

- **F-SPEC-015-1 — El disparador de F-SPEC-013-11 llega con esta spec y se
  contesta sin cerrarlo.** El bot necesita llamar al motor y `composeCyclePorts`
  le entregaría la capacidad de escribir `Decision` pasando los tres gates.
  SPEC-015 lo esquiva con una puerta estrecha nueva en `src/decide/` (CA-9), lo
  que resuelve **este** llamante. **El residuo sigue abierto**:
  `composeCyclePorts` es superficie pública. **Destino: EPIC-MEJORA**;
  **disparador actualizado: la próxima spec que ya tenga que tocar
  `src/decide/cycle.ts` por otro motivo.**
- **F-SPEC-015-2 — El segundo segmento de la clave del raw store no es una
  competición en el archivo del corresponsal.** Lleva el tipo de evento, porque
  la competición no se conoce antes de parsear (ADR-022 §3, CA-4.4). Es una
  irregularidad declarada, no un descuido; quien lea claves bajo `corresponsal/`
  tiene que conocerla. **Destino: EPIC-MEJORA**; **disparador: la primera spec
  que necesite consultar el raw store por competición de forma uniforme.**
- **F-SPEC-015-3 — El catálogo de corresponsales se aparta de la forma de
  ADR-018**: es un módulo JSON importado, sin CLI, sin tabla y sin registro de
  carga. Con un corresponsal el precio es un despliegue para dar de alta o de
  baja (la baja inmediata sí es una fila). **Destino: darle la forma de ADR-018**;
  **disparador: el segundo corresponsal.**
- **F-SPEC-015-4 — El art. 17 es un acto manual del operador, no una operación
  ejecutable**, porque el mapeo vive en entorno. Tiene ceremonia escrita (ADR-023
  §4). **Destino: revisar la decisión**; **disparador: más de tres corresponsales,
  o el primero que no sea el autor.**
- **F-SPEC-015-5 — Seis precondiciones fuera del código** (ADR-023 §6): la página
  `/privacidade` en las dos lenguas, el RAT del art. 30, la ponderación de interés
  legítimo, la copia fechada del DPA, el «no procede» de la EIPD, y la fecha de
  purga escrita antes de la primera jornada. **Ninguna la puede escribir un rol
  `sdd-*`.** **Bloquean encender el bot, no aprobar la spec.**
- **F-SPEC-015-9 — El literal *Directo* de `docs/diseno/` queda desalineado.**
  El gate decidió el 2026-09-03 que `live` es **En xogo** siempre; el sistema de
  diseño usa *Directo* como etiqueta de filtro en cinco ficheros y **EPIC-004
  está congelada**, así que no se tocan. **Destino: EPIC-MEJORA** (ya
  inventariado); **disparador: el día que se construya la interfaz del
  marcador.**
- **F-SPEC-015-10 — CA-5 tiene una precondición que ningún otro criterio tiene.**
  Sin proveedor de LLM elegido y sin DPA guardado y fechado, **no se implementa**
  (ADR-023 §6.4). Los otros catorce avanzan. **No es deuda: es orden de trabajo**,
  y está escrito para que el implementador no se bloquee entero por un criterio.
  **Disparador: antes de la primera línea de `src/bot/llm.ts`.**
- **F-SPEC-015-11 — El puerto del modelo abarata el código y no el derecho, y
  eso engaña.** Un implementador que vea `src/bot/llm.ts` limpio y dos adaptadores
  asumirá que cambiar de proveedor es configuración. **No lo es** (ADR-023 §3
  ter): cada candidato reabre el análisis legal entero, y para un proveedor de un
  país sin decisión de adecuación hace falta además una evaluación de impacto de
  la transferencia. **No es deuda: es una advertencia que tiene que sobrevivir en
  el ADR**, y por eso está ahí y no en un comentario. **Disparador: el segundo
  adaptador de `src/bot/models/`.**
- **F-SPEC-015-12 — La vía de pesos abiertos está nombrada y sin comprobar.**
  ADR-023 §3 ter dice que un modelo de pesos abiertos en infraestructura propia o
  europea elimina la transferencia internacional y el encargo enteros, y que
  conviene analizarla **primero** si el criterio es el coste. **No se ha
  verificado** disponibilidad de pesos, condiciones de licencia, ni si la licencia
  permite este uso, ni qué haría falta para ejecutarlo — y la spec no afirma nada
  de eso. **Destino: el análisis de proveedor**; **disparador: cuando se abra ese
  análisis, antes que las vías con transferencia.**
- **F-SPEC-015-6 — `docs/legal/` no existe todavía.** Lo crea la primera de las
  seis precondiciones que se escriba.

Abiertas al implementar (2026-09-03):

- **F-SPEC-015-13 — El adaptador de grammY queda diferido, y con él todo lo que
  el bot querría MANDAR fuera de una respuesta al webhook.** `src/bot/telegram.ts`
  entrega el **puerto** `TelegramApi` y contesta por el cuerpo de la respuesta
  del webhook, que es un camino real de Telegram y **no necesita ninguna
  capacidad de salida nueva**. Importar `grammy` sí la necesita: sería una
  entrada nueva en `ALLOWED_PACKAGES` cuyo trabajo es pedirle bytes a un
  tercero, y la cabecera de esa lista dice que eso **exige firma humana**;
  además CA-15.3 prevé **una sola** entrada nueva en esa lista, atada a CA-5.5,
  que está aplazado. Lo que hoy NO se puede hacer sin el adaptador: registrar
  `setMyCommands` y la ficha del bot en Telegram (el payload sí se construye
  desde el bundle y está probado, CA-12.3), y mandar más de un mensaje por
  update. **Destino: la misma firma humana que CA-5.5**; **disparador: antes de
  encender el bot, junto con el adaptador del modelo.**
- **F-SPEC-015-14 — El catálogo de corresponsales se lee del disco en tiempo de
  ejecución.** `src/bot/catalog.ts` usa `readFile` sobre
  `corresponsais/<temporada>.json`, con el mismo patrón que `src/db/migrate.ts`.
  Vercel traza esos ficheros por análisis estático y `new URL(..., import.meta.url)`
  no siempre se traza. **No se ha comprobado en un despliegue real**, porque el
  bot no se puede encender todavía. **Destino: la ceremonia de encendido**;
  **disparador: la primera jornada declarada con el bot encendido** — si el
  fichero no llegase al bundle, `loadCatalog` lanza y el webhook devuelve 500,
  que es fallo cerrado y visible, no silencioso.
- **F-SPEC-015-15 — La caducidad de una propuesta solo se cobra cuando alguien
  vuelve a hablar.** `removeExpired` corre dentro del camino del callback; no
  hay barrido periódico, porque no hay proceso vivo (ADR-004) y añadir trabajo
  al cron del tick está fuera de los CA. Con un corresponsal el coste es una
  fila muerta de kilobytes hasta el siguiente callback. **Destino: la spec que
  toque el tick por otro motivo**; **disparador: más de un corresponsal, o la
  primera jornada con propuestas sin resolver al cierre.**
- **F-SPEC-015-7 — La carrera de F-SPEC-013-10 sigue viva, y ahora está
  MEDIDA.** 1 de cada 6 ejecuciones de `npm test` **en la rama base**, sin una
  línea de esta spec (2026-09-03). Las suites de SPEC-015 están endurecidas
  —`scanned()` reintenta el escaneo entero, sin perdonar ningún fichero— y no
  han fallado en más de veinte ejecuciones seguidas. Las que siguen cayendo son
  `tests/site/title-source.test.ts` y `tests/site/contact.test.ts`, de specs
  **cerradas**, y arreglarlas sería tocarlas sin causa propia. **Destino:
  EPIC-MEJORA** (ya inventariado); **disparador: la primera spec que tenga que
  tocar `tests/polite/architecture.test.ts` o `tests/site/` por otro motivo.**
  Detalle y reproducción en la sección de los gates.
- **F-SPEC-015-8 — La rama de Neon de `DATABASE_URL_TEST` se comparte entre
  worktrees** (F-SPEC-010-7) y hay otra sesión trabajando en el checkout
  principal. Comprobar `ps aux | grep vitest` antes de correr `npm run test:db`;
  un `ENOTFOUND` del *pooler* es el de F-SPEC-013-6 y se resuelve con el endpoint
  directo.

## Para el verificador

1. **Los tres comandos**: `npm run lint`, `npm test`, `npm run test:db` (este
   último con `DATABASE_URL_TEST`; sin él, CA-2, CA-3, CA-7, CA-8, CA-9, CA-10,
   CA-11 y CA-13 son **UNMET, no *skipped***).
2. **El centro del trabajo son cinco fronteras de capacidad** —CA-2, CA-3, CA-5,
   CA-9 y CA-10—, todas en la forma de ADR-016. Para cada una: apagar **cada**
   mecanismo y ver el rojo en un caso **nombrado**; comprobar que no hay ninguna
   exención por nombre de fichero; y **leer el residuo declarado dentro del
   criterio**. Si un residuo falta o promete de más, es *finding* con destino
   `sdd-arquitecto`, **no** una corrección del test (ADR-016 §7).
3. **El criterio que más importa de toda la spec es CA-7.1**: antes del botón,
   `observations` no tiene ninguna fila. Es RN-09 y D-4 hechos comprobables.
   Verifícalo contra la base, no contra un doble.
4. **CA-15.3 permite exactamente dos desviaciones** en las suites cerradas —la
   entrada nueva en la lista de salida permitida y la migración 0007 en las
   aserciones que enumeran migraciones—, y las dos con motivo escrito en el mismo
   diff. **Cualquier otra es RED.** El precedente de cómo se enmienda una aserción
   derivada está en F-SPEC-011-1.
5. **Que ningún fichero versionado contenga un `telegram_user_id`** (CA-10.4). Es
   irreversible si se incumple, por el mismo motivo que ADR-009 §3: git no se
   purga, se reescribe.

## Cómo retomar (handoff)

**Estado real al 2026-09-03: catorce criterios implementados, CA-5 parcial por
su precondición. Los tres gates en verde.** La spec está en `en-revision`.

**Rama**: `ft/SPEC-015-bot-corresponsal`, worktree `.claude/worktrees/spec-015`.
Tres commits sobre `eaae265`:

| SHA | Qué trae |
|---|---|
| `a20e0b9` | i18n (`bot`, `statuses`), `src/bot/` entero, `src/decide/engine-entry.ts`, `migrations/0007`, `src/db/bot.ts`, la ruta del webhook |
| `222f57a` | las nueve suites, las cinco fronteras de ADR-016, y las tres desviaciones declaradas |
| `4840c75` | CA-13.3 y CA-9.6 con caso propio; `scanned()` endurecido contra F-SPEC-013-10 |

**Qué hace falta para correr los gates.** `npm ci` (el worktree nace sin
`node_modules`) y `.env.local` con `DATABASE_URL_TEST` — se copia del checkout
principal. **Comprueba `ps aux | grep vitest` antes de `npm run test:db`**: la
rama de Neon se comparte entre worktrees (F-SPEC-010-7, F-SPEC-015-8).

**Lo que queda por hacer, en orden:**

1. **La verificación.** `sdd-verificador` contra los quince criterios. El centro
   son las cinco fronteras de ADR-016 y **CA-7.1 contra la base**
   (`tests/db/bot-flow.test.ts` caso 1).
2. **`src/bot/models/<proveedor>.ts`** y con él CA-5.5 y CA-5.7 en su forma
   literal. **Bloqueado por ADR-023 §6.4**: proveedor elegido y DPA guardado y
   fechado en `docs/legal/`. Ver «CA-5: qué quedó hecho, qué falta».
3. **El adaptador de grammY** (F-SPEC-015-13), que necesita la misma firma
   humana sobre la lista de lo permitido de salida.
4. **Las seis precondiciones de ADR-023 §6** (F-SPEC-015-5). Ninguna la puede
   escribir un rol `sdd-*`, y **bloquean encender el bot, no verificar la spec**.

**Y lo que NO hace falta hacer, dicho para que nadie lo intente:** el bot no se
puede encender hoy, y esa es la entrega. Con la lista de jornadas vacía, el
catálogo vacío y el mapeo inexistente, un mensaje de cualquiera recibe una frase
neutra y deja cero archivo, cero filas y cero llamadas al modelo — y hay un caso
que lo afirma **como resultado esperado** (`tests/bot/webhook.test.ts` 13–14).
