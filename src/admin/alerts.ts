/**
 * The tray: OPEN MEANS «WITHOUT ACKNOWLEDGEMENT», AND IT IS COMPUTED, NEVER
 * STORED (ADR-021 §5, ADR-024 §7, SPEC-017 CA-6).
 *
 * ADR-021 §5 wrote this down in advance: «no hay estado "vista", ni
 * "resuelta", ni destinatario. Eso lo trae el panel, y cuando lo traiga será
 * una tabla suya: `alerts` es un hecho histórico, no una bandeja». This module
 * is the collection of that promise, in its letter — `alerts` is not touched,
 * and the acknowledgement lives beside it in `alert_acks`.
 *
 * DERIVING IT INSTEAD OF STORING IT is the same discipline the engine applies
 * to the qualifier (ADR-021 §2 and §6): state that is derived never lies,
 * because there is no second copy to drift. A «seen» column would be the third
 * mutable log this design exists not to have.
 *
 * AND THE ACKNOWLEDGEMENT IS OF ONE ROW, NOT OF A CONDITION (CA-6.8). If the
 * condition comes back with a different reason the engine writes ANOTHER row
 * in `alerts` — `reason` is its fingerprint, migration 0006 — and that one
 * shows up open. That is not a leak: it is the only reading under which
 * «acknowledged» cannot silence a conflict that changed.
 *
 * Pure on purpose: it takes the alerts and the acknowledgements as data.
 */
import { epochMsOf } from '@/polite/clock';
import type { Alert } from '@/decide/alert';
import type { Instant } from '@/model/ids';

/** One alert as the panel shows it: the row, plus whether it was acknowledged. */
export interface TrayAlert {
  readonly alert: Alert;
  /** `null` means OPEN. There is no column behind this (CA-6.4). */
  readonly acked_at: Instant | null;
}

/** The two halves of the tray. Newest first, in both (CA-6.5). */
export interface AlertTray {
  readonly open: readonly TrayAlert[];
  readonly acknowledged: readonly TrayAlert[];
}

/** Newest first, and total: same input, same order, every time. */
function byRaisedAtDesc(a: TrayAlert, b: TrayAlert): number {
  const byTime = epochMsOf(b.alert.raised_at) - epochMsOf(a.alert.raised_at);
  if (byTime !== 0) return byTime;
  return b.alert.id - a.alert.id;
}

/**
 * Splits the alerts of the declared matchdays into open and acknowledged.
 *
 * An alert whose id is not in `acks` is OPEN. That is the whole rule, and it
 * is why there is nothing to keep in step.
 */
export function splitTray(
  alerts: readonly Alert[],
  acks: ReadonlyMap<number, Instant>,
): AlertTray {
  const open: TrayAlert[] = [];
  const acknowledged: TrayAlert[] = [];

  for (const alert of alerts) {
    const ackedAt = acks.get(alert.id);
    if (ackedAt === undefined) open.push({ alert, acked_at: null });
    else acknowledged.push({ alert, acked_at: ackedAt });
  }

  return {
    open: [...open].sort(byRaisedAtDesc),
    acknowledged: [...acknowledged].sort(byRaisedAtDesc),
  };
}

/** The matches that have at least one OPEN alert. What orders the board. */
export function matchesWithOpenAlerts(tray: AlertTray): ReadonlySet<string> {
  return new Set(tray.open.map((entry) => entry.alert.match_id));
}
