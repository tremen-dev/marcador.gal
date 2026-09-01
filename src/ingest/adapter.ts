/**
 * The source adapter: from a page of a source to `Observation` (SPEC-008 §1).
 *
 * It is split into TWO FUNCTIONS THAT DO NOT CALL EACH OTHER, and that seam is
 * what makes RN-10 worth its cost:
 *
 *   `capture()`  asks, archives, and hands back the `RawRef` and the bytes.
 *   `read()`     touches neither the network nor the clock, and turns archived
 *                bytes into `Observation`.
 *
 * With that seam, reprocessing a whole matchday with a corrected parser is
 * running `read` over the archive.
 *
 * THE LIMITER OF RN-11 LIVES IN HERE, NOT IN THE CALLER (§4). A cron firing
 * every ten seconds, a supervised local loop and a test with a fake clock have
 * to be equally unable to exceed one request per minute per competition. A
 * suppressed tick is not a failed tick: it produces no request and no record.
 *
 * WHAT IT DOES NOT DO, and it is a frontier and not an omission: it does not
 * decide (RN-08), does not persist, does not resolve aliases (RN-09), does not
 * publish, and does not know what time it is beyond the clock it is handed.
 */
import { captureThenParse } from '@/raw/capture';
import { epochMsOf } from '@/polite/clock';
import { assertUserAgent, politeFetch } from '@/polite/http';
import { pairKey, rateLimitSkipReason } from '@/polite/rate-limit';
import { USER_AGENT } from '@/polite/user-agent';
import { readRows } from './observations';
import type { Clock } from '@/polite/clock';
import type { HttpFetcher } from '@/polite/http';
import type { PolicyGate } from '@/polite/policy';
import type { RateLimit } from '@/polite/rate-limit';
import type { Instant } from '@/model/ids';
import type { RawRef, RawStore } from '@/raw/store';
import type { MatchResolver, ReadResult } from './ports';
import type { IngestTarget, SourceRegistry } from './sources';

export interface SourceAdapterOptions {
  readonly registry: SourceRegistry;
  readonly fetcher: HttpFetcher;
  readonly store: RawStore;
  readonly clock: Clock;
  /** RN-11. Required on purpose: there is no permissive default. */
  readonly robots: PolicyGate;
  /**
   * RN-11's rhythm. Required on purpose and for the same reason as `robots`:
   * a permissive default would be an instance-local limiter, and ADR-004 says
   * every tick is a new instance — which is how ten requests reached the same
   * pair in the same minute (F-SPEC-008-V13, CA-14.1).
   */
  readonly rateLimit: RateLimit;
  readonly resolver: MatchResolver;
  /** Overridable only so a test can prove the guard; defaults to the declared UA. */
  readonly userAgent?: string;
}

/** What one attempt at one pair produced. */
export type CaptureOutcome =
  | {
      readonly kind: 'captured';
      readonly at: Instant;
      readonly raw_ref: RawRef;
      readonly body: Uint8Array;
    }
  | { readonly kind: 'skipped'; readonly at: Instant; readonly reason: string };

/** What one pass of the tick recorded for one pair. */
export interface TickRecord {
  readonly source: string;
  readonly competition_id: string;
  readonly at: Instant;
  readonly outcome: 'ok' | 'skipped' | 'failed';
  readonly reason: string | null;
  readonly raw_ref: RawRef | null;
}

export class SourceAdapter {
  readonly #options: SourceAdapterOptions;
  readonly #userAgent: string;

  constructor(options: SourceAdapterOptions) {
    this.#options = options;
    this.#userAgent = options.userAgent ?? USER_AGENT;
  }

