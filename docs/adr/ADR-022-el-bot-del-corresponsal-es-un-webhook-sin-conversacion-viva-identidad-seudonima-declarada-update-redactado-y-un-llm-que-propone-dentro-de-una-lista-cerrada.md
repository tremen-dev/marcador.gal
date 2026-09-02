---
id: ADR-022
tipo: adr
estado: borrador
historial:
  - {estado: borrador, fecha: 2026-09-02, por: sdd-arquitecto}
---
# ADR-022: El bot del corresponsal es un webhook sin conversación viva — identidad seudónima declarada, update redactado, y un LLM que propone dentro de una lista cerrada

- Deciders: propone `sdd-arquitecto` el 2026-09-02, al escribir **SPEC-015**,
  porque el bot es la primera pieza del proyecto que **recibe** algo de una
  persona y la primera que llama a un tercero que no es una fuente de
  resultados. **Aprueba: pendiente de gate humano.**
- Specs relacionadas: **SPEC-015** (la que lo ejecuta); **SPEC-013** (`hecho`;
  el motor y la frontera de RN-08 que el bot atraviesa por una puerta estrecha);
  **SPEC-012** (`hecho`; la ruta de cron es el patrón hermano y las jornadas de
  medición declaradas son la llave); **SPEC-011** (`hecho`; el catálogo de alias,
  del que este ADR se aparta deliberadamente para la identidad del partido);
  **SPEC-010** (`hecho`; el calendario declarado es la lista cerrada de
  candidatos).
- Relacionado: **ADR-001** (grammY en modo webhook), **ADR-004** (sin proceso
  vivo), **ADR-006** (instantes ISO, sin ORM), **ADR-014** (la cortesía RN-11
  tiene un solo dueño), **ADR-016** (cómo se demuestra una frontera de
  capacidad), **ADR-017** (identidad de partido derivada del calendario),
  **ADR-018** (el catálogo declarado y el todo-o-nada), **ADR-019 §3** (las
  jornadas de medición declaradas), **ADR-021 §3, §4 y §8.4** (los dos
  disparadores del motor y el fallo cerrado ante un `SourceId` desconocido),
  **ADR-023** (retención y régimen de datos personales de este archivo),
  **RN-01, RN-08, RN-09, RN-10, RN-12, RN-13**, **D-2**, **D-3**, **D-4**.

## Contexto

Con una sola fuente automática capturable (`ceroacero.es`, peso 0.7), la segunda
vía de RN-02 está cerrada por aritmética: **nada llega a *confirmado* sin una
persona** (`_epica.md` de EPIC-002, ADR-008 §1). El corresponsal (0.8 →
*provisional*) y el operador (1.0, con precedencia → *confirmado*) son la única
ruta, y la cuarta cifra de la épica —minutos de operación manual, con corte duro
en 30— **no se puede medir sin este bot**.

El motor ya tiene sitio para él: `src/decide/roles.ts` mapea el `SourceId`
exacto `'corresponsal'` a `'correspondent'`, y `RN01_WEIGHTS.correspondent` vale
0.8. Lo que no existe es nada que produzca esa `Observation`.

Y hay **siete preguntas** que no se pueden dejar al implementador, porque cada
una constriñe trabajo futuro y tres de ellas son irreversibles:

1. **Cómo entra un update sin proceso vivo.** ADR-004 dice que en Vercel no hay
   proceso; grammY en long-poll necesita uno. ADR-001 ya escribió «grammY en
   modo webhook», pero no dijo dónde vive la ruta ni quién comprueba que el
   update es de Telegram — y **un webhook es una URL pública, y un update falso
   vale peso 0.8**.
2. **Quién es el corresponsal en las filas.** El `telegram_user_id` es un
   identificador transversal, estable de por vida y compartido con todos los
   bots que esa persona use. Meterlo en un log que **RN-13 prohíbe borrar** es
   crear un identificador directo imborrable. Y el repositorio es **público**.
3. **Qué se archiva.** RN-10 obliga a guardar la respuesta cruda antes de
   parsearla; el update de Telegram trae nombre civil, `@username`,
   `language_code` y media docena de campos más **que ningún parser va a leer
   nunca**.
4. **Dónde vive la conversación.** La tarjeta de confirmación es un ida y vuelta
   —mensaje, tarjeta, botón— y sin proceso vivo no hay memoria entre los dos
   eventos. **Hay dos eventos entrantes, no uno**, y los dos son crudos.
