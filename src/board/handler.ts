/**
 * `GET /marcador` and `GET /es/marcador` — the screen (SPEC-018 CA-2, CA-8,
 * CA-9, CA-10, CA-11, CA-12, CA-13; ADR-027).
 *
 * THE ORDER IS THE SPEC, and it is the same one `/api/board` walks, because it
 * is literally the same function: `boardSnapshotOf`. What this module adds is
 * the DOCUMENT — the projection painted, with the three clocks in their three
 * places and the degradation notice before the table.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PUBLIC, AND THAT IS A FRONTIER (ADR-027 §3.a, CA-2.1).
 *
 * No session, no cookie, no `Accept-Language`, no client header, nothing
 * written anywhere. THE LANGUAGE COMES FROM THE URL. If somebody «protects»
 * this screen one day, what they have done is split the product in two truths:
 * the operator would see one thing and the public another. And the ABSENCE of
 * a door is what lets the answer be served from a SHARED cache (CA-7.5)
 * without leaking anything about anybody, and what retires art. 22.2 LSSI
 * with no banner and no consent.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE THREE CLOCKS, AND THEY NEVER GET CONFUSED (ADR-027 §4).
 *
 *   * THE SOURCE'S goes IN THE ROW, labelled *Último dato*, derived from the
 *     newest `observed_at` of the observations that sustain the live
 *     `Decision`, AND PUBLISHED AS AN AGE ROUNDED TO MINUTES — never as an
 *     absolute instant with seconds (CA-8.1). It is the one that says whether
 *     that 1-0 is to be believed, and it is what RN-07 is measured on.
 *     `decided_at` in the row would be MISLEADING: the engine does not emit a
 *     `Decision` per tick, so a `live` match with no goals can have a
 *     `decided_at` from half an hour ago while being perfectly alive.
 *   * THE DATUM'S travels in the snapshot and is summarised ONCE PER PAGE as
 *     the last publication of the set.
 *   * THE TRANSPORT'S goes OUTSIDE THE TABLE, with its own label, and a
 *     failure of it NEVER paints as a state or as a qualifier.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * `src/board/` IMPORTS NOTHING OF `src/db/` OR `src/decide/` (CA-1.1). It
 * takes the projection from `src/api/`, which is the frontier: a screen with
 * privileged access to the base is a screen that will one day publish
 * something no `Decision` sustains.
 */
import { BOARD_API_PATH, REFRESH_SECONDS } from '@/api/freshness';
import {
  boardHeaders,
  boardSnapshotOf,
  asksForSomethingArbitrary,
  etagOf,
  notFound,
  productionBoardPorts,
} from '@/api/handler';
import { AUTOMATIC_SOURCES } from './sources';
import { sectionsOf } from './order';
import {
  BOARD_SCORE_LINE,
  BOARD_VALUE,
  boardBundle,
  boardQualifier,
  boardStatus,
  fillBoard,
} from '@/i18n/board';
import { titlesBundle } from '@/i18n/titles';
import { MAILBOX } from '@/site/contact';
import { CRAWLER_PATH, PROJECT_PATH, SCOREBOARD_PATH } from '@/site/routes';
import { epochMsOf } from '@/polite/clock';
import {
  cell,
  configBlock,
  document,
  heading,
  headerCell,
  link,
  paragraph,
  refreshScript,
  row,
  section,
  table,
  text,
  transportNotice,
} from './view/markup';
import { qualifiersBundle } from '@/i18n/qualifiers';
import { statusesBundle } from '@/i18n/statuses';
import type { BoardRowPayload, BoardSnapshot } from '@/api/contract';
import type { BoardPorts } from '@/api/ports';
import type { BoardText, BoardTextBundle } from '@/i18n/board';
import type { SiteLocale } from '@/i18n/site-bundle';
import type { Instant } from '@/model/ids';

export interface BoardOptions {
  readonly ports: BoardPorts;
  readonly locale: SiteLocale;
}

/** The other language, which is the one the cross link offers (D-2). */
function otherLocale(locale: SiteLocale): SiteLocale {
  return locale === 'gl' ? 'es' : 'gl';
}

/**
 * The age of an instant in whole minutes, never below zero. It is the ONE
 * arithmetic the screen does with a clock, and it happens HERE and not in the
 * projection, which is pure (CA-4.5).
 */
export function minutesSince(instant: string, now: Instant): number {
  const elapsed = epochMsOf(now) - epochMsOf(`${instant.slice(0, 16)}:00Z`);
  // Never below zero, and written without `Math.max` on purpose: the declared
  // global surface of `Math` is `ceil` and `floor` (SPEC-009 CA-1), and
  // widening it for an arithmetic a ternary already does would be paying a
  // capability for a convenience.
  return elapsed <= 0 ? 0 : Math.floor(elapsed / 60000);
}

