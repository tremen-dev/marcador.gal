/**
 * The declared User-Agent of the project (RN-11).
 *
 * RN-11 asks for an identified user-agent. "Identified" means two things a
 * site operator can act on: WHO is asking, and WHERE to complain. So the
 * string carries a product token, a version and a contact, and
 * `USER_AGENT_PATTERN` is that requirement written as something a test can
 * fail on — a UA that quietly degrades to `marcador/1.0` stops matching.
 *
 * THE CONTACT IS A URL, AND THE REASON IT USED TO BE A MAILBOX HAS EXPIRED.
 * It was a `mailto:` because «that domain is not contracted, and a contact
 * that does not resolve is worse than none» (F-SPEC-002-1, closed by the gate
 * on 2026-08-31). `marcador.gal` was contracted THAT SAME DAY, so the reason
 * is spent: do not restore the mailbox on the strength of it.
 *
 * RN-11's other half — somewhere to complain — is now met by the page behind
 * the `+`: `/robot` carries the mailbox as a link in its first block, before
 * any section heading, and that is the ONLY thing compensating for the address
 * no longer travelling in the header. If that page ever stops leading with the
 * mailbox, this string stops satisfying RN-11.
 *
 * The purpose is said in plain ASCII words and carries NO repository
 * identifier: what a third party is asked to write in their robots.txt has to
 * stay still, and a spec number rotates. `medicion` has no accent on purpose —
 * HTTP header field values are defined over US-ASCII. The galego, with its
 * accents, lives on the page.
 */

export const USER_AGENT_PRODUCT = 'marcador.gal';
export const USER_AGENT_VERSION = '0.0.1';
export const USER_AGENT_CONTACT = 'https://marcador.gal/robot';

/**
 * `<producto>/<versión> (+<contacto>; <propósito>)`, the shape the crawler
 * conventions of every site in the window expect.
 */
export const USER_AGENT = `${USER_AGENT_PRODUCT}/${USER_AGENT_VERSION} (+${USER_AGENT_CONTACT}; medicion de latencia)`;

/** Product token, dotted version, and a contact that is a URL or a mailto. */
export const USER_AGENT_PATTERN =
  /^[\w.-]+\/\d+\.\d+\.\d+ \(\+(?:https?:\/\/[^\s;)]+|mailto:[^\s;)]+); [^)]+\)$/;
