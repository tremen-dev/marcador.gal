/**
 * CA-2 — the load REPLACES the catalogue of its source and season, whole, in
 * one transaction, and touches nothing else (ADR-018 §2) — and CA-3 — every
 * load leaves an immutable record of who declared the catalogue, when and
 * from which bytes.
 *
 * Importing `_harness` THROWS without `DATABASE_URL_TEST`: without a real
 * Postgres these criteria are UNMET, not skipped (gate of 2026-08-29).
 *
 * The seed of `_harness.ts` is NOT used here and NOT modified (CA-2.8): these
 * cases start from a clean schema, load the synthetic calendar of SPEC-010
 * themselves (its teams are the foreign key `team_aliases` needs), and then
 * load the synthetic catalogue.
 */
import { createHash } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { declareAliasCatalog } from '@/alias/catalog';
import { declareCalendar } from '@/calendar/declared';
import { loadAliasCatalog, PostgresAliasStore, UnknownTeamError } from '@/db/aliases';
import { loadSchedule } from '@/db/calendar';
import type { Sql } from '@/db/client';
import type { Instant, SourceId } from '@/model/ids';
import { resolveConfirmedAlias } from '@/model/team';
import type { Clock } from '@/polite/clock';
import {
  ALIAS_SEASON,
  ALIAS_SOURCE,
  aliasCatalogBytes,
  aliasCatalogFixture,
  cloneAliasCatalog,
} from '../fixtures/aliases';
import type { AliasCatalogFixture } from '../fixtures/aliases';
import { calendarBytes, calendarFixture } from '../fixtures/calendar';
import { connect, resetAndMigrate } from './_harness';

type Mutable<T> = { -readonly [K in keyof T]: Mutable<T[K]> };

const T_LOAD = '2026-09-02T12:00:00.000Z' as Instant;
const frozen: Clock = { now: () => T_LOAD };

/** `declared_at` of the fixture (`+02:00`), normalised to `Z` (ADR-006). */
const DECLARED_AT_Z = '2026-09-02T09:00:00.000Z';

function variant(edit: (draft: Mutable<AliasCatalogFixture>) => void): AliasCatalogFixture {
  const draft = cloneAliasCatalog(aliasCatalogFixture) as Mutable<AliasCatalogFixture>;
  edit(draft);
  return draft;
}

const load = (
  sql: Sql,
  fixture: AliasCatalogFixture = aliasCatalogFixture,
  clock: Clock = frozen,
) => loadAliasCatalog(sql, declareAliasCatalog(aliasCatalogBytes(fixture)), { clock });

let sql: Sql;

beforeAll(async () => {
  sql = connect();
  await resetAndMigrate(sql);
});

beforeEach(async () => {
  // TRUNCATE fires no FOR EACH ROW trigger, so the append-only tables clean
  // up without weakening RN-13 (SPEC-001 CA-16).
  await sql.unsafe(
    'truncate alias_loads, team_aliases, calendar_loads, observations, decisions, matches, teams, competitions cascade',
  );
  await loadSchedule(sql, declareCalendar(calendarBytes(calendarFixture)), { clock: frozen });
});

afterAll(async () => {
  await sql.end();
});

interface AliasRow {
  readonly team_id: string;
  readonly alias: string;
  readonly source: string;
  readonly season: string;
  readonly status: string;
  readonly confirmed_by: string | null;
  readonly confirmed_at: string | null;
}

async function aliasesInDb(source = ALIAS_SOURCE, season = ALIAS_SEASON): Promise<AliasRow[]> {
  return sql<AliasRow[]>`
    select team_id, alias, source, season, status, confirmed_by, confirmed_at
      from team_aliases
     where source = ${source} and season = ${season}
     order by alias, team_id
  `;
}

const pair = (entry: { alias: string; team_id: string }) => ({
  alias: entry.alias,
  team_id: entry.team_id,
});
const byAlias = (a: { alias: string }, b: { alias: string }) => a.alias.localeCompare(b.alias);

async function loadCount(): Promise<number> {
  const [row] = await sql<{ count: string }[]>`select count(*) as count from alias_loads`;
  return Number(row!.count);
}

