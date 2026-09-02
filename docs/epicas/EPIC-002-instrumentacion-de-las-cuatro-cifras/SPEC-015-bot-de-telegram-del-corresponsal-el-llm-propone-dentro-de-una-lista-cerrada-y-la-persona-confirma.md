---
id: SPEC-015
tipo: spec
epica: EPIC-002
estado: borrador
aprobada-por:
historial:
  - {estado: borrador, fecha: 2026-09-02, por: sdd-arquitecto}
---
# SPEC-015 — Bot de Telegram del corresponsal: el LLM propone dentro de una lista cerrada y la persona confirma

> Sigue la descomposición orientativa de `_epica.md` —adaptador ✓ (SPEC-008) ·
> frontera RN-11 ✓ (SPEC-009) · calendario y repositorios ✓ (SPEC-010) ·
> catálogo de alias ✓ (SPEC-011) · cron de ingesta ✓ (SPEC-012) · motor de
> decisiones ✓ (SPEC-013) · **bot de Telegram** · panel · snapshot · cifras—.
> Su precondición está satisfecha desde el 2026-09-02: SPEC-013 es `hecho`, el
> motor existe y `decisions` ya se puede escribir por la única puerta que RN-08
> autoriza.
>
> **Va antes que el snapshot y las cifras, y no por gusto.** Con una sola fuente
> automática capturable (ADR-008 §1) nada llega a *confirmado* sin una persona, y
> la cuarta cifra de la épica —minutos de operación manual, con corte duro en 30,
> la que decide si esto pide comunidad de corresponsales en vez de producto— **no
> se puede medir sin este bot**.
>
> Trae **dos ADR en `borrador`**: **ADR-022** (el webhook, la identidad seudónima
> declarada, qué se archiva, dónde vive la conversación, la lista cerrada de
> candidatos, el LLM y la lengua) y **ADR-023** (la retención de este archivo y
> su régimen de datos personales, que **ni ADR-009 ni ADR-020 cubren**).
>
> Y trae **dos dictámenes de dominio ya emitidos**, copiados enteros en
> `dictamenes-SPEC-015.md` (mismo directorio). No se resumen: se citan.

## Problema

**Nada entra en el sistema desde una persona, y sin eso EPIC-002 no puede
terminar.** SPEC-012 abrió el camino fuente → archivo → `Observation` y SPEC-013
cerró el de `Observation` → `Decision`. Los dos corren sobre **una** fuente
automática de peso 0.7, y la aritmética de EPIC-002 ya está hecha: la segunda vía
de RN-02 —dos fuentes independientes de peso ≥ 0.7 que coinciden— está **cerrada**
(ADR-008 §1), así que **todo lo que hoy puede publicar el sistema sale
*provisional*, sin excepción**. Los caminos humanos de RN-01 —corresponsal 0.8,
operador 1.0 con precedencia— dejaron de ser accesorios el día que se supo eso, y
`src/decide/roles.ts` ya les tiene el asiento puesto: `'corresponsal'` →
`correspondent` → 0.8. **Lo que no existe es nada que produzca esa
`Observation`.**

Y hay una cifra concreta que espera a esta spec y a ninguna otra: **los minutos
de operación manual por jornada**. Es la única de las cuatro con un corte duro
—30 min— y la única cuyo resultado cambia la épica siguiente: por encima de ese
corte, `docs/roadmap.md` dice que lo que toca es «comunidad de corresponsales», no
«producto». Esa cifra se mide con una persona, un cronómetro y un canal por el que
mandar lo que ve. **El canal es esto.**

**Lo difícil no es el bot.** Un webhook que recibe un JSON y contesta es media
tarde. Lo difícil es que este bot es, a la vez, **el primer sitio del proyecto
donde entra texto libre escrito por una persona**, **el primero que llama a un
tercero que no es una fuente de resultados**, y **el primero cuyo canal de salida
es una URL pública que cualquiera puede encontrar**. De ahí salen cinco
exigencias que no se pueden dejar a la improvisación, y ninguna es opcional:

1. **RN-09 y D-4 en su forma fuerte.** «Un LLM nunca es la única fuente de un
   marcador… salida JSON validada **y confirmación humana**.» Este bot es
   exactamente el punto del sistema donde esa regla se ejerce o se incumple: hay
   un instante —el botón— antes del cual `observations` no puede tener ni una
   fila.
2. **RN-10 sobre un objeto que lleva datos personales.** Archivar el update
   íntegro metería nombre civil y `@username` en un archivo que además
   caducará —o no— según un plazo que hoy **no tiene dueño**: ni ADR-009 ni
   ADR-020 alcanzan a este archivo, y sus alcances son textuales.
3. **RN-13 contra el derecho de supresión.** Las `Observation` no se borran. Si
   la persona está identificada dentro de ellas, se ha creado un identificador
   personal imborrable, y **el repositorio es público**.
4. **RN-08 sin atajo para el corresponsal**, que la propia regla nombra. Y con
   una mina puesta: el residuo **F-SPEC-013-11** dejó escrito que la capacidad de
   escribir `Decision` se obtiene de la superficie pública de `src/decide/`
   pasando los tres gates, con disparador «el día que un módulo fuera de
   `src/decide/` importe cualquier cosa de `src/decide/` que devuelva un almacén
   de decisiones». **Ese día es hoy.**
5. **D-2 rompiéndose en silencio.** Telegram no ofrece galego: si la lengua sale
   del `language_code` del cliente, casi todos los corresponsales gallegos
   entrarán como castellano y el galego por defecto **deja de existir de facto
   sin que nadie lo vea, porque el resultado parece funcionar**.

**Lo que esta spec no arregla, dicho en la primera línea:** no construye el panel
del operador —es la spec siguiente, y aquí no hay peso 1.0, ni precedencia, ni
bandeja de alertas—; no enseña ningún marcador a nadie —no hay snapshot ni
página—; no produce ninguna de las cuatro cifras; no escribe la página
`/privacidade` que el aviso del bot enlaza (ADR-023 §6); y **entrega un bot
apagado**: con la lista de jornadas de medición vacía y el catálogo de
corresponsales vacío, el webhook contesta y no recoge nada.

## Usuarios / roles afectados

- **El corresponsal del spike** (el autor, RN-01): la persona con el móvil en la
  banda. Manda lo que ve, lee una tarjeta con los **nombres canónicos de la
  RFGF** —no los que él escribió— y confirma o descarta. Lo que confirma sale
  *provisional*, porque 0.8 < 0.9, y él es **humano** a efectos de RN-04 y RN-06:
  puede bajar un marcador y puede aplazar un partido. Su experiencia es la cuarta
  cifra de la épica: cada segundo que le cuesta se mide.
- **`sdd-implementador`**: construye `src/bot/` entero, `src/i18n/bot-bundle.ts`
  y `bot.ts`, el espacio de nombres de estados en las dos lenguas,
  `src/app/api/telegram/webhook/route.ts`, `src/db/bot.ts`, `migrations/0007`, un
  fichero nuevo en `src/decide/` con la puerta estrecha de CA-9, y las suites.
  Toca `src/i18n/gl.ts` y `es.ts` para añadir un espacio de nombres, que es la
  vía de crecimiento que ya usaron SPEC-005 y SPEC-006. La rama tiene que nombrar
  `SPEC-015`, o el hook `require-spec` deniega la escritura sobre `src/` y
  `tests/`. Necesita `DATABASE_URL_TEST` desde CA-7.
