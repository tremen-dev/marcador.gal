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
| `Team` | Un equipo con nombre canónico y alias. | `(id, canonical_name, aliases[])`. El nombre canónico es **el de la RFGF**. "UD Ourense" ≠ "Ourense CF". |
| `Match` | Un partido programado. | `(id, competition_id, round, kickoff, home_id, away_id, venue)`. |
| `Observation` | **Lo que dice una fuente en un instante.** Nunca se borra ni se corrige: es un hecho histórico. | `(id, match_id, source, observed_at, status, home_score, away_score, confidence, raw_ref)`. |
| `Decision` | **Lo que publicamos.** Log append-only; la última por partido es la vigente. | `(match_id, status, home_score, away_score, provisional, rule, decided_at, supporting_observation_ids[], version)`. |
| `rule` | La regla del motor (RN-xx) que produjo una Decision. Obligatoria. | Sin `rule` una Decision no es trazable y no debe existir. |
| `raw store` | Copia con timestamp de cada respuesta cruda de una fuente, guardada **antes** de parsearla. | Permite reprocesar cuando un parser falla y reproducir una jornada entera en tests (RN-10). |

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
| **provisional** | Publicado con una sola fuente de peso < 0.9 (RN-03). | La interfaz lo distingue (p. ej. marcador en gris). Mejor provisional a tiempo que confirmado tarde. |
| **confirmado** | Publicado con fuente de peso ≥ 0.9, o dos fuentes independientes ≥ 0.7 coincidentes (RN-02). | |
| **pendente de confirmar** | `finished` alcanzado por timeout, sin fuente que lo cierre. | Literal en galego, va a i18n. |
| **sen sinal** | Partido `live` sin observación nueva en 15 min (RN-07). | Literal en galego, va a i18n. Genera alerta en el panel. |

## Fuentes y organismos

| Término | Definición | Notas |
|---|---|---|
| **RFGF** | Real Federación Galega de Fútbol. Organiza Preferente Futgal **y** Tercera RFEF G1. | Fuente oficial. Objetivo estratégico: acuerdo de datos. |
| **futgal.es** | Web pública de la RFGF. | Fuente oficial del spike, HTML sin API (ADR-002). |
| **ceroacero.es** | Agregador. | Contraste del spike. Parte del spike es medir si es fuente independiente o **espejo** de futgal. |
| **corresponsal** | Persona que envía marcadores por el bot de Telegram. | Fuente push, la más barata y rápida. Peso 0.8 solo tras confirmación. |
| **alias** | Nombre de un equipo tal como lo escribe una fuente concreta. | Catálogo por temporada. Un LLM propone, **una persona confirma una vez** (RN-09). |

## Competición y calendario

| Término | Definición | Notas |
|---|---|---|
| **jornada** | Round de una competición. Unidad de medida de la operación del spike. | En código: `round`. En docs y UI: *jornada*. |
| **Preferente Futgal** | Categoría galega. Grupo 1 en el spike. | Nombre canónico RFGF. No es "Preferente Gallega". |
| **Tercera RFEF grupo 1** | Cuarta categoría nacional, grupo galego, organizado por la RFGF. | Representa "lo nacional" en el spike. |
| **Primeira / Segunda Galega**, **Primeira Galega feminina** | Categorías galegas fuera del alcance del spike. | Nombres canónicos RFGF, en galego. |
