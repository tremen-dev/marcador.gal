/**
 * The Vercel function of the spike (SPEC-019 CA-1, CA-4.2). Only wiring: the
 * logic is `src/handler.ts`, the listening `src/listen.ts`. `maxDuration` is
 * 800 in `vercel.json` (the ceiling of Pro with Fluid compute, ADR-029 §1).
 *
 * Deployed ONLY in the temporary project (`marcador-spike-radio`, Root
 * Directory `spikes/radio`), never in `marcador-gal` (spec §1, CA-7.5).
 *
 * Environment: SPIKE_SECRET, SPIKE_STREAM_URL, BLOB_READ_WRITE_TOKEN, and the
 * engine variables of `src/asr/*.ts` for relay mode.
 */
import { blobArchive } from '../src/archive.ts';
import { googleConfigFromEnv, googleEngine } from '../src/asr/google.ts';
import { openAiConfigFromEnv, openAiEngine } from '../src/asr/openai.ts';
import type { AsrEngine } from '../src/asr/port.ts';
import { handle } from '../src/handler.ts';
import { listenSession } from '../src/listen.ts';

const archive = blobArchive('spike-radio', process.env['BLOB_READ_WRITE_TOKEN']);

function engineFromEnv(id: string): AsrEngine {
  if (id === 'google') return googleEngine(googleConfigFromEnv(process.env));
  if (id === 'openai') return openAiEngine(openAiConfigFromEnv(process.env));
  throw new Error(`unknown engine ${id}`);
}

export function GET(request: Request): Promise<Response> {
  const streamUrl = process.env['SPIKE_STREAM_URL'];
  return handle(request, {
    secret: process.env['SPIKE_SECRET'],
    region: process.env['VERCEL_REGION'] ?? null,
    archive,
    listen: async ({ minutes, sessionId, region }) => {
      if (!streamUrl) throw new Error('SPIKE_STREAM_URL is not set (CA-0.3 first)');
      return listenSession(
        { playlistUrl: streamUrl, minutes, sessionId, region },
        {
          archive,
          now: Date.now,
          sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
          fetch: async (url, init) => {
            const res = await fetch(url, { headers: init.headers, cache: 'no-store' });
            return { status: res.status, bytes: async () => new Uint8Array(await res.arrayBuffer()) };
          },
        },
      );
    },
    engine: engineFromEnv,
    fetch: (url, init) => fetch(url, init),
    now: Date.now,
    newSessionId: () => `${new Date().toISOString().replaceAll(/[-:.]/g, '').replace('T', 't').replace('Z', 'z')}-${Math.random().toString(36).slice(2, 6)}`,
  });
}
