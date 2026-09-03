/**
 * `/admin` — the operator's panel in galego (SPEC-017 CA-9.2, CA-13; ADR-024 §1).
 *
 * It DELEGATES WHOLE in `src/admin/handler.ts`: the session, the ticket, the
 * composition and the routing live there, provable without a child process.
 * This file holds no logic — a case asserts that it imports nothing of
 * `src/db/`, `src/raw/` or `src/decide/` (CA-13.4). It is the same shape as
 * `src/app/api/cron/ingest/route.ts` and `src/app/api/telegram/webhook/route.ts`.
 *
 * IT IS A ROUTE HANDLER AND NOT A PAGE, and that is load-bearing: a `route.ts`
 * is not wrapped by any layout, so `src/app/globals.css` — which the two root
 * layouts of the public site import — NEVER LOADS ON THIS DOCUMENT. The panel
 * brings its own stylesheet and does not share one line with the site's
 * (ADR-025 §4, CA-10.6).
 */
import { productionAdminHandler } from '@/admin/handler';

// Every invocation does real work against Postgres and Blob, and it answers a
// person's session: nothing here may be prerendered or cached.
export const dynamic = 'force-dynamic';

const handler = productionAdminHandler('gl');

export function GET(request: Request): Promise<Response> {
  return handler(request);
}

export function POST(request: Request): Promise<Response> {
  return handler(request);
}
