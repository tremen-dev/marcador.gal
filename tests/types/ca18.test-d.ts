/**
 * CA-18 (type level) — a Decision whose scoreboard contradicts its status does
 * not compile.
 *
 * Inverted tests: if `DecisionSchema` stops being a discriminated union, the
 * directives below become unused and `tsc` fails with
 * "Unused '@ts-expect-error' directive".
 *
 * Each `@ts-expect-error` sits on the DECLARATION and not on the offending
 * property, because that is where TypeScript reports an object literal that
 * matches no member of a union. A directive on a whole declaration is a blunt
 * instrument —it would swallow a typo elsewhere in the literal— so every case
 * is paired with a WELL-FORMED value of the same branch that must compile
 * clean. If a branch broke for an unrelated reason, the pair stops agreeing.
 *
 * The narrowing assertions are written as assignments to a `null`-typed (or
 * `number`-typed) BINDING and not to `decision.home_score`, because the schema
 * ends in `.readonly()`: writing to the property would fail for being readonly
 * and the directive would pass for the wrong reason.
 */
import { describe, expect, test } from 'vitest';
import type { Decision, MatchId, ObservationId } from '@/model';

const MATCH_ID = 'futgal-preferente-g1-2026-27-j23' as MatchId;
const OBSERVATION_ID = 'obs-0001' as ObservationId;

const base = {
  match_id: MATCH_ID,
  provisional: false,
  rule: 'RN-02',
  decided_at: '2026-03-21T17:35:01.000Z',
  version: 1,
} as const;

const support = [OBSERVATION_ID] as [ObservationId];

/** a. A match that has not been played cannot be winning 5-x. */
// @ts-expect-error a scheduled match has no scoreboard.
export const scheduledWithScore: Decision = {
  ...base,
  status: 'scheduled',
  home_score: 5,
  away_score: null,
  supporting_observation_ids: support,
};

/** The control for a: the same branch, well formed, compiles. */
export const scheduledWellFormed: Decision = {
  ...base,
  status: 'scheduled',
  home_score: null,
  away_score: null,
  supporting_observation_ids: support,
};

/** b. Nor can a postponed one be drawing 0-0: it was never played. */
// @ts-expect-error a postponed match was never played, so it has no score.
export const postponedWithScore: Decision = {
  ...base,
  status: 'postponed',
  home_score: null,
  away_score: 0,
  supporting_observation_ids: support,
};

/** The control for b. */
export const postponedWellFormed: Decision = {
  ...base,
  status: 'postponed',
  home_score: null,
  away_score: null,
  supporting_observation_ids: support,
};

/** c. A live match has a scoreboard, even if it is 0-0. `null` is not a score. */
// @ts-expect-error a live match always has a scoreboard.
export const liveWithoutScore: Decision = {
  ...base,
  status: 'live',
  home_score: null,
  away_score: 0,
  supporting_observation_ids: support,
};

/** The control for c. */
export const liveWellFormed: Decision = {
  ...base,
  status: 'live',
  home_score: 1,
  away_score: 0,
  supporting_observation_ids: support,
};

/** d. And a finished one cannot omit it. */
// @ts-expect-error a finished match without `home_score` is not a Decision.
export const finishedWithoutScore: Decision = {
  ...base,
  status: 'finished',
  away_score: 0,
  supporting_observation_ids: support,
};

/** The control for d. */
export const finishedWellFormed: Decision = {
  ...base,
  status: 'finished',
  home_score: 2,
  away_score: 0,
  supporting_observation_ids: support,
};

declare const decision: Decision;

if (decision.status === 'live') {
  const score: number = decision.home_score;
  // @ts-expect-error inside `live` the scoreboard is a number, never null.
  const notNull: null = decision.home_score;
  void score;
  void notNull;
}

if (decision.status === 'suspended') {
  const score: number = decision.away_score;
  // @ts-expect-error a suspended match has a scoreboard.
  const notNull: null = decision.away_score;
  void score;
  void notNull;
}

if (decision.status === 'scheduled') {
  const empty: null = decision.home_score;
  // @ts-expect-error a match that has not been played has no scoreboard.
  const notANumber: number = decision.home_score;
  void empty;
  void notANumber;
}

if (decision.status === 'postponed') {
  const empty: null = decision.away_score;
  // @ts-expect-error a postponed match was never played, so it has no score.
  const notANumber: number = decision.away_score;
  void empty;
  void notANumber;
}

describe('CA-18 — narrowing at the type level', () => {
  test('the directives above are the assertion', () => {
    expect(true).toBe(true);
  });
});
