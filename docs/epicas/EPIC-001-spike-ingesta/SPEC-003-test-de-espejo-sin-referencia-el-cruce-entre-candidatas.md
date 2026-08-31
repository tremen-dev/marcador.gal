---
id: SPEC-003
tipo: spec
epica: EPIC-001
estado: borrador
aprobada-por:
historial:
  - {estado: borrador, fecha: 2026-08-31, por: sdd-arquitecto}
---
# SPEC-003 — Test de espejo sin referencia: el cruce entre candidatas

## Problema

**El instrumento de SPEC-002 está construido, verificado y no se puede usar.**
`sdd-legal-datos` dictaminó el 2026-08-31 que `https://www.futgal.es/robots.txt`
termina en `User-agent: *` / `Disallow: /`. Nuestro user-agent cae en el comodín,
**RN-11** obliga a respetarlo y el no-negociable de legalidad de `FOUNDATION.md`
lo repite para el spike. El capturador, que hace lo correcto, marcaría **todos**
los ticks de futgal como `skipped`: cobertura 0 % en sus dos pares y, por
**SPEC-002 CA-5**, ventana inválida sin informe de nada.

Y futgal es **la referencia** del test. Sin referencia, SPEC-002 no responde nada.

**Pero la pregunta que de verdad gobierna RN-02 no necesita a futgal.** RN-02 abre
su segunda vía cuando **dos fuentes independientes de peso ≥ 0.7 coinciden**, y
en el spike esas dos son exactamente las candidatas: ceroacero y besoccer
(ADR-008 §2). Si son espejos **entre sí**, esa vía no existe, y eso se puede
medir con las dos solas. Es el cruce que SPEC-002 llama **CA-15**, corriendo sin
los dos cruces contra la referencia.

**Y la pregunta subió de rango, no bajó.** Sin futgal, el spike **no tiene ninguna
fuente automática de peso ≥ 0.9** (ADR-008 §1). La primera vía de RN-02
—*confirmado* por peso— queda cerrada para todo lo que no sea una persona. La
segunda vía pasa a ser la **única** ruta automática a *confirmado*. La
independencia mutua de las dos candidatas deja de ser una pregunta entre varias y
pasa a ser **la** pregunta que decide la forma del motor.

### El daño que gobierna esta spec, medido y no supuesto

Es el mismo del §Problema de SPEC-002 —**confianza falsa**— pero con una vía de
entrada nueva: **quitar el instrumento no borra sus salidas.** Un campo que se
calculaba contra la referencia sigue calculándose, con la referencia sustituida
por el conjunto vacío, y devuelve la respuesta más halagüeña que existe.

El caso concreto está en el código de SPEC-002, medido y no supuesto. En
`src/mirror/analysis/verdict.ts`, `verdictBetweenCandidates` recibe
`futgalErrorSignatures` y calcula:

```ts
const upstream = analysis.replicated_errors.some(
  (error) => !input.futgalErrorSignatures.has(errorSignature(error)),
);
```

Con el conjunto **vacío** —que es lo que hay sin capturar futgal— **cada** error
replicado pasa el filtro y `origen_comun_distinto_de_futgal` sale `true`. El
informe afirmaría un **origen común aguas arriba de futgal** cuando lo único
cierto es que **no hemos mirado**. No es un caso límite: es el desenlace por
defecto de este modo en cuanto haya un solo error replicado, que es justo el
desenlace más informativo del test.

De ahí la regla que ordena toda la spec, y que vale para cada campo del informe:

> **«No lo hemos comprobado» tiene que ser distinguible de «no lo había», en el
> JSON y en la prosa.** Un `false`, un `0`, una lista vacía o una clave ausente
> son todos indistinguibles de una medición que salió negativa. Lo no medido se
> **declara**, con nombre propio y valor propio.

Un lector dentro de seis meses abre `hallazgos/`. Si no puede distinguir las dos
cosas leyendo el fichero, el fichero miente aunque cada uno de sus números sea
correcto.

## Usuarios / roles afectados

- **`sdd-arquitecto`**, como autor de la spec del motor: es quien consume el
  veredicto. Con futgal fuera, es su **única** entrada sobre RN-02.
- **El operador del spike** (el autor, RN-01): corre la ventana y escribe el
  emparejamiento y la calibración.
- **`sdd-verificador`**: juzga contra el archivo y contra fixtures, nunca contra
  la ventana en vivo, que es irrepetible.
- **`sdd-legal-datos`**, y aquí **no es consultivo sino bloqueante**: su dictamen
  del 2026-08-31 marca `besoccer.es` como **DUDOSO** (§5 de las notas del gate).
  Sin besoccer no hay par y esta spec no tiene nada que medir.
- **`sdd-producto`**: las otras tres métricas de EPIC-001 no se rescatan con esta
  ventana (ADR-008, *Negativas*). Se le señala; no se le decide.

## Diseño

### §1. Por qué una spec nueva y no la enmienda 2 de SPEC-002

La pregunta la hizo el encargo y no se da por supuesta. Cuatro razones, y la
primera basta:

1. **SPEC-002 no está equivocada.** Mide lo que dice medir y, ante una referencia
   inalcanzable, hace exactamente lo correcto: se niega. Lo que cambió no es su
   texto, es el mundo. Una enmienda corrige una spec; aquí no hay nada que
   corregir. Lo que hay es un **entregable nuevo**: otra ventana, otra pregunta,
   otro informe, otro fichero de hallazgo.
