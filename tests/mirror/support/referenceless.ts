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
import { atRest, constant, goalAt, merge, padding, transientError } from './plans';
import { CEROACERO } from './targets';
import type { Fixture, Plan, Shot } from './archive';
import type { PairAnalysis } from '@/mirror/analysis/compare';
import type { ReferencelessReport } from '@/mirror/analysis/referenceless/report';
import type { ReferencelessReason } from '@/mirror/analysis/referenceless/verdict';
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

/** Fixture (a) de `pair.test.ts`: cada una adelanta a la otra en dos partidos. */
export const MUTUAL_LEADS = (): Plan =>
  candidatesPlan(
    merge(goalAt('m1', 2), goalAt('m2', 2), goalAt('m3', 8), goalAt('m4', 8), padding(3)),
    merge(goalAt('m1', 8), goalAt('m2', 8), goalAt('m3', 2), goalAt('m4', 2), padding(3)),
  );

/** Fixture (b) de `pair.test.ts`: C1 adelanta cuatro veces, C2 nunca. */
export const ONE_WAY_LEADS = (): Plan =>
  candidatesPlan(
    merge(goalAt('m1', 2), goalAt('m2', 2), goalAt('m3', 2), goalAt('m4', 2), padding(3)),
    merge(goalAt('m1', 8), goalAt('m2', 8), goalAt('m3', 8), goalAt('m4', 8), padding(3)),
  );

/**
 * **Los seis desenlaces de la regla de CA-6, uno por motivo, y los dos
 * veredictos.**
 *
 * Una sola tabla, y aquí y no en un fichero de test, porque tenerla dos veces
 * es exactamente cómo se llegó al RED de la primera verificación: el veredicto
 * se barría entero (`referenceless-verdict` caso 11) y el informe se probaba
 * sobre otros dos planes que daban **los dos ESPEJO**, así que ningún test de
 * nivel informe construía jamás un desenlace INCONCLUSO y una degradación del
 * informe limitada a esa rama dejaba la suite en verde.
 *
 * Tres de los seis son INCONCLUSO. Quien toque esta tabla tiene enfrente el
 * caso 24 de `referenceless-report.test.ts`, que comprueba que sigue cubriendo
 * los dos veredictos y los seis motivos.
 */
export const REASON_PLANS: readonly (readonly [ReferencelessReason, () => Plan])[] = [
  [
    'muestra_insuficiente',
    () => candidatesPlan(merge(padding(4), constant('c1')), merge(padding(4), constant('c1'))),
  ],
  [
    'error_replicado',
    () =>
      candidatesPlan(
        merge(transientError('e1', 2), padding(5)),
        merge(transientError('e1', 3), padding(5)),
      ),
  ],
  ['independencia_no_demostrable_sin_referencia', MUTUAL_LEADS],
  ['sin_contenido_propio', () => candidatesPlan(padding(6), padding(6))],
  ['adelantos_en_una_sola_direccion', ONE_WAY_LEADS],
  [
    'sin_senal',
    () => {
      const shots = merge(...Array.from({ length: 12 }, (_unused, i) => atRest(`r${i}`, '17:00')));
      return candidatesPlan(shots, shots);
    },
  ],
];

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

let sixReports: Promise<
  readonly (readonly [ReferencelessReason, ReferencelessReport])[]
> | null = null;

/**
 * Un informe **por cada uno de los seis motivos** de CA-6, con sus tres
 * INCONCLUSO, construidos una sola vez y compartidos por los barridos de nivel
 * informe (CA-2, CA-11, CA-12, CA-15).
 */
export function referencelessReportsByReason(): Promise<
  readonly (readonly [ReferencelessReason, ReferencelessReport])[]
> {
  sixReports ??= Promise.all(
    REASON_PLANS.map(
      async ([reason, build]) => [reason, (await analyseReferenceless(build())).report] as const,
    ),
  );
  return sixReports;
}