  /**
   * Asks for one competition page, archives it, and hands back the reference
   * and the bytes.
   *
   * THE RHYTHM OF RN-11 IS ENFORCED HERE, in the only public way in, and not
   * only in `tick()`. This method is public API: if it did not consult the
   * limiter, a supervised local loop calling it ten times would send ten
   * requests in the same minute and RN-11 would rest on the discipline of the
   * caller — which is exactly what CA-7 says it must not. The seam of §5
   * survives untouched: `capture()` and `read()` still do not call each other.
   *
   * IT THROWS AND DOES NOT WRAP. If the archive fails, nothing is parsed, no
   * `Observation` is produced and the error leaves as it is: an `Observation`
   * without its raw is one nobody can reprocess, which is the whole reason
   * RN-10 exists, and a partial result would let a caller carry on as if the
   * response had been kept.
   */
  async capture(target: IngestTarget, at: Instant): Promise<CaptureOutcome> {
    // Before ANY I/O: a request that would leave without identifying us is
    // our defect, and it is caught here rather than at the door (RN-11). It
    // goes before the limiter because a missing user-agent is a defect of
    // ours, not a turn of the rhythm, and must not be answered with a skip.
    assertUserAgent(target.url, this.#userAgent);

    const key = pairKey(target.source, target.competition_id);

    // ONE step, not two: the turn is granted AND stamped here. Asking first
    // and stamping afterwards leaves a gap another instance fits into, and on
    // Vercel every tick IS another instance (ADR-004, CA-14.1). It happens
    // BEFORE the await and before the robots check: RN-11 is about the rate at
    // which requests LEAVE, so a slow response must not buy the next turn an
    // early one, and a forbidden target is asked about once a minute rather
    // than on every pass of the cron.
    //
    // If it THROWS, nothing leaves: without state of the rhythm there is no
    // demonstrable rhythm, and that fails closed (CA-14.7).
    if (!(await this.#options.rateLimit.takeTurn(key, epochMsOf(at)))) {
      return { kind: 'skipped', at, reason: rateLimitSkipReason(key) };
    }

    return await this.#captureGranted(target, at);
  }

  /**
   * The rest of a capture, once the turn is already granted and stamped.
   *
   * It exists because the port has ONE operation on purpose: `tick()` cannot
   * consult without spending, so it takes the turn itself and hands the work
   * here rather than going through `capture()` and spending a second one.
   */
  async #captureGranted(target: IngestTarget, at: Instant): Promise<CaptureOutcome> {
    const decision = await this.#options.robots.allows(target.url, target.source, at);
    if (!decision.allowed) {
      return { kind: 'skipped', at, reason: decision.reason ?? 'no robots.txt policy (RN-11)' };
    }

    const response = await politeFetch(this.#options.fetcher, target.url, this.#userAgent);

    // RN-10 as structure: the "parser" of this step is the identity on the
    // reference, so nothing can read a byte before `put` has resolved.
    const raw_ref = await captureThenParse(
      this.#options.store,
      {
        source: target.source,
        competition_id: target.competition_id,
        fetched_at: at,
        ext: target.ext,
      },
      response.body,
      (_body, ref) => ref,
    );

    return { kind: 'captured', at, raw_ref, body: response.body };
  }

  /**
   * Reads archived bytes into `Observation`. No network, no clock: the
   * instant and the reference are the ones the capture produced.
   */
  async read(
    target: IngestTarget,
    body: Uint8Array,
    rawRef: RawRef,
    at: Instant,
  ): Promise<ReadResult> {
    const entry = this.#options.registry.entry(target.source);

    return await readRows({
      rows: entry.extract(body),
      source: entry.source,
      competitionId: target.competition_id,
      // RN-01: the weight comes from the registry, never from a constant here.
      confidence: entry.weight,
      observedAt: at,
      rawRef,
      resolver: this.#options.resolver,
    });
  }

  /**
   * One pass over every pair of the registry.
   *
   * Pairs whose minute has not elapsed are left alone: they produce no request
   * AND no record, because a suppressed tick is not a missed one.
   */
  async tick(): Promise<readonly TickRecord[]> {
    const at = this.#options.clock.now();
    const epochMs = epochMsOf(at);
    const records: TickRecord[] = [];

    for (const target of this.#options.registry.targets()) {
      // The turn is taken HERE and not inside `capture()`, and that is forced
      // by the port having one operation: this pass needs to know something
      // `capture()` cannot tell it — that a suppressed turn produces NO
      // RECORD (CA-7). A suppressed tick is not a failed tick, and turning it
      // into a `skipped` record would read as lost coverage. Going through
      // `capture()` would spend a second turn for the same request.
      const head = { source: target.source, competition_id: target.competition_id, at };
      const key = pairKey(target.source, target.competition_id);

      let granted: boolean;
      try {
        // Still before ANY I/O, the taking of the turn included: a request
        // that would leave without identifying us is our defect, and taking a
        // turn for it would spend a minute of RN-11 on nothing (CA-5.2).
        assertUserAgent(target.url, this.#userAgent);
        granted = await this.#options.rateLimit.takeTurn(key, epochMs);
      } catch (error) {
        // Fails CLOSED (CA-14.7): nothing was requested and nothing archived,
        // and the tick records why. A failure of the rhythm's state is NOT a
        // suppressed turn — a suppressed turn is silent, this one is not.
        records.push({ ...head, outcome: 'failed', reason: describe(error), raw_ref: null });
        continue;
      }

      if (!granted) continue;

      records.push(await this.#attempt(target, at));
    }

    return records;
  }

  async #attempt(target: IngestTarget, at: Instant): Promise<TickRecord> {
    const head = {
      source: target.source,
      competition_id: target.competition_id,
      at,
    };

    try {
      // The turn was already taken by `tick()`; spending a second one here
      // would deny every request the pass makes.
      const outcome = await this.#captureGranted(target, at);
      return outcome.kind === 'skipped'
        ? { ...head, outcome: 'skipped', reason: outcome.reason, raw_ref: null }
        : { ...head, outcome: 'ok', reason: null, raw_ref: outcome.raw_ref };
    } catch (error) {
      return { ...head, outcome: 'failed', reason: describe(error), raw_ref: null };
    }
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}
