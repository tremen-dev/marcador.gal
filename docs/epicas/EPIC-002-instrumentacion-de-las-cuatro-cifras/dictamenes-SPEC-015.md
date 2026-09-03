# Dictámenes de dominio para SPEC-015 — bot de Telegram del corresponsal

> **Artefacto versionado, copiado literalmente.** Los dos roles consultivos
> `sdd-lingua` y `sdd-legal-datos` dictaminaron sobre SPEC-015 el **2026-09-02**,
> a petición de una primera pasada de `sdd-arquitecto` que murió por límite de
> uso antes de escribir la spec. Los dos llevan la regla dura del rol
> consultivo: **el dictamen tiene que quedar por escrito en la spec o en su
> ledger**, y esa anotación es del arquitecto. Se copian **enteros y sin
> resumir**: lo que un verificador tendrá que consultar dentro de un mes es el
> texto, no una paráfrasis.
>
> Qué absorbió SPEC-015 y qué dejó fuera está en su cuerpo y en sus notas para
> el gate; las decisiones de arquitectura que salieron de aquí están en
> **ADR-022** y **ADR-023**. Este fichero no se edita: si un dictamen cambia, se
> emite otro y se añade debajo con su fecha.
>
> Ninguno de los dos roles es abogado ni lingüista colegiado, y ninguno de los
> dos escribió código.

---

# Dictamen sdd-lingua — SPEC-015, bot de Telegram del corresponsal

> Emitido el 2026-09-02 por el rol consultivo `sdd-lingua`, a petición de una
> primera pasada de `sdd-arquitecto` que murió por límite de uso antes de poder
> escribir la spec. El dictamen sobrevivió; se rescata aquí literalmente para que
> el trabajo no se repita. **Debe quedar por escrito en la spec o en su ledger**
> (regla dura del rol consultivo).

Fuentes leídas por el rol: su contrato, `FOUNDATION.md` (D-2, D-8),
`docs/fundacion/dominio.md`, `docs/fundacion/reglas.md` (RN-01, RN-04, RN-09),
los cuatro ficheros de i18n del worktree y `docs/diseno/` (EPIC-004), que resultó
relevante: ya tiene literales galegos para los cinco estados que **no están en
`dominio.md`**. No escribió ningún fichero.

---

## 1. Registro y tono — **de tú, imperativo directo, frase corta**

**Dictamen: tuteo (2ª persoa do singular). No es una preferencia, es coherencia con precedente ya en código.**

`src/i18n/gl.ts` y `es.ts` (SPEC-004 y SPEC-005, ambas cerradas y verificadas GREEN) ya tutean sin excepción: *«Escribe aí para calquera cousa»*, *«Se prefires que non leamos o teu sitio»*, *«Abonda con pedilo»*, *«Tamén serve engadir unha regra no teu propio robots.txt»*. Un bot en *vostede* haría que el proyecto hablase con dos registros distintos a la misma persona. Además, *vostede* concuerda en 3ª persona y es exactamente donde los castellanohablantes cometen el error de mezcla (*«vostede pode… e se queres…»*): el tuteo elimina una clase entera de fallo.

**El registro que pide D-8**, aplicado a este canal concreto — una persona de pie en una banda, con el móvil en una mano y mala cobertura:

- **Densidad primero.** Un mensaje = una idea. La tarjeta de confirmación cabe en pantalla sin desplazar. Nada de saludo por mensaje ni despedida.
- **Verbo delante, en imperativo.** «Escribe», «Confirma», «Descarta», «Comproba». Sin «por favor» ni «podrías», que alargan y no aportan.
- **Nada de léxico de vestuario ni de tópico rural** (D-8): ni *rapaz*, ni *ho*, ni *meu*, ni vocativos. Tampoco jerga de retransmisión. El literal es funcional; el color lo pone el fútbol, no el bot.
- **Voz del bot.** Recomiendo dos registros y solo dos, sin mezclar con el «nós» del sitio:
  - **impersonal / pasiva refleja** para los hechos del sistema: *«Quedou rexistrado»*, *«Non se publicou nada»*;
  - **1ª persona do singular** para los actos de comprensión del propio bot: *«Non entendín»*, *«Non te recoñezo»*, *«Non atopo ese partido»*.
  El «nós» institucional (*«respondemos»*, *«non republicamos»*) es del sitio público, no del bot: allí habla el proyecto, aquí habla la máquina.
- **Sin emoji decorativo.** Si se usa un glifo para el estado, va **acompañando** al texto, nunca sustituyéndolo — es la traducción a este canal de ADR-013 («ningún estado se codifica solo con color»).

---

## 2. Juego de comandos en galego

Restricción de Telegram, que condiciona la forma: los comandos solo admiten `a-z`, `0-9` y `_`, máx. 32 caracteres. **Sin acentos y sin `ñ`/`ç`** — afortunadamente ninguna de las formas galegas correctas los necesita.

| Comando | Forma galega | Por qué esta y no otra | Descripción gl (menú) | Descripción es |
|---|---|---|---|---|
| `/start` | impuesta por Telegram | No se toca. Lo que sí es texto visible es su **descripción** en el menú. | *Comezar* | *Empezar* |
| `/axuda` | **axuda** (RAG) | No `/ayuda` (castellanismo) ni `/ajuda` (lusismo). | *Como se escribe un resultado* | *Cómo se escribe un resultado* |
| `/partidos` | **partidos** | Ver punto siguiente: **evita `/estado`**. | *Os partidos abertos agora* | *Los partidos abiertos ahora* |
| `/cancelar` | **cancelar** (RAG) | Coincide con el castellano; es correcto en las dos. | *Descartar o que está pendente* | *Descartar lo que está pendiente* |
| `/lingua` | **lingua** (RAG) | *Idioma* también es galego, pero el proyecto ya usa *lingua* como término propio. | *Galego ou castelán* | *Galego o castellano* |
| `/parar` | **parar** | Coherente con el léxico ya publicado en `/robot`: *«Como pedir que pare»*, *«escribe… e paramos»*. | *Deixar de recibir avisos* | *Dejar de recibir avisos* |

**Recomendación fuerte: no uses `/estado`.** *Estado* es término del modelo canónico (`MatchStatus`: `scheduled`, `live`, `finished`, `postponed`, `suspended`) y en la tarjeta de confirmación va a aparecer con ese nombre. Un comando homónimo que significa «en qué punto está tu conversación» crea dos sentidos para la misma palabra en la misma pantalla. `/partidos` dice lo que hace y no colisiona.

**Dos notas operativas que son texto visible y por tanto van a i18n (D-2):**

1. **Las descripciones de `setMyCommands`** y las **etiquetas de los botones** del teclado inline son texto visible. Telegram permite un juego de comandos por `language_code`: registra `gl` y `es`, con `gl` como el juego por defecto (el que se sirve cuando el `language_code` no coincide con ninguno).
2. **La `description` y el `about` del bot en BotFather** son texto visible para cualquiera que abra la ficha. Deben salir del bundle, no escribirse a mano en BotFather.

Si se quiere aceptar `/help` como alias oculto (los clientes de Telegram lo sugieren solo), no incumple D-2 porque no es texto mostrado — pero es una decisión de producto. Ficha como pregunta abierta.

---

## 3. Literales, con clave i18n

### Convención que hay que respetar

Los bundles existentes tienen **un espacio de nombres por spec**, con un tipo compartido que hace del olvido de una lengua un fallo de `npm run typecheck`, no una pantalla con un hueco: `qualifiers` (SPEC-001), `site` + `SiteBundle` (SPEC-004), `crawler` + `CrawlerBundle` (SPEC-005), `titles` + `TitlesBundle` (SPEC-006). Ficheros: `<ns>-bundle.ts` (el contrato) + `<ns>.ts` (el resolutor).

