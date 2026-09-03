/**
 * The action ticket: CSRF AND STOPWATCH WITH ONE MECHANISM (ADR-024 §4,
 * SPEC-017 CA-7).
 *
 * Every form the panel serves goes out signed with HMAC over
 * `{operator_id, action, target, issued_at}`, and on submission the server
 * verifies it BEFORE touching anything. It does two jobs, and that is the
 * reason for choosing it:
 *
 *   1. CSRF. Without a valid ticket — or with one of another operator, or
 *      tampered, or older than `TICKET_TTL_MS` — the operation is refused with
 *      NO ARCHIVE AND NO `Observation`. `SameSite=Strict` already covers the
 *      ordinary case; the ticket covers the one that does not depend on the
 *      browser behaving.
 *   2. STOPWATCH. `issued_at` is WHEN THE FORM WAS PUT IN FRONT OF THE PERSON,
 *      and with no live process (ADR-004) it is the only thing that makes time
 *      on task measurable at all. `submitted_at − issued_at` is the duration
 *      of one action, and it is what `operator_actions.started_at` records
 *      (CA-7.3, CA-8.1).
 *
 * THE TICKET IS NOT SINGLE-USE, AND IT IS DECLARED (CA-7.5). Detecting a
 * replay would need durable state, which is exactly what ADR-024 §3 avoids. A
 * resend inside the TTL produces THE SAME ACTION, whose `Observation` has an
 * id DERIVED from what the person declared (`src/admin/observation.ts`), so
 * `append` is idempotent by construction and an identical resend does not
 * duplicate anything. Destination: EPIC-MEJORA; trigger: the day the panel has
 * an operation whose effect is not idempotent.
 *
 * AND THE TICKET NEVER TRAVELS IN THE URL (CA-7.4), so it does not end up in
 * the browser's history, in the log of any intermediary, or in the screenshot
 * somebody shares. It is a hidden field of a `POST` form and nothing else.
 */
import { createHmac } from 'node:crypto';
import { epochMsOf } from '@/polite/clock';
import { constantTimeEquals } from './session';
import type { AdminAction } from './archive';
import type { OperatorId } from './session';
import type { Instant } from '@/model/ids';

/**
 * How long a served form stays valid: MINUTES, long enough to think a
 * correction through and short enough for the stopwatch to mean something
 * (gate note §9). A named constant in one place: changing it is a diff.
 */
export const TICKET_TTL_MS = 15 * 60 * 1000;

/** The name of the hidden field. One place, so a view cannot invent a second. */
export const TICKET_FIELD = 'vale';

/** What is signed. `target` is the `match_id` or the `alert_id`, as text. */
export interface Ticket {
  readonly operator_id: OperatorId;
  readonly action: AdminAction;
  readonly target: string;
  readonly issued_at: Instant;
}

/**
 * Why a ticket was refused. FOUR NAMED AND DISTINGUISHABLE OUTCOMES, one per
 * case of CA-7.2 — a single «invalid» would make the criterion unassertable.
 */
export type TicketFault = 'malformed' | 'tampered' | 'other_operator' | 'expired';

export interface TicketRefused {
  readonly ok: false;
  readonly fault: TicketFault;
}

export interface TicketAccepted {
  readonly ok: true;
  readonly ticket: Ticket;
}

export type TicketReading = TicketAccepted | TicketRefused;

/** The canonical body of a ticket. Order is fixed: a signature is over bytes. */
function body(ticket: Ticket): string {
  return Buffer.from(
    JSON.stringify([ticket.operator_id, ticket.action, ticket.target, ticket.issued_at]),
    'utf8',
  ).toString('base64url');
}

function sign(secret: string, encoded: string): string {
  return createHmac('sha256', secret).update(encoded, 'utf8').digest('hex');
}

/** `<base64url([operator, action, target, issued_at])>.<hmac>`. */
export function signTicket(secret: string, ticket: Ticket): string {
  const encoded = body(ticket);
  return `${encoded}.${sign(secret, encoded)}`;
}

function decode(encoded: string): Ticket | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length !== 4) return null;

  const [operatorId, action, target, issuedAt] = parsed as unknown[];
  if (
    typeof operatorId !== 'string' ||
    typeof action !== 'string' ||
    typeof target !== 'string' ||
    typeof issuedAt !== 'string'
  ) {
    return null;
  }

  return {
    operator_id: operatorId as OperatorId,
    action: action as AdminAction,
    target,
    issued_at: issuedAt as Instant,
  };
}

/**
 * Reads a submitted ticket, in the order the criteria assert it: readable,
 * authentic, this operator's, and still inside its TTL.
 *
 * `operatorId` is the one THE SESSION PROVED, never the one the ticket claims:
 * that is what makes «a ticket of another operator» a case at all.
 */
export function readTicket(
  secret: string,
  token: string | null,
  operatorId: OperatorId,
  now: Instant,
  ttlMs: number = TICKET_TTL_MS,
): TicketReading {
  if (token === null || token.length === 0) return { ok: false, fault: 'malformed' };

  const cut = token.lastIndexOf('.');
  if (cut <= 0) return { ok: false, fault: 'malformed' };

  const encoded = token.slice(0, cut);
  const mac = token.slice(cut + 1);
  if (!constantTimeEquals(mac, sign(secret, encoded))) return { ok: false, fault: 'tampered' };

  const ticket = decode(encoded);
  if (ticket === null) return { ok: false, fault: 'malformed' };

  if (ticket.operator_id !== operatorId) return { ok: false, fault: 'other_operator' };

  let issuedMs: number;
  try {
    issuedMs = epochMsOf(ticket.issued_at);
  } catch {
    return { ok: false, fault: 'malformed' };
  }
  if (epochMsOf(now) - issuedMs > ttlMs) return { ok: false, fault: 'expired' };
  // A ticket dated in the future is not a ticket this panel served.
  if (issuedMs > epochMsOf(now)) return { ok: false, fault: 'expired' };

  return { ok: true, ticket };
}
