/**
 * Phase B, end to end (CA-5, CA-7, CA-11..CA-15).
 *
 * A pure function of the archive plus the pairing file: no clock, no network,
 * no database, and no dependence on the order `store.list()` happened to
 * return. That is what lets `sdd-verificador` check a verdict for a window it
 * did not witness — the window is unrepeatable, this is not.
 */
import { assertWindowValid, windowCoverage, windowValidity } from '@/mirror/window';
import { N_MIN } from '@/mirror/thresholds';
import { comparePair } from './compare';
import { errorSignature, verdictAgainstReference, verdictBetweenCandidates } from './verdict';
import { readArchive, valueKey } from './timeline';
import {
  CONFLICT_METRIC_WARNING_TEXT,
  DECLARED_THRESHOLDS,
  MirrorReportSchema,
} from './report';
import { prosePair, proseSource, proseSummary } from './prose';
import type { EventComparison, PairAnalysis } from './compare';
import type { MirrorReport, PairReport, SourceReport } from './report';
import type { PairingIndex } from './pairing';
import type { SourceExtractor } from './extract';
import type { WindowLog } from '@/mirror/window';
import type { RawStore } from '@/raw/store';
import type { SourceId } from '@/model/ids';

/** Named in the report when the temporal half is still pending (CA-13). */
export const DEFAULT_TEMPORAL_WINDOW = 'primera ventana con partidos en vivo (por fijar)';

export interface AnalyzeInput {
  readonly store: RawStore;
  readonly keys: readonly string[];
  readonly log: WindowLog;
  readonly extractors: ReadonlyMap<SourceId, SourceExtractor>;
  readonly pairing: PairingIndex;
  /** futgal: the official source, RN-01 weight 1.0. */
  readonly reference: SourceId;
  /** The two aggregators of weight 0.7 (RN-01). */
  readonly candidates: readonly [SourceId, SourceId];
  readonly temporalWindow?: string;
}

export async function analyze(input: AnalyzeInput): Promise<MirrorReport> {
  // CA-5, first of all: an incomplete window does not get a verdict. If one
  // source lost twenty minutes, futgal "leads" on every event of those twenty
  // minutes and an outage reads as proof of mirroring.
  assertWindowValid(input.log);

  const timeline = await readArchive({
    store: input.store,
    keys: input.keys,
    extractors: input.extractors,
    pairing: input.pairing,
  });

  const [first, second] = input.candidates;
  const againstReference = input.candidates.map((candidate) =>
    comparePair(timeline, input.reference, candidate),
  );
  const betweenCandidates = comparePair(timeline, first, second);

  const referenceErrorSignatures = new Set(
    againstReference.flatMap((analysis) => analysis.replicated_errors.map(errorSignature)),
  );

  const temporalComplete =
    againstReference.every((analysis) => analysis.temporal_half === 'completa') &&
    betweenCandidates.temporal_half === 'completa';

  const sources: SourceReport[] = againstReference.map((analysis) =>
    sourceReport(input.reference, analysis, temporalComplete),
  );

  const pair = pairReport(betweenCandidates, referenceErrorSignatures, temporalComplete);

  const noneIndependent = sources.every((source) => source.verdict !== 'INDEPENDIENTE');
  const warning = noneIndependent
    ? {
        metric: 'conflictos' as const,
        hard_cut_15_percent_applies: false as const,
        text: CONFLICT_METRIC_WARNING_TEXT,
      }
    : null;

  const validity = windowValidity(input.log);

  const report: MirrorReport = {
    spec: 'SPEC-002',
    reference: input.reference,
    window: {
      start: timeline.start,
      end: timeline.end,
      valid: validity.valid,
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
      // The content half always runs: it is a function of data at rest.
      content: 'completa',
      temporal: temporalComplete ? 'completa' : 'pendiente',
      planned_temporal_window: temporalComplete
        ? null
        : (input.temporalWindow ?? DEFAULT_TEMPORAL_WINDOW),
    },
    sources,
    pair,
    conflict_metric_warning: warning,
    prose: proseSummary(sources, pair, warning),
  };

  // Parsed before it is returned: the report the caller gets is one that has
  // been through its own schema, key by key (CA-13).
  return MirrorReportSchema.parse(report);
}

