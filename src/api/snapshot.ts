/**
 * THE PROJECTION: a PURE function from the two logs and the declared calendar
 * to the payload of `contract.ts` (SPEC-018 CA-4, CA-5, CA-11; ADR-027 §2).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IT DOES NOT DECIDE, AND THIS IS WHERE A SCREEN BREAKS RN-08 WITHOUT MEANING
 * TO. Its rule is one line: everything the screen shows comes out of a WRITTEN
 * `Decision` or out of the DECLARED CALENDAR, and nothing else.
 *
 *   1. THE QUALIFIER COMES FROM `qualifierOf` (`src/decide/qualifier.ts`,
 *      ADR-021 §6), NEVER REIMPLEMENTED. This module does not contain one
 *      single literal of `MATCH_QUALIFIERS`, and a case asserts it.
 *   2. IT DOES NOT AGE A DATUM. If the live `Decision` is `live` and its
 *      `decided_at` is forty minutes old, the projection says `live` with its
 *      instant, NOT *sen sinal*. *Sen sinal* is a qualifier of the domain that
 *      EMITS A `Decision` (ADR-021 §6), and a screen that deduced it by itself
 *      would be publishing a qualifier NO `Decision` SUSTAINS — which RN-08 and
 *      D-3 forbid without the exception `reglas.md` bothers to deny the
 *      correspondent. And there is a practical motive on top of the one of
 *      principle: the result would depend on the reader's clock, so two people
 *      would see different qualifiers of the same match.
 *
 *      HENCE: THIS FILE READS NO CLOCK. No `Clock`, no `Date`, no `Date.now`.
 *      A case asserts it over this source, with a positive control.
 *   3. IT WRITES NOTHING. Not a `Decision`, not an `Observation`, not an
 *      `alert_ack`, not an `operator_action`, not a visits table. And it does
 *      not call the engine: there is no route from here to `runEngineForMatch`
 *      or to `src/decide/cycle.ts`.
 *
 * CONSEQUENCE THAT IS ACCEPTED HEAD ON (ADR-027 §2.3, CA-4.6): outside a
 * declared matchday the engine does not run, so NOBODY WRITES THE `Decision` OF
 * RN-07 and a match can stay `live` for ever in the log. The right answer is
 * NOT for the screen to cover it up: it is for the screen to show WHEN THE LAST
 * DATUM WAS (§4) and for whoever reads it to see that it is old. Covering the
 * hole by computing would be lying with a better appearance.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE APERTURE IS BOUNDED ON BOTH AXES, NOT ONE (ADR-027 §3.b).
 *
 * `MEASUREMENT_WINDOWS` bounds WHEN — a match whose `kickoff` falls outside
 * every declared interval DOES NOT APPEAR, however loaded the calendar is —
 * and `PUBLISHED_COMPETITIONS` bounds WHAT. With the first list empty, which
 * is its state today, the payload is an empty list and NOT ONE QUERY IS MADE.
 *
 * THAT IS ALSO THE EMERGENCY STOP, and it is written where it will be looked
 * for: STOPPING IS EMPTYING `MEASUREMENT_WINDOWS`. No line of logic to touch.
 */
import { qualifierOf } from '@/decide/qualifier';
import { epochMsOf } from '@/polite/clock';
import { isPublishedCompetition } from './contract';
import type { BoardRowPayload, BoardSnapshot, PublishedInstant } from './contract';
import type { BoardMatchRead } from './ports';
import type { CompetitionId, Instant, TeamId } from '@/model/ids';
import type { Match } from '@/model/match';
import type { Observation } from '@/model/observation';

/**
 * An instant as the contract publishes it: minute-rounded UTC (CA-8.1).
 *
 * A STRING OPERATION AND NOTHING ELSE — `2026-09-06T17:23:45.000Z` becomes
 * `2026-09-06T17:23Z`. It reads no clock and it constructs no `Date`, which is
 * what keeps this module pure.
 */
export function publishedInstant(instant: Instant): PublishedInstant {
  return `${instant.slice(0, 16)}Z`;
}

/** The newest `observed_at` of a set of observations, or `null`. */
function newestObservedAt(observations: readonly Observation[]): Instant | null {
  let newest: Instant | null = null;
  for (const observation of observations) {
    if (newest === null || epochMsOf(observation.observed_at) > epochMsOf(newest)) {
      newest = observation.observed_at;
    }
  }
  return newest;
}

