/**
 * The report of the mirror test (CA-13, CA-14).
 *
 * The schema is LOCAL to SPEC-002 and deliberately not in `src/model/`: this
 * is a measurement artefact, not an entity of the domain. It does not cross to
 * the frontend, nothing publishes it, and it has no table.
 *
 * Two properties are load-bearing:
 *
 * - **Strict in both directions.** A key too many fails exactly like a key
 *   missing (the parity discipline of SPEC-001 CA-14), so the report cannot
 *   quietly grow a field nobody reads or lose one somebody depends on.
 * - **The temporal counters are nullable.** A report with the content half
 *   `completa` and the temporal half `pendiente` is valid and actionable
 *   (§Diseño 4). If the schema demanded them, the day-2 report — the one that
 *   unblocks the engine — could not be emitted at all.
 */
import { z } from 'zod';
import { InstantSchema, MatchIdSchema, SourceIdSchema } from '@/model/ids';
import {
  MIN_LEAD_EVENTS,
  MIN_LEAD_MATCHES,
  MIN_PERSISTENT_CAPTURES,
  N_MIN,
  TAU_MS,
} from '@/mirror/thresholds';
import { MIN_TICK_SUCCESS_RATIO } from '@/mirror/window';

export const VerdictSchema = z.enum(['ESPEJO', 'INDEPENDIENTE', 'INCONCLUSO']);
export const HalfStateSchema = z.enum(['completa', 'pendiente']);
/**
 * The three facts a persistent discrepancy can be about (CA-10.2).
 *
 * `team_spelling` is deliberately NOT here. CA-13 forbids the spelling being
 * summed into the persistent discrepancies "en ninguna clave del JSON ni en la
 * prosa", and a shared counter with a boolean discriminator would be "una
 * invitación a que el primer consumidor que olvide filtrar reintroduzca justo
 * el fallo que la enmienda quita". Leaving the value out of the enum makes the
 * mistake unrepresentable rather than merely discouraged.
 */
export const DiscrepancyFactSchema = z.enum(['existence', 'kickoff', 'finished_result']);

/** CA-14: every claim carries the archive keys that sustain it. */
export const EventEvidenceSchema = z.strictObject({
  match_id: MatchIdSchema,
  value: z.string(),
  first_seen_a: InstantSchema.nullable(),
  first_seen_b: InstantSchema.nullable(),
  difference_s: z.number().nullable(),
  raw_keys: z.array(z.string().min(1)).min(1),
});

export const ReplicatedErrorEvidenceSchema = z.strictObject({
  match_id: MatchIdSchema,
  wrong: z.string(),
  corrected: z.string(),
  /** CA-15.2: only meaningful for the candidate pair; false elsewhere. */
  also_in_reference: z.boolean(),
  raw_keys: z.array(z.string().min(1)).length(4),
});

export const PersistentDiscrepancyEvidenceSchema = z.strictObject({
  match_id: MatchIdSchema,
  fact: DiscrepancyFactSchema,
  value_a: z.string(),
  value_b: z.string(),
  captures_a: z.int(),
  captures_b: z.int(),
  raw_keys: z.array(z.string().min(1)).min(1),
});

/**
 * CA-10.4 + CA-14. Its own shape, with its own field names: nothing that reads
 * a persistent discrepancy can accidentally read one of these, and the raw
 * keys travel exactly like everybody else's.
 */
export const SpellingDivergenceEvidenceSchema = z.strictObject({
  match_id: MatchIdSchema,
  spelling_a: z.string(),
  spelling_b: z.string(),
  captures_a: z.int(),
  captures_b: z.int(),
  raw_keys: z.array(z.string().min(1)).min(1),
});

export const EvidenceSchema = z.strictObject({
  leads: z.array(EventEvidenceSchema),
  exclusives: z.array(EventEvidenceSchema),
  replicated_errors: z.array(ReplicatedErrorEvidenceSchema),
  persistent_discrepancies: z.array(PersistentDiscrepancyEvidenceSchema),
  /** Registered and cited; it enters no verdict (CA-10.4, CA-15.4). */
  spelling_divergences: z.array(SpellingDivergenceEvidenceSchema),
});

export const TemporalCountersSchema = z.strictObject({
  leads: z.int(),
  lags: z.int(),
  ties: z.int(),
  lead_matches: z.int(),
  /** `first_seen(reference) − first_seen(source)` in seconds, sorted (CA-8). */
  observed_differences_s: z.array(z.number()),
});

export const CountersSchema = z.strictObject({
  n_comparable: z.int(),
  n_min: z.int(),
  exclusive_to_source: z.int(),
  exclusive_to_reference: z.int(),
  replicated_errors: z.int(),
  persistent_discrepancies: z.int(),
  /**
   * CA-13, enmienda 2026-08-31 §1: its OWN key, never added to the one above.
   * It is reported because it is the audit surface of the manual pairing of
   * CA-6 and the first input of the alias catalogue of RN-09 — not because it
   * weighs on the verdict, which it does not.
   */
  spelling_divergences: z.int(),
  /** `null` while the temporal half is pending. */
  temporal: TemporalCountersSchema.nullable(),
});

