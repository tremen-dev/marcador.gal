/**
 * Resolving a language to its document titles. Same shape as `site.ts` and
 * `crawler.ts`, and a separate namespace for the same reason the type is
 * separate: the presence tests of the project page walk every key of the site
 * namespace, and a title is never served in the body of any page.
 *
 * The language comes from the URL, never from the client: `/proxecto` and
 * `/robot` are galego, `/es/proxecto` and `/es/robot` are castellano (D-2).
 * Each route module names its own locale, so nothing is resolved at runtime
 * and there is no language negotiation.
 */
import { es } from './es';
import { gl } from './gl';
import type { SiteLocale } from './site-bundle';
import type { TitlesBundle } from './titles-bundle';

const BUNDLES: Record<SiteLocale, TitlesBundle> = { gl: gl.titles, es: es.titles };

export function titlesBundle(locale: SiteLocale): TitlesBundle {
  return BUNDLES[locale];
}

export type { TitlesBundle };
