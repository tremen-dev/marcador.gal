---
id: ADR-029
tipo: adr
estado: borrador
historial:
  - {estado: borrador, fecha: 2026-09-12, por: sdd-arquitecto}
---
# ADR-029: El oyente de la Radio Galega es una función larga en Vercel con un segundo cron — sin proceso vivo sigue siendo verdad, el motor pasa tras cada trozo y src/radio/ no publica

- Deciders: propone `sdd-arquitecto` el 2026-09-12, al abrir **EPIC-005**. **La
  decisión de fondo —función larga en Vercel frente a un worker aparte— la
  tomó Alberto Fojo el 2026-09-12** entre las tres opciones de §Alternativas;
  este ADR la registra, la diseña y escribe lo que la reabriría. **Lo que aquí
  se propone y él no había cerrado —los números, la lectura de ADR-019 §1 y de
  ADR-021 §4, el orden de preferencia ante HLS/AAC— es decisión de gate.**
  **Aprueba: pendiente de gate humano.** Nace en `borrador` y ningún rol
  `sdd-*` puede firmarlo.
- Specs relacionadas: **SPEC-019** (el spike que mide si esta decisión se
  sostiene: es su CA-1 y su CA-6, y §9 de aquí dice qué cifra la reabre); la
  segunda spec prevista de la épica (ADR-028 §12), que la ejecuta; **SPEC-012**
  (`hecho`: su **CA-8** —«declara **un** cron»— deja de ser cierto con este
  ADR y se enmienda por ADR-015 en su ledger, §5); **SPEC-013** (`hecho`: el
  ciclo de `src/decide/cycle.ts` gana un hermano, no un cambio); **SPEC-015**
  (`hecho`: el precedente de un segundo disparador del motor fuera del tick,
  ADR-022 §9).
- Relacionado: **ADR-028** (la fuente; gemelo de éste), **ADR-004** (Vercel
  Pro: cron a 1/min, 800 s de función, sin proceso vivo, sin disco), **ADR-010**
  (un solo despliegue), **ADR-014 §4** (una sola puerta de salida), **ADR-016**
  (fronteras de capacidad), **ADR-019 §1–§3** (el tick, la ventana por partido,
  las jornadas declaradas), **ADR-021 §3 y §4** (los dos disparadores del
  motor y dónde corre), **ADR-022 §7 y §9** (nace inerte; la puerta estrecha),
  **ADR-023 §3 ter** (el ASR autoalojado como excepción que simplifica),
  **SPEC-008 CA-12** (la frontera que `src/radio/` hereda), **RN-08, RN-10,
  RN-11**, **D-3**.

## Contexto

### Un stream es continuo y la plataforma no lo es

ADR-004 eligió Vercel Pro a cambio de cero operación y con tres consecuencias
escritas: cron a 1/minuto, sin disco, sin proceso vivo. Todo lo construido
desde entonces vive **menos de un minuto**: el tick de ingesta, el webhook del
bot, el panel, el snapshot. Ninguna pieza abre una conexión y la mantiene.

Una radio se escucha, y escuchar es una conexión abierta. Los límites, tal
como estaban en la documentación de Vercel el **2026-09-12**:

- **Vercel Pro con Fluid compute** permite `maxDuration` de **800 s** (y
  **1800 s en beta**). ADR-004 ya lo listó el 2026-08-29 («Pro 300 s por
  defecto, 800 s máximo, 1800 s en beta»); nadie lo había usado.
- **El cron de Pro es preciso al minuto, y puede llegar hasta un minuto
  tarde.**
- La facturación de Fluid cobra **CPU activa** más **memoria provisionada**:
  esperar I/O —que es lo que hace un oyente casi todo el tiempo— no es CPU
  activa.

### Las tres opciones, y la que se eligió

El 2026-09-12 Alberto Fojo tuvo delante tres formas de sostener el stream:

1. **Función larga en Vercel**, invocada por un cron, que escucha un rato y
   muere. Todo dentro del despliegue único.
