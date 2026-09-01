/**
 * The registry of sources: a source is CONFIGURATION, not structure (§3).
 *
 * The epic and the roadmap fix it and this module cannot contradict it: «if
 * the yes arrives tomorrow, futgal comes in as one more adapter and a weight
 * in the configuration; the engine is not rebuilt». Translated into the shape
 * of the code: one entry per source — its `SourceId`, its RN-01 weight, the
 * URL of each competition and the function that reads its rows — and the
 * adapter READS THE WEIGHT FROM HERE, never from a constant of its own.
 *
 * THE WEIGHTS OF RN-01 LIVE IN ONE PLACE. Until today they were split between
 * the rule and the head of whoever read it; from here on the table has one
 * executable representation, and the `confidence` of an `Observation` comes
 * out of it.
 */
import { CompetitionIdSchema, SourceIdSchema } from '@/model/ids';
import { CEROACERO, extractCeroacero } from './ceroacero';
import type { RowExtractor } from './ports';
import type { CompetitionId, SourceId } from '@/model/ids';

/**
 * RN-01, the weight table, written once and executable.
 *
 * `operator` and `official` share 1.0 and are NOT interchangeable — if they
 * disagree the operator wins, and the `Decision` records that it was settled
 * by human precedence. That precedence belongs to the engine, not here; this
 * module only owns the numbers.
 */
export const RN01_WEIGHTS = {
  operator: 1,
  official: 1,
  paid_api: 0.9,
  correspondent: 0.8,
  aggregator: 0.7,
  club_tweet: 0.5,
} as const;

/** One entry of the registry. Adding a source is adding one of these. */
export interface SourceEntry {
  readonly source: SourceId;
  /** The RN-01 weight. It becomes the `confidence` of every Observation. */
  readonly weight: number;
  /** Extension of the served body, for the raw key: `html`, `json`… */
  readonly ext: string;
  /** Where each competition is read, as the source publishes it. */
  readonly competitions: readonly (readonly [CompetitionId, string])[];
  readonly extract: RowExtractor;
}

/** One (source, competition) pair, and where to read it. */
export interface IngestTarget {
  readonly source: SourceId;
  readonly competition_id: CompetitionId;
  readonly url: string;
  readonly ext: string;
}

/** Thrown when something asks for a source that is not in the registry. */
export class UnknownSourceError extends Error {
  override readonly name = 'UnknownSourceError';

  constructor(source: string) {
    super(`no entry in the source registry for ${JSON.stringify(source)}`);
  }
}

export interface SourceRegistry {
  readonly entries: readonly SourceEntry[];
  entry(source: SourceId): SourceEntry;
  /** Every pair the registry declares, in registry order. */
  targets(): readonly IngestTarget[];
}

export function sourceRegistry(entries: readonly SourceEntry[]): SourceRegistry {
  const bySource = new Map<string, SourceEntry>(entries.map((entry) => [entry.source, entry]));

  return {
    entries,
    entry(source: SourceId): SourceEntry {
      const found = bySource.get(source);
      if (found === undefined) throw new UnknownSourceError(source);
      return found;
    },
    targets(): readonly IngestTarget[] {
      return entries.flatMap((entry) =>
        entry.competitions.map(([competition_id, url]) => ({
          source: entry.source,
          competition_id,
          url,
          ext: entry.ext,
        })),
      );
    },
  };
}

export const TERCERA_G1 = CompetitionIdSchema.parse('rfef-tercera-g1');
export const PREFERENTE_G1 = CompetitionIdSchema.parse('futgal-preferente-g1');

/**
 * `ceroacero.es`, weight 0.7 (RN-01).
 *
 * The URLs and the `competition_id`s are not invented here: they are the ones
 * verified and in use in `ventanas/jornada-1/config.json`, which is what the
 * archive of 2026-08-31 was captured with. Its `robots.txt` forbids a single
 * path, `/zzmap_v3.php`, which is neither of these two (verified 2026-08-31).
 */
export const CEROACERO_ENTRY: SourceEntry = {
  source: CEROACERO,
  weight: RN01_WEIGHTS.aggregator,
  ext: 'html',
  competitions: [
    [
      PREFERENTE_G1,
      'https://www.ceroacero.es/edicion/galicia-preferente-autonomica-grupo-1-26-27/222309',
    ],
    [TERCERA_G1, 'https://www.ceroacero.es/edicion/tercera-division-grupo-1-galicia-2026-27/220459'],
  ],
  extract: extractCeroacero,
};

/**
 * What the project can capture TODAY, and it is one source.
 *
 * `futgal.es`, the official one and the only weight 1.0 among the automatic
 * sources, is not here because its `robots.txt` forbids crawling and RN-11
 * obliges us to respect it (ADR-008 §1). `besoccer.es` is not here because it
 * serves empty shells and its data lives behind a `Disallow: /ajax*` that, as
 * of CA-1, is finally respected. The day either becomes capturable, it is an
 * entry in this array — that is the whole point of CA-11.
 */
export const DEFAULT_SOURCES: readonly SourceEntry[] = [CEROACERO_ENTRY];

export const defaultRegistry = (): SourceRegistry => sourceRegistry(DEFAULT_SOURCES);

/** The identifier of the official source, for the day it can be captured. */
export const FUTGAL: SourceId = SourceIdSchema.parse('futgal');
