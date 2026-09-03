/**
 * The contract of the panel's namespace: the ONE type both language bundles
 * have to satisfy (SPEC-017 CA-9.1, CA-9.7).
 *
 * Same mechanism as `site`, `crawler`, `titles`, `statuses` and `bot`: a
 * language missing a key is a `npm run typecheck` failure and not a screen
 * with a hole in it. D-2 is a locked decision and this type is the shape it
 * takes here — PARITY IS IMPOSED BY THE TYPE, never by a test that counts keys
 * (CA-9.7).
 *
 * THE REGISTER is the bot's, and for the same reason: tuteo, verb first, one
 * idea per line, no greeting, no farewell, no decorative emoji. The impersonal
 * voice for facts of the system, the second person for what the operator does.
 * The reader here is one person of the project, not the federation, so
 * `sdd-lingua` did not rule on this text and the spec does not declare its
 * ruling blocking (SPEC-017 §Usuarios). What DID need the glossary is the four
 * qualifiers, and they are in `dominio.md` since 2026-09-03.
 *
 * WHAT IS NOT HERE:
 *
 *   * THE FIVE MATCH STATUSES, which live in their own shared namespace
 *     (`statuses-bundle.ts`) so that the bot, the panel and the scoreboard
 *     cannot drift apart. The panel does not keep a second set (CA-9.5);
 *   * THE FOUR QUALIFIERS, which live in the `qualifiers` namespace of `gl.ts`
 *     and — since this spec — of `es.ts` too. The panel is the first artefact
 *     of the real system that shows a person a qualifier, which is the trigger
 *     SPEC-015 left written (CA-9.6);
 *   * THE CANONICAL NAMES of teams and competitions, which are NEVER
 *     translated and are interpolated as the RFGF writes them (`dominio.md`).
 */

/**
 * The panel's language. It is `SiteLocale` under another name, as `BotLocale`
 * is: the panel HAS a URL prefix — `/admin` and `/es/admin` — so here the
 * alias is even closer to the original (CA-9.2).
 */
export type { SiteLocale as AdminLocale } from './site-bundle';

export interface AdminBundle {
  // ── The document, and the way in ─────────────────────────────────────────
  readonly title: string;
  readonly accessHeading: string;
  readonly accessOperator: string;
  readonly accessSecret: string;
  readonly accessSubmit: string;
  readonly accessRefused: string;

  // ── The board ────────────────────────────────────────────────────────────
  readonly boardHeading: string;
  /** Shown when no matchday is declared: the panel is born off (CA-11.1). */
  readonly boardEmpty: string;
  readonly boardMatch: string;
  readonly boardStatus: string;
  readonly boardScore: string;
  readonly boardQualifier: string;
  readonly boardLastSeen: string;
  readonly boardOpenAlerts: string;
  readonly boardNever: string;
  readonly boardNoDecision: string;
  readonly boardDetail: string;

  // ── The detail of one match ──────────────────────────────────────────────
  readonly detailHeading: string;
  readonly detailObservations: string;
  readonly detailDecisions: string;
  readonly detailSource: string;
  readonly detailConfidence: string;
  readonly detailObservedAt: string;
  readonly detailVersion: string;
  readonly detailRule: string;
  readonly detailSupport: string;
  readonly detailBack: string;

  // ── The operations ───────────────────────────────────────────────────────
  readonly formCorrection: string;
  readonly formStatusChange: string;
  readonly formRatify: string;
  readonly formStatus: string;
  readonly formHomeScore: string;
  readonly formAwayScore: string;
  readonly formReason: string;
  readonly formReasonHint: string;
  readonly formSubmit: string;
  readonly formCancel: string;

  // ── The tray ─────────────────────────────────────────────────────────────
  readonly trayHeading: string;
  readonly trayOpen: string;
  readonly trayAcknowledged: string;
  readonly trayEmpty: string;
  readonly trayAcknowledge: string;
  readonly trayReason: string;
  readonly trayRaisedAt: string;
  readonly trayNotPublished: string;

  // ── What the panel answers ───────────────────────────────────────────────
  readonly ackPublished: string;
  readonly ackAcknowledged: string;
  readonly errEmptyReason: string;
  readonly errOutOfMatchday: string;
  readonly errUnknownAlert: string;
  readonly errNothingToRatify: string;
  readonly errTicketMalformed: string;
  readonly errTicketTampered: string;
  readonly errTicketOtherOperator: string;
  readonly errTicketExpired: string;
  readonly errSessionExpired: string;
}
