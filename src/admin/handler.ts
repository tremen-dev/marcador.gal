/**
 * The panel's routing: session, ticket, operation. THE ORDER IS THE SPEC
 * (SPEC-017 §2, ADR-024).
 *
 * Every arrow below is a guarantee a criterion asserts:
 *
 *   GET /admin  (or /es/admin)
 *     1. session ───────────► no valid cookie ⇒ access form. ZERO READS OF THE BASE
 *     2. board ─────────────► matches of the declared matchdays, live state,
 *                             qualifier, alerts
 *     3. ticket ────────────► every form goes out signed, with its `issued_at`
 *
 *   POST /admin
 *     4. session ───────────► invalid or expired ⇒ 401. ZERO ARCHIVE, ZERO ROWS
 *     5. ticket ────────────► invalid, another's or expired ⇒ refusal.
 *                             ZERO ARCHIVE, ZERO ROWS
 *     6. match in matchday ─► outside every declared matchday ⇒ NAMED ERROR.
 *                             ZERO ARCHIVE
 *     7. motive not empty ──► empty ⇒ refusal. IT DOES LEAVE A ROW in
 *                             `operator_actions` (it cost time)
 *     8. redaction (whitelist)
 *     9. ARCHIVE of the action ─► RN-10: before anything is built
 *    10. Observation(source='operador', confidence=1.0, raw_ref = step 9)
 *    11. append ───────────► id derived from what was declared: a resend does
 *                            not duplicate
 *    12. runEngineForMatch ► THE NARROW DOOR. The panel NEVER writes a Decision
 *    13. operator_actions ─► started_at = the ticket's issued_at · submitted_at = now
 *    14. acknowledgement ──► what was published, with its qualifier, READ BACK
 *                            FROM THE BASE
 *
 * STEPS 4, 5 AND 6 ARE NEGATIVE FRONTIERS and they are asserted the same way as
 * the bot's: not only «it answers what it should», but ZERO RAW OBJECTS AND
 * ZERO ROWS. Step 7 is the declared exception and it is deliberate: a refusal
 * for an empty motive happened AFTER the person arrived and typed, so it cost
 * operation time and the fourth figure has to see it (ADR-024 §8).
 *
 * ACKNOWLEDGING AN ALERT WALKS THE SAME PATH WITHOUT STEPS 10, 11 AND 12:
 * acknowledging publishes nothing (RN-05, CA-6.6).
 *
 * AND THE KEY IS THE MATCH, NOT THE CLOCK (ADR-024 §9, CA-11.3). The panel
 * operates on matches whose `kickoff` falls inside a declared measurement
 * window; it does NOT check what time it is now. That is the opposite of the
 * bot (ADR-022 §7) and the motive is written: there the key bounds when free
 * text is collected; here it protects the RETENTION ANCHOR, and the operator
 * has to be able to fix on Monday what was closed wrong on Saturday.
 */
import { runEngineForMatch } from '@/decide/engine-entry';
import { readMatchDecisions } from '@/decide/read-entry';
import {
  PostgresAdminAlertReader,
  PostgresAlertAckStore,
  PostgresOperatorActionLog,
  PostgresTeamNameReader,
} from '@/db/admin';
import { createClient, requireDatabaseUrl } from '@/db/client';
import { PostgresMatchStore } from '@/db/matches';
import { PostgresObservationStore } from '@/db/observations';
import { qualifierOf } from '@/decide/qualifier';
import { MEASUREMENT_WINDOWS } from '@/ingest/measurement';
import { inMeasurementWindow } from '@/ingest/windows';
import { MatchIdSchema } from '@/model/ids';
import { MatchStatusSchema } from '@/model/match';
import { systemClock } from '@/polite/clock';
import { BlobRawStore } from '@/raw/blob';
import { adminBundle, adminQualifier, fill } from '@/i18n/admin';
import { splitTray } from './alerts';
import { boardMatchIds, boardRow, matchDetail, orderBoard, supportingOf } from './board';
import { proposalFor } from './actions';
import { ADMIN_ACTIONS, archive, publishes } from './archive';
import { operatorObservation } from './observation';
import { redactAction } from './redact';
import {
  ADMIN_SESSION_COOKIE,
  SESSION_TTL_MS,
  authenticate,
  newSession,
  OperatorIdSchema,
  readCookie,
  readOperators,
  readSession,
  readSessionSecret,
  sessionSetCookie,
  signSession,
} from './session';
import { TICKET_FIELD, readTicket, signTicket } from './ticket';
import { FIELDS, accessPage, boardPage, detailPage, pathsOf } from './view/pages';
import type { AdminAction } from './archive';
import type { AdminPorts, OperatorActionOutcome, OperatorActionRecord } from './ports';
import type { BoardRow } from './board';
import type { OperatorCatalog, OperatorId } from './session';
import type { AdminLocale, AdminText } from '@/i18n/admin';
import type { Instant, MatchId } from '@/model/ids';
import type { Match, MatchStatus } from '@/model/match';
import type { Sql } from '@/db/client';

