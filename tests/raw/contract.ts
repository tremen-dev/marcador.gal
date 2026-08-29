/**
 * CA-9 — THE contract battery of `RawStore`. There is exactly one, and it runs
 * against both implementations: `DiskRawStore` over a temporary directory and
 * `BlobRawStore` over a real Vercel Blob store (ADR-005).
 *
 * This file is not a `*.test.ts` on purpose: it is invoked, not collected.
 */
import { randomUUID } from 'node:crypto';
import { beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { InvalidRawKeyError, rawKey } from '@/raw/store';
import type { RawObject, RawObjectMeta, RawStore } from '@/raw/store';

export type CreateRawStore = () => Promise<RawStore>;

const FETCHED_AT = '2026-03-21T17:00:00.000Z';

/** Every key that must be refused before the store touches any I/O (CA-10.3). */
const ESCAPING_KEYS: ReadonlyArray<readonly [string, string]> = [
  ['a parent-directory hop', 'test/../../etc/passwd'],
  ['a leading slash', '/test/comp/2026-03-21/x.html'],
  ['a backslash', 'test\\comp\\2026-03-21\\x.html'],
  ['an uppercase letter', 'Test/comp/2026-03-21/x.html'],
  ['a character outside the charset', 'test/comp/2026-03-21/x?y.html'],
];

function bodyOf(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function rawStoreContract(name: string, createStore: CreateRawStore): void {
  describe(`RawStore contract — ${name}`, () => {
    let store: RawStore;
    let ns: string;

    beforeAll(async () => {
      store = await createStore();
    });

    beforeEach(() => {
      // Every case gets its own namespace so a shared, real store (Blob) does
      // not carry state from one run to the next.
      ns = randomUUID().slice(0, 8);
    });

    const metaFor = (competition: string, ext = 'html'): RawObjectMeta => ({
      source: 'test',
      competition_id: competition,
      fetched_at: FETCHED_AT,
      ext,
    });

    async function mustGet(key: string): Promise<RawObject> {
      const object = await store.get(key);
      if (object === null) throw new Error(`expected an object at ${key}`);
      return object;
    }

    describe('1. bytes go in and come back identical', () => {
      test('a plain body round-trips', async () => {
        const meta = metaFor(`plain-${ns}`);
        const body = bodyOf('<html><td>1</td><td>0</td></html>');

        const ref = await store.put(meta, body);

        expect([...(await mustGet(ref)).body]).toEqual([...body]);
      });

      test('a body with a byte that is not valid UTF-8 round-trips', async () => {
        // The raw is not text: it is whatever the source answered. A store
        // that decodes to a string on the way through corrupts this body.
        const meta = metaFor(`binary-${ns}`);
        const body = new Uint8Array([0x3c, 0x68, 0x74, 0x6d, 0x6c, 0x3e, 0xff, 0xfe, 0x00, 0x80]);

        const ref = await store.put(meta, body);

        expect([...(await mustGet(ref)).body]).toEqual([...body]);
      });
    });

    describe('2. a key that holds nothing', () => {
      test('get returns null instead of throwing', async () => {
        const key = rawKey(metaFor(`absent-${ns}`), bodyOf('never stored'));

        await expect(store.get(key)).resolves.toBeNull();
      });
    });

    describe('3. list returns exactly the keys under the prefix', () => {
      test('a prefix that is a textual prefix of another does not leak', async () => {
        const inside = metaFor(`preferente-${ns}`);
        const decoy = metaFor(`preferente-${ns}-b`);

        const first = await store.put(inside, bodyOf('jornada 23, A'));
        const second = await store.put(inside, bodyOf('jornada 23, B'));
        const outside = await store.put(decoy, bodyOf('grupo B'));

        const listed = await store.list(`test/preferente-${ns}`);

        expect([...listed].sort()).toEqual([first, second].sort());
        expect(listed).not.toContain(outside);
      });

      test('the deeper the prefix, the fewer the keys', async () => {
        const meta = metaFor(`deep-${ns}`);
        const ref = await store.put(meta, bodyOf('one'));

        await expect(store.list(`test/deep-${ns}/2026-03-21`)).resolves.toEqual([ref]);
      });
    });

    describe('4. an empty space', () => {
      test('list returns an empty array', async () => {
        await expect(store.list(`test/nothing-here-${ns}`)).resolves.toEqual([]);
      });
    });

    describe('5. metadata', () => {
      test('comes back exactly as it was written', async () => {
        const meta = metaFor(`meta-${ns}`, 'json');

        const ref = await store.put(meta, bodyOf('{"score":"1-0"}'));

        expect((await mustGet(ref)).meta).toEqual(meta);
      });

      test('the object carries the key it was stored under', async () => {
        const meta = metaFor(`self-${ns}`);

        const ref = await store.put(meta, bodyOf('self'));

        expect((await mustGet(ref)).key).toBe(ref);
      });
    });

    describe('6. the raw store is an archive, not a cache', () => {
      test('putting the same bytes again is idempotent and does not fail', async () => {
        const meta = metaFor(`idem-${ns}`);
        const body = bodyOf('the very same bytes');

        const first = await store.put(meta, body);
        const second = await store.put(meta, body);

        expect(second).toBe(first);
        await expect(store.list(`test/idem-${ns}`)).resolves.toEqual([first]);
        expect([...(await mustGet(first)).body]).toEqual([...body]);
      });

      test('different bytes never land on the same key, so they cannot overwrite', async () => {
        // The key is content-addressed (CA-10.1: the sha256 of the body is part
        // of it), so `put` has no reachable path to a same-key/different-bytes
        // conflict. The guard exists anyway and is exercised where it CAN be
        // reached — an archive edited from outside — in `disk.test.ts`.
        const meta = metaFor(`distinct-${ns}`);

        const first = await store.put(meta, bodyOf('1-0'));
        const second = await store.put(meta, bodyOf('2-0'));

        expect(second).not.toBe(first);
        expect([...(await mustGet(first)).body]).toEqual([...bodyOf('1-0')]);
        expect([...(await mustGet(second)).body]).toEqual([...bodyOf('2-0')]);
      });
    });

    describe('7. a real-sized response', () => {
      test('300 KB go and come back intact', async () => {
        const meta = metaFor(`big-${ns}`);
        const body = new Uint8Array(300 * 1024);
        for (let i = 0; i < body.length; i += 1) body[i] = i % 256;

        const ref = await store.put(meta, body);
        const stored = (await mustGet(ref)).body;

        expect(stored.length).toBe(body.length);
        expect(Buffer.from(stored).equals(Buffer.from(body))).toBe(true);
      });
    });

    describe('CA-10.3 — the store refuses to be escaped', () => {
      test.each(ESCAPING_KEYS)('get rejects %s', async (_what, key) => {
        await expect(store.get(key)).rejects.toThrow(InvalidRawKeyError);
      });

      test.each(ESCAPING_KEYS)('list rejects %s as a prefix', async (_what, prefix) => {
        await expect(store.list(prefix)).rejects.toThrow(InvalidRawKeyError);
      });

      test('get rejects the empty key', async () => {
        await expect(store.get('')).rejects.toThrow(InvalidRawKeyError);
      });
    });
  });
}
