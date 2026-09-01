---
id: ADR-017
tipo: adr
estado: borrador
historial:
  - {estado: borrador, fecha: 2026-09-01, por: sdd-arquitecto}
---
# ADR-017: Calendario declarado a mano y persistencia del modelo canónico

- Deciders: propone `sdd-arquitecto` el 2026-09-01, al escribir **SPEC-010**, la
  primera spec de EPIC-002 que mete el modelo canónico en Postgres y la primera
  que necesita un calendario. **Aprueba: pendiente de gate humano.** Nace en
  `borrador` y ningún rol `sdd-*` puede firmarlo.
- Specs relacionadas: **SPEC-010** (la origina y la ejecuta); **SPEC-001**
  (`hecho`, dueña de los puertos `ObservationStore` / `DecisionStore` y de
  `migrations/0001`, cuyo F-SPEC-001-3 esta decisión cierra sin reabrirla);
  **SPEC-008** (`hecho`, define `MatchResolver` sin implementarlo y fija que una
  fuente es configuración); y aguas abajo el catálogo de alias, el cron, el motor
  de decisiones, el snapshot y la instrumentación de las cuatro cifras, que leen
  y escriben lo que aquí se decide.
- Relacionado: **ADR-004** (Vercel: sin disco, sin proceso vivo), **ADR-006**
  (SQL a mano, sin ORM, instantes como cadena ISO 8601 UTC, migraciones sin
  rollback), **ADR-008 §1** (la fuente oficial no es capturable), **ADR-009 §6**
  (la retención de producción sigue sin fijar, y es precondición de la ingesta
  continua), **ADR-014 §3.2** (las 6 h del `robots.txt` se apoyaban en «el
  refresco que la épica fija para el calendario»), **ADR-016** (cómo se demuestra
  una frontera de capacidad; aquí no se escribe ninguna).

## Contexto

### El denominador de la cobertura lo declara una persona, y nadie ha dicho cómo

EPIC-002 mide **cobertura** como «% de partidos con al menos una fuente viva
durante el juego», y su tabla de criterios dice, en la columna *qué la degrada*,
que **«sin calendario oficial capturado, la lista de partidos la declara una
persona a mano. Hay que decirlo junto al número»**. La fuente oficial no es
capturable (ADR-008 §1). La única fuente automática, `ceroacero.es`, publica un
calendario, pero usarlo como denominador haría **circular** la cifra —se mediría
la cobertura de la única fuente contra la lista de partidos de esa misma
fuente— y además tomaría de la fuente la **identidad** del partido, que es lo
que SPEC-008 CA-13 prohíbe hacer con su texto (RN-09).

Así que el calendario es una **declaración humana**. Falta decidir su forma, su
domicilio y su identidad, y las tres cosas constriñen a todas las specs que
vienen detrás.

### Dónde vive: no hay disco, y hay dos copias

En Vercel no hay sistema de ficheros persistente ni proceso vivo (ADR-004). El
cron y el motor leerán el calendario desde Postgres, porque `matches` es además
la tabla a la que apuntan las claves ajenas de `observations` y `decisions`
(`migrations/0001`). Pero una persona no escribe filas SQL: escribe un fichero.
Hay dos copias por construcción, y hay que decir cuál es la verdad y cómo se
reconcilian.

### «Refresco cada 6 h» ya no tiene objeto

La propuesta original del spike y `_epica.md` de EPIC-002 dicen «cron de
planificación y calendario, cargado a mano, **con refresco cada 6 h**». El
refresco venía de la propuesta de agosto —«calendario refrescado cada 6 h (los
horarios cambian)»— y presuponía **una fuente de la que refrescar**. Hoy no la
hay: ni la oficial (ADR-008 §1) ni la única automática (por circularidad). Lo que
cambia horarios es una persona editando el fichero, y eso no tiene cadencia.
**ADR-014 §3.2** ancló las 6 h de vigencia del `robots.txt` en esa cadencia; el
número sigue en pie por lo que su propio texto dice —«revisable con evidencia;
hoy no la hay»—, pero pierde el ancla, y conviene decirlo aquí en vez de dejar
que alguien lo descubra.

### La identidad de un partido tiene que sobrevivir a la recarga

`tests/db/_harness.ts` y `tests/fixtures/model.ts` usan `MatchId` escritos a
mano y distintos entre sí. Cuando el calendario se recargue —porque un horario
cambió, que es lo normal—, cada `Observation` ya escrita apunta a un `match_id`
por clave ajena, y **RN-13 prohíbe corregirla**. Si la recarga cambiara el `id`
de un partido, las observaciones quedarían huérfanas **para siempre**. La
identidad tiene que derivarse de algo que no cambie cuando cambia la hora.

### Dos instancias, una `Decision` vigente