/** The two addresses of the panel. Declared once, for `ENTRY_POINTS`. */
export const ADMIN_PATHS = { gl: '/admin', es: '/es/admin' } as const;

export interface AdminOptions {
  readonly ports: AdminPorts;
  /** Injected so the handler is provable without a child process (CA-1). */
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly locale: AdminLocale;
}

/**
 * A response of the panel. `new Response`, NEVER `Response.json`: the declared
 * surface of the global concedes the constructor and nothing else (CA-13.3,
 * SPEC-009 CA-1).
 *
 * `X-Robots-Tag: noindex, nofollow` on EVERY route of the panel (CA-1.10).
 * `robots.txt` is not touched, and that is a written decision: listing
 * `/admin` there would publish the address of the surface with weight 1.0.
 */
function html(body: string, status: number, setCookie?: string): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'text/html; charset=utf-8',
    'X-Robots-Tag': 'noindex, nofollow',
    'Cache-Control': 'no-store',
  };
  if (setCookie !== undefined) headers['Set-Cookie'] = setCookie;
  return new Response(body, { status, headers });
}

/** The one answer that is not a document: the fail-closed 401 of CA-1.1. */
function unauthorized(): Response {
  return new Response(JSON.stringify({ error: 'unauthorized' }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': 'no-store',
    },
  });
}

/**
 * Builds the panel's handler.
 *
 * A missing, empty or short `ADMIN_SESSION_SECRET` answers 401 AND DOES NO
 * WORK: no port is touched, so no raw object is written and no row appears
 * (CA-1.1). The error is named — `UnusableSessionSecretError` — and it is
 * caught here so the answer says nothing about which of the three it was.
 */
export function adminHandler(options: AdminOptions): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    let secret: string;
    try {
      secret = readSessionSecret(options.env);
    } catch {
      return unauthorized();
    }

    const catalog = readOperators(options.env);
    const locale = options.locale;
    const now = options.ports.clock.now();

    const operator = readSession(
      secret,
      catalog,
      readCookie(request.headers.get('cookie'), ADMIN_SESSION_COOKIE),
      now,
    );

    if (request.method === 'GET') {
      // 1. THE SESSION. With no valid cookie the answer is the access form and
      //    NOT ONE READ OF THE BASE happens (CA-1, step 1 of §2).
      if (operator === null) return html(accessPage(locale, false), 200);
      return await board(options, secret, operator, now, null, request);
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'method' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', 'X-Robots-Tag': 'noindex, nofollow' },
      });
    }

    const submitted = await readForm(request);
    if (submitted === null) return html(accessPage(locale, true), 400);

    if (submitted.get(FIELDS.intent) === 'acceso') {
      return await onAccess(options, secret, catalog, submitted, now);
    }

    // 4. THE SESSION, on the way in of an action. Invalid or expired ⇒ 401,
    //    zero archive, zero rows — and NO ROW IN `operator_actions` either:
    //    the table measures operation, not who knocks at the door (CA-8.2).
    if (operator === null) return unauthorized();

    return await onAction(options, secret, operator, submitted, now);
  };
}

async function readForm(request: Request): Promise<URLSearchParams | null> {
  try {
    return new URLSearchParams(await request.text());
  } catch {
    return null;
  }
}