**Propuesta para SPEC-015:** espacio de nombres **`bot`**, contrato `BotBundle` en `src/i18n/bot-bundle.ts`, resolutor `src/i18n/bot.ts`. Claves **camelCase planas dentro del namespace**, prefijadas por momento (`start*`, `help*`, `card*`, `ack*`, `err*`), tal como `crawler` prefija `userAgent*` / `robots*`.

Detalle menor para el arquitecto: el tipo de lengua se llama hoy `SiteLocale` y vive en `site-bundle.ts`; el bot no toma la lengua de una URL, así que el nombre queda impreciso. **No lo renombres** — tocaría código de dos specs cerradas. Declara `export type BotLocale = SiteLocale` con el comentario que lo explique, y manda el renombrado a EPIC-MEJORA.

**Y una advertencia estructural, que es la única que puede romper D-2 en silencio:** Telegram **no ofrece galego** en la interfaz de sus clientes, así que el `language_code` de casi todos los corresponsales gallegos llegará como `es`. **Si la lengua del bot se infiere del cliente, el galego por defecto deja de existir de facto y D-2 se incumple sin que nadie lo vea.** La lengua tiene que ser una **preferencia explícita por usuario, persistida, con galego por defecto** y cambiable con `/lingua`. Es la misma decisión que ya está escrita en la cabecera de `src/i18n/site.ts`: *«The language comes from the URL, never from the client»*. Aquí: nunca del cliente, siempre del registro del corresponsal.

### 3.1 `/start`

| Clave | Galego | Castellano |
|---|---|---|
| `startWho` | `Son o bot de marcador.gal. Recollo os resultados que mandas desde o campo.` | `Soy el bot de marcador.gal. Recojo los resultados que mandas desde el campo.` |
| `startWhat` | `Escríbeme cando cambie algo: quen xoga, como vai e o minuto. Nada máis.` | `Escríbeme cuando cambie algo: quién juega, cómo va y el minuto. Nada más.` |
| `startNotPublished` | `O que mandas non sae publicado tal cal: compárase co resto de fontes antes de chegar ao marcador.` | `Lo que mandas no sale publicado tal cual: se compara con el resto de fuentes antes de llegar al marcador.` |
| `startDataNotice` | *(pendiente — ver pregunta abierta 3; redacción a partir del dictamen de `sdd-legal-datos`)* | *(idem)* |
| `startHelpHint` | `Escribe /axuda para ver exemplos.` | `Escribe /axuda para ver ejemplos.` |

### 3.2 `/axuda`

| Clave | Galego | Castellano |
|---|---|---|
| `helpIntro` | `Escribe como falas. Entendo cousas coma estas:` | `Escribe como hablas. Entiendo cosas como estas:` |
| `helpExamples` | `2-1 no minuto 70, Ourense - Celta B\nxa rematou, 3-1\nsuspendido pola néboa` | `2-1 en el minuto 70, Ourense - Celta B\nya ha terminado, 3-1\nsuspendido por la niebla` |
| `helpOrder` | `Primeiro o equipo da casa. «Ourense - Celta B» é 2 do Ourense e 1 do Celta B.` | `Primero el equipo de casa. «Ourense - Celta B» es 2 del Ourense y 1 del Celta B.` |
| `helpIfWrong` | `Se non dou co partido, engade os nomes dos equipos.` | `Si no doy con el partido, añade los nombres de los equipos.` |
| `helpCommands` | `/partidos — os partidos abertos agora\n/cancelar — descartar o que está pendente\n/lingua — galego ou castelán` | `/partidos — los partidos abiertos ahora\n/cancelar — descartar lo que está pendiente\n/lingua — galego o castellano` |

`helpOrder` no es adorno: el orden local-visitante es lo único que da sentido al marcador y es donde un malentendido produce un dato invertido.

### 3.3 Mientras se interpreta el mensaje libre

| Clave | Galego | Castellano |
|---|---|---|
| `parsing` | `Estou a lelo…` | `Lo estoy leyendo…` |

*Estar a + infinitivo* es la forma genuina galega; *estar + xerundio* es calco (ver punto 5).

### 3.4 Tarjeta de confirmación

| Clave | Galego | Castellano |
|---|---|---|
| `cardHeading` | `Isto foi o que entendín:` | `Esto es lo que he entendido:` |
| `cardMatch` | `{home} - {away}` | `{home} - {away}` |
| `cardScoreLabel` | `Marcador` | `Marcador` |
| `cardMinuteLabel` | `Minuto` | `Minuto` |
| `cardStatusLabel` | `Estado` | `Estado` |
| `cardConfirm` | `Confirmar` | `Confirmar` |
| `cardDiscard` | `Descartar` | `Descartar` |
| `cardHint` | `Se algo non cadra, descarta e escríbeo outra vez.` | `Si algo no cuadra, descarta y escríbelo otra vez.` |
| `cardExpired` | `Pasou demasiado tempo. Escríbeo outra vez, por se cambiou algo.` | `Ha pasado demasiado tiempo. Escríbelo otra vez, por si ha cambiado algo.` |

`{home}` y `{away}` se interpolan con el **nombre canónico de la RFGF** y **no se traducen en ninguna de las dos lenguas** (`dominio.md`, convención de lenguas). El valor de `Estado` sale del namespace de estados, no de una cadena escrita aquí (punto 4).

### 3.5 Acuse tras confirmar

| Clave | Galego | Castellano |
|---|---|---|
| `ackRegistered` | `Rexistrado: {home} {homeScore} - {awayScore} {away}.` | `Registrado: {home} {homeScore} - {awayScore} {away}.` |
| `ackNotPublication` | `Aínda non está publicado. Compárase co resto de fontes e, se procede, sae no marcador.` | `Todavía no está publicado. Se compara con el resto de fuentes y, si procede, sale en el marcador.` |
| `ackDiscarded` | `Descartado. Non se rexistrou nada.` | `Descartado. No se ha registrado nada.` |

`ackNotPublication` **deliberadamente no dice «motor de decisións»**: es jerga interna y el destinatario es una persona en una banda. Dice lo mismo (RN-08: nada se publica sin pasar por el motor) en palabras que se entienden. Si el gate quiere nombrar el motor, hay que registrar antes su forma galega en `dominio.md` (punto 4).

### 3.6 Errores

| Clave | Galego | Castellano |
|---|---|---|
| `errNotAuthorised` | `Non te recoñezo. Este bot só atende a corresponsais dados de alta.` | `No te reconozco. Este bot solo atiende a corresponsales dados de alta.` |
| `errNotUnderstood` | `Non entendín a mensaxe. Proba así: «2-1 no minuto 70, Ourense - Celta B».` | `No he entendido el mensaje. Prueba así: «2-1 en el minuto 70, Ourense - Celta B».` |
| `errMatchNotFound` | `Non atopo ese partido. Comproba os nomes dos equipos ou mira /partidos.` | `No encuentro ese partido. Comprueba los nombres de los equipos o mira /partidos.` |
| `errAmbiguous` | `Hai máis dun partido que cadra. Escolle cal:` | `Hay más de un partido que cuadra. Elige cuál:` |
| `errServiceDown` | `Non podo gardalo agora mesmo. Volve probar nun minuto.` | `No puedo guardarlo ahora mismo. Vuelve a probar en un minuto.` |
| `errNoOpenMatch` | `Agora mesmo non hai ningún partido aberto.` | `Ahora mismo no hay ningún partido abierto.` |

Nótese que `errServiceDown` **no promete** que el mensaje se haya guardado. Solo se puede añadir *«a mensaxe non se perdeu»* si existe reintento real (pregunta abierta 7). Un literal que promete lo que el sistema no hace es un fallo de producto, no de traducción.

**Dictamen duro que acompaña a todo lo anterior:** cualquiera de estas cadenas escrita dentro de `src/bot/` es **incumplimiento de D-2 aunque el galego sea impecable**. El contrato `BotBundle` compartido por `gl` y `es` es el mecanismo que ya usa el proyecto para que una lengua incompleta sea un fallo de compilación.

---

## 4. Terminología que no se traduce ni se inventa

### 4.1 Lo que ya está fijado y hay que usar tal cual

