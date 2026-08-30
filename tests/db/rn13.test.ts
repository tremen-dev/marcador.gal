/**
 * CA-16 (RN-13 at the Postgres level) — the engine refuses the amendment.
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

async function insertDecision(): Promise<void> {
  await sql`
    insert into decisions
      (match_id, status, home_score, away_score, provisional,
       rule, decided_at, supporting_observation_ids, version)
    values
      (${SEED.matchId}, 'live', 1, 0, false,
       'RN-02', '2026-03-21T17:35:01Z', ${sql.array([SEED.observationA])}, 1)
  `;
}

describe('CA-16 — observations are append-only', () => {
  test('UPDATE raises and the row keeps its value', async () => {
    await expect(
      sql`update observations set home_score = 9 where id = ${SEED.observationA}`,
    ).rejects.toThrow(/append-only/);

    const rows = await sql<{ home_score: number }[]>`
      select home_score from observations where id = ${SEED.observationA}
    `;
    expect(rows[0]?.home_score).toBe(1);
  });

  test('DELETE raises and the row is still there', async () => {
    await expect(
      sql`delete from observations where id = ${SEED.observationA}`,
    ).rejects.toThrow(/append-only/);

    const rows = await sql`select id from observations where id = ${SEED.observationA}`;
    expect(rows.length).toBe(1);
  });
});

describe('CA-16 — decisions are append-only', () => {
  test('UPDATE raises and the row keeps its value', async () => {
    await insertDecision();

    await expect(
      sql`update decisions set home_score = 9 where match_id = ${SEED.matchId}`,
    ).rejects.toThrow(/append-only/);

    const rows = await sql<{ home_score: number }[]>`
      select home_score from decisions where match_id = ${SEED.matchId}
    `;
    expect(rows[0]?.home_score).toBe(1);
  });

  test('DELETE raises and the row is still there', async () => {
    await insertDecision();

    await expect(
      sql`delete from decisions where match_id = ${SEED.matchId}`,
    ).rejects.toThrow(/append-only/);

    const rows = await sql`select match_id from decisions where match_id = ${SEED.matchId}`;
    expect(rows.length).toBe(1);
  });
});

describe('CA-16 — TRUNCATE still works', () => {
  /**
   * `TRUNCATE` does not fire FOR EACH ROW triggers, and without that the tests
   * themselves could not clean up. This test exists so that nobody "fixes" the
   * trigger by adding a TRUNCATE variant: doing so breaks this case, loudly.
   */
  test('truncating the two fact tables empties them', async () => {
    await insertDecision();

    await sql.unsafe('truncate observations, decisions cascade');

    expect((await sql`select id from observations`).length).toBe(0);
    expect((await sql`select match_id from decisions`).length).toBe(0);
  });
});
