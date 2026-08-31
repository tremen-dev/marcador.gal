/**
 * CA-1 (RN-11) — ni una petición de más.
 *
 * The declared reading of RN-11 (spec §Diseño 3, §1 de las notas del gate) is
 * **one request per minute per (source, competition) pair**, not a global
 * budget shared between unrelated sites. Test 3 is that reading written down
 * as an executable assertion: if someone ever "fixes" it into a global cap,
 * the resolution of the instrument drops from 1 to 3 minutes and this test
 * goes red first.
 */
import { describe, expect, test } from 'vitest';
import { Capturer } from '@/mirror/capture/capturer';
import { MINUTE_MS } from '@/mirror/thresholds';
import { instantToEpochMs } from '@/mirror/instants';
import { allowAllRobots } from '@/mirror/capture/robots';
import { FakeClock } from '../support/fake-clock';
import { MemoryRawStore } from '../support/memory-store';
import { spyFetcher } from '../support/spy-fetcher';
import { TARGETS } from '../support/targets';

const START = '2026-09-05T17:00:00.000Z';
const HOUR_MS = 60 * MINUTE_MS;

function newCapturer(clock: FakeClock) {
  const spy = spyFetcher(clock);
  const capturer = new Capturer({
    targets: TARGETS,
    fetcher: spy.fetcher,
    store: new MemoryRawStore(),
    clock,
    robots: allowAllRobots(),
  });
  return { spy, capturer };
}

/** Drives the capturer for `ms` of simulated time, ticking every `stepMs`. */
async function run(capturer: Capturer, clock: FakeClock, ms: number, stepMs: number) {
  for (let elapsed = 0; elapsed < ms; elapsed += stepMs) {
    await capturer.tick();
    clock.advance(stepMs);
  }
}

describe('CA-1 (RN-11) — ni una petición de más', () => {
  test('1. en una hora simulada ningún par (fuente, competición) supera 60 peticiones', async () => {
    const clock = new FakeClock(START);
    const { spy, capturer } = newCapturer(clock);

    // Ticked every 10 s: six times more often than RN-11 allows. The limiter,
    // not the caller, has to be the thing that holds the line.
    await run(capturer, clock, HOUR_MS, 10_000);

    for (const target of TARGETS) {
      expect(spy.timesFor(target.url).length).toBeLessThanOrEqual(60);
    }
    // And it does not "protect" the sites by doing nothing: an hour must
    // actually produce the hour of samples the test of espejo needs.
    for (const target of TARGETS) {
      expect(spy.timesFor(target.url).length).toBeGreaterThanOrEqual(59);
    }
  });

  test('2. dos peticiones del mismo par nunca distan menos de 60 s', async () => {
    const clock = new FakeClock(START);
    const { spy, capturer } = newCapturer(clock);

    await run(capturer, clock, HOUR_MS, 10_000);

    for (const target of TARGETS) {
      const times = spy.timesFor(target.url);
      for (let i = 1; i < times.length; i += 1) {
        expect(times[i]! - times[i - 1]!).toBeGreaterThanOrEqual(MINUTE_MS);
      }
    }
  });

  test('3. el tope es por par: las seis parejas se muestrean en el mismo minuto', async () => {
    const clock = new FakeClock(START);
    const { spy, capturer } = newCapturer(clock);

    await capturer.tick();

    expect(spy.requests).toHaveLength(6);
    expect(new Set(spy.requests.map((r) => r.url)).size).toBe(6);
    expect(new Set(spy.requests.map((r) => instantToEpochMs(r.at))).size).toBe(1);
  });

  test('4. un tick que llega antes de los 60 s no pide nada y no registra tick alguno', async () => {
    const clock = new FakeClock(START);
    const { spy, capturer } = newCapturer(clock);

    await capturer.tick();
    clock.advance(59_000);
    await capturer.tick();

    expect(spy.requests).toHaveLength(6);
    // A suppressed tick is not a MISSED tick: it never counts against the
    // coverage of CA-5, or a cron running every 10 s would look like a 90 %
    // outage.
    expect(capturer.log().ticks).toHaveLength(6);
  });

  test('5. a los 60 s exactos vuelve a pedir', async () => {
    const clock = new FakeClock(START);
    const { spy, capturer } = newCapturer(clock);

    await capturer.tick();
    clock.advance(MINUTE_MS);
    await capturer.tick();

    expect(spy.requests).toHaveLength(12);
  });
});
