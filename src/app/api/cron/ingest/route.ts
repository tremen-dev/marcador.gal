/**
 * The ingest cron's route (SPEC-012 CA-7, ADR-019 §1).
 *
 * It DELEGATES WHOLE in `src/ingest/cron.ts`: authentication, composition and
 * the tick live there, provable without a child process. This file only binds
 * the handler to the App Router. It lives at `src/app${CRON_INGEST_PATH}/route.ts`
 * — the location a test derives from the constant (CA-8).
 */
import { productionCycle } from '@/decide/cycle';
import { cronIngestHandler } from '@/ingest/cron';

// Every invocation does real work against Postgres and Blob: nothing here may
// be prerendered or cached.
export const dynamic = 'force-dynamic';

// SPEC-013 CA-12.2: the ONE line this file changes. The route keeps
// authenticating, keeps failing closed without `CRON_SECRET` and keeps holding
// no logic; what it injects is now the CYCLE of `src/decide/`, which runs the
// tick of `src/ingest/` and then the engine, in the same invocation (ADR-021
// §4). This amends the LETTER of SPEC-012 CA-7, by the way ADR-015 sanctions.
const handler = cronIngestHandler({ tick: productionCycle, env: process.env });

export function GET(request: Request): Promise<Response> {
  return handler(request);
}
