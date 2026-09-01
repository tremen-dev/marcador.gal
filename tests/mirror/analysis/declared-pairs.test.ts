/**
 * CA-8 y CA-9 — el conjunto de pares se declara, y ninguno es invisible.
 *
 * Hoy `windowCoverage` deriva los pares de los ticks que EXISTEN, así que una
 * fuente que nunca se intentó —un `targets` mal escrito, un `robots.txt` que
 * no se cargó y dejó la fuente fuera— simplemente no aparece, y la ventana
 * sale válida con el 100 % de los pares que sí corrieron. En una ventana de
 * seis pares eso ya era un agujero; en una de **cuatro**, una fuente ausente
 * es la mitad del instrumento, y el par que se analiza necesita a las dos por
 * definición.
 *
 * El caso 2 es el que demuestra que esto arregla algo: el MISMO registro sin
 * el conjunto declarado sale válido, que es la conducta de hoy.
 */
import { describe, expect, test } from 'vitest';
import { Capturer } from '@/mirror/capture/capturer';
import { allowAllRobots } from '@/polite/robots';
import {
  InvalidWindowError,
  assertWindowValid,
  windowCoverage,
  windowValidity,
} from '@/mirror/window';
import { caught } from '../support/caught';
import { FakeClock } from '../support/fake-clock';
import { MemoryRawStore } from '../support/memory-store';
import { spyFetcher } from '../support/spy-fetcher';
import { CEROACERO, PREFERENTE, RESULTADOS, TERCERA } from '../support/targets';
import type { TickRecord, WindowLog } from '@/mirror/window';
import type { CompetitionId, Instant, SourceId } from '@/model/ids';

const AT = '2026-09-05T17:00:00.000Z' as Instant;

/** The four pairs of the referenceless window: 2 candidates × 2 competitions. */
const FOUR_PAIRS: readonly { source: SourceId; competition_id: CompetitionId }[] = [
  { source: CEROACERO, competition_id: TERCERA },
  { source: CEROACERO, competition_id: PREFERENTE },
  { source: RESULTADOS, competition_id: TERCERA },
  { source: RESULTADOS, competition_id: PREFERENTE },
];

function ticks(
  source: SourceId,
  competition_id: CompetitionId,
  ok: number,
  failed = 0,
): readonly TickRecord[] {
  return [
    ...Array.from({ length: ok }, (): TickRecord => ({
      source,
      competition_id,
      at: AT,
      outcome: 'ok',
      reason: null,
      raw_ref: 'k',
    })),
    ...Array.from({ length: failed }, (): TickRecord => ({
      source,
      competition_id,
      at: AT,
      outcome: 'failed',
      reason: 'network',
      raw_ref: null,
    })),
  ];
}

/** Only the two ceroacero pairs ever ran; the two besoccer ones never did. */
const HALF_THE_WINDOW: readonly TickRecord[] = [
  ...ticks(CEROACERO, TERCERA, 10),
  ...ticks(CEROACERO, PREFERENTE, 10),
];

describe('CA-8 — un par declarado con cero intentos es cobertura 0 %', () => {
  test('1. cuatro pares declarados y ticks de solo dos → ventana inválida', () => {
    const log: WindowLog = { ticks: HALF_THE_WINDOW, declared_pairs: FOUR_PAIRS };

    expect(windowValidity(log).valid).toBe(false);
  });

  test('2. el mismo registro SIN el conjunto declarado sale válido: es la conducta de hoy', () => {
    const log: WindowLog = { ticks: HALF_THE_WINDOW };

    expect(windowValidity(log).valid).toBe(true);
  });

  test('3. los dos pares ausentes aparecen en la cobertura con 0.0 % (0/0)', () => {
    const log: WindowLog = { ticks: HALF_THE_WINDOW, declared_pairs: FOUR_PAIRS };

    expect(windowCoverage(log)).toHaveLength(4);

    const message = caught(() => assertWindowValid(log)).message;
    expect(message).toContain(`${RESULTADOS}/${TERCERA} at 0.0 % (0/0) BELOW`);
    expect(message).toContain(`${RESULTADOS}/${PREFERENTE} at 0.0 % (0/0) BELOW`);
  });

  test('4. un par declarado que sí corrió no se duplica', () => {
    const log: WindowLog = {
      ticks: [...HALF_THE_WINDOW, ...ticks(RESULTADOS, TERCERA, 10), ...ticks(RESULTADOS, PREFERENTE, 10)],
      declared_pairs: FOUR_PAIRS,
    };

    expect(windowCoverage(log)).toHaveLength(4);
    expect(windowValidity(log).valid).toBe(true);
  });
});

