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
| CA-1 | `src/bot/webhook.ts` (`telegramWebhookHandler`, `constantTimeEquals`), `src/bot/telegram.ts` (`webhookBody`), `src/app/api/telegram/webhook/route.ts` | `tests/bot/webhook.test.ts` 1–8; `tests/bot/frontier.test.ts` 40–42; `tests/bot/observation.test.ts` 14–16 | Los 8 casos corridos y leídos. 401 con secreto ausente y vacío deja **todos** los dobles sin llamar (`log.calls` vacío, `store.size` 0, `rejections.total` 0). La comparación es de tiempo constante escrita a mano y el caso 40 la afirma tras neutralizar `typeof secret`. `route.ts` resuelve a **un solo** módulo (`src/bot/webhook.ts`), verificado con el lector del compilador (caso 41). Sin `console.*` en `src/bot/`: comprobado con `grep`. | ✅ |
| CA-2 | `src/bot/correspondents.ts`, `src/bot/catalog.ts`, `corresponsais/2026-27.json`, `migrations/0007` (`bot_rejections`), `src/db/bot.ts` (`PostgresRejectionCounter`) | `tests/bot/frontier.test.ts` 1–13; `tests/bot/correspondents.test.ts` 1–12; `tests/bot/webhook.test.ts` 9–12; `tests/db/bot-schema.test.ts` 4–7, 10 | Los siete puntos leídos uno a uno. **Sonda propia P1**: `src/probe/map-reader.ts` con `process.env['TELEGRAM_CORRESPONDENTS']` → casos 3 y 6 en ROJO. El complemento se mide sobre el escaneo real (SCAN_ROOTS del compilador), no sobre una copia; el nombre vigilado sale del módulo (caso 2). Grafo de `correspondents.ts` = `['zod']`, y `catalog.ts` sí alcanza `node:fs/promises`: el mecanismo mide el grafo, no el texto. Esquema de `bot_rejections` leído de `information_schema`: tres columnas, `reason` atada a lista cerrada, sin `timestamptz`. | ✅ |
| CA-3 | `src/bot/redact.ts` (`ARCHIVED_KEYS`, `redact`, `keyPaths`) | `tests/bot/redact.test.ts` 1–13; **`tests/db/bot-flow.test.ts` 14–16** (la mitad contra la base, segunda vuelta); `tests/fixtures/telegram.ts` | Lista blanca **total** verificada: el objeto se construye copiando `ARCHIVED_KEYS`, no borrando. Control positivo real (caso 7: ensancha la lista y el nombre civil aparece). `message.text` verbatim con emoji, acentos y salto de línea. **PERO CA-3.2 está a medias**: no hay ningún caso que recorra `bot_proposals`, `correspondent_state`, `bot_rejections` y `observations` buscando las seis claves prohibidas. `FORBIDDEN_FIELDS` solo se usa en `tests/bot/redact.test.ts` 5, sobre el objeto archivado. Finding 2. | ⚠️ |
| CA-4 | `src/bot/archive.ts` (`ARCHIVE_EVENT_KINDS`, `archiveThenParse`), `src/bot/webhook.ts` | `tests/bot/webhook.test.ts` 16–22; `tests/db/bot-flow.test.ts` 5 | Orden verificado sobre el log de los dobles: `['put:mensaxe','model','put:proposta']`, exacto. Las tres claves bajo `corresponsal/` con segundo segmento de la lista cerrada y nunca un `competition_id`. Los dos colgantes se afirman como resultado esperado (`dangling.length === 2`, con su prefijo). Un LLM que devuelve basura deja igualmente el objeto del mensaje archivado y cero filas. | ✅ |
| CA-5 | `src/bot/llm.ts` (puerto), `src/bot/prompt.ts`, `src/bot/proposal.ts`. **`src/bot/models/` NO existe** (precondición ADR-023 §6.4) | `tests/bot/webhook.test.ts` 23–28; `tests/bot/frontier.test.ts` 14–20; `tests/bot/observation.test.ts` 9–10; `tests/types/spec015-bot.test-d.ts` | **Salvedad pre-aceptada por el gate (2026-09-03, ADR-023 §6.4): no hay proveedor ni DPA, así que `src/bot/models/` no existe.** Verificado lo que sí está: el tipo `PromptInput` cierra la puerta a la identidad (prueba invertida en `tests/types/spec015-bot.test-d.ts`, cubierta por `tsc --noEmit` y por el typecheck de vitest); fuga sobre el prompt renderizado; las cinco formas de rechazo, cada una con su caso y todas terminando en cero filas; el puerto sin adaptador falla cerrado. **Sonda propia P12**: al crear `src/bot/models/fake.ts` y un llamante fuera de la lista, los casos 14 y 15 pasan a ROJO — la frontera `LLM_CALLERS` sí muerde cuando hay algo que medir. **Residuo**: 5.5 (entrada en la lista de salida) y 5.7 en su forma literal quedan sin hacer, y con el directorio vacío el «complemento vacío» de 5.4 es hoy vacuo. Escrito dentro del criterio y en ADR-023 §6.4. | ⚠️ |
| CA-6 | `src/bot/candidates.ts`, `src/bot/windows.ts`, `src/bot/proposal.ts`, `src/bot/card.ts` | `tests/bot/candidates.test.ts` 1–12; `tests/bot/webhook.test.ts` 29–32; `tests/bot/frontier.test.ts` 21–23 | Los cuatro filtros afirmados por separado, cada uno con su partido que entra y el que no. Ventanas del corresponsal (180/240 min) distintas de las del tick y no importadas. **Sonda propia P2**: `src/bot/alias-leak.ts` importando `@/alias/resolver` → caso 23 en ROJO. Un `match_id` real de otra competición se rechaza; la tarjeta dice «UD Ourense - Celta B» y no lo que escribió la persona. | ✅ |
| CA-7 | `src/bot/webhook.ts` (`onCallback`), `src/bot/card.ts`, `src/bot/ports.ts`, `src/db/bot.ts` | **`tests/db/bot-flow.test.ts` 1** (contra Postgres); `tests/bot/webhook.test.ts` 33–39 | **El criterio central, verificado contra Postgres real** (`tests/db/bot-flow.test.ts` 1: tarjeta emitida, `bot_proposals`=1, `observations`=0, `decisions`=0). **Sonda propia P9**: inyecté un `observations.append` en `onContent`, justo tras crear la propuesta pendiente → caso 1 de `bot-flow` en ROJO contra la base y casos 33/34/36 en rojo en la suite de unidad. Descartar, caducar, confirmar algo ajeno y repetir el callback: ninguno escribe. Tarjeta con las cuatro etiquetas y estado con texto, sin un solo pictográfico. | ✅ |
| CA-8 | `src/bot/observation.ts` | `tests/bot/observation.test.ts` 1–6; `tests/db/bot-flow.test.ts` 2–7; `tests/bot/candidates.test.ts` 11–12 | `source` es exactamente `'corresponsal'` leído en la fila de Postgres, y `roleOf` no lanza; el caso hermano mide que `'corresponsal:01'` **sí** lanza. `confidence` = `RN01_WEIGHTS.correspondent` y el módulo no escribe `0.8` en ninguna parte fuera de comentarios. `raw_ref` es el del mensaje y el objeto existe en el store. Idempotencia comprobada con dos confirmaciones. Las cinco ramas, una por valor de `MATCH_STATUSES`. La mitad de esquema de 8.5 está en `bot-schema` 8, leyendo `information_schema`. | ✅ |
| CA-9 | `src/decide/engine-entry.ts` (`runEngineForMatch`), `src/bot/webhook.ts` (`runEngine`) | `tests/bot/observation.test.ts` 7–8, 8b–8c; `tests/bot/frontier.test.ts` 24–26; `tests/db/bot-flow.test.ts` 8–10; `tests/types/spec015-bot.test-d.ts`; `tests/decide/rn08-frontier.test.ts` (suite cerrada, pasa) | 9.2–9.6 verificados: el tipo de retorno no lleva almacén (prueba invertida), importación por nombre, `Decision` provisional escrita por el motor con la observación en `supporting_observation_ids`, y nada del texto en `decisions`. **Sondas propias**: P3 (`import * as` sobre `@/decide/engine-entry` en `src/bot/`) → caso 24 ROJO; P13 (`src/bot/decide-leak.ts` importando `PostgresDecisionStore`) → `tests/decide/rn08-frontier.test.ts` casos 3 y 10 ROJO: la frontera de RN-08 sigue mordiendo para `src/bot/`. **PERO 9.1 incumple su segunda mitad**: `tests/decide/rn08-frontier.test.ts` **sí** cambia una aserción en el diff (caso 10, la enumeración de quién cruza gana `src/decide/engine-entry.ts`). El criterio dice literalmente «pasa sin tocar una aserción. El verificador lo comprueba en el diff». Finding 1. | ❌ |
| CA-10 | `migrations/0007`, `src/db/bot.ts`, `.env.example` | `tests/db/bot-schema.test.ts` 8–11; `tests/db/bot-flow.test.ts` 11–13; **`tests/bot/frontier.test.ts` 27–32** y **`tests/bot/support/telegram-ids.ts`** (el árbol versionado entero, segunda vuelta) | 10.1–10.3 verificados contra la base: columnas enumeradas desde `information_schema`, `bot_proposals` vacía tras la jornada sintética (confirmada, descartada y caducada), y la cadena de RN-12 recorrida entera hasta el seudónimo dentro del objeto crudo. **Escaneo propio del árbol versionado entero** (`git ls-files`, regex de 9–12 dígitos): no hay ningún identificador de Telegram en el repositorio — la propiedad **es cierta**. **Pero el mecanismo es más estrecho que el criterio**: el caso 27 solo lee `corresponsais/2026-27.json`, `.env.example` y `tests/fixtures/`. **Sonda propia P14**: un id de 10 cifras escrito en `src/bot/notes.ts` versionado deja la suite en VERDE. Y el control positivo (caso 29) afirma sobre una constante del propio test, no sobre el escaneo. Finding 3. | ⚠️ |
| CA-11 | `src/i18n/bot.ts` (`DEFAULT_BOT_LOCALE`), `src/bot/webhook.ts`, `migrations/0007` (`correspondent_state.locale`) | `tests/bot/webhook.test.ts` 40–43; `tests/bot/frontier.test.ts` 31–33; `tests/bot/i18n.test.ts` 19 | Un update con `language_code: 'es'` recibe galego: el caso lleva la intención en el nombre. **Sonda propia P4**: `src/bot/lang-leak.ts` nombrando `language_code` → caso 31 ROJO. `/lingua` persiste en `correspondent_state` y el siguiente mensaje la sigue, ida y vuelta. Sin fila, `gl`. | ✅ |
| CA-12 | `src/i18n/bot-bundle.ts`, `src/i18n/bot.ts`, `src/i18n/statuses-bundle.ts`, `src/i18n/statuses.ts`, `src/i18n/gl.ts`, `src/i18n/es.ts`, `src/bot/commands.ts`, `src/bot/telegram.ts` | `tests/bot/i18n.test.ts` 1–18; `tests/bot/frontier.test.ts` 34–39; `tests/bot/observation.test.ts` 11–13; `tests/types/spec015-bot.test-d.ts` | **Sonda propia P6**: `src/bot/text-leak.ts` con `text: 'Confirmar'` → `npm run typecheck` falla con TS2322 (`string` no asignable a `BotText`). El mecanismo principal es el tipo y muerde. Paridad exacta de claves, ninguna vacía, y un caso que caza el bundle copiado. Comandos: los ocho del dictamen, sin acentos, sin `/estado`. Estados desde el espacio compartido, con los literales de `dominio.md`. Galego contrastado contra el dictamen §5: `estar a + infinitivo`, pronombre proclítico tras negación, `atopar`, `gol`, `ao`, `coma`/`como`, `a mensaxe` femenino, marcador `2-1`. **Salvedad**: 12.3 pide que las descripciones estén «registradas» en Telegram; hoy solo se construye el payload desde el bundle, porque el adaptador de grammY está diferido (F-SPEC-015-13) y el bot nace apagado. | ⚠️ |
| CA-13 | `src/bot/candidates.ts` (`matchdayIsOpen`), `src/ingest/measurement.ts` (lista vacía, sin tocar) | `tests/bot/webhook.test.ts` 13–15; `tests/bot/candidates.test.ts` 7–9, 9b–9c | **Sonda propia P8**: neutralicé la puerta de la jornada en `onContent` → casos 13 y 14 en ROJO. Con la lista de producción vacía: frase neutra, `list('')` vacío, cero propuestas, cero observaciones y `model.calls === 0`. Con jornada inyectada, el camino entero. `inMeasurementWindow` es la función heredada y no hay una segunda aritmética de intervalo en `src/bot/`. Nota: fuera de jornada sí crece el contador agregado `bot_rejections`, que es el mismo agregado sin persona que CA-2.1 sanciona. | ✅ |
| CA-14 | `src/i18n/bot-bundle.ts` (claves `notice*`), `src/bot/webhook.ts` (`noticeText`, `/baixa`), `migrations/0007` (`notice_sent_at`, `opted_out_at`) | `tests/bot/webhook.test.ts` 44–51 | Los nueve elementos del art. 13 comprobados clave a clave sobre el texto emitido; proveedor de IA, 30 y 90 días y el enlace a `/privacidade`. Un mensaje de contenido de quien nunca recibió el aviso no se procesa: cero archivo, cero propuestas, cero observaciones, cero llamadas al modelo. `/baixa` corta en el acto y el acuse dice lo que no se borra. Ningún teclado lleva botón de consentimiento. | ✅ |
| CA-15 | `migrations/0007` | Salidas literales abajo, y **las de la segunda vuelta al final del ledger**; `tests/db/bot-schema.test.ts` 1–3 | 15.1, 15.2 y 15.4 verificados por mí con salidas literales (abajo) y contraste fichero a fichero contra `eaae265`: **ningún fichero de test previo cambia de recuento y ninguno desaparece**, ni en `npm test` ni en `npm run test:db`. **15.3 incumplido**: hay **tres** desviaciones en suites cerradas y el criterio prevé **dos**. La tercera —la aserción del caso 10 de `tests/decide/rn08-frontier.test.ts`— no es relajación y está declarada en el ledger, pero el criterio dice «cualquier otra desviación es RED». Finding 1. | ❌ |

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