2. **Worker aparte «tonto»** (una máquina siempre encendida) que **solo
   transcribe al raw store**; el tick de cada minuto lee las transcripciones
   nuevas y sigue.
3. **Worker aparte completo**, con ASR autoalojado de Proxecto Nós, que
   transcribe, extrae y escribe `Observation`.

**Eligió la 1.** Este ADR la diseña. Las otras dos están en §Alternativas con
sus motivos, y §9 dice qué cifra del spike devolvería la decisión a la mesa.

### Lo que hay que decidir para que «función larga» sea un diseño y no una frase

Cuánto dura una invocación, con qué cadencia se invoca, cómo se solapan dos
para que no haya hueco, en qué trozos se corta el audio, **quién llama al
motor y cuándo**, qué frontera tiene `src/radio/` con `Decision`, y qué pasa
con dos cosas que hasta hoy eran ciertas por construcción: que `vercel.json`
declara **un** cron (SPEC-012 CA-8) y que el proyecto no tiene «proceso vivo»
(ADR-019 §1).

## Decisión

### §1. Una ruta hermana del cron de ingesta: `/api/cron/radio`, cada 10 min, `maxDuration` 800

Vercel Cron, declarado en `vercel.json` con `schedule: "*/10 * * * *"`, invoca
**una** ruta del App Router, `src/app/api/cron/radio/route.ts`, con la forma
exacta de la de ingesta (ADR-019 §1) y por los mismos motivos:

1. Exige `Authorization: Bearer <CRON_SECRET>` y **falla cerrado**: sin la
   variable o sin el header exacto, 401 y ningún trabajo — ni stream, ni
   archivo, ni fila.
2. **No contiene lógica.** Declara `export const maxDuration = 800` —el techo
   de Pro con Fluid compute— e inyecta en el handler de `src/radio/cron.ts`
   **el ciclo de `src/decide/`** (§4), como `src/app/api/cron/ingest/route.ts`
   inyecta `productionCycle`.
3. Devuelve el resumen de la invocación como JSON: segmentos pedidos, trozos
   transcritos, propuestas, observaciones, y los huecos que detectó. Es
   diagnóstico, no API pública.

**La ruta es un punto de entrada más de `ENTRY_POINTS`** (SPEC-008 CA-2.5),
con su motivo escrito en el diff, y **su grafo alcanza la puerta de salida a
propósito**: el oyente pide al CDN y a dos encargados (ADR-028 §7 y §9), y lo
hace por `politeFetch`. El path vive como constante en `src/radio/cron.ts`
(`CRON_RADIO_PATH`) y un test deriva de ella la ubicación del fichero, como el
de CA-8 de SPEC-012.

### §2. Nace inerte: sin partidos en ventana no abre el stream

Cada invocación calcula, con el reloj de la plataforma, **los partidos en
ventana** con las dos funciones de `src/ingest/windows.ts` que ya existen
—`isInMatchWindow` sobre `MATCH_WINDOW` (ADR-019 §2) e `inMeasurementWindow`
sobre `MEASUREMENT_WINDOWS` (ADR-019 §3)—, **reutilizadas tal cual**. La lista
de jornadas declaradas **nace vacía**, así que un despliegue con nada declarado
**vuelve sin abrir el stream, sin pedir un byte y sin dejar fila**: es el bot
de ADR-022 §7 con otro disparador. Es lo que hace verdadera «es medición, no
producción» en la forma del código: **el oyente es estructuralmente incapaz de
escuchar la temporada entera**, y escuchar una jornada es un diff con motivo
más las precondiciones que ADR-028 §4 y §6 ponen delante.

**Y con partidos en ventana, escucha solo mientras los haya.** Si dentro de la
invocación la última ventana de partido se cierra, el oyente para antes de sus
11 minutos. El silencio programado no es cobertura perdida (ADR-019 §2).

### §3. Once minutos por invocación, un minuto de solape, trozos de 20–30 s, y lo durable recuerda

