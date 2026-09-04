/**
 * `GET /api/board` — the snapshot as JSON (SPEC-018 CA-1.2, ADR-003, ADR-027 §1).
 *
 * It DELEGATES WHOLE in `src/api/handler.ts`: the projection, the `ETag` and
 * the headers live there, provable without a child process. This file holds no
 * logic — a case asserts that it exports nothing but `GET` and `dynamic`, and
 * that it names neither `src/db/`, nor `src/decide/`, nor `src/design/`. It is
 * the same shape as `src/app/api/cron/ingest/route.ts`.
 *
 * IT IS PUBLIC, AND THE RESIDUE IS WRITTEN AND NOT DISGUISED (ADR-027 §3.a):
 * anybody with the browser's tools can read this JSON. It exists BECAUSE THE
 * SCREEN USES IT, not as a surface offered to third parties, and that
 * distinction is held by four checkable things — no CORS header ever, the same
 * `X-Robots-Tag` as the document, no documentation anywhere, and exactly the
 * closed list of `src/api/contract.ts`.
 */
import { productionBoardApiHandler } from '@/api/handler';

// Every invocation projects against Postgres and answers a public reader:
// nothing here may be prerendered. The caching that matters is the SHARED and
// short `s-maxage` the handler emits (ADR-027 §7.3).
export const dynamic = 'force-dynamic';

const handler = productionBoardApiHandler();

export function GET(request: Request): Promise<Response> {
  return handler(request);
}
