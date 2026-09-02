# Reglas de negocio — marcador.gal

> Numeradas y estables: las specs y ADRs las citan como RN-xx. No se borran;
> se marcan derogadas con fecha y motivo.
>
> RN-01 a RN-07 son el **motor de decisiones**, extraídas de la §5 de la
> propuesta de spike (`spike-ingesta-propuesta.md`). RN-08 a RN-13 son
> **invariantes del proyecto**, extraídas de las reglas duras de `CLAUDE.md`.
>
> **El corte importa:** solo una regla del motor puede producir una `Decision`,
> y por eso `rule` está restringida a RN-01..RN-07 (SPEC-001 CA-19). Un
> invariante no decide nada; citarlo en `rule` sería trazabilidad falsa.
> Los umbrales de RN-01 a RN-07 son hipótesis que el spike (EPIC-001) debe
> validar: pueden cambiar con evidencia, y ese cambio se registra aquí con fecha.

## Motor de decisiones

Un reducer por partido: recibe una `Observation` nueva, lee la `Decision` vigente
y emite (o no) una `Decision` nueva. Las reglas se aplican **en orden**.

Ese orden es el de **evaluación**. Cuál de las reglas concurrentes se **registra**
en `rule` es otra cosa, y vive en **RN-12**: se registra la *decisiva*, con su
propio orden de desempate.

- **RN-01 — Pesos de confianza.** Cada fuente tiene un peso fijo:
  **operador humano 1.0** · RFGF 1.0 · API de pago 0.9 · corresponsal confirmado 0.8 ·
  BeSoccer / ceroacero / resultados-futbol.com 0.7 · tuit de club 0.5.

  **Precedencia del operador.** El operador humano y la RFGF comparten peso 1.0,
  pero no son intercambiables: **si discrepan, gana el operador**, y la Decision
  registra que se resolvió por precedencia humana. Sin esta cláusula el empate lo
  ganaría la fuente oficial y el operador no podría corregir a futgal — lo que
  contradiría RN-04 y RN-06, que ya nombran a «la fuente oficial **o un humano**»
  como pares.

  **Operador ≠ corresponsal.** El corresponsal *envía* una observación desde el
  campo (0.8, y solo tras confirmación). El operador *arbitra* desde el panel, con
  el contexto de todas las fuentes y del histórico delante. Por eso una Decision
  nacida del panel se publica **confirmada, nunca provisional** (RN-02).

  <!-- Decidido por Alberto Fojo el 2026-08-29, resolviendo F-SPEC-001-13. El hueco
       lo detectó sdd-arquitecto al enmendar SPEC-001: sin peso del operador,
       RN-02 y RN-03 no podían derivar si una corrección del panel sale
       confirmada, y RN-04 y RN-06 ya le daban poder de bajar marcadores y
       aplazar partidos. -->

  **«Humano», en RN-04 y RN-06, son los dos.** Donde esas dos reglas dicen
  «fuente oficial **o** humano» caben **tanto el operador como el corresponsal**.
  *Operador* es el término específico que esta regla introduce para el peso 1.0 y
  la precedencia; **no estrecha «humano» en RN-04 ni en RN-06**, que son
  anteriores y siguen diciendo lo que dicen. Consecuencia concreta y querida: un
  corresponsal solo, con peso 0.8, **puede aplazar un partido**, y esa `Decision`
  `postponed` se publica *provisional* (RN-03) porque 0.8 < 0.9. Lo que distingue
  al operador no es el permiso —los dos son humanos y los dos pueden— sino el
  **peso**, y por tanto si lo que publican sale confirmado o provisional.

  <!-- Decidido por Alberto Fojo en el gate del 2026-08-31. Pregunta abierta que
       encontró sdd-arquitecto al cerrar F-SPEC-001-14: RN-06 dice «fuente oficial
       o humano» y es anterior a que esta regla introdujera *operador*, así que
       podía leerse de dos maneras. No es un umbral nuevo: fija cuál de las dos
       lecturas vale, y la spec del motor la necesita. -->

  **El peso que se evalúa es el congelado en la `Observation`, no el de esta
  tabla hoy.** Cuando RN-02 y RN-03 dicen «peso ≥ 0.9» o «peso < 0.9», el número
  que se compara es el `confidence` que la `Observation` lleva escrito, que es el
  que esta tabla tenía **en el instante en que se observó**. Las `Observation`
  son inmutables (RN-13) y su `confidence` es un hecho histórico como el
  marcador: si mañana esta tabla cambia un peso, **las decisiones ya tomadas no
  cambian de cualificador retroactivamente** y las que se tomen sobre
  observaciones viejas siguen usando el peso con el que se observaron. Lo que
  esta tabla aporta a partir de ahí es **identidad y no número**: quién es el
  operador, quién la fuente oficial y quién es humano — que es lo que necesitan
  la precedencia de esta misma regla y el «humano» de RN-04 y RN-06.

  <!-- Decidido por Alberto Fojo en el gate del 2026-09-02, firmando ADR-021 §8.4
       (SPEC-013, el motor de decisiones). El hueco lo encontró sdd-arquitecto al
       escribir el reducer: RN-02 y RN-03 dicen «peso» sin decir de dónde se lee,
       y hay dos fuentes posibles —el `confidence` de la Observation o esta tabla
       en tiempo de ejecución— que solo coinciden mientras la tabla no cambie.
       No es un umbral nuevo ni toca ningún número de esta tabla: fija cuál de
       las dos lecturas vale, y sin ella el mismo log de observaciones producía
       un log de decisiones distinto según cuándo se replayara, lo que rompe la
       trazabilidad de D-6. -->