`dominio.md` define `Decision` como log *append-only* cuya última versión por
partido es la vigente, y `migrations/0001` la protege con la clave primaria
`(match_id, version)`. En Vercel cada tick es una instancia nueva (ADR-004), y
F-SPEC-008-V13 midió lo que pasa cuando dos instancias creen ser la única: diez
peticiones en un minuto. Con las `Decision` el equivalente es dos instancias
calculando el mismo `version` siguiente, o una calculándolo con un hueco. Quién
arbitra eso —la base o el llamante— es una decisión que el motor hereda.

### Y una consecuencia de SPEC-008 CA-10 que nadie ha recogido

El replay es determinista: los mismos bytes y el mismo resolver producen la
misma `Observation`, **`id` incluido**. Eso es una virtud hasta que alguien la
guarda dos veces: reprocesar una jornada desde el archivo tiene que ser
inofensivo, y hoy no está dicho qué hace `append` con un `id` que ya existe.

## Decisión

### §1. El calendario es una declaración humana, versionada, que no se obtiene de ninguna fuente por red

El **calendario declarado** (término nuevo en `dominio.md`) es un fichero JSON
por competición y temporada, escrito por una persona a partir del calendario
público de la RFGF, versionado en el repositorio bajo
`calendario/<temporada>/<competition_id>.json`, y validado con un esquema zod
antes de tocar nada. Contiene la competición, los equipos con su **nombre
canónico de la RFGF**, los partidos por jornada con hora local y campo, y **quién
lo declaró y cuándo**.

**No se obtiene por red de ninguna fuente**, ni hoy ni cuando `futgal.es` sea
capturable: si algún día se automatiza, es una spec nueva y un ADR nuevo, porque
cambia el denominador de una cifra del go/no-go. La regla RN-11 no se toca porque
no se ejerce: el cargador no hace ninguna petición.

### §2. Postgres es la copia viva; el fichero es la verdad editorial; la carga es un acto de una persona y queda registrado

- La copia que **leen** el cron, el resolver, el motor y el snapshot es la de
  Postgres (ADR-004). El fichero es lo que **se edita, se revisa en un diff y se
  versiona**.
- La carga la ejecuta una persona con una CLI (`npm run calendario:cargar`),
  desde su máquina y contra `DATABASE_URL`. En Vercel no hay disco desde el que
  cargar ni shell desde el que hacerlo.
- La carga es un **upsert transaccional**: los partidos nuevos se insertan; de
  los existentes se actualizan **solo `kickoff` y `venue`**; un partido que está
  en la base y no en el fichero **se reporta y no se borra**. Borrar es un acto
  distinto de cargar, y hoy no tiene spec.
- **Cada carga queda registrada** en una tabla `calendar_loads` —quién declaró,
  cuándo, qué fichero (digest), qué jornadas, cuántos partidos— que es
  *append-only* como `observations`. Es la evidencia que la declaración de
  degradación de la cobertura tiene que poder citar: «el denominador lo declaró
  X el día Y desde el fichero Z».
- **«Refresco cada 6 h» se reinterpreta**: refrescar el calendario es que una
  persona lo recargue cuando cambie; el cron lee la copia de Postgres en cada
  tick y no tiene nada que refrescar. Las 6 h de ADR-014 §3.2 se quedan como
  están, por su propio motivo y no por éste.

### §3. La identidad de un partido se deriva de lo que no cambia, y la base la protege

`MatchId = <competition_id>-<temporada>-j<round>-<home_id>-<away_id>`, con la
temporada en la forma `2026-27` (la barra de `2026/27` no cabe en un
identificador) y los `TeamId` como los declara el fichero, en *kebab-case*.
Ejemplo: `futgal-preferente-g1-2026-27-j1-ud-ourense-rc-celta-b`.

- La identidad `(competition_id, round, home_id, away_id)` es **inmutable en la
  base**: un trigger rechaza cambiarla. Cambiar la identidad es otro partido; el
  viejo se queda y la carga lo reporta como huérfano.
- `kickoff` y `venue` son **mutables**: un aplazamiento con nueva fecha es el
  mismo partido con otra hora, y las observaciones que ya tenía siguen siendo
  suyas.
- Un equipo juega **como mucho un partido por jornada**. La base lo garantiza
  donde un índice único llega —dos veces de local, o dos de visitante, en la
  misma jornada— y el cargador lo garantiza entero, incluido el caso cruzado
  (local en un partido y visitante en otro de la misma jornada). El caso cruzado
  no baja a la base **a sabiendas**: la semilla de `tests/db/_harness.ts`
  (SPEC-001, `hecho`) usa exactamente esa forma —los dos mismos equipos, ida y
  vuelta, en la jornada 23— para sus pruebas de RN-12, y mover esa semilla es
  tocar el soporte de una spec cerrada por una ganancia que el cargador ya da.
