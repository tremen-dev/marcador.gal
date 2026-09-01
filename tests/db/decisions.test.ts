/**
 * CA-8 — `PostgresDecisionStore`: contiguous versions and one live Decision,
 * arbitrated by the database (RN-12, ADR-004, ADR-017 §5).
 *
 * Importing `_harness` THROWS without `DATABASE_URL_TEST`: without a real
 * Postgres CA-8.1..8.5 are UNMET, not skipped. CA-8.6 (entry validation, with
 * a spy) and CA-8.7 (types) run in `npm test`; the second net of 8.6 — the
 * CHECK of SPEC-001 CA-19 — is checked here by SQL.
 *
 * CA-8.5 is checked AGAINST THE REAL POSTGRES with two connections, like
 * SPEC-008 CA-14.4: a double in memory cannot demonstrate it.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { DecisionVersionConflictError, PostgresDecisionStore } from '@/db/decisions';
import type { Sql } from '@/db/client';
import { DECISION_RULES } from '@/model/decision';
import type { Decision } from '@/model/decision';
import { InstantSchema } from '@/model/ids';
import type { MatchId, ObservationId } from '@/model/ids';
import { decisionFixture } from '../fixtures/model';
import { SEED, connect, resetAndMigrate, seed, truncateFacts } from './_harness';

const MATCH = SEED.matchId as MatchId;

/** The branch the fixture is in: spreading a union would lose the discriminant. */
type LiveDecision = Extract<Decision, { status: 'live' }>;

/** `decisionFixture` pointed at the seed: its match and its two observations. */
const v1: LiveDecision = {
  ...(decisionFixture as LiveDecision),
  match_id: MATCH,
  supporting_observation_ids: [SEED.observationA as ObservationId, SEED.observationB as ObservationId],
  version: 1,
};
const v2: LiveDecision = { ...v1, home_score: 2, decided_at: '2026-03-21T17:50:00.000Z', version: 2 };
const v3: LiveDecision = { ...v1, home_score: 3, decided_at: '2026-03-21T18:00:00.000Z', version: 3 };

let sql: Sql;
let store: PostgresDecisionStore;

beforeAll(async () => {
  sql = connect();
  await resetAndMigrate(sql);
  store = new PostgresDecisionStore(sql);
});

beforeEach(async () => {
  await truncateFacts(sql);
  await seed(sql);
});

afterAll(async () => {
  await sql.end();
});

describe('CA-8.1 — append and getLatestByMatch', () => {
  test('version 1 is stored and read back equal', async () => {
    const stored = await store.append(v1);
    expect(stored).toEqual(v1);

    const latest = await store.getLatestByMatch(MATCH);
    expect(latest).toEqual(v1);
    expect(Object.isFrozen(latest)).toBe(true);
  });

  test('decided_at is a Z string, the support a non-empty tuple, the rule an engine rule', async () => {
    await store.append(v1);
    const latest = await store.getLatestByMatch(MATCH);

    expect(typeof latest?.decided_at).toBe('string');
    expect(InstantSchema.safeParse(latest?.decided_at).success).toBe(true);
    expect(latest?.decided_at).toBe('2026-03-21T17:35:01.000Z');
    expect(Array.isArray(latest?.supporting_observation_ids)).toBe(true);
    expect(latest?.supporting_observation_ids.length).toBeGreaterThanOrEqual(1);
    expect(latest?.supporting_observation_ids).toEqual([SEED.observationA, SEED.observationB]);
    expect(DECISION_RULES).toContain(latest?.rule);
  });

  test('a match without decisions has no latest', async () => {
    expect(await store.getLatestByMatch(MATCH)).toBeNull();
    expect(await store.getLatestByMatch(SEED.otherMatchId as MatchId)).toBeNull();
  });
});