- **`sdd-verificador`**: corre `npm run lint`, `npm test` y `npm run test:db`;
  sin `DATABASE_URL_TEST` los criterios con base son **UNMET, no *skipped***
  (gate del 2026-08-29). Aquí su trabajo tiene un centro claro: **CA-3, CA-5 y
  CA-2 son fronteras de capacidad en la forma de ADR-016**, y son las que dicen si
  esta spec protege algo o solo lo promete. Que compruebe los controles positivos
  uno por uno, que apague cada mecanismo y vea el rojo, y que lea los residuos
  declarados dentro de cada criterio: si un residuo falta, es *finding* con
  destino `sdd-arquitecto`, no una corrección del test.
- **`sdd-arquitecto`**: si el gate firma, **escribe las cinco filas de estados en
  `docs/fundacion/dominio.md` antes de que la implementación empiece** —esta spec
  ya las propone, pero la elección entre *En xogo* y *Directo* la firma una
  persona (nota §3)—, y deja la enmienda de ADR-015 en el ledger de SPEC-007 si el
  gate resuelve la identificación del responsable (ADR-023 §5).
- **El operador del spike** (el autor otra vez, con otro sombrero): hereda **seis
  precondiciones fuera del código** para poder encender el bot (ADR-023 §6) y una
  ceremonia de purga con fecha antes y acuse después. Sus minutos cuentan para la
  cifra.
- **`sdd-legal-datos`** y **`sdd-lingua`**: **ya dictaminaron**, el 2026-09-02.
  Sus informes están enteros en `dictamenes-SPEC-015.md` y esta spec los cita por
  punto. **No hay que volver a consultarlos** salvo por el disparador escrito:
  fútbol base (menores) en los partes de corresponsal.
- **`sdd-documentalista`**: `src/bot/`, `corresponsais/` y `docs/legal/` son
  estructura nueva en `CLAUDE.md`; `migrations/0007`, una migración más. Tras el
  GREEN.

## Diseño

### §1. Qué se construye, y en qué orden se lee

```
src/bot/
  webhook.ts      el handler: secreto, autorización, encaminamiento. Falla cerrado
  correspondents.ts  el catálogo declarado (módulo) y el mapeo (entorno)
  redact.ts       la lista blanca de claves de ADR-022 §3, y solo ella
  archive.ts      los tres objetos crudos, por captureThenParse (RN-10)
  candidates.ts   la lista cerrada de partidos elegibles, del calendario declarado
  windows.ts      PRE/POST del corresponsal, nombrados, en un solo sitio
  llm.ts          el cliente delgado y el modelo, en una constante
  prompt.ts       buildPrompt: su tipo de entrada no puede llevar identidad
  proposal.ts     el esquema zod de la propuesta y su validación contra candidatos
  card.ts         la tarjeta de confirmación y su teclado
  commands.ts     /start /axuda /partidos /cancelar /lingua /privacidade /baixa /parar
  observation.ts  la Observation de peso 0.8, tras el botón
  ports.ts        los puertos nuevos (catálogo, propuestas, estado, contador)
  telegram.ts     la salida: grammY Api, y nadie más habla con Telegram
src/decide/engine-entry.ts   la puerta estrecha: no devuelve ningún almacén (CA-9)
src/db/bot.ts     los puertos de arriba sobre Postgres, SQL etiquetado
src/i18n/bot-bundle.ts · bot.ts        contrato y resolutor del bot
src/i18n/statuses-bundle.ts · statuses.ts   los cinco estados, gl y es
src/app/api/telegram/webhook/route.ts  POST que delega entero, como el cron
migrations/0007   bot_proposals · correspondent_state · bot_rejections
corresponsais/<temporada>.json          el catálogo declarado, versionado
```

`src/model/` **no cambia**: el bot no añade ni un campo al modelo canónico.
`src/ingest/`, `src/polite/`, `src/calendar/`, `src/alias/` y `src/decide/`
tampoco se editan: son de specs `hecho` y esta compone sobre sus API públicas.
La única excepción es un **fichero nuevo** bajo `src/decide/` (§5), que no toca
ninguno de los existentes.

### §2. El camino de un mensaje, en el orden exacto en que ocurre

El orden **es** la spec. Cada flecha es una garantía que un criterio afirma.

```
POST /api/telegram/webhook
  1. secreto  ─────────────► no coincide ⇒ 401. Cero archivo, cero filas, cero contador de mensaje
  2. autorización ─────────► remitente no mapeado ⇒ frase neutra. Cero archivo, cero filas, +1 contador
  3. jornada declarada ────► fuera de jornada ⇒ frase neutra. Cero archivo, cero filas
  4. redacción (lista blanca)
  5. ARCHIVO del mensaje ──► RN-10: antes de mirar el texto
  6. candidatos ───────────► del calendario declarado, ventana del corresponsal, competiciones del catálogo
  7. LLM ──────────────────► entrada: texto + candidatos. Nada más puede entrar
  8. ARCHIVO de la respuesta ─► RN-10: antes de validarla
  9. zod + match_id ∈ candidatos ─► inválido ⇒ aviso. Cero Observation
 10. propuesta pendiente + TARJETA ─► aquí NO hay ninguna fila en observations
 ───────────────────────── la persona mira ─────────────────────────
 11. callback: secreto, autorización, mismo corresponsal
 12. ARCHIVO del callback ─► RN-10
 13. descartar / caducar ─► acuse. Cero Observation. Fila de propuesta borrada
 14. confirmar ───────────► Observation(source='corresponsal', confidence=RN01_WEIGHTS.correspondent,
                              raw_ref = objeto del paso 5) → append → puerta estrecha del motor
 15. acuse ───────────────► «rexistrado», y que todavía no está publicado
```

**Los pasos 1, 2 y 3 son fronteras negativas**, y las tres se afirman igual: no
solo «contesta lo que toca», sino **cero objetos crudos, cero filas y ningún
identificador en ninguna traza**. Un update rechazado ya ha sido recibido
—Telegram empuja antes de que nosotros decidamos—, así que lo único que puede
hacer la spec es garantizar que **no deja rastro**: se cuenta, y el contador es
un agregado sin persona dentro.

### §3. Por qué el LLM elige entre candidatos y no escribe nombres

El catálogo de alias de ADR-018 resuelve **todo o nada** contra las grafías de
una fuente, que son estables y finitas. Las de alguien escribiendo con una mano
desde una banda no lo son, y además cargar un catálogo **barre las filas
`proposed` de su `(source, season)`** (F-SPEC-011-4, mina con cartel ya escrita).

Así que la identidad del partido **no se busca: se ofrece**. El bot calcula los
partidos elegibles del **calendario declarado** —la lista de autoridad de
ADR-017— y se los pasa al modelo con su `match_id` y su nombre canónico. El
esquema zod exige que el `match_id` devuelto **sea uno de los entregados**; el
resto es salida inválida. Consecuencias, y las tres son deliberadas: el modelo no
puede inventar un partido; la persona ve en la tarjeta **los nombres canónicos de
la RFGF y no los suyos**; y cero candidatos o más de uno **no se adivinan**,
vuelven a la persona.

**La ventana del corresponsal no es la del tick.** `PRE`/`POST` de ADR-019 §2
acotan cuándo se le pide algo a un tercero; una persona puede avisar de un
aplazamiento dos horas antes de la hora prevista. Son dos constantes nombradas en
`src/bot/windows.ts`, **elegidas y no medidas** —como las de ADR-019 §2 y las 6 h
de ADR-014 §3.2—, revisables con la primera jornada delante.

### §4. Dónde vive la persona, y dónde no

**En `Observation.source` no vive.** Es exactamente `'corresponsal'`, sin sufijo:
`roleOf` falla cerrado ante un `SourceId` desconocido (ADR-021 §8.4) y un
`corresponsal:01` reventaría el motor y obligaría a tocar SPEC-013, que está
`hecho`.

