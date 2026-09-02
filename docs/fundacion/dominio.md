# Dominio y lenguaje ubicuo — marcador.gal

> Glosario canónico. Estos términos NO se traducen ni se anglicizan en código,
> UI ni documentación. Si un término falta, se añade aquí antes de usarse.
>
> Convención de lenguas (CLAUDE.md): los **identificadores de código van en
> inglés** (`Observation`, `home_score`); los **términos de negocio galegos y los
> nombres canónicos de la RFGF no se traducen nunca**, ni al castellano ni al
> inglés.

## Modelo canónico

| Término | Definición | Notas |
|---|---|---|
| `Competition` | Una competición-temporada-grupo. | `(id, name, season, group)`. Ej.: Preferente Futgal G1 2026/27. |
| `Team` | Un equipo con nombre canónico y sus alias. | `(id, canonical_name, aliases[])`, donde `aliases` es una lista de `TeamAlias`. El nombre canónico es **el de la RFGF**. "UD Ourense" ≠ "Ourense CF". |
| `TeamAlias` | Cómo escribe una fuente concreta el nombre de un equipo, con su estado de confirmación. Unión discriminada `proposed` / `confirmed`; identidad `(alias, source, season)`. | Refinamiento introducido por SPEC-001: RN-09 exige distinguir lo que propuso un LLM de lo que confirmó una persona, y la tupla anterior no dejaba sitio para ese estado. Un `confirmed` lleva siempre `confirmed_by` y `confirmed_at`. |
| `Match` | Un partido programado. | `(id, competition_id, round, kickoff, home_id, away_id, venue)`. |
| `Observation` | **Lo que dice una fuente en un instante.** Nunca se borra ni se corrige: es un hecho histórico. | `(id, match_id, source, observed_at, status, home_score, away_score, confidence, raw_ref)`. |
| `Decision` | **Lo que publicamos.** Log append-only; la última por partido es la vigente. | `(match_id, status, home_score, away_score, provisional, rule, decided_at, supporting_observation_ids[], version)`. |
| `rule` | La regla del motor (RN-xx) que produjo una Decision. Obligatoria. | Sin `rule` una Decision no es trazable y no debe existir. |
| `raw store` | Copia con timestamp de cada respuesta cruda de una fuente, guardada **antes** de parsearla. | Permite reprocesar cuando un parser falla y reproducir una jornada entera en tests (RN-10). |
| `RawStore` | El puerto que implementa el raw store. Dos implementaciones: Vercel Blob en producción, disco en local y tests (ADR-005). | Una sola batería de tests de contrato corre contra las dos. |
| `raw_ref` | Referencia de una `Observation` a la respuesta cruda que la originó. **Obligatoria siempre**, sin excepción por fuente. | Incluye las correcciones hechas a mano desde el panel: son la observación con más poder del sistema (RN-04, RN-06). Decisión de SPEC-001. |
| **motor de decisiones** | La pieza que convierte `Observation` en `Decision` aplicando RN-01..RN-07, y **la única puerta por la que se publica** (RN-08, D-3). Es una **función pura**: recibe la `Decision` vigente, la última observación de cada fuente, el instante y su configuración, y devuelve qué escribir; no tiene estado durable propio —su memoria son los dos logs append-only, `observations` y `decisions`— ni reloj, ni red, ni base de datos. Su domicilio es `src/decide/`. | Añadido el 2026-09-02 (SPEC-013, ADR-021). Se dispara de **dos** maneras y las dos atraviesan la misma cadena de reglas: cuando llega una `Observation`, y cuando **no llega nada y el reloj avanzó** —que es el caso de `kickoff + 110 min` (RN-06), de los 15 min de RN-07 y de una discrepancia que persiste (RN-05)—. Corre dentro del mismo tick de ingesta, después de ella (ADR-019, ADR-021 §4). **No es dueño del modelo canónico**: ése vive en `src/model/` y lo importa también el frontend. Emite `Decision` solo cuando cambia la tupla publicada —estado, marcador, `provisional`, y si la regla es RN-07—, nunca una por tick, y por eso replayar el log de observaciones produce el mismo log de decisiones (D-6). |
| **alerta** | Lo que el motor produce cuando **no puede publicar** o cuando lo publicado deja de ser fiable: un hecho histórico, con partido, instante, regla (`RN-05` conflicto o `RN-07` silencio), motivo y las observaciones implicadas. Vive append-only en `alerts` y **no es una `Decision`**: no publica nada, no baja ningún marcador y no cambia ningún estado. | Añadido el 2026-09-02 (SPEC-013, ADR-021 §5). Se escribe **al entrar** en la condición, no mientras dura: un conflicto de media hora es **una** fila, no treinta. **No es modelo canónico** —registra un acto del motor, como `ingest_attempts` registra un acto del tick—, y no tiene acuse, ni estado «vista», ni destinatario: la bandeja es del panel, que todavía no existe. Es además **la materia prima de la tercera cifra de EPIC-002** («% de partidos con desacuerdo entre fuentes en algún momento»), que se cuenta sobre esta tabla y no se reconstruye adivinando desde `observations`. |