/** *Último dato*: an age in minutes, never an absolute instant (CA-8.1). */
function lastDataOf(
  bundle: BoardTextBundle,
  instant: string | null,
  now: Instant,
): BoardText {
  if (instant === null) return bundle.lastDataNone;
  const minutes = minutesSince(instant, now);
  return minutes < 1
    ? bundle.lastDataNow
    : fillBoard(bundle.lastDataMinutes, { n: `${minutes}` });
}

/**
 * A bare datum — a canonical RFGF name, an hour, a number — carried into the
 * markup through the ONE structural template that can do it. It is not text in
 * any language, and it still has to arrive as a `BoardText` for CA-13.2 to
 * hold: `asBoardText` is not exported, so this is the only way in.
 */
function value(datum: string): BoardText {
  return fillBoard(BOARD_VALUE, { value: datum });
}

/**
 * The scoreboard cell, or the literal that says there is no published one.
 *
 * `{home}-{away}`: digits and one hyphen, which is not text in any language,
 * which is exactly why the template lives in `src/i18n/board.ts` and not here.
 */
function scoreOf(bundle: BoardTextBundle, entry: BoardRowPayload): BoardText {
  if (entry.home_score === null || entry.away_score === null) return bundle.noScoreYet;
  return fillBoard(BOARD_SCORE_LINE, {
    home: `${entry.home_score}`,
    away: `${entry.away_score}`,
  });
}

/**
 * The day and the hour of kickoff, tabular (ADR-013 §3).
 *
 * THE DATE IS NOT OPTIONAL (CA-11.5): in these two competitions «the hour of
 * the matchday» does not exist — the Saturday/Sunday spread is the norm — so an
 * hour with no date is ambiguous, and the person looking for their match on
 * Sunday would read Saturday's.
 */
function whenOf(entry: BoardRowPayload): BoardText {
  return value(`${entry.kickoff.slice(0, 10)} ${entry.kickoff.slice(11, 16)}`);
}

/** The class of a qualifier: `q-pendente-de-confirmar`, never a colour alone. */
function qualifierClass(qualifier: string): string {
  return `q-${qualifier.replaceAll('_', '-')}`;
}

/** The head of the table. Every column labelled, so no literal floats free. */
function tableHead(bundle: BoardTextBundle): string {
  return `<tr>${[
    headerCell(bundle.colTime),
    headerCell(bundle.colHome),
    headerCell(bundle.colAway),
    headerCell(bundle.colScore),
    headerCell(bundle.colStatus),
    headerCell(bundle.colQualifier),
    headerCell(bundle.colLastData),
  ].join('')}</tr>`;
}

/**
 * One row.
 *
 * A `postponed` keeps ITS POSITION BY ORIGINAL HOUR and carries NO scoreboard
 * (`migrations/0001` forbids it, and it is right: a postponed match has no 0-0,
 * it has nothing). A `suspended` DOES carry its partial score — the same
 * migration obliges it — AND the reserve that it is not the final result
 * (CA-10.5). And a `finished` reached by RN-06's timeout carries, IN THE SAME
 * ROW, its scoreboard, *Rematado*, *Pendente de confirmar* and the age of the
 * last datum: the four together are what stops this screen publishing the
 * result of a match that was never played (CA-10.6).
 */
function boardRowMarkup(
  bundle: BoardTextBundle,
  locale: SiteLocale,
  entry: BoardRowPayload,
  now: Instant,
): string {
  const statusText = boardStatus(locale, entry.status);
  const qualifierText =
    entry.qualifier === null ? bundle.noScoreYet : boardQualifier(locale, entry.qualifier);

  const cells = [
    cell(whenOf(entry), 'time', 'instant'),
    cell(value(entry.home), 'home', 'team'),
    cell(value(entry.away), 'away', 'team'),
    cell(scoreOf(bundle, entry), 'score', 'score'),
    cell(statusText, 'status', `s-${entry.status}`),
    cell(
      qualifierText,
      'qualifier',
      entry.qualifier === null ? '' : qualifierClass(entry.qualifier),
    ),
    cell(lastDataOf(bundle, entry.last_observed_at, now), 'last', 'instant'),
  ];

  const suspended =
    entry.status === 'suspended' ? `<tr><td colspan="7">${text(bundle.suspendedReserve)}</td></tr>` : '';

  return `${row(entry.match_id, cells)}${suspended}`;
}

