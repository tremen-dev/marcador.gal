import { z } from 'zod';
import { InstantSchema, MatchIdSchema, ObservationIdSchema } from './ids';
import { scoredShape, unscoredShape } from './score';

/**
 * The rules of the ENGINE (SPEC-001 CA-19). A Decision cites exactly one
 * (RN-12), and it can only be one of these seven.
 *
 * `dominio.md` defines `rule` as «la regla **del motor** (RN-xx) que produjo una
 * Decision», and `reglas.md` splits RN-01..RN-07 («Motor de decisiones») from
 * RN-08..RN-13 («Invariantes del proyecto»). No invariant can produce a
 * Decision: RN-08 says which door it comes through, RN-09 and RN-10 say when we
 * do NOT publish and what is stored first, RN-11 is network courtesy, and RN-12
 * and RN-13 talk about the Decision itself. A Decision citing RN-13 satisfies
 * CA-3 and says nothing: that is fake traceability.
 *
 * The vocabulary is deliberately closed. The day the engine meets a case none
 * of the seven describes, the answer is a NEW rule in `reglas.md`, not the
 * recycling of a label that does not explain it (gate 2026-08-29).
 */
export const DECISION_RULES = [
  'RN-01',
  'RN-02',
  'RN-03',
  'RN-04',
  'RN-05',
  'RN-06',
  'RN-07',
] as const;

export const DecisionRuleSchema = z.enum(DECISION_RULES);
export type DecisionRule = z.infer<typeof DecisionRuleSchema>;

/**
 * At least one supporting observation, enforced in the TYPE and not only at
 * runtime. Zod 4 changed `.nonempty()` to a plain min-length check that keeps
 * the inferred type `T[]`, so `[]` would still compile; a tuple with a rest
 * element gives back `[ObservationId, ...ObservationId[]]` (SPEC-001 CA-3).
 */
export const SupportingObservationIdsSchema = z.tuple(
  [ObservationIdSchema],
  ObservationIdSchema,
);

const decisionBase = {
  match_id: MatchIdSchema,
  /**
   * A free boolean in all five branches, on purpose. RN-03 defines
   * *provisional* over the publication of a SCOREBOARD and says nothing about a
   * Decision without one; fixing a relation here would be inventing a business
   * rule (SPEC-001 §Fuera de alcance, F-SPEC-001-14).
   */
  provisional: z.boolean(),
  rule: DecisionRuleSchema,
  decided_at: InstantSchema,
  supporting_observation_ids: SupportingObservationIdsSchema,
  version: z.int().min(1),
};

/**
 * The five branches of what we publish. Same five, and the same scoreboard rule
 * (`./score.ts`), as `Observation` (CA-18): a `Decision` with
 * `status: 'scheduled'` and a 5-3 on it is exactly the hole we cannot afford in
 * the entity that reaches the screen.
 */
export const LiveDecisionSchema = z.object({
  ...decisionBase,
  status: z.literal('live'),
  ...scoredShape,
});
export const FinishedDecisionSchema = z.object({
  ...decisionBase,
  status: z.literal('finished'),
  ...scoredShape,
});
export const SuspendedDecisionSchema = z.object({
  ...decisionBase,
  status: z.literal('suspended'),
  ...scoredShape,
});
export const ScheduledDecisionSchema = z.object({
  ...decisionBase,
  status: z.literal('scheduled'),
  ...unscoredShape,
});
export const PostponedDecisionSchema = z.object({
  ...decisionBase,
  status: z.literal('postponed'),
  ...unscoredShape,
});

/**
 * What we publish. Append-only log; the latest per match is the live one.
 * Every Decision records its rule and the observations behind it (RN-12), and
 * the schema ends in `.readonly()` so parsed values come out frozen.
 */
export const DecisionSchema = z
  .discriminatedUnion('status', [
    LiveDecisionSchema,
    FinishedDecisionSchema,
    SuspendedDecisionSchema,
    ScheduledDecisionSchema,
    PostponedDecisionSchema,
  ])
  .readonly();

export type Decision = z.infer<typeof DecisionSchema>;
