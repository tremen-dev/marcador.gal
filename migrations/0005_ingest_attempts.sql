-- 0005_ingest_attempts.sql — SPEC-012, the durable record of every ingest
-- attempt (ADR-019 §5).
--
-- Written by hand, applied in order, and WITHOUT ROLLBACK (ADR-006): undoing
-- this is writing 0006.
--
-- One row per ATTEMPT at an eligible (source, competition) pair. What does NOT
-- write a row is fixed by ADR-019 §5 and lives in the tick, not here: a tick
-- with no eligible pairs, and a turn suppressed by RN-11's minute — a
-- suppressed tick is not a failed tick, and recording it would read as lost
-- coverage (SPEC-008 §4).
--
-- The unresolved names travel WHOLE (RN-09): they are the work queue of the
-- alias catalogue, and today they have no other durable place. The engine's
-- failure list and the audit of «why did this minute produce nothing» read
-- from here; Vercel's logs are ephemeral and are not an artefact.
--
-- NOT the canonical model, like `request_rhythm` and `calendar_loads` are
-- not: no parity entry, no zod schema in `src/model/`. Append-only with
-- `reject_amendment` (0001, reused): an attempt is a historical fact
-- (RN-13 by analogy).
--
-- Time is `timestamptz`; the conversion to the ISO 8601 UTC string happens in
-- the data-access layer, not in the callers.

create table ingest_attempts (
  id                 integer     generated always as identity primary key,
  source             text        not null check (length(source) > 0),
  competition_id     text        not null check (length(competition_id) > 0),
  attempted_at       timestamptz not null,
  outcome            text        not null check (outcome in ('ok', 'skipped', 'failed')),
  -- Why nothing (or less than everything) came out of the attempt. An `ok`
  -- carries none, and anything else carries one: a skip whose reason nobody
  -- can read is a hole in the audit (ADR-019 §5).
  reason             text        check ((outcome = 'ok') = (reason is null)),
  raw_ref            text,
  observations_count integer     not null check (observations_count >= 0),
  unresolved_names   text[]      not null
);

create trigger ingest_attempts_are_immutable
before update or delete on ingest_attempts
for each row
execute function reject_amendment();
