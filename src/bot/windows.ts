/**
 * The CORRESPONDENT's window, which is not the tick's (SPEC-015 CA-6.2,
 * ADR-022 §5).
 *
 * `PRE`/`POST` of ADR-019 §2 — 10 and 150 minutes — bound WHEN SOMETHING IS
 * ASKED OF A THIRD PARTY. That is a courtesy budget (RN-11) and it has nothing
 * to say about a person: someone standing at the ground can warn of a
 * postponement two hours before the scheduled kickoff, and nobody is being
 * asked for anything when they do.
 *
 * So the bot has its own two numbers, here and in one place only. They are
 * CHOSEN, NOT MEASURED — like the ones of ADR-019 §2 and the 6 h of ADR-014
 * §3.2 — and revisable with the first matchday in front of them: moving them
 * is a one-line diff.
 *
 * The bot does NOT import the tick's constants, and a case asserts it: sharing
 * them would tie a courtesy budget to a human's reach without anybody
 * deciding it.
 */

/** Three hours before kickoff: a postponement is known well in advance. */
export const CORRESPONDENT_PRE_KICKOFF_MS = 180 * 60 * 1000;

/** Four hours after: a suspended match can take a long time to resolve. */
export const CORRESPONDENT_POST_KICKOFF_MS = 240 * 60 * 1000;

export interface CorrespondentWindowBounds {
  readonly preMs: number;
  readonly postMs: number;
}

/** The two numbers, together, as every caller receives them. */
export const CORRESPONDENT_WINDOW: CorrespondentWindowBounds = {
  preMs: CORRESPONDENT_PRE_KICKOFF_MS,
  postMs: CORRESPONDENT_POST_KICKOFF_MS,
};

/**
 * How long a pending proposal lives (CA-7.3). One named constant, one place.
 *
 * Ten minutes: long enough to look up from the pitch and press a button, short
 * enough that a scoreboard confirmed from memory is not a scoreboard.
 */
export const PROPOSAL_TTL_MS = 10 * 60 * 1000;
