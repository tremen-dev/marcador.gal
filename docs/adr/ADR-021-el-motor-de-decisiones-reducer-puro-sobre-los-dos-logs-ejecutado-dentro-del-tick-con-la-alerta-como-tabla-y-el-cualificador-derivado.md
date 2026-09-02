---
id: ADR-021
tipo: adr
estado: aprobada
historial:
  - {estado: borrador, fecha: 2026-09-02, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-09-02, por: Alberto Fojo}
aprobada-por: Alberto Fojo
---
# ADR-021: El motor de decisiones: reducer puro sobre los dos logs, ejecutado dentro del tick, con la alerta como tabla y el cualificador derivado

- Deciders: propone `sdd-arquitecto` el 2026-09-02, al especificar **SPEC-013**
  (EPIC-002). **Aprueba: pendiente de gate humano.** Nace en `borrador` y ningún
  rol `sdd-*` puede firmarlo.
- Specs relacionadas: **SPEC-013** (nace con ella y la gobierna entera);
  **SPEC-001** (`hecho`, el modelo canónico y los puertos que este ADR se
  prohíbe tocar); **SPEC-010** (`hecho`, `PostgresDecisionStore` y su arbitraje
  de versión); **SPEC-012** (`hecho`, el tick dentro del cual corre el motor —
  §4 enmienda la letra de su CA-7 por la vía de ADR-015); y aguas abajo el
  **bot**, el **panel**, el **snapshot** y la **spec de las cuatro cifras**, que
  consumen lo que aquí se fija.
- Relacionado: **ADR-006** (acceso a datos, instantes como cadena `Z`, RN-12 y
  RN-13 en triggers), **ADR-008 §1** (la fuente oficial no es capturable),
  **ADR-013** (semántica visual del marcador: el cualificador es lo que llega a
  la pantalla), **ADR-015** (enmiendas a specs cerradas), **ADR-016** (cómo se
  demuestra una frontera de capacidad), **ADR-017 §5** (la versión de la
  `Decision` la arbitra la base) y **ADR-019** (el tick y la ventana de partido).

## Contexto

### El motor es la única puerta y no existe

RN-08 y **D-3** dicen que ninguna fuente publica un marcador sin pasar por el
motor de decisiones. Desde SPEC-012 el proyecto tiene el camino completo fuente
→ archivo → `Observation` persistida, y `decisions` sigue **vacía por criterio**
(SPEC-012 CA-4.4): *publicado* todavía no ocurre. Las cuatro cifras de EPIC-002
están definidas contra «el dato **publicado**», así que ninguna de las cuatro se
puede medir hoy.

RN-01..RN-07 llevan escritas desde el 2026-08-29 y han ganado en tres gates
sucesivos cuatro aclaraciones que nacieron **de no poder escribir esta spec**:
la precedencia del operador sobre la RFGF (F-SPEC-001-13), que «humano» en RN-04
y RN-06 incluye al corresponsal (F-SPEC-001-14), que el alcance de RN-03 es la
`Decision` entera y no solo el marcador (F-SPEC-001-14), y el corte de RN-12
entre orden de **evaluación** y regla **decisiva** (F-SPEC-001-15). Las cuatro
son precondiciones de este ADR y aquí se ejecutan, no se reabren.

### Lo que cambió de premisa antes de escribir una línea

Con **una sola fuente automática capturable** —`ceroacero.es`, peso 0.7
(ADR-008 §1, `_epica.md` de EPIC-002)— la primera vía de RN-02 (peso ≥ 0.9) no
la satisface hoy ninguna fuente automática, y la segunda (dos independientes
≥ 0.7 que coinciden) **no tiene con qué formarse**. El motor nace sabiéndolo.
Eso no permite no implementar la segunda vía: permite —y obliga a— decir cómo se
demuestra algo que hoy no se puede ejercitar con fuentes reales.

### Y hay cuatro cosas que las reglas no dicen y el código tiene que decidir

Ninguna se puede dejar «al implementador de turno», porque cada una cambia lo
que se publica:

1. **Dónde vive el estado del motor.** RN-04 retiene un salto de más de dos
   goles «hasta segunda fuente», RN-05 alerta y no publica, RN-07 mira quince
   minutos hacia atrás. Los tres necesitan memoria, y la plataforma no tiene
   proceso vivo (ADR-004).
