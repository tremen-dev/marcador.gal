import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['tests/**/*.test.ts'],
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
