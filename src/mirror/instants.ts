/**
 * Instants for the mirror test (ADR-006).
 *
 * An instant is an ISO 8601 UTC **string**, never a `Date`. `Date` appears in
 * this file and nowhere else, as a transient converter: arithmetic needs
 * numbers, and nothing outside this module ever holds one.
 *
 * `canonicalInstant` always emits milliseconds (`.000Z`), and that is
 * load-bearing for CA-4: `rawKey()` builds the archive key out of this string,
 * and only a fixed-width instant makes the lexicographic order of the keys the
 * same as the chronological order. `2026-09-05T17:00:00Z` and
 * `2026-09-05T17:00:00.500Z` sort backwards ('z' > '.'), so a capturer that
 * let a source's own formatting through would break the timeline silently.
 */
import { InstantSchema } from '@/model/ids';
import type { Instant } from '@/model/ids';

/** Thrown when a string that should be an instant is not one. */
export class InvalidInstantError extends Error {
  override readonly name = 'InvalidInstantError';
  readonly value: string;

  constructor(value: string) {
    super(`not an ISO 8601 UTC instant: ${JSON.stringify(value)}`);
    this.value = value;
  }
}

/** The canonical ISO 8601 UTC string for an epoch instant, always with `.mmm`. */
export function canonicalInstant(epochMs: number): Instant {
  if (!Number.isFinite(epochMs)) throw new InvalidInstantError(String(epochMs));
  return InstantSchema.parse(new Date(epochMs).toISOString());
}

/** Epoch milliseconds of an instant. Rejects anything the model would reject. */
export function instantToEpochMs(instant: string): number {
  const parsed = InstantSchema.safeParse(instant);
  if (!parsed.success) throw new InvalidInstantError(instant);

  const epochMs = Date.parse(parsed.data);
  if (Number.isNaN(epochMs)) throw new InvalidInstantError(instant);
  return epochMs;
}

/** Re-emits an instant in the canonical fixed-width form. */
export function normalizeInstant(instant: string): Instant {
  return canonicalInstant(instantToEpochMs(instant));
}
