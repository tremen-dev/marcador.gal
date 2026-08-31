---
id: SPEC-002
tipo: spec
epica: EPIC-001
estado: hecho
aprobada-por: Alberto Fojo
historial:
  - {estado: borrador, fecha: 2026-08-31, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-08-31, por: Alberto Fojo}
  - {estado: en-progreso, fecha: 2026-08-31, por: sdd-implementador}
  - {estado: en-revision, fecha: 2026-08-31, por: sdd-implementador}
  - {estado: en-progreso, fecha: 2026-08-31, por: sdd-verificador}
  - {estado: en-revision, fecha: 2026-08-31, por: sdd-implementador}
  - {estado: en-progreso, fecha: 2026-08-31, por: sdd-verificador}
  - {estado: en-revision, fecha: 2026-08-31, por: sdd-implementador}
  - {estado: hecho, fecha: 2026-08-31, por: sdd-verificador}
---
# SPEC-002 — Test de espejo entre fuentes automáticas

## Problema

**RN-02 tiene una precondición que nadie ha medido.** Su segunda vía —«dos
fuentes **independientes** con peso ≥ 0.7 coinciden»— es la única forma de
publicar *confirmado* sin una fuente de peso ≥ 0.9. En el spike, las fuentes de
0.7 son ceroacero.es y resultados-futbol.com. Si las dos beben de futgal.es, esa
vía no existe: coincidirían siempre, y la coincidencia no valdría nada.

Las consecuencias no son de matiz, y ya están escritas:

- **ADR-002** hace de esto un entregable con fecha propia: «si ceroacero y
  BeSoccer resultan ser espejos de futgal, hay **una sola fuente automática
  independiente** y RN-02 no es aplicable: el motor se diseña sabiéndolo, no se
  descubre el lunes siguiente».
- **`_epica.md`** lo lista entre los riesgos: «todas las fuentes automáticas
  resultan espejos de futgal. RN-02 deja de ser aplicable y casi todo se publica
  provisional».
- La **métrica de conflictos** —una de las cuatro que deciden el proyecto, y la
  que tiene corte duro en 15 %— mide desacuerdo entre fuentes. Entre espejos no
  hay desacuerdo posible: la cifra saldría bonita y no significaría nada.

El daño de no medirlo no es un motor mal hecho: es un motor bien hecho sobre una
hipótesis falsa, y cuatro cifras que no se pueden defender delante de la RFGF.

**Y hay un daño simétrico, que es el que gobierna el diseño de esta spec:**
tratar como independientes a dos espejos publica *confirmado* un marcador que
tiene un solo origen. Eso es confianza falsa, y es la misma falta que el gate
del 2026-08-29 rechazó en CA-19 bajo el nombre de trazabilidad falsa. Un
marcador *provisional* que resulta ser correcto cuesta poco (RN-03: «mejor
provisional a tiempo»). Un *confirmado* que resulta ser un rumor repetido cuesta
el proyecto.

## Usuarios / roles afectados

- **sdd-arquitecto**, como autor de la spec del motor: es quien consume el
  veredicto. Sin él no puede decidir si RN-02 tiene dos vías o una.
- **El operador del spike** (el autor, RN-01): ejecuta la ventana de observación
  y escribe el emparejamiento de partidos.
- **sdd-verificador**: comprueba los CA contra el archivo guardado y contra
  fixtures, no contra la ventana en vivo, que es irrepetible.
- **sdd-legal-datos**, consultivo: la ventana es scraping de tres sitios a la vez
  (RN-11, ToS de ceroacero y resultados-futbol.com).

## Diseño: por qué dos fases, dos mitades y un test de una sola dirección

Cuatro decisiones de forma gobiernan todos los CA. Van aquí y no en cada criterio
para no repetirlas.

### 1. Capturar en vivo, analizar en frío

La ventana de observación es **irrepetible**: un minuto no capturado no se
recupera. El análisis, en cambio, se puede rehacer mil veces. Por eso se parten:

- **Fase A — captura.** Golpea las tres fuentes cada minuto y escribe la
  respuesta cruda en el `RawStore` de SPEC-001. **No parsea nada.**
- **Fase B — análisis.** Lee del archivo, extrae, cruza y dicta veredicto.
  Repetible, sin prisa y sin red.

Esto es exactamente para lo que existe RN-10, y lo dice el documento fuente: el
raw store «es la pieza que hace que el spike siga valiendo dentro de un año». La
consecuencia práctica es la que importa: **un parser equivocado el día de la
ventana no cuesta la ventana**, solo cuesta volver a correr la fase B. Y libera
a esta spec de depender de las specs de adaptadores, que aún no existen.

Nota para el implementador: en la fase B, parsear desde el archivo **no salta
RN-10**. Los bytes se archivaron antes, por construcción. `captureThenParse` es
el camino del online; el replay lee con `store.get()` y parsea, y el `raw_ref`
ya existe.

### 2. El test temporal solo puede probar independencia, nunca espejo

Es el hallazgo que ordena todo lo demás.

**Un espejo no puede ir por delante de su origen.** Si ceroacero publica un gol
*antes* que futgal, no lo copió de futgal: es independiente. Eso es una prueba
sólida, y no depende de umbrales estadísticos.

**Lo contrario no se sostiene.** Una fuente independiente pero más lenta que
futgal produce exactamente la misma señal que un espejo: nunca adelanta. Con
solo tiempos, «espejo» y «lento» son indistinguibles. Declararlo espejo por no
adelantar sería inventar.

A eso se suma un límite físico que **RN-11 impone y esta spec no puede sortear**:
a 1 petición/minuto por fuente y competición, la resolución del instrumento es de
un minuto. Dos fuentes que cambian con 40 s de diferencia caen en el mismo tick y
se ven simultáneas. **Un espejo con retardo de propagación inferior a un minuto
es, para este instrumento, invisible.** No es un defecto del diseño: es el precio
de RN-11, que es regla dura y no se negocia por una medición.

De ahí la asimetría de los veredictos:

| Señal | Qué prueba | Fuerza | Necesita partidos en vivo |
|---|---|---|---|
| S adelanta a futgal | **INDEPENDIENTE** | Sólida. Un espejo no puede. | Sí |
| S y F discrepan de forma **persistente** (un horario, un resultado, un partido que solo una tiene, y no converge) | **INDEPENDIENTE** | Sólida. Un espejo converge; una discrepancia que dura horas es dato propio. | No |
| S replica un error **transitorio** de F y su corrección | **ESPEJO** | Sólida. Dos fuentes independientes no se equivocan igual y se corrigen igual. | En la práctica sí: los errores se cometen y se corrigen durante los partidos |
| S nunca adelanta | Nada por sí solo | Compatible con espejo **y** con independiente-lento. | — |
| S no tiene nada que F no tenga | Indicio de espejo | Débil solo; fuerte junto a lo anterior. | No |
| S y F escriben distinto el nombre del equipo | **Nada, ni en un sentido ni en el otro** | Nula. Un agregador copia el marcador y **rinde el nombre desde su propia base de equipos**, así que la señal dispara igual con espejo que con independencia. Se registra por CA-10.4; no dicta. *(enmienda 2026-08-31 §1)* | No |

