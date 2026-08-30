/**
 * CA-14 — the schema and the zod schemas cannot drift apart in silence, and
 * every exception is justified one at a time.
 *
 * This is the test that fails the day someone adds a field to `Observation` and
 * forgets the migration, or the other way round. Without it, the decision of
 * ADR-006 to go without an ORM is a bad decision.
 *
 * Rewritten for the amendment of 2026-08-29 (§2). The two exception lists are
 * no longer lists of names — a list of names is a form you fill in, not a net.
 * They are MAPS with a written reason, and they carry three closures:
 *
 *  1. every `zodOnly` entry names the TABLE where the datum actually lives, and
 *     the test checks against `information_schema` that the table exists and has
 *     a foreign key towards the table the key is excluded from. A field someone
 *     forgot to migrate has no table to point at, so it cannot hide here: the
 *     only way to silence it would be to invent the table and its FK, which is
 *     exactly the work that was being skipped;
 *  2. an UNUSED entry fails, in both maps. An exception list that outlives the
 *     field that justified it is how these nets rot;
 *  3. an empty reason fails.
 *
 * And the maps are closed: any other difference fails, with no warning level in
 * between.
 *
 * NOT YET VERIFIED: needs `DATABASE_URL_TEST`.
 */
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import type { ZodType } from 'zod';
import {
  CompetitionSchema,
  DecisionSchema,
  MatchSchema,
  ObservationSchema,
  TeamAliasSchema,
  TeamSchema,
} from '@/model';
import type { Sql } from '@/db/client';
import { connect, resetAndMigrate } from './_harness';
import { schemaKeys } from '../schema-keys';

/** A column that exists only in Postgres, and why. */
type DbOnly = Readonly<Record<string, string>>;

/**
 * A key of the canonical model that is NOT a column because it is a relation
 * materialised in its own table. `table` is where the datum lives and is
 * verified; `reason` is why.
 */
interface ZodOnlyEntry {
  readonly table: string;
  readonly reason: string;
}
type ZodOnly = Readonly<Record<string, ZodOnlyEntry>>;

const CREATED_AT: DbOnly = {
  created_at: 'Fila de auditoría de la base; no es del modelo canónico (ADR-006).',
};

const tables: ReadonlyArray<{
  readonly table: string;
  readonly schema: ZodType;
  readonly dbOnly: DbOnly;
  readonly zodOnly: ZodOnly;
}> = [
  { table: 'competitions', schema: CompetitionSchema, dbOnly: CREATED_AT, zodOnly: {} },
  {
    table: 'teams',
    schema: TeamSchema,
    dbOnly: CREATED_AT,
    zodOnly: {
      aliases: {
        table: 'team_aliases',
        reason:
          'Refinamiento §1 de SPEC-001 + CA-17: dominio.md define Team como ' +
          '(id, canonical_name, aliases[]) y RN-09 exige que cada alias tenga ' +
          'estado e identidad (alias, source, season) con su propio UNIQUE. ' +
          'Ambas cosas a la vez hacen de `aliases` una relación, no una columna.',
      },
    },
  },
  { table: 'team_aliases', schema: TeamAliasSchema, dbOnly: CREATED_AT, zodOnly: {} },
  { table: 'matches', schema: MatchSchema, dbOnly: CREATED_AT, zodOnly: {} },
  { table: 'observations', schema: ObservationSchema, dbOnly: CREATED_AT, zodOnly: {} },
  { table: 'decisions', schema: DecisionSchema, dbOnly: CREATED_AT, zodOnly: {} },
];

let sql: Sql;

beforeAll(async () => {
  sql = connect();
  await resetAndMigrate(sql);
});

afterAll(async () => {
  await sql.end();
});

async function columnsOf(table: string): Promise<string[]> {
  const rows = await sql<{ column_name: string }[]>`
    select column_name
      from information_schema.columns
     where table_schema = 'public' and table_name = ${table}
  `;

  return rows.map((row) => row.column_name);
}

