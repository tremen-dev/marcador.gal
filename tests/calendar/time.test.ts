/**
 * CA-2 — local wall-clock time becomes an ISO 8601 UTC string with `Z` AT THE
 * EDGE, and what does not exist is rejected (ADR-006, ADR-017 §4).
 *
 * Pure: `Intl` from Node, no dependency, no database. `npm test`.
 *
 * The six cases the spec fixes, the change of hour included. This is a place
 * where this project had nothing written and where a mistake is silent — an
 * hour off in the kickoff opens the observation window at the wrong time and
 * the coverage figure loses a match for a reason nobody sees.
 */
import { describe, expect, test } from 'vitest';
import { InstantSchema } from '@/model/ids';
import { AmbiguousWallTimeError, NonexistentWallTimeError, wallTimeToInstant } from '@/calendar/time';

describe('CA-2 — Europe/Madrid wall-clock time to a UTC instant', () => {
  test.each([
    ['summer', '2026-09-06 17:00', '2026-09-06T15:00:00.000Z'],
    ['winter', '2027-01-17 17:00', '2027-01-17T16:00:00.000Z'],
    ['the eve of the change to winter time', '2026-10-24 17:00', '2026-10-24T15:00:00.000Z'],
    ['the day of the change to winter time', '2026-10-25 17:00', '2026-10-25T16:00:00.000Z'],
  ])('%s: %s → %s', (_label, wall, instant) => {
    expect(wallTimeToInstant(wall, 'Europe/Madrid')).toBe(instant);
  });

  test('the result satisfies InstantSchema: a string with a Z, never a Date', () => {
    const instant = wallTimeToInstant('2026-09-06 17:00', 'Europe/Madrid');

    expect(typeof instant).toBe('string');
    expect(InstantSchema.safeParse(instant).success).toBe(true);
    expect(instant.endsWith('Z')).toBe(true);
  });

  test('2027-03-28 02:30 does not exist (the gap of the change to summer) and is rejected by name', () => {
    expect(() => wallTimeToInstant('2027-03-28 02:30', 'Europe/Madrid')).toThrow(
      NonexistentWallTimeError,
    );
    expect(() => wallTimeToInstant('2027-03-28 02:30', 'Europe/Madrid')).toThrow(
      /2027-03-28 02:30.*does not exist/,
    );
  });

  test('2026-10-25 02:30 happens twice (the change to winter) and is rejected as ambiguous', () => {
    expect(() => wallTimeToInstant('2026-10-25 02:30', 'Europe/Madrid')).toThrow(
      AmbiguousWallTimeError,
    );
    expect(() => wallTimeToInstant('2026-10-25 02:30', 'Europe/Madrid')).toThrow(
      /2026-10-25 02:30.*ambiguous/,
    );
  });

  test('the two rejections are distinguishable from each other and from a malformed string', () => {
    const nonexistent = (() => {
      try {
        wallTimeToInstant('2027-03-28 02:30', 'Europe/Madrid');
      } catch (error) {
        return error;
      }
      return null;
    })();
    expect(nonexistent).toBeInstanceOf(NonexistentWallTimeError);
    expect(nonexistent).not.toBeInstanceOf(AmbiguousWallTimeError);

    expect(() => wallTimeToInstant('2026-09-06T17:00', 'Europe/Madrid')).toThrow(
      /YYYY-MM-DD HH:MM/,
    );
    expect(() => wallTimeToInstant('2026-02-30 17:00', 'Europe/Madrid')).toThrow(/not a date/);
  });

  test('midnight and the last minute of the day round-trip too', () => {
    expect(wallTimeToInstant('2026-09-06 00:00', 'Europe/Madrid')).toBe('2026-09-05T22:00:00.000Z');
    expect(wallTimeToInstant('2026-12-31 23:59', 'Europe/Madrid')).toBe('2026-12-31T22:59:00.000Z');
  });
});