5. **Cómo se identifica el partido.** El catálogo de alias de ADR-018 resuelve
   todo-o-nada contra las grafías de **una fuente**, que son estables. Las de
   una persona escribiendo desde una banda no lo son.
6. **Qué LLM, y cómo se le impide llevarse la identidad.** RN-09 y D-4 exigen
   salida JSON validada **y** confirmación humana; no dicen quién parsea ni con
   qué contrato, ni qué es lo que sale del proceso hacia el proveedor.
7. **De dónde sale la lengua.** Telegram **no ofrece galego** en sus clientes,
   así que el `language_code` de casi todos los corresponsales gallegos llegará
   como `es`. Inferir la lengua del cliente **vacía D-2 sin que nadie lo vea**.

Los dos roles consultivos ya dictaminaron sobre esto el 2026-09-02
(`docs/epicas/EPIC-002-instrumentacion-de-las-cuatro-cifras/dictamenes-SPEC-015.md`).
Este ADR contesta a las siete; **la retención del archivo y el régimen de datos
personales van aparte, en ADR-023**, con el precedente de ADR-019 / ADR-020.

## Decisión

### §1. El bot es una ruta `POST` y su handler vive en `src/bot/`

El bot entra por **webhook**: `POST /api/telegram/webhook`, una ruta del App
Router hermana de `/api/cron/ingest` y con su misma forma —la ruta no tiene
lógica, delega entera en un handler inyectable de `src/bot/`—. El domicilio es
**`src/bot/`**, nuevo, y ninguna otra parte del código habla con Telegram.

**La mitad de entrada es nuestra; la mitad de salida es de grammY.** Las
llamadas al API de Telegram —enviar, editar, contestar el callback, registrar
los comandos— usan `grammy`, que ya es dependencia declarada por ADR-001 y hoy
no la importa nadie. **El encaminamiento del update NO usa el middleware de
grammY**, y el motivo es de orden y no de gusto: este ADR exige comprobar el
secreto y autorizar al remitente **antes** de tocar el cuerpo, y un framework de
conversación decide por su cuenta cuándo parsea. La secuencia tiene que ser
nuestra para poder afirmarla en un criterio.

**El secreto es el `secret_token` de Telegram**, comparado en tiempo constante
contra `TELEGRAM_WEBHOOK_SECRET`, con **fallo cerrado**: variable ausente o
vacía ⇒ 401 sin mirar el cuerpo, exactamente como `cronIngestHandler` hace con
`CRON_SECRET`. Un update sin secreto válido **no se archiva, no se cuenta como
mensaje y no deja fila**: se rechaza antes.

Ni el token del bot ni el secreto del webhook se versionan. Van en entorno
(`TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`), declarados sin valor en
`.env.example`.

### §2. La identidad del corresponsal es un seudónimo local, y su mapeo no se versiona nunca

**`Observation.source` es exactamente `'corresponsal'`, sin sufijo y sin
variantes.** No es una preferencia de estilo: `roleOf` falla cerrado ante un
`SourceId` que no esté en `SOURCE_ROLES` (ADR-021 §8.4), así que un
`corresponsal:01` reventaría el motor y obligaría a tocar ficheros de una spec
que está `hecho`. La persona **queda fuera de todos los joins que hace el
motor**, que además es lo que quiere el régimen de ADR-023.

**Quién envió qué se registra con un `correspondent_id` declarado**, de la forma
`corresponsal-01`, `corresponsal-02`. Es un token **local del proyecto**, sin
significado fuera de él. **No lleva el nombre ni la localidad de la persona**:
`corresponsal-xove`, en un repositorio público y cruzado con el calendario,
identifica a alguien en una comarca pequeña.

**El catálogo de `correspondent_id` se versiona; el mapeo a `telegram_user_id`
no se versiona jamás.** Es el mismo razonamiento que **ADR-009 §3** hizo, con
esas palabras, para el HTML de terceros —*git no se purga, se reescribe*, y por
eso la política es «sin excepción, porque su incumplimiento no es
reversible»—, aplicado a un dato peor: un identificador personal transversal en
un repositorio **público**. La regla **no cambia si el repositorio pasa a
privado**: un privado se hace público con un clic, y una solicitud de supresión
seguiría obligando a reescribir la historia.

**Dónde vive cada mitad:**