/** The degradation notice: four things, before the table, with no interaction. */
function noticeMarkup(bundle: BoardTextBundle, sources: number): string {
  const degradation =
    sources === 1
      ? bundle.noticeSingleSource
      : fillBoard(bundle.noticeSeveralSources, { sources: `${sources}` });

  return section(
    [
      heading(2, bundle.noticeHeading),
      paragraph(bundle.noticeMeasurement),
      paragraph(bundle.noticeNotOfficial),
      paragraph(degradation),
      paragraph(fillBoard(bundle.noticeStop, { mailbox: MAILBOX })),
    ],
    'notice',
  );
}

/** The page's clock of the DATUM: the last publication of the set served. */
function publishedMarkup(
  bundle: BoardTextBundle,
  snapshot: BoardSnapshot,
  now: Instant,
): string {
  if (snapshot.version === null) return paragraph(bundle.publishedNever, 'soft');
  const minutes = minutesSince(snapshot.version, now);
  return paragraph(fillBoard(bundle.publishedAt, { n: `${minutes}` }), 'soft');
}

/** The three outbound links, the mailbox in one click, and the other language. */
function footerMarkup(bundle: BoardTextBundle, locale: SiteLocale): string {
  const other = otherLocale(locale);
  return [
    '<nav>',
    // THE THREE OUTBOUND LINKS OF CA-2.7, and there are no others.
    `<p>${link(CRAWLER_PATH[locale], bundle.crawlerLink)}</p>`,
    `<p>${link(PROJECT_PATH[locale], bundle.projectLink)}</p>`,
    // CA-2.8 — the mailbox in ONE CLICK, in the footer of the screen itself.
    `<p>${link(`mailto:${MAILBOX}`, bundle.mailboxLink)}</p>`,
    // Not an outbound link: the same screen in the other language (D-2).
    `<p><a href="${SCOREBOARD_PATH[other]}" lang="${other}" hreflang="${other}">${text(
      bundle.otherLanguage,
    )}</a></p>`,
    '</nav>',
  ].join('');
}

/** The whole document. */
export function boardDocument(
  locale: SiteLocale,
  snapshot: BoardSnapshot,
  now: Instant,
  etag: string,
  sources: number = AUTOMATIC_SOURCES,
): string {
  const bundle = boardBundle(locale);
  const sections = sectionsOf(snapshot);

  const body: string[] = [
    heading(1, bundle.heading),
    noticeMarkup(bundle, sources),
    transportNotice(bundle.refreshedNow),
    paragraph(fillBoard(bundle.autoRefresh, { seconds: `${REFRESH_SECONDS}` }), 'soft'),
    publishedMarkup(bundle, snapshot, now),
  ];

  if (sections.length === 0) {
    // THE TWO EMPTIES ARE SAID DIFFERENTLY (CA-3.3): «no matchday is declared»
    // is an operational fault only whoever looks finds out about; «the declared
    // matchday holds no match» is information.
    body.push(
      paragraph(snapshot.matchday_declared ? bundle.emptyNoMatches : bundle.emptyNoMatchday),
    );
  }

  for (const competition of sections) {
    body.push(
      // THE CANONICAL RFGF NAME, ENTIRE, never abbreviated (CA-11.1).
      heading(
        2,
        fillBoard(bundle.competitionHeading, { competition: competition.competition_name }),
      ),
      table(
        tableHead(bundle),
        competition.rows.map((entry) => boardRowMarkup(bundle, locale, entry, now)),
      ),
    );
  }

  body.push(
    footerMarkup(bundle, locale),
    configBlock({
      etag,
      api: BOARD_API_PATH,
      statuses: statusesBundle(locale),
      qualifiers: qualifiersBundle(locale),
      noScoreYet: bundle.noScoreYet,
      lastDataNow: bundle.lastDataNow,
      lastDataMinutes: bundle.lastDataMinutes,
      lastDataNone: bundle.lastDataNone,
      refreshedNow: bundle.refreshedNow,
      refreshedMinutes: bundle.refreshedMinutes,
      refreshFailed: bundle.refreshFailed,
      reloadHint: bundle.reloadHint,
    }),
    refreshScript(),
  );

  return document(locale, value(titlesBundle(locale).scoreboard), body.join('\n'));
}

/** Builds the handler of one language of the screen. */
export function boardHandler(options: BoardOptions): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    if (asksForSomethingArbitrary(request)) return notFound();

    const snapshot = await boardSnapshotOf(options.ports);
    const now = options.ports.clock.now();
    const etag = etagOf(JSON.stringify(snapshot));

    return new Response(boardDocument(options.locale, snapshot, now, etag), {
      status: 200,
      headers: boardHeaders('text/html; charset=utf-8'),
    });
  };
}

/** The handler each route binds. Routing and nothing else. */
export function productionBoardHandler(
  locale: SiteLocale,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> =>
    await boardHandler({ ports: productionBoardPorts(), locale })(request);
}
