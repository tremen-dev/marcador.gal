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
| **confirmado** | Publicado con fuente de peso ≥ 0.9, o dos fuentes independientes ≥ 0.7 coincidentes (RN-02). | |
| **pendente de confirmar** | `finished` alcanzado por timeout, sin fuente que lo cierre. | Literal en galego, va a i18n. |
| **sen sinal** | Partido `live` sin observación nueva en 15 min (RN-07). | Literal en galego, va a i18n. Genera alerta en el panel. |

## Fuentes y organismos

| Término | Definición | Notas |
|---|---|---|
| **RFGF** | Real Federación Galega de Fútbol. Organiza Preferente Futgal **y** Tercera RFEF G1. | Fuente oficial. Objetivo estratégico: acuerdo de datos. |
| **futgal.es** | Web pública de la RFGF. | Fuente oficial del spike, HTML sin API (ADR-002). |
| **ceroacero.es** | Agregador. | Contraste del spike. Parte del spike es medir si es fuente independiente o **espejo** de futgal. |
| **corresponsal** | Persona que *envía* una observación desde el campo, por el bot de Telegram. | Fuente push, la más barata y rápida. Peso 0.8 solo tras confirmación. Es **humano** a efectos de RN-04 y RN-06: puede bajar un marcador y aplazar un partido, y lo que publica sale *provisional* porque 0.8 < 0.9 (RN-01). |
| **operador** | Persona que *arbitra* desde el panel, con todas las fuentes y el histórico delante. | Peso 1.0 y **precedencia sobre la RFGF** si discrepan (RN-01). También es **humano** a efectos de RN-04 y RN-06; lo que le distingue del corresponsal no es el permiso sino el peso, y por eso una Decision nacida del panel se publica **confirmada, nunca provisional**. |
| **alias** | Nombre de un equipo tal como lo escribe una fuente concreta. | Catálogo por temporada. Un LLM propone, **una persona confirma una vez** (RN-09). |

## Competición y calendario

| Término | Definición | Notas |
|---|---|---|
| **jornada** | Round de una competición. Unidad de medida de la operación del spike. | En código: `round`. En docs y UI: *jornada*. |
| **Preferente Futgal** | Categoría galega. Grupo 1 en el spike. | Nombre canónico RFGF. No es "Preferente Gallega". |
| **Tercera RFEF grupo 1** | Cuarta categoría nacional, grupo galego, organizado por la RFGF. | Representa "lo nacional" en el spike. |
| **Primeira / Segunda Galega**, **Primeira Galega feminina** | Categorías galegas fuera del alcance del spike. | Nombres canónicos RFGF, en galego. |
