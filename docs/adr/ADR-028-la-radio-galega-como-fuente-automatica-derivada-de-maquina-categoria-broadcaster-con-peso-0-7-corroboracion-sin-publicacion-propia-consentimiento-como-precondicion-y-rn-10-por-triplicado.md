---
id: ADR-028
tipo: adr
estado: borrador
historial:
  - {estado: borrador, fecha: 2026-09-12, por: sdd-arquitecto}
---
# ADR-028: La Radio Galega como fuente automática derivada de máquina — categoría broadcaster con peso 0.7, corroboración sin publicación propia, consentimiento como precondición y RN-10 por triplicado

- Deciders: propone `sdd-arquitecto` el 2026-09-12, al abrir **EPIC-005**, sobre
  el diseño que Alberto Fojo conversó y aprobó ese mismo día en la épica. **Lo
  que aquí se decide y la épica no había cerrado —el peso, el texto de RN-01 y
  de RN-09, qué puede y qué no puede una fuente derivada de máquina dentro del
  reducer, y la reinterpretación de D-4 que eso supone— es decisión de gate.**
  **Aprueba: pendiente de gate humano.** Nace en `borrador` y ningún rol `sdd-*`
  puede firmarlo.
- Specs relacionadas: **SPEC-019** (el spike técnico, nace con este ADR y con
  ADR-029; no ejecuta nada de lo que aquí se fija, pero su precondición §4 es la
  misma); las tres specs previstas de la épica (§12), que lo ejecutan por
  partes; **SPEC-008** y **SPEC-013** (`hecho`: `RN01_WEIGHTS` y `SOURCE_ROLES`
  son suyos y ganan una entrada cada uno por la vía de ADR-011 §6); **SPEC-018**
  (`hecho`: `AUTOMATIC_SOURCES` deriva de `DEFAULT_SOURCES` y esta fuente no
  entra ahí, §10); **SPEC-002** y **SPEC-003** (`hecho`: el instrumento de
  independencia, y la contradicción de §3).
- Relacionado: **ADR-029** (el oyente como función larga; gemelo de éste, como
  ADR-019/ADR-020 y ADR-022/ADR-023), **ADR-008 §1** (la fuente oficial no es
  capturable; la vía (a) —autorización escrita del titular— es exactamente la
  que la CRTVG abre), **ADR-009** y **ADR-020** (el régimen de retención que
  aquí se extiende), **ADR-015** (enmiendas a specs cerradas), **ADR-016** (cómo
  se demuestra una frontera), **ADR-018** (el catálogo de alias declarado, que
  aquí sí encaja), **ADR-021 §7 y §8.4** (la independencia declarada y la tabla
  de roles que falla cerrado), **ADR-022 §3, §5 y §6** (lista blanca, lista
  cerrada de candidatos y puerto del modelo: los tres patrones se reutilizan),
  **ADR-023** (encargados del tratamiento, régimen B, transparencia),
  **ADR-027 §3.d** (el disparador de re-dictamen de la publicación, que esta
  fuente pisa), **RN-01, RN-02, RN-04, RN-05, RN-06, RN-07, RN-09, RN-10,
  RN-11, RN-12, RN-13**, **D-3, D-4, D-5, D-6, D-7**, y el registro
  `docs/legal/2026-09-12-consentimiento-crtvg-radio-galega.md` (§4), que se
  cita y no se edita.

> **Este ADR no es asesoramiento jurídico.** Lo escribe un rol de arquitectura
> sobre hechos consultados el 2026-09-12 y sobre el precedente de ADR-023, que
> tampoco lo es. Su §11 enumera lo que exige revisión profesional, y el dictamen
> de `sdd-legal-datos` que la épica exige como condición de cierre **no se ha
> pedido todavía**: este rol no puede invocarlo, y aquí se deja como
> precondición con nombre (§4).

## Contexto

### La aritmética que esta fuente viene a cambiar

Desde el 2026-09-01 el proyecto sabe que solo hay una fuente automática
capturable (`ceroacero.es`, 0.7) y que, por eso, **nada llega a *confirmado*
sin una persona** (ADR-008 §1). La segunda vía de RN-02 está escrita, probada
con dobles e inerte: `INDEPENDENT_PAIRS` nace vacía (ADR-021 §7,
`src/decide/independence.ts`). La cifra de conflictos de EPIC-002 «puede no
medir nada» con una sola fuente. EPIC-005 existe para poner la primera entrada
en esa lista **con un veredicto medido detrás**, y la Radio Galega es la
candidata por tres razones que no comparte ningún agregador: no bebe de futgal
ni de ceroacero —tiene una persona en el campo—, su latencia la fija esa
persona, y **es capturable**: hay consentimiento del titular.

### Lo que la fuente es, dicho sin adornos

**Toda su cadena es máquina:** audio → texto (ASR) → propuesta (LLM) →
`Observation`. Ninguna persona mira un gol antes de que exista la fila. Eso la
distingue de todo lo que el motor conoce: el agregador lo escribe una redacción
y lo lee un parser determinista; el corresponsal lo escribe una persona y lo
confirma con un botón; el operador arbitra. **RN-09** dice que un LLM nunca es
la única fuente de un marcador, y **D-4** —*locked*— lo repite con dos usos
enumerados, «proponer alias» y «parsear mensajes de corresponsal», «siempre con
salida JSON validada y confirmación humana». Una `Observation` de radio no
tiene confirmación humana por gol y no es ninguno de los dos usos. **O este ADR
dice cómo cabe, o no cabe.** La épica ya fijó la respuesta —corroboración,
nunca publicación propia— y este ADR la escribe como regla y como código.

### Los hechos legales, consultados el 2026-09-12

- El **aviso legal de la CRTVG** (`https://www.crtvg.es/aviso-legal`) reserva la
  reproducción y el «tratamiento informático» de sus contenidos y limita su uso
  a fines personales y privados. **Sin consentimiento, esta fuente estaría
  bloqueada igual que `futgal.es`** (ADR-008 §1): transcribir en directo y
  archivar audio es tratamiento informático y no es uso privado.
- **Hay consentimiento expreso de la CRTVG para este proyecto**, y su alcance
  está **declarado por Alberto Fojo el 2026-09-12** en
  `docs/legal/2026-09-12-consentimiento-crtvg-radio-galega.md` —el primer
  documento de `docs/legal/`, que hasta hoy no existía (ADR-023 §Negativas)—.
  Según lo declarado cubre **grabar y archivar el audio**, **transcribir**, el
  **tratamiento automático incluidos proveedores terceros de ASR y LLM**, y el
  **uso comercial**; **no exige atribución de momento**. **La copia del
  documento no está adjunta**: ese registro es una declaración, no la prueba,
  y él mismo lo dice; y **no declara si nombra un programa concreto ni su
  vigencia**.
