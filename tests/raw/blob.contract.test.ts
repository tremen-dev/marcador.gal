/**
 * CA-9 (Blob half) — the SAME contract battery against a real Vercel Blob
 * store. There is no second battery: `contract.ts` is the only one.
 *
 * This file is NOT part of `npm run test`. It runs with `npm run test:blob`
 * and it FAILS, loudly, when `BLOB_READ_WRITE_TOKEN` is missing. That is the
 * gate's decision of 2026-08-29, verbatim: without credentials the affected
 * criteria are UNMET, not skipped. A suite that is green because it tested
 * nothing is the worst possible outcome of a gate.
 */
import { BlobRawStore } from '@/raw/blob';
import { rawStoreContract } from './contract';

const token = process.env['BLOB_READ_WRITE_TOKEN'];

if (token === undefined || token.length === 0) {
  throw new Error(
    'BLOB_READ_WRITE_TOKEN is missing. SPEC-001 CA-9 requires the contract ' +
      'battery to run against a REAL Vercel Blob store; the gate of 2026-08-29 ' +
      'ruled that without it CA-9 is UNMET, not skipped. Set the variable and ' +
      'run `npm run test:blob` again.',
  );
}

rawStoreContract('BlobRawStore', async () => new BlobRawStore(token));
