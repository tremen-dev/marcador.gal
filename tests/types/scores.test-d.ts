/**
 * CA-7 (type level) — narrowing by `status` narrows the scoreboard.
 *
 * The assertion is written as an assignment to a `null`-typed (or
 * `number`-typed) binding rather than to `obs.home_score` itself: the schema
 * ends in `.readonly()`, so writing to the property would fail for being
 * readonly and the directive would pass for the wrong reason. A test that
 * passes for the wrong reason is not a test.
 */
import { describe, expect, test } from 'vitest';
import type { Observation } from '@/model';

declare const obs: Observation;

if (obs.status === 'live') {
  const score: number = obs.home_score;
  // @ts-expect-error inside `live` the scoreboard is a number, never null.
  const notNull: null = obs.home_score;
  void score;
  void notNull;
}

if (obs.status === 'suspended') {
  const score: number = obs.away_score;
  // @ts-expect-error a suspended match has a scoreboard.
  const notNull: null = obs.away_score;
  void score;
  void notNull;
}

if (obs.status === 'scheduled') {
  const empty: null = obs.home_score;
  // @ts-expect-error a match that has not been played has no scoreboard.
  const notANumber: number = obs.home_score;
  void empty;
  void notANumber;
}

if (obs.status === 'postponed') {
  const empty: null = obs.away_score;
  // @ts-expect-error a postponed match was never played, so it has no score.
  const notANumber: number = obs.away_score;
  void empty;
  void notANumber;
}

describe('CA-7 — narrowing at the type level', () => {
  test('the directives above are the assertion', () => {
    expect(true).toBe(true);
  });
});