- **El catálogo**, versionado en `corresponsais/<temporada>.json`, validado con
  zod y **importado como módulo**: `{ correspondent_id, competitions[], alta,
  activo }`. Sin `telegram_user_id`, sin nombre, sin contacto.
- **El mapeo**, en la variable de entorno `TELEGRAM_CORRESPONDENTS`, un objeto
  JSON `{"<telegram_user_id>": "<correspondent_id>"}`. **Nunca en Postgres y
  nunca en un fichero del repositorio**, y el cargador **no tiene ninguna ruta
  de código que lea de un fichero del repositorio** — eso es lo que se
  comprueba, no un `grep`.
- **Quién puede leer el mapeo** es una frontera de capacidad en la forma de
  ADR-016: lista de módulos autorizados, con su motivo, y el complemento vacío.

**Y el `correspondent_id` tiene un solo domicilio durable: el objeto crudo
redactado.** No hay ninguna columna en ninguna tabla append-only que lo lleve.
La cadena de RN-12 sigue siendo verificable entera: `Decision` →
`supporting_observation_ids` → `Observation(source='corresponsal', raw_ref)` →
objeto crudo → `correspondent_id`. La única otra fila que lo nombra es la de la
propuesta pendiente, que es **estado transitorio y se borra al resolverse**
(§4).

### §3. Lo que se archiva es una lista blanca, y el texto va verbatim

**RN-10 se cumple archivando el update REDACTADO, no íntegro.** La finalidad de
RN-10 está escrita en la propia regla —«permite reprocesar con un parser
corregido y reproducir una jornada entera en tests»— y `first_name`,
`last_name`, `username`, `language_code`, `is_bot` e `is_premium` son **inertes
para el reproceso**: no hay parser futuro que los lea.

**Y esto NO es la alternativa que ADR-009 rechazó. Hay que decir por qué, porque
si no alguien citará el precedente al revés.** ADR-009 rechazó «retención
indefinida con anonimización del HTML archivado» por dos motivos: que anonimizar
el crudo destruye RN-10, y que **exigiría un parser fiable para saber qué
tachar, lo cual es circular**. Aquí **la circularidad no existe**: el update de
Telegram es JSON estructurado con esquema documentado y estable, así que la
redacción es una **lista blanca de claves**, decidible sin interpretar una sola
palabra del dominio. Es la diferencia entre tachar un HTML de tercero —hay que
entenderlo— y no copiar un campo de un JSON —basta con no copiarlo—.

**Y el orden se respeta.** RN-10 ordena archivar antes de **parsear**, no antes
de **tocar**: el sistema ya toca el objeto antes de escribirlo, porque
`rawKey()` se calcula del cuerpo y de un `RawObjectMeta` cuyo encaminamiento se
conoce antes de la escritura (`src/raw/store.ts`). Para que la garantía sea
verdadera, la redacción es **sin pérdida sobre `message.text`: el texto se
archiva verbatim, byte a byte**. Lo que se pierde es solo lo que nadie iba a
leer.

**Se archiva, y nada más:** `update_id`; `message.message_id`; `message.date`
—que es materia prima de la primera cifra de EPIC-002 y sin él no hay
latencia—; `message.text` verbatim; del `callback_query`, su `id`, su `data` y
el `message_id` de la tarjeta; y el `correspondent_id` interno **en lugar** de
`from.id` y `chat.id`. **Por defecto se descarta, no por defecto se conserva.**

**Tres objetos crudos por observación confirmada, y dos de ellos quedan
colgantes.** El mensaje, la respuesta del LLM y el callback de confirmación son
los tres respuestas crudas que se parsean, así que los tres se archivan bajo el
mismo régimen y la misma lista blanca. La `Observation` apunta con su `raw_ref`
**al objeto del mensaje**, que es el sustrato reprocesable; los otros dos
**no tienen ninguna `Observation` que los cite**, y eso es **estado legítimo y
declarado**, como ADR-020 §4 declaró el `raw_ref` colgante en la dirección
contraria.

**La clave del archivo, y la irregularidad que lleva dentro.** La clave del raw
store es
`<source>/<competition_id>/<YYYY-MM-DD>/<instante>-<digest>.<ext>`, y
**`competition_id` no se conoce antes de parsear un mensaje libre** —ni se puede
derivar del catálogo, porque un corresponsal puede cubrir dos competiciones—.
Decisión: en el archivo del corresponsal el `source` es `corresponsal` para los
tres objetos, de modo que **la purga tenga un solo prefijo**, y el segundo
segmento **no es una competición**: lleva el **tipo de evento**, de una lista
cerrada de tres valores declarada con su motivo — `mensaxe`, `proposta`,
`confirmacion`. Quien lea una clave bajo `corresponsal/` tiene que saberlo, y
por eso está escrito aquí y no en un comentario.

