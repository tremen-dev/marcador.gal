---
id: ADR-009
tipo: adr
estado: borrador
historial:
  - {estado: borrador, fecha: 2026-08-31, por: sdd-arquitecto}
supersede: ADR-005 (parcialmente; ver §Alcance de la supersesión)
---
# ADR-009: Retención del raw store — plazo de conservación y purga

- Deciders: propone `sdd-arquitecto` a partir del §5 del dictamen de
  `sdd-legal-datos` del 2026-08-31 (ledger de SPEC-002) y de la precondición que
  **ADR-008 §5.3** fija como tal. **Aprueba: el gate humano.** Al firmar elige
  **uno de los tres plazos** de la §2 y acepta lo que la §3 y la §4 dicen que se
  pierde y quién responde de que se ejecute.
- Specs relacionadas: **SPEC-001** (`hecho`; define el puerto `RawStore` y abrió
  **F-SPEC-001-1**), **SPEC-002** (`hecho`; CA-7 determinismo y CA-14 citas),
  **SPEC-003** (`borrador`; su ventana es la primera que archiva bytes reales).
- Relacionado: **ADR-005** (raw store), **ADR-004** (sin scheduler, sin disco),
  **ADR-006** (instantes ISO 8601), **ADR-008** (fuentes capturables), **RN-10**,
  **RN-11**, **RN-13**.

## Contexto

**Hasta hoy el raw store estaba vacío y su retención era higiene. Deja de serlo
en el momento en que se corra la primera ventana.**

ADR-005 decidió el puerto y sus dos implementaciones, y dejó la retención
explícitamente sin definir: entre sus *Negativas*, «el almacenamiento en Blob …
**crece de forma monótona**: hay que definir una política de retención antes de
producción, y no está definida». **F-SPEC-001-1** existe por esa frase y sigue
abierta desde el 2026-08-29. El motivo que ADR-005 daba era **coste**.

Ese ya no es el motivo, y conviene decirlo antes de nada porque cambia el
tamaño del problema. La ventana de SPEC-003 son 4 pares × 60 capturas ≈ **240
respuestas de 100–300 KB, es decir 24–72 MB**, en el disco local del operador.
A ese volumen el coste es literalmente cero. **Lo que pide un plazo no es la
factura: es el RGPD**, y por dos caminos que se cruzaron el 2026-08-31.

**1. Hay datos personales dentro.** El §5 del dictamen de `sdd-legal-datos`:
las páginas de competición que la fase A archiva contienen, según el sitio,
**nombres de jugadores, árbitros y entrenadores** — datos personales de personas
identificables. El dictamen lo marca como **advertencia condicionada**: no ha
inspeccionado el HTML real porque no se ha corrido ninguna ventana. Con datos
personales dentro, la retención indefinida deja de ser deuda técnica y pasa a ser
**minimización y limitación del plazo de conservación (RGPD art. 5.1.c y 5.1.e)**.
Base legal defendible para la medición: **interés legítimo (art. 6.1.f)**. La
retención indefinida no lo es.

**2. La excepción de minería exige plazo.** El art. 4 de la Directiva (UE)
2019/790 (RDL 24/2021) —lo que ampara reproducir el HTML de ceroacero para
medir— permite conservar las copias **solo mientras sean necesarias para la
minería**. Sin plazo declarado, se pierde el amparo justo en la fuente que el
dictamen da por **CORRECTA**.

Y hay un tercer camino, que es de proceso: **ADR-008 §5.3, ya firmado**, hace del
«plazo de conservación fijado antes de la ventana» uno de los cuatro límites bajo
los que el gate acepta capturar `besoccer.es`. El gate ya se comprometió a que
esto exista. Falta decir cuánto.

### Lo que el archivo sostiene, que es lo que un plazo puede romper

Un plazo corto no es gratis. **RN-10** obliga a archivar antes de parsear, y el
diseño de dos fases de SPEC-002/003 convierte ese archivo en el instrumento
entero. Tiene **tres consumidores**, y cada uno tiene su propio horizonte:

