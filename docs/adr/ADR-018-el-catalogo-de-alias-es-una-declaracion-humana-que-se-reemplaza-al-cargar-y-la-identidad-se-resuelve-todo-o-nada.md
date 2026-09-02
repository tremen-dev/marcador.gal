---
id: ADR-018
tipo: adr
estado: borrador
historial:
  - {estado: borrador, fecha: 2026-09-02, por: sdd-arquitecto}
---
# ADR-018: El catálogo de alias es una declaración humana que se reemplaza al cargar, y la identidad se resuelve todo o nada

- Deciders: propone `sdd-arquitecto` el 2026-09-02, al escribir **SPEC-011**, la
  spec que implementa el `MatchResolver` que SPEC-008 definió y dejó sin
  implementar. **Aprueba: pendiente de gate humano.** Nace en `borrador` y
  ningún rol `sdd-*` puede firmarlo.
- Specs relacionadas: **SPEC-011** (lo origina y lo ejecuta); **SPEC-001**
  (`hecho`, dueña de `team_aliases` en `migrations/0001`, del tipo `TeamAlias`
  y de `resolveConfirmedAlias` / `normalizeAlias` en `src/model/team.ts`, que
  aquí se consumen sin tocarse); **SPEC-008** (`hecho`, define `MatchResolver`
  y prohíbe en su CA-13 tomar la identidad del texto de la fuente); **SPEC-010**
  (`hecho`, calendario declarado, `MatchStore.listByTeams` y el patrón de carga
  registrada que este ADR reutiliza y en un punto contradice a sabiendas); y
  aguas abajo el cron de ingesta —el primer llamante real del resolver—, el bot
  de Telegram —que traerá la vía de proposición por LLM— y el panel.
- Relacionado: **ADR-017** (declaración humana versionada y cargada con CLI: el
  molde), **ADR-014** (ninguna petición a un tercero fuera de `politeFetch`: la
  razón de que aquí no haya ninguna llamada a un LLM), **ADR-016** (esta
  decisión no escribe ningún test de arquitectura; ensanchar `ENTRY_POINTS` es
  un diff con motivo), **ADR-006** (SQL a mano, instantes como cadena `Z`,
  migraciones sin rollback), **ADR-004** (sin proceso vivo: la copia que se lee
  es la de Postgres), **ADR-011 §6** (consumir ficheros de una spec cerrada sin
  tocarlos).

## Contexto

### RN-09 es la puerta, y hoy está cerrada con la llave sin fabricar

RN-09: **nunca se publica un resultado sobre un equipo sin alias confirmado por
una persona**. SPEC-008 lo tradujo a código con una interfaz deliberadamente
sin implementar: `MatchResolver` (`src/ingest/ports.ts`) resuelve la fila de
una fuente a un `MatchId` o a `null`, y «no hay ninguna rama que fabrique un
`MatchId`, normalice por similitud o lo tome del texto de la fuente». El
adaptador ya devuelve las filas sin resolver, enteras, para que una persona las
mire (SPEC-008 CA-13). El calendario ya da los partidos y
`MatchStore.listByTeams` (SPEC-010). Lo que falta es lo de en medio: el
catálogo que une «cómo escribe `ceroacero.es` un equipo» con el `TeamId`
canónico, con la confirmación humana que RN-09 exige.

Sin ese catálogo, la ingesta produce exactamente cero `Observation`: toda fila
cae en `unresolved`. El catálogo de alias no es un refinamiento, es la
condición de que el cron —la spec siguiente— tenga algo que guardar.

### La tabla existe desde SPEC-001; lo que no existe es cómo se llena

`migrations/0001` creó `team_aliases` con RN-09 a nivel de base: clave primaria
`(alias, source, season)`, y `CHECK`s que impiden registrar una confirmación
sin persona (`confirmed_by`/`confirmed_at` obligatorios en `confirmed`,
prohibidos en `proposed`). `src/model/team.ts` fijó la unión discriminada
`proposed`/`confirmed`, la normalización única de comparación —trim, colapso de
espacios internos, NFC; mayúsculas y acentos significativos (gate del
2026-08-29)— y `resolveConfirmedAlias`, que **solo** resuelve alias
confirmados. Nada de eso se reabre. Falta decidir: de dónde salen las filas,
qué pasa al recargar, y cómo se pasa de dos `TeamId` a un `MatchId`.

