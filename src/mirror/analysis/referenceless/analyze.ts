/**
 * La fase B del modo **sin referencia**, de punta a punta (SPEC-003).
 *
 * Igual que la de SPEC-002, es una función pura del archivo y del fichero de
 * emparejamiento: sin reloj, sin red, sin base de datos y sin depender del orden
 * en que `store.list()` haya devuelto las claves. Eso es lo que permite a
 * `sdd-verificador` comprobar un veredicto de una ventana que no presenció (CA-7
 * de SPEC-002, heredado por CA-14).
 *
 * Y una cosa que NO tiene, a propósito: un parámetro de referencia. No es que se
 * le pase `null`; es que no existe. Con futgal ausente, cualquier ruta que
 * consumiese un conjunto de firmas de error de la referencia lo recibiría vacío,
 * y un conjunto vacío convierte «no hemos mirado» en «hemos mirado y no estaba»
 * (CA-3).
 */
import { N_MIN } from '@/mirror/thresholds';
import { assertWindowValid, windowCoverage, windowValidity } from '@/mirror/window';
import { comparePair } from '../compare';
import { DECLARED_THRESHOLDS } from '../report';
import { readArchive, valueKey } from '../timeline';
import { proseReferencelessPair, proseReferencelessSummary } from './prose';
import {
  DECLARED_LIMITATIONS,
  REFERENCELESS_CONFLICT_WARNING,
  REFERENCELESS_MODE,
  ReferencelessReportSchema,
  UNMEASURED_CANDIDATE_VERDICTS,
} from './report';
import { archiveRetention } from './retention';
import { verdictWithoutReference } from './verdict';
import type { EventComparison, PairAnalysis } from '../compare';
import type { PairingIndex } from '../pairing';
import type { SourceExtractor } from '../extract';
import type { ReferencelessPairReport, ReferencelessReport } from './report';
import type { WindowLog } from '@/mirror/window';
import type { RawStore } from '@/raw/store';
import type { SourceId } from '@/model/ids';

/** Named in the report while the temporal half is still pending (CA-13). */
export const DEFAULT_TEMPORAL_WINDOW = 'primera ventana con partidos en vivo (por fijar)';

export interface ReferencelessAnalyzeInput {
  readonly store: RawStore;
  readonly keys: readonly string[];
  readonly log: WindowLog;
  readonly extractors: ReadonlyMap<SourceId, SourceExtractor>;
  readonly pairing: PairingIndex;
  /** Las dos candidatas de peso 0.7 (RN-01). Ninguna es «la fuente». */
  readonly candidates: readonly [SourceId, SourceId];
  readonly temporalWindow?: string;
}

/**
 * Lanzado cuando la ventana pasa la validez de CA-5 pero el archivo no tiene ni
 * una captura legible, de modo que no hay `window.end` del que anclar la fecha
 * de purga. Un informe sin esa fecha no es un informe de este modo (CA-15.2).
 */
export class EmptyArchiveError extends Error {
  override readonly name = 'EmptyArchiveError';

  constructor() {
    super(
      'CA-15: the window has no archived capture, so it has no `window.end` to anchor the ' +
        'retention block on. A report of this mode without a purge date is not a report of ' +
        'this mode.',
    );
  }
}

export async function analyzeWithoutReference(
  input: ReferencelessAnalyzeInput,
): Promise<ReferencelessReport> {
  // CA-5 de SPEC-002 y CA-8 de esta, antes que nada: sobre una ventana a
  // medias no se dicta veredicto, y un par declarado sin un solo tick cuenta
  // como cobertura 0 %.
  assertWindowValid(input.log);

  const timeline = await readArchive({
    store: input.store,
    keys: input.keys,
    extractors: input.extractors,
    pairing: input.pairing,
  });

  if (timeline.end === null || timeline.start === null) throw new EmptyArchiveError();

  const [first, second] = input.candidates;
  const analysis = comparePair(timeline, first, second);
  const temporalComplete = analysis.temporal_half === 'completa';
  const retention = archiveRetention(timeline.end);
  const pair = pairReport(analysis, temporalComplete);

  const report: ReferencelessReport = {
    spec: 'SPEC-003',
    modo: REFERENCELESS_MODE,
    referencia: null,
    window: {
      start: timeline.start,
      end: timeline.end,
      valid: windowValidity(input.log).valid,
      min_tick_success_ratio: DECLARED_THRESHOLDS.min_tick_success_ratio,
      coverage: windowCoverage(input.log).map((coverage) => ({
        source: coverage.source,
        competition_id: coverage.competition_id,
        ok: coverage.ok,
        failed: coverage.failed,
        skipped: coverage.skipped,
        attempted: coverage.attempted,
        ratio: coverage.ratio,
      })),
    },
    thresholds: DECLARED_THRESHOLDS,
    halves: {
      // La mitad de contenido siempre corre: es función de datos en reposo.
      content: 'completa',
      temporal: temporalComplete ? 'completa' : 'pendiente',
      planned_temporal_window: temporalComplete
        ? null
        : (input.temporalWindow ?? DEFAULT_TEMPORAL_WINDOW),
    },
    veredictos_por_candidata: UNMEASURED_CANDIDATE_VERDICTS,
    pair,
    // CA-12: incondicional. No hay ningún desenlace de este modo en que la
    // métrica de conflictos mida lo que su nombre dice.
    conflict_metric_warning: REFERENCELESS_CONFLICT_WARNING,
    limitaciones_declaradas: [...DECLARED_LIMITATIONS],
    retencion_del_archivo: retention,
    prose: proseReferencelessSummary(pair.prose, retention),
  };

  return ReferencelessReportSchema.parse(report);
}

