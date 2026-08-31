/**
 * CA-5, segunda mitad — la fase B se niega a dictar veredicto sobre una
 * ventana inválida.
 *
 * It refuses; it does not degrade. That is the difference with CA-11, where an
 * insufficient sample IS a verdict: there the window is sound and the data
 * thin, here the instrument itself failed, and a gap in one source manufactures
 * leads in the other. A verdict built on that would be worse than no verdict.
 */
import { describe, expect, test } from 'vitest';
import { analyze } from '@/mirror/analysis/analyze';
import { InvalidWindowError } from '@/mirror/window';
import { buildFixture } from '../support/archive';
import { padding, plan } from '../support/plans';
import { caughtAsync } from '../support/caught';
import { CEROACERO, FUTGAL, RESULTADOS } from '../support/targets';
import type { WindowLog } from '@/mirror/window';

const window = () => {
  const shots = padding(6);
  return plan([FUTGAL, shots], [CEROACERO, shots], [RESULTADOS, shots]);
};

/** The same log, with `failed` ticks bolted onto one pair. */
function degrade(log: WindowLog, source: string, failures: number): WindowLog {
  const first = log.ticks.find((tick) => tick.source === source)!;
  return {
    ticks: [
      ...log.ticks,
      ...Array.from({ length: failures }, () => ({
        ...first,
        outcome: 'failed' as const,
        reason: 'network',
        raw_ref: null,
      })),
    ],
  };
}

describe('CA-5 — la fase B se niega sobre una ventana inválida', () => {
  test('1. con todos los pares al 100 %, la fase B dicta veredicto', async () => {
    const fixture = await buildFixture(window());

    const report = await analyze({
      store: fixture.store,
      keys: fixture.keys,
      log: fixture.log,
      extractors: fixture.extractors,
      pairing: fixture.pairing,
      reference: FUTGAL,
      candidates: [CEROACERO, RESULTADOS],
    });

    expect(report.window.valid).toBe(true);
  });

  test('2. un par por debajo del 90 % hace que se niegue, con nombre', async () => {
    const fixture = await buildFixture(window());

    await expect(
      analyze({
        store: fixture.store,
        keys: fixture.keys,
        // 10 ok + 6 failed for ceroacero = 62.5 %.
        log: degrade(fixture.log, CEROACERO, 6),
        extractors: fixture.extractors,
        pairing: fixture.pairing,
        reference: FUTGAL,
        candidates: [CEROACERO, RESULTADOS],
      }),
    ).rejects.toThrow(InvalidWindowError);
  });

  test('3. el error nombra el par que se cayó', async () => {
    const fixture = await buildFixture(window());

    const message = (
      await caughtAsync(() =>
        analyze({
          store: fixture.store,
          keys: fixture.keys,
          log: degrade(fixture.log, CEROACERO, 6),
          extractors: fixture.extractors,
          pairing: fixture.pairing,
          reference: FUTGAL,
          candidates: [CEROACERO, RESULTADOS],
        }),
      )
    ).message;

    expect(message).toContain(CEROACERO);
    expect(message).toContain('90 %');
  });
});