**Vive en el objeto crudo redactado, y en ningún otro sitio durable.** El
`correspondent_id` —`corresponsal-01`, un token local sin nombre ni localidad
dentro— se archiva **en lugar** de `from.id` y `chat.id`. La cadena de RN-12
sigue entera y verificable: `Decision` → `supporting_observation_ids` →
`Observation(raw_ref)` → objeto crudo → `correspondent_id`. La fila de propuesta
pendiente lo nombra mientras la propuesta existe, y **se borra al resolverse**.

**El mapeo `correspondent_id → telegram_user_id` no se versiona jamás.** Mismo
razonamiento que ADR-009 §3 escribió para el HTML de terceros —git no se purga,
se reescribe— aplicado a un dato peor, y en un repositorio **público**. Vive en
entorno, y **quién puede leerlo es una frontera de capacidad** (CA-2).

### §5. Cómo llama al motor sin obtener la capacidad que RN-08 le niega

`applyEngine` pide un `EnginePorts` que lleva un `DecisionStore` dentro, y
`composeCyclePorts` devuelve otro tanto: importar cualquiera de los dos pondría
al bot en posesión de la capacidad de escribir `Decision`. Es literalmente el
residuo **F-SPEC-013-11**, y su disparador escrito llega hoy.

`src/decide/` gana **un fichero nuevo** con una entrada estrecha cuyo tipo de
retorno **no contiene ningún almacén**, del orden de
`runEngineForMatch({ sql, matchId, now })`. El bot la importa **por nombre** —un
`import * as` sobre `src/decide/` sí sería infracción, y con razón—. `src/decide/`
ya está dentro de `DECISION_WRITERS`, así que el fichero nuevo **no ensancha la
frontera y no obliga a tocar ningún fichero de SPEC-013**.

Esto **cierra el disparador para este llamante y no cierra el residuo**:
`composeCyclePorts` sigue siendo superficie pública. Ese cierre sigue en
EPIC-MEJORA, con su disparador actualizado (nota §6).

Y el motor **corre en el acto**, no en el tick siguiente: ADR-021 §3 declara dos
disparadores y esto es el primero en su forma más literal. Esperar al minuto
siguiente añadiría hasta 60 s a la fuente humana más rápida, **justo sobre la
primera cifra que la épica mide**.

### §6. Por qué el bot nace apagado

El bot está sujeto a la misma llave que el tick: la lista cerrada de **jornadas
de medición declaradas** (ADR-019 §3), que nace vacía. Fuera de una jornada
declarada contesta una frase neutra y **no archiva, no persiste y no llama al
LLM**.

No es RN-11 —el bot no le pide nada a nadie—: es que «es medición, no
producción» sea verdad **en la forma del código y no en la intención**. Un bot
estructuralmente incapaz de acumular texto libre de personas la temporada entera
es lo que hace que aprobar esta spec no sea aprobar la exposición, y es lo que
sostiene el plazo de ADR-023.

## Criterios de aceptación

- **CA-1 — El webhook rechaza antes de tocar el cuerpo, y falla cerrado
  (ADR-022 §1, art. 32 del RGPD, RN-08).**
  Dado el handler de `src/bot/webhook.ts` con su entorno inyectado,
  cuando llega una petición,
  entonces:
  1. `TELEGRAM_WEBHOOK_SECRET` ausente o vacío ⇒ **401** sin invocar ninguna otra
     parte del bot. Un caso lo afirma con dobles que registran si fueron
     llamados, y **todos** están sin llamar.
  2. Cabecera `X-Telegram-Bot-Api-Secret-Token` distinta del secreto ⇒ 401. La
     comparación es de **tiempo constante** y un caso comprueba que no hay
     ninguna comparación con `===` sobre el secreto en el módulo.
  3. Un update con secreto inválido deja **cero objetos en el raw store, cero
     filas en toda la base y ninguna traza que contenga un identificador de
     Telegram**. El caso enumera el raw store entero con `list('')` y cuenta las
     filas de las tres tablas de `migrations/0007` más `observations`.
  4. Método distinto de `POST`, o cuerpo que no parsea como JSON ⇒ respuesta de
     error **sin archivar nada**.
  5. La respuesta se construye con `new Response(JSON.stringify(body), …)` y
     **nunca** con `Response.json`, que la lista cerrada de SPEC-009 no permite.
     La suite cerrada de SPEC-009 pasa sin tocar una aserción.
  6. La ruta `src/app/api/telegram/webhook/route.ts` **no tiene lógica**: delega
     entera, como `src/app/api/cron/ingest/route.ts`. Un caso afirma que el
     fichero de la ruta no importa nada de `src/db/`, `src/raw/` ni `src/decide/`.

- **CA-2 — La lista cerrada de corresponsales, y el mapeo que ningún camino del
  código puede leer de un fichero del repositorio (ADR-022 §2, ADR-016, ADR-009
  §3).**
  Dado el catálogo declarado `corresponsais/<temporada>.json`, validado con zod, y
  el mapeo en la variable de entorno `TELEGRAM_CORRESPONDENTS`,
  entonces:
  1. Un remitente **no mapeado** recibe una respuesta neutra y deja **cero
     objetos crudos, cero filas en `observations`, `bot_proposals` y
     `correspondent_state`**, y **ninguna traza con su identificador ni su
     nombre**: lo único que crece es un contador agregado en `bot_rejections`,
     cuya fila **no tiene ninguna columna capaz de albergar un identificador de
     persona** —un caso lo afirma leyendo el esquema de la tabla, no el código—.
  2. Un remitente mapeado pero **no activo** en el catálogo, o con una fila de
     baja en `correspondent_state`, se trata igual que el no mapeado. La
     respuesta es **la misma cadena** en los tres casos: no confirma ni desmiente
     quién es corresponsal.
  3. **Frontera de capacidad, forma ADR-016.** Una lista exportada con nombre
     —`CORRESPONDENT_MAP_READERS`— enumera los módulos autorizados a leer
     `TELEGRAM_CORRESPONDENTS`, cada entrada con su motivo al lado. Recorriendo
     todo el código versionado fuera de `tests/` **con el mismo lector del
     compilador** que sostiene las fronteras de SPEC-008 y SPEC-013 (un solo
     lector, ADR-016 §5 bis), el conjunto de ficheros que nombran esa variable y
     no están en la lista es **vacío**.
  4. **Control positivo por mecanismo** (ADR-016 §3.4): un fichero sintético
     fuera de la lista que nombre la variable pone rojo un caso nombrado; vaciar
     la lista de nombres vigilados pone rojo otro; y un fichero que el lector no
     sepa clasificar es **rojo**, comprobado contra lo que el compilador publica
     para ese fichero y no contra nosotros.
  5. **El cargador del mapeo no tiene ninguna ruta de código que lea de un
     fichero del repositorio.** Se afirma sobre el **grafo de importaciones** del
     módulo del mapeo —no alcanza `node:fs`, ni directa ni transitivamente—, no
     con un `grep`. Control positivo: añadirle una importación de `node:fs` pone
     rojo el caso.
  6. **Ninguna exención por nombre de fichero** (ADR-016 §3.3): un caso afirma
     que este criterio no tiene ninguna lista de exclusiones propia.
  7. **Residuo declarado dentro del criterio** (ADR-016 §6, obligatorio): estos
     mecanismos **no alcanzan** a un módulo que reciba el mapeo ya leído, por
     inyección, desde un módulo autorizado — la capacidad ahí no cruza ninguna
     frontera que el lector vea, y es exactamente el segundo residuo de SPEC-013
     CA-13.3 en otro sitio. **Destino: EPIC-MEJORA**; **disparador: el día que un
     módulo fuera de `CORRESPONDENT_MAP_READERS` reciba el mapeo por inyección.**
     Tampoco alcanzan a que alguien copie el valor a mano fuera del repositorio:
     eso no es una frontera de código.
  8. El catálogo se valida con zod al cargarse y **rechaza entero** un fichero
     con un `correspondent_id` que no case con el patrón `corresponsal-\d+`: la
     forma prohíbe por construcción `corresponsal-<localidad>` y
     `corresponsal-<nombre>`, que en un repositorio público, cruzados con el
     calendario, identifican a una persona.

