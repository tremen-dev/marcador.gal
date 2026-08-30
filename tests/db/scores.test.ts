/**
 * CA-7 and CA-18 at the Postgres level — the scoreboard rule, on both tables.
 *
 * The two criteria are the SAME rule applied to what we observe and to what we
 * publish, so they share `tests/fixtures/score-cases.ts` with the zod halves.
 * One dataset, three levels.
 *
 * NOT YET VERIFIED: needs `DATABASE_URL_TEST`.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import type { Sql } from '@/db/client';
import { SCORE_CASES } from '../fixtures/score-cases';
import { SEED, connect, resetAndMigrate, seed, truncateFacts } from './_harness';

/**
 * Two kinds of case do not survive the trip to SQL and are left out on purpose:
 *
 * - `absent` — an INSERT that does not name a column sends NULL, so Postgres
 *   cannot tell "absent" from "null"; the `null` case already covers it.
 * - `fractional` — Postgres does NOT refuse `1.5` in an `integer` column: it
 *   rounds it (`select 1.5::integer` is `2`, and the INSERT stores 2), so the
 *   case cannot exercise a rejection at this level at all. The refusal is
 *   zod's, and the zod halves already cover it. The spec's own list of
 *   Postgres cases (CA-18.3) does not include it either.
 */
const DB_CASES = SCORE_CASES.filter(
  (item) => item.kind !== 'absent' && item.kind !== 'fractional',
);

let sql: Sql;
let nextVersion = 1;
let nextObservation = 1;

beforeAll(async () => {
  sql = connect();
  await resetAndMigrate(sql);
});

beforeEach(async () => {
  await truncateFacts(sql);
  await seed(sql);
  nextVersion = 1;
  nextObservation = 1;
});

afterAll(async () => {
  await sql.end();
});

type Score = number | null | undefined;

function insertObservation(status: string, home: Score, away: Score): Promise<unknown> {
  const id = `obs-scores-${nextObservation++}`;
  return sql`
    insert into observations
      (id, match_id, source, observed_at, status, home_score, away_score, confidence, raw_ref)
    values
      (${id}, ${SEED.matchId}, 'futgal', '2026-03-21T17:35:00Z',
       ${status}, ${home ?? null}, ${away ?? null}, 1.0, ${SEED.rawRef})
  `;
}

function insertDecision(status: string, home: Score, away: Score): Promise<unknown> {
  return sql`
    insert into decisions
      (match_id, status, home_score, away_score, provisional,
       rule, decided_at, supporting_observation_ids, version)
    values
      (${SEED.matchId}, ${status}, ${home ?? null}, ${away ?? null}, false,
       'RN-02', '2026-03-21T17:35:01Z', ${sql.array([SEED.observationA])},
       ${nextVersion++})
  `;
}

const tables = [
  { table: 'observations', criterion: 'CA-7', insert: insertObservation },
  { table: 'decisions', criterion: 'CA-18', insert: insertDecision },
] as const;

describe.each(tables)('$criterion — $table, the shared truth table', ({ table, insert }) => {
  test('the shared table reaches Postgres with cases in it', () => {
    expect(DB_CASES.length).toBeGreaterThan(0);
  });

  test.each(DB_CASES.filter((item) => item.accepts))('$label', async ({ status, scores }) => {
    await expect(
      insert(status, scores['home_score'] as Score, scores['away_score'] as Score),
    ).resolves.toBeDefined();
  });

  test.each(DB_CASES.filter((item) => !item.accepts))('$label', async ({ status, scores }) => {
    await expect(
      insert(status, scores['home_score'] as Score, scores['away_score'] as Score),
    ).rejects.toThrow(new RegExp(`${table}_score`));
  });
});

/**
 * CA-18.3 spells out six inserts. They are here by name as well as inside the
 * table above, because the criterion names the constraint each one must break.
 */
describe('CA-18 — the six inserts CA-18.3 names', () => {
  test('1. scheduled with a scoreboard breaks decisions_score_matches_status', async () => {
    await expect(insertDecision('scheduled', 2, 0)).rejects.toThrow(
      /decisions_score_matches_status/,
    );
  });

  test('2. postponed with a scoreboard breaks decisions_score_matches_status', async () => {
    await expect(insertDecision('postponed', 0, 0)).rejects.toThrow(
      /decisions_score_matches_status/,
    );
  });

  test('3. live with a null scoreboard breaks decisions_score_matches_status', async () => {
    await expect(insertDecision('live', null, null)).rejects.toThrow(
      /decisions_score_matches_status/,
    );
  });

  test('4. finished with home_score = -1 breaks decisions_scores_non_negative', async () => {
    await expect(insertDecision('finished', -1, 0)).rejects.toThrow(
      /decisions_scores_non_negative/,
    );
  });

  test('5. live 1-0 is inserted', async () => {
    await insertDecision('live', 1, 0);

    const rows = await sql<{ home_score: number }[]>`
      select home_score from decisions where match_id = ${SEED.matchId}
    `;

    expect(rows.map((row) => row.home_score)).toEqual([1]);
  });

  test('6. scheduled with a null scoreboard is inserted', async () => {
    await insertDecision('scheduled', null, null);

    const rows = await sql<{ status: string }[]>`
      select status from decisions where match_id = ${SEED.matchId}
    `;

    expect(rows.map((row) => row.status)).toEqual(['scheduled']);
  });
});

/** CA-7's own half, named the same way: the rule is the rule on both tables. */
describe('CA-7 — the same six inserts against observations', () => {
  test('scheduled with a scoreboard breaks observations_score_matches_status', async () => {
    await expect(insertObservation('scheduled', 2, 0)).rejects.toThrow(
      /observations_score_matches_status/,
    );
  });

  test('postponed with a scoreboard breaks observations_score_matches_status', async () => {
    await expect(insertObservation('postponed', 0, 0)).rejects.toThrow(
      /observations_score_matches_status/,
    );
  });

  test('live with a null scoreboard breaks observations_score_matches_status', async () => {
    await expect(insertObservation('live', null, null)).rejects.toThrow(
      /observations_score_matches_status/,
    );
  });

  test('finished with home_score = -1 breaks observations_scores_non_negative', async () => {
    await expect(insertObservation('finished', -1, 0)).rejects.toThrow(
      /observations_scores_non_negative/,
    );
  });

  test('suspended keeps its scoreboard: a match stopped at minute 60 has one', async () => {
    await insertObservation('suspended', 1, 2);

    const rows = await sql<{ away_score: number }[]>`
      select away_score from observations where status = 'suspended'
    `;

    expect(rows.map((row) => row.away_score)).toEqual([2]);
  });

  test('postponed with a null scoreboard is inserted', async () => {
    await insertObservation('postponed', null, null);

    const rows = await sql<{ status: string }[]>`
      select status from observations where status = 'postponed'
    `;

    expect(rows).toHaveLength(1);
  });
});
