/**
 * What the operator sees in order to be able to ARBITRATE (RN-01, ADR-021 §6,
 * D-8, SPEC-017 CA-12).
 *
 * RN-01's least-quoted sentence is a requirement of interface, not decoration:
 * the operator «arbitra desde el panel, CON EL CONTEXTO DE TODAS LAS FUENTES Y
 * DEL HISTÓRICO DELANTE». Without that, weight 1.0 is exercised blind.
 *
 * THE QUALIFIER IS `qualifierOf`, IMPORTED, NEVER REIMPLEMENTED (CA-12.1). It
 * is derived from the live `Decision` and the observations that sustain it
 * (ADR-021 §6), and a second implementation here would be a fifth stored truth
 * that can drift from the four columns beside it.
 *
 * THE BOARD IS A WORK QUEUE AND IT IS ORDERED BY WHAT NEEDS A PERSON — an open
 * alert, then *sen sinal*, then `live`, then the rest — AND NOT BY QUALIFIER
 * (CA-12.3). And that is where this module stops: WHICH OF THE TWO QUALIFIERS
 * IS THE NORMAL STATE ON THE SCOREBOARD'S SCREEN is entry 1 of the frozen
 * inventory of EPIC-004, this spec does not answer it, and the entry keeps its
 * trigger (CA-12.4). In a panel neither of the two is decoration and the
 * question does not arise; on the scoreboard it does, and the snapshot spec
 * answers it.
 *
 * Pure on purpose: the handler hands it the matches, the decisions, the
 * observations and the tray as data.
 */
import { qualifierOf } from '@/decide/qualifier';
import { epochMsOf } from '@/polite/clock';
import type { Decision } from '@/model/decision';
import type { Instant, MatchId } from '@/model/ids';
import type { Match, MatchStatus } from '@/model/match';
import type { Observation } from '@/model/observation';
import type { MatchQualifier } from '@/model/qualifier';

/** One row of the board. Everything a person needs before deciding. */
export interface BoardRow {
  readonly match: Match;
  /** The canonical names of the RFGF. They are NEVER translated (dominio.md). */
  readonly home: string;
  readonly away: string;
  readonly status: MatchStatus;
  readonly home_score: number | null;
  readonly away_score: number | null;
  /** `null` when the engine has never published for this match. */
  readonly qualifier: MatchQualifier | null;
  /** The instant of the newest observation of the match, or `null`. */
  readonly last_observed_at: Instant | null;
  readonly open_alerts: number;
}

export interface BoardRowInput {
  readonly match: Match;
  readonly home: string;
  readonly away: string;
  readonly live: Decision | null;
  readonly observations: readonly Observation[];
  readonly open_alerts: number;
}

/** The observations that sustain a decision, in the order they were logged. */
export function supportingOf(
  decision: Decision,
  observations: readonly Observation[],
): readonly Observation[] {
  const wanted = new Set<string>(decision.supporting_observation_ids);
  return observations.filter((observation) => wanted.has(observation.id));
}

/** The newest `observed_at` of a log, or `null` for an empty one. */
export function lastObservedAt(observations: readonly Observation[]): Instant | null {
  let newest: Instant | null = null;
  for (const observation of observations) {
    if (newest === null || epochMsOf(observation.observed_at) > epochMsOf(newest)) {
      newest = observation.observed_at;
    }
  }
  return newest;
}

/** Builds one row. The qualifier comes from `src/decide/`, never from here. */
export function boardRow(input: BoardRowInput): BoardRow {
  const live = input.live;

  return {
    match: input.match,
    home: input.home,
    away: input.away,
    status: live?.status ?? 'scheduled',
    home_score: live?.home_score ?? null,
    away_score: live?.away_score ?? null,
    qualifier: live === null ? null : qualifierOf(live, supportingOf(live, input.observations)),
    last_observed_at: lastObservedAt(input.observations),
    open_alerts: input.open_alerts,
  };
}

/**
 * THE ORDER OF A WORK QUEUE (CA-12.3). Lower rank comes first:
 *
 *   0. an open alert — somebody has to look at this now (RN-05, RN-07);
 *   1. *sen sinal* — the match is live and nothing has arrived in 15 min;
 *   2. `live` — it is being played;
 *   3. everything else.
 *
 * NOT BY QUALIFIER. `provisional` is the normal state of this system today
 * (ADR-008 §1) and sorting by it would put the whole board in one bucket.
 */
export function boardRank(row: BoardRow): number {
  if (row.open_alerts > 0) return 0;
  if (row.qualifier === 'sen_sinal') return 1;
  if (row.status === 'live') return 2;
  return 3;
}

/** The board, ordered. Ties break by kickoff and then by id: total, always. */
export function orderBoard(rows: readonly BoardRow[]): readonly BoardRow[] {
  return [...rows].sort((a, b) => {
    const byRank = boardRank(a) - boardRank(b);
    if (byRank !== 0) return byRank;
    const byKickoff = epochMsOf(a.match.kickoff) - epochMsOf(b.match.kickoff);
    if (byKickoff !== 0) return byKickoff;
    return a.match.id < b.match.id ? -1 : 1;
  });
}

/** The detail of one match: every source and the whole log (CA-12.2). */
export interface MatchDetail {
  readonly row: BoardRow;
  /** Every `Observation` of the match, newest first, with its source. */
  readonly observations: readonly Observation[];
  /** The whole `Decision` log, newest version first. */
  readonly decisions: readonly Decision[];
}

export function matchDetail(
  row: BoardRow,
  observations: readonly Observation[],
  decisions: readonly Decision[],
): MatchDetail {
  return {
    row,
    observations: [...observations].sort(
      (a, b) => epochMsOf(b.observed_at) - epochMsOf(a.observed_at),
    ),
    decisions: [...decisions].sort((a, b) => b.version - a.version),
  };
}

/** The identifiers of the matches on the board, for the alert reader. */
export function boardMatchIds(rows: readonly BoardRow[]): readonly MatchId[] {
  return rows.map((row) => row.match.id);
}