/** The one exchange of ADR-024 §3: the secret goes in once, a session comes out. */
async function onAccess(
  options: AdminOptions,
  secret: string,
  catalog: OperatorCatalog,
  submitted: URLSearchParams,
  now: Instant,
): Promise<Response> {
  const claimed = OperatorIdSchema.safeParse(submitted.get(FIELDS.operator) ?? '');
  const offered = submitted.get(FIELDS.secret) ?? '';

  // A malformed `operator_id` and a wrong secret get THE SAME ANSWER: the
  // panel neither confirms nor denies who is an operator (CA-1.4).
  if (!claimed.success || !authenticate(catalog, claimed.data, offered)) {
    return html(accessPage(options.locale, true), 401);
  }

  const token = signSession(secret, newSession(claimed.data, now));
  return redirectTo(options.locale, sessionSetCookie(token, Math.floor(SESSION_TTL_MS / 1000)));
}

/** After a successful access the browser reloads the board with its cookie. */
function redirectTo(locale: AdminLocale, setCookie: string): Response {
  return new Response(JSON.stringify({ ok: true }), {
    status: 303,
    headers: {
      Location: pathsOf(locale).root,
      'Content-Type': 'application/json',
      'X-Robots-Tag': 'noindex, nofollow',
      'Set-Cookie': setCookie,
      'Cache-Control': 'no-store',
    },
  });
}

/** The matches of the declared matchdays. With none declared, THIS IS EMPTY. */
async function declaredMatches(options: AdminOptions): Promise<readonly Match[]> {
  const seen = new Map<string, Match>();

  for (const window of options.ports.windows) {
    for (const match of await options.ports.matches.listKickoffsBetween(window.from, window.to)) {
      seen.set(match.id, match);
    }
  }

  return [...seen.values()];
}

async function rowsOf(options: AdminOptions): Promise<readonly BoardRow[]> {
  const matches = await declaredMatches(options);
  if (matches.length === 0) return [];

  const names = await options.ports.teams.namesOf(
    matches.flatMap((match) => [match.home_id, match.away_id]),
  );

  const alerts = await options.ports.alerts.listByMatches(matches.map((match) => match.id));
  const acks = await options.ports.acks.ackedAt(alerts.map((alert) => alert.id));
  const tray = splitTray(alerts, acks);

  const rows: BoardRow[] = [];
  for (const match of matches) {
    const decisions = await options.ports.readDecisions(match.id);
    const observations = await options.ports.observations.listByMatch(match.id);
    rows.push(
      boardRow({
        match,
        home: names.get(match.home_id) ?? match.home_id,
        away: names.get(match.away_id) ?? match.away_id,
        live: decisions.live,
        observations,
        open_alerts: tray.open.filter((entry) => entry.alert.match_id === match.id).length,
      }),
    );
  }

  return orderBoard(rows);
}

/** Steps 2 and 3: the board, and every form signed with its own ticket. */
async function board(
  options: AdminOptions,
  secret: string,
  operator: OperatorId,
  now: Instant,
  message: AdminText | null,
  request: Request,
): Promise<Response> {
  const rows = await rowsOf(options);
  const ticketFor = (action: AdminAction, target: string): string =>
    signTicket(secret, { operator_id: operator, action, target, issued_at: now });

  const wanted = new URL(request.url).searchParams.get(FIELDS.match);
  if (wanted !== null) {
    const entry = rows.find((candidate) => candidate.match.id === wanted);
    if (entry !== undefined) {
      const decisions = await options.ports.readDecisions(entry.match.id);
      const observations = await options.ports.observations.listByMatch(entry.match.id);
      return html(
        detailPage(options.locale, {
          detail: matchDetail(entry, observations, decisions.log),
          ticketFor,
          notice: message,
        }),
        200,
      );
    }
  }

  const alerts = await options.ports.alerts.listByMatches(boardMatchIds(rows));
  const acks = await options.ports.acks.ackedAt(alerts.map((alert) => alert.id));

  return html(
    boardPage(options.locale, {
      rows,
      tray: splitTray(alerts, acks),
      ticketFor,
      notice: message,
    }),
    200,
  );
}

