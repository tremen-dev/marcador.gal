/**
 * CA-14 — the schema and the zod schemas cannot drift apart in silence.
 *
 * This is the test that fails the day someone adds a field to `Observation`
 * and forgets the migration, or the other way round. Without it, the decision
 * of ADR-006 to go without an ORM is a bad decision.
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

/**
 * The exceptions, declared here and nowhere else.
 *
 * `dbOnly` — columns that exist only in Postgres.
 * `zodOnly` — keys of the canonical model that are a RELATION and live in
 *   their own table. `Team.aliases` is the only one: dominio.md defines a Team
 *   as carrying its aliases, and CA-17 requires them to be their own table
 *   with their own UNIQUE. Both statements are true; the bridge is declared,
 *   not silent.
 */
const tables: ReadonlyArray<{
  readonly table: string;
  readonly schema: ZodType;
  readonly dbOnly: readonly string[];
  readonly zodOnly: readonly string[];
}> = [
  { table: 'competitions', schema: CompetitionSchema, dbOnly: ['created_at'], zodOnly: [] },
  { table: 'teams', schema: TeamSchema, dbOnly: ['created_at'], zodOnly: ['aliases'] },
  { table: 'team_aliases', schema: TeamAliasSchema, dbOnly: ['created_at'], zodOnly: [] },
  { table: 'matches', schema: MatchSchema, dbOnly: ['created_at'], zodOnly: [] },
  { table: 'observations', schema: ObservationSchema, dbOnly: ['created_at'], zodOnly: [] },
  { table: 'decisions', schema: DecisionSchema, dbOnly: ['created_at'], zodOnly: [] },
];

let sql: Sql;

beforeAll(async () => {
  sql = connect();
  await resetAndMigrate(sql);
});

afterAll(async () => {
  await sql.end();
});

describe('CA-14 — column names against zod keys', () => {
  test.each(tables)('$table', async ({ table, schema, dbOnly, zodOnly }) => {
    const rows = await sql<{ column_name: string }[]>`
      select column_name
        from information_schema.columns
       where table_schema = 'public' and table_name = ${table}
    `;

    expect(rows.length).toBeGreaterThan(0);

    const columns = rows
      .map((row) => row.column_name)
      .filter((name) => !dbOnly.includes(name))
      .sort();

    const expected = [...schemaKeys(schema)].filter((key) => !zodOnly.includes(key)).sort();

    expect(columns).toEqual(expected);
  });
});
