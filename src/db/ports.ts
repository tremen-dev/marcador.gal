/**
 * Repository ports for the append-only entities (SPEC-001 CA-6).
 *
 * The surface is the whole point: there is no `update` and no `delete`,
 * because RN-13 says an Observation is a historical fact and a correction is a
 * NEW Observation, not an amendment. `Decision` is the same: dominio.md
 * defines it as an append-only log whose latest row per match is the live one.
 *
 * SPEC-001 defines only the ports. The Postgres implementations belong to the
 * first spec that needs them (F-SPEC-001-3).
 */
import type { Decision, MatchId, Observation, ObservationId } from '../model';

export interface ObservationStore {
  /** Records what a source said. Never overwrites. */
  append(observation: Observation): Promise<Observation>;
  getById(id: ObservationId): Promise<Observation | null>;
  /** Every observation of a match, oldest first. */
  listByMatch(matchId: MatchId): Promise<readonly Observation[]>;
}

export interface DecisionStore {
  /** Appends the next version of what we publish for a match. */
  append(decision: Decision): Promise<Decision>;
  /** The live Decision of a match: the one with the highest `version`. */
  getLatestByMatch(matchId: MatchId): Promise<Decision | null>;
  /** The whole log of a match, oldest version first. */
  listByMatch(matchId: MatchId): Promise<readonly Decision[]>;
}
