/**
 * `GET /api/board` — the contract, served (SPEC-018 CA-2, CA-3, CA-7;
 * ADR-027 §3.a and §7).
 *
 * THE ORDER IS THE SPEC. Every arrow below is a guarantee a criterion asserts:
 *
 *   GET /api/board   (and, through `boardSnapshotOf`, GET /marcador too)
 *     1. nothing arbitrary ─► ANY query parameter ⇒ 404, ZERO READS OF THE BASE
 *     2. declared matchdays► MEASUREMENT_WINDOWS. Empty ⇒ empty payload
 *                             AND ZERO QUERIES
 *     3. matches ──────────► listKickoffsBetween, per declared window
 *     4. published only ───► PUBLISHED_COMPETITIONS. The second bound
 *     5. logs, IN BATCH ───► board-entry.ts. The number of queries DOES NOT
 *                             grow with the number of matches
 *     6. projection ───────► the closed list of fields. What is not there does
 *                             not come out
 *     7. ETag ─────────────► a function OF THE BODY, never of the clock.
 *                             If-None-Match ⇒ 304 with no body
 *     8. headers ──────────► SHARED and short Cache-Control · noindex, noarchive
 *
 * STEPS 1 AND 2 ARE NEGATIVE FRONTIERS and they are asserted as such: not only
 * «it answers what it should», but ZERO QUERIES.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IT KNOWS NOTHING ABOUT WHOEVER ASKS, AND THAT IS A FRONTIER, NOT AN OMISSION
 * (ADR-027 §3.a, CA-2.1 and CA-2.4).
 *
 * No session, no cookie, no `ADMIN_SESSION_SECRET`, no `ADMIN_OPERATORS`, no
 * `Accept-Language`, no client header — and it writes nothing anywhere, so
 * there is no visits table either. If somebody ever puts a session check here
 * to «protect» something, WHAT THEY HAVE DONE IS SPLIT THE PRODUCT IN TWO
 * TRUTHS: the operator would see one thing and the public another.
 *
 * That is also what makes the SHARED cache legitimate (CA-7.5): the response
 * does not depend on who asks, so sharing it leaks nothing about anybody.
 *
 * AND THE RESIDUE IS WRITTEN, NOT DISGUISED (ADR-027 §3.a): THIS IS A PUBLIC
 * JSON ENDPOINT AND ANYBODY WITH THE BROWSER'S TOOLS CAN READ IT. It exists
 * BECAUSE THE SCREEN USES IT, not as a surface offered to third parties, and
 * that distinction is held by four checkable things and not by an intention —
 * it never emits a CORS header, it carries the same `X-Robots-Tag` as the
 * document, IT IS DOCUMENTED NOWHERE, and it serves exactly the closed list of
 * `contract.ts`. Calling it private would be the same mistake as calling
 * `noindex` a defence.
 */
import { createHash } from 'node:crypto';
import { readBoardLogs } from '@/decide/board-entry';
import { createClient, requireDatabaseUrl } from '@/db/client';
import { PostgresBoardCompetitionNames, PostgresBoardTeamNames } from '@/db/board';
import { PostgresMatchStore } from '@/db/matches';
import { MEASUREMENT_WINDOWS } from '@/ingest/measurement';
import { systemClock } from '@/polite/clock';
import { BOARD_API_PATH, BOARD_CACHE_CONTROL, BOARD_ROBOTS } from './freshness';
import { isPublishedCompetition } from './contract';
import { projectBoard } from './snapshot';
import type { BoardSnapshot } from './contract';
import type { BoardPorts } from './ports';
import type { Sql } from '@/db/client';
import type { CompetitionId, MatchId, TeamId } from '@/model/ids';
import type { Match } from '@/model/match';

export { BOARD_API_PATH };

/** The empty payload: no matchday declared, and NOT ONE QUERY was made. */
const NOTHING_DECLARED: BoardSnapshot = {
  version: null,
  matchday_declared: false,
  matches: [],
};

/**
 * THE PROJECTION, GATHERED. The one function both transports call: the screen
 * imports it and the JSON imports it, so «the two come out of the same
 * function» is true by construction and not by discipline (CA-7.1).
 *
 * Step 2 short-circuits BEFORE touching a port: with `MEASUREMENT_WINDOWS`
 * empty — which is its state today — this makes ZERO QUERIES and the screen is
 * born off, saying why (CA-3.2).
 */
export async function boardSnapshotOf(ports: BoardPorts): Promise<BoardSnapshot> {
  if (ports.windows.length === 0) return NOTHING_DECLARED;

  const seen = new Map<string, Match>();
  for (const window of ports.windows) {
    for (const match of await ports.matches.listKickoffsBetween(window.from, window.to)) {
      seen.set(match.id, match);
    }
  }

  // THE SECOND BOUND, applied before anything is read about these matches: a
  // competition nobody put on the list costs no query either (CA-3.5).
  const matches = [...seen.values()].filter((match) =>
    isPublishedCompetition(match.competition_id),
  );

  if (matches.length === 0) {
    return { version: null, matchday_declared: true, matches: [] };
  }

  const matchIds: readonly MatchId[] = matches.map((match) => match.id);
  const reads = await ports.readBoard(matchIds);

  const teamIds: readonly TeamId[] = matches.flatMap((match) => [match.home_id, match.away_id]);
  const teamNames = await ports.teams.namesOf(teamIds);

  const competitionIds: readonly CompetitionId[] = [
    ...new Set(matches.map((match) => match.competition_id)),
  ];
  const competitionNames = await ports.competitions.namesOf(competitionIds);

  return projectBoard({
    matches,
    reads,
    teamNames,
    competitionNames,
    matchdayDeclared: true,
  });
}

