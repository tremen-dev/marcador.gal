/**
 * The CLOSED LIST of matches a message may be about (ADR-017, ADR-018 §3,
 * ADR-022 §5, SPEC-015 CA-6, CA-13).
 *
 * Four filters, and each one has its own case with a match that passes and a
 * match that does not (CA-6.1):
 *
 *   1. it is in the DECLARED CALENDAR, which is the list of authority (ADR-017);
 *   2. its kickoff is inside the CORRESPONDENT's window (`./windows.ts`), which
 *      is NOT the tick's (CA-6.2);
 *   3. its competition is one the catalogue declares for THAT
 *      `correspondent_id` (ADR-022 §2);
 *   4. its kickoff falls inside a DECLARED MEASUREMENT MATCHDAY, checked with
 *      `inMeasurementWindow` — the function that already exists, never a second
 *      implementation (CA-13.3).
 *
 * The fourth is the key that keeps the bot off (ADR-022 §7): the declared list
 * is born empty, so with the production configuration this function returns
 * NOTHING, whatever the calendar holds.
 *
 * Pure on purpose: no clock, no network, no database. The caller hands in the
 * instant and the matches, and instants are ISO 8601 UTC strings, never `Date`
 * (ADR-006).
 */
import { inMeasurementWindow } from '@/ingest/windows';
import { epochMsOf } from '@/polite/clock';
import { CORRESPONDENT_WINDOW } from './windows';
import type { CorrespondentWindowBounds } from './windows';
import type { MatchCandidate } from './prompt';
import type { MeasurementWindow } from '@/ingest/windows';
import type { Instant } from '@/model/ids';
import type { Match } from '@/model/match';

/** A match of the declared calendar with its two canonical names resolved. */
export interface NamedMatch {
  readonly match: Match;
  /** The canonical name of the RFGF. NEVER what the person wrote (CA-6.5). */
  readonly home: string;
  readonly away: string;
}

export interface CandidateInput {
  readonly matches: readonly NamedMatch[];
  /** The competitions the catalogue declares for this correspondent. */
  readonly competitions: readonly string[];
  readonly windows: readonly MeasurementWindow[];
  readonly at: Instant;
  readonly bounds?: CorrespondentWindowBounds | undefined;
}

/** `kickoff − PRE ≤ t < kickoff + POST`, with the CORRESPONDENT's numbers. */
export function inCorrespondentWindow(
  kickoff: Instant,
  at: Instant,
  bounds: CorrespondentWindowBounds = CORRESPONDENT_WINDOW,
): boolean {
  const kickoffMs = epochMsOf(kickoff);
  const atMs = epochMsOf(at);
  return kickoffMs - bounds.preMs <= atMs && atMs < kickoffMs + bounds.postMs;
}

/**
 * Whether a declared measurement matchday is open for this correspondent at
 * `at`. It is the THIRD step of the flow of §2 — before any archiving, before
 * the model, before any row — and it is why the production deployment answers a
 * neutral phrase and keeps nothing (CA-13.1).
 */
export function matchdayIsOpen(input: CandidateInput): boolean {
  const bounds = input.bounds ?? CORRESPONDENT_WINDOW;
  return input.matches.some(
    (named) =>
      inCorrespondentWindow(named.match.kickoff, input.at, bounds) &&
      inMeasurementWindow(named.match.kickoff, input.windows),
  );
}

/** The four filters, in order, over the declared calendar. */
export function candidatesFor(input: CandidateInput): readonly MatchCandidate[] {
  const bounds = input.bounds ?? CORRESPONDENT_WINDOW;

  return input.matches
    .filter((named) => inCorrespondentWindow(named.match.kickoff, input.at, bounds))
    .filter((named) => input.competitions.includes(named.match.competition_id))
    .filter((named) => inMeasurementWindow(named.match.kickoff, input.windows))
    .map((named) => ({
      match_id: named.match.id,
      home: named.home,
      away: named.away,
      kickoff: named.match.kickoff,
    }));
}
