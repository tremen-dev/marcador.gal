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
 *
 * THE DOCUMENT TITLE IS NOT HERE ANY MORE (SPEC-006 CA-3c). It moved to
 * `titles-bundle.ts`, its own namespace, because every key of THIS one is
 * asserted to be served in the body of `/proxecto` —cases 2 and 5 of
 * `tests/site/pages.test.ts`— and a title never is. Keeping it here would have
 * meant loosening a barrier of a spec that is already closed.
 */

/** Galego has no prefix because it is the default (D-2); castellano lives under `/es`. */
export type SiteLocale = 'gl' | 'es';

export interface SiteBundle {
  readonly heading: string;

  /**
   * CA-8.1 — three or four sentences. A test counts them.
   *
   * It no longer names a person: SPEC-007 CA-1 modulates that half of SPEC-004
   * CA-7 and CA-8.1 (ADR-012 §1). It still names tremen.dev in prose.
   */
  readonly aboutHeading: string;
  readonly about: string;

  /**
   * SPEC-007 CA-2.1 — the visible label of the link to the umbrella. The URL
   * itself is NOT here: it lives in `src/site/umbrella.ts`, one definition,
   * with the contract written in its header. This key is only the text a
   * reader clicks, which is exactly the thing that has to be translated (D-2).
   */
  readonly umbrellaLink: string;

  /**
   * CA-8.2 — what is being measured. SPEC-007 CA-4 modulates it: the general
   * object of the study, with no competition named and no metric enumerated.
   * CA-5 keeps the robots.txt clause, which is what makes the page reinforce
   * the letter instead of contradicting it.
   */
  readonly measuringHeading: string;
  readonly measuring: string;

  /** CA-8.3 — para decidir si es viable; el resultado es un informe interno. */
  readonly purposeHeading: string;
  readonly purpose: string;

  /**
   * CA-8.4 — todavía no hay producto, sin fecha y sin condicional.
   *
   * ENMENDADO EL 2026-09-04 POR SPEC-018 CA-18.1 (ADR-015, ADR-027 §3.c).
   * Dejaba de ser cierto el día que el marcador se publicase: decía «nin
   * marcador público». Pasa a decir que la pantalla existe, dónde está, que
   * enseña sólo las jornadas declaradas de DOS competiciones, que es un
   * instrumento de medida, que normalmente irá provisional y con atraso, y que
   * se apaga cuando la medición acaba.
   *
   * LO QUE NO PUEDE CAMBIAR, PORQUE ES DE CARGA: «no hay aplicación, ni cuenta
   * que crear» sigue siendo verdad y es exactamente lo que mantiene el art. 10
   * LSSI fuera. Quien edite este literal tiene que saber que esa mitad no es
   * prosa sobrante.
   */
  readonly noProductHeading: string;
  readonly noProduct: string;

  /**
   * SPEC-018 CA-2.9 — el enlace a la pantalla del marcador.
   *
   * NO ES NAVEGACIÓN: es lo que convierte `noindex` en NO-AMPLIFICACIÓN en vez
   * de en OCULTACIÓN. Publicar, no indexar y no enlazar sería esconderse, y
   * leería fatal al lado de la carta a la RFGF. Enlazarla NO dispara el
   * re-dictamen (ADR-027 §3.d, punto 4): es obligatorio.
   */
  readonly scoreboardHeading: string;
  readonly scoreboardLink: string;

  /** CA-8.5 — el enlace a `/robot`, la página del rastreador (SPEC-005). */
  readonly crawlerHeading: string;
  readonly crawlerLink: string;

  /** CA-3 — el nombre de la otra lengua, en la otra lengua. */
  readonly otherLanguage: string;
}
