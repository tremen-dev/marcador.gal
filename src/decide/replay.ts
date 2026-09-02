/**
 * Deterministic replay of one match, WITHOUT NETWORK AND WITHOUT DATABASE
 * (SPEC-013 CA-14, ADR-021 §2, RN-10, D-5, D-6).
 *
 * This is the capability the raw store exists for: an archived matchday can be
 * decided again, with a corrected parser, and produce the same log. It is also
 * the executable form of the word «trazable» of D-6 — replaying the log of
 * observations of a match from scratch has to produce exactly the same log of
 * decisions — and the reason the reducer is pure.
 *
 * IT TOUCHES NO CLOCK. Every instant it feeds `decide` comes from the log
 * itself or from the timeline the caller declares; `Date.now` is never read,
 * which is what makes the replay of a matchday of 2026 give the same answer in
 * 2027. A case poisons `Date.now` and this stays green.
 *
 * The timeline is minute by minute because that is the rhythm of the real
 * cycle (one cron tick per minute, ADR-019 §1): replaying at a finer grain
 * would produce a log the cycle could not have produced, and CA-14.2 compares
 * the two.
 */
import { epochMsOf, instantOf } from '@/polite/clock';
import { decide } from './rules';
import type { Alert, NewAlert } from './alert';
import type { LatestAlerts } from './ports';
import type { DecideConfig } from './rules';
import type { Decision } from '@/model/decision';
import type { Instant, SourceId } from '@/model/ids';
import type { Match } from '@/model/match';
import type { Observation } from '@/model/observation';

/** The rhythm of the real cycle: one tick per minute (ADR-019 §1). */
export const REPLAY_TICK_MS = 60_000;

export interface ReplayInput {
  readonly match: Match;
  /** The whole observation log of the match, in any order. */
  readonly observations: readonly Observation[];
  readonly config: DecideConfig;
  /**
   * The instants at which the engine is run. When absent, one per minute from
   * the first observation to `until`.
   */
  readonly instants?: readonly Instant[] | undefined;
  /** Where the generated timeline ends. Defaults to the last observation. */
  readonly until?: Instant | undefined;
  readonly tickMs?: number | undefined;
}

export interface ReplayResult {
  readonly decisions: readonly Decision[];
  /** The alerts, in the order they were raised, with the ids the log gave. */
  readonly alerts: readonly Alert[];
}

/** Oldest first, and total: same input, same order, every time. */
function ordered(observations: readonly Observation[]): readonly Observation[] {
  return [...observations].sort((a, b) => {
    const byTime = epochMsOf(a.observed_at) - epochMsOf(b.observed_at);
    if (byTime !== 0) return byTime;
    return a.id < b.id ? -1 : 1;
  });
}

/** The generated timeline: one instant per minute over the log's span. */
export function replayInstants(input: ReplayInput): readonly Instant[] {
  if (input.instants !== undefined) return input.instants;

  const log = ordered(input.observations);
  if (log.length === 0) return [];

  const step = input.tickMs ?? REPLAY_TICK_MS;
  const from = epochMsOf(log[0]!.observed_at);
  const to = epochMsOf(input.until ?? log[log.length - 1]!.observed_at);

  const instants: Instant[] = [];
  for (let cursor = from; cursor <= to; cursor += step) instants.push(instantOf(cursor));
  // The last instant is always in, so an observation at the very end is seen.
  if (instants.length === 0 || epochMsOf(instants[instants.length - 1]!) < to) {
    instants.push(instantOf(to));
  }
  return instants;
}

/**
 * Replays a match: the same two logs in, the same log of decisions out.
 *
 * The engine's state is derived here exactly as the applicator derives it from
 * the database — the latest observation per source, the live `Decision`, the
 * latest alert per rule — so the replay is not a second engine: it is the same
 * one, fed from memory.
 */
export function replayMatch(input: ReplayInput): ReplayResult {
  const log = ordered(input.observations);
  const decisions: Decision[] = [];
  const alerts: Alert[] = [];

  let previous: Decision | null = null;
  let consumed = 0;
  const latestBySource = new Map<SourceId, Observation>();

  for (const now of replayInstants(input)) {
    const nowMs = epochMsOf(now);

    // Everything observed up to this instant, and the newest of what arrived
    // since the previous instant: the applicator's `triggerOf`, in memory.
    let incoming: Observation | undefined;
    while (consumed < log.length && epochMsOf(log[consumed]!.observed_at) <= nowMs) {
      const observation = log[consumed]!;
      latestBySource.set(observation.source, observation);
      incoming = observation;
      consumed += 1;
    }

    const latestAlerts: LatestAlerts = {
      conflict: lastOf(alerts, 'RN-05'),
      silence: lastOf(alerts, 'RN-07'),
    };

    const result = decide({
      kind: incoming === undefined ? 'time' : 'observation',
      incoming,
      match: input.match,
      previous,
      latestBySource,
      latestAlerts,
      now,
      config: input.config,
    });

    for (const raised of result.alerts) alerts.push(withId(raised, alerts.length + 1));
    if (result.decision !== null) {
      decisions.push(result.decision);
      previous = result.decision;
    }
  }

  return { decisions, alerts };
}

function lastOf(alerts: readonly Alert[], rule: Alert['rule']): Alert | null {
  for (let index = alerts.length - 1; index >= 0; index -= 1) {
    const alert = alerts[index]!;
    if (alert.rule === rule) return alert;
  }
  return null;
}

/**
 * The id the durable store would have given it. The replay assigns them in the
 * order they were raised, which is the order the identity column would.
 */
function withId(alert: NewAlert, id: number): Alert {
  return { ...alert, id };
}