- El stream de Radio Galega es HLS público según listados de terceros
  (`https://crtvg-radiogalega-hls.flumotion.cloud/playlist.m3u8`). **La URL
  oficial se pide a la CRTVG, no se adivina**: el consentimiento tiene que
  nombrar lo que autoriza.
- El audio lleva **voces de periodistas** —personas identificables, en
  ejercicio profesional y en una emisión pública— y **nombres de jugadores,
  árbitros y entrenadores** dichos en antena: datos personales de terceros de
  los que no obtenemos los datos (art. 14 RGPD), exactamente el caso que
  ADR-023 §Contexto ya analizó para el texto del corresponsal.

### Y lo que ningún ADR vigente dice, y el código tiene que decidir

1. **Qué categoría y qué peso** tiene una emisora transcrita en RN-01, y dónde
   vive eso en código, porque el registro de fuentes de SPEC-008 tiene la forma
   de una página HTML (`competitions: [id, url][]`, `extract: RowExtractor`) y
   la radio no cabe en él.
2. **Qué puede y qué no puede una fuente derivada de máquina** en cada regla
   del reducer: si sostiene sola, si corrobora, si libera un salto, si cierra
   un partido, si veta en un conflicto, si acalla un silencio.
3. **Qué es el consentimiento a efectos de este proyecto** —una precondición o
   un follow-up— y qué pasa si su alcance no cubre archivar el audio.
4. **Cómo se cumple RN-10 en una cadena de tres saltos** y a qué apunta el
   `raw_ref`.
5. **Cuánto se conserva** un audio con voces y un texto con nombres, y bajo qué
   régimen de datos personales.
6. **Detrás de qué puertos** van el ASR y el LLM, y qué exige cada proveedor.
7. **Cómo propone el extractor** sin inventar partidos ni marcadores, y qué
   papel tiene el catálogo de alias, del que el bot se apartó (ADR-022 §5).
8. **Si RN-11 alcanza a un stream** consentido, y por qué puerta sale.
9. **Qué pasa con la publicación**: ADR-027 §3.d(8) nombra «una segunda fuente
   automática» como disparador de re-dictamen, y esta es una.

## Decisión

### §1. La fila nueva de RN-01: categoría `broadcaster`, peso 0.7, `SourceId` `radio_galega`

**Se añade a RN-01 una categoría nueva, la emisora transcrita (`broadcaster`),
con peso 0.7, y una fuente en ella, `radio_galega`.** El texto que se propone
añadir a `docs/fundacion/reglas.md`, **al aprobarse este ADR y no antes** —este
ADR no edita `reglas.md`—, va a continuación de la tabla de pesos de RN-01 y
antes de su primera aclaración:

> **Emisora transcrita (Radio Galega) 0.7, derivada de máquina.** Una emisora
> con una persona en el campo cuyo audio se transcribe y se lee por máquina es
> una fuente automática más, con el peso de un agregador: lo que observa es
> comparable —alguien vio el gol— y su cadena entera hasta la `Observation`
> es máquina, que es lo que la aclaración de RN-09 acota. **Su peso está en el
> umbral de la segunda vía de RN-02 a propósito**: por debajo de 0.7 no podría
> corroborar a nadie y no serviría para lo único que se le pide.
>
> <!-- Decidido por Alberto Fojo en el gate del 2026-09-12, firmando ADR-028 §1
>      (EPIC-005, la Radio Galega como fuente). No es un umbral que se mueva:
>      es una fila nueva en la tabla, con una categoría que no existía porque
>      hasta hoy ninguna fuente llegaba al motor por audio. El peso 0.7 no
>      concede a esta fila lo que concede a un agregador —publicar sola,
>      provisional—: eso lo retira la aclaración de RN-09 de la misma fecha,
>      que hay que leer junto a esta fila. -->

**Por qué 0.7 y no otro número.** 0.8 es el corresponsal confirmado —una
persona que confirmó con un botón— y darle lo mismo a una cadena sin persona
contradiría la propia tabla. 0.6 o 0.5 deja a la fuente por debajo del umbral
de RN-02 y la convierte en ruido: no podría corroborar y la épica no tendría
objeto. 0.7 es el peso de «alguien vio el hecho y lo publicó una redacción», y
la radio es eso con una persona en la grada y un micrófono en medio. **Lo que
0.7 no concede lo retira §2**: con `machine_derived` una `Observation` de radio
nunca publica sola, así que el número no le da los poderes de RN-03 que sí le
da a un agregador.

**Dónde vive, en código.** Los números de RN-01 tienen un solo domicilio
(`RN01_WEIGHTS`, `src/ingest/sources.ts`, SPEC-008) y los roles otro
(`SOURCE_ROLES`, `src/decide/roles.ts`, SPEC-013, ADR-021 §8.4). Los dos son
ficheros de specs `hecho`: la spec que los toque lo hace por ADR-011 §6, con
referencia cruzada en sus ledgers, y con una línea cada uno:
`broadcaster: 0.7` y `[RADIO_GALEGA]: 'broadcaster'`. **`radio_galega` NO entra
en `DEFAULT_SOURCES`**: esa lista enumera los pares (fuente, competición) que
el tick de ingesta sondea por HTTP (ADR-019 §2), y la radio no se sondea, se
escucha (ADR-029). La consecuencia sobre `AUTOMATIC_SOURCES` está en §10.

**El identificador es `radio_galega`**, con guion bajo, que la clave del raw
store admite (`RAW_KEY_PATTERN`, `src/raw/key.ts`: `[a-z0-9._-]`). Es una
fuente, no un programa: si algún día se escucha otro programa de la misma
emisora, es la misma fuente; si se escucha otra emisora, es otra fila y otro
consentimiento (`_epica.md`, *Fuera*).

### §2. La aclaración de RN-09: una fuente derivada de máquina corrobora, alerta y mide; nunca sostiene sola una `Decision`, ni provisional