**Los números, elegidos y no medidos** —como `PRE`, `POST` (ADR-019 §2),
`CONFLICT_GRACE` (ADR-021 §8.2) y las 6 h de ADR-014 §3.2— viven como
constantes nombradas en **un solo sitio**, `src/radio/schedule.ts`, y
cambiarlos es un diff de una línea. **El spike (SPEC-019) los revisa antes de
la primera spec de código**: si mide otra cosa, cambian ahí.

- **`CRON_EVERY_MIN` = 10.** La expresión de `vercel.json` se compara contra
  ella en un test, como CA-8 hizo con `* * * * *`.
- **`LISTEN_MS` = 11 min (660 s).** Con un cron que puede llegar hasta 60 s
  tarde, la invocación *k* empieza en `10k + d_k` y escucha hasta
  `10k + d_k + 660`; la *k+1* empieza en `10k + 600 + d_{k+1}`. Hay hueco solo
  si `d_{k+1} − d_k > 60 s`, y con `d ∈ [0, 60]` **eso no ocurre**: el solape
  está entre **0 y 60 s**, nunca negativo. Lo que sí come margen es el
  **arranque** —instancia nueva, consulta de partidos, primera lista de
  reproducción—: el spike mide cuánto (SPEC-019 CA-1) y si hace falta
  `LISTEN_MS` sube; 800 s dejan **140 s** de margen sobre los 660.
- **`CHUNK_MS` entre 20 y 30 s.** Es el primer sumando de la latencia: un gol
  cantado al principio de un trozo espera el trozo entero antes de salir hacia
  el ASR. La épica exige **< 60 s hasta la `Observation`**; con 30 s de trozo
  quedan 30 s para ASR, LLM y escritura; con 20 s, 40. **El spike mide la
  latencia del ASR con los dos** (SPEC-019 CA-4) y el número se fija con esa
  cifra delante. Los trozos siguen las fronteras de los segmentos HLS que el
  CDN sirve —no se recorta audio—, así que «20–30 s» es «los segmentos que
  suman entre 20 y 30 s».
- **El solape produce trozos repetidos, y cuestan cero dos veces.** El mismo
  segmento tiene la misma clave en el raw store (digest del cuerpo, ADR-009
  §Contexto), así que **no se archiva dos veces**. Y **no se transcribe dos
  veces**: antes de mandar un trozo al ASR, el oyente consulta `radio_chunks`
  (ADR-028 §5) por la clave del audio; si otra invocación ya lo transcribió,
  lo salta. Es el principio de ADR-019 §4 —**lo durable recuerda**— aplicado a
  la única memoria que dos invocaciones solapadas comparten. Si aun así un
  trozo se transcribe dos veces —carrera entre las dos invocaciones—, lo peor
  que produce es una segunda `Observation` con el **mismo marcador**, y el
  motor **no emite nada nuevo** (ADR-021 §2: emite solo cuando cambia la
  tupla).

**Dentro de la invocación, el oyente hace dos cosas a la vez:** sigue pidiendo
la lista y los segmentos a la cadencia del stream (ADR-028 §9) y va cerrando
trozos que entran en la cadena de §4. Ninguna espera del ASR o del LLM detiene
la descarga; si se detuviera, el hueco sería nuestro y no del CDN.

### §4. La frontera: `src/radio/` no publica; un ciclo hermano de `cycle.ts` lo llama y pasa el motor tras cada trozo

**`src/radio/` hereda la frontera de SPEC-008 CA-12 tal cual**: no importa
`DecisionStore`, no construye `Decision`, no menciona
`DECISION_CAPABILITY_NAMES`. No está en `DECISION_WRITERS`
(`tests/decide/support/rn08.ts`) y no tiene por qué estarlo: **el guardián de
RN-08 ya alcanza todo `src/`**, así que el módulo nuevo entra vigilado sin
ensanchar ninguna lista. Termina en **`Observation` persistida** por
`ObservationStore.append` (idempotente, SPEC-010), y ahí se acaba.

