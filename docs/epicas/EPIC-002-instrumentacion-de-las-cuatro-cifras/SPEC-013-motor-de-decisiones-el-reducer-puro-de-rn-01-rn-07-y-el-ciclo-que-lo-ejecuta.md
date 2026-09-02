---
id: SPEC-013
tipo: spec
epica: EPIC-002
estado: borrador
aprobada-por:
historial:
  - {estado: borrador, fecha: 2026-09-02, por: sdd-arquitecto}
---
# SPEC-013 — Motor de decisiones: el reducer puro de RN-01..RN-07 y el ciclo que lo ejecuta

> Sigue la descomposición orientativa de `_epica.md` —adaptador ✓ (SPEC-008) ·
> frontera RN-11 ✓ (SPEC-009) · calendario y repositorios ✓ (SPEC-010) ·
> catálogo de alias ✓ (SPEC-011) · cron de ingesta ✓ (SPEC-012) · **motor de
> decisiones** · bot · panel · snapshot · cifras—. Su precondición está
> satisfecha desde el 2026-09-02: SPEC-012 es `hecho` y `observations` ya se
> llena desde una fuente. Y la precondición de producto la resolvió la
> aritmética el 2026-09-01: **el motor nace con una sola vía en RN-02**
> (ADR-008 §1, `_epica.md`), que es un dato de partida y no un riesgo.
>
> Trae **un ADR en `borrador`**: **ADR-021** (dónde vive el motor y qué forma
> tiene, quién lo dispara y cuándo corre, qué es una alerta sin panel, cómo se
> derivan los cualificadores sin columna nueva, cómo se declara la
> independencia de RN-02, y las cuatro lecturas de RN-01..RN-07 que el código
> no puede dejar a medias).

## Problema

**`decisions` está vacía por criterio y las cuatro cifras se miden contra el
dato publicado.** SPEC-012 cerró el camino fuente → archivo → `Observation`
persistida y su CA-4.4 afirma, como resultado esperado, que la tabla
`decisions` sigue sin una sola fila: el tick no publica porque publicar es
escribir una `Decision` y la única puerta es el motor (RN-08, D-3). El motor
no existe: `src/decide/` es un renglón de la estructura de `CLAUDE.md` y un
directorio que no está en disco.

Mientras no exista, **ninguna de las cuatro métricas de EPIC-002 se puede
medir**. Las cuatro están definidas contra «el dato **publicado**»: la latencia
cuenta segundos hasta él, la cobertura cuenta partidos que lo tuvieron, los
conflictos cuentan desacuerdos que impidieron producirlo, y los minutos de
operación cuentan lo que cuesta corregirlo. `observations` llena y `decisions`
vacía es exactamente medio instrumento.

Y hay una segunda cosa que no existe y se nota más cada día: **hoy nada llega
al usuario**. RN-08 dice que ninguna fuente publica sin pasar por el motor, así
que sin motor no hay bot que sirva, ni panel que arbitre, ni snapshot que leer.
Las tres specs siguientes de la épica esperan a ésta, no al revés.

**Lo que hace difícil esta spec no es ninguna de las siete reglas por
separado.** Es que RN-01..RN-07 están escritas para un lector humano y dejan
cuatro huecos que el código no puede saltarse: dónde vive la memoria de una
retención que dura minutos sin proceso vivo (ADR-004), quién dispara el motor
cuando **no llega nada** —que es justo el caso de RN-06 por timeout y de RN-07
por silencio—, qué es «alerta al panel» dos specs antes del panel, y dónde
viven *sen sinal* y *pendente de confirmar* si la tabla `decisions` no tiene
columna para ellos y el modelo canónico es de una spec cerrada. **ADR-021
contesta a los cuatro**, y esta spec los ejecuta.

**Lo que esta spec no arregla, dicho en la primera línea:** no produce ninguna
de las cuatro cifras, no enseña nada a nadie —no hay snapshot ni página—, no
recibe nada de ninguna persona —no hay bot ni panel, así que las observaciones
de operador y corresponsal solo existen aquí como dobles— y **no abre la
segunda vía de RN-02 con fuentes reales**, porque solo hay una fuente
capturable.

## Usuarios / roles afectados

- **`sdd-implementador`**: construye `src/decide/` entero —el reducer puro, el
  aplicador, el ciclo, la tabla de roles, la lista de independencia declarada y
  los umbrales—, `src/db/alerts.ts`, `migrations/0006` y las suites. Cambia
  **una línea** de `src/app/api/cron/ingest/route.ts` (SPEC-012, `hecho`): la
  función que le inyecta al handler. La rama tiene que nombrar `SPEC-013`, o el
  hook `require-spec` deniega la escritura sobre `src/` y `tests/`. Necesita
  `DATABASE_URL_TEST` desde CA-11.
- **`sdd-verificador`**: corre `npm run lint`, `npm test` y `npm run test:db`;
  sin `DATABASE_URL_TEST` los criterios con base son **UNMET, no *skipped***
  (gate del 2026-08-29). Su trabajo aquí no es de fontanería sino de **letra**:
  catorce de los quince criterios son la ejecución literal de una regla de
  `reglas.md`, y el sitio donde este motor se rompe es en las lecturas de
  ADR-021 §8. Que compruebe los controles positivos de CA-13: son los que dicen
  si la frontera de RN-08 mide algo.
- **`sdd-arquitecto`**: si el gate firma ADR-021, **traslada las cuatro
  lecturas de su §8 a `reglas.md`** como aclaraciones fechadas, con el
  precedente de las de RN-01 y RN-03, **antes** de que la implementación
  empiece. Y escribe la enmienda de ADR-015 en el ledger de SPEC-012 por la
  letra de su CA-7 (CA-12 de aquí).
- **El operador del spike** (el autor, RN-01): hereda un motor que **le da
  precedencia sobre la RFGF** y que hoy es la única ruta a un marcador
  *confirmado*. Todavía no tiene por dónde ejercerla —el panel es dos specs más
  adelante—, y esta spec no se la inventa.
- **`sdd-documentalista`**: `src/decide/` es estructura nueva en `CLAUDE.md`, y
  `migrations/0006` una migración más. Tras el GREEN.
- **`sdd-competicion`**, consultivo y **no bloqueante**: los umbrales de RN-06
  (kickoff − 2 min, kickoff + 110 min) y de RN-07 (15 min) se ejecutan aquí por
  primera vez. Si su dictamen los mueve, es un diff de una línea en
  `src/decide/thresholds.ts`.

