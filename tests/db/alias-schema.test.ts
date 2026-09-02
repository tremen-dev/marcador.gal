/**
 * CA-8 — `migrations/0004` applies in order, without rollback, and does not
 * touch what `0001` already guarantees (ADR-006, SPEC-011 §6).
 *
 * Importing `_harness` THROWS without `DATABASE_URL_TEST`: without a real
 * Postgres this criterion is UNMET, not skipped (gate of 2026-08-29).
 *
 * The names of the artefacts are READ FROM THE MIGRATION, not repeated here
 * (CA-8.1). CA-8.3 is `parity.test.ts`, which has to stay green with no new
 * exception entry; CA-8.4 is the migration's own text, checked below and read
 * in the diff by the verifier.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { MIGRATIONS_DIR, migrate, readMigrations } from '@/db/migrate';
import type { Sql } from '@/db/client';
import { connect, dropEverything } from './_harness';

const MIGRATION = '0004_alias_loads.sql';

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

describe('CA-8 — the fourth migration', () => {
  test('is on disk, fourth, and named after what it brings', async () => {
    const files = (await readMigrations()).map((migration) => migration.file);
    expect(files).toHaveLength(4);
    expect(files[3]).toBe(MIGRATION);
  });

  test('a first run applies 0001..0004 in that order; a second applies nothing', async () => {
    expect(await migrate(sql)).toEqual(['0001', '0002', '0003', '0004']);
    expect(await migrate(sql)).toEqual([]);

    const applied = await sql<{ version: string }[]>`
      select version from schema_migrations order by version
    `;
    expect(applied.map((row) => row.version)).toEqual(['0001', '0002', '0003', '0004']);
  });

  test('1. the table the migration declares exists', async () => {
    const tables = declared(/create table (\w+)/g);
    expect(tables).toEqual(['alias_loads']);

    const rows = await sql<{ table_name: string }[]>`
      select table_name from information_schema.tables
       where table_schema = 'public' and table_type = 'BASE TABLE'
    `;
    for (const table of tables) expect(rows.map((row) => row.table_name)).toContain(table);
  });

  test('1. the append-only trigger exists, with the name the migration declares, on its table', async () => {
    const triggers = [
      ...source.matchAll(/create trigger (\w+)\s+(?:before|after) [\w ]+ on (\w+)/g),
    ].map((match) => ({ trigger: match[1]!, table: match[2]! }));
    expect(triggers.length).toBeGreaterThanOrEqual(1);
    expect(triggers.map((entry) => entry.table)).toEqual(['alias_loads']);

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

  test('1. the migration declares no function of its own: reject_amendment is 0001’s, reused', async () => {
    expect(declared(/create function (\w+)\(\)/g)).toEqual([]);
    expect(source).toContain('reject_amendment');

    const rows = await sql<{ routine_name: string }[]>`
      select routine_name from information_schema.routines
       where routine_schema = 'public' and routine_type = 'FUNCTION'
    `;
    expect(rows.map((row) => row.routine_name)).toContain('reject_amendment');
  });

  test('2. team_aliases does not change: the executable SQL never names it', () => {
    // Comments may explain the frontier; the SQL may not cross it.
    const code = source.replace(/^\s*--.*$/gm, '');

    expect(code).not.toMatch(/team_aliases/);
    expect(code).not.toMatch(/alter table/i);
    expect(code).not.toMatch(/drop /i);
  });

  test('2. the CHECKs of SPEC-001 CA-17 still bite: a confirmation without a person is refused', async () => {
    await sql`insert into teams (id, canonical_name) values ('cd-exemplo', 'CD Exemplo') on conflict do nothing`;

    await expect(
      sql`
        insert into team_aliases (team_id, alias, source, season, status)
        values ('cd-exemplo', 'Exemplo', 'ceroacero', '2026/27', 'confirmed')
      `,
    ).rejects.toThrow(/team_aliases_confirmed_needs_person/);

    await expect(
      sql`
        insert into team_aliases (team_id, alias, source, season, status, confirmed_by, confirmed_at)
        values ('cd-exemplo', 'Exemplo', 'ceroacero', '2026/27', 'confirmed', '', '2026-09-02T10:00:00Z')
      `,
    ).rejects.toThrow(/team_aliases_confirmer_not_empty/);
  });

  test('4. the migration is SQL written by hand: no generator left its mark', () => {
    expect(source).toMatch(/^-- 0004_alias_loads\.sql/);
    expect(source).not.toMatch(/drizzle|prisma|generated by/i);
  });
});