2. **Quién lo dispara.** El reducer de `reglas.md` «recibe una `Observation`
   nueva», pero RN-06 (`kickoff + 110 min` sin señal) y RN-07 (quince minutos de
   silencio) disparan **cuando no llega nada**.
3. **Qué es una alerta cuando no hay panel.** RN-05 y RN-07 «generan alerta al
   panel», y el panel es dos specs más adelante.
4. **Dónde viven `sen sinal` y `pendente de confirmar`.** `dominio.md` los llama
   cualificadores del marcador y `src/model/qualifier.ts` los enumera, pero la
   tabla `decisions` **no tiene columna para ellos** y el modelo canónico es de
   SPEC-001, que está `hecho`; migración 0003 ya escribió que a las tablas del
   modelo canónico no se les añade ninguna columna.

## Decisión

### §1. El motor vive en `src/decide/` y es una función pura

`src/decide/` nace con esta decisión y es el domicilio **único** de RN-01..RN-07.
Su corazón es una función pura:

```
decide(entrada) -> resultado
```

sin `await`, sin reloj propio, sin base de datos, sin red. El reloj entra como
`now` (cadena ISO 8601 UTC, ADR-006); los datos entran como valores.

**El modelo canónico sigue en `src/model/`** y el motor no es su dueño: lo
importa igual que lo importa el frontend (`CLAUDE.md`, §Stack). Un motor dueño
del tipo que cruza al cliente por JSON sería un motor del que cuelga la pantalla.

La razón de la pureza no es estética: el reducer es la pieza sobre la que hay
que poder **reproducir una jornada entera** desde el archivo (RN-10, D-5) sin
red y sin base, y una función que va a la base a mitad no se replaya.

### §2. Su único estado son los dos logs: no hay estado durable propio del motor

**La retención de RN-04, la discrepancia de RN-05 y el silencio de RN-07 no
crean ninguna tabla de estado.** Todo lo que el motor necesita saber está ya
escrito, y escrito de forma inmutable:

- **`observations`** (RN-13, append-only) dice qué dijo cada fuente y cuándo. De
  ahí salen: la última observación por fuente, el instante de la última
  observación del partido (RN-07), el salto retenido (una observación existe
  aunque no se haya publicado) y la segunda fuente que lo libera.
- **`decisions`** (append-only, la de mayor `version` es la vigente) dice qué
  publicamos y por qué regla (RN-12).

El motor recibe una **vista** de esos dos logs y devuelve qué escribir. Una tabla
de «marcadores retenidos» habría sido un tercer log que puede desincronizarse
con los dos que ya existen y que RN-13 protege; el estado derivado no miente
nunca porque no se guarda.

**Consecuencia querida:** replayar el log de observaciones de un partido desde
cero tiene que producir exactamente el mismo log de decisiones. Es el criterio
que hace medible la palabra «trazable» de D-6.

### §3. Dos disparadores, una sola puerta, y un aplicador que persiste

`decide` recibe una entrada **discriminada**, con dos variantes:

- **`observation`** — llega una `Observation` nueva. Es el reducer de
  `reglas.md` tal cual.
- **`time`** — no llega nada y el reloj avanzó. Es lo que hace ejecutables
  `kickoff + 110 min` (RN-06), los quince minutos de RN-07 y la persistencia de
  una discrepancia (§8.2).

Las dos variantes atraviesan **la misma** cadena de reglas en el orden de
`reglas.md`; no hay dos motores.

El **aplicador** (`src/decide/apply.ts`) es la única parte impura: lee
`DecisionStore.getLatestByMatch` y las observaciones del partido, llama a
`decide`, y escribe con `DecisionStore.append` y `AlertStore.append`.
**La versión no la calcula el motor: la arbitra la base** (ADR-017 §5,
`migrations/0003`). Si el aplicador recibe `DecisionVersionConflictError`, el log
se movió bajo sus pies: **relee y reintenta una vez**, y si vuelve a chocar
abandona ese partido en este ciclo y lo registra. No hay bucle de reintentos y
no hay versión adivinada.

### §4. Cuándo corre: dentro del mismo tick, después de la ingesta

El ciclo completo vive en **`src/decide/cycle.ts`**: calcula los partidos en
ventana (la función de elegibilidad de `src/ingest/windows.ts`, ADR-019 §2 y §3),
ejecuta el tick de ingesta de SPEC-012 y, **a continuación y en la misma
invocación**, pasa el motor por esos mismos partidos. La ruta del cron delega en
el ciclo.