## Diseño

### §1. Qué se construye, y en qué orden se lee

```
src/decide/
  rules.ts        el reducer puro: RN-01..RN-07 en el orden de `reglas.md`
  attribution.ts  RN-12: cuál de las reglas concurrentes se registra en `rule`
  qualifier.ts    los cuatro cualificadores, derivados (ADR-021 §6)
  roles.ts        SourceId -> rol de RN-01, con fallo cerrado (ADR-021 §8.4)
  independence.ts la lista cerrada de pares independientes, VACÍA (ADR-021 §7)
  thresholds.ts   los umbrales, cada uno en un solo sitio
  ports.ts        AlertStore (interfaz nueva en fichero nuevo, como SPEC-010)
  alert.ts        el esquema zod de Alert — NO es modelo canónico
  apply.ts        el aplicador: lee, llama al reducer, persiste (impuro)
  replay.ts       replay determinista de un partido, sin red y sin base
  cycle.ts        el ciclo del tick: ingesta (SPEC-012) y después el motor
src/db/alerts.ts  AlertStore sobre Postgres, postgres.js con SQL etiquetado
migrations/0006   la tabla `alerts`, append-only con reject_amendment
```

`src/model/` **no cambia**: el modelo canónico no es del motor (`CLAUDE.md`;
ADR-021 §1). `src/ingest/`, `src/polite/`, `src/calendar/` y `src/alias/`
tampoco: son de specs `hecho` y el ciclo compone sobre sus API públicas
(ADR-011 §6).

### §2. La forma del reducer

```
decide({
  kind: 'observation' | 'time',
  incoming?: Observation,        // solo en 'observation'
  match: Match,                  // para el kickoff (RN-06)
  previous: Decision | null,     // la vigente
  latestBySource: ReadonlyMap<SourceId, Observation>,
  latestAlerts: { conflict: Alert | null, silence: Alert | null },
  now: Instant,
  config,                        // roles, independencia, umbrales
}) -> {
  decision: Decision | null,
  alerts: readonly NewAlert[],
  held: { rule, reason } | null,
}
```

Todo lo que entra sale de los dos logs inmutables y del calendario declarado
(ADR-021 §2). **No hay estado durable del motor**: la retención de RN-04 es
«hay una observación más nueva que la `Decision` vigente que salta más de dos
goles y ninguna otra fuente la acompaña», y eso se lee de `latestBySource`.

**El motor emite `Decision` solo cuando cambia la tupla publicada** —`status`,
`home_score`, `away_score`, `provisional`, y si la regla es RN-07—, nunca una
por tick. Ésa es la condición que hace que replayar el log produzca el mismo
log (CA-14) y que un partido tranquilo no genere 150 filas.

`decided_at` es `now`; `version` es `previous.version + 1` o 1; los instantes
son cadenas `Z` de punta a punta (ADR-006) y `Date` no aparece.

### §3. El aplicador, y quién arbitra la versión

`apply.ts` es la única parte impura: `MatchStore.getById`,
`ObservationStore.listByMatch`, `DecisionStore.getLatestByMatch`,
`AlertStore.latestByMatch` → `decide` → `DecisionStore.append` y
`AlertStore.append`. **La versión la arbitra la base** (ADR-017 §5,
`migrations/0003`): ante `DecisionVersionConflictError` relee y reintenta
**una** vez, y si vuelve a chocar abandona ese partido en este ciclo. No
calcula su versión esperando estar solo (F-SPEC-008-V13 aplicado a lo que llega
a la pantalla).

### §4. El ciclo, y por qué va dentro del mismo tick (ADR-021 §4)

`cycle.ts` calcula los partidos elegibles con la función de
`src/ingest/windows.ts` (ADR-019 §2 y §3), ejecuta `runIngestTick` y a
continuación pasa el motor por esos mismos partidos, **en la misma
invocación**. La ruta del cron le inyecta el ciclo al handler que ya existe.

Va dentro por la **latencia**: la cifra exige < 120 s y un segundo cron
regalaría hasta 60 s. Va después de la ingesta porque el motor decide sobre lo
que acaba de llegar. Y va en `src/decide/` —no en `src/ingest/`— porque
SPEC-008 CA-12 prohíbe que `src/ingest/` mencione `DecisionStore`, que es hoy
la única barrera ejecutable de RN-08: **el motor llama a la ingesta, nunca al
revés**.

Esto enmienda **la letra** de SPEC-012 CA-7 («delega entera en la función del
tick de `src/ingest/`»). La sustancia queda entera y la enmienda se escribe por
la vía de ADR-015 (CA-12).

### §5. La alerta, y por qué es una tabla (ADR-021 §5)

RN-05 y RN-07 «generan alerta al panel» y el panel no existe. `migrations/0006`
crea `alerts` append-only: partido, instante `Z`, regla (`RN-05` o `RN-07`),
motivo y observaciones implicadas. Se escribe **al entrar** en la condición, no
mientras dura: un conflicto de media hora es una fila. No hay acuse, ni estado
«vista», ni destinatario: eso es del panel.

**Es además la tercera cifra de la épica.** «% de partidos con desacuerdo entre
fuentes en algún momento» se cuenta sobre esta tabla; sin ella habría que
reconstruirla adivinando desde `observations`.

### §6. Lo que hoy no se puede ejercitar con fuentes reales, y cómo se prueba

Con una sola fuente automática capturable (`ceroacero.es`, 0.7):

| Camino | ¿Se ejerce hoy con fuentes reales? | Cómo se prueba |
|---|---|---|
| RN-03, provisional por una fuente < 0.9 | **Sí**, es el caso normal | Ciclo real contra fixture sintético (CA-14) |
| RN-02 vía 1, peso ≥ 0.9 | **No**: ninguna automática llega | Observación sintética de `operator` / `futgal` (CA-2) |
| RN-02 vía 2, dos independientes ≥ 0.7 | **No**: no hay dos, ni declaración | Lista de independencia **inyectada** (CA-3) |
| RN-04 bajada por humano | **No**: no hay bot ni panel | Observación sintética de `operator` / `correspondent` (CA-5) |
| RN-04 retención de salto > 2 | **Sí** puede ocurrir con una fuente | Sintético, con y sin segunda fuente (CA-5) |
| RN-05 conflicto | **No**: hace falta una segunda fuente | Dos fuentes sintéticas (CA-6) |
| RN-06 `postponed`/`suspended` | **No**: la oficial no es capturable | Humano sintético (CA-7) |
| RN-06 `finished` por timeout | **Sí** | Reloj falso (CA-7) |
| RN-07 silencio | **Sí** | Reloj falso (CA-8) |

