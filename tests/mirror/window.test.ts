/**
 * CA-5 — una ventana a medias no produce veredicto.
 *
 * Case 3 is the reason the criterion exists. If ceroacero loses twenty minutes
 * and futgal does not, futgal "leads" on every event of those twenty minutes:
 * a network outage would read as proof of mirroring, in the dangerous
 * direction. So coverage is measured per pair and the WORST pair decides — an
 * average would hide exactly the failure that fabricates leads.
 */
import { describe, expect, test } from 'vitest';
import {
  InvalidWindowError,
  MIN_TICK_SUCCESS_RATIO,
  assertWindowValid,
  windowCoverage,
  windowValidity,
} from '@/mirror/window';
import { canonicalInstant, instantToEpochMs } from '@/mirror/instants';
import type { TickOutcome, WindowLog } from '@/mirror/window';
import { caught } from './support/caught';
import { CEROACERO, FUTGAL, TERCERA } from './support/targets';
import type { CompetitionId, SourceId } from '@/model/ids';

const START = instantToEpochMs('2026-09-05T17:00:00.000Z');

/** A run of ticks for one pair: `ok` first, then `failed`, then `skipped`. */
function ticksFor(
  source: SourceId,
  competition_id: CompetitionId,
  counts: { ok: number; failed?: number; skipped?: number },
) {
  const outcomes: TickOutcome[] = [
    ...Array.from<TickOutcome>({ length: counts.ok }).fill('ok'),
    ...Array.from<TickOutcome>({ length: counts.failed ?? 0 }).fill('failed'),
    ...Array.from<TickOutcome>({ length: counts.skipped ?? 0 }).fill('skipped'),
  ];

  return outcomes.map((outcome, index) => ({
    source,
    competition_id,
    at: canonicalInstant(START + index * 60_000),
    outcome,
    reason: outcome === 'ok' ? null : 'fixture',
    raw_ref: outcome === 'ok' ? `${source}/${competition_id}/2026-09-05/x-${index}` : null,
  }));
}

const log = (...ticks: ReturnType<typeof ticksFor>[]): WindowLog => ({ ticks: ticks.flat() });

describe('CA-5 — cobertura por par', () => {
  test('1. 95 % de ticks exitosos: la ventana es válida', () => {
    const window = log(ticksFor(FUTGAL, TERCERA, { ok: 57, failed: 3 }));

    expect(windowValidity(window).valid).toBe(true);
    expect(windowCoverage(window)[0]!.ratio).toBeCloseTo(0.95, 5);
    expect(() => assertWindowValid(window)).not.toThrow();
  });

  test('2. 85 % de ticks exitosos: la ventana es inválida', () => {
    const window = log(ticksFor(FUTGAL, TERCERA, { ok: 51, failed: 6, skipped: 3 }));

    expect(windowValidity(window).valid).toBe(false);
    expect(windowCoverage(window)[0]!.ratio).toBeCloseTo(0.85, 5);
  });

  test('3. una fuente al 100 % y otra al 50 %: inválida, y la media no salva nada', () => {
    const window = log(
      ticksFor(FUTGAL, TERCERA, { ok: 60 }),
      ticksFor(CEROACERO, TERCERA, { ok: 30, failed: 30 }),
    );

    const validity = windowValidity(window);
    expect(validity.valid).toBe(false);
    expect(validity.below.map((pair) => pair.source)).toEqual([CEROACERO]);
    // The average is 75 %, which is not what decides: the worst pair is.
    expect(windowCoverage(window).map((pair) => pair.ratio)).toEqual([0.5, 1]);
  });

  test('4. el umbral es 90 %, y 90 % exacto pasa', () => {
    expect(MIN_TICK_SUCCESS_RATIO).toBe(0.9);
    const window = log(ticksFor(FUTGAL, TERCERA, { ok: 54, failed: 6 }));

    expect(windowValidity(window).valid).toBe(true);
  });

  test('5. la ventana inválida se niega por su nombre, con el par y su cobertura', () => {
    const window = log(
      ticksFor(FUTGAL, TERCERA, { ok: 60 }),
      ticksFor(CEROACERO, TERCERA, { ok: 30, failed: 30 }),
    );

    expect(() => assertWindowValid(window)).toThrow(InvalidWindowError);

    const message = caught(() => assertWindowValid(window)).message;
    expect(message).toContain('ceroacero');
    expect(message).toContain('50');
  });

  test('6. la cobertura cuenta exitosos, fallidos y omitidos por separado', () => {
    const window = log(ticksFor(FUTGAL, TERCERA, { ok: 50, failed: 6, skipped: 4 }));
    const pair = windowCoverage(window)[0]!;

    expect(pair).toMatchObject({ ok: 50, failed: 6, skipped: 4, attempted: 60 });
  });

  test('7. una ventana sin ticks no es una ventana válida', () => {
    expect(windowValidity({ ticks: [] }).valid).toBe(false);
  });
});
