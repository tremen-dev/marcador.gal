/**
 * CA-9 — un adelanto prueba independencia; la ausencia de adelantos no prueba nada.
 *
 * Case (c) is the heart of the criterion and the reason the whole spec is
 * shaped the way it is: a source that is independent but SLOWER produces
 * exactly the same signal as a mirror — it never leads. Calling that ESPEJO
 * would be inventing, so it is INCONCLUSO, and INCONCLUSO is an honest result,
 * not a failure of the test.
 */
import { describe, expect, test } from 'vitest';
import { comparePair } from '@/mirror/analysis/compare';
import { verdictAgainstReference } from '@/mirror/analysis/verdict';
import { MIN_LEAD_EVENTS, MIN_LEAD_MATCHES } from '@/mirror/thresholds';
import { buildFixture, everyMinute, merge, plan } from '../support/archive';
import { CEROACERO, FUTGAL } from '../support/targets';
import type { Cell, Shot } from '../support/archive';

const live = (home: number, away: number): Omit<Cell, 'id'> => ({
  status: 'live',
  home_score: home,
  away_score: away,
});

/** A match that goes 0-0 → 1-0 at capture `changeAt`, over `length` captures. */
function goalAt(id: string, changeAt: number, length = 10): readonly Shot[] {
  return everyMinute(
    id,
    Array.from({ length }, (_unused, minute) => (minute < changeAt ? live(0, 0) : live(1, 0))),
  );
}

/** Matches both sources report identically, so N clears N_min (CA-11). */
function padding(count: number): readonly Shot[] {
  return merge(...Array.from({ length: count }, (_unused, i) => goalAt(`p${i}`, 5)));
}

async function analyse(futgal: readonly Shot[], candidate: readonly Shot[]) {
  const fixture = await buildFixture(plan([FUTGAL, futgal], [CEROACERO, candidate]));
  const analysis = comparePair(fixture.timeline, FUTGAL, CEROACERO);
  return { analysis, verdict: verdictAgainstReference(analysis) };
}

describe('CA-9 — el umbral declarado', () => {
  test('0. el mínimo es 2 eventos en 2 partidos distintos', () => {
    expect(MIN_LEAD_EVENTS).toBe(2);
    expect(MIN_LEAD_MATCHES).toBe(2);
  });

  test('(a) S adelanta 2 veces en 2 partidos → INDEPENDIENTE', async () => {
    const { analysis, verdict } = await analyse(
      merge(goalAt('m1', 5), goalAt('m2', 5), padding(4)),
      merge(goalAt('m1', 3), goalAt('m2', 3), padding(4)),
    );

    expect(analysis.leads_b).toBe(2);
    expect(analysis.lead_matches_b).toBe(2);
    expect(analysis.n_comparable).toBeGreaterThanOrEqual(10);
    expect(verdict.verdict).toBe('INDEPENDIENTE');
  });

  test('(b) S adelanta 2 veces en el MISMO partido → no INDEPENDIENTE', async () => {
    // Two leads, one match: a single badly parsed match must not be enough.
    const twoGoalsLate = everyMinute(
      'm1',
      Array.from({ length: 10 }, (_unused, minute) =>
        minute < 5 ? live(0, 0) : minute < 7 ? live(1, 0) : live(2, 0),
      ),
    );
    const twoGoalsEarly = everyMinute(
      'm1',
      Array.from({ length: 10 }, (_unused, minute) =>
        minute < 3 ? live(0, 0) : minute < 5 ? live(1, 0) : live(2, 0),
      ),
    );

    const { analysis, verdict } = await analyse(
      merge(twoGoalsLate, padding(5)),
      merge(twoGoalsEarly, padding(5)),
    );

    expect(analysis.leads_b).toBe(2);
    expect(analysis.lead_matches_b).toBe(1);
    expect(verdict.verdict).not.toBe('INDEPENDIENTE');
  });

  test('(c) S siempre 5 min por detrás, sin error replicado → NO es ESPEJO, es INCONCLUSO', async () => {
    const { analysis, verdict } = await analyse(
      merge(...Array.from({ length: 6 }, (_unused, i) => goalAt(`m${i}`, 5, 15))),
      merge(...Array.from({ length: 6 }, (_unused, i) => goalAt(`m${i}`, 10, 15))),
    );

    expect(analysis.leads_b).toBe(0);
    expect(analysis.leads_a).toBeGreaterThan(0);
    expect(analysis.replicated_errors).toHaveLength(0);
    expect(analysis.n_comparable).toBeGreaterThanOrEqual(10);
    expect(verdict.verdict).toBe('INCONCLUSO');
    expect(verdict.verdict).not.toBe('ESPEJO');
  });

  test('(d) un solo adelanto en un solo partido no basta', async () => {
    const { analysis, verdict } = await analyse(
      merge(goalAt('m1', 5), padding(5)),
      merge(goalAt('m1', 3), padding(5)),
    );

    expect(analysis.leads_b).toBe(1);
    expect(verdict.verdict).not.toBe('INDEPENDIENTE');
  });

  test('(e) 3 adelantos repartidos en 3 partidos → INDEPENDIENTE', async () => {
    const { verdict } = await analyse(
      merge(goalAt('m1', 5), goalAt('m2', 5), goalAt('m3', 5), padding(3)),
      merge(goalAt('m1', 3), goalAt('m2', 3), goalAt('m3', 3), padding(3)),
    );

    expect(verdict.verdict).toBe('INDEPENDIENTE');
  });
});