**La regla de método es una y vale para las cinco filas de «No»:** la capacidad
se prueba entera con dobles, y **su inercia en producción se prueba contra la
configuración real** — con la lista de independencia de producción, ningún par
la satisface, y hay un criterio que lo afirma (CA-3.4). Eso es lo contrario de
no implementar la rama: es implementarla y demostrar que hoy no se dispara.

### §7. Dónde termina, exactamente

En `DecisionStore.append` y `AlertStore.append`. El motor no enseña nada, no
sirve ninguna ruta, no calcula ninguna cifra, no manda ninguna petición y no
recibe ninguna observación humana: el bot y el panel son las specs siguientes.

## Criterios de aceptación

- **CA-1 — Los pesos son los de la `Observation`; los roles, una tabla que
  falla cerrado (RN-01, ADR-021 §8.4).**
  Dada la tabla `SourceId` → rol de `src/decide/roles.ts`,
  entonces: cada rol que declara es una clave de `RN01_WEIGHTS`
  (`src/ingest/sources.ts`, importada — los números de RN-01 no se copian);
  toda `SourceId` del registro de fuentes de producción (`defaultRegistry()`)
  tiene rol; y `operator`, `official` y `correspondent` están declarados. Y
  además:
  1. **Fallo cerrado:** pedir el rol de una `SourceId` que no está en la tabla
     lanza un error **con nombre** que nombra la fuente. Nunca devuelve un
     valor por defecto, y un caso lo afirma como resultado esperado.
  2. El reducer evalúa los umbrales de RN-02 y RN-03 contra
     `observation.confidence` y **no** contra la tabla de pesos: un test
     construye una `Observation` de `ceroacero` con `confidence: 0.95` —posible,
     porque RN-13 congela lo observado— y la `Decision` sale **confirmada**.
     Cambiar `RN01_WEIGHTS` no cambia el resultado de ese caso.
  3. `esHumano(rol)` es cierto para `operator` **y** para `correspondent`, y
     falso para el resto (RN-01, «Humano en RN-04 y RN-06 son los dos»). Un
     caso por rol, los seis.

- **CA-2 — RN-02 y RN-03 califican la `Decision` entera, en las cinco ramas
  (RN-02, RN-03).**
  Dado el reducer y observaciones sintéticas,
  cuando se decide sobre cada una de las cinco ramas de estado,
  entonces `provisional` es **exactamente** la negación de la condición de
  RN-02, sin ramas exentas: una `Decision` `scheduled` sostenida solo por una
  fuente de 0.7 sale `provisional: true`, y una `postponed` sostenida por el
  operador (1.0) sale `provisional: false`. Cinco casos, uno por rama, y en las
  dos sin marcador el cualificador califica el **estado**. Y además:
  1. Una fuente de peso ≥ 0.9 basta: `confirmado` con una sola observación.
  2. **Ninguna tercera opción:** un caso enumera las cinco ramas y afirma que
     toda `Decision` emitida tiene `provisional` en `true` o en `false` según la
     condición de RN-02, y que no hay camino del reducer que emita sin
     evaluarla.
  3. **El motor no emite una `Decision` por tick:** con la tupla publicada
     —`status`, marcador, `provisional`, y si la regla es `RN-07`— sin cambios,
     `decision` es `null`. Un caso conduce diez entradas `time` seguidas sobre
     un partido tranquilo y cuenta **cero** decisiones nuevas.
  4. `decided_at` es el `now` inyectado como cadena `Z`, `version` es
     `previous.version + 1` (o 1 sin previa) y `supporting_observation_ids`
     nunca está vacío (RN-12): un caso lo afirma en las cinco ramas.

- **CA-3 — La segunda vía de RN-02 existe, se prueba con dobles y hoy no se
  dispara (RN-02, ADR-021 §7, ADR-008 §1).**
  Dada la lista cerrada de pares declarados independientes de
  `src/decide/independence.ts`,
  entonces:
  1. La relación es **simétrica** y **por defecto falsa**: dos fuentes
     cualesquiera no declaradas no son independientes, y un caso lo afirma con
     el par `(ceroacero, besoccer)`, que es el que la tentación pediría.
  2. Con una lista **inyectada** que declara independientes dos fuentes
     sintéticas de peso 0.7, dos observaciones coincidentes producen una
     `Decision` **confirmada** con las **dos** observaciones en
     `supporting_observation_ids`. Si discrepan, no hay `Decision` (eso es
     RN-05, CA-6).
  3. Con la misma lista inyectada pero **una** de las dos de peso 0.5, no se
     confirma: la vía exige ambas ≥ 0.7.
  4. **Y con la lista de producción, la lista está vacía**, ningún par es
     independiente, y el mismo escenario de CA-3.2 sale **provisional**. El
     caso lo afirma como resultado esperado y cita ADR-008 §1: es la forma
     ejecutable de «el motor nace con una sola vía en RN-02».
  5. Cada entrada futura de la lista lleva su motivo escrito a su lado, y un
     caso comprueba la **forma** —lista exportada con nombre, pares literales—,
     no su contenido (ADR-016 §3.2: el contenido crece con un diff, no con una
     firma).

- **CA-4 — La precedencia del operador resuelve el empate a 1.0, y no es un
  conflicto (RN-01, RN-05 salvedad, RN-12 escalón 1).**
  Dada una `Decision` vigente sostenida por una observación de `futgal`
  (oficial, 1.0) y una observación nueva del `operator` (1.0) que la contradice,
  cuando se decide,
  entonces se publica **lo que dice el operador**, `provisional: false`, y la
  `Decision` registra `rule: 'RN-01'`. Y además:
  1. **No se emite alerta de conflicto** y no se retiene nada: una discrepancia
     en la que interviene el operador no es un conflicto (RN-05).
  2. El caso simétrico —la oficial contradice al operador **después**— también
     lo gana el operador mientras su observación siga siendo la suya más
     reciente; y un caso afirma que el corresponsal (0.8) **no** tiene esa
     precedencia: frente a la oficial pierde por peso, no por rol.
  3. `rule` es `RN-01` **aunque** la decisión también cambie el estado (RN-06)
     o el marcador (RN-02/RN-03): el escalón 1 gana (CA-9).