Tres razones, y la primera decide:

1. **Latencia.** La cifra de latencia de EPIC-002 exige < 120 s entre el gol y el
   dato publicado. Un segundo cron para el motor añadiría hasta 60 s de espera a
   una cadena que ya gasta hasta 60 s en el tick de ingesta. La mitad del
   presupuesto, regalada por una decisión de fontanería.
2. **`vercel.json` sigue declarando un solo cron** (SPEC-012 CA-8 intacto) y
   RN-11 sigue con un solo emisor de peticiones.
3. **La frontera de RN-08 se mantiene sin tocar `src/ingest/`.** SPEC-008 CA-12
   prohíbe que `src/ingest/` mencione `DecisionStore` o construya una `Decision`,
   y esa frontera es correcta: el adaptador no publica. Es `src/decide/` quien
   llama a `src/ingest/`, nunca al revés. La dependencia va en la dirección que
   la regla quiere.

**Esto enmienda la letra de SPEC-012 CA-7**, que dice que la ruta «delega entera
en la función del tick de `src/ingest/`»: pasará a delegar en el ciclo de
`src/decide/`, que llama al tick. **La sustancia de CA-7 queda entera** —la ruta
autentica, falla cerrado sin `CRON_SECRET` y no contiene lógica— y la enmienda se
registra en el ledger de SPEC-012 con las cinco partes de **ADR-015 §3**. Lo dice
este ADR y no lo descubre nadie después: ADR-015 §5 obliga a quien invalida a
nombrar el CA.

### §5. La alerta es una tabla append-only, y es la materia prima de la cifra de conflictos

`migrations/0006` crea `alerts`: una fila por **entrada** en una condición de
alerta, con el partido, el instante `Z`, la regla (`RN-05` o `RN-07`), el motivo
en texto y los ids de las observaciones implicadas. Append-only con
`reject_amendment`, como `calendar_loads` e `ingest_attempts`; **no es modelo
canónico** y por tanto no entra en el test de paridad de SPEC-001 CA-14.

Tres cosas que esta decisión fija y una que deja fuera:

- **Se alerta al entrar en la condición, no mientras dura.** Un conflicto que
  persiste diez minutos con un tick por minuto son **una** fila, no diez. Lo que
  decide si es nueva es la última alerta de esa regla para ese partido, que entra
  en `decide` como dato: el motor sigue siendo puro.
- **Una alerta no es una `Decision` y no publica nada.** RN-05 lo dice con todas
  las letras: el conflicto **no se publica**.
- **La tabla es la cifra.** La tercera métrica de EPIC-002 —«% de partidos con
  desacuerdo entre fuentes en algún momento»— se calcula contando partidos con
  alerta `RN-05`. Sin este registro habría que reconstruirla adivinando desde
  `observations`, que es exactamente el tipo de cifra que la épica prohíbe.
- **Sin panel no hay acuse.** No hay estado «vista», ni «resuelta», ni
  destinatario. Eso lo trae el panel, y cuando lo traiga será una tabla suya:
  `alerts` es un hecho histórico, no una bandeja.

### §6. Los cualificadores se derivan; no hay columna nueva en el modelo canónico

`src/decide/qualifier.ts` exporta una función **pura y total** que, dada la
`Decision` vigente y las observaciones que la sostienen, devuelve uno de los
cuatro valores de `MATCH_QUALIFIERS` (SPEC-001 CA-8), en este orden:

1. **`sen_sinal`** si la `Decision` vigente tiene `rule: 'RN-07'`.
2. **`pendente_de_confirmar`** si su `status` es `finished` y **ninguna** de sus
   observaciones de apoyo dice `finished` — es decir, el final se alcanzó por el
   timeout de RN-06 y no porque una fuente lo cerrara.
3. **`provisional`** si `provisional` es cierto (RN-03).
4. **`confirmado`** en otro caso (RN-02).

Ninguna de las cuatro necesita una columna nueva, y esto es lo que permite
respetar a la vez RN-08, `migrations/0003` («no se añade ninguna columna a las
tablas del modelo canónico») y el hecho de que SPEC-001 esté `hecho`.

**Que `sen sinal` se codifique como `rule: 'RN-07'` no es un truco:** es la
definición de `rule` aplicada. `dominio.md` dice que `rule` es «la regla del
motor que produjo una Decision», y una `Decision` producida por el silencio la
produjo RN-07. RN-12 lo respalda por su lado: coloca RN-07 en el escalón 3 de la
atribución precisamente porque el silencio «no está en ninguna otra columna».

