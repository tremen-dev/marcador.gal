/**
 * Resolving a language to the five match statuses (SPEC-015 CA-12.5).
 *
 * Same shape as `site.ts`, `crawler.ts` and `titles.ts`. The language never
 * comes from the client (ADR-022 §8): in the site it comes from the URL, and
 * in the bot from the correspondent's stored preference.
 */
import { es } from './es';
import { gl } from './gl';
import type { SiteLocale } from './site-bundle';
import type { StatusesBundle } from './statuses-bundle';

const BUNDLES: Record<SiteLocale, StatusesBundle> = { gl: gl.statuses, es: es.statuses };

export function statusesBundle(locale: SiteLocale): StatusesBundle {
  return BUNDLES[locale];
}

export type { StatusesBundle };
