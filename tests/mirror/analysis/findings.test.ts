/**
 * El documento de hallazgo (CA-13, *Dónde vive*).
 *
 * The prose is generated, never typed: a paragraph written after reading the
 * numbers is not repeatable (CA-7) and cannot be audited against the archive
 * (CA-14). This checks that the document actually carries the three things the
 * criterion demands — the verdicts, the thresholds used, and the warning when
 * it applies — and that it is as deterministic as the JSON it accompanies.
 */
import { describe, expect, test } from 'vitest';
import { FINDINGS_JSON, FINDINGS_MARKDOWN, renderFindings } from '@/mirror/analysis/findings';
import { analyseFixture } from '../support/report';
import { bothIndependentPlan, lockstepPlan } from '../support/plans';

describe('el documento de hallazgo', () => {
  test('1. vive donde CA-13 dice', () => {
    expect(FINDINGS_MARKDOWN).toBe(
      'docs/epicas/EPIC-001-spike-ingesta/hallazgos/test-de-espejo.md',
    );
    expect(FINDINGS_JSON).toBe(
      'docs/epicas/EPIC-001-spike-ingesta/hallazgos/test-de-espejo.json',
    );
  });

  test('2. lleva los tres veredictos y la bandera de RN-02', async () => {
    const { report } = await analyseFixture(lockstepPlan());
    const document = renderFindings(report);

    for (const source of report.sources) expect(document).toContain(String(source.source));
    expect(document).toContain('rn02_segunda_via_entre_automaticas');
    expect(document).toContain('CA-15');
  });

  test('3. lleva los umbrales usados, para recalcular sin volver a capturar', async () => {
    const { report } = await analyseFixture(lockstepPlan());
    const document = renderFindings(report);

    expect(document).toContain('τ = 90 s');
    expect(document).toContain('N_min = 10');
  });

  test('4. lleva la advertencia de la métrica de conflictos cuando aplica', async () => {
    const mirrored = renderFindings((await analyseFixture(lockstepPlan())).report);
    const independent = renderFindings((await analyseFixture(bothIndependentPlan())).report);

    expect(mirrored).toContain('Advertencia sobre la métrica de conflictos');
    expect(mirrored).toContain('15 %');
    expect(independent).not.toContain('Advertencia sobre la métrica de conflictos');
  });

  test('5. es tan determinista como el JSON', async () => {
    const first = await analyseFixture(lockstepPlan());
    const second = await analyseFixture(lockstepPlan());

    expect(renderFindings(second.report)).toBe(renderFindings(first.report));
  });

  test('6. avisa de que está generado, para que nadie lo edite a mano', async () => {
    const { report } = await analyseFixture(lockstepPlan());

    expect(renderFindings(report)).toContain('generado');
  });
});
