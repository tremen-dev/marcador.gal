-- 0001_canonical_model.sql — SPEC-001, the canonical model in Postgres.
--
-- Written by hand, not generated (ADR-006). The invariants that matter most to
-- this project — RN-09, RN-12, RN-13 — are CHECKs over arrays and plpgsql
-- triggers, which is exactly the ground where an ORM's DSL reads worse than
-- the SQL it compiles to.
--
-- Time is `timestamptz`; the conversion to the ISO 8601 UTC string of the
-- canonical model happens in the data-access layer, not in the callers.

-- ---------------------------------------------------------------- competitions
create table competitions (
  id          text        primary key,
  name        text        not null check (length(name) > 0),
  season      text        not null check (length(season) > 0),
  -- "group" is a reserved word in SQL; the column keeps the name dominio.md
  -- gives it so that the zod schema and the table agree (CA-14).
  "group"     text        not null check (length("group") > 0),
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------- teams
create table teams (
  id              text        primary key,
  canonical_name  text        not null check (length(canonical_name) > 0),
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------- team_aliases
-- RN-09 at the database level: a LLM proposes, a person confirms, and the
-- database refuses to record a confirmation nobody signed.
create table team_aliases (
  team_id       text        not null references teams (id),
  alias         text        not null check (length(alias) > 0),
  source        text        not null check (length(source) > 0),
  season        text        not null check (length(season) > 0),
  status        text        not null,
  confirmed_by  text,
  confirmed_at  timestamptz,
  created_at    timestamptz not null default now(),

  -- One text from one source in one season points at exactly one team.
  primary key (alias, source, season),

  constraint team_aliases_status_known
    check (status in ('proposed', 'confirmed')),

  -- CA-17.1 — a confirmed alias always carries who confirmed it and when.
  constraint team_aliases_confirmed_needs_person
    check (status <> 'confirmed'
           or (confirmed_by is not null and confirmed_at is not null)),

  -- CA-17.2 — a proposed alias carries no trace of confirmation.
  constraint team_aliases_proposed_has_no_person
    check (status <> 'proposed'
           or (confirmed_by is null and confirmed_at is null)),

  -- The empty string is the shape "nobody confirmed it" takes.
  constraint team_aliases_confirmer_not_empty
    check (confirmed_by is null or length(confirmed_by) > 0)
);

-- --------------------------------------------------------------------- matches
create table matches (
  id              text        primary key,
  competition_id  text        not null references competitions (id),
  round           integer     not null check (round >= 1),
  kickoff         timestamptz not null,
  home_id         text        not null references teams (id),
  away_id         text        not null references teams (id),
  venue           text,
  created_at      timestamptz not null default now(),

  constraint matches_two_different_teams check (home_id <> away_id)
);

-- ---------------------------------------------------------------- observations
-- What a source said at an instant. RN-13: never updated, never deleted.
create table observations (
  id           text             primary key,
  match_id     text             not null references matches (id),
  source       text             not null check (length(source) > 0),
  observed_at  timestamptz      not null,
  status       text             not null,
  home_score   integer,
  away_score   integer,
  confidence   double precision not null check (confidence >= 0 and confidence <= 1),
  -- RN-10 / CA-12: no Observation exists without its raw response. No
  -- exception for the correspondent or for the panel.
  raw_ref      text             not null check (length(raw_ref) > 0),
  created_at   timestamptz      not null default now(),

  constraint observations_status_known
    check (status in ('scheduled', 'live', 'finished', 'postponed', 'suspended')),

  -- A match suspended at minute 60 has a scoreboard; a postponed one does not.
  constraint observations_score_matches_status
    check ((status in ('live', 'finished', 'suspended')
            and home_score is not null and away_score is not null)
           or (status in ('scheduled', 'postponed')
               and home_score is null and away_score is null)),

  constraint observations_scores_non_negative
    check ((home_score is null or home_score >= 0)
           and (away_score is null or away_score >= 0))
);

create index observations_by_match on observations (match_id, observed_at);

-- ------------------------------------------------------------------- decisions
-- What we publish. Append-only log; the highest version per match is live.
create table decisions (
  match_id                    text        not null references matches (id),
  status                      text        not null,
  home_score                  integer,
  away_score                  integer,
  provisional                 boolean     not null,
  -- RN-12 at the database level: no rule, no Decision.
  rule                        text        not null,
  decided_at                  timestamptz not null,
  supporting_observation_ids  text[]      not null,
  version                     integer     not null,
  created_at                  timestamptz not null default now(),

  -- CA-15 — one decision per (match, version).
  primary key (match_id, version),

  constraint decisions_version_positive check (version >= 1),

  constraint decisions_status_known
    check (status in ('scheduled', 'live', 'finished', 'postponed', 'suspended')),

  constraint decisions_rule_shape check (rule ~ '^RN-[0-9]{2}$'),

  constraint decisions_has_support
    check (cardinality(supporting_observation_ids) >= 1)
);

-- RN-12, the half a CHECK cannot express: an array admits no foreign key, so
-- without this trigger the rule is satisfied "for show" — there are ids, but
-- they may be rubbish, or belong to a different match.
create function decisions_supporting_observations_exist()
returns trigger
language plpgsql
as $$
declare
  missing text;
begin
  select s.obs_id
    into missing
    from unnest(new.supporting_observation_ids) as s(obs_id)
   where not exists (
     select 1
       from observations o
      where o.id = s.obs_id
        and o.match_id = new.match_id
   )
   limit 1;

  if missing is not null then
    raise exception
      'supporting observation % does not exist for match %', missing, new.match_id
      using errcode = 'foreign_key_violation';
  end if;

  return new;
end;
$$;

create trigger decisions_supporting_observations_exist
before insert or update on decisions
for each row
execute function decisions_supporting_observations_exist();

-- --------------------------------------------------------------------- RN-13
-- The database engine refuses the amendment. A correction is a new row.
--
-- These are FOR EACH ROW triggers, so TRUNCATE does not fire them — which is
-- deliberate and is what lets the tests clean up between cases. Do not "fix"
-- this by adding a TRUNCATE variant: there is a test that fails if you do.
create function reject_amendment()
returns trigger
language plpgsql
as $$
begin
  raise exception
    'table % is append-only (RN-13): % is not allowed', tg_table_name, tg_op
    using errcode = 'restrict_violation';
end;
$$;

create trigger observations_are_immutable
before update or delete on observations
for each row
execute function reject_amendment();

create trigger decisions_are_immutable
before update or delete on decisions
for each row
execute function reject_amendment();
