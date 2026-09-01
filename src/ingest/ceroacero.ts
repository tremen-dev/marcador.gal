/**
 * Reading a competition page of `ceroacero.es`.
 *
 * WHAT IS CALIBRATED AND WHAT IS A DECLARED CONVENTION, said up front because
 * the difference matters more than the selectors:
 *
 *   CALIBRATED against the HTML archived in `raw/` on 2026-08-31 (six
 *   captures, purge due 2026-09-30, ADR-009): the round card is
 *   `#fixture_games`, one `<tr>` per match, the identity is the `/partido/…`
 *   href inside `td.vs`, the two team names are the two `td.text` cells in
 *   home-away order, and a match not yet played shows `HH:MM` in `td.vs`.
 *
 *   A DECLARED CONVENTION, not an observation: what the other four branches
 *   write in that same cell. The archive is from the eve of matchday 1, so no
 *   played row existed in it. `SHAPE` below is therefore configuration — the
 *   day a real live page is captured, recalibrating is editing this object and
 *   nothing else (F-SPEC-008-2).
 *
 * It reads and does nothing else: it resolves no alias, builds no
 * `Observation` and touches no database. That is `observations.ts`.
 */
import * as cheerio from 'cheerio';
import { SourceIdSchema } from '@/model/ids';
import { normalizeAlias } from '@/model/team';
import { UnreadableRowError } from './ports';
import type { MatchStatus, RowExtractor, SourceRow } from './ports';
import type { SourceId } from '@/model/ids';

export interface RowShape {
  /** The rows of the round card, and only of the round card. */
  readonly rowSelector: string;
  /** Where the identity of the match lives inside the row. */
  readonly identitySelector: string;
  readonly identityAttribute: string;
  /** The cells carrying the two names, in home-away order. */
  readonly nameSelector: string;
  /** The cell carrying the scoreboard, the kickoff or the declared state. */
  readonly resultSelector: string;
  /**
   * How this source writes a scoreboard, with the two goal counts captured.
   *
   * `:` is NOT a separator here, and that is not an oversight: `20:00` is a
   * kickoff and reading it as 20-0 is exactly the kind of invented value CA-8
   * exists to forbid. A source that writes `2:1` declares it in its own shape.
   */
  readonly scorePattern: RegExp;
  /** How this source writes a kickoff, with hours and minutes captured. */
  readonly kickoffPattern: RegExp;
  /**
   * Lowercased, unaccented words the page uses for a state. Order matters:
   * the first that appears in the cell wins.
   */
  readonly statusWords: readonly (readonly [word: string, status: MatchStatus])[];
  /** What marks a row whose scoreboard is moving right now. */
  readonly liveMarker: RegExp;
}

export const CEROACERO_SHAPE: RowShape = {
  rowSelector: '#fixture_games tr',
  identitySelector: 'td.vs a[href]',
  identityAttribute: 'href',
  nameSelector: 'td.text',
  resultSelector: 'td.vs',
  scorePattern: /(\d+)\s*[-–—]\s*(\d+)/u,
  kickoffPattern: /\b([01]?\d|2[0-3])[:.h]([0-5]\d)\b/u,
  statusWords: [
    ['aplazado', 'postponed'],
    ['adiado', 'postponed'],
    ['suspendido', 'suspended'],
    ['suspenso', 'suspended'],
    ['descanso', 'live'],
  ],
  // The class the site puts on the cell it refreshes, or a shown minute.
  liveMarker: /\blive\b|\b\d{1,3}'/u,
};

/** `2-1`, `3 – 0`. Anything without two numbers is no scoreboard. */
export function parseScore(
  text: string,
  pattern: RegExp,
): readonly [number | null, number | null] {
  const found = pattern.exec(text);
  if (found === null) return [null, null];
  return [Number(found[1]), Number(found[2])];
}

/** `20:00`, `Sáb. 17.30` → `20:00`. Nothing recognisable → `null`. */
export function parseKickoff(text: string, pattern: RegExp): string | null {
  const found = pattern.exec(text);
  if (found === null) return null;
  return `${found[1]!.padStart(2, '0')}:${found[2]}`;
}

