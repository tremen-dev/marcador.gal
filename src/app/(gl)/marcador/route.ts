/**
 * `/marcador` — the scoreboard in galego (SPEC-018 CA-1.2, ADR-027 §1).
 *
 * It DELEGATES WHOLE in `src/board/handler.ts`. This file holds no logic — a
 * case asserts that it exports nothing but `GET` and `dynamic`, and that it
 * names neither `src/db/`, nor `src/decide/`, nor `src/design/`.
 *
 * IT IS A ROUTE HANDLER AND NOT A PAGE, and that is load-bearing, for the four
 * motives of the panel plus a fifth that is this spec's:
 *
 *   1. A `route.ts` is wrapped by NO layout, so `src/app/globals.css` — which
 *      the two root layouts of the public site import — NEVER LOADS HERE. The
 *      site serves LIGHT by default and ADR-026 §3.6 makes this screen DARK:
 *      under a `page.tsx` the two bases would touch.
 *   2. `next/font` is not available here, so the five faces are self-hosted
 *      under `public/fonts/` with a `@font-face` written in our own sheet,
 *      whose URL a test can read (ADR-026 §3.5).
 *   3. A handler returns a `Response` whose body a test can assert BYTE BY
 *      BYTE — and this is the first screen of the project that CARRIES A
 *      SCRIPT, which is exactly the hole F-SPEC-004-7 describes: over
 *      `renderToStaticMarkup` a `metadata` with `openGraph`, a remote favicon
 *      or a script in a future layout would get in without turning anything
 *      red. Served from here, the barrier sees the whole document.
 *   4. `new Response(...)` is what CA-2.2 asserts the headers on.
 *   5. THE LANGUAGE COMES FROM THE URL AND NOWHERE ELSE (D-2, CA-13.3): this
 *      module names its own locale, so nothing is negotiated with the client
 *      and the response does not depend on who asks (CA-2.4).
 */
import { productionBoardHandler } from '@/board/handler';

export const dynamic = 'force-dynamic';

const handler = productionBoardHandler('gl');

export function GET(request: Request): Promise<Response> {
  return handler(request);
}
