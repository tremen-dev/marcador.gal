/**
 * CA-19 at the Postgres level — the database also knows that only the ENGINE
 * writes a Decision.
 *
 * `decisions_rule_shape` is a closed list and not a shape. The difference is
 * the whole criterion: `RN-13` matches `^RN-[0-9]{2}$`, is a real rule of
 * reglas.md, and still cannot have produced a Decision.
 *
 * NOT YET VERIFIED: needs `DATABASE_URL_TEST`.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { DECISION_RULES } from '@/model';
import type { Sql } from '@/db/client';
import { SEED, connect, resetAndMigrate, seed, truncateFacts } from './_harness';

/** reglas.md §Invariantes del proyecto. None of these can produce a Decision. */
const PROJECT_INVARIANTS = ['RN-08', 'RN-09', 'RN-10', 'RN-11', 'RN-12', 'RN-13'] as const;

let sql: Sql;
let nextVersion = 1;

beforeAll(async () => {
  sql = connect();
  await resetAndMigrate(sql);
});

beforeEach(async () => {
  await truncateFacts(sql);
  await seed(sql);
  nextVersion = 1;
});

afterAll(async () => {
  await sql.end();
});

function insertWithRule(rule: string): Promise<unknown> {
  return sql`
    insert into decisions
      (match_id, status, home_score, away_score, provisional,
       rule, decided_at, supporting_observation_ids, version)
    values
      (${SEED.matchId}, 'live', 1, 0, false,
       ${rule}, '2026-03-21T17:35:01Z', ${sql.array([SEED.observationA])},
       ${nextVersion++})
  `;
}

describe('CA-19 — decisions_rule_shape is a closed list', () => {
  test.each(PROJECT_INVARIANTS)('rejects the project invariant %s', async (rule) => {
    await expect(insertWithRule(rule)).rejects.toThrow(/decisions_rule_shape/);
  });

  test('rejects RN-99, now by the list and no longer by the shape', async () => {
    await expect(insertWithRule('RN-99')).rejects.toThrow(/decisions_rule_shape/);
  });

  test.each(DECISION_RULES)('accepts the engine rule %s', async (rule) => {
    await insertWithRule(rule);

    const rows = await sql<{ rule: string }[]>`
      select rule from decisions where match_id = ${SEED.matchId} order by version
    `;

    expect(rows.map((row) => row.rule)).toContain(rule);
  });
});
