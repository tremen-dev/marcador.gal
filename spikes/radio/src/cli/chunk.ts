/**
 * `npm run chunk -- --session <id>` — groups the archived segments of a
 * session into 20 s and 30 s chunks (CA-2) and writes `chunks-20.json` and
 * `chunks-30.json` under the session. It also concatenates the whole session
 * into `chunks/all.<ext>` so the person writing the corpus (CA-3) can listen
 * to it once with offsets that match the chunks'.
 */
import type { ArchivedSegment } from '../listen.ts';
import { groupIntoChunks } from '../chunks.ts';
import { assembleChunk } from '../asr/run.ts';
import { extensionFor, mimeFor, sniffContainer } from '../container.ts';
import { args, disk, need, readJson } from './common.ts';

const a = args();
const sessionId = need(a, 'session');
const archive = disk();
const segments = await readJson<ArchivedSegment[]>(archive, `sessions/${sessionId}/segments.json`);
const chunkable = segments.map((s) => ({ sequence: s.sequence, duration: s.duration, discontinuity: s.discontinuity, key: s.key, offsetSeconds: s.offsetSeconds }));
for (const target of [20, 30]) {
  const chunks = groupIntoChunks(chunkable, target);
  await archive.put(`sessions/${sessionId}/chunks-${target}.json`, new TextEncoder().encode(JSON.stringify(chunks, null, 2)), 'application/json');
  console.log(`${target} s: ${chunks.length} chunks (${chunks.filter((c) => c.durationSeconds < target).length} shorter than target)`);
}
const whole = groupIntoChunks(chunkable, Number.MAX_SAFE_INTEGER);
if (whole.length > 0) {
  const bytes = await assembleChunk(archive, whole[0]!);
  const container = sniffContainer(bytes);
  await archive.put(`sessions/${sessionId}/chunks/all.${extensionFor(container)}`, bytes, mimeFor(container));
  console.log(`whole session: ${whole.length} contiguous run(s); first run written as chunks/all.${extensionFor(container)} (${container}, ${whole[0]!.durationSeconds} s)`);
}