**Se marca la categoría `broadcaster` como derivada de máquina
(`machine_derived`) en la tabla de roles, y el reducer lo lee de ahí.** Es una
propiedad de la **categoría** y no de la fuente concreta, por la misma razón
por la que `isHuman` e `isOfficial` son funciones del rol (`src/decide/roles.ts`):
lo que la hace derivada de máquina es *cómo* llega al motor —audio, ASR, LLM—,
y eso es cierto de cualquier emisora que se escuche así. Vive junto a esas dos,
como `isMachineDerived(role)`, y falla cerrado como todo lo de esa tabla
(ADR-021 §8.4).

El texto que se propone añadir a **RN-09** en `reglas.md`, al aprobarse este ADR:

> **Una fuente derivada de máquina nunca sostiene sola una `Decision`, ni
> provisional.** Hay fuentes cuya cadena entera hasta la `Observation` es
> máquina —audio transcrito por un ASR y leído por un LLM, como la emisora
> transcrita de RN-01—. Su `Observation` **existe y se escribe** (es lo que la
> fuente dijo, un hecho histórico, RN-13), pero el marcador que lleva **nunca se
> publica sin una segunda fuente que no sea derivada de máquina**: eso es
> «nunca es la única fuente de un marcador», dicho para una fuente y no para
> una llamada. En el reducer, una `Observation` así **no puede ser la
> observación que manda**: no abre `scheduled → live`, no publica un marcador
> ni provisional, y no mueve nada por sí sola. **Lo que sí hace es sumar:**
> cuenta como segunda fuente donde las reglas piden una —la que libera un salto
> retenido en RN-04, las «dos fuentes coincidentes» de RN-06— y como la segunda
> de las «dos independientes» de RN-02 **solo** si el par está declarado
> independiente (ADR-021 §7). **Y nunca resta:** una discrepancia con ella
> genera la alerta de RN-05 —que es lo que la cifra de conflictos cuenta— pero
> **no retiene** la `Decision` que la otra fuente sostiene, y su `Observation`
> **no acalla** el silencio de RN-07: el reloj de *sen sinal* cuenta
> observaciones que podrían sostener lo publicado, y ésta no puede. La
> confirmación humana que esta regla exige para el LLM se cumple, para una
> fuente así, en el **catálogo de alias declarado** de sus nombres orales
> (ADR-018) y en que ninguna persona necesita confirmar un gol que la máquina
> **no puede publicar sola**.
>
> <!-- Decidido por Alberto Fojo en el gate del 2026-09-12, firmando ADR-028 §2
>      (EPIC-005). No relaja RN-09: la restringe a un caso que la regla no
>      contemplaba —una fuente entera, no un parser de mensajes— y fija cuál de
>      dos lecturas vale. Reinterpreta D-4 en un punto y lo dice: D-4 enumera
>      dos usos del LLM con confirmación humana; éste es un tercero, en el que
>      la confirmación humana por gol se sustituye por la incapacidad
>      estructural de publicar solo. Solo un ADR aceptado puede hacerlo
>      (FOUNDATION.md), y éste lo es desde esta firma. -->

**Esto reinterpreta D-4, y hay que firmarlo sabiéndolo.** D-4 es *locked* y
solo un ADR aceptado puede reinterpretarlo. Lo que este ADR cambia de D-4 es
**una cosa**: admite un tercer uso del LLM —leer goles de una transcripción—
en el que «confirmación humana» no es un botón por gol sino (a) el catálogo de
nombres orales confirmado por una persona y (b) la garantía de que la salida
del LLM **no puede** llegar a la pantalla sin otra fuente. Lo que **no cambia**:
la salida JSON validada (§8), que ningún LLM inventa la identidad de un partido
(ADR-022 §5), y que las dos vías de siempre —alias y corresponsal— siguen con
su botón.

**Las seis lecturas, una por regla, y por qué cada una:**

1. **RN-02/RN-03 — no manda.** En `rank` el reducer elige la observación que
   manda; una derivada de máquina **no puede serlo**. Sin esto, una radio sola
   a 0.7 publicaría *provisional* por RN-03, que es justo lo que la épica
   prohíbe. Como segunda de la vía 2 de RN-02 cuenta **solo con el par
   declarado** (§3): hasta entonces, radio + ceroacero coincidentes siguen
   publicando *provisional* por ceroacero.
2. **RN-04 — libera un salto.** «Se retiene hasta segunda fuente»: la radio es
   segunda fuente. Un 0-3 que ceroacero da de golpe y la radio confirma es la
   corroboración exacta que RN-04 esperaba; negársela dejaría el salto
   retenido cuando hay quien lo vio.
3. **RN-05 — alerta sí, retención no.** RN-05 literal retendría la `Decision`
   vigente mientras dure la discrepancia. Con una fuente cuya precisión **no
   está medida** —es lo que la épica mide— eso da a un error de ASR («dous» por
   «tres») el poder de **bloquear** la publicación de ceroacero un partido
   entero, y RN-03 dice lo contrario. Se decide: **la alerta se escribe** (fila
   en `alerts`, materia prima de la tercera cifra) **y la `Decision` sigue
   saliendo de la fuente que puede sostenerla**. Es «suma, nunca resta». **La
   alternativa —veto— queda escrita en §Alternativas y es decisión de gate.**
4. **RN-06 — cierra con otra.** «`live → finished` con dos fuentes
   coincidentes»: la radio es una de las dos. Sola no cierra nada (regla 1).
   `postponed`/`suspended` ya son solo de la oficial o del humano.
5. **RN-07 — no acalla.** Si ceroacero calla quince minutos y la radio sigue
   observando, lo publicado —que es de ceroacero— **no lo está sosteniendo
   nadie que pueda moverlo**: *sen sinal* es cierto y se emite. La radio, que
   no puede publicar, tampoco puede certificar que hay señal.
6. **RN-12 — se registra igual.** Sus ids van en `supporting_observation_ids`
   cuando corrobora, y la regla decisiva es la que corresponda: una `Decision`
   confirmada por la vía 2 registra RN-02 con las dos observaciones. La
   trazabilidad de D-6 no cambia de forma.

**Lo que esto no toca.** El peso que se evalúa sigue siendo el congelado en la
`Observation` (RN-01, aclaración del 2026-09-02); `machine_derived` es
**identidad** y se lee de la tabla, exactamente como «quién es humano». El
modelo canónico no cambia: ni columna, ni estado, ni cualificador (ADR-021 §6).

### §3. Independencia: el par `radio_galega`/`ceroacero` no entra en `INDEPENDENT_PAIRS` sin veredicto medido — y el instrumento de hoy no puede emitirlo