**Y por eso el silencio emite `Decision`.** Entrar en *sen sinal* es cambiar lo
que ve el usuario, y RN-08 dice que nada llega al usuario sin pasar por el motor:
si el silencio no se publicase, la pantalla estaría mostrando un cualificador que
ninguna `Decision` sostiene. **Salir** del silencio es también una `Decision`,
con la regla que corresponda —RN-02 o RN-03 si nada más cambió, que es
exactamente el escalón 5 de RN-12: «la `Decision` solo mueve el marcador **o su
cualificador**»—.

**El cualificador no borra `provisional`.** La columna sigue ahí y se lee al
lado: un partido puede estar a la vez *sen sinal* y provisional, y la interfaz
decide cómo lo enseña (ADR-013). La función devuelve **uno**; la `Decision`
sigue diciendo lo demás.

### §7. La independencia de RN-02 es una relación **declarada**, y su lista nace vacía

La segunda vía de RN-02 exige dos fuentes **independientes** de peso ≥ 0.7.
`dominio.md` fija que la independencia es una **relación medida**, que lo
desconocido se trata como espejo (SPEC-002 CA-12) y que hoy no hay veredicto.

Se implementa como una **lista cerrada de pares declarados independientes**,
versionada en `src/decide/`, **que nace vacía**, con el motivo de cada entrada
escrito a su lado —la forma de `MEASUREMENT_WINDOWS` (ADR-019 §3) y de
`ALLOWED_PACKAGES` (ADR-016 §3.2)—. La relación es simétrica y **por defecto
falsa**: dos fuentes no son independientes hasta que un veredicto lo declara.

Consecuencias, y son las dos que importan:

- **La segunda vía de RN-02 existe en el código, se prueba entera, y hoy no se
  ejerce.** Se prueba **inyectando** una lista sintética; con la lista de
  producción, ningún par la satisface, y hay un criterio que lo afirma. Es la
  respuesta a «cómo se demuestra lo que no se puede ejercitar con fuentes
  reales»: la capacidad se prueba con dobles, y su **inercia en producción** se
  prueba contra la lista real.
- **El día que vuelva `futgal.es`, o que SPEC-002 dicte independencia, no se
  reescribe el motor: se añade una entrada con su motivo.** Es la misma promesa
  que `_epica.md` hizo del adaptador («un adaptador más y un peso en la
  configuración»), llevada a la regla que la necesitaba.

### §8. Las cuatro lecturas de RN-01..RN-07 que el motor fija

Las reglas están escritas para un lector humano y el código no puede quedarse a
medias. Estas cuatro lecturas **no son umbrales nuevos**: son cuál de dos
lecturas posibles vale. Siguen el precedente de las aclaraciones de RN-01 y
RN-03; **aprobado este ADR, `sdd-arquitecto` las traslada a `reglas.md`** como
aclaraciones fechadas, que es donde viven las reglas.

**8.1 — La retención de RN-04 alcanza solo por debajo de 0.9.** «Un salto de más
de 2 goles en una sola observación se retiene hasta segunda fuente» se aplica a
observaciones de peso < 0.9. Una de peso ≥ 0.9 —operador, RFGF, API de pago—
publica directamente. Motivo: RN-02 declara que ≥ 0.9 basta para publicar
*confirmado*; retener lo que RN-02 declara suficiente sería que una regla
contradiga a la otra. Y con la fuente oficial no capturable, la única forma de
que una `Decision` llegue a *confirmado* es el operador (RN-01): retenerlo
«hasta segunda fuente» lo dejaría retenido para siempre, porque esa segunda
fuente no existe.

**8.2 — «Se mantiene la última confirmada» de RN-05 se lee «se mantiene la
vigente», y una discrepancia solo es conflicto cuando persiste.** Dos lecturas
y las dos razones:

- *La última confirmada* → *la vigente*: hoy no hay ninguna `Decision`
  *confirmada* de fuente automática, así que la lectura literal obligaría a
  **despublicar** ante el primer conflicto, y eso contradice RN-03 («mejor
  provisional a tiempo»). Lo que RN-05 protege es que el conflicto no se
  publique, no que se borre lo anterior.