- **CA-5 — RN-04: un marcador no baja, y un salto de más de dos goles se
  retiene (RN-04, ADR-021 §8.1).**
  Dada una `Decision` vigente 2-1 sostenida por `ceroacero` (0.7),
  entonces:
  1. Una observación de `ceroacero` que dice 1-1 **no se publica**: `decision`
     es `null` y `held` nombra `RN-04`. La `Observation` existe igualmente
     (RN-13); el motor no la borra ni la edita.
  2. Una observación de `correspondent` (0.8) que dice 1-1 **sí** se publica,
     `provisional: true` (0.8 < 0.9), `rule: 'RN-04'`. Lo mismo con `operator`
     (1.0) y `provisional: false`. Es la lectura de «humano» de RN-01, con un
     caso por cada uno de los dos.
  3. Una observación de `ceroacero` que dice **5-1** (salto de 3) se **retiene**:
     `decision` es `null` y `held` nombra `RN-04`. Cuando una **segunda fuente**
     distinta dice también 5-1, se publica con `rule: 'RN-04'` y las **dos**
     observaciones en `supporting_observation_ids`. Un salto de exactamente 2
     goles (2-1 → 4-1) **no** se retiene: el borde está fijado con un caso a
     cada lado.
  4. **La retención no alcanza a ≥ 0.9** (ADR-021 §8.1): la misma observación
     5-1 desde `operator` publica de inmediato. Un caso lo afirma y cita el
     motivo — con la oficial no capturable, retener lo que RN-02 declara
     suficiente lo retendría para siempre.
  5. Un partido `scheduled` sin `Decision` previa no tiene marcador del que
     bajar: RN-04 no aplica y no puede impedir la primera publicación.

- **CA-6 — RN-05: el conflicto no se publica, se alerta, y solo cuando persiste
  (RN-05, ADR-021 §8.2).**
  Dadas dos fuentes de peso 0.7 no declaradas independientes cuyas últimas
  observaciones discrepan, y ninguna oficial,
  entonces:
  1. **No se emite ninguna `Decision`** y la vigente se mantiene tal cual
     (lectura «la vigente», ADR-021 §8.2: hoy no hay ninguna *confirmada* que
     mantener, y despublicar contradiría RN-03). `held` nombra `RN-05`.
  2. La alerta **solo** se emite cuando la discrepancia sigue en pie
     `CONFLICT_GRACE` después de la más reciente de las dos observaciones que
     discrepan. Antes de ese plazo no hay alerta y tampoco hay `Decision`. Dos
     casos: uno justo antes del borde y otro justo después.
  3. Si dentro de `CONFLICT_GRACE` la rezagada se pone al día, **no hay alerta**
     y se publica lo que ambas dicen. Es el caso de dos fuentes a distinta
     velocidad, que es el normal, y el que separa esta cifra de un contador de
     goles.
  4. Mientras la **misma** discrepancia persiste no se emite una alerta nueva:
     diez entradas `time` seguidas producen **una** fila. Una discrepancia
     distinta —otros valores— sí produce una segunda.
  5. Si **una de las dos es la oficial**, no es conflicto: se publica lo que
     dice la oficial. Y si interviene el operador, tampoco (CA-4.1).
  6. `CONFLICT_GRACE` vive en `src/decide/thresholds.ts` **en un solo sitio**:
     un test lo cambia ahí y ve moverse el borde de CA-6.2, sin tocar ningún
     otro número. Igual que `POST` en SPEC-012 CA-1.

- **CA-7 — RN-06: las transiciones de estado, con su tabla cerrada (RN-06,
  ADR-021 §8.3).**
  Dado el reducer, un `Match` con `kickoff` conocido y un reloj falso,
  entonces:
  1. `scheduled → live` con la primera observación de juego **después** de
     `kickoff − 2 min`; una observación `live` **antes** de ese instante no
     transiciona (se guarda igual, RN-13). Un caso a cada lado del borde.
  2. `live → finished` por **fuente oficial**, por **dos fuentes coincidentes**
     —y aquí *coincidentes* es lo que dice RN-06, no *independientes*: dos
     espejos cierran el partido, y el cualificador de esa `Decision` lo sigue
     decidiendo RN-02/RN-03, que sí exige independencia—, o por
     `kickoff + 110 min` **sin señal**. Tres casos.
  3. La `Decision` `finished` alcanzada por timeout **no tiene ninguna
     observación de apoyo que diga `finished`**, y de ahí sale su cualificador
     *pendente de confirmar* (CA-10).
  4. `postponed` y `suspended` **solo** por fuente oficial o humano: una
     observación `postponed` de `ceroacero` (0.7) **no** transiciona; la misma
     del `correspondent` (0.8) sí, y la `Decision` sale **`provisional: true`**
     porque 0.8 < 0.9 (RN-01 «Humano», RN-03). La del `operator` sale
     `provisional: false`.
  5. **La tabla es cerrada para las fuentes automáticas** (ADR-021 §8.3): un
     caso enumera las transiciones permitidas y afirma que el resto —`finished →
     live`, `live → scheduled`, `postponed → live` desde una automática— **no
     produce `Decision`**. La oficial y el humano sí pueden llevar el partido a
     cualquiera de los cinco estados: un caso por cada uno.
  6. Los tres umbrales de RN-06 y RN-07 viven en `src/decide/thresholds.ts`,
     cada uno en un solo sitio y con la cita de la regla de la que salen.

- **CA-8 — RN-07: el silencio se publica y se alerta, una vez (RN-07, RN-08,
  ADR-021 §6).**
  Dado un partido `live` cuya última observación tiene 15 min o más,
  entonces:
  1. Se emite una `Decision` con **el mismo estado y el mismo marcador**, con
     `rule: 'RN-07'`, y una alerta `RN-07`. El borde de los 15 min está fijado
     con un caso a cada lado.
  2. Se emite **una sola vez** por episodio: entradas `time` sucesivas durante
     el silencio no producen más `Decision` ni más alertas.
  3. Cuando **vuelve** una observación, la `Decision` siguiente sale con la
     regla que corresponda —`RN-02` o `RN-03` si nada más cambió, que es el
     escalón 5 de RN-12: «la `Decision` solo mueve el marcador **o su
     cualificador**»— y el partido deja de estar *sen sinal* (CA-10).
  4. RN-07 **solo** aplica a `live`: un `scheduled` sin observaciones durante
     horas no produce ninguna `Decision` ni ninguna alerta.
  5. Un partido `live` sin **ninguna** observación no existe (RN-12 exige apoyo):
     un caso afirma que una entrada `time` sobre un partido sin observaciones
     no produce nada.