| Consumidor | Qué necesita | Horizonte real |
|---|---|---|
| **Recalibrar extractores** (F-SPEC-002-3) | Los **bytes**. Los selectores se escriben mirando el HTML ya archivado, «cuantas veces haga falta». | Días desde la ventana. Es el bucle del operador. |
| **`sdd-verificador`** (SPEC-002 CA-7) | Los **bytes**. El análisis es función del archivo, así que el verificador puede comprobar el veredicto de una ventana **que no presenció**. | Semanas: el ciclo de verificación de la spec que gobierna la ventana. |
| **Auditar una afirmación del informe** (SPEC-002 CA-14) | Que la **cita** siga significando algo. Cada adelanto, exclusivo y error replicado lleva sus claves raw. | Indefinido. Es el que quiere un plazo largo y el más difícil de justificar. |

**Ahí está la tensión, y es real:** un plazo que no cubra los dos primeros rompe
el instrumento; uno que cubra el tercero con holgura no se sostiene bajo el art.
5.1.e ni bajo el art. 4 TDM. La §3 de este ADR existe para resolverla separando
lo que cada uno necesita, que **no son los mismos datos**.

### Un hecho del código que decide media discusión

`rawKey()` (`src/raw/store.ts`) construye la clave así:

```
<source>/<competition_id>/<YYYY-MM-DD>/<instante>-<sha256(body)[0..12]>.<ext>
```

**Los primeros 12 hex del sha256 del cuerpo van dentro de la clave.** Una clave
raw no es un puntero opaco: es una **referencia autoautenticante**. Esto no se
diseñó para esto —viene de CA-10 de SPEC-001, que la quería única y derivable—
pero es lo que hace que la §3 pueda decidir lo que decide.

### Y una interacción con RN-13 que hay que mirar y no muerde hoy

RN-13 hace las `Observation` **inmutables**: no se borran ni se editan. Y
`raw_ref` es **obligatorio siempre** (`dominio.md`, SPEC-001), con
`check (length(raw_ref) > 0)` en `migrations/0001`. La pregunta obvia es si
purgar el archivo choca con eso. **Hoy no, por dos motivos independientes:**

1. RN-13 protege la `Observation`, no el archivo al que apunta. La restricción
   del modelo es sobre la **cadena**, no sobre la existencia del objeto.
2. **En el spike no se crea ni una sola `Observation`.** SPEC-002 y SPEC-003
   dicen «Persistencia: ninguna»: la fase B lee del `RawStore` y escribe un
   fichero. No hay nada que RN-13 proteja en esta ventana.

Lo que sí produce la purga es un **`raw_ref` colgante**: un estado que el modelo
permite y que **nadie ha nombrado**. En producción sí muerde, y en una dirección
que conviene ver ahora: como RN-13 prohíbe borrar la `Observation`, la única
retención posible en producción es **borrar el raw y conservar la observación**.
La observación sobrevive a su raw, por regla dura. Quien escriba la retención de
producción no decide *si* habrá `raw_ref` colgantes: decide si son un estado
**declarado** o un error. Eso no se decide aquí (§6).

## Decisión

### §1. Alcance: esto fija el plazo del **archivo de medición**, no el de producción

Este ADR fija la política de retención del raw store **para las ventanas de
medición de EPIC-001** — hoy, la de SPEC-003; mañana, la de SPEC-002 si la RFGF
autoriza. Es exactamente la precondición de ADR-008 §5.3, ni más ni menos.

**No fija el plazo de producción, y la §6 dice por qué no es cobardía sino la
única respuesta honesta hoy.**

### §2. El plazo: tres opciones, y la que se propone

El plazo corre desde el **fin de la ventana** (el `fetched_at` de la última
captura), no por objeto: la ventana dura una hora y purgar por objeto añadiría
precisión que no compra nada y una contabilidad que sí cuesta.

