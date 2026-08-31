import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Vitest has no Next in front of it, so it needs the JSX runtime spelled out
  // to be able to render the site's routes to a string (SPEC-004 CA-2, CA-3).
  // Explicit and not inherited from tsconfig on purpose: `next build` rewrites
  // that field on its own, and the suite should not move when it does.
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    include: ['tests/**/*.test.ts'],
    // The suites that need real credentials are NOT here, and they are not
    // skipped either: they live in `vitest.integration.config.ts` and fail
    // loudly without them (`npm run test:db`, `npm run test:blob`). The gate of
    // 2026-08-29 ruled that without credentials the affected criteria are
    // UNMET, not skipped — so they must never make this suite green by silence.
    exclude: ['**/node_modules/**', 'tests/db/**', 'tests/raw/blob.contract.test.ts'],
    // CA-3, CA-4, CA-6: los invariantes se prueban a nivel de TIPO. Los ficheros
    // .test-d.ts usan @ts-expect-error: si el invariante deja de sostenerse, la
    // directiva queda sin usar y tsc falla. Es la prueba invertida.
    typecheck: {
      enabled: true,
      include: ['tests/**/*.test-d.ts'],
      tsconfig: './tsconfig.json',
    },
  },
});
