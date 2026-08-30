/**
 * CA-15 (RN-12 at the Postgres level) — the database also knows RN-12.
 *
 * The trigger is the point of this criterion: an array admits no foreign key,
 * so without it RN-12 is satisfied "for show" — there are ids, but they can be
 * rubbish or belong to another match.
 *
 * NOT YET VERIFIED: needs `DATABASE_URL_TEST`.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import type { Sql } from '@/db/client';
import { SEED, connect, resetAndMigrate, seed, truncateFacts } from './_harness';

let sql: Sql;

beforeAll(async () => {
  sql = connect();
  await resetAndMigrate(sql);
});

beforeEach(async () => {
  await truncateFacts(sql);
  await seed(sql);
});

afterAll(async () => {
  await sql.end();
});

interface DecisionRow {
  readonly rule: string | null;
  readonly support: readonly string[];
  readonly version?: number;
  readonly decidedAt?: string;
}

function insertDecision({
  rule,
  support,
  version = 1,
  decidedAt = '2026-03-21T17:35:01Z',
}: DecisionRow): Promise<unknown> {
  return sql`
    insert into decisions
      (match_id, status, home_score, away_score, provisional,
       rule, decided_at, supporting_observation_ids, version)
    values
      (${SEED.matchId}, 'live', 1, 0, false,
       ${rule}, ${decidedAt}, ${sql.array([...support])}, ${version})
  `;
}

describe('CA-15 — decisions', () => {
  test('1. rule NULL violates NOT NULL', async () => {
    await expect(
      insertDecision({ rule: null, support: [SEED.observationA] }),
    ).rejects.toThrow(/null value in column "rule"|not-null/i);
  });

  test('2. a rule that is not RN-xx violates the CHECK', async () => {
    await expect(
      insertDecision({ rule: 'lo que sea', support: [SEED.observationA] }),
    ).rejects.toThrow(/decisions_rule_shape/);
  });

  test('3. an empty support array violates the cardinality CHECK', async () => {
    await expect(insertDecision({ rule: 'RN-02', support: [] })).rejects.toThrow(
      /decisions_has_support/,
    );
  });

  test('4a. a supporting observation that does not exist raises', async () => {
    await expect(
      insertDecision({ rule: 'RN-02', support: ['obs-does-not-exist'] }),
    ).rejects.toThrow(/supporting observation/);
  });

  test('4b. a supporting observation of ANOTHER match raises', async () => {
    // It exists, which is exactly why a CHECK cannot catch it.
    await expect(
      insertDecision({ rule: 'RN-02', support: [SEED.observationOther] }),
    ).rejects.toThrow(/supporting observation/);
  });

  test('5. a well-formed Decision with two observations of the match is inserted', async () => {
    await insertDecision({
      rule: 'RN-02',
      support: [SEED.observationA, SEED.observationB],
    });

    const rows = await sql<{ version: number }[]>`
      select version from decisions where match_id = ${SEED.matchId}
    `;

    expect(rows.map((row) => row.version)).toEqual([1]);
  });
});

describe('CA-15 — version', () => {
  test('two decisions cannot share (match_id, version)', async () => {
    await insertDecision({
      rule: 'RN-02',
      support: [SEED.observationA],
      version: 1,
      decidedAt: '2026-03-21T17:35:01Z',
    });

    await expect(
      insertDecision({
        rule: 'RN-03',
        support: [SEED.observationB],
        version: 1,
        // A DIFFERENT instant on purpose. With both inserts sharing one
        // `decided_at`, a key of (match_id, version, decided_at) would collide
        // too and this test would pass without discriminating the invariant
        // CA-15 actually asks for: the pair, and nothing else, is unique.
        decidedAt: '2026-03-21T17:40:12Z',
      }),
    ).rejects.toThrow(/decisions_pkey|duplicate key/i);
  });

  test('version 0 violates the CHECK', async () => {
    await expect(
      insertDecision({ rule: 'RN-02', support: [SEED.observationA], version: 0 }),
    ).rejects.toThrow(/decisions_version_positive/);
  });

  test('successive versions of the same match are accepted', async () => {
    await insertDecision({ rule: 'RN-03', support: [SEED.observationA], version: 1 });
    await insertDecision({ rule: 'RN-02', support: [SEED.observationB], version: 2 });

    const rows = await sql<{ version: number }[]>`
      select version from decisions where match_id = ${SEED.matchId} order by version
    `;

    expect(rows.map((row) => row.version)).toEqual([1, 2]);
  });
});
