/**
 * The `RawStore` port (ADR-005, RN-10).
 *
 * Three operations, two implementations — disk (local and tests) and Vercel
 * Blob (production) — and ONE contract battery that runs against both
 * (`tests/raw/contract.ts`). The raw store is an archive, not a cache: a key
 * already written is never quietly overwritten with different bytes.
 */
import { createHash } from 'node:crypto';
import {
  InvalidRawKeyError,
  RAW_KEY_PATTERN,
  assertValidRawKey,
  assertValidRawPrefix,
} from './key';
import type { RawRef } from './key';

export {
  InvalidRawKeyError,
  RAW_KEY_PATTERN,
  RawRefSchema,
  assertValidRawKey,
  assertValidRawPrefix,
} from './key';
export type { RawRef } from './key';

/** What we know about a raw response, beyond its bytes. */
export interface RawObjectMeta {
  /** The source that answered: `futgal`, `ceroacero`, `corresponsal`… */
  readonly source: string;
  readonly competition_id: string;
  /** ISO 8601 UTC instant at which the response was fetched (ADR-006). */
  readonly fetched_at: string;
  /** Extension of the body: `html`, `json`, … */
  readonly ext: string;
}

export interface RawObject {
  readonly key: RawRef;
  readonly meta: RawObjectMeta;
  readonly body: Uint8Array;
}

export interface RawStore {
  /** Archives a response and returns the reference an Observation carries. */
  put(meta: RawObjectMeta, body: Uint8Array): Promise<RawRef>;
  /** The archived object, or `null` if the key holds nothing. Never throws for absence. */
  get(key: string): Promise<RawObject | null>;
  /** The keys under a prefix, matched at segment boundaries. */
  list(prefix: string): Promise<readonly string[]>;
}

/** Thrown when a key already holds DIFFERENT bytes. The raw store is an archive. */
export class RawKeyConflictError extends Error {
  override readonly name = 'RawKeyConflictError';
  readonly key: string;

  constructor(key: string) {
    super(`raw key ${JSON.stringify(key)} already holds different bytes`);
    this.key = key;
  }
}

/**
 * Derives the key of a raw response (CA-10):
 * `<source>/<competition_id>/<YYYY-MM-DD>/<instant>-<sha256[0..12]>.<ext>`
 *
 * The instant is the ISO 8601 `fetched_at`, lowercased and with `:` turned
 * into `-`, because a key may only contain `[a-z0-9._/-]`.
 */
export function rawKey(meta: RawObjectMeta, body: Uint8Array): RawRef {
  const day = meta.fetched_at.slice(0, 10);
  const instant = meta.fetched_at.toLowerCase().replaceAll(':', '-');
  const digest = createHash('sha256').update(body).digest('hex').slice(0, 12);
  const key = `${meta.source}/${meta.competition_id}/${day}/${instant}-${digest}.${meta.ext}`;

  assertValidRawKey(key);
  if (!RAW_KEY_PATTERN.test(key)) {
    throw new InvalidRawKeyError(key, 'derived key does not match the raw key format');
  }

  return key as RawRef;
}

/**
 * Whether a key belongs under a prefix. Matching is at SEGMENT boundaries, so
 * `futgal/preferente` does not bring `futgal/preferente-b` (CA-9.3).
 */
export function keyHasPrefix(key: string, prefix: string): boolean {
  if (prefix.length === 0) return true;
  if (prefix.endsWith('/')) return key.startsWith(prefix);
  return key === prefix || key.startsWith(`${prefix}/`);
}

/** Validates a prefix and returns it. Kept here so both stores share it. */
export function checkedPrefix(prefix: string): string {
  assertValidRawPrefix(prefix);
  return prefix;
}
