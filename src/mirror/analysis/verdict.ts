/**
 * The verdict (CA-9, CA-10, CA-11, CA-12, CA-15).
 *
 * The asymmetry of the spec's §Diseño 2 lives here, and it is the whole point:
 *
 * - An adelanto proves INDEPENDIENTE. A mirror cannot be ahead of its origin.
 * - A replicated error proves ESPEJO. Two independent sources agree on the
 *   right answers and not on the wrong ones.
 * - The ABSENCE of adelantos proves nothing at all: an independent but slower
 *   source produces exactly the same signal as a mirror.
 * - Anything else is INCONCLUSO, which is an honest result and not a failure.
 *
 * And by CA-12, everything that is not INDEPENDIENTE denies RN-02 its second
 * route between automatic sources. That is not a policy choice: RN-02's second
 * route requires sources that are *independent*, and a source whose
 * independence has not been shown does not satisfy the precondition. The cost
 * is asymmetric — a provisional too many costs little, a *confirmado* with a
 * single origin costs the project.
 */
import { MIN_LEAD_EVENTS, MIN_LEAD_MATCHES, N_MIN } from '@/mirror/thresholds';
import type { PairAnalysis, ReplicatedError } from './compare';
import type { SourceId } from '@/model/ids';

export type Verdict = 'ESPEJO' | 'INDEPENDIENTE' | 'INCONCLUSO';

export type VerdictReason =
  | 'muestra_insuficiente'
  | 'error_replicado'
  | 'adelantos'
  | 'adelantos_mutuos'
  | 'adelantos_en_una_sola_direccion'
  | 'discrepancia_persistente'
  | 'sin_contenido_propio'
  | 'senales_contradictorias'
  | 'sin_senal';

export interface VerdictResult {
  readonly verdict: Verdict;
  readonly reason: VerdictReason;
  /** CA-12. True only for INDEPENDIENTE, without exception. */
  readonly rn02_segunda_via_entre_automaticas: boolean;
  /**
   * The weak indication of CA-10.3: the candidate contributed nothing of its
   * own and never moved out of step. On its own it is an indication, never a
   * verdict — CA-9 forbids dictating ESPEJO from the absence of adelantos.
   */
  readonly mirror_indication: boolean;
}

/** Whether the leads of one direction clear the declared minimum. */
function leadsAreEnough(events: number, matches: number): boolean {
  return events >= MIN_LEAD_EVENTS && matches >= MIN_LEAD_MATCHES;
}

/**
 * CA-9 + CA-10 for a candidate against the reference (futgal): `a` is F and
 * `b` is the candidate, so `leads_b` is "S adelanta a F".
 */
export function verdictAgainstReference(analysis: PairAnalysis): VerdictResult {
  if (analysis.n_comparable < N_MIN) return insufficient();

  const independent =
    leadsAreEnough(analysis.leads_b, analysis.lead_matches_b) ||
    analysis.persistent_discrepancies.length > 0;

  // CA-10's second ESPEJO clause. "0 adelantos" is read as no lead in EITHER
  // direction — every comparable event an empate — because reading it as "no
  // lead of S" alone would dictate ESPEJO for a source that is merely slower,
  // which is exactly what CA-9 (c) forbids. See F-SPEC-002-5.
  const lockstep =
    analysis.temporal_half === 'completa' &&
    analysis.exclusives_b === 0 &&
    analysis.leads_b === 0 &&
    analysis.leads_a === 0;

  return decide({
    independent,
    strongMirror: analysis.replicated_errors.length > 0,
    weakMirror: lockstep,
    independentReason:
      analysis.persistent_discrepancies.length > 0 ? 'discrepancia_persistente' : 'adelantos',
    mirrorReason:
      analysis.replicated_errors.length > 0 ? 'error_replicado' : 'sin_contenido_propio',
  });
}

export interface PairVerdictResult extends VerdictResult {
  /** Set when the leads only go one way: the laggard is a mirror of the other. */
  readonly espejo_de: SourceId | null;
  /**
   * CA-15.2. A replicated error the two candidates share and futgal never had
   * proves a common origin UPSTREAM of futgal — a finding no other crossing
   * can produce.
   */
  readonly origen_comun_distinto_de_futgal: boolean;
}

