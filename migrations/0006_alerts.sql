-- 0006_alerts.sql — SPEC-013, el registro de las alertas del motor
-- (ADR-021 §5).
--
-- Escrita a mano, aplicada en orden, y SIN ROLLBACK (ADR-006): deshacer esto
-- es escribir 0007.
--
-- Una fila por ENTRADA en una condición de alerta, no por minuto que dura. Un
-- conflicto de media hora con un tick por minuto son UNA fila, no treinta: lo
-- que decide si es nueva es la última alerta de esa regla para ese partido, y
-- esa comparación vive en el motor (`src/decide/rules.ts`), que sigue siendo
-- puro porque la recibe como dato.
--
-- Y ES LA MATERIA PRIMA DE LA TERCERA CIFRA DE EPIC-002 — «% de partidos con
-- desacuerdo entre fuentes en algún momento»— que se cuenta sobre esta tabla.
-- Sin este registro habría que reconstruirla adivinando desde `observations`,
-- que es exactamente el tipo de cifra que la épica prohíbe.
--
-- NO es el modelo canónico, como no lo son `request_rhythm`, `calendar_loads`,
-- `alias_loads` ni `ingest_attempts`: ni entrada de paridad (SPEC-001 CA-14),
-- ni esquema zod en `src/model/`. El suyo vive en `src/decide/alert.ts`, que
-- es donde vive el vocabulario del motor.
--
-- Append-only con `reject_amendment` (0001, reutilizada): una alerta es un
-- hecho histórico (RN-13 por analogía). SIN ACUSE, SIN ESTADO «VISTA» Y SIN
-- DESTINATARIO: la bandeja es del panel, y el panel no existe todavía.
--
-- El tiempo es `timestamptz`; la conversión a la cadena ISO 8601 UTC ocurre en
-- la capa de acceso a datos, no en las llamadas.

create table alerts (
  id              integer     generated always as identity primary key,
  match_id        text        not null references matches (id),
  -- Solo las dos reglas que `reglas.md` dice que «generan alerta al panel».
  -- Lista cerrada y no una forma (`~ '^RN-[0-9]{2}$'`), por la misma razón que
  -- en `decisions`: `RN-13` cumple la forma y no alerta de nada.
  rule            text        not null check (rule in ('RN-05', 'RN-07')),
  raised_at       timestamptz not null,
  -- El motivo, y es load-bearing: es la HUELLA de la condición. Un conflicto
  -- que sigue diciendo lo mismo produce el mismo motivo y por tanto ninguna
  -- fila nueva; una discrepancia con otros valores produce otro (CA-6.6).
  reason          text        not null check (length(reason) > 0),
  -- Las observaciones implicadas. Al menos una: una alerta sobre nada miente.
  observation_ids text[]      not null check (cardinality(observation_ids) >= 1)
);

create index alerts_by_match on alerts (match_id, rule, raised_at desc);

create trigger alerts_are_immutable
before update or delete on alerts
for each row
execute function reject_amendment();
