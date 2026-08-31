/**
 * CA-8 — adelanto, retraso y empate, con la tolerancia declarada.
 *
 * τ = 90 s is a declared hypothesis, not truth: at one capture per minute
 * (RN-11) two unsynchronised sources can look 60 s apart purely from the phase
 * of their sampling, and 30 s more absorb network latency and cron jitter.
 * The boundary cases are written out one by one because a `>=` where the spec
 * says `>` moves every 90-second observation from *empate* to *adelanto*, and
 * an adelanto is the one signal that proves independence.
 */
import { describe, expect, test } from 'vitest';
import { TAU_MS, classifyLead, comparePair } from '@/mirror/analysis/compare';
import { verdictAgainstReference } from '@/mirror/analysis/verdict';
import { buildFixture, everyMinute, merge, plan } from '../support/archive';
import { CEROACERO, FUTGAL } from '../support/targets';
import type { Cell, Shot } from '../support/archive';

const live = (home: number, away: number): Omit<Cell, 'id'> => ({
  status: 'live',
  home_score: home,
  away_score: away,
});

const AT = (seconds: number) =>
  new Date(Date.UTC(2026, 8, 5, 17, 0, seconds)).toISOString();

describe('CA-8 — la tolerancia declarada', () => {
  test('1. τ vale 90 s y viaja en el informe', () => {
    expect(TAU_MS).toBe(90_000);
  });

  test('2. B llega 91 s antes que A: adelanto de B', () => {
    expect(classifyLead(AT(91), AT(0)).classification).toBe('lead_b');
  });

  test('3. B llega 90 s antes que A: empate, porque el criterio es estrictamente mayor', () => {
    expect(classifyLead(AT(90), AT(0)).classification).toBe('tie');
  });

  test('4. B llega 89 s antes que A: empate', () => {
    expect(classifyLead(AT(89), AT(0)).classification).toBe('tie');
  });

  test('5. A llega 91 s antes que B: retraso de B', () => {
    expect(classifyLead(AT(0), AT(91)).classification).toBe('lead_a');
  });

  test('6. A llega 90 s antes que B: empate', () => {
    expect(classifyLead(AT(0), AT(90)).classification).toBe('tie');
  });

  test('7. A llega 89 s antes que B: empate', () => {
    expect(classifyLead(AT(0), AT(89)).classification).toBe('tie');
  });

  test('8. simultáneos: empate, y la diferencia observada es 0', () => {
    const result = classifyLead(AT(0), AT(0));

    expect(result.classification).toBe('tie');
    expect(result.difference_ms).toBe(0);
  });

  test('9. first_seen indefinido en B: el evento es exclusivo de A, no un adelanto', () => {
    const result = classifyLead(AT(0), null);

    expect(result.classification).toBe('only_a');
    expect(result.difference_ms).toBeNull();
  });

  test('10. first_seen indefinido en A: exclusivo de B', () => {
    expect(classifyLead(null, AT(0)).classification).toBe('only_b');
  });

  test('11. indefinido en las dos: el evento no existe para este par', () => {
    expect(classifyLead(null, null).classification).toBe('neither');
  });

  test('12. la diferencia observada se registra con signo: positiva cuando B adelanta', () => {
    expect(classifyLead(AT(120), AT(0)).difference_ms).toBe(120_000);
    expect(classifyLead(AT(0), AT(120)).difference_ms).toBe(-120_000);
  });
});

/**
 * The frontier of τ, exercised END TO END and not only over `classifyLead`.
 *
 * The cases above pin the arithmetic of the function; these two pin what the
 * arithmetic is FOR. Every other fixture in the suite puts its adelantos
 * minutes apart, so a `>` turned into a `>=` anywhere between `analyze()` and
 * the verdict would only be caught by the unit cases above (F-SPEC-002-20).
 *
 * Two windows that differ by ONE second on the same two matches: at exactly
 * τ nothing moved out of step and the sincronía of CA-10 makes it ESPEJO; one
 * second more and the two adelantos of CA-9 make it INDEPENDIENTE, with the
 * RN-02 flag flipping with it. That is the whole weight the boundary carries.
 */
describe('CA-8 — la frontera de τ, de punta a punta', () => {
  /**
   * A window where the candidate publishes the goal of two matches exactly
   * `gapSeconds` before futgal, and agrees with it about everything else.
   *
   * futgal samples at 0, 60, …; the candidate at an offset chosen so that its
   * capture showing the goal falls exactly `gapSeconds` before futgal's. The
   * offset is under a minute, so the two grids are two sources of the same
   * window sampled out of phase — which is precisely the situation τ exists to
   * absorb.
   */
  async function windowWithGap(gapSeconds: number) {
    const CHANGE_AT_S = 360;
    const offset = (CHANGE_AT_S - gapSeconds) % 60;

    const goal = (id: string, from: number, changeAt: number): readonly Shot[] =>
      everyMinute(
        id,
        Array.from({ length: 10 }, (_unused, minute) =>
          minute < changeAt ? live(0, 0) : live(1, 0),
        ),
        { from },
      );
    const still = (id: string, from: number): readonly Shot[] =>
      everyMinute(
        id,
        Array.from({ length: 10 }, () => live(0, 0)),
        { from },
      );
    const filler = (from: number) =>
      Array.from({ length: 8 }, (_unused, i) => still(`p${i}`, from));

    const futgal = merge(goal('t1', 0, 6), goal('t2', 0, 6), ...filler(0));
    const candidate = merge(
      goal('t1', offset, 4),
      goal('t2', offset, 4),
      ...filler(offset),
    );

    const fixture = await buildFixture(plan([FUTGAL, futgal], [CEROACERO, candidate]));
    const analysis = comparePair(fixture.timeline, FUTGAL, CEROACERO);
    return { analysis, verdict: verdictAgainstReference(analysis) };
  }

  test('13. a 90 s exactos no hay adelanto, y el veredicto no es INDEPENDIENTE', async () => {
    const { analysis, verdict } = await windowWithGap(90);

    expect(analysis.observed_differences_ms).toContain(90_000);
    expect(analysis.n_comparable).toBeGreaterThanOrEqual(10);
    expect(analysis.leads_b).toBe(0);
    expect(analysis.leads_a).toBe(0);
    expect(verdict.verdict).not.toBe('INDEPENDIENTE');
    expect(verdict.rn02_segunda_via_entre_automaticas).toBe(false);
  });

  test('14. un segundo más — 91 s — son dos adelantos en dos partidos: INDEPENDIENTE', async () => {
    const { analysis, verdict } = await windowWithGap(91);

    expect(analysis.observed_differences_ms).toContain(91_000);
    expect(analysis.leads_b).toBe(2);
    expect(analysis.lead_matches_b).toBe(2);
    expect(verdict.verdict).toBe('INDEPENDIENTE');
    expect(verdict.reason).toBe('adelantos');
    expect(verdict.rn02_segunda_via_entre_automaticas).toBe(true);
  });
});
