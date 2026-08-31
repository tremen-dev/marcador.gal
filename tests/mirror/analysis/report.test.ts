/**
 * CA-13 — veredicto accionable, no log. Y el parcial es un veredicto.
 *
 * Two things are being defended here. The first is parity: the schema is
 * strict in both directions, so a key too many fails exactly like a key
 * missing (the discipline of SPEC-001 CA-14). The second is that a report with
 * the content half `completa` and the temporal half `pendiente` is VALID and
 * actionable — if the schema demanded the temporal counters, the day-2 report
 * could not be emitted at all, and the whole two-halves plan of §Diseño 4 would
 * be undeliverable.
 */
import { describe, expect, test } from 'vitest';
import { MirrorReportSchema } from '@/mirror/analysis/report';
import { N_MIN, TAU_MS } from '@/mirror/thresholds';
import { analyseFixture } from '../support/report';
import { atRest, bothIndependentPlan, lockstepPlan, merge, padding } from '../support/plans';
import { plan } from '../support/archive';
import { CEROACERO, FUTGAL, RESULTADOS } from '../support/targets';

describe('CA-13 — el informe valida contra su esquema', () => {
  test('1. el JSON de un fixture valida', async () => {
    const { report } = await analyseFixture(lockstepPlan());

    expect(MirrorReportSchema.safeParse(report).success).toBe(true);
  });

  test('2. una clave de más lo invalida, igual que una de menos', async () => {
    const { report } = await analyseFixture(lockstepPlan());

    expect(MirrorReportSchema.safeParse({ ...report, sobra: 1 }).success).toBe(false);

    const { thresholds: _dropped, ...missing } = report;
    expect(MirrorReportSchema.safeParse(missing).success).toBe(false);
  });

  test('3. lleva los umbrales usados, para poder recalcular sin volver a capturar', async () => {
    const { report } = await analyseFixture(lockstepPlan());

    expect(report.thresholds.tau_ms).toBe(TAU_MS);
    expect(report.thresholds.n_min).toBe(N_MIN);
    expect(report.thresholds.min_lead_events).toBe(2);
    expect(report.thresholds.min_lead_matches).toBe(2);
    expect(report.thresholds.min_lead_events_each_direction).toBe(2);
    expect(report.thresholds.persistent_discrepancy_captures).toBe(3);
  });

  test('4. lleva la ventana y la cobertura por par', async () => {
    const { report } = await analyseFixture(lockstepPlan());

    expect(report.window.start).not.toBeNull();
    expect(report.window.end).not.toBeNull();
    expect(report.window.valid).toBe(true);
    expect(report.window.coverage).toHaveLength(3);
    expect(report.window.coverage[0]!.ratio).toBe(1);
  });

  test('5. hay un veredicto por candidata y uno para el par (CA-15)', async () => {
    const { report } = await analyseFixture(lockstepPlan());

    expect(report.sources.map((source) => source.source)).toEqual([CEROACERO, RESULTADOS]);
    expect(report.pair.sources).toEqual([CEROACERO, RESULTADOS]);
  });

  test('6. cada fuente lleva un párrafo en prosa que dice qué se hace', async () => {
    const { report } = await analyseFixture(lockstepPlan());

    for (const source of report.sources) {
      expect(source.prose.length).toBeGreaterThan(80);
      expect(source.prose).toContain('RN-02');
    }
  });

  test('7. lleva el reparto de diferencias observadas junto a τ (CA-8)', async () => {
    const { report } = await analyseFixture(bothIndependentPlan());

    const temporal = report.sources[0]!.counters.temporal;
    expect(temporal).not.toBeNull();
    expect(temporal!.observed_differences_s.length).toBeGreaterThan(0);
  });
});

describe('CA-13 — el veredicto parcial es un veredicto', () => {
  /** A day-2 window: no match is played, so nothing ever changes value. */
  const dayTwo = () => {
    const shots = merge(
      ...Array.from({ length: 12 }, (_unused, i) => atRest(`m${i}`, '17:00', 4)),
    );
    return plan([FUTGAL, shots], [CEROACERO, shots], [RESULTADOS, shots]);
  };

  test('8. un fixture solo de contenido valida, dicta veredicto y marca la temporal pendiente', async () => {
    const { report } = await analyseFixture(dayTwo(), {
      temporalWindow: 'xornada do 12-09-2026',
    });

    expect(MirrorReportSchema.safeParse(report).success).toBe(true);
    expect(report.halves.content).toBe('completa');
    expect(report.halves.temporal).toBe('pendiente');
    expect(report.halves.planned_temporal_window).toBe('xornada do 12-09-2026');
    for (const source of report.sources) {
      expect(source.counters.temporal).toBeNull();
      expect(['ESPEJO', 'INDEPENDIENTE', 'INCONCLUSO']).toContain(source.verdict);
    }
  });

  test('9. sin partidos en vivo, la ausencia de adelantos no dicta ESPEJO', async () => {
    const { report } = await analyseFixture(dayTwo());

    // §Diseño 4: with no live matches the day-2 outcome is INCONCLUSO, which
    // by CA-12 is treated as espejo anyway. Dictating ESPEJO here would be
    // claiming a measurement the window could not make.
    for (const source of report.sources) expect(source.verdict).toBe('INCONCLUSO');
  });

  test('10. con la mitad temporal completa, el informe no nombra ventana pendiente', async () => {
    const { report } = await analyseFixture(bothIndependentPlan());

    expect(report.halves.temporal).toBe('completa');
    expect(report.halves.planned_temporal_window).toBeNull();
  });
});

describe('CA-13 — advertencia obligatoria sobre la métrica de conflictos', () => {
  test('11. si ninguna candidata sale INDEPENDIENTE, la advertencia viaja en el JSON y en la prosa', async () => {
    const { report } = await analyseFixture(lockstepPlan());

    expect(report.sources.every((source) => source.verdict !== 'INDEPENDIENTE')).toBe(true);
    expect(report.conflict_metric_warning).not.toBeNull();
    expect(report.conflict_metric_warning!.hard_cut_15_percent_applies).toBe(false);
    expect(report.conflict_metric_warning!.text).toContain('15');
    expect(report.prose).toContain('15 %');
  });

  test('12. si una candidata sale INDEPENDIENTE, no hay advertencia', async () => {
    const { report } = await analyseFixture(bothIndependentPlan());

    expect(report.sources.some((source) => source.verdict === 'INDEPENDIENTE')).toBe(true);
    expect(report.conflict_metric_warning).toBeNull();
  });

  test('13. una sola candidata independiente basta para que el corte siga aplicando', async () => {
    // ceroacero sustains a different kickoff for the whole window; the other
    // candidate agrees with futgal throughout.
    const { report } = await analyseFixture(
      plan(
        [FUTGAL, merge(padding(5), atRest('x', '17:00'))],
        [CEROACERO, merge(padding(5), atRest('x', '18:00'))],
        [RESULTADOS, merge(padding(5), atRest('x', '17:00'))],
      ),
    );

    expect(report.sources.find((source) => source.source === CEROACERO)!.verdict).toBe(
      'INDEPENDIENTE',
    );
    expect(report.conflict_metric_warning).toBeNull();
  });
});