function eventEvidence(event: EventComparison) {
  const keys = [event.raw_key_a, event.raw_key_b].filter(
    (key): key is string => key !== null,
  );
  return {
    match_id: event.match_id,
    value: event.value_key,
    first_seen_a: event.first_seen_a,
    first_seen_b: event.first_seen_b,
    difference_s: event.difference_ms === null ? null : event.difference_ms / 1000,
    raw_keys: keys,
  };
}

function evidenceOf(
  analysis: PairAnalysis,
  leadFilter: (event: EventComparison) => boolean,
  referenceErrorSignatures: ReadonlySet<string> | null,
) {
  return {
    leads: analysis.events.filter(leadFilter).map(eventEvidence),
    exclusives: analysis.events
      .filter(
        (event) => event.classification === 'only_a' || event.classification === 'only_b',
      )
      .map(eventEvidence),
    replicated_errors: analysis.replicated_errors.map((error) => ({
      match_id: error.match_id,
      wrong: valueKey(error.wrong),
      corrected: valueKey(error.corrected),
      also_in_reference:
        referenceErrorSignatures === null
          ? false
          : referenceErrorSignatures.has(errorSignature(error)),
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
    // CA-10.4: cited like everything else (CA-14), counted apart, and read by
    // nobody who is deciding anything.
    spelling_divergences: analysis.spelling_divergences.map((divergence) => ({
      match_id: divergence.match_id,
      spelling_a: divergence.spelling_a,
      spelling_b: divergence.spelling_b,
      captures_a: divergence.captures_a,
      captures_b: divergence.captures_b,
      raw_keys: [...divergence.raw_keys],
    })),
  };
}

function sourceReport(
  reference: SourceId,
  analysis: PairAnalysis,
  temporalComplete: boolean,
): SourceReport {
  const verdict = verdictAgainstReference(analysis);

  return {
    source: analysis.b,
    reference,
    verdict: verdict.verdict,
    reason: verdict.reason,
    rn02_segunda_via_entre_automaticas: verdict.rn02_segunda_via_entre_automaticas,
    mirror_indication: verdict.mirror_indication,
    counters: {
      n_comparable: analysis.n_comparable,
      n_min: N_MIN,
      exclusive_to_source: analysis.exclusives_b,
      exclusive_to_reference: analysis.exclusives_a,
      replicated_errors: analysis.replicated_errors.length,
      persistent_discrepancies: analysis.persistent_discrepancies.length,
      spelling_divergences: analysis.spelling_divergences.length,
      temporal: temporalComplete
        ? {
            leads: analysis.leads_b,
            lags: analysis.leads_a,
            ties: analysis.ties,
            lead_matches: analysis.lead_matches_b,
            observed_differences_s: analysis.observed_differences_ms.map((ms) => ms / 1000),
          }
        : null,
    },
    evidence: evidenceOf(analysis, (event) => event.classification === 'lead_b', null),
    prose: proseSource(reference, analysis, verdict, temporalComplete),
  };
}

function pairReport(
  analysis: PairAnalysis,
  referenceErrorSignatures: ReadonlySet<string>,
  temporalComplete: boolean,
): PairReport {
  const verdict = verdictBetweenCandidates({
    analysis,
    futgalErrorSignatures: referenceErrorSignatures,
  });

  const alsoInReference = analysis.replicated_errors.filter((error) =>
    referenceErrorSignatures.has(errorSignature(error)),
  ).length;

  return {
    sources: [analysis.a, analysis.b],
    verdict: verdict.verdict,
    reason: verdict.reason,
    rn02_segunda_via_entre_automaticas: verdict.rn02_segunda_via_entre_automaticas,
    mirror_indication: verdict.mirror_indication,
    espejo_de: verdict.espejo_de,
    origen_comun_distinto_de_futgal: verdict.origen_comun_distinto_de_futgal,
    counters: {
      n_comparable: analysis.n_comparable,
      n_min: N_MIN,
      exclusive_to_first: analysis.exclusives_a,
      exclusive_to_second: analysis.exclusives_b,
      replicated_errors_total: analysis.replicated_errors.length,
      replicated_errors_also_in_reference: alsoInReference,
      replicated_errors_absent_from_reference:
        analysis.replicated_errors.length - alsoInReference,
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
    evidence: evidenceOf(
      analysis,
      (event) => event.classification === 'lead_a' || event.classification === 'lead_b',
      referenceErrorSignatures,
    ),
    prose: prosePair(analysis, verdict, temporalComplete),
  };
}