### §4. La conversación no vive: es una propuesta pendiente, durable y transitoria

Sin proceso vivo (ADR-004) no hay memoria entre el mensaje y el botón. La
memoria es **una fila en `bot_proposals`**: identificador de propuesta,
`correspondent_id`, `match_id` propuesto, los campos propuestos, las referencias
a los dos objetos crudos ya archivados, y su caducidad.

**La fila no guarda ningún identificador de Telegram**, y no le hace falta: para
contestar el callback y editar la tarjeta basta con lo que el propio callback
trae. Lo único que la fila necesita del remitente es el `correspondent_id`, y
sirve para lo que importa: **solo el mismo corresponsal puede confirmar su
propia propuesta**.

**La fila se borra al resolverse** —confirmada, descartada o caducada—, así que
no es un segundo domicilio durable del `correspondent_id`. Lo que sobrevive a la
resolución es el archivo, bajo el plazo de ADR-023. `bot_proposals` **no es
modelo canónico**, no es un log y RN-13 no la alcanza: registra un acto en curso,
como `ingest_attempts` registra un acto del tick.

### §5. La identidad del partido se resuelve contra una lista cerrada de candidatos, no contra el catálogo de alias

**El catálogo de alias de ADR-018 no se usa para el corresponsal, y no es un
olvido.** Un catálogo de alias es *enrutado vigente de una fuente*: las grafías
de `ceroacero.es` son estables y finitas, se declaran una vez y se reemplazan
enteras. Las de una persona escribiendo con una mano desde una banda no son ni
estables ni finitas, y el todo-o-nada de ADR-018 §3 las dejaría sin resolver casi
siempre. Además, la carga de un catálogo **barre las filas `proposed` de su
`(source, season)`** (F-SPEC-011-4): un catálogo `corresponsal` sería una mina
con cartel.

**En su lugar: candidatos cerrados.** El bot calcula la lista de partidos
elegibles —los del **calendario declarado** (ADR-017), dentro de la ventana del
corresponsal, de las competiciones que el catálogo declara para esa persona, y
dentro de una jornada de medición declarada (§7)— y **se la pasa al LLM con sus
nombres canónicos de la RFGF y su `match_id`**. El esquema zod exige que el
`match_id` devuelto sea **uno de los candidatos entregados**; cualquier otra cosa
es salida inválida.

Consecuencias queridas: la identidad del partido nunca la inventa el LLM, sale
del calendario declarado, que es la lista de autoridad (ADR-017); los nombres que
ve la persona en la tarjeta son los canónicos y **no los que ella escribió**; y
cero candidatos o más de uno **no se resuelven adivinando**, se le devuelven a la
persona —un aviso, o un teclado para que elija—, que es la forma de todo-o-nada
de ADR-018 §3 traducida a un canal donde hay alguien delante.

**La ventana del corresponsal es suya y no la del tick.** `PRE`/`POST` de
ADR-019 §2 (10 y 150 min) acotan cuándo se le pide algo a un tercero; una persona
puede avisar de un aplazamiento dos horas antes. Los dos números viven como
constantes nombradas en un solo sitio (`src/bot/windows.ts`), **elegidos y no
medidos** —como los de ADR-019 §2 y las 6 h de ADR-014 §3.2—, y moverlos es un
diff de una línea.

### §6. El LLM propone; su cliente es nuestro, su entrada no puede transportar identidad, y la persona confirma

**RN-09 y D-4 se cumplen en su forma fuerte: salida JSON validada con zod *y*
confirmación humana.** Antes de la confirmación **no existe ninguna fila en
`observations`**. El LLM no determina nada por sí solo, y ésa es además la
mitigación que mantiene el art. 22 del RGPD fuera de juego.

**Proveedor: Anthropic, por API HTTP, con un cliente propio y delgado en
`src/bot/llm.ts`.** No se añade un SDK: la llamada es un `POST` con cuerpo JSON,
y el proyecto ya tiene una frontera cerrada sobre las dependencias declaradas
(SPEC-009) a la que un SDK entero pediría entrada para reintentos y *streaming*
que nadie usa. El identificador del modelo vive en **una constante nombrada en un
solo sitio**, es **elegido y no medido**, y **se verifica contra la documentación
vigente del proveedor en el momento de implementar; no se copia de memoria**.

