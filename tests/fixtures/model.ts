/**
 * Canonical fixtures for the SPEC-001 model. One valid value per entity.
 *
 * These are deliberately typed as the inferred entity types: if a schema
 * changes shape, this file stops compiling and `npm run typecheck` fails
 * before any test runs.
 */
import type {
  Competition,
  CompetitionId,
  Decision,
  Match,
  MatchId,
  Observation,
  ObservationId,
  RawRef,
  SourceId,
  Team,
  TeamAlias,
  TeamId,
} from '@/model';

export const COMPETITION_ID = 'futgal-preferente-g1' as CompetitionId;
export const HOME_TEAM_ID = 'rc-celta-b' as TeamId;
export const AWAY_TEAM_ID = 'ud-ourense' as TeamId;
export const MATCH_ID = 'futgal-preferente-g1-2026-27-j23-celtab-ourense' as MatchId;
export const OBSERVATION_ID = 'obs-0001' as ObservationId;
export const OTHER_OBSERVATION_ID = 'obs-0002' as ObservationId;
export const SOURCE_FUTGAL = 'futgal' as SourceId;
export const SOURCE_CEROACERO = 'ceroacero' as SourceId;
export const SEASON = '2026/27';

/** A raw_ref with the exact shape produced by `rawKey` (CA-10, CA-12). */
export const RAW_REF =
  'futgal/futgal-preferente-g1/2026-03-21/2026-03-21t17-00-00.000z-a1b2c3d4e5f6.html' as RawRef;

export const competitionFixture: Competition = {
  id: COMPETITION_ID,
  name: 'Preferente Futgal',
  season: SEASON,
  group: '1',
};

export const teamAliasFixture: TeamAlias = {
  team_id: AWAY_TEAM_ID,
  alias: 'UD Ourense',
  source: SOURCE_FUTGAL,
  season: SEASON,
  status: 'confirmed',
  confirmed_by: 'alberto',
  confirmed_at: '2026-03-01T09:00:00.000Z',
};

export const teamFixture: Team = {
  id: AWAY_TEAM_ID,
  canonical_name: 'UD Ourense',
  aliases: [teamAliasFixture],
};

export const matchFixture: Match = {
  id: MATCH_ID,
  competition_id: COMPETITION_ID,
  round: 23,
  kickoff: '2026-03-21T17:00:00.000Z',
  home_id: HOME_TEAM_ID,
  away_id: AWAY_TEAM_ID,
  venue: 'Barreiro',
};

export const observationFixture: Observation = {
  id: OBSERVATION_ID,
  match_id: MATCH_ID,
  source: SOURCE_FUTGAL,
  observed_at: '2026-03-21T17:35:00.000Z',
  status: 'live',
  home_score: 1,
  away_score: 0,
  confidence: 1,
  raw_ref: RAW_REF,
};

export const decisionFixture: Decision = {
  match_id: MATCH_ID,
  status: 'live',
  home_score: 1,
  away_score: 0,
  provisional: false,
  rule: 'RN-02',
  decided_at: '2026-03-21T17:35:01.000Z',
  supporting_observation_ids: [OBSERVATION_ID, OTHER_OBSERVATION_ID],
  version: 1,
};