describe('CA-2 — the load replaces the catalogue of its source and season', () => {
  test('1. the table holds exactly the file, all confirmed by the declarer, and the result lists it', async () => {
    const result = await load(sql);

    const rows = await aliasesInDb();
    expect(rows).toHaveLength(aliasCatalogFixture.aliases.length);
    expect(rows.map(pair).sort(byAlias)).toEqual(
      aliasCatalogFixture.aliases.map(pair).sort(byAlias),
    );
    for (const row of rows) {
      expect(row.status).toBe('confirmed');
      expect(row.confirmed_by).toBe('Persoa de Proba');
      expect(row.confirmed_at).toBe(DECLARED_AT_Z);
    }

    expect([...result.inserted].map(pair).sort(byAlias)).toEqual(
      aliasCatalogFixture.aliases.map(pair).sort(byAlias),
    );
    expect(result.removed).toEqual([]);
  });

  test('2. loading the same file again leaves the table identical and reports nothing', async () => {
    await load(sql);
    const before = await aliasesInDb();

    const again = await load(sql);

    expect(await aliasesInDb()).toEqual(before);
    expect(again.inserted).toEqual([]);
    expect(again.removed).toEqual([]);
  });

  test('3. an added, a retired and a repointed entry: the table equals the new file and the retired one stops resolving', async () => {
    await load(sql);

    const edited = variant((draft) => {
      // Retired: `Ourense` leaves the file.
      draft.aliases = draft.aliases.filter((entry) => entry.alias !== 'Ourense');
      // Repointed: the same spelling towards another team.
      const celta = draft.aliases.find((entry) => entry.alias === 'Celta de Vigo B')!;
      celta.team_id = 'cd-exemplo';
      // Added.
      draft.aliases.push({ alias: 'Novo Exemplo', team_id: 'cd-exemplo' });
    });
    const result = await load(sql, edited);

    const rows = await aliasesInDb();
    expect(rows.map(pair).sort(byAlias)).toEqual(edited.aliases.map(pair).sort(byAlias));

    // The result names the three: the added and the repointed pair as
    // inserted, the retired and the repointed OLD pair as removed.
    expect([...result.inserted].map(pair).sort(byAlias)).toEqual([
      { alias: 'Celta de Vigo B', team_id: 'cd-exemplo' },
      { alias: 'Novo Exemplo', team_id: 'cd-exemplo' },
    ]);
    expect([...result.removed].map(pair).sort(byAlias)).toEqual([
      { alias: 'Celta de Vigo B', team_id: 'rc-celta-b' },
      { alias: 'Ourense', team_id: 'ud-ourense' },
    ]);

    // And the retired spelling NO LONGER RESOLVES (ADR-018 §2): this is the
    // decision the replacement exists for. `resolveConfirmedAlias` over
    // `listBySource`, as the resolver does it.
    const store = new PostgresAliasStore(sql);
    const catalog = await store.listBySource(ALIAS_SOURCE as SourceId, ALIAS_SEASON);
    const query = { source: ALIAS_SOURCE as SourceId, season: ALIAS_SEASON };
    expect(resolveConfirmedAlias(catalog, { ...query, alias: 'Ourense' })).toBeNull();
    // While the repointed spelling resolves to its NEW team in the same load.
    expect(resolveConfirmedAlias(catalog, { ...query, alias: 'Celta de Vigo B' })).toBe(
      'cd-exemplo',
    );
  });

  test('4. rows of another source and another season are not touched', async () => {
    await sql`
      insert into team_aliases (team_id, alias, source, season, status, confirmed_by, confirmed_at)
      values
        ('ud-ourense', 'Ourense UD', 'besoccer', ${ALIAS_SEASON}, 'confirmed', 'Outra Persoa', '2026-09-01T10:00:00Z'),
        ('ud-ourense', 'Ourense', ${ALIAS_SOURCE}, '2027/28', 'confirmed', 'Outra Persoa', '2026-09-01T10:00:00Z')
    `;

    await load(sql);

    expect(await aliasesInDb('besoccer', ALIAS_SEASON)).toHaveLength(1);
    expect(await aliasesInDb(ALIAS_SOURCE, '2027/28')).toHaveLength(1);
  });

  test('5. a proposed row of the same source and season disappears with the load (ADR-018 §2)', async () => {
    await sql`
      insert into team_aliases (team_id, alias, source, season, status)
      values ('sd-inventada', 'A Inventada', ${ALIAS_SOURCE}, ${ALIAS_SEASON}, 'proposed')
    `;

    await load(sql);

    const rows = await aliasesInDb();
    expect(rows.map((row) => row.alias)).not.toContain('A Inventada');
    expect(rows.every((row) => row.status === 'confirmed')).toBe(true);
  });

  test('6. a team_id that does not exist in teams refuses the whole load, naming it, and nothing changed', async () => {
    await load(sql);
    const before = await aliasesInDb();
    const loadsBefore = await loadCount();

    const ghost = variant((draft) => {
      draft.aliases.push({ alias: 'Pantasma FC', team_id: 'cf-pantasma' });
    });

    await expect(load(sql, ghost)).rejects.toThrow(UnknownTeamError);
    await expect(load(sql, ghost)).rejects.toThrow(/cf-pantasma/);

    expect(await aliasesInDb()).toEqual(before);
    expect(await loadCount()).toBe(loadsBefore);
  });

  test('7. all or nothing: a failure mid-transaction leaves every table as it was', async () => {
    await load(sql);
    const before = await aliasesInDb();
    const loadsBefore = await loadCount();

    const edited = variant((draft) => {
      draft.aliases.push({ alias: 'Novo Exemplo', team_id: 'cd-exemplo' });
    });
    // The clock hands back something `timestamptz` refuses, so the failure
    // lands on the LAST insert of the transaction — after the delete and the
    // inserts have already run inside it.
    const broken: Clock = { now: () => 'not-an-instant' as Instant };

    await expect(load(sql, edited, broken)).rejects.toThrow();

    expect(await aliasesInDb()).toEqual(before);
    expect(await loadCount()).toBe(loadsBefore);
  });
});

