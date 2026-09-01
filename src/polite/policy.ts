/**
 * Getting, archiving and expiring the `robots.txt` of an origin (ADR-014 §3).
 *
 * `src/mirror/` loads its policies from disk before the window, and it is
 * right to: the window lasts an hour and the operator is watching
 * (F-SPEC-002-2). IN PRODUCTION THERE IS NEITHER OF THOSE THINGS — no disk
 * (ADR-004, ADR-005) and no moment called "before", because the cron is a
 * one-minute tick with nobody looking. So, for everything outside the
 * instrument:
 *
 *   1. The `robots.txt` is asked for like any other raw response, through the
 *      same door of `http.ts`, and ARCHIVED BEFORE IT IS PARSED. RN-10 has no
 *      exception by kind of response, and the reason a tick skipped a source
 *      becomes auditable FROM THE ARCHIVE ALONE, without faith in a log.
 *   2. At most once every six hours per origin. The same refresh the epic
 *      fixes for the calendar. It costs one request per origin per half day,
 *      does not compete with the one-per-minute budget of RN-11, and is
 *      counted apart. THE SIX HOURS ARE A CHOSEN NUMBER, NOT A MEASURED ONE.
 *   3. IT FAILS CLOSED. With no policy in force for an origin — never
 *      obtained, expired, or the request failed — no request leaves towards
 *      that origin and the tick records why. It is the rule `robotsRegistry`
 *      already applies to an unknown origin — silence is not consent —
 *      extended to time: a policy from a month ago is silence with an old
 *      date.
 *   4. It is archived under the key that already exists, with no migration and
 *      no new format. That the second segment of the key is called
 *      `competition_id` and carries `robots` here is a CONSCIOUS, NAMED
 *      LICENCE (ADR-014 §3.4), not an oversight: the key reads well, the
 *      pattern of `src/raw/key.ts` is untouched, and no source ends up
 *      mislabelled, which is the damage ADR-008 §2 exists to prevent.
 */
import { captureThenParse } from '@/raw/capture';
import { epochMsOf } from './clock';
import { politeFetch } from './http';
import { parseRobots, robotsSkipReason } from './robots';
import type { HttpFetcher } from './http';
import type { RobotsPolicy } from './robots';
import type { RawRef, RawStore } from '@/raw/store';

/** ADR-014 §3.2. Six hours, the same refresh the epic fixes for the calendar. */
export const ROBOTS_MAX_AGE_MS = 6 * 60 * 60 * 1000;

/** ADR-014 §3.4. The named licence in the second segment of the raw key. */
export const ROBOTS_COMPETITION_ID = 'robots';

export interface RobotsGateOptions {
  readonly fetcher: HttpFetcher;
  readonly store: RawStore;
  readonly userAgent: string;
  /** Overridable only so a test can drive the expiry; defaults to six hours. */
  readonly maxAgeMs?: number;
}

/** What the gate decided, and why, so the tick can record it. */
export interface GateDecision {
  readonly allowed: boolean;
  /** The sentence the archive keeps when nothing was requested. */
  readonly reason: string | null;
  /** The key of the `robots.txt` archived on THIS call, if one was fetched. */
  readonly policyRawRef: RawRef | null;
}

/**
 * The port an adapter asks for permission through.
 *
 * Named so a caller can be handed a double: what a test needs to prove is
 * often not what the gate answers but WHETHER IT WAS ASKED — a request that
 * leaves without consulting a policy is the failure RN-11 is about.
 */
export interface PolicyGate {
  allows(url: string, source: string, at: string): Promise<GateDecision>;
}

interface Cached {
  readonly policy: RobotsPolicy | null;
  readonly attemptedAtMs: number;
}

export class RobotsGate implements PolicyGate {
  readonly #fetcher: HttpFetcher;
  readonly #store: RawStore;
  readonly #userAgent: string;
  readonly #maxAgeMs: number;
  readonly #byOrigin = new Map<string, Cached>();

  constructor(options: RobotsGateOptions) {
    this.#fetcher = options.fetcher;
    this.#store = options.store;
    this.#userAgent = options.userAgent;
    this.#maxAgeMs = options.maxAgeMs ?? ROBOTS_MAX_AGE_MS;
  }

  /**
   * Whether `url` may be requested, refreshing the origin's policy first if it
   * is missing or older than the maximum age.
   *
   * `source` only names the folder the `robots.txt` is archived under, so the
   * archive says who was asking.
   */
  async allows(url: string, source: string, at: string): Promise<GateDecision> {
    const origin = new URL(url).origin;
    const nowMs = epochMsOf(at);
    let policyRawRef: RawRef | null = null;

    const cached = this.#byOrigin.get(origin);
    if (cached === undefined || nowMs - cached.attemptedAtMs >= this.#maxAgeMs) {
      policyRawRef = await this.#refresh(origin, source, at, nowMs);
    }

    const policy = this.#byOrigin.get(origin)?.policy ?? null;
    if (policy === null) {
      return {
        allowed: false,
        reason: `no robots.txt policy in force for ${origin}: nothing is requested (RN-11)`,
        policyRawRef,
      };
    }

    if (!policy.isAllowed(url)) {
      return { allowed: false, reason: robotsSkipReason(url), policyRawRef };
    }

    return { allowed: true, reason: null, policyRawRef };
  }

  /**
   * One attempt at the origin's `robots.txt`. The attempt is stamped whether
   * it worked or not: retrying every tick would be a request per origin and
   * minute that RN-11 does not budget, and asking too much is discourtesy too.
   */
  async #refresh(
    origin: string,
    source: string,
    at: string,
    nowMs: number,
  ): Promise<RawRef | null> {
    this.#byOrigin.set(origin, { policy: null, attemptedAtMs: nowMs });

    const response = await this.#fetchPolicy(`${origin}/robots.txt`);
    if (response === null) return null;

    // RN-10 written as structure and not as discipline: the parse happens
    // INSIDE the callback, so it cannot start before the bytes are archived.
    const archived = await captureThenParse(
      this.#store,
      { source, competition_id: ROBOTS_COMPETITION_ID, fetched_at: at, ext: 'txt' },
      response,
      (body, rawRef) => ({
        policy: parseRobots(new TextDecoder().decode(body), this.#userAgent),
        rawRef,
      }),
    );

    this.#byOrigin.set(origin, { policy: archived.policy, attemptedAtMs: nowMs });
    return archived.rawRef;
  }

  /**
   * The bytes of a `robots.txt`, or `null` if the site did not serve one.
   *
   * A `MissingUserAgentError` is NOT swallowed here: an unidentified request
   * is our defect, not the site being unreachable, and failing closed on it
   * would hide RN-11's second duty behind RN-11's first.
   */
  async #fetchPolicy(url: string): Promise<Uint8Array | null> {
    try {
      return (await politeFetch(this.#fetcher, url, this.#userAgent)).body;
    } catch (error) {
      if (error instanceof Error && error.name === 'MissingUserAgentError') throw error;
      return null;
    }
  }
}
