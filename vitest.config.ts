import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
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
