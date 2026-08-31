/**
 * CA-12 (RN-02) — lo desconocido no es independencia.
 *
 * Not a policy choice: RN-02's second route demands two *independent* sources,
 * and a source whose independence has not been demonstrated does not satisfy
 * the precondition. The cost is asymmetric — a provisional too many costs
 * little (RN-03: "mejor provisional a tiempo"); a *confirmado* that turns out
 * to be a rumour repeated twice costs the project.
 *
 * The name of the key is deliberate: the flag is about the AUTOMATIC sources.
 * The corresponsal weighs 0.8, which is ≥ 0.7, and a person in the ground is
 * independent of any scraper by construction, so (aggregator, corresponsal)
 * pairs keep satisfying the second route. This spec does not measure the
 * corresponsal and does not deny it.
 */
import { describe, expect, test } from 'vitest';
import { verdictAgainstReference } from '@/mirror/analysis/verdict';
import { analyseFixture } from '../support/report';
import {
  atRest,
  bothIndependentPlan,
  lockstepPlan,
  merge,
  mutualLeadsPlan,
  padding,
  plan,
} from '../support/plans';
import { transientError } from '../support/plans';
import { CEROACERO, FUTGAL, RESULTADOS } from '../support/targets';
import type { PairAnalysis } from '@/mirror/analysis/compare';

/** The three verdicts, produced by three different windows. */
const espejo = () => {
  const futgal = merge(transientError('m1', 2), padding(5));
  const candidate = merge(transientError('m1', 3), padding(5));
  return plan([FUTGAL, futgal], [CEROACERO, candidate], [RESULTADOS, candidate]);
};

const inconcluso = () => {
  const shots = merge(padding(4), atRest('c1', '17:00'));
  return plan([FUTGAL, shots], [CEROACERO, shots], [RESULTADOS, shots]);
};

describe('CA-12 — la tabla sobre los tres veredictos', () => {
  test('1. INDEPENDIENTE → rn02_segunda_via_entre_automaticas = true', async () => {
    const { report } = await analyseFixture(bothIndependentPlan());

    for (const source of report.sources) {
      expect(source.verdict).toBe('INDEPENDIENTE');
      expect(source.rn02_segunda_via_entre_automaticas).toBe(true);
    }
  });

  test('2. ESPEJO → false', async () => {
    const { report } = await analyseFixture(espejo());

    for (const source of report.sources) {
      expect(source.verdict).toBe('ESPEJO');
      expect(source.rn02_segunda_via_entre_automaticas).toBe(false);
    }
  });

  test('3. INCONCLUSO → false', async () => {
    const { report } = await analyseFixture(inconcluso());

    for (const source of report.sources) {
      expect(source.verdict).toBe('INCONCLUSO');
      expect(source.rn02_segunda_via_entre_automaticas).toBe(false);
    }
  });

  test('4. el par de candidatas lleva la misma bandera con la misma regla (CA-15)', async () => {
    // Three windows, and each verdict is pinned FIRST. Comparing two fields of
    // the same object holds for any verdict at all, so on its own it does not
    // fix that these plans come out where they come out (F-SPEC-002-20).
    const mirrored = await analyseFixture(lockstepPlan());
    expect(mirrored.report.pair.verdict).toBe('ESPEJO');
    expect(mirrored.report.pair.rn02_segunda_via_entre_automaticas).toBe(false);

    // The hole CA-15 exists to close, and it is real: in
    // `bothIndependentPlan()` the two candidates ARE independent of futgal —
    // both lead it — but they are mirrors OF EACH OTHER, so the pair does not
    // open the second route however independent the two crossings look.
    const holeInRn02 = await analyseFixture(bothIndependentPlan());
    for (const source of holeInRn02.report.sources) {
      expect(source.rn02_segunda_via_entre_automaticas).toBe(true);
    }
    expect(holeInRn02.report.pair.verdict).toBe('ESPEJO');
    expect(holeInRn02.report.pair.rn02_segunda_via_entre_automaticas).toBe(false);

    // And the pair does say `true` when it has earned it: each candidate leads
    // the other in two matches (CA-15.1).
    const mutual = await analyseFixture(mutualLeadsPlan());
    expect(mutual.report.pair.verdict).toBe('INDEPENDIENTE');
    expect(mutual.report.pair.rn02_segunda_via_entre_automaticas).toBe(true);
  });

  test('5. la bandera no tiene ninguna otra rama: es exactamente el veredicto', () => {
    // Walked directly over the decision function, so no fixture can hide a
    // fourth branch that says `true` for something that is not INDEPENDIENTE.
    const analysis = (overrides: Partial<PairAnalysis>): PairAnalysis =>
      ({
        a: FUTGAL,
        b: CEROACERO,
        events: [],
        n_comparable: 20,
        leads_a: 0,
        leads_b: 0,
        lead_matches_a: 0,
        lead_matches_b: 0,
        ties: 20,
        exclusives_a: 0,
        exclusives_b: 0,
        replicated_errors: [],
        persistent_discrepancies: [],
        spelling_divergences: [],
        observed_differences_ms: [],
        temporal_half: 'completa',
        ...overrides,
      }) as PairAnalysis;

    const cases = [
      analysis({}),
      analysis({ n_comparable: 3 }),
      analysis({ leads_b: 5, lead_matches_b: 3 }),
      analysis({ exclusives_b: 4 }),
      analysis({ leads_a: 4, lead_matches_a: 3 }),
    ];

    for (const input of cases) {
      const result = verdictAgainstReference(input);
      expect(result.rn02_segunda_via_entre_automaticas).toBe(result.verdict === 'INDEPENDIENTE');
    }
  });
});
