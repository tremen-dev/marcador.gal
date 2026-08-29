/**
 * CA-3 (RN-12, type level) — a Decision without traceability does not compile.
 *
 * Every `@ts-expect-error` below is an INVERTED test: if the invariant stops
 * holding, the directive becomes unused and `tsc` fails with
 * "Unused '@ts-expect-error' directive". A type test that degrades silently is
 * not a test.
 *
 * The four cases are exported so `tests/model/rn12.test.ts` can replay them
 * against `DecisionSchema.safeParse` at runtime.
 */
import { describe, expectTypeOf, test } from 'vitest';
import type { Decision, MatchId, ObservationId } from '@/model';

const MATCH_ID = 'futgal-preferente-g1-2026-27-j23' as MatchId;
const OBSERVATION_ID = 'obs-0001' as ObservationId;

const base = {
  match_id: MATCH_ID,
  status: 'live',
  home_score: 1,
  away_score: 0,
  provisional: false,
  decided_at: '2026-03-21T17:35:01.000Z',
  version: 1,
} as const;

/** 1. RN-12: a Decision with no `rule` is not traceable and must not exist. */
// @ts-expect-error `rule` is required: a Decision without it cannot say why it exists.
export const decisionWithoutRule: Decision = {
  ...base,
  supporting_observation_ids: [OBSERVATION_ID],
};

/** 2. RN-12: no supporting observations means nothing sustains the decision. */
export const decisionWithNoSupport: Decision = {
  ...base,
  rule: 'RN-02',
  // @ts-expect-error the empty array is a compile error, not a validation error.
  supporting_observation_ids: [],
};

/** 3. RN-12: the rule cited must be a rule of reglas.md. */
export const decisionWithUnknownRule: Decision = {
  ...base,
  // @ts-expect-error 'RN-99' is not a rule of reglas.md.
  rule: 'RN-99',
  supporting_observation_ids: [OBSERVATION_ID],
};

/**
 * 3-bis. RN-12 after CA-19: the rule cited must be a rule of the ENGINE.
 * 'RN-13' IS in reglas.md, which is exactly why it is the dangerous case: it
 * looks like traceability and is not (dominio.md: «la regla del motor»).
 */
export const decisionCitingAnInvariant: Decision = {
  ...base,
  // @ts-expect-error 'RN-13' is a project invariant, not an engine rule (CA-19).
  rule: 'RN-13',
  supporting_observation_ids: [OBSERVATION_ID],
};

/** 4. RN-12: the supporting ids are Observation ids, not Match ids. */
export const decisionWithMatchIdAsSupport: Decision = {
  ...base,
  rule: 'RN-02',
  // @ts-expect-error a MatchId is not an ObservationId; branding keeps them apart.
  supporting_observation_ids: [MATCH_ID],
};

describe('CA-3 — RN-12 at the type level', () => {
  test('a well-formed Decision keeps its exact field types', () => {
    const decision: Decision = {
      ...base,
      rule: 'RN-02',
      supporting_observation_ids: [OBSERVATION_ID],
    };

    expectTypeOf(decision.rule).not.toBeAny();
    expectTypeOf(decision.rule).toExtend<`RN-${string}`>();
    expectTypeOf(decision.supporting_observation_ids[0]).toEqualTypeOf<ObservationId>();
  });
});
