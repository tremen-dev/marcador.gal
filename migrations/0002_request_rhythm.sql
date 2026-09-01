-- 0002_request_rhythm.sql — SPEC-008 CA-14, the rhythm of RN-11 made durable.
--
-- Written by hand, applied in order, and WITHOUT ROLLBACK (ADR-006): undoing
-- this is writing 0003.
--
-- WHY A TABLE AND NOT THE RAW STORE. The archive records what CAME BACK, and
-- RN-11 counts what WENT OUT: a request that fails archives nothing, so the
-- next instance would see no key and ask again straight away — the source that
-- fails most would get the biggest burst. And the archive cannot be stamped
-- BEFORE the await, which is what turns the rhythm into a barrier instead of a
-- statistic. Postgres gives the one property the problem needs: granting and
-- stamping in a single atomic step, so two concurrent instances cannot both
-- win (ledger, «Enmienda — 2026-09-01» §4).
--
-- WHAT THIS TABLE IS NOT. It is not the canonical model. No `Observation` and
-- no `Decision` touch the database in this spec: those stay with «the first
-- spec that needs them» (F-SPEC-001-3). What is stored here is one instant per
-- pair — courtesy, not canon.
--
-- Time is `timestamptz`; the conversion to the ISO 8601 UTC string of the
-- canonical model happens in the data-access layer, not in the callers.

-- ------------------------------------------------------------- request_rhythm
-- The last instant at which a request LEFT, per (source, competition) pair.
-- The key is the pair because that is what RN-11 counts; the day the rhythm
-- has to be counted by anything else, this table stops being right and the
-- decision is taken again rather than widened in silence.
create table request_rhythm (
  pair             text        primary key check (length(pair) > 0),
  last_request_at  timestamptz not null
);
