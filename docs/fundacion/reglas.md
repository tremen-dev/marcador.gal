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

- **RN-02 — Publicación confirmada.** Se publica como *confirmado* si la
  observación tiene peso ≥ 0.9, **o** si dos fuentes **independientes** con peso
  ≥ 0.7 coinciden. Dos agregadores que beben de la misma fuente no cuentan como
  independientes (ver ADR-002).

- **RN-03 — Publicación provisional.** Si solo hay una fuente con peso < 0.9 se
  publica igualmente, marcado *provisional*, y la interfaz lo distingue.
  Mejor provisional a tiempo que confirmado tarde.

- **RN-04 — Monotonía.** Un marcador **no baja** salvo que lo diga la fuente
  oficial o un humano. Un salto de más de 2 goles en una sola observación se
  retiene hasta segunda fuente.

- **RN-05 — Conflicto.** Si dos fuentes con peso ≥ 0.7 discrepan y ninguna es
  oficial: se mantiene la última confirmada y se genera alerta al panel.
  **El conflicto no se publica.** Una discrepancia en la que interviene el
  operador humano **no es un conflicto**: se resuelve por precedencia (RN-01) y
  se publica.

- **RN-06 — Transiciones de estado.**
  `scheduled → live` con la primera observación de juego después de kickoff − 2 min.
  `live → finished` con fuente oficial, dos fuentes coincidentes, o kickoff + 110 min
  sin señal (en ese caso se marca *pendente de confirmar*).
  `postponed` / `suspended` **solo** por fuente oficial o humano.

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

- **RN-13 — Las Observations son inmutables.** No se borran ni se editan. Una
  corrección es una Observation nueva, no una enmienda de la anterior.
