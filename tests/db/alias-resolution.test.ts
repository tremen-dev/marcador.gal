/**
 * CA-6 — the pieces fit for real: loaded catalogue + loaded calendar +
 * real resolver produce the `Observation` with the correct identity.
 *
 * This is the first time the «DEFINED HERE AND NOT IMPLEMENTED» of
 * `src/ingest/ports.ts` (SPEC-008) is closed with real code at BOTH ends:
 * `readRows` on one side, `catalogMatchResolver` over `PostgresAliasStore`
 * and `PostgresMatchStore` on the other, against a real Postgres.
 *
 * Importing `_harness` THROWS without `DATABASE_URL_TEST`: without a real
 * Postgres this criterion is UNMET, not skipped (gate of 2026-08-29).
 */
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { declareAliasCatalog } from '@/alias/catalog';
import { catalogMatchResolver } from '@/alias/resolver';
import { declareCalendar } from '@/calendar/declared';
import { matchId } from '@/calendar/ids';
import { loadAliasCatalog, PostgresAliasStore } from '@/db/aliases';
import { loadSchedule } from '@/db/calendar';
import { PostgresMatchStore } from '@/db/matches';
import type { Sql } from '@/db/client';
import { readRows } from '@/ingest/observations';
import type { MatchResolver, SourceRow } from '@/ingest/ports';
import type { CompetitionId, Instant, SourceId, TeamId } from '@/model/ids';
import type { RawRef } from '@/raw/key';
import type { Clock } from '@/polite/clock';
import {
  ALIAS_SEASON,
  ALIAS_SOURCE,
  aliasCatalogBytes,
  aliasCatalogFixture,
} from '../fixtures/aliases';
import { CALENDAR_COMPETITION_ID, CALENDAR_SEASON, calendarBytes, calendarFixture } from '../fixtures/calendar';
import { connect, resetAndMigrate } from './_harness';

const frozen: Clock = { now: () => '2026-09-02T12:00:00.000Z' as Instant };
const COMPETITION = CALENDAR_COMPETITION_ID as CompetitionId;

/** The derived identity of SPEC-010 CA-3 for the resolvable pair of round 1. */
const OURENSE_CELTA = matchId(
  COMPETITION,
  CALENDAR_SEASON,
  1,
  'ud-ourense' as TeamId,
  'rc-celta-b' as TeamId,
);

const RESOLVABLE: SourceRow = {
  source_ref: '/partido/2026-09-06-ourense-celta-b/91001',
  home_name: 'UD Ourense',
  away_name: 'Celta de Vigo B',
  status: 'live',
  home_score: 1,
  away_score: 0,
  kickoff: '17:00',
};

const UNKNOWN: SourceRow = {
  source_ref: '/partido/2026-09-06-desconhecida-celta-b/91002',
  home_name: 'SD Descoñecida',
  away_name: 'Celta de Vigo B',
  status: 'live',
  home_score: 0,
  away_score: 0,
  kickoff: '17:00',
};

const RAW_REF =
  'ceroacero/futgal-preferente-g1/2026-09-06/2026-09-06t17-12-00.000z-abcdef012345.html' as RawRef;

let sql: Sql;
let resolver: MatchResolver;

beforeAll(async () => {
  sql = connect();
  await resetAndMigrate(sql);
  await loadSchedule(sql, declareCalendar(calendarBytes(calendarFixture)), { clock: frozen });
  await loadAliasCatalog(sql, declareAliasCatalog(aliasCatalogBytes(aliasCatalogFixture)), {
    clock: frozen,
  });

  resolver = catalogMatchResolver({
    source: ALIAS_SOURCE as SourceId,
    season: ALIAS_SEASON,
    aliases: new PostgresAliasStore(sql),
    matches: new PostgresMatchStore(sql),
  });
});

afterAll(async () => {
  await sql.end();
});

describe('CA-6 — the resolver over the real stores', () => {
  test('1. two confirmed spellings resolve to the exact derived MatchId, against the base', async () => {
    expect(await resolver.resolve(RESOLVABLE, COMPETITION)).toBe(OURENSE_CELTA);
  });

  test('2. readRows of SPEC-008 with this resolver: one Observation with that match_id, the unknown row whole in unresolved', async () => {
    const result = await readRows({
      rows: [RESOLVABLE, UNKNOWN],
      source: ALIAS_SOURCE as SourceId,
      competitionId: COMPETITION,
      confidence: 0.7,
      observedAt: '2026-09-06T17:12:00.000Z' as Instant,
      rawRef: RAW_REF,
      resolver,
    });

    expect(result.observations).toHaveLength(1);
    const observation = result.observations[0]!;
    expect(observation.match_id).toBe(OURENSE_CELTA);
    expect(observation.status).toBe('live');
    expect(observation.home_score).toBe(1);
    expect(observation.away_score).toBe(0);
    expect(observation.source).toBe(ALIAS_SOURCE);

    // The row nobody confirmed comes back WHOLE, untouched (SPEC-008 CA-13).
    expect(result.unresolved).toEqual([UNKNOWN]);
  });
});
