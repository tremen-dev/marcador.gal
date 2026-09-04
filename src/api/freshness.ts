/**
 * THE TWO NUMBERS OF THE REFRESH, IN ONE PLACE (SPEC-018 CA-7.4, ADR-027 §7.3,
 * ADR-003).
 *
 * They are CHOSEN, NOT MEASURED, exactly like `PRE`/`POST` (ADR-019 §2), the
 * 6 h of a `robots.txt` (ADR-014 §3.2) and `TOUCH_TARGET_PX` (ADR-025 §3).
 * They live here as named constants so that revising them with the evidence of
 * the first matchday in front is a one-line diff and not an arbitration, and
 * NOTHING ELSE IN THE REPOSITORY MAY REPEAT THEM — a case asserts it, and the
 * legend of the screen INTERPOLATES `REFRESH_SECONDS` instead of writing it.
 *
 * WHY 30 s: ADR-003 wrote it in 2026-08-29 («fallback a polling del snapshot
 * cada 30 s con ETag») and this ADR lands it without superseding. It is half
 * the rhythm of the tick, which is 1 request/minute per competition (RN-11):
 * polling faster than the data can change buys nothing, and polling slower
 * makes the screen older than the base for no reason.
 *
 * WHY 10 s OF SHARED CACHE: ADR-003 wrote that too («cacheable en CDN 10 s»).
 * It is a THIRD of the refresh interval, so a reader almost never sees a body
 * older than one poll, and `N` browsers refreshing every half minute do not
 * become `N` projections against a base that is ingesting at the same time —
 * AND THE INGEST HAS PRIORITY OVER THE SCREEN, because with no `Decision`
 * there is nothing to show.
 *
 * The cache is SHARED (`s-maxage`) and never `private` and never `no-store`,
 * and it can be, because THE RESPONSE DOES NOT DEPEND ON WHO ASKS (CA-2.4):
 * no session, no cookie, no `Accept-Language`, no client header. The language
 * comes from the URL.
 */

/**
 * THE ONE ADDRESS THE REFRESH ASKS FOR, and it is a RELATIVE PATH OF THIS SAME
 * ORIGIN (CA-1.5). The page loads nothing from any host that is not its own —
 * no font, no script, no stylesheet, no analytics — and its only outgoing
 * request is this one.
 *
 * IT IS NOT DOCUMENTED ANYWHERE (ADR-027 §3.a): it does not appear in
 * `src/i18n/`, it does not appear in `src/site/`, and no page links it. It
 * exists BECAUSE THE SCREEN USES IT, which is why the served document names it
 * exactly once — inside the `fetch` of the refresh script — and never as an
 * `<a href>` or as prose.
 */
export const BOARD_API_PATH = '/api/board';

/** How often the browser asks it again. Chosen, not measured. */
export const REFRESH_SECONDS = 30;

/** How long a shared cache may serve the same body. Chosen, not measured. */
export const SHARED_CACHE_SECONDS = 10;

/**
 * The `Cache-Control` every route of this spec serves. Written once, derived
 * from the constant above: a second spelling of the number is exactly what
 * CA-7.4 forbids.
 */
export const BOARD_CACHE_CONTROL = `public, s-maxage=${SHARED_CACHE_SECONDS}, stale-while-revalidate=${SHARED_CACHE_SECONDS}`;

/**
 * `noindex, noarchive`, AND DELIBERATELY NO `nofollow` (ADR-027 §3.a).
 *
 * `noindex` is not hiding, it is not competing: the letter to the RFGF builds
 * its hook on a search where «eight private aggregators appear and no league
 * links to futgal.es», and the day `marcador.gal/marcador` is the ninth result
 * of that search the argument turns against whoever signed it.
 *
 * `nofollow` IS RETIRED. In public it would tell a crawler not to follow this
 * page's outbound links — and the only ones there are are `/robot` and
 * `/proxecto`, precisely the page that travels inside our `User-Agent`
 * (ADR-011) and that we WANT a third party to reach.
 *
 * `noarchive` IS ADDED, and it is a hole that only appears on publishing: a
 * public page gets archived by third parties, and that archive outlives our
 * two matchdays and our 30 days of retention. It is not enforceable against
 * the Internet Archive — said plainly — and what really bounds it is that what
 * is archivable be minimal (ADR-027 §3.b and §10).
 *
 * AND `robots.txt` GAINS NO `Disallow`: a `Disallow` would DEFEAT the
 * `noindex`, because without crawling the search engine never reads it.
 */
export const BOARD_ROBOTS = 'noindex, noarchive';
