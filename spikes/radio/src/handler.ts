/**
 * The Vercel function's logic, apart from the wiring (SPEC-019 CA-1, CA-4.2),
 * so that its closed failure and its two modes can be tested without Vercel.
 *
 *   GET /api/listen?mode=listen&minutes=11[&session=<id>]
 *     → listens for N minutes (cap 12: 720 s < maxDuration 800) and returns
 *       the CA-1.1 JSON.
 *   GET /api/listen?mode=relay&session=<id>&chunk=<chunkId>&engine=google|openai
 *     → CA-4.2: re-sends an already archived chunk (uploaded by `cli/relay.ts`
 *       to `sessions/<id>/relay/<chunkId>.<ext>` with its descriptor beside
 *       it) to the engine FROM THE FUNCTION, archives the raw body in Blob,
 *       and returns the exchange meta with its latency.
 *
 * `Authorization: Bearer <SPIKE_SECRET>` on every call; without the variable
 * or without the exact header, 401 and no work (fail closed, as the product's
 * cron does, ADR-019 §1).
 */
import type { Archive } from './archive.ts';
import type { AsrEngine } from './asr/port.ts';
import { type ExchangeMeta, sendOne } from './asr/run.ts';
import type { Chunk } from './chunks.ts';
import { type Container, extensionFor } from './container.ts';
import type { ListenReport } from './listen.ts';

export const MAX_MINUTES = 12;
export const DEFAULT_MINUTES = 11;

export interface HandlerDeps {
  readonly secret: string | undefined;
  readonly region: string | null;
  readonly archive: Archive;
  readonly listen: (opts: { minutes: number; sessionId: string; region: string | null }) => Promise<ListenReport>;
  readonly engine: (id: string) => AsrEngine;
  readonly fetch: (url: string, init: RequestInit) => Promise<Response>;
  readonly now: () => number;
  readonly newSessionId: () => string;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body, null, 2), { status, headers: { 'content-type': 'application/json' } });
}

export async function handle(request: Request, deps: HandlerDeps): Promise<Response> {
  if (deps.secret === undefined || deps.secret.length === 0) return json(401, { error: 'SPIKE_SECRET is not set: refusing everything (fail closed)' });
  if (request.headers.get('authorization') !== `Bearer ${deps.secret}`) return json(401, { error: 'unauthorized' });

  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') ?? 'listen';

  if (mode === 'listen') {
    const minutes = Math.min(MAX_MINUTES, Math.max(0.1, Number(url.searchParams.get('minutes') ?? DEFAULT_MINUTES)));
    const sessionId = url.searchParams.get('session') ?? deps.newSessionId();
    const report = await deps.listen({ minutes, sessionId, region: deps.region });
    return json(200, report);
  }

  if (mode === 'relay') {
    const sessionId = url.searchParams.get('session');
    const chunkId = url.searchParams.get('chunk');
    const engineId = url.searchParams.get('engine');
    if (!sessionId || !chunkId || !engineId) return json(400, { error: 'relay needs session, chunk and engine' });
    const descriptorBytes = await deps.archive.get(`sessions/${sessionId}/relay/${chunkId}.json`);
    if (descriptorBytes === null) return json(404, { error: `no descriptor for chunk ${chunkId}` });
    const descriptor = JSON.parse(new TextDecoder().decode(descriptorBytes)) as { chunk: Chunk; container: Container };
    const audio = await deps.archive.get(`sessions/${sessionId}/relay/${chunkId}.${extensionFor(descriptor.container)}`);
    if (audio === null) return json(404, { error: `no audio for chunk ${chunkId}` });
    let engine: AsrEngine;
    try {
      engine = deps.engine(engineId);
    } catch (e) {
      return json(400, { error: String(e) });
    }
    const meta: ExchangeMeta = await sendOne(descriptor.chunk, audio, descriptor.container, engine, { sessionId, origin: 'vercel', containers: 'native' }, { archive: deps.archive, fetch: deps.fetch, now: deps.now });
    return json(200, { region: deps.region, ...meta });
  }

  return json(400, { error: `unknown mode ${mode}` });
}
