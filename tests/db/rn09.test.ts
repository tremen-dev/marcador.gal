/**
 * CA-17 (RN-09 at the Postgres level) — the database also demands the person.
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
  await sql.unsafe('truncate team_aliases cascade');
  await truncateFacts(sql);
  await seed(sql);
});

afterAll(async () => {
  await sql.end();
});

interface AliasRow {
  readonly alias?: string;
  readonly status: string;
  readonly confirmedBy: string | null;
  readonly confirmedAt: string | null;
}

function insertAlias({
  alias = 'UD Ourense',
  status,
  confirmedBy,
  confirmedAt,
}: AliasRow): Promise<unknown> {
  return sql`
    insert into team_aliases (team_id, alias, source, season, status, confirmed_by, confirmed_at)
    values (${SEED.awayId}, ${alias}, 'futgal', '2026/27',
            ${status}, ${confirmedBy}, ${confirmedAt})
  `;
}

const CONFIRMED_AT = '2026-03-01T09:00:00Z';

describe('CA-17 — team_aliases', () => {
  test('1. confirmed with no confirmer fails', async () => {
    await expect(
      insertAlias({ status: 'confirmed', confirmedBy: null, confirmedAt: CONFIRMED_AT }),
    ).rejects.toThrow(/team_aliases_confirmed_needs_person/);
  });

  test('1b. confirmed with no moment of confirmation fails', async () => {
    await expect(
      insertAlias({ status: 'confirmed', confirmedBy: 'alberto', confirmedAt: null }),
    ).rejects.toThrow(/team_aliases_confirmed_needs_person/);
  });

  test('1c. confirmed by the empty string fails', async () => {
    await expect(
      insertAlias({ status: 'confirmed', confirmedBy: '', confirmedAt: CONFIRMED_AT }),
    ).rejects.toThrow(/team_aliases_confirmer_not_empty/);
  });

  test('2. proposed with a confirmer fails', async () => {
    await expect(
      insertAlias({ status: 'proposed', confirmedBy: 'alberto', confirmedAt: null }),
    ).rejects.toThrow(/team_aliases_proposed_has_no_person/);
  });

  test('3. a second alias with the same (alias, source, season) fails', async () => {
    await insertAlias({ status: 'proposed', confirmedBy: null, confirmedAt: null });

    await expect(
      sql`
        insert into team_aliases
          (team_id, alias, source, season, status, confirmed_by, confirmed_at)
        values (${SEED.homeId}, 'UD Ourense', 'futgal', '2026/27', 'proposed', null, null)
      `,
    ).rejects.toThrow(/team_aliases_pkey|duplicate key/i);
  });

  test('4. a status outside (proposed, confirmed) fails', async () => {
    await expect(
      insertAlias({ status: 'confirmadísimo', confirmedBy: null, confirmedAt: null }),
    ).rejects.toThrow(/team_aliases_status_known/);
  });

  test('a well-formed confirmed alias is accepted', async () => {
    await insertAlias({ status: 'confirmed', confirmedBy: 'alberto', confirmedAt: CONFIRMED_AT });

    const rows = await sql<{ confirmed_by: string }[]>`
      select confirmed_by from team_aliases where alias = 'UD Ourense'
    `;

    expect(rows[0]?.confirmed_by).toBe('alberto');
  });

  test('the same text from ANOTHER source is a different alias', async () => {
    await insertAlias({ status: 'proposed', confirmedBy: null, confirmedAt: null });

    await sql`
      insert into team_aliases (team_id, alias, source, season, status, confirmed_by, confirmed_at)
      values (${SEED.awayId}, 'UD Ourense', 'ceroacero', '2026/27', 'proposed', null, null)
    `;

    const rows = await sql`select source from team_aliases where alias = 'UD Ourense'`;
    expect(rows.length).toBe(2);
  });
});

describe('CA-17 — matches', () => {
  test('a team cannot play against itself', async () => {
    await expect(
      sql`
        insert into matches (id, competition_id, round, kickoff, home_id, away_id, venue)
        values ('impossible', ${SEED.competitionId}, 23, '2026-03-21T17:00:00Z',
                ${SEED.homeId}, ${SEED.homeId}, null)
      `,
    ).rejects.toThrow(/matches_two_different_teams/);
  });
});
