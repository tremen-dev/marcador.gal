/**
 * The contract of the site namespace: the ONE type both language bundles have
 * to satisfy (SPEC-004 CA-4a). Adding a key here and forgetting one language
 * is a `npm run typecheck` failure, not a page with a hole in it.
 *
 * The keys are the assertions SPEC-004 CA-8 requires the project page to make,
 * one key each, so that "the page says X" is something a test can ask.
 *
 * `about` carries the `{mailbox}` placeholder on purpose: the address lives in
 * `src/site/contact.ts` and is interpolated (CA-13). A bundle per language
 * would already be two copies of an address we know is going to move.
 */

/** Galego has no prefix because it is the default (D-2); castellano lives under `/es`. */
export type SiteLocale = 'gl' | 'es';

export interface SiteBundle {
  /** `<title>`: visible in the tab and in a search result. */
  readonly documentTitle: string;
  readonly heading: string;

  /** CA-8.1 — three or four sentences. A test counts them. */
  readonly aboutHeading: string;
  readonly about: string;

  /** CA-8.2 — latencia, cobertura, conflictos, minutos de operación manual. */
  readonly measuringHeading: string;
  readonly measuring: string;

  /** CA-8.3 — para decidir si es viable; el resultado es un informe interno. */
  readonly purposeHeading: string;
  readonly purpose: string;

  /** CA-8.4 — todavía no hay producto, sin fecha y sin condicional. */
  readonly noProductHeading: string;
  readonly noProduct: string;

  /** CA-8.5 — el enlace a `/robot`, la página del rastreador (SPEC-005). */
  readonly crawlerHeading: string;
  readonly crawlerLink: string;

  /** CA-3 — el nombre de la otra lengua, en la otra lengua. */
  readonly otherLanguage: string;
}
