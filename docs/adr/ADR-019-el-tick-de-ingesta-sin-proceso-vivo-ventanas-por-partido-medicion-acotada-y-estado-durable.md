---
id: ADR-019
tipo: adr
estado: aprobada
historial:
  - {estado: borrador, fecha: 2026-09-02, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-09-02, por: Alberto Fojo}
aprobada-por: Alberto Fojo
---
# ADR-019: El tick de ingesta sin proceso vivo — ventanas por partido, medición acotada y estado durable

- Deciders: propone `sdd-arquitecto` el 2026-09-02, al escribir **SPEC-012**, la
  spec que despliega lo primero que pide a un tercero. **Aprueba: pendiente de
  gate humano.** Nace en `borrador` y ningún rol `sdd-*` puede firmarlo.
- Specs relacionadas: **SPEC-012** (lo origina y lo ejecuta); **SPEC-008**
  (`hecho`: el adaptador que este tick conduce, y CA-14, cuyo estado durable
  del ritmo este ADR reutiliza tal cual); **SPEC-009** (`hecho`: la frontera de
  capacidad, precondición explícita de desplegar esto); **SPEC-010** (`hecho`:
  `MatchStore.listKickoffsBetween`, escrita para este consumidor); **SPEC-011**
  (`hecho`: el `MatchResolver` real que el tick cablea); y aguas abajo el motor,
  el snapshot y la instrumentación de las cifras, que leen lo que el tick
  persiste.
- Relacionado: **ADR-004** (Vercel: cron a 1/min, sin proceso vivo, sin disco),
  **ADR-008 §5.2** («un sondeo continuo sobre muchas competiciones *es* el
  art. 7.5 y ahí no hay lectura benigna»), **ADR-009 §6** (la ingesta continua
  no arranca sin decisión de retención — la resuelve **ADR-020**, gemelo de
  éste), **ADR-014** (la cortesía tiene un solo dueño; §3.2 las 6 h del
  `robots.txt`, contabilizadas aparte), **ADR-017** (el calendario en Postgres
  es lo que el cron lee), **RN-06**, **RN-08**, **RN-10**, **RN-11**.

## Contexto

### No hay proceso vivo, y ya sabemos qué pasa cuando se olvida

ADR-004: la ingesta va en **Vercel Cron a 1/minuto** y cada tick es **una
instancia nueva**. Todo estado que viva en un campo de instancia nace vacío en
cada arranque en frío. Eso no es una hipótesis: **F-SPEC-008-V13 lo midió**
—diez ticks, diez peticiones al mismo par en el mismo minuto— y SPEC-008 CA-14
lo cerró para el **ritmo** de RN-11 con `request_rhythm` (`migrations/0002`) y
un `takeTurn` atómico. El cron hereda un limitador que ya sobrevive al proceso.

**Pero el ritmo no era el único estado en memoria.** `RobotsGate`
(`src/polite/policy.ts`) cachea la política de cada origen y el sello de su
último intento **en un `Map` de instancia**, con vigencia de 6 h (ADR-014
§3.2). Dentro de un proceso eso cumple SPEC-008 CA-6 («dentro de las 6 h no
vuelve a pedirlo, aunque haya decenas de ticks»). Con una instancia nueva por
tick, la caché nace vacía **cada minuto**: el gate pediría el `robots.txt` del
origen en cada arranque en frío — hasta **una petición de robots por minuto y
origen**, que es exactamente la descortesía que su propio comentario prohíbe
(«asking too much is discourtesy too»). Es F-SPEC-008-V13 otra vez, un módulo
más allá, y hoy es latente por el mismo motivo de siempre: nada de esto se ha
desplegado. Deja de serlo el día del cron, que es esta spec.

### Un cron a 1/minuto no puede pedir siempre

RN-11 da el techo por par (fuente, competición), pero el techo no es el plan:
sondear las dos competiciones 24/7 son ~2.880 peticiones/día a `ceroacero.es`
casi todas sin partido detrás, y convierte «medición» en el sondeo continuo
sobre el que ADR-008 §5.2 dice que **no hay lectura benigna**. La épica lo fija
de entrada: «las ventanas por partido se calculan **dentro del tick**». Falta
decidir qué es una ventana, con qué números, y qué acota el conjunto de
jornadas — porque un calendario cargado con 34 jornadas no puede significar
ocho meses de sondeo automático bajo el nombre de «medición».