- **CA-9 — RN-12: se registra la regla decisiva, con su orden de desempate
  (RN-12).**
  Dada la función de atribución de `src/decide/attribution.ts`,
  entonces implementa **literalmente** el orden de `reglas.md` —RN-01 > RN-04 >
  RN-07 > RN-06 > RN-02/RN-03— con un caso por escalón y **un caso por cada par
  adyacente concurrente**: una transición `scheduled → live` con una sola fuente
  de 0.8 registra `RN-06` y no `RN-03`; una bajada de marcador que además cambia
  el estado registra `RN-04`; una decisión del operador que además cambia el
  estado registra `RN-01`. Y además:
  1. **RN-05 nunca aparece en `rule`**: no emite `Decision` (CA-6.1), y una
     discrepancia en la que interviene el operador enruta al escalón 1 y se
     registra como `RN-01` (RN-12, salvedad de RN-05). Un caso lo afirma, y esta
     spec **declara** con ello dónde entra RN-05 en el orden, como RN-12 le
     encarga a la spec del motor: **no entra, porque no emite**.
  2. `rule` sale siempre del vocabulario cerrado de `DECISION_RULES` (SPEC-001
     CA-19) y el `CHECK` de `migrations/0001` es la segunda red, no la primera:
     el reducer no puede producir un valor fuera de los siete, y el tipo lo
     impide.
  3. RN-02 y RN-03 **nunca concurren entre sí** (RN-03 es la negación de
     RN-02): un caso afirma que la atribución elige exactamente una y que cuál
     coincide con la columna `provisional`.

- **CA-10 — Los cuatro cualificadores se derivan, sin columna nueva (ADR-021 §6,
  SPEC-001 CA-8, ADR-013).**
  Dada la función pura de `src/decide/qualifier.ts` con la `Decision` vigente y
  sus observaciones de apoyo,
  entonces devuelve exactamente uno de los cuatro valores de
  `MATCH_QUALIFIERS`, en el orden de ADR-021 §6: `sen_sinal` si `rule` es
  `RN-07`; `pendente_de_confirmar` si es `finished` y **ninguna** observación de
  apoyo dice `finished`; `provisional` si `provisional`; `confirmado` en otro
  caso. Un caso por valor, más:
  1. **Es total**: un caso recorre las cinco ramas de estado por los dos valores
     de `provisional` y afirma que siempre devuelve uno de los cuatro y nunca
     lanza.
  2. Un `finished` **con** una observación de apoyo que dice `finished` **no**
     es *pendente de confirmar*, y sale `provisional` o `confirmado` según
     RN-02.
  3. **El cualificador no borra `provisional`**: la columna sigue legible al
     lado, y un caso afirma que un partido puede ser a la vez `sen_sinal` y
     `provisional: true`. Cómo se enseñan los dos es de la interfaz (ADR-013),
     no de aquí.
  4. `migrations/` **no gana ninguna columna** en `decisions` ni en
     `observations`, y `src/model/` no cambia: el verificador lo comprueba en el
     diff contra `main`.

- **CA-11 — El aplicador persiste, la base arbitra la versión, y `alerts` es
  append-only (ADR-017 §5, ADR-021 §3 y §5, ADR-006, RN-12).**
  Dado `DATABASE_URL_TEST` con las migraciones aplicadas y un partido con
  calendario cargado,
  cuando el aplicador procesa una observación persistida,
  entonces `decisions` gana **una** fila válida —`DecisionSchema.parse` sobre lo
  leído de la base—, con `rule` en el vocabulario cerrado,
  `supporting_observation_ids` apuntando a observaciones **de ese partido** (el
  trigger de `migrations/0001` es la segunda red) y `decided_at` como cadena
  `Z`. Y además:
  1. `migrations/0006` se aplica en orden: `migrate` devuelve
     `['0001'…'0006']` y una segunda ejecución `[]`. El test de paridad de
     SPEC-001 CA-14 pasa **sin entradas nuevas** —`alerts` no es modelo
     canónico, como `ingest_attempts` no lo es— y la suite `tests/db/` previa
     pasa entera. Si alguna aserción enumerante de una suite cerrada deja de ser
     cierta **por la propia decisión de añadir 0006**, se generaliza conservando
     todo lo que afirmaba y se escribe la enmienda de ADR-015 en el ledger de su
     spec: es F-SPEC-008-1 y F-SPEC-012-3, ya con vía sancionada, y **no es
     licencia para tocar nada más**.
  2. `update` y `delete` sobre `alerts` **los rechaza la base**
     (`reject_amendment`), como sobre `decisions` y `observations`.
  3. **Ante `DecisionVersionConflictError` el aplicador relee y reintenta una
     vez**; si vuelve a chocar, abandona ese partido en el ciclo sin lanzar y lo
     deja registrado. Dos casos, uno por rama, provocando el conflicto con una
     escritura concurrente real.
  4. El aplicador **no calcula** su versión a ciegas: un caso con una `Decision`
     ya en versión 3 produce la 4, y otro con el log movido bajo sus pies
     termina en la versión que la base admitió, no en la que había planeado.
  5. Un ciclo que no produce ninguna `Decision` **no escribe ninguna fila**, ni
     en `decisions` ni en `alerts`.