### RED — 2026-09-03, `sdd-verificador`

**Trece de los quince criterios en verde, uno con la salvedad que el gate ya
firmó (CA-5) y dos incumplidos por su letra (CA-9 y CA-15).** El trabajo es
sólido: los tres gates salen limpios, ningún fichero de test previo cambia de
recuento ni desaparece, y las cinco fronteras de ADR-016 muerden de verdad —lo
he comprobado escribiendo yo nueve sondas de evasión como ficheros reales bajo
`src/` y midiendo el rojo—. Lo que devuelve la spec no es una debilidad del
código: son **dos criterios cuya letra no se cumple** y **una mitad de CA-3 que
ningún caso afirma**.

**Lo que NO es este RED.** No he encontrado ni un test previo debilitado, ni una
frontera evadible que el guardián no cace, ni un identificador de Telegram en el
árbol versionado, ni una fila en `observations` antes del botón. Los tres puntos
que la spec llamó irrecortables —CA-3, CA-7 y CA-9— están construidos como
pedía; lo que falla en CA-9 es una condición sobre el **diff**, no sobre el
comportamiento.

| Bloque | Resultado |
|---|---|
| `npm run lint` | limpio, exit 0 |
| `npm run typecheck` | limpio, exit 0 |
| `npm test` | 122 ficheros, **1294/1294** |
| `npm run test:db` | 24 ficheros, **300/300** |
| Contraste fichero a fichero contra `eaae265` | **0 discrepancias** en ficheros previos, 0 desaparecidos |