**Quien llama al oyente es `src/decide/`**, con un ciclo hermano de `cycle.ts`
—`src/decide/radio-cycle.ts`— que: (1) calcula los partidos en ventana (§2),
(2) abre el oyente con esos candidatos y (3) **tras cada trozo que produce
`Observation`, pasa el motor por esos partidos** con `applyEngine`, **en la
misma invocación y sin esperar al tick siguiente**. La dirección es la que
RN-08 quiere y la que ADR-021 §4 fijó: **el motor llama a la fuente, nunca al
revés**. Y el motivo es el mismo que allí, latencia: esperar al minuto del cron
de ingesta regalaría hasta 60 s de un presupuesto de **120 s hasta la
`Decision`** (ADR-021) que el trozo y el ASR ya gastan a medias.

**Esto es el segundo caso del primer disparador de ADR-021 §3** —«llega una
`Observation`»— fuera del tick, y ya hay precedente: el bot (ADR-022 §9) llama
al motor en el acto por la puerta estrecha de `engine-entry.ts`, y ADR-022 §9
dejó escrito que ADR-021 §4 «fija cuándo corre dentro del tick, que es lo que
el tick necesitaba saber, **no una exclusividad**». El ciclo de radio vive
**dentro de `src/decide/`**, así que no necesita la puerta estrecha: compone
sus puertos como `cycle.ts` y **no ensancha `DECISION_WRITERS`**.

**Lo que el motor ve cuando la radio escribe una `Observation`:** una
observación de fuente `radio_galega`, rol `broadcaster`, derivada de máquina
(ADR-028 §2). El ciclo no sabe nada de eso y no tiene que saberlo: el reducer
decide, como siempre, y las seis lecturas de ADR-028 §2 son suyas.

**Y un fallo en un partido no detiene el trozo siguiente**, como en `cycle.ts`
(SPEC-013 CA-12.5): las observaciones ya persistidas se quedan, y el tick de
ingesta —que sigue corriendo cada minuto por su cuenta— las lee en su siguiente
pasada.

### §5. El segundo cron enmienda SPEC-012 CA-8 — y no supersede a ADR-021

`vercel.json` pasa a declarar **dos** crones. **SPEC-012 CA-8** dice «declara
**un** cron, con `schedule` exactamente `* * * * *`», y su test
(`tests/ingest/vercel-cron.test.ts`, caso 1) afirma `toHaveLength(1)`. **Ese
CA deja de poder ser cierto**, y el camino es el de **ADR-015**: el cuerpo de
SPEC-012 no se edita; la spec que añada el cron escribe en el ledger de
SPEC-012, bajo `## Enmienda — <fecha>: ADR-029 añade el cron de la radio`, los
cinco puntos de ADR-015 §3, y **edita el test** para que afirme el conjunto
declarado —cada cron contra su constante, `CRON_INGEST_PATH` y
`CRON_RADIO_PATH`, sin un tercero— con la referencia cruzada de ADR-011 §6. El
propio ledger de SPEC-012 ya lo dejó previsto en su enmienda del 2026-09-02:
«ese día `vercel.json` declararía dos crones y CA-8 dejaría de ser cierto de
verdad, lo que exigiría su propia enmienda». **Ese día es este.** ADR-015 §5
obliga a quien invalida a nombrar el CA, y aquí está nombrado.

**ADR-021 §4 no se supersede, y hay que argumentarlo porque se lee cerca.**
ADR-021 §4 da tres razones para que el motor corra dentro del tick; la segunda
es «`vercel.json` sigue declarando un solo cron … y RN-11 sigue con un solo
emisor de peticiones», y su §Alternativas rechaza «un segundo cron **para el
motor**». Las dos frases son **consecuencias y una alternativa de aquella
decisión**, no la decisión: lo decidido fue **dónde corre el motor** —dentro
del tick, después de la ingesta— y **eso sigue intacto**: el tick de cada
minuto sigue ingiriendo y decidiendo en la misma invocación. El cron de la
radio **no es un cron para el motor**: es un cron para **una fuente**, y el
motor corre dentro de él por el mismo motivo por el que corre dentro del tick.
Lo que sí cambia es un hecho que ADR-021 usó como apoyo —un solo cron, un solo
emisor— y que **ADR-021 no decidió**: lo decidió SPEC-012 CA-8, y por eso lo
que se enmienda es ese CA.

