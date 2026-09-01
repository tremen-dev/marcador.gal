/**
 * The wall clock, read in ONE place.
 *
 * It travels with the courtesy module (ADR-014 §1) for the same reason the
 * exit door does: RN-11's rhythm is defined over instants, and an injected
 * clock is what lets an hour of it be tested in milliseconds. Keeping a second
 * `systemClock` next to a second rate limiter is how the rhythm quietly stops
 * being one rule.
 *
 * An instant is an ISO 8601 UTC string, never a `Date` (ADR-006).
 */
import type { Instant } from '@/model/ids';

export interface Clock {
  /** The current instant, ISO 8601 UTC as a string (ADR-006). */
  now(): Instant;
}

/** The system clock. The only place the wall clock is read. */
export const systemClock: Clock = {
  now: (): Instant => new Date().toISOString() as Instant,
};