- **CA-12 — El ciclo corre dentro del tick, y la ruta delega en él (ADR-021 §4,
  ADR-019 §1, ADR-015).**
  Dado el ciclo compuesto con las implementaciones durables y un fetcher doble
  que sirve un fixture **sintético** con la forma de `ceroacero.es`,
  cuando se invoca **una** vez con un partido en ventana dentro de una jornada
  de medición declarada,
  entonces en la **misma invocación** se persiste la `Observation` y se escribe
  la `Decision`: `decisions` deja de estar vacía por primera vez en el proyecto.
  Y además:
  1. El motor corre **después** de la ingesta y sobre los mismos partidos
     elegibles: un caso afirma el orden y que un partido fuera de ventana no
     produce ni observación ni decisión.
  2. `vercel.json` sigue declarando **un** cron con `schedule` `* * * * *`
     (SPEC-012 CA-8 intacto, comprobado por su propio test sin tocarlo), y
     `src/app/api/cron/ingest/route.ts` cambia **solo** la función que inyecta
     al handler: sigue autenticando, sigue fallando cerrado sin `CRON_SECRET` y
     sigue sin contener lógica. Los cuatro casos de `tests/ingest/cron.test.ts`
     pasan sin tocar una aserción.
  3. **La enmienda de ADR-015 está escrita** en el ledger de SPEC-012, bajo
     `## Enmienda — <fecha>: …`, con las cinco partes de su §3, y nombra
     `SPEC-012 CA-7`. El verificador comprueba que existe y que están las cinco.
  4. `src/ingest/` **no gana ni una línea**: el diff contra `main` de
     `src/ingest/`, `src/polite/`, `src/calendar/` y `src/alias/` está vacío
     salvo lo que este criterio autoriza (nada). El ciclo compone sobre sus API
     públicas (ADR-011 §6).
  5. Un fallo del motor sobre un partido **no impide** el de los demás en el
     mismo ciclo, y no revierte la ingesta ya persistida.

- **CA-13 — RN-08: la capacidad de escribir una `Decision` está enumerada, y lo
  que el mecanismo no alcanza está escrito (RN-08, D-3, ADR-016).**
  Dada una lista exportada con nombre —`DECISION_WRITERS`— con **dos** entradas
  y su motivo escrito al lado (`src/decide/` porque es el motor, RN-08;
  `src/db/alerts.ts` y `src/db/decisions.ts` porque implementan el puerto y no
  deciden nada),
  cuando se recorre todo el código versionado fuera de `tests/` bajo las raíces
  ya declaradas por SPEC-008 CA-2.6, **leyendo con el mismo lector del
  compilador** que sostiene esa frontera (un solo lector, ADR-016 §5 bis),
  entonces el conjunto de ficheros que importan `PostgresDecisionStore`,
  `DecisionVersionConflictError` o el tipo `DecisionStore` y **no** están en
  `DECISION_WRITERS` es **vacío**. Y además:
  1. **Control positivo del mecanismo estático:** un fichero sintético fuera de
     la lista que importe `@/db/decisions` pone rojo un caso nombrado; y
     vaciar la lista de nombres vigilados pone rojo otro (ADR-016 §3.4: un
     control por mecanismo, no por batería).
  2. **Un fichero que el lector no sepa clasificar es rojo**, y se comprueba
     contra lo que el compilador publica para ese fichero, no contra nosotros
     (ADR-016 §5 bis.2). Se hereda el lector, no se escribe uno nuevo.
  3. **Residuo declarado dentro del criterio** (ADR-016 §6, obligatorio): este
     mecanismo **no alcanza** a un módulo que obtuviera un `Sql` y escribiera
     `insert into decisions` con SQL etiquetado compuesto, porque la capacidad
     ahí no cruza ninguna frontera de módulo que el lector vea. Se añade un
     segundo mecanismo, **textual y por tanto explícitamente insuficiente**:
     ningún fichero fuera de la lista nombra la tabla `decisions` en una
     plantilla SQL. Tiene su propio control positivo. **Lo que queda sin cubrir
     es el nombre de tabla compuesto en tiempo de ejecución**, y su destino es
     **EPIC-MEJORA** con disparador escrito: el día que un módulo fuera de
     `src/decide/` y de `src/db/` necesite escribir en la base.
  4. **Ninguna exención por nombre de fichero** (ADR-016 §3.3): la lista es de
     módulos con capacidad, no de ficheros perdonados, y un caso afirma que no
     existe ninguna lista de exclusiones propia de este criterio.
  5. `src/ingest/` sigue sin mencionar `DecisionStore`: los tres casos de
     `tests/ingest/no-decision.test.ts` (SPEC-008 CA-12) pasan **sin tocar una
     aserción**, y el verificador lo comprueba en el diff.

- **CA-14 — Replay: los mismos dos logs producen el mismo log de decisiones
  (RN-10, D-5, D-6, ADR-021 §2, `_epica.md`).**
  Dado un cuerpo **sintético** con la forma de `ceroacero.es` archivado en el
  raw store —una jornada de varios partidos, con un gol, un salto de más de dos
  goles, un silencio y un final— y su lectura por el camino de SPEC-008
  (`read`, sin red),
  cuando se replaya el log de observaciones resultante con `src/decide/replay.ts`
  —sin base de datos, sin red, con los instantes del propio log y las entradas
  `time` de cada minuto—,
  entonces:
  1. El log de `Decision` producido es **idéntico** replayando dos veces:
     mismo número de filas, mismas reglas, mismos marcadores, mismos
     `decided_at`, mismas versiones. Comparación profunda, no por muestreo.
  2. El log producido por el replay **coincide con el que produjo el ciclo
     real** de CA-12 sobre el mismo material, salvo en lo que el ciclo no
     controla. Si hay alguna diferencia, el criterio la nombra: es el sitio
     donde el motor dejaría de ser puro.
  3. `decide` **no toca el reloj del sistema**: un caso envenena `Date.now` y el
     replay entero sigue en verde. Es el control positivo de la pureza.
  4. **Sobre HTML real no se replaya en este repositorio y se dice por qué:**
     ADR-009 prohíbe versionar HTML de terceros, así que `tests/fixtures/` es y
     sigue siendo sintético. Replayar el archivo de una jornada de medición
     declarada es un acto del operador sobre el archivo de producción;
     empaquetarlo como CLI es de la spec de las cuatro cifras, que es quien lo
     necesita.

- **CA-15 — Los tres gates, y las suites cerradas enteras.**
  `npm run lint` en `exit=0`, `npm test` y `npm run test:db` en verde, con las
  tres salidas literales en el ledger. Sin `DATABASE_URL_TEST`, CA-11 y CA-12
  son **UNMET, no *skipped*** (gate del 2026-08-29). Y ningún caso de suite
  cerrada se pierde: recuento fichero a fichero contra `main` de `tests/mirror`,
  `tests/site`, `tests/docs`, `tests/model`, `tests/raw`, `tests/db`,
  `tests/ingest`, `tests/polite`, `tests/alias`, `tests/calendar`,
  `tests/stores`, `tests/types` y `tests/migrations`, como exige SPEC-009 CA-7.
  Si el implementador necesita una entrada nueva en `ALLOWED_PACKAGES`,
  `ENTRY_POINTS` o en las enumeraciones de `tests/polite/`, es un diff con
  motivo escrito en el propio fichero (SPEC-008 CA-2.3), no un arbitraje.

