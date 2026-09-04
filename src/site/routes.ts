/**
 * The public URLs of the site, in one place because they are permanent.
 *
 * ADR-010 §5: `/proxecto` and `/robot` —with their `/es` twins— do not move,
 * ever. `/robot` is the harder of the two: it travels inside the User-Agent of
 * every request we make, and third parties copy it into their logs and their
 * robots.txt. Breaking it is not a 404, it is an identity that evaporates.
 *
 * Galego carries no prefix because it is the default (D-2), and the language
 * lives in the URL rather than in client state: the letter has to be able to
 * link one of the two, and whoever audits a log needs to keep the exact
 * address they saw.
 */
import type { SiteLocale } from '@/i18n/site-bundle';

/** The canonical address of the project page. `/` redirects here (308). */
export const PROJECT_PATH: Record<SiteLocale, string> = {
  gl: '/proxecto',
  es: '/es/proxecto',
};

/** The crawler page. Built by SPEC-005; the link to it is SPEC-004 CA-8.5. */
export const CRAWLER_PATH: Record<SiteLocale, string> = {
  gl: '/robot',
  es: '/es/robot',
};

/**
 * The scoreboard (SPEC-018, ADR-027 §1). Public, `noindex, noarchive`, and it
 * shows ONLY the declared measurement matchdays of two competitions.
 *
 * IT DOES NOT CARRY THE PERMANENCE PROMISE OF ADR-010 §5, and that is written
 * on purpose. `/proxecto` and `/robot` never move for a reason this one does
 * not have — `/robot` travels inside the User-Agent of every request we make —
 * so this address CAN move one day. There is NO WRITTEN TRIGGER for moving it:
 * the gate of 2026-09-04 discarded both taking the root now and leaving a
 * trigger to take it later, so moving it needs A NEW DECISION and not a
 * condition being met. `/` keeps redirecting to `/proxecto` (ADR-010 §5,
 * intact).
 *
 * The name is *o marcador* and it is a ruling of `sdd-lingua` with a motive
 * that is not a matter of taste: the bot already promises the correspondent
 * that what they confirm «sae no marcador» (SPEC-015, `hecho`), and *resultado*
 * is the outcome, not what happens in minute 30.
 */
export const SCOREBOARD_PATH: Record<SiteLocale, string> = {
  gl: '/marcador',
  es: '/es/marcador',
};

/**
 * The canonical origin. The apex is the name that travels in the letter, so
 * `www` redirects here and not the other way round (ADR-010 §3).
 */
export const SITE_ORIGIN = 'https://marcador.gal';
