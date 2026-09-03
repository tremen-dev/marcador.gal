/**
 * `/es/admin` — the operator's panel in castellano (SPEC-017 CA-9.2, CA-13; ADR-024 §1).
 *
 * It DELEGATES WHOLE in `src/admin/handler.ts`: the session, the ticket, the
 * composition and the routing live there, provable without a child process.
 * This file holds no logic — a case asserts that it imports nothing of
 * `src/db/`, `src/raw/` or `src/decide/` (CA-13.4). It is the same shape as
 * `src/app/api/cron/ingest/route.ts` and `src/app/api/telegram/webhook/route.ts`.
 *
 * IT IS A ROUTE HANDLER AND NOT A PAGE, and that is load-bearing: a `route.ts`
 * is not wrapped by any layout, so `src/app/globals.css` — which the two root
 * layouts of the public site import — NEVER LOADS ON THIS DOCUMENT. The panel
 * brings its own stylesheet, derived from `src/design/` (ADR-026 §3.1). *
 * F-SPEC-017-2, REVISADO EL 2026-09-03 CON ADR-026 FIRMADO, Y LA RESPUESTA NO
 * CAMBIA: sigue siendo un manejador de ruta y no una página.
 *
 * Bajo ADR-025 §4 el motivo era que `globals.css` no se cargase. Ese motivo
 * SIGUE VIVO —ADR-025 §4.1 está INTACTO (ADR-026 §5) y `src/app/globals.css`
 * no se edita ni se carga— y ahora hay tres más:
 *
 *   1. **ADR-026 §3.6 hace el panel OSCURO-ONLY** y el sitio público sirve
 *      claro por defecto. Bajo una `page.tsx` de `(gl)`/`(es)` el documento
 *      del panel heredaría la hoja del sitio, que es la otra base. Un
 *      `route.ts` no lo envuelve NINGÚN layout, así que las dos bases no se
 *      tocan POR CONSTRUCCIÓN y no por disciplina — que es lo que la entrada 6
 *      del inventario de EPIC-004 describe como el estado bueno.
 *   2. **CA-13.3 y CA-13.4 dejan de poder afirmarse con una página.** Una
 *      `page.tsx` no construye ninguna `Response`, así que «se construye con
 *      `new Response(JSON.stringify(…))` y nunca con `Response.json`» sería un
 *      criterio sin sujeto.
 *   3. **La fuente se autoaloja igual, y de forma más auditable.** `next/font`
 *      necesita el canal de React para inyectar su CSS y no está disponible
 *      aquí; a cambio, las cinco caras se sirven desde `public/fonts/` con un
 *      `@font-face` escrito en nuestra propia hoja, cuya URL un test puede
 *      leer. **El precio, dicho en voz alta:** se pierde la optimización de
 *      `next/font` —el `preload` automático y las métricas de la fuente de
 *      respaldo—, y eso está anotado como hallazgo en el ledger.
 */
import { productionAdminHandler } from '@/admin/handler';

// Every invocation does real work against Postgres and Blob, and it answers a
// person's session: nothing here may be prerendered or cached.
export const dynamic = 'force-dynamic';

const handler = productionAdminHandler('es');

export function GET(request: Request): Promise<Response> {
  return handler(request);
}

export function POST(request: Request): Promise<Response> {
  return handler(request);
}