- **CA-3 — Lo que se archiva es una lista blanca total, y `message.text` va
  verbatim (RN-10, ADR-022 §3, ADR-016, art. 5.1.c y 25.2 del RGPD).**
  Dado un fixture **sintético** de update de Telegram con `first_name`,
  `last_name`, `username`, `language_code`, `is_bot` e `is_premium` rellenos,
  cuando se archiva,
  entonces:
  1. **Lista blanca total, no lista negra.** El objeto archivado contiene
     **exactamente** las claves de una lista exportada con nombre y su motivo al
     lado —`update_id`, `message.message_id`, `message.date`, `message.text`, el
     `correspondent_id` interno, y del callback su `id`, su `data` y el
     `message_id` de la tarjeta—, y **ninguna otra**. El aserto es sobre el
     conjunto de claves recorrido en profundidad, no sobre las seis prohibidas.
  2. **Las seis claves prohibidas no aparecen ni en el objeto archivado ni en
     ninguna fila persistida.** Un caso recorre el objeto y, después, las tres
     tablas nuevas más `observations`, y el conjunto es vacío en los dos sitios.
  3. **Control positivo:** añadir una clave prohibida al fixture pone rojo un
     caso nombrado; y quitar una clave de la lista blanca pone rojo otro.
  4. **`message.text` se archiva verbatim, byte a byte.** Un caso compara los
     bytes con los recibidos, con un texto que lleva emoji, acentos galegos y un
     salto de línea. **Esto es lo que impide que la redacción destruya el
     sustrato de RN-10** y lo que separa esta decisión de la que ADR-009 rechazó.
  5. `from.id` y `chat.id` **no se archivan**: en su lugar va el
     `correspondent_id`. Un caso lo afirma con el fixture, cuyo `from.id` es un
     número reconocible que no aparece en ningún byte del objeto.
  6. **Residuo declarado dentro del criterio** (ADR-016 §6): la lista blanca **no
     alcanza** al contenido del propio `message.text` — si la persona firma con su
     nombre dentro del texto, ahí se queda. Es inevitable, y se trata donde se
     puede: en el aviso, que le dice qué no hace falta escribir (CA-14.3).
     **Destino: no es deuda, es el límite del mecanismo, y se declara para que
     nadie lea el criterio como si prometiera más.**

- **CA-4 — RN-10: los tres objetos crudos, archivados antes de parsear, y los dos
  colgantes declarados (RN-10, D-5, ADR-020 §4, ADR-022 §3).**
  Dado el camino completo de un mensaje confirmado,
  entonces:
  1. Los **tres** objetos —mensaje, respuesta del LLM, callback— se escriben en el
     raw store por `captureThenParse`, que es la única vía sancionada crudo →
     parser. Un caso afirma el **orden** con dobles que registran instantes: el
     `put` del mensaje termina **antes** de que `buildPrompt` sea llamado, y el
     `put` de la respuesta del LLM **antes** de que se valide con zod.
  2. La `Observation` tiene `raw_ref` **del objeto del mensaje**, que es el
     sustrato reprocesable, y ese `raw_ref` existe en el raw store.
  3. **Los otros dos objetos no tienen ninguna `Observation` que los cite, y eso
     es estado legítimo declarado**, con el precedente de ADR-020 §4 en la
     dirección contraria. Un caso lo afirma **como resultado esperado**, no como
     tolerancia.
  4. Las claves de los tres empiezan por `corresponsal/`, de modo que la purga
     tiene un solo prefijo, y su **segundo segmento** es uno de los tres valores
     de una lista cerrada exportada con nombre —`mensaxe`, `proposta`,
     `confirmacion`—. Un caso afirma la lista y que **ninguna clave del archivo
     del corresponsal lleva un `competition_id` real en esa posición**: la
     competición no se conoce antes de parsear (ADR-022 §3).
  5. Un mensaje que **no llega a propuesta** —el LLM devuelve algo inválido—
     deja igualmente su objeto de mensaje archivado y **cero filas** en
     `observations`. El archivo no depende del éxito del parseo: eso es RN-10.

- **CA-5 — El LLM propone, su entrada no puede transportar identidad, y su salida
  se valida (RN-09, D-4, ADR-022 §6, ADR-016).**
  Dada la firma `buildPrompt(input: { text: string; candidates: readonly
  MatchCandidate[] }): string`,
  entonces:
  1. **El tipo lo impide, no la disciplina.** El tipo de entrada **no tiene**
     ningún campo capaz de llevar corresponsal, identificador de chat o nombre, y
     un caso lo comprueba sobre el **tipo** publicado por el compilador, no sobre
     el cuerpo de la función.
  2. **Test de fuga sobre el prompt renderizado:** con un fixture de update cuyos
     `first_name`, `last_name` y `username` son cadenas reconocibles, el string
     final del prompt **no contiene ninguna de las tres**. El aserto va sobre los
     **campos**, nunca sobre el texto del mensaje.
  3. Ni el prompt de sistema ni el esquema de la salida **nombran a una
     persona**, y el contexto de candidatos **no va indexado por persona**: son
     partidos con `match_id` y nombre canónico, nada más.
  4. **Frontera de capacidad, forma ADR-016:** una lista exportada con nombre
     —`LLM_CALLERS`— enumera los módulos autorizados a llamar al proveedor, con su
     motivo; leyendo con el lector del compilador, el complemento es **vacío**.
     Control positivo por mecanismo: un fichero sintético fuera de la lista que
     importe el cliente pone rojo un caso; vaciar la lista de nombres vigilados
     pone rojo otro.
  5. **La llamada es una petición de salida y está declarada como tal.** Su
     entrada se añade a la lista de lo permitido que sostienen SPEC-008 y
     SPEC-009 **con su motivo escrito, visible en el diff**, y las suites cerradas
     de las dos pasan **sin tocar una aserción**. RN-11 **no** la alcanza —no se
     le pide un marcador a un tercero— y el criterio lo dice para que nadie lo
     lea al revés.
  6. **La salida se valida con zod antes de tocar nada** y la validación
     **rechaza**: salida que no parsea, `match_id` que no está entre los
     candidatos entregados, marcador negativo, estado fuera de `MATCH_STATUSES`, o
     marcador presente en una rama sin marcador. En los cinco casos: aviso a la
     persona y **cero filas** en `observations` y `bot_proposals`.
  7. El identificador del modelo vive en **una constante nombrada en un solo
     sitio**, y un caso afirma que no aparece escrito en ningún otro fichero.
  8. **Residuo declarado dentro del criterio** (ADR-016 §6): este mecanismo **no
     alcanza** a que el corresponsal escriba su propio nombre dentro del texto,
     que sí viaja. Es suyo y es inevitable. Y **no alcanza** a lo que el proveedor
     haga con lo recibido: su plazo de retención no lo mandamos nosotros y se
     declara en el aviso (ADR-023 §3), no se promete aquí.

