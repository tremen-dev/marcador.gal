/**
 * CA-3 (RN-12) — the runtime half: the same four cases of
 * `tests/types/rn12.test-d.ts` replayed against `DecisionSchema.safeParse`.
 */
import { describe, expect, test } from 'vitest';
import { DecisionSchema } from '@/model';
import {
  decisionCitingAnInvariant,
  decisionWithMatchIdAsSupport,
  decisionWithNoSupport,
  decisionWithUnknownRule,
  decisionWithoutRule,
} from '../types/rn12.test-d';

describe('CA-3 — RN-12 at runtime', () => {
  test.each([
    ['a Decision without rule', decisionWithoutRule],
    ['a Decision with no supporting observations', decisionWithNoSupport],
    ['a Decision citing a rule that does not exist', decisionWithUnknownRule],
    ['a Decision citing a project invariant instead of an engine rule', decisionCitingAnInvariant],
  ])('DecisionSchema rejects %s', (_name, value) => {
    expect(DecisionSchema.safeParse(value).success).toBe(false);
  });

  /**
   * Case 4 of CA-3 is a TYPE-level invariant and cannot be a runtime one: zod's
   * `.brand()` adds no runtime representation, so at runtime a MatchId and an
   * ObservationId are the same string. This test pins that fact so nobody
   * later believes `safeParse` protects them here. RN-12's runtime net for
   * this case is the Postgres trigger of CA-15.4, which checks the ids exist
   * AND belong to the same match.
   */
  test('a MatchId used as support is caught by the type, not by safeParse', () => {
    expect(DecisionSchema.safeParse(decisionWithMatchIdAsSupport).success).toBe(true);
  });
});
