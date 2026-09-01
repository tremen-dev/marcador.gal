/**
 * CA-7.3 and CA-8.6 — the repositories VALIDATE ON THE WAY IN, before a single
 * query runs (ADR-001, ADR-017 §5).
 *
 * Pure: the `Sql` handed to the store is a SPY that counts calls and refuses
 * to run anything. If the store touched the database before zod had its say,
 * the spy would be called and this file would be red. `npm test`.
 */
import { describe, expect, test } from 'vitest';
import { ZodError } from 'zod';
import type { Sql } from '@/db/client';
import { PostgresDecisionStore } from '@/db/decisions';
import { PostgresObservationStore } from '@/db/observations';
import { decisionFixture, observationFixture } from '../fixtures/model';

interface SqlSpy {
  readonly sql: Sql;
  readonly calls: () => number;
}

/** A `Sql` that records every use — as a tag, as a function, as an object. */
function sqlSpy(): SqlSpy {
  let calls = 0;
  const touched = (): never => {
    calls += 1;
    throw new Error('the spy ran SQL: the store queried before validating');
  };
  const spy = new Proxy(touched, {
    apply: touched,
    get: touched,
  });
  return { sql: spy as unknown as Sql, calls: () => calls };
}

describe('CA-7.3 — PostgresObservationStore.append validates before SQL', () => {
  test("status 'scheduled' with home_score 1 is refused by zod and no query runs", async () => {
    const spy = sqlSpy();
    const store = new PostgresObservationStore(spy.sql);
    const malformed = { ...observationFixture, status: 'scheduled', home_score: 1, away_score: null };

    await expect(store.append(malformed as never)).rejects.toThrow(ZodError);
    expect(spy.calls()).toBe(0);
  });

  test('a well-formed Observation reaches the SQL (the spy is not switched off)', async () => {
    const spy = sqlSpy();
    const store = new PostgresObservationStore(spy.sql);

    await expect(store.append(observationFixture)).rejects.toThrow(/the spy ran SQL/);
    expect(spy.calls()).toBeGreaterThan(0);
  });
});

describe('CA-8.6 — PostgresDecisionStore.append validates before SQL', () => {
  test("rule 'RN-13' is refused by zod and no query runs", async () => {
    const spy = sqlSpy();
    const store = new PostgresDecisionStore(spy.sql);
    const invariant = { ...decisionFixture, rule: 'RN-13' };

    await expect(store.append(invariant as never)).rejects.toThrow(ZodError);
    expect(spy.calls()).toBe(0);
  });

  test('a Decision without support is refused by zod and no query runs', async () => {
    const spy = sqlSpy();
    const store = new PostgresDecisionStore(spy.sql);
    const unsupported = { ...decisionFixture, supporting_observation_ids: [] };

    await expect(store.append(unsupported as never)).rejects.toThrow(ZodError);
    expect(spy.calls()).toBe(0);
  });

  test('a well-formed Decision reaches the SQL (the spy is not switched off)', async () => {
    const spy = sqlSpy();
    const store = new PostgresDecisionStore(spy.sql);

    await expect(store.append(decisionFixture)).rejects.toThrow(/the spy ran SQL/);
    expect(spy.calls()).toBeGreaterThan(0);
  });
});
