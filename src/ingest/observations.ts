/**
 * From archived bytes to `Observation` (CA-9, CA-10, CA-13).
 *
 * It touches neither the network nor the clock. That is the seam RN-10 pays
 * for: reprocessing a whole matchday with a corrected parser is running this
 * over the archive, and the replay tests of the engine have somewhere to come
 * from (SPEC-008 §5).
 *
 * THE `id` IS DERIVED, NOT DRAWN. It is a digest of the archive reference and
 * the identity of the row, so the same bytes and the same resolver produce the
 * same `Observation` down to the `id`. A random `id` would turn every replay
 * into new data and RN-13 — Observations are immutable — into a promise with
 * no edge.
 */
import { createHash } from 'node:crypto';
import { ObservationIdSchema } from '@/model/ids';
import { ObservationSchema } from '@/model/observation';
import { hasScoreboard } from './ports';
import type { MatchResolver, ReadResult, SourceRow } from './ports';
import type { CompetitionId, Instant, ObservationId, SourceId } from '@/model/ids';
import type { Observation } from '@/model/observation';
import type { RawRef } from '@/raw/key';

export interface ReadRowsInput {
  readonly rows: readonly SourceRow[];
  readonly source: SourceId;
  readonly competitionId: CompetitionId;
  /** RN-01's weight for this source, read from the registry. Never inlined. */
  readonly confidence: number;
  readonly observedAt: Instant;
  readonly rawRef: RawRef;
  readonly resolver: MatchResolver;
}

/** The `ObservationId` of a row of one archived response. */
export function observationId(rawRef: string, sourceRef: string): ObservationId {
  const digest = createHash('sha256').update(`${rawRef}\n${sourceRef}`).digest('hex').slice(0, 32);
  return ObservationIdSchema.parse(digest);
}

/**
 * Turns the rows of one archived body into `Observation`.
 *
 * A row the resolver cannot resolve produces NO `Observation` and comes back
 * whole in `unresolved` (RN-09, CA-13). There is no branch that fabricates a
 * `MatchId`, matches one by similarity, or takes one from the source's text.
 */
export async function readRows(input: ReadRowsInput): Promise<ReadResult> {
  const observations: Observation[] = [];
  const unresolved: SourceRow[] = [];

  for (const row of input.rows) {
    const matchId = await input.resolver.resolve(row, input.competitionId);
    if (matchId === null) {
      unresolved.push(row);
      continue;
    }

    const base = {
      id: observationId(input.rawRef, row.source_ref),
      match_id: matchId,
      source: input.source,
      observed_at: input.observedAt,
      confidence: input.confidence,
      raw_ref: input.rawRef,
    };

    // `parse` and not a cast: the schema is the contract (ADR-001), and it
    // ends in `.readonly()`, so what comes out is frozen (RN-13, CA-9.5).
    observations.push(
      ObservationSchema.parse(
        hasScoreboard(row.status)
          ? {
              ...base,
              status: row.status,
              home_score: row.home_score,
              away_score: row.away_score,
            }
          : { ...base, status: row.status, home_score: null, away_score: null },
      ),
    );
  }

  return { observations, unresolved };
}