- **RN-02 — Publicación confirmada.** Se publica como *confirmado* si la
  observación tiene peso ≥ 0.9, **o** si dos fuentes **independientes** con peso
  ≥ 0.7 coinciden. Dos agregadores que beben de la misma fuente no cuentan como
  independientes (ver ADR-002).

  Esta condición es la que define *confirmado* en las **cinco** ramas de estado,
  con marcador o sin él; su negación es RN-03, que fija el alcance de las dos.

- **RN-03 — Publicación provisional.** Si solo hay una fuente con peso < 0.9 se
  publica igualmente, marcado *provisional*, y la interfaz lo distingue.
  Mejor provisional a tiempo que confirmado tarde.

  **Alcance: la `Decision` entera, no solo el marcador.** *Provisional* califica
  el **dato publicado**: en las ramas con marcador (`live`, `finished`,
  `suspended`) es el marcador; en las que no lo tienen (`scheduled`,
  `postponed`) es el **estado**. RN-02 y RN-03 están escritas sobre el peso y la
  independencia de las observaciones que sostienen la `Decision`, no sobre la
  presencia de un marcador, así que se aplican igual en las cinco ramas. De ahí
  que **toda `Decision` publicada sea o confirmada o provisional**: sin tercera
  opción y sin ramas exentas, `provisional` es cierto exactamente cuando no se
  cumple la condición de RN-02.

  Prohibir *provisional* en una `Decision` sin marcador contradiría estas reglas
  en vez de completarlas: una `Decision` `scheduled` sostenida solo por un
  agregador de peso 0.7 —un partido que aparece en el calendario de una fuente
  antes que en futgal— es provisional por definición, y `scheduled` es estado
  inicial, que RN-06 no restringe. Cómo lo distingue la interfaz cuando no hay
  marcador que poner en gris es cuestión de la interfaz, no de esta regla.

  <!-- Derivado por sdd-arquitecto el 2026-08-31 al cerrar F-SPEC-001-14 (ledger
       de SPEC-001). No es una decisión nueva ni un umbral nuevo: hace explícito
       lo que ya se seguía de RN-02 y RN-03, que hablan del peso de las
       observaciones y nunca del marcador. El hueco bloqueaba la spec del motor:
       sin esto, `provisional` quedaba como booleano libre en las dos ramas sin
       marcador y su valor dependía de quién escribiera cada rama.
       Ratificado por Alberto Fojo en el gate del 2026-08-31. -->