### Representación del tiempo

Todo instante del modelo canónico (`kickoff`, `observed_at`, `decided_at`,
`confirmed_at`, `stored_at`) es una **cadena ISO 8601 en UTC con sufijo `Z`**,
nunca un `Date` (ADR-006). El tipo cruza al frontend por JSON, y `Date` no
sobrevive a `JSON.stringify` / `JSON.parse`.

## Estados de un partido

El identificador (`scheduled`, `live`, …) es **de código y va en inglés**; el
literal es lo que ve una persona y **va a i18n en las dos lenguas** (D-2).

| Término | Significado | Cómo se entra | Literal galego | Literal castellano |
|---|---|---|---|---|
| `scheduled` | Programado, sin señal de juego. | Estado inicial. | **Programado** | Programado |
| `live` | En juego. | Primera observación de juego después de `kickoff − 2 min` (RN-06). | **En xogo** | En juego |
| `finished` | Terminado. | Fuente oficial, dos fuentes coincidentes, o `kickoff + 110 min` sin señal (RN-06). | **Rematado** | Finalizado |
| `postponed` | Aplazado. | **Solo** fuente oficial o humano (RN-06). | **Aprazado** | Aplazado |
| `suspended` | Suspendido. | **Solo** fuente oficial o humano (RN-06). | **Suspendido** | Suspendido |

**Los literales se añaden el 2026-09-02** (SPEC-015, el bot del corresponsal),
porque hasta hoy el glosario definía los cinco estados **solo como
identificadores en inglés** y la tarjeta de confirmación del bot es **el primer
sitio del sistema real donde un estado se le enseña a una persona**. Sin
registrarlos aquí, el marcador y el bot acabarían diciendo cosas distintas del
mismo estado, que es exactamente lo que este glosario existe para evitar.

**`live` se dice de una sola manera: *En xogo*.** En cualquier posición
—estado, etiqueta, filtro, cabecera, aviso— y en cualquier superficie del
producto, `live` es **En xogo**. **Decidido por Alberto Fojo el 2026-09-03** en el
gate de SPEC-015, descartando expresamente la distinción estado/filtro que
`sdd-lingua` había recomendado el 2026-09-02
(`docs/epicas/EPIC-002-instrumentacion-de-las-cuatro-cifras/dictamenes-SPEC-015.md`,
§4.2). El motivo de la decisión es el que este glosario existe para defender: un
mismo estado se dice siempre igual, y dos formas registradas son dos formas que
alguien elegirá mal.

**Consecuencia pendiente, con disparador escrito y sin tocar nada hoy:**
`docs/diseno/` usa *Directo* como etiqueta de filtro en **siete** ficheros
—medido el 2026-09-03; algunos los genera su propio `build.mjs`— y **EPIC-004
está congelada**, así que no se editan. Queda inventariado en
EPIC-MEJORA con su disparador: **el día que se construya la interfaz del
marcador**.

