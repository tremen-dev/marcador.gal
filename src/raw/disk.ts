/**
 * `RawStore` over the filesystem: local development and the replay of
 * jornadas in tests (ADR-005). Not usable in production — Vercel's filesystem
 * is ephemeral (ADR-004) — which is precisely why the port has two
 * implementations and one contract battery.
 *
 * Layout under the root:
 *   `objects/<key>`      the bytes, exactly as the source answered
 *   `meta/<key>.json`    the metadata
 *
 * Keeping metadata in a parallel tree is what lets `list` walk `objects/` and
 * return keys without having to filter sidecar files out.
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import {
  RawKeyConflictError,
  assertValidRawKey,
  checkedPrefix,
  keyHasPrefix,
  rawKey,
} from './store';
import type { RawObject, RawObjectMeta, RawRef, RawStore } from './store';

function isNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'ENOENT'
  );
}

async function readIfPresent(path: string): Promise<Buffer | null> {
  try {
    return await readFile(path);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export class DiskRawStore implements RawStore {
  readonly #root: string;

  constructor(root: string) {
    this.#root = root;
  }

  /** The directory the store owns. Nothing is ever written outside it. */
  get root(): string {
    return this.#root;
  }

  async put(meta: RawObjectMeta, body: Uint8Array): Promise<RawRef> {
    const key = rawKey(meta, body);
    const objectPath = this.#objectPath(key);

    const existing = await readIfPresent(objectPath);
    if (existing !== null) {
      // Same bytes: putting again is a no-op, not a failure. Different bytes:
      // the raw store is an archive and does not accept amendments.
      if (!Buffer.from(existing).equals(Buffer.from(body))) {
        throw new RawKeyConflictError(key);
      }
      return key;
    }

    await mkdir(dirname(objectPath), { recursive: true });
    await writeFile(objectPath, body);

    const metaPath = this.#metaPath(key);
    await mkdir(dirname(metaPath), { recursive: true });
    await writeFile(metaPath, JSON.stringify(meta), 'utf8');

    return key;
  }

  async get(key: string): Promise<RawObject | null> {
    assertValidRawKey(key);

    const body = await readIfPresent(this.#objectPath(key));
    if (body === null) return null;

    const rawMeta = await readIfPresent(this.#metaPath(key));
    if (rawMeta === null) return null;

    return {
      key: key as RawRef,
      meta: JSON.parse(rawMeta.toString('utf8')) as RawObjectMeta,
      body: new Uint8Array(body),
    };
  }

  async list(prefix: string): Promise<readonly string[]> {
    const wanted = checkedPrefix(prefix);
    const objects = join(this.#root, 'objects');

    let entries;
    try {
      entries = await readdir(objects, { recursive: true, withFileTypes: true });
    } catch (error) {
      if (isNotFound(error)) return [];
      throw error;
    }

    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => relative(objects, join(entry.parentPath, entry.name)).split(sep).join('/'))
      .filter((key) => keyHasPrefix(key, wanted))
      .sort();
  }

  #objectPath(key: string): string {
    assertValidRawKey(key);
    return join(this.#root, 'objects', ...key.split('/'));
  }

  #metaPath(key: string): string {
    assertValidRawKey(key);
    return join(this.#root, 'meta', ...`${key}.json`.split('/'));
  }
}
