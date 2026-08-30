/**
 * CA-11 (RN-10) — saving the raw happens BEFORE parsing, and it is testable.
 *
 * `captureThenParse` is the only sanctioned path from a raw response to a
 * parser. The order is not promised in a comment: it is observed.
 */
import { describe, expect, test, vi } from 'vitest';
import { captureThenParse } from '@/raw/capture';
import type { RawParser } from '@/raw/capture';
import { rawKey } from '@/raw/store';
import type { RawObject, RawObjectMeta, RawRef, RawStore } from '@/raw/store';

const meta: RawObjectMeta = {
  source: 'futgal',
  competition_id: 'futgal-preferente-g1',
  fetched_at: '2026-03-21T17:00:00.000Z',
  ext: 'html',
};

const body = new TextEncoder().encode('<html>1-0</html>');

/** A store that records the order of what happens to it. */
function spyStore(putBehaviour: () => Promise<RawRef>): {
  store: RawStore;
  events: string[];
} {
  const events: string[] = [];
  const store: RawStore = {
    put: () => {
      events.push('put');
      return putBehaviour();
    },
    get: (): Promise<RawObject | null> => Promise.resolve(null),
    list: (): Promise<readonly string[]> => Promise.resolve([]),
  };
  return { store, events };
}

/** Lets every already-queued microtask and macrotask run. */
const settle = () => new Promise((resolve) => setImmediate(resolve));

describe('CA-11 — RN-10, the order of raw and parse', () => {
  test('1. put is recorded before the first call to parse', async () => {
    const { store, events } = spyStore(() => Promise.resolve(rawKey(meta, body)));

    await captureThenParse(store, meta, body, () => {
      events.push('parse');
      return '1-0';
    });

    expect(events).toEqual(['put', 'parse']);
  });

  test('2. while put is still pending, parse has not been called', async () => {
    const { store } = spyStore(() => new Promise<RawRef>(() => {}));
    const parse = vi.fn<RawParser<string>>(() => '1-0');

    void captureThenParse(store, meta, body, parse);
    await settle();
    await settle();

    // If the await were a `void store.put(...)`, parse would already have run.
    expect(parse).not.toHaveBeenCalled();
  });

  test('3. if put rejects, parse is never called and the error propagates', async () => {
    const failure = new Error('blob store unreachable');
    const { store } = spyStore(() => Promise.reject(failure));
    const parse = vi.fn<RawParser<string>>(() => '1-0');

    await expect(captureThenParse(store, meta, body, parse)).rejects.toThrow(failure);
    expect(parse).not.toHaveBeenCalled();
  });

  test('4. parse receives the RawRef that put returned', async () => {
    const ref = rawKey(meta, body);
    const { store } = spyStore(() => Promise.resolve(ref));

    const seen = await captureThenParse(store, meta, body, (_body, rawRef) => rawRef);

    expect(seen).toBe(ref);
  });

  test('4b. parse receives the very bytes that were archived', async () => {
    const { store } = spyStore(() => Promise.resolve(rawKey(meta, body)));

    const seen = await captureThenParse(store, meta, body, (bytes) => bytes);

    expect(seen).toBe(body);
  });

  test('an async parser is awaited and its value returned', async () => {
    const { store } = spyStore(() => Promise.resolve(rawKey(meta, body)));

    await expect(
      captureThenParse(store, meta, body, async () => Promise.resolve(42)),
    ).resolves.toBe(42);
  });
});
