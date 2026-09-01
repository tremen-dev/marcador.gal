import type { NextConfig } from 'next';
import { SITE_REDIRECTS } from './src/site/redirects';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Las direcciones del sitio son permanentes desde el primer día (ADR-010 §5).
  // La lista vive en `src/site/redirects.ts` para que un test pueda leerla.
  redirects: () => Promise.resolve(SITE_REDIRECTS),
};

export default nextConfig;