describe('CA-3 — every load leaves an immutable record', () => {
  interface LoadRow {
    readonly source: string;
    readonly season: string;
    readonly declared_by: string;
    readonly declared_at: string;
    readonly loaded_at: string;
    readonly file_digest: string;
    readonly aliases_count: number;
    readonly inserted: number;
    readonly removed: number;
  }

  const loadRows = () =>
    sql<LoadRow[]>`
      select source, season, declared_by, declared_at, loaded_at, file_digest,
             aliases_count, inserted, removed
        from alias_loads order by id
    `;

  test('who declared, when, from which bytes, and what the load did', async () => {
    const result = await load(sql);

    const rows = await loadRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      source: ALIAS_SOURCE,
      season: ALIAS_SEASON,
      declared_by: 'Persoa de Proba',
      declared_at: DECLARED_AT_Z,
      loaded_at: T_LOAD,
      file_digest: createHash('sha256').update(aliasCatalogBytes(aliasCatalogFixture)).digest('hex'),
      aliases_count: aliasCatalogFixture.aliases.length,
      inserted: result.inserted.length,
      removed: 0,
    });
    expect(result.load_id).toBeGreaterThanOrEqual(1);
  });

  test('1. loading again adds ANOTHER row with inserted = 0: loading is a fact even when nothing changed', async () => {
    await load(sql);
    await load(sql);

    const rows = await loadRows();
    expect(rows).toHaveLength(2);
    expect(rows[1]!.inserted).toBe(0);
    expect(rows[1]!.removed).toBe(0);
    expect(rows[1]!.aliases_count).toBe(aliasCatalogFixture.aliases.length);
  });

  test('2. update and delete are refused by the database (RN-13 by analogy)', async () => {
    await load(sql);

    await expect(sql`update alias_loads set inserted = 99`).rejects.toThrow(/append-only/);
    await expect(sql`delete from alias_loads`).rejects.toThrow(/append-only/);
  });

  test('3. the empty string in declared_by is nobody, and the database refuses it', async () => {
    await expect(
      sql`
        insert into alias_loads
          (source, season, declared_by, declared_at, loaded_at, file_digest, aliases_count, inserted, removed)
        values
          (${ALIAS_SOURCE}, ${ALIAS_SEASON}, '', ${DECLARED_AT_Z}, ${T_LOAD},
           ${'0'.repeat(64)}, 1, 1, 0)
      `,
    ).rejects.toThrow(/declared_by/);
  });
});
