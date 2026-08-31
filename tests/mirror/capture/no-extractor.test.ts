/**
 * CA-3, la mitad del espía — el extractor de la fase B no se llama ni una vez
 * durante una captura.
 *
 * The structural half of CA-3 lives in `no-parse.test.ts` (the extractor is
 * not reachable from the capture module's import graph). This is the runtime
 * half: with the extraction module replaced by a spy, a whole window — the
 * successful ticks and the ones whose store fails — leaves it untouched.
 */
import { describe, expect, test, vi } from 'vitest';
import type { RawStore } from '@/raw/store';

const extract = vi.fn<(...args: readonly unknown[]) => unknown>();

vi.mock('@/mirror/analysis/extract', () => ({
  tableExtractor: extract,
  parseScore: extract,
  readStatus: extract,
  parseKickoff: extract,
  MATCH_STATUSES: [],
  UnextractableRowError: class extends Error {},
}));

const { Capturer } = await import('@/mirror/capture/capturer');
const { allowAllRobots } = await import('@/mirror/capture/robots');
const { FakeClock } = await import('../support/fake-clock');
const { FailingRawStore, MemoryRawStore } = await import('../support/memory-store');
const { spyFetcher } = await import('../support/spy-fetcher');
const { CEROACERO, TERCERA } = await import('../support/targets');

const TARGET = {
  source: CEROACERO,
  competition_id: TERCERA,
  url: 'https://www.ceroacero.es/x',
  ext: 'html',
};

async function runWindow(store: RawStore) {
  const clock = new FakeClock('2026-09-05T17:00:00.000Z');
  const spy = spyFetcher(clock);
  const capturer = new Capturer({
    targets: [TARGET],
    fetcher: spy.fetcher,
    store,
    clock,
    robots: allowAllRobots(),
  });

  for (let minute = 0; minute < 10; minute += 1) {
    await capturer.tick();
    clock.advance(60_000);
  }
  return capturer;
}

describe('CA-3 — el espía del extractor', () => {
  test('1. una ventana entera con el store sano no llama al extractor', async () => {
    extract.mockClear();

    const capturer = await runWindow(new MemoryRawStore());

    expect(capturer.log().ticks).toHaveLength(10);
    expect(extract).not.toHaveBeenCalled();
  });

  test('2. con el store fallando tampoco: no hay modo degradado que parsee', async () => {
    extract.mockClear();

    const capturer = await runWindow(new FailingRawStore());

    expect(capturer.log().ticks.every((tick) => tick.outcome === 'failed')).toBe(true);
    expect(extract).not.toHaveBeenCalled();
  });
});
