/**
 * A `Clock` the test drives by hand (SPEC-002 CA-1).
 *
 * The capturer never reads the wall clock: it asks its `Clock` port. That is
 * what lets an hour of RN-11 rate limiting be tested in milliseconds, and what
 * keeps phase A out of the "sleep and hope" school of testing.
 */
import { canonicalInstant, instantToEpochMs } from '@/mirror/instants';
import type { Clock } from '@/mirror/capture/ports';
import type { Instant } from '@/model/ids';

export class FakeClock implements Clock {
  #epochMs: number;

  constructor(start: string) {
    this.#epochMs = instantToEpochMs(start);
  }

  now(): Instant {
    return canonicalInstant(this.#epochMs);
  }

  /** Moves the clock forward. Never backwards: time does not do that. */
  advance(ms: number): void {
    if (ms < 0) throw new Error('FakeClock cannot go backwards');
    this.#epochMs += ms;
  }
}