### Findings — numerados y accionables

**Finding 1 — CA-9.1 y CA-15.3: hay una tercera desviación en una suite cerrada,
y toca una aserción. Destino: `sdd-arquitecto`, no el implementador.**

`tests/decide/rn08-frontier.test.ts:196-201` (caso 10) cambia la aserción
derivada para añadir `'src/decide/engine-entry.ts'` a la lista de ficheros que
cruzan un nombre con capacidad. CA-9.1 dice, palabra por palabra, que esa suite
«pasa **sin tocar una aserción**. El verificador lo comprueba en el diff», y
CA-15.3 enumera **dos** desviaciones previstas —la entrada de salida de CA-5.5 y
`migrations/0007`— y cierra con «cualquier otra desviación es RED». El §5 de la
spec añade que el fichero nuevo «no obliga a tocar ningún fichero de SPEC-013»,
y eso es lo que resultó falso.

**No es una relajación**, y hay que decirlo: `DECISION_WRITERS` no se toca, la
lista sigue con cuatro entradas, y mi sonda P13 (`src/bot/decide-leak.ts`
importando `PostgresDecisionStore`) pone en rojo los casos 3 y 10 — el guardián
sigue midiendo. **Y probablemente sea inevitable**: `runEngineForMatch` tiene que
componer un `PostgresDecisionStore` porque no puede aceptarlo del bot ni tomar
`composeCyclePorts` sin arrastrar el fetcher de plataforma al grafo de la ruta
(SPEC-008 CA-2.8). Es decir: **la CA, tal como está escrita, no es satisfacible
con el diseño que la propia spec manda en su §5.**

Para cerrarlo hace falta una de estas dos, y ninguna es código:
1. Enmienda por la vía de ADR-015 en **este** ledger, bajo
   `## Enmienda — 2026-09-03: …`, que reconozca la aserción derivada del caso 10
   como tercera desviación prevista y reescriba la promesa de CA-9.1 y §5.
2. O un rediseño de la puerta estrecha que no cruce ningún nombre con capacidad
   —y entonces hay que decir cómo compone el almacén sin hacerlo.

**Finding 2 — CA-3.2 está a medias: nadie mira las filas persistidas. Destino:
`sdd-implementador`.**

CA-3.2 pide dos cosas: «las seis claves prohibidas no aparecen **ni en el objeto
archivado ni en ninguna fila persistida**. Un caso recorre el objeto y, después,
**las tres tablas nuevas más `observations`**, y el conjunto es vacío **en los
dos sitios**». Solo existe la primera mitad: `FORBIDDEN_FIELDS` se usa
exclusivamente en `tests/bot/redact.test.ts:73`, sobre el objeto archivado
(`grep -rn "FORBIDDEN_FIELDS" tests/` devuelve dos usos, ninguno con base). En
`tests/db/` no aparece ni una vez `first_name` ni `is_premium`.

La propiedad **es cierta** por construcción —lo he leído: nada escribe esos
campos—, pero el criterio exige el caso y CA-3 es una de las tres partes que la
spec declaró irrecortables. Falta un caso en `tests/db/bot-flow.test.ts` que,
tras la jornada sintética, haga `select *` sobre `bot_proposals`,
`correspondent_state`, `bot_rejections` y `observations` y compruebe que ninguna
de las seis claves ni sus valores (`FIXTURE_FIRST_NAME`, `FIXTURE_LAST_NAME`,
`FIXTURE_USERNAME`) aparecen en ningún byte.

**Finding 3 — CA-10.4: el mecanismo es más estrecho que el criterio, y lo he
evadido. Destino: `sdd-implementador`.**

CA-10.4 dice «**Ningún fichero del repositorio** contiene un `telegram_user_id`.
Un caso lo afirma **sobre el árbol versionado**». El caso 27 de
`tests/bot/frontier.test.ts:320-333` solo lee tres sitios:
`corresponsais/2026-27.json`, `.env.example` y `tests/fixtures/*`.

**Sonda P14, medida**: escribí `src/bot/notes.ts` versionado con el comentario
`El corresponsal de A Estrada es 1234567890 en Telegram.` y la suite quedó en
**VERDE, 42/42**. Es exactamente la regla que el dictamen legal marcó como
irreversible, y su guardián no cubre el árbol que el criterio nombra.

Además, su control positivo (caso 29, línea 341-344) afirma
`expect(TELEGRAM_ID.test(withId)).toBe(true)` sobre una cadena escrita **dentro
del propio test**: no ejercita el escaneo de ficheros, solo la regex.

Qué haría falta: recorrer `versionedSources()` entero —o `git ls-files`— en vez
de tres sospechosos, con las exclusiones que haya que declarar **con su motivo**
(el HTML de `docs/diseno/` lleva constantes CSS de 9–10 cifras, y las claves
`raw_ref` sintéticas llevan `0123456789ab`); y un control positivo que escriba
un fichero sintético bajo el árbol y vea el rojo del mismo escaneo, como hacen
las sondas de CA-2.4.

*Nota: el árbol de hoy está limpio. Lo he comprobado yo, con la regex de 9–12
cifras sobre `git ls-files` entero: los únicos aciertos son constantes CSS del
sistema de diseño y literales de los propios tests. La propiedad se cumple; lo
que falla es el guardián.*

**Finding 4 — Un caso cuyo nombre afirma algo falso y cuyas aserciones miden otra
cosa. Destino: `sdd-implementador`.**

