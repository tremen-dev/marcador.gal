/**
 * CA-11 — la muestra insuficiente es un veredicto, no un silencio.
 *
 * N_min = 10 is a declared hypothesis: an hour of football over 8-9 matches
 * yields of the order of 15-25 events between goals and state transitions, and
 * below ten the distribution of leads is noise. It travels in the report next
 * to the N actually observed precisely so that, if the real window falls
 * short, the answer is to widen the window and not to lower the threshold.
 */
import { describe, expect, test } from 'vitest';
import { N_MIN } from '@/mirror/thresholds';
import { analyseFixture } from '../support/report';
import { constant, merge, padding, plan } from '../support/plans';
import { CEROACERO, FUTGAL, RESULTADOS } from '../support/targets';

/** 4 matches with two values each, plus one that never changes: N = 9. */
const nineEvents = () => {
  const shots = merge(padding(4), constant('c1'));
  return plan([FUTGAL, shots], [CEROACERO, shots], [RESULTADOS, shots]);
};

/** 5 matches with two values each: N = 10, exactly the floor. */
const tenEvents = () => {
  const shots = padding(5);
  return plan([FUTGAL, shots], [CEROACERO, shots], [RESULTADOS, shots]);
};

describe('CA-11 — el suelo de la muestra', () => {
  test('0. N_min vale 10', () => {
    expect(N_MIN).toBe(10);
  });

  test('1. con N = 9 el veredicto es INCONCLUSO por muestra insuficiente', async () => {
    const { report } = await analyseFixture(nineEvents());

    for (const source of report.sources) {
      expect(source.counters.n_comparable).toBe(9);
      expect(source.verdict).toBe('INCONCLUSO');
      expect(source.reason).toBe('muestra_insuficiente');
    }
  });

  test('2. el informe lleva el N observado y el N_min exigido', async () => {
    const { report } = await analyseFixture(nineEvents());

    expect(report.sources[0]!.counters.n_comparable).toBe(9);
    expect(report.sources[0]!.counters.n_min).toBe(10);
    expect(report.pair.counters.n_comparable).toBe(9);
    expect(report.pair.counters.n_min).toBe(10);
  });

  test('3. con N = 9 no se dicta ni ESPEJO ni INDEPENDIENTE', async () => {
    const { report } = await analyseFixture(nineEvents());

    for (const source of report.sources) {
      expect(source.verdict).not.toBe('ESPEJO');
      expect(source.verdict).not.toBe('INDEPENDIENTE');
    }
    expect(report.pair.verdict).toBe('INCONCLUSO');
  });

  test('4. con N = 10 sí se dicta veredicto', async () => {
    const { report } = await analyseFixture(tenEvents());

    for (const source of report.sources) {
      expect(source.counters.n_comparable).toBe(10);
      expect(source.reason).not.toBe('muestra_insuficiente');
      expect(source.verdict).not.toBe('INCONCLUSO');
    }
  });
});
