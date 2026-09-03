/**
 * CA-6.1, CA-6.2, CA-6.3, CA-6.4 y CA-4.3 — `migrations/0008` y las dos tablas
 * del panel (ADR-006, ADR-024 §7 y §8).
 *
 * SE LEE EL ESQUEMA, NO EL CÓDIGO. Que ninguna columna pueda albergar a una
 * persona y que `alerts` no se haya tocado son afirmaciones sobre la base, y
 * un test que leyera el código diría otra cosa el día que el código cambie sin
 * que nadie mire la migración.
 *
 * Importar `_harness` REVIENTA sin `DATABASE_URL_TEST`: sin base real estos
 * criterios son UNMET, no *skipped* (gate del 2026-08-29). `npm run test:db`.
 */
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { migrate, readMigrations } from '@/db/migrate';
import { ADMIN_ACTIONS } from '@/admin/archive';
import { OPERATOR_ACTION_OUTCOMES } from '@/admin/ports';
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

interface Column {
  readonly name: string;
  readonly type: string;
  readonly nullable: boolean;
}

async function columnsOf(table: string): Promise<Column[]> {
  const rows = await sql<{ column_name: string; data_type: string; is_nullable: string }[]>`
    select column_name, data_type, is_nullable
      from information_schema.columns
     where table_schema = 'public' and table_name = ${table}
     order by column_name
  `;
  return rows.map((row) => ({
    name: row.column_name,
    type: row.data_type,
    nullable: row.is_nullable === 'YES',
  }));
}

async function checksOf(table: string): Promise<string[]> {
  const rows = await sql<{ definition: string }[]>`
    select pg_get_constraintdef(c.oid) as definition
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
     where n.nspname = 'public' and t.relname = ${table}
     order by 1
  `;
  return rows.map((row) => row.definition);
}

async function triggersOf(table: string): Promise<string[]> {
  const rows = await sql<{ tgname: string }[]>`
    select tgname
      from pg_trigger g
      join pg_class t on t.oid = g.tgrelid
      join pg_namespace n on n.oid = t.relnamespace
     where n.nspname = 'public' and t.relname = ${table} and not g.tgisinternal
     order by tgname
  `;
  return rows.map((row) => row.tgname);
}

