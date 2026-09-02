/**
 * The engine's numbers, each in ONE place, with the rule it comes from
 * (SPEC-013 CA-6.8 and CA-7.6).
 *
 * The shape is `src/ingest/windows.ts`'s and the reason is the same: a
 * threshold written twice is a threshold that moves once. Every one of them
 * reaches the reducer through `DecideConfig`, so a test moves a border by
 * overriding the field and never by editing a second literal.
 *
 * WHICH OF THESE ARE RULE AND WHICH ARE CHOICE, said out loud: the three of
 * RN-06 and RN-07 are written in `reglas.md` and moving them needs a
 * signature; `CONFLICT_GRACE_MS` is NOT in `reglas.md` on purpose — the rule
 * says «un plazo de gracia» and leaves the number to the code, «precisamente
 * para que moverlo sea un diff y no una firma» (RN-05, aclaración of
 * 2026-09-02). It is CHOSEN, NOT MEASURED, like `PRE`, `POST` and the 6 h of
 * ADR-014 §3.2, and it is revised with the first matchday in front of it.
 */

const MINUTE_MS = 60_000;

/**
 * RN-06 — `scheduled → live` with the first observation of play AFTER
 * `kickoff − 2 min`.
 */
export const LIVE_LEAD_MS = 2 * MINUTE_MS;

/**
 * RN-06 — `live → finished` by `kickoff + 110 min` with no signal. That
 * `Decision` comes out *pendente de confirmar* (ADR-021 §6).
 */
export const FINISH_TIMEOUT_MS = 110 * MINUTE_MS;

/** RN-07 — a `live` match with no new observation in 15 min is *sen sinal*. */
export const SILENCE_MS = 15 * MINUTE_MS;

/**
 * ADR-021 §8.2 — how long a discrepancy has to stand before it is a conflict,
 * counted from the more recent of the two observations that disagree.
 *
 * IT GOVERNS ONLY THE ALERT (gate of 2026-09-02, F-SPEC-013-1). During the
 * grace what the rules decide is published, marked *provisional* (RN-03);
 * three minutes of retained publication would have spent more than the whole
 * latency budget of EPIC-002. CHOSEN, NOT MEASURED: at one tick per minute it
 * is three chances to agree.
 */
export const CONFLICT_GRACE_MS = 3 * MINUTE_MS;

/** RN-02 — a single observation of weight ≥ 0.9 publishes *confirmado*. */
export const CONFIRMED_WEIGHT = 0.9;

/** RN-02 — the second way: two INDEPENDENT sources of weight ≥ 0.7 agreeing. */
export const INDEPENDENT_WEIGHT = 0.7;

/**
 * RN-04 — a jump of MORE than 2 goals in a single observation is retained
 * until a second source. Exactly 2 is not a jump: the border is the rule's.
 */
export const BIG_JUMP_GOALS = 2;

/** Every number the reducer reads, handed over as one value. */
export interface DecideThresholds {
  readonly liveLeadMs: number;
  readonly finishTimeoutMs: number;
  readonly silenceMs: number;
  readonly conflictGraceMs: number;
  readonly confirmedWeight: number;
  readonly independentWeight: number;
  readonly bigJumpGoals: number;
}

export const DEFAULT_THRESHOLDS: DecideThresholds = {
  liveLeadMs: LIVE_LEAD_MS,
  finishTimeoutMs: FINISH_TIMEOUT_MS,
  silenceMs: SILENCE_MS,
  conflictGraceMs: CONFLICT_GRACE_MS,
  confirmedWeight: CONFIRMED_WEIGHT,
  independentWeight: INDEPENDENT_WEIGHT,
  bigJumpGoals: BIG_JUMP_GOALS,
};
