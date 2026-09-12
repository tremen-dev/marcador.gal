/** Shared wiring of the laptop commands. `data/` is the disk archive root. */
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { type Archive, blobArchive, diskArchive } from '../archive.ts';
import { googleConfigFromEnv, googleEngine } from '../asr/google.ts';
import { openAiConfigFromEnv, openAiEngine } from '../asr/openai.ts';
import type { AsrEngine } from '../asr/port.ts';
import type { Chunk } from '../chunks.ts';
import type { ListenReport } from '../listen.ts';

export const DATA_ROOT = fileURLToPath(new URL('../../data/', import.meta.url));
export const BLOB_PREFIX = 'spike-radio';

export function args(): Map<string, string> {
  const out = new Map<string, string>();
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a.startsWith('--')) {
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        out.set(a.slice(2), next);
        i++;
      } else out.set(a.slice(2), 'true');
    } else out.set(`_${out.size}`, a);
  }
  return out;
}

export function need(map: Map<string, string>, key: string): string {
  const v = map.get(key);
  if (v === undefined) {
    console.error(`missing --${key}`);
    process.exit(2);
  }
  return v;
}

export function disk(): Archive {
  return diskArchive(DATA_ROOT);
}

export function blob(): Archive {
  const token = process.env['BLOB_READ_WRITE_TOKEN'];
  if (!token) {
    console.error('BLOB_READ_WRITE_TOKEN is not set');
    process.exit(2);
  }
  return blobArchive(BLOB_PREFIX, token);
}

export function enginesFromEnv(ids: readonly string[]): AsrEngine[] {
  return ids.map((id) => {
    if (id === 'google') return googleEngine(googleConfigFromEnv(process.env));
    if (id === 'openai') return openAiEngine(openAiConfigFromEnv(process.env));
    throw new Error(`unknown engine ${id}`);
  });
}

export async function readJson<T>(archive: Archive, key: string): Promise<T> {
  const bytes = await archive.get(key);
  if (bytes === null) throw new Error(`${key} is not in the archive`);
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

export async function readJsonFile<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T;
}

export async function listenReports(archive: Archive, sessionId: string): Promise<ListenReport[]> {
  const keys = (await archive.list(`sessions/${sessionId}/`)).filter((k) => /\/listen-[0-9tz]+\.json$/.test(k));
  const out: ListenReport[] = [];
  for (const k of keys) out.push(await readJson<ListenReport>(archive, k));
  return out;
}

export async function chunksOf(archive: Archive, sessionId: string, targetSeconds: number): Promise<Chunk[]> {
  return readJson<Chunk[]>(archive, `sessions/${sessionId}/chunks-${targetSeconds}.json`);
}

export function stamp(): string {
  return new Date().toISOString().replaceAll(/[-:.]/g, '').replace('T', 't').replace('Z', 'z');
}