| | Plazo | Qué cubre | Qué cuesta | Riesgo |
|---|---|---|---|---|
| **A** | **7 días** | Ventana → calibración → análisis → verificación, **si todo va seguido**. | Pone un plazo a la disponibilidad de una persona. | **Alto, y concreto.** El informe tiene dos mitades: la de **contenido** se captura cualquier día 2 y la **temporal** necesita partidos en vivo, y SPEC-002 CA-13 permite emitir con la temporal `pendiente` «y con la fecha de la ventana en vivo que la cerrará». Entre las dos hay hasta una semana **antes** de empezar a analizar. Y el ciclo de SPEC-002 necesitó **tres vueltas** de verificación. Con 7 días, el archivo se evapora a media verificación y CA-7 deja de ser ejecutable sobre la ventana que se está juzgando. |
| **B** ← **propuesta** | **30 días**, con **una** prórroga escrita y motivada, techo duro **90 días** | Las dos mitades, el análisis conjunto, las vueltas de verificación, el gate y el borrador de la spec del motor. | Casi nada: nada del pipeline necesita los bytes más allá de la spec del motor. | **Bajo.** Un mes de conservación de HTML de terceros para una medición de una hora es un plazo que se puede escribir en una respuesta sin sonrojarse, y encaja con «solo mientras sean necesarias para la minería». |
| **C** | **90 días** | Todo lo de B con margen de sobra. | Cero fricción operativa. | **Medio-alto, y del tipo que no se ve.** Un trimestre de datos personales de terceros para una ventana de una hora tensa el art. 5.1.e y el art. 4 TDM, y mantiene **viva durante un trimestre** la exposición de la cláusula *browse-wrap* de BeSoccer contra RN-10 (ADR-008 §5), que el gate aceptó para una **ventana acotada**. Y no compra nada que B no dé: no hay ningún consumidor del archivo a los 60 días. |

**Se propone B: 30 días.**

Y el motivo de la prórroga, que es la pieza que impide que B rompa el
instrumento: **el plazo tiene que poder ceder ante una verificación en curso,
pero solo dejando rastro.** Una prórroga silenciosa convierte cualquier plazo en
indefinido; por eso:

- **Es una, no las que hagan falta.**
- **Se escribe antes de que expire el plazo original**, en el ledger de la spec
  que gobierna la ventana, con **fecha nueva y motivo**.
- **El techo son 90 días desde el fin de la ventana, y es duro.** Si llegado el
  techo la verificación sigue sin terminar, **se purga igual y la ventana se
  pierde**: se vuelve a capturar. **El plazo manda sobre el instrumento**, y eso
  es lo que lo hace un plazo y no una aspiración.

**El gate elige A, B o C nombrándolo en la línea de aprobación.** El resto de
este ADR —qué sobrevive, quién purga, qué queda fuera— **no cambia con la
elección**: es el mismo mecanismo con otro número.

### §3. Qué pasa al expirar: **borrado duro de los bytes, supervivencia de lo derivado**

**Se borra de verdad** (no se marca, no se archiva, no se comprime):

- `objects/<clave>` — los bytes tal como respondió la fuente.
- `meta/<clave>.json` — sus metadatos.

Los dos, y en las dos implementaciones. Conservar `meta/` huérfano no añadiría
nada que el registro de ventana no tenga ya, y dejaría medio archivo vivo por
inercia.

**Sobrevive, y hay que sostener que sigue sin ser dato personal:**

| Artefacto | Qué lleva | Por qué sobrevive |
|---|---|---|
| `ventana.json` (`WindowLog`) | Por tick: par, instante, `outcome`, motivo y **la clave raw**. **Ningún cuerpo.** | Es la línea de tiempo completa de qué se pidió y cuándo. Sostiene la cobertura de CA-5 y CA-8/CA-9 de SPEC-003 sin un byte de contenido. |
| `hallazgos/*.{md,json}` | El informe: `match_id`, nombres de **equipo**, marcadores, instantes, contadores y `raw_keys`. | Es el entregable. Borrarlo sería tirar la medición, no minimizarla. |
| `pairing.json`, `calibracion.json` | Identidades de equipo por fuente y selectores CSS. | Reproducen el análisis sobre cualquier archivo futuro. |

**Que lo derivado no sea dato personal no es una suposición: es una propiedad
que hay que mantener, y por eso se decide.** El esquema del informe
(`src/mirror/analysis/report.ts`) hoy sólo transporta identificadores de partido,
grafías de **equipo**, marcadores, instantes y claves — **ni un nombre de
jugador, árbitro o entrenador**. Pero los campos extraídos son **datos**, no
código: los elige el operador en `calibracion.json` (F-SPEC-002-3). De ahí una
restricción con efecto inmediato:

> **La calibración no apunta a campos que lleven datos personales.** Nada de
> alineaciones, goleadores, árbitros ni entrenadores. La ventana mide existencia
> de partido, marcador, horario y estado; eso es todo lo que el test de espejo
> necesita y todo lo que puede salir del archivo hacia un fichero permanente.

Y una segunda, que hoy no cuesta nada y dentro de un mes costaría reescribir la
historia de git:

> **No se versiona en el repositorio HTML real de terceros.** `tests/fixtures/`
> no contiene hoy ni un `.html` — se ha comprobado —, pero la sección
> *Estructura* de `CLAUDE.md` promete `tests/fixtures/raw/ HTML versionado del
> replay`. **Un fixture de HTML real capturado sería la misma página con los
> mismos nombres, en git, para siempre**, y git no se purga: se reescribe. Los
> fixtures de replay son **sintéticos o redactados**. Esta política no tiene
> excepción, porque su incumplimiento no es reversible.

#### Qué significa una cita que apunta a algo borrado

Es la pregunta buena, y tiene dos mitades con respuestas distintas.

**Lo que la cita conserva.** No se borra ni se marca rota: **sigue nombrando
exactamente los bytes que la sostuvieron**, porque la clave los contiene
(`sha256(body)[0..12]`, ver *Contexto*). Tras la purga la cita deja de ser
**recuperable** y sigue siendo **verificable contra una copia**: cualquiera que
tenga esos bytes puede demostrar que son los citados, y nadie puede sustituirlos
por otros y llamarlos igual. Una afirmación de CA-14 no se degrada a opinión:
se degrada a **afirmación con testigo ausente pero identificado**.

Honestidad sobre la fuerza de eso: son **48 bits**. Es un ancla de integridad
para un archivo propio, **no** una barrera criptográfica frente a quien busque
colisiones a propósito. Ninguna afirmación legal de este ADR se apoya en ella.

**Lo que la cita pierde, y no se compensa.** **SPEC-002 CA-7 deja de ser
ejecutable sobre esa ventana.** El determinismo del análisis existe para que
`sdd-verificador` pueda comprobar un veredicto que no presenció; sin los bytes,
no puede. Es una pérdida real, es el precio del plazo, y es exactamente el
motivo de que la prórroga de la §2 exista y de que su techo sea duro.

**Consecuencia que se escribe en el propio informe, no aquí.** El fichero de
`hallazgos/` es lo que alguien abrirá dentro de seis meses sin este contexto, y
tiene que decir que sus citas son arqueológicas y no rotas. **Este ADR no lo
implementa** (§5), pero fija la obligación: **el informe declara la fecha de
purga de su ventana**. Es la regla del §Problema de SPEC-003 —«lo no medido se
declara»— aplicada a lo ya no conservable.

### §4. Quién la ejecuta: **el operador, con fecha escrita antes y acuse después**

Se han evaluado las tres formas, y dos no están disponibles hoy:

- **Propiedad del store (TTL al escribir).** Sería lo mejor y **no se puede**:
  el puerto `RawStore` tiene **tres operaciones — `put`, `get`, `list` — y
  ninguna de borrado**. Añadir una cuarta toca `src/raw/store.ts`, `disk.ts`,
  `blob.ts` y la batería de contrato de SPEC-001, que está `hecho` y mergeada.
  **Eso es una spec, no un ADR** (§5). Y exigiría además que el backend soporte
  caducidad de objeto; que `@vercel/blob` la exponga **está por comprobar** y
  aquí no se da por cierto.
- **Un cron.** No hay ruta, no hay endpoint y, sobre todo, **la ventana del
  spike no escribe en Blob**: sin `BLOB_READ_WRITE_TOKEN`, `mirror:capturar`
  archiva en `raw/`, en el disco del operador, que git ignora
  (`.gitignore`: `raw/*`). Un cron en Vercel no alcanza ese disco. **El cron es
  la respuesta de producción, no la del spike** (§6).