Y por eso existe un tercer veredicto, INCONCLUSO, que no es un fallo del test
sino su resultado honesto cuando la ventana no dio para más.

### 3. El techo de RN-11 se lee **por fuente y competición**

Lectura declarada, y **load-bearing**: «máximo 1 petición/minuto por competición»
(RN-11) significa **1 petición/minuto por cada par (fuente, competición)** —3
fuentes × 2 competiciones = 6 peticiones/minuto en total—, no un tope global
repartido entre sitios distintos.

Razón: RN-11 se titula «scraping cortés» y sus otras dos obligaciones
—robots.txt y user-agent identificado— son deberes hacia **cada sitio**. Un tope
compartido entre sitios ajenos no protege a ninguno de ellos.

Por qué es load-bearing y no una minucia: con el tope global habría que repartir
el minuto entre las tres fuentes, cada una se muestrearía una vez cada 3 minutos,
y la resolución del instrumento pasaría de 1 a 3 minutos. **El test temporal
dejaría de medir nada** y esta spec tendría otra forma. Aprobar la spec es
aprobar esta lectura; si el gate lee RN-11 al revés, hay que rehacerla.

### 4. Dos mitades: contenido el día 2, tiempo en la primera ventana en vivo

ADR-002 encarga «una hora de observación el **día 2** … en una tanda de partidos
**en juego**». Las dos competiciones del spike se juegan en fin de semana, así que
esa premisa puede no darse en el día 2 del plan. **Arbitraje del gate del
2026-08-31: el test se parte en dos**, y esto es el plan de la spec, no una
alternativa abierta.

| Mitad | Cuándo | Qué mide | CA |
|---|---|---|---|
| **Contenido** | **Día 2**, sin partidos en vivo | Estado en reposo de las tres fuentes: qué partidos existen, resultados de la jornada anterior, horarios. Discrepancias persistentes y contenido exclusivo. Las grafías de equipo se **registran** y no dictan (CA-10.4). | CA-1..CA-7, CA-10, CA-11, CA-12, CA-13, CA-14, CA-15 |
| **Tiempo** | Primera ventana con partidos en vivo | Quién publica antes cada cambio de valor. | CA-8, CA-9, y la mitad temporal de CA-15 |

**Por qué el día 2 siempre basta para arrancar el motor.** No es que la mitad de
contenido resuelva siempre la pregunta —no lo hace—, sino que **la decisión del
motor es binaria y su valor por defecto es seguro**:

- Si el día 2 encuentra discrepancias persistentes → **INDEPENDIENTE**, firme y
  definitivo para esa fuente. La pregunta queda cerrada sin esperar a la jornada.
- Si no las encuentra → INCONCLUSO, que por CA-12 se trata como espejo, y el
  motor se diseña con **una sola vía en RN-02**. Que es lo que habría que hacer
  de todas formas mientras no haya prueba.

La mitad temporal, por tanto, **solo puede mejorar el veredicto, nunca empeorarlo**:
llega a tiempo de ampliar lo que el motor puede hacer y nunca obliga a rehacer lo
que ya se hizo. El motor no espera a la jornada en ningún escenario.

**Un veredicto parcial es un estado legítimo del informe, no un informe a medias.**
El informe del día 2 se emite completo, con la mitad temporal marcada como
`pendiente` y con la fecha de la ventana en vivo que la cerrará (CA-13). Cabe
dentro de ADR-002 sin superseder nada: se conserva su entregable con fecha propia
y se declara con honestidad qué mitad puede cumplirse cuándo.

## Criterios de aceptación

Convenciones que usan varios CA:

- **F** = futgal.es (fuente oficial, RN-01 peso 1.0). **S** = fuente candidata:
  ceroacero.es o resultados-futbol.com (peso 0.7).
- **Valor** de un partido en un instante = la terna `(status, home_score, away_score)`.
- **`first_seen(s, m, v)`** = el `fetched_at` más temprano del archivo en que la
  fuente `s` reporta el valor `v` para el partido `m`. Indefinido si nunca lo
  reporta.
- **Evento** = un `(m, v)` que **alguna** fuente llegó a reportar.
- **Tolerancia τ = 90 s.** Justificación en CA-8; es hipótesis, no verdad.

### Fase A — captura

- **CA-1 (RN-11) — Ni una petición de más.**
  Dado el capturador corriendo sobre un reloj falso durante una hora simulada,
  cuando se le pide capturar 3 fuentes × 2 competiciones, entonces emite **como
  máximo 1 petición por minuto por cada par (fuente, competición)** y nunca dos
  al mismo par dentro de la misma ventana de 60 s.
  **Test:** un `FakeClock` y un `fetch` espía; el test cuenta peticiones por par
  y falla si algún par supera 60 en la hora, o si dos peticiones del mismo par
  distan < 60 s. **Interpretación declarada** (ver *Notas para el gate*, §1): el
  tope de RN-11 es **por fuente y competición**, no un tope global compartido
  entre fuentes distintas.

- **CA-2 (RN-11) — Cortesía comprobable, no prometida.**
  Dado un `robots.txt` de fixture que prohíbe una ruta, cuando el capturador va a
  pedir esa ruta, entonces **no la pide** y lo registra como tick omitido con
  motivo. Y toda petición que sí sale lleva la cabecera `User-Agent` declarada
  del proyecto, con forma identificable y de contacto.
  **Test:** dos casos —ruta prohibida (0 peticiones, 1 omisión registrada) y ruta
  permitida (1 petición, con la UA exacta)—; y un test que falla si algún camino
  de salida construye una petición sin UA.

- **CA-3 (RN-10, D-5) — La fase A archiva y no parsea.**
  Dado un `RawStore` que falla en `put`, cuando el capturador procesa un tick,
  entonces **no se parsea nada** y el tick se registra como fallido.
  **Test:** un store que lanza en `put` y un parser espía; el espía no se llama
  **ni una vez**. Y un test de estructura: el módulo de captura no importa nada
  del módulo de extracción de la fase B.

- **CA-4 (ADR-005, ADR-006) — El archivo es la línea de tiempo.**
  Dada una tanda de capturas, entonces cada una se archiva con la clave de
  `rawKey()` de SPEC-001 —`<source>/<competition_id>/<día>/<fetched_at>-<sha>.html`—
  con `fetched_at` en **ISO 8601 UTC como cadena, nunca `Date`**, y
  `store.list('<source>/<competition_id>/<día>/')` devuelve las capturas de esa
  fuente y competición **ordenables cronológicamente por su propia clave**.
  **Test:** contra `DiskRawStore`, se archivan capturas con instantes
  desordenados y el test comprueba que ordenar las claves como cadenas reproduce
  el orden temporal. Sin entidades nuevas: reutiliza `src/raw/` tal cual.

