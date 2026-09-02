/**
 * The four qualifiers, DERIVED (SPEC-013 CA-10, ADR-021 §6, SPEC-001 CA-8).
 *
 * `decisions` gains no column and `src/model/` does not change: migration 0003
 * already wrote that the tables of the canonical model get no new columns, and
 * SPEC-001 is `hecho`. Everything the four need is already in the row and in
 * the observations that sustain it, so the qualifier is a pure and TOTAL
 * function over what is written, and never a fifth stored truth that can drift
 * from the four columns beside it.
 *
 * The order is ADR-021 §6's, and it is an order and not a set of independent
 * branches:
 *
 *   1. `sen_sinal` — the live `Decision` has `rule: 'RN-07'`. That is not a
 *      trick: `rule` is «la regla del motor que produjo una Decision», and a
 *      Decision produced by the silence was produced by RN-07.
 *   2. `pendente_de_confirmar` — `finished` and NO supporting observation says
 *      `finished`: the end was reached by RN-06's timeout, not because a
 *      source closed the match.
 *   3. `provisional` — RN-03.
 *   4. `confirmado` — RN-02.
 *
 * IT DOES NOT ERASE `provisional`. The column stays and is read beside it: a
 * match can be *sen sinal* AND provisional at once, and how the interface
 * shows the two is the interface's decision (ADR-013), not this function's.
 *
 * KNOWN COUPLING, written where it bites (ADR-021 §Consecuencias negativas):
 * deriving *sen sinal* from `rule: 'RN-07'` ties this function to RN-12's
 * tie-break order. If RN-12 ever changes so that a silence `Decision` stops
 * recording RN-07, this breaks IN SILENCE. What wakes it is any change to
 * `src/decide/attribution.ts`, whose module comment carries the same warning.
 */
import type { Decision } from '@/model/decision';
import type { Observation } from '@/model/observation';
import type { MatchQualifier } from '@/model/qualifier';

/**
 * The qualifier of the live `Decision`, given the observations that support
 * it. Total: it returns one of the four for every input and never throws.
 */
export function qualifierOf(
  decision: Decision,
  supporting: readonly Observation[],
): MatchQualifier {
  if (decision.rule === 'RN-07') return 'sen_sinal';

  if (
    decision.status === 'finished' &&
    !supporting.some((observation) => observation.status === 'finished')
  ) {
    return 'pendente_de_confirmar';
  }

  return decision.provisional ? 'provisional' : 'confirmado';
}