async function seedAlert(): Promise<number> {
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
    values ('m-esquema', 'futgal-preferente-g1', 23, '2026-03-21T17:00:00Z',
            'ud-ourense', 'rc-celta-b', 'O Couto')
    on conflict do nothing
  `;
  const rows = await sql<{ id: number }[]>`
    insert into alerts (match_id, rule, raised_at, reason, observation_ids)
    values ('m-esquema', 'RN-05', '2026-03-21T17:50:00Z', 'discrepan', '{"obs-0001"}'::text[])
    returning id
  `;
  return rows[0]?.id ?? 0;
}

describe('CA-6.1 — `migrations/0008` se aplica en orden sobre 0001..0007', () => {
  test('1. las ocho versiones están en disco, en orden, y `migrate` las aplicó', async () => {
    const onDisk = (await readMigrations()).map((migration) => migration.version);

    expect(onDisk).toEqual([...onDisk].sort());
    for (const version of ['0001', '0002', '0003', '0004', '0005', '0006', '0007', '0008']) {
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

  test('3. las dos tablas existen', async () => {
    const rows = await sql<{ table_name: string }[]>`
      select table_name from information_schema.tables
       where table_schema = 'public'
         and table_name in ('alert_acks', 'operator_actions')
       order by table_name
    `;
    expect(rows.map((row) => row.table_name)).toEqual(['alert_acks', 'operator_actions']);
  });

  test('4. LAS DOS SON APPEND-ONLY: `update` y `delete` reciben el error del trigger', async () => {
    const alertId = await seedAlert();

    await sql`
      insert into alert_acks (alert_id, acked_at, raw_ref)
      values (${alertId}, '2026-03-21T17:55:00Z',
              'operador/acuse/2026-03-21/2026-03-21t17-55-00.000z-0123456789ab.json')
    `;
    await sql`
      insert into operator_actions
        (action, match_id, alert_id, started_at, submitted_at, outcome, raw_ref)
      values ('correccion', 'm-esquema', null, '2026-03-21T17:56:00Z',
              '2026-03-21T17:57:00Z', 'accepted',
              'operador/correccion/2026-03-21/2026-03-21t17-57-00.000z-0123456789ac.json')
    `;

    await expect(
      sql`update alert_acks set acked_at = '2026-03-22T00:00:00Z'`,
    ).rejects.toThrow(/amend|inmutable|immutable|append/i);
    await expect(sql`delete from alert_acks`).rejects.toThrow(/amend|inmutable|immutable|append/i);
    await expect(
      sql`update operator_actions set outcome = 'accepted'`,
    ).rejects.toThrow(/amend|inmutable|immutable|append/i);
    await expect(sql`delete from operator_actions`).rejects.toThrow(
      /amend|inmutable|immutable|append/i,
    );

    expect(await triggersOf('alert_acks')).toContain('alert_acks_are_immutable');
    expect(await triggersOf('operator_actions')).toContain('operator_actions_are_immutable');
  });
});

describe('CA-6.2 — `alerts` NO SE TOCA, y se afirma LEYENDO EL ESQUEMA', () => {
  test('5. sus seis columnas siguen siendo las de `migrations/0006`', async () => {
    expect((await columnsOf('alerts')).map((column) => column.name)).toEqual([
      'id',
      'match_id',
      'observation_ids',
      'raised_at',
      'reason',
      'rule',
    ]);
  });

  test('6. y su trigger sigue siendo el mismo, sin añadidos', async () => {
    expect(await triggersOf('alerts')).toEqual(['alerts_are_immutable']);
  });

  test('7. no hay ninguna columna de acuse dentro de `alerts`', async () => {
    const names = (await columnsOf('alerts')).map((column) => column.name);

    for (const forbidden of ['acked_at', 'seen', 'state', 'status', 'resolved', 'assignee']) {
      expect(names).not.toContain(forbidden);
    }
  });
});

describe('CA-6.3 — ninguna columna puede albergar un identificador de PERSONA', () => {
  /**
   * SE ENUMERA LO PERMITIDO, columna a columna y con su clase, y se exige que
   * el resto sea VACÍO (ADR-016 §3.1). Cada columna es una de cinco cosas:
   * entero de identidad, instante, lista cerrada de palabras, clave ajena a
   * datos del calendario o del motor, o clave del raw store restringida por
   * forma. NO HAY UNA SEXTA, y una columna nueva es roja sin que nadie tenga
   * que saber que existe.
   */
  const DECLARED: readonly {
    table: string;
    column: string;
    kind: 'identity' | 'instant' | 'closed-list' | 'foreign-key' | 'raw-key';
    motive: string;
  }[] = [
    {
      table: 'alert_acks',
      column: 'alert_id',
      kind: 'foreign-key',
      motive:
        'Clave ajena a `alerts`: solo puede contener el identificador de una alerta que el motor escribió. Un entero que apunta a una fila del motor no puede llevar un nombre dentro.',
    },
    {
      table: 'alert_acks',
      column: 'acked_at',
      kind: 'instant',
      motive:
        'Un `timestamptz`: cuándo se reconoció la alerta. En una columna de instante no cabe texto de ningún tipo, y menos un nombre.',
    },
    {
      table: 'alert_acks',
      column: 'raw_ref',
      kind: 'raw-key',
      motive:
        'Una clave del raw store restringida por forma (`like \'operador/%\'`). Es la referencia a un objeto archivado, y es justo donde SÍ vive el `operator_id`: un solo régimen para «quién hizo esto» (ADR-024 §6).',
    },
    {
      table: 'operator_actions',
      column: 'id',
      kind: 'identity',
      motive: 'La identidad de la fila, generada por la base. Un entero.',
    },
    {
      table: 'operator_actions',
      column: 'action',
      kind: 'closed-list',
      motive:
        'Lista cerrada de cuatro palabras, impuesta por un `check`. No es texto libre y no puede contener nada que nadie haya declarado antes.',
    },
    {
      table: 'operator_actions',
      column: 'match_id',
      kind: 'foreign-key',
      motive:
        'Clave ajena a `matches`: solo puede contener un partido del calendario declarado (ADR-017), que es dato de competición y no de persona.',
    },
    {
      table: 'operator_actions',
      column: 'alert_id',
      kind: 'foreign-key',
      motive: 'Clave ajena a `alerts`, igual que la de `alert_acks`.',
    },
    {
      table: 'operator_actions',
      column: 'started_at',
      kind: 'instant',
      motive: 'Un `timestamptz`: el `issued_at` del vale. No cabe texto.',
    },
    {
      table: 'operator_actions',
      column: 'submitted_at',
      kind: 'instant',
      motive: 'Un `timestamptz`: cuándo llegó la acción. No cabe texto.',
    },
    {
      table: 'operator_actions',
      column: 'outcome',
      kind: 'closed-list',
      motive:
        'Lista cerrada de cinco palabras, impuesta por un `check`. El desenlace de la acción, no una descripción.',
    },
    {
      table: 'operator_actions',
      column: 'raw_ref',
      kind: 'raw-key',
      motive:
        'La misma clave del raw store restringida por forma, y nula cuando la acción se rechazó antes de archivar nada (CA-4.2).',
    },
  ];

  test('8. el conjunto de columnas es EXACTAMENTE el declarado, en las dos tablas', async () => {
    for (const table of ['alert_acks', 'operator_actions']) {
      const actual = (await columnsOf(table)).map((column) => column.name).sort();
      const declared = DECLARED.filter((entry) => entry.table === table)
        .map((entry) => entry.column)
        .sort();

      expect(actual, table).toEqual(declared);
    }
  });

  test('9. cada entrada llega con su motivo escrito (ADR-016 §3.2)', () => {
    for (const entry of DECLARED) {
      expect(entry.motive.length, `${entry.table}.${entry.column}`).toBeGreaterThan(40);
    }
  });

  test('10. y NINGUNA de las dos lleva `operator_id` ni nada que se le parezca', async () => {
    for (const table of ['alert_acks', 'operator_actions']) {
      const names = (await columnsOf(table)).map((column) => column.name);

      for (const forbidden of [
        'operator_id',
        'correspondent_id',
        'user_id',
        'telegram_user_id',
        'name',
        'email',
        'ip',
      ]) {
        expect(names, `${table}.${forbidden}`).not.toContain(forbidden);
      }
    }
  });

  test('11. las listas cerradas del esquema son LAS DEL CÓDIGO, no una copia', async () => {
    const checks = (await checksOf('operator_actions')).join('\n');

    for (const action of ADMIN_ACTIONS) expect(checks).toContain(`'${action}'`);
    for (const outcome of OPERATOR_ACTION_OUTCOMES) expect(checks).toContain(`'${outcome}'`);
  });

  test('12. `alert_acks` tiene `unique (alert_id)`: una alerta se reconoce UNA vez', async () => {
    const rows = await sql<{ constraint_type: string }[]>`
      select tc.constraint_type
        from information_schema.table_constraints tc
       where tc.table_schema = 'public'
         and tc.table_name = 'alert_acks'
         and tc.constraint_type = 'UNIQUE'
    `;
    expect(rows).toHaveLength(1);
  });

  test('13. y el `raw_ref` está restringido por forma al prefijo del panel', async () => {
    const acks = (await checksOf('alert_acks')).join('\n');
    const actions = (await checksOf('operator_actions')).join('\n');

    expect(acks).toContain("'operador/%'");
    expect(actions).toContain("'operador/%'");
  });
});