- **Nombres de equipos y competiciones:** los canónicos de la RFGF, **en las dos lenguas**, sin traducir ni «galeguizar». «Celta B» sigue siendo «Celta B» en `/es`; «Terceira RFEF» sigue siendo «Terceira RFEF» en castellano (`dominio.md`, nota de nomenclatura del 2026-08-31). Si norma lingüística y nombre canónico chocan, **manda el nombre canónico** y se anota como excepción consciente.
- **Los cuatro cualificadores:** los valores ya existen en `gl.qualifiers` — *Provisional*, *Confirmado*, *Pendente de confirmar*, *Sen sinal*. **No se improvisan sinónimos**: nunca «sen datos», «sen resposta», «á espera».
- **Los identificadores del código siguen en inglés** (`live`, `finished`, `MatchStatus`): eso no cambia y no es materia de i18n.
- **«xornada»** ya está registrada en `dominio.md` como literal galego de UI.

### 4.2 Hueco real: **los cinco estados no tienen literal galego en `dominio.md`**

`dominio.md` define `scheduled`, `live`, `finished`, `postponed`, `suspended` **solo como identificadores en inglés con su significado**. No hay fila con la forma galega visible. Sin embargo `docs/diseno/` (EPIC-004, **congelada**) ya las usa:

`Main.dc.html` → **Programado**, **En xogo**, **Rematado**, **Aprazado**, **Suspendido**.

**Dictamen: hay que añadir esas cinco filas a `dominio.md` antes de que SPEC-015 las use**, tal como manda la cabecera del propio glosario («Si un término falta, se añade aquí antes de usarse») y la regla dura del rol. La tarjeta de confirmación del bot es el primer sitio del sistema real donde un estado se le enseña a una persona; si entran por ahí sin registrar, el marcador y el bot acabarán diciendo cosas distintas.

Propuesta de filas (galego / castellano):

| Estado | Galego | Castellano |
|---|---|---|
| `scheduled` | **Programado** | Programado |
| `live` | **En xogo** | En juego |
| `finished` | **Rematado** | Finalizado |
| `postponed` | **Aprazado** | Aplazado |
| `suspended` | **Suspendido** | Suspendido |

**Y con ello una incoherencia que hay que resolver, no heredar:** el sistema de diseño usa **dos** formas para `live` — *En xogo* como etiqueta de estado (`Main.dc.html`) y **Directo** como etiqueta de filtro (`Componentes.dc.html`, `Escritorio.dc.html`, `Global.dc.html`, `Movil.dc.html`, `_logic.js`). Un mismo estado se dice siempre igual. Mi recomendación es **«En xogo» para el estado** (es lo que describe el partido) y aceptar **«Directo» solo como etiqueta de filtro de la lista** (describe una vista, no un partido), **registrando las dos con esa distinción explícita** en `dominio.md`. Si no se registra la distinción, elige una sola y usa esa. EPIC-004 está congelada, así que la elección la firma una persona.

### 4.3 Otros términos que habría que registrar antes de usarse

- **«motor de decisións»** — `dominio.md` lo tiene solo en castellano, porque los docs van en castellano. Si el bot llega a nombrarlo (recomiendo que no), hay que registrar la forma galega.
- **«observación»** — el modelo lo llama `Observation`. Recomiendo que el bot **no** diga «observación»: es jerga. Que diga *«o que mandaches»*. Si la spec decide nombrarla, se registra.
- **«corresponsal»** ya está en `dominio.md`. Plural galego: **corresponsais** (no *corresponsales*).
- **«tarxeta de confirmación»** — vocabulario de UI, no de dominio. No hace falta registrarla.

### 4.4 El bundle castellano tiene un hueco que esta spec destapa

`es.ts` **no lleva `qualifiers`** — su cabecera lo dice y lo justifica: pertenecen a la spec que construya la interfaz del marcador. El bot va a ser **el primer artefacto que le enseñe un cualificador o un estado a una persona en castellano**. SPEC-015 tiene que cerrar ese hueco (o el namespace de estados y cualificadores lo aporta ella, o lo aporta explícitamente la spec del marcador y el bot lo consume). No es opcional: sin él, `/es` tendría literales en galego dentro de una tarjeta castellana. Y antes hay que resolver la pregunta abierta 1.

---

## 5. Trampas concretas del galego en este dominio

**a) `mensaxe` es femenino en galego.** *«a mensaxe»*, *«esa mensaxe non se entendeu»*. En castellano es masculino y el calco sale solo. Mismo grupo, y todos aparecen en este dominio: **o sinal** (masculino — de ahí *sen sinal*), **a orde** (femenino: *a orde dos equipos*), **a xanela** (femenino, ya en `gl.ts`), **a rede**, **o marcador**, **o final** del partido (frente a **a final**, que es el partido decisivo — confundirlos es fácil y cambia el sentido).

**b) Colocación del pronombre átono.** Enclítico por defecto, proclítico tras negación, interrogativo y ciertos adverbios/conjunciones. Correcto: *«Non te recoñezo»*, *«Non o atopo»*, *«Xa cho rexistrei»*, *«Rexistreino»*. **Incorrecto: «Non recoñézote», «Non atópoo».** Es el error número uno del galego escrito por castellanohablantes, y aquí sale en cinco de los seis mensajes de error.

**c) `estar a + infinitivo`, no `estar + xerundio`.** *«Estou a lelo»*, no *«Estou lendo»* (admitido, pero calco). Afecta al literal `parsing`.

**d) Falsos amigos y castellanismos de crónica deportiva:**

| Escribe | No escribas | Por qué |
|---|---|---|
| **gol / goles** | *golo / golos* | *golo* es la forma portuguesa/reintegracionista; la del diccionario da RAG es **gol**. Es el hipergaleguismo más probable aquí. |
| **aprazar / aprazado** | *adiar* | *adiar* es portugués. `postponed` es **Aprazado** (y así lo escribe ya el sistema de diseño). |
| **equipo** | *equipa* | *equipa* es lusismo. |
| **atopar** | *encontrar* (para «no lo encuentro») | *atopar* es la forma genuina; encaja con `errMatchNotFound`. |
| **tempo engadido** | *descontos* / *acréscimo* | *descontos* es castellanismo, *acréscimo* lusismo. |
| **choiva** | *chuvia* | *chuvia* es lusismo; RAG: **choiva**. |
| **néboa** | *niebla* / *neboa* | Aparece literalmente en el ejemplo del enunciado: *«suspendido pola néboa»*. |
| **ata** | *até* | *até* es portugués. |
| **grazas** | *gracias* | Si algún literal agradece algo. |
| **posible, confirmable** | *posíbel, confirmábel* | La norma RAG estándar es **-ble**. El *-bel* es la marca clásica de sobrecorrección. |

**e) `rematar` tiene dos sentidos en fútbol.** *Rematar* = terminar (*«xa rematou»*, y de ahí el estado **Rematado**) pero también = disparar a puerta. En un mensaje del corresponsal, *«rematou»* suelto es ambiguo. Recomendación para la spec: el **estado** siempre se muestra como *Rematado* con etiqueta explícita («Estado: Rematado»), nunca como frase suelta, y el parser LLM debe tratar *rematar* con complemento de balón como disparo, no como fin de partido. Es una trampa de dominio, no solo de traducción.

**f) `coma` frente a `como`.** Ante sustantivo o pronombre en comparación de igualdad va **coma**: *«cousas coma estas»*. Ante verbo u oración va **como**: *«Escribe como falas»*. Los dos casos aparecen en `/axuda`.

**g) Segunda forma del artículo: no la escribas.** Nada de *«manda-lo marcador»*. Escribe *«mandar o marcador»*. Es opcional en la escritura y hoy no se usa en registro funcional; escribirla lee como afectación.

