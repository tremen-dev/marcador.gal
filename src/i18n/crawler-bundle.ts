/**
 * The contract of the crawler namespace: the ONE type both language bundles
 * have to satisfy. Adding a key here and forgetting one language is a
 * `npm run typecheck` failure, not a page with a hole in it.
 *
 * It is a namespace of its own and NOT part of `SiteBundle` on purpose. The
 * parity and presence tests of the project page assert that every key of the
 * site namespace is served by `/proxecto`; folding these keys in there would
 * make that assertion false for text that belongs to another page.
 *
 * The keys are the six checkable claims of the letter to the RFGF, one key
 * each (SPEC-005 CA-6), so that "the page says X" is something a test can ask.
 * The user-agent string itself is NOT here: it is imported from
 * `src/mirror/user-agent.ts`, which is the whole point — a transcription is
 * exactly how the code and the letter drifted apart in the first place.
 *
 * `contact` and `stop` carry the `{mailbox}` placeholder: the address lives in
 * `src/site/contact.ts` and is interpolated. A bundle per language would
 * already be two copies of an address we know is going to move.
 *
 * THERE IS NO DOCUMENT TITLE HERE, AND IT IS NOT A GAP ANY MORE. F-SPEC-005-1
 * —`/robot` inheriting «O proxecto» from the project page— is closed by
 * SPEC-006, and the fix did NOT put the title in this namespace: titles live in
 * `titles-bundle.ts`, on their own, because they are the one kind of text that
 * is never served in the body of a page. `/robot` declares its own through the
 * metadata mechanism of the App Router; `SiteDocument` no longer emits any.
 */

export interface CrawlerBundle {
  readonly heading: string;

  /** First block. What this page is, and who it is for. */
  readonly intro: string;

  /**
   * First block too, and this one is load-bearing. When the mailbox left the
   * User-Agent header, this sentence became the ONLY thing left telling an
   * operator where to ask us to stop (SPEC-005 CA-5).
   */
  readonly contact: string;

  /** Claim 1 — the literal string, which the page imports and never writes. */
  readonly userAgentHeading: string;
  readonly userAgent: string;
  /** Why the first token matters: it is the name a robots.txt group can carry. */
  readonly userAgentNote: string;

  /** Claim 2 — the cap, said as a number and not as an adjective. */
  readonly rateHeading: string;
  readonly rate: string;

  /** Claim 3 — robots.txt is respected always, with no exception. */
  readonly robotsHeading: string;
  readonly robots: string;

  /**
   * Claim 4 — WHAT IS NOT DONE WITH WHAT IS READ.
   *
   * AMENDED ON 2026-09-04 BY SPEC-018 CA-18.2 (ADR-015, ADR-027 §3.c). It used
   * to say «non republicamos os datos de ninguén», «o resultado é un informe
   * interno» and «non hai marcador público», and the three stopped being true
   * the day the scoreboard was published. THE SENTENCE GOES; THE PROMISE IS
   * REBUILT, and what is left is bigger and more auditable than what is
   * retired: no bulk redistribution — no file, no dump, no feed, no API, no
   * widget, no export —, no history, two competitions and only the declared
   * matchdays with their number, four things per match and no more, not one
   * personal datum, no monetisation, and the retention does not move. ANYBODY
   * CAN OPEN THE SCREEN AND CHECK IT IN TEN SECONDS, which is more than could
   * be done with «non republicamos».
   *
   * WHAT WAS NOT ALLOWED, and the ruling closes it twice: narrowing the
   * sentence so the case stays green («non republicamos… salvo unha pantalla
   * de medición»), or reinterpreting it over personal data — which would have
   * been literally true and would have been worse.
   */
  readonly noRepublishHeading: string;
  readonly noRepublish: string;

  /**
   * SPEC-018 CA-2.9 — the link to the scoreboard, from the page a third party
   * audits. `noindex` is not hiding BECAUSE it does not travel alone: the two
   * public pages link the screen, the literals say it exists, and the RFGF is
   * told (ADR-027 §3.a and §3.e).
   */
  readonly scoreboardHeading: string;
  readonly scoreboardLink: string;

  /**
   * SPEC-018 CA-18.2 — THE SILENCE, DECLARED IN A LINE, which is what makes it
   * a position instead of a concealment.
   *
   * The source is still not named, here either: there is no duty of
   * attribution and naming it would be the first disclosure, written and dated
   * by us. So the page says instead that we do not name the sites we read, and
   * that if you think we read yours, you write and we stop.
   */
  readonly noNamesHeading: string;
  readonly noNames: string;

  /**
   * SPEC-018 CA-18.2 — THE PRIVACY LINE. Not a legal notice and not a banner:
   * what the server logs, with what basis, how long it is kept, THAT THERE ARE
   * NO COOKIES, NO ANALYTICS AND NO THIRD PARTIES, and the mailbox for arts.
   * 15-22 GDPR.
   *
   * It goes INSIDE `/robot`, which already carries the block of what is stored
   * and for how long: one honest place, one surface fewer. AND IT NAMES NO
   * NATURAL PERSON, which the barrier of SPEC-007 already watches.
   */
  readonly privacyHeading: string;
  readonly privacy: string;

  /** Claim 5 — what is stored, and for how long. */
  readonly storageHeading: string;
  readonly storage: string;

  /** Claim 6 — how to ask us to stop, and that asking is enough. */
  readonly stopHeading: string;
  readonly stop: string;

  /** The name of the other language, in the other language. */
  readonly otherLanguage: string;
}
