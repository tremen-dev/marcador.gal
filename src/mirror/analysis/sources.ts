/**
 * Per-source calibration of the minimal extractor.
 *
 * The selectors are DATA and not constants, and that is a deliberate call. The
 * three pages of the window — futgal.es, ceroacero.es, resultados-futbol.com —
 * have not been seen, and inventing selectors for pages nobody has opened
 * would be fiction with a test around it. What the spec's two-phase design
 * buys is exactly the freedom not to know: phase A archives the bytes without
 * parsing (RN-10), so the calibration can be written AFTER the window, against
 * the archive, and phase B re-run as many times as it takes.
 *
 * The operator writes `calibracion.json` and hands it to the phase B CLI. A
 * source with no entry fails by name; the alternative — an extractor that
 * matches nothing and returns an empty list — would turn a captured window
 * into a verdict of "no events", which is the worst possible silence.
 */
import { z } from 'zod';
import { SourceIdSchema } from '@/model/ids';
import { tableExtractor } from './extract';
import type { SourceExtractor } from './extract';
import type { SourceId } from '@/model/ids';

export const MatchStatusSchema = z.enum([
  'scheduled',
  'live',
  'finished',
  'postponed',
  'suspended',
]);

export const ExtractorConfigSchema = z.strictObject({
  rowSelector: z.string().min(1),
  refSelector: z.string().min(1).nullable(),
  refAttribute: z.string().min(1).nullable(),
  homeSelector: z.string().min(1),
  awaySelector: z.string().min(1),
  scoreSelector: z.string().min(1),
  statusSelector: z.string().min(1).nullable(),
  kickoffSelector: z.string().min(1).nullable(),
  /** Lowercased words the page uses for each state. */
  statusWords: z.record(z.string().min(1), MatchStatusSchema),
});

/** `{ "futgal": {...}, "ceroacero": {...}, "resultados-futbol": {...} }` */
export const ExtractorCalibrationSchema = z.record(z.string().min(1), ExtractorConfigSchema);

export type ExtractorCalibration = z.infer<typeof ExtractorCalibrationSchema>;

/** Thrown when the archive holds a source the calibration file does not cover. */
export class UncalibratedSourceError extends Error {
  override readonly name = 'UncalibratedSourceError';

  constructor(source: string) {
    super(
      `no extractor calibration for source ${JSON.stringify(source)}. ` +
        'Add its selectors to the calibration file; an uncalibrated source would ' +
        'silently extract nothing and the window would read as "no events".',
    );
  }
}

export function loadExtractors(
  calibration: ExtractorCalibration,
): ReadonlyMap<SourceId, SourceExtractor> {
  const extractors = new Map<SourceId, SourceExtractor>();

  for (const [source, config] of Object.entries(calibration)) {
    const id = SourceIdSchema.parse(source);
    extractors.set(id, tableExtractor(id, config));
  }

  return extractors;
}

/**
 * The six pairs of the window (ADR-002). URLs are the entry points the
 * operator confirms against robots.txt before the window; they live here so
 * the CLI and the runbook cannot drift apart.
 */
export const WINDOW_TARGET_URLS: Readonly<Record<string, string>> = {
  'futgal/rfef-tercera-g1': 'https://www.futgal.es/',
  'futgal/futgal-preferente-g1': 'https://www.futgal.es/',
  'ceroacero/rfef-tercera-g1': 'https://www.ceroacero.es/',
  'ceroacero/futgal-preferente-g1': 'https://www.ceroacero.es/',
  'resultados-futbol/rfef-tercera-g1': 'https://www.resultados-futbol.com/',
  'resultados-futbol/futgal-preferente-g1': 'https://www.resultados-futbol.com/',
};