`tests/bot/observation.test.ts:116-122`, caso `8c. y esta spec NO ha tocado
ningún fichero de SPEC-013`. Sus dos aserciones leen
`src/decide/engine-entry.ts` y comprueban que contiene las cadenas
`'F-SPEC-013-11'` y `'EPIC-MEJORA'`. Eso no mide lo que el nombre dice, **y lo
que el nombre dice es falso**: `tests/decide/rn08-frontier.test.ts` sí se tocó
(Finding 1). Un caso que no puede fallar por la razón que anuncia es peor que no
tenerlo, porque un lector futuro lo citará como prueba. O se reescribe para
medir el diff de verdad, o se le pone el nombre de lo que sí afirma.

**Finding 5 (menor) — Tres controles y un residuo que afirman sobre constantes
del propio test. Destino: `sdd-implementador`, sin urgencia.**

`tests/bot/frontier.test.ts` caso 30 es `expect(true).toBe(true)`; los casos 38 y
39 afirman sobre literales escritos en el test en vez de correr el escaneo sobre
`BOT_FILES`; y el caso 16 (control positivo de `LLM_CALLERS`) comprueba
`specifier.text.includes('/bot/models/')` en vez del predicado real del caso 15
—que resuelve el módulo y devolvería `null` para un fichero inexistente—. El
mecanismo de fondo **sí funciona**: mi sonda P12 creó `src/bot/models/fake.ts`
con un llamante fuera de la lista y los casos 14 y 15 se pusieron en rojo. Pero
los controles, tal como están, no lo demuestran.

### Las sondas de evasión que escribí yo

Ficheros reales bajo `src/` (o ediciones reales de módulos), medidos y borrados;
`git status` limpio después de cada uno.

| # | Sonda | Guardián | Resultado |
|---|---|---|---|
| P1 | `src/probe/map-reader.ts` lee `TELEGRAM_CORRESPONDENTS` | `frontier` 3, 6 | **ROJO** ✔ |
| P2 | `src/bot/alias-leak.ts` importa `@/alias/resolver` | `frontier` 23 | **ROJO** ✔ |
| P3 | `import * as` sobre `@/decide/engine-entry` en `src/bot/` | `frontier` 24 | **ROJO** ✔ |
| P4 | `src/bot/lang-leak.ts` nombra `language_code` | `frontier` 31 | **ROJO** ✔ |
| P5 | `src/bot/prop-leak.ts` con `stop_reason`, `max_tokens`, `x-api-key` | `frontier` 18 | **ROJO** ✔ |
| P6 | `src/bot/text-leak.ts` con `text: 'Confirmar'` | `npm run typecheck` | **ROJO** ✔ (TS2322) |
| P7 | id de 10 cifras en `corresponsais/2026-27.json` | `frontier` 27 | **ROJO** ✔ |
| P8 | puerta de la jornada declarada neutralizada en `onContent` | `webhook` 13, 14 | **ROJO** ✔ |
| P9 | `observations.append` **antes** del botón, en `onContent` | `bot-flow` 1 (Postgres) + `webhook` 33, 34, 36 | **ROJO** ✔ |
| P12 | `src/bot/models/fake.ts` + llamante fuera de `LLM_CALLERS` | `frontier` 14, 15 | **ROJO** ✔ |
| P13 | `src/bot/decide-leak.ts` importa `PostgresDecisionStore` | `rn08-frontier` 3, 10 | **ROJO** ✔ |
| **P14** | **id de 10 cifras en `src/bot/notes.ts` versionado** | `frontier` 27 | **VERDE — evade** ✘ (Finding 3) |

Once sondas de doce enrojecen el guardián que les toca. La duodécima es el
Finding 3.

### Los tres gates, corridos por mí — 2026-09-03

```
$ npm run lint
> oxlint --type-aware
EXIT=0

$ npm run typecheck
> tsc --noEmit
EXIT=0

$ npm test
 Test Files  122 passed (122)
      Tests  1294 passed (1294)
EXIT=0

$ npm run test:db
 Test Files  24 passed (24)
      Tests  300 passed (300)
 Duration  200.02s
EXIT=0
```

**Contraste fichero a fichero contra `eaae265`** (reportero JSON de vitest,
árbol de la base materializado aparte con `git archive`):

| | Ficheros | Casos |
|---|---|---|
| `npm test` en `eaae265` | 114 | 1117 |
| `npm test` en `HEAD` | 122 | 1294 |
| `npm run test:db` en `eaae265` | 22 | 276 |
| `npm run test:db` en `HEAD` | 24 | 300 |

- **Ficheros previos con recuento cambiado: NINGUNO** (unidad y base).
- **Ficheros previos desaparecidos: NINGUNO.**
- Los 177 casos nuevos de unidad y los 24 de base cuadran exactamente con los
  diez ficheros nuevos. Confirmo la tabla del implementador.

**F-SPEC-013-10, reproducido en la base como pedía el encargo.** Mi primera
ejecución de `npm test` sobre `eaae265` —**sin una línea de SPEC-015**— cayó con
`ENOENT: … /src/ingest/refusal-control-tree` en
`tests/site/contact.test.ts`, 1116/1117. En `HEAD` la suite pasó entera. La
carrera es previa a esta spec y no se le imputa.

### Lo que no he podido ver, y no lo doy por visto

**No hay evidencia visual de una conversación real.** El bot no tiene interfaz
web y Playwright no aplica aquí: ver la tarjeta, el botón y el acuse contra
Telegram exigiría un bot registrado, un secreto y un corresponsal mapeado —es
decir, **encender el bot**, que tiene seis precondiciones fuera del código
(ADR-023 §6, F-SPEC-015-5) y ninguna cumplida. Toda mi evidencia de
comportamiento sale de los dobles y de Postgres real. Lo digo así y no lo doy
por visto, como pedía el ledger.

**Tampoco he podido verificar CA-5 contra un proveedor**, por su precondición
firmada, ni la entrega real de mensajes (F-SPEC-015-13, adaptador de grammY
diferido), ni que `corresponsais/<temporada>.json` llegue al bundle de Vercel
(F-SPEC-015-14).


## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-015/. Informe HTML opcional: _qa/SPEC-015/informe.html -->

**No hay ninguna, y es un resultado y no un olvido.** Ver «Lo que no he podido
ver» en el veredicto: el bot no se puede encender.

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
- **F-SPEC-015-14 — El escaneo de `telegram_user_id` de CA-10.4 no mira dentro
  de los ledgers.** Abierta en la segunda vuelta (2026-09-03). `*.ledger.md` es
  exclusión declarada con su motivo: el registro de verificación cita la carga
  útil de sus propias sondas —el RED de esta spec escribe el identificador de
  P14 al describir el agujero—, y un guardián que hace del acto de documentarlas
  una ofensa no se puede documentar. **El precio es real**: un identificador
  escrito en prosa dentro de un ledger no lo ve nadie. No es donde vive el mapeo
  —su único domicilio durable es el entorno, ADR-023 §4— y por eso no se arregla
  aquí. **Destino: EPIC-MEJORA**; **disparador: el día que un ledger tenga que
  citar un identificador que no sea sintético, o que alguien quiera cerrar la
  exclusión distinguiendo la cita de la sonda del dato.**

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
4. **CA-15.3 está enmendado** (ledger, `## Enmienda — 2026-09-03`): ya no
   enumera desviaciones previstas, sino que fija las cuatro condiciones bajo las
   que una es admisible. Las de esta entrega son **tres**, todas declaradas en
   «CA-15.3 — las desviaciones en suites cerradas, y son TRES», y **la de CA-5.5
   no ha ocurrido**: llegará con el proveedor y será la cuarta. El precedente de
   cómo se enmienda una aserción derivada está en F-SPEC-011-1.
