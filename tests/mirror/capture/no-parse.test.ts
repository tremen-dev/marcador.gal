/**
 * CA-3 (RN-10, D-5) — la fase A archiva y no parsea.
 *
 * The window is unrepeatable and the analysis is not. A parser that turns out
 * to be wrong on the day of the window must cost a re-run of phase B and
 * nothing else — which is only true if phase A never parses. So this is
 * checked twice: at runtime (a store that fails takes the tick down with it,
 * and nothing is extracted) and structurally (the extractor is not even
 * reachable from the capture module's import graph).
 */
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { Capturer } from '@/mirror/capture/capturer';
import { allowAllRobots } from '@/mirror/capture/robots';
import { FakeClock } from '../support/fake-clock';
import { FailingRawStore, MemoryRawStore } from '../support/memory-store';
import { reachableModules } from '../support/imports';
import { spyFetcher } from '../support/spy-fetcher';
import { CEROACERO, TERCERA } from '../support/targets';

const START = '2026-09-05T17:00:00.000Z';
const TARGET = {
  source: CEROACERO,
  competition_id: TERCERA,
  url: 'https://www.ceroacero.es/x',
  ext: 'html',
};

describe('CA-3 — un store que falla se lleva el tick, no el parseo', () => {
  test('1. si put falla, el tick queda registrado como fallido con motivo', async () => {
    const clock = new FakeClock(START);
    const spy = spyFetcher(clock);
    const capturer = new Capturer({
      targets: [TARGET],
      fetcher: spy.fetcher,
      store: new FailingRawStore(),
      clock,
      robots: allowAllRobots(),
    });

    await capturer.tick();

    const ticks = capturer.log().ticks;
    expect(ticks).toHaveLength(1);
    expect(ticks[0]!.outcome).toBe('failed');
    expect(ticks[0]!.reason).toContain('blob store unreachable');
    expect(ticks[0]!.raw_ref).toBeNull();
  });

  test('2. un tick fallido no detiene la ventana: el siguiente minuto se intenta igual', async () => {
    const clock = new FakeClock(START);
    const spy = spyFetcher(clock);
    const capturer = new Capturer({
      targets: [TARGET],
      fetcher: spy.fetcher,
      store: new FailingRawStore(),
      clock,
      robots: allowAllRobots(),
    });

    await capturer.tick();
    clock.advance(60_000);
    await capturer.tick();

    expect(capturer.log().ticks).toHaveLength(2);
    expect(spy.requests).toHaveLength(2);
  });

  test('3. un tick exitoso registra la clave del archivo y nada más', async () => {
    const clock = new FakeClock(START);
    const spy = spyFetcher(clock);
    const store = new MemoryRawStore();
    const capturer = new Capturer({
      targets: [TARGET],
      fetcher: spy.fetcher,
      store,
      clock,
      robots: allowAllRobots(),
    });

    await capturer.tick();

    const tick = capturer.log().ticks[0]!;
    expect(tick.outcome).toBe('ok');
    expect(tick.raw_ref).not.toBeNull();
    expect(await store.get(tick.raw_ref!)).not.toBeNull();
  });
});

describe('CA-3 — estructura: la fase A no alcanza al extractor de la fase B', () => {
  test('4. ningún módulo de src/mirror/analysis es alcanzable desde src/mirror/capture', async () => {
    const dir = join(process.cwd(), 'src/mirror/capture');
    const entries = (await readdir(dir))
      .filter((file) => file.endsWith('.ts'))
      .map((file) => join('src/mirror/capture', file));

    const reachable = await reachableModules(entries);
    const analysis = [...reachable].filter((file) => file.startsWith('src/mirror/analysis'));

    expect(analysis).toEqual([]);
  });

  test('5. el grafo de imports no está vacío: la comprobación anterior mide algo', async () => {
    const reachable = await reachableModules(['src/mirror/capture/capturer.ts']);

    expect(reachable).toContain('src/raw/capture.ts');
    expect(reachable).toContain('src/mirror/thresholds.ts');
  });
});