- **CA-6 — La identidad del partido sale de una lista cerrada de candidatos, no
  del catálogo de alias (ADR-017, ADR-018 §3, ADR-022 §5).**
  Dado el calendario declarado cargado y una jornada de medición inyectada,
  cuando llega un mensaje,
  entonces:
  1. Los candidatos son los partidos del **calendario declarado** cuyo `kickoff`
     cae en la ventana del corresponsal, de las competiciones que el catálogo
     declara para ese `correspondent_id`, y dentro de una jornada de medición
     declarada. Un caso afirma los cuatro filtros por separado, cada uno con su
     partido que entra y su partido que no.
  2. `PRE` y `POST` del corresponsal son **constantes nombradas en
     `src/bot/windows.ts`** y **no son** las de `src/ingest/windows.ts`: un caso
     afirma que los dos módulos exportan constantes distintas y que el bot no
     importa las del tick.
  3. Un `match_id` devuelto por el modelo que **no esté entre los candidatos
     entregados** se rechaza. Un caso lo prueba con un `match_id` real de otro
     partido del calendario: sigue siendo rechazado, porque lo que se comprueba es
     la pertenencia a **los candidatos de esta conversación**.
  4. **Cero candidatos** ⇒ aviso, cero filas. **Más de un candidato plausible** ⇒
     la persona elige en un teclado con los **nombres canónicos**, y hasta que
     elige no hay `Observation`.
  5. La tarjeta muestra los **nombres canónicos de la RFGF** tomados del
     calendario declarado, **nunca** el texto que escribió la persona. Un caso lo
     afirma con un mensaje que escribe «ourense» en minúscula y una tarjeta que
     dice el canónico.
  6. **`src/bot/` no importa `src/alias/`**: un caso lo afirma con el lector del
     compilador. Es la forma ejecutable de esta decisión, y evita que alguien
     «arregle» la resolución cargando un catálogo `corresponsal` y despertando la
     mina de F-SPEC-011-4.

- **CA-7 — Nada entra sin confirmación humana, y hay un instante exacto en el que
  eso es comprobable (RN-09, D-4, ADR-022 §4).**
  Dado un mensaje que ha producido una tarjeta,
  entonces:
  1. **Antes del botón, `observations` no tiene ninguna fila para ese partido.**
     Un caso lo afirma contra la base, después de la tarjeta y antes del callback.
     Es el criterio más importante de esta spec.
  2. **Descartar** ⇒ acuse, **cero `Observation`**, y la fila de `bot_proposals`
     **ya no existe**.
  3. **Caducar** ⇒ el mismo resultado, con el aviso que pide reescribirlo por si
     cambió algo. La caducidad es una constante nombrada en un solo sitio.
  4. **Solo el mismo corresponsal puede confirmar su propia propuesta.** Un
     callback de otro `correspondent_id` sobre la misma propuesta se rechaza con
     la respuesta neutra y **no escribe nada**.
  5. Un callback **repetido** sobre una propuesta ya resuelta no produce una
     segunda `Observation`: la fila no existe y el bot contesta que ya no hay nada
     pendiente.
  6. La tarjeta lleva **partido, marcador, minuto y estado**, cada uno con su
     etiqueta, y el estado **con texto**, nunca solo con un glifo — que es
     ADR-013 («ningún estado se codifica solo con color») traducido a este canal.

- **CA-8 — La `Observation` que nace es `corresponsal`, con el peso de RN-01 y su
  `raw_ref` (RN-01, RN-12, RN-13, ADR-021 §8.4).**
  Dada una propuesta confirmada,
  entonces:
  1. `source` es **exactamente** la cadena `'corresponsal'`, y un caso comprueba
     que `roleOf(observation.source)` devuelve `'correspondent'` **sin lanzar**.
     Un caso hermano afirma, como resultado esperado, que `roleOf` **sí lanza**
     con `'corresponsal:01'`: es la razón de la decisión, y se deja medida.
  2. `confidence` se lee de `RN01_WEIGHTS.correspondent` **importado**, nunca
     escrito inline. Un caso cambia la constante en una copia y comprueba que el
     valor de la observación la sigue.
  3. `raw_ref` es obligatorio y apunta al objeto del mensaje (CA-4.2). No hay
     camino que construya una `Observation` sin él: lo impide `ObservationSchema`,
     y un caso lo afirma.
  4. El identificador se **deriva** con la forma que ya usa `src/ingest/`
     —`observationId(rawRef, sourceRef)`—, con la propuesta como `sourceRef`, así
     que confirmar dos veces el mismo objeto es idempotente y `append` devuelve la
     fila almacenada en vez de duplicar.
  5. **Ninguna columna de `observations` lleva el `correspondent_id`**, y un caso
     lo afirma leyendo el esquema de la tabla. La persona queda fuera de todos los
     joins que hace el motor.
  6. Las cinco ramas de estado se pueden producir desde el bot —incluidas
     `postponed` y `suspended`, que RN-06 concede a la fuente oficial **o a un
     humano**, y el corresponsal es humano (RN-01, «Humano en RN-04 y RN-06 son
     los dos»)—. Un caso por rama.

- **CA-9 — El bot no publica: escribe `Observation` y llama al motor por una
  puerta que no le entrega la capacidad (RN-08, D-3, ADR-022 §9, ADR-016,
  F-SPEC-013-11).**
  Dado el fichero nuevo de `src/decide/` con la entrada estrecha,
  entonces:
  1. `src/bot/` **no está** en `DECISION_WRITERS`, y la suite cerrada
     `tests/decide/rn08-frontier.test.ts` (SPEC-013 CA-13) pasa **sin tocar una
     aserción**. El verificador lo comprueba en el diff.
  2. El tipo de retorno de la entrada estrecha **no contiene ningún almacén**:
     ni `DecisionStore`, ni `AlertStore`, ni `EnginePorts`, ni `CyclePorts`. Un
     caso lo afirma sobre el **tipo** publicado por el compilador.
  3. `src/bot/` importa esa entrada **por nombre** y **no hace ningún
     `import * as` sobre `src/decide/`**. Un caso lo afirma con el lector del
     compilador, y un control positivo: convertirlo en namespace pone rojo un caso
     nombrado.
  4. Tras confirmar, **existe una `Decision` para ese partido**, escrita por el
     motor, `provisional: true` (0.8 < 0.9, RN-03) y con la observación del
     corresponsal en `supporting_observation_ids`. **La escribe el motor, no el
     bot**, y eso es lo que el punto 1 protege.
  5. La `Decision` **no transporta nada del texto del mensaje**: solo los campos
     estructurados del modelo canónico. Un caso lo afirma con un texto que lleva
     el nombre de un jugador y comprueba que no aparece en ninguna columna de
     `decisions`.
  6. **Residuo declarado dentro del criterio** (ADR-016 §6): esto cierra el
     disparador de **F-SPEC-013-11** para este llamante y **no cierra el
     residuo** — `composeCyclePorts` sigue siendo superficie pública y el
     siguiente módulo podrá obtener de ella lo que este no obtiene.
     **Destino: EPIC-MEJORA**; **disparador actualizado: la próxima spec que ya
     tenga que tocar `src/decide/cycle.ts` por otro motivo, que es cuando
     despublicarla deja de ser tocar una spec cerrada sin causa propia.**

