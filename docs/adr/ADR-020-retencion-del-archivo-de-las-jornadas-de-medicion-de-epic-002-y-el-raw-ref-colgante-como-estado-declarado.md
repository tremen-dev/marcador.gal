---
id: ADR-020
tipo: adr
estado: aprobada
historial:
  - {estado: borrador, fecha: 2026-09-02, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-09-02, por: Alberto Fojo}
aprobada-por: Alberto Fojo
---
# ADR-020: Retención del archivo de las jornadas de medición de EPIC-002, y el `raw_ref` colgante como estado declarado

- Deciders: propone `sdd-arquitecto` el 2026-09-02, al escribir **SPEC-012**,
  porque **ADR-009 §6 es una precondición dura** («la ingesta continua no
  arranca sin su propia decisión de retención») y la spec del cron es la
  primera a la que se le puede exigir. **Aprueba: pendiente de gate humano.**
- Specs relacionadas: **SPEC-012** (la que despliega lo que este ADR acota);
  **SPEC-001** (`hecho`; **F-SPEC-001-1** se estrecha otra vez y sigue sin
  cerrarse); **SPEC-010** (`hecho`; las `Observation` persistidas son lo que
  hace nueva la pregunta del `raw_ref` colgante).
- Relacionado: **ADR-009** (retención del archivo de medición de EPIC-001;
  este ADR extiende su régimen, no lo toca), **ADR-005** (raw store como
  puerto, sin operación de borrado), **ADR-008 §5.2** (medición vs. sondeo),
  **ADR-019 §3** (las jornadas de medición declaradas, que son la unidad de
  este plazo), **RN-10**, **RN-13**.

## Contexto

ADR-009 fijó la retención **del archivo de las ventanas de medición de
EPIC-001** —30 días, una prórroga, techo 90, purga manual con ceremonia— y
dejó escrito, en su §6, lo que no fijaba y por qué: la retención de
**producción** exige plazo, **mecanismo automático** y la semántica del
`raw_ref` colgante, y fijarla entonces habría sido inventarla.

EPIC-002 se planta en medio de las dos cosas, y hay que decir en cuál de los
dos regímenes cae. Tres hechos:

1. **El cron de SPEC-012 archiva bytes reales de terceros en Vercel Blob** —ya
   no en el disco del operador— durante sus jornadas. Volumen estimado por
   jornada: la unión de ventanas de partido por competición son unas horas a
   1 req/min — del orden de **300–500 páginas de 100–300 KB, es decir
   50–150 MB por jornada**, más los `robots.txt`.
2. **Por primera vez hay `Observation` persistidas que apuntan al archivo.**
   En EPIC-001 no se creó ni una (`ADR-009 §Contexto`); desde SPEC-010 el
   `raw_ref` es una columna con `CHECK` en una tabla que RN-13 hace
   inmutable. Purgar el archivo produce `raw_ref` colgantes **de verdad**, y
   ADR-009 dejó dicho que quien escribiera la retención decidiría si eso es
   un estado declarado o un error.
3. **Esto no es ingesta continua, y no por opinión sino por estructura:**
   ADR-019 §3 hace al despliegue incapaz de capturar fuera de las jornadas de
   medición declaradas — una lista cerrada, hoy vacía, donde cada entrada es
   un diff con motivo. La unidad de trabajo sigue siendo una ventana que
   empieza y acaba, como en EPIC-001; lo que cambia es que dura una jornada y
   corre sin operador delante.

## Decisión

### §1. Alcance: el archivo que el cron escribe durante las jornadas de medición declaradas

Este ADR fija la retención de **todo lo que SPEC-012 archiva en el raw store**
—páginas de competición y `robots.txt`— durante las jornadas de medición
declaradas de EPIC-002 (ADR-019 §3). No toca el archivo de EPIC-001 (ADR-009
sigue mandando sobre él) y **no fija la retención de la ingesta continua de
producción**, que sigue teniendo las tres preguntas de ADR-009 §6 delante y
las sigue exigiendo **con mecanismo automático**. F-SPEC-001-1 **se estrecha
por segunda vez y no se cierra**.

**La frontera de validez es la lista de ADR-019 §3.** Este ADR vale mientras
la captura sea por jornadas declaradas y finitas. El día que la medición
quiera volverse sondeo sin fin, este ADR no se estira: se escribe el de
producción.

### §2. El plazo: el régimen B de ADR-009, anclado a cada jornada

Por cada jornada de medición declarada: **30 días desde el fin de su ventana
de medición** (el `to` del intervalo declarado), con **una** prórroga escrita
y motivada en el ledger de la spec que gobierna la medición **antes** de que
expire el plazo original, y **techo duro de 90 días**. Son las mismas
cláusulas de ADR-009 §2, opción B, con la jornada como unidad en vez de la
ventana de una hora; se citan, no se reinventan.

Lo que el plazo cubre es lo mismo que cubría en EPIC-001: recalibrar
extractores contra HTML real, reprocesar la jornada con un parser corregido
(el replay de SPEC-008 CA-10 más el `append` idempotente de SPEC-010), y la
verificación de las specs que consuman esa jornada — el motor y las cifras
incluidos, que es la razón de que 7 días no basten.

### §3. La ejecución: manual, con la ceremonia de ADR-009 §4, y en Blob

