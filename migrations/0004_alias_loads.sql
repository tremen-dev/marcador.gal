-- 0004_alias_loads.sql — SPEC-011, the record of every load of a declared
-- alias catalogue (ADR-018 §2).
--
-- Written by hand, applied in order, and WITHOUT ROLLBACK (ADR-006): undoing
-- this is writing 0005. ONE table and ONE trigger, and nothing else: 0001's
-- `team_aliases` and its RN-09 CHECKs are NOT touched — how the table is
-- FILLED is `loadAliasCatalog` (`src/db/aliases.ts`), and that is code, not
-- schema.
--
-- Every load of a declared alias catalogue is an ACT of a person and leaves a
-- row: which source and season, who declared the catalogue, when, from which
-- file (digest of the bytes), how many entries, and what the replacement did.
-- Loading is a fact even when nothing changed. Together with the live rows'
-- `confirmed_by` and the file's git history, this is the third place the
-- audit of «who confirmed what» lives (ADR-018 §2) — which is what lets the
-- replacement semantics delete stale rows without losing it.
--
-- Append-only like `observations` and `calendar_loads` (`reject_amendment` of
-- 0001, reused): RN-13 by analogy — the record of an act is not amended.
--
-- Time is `timestamptz`; the conversion to the ISO 8601 UTC string happens in
-- the data-access layer, not in the callers.

create table alias_loads (
  id            integer     generated always as identity primary key,
  -- Kebab-case by the schema of the FILE (`src/alias/catalog.ts`); the base
  -- keeps the cheap half, as `team_aliases.source` does.
  source        text        not null check (length(source) > 0),
  season        text        not null check (length(season) > 0),
  -- A person. The empty string is the shape «nobody declared it» takes, the
  -- same rule as `team_aliases.confirmed_by` (RN-09, CA-3.3).
  declared_by   text        not null check (length(declared_by) > 0),
  declared_at   timestamptz not null,
  loaded_at     timestamptz not null,
  -- sha256 of the bytes of the file, hex.
  file_digest   text        not null check (file_digest ~ '^[0-9a-f]{64}$'),
  -- The schema refuses an empty catalogue (emptying is a different act,
  -- ADR-018), so no load of zero entries can ever have happened.
  aliases_count integer     not null check (aliases_count >= 1),
  inserted      integer     not null check (inserted >= 0),
  removed       integer     not null check (removed >= 0)
);

create trigger alias_loads_are_immutable
before update or delete on alias_loads
for each row
execute function reject_amendment();