- **CA-10 — El `correspondent_id` tiene un solo domicilio durable (ADR-022 §2,
  ADR-023 §4, RN-13, art. 17 del RGPD).**
  Dado el sistema tras una jornada sintética con varios mensajes confirmados,
  descartados y caducados,
  entonces:
  1. **Ninguna tabla append-only lleva el `correspondent_id`.** Un caso enumera
     las columnas de **todas** las tablas del esquema —no una lista escrita a
     mano— y comprueba que ninguna de `observations`, `decisions`, `alerts`,
     `ingest_attempts` ni `bot_rejections` puede albergarlo.
  2. `bot_proposals` lo lleva **mientras la propuesta está viva**, y **no queda
     ninguna fila** tras confirmar, descartar o caducar. Un caso cuenta las filas
     al final de la jornada sintética: **cero**.
  3. El objeto crudo redactado **sí** lo lleva, y la cadena de RN-12 se recorre
     entera en un caso: partiendo de una `Decision`, se llega al
     `correspondent_id` sin salir del sistema.
  4. **Ningún fichero del repositorio contiene un `telegram_user_id`.** Un caso lo
     afirma sobre el árbol versionado: ni `corresponsais/<temporada>.json`, ni
     fixtures, ni `.env.example`, que declara `TELEGRAM_CORRESPONDENTS` **sin
     valor**. Control positivo: escribir uno de ejemplo en el catálogo pone rojo
     el caso.
  5. **Residuo declarado dentro del criterio** (ADR-016 §6): este mecanismo mira
     el árbol de trabajo, **no la historia de git**. Si un identificador entrara
     alguna vez en un commit, quitarlo del árbol no lo quita del repositorio —esa
     es la razón entera de la regla (ADR-009 §3)—. El mecanismo previene, no
     repara.

- **CA-11 — La lengua es preferencia explícita persistida, galego por defecto, y
  nunca sale del cliente (D-2, ADR-022 §8).**
  Dado un corresponsal cuyo update trae `language_code: 'es'`,
  entonces:
  1. **Contesta en galego.** Es el caso que protege D-2 del fallo silencioso, y se
     escribe con esa intención declarada en el nombre del caso.
  2. `language_code` **no está en la lista blanca de CA-3**, así que ni siquiera
     existe dentro del proceso. Un caso afirma que **ningún fichero de `src/bot/`
     nombra `language_code`**, con control positivo.
  3. `/lingua` cambia la preferencia, la persiste en `correspondent_state` y el
     siguiente mensaje llega en la lengua elegida. Un caso hace el ciclo entero
     ida y vuelta.
  4. Sin preferencia guardada, la lengua es `gl`. Un caso lo afirma con la tabla
     vacía.

- **CA-12 — Todo texto visible sale del bundle, con paridad gl/es y sin literales
  en el código (D-2, D-8).**
  Dado el contrato `BotBundle` en `src/i18n/bot-bundle.ts` y su resolutor,
  entonces:
  1. **Una lengua incompleta es un fallo de compilación**, no una pantalla con un
     hueco: las dos lenguas satisfacen el mismo contrato, como ya hacen `site`,
     `crawler` y `titles`.
  2. **Ninguna cadena visible vive dentro de `src/bot/`.** Un caso lo afirma sobre
     los ficheros del módulo, con control positivo: escribir un literal visible
     pone rojo un caso nombrado. Un literal en galego impecable escrito en
     `src/bot/` **es incumplimiento de D-2 igual**.
  3. Son texto visible, y por tanto salen del bundle: los mensajes, **las
     etiquetas de los botones del teclado**, **las descripciones de
     `setMyCommands`** —registradas para `gl` y `es`, con `gl` como juego por
     defecto— y **la descripción y el «acerca de» del bot**, que se escriben desde
     el bundle y no a mano en BotFather.
  4. Los comandos son los del dictamen de `sdd-lingua` §2 —`/axuda`, `/partidos`,
     `/cancelar`, `/lingua`, `/parar`, más `/privacidade` y `/baixa` de ADR-023
     §5—, sin acentos ni `ñ` (restricción de Telegram) y **sin `/estado`**, que
     colisionaría con el término del modelo canónico que la propia tarjeta muestra.
  5. **Los cinco estados salen de un espacio de nombres compartido** —`statuses`,
     en `src/i18n/statuses-bundle.ts` y `statuses.ts`, con entradas en `gl.ts` y
     `es.ts`—, no de cadenas escritas dentro del bot, para que el marcador y el bot
     no acaben diciendo cosas distintas del mismo estado. Un caso afirma que hay
     una entrada por cada valor de `MATCH_STATUSES` en las dos lenguas.
  6. Los **nombres canónicos de la RFGF no se traducen en ninguna de las dos
     lenguas** y se interpolan tal cual: un caso lo afirma con «Celta B» en la
     tarjeta castellana.
  7. El acuse tras confirmar dice, **sin nombrar el motor de decisiones** —que es
     jerga interna y `dominio.md` no tiene su forma galega—, que lo enviado
     **todavía no está publicado** y que se compara con el resto de fuentes. Es
     RN-08 dicho en palabras que entiende alguien de pie en una banda.

- **CA-13 — El bot nace apagado: fuera de una jornada de medición declarada no
  recoge nada (ADR-019 §3, ADR-022 §7, ADR-023 §1, RN-11 por analogía).**
  Dada la lista de jornadas de medición declaradas,
  entonces:
  1. **Con la lista de producción, que está vacía**, un mensaje de un
     corresponsal autorizado recibe una frase neutra y deja **cero objetos crudos,
     cero filas y ninguna llamada al LLM**. El caso lo afirma **como resultado
     esperado** y cita ADR-023 §1: es la forma ejecutable de «esta spec entrega un
     bot apagado».
  2. Con una jornada **inyectada** que cubre el `kickoff` del partido, el mismo
     mensaje recorre el camino entero.
  3. La comprobación se hace **con la función que ya existe** —`inMeasurementWindow`
     de `src/ingest/windows.ts`—, no con una segunda implementación. Un caso lo
     afirma.
  4. **La llamada al LLM cuesta dinero y sale del proceso**, así que el orden
     importa: un caso afirma con dobles que fuera de jornada el cliente del LLM
     **no se llama ni una vez**.

- **CA-14 — El aviso del art. 13 va antes de aceptar contenido, y la baja se puede
  ejercer (ADR-023 §5, D-2, art. 13, 17 y 21 del RGPD).**
  Dado un corresponsal que nunca ha recibido el aviso,
  entonces:
  1. `/start` emite el aviso en su lengua, con los elementos del art. 13 como
     claves del bundle: responsable y contacto, qué se trata, para qué, base
     jurídica, **que el texto se envía a un proveedor de IA para interpretarlo**,
     cuánto se conserva, los derechos, y el enlace a `/privacidade`.
  2. Un mensaje de contenido de alguien que **nunca ha recibido el aviso** no se
     procesa: se le envía el aviso primero. Un caso lo afirma con **cero objetos
     crudos y cero filas** en ese primer intento.
  3. El aviso dice, en galego, **qué no hace falta enviar** —no hacen falta
     nombres de jugadores, de árbitros ni datos de salud—. Es la única mitigación
     posible sobre texto libre, y es una clave del bundle, no un comentario.
  4. `/privacidade` reimprime el aviso y el enlace.
  5. `/baixa` deja de aceptar mensajes de esa persona **en el acto**: escribe la
     fila de exclusión y, desde ese momento, sus mensajes se tratan como los de un
     remitente no autorizado (CA-2.2). Un caso lo prueba con el ciclo entero.
  6. El acuse de `/baixa` dice, sin adornarlo, **qué se ha borrado y qué no**: que
     no se aceptan más mensajes, que lo ya registrado no se borra (RN-13) y que el
     borrado del mapeo es un acto del operador con acuse escrito (ADR-023 §4).
     Prometer lo que el sistema no hace es un fallo de producto, no de traducción.
  7. **No hay ningún botón de consentimiento.** La base jurídica no es el
     consentimiento (ADR-023 §4) y un botón que no es la base induce a error
     (art. 13.1.c). Un caso afirma que ninguna tarjeta ni ningún teclado lleva
     uno.

