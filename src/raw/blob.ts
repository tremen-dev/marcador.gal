/**
 * `RawStore` over Vercel Blob: the production implementation (ADR-005).
 *
 * Vercel's filesystem is ephemeral (ADR-004), so the raw archive cannot live
 * on disk in production. Layout mirrors `DiskRawStore` exactly — `objects/`
 * and `meta/` — so the same contract battery describes both.
 *
 * Blobs are stored with `access: 'private'`: the archive holds third-party
 * responses fetched under RN-11, and republishing them is not what RN-10 asks
 * for.
 *
 * NOT VERIFIED at the time of writing: `BLOB_READ_WRITE_TOKEN` did not exist
 * yet. `tests/raw/blob.contract.test.ts` runs the same battery against it and
 * fails loudly without the token; SPEC-001 CA-9 is not satisfied until that
 * output is in the ledger.
 */
import { get as blobGet, list as blobList, put as blobPut } from '@vercel/blob';
import {
  RawKeyConflictError,
  assertValidRawKey,
  checkedPrefix,
  keyHasPrefix,
  rawKey,
} from './store';
import type { RawObject, RawObjectMeta, RawRef, RawStore } from './store';

const OBJECTS = 'objects/';
const META = 'meta/';

async function bytesOf(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export class BlobRawStore implements RawStore {
  readonly #token: string | undefined;

  /**
   * @param token read-write token; defaults to `BLOB_READ_WRITE_TOKEN`, which
   *   the SDK reads on its own.
   */
  constructor(token?: string) {
    this.#token = token;
  }

  async put(meta: RawObjectMeta, body: Uint8Array): Promise<RawRef> {
    const key = rawKey(meta, body);

    const existing = await this.#download(`${OBJECTS}${key}`);
    if (existing !== null) {
      if (!Buffer.from(existing).equals(Buffer.from(body))) {
        throw new RawKeyConflictError(key);
      }
      return key;
    }

    // `addRandomSuffix: false` is not optional here: with the default suffix
    // the stored pathname stops being the key we derived, and both the
    // idempotence and the round-trip of CA-9 break in this implementation
    // only — the one that never runs locally (CA-10, note to the implementer).
    await blobPut(`${OBJECTS}${key}`, Buffer.from(body), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: 'application/octet-stream',
      ...(this.#token === undefined ? {} : { token: this.#token }),
    });

    await blobPut(`${META}${key}.json`, JSON.stringify(meta), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: 'application/json',
      ...(this.#token === undefined ? {} : { token: this.#token }),
    });

    return key;
  }

  async get(key: string): Promise<RawObject | null> {
    assertValidRawKey(key);

    const body = await this.#download(`${OBJECTS}${key}`);
    if (body === null) return null;

    const rawMeta = await this.#download(`${META}${key}.json`);
    if (rawMeta === null) return null;

    return {
      key: key as RawRef,
      meta: JSON.parse(new TextDecoder().decode(rawMeta)) as RawObjectMeta,
      body,
    };
  }

  async list(prefix: string): Promise<readonly string[]> {
    const wanted = checkedPrefix(prefix);
    const keys: string[] = [];
    let cursor: string | undefined;

    do {
      const page = await blobList({
        prefix: `${OBJECTS}${wanted}`,
        ...(cursor === undefined ? {} : { cursor }),
        ...(this.#token === undefined ? {} : { token: this.#token }),
      });

      for (const blob of page.blobs) {
        if (!blob.pathname.startsWith(OBJECTS)) continue;
        const key = blob.pathname.slice(OBJECTS.length);
        // The store-side prefix is textual; segment matching is ours (CA-9.3).
        if (keyHasPrefix(key, wanted)) keys.push(key);
      }

      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor !== undefined);

    return keys.sort();
  }

  /** The bytes at a pathname, or `null` when nothing is there. */
  async #download(pathname: string): Promise<Uint8Array | null> {
    const result = await blobGet(pathname, {
      access: 'private',
      // The archive is read right after it is written; a CDN hit would be a
      // stale answer, and a raw store that answers stale is not an archive.
      useCache: false,
      ...(this.#token === undefined ? {} : { token: this.#token }),
    });

    if (result === null || result.statusCode !== 200) return null;

    return await bytesOf(result.stream);
  }
}
