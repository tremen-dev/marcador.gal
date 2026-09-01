---
tipo: procedimiento
---
# Calendario de compromisos con fecha

> Índice, no fuente. Cada fila apunta a dónde vive la decisión; si mañana cambia
> una fecha, cambia en su sitio y aquí solo el enlace tiene que seguir valiendo.
> Nace porque hoy las fechas con plazo están dispersas en seis ficheros
> (`docs/roadmap.md`, `docs/negocio/carta-rfgf-acceso.md`, las épicas de
> EPIC-001, EPIC-002 y EPIC-004, el ledger de SPEC-003 y
> `hallazgos/fontes-capturables.md`) y ninguno las junta.

| Fecha | Qué vence | Quién puede hacerlo | Qué pasa si nadie lo hace | Dónde vive la verdad |
|---|---|---|---|---|
| **2026-09-06** (domingo) | Verificar `lapreferente.com` con partidos en juego: candidata a tercera fuente automática. Sirve HTML real y usa el nombre canónico `preferente-futgal-grupo-1`, pero no se le encontró hora de comienzo ni rastro de directo, y en reposo «no publica en vivo» y «no hay nada en vivo» son la misma página — solo se distingue con partidos. Única ventana con partidos suficientes: **17 partidos ese domingo** (8 de Preferente, 9 de Terceira RFEF); el sábado 5 hay uno y N_min es 10. Si sirve, hace falta dictamen de `sdd-legal-datos` y un ADR que enmiende ADR-008 | Una persona, con partidos en juego el domingo — no es automatizable | La candidata queda sin verificar y EPIC-001 se cierra con la única fuente automática capturable que ya hay (`ceroacero.es`) | `docs/epicas/EPIC-001-spike-ingesta/_epica.md`, «Fechas que nadie va a recordar solo» y «Lo que desbloquea» |
| **2026-09-08** | Vence el plazo de una semana dado a la RFGF (carta enviada el 2026-09-01 a `info@futgal.es`). Sin respuesta, se da por no contestada y **no se insiste, ni por teléfono ni por otra vía**. Ese día EPIC-001 puede cerrarse diga lo que diga la federación | Alberto Fojo (única persona que decide el cierre de la épica; el vencimiento en sí no requiere acción, es automático) | Nada roto: es justo el resultado previsto — EPIC-001 se cierra con una sola fuente automática capturable, que es un resultado, no un fracaso | `docs/roadmap.md` |
| **2026-09-08** | Decisión pendiente, no tarea: si se manda un segundo correo (a otra dirección o a un contacto de sistemas) o no se manda ninguno. Alberto Fojo ya descartó el teléfono; sobre el segundo correo no se ha pronunciado | Alberto Fojo — es la única persona que puede tomar esta decisión | **Mientras no se pronuncie, no se manda ninguno**: es la regla por defecto, no un olvido | `docs/roadmap.md` |
| **2026-09-30** | Purga del raw store: las 12 capturas del 2026-08-31 que viven en `raw/`, fuera de git a propósito (ADR-009, opción B). Hay que borrarlas y escribir el acuse en el ledger de SPEC-003 | Una persona, a mano sobre `raw/` o sobre el store de Blob — `RawStore` no tiene operación de borrado a propósito (ADR-009 §5) | **Ningún test se pondrá rojo si nadie lo hace.** El finding `F-SPEC-005-V2` ya avisa de que la purga no tiene ejecutor: `retention.ts` solo declara fechas en el informe, sin consultar la hora. Techo duro: **2026-11-29** | ADR-009 (`docs/adr/ADR-009-*.md`) y `docs/epicas/EPIC-001-spike-ingesta/SPEC-003-test-de-espejo-sin-referencia-el-cruce-entre-candidatas.ledger.md` |
| **2027-08-31** | Expira el dominio `marcador.gal` (contratado el 2026-08-31 en Dinahosting) | Quien gestione la cuenta de Dinahosting | El dominio queda libre y se pierde | `docs/negocio/marca.md` |

## Por qué existe este documento

Cuatro de estas cinco fechas **no las vigila ningún test**, y el proyecto no
tiene CI (`F-SPEC-004-3` · `F-SPEC-005-4`): nadie va a enterarse en rojo de que
se pasó un plazo. La única con cierta red es la del dominio, y esa red es
externa (el registrador, no este repositorio). Este documento no sustituye esa
ausencia —sigue sin haber nada que falle si una fila de esta tabla se
incumple— pero al menos las junta en un sitio, para que «nadie lo va a
recordar solo» deje de ser cierto por dispersión.
