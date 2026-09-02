/**
 * Eligibility as a pure function (SPEC-012 CA-1, ADR-019 §2 and §3).
 *
 * A match is IN WINDOW at `t` when `kickoff − PRE ≤ t < kickoff + POST`. The
 * two numbers are CHOSEN, NOT MEASURED (ADR-019 §2): they live here as named
 * constants, in one place, revisable with the evidence of the first matchday
 * in front of them. Nothing else in the repository may repeat them.
 *
 * And the set is BOUNDED BY DECLARED MEASUREMENT WINDOWS (ADR-019 §3): a match
 * whose kickoff falls outside every declared `[from, to)` interval is not
 * eligible however live its window is. The declared list is born EMPTY
 * (`src/ingest/measurement.ts`), so a deployment with nothing declared asks
 * for nothing — the closed failure here is the natural state, not an error
 * mode (RN-11, ADR-008 §5.2).
 *
 * Pure on purpose: no clock, no network, no database. The tick hands it the
 * instant and the matches; instants are ISO 8601 UTC strings, never `Date`
 * (ADR-006) — arithmetic goes through `epochMsOf`, the one converter.
 */
import { epochMsOf } from '@/polite/clock';
import type { CompetitionId, Instant } from '@/model/ids';

/** ADR-019 §2: start looking 10 minutes before kickoff. */
export const PRE_KICKOFF_MS = 10 * 60 * 1000;

/** ADR-019 §2: keep looking 150 minutes after kickoff. */
export const POST_KICKOFF_MS = 150 * 60 * 1000;

export interface MatchWindowBounds {
  readonly preMs: number;
  readonly postMs: number;
}

/** The two numbers, together, as every caller receives them. */
export const MATCH_WINDOW: MatchWindowBounds = {
  preMs: PRE_KICKOFF_MS,
  postMs: POST_KICKOFF_MS,
};

/**
 * One declared measurement window (ADR-019 §3): a closed-open interval
 * `[from, to)` over kickoffs, WITH ITS MOTIVE WRITTEN — like an entry of
 * `ALLOWED_PACKAGES` (ADR-016 §3.2 by analogy). Each one is also the unit the
 * retention of ADR-020 hangs from.
 */
export interface MeasurementWindow {
  readonly from: Instant;
  readonly to: Instant;
  /** Why this interval may be measured («jornada N, cargada el …»). */
  readonly motive: string;
}

/** The slice of a `Match` that eligibility reads. */
export interface EligibleMatch {
  readonly kickoff: Instant;
  readonly competition_id: CompetitionId;
}

/** `kickoff − PRE ≤ t < kickoff + POST` (ADR-019 §2). */
export function isInMatchWindow(
  kickoff: Instant,
  at: Instant,
  bounds: MatchWindowBounds = MATCH_WINDOW,
): boolean {
  const kickoffMs = epochMsOf(kickoff);
  const atMs = epochMsOf(at);
  return kickoffMs - bounds.preMs <= atMs && atMs < kickoffMs + bounds.postMs;
}

/** Whether a kickoff falls inside SOME declared `[from, to)` interval. */
export function inMeasurementWindow(
  kickoff: Instant,
  windows: readonly MeasurementWindow[],
): boolean {
  const kickoffMs = epochMsOf(kickoff);
  return windows.some(
    (window) => epochMsOf(window.from) <= kickoffMs && kickoffMs < epochMsOf(window.to),
  );
}

/**
 * The competitions with at least one match in window at `t` whose kickoff
 * falls inside a declared measurement window — each one once, in order of
 * first appearance. With the declared list empty, nothing is eligible.
 */
export function eligibleCompetitions(
  matches: readonly EligibleMatch[],
  windows: readonly MeasurementWindow[],
  at: Instant,
  bounds: MatchWindowBounds = MATCH_WINDOW,
): readonly CompetitionId[] {
  const eligible: CompetitionId[] = [];

  for (const match of matches) {
    if (!isInMatchWindow(match.kickoff, at, bounds)) continue;
    if (!inMeasurementWindow(match.kickoff, windows)) continue;
    if (!eligible.includes(match.competition_id)) eligible.push(match.competition_id);
  }

  return eligible;
}
