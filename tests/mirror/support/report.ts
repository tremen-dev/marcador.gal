/**
 * Runs the whole of phase B over a fixture archive, the way the CLI will run
 * it over the real window: three sources, one pairing file, one report.
 */
import { analyze } from '@/mirror/analysis/analyze';
import { buildFixture } from './archive';
import { CEROACERO, FUTGAL, RESULTADOS } from './targets';
import type { Plan } from './archive';
import type { MirrorReport } from '@/mirror/analysis/report';
import type { Fixture } from './archive';

export interface AnalysedFixture {
  readonly fixture: Fixture;
  readonly report: MirrorReport;
}

export async function analyseFixture(
  plan: Plan,
  options: { readonly temporalWindow?: string } = {},
): Promise<AnalysedFixture> {
  const fixture = await buildFixture(plan);
  const report = await analyze({
    store: fixture.store,
    keys: fixture.keys,
    log: fixture.log,
    extractors: fixture.extractors,
    pairing: fixture.pairing,
    reference: FUTGAL,
    candidates: [CEROACERO, RESULTADOS],
    ...(options.temporalWindow === undefined
      ? {}
      : { temporalWindow: options.temporalWindow }),
  });

  return { fixture, report };
}