export interface CandidatePairInput {
  readonly analysis: PairAnalysis;
  /**
   * The replicated errors futgal also showed, as signatures
   * `${match_id}|${wrong}|${corrected}`. Used to split CA-15.2 in two.
   */
  readonly futgalErrorSignatures: ReadonlySet<string>;
}

export function errorSignature(error: ReplicatedError): string {
  return `${error.match_id}|${JSON.stringify(error.wrong)}|${JSON.stringify(error.corrected)}`;
}

/**
 * CA-15 — the two candidates against each other, where neither is "the
 * source". Mutual independence demands that EACH lead the other: leads in one
 * direction only prove that the laggard is not the origin of the leader, which
 * is the asymmetric case, and then the laggard is treated as its mirror.
 */
export function verdictBetweenCandidates(input: CandidatePairInput): PairVerdictResult {
  const { analysis } = input;
  const base = { espejo_de: null, origen_comun_distinto_de_futgal: false } as const;

  if (analysis.n_comparable < N_MIN) return { ...insufficient(), ...base };

  const aLeads = leadsAreEnough(analysis.leads_a, analysis.lead_matches_a);
  const bLeads = leadsAreEnough(analysis.leads_b, analysis.lead_matches_b);

  const mutual = aLeads && bLeads;
  const oneWay = aLeads !== bLeads;
  const upstream = analysis.replicated_errors.some(
    (error) => !input.futgalErrorSignatures.has(errorSignature(error)),
  );

  const independent = mutual || analysis.persistent_discrepancies.length > 0;

  const lockstep =
    analysis.temporal_half === 'completa' &&
    analysis.exclusives_a === 0 &&
    analysis.exclusives_b === 0 &&
    analysis.leads_a === 0 &&
    analysis.leads_b === 0;

  const espejo_de = oneWay ? (aLeads ? analysis.a : analysis.b) : null;

  const decided = decide({
    independent,
    strongMirror: analysis.replicated_errors.length > 0 || oneWay,
    weakMirror: lockstep,
    independentReason: mutual ? 'adelantos_mutuos' : 'discrepancia_persistente',
    mirrorReason:
      analysis.replicated_errors.length > 0
        ? 'error_replicado'
        : oneWay
          ? 'adelantos_en_una_sola_direccion'
          : 'sin_contenido_propio',
  });

  return {
    ...decided,
    espejo_de: decided.verdict === 'ESPEJO' ? espejo_de : null,
    origen_comun_distinto_de_futgal: upstream,
  };
}

function insufficient(): VerdictResult {
  return {
    verdict: 'INCONCLUSO',
    reason: 'muestra_insuficiente',
    rn02_segunda_via_entre_automaticas: false,
    mirror_indication: false,
  };
}

function decide(input: {
  readonly independent: boolean;
  /** A signal as strong as the independence ones: a replicated error. */
  readonly strongMirror: boolean;
  /** CA-10.3 read together with CA-9: an indication, and the weakest one. */
  readonly weakMirror: boolean;
  readonly independentReason: VerdictReason;
  readonly mirrorReason: VerdictReason;
}): VerdictResult {
  // Two STRONG signals at once is not a tie to break: a mirror cannot lead and
  // two independent sources do not share a wrong value and its correction, so
  // one of the two is wrong and we do not know which. INCONCLUSO says so, and
  // by CA-12 it is the safe side. A weak indication, on the other hand, yields
  // to a strong signal instead of contradicting it — otherwise "S adds nothing
  // of its own" would cancel a proven adelanto.
  if (input.independent && input.strongMirror) {
    return {
      verdict: 'INCONCLUSO',
      reason: 'senales_contradictorias',
      rn02_segunda_via_entre_automaticas: false,
      mirror_indication: input.weakMirror,
    };
  }

  if (input.independent) {
    return {
      verdict: 'INDEPENDIENTE',
      reason: input.independentReason,
      rn02_segunda_via_entre_automaticas: true,
      mirror_indication: false,
    };
  }

  if (input.strongMirror || input.weakMirror) {
    return {
      verdict: 'ESPEJO',
      reason: input.mirrorReason,
      rn02_segunda_via_entre_automaticas: false,
      mirror_indication: input.weakMirror,
    };
  }

  return {
    verdict: 'INCONCLUSO',
    reason: 'sin_senal',
    rn02_segunda_via_entre_automaticas: false,
    mirror_indication: false,
  };
}
