/**
 * The minimal extractor of phase B.
 *
 * Deliberately less than an adapter: it reads the identity of the match, its
 * `status`, its scoreboard and its kickoff, and stops there. It resolves no
 * alias (RN-09 stays with the adapters), builds no `Observation` and touches
 * no database — the mirror test is measurement, and its verdict is about the
 * RELATION between sources, not about publishing anything.
 *
 * It is selector-driven because the three real pages have not been seen. The
 * machinery is written and tested today; the day of the window the calibration
 * is a handful of CSS selectors in `sources.ts`, and — this is the point of
 * splitting the phases — getting them wrong costs a re-run of phase B and not
 * the window (RN-10).
 */
import * as cheerio from 'cheerio';
import { normalizeAlias } from '@/model/team';
import type { Observation } from '@/model/observation';
import type { SourceId } from '@/model/ids';

/**
 * The five states, taken from the canonical model rather than retyped. If
 * `Observation` ever gains a sixth, `tests/mirror/analysis/statuses.test-d.ts`
 * goes red instead of this list silently going stale.
 */
export type MatchStatus = Observation['status'];

export const MATCH_STATUSES = [
  'scheduled',
  'live',
  'finished',
  'postponed',
  'suspended',
] as const satisfies readonly MatchStatus[];

/** What one row of a source's page says about one match. */
export interface ExtractedMatch {
  /** The identity of the match AS THE SOURCE WRITES IT. Never guessed (CA-6). */
  readonly source_ref: string;
  readonly home_name: string;
  readonly away_name: string;
  readonly status: MatchStatus;
  readonly home_score: number | null;
  readonly away_score: number | null;
  /** Kickoff normalised to `HH:MM`, or `null` when the page shows none. */
  readonly kickoff: string | null;
}

export interface SourceExtractor {
  readonly source: SourceId;
  extract(body: Uint8Array): readonly ExtractedMatch[];
}

export interface ExtractorConfig {
  readonly rowSelector: string;
  /** Where the identity lives inside the row. `null` means the row itself. */
  readonly refSelector: string | null;
  /** Attribute holding the identity. `null` means the element's text. */
  readonly refAttribute: string | null;
  readonly homeSelector: string;
  readonly awaySelector: string;
  readonly scoreSelector: string;
  readonly statusSelector: string | null;
  readonly kickoffSelector: string | null;
  /** Lowercased words the page uses for each state. */
  readonly statusWords: Readonly<Record<string, MatchStatus>>;
}

/** Thrown when a row cannot be read whole. Half a match is worse than none. */
export class UnextractableRowError extends Error {
  override readonly name = 'UnextractableRowError';

  constructor(source: SourceId, reason: string, html: string) {
    super(`${source}: ${reason} in row ${JSON.stringify(html.slice(0, 200))}`);
  }
}

export function tableExtractor(source: SourceId, config: ExtractorConfig): SourceExtractor {
  return {
    source,
    extract(body: Uint8Array): readonly ExtractedMatch[] {
      const $ = cheerio.load(new TextDecoder().decode(body));
      const matches: ExtractedMatch[] = [];

      $(config.rowSelector).each((_index, element) => {
        const row = $(element);
        const html = $.html(element);

        const holder = config.refSelector === null ? row : row.find(config.refSelector);
        const ref = (
          config.refAttribute === null ? holder.text() : (holder.attr(config.refAttribute) ?? '')
        ).trim();
        if (ref.length === 0) {
          throw new UnextractableRowError(source, 'no match identity', html);
        }

        const home = normalizeAlias(row.find(config.homeSelector).text());
        const away = normalizeAlias(row.find(config.awaySelector).text());
        if (home.length === 0 || away.length === 0) {
          throw new UnextractableRowError(source, 'no team names', html);
        }

        const [home_score, away_score] = parseScore(row.find(config.scoreSelector).text());
        const statusText =
          config.statusSelector === null ? '' : row.find(config.statusSelector).text();

        matches.push({
          source_ref: ref,
          home_name: home,
          away_name: away,
          status: readStatus(statusText, config.statusWords, home_score !== null),
          home_score,
          away_score,
          kickoff:
            config.kickoffSelector === null
              ? null
              : parseKickoff(row.find(config.kickoffSelector).text()),
        });
      });

      return matches;
    },
  };
}

/** `2-1`, `3 – 0`, `2:1`. Anything without two numbers is no scoreboard. */
export function parseScore(text: string): readonly [number | null, number | null] {
  const match = /(\d+)\s*[-–—:]\s*(\d+)/u.exec(text);
  if (match === null) return [null, null];
  return [Number(match[1]), Number(match[2])];
}

/**
 * The declared state, or an inference from the scoreboard.
 *
 * The fallback is narrow on purpose: a page that shows a scoreboard is showing
 * a match that has started, and one that shows none has not. Anything cleverer
 * would be the extractor deciding things the decision engine decides (RN-08).
 */
export function readStatus(
  text: string,
  words: Readonly<Record<string, MatchStatus>>,
  hasScore: boolean,
): MatchStatus {
  const haystack = normalizeAlias(text).toLowerCase();
  for (const [word, status] of Object.entries(words)) {
    if (haystack.includes(word)) return status;
  }
  return hasScore ? 'live' : 'scheduled';
}

/** `17:00 h`, `Sáb. 17.30` → `17:30`. Nothing recognisable → `null`. */
export function parseKickoff(text: string): string | null {
  const match = /\b([01]?\d|2[0-3])[:.h]([0-5]\d)\b/u.exec(text);
  if (match === null) return null;
  return `${match[1]!.padStart(2, '0')}:${match[2]}`;
}