### Lo que el tick tiene que dejar escrito

Las cifras de la épica se calculan sobre filas. La **cobertura** («% de
partidos con al menos una fuente viva durante el juego») sale de
`observations`; pero la **lista de fallos observados** —el otro entregable— y
la auditoría de por qué un minuto no produjo datos (robots denegado, fallo de
red, fila irresoluble) no salen de ningún sitio: los logs de Vercel son
efímeros y no son un artefacto del proyecto. Sin registro durable de intentos,
un hueco en las observaciones es indistinguible de un cron caído.

## Decisión

### §1. El cron es una ruta HTTP autenticada que delega, y falla cerrado

Vercel Cron, declarado en `vercel.json` con `schedule: "* * * * *"`, invoca
**una** ruta del App Router (`src/app/api/cron/ingest`). La ruta:

1. Exige `Authorization: Bearer <CRON_SECRET>`. Sin la variable configurada o
   sin el header exacto, responde 401 y **no hace ningún trabajo**: ni turno,
   ni petición, ni fila. El daño de un endpoint abierto está ya contenido por
   el ritmo durable (nadie puede provocar más de 1 petición/minuto por par),
   pero un endpoint que cualquiera puede disparar es un registro de intentos
   que cualquiera puede engordar.
2. **Delega entera** en `src/ingest/`: construye las implementaciones durables
   (Postgres, Blob) y llama a la función del tick. La lógica no vive en la
   ruta, y eso mantiene al tick bajo el alcance del test de arquitectura de
   SPEC-008 CA-12 (`src/ingest/` no menciona `DecisionStore`) sin escribir uno
   nuevo.
3. Devuelve el resumen del tick como JSON. Es diagnóstico, no API pública.

### §2. La ventana por partido: `[kickoff − 10 min, kickoff + 150 min)`

Un partido está **en ventana** en el instante `t` si
`kickoff − PRE ≤ t < kickoff + POST`, con:

- **`PRE` = 10 minutos.** RN-06 permite `scheduled → live` desde kickoff − 2
  min; empezar a mirar 10 min antes da margen a adelantos de saque y produce
  las primeras observaciones `scheduled` con la fuente ya viva.
- **`POST` = 150 minutos.** Un partido dura ~105–115 min con descanso; RN-06
  marca *pendente de confirmar* a kickoff + 110 sin señal; y la métrica de
  latencia exige el resultado final en < 10 min, así que hay que seguir
  mirando después del pitido. 150 min cubre prórrogas de horario y la
  publicación tardía del final con 35–40 min de holgura sobre el umbral de
  RN-06.

**Los dos números son elegidos, no medidos** — como las 6 h de ADR-014 §3.2 —
y por eso viven como **constantes nombradas en un solo sitio** de
`src/ingest/`, revisables con la evidencia de la primera jornada delante.
Cambiarlos es un diff de una línea, no un arbitraje.

**Un par (fuente, competición) es elegible en un tick** si al menos un partido
de esa competición está en ventana. La consulta es
`MatchStore.listKickoffsBetween(t − POST, t + PRE)` —el intervalo exacto cuyos
kickoffs tienen a `t` en ventana— agrupada por competición. Un par sin partido
en ventana **no gasta turno, no produce petición y no deja registro**: el
silencio programado no es cobertura perdida.

### §3. Medición acotada: el tick solo mira jornadas declaradas

El tick solo considera partidos cuyo `kickoff` cae dentro de una **ventana de
medición declarada**: una lista cerrada de intervalos `[from, to)` en cadenas
ISO 8601 UTC, versionada en `src/ingest/` junto a las constantes de §2, **cada
intervalo con su motivo escrito** («jornada N de medición, cargada el …»),
como las entradas de `ALLOWED_PACKAGES` (ADR-016 §3.2 por analogía). Fuera de
toda ventana de medición, el cron no pide nada, esté el calendario cargado
entero o no.