5. **Que ningún fichero versionado contenga un `telegram_user_id`** (CA-10.4). Es
   irreversible si se incumple, por el mismo motivo que ADR-009 §3: git no se
   purga, se reescribe. Desde la segunda vuelta el mecanismo recorre el **árbol
   versionado entero** (`tests/bot/support/telegram-ids.ts`) con dos exclusiones
   declaradas; **la sonda que hay que repetir es P14**, y está reproducida con
   sus salidas al final del ledger.

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
| `399b505` | **2.ª vuelta**, Finding 3: CA-10.4 recorre el árbol versionado entero |
| `2795db1` | **2.ª vuelta**, Finding 2: la mitad de CA-3.2 contra las filas de la base |
| `e87ab6a` | **2.ª vuelta**, Findings 4 y 5: el caso que mentía y los tres controles |

**Segunda vuelta (2026-09-03)**: los cuatro findings del RED que eran del
implementador están cerrados; el Finding 1 lo resolvió el arquitecto con su
enmienda y no pedía código. Detalle, sondas y salidas literales en
`## Segunda vuelta del implementador`, al final de este ledger.

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

## Enmienda — 2026-09-03: CA-9.1 y CA-15.3 piden algo que el §5 de esta misma spec no puede dar

La escribe `sdd-arquitecto`, que es quien escribió los dos criterios, contestando
al **Finding 1** del RED del 2026-09-03. No mueve el estado —SPEC-015 sigue en
`en-revision`—, no toca el cuerpo de la spec, no toca ninguna columna de la
matriz ni del veredicto, y **no convierte el RED en GREEN**: le da al verificador
un criterio que se puede cumplir, para que la vuelta siguiente mida algo en vez
de comprobar una promesa imposible.

### 1. Qué afirmaban los dos criterios, y por qué era razonable escribirlos así

**CA-9.1** exigía que `src/bot/` no estuviera en `DECISION_WRITERS` y que la
suite cerrada `tests/decide/rn08-frontier.test.ts` (SPEC-013 CA-13) pasara «**sin
tocar una aserción**. El verificador lo comprueba en el diff». **CA-15.3**
enumeraba **dos** desviaciones previstas en suites cerradas —la entrada de salida
de CA-5.5 y `migrations/0007`— y cerraba con «cualquier otra desviación es RED».
El **§5** del cuerpo añadía que el fichero nuevo «no obliga a tocar ningún
fichero de SPEC-013».

Era razonable, y no por descuido. RN-08 y D-3 son la regla de la que cuelga el
producto entero, la frontera de SPEC-013 ya se había evadido una vez
(F-SPEC-013-7) y esta spec pone por primera vez a un módulo de fuera a llamar al
motor: la condición «que el guardián no haya que tocarlo» es la forma más barata
y más difícil de falsear de decir «no se ha ensanchado nada para dejarme pasar».
El error no está en querer eso. Está en haber medido **la frontera** con una
condición sobre **el diff entero de un fichero de test**, que contiene además
cosas que no son la frontera.

### 2. Qué los invalida, y no es una decisión posterior: es el §5 de esta misma spec

El §5 manda, con estas palabras, un fichero nuevo bajo `src/decide/` con una
entrada estrecha «cuyo tipo de retorno **no contiene ningún almacén**, del orden
de `runEngineForMatch({ sql, matchId, now })`». Para correr el motor sobre un
partido hay que darle un `EnginePorts` (`src/decide/apply.ts:37`), y un
`EnginePorts` lleva dentro un `DecisionStore`. Alguien tiene que construirlo. Las
posibilidades son cuatro y están cerradas:

1. **Que lo construya la puerta.** Entonces nombra `PostgresDecisionStore`, y el
   caso 10 —que enumera, con la lista de módulos con capacidad **vaciada a
   propósito**, todos los ficheros reales que cruzan un nombre vigilado— tiene que
   listarla. Es lo que ocurrió.
2. **Que se lo pase el llamante.** Prohibido por el propio CA-9: el bot no puede
   tener la capacidad, y ése es el punto entero del criterio.
3. **Que lo tome de `composeCyclePorts`.** `src/decide/cycle.ts:41` importa
   `globalFetcher` de `@/polite/http` en el nivel de módulo, así que importar
   cualquier cosa de ese fichero mete la puerta de salida de RN-11 en el grafo de
   `src/app/api/telegram/webhook/route.ts`, que es punto de entrada por la regla
   de SPEC-008 CA-2.5. El bot no le pide nada a nadie y no puede tener esa
   superficie alcanzable.
4. **Que lo componga un fichero que ya esté en el censo** —`src/decide/apply.ts`,
   `src/decide/cycle.ts` o `src/db/decisions.ts`—. Es la única que dejaría la
   aserción intacta, y la prohíbe el §1 del cuerpo: `src/decide/` no se edita
   salvo por un fichero nuevo, y `src/db/decisions.ts` es de SPEC-010, cerrada.
   Además el punto 3 vuelve a matar la variante de `cycle.ts`.

De modo que la spec pide a la vez dos cosas incompatibles: **componer el almacén
en un fichero nuevo** y **que ningún censo de quién nombra el almacén cambie**.
La segunda es consecuencia mecánica de la primera. No hay implementación
correcta que las cumpla las dos, y por eso el implementador no tenía otra salida
que declarar la desviación —cosa que hizo, en «CA-15.3 — las desviaciones en
suites cerradas, y son TRES», antes de que nadie se lo pidiera.

**Y hay que decir de dónde viene el defecto**: lo escribió el arquitecto, no el
implementador, y lo escribió mirando `DECISION_WRITERS` —que efectivamente no se
toca— y llamando «una aserción» a todo lo que hay en ese fichero.

### 3. La tercera vía que busqué, y por qué ninguna de las dos candidatas vale

Antes de enmendar hay que agotar el rediseño, porque **una enmienda relaja y un
rediseño no**. Dos caminos parecían prometer, y los dos son peores:

- **Componer en un fichero nuevo bajo `src/db/`** (p. ej. `src/db/engine-ports.ts`)
  para que el censo creciera «del otro lado». Sería **peor de verdad**:
  `DECISION_WRITERS` declara `src/db/alerts.ts` y `src/db/decisions.ts` por ruta
  exacta, no el directorio, así que ese fichero exigiría una **entrada nueva en la
  frontera**. Eso sí es ensancharla — exactamente lo que CA-9.1 existe para
  impedir— y encima invierte la dependencia: la composición de puertos viviría
  dentro de la implementación del puerto.
- **Obtener la clase sin deletrearla**, con `(await import('@/db/decisions')).PostgresDecisionStore`.
  El mecanismo del nombre no lo ve —el caso 12 de la misma suite lo prueba— así
  que el caso 10 no crecería. Es **escribir la evasión de F-SPEC-013-7 a
  propósito, dentro del motor, para no tocar una línea de un test**. Es la forma
  pura de lo que ADR-016 §3.5 prohíbe, y la caza además el mecanismo 1 bis. Se
  rechaza sin matices.

