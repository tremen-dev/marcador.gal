/**
 * Phase B, step one: turn the archive into a timeline.
 *
 * Reading here does NOT skip RN-10. The bytes were archived before anyone
 * parsed them, by construction: phase A wrote them and this reads them back
 * with `store.get()`. `captureThenParse` is the online path; the replay is the
 * other half of what RN-10 was for.
 *
 * Everything in this module is a pure function of (archive, pairing): keys are
 * sorted before they are read, nothing consults a clock, and nothing depends
 * on the order `store.list()` happened to return (CA-7).
 */
import { instantToEpochMs, normalizeInstant } from '@/mirror/instants';
import type { CompetitionId, Instant, MatchId, SourceId } from '@/model/ids';
import type { RawStore } from '@/raw/store';
import type { ExtractedMatch, MatchStatus, SourceExtractor } from './extract';
import type { PairingIndex } from './pairing';

/** The value of a match at an instant: the terna the spec compares. */
export interface MatchValue {
  readonly status: MatchStatus;
  readonly home_score: number | null;
  readonly away_score: number | null;
}

/** A total, stable rendering of a value. Used as a map key and in the report. */
export function valueKey(value: MatchValue): string {
  return `${value.status}:${value.home_score ?? '-'}-${value.away_score ?? '-'}`;
}

/** What one source said about one match in one capture. */
export interface Reading {
  readonly source: SourceId;
  readonly competition_id: CompetitionId;
  readonly match_id: MatchId;
  readonly fetched_at: Instant;
  readonly raw_key: string;
  readonly value: MatchValue;
  readonly kickoff: string | null;
  readonly home_name: string;
  readonly away_name: string;
}

/** One archived response, after extraction. */
export interface Capture {
  readonly source: SourceId;
  readonly competition_id: CompetitionId;
  readonly fetched_at: Instant;
  readonly raw_key: string;
  /** Canonical ids present in this capture. */
  readonly match_ids: readonly MatchId[];
}

export interface Timeline {
  readonly captures: readonly Capture[];
  readonly readings: readonly Reading[];
  readonly sources: readonly SourceId[];
  readonly match_ids: readonly MatchId[];
  readonly start: Instant | null;
  readonly end: Instant | null;
}

export interface ReadArchiveOptions {
  readonly store: RawStore;
  /** The keys of the window. Order is irrelevant: they are sorted here. */
  readonly keys: readonly string[];
  /** One extractor per source id. A key of an unknown source is an error. */
  readonly extractors: ReadonlyMap<SourceId, SourceExtractor>;
  readonly pairing: PairingIndex;
}

/** Thrown when the archive holds a key no extractor can read. */
export class UnknownSourceError extends Error {
  override readonly name = 'UnknownSourceError';

  constructor(source: string, key: string) {
    super(`no extractor registered for source ${JSON.stringify(source)} (key ${key})`);
  }
}

export async function readArchive(options: ReadArchiveOptions): Promise<Timeline> {
  const captures: Capture[] = [];
  const readings: Reading[] = [];

  // Sorted, and sorted here: CA-7 forbids depending on the order the store
  // felt like returning. The key sorts chronologically by construction (CA-4).
  for (const key of [...options.keys].sort()) {
    const object = await options.store.get(key);
    if (object === null) continue;

    const source = object.meta.source as SourceId;
    const extractor = options.extractors.get(source);
    if (extractor === undefined) throw new UnknownSourceError(object.meta.source, key);

    const competition_id = object.meta.competition_id as CompetitionId;
    const fetched_at = normalizeInstant(object.meta.fetched_at);
    const extracted = extractor.extract(object.body);
    const match_ids: MatchId[] = [];

    for (const match of extracted) {
      const match_id = options.pairing.resolve(source, match);
      match_ids.push(match_id);
      readings.push({
        source,
        competition_id,
        match_id,
        fetched_at,
        raw_key: key,
        value: toValue(match),
        kickoff: match.kickoff,
        home_name: match.home_name,
        away_name: match.away_name,
      });
    }

    captures.push({ source, competition_id, fetched_at, raw_key: key, match_ids });
  }

  const instants = captures.map((capture) => capture.fetched_at);

  return {
    captures,
    readings,
    sources: [...new Set(captures.map((capture) => capture.source))].sort(),
    match_ids: [...new Set(readings.map((reading) => reading.match_id))].sort(),
    start: instants.length === 0 ? null : instants.reduce((a, b) => (a < b ? a : b)),
    end: instants.length === 0 ? null : instants.reduce((a, b) => (a > b ? a : b)),
  };
}

function toValue(match: ExtractedMatch): MatchValue {
  return {
    status: match.status,
    home_score: match.home_score,
    away_score: match.away_score,
  };
}

/** Readings of one source for one match, in chronological order. */
export function seriesOf(
  timeline: Timeline,
  source: SourceId,
  match_id: MatchId,
): readonly Reading[] {
  return timeline.readings
    .filter((reading) => reading.source === source && reading.match_id === match_id)
    .sort(
      (a, b) =>
        instantToEpochMs(a.fetched_at) - instantToEpochMs(b.fetched_at) ||
        a.raw_key.localeCompare(b.raw_key),
    );
}

/** Captures of one source, in chronological order. */
export function capturesOf(timeline: Timeline, source: SourceId): readonly Capture[] {
  return timeline.captures
    .filter((capture) => capture.source === source)
    .sort((a, b) => a.raw_key.localeCompare(b.raw_key));
}
