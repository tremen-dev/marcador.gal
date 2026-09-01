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

/** Thrown when a string that should be an instant is not one. */
export class NotAnInstantError extends Error {
  override readonly name = 'NotAnInstantError';
  readonly value: string;

  constructor(value: string) {
    super(`not an ISO 8601 UTC instant: ${JSON.stringify(value)}`);
    this.value = value;
  }
}

/**
 * Epoch milliseconds of an instant.
 *
 * `Date` appears here as a transient converter and nowhere else in this
 * module: arithmetic needs numbers, and nothing outside holds one (ADR-006).
 * Both the rhythm of RN-11 and the 6 h life of a `robots.txt` are arithmetic
 * over instants, so the courtesy module needs its own converter rather than
 * reaching into the measuring instrument for one.
 */
export function epochMsOf(instant: string): number {
  const epochMs = Date.parse(instant);
  if (Number.isNaN(epochMs)) throw new NotAnInstantError(instant);
  return epochMs;
}
