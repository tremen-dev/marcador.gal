/**
 * CA-13 — the migration raises the schema and is idempotent.
 *
 * NOT YET VERIFIED: written against a Neon test branch that did not exist when
 * this was implemented. `npm run test:db` fails loudly without
 * `DATABASE_URL_TEST`; until its output is in the ledger this criterion is
 * PENDING VERIFICATION, never met.
 */
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { migrate, readMigrations } from '@/db/migrate';
import type { Sql } from '@/db/client';
import { connect, dropEverything } from './_harness';

const TABLES = [
  'competitions',
  'teams',
  'team_aliases',
  'matches',
  'observations',
  'decisions',
] as const;

let sql: Sql;

beforeAll(async () => {
  sql = connect();
  await dropEverything(sql);
});

afterAll(async () => {
  await sql.end();
});

async function tableNames(): Promise<string[]> {
  const rows = await sql<{ table_name: string }[]>`
    select table_name
      from information_schema.tables
     where table_schema = 'public' and table_type = 'BASE TABLE'
  `;
  return rows.map((row) => row.table_name).sort();
}

async function appliedVersions(): Promise<string[]> {
  const rows = await sql<{ version: string }[]>`
    select version from schema_migrations order by version
  `;
  return rows.map((row) => row.version);
}

describe('CA-13 — npm run db:migrate', () => {
  /**
   * The versions on disk, read from the runner's own discovery.
   *
   * This used to be the literal `['0001']`. SPEC-008 CA-14 adds
   * `migrations/0002` by a signed amendment (ledger, «Enmienda — 2026-09-01»),
   * so an assertion that ENUMERATES the migrations is made false by a decision
   * and not by a defect — the same shape as F-SPEC-008-1. What CA-13 is about
   * is preserved and stated explicitly below: every pending migration is
   * applied on the first run, none on the second, and the ledger holds one row
   * per version. The list is checked to be non-empty and to contain the two
   * versions that exist, so it cannot pass by discovering nothing.
   */
  const onDisk = async (): Promise<string[]> =>
    (await readMigrations()).map((migration) => migration.version);

  test('the first run creates the six tables and records every migration', async () => {
    const expected = await onDisk();
    expect(expected.length).toBeGreaterThan(0);
    expect(expected).toContain('0001');
    expect(expected).toContain('0002');

    const applied = await migrate(sql);

    expect(applied).toEqual(expected);
    for (const table of TABLES) {
      expect(await tableNames()).toContain(table);
    }
    expect(await appliedVersions()).toEqual(expected);
  });

  test('the second run applies nothing and leaves one row per version', async () => {
    const applied = await migrate(sql);

    expect(applied).toEqual([]);
    expect(await appliedVersions()).toEqual(await onDisk());
  });

  test('the tables survive the second run', async () => {
    const names = await tableNames();

    for (const table of TABLES) expect(names).toContain(table);
  });
});
