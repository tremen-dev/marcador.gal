/**
 * CA-14.5 — THE contract battery of the rhythm port. There is exactly one, and
 * it runs against both implementations: `MemoryRateLimit` and
 * `PostgresRateLimit` over a real Neon test branch.
 *
 * Same shape as `tests/raw/contract.ts` (ADR-005): this file is not a
 * `*.test.ts` on purpose — it is invoked, not collected.
 *
 * WHAT THIS BATTERY DOES *NOT* COVER, and it matters: survival BETWEEN
 * instances. That is CA-14.2, only the durable implementation passes it, and
 * writing it here would make the memory implementation look like it passes.
 */
import { beforeEach, describe, expect, test } from 'vitest';
import { MIN_REQUEST_INTERVAL_MS } from '@/polite/rate-limit';
import type { RateLimit } from '@/polite/rate-limit';

/** Builds a fresh port. `intervalMs` omitted means "the declared interval". */
export type CreateRateLimit = (intervalMs?: number) => Promise<RateLimit>;

const T0 = Date.parse('2026-09-06T17:00:00.000Z');

export function rateLimitContract(name: string, createRateLimit: CreateRateLimit): void {
  describe(`RateLimit contract — ${name}`, () => {
    let key: string;

    beforeEach(() => {
      // Every case gets its own key so a shared, real store (Postgres) does
      // not carry state from one case to the next.
      key = `ceroacero/contract-${Math.random().toString(36).slice(2, 10)}`;
    });

    test('1. the first turn of a key is granted', async () => {
      const limit = await createRateLimit();

      expect(await limit.takeTurn(key, T0)).toBe(true);
    });

    test('2. a second turn inside the minute is denied', async () => {
      const limit = await createRateLimit();
      await limit.takeTurn(key, T0);

      expect(await limit.takeTurn(key, T0)).toBe(false);
      expect(await limit.takeTurn(key, T0 + 59_999)).toBe(false);
    });

    test('3. the turn comes back exactly at the minute', async () => {
      const limit = await createRateLimit();
      await limit.takeTurn(key, T0);

      expect(await limit.takeTurn(key, T0 + MIN_REQUEST_INTERVAL_MS)).toBe(true);
    });

    test('4. the rhythm is per key: another pair is not blocked by this one', async () => {
      const limit = await createRateLimit();
      await limit.takeTurn(key, T0);

      expect(await limit.takeTurn(`${key}-other`, T0)).toBe(true);
    });

    test('5. UNSPENT TURNS DO NOT PILE UP: a quiet minute does not buy two', async () => {
      // This is not decoration. `/robot` promises it literally, in Galician
      // and in Spanish: «As peticións non gastadas non se acumulan: un minuto
      // sen pedir non dá dereito a dúas no seguinte» (SPEC-005, ADR-011). It
      // holds because what is stamped is the CURRENT instant, never the
      // previous one plus a minute.
      const limit = await createRateLimit();
      expect(await limit.takeTurn(key, T0)).toBe(true);

      // Two minutes of silence…
      const later = T0 + 2 * MIN_REQUEST_INTERVAL_MS;
      expect(await limit.takeTurn(key, later)).toBe(true);
      // …buy exactly one turn, not two.
      expect(await limit.takeTurn(key, later + 1)).toBe(false);
      expect(await limit.takeTurn(key, later + MIN_REQUEST_INTERVAL_MS - 1)).toBe(false);
    });

    test('6. the interval lives in ONE place, and moving it moves the boundary', async () => {
      // CA-14.6: `MIN_REQUEST_INTERVAL_MS` is the number, and both
      // implementations read it. Handed a different one, both move together —
      // which is what proves neither has a copy of its own, and that the
      // durable one is not carrying an interval inside its SQL.
      const limit = await createRateLimit(10_000);
      await limit.takeTurn(key, T0);

      expect(await limit.takeTurn(key, T0 + 9_999)).toBe(false);
      expect(await limit.takeTurn(key, T0 + 10_000)).toBe(true);
    });

    test('7. a denied turn does not move the stamp', async () => {
      // Otherwise a caller that hammers the port would push its own turn away
      // for ever, and RN-11 would become "one request per minute of silence".
      const limit = await createRateLimit();
      await limit.takeTurn(key, T0);

      for (let ms = 1; ms < MIN_REQUEST_INTERVAL_MS; ms += 10_000) {
        expect(await limit.takeTurn(key, T0 + ms)).toBe(false);
      }

      expect(await limit.takeTurn(key, T0 + MIN_REQUEST_INTERVAL_MS)).toBe(true);
    });
  });
}