Conclusión: **el verificador tiene razón**. La CA no es satisfacible con el
diseño que la propia spec manda, y la única alternativa que dejaría la aserción
intacta ensancha la frontera de verdad.

### 4. Con qué se sustituyen. Y la red no es menor: en el punto que importa es mayor

**CA-9.1, enmendado.** `src/bot/` no está en `DECISION_WRITERS`; **la frontera no
se ensancha** —`tests/decide/support/rn08.ts` no cambia ni una línea: ni
`DECISION_WRITERS`, ni `DECISION_CAPABILITY_NAMES`, ni ninguno de sus tres
mecanismos—; y `tests/decide/rn08-frontier.test.ts` pasa entera **sin más cambio
que el crecimiento de un censo derivado**: la enumeración del caso 10, con su
motivo escrito en el mismo diff (ADR-016 §3.2). Y el verificador **no lo
comprueba solo en el diff**: lo comprueba con una sonda —un fichero de `src/bot/`
que importe `PostgresDecisionStore` tiene que poner rojos los casos 3 y 10—.

**CA-15.3, enmendado.** Deja de enumerar desviaciones previstas y pasa a fijar
**cuándo una desviación es admisible**, que es lo que la enumeración quería decir
y no supo:

> Una desviación en una suite cerrada es admisible si, y solo si, (a) es el
> crecimiento de un **censo derivado** —una lista cuyo valor esperado es función
> de lo que hay en el repositorio y podría recalcularse en vez de escribirse: las
> migraciones en disco, las rutas de `src/app/`, los ficheros que cruzan un
> nombre vigilado—; (b) **ninguna lista de frontera** se toca
> —`DECISION_WRITERS`, `DECISION_CAPABILITY_NAMES`, `ALLOWED_*`, `LLM_CALLERS`,
> `CORRESPONDENT_MAP_READERS`—; (c) ninguna aserción se debilita, se borra ni se
> vuelve condicional; y (d) el motivo está escrito en el mismo diff. Cualquier
> otra desviación es RED.

Con esa regla, las **tres** desviaciones de esta entrega son admisibles y quedan
declaradas —el implementador ya las tenía escritas y la enmienda no le añade
trabajo—: `migrations/0007` en `tests/db/decide-cycle.test.ts`;
`src/app/api/telegram/webhook/route.ts` en `ENTRY_POINTS`
(`tests/polite/support/capability.ts`), que además la exige el caso 17 de
`tests/polite/architecture.test.ts`; y `src/decide/engine-entry.ts` en el caso 10.

**Y una corrección de hecho que hay que dejar escrita**: de las dos desviaciones
que CA-15.3 preveía, **la de CA-5.5 no ha ocurrido**. Es la entrada de la llamada
al proveedor en la lista de lo permitido de salida, y CA-5 está aplazado por el
gate hasta que haya proveedor y DPA (ADR-023 §6.4). Llegará, será una **cuarta**
desviación, y es admisible por la misma regla. Que nadie la cuente como hecha.

**¿Es menor la red?** No, y esto es el punto 3 de ADR-015 §3 contestado sin
suavizar. Lo que CA-9.1 protege es que nadie ensanche la frontera para dejar
pasar al bot, y eso sigue medido por el **caso 3** —el complemento vacío con la
lista real— que **no ha cambiado**, y por el **caso 1**, que sigue exigiendo dos
entradas en `DECISION_WRITERS`. Lo que cambió es el **caso 10**, que no es la
frontera: es el control positivo del propio detector, y corre a propósito con la
lista de módulos con capacidad **vacía** para comprobar que el mecanismo mide
algo. Su poder está en que el conjunto no sea vacío y en que vaciar los nombres
lo vacíe; la enumeración literal añade precisión, y una precisión que crece con
los ficheros reales no es poder perdido. El comentario que SPEC-013 dejó escrito
dentro de ese mismo caso ya lo decía —«aserción derivada, y crece con los
ficheros reales que tienen la capacidad, no con la frontera, que no se toca»—:
**la letra de CA-9.1 contradecía a la suite que citaba**.

En la mitad de la sonda, la red es **mayor** que antes: una condición sobre el
diff se cumple sola cuando nadie cambia nada, y la sonda no.

**Evidencia independiente de esta enmienda**, que es lo que impide leerla como
una excusa: la escribió el verificador, no el arquitecto. `git diff main --
tests/decide/support/rn08.ts` es **vacío**; el diff del caso 10 son doce líneas,
once de comentario y una entrada de array; y su sonda **P13**
(`src/bot/decide-leak.ts` importando `PostgresDecisionStore`) pone en **rojo** los
casos 3 y 10. El guardián sigue mordiendo.

### 5. Si el veredicto sigue en pie

**Sí, y no se toca.** El RED del 2026-09-03 fue correcto: el código no cumplía la
letra escrita, y el verificador hizo exactamente su trabajo al no perdonarla. Esta
enmienda **no cierra el RED** —lo cierra la vuelta siguiente, con los otros cuatro
findings resueltos— y no cambia una sola casilla de la matriz. Lo único que hace
es que CA-9.1 y CA-15.3 dejen de pedir lo imposible, para que la vuelta siguiente
pueda ponerlos en verde midiendo la propiedad en vez de la promesa.

### 6. Qué despierta esto otra vez

Tres condiciones, cualquiera de ellas:

1. **Que alguien quiera meter una entrada nueva en `DECISION_WRITERS`.** Ahí no
   hay enmienda que valga: es ensanchar la frontera y necesita spec y gate.
2. **Que el caso 10 crezca con un fichero de fuera de `src/decide/` y de
   `src/db/decisions.ts`.** Entonces no es un censo creciendo: es la capacidad
   saliéndose, y es RED.
3. **La próxima spec que ya tenga que tocar `tests/decide/rn08-frontier.test.ts`
   por causa propia.** Ese día el caso 10 debería dejar de llevar una lista
   literal y derivarse de `DECISION_WRITERS` —«todo fichero que cruce un nombre
   con los writers vacíos, o tiene capacidad bajo la lista real, o es
   `src/db/decisions.ts`»—, y esta enmienda no vuelve a hacer falta nunca.
   Hacerlo **hoy** sería tocar una suite cerrada más de lo que la toca la línea
   que se enmienda. **Destino: EPIC-MEJORA.**

### 7. Por qué ADR-015 aplica a una spec en revisión, y con qué barra

ADR-015 está escrito para specs **cerradas** y para el caso en que «una decisión
**posterior**» invalida un CA. Aquí no se cumple ninguna de las dos cosas:
SPEC-015 está en `en-revision`, y nada posterior la invalidó —**nació
contradiciéndose**, con el §5 pidiendo lo que CA-9.1 prohibía—. Así que el
mecanismo **aplica por analogía, no por su letra**, y las dos diferencias van
dichas en vez de disimuladas:

- **La razón del §1 —el cuerpo no se edita— sí aplica entera.** Este cuerpo lo
  firmó Alberto Fojo con fecha el 2026-09-03, y el implementador y el verificador
  trabajaron contra ese texto: reescribirlo dejaría las filas del ledger citando
  un contrato que ya no está escrito, que es exactamente lo que ADR-015 rechaza en
  su alternativa (a). La firma no depende de que el artefacto esté cerrado.