/**
 * THE `ETag`, A FUNCTION OF THE BODY AND NEVER OF THE CLOCK (ADR-027 §7.2).
 *
 * Two responses with the same content have the same `ETag` even if they are
 * generated a minute apart, which is what makes a client polling every 30 s pay
 * `304` almost always.
 */
export function etagOf(body: string): string {
  return `"${createHash('sha256').update(body).digest('hex').slice(0, 32)}"`;
}

/**
 * Whether the request carries a validator that already matches. `If-None-Match`
 * may carry a list; a weak comparison is enough here because we only ever emit
 * strong tags of our own.
 */
export function matchesEtag(header: string | null, etag: string): boolean {
  if (header === null) return false;
  return header
    .split(',')
    .map((candidate) => candidate.trim())
    .some((candidate) => candidate === etag || candidate === '*');
}

/**
 * The headers every answer of this spec carries. `new Response`, NEVER
 * `Response.json`: the declared global surface concedes the constructor and
 * nothing else (SPEC-009 CA-1).
 *
 * THERE IS NO `Access-Control-Allow-Origin` HERE AND THERE NEVER IS
 * (ADR-027 §3.a): a positive control asserts that adding one turns a named
 * case red.
 */
export function boardHeaders(contentType: string): Record<string, string> {
  return {
    'Content-Type': contentType,
    'X-Robots-Tag': BOARD_ROBOTS,
    'Cache-Control': BOARD_CACHE_CONTROL,
  };
}

/**
 * NOTHING ARBITRARY IS REACHABLE FROM OUTSIDE (CA-3.7, ADR-027 §3.b).
 *
 * No route of this spec accepts a date, a matchday or a free identifier: what
 * is reachable IS EQUAL to what is declared. A request carrying any query
 * parameter is a request for something that was never offered, so it is a
 * `404` — and it costs ZERO READS OF THE BASE, because this is decided before
 * a port is touched.
 */
export function asksForSomethingArbitrary(request: Request): boolean {
  return [...new URL(request.url).searchParams.keys()].length > 0;
}

/** The 404 of CA-3.7. It says nothing and it reads nothing. */
export function notFound(): Response {
  return new Response('', { status: 404, headers: boardHeaders('text/plain; charset=utf-8') });
}

export interface BoardApiOptions {
  readonly ports: BoardPorts;
}

/** Builds the handler of `GET /api/board`. */
export function boardApiHandler(
  options: BoardApiOptions,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    if (asksForSomethingArbitrary(request)) return notFound();

    const snapshot = await boardSnapshotOf(options.ports);
    const body = JSON.stringify(snapshot);
    const etag = etagOf(body);

    const headers = boardHeaders('application/json; charset=utf-8');
    headers['ETag'] = etag;

    if (matchesEtag(request.headers.get('if-none-match'), etag)) {
      return new Response(null, { status: 304, headers });
    }

    return new Response(body, { status: 200, headers });
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// The production composition.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The durable implementations (Postgres), the system clock and the DECLARED
 * configuration — the measurement windows, WHICH ARE EMPTY. Composed anew on
 * every invocation, which on Vercel is every instance (ADR-004); only the
 * connection pool is kept, exactly as `productionAdminPorts` does.
 *
 * `readBoardLogs` IS IMPORTED BY NAME. An `import * as` over `src/decide/`
 * would be an offence of the frontier of RN-08, and rightly so. It hands back
 * values and no store, so `DECISION_WRITERS` does not grow (CA-4.3).
 *
 * THERE IS NO RAW STORE HERE and there is no fetcher: this surface reads, it
 * does not capture, and its graph does not reach `src/polite/http.ts` (CA-1.4).
 */
let productionSql: Sql | null = null;

export function productionBoardPorts(): BoardPorts {
  productionSql ??= createClient(requireDatabaseUrl());
  const sql = productionSql;

  return {
    matches: new PostgresMatchStore(sql),
    teams: new PostgresBoardTeamNames(sql),
    competitions: new PostgresBoardCompetitionNames(sql),
    // BORN EMPTY (ADR-019 §3): with nothing declared there is nothing to show,
    // and SPEC-018 delivers A SCREEN THAT IS SWITCHED OFF AND SAYS WHY.
    windows: MEASUREMENT_WINDOWS,
    readBoard: (matchIds: readonly MatchId[]) => readBoardLogs({ sql, matchIds }),
    clock: systemClock,
  };
}

/** The handler the route binds. Routing and nothing else. */
export function productionBoardApiHandler(): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> =>
    await boardApiHandler({ ports: productionBoardPorts() })(request);
}