**El par no se declara por convicción.** Que la radio «tiene una persona en el
campo» es el motivo de esperar independencia, no la prueba: un estudio puede
leer un marcador de una web entre conexión y conexión, y eso es exactamente lo
que un espejo hace. `INDEPENDENT_PAIRS` gana su primera entrada **solo con un
veredicto medido**, con su motivo y su fecha, y hasta entonces la vía 2 de
RN-02 sigue inerte también con la radio dentro.

**Y hay una contradicción entre la épica y una spec cerrada que este ADR tiene
que nombrar (ADR-015 §5).** `_epica.md` exige «veredicto radio/ceroacero con
el instrumento de SPEC-003: independiente / espejo / inconcluso». **SPEC-003
CA-4 dice, y su tipo lo impide, que INDEPENDIENTE no es un veredicto emitible
en el modo sin referencia**, y CA-5 fija `rn02_segunda_via_entre_automaticas:
false` en todos los desenlaces. El motivo está en su §Diseño 2: sin la
referencia, dos candidatas que se adelantan mutuamente son compatibles con dos
copias de un origen no observado. **Con el instrumento tal como está, el
veredicto de la épica solo puede ser ESPEJO o INCONCLUSO**, y la lista seguiría
vacía aunque la radio adelantase a ceroacero en cada gol.

Este ADR **no** resuelve la regla de decisión para un par heterogéneo —una
fuente web y una fuente de campo— porque eso es reabrir el instrumento y exige
su propio ADR con la letra de SPEC-002 CA-15 (adelantos mutuos) y CA-10
(errores replicados) delante. Lo que sí fija es **la forma de la salida**:

- La cuarta spec de la épica (§12) necesita **una de dos** cosas: que
  `futgal.es` sea capturable y corra SPEC-002 con referencia, o **un ADR que
  defina el modo con referencia parcial** para un par en el que una de las dos
  fuentes observa el hecho por construcción —con qué señales, qué mínimos y qué
  sigue sin poder afirmar—. Es decisión de gate cuál de las dos, y **hoy no se
  puede prometer que la lista gane su entrada**: lo honesto es decir que la
  épica puede cerrarse con INCONCLUSO y con la radio sirviendo para alertas y
  latencia, que es un éxito según su propio criterio.
- Mientras tanto, la entrada de `INDEPENDENT_PAIRS` la escribe **una persona,
  con el veredicto citado**, nunca un rol ni una spec por su cuenta.

### §4. El consentimiento de la CRTVG es una precondición, no un follow-up — su alcance declarado cubre el audio, y la copia adjunta es lo que falta

**Existe, su alcance está declarado, y la copia no está adjunta.** El registro
`docs/legal/2026-09-12-consentimiento-crtvg-radio-galega.md` (declarado por
Alberto Fojo el 2026-09-12; **no se edita desde aquí, se cita**) fija lo que
este ADR necesita saber, y lo que todavía no:

| Ámbito | Declarado | Lo que decide aquí |
|---|---|---|
| **Grabar y archivar el audio** | **Sí** | RN-10 se cumple **archivando el segmento tal como lo sirve el CDN** (§5). La variante «archivar solo la transcripción» **deja de ser necesaria** y queda abajo solo como lo que pasaría si el documento dijera menos |
| **Transcribir** | Sí | — |
| **Tratamiento automático, incluidos proveedores terceros de ASR y LLM** | **Sí** | **Siguen haciendo falta los DPA por proveedor** (§7): el consentimiento del titular de la emisión no sustituye el contrato con el encargado del tratamiento (art. 28), que es otra relación con otra parte |
| **Uso comercial** | **Sí** | La fuente **no queda limitada a la medición por el consentimiento**; lo que la limita hoy es **ADR-019 §3** —solo se escucha dentro de jornadas declaradas— por diseño del sistema, y el ADR de producción de ADR-009 §6 sigue haciendo falta el día que eso cambie (§6) |
| **Atribución** | **No se exige de momento**, con posible renegociación | **Ningún literal de i18n hoy.** El disparador está escrito en ese registro: si la CRTVG la pide, es un literal nuevo en los bundles (D-2, paridad) y una entrada del inventario de EPIC-004; no toca el motor ni el registro de fuentes |

**Lo que el registro no dice, y este ADR trata como no dicho:** si el
consentimiento nombra **un programa** (*Galicia en goles*) o la emisión entera,
y **su vigencia y revocación**. Mientras no se lea el documento, el oyente se
limita a **partidos en ventana de jornadas declaradas** (ADR-029 §2), que es
más estrecho que cualquiera de las dos lecturas; y al revocarse, parar es
vaciar `MEASUREMENT_WINDOWS` (ADR-027 §3.d, cláusula permanente) y purgar.

**La precondición, con el patrón de ADR-023 §6.4:** **ninguna spec de código
de la épica pasa a `en-progreso` antes de que la copia del documento esté
adjunta en `docs/legal/`** y las dos filas «no dicho» estén leídas contra él
—es el disparador 1 del propio registro—. La URL oficial del stream **se pide
a la CRTVG** con la copia; no forma parte del consentimiento y no se adivina.
**Para el spike (SPEC-019 CA-0), si puede correr sobre audio real con la
declaración y sin la copia es decisión de gate**, y la spec lo deja así con
los dos argumentos.

**Si el documento dijera menos de lo declarado** —disparador 3 del registro—,
se escribe un ADR que supersede parcialmente a éste **antes** de la siguiente
jornada declarada. Y para que ese ADR no tenga que inventar nada, la
degradación queda escrita ya: si no cubriera archivar el audio, RN-10 se
cumpliría archivando la **transcripción** —el segmento se procesaría en
memoria y se descartaría, la respuesta cruda del ASR pasaría a ser la
respuesta cruda de la fuente, la `Observation` apuntaría a ella, y el replay
perdería la capacidad de **re-transcribir con un motor mejor**—; si no
cubriera archivar tampoco la transcripción, **la fuente no sería utilizable**,
porque RN-10 no tiene excepción por fuente (ADR-022 §Alternativas, «no archivar
nada del corresponsal»).

**Y la condición de cierre de la épica que este rol no puede cumplir:** el
`robots.txt` del host del stream y el aviso legal de la CRTVG **dictaminados
por `sdd-legal-datos` con fecha**. Este ADR cita los hechos; el dictamen lo
pide el orquestador, y sin él la primera spec de código no se aprueba.

