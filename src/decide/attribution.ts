/**
 * RN-12: which of the concurrent rules is recorded in `rule` (SPEC-013 CA-9).
 *
 * The rules of the engine are satisfied at once — a `scheduled → live`
 * transition with a single source of 0.8 satisfies RN-06 AND RN-03 — and
 * `rule` is ONE (`dominio.md`). RN-12 says which: THE DECISIVE ONE, the one
 * whose effect is not recoverable from the rest of the row, with the tie-break
 * written in the rule itself and copied here in its order and nowhere else.
 *
 *   1. RN-01 — why the operator won a tie is in no other column.
 *   2. RN-04 — why a scoreboard was allowed to go down, or a retained jump was
 *      released, is in no other column.
 *   3. RN-07 — silence is in no other column but as a gap between `decided_at`,
 *      which is an inference and not a record.
 *   4. RN-06 — the `status` change is recoverable by comparing with the
 *      previous `Decision`, so it yields to the three above.
 *   5. RN-02 / RN-03 — the floor, and WHICH of the two is already in the
 *      `provisional` column. They never concur (RN-03 is RN-02's negation),
 *      so this rung needs no internal tie-break.
 *
 * RN-05 IS NOT IN THE ORDER, AND THIS SPEC DECLARES WHY: it does not emit.
 * When a discrepancy is a conflict there is no `Decision` (CA-6.2); during the
 * grace, when it is not one yet, what gets published is attributed by the
 * normal order — RN-02/RN-03, or RN-06 if the status also moved (CA-6.3). And
 * a discrepancy the operator takes part in routes to rung 1 and is recorded as
 * RN-01 (RN-12, salvedad de RN-05). That closes the errand RN-12 left to the
 * engine's spec: «si la spec del motor llega a definir una `Decision` para la
 * retención, es ella quien tiene que decir dónde entra RN-05». It does not
 * define one, so it does not enter.
 */
import type { DecisionRule } from '@/model/decision';

/** What the reducer observed about the `Decision` it is about to emit. */
export interface AttributionInput {
  /** Rung 1: the Decision settles a discrepancy by the operator's precedence. */
  readonly operatorPrecedence: boolean;
  /** Rung 2: it lowers a scoreboard, or releases a retained jump of > 2 goals. */
  readonly monotonicity: boolean;
  /** Rung 3: it announces the silence of RN-07. */
  readonly silence: boolean;
  /** Rung 4: it changes the `status`. */
  readonly statusChanged: boolean;
  /** Rung 5: the floor, and which of the two is the `provisional` column. */
  readonly provisional: boolean;
}

/**
 * The four rungs above the floor, in order, EXPORTED so the order is one
 * declaration and not a chain of `if`s a reader has to reconstruct.
 *
 * The floor is not here because it is not a rung with a condition: it is what
 * is left, and which of its two values applies is the `provisional` column.
 */
export const ATTRIBUTION_ORDER = ['RN-01', 'RN-04', 'RN-07', 'RN-06'] as const;

const CONDITIONS: Readonly<Record<(typeof ATTRIBUTION_ORDER)[number], keyof AttributionInput>> = {
  'RN-01': 'operatorPrecedence',
  'RN-04': 'monotonicity',
  'RN-07': 'silence',
  'RN-06': 'statusChanged',
};

/** The decisive rule of a `Decision`. Always one of the closed seven. */
export function attribute(input: AttributionInput): DecisionRule {
  for (const rule of ATTRIBUTION_ORDER) {
    if (input[CONDITIONS[rule]]) return rule;
  }
  // The floor. Always one of the two, never both, never neither: RN-03 is the
  // negation of RN-02 and `provisional` is the column that already says which.
  return input.provisional ? 'RN-03' : 'RN-02';
}
