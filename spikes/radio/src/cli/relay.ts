/**
 * `npm run relay -- --session <id> --url https://<deployment>/api/listen
 *   [--engines google,openai] [--length 20] [--container wav|native] [--count 10]`
 *
 * CA-4.2: at least ten chunks per engine sent FROM THE FUNCTION, in the
 * production region. For each chunk: upload its bytes and descriptor to the
 * Blob store (`sessions/<id>/relay/`), invoke the function in relay mode,
 * print the latency it measured. Then `npm run pull` brings the raw bodies
 * and metas back to `data/`.
 */
import { assembleChunk } from '../asr/run.ts';
import type { Container } from '../container.ts';
import { extensionFor, mimeFor } from '../container.ts';
import { args, blob, chunksOf, disk, listenReports, need } from './common.ts';

const a = args();
const sessionId = need(a, 'session');
const url = need(a, 'url');
const secret = process.env['SPIKE_SECRET'];
if (!secret) {
  console.error('SPIKE_SECRET is not set');
  process.exit(2);
}
const engineIds = (a.get('engines') ?? 'google,openai').split(',');
const acknowledged = (process.env['SPIKE_DPA_ACKNOWLEDGED'] ?? '').split(',').filter(Boolean);
for (const id of engineIds) {
  if (!acknowledged.includes(id)) {
    console.error(`refusing to send audio to ${id}: its DPA is not acknowledged (CA-0.2)`);
    process.exit(1);
  }
}
const length = Number(a.get('length') ?? '20');
const count = Number(a.get('count') ?? '10');
const wantWav = (a.get('container') ?? 'wav') === 'wav';

const local = disk();
const remote = blob();
const reports = await listenReports(local, sessionId);
const native = (reports[0]?.container ?? null) as Container | null;
if (native === null) {
  console.error('no listen report with a container');
  process.exit(1);
}
const chunks = (await chunksOf(local, sessionId, length)).slice(0, count);
for (const chunk of chunks) {
  const container: Container = wantWav ? 'wav' : native;
  const bytes = wantWav ? await local.get(`sessions/${sessionId}/chunks/${chunk.id}.wav`) : await assembleChunk(local, chunk);
  if (bytes === null) {
    console.error(`${chunk.id}: no WAV in data/ (run transcribe with WAV first)`);
    continue;
  }
  await remote.put(`sessions/${sessionId}/relay/${chunk.id}.${extensionFor(container)}`, bytes, mimeFor(container));
  await remote.put(`sessions/${sessionId}/relay/${chunk.id}.json`, new TextEncoder().encode(JSON.stringify({ chunk, container })), 'application/json');
  for (const engine of engineIds) {
    const res = await fetch(`${url}?mode=relay&session=${encodeURIComponent(sessionId)}&chunk=${encodeURIComponent(chunk.id)}&engine=${engine}`, { headers: { authorization: `Bearer ${secret}` } });
    const body = (await res.json()) as { region?: string; latencyMs?: number; outcome?: string; error?: string };
    console.log(`${chunk.id} ${engine} ${container} @${body.region ?? '?'} → ${body.outcome ?? body.error} (${body.latencyMs ?? '?'} ms)`);
  }
}