- **CA-5 — Una ventana a medias no produce veredicto.**
  Dada la ventana, entonces el capturador registra por cada par
  (fuente, competición) los ticks **exitosos, fallidos y omitidos**, y si algún
  par baja del **90 % de ticks exitosos** la ventana se marca `invalida` y la
  fase B **se niega a dictar veredicto** sobre ella.
  **Test:** tres casos sobre un registro de ventana de fixture —95 % (válida),
  85 % (inválida), y una fuente al 100 % con otra al 50 % (inválida)—; el tercero
  es el que importa, porque una fuente bien capturada y otra mal capturada
  fabrican adelantos que no existen.
  *Por qué:* si a ceroacero se le cayeron 20 minutos, futgal «adelanta» en todos
  los eventos de esos 20 minutos. Sin este criterio, una caída de red se lee como
  prueba de espejo.
  **Qué significa «se niega», precisado por la enmienda 2026-08-31 §6:** se niega
  de verdad. La fase B **aborta con `InvalidWindowError` y no escribe informe**;
  no emite un informe con veredictos INCONCLUSO. **No es simetría rota con
  CA-11, es la distinción que importa:** CA-11 habla del **mundo** —la ventana
  fue buena y el fútbol estuvo tranquilo—, y ahí «N = 9 < 10» es el hallazgo y la
  respuesta es ampliar la ventana. CA-5 habla del **instrumento**: nuestra
  captura falló, el dato está contaminado justo en la dirección peligrosa (un
  hueco fabrica adelantos, y los adelantos son lo que se lee como independencia)
  y **ninguna afirmación sobre las fuentes está justificada**. Un informe bien
  formado sobre una ventana rota es indistinguible en el fichero de uno legítimo:
  quien escriba la spec del motor lee `hallazgos/test-de-espejo.json`, y si una
  ventana rota puede producir ese fichero, el motor puede nacer sobre una
  no-medición. La ausencia del fichero, en cambio, no se malinterpreta.
  **Pero la negativa no puede ser muda:** el error lleva la **cobertura de los
  seis pares**, no solo la de los que bajaron del umbral, más el umbral exigido,
  para que el operador vea de un vistazo la salud de la ventana entera y sepa
  qué repetir.
  **Test añadido:** el mensaje del error nombra los pares **por debajo y por
  encima** del umbral con su ratio, y sobre una ventana inválida no se crea
  ningún fichero en `hallazgos/`.

### Fase B — identidad de los partidos

- **CA-6 (RN-09) — El cruce se declara a mano y no se adivina nunca.**
  Dado un fichero de emparejamiento que asocia, **solo para los partidos de la
  ventana**, el identificador de cada partido en cada fuente con un `MatchId`
  canónico, cuando la fase B encuentra en el archivo un partido que el fichero no
  mapea, entonces **aborta con un error con nombre** que lo identifica, y no lo
  empareja por parecido de cadenas.
  **Test:** un fixture con un partido no mapeado hace fallar el análisis con
  `UnmappedMatchError` y el nombre del partido en el mensaje; y un fixture con
  dos equipos de nombre parecido («UD Ourense» / «Ourense CF», el ejemplo de
  `dominio.md`) **no** los une.
  *Alcance y RN-09:* esto es **medición, no publicación**, así que no requiere el
  catálogo de alias completo de los 36 equipos ni sustituye a RN-09; son los 8-16
  partidos de la ventana, escritos por una persona. Un emparejamiento adivinado
  contamina el veredicto en la dirección peligrosa: dos partidos mal unidos
  parecen desacuerdo, y el desacuerdo es lo que se lee como independencia.

### Fase B — análisis y veredicto

- **CA-7 — El análisis es una función del archivo, y nada más.**
  Dado el mismo conjunto de capturas archivadas, cuando se ejecuta la fase B dos
  veces, entonces produce un informe **byte a byte idéntico**, sin depender del
  reloj, del orden de listado del store ni de la red.
  **Test:** doble ejecución sobre un fixture y comparación exacta del JSON;
  además, una ejecución con las claves barajadas produce el mismo resultado.
  *Por qué:* es lo que permite a `sdd-verificador` comprobar el veredicto de una
  ventana que él no presenció.

- **CA-8 — Adelanto, retraso y empate, con la tolerancia declarada.**
  Dados los `first_seen` de F y S para un evento, entonces se clasifica como
  **adelanto de S** si `first_seen(F) − first_seen(S) > τ`, **retraso** si
  `first_seen(S) − first_seen(F) > τ`, y **empate** en otro caso, con **τ = 90 s**.
  **Test:** tabla de casos en los límites —89 s, 90 s, 91 s, en los dos
  sentidos— y un caso con `first_seen` indefinido en una de las dos.
  **τ es hipótesis medible, no verdad.** Se fija en 90 s porque a 1 captura/minuto
  (RN-11) dos fuentes no sincronizadas pueden verse separadas hasta 60 s solo por
  la fase de sus muestreos, y 30 s más absorben latencia de red y jitter del
  cron. **El informe registra τ y el reparto de diferencias observadas**, para que
  un τ mal elegido se vea en los datos y se pueda recalcular sin volver a capturar.

- **CA-9 — Un adelanto prueba independencia; la ausencia de adelantos no prueba nada.**
  *(Reescrita su primera frase por la enmienda 2026-08-31 §3. Ver Historial de
  enmiendas.)*
  Dado el análisis de S contra F, entonces **la señal temporal** dicta
  **INDEPENDIENTE** si y solo si S adelanta a F en **≥ 2 eventos de ≥ 2 partidos
  distintos**; y una S que no adelanta nunca **no puede** ser dictada ESPEJO por
  esa sola razón.
  El «si y solo si» acota **esta señal**, no el veredicto entero: el otro camino
  a INDEPENDIENTE es la discrepancia persistente de CA-10.2, y **no hay más que
  esos dos** (tabla del *Diseño §2*, cuyas dos primeras filas prueban
  INDEPENDIENTE). La combinación de los caminos, y qué pasa cuando concurren con
  una señal de espejo, está en la **regla de decisión de CA-10**, que es donde
  manda y es total.
  **Test:** tres fixtures. (a) S adelanta 2 veces en 2 partidos → INDEPENDIENTE.
  (b) S adelanta 2 veces en **el mismo** partido → no INDEPENDIENTE (un partido
  mal parseado no basta). (c) **S siempre 5 min por detrás de F, sin ningún error
  replicado → NO es ESPEJO**, es INCONCLUSO. El caso (c) es el corazón del
  criterio y no puede faltar.
  *Umbral declarado:* 2 y 2. Lógicamente basta 1 —un espejo no puede adelantar—,
  pero un adelanto único es indistinguible de un fallo de parseo puntual; exigir
  dos partidos distintos compra robustez frente a un extractor roto en un partido.

