/**
 * The ports of the snapshot (SPEC-018 §1, CA-4.1).
 *
 * NEW INTERFACES IN A NEW FILE, like the ports of SPEC-010, SPEC-011,
 * SPEC-013, SPEC-015 and SPEC-017: a new capability fits in a new interface,
 * and `src/db/ports.ts` is the contract of a spec that is done.
 *
 * EVERY METHOD HERE IS A READ, and that is a criterion and not a habit
 * (CA-4.1): there is no `append`, no `put`, no `update` and no `delete` in
 * this file, and a case asserts that the two directories of this spec contain
 * no `sql` template with `insert`, `update` or `delete`. The snapshot does not
 * write a `Decision`, an `Observation`, an `alert_ack`, an `operator_action`
 * or a visits table — THERE IS NO VISITS TABLE (ADR-027 §4.5).
 *
 * NO MEMBER OF `BoardPorts` IS A DECISION STORE. The batch read enters as a
 * FUNCTION — the door of `src/decide/board-entry.ts`, imported by name and
 * bound in the composition — so what this module holds is the ability to ASK,
 * never the capability RN-08 denies it. `DECISION_WRITERS` does not grow.
 *
 * AND NOTHING HERE REACHES A THIRD PARTY. There is no fetcher, no
 * `politeFetch`, no raw store: the graph of the three routes of this spec does
 * NOT reach `src/polite/http.ts` (CA-1.4), which is why RN-11 does not reach
 * this spec at all. The screen reads THE SNAPSHOT ALREADY PERSISTED; whoever
 * asks a third party is still the cron, at 1/minute per competition.
 */
import type { MatchStore } from '@/calendar/ports';
import type { MeasurementWindow } from '@/ingest/windows';
import type { CompetitionId, Instant, MatchId, TeamId } from '@/model/ids';
import type { Decision } from '@/model/decision';
import type { Observation } from '@/model/observation';
import type { Clock } from '@/polite/clock';

/** The canonical RFGF names of the teams, read from the declared calendar. */
export interface TeamNameReader {
  namesOf(ids: readonly TeamId[]): Promise<ReadonlyMap<TeamId, string>>;
}

/** The canonical RFGF names of the competitions, from the same place. */
export interface CompetitionNameReader {
  namesOf(ids: readonly CompetitionId[]): Promise<ReadonlyMap<CompetitionId, string>>;
}

/**
 * What one match looks like to the board, AS PLAIN VALUES: the live
 * `Decision`, the observations that sustain it, and nothing else. No store, no
 * port, no connection.
 */
export interface BoardMatchRead {
  readonly match_id: MatchId;
  /** The live `Decision`: the highest `version`. `null` when there is none. */
  readonly live: Decision | null;
  /** The observations `live.supporting_observation_ids` names, in log order. */
  readonly supporting: readonly Observation[];
}

/**
 * THE BATCH READ, injected as a function (CA-6).
 *
 * The number of queries it costs is CONSTANT IN THE NUMBER OF MATCHES, and
 * that is the whole reason `src/decide/board-entry.ts` exists: the panel makes
 * two queries per match and for it that is fine — one person looks at it and it
 * does not refresh itself — but a public screen that reloads every half minute
 * in `N` browsers cannot pay `2 × matches` queries per turn.
 */
export type BoardReader = (matchIds: readonly MatchId[]) => Promise<readonly BoardMatchRead[]>;

/** Everything one request of the snapshot drives. All of it read-only. */
export interface BoardPorts {
  readonly matches: MatchStore;
  readonly teams: TeamNameReader;
  readonly competitions: CompetitionNameReader;
  /** The declared matchdays (ADR-019 §3). BORN EMPTY: the screen is born off. */
  readonly windows: readonly MeasurementWindow[];
  /** The batch read of the two logs. Values, never a store. */
  readonly readBoard: BoardReader;
  /**
   * The wall clock. IT IS NOT THE PROJECTION'S — `src/api/snapshot.ts` is pure
   * and reads no clock (CA-4.5) — it is the handler's, and it is used for ONE
   * thing: the age in minutes the row and the page show (ADR-027 §4).
   */
  readonly clock: Clock;
}

export type { Instant };