Nota de norma, del mismo dictamen: **`aprazar`/`Aprazado`**, no *adiar*
(portugués). Y *rematar* tiene dos sentidos en fútbol —terminar y disparar a
puerta—, así que el estado se muestra **siempre con su etiqueta** («Estado:
Rematado») y nunca como frase suelta.

## Cualificadores del marcador (visibles en UI, en galego)

| Término | Significado | Notas |
|---|---|---|
| **provisional** | Publicado con una sola fuente de peso < 0.9 (RN-03). Califica la `Decision` entera: el marcador en las ramas que lo tienen, el **estado** en `scheduled` y `postponed`, que no lo tienen. | La interfaz lo distingue (p. ej. marcador en gris; sin marcador, el estado). Mejor provisional a tiempo que confirmado tarde. |
| **confirmado** | Publicado con fuente de peso ≥ 0.9, o dos fuentes independientes ≥ 0.7 coincidentes (RN-02). | Qué cuenta como **independientes** no se presume: se mide. Ver *Independencia entre fuentes*. |
| **pendente de confirmar** | `finished` alcanzado por timeout, sin fuente que lo cierre. | Literal en galego, va a i18n. **Se deriva, no se guarda** (SPEC-013, ADR-021 §6): la `Decision` vigente es `finished` y **ninguna** de sus observaciones de apoyo dice `finished`. |
| **sen sinal** | Partido `live` sin observación nueva en 15 min (RN-07). | Literal en galego, va a i18n. Genera alerta en el panel. **Se deriva, no se guarda** (SPEC-013, ADR-021 §6): la `Decision` vigente tiene `rule: 'RN-07'`. Entrar en *sen sinal* **emite `Decision`** —cambia lo que ve el usuario, y nada llega al usuario sin pasar por el motor (RN-08)— con el mismo estado y el mismo marcador; salir de él emite otra, con la regla que corresponda (RN-12, escalón 5: «la `Decision` solo mueve el marcador **o su cualificador**»). |

## Fuentes y organismos