### §5. RN-10 por triplicado: el audio como lo sirve el CDN, el ASR en bytes, el LLM en bytes

**Tres respuestas crudas por trozo, y las tres se archivan antes de tocarse:**

1. **El segmento de audio, tal como lo sirve el CDN**, byte a byte, con la
   extensión de su contenedor (`ts`, `aac`, `m4a`… lo que el stream sirva; el
   spike lo dice). Ni recodificado, ni recortado: lo que se archiva es lo que
   respondió el tercero.
2. **La respuesta del ASR, en bytes, antes de parsearla.** El puerto del ASR
   devuelve bytes (§7), el dominio los archiva, y solo después se leen.
3. **La respuesta del LLM, en bytes, antes de validarla** con zod (§8). Es la
   tercera cosa de ADR-022 §6 que «se queda de este lado».

**La clave, y la irregularidad que lleva dentro.** La clave del raw store es
`<source>/<competition_id>/<día>/<instante>-<digest>.<ext>`, y **un trozo de
audio no es de una competición**: el programa salta de campo en campo. Se hace
lo que ADR-022 §3 hizo con el corresponsal: el `source` es `radio_galega` para
los tres objetos —**un solo prefijo de purga**— y el segundo segmento es el
**tipo de objeto**, de una lista cerrada de tres valores con su motivo:
`audio`, `transcricion`, `proposta`. Quien lea una clave bajo `radio_galega/`
tiene que saberlo, y por eso está aquí y no en un comentario.

**A qué apunta cada cosa.** La `Observation` lleva en `raw_ref` **la
transcripción** (el objeto `transcricion`), que es el sustrato reprocesable: de
ella se vuelve a extraer con un extractor corregido. **La transcripción apunta
a su audio**, y como el cuerpo del ASR se archiva verbatim y `RawObjectMeta` no
tiene sitio para un padre (`src/raw/store.ts`), el enlace vive en una **tabla
append-only de trozos** (`radio_chunks`, migración de la segunda spec): por
trozo, la clave del audio, la del ASR, la de la propuesta si la hubo, los
instantes y el índice dentro de la invocación. Es lo que `ingest_attempts` es
para el tick (ADR-019 §5): registro de un acto, no modelo canónico, y RN-13 no
la alcanza. **Dos de los tres objetos quedan colgantes** cuando el trozo no
produce `Observation` —que es la mayoría—, y eso es estado declarado, como en
ADR-022 §3.

**Los duplicados del solape no cuestan archivo:** la clave lleva el digest del
cuerpo (ADR-009 §Contexto), así que el mismo segmento pedido por dos
invocaciones que se solapan produce **la misma clave** y `put` no escribe dos
veces. Lo que cuesta —transcribir dos veces— lo evita `radio_chunks` (ADR-029 §3).

### §6. Retención y régimen de datos personales: el régimen B por jornada, y solo texto

**El plazo es el de siempre, y se cita, no se reinventa** (ADR-009 §2 opción B,
ADR-020 §2, ADR-023 §2): por cada jornada de medición declarada, **30 días
desde su `to`**, **una** prórroga escrita y motivada antes de expirar, **techo
duro de 90 días**; purga **manual** con la ceremonia entera —fecha escrita
antes de declarar la jornada, acuse después, sin acuse no hay jornada
siguiente— sobre el prefijo `radio_galega/` en Blob, fuera del puerto. Y la
frontera de validez es la misma: **vale mientras la escucha sea por jornadas
declaradas y finitas**. Un oyente encendido toda la temporada es el ADR de
producción que ADR-009 §6 exige, con el art. 5.1.e delante y, aquí, con voces
dentro. **Que el consentimiento cubra el uso comercial (§4) no acorta ese
camino**: autoriza la finalidad, no la retención, y lo que hoy hace finita la
escucha es ADR-019 §3, no el titular.

**Qué datos personales hay, y cómo se minimizan:**

- **Las voces.** Son de personas identificables en ejercicio profesional y en
  emisión pública. **Minimización: solo el texto sirve.** No hay diarización,
  no hay reconocimiento de locutor, no se deriva ningún rasgo de la voz, y **el
  audio no viaja más allá del ASR**: el LLM recibe texto. El audio archivado
  (si el consentimiento lo cubre, §4) caduca con la jornada. Esto **no** es
  tratamiento biométrico —no se identifica a nadie por la voz— y hay que poder
  afirmarlo con un criterio: ningún módulo de `src/radio/` pide al ASR
  diarización ni etiquetas de hablante.
- **Los nombres dichos en antena.** Jugadores, árbitros, entrenadores: art. 14,
  como en ADR-023 §5. El párrafo público de `/privacidade` dirigido a las
  personas nombradas —precondición ADR-023 §6.1, **todavía sin construir**—
  gana una frase sobre la radio. No se tacha nada de la transcripción (ADR-009
  §Alternativas: tachar exige entender, es circular).
- **Los encargados.** El proveedor de ASR y el de LLM son **encargados del
  tratamiento** (art. 28), cada uno con su DPA fechado en `docs/legal/`
  **antes** de escribir su adaptador (§7), con las cláusulas de transferencia
  que ADR-023 §3 fija y con la advertencia de §3 ter: **el análisis no viaja
  con el adaptador**. El plazo de retención de cada proveedor se escribe en el
  aviso; el nuestro no manda sobre el suyo.
- **La base jurídica** de las voces y los nombres es la de ADR-023 §4, interés
  legítimo (art. 6.1.f) para la trazabilidad de un marcador publicado; el
  consentimiento de la CRTVG es la **autorización sobre el contenido**, no la
  base del RGPD sobre las personas. La LIA de ADR-023 §6.3 se extiende, no se
  duplica. El registro del art. 30 gana una fila. Y el «no procede» del art.
  35 (ADR-023 §6.5) **se revisa**: audio + ASR + LLM + tercer país roza más
  criterios que texto + LLM. Todo ello, revisión profesional (§11).

### §7. Los dos proveedores van detrás de puertos del dominio, y cada uno con su DPA antes de su adaptador

**Patrón ADR-022 §6, dos veces.** `src/radio/asr.ts` declara el puerto del ASR
—**entran bytes de audio y su contenedor, salen bytes**— y `src/radio/llm.ts`
el del extractor —**entra el prompt renderizado, salen bytes**—, los dos en el
vocabulario del problema y no en el de ningún SDK. Los adaptadores viven en
`src/radio/models/<proveedor>.ts`, uno por proveedor y capacidad, y **no
existen** hasta que su DPA esté en `docs/legal/` (ADR-023 §6.4: la
precondición que bloquea código). Sin adaptador, los puertos fallan cerrados y
con nombre, como `unconfiguredModel()` en `src/bot/llm.ts`.