- **CA-10 (mitad de contenido, día 2) — Las señales que no dependen del reloj.**
  *(Reescritos 10.1, 10.2 y la regla de decisión, y añadido 10.4, por la enmienda
  2026-08-31 §§1, 2, 4 y 5. Ver Historial de enmiendas.)*
  Dado el análisis, entonces se computan y registran **cuatro** señales de
  contenido, todas verificables sobre datos en reposo. Tres dictan; la cuarta se
  registra y no dicta.
  1. **Error replicado = retractación replicada.** F sustituye para `m` un valor
     `v` por un `v'` que va **hacia atrás** —un marcador que **baja** (lo que
     RN-04 prohíbe sin fuente oficial o humano, así que una fuente que lo hace se
     está retractando) o un estado que **regresa** (`finished` o `postponed` que
     dejan de serlo, o `live → scheduled`)—, y S hace la **misma** sustitución
     `v → v'` en el **mismo** partido. Cada caso se registra con las claves raw
     de las cuatro capturas que lo sostienen. → **ESPEJO**.
     *Por qué «hacia atrás» y no «cualquier sustitución»:* leído a la letra,
     **cada gol** es un valor sustituido por otro y cada gol lo reportan todas
     las fuentes, así que cualquier par saldría ESPEJO por el camino fuerte y el
     criterio quedaría vacío. Lo que nombran el *Diseño §2* y `dominio.md` es
     otra cosa: «un error **transitorio** … el mismo marcador equivocado y la
     misma corrección».
     **Dos límites declarados, no descuidos.** (a) Un error corregido **hacia
     arriba** —S muestra 0-0 cuando el real es 1-0 y luego salta a 1-0— es
     indistinguible de un retardo de refresco con este instrumento, y llamarlo
     error sería inventar: quien mide el retardo es la mitad temporal. (b) Una
     retractación **real del mundo** —un gol anulado que las dos fuentes
     deshacen honestamente— produce un falso ESPEJO. Se acepta porque yerra
     hacia el lado seguro de CA-12 (ESPEJO cierra la segunda vía de RN-02, no la
     abre) y porque las cuatro claves quedan citadas para que una persona lo
     mire; y si concurre con un adelanto probado, la regla de decisión de abajo
     lo manda a INCONCLUSO, no a ESPEJO.
  2. **Discrepancia persistente.** F y S sostienen valores distintos para el mismo
     hecho —**resultado de un partido acabado, hora de comienzo, existencia del
     partido**— durante **≥ 3 capturas consecutivas de ambas**, sin converger.
     → **INDEPENDIENTE**. Son **tres** hechos y no cuatro: la grafía del equipo
     **sale de aquí** y pasa a 10.4, que explica por qué.
  3. **Contenido exclusivo.** Hechos que S tiene y F nunca, y al revés.
  4. **Divergencia de grafía — se registra, no dicta.** F y S escriben distinto
     el nombre de un equipo del mismo partido (tras la normalización tacaña de
     `normalizeAlias`). Se cuenta, se cita con sus claves raw como cualquier otra
     afirmación (CA-14) y **viaja en el informe en su propio contador, separado
     de las discrepancias persistentes**. **No entra en ningún veredicto, ni
     hacia ESPEJO ni hacia INDEPENDIENTE.**
     *Por qué no dicta:* la fuerza probatoria de 10.2 está en que **un espejo
     converge**. La grafía es justo el campo donde un espejo **no converge por
     construcción**: un agregador copia el marcador y **rinde el nombre desde su
     propia base de equipos**, así que dos sitios distintos escriben los nombres
     distinto casi siempre. La señal dispara con la misma probabilidad bajo las
     dos hipótesis, o sea que **no lleva información**, y dictar con ella daría
     INDEPENDIENTE de todo contra todo: exactamente la confianza falsa del
     §Problema, y con RN-02 abriendo su segunda vía sobre una independencia no
     demostrada. Es además el único de los cuatro hechos que **no** aparece en la
     tabla del *Diseño §2*, que es la sección que gobierna; estaba en 10.2 por
     error de redacción mío.
     *Para qué sirve entonces, y por qué no se borra:* es la superficie de
     auditoría del emparejamiento manual de CA-6 —quien lo escribió puede
     comprobar contra el archivo qué llamaba cada fuente a cada equipo— y es el
     primer insumo real del catálogo de alias de RN-09, que esta spec deja fuera
     de alcance pero que alguien tendrá que escribir.
     *Coste de la enmienda, dicho entero:* la mitad de contenido pierde una de
     sus cuatro señales y por tanto encontrará menos INDEPENDIENTE el día 2. Eso
     **no rompe el *Diseño §4***, lo restaura: «si no las encuentra → INCONCLUSO»,
     que por CA-12 se trata como espejo y deja el motor con una sola vía, que es
     lo que hay que hacer mientras no haya prueba.

  **Regla de decisión (total y ordenada).** Sean: *fuerte-independiente* =
  adelantos suficientes (CA-9) **o** ≥ 1 discrepancia persistente (10.2);
  *fuerte-espejo* = ≥ 1 error replicado (10.1); *indicio-espejo* = **sincronía**,
  definida como **cero eventos exclusivos de S, N ≥ N_min, la mitad temporal
  `completa` y ningún adelanto en ninguna de las dos direcciones** —todo evento
  comparable, empate dentro de τ—. Entonces, en este orden:
  1. N < N_min → **INCONCLUSO por muestra insuficiente** (CA-11).
  2. *fuerte-independiente* **y** *fuerte-espejo* a la vez → **INCONCLUSO por
     señales contradictorias**. No es un empate que romper: un espejo no puede
     adelantar y dos fuentes independientes no se retractan igual, así que una de
     las dos señales está mal y no sabemos cuál. Por CA-12 es el lado seguro.
  3. *fuerte-independiente* → **INDEPENDIENTE**.
  4. *fuerte-espejo* **o** *indicio-espejo* → **ESPEJO**. Un indicio **cede** ante
     una señal fuerte en vez de contradecirla: si no, «S no aporta nada propio»
     cancelaría un adelanto probado. Cuando el veredicto se sostiene solo en el
     indicio, el informe lo dice (`mirror_indication`).
  5. En otro caso → **INCONCLUSO sin señal**.

  **Por qué *sincronía* y no «0 adelantos» a secas.** «0 adelantos **de S**»
  contradice frontalmente a CA-9 (c) —una S cinco minutos por detrás tiene 0
  exclusivos, N alto y 0 adelantos suyos, y CA-9 (c) exige que eso sea
  INCONCLUSO y no ESPEJO—. Leído en las **dos** direcciones, las dos reglas son
  verdad a la vez: la fuente meramente lenta acumula **retrasos**, la sincronía
  no se cumple y la cláusula no dispara; el espejo que va acompasado sí. Y es
  además la única lectura bajo la cual la cláusula lleva información: «nunca es
  más rápida» es compatible con espejo y con independiente-lento —lo dice el
  *Diseño §2*—, mientras que «nunca se desacompasa, en ningún sentido, teniendo
  algo que medir» es lo que el *Diseño §2* llama indicio «fuerte junto a lo
  anterior».
  **Y por qué exige la mitad temporal `completa`.** En una ventana en reposo no
  hay ningún cambio de valor: todo evento es el estado inicial, todo sale empate
  y no hay exclusivos, así que la cláusula dispararía **siempre** y el día 2
  dictaría ESPEJO de todo. Sin al menos un cambio de valor que vieran las dos
  fuentes, «no hay adelantos» **no es un hecho sobre las fuentes: es un hecho
  sobre la ventana**.
  **Test:** siete fixtures —error transitorio replicado (marcador que baja) →
  ESPEJO citando las cuatro claves; un gol normal (marcador que sube) en las dos
  fuentes → **no** es error replicado; S con un hecho que F no tiene → no ESPEJO;
  horarios distintos en 2 capturas que luego convergen → **no** cuenta como
  discrepancia persistente (es retardo de refresco, justo lo que hace un espejo);
  los mismos horarios distintos en 3 capturas → INDEPENDIENTE; **grafías
  distintas y persistentes en 3 capturas, sin ninguna otra señal → NO
  INDEPENDIENTE (INCONCLUSO), y la divergencia aparece contada y citada en el
  informe** —este es el corazón de la enmienda y no puede faltar—; adelanto
  probado y error replicado a la vez → INCONCLUSO por señales contradictorias.
  *Por qué el error replicado pesa tanto:* dos fuentes independientes pueden
  coincidir en todos los aciertos —el marcador real es uno—, pero no en los
  fallos. Un mismo marcador equivocado y una misma corrección es la huella
  dactilar de un origen común, y no depende de la resolución temporal.
  *Por qué la discrepancia tiene que ser persistente:* un espejo con retardo de
  refresco discrepa de su origen **de forma transitoria** todo el rato. Lo que
  distingue al dato propio es que la diferencia **no converge**. El umbral de 3
  capturas es hipótesis declarada, como τ y N_min (§5 de las notas del gate).
  *Reparto entre mitades:* las señales 2, 3 y 4 corren el **día 2** sobre datos
  en reposo. La 1 necesita observar una corrección, que en la práctica ocurre
  durante los partidos; si el día 2 no la produce, se registra como no observada
  y se reintenta en la ventana en vivo, sin que eso invalide el informe del día 2
  (CA-13).