**h) Acentuación, y lo que ya está fijado por precedente en `gl.ts`:**
- **`ao`, no `ó`.** El bundle existente escribe *«aos 30 días»*, *«ao comprobar»*. Las dos formas son válidas; el proyecto ya eligió. Mantenla.
- **`máis` siempre con acento** (no existe el par *mas/más* del castellano).
- **`só`** con acento, como ya lo escribe `gl.ts` (*«só unha hora»*).
- **`á`** (contracción `a` + `a`) frente a `a`; **`é`** frente a `e`.

**i) Los nombres propios no se corrigen.** Ni se acentúan, ni se galeguizan, ni se «arreglan». Vienen del calendario declarado y del catálogo de alias, y ahí manda la RFGF.

**j) El separador del marcador.** Usa guion simple `2-1`, en las dos lenguas, sin espacios alrededor de los dígitos, coherente con «números tabulares» (D-8) y con ADR-013. Y el orden es **local - visitante**, dicho explícitamente en `/axuda`.

---

## 6. Preguntas abiertas — necesitan firma humana

1. **¿Se traducen los cuatro cualificadores al castellano?** `dominio.md` los titula *«Cualificadores del marcador (visibles en UI, en galego)»* y dice de dos de ellos *«Literal en galego, va a i18n»*; D-2 exige que el castellano exista y esté completo. Las dos lecturas son defendibles: o son vocabulario de marca que se queda en galego también en `/es` (como un nombre canónico), o son descripciones de estado y se traducen. **Recomendación del rol: traducirlos** — no son nombres propios, y la ayuda PR858A solo exige que la versión galega esté íntegra. Pero es una decisión de dominio y condiciona el bundle `es`.
2. **¿De dónde sale la lengua del corresponsal?** Telegram no ofrece galego en sus clientes: inferirla del `language_code` pondría a casi todos en castellano y vaciaría D-2 sin que nadie lo note. Propuesta: preferencia explícita por usuario, persistida, **galego por defecto**, cambiable con `/lingua`. Afecta al modelo de datos del bot.
3. **El aviso de tratamiento de datos de `/start`.** No se puede redactar sin saber qué se guarda (id de Telegram, alias, texto íntegro de los mensajes), con qué base jurídica y durante cuánto. Es materia de `sdd-legal-datos` (dictamen adjunto) y engancha con ADR-009/ADR-020.
4. **¿`live` es *En xogo* o *Directo*?** Hoy `docs/diseno/` usa las dos para lo mismo. Hay que elegir y registrar en `dominio.md`. EPIC-004 está congelada, así que la elección la firma una persona (o entra por enmienda, ADR-015).
5. **¿El bot nombra el «motor de decisións»?** Recomendación: que no, y `ackNotPublication` está redactado sin jerga. Si el gate quiere nombrarlo, hay que registrar la forma galega en `dominio.md` antes.
6. **¿Se acepta `/help` como alias oculto de `/axuda`?** No es texto visible, así que no incumple D-2, pero es criterio de producto.
7. **¿Puede `errServiceDown` decir que el mensaje no se perdió?** Solo si hay reintento real. Si no lo hay, el literal se queda como está escrito.
8. **El tuteo, confirmado para el corresponsal-autor del spike, ¿aguanta si mañana el corresponsal es un directivo de club?** Recomendación: mantenerlo por coherencia con el sitio. Cambiar a *vostede* obligaría a cambiar también `gl.ts` y `es.ts`, que son de SPEC-004 y SPEC-005, ya cerradas: sería enmienda vía ADR-015, no una edición.

---

**Invariantes afectados:** D-2, D-8, RN-08 (lo que dice el acuse), RN-09 (el bot es exactamente el punto donde el LLM propone y la persona confirma), ADR-013 (nada codificado solo por color, tampoco por emoji), ADR-015 (si se toca el registro del sitio, es enmienda), ADR-018 (los nombres que muestra la tarjeta vienen del catálogo de alias y del calendario declarado, no del texto del corresponsal).

**Artefactos que habría que revisar antes de aprobar SPEC-015:** `docs/fundacion/dominio.md` (cinco filas de estados + resolución de `live`), `src/i18n/es.ts` (hueco de `qualifiers`), `docs/diseno/` (incoherencia *En xogo* / *Directo*, con EPIC-004 congelada).


---

# Dictamen `sdd-legal-datos` — SPEC-015, bot de Telegram del corresponsal

> Emitido el 2026-09-02 por el rol consultivo `sdd-legal-datos`, a petición de una
> primera pasada de `sdd-arquitecto` que murió por límite de uso antes de poder
> escribir la spec. El dictamen sobrevivió; se rescata aquí literalmente para que
> el trabajo no se repita. **Debe quedar por escrito en el ledger de SPEC-015**
> (regla dura del rol consultivo).

**Fecha de consulta de las fuentes externas: 2026-09-02.** El rol no es abogado y esto no es asesoramiento profesional; marca explícitamente al final los cuatro puntos que exigen revisión profesional antes de exponerse.

**Hallazgo previo que condiciona los puntos 5 y 6:** el repositorio es **PÚBLICO** (`github.com/tremen-dev/marcador.gal`, `visibility: PUBLIC`, comprobado con `gh repo view`). Todo lo que se versione aquí es publicación, no almacenamiento.

---

## 1. Qué datos personales aparecen aquí

**Dictamen: la pregunta, tal como está formulada, tiene una trampa. Una vez el registro es atribuible a una persona identificada, *todos* sus campos son datos personales de esa persona** — art. 4.1 RGPD define dato personal como "toda información sobre una persona física identificada o identificable", no "todo campo identificador". `language_code` no identifica a nadie, pero `language_code` *de una persona concreta* es un dato personal de esa persona.

Lo útil es clasificar por **poder identificador**, porque es sobre eso donde muerde la minimización del punto 2:

| Campo | Naturaleza | Riesgo |
|---|---|---|
| `from.first_name`, `from.last_name` | **Identificador directo.** Nombre civil. | Alto. Es el dato más identificador de todo el update y **ningún parser lo va a leer nunca**. |
| `from.username` | **Identificador directo y transversal.** Un `@handle` se reutiliza entre servicios; es una clave de correlación con el resto de la vida online de la persona. | Alto, y peor que el nombre: es enlazable automáticamente. |
| `from.id`, `chat.id` | **Identificador en línea** (art. 4.1 + considerando 30). Numérico, estable de por vida, compartido con **todos** los bots que esa persona use. Reidentificable por Telegram y por cualquiera que lo tenga. | Alto. Es un pseudónimo *ajeno*, no nuestro: no controlamos su dominio de pseudonimización. |
| `from.language_code` | Atributo. No identifica; es dato personal por atribución. | Bajo, pero **inútil**: no lo lee nadie. |
| `message.text` | **Contenido libre.** Es el objeto del tratamiento y no se puede minimizar sin destruir la finalidad. | **El más alto**, por ser ilimitado (ver punto 7.a). |

**Categorías especiales (art. 9.1): ninguna por diseño, pero dos vías de entrada reales, y una es probable.**

1. **Datos de salud de terceros.** «*Lesionouse o 9, sae en padiola*» es una frase normal en un mensaje de corresponsal, y es un dato de salud del art. 9.1 sobre un jugador identificable (dorsal + partido + minuto identifican). No hay ninguna excepción del art. 9.2 que ampare un marcador. Esto **existe desde el día uno, con el autor como único corresponsal**, porque el sujeto no es el corresponsal sino el tercero.
2. **Menores**, si alguna vez entra fútbol base. Hoy fuera de alcance (Terceira RFEF G1 y Preferente son categorías absolutas). **Dispararlo obliga a re-consultar antes de aprobar la spec.**

Y un tercer efecto que la spec debe ver: el texto lleva datos de **terceros de los que no los obtenemos** (jugadores, árbitros, entrenadores) → **art. 14**, no art. 13. Ver punto 7.c.

> **Recomendación accionable (forma de CA).** Un CA que, en la forma que exige **ADR-016** —enumerar lo permitido y exigir que el resto sea vacío, con control positivo—, afirme: el objeto archivado y la fila persistida contienen exactamente las claves de una lista blanca declarada, y las claves `first_name`, `last_name`, `username`, `language_code`, `is_bot`, `is_premium` **no aparecen en ninguna de las dos**. El control positivo: añadir una clave prohibida al fixture pone el test en rojo.