Queda la manual, y una purga manual sin ceremonia es una intención, no una
política. **Se decide con las dos cláusulas que la convierten en política:**

1. **La fecha de purga se escribe ANTES de capturar**, junto al registro de
   ventana y en el ledger de la spec que la gobierna. Una ventana cuya fecha de
   purga no esté escrita **no se corre**. Esto es literalmente lo que ADR-008
   §5.3 exige: *fijado antes de la ventana*.
2. **La purga se acusa DESPUÉS**, en el mismo ledger, con la fecha real, los
   prefijos purgados y el número de claves borradas. **Sin ese acuse, la ventana
   siguiente no se corre.**

En disco los prefijos son exactos y seguros por construcción: las claves son
`<source>/<competition_id>/<YYYY-MM-DD>/…`, así que una ventana de una hora vive
bajo **un prefijo de día por par** —cuatro en la ventana de SPEC-003— y hay que
borrar el mismo prefijo bajo `objects/` y bajo `meta/`. En Blob, el prefijo es el
mismo y el borrado va con `del` del SDK, **fuera del puerto**.

**Esta es la parte más débil de la decisión y no se disimula:** depende de que una
persona haga dos anotaciones. Se acepta para el spike porque el spike **tiene** un
operador en el bucle por diseño (RN-01, el panel, el emparejamiento manual de
CA-6), y porque la alternativa —tocar `src/raw/` hoy— es abrir una spec para una
ventana de 240 ficheros. **No se acepta para producción**, y la §6 lo dice como
precondición.

### §5. Lo que este ADR **no** manda implementar

**Nada. No toca `src/`, ni `tests/`, ni `migrations/`.** Y en particular:

- **No añade `delete` al puerto `RawStore`.** Si alguna vez hace falta —y en
  producción hará falta— es **una spec**, con sus CA y su batería de contrato
  contra las dos implementaciones, no un párrafo de un ADR. SPEC-001 está `hecho`
  y mergeada: mover su contrato por la vía de un ADR sería exactamente lo que
  SPEC-003 §1 se niega a hacer con SPEC-002.
- **No modifica el esquema del informe.** La obligación de que el informe declare
  su fecha de purga (§3) **es un CA, y su sitio natural es SPEC-003, que sigue en
  `borrador` y todavía puede recibirlo sin coste**. No lo escribo yo: el gate lee
  la spec y el ADR juntos y decide si entra. Si no entra, la fecha de purga vive
  solo en el ledger, y el ledger **no viaja con el fichero de hallazgos** — que
  es justo lo que CA-11 de SPEC-003 argumenta que no basta.
- **No edita el runbook.** `docs/procedimientos/ventana-de-observacion-espejo.md`
  necesita el paso «escribe la fecha de purga» antes de capturar y el paso
  «purga y acusa» al cerrar. Es de `sdd-documentalista`, y se acumula a lo que
  SPEC-003 §7 ya le señala.

### §6. Producción: lo que **no** se fija aquí, y por qué

**No se fija plazo de retención para producción, y no por prudencia decorativa:
fijarlo hoy sería inventarlo.** La unidad ni siquiera es la misma —una **ventana
de medición** que empieza y acaba, frente a una **ingesta continua** sin
fronteras— así que un número trasplantado de la §2 no significaría lo mismo.
Además depende de tres cosas que no existen todavía:

1. **Qué guarda una `Observation`** cuando el motor esté escrito, y por tanto
   cuánto del raw sigue siendo necesario después de parsear.
2. **Qué significa un `raw_ref` colgante.** El *Contexto* deja el terreno
   despejado: RN-13 prohíbe borrar la `Observation`, luego la retención de
   producción **solo puede borrar el raw** y la observación sobrevive a su
   referencia. Falta decidir si eso es un estado **declarado** o un error, y eso
   se decide con el modelo del motor delante.
3. **Qué mecanismo lo ejecuta**, que en producción **no puede ser una persona**:
   sin operador en el bucle semanal y con ~300 MB por jornada (ADR-005), tiene
   que ser una propiedad del sistema — `delete` en el puerto más un barrido, o
   caducidad del backend si la hay.

