/**
 * The contract of the scoreboard's namespace: the ONE type both language
 * bundles have to satisfy (SPEC-018 CA-13.1).
 *
 * Same mechanism as `site`, `crawler`, `titles`, `statuses`, `qualifiers` and
 * `admin`: a language missing a key is a `npm run typecheck` failure and not a
 * screen with a hole in it. D-2 is a locked decision and this type is the shape
 * it takes here — PARITY IS IMPOSED BY THE TYPE, never by a test that counts
 * keys.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT IS NOT HERE, AND IT IS MOST OF WHAT THE SCREEN SAYS:
 *
 *   * THE FIVE MATCH STATUSES, which live in `statuses-bundle.ts` — the bot,
 *     the panel and the scoreboard cannot drift apart (CA-13.4);
 *   * THE FOUR QUALIFIERS, which live in `qualifiers-bundle.ts`, extracted by
 *     this spec so the scoreboard does not have to import the panel's bundle;
 *   * THE CANONICAL NAMES of teams and competitions, which are NEVER
 *     translated and are interpolated as the RFGF writes them (`dominio.md`).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE LEXICAL BARRIER, WHICH IS THE POINT OF HALF OF THIS FILE
 * (ADR-027 §4.4, `sdd-lingua` §3.1, CA-8.4).
 *
 * The words *sinal* / *señal* DO NOT APPEAR IN ANY VALUE OF THIS NAMESPACE.
 * They live only in `qualifiers`. *Sen sinal* is a fact of the MATCH, written
 * by the engine under RN-07; «the page could not refresh» is a fact of the
 * PAGE. The two get said coloquially the same way — a phone with no coverage
 * says exactly that — and the reader of this screen is standing on a touchline
 * with bad coverage. Separated by construction, or confused always.
 *
 * And symmetrically, *actualizar* / *actualizado* do not appear in
 * `qualifiers`. Two absences, one case, one whole class of error closed.
 *
 * AND IT IS FORBIDDEN TO DIAGNOSE WHOSE FAULT IT IS. No *conexión*, no
 * *cobertura*, no *rede*: the system does not know whether the failure is the
 * phone's, the network's or the server's, and pointing at the reader's phone
 * is precisely what pushes them to confuse it with *sen sinal*.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THREE MORE THINGS THIS NAMESPACE MAY NOT SAY (CA-14):
 *
 *   * NO FIRST PERSON SINGULAR (F-SPEC-007-10). The voice is the one already
 *     published and audited: impersonal / reflexive passive for facts of the
 *     system, institutional plural when the project speaks.
 *   * NO PROMISE OF LIVE (CA-14.3): `directo`, `en vivo`, `tempo real`,
 *     `ao instante`, `inmediato` are all out. `live` is *En xogo* everywhere in
 *     the product (`dominio.md`, ADR-026 §4.4), and between a goal and this
 *     screen there are minutes.
 *   * NO WORD OF SUCCESSION (D-1). `volve` is on that blacklist, which is why
 *     the manual way out reads «Carga a páxina de novo» and not «Volve cargar».
 *
 * AND NEVER «SEN DATOS» (ADR-027 §6.3): it shares its mould with *Sen sinal*
 * and would reintroduce the confusion the barrier above closes.
 */

export interface BoardBundle {
  // ── The page ─────────────────────────────────────────────────────────────
  readonly heading: string;

  /** The header of a competition group: `{competition}`, canonical, entire. */
  readonly competitionHeading: string;
  /** `Xornada {round}` — `round` is *jornada* in docs and UI (`dominio.md`). */
  readonly roundLabel: string;

  // ── The columns ──────────────────────────────────────────────────────────
  readonly colTime: string;
  readonly colHome: string;
  readonly colAway: string;
  readonly colScore: string;
  readonly colStatus: string;
  readonly colQualifier: string;
  readonly colLastData: string;

  /**
   * The inline label of the state, for the reading where there is no column
   * header. `dominio.md` demands it since 2026-09-02: *rematar* means two
   * things in football, so `Rematado` never appears as a loose phrase
   * (CA-12.3).
   */
  readonly statusInline: string;
  /** The inline label of the qualifier, for the same reason (CA-12.4). */
  readonly qualifierInline: string;

  // ── What a row says when there is nothing to say ─────────────────────────
  /**
   * A match of a declared matchday with NO `Decision` at all. Never «sen
   * datos» (ADR-027 §6.3), and never one of the four qualifiers: the four of
   * `dominio.md` qualify a PUBLISHED `Decision`, and here there is none.
   */
  readonly noScoreYet: string;
  /** A `suspended` match keeps its partial score AND this reserve (CA-10.5). */
  readonly suspendedReserve: string;

  // ── The three clocks (ADR-027 §4) ────────────────────────────────────────
  /** The row's clock: the source's, as an AGE IN MINUTES, never an instant. */
  readonly lastDataNow: string;
  readonly lastDataMinutes: string;
  /** No observation has ever arrived for this match. NOT «sen datos». */
  readonly lastDataNone: string;

  /** The page's clock: the transport's. Outside the table, once (CA-8.2). */
  readonly refreshedNow: string;
  readonly refreshedMinutes: string;
  readonly refreshFailed: string;
  readonly reloadHint: string;
  /** `{seconds}` is interpolated from `REFRESH_SECONDS`, never written. */
  readonly autoRefresh: string;

  /** The snapshot's clock: the last publication of the set served. */
  readonly publishedNever: string;
  readonly publishedAt: string;

  // ── Empty, and the two ways of being empty (CA-3.3) ──────────────────────
  /**
   * No matchday declared. It is an OPERATIONAL FAULT that only whoever looks
   * finds out about, and it does not read like the next one.
   */
  readonly emptyNoMatchday: string;
  /** A matchday IS declared and it holds no match. That is information. */
  readonly emptyNoMatches: string;

  // ── The degradation notice (CA-13.8) ─────────────────────────────────────
  readonly noticeHeading: string;
  /** (i) This is a measurement, not a product (D-1). */
  readonly noticeMeasurement: string;
  /** (ii) Not official, not the RFGF's, not from `futgal.es`. */
  readonly noticeNotOfficial: string;
  /**
   * (iii) The degradation, WITH ONE automatic source. The count is DERIVED
   * from `DEFAULT_SOURCES`, never typed (CA-13.8).
   */
  readonly noticeSingleSource: string;
  /** (iii) The same, with `{sources}` of them. Interpolated, never written. */
  readonly noticeSeveralSources: string;
  /** (iv) How to ask it to stop: the mailbox, or `/robot`. */
  readonly noticeStop: string;

  // ── The three outbound links, and nothing else (CA-2.7) ──────────────────
  readonly crawlerLink: string;
  readonly projectLink: string;
  readonly mailboxLink: string;

  /** The other language, in the other language (D-2). */
  readonly otherLanguage: string;
}