## Entidades y reglas afectadas

**Reglas de negocio** (`docs/fundacion/reglas.md`, no se duplican aquí):

- **RN-01** — los pesos entran por `observation.confidence`; los roles por la
  tabla de `src/decide/roles.ts` (CA-1). La **precedencia del operador** es
  CA-4. «Humano» incluye al corresponsal en RN-04 y RN-06: CA-5.2, CA-7.4.
- **RN-02** — vía 1 en CA-2.1; vía 2, **declarada e inerte hoy**, en CA-3.
- **RN-03** — el cualificador de la `Decision` entera en las cinco ramas: CA-2.
- **RN-04** — monotonía y retención del salto: CA-5, con la lectura de ADR-021
  §8.1 en CA-5.4.
- **RN-05** — no publica, alerta, y solo cuando persiste: CA-6, con la lectura
  de ADR-021 §8.2 en CA-6.1 y CA-6.2.
- **RN-06** — las transiciones y su tabla cerrada: CA-7, con la lectura de
  ADR-021 §8.3 en CA-7.5.
- **RN-07** — el silencio emite `Decision` y alerta: CA-8.
- **RN-08** — la frontera: CA-13, y el hecho de que `decisions` deje de estar
  vacía por la puerta correcta: CA-12.
- **RN-09** — no aplica y se dice por qué: aquí no interviene ningún LLM y la
  identidad del partido ya la resolvió SPEC-011 antes de que existiera la
  `Observation`. El motor decide sobre observaciones ya identificadas.
- **RN-10** — el replay desde el archivo es lo que la regla existía para
  permitir: CA-14.
- **RN-11** — no aplica: el motor no manda ninguna petición. El único emisor
  sigue siendo `src/polite/` a través del tick.
- **RN-12** — la regla decisiva y su orden: CA-9. Esta spec **cierra** el encargo
  que RN-12 le hacía («si la spec del motor llega a definir una `Decision` para
  la retención, es ella quien tiene que decir dónde entra RN-05»): no la define,
  y por tanto RN-05 no entra (CA-9.1).
- **RN-13** — el motor **no borra ni edita** ninguna `Observation`: una
  retenida sigue en la base (CA-5.1). `alerts` es append-only por analogía
  (CA-11.2).

**ADRs:**

- **ADR-021** (`borrador`, nace con esta spec) — la gobierna entera: §1 y §2 en
  CA-14, §3 en CA-11, §4 en CA-12, §5 en CA-6 y CA-11, §6 en CA-8 y CA-10, §7 en
  CA-3, §8 en CA-1, CA-5, CA-6 y CA-7. **Si el gate lo cambia, cambian esos CA.**
- **ADR-008 §1** — la fuente oficial no es capturable: es la razón de CA-3.4 y
  de la lectura de CA-5.4.
- **ADR-006** — instantes como cadena `Z` (CA-2.4, CA-11), `migrations/0006` sin
  rollback (CA-11.1), SQL etiquetado sin ORM, RN-12 y RN-13 en triggers ya
  existentes.
- **ADR-015** — la enmienda a la letra de **SPEC-012 CA-7** (CA-12.3), y la vía
  sancionada si 0006 vuelve falsa una aserción enumerante (CA-11.1).
- **ADR-016** — gobierna CA-13 entero: lista de lo permitido con motivos,
  raíces declaradas, un solo lector, control positivo por mecanismo y **residuo
  declarado dentro del criterio**.
- **ADR-017 §5** — la versión de la `Decision` la arbitra la base (CA-11.3,
  CA-11.4).
- **ADR-019 §2 y §3** — la elegibilidad por ventana y por jornada declarada, que
  el ciclo reutiliza tal cual (CA-12.1).
- **ADR-013** — la semántica visual: el cualificador de CA-10 es lo que llega a
  la pantalla, y esta spec no le quita a la interfaz ninguna decisión.
- **ADR-011 §6** — SPEC-008, 010, 011 y 012 son `hecho`: sus ficheros no se
  tocan (CA-12.4), salvo la línea de composición de la ruta que CA-12.2 autoriza
  y ADR-015 registra.
- **ADR-004** — sin proceso vivo: es la razón de que el estado del motor sean
  los logs y no la memoria (ADR-021 §2).

**Términos de `dominio.md`** que esta spec consume: `Decision`, `Observation`,
`rule`, `Match`, los cinco estados, los cuatro cualificadores, `operador`,
`corresponsal`, `espejo`, `independiente`, `inconcluso` y la representación del
tiempo. **Añade dos**, en el mismo commit que esta spec: **motor de decisiones**
y **alerta**; y anota en las filas de *sen sinal* y *pendente de confirmar* cómo
se derivan (ADR-021 §6).

## Fuera de alcance

Aparcado a propósito, no por descuido. Cada línea tiene dueño.

- **El bot de Telegram y el panel del operador.** Son las dos specs siguientes y
  son la única ruta a un marcador *confirmado*. Este motor las espera con los
  roles `operator` y `correspondent` ya escritos y probados con dobles; lo que
  no tiene es **por dónde entran sus observaciones**.
- **El snapshot y la página mínima por polling.** El cualificador derivado de
  CA-10 es exactamente lo que van a leer; enseñarlo no es de aquí.
- **Las cuatro cifras y su declaración de degradación.** `alerts` es la materia
  de la tercera y `decisions` la de las otras tres; calcularlas es de la última
  spec de la épica.
- **Un CLI de replay sobre el archivo real.** CA-14 demuestra que el replay es
  determinista y que funciona desde cuerpos archivados; empaquetarlo para una
  jornada de producción es de la spec que lo necesita (las cifras), y sobre HTML
  real no se puede hacer aquí (ADR-009: `tests/fixtures/` es solo sintético).
- **Declarar la primera jornada de medición real y cargar calendario y alias
  reales.** Siguen siendo actos del operador con sus precondiciones escritas
  (ADR-020 §3, SPEC-010, SPEC-011). Esta spec no declara ninguna.
- **La independencia medida entre fuentes.** Es SPEC-002 y su instrumento. Aquí
  la independencia es **declarada** y su lista nace vacía (ADR-021 §7).
