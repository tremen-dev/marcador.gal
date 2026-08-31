/**
 * The shape of the window SPEC-003 actually runs: **two** candidates and no
 * reference.
 *
 * `besoccer` and not `resultados-futbol` (ADR-008 §2): `resultados-futbol.com`
 * is not a source, it is a 301 to `besoccer.es`. The weight does not change
 * (0.7, RN-01); the name does, because archiving BeSoccer's HTML under the
 * wrong `SourceId` puts a mislabelled source into the only artefact of the
 * spike that outlives the spike.
 *
 * SPEC-002's `targets.ts` is left exactly as it is: its six pairs are its
 * window, and CA-14 asks that its suite stay green without a single changed
 * expectation.
 */
import { comparePair } from '@/mirror/analysis/compare';
import { analyzeWithoutReference } from '@/mirror/analysis/referenceless/analyze';
import { competitionId, sourceId } from '@/mirror/ids';
import { buildFixture } from './archive';
import { CEROACERO } from './targets';
import type { Fixture, Plan, Shot } from './archive';
import type { PairAnalysis } from '@/mirror/analysis/compare';
import type { ReferencelessReport } from '@/mirror/analysis/referenceless/report';
import type { WindowLog } from '@/mirror/window';
import type { CompetitionId, SourceId } from '@/model/ids';

export const BESOCCER = sourceId('besoccer');
export { CEROACERO } from './targets';

export const TERCERA_G1 = competitionId('rfef-tercera-g1');
export const PREFERENTE_G1 = competitionId('futgal-preferente-g1');

/** The four pairs the referenceless window must cover: 2 sources × 2 competitions. */
export const REFERENCELESS_PAIRS: readonly {
  source: SourceId;
  competition_id: CompetitionId;
}[] = [
  { source: CEROACERO, competition_id: TERCERA_G1 },
  { source: CEROACERO, competition_id: PREFERENTE_G1 },
  { source: BESOCCER, competition_id: TERCERA_G1 },
  { source: BESOCCER, competition_id: PREFERENTE_G1 },
];

/** A plan with only the two candidates in it: no futgal bytes exist here. */
export function candidatesPlan(first: readonly Shot[], second: readonly Shot[]): Plan {
  return new Map([
    [CEROACERO, first],
    [BESOCCER, second],
  ]);
}

/** The crossing between the two candidates, straight from the archive. */
export async function analyseCandidates(plan: Plan): Promise<PairAnalysis> {
  const fixture = await buildFixture(plan);
  return comparePair(fixture.timeline, CEROACERO, BESOCCER);
}

export interface AnalysedReferenceless {
  readonly fixture: Fixture;
  readonly report: ReferencelessReport;
}

/** The whole of phase B in the referenceless mode, over a fixture archive. */
export async function analyseReferenceless(
  plan: Plan,
  options: {
    readonly temporalWindow?: string;
    readonly start?: string;
    readonly log?: (base: WindowLog) => WindowLog;
  } = {},
): Promise<AnalysedReferenceless> {
  const fixture = await buildFixture(
    plan,
    options.start === undefined ? {} : { start: options.start },
  );

  const report = await analyzeWithoutReference({
    store: fixture.store,
    keys: fixture.keys,
    log: options.log === undefined ? fixture.log : options.log(fixture.log),
    extractors: fixture.extractors,
    pairing: fixture.pairing,
    candidates: [CEROACERO, BESOCCER],
    ...(options.temporalWindow === undefined ? {} : { temporalWindow: options.temporalWindow }),
  });

  return { fixture, report };
}
