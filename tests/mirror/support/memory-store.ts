/**
 * An in-memory `RawStore` for the tests that are about the capturer's rhythm
 * and not about the archive itself.
 *
 * It is the SPEC-001 port, unchanged: same `rawKey`, same three operations.
 * The tests that are about the archive (CA-4, CA-14) use `DiskRawStore`,
 * because there the filesystem IS the thing under test.
 */
import { rawKey } from '@/raw/store';
import type { RawObject, RawObjectMeta, RawRef, RawStore } from '@/raw/store';

export class MemoryRawStore implements RawStore {
  readonly #objects = new Map<string, RawObject>();

  put(meta: RawObjectMeta, body: Uint8Array): Promise<RawRef> {
    const key = rawKey(meta, body);
    this.#objects.set(key, { key, meta, body });
    return Promise.resolve(key);
  }

  get(key: string): Promise<RawObject | null> {
    return Promise.resolve(this.#objects.get(key) ?? null);
  }

  list(prefix: string): Promise<readonly string[]> {
    return Promise.resolve(
      [...this.#objects.keys()].filter((key) => key.startsWith(prefix)).sort(),
    );
  }

  get size(): number {
    return this.#objects.size;
  }
}

/** A store whose `put` always rejects. CA-3 needs one. */
export class FailingRawStore implements RawStore {
  readonly failure: Error;

  constructor(message = 'blob store unreachable') {
    this.failure = new Error(message);
  }

  put(): Promise<RawRef> {
    return Promise.reject(this.failure);
  }

  get(): Promise<RawObject | null> {
    return Promise.resolve(null);
  }

  list(): Promise<readonly string[]> {
    return Promise.resolve([]);
  }
}