**La llamada al LLM es una petición de salida y se declara como tal.** No es
scraping y **RN-11 no la alcanza** —no se le pide un marcador a un tercero, se le
manda nuestro propio texto a un encargado del tratamiento—, pero el cierre de
salida que sostienen ADR-014 y SPEC-009 es de **capacidad**, no de intención: la
entrada del cliente del LLM se añade a la lista de lo permitido **con su motivo
escrito, visible en el diff**, y no se abre ninguna vía nueva.

**Y el tipo de entrada del constructor del prompt no puede transportar un
identificador.** La firma es de la forma `buildPrompt(input: { text: string;
candidates: readonly MatchCandidate[] }): string`: sin corresponsal, sin
identificador de chat, sin nombre. **Que lo impida el tipo, no la disciplina.**
Ni el prompt de sistema ni el esquema de la salida nombran a una persona.

Lo que este mecanismo **no** alcanza, y se escribe aquí para que un criterio
pueda repetirlo (ADR-016 §6): **no impide que el corresponsal firme el mensaje
con su nombre dentro del propio texto**. Eso es suyo, es inevitable y se trata
donde se puede tratar — en el aviso del bot, que le dice qué no hace falta
escribir (ADR-023 §5).

### §7. El bot nace inerte: fuera de una jornada de medición declarada no recoge nada

El bot está sujeto a **la misma llave que el tick**: la lista cerrada de
**jornadas de medición declaradas** de `src/ingest/measurement.ts` (ADR-019 §3),
que **nace vacía**. Fuera de una jornada declarada el bot **contesta una frase
neutra y no archiva, no persiste y no llama al LLM**.

El motivo no es RN-11 —el bot no le pide nada a nadie— sino el mismo que hizo esa
lista: que «es medición, no producción» sea verdad **en la forma del código y no
en la intención**. Un bot que solo puede recoger dentro de una jornada declarada
es un bot estructuralmente incapaz de acumular texto libre de personas la
temporada entera, que es exactamente lo que ADR-023 §2 necesita poder afirmar.

**Consecuencia querida y visible: SPEC-015 entrega un bot apagado.** Como
SPEC-012 entregó un cron que no pide nada. Encenderlo es un acto del operador con
precondiciones escritas (ADR-023 §6).

### §8. La lengua es una preferencia explícita persistida, con galego por defecto — nunca el `language_code`

**Telegram no ofrece galego**, así que el `language_code` de casi todos los
corresponsales gallegos llega como `es`. **Si la lengua del bot se infiere del
cliente, el galego por defecto deja de existir de facto y D-2 se incumple sin que
nadie lo vea.**

Decisión: la lengua es una **preferencia por corresponsal, persistida y
explícita**, con **galego por defecto** cuando no hay preferencia, cambiable con
`/lingua`. **`language_code` no se lee nunca** — de hecho no está en la lista
blanca de §3, así que ni siquiera llega a existir dentro del proceso. Es la misma
decisión que ya está escrita en la cabecera de `src/i18n/site.ts` —*la lengua
viene de la URL, nunca del cliente*— trasladada a un canal sin URL: **nunca del
cliente, siempre del registro del corresponsal**.

Todo texto visible sale de `src/i18n/` con contrato compartido por las dos
lenguas: los mensajes, las etiquetas de los botones, **las descripciones de
`setMyCommands`** y **la ficha del bot en BotFather**, que es texto visible para
cualquiera que la abra.

### §9. El bot no publica: escribe `Observation` y llama al motor por una puerta estrecha

**RN-08 y D-3 no tienen excepción para el corresponsal**, y `reglas.md` lo dice
con esas palabras. El bot **no escribe ninguna `Decision`**: tras confirmar,
persiste la `Observation` y llama al motor.

**Y lo llama por una puerta que no le entrega la capacidad.** `applyEngine`
necesita un `EnginePorts` que lleva un `DecisionStore` dentro, y
`composeCyclePorts` devuelve otro tanto: importar cualquiera de los dos pondría
al bot en posesión de la capacidad que RN-08 le niega —es, literalmente, el
residuo **F-SPEC-013-11**, cuyo disparador escrito es «el día que un módulo fuera
de `src/decide/` importe cualquier cosa de `src/decide/` que devuelva un almacén
de decisiones», y ese día es hoy—.

