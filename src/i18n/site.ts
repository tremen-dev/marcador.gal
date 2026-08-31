/**
 * Resolving a language to its site bundle. Hand-written on purpose: two
 * languages and three routes do not justify a dependency, and adding one would
 * be a stack decision over ADR-001 and therefore material for an ADR (SPEC-004
 * §Diseño 4).
 *
 * The language comes from the URL, never from the client: `/proxecto` is
 * galego and `/es/proxecto` is castellano. That is D-2 turned into structure —
 * the letter can link either one, an auditor can keep the exact address they
 * saw, and nothing depends on JavaScript.
 */
import { es } from './es';
import { gl } from './gl';
import type { SiteBundle, SiteLocale } from './site-bundle';

/** Galego first: it is the default (D-2). */
export const SITE_LOCALES: readonly SiteLocale[] = ['gl', 'es'];

const BUNDLES: Record<SiteLocale, SiteBundle> = { gl: gl.site, es: es.site };

export function siteBundle(locale: SiteLocale): SiteBundle {
  return BUNDLES[locale];
}

/** The other language, which is the one the cross link offers. */
export function otherLocale(locale: SiteLocale): SiteLocale {
  return locale === 'gl' ? 'es' : 'gl';
}

export type { SiteBundle, SiteLocale };