### §6. «Sin proceso vivo» sigue siendo verdad: este ADR aplica ADR-019, no lo supersede

ADR-019 se titula «el tick de ingesta **sin proceso vivo**», y su Contexto lo
define: «cada tick es **una instancia nueva**. Todo estado que viva en un campo
de instancia nace vacío en cada arranque en frío». Lo que ADR-019 protege
—con F-SPEC-008-V13 medido detrás— es un **invariante**, no una duración:
**nada de lo que una invocación necesita saber de la anterior vive en
memoria**; lo que tiene que sobrevivir, sobrevive en Postgres o en el archivo.

**Una función de 660 s cumple ese invariante letra a letra.** La posición en la
lista de reproducción, el búfer de segmentos, el trozo a medio cerrar y el
solape **mueren con la invocación**, y la siguiente **no los hereda**: vuelve a
calcular los partidos en ventana, vuelve a pedir la lista de reproducción desde
el directo, y lo único que consulta de la anterior está en `radio_chunks` y en
el raw store (§3). No hay scheduler en proceso, no hay `LISTEN/NOTIFY`, no hay
estado de instancia del que dependa la corrección. **ADR-004 ya contaba con
los 800 s**: los listó como límite disponible de la plataforma el mismo día
que decidió «sin scheduler en proceso», así que las dos cosas nunca fueron
incompatibles.

**Decisión: ADR-019 no se supersede, ni parcialmente.** Lo que este ADR añade
es **un número que ADR-019 no necesitaba escribir**: la invocación más larga
del despliegue pasa de ≤ 60 s a **≤ 800 s**, y **«sin proceso vivo» se lee «sin
proceso de más de una invocación»**, que en Vercel Pro son 800 s. Es una
aclaración fechada, no un cambio de decisión, y va aquí y no en ADR-019, que es
inmutable. **Lo que sí supersedería** a ADR-004 y a ADR-010 —y por tanto
también dejaría atrás a ADR-019— es un proceso **más largo que la plataforma**:
un worker aparte. Ése es exactamente el disparador de §9.

**Dos consecuencias operativas de vivir 11 minutos, dichas para que nadie las
descubra:** el `robots.txt` del host se relee del archivo al arrancar y vale 6 h
(ADR-019 §4) —dentro de la invocación no se vuelve a pedir—; y `productionSql`
(el pool que `cycle.ts` conserva por instancia) sirve a dos invocaciones
solapadas **de la misma instancia** si Fluid las coloca juntas, o a una cada
una si no: en ninguno de los dos casos importa, porque nada de lo que se
escribe depende de qué instancia lo escribe.

### §7. El riesgo abierto: HLS/AAC dentro de una función, y el orden en que el spike lo resuelve

**No se sabe si un segmento HLS se puede mandar tal cual a un ASR o si hay que
decodificarlo, y esto lo decide el spike, no este ADR** (SPEC-019 CA-2). Lo que
este ADR sí fija es **el orden de preferencia**, porque cada escalón cuesta
algo distinto:

1. **Mandar el segmento comprimido tal cual** (el contenedor que sirva el CDN:
   MPEG-TS con AAC, ADTS, fMP4). Cero dependencias, cero CPU. Es la primera
   opción si algún motor lo acepta.
2. **Remultiplexar sin decodificar, en JavaScript puro** (extraer el AAC del
   MPEG-TS, sin binario nativo). Una dependencia pequeña o un módulo propio;
   sigue sin CPU relevante.
3. **`ffmpeg` como binario estático dentro de la función.** Es el último
   recurso: son decenas de MB en el paquete de la función, CPU activa que se
   factura, y **una entrada nueva en `ALLOWED_PACKAGES`** (SPEC-009) con su
   motivo. Solo si 1 y 2 fallan con los dos motores.

Si **ninguno de los tres** cabe en la función —por tamaño, por CPU o por
tiempo—, es el disparador de §9.

### §8. Coste, y quién lo mide