describe('CA-9 — la negativa se lee sobre los pares declarados, no sobre seis', () => {
  test('5. con un par al 50 %, el error nombra los CUATRO y el umbral exigido', () => {
    const log: WindowLog = {
      ticks: [
        ...HALF_THE_WINDOW,
        ...ticks(RESULTADOS, TERCERA, 5, 5),
        ...ticks(RESULTADOS, PREFERENTE, 10),
      ],
      declared_pairs: FOUR_PAIRS,
    };

    const error = caught(() => assertWindowValid(log));
    expect(error).toBeInstanceOf(InvalidWindowError);

    expect(error.message).toContain('90 %');
    expect(error.message).toContain('1 of 4 (source, competition) pairs');
    expect(error.message).toContain(`${RESULTADOS}/${TERCERA} at 50.0 % (5/10) BELOW`);
    expect(error.message).toContain(`${CEROACERO}/${TERCERA} at 100.0 % (10/10) ok`);
    expect(error.message).toContain(`${CEROACERO}/${PREFERENTE} at 100.0 % (10/10) ok`);
    expect(error.message).toContain(`${RESULTADOS}/${PREFERENTE} at 100.0 % (10/10) ok`);
  });

  test('6. y un par que nunca se intentó cuenta como uno de los cuatro, no como ninguno', () => {
    const log: WindowLog = {
      ticks: [
        ...ticks(CEROACERO, TERCERA, 10),
        ...ticks(CEROACERO, PREFERENTE, 5, 5),
        ...ticks(RESULTADOS, TERCERA, 10),
      ],
      declared_pairs: FOUR_PAIRS,
    };

    const message = caught(() => assertWindowValid(log)).message;

    expect(message).toContain('2 of 4 (source, competition) pairs');
    expect(message).toContain(`${RESULTADOS}/${PREFERENTE} at 0.0 % (0/0) BELOW`);
    expect(message).toContain(`${CEROACERO}/${PREFERENTE} at 50.0 % (5/10) BELOW`);
    expect(message).toContain(`${CEROACERO}/${TERCERA} at 100.0 % (10/10) ok`);
    expect(message).toContain(`${RESULTADOS}/${TERCERA} at 100.0 % (10/10) ok`);
  });
});

describe('CA-8 — el registro de ventana es quien declara los pares', () => {
  test('7. el capturador escribe en su registro los pares que se le encargaron', async () => {
    const clock = new FakeClock(AT);
    const capturer = new Capturer({
      targets: FOUR_PAIRS.map((pair) => ({
        source: pair.source,
        competition_id: pair.competition_id,
        url: `https://x.example/${pair.source}/${pair.competition_id}`,
        ext: 'html',
      })),
      fetcher: spyFetcher(clock).fetcher,
      store: new MemoryRawStore(),
      clock,
      robots: allowAllRobots(),
    });

    await capturer.tick();

    // Sin esto, la fase B solo sabe de los pares que dejaron rastro, que es
    // exactamente el agujero de CA-8: lo que la ventana DEBÍA cubrir tiene que
    // viajar en el registro, no en la memoria de quien la corrió.
    expect(capturer.log().declared_pairs).toEqual(FOUR_PAIRS);
  });
});