2. **SPEC-002 está `hecho`, que es terminal, y su PR #2 está abierto, verificado
   GREEN y esperando merge humano.** Enmendar su cuerpo movería el contrato bajo
   un artefacto ya verificado: `sdd-verificador` juzgó contra el texto de la
   enmienda 1, y el GREEN dejaría de significar lo que dice. La enmienda 1 se
   pudo hacer precisamente porque la spec estaba en vuelo; esta no lo está.
3. **Esto trae código nuevo**, y el estándar es explícito: *nada se codea sin
   SPEC aprobada*. Un modo nuevo, un esquema de informe nuevo, una regla de
   decisión propia y un cambio en RN-11 sobre redirecciones necesitan sus propios
   CA, su propio ledger y su propia verificación adversarial. Colgarlos de una
   spec cerrada los deja sin ninguna de las tres cosas.
4. **Los dos modos van a convivir.** Si la RFGF autoriza, SPEC-002 se corre tal
   cual, sin tocar. Dos preguntas que conviven quieren dos documentos, no un
   documento con un modo escondido en las notas.

**Lo que sí hereda:** todo. Las dos fases (SPEC-002 *Diseño* §1), la lectura de
RN-11 por fuente y competición (§3), la asimetría de qué prueba cada señal (§2),
τ = 90 s, N_min = 10, los mínimos de adelanto, las 3 capturas de persistencia, el
emparejamiento manual de CA-6, el determinismo de CA-7, las citas de CA-14 y el
contador de grafía sin voto de CA-10.4. **Esta spec no reabre nada de eso**
(CA-13). Lo que reescribe es únicamente lo que dejó de tener sentido al quitar la
referencia.

### §2. Qué prueba un cruce sin referencia, y qué no

La tabla del *Diseño §2* de SPEC-002 sigue valiendo, pero **cambia de fuerza**,
porque las dos fuentes ya no son «origen» y «copia»: son dos **hermanas
posibles**. Esta es la tabla del modo sin referencia, y es la sección que
gobierna todos los CA:

| Señal entre C1 y C2 | Qué prueba **sin referencia** | Fuerza |
|---|---|---|
| Error transitorio replicado por las dos (misma retractación, mismo partido) | **Origen común**, probado. Dos fuentes que observan por su cuenta coinciden en los aciertos —el marcador real es uno— pero no en los fallos. | **Sólida.** Es lo único que este modo prueba de verdad. |
| Ese origen común **es** o **no es** futgal | **Nada.** Requiere las firmas de error de futgal, que no se han capturado. | **Nula.** No se afirma; se declara no comprobado (CA-3). |
| C1 adelanta a C2 **y** C2 adelanta a C1 (mínimos de SPEC-002 CA-15.1) | Que ninguna es **origen de la otra**. **No** que ninguna derive de una tercera. | **Insuficiente.** Ver abajo. |
| Adelantos en **una sola** dirección | Indicio de origen común. **No** dice de quién: C2 rezagada respecto de C1 es igual de compatible con «C2 copia de C1» que con «las dos copian de O con retardos distintos». | **Indicio.** No nombra espejo de nadie (CA-9). |
| Discrepancia persistente que no converge | Que no leen la **misma** copia de un origen único. No que alguna observe el hecho. | **Insuficiente.** Ver abajo. |
| Sincronía (cero exclusivos, cero adelantos en ambas direcciones, N ≥ N_min, mitad temporal completa) | Indicio de origen común. | **Indicio.** Hereda SPEC-002 tal cual. |
| Grafías distintas del nombre de un equipo | **Nada, en ninguna dirección.** Y aquí el argumento es más fuerte que en SPEC-002: son dos agregadores, cada uno con su base de equipos, así que dispararía incluso para dos reventas literales del mismo feed. | **Nula.** Se registra y no dicta (SPEC-002 CA-10.4 y CA-15.4). |

**Por qué los adelantos mutuos no bastan aquí, que es la decisión más cara de esta
spec.** SPEC-002 CA-15.1 lo dice con todas las letras y es exacto: «Que C1
adelante a C2 no prueba que el par sea independiente: prueba que C2 no es origen
de C1». Leído despacio, esa propiedad —«ninguna es origen de la otra»— la
satisfacen **por construcción** dos espejos de un tercero. Un espejo *sí* puede
adelantar a otro espejo; lo que no puede es adelantar a **su** origen. Con la
referencia presente, el hueco lo tapaban los **dos veredictos por candidata**: dos
hermanas de futgal habrían salido ESPEJO o INCONCLUSO contra ella, y una persona
leyendo los tres veredictos juntos vería el cuadro. Sin ellos, el adelanto mutuo
**queda solo, y es compatible con la hipótesis que dice refutar**.

Y hay un mecanismo concreto, no una posibilidad teórica: a 1 captura/minuto
(RN-11) y con τ = 90 s, dos espejos del mismo origen con **refresco irregular**
producen diferencias que superan τ en las dos direcciones sin que ninguna observe
nada por su cuenta. El *Diseño §3* de SPEC-002 ya avisa de que el instrumento
tiene un techo de resolución de un minuto; esta es la otra cara del mismo techo.

**Por qué la discrepancia persistente tampoco basta.** Es más fuerte que el
adelanto mutuo —dos lecturas de la misma copia convergen— pero su umbral son **3
capturas consecutivas**, o sea tres minutos, y con la referencia fuera no hay
ningún cruce que la corrobore. Prueba que no leen la misma copia; no prueba que
alguna **observe el hecho**, que es lo que RN-02 llama independencia.

### §3. La consecuencia: **INDEPENDIENTE no es un veredicto emitible en este modo**

