/**
 * CA-19 (RN-12, scope of `rule`, type level) — a Decision can only cite a rule
 * of the ENGINE.
 *
 * `dominio.md` defines `rule` as «la regla **del motor** (RN-xx) que produjo una
 * Decision», and `reglas.md` splits RN-01..RN-07 («Motor de decisiones») from
 * RN-08..RN-13 («Invariantes del proyecto»). None of the invariants can produce
 * a Decision, so `rule: 'RN-13'` is fake traceability: it satisfies CA-3 and
 * says nothing.
 *
 * Inverted tests: if the enum widens back to thirteen, the directives below
 * become unused and `tsc` fails with "Unused '@ts-expect-error' directive".
 */
import { describe, expect, test } from 'vitest';
import type { Decision, MatchId, ObservationId } from '@/model';
import { DECISION_RULES } from '@/model';

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

/** RN-13 is an invariant of the project, not a rule the engine can apply. */
export const decisionCitingAnInvariant: Decision = {
  ...base,
  supporting_observation_ids: [OBSERVATION_ID],
  // @ts-expect-error 'RN-13' is an invariant (reglas.md §Invariantes), not an engine rule.
  rule: 'RN-13',
};

/** And a rule that does not exist at all is still not a rule. */
export const decisionCitingNothing: Decision = {
  ...base,
  supporting_observation_ids: [OBSERVATION_ID],
  // @ts-expect-error 'RN-99' is not in reglas.md at all.
  rule: 'RN-99',
};

describe('CA-19 — the engine vocabulary is closed', () => {
  test('DECISION_RULES has exactly the seven rules of the engine', () => {
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
