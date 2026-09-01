-- 0003_declared_calendar.sql — SPEC-010, the declared calendar and what the
-- database guarantees about the canonical model once it is persisted
-- (ADR-017 §2, §3, §5).
--
-- Written by hand, applied in order, and WITHOUT ROLLBACK (ADR-006): undoing
-- this is writing 0004. Two unique indexes, two trigger functions, one table.
--
-- NO COLUMN IS ADDED TO ANY TABLE OF THE CANONICAL MODEL (CA-10.2). What is
-- added to `matches` and `decisions` is behaviour — indexes and triggers — and
-- `calendar_loads` is not the canonical model, as `request_rhythm` is not:
-- it records an ACT of a person, not a fact about a match.
--
-- Time is `timestamptz`; the conversion to the ISO 8601 UTC string of the
-- canonical model happens in the data-access layer, not in the callers.

-- ---------------------------------------------------------- matches: identity
-- A team plays at most once per round. The database guarantees it where a
-- unique index reaches — twice at home, or twice away, in the same round.
--
-- THE CROSSED CASE — home in one match and away in another of the same round
-- — IS NOT COVERED HERE, ON PURPOSE. The seed of `tests/db/_harness.ts`
-- (SPEC-001, done) has exactly that shape in round 23 for its RN-12 tests,
-- and lowering the invariant into the database would mean touching the
-- support of a closed spec. The loader closes it whole (`src/calendar/
-- schedule.ts`); a row inserted by hand through SQL can violate it, and that
-- is written down in SPEC-010 §3 and ADR-017 §3 (F-SPEC-010-3).
create unique index matches_one_home_per_round
  on matches (competition_id, round, home_id);

create unique index matches_one_away_per_round
  on matches (competition_id, round, away_id);

-- The identity of a match — (competition_id, round, home_id, away_id) — is
-- what its `id` is derived from, and `observations` and `decisions` point at
-- that `id` by foreign key. Changing the identity is ANOTHER match: the old
-- one stays and the loader reports it as an orphan. `kickoff` and `venue` are
-- mutable: a postponement with a new date is the same match at another hour,
-- and the observations it already had are still its own (RN-13).
create function matches_identity_is_immutable()
returns trigger
language plpgsql
as $$
begin
  if new.id is distinct from old.id
     or new.competition_id is distinct from old.competition_id
     or new.round is distinct from old.round
     or new.home_id is distinct from old.home_id
     or new.away_id is distinct from old.away_id then
    raise exception
      'the identity of match % (competition_id, round, home_id, away_id) is immutable (ADR-017 §3, RN-13 by analogy): only kickoff and venue may change',
      old.id
      using errcode = 'restrict_violation';
  end if;

  return new;
end;
$$;

create trigger matches_identity_is_immutable
before update on matches
for each row
execute function matches_identity_is_immutable();

-- ----------------------------------------------------- decisions: contiguity
-- The versions of a match's Decisions are contiguous, and THE DATABASE
-- arbitrates it (ADR-017 §5): version = max(version) + 1 per match, 1 for the
-- first.
--
-- AN AFTER TRIGGER, ON PURPOSE. A BEFORE trigger would speak before the CHECK
-- `decisions_version_positive` and before the primary key (match_id, version)
-- of 0001, and SPEC-001 CA-15 already asserts, with tests that this migration
-- must not touch, which of those two names a duplicate and a zero. So the row
-- goes in first, the constraints of 0001 have their say, and only then is
-- contiguity checked: the version just below the new one has to exist (or the
-- new one has to be 1). Under READ COMMITTED two concurrent inserts of the
-- same version both pass this check and the primary key lets exactly one win;
-- the loser gets a unique violation on `decisions_pkey`, which the repository
-- names as a version conflict. The engine receives a distinguishable error
-- and decides what to do with it; it does NOT compute its version hoping to
-- be alone (F-SPEC-008-V13, applied to the entity that reaches the screen).
create function decisions_versions_are_contiguous()
returns trigger
language plpgsql
as $$
declare
  previous integer;
begin
  select coalesce(max(version), 0)
    into previous
    from decisions
   where match_id = new.match_id
     and version < new.version;

  if new.version <> previous + 1 then
    raise exception
      'decision version % for match % is not contiguous: the next version is % (ADR-017 §5)',
      new.version, new.match_id, previous + 1
      using errcode = 'integrity_constraint_violation';
  end if;

  return null;
end;
$$;

create trigger decisions_versions_are_contiguous
after insert on decisions
for each row
execute function decisions_versions_are_contiguous();

-- -------------------------------------------------------------- calendar_loads
-- Every load of a declared calendar is an ACT of a person and leaves a row:
-- who declared the calendar, when, from which file (digest of the bytes),
-- which rounds, how many matches, and what the load did. It is the evidence
-- the coverage figure has to be able to cite — «the denominator was declared
-- by X on Y from file Z» — and it is append-only like `observations`
-- (`reject_amendment` of 0001, reused). Loading is a fact even when nothing
-- changed.
create table calendar_loads (
  id              integer     generated always as identity primary key,
  competition_id  text        not null references competitions (id),
  -- A person. The empty string is the shape «nobody declared it» takes, the
  -- same rule as `team_aliases.confirmed_by`.
  declared_by     text        not null check (length(declared_by) > 0),
  declared_at     timestamptz not null,
  loaded_at       timestamptz not null,
  -- sha256 of the bytes of the file, hex.
  file_digest     text        not null check (file_digest ~ '^[0-9a-f]{64}$'),
  -- The rounds the file declared. What the orphans were computed against.
  rounds          integer[]   not null check (cardinality(rounds) >= 1),
  matches_count   integer     not null check (matches_count >= 0),
  inserted        integer     not null check (inserted >= 0),
  updated         integer     not null check (updated >= 0)
);

create trigger calendar_loads_are_immutable
before update or delete on calendar_loads
for each row
execute function reject_amendment();
