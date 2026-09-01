/**
 * The contract of the document-title namespace: the ONE type both language
 * bundles have to satisfy (SPEC-006 CA-3a). One key per page of the site, so
 * adding a page and forgetting a language is a `npm run typecheck` failure and
 * not an empty tab.
 *
 * IT IS A NAMESPACE OF ITS OWN, AND THAT IS A CRITERION, NOT A PREFERENCE.
 * The parity and presence tests of the project page walk every key of the SITE
 * namespace and assert that `/proxecto` serves it (cases 2 and 5 of
 * `tests/site/pages.test.ts`). A title is the extreme case of the reason the
 * crawler namespace was split off: it is never served in the body of any page,
 * so no presence test over the HTML could ever find it. Keeping it in
 * `SiteBundle` would have meant loosening a barrier of a closed spec.
 *
 * The title is a DATUM, never markup. `SiteDocument` is a root layout and
 * cannot receive anything from the page it wraps, which is exactly why `/robot`
 * used to announce itself as «O proxecto» (F-SPEC-005-1). Each route declares
 * its own through the metadata mechanism of the App Router (ADR-001), and the
 * document shell no longer decides for pages it does not know.
 *
 * CONSEQUENCE THAT THE GATE FROZE ON PURPOSE (SPEC-006, nota 5): from here on,
 * every new page of the site declares its title or has none. There is no
 * inheritance left to cover for it — an empty tab is visible, an inherited and
 * false one is not.
 *
 * Nothing else goes in here. Descriptions, `og:`, `twitter:`, canonicals,
 * `hreflang`, favicon and `sitemap.xml` are out of scope of SPEC-006 by name.
 */

export interface TitlesBundle {
  /** `/proxecto` and `/es/proxecto`. */
  readonly project: string;

  /**
   * `/robot` and `/es/robot`. This is the one the RFGF technician reads: the
   * address travels inside the User-Agent of every request we make, so the tab
   * is the first thing anyone auditing a log sees of us.
   */
  readonly crawler: string;
}
