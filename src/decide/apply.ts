/**
 * The applicator: the ONLY impure part of the engine (SPEC-013 CA-11,
 * ADR-021 §3).
 *
 * It reads —`MatchStore.getById`, `ObservationStore.listByMatch`,
 * `DecisionStore.getLatestByMatch`, `AlertStore.latestByMatch`—, calls the
 * pure `decide`, and writes with `DecisionStore.append` and
 * `AlertStore.append`. It ends there: it shows nothing, serves no route,
 * computes no figure and sends no request (SPEC-013 §7).
 *
 * THE VERSION IS ARBITRATED BY THE DATABASE (ADR-017 §5, migration 0003). The
 * engine does NOT compute its version hoping to be alone: if `append` comes
 * back with `DecisionVersionConflictError`, the log moved under our feet, so
 * this REREADS AND RETRIES ONCE — with the whole decision recomputed, because
 * the answer may well be different against the new log — and if it collides
 * again it ABANDONS that match in this cycle and records why. There is no
 * retry loop and there is no guessed version (F-SPEC-008-V13, applied to what
 * reaches the screen).
 *
 * WHAT IT WRITES WHEN IT ABANDONS: nothing. Neither the decision nor its
 * alerts, because both were computed against a log that has already changed;
 * the next tick recomputes them from what is written, which is the whole point
 * of an engine whose state are the two logs (ADR-021 §2).
 */
import { DecisionVersionConflictError } from '@/db/decisions';
import { decide } from './rules';
import type { Alert, NewAlert } from './alert';
import type { AlertStore } from './ports';
import type { DecideConfig, DecideResult, Held } from './rules';
import type { MatchStore } from '@/calendar/ports';
import type { DecisionStore, ObservationStore } from '@/db/ports';
import type { Decision } from '@/model/decision';
import type { Instant, MatchId, SourceId } from '@/model/ids';
import type { Observation } from '@/model/observation';

/** Everything one pass of the engine drives. Durable state lives BEHIND these. */
export interface EnginePorts {
  readonly matches: MatchStore;
  readonly observations: ObservationStore;
  readonly decisions: DecisionStore;
  readonly alerts: AlertStore;
  readonly config: DecideConfig;
}

/** What one match produced. Diagnostic, not public API. */
export interface ApplyOutcome {
  readonly match_id: MatchId;
  readonly decision: Decision | null;
  readonly alerts: readonly Alert[];
  readonly held: Held | null;
  /** True when the log moved twice and this match was left for the next tick. */
  readonly abandoned: boolean;
  /** Why it was abandoned, or why nothing could be decided. `null` otherwise. */
  readonly reason: string | null;
}

const NOTHING = (match_id: MatchId, reason: string | null): ApplyOutcome => ({
  match_id,
  decision: null,
  alerts: [],
  held: null,
  abandoned: false,
  reason,
});

/** The latest observation of every source of a match, from the log. */
function latestBySource(
  observations: readonly Observation[],
): ReadonlyMap<SourceId, Observation> {
  const latest = new Map<SourceId, Observation>();
  for (const observation of observations) {
    const known = latest.get(observation.source);
    if (known === undefined) {
      latest.set(observation.source, observation);
      continue;
    }
    // `listByMatch` returns oldest first, but the store's order is not part of
    // the port's contract, so the comparison is made here and not assumed.
    if (known.observed_at <= observation.observed_at) {
      latest.set(observation.source, observation);
    }
  }
  return latest;
}

/**
 * Which trigger this pass is (ADR-021 §3): an `observation` when something
 * arrived after what we last published, a `time` when nothing did. Both cross
 * the same chain; the distinction is what makes the log readable.
 */
function triggerOf(
  observations: readonly Observation[],
  previous: Decision | null,
): { kind: 'observation' | 'time'; incoming: Observation | undefined } {
  let newest: Observation | undefined;
  for (const observation of observations) {
    if (newest === undefined || newest.observed_at <= observation.observed_at) {
      newest = observation;
    }
  }

  if (newest === undefined) return { kind: 'time', incoming: undefined };
  if (previous !== null && newest.observed_at <= previous.decided_at) {
    return { kind: 'time', incoming: undefined };
  }
  return { kind: 'observation', incoming: newest };
}

/** One read of the two logs, and one call to the pure reducer. */
async function evaluate(
  ports: EnginePorts,
  matchId: MatchId,
  now: Instant,
): Promise<{ result: DecideResult } | null> {
  const match = await ports.matches.getById(matchId);
  if (match === null) return null;

  const observations = await ports.observations.listByMatch(matchId);
  const previous = await ports.decisions.getLatestByMatch(matchId);
  const latestAlerts = await ports.alerts.latestByMatch(matchId);
  const trigger = triggerOf(observations, previous);

  return {
    result: decide({
      kind: trigger.kind,
      incoming: trigger.incoming,
      match,
      previous,
      latestBySource: latestBySource(observations),
      latestAlerts,
      now,
      config: ports.config,
    }),
  };
}

async function appendAlerts(
  ports: EnginePorts,
  alerts: readonly NewAlert[],
): Promise<readonly Alert[]> {
  const written: Alert[] = [];
  for (const alert of alerts) written.push(await ports.alerts.append(alert));
  return written;
}

/**
 * Runs the engine over ONE match and persists what it decided.
 *
 * Reads, decides, writes. A match nobody has observed writes nothing; a cycle
 * that produces no `Decision` writes no row, in `decisions` or in `alerts`.
 */
export async function applyEngine(
  ports: EnginePorts,
  matchId: MatchId,
  now: Instant,
): Promise<ApplyOutcome> {
  const first = await evaluate(ports, matchId, now);
  if (first === null) return NOTHING(matchId, `no match ${matchId} in the declared calendar`);

  try {
    return await persist(ports, matchId, first.result);
  } catch (error) {
    if (!(error instanceof DecisionVersionConflictError)) throw error;

    // The log moved under our feet. Reread and retry ONCE, recomputing the
    // whole decision: the answer against the new log may be a different one,
    // or none at all.
    const second = await evaluate(ports, matchId, now);
    if (second === null) return NOTHING(matchId, `no match ${matchId} in the declared calendar`);

    try {
      return await persist(ports, matchId, second.result);
    } catch (retry) {
      if (!(retry instanceof DecisionVersionConflictError)) throw retry;
      return {
        match_id: matchId,
        decision: null,
        alerts: [],
        held: null,
        abandoned: true,
        reason: `${retry.name}: ${retry.message}`,
      };
    }
  }
}

/** Writes what the reducer decided. The decision first, then its alerts. */
async function persist(
  ports: EnginePorts,
  matchId: MatchId,
  result: DecideResult,
): Promise<ApplyOutcome> {
  const decision =
    result.decision === null ? null : await ports.decisions.append(result.decision);

  return {
    match_id: matchId,
    decision,
    alerts: await appendAlerts(ports, result.alerts),
    held: result.held,
    abandoned: false,
    reason: null,
  };
}