El dominio de veredictos del modo sin referencia es exactamente **{ESPEJO,
INCONCLUSO}**. No es pesimismo: es leer **CA-12 de SPEC-002** —«lo desconocido no
es independencia»— con el instrumento que hay. Este modo puede **refutar** la
segunda vía de RN-02; no puede **establecerla**.

Las señales que con referencia dictarían INDEPENDIENTE no se pierden: se cuentan,
se citan y viajan en el informe, y producen **INCONCLUSO con motivo propio**
(`independencia_no_demostrable_sin_referencia`), que es una cosa muy distinta de
«no encontramos nada».

**Y la acción del motor es idéntica en todas las ramas menos una**, que es lo que
hace que el modo valga la pena aunque no pueda decir que sí:

- **ESPEJO** → la segunda vía de RN-02 **está cerrada**, con evidencia, de forma
  definitiva. El motor nace sabiéndolo y la spec del motor puede **comprometerse**
  en vez de aplazar. Es el desenlace más valioso y, tratándose de dos agregadores
  del mismo fútbol regional, el más probable.
- **INCONCLUSO** (cualquier motivo) → por CA-12 se trata como espejo: el motor se
  diseña con **una sola vía**, que es lo que habría que hacer mientras no haya
  prueba.

O sea: el modo **no puede empeorar** la posición del motor, y en una rama la
**cierra**. Lo que no hace nunca es abrirla, y esta spec está escrita alrededor de
que eso quede dicho en el propio fichero y no en la cabeza de quien lo leyó.

### §4. Las dos mitades siguen, y siguen significando lo mismo

Mitad de **contenido** (datos en reposo) y mitad **temporal** (partidos en vivo),
con sus estados `completa` / `pendiente`, exactamente como el *Diseño §4* de
SPEC-002. Un informe con la temporal `pendiente` es **válido y accionable**.

Cambia una sola cosa, y hacia el lado seguro: como este modo no emite
INDEPENDIENTE, **la mitad de contenido ya no puede cerrar la pregunta en la
dirección buena**. Solo la puede cerrar hacia ESPEJO, que es la dirección que no
necesita esperar a nada.

## Criterios de aceptación

Convenciones, además de las que hereda de SPEC-002:

- **C1, C2** = las dos candidatas de peso 0.7 (RN-01): `ceroacero` y `besoccer`
  (ADR-008 §2). Ninguna es «la fuente».
- **Origen común** = las dos derivan de una tercera fuente en lugar de observar el
  hecho. **Atribución de origen** = identificar cuál es esa tercera. Son cosas
  distintas y este modo solo puede hacer la primera (§Notas para el gate, §6).
- Todo umbral heredado se usa **sin cambio**: τ = 90 s, N_min = 10, los mínimos de
  adelanto de CA-15.1, las 3 capturas de persistencia, el 90 % de ticks de CA-5.

### El informe: lo no medido se declara

- **CA-1 — El modo se declara y no se infiere.**
  Dado el análisis, entonces el informe lleva `modo: 'sin-referencia'` y
  `referencia: null`, y el esquema es una **unión discriminada por `modo`**: un
  informe `sin-referencia` con `referencia` no nula **no valida**, y uno
  `con-referencia` con `referencia: null` tampoco. El punto de entrada del
  análisis exige el modo de forma explícita: **no hay valor por defecto**.
  **Test:** las cuatro combinaciones contra el esquema (dos válidas, dos
  inválidas); y llamar al análisis sin declarar modo es un error de tipo, no un
  informe silenciosamente distinto (fichero `.test-d.ts`, como
  `statuses.test-d.ts`).
  *Por qué:* un operador que olvida un flag tiene que recibir un error, no un
  informe parecido. Es la primera aplicación de la regla del §Problema.

- **CA-2 — Los veredictos por candidata no se omiten: se declaran no medidos.**
  Dado el informe de este modo, entonces **en el lugar** que SPEC-002 ocupa con
  `sources` (los dos veredictos de sus CA-9 y CA-10 contra la referencia) lleva:
  ```
  veredictos_por_candidata: {
    estado: 'no_medidos',
    referencia_prevista: 'futgal',
    motivo: '<texto que nombra robots.txt, Disallow: / y RN-11>',
    dictamen: '<fecha del dictamen de sdd-legal-datos>'
  }
  ```
  y **no** una lista vacía, **no** una lista de dos veredictos INCONCLUSO, y
  **no** la clave ausente.
  **Test:** el esquema **exige** el bloque; `sources: []` no es representable en
  este modo; el `motivo` contiene «robots.txt» y «RN-11»; y un test que recorre
  el JSON y falla si aparece cualquier clave llamada `sources` o `reference`.
  *Por qué:* una lista vacía se lee como «se midió y no salió nada»; dos
  INCONCLUSO se leen como «se midió y fue indeciso». Ninguna de las dos es
  verdad, y las dos hacen que alguien saque conclusiones sobre futgal a partir de
  una ventana en la que futgal no aparece.

