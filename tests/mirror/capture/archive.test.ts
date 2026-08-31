/**
 * CA-4 (ADR-005, ADR-006) — el archivo es la línea de tiempo.
 *
 * No new entities: `rawKey()` and `DiskRawStore` come from SPEC-001 untouched.
 * What this criterion buys is that phase B can rebuild the order of an hour by
 * sorting strings, with no metadata read and no clock — which is half of why
 * CA-7 (the analysis is a pure function of the archive) is achievable at all.
 *
 * Case 3 is the one with teeth. `rawKey` normalises the instant into the key,
 * and `2026-09-05T17:00:00Z` (no fraction) sorts AFTER
 * `2026-09-05T17:00:00.500Z` because `z` > `.`. If the capturer ever let a
 * source's own formatting through instead of `canonicalInstant`, the archive
 * would still look fine and the timeline would be silently wrong.
 */
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterAll, describe, expect, test } from 'vitest';
import { DiskRawStore } from '@/raw/disk';
import { rawKey } from '@/raw/store';
import { Capturer } from '@/mirror/capture/capturer';
import { allowAllRobots } from '@/mirror/capture/robots';
import { canonicalInstant, instantToEpochMs } from '@/mirror/instants';
import { FakeClock } from '../support/fake-clock';
import { spyFetcher } from '../support/spy-fetcher';
import { CEROACERO, FUTGAL, PREFERENTE, TERCERA } from '../support/targets';

const START = '2026-09-05T17:00:00.000Z';
const created: string[] = [];

afterAll(async () => {
  await Promise.all(created.map((dir) => rm(dir, { recursive: true, force: true })));
});

async function newStore(): Promise<DiskRawStore> {
  const parent = await mkdtemp(join(tmpdir(), 'marcador-mirror-'));
  created.push(parent);
  return new DiskRawStore(join(parent, 'raw'));
}

const TARGETS = [
  { source: FUTGAL, competition_id: TERCERA, url: 'https://futgal.es/a', ext: 'html' },
  { source: CEROACERO, competition_id: TERCERA, url: 'https://ceroacero.es/a', ext: 'html' },
  { source: FUTGAL, competition_id: PREFERENTE, url: 'https://futgal.es/b', ext: 'html' },
];

/** Captures `minutes` minutes, with a body that changes every minute. */
async function captureWindow(store: DiskRawStore, minutes: number) {
  const clock = new FakeClock(START);
  const spy = spyFetcher(clock, (request) => ({
    status: 200,
    body: new TextEncoder().encode(`${request.url} at ${clock.now()}`),
  }));
  const capturer = new Capturer({
    targets: TARGETS,
    fetcher: spy.fetcher,
    store,
    clock,
    robots: allowAllRobots(),
  });

  for (let minute = 0; minute < minutes; minute += 1) {
    await capturer.tick();
    clock.advance(60_000);
  }
  return capturer;
}

describe('CA-4 — la clave ordena el tiempo', () => {
  test('1. list() del prefijo de un par devuelve solo las capturas de ese par', async () => {
    const store = await newStore();
    await captureWindow(store, 5);

    const keys = await store.list(`${FUTGAL}/${TERCERA}/2026-09-05/`);

    expect(keys).toHaveLength(5);
    for (const key of keys) expect(key.startsWith(`${FUTGAL}/${TERCERA}/2026-09-05/`)).toBe(true);
  });

  test('2. ordenar las claves como cadenas reproduce el orden temporal', async () => {
    const store = await newStore();
    await captureWindow(store, 12);

    const keys = await store.list(`${CEROACERO}/${TERCERA}/2026-09-05/`);
    // Shuffled on purpose: the criterion is that the KEY carries the order,
    // not that the store happens to return things sorted.
    const shuffled = [...keys].sort(() => (Math.random() < 0.5 ? -1 : 1));
    const byKey = [...shuffled].sort();

    const instants: string[] = [];
    for (const key of byKey) {
      const object = await store.get(key);
      instants.push(object!.meta.fetched_at);
    }

    const epochs = instants.map(instantToEpochMs);
    expect(epochs).toEqual([...epochs].sort((a, b) => a - b));
    expect(new Set(epochs).size).toBe(12);
  });

  test('3. instantes desordenados y con formatos distintos siguen ordenando bien', async () => {
    const store = await newStore();
    // Written out of order AND mixing an instant with no fractional part with
    // one that has 500 ms: raw ISO would sort these backwards.
    const instants = [
      '2026-09-05T17:02:00.000Z',
      '2026-09-05T17:00:00.500Z',
      '2026-09-05T17:01:00Z',
      '2026-09-05T17:00:01Z',
      '2026-09-05T17:00:00Z',
    ];

    // The trap, made explicit: keys derived from the instants as the sources
    // write them do NOT sort chronologically. `17-00-00.500z` lands BEFORE
    // `17-00-00z` because '.' < 'z', so the archive would claim the 500 ms
    // capture came first.
    const naive = instants
      .map((instant) =>
        rawKey(
          { source: FUTGAL, competition_id: TERCERA, fetched_at: instant, ext: 'html' },
          new TextEncoder().encode(`body ${instant}`),
        ),
      )
      .sort();
    expect(naive[0]).toContain('17-00-00.500z');
    expect(naive[1]).toContain('17-00-00z');

    for (const instant of instants) {
      await store.put(
        {
          source: FUTGAL,
          competition_id: TERCERA,
          fetched_at: canonicalInstant(instantToEpochMs(instant)),
          ext: 'html',
        },
        new TextEncoder().encode(`body ${instant}`),
      );
    }

    const keys = [...(await store.list(`${FUTGAL}/${TERCERA}/2026-09-05/`))].sort();
    const order: number[] = [];
    for (const key of keys) order.push(instantToEpochMs((await store.get(key))!.meta.fetched_at));

    expect(order).toEqual([...instants].map(instantToEpochMs).sort((a, b) => a - b));
  });

  test('4. el instante archivado es cadena ISO 8601 UTC, nunca Date (ADR-006)', async () => {
    const store = await newStore();
    await captureWindow(store, 2);

    const keys = await store.list(`${FUTGAL}/${TERCERA}/2026-09-05/`);
    const object = await store.get(keys[0]!);

    expect(typeof object!.meta.fetched_at).toBe('string');
    expect(object!.meta.fetched_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  test('5. la clave archivada es exactamente la que deriva rawKey() de SPEC-001', async () => {
    const store = await newStore();
    const meta = {
      source: FUTGAL,
      competition_id: TERCERA,
      fetched_at: canonicalInstant(instantToEpochMs(START)),
      ext: 'html',
    };
    const body = new TextEncoder().encode('<html/>');

    const key = await store.put(meta, body);

    expect(key).toBe(rawKey(meta, body));
    expect(key).toBe(`${FUTGAL}/${TERCERA}/2026-09-05/${'2026-09-05t17-00-00.000z'}-${key.split('-').pop()}`);
  });
});
