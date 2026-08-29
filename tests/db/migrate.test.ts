/**
 * CA-13 — the migration raises the schema and is idempotent.
 *
 * NOT YET VERIFIED: written against a Neon test branch that did not exist when
 * this was implemented. `npm run test:db` fails loudly without
 * `DATABASE_URL_TEST`; until its output is in the ledger this criterion is
 * PENDING VERIFICATION, never met.
 */
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { migrate } from '@/db/migrate';
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
  test('the first run creates the six tables and records 0001', async () => {
    const applied = await migrate(sql);

    expect(applied).toEqual(['0001']);
    for (const table of TABLES) {
      expect(await tableNames()).toContain(table);
    }
    expect(await appliedVersions()).toEqual(['0001']);
  });

  test('the second run applies nothing and leaves a single row', async () => {
    const applied = await migrate(sql);

    expect(applied).toEqual([]);
    expect(await appliedVersions()).toEqual(['0001']);
  });

  test('the tables survive the second run', async () => {
    const names = await tableNames();

    for (const table of TABLES) expect(names).toContain(table);
  });
});