---

## 2. RN-10 frente a minimización (art. 5.1.c)

**Dictamen: archivar el `update` íntegro NO es defendible — y, lo que importa más, RN-10 no lo pide.**

Tres argumentos, y el segundo es el que hay que escribir en la spec porque si no alguien invocará el precedente equivocado:

**a) La finalidad de RN-10 está escrita en la propia regla** y no incluye estos campos: «*es lo que permite reprocesar con un parser corregido y reproducir una jornada entera en tests*» (`reglas.md`, RN-10; D-5). El sustrato reprocesable de un mensaje de corresponsal es el **texto** más los metadatos de orden e instante. `first_name`, `last_name`, `username` y `language_code` son **inertes para el reproceso**: no hay parser futuro que los lea. Un campo que ningún código lee no es "necesario" en el sentido del art. 5.1.c, y el art. 25.2 (protección de datos **por defecto**) exige que "solo sean objeto de tratamiento los datos personales que sean necesarios para cada uno de los fines".

**b) Esto NO es la alternativa que ADR-009 rechazó, y la spec tiene que decir por qué.** ADR-009 §Alternativas rechazó «*retención indefinida con anonimización del HTML archivado*» por dos motivos: que anonimizar el crudo destruye RN-10, y que **exigiría un parser fiable para saber qué tachar, lo cual es circular**. Aquí **la circularidad no existe**: el update de Telegram es **JSON estructurado con esquema documentado y estable**, así que la redacción es una *lista blanca de claves*, decidible sin interpretar una sola palabra del dominio. Es la diferencia entre tachar un HTML de tercero (hay que entenderlo) y no copiar un campo de un JSON (basta con no copiarlo). Sin este párrafo, un verificador citará ADR-009 como precedente en contra.

**c) La objeción de orden, y su respuesta.** Alguien dirá: redactar antes de archivar es tratar antes de archivar, contra RN-10. No: RN-10 ordena **archivar antes de *parsear***, no antes de *tocar*. El sistema ya toca el objeto antes de escribirlo — `rawKey()` se calcula de `RawObjectMeta` y del cuerpo, y el segmento `<source>` y `<competition_id>` de la clave son conocimiento de encaminamiento aplicado **antes** de la escritura (`src/raw/store.ts`). Para blindarlo, la spec debe exigir que **la redacción sea sin pérdida sobre `message.text`: el texto se archiva verbatim, byte a byte**. Lo que se pierde es solo lo que nadie iba a leer.

### Qué conservar exactamente

**Se archiva (lista blanca declarada):**

- `update_id` — orden e idempotencia.
- `message.message_id` — referencia estable dentro de la conversación.
- `message.date` — el instante. Es **materia prima de la primera cifra de EPIC-002** (latencia): sin él no hay medición.
- `message.text` — **verbatim**.
- `message.reply_to_message.message_id` — solo si el flujo de confirmación usa respuestas.
- Del `callback_query` de confirmación: `id`, `data`, `message.message_id`.
- **`correspondent_id` interno** en lugar de `from.id` / `chat.id` (ver punto 5). Es un pseudónimo local del proyecto, no un identificador transversal de Telegram.

**No se archiva, y no es negociable:** `from.first_name`, `from.last_name`, `from.username`, `from.language_code`, `from.is_bot`, `from.is_premium`, `chat.first_name/last_name/username/type`, `entities`, metadatos de reenvío, fotos, y **cualquier clave que no esté en la lista blanca** (por defecto se descarta, no por defecto se conserva).

### Un hueco de retención que la spec hereda y que hoy no tiene dueño

**Ni ADR-009 ni ADR-020 cubren este archivo, y sus alcances son textuales:**

- ADR-009 §1: «*fija la política de retención del raw store **para las ventanas de medición de EPIC-001***».
- ADR-020 §1: «*fija la retención de **todo lo que SPEC-012 archiva** … durante las jornadas de medición declaradas*» y añade que «*el día que la medición quiera volverse sondeo sin fin, este ADR no se estira*».

Un update de Telegram archivado por SPEC-015 no cae en ninguno de los dos. **La spec no debe inventar un plazo en un CA**, sino tratarlo como ADR-008 §5.3 trató el plazo de la ventana: **precondición**. O un ADR que extienda el régimen B (30 días desde el fin de la jornada, una prórroga escrita y motivada, techo duro de 90, purga manual con fecha antes y acuse después) al archivo del corresponsal, o la spec se aprueba con el plazo sin fijar y eso es un agujero conocido. El régimen B es el correcto y encaja: el archivo del corresponsal sirve exactamente para lo mismo (recalibrar el parseo del LLM, replayar la jornada). **ADR-020 §4 ya deja despejado lo que viene después**: el `raw_ref` colgante es estado declarado, no error.

**Cuestión práctica abierta, no la inventes:** la clave raw es `<source>/<competition_id>/<YYYY-MM-DD>/…` y **`competition_id` no se conoce antes de parsear un mensaje libre**. Hay al menos dos salidas (una constante declarada, o la competición declarada del corresponsal en su catálogo) y la elección no le corresponde al rol legal; se señala porque bloquea el diseño del archivado.

> **Recomendación accionable (forma de CA).** (i) Test de lista blanca total sobre el objeto archivado, con control positivo (ADR-016). (ii) Test de que `message.text` archivado es idéntico byte a byte al recibido. (iii) La fecha de purga se escribe **antes** de habilitar el bot y se acusa después, en el ledger, con la ceremonia de ADR-009 §4 / ADR-020 §3.

---

## 3. La llamada al LLM

**Dictamen: sí, es un encargado del tratamiento, y no, no basta con no enviar identificadores. Hay que hacer las dos cosas.**