### La frase «un LLM propone» no obliga a llamar a un LLM

RN-09 y D-4 dicen que un LLM **sirve** para proponer alias, con salida JSON
validada y confirmación humana. Es un permiso con condiciones, no un mandato.
Para el catálogo del spike —36 equipos, una fuente automática— montar la vía
LLM dentro del sistema exigiría una llamada de red a un tercero, y ADR-014 §4
prohíbe pedir a un tercero fuera de `politeFetch` (y los tests de capacidad de
SPEC-009 hacen que esa prohibición muerda sobre todo código nuevo bajo `src/`).
La vía LLM tiene su sitio natural en el bot de Telegram (parseo de mensajes de
corresponsal, ADR-002), que tendrá que decidir su transporte entonces.

### Un alias no es una `Observation`: lo que hace daño no es borrarlo, es conservarlo mal

El calendario declarado carga sin borrar (ADR-017 §2): un partido es un hecho
con historia colgando —`observations` y `decisions` le apuntan por clave
ajena— y borrarlo orfanaría hechos que RN-13 hace permanentes. Un alias es otra
cosa: **configuración de enrutado**. Ninguna tabla le apunta; la `Observation`
ya nace con el `match_id` resuelto y no recuerda qué alias la enrutó. Y el
fallo peligroso es el inverso al del calendario: un alias confirmado **que
sobra** —porque apuntaba al equipo equivocado y se corrigió el fichero— seguiría
enrutando observaciones al partido equivocado mientras exista en la base. La
semántica «reportar y no borrar» que protege a los partidos desprotegería a los
alias.

## Decisión

### §1. El catálogo de alias es una declaración humana por fuente y temporada, y declararlo es confirmarlo

El **catálogo de alias declarado** (término nuevo en `dominio.md`) es un
fichero JSON por fuente y temporada, versionado en el repositorio bajo
`alias/<temporada>/<source_id>.json` (temporada en la forma `2026-27`, como en
`calendario/`), validado con un esquema zod antes de tocar nada, y cargado en
Postgres por una persona con una CLI. Declara la fuente, la temporada, las
entradas `(alias → team_id)` y **quién lo declaró y cuándo**.

**Escribir una entrada en el fichero con tu nombre en `declared_by` ES la
confirmación de RN-09.** Cada entrada cargada aterriza en `team_aliases` con
`status: 'confirmed'`, `confirmed_by` igual al declarante y `confirmed_at`
igual al instante declarado. No hay entradas `proposed` en el fichero: un
borrador sin confirmar es un fichero sin cargar, y su revisión es el diff.

**Ninguna llamada a un LLM forma parte de este mecanismo.** Una persona puede
ayudarse de lo que quiera para redactar el fichero; lo que se carga es lo que
esa persona firmó. La vía de proposición dentro del sistema —estado `proposed`,
salida JSON validada, confirmación posterior— llega con el bot, y **la única
transición a `confirmed` seguirá siendo un acto de una persona**.

### §2. La carga reemplaza el catálogo de su fuente y temporada, entero, en una transacción, y queda registrada

- La copia que **lee** el resolver es la de Postgres (ADR-004); el fichero es
  lo que se edita, se revisa en un diff y se versiona — como en ADR-017 §2.
- La carga, en **una transacción**: borra todas las filas de `team_aliases` de
  ese `(source, season)` —las `proposed` incluidas, ver §*Lo que este ADR no
  decide*— e inserta exactamente las del fichero. Después de cargar, **el
  catálogo vigente de esa fuente y temporada es exactamente lo que el fichero
  declara**: un alias retirado del fichero deja de resolver en esa misma carga.
  Es la contradicción deliberada con ADR-017 §2, por el motivo del
  §*Contexto*: un partido es un hecho; un alias es enrutado.
- Las filas de **otras fuentes u otras temporadas no se tocan**.
- Un `team_id` del fichero que no exista en `teams` **rechaza la carga
  entera**: los equipos los declara el calendario (SPEC-010), no este fichero.
- **Cada carga queda registrada** en `alias_loads` (`migrations/0004`):
  fuente, temporada, quién declaró, cuándo, `loaded_at`, digest sha256 del
  fichero, recuentos. *Append-only* con el `reject_amendment` de `0001`. La
  auditoría de «quién confirmó qué» vive en tres sitios que se corroboran:
  las filas vigentes (`confirmed_by`), el registro de cargas y el historial de
  git del fichero.
