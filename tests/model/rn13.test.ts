/**
 * CA-6 (RN-13) — the runtime half: a parsed Observation comes out frozen, so
 * the amendment fails even from code that lied about the type.
 */
import { describe, expect, test } from 'vitest';
import { DecisionSchema, ObservationSchema } from '@/model';
import { decisionFixture, observationFixture } from '../fixtures/model';

describe('CA-6 — RN-13 at runtime', () => {
  test('an Observation comes out of .parse() frozen', () => {
    const obs = ObservationSchema.parse(observationFixture);

    expect(Object.isFrozen(obs)).toBe(true);
    expect(() => {
      (obs as { home_score: number }).home_score = 9;
    }).toThrow();
    expect(obs.home_score).toBe(observationFixture.home_score);
  });

  test('an Observation cannot have its status rewritten either', () => {
    const obs = ObservationSchema.parse(observationFixture);

    expect(() => {
      (obs as { status: string }).status = 'finished';
    }).toThrow();
    expect(obs.status).toBe('live');
  });

  test('a Decision comes out of .parse() frozen', () => {
    const decision = DecisionSchema.parse(decisionFixture);

    expect(Object.isFrozen(decision)).toBe(true);
    expect(() => {
      (decision as { version: number }).version = 99;
    }).toThrow();
    expect(decision.version).toBe(1);
  });
});
