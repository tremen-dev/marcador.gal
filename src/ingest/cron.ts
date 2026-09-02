/**
 * The cron's door: an authenticated HTTP route that DELEGATES whole
 * (SPEC-012 CA-7 and CA-8, ADR-019 §1).
 *
 * The logic does not live in the route file: a `route.ts` of Next cannot
 * export constants of its own, and keeping the tick's driving in
 * `src/ingest/` keeps it under the reach of SPEC-008 CA-12 without a new
 * architecture test. `vercel.json` points at `CRON_INGEST_PATH`, and the
 * route file lives where the constant says (`src/app${CRON_INGEST_PATH}/route.ts`)
 * — one literal, checked by a test, never two.
 *
 * AUTH FAILS CLOSED. Without `CRON_SECRET` in the environment the handler
 * refuses whatever the header carries: a misconfigured deployment shows up as
 * zero coverage, not as an attempt record anyone on the internet can fatten
 * (ADR-019 §1.1). The damage towards THIRD PARTIES was already contained by
 * the durable rhythm; this secret protects OUR record.
 */
import { createClient, requireDatabaseUrl } from '@/db/client';
import { systemClock } from '@/polite/clock';
import { globalFetcher } from '@/polite/http';
import { BlobRawStore } from '@/raw/blob';
import { ACTIVE_SEASON, MEASUREMENT_WINDOWS } from './measurement';
import { composeTickPorts, runIngestTick } from './tick';
import type { Sql } from '@/db/client';
import type { TickSummary } from './tick';

/** Where the cron knocks. `vercel.json` and the route file both derive from it. */
export const CRON_INGEST_PATH = '/api/cron/ingest';

export interface CronIngestHandlerOptions {
  /** The whole of the work. The route adds authentication and nothing else. */
  readonly tick: () => Promise<TickSummary>;
  /** Injected so the handler is provable without a child process (CA-7). */
  readonly env: Readonly<Record<string, string | undefined>>;
}

/**
 * Builds the route's handler. 401 does NO work — the tick function is not
 * even invoked, so no turn is taken, no request leaves and no row is written.
 */
export function cronIngestHandler(
  options: CronIngestHandlerOptions,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const secret = options.env['CRON_SECRET'];

    // Fails closed: an unset (or empty) secret refuses everything.
    if (secret === undefined || secret.length === 0) {
      return unauthorized();
    }
    if (request.headers.get('authorization') !== `Bearer ${secret}`) {
      return unauthorized();
    }

    const summary = await options.tick();
    return json(summary, 200);
  };
}

/**
 * `new Response`, not `Response.json`: the global's declared surface concedes
 * the constructor and nothing else (SPEC-009 CA-1, `ALLOWED_GLOBALS`), and a
 * static helper is not worth widening a frontier for.
 */
function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function unauthorized(): Response {
  return json({ error: 'unauthorized' }, 401);
}

let productionSql: Sql | null = null;

/**
 * The production tick: the durable implementations (Postgres, Blob), the
 * system clock, the platform fetcher, and the DECLARED configuration —
 * season and measurement windows (`./measurement.ts`). Composed again on
 * every invocation, which on Vercel is every instance (ADR-004); only the
 * connection pool is kept, because within one warm instance it is the one
 * thing worth keeping.
 */
export function productionCronTick(): Promise<TickSummary> {
  productionSql ??= createClient(requireDatabaseUrl());

  return runIngestTick(
    composeTickPorts({
      sql: productionSql,
      store: new BlobRawStore(),
      fetcher: globalFetcher,
      clock: systemClock,
      season: ACTIVE_SEASON,
      windows: MEASUREMENT_WINDOWS,
    }),
  );
}
