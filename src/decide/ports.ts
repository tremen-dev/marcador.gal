/**
 * The port the engine writes its alerts through (SPEC-013 CA-11, ADR-021 §5).
 *
 * A new interface in a new file, like the ports of SPEC-010 and SPEC-011: a
 * new capability fits in a new interface (ADR-011 §6 applied to a port). The
 * surface is the whole point and it is TWO operations, because an alert is a
 * historical fact — there is deliberately no `update`, no `delete` and no
 * «mark as seen»: the tray, the acknowledgement and the addressee are the
 * panel's, and the panel is two specs away.
 *
 * The Postgres implementation lives in `src/db/alerts.ts`, which is where
 * every implementation of a port of this repository lives.
 */
import type { MatchId } from '@/model/ids';
import type { Alert, NewAlert } from './alert';

/**
 * The latest alert of each rule for one match — the ONLY state the engine
 * needs in order not to alert twice about the same condition (ADR-021 §5).
 * It enters `decide` as data, so the reducer stays pure.
 */
export interface LatestAlerts {
  /** The latest `RN-05` alert of the match, or `null`. */
  readonly conflict: Alert | null;
  /** The latest `RN-07` alert of the match, or `null`. */
  readonly silence: Alert | null;
}

/** Nothing alerted yet. The natural state of every match. */
export const NO_ALERTS: LatestAlerts = { conflict: null, silence: null };

export interface AlertStore {
  /** Records one alert. Never overwrites. */
  append(alert: NewAlert): Promise<Alert>;
  /** The latest alert of each rule for a match. */
  latestByMatch(matchId: MatchId): Promise<LatestAlerts>;
}