- **RN-04 — Monotonía.** Un marcador **no baja** salvo que lo diga la fuente
  oficial o un humano —operador **o** corresponsal: ver «Humano» en RN-01—. Un
  salto de más de 2 goles en una sola observación se retiene hasta segunda
  fuente.

  **La retención del salto no alcanza al peso ≥ 0.9.** La segunda frase de esta
  regla —el salto de más de 2 goles que espera a una segunda fuente— se aplica a
  observaciones de peso **< 0.9**. Una de peso ≥ 0.9 —operador, RFGF, API de
  pago— publica el salto de inmediato. **Solo alcanza a esa segunda frase:** la
  monotonía de la primera sigue diciendo lo que dice, y una API de pago (0.9),
  que no es ni oficial ni humana, sigue sin poder **bajar** un marcador.

  Sin esta lectura, RN-04 contradiría a RN-02, que declara el peso ≥ 0.9
  suficiente para publicar *confirmado*: retener lo que otra regla declara
  suficiente es dejar que una regla anule a la otra. Y lo que evita es concreto y
  hoy es el caso normal: **un 0-4 del operador quedaría retenido para siempre**,
  porque la segunda fuente que lo liberaría no existe — con `futgal.es` no
  capturable (ADR-008 §1) solo hay una fuente automática, así que un marcador
  corregido a mano desde el panel no tendría nunca quien lo acompañase y el
  operador se quedaría sin la función que RN-01 le atribuye, arbitrar.

  <!-- Decidido por Alberto Fojo en el gate del 2026-09-02, firmando ADR-021 §8.1
       (SPEC-013, el motor de decisiones). El hueco lo encontró sdd-arquitecto al
       escribir el reducer: la segunda frase de RN-04 no dice a qué pesos alcanza
       y es anterior a que RN-01 tuviera peso de operador, así que podía leerse de
       dos maneras. No es un umbral nuevo —no mueve ni el 0.9 de RN-02 ni los 2
       goles de esta regla—: fija cuál de las dos lecturas vale. La lectura
       contraria solo era inofensiva mientras hubiera una fuente oficial
       capturable que pudiera hacer de segunda; ADR-008 §1 la dejó sin serlo. -->

- **RN-05 — Conflicto.** Si dos fuentes con peso ≥ 0.7 discrepan y ninguna es
  oficial: se mantiene la última confirmada y se genera alerta al panel.
  **El conflicto no se publica.** Una discrepancia en la que interviene el
  operador humano **no es un conflicto**: se resuelve por precedencia (RN-01) y
  se publica.

  **«Se mantiene la última confirmada» se lee «se mantiene la vigente».** Lo que
  esta regla protege es que el conflicto **no se publique**, no que se borre lo
  que ya estaba publicado: ante un conflicto la `Decision` vigente sigue vigente
  y no se emite ninguna nueva. La lectura literal —retroceder hasta la última
  `Decision` *confirmada*— obligaría hoy a **despublicar el partido entero al
  primer desacuerdo**, porque con una sola fuente automática de peso 0.7 no hay
  **ninguna** `Decision` confirmada por vía automática a la que volver (ADR-008
  §1); y despublicar contradiría a RN-03, que dice justo lo contrario —mejor
  provisional a tiempo que confirmado tarde—.

  **Y una discrepancia solo es conflicto cuando persiste.** Dos fuentes que van a
  distinta velocidad discrepan unos segundos en cada gol, y eso no es desacuerdo:
  es latencia. Una discrepancia es conflicto cuando **sigue en pie pasado un
  plazo de gracia contado desde la más reciente de las dos observaciones que
  discrepan** — si la rezagada tuvo tiempo de ponerse al día y no lo hizo,
  discrepan de verdad. El plazo es una constante del motor
  (`src/decide/thresholds.ts`), **elegida y no medida** como `PRE`, `POST` y las
  6 h de ADR-014 §3.2, y revisable con la primera jornada delante: no es un
  umbral de esta regla y por eso no vive aquí. Sin él, la tercera cifra de
  EPIC-002 —«% de partidos con desacuerdo entre fuentes»— sería un contador de
  goles.

  <!-- Decidido por Alberto Fojo en el gate del 2026-09-02, firmando ADR-021 §8.2
       (SPEC-013, el motor de decisiones). Dos huecos que encontró sdd-arquitecto
       al escribir el reducer, y ninguno es un umbral nuevo: el primero fija cuál
       de dos lecturas de «la última confirmada» vale, y el segundo dice cuándo
       una discrepancia cuenta —el número concreto de la gracia vive en el código,
       no en esta regla, precisamente para que moverlo sea un diff y no una firma—.
       El primero solo era inofensivo mientras se esperase que alguna fuente
       automática llegara a *confirmado*; ADR-008 §1 lo impidió. -->