- **La diferencia juega a favor, no en contra.** La objeción de peso de ADR-015
  —«un ledger de una spec `hecho` se relee todavía menos que la spec»— aquí no
  muerde: esta enmienda se escribe **antes** del veredicto, y quien la va a leer
  es el mismo verificador que abrió el finding, en la vuelta siguiente, con el
  ledger delante.

**Y la barra, que es lo que impide que esto sea una puerta trasera.** Una spec en
revisión enmendando **sus propios** criterios es más peligroso que el caso de
ADR-015, porque es el autor corrigiendo el contrato mientras lo juzgan. Solo es
admisible con las cuatro condiciones a la vez:

1. **No satisfacibilidad demostrada, no alegada**: se enumeran las formas de
   cumplir el criterio y cada una se mata con una regla citable. §2 y §3 de esta
   enmienda son esa demostración; si alguna se cae, la enmienda se cae con ella.
2. **La propiedad protegida sigue protegida, con evidencia que no sale de la letra
   enmendada** —aquí, las sondas del verificador—.
3. **Llega antes del veredicto y no lo cambia.** Una enmienda nunca convierte un
   RED emitido en GREEN: da criterio a la vuelta siguiente.
4. **La escribe `sdd-arquitecto`.** Ni el implementador, cuyo trabajo se juzga con
   ella, ni el verificador, que dejaría de ser adversario.

**Precedente del proyecto, y en qué me aparto de él.** SPEC-008 estuvo en
`en-revision` siete vueltas y **reescribió CA-2.1, CA-2.3 y CA-2.6 en el cuerpo**,
dejando en cada uno una cita en bloque que apunta a la enmienda del ledger, donde
viven el texto anterior y la medición. Es la forma más visible, y aquí **no la
uso**: el encargo de esta pasada prohíbe tocar el cuerpo, y ese es el lado
correcto en el que equivocarse. **Queda para el gate humano**, y es una decisión
suya y de nadie más: si quiere la visibilidad del precedente de SPEC-008, lo que
falta es una cita en bloque bajo CA-9 y bajo CA-15 apuntando aquí. Sin ella, quien
lea CA-9.1 en el cuerpo **no verá esta enmienda** — que es, palabra por palabra,
la consecuencia negativa que ADR-015 declaró y no eliminó.

**Y no escribo un ADR nuevo.** ADR-015 rechazó «solo la nota, sin ADR» por
insuficiente, pero con un motivo aritmético que hoy no se da: allí iban **dos
ocurrencias en tres días**; aquí va **una**. Decidir la política general del caso
«spec en revisión enmienda su propio CA» con un solo caso es inventar. Queda el
disparador escrito: **la segunda vez que ocurra, hace falta un ADR que extienda
ADR-015 al caso previo al veredicto**, con esta barra dentro o con otra mejor.

### 8. Lo que esta enmienda no hace

No mueve el estado de SPEC-015, que sigue en `en-revision`. No cierra ningún
finding del verificador —ni siquiera el primero: lo que hace es darle criterio—.
No perdona ninguna de las otras cuatro observaciones del RED. No autoriza tocar
`tests/decide/support/rn08.ts` ni ninguna lista de frontera. No añade ni quita
código, y **no pide una sola línea al implementador**: lo que él escribió, con su
motivo en el diff, es lo que la CA enmendada pide.

## Segunda vuelta del implementador — 2026-09-03

La escribe `sdd-implementador`, que no es el mismo agente que la primera: el
ledger y la spec son toda la memoria que hay. No toca ninguna columna del
verificador, ni la enmienda del arquitecto, ni el cuerpo de la spec, ni el
estado —que vuelve a `en-revision` al terminar—.

**Finding 1 no se toca**, por instrucción del arquitecto: la enmienda de CA-9.1
y CA-15.3 dice que la salida elegida —`src/decide/engine-entry.ts` en el censo
derivado del caso 10, con su motivo en el mismo diff— es exactamente la que la
CA enmendada pide. `tests/decide/rn08-frontier.test.ts` y
`tests/decide/support/rn08.ts` siguen sin tocarse en esta vuelta. Y queda
anotada la corrección de hecho: **la desviación de CA-5.5 no ha ocurrido**; será
la cuarta, cuando haya proveedor y DPA (ADR-023 §6.4).

### Finding 3 — CA-10.4: el guardián ya recorre el árbol, y la sonda P14 lo pone rojo

Es el más grave y no era «un test que ampliar»: es una regla de privacidad en un
repositorio público cuyo incumplimiento es irreversible (ADR-009 §3), y su
guardián vigilaba tres rutas en vez del árbol.

**Mecanismo nuevo**: `tests/bot/support/telegram-ids.ts`. Recorre
`git ls-files --cached --others --exclude-standard` **entero**, sin pathspec de
extensiones —un identificador en un `.json`, un `.md`, un `.sql` o el
`.env.example` es igual de irreversible que uno en un `.ts`—, leyendo cada
fichero en `latin1` (un byte, un carácter) para que los binarios versionados se
juzguen con la misma regla. Un fichero versionado e ilegible es **rojo
nombrándose**, nunca silencio.

**Dos exclusiones, las dos estructurales y con su motivo escrito** (nunca por
nombre de fichero, ADR-016 §3.3):

1. `docs/diseno/` — el runtime minificado que `build.mjs` inyecta en los
   artboards lleva constantes de máscara de bits de 9 y 10 cifras. Es la misma
   frontera, con el mismo motivo, que ya declaran `SCAN_EXCLUSIONS` y
   `.oxlintrc.json`.
2. `*.ledger.md` — el registro de verificación es donde se escribe **lo que se
   midió**, carga útil de la sonda incluida: el veredicto RED de esta misma
   spec cita el número de diez cifras de P14 mientras describe el agujero. Es el
   motivo por el que `SCAN_EXCLUSIONS` deja fuera `tests/`: un guardián que
   convierte en ofensa documentar su propia sonda no se puede documentar.
   **Residuo declarado dentro de la propia entrada** y como F-SPEC-015-14.

**`tests/` NO se excluye**, y eso es deliberado: es lo que hace que
`tests/fixtures/` —que el CA nombra— quede cubierto. El precio es que la carga
útil de la sonda del caso 30 **se compone** (`'7'.repeat(10)`) en vez de
escribirse, porque un literal de diez cifras en el propio fichero convertiría al
guardián en su propia ofensa. Queda dicho en el mismo sitio donde se compone.

**Los casos, en la forma de ADR-016** (`tests/bot/frontier.test.ts` 27–32):

| # | Qué mide |
|---|---|
| 27 | **Cobertura**: el árbol contiene los tres sitios que el CA nombra, `src/bot/webhook.ts` —donde escribió P14—, `migrations/` y más de 400 ficheros; y contiene **entero** lo que `versionedSources()` lee (el complemento de esa inclusión es vacío) |
| 28 | El complemento es **vacío**: cero ofensas |
| 29 | `.env.example` declara `TELEGRAM_CORRESPONDENTS` **sin valor** |
| 30 | **Control positivo**: escribe un fichero bajo `src/bot/` y ve el rojo **del mismo escaneo**, con la ofensa nombrando ruta e identificador; lo borra en `finally` |
| 31 | **Residuo medido, no prometido**: los mismos bytes que el 30 vio en rojo son verdes en cuanto el fichero sale del árbol. El mecanismo **previene, no repara**. Sustituye a un `expect(true).toBe(true)` |
| 32 | **Control del propio detector**: con la lista de exclusiones vacía el escaneo **encuentra algo** (luego lee bytes de verdad) y **todo** lo que encuentra cae bajo una exclusión declarada |