describe('CA-6.4 — «abierta» se calcula: NO hay ninguna columna de estado', () => {
  test('14. ni en `alert_acks` ni en `operator_actions`', async () => {
    for (const table of ['alert_acks', 'operator_actions']) {
      const names = (await columnsOf(table)).map((column) => column.name);

      for (const forbidden of ['state', 'seen', 'open', 'resolved', 'acknowledged', 'is_open']) {
        expect(names, `${table}.${forbidden}`).not.toContain(forbidden);
      }
    }

    // `outcome` NO es un estado de alerta: es el desenlace de una ACCIÓN, que
    // es lo que CA-8.1 obliga a registrar, y es una lista cerrada de cinco
    // palabras que no incluye ninguna de «abierta» ni «reconocida».
    for (const outcome of OPERATOR_ACTION_OUTCOMES) {
      expect(['open', 'acknowledged', 'seen', 'resolved']).not.toContain(outcome);
    }
  });
});

describe('CA-4.3 — `migrations/0008` NO añade ninguna columna al modelo canónico', () => {
  test('15. las seis tablas del modelo siguen con sus columnas de siempre', async () => {
    const expected: Readonly<Record<string, readonly string[]>> = {
      observations: [
        'away_score',
        'confidence',
        'created_at',
        'home_score',
        'id',
        'match_id',
        'observed_at',
        'raw_ref',
        'source',
        'status',
      ],
      decisions: [
        'away_score',
        'created_at',
        'decided_at',
        'home_score',
        'match_id',
        'provisional',
        'rule',
        'status',
        'supporting_observation_ids',
        'version',
      ],
      matches: [
        'away_id',
        'competition_id',
        'created_at',
        'home_id',
        'id',
        'kickoff',
        'round',
        'venue',
      ],
      competitions: ['created_at', 'group', 'id', 'name', 'season'],
      teams: ['canonical_name', 'created_at', 'id'],
      alerts: ['id', 'match_id', 'observation_ids', 'raised_at', 'reason', 'rule'],
    };

    for (const [table, columns] of Object.entries(expected)) {
      expect((await columnsOf(table)).map((column) => column.name), table).toEqual([...columns]);
    }
  });

  test('16. y `src/model/` no gana ningún campo: la migración no lo nombra', async () => {
    const { readFile } = await import('node:fs/promises');
    const migration = await readFile('migrations/0008_admin.sql', 'utf8');
    const statements = migration.replaceAll(/^--.*$/gm, '');

    // Ni un `alter table` sobre nada, que es la única forma de añadir columna.
    expect(statements.toLowerCase()).not.toContain('alter table');
  });
});
