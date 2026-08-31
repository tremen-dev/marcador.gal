/**
 * CA-14 (RN-12, por analogía) — cada afirmación del veredicto cita sus capturas.
 *
 * The same demand RN-12 puts on a `Decision` — the rule and the observations
 * that sustain it — applied to the artefact that is going to decide the shape
 * of the engine. A verdict that cannot be audited against the archive is an
 * opinion with JSON formatting.
 */
import { describe, expect, test } from 'vitest';
import { analyseFixture } from '../support/report';
import { goalAt, merge, padding, plan, transientError } from '../support/plans';
import { CEROACERO, FUTGAL, RESULTADOS } from '../support/targets';
import type { MirrorReport } from '@/mirror/analysis/report';

/** One window with leads, exclusive content AND a replicated error. */
const rich = () => {
  const futgal = merge(goalAt('m1', 6), goalAt('m2', 6), transientError('e1', 2), padding(4));
  const candidate = merge(
    goalAt('m1', 3),
    goalAt('m2', 3),
    transientError('e1', 3),
    padding(4),
    goalAt('solo-de-s', 5),
  );
  return plan([FUTGAL, futgal], [CEROACERO, candidate], [RESULTADOS, candidate]);
};

/** Every key the report cites, anywhere. */
function citedKeys(report: MirrorReport): readonly string[] {
  const blocks = [...report.sources.map((source) => source.evidence), report.pair.evidence];
  return blocks.flatMap((evidence) => [
    ...evidence.leads.flatMap((item) => item.raw_keys),
    ...evidence.exclusives.flatMap((item) => item.raw_keys),
    ...evidence.replicated_errors.flatMap((item) => item.raw_keys),
    ...evidence.persistent_discrepancies.flatMap((item) => item.raw_keys),
  ]);
}

describe('CA-14 — las citas existen en el archivo', () => {
  test('1. toda clave citada devuelve algo con store.get()', async () => {
    const { fixture, report } = await analyseFixture(rich());
    const keys = citedKeys(report);

    for (const key of keys) {
      expect(await fixture.store.get(key), `clave colgada: ${key}`).not.toBeNull();
    }
  });

  test('2. el recorrido mide algo: hay citas de los tres tipos', async () => {
    const { report } = await analyseFixture(rich());
    const evidence = report.sources[0]!.evidence;

    expect(evidence.leads.length).toBeGreaterThan(0);
    expect(evidence.exclusives.length).toBeGreaterThan(0);
    expect(evidence.replicated_errors.length).toBeGreaterThan(0);
    expect(citedKeys(report).length).toBeGreaterThan(10);
  });

  test('3. cada adelanto cita las dos capturas que lo sostienen', async () => {
    const { report } = await analyseFixture(rich());

    for (const lead of report.sources[0]!.evidence.leads) {
      expect(lead.raw_keys).toHaveLength(2);
      expect(lead.first_seen_a).not.toBeNull();
      expect(lead.first_seen_b).not.toBeNull();
    }
  });

  test('4. cada error replicado cita exactamente cuatro capturas', async () => {
    const { report } = await analyseFixture(rich());

    for (const error of report.sources[0]!.evidence.replicated_errors) {
      expect(error.raw_keys).toHaveLength(4);
      expect(new Set(error.raw_keys).size).toBe(4);
    }
  });

  test('5. una clave inventada NO pasa la comprobación: el test sabe fallar', async () => {
    const { fixture } = await analyseFixture(rich());

    expect(
      await fixture.store.get('futgal/rfef-tercera-g1/2026-09-05/2026-09-05t17-00-00.000z-ffffffffffff.html'),
    ).toBeNull();
  });
});