- **CA-11 — La muestra insuficiente es un veredicto, no un silencio.**
  Dado un análisis con **N < N_min = 10** eventos comparables, entonces el
  veredicto es **INCONCLUSO por muestra insuficiente**, el informe lleva el N
  observado y el N_min exigido, y **no** se dicta ni ESPEJO ni INDEPENDIENTE.
  **Test:** fixture con N = 9 → INCONCLUSO con ambos números en el informe;
  fixture con N = 10 → se dicta veredicto.
  *Umbral declarado:* N_min = 10. Una hora de fútbol en 8-9 partidos rinde del
  orden de 15-25 eventos entre goles y transiciones de estado; 10 es el suelo por
  debajo del cual el reparto de adelantos es ruido. **Es hipótesis: si la ventana
  real se queda corta, el informe lo dice y la respuesta es ampliar la ventana,
  no bajar el umbral.**

- **CA-12 (RN-02) — Lo desconocido no es independencia.**
  Dado cualquier veredicto que no sea INDEPENDIENTE —ESPEJO o INCONCLUSO—,
  entonces el informe declara para esa fuente
  `rn02_segunda_via_entre_automaticas: false`.
  **Test:** tabla sobre los tres veredictos; solo INDEPENDIENTE da `true`.
  *No es una elección de política, es leer RN-02:* su segunda vía exige dos
  fuentes «**independientes**». Una fuente cuya independencia no se ha
  demostrado no satisface la precondición. El coste del error es asimétrico y
  está en el §Problema: un provisional de más cuesta poco; un confirmado con un
  solo origen cuesta el proyecto.
  **El nombre de la clave es deliberado: la bandera es sobre las fuentes
  automáticas, no sobre RN-02 entera.** El **corresponsal** pesa 0.8, que es
  ≥ 0.7, y una persona en el campo es independiente de cualquier scraper por
  construcción. Así que los pares (agregador, corresponsal) siguen satisfaciendo
  la segunda vía aunque las dos automáticas resulten espejos. Es lo que ya dice
  ADR-002 con todas las letras —«el motor solo podrá publicar provisional **sin
  intervención del corresponsal**»— y esta spec no lo amplía: **no** mide al
  corresponsal, que no es una fuente que se capture por HTTP. Se deja escrito
  para que la spec del motor no lea `false` y concluya de más.

- **CA-13 — Veredicto accionable, no log. Y el parcial es un veredicto.**
  Dado un análisis, entonces produce un informe **JSON validado por un esquema
  zod** con, por cada fuente candidata y por el par de candidatas (CA-15): el
  veredicto de los tres, los contadores (N, adelantos, retrasos, empates,
  exclusivos, errores replicados, discrepancias persistentes y —**contadas
  aparte y en su propia clave, enmienda 2026-08-31 §1**— divergencias de
  grafía), los umbrales usados (τ, N_min, mínimos de CA-9 y CA-15, las 3
  capturas de CA-10.2), la ventana (inicio, fin, cobertura de ticks por par) y
  `rn02_segunda_via_entre_automaticas`. Y **un párrafo en prosa por fuente** que
  dice qué se hace en consecuencia.
  **Las divergencias de grafía no se suman a las discrepancias persistentes en
  ninguna clave del JSON ni en la prosa**, y la prosa dice de ellas, cuando las
  hay, que se registran y no dictan y por qué. Un contador compartido con un
  discriminador booleano sería una invitación a que el primer consumidor que
  olvide filtrar reintroduzca justo el fallo que la enmienda quita.
  **Cada mitad lleva su propio estado**, `completa` o `pendiente`: un informe con
  la mitad de contenido `completa` y la temporal `pendiente` es **válido y
  accionable**, no un informe a medias. Cuando la temporal está `pendiente` el
  informe nombra la ventana en vivo prevista que la cerrará.
  **Test:** el JSON de un fixture valida contra el esquema; falla si sobra o
  falta una clave (misma disciplina de paridad que CA-14 de SPEC-001). Y un
  fixture **solo de contenido** produce un informe que valida, dicta veredicto y
  marca la mitad temporal como `pendiente` — si el esquema exigiese los
  contadores temporales, este test falla, que es lo que se quiere evitar.
  **Advertencia obligatoria sobre la métrica de conflictos** (arbitraje del gate
  del 2026-08-31): si ninguna de las dos candidatas sale INDEPENDIENTE, el
  informe **debe** incluir, en el JSON y en la prosa, que la métrica de
  conflictos de EPIC-001 tiene como denominador fuentes no independientes, que su
  valor no mide lo que su nombre dice, y que **el corte duro del 15 % no aplica
  en ese escenario**. **Test:** un fixture con las dos en ESPEJO produce esa
  advertencia; uno con una INDEPENDIENTE, no.
  *Dónde vive:* `docs/epicas/EPIC-001-spike-ingesta/hallazgos/test-de-espejo.md`
  para la prosa y el JSON junto a él. El esquema del informe es **local a esta
  spec**: no entra en `src/model/`, que es el modelo canónico que cruza al
  frontend.

