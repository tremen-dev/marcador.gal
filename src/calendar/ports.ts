/**
 * The port for READING the declared calendar (SPEC-010 §5, ADR-017 §5).
 *
 * A NEW interface in a new file, not an addition to `src/db/ports.ts`: that
 * file is the contract of SPEC-001, which is done, and a new capability fits
 * in a new interface (ADR-011 §6 applied to a port).
 *
 * Who consumes what: the alias catalogue implements `MatchResolver` (SPEC-008)
 * over `listByTeams`; the cron opens its windows over `listKickoffsBetween`;
 * the engine and the snapshot read a match by `getById`. None of those exist
 * yet; this is the half of the calendar they will need.
 *
 * `listByTeams` RETURNS A LIST AND NOT A MATCH, on purpose: the double-round
 * format is not presumed (ADR-017 §3). In a double-round league it has zero
 * or one element; the day it does not, the port does not lie.
 *
 * Writing goes through `loadSchedule` (`src/db/calendar.ts`) and nowhere
 * else: there is no `insert`, `update` or `delete` here.
 */
import type { CompetitionId, Instant, MatchId, TeamId } from '@/model/ids';
import type { Match } from '@/model/match';

export interface MatchStore {
  getById(id: MatchId): Promise<Match | null>;
  /** The matches of one round of one competition, by kickoff then id. */
  listByRound(competitionId: CompetitionId, round: number): Promise<readonly Match[]>;
  /** The matches of one competition with this ORDERED pair, by kickoff then id. */
  listByTeams(
    competitionId: CompetitionId,
    homeId: TeamId,
    awayId: TeamId,
  ): Promise<readonly Match[]>;
  /** Of ALL competitions: `from <= kickoff < to`, by kickoff then id. */
  listKickoffsBetween(from: Instant, to: Instant): Promise<readonly Match[]>;
}
