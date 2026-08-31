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

### Representación del tiempo

Todo instante del modelo canónico (`kickoff`, `observed_at`, `decided_at`,
`confirmed_at`, `stored_at`) es una **cadena ISO 8601 en UTC con sufijo `Z`**,
nunca un `Date` (ADR-006). El tipo cruza al frontend por JSON, y `Date` no
sobrevive a `JSON.stringify` / `JSON.parse`.

## Estados de un partido

| Término | Significado | Cómo se entra |
|---|---|---|
| `scheduled` | Programado, sin señal de juego. | Estado inicial. |
| `live` | En juego. | Primera observación de juego después de `kickoff − 2 min` (RN-06). |
| `finished` | Terminado. | Fuente oficial, dos fuentes coincidentes, o `kickoff + 110 min` sin señal (RN-06). |
| `postponed` | Aplazado. | **Solo** fuente oficial o humano (RN-06). |
| `suspended` | Suspendido. | **Solo** fuente oficial o humano (RN-06). |

## Cualificadores del marcador (visibles en UI, en galego)

| Término | Significado | Notas |
|---|---|---|
| **provisional** | Publicado con una sola fuente de peso < 0.9 (RN-03). Califica la `Decision` entera: el marcador en las ramas que lo tienen, el **estado** en `scheduled` y `postponed`, que no lo tienen. | La interfaz lo distingue (p. ej. marcador en gris; sin marcador, el estado). Mejor provisional a tiempo que confirmado tarde. |
| **confirmado** | Publicado con fuente de peso ≥ 0.9, o dos fuentes independientes ≥ 0.7 coincidentes (RN-02). | Qué cuenta como **independientes** no se presume: se mide. Ver *Independencia entre fuentes*. |
| **pendente de confirmar** | `finished` alcanzado por timeout, sin fuente que lo cierre. | Literal en galego, va a i18n. |
| **sen sinal** | Partido `live` sin observación nueva en 15 min (RN-07). | Literal en galego, va a i18n. Genera alerta en el panel. |

## Fuentes y organismos

| Término | Definición | Notas |
|---|---|---|
| **RFGF** | Real Federación Galega de Fútbol. Organiza Preferente Futgal **y** Tercera RFEF G1. | Fuente oficial. Objetivo estratégico: acuerdo de datos. |
| **futgal.es** | Web pública de la RFGF. | Fuente oficial del spike, HTML sin API (ADR-002). |
| **ceroacero.es** | Agregador. Fuente de **contraste** del spike para las dos competiciones, a ritmo bajo (ADR-002). | Peso 0.7 (RN-01). Si es **espejo** de futgal, **independiente** o **inconcluso** lo dicta SPEC-002; mientras no lo dicte, RN-02 la trata como espejo (SPEC-002 CA-12). Sus ToS restringen el scraping: en el spike es medición (RN-11). |
| **besoccer.es** | Agregador operado por **BESOCCER SOLUTIONS S.L.** (CIF B-93693042, Málaga). **Segunda** candidata del spike, por HTML. Su `SourceId` es `besoccer` y las URL apuntan a este host, no al viejo (ADR-008 §2). | Peso 0.7 (RN-01): el renombre **no lo cambia**. Mismo veredicto pendiente de SPEC-002 que ceroacero, y además se cruza **con ella** (SPEC-002 CA-15, SPEC-003): dos agregadores pueden ser independientes de futgal y espejos **entre sí**, y ese es el caso que dejaría a RN-02 sin segunda vía sin que nadie lo viese. Capturarla lo firma **ADR-008 §5** con riesgo residual aceptado y límites que son parte de la decisión: su página legal prohíbe registrar el contenido «por ningún sistema de recuperación de información», que es justo lo que RN-10 obliga a hacer. |
| **resultados-futbol.com** | **No es una fuente: es una redirección.** El dominio entero —raíz y `robots.txt`— responde **301** a `besoccer.es` (verificado el 2026-08-31; ADR-008 §2). | Entrada de resolución: el nombre viejo está escrito en ADR-002, SPEC-002 y sus ledgers, y quien lo lea tiene que poder resolverlo. Donde diga *resultados-futbol.com*, léase **besoccer.es**. Archivar su HTML bajo el `SourceId` `resultados-futbol` metería una fuente **mal etiquetada** en el raw store, que es el único artefacto del spike que le sobrevive. |
| **corresponsal** | Persona que *envía* una observación desde el campo, por el bot de Telegram. | Fuente push, la más barata y rápida. Peso 0.8 solo tras confirmación. Es **humano** a efectos de RN-04 y RN-06: puede bajar un marcador y aplazar un partido, y lo que publica sale *provisional* porque 0.8 < 0.9 (RN-01). |
| **operador** | Persona que *arbitra* desde el panel, con todas las fuentes y el histórico delante. | Peso 1.0 y **precedencia sobre la RFGF** si discrepan (RN-01). También es **humano** a efectos de RN-04 y RN-06; lo que le distingue del corresponsal no es el permiso sino el peso, y por eso una Decision nacida del panel se publica **confirmada, nunca provisional**. |
| **alias** | Nombre de un equipo tal como lo escribe una fuente concreta. | Catálogo por temporada. Un LLM propone, **una persona confirma una vez** (RN-09). |

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
| **jornada** | Round de una competición. Unidad de medida de la operación del spike. | En código: `round`. En docs y UI: *jornada*. |
| **Preferente Futgal** | Categoría galega. Grupo 1 en el spike. | Nombre canónico RFGF. No es "Preferente Gallega". |
| **Tercera RFEF grupo 1** | Cuarta categoría nacional, grupo galego, organizado por la RFGF. | Representa "lo nacional" en el spike. |
| **Primeira / Segunda Galega**, **Primeira Galega feminina** | Categorías galegas fuera del alcance del spike. | Nombres canónicos RFGF, en galego. |
