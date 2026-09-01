/**
 * The third duty of RN-11: at most one request per minute per competition.
 *
 * The limiter lives HERE, inside the courtesy module, and never in the caller.
 * A Vercel Cron firing every minute, a supervised local loop and a test
 * driving a fake clock have to be equally unable to exceed it (ADR-014 §1,
 * SPEC-008 CA-7). It was extracted from the `Capturer` of EPIC-001, where it
 * was the only copy and therefore the only one that could be right.
 *
 * INSIDE A PROCESS THAT IS NOT ENOUGH (CA-14). ADR-004 says that on Vercel
 * there is no live process: every tick of the cron is a NEW INSTANCE, so a
 * limiter that is an instance field is born empty on every cold start and ten
 * ticks in the same minute send ten requests. That was measured, not supposed
 * (F-SPEC-008-V13). So the last instant per pair is DURABLE STATE, and the
 * port below has exactly ONE operation.
 *
 * WHY ONE OPERATION AND NOT TWO. Asking and then stamping leaves a gap, and
 * another instance fits in it. `takeTurn` grants and stamps at the same time,
 * which is the property `insert … on conflict … where … returning …` gives and
 * a pair of calls cannot.
 *
 * The instant is stamped BEFORE the request leaves, not after it returns: RN-11
 * is about the rate at which requests LEAVE, so a slow response must not buy
 * the next tick an early turn. And what is stamped is the CURRENT instant, not
 * the previous one plus a minute, so UNSPENT TURNS DO NOT PILE UP — which is
 * the second sentence of what `/robot` publishes in Galician and in Spanish.
 */

/**
 * RN-11, read as one request per minute per (source, competition) pair. This
 * reading is load-bearing, not a detail (SPEC-002 §Diseño 3).
 *
 * THE NUMBER LIVES HERE AND NOWHERE ELSE (CA-14.6). The durable implementation
 * is handed the limit instant already computed and writes no interval into its
 * SQL, so moving this constant moves both implementations at once.
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
 * The instant the last request of a key must lie at or before for its turn to
 * be due. The arithmetic of the rhythm, written once (CA-14.6).
 */
export function turnLimitMs(epochMs: number, intervalMs: number): number {
  return epochMs - intervalMs;
}

/**
 * The port of the rhythm. ONE operation, and that is the whole design.
 *
 * `takeTurn` grants the turn AND stamps it, atomically. There is deliberately
 * no way to ask without spending: between asking and stamping fits another
 * instance of this program, which is exactly the failure CA-14 exists to close.
 */
export interface RateLimit {
  /**
   * Whether `key` may send at `epochMs`, stamping the instant if it may.
   * `false` means the minute has not elapsed; nothing changed.
   */
  takeTurn(key: string, epochMs: number): Promise<boolean>;
}

/**
 * The rhythm in memory: last instant at which a request LEFT, per key.
 *
 * It survives a loop, not a process. That is enough for `src/mirror/`, which
 * runs for one hour in ONE process with the operator watching (F-SPEC-002-2,
 * ADR-014 §3, CA-14.8), and it is NOT enough for anything deployed — which is
 * why `SourceAdapter` demands the port and never builds one of these.
 *
 * A suppressed turn is NOT a failed one: it produces no request and no record,
 * because counting it would turn the rhythm of RN-11 into lost coverage.
 */
export class MemoryRateLimit implements RateLimit {
  readonly #lastRequestAt = new Map<string, number>();
  readonly #intervalMs: number;

  constructor(intervalMs: number = MIN_REQUEST_INTERVAL_MS) {
    this.#intervalMs = intervalMs;
  }

  takeTurn(key: string, epochMs: number): Promise<boolean> {
    const last = this.#lastRequestAt.get(key);
    if (last !== undefined && last > turnLimitMs(epochMs, this.#intervalMs)) {
      return Promise.resolve(false);
    }
    this.#lastRequestAt.set(key, epochMs);
    return Promise.resolve(true);
  }
}