Esto es lo que hace verdadera la frase «es medición, no producción» (RN-11)
**en la forma del código y no en la intención**: el despliegue es
estructuralmente incapaz de sondear la temporada entera. La lista nace
**vacía**; añadir la primera jornada real es un diff con motivo, y su
precondición operativa —el dictamen de `sdd-legal-datos` sobre `ceroacero.es`
en régimen de jornada, la pregunta abierta de SPEC-008 notas §7— va escrita en
SPEC-012 y en el runbook, no aquí. La lista es también lo que ancla la
retención de **ADR-020**: cada intervalo declarado es una jornada de medición
con su fecha de purga.

Si algún día la lista deja de ser una lista —si la medición quiere volverse
ingesta continua— este mecanismo no se ensancha: se escribe **el ADR de
producción** que ADR-009 §6 exige, con retención automática y dictamen legal
delante.

### §4. El estado durable: el ritmo ya está; la vigencia del robots se reparte entre el archivo y el turno

El **ritmo** de RN-11 ya es durable (SPEC-008 CA-14, `request_rhythm`); el
tick lo usa tal cual y no añade nada.

La **vigencia del `robots.txt`** pasa a ser durable con las piezas que ya
existen, repartida según lo que cada una recuerda de verdad — la misma
distinción que el ledger de SPEC-008 usó para elegir tabla y no archivo:

- **El archivo recuerda lo que volvió.** La política vigente de un origen es
  el `robots.txt` **más reciente del raw store** (`RawStore.list` bajo el
  prefijo `<source>/robots/`, la clave de ADR-014 §3.4) cuyo `fetched_at` está
  dentro de las 6 h. Si existe, **se relee del archivo y no se pide**: RN-10
  ya obligaba a archivarlo antes de parsearlo, así que la memoria estaba
  escrita y nadie la leía.
- **`request_rhythm` recuerda lo que salió.** El derecho a *intentar* un
  refresco —cuando no hay política vigente en el archivo— se toma con el mismo
  `takeTurn` atómico, con clave propia de origen (`robots/<origin>`) e
  **intervalo de 1 minuto**: es un techo de **reintento** ante un origen que
  no sirve su `robots.txt`, no una cadencia. En régimen normal sale **una
  petición de robots cada 6 h por origen** (las 6 h las impone el archivo);
  ante un origen caído, como mucho una por minuto, igual de cortés que el
  ritmo general, y contabilizada aparte del par como ADR-014 §3.2 ya fijó.
- **Fallo cerrado, como siempre**: sin política vigente y sin refresco
  logrado, ninguna petición sale hacia ese origen y el tick registra el motivo
  (ADR-014 §3.3).

La implementación es un `PolicyGate` nuevo que **vive en `src/polite/`**
—ADR-014: la cortesía tiene un solo dueño, y esto es cortesía— reutilizando
`parseRobots`, `politeFetch` y `captureThenParse`. **No hay migración nueva
para esto** y no hay segundo parser. `RobotsGate` en memoria se queda como
está y sigue siendo el del instrumento supervisado (`src/mirror/`,
F-SPEC-002-2, SPEC-008 CA-14.8): la frontera sigue siendo la misma — **lo que
se despliega usa lo durable; lo que un operador supervisa a mano, no.**

### §5. El tick registra sus intentos en una tabla append-only

`migrations/0005` crea el registro de intentos de ingesta: una fila por
**intento** de un par elegible —`ok`, `skipped` (robots denegado) o `failed`—
con instante, motivo, `raw_ref` cuando lo hay, contadores de `Observation`
persistidas y **los nombres íntegros de las filas no resueltas** (RN-09: son
la cola de trabajo del catálogo de alias, y hoy no tienen otro sitio).
Append-only con `reject_amendment`, como `calendar_loads`: un intento es un
hecho histórico.

**No registran fila**: un tick sin pares elegibles, y un turno suprimido por
el minuto de RN-11 — SPEC-008 §4 ya lo fijó: un tick suprimido no es un tick
fallido, y registrarlo se leería como cobertura perdida.

### §6. El tick termina en `Observation` persistida; ninguna `Decision`

El camino del tick es: elegibilidad (§2, §3) → turno (CA-14) → robots (§4) →
captura y archivo (RN-10) → lectura → resolución con el `MatchResolver` real
de SPEC-011 (RN-09, con la temporada activa como **configuración declarada**,
nunca deducida) → `ObservationStore.append` (idempotente, SPEC-010). Ahí se
acaba: **el tick no construye ni escribe ninguna `Decision`** (RN-08, D-3). El
motor es la spec siguiente y leerá `observations` cuando exista; hasta
entonces, «publicado» sigue sin ocurrir, que es exactamente lo que la épica
espera de este tramo.

