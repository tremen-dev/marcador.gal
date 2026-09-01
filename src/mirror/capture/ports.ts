/**
 * The ports of phase A.
 *
 * Phase A talks to the outside world through exactly two of them — a clock and
 * an HTTP fetcher — plus the `RawStore` of SPEC-001, which it reuses as is.
 * That is what lets an hour of RN-11 be tested in milliseconds and what keeps
 * the capturer usable both from a Vercel Cron tick and from a supervised local
 * process (spec, *Fuera de alcance*: the host is not constrained).
 *
 * The clock and the fetcher THEMSELVES now live in `src/polite/` (ADR-014 §1):
 * they are the courtesy of RN-11, which has one owner and is not the property
 * of the measuring instrument. What stays here is what belongs to the window:
 * the shape of a target and the key of a pair.
 */
import { pairKey as politePairKey } from '@/polite/rate-limit';
import type { CompetitionId, SourceId } from '@/model/ids';

/** One (source, competition) pair of the window, and where to read it. */
export interface CaptureTarget {
  readonly source: SourceId;
  readonly competition_id: CompetitionId;
  readonly url: string;
  /** Extension of the body, for the raw key: `html`, `json`… */
  readonly ext: string;
}

/** The key of a pair, used wherever the rhythm of RN-11 is counted. */
export function pairKey(target: {
  readonly source: SourceId;
  readonly competition_id: CompetitionId;
}): string {
  return politePairKey(target.source, target.competition_id);
}