- *Persistencia*: dos fuentes que van a distinta velocidad discrepan cada vez
  que hay un gol, durante unos segundos. Tratar eso como conflicto convertiría la
  tercera cifra de la épica en un contador de goles. Una discrepancia es
  conflicto cuando **sigue en pie `CONFLICT_GRACE` después de la más reciente de
  las dos observaciones que discrepan**: si la rezagada tuvo tiempo de ponerse al
  día y no lo hizo, discrepan de verdad. `CONFLICT_GRACE` = **3 minutos**, número
  **elegido, no medido** —como `PRE`, `POST` y las 6 h de ADR-014 §3.2—, que a un
  tick por minuto son tres oportunidades de coincidir. Vive como constante
  nombrada en un solo sitio y se revisa con la primera jornada delante.

**8.3 — Las transiciones de estado son una tabla cerrada para las fuentes
automáticas; el humano y la oficial pueden corregir a cualquier estado.** RN-06
enumera cómo se entra en `live`, `finished`, `postponed` y `suspended`. Lo que no
enumera —`finished → live`, `live → scheduled`— **no lo hace una fuente
automática**: se ignora como transición (la `Observation` se guarda igual, RN-13)
y, si concurre con otra fuente, cae en RN-05. La fuente oficial y el humano
—operador **o** corresponsal, RN-01— pueden llevar el partido a cualquiera de los
cinco estados: RN-04 ya les concede bajar un marcador y RN-06 les concede
`postponed` y `suspended` en exclusiva; negarles la corrección de un estado
erróneo dejaría al operador sin la función que RN-01 le atribuye, arbitrar.

**8.4 — El motor lee el peso de la `Observation`, y el rol de una tabla de
roles.** El umbral de RN-02/RN-03 se evalúa contra `observation.confidence`, que
es el peso que RN-01 tenía **cuando se observó** y que RN-13 congela; no contra
la tabla de hoy. Lo que la tabla aporta es **identidad**: quién es el operador,
quién la oficial, quién es humano. Esa tabla —`SourceId` → rol de RN-01— vive en
`src/decide/`, se apoya en `RN01_WEIGHTS` (`src/ingest/sources.ts`, SPEC-008: los
números de RN-01 tienen un solo domicilio y no se copian) y **falla cerrado**:
una `SourceId` sin rol es un error con nombre, nunca «se asume automática».

### §9. Lo que este ADR no decide

- **No escribe ningún test de arquitectura nuevo para RN-08.** La frontera
  «solo `src/decide/` escribe una `Decision`» es una frontera de capacidad y le
  aplicaría ADR-016 entero. SPEC-013 la demuestra con el mecanismo que ya existe
  —el lector del compilador de SPEC-008/SPEC-009— y **declara dentro del propio
  criterio lo que ese mecanismo no alcanza** (ADR-016 §6). Ensanchar el mecanismo
  es trabajo de otra spec, con su propio presupuesto: SPEC-009 existe porque esto
  se subestimó una vez.
- **No decide nada del panel, del bot, del snapshot ni de las cifras.** Fija lo
  que los cuatro van a consumir y nada más.
- **No toca `reglas.md` ni el modelo canónico.** Las aclaraciones de §8 entran en
  `reglas.md` **después** de la firma, y `src/model/` no cambia.

## Consecuencias

### Positivas

- **`decisions` deja de estar vacía y las cuatro cifras pasan a ser medibles.**
  «Publicado» empieza a ocurrir, que es la precondición de las cuatro métricas de
  EPIC-002 y de que RN-08 signifique algo.
- **El motor es replayable de punta a punta sin red ni base**, que es lo que
  convierte D-5 y RN-10 en una capacidad y no en una promesa: una jornada
  archivada se puede volver a decidir con un parser corregido.
- **Ninguna tabla de estado nueva salvo el registro de alertas**, y ésa se
  justifica sola porque es la tercera cifra de la épica.
- **La segunda vía de RN-02 queda escrita, probada e inerte.** El día del sí de
  la RFGF —o del veredicto de SPEC-002— es una entrada en una lista, no una
  reescritura.
- **El modelo canónico no se toca**, así que SPEC-001 sigue cerrada y el tipo que
  cruza al frontend por JSON no cambia de forma.

### Negativas / follow-ups

- **La frontera de RN-08 queda demostrada a medias, y está dicho.** El mecanismo
  alcanza el grafo de imports; no alcanza a un módulo que obtuviera un `Sql` y
  escribiera `decisions` con SQL etiquetado compuesto. El residuo se declara
  dentro del criterio (ADR-016 §6) y su destino es **EPIC-MEJORA**, con
  disparador escrito: el día que un segundo módulo fuera de `src/decide/`
  necesite escribir en la base.