**El coste de la función es el menor de los dos**, y el spike lo mide
(SPEC-019 CA-5): seis invocaciones por hora de ventana, 11 min cada una,
casi todo esperando I/O; lo que se factura es memoria provisionada por
minuto y la poca CPU activa del troceado. **El coste que manda es el del
ASR**, por minuto escuchado y no por gol (`_epica.md`, 3–17 $ por jornada según
motor, consultado el 2026-09-12), y ése es de ADR-028 §7 y del spike. D-7 mira
las dos cifras juntas.

### §9. Lo que reabre esta decisión

**Si el spike demuestra que la función no sostiene el stream, esta decisión
vuelve a la mesa con un ADR nuevo que supersede parcialmente a ADR-004 y a
ADR-010**, no con una excepción silenciosa. «No sostiene» es, con número:

- **huecos** de audio dentro de una invocación mayores que un segmento, de
  forma repetida (SPEC-019 CA-1), o un arranque que coma más de los 140 s de
  margen de §3;
- **ningún** contenedor aceptado por los motores y ningún remultiplexado que
  quepa en la función (§7);
- una **latencia de ASR desde la región de Vercel** que, sumada al trozo más
  corto, no baje de los 60 s de la épica (SPEC-019 CA-4);
- o que Vercel **baje** el `maxDuration` de Pro por debajo de `LISTEN_MS` más
  el margen.

Y hay un segundo disparador que no es técnico: si el análisis de encargado y
transferencia de todos los proveedores de ASR fracasa (ADR-023 §3 ter), la
alternativa 3 —ASR autoalojado— deja de ser la cara y pasa a ser la única, y
con ella el worker.

### §10. Lo que este ADR no decide

- **Qué es la fuente, qué puede y qué archiva**: ADR-028.
- **Qué proveedor de ASR** y en qué contenedor: SPEC-019.
- **Los números finales** de trozo y escucha: propuestos aquí, revisados con
  el spike, fijados en la segunda spec.
- **La retención** del archivo: ADR-028 §6.
- **Nada del extractor ni del motor**: ADR-028 §2 y §8, y la tercera spec.

## Consecuencias

### Positivas

- **Todo sigue en un despliegue** (ADR-010) y **con cero operación** (ADR-004):
  no hay máquina que encender, ni segundo secreto que rotar, ni segundo
  pipeline que vigilar. Apagar la radio es no declarar jornada.
- **La latencia se queda dentro del presupuesto por diseño**: el motor corre
  tras cada trozo, no en el minuto siguiente. Lo que quede por encima de 60 s
  será del trozo y del ASR, y el spike lo mide antes de escribir código.
- **El invariante de ADR-019 no se toca**: la corrección no depende de la
  memoria, y dos invocaciones solapadas se coordinan por lo durable.
- **La frontera de RN-08 no se ensancha**: `src/radio/` entra bajo un guardián
  que ya existe, y el ciclo vive donde vive la capacidad.
- **Nace inerte, como todo lo demás**: la lista vacía es la llave.

### Negativas / follow-ups

- **Es la primera pieza del proyecto que vive más de un minuto**, y sin CI
  (`CLAUDE.md`: solo `npm run gates` en local). Un hueco de escucha no pone
  nada rojo: lo dirá `radio_chunks` y la cifra de cobertura. **Follow-up:** la
  segunda spec añade a `radio_chunks` los huecos detectados por invocación,
  para que la cobertura perdida por la plataforma se distinga de la perdida
  por la fuente.
- **Enmienda SPEC-012 CA-8** y edita su test por ADR-011 §6 (§5). Está
  nombrado.
- **El solape de un minuto es escucha doble**: un 10 % de las peticiones al
  CDN y, sin `radio_chunks`, un 10 % del coste de ASR. Con `radio_chunks`, la
  descarga doble se queda y la transcripción doble no.
- **Dos crones, dos secretos iguales.** `CRON_SECRET` sirve a los dos; si se
  rota, se rota para los dos. Es lo que hay y es correcto: son el mismo
  despliegue.