export const SourceReportSchema = z.strictObject({
  source: SourceIdSchema,
  reference: SourceIdSchema,
  verdict: VerdictSchema,
  reason: z.string().min(1),
  /** CA-12. True only for INDEPENDIENTE. */
  rn02_segunda_via_entre_automaticas: z.boolean(),
  mirror_indication: z.boolean(),
  counters: CountersSchema,
  evidence: EvidenceSchema,
  prose: z.string().min(1),
});

export const PairTemporalCountersSchema = z.strictObject({
  leads_first_over_second: z.int(),
  leads_second_over_first: z.int(),
  lead_matches_first: z.int(),
  lead_matches_second: z.int(),
  ties: z.int(),
  observed_differences_s: z.array(z.number()),
});

export const PairCountersSchema = z.strictObject({
  n_comparable: z.int(),
  n_min: z.int(),
  exclusive_to_first: z.int(),
  exclusive_to_second: z.int(),
  replicated_errors_total: z.int(),
  /** CA-15.2, the two categories the criterion demands be kept apart. */
  replicated_errors_also_in_reference: z.int(),
  replicated_errors_absent_from_reference: z.int(),
  persistent_discrepancies: z.int(),
  /** CA-15.4: symmetric, and it does not dictate here either. */
  spelling_divergences: z.int(),
  temporal: PairTemporalCountersSchema.nullable(),
});

export const PairReportSchema = z.strictObject({
  sources: z.tuple([SourceIdSchema, SourceIdSchema]),
  verdict: VerdictSchema,
  reason: z.string().min(1),
  rn02_segunda_via_entre_automaticas: z.boolean(),
  mirror_indication: z.boolean(),
  espejo_de: SourceIdSchema.nullable(),
  origen_comun_distinto_de_futgal: z.boolean(),
  counters: PairCountersSchema,
  evidence: EvidenceSchema,
  prose: z.string().min(1),
});

export const CoverageSchema = z.strictObject({
  source: SourceIdSchema,
  competition_id: z.string().min(1),
  ok: z.int(),
  failed: z.int(),
  skipped: z.int(),
  attempted: z.int(),
  ratio: z.number(),
});

export const WindowReportSchema = z.strictObject({
  start: InstantSchema.nullable(),
  end: InstantSchema.nullable(),
  valid: z.boolean(),
  min_tick_success_ratio: z.number(),
  coverage: z.array(CoverageSchema),
});

export const ThresholdsSchema = z.strictObject({
  tau_ms: z.int(),
  n_min: z.int(),
  min_lead_events: z.int(),
  min_lead_matches: z.int(),
  min_lead_events_each_direction: z.int(),
  persistent_discrepancy_captures: z.int(),
  min_tick_success_ratio: z.number(),
});

export const ConflictMetricWarningSchema = z.strictObject({
  metric: z.literal('conflictos'),
  hard_cut_15_percent_applies: z.literal(false),
  text: z.string().min(1),
});

export const MirrorReportSchema = z.strictObject({
  spec: z.literal('SPEC-002'),
  reference: SourceIdSchema,
  window: WindowReportSchema,
  thresholds: ThresholdsSchema,
  halves: z.strictObject({
    content: HalfStateSchema,
    temporal: HalfStateSchema,
    /** Named only while the temporal half is pending (CA-13). */
    planned_temporal_window: z.string().min(1).nullable(),
  }),
  sources: z.array(SourceReportSchema).length(2),
  pair: PairReportSchema,
  /** CA-13, arbitraje del gate del 2026-08-31. `null` when it does not apply. */
  conflict_metric_warning: ConflictMetricWarningSchema.nullable(),
  prose: z.string().min(1),
});

export type Verdict = z.infer<typeof VerdictSchema>;
export type MirrorReport = z.infer<typeof MirrorReportSchema>;
export type SourceReport = z.infer<typeof SourceReportSchema>;
export type PairReport = z.infer<typeof PairReportSchema>;

/** The thresholds actually compiled into this run (§5: they travel along). */
export const DECLARED_THRESHOLDS: z.infer<typeof ThresholdsSchema> = {
  tau_ms: TAU_MS,
  n_min: N_MIN,
  min_lead_events: MIN_LEAD_EVENTS,
  min_lead_matches: MIN_LEAD_MATCHES,
  min_lead_events_each_direction: MIN_LEAD_EVENTS,
  persistent_discrepancy_captures: MIN_PERSISTENT_CAPTURES,
  min_tick_success_ratio: MIN_TICK_SUCCESS_RATIO,
};

/**
 * The warning CA-13 makes obligatory when no candidate turns out independent.
 * The point is that it travels INSIDE the report, not in the head of whoever
 * reads it: between mirrors there is no possible disagreement, so the conflict
 * metric of EPIC-001 has non-independent sources in its denominator, does not
 * measure what its name says, and its hard cut at 15 % does not apply.
 */
export const CONFLICT_METRIC_WARNING_TEXT =
  'Ninguna de las dos fuentes automáticas candidatas ha resultado INDEPENDIENTE de futgal. ' +
  'La métrica de conflictos de EPIC-001 tiene por denominador fuentes que no son independientes: ' +
  'entre espejos no hay desacuerdo posible, así que su valor no mide lo que su nombre dice y ' +
  'el corte duro del 15 % NO aplica en este escenario.';