- Si cualquier paso falla, **nada queda escrito**, ni la fila de carga.

### §3. La identidad se resuelve todo o nada: catálogo confirmado, par ordenado, exactamente un partido

El resolver (`src/alias/resolver.ts`) implementa el `MatchResolver` de SPEC-008
así, y solo así:

1. Normaliza el nombre que escribió la fuente con `normalizeAlias` y lo busca
   con `resolveConfirmedAlias` (`src/model/team.ts`, SPEC-001): **solo resuelve
   un alias `confirmed`**, con coincidencia exacta tras la normalización única
   ya decidida — sin similitud, sin ignorar mayúsculas ni acentos.
2. Si el nombre de casa **y** el de fuera resuelven a `TeamId`, pregunta al
   calendario: `MatchStore.listByTeams(competitionId, homeId, awayId)`.
3. Si la lista tiene **exactamente un** partido, ese es el `MatchId`. Con cero
   o con más de uno, la fila queda **sin resolver** (`null`): la ambigüedad no
   se desempata por hora, por cercanía ni por ninguna heurística — se le
   devuelve entera a una persona (SPEC-008 CA-13).

Lo que el resolver **no** hace, escrito para que nadie lo añada por ayudar: no
compara contra `canonical_name` («coincidir con el nombre canónico» sin alias
confirmado sería el sistema emparejando lo que nadie confirmó — RN-09); no usa
`source_ref` ni `kickoff` de la fila; no lee el reloj ni la red. Con el mismo
catálogo, el mismo calendario y los mismos bytes, resuelve lo mismo: el replay
determinista de SPEC-008 CA-10 se conserva.

### §4. Lo que garantiza la base y lo que solo garantiza el fichero

La clave primaria de `team_aliases` es sobre el **texto exacto** del alias: dos
entradas que difieren solo en espacios internos o en forma Unicode («UD
Ourense» / «UD  Ourense») serían dos filas para la base y **una misma cosa**
para `normalizeAlias`, y podrían apuntar a equipos distintos. Ese conflicto lo
cierra **el esquema del fichero** —rechaza dos entradas cuya forma normalizada
colisione— y no la base, igual que el caso cruzado del calendario (ADR-017 §3).
Una fila metida a mano por SQL puede violarlo; el catálogo declarado no.

### Lo que este ADR no decide

- **Dónde viven las proposiciones del bot.** Cuando el bot proponga alias
  (`proposed`, RN-09), tendrá que contar con que una recarga del fichero
  reemplaza el catálogo entero de su fuente y temporada. Si sus proposiciones
  deben sobrevivir a una recarga, esa spec decide dónde viven; este ADR solo
  fija que hoy nada escribe `proposed` y que la carga no las respeta.
- **El transporte de la vía LLM** (qué API, con qué llave, por qué camino de
  red). Es del bot, y tendrá que reconciliarse con ADR-014.
- **La interfaz de confirmación del panel.** El panel podrá confirmar alias sin
  editar ficheros; cómo, lo dice su spec.
- **Vaciar un catálogo.** El esquema exige al menos una entrada: reemplazar por
  la lista vacía —borrarlo todo— es un acto distinto de cargar y hoy no tiene
  spec, como borrar partidos (ADR-017 §2).
- **Los alias de `futgal.es`** el día que sea capturable, y los de cualquier
  fuente nueva: cada una es un fichero más, no un cambio de mecanismo.

## Consecuencias

### Positivas

- **RN-09 queda ejecutable de punta a punta**: el adaptador entrega nombres tal
  como la fuente los escribe, el catálogo los une a equipos que una persona
  firmó, y lo que no une vuelve entero a una persona. Cero heurística.
- **El catálogo es auditable como el calendario**: un commit, una fila en
  `alias_loads` con persona y digest, y las filas vigentes con `confirmed_by`.
- **Un alias corregido deja de hacer daño en la misma carga** — el fallo
  peligroso del reemplazo es el que la semántica «no borrar» habría dejado vivo.
- **Sin dependencia nueva y sin red**: el cargador no hace peticiones (RN-11 no
  se ejerce) y no hay cliente LLM que custodiar.
- **El cron hereda un resolver determinista**: puede reprocesar una jornada
  desde el archivo (RN-10) con la garantía de que el resultado solo depende de
  catálogo, calendario y bytes.