**Es un encargo del art. 28.** Enviar el texto a Anthropic (u OpenAI) para que lo parsee según nuestras instrucciones es tratamiento por cuenta del responsable → **art. 28.3 exige contrato o acto jurídico vinculante**. Anthropic lo ofrece: los [Commercial Terms of Service](https://www.anthropic.com/legal/commercial-terms) (vigentes desde **17-06-2025**) incorporan el DPA por referencia en su §C, y su §B dice literalmente «*Anthropic may not train models on Customer Content from Services*» y que el cliente conserva los derechos sobre sus *Inputs* y es dueño de los *Outputs*.

**"¿Basta con enviar solo el texto, sin nombre ni id?" No, por dos motivos independientes:**

1. **El texto sigue siendo dato personal.** Es una comunicación escrita por una persona identificada, y nosotros conservamos la información adicional que la reidentifica. El considerando 26 y las [Directrices EDPB 01/2025 sobre seudonimización](https://www.edpb.europa.eu/system/files/2025-02/edpb_summary_202501_pseudonymisation_en.pdf) (adoptadas el 16-01-2025) son explícitas: los datos seudonimizados **siguen siendo datos personales** para quien controla el *pseudonymisation domain*. Quitar el nombre reduce el riesgo; no saca el tratamiento del RGPD.
2. **Aunque lo sacara, seguirían viajando datos de terceros** dentro del texto (jugadores, árbitros, posible salud). El encargo haría falta igual.

**Transferencia internacional.** Anthropic PBC es estadounidense. Dos vías posibles:

- **Art. 45**, decisión de adecuación del **EU-US Data Privacy Framework** — *si* el proveedor está certificado. **No se pudo confirmar, con fuente autoritativa, que Anthropic figure en la lista de participantes**; queda como pregunta abierta verificable en [dataprivacyframework.gov/s/participant-search](https://www.dataprivacyframework.gov/s/participant-search).
- **Art. 46.2.c**, cláusulas contractuales tipo. Fuentes secundarias sitúan en el DPA de Anthropic las SCC Módulos 2 y 3 ([compound.law](https://compound.law/en-DE/tools/anthropic-scc/)); **hay que comprobarlo contra el texto firmado, no contra un blog**.

**Recomendación: apoyarse en las SCC del DPA, no en el DPF**, y la razón es concreta y con fecha: el Tribunal General desestimó el recurso de Latombe el **03-09-2025** (asunto T-553/23) confirmando la adecuación, pero **el recurso de casación está pendiente ante el TJUE desde el 31-10-2025 (C-703/25 P)** ([IAPP](https://iapp.org/news/a/european-general-court-dismisses-latombe-challenge-upholds-eu-us-data-privacy-framework), [WilmerHale](https://www.wilmerhale.com/en/insights/blogs/wilmerhale-privacy-and-cybersecurity-law/20251201-european-court-of-justice-to-review-challenge-to-eu-us-data-privacy-framework)). El DPF es **plenamente válido hoy**; construir sobre el instrumento que sobrevive a su anulación no cuesta nada y ahorra un Schrems III.

**Retención del subencargado, que no controlamos y hay que declarar:** Anthropic elimina automáticamente *inputs* y *outputs* del backend **en 30 días**, con excepción de contenido marcado por violación de políticas —**hasta 2 años** los inputs/outputs y **hasta 7 años** las puntuaciones de clasificación— y ofrece **Zero Data Retention** para clientes elegibles ([privacy.claude.com, retención en productos comerciales](https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-personal-data)). Esto tiene que aparecer en el aviso de privacidad: nuestro plazo de 30 días no manda sobre el suyo.

### Restricciones concretas que la spec puede imponer en código

1. **El prompt lo construye una sola función, y su tipo de entrada no puede transportar un identificador.** Firma del estilo `buildPrompt(input: { text: string; candidates: MatchCandidate[] }): string` — sin corresponsal, sin `chat.id`, sin nombre. Que sea el **tipo** el que lo impida, no la disciplina.
2. **Test de arquitectura en forma ADR-016** sobre el cliente del LLM: se enumeran las llamadas permitidas y se exige que el resto sea vacío, con control positivo por mecanismo, y declarando dentro del propio CA lo que el mecanismo **no** alcanza (p. ej.: no alcanza a que el corresponsal firme el mensaje con su nombre dentro del texto — eso es suyo y es inevitable).
3. **Test de fuga sobre el prompt renderizado**: dado un fixture sintético de update con nombre y `@username` rellenos, el string final del prompt no contiene ninguno de los dos. El aserto va sobre los **campos**, nunca sobre el texto.
4. **Ni el system prompt ni el esquema de herramientas nombran a una persona**, y el catálogo de alias que se pase como contexto no va indexado por persona.
5. **Decidir explícitamente si la respuesta JSON del LLM se archiva.** Es discutiblemente una «respuesta cruda» de RN-10 y se parsea (se valida con zod, RN-09). Si se archiva, mismo régimen y misma lista blanca. **Que la spec lo diga; que no lo deje al implementador.**
6. **Contratar ZDR si se es elegible**; si no, dejar por escrito los 30 días / 2 años / 7 años de arriba.
7. **Guardar copia fechada del DPA aceptado en `docs/legal/`.** Un DPA que nadie puede exhibir no es un DPA.

**Lo que ya está bien y conviene decirlo:** RN-09 / D-4 exigen salida JSON validada **y confirmación humana**. Eso significa que el LLM no determina nada por sí solo, lo que mantiene el **art. 22** (decisiones automatizadas) fuera de juego. Es la mitigación más fuerte del diseño y ya estaba puesta.

---

## 4. Base jurídica y transparencia

**Que el corresponsal sea el propio autor cambia mucho menos de lo que parece, y la spec no debe apoyarse en ello.**

- **No aplica el art. 2.2.c** (actividad exclusivamente personal o doméstica): marcador.gal es un proyecto público con voluntad declarada de sostenibilidad económica (**D-7**).
- **La exposición de terceros existe ya.** Los jugadores y árbitros nombrados en el texto no son el autor. Art. 14, art. 5.1.c y el riesgo del art. 9 están vivos **desde el primer mensaje**, con el autor como único corresponsal.
- **Y construirlo sin aviso para «ponerlo cuando llegue el segundo» es exactamente lo que prohíbe el art. 25** (protección de datos **desde el diseño**). El coste de escribir el aviso hoy es un fichero de i18n; el de retrofitarlo es una spec.

### Base jurídica recomendada para un corresponsal que no sea el autor

**No consentimiento como base principal, y el motivo es del proyecto, no genérico: el consentimiento choca con RN-13.** El consentimiento es revocable en cualquier momento (art. 7.3) y su retirada abre el art. 17.1.b. Pero **las `Observation` son inmutables por regla dura: no se borran ni se editan**. Consentimiento + RN-13 = una obligación de supresión que el modelo canónico prohíbe cumplir. Eso no se arregla con un párrafo.

**Recomendación:**
- **Art. 6.1.b** (ejecución de un acuerdo de colaboración, aunque sea no remunerado) para el tratamiento operativo — el bot no funciona si no sabe quién envía.
- **Art. 6.1.f** (interés legítimo) para la **trazabilidad durable** que exigen RN-12 y D-6 y que el corresponsal no puede apagar. El interés legítimo es nombrable en una frase: *la integridad y auditabilidad de un marcador publicado*. Redactar una **ponderación (LIA)** corta —necesidad, balance, expectativas razonables— y versionarla en `docs/legal/`.
- **Y la pieza de diseño que hace que esto se sostenga**: como el log inmutable solo lleva el `correspondent_id` interno (punto 5), **una solicitud de supresión se atiende borrando el mapeo, sin tocar el log**. Ése es el diseño que hace convivir RN-13 con el art. 17, y es el argumento más fuerte a favor del punto 5.

### El responsable tiene que estar identificado, y eso toca ADR-012

Art. 13.1.a exige «*la identidad y los datos de contacto del responsable*». **Un buzón es contacto, no identidad.** ADR-012 dejó esa pregunta abierta pero **acotada** a «*un sitio público **sin recogida de datos**, sin cookies y sin actividad económica*». **El bot destruye la acotación: es recogida de datos.** Dictamen: **el día que haya un corresponsal que no sea el autor, el responsable tiene que ser identificable por nombre (o entidad jurídica) en el aviso del bot y en la página de privacidad.** Mientras el autor sea el único corresponsal, es responsable e interesado a la vez y la exposición práctica es nula — pero los terceros nombrados en el texto adelantan el reloj.

El propio ADR-012 escribió qué pasa entonces: «*Si el dictamen exige identificación en el propio sitio, esta decisión vuelve al arquitecto: no se parchea a mano*». Y como SPEC-007 está `hecho`, el camino es el de **ADR-015**: enmienda en el ledger bajo `## Enmienda — <fecha>`, nunca editar el cuerpo. **Requiere revisión profesional.**

### Qué debe decir el bot, y cuándo

- **En `/start`, ANTES de aceptar contenido**, en **galego por defecto con castellano** (D-2, literales en `src/i18n/` desde el primer día), el mínimo del art. 13: quién es el responsable y cómo contactarlo (`ola@tremen.dev`, ADR-012); qué se trata (*o teu identificador de Telegram e o texto que envíes*); para qué; base jurídica; **que o texto se envía a un provedor de IA para interpretalo**; canto tempo se conserva; e os dereitos. Con enlace a la página completa.
- **Una página `/privacidade` y `/es/privacidade`** con el art. 13 y el art. 14 completos: en un mensaje de Telegram no cabe, y el enlace es lo que hace defendible el resumen.
- **Comando `/privacidade`** que reimprime el aviso y el enlace.
- **Comando de baja** (`/baixa`): deja de aceptar mensajes de esa persona y dispara el borrado del mapeo. **Testable, y es la implementación práctica del art. 17 y del art. 21.**
- **No pongas un botón de consentimiento si la base no es el consentimiento.** Un botón que no es la base induce a error y contradice el art. 13.1.c. Si el gate elige consentimiento, tiene que ser real: revocable, con la consecuencia escrita, y con el choque con RN-13 resuelto antes.

### Registro de actividades de tratamiento (art. 30)

La excepción del art. 30.5 para <250 empleados **no aplica**: el tratamiento no es ocasional (es cada jornada). **Recomendación: un RAT mínimo** en `docs/legal/`, una página. Art. 31 LOPDGDD 3/2018; la AEPD publica la herramienta *Gestiona RAT*.

---

## 5. Retención e identificadores en Postgres

**Dictamen: `correspondent_id` interno declarado a mano, en la forma de ADR-017 (calendario) y ADR-018 (catálogo de alias). Es la única de las tres opciones que hace convivir RN-13 con el art. 17.**

**Contra `telegram_user_id` numérico en las filas inmutables — rechazo firme.** Es un identificador **transversal y externamente reidentificable**: estable de por vida, compartido con todos los bots que esa persona use, y suficiente para contactarla o correlacionarla fuera de este proyecto. Meterlo en un log que **RN-13 prohíbe borrar** es crear un **identificador directo imborrable**. Eso no es un riesgo teórico: es la colisión del punto 4 en su peor forma, y además convierte las filas de la base en una clave de enlace con el ecosistema de Telegram, justo lo que el art. 5.1.c y el art. 25 mandan no hacer.

**Contra el hash / pseudónimo derivado — rechazo, con matiz.** Tres problemas: (i) sigue siendo dato personal (considerando 26; EDPB 01/2025: la seudonimización es medida de seguridad y minimización, **no una salida del RGPD**); (ii) si el *salt* es una constante del repositorio —**y el repositorio es público**— el hash es reversible por fuerza bruta trivial: para una persona concreta basta con probar un puñado de ids plausibles; (iii) no compra nada que el id declarado no dé, y cuesta la legibilidad que RN-12 necesita, porque la trazabilidad la lee **una persona** en el panel: `corresponsal-01` se lee, `a3f9c1…` no. Queda como *plan B* solo si un catálogo declarado resultara imposible.

**A favor del `correspondent_id` declarado:** es un token **local del proyecto**, sin significado fuera de él; su información adicional (el mapeo a Telegram) se guarda **separada** y **es borrable**. Es literalmente el *pseudonymisation domain* de las Directrices EDPB 01/2025 bien construido: dominio seudonimizado = la base de datos; información adicional = el mapeo; y los dos, separados.

**Dos advertencias concretas sobre la forma:**

1. **El token no debe llevar el nombre ni la localidad de la persona.** `corresponsal:xove` en un repositorio público, cruzado con el calendario de partidos, identifica a una persona en una comunidad pequeña. Usa `corresponsal-01`, `corresponsal-02`.
2. **Restricción estructural del código actual, que la spec tiene que resolver:** `src/decide/roles.ts` mapea el `SourceId` **exacto** `'corresponsal'` y **falla cerrado** ante uno desconocido (`UnknownSourceRoleError`, ADR-021 §8.4). Es decir: **un `source` de la forma `corresponsal:01` reventaría el motor**, y arreglarlo obligaría a tocar ficheros de una spec que está `hecho`. Conclusión: **`Observation.source` se queda en `corresponsal`, y el `correspondent_id` vive en otro sitio** (columna aparte o tabla `correspondent_messages`). Esto tiene un beneficio de privacidad además del técnico: mantiene a la persona **fuera de todos los joins que hace el motor**.

**Diseño concreto sugerido:**

- Catálogo `correspondents` **declarado y reemplazado al cargar**, forma ADR-018 (todo o nada): `{ correspondent_id, competicións, alta, activo }` — **versionable**.
- Mapeo `correspondent_id → telegram_user_id`: **fuera de git** (punto 6).
- Trazabilidad: `Decision` → `supporting_observation_ids` → `Observation(source='corresponsal', raw_ref)` → objeto raw redactado, que lleva el `correspondent_id`. **Que la spec elija un único domicilio para el `correspondent_id` y lo diga**; dos domicilios es dos sitios que purgar.

---

## 6. La lista cerrada de corresponsales autorizados

**Dictamen sobre rechazar a quien no esté en la lista: correcto, recomendado y no hay ningún problema legal.** Es minimización (art. 5.1.c), es seguridad (art. 32) y evita que el bot recoja datos de desconocidos. Es la misma forma de todo-o-nada de ADR-018.

**Dos matices que sí hay que escribir en un CA:**

- Cuando el bot rechaza, **ya ha recibido** el update: Telegram empuja antes de que decidamos. Así que la spec tiene que decir que el update rechazado **no se archiva ni se persiste**, solo se **cuenta**. Ni siquiera en logs con el id del remitente: un contador.
- La respuesta de rechazo debe ser **neutra**, sin confirmar quién es o no corresponsal.

**Dictamen sobre versionar el id numérico de Telegram en git: NO. Y en este repositorio la respuesta es más dura, porque es PÚBLICO.**

- Un id de Telegram en un repositorio público es **publicación de un identificador personal** a audiencia indeterminada, sin base jurídica, y permite correlacionar a esa persona con el resto de su presencia en Telegram.
- **Y git no se purga: se reescribe.** Este argumento no es del rol: **ADR-009 §3 ya lo hizo, palabra por palabra, para el HTML de terceros**, y lo calificó de política «*sin excepción, porque su incumplimiento no es reversible*». La spec debe citarlo, porque es el mismo razonamiento aplicado a un dato peor.
- **Regla recomendada:** el catálogo de `correspondent_id` **puede versionarse** (es un token local); el **mapeo a `telegram_user_id` no se versiona nunca**. Va en variable de entorno (Vercel env) o en una tabla cargada a mano.
- **¿Importa que el repositorio sea privado? Menos, pero la regla no cambia.** En un repositorio privado el riesgo de divulgación baja, pero git sigue sin purgarse —una solicitud de supresión obligaría a reescribir la historia— y un repositorio privado se hace público con un clic o se bifurca. **Misma regla en los dos casos**, y así se escribe una sola vez.

> **Recomendación accionable (forma de CA).** (i) Update de remitente no listado ⇒ **cero objetos raw, cero `Observation`, cero filas**, y una traza sin id ni nombre. (ii) Test de arquitectura en forma ADR-016 que enumere los puntos del código autorizados a leer el mapeo y exija que el resto sea vacío. (iii) El cargador del mapeo lee de entorno/BD y **no tiene ninguna ruta que lea de un fichero del repositorio** — eso es testable sin depender de un `grep` frágil.

---

## 7. Otros riesgos, y lo que el rol no puede contestar

### Riesgos que la spec debe tratar explícitamente

**a) El texto libre es la superficie de más riesgo y no se puede minimizar.** Mitigaciones: que el aviso del bot **diga en galego qué no enviar** (*«non fai falta escribir nomes de xogadores, árbitros nin datos de saúde»*), y un CA de que **la `Decision` publicada nunca transporta nada del texto salvo los campos estructurados parseados** (partido, marcador, minuto, estado). El texto vive en el archivo bajo el régimen de 30/90 y **nunca en una superficie publicada**.

**b) Salud de terceros (art. 9).** Contenido probable, no hipotético. No se puede impedir que alguien lo escriba; sí que se publique, que se propague más allá del parseo y que se conserve más allá del plazo. Si resultara recurrente, hace falta un análisis del art. 9 en serio, porque **ninguna excepción del art. 9.2 encaja con un marcador**.

**c) Art. 14 — terceros nombrados en los mensajes.** Informarlos individualmente es imposible; el art. 14.5.b (esfuerzo desproporcionado) es invocable, **pero exige hacer pública la información**. Remedio barato y real: **un párrafo en `/privacidade` dirigido a las personas nombradas en mensajes de corresponsales**. Es literalmente lo que la norma pide a cambio.

**d) El webhook es una URL pública.** Cualquiera que la adivine puede inyectar un update falso, y un update falso es una `Observation` de peso **0.8**. Usa el `secret_token` de Telegram (cabecera `X-Telegram-Bot-Api-Secret-Token`) y un CA de que **un update sin secreto válido se rechaza antes de archivar nada**. Es art. 32 y es integridad de RN-08 a la vez.

**e) Hay dos eventos entrantes, no uno.** El mensaje y el callback de confirmación. Los dos son crudos. La spec debe decir que **los dos se archivan redactados** y que la `Observation` solo se escribe tras el segundo — de modo que **habrá objetos raw sin `Observation`**, y eso es legítimo y hay que declararlo, como ADR-020 §4 declaró el `raw_ref` colgante.

**f) La respuesta del LLM.** Ver punto 3.5: decidir explícitamente si entra en RN-10.

**g) El hueco de retención del punto 2.** Es lo más cercano a un bloqueo: **ni ADR-009 ni ADR-020 cubren este archivo**. Trátalo como ADR-008 §5.3 trató su precondición, no como follow-up.