function deaccent(value: string): string {
  return value
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * A `RowExtractor` over a table-shaped competition page.
 *
 * Written as a factory over `RowShape` and not inlined so that adding a source
 * is adding an entry to the registry and its shape, never a branch in here
 * (SPEC-008 §3, CA-11).
 */
export function tableExtractor(source: SourceId, shape: RowShape): RowExtractor {
  return (body: Uint8Array): readonly SourceRow[] => {
    const $ = cheerio.load(new TextDecoder().decode(body));
    const rows: SourceRow[] = [];

    $(shape.rowSelector).each((_index, element) => {
      const row = $(element);
      const resultCell = row.find(shape.resultSelector).first();
      // A row without the identity cell is not a match row — a header, a
      // spacer. A row WITH it that cannot be read whole is a different thing
      // entirely, and it aborts below.
      if (resultCell.length === 0) return;

      const html = $.html(element);
      const identity = (
        row.find(shape.identitySelector).first().attr(shape.identityAttribute) ?? ''
      ).trim();
      if (identity.length === 0) {
        throw new UnreadableRowError(source, 'no match identity', html);
      }

      const names = row
        .find(shape.nameSelector)
        .map((_i, cell) => normalizeAlias($(cell).text()))
        .get()
        .filter((name) => name.length > 0);
      const [home_name, away_name] = names;
      if (names.length !== 2 || home_name === undefined || away_name === undefined) {
        throw new UnreadableRowError(source, `expected two team names, found ${names.length}`, html);
      }

      const resultText = resultCell.text().trim();
      const declared = declaredStatus(resultText, shape);
      const [home_score, away_score] = parseScore(resultText, shape.scorePattern);
      const kickoff = parseKickoff(resultText, shape.kickoffPattern);
      const live = shape.liveMarker.test(`${resultCell.attr('class') ?? ''} ${resultText}`);

      const status = declared ?? statusFromResult(home_score, kickoff, live);
      if (status === null) {
        throw new UnreadableRowError(
          source,
          `unreadable result cell ${JSON.stringify(resultText)}`,
          html,
        );
      }

      // Half a match is worse than none: a branch that must carry a scoreboard
      // and has none is not a row with a hole, it is a row we cannot read.
      const scored = status === 'live' || status === 'finished' || status === 'suspended';
      if (scored && (home_score === null || away_score === null)) {
        throw new UnreadableRowError(source, `${status} row with no readable score`, html);
      }

      rows.push({
        source_ref: identity,
        home_name,
        away_name,
        status,
        home_score: scored ? home_score : null,
        away_score: scored ? away_score : null,
        kickoff: status === 'scheduled' ? kickoff : null,
      });
    });

    return rows;
  };
}

/** The state the page DECLARES in words, or `null` if it declares none. */
function declaredStatus(resultText: string, shape: RowShape): MatchStatus | null {
  const haystack = deaccent(resultText);
  for (const [word, status] of shape.statusWords) {
    if (haystack.includes(word)) return status;
  }
  return null;
}

/**
 * The state a page that declares none is showing.
 *
 * Narrow on purpose: a cell with a scoreboard is showing a match that has
 * started, and one with a kickoff is showing one that has not. Anything
 * cleverer would be the adapter deciding what the engine decides (RN-08), and
 * a cell that is neither is a cell we cannot read.
 */
function statusFromResult(
  homeScore: number | null,
  kickoff: string | null,
  live: boolean,
): MatchStatus | null {
  if (homeScore !== null) return live ? 'live' : 'finished';
  if (kickoff !== null) return 'scheduled';
  return null;
}

/** `ceroacero.es`, the only automatic source the project can capture today. */
export const CEROACERO: SourceId = SourceIdSchema.parse('ceroacero');

/** The reader of `ceroacero.es`, with its calibrated shape. */
export const extractCeroacero: RowExtractor = tableExtractor(CEROACERO, CEROACERO_SHAPE);
