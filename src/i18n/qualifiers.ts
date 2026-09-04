/**
 * Resolving a language to the four score qualifiers (SPEC-018 CA-13.4).
 *
 * Same shape as `statuses.ts`, `site.ts`, `crawler.ts` and `titles.ts`. The
 * language never comes from the client: in the site and in the scoreboard it
 * comes from the URL (D-2, ADR-027 §3.a).
 *
 * `src/i18n/admin.ts` consumes this module since SPEC-018, so there is ONE
 * resolver for the four words and the panel keeps no copy of its own.
 */
import { es } from './es';
import { gl } from './gl';
import type { QualifiersBundle } from './qualifiers-bundle';
import type { SiteLocale } from './site-bundle';

const BUNDLES: Record<SiteLocale, QualifiersBundle> = { gl: gl.qualifiers, es: es.qualifiers };

export function qualifiersBundle(locale: SiteLocale): QualifiersBundle {
  return BUNDLES[locale];
}

export type { QualifiersBundle };
