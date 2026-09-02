/**
 * CA-4 — `PostgresAliasStore`: the catalogue is read parsed, complete and in
 * stable order (SPEC-011 §4, ADR-006).
 *
 * Importing `_harness` THROWS without `DATABASE_URL_TEST`: without a real
 * Postgres this criterion is UNMET, not skipped (gate of 2026-08-29).
 *
 * The port's absence of `insert`/`update`/`delete` is fixed at the TYPE level
 * in `tests/types/spec011-alias-store.test-d.ts`, like SPEC-010 CA-7.7.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { declareAliasCatalog } from '@/alias/catalog';
import { declareCalendar } from '@/calendar/declared';
import { loadAliasCatalog, PostgresAliasStore } from '@/db/aliases';
import { loadSchedule } from '@/db/calendar';
import type { Sql } from '@/db/client';
import { InstantSchema } from '@/model/ids';
import type { Instant, SourceId } from '@/model/ids';
import type { Clock } from '@/polite/clock';
import {
  ALIAS_SEASON,
  ALIAS_SOURCE,
  aliasCatalogBytes,
  aliasCatalogFixture,
} from '../fixtures/aliases';
import { calendarBytes, calendarFixture } from '../fixtures/calendar';
import { connect, resetAndMigrate } from './_harness';

const frozen: Clock = { now: () => '2026-09-02T12:00:00.000Z' as Instant };
const SOURCE = ALIAS_SOURCE as SourceId;

let sql: Sql;
let store: PostgresAliasStore;

beforeAll(async () => {
  sql = connect();
  await resetAndMigrate(sql);
  store = new PostgresAliasStore(sql);
});

beforeEach(async () => {
  await sql.unsafe(
    'truncate alias_loads, team_aliases, calendar_loads, observations, decisions, matches, teams, competitions cascade',
  );
  await loadSchedule(sql, declareCalendar(calendarBytes(calendarFixture)), { clock: frozen });
  await loadAliasCatalog(sql, declareAliasCatalog(aliasCatalogBytes(aliasCatalogFixture)), {
    clock: frozen,
  });
});

afterAll(async () => {
  await sql.end();
});

describe('CA-4 — listBySource', () => {
  test('returns the whole catalogue, parsed and frozen, ordered by alias then team_id', async () => {
    const catalog = await store.listBySource(SOURCE, ALIAS_SEASON);

    expect(catalog).toHaveLength(aliasCatalogFixture.aliases.length);
    const expected = aliasCatalogFixture.aliases
      .map((entry) => ({ alias: entry.alias, team_id: entry.team_id }))
      .sort((a, b) =>
        a.alias < b.alias ? -1 : a.alias > b.alias ? 1 : a.team_id < b.team_id ? -1 : 1,
      );
    expect(catalog.map((entry) => ({ alias: entry.alias, team_id: entry.team_id }))).toEqual(
      expected,
    );

    for (const entry of catalog) {
      expect(Object.isFrozen(entry)).toBe(true);
      expect(entry.status).toBe('confirmed');
    }
    const confirmed = catalog.flatMap((entry) => (entry.status === 'confirmed' ? [entry] : []));
    expect(confirmed).toHaveLength(catalog.length);
    for (const entry of confirmed) {
      // A `Z` STRING that satisfies the canonical instant, never a Date (ADR-006).
      expect(typeof entry.confirmed_at).toBe('string');
      expect(() => InstantSchema.parse(entry.confirmed_at)).not.toThrow();
      expect(entry.confirmed_by).toBe('Persoa de Proba');
    }
  });

  test('nothing of another source, nothing of another season', async () => {
    await sql`
      insert into team_aliases (team_id, alias, source, season, status, confirmed_by, confirmed_at)
      values
        ('ud-ourense', 'Ourense UD', 'besoccer', ${ALIAS_SEASON}, 'confirmed', 'Outra Persoa', '2026-09-01T10:00:00Z'),
        ('ud-ourense', 'O Vello Ourense', ${ALIAS_SOURCE}, '2027/28', 'confirmed', 'Outra Persoa', '2026-09-01T10:00:00Z')
    `;

    const catalog = await store.listBySource(SOURCE, ALIAS_SEASON);

    expect(catalog.map((entry) => entry.alias)).not.toContain('Ourense UD');
    expect(catalog.map((entry) => entry.alias)).not.toContain('O Vello Ourense');
    expect(catalog).toHaveLength(aliasCatalogFixture.aliases.length);
  });

  test('a proposed row comes back as the proposed branch, with no trace of confirmation', async () => {
    // Valid for the CHECKs of 0001: proposed carries no person (SPEC-001 CA-17).
    await sql`
      insert into team_aliases (team_id, alias, source, season, status)
      values ('sd-inventada', 'A Inventada', ${ALIAS_SOURCE}, ${ALIAS_SEASON}, 'proposed')
    `;

    const catalog = await store.listBySource(SOURCE, ALIAS_SEASON);
    const proposed = catalog.find((entry) => entry.alias === 'A Inventada');

    expect(proposed).toBeDefined();
    expect(proposed!.status).toBe('proposed');
    expect('confirmed_by' in proposed!).toBe(false);
    expect('confirmed_at' in proposed!).toBe(false);
  });
});
