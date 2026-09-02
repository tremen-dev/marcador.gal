/**
 * The identity of a match, DERIVED from what does not change (SPEC-010 CA-3,
 * ADR-017 §3).
 *
 *   MatchId = <competition_id>-<season>-j<round>-<home_id>-<away_id>
 *
 * with the season written `2026-27` (the slash of `2026/27` has no place in
 * an identifier) and the team ids as the declared calendar writes them, in
 * kebab-case. Deterministic, stable across changes of hour: `kickoff` and
 * `venue` are mutable, this is not. It is what lets an `Observation` written
 * against a match survive the reload that moved the kickoff (RN-13).
 */
import type { CompetitionId, MatchId, TeamId } from '@/model/ids';

/** `2026/27` → `2026-27`. */
export function seasonSlug(season: string): string {
  return season.replaceAll('/', '-');
}

export function matchId(
  competitionId: CompetitionId,
  season: string,
  round: number,
  homeId: TeamId,
  awayId: TeamId,
): MatchId {
  return `${competitionId}-${seasonSlug(season)}-j${round}-${homeId}-${awayId}` as MatchId;
}
