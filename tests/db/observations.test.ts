/**
 * CA-7 — `PostgresObservationStore`: what an adapter produces is stored, read
 * back the same, and never rewritten (RN-13, ADR-006, ADR-017 §5).
 *
 * Importing `_harness` THROWS without `DATABASE_URL_TEST`: without a real
 * Postgres CA-7.1, 7.2, 7.4, 7.5 and 7.6 are UNMET, not skipped. CA-7.3 (the
 * entry validation, with a spy) and CA-7.7 (types) run in `npm test`.
 *
 * The seed of `_harness.ts` is used as it is and NOT modified (CA-4.9).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { ObservationConflictError, PostgresObservationStore } from '@/db/observations';
import type { Sql } from '@/db/client';
import { InstantSchema } from '@/model/ids';
import type { MatchId, ObservationId } from '@/model/ids';
import type { Observation } from '@/model/observation';
import { observationFixture } from '../fixtures/model';
import { SEED, connect, resetAndMigrate, seed, truncateFacts } from './_harness';

/** The branch the fixture is in: spreading a union would lose the discriminant. */
type LiveObservation = Extract<Observation, { status: 'live' }>;

/** `observationFixture` pointed at a match the seed actually has. */
const fixture: LiveObservation = {
  ...(observationFixture as LiveObservation),
  id: 'obs-0100' as ObservationId,
  match_id: SEED.matchId as MatchId,
};

let sql: Sql;
let store: PostgresObservationStore;

beforeAll(async () => {
  sql = connect();
  await resetAndMigrate(sql);
  store = new PostgresObservationStore(sql);
});

beforeEach(async () => {
  await truncateFacts(sql);
  await seed(sql);
});

afterAll(async () => {
  await sql.end();
});

describe('CA-7.1 — append and getById', () => {
  test('append returns the stored Observation and getById reads it back equal', async () => {
    const stored = await store.append(fixture);
    expect(stored).toEqual(fixture);

    const read = await store.getById(fixture.id);
    expect(read).toEqual(fixture);
  });

  test('observed_at comes back as a STRING that satisfies InstantSchema', async () => {
    await store.append(fixture);
    const read = await store.getById(fixture.id);

    expect(typeof read?.observed_at).toBe('string');
    expect(InstantSchema.safeParse(read?.observed_at).success).toBe(true);
    expect(read?.observed_at).toBe('2026-03-21T17:35:00.000Z');
  });

  test('what comes out is frozen: it is the output of ObservationSchema.parse', async () => {
    await store.append(fixture);
    const read = await store.getById(fixture.id);

    expect(Object.isFrozen(read)).toBe(true);
  });

  test('the seed rows are readable too, with confidence as a number', async () => {
    const read = await store.getById(SEED.observationB as ObservationId);

    expect(read?.source).toBe('ceroacero');
    expect(read?.confidence).toBe(0.7);
    expect(read?.status).toBe('live');
  });
});

describe('CA-7.2 — listByMatch and unknown ids', () => {
  test('listByMatch returns only that match, by observed_at then id', async () => {
    // Two more at the SAME instant as obs-0001, to force the tie-break by id.
    await store.append({ ...fixture, id: 'obs-0000' as ObservationId, observed_at: '2026-03-21T17:35:00.000Z' });
    await store.append({ ...fixture, id: 'obs-0003' as ObservationId, observed_at: '2026-03-21T17:35:00.000Z' });

    const list = await store.listByMatch(SEED.matchId as MatchId);

    expect(list.map((o) => o.id)).toEqual(['obs-0000', 'obs-0001', 'obs-0003', 'obs-0002']);
    for (const observation of list) expect(observation.match_id).toBe(SEED.matchId);
    expect(list.some((o) => o.id === SEED.observationOther)).toBe(false);
  });

  test('listByMatch of a match with nothing returns []', async () => {
    await truncateFacts(sql);
    expect(await store.listByMatch(SEED.matchId as MatchId)).toEqual([]);
  });

  test('getById of an unknown id returns null', async () => {
    expect(await store.getById('obs-nobody' as ObservationId)).toBeNull();
  });
});

describe('CA-7.4 — replay is harmless', () => {
  test('append twice leaves ONE row and the second call returns the stored row without error', async () => {
    await store.append(fixture);
    const again = await store.append(fixture);

    expect(again).toEqual(fixture);
    const rows = await sql`select id from observations where id = ${fixture.id}`;
    expect(rows).toHaveLength(1);
  });
});

describe('CA-7.1 and CA-7.4 — an observed_at WITHOUT milliseconds (F-1)', () => {
  // `InstantSchema` accepts `…:00Z` as well as `…:00.000Z`; the database hands
  // back `.000Z`. The store owns that difference: what it returns is the stored
  // form, and a replay of the very same object is still harmless.
  const noMillis: LiveObservation = {
    ...fixture,
    id: 'obs-0101' as ObservationId,
    observed_at: '2026-03-21T17:40:00Z',
  };
  const storedForm: LiveObservation = { ...noMillis, observed_at: '2026-03-21T17:40:00.000Z' };

  test('7.1: append returns the STORED form and getById reads back equal to it', async () => {
    expect(InstantSchema.safeParse(noMillis.observed_at).success).toBe(true);

    const stored = await store.append(noMillis);
    expect(stored).toEqual(storedForm);

    const read = await store.getById(noMillis.id);
    expect(read).toEqual(stored);
    expect(read).toEqual(storedForm);
  });

  test('7.4: append twice of the same object leaves ONE row and the second call returns the stored row', async () => {
    await store.append(noMillis);
    const again = await store.append(noMillis);

    expect(again).toEqual(storedForm);
    const rows = await sql`select id from observations where id = ${noMillis.id}`;
    expect(rows).toHaveLength(1);
  });

  test('7.4: the replay is also harmless when the second call carries the stored form', async () => {
    await store.append(noMillis);
    const again = await store.append(storedForm);

    expect(again).toEqual(storedForm);
  });

  test('7.5 still holds: same id without milliseconds but a different away_score is a conflict', async () => {
    await store.append(noMillis);

    const other: LiveObservation = { ...noMillis, away_score: 1 };
    await expect(store.append(other)).rejects.toThrow(ObservationConflictError);

    const read = await store.getById(noMillis.id);
    expect(read?.away_score).toBe(noMillis.away_score);
  });
});

describe('CA-7.5 — conflict', () => {
  test('another Observation with the same id and a different home_score is refused, and the first content stays', async () => {
    await store.append(fixture);

    const other: LiveObservation = { ...fixture, home_score: 2 };
    await expect(store.append(other)).rejects.toThrow(ObservationConflictError);
    await expect(store.append(other)).rejects.toThrow(/obs-0100/);

    const read = await store.getById(fixture.id);
    expect(read?.home_score).toBe(1);
  });
});

describe('CA-7.6 — the foreign key speaks for itself', () => {
  test('append with an unknown match_id fails by the foreign key, unwrapped', async () => {
    const orphan: LiveObservation = { ...fixture, match_id: 'no-such-match' as MatchId };

    const error = await store.append(orphan).then(
      () => null,
      (e: unknown) => e,
    );
    expect(error).not.toBeNull();
    expect(error).not.toBeInstanceOf(ObservationConflictError);
    expect((error as { code?: string }).code).toBe('23503');
    expect((error as Error).message).toMatch(/foreign key/);
  });
});
