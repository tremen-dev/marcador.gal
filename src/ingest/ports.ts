/**
 * The ports of an adapter (SPEC-008 §1).
 *
 * A source adapter does four things and no more: it asks, it archives before
 * looking (RN-10), it reads the rows in the form the source writes them, and
 * it builds `Observation` of the canonical model. It does not decide (RN-08),
 * does not persist, does not resolve aliases (RN-09), does not publish, and
 * does not know what time it is beyond the clock it is handed.
 *
 * Two of these ports are DEFINED HERE AND NOT IMPLEMENTED: `MatchResolver` —
 * whose real implementation is the alias catalogue and the calendar of later
 * specs — and `RowExtractor`, which every source in the registry supplies.
 */
import type { CompetitionId, MatchId, SourceId } from '@/model/ids';
import type { Observation } from '@/model/observation';

/**
 * The five states, taken from the canonical model rather than retyped. If
 * `Observation` ever grows a sixth, this alias moves with it instead of
 * silently going stale.
 */
export type MatchStatus = Observation['status'];

/** States whose ball has been kicked, and therefore carry a scoreboard. */
export function hasScoreboard(status: MatchStatus): boolean {
  return status === 'live' || status === 'finished' || status === 'suspended';
}

/**
 * One row of a source's page, IN THE FORM THE SOURCE WRITES IT.
 *
 * The adapter does not translate, does not guess and does not normalise to the
 * canonical RFGF name (D-2, `dominio.md`): it hands the text over as it found
 * it and lets `MatchResolver` decide. That is RN-09 in its strong reading —
 * nothing is published about a team whose alias a person has not confirmed.
 */
export interface SourceRow {
  /** The identity of the match as the source writes it. Never guessed. */
  readonly source_ref: string;
  readonly home_name: string;
  readonly away_name: string;
  readonly status: MatchStatus;
  readonly home_score: number | null;
  readonly away_score: number | null;
  /** Kickoff as the page shows it, normalised to `HH:MM`, or `null`. */
  readonly kickoff: string | null;
}

/**
 * Reads the archived bytes of one competition page into rows.
 *
 * It touches neither the network nor the clock: that seam is what makes a
 * whole matchday replayable from the archive with a corrected parser (RN-10,
 * SPEC-008 §5).
 */
export type RowExtractor = (body: Uint8Array) => readonly SourceRow[];

/**
 * Thrown when a row cannot be read whole. Half a match is worse than none, so
 * the extraction ABORTS and names the row instead of emitting a row with an
 * invented value in it (CA-8).
 */
export class UnreadableRowError extends Error {
  override readonly name = 'UnreadableRowError';
  readonly source: SourceId;

  constructor(source: SourceId, reason: string, row: string) {
    super(`${source}: ${reason} in row ${JSON.stringify(row.slice(0, 240))}`);
    this.source = source;
  }
}

/**
 * Resolves the identity of a row to a `MatchId`, or to `null` (RN-09).
 *
 * DEFINED HERE AND NOT IMPLEMENTED. The real one is the alias catalogue with
 * its human confirmation plus the loaded calendar; here it is satisfied by a
 * double in the tests. There is deliberately no branch that fabricates a
 * `MatchId`, normalises one by similarity, or takes one from the source's own
 * text: if it does not resolve, there is no `Observation` and the row is
 * handed back whole for a person to look at.
 */
export interface MatchResolver {
  resolve(row: SourceRow, competitionId: CompetitionId): Promise<MatchId | null>;
}

/** What reading one archived body produced. */
export interface ReadResult {
  readonly observations: readonly Observation[];
  /** The rows the resolver could not resolve, whole and untouched (CA-13). */
  readonly unresolved: readonly SourceRow[];
}