Decisión: `src/decide/` gana **un fichero nuevo** con una entrada estrecha cuyo
tipo de retorno **no contiene ningún almacén** —del orden de
`runEngineForMatch({ sql, matchId, now }): Promise<EngineOutcomeSummary>`—, y el
bot la importa **por nombre**, nunca como *namespace*. `src/decide/` ya está
dentro de `DECISION_WRITERS`, así que el fichero nuevo no ensancha la frontera ni
obliga a tocar ningún fichero de SPEC-013.

**Lo que esto cierra y lo que no.** Cierra el disparador de F-SPEC-013-11 *para
este llamante*: el bot obtiene lo que necesita sin obtener la capacidad. **No
cierra el residuo**, porque `composeCyclePorts` sigue siendo superficie pública y
el siguiente llamante podrá usarla. Ese cierre —despublicarla, o nombrar el
residuo en la letra de SPEC-013 CA-13.3— sigue en EPIC-MEJORA, y tocarlo sería
tocar una spec `hecho` sin motivo propio.

**Y el motor corre en el acto, no en el tick siguiente.** ADR-021 §3 declara
**dos disparadores** —llega una `Observation`; no llega nada y el reloj
avanzó— y esto es el primero, en su forma más literal. §4 del mismo ADR fija
cuándo corre **dentro del tick**, que es lo que el tick necesitaba saber, no una
exclusividad. Esperar al minuto siguiente añadiría hasta 60 s a la fuente humana
más rápida del sistema, **justo sobre la primera cifra que la épica mide**.

### §10. Lo que este ADR no decide

- **La retención de este archivo y el régimen de datos personales**: ADR-023.
- **El panel del operador**, que es la spec siguiente. Aquí no hay bandeja de
  alertas, ni corrección, ni peso 1.0.
- **Cómo se ve un marcador**: no hay snapshot ni página. El bot no enseña
  ningún resultado publicado, solo acusa lo que él mismo recogió.
- **El hueco de `qualifiers` en `src/i18n/es.ts`**: el bot muestra estados, no
  cualificadores. Lo cierra la spec del marcador.
- **Si el LLM propone alias de equipo** (la vía `proposed` de RN-09 que ADR-018
  dejó apuntada al bot). Aquí el LLM elige entre candidatos con nombre canónico;
  proponer alias es otra cosa y otra spec.

## Consecuencias

### Positivas

- **La cuarta cifra pasa a ser medible.** Con el bot y el panel, los minutos de
  operación manual por jornada dejan de ser una estimación.
- **La persona queda fuera del motor.** Ningún join que el motor haga toca al
  corresponsal: `source` es `'corresponsal'` y nada más, y el seudónimo vive en
  el archivo. Es a la vez la decisión técnica barata y la de privacidad fuerte.
- **Una solicitud de supresión se atiende sin tocar el log inmutable**: se borra
  el mapeo. Es lo que hace convivir RN-13 con el art. 17 del RGPD (ADR-023 §4).
- **El repositorio público sigue sin publicar un identificador personal**, con la
  misma política sin excepciones que ADR-009 §3 fijó para el HTML.
- **RN-09 se cumple en su forma fuerte y visible**: hay un instante exacto —el
  botón— antes del cual `observations` no tiene ninguna fila.
- **El disparador de F-SPEC-013-11 llega y se contesta**, en vez de ensancharse
  en silencio.

### Negativas / follow-ups

- **Tres objetos crudos por observación confirmada**, dos de ellos colgantes.
  Es más archivo y más superficie de purga que cualquier fuente automática. Se
  acepta: son kilobytes, y sin ellos no hay auditoría de RN-09.
- **El mapeo en entorno hace que el art. 17 sea un acto manual del operador, no
  una operación ejecutable.** Con un corresponsal es barato y tiene ceremonia
  escrita (ADR-023 §4). **Disparador para revisarlo: el día que haya más de tres
  corresponsales, o el primero que no sea el autor.**
- **El segundo segmento de la clave del archivo del corresponsal no es una
  competición.** Es una irregularidad declarada (§3) y quien lea claves bajo
  `corresponsal/` tiene que conocerla.