function eventEvidence(event: EventComparison) {
  return {
    match_id: event.match_id,
    value: event.value_key,
    first_seen_a: event.first_seen_a,
    first_seen_b: event.first_seen_b,
    difference_s: event.difference_ms === null ? null : event.difference_ms / 1000,
    raw_keys: [event.raw_key_a, event.raw_key_b].filter((key): key is string => key !== null),
  };
}

function pairReport(analysis: PairAnalysis, temporalComplete: boolean): ReferencelessPairReport {
  const verdict = verdictWithoutReference(analysis);

  return {
    candidatas: [analysis.a, analysis.b],
    verdict: verdict.verdict,
    reason: verdict.reason,
    rn02_segunda_via_entre_automaticas: verdict.rn02_segunda_via_entre_automaticas,
    mirror_indication: verdict.mirror_indication,
    espejo_de: verdict.espejo_de,
    origen_comun_probado: verdict.origen_comun_probado,
    atribucion_de_origen: verdict.atribucion_de_origen,
    origen_atribuido_a: verdict.origen_atribuido_a,
    counters: {
      n_comparable: analysis.n_comparable,
      n_min: N_MIN,
      exclusive_to_first: analysis.exclusives_a,
      exclusive_to_second: analysis.exclusives_b,
      // Un solo contador, y entero: separar «también en futgal» de «ausentes de
      // futgal» exige haber mirado a futgal (CA-3).
      replicated_errors_total: analysis.replicated_errors.length,
      persistent_discrepancies: analysis.persistent_discrepancies.length,
      spelling_divergences: analysis.spelling_divergences.length,
      temporal: temporalComplete
        ? {
            leads_first_over_second: analysis.leads_a,
            leads_second_over_first: analysis.leads_b,
            lead_matches_first: analysis.lead_matches_a,
            lead_matches_second: analysis.lead_matches_b,
            ties: analysis.ties,
            observed_differences_s: analysis.observed_differences_ms.map((ms) => ms / 1000),
          }
        : null,
    },
    evidence: {
      // Los adelantos de las DOS direcciones: sus contadores y su evidencia
      // viajan completos aunque no dicten independencia (CA-4).
      leads: analysis.events
        .filter(
          (event) => event.classification === 'lead_a' || event.classification === 'lead_b',
        )
        .map(eventEvidence),
      exclusives: analysis.events
        .filter(
          (event) => event.classification === 'only_a' || event.classification === 'only_b',
        )
        .map(eventEvidence),
      replicated_errors: analysis.replicated_errors.map((error) => ({
        match_id: error.match_id,
        wrong: valueKey(error.wrong),
        corrected: valueKey(error.corrected),
        raw_keys: [...error.raw_keys],
      })),
      persistent_discrepancies: analysis.persistent_discrepancies.map((discrepancy) => ({
        match_id: discrepancy.match_id,
        fact: discrepancy.fact,
        value_a: discrepancy.value_a,
        value_b: discrepancy.value_b,
        captures_a: discrepancy.captures_a,
        captures_b: discrepancy.captures_b,
        raw_keys: [...discrepancy.raw_keys],
      })),
      spelling_divergences: analysis.spelling_divergences.map((divergence) => ({
        match_id: divergence.match_id,
        spelling_a: divergence.spelling_a,
        spelling_b: divergence.spelling_b,
        captures_a: divergence.captures_a,
        captures_b: divergence.captures_b,
        raw_keys: [...divergence.raw_keys],
      })),
    },
    prose: proseReferencelessPair(analysis, verdict, temporalComplete),
  };
}
