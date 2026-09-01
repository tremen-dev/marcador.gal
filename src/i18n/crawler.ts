/**
 * Resolving a language to its crawler bundle. Same shape as `site.ts`, and a
 * separate namespace for the same reason the type is separate: the presence
 * tests of the project page walk every key of the site namespace.
 *
 * The language comes from the URL, never from the client: `/robot` is galego
 * and `/es/robot` is castellano. Whoever audits a log has to be able to keep
 * the exact address they saw, and `/robot` is the address that travels inside
 * every request we make.
 */
import { es } from './es';
import { gl } from './gl';
import type { CrawlerBundle } from './crawler-bundle';
import type { SiteLocale } from './site-bundle';

const BUNDLES: Record<SiteLocale, CrawlerBundle> = { gl: gl.crawler, es: es.crawler };

export function crawlerBundle(locale: SiteLocale): CrawlerBundle {
  return BUNDLES[locale];
}

export type { CrawlerBundle };
