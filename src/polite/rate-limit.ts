/**
 * The third duty of RN-11: at most one request per minute per competition.
 *
 * The limiter lives HERE, inside the courtesy module, and never in the caller.
 * A Vercel Cron firing every minute, a supervised local loop and a test
 * driving a fake clock have to be equally unable to exceed it (ADR-014 §1,
 * SPEC-008 CA-7). It was extracted from the `Capturer` of EPIC-001, where it
 * was the only copy and therefore the only one that could be right.
 *
 * The instant is stamped BEFORE the request leaves, not after it returns: RN-11
 * is about the rate at which requests LEAVE, so a slow response must not buy
 * the next tick an early turn.
 */

/**
 * RN-11, read as one request per minute per (source, competition) pair. This
 * reading is load-bearing, not a detail (SPEC-002 §Diseño 3).
 */
export const MIN_REQUEST_INTERVAL_MS = 60_000;

/** The key of a pair, used wherever the rhythm of RN-11 is counted. */
export function pairKey(source: string, competitionId: string): string {
  return `${source}/${competitionId}`;
}

/**
 * Why a turn was suppressed, in the words of the rule.
 *
 * It lives beside the limiter and not at the call site for the same reason
 * `robotsSkipReason` lives beside the policy: the archive is the only artefact
 * of the spike that outlives it, and a skip whose reason nobody can read is a
 * hole in it.
 */
export function rateLimitSkipReason(key: string, intervalMs = MIN_REQUEST_INTERVAL_MS): string {
  return `${key}: asked less than ${intervalMs} ms ago; at most 1 request/minute per competition (RN-11)`;
}

/**
 * Last instant at which a request LEFT, per key. Epoch milliseconds.
 *
 * A suppressed turn is NOT a failed one: it produces no request and no record,
 * because counting it would turn the rhythm of RN-11 into lost coverage.
 */
export class RateLimiter {
  readonly #lastRequestAt = new Map<string, number>();
  readonly #intervalMs: number;

  constructor(intervalMs: number = MIN_REQUEST_INTERVAL_MS) {
    this.#intervalMs = intervalMs;
  }

  /** Whether the key may send now. Never mutates. */
  isDue(key: string, epochMs: number): boolean {
    const last = this.#lastRequestAt.get(key);
    return last === undefined || epochMs - last >= this.#intervalMs;
  }

  /** Records that a request left for `key`. Call it BEFORE the `await`. */
  stamp(key: string, epochMs: number): void {
    this.#lastRequestAt.set(key, epochMs);
  }
}
