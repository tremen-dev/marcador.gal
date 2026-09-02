/**
 * CA-15.4, CA-2.1 (mitad de esquema) y CA-10.1 — `migrations/0007` y las tres
 * tablas del bot (ADR-006, ADR-022 §4, ADR-023 §4).
 *
 * Importar `_harness` REVIENTA sin `DATABASE_URL_TEST`: sin base real estos
 * criterios son UNMET, no *skipped* (gate del 2026-08-29). `npm run test:db`.
 */
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { migrate, readMigrations } from '@/db/migrate';
import { connect, dropEverything } from './_harness';
import type { Sql } from '@/db/client';

const sql: Sql = connect();

beforeAll(async () => {
  await dropEverything(sql);
  await migrate(sql);
});

afterAll(async () => {
  await sql.end();
});

async function columnsOf(table: string): Promise<{ name: string; type: string }[]> {
  const rows = await sql<{ column_name: string; data_type: string }[]>`
    select column_name, data_type
      from information_schema.columns
     where table_schema = 'public' and table_name = ${table}
     order by column_name
  `;
  return rows.map((row) => ({ name: row.column_name, type: row.data_type }));
}

describe('CA-15.4 — `migrations/0007` se aplica en orden sobre 0001..0006', () => {
  test('1. las siete versiones están en disco, en orden, y `migrate` las aplicó', async () => {
    const onDisk = (await readMigrations()).map((migration) => migration.version);

    expect(onDisk).toEqual([...onDisk].sort());
    for (const version of ['0001', '0002', '0003', '0004', '0005', '0006', '0007']) {
      expect(onDisk).toContain(version);
    }

    const applied = await sql<{ version: string }[]>`
      select version from schema_migrations order by version
    `;
    expect(applied.map((row) => row.version)).toEqual(onDisk);
  });

  test('2. la segunda ejecución no aplica nada', async () => {
    expect(await migrate(sql)).toEqual([]);
  });

  test('3. las tres tablas existen', async () => {
    const rows = await sql<{ table_name: string }[]>`
      select table_name from information_schema.tables
       where table_schema = 'public'
         and table_name in ('bot_proposals', 'correspondent_state', 'bot_rejections')
       order by table_name
    `;
    expect(rows.map((row) => row.table_name)).toEqual([
      'bot_proposals',
      'bot_rejections',
      'correspondent_state',
    ]);
  });
});

describe('CA-2.1 — `bot_rejections` no tiene NINGUNA columna capaz de albergar a una persona', () => {
  test('4. leyendo el ESQUEMA de la tabla, no el código', async () => {
    const columns = await columnsOf('bot_rejections');

    expect(columns).toEqual([
      { name: 'count', type: 'integer' },
      { name: 'day', type: 'date' },
      { name: 'reason', type: 'text' },
    ]);
  });

  test('5. y su única columna de texto está atada a una LISTA CERRADA de tres valores', async () => {
    const checks = await sql<{ definition: string }[]>`
      select pg_get_constraintdef(oid) as definition
        from pg_constraint
       where conrelid = 'bot_rejections'::regclass and contype = 'c'
    `;
    const reason = checks.map((row) => row.definition).find((def) => def.includes('reason'));

    expect(reason).toBeDefined();
    expect(reason ?? '').toContain('unauthorised');
    expect(reason ?? '').toContain('out_of_matchday');
    expect(reason ?? '').toContain('notice_pending');
  });

  test('6. control positivo: la base RECHAZA un motivo fuera de la lista', async () => {
    await expect(
      sql`insert into bot_rejections (day, reason, count) values ('2026-03-21', 'corresponsal-01', 1)`,
    ).rejects.toThrow(/violates check constraint/);
  });

  test('7. y no hay ningún instante exacto: con un corresponsal sería un rastro de actividad', async () => {
    const columns = (await columnsOf('bot_rejections')).map((column) => column.type);
    expect(columns).not.toContain('timestamp with time zone');
  });
});

