/**
 * The contract of the bot namespace: the ONE type both language bundles have
 * to satisfy (SPEC-015 CA-12.1).
 *
 * Same mechanism as `site`, `crawler`, `titles` and `statuses`: a language
 * missing a key is a `npm run typecheck` failure and not a message with a hole
 * in it. D-2 is a locked decision, and this type is the shape it takes here.
 *
 * THE TEXT WAS NOT IMPROVISED. Every value of `gl.ts` and `es.ts` under this
 * namespace comes from the ruling of `sdd-lingua` of 2026-09-02, copied whole
 * into `docs/epicas/EPIC-002-…/dictamenes-SPEC-015.md`. Its §5 lists the traps
 * of galego in this domain — clitic placement after a negation, `estar a` +
 * infinitive, `gol` and not `golo`, `aprazado` and not `adiado` — and the
 * ruling is the reference, not this header.
 *
 * THE REGISTER, from §1 of the same ruling: tuteo, verb first, one idea per
 * message, no greeting, no farewell, no decorative emoji. The impersonal voice
 * for facts of the system («Quedou rexistrado»), the first person singular for
 * the bot's own acts of understanding («Non entendín»). The institutional «nós»
 * belongs to the public site, where the project speaks; here the machine does.
 *
 * WHY THE COMMAND DESCRIPTIONS AND THE BOT'S OWN CARD ARE HERE. They are text
 * a person reads, so D-2 reaches them: `setMyCommands` is registered from this
 * bundle for `gl` and `es`, and the description and «about» of the bot are
 * written from here and not by hand in BotFather (ADR-022 §8, CA-12.3).
 *
 * WHAT IS NOT HERE: the five match statuses, which live in their own shared
 * namespace (`statuses-bundle.ts`) so that the bot and the scoreboard cannot
 * drift apart; and the canonical names of teams and competitions, which are
 * NEVER translated and are interpolated as the RFGF writes them (`dominio.md`).
 */

/**
 * The bot's language. It is `SiteLocale` under another name, and the alias is
 * deliberate: the site's type is named after a URL prefix and the bot has no
 * URL, so calling it `SiteLocale` here would read wrong. RENAMING IT WOULD
 * TOUCH TWO CLOSED SPECS (SPEC-004, SPEC-006), so it is an alias and the
 * rename goes to EPIC-MEJORA (ruling of `sdd-lingua` §3).
 */
export type { SiteLocale as BotLocale } from './site-bundle';

export interface BotBundle {
  // ── The bot's own card, visible to anyone who opens it (CA-12.3) ──────────
  /** BotFather's `description`: what shows before anyone presses Start. */
  readonly botDescription: string;
  /** BotFather's `about`: the short line on the profile. */
  readonly botAbout: string;

  // ── The descriptions of `setMyCommands` (CA-12.3, CA-12.4) ───────────────
  // The command names themselves are `src/bot/commands.ts`: they are not text
  // in any language, Telegram restricts them to `a-z0-9_`, and NONE of the
  // correct galego forms needs an accent (ruling §2).
  readonly cmdStart: string;
  readonly cmdHelp: string;
  readonly cmdMatches: string;
  readonly cmdCancel: string;
  readonly cmdLanguage: string;
  readonly cmdPrivacy: string;
  readonly cmdOptOut: string;
  readonly cmdStop: string;

  // ── `/start` (ruling §3.1) ────────────────────────────────────────────────
  readonly startWho: string;
  readonly startWhat: string;
  readonly startNotPublished: string;
  readonly startHelpHint: string;

  // ── The art. 13 notice (CA-14.1, CA-14.3; ADR-023 §5) ────────────────────
  // One key per element the article demands, so that «the notice says X» is
  // something a test can ask, and so that a missing element is visible.
  /** Who is responsible and how to reach them (art. 13.1.a and 13.1.b). */
  readonly noticeController: string;
  /** What is processed (art. 13, the object). */
  readonly noticeWhat: string;
  /** What for (art. 13.1.c, purpose). */
  readonly noticePurpose: string;
  /** The legal basis, which is NOT consent (ADR-023 §4). */
  readonly noticeLegalBasis: string;
  /** That the text is sent to an AI provider so it can be interpreted. */
  readonly noticeAiProvider: string;
  /** How long it is kept (ADR-023 §2), and that the provider's term is not ours. */
  readonly noticeRetention: string;
  /** The rights, and how they are exercised here (arts. 13.2.b, 17, 21). */
  readonly noticeRights: string;
  /**
   * WHAT DOES NOT NEED TO BE SENT — names of players, of referees, health
   * data. It is the only mitigation possible over free text, and it is a key
   * of the bundle and not a comment (ADR-023 §5, CA-14.3).
   */
  readonly noticeDoNotSend: string;
  /** The link to the full page (CA-14.1, CA-14.4). */
  readonly noticeLink: string;

  // ── `/axuda` (ruling §3.2) ───────────────────────────────────────────────
  readonly helpIntro: string;
  readonly helpExamples: string;
  /** Home team first. It is where a misunderstanding produces an inverted datum. */
  readonly helpOrder: string;
  readonly helpIfWrong: string;
  readonly helpCommands: string;

  // ── While the free message is being read (ruling §3.3) ────────────────────
  readonly parsing: string;

  // ── The confirmation card (ruling §3.4, CA-7.6) ──────────────────────────
  readonly cardHeading: string;
  readonly cardScoreLabel: string;
  readonly cardMinuteLabel: string;
  /** The label of the state. The VALUE comes from the `statuses` namespace. */
  readonly cardStatusLabel: string;
  readonly cardConfirm: string;
  readonly cardDiscard: string;
  readonly cardHint: string;
  readonly cardExpired: string;

  // ── The acknowledgements (ruling §3.5) ───────────────────────────────────
  readonly ackRegistered: string;
  /**
   * RN-08 said in words someone standing on a touchline understands. It does
   * NOT name the «motor de decisións»: that is internal jargon and `dominio.md`
   * has no galego form for it (CA-12.7).
   */
  readonly ackNotPublication: string;
  readonly ackDiscarded: string;

  // ── `/lingua` (CA-11.3) ──────────────────────────────────────────────────
  readonly languagePrompt: string;
  readonly languageGalego: string;
  readonly languageCastelan: string;
  readonly languageChanged: string;

  // ── `/partidos` ──────────────────────────────────────────────────────────
  readonly openMatchesHeading: string;

  // ── `/baixa` (CA-14.5, CA-14.6) ──────────────────────────────────────────
  /**
   * WHAT HAS BEEN ERASED AND WHAT HAS NOT, without dressing it up: no more
   * messages are accepted, what is already recorded is not deleted (RN-13),
   * and erasing the mapping is an act of the operator with a written
   * acknowledgement (ADR-023 §4). Promising what the system does not do is a
   * product defect, not a translation one.
   */
  readonly optOutDone: string;

  // ── Errors (ruling §3.6) ─────────────────────────────────────────────────
  /**
   * The SAME string for the three cases of CA-2.2 — not mapped, not active,
   * opted out — so the bot neither confirms nor denies who is a correspondent.
   */
  readonly errNotAuthorised: string;
  readonly errNotUnderstood: string;
  readonly errMatchNotFound: string;
  readonly errAmbiguous: string;
  /** It does NOT promise the message was kept: there is no retry (ruling §3.6). */
  readonly errServiceDown: string;
  /**
   * Also the neutral phrase of CA-13.1, outside a declared matchday. It says
   * the truth and nothing else: there is no open match right now.
   */
  readonly errNoOpenMatch: string;
  readonly errNothingPending: string;
}
