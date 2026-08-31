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
 * The canonical origin. The apex is the name that travels in the letter, so
 * `www` redirects here and not the other way round (ADR-010 §3).
 */
export const SITE_ORIGIN = 'https://marcador.gal';