- **CA-14 (RN-12, por analogía) — Cada afirmación del veredicto cita sus capturas.**
  Dado el informe, entonces cada adelanto, cada evento exclusivo y cada error
  replicado lleva las **claves raw** de las capturas que lo sostienen, y esas
  claves existen en el store.
  **Test:** sobre un fixture, el test recorre todas las claves citadas y
  comprueba que `store.get()` devuelve algo para cada una; falla si alguna cita
  cuelga.
  *Por qué:* es la misma exigencia que RN-12 pone sobre una `Decision` —la regla
  y las observaciones que la sostienen—, aplicada al artefacto que va a decidir
  la forma del motor. Un veredicto que no se puede auditar contra el archivo es
  una opinión con formato JSON.

- **CA-15 (RN-02) — El cruce de las dos candidatas entre sí.**
  Dado el **mismo archivo**, entonces se analiza también el par
  **ceroacero × resultados-futbol.com**, y el informe dicta un veredicto para el
  par además de los dos veredictos contra futgal.
  *Por qué entra en alcance* (gate del 2026-08-31): las dos candidatas son
  exactamente el par de peso ≥ 0.7 que RN-02 necesita para su segunda vía. Si
  ambas fuesen independientes de futgal pero **espejos entre sí** —dos reventas
  del mismo feed de un tercero—, los dos cruces contra futgal saldrían
  INDEPENDIENTE, RN-02 parecería aplicable y no lo estaría. Es el único hueco que
  deja a RN-02 sin segunda vía sin que nadie lo vea, y cuesta un cruce más sobre
  datos ya capturados.

  **La asimetría del diseño §2 vale aquí, pero cambia de forma, porque ninguna de
  las dos es «la fuente».** Definiciones para el cruce simétrico:
  1. **Adelanto.** Se cuenta en las **dos direcciones**. Que C1 adelante a C2 no
     prueba que el par sea independiente: prueba que C2 no es origen de C1. El
     par se dicta **INDEPENDIENTE ENTRE SÍ** solo si **cada una adelanta a la
     otra** según el mínimo de CA-9 (≥ 2 eventos en ≥ 2 partidos, **en cada
     dirección**). Adelantos en una sola dirección **no** son independencia: son
     el caso asimétrico, y entonces la rezagada se trata como espejo de la otra.
  2. **Error replicado.** Simétrico, y con una distinción que **solo este CA
     puede producir**: un error replicado por C1 y C2 que **también está en
     futgal** es consistente con que ambas lo espejen (ya lo detectan los cruces
     contra F); uno replicado por C1 y C2 y **ausente de futgal** prueba un
     **origen común aguas arriba que no es futgal**. El informe los cuenta
     separados y nombra el segundo como tal.
  3. **Discrepancia persistente y contenido exclusivo.** Simétricos, sin cambio.
  4. **Divergencia de grafía.** Simétrica, y **tampoco dicta aquí** (CA-10.4,
     enmienda 2026-08-31 §1). Si acaso el argumento es más fuerte en este cruce:
     las dos candidatas son dos agregadores, cada uno con su propia base de
     equipos, así que la señal dispararía incluso para dos reventas literales del
     mismo feed.

  **τ y N_min no cambian.** τ = 90 s sale del intervalo de muestreo de RN-11, que
  es idéntico para las tres fuentes; N_min = 10 es tamaño de muestra y no depende
  de quién es la referencia. **Lo que sí sube es el listón de independencia:** de
  2 adelantos a 2 en cada dirección, 4 en total. Es correcto que suba, porque la
  afirmación es más fuerte —independencia mutua, no «no copia de aquella».

  **Test:** cinco fixtures. (a) C1 y C2 se adelantan mutuamente 2 y 2 →
  INDEPENDIENTE ENTRE SÍ. (b) C1 adelanta a C2 cuatro veces y C2 nunca a C1 →
  **no** independiente; C2 se marca espejo de C1. (c) C1 y C2 replican un error
  que futgal nunca tuvo → ESPEJO con la marca de origen común distinto de futgal.
  (d) el mismo error replicado, pero presente también en futgal → se cuenta en la
  otra categoría. (e) muestra por debajo de N_min → INCONCLUSO, y por CA-12 el par
  no habilita la segunda vía.

## Entidades y reglas afectadas

Fuentes de verdad, **referenciadas y no duplicadas**:

- `docs/fundacion/reglas.md` — **RN-02** (la precondición que se mide),
  **RN-10** (raw antes de parsear), **RN-11** (cortesía de scraping), **RN-01**
  (pesos: F = 1.0, candidatas = 0.7), **RN-09** (alias; CA-6 y su alcance).
- `docs/fundacion/dominio.md` — `Observation`, `raw store`, `RawStore`,
  `raw_ref`, estados del partido, **futgal.es**, **ceroacero.es**.
- **ADR-002** — decide las fuentes y **encarga este test**. Esta spec lo
  implementa; no lo reinterpreta.
- **ADR-005** — el `RawStore` como puerto (Blob en producción, disco en local).
- **ADR-006** — instantes ISO 8601 UTC como cadena; `postgres.js` con SQL
  etiquetado si algo se persiste en base.
- **ADR-004** — sin scheduler en proceso ni disco persistente.

**Modelo canónico: no se toca.** Esta spec **no añade ni modifica nada de
`src/model/`**, y por tanto no reabre SPEC-001 ni exige `migrations/0002`.
Reutiliza tal cual: `src/raw/` entero (`RawStore`, `rawKey`, `store.get/list`),
`MatchId` y `SourceId` de `src/model/ids.ts`, e `InstantSchema` para los
instantes. El informe de espejo es un artefacto de medición con esquema propio,
local a la spec: no cruza al frontend y no es una entidad del dominio.

**Persistencia:** la fase B **no necesita base de datos**. Lee del `RawStore` y
escribe un fichero. Si el gate prefiere que las capturas rindan `Observation`s en
Postgres, eso es la spec de adaptadores, no esta.

## Fuera de alcance

Aparcado a propósito, no por descuido:

- **Los adaptadores completos** de futgal, ceroacero y resultados-futbol.com. La
  fase B necesita un extractor mínimo —identidad del partido, `status` y
  marcador— que **no** resuelve alias, **no** construye `Observation`s y **no**
  escribe en Postgres. Los adaptadores de verdad son sus propias specs.
- **El catálogo de alias de los 36 equipos** (RN-09). CA-6 usa un
  emparejamiento manual de los partidos de la ventana, para medir.
- **El motor de decisiones.** Esta spec produce el insumo; no consume su propio
  veredicto ni configura RN-02. Eso es la spec del motor.
- **El corresponsal como fuente medida.** No se captura por HTTP y su
  independencia de los scrapers es de construcción, no de medida. Queda fuera del
  archivo y fuera de los cruces; su efecto sobre RN-02 está en CA-12.
- **Repetir el test en producción.** Las fuentes cambian de proveedor sin avisar;
  volver a medirlo es cuestión de producción, no del spike.