- **800 s es el techo de la plataforma, no del diseño.** Si algún día el
  programa que interesa dura más que una ventana de partido, no cambia nada;
  si Vercel cambia el techo, cambia `LISTEN_MS` o cambia el ADR (§9).
- **El orden de preferencia de §7 puede acabar en `ffmpeg`**, que es el
  escalón que más cuesta —tamaño, CPU y una entrada en `ALLOWED_PACKAGES`—.
  Se acepta porque es el último, y porque el spike decide con datos.

## Alternativas consideradas

- **Worker aparte «tonto», que solo transcribe al raw store** (opción 2).
  Rechazada por Alberto Fojo el 2026-09-12, y con motivos que este ADR hace
  suyos: **rompe «cero operación»** (ADR-004) —una máquina siempre encendida
  con su sistema, sus copias y su vigilancia— y **el despliegue único**
  (ADR-010) —un segundo artefacto con su propio secreto y su propio pipeline—;
  y además **añade hasta 60 s** al camino, porque el tick del minuto siguiente
  es quien leería la transcripción, contra un presupuesto de 120 s que ya
  gasta el trozo y el ASR. Es la alternativa fuerte si §9 se dispara: una
  máquina que escribe en el raw store con las mismas claves que §3 no cambia
  nada de lo de aguas abajo.
- **Worker aparte completo, con ASR autoalojado de Proxecto Nós** (opción 3).
  Rechazada por Alberto Fojo el 2026-09-12: exige una máquina con capacidad de
  inferencia que Vercel no da, y con ella todo lo anterior. **Tiene una
  ventaja que ADR-023 §3 ter ya escribió y que aquí pesa más que allí**: sin
  proveedor no hay encargado, ni transferencia, ni DPA, ni retención ajena de
  audio con voces. Por eso queda **escrita con disparador** (§9): si los
  proveedores no pasan el análisis legal, o si el coste por jornada lo
  justifica con la cifra del spike delante, es la vía.
- **Función de 1800 s (beta).** Rechazada: construir sobre un límite en beta
  es construir sobre algo que puede desaparecer, y 800 s bastan para 11 min
  con margen.
- **Cron cada minuto con una función de dos minutos.** Rechazada: sesenta
  arranques en frío por hora, cada uno abriendo el stream y resincronizando la
  lista de reproducción, sesenta veces más peticiones de arranque al CDN, y un
  solape del 100 %. Diez minutos es el punto en que el arranque deja de ser el
  coste dominante y el solape sigue siendo pequeño.
- **Que `src/radio/` llame al motor por la puerta estrecha** de
  `engine-entry.ts`, como el bot. Rechazada: la puerta estrecha existe para
  llamantes **fuera** de `src/decide/`; poner el ciclo dentro —hermano de
  `cycle.ts`— es más simple y mantiene la dirección de ADR-021 §4 sin abrir
  otra puerta.
- **Que el tick de ingesta de cada minuto lea las transcripciones y decida**,
  en vez de correr el motor dentro de la invocación de radio. Rechazada por lo
  mismo que ADR-021 §4 y ADR-022 §9: hasta 60 s regalados sobre la primera
  cifra que la épica mide.
- **Un ASR en streaming por websocket desde la función**, que transcriba sin
  trocear. No rechazada: **no evaluada**, como ADR-004 hizo con Cloudflare. Un
  websocket desde una función sigue siendo una función larga, así que encaja
  en esta decisión; lo que cambiaría es el troceado. Queda nombrada para el
  spike, que puede anotarlo si lo ve.
- **Vercel Queues o Workflows** para partir la escucha en pasos. No evaluados;
  no se afirma nada de ellos. Si el spike encuentra que la función no sostiene
  la escucha continua, son lo primero que mirar **antes** del worker, porque
  siguen dentro de ADR-004 y ADR-010.

<!-- REGLA: un ADR aceptado es INMUTABLE. Para cambiar la decisión, escribe otro ADR que lo supersede (estado del viejo -> bloqueada + nota "superseded por ADR-NNN"). -->