async function tableExists(table: string): Promise<boolean> {
  const rows = await sql<{ table_name: string }[]>`
    select table_name
      from information_schema.tables
     where table_schema = 'public' and table_name = ${table}
  `;

  return rows.length === 1;
}

/** Foreign keys declared on `child` that point at `parent`. */
async function foreignKeysTowards(child: string, parent: string): Promise<string[]> {
  const rows = await sql<{ constraint_name: string }[]>`
    select distinct tc.constraint_name
      from information_schema.table_constraints tc
      join information_schema.constraint_column_usage ccu
        on ccu.constraint_schema = tc.constraint_schema
       and ccu.constraint_name = tc.constraint_name
     where tc.constraint_type = 'FOREIGN KEY'
       and tc.table_schema = 'public'
       and tc.table_name = ${child}
       and ccu.table_schema = 'public'
       and ccu.table_name = ${parent}
  `;

  return rows.map((row) => row.constraint_name);
}

describe('CA-14 — column names against zod keys', () => {
  test.each(tables)('$table', async ({ table, schema, dbOnly, zodOnly }) => {
    const columns = await columnsOf(table);
    const keys = [...schemaKeys(schema)];

    expect(columns.length).toBeGreaterThan(0);

    // 4. The two maps are closed: nothing else may differ.
    const remainingColumns = columns.filter((name) => !(name in dbOnly)).sort();
    const remainingKeys = keys.filter((key) => !(key in zodOnly)).sort();

    expect(remainingColumns).toEqual(remainingKeys);
  });
});

describe('CA-14 — every exception is justified, one at a time', () => {
  test.each(tables)('$table — no dead dbOnly entry', async ({ table, dbOnly }) => {
    const columns = await columnsOf(table);

    for (const column of Object.keys(dbOnly)) {
      // 2. An exception must not outlive the column that justified it.
      expect(columns, `dbOnly declares "${column}" but ${table} has no such column`).toContain(
        column,
      );
    }
  });

  test.each(tables)('$table — no dead zodOnly entry', ({ table, schema, zodOnly }) => {
    const keys = schemaKeys(schema);

    for (const key of Object.keys(zodOnly)) {
      // 2. Likewise: the zod key it excuses has to still be in the schema.
      expect(
        keys.has(key),
        `zodOnly declares "${key}" but the zod schema of ${table} has no such key`,
      ).toBe(true);
    }
  });

  test.each(tables)('$table — every reason is written', ({ dbOnly, zodOnly }) => {
    // 3. No reason, no exception.
    for (const [column, reason] of Object.entries(dbOnly)) {
      expect(reason.trim().length, `dbOnly["${column}"] has no reason`).toBeGreaterThan(0);
    }

    for (const [key, entry] of Object.entries(zodOnly)) {
      expect(entry.reason.trim().length, `zodOnly["${key}"] has no reason`).toBeGreaterThan(0);
      expect(entry.table.trim().length, `zodOnly["${key}"] names no table`).toBeGreaterThan(0);
    }
  });

  test.each(tables)('$table — every zodOnly entry points at a real table', async ({
    zodOnly,
  }) => {
    for (const [key, entry] of Object.entries(zodOnly)) {
      // 1a. The table where the datum lives has to exist...
      expect(
        await tableExists(entry.table),
        `zodOnly["${key}"] points at table "${entry.table}", which does not exist`,
      ).toBe(true);
    }
  });

  test.each(tables)('$table — every zodOnly entry is held by a foreign key', async ({
    table,
    zodOnly,
  }) => {
    for (const [key, entry] of Object.entries(zodOnly)) {
      // 1b. ...and it has to be tied back to the table the key was excused
      // from. A field nobody migrated has no such table and no such FK.
      const fks = await foreignKeysTowards(entry.table, table);

      expect(
        fks.length,
        `zodOnly["${key}"]: "${entry.table}" has no foreign key towards "${table}"`,
      ).toBeGreaterThan(0);
    }
  });
});