- **CA-3 — La prueba de origen común se separa de su atribución.**
  Dado el informe, entonces la clave
  `origen_comun_distinto_de_futgal` de SPEC-002 **no existe en este modo**, y en
  su lugar van tres:
  1. `origen_comun_probado: boolean` — `true` si y solo si hay ≥ 1 error
     replicado entre C1 y C2, con sus cuatro claves raw citadas (CA-14 de
     SPEC-002).
  2. `atribucion_de_origen: 'no_comprobada'` — literal, y el **único** valor que
     este modo puede emitir.
  3. `origen_atribuido_a: null` — y el esquema del modo no admite otra cosa.
  Además: **ninguna ruta de código de este modo consume un conjunto de firmas de
  error de la referencia.** El parámetro no se pasa vacío: no se pasa.
  **Test:** fixture con un error replicado por las dos candidatas →
  `origen_comun_probado: true`, `atribucion_de_origen: 'no_comprobada'`,
  `origen_atribuido_a: null`, con las cuatro claves existiendo en el store; un
  test de estructura que falla si la función de veredicto de este modo acepta un
  parámetro de firmas de referencia; y un test que falla si el JSON de este modo
  contiene la cadena `origen_comun_distinto_de_futgal`.
  *Por qué:* es el fallo medido del §Problema. Con el conjunto vacío, `some(e =>
  !vacio.has(e))` es `true` para todo error replicado, y el informe afirmaría un
  origen aguas arriba de futgal sin haber mirado a futgal. **El arreglo no es
  poner el flag a `false`** —eso diría «el origen común sí es futgal», que
  tampoco se ha comprobado—: es que el campo deje de existir y lo sustituya una
  declaración de no-comprobación.

### El veredicto

- **CA-4 — INDEPENDIENTE no es emitible, y las señales no se tiran.**
  Dado cualquier análisis en este modo, entonces el veredicto pertenece a
  **{ESPEJO, INCONCLUSO}** y nunca a INDEPENDIENTE. Los adelantos mutuos de
  SPEC-002 CA-15.1 y la discrepancia persistente de CA-15.3, cuando superan sus
  mínimos declarados, producen **INCONCLUSO** con motivo
  `independencia_no_demostrable_sin_referencia`, y sus contadores y su evidencia
  **viajan completos** en el informe.
  **Test:** el fixture (a) de `pair.test.ts` de SPEC-002 —adelantos mutuos 2 y 2,
  que allí da INDEPENDIENTE— corrido en este modo da INCONCLUSO con ese motivo,
  con `leads_a`, `leads_b`, `lead_matches_a`, `lead_matches_b` asertados y con
  los adelantos citados; ídem con una discrepancia persistente en 3 capturas; y
  el **tipo** del campo veredicto de este modo excluye `'INDEPENDIENTE'`
  (`.test-d.ts`), de modo que emitirlo no compile.
  *Por qué:* está en el *Diseño §2*. Un espejo puede adelantar a otro espejo; lo
  que no puede es adelantar a **su** origen. Con la referencia, los dos
  veredictos por candidata corroboraban; sin ella, el adelanto mutuo queda solo y
  es compatible con dos hermanas de un origen que no hemos mirado. **El coste
  está declarado y es real:** este modo nunca dirá que sí. Se paga porque el
  daño simétrico —decir que sí sin poder— es el que cuesta el proyecto
  (§Problema de SPEC-002).

- **CA-5 (RN-02) — La bandera es `false` en todos los desenlaces.**
  Dado cualquier informe de este modo, entonces
  `rn02_segunda_via_entre_automaticas: false`, sin excepción, y la prosa dice
  **por qué es `false`**: distingue «se probó origen común» de «no se pudo
  demostrar independencia».
  **Test:** tabla sobre los dos veredictos y sobre los cinco motivos posibles;
  ninguno da `true`. Y un test que recorre la función de decisión del modo y
  comprueba que no existe ninguna rama que escriba `true`.
  *Por qué:* es CA-12 de SPEC-002 aplicada a un instrumento más débil, y es lo
  que la spec del motor va a leer. Sin este criterio, un lector podría interpretar
  «INCONCLUSO por independencia no demostrable» como una casi-independencia.

- **CA-6 — La regla de decisión del modo, total y ordenada.**
  Dado el análisis, entonces el veredicto se decide **en este orden y sin otro
  camino**. Sean: *fuerte-espejo* = ≥ 1 error replicado; *señal-de-independencia*
  = adelantos mutuos suficientes (CA-15.1) **o** ≥ 1 discrepancia persistente;
  *indicio-espejo* = **sincronía** (cero exclusivos de las dos, N ≥ N_min, mitad
  temporal `completa`, cero adelantos en las dos direcciones) **o** adelantos en
  **una sola** dirección.
  1. `N < N_min` → **INCONCLUSO / `muestra_insuficiente`**.
  2. *fuerte-espejo* → **ESPEJO / `error_replicado`**, con
     `origen_comun_probado: true`. **Manda aunque concurra una
     señal-de-independencia**, y aquí el modo **se aparta a propósito del paso 2
     de la regla de SPEC-002 CA-10**: allí concurrían dos señales **fuertes** y
     una tenía que estar mal, así que INCONCLUSO era lo honesto; aquí la señal de
     independencia **no es concluyente por construcción** (§Diseño 2), así que no
     hay contradicción que resolver — hay una prueba y un indicio en contra.
  3. *señal-de-independencia* → **INCONCLUSO /
     `independencia_no_demostrable_sin_referencia`**.
  4. *indicio-espejo* → **ESPEJO** con `mirror_indication: true` y motivo
     `sin_contenido_propio` o `adelantos_en_una_sola_direccion` según cuál
     disparó.
  5. En otro caso → **INCONCLUSO / `sin_senal`**.
  **Test:** seis fixtures, uno por rama más el desempate de la 2 sobre la 3
  —error replicado **y** adelantos mutuos a la vez → ESPEJO, no INCONCLUSO—, cada
  uno asertando **primero** que las señales que dice tener están y superan su
  mínimo, para no dar el veredicto correcto por el motivo equivocado. Y
  comprobación por mutación de la rama 2 sobre la 3.
  *Por qué el orden 3 antes que 4:* un indicio **cede** ante una señal, igual que
  en SPEC-002. Adelantos en una sola dirección **más** una discrepancia
  persistente no es ESPEJO: es INCONCLUSO. Esto **cierra F-SPEC-002-21 para este
  modo** (ver *Notas para el gate*, §4).

