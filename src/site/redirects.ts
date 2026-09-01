/**
 * The permanent redirections of the site (SPEC-004 CA-1).
 *
 * They live here and not inline in `next.config.ts` so a test can read them:
 * the promise "these addresses never break" is worth exactly as much as the
 * assertion that checks it.
 *
 * Order matters. The `www` rule goes FIRST: otherwise `/` on `www` would
 * redirect to `/proxecto` without ever leaving `www`, and the apex — the short
 * name that travels in the letter — would stop being the canonical one
 * (ADR-010 §3).
 *
 * `/` is reserved for the product (ADR-010 §5). The day the product takes it,
 * removing the first rule is one line and every link anyone saved still works.
 */
import { PROJECT_PATH, SITE_ORIGIN } from './routes';

export interface SiteRedirect {
  source: string;
  destination: string;
  /** Always true: these are 308, permanent, and that is the whole point. */
  permanent: boolean;
  has?: { type: 'host'; value: string }[];
}

export const SITE_REDIRECTS: SiteRedirect[] = [
  {
    source: '/:path*',
    has: [{ type: 'host', value: 'www.marcador.gal' }],
    destination: `${SITE_ORIGIN}/:path*`,
    permanent: true,
  },
  { source: '/', destination: PROJECT_PATH.gl, permanent: true },
  { source: '/es', destination: PROJECT_PATH.es, permanent: true },
];
