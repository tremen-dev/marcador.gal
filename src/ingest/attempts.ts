/**
 * The record of one ingest attempt, and the port it is written through
 * (SPEC-012 CA-5, ADR-019 §5).
 *
 * DEFINED HERE AND IMPLEMENTED IN `src/db/ingest-attempts.ts`, like the ports
 * of SPEC-010 and SPEC-011: a new capability fits in a new interface
 * (ADR-011 §6 applied to a port). ONE operation, `append`, because an attempt
 * is a historical fact (RN-13 by analogy): there is deliberately no `update`,
 * no `delete`, and no read here — the specs that compute the epic's figures
 * will bring their own reading port when they exist.
 *
 * WHAT DOES NOT PRODUCE AN ATTEMPT is as fixed as what does (ADR-019 §5): a
 * tick with no eligible pairs, and a turn suppressed by RN-11's minute. A
 * suppressed tick is not a failed tick.
 */
import type { CompetitionId, Instant, SourceId } from '@/model/ids';

export type AttemptOutcome = 'ok' | 'skipped' | 'failed';

export interface IngestAttempt {
  readonly source: SourceId;
  readonly competition_id: CompetitionId;
  /** The tick's instant, ISO 8601 UTC as a string (ADR-006). */
  readonly attempted_at: Instant;
  readonly outcome: AttemptOutcome;
  /** Why. `null` on `ok`, never `null` otherwise — the base enforces it. */
  readonly reason: string | null;
  /** The archived page of THIS attempt, when one was archived. */
  readonly raw_ref: string | null;
  /** How many `Observation` this attempt persisted. */
  readonly observations_count: number;
  /**
   * The names of the rows the resolver could not resolve, WHOLE (RN-09):
   * home and away of each unresolved row, in page order. They are the work
   * queue of the alias catalogue.
   */
  readonly unresolved_names: readonly string[];
}

export interface IngestAttemptLog {
  /** Records one attempt. Never overwrites. */
  append(attempt: IngestAttempt): Promise<void>;
}
