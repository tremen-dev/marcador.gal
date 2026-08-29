/**
 * CA-19 (RN-12, scope of `rule`) — the zod half.
 *
 * The rejected list is walked as a TABLE over the invariants of `reglas.md`, so
 * that adding a new RN there does not leave this half done: a new invariant has
 * to be added to the table, and a new ENGINE rule has to be added to
 * `DECISION_RULES`.
 */
import { describe, expect, test } from 'vitest';
import { DECISION_RULES, DecisionSchema } from '@/model';
import { decisionFixture } from '../fixtures/model';

const withRule = (rule: string): boolean =>
  DecisionSchema.safeParse({ ...decisionFixture, rule }).success;

/** reglas.md §Invariantes del proyecto. None of these can produce a Decision. */
const PROJECT_INVARIANTS = ['RN-08', 'RN-09', 'RN-10', 'RN-11', 'RN-12', 'RN-13'] as const;

describe('CA-19 — DecisionSchema only accepts engine rules', () => {
  test.each(DECISION_RULES)('accepts %s', (rule) => {
    expect(withRule(rule)).toBe(true);
  });

  test.each(PROJECT_INVARIANTS)('rejects the project invariant %s', (rule) => {
    expect(withRule(rule)).toBe(false);
  });

  test('rejects a rule that is in no section of reglas.md', () => {
    expect(withRule('RN-99')).toBe(false);
  });

  test('the engine vocabulary is exactly RN-01..RN-07', () => {
    expect([...DECISION_RULES]).toEqual([
      'RN-01',
      'RN-02',
      'RN-03',
      'RN-04',
      'RN-05',
      'RN-06',
      'RN-07',
    ]);
  });
});
