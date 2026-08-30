/**
 * CA-7 — scoreboard and status are coherent by construction.
 *
 * The cases come from `tests/fixtures/score-cases.ts`, the SAME file CA-18 uses
 * for `Decision`. One dataset, two schemas: what we publish is protected by the
 * same rule as what we observe, and if the two ever diverge it has to be a
 * written decision and not a maintenance slip.
 *
 * `suspended` carries a scoreboard because a match suspended at minute 60 has
 * one; `postponed` does not, because it was never played.
 */
import { describe, expect, test } from 'vitest';
import { ObservationSchema } from '@/model';
import { MATCH_ID, OBSERVATION_ID, RAW_REF, SOURCE_FUTGAL } from '../fixtures/model';
import { SCORE_CASES, UNKNOWN_STATUS } from '../fixtures/score-cases';

const base = {
  id: OBSERVATION_ID,
  match_id: MATCH_ID,
  source: SOURCE_FUTGAL,
  observed_at: '2026-03-21T17:35:00.000Z',
  confidence: 0.7,
  raw_ref: RAW_REF,
};

const accepts = (value: unknown): boolean => ObservationSchema.safeParse(value).success;

describe('CA-7 — scoreboard per status', () => {
  test('the shared table is not empty (the generated cases would be vacuous)', () => {
    expect(SCORE_CASES.length).toBeGreaterThan(0);
  });

  test.each(SCORE_CASES)('$label', ({ status, scores, accepts: expected }) => {
    expect(accepts({ ...base, status, ...scores })).toBe(expected);
  });

  test('an unknown status is not a status', () => {
    expect(accepts({ ...base, status: UNKNOWN_STATUS, home_score: null, away_score: null })).toBe(
      false,
    );
  });
});

describe('CA-7 — confidence is a probability', () => {
  const withConfidence = (confidence: unknown): boolean =>
    accepts({ ...base, status: 'live', home_score: 1, away_score: 0, confidence });

  test.each([0, 0.5, 1])('accepts %s', (value) => {
    expect(withConfidence(value)).toBe(true);
  });

  test.each([1.5, -0.1])('rejects %s', (value) => {
    expect(withConfidence(value)).toBe(false);
  });
});