**Lo que se queda de este lado y no se mueve al cambiar de proveedor**, igual
que en ADR-022 §6: el troceado y el contenedor del audio, el constructor del
prompt (cuyo tipo de entrada no transporta identidad de persona —aquí no la
hay, pero tampoco transporta el `correspondent_id` de nadie—), el esquema zod
de la propuesta con sus rechazos (§8), el archivado de las respuestas crudas
(§5), y la frontera ADR-016 de quién puede llamar. **Nada propietario cruza**:
ni bloques de contenido, ni parámetros de esfuerzo, ni cabeceras, ni códigos
de error, ni el identificador del modelo, que vive dentro de su adaptador.
**Sin SDK** (SPEC-009: cada uno sería una entrada nueva en `ALLOWED_PACKAGES`
por cada candidato). La llamada a cada encargado es una **petición de salida
declarada** con su motivo, en las listas de SPEC-009, como ADR-022 §6 hizo con
el LLM del bot.

**El puerto del LLM del bot no se importa.** `src/bot/llm.ts` tiene la misma
forma y sería tentador reutilizarlo; `src/radio/` no importa `src/bot/`: son
dominios distintos con archivos y regímenes distintos, y un adaptador
compartido es una entrada de EPIC-MEJORA con disparador escrito —el tercer
llamante de un LLM—, no una importación cruzada hoy.

**Este ADR no elige proveedor de ASR ni de LLM.** El de ASR lo recomienda el
spike (SPEC-019 CA-6) con su tasa de acierto y su latencia medidas; el de LLM
sigue aplazado como en ADR-023 §3 bis. **Y cada uno reabre el análisis legal
desde cero** (ADR-023 §3 ter), con la excepción que allí ya está escrita y que
aquí pesa más: un ASR de pesos abiertos en infraestructura propia o europea
—Proxecto Nós— elimina el encargo y la transferencia enteros. Esa vía exige una
máquina que Vercel no da, y por eso vive en ADR-029 como alternativa con
disparador.

### §8. El extractor propone dentro de una lista cerrada, con marcador explícito y con nombres orales declarados

**La identidad del partido no se busca: se ofrece** (ADR-022 §5). Cada trozo
transcrito se entrega al extractor junto a **la lista cerrada de partidos en
ventana** —los del calendario declarado (ADR-017) dentro de una jornada de
medición declarada (ADR-019 §3), de las dos competiciones—, con su `match_id`,
sus nombres canónicos y **sus nombres orales declarados** (abajo). El esquema
zod exige que todo `match_id` devuelto sea uno de los entregados; cualquier
otro es rechazo, no propuesta.

**La salida es una lista de propuestas —cero, una o varias por trozo— y cada
una lleva:** `match_id` (de la lista), `status` (**solo `live` o `finished`**:
una radio no aplaza ni suspende nada, RN-06 ya se lo reserva a la oficial y al
humano), `home_score` y `away_score` (enteros ≥ 0, obligatorios en las dos
ramas), y **`evidence`: la cita literal de la transcripción que contiene el
marcador**. Los rechazos, enumerados como en `src/bot/proposal.ts` y cada uno
con un caso: `unparseable`, `unknown_match`, `unknown_status`,
`negative_score`, `scoreboard_mismatch`, y tres nuevos que son la defensa contra
el formato del programa:

- **`evidence_not_in_transcript`** — la cita **no es subcadena literal** de la
  transcripción entregada. Es lo que impide que el modelo «recuerde» un marcador
  que no oyó.
- **`no_explicit_score`** — la cita no contiene un marcador (dos cantidades,
  en cifra o en palabra, en galego o en castellano). **Un gol cantado sin
  marcador no produce `Observation`**: derivarlo del estado sería LLM más
  estado, y la épica lo deja fuera y lo cuenta.
- **`unaliased_team`** — la cita no contiene, para **cada uno** de los dos
  equipos del partido elegido, **al menos un nombre oral declarado** en el
  catálogo. Es la forma en que RN-09 —«nunca se publica un resultado sobre un
  equipo sin alias confirmado por una persona»— se cumple aquí **por el dato y
  no por el criterio del modelo**: el partido lo eligió el LLM, pero la
  identidad la sostiene un alias que firmó una persona.

**El catálogo de alias declarado sí encaja aquí, y hay que decir por qué,
porque ADR-022 §5 lo descartó para el corresponsal.** Allí las grafías eran
las de una persona escribiendo con una mano desde una banda: ni estables ni
finitas. Las de una emisora **son estables y finitas**: un locutor dice «o
Arenteiro», «o Boiro», «Alondras» y «Alondras de Cangas», y las dice igual cada
sábado. Es enrutado vigente de **una fuente**, exactamente lo que ADR-018 §1
define, y se declara en `alias/<temporada>/radio_galega.json` con el cargador
que ya existe (SPEC-011), **sin tocar el mecanismo**. La normalización de
comparación para `unaliased_team` es la de SPEC-001 CA-5 más una concesión
propia de la oralidad que la spec del extractor fija —minúsculas y sin acentos
sobre el texto del ASR, que no escribe con ortografía estable—, **declarada
como divergencia** y no como cambio de `normalizeAlias`. La cobertura que se
pierde por un nombre no declarado es **cobertura degradada por catálogo**,
como en ADR-018 §Negativas, y la cifra de cobertura de la épica la distingue.

**Y el extractor no tiene memoria entre trozos.** No se le entrega el marcador
vigente ni la propuesta anterior: cada trozo se lee solo. Es más rechazos y
menos falsos positivos, y es lo único que hace verdadera la frase «no se deriva
del estado».

### §9. RN-11 y el stream: sale por la única puerta, se identifica, respeta el `robots.txt` del host, y el ritmo lo fija el stream

**Toda petición de `src/radio/` sale por `politeFetch`** (ADR-014 §4; el test
de arquitectura de SPEC-008/SPEC-009 lo exige de todo `src/`): playlist,
segmentos, y —como peticiones de salida declaradas— el ASR y el LLM. El
`User-Agent` es el de ADR-011, así que la CRTVG y su CDN ven quién escucha, con
el enlace a `/robot`.