- **Vercel Cron.** La fase A escribe por el puerto `RawStore`, así que da igual
  si corre en un cron o en un proceso local supervisado durante la hora. Los CA
  restringen el archivo y el ritmo, no el anfitrión.

## Notas para el gate humano

El gate del **2026-08-31** resolvió §2, §3 y §4. Se conservan aquí, resueltas y
con su motivo, porque son lo que explica la forma de la spec. §1 y §5 son
declaraciones que quien firma asume al firmar. §6 quedó cerrado después (ver ahí).
**§7 es lo abierto hoy** y es lo que trae la enmienda del 2026-08-31.

**§1. DECLARACIÓN, load-bearing — interpretación de RN-11.** «Máximo 1
petición/minuto **por competición**» se lee como **por fuente y competición**.
Está desarrollada en el cuerpo, *Diseño §3*, que es donde manda; aquí solo el
aviso: **aprobar esta spec es aprobar esa lectura.** Con la lectura contraria —un
tope global repartido entre sitios distintos— la resolución del instrumento cae
de 1 a 3 minutos, el test temporal deja de medir nada y la spec hay que
rehacerla. No es un detalle de implementación.

**§2. RESUELTA — el test se parte en dos.** La ventana necesita partidos en juego
y las dos competiciones se juegan en fin de semana, así que la premisa del «día 2»
de ADR-002 puede no darse. **Decisión del gate: opción (d).** La mitad de
contenido corre el día 2; la temporal, en la primera ventana en vivo. Es ahora el
plan escrito de la spec: *Diseño §4* con el reparto de CA por mitad, y CA-13 hace
del veredicto parcial un estado legítimo del informe. **Cabe dentro de ADR-002 y
no lo supersede**, así que no hace falta ADR nuevo.

*Corrección a lo que argumenté al proponer (d):* dije que «el veredicto que
cambia el diseño del motor es ESPEJO, y ese sale de contenido». **Es impreciso.**
Al escribir CA-10 se ve que el error replicado —la señal fuerte de espejo— casi
siempre necesita observar una corrección, y las correcciones ocurren durante los
partidos. El argumento correcto es otro, y es más fuerte: **la decisión del motor
es binaria y su valor por defecto es seguro.** El día 2 solo puede mover RN-02 de
«una vía» a «dos» (si encuentra discrepancias persistentes); si no encuentra
nada, el motor se diseña con una vía, que es lo que habría que hacer igualmente
mientras no haya prueba. Por eso **el motor no espera a la jornada en ningún
escenario**, y la mitad temporal solo puede mejorar el veredicto. Lo dejo escrito
porque la decisión se tomó con mi versión imprecisa y conviene que conste que la
conclusión aguanta por una razón distinta de la que di.

**§3. RESUELTA — la métrica de conflictos, con advertencia.** Decisión del gate:
opción **(i)**. Si ninguna candidata sale INDEPENDIENTE, la métrica se reporta
con la advertencia de que su denominador son fuentes no independientes, y **el
corte duro del 15 % no aplica** en ese escenario. Escrito como obligación
verificable en **CA-13**, con test: la advertencia viaja dentro del informe, no
en la cabeza de quien lo lea. **Ver §6: creo que además hay que tocar `_epica.md`
y `roadmap.md`, y eso no es mío.**

**§4. RESUELTA — el cruce de las dos candidatas entra en alcance.** Es **CA-15**,
sobre el mismo archivo. La asimetría del *Diseño §2* vale pero cambia de forma al
no haber «fuente»: independencia mutua exige adelantos **en las dos
direcciones** (4 en total, no 2), y el error replicado se cuenta separando el que
también está en futgal del que **no** está —este último prueba un origen común
aguas arriba distinto de futgal, y es un hallazgo que ningún otro cruce puede
producir. **τ = 90 s y N_min = 10 no cambian**: τ sale del intervalo de muestreo
de RN-11, idéntico para las tres fuentes, y N_min es tamaño de muestra, que no
depende de quién sea la referencia.

**§5. DECLARACIÓN — los umbrales son hipótesis y están instrumentados.**
τ = 90 s, N_min = 10, 2 adelantos en 2 partidos (4 en el cruce simétrico) y las 3
capturas consecutivas de la discrepancia persistente. Ninguno es verdad recibida:
los cinco se registran en el informe junto al reparto de datos observados, para
poder recalcularlos **sin volver a capturar**. Misma disciplina que `reglas.md`
aplica a los umbrales de RN-01..RN-07.

**§6. CERRADO el 2026-08-31 (commit `da9c6dc`), y no era de esta spec — §3
obligaba a tocar dos documentos de `sdd-producto`.** La coletilla que propuse
abajo está añadida en los dos documentos: `docs/roadmap.md:50` y
`_epica.md:39`. **Nada pendiente aquí**; se conserva el texto porque explica por
qué se tocaron dos documentos aprobados. *(El ledger, en su F-SPEC-002-13, sigue
dándolo por abierto: el implementador trabajaba con contexto aislado y no vio el
commit. Esa entrada es de su mitad y no la toco.)* El gate había
decidido que el corte del 15 % no aplica en un escenario concreto, pero ese corte
está afirmado **sin condición** en dos sitios que son de `sdd-producto` y del
humano:

- `docs/epicas/EPIC-001-spike-ingesta/_epica.md`, tabla de criterios de éxito:
  «Conflictos … Informativo; **> 15 % obliga a rediseñar el motor**».
- `docs/roadmap.md`, *Criterios de corte*: «**Corte duro de conflictos:** > 15 %
  obliga a rediseñar el motor antes de ampliar competiciones».

Dejarlo solo en SPEC-002 repite exactamente el patrón de F-SPEC-001-16 y de la
celda *provisional* de `dominio.md`: dos documentos de verdad diciendo cosas
distintas, y el que más se lee diciendo la vieja. Texto que propondría, idéntico
en los dos, como coletilla de la frase existente:

> …salvo que SPEC-002 dicte que ninguna fuente automática es independiente de
> futgal: entre espejos no hay desacuerdo posible, así que en ese escenario la
> cifra no mide lo que su nombre dice y el corte no aplica.

Es una épica **aprobada**, así que ni la toco ni decido si el cambio merece
rehacer su firma. Te lo devuelvo señalado.

**§7. LO QUE HAY QUE FIRMAR HOY — la enmienda del 2026-08-31.** La spec estaba
`aprobada` y ya implementada cuando aparecieron cinco cosas que su texto no
resolvía o resolvía mal. Están escritas en el cuerpo y listadas en *Historial de
enmiendas*; aquí, lo que quien firma tiene que mirar con lupa, en orden de
riesgo:

1. **La única que cambia un veredicto: la grafía deja de dictar (CA-10.4).**
   Es lo que se pidió dictaminar. Sin ella el test saca INDEPENDIENTE de todo
   contra todo y RN-02 abre su segunda vía sobre una independencia no
   demostrada, que es la falta que el §Problema llama confianza falsa. **Coste
   declarado:** la mitad de contenido pierde una de sus cuatro señales y
   encontrará menos INDEPENDIENTE el día 2; el resultado por defecto pasa a ser
   INCONCLUSO, que por CA-12 deja el motor con una sola vía. Es el lado seguro y
   es lo que el *Diseño §4* ya decía. **Si el gate prefiere que la grafía siga
   dictando**, hay que decirlo aquí y asumir que el veredicto del test será
   INDEPENDIENTE casi con seguridad y no significará nada.
