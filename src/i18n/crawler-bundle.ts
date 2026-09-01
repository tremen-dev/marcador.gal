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
 * THERE IS NO `documentTitle` HERE, AND THAT IS A KNOWN GAP, NOT AN OVERSIGHT.
 * `<title>` is emitted by `SiteDocument`, which is a ROOT LAYOUT and therefore
 * cannot receive anything from the page it wraps, so `/robot` inherits the
 * title of the project page. Fixing it means moving `<title>` out of the
 * document shell and into each page — a change to SPEC-004 code that no
 * criterion of SPEC-005 asks for. Recorded as F-SPEC-005-1.
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

  /** Claim 4 — nobody's data is republished. */
  readonly noRepublishHeading: string;
  readonly noRepublish: string;

  /** Claim 5 — what is stored, and for how long. */
  readonly storageHeading: string;
  readonly storage: string;

  /** Claim 6 — how to ask us to stop, and that asking is enough. */
  readonly stopHeading: string;
  readonly stop: string;

  /** The name of the other language, in the other language. */
  readonly otherLanguage: string;
}
