/**
 * The declared User-Agent of the project (RN-11).
 *
 * RN-11 asks for an identified user-agent. "Identified" means two things a
 * site operator can act on: WHO is asking, and WHERE to complain. So the
 * string carries a product token, a version and a contact, and
 * `USER_AGENT_PATTERN` is that requirement written as something a test can
 * fail on — a UA that quietly degrades to `marcador/1.0` stops matching.
 *
 * The contact is a mailbox that is read, chosen over a repository URL because
 * RN-11 wants a site operator to have somewhere to complain, not somewhere to
 * browse. It is deliberately not on marcador.gal: that domain is not contracted
 * yet, and a contact that does not resolve is worse than none (F-SPEC-002-1,
 * closed by the gate on 2026-08-31).
 */

export const USER_AGENT_PRODUCT = 'marcador.gal';
export const USER_AGENT_VERSION = '0.0.1';
export const USER_AGENT_CONTACT = 'mailto:ola@tremen.dev';

/**
 * `<producto>/<versión> (+<contacto>; <propósito>)`, the shape the crawler
 * conventions of every site in the window expect.
 */
export const USER_AGENT = `${USER_AGENT_PRODUCT}/${USER_AGENT_VERSION} (+${USER_AGENT_CONTACT}; medicion SPEC-002, RN-11)`;

/** Product token, dotted version, and a contact that is a URL or a mailto. */
export const USER_AGENT_PATTERN =
  /^[\w.-]+\/\d+\.\d+\.\d+ \(\+(?:https?:\/\/[^\s;)]+|mailto:[^\s;)]+); [^)]+\)$/;