- **`corresponsais/<temporada>.json` se aparta de la forma de ADR-018** (fichero
  + CLI + tabla + registro de carga): es un módulo importado, sin base y sin CLI.
  El precio es que dar de alta o de baja a alguien **exige un despliegue**; la
  baja inmediata no, porque la ejerce una fila de exclusión. **Disparador para
  darle la forma de ADR-018: el segundo corresponsal.**
- **La lista de jornadas declaradas vacía deja el bot apagado**, así que ninguna
  suite prueba el camino completo contra Telegram real. Se prueba entero con
  dobles y con una lista inyectada, como SPEC-013 probó la segunda vía de RN-02.
- **Anthropic es un encargado del tratamiento en un tercer país**, y su plazo de
  retención no lo mandamos nosotros. ADR-023 §3 lo trata, y deja **cuatro puntos
  marcados como pendientes de revisión profesional**.

## Alternativas consideradas

- **Long-polling con grammY, o `getUpdates` desde el tick del cron.** Rechazadas.
  El long-poll necesita un proceso vivo que ADR-004 dice que no hay. El
  `getUpdates` desde el tick sí cabría —una llamada más por minuto— pero **añade
  hasta 60 s de latencia a la fuente humana más rápida**, y la latencia es la
  primera cifra de la épica: se estaría midiendo el planificador, no al
  corresponsal.
- **`telegram_user_id` numérico en las filas inmutables.** Rechazada, y con
  firmeza: es un identificador transversal, estable de por vida y compartido con
  todos los bots que esa persona use. En un log que RN-13 prohíbe borrar, es un
  **identificador directo imborrable**, y convierte las filas en una clave de
  enlace con el ecosistema de Telegram.
- **Un hash o seudónimo derivado del `telegram_user_id`.** Rechazada, con matiz.
  Sigue siendo dato personal; si el *salt* es una constante del repositorio —**y
  el repositorio es público**— el hash es reversible por fuerza bruta trivial,
  porque basta probar un puñado de ids plausibles; y cuesta la legibilidad que
  RN-12 necesita, porque la trazabilidad la lee **una persona**:
  `corresponsal-01` se lee, `a3f9c1…` no. Queda como plan B solo si un catálogo
  declarado resultara imposible.
- **Archivar el update íntegro.** Rechazada. Ni la minimización lo admite ni
  RN-10 lo pide: su finalidad, escrita en la propia regla, no incluye campos que
  ningún parser lee. Ver §3 para por qué esto no es lo que ADR-009 rechazó.
- **No archivar nada del corresponsal.** Rechazada: RN-10 no tiene excepción por
  fuente, y sin el mensaje original no se puede recalibrar el parseo del LLM ni
  auditar qué propuso frente a qué confirmó la persona — que es la mitad de la
  garantía de RN-09.
- **Extender el catálogo de alias de ADR-018 con una fuente `corresponsal`.**
  Rechazada por §5: grafías no acotadas, todo-o-nada que fallaría casi siempre, y
  la mina de F-SPEC-011-4.
- **Que el LLM devuelva nombres de equipo libres y resolverlos después.**
  Rechazada: reintroduce el problema de identidad que ADR-017 y ADR-018 ya
  resolvieron declarando, y deja que el modelo invente un partido que no existe
  en el calendario.
- **Un SDK de proveedor de LLM.** Rechazada por §6: una dependencia entera en una
  frontera cerrada, para un `POST`.
- **Mandar el `correspondent_id` al LLM «para dar contexto».** Rechazada. No
  aporta nada al parseo y saca el seudónimo del dominio en el que es seguro.
- **Inferir la lengua del `language_code` de Telegram.** Rechazada por §8: es la
  única de estas decisiones que rompe un *locked* (**D-2**) **sin que nadie lo
  vea**, porque el resultado —todo el mundo en castellano— parece funcionar.
- **Guardar el `chat_id` en la propuesta pendiente «por comodidad».** Rechazada:
  el callback ya trae lo necesario, así que sería un identificador de Telegram
  guardado a cambio de nada.
- **Que el bot escriba la `Decision` directamente cuando el corresponsal
  confirma.** Rechazada sin discusión: es exactamente lo que RN-08 y D-3
  prohíben, con el corresponsal nombrado en la propia regla.
- **Que el bot componga `EnginePorts` con `composeCyclePorts`.** Rechazada por
  §9: funciona y pasa los tres gates de hoy, y eso es precisamente lo que la
  hace mala — sería ejercer el agujero que un verificador ya midió y dejó
  escrito.
