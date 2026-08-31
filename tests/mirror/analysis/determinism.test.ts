/**
 * CA-7 — el análisis es una función del archivo, y nada más.
 *
 * This is what lets `sdd-verificador` check a verdict for a window he did not
 * witness. The window is unrepeatable; the analysis has to be the opposite of
 * that, so it depends on nothing but the archived bytes and the pairing file —
 * not the clock, not the order the store felt like listing in, not the network.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { analyze } from '@/mirror/analysis/analyze';
import { buildFixture } from '../support/archive';
import { goalAt, merge, padding, plan, transientError } from '../support/plans';
import { CEROACERO, FUTGAL, RESULTADOS } from '../support/targets';
import type { Fixture } from '../support/archive';

const rich = () => {
  const futgal = merge(goalAt('m1', 6), transientError('e1', 2), padding(4));
  const candidate = merge(goalAt('m1', 3), transientError('e1', 3), padding(4), goalAt('solo', 5));
  return plan([FUTGAL, futgal], [CEROACERO, candidate], [RESULTADOS, candidate]);
};

const run = (fixture: Fixture, keys: readonly string[]) =>
  analyze({
    store: fixture.store,
    keys,
    log: fixture.log,
    extractors: fixture.extractors,
    pairing: fixture.pairing,
    reference: FUTGAL,
    candidates: [CEROACERO, RESULTADOS],
  });

afterEach(() => {
  vi.useRealTimers();
});

describe('CA-7 — el mismo archivo da el mismo informe', () => {
  test('1. dos ejecuciones producen un JSON byte a byte idéntico', async () => {
    const fixture = await buildFixture(rich());

    const first = JSON.stringify(await run(fixture, fixture.keys));
    const second = JSON.stringify(await run(fixture, fixture.keys));

    expect(first).toBe(second);
  });

  test('2. con las claves barajadas produce el mismo resultado', async () => {
    const fixture = await buildFixture(rich());

    const inOrder = JSON.stringify(await run(fixture, fixture.keys));
    const reversed = JSON.stringify(await run(fixture, [...fixture.keys].reverse()));
    const shuffled = JSON.stringify(
      await run(fixture, [...fixture.keys].sort((a, b) => (a < b ? 1 : -1))),
    );

    expect(reversed).toBe(inOrder);
    expect(shuffled).toBe(inOrder);
  });

  test('3. no depende del reloj: dos relojes distintos, el mismo informe', async () => {
    const fixture = await buildFixture(rich());

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-06T09:00:00.000Z'));
    const morning = JSON.stringify(await run(fixture, fixture.keys));

    vi.setSystemTime(new Date('2027-01-01T23:59:59.000Z'));
    const newYear = JSON.stringify(await run(fixture, fixture.keys));

    expect(newYear).toBe(morning);
  });

  test('4. el informe no está vacío: la comparación mide algo', async () => {
    const fixture = await buildFixture(rich());
    const report = await run(fixture, fixture.keys);

    expect(report.sources).toHaveLength(2);
    expect(JSON.stringify(report).length).toBeGreaterThan(1000);
  });
});
