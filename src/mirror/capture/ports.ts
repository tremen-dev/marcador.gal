/**
 * The ports of phase A.
 *
 * Phase A talks to the outside world through exactly two of them — a clock and
 * an HTTP fetcher — plus the `RawStore` of SPEC-001, which it reuses as is.
 * That is what lets an hour of RN-11 be tested in milliseconds and what keeps
 * the capturer usable both from a Vercel Cron tick and from a supervised local
 * process (spec, *Fuera de alcance*: the host is not constrained).
 */
import type { CompetitionId, Instant, SourceId } from '@/model/ids';

export interface Clock {
  /** The current instant, ISO 8601 UTC as a string (ADR-006). */
  now(): Instant;
}

/** The system clock. The only place the wall clock is read. */
export const systemClock: Clock = {
  now: (): Instant => new Date().toISOString() as Instant,
};

export interface HttpRequest {
  readonly url: string;
  readonly headers: Readonly<Record<string, string>>;
}

export interface HttpResponse {
  readonly status: number;
  readonly body: Uint8Array;
  /**
   * The `Location` header, when the site answered a 3xx (SPEC-003 CA-10).
   *
   * It is here and not thrown away because a redirect is a FACT the operator
   * has to see: the reason of the failed tick names it, so the archive says
   * where the source moved to instead of quietly downloading from there.
   */
  readonly location?: string | null;
}

export interface HttpFetcher {
  fetch(request: HttpRequest): Promise<HttpResponse>;
}

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
  return `${target.source}/${target.competition_id}`;
}
