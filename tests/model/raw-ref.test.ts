/**
 * CA-12 (RN-10, model level) — no Observation exists without its raw.
 *
 * No exception by source: the correspondent's Telegram messages and the
 * corrections typed into the panel write their payload to the raw store
 * first. A single exception would turn the invariant into a branch that can be
 * taken; zero exceptions is what makes it checkable (gate 2026-08-29).
 */
import { describe, expect, test } from 'vitest';
import { ObservationSchema } from '@/model';
import { rawKey } from '@/raw/store';
import { observationFixture } from '../fixtures/model';

const accepts = (raw_ref: unknown) =>
  ObservationSchema.safeParse({ ...observationFixture, raw_ref }).success;

describe('CA-12 — Observation.raw_ref', () => {
  test('is required: an Observation without it is rejected', () => {
    const { raw_ref: _dropped, ...withoutRawRef } = observationFixture;

    expect(ObservationSchema.safeParse(withoutRawRef).success).toBe(false);
  });

  test.each([
    ['null', null],
    ['the empty string', ''],
    ['whitespace only', '   '],
    ['a number', 1],
  ])('rejects %s', (_what, value) => {
    expect(accepts(value)).toBe(false);
  });

  test('rejects a string that is not a raw key', () => {
    expect(accepts('whatever-i-felt-like')).toBe(false);
    expect(accepts('futgal/comp/2026-03-21/no-digest.html')).toBe(false);
    expect(accepts('/leading/slash/2026-03-21/2026-03-21t17-00-00.000z-a1b2c3d4e5f6.html')).toBe(
      false,
    );
  });

  test('accepts exactly what rawKey produces', () => {
    const key = rawKey(
      {
        source: 'corresponsal',
        competition_id: 'futgal-preferente-g1',
        fetched_at: '2026-03-21T17:42:11.000Z',
        ext: 'json',
      },
      new TextEncoder().encode('{"message":"1-0 no Barreiro"}'),
    );

    expect(accepts(key)).toBe(true);
  });
});
