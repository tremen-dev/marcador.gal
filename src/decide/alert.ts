/**
 * The alert: what the engine produces when it CANNOT publish, or when what is
 * published stops being trustworthy (SPEC-013 CA-6 and CA-8, ADR-021 §5).
 *
 * IT IS NOT THE CANONICAL MODEL, and that is why it does not live in
 * `src/model/`: it records an ACT OF THE ENGINE, the way `ingest_attempts`
 * records an act of the tick. It does not cross to the frontend, it is not
 * parity-checked against `decisions` (SPEC-001 CA-14), and nothing publishes
 * from it. RN-05 says it with all the letters: the conflict is not published.
 *
 * WRITTEN ON ENTERING THE CONDITION, NOT WHILE IT LASTS. A conflict that
 * stands for half an hour with one tick per minute is ONE row, not thirty:
 * what decides whether it is a new one is the latest alert of that rule for
 * that match, which enters `decide` as data — so the reducer stays pure.
 *
 * AND IT IS THE THIRD FIGURE OF THE EPIC. «% de partidos con desacuerdo entre
 * fuentes en algún momento» is counted over this table; without it the figure
 * would have to be reconstructed by guessing from `observations`.
 *
 * There is no acknowledgement, no «seen» state and no addressee: that is the
 * panel's, and the panel does not exist yet. An alert is a historical fact.
 */
import { z } from 'zod';
import { InstantSchema, MatchIdSchema, ObservationIdSchema } from '@/model/ids';

/**
 * The two rules that alert. RN-05 and RN-07 are the only ones `reglas.md`
 * writes «genera alerta al panel» about, and the list is closed for the same
 * reason `DECISION_RULES` is: a label that does not explain anything is fake
 * traceability.
 */
export const ALERT_RULES = ['RN-05', 'RN-07'] as const;
export const AlertRuleSchema = z.enum(ALERT_RULES);
export type AlertRule = z.infer<typeof AlertRuleSchema>;

const alertShape = {
  match_id: MatchIdSchema,
  rule: AlertRuleSchema,
  /** When the condition was ENTERED. ISO 8601 UTC string, never `Date`. */
  raised_at: InstantSchema,
  /**
   * Why, in text, and it is load-bearing: it is the FINGERPRINT of the
   * condition. A conflict that goes on saying the same thing produces the same
   * reason and therefore no second row; a discrepancy with other values
   * produces a different one and therefore a new alert (CA-6.6).
   */
  reason: z.string().min(1),
  /** The observations implicated. At least one: an alert about nothing lies. */
  observation_ids: z.tuple([ObservationIdSchema], ObservationIdSchema),
};

/** An alert as the engine emits it, before the database gives it an id. */
export const NewAlertSchema = z.object(alertShape).readonly();
export type NewAlert = z.infer<typeof NewAlertSchema>;

/** An alert as it comes back from the store. */
export const AlertSchema = z.object({ ...alertShape, id: z.int().min(1) }).readonly();
export type Alert = z.infer<typeof AlertSchema>;
