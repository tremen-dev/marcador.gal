/**
 * CA-10 — `migrations/0003` applies in order, without rollback, and does not
 * break what `0001` and `0002` already guarantee (ADR-006).
 *
 * Importing `_harness` THROWS without `DATABASE_URL_TEST`: without a real
 * Postgres this criterion is UNMET, not skipped (gate of 2026-08-29).
 *
 * The names of the artefacts are READ FROM THE MIGRATION, not repeated here
 * (CA-10.1): the test asks the file what it declares and asks
 * `information_schema` whether it exists. CA-10.2 is `parity.test.ts`, which
 * has to stay green with no new exception; CA-10.3 is the rest of the suite.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { MIGRATIONS_DIR, migrate, readMigrations } from '@/db/migrate';
import type { Sql } from '@/db/client';
import { connect, dropEverything } from './_harness';

const MIGRATION = '0003_declared_calendar.sql';

let sql: Sql;
let source: string;

beforeAll(async () => {
  sql = connect();
  await dropEverything(sql);
  source = await readFile(join(MIGRATIONS_DIR, MIGRATION), 'utf8');
});

afterAll(async () => {
  await sql.end();
});

/** Every name the migration gives to a `create <kind> <name>`. */
function declared(kind: RegExp): string[] {
  return [...source.matchAll(kind)].map((match) => match[1]!).sort();
}

describe('CA-10 — the third migration', () => {
  test('is on disk, third, and named after what it brings', async () => {
    const versions = (await readMigrations()).map((migration) => migration.file);
    expect(versions).toEqual(['0001_canonical_model.sql', '0002_request_rhythm.sql', MIGRATION]);
  });

  test('a first run applies 0001, 0002 and 0003 in that order; a second applies nothing', async () => {
    expect(await migrate(sql)).toEqual(['0001', '0002', '0003']);
    expect(await migrate(sql)).toEqual([]);

    const applied = await sql<{ version: string }[]>`
      select version from schema_migrations order by version
    `;
    expect(applied.map((row) => row.version)).toEqual(['0001', '0002', '0003']);
  });

  test('1. the table the migration declares exists', async () => {
    const tables = declared(/create table (\w+)/g);
    expect(tables).toEqual(['calendar_loads']);

    const rows = await sql<{ table_name: string }[]>`
      select table_name from information_schema.tables
       where table_schema = 'public' and table_type = 'BASE TABLE'
    `;
    for (const table of tables) expect(rows.map((row) => row.table_name)).toContain(table);
  });

  test('1. the two unique indexes on matches exist, with the names the migration declares', async () => {
    const indexes = declared(/create unique index (\w+)\s+on matches/g);
    expect(indexes).toHaveLength(2);

    const rows = await sql<{ indexname: string; indexdef: string }[]>`
      select indexname, indexdef from pg_indexes
       where schemaname = 'public' and tablename = 'matches'
    `;
    for (const index of indexes) {
      const found = rows.find((row) => row.indexname === index);
      expect(found, index).toBeDefined();
      expect(found?.indexdef).toMatch(/UNIQUE/);
    }
  });

  test('1. the triggers the migration declares exist on their tables', async () => {
    const triggers = [...source.matchAll(/create trigger (\w+)\s+(?:before|after) [\w ]+ on (\w+)/g)].map(
      (match) => ({ trigger: match[1]!, table: match[2]! }),
    );
    // Two new functions — identity of a match, contiguity of a Decision's
    // versions — plus `reject_amendment` of 0001 reused on `calendar_loads`.
    expect(triggers.length).toBeGreaterThanOrEqual(3);
    expect(triggers.map((t) => t.table).sort()).toEqual(['calendar_loads', 'decisions', 'matches']);

    const rows = await sql<{ trigger_name: string; event_object_table: string }[]>`
      select distinct trigger_name, event_object_table
        from information_schema.triggers
       where trigger_schema = 'public'
    `;
    for (const { trigger, table } of triggers) {
      expect(rows, `${trigger} on ${table}`).toContainEqual({
        trigger_name: trigger,
        event_object_table: table,
      });
    }
  });

  test('1. the two new trigger functions are declared in the file, and 0001 keeps its own', async () => {
    const functions = declared(/create function (\w+)\(\)/g);
    expect(functions).toHaveLength(2);
    expect(functions).not.toContain('reject_amendment');

    const rows = await sql<{ routine_name: string }[]>`
      select routine_name from information_schema.routines
       where routine_schema = 'public' and routine_type = 'FUNCTION'
    `;
    const names = rows.map((row) => row.routine_name);
    for (const fn of functions) expect(names).toContain(fn);
    expect(names).toContain('reject_amendment');
    expect(names).toContain('decisions_supporting_observations_exist');
  });

  test('2. calendar_loads is not the canonical model: it has no zod schema and no test needs one', async () => {
    // The parity test of SPEC-001 CA-14 lists the six canonical tables and
    // must pass with no new entry. This case pins that `calendar_loads` is a
    // seventh table of a different kind, like `request_rhythm`.
    const columns = await sql<{ column_name: string }[]>`
      select column_name from information_schema.columns
       where table_schema = 'public' and table_name = 'calendar_loads'
       order by column_name
    `;
    expect(columns.map((row) => row.column_name)).toEqual([
      'competition_id',
      'declared_at',
      'declared_by',
      'file_digest',
      'id',
      'inserted',
      'loaded_at',
      'matches_count',
      'rounds',
      'updated',
    ]);
  });

  test('4. the migration is SQL written by hand: no generator left its mark', () => {
    expect(source).toMatch(/^-- 0003_declared_calendar\.sql/);
    expect(source).not.toMatch(/drizzle|prisma|generated by/i);
  });
});
