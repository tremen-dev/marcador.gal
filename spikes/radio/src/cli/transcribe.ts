/**
 * `npm run transcribe -- --session <id> [--engines google,openai]
 *   [--lengths 20,30] [--containers native-then-wav|both|native|wav] [--limit N]`
 *
 * CA-2 and CA-4.1 from the laptop: every chunk of every length to every
 * engine, native container first and WAV (ffmpeg here, never in the
 * function) if rejected or empty. Raw bodies are archived before parsing
 * (`asr/run.ts`). Needs the engines' variables AND the DPA of each engine in
 * `docs/legal/` (CA-0.2): the command refuses to run without
 * `SPIKE_DPA_ACKNOWLEDGED=<engine,engine>` naming each engine it is asked to
 * send audio to, which the operator sets only after archiving the copies.
 */
import type { Container } from '../container.ts';
import { runChunk } from '../asr/run.ts';
import { transcodeToWav } from '../transcode.ts';
import { args, chunksOf, disk, enginesFromEnv, listenReports, need } from './common.ts';

const a = args();
const sessionId = need(a, 'session');
const engineIds = (a.get('engines') ?? 'google,openai').split(',');
const lengths = (a.get('lengths') ?? '20,30').split(',').map(Number);
const containers = (a.get('containers') ?? 'native-then-wav') as 'native-then-wav' | 'both' | 'native' | 'wav';
const limit = a.has('limit') ? Number(a.get('limit')) : Infinity;

const acknowledged = (process.env['SPIKE_DPA_ACKNOWLEDGED'] ?? '').split(',').filter(Boolean);
for (const id of engineIds) {
  if (!acknowledged.includes(id)) {
    console.error(`refusing to send audio to ${id}: its DPA is not acknowledged (CA-0.2). Archive the dated copy in docs/legal/ and set SPIKE_DPA_ACKNOWLEDGED=${engineIds.join(',')}`);
    process.exit(1);
  }
}

const archive = disk();
const engines = enginesFromEnv(engineIds);
const reports = await listenReports(archive, sessionId);
const container = (reports[0]?.container ?? null) as Container | null;
if (container === null) {
  console.error('the session has no listen report with a container');
  process.exit(1);
}
let decodeMsTotal = 0;
let decodes = 0;
const decodeToWav = async (bytes: Uint8Array): Promise<Uint8Array> => {
  const t = await transcodeToWav(bytes);
  decodeMsTotal += t.ms;
  decodes++;
  return t.wav;
};
for (const target of lengths) {
  const chunks = (await chunksOf(archive, sessionId, target)).slice(0, limit);
  for (const chunk of chunks) {
    const metas = await runChunk(chunk, container, engines, { sessionId, origin: 'laptop', containers }, { archive, fetch: (u, i) => fetch(u, i), now: Date.now, decodeToWav });
    for (const m of metas) console.log(`${chunk.id} ${m.engine} ${m.container} → ${m.outcome} (${m.latencyMs} ms)${m.reason ? ` ${m.reason}` : ''}`);
  }
}
if (decodes > 0) console.log(`ffmpeg: ${decodes} decodes, ${Math.round(decodeMsTotal / decodes)} ms each on average (ADR-029 §7, step 3 cost on the laptop)`);