**El `robots.txt` del host del stream se consulta y se archiva** por el
`PolicyGate` durable de ADR-019 §4, con fallo cerrado. Si lo prohíbe, **no se
puentea con el consentimiento por defecto**: el consentimiento de la CRTVG es
sobre su contenido, y el host puede ser un tercero (Flumotion). Se levanta
**solo** si el archivo de §4 nombra esa URL como la autorizada por el titular
—que es la vía (a) de ADR-008 §1, aplicada al stream y no a futgal— y ese hecho
se escribe junto a la entrada del oyente en el código, con su motivo.

**El ritmo de RN-11 no es el de un stream, y esto es una lectura que conviene
escribir.** RN-11 dice «no bajar de 1 petición por minuto por competición», y
está escrito para el rastreo de páginas: un par (fuente, competición) y una
URL que se refresca. Un stream HLS se consume a la cadencia que **el propio
stream** fija —una lista de reproducción y un segmento cada pocos segundos—,
sobre **un** origen y sin competición, y a ese ritmo lo escucha cualquier
oyente humano. **Se decide:** el oyente pide al stream a la cadencia que la
lista de reproducción declara y **nunca por encima de ella**, no pide más de
una lista por segmento, y **no rastrea ninguna página** de la CRTVG. Esa
cadencia se registra en `radio_chunks` para que la cifra «peticiones al
tercero por jornada» exista. Se propone añadir a RN-11 una frase en ese
sentido al aprobarse este ADR —«un stream consentido se consume a la cadencia
que el stream declara, con `User-Agent` y `robots.txt` como siempre; el ritmo
por competición es del rastreo de páginas»—, **y es decisión de gate si esa
frase entra en `reglas.md` o se queda solo aquí**.

### §10. La segunda fuente automática pisa el disparador de re-dictamen de la publicación (ADR-027 §3.d.8)

ADR-027 §3.d nombra, como octavo disparador que **reabre el dictamen de
`sdd-legal-datos` sobre la publicación**, «que el aviso de degradación deje de
ser cierto: **una segunda fuente automática**». La radio lo es. Consecuencias:

- **Nada de la radio alcanza el marcador público** —ni como corroboración que
  cambie un cualificador, ni como cambio del aviso— hasta que ese re-dictamen
  esté emitido y el gate firme. La spec del extractor y motor (§12, tercera)
  lo lleva como precondición, no como CA.
- **`AUTOMATIC_SOURCES` (`src/board/sources.ts`, SPEC-018 CA-13.8) deriva de
  `DEFAULT_SOURCES`, y la radio no entra ahí (§1).** Así que el aviso seguiría
  diciendo «unha soa fonte» con dos fuentes automáticas, y sería **falso sobre
  nuestra propia actividad**, que es exactamente lo que CA-13.8 existe para
  impedir. La tercera spec **ensancha la derivación** —el número sale de la
  unión de los sondeados y de las emisoras escuchadas, en un solo sitio— **en
  el mismo cambio** que activa la fuente, con la enmienda de SPEC-018 CA-13.8
  por ADR-015 y el literal plural releído por `sdd-lingua`. Es un fichero de
  una spec `hecho`: ADR-011 §6.

### §11. Lo que exige revisión profesional, y lo que este ADR no decide

**Revisión profesional, como ADR-023 §7, y nada de esto se da por resuelto por
estar escrito:**

1. El **alcance del consentimiento** de la CRTVG frente a su aviso legal:
   que la copia diga lo que el registro declara, y lo que el registro no
   declara —programa y vigencia— (§4).
2. Que **la voz no es dato biométrico** en este tratamiento por no identificar
   a nadie con ella (§6), y la exposición de terceros nombrados en antena.
3. El **encargo y la transferencia** de cada proveedor de ASR y LLM (§7).
4. La revisión del **«no procede» del art. 35** con audio en la cadena (§6).
5. Si **30 días** es defendible para audio con voces, que es más que texto.

**Lo que este ADR no decide:** dónde y cómo corre el oyente, los números de
ventana y trozo, y el segundo cron (**ADR-029**); qué proveedor de ASR
(**SPEC-019**) ni de LLM; la regla de decisión de independencia para el par
(§3, ADR futuro); el formato exacto del prompt y de la tarjeta de nada —no hay
tarjeta: nadie confirma un gol de radio—; y **la retención de producción**,
que sigue siendo F-SPEC-001-1, estrechada por cuarta vez.

### §12. La partición prevista de las specs, sin autorarlas

Propuesta, dependiente del resultado del spike y **no autorada**:

1. **SPEC-019 — el spike** (`borrador`, hoy): el stream dentro de una función,
   dos ASR con galego, cifra y elección de proveedor. Código desechable fuera
   de `src/`.
2. **Oyente y archivo**: `src/radio/` con el oyente, el troceado, el archivo
   por triplicado (§5), `radio_chunks`, el puerto de ASR con el adaptador del
   proveedor elegido y su DPA, la ruta `/api/cron/radio` y el segundo cron
   (ADR-029), la enmienda de SPEC-012 CA-8. Termina en **transcripción
   archivada**; ninguna `Observation`. Precondiciones: copia del consentimiento
   adjunta en `docs/legal/` (§4), DPA del ASR, dictamen de `sdd-legal-datos`
   sobre la fuente.
3. **Extractor y motor**: el puerto del LLM y su adaptador con DPA, el
   catálogo `radio_galega` de nombres orales, la propuesta con sus rechazos
   (§8), la `Observation` con `source: 'radio_galega'`, `broadcaster` en
   `RN01_WEIGHTS`, `radio_galega` en `SOURCE_ROLES`, `isMachineDerived` y las
   seis lecturas de §2 en el reducer, el ciclo hermano en `src/decide/`
   (ADR-029 §4), la derivación de `AUTOMATIC_SOURCES` (§10). Precondición: el
   re-dictamen de ADR-027 §3.d.
4. **Medición e independencia**: las cuatro cifras de la épica sobre dos
   jornadas declaradas, y el veredicto del par con la salida que §3 deja al
   gate. Si es *independiente*, la primera entrada de `INDEPENDENT_PAIRS`, con
   su motivo, escrita por una persona.

## Consecuencias

### Positivas

- **La segunda vía de RN-02 deja de ser una rama sin fuente real.** Con un
  veredicto detrás —si llega—, *confirmado* pasa a ser alcanzable sin persona,
  que es lo que mueve las dos cifras del corte del roadmap.