**h) Telegram es a su vez un tercero fuera de la UE.** Telegram FZ-LLC opera desde Emiratos y los mensajes transitan por su infraestructura. **No podemos firmar un DPA con Telegram**: nos regimos por sus [Bot Platform Developer ToS](https://telegram.org/tos/bot-developers), que imponen obligaciones **a nosotros** —§4 minimización y política de privacidad accesible, §4.2 borrado a petición y cuando la retención deje de ser necesaria, §9.1 cumplir el RGPD— y ninguna a ellos hacia nosotros. Esa asimetría se **declara en el aviso**, no se disimula; y el aviso enlaza la [política de Telegram](https://telegram.org/privacy). Nota adicional: la [política estándar de bots](https://telegram.org/privacy-tpa) se aplica por defecto **salvo que el bot tenga la suya**, así que publicar la nuestra la desplaza — otra razón para escribirla.

**i) Deriva de finalidad.** Si estos datos alimentan algún día el feed comercial de D-7 («datos como negocio»), la finalidad cambia (art. 5.1.b) y hace falta base nueva. **Riesgo con disparador escrito**, destino EPIC-MEJORA, en la forma que ya usa el proyecto.

### Preguntas que el rol NO puede contestar sin más información

1. **¿Está el proveedor de LLM elegido certificado en el DPF hoy, y su DPA firmado incluye SCC Módulos 2 y 3?** No se pudo confirmar con fuente autoritativa. Verificar en el buscador de participantes del DPF y **contra el texto del DPA**, no contra un blog, antes de escribir el CA.
2. **¿Tiene o tendrá el proyecto entidad jurídica (autónomo, SL)?** De ello depende quién es el responsable identificado en el aviso, y D-7 más PR858A ya apuntan en esa dirección.
3. **¿Los corresponsales serán voluntarios, remunerados, o personal de club?** Decide entre 6.1.b y 6.1.f, y si hay contrato del que hablar.
4. **¿Entrará alguna vez fútbol base (menores) en los partes de corresponsal?** Si la respuesta es sí, **re-consultar al rol antes de aprobar la spec**.
5. **¿Quiere el gate una EIPD (art. 35)?** Lectura del rol: **no procede** —ni gran escala, ni observación sistemática, ni art. 9 por diseño—, pero la combinación texto libre + LLM + tercer país roza varios criterios de la lista de la AEPD. Recomienda **un «no procede» corto y fechado** en `docs/legal/`, que vale más que el silencio.