- **RN-06 — Transiciones de estado.**
  `scheduled → live` con la primera observación de juego después de kickoff − 2 min.
  `live → finished` con fuente oficial, dos fuentes coincidentes, o kickoff + 110 min
  sin señal (en ese caso se marca *pendente de confirmar*).
  `postponed` / `suspended` **solo** por fuente oficial o humano —operador **o**
  corresponsal: ver «Humano» en RN-01—.

  **Para una fuente automática, esta lista es una tabla cerrada.** Lo que esta
  regla enumera es todo lo que una fuente automática puede provocar; lo que no
  enumera —`finished → live`, `live → scheduled`, `postponed → live`— **no lo
  hace una fuente automática**: la transición se ignora. La `Observation` se
  guarda igual, porque es un hecho histórico y no se borra (RN-13), y si concurre
  con otra fuente cae donde le corresponde, en RN-05. Una fuente que retrocede
  sola es casi siempre un parseo roto o una página a medio cargar, y publicar eso
  es exactamente lo que RN-04 evita para el marcador.

  **La fuente oficial y el humano —operador o corresponsal— pueden llevar el
  partido a cualquiera de los cinco estados.** Esta regla les concede en
  exclusiva `postponed` y `suspended`, y RN-04 les concede bajar un marcador:
  son concesiones, no un techo. Negarles la corrección de un estado equivocado
  —un `finished` que la fuente cerró antes de tiempo— dejaría al operador sin la
  función que RN-01 le atribuye, arbitrar, y con la fuente oficial no capturable
  (ADR-008 §1) no habría nadie más que pudiera deshacerlo.

  <!-- Decidido por Alberto Fojo en el gate del 2026-09-02, firmando ADR-021 §8.3
       (SPEC-013, el motor de decisiones). El hueco lo encontró sdd-arquitecto al
       escribir el reducer: esta regla enumera entradas a cuatro estados y no dice
       qué pasa con lo que no enumera, así que podía leerse como lista cerrada o
       como lista de ejemplos. No es un umbral nuevo —no mueve los 2 min ni los
       110 min— y no añade ningún estado: fija cuál de las dos lecturas vale, y
       para quién. -->



- **RN-07 — Silencio.** Partido `live` sin observación nueva en 15 min → estado
  *sen sinal* visible al usuario y alerta al panel.

## Invariantes del proyecto

- **RN-08 — El motor es la única puerta.** Ninguna fuente publica un marcador sin
  pasar por el motor de decisiones. No hay atajos, ni siquiera para la fuente
  oficial ni para el corresponsal.

- **RN-09 — Un LLM nunca es la única fuente de un marcador.** Sirve para proponer
  alias de equipos y para parsear mensajes de corresponsal, siempre con salida
  JSON validada y **confirmación humana**. Nunca se publica un resultado sobre un
  equipo sin alias confirmado por una persona.

- **RN-10 — Raw antes de parsear.** Toda respuesta cruda (HTML/JSON) se guarda con
  timestamp en el raw store **antes** de parsearse. Es lo que permite reprocesar
  con un parser corregido y reproducir una jornada entera en tests.

