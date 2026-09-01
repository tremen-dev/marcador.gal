/**
 * The umbrella this project puts itself under: the public URL of tremen.dev.
 *
 * CONTRACT — READ BEFORE EDITING THE LINE BELOW.
 *
 * This site names no person and does not say how many there are (SPEC-007
 * CA-1, ADR-012 §1), so the umbrella it shelters under has to be something a
 * reader can go and look at: a name that is written and not linked is half a
 * sentence. And the only thing this URL owes anyone is exactly one thing:
 * that it resolves. It is not asked to identify anybody, because that would
 * tie the text of this site to somebody publishing a legal notice on another.
 *
 * If this link ever breaks, the one that answers is the mailbox, and
 * THE MAILBOX IS NOT TO BE TOUCHED (ADR-012 §3). Dropping the name is only
 * acceptable while there is somewhere to write: RN-11 asks for somewhere to
 * complain, not somewhere to browse, and with no name on the page the mailbox
 * is the only thing left that satisfies it. Whoever moves the mailbox is
 * undoing the decision that let the name go — not making an unrelated edit.
 *
 * And no test in this repository can tell you whether this URL still answers:
 * that happens on a host this repository does not control, and a test that
 * depended on a third party's network would be an intermittent red in a suite
 * with no CI. It is the verifier who checks it, against the deployment.
 *
 * This does NOT live in `site/contact.ts`: case 4 of `tests/site/contact.test.ts`
 * asserts that module exports the mailbox and nothing else, and turning it
 * into a drawer would knock over a barrier of SPEC-004 instead of modulating
 * it (SPEC-007 CA-2.2).
 */

export const UMBRELLA_URL = 'https://tremen.dev';
