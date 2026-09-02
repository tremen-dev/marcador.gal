/**
 * CA-9 — `PostgresMatchStore`: the calendar is read parsed, ordered, and by
 * interval.
 *
 * Importing `_harness` THROWS without `DATABASE_URL_TEST`: without a real
 * Postgres this criterion is UNMET, not skipped.
 *
 * The rows come from the load of CA-4.1 (both synthetic fixtures), not from
 * the seed: the port is read against what the loader wrote.
 */
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { declareCalendar } from '@/calendar/declared';
import { matchId } from '@/calendar/ids';
import { loadSchedule } from '@/db/calendar';
import type { Sql } from '@/db/client';
import { PostgresMatchStore } from '@/db/matches';
import type { CompetitionId, Instant, MatchId, TeamId } from '@/model/ids';
import { MatchSchema } from '@/model/match';
import {
  CALENDAR_COMPETITION_ID,
  CALENDAR_SEASON,
  OTHER_CALENDAR_COMPETITION_ID,
  calendarBytes,
  calendarFixture,
  otherCalendarFixture,
} from '../fixtures/calendar';
import { connect, resetAndMigrate } from './_harness';

const PREFERENTE = CALENDAR_COMPETITION_ID as CompetitionId;
const TERCEIRA = OTHER_CALENDAR_COMPETITION_ID as CompetitionId;
const team = (id: string) => id as TeamId;

const OURENSE_CELTA = matchId(PREFERENTE, CALENDAR_SEASON, 1, team('ud-ourense'), team('rc-celta-b'));
const EXEMPLO_INVENTADA = matchId(PREFERENTE, CALENDAR_SEASON, 1, team('cd-exemplo'), team('sd-inventada'));
const CELTA_EXEMPLO = matchId(PREFERENTE, CALENDAR_SEASON, 2, team('rc-celta-b'), team('cd-exemplo'));
const INVENTADA_OURENSE = matchId(PREFERENTE, CALENDAR_SEASON, 2, team('sd-inventada'), team('ud-ourense'));
const SUPOSTO_MOSTRA = matchId(TERCEIRA, CALENDAR_SEASON, 1, team('cf-suposto'), team('ud-mostra'));
const FIGURADO_QUIMERA = matchId(TERCEIRA, CALENDAR_SEASON, 1, team('sc-figurado'), team('cf-quimera'));

const frozen = { now: () => '2026-09-02T12:00:00.000Z' as Instant };

let sql: Sql;
let store: PostgresMatchStore;

beforeAll(async () => {
  sql = connect();
  await resetAndMigrate(sql);
  await loadSchedule(sql, declareCalendar(calendarBytes(calendarFixture)), { clock: frozen });
  await loadSchedule(sql, declareCalendar(calendarBytes(otherCalendarFixture)), { clock: frozen });
  store = new PostgresMatchStore(sql);
});

afterAll(async () => {
  await sql.end();
});

describe('CA-9 — getById', () => {
  test('returns the Match as declared, after CA-2 and CA-3, kickoff as a Z string', async () => {
    const match = await store.getById(OURENSE_CELTA);

    expect(match).toEqual({
      id: OURENSE_CELTA,
      competition_id: 'futgal-preferente-g1',
      round: 1,
      kickoff: '2026-09-06T15:00:00.000Z',
      home_id: 'ud-ourense',
      away_id: 'rc-celta-b',
      venue: 'O Couto',
    });
    expect(MatchSchema.safeParse(match).success).toBe(true);
  });

  test('venue is null where the file left it null', async () => {
    expect((await store.getById(EXEMPLO_INVENTADA))?.venue).toBeNull();
  });

  test('an unknown id is null', async () => {
    expect(await store.getById('no-such-match' as MatchId)).toBeNull();
  });
});

describe('CA-9 — listByRound', () => {
  test('round 1 of the competition, by kickoff then id, and nothing from round 2', async () => {
    const round = await store.listByRound(PREFERENTE, 1);

    expect(round.map((m) => m.id)).toEqual([OURENSE_CELTA, EXEMPLO_INVENTADA]);
    for (const match of round) {
      expect(match.round).toBe(1);
      expect(match.competition_id).toBe('futgal-preferente-g1');
    }
  });

  test('a round nobody declared is []', async () => {
    expect(await store.listByRound(PREFERENTE, 9)).toEqual([]);
  });
});

describe('CA-9 — listByTeams', () => {
  test('the ordered pair finds the one match of the fixture', async () => {
    const found = await store.listByTeams(PREFERENTE, team('ud-ourense'), team('rc-celta-b'));
    expect(found.map((m) => m.id)).toEqual([OURENSE_CELTA]);
  });

  test('the inverted pair, which the fixture does not have, is []', async () => {
    expect(await store.listByTeams(PREFERENTE, team('rc-celta-b'), team('ud-ourense'))).toEqual([]);
  });

  test('the same pair in another competition is not found', async () => {
    expect(await store.listByTeams(TERCEIRA, team('ud-ourense'), team('rc-celta-b'))).toEqual([]);
  });
});

describe('CA-9 — listKickoffsBetween, across ALL competitions', () => {
  test('from ≤ kickoff < to, ordered by kickoff, both borders fixed', async () => {
    // `from` IS the kickoff of cf-suposto vs ud-mostra (15:30Z, included);
    // `to` IS the kickoff of sd-inventada vs ud-ourense and of sc-figurado vs
    // cf-quimera (Sep 13 15:00Z, both excluded). ud-ourense vs rc-celta-b
    // (15:00Z on Sep 6) is before `from`.
    const between = await store.listKickoffsBetween(
      '2026-09-06T15:30:00.000Z' as Instant,
      '2026-09-13T15:00:00.000Z' as Instant,
    );

    expect(between.map((m) => m.id)).toEqual([SUPOSTO_MOSTRA, EXEMPLO_INVENTADA, CELTA_EXEMPLO]);
    expect(new Set(between.map((m) => m.competition_id))).toEqual(
      new Set(['futgal-preferente-g1', 'terceira-rfef-g1']),
    );
    for (const match of between) expect(MatchSchema.safeParse(match).success).toBe(true);
  });

  test('moving `to` one millisecond later lets the two matches at the border in, ordered by kickoff then id', async () => {
    const between = await store.listKickoffsBetween(
      '2026-09-13T15:00:00.000Z' as Instant,
      '2026-09-13T15:00:00.001Z' as Instant,
    );

    expect(between.map((m) => m.id)).toEqual([INVENTADA_OURENSE, FIGURADO_QUIMERA]);
  });

  test('an empty interval is []', async () => {
    expect(
      await store.listKickoffsBetween(
        '2027-01-01T00:00:00.000Z' as Instant,
        '2027-01-02T00:00:00.000Z' as Instant,
      ),
    ).toEqual([]);
  });
});