La purga la ejecuta **el operador**, con las dos cláusulas que ADR-009 §4
convirtió en política y que aquí se citan enteras:

1. **La fecha de purga se escribe antes de correr la jornada**, junto a la
   entrada de la lista de ADR-019 §3 y en el ledger de la spec que gobierna la
   medición. Una jornada cuya fecha de purga no esté escrita no se declara.
2. **La purga se acusa después**, en el mismo ledger, con fecha real,
   prefijos purgados y número de claves borradas. **Sin acuse, no se declara
   la jornada siguiente.**

En Blob, el borrado va con `del` del SDK, **fuera del puerto `RawStore`**,
sobre los prefijos de día por par (`objects/` y `meta/`), exactamente como
ADR-009 §4 lo dejó previsto. **El puerto no gana una operación de borrado**:
ADR-009 §5 ya dijo que eso es una spec, y para dos jornadas de decenas de
megabytes no vale lo que cuesta. Sus minutos cuentan para la cifra de
operación manual.

**Se firma sabiendo lo que ADR-009 firmó:** ningún test se pone rojo si nadie
purga. La ceremonia —fecha antes, acuse después, sin acuse no hay jornada
siguiente— es la red, y el operador en el bucle es la razón de que se acepte
aquí y **no** se aceptaría en producción.

### §4. El `raw_ref` colgante es un estado declarado, no un error

RN-13 prohíbe borrar la `Observation`, así que la única retención posible es
la que ADR-009 §Contexto dejó despejada: **se borra el raw y la observación
sobrevive a su referencia.** Este ADR lo declara estado legítimo del sistema:

- Un `raw_ref` cuyo objeto fue purgado **sigue siendo una cita verificable
  contra una copia y no recuperable** — el digest va dentro de la clave
  (ADR-009 §3) — y la fila que lo lleva no se toca, no se anota ni se
  reescribe.
- **Ningún código puede tratar un `get` fallido del raw store como
  corrupción** de la `Observation` que lo cita. Quien necesite los bytes
  (replay, verificación) y no los encuentre está fuera del plazo de §2, y esa
  es la respuesta, no un bug.
- El motor (spec siguiente) hereda esto como dato de partida: decide sobre
  `Observation`, no sobre bytes, y no le exige al archivo nada en caliente.

## Consecuencias

### Positivas

- **La precondición de ADR-009 §6 queda satisfecha para lo único que se va a
  desplegar**, sin inventar la retención de producción: la unidad (jornada
  declarada y finita) y el operador en el bucle son los de una medición, y el
  plazo es el ya firmado en ADR-009, no un número nuevo.
- La pregunta del `raw_ref` colgante deja de estar sin dueño **antes** de que
  exista la primera fila que pueda quedar colgante.
- El amparo del art. 4 TDM sobre `ceroacero.es` conserva lo que exige: plazo
  declarado, ahora también para el régimen de jornada.

### Negativas / follow-ups

- **La ejecución sigue dependiendo de una persona**, y a diferencia de
  EPIC-001 el archivo vive en Blob de producción. Es la parte débil, se firma
  sabiéndolo, y la frontera de §1 impide que se convierta en el mecanismo de
  producción por deriva.
- **La retención de producción sigue sin existir** (F-SPEC-001-1 abierta, las
  tres preguntas de ADR-009 §6 intactas). El go/no-go no la necesita; el
  producto sí.
- **El dictamen de `sdd-legal-datos` sobre el régimen de jornada sigue sin
  pedirse.** Este ADR fija cuánto se conserva; si se puede capturar una
  jornada entera es la pregunta de SPEC-008 notas §7, y su sitio es antes de
  declarar la primera jornada (SPEC-012, runbook).

## Alternativas consideradas

- **Escribir ya la retención automática (spec que añada `delete` al puerto
  más un barrido).** Rechazada por coste/beneficio: es la respuesta correcta
  de producción (ADR-009 §5 la reserva como spec), y para dos jornadas
  acotadas con operador en el bucle no compra nada que la ceremonia no dé.
  Sigue siendo el destino cuando exista producción.
- **Tratar el cron como producción y bloquear SPEC-012 hasta tener esa spec.**
  Rechazada: retrasaría las cuatro cifras —el entregable de la épica— para
  proteger un archivo cuya unidad sigue siendo una ventana finita de
  medición. La lectura la habilita ADR-019 §3, que es estructura, no promesa.
- **No purgar hasta el go/no-go.** Rechazada: retención indefinida de HTML de
  terceros con nombres dentro es exactamente lo que ADR-009 descartó (art.
  5.1.e, art. 4 TDM), y el volumen ya no es trivial.
- **Purgar por objeto al parsear.** Rechazada aquí como en ADR-009: destruye
  la recalibración y el replay, que son la mitad del valor del archivo en una
  épica que aún va a corregir parsers.
- **Tratar el `raw_ref` colgante como error (y anotar o borrar la
  `Observation`).** Rechazada: borrar viola RN-13 y anotar la reescribe, que
  es lo mismo con otro verbo. La clave autoautenticante ya conserva lo único
  conservable.

<!-- REGLA: un ADR aceptado es INMUTABLE. Para cambiar la decisión, escribe otro ADR que lo supersede (estado del viejo -> bloqueada + nota "superseded por ADR-NNN"). -->