function statusOf(submitted: URLSearchParams): MatchStatus | null {
  const parsed = MatchStatusSchema.safeParse(submitted.get(FIELDS.status) ?? '');
  return parsed.success ? parsed.data : null;
}

function numberOf(submitted: URLSearchParams, name: string): number | null {
  const raw = submitted.get(name);
  if (raw === null || raw.trim().length === 0) return null;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

async function record(
  options: AdminOptions,
  entry: Omit<OperatorActionRecord, 'submitted_at'>,
  now: Instant,
): Promise<void> {
  await options.ports.actions.append({ ...entry, submitted_at: now });
}

/** Steps 5 to 14. */
async function onAction(
  options: AdminOptions,
  secret: string,
  operator: OperatorId,
  submitted: URLSearchParams,
  now: Instant,
): Promise<Response> {
  const bundle = adminBundle(options.locale);
  const action = (ADMIN_ACTIONS as readonly string[]).includes(submitted.get(FIELDS.action) ?? '')
    ? (submitted.get(FIELDS.action) as AdminAction)
    : null;
  if (action === null) return html(accessPage(options.locale, true), 400);

  // 5. THE TICKET. Invalid, another operator's, tampered or expired: a NAMED
  //    and distinguishable refusal, ZERO ARCHIVE, ZERO ROWS — not even in
  //    `operator_actions` (CA-7.1, CA-7.2, CA-8.2).
  const reading = readTicket(secret, submitted.get(TICKET_FIELD), operator, now);
  if (!reading.ok) {
    return await refusedTicket(options, secret, operator, now, reading.fault);
  }
  const ticket = reading.ticket;

  const reason = submitted.get(FIELDS.reason) ?? '';

  if (action === 'acuse') {
    return await onAcknowledge(options, secret, operator, ticket.issued_at, now, submitted, reason);
  }

  // 6. THE MATCH IS IN A DECLARED MATCHDAY — and the key is applied TO THE
  //    MATCH, NEVER TO THE CLOCK (CA-11.3). Outside every declared matchday:
  //    named error, zero archive, and a row that says so (CA-8.2).
  const wanted = MatchIdSchema.safeParse(submitted.get(FIELDS.match) ?? '');
  const match = wanted.success ? await options.ports.matches.getById(wanted.data) : null;
  if (match === null || !inMeasurementWindow(match.kickoff, options.ports.windows)) {
    // A MATCH THAT IS IN THE CALENDAR BUT OUTSIDE EVERY DECLARED MATCHDAY IS
    // THE CASE CA-8.2 NAMES, and it leaves its row. A `match_id` THAT IS NOT
    // IN THE CALENDAR AT ALL leaves none, and that is not a lapse: the target
    // of a row is a foreign key into `matches` (migration 0008), so a row
    // about a match that does not exist is not representable — and it is not
    // an act of operation either, because this panel never served a form for
    // it. Declared here, where it is decided.
    if (match !== null) {
      await record(
        options,
        {
          action,
          match_id: match.id,
          alert_id: null,
          started_at: ticket.issued_at,
          outcome: 'rejected_out_of_matchday',
          raw_ref: null,
        },
        now,
      );
    }
    return html(await withNotice(options, secret, operator, now, bundle.errOutOfMatchday), 200);
  }

  const decisions = await options.ports.readDecisions(match.id);

  // 7. THE MOTIVE. Empty or only spaces: refusal BEFORE ARCHIVING ANYTHING,
  //    zero raw objects and zero `Observation` (CA-4.2) — and A ROW, because
  //    this happened after the person arrived and typed (CA-8.2).
  const outcome = proposalFor(
    {
      action,
      status: statusOf(submitted),
      home_score: numberOf(submitted, FIELDS.homeScore),
      away_score: numberOf(submitted, FIELDS.awayScore),
      reason,
    },
    decisions.live,
  );

  if (!outcome.ok) {
    const fault: OperatorActionOutcome =
      outcome.fault === 'empty_reason' ? 'rejected_empty_reason' : 'rejected_nothing_to_ratify';
    await record(
      options,
      {
        action,
        match_id: match.id,
        alert_id: null,
        started_at: ticket.issued_at,
        outcome: fault,
        raw_ref: null,
      },
      now,
    );
    return html(
      await withNotice(
        options,
        secret,
        operator,
        now,
        outcome.fault === 'empty_reason' ? bundle.errEmptyReason : bundle.errNothingToRatify,
      ),
      200,
    );
  }

  // 8 and 9. REDACTION AND ARCHIVE, BEFORE ANYTHING IS BUILT (RN-10).
  const rawRef = await archive(
    options.ports.store,
    action,
    now,
    redactAction({
      operator_id: operator,
      match_id: match.id,
      action,
      status: outcome.proposal.status,
      home_score: outcome.proposal.home_score,
      away_score: outcome.proposal.away_score,
      reason,
      issued_at: ticket.issued_at,
      submitted_at: now,
    }),
  );

  // 10 and 11. THE `Observation` of weight 1.0, with an id derived from what
  //     the person declared, so an identical resend does not duplicate.
  const observation = operatorObservation({
    operator_id: operator,
    action,
    match_id: match.id,
    proposal: outcome.proposal,
    reason,
    issued_at: ticket.issued_at,
    observed_at: now,
    raw_ref: rawRef,
  });
  await options.ports.observations.append(observation);

  // 12. THE ENGINE, THROUGH THE NARROW DOOR. The panel never writes a Decision.
  if (publishes(action)) await options.ports.runEngine(match.id, now);

  // 13. THE REGISTER.
  await record(
    options,
    {
      action,
      match_id: match.id,
      alert_id: null,
      started_at: ticket.issued_at,
      outcome: 'accepted',
      raw_ref: rawRef,
    },
    now,
  );

  // 14. THE ACKNOWLEDGEMENT, READ BACK FROM THE BASE. Not what we asked for:
  //     what was published, with the qualifier the engine derived.
  const published = await options.ports.readDecisions(match.id);
  const names = await options.ports.teams.namesOf([match.home_id, match.away_id]);
  const live = published.live;
  const supporting = await options.ports.observations.listByMatch(match.id);
  const qualifier =
    live === null
      ? bundle.boardNoDecision
      : adminQualifier(options.locale, qualifierOf(live, supportingOf(live, supporting)));

  return html(
    await withNotice(
      options,
      secret,
      operator,
      now,
      fill(bundle.ackPublished, {
        home: names.get(match.home_id) ?? match.home_id,
        away: names.get(match.away_id) ?? match.away_id,
        homeScore: `${live?.home_score ?? 0}`,
        awayScore: `${live?.away_score ?? 0}`,
        qualifier,
      }),
    ),
    200,
  );
}

/** Acknowledging: THE SAME PATH WITHOUT STEPS 10, 11 AND 12 (CA-6.6). */
async function onAcknowledge(
  options: AdminOptions,
  secret: string,
  operator: OperatorId,
  issuedAt: Instant,
  now: Instant,
  submitted: URLSearchParams,
  reason: string,
): Promise<Response> {
  const bundle = adminBundle(options.locale);
  const wanted = Number(submitted.get(FIELDS.alert) ?? '');
  const alert = Number.isSafeInteger(wanted) ? await options.ports.alerts.getById(wanted) : null;

  const match = alert === null ? null : await options.ports.matches.getById(alert.match_id);
  if (alert === null || match === null || !inMeasurementWindow(match.kickoff, options.ports.windows)) {
    // Same shape as the match half above: an alert that EXISTS but whose match
    // is outside every declared matchday leaves its row; an `alert_id` that
    // names no row leaves none, because the target is a foreign key into
    // `alerts` and a row about an alert that does not exist is not
    // representable.
    if (alert !== null) {
      await record(
        options,
        {
          action: 'acuse',
          match_id: null,
          alert_id: alert.id,
          started_at: issuedAt,
          outcome: 'rejected_unknown_alert',
          raw_ref: null,
        },
        now,
      );
    }
    return html(await withNotice(options, secret, operator, now, bundle.errUnknownAlert), 200);
  }

  if (reason.trim().length === 0) {
    await record(
      options,
      {
        action: 'acuse',
        match_id: null,
        alert_id: alert.id,
        started_at: issuedAt,
        outcome: 'rejected_empty_reason',
        raw_ref: null,
      },
      now,
    );
    return html(await withNotice(options, secret, operator, now, bundle.errEmptyReason), 200);
  }

  const rawRef = await archive(
    options.ports.store,
    'acuse',
    now,
    redactAction({
      operator_id: operator,
      alert_id: alert.id,
      action: 'acuse',
      reason,
      issued_at: issuedAt,
      submitted_at: now,
    }),
  );

  await options.ports.acks.append({ alert_id: alert.id, acked_at: now, raw_ref: rawRef });

  await record(
    options,
    {
      action: 'acuse',
      match_id: null,
      alert_id: alert.id,
      started_at: issuedAt,
      outcome: 'accepted',
      raw_ref: rawRef,
    },
    now,
  );

  return html(await withNotice(options, secret, operator, now, bundle.ackAcknowledged), 200);
}

/** A refused ticket: named, distinguishable, and nothing written (CA-7.2). */
async function refusedTicket(
  options: AdminOptions,
  secret: string,
  operator: OperatorId,
  now: Instant,
  fault: 'malformed' | 'tampered' | 'other_operator' | 'expired',
): Promise<Response> {
  const bundle = adminBundle(options.locale);
  const message =
    fault === 'malformed'
      ? bundle.errTicketMalformed
      : fault === 'tampered'
        ? bundle.errTicketTampered
        : fault === 'other_operator'
          ? bundle.errTicketOtherOperator
          : bundle.errTicketExpired;

  return html(await withNotice(options, secret, operator, now, message), 400);
}

/** The board again, with what just happened written at the top of it. */
async function withNotice(
  options: AdminOptions,
  secret: string,
  operator: OperatorId,
  now: Instant,
  message: AdminText,
): Promise<string> {
  const rows = await rowsOf(options);
  const alerts = await options.ports.alerts.listByMatches(boardMatchIds(rows));
  const acks = await options.ports.acks.ackedAt(alerts.map((alert) => alert.id));

  return boardPage(options.locale, {
    rows,
    tray: splitTray(alerts, acks),
    ticketFor: (action: AdminAction, target: string) =>
      signTicket(secret, { operator_id: operator, action, target, issued_at: now }),
    notice: message,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// The production composition.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The durable implementations (Postgres, Blob), the system clock and the
 * DECLARED configuration — the measurement windows, which are EMPTY. Composed
 * anew on every invocation, which on Vercel is every instance (ADR-004); only
 * the connection pool is kept, exactly as `productionBotPorts` does.
 *
 * `runEngineForMatch` AND `readMatchDecisions` ARE IMPORTED BY NAME. An
 * `import * as` over `src/decide/` would be an offence of the frontier of
 * RN-08, and rightly so. Neither hands back a store.
 */
let productionSql: Sql | null = null;

export function productionAdminPorts(): AdminPorts {
  productionSql ??= createClient(requireDatabaseUrl());
  const sql = productionSql;

  return {
    store: new BlobRawStore(),
    observations: new PostgresObservationStore(sql),
    matches: new PostgresMatchStore(sql),
    teams: new PostgresTeamNameReader(sql),
    alerts: new PostgresAdminAlertReader(sql),
    acks: new PostgresAlertAckStore(sql),
    actions: new PostgresOperatorActionLog(sql),
    clock: systemClock,
    // BORN EMPTY (ADR-019 §3): with nothing declared there is no match to
    // operate on, and SPEC-017 delivers A PANEL THAT IS SWITCHED OFF (CA-11.1).
    windows: MEASUREMENT_WINDOWS,
    runEngine: (matchId: MatchId, at: Instant) => runEngineForMatch({ sql, matchId, now: at }),
    readDecisions: async (matchId: MatchId) => {
      const read = await readMatchDecisions({ sql, matchId });
      return { live: read.live, log: read.log };
    },
  };
}

/** The handler each route binds. Routing and nothing else. */
export function productionAdminHandler(
  locale: AdminLocale,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> =>
    await adminHandler({ ports: productionAdminPorts(), env: process.env, locale })(request);
}
