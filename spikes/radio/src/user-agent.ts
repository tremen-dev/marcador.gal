/**
 * The declared User-Agent of the project (RN-11, ADR-011).
 *
 * COPIED BY HAND from `src/polite/user-agent.ts` on 2026-09-12, and said out
 * loud (SPEC-019 §1): the spike cannot import `src/` without dragging the
 * product into a disposable, so the string is copied ONCE, here, with the
 * date. If `src/polite/user-agent.ts` changes, this copy is stale — which is
 * the exception a disposable may allow itself and the product may not.
 */
export const USER_AGENT = 'marcador.gal/0.0.1 (+https://marcador.gal/robot; medicion de latencia)';

/** The product token robots.txt groups are matched against (`marcador.gal`). */
export const USER_AGENT_TOKEN = USER_AGENT.split('/')[0] ?? USER_AGENT;