- **El adaptador de `futgal.es`.** Entra el día que sea capturable, como un
  adaptador más y una entrada de rol; el motor ya tiene sitio para él
  (CA-1, `official`).
- **El acuse, el estado y el enrutado de una alerta.** `alerts` es un hecho
  histórico. Bandeja, «vista» y destinatario son del panel.
- **La retención de `alerts` y de `decisions`.** Filas propias, sin datos de
  terceros dentro. Si algún día pesa, EPIC-MEJORA — como la de
  `ingest_attempts`.
- **Mover la tabla de pesos de RN-01 fuera de `src/ingest/`.** Vocabulario del
  motor viviendo en el módulo de ingesta; copiarlo sería peor y moverlo exige
  tocar ficheros de SPEC-008, que está `hecho`. **EPIC-MEJORA**, disparador: la
  próxima spec que ya tenga que tocar `src/ingest/sources.ts` por otro motivo.
- **Ensanchar la frontera de RN-08 hasta el SQL compuesto en ejecución.**
  Declarado como residuo dentro de CA-13.3, con destino y disparador. SPEC-009
  existe porque este trabajo se subestimó una vez.
- **Los dos residuos abiertos de SPEC-012.** F-SPEC-012-2 (el borde
  `kickoff = t + PRE` de la consulta) y F-SPEC-012-3 (la letra de su CA-6) son
  de la elegibilidad y de las migraciones, no del motor. Esta spec reutiliza la
  elegibilidad **tal cual**, incluido ese borde, y no lo arregla.

## Notas para el gate humano

Lo que hay que mirar con lupa antes de firmar. Cada punto lleva la
recomendación de `sdd-arquitecto`; **la decisión es de quien firma**.

1. **ADR-021 §8 fija cuatro lecturas de RN-01..RN-07, y son lo más caro de esta
   firma.** No son umbrales nuevos: son cuál de dos lecturas posibles vale, y
   cada una cambia lo que se publica.
   - **8.1** — la retención de RN-04 no alcanza a peso ≥ 0.9. Sin esto, un 0-4
     del operador queda retenido para siempre, porque la segunda fuente que lo
     liberaría no existe.
   - **8.2** — «se mantiene la última confirmada» (RN-05) se lee «se mantiene la
     vigente». La lectura literal obligaría a **despublicar** ante el primer
     conflicto, porque hoy no hay ninguna `Decision` confirmada de fuente
     automática.
   - **8.3** — las transiciones son tabla cerrada para las automáticas, y el
     humano puede corregir a cualquier estado.
   - **8.4** — el umbral se evalúa contra el peso **congelado en la
     `Observation`**, no contra la tabla de hoy.
   **Recomendación:** firmarlas, y que `sdd-arquitecto` las traslade a
   `reglas.md` como aclaraciones fechadas antes de que empiece la
   implementación, con el precedente exacto de las de RN-01 y RN-03.
2. **RN-07 emite una `Decision`, y ésa es la decisión discutible.** La
   alternativa —solo alerta, y derivar *sen sinal* mirando el reloj— dejaría a
   la pantalla enseñando un cualificador que ninguna `Decision` sostiene, contra
   RN-08. El precio es que *sen sinal* queda codificado como `rule: 'RN-07'` en
   la `Decision` vigente, lo que **acopla el cualificador al orden de
   atribución de RN-12**: si algún día RN-12 cambia, el cualificador se rompe en
   silencio. Está escrito en las consecuencias negativas de ADR-021.
   **Recomendación:** firmar. La alternativa que evita el acoplamiento es una
   columna nueva en `decisions`, y eso toca el modelo canónico de una spec
   cerrada.
3. **`CONFLICT_GRACE` = 3 min es un número elegido sin evidencia**, como `PRE`,
   `POST` y las 6 h de ADR-014 §3.2. Si es de más, la tercera cifra sale baja;
   si es de menos, sale inflada por sincronía entre fuentes.
   **Recomendación:** firmarlo y revisarlo con la primera jornada delante; vive
   en un solo sitio y CA-6.6 lo demuestra.
4. **El motor corre dentro del tick de ingesta, no en su propio cron.** El
   motivo es la latencia: un segundo cron regalaría hasta 60 s de un presupuesto
   de 120 s. El precio es que la ruta del cron de SPEC-012 cambia una línea y su
   CA-7 se enmienda por ADR-015. **Recomendación:** aceptar; la sustancia de
   CA-7 queda entera y la enmienda es la vía sancionada.
5. **La segunda vía de RN-02 se implementa aunque hoy no se pueda ejercer, y su
   lista nace vacía.** La alternativa —no implementarla— ahorraría trabajo hoy y
   metería una rama sin probar el día del sí de la RFGF, que es el día en el que
   menos ganas hay de descubrir cosas. **Recomendación:** aprobar tal cual, y
   mirar CA-3.4: es el criterio que afirma la **inercia** en producción, y sin él
   la lista no demuestra nada.
6. **La frontera de RN-08 se demuestra a medias y está dicho dentro del
   criterio.** CA-13 cierra el grafo de imports con el lector del compilador que
   ya existe, y **no** cierra el SQL compuesto en ejecución. Es una aplicación
   deliberada de ADR-016 §6 —declarar el residuo en vez de disfrazarlo de
   mecanismo— y la razón es de presupuesto: SPEC-009 nació de gastar siete
   vueltas en exactamente esto. **Recomendación:** aceptar el residuo con su
   disparador escrito; si prefiere el cierre completo, es una spec aparte y hay
   que decirlo **antes**, no en la verificación.
7. **Quince criterios es la spec más grande de la épica, y el alcance es el
   alcance de siete reglas de negocio.** Partirla —motor «núcleo» ahora, RN-05 y
   RN-07 después— dejaría el orden de atribución de RN-12 sin implementar, la
   tercera cifra sin materia y un marcador vivo que nadie observa publicándose
   como si estuviera vivo. **Recomendación:** no partirla; si hay que recortar,
   el candidato honesto es CA-14 (replay) y no una regla.
8. **Lo que esta spec deliberadamente no promete.** Ninguna de las cuatro cifras,
   ninguna pantalla, ninguna entrada humana real. Lo que sí entrega es que
   **`decisions` deja de estar vacía** y que las cuatro cifras pasan de
   imposibles a pendientes de las tres specs que faltan.