## Consecuencias

### Positivas

- El defecto latente del `RobotsGate` en frío se cierra **antes** del primer
  despliegue, con cero migraciones y cero parsers nuevos: el archivo ya era la
  memoria correcta.
- El despliegue es incapaz por construcción de sondear fuera de las jornadas
  declaradas: la respuesta a «¿esto sigue siendo medición?» deja de depender
  de la disciplina del operador.
- Las ventanas por partido convierten el presupuesto de RN-11 en peticiones
  con partido detrás: una jornada típica son unas pocas horas de ventana
  agregada por competición, no un día entero.
- El hueco entre «no hay observaciones» y «el cron no corrió» se vuelve
  auditable desde una tabla, que es donde las cifras y la lista de fallos de
  la épica van a leer.

### Negativas / follow-ups

- **`PRE`, `POST` y el intervalo de reintento del robots son números elegidos
  sin evidencia.** Revisables tras la primera jornada; viven en un solo sitio.
- **Releer la política del archivo cuesta un `list` + `get` a Blob por tick
  con pares elegibles.** Es infraestructura propia, no un tercero; se acepta.
- **La lista de ventanas de medición es un fichero que alguien tiene que
  editar antes de cada jornada.** Es deliberado (§3): el coste de una línea
  con motivo es el precio de que el sondeo no pueda ocurrir por inercia. Sus
  minutos cuentan para la cifra de operación manual.
- **Un `robots.txt` que caduque a mitad de ventana con el origen caído cierra
  la captura hasta que el refresco vuelva a lograrse.** Es fallo cerrado y es
  lo decidido (ADR-014 §3.3); la cifra de cobertura lo mostrará, y el registro
  de §5 dirá por qué.
- **La tabla de intentos crece sin retención definida.** Son filas de texto
  propias, no HTML de terceros: fuera del alcance de ADR-020. Si algún día
  pesa, es una línea en EPIC-MEJORA.

## Alternativas consideradas

- **Sondear siempre que el calendario tenga partidos futuros.** Rechazada: es
  el sondeo continuo de ADR-008 §5.2 con otro nombre, gasta presupuesto de
  RN-11 sin partido detrás y hace imposible anclar la retención por jornada.
- **Ventana por jornada (del primer kickoff al último) en vez de por
  partido.** Rechazada: una jornada con partidos el sábado y el domingo
  mantendría la captura viva la noche entera de por medio. La ventana por
  partido la subsume: la unión de ventanas de partido ya cubre la jornada.
- **Estado durable propio para la política de robots (tabla nueva en una
  migración).** Rechazada: duplicaría en una tabla lo que el archivo ya
  guarda por obligación de RN-10, y una migración es irreversible (ADR-006).
  La tabla solo recordaría mejor **los intentos fallidos**, y para eso basta
  el turno de reintento sobre `request_rhythm`, que ya existe.
- **Refrescar el robots sin turno (solo con la vigencia del archivo).**
  Rechazada: ante un origen que no sirve su `robots.txt`, cada tick
  reintentaría — una petición por minuto y origen sin sello durable que lo
  demuestre. Es exactamente la clase de defecto que CA-14 cerró.
- **Un scheduler en proceso que calcule las ventanas una vez.** No existe la
  opción: ADR-004. Se nombra porque es la forma que tenía el diseño original.
- **Deducir la temporada activa de la base o de la fuente.** Rechazada:
  SPEC-011 fijó que la temporada la entrega la configuración del llamante,
  nunca se deduce; deducirla reabriría esa decisión por la puerta de atrás.
- **Autenticar por IP o no autenticar (el ritmo ya contiene el daño).**
  Rechazada: cierto para las peticiones al tercero, falso para el registro de
  intentos, que quedaría escribible por cualquiera que conozca la URL.

<!-- REGLA: un ADR aceptado es INMUTABLE. Para cambiar la decisión, escribe otro ADR que lo supersede (estado del viejo -> bloqueada + nota "superseded por ADR-NNN"). -->