- **CA-7 — El adelanto en una sola dirección no nombra espejo de nadie.**
  Dado un análisis con adelantos suficientes de C1 sobre C2 y ninguno en sentido
  contrario, entonces el veredicto es ESPEJO por **indicio**
  (`mirror_indication: true`) y **`espejo_de: null`**. En este modo `espejo_de`
  es `null` en **todos** los desenlaces.
  **Test:** el fixture (b) de `pair.test.ts` de SPEC-002 —C1 adelanta 4 veces,
  C2 nunca, que allí da `espejo_de: ceroacero`— corrido en este modo da ESPEJO
  con `espejo_de: null` y `mirror_indication: true`; y un test que falla si
  `espejo_de` es no nulo en cualquier informe de este modo.
  *Por qué:* nombrar a C1 como origen de C2 es una **atribución**, y la
  atribución es justo lo que este modo no puede hacer (CA-3). C2 rezagada es
  igual de compatible con «copia de C1» que con «las dos copian de O con
  retardos distintos». El veredicto ESPEJO se conserva —por CA-12 todo lo que no
  es independencia demostrada se trata como espejo— pero sin el nombre que el
  dato no sostiene.

### La ventana: cuatro pares, y ninguno invisible

- **CA-8 — El conjunto de pares se declara, y un par sin un solo tick es
  cobertura 0 %.**
  Dado que el registro de ventana declara los pares (fuente, competición) que la
  ventana **debía** cubrir, entonces la cobertura se computa **sobre ese conjunto
  declarado**: un par declarado con **cero intentos** tiene ratio 0 y, por CA-5
  de SPEC-002, invalida la ventana.
  **Test:** un registro que declara 4 pares y solo tiene ticks de 2 → ventana
  **inválida**, y el mensaje nombra los dos ausentes con `0.0 % (0/0)`; y el mismo
  registro **sin** el conjunto declarado (la conducta de hoy) sale válido, para
  que el test demuestre que arregla algo.
  *Por qué:* hoy `windowCoverage` deriva los pares de los ticks que existen, así
  que una fuente que **nunca se intentó** —un `targets` mal escrito, un
  `robots.txt` que no se cargó y dejó la fuente fuera— simplemente **no aparece**,
  y la ventana sale `valida` con el 100 % de los pares que sí corrieron. En la
  ventana de seis pares eso ya era un agujero; en una de **cuatro**, una fuente
  ausente es **la mitad del instrumento**, y el par que se analiza necesita a las
  dos por definición. Es exactamente la clase de fallo silencioso que CA-5 existe
  para impedir, entrando por la puerta que CA-5 no miraba.

- **CA-9 — La negativa de CA-5 se lee sobre los pares declarados, no sobre seis.**
  Dada una ventana inválida de este modo, entonces `InvalidWindowError` nombra
  **todos** los pares declarados —cuatro aquí— con su ratio, su marca `BELOW`/`ok`
  y el umbral exigido, y **no se escribe nada** en `hallazgos/`.
  **Test:** ventana de 4 pares con uno al 50 % → el mensaje nombra los cuatro y
  el umbral, y el CLI sale con error sin crear el directorio de hallazgos.
  *Por qué:* es la obligación de la enmienda 1 §6 de SPEC-002 (el operador tiene
  que ver la salud de la ventana entera), escrita sin la constante «seis» que la
  ataba a un modo.

- **CA-10 (RN-11) — Ninguna petición cambia de host en silencio.**
  Dado un objetivo cuya URL responde 3xx, cuando el capturador la pide, entonces
  **no sigue la redirección**: el tick se registra `failed` con un motivo que
  nombra el código, la URL pedida y el `Location`, y **no se archiva ni un byte**
  del destino. Como ninguna petición cambia de host, la URL sobre la que se
  comprobó `robots.txt` y la URL efectivamente descargada son **la misma por
  construcción**.
  **Test:** servidor local que responde 301 a otro origen → 0 capturas
  archivadas, 1 tick `failed` cuyo motivo lleva `301` y el `Location`; un
  servidor que responde 200 → tick `ok` archivado, sin regresión; y un test que
  falla si algún camino de salida construye una petición sin `redirect:
  'manual'`, hermano del caso 8 de `robots.test.ts` que ya exige puerta única.
  **Regresión obligatoria:** la suite de captura de SPEC-002 sigue verde sin
  cambiar una sola expectativa.
  *Por qué aquí y no como follow-up abierto:* es **F-SPEC-002-22**, y este modo lo
  vuelve inmediato. `resultados-futbol.com` hace **301 entero a `besoccer.es`**,
  así que el par de este modo apunta hoy a un host que se alcanza por
  redirección. Hoy el capturador pediría permiso a un `robots.txt` y descargaría
  de **otro**, archivando HTML de besoccer bajo el `SourceId` equivocado:
  **incumple RN-11 sin que ningún test se ponga rojo** y contamina el único
  artefacto que sobrevive al spike. El runbook lo esquiva pidiendo al operador que
  apunte al host final (ADR-008 §2 lo convierte además en el nombre correcto),
  pero una convención de operador que ningún test sostiene es exactamente la
  puerta por la que entra la confianza falsa que esta familia de specs existe para
  cerrar. **Un 3xx es un fallo, no un rescate:** que la fuente se haya mudado es
  un hecho que el operador tiene que ver, no algo que el capturador deba resolver
  por su cuenta.

### Decir lo que no se sabe

