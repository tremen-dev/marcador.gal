/**
 * CA-7 — scoreboard and status are coherent by construction.
 *
 * `suspended` carries a scoreboard because a match suspended at minute 60 has
 * one; `postponed` does not, because it was never played.
 */
import { describe, expect, test } from 'vitest';
import { ObservationSchema } from '@/model';
import { MATCH_ID, OBSERVATION_ID, RAW_REF, SOURCE_FUTGAL } from '../fixtures/model';

const base = {
  id: OBSERVATION_ID,
  match_id: MATCH_ID,
  source: SOURCE_FUTGAL,
  observed_at: '2026-03-21T17:35:00.000Z',
  confidence: 0.7,
  raw_ref: RAW_REF,
};

const WITH_SCORE = ['live', 'finished', 'suspended'] as const;
const WITHOUT_SCORE = ['scheduled', 'postponed'] as const;

const accepts = (value: unknown) => ObservationSchema.safeParse(value).success;

describe('CA-7 — scoreboard per status', () => {
  test.each(WITH_SCORE)('%s accepts non-negative integers', (status) => {
    expect(accepts({ ...base, status, home_score: 2, away_score: 0 })).toBe(true);
  });

  test.each(WITH_SCORE)('%s rejects a null scoreboard', (status) => {
    expect(accepts({ ...base, status, home_score: null, away_score: null })).toBe(false);
  });

  test.each(WITH_SCORE)('%s rejects an absent scoreboard', (status) => {
    expect(accepts({ ...base, status })).toBe(false);
  });

  test.each(WITHOUT_SCORE)('%s accepts a null scoreboard', (status) => {
    expect(accepts({ ...base, status, home_score: null, away_score: null })).toBe(true);
  });

  test.each(WITHOUT_SCORE)('%s rejects any number as a scoreboard', (status) => {
    expect(accepts({ ...base, status, home_score: 0, away_score: 0 })).toBe(false);
    expect(accepts({ ...base, status, home_score: 3, away_score: 1 })).toBe(false);
  });

  test.each(WITH_SCORE)('%s rejects a negative score', (status) => {
    expect(accepts({ ...base, status, home_score: -1, away_score: 0 })).toBe(false);
  });

  test.each(WITH_SCORE)('%s rejects a fractional score', (status) => {
    expect(accepts({ ...base, status, home_score: 1.5, away_score: 0 })).toBe(false);
  });

  test('an unknown status is not a status', () => {
    expect(accepts({ ...base, status: 'aprazado', home_score: null, away_score: null })).toBe(
      false,
    );
  });
});

describe('CA-7 — confidence is a probability', () => {
  const withConfidence = (confidence: unknown) =>
    accepts({ ...base, status: 'live', home_score: 1, away_score: 0, confidence });

  test.each([0, 0.5, 1])('accepts %s', (value) => {
    expect(withConfidence(value)).toBe(true);
  });

  test.each([1.5, -0.1])('rejects %s', (value) => {
    expect(withConfidence(value)).toBe(false);
  });
});