- **No se presume el formato de liga a doble vuelta.** Es lo que Preferente
  Futgal y Terceira RFEF son, pero la base no lo impone: la consulta por
  `(competition_id, home_id, away_id)` devuelve una lista, no un partido, y quien
  la consuma decide.

### §4. La hora se escribe local y se normaliza en el borde

El fichero lleva `kickoff` como hora de pared en `Europe/Madrid` (`"2026-09-06
17:00"`), porque es como la publica la RFGF y como la lee una persona. El
cargador es **el borde de entrada** de ADR-006: convierte a cadena ISO 8601 UTC
con `Z` y **nada más adentro vuelve a ver una hora local**. Las horas que no
existen (el hueco del cambio a verano) o son ambiguas (la hora repetida del
cambio a invierno) se **rechazan nombrando la fila**, en vez de resolverse en
silencio. La conversión usa `Intl` de Node, sin dependencia nueva; el literal
`Europe/Madrid` va en el fichero y es una lista cerrada de **un** valor: un
segundo valor es un diff con motivo, no un arbitraje.

### §5. La persistencia del modelo canónico: los puertos de SPEC-001, tal cual, con dos semánticas nuevas escritas

- `ObservationStore` y `DecisionStore` se implementan **contra sus puertos de
  `src/db/ports.ts` sin cambiarlos** (SPEC-001 CA-6 fijó su superficie mínima y
  está `hecho`). Lo que SPEC-010 necesite además —leer el calendario— va en un
  puerto **nuevo** (`MatchStore`) en un fichero nuevo, no en el de SPEC-001.
- Toda lectura **se parsea con el esquema zod al salir de la base** y toda
  escritura **se parsea al entrar** (ADR-001, ADR-006 §*Negativas*: `postgres.js`
  devuelve `any`). Los instantes salen como cadena `Z`; `Date` no aparece.
- **`ObservationStore.append` es idempotente para la misma `Observation`** y
  **rechaza con error nombrado** una `Observation` distinta con el mismo `id`.
  Es la misma regla que `RawKeyConflictError` en el raw store —«una clave ya
  escrita no se sobreescribe en silencio con bytes distintos»— y es lo que hace
  inofensivo reprocesar una jornada (SPEC-008 CA-10) sin aflojar RN-13.
- **Las versiones de `Decision` son contiguas y lo arbitra la base.** Un trigger
  exige `version = max(version) + 1` por partido (1 para la primera), y la clave
  primaria ya existente hace que, de dos instancias que intenten escribir la
  misma versión a la vez, **exactamente una** gane. El motor recibe un error
  distinguible y decide qué hacer con él; **no calcula su versión con la
  esperanza de estar solo**, que es la forma de F-SPEC-008-V13 aplicada a la
  entidad que llega a la pantalla.

### §6. Lo que este ADR no decide

- **Ni el catálogo de alias ni `MatchResolver`.** Aquí se da la mitad del
  calendario que el resolver necesita —buscar un partido por competición y par de
  equipos—; unir nombres de fuente con `TeamId` es RN-09 y otra spec.
- **Ni las ventanas del cron.** `MatchStore` ofrece «partidos con `kickoff` en
  un intervalo»; qué intervalo abre una ventana y con qué frecuencia se sondea es
  de la spec del cron.
- **Ni la retención de producción.** ADR-009 §6 la deja como **precondición de la
  ingesta continua**, y SPEC-010 no ingiere: escribe repositorios y un calendario.
  La spec que arranque el cron es la que no puede aprobarse sin ese ADR.
- **Ni la frontera de RN-08** («solo el motor escribe una `Decision`»). Se
  demuestra como ADR-016 manda, cuando exista el motor y en su spec. Aquí nace la
  capacidad; la frontera se traza sobre quien la use.

## Consecuencias

### Positivas

- **El denominador de la cobertura es auditable.** Un commit con el fichero, una
  fila en `calendar_loads` con la persona y el digest, y la cifra puede llevar al
  lado, con datos y no con una frase, «quién declaró la lista y cuándo».
- **RN-11 no se toca porque no se ejerce.** No hay ninguna petición nueva a
  ningún tercero.
- **Las observaciones sobreviven a los cambios de horario**, que son lo normal en
  fútbol modesto: la identidad no depende de la hora.
- **El motor nace con concurrencia optimista gratis** y con el árbitro en el único
  sitio que puede serlo entre instancias sin proceso vivo.
- **F-SPEC-001-3 se cierra sin reabrir SPEC-001**: los puertos no cambian; se
  implementan.
- **Sin dependencia nueva**: `Intl` ya está en Node.

### Negativas / follow-ups