- **`CONFLICT_GRACE` es un número elegido sin evidencia**, como `PRE` y `POST`.
  Si son tres minutos de más, la cifra de conflictos sale baja; si son de menos,
  sale inflada por sincronía. Se revisa con la primera jornada.
- **Derivar `sen sinal` de `rule: 'RN-07'` acopla el cualificador a la
  atribución de RN-12.** Si algún día RN-12 cambia el orden de desempate de forma
  que RN-07 deje de ser la regla registrada en una `Decision` de silencio, el
  cualificador se rompe **en silencio**. Lo despierta cualquier cambio en el
  orden de RN-12, y el criterio de SPEC-013 que lo cubre lo dice.
- **El motor depende de `src/ingest/`** (los pesos de RN-01 y la elegibilidad por
  ventana), lo que deja la tabla de RN-01 —vocabulario del motor— viviendo en el
  módulo de ingesta. Copiarla sería peor. Mover el domicilio exige tocar ficheros
  de SPEC-008, que está `hecho`: **destino EPIC-MEJORA**, disparador «la próxima
  spec que ya tenga que tocar `src/ingest/sources.ts` por otro motivo».
- **El ciclo hace más trabajo dentro del mismo minuto.** Si el motor tardara lo
  bastante como para que el tick no cupiera en su invocación, la primera víctima
  sería la ingesta. Con dos competiciones y ~18 partidos por jornada no es un
  riesgo real; con veinte competiciones lo sería, y entonces la respuesta es
  partir el cron, no adelgazar el motor.
- **Una discrepancia con `CONFLICT_GRACE` de espera retrasa la alerta**, no la
  publicación: lo que se publica sigue siendo lo que la regla decida en ese
  instante.

## Alternativas consideradas

- **Un segundo cron para el motor** (`/api/cron/decide`, `* * * * *`).
  Rechazada: añade hasta 60 s a una cadena cuyo presupuesto de latencia son
  120 s, y rompe la letra de SPEC-012 CA-8 («declara **un** cron») a cambio de
  nada. El acoplamiento que evita —ciclo llama a tick— es el acoplamiento que
  RN-08 quiere.
- **Llamar al motor desde `src/ingest/`.** Rechazada: rompe SPEC-008 CA-12, que
  es la única barrera ejecutable de RN-08 que existe hoy, y a cambio ahorra un
  fichero.
- **Una tabla de estado del motor** (marcadores retenidos, conflictos abiertos,
  silencios anunciados). Rechazada: es un tercer log que puede desincronizarse
  con dos logs inmutables que ya contienen la respuesta, y mata el replay, que es
  la propiedad por la que existe el raw store (D-5).
- **Añadir columnas `qualifier` o `sen_sinal` a `decisions`.** Rechazada: toca el
  modelo canónico de SPEC-001, que está `hecho`; contradice la regla escrita en
  `migrations/0003`; y guarda un valor derivable, que es la forma habitual de que
  dos verdades se separen.
- **Emitir la alerta en cada ciclo mientras dure la condición.** Rechazada: a un
  tick por minuto convierte un conflicto de media hora en treinta filas y la
  tercera cifra de la épica en un contador de minutos.
- **Deducir la independencia de RN-02 en tiempo de ejecución** (comparar
  historiales y decidir si dos fuentes son espejos). Rechazada: es SPEC-002
  entera, tiene su propio instrumento y su propio veredicto, y meterla en el
  camino de publicación haría que lo que se publica dependiera de un análisis no
  supervisado. `dominio.md` es explícito: la independencia se **mide**, y lo
  desconocido se trata como espejo.
- **Tratar como conflicto toda discrepancia instantánea** (sin `CONFLICT_GRACE`).
  Rechazada: mide la latencia relativa entre fuentes, no el desacuerdo, y llenaría
  la tercera cifra de falsos positivos justo en la épica que la publica.
- **Aplazar RN-05 y RN-07 a la spec del panel**, dejando el motor con cinco
  reglas. Rechazada: RN-12 fija el orden de atribución sobre las siete, la
  tercera cifra de la épica **es** el registro de RN-05, y una `Decision` que
  ignora el silencio publica un marcador vivo que nadie está observando.
