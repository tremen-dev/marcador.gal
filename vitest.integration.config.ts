import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * The suites that need real infrastructure: a Neon test branch
 * (`DATABASE_URL_TEST`) and a Vercel Blob store (`BLOB_READ_WRITE_TOKEN`).
 *
 * They are a separate command, not a separate mode, and they FAIL when the
 * credentials are missing. SPEC-001 §Notas para el gate humano §3 and the gate
 * of 2026-08-29 are explicit: without them CA-9 (Blob half) and CA-13..CA-17
 * are UNMET, not skipped. Never make them skip.
 */
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['tests/db/**/*.test.ts', 'tests/raw/blob.contract.test.ts'],
    // A real database and a real object store are on the other side of a
    // network; the default 5 s is not enough for a 300 KB round trip.
    testTimeout: 60_000,
    hookTimeout: 60_000,
    // One file at a time: they share a database and a blob namespace.
    fileParallelism: false,
    typecheck: { enabled: false },
  },
});