- **CA-15 — Los tres gates, y las suites cerradas enteras.**
  1. `npm run lint` (`oxlint --type-aware`) sale limpio, y `npm run typecheck`
     también.
  2. `npm test` y `npm run test:db` pasan enteros. Sin `DATABASE_URL_TEST`, los
     criterios con base son **UNMET, no *skipped***.
  3. **Las suites cerradas de SPEC-008, SPEC-009, SPEC-010, SPEC-011, SPEC-012 y
     SPEC-013 pasan sin tocar una sola aserción**, con **una** excepción prevista y
     acotada: la entrada nueva en la lista de lo permitido de salida (CA-5.5) y la
     entrada de `migrations/0007` en las aserciones que enumeran migraciones. Las
     dos son **crecimiento con motivo escrito en el mismo diff** (ADR-016 §3.2), no
     relajación de forma. Cualquier otra desviación es RED, y el precedente de
     cómo se enmienda una aserción derivada está en F-SPEC-011-1.
  4. `migrations/0007` se aplica en orden sobre una base con 0001..0006, y sus
     tres tablas quedan con los `CHECK` que los criterios afirman.

## Entidades y reglas afectadas

**Reglas de negocio** (`docs/fundacion/reglas.md`, no se duplican aquí):

- **RN-09 / D-4** — el corazón de la spec: salida JSON validada **y confirmación
  humana**. CA-5 y CA-7.
- **RN-01** — peso 0.8 del corresponsal, leído de `RN01_WEIGHTS`; y «Humano en
  RN-04 y RN-06 son los dos», que es lo que le permite bajar un marcador y
  aplazar un partido. CA-8.
- **RN-08 / D-3** — el motor es la única puerta, sin atajo para el corresponsal.
  CA-9.
- **RN-10 / D-5** — archivo antes de parsear, tres objetos, y la redacción que no
  destruye el sustrato. CA-3 y CA-4.
- **RN-12 / D-6** — la cadena de trazabilidad completa, con el `correspondent_id`
  en su único domicilio. CA-10.
- **RN-13** — las `Observation` no se borran, y de ahí que la supresión se ejerza
  sobre el mapeo. CA-10, ADR-023 §4.
- **RN-06** — `postponed` y `suspended` solo por fuente oficial **o humano**; hoy
  la oficial no es capturable, así que **solo puede aplazar una persona**. CA-8.6.
- **RN-03** — lo que confirma el corresponsal sale *provisional*, porque
  0.8 < 0.9. CA-9.4.
- **RN-11** — **no** alcanza a la llamada al LLM, y el criterio lo dice para que
  nadie lo lea al revés. CA-5.5.

**Decisiones locked** (`FOUNDATION.md`): **D-2** (CA-11, CA-12), **D-3** (CA-9),
**D-4** (CA-5, CA-7), **D-5** (CA-3, CA-4), **D-6** (CA-10), **D-8** (el registro
del bot: densidad, verbo delante, sin tópicos).

**ADRs**: **ADR-022** y **ADR-023**, que esta spec ejecuta. **ADR-001** (grammY en
modo webhook), **ADR-004** (sin proceso vivo), **ADR-006** (instantes ISO, sin
ORM, migraciones numeradas), **ADR-009 §3** (git no se purga: el precedente que
prohíbe versionar el mapeo), **ADR-012** (identidad pública; el bot rompe su
acotación — nota §5), **ADR-013** (ningún estado codificado solo por color, ni
por emoji: CA-7.6), **ADR-015** (cómo se enmienda una spec cerrada), **ADR-016**
(la forma obligatoria de CA-2, CA-3, CA-5, CA-9, CA-10), **ADR-017** (el
calendario declarado es la lista de candidatos), **ADR-018** (de cuya forma esta
spec se aparta a propósito, CA-6), **ADR-019 §2 y §3** (ventanas y jornadas
declaradas), **ADR-020 §4** (el precedente del objeto colgante), **ADR-021 §3, §4
y §8.4** (los dos disparadores y el fallo cerrado ante un `SourceId` desconocido).

**Dominio** (`docs/fundacion/dominio.md`): `Observation`, `Match`, `raw store`,
`raw_ref`, **corresponsal**, **operador**, **calendario declarado**, **jornada de
medición declarada**, **motor de decisiones**, y los cinco estados de partido —a
los que esta spec **añade su literal galego y castellano**, porque el bot es el
primer sitio del sistema real donde una persona los ve y el glosario manda
añadirlos **antes** de usarse (nota §3).

## Fuera de alcance

Aparcado a propósito, no por descuido. Cada cosa con su destino y su disparador.

- **El panel del operador.** Es la **spec siguiente**. Aquí no hay peso 1.0, ni
  precedencia sobre la RFGF, ni bandeja de alertas, ni corrección de un marcador
  publicado. El corresponsal **no es** el operador: `reglas.md` lo dice en RN-01 y
  esta spec no lo mezcla.
- **El snapshot y la página mínima.** El bot **no enseña ningún marcador
  publicado**: acusa lo que él mismo recogió y dice que todavía no está publicado.
  Ver nada es de la spec del snapshot.
- **Las cuatro cifras.** Esta spec construye el instrumento que hace medible la
  cuarta; **no mide ninguna**. En particular, «cuántas propuestas del LLM
  descarta el corresponsal» es material de la spec de instrumentación, y el
  archivo de 30 días es lo que se lo guarda.
- **La página `/privacidade` y `/es/privacidade`.** Es **precondición de encender
  el bot** (ADR-023 §6.1), no criterio de aceptación: es texto legal que escribe
  una persona, en dos lenguas y con paridad de contenido, y su sitio son las rutas
  del sitio público de EPIC-003. **Spec futura**; **disparador: antes de declarar
  la primera jornada de medición con el bot encendido.**
- **El RAT (art. 30), la ponderación de interés legítimo, el «no procede» de la
  EIPD y la copia fechada del DPA.** Las cuatro en `docs/legal/`, las cuatro
  **precondiciones** (ADR-023 §6.2–6.5). Ninguna la puede escribir un rol `sdd-*`.
- **La identificación del responsable, y la enmienda de ADR-012.** El bot rompe la
  acotación «sin recogida de datos» con la que ADR-012 dejó su pregunta abierta.
  **Destino: `sdd-arquitecto` bajo firma del gate, por la vía de ADR-015 —enmienda
  en el ledger de SPEC-007, nunca editar su cuerpo—**; **disparador: el día que
  haya un corresponsal que no sea el autor.** Requiere revisión profesional
  (ADR-023 §7.1).
- **El hueco de `qualifiers` en `src/i18n/es.ts`.** El bot muestra **estados**, no
  cualificadores, así que no lo destapa. **Destino: la spec del marcador**;
  **disparador: el primer artefacto que enseñe un cualificador a una persona en
  castellano.** Y con él va la pregunta de si los cuatro cualificadores se
  traducen o se quedan en galego como vocabulario de marca (nota §4).
- **La incoherencia *En xogo* / *Directo* de `docs/diseno/`.** EPIC-004 está
  **congelada**. Esta spec fija el literal del **estado** y no toca la etiqueta de
  **filtro**. **Destino: gate humano** (nota §3).
- **Que el LLM proponga alias de equipo** —la vía `proposed` de RN-09 que ADR-018
  dejó apuntada al bot—. Aquí el modelo **elige entre candidatos con nombre
  canónico**; proponer alias es otra cosa. **Destino: spec futura**;
  **disparador: la primera fuente cuyo catálogo de alias sea demasiado grande para
  declararlo a mano.**
- **Un mecanismo automático de purga.** ADR-023 §2 mantiene la ceremonia manual de
  ADR-009 §4. **Destino: el ADR de retención de producción** que ADR-009 §6 sigue
  exigiendo; **F-SPEC-001-1 se estrecha por tercera vez y no se cierra.**