- **Una persona es un punto único de fallo del denominador.** Un horario que
  cambió y nadie recargó abre la ventana a la hora equivocada, y eso es
  cobertura perdida **por el calendario, no por la fuente**. La declaración de
  degradación de la cifra tiene que poder distinguirlo, y `calendar_loads` es lo
  que le permite decir cuándo se cargó por última vez.
- **Dos copias pueden divergir.** El digest en `calendar_loads` dice qué fichero
  está cargado; nada avisa solo de que el fichero del repositorio ya no es ése.
  Es del mismo tipo que las barreras de EPIC-MEJORA «que no muerden», y se anota
  como tal.
- **Cargar exige credenciales de producción en el portátil de una persona.** No
  hay runbook; es de `sdd-documentalista`, y hasta que exista, la carga real es
  un acto sin procedimiento escrito.
- **Se versiona en el repositorio una lista de partidos publicada por la RFGF,
  escrita a mano.** No es HTML de terceros (ADR-009 §3) y la épica ya decidió que
  la lista la declara una persona, pero `sdd-legal-datos` **no ha dictaminado**
  sobre copiar a mano un calendario federativo. Se recomienda pedirlo **antes de
  commitear el primer fichero real**, no antes de aprobar el mecanismo.
- **`migrations/0003` es irreversible en la práctica** (ADR-006): dos índices
  únicos, dos triggers y una tabla. Deshacer es escribir `0004`.
- **Renombrar el `id` de un equipo renombra todos sus partidos.** El cargador
  reporta los huérfanos; no los arregla. Es el precio de una identidad derivada,
  y es preferible a una identidad aleatoria que orfana en silencio.
- **El caso cruzado del «un partido por jornada» solo lo cierra el cargador.**
  Una fila insertada a mano por SQL puede violarlo. Está dicho arriba y en la
  spec; si algún día hace falta bajarlo a la base, hay que tocar la semilla de
  SPEC-001 por la vía de ADR-011 §6.
- **El trigger de contigüidad es una lectura más por inserción de `Decision`.**
  A una `Decision` por partido y minuto es despreciable; se anota por si el
  volumen cambia.

## Alternativas consideradas

- **Derivar el calendario de la página de `ceroacero.es`, que lo publica.**
  Rechazada por tres motivos independientes: hace **circular** la cobertura (la
  única fuente medida contra su propia lista), toma la **identidad** del partido
  del texto de la fuente —lo que SPEC-008 CA-13 prohíbe por RN-09—, y convierte
  «medición» en construir un conjunto de datos a partir de un tercero, que es la
  línea que ADR-008 §5 no quiere cruzar.
- **Calendario solo en Postgres, editado por SQL o desde el panel.** Rechazada:
  sin diff no hay revisión ni reproducibilidad, y el panel no existe.
- **Calendario solo como fichero empaquetado en el despliegue, leído en
  ejecución.** Es posible en Vercel —el JSON viajaría con el bundle— y se
  rechaza igual: `observations` y `decisions` apuntan a `matches` por clave
  ajena, así que las filas tienen que existir en la base de todas formas; cada
  cambio de horario exigiría un despliegue; y no quedaría registro de quién
  declaró qué.
- **Identidad aleatoria (UUID) por partido.** Rechazada: la recarga crea
  huérfanos y RN-13 los hace permanentes.
- **Que el llamante calcule `version` sin guardián en la base.** Rechazada por
  ADR-004 y por F-SPEC-008-V13: entre instancias sin proceso vivo, el único
  árbitro posible es la base.
- **Ampliar los puertos de SPEC-001 con los métodos nuevos.** Rechazada aquí:
  `src/db/ports.ts` es el contrato de una spec `hecho`, y una capacidad nueva
  cabe en una interfaz nueva. Es el patrón de ADR-011 §6 aplicado a un puerto.
- **Una librería de zonas horarias (`luxon`, `date-fns-tz`).** Rechazada: una
  dependencia —y una entrada con superficie y motivo en la lista de SPEC-008
  CA-2.3— para una conversión que `Intl` ya hace.
- **Hora UTC en el fichero.** Rechazada: la RFGF publica hora local, y obligar a
  una persona a restar una o dos horas según el mes es el tipo de error que no
  hace ruido. Mejor que la máquina se equivoque a gritos que la persona en
  silencio.
- **`append` de `Observation` que falle siempre ante un `id` repetido.** Rechazada
  porque convierte el replay determinista de SPEC-008 CA-10 en una fuente de
  errores rutinarios, y obliga a cada llamante a comprobar antes de escribir —dos
  pasos donde cabe otra instancia—. Fallar solo cuando el contenido difiere es lo
  que RN-13 pide.

<!-- REGLA: un ADR aceptado es INMUTABLE. Para cambiar la decisión, escribe otro ADR que lo supersede (estado del viejo -> bloqueada + nota "superseded por ADR-NNN"). -->
