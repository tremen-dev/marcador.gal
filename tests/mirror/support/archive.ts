/**
 * Fixture archives for phase B.
 *
 * The fixtures go in through the REAL path: they are written to a `RawStore`
 * as HTML, read back with `store.get()` and parsed by the real extractor. That
 * costs a few lines here and buys two things the criteria need — the raw keys
 * cited by the report are keys that actually exist (CA-14), and the analysis
 * under test is the one that will run against the real window, not a
 * shortcut that skips extraction.
 */
import { canonicalInstant, instantToEpochMs } from '@/mirror/instants';
import { competitionId, matchId } from '@/mirror/ids';
import { PairingSchema, buildPairingIndex } from '@/mirror/analysis/pairing';
import { tableExtractor } from '@/mirror/analysis/extract';
import { readArchive } from '@/mirror/analysis/timeline';
import type { ExtractorConfig, MatchStatus, SourceExtractor } from '@/mirror/analysis/extract';
import type { PairingIndex } from '@/mirror/analysis/pairing';
import type { Timeline } from '@/mirror/analysis/timeline';
import type { TickRecord, WindowLog } from '@/mirror/window';
import type { CompetitionId, SourceId } from '@/model/ids';
import type { RawStore } from '@/raw/store';
import { MemoryRawStore } from './memory-store';

export const FIXTURE_COMPETITION: CompetitionId = competitionId('rfef-tercera-g1');
export const FIXTURE_START = '2026-09-05T17:00:00.000Z';

const STATUS_WORDS: Readonly<Record<MatchStatus, string>> = {
  scheduled: 'Programado',
  live: 'En xogo',
  finished: 'Finalizado',
  postponed: 'Aprazado',
  suspended: 'Suspendido',
};

export const FIXTURE_EXTRACTOR_CONFIG: ExtractorConfig = {
  rowSelector: 'tr.match',
  refSelector: null,
  refAttribute: 'data-id',
  homeSelector: '.home',
  awaySelector: '.away',
  scoreSelector: '.score',
  statusSelector: '.status',
  kickoffSelector: '.kickoff',
  statusWords: {
    finalizado: 'finished',
    'en xogo': 'live',
    aprazado: 'postponed',
    suspendido: 'suspended',
    programado: 'scheduled',
  },
};

/** One match as one source renders it in one capture. */
export interface Cell {
  readonly id: string;
  readonly status: MatchStatus;
  readonly home_score?: number | null;
  readonly away_score?: number | null;
  readonly home?: string;
  readonly away?: string;
  readonly kickoff?: string | null;
}

/** One capture of one source: seconds from the window start, and its rows. */
export interface Shot {
  readonly at: number;
  readonly matches: readonly Cell[];
}

/** The whole window: what each source published, capture by capture. */
export type Plan = ReadonlyMap<SourceId, readonly Shot[]>;

export interface Fixture {
  readonly store: RawStore;
  readonly keys: readonly string[];
  readonly extractors: ReadonlyMap<SourceId, SourceExtractor>;
  readonly pairing: PairingIndex;
  readonly timeline: Timeline;
  readonly log: WindowLog;
}

/** `plan` as a map, spelled without the `new Map([[...]])` noise. */
export function plan(...entries: readonly (readonly [SourceId, readonly Shot[]])[]): Plan {
  return new Map(entries);
}

/**
 * A one-minute grid: `values[i]` is the value at minute `i`. `null` means the
 * match is absent from that capture.
 */
export function everyMinute(
  id: string,
  values: readonly (Omit<Cell, 'id'> | null)[],
  options: { readonly from?: number; readonly stepSeconds?: number } = {},
): readonly Shot[] {
  const from = options.from ?? 0;
  const step = options.stepSeconds ?? 60;
  return values.map((value, index) => ({
    at: from + index * step,
    matches: value === null ? [] : [{ id, ...value }],
  }));
}

/** Merges per-match grids into one timeline of captures. */
export function merge(...grids: readonly (readonly Shot[])[]): readonly Shot[] {
  const byInstant = new Map<number, Cell[]>();
  for (const grid of grids) {
    for (const shot of grid) {
      const cells = byInstant.get(shot.at) ?? [];
      cells.push(...shot.matches);
      byInstant.set(shot.at, cells);
    }
  }
  return [...byInstant.entries()]
    .sort(([a], [b]) => a - b)
    .map(([at, matches]) => ({ at, matches }));
}

function renderRow(cell: Cell): string {
  const score =
    cell.home_score === null || cell.home_score === undefined
      ? '-'
      : `${cell.home_score}-${cell.away_score ?? 0}`;
  return `<tr class="match" data-id="${cell.id}">
    <td class="home">${cell.home ?? `Home ${cell.id}`}</td>
    <td class="score">${score}</td>
    <td class="away">${cell.away ?? `Away ${cell.id}`}</td>
    <td class="status">${STATUS_WORDS[cell.status]}</td>
    <td class="kickoff">${cell.kickoff ?? ''}</td>
  </tr>`;
}

/**
 * Writes the plan into a raw store and reads it back into a timeline.
 *
 * The pairing file is generated from the union of the ids in the plan, with
 * the identity of each source being the id itself — which is what a person
 * would have written by hand for a window of eight matches (CA-6).
 */
export async function buildFixture(
  source: Plan,
  options: { readonly start?: string; readonly store?: RawStore } = {},
): Promise<Fixture> {
  const store = options.store ?? new MemoryRawStore();
  const startMs = instantToEpochMs(options.start ?? FIXTURE_START);
  const keys: string[] = [];
  const ticks: TickRecord[] = [];
  const ids = new Set<string>();
  const sources: SourceId[] = [];

  for (const [sourceId, shots] of source) {
    sources.push(sourceId);
    for (const shot of shots) {
      const fetched_at = canonicalInstant(startMs + shot.at * 1000);
      const body = new TextEncoder().encode(
        `<html><body><table>${shot.matches.map(renderRow).join('')}</table></body></html>`,
      );
      const key = await store.put(
        { source: sourceId, competition_id: FIXTURE_COMPETITION, fetched_at, ext: 'html' },
        body,
      );
      keys.push(key);
      ticks.push({
        source: sourceId,
        competition_id: FIXTURE_COMPETITION,
        at: fetched_at,
        outcome: 'ok',
        reason: null,
        raw_ref: key,
      });
      for (const cell of shot.matches) ids.add(cell.id);
    }
  }

  const pairing = buildPairingIndex(
    PairingSchema.parse({
      window: 'fixture',
      matches: [...ids].sort().map((id) => ({
        match_id: matchId(id),
        refs: Object.fromEntries(sources.map((sourceId) => [sourceId, id])),
      })),
    }),
  );

  const extractors = new Map<SourceId, SourceExtractor>(
    sources.map((sourceId) => [sourceId, tableExtractor(sourceId, FIXTURE_EXTRACTOR_CONFIG)]),
  );

  const timeline = await readArchive({ store, keys, extractors, pairing });

  return { store, keys, extractors, pairing, timeline, log: { ticks } };
}