- **CA-11 — El informe declara qué preguntas NO responde, en JSON y en prosa.**
  Dado **cualquier** informe de este modo —también el de veredicto más rotundo—
  entonces lleva un bloque `limitaciones_declaradas` con, al menos, estas cinco
  afirmaciones, y la prosa (SPEC-002 CA-13) las repite en castellano corrido:
  1. **No se ha medido si alguna candidata es espejo de futgal.** Futgal no se
     capturó: su `robots.txt` lo prohíbe (RN-11).
  2. **Un origen común probado queda sin atribuir** (CA-3): se sabe que lo hay,
     no de quién.
  3. **Este modo no puede emitir INDEPENDIENTE** (CA-4), así que la ausencia de
     ese veredicto **no es evidencia de dependencia**.
  4. **La métrica de conflictos de EPIC-001 no se puede leer sobre esta ventana**,
     ni siquiera con la advertencia de SPEC-002 CA-13: su denominador ya no
     incluye la fuente oficial. Es un enunciado más fuerte que aquella advertencia
     y la incluye.
  5. **Latencia, cobertura y operación de EPIC-001 no se miden aquí.** Cobertura,
     en particular, no tiene contra qué medirse: no hay calendario oficial
     capturado.
  **Test:** las cinco afirmaciones están en el JSON y en la prosa de un informe de
  cada uno de los cinco motivos de CA-6, incluido el ESPEJO por error replicado;
  el test falla si el bloque está vacío o si alguna afirmación desaparece.
  *Por qué:* la prosa y el JSON son lo que alguien leerá dentro de seis meses sin
  este contexto. Escribirlo en el ledger no basta: el ledger no viaja con el
  fichero.

- **CA-12 — La advertencia de la métrica de conflictos es incondicional aquí.**
  Dado cualquier informe de este modo, entonces `conflict_metric_warning` está
  **siempre** presente con `hard_cut_15_percent_applies: false` y con un texto
  propio del modo: no es que ninguna candidata haya salido INDEPENDIENTE, es que
  **ninguna se ha medido contra la fuente oficial**.
  **Test:** la advertencia aparece en los informes de los dos veredictos y de los
  cinco motivos; su texto **no** es el `CONFLICT_METRIC_WARNING_TEXT` de
  SPEC-002, y un test lo comprueba.
  *Por qué:* en SPEC-002 la advertencia era condicional porque había un escenario
  en que la métrica sí medía lo que dice. Aquí no lo hay. Una advertencia
  condicional cuya condición es siempre verdadera es una advertencia que alguien
  acabará creyendo que a veces no aplica.

- **CA-13 — El hallazgo tiene fichero propio y no puede pisar el de SPEC-002.**
  Dado el generador de este modo, entonces escribe
  `docs/epicas/EPIC-001-spike-ingesta/hallazgos/test-de-espejo-sin-referencia.{md,json}`
  y **no toca** `test-de-espejo.{md,json}`, que es de SPEC-002. Corriendo los dos
  modos quedan cuatro ficheros, y cada uno dice en su primera línea qué modo lo
  produjo.
  **Test:** el generador escribe exactamente esos dos ficheros; un test que crea
  antes los de SPEC-002 comprueba que siguen intactos byte a byte; y el `.md` y el
  `.json` llevan el modo.
  *Por qué:* dos informes con el mismo nombre y preguntas distintas es la peor
  forma de perder una medición irrepetible.

- **CA-14 — Lo heredado se hereda de verdad, y se prueba.**
  Dado este modo, entonces siguen valiendo **sin reinterpretación** los CA-1 a
  CA-4, CA-6, CA-7, CA-8, CA-10.4 y CA-14 de SPEC-002 —ritmo de RN-11, cortesía,
  archivar sin parsear, el archivo como línea de tiempo, emparejamiento manual,
  determinismo, τ, el contador de grafía sin voto y la cita de cada afirmación—.
  **Test:** el informe de este modo es **byte a byte idéntico** en dos ejecuciones
  y con las claves barajadas; **todas** las claves raw citadas resuelven con
  `store.get()`, incluidas las de las divergencias de grafía; y la suite entera de
  SPEC-002 (46 ficheros / 415 casos, de los cuales 145 suyos) **sigue verde sin
  cambiar una sola expectativa**, que es la única forma de demostrar que este modo
  se añadió y no reescribió el otro.

## Entidades y reglas afectadas

Fuentes de verdad, **referenciadas y no duplicadas**:

- `docs/fundacion/reglas.md` — **RN-02** (la precondición que se mide y, sin
  futgal, la única ruta automática a *confirmado*), **RN-01** (pesos: las dos
  candidatas a 0.7; futgal conserva 1.0 aunque no se capture), **RN-10** (raw
  antes de parsear), **RN-11** (robots.txt, user-agent, 1 petición/minuto por par;
  y CA-10, que cierra el hueco de las redirecciones), **RN-09** (el
  emparejamiento manual heredado de SPEC-002 CA-6).
- `docs/fundacion/dominio.md` — *espejo*, *independiente*, *inconcluso*,
  `RawStore`, `raw_ref`, estados del partido. **Dos términos faltan y hay que
  añadirlos si se aprueba**: *origen común* y *atribución de origen* (ver *Notas
  para el gate*, §6).
- **SPEC-002** — el instrumento entero. Esta spec **no la reabre, no la enmienda y
  no la contradice**: añade un modo y hereda el resto (CA-14).
- **ADR-008** (este cambio) — qué se puede capturar y cómo se llama cada fuente.
  Supersede parcialmente a **ADR-002**.
- **ADR-005** — el `RawStore` como puerto. **Su retención sigue sin definir y aquí
  es precondición, no deuda** (ADR-008, *Negativas*).
