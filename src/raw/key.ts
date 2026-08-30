/**
 * Raw store key format and safety validation (SPEC-001 CA-10, CA-12).
 *
 * This module is deliberately dependency-free: `src/model` imports the
 * `RawRef` schema from here, so it must not import anything from the model
 * (no cycle) and must not touch Node built-ins (it travels to the client with
 * the model types).
 */
import { z } from 'zod';

/** Characters a raw key may contain. Anything else is an escape attempt. */
const RAW_KEY_CHARSET = /^[a-z0-9._/-]+$/;

/**
 * Full key shape:
 * `<source>/<competition_id>/<YYYY-MM-DD>/<fetched_at ISO>-<sha256[0..12]>.<ext>`
 *
 * The ISO instant is normalised to the key charset: lowercased and with `:`
 * replaced by `-`, because CA-10 forbids characters outside `[a-z0-9._/-]`
 * and an ISO 8601 string contains `T`, `Z` and `:`.
 */
export const RAW_KEY_PATTERN =
  /^[a-z0-9._-]+\/[a-z0-9._-]+\/\d{4}-\d{2}-\d{2}\/\d{4}-\d{2}-\d{2}t\d{2}-\d{2}-\d{2}(?:\.\d{1,9})?z-[0-9a-f]{12}\.[a-z0-9]+$/;

/** Thrown before any I/O when a key or prefix could escape the store. */
export class InvalidRawKeyError extends Error {
  override readonly name = 'InvalidRawKeyError';
  readonly key: string;

  constructor(key: string, reason: string) {
    super(`invalid raw key ${JSON.stringify(key)}: ${reason}`);
    this.key = key;
  }
}

function assertSafeSegmentText(value: string, label: string): void {
  if (value.includes('..')) {
    throw new InvalidRawKeyError(value, `${label} must not contain ".."`);
  }
  if (value.startsWith('/')) {
    throw new InvalidRawKeyError(value, `${label} must not start with "/"`);
  }
  if (value.includes('\\')) {
    throw new InvalidRawKeyError(value, `${label} must not contain a backslash`);
  }
  if (!RAW_KEY_CHARSET.test(value)) {
    throw new InvalidRawKeyError(value, `${label} must match [a-z0-9._/-]`);
  }
}

/** Validates a full key. Throws `InvalidRawKeyError`; never touches I/O. */
export function assertValidRawKey(key: string): void {
  if (key.length === 0) {
    throw new InvalidRawKeyError(key, 'key must not be empty');
  }
  assertSafeSegmentText(key, 'key');
}

/**
 * Validates a `list` prefix. The empty prefix is legal (it lists everything);
 * every other safety rule of `assertValidRawKey` applies.
 */
export function assertValidRawPrefix(prefix: string): void {
  if (prefix.length === 0) return;
  assertSafeSegmentText(prefix, 'prefix');
}

/** A reference from an `Observation` to the raw response that produced it. */
export const RawRefSchema = z
  .string()
  .min(1)
  .regex(RAW_KEY_PATTERN, 'raw_ref must have the shape produced by rawKey()')
  .brand<'RawRef'>();

export type RawRef = z.infer<typeof RawRefSchema>;