**Lo que sí se decide sobre producción, y es una precondición dura:** la ingesta
continua **no arranca sin su propia decisión de retención**, con plazo,
mecanismo automático y semántica del `raw_ref` colgante. Es la misma obligación
que ADR-005 dejó escrita («antes de producción»), ahora con nombre y con las tres
preguntas que tiene que responder. **F-SPEC-001-1 no se cierra con este ADR: se
estrecha** (§Alcance).

## Alcance de la supersesión

Este ADR **supersede a ADR-005 únicamente en** la frase de sus *Negativas* que
dice que la política de retención «no está definida», **y sólo para el archivo
de las ventanas de medición de EPIC-001**. Para producción, esa frase de ADR-005
sigue vigente palabra por palabra, con las tres preguntas de la §6 encima.

**No toca nada más de ADR-005**: el puerto y su interfaz mínima, las dos
implementaciones, el esquema de claves, el replay contra disco en tests y la
batería de contrato única siguen exactamente como están.

**ADR-005 no se edita.** Es inmutable y aprobado. Marcar su frontmatter como
parcialmente superseded, si el estándar lo pide, es del humano o de
`sdd-documentalista`, no mío.

**Sobre F-SPEC-001-1:** queda **abierta con alcance reducido**. La mitad «spike»
la cierra este ADR; la mitad «producción» sigue viva y su destino es la spec del
motor o un ADR propio, lo que llegue antes.

## Consecuencias

### Positivas

- **Se levanta la precondición de ADR-008 §5.3** y la ventana de SPEC-003 deja de
  estar bloqueada por este motivo. Era uno de los cuatro límites bajo los que el
  gate aceptó capturar `besoccer.es`.
- **La medición entra en el amparo del art. 4 TDM en lugar de salirse de él.** La
  fuente que el dictamen da por CORRECTA —ceroacero— exige plazo declarado para
  seguir amparada; ahora lo hay.
- **La minimización se decide antes de que haya un byte dentro**, que es cuando
  cuesta una anotación en un ledger y no una discusión con datos personales
  archivados. Es exactamente lo que recomienda el §5 del dictamen.
- **Se cierra un agujero irreversible antes de abrirlo**: HTML real de terceros
  versionado en git no se purga, se reescribe la historia. Hoy `tests/fixtures/`
  está limpio; mañana, con un fixture de replay dentro, no lo estaría.
- **La cita de CA-14 sobrevive a la purga con un significado preciso** —bytes
  identificados, no recuperables— gracias a que la clave lleva el digest. No hubo
  que diseñar nada: estaba en CA-10 de SPEC-001.
- **El puerto no se toca**, así que SPEC-001 sigue `hecho` y su contrato sigue
  significando lo que su verificación dijo.

### Negativas / follow-ups

- **La ejecución depende de una persona, y eso es la debilidad de esta decisión.**
  Dos anotaciones en un ledger y un borrado a mano. Las cláusulas de la §4 —fecha
  antes, acuse después, sin acuse no hay ventana siguiente— son lo mejor que se
  puede hacer sin scheduler y sin disco (ADR-004), y **no** son una garantía
  técnica. Ningún test se pondrá rojo si nadie purga.
- **Con el plazo B, una verificación que se alargue puede costar la ventana.**
  Está declarado y es querido: pasado el techo de 90 días se purga y se vuelve a
  capturar. Para la mitad de **contenido** eso es barato —vale cualquier día 2—;
  para la **temporal** significa esperar a otra jornada.
- **F-SPEC-001-1 sigue abierta** para producción, con las tres preguntas de la §6.
  **La ingesta continua no arranca sin resolverla.**
- **Falta un CA que meta la fecha de purga en el informe** (§5). Destino:
  **SPEC-003, antes de su aprobación**, que es la única ventana barata para
  hacerlo. Si el gate lo deja pasar, la fecha vive solo en el ledger y el fichero
  de hallazgos no la lleva.
- **El runbook necesita dos pasos nuevos** (§5). Destino: `sdd-documentalista`,
  junto a lo que SPEC-003 §7 ya le manda.
