/**
 * The durable `PolicyGate`: the life of a `robots.txt` survives the process
 * (SPEC-012 CA-3, ADR-019 §4; ADR-014 — courtesy has ONE owner, and this is
 * courtesy).
 *
 * `RobotsGate` (`./policy.ts`) caches policy and attempt stamp in an instance
 * `Map`, and on Vercel every tick is a NEW instance (ADR-004): the cache is
 * born empty every minute, and the gate would ask for the `robots.txt` of the
 * origin on every cold start — up to one robots request per minute and origin,
 * which is the discourtesy its own comment forbids. That gate stays as it is
 * and stays correct WHERE IT RUNS: the supervised instrument (`src/mirror/`,
 * F-SPEC-002-2, SPEC-008 CA-14.8). This one is for everything deployed.
 *
 * The memory is split between what already exists, each piece remembering
 * what it truly knows (ADR-019 §4):
 *
 *   - THE ARCHIVE REMEMBERS WHAT CAME BACK. The policy in force for an origin
 *     is the most recent `robots.txt` in the raw store under
 *     `<source>/robots/` (the key of ADR-014 §3.4) whose `fetched_at` is
 *     within the 6 h of ADR-014 §3.2. RN-10 already forced it to be archived
 *     before parsing, so the memory was written and nobody was reading it.
 *     It is re-read and parsed with `parseRobots` — NO NEW PARSER (ADR-014
 *     §4).
 *   - THE DURABLE TURN REMEMBERS WHAT WENT OUT. The right to ATTEMPT a
 *     refresh is taken with the same `takeTurn` of SPEC-008 CA-14, under the
 *     origin's own key (`robots/<origin>`), counted apart from the pair
 *     (ADR-014 §3.2). It is a RETRY ceiling against an origin that does not
 *     serve its `robots.txt`, not a cadence: in normal regime the archive
 *     imposes the 6 h and one robots request leaves per origin per half day.
 *   - FAILS CLOSED, as always (ADR-014 §3.3): no policy in force and no
 *     refresh achieved means nothing leaves towards that origin, and the
 *     decision carries the reason so the tick can record it.
 */
import { captureThenParse } from '@/raw/capture';
import { epochMsOf } from './clock';
import { politeFetch } from './http';
import { ROBOTS_COMPETITION_ID, ROBOTS_MAX_AGE_MS } from './policy';
import { parseRobots, robotsSkipReason } from './robots';
import type { GateDecision, PolicyGate } from './policy';
import type { HttpFetcher } from './http';
import type { RateLimit } from './rate-limit';
import type { RobotsPolicy } from './robots';
import type { RawRef, RawStore } from '@/raw/store';

/** The rhythm key of an origin's robots refresh, counted apart from the pair. */
export function robotsTurnKey(origin: string): string {
  return `robots/${origin}`;
}

export interface DurablePolicyGateOptions {
  readonly fetcher: HttpFetcher;
  readonly store: RawStore;
  /**
   * The DURABLE turn (SPEC-008 CA-14). Required on purpose: an in-memory one
   * here would be F-SPEC-008-V13 all over again, one module further out.
   */
  readonly rateLimit: RateLimit;
  readonly userAgent: string;
  /** Overridable only so a test can drive the expiry; defaults to six hours. */
  readonly maxAgeMs?: number;
}

export class DurablePolicyGate implements PolicyGate {
  readonly #fetcher: HttpFetcher;
  readonly #store: RawStore;
  readonly #rateLimit: RateLimit;
  readonly #userAgent: string;
  readonly #maxAgeMs: number;

  constructor(options: DurablePolicyGateOptions) {
    this.#fetcher = options.fetcher;
    this.#store = options.store;
    this.#rateLimit = options.rateLimit;
    this.#userAgent = options.userAgent;
    this.#maxAgeMs = options.maxAgeMs ?? ROBOTS_MAX_AGE_MS;
  }

  async allows(url: string, source: string, at: string): Promise<GateDecision> {
    const origin = new URL(url).origin;
    const nowMs = epochMsOf(at);

    let policy = await this.#archivedPolicy(source, nowMs);
    let policyRawRef: RawRef | null = null;

    if (policy === null) {
      // No policy in force in the archive: the right to TRY a refresh is
      // taken from the durable rhythm, so an origin that serves nothing is
      // asked at most once a minute however many instances wake up.
      if (!(await this.#rateLimit.takeTurn(robotsTurnKey(origin), nowMs))) {
        return {
          allowed: false,
          reason:
            `no robots.txt policy in force for ${origin} and its refresh was already ` +
            'attempted less than a minute ago: nothing is requested (RN-11)',
          policyRawRef: null,
        };
      }

      const refreshed = await this.#refresh(origin, source, at);
      if (refreshed !== null) {
        policy = refreshed.policy;
        policyRawRef = refreshed.rawRef;
      }
    }

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
   * The policy the archive holds in force for `source`, or `null`.
   *
   * The most recent key under `<source>/robots/` is the last one in order:
   * the day and the instant are inside the key, zero-padded, so the
   * lexicographic order of the archive IS chronological order. Its
   * `fetched_at` comes from the archived meta, not re-derived from the key.
   */
  async #archivedPolicy(source: string, nowMs: number): Promise<RobotsPolicy | null> {
    const keys = await this.#store.list(`${source}/${ROBOTS_COMPETITION_ID}/`);
    const newest = keys.at(-1);
    if (newest === undefined) return null;

    const archived = await this.#store.get(newest);
    if (archived === null) return null;

    if (nowMs - epochMsOf(archived.meta.fetched_at) >= this.#maxAgeMs) return null;

    return parseRobots(new TextDecoder().decode(archived.body), this.#userAgent);
  }

  /** One attempt at the origin's `robots.txt`. Archive first, then parse (RN-10). */
  async #refresh(
    origin: string,
    source: string,
    at: string,
  ): Promise<{ policy: RobotsPolicy; rawRef: RawRef } | null> {
    const body = await this.#fetchPolicy(`${origin}/robots.txt`);
    if (body === null) return null;

    return await captureThenParse(
      this.#store,
      { source, competition_id: ROBOTS_COMPETITION_ID, fetched_at: at, ext: 'txt' },
      body,
      (bytes, rawRef) => ({
        policy: parseRobots(new TextDecoder().decode(bytes), this.#userAgent),
        rawRef,
      }),
    );
  }

  /**
   * The bytes of a `robots.txt`, or `null` if the site did not serve one.
   * A `MissingUserAgentError` is NOT swallowed: an unidentified request is
   * our defect, not the site being unreachable (same rule as `RobotsGate`).
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