| Término | Definición | Notas |
|---|---|---|
| **RFGF** | Real Federación Galega de Fútbol. Organiza Preferente Futgal **y** Terceira RFEF G1. | Fuente oficial. Objetivo estratégico: acuerdo de datos. |
| **futgal.es** | Web pública de la RFGF, HTML sin API. **Fuente oficial** de las dos competiciones del spike, peso 1.0 (RN-01). **Hoy no capturable** (ADR-008 §1). | Su `robots.txt` permite a `Twitterbot`, `Mediapartners-Google` y `AmazonAdBot`, y termina en `User-agent: *` / `Disallow: /`: nuestro user-agent cae en el comodín y **RN-11 obliga a respetarlo** (verificado el 2026-08-31). Sale del conjunto **capturable**, no del modelo: ni el peso ni la condición de oficial se tocan. Se levanta con **una de dos cosas y ninguna otra**: autorización escrita de la RFGF, o un `robots.txt` que nos permita — ni otro user-agent, ni menos peticiones, ni «es solo una hora». **Consecuencia:** sin futgal no hay **ninguna** fuente automática de peso ≥ 0.9, así que la primera vía de RN-02 queda cerrada para todo lo que no sea una persona y la segunda pasa a ser la única ruta automática a *confirmado* (SPEC-003). |
| **ceroacero.es** | Agregador operado por **ZOS, Lda.** (Vila Nova de Gaia, Portugal, NIF 508 565 804). **Primera** candidata del spike para las dos competiciones, a ritmo bajo. | Peso 0.7 (RN-01). Si es **espejo** de futgal, **independiente** o **inconcluso** lo dicta SPEC-002; mientras no lo dicte, RN-02 la trata como espejo (SPEC-002 CA-12). Sin futgal capturable solo se la puede cruzar con besoccer (SPEC-003). Su `robots.txt` prohíbe **una sola ruta** (`/zzmap_v3.php`) y permite el resto (verificado el 2026-08-31). Sobre sus ToS: la afirmación de ADR-002 «restringen el scraping» **no se declara falsa** —ausencia de prueba no es prueba de ausencia— sino **sin fuente localizable a 2026-08-31**, y por tanto **deja de ser premisa de nada** (ADR-008 §4); quien necesite apoyarse en ella, que la localice y la cite. En el spike es medición, no producción (RN-11). |
| **besoccer.es** | Agregador operado por **BESOCCER SOLUTIONS S.L.** (CIF B-93693042, Málaga). **Segunda** candidata del spike, por HTML. Su `SourceId` es `besoccer` y las URL apuntan a este host, no al viejo (ADR-008 §2). | Peso 0.7 (RN-01): el renombre **no lo cambia**. Mismo veredicto pendiente de SPEC-002 que ceroacero, y además se cruza **con ella** (SPEC-002 CA-15, SPEC-003): dos agregadores pueden ser independientes de futgal y espejos **entre sí**, y ese es el caso que dejaría a RN-02 sin segunda vía sin que nadie lo viese. Capturarla lo firma **ADR-008 §5** con riesgo residual aceptado y límites que son parte de la decisión: su página legal prohíbe registrar el contenido «por ningún sistema de recuperación de información», que es justo lo que RN-10 obliga a hacer. |
| **resultados-futbol.com** | **No es una fuente: es una redirección.** El dominio entero —raíz y `robots.txt`— responde **301** a `besoccer.es` (verificado el 2026-08-31; ADR-008 §2). | Entrada de resolución: el nombre viejo está escrito en ADR-002, SPEC-002 y sus ledgers, y quien lo lea tiene que poder resolverlo. Donde diga *resultados-futbol.com*, léase **besoccer.es**. Archivar su HTML bajo el `SourceId` `resultados-futbol` metería una fuente **mal etiquetada** en el raw store, que es el único artefacto del spike que le sobrevive. |
| **corresponsal** | Persona que *envía* una observación desde el campo, por el bot de Telegram. | Fuente push, la más barata y rápida. Peso 0.8 solo tras confirmación. Es **humano** a efectos de RN-04 y RN-06: puede bajar un marcador y aplazar un partido, y lo que publica sale *provisional* porque 0.8 < 0.9 (RN-01). |
| **operador** | Persona que *arbitra* desde el panel, con todas las fuentes y el histórico delante. | Peso 1.0 y **precedencia sobre la RFGF** si discrepan (RN-01). También es **humano** a efectos de RN-04 y RN-06; lo que le distingue del corresponsal no es el permiso sino el peso, y por eso una Decision nacida del panel se publica **confirmada, nunca provisional**. |
| **alias** | Nombre de un equipo tal como lo escribe una fuente concreta. | Catálogo por temporada. Un LLM propone, **una persona confirma una vez** (RN-09). |
| **catálogo de alias declarado** | El fichero JSON por **fuente y temporada** en el que una persona une cada grafía de esa fuente con el `TeamId` canónico del calendario declarado, con quién lo declaró y cuándo. **Declararlo es confirmarlo** (RN-09): cada entrada se carga como `confirmed`, con `confirmed_by`/`confirmed_at` del fichero; el LLM es una ayuda de redacción opcional fuera del sistema, nunca requisito, y la vía de proposición dentro del sistema (`proposed`) llega con el bot. Vive versionado en `alias/<temporada>/<source_id>.json`, se valida con zod y se carga con una CLI; cada carga queda registrada en `alias_loads` y **reemplaza** el catálogo de esa fuente y temporada entero — un alias retirado del fichero deja de resolver en esa misma carga, porque un alias es enrutado vigente y no un hecho histórico (ADR-018). | Añadido el 2026-09-02 (SPEC-011, ADR-018). La resolución es **todo o nada**: solo alias `confirmed`, coincidencia exacta tras la normalización de SPEC-001 CA-5, y exactamente un partido de `listByTeams`; cero o varios es fila sin resolver, que vuelve entera a una persona (SPEC-008 CA-13). |
| **adaptador de fuente** | El código que convierte lo que publica **una** fuente en `Observation` del modelo canónico. Hace cuatro cosas: pide la página por el camino cortés de RN-11, **archiva la respuesta cruda antes de mirarla** (RN-10), lee sus filas tal como la fuente las escribe, y construye `Observation` pidiendo la identidad del partido a quien la sabe. | Añadido el 2026-09-01 (SPEC-008). **No decide, no publica y no persiste**: publicar es escribir una `Decision` y la única puerta es el motor (RN-08). **Una fuente es una entrada de configuración, no una rama en el código**: su peso sale de RN-01 y sus URL del registro, así que el día que `futgal.es` sea capturable entra como *un adaptador más y un peso*, sin rehacer nada (ADR-008 §1, `_epica.md` de EPIC-002). No confundir con el **extractor** de `src/mirror/analysis/`, que es deliberadamente menos: lee para comparar fuentes y no construye ninguna `Observation`. |

