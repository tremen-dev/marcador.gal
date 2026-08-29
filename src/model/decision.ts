import { z } from 'zod';
import { InstantSchema, MatchIdSchema, ObservationIdSchema } from './ids';
import { MatchStatusSchema } from './match';

/** The business rules of reglas.md. A Decision cites exactly one (RN-12). */
export const DECISION_RULES = [
  'RN-01',
  'RN-02',
  'RN-03',
  'RN-04',
  'RN-05',
  'RN-06',
  'RN-07',
  'RN-08',
  'RN-09',
  'RN-10',
  'RN-11',
  'RN-12',
  'RN-13',
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

/**
 * What we publish. Append-only log; the latest per match is the live one.
 * Every Decision records its rule and the observations behind it (RN-12).
 */
export const DecisionSchema = z
  .object({
    match_id: MatchIdSchema,
    status: MatchStatusSchema,
    home_score: z.int().min(0).nullable(),
    away_score: z.int().min(0).nullable(),
    provisional: z.boolean(),
    rule: DecisionRuleSchema,
    decided_at: InstantSchema,
    supporting_observation_ids: SupportingObservationIdsSchema,
    version: z.int().min(1),
  })
  .readonly();

export type Decision = z.infer<typeof DecisionSchema>;
