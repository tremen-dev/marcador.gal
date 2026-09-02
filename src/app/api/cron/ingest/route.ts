/**
 * The ingest cron's route (SPEC-012 CA-7, ADR-019 §1).
 *
 * It DELEGATES WHOLE in `src/ingest/cron.ts`: authentication, composition and
 * the tick live there, provable without a child process. This file only binds
 * the handler to the App Router. It lives at `src/app${CRON_INGEST_PATH}/route.ts`
 * — the location a test derives from the constant (CA-8).
 */
import { cronIngestHandler, productionCronTick } from '@/ingest/cron';

// Every invocation does real work against Postgres and Blob: nothing here may
// be prerendered or cached.
export const dynamic = 'force-dynamic';

const handler = cronIngestHandler({ tick: productionCronTick, env: process.env });

export function GET(request: Request): Promise<Response> {
  return handler(request);
}
