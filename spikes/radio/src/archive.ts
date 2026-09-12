/**
 * The spike's archive: where every raw body goes BEFORE anyone reads it
 * (SPEC-019 §3, RN-10 in spirit). Two implementations: disk under `data/` on
 * the laptop, Vercel Blob (private) inside the function. Keys are the same
 * in both, so `pull` can mirror the Blob into `data/` and the analysis is
 * done cold, on the laptop, like SPEC-002 separated capture from analysis.
 *
 * This is NOT the product's `RawStore` (`src/raw/`), and it does not pretend
 * to be: no retention, no key grammar beyond «a path».
 */
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { del, get, list, put } from '@vercel/blob';

export interface Archive {
  /** Writes bytes at `key`. Idempotent: the same key is written once. */
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  /** Keys under `prefix`, sorted. */
  list(prefix: string): Promise<readonly string[]>;
  /** Removes everything under `prefix`; returns how many objects went. */
  purge(prefix: string): Promise<number>;
}

export function diskArchive(root: string): Archive {
  const pathOf = (key: string): string => join(root, ...key.split('/'));
  return {
    async put(key, bytes, _contentType) {
      const path = pathOf(key);
      await mkdir(dirname(path), { recursive: true });
      try {
        await stat(path);
        return; // already archived: same key, same digest in the name
      } catch {
        await writeFile(path, bytes, { flag: 'wx' });
      }
    },
    async get(key) {
      try {
        return new Uint8Array(await readFile(pathOf(key)));
      } catch {
        return null;
      }
    },
    async list(prefix) {
      const dir = pathOf(prefix);
      let entries: string[];
      try {
        entries = await readdir(dir, { recursive: true });
      } catch {
        return [];
      }
      const keys: string[] = [];
      for (const entry of entries) {
        const full = join(dir, entry);
        if ((await stat(full)).isFile()) keys.push(relative(root, full).split(sep).join('/'));
      }
      return keys.sort();
    },
    async purge(prefix) {
      const keys = await this.list(prefix);
      await rm(pathOf(prefix), { recursive: true, force: true });
      return keys.length;
    },
  };
}

/** Vercel Blob, private access, no random suffix: the key IS the pathname. */
export function blobArchive(prefix: string, token?: string): Archive {
  const auth = token === undefined ? {} : { token };
  const pathOf = (key: string): string => `${prefix}/${key}`;
  const listAll = async (keyPrefix: string): Promise<readonly string[]> => {
    const keys: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: pathOf(keyPrefix), limit: 1000, ...(cursor === undefined ? {} : { cursor }), ...auth });
      for (const b of page.blobs) keys.push(b.pathname.slice(prefix.length + 1));
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor !== undefined);
    return keys.sort();
  };
  return {
    async put(key, bytes, contentType) {
      await put(pathOf(key), Buffer.from(bytes), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType, ...auth });
    },
    async get(key) {
      const result = await get(pathOf(key), { access: 'private', useCache: false, ...auth });
      if (result === null || result.stream === null) return null;
      return new Uint8Array(await new Response(result.stream).arrayBuffer());
    },
    list: listAll,
    async purge(keyPrefix) {
      const keys = await listAll(keyPrefix);
      for (let i = 0; i < keys.length; i += 100) {
        await del(keys.slice(i, i + 100).map(pathOf), auth);
      }
      return keys.length;
    },
  };
}

/** In-memory archive for tests: records the ORDER of writes, which CA-1.2 needs. */
export function memoryArchive(): Archive & { readonly writes: readonly string[]; readonly objects: ReadonlyMap<string, Uint8Array> } {
  const objects = new Map<string, Uint8Array>();
  const writes: string[] = [];
  return {
    writes,
    objects,
    async put(key, bytes) {
      if (objects.has(key)) return;
      objects.set(key, bytes);
      writes.push(key);
    },
    async get(key) {
      return objects.get(key) ?? null;
    },
    async list(prefix) {
      return [...objects.keys()].filter((k) => k.startsWith(prefix)).sort();
    },
    async purge(prefix) {
      let n = 0;
      for (const k of [...objects.keys()]) if (k.startsWith(prefix)) objects.delete(k) && n++;
      return n;
    },
  };
}
