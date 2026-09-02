/**
 * The correspondent bot's webhook (SPEC-015 CA-1.6, ADR-022 §1).
 *
 * It DELEGATES WHOLE in `src/bot/webhook.ts`: the secret, the authorisation,
 * the composition and the routing live there, provable without a child
 * process. This file only binds the handler to the App Router, and it holds no
 * logic — a case asserts that it imports nothing of `src/db/`, `src/raw/` or
 * `src/decide/`. It is the same shape as `src/app/api/cron/ingest/route.ts`.
 */
import { productionTelegramWebhook } from '@/bot/webhook';

// Every invocation does real work against Postgres and Blob: nothing here may
// be prerendered or cached.
export const dynamic = 'force-dynamic';

const handler = productionTelegramWebhook();

export function POST(request: Request): Promise<Response> {
  return handler(request);
}
