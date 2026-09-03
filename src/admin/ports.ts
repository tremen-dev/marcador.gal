/**
 * The ports of the panel (SPEC-017 §1; ADR-024 §7 and §8).
 *
 * New interfaces in a new file, like the ports of SPEC-010, SPEC-011, SPEC-013
 * and SPEC-015: a new capability fits in a new interface, and `src/db/ports.ts`
 * is the contract of a spec that is done. The Postgres implementations live in
 * `src/db/admin.ts`, which is where every implementation of a port of this
 * repository lives.
 *
 * NO MEMBER OF `AdminPorts` IS A DECISION STORE (CA-2.5). The engine enters as
 * a FUNCTION — the narrow door of `src/decide/engine-entry.ts`, imported by
 * name and bound in the composition — and so does the reading of the decision
 * log (`src/decide/read-entry.ts`). What the panel holds is the ability to
 * ASK, never the capability RN-08 denies it: `DECISION_WRITERS` does not grow,
 * and the case of SPEC-013 that asserts it has exactly two entries passes
 * without touching an assertion.
 *
 * THE TYPES ARE IMPORTED WITH `import type` AT THE TOP, never with an inline
 * `import('…')` in a type position. That is not style: the compiler names an
 * inline one as a DYNAMIC module, and a dynamic import of anything under
 * `src/decide/` is an offence of the frontier of RN-08 — which is exactly what
 * that frontier should say about a dynamic import, and exactly what this file
 * must not do.
 *
 * AND NO PORT HERE CARRIES A PERSON. `alert_acks` and `operator_actions` have
 * no column able to hold an `operator_id` (ADR-024 §6): that lives in the
 * redacted raw object and nowhere else durable, which is the same regime
 * ADR-022 §2 gave the correspondent.
 */
import type { AdminAction } from './archive';
import type { MatchStore } from '@/calendar/ports';
import type { Alert } from '@/decide/alert';
import type { EngineOutcomeSummary } from '@/decide/engine-entry';
import type { ObservationStore } from '@/db/ports';
import type { MeasurementWindow } from '@/ingest/windows';
import type { Decision } from '@/model/decision';
import type { Instant, MatchId, TeamId } from '@/model/ids';
import type { Clock } from '@/polite/clock';
import type { RawRef } from '@/raw/key';
import type { RawStore } from '@/raw/store';

/** The acknowledgement of ONE alert row. Never of a condition (ADR-024 §7). */
export interface AlertAck {
  readonly alert_id: number;
  readonly acked_at: Instant;
  /** The archived action that acknowledged it. RN-10 reaches here too. */
  readonly raw_ref: RawRef;
}

export interface AlertAckStore {
  /**
   * Records an acknowledgement. `false` when the alert was already
   * acknowledged: acknowledging twice is IDEMPOTENT and writes no second row
   * (CA-6.7), which is what `unique (alert_id)` makes true in the base.
   */
  append(ack: AlertAck): Promise<boolean>;
  /** When each of these alerts was acknowledged. Absent means OPEN (CA-6.4). */
  ackedAt(alertIds: readonly number[]): Promise<ReadonlyMap<number, Instant>>;
}

/**
 * What happened to one action THAT ARRIVED WITH A VALID SESSION AND TICKET
 * (ADR-024 §8). A closed list: a free-text outcome would be a column able to
 * hold anything; this one holds five words.
 */
export const OPERATOR_ACTION_OUTCOMES = [
  'accepted',
  'rejected_empty_reason',
  'rejected_out_of_matchday',
  'rejected_unknown_alert',
  'rejected_nothing_to_ratify',
] as const;

export type OperatorActionOutcome = (typeof OPERATOR_ACTION_OUTCOMES)[number];

/**
 * One act of the panel, as `ingest_attempts` records one act of the tick
 * (ADR-019 §5). `started_at` is the `issued_at` OF THE TICKET — when the form
 * was put in front of the person — and it is the only thing that, with no live
 * process, makes time on task measurable at all (ADR-024 §4).
 */
export interface OperatorActionRecord {
  readonly action: AdminAction;
  /** The match this acted on, or `null` when the target was an alert. */
  readonly match_id: MatchId | null;
  /** The alert this acknowledged, or `null` when the target was a match. */
  readonly alert_id: number | null;
  /** The ticket's `issued_at`: when the form was served (CA-7.3). */
  readonly started_at: Instant;
  readonly submitted_at: Instant;
  readonly outcome: OperatorActionOutcome;
  /** `null` for an action rejected BEFORE anything was archived (CA-4.2). */
  readonly raw_ref: RawRef | null;
}

export interface OperatorActionLog {
  append(record: OperatorActionRecord): Promise<void>;
  /** Every act submitted in `[from, to)`, oldest first. What CA-8.3 sums over. */
  listBetween(from: Instant, to: Instant): Promise<readonly OperatorActionRecord[]>;
}

/**
 * READING alerts, which `src/decide/ports.ts` deliberately does not offer: its
 * surface is what the ENGINE needs, and the tray is the panel's (ADR-021 §5).
 * `alerts` is not touched — no column, no trigger, no `update`, no `delete`.
 */
export interface AdminAlertReader {
  /** Every alert of these matches, newest first. */
  listByMatches(matchIds: readonly MatchId[]): Promise<readonly Alert[]>;
  getById(id: number): Promise<Alert | null>;
}

/** The canonical names of the RFGF, read from the declared calendar. */
export interface TeamNameReader {
  namesOf(ids: readonly TeamId[]): Promise<ReadonlyMap<TeamId, string>>;
}

/** The live `Decision` of a match and its whole log, AS PLAIN VALUES. */
export interface MatchDecisions {
  readonly live: Decision | null;
  readonly log: readonly Decision[];
}

/**
 * Everything one request of the panel drives. Durable state lives BEHIND
 * these, and NONE of them is a decision store (CA-2.5).
 */
export interface AdminPorts {
  readonly store: RawStore;
  readonly observations: ObservationStore;
  readonly matches: MatchStore;
  readonly teams: TeamNameReader;
  readonly alerts: AdminAlertReader;
  readonly acks: AlertAckStore;
  readonly actions: OperatorActionLog;
  readonly clock: Clock;
  /** The declared matchdays (ADR-019 §3). BORN EMPTY: the panel is born off. */
  readonly windows: readonly MeasurementWindow[];
  /**
   * The NARROW DOOR of the engine (CA-2.5). Injected as a function, so what the
   * panel holds is the ability to ASK — never a store.
   */
  readonly runEngine: (matchId: MatchId, now: Instant) => Promise<EngineOutcomeSummary>;
  /**
   * The READ-ONLY door of the decision log (CA-12). Injected as a function for
   * the same reason: it gives back values, not the capability to write one.
   */
  readonly readDecisions: (matchId: MatchId) => Promise<MatchDecisions>;
}