- **RN-09 y D-4 salen más fuertes, no más débiles**: la fuente derivada de
  máquina queda definida por lo que **no puede** hacer, y eso es una función
  de la tabla de roles con test, no una promesa.
- **La identidad sigue sin adivinarse nunca**: lista cerrada de partidos
  (ADR-022 §5) más alias orales confirmados por una persona (ADR-018) más cita
  literal. Tres cerrojos, cada uno con su rechazo nombrado.
- **RN-10 se cumple en los tres saltos** y la cadena
  `Decision → Observation → transcripción → audio` es verificable entera
  durante el plazo.
- **Un consentimiento con alcance escrito** es lo que `futgal.es` no tiene:
  el precedente sirve para la conversación con la RFGF.

### Negativas / follow-ups

- **Reinterpreta D-4** (§2) y toca ficheros de tres specs `hecho` —SPEC-008
  (`RN01_WEIGHTS`), SPEC-013 (`SOURCE_ROLES`), SPEC-018 (`AUTOMATIC_SOURCES`)—
  por ADR-011 §6, y **enmienda SPEC-018 CA-13.8** por ADR-015 (§10). Se nombra
  aquí para que nadie lo descubra con un test rojo.
- **La épica promete un veredicto que el instrumento no puede dar** (§3).
  Resolverlo es un ADR más, o `futgal.es`. Hay que decírselo a producto antes
  de la cuarta spec, no después.
- **Una fuente que nunca publica sola es una fuente que, sola, no aporta
  marcador**: si ceroacero cae, la radio no cubre el hueco. Es lo decidido, y
  la cifra de cobertura lo mostrará por separado.
- **La lectura de RN-05 sin retención** (§2.3) deja pasar la publicación de
  ceroacero cuando la radio la contradice. Si la precisión medida resulta alta
  y ceroacero se equivoca más, la decisión se revisa con esa cifra delante.
- **Tres objetos crudos por trozo, dos colgantes casi siempre**, y audio
  además: es el archivo más pesado del proyecto (del orden de 100–200 KB por
  trozo de 20–30 s, es decir, cientos de MB por jornada). El spike lo mide
  (SPEC-019 CA-1) y ADR-020 §3 sigue purgando a mano. **Si el volumen hace
  inviable la purga manual, es la spec de `delete` en el puerto** (ADR-009
  §5), no una prórroga.
- **El catálogo de nombres orales hay que escribirlo escuchando**, y cada
  nombre no declarado es cobertura perdida por catálogo. Sus minutos cuentan
  para la cifra de operación manual.
- **`docs/legal/` existe desde hoy con una declaración, no con una prueba**:
  le faltan la copia del consentimiento, el DPA del ASR y el DPA del LLM del
  extractor. Las tres cosas bloquean código, ninguna es un CA.
- **El coste por minuto escuchado es el coste de la fuente**, no por gol
  (`_epica.md`: 3–17 $ por jornada según motor, consultado el 2026-09-12). D-7
  lo mira con la cifra del spike.

## Alternativas consideradas

- **Peso 0.8, como el corresponsal.** Rechazada: 0.8 es «una persona confirmó
  con un botón»; aquí no hay botón. Y con `machine_derived` el número no
  cambia nada de lo que la fuente puede hacer sola.
- **Peso 0.6 o 0.5.** Rechazada: por debajo del umbral de RN-02 no corrobora, y
  corroborar es lo único que se le pide. Sería una fuente de alertas cara.
- **Dejar que la radio publique sola, provisional.** Rechazada sin discusión:
  es lo que RN-09 y D-4 prohíben y lo que `_epica.md` deja fuera con motivo.
  Si algún día una cifra lo justifica, es otro ADR con esa cifra delante.
- **Confirmación humana por gol desde el panel** (la radio como un segundo
  bot). Rechazada: convierte la fuente en operación manual, mata la latencia
  que es su valor, y no mide nada que el bot no mida ya.
- **Veto en RN-05**: que una discrepancia con la radio retenga la `Decision`
  vigente, como la regla dice literalmente. **Es la alternativa fuerte y va a
  gate.** Rechazada aquí porque da a una fuente de precisión no medida el poder
  de bloquear a la única que hoy publica, contra RN-03. Vuelve a la mesa con la
  cifra de precisión de la cuarta spec.
- **Que la radio acalle RN-07.** Rechazada: certificaría señal sobre un dato
  que no puede sostener.
- **Derivar el marcador del estado** cuando el locutor canta el gol sin decir
  el resultado. Rechazada: es LLM más estado, `_epica.md` lo excluye, y se
  mide cuántas veces pasa.
- **No usar el catálogo de alias, como el bot** (ADR-022 §5). Rechazada: las
  grafías orales de una emisora son estables y finitas —el caso de ADR-018, no
  el del corresponsal—, y sin ellas RN-09 dependería del criterio del modelo.
- **Diarización o reconocimiento de locutor** para separar campos. Rechazada
  por minimización: es tratamiento de la voz más allá de transcribirla, y la
  lista cerrada de candidatos resuelve lo mismo por el texto.
- **Archivar solo la transcripción por defecto, aunque el consentimiento cubra
  el audio.** Rechazada mientras el consentimiento lo cubra: el audio es lo
  único que permite re-transcribir con un motor mejor, y el spike existe
  porque el motor es la incógnita.
- **Anonimizar la transcripción antes de archivarla.** Rechazada por el motivo
  de ADR-009 y ADR-023: tachar dentro de una frase exige entenderla, es
  circular, y destruye el sustrato de RN-10.
- **Consentimiento como base jurídica del RGPD** para las voces. Rechazada por
  lo mismo que en ADR-023 §4, y además porque el consentimiento de la CRTVG es
  del titular del contenido, no de cada periodista.
- **Declarar el par independiente por diseño** («tiene una persona en el
  campo»). Rechazada: `dominio.md` es explícito —la independencia se mide, lo
  desconocido se trata como espejo— y un estudio que lee una web es un espejo
  con micrófono.
- **Fingir que el modo sin referencia de SPEC-003 puede emitir INDEPENDIENTE.**
  Rechazada: su CA-4 lo impide por tipo, y su motivo sigue siendo cierto. Lo
  honesto es §3.

<!-- REGLA: un ADR aceptado es INMUTABLE. Para cambiar la decisión, escribe otro ADR que lo supersede (estado del viejo -> bloqueada + nota "superseded por ADR-NNN"). -->