## Independencia entre fuentes

> **Relación entre dos fuentes, no propiedad de una sola.** La mide **SPEC-002**
> (test de espejo) y la consume **RN-02**, cuya segunda vía —la única forma de
> publicar *confirmado* sin una fuente de peso ≥ 0.9— exige dos fuentes
> **independientes** con peso ≥ 0.7.

| Término | Definición | Notas |
|---|---|---|
| **espejo** | Fuente cuyos datos vienen de otra en lugar de observar el hecho: es *espejo de* ella. Dos espejos coinciden siempre, y su coincidencia no confirma nada. | Se prueba por **contenido**, no por tiempo: un error transitorio replicado —el mismo marcador equivocado y la misma corrección— es huella de **origen común**, que prueba que hay una tercera fuente detrás pero no cuál es (ver *Origen común y atribución*). Dos fuentes independientes coinciden en los aciertos, porque el marcador real es uno; en los fallos, no (SPEC-002 CA-10). |
| **independiente** | Fuente que observa el hecho por su cuenta. | Se prueba por **tiempo** —adelantar a la otra, cosa que un espejo no puede hacer— o por **discrepancia persistente** de contenido que no converge (SPEC-002 CA-9, CA-10). **La ausencia de adelantos NO prueba espejo:** una fuente independiente pero lenta produce exactamente la misma señal. |
| **inconcluso** | Tercer veredicto: no hay prueba ni de espejo ni de independencia. | **Resultado legítimo del test, no fallo suyo** (SPEC-002 CA-11). A efectos de RN-02 se trata como espejo: su segunda vía exige independencia *demostrada*, y lo desconocido no satisface la precondición (SPEC-002 CA-12). |

**Y en el motor la independencia es una relación *declarada*, no deducida en
caliente** *(añadido el 2026-09-02, SPEC-013, ADR-021 §7)*. Medirla es de
SPEC-002 y de su instrumento; lo que el motor consume es una **lista cerrada de
pares declarados independientes**, versionada en `src/decide/`, con el motivo de
cada entrada escrito a su lado —la forma de `MEASUREMENT_WINDOWS` (ADR-019 §3) y
de `ALLOWED_PACKAGES` (ADR-016 §3.2)—. La relación es **simétrica y por defecto
falsa**, que es la traducción ejecutable de «lo desconocido se trata como
espejo» (SPEC-002 CA-12). **La lista nace vacía**: con una sola fuente
automática capturable (ADR-008 §1), la segunda vía de RN-02 existe en el código,
se prueba entera con dobles y **hoy no se dispara con ninguna fuente real**. El
día que haya veredicto, o que vuelva `futgal.es`, es una entrada con su motivo,
no una reescritura del motor.

