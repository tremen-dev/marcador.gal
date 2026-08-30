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

- **RN-05 — Conflicto.** Si dos fuentes con peso ≥ 0.7 discrepan y ninguna es
  oficial: se mantiene la última confirmada y se genera alerta al panel.
  **El conflicto no se publica.** Una discrepancia en la que interviene el
  operador humano **no es un conflicto**: se resuelve por precedencia (RN-01) y
  se publica.

- **RN-06 — Transiciones de estado.**
  `scheduled → live` con la primera observación de juego después de kickoff − 2 min.
  `live → finished` con fuente oficial, dos fuentes coincidentes, o kickoff + 110 min
  sin señal (en ese caso se marca *pendente de confirmar*).
  `postponed` / `suspended` **solo** por fuente oficial o humano —operador **o**
  corresponsal: ver «Humano» en RN-01—.

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