describe('CA-8.2 — contiguity, arbitrated by the database', () => {
  test('version 2 after 1 is stored and becomes the live one', async () => {
    await store.append(v1);
    await store.append(v2);

    const latest = await store.getLatestByMatch(MATCH);
    expect(latest?.version).toBe(2);
    expect(latest?.home_score).toBe(2);
  });

  test('version 3 after 1 is refused by the database as a version conflict', async () => {
    await store.append(v1);

    await expect(store.append(v3)).rejects.toThrow(DecisionVersionConflictError);
    await expect(store.append(v3)).rejects.toThrow(/not contiguous|version/);
    expect((await store.listByMatch(MATCH)).map((d) => d.version)).toEqual([1]);
  });

  test('version 1 is mandatory first: version 2 on an empty match is refused', async () => {
    await expect(store.append(v2)).rejects.toThrow(DecisionVersionConflictError);
    expect(await store.listByMatch(MATCH)).toEqual([]);
  });

  test('the same version twice is a version conflict too, and the first stays', async () => {
    await store.append(v1);

    await expect(store.append({ ...v1, home_score: 9 })).rejects.toThrow(
      DecisionVersionConflictError,
    );
    expect((await store.getLatestByMatch(MATCH))?.home_score).toBe(1);
  });
});

describe('CA-8.3 — listByMatch', () => {
  test('returns the whole log, version ascending, and only that match', async () => {
    await store.append(v1);
    await store.append(v2);
    await store.append(v3);
    await store.append({
      ...v1,
      match_id: SEED.otherMatchId as MatchId,
      supporting_observation_ids: [SEED.observationOther as ObservationId],
      home_score: 0,
    });

    const log = await store.listByMatch(MATCH);
    expect(log.map((d) => d.version)).toEqual([1, 2, 3]);
    for (const decision of log) expect(decision.match_id).toBe(MATCH);
  });
});

describe('CA-8.4 — the trigger of SPEC-001 is inherited, not reimplemented', () => {
  test('a supporting observation of ANOTHER match fails by decisions_supporting_observations_exist, unwrapped', async () => {
    const wrong: LiveDecision = {
      ...v1,
      supporting_observation_ids: [SEED.observationOther as ObservationId],
    };

    const error = await store.append(wrong).then(
      () => null,
      (e: unknown) => e,
    );
    expect(error).not.toBeNull();
    expect(error).not.toBeInstanceOf(DecisionVersionConflictError);
    expect((error as Error).message).toMatch(/supporting observation .* does not exist for match/);
    expect((error as { code?: string }).code).toBe('23503');
  });
});

describe('CA-8.5 — two at once, one wins', () => {
  test('two concurrent appends of version 1 from two connections: one success, one DecisionVersionConflictError', async () => {
    const a = connect();
    const b = connect();
    try {
      const storeA = new PostgresDecisionStore(a);
      const storeB = new PostgresDecisionStore(b);

      const outcomes = await Promise.allSettled([
        storeA.append(v1),
        storeB.append({ ...v1, home_score: 2 }),
      ]);

      const fulfilled = outcomes.filter((o) => o.status === 'fulfilled');
      const rejected = outcomes.filter((o) => o.status === 'rejected');
      // The reasons are asserted as a list so that a double failure prints
      // BOTH errors instead of a bare count.
      const reasons = rejected.map((o) => String((o as PromiseRejectedResult).reason));
      expect(reasons).toHaveLength(1);
      expect(fulfilled).toHaveLength(1);
      expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(
        DecisionVersionConflictError,
      );

      const latest = await store.getLatestByMatch(MATCH);
      expect(latest?.version).toBe(1);
      expect(await store.listByMatch(MATCH)).toHaveLength(1);
    } finally {
      await a.end();
      await b.end();
    }
  });
});

describe('CA-8.6 — the second net: the CHECK of SPEC-001 CA-19 is still there', () => {
  test("inserting rule 'RN-13' by SQL is refused by decisions_rule_shape", async () => {
    await expect(sql`
      insert into decisions
        (match_id, status, home_score, away_score, provisional,
         rule, decided_at, supporting_observation_ids, version)
      values
        (${MATCH}, 'live', 1, 0, false,
         'RN-13', '2026-03-21T17:35:01Z', ${sql.array([SEED.observationA])}, 1)
    `).rejects.toThrow(/decisions_rule_shape/);
  });
});
