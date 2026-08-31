/**
 * CA-6 (RN-09) — the crossing of identities is declared by hand.
 *
 * Eight to sixteen matches, written by a person before the window. That is
 * cheap, and the alternative is not "a bit less precise": a guessed pairing
 * contaminates the verdict in the dangerous direction, because two matches
 * wrongly joined look like disagreement and disagreement is what reads as
 * independence.
 *
 * This is measurement, not publication: it neither needs nor replaces the full
 * alias catalogue that RN-09 requires before anything is published.
 */
import { z } from 'zod';
import { MatchIdSchema } from '@/model/ids';
import type { MatchId, SourceId } from '@/model/ids';
import type { ExtractedMatch } from './extract';

export const PairingSchema = z.strictObject({
  /** Human label of the window this file was written for. */
  window: z.string().min(1),
  matches: z
    .array(
      z.strictObject({
        match_id: MatchIdSchema,
        /** Source id → the identity that source uses for this match. */
        refs: z.record(z.string().min(1), z.string().min(1)),
      }),
    )
    .min(1),
});

export type Pairing = z.infer<typeof PairingSchema>;

/** Thrown when the archive holds a match the pairing file does not map. */
export class UnmappedMatchError extends Error {
  override readonly name = 'UnmappedMatchError';
  readonly source: SourceId;
  readonly source_ref: string;

  constructor(source: SourceId, match: ExtractedMatch) {
    super(
      `CA-6: ${source} reports a match the pairing file does not map: ` +
        `${match.home_name} - ${match.away_name} (${source} ref ${JSON.stringify(match.source_ref)}). ` +
        'Add it to the pairing file; it will not be matched by name similarity.',
    );
    this.source = source;
    this.source_ref = match.source_ref;
  }
}

/** Thrown when the pairing file gives one source identity two canonical ids. */
export class AmbiguousPairingError extends Error {
  override readonly name = 'AmbiguousPairingError';

  constructor(source: string, ref: string, first: MatchId, second: MatchId) {
    super(
      `CA-6: ${source} ref ${JSON.stringify(ref)} is claimed by two matches (${first}, ${second})`,
    );
  }
}

export interface PairingIndex {
  /** The canonical id, or `UnmappedMatchError`. Never a best guess. */
  resolve(source: SourceId, match: ExtractedMatch): MatchId;
  /** Whether the file maps this identity at all. */
  has(source: SourceId, sourceRef: string): boolean;
  /** The canonical ids of the window, in file order. */
  matchIds(): readonly MatchId[];
}

export function buildPairingIndex(pairing: Pairing): PairingIndex {
  const byIdentity = new Map<string, MatchId>();
  const ids: MatchId[] = [];

  for (const entry of pairing.matches) {
    ids.push(entry.match_id);
    for (const [source, ref] of Object.entries(entry.refs)) {
      const key = identity(source, ref);
      const existing = byIdentity.get(key);
      if (existing !== undefined && existing !== entry.match_id) {
        throw new AmbiguousPairingError(source, ref, existing, entry.match_id);
      }
      byIdentity.set(key, entry.match_id);
    }
  }

  return {
    resolve(source: SourceId, match: ExtractedMatch): MatchId {
      const found = byIdentity.get(identity(source, match.source_ref));
      if (found === undefined) throw new UnmappedMatchError(source, match);
      return found;
    },
    has: (source: SourceId, sourceRef: string): boolean =>
      byIdentity.has(identity(source, sourceRef)),
    matchIds: (): readonly MatchId[] => [...ids],
  };
}

/** `\u0000` cannot appear in either half, so the join is unambiguous. */
function identity(source: string, ref: string): string {
  return `${source}\u0000${ref}`;
}
