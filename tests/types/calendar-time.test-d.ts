/**
 * CA-2.1 (type level) — the converter returns an `Instant`, never a `Date`
 * (ADR-006, ADR-017 §4).
 *
 * Inverted test: if `wallTimeToInstant` ever started returning a `Date`, the
 * directive below would become unused and `tsc` would fail with
 * "Unused '@ts-expect-error' directive".
 */
import { describe, expect, test } from 'vitest';
import type { Instant } from '@/model/ids';
import { wallTimeToInstant } from '@/calendar/time';

declare const wall: string;

/** Invariant type equality: no assignability slack in either direction. */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/** The return type is EXACTLY `Instant`. */
const returnsInstant: Equals<ReturnType<typeof wallTimeToInstant>, Instant> = true;

// @ts-expect-error an Instant is a string with a Z, not a Date (ADR-006).
const asDate: Date = wallTimeToInstant(wall, 'Europe/Madrid');
void asDate;

describe('CA-2.1 — wallTimeToInstant at the type level', () => {
  test('returns Instant and cannot be assigned to Date', () => {
    expect(returnsInstant).toBe(true);
  });
});