- **RN-11 — Scraping cortés.** Respetar robots.txt, identificar el user-agent y no
  bajar de 1 petición por minuto por competición. En el spike es medición, no
  producción.

- **RN-12 — Trazabilidad de cada Decision.** Cada `Decision` registra la regla
  aplicada (RN-xx) y las observaciones que la sostienen. Una Decision sin `rule`
  ni `supporting_observation_ids` no debe existir: sin eso el spike no produce
  datos, solo marcadores.

  **Qué regla se registra cuando concurren varias: la decisiva.** Las reglas del
  motor se satisfacen a la vez —una transición `scheduled → live` con una sola
  fuente de 0.8 cumple RN-06 *y* RN-03—, pero `rule` es **una** (`dominio.md`) y
  solo puede ser del motor, RN-01..RN-07 (SPEC-001 CA-19). Se registra la regla
  **decisiva**: aquella cuyo efecto **no es recuperable del resto de la fila**.
  Orden de desempate, de la más decisiva a la menos:

  1. **RN-01** — la `Decision` resuelve una discrepancia por precedencia del
     operador. Por qué ganó el operador un empate no está en ninguna otra columna.
  2. **RN-04** — la `Decision` baja un marcador, o libera un salto de más de 2
     goles que estaba retenido. Por qué se permitió bajar no está en ninguna otra
     columna.
  3. **RN-07** — silencio. No está en ninguna otra columna salvo como hueco entre
     `decided_at`, que es una inferencia, no un registro.
  4. **RN-06** — la `Decision` cambia el `status`. Recuperable comparando `status`
     con el de la `Decision` anterior, así que cede ante las tres de arriba.
  5. **RN-02 / RN-03** — la `Decision` solo mueve el marcador o su cualificador.
     Es el suelo: siempre se cumple una de las dos, y **cuál** ya está en la
     columna `provisional`. Nunca concurren entre sí (RN-03 es la negación de
     RN-02), así que este escalón no necesita desempate interno.

  **Salvedad de RN-05.** No aparece en el orden porque **normalmente no emite
  `Decision`**: ante conflicto se mantiene la última confirmada y se alerta al
  panel. Y su salvedad enmendada —una discrepancia en la que interviene el
  operador no es conflicto— enruta al escalón 1, que se registra como **RN-01**,
  no como RN-05. Si la spec del motor llega a definir una `Decision` para la
  retención, es ella quien tiene que decir dónde entra RN-05 en este orden.

  **Por qué la decisiva y no la primera en orden.** La cláusula «las reglas se
  aplican **en orden**» de la cabecera del motor gobierna la **evaluación** del
  reducer, no la **atribución**: leída como atribución, `rule` sería siempre
  RN-01 —que es una tabla de pesos, no una regla productora— o siempre
  RN-02/RN-03, es decir, un sinónimo de la columna `provisional`. Registrar la
  excepcional y no la rutinaria es lo único que hace que `rule` añada algo sobre
  las columnas que ya existen, y es lo que sostiene el vocabulario cerrado de
  CA-19: `rule` tiene que **explicar** la `Decision`, no etiquetarla.

  <!-- Decidido por Alberto Fojo en el gate del 2026-08-31, resolviendo
       F-SPEC-001-15. Propuesta de sdd-arquitecto entre tres políticas; se
       descartaron «gana el número más bajo aplicable» (convierte `rule` en un
       duplicado de `provisional`) y «`rule` pasa a lista» (obliga a tocar el
       modelo canónico y `migrations/0001`, ya en main, y a reabrir el contrato
       de SPEC-001, que está hecho y verde). Esta política NO toca el modelo:
       `rule` sigue siendo un solo valor de RN-01..RN-07. -->


- **RN-13 — Las Observations son inmutables.** No se borran ni se editan. Una
  corrección es una Observation nueva, no una enmienda de la anterior.