- **ADR-006** — instantes ISO 8601 UTC como cadena.
- **ADR-004** — sin scheduler en proceso ni disco persistente.

**Modelo canónico: no se toca.** Ni `src/model/`, ni `migrations/`, ni SPEC-001.
`SourceId` es una cadena marcada y no un enum, así que llamar `besoccer` a la
segunda candidata es **dato, no código**. El esquema del informe sigue siendo
**local a la spec**: no cruza al frontend.

**Persistencia:** ninguna. Como en SPEC-002, la fase B lee del `RawStore` y
escribe un fichero.

## Fuera de alcance

Aparcado a propósito, no por descuido:

- **Correr SPEC-002.** Sigue `hecho` y ejecutable el día que futgal sea
  capturable. Esta spec no la deroga.
- **Reanalizar esta ventana con referencia más adelante.** No se puede: los bytes
  de futgal no estarán en este archivo. Son dos ventanas distintas, y conviene
  decirlo antes de que alguien lo intente.
- **Rescatar las otras tres métricas de EPIC-001.** Latencia, cobertura y
  operación quedan sin medir por esta ventana. Es de `sdd-producto` (ADR-008).
- **El plazo de retención del raw store.** Precondición para correr, decidida
  fuera: toca ADR-005 y SPEC-001 (F-SPEC-001-1), no la lista de fuentes.
- **F-SPEC-002-16** (CA-5 invalida la ventana entera por un solo par),
  **F-SPEC-002-17** (mínimo de Node), **F-SPEC-002-18** (`src/raw/` no ejecutable
  por Node) y **F-SPEC-002-19** (umbral de la divergencia de grafía). Motivos en
  *Notas para el gate*, §4.
- **F-SPEC-002-21 para el modo con referencia.** Se resuelve **solo aquí**
  (CA-6, CA-7). En SPEC-002 sigue abierto, y a propósito.
- **El catálogo de alias de RN-09**, **el motor de decisiones** y **los
  adaptadores completos**. Igual que en SPEC-002.
- **Buscar una tercera fuente automática.** Necesita dictamen legal y adaptador
  propios, y no desbloquea nada hoy (ADR-008, *Alternativas*).

## Notas para el gate humano

**§1. BLOQUEANTE, y es lo primero: sin `besoccer.es` no hay nada que correr.**
El dictamen de `sdd-legal-datos` marca `besoccer.es` **DUDOSO**: su `robots.txt`
permite, pero su página legal prohíbe «registrar por ningún sistema de
recuperación de información», y guardar la respuesta cruda (**RN-10**) es
exactamente eso. Son condiciones *browse-wrap* y su oponibilidad está discutida;
el dictamen no se apoya en eso para dar un correcto y pide **revisión
profesional**. **La decisión es tuya y va en ADR-008 §5.** Si es que no, esta spec
**no se implementa**: con una sola candidata no hay cruce, y no hay tercera
opción disponible hoy. **Prefiero decirlo aquí arriba que dejarte descubrirlo al
final del párrafo.**

**§2. DECLARACIÓN, load-bearing — este modo nunca dirá que sí.** El dominio de
veredictos es {ESPEJO, INCONCLUSO} y la bandera de RN-02 es `false` en todos los
desenlaces (CA-4, CA-5). El motivo entero está en el *Diseño §2*: **un espejo sí
puede adelantar a otro espejo**; lo que no puede es adelantar a **su** origen. Con
futgal presente, los dos veredictos por candidata tapaban ese hueco; sin ella, el
adelanto mutuo queda solo y es compatible con dos hermanas de un origen que no
hemos mirado. **Aprobar esta spec es aprobar esa lectura**, y con ella que el
resultado más favorable posible de la ventana sea «no se pudo demostrar
independencia». **Si prefieres que el adelanto mutuo siga dictando
INDEPENDIENTE**, dilo aquí y asume que la spec del motor podría abrir la segunda
vía de RN-02 sobre una independencia que este instrumento no distingue de dos
espejos con refresco irregular. Eso es la confianza falsa del §Problema.

**§3. Lo que sí compra la ventana, para que la decisión no sea a ciegas.** Un
ESPEJO **cierra** la segunda vía de RN-02 con evidencia y de forma definitiva: la
spec del motor puede comprometerse en vez de aplazar, y ese es el desenlace más
probable con dos agregadores del mismo fútbol regional. Cualquier otro desenlace
deja el motor con una sola vía, que es lo que habría que hacer igualmente
mientras no haya prueba. **El modo no puede empeorar la posición del motor y en
una rama la cierra.** Además estrena el instrumento contra HTML real —extractores,
emparejamiento, alias— antes de la ventana con referencia, si alguna vez la hay.

**§4. Qué hago con los cuatro follow-ups que me estaban destinados.**

- **F-SPEC-002-22 (redirecciones y robots sobre la URL final) — ENTRA**, como
  **CA-10**. Es lo más urgente de los cuatro: `resultados-futbol.com` hace 301
  entero a `besoccer.es`, o sea que el par de este modo apunta hoy a un host que
  se alcanza por redirección, y hoy eso **incumple RN-11 sin que ningún test se
  ponga rojo** y archiva bytes bajo el `SourceId` equivocado. El runbook lo
  esquiva pidiéndoselo al operador; una convención que ningún test sostiene no es
  una defensa.