### Negativas / follow-ups

- **La recarga arrasa lo que no vino del fichero.** Hoy es exactamente lo
  querido; el día que el bot escriba `proposed`, es una mina enterrada con
  cartel — está en §*Lo que este ADR no decide* y tendrá que resolverlo la spec
  del bot.
- **Confirmar exige editar un fichero y cargarlo desde un portátil con
  credenciales.** Durante una jornada en directo, un alias nuevo que aparezca
  no se confirma desde el móvil: hasta el panel, la fila cae en `unresolved` y
  se pierde señal. Es cobertura degradada **por catálogo**, y la declaración de
  degradación de la cifra tiene que poder distinguirla.
- **Dos copias pueden divergir** (fichero editado sin recargar), como en
  ADR-017; el digest de `alias_loads` es lo que permite detectarlo, nada lo
  avisa solo.
- **Mayúsculas y acentos significativos** obligan a declarar cada variante
  tipográfica real de la fuente. Es una decisión ya firmada (SPEC-001 CA-5,
  gate 2026-08-29) que este ADR hereda y no reabre; el precio se paga aquí, en
  entradas de fichero.
- **`migrations/0004` es irreversible en la práctica** (ADR-006): deshacer es
  escribir `0005`.

## Alternativas consideradas

- **Montar la vía LLM de proposición dentro de esta pieza.** Rechazada: exige
  una petición de red fuera de `politeFetch` (ADR-014 §4) y una llave que
  custodiar, para redactar un fichero de ~40 líneas que una persona revisa
  entero de todas formas. RN-09 permite el LLM, no lo exige; su sitio es el
  bot.
- **Resolver contra `canonical_name` cuando la fuente escribe el nombre
  canónico exacto.** Rechazada: es el sistema emparejando un equipo que nadie
  confirmó — la lectura fuerte de RN-09 que SPEC-008 ya fijó en su CA-13. Que
  la fuente acierte el nombre no es una confirmación; declarar el alias
  «UD Ourense → ud-ourense» cuesta una línea.
- **Cargar sin borrar, reportando alias «huérfanos» como el calendario.**
  Rechazada por el §*Contexto*: un alias no es un hecho con historia colgando,
  es enrutado vigente, y conservar uno corregido es seguir enrutando mal. La
  simetría con ADR-017 sería estética; la asimetría es de fondo.
- **Desempatar por `kickoff` cuando `listByTeams` devuelve varios partidos.**
  Rechazada: las horas cambian —es la premisa de ADR-017 §3— y usar el reloj
  rompería el replay determinista. En liga a doble vuelta la lista tiene cero o
  uno; si un día hay varios, la fila sin resolver es la respuesta honesta.
- **Alias dentro del fichero del calendario.** Rechazada: ejes distintos. El
  calendario es por competición y lo declara quien lee a la RFGF; el catálogo
  es por **fuente** y temporada, cambia con otra cadencia (cuando la fuente
  cambia de grafía) y crecerá una entrada por fuente nueva. Mezclarlos obligaría
  a recargar partidos para tocar un alias.
- **Editar `team_aliases` por SQL o desde el panel, sin fichero.** Rechazada
  hoy por lo mismo que en ADR-017: sin diff no hay revisión, y el panel no
  existe. Cuando exista, su spec decide (§*Lo que este ADR no decide*).
- **Un estado `revoked` en vez de borrar.** Rechazada: obliga a ampliar la
  unión de `TeamAlias` en `src/model/team.ts` —fichero de una spec `hecho`
  (ADR-011 §6)— para representar algo que ningún consumidor necesita leer: un
  alias revocado y uno inexistente se comportan igual, y la auditoría ya vive
  en git y en `alias_loads`.
- **Normalizar el alias al guardarlo** (guardar la forma normalizada en vez del
  texto exacto). Rechazada: el catálogo debe poder mostrarse tal como la fuente
  escribe (`SourceRow` entrega el texto «as the source writes it», SPEC-008), y
  la normalización es una función de comparación, no de almacenamiento — es la
  frontera que SPEC-001 CA-5 trazó y que aquí se respeta cerrando la colisión
  en el esquema del fichero (§4).

<!-- REGLA: un ADR aceptado es INMUTABLE. Para cambiar la decisión, escribe otro ADR que lo supersede (estado del viejo -> bloqueada + nota "superseded por ADR-NNN"). -->