**La sonda P14, reproducida entera y medida:**

```
$ cat src/bot/notes.ts
/** Sonda P14. O corresponsal de A Estrada e 1234567890 en Telegram. */
export const NOTES = 1;

$ npx vitest run tests/bot/frontier.test.ts
 × 28. y no hay NINGUNA ofensa en él
 × 30. control positivo: un fichero escrito bajo `src/bot/` pone ROJO EL MISMO escaneo
 × 31. residuo declarado: mira el ÁRBOL DE TRABAJO, no la historia de git
 × 32. control del propio detector: ninguna exclusión es decorativa
AssertionError: expected [ Array(1) ] to deeply equal []
+   "src/bot/notes.ts: looks like a telegram_user_id — 1234567890"
      Tests  4 failed | 40 passed (44)

$ rm src/bot/notes.ts && git status --short
(vacío)

$ npx vitest run tests/bot/frontier.test.ts
      Tests  44 passed (44)
```

Antes del arreglo, el mismo fichero dejaba la suite en **42/42 verde**: medido
también, en esta misma vuelta, antes de tocar nada. `git status` queda limpio.

### Finding 2 — CA-3.2: la mitad que faltaba, contra las filas de la base

`tests/db/bot-flow.test.ts` 14–16. Una jornada sintética que deja las **cuatro**
tablas con filas a la vez —un rechazo, un mensaje confirmado y una propuesta
viva; `correspondent_state` ya la tiene desde el `beforeEach`—, un `select *`
sobre cada una, y el juicio **sobre los bytes de las filas**: las seis claves
como columna y como contenido, y los tres valores del fixture
(`FIXTURE_FIRST_NAME`, `FIXTURE_LAST_NAME`, `FIXTURE_USERNAME`) como contenido.
No sobre las claves de un objeto construido por el test, que es la diferencia
entre medir la base y medir el propio código.

- **Caso 15, control positivo end-to-end**: una fila con `FIXTURE_FIRST_NAME`
  dentro de una columna pone rojo **el mismo escaneo**, con la ofensa nombrando
  tabla y valor; borrarla lo devuelve a verde.
- **Caso 16, control del detector**: una tabla **vacía** se declara como prueba
  de nada (`observations: no rows, so this table proves nothing`) en vez de
  contar como limpia. Sin esto, la mitad del mecanismo sería vacua.

### Finding 4 — el caso que afirmaba algo falso

`tests/bot/observation.test.ts` caso 8c se llamaba «y esta spec NO ha tocado
ningún fichero de SPEC-013» y comprobaba que `src/decide/engine-entry.ts`
contiene las cadenas `'F-SPEC-013-11'` y `'EPIC-MEJORA'`. **No se ha borrado: se
ha sustituido** por lo que CA-9.1 sí protege y sí se puede medir —que
`tests/decide/support/rn08.ts` no nombre ni `src/bot` ni la puerta estrecha, y
que `DECISION_WRITERS` siga teniendo exactamente sus dos entradas declaradas—.
El comentario del caso 8, que repetía la misma afirmación falsa, se corrige.
Ningún caso se ha borrado en toda la vuelta.

### Finding 5 — tres controles que no ejercitaban su mecanismo

- **Caso 16** miraba `specifier.text.includes('/bot/models/')`, un `includes`
  que el caso 15 no hace. Los dos llaman ahora a `modelAdapterOffences()`, el
  predicado real (resolver con el lector y mirar a dónde apunta), y el control
  declara un adaptador **sintético** para que haya algo que resolver: el
  directorio real está vacío hasta que haya proveedor y DPA.
- **Casos 38 y 39** afirmaban sobre literales sueltos. Los tres —37, 38, 39—
  llaman ahora a `visibleLiteralOffences()`, y el residuo del 39 se mide con el
  escaneo (un fichero sintético de `src/bot/` con un literal ASCII sale limpio)
  en vez de con la expresión regular.
- **Caso 30** (`expect(true).toBe(true)`) se cerró con el Finding 3.

### Los tres gates — salidas literales de la segunda vuelta, 2026-09-03

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
      Tests  1296 passed (1296)
Type Errors  no errors
```

```
$ npm run test:db

 RUN  v4.1.11 /Users/albertofojo/src/tremen-dev/marcador.gal/.claude/worktrees/spec-015

 Test Files  24 passed (24)
      Tests  303 passed (303)
```

**El recuento, contra `eaae265` y contra la primera vuelta.** `npm test` pasa de
1294 a **1296** (+2: el bloque de CA-10.4 pasa de cuatro casos a seis) y
`npm run test:db` de 300 a **303** (+3: los casos 14–16 de `bot-flow`). El número
de ficheros no cambia en ninguno de los dos.

**Ningún fichero de test previo cambia de recuento**, y esta vez se puede decir
sin contar casos: `git diff --name-status e07d96d HEAD` da **cinco** ficheros, y
los cinco nacieron en esta rama (`tests/bot/frontier.test.ts`,
`tests/bot/observation.test.ts`, `tests/bot/support/frontier.ts`,
`tests/bot/support/telegram-ids.ts`, `tests/db/bot-flow.test.ts`). Los tres
ficheros previos que esta rama sí toca —`tests/db/decide-cycle.test.ts`,
`tests/decide/rn08-frontier.test.ts` y `tests/polite/support/capability.ts`—
**no se han tocado en esta vuelta**, y su número de casos sigue siendo el de
`eaae265` (25 y 17; el tercero no es fichero de test). Las tres desviaciones
declaradas siguen siendo tres, y ninguna es de esta vuelta.

**F-SPEC-013-10 no ha aparecido** en ninguna de las ejecuciones de esta vuelta
(cinco de `npm test`, tres de `npm run test:db`).

### Follow-up nuevo

- **F-SPEC-015-14 — El escaneo de `telegram_user_id` no mira dentro de los
  ledgers.** `*.ledger.md` es exclusión declarada con su motivo: el registro de
  verificación cita la carga útil de sus propias sondas, y un guardián que hace
  del acto de documentarlas una ofensa no se puede documentar. **El precio es
  real**: un identificador escrito en prosa dentro de un ledger no lo ve nadie.
  No es donde vive el mapeo —su único domicilio durable es el entorno
  (ADR-023 §4)— y por eso no se arregla aquí. **Destino: EPIC-MEJORA**;
  **disparador: el día que un ledger tenga que citar un identificador que no sea
  sintético, o que alguien quiera cerrar la exclusión distinguiendo la cita de
  la sonda del dato.**

### Los tres commits de esta vuelta

| SHA | Qué trae |
|---|---|
| `399b505` | Finding 3: `tests/bot/support/telegram-ids.ts` y los casos 27–32; la sonda P14 reproducida |
| `2795db1` | Finding 2: `tests/db/bot-flow.test.ts` 14–16, la mitad de CA-3.2 contra la base |
| `e87ab6a` | Findings 4 y 5: el caso 8c sustituido y los tres controles ejercitando su mecanismo |