- **F-SPEC-002-21 (el adelanto en una sola dirección como señal *fuerte* de
  espejo) — ENTRA, y solo para este modo**, en **CA-6** (pasa a **indicio**, y por
  tanto cede ante una señal de independencia) y **CA-7** (`espejo_de: null`
  siempre: nombrar origen es una atribución que este modo no puede hacer). **No lo
  cierro para el modo con referencia**: allí la atribución tiene corroboración —si
  C2 se rezaga de C1 y C1 adelanta a futgal, «C2 espejo de C1» gana apoyo— y
  cambiar la semántica de un veredicto de SPEC-002 invalidaría el GREEN de su
  PR #2, que espera merge. Sigue abierto allí, con su destino intacto.
- **F-SPEC-002-16 (CA-5 invalida la ventana entera por un solo par) — NO ENTRA.**
  Su disparador declarado era «si la primera ventana real se cae por un solo
  sitio», y **sigue sin haberse corrido ninguna ventana real**: no hay cifra de
  cuántas veces muerde y el corte total es el conservador. Y aquí el argumento
  para relajarlo es **más débil**, no más fuerte: los cuatro pares alimentan un
  **único** análisis, así que una caída no deja ningún cruce limpio; a lo sumo
  deja una competición, y con una sola competición la muestra caería
  previsiblemente por debajo de N_min y el veredicto sería INCONCLUSO igualmente
  —o sea, el mismo desenlace por un camino más largo—. **Lo que sí cambia y dejo
  anotado:** con cuatro pares en vez de seis, una caída de un solo sitio cuesta
  ahora **la mitad** del instrumento y no un tercio. Destino sin cambios.
- **F-SPEC-002-19 (CA-10.4 no declara umbral de persistencia para la grafía) — NO
  ENTRA, y le cambio el destino.** No muerde aquí: la señal no vota en ninguno de
  los dos modos, así que el riesgo es de **subregistro** y nunca de veredicto. Y
  decidirlo bien exige saber qué necesita su consumidor real, que es el **catálogo
  de alias de RN-09** y todavía no tiene spec. **Destino nuevo: la spec del
  catálogo de alias.** Dejo anotado que este modo lo agrava en un sentido que
  merece mirarse allí: sin futgal no hay **grafía canónica** contra la que anclar
  el catálogo, solo dos agregadores discrepando entre sí.

**§5. Lo que hereda sin discutirse, para que conste que no se ha reabierto.** τ =
90 s, N_min = 10, los mínimos de adelanto de CA-15.1, las 3 capturas de
persistencia, el 90 % de ticks de CA-5, la lectura de RN-11 por fuente y
competición, y la grafía sin voto de CA-10.4. **Los cinco umbrales siguen siendo
hipótesis instrumentadas** y viajan en el informe (SPEC-002 §5): un umbral mal
elegido se ve en los datos y se recalcula **sin volver a capturar**.

**§6. Si apruebas, dos términos entran en `dominio.md`.** No los he añadido: el
glosario no debe adelantarse a lo que el gate no ha firmado.
- **origen común** — relación entre dos fuentes que derivan de una tercera en
  lugar de observar el hecho. **No exige saber cuál es la tercera.** Es lo que
  este modo puede probar.
- **atribución de origen** — identificar cuál es esa tercera fuente. **Exige
  observarla**, y es lo que este modo no puede hacer. Confundir las dos es
  exactamente el fallo del §Problema.
Y conviene revisar la ficha de **resultados-futbol.com** en `dominio.md`: ADR-008
§2 dice que hoy es una redirección y que la fuente es `besoccer.es`. No la toco:
es un documento de verdad y el cambio cuelga de la firma de ADR-008.

**§7. Lo que este cambio invalida y no arreglo yo.**
`docs/procedimientos/ventana-de-observacion-espejo.md` está escrito para la
ventana de **seis** pares con referencia: su paso 0.1 declara el bloqueo de futgal
como sin resolver, su paso 0.3 pide al operador esquivar el 301 a mano, sus
`targets` son seis, promete «tres veredictos» y su tabla de problemas nombra «la
cobertura de los seis pares». **Con esta spec aprobada, todo eso necesita una
segunda entrada de runbook para el modo sin referencia** —y el paso 0.3 se puede
borrar, porque CA-10 lo convierte en conducta probada. **No lo edito**: es de
`sdd-documentalista`. Lo señalo.

**§8. Lo que hay que firmar, exactamente.**
1. **ADR-008 entero**, y muy en particular su **§5**: capturar `besoccer.es`
   aceptando el riesgo *browse-wrap* de su cláusula legal contra RN-10, con los
   cuatro límites que lleva. **Sin esto, nada de lo demás importa.**
2. **SPEC-003**, y con ella la declaración del **§2 de estas notas**: este modo
   nunca emite INDEPENDIENTE y la bandera de RN-02 es siempre `false`.
3. **Que F-SPEC-002-22 y F-SPEC-002-21 entran aquí** (CA-10, CA-6, CA-7) y que
   **F-SPEC-002-16 y F-SPEC-002-19 se quedan fuera** con los motivos del §4.
4. **La precondición de retención del raw store** (ADR-008, *Negativas*): fijar
   un plazo **antes** de correr la ventana, por RGPD y por el art. 4 de la
   Directiva TDM. No es follow-up.
5. **Que las otras tres métricas de EPIC-001 no se rescatan con esta ventana**, y
   que eso va a `sdd-producto` antes de dar la épica por medible.

**Lo que NO firmas aquí:** ninguna reapertura de SPEC-002 —sigue `hecho`, su
PR #2 intacto y su GREEN válido—, ningún cambio en `src/model/`, ninguna
migración, y ninguna edición de ADR-002, `_epica.md`, `roadmap.md` ni el runbook.

**Y el estado sigue `borrador`.** Un rol `sdd-*` no firma su propia spec.
