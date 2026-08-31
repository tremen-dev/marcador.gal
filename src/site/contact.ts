/**
 * The public mailbox of the project. ONE definition, referenced everywhere
 * (SPEC-004 CA-13): the project page, the crawler page and our own robots.txt
 * all interpolate this constant. It is deliberately NOT in the i18n bundles —
 * a bundle per language would already be two copies of the same address.
 *
 * MIGRATION CONTRACT — READ BEFORE EDITING THE LINE BELOW.
 *
 * `ola@tremen.dev` is provisional. Alberto Fojo decided on 2026-08-31 that in
 * production the mailbox will be some `@marcador.gal` address, and the day it
 * moves this is the single line that changes.
 *
 * When it moves, `ola@tremen.dev` must still be read. The letter already sent
 * to the RFGF quotes it, and so does the User-Agent that third parties have in
 * their logs. If it stops being read, RN-11's "identified user-agent with
 * somewhere to complain" is quietly broken and NO TEST WILL CATCH IT: that
 * happens at a mail provider, outside this repository. Forwarding the old
 * address is part of the migration, not an afterthought (ADR-011).
 */

export const MAILBOX = 'ola@tremen.dev';