- **`CLAUDE.md` promete `tests/fixtures/raw/ HTML versionado del replay`** y la §3
  lo prohíbe para HTML real de terceros. Es del humano —se acumula a
  **F-SPEC-001-2**, que ya anota drift en ese fichero—; aquí no se edita.
- **Requiere revisión profesional, y no soy abogado.** En concreto: si el interés
  legítimo del art. 6.1.f necesita una ponderación formal documentada y un
  registro de actividades del art. 30 para esta medición, y si 30 días es
  defendible ante la AEPD para HTML de terceros con nombres dentro. El dictamen
  de `sdd-legal-datos` **tampoco** es asesoramiento profesional y él mismo lo
  dice. Este ADR fija un plazo **groseramente conservador** precisamente porque
  nadie aquí puede afinar el correcto.
- **La advertencia de datos personales sigue siendo condicionada.** Nadie ha visto
  el HTML real. Si al correr la primera ventana resulta que ninguna de las páginas
  capturadas lleva nombres de personas, la justificación RGPD de este plazo se
  debilita —pero el art. 4 TDM lo sigue exigiendo igual, así que **el plazo no
  decae**. Y si lleva **más** datos personales de los previstos, hay que volver a
  `sdd-legal-datos` antes de la segunda ventana.

## Alternativas consideradas

- **7 días (opción A de la §2).** Rechazada por riesgo alto y concreto, no
  teórico: las dos mitades del informe pueden estar separadas por una semana
  antes siquiera de empezar a analizar (SPEC-002 CA-13), y el ciclo de
  verificación de SPEC-002 necesitó tres vueltas. El archivo desaparecería a
  media verificación y CA-7 dejaría de ser ejecutable sobre la ventana que se
  está juzgando. **Sigue disponible**: el gate puede firmarla nombrándola, y el
  resto del ADR no cambia.
- **90 días (opción C de la §2).** Rechazada porque **no compra nada** que B no
  dé —no hay consumidor del archivo a los 60 días— y sí cuesta: tensa el art.
  5.1.e y el art. 4 TDM, y mantiene viva durante un trimestre la exposición de la
  cláusula *browse-wrap* de BeSoccer contra RN-10 que ADR-008 §5 aceptó **para
  una ventana acotada**. 90 días sobrevive en este ADR donde tiene sentido: como
  **techo de la prórroga**, que se paga con una justificación escrita en vez de
  concederse por defecto.
- **Retención indefinida con anonimización del HTML archivado.** Rechazada por
  dos motivos independientes, y el primero basta: **anonimizar el crudo destruye
  RN-10**, cuyo punto entero es que el archivo sea la respuesta *tal como llegó*
  para poder reprocesarla con un parser corregido. Y además exigiría un parser
  fiable para saber qué tachar, que es precisamente lo que la ventana existe para
  poder escribir. Es circular.
- **Purga por objeto en cuanto se parsea.** Es lo correcto en **producción** y
  destructivo en el **spike**: el diseño de dos fases existe para recalibrar los
  extractores **después** de la ventana, «cuantas veces haga falta»
  (F-SPEC-002-3). Purgar al parsear dejaría el instrumento con una sola
  oportunidad de acertar los selectores contra páginas que nadie ha visto.
- **Añadir `delete` al puerto y purgar desde código ahora.** Rechazada por vía,
  no por fondo: es la respuesta buena para producción y **es una spec** —CA,
  batería de contrato contra las dos implementaciones, verificación—, no un
  párrafo de un ADR. Hacerlo aquí movería el contrato de SPEC-001, que está
  `hecho` y mergeada, por debajo de su verificación.
- **Conservar `meta/` tras purgar `objects/`.** Rechazada: no aporta nada que
  `ventana.json` no tenga ya —par, instante, `outcome`, clave— y deja medio
  archivo vivo sin que nadie sepa por qué.
- **Dejarlo como follow-up y correr la ventana ya.** Rechazada, y no es cosa mía:
  **ADR-008 §5.3 ya está firmado** y dice «precondición, no follow-up». Correr
  antes de fijar el plazo contradice un ADR aprobado esta misma semana.
