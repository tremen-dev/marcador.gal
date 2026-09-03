/**
 * The four operations of the panel: three that publish, and one that does not
 * (ADR-024 §5 and §7, SPEC-017 CA-2, CA-5, CA-6).
 *
 * THE THREE THAT PUBLISH ALL DO EXACTLY THE SAME THING, and what differs is
 * only how the proposal is built:
 *
 *   * `correccion`  — the state and the scoreboard the person typed. This is
 *     RN-04's human exception: lowering a scoreboard, and a jump of more than
 *     two goals that IS NOT HELD BACK because the retention does not reach
 *     weight ≥ 0.9 (RN-04, clarification of 2026-09-02; ADR-021 §8.1).
 *   * `estado`      — the state the person chose, with the scoreboard of the
 *     live `Decision` carried over. This is RN-06: `postponed` and `suspended`
 *     are reserved to the official source OR A HUMAN, and the official one is
 *     not capturable (ADR-008 §1), so this is the only way in. And it is also
 *     the other half of ADR-021 §8.3 — a human may take a match to any of the
 *     five states, including back from `finished` to `live`.
 *   * `ratificacion` — the state and the scoreboard OF THE LIVE `Decision`,
 *     unchanged. It is the operation that makes «the panel is the only route
 *     to a confirmed scoreboard» true, and the one that will be used most: it
 *     publishes nothing new and moves the qualifier from *provisional* to
 *     *confirmado* by the first path of RN-02, with weight 1.0 (CA-5.6).
 *
 * AND THE FOURTH, `acuse`, PRODUCES NOTHING AT ALL: no `Observation`, no
 * `Decision`. RN-05 says the conflict is not published, and acknowledging it
 * does not publish it either (CA-6.6).
 *
 * THIS MODULE IS PURE. It reads no clock, no database and no network: the
 * handler gives it the live `Decision` as data, exactly as the engine receives
 * its state as data (ADR-021 §2). What it returns is a proposal or a NAMED
 * REFUSAL — there is no third outcome and no degraded mode.
 */
import { hasScoreboard } from './observation';
import type { OperatorProposal } from './observation';
import type { AdminAction } from './archive';
import type { Decision } from '@/model/decision';
import type { MatchStatus } from '@/model/match';

/** What the form said, already read and typed. Nothing of the request beyond it. */
export interface ActionRequest {
  readonly action: AdminAction;
  readonly status: MatchStatus | null;
  readonly home_score: number | null;
  readonly away_score: number | null;
  /** The motive, verbatim as the person wrote it (CA-3.4). */
  readonly reason: string;
}

/**
 * Why a proposal could not be built. Both are DOMAIN refusals, which is why
 * they still leave a row in `operator_actions` (CA-8.2): they happened after
 * the person arrived and typed.
 */
export type ProposalFault = 'empty_reason' | 'nothing_to_ratify';

export type ProposalOutcome =
  | { readonly ok: true; readonly proposal: OperatorProposal }
  | { readonly ok: false; readonly fault: ProposalFault };

/**
 * THE MOTIVE IS OBLIGATORY AND NOT EMPTY (ADR-024 §6, CA-4.2). Whitespace is
 * not a motive: `rule` says which rule and `supporting_observation_ids` says
 * over what, but why a person lowered a scoreboard is nowhere else.
 */
export function hasMotive(reason: string): boolean {
  return reason.trim().length > 0;
}

/** The scoreboard of the live `Decision`, or nothing when there is none. */
function carriedScore(live: Decision | null): OperatorProposal {
  if (live === null) return { status: 'live', home_score: 0, away_score: 0 };
  return {
    status: live.status,
    home_score: live.home_score,
    away_score: live.away_score,
  };
}

/**
 * Builds what the operator proposes for one match.
 *
 * `live` is the live `Decision` of the match, or `null` when the engine has
 * never published one — a match nobody has observed yet, which the operator
 * can still correct, postpone or suspend.
 */
export function proposalFor(request: ActionRequest, live: Decision | null): ProposalOutcome {
  if (!hasMotive(request.reason)) return { ok: false, fault: 'empty_reason' };

  if (request.action === 'ratificacion') {
    // There is nothing to ratify when nothing has been published. Ratifying
    // «the current scoreboard» of a match with no decision would be inventing
    // one, which is the shape ADR-022 §5 already refused for the bot.
    if (live === null) return { ok: false, fault: 'nothing_to_ratify' };
    return { ok: true, proposal: carriedScore(live) };
  }

  const status: MatchStatus = request.status ?? carriedScore(live).status;

  if (request.action === 'estado') {
    // The state the person chose; the scoreboard is carried over from what is
    // published, because changing a state is not typing a scoreboard.
    const carried = carriedScore(live);
    return {
      ok: true,
      proposal: hasScoreboard(status)
        ? { status, home_score: carried.home_score ?? 0, away_score: carried.away_score ?? 0 }
        : { status, home_score: null, away_score: null },
    };
  }

  // `correccion`: exactly what the person typed, under the scoreboard rule of
  // the five branches (SPEC-001 CA-18).
  return {
    ok: true,
    proposal: hasScoreboard(status)
      ? { status, home_score: request.home_score ?? 0, away_score: request.away_score ?? 0 }
      : { status, home_score: null, away_score: null },
  };
}

/** True when the action targets an alert instead of a match. */
export function targetsAlert(action: AdminAction): boolean {
  return action === 'acuse';
}