**Techo de resolución del instrumento.** RN-11 limita a 1 petición/minuto por
fuente y competición, así que el test no distingue diferencias menores de un
minuto: **un espejo cuyo retardo de propagación sea inferior a un minuto es
invisible** para él. Es el precio de una regla dura, no un defecto corregible
(SPEC-002, *Diseño* §2 y §3).

**Entre dos fuentes del mismo peso, ninguna es «la fuente».** Cuando se comparan
dos candidatas entre sí —y no contra la oficial—, la independencia **mutua**
exige que **cada una adelante a la otra**. Adelantos en una sola dirección no
prueban independencia: prueban que la rezagada podría ser espejo de la otra
(SPEC-002 CA-15).

### Origen común y atribución

| Término | Definición | Notas |
|---|---|---|
| **origen común** | Relación entre dos fuentes que **derivan de una tercera** en lugar de observar el hecho cada una por su cuenta. **No exige saber cuál es esa tercera.** | Se prueba por **contenido**: un error transitorio replicado por las dos —misma retractación, mismo partido— es prueba sólida. Los adelantos en una sola dirección y la sincronía son solo **indicio** (SPEC-003 CA-3, CA-6). |
| **atribución de origen** | Identificar **cuál** es esa tercera fuente. Paso distinto y posterior a probar que hay origen común. | **Exige observar a la candidata a origen.** Si no se ha capturado, no se afirma ni se niega: se declara **no comprobada** (`atribucion_de_origen: 'no_comprobada'`, `origen_atribuido_a: null`, `espejo_de: null`). No vale sustituirla por un `false`, que afirmaría lo contrario sin haberlo mirado tampoco (SPEC-003 CA-3, CA-7). |

**Probar un origen común no lo atribuye.** El cruce entre dos candidatas del
mismo peso puede probar que hay una tercera fuente detrás y **no** puede
nombrarla: por eso un veredicto ESPEJO sin referencia se emite sin `espejo_de`.
Confundir las dos cosas es lo que llevaría a afirmar «el origen no es futgal» a
partir de no haber mirado a futgal (SPEC-003, *Problema* y CA-3).

## Competición y calendario