- **Cerrar el residuo F-SPEC-013-11.** Esta spec **contesta a su disparador** sin
  cerrarlo (CA-9.6). **Destino: EPIC-MEJORA.**
- **Notificaciones del bot hacia el corresponsal** —«tu partido lleva 15 min sin
  señal»—. El bot solo contesta a lo que le llega. Empujar exige decidir a quién y
  cuándo, y eso es panel.
- **Más de un corresponsal a la vez sobre el mismo partido.** El modelo lo
  soporta —son dos `Observation` de la misma fuente— pero **el spike tiene uno**, y
  el motor las trata por fuente, no por persona. **Disparador: el segundo
  corresponsal**, que es el mismo que reabre la forma del catálogo (ADR-022,
  *Consecuencias negativas*).
- **Fútbol base y menores.** Fuera del alcance de la épica —Terceira RFEF G1 y
  Preferente son categorías absolutas—. **Disparador escrito: si alguna vez entra,
  hay que re-consultar a `sdd-legal-datos` antes de aprobar nada** (ADR-023
  §Consecuencias).

## Notas para el gate humano

**§1. Lo que estás firmando, en una frase.** Un bot que **hoy no se puede
encender**: la lista de jornadas de medición está vacía, el catálogo de
corresponsales está vacío, el mapeo no existe y seis precondiciones de ADR-023 §6
están sin escribir. Firmar esta spec es firmar el **instrumento**; encenderlo es
un acto posterior con su propia ceremonia. Es la misma forma con la que se firmó
SPEC-012.

**§2. La decisión de arquitectura que más conviene mirar: el webhook contra el
`getUpdates` del cron.** Webhook, porque el cron añadiría **hasta 60 s de latencia
a la fuente humana más rápida del sistema**, justo sobre la primera cifra que la
épica mide — se estaría midiendo el planificador. El precio del webhook es una
**URL pública**, y un update falso vale peso 0.8: se paga con el `secret_token` de
Telegram y con el rechazo antes de archivar nada (CA-1). Si prefieres pagar la
latencia y no tener URL pública, es un cambio de ADR-022 §1 y de CA-1, no una
reescritura.

**§3. Dos cosas que hay que escribir en `dominio.md` antes de implementar, y una
de ellas es tuya.** El glosario define los cinco estados **solo como
identificadores en inglés**: no hay literal galego registrado, y **el bot es el
primer sitio del sistema real donde una persona los ve**. La propuesta, que sale
del dictamen de `sdd-lingua` §4.2 y coincide con lo que `docs/diseno/` ya usa:
*Programado · En xogo · Rematado · Aprazado · Suspendido* (y *Programado · En
juego · Finalizado · Aplazado · Suspendido* en castellano). Cuatro de las cinco no
tienen discusión. **La quinta sí**, y es la que firmas: `docs/diseno/` usa **dos**
formas para `live` —*En xogo* como estado y *Directo* como etiqueta de filtro—.
Recomendación del rol lingüístico, que esta spec adopta: **«En xogo» para el
estado** (describe el partido), **«Directo» solo como etiqueta de filtro**
(describe una vista), **con la distinción registrada explícitamente**. Si no
quieres registrar la distinción, hay que elegir **una** y usar esa en los dos
sitios. **EPIC-004 está congelada, así que esto lo firma una persona.**

**§4. Lo que este bot destapa y no arregla: el castellano no tiene
cualificadores.** `src/i18n/es.ts` no lleva `qualifiers` y su propia cabecera dice
que son de la spec del marcador. El bot esquiva el problema porque muestra
**estados**, no cualificadores. Pero la pregunta sigue viva y la vas a tener que
firmar en la spec del snapshot: **¿los cuatro cualificadores se traducen al
castellano, o se quedan en galego como vocabulario de marca?** `dominio.md` los
titula «visibles en UI, **en galego**» y D-2 exige que el castellano exista
completo; las dos lecturas son defendibles. Recomendación del rol lingüístico:
**traducirlos**, porque no son nombres propios.

**§5. El punto legal que no es un detalle: el buzón no es una identidad.** El art.
13.1.a exige la identidad del responsable, y ADR-012 dejó esa pregunta abierta
**acotada a «un sitio público sin recogida de datos»**. El bot rompe la acotación.
Mientras el único corresponsal seas tú eres responsable e interesado a la vez y la
exposición práctica es nula — **pero los terceros nombrados en los mensajes
adelantan el reloj**, porque un jugador o un árbitro citado en un parte no es el
autor. La decisión de ADR-023 §5 es: **el día que haya un corresponsal que no seas
tú, el responsable tiene que ser identificable por nombre o entidad**, y el camino
es una enmienda de ADR-015 en el ledger de SPEC-007. **Requiere revisión
profesional.**

**§6. Las tres preguntas abiertas que bloquean la implementación**, por orden:

1. **¿Firmas el plazo de 30 días de ADR-023 §2 para texto libre de una persona?**
   Es la misma reserva que ADR-009 escribió sobre su propio plazo: nadie aquí
   puede afinar el correcto, así que se elige groseramente conservador. Sin este
   plazo, la spec se aprueba con un agujero conocido y la primera jornada no se
   puede declarar (la fecha de purga se escribe **antes**).
2. **¿Anthropic o otro proveedor, y está su DPA firmado y guardado?** El criterio
   CA-5 se puede implementar con cualquiera, pero **la comprobación del DPA y de
   las cláusulas contractuales tipo hay que hacerla contra el texto firmado, no
   contra una fuente secundaria**, y la copia fechada va en `docs/legal/`. El
   dictamen legal recomienda apoyarse en las cláusulas y **no** en la decisión de
   adecuación, porque su recurso de casación está pendiente ante el TJUE.
3. **¿`live` es *En xogo* o *Directo*?** Nota §3. Es una línea de `dominio.md` y
   bloquea CA-12.5.

**§7. Las que pueden esperar al gate siguiente**, y por qué no bloquean:

- **¿Se acepta `/help` como alias oculto de `/axuda`?** No es texto mostrado, así
  que no toca D-2. Criterio de producto.
- **¿El tuteo aguanta si mañana el corresponsal es un directivo de club?** El
  bot tutea porque `gl.ts` y `es.ts` ya tutean sin excepción, y cambiarlo
  obligaría a enmendar dos specs cerradas. Se decide cuando haya un segundo
  corresponsal.
- **¿Puede el aviso de fallo decir que el mensaje no se perdió?** Solo si hay
  reintento real, y hoy no lo hay: el literal se queda sin prometerlo.
- **¿Corresponsales voluntarios, remunerados o personal de club?** Decide entre
  art. 6.1.b y 6.1.f. Hoy el corresponsal eres tú, así que la pregunta no muerde.
- **¿El bot nombra el «motor de decisións»?** Recomendación: **no**, y CA-12.7
  está escrito sin jerga. Nombrarlo obligaría a registrar antes su forma galega
  en `dominio.md`.
- **¿Quieres una EIPD (art. 35)?** Lectura del rol legal: **no procede**, pero un
  «no procede» corto y fechado en `docs/legal/` vale más que el silencio.

**§8. Lo que esta spec te cuesta si dice que sí.** Es la spec más grande de la
épica después del motor: un módulo nuevo entero, tres tablas, cinco fronteras de
capacidad en la forma de ADR-016 —cada una con sus controles positivos y su
residuo escrito— y un espacio de nombres de i18n nuevo. Y **seis precondiciones
fuera del código**. Si lo que quieres es la cifra de operación manual cuanto
antes, la parte que no se puede recortar es CA-7 (la confirmación humana), CA-3
(la lista blanca) y CA-9 (que el bot no publique). Todo lo demás es discutible; eso
tres, no.
