/**
 * CA-15 (RN-02) — el cruce de las dos candidatas entre sí.
 *
 * The hole this closes: if both candidates were independent of futgal but
 * mirrors OF EACH OTHER — two resales of the same third-party feed — the two
 * crossings against futgal would come out INDEPENDIENTE, RN-02 would look
 * applicable and it would not be. It is the only case that leaves RN-02
 * without a second route without anybody seeing it, and it costs one more
 * crossing over data already captured.
 *
 * The asymmetry of §Diseño 2 applies but changes shape, because neither of the
 * two is "the source": mutual independence demands that EACH lead the other —
 * four leads, not two. Leads in one direction only prove that the laggard is
 * not the origin of the leader, and then the laggard is its mirror.
 */
import { describe, expect, test } from 'vitest';
import { analyseFixture } from '../support/report';
import { constant, goalAt, merge, padding, plan, transientError } from '../support/plans';
import { CEROACERO, FUTGAL, RESULTADOS } from '../support/targets';

describe('CA-15 — independencia mutua', () => {
  test('(a) C1 y C2 se adelantan mutuamente 2 y 2 → INDEPENDIENTE ENTRE SÍ', async () => {
    const futgal = merge(
      goalAt('m1', 5),
      goalAt('m2', 5),
      goalAt('m3', 5),
      goalAt('m4', 5),
      padding(3),
    );
    const c1 = merge(goalAt('m1', 2), goalAt('m2', 2), goalAt('m3', 8), goalAt('m4', 8), padding(3));
    const c2 = merge(goalAt('m1', 8), goalAt('m2', 8), goalAt('m3', 2), goalAt('m4', 2), padding(3));

    const { report } = await analyseFixture(plan([FUTGAL, futgal], [CEROACERO, c1], [RESULTADOS, c2]));

    expect(report.pair.counters.temporal!.lead_matches_first).toBeGreaterThanOrEqual(2);
    expect(report.pair.counters.temporal!.lead_matches_second).toBeGreaterThanOrEqual(2);
    expect(report.pair.verdict).toBe('INDEPENDIENTE');
    expect(report.pair.reason).toBe('adelantos_mutuos');
    expect(report.pair.rn02_segunda_via_entre_automaticas).toBe(true);
  });

  test('(b) C1 adelanta a C2 cuatro veces y C2 nunca → no independiente; C2 es espejo de C1', async () => {
    const futgal = merge(
      goalAt('m1', 8),
      goalAt('m2', 8),
      goalAt('m3', 8),
      goalAt('m4', 8),
      padding(3),
    );
    const c1 = merge(goalAt('m1', 2), goalAt('m2', 2), goalAt('m3', 2), goalAt('m4', 2), padding(3));
    const c2 = futgal;

    const { report } = await analyseFixture(plan([FUTGAL, futgal], [CEROACERO, c1], [RESULTADOS, c2]));

    expect(report.pair.counters.temporal!.leads_first_over_second).toBe(4);
    expect(report.pair.counters.temporal!.leads_second_over_first).toBe(0);
    expect(report.pair.verdict).toBe('ESPEJO');
    expect(report.pair.reason).toBe('adelantos_en_una_sola_direccion');
    expect(report.pair.espejo_de).toBe(CEROACERO);
    expect(report.pair.rn02_segunda_via_entre_automaticas).toBe(false);
  });

  test('(c) un error replicado por las dos y ausente de futgal → origen común aguas arriba', async () => {
    const futgal = merge(constant('e1', 10), padding(5));
    const c1 = merge(transientError('e1', 2), padding(5));
    const c2 = merge(transientError('e1', 3), padding(5));

    const { report } = await analyseFixture(plan([FUTGAL, futgal], [CEROACERO, c1], [RESULTADOS, c2]));

    expect(report.pair.counters.replicated_errors_total).toBe(1);
    expect(report.pair.counters.replicated_errors_absent_from_reference).toBe(1);
    expect(report.pair.counters.replicated_errors_also_in_reference).toBe(0);
    expect(report.pair.origen_comun_distinto_de_futgal).toBe(true);
    expect(report.pair.verdict).toBe('ESPEJO');
    expect(report.pair.prose).toContain('aguas arriba');
  });

  test('(d) el mismo error replicado, pero presente también en futgal → la otra categoría', async () => {
    const futgal = merge(transientError('e1', 2), padding(5));
    const c1 = merge(transientError('e1', 2), padding(5));
    const c2 = merge(transientError('e1', 3), padding(5));

    const { report } = await analyseFixture(plan([FUTGAL, futgal], [CEROACERO, c1], [RESULTADOS, c2]));

    expect(report.pair.counters.replicated_errors_total).toBe(1);
    expect(report.pair.counters.replicated_errors_also_in_reference).toBe(1);
    expect(report.pair.counters.replicated_errors_absent_from_reference).toBe(0);
    expect(report.pair.origen_comun_distinto_de_futgal).toBe(false);
  });

  test('(e) muestra por debajo de N_min → INCONCLUSO, y el par no habilita la segunda vía', async () => {
    const shots = merge(padding(4), constant('c1'));

    const { report } = await analyseFixture(
      plan([FUTGAL, shots], [CEROACERO, shots], [RESULTADOS, shots]),
    );

    expect(report.pair.counters.n_comparable).toBeLessThan(10);
    expect(report.pair.verdict).toBe('INCONCLUSO');
    expect(report.pair.reason).toBe('muestra_insuficiente');
    expect(report.pair.rn02_segunda_via_entre_automaticas).toBe(false);
  });

  test('(f) el listón sube: 2 adelantos en una sola dirección no son independencia mutua', async () => {
    const futgal = merge(goalAt('m1', 5), goalAt('m2', 5), padding(4));
    const c1 = merge(goalAt('m1', 2), goalAt('m2', 2), padding(4));
    const c2 = futgal;

    const { report } = await analyseFixture(plan([FUTGAL, futgal], [CEROACERO, c1], [RESULTADOS, c2]));

    expect(report.pair.counters.temporal!.leads_first_over_second).toBe(2);
    expect(report.pair.verdict).not.toBe('INDEPENDIENTE');
  });

  /**
   * The pair has the same step 2 as the crossings against futgal, and it is
   * reached by its own route: mutual adelantos (the fuerte-independiente of
   * CA-15.1) concurring with a replicated error (CA-15.2). The decision rule
   * is total and ordered for the pair too, so the contradiction wins over the
   * mutual independence and by CA-12 the pair does NOT open RN-02's second
   * route.
   */
  test('(g) adelantos mutuos y error replicado a la vez → INCONCLUSO por señales contradictorias', async () => {
    const futgal = merge(
      goalAt('m1', 5),
      goalAt('m2', 5),
      goalAt('m3', 5),
      goalAt('m4', 5),
      constant('e1'),
      padding(3),
    );
    const c1 = merge(
      goalAt('m1', 2),
      goalAt('m2', 2),
      goalAt('m3', 8),
      goalAt('m4', 8),
      transientError('e1', 2),
      padding(3),
    );
    const c2 = merge(
      goalAt('m1', 8),
      goalAt('m2', 8),
      goalAt('m3', 2),
      goalAt('m4', 2),
      transientError('e1', 2),
      padding(3),
    );

    const { report } = await analyseFixture(plan([FUTGAL, futgal], [CEROACERO, c1], [RESULTADOS, c2]));

    // Both strong signals clear their declared minimum, in both directions.
    expect(report.pair.counters.temporal!.lead_matches_first).toBeGreaterThanOrEqual(2);
    expect(report.pair.counters.temporal!.lead_matches_second).toBeGreaterThanOrEqual(2);
    expect(report.pair.counters.replicated_errors_total).toBe(1);

    expect(report.pair.verdict).toBe('INCONCLUSO');
    expect(report.pair.reason).toBe('senales_contradictorias');
    expect(report.pair.rn02_segunda_via_entre_automaticas).toBe(false);
    // Not a mirror either: nobody is dictated the mirror of anybody.
    expect(report.pair.espejo_de).toBeNull();
    // The finding of CA-15.2 survives the INCONCLUSO: the verdict is undecided,
    // the evidence is not, and the four keys stay cited for a person to look at.
    expect(report.pair.origen_comun_distinto_de_futgal).toBe(true);
    expect(report.pair.evidence.replicated_errors[0]!.raw_keys).toHaveLength(4);
  });
});