| Término | Definición | Notas |
|---|---|---|
| **ventana de observación** | Periodo acotado durante el que se ejecuta la captura de una sesión de medición. Es la unidad de tiempo de la operación del spike, no del calendario de competición. | Literal en galego: **xanela de observación**, va a i18n (D-2). Es el hecho desde el que cuenta la retención de ADR-009: 30 días desde el **fin de la ventana** (el `fetched_at` de la última captura), una prórroga escrita y motivada, techo duro de 90. |
| **ventana de partido** | El intervalo `[kickoff − PRE, kickoff + POST)` durante el cual un partido es **elegible para ingesta**: un par (fuente, competición) solo gasta turno en un tick si algún partido suyo está en ventana (ADR-019 §2). Hoy `PRE` = 10 min y `POST` = 150 min. **No es la *ventana de observación***: aquélla acota una sesión de medición que opera una persona (EPIC-001, ADR-009); ésta es por partido, la calcula el tick dentro de cada minuto y nadie la opera. | Añadido el 2026-09-02 (SPEC-012, ADR-019 §2). Los dos números son **elegidos, no medidos** —como las 6 h de ADR-014 §3.2— y viven como constantes nombradas en un solo sitio (`src/ingest/windows.ts`), revisables con la evidencia de la primera jornada delante; cambiarlos es un diff de una línea, no un arbitraje. Un par sin partido en ventana no gasta turno, no produce petición y no deja registro: el silencio programado no es cobertura perdida. |
| **jornada** | Round de una competición. Unidad de medida de la operación del spike. | En código: `round`. En docs y UI: *jornada*. |
| **jornada de medición declarada** | Intervalo `[from, to)` sobre kickoffs, en cadenas ISO 8601 UTC, de la **lista cerrada** versionada en `src/ingest/measurement.ts` —cada entrada con su motivo escrito, como las de `ALLOWED_PACKAGES` (ADR-016 §3.2 por analogía)— fuera de la cual el tick **no pide nada**, esté el calendario cargado entero o no (ADR-019 §3). La lista nace **vacía**: es lo que hace verdadera «es medición, no producción» (RN-11) en la forma del código y no en la intención — el despliegue es estructuralmente incapaz de sondear la temporada entera (ADR-008 §5.2). | Añadido el 2026-09-02 (SPEC-012, ADR-019 §3, ADR-020). Declararla es un acto del operador con **dos precondiciones escritas** (ADR-020 §3): el dictamen de `sdd-legal-datos` sobre el régimen de jornada (SPEC-008 notas §7) y la **fecha de purga escrita antes** de correrla; sin acuse de la purga anterior no se declara la siguiente. La retención de su archivo se ancla a su `to`: 30 días desde el fin del intervalo, una prórroga escrita, techo duro de 90 (ADR-020 §2). Nota de nomenclatura: ADR-019 §3 escribe «ventana de medición declarada»; es el mismo intervalo, y el término canónico es éste (SPEC-012, ADR-020). Si la lista deja de ser una lista, el mecanismo no se ensancha: se escribe el ADR de producción que ADR-009 §6 exige. |
| **calendario declarado** | La lista de partidos de una competición y temporada que **una persona declara a mano** —competición, equipos con su nombre canónico, partidos por jornada con hora local y campo— a partir del calendario público de la RFGF, junto con quién la declaró y cuándo. Es el **denominador de la cobertura** y la lista contra la que se identifica un partido. | Añadido el 2026-09-01 (SPEC-010, ADR-017). Vive versionado en `calendario/<temporada>/<competition_id>.json`, se valida con zod y se carga en Postgres con una CLI; cada carga queda registrada. **No se obtiene de ninguna fuente por red**: la oficial no es capturable (ADR-008 §1) y usar la única automática como denominador haría circular la cifra. La identidad de un partido se deriva de él (`<competition_id>-<temporada>-j<round>-<home_id>-<away_id>`) y sobrevive a los cambios de hora, que son lo normal. |
| **huérfano** (partido) | Un partido que existía en la base de datos cuando se cargó un calendario nuevo pero no aparece en el nuevo fichero. El cargador **nunca borra**: la fila permanece en `matches` con su `id` y todas sus observaciones. Lo que sí desaparece es la relación de `calendar_loads` para esa carga: `orphans` lista los ids. Sirve para detectar cambios en la estructura de la competición (división de grupos, cambio de formato, equipo nuevo) sin perder historia. | Añadido el 2026-09-02 (SPEC-010). Solo aparece en `calendar_loads.orphans[]` como lista de `match_id`, nunca en la base. Si un partido cae a huérfano y después vuelve a aparecer en otra carga, se actualiza sin problema. |
| **Preferente Futgal** | Categoría galega. Grupo 1 en el spike. | Nombre canónico RFGF. No es "Preferente Gallega". |
| **Terceira RFEF grupo 1** | Cuarta categoría nacional, grupo galego, organizado por la RFGF. | Representa "lo nacional" en el spike. |
| **Nota sobre nomenclatura (2026-08-31)** | La forma canónica de esta competición es **«Terceira RFEF»** en galego, adoptada desde esta fecha. Artefactos anteriores e inmutables (ADR-002 aprobado, ledgers históricos de SPEC-003) conservan la forma anterior «Tercera RFEF», que designa la misma competición. Quien lea esos documentos encontrará ambas formas usadas indistintamente; son equivalentes. | Decisión de dominio: Alberto Fojo (2026-08-31). Escalada desde SPEC-004/005: la fuente autoritativa (futgal.es) **no es capturable** por RN-11, así que se decidió por consulta a la autoridad de competición. |
| **Primeira / Segunda Galega**, **Primeira Galega feminina** | Categorías galegas fuera del alcance del spike. | Nombres canónicos RFGF, en galego. |
