/**
 * CA-18 (zod level) — what we publish is protected at least as much as what we
 * observe.
 *
 * The cases come from `tests/fixtures/score-cases.ts`, the SAME file CA-7 uses
 * for `Observation`. One dataset, two schemas: if the two rules ever diverge it
 * has to be a written decision, not a maintenance slip.
 */
import { describe, expect, test } from 'vitest';
import { MATCH_STATUSES, DecisionSchema } from '@/model';
import { SCORE_CASES, UNKNOWN_STATUS } from '../fixtures/score-cases';
import { MATCH_ID, OBSERVATION_ID } from '../fixtures/model';

const base = {
  match_id: MATCH_ID,
  provisional: false,
  rule: 'RN-02',
  decided_at: '2026-03-21T17:35:01.000Z',
  supporting_observation_ids: [OBSERVATION_ID],
  version: 1,
};

const accepts = (value: unknown): boolean => DecisionSchema.safeParse(value).success;

describe('CA-18 — scoreboard per status, the same table as CA-7', () => {
  test('the shared table is not empty (the generated cases would be vacuous)', () => {
    expect(SCORE_CASES.length).toBeGreaterThan(0);
  });

  /**
   * CA-18 asks for «exactamente las mismas cinco ramas» as `Observation`. The
   * table proves each of them parses; this proves there are no others: a sixth
   * status added to the model without a branch would leave it uncovered.
   */
  test('the shared table covers every status of the canonical model', () => {
    const covered = [...new Set(SCORE_CASES.map((item) => item.status))].sort();

    expect(covered).toEqual([...MATCH_STATUSES].sort());
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
