/**
 * The two facts the privacy line of `/robot` cannot be honest without: WHO
 * processes the technical access log, and FOR HOW LONG (SPEC-018 CA-18.2,
 * F-SPEC-018-V4; GDPR arts. 13.1.e and 13.2.a).
 *
 * They live here and NOT in the i18n bundles for the same reason the mailbox
 * lives in `site/contact.ts`: a bundle per language would already be two copies
 * of one fact that is going to move. The literals carry `{provider}` and
 * `{retention}` and the page interpolates them.
 *
 * WHY THE PROVIDER IS NAMED AND NOT DESCRIBED. It used to say «the server this
 * is hosted on», which names nobody. A processor IS a recipient (GDPR arts. 4.9
 * and 13.1.e), a paraphrase is not a category — there is exactly one — and,
 * above all, THE NAME IS AUDITABLE FROM OUTSIDE and the paraphrase is not.
 * ADR-012 §1 does not reach it: what it forbids is naming a NATURAL PERSON,
 * saying how many there are and under what legal form, all three about whoever
 * is behind the project. This is a third-party company.
 *
 * MIGRATION CONTRACT — READ BEFORE EDITING EITHER LINE BELOW.
 *
 * 1. CHANGING THE HOSTING PLATFORM MEANS CHANGING THIS FILE IN THE SAME CHANGE.
 *    Both values are properties of the platform, not of this repository, and
 *    NO TEST CAN SEE THAT THEY WENT STALE: the assertions of
 *    `tests/site/crawler-page.test.ts` prove the words are written, never that
 *    they are true. A published retention period that is no longer real is the
 *    same defect the RED of 2026-09-04 found, with a longer fuse.
 * 2. THE RETENTION IS THE ONE THE PROVIDER FIXES, and it is theirs to change.
 *    It is checked against their published plan limits, and the day the plan
 *    moves — or a log drain is added, which multiplies it — this line is what
 *    has to move with it. That check is in
 *    `docs/procedimientos/calendario-de-compromisos.md` because nobody is going
 *    to find out in red.
 * 3. IT IS SAID IN HOURS AND NOT IN DAYS on purpose: the day count is one, and
 *    «1 días» is what a placeholder plus a plural noun would produce.
 */

/** The processor of the access log, written the way the company writes it. */
export const HOSTING_PROVIDER = 'Vercel';

/** How long the provider keeps that log. Same string in both languages. */
export const ACCESS_LOG_RETENTION = '24 horas';

/**
 * Fills the two hosting slots of an i18n literal. Plain text and not a node:
 * unlike the mailbox, neither of these is a link, and nothing on this page
 * should invite anybody to go anywhere else to read what it already says.
 */
export function withHosting(value: string): string {
  return value
    .replaceAll('{provider}', HOSTING_PROVIDER)
    .replaceAll('{retention}', ACCESS_LOG_RETENTION);
}
