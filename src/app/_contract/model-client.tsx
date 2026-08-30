'use client';

/**
 * CA-2 — proof that the canonical model crosses the server/client boundary.
 *
 * ADR-001 chose Node so that ingestion and the frontend share ONE type. This
 * file is that claim made checkable: a client component that imports the six
 * entity types with `import type` and builds a value of each. If a schema
 * grows something a client component cannot hold, `npm run typecheck` fails
 * here and the ADR's premise is shown to be broken.
 *
 * It is not a route: `_contract` is a private folder and Next.js ignores it.
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

const competitionId = 'futgal-preferente-g1' as CompetitionId;
const homeId = 'rc-celta-b' as TeamId;
const awayId = 'ud-ourense' as TeamId;
const matchId = 'futgal-preferente-g1-2026-27-j23' as MatchId;
const observationId = 'obs-0001' as ObservationId;
const source = 'futgal' as SourceId;
const rawRef =
  'futgal/futgal-preferente-g1/2026-03-21/2026-03-21t17-00-00.000z-a1b2c3d4e5f6.html' as RawRef;

const competition: Competition = {
  id: competitionId,
  name: 'Preferente Futgal',
  season: '2026/27',
  group: '1',
};

const alias: TeamAlias = {
  team_id: awayId,
  alias: 'UD Ourense',
  source,
  season: '2026/27',
  status: 'confirmed',
  confirmed_by: 'alberto',
  confirmed_at: '2026-03-01T09:00:00.000Z',
};

const team: Team = {
  id: awayId,
  canonical_name: 'UD Ourense',
  aliases: [alias],
};

const match: Match = {
  id: matchId,
  competition_id: competitionId,
  round: 23,
  kickoff: '2026-03-21T17:00:00.000Z',
  home_id: homeId,
  away_id: awayId,
  venue: 'Barreiro',
};

const observation: Observation = {
  id: observationId,
  match_id: matchId,
  source,
  observed_at: '2026-03-21T17:35:00.000Z',
  status: 'live',
  home_score: 1,
  away_score: 0,
  confidence: 1,
  raw_ref: rawRef,
};

const decision: Decision = {
  match_id: matchId,
  status: 'live',
  home_score: 1,
  away_score: 0,
  provisional: false,
  rule: 'RN-02',
  decided_at: '2026-03-21T17:35:01.000Z',
  supporting_observation_ids: [observationId],
  version: 1,
};

export default function ModelClientContract() {
  return (
    <ul>
      <li>{competition.name}</li>
      <li>{team.canonical_name}</li>
      <li>{alias.alias}</li>
      <li>{match.round}</li>
      <li>{observation.home_score}</li>
      <li>{decision.version}</li>
    </ul>
  );
}
