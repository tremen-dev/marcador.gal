/**
 * The per-source calibration of the minimal extractor.
 *
 * The three real pages have not been seen — and cannot be, before the window —
 * so the selectors are DATA, loaded from a file the operator writes on the
 * day, not constants baked into the build. A source with no calibration fails
 * by name instead of silently extracting nothing, which is the failure mode
 * that would quietly turn a live window into an archive nobody can read.
 */
import { describe, expect, test } from 'vitest';
import {
  ExtractorCalibrationSchema,
  UncalibratedSourceError,
  loadExtractors,
} from '@/mirror/analysis/sources';
import { FIXTURE_EXTRACTOR_CONFIG } from '../support/archive';
import { CEROACERO, FUTGAL } from '../support/targets';

const calibration = {
  futgal: FIXTURE_EXTRACTOR_CONFIG,
  ceroacero: FIXTURE_EXTRACTOR_CONFIG,
};

describe('calibración de los extractores', () => {
  test('1. un fichero de calibración válido rinde un extractor por fuente', () => {
    const extractors = loadExtractors(ExtractorCalibrationSchema.parse(calibration));

    expect([...extractors.keys()].sort()).toEqual([CEROACERO, FUTGAL].sort());
    expect(extractors.get(FUTGAL)!.source).toBe(FUTGAL);
  });

  test('2. una clave de más en la configuración la invalida', () => {
    expect(
      ExtractorCalibrationSchema.safeParse({
        futgal: { ...FIXTURE_EXTRACTOR_CONFIG, sobra: 1 },
      }).success,
    ).toBe(false);
  });

  test('3. una fuente sin calibrar falla por su nombre, no extrae nada en silencio', () => {
    const extractors = loadExtractors(ExtractorCalibrationSchema.parse(calibration));

    expect(() => {
      const missing = extractors.get('resultados-futbol' as never);
      if (missing === undefined) throw new UncalibratedSourceError('resultados-futbol');
    }).toThrow(UncalibratedSourceError);
  });

  test('4. el extractor cargado desde el fichero lee de verdad', () => {
    const extractors = loadExtractors(ExtractorCalibrationSchema.parse(calibration));
    const html = new TextEncoder().encode(
      '<table><tr class="match" data-id="7"><td class="home">A</td>' +
        '<td class="score">2-1</td><td class="away">B</td>' +
        '<td class="status">Finalizado</td><td class="kickoff">17:00</td></tr></table>',
    );

    expect(extractors.get(FUTGAL)!.extract(html)).toEqual([
      {
        source_ref: '7',
        home_name: 'A',
        away_name: 'B',
        status: 'finished',
        home_score: 2,
        away_score: 1,
        kickoff: '17:00',
      },
    ]);
  });
});
