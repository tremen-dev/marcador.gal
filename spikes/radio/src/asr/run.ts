/**
 * The driver that sends chunks to engines (SPEC-019 CA-2, CA-4).
 *
 * Order per chunk and engine (CA-2.1): the NATIVE container first, as the
 * CDN served it; if the engine rejects it or returns empty, the same chunk
 * DECODED to WAV (by `ffmpeg` on the laptop, never inside the function). With
 * `containers: 'both'` both are always sent, which is what fills the
 * engine × container table.
 *
 * Per exchange, in this order and never another (CA-2.2): the raw body is
 * archived under `sessions/<s>/asr/<engine>/<chunk>.<container>.<sentAt>.<status>.<ext>`,
 * THEN a `.meta.json` beside it with timing, parameters and outcome, THEN the
 * transcript text (if any) under `transcripts/`. A row without its raw file
 * cannot exist because the raw file is written first.
 */
import type { Archive } from '../archive.ts';
import { type Chunk } from '../chunks.ts';
import { type Container, extensionFor, mimeFor } from '../container.ts';
import type { AsrEngine, AsrOutcome, Fetch } from './port.ts';

export type Origin = 'laptop' | 'vercel';

export interface ExchangeMeta {
  readonly sessionId: string;
  readonly chunkId: string;
  readonly targetSeconds: number;
  readonly chunkDurationSeconds: number;
  readonly startOffsetSeconds: number;
  readonly endOffsetSeconds: number;
  readonly engine: string;
  readonly model: string;
  readonly container: Container;
  readonly origin: Origin;
  readonly sentAt: string;
  readonly receivedAt: string;
  readonly latencyMs: number;
  readonly status: number;
  readonly rawKey: string;
  readonly transcriptKey: string | null;
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly outcome: AsrOutcome['kind'];
  readonly reason: string | null;
}

export interface RunDeps {
  readonly archive: Archive;
  readonly fetch: Fetch;
  readonly now: () => number;
  /** Native bytes → WAV. Absent inside the function. */
  readonly decodeToWav?: (bytes: Uint8Array) => Promise<Uint8Array>;
}

export interface RunOptions {
  readonly sessionId: string;
  readonly origin: Origin;
  readonly containers: 'native-then-wav' | 'both' | 'native' | 'wav';
}

function compact(iso: string): string {
  return iso.replaceAll(/[-:.]/g, '').replace('T', 't').replace('Z', 'z');
}

/** Concatenates the archived segment bytes of a chunk. */
export async function assembleChunk(archive: Archive, chunk: Chunk): Promise<Uint8Array> {
  const parts: Uint8Array[] = [];
  for (const key of chunk.keys) {
    const bytes = await archive.get(key);
    if (bytes === null) throw new Error(`segment ${key} is not in the archive`);
    parts.push(bytes);
  }
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

export async function sendOne(
  chunk: Chunk,
  audio: Uint8Array,
  container: Container,
  engine: AsrEngine,
  opts: RunOptions,
  deps: RunDeps,
): Promise<ExchangeMeta> {
  const base = `sessions/${opts.sessionId}`;
  const exchange = await engine.send({ audio, container, chunkId: chunk.id }, deps.fetch, deps.now);
  const rawKey = `${base}/asr/${engine.id}/${chunk.id}.${container}.${opts.origin}.${compact(exchange.sentAt)}.${exchange.status}.${exchange.rawExtension}`;
  // 1. RAW, before a single character is read (CA-2.2).
  await deps.archive.put(rawKey, exchange.rawBody, exchange.rawExtension === 'json' ? 'application/json' : 'text/plain');
  // 2. Only now.
  const outcome = engine.parse(exchange.rawBody, exchange.status);
  let transcriptKey: string | null = null;
  if (outcome.kind === 'transcribed') {
    transcriptKey = `${base}/transcripts/${engine.id}/${chunk.id}.${container}.${opts.origin}.txt`;
    await deps.archive.put(transcriptKey, new TextEncoder().encode(outcome.text), 'text/plain');
  }
  const meta: ExchangeMeta = {
    sessionId: opts.sessionId,
    chunkId: chunk.id,
    targetSeconds: chunk.targetSeconds,
    chunkDurationSeconds: chunk.durationSeconds,
    startOffsetSeconds: chunk.startOffsetSeconds,
    endOffsetSeconds: chunk.endOffsetSeconds,
    engine: engine.id,
    model: engine.model,
    container,
    origin: opts.origin,
    sentAt: exchange.sentAt,
    receivedAt: exchange.receivedAt,
    latencyMs: exchange.latencyMs,
    status: exchange.status,
    rawKey,
    transcriptKey,
    parameters: exchange.parameters,
    outcome: outcome.kind,
    reason: outcome.kind === 'rejected' ? outcome.reason : null,
  };
  await deps.archive.put(`${rawKey}.meta.json`, new TextEncoder().encode(JSON.stringify(meta, null, 2)), 'application/json');
  return meta;
}

export async function runChunk(chunk: Chunk, nativeContainer: Container, engines: readonly AsrEngine[], opts: RunOptions, deps: RunDeps): Promise<ExchangeMeta[]> {
  const base = `sessions/${opts.sessionId}`;
  const native = await assembleChunk(deps.archive, chunk);
  await deps.archive.put(`${base}/chunks/${chunk.id}.${extensionFor(nativeContainer)}`, native, mimeFor(nativeContainer));
  let wav: Uint8Array | null = null;
  const getWav = async (): Promise<Uint8Array> => {
    if (wav !== null) return wav;
    if (deps.decodeToWav === undefined) throw new Error('no decoder here: WAV is produced on the laptop, never inside the function (CA-2.1)');
    wav = await deps.decodeToWav(native);
    await deps.archive.put(`${base}/chunks/${chunk.id}.wav`, wav, 'audio/wav');
    return wav;
  };

  const out: ExchangeMeta[] = [];
  for (const engine of engines) {
    if (opts.containers !== 'wav') {
      const m = await sendOne(chunk, native, nativeContainer, engine, opts, deps);
      out.push(m);
      if (opts.containers === 'native') continue;
      if (opts.containers === 'native-then-wav' && m.outcome === 'transcribed') continue;
    }
    out.push(await sendOne(chunk, await getWav(), 'wav', engine, opts, deps));
  }
  return out;
}

/** Every `.meta.json` of a session, parsed. The report reads from here. */
export async function readExchanges(archive: Archive, sessionId: string): Promise<ExchangeMeta[]> {
  const keys = (await archive.list(`sessions/${sessionId}/asr/`)).filter((k) => k.endsWith('.meta.json'));
  const out: ExchangeMeta[] = [];
  for (const key of keys) {
    const bytes = await archive.get(key);
    if (bytes !== null) out.push(JSON.parse(new TextDecoder().decode(bytes)) as ExchangeMeta);
  }
  return out;
}
