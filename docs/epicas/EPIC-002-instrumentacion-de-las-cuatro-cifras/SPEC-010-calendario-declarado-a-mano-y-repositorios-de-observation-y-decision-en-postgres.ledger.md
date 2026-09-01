---
id: SPEC-010
tipo: ledger
epica: EPIC-002
---
# Ledger — SPEC-010 Calendario declarado a mano y repositorios de Observation y Decision en Postgres

## Resumen
- Fase: **`borrador`** — escrita el 2026-09-01 por `sdd-arquitecto`, **sin
  aprobar**: la firma es de una persona y ningún rol `sdd-*` puede darla.
- Trae **ADR-017** (`borrador`), que fija dónde vive el calendario, cómo se
  identifica un partido y las dos semánticas de persistencia. La spec lo ejecuta;
  si el gate cambia el ADR, cambian CA-1..CA-5 y CA-7..CA-8.
- Cierra **F-SPEC-001-3** (implementación Postgres de `ObservationStore` y
  `DecisionStore`) **sin reabrir SPEC-001**: los puertos no cambian. Al cerrar,
  el ledger de SPEC-001 recibe una referencia cruzada (ADR-011 §6).
- Rama: `ft/SPEC-010-calendario-y-repositorios` (ya existe, creada desde `main`).

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 — el calendario declarado se valida entero y nombra la fila que falla | | | | ❌ |
| CA-2 — hora local a cadena ISO UTC en el borde; lo inexistente se rechaza | | | | ❌ |
| CA-3 — identidad de partido derivada y estable | | | | ❌ |
| CA-4 — carga upsert transaccional, sin borrado, identidad inmutable | | | | ❌ |
| CA-5 — cada carga deja constancia (`calendar_loads`, append-only) | | | | ❌ |
| CA-6 — CLI `calendario:cargar`, recuentos y fallos claros | | | | ❌ |
| CA-7 — `PostgresObservationStore`: append idempotente, conflicto nombrado | | | | ❌ |
| CA-8 — `PostgresDecisionStore`: versiones contiguas, una gana | | | | ❌ |
| CA-9 — `PostgresMatchStore`: lecturas parseadas, ordenadas, por intervalo | | | | ❌ |
| CA-10 — `migrations/0003` en orden, sin columnas nuevas en el canónico | | | | ❌ |
| CA-11 — los tres gates, las dos suites, las suites cerradas enteras | | | | ❌ |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-010/. Informe HTML opcional: _qa/SPEC-010/informe.html -->
n-a: esta spec no tiene superficie de UI.

## Salvedades / follow-ups
<!-- IDs F-SPEC-010-1, F-SPEC-010-2… con destino (spec futura o EPIC-MEJORA). -->

Abiertas ya al redactar (ver *Notas para el gate humano* de la spec):

- **F-SPEC-010-1** — Dictamen de `sdd-legal-datos` sobre versionar en el
  repositorio una lista de partidos federativa copiada a mano. Destino: **antes
  de commitear el primer fichero real** de `calendario/`; no bloquea la
  aprobación del mecanismo.
- **F-SPEC-010-2** — Dictamen de `sdd-competicion` sobre los nombres canónicos
  del fichero real y sobre la asunción «un equipo juega como mucho un partido
  por jornada». Destino: paso previo del runbook de carga
  (`sdd-documentalista`).
- **F-SPEC-010-3** — El caso cruzado de «un partido por jornada» solo lo cierra
  el cargador, no la base, porque la semilla de `tests/db/_harness.ts` lo viola a
  propósito (ADR-017 §3). Destino: **EPIC-MEJORA**, disparador «la primera vez que
  alguien inserte partidos por SQL fuera del cargador» o «cualquier trabajo que
  ya toque `_harness.ts`».
- **F-SPEC-010-4** — La divergencia entre el fichero versionado y la copia
  cargada no la avisa nada: `calendar_loads.file_digest` permite detectarla, no
  vigilarla. Destino: **EPIC-MEJORA**, disparador «el día que haya CI» (con
  F-SPEC-004-3 · F-SPEC-005-4).
- **F-SPEC-010-5** — `_epica.md` de EPIC-002 dice «refresco cada 6 h» del
  calendario y ADR-017 §2 lo reinterpreta. Destino: `sdd-producto`, si el gate
  acepta la reinterpretación.

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->

**No hay trabajo empezado: la spec está en `borrador` y espera firma humana.**
Lo que hay que mirar antes que nada, en este orden:

1. **Las notas del gate §1..§3**: legal-datos sobre el fichero versionado, la
   reinterpretación del «refresco cada 6 h», y cómo se lee la precondición de
   retención de EPIC-003 / ADR-009 §6 respecto a una spec que persiste pero no
   ingiere. Las tres pueden cambiar el alcance; las demás notas son detalle.
2. **ADR-017** se firma con la spec o no se firma: la spec lo ejecuta entero.
3. **Dónde vive lo que se hereda**: `src/db/ports.ts` (puertos de SPEC-001, no se
   tocan), `src/db/client.ts` (`createClient` con el conversor de instantes),
   `src/db/migrate.ts`, `tests/db/_harness.ts` (arnés y semilla, **no se toca la
   semilla**), `src/polite/clock.ts` (`Clock`, `systemClock`), `src/ingest/ports.ts`
   (`MatchResolver`, que esta spec no implementa y la siguiente sí).
4. **Orden de implementación sugerido**: CA-1..CA-3 (puras, `npm test`) → CA-10
   (migración) → CA-4, CA-5 (carga) → CA-7, CA-8, CA-9 (repositorios) → CA-6
   (CLI) → CA-11.
5. **Para correr las dos suites desde un worktree**: `npm ci` **dentro** del
   worktree y copiar `.env.local` del checkout principal (para
   `DATABASE_URL_TEST`). Nunca un symlink, nunca `git add -f`. Si `test:db` da
   `ENOTFOUND` contra Neon, es DNS: repetir (F-SPEC-008-21).
6. **Si SPEC-009 se mergea antes**, la línea de `ENTRY_POINTS` de CA-6 se
   reubica donde SPEC-009 haya dejado la lista; nada más de esta spec toca
   `tests/polite/`.