/**
 * THE ORDER, AND IT IS NEVER BY QUALIFIER OR BY STATE (ADR-027 §8.4, CA-11).
 *
 * By competition, then by ascending `kickoff`, then by `match_id` — a TOTAL and
 * DETERMINISTIC tie-break, so two renderings of the same data never order
 * differently. The motive is of use before it is of principle: if a match rises
 * when it starts and falls when it ends, WHOEVER IS LOOKING LOSES SIGHT OF
 * THEIRS EXACTLY WHEN THEY ARE LOOKING HARDEST.
 *
 * It deliberately does NOT reuse `orderBoard`/`boardRank` of
 * `src/admin/board.ts`: the panel is a WORK QUEUE and sorts by what needs a
 * person; this is a matchday.
 */
export function compareBoardRows(a: BoardRowPayload, b: BoardRowPayload): number {
  if (a.competition_id !== b.competition_id) {
    return a.competition_id < b.competition_id ? -1 : 1;
  }
  const byKickoff = epochMsOf(`${a.kickoff.slice(0, 16)}:00Z`) - epochMsOf(`${b.kickoff.slice(0, 16)}:00Z`);
  if (byKickoff !== 0) return byKickoff;
  if (a.match_id === b.match_id) return 0;
  return a.match_id < b.match_id ? -1 : 1;
}

export interface SnapshotInput {
  /** The matches of the declared matchdays. Already bounded by WHEN. */
  readonly matches: readonly Match[];
  /** The batch read of the two logs, one entry per match. */
  readonly reads: readonly BoardMatchRead[];
  /** The canonical RFGF names of the teams. */
  readonly teamNames: ReadonlyMap<TeamId, string>;
  /** The canonical RFGF names of the competitions. */
  readonly competitionNames: ReadonlyMap<CompetitionId, string>;
  /** Whether any matchday is declared at all. Tells the two empties apart. */
  readonly matchdayDeclared: boolean;
}

/**
 * The projection. Pure, total, and with no way out: it takes values and gives
 * back the payload of `contract.ts`.
 */
export function projectBoard(input: SnapshotInput): BoardSnapshot {
  const byMatch = new Map<string, BoardMatchRead>(
    input.reads.map((read) => [read.match_id, read]),
  );

  const rows: BoardRowPayload[] = [];
  let newestDecidedAt: Instant | null = null;

  for (const match of input.matches) {
    // THE SECOND BOUND. A match of a competition nobody put on the list does
    // not come out, in HTML or in JSON (CA-3.5).
    if (!isPublishedCompetition(match.competition_id)) continue;

    const read = byMatch.get(match.id) ?? null;
    const live = read?.live ?? null;
    const supporting = read?.supporting ?? [];

    if (live !== null) {
      if (newestDecidedAt === null || epochMsOf(live.decided_at) > epochMsOf(newestDecidedAt)) {
        newestDecidedAt = live.decided_at;
      }
    }

    const lastObserved = newestObservedAt(supporting);

    rows.push({
      match_id: match.id,
      competition_id: match.competition_id,
      competition_name: input.competitionNames.get(match.competition_id) ?? match.competition_id,
      round: match.round,
      kickoff: publishedInstant(match.kickoff),
      home: input.teamNames.get(match.home_id) ?? match.home_id,
      away: input.teamNames.get(match.away_id) ?? match.away_id,
      // With no `Decision` the row keeps its declared hour and its two
      // canonical names, and the state is the initial one of `dominio.md`.
      // The SCOREBOARD and the QUALIFIER stay empty, and the screen says so
      // with its own literal — never with one of the four (ADR-027 §6.3).
      status: live?.status ?? 'scheduled',
      home_score: live?.home_score ?? null,
      away_score: live?.away_score ?? null,
      qualifier: live === null ? null : qualifierOf(live, supporting),
      last_observed_at: lastObserved === null ? null : publishedInstant(lastObserved),
    });
  }

  rows.sort(compareBoardRows);

  return {
    // THE `version` IS DERIVED (ADR-027 §7.1): the newest `decided_at` of the
    // set served, or `null` when the set has no `Decision`. No global counter
    // and no version table.
    version: newestDecidedAt === null ? null : publishedInstant(newestDecidedAt),
    matchday_declared: input.matchdayDeclared,
    matches: rows,
  };
}