2. **La retractación como definición de «error replicado» (CA-10.1)** trae dos
   límites que quien firma asume: un error corregido *hacia arriba* es invisible
   para este instrumento, y un gol anulado de verdad que las dos fuentes
   deshacen produce un falso ESPEJO. Los dos yerran hacia el lado seguro.
3. **La sincronía (CA-10, regla de decisión)** hace que la cláusula débil de
   ESPEJO exija cero desajuste en las **dos** direcciones y la mitad temporal
   `completa`. Sin lo primero contradice a CA-9 (c); sin lo segundo, el día 2
   dictaría ESPEJO siempre.
4. **La regla de decisión es ahora total y ordenada**, y dice qué pasa cuando
   concurren una señal fuerte de cada signo: INCONCLUSO. Antes no lo decía nadie.
5. **La negativa de CA-5 es una negativa** (sin informe), y no un informe de
   INCONCLUSOs. La razón está en CA-5: CA-11 habla del mundo, CA-5 del
   instrumento.

**Si apruebas**, dos términos —**espejo** e **independiente**— pasan a
`dominio.md`, que hoy solo los usa de pasada en la ficha de ceroacero. No los he
añadido aún porque el glosario no debe adelantarse a lo que el gate no ha
firmado. Con la enmienda, el término que hay que definir con cuidado es
**espejo**: una fuente puede copiar el marcador y no copiar los nombres, así que
«espejo» es una afirmación sobre **los valores**, no sobre la página.

## Historial de enmiendas

- **2026-08-31 — enmienda 1 (sdd-arquitecto).** Motivo: los follow-ups
  **F-SPEC-002-4, -5, -6, -7, -8, -9 y -10** del ledger. Alberto Fojo encargó el
  dictamen de F-9 al arquitecto sin dirigir la respuesta, y la ratificación o
  enmienda de las cuatro interpretaciones que el implementador resolvió por su
  cuenta. La spec estaba `aprobada` y ya implementada, así que el cambio se
  registra aquí y `sdd-verificador` juzga contra **este** texto. El frontmatter
  `estado` no se toca: sigue `en-revision`. **La enmienda la ratifica el humano,
  no el arquitecto.**
  1. **La grafía del equipo deja de dictar veredicto** (F-SPEC-002-9, el
     dictamen pedido). Sale de la lista de hechos de **CA-10.2**, que pasa de
     cuatro hechos a tres, y entra como señal nueva **CA-10.4**: se computa, se
     cuenta **en su propia clave**, se cita con sus claves raw y **no entra en
     ningún veredicto**. Motivo: un agregador copia el marcador y rinde el
     nombre desde su propia base de equipos, así que la divergencia de grafía es
     compatible con espejo *por construcción* —dispara con la misma probabilidad
     bajo las dos hipótesis y no lleva información—, mientras que toda la fuerza
     de 10.2 está en que un espejo converge. Además, la grafía era el único de
     los cuatro hechos que **no** aparecía en la tabla del *Diseño §2*, que es la
     sección que gobierna: estaba en 10.2 por error de redacción mío. Se
     conserva registrada porque es la superficie de auditoría del emparejamiento
     manual de CA-6 y el primer insumo del catálogo de alias de RN-09.
     Criterios tocados: CA-10.2, CA-10.4 (nueva), CA-13 (contador propio),
     CA-15.4 (nueva), tabla del *Diseño §2*, tabla del *Diseño §4*.
  2. **«Error replicado» se define como retractación replicada** (F-SPEC-002-4,
     **ratificada** la lectura del implementador). **CA-10.1** reescrito: la
     sustitución tiene que ir hacia atrás —marcador que baja (RN-04) o estado que
     regresa—. La lectura literal convertía cada gol en error replicado y sacaba
     ESPEJO de cualquier par. Se añaden los dos límites declarados: el error
     corregido hacia arriba es indistinguible del retardo de refresco con este
     instrumento, y una retractación real del mundo replicada por dos fuentes
     independientes es un falso ESPEJO aceptado por caer del lado seguro de
     CA-12.
  3. **El «si y solo si» de CA-9 acota la señal temporal, no el veredicto**
     (F-SPEC-002-6, **ratificado** el O lógico). **CA-9** reescrito, y la
     disyunción se cierra: los caminos a INDEPENDIENTE son exactamente dos
     —adelantos y discrepancia persistente—, y la regla de decisión vive en
     CA-10.
  4. **«0 adelantos» pasa a ser «sincronía»** (F-SPEC-002-5 y F-SPEC-002-7,
     **ratificadas** las dos lecturas). La cláusula débil de ESPEJO exige ahora,
     escrito en la **regla de decisión de CA-10**: cero exclusivos de S, N ≥
     N_min, mitad temporal `completa` y **ningún adelanto en ninguna de las dos
     direcciones**. Sin la bidireccionalidad, CA-10 contradecía a CA-9 (c) —«el
     corazón del criterio»— sobre el mismo dato; sin la mitad temporal
     `completa`, una ventana en reposo dictaría ESPEJO siempre, contra el
     *Diseño §4*.
  5. **La regla de decisión se escribe entera, total y ordenada** (F-SPEC-002-8,
     **ratificado**): muestra insuficiente, señales fuertes contradictorias →
     INCONCLUSO, fuerte-independiente, fuerte-espejo o indicio, y si no,
     INCONCLUSO sin señal. Antes la spec listaba señales sueltas y no decía qué
     pasa cuando concurren.
  6. **«La fase B se niega» se precisa como negativa sin informe**
     (F-SPEC-002-10, decisión del arquitecto). **CA-5** ampliado con el motivo
     —CA-11 habla del mundo, CA-5 del instrumento— y con una obligación nueva:
     el error lleva la cobertura de **los seis pares**, no solo la de los que
     bajaron del umbral, y sobre una ventana inválida no se escribe nada en
     `hallazgos/`.
  Criterios tocados: **CA-5** (ampliado), **CA-9** (reescrita su primera frase),
  **CA-10** (10.1 y 10.2 reescritos, 10.4 nuevo, regla de decisión nueva),
  **CA-13** (contador y prosa de la grafía), **CA-15** (10.4 simétrico como
  15.4). Criterios afectados sin cambio de texto: CA-11 (la puerta de N_min es
  ahora el paso 1 de la regla de decisión), CA-12 (sin cambio: la bandera sigue
  siendo `true` solo con INDEPENDIENTE), CA-14 (las divergencias de grafía citan
  sus capturas como todo lo demás). Secciones tocadas: *Diseño §2* (fila nueva en
  la tabla), *Diseño §4* (tabla de mitades), *Notas para el gate humano* §6
  (cerrado) y §7 (nueva).