### Requiere revisión profesional (el rol no es abogado)

1. **La identificación del responsable** y su interacción con ADR-012 y SPEC-007 (`hecho` → ADR-015, enmienda en ledger).
2. **La ponderación de interés legítimo** y la convivencia de RN-13 con los arts. 17 y 21.
3. **La exposición del art. 9** por datos de salud de terceros en texto libre.
4. **Si 30 días es defendible ante la AEPD** para texto libre de un corresponsal — la misma reserva que ADR-009 escribió sobre su propio plazo, y por el mismo motivo: nadie aquí puede afinar el correcto, así que se elige groseramente conservador.

---

## Invariantes afectados y artefactos a revisar

| Invariante / artefacto | Efecto |
|---|---|
| **RN-10** | Se cumple con **update redactado**, no íntegro. No es la excepción de ADR-009: no hay circularidad (punto 2.b). |
| **RN-13** | Colisiona con el consentimiento y con el art. 17. Se resuelve con el `correspondent_id` y el mapeo borrable (puntos 4 y 5). |
| **RN-09 / D-4** | Ya bien: la confirmación humana mantiene el art. 22 fuera de juego. |
| **RN-12 / D-6** | Sostiene el interés legítimo de la trazabilidad durable. |
| **ADR-009 / ADR-020** | **Ninguno cubre este archivo.** Hace falta ADR o precondición. |
| **ADR-012 / SPEC-007** (`hecho`) | Su pregunta abierta estaba acotada a «sin recogida de datos». El bot rompe la acotación → enmienda por ADR-015. |
| **ADR-016** | Forma obligatoria de los CA de frontera de los puntos 1, 3 y 6. |
| **ADR-018** | Forma del catálogo de corresponsales (declarado, reemplazo al cargar, todo o nada). |
| **ADR-021 §8.4 / `src/decide/roles.ts`** | `source` debe seguir siendo `corresponsal`; el `correspondent_id` va en otro sitio o el motor falla cerrado. |
| **D-2** | Todo el aviso, los comandos y la tarjeta, en galego con castellano, en `src/i18n/`. |

---

**Fuentes.** Normativa: RGPD (UE) 2016/679, arts. 4.1, 5.1.b/c/e, 6.1.b/f, 7.3, 9.1-9.2, 11, 13, 14 (y 14.5.b), 17, 21, 22, 25, 28.3, 30 (y 30.5), 32, 45, 46.2.c, considerandos 26 y 30; LOPDGDD 3/2018, arts. 6 y 31; Ley 34/2002 (LSSI) art. 10. Proyecto: `FOUNDATION.md` (D-1..D-8), `docs/fundacion/reglas.md` (RN-01, RN-08..RN-13), ADR-002, ADR-008 §5.3, ADR-009 §§3-6, ADR-012, ADR-015, ADR-016, ADR-017, ADR-018, ADR-020 §§1-4, ADR-021 §8.4, `src/decide/roles.ts`, `src/raw/store.ts`. Externas consultadas el **2026-09-02**:

- [Telegram Bot Platform Developer Terms of Service](https://telegram.org/tos/bot-developers) — §4, §4.2, §9.1 (sin fecha de versión publicada)
- [Telegram Standard Bot Privacy Policy](https://telegram.org/privacy-tpa) y [Telegram Privacy Policy](https://telegram.org/privacy)
- [Anthropic Commercial Terms of Service](https://www.anthropic.com/legal/commercial-terms) — vigentes desde 2025-06-17, §B y §C
- [Anthropic — retención de datos en productos comerciales y API](https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-personal-data)
- [EDPB, Directrices 01/2025 sobre seudonimización](https://www.edpb.europa.eu/system/files/2025-02/edpb_summary_202501_pseudonymisation_en.pdf) — adoptadas 2025-01-16
- [IAPP — el Tribunal General desestima Latombe y confirma el DPF](https://iapp.org/news/a/european-general-court-dismisses-latombe-challenge-upholds-eu-us-data-privacy-framework) (T-553/23, 2025-09-03)
- [WilmerHale — recurso de casación C-703/25 P pendiente ante el TJUE](https://www.wilmerhale.com/en/insights/blogs/wilmerhale-privacy-and-cybersecurity-law/20251201-european-court-of-justice-to-review-challenge-to-eu-us-data-privacy-framework) (interpuesto 2025-10-31)
- [EU-U.S. Data Privacy Framework — buscador de participantes](https://www.dataprivacyframework.gov/s/participant-search) (a verificar)
- [compound.law — SCC en el DPA de Anthropic](https://compound.law/en-DE/tools/anthropic-scc/) (**fuente secundaria; verificar contra el DPA firmado**)
