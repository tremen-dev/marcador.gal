/**
 * Phase A of the mirror test: capture (CA-1..CA-5).
 *
 * It hits the sources on the rhythm RN-11 allows, writes the bytes into the
 * `RawStore` of SPEC-001, and records what happened. **It does not parse.**
 * That is not an omission, it is the design: the window is unrepeatable and
 * the analysis is not, so a parser that turns out to be wrong on the day of
 * the window costs a re-run of phase B and nothing else (RN-10, D-5).
 *
 * The one-per-minute limiter lives HERE and not in the caller. A cron that
 * fires every ten seconds, a supervised local loop, a test driving a fake
 * clock — all three have to be equally unable to exceed RN-11.
 */
import { captureThenParse } from '@/raw/capture';
import { instantToEpochMs, normalizeInstant } from '@/mirror/instants';
import { politeFetch } from '@/polite/http';
import { MemoryRateLimit } from '@/polite/rate-limit';
import { robotsSkipReason } from '@/polite/robots';
import { USER_AGENT } from '@/polite/user-agent';
import { pairKey } from './ports';
import type { Clock } from '@/polite/clock';
import type { HttpFetcher } from '@/polite/http';
import type { RateLimit } from '@/polite/rate-limit';
import type { RobotsPolicy } from '@/polite/robots';
import type { CaptureTarget } from './ports';
import type { DeclaredPair, TickRecord, WindowLog } from '@/mirror/window';
import type { RawStore } from '@/raw/store';

export interface CapturerOptions {
  readonly targets: readonly CaptureTarget[];
  readonly fetcher: HttpFetcher;
  readonly store: RawStore;
  readonly clock: Clock;
  /** RN-11. Required on purpose: there is no permissive default (CA-2). */
  readonly robots: RobotsPolicy;
  /**
   * RN-11's rhythm. Optional HERE and required in `SourceAdapter`, and the
   * asymmetry is the frontier of CA-14.8, not an oversight: the window lasts
   * one hour, runs in ONE process and has the operator watching
   * (F-SPEC-002-2), so memory is memory enough. What is deployed uses the
   * durable one; what a person supervises by hand does not.
   */
  readonly rateLimit?: RateLimit;
  /** Overridable only so a test can prove the guard; defaults to the declared UA. */
  readonly userAgent?: string;
}

export class Capturer {
  readonly #targets: readonly CaptureTarget[];
  readonly #fetcher: HttpFetcher;
  readonly #store: RawStore;
  readonly #clock: Clock;
  readonly #robots: RobotsPolicy;
  readonly #userAgent: string;
  /** RN-11's one-per-minute, owned by `src/polite/` (ADR-014 §1). */
  readonly #rateLimit: RateLimit;
  readonly #ticks: TickRecord[] = [];

  constructor(options: CapturerOptions) {
    this.#rateLimit = options.rateLimit ?? new MemoryRateLimit();
    this.#targets = options.targets;
    this.#fetcher = options.fetcher;
    this.#store = options.store;
    this.#clock = options.clock;
    this.#robots = options.robots;
    this.#userAgent = options.userAgent ?? USER_AGENT;
  }

  /**
   * One pass over every target. Targets whose minute has not elapsed are left
   * alone: they produce no request AND no tick record, because a suppressed
   * tick is not a missed one and must not count against the coverage of CA-5.
   */
  async tick(): Promise<void> {
    const at = normalizeInstant(this.#clock.now());
    const epochMs = instantToEpochMs(at);

    for (const target of this.#targets) {
      // ONE step, not two: the turn is granted AND stamped here, BEFORE the
      // await and before the robots check. RN-11 is about the rate at which
      // requests leave, so a slow response must not buy the next tick an
      // early turn, and a forbidden target is asked about once a minute
      // rather than on every pass.
      if (!(await this.#rateLimit.takeTurn(pairKey(target), epochMs))) continue;
      await this.#capture(target, at);
    }
  }

  /**
   * What phase A managed to capture. Phase B reads this before judging.
   *
   * It carries the pairs the run was ASKED to cover as well as the ones that
   * left a trace (SPEC-003 CA-8). Deriving coverage from the ticks alone makes
   * a pair that never produced one invisible, and an invisible pair reads as a
   * window at 100 % of the pairs that did run.
   */
  log(): WindowLog {
    const declared = new Map<string, DeclaredPair>();
    for (const target of this.#targets) {
      declared.set(pairKey(target), {
        source: target.source,
        competition_id: target.competition_id,
      });
    }

    return { ticks: [...this.#ticks], declared_pairs: [...declared.values()] };
  }

  async #capture(target: CaptureTarget, at: string): Promise<void> {
    if (!this.#robots.isAllowed(target.url)) {
      this.#record(target, at, 'skipped', robotsSkipReason(target.url), null);
      return;
    }

    try {
      const response = await politeFetch(this.#fetcher, target.url, this.#userAgent);
      const raw_ref = await captureThenParse(
        this.#store,
        {
          source: target.source,
          competition_id: target.competition_id,
          fetched_at: at,
          ext: target.ext,
        },
        response.body,
        // Phase A's "parser" is the identity on the reference. There is no
        // extraction here and there is no seam for one (CA-3).
        (_body, ref) => ref,
      );

      this.#record(target, at, 'ok', null, raw_ref);
    } catch (error) {
      this.#record(target, at, 'failed', describe(error), null);
    }
  }

  #record(
    target: CaptureTarget,
    at: string,
    outcome: TickRecord['outcome'],
    reason: string | null,
    raw_ref: string | null,
  ): void {
    this.#ticks.push({
      source: target.source,
      competition_id: target.competition_id,
      at: at as TickRecord['at'],
      outcome,
      reason,
      raw_ref,
    });
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}