describe('CA-10.1 — ninguna tabla APPEND-ONLY lleva el `correspondent_id`', () => {
  test('8. enumerando las columnas de TODAS las tablas del esquema, no una lista a mano', async () => {
    const rows = await sql<{ table_name: string; column_name: string }[]>`
      select table_name, column_name
        from information_schema.columns
       where table_schema = 'public'
       order by table_name, column_name
    `;

    // La lista de tablas sale del esquema; lo único escrito a mano es cuáles
    // son append-only, que es una decisión de diseño y no un descubrimiento.
    const appendOnly = ['observations', 'decisions', 'alerts', 'ingest_attempts', 'bot_rejections'];
    const offenders = rows
      .filter((row) => appendOnly.includes(row.table_name))
      .filter((row) => row.column_name.includes('correspondent'));

    expect(offenders).toEqual([]);
  });

  test('9. y las dos que sí lo llevan NO son append-only, y su forma está impuesta', async () => {
    const holders = await sql<{ table_name: string }[]>`
      select distinct table_name from information_schema.columns
       where table_schema = 'public' and column_name = 'correspondent_id'
       order by table_name
    `;
    expect(holders.map((row) => row.table_name)).toEqual([
      'bot_proposals',
      'correspondent_state',
    ]);

    // Ninguna de las dos tiene el trigger que hace append-only al resto.
    const triggers = await sql<{ event_object_table: string }[]>`
      select event_object_table from information_schema.triggers
       where trigger_schema = 'public'
         and event_object_table in ('bot_proposals', 'correspondent_state')
    `;
    expect(triggers).toEqual([]);
  });

  test('10. la forma `corresponsal-\\d+` la impone la BASE, no solo zod (CA-2.8)', async () => {
    await expect(
      sql`insert into correspondent_state (correspondent_id) values ('corresponsal-xove')`,
    ).rejects.toThrow(/violates check constraint/);
    await expect(
      sql`insert into correspondent_state (correspondent_id) values ('corresponsal-alberto')`,
    ).rejects.toThrow(/violates check constraint/);

    await sql`insert into correspondent_state (correspondent_id) values ('corresponsal-07')`;
    await sql`delete from correspondent_state where correspondent_id = 'corresponsal-07'`;
  });

  test('11. y la regla de marcador de SPEC-001 CA-18 también rige en `bot_proposals`', async () => {
    await sql`
      insert into competitions (id, name, season, "group")
      values ('futgal-preferente-g1', 'Preferente Futgal', '2026/27', '1')
      on conflict do nothing
    `;
    await sql`
      insert into teams (id, canonical_name)
      values ('ud-ourense', 'UD Ourense'), ('rc-celta-b', 'Celta B')
      on conflict do nothing
    `;
    await sql`
      insert into matches (id, competition_id, round, kickoff, home_id, away_id, venue)
      values ('m-schema-1', 'futgal-preferente-g1', 23, '2026-03-21T17:00:00Z',
              'ud-ourense', 'rc-celta-b', null)
      on conflict do nothing
    `;

    // `live` sin marcador: rechazado.
    await expect(
      sql`
        insert into bot_proposals
          (id, correspondent_id, match_id, status, home_score, away_score, minute,
           message_raw_ref, proposal_raw_ref, created_at, expires_at)
        values ('p-bad-1', 'corresponsal-01', 'm-schema-1', 'live', null, null, 10,
                'a', 'b', '2026-03-21T17:30:00Z', '2026-03-21T17:40:00Z')
      `,
    ).rejects.toThrow(/violates check constraint/);

    // `postponed` CON marcador: rechazado.
    await expect(
      sql`
        insert into bot_proposals
          (id, correspondent_id, match_id, status, home_score, away_score, minute,
           message_raw_ref, proposal_raw_ref, created_at, expires_at)
        values ('p-bad-2', 'corresponsal-01', 'm-schema-1', 'postponed', 1, 0, null,
                'a', 'b', '2026-03-21T17:30:00Z', '2026-03-21T17:40:00Z')
      `,
    ).rejects.toThrow(/violates check constraint/);
  });
});
