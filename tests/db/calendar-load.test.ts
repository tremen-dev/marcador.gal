/**
 * CA-4 — the load is a transactional upsert that never deletes and never
 * touches identity (ADR-017 §2, §3) — and CA-5 — every load leaves a record of
 * who declared the calendar, when, and from which file (ADR-017 §2).
 *
 * Importing `_harness` THROWS without `DATABASE_URL_TEST`: without a real
 * Postgres these criteria are UNMET, not skipped (gate of 2026-08-29).
 *
 * The seed of `_harness.ts` is NOT used here and NOT modified (CA-4.9): these
 * cases start from a clean schema and load the synthetic fixture themselves.
 */
import { createHash } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { declareCalendar } from '@/calendar/declared';
import { matchId } from '@/calendar/ids';
import { CompetitionRedefinedError, loadSchedule } from '@/db/calendar';
import type { Sql } from '@/db/client';
import type { CompetitionId, Instant, TeamId } from '@/model/ids';
import type { Clock } from '@/polite/clock';
import {
  CALENDAR_COMPETITION_ID,
  CALENDAR_SEASON,
  calendarBytes,
  calendarFixture,
  cloneCalendar,
} from '../fixtures/calendar';
import type { CalendarFixture } from '../fixtures/calendar';
import { connect, resetAndMigrate } from './_harness';

type Mutable<T> = { -readonly [K in keyof T]: Mutable<T[K]> };

const COMPETITION = CALENDAR_COMPETITION_ID as CompetitionId;
const T_LOAD = '2026-09-02T12:00:00.000Z' as Instant;
const frozen: Clock = { now: () => T_LOAD };

const id = (round: number, home: string, away: string) =>
  matchId(COMPETITION, CALENDAR_SEASON, round, home as TeamId, away as TeamId);

const OURENSE_CELTA = id(1, 'ud-ourense', 'rc-celta-b');
const EXEMPLO_INVENTADA = id(1, 'cd-exemplo', 'sd-inventada');
const CELTA_EXEMPLO = id(2, 'rc-celta-b', 'cd-exemplo');
const INVENTADA_OURENSE = id(2, 'sd-inventada', 'ud-ourense');
const ALL_IDS = [OURENSE_CELTA, EXEMPLO_INVENTADA, CELTA_EXEMPLO, INVENTADA_OURENSE].sort();

function variant(edit: (draft: Mutable<CalendarFixture>) => void): CalendarFixture {
  const draft = cloneCalendar(calendarFixture) as Mutable<CalendarFixture>;
  edit(draft);
  return draft;
}

const load = (sql: Sql, fixture: CalendarFixture = calendarFixture) =>
  loadSchedule(sql, declareCalendar(calendarBytes(fixture)), { clock: frozen });

let sql: Sql;

beforeAll(async () => {
  sql = connect();
  await resetAndMigrate(sql);
});

beforeEach(async () => {
  // TRUNCATE fires no FOR EACH ROW trigger, so the append-only tables clean
  // up without weakening RN-13 (SPEC-001 CA-16).
  await sql.unsafe(
    'truncate calendar_loads, observations, decisions, matches, teams, competitions cascade',
  );
});

afterAll(async () => {
  await sql.end();
});

interface MatchRow {
  readonly id: string;
  readonly competition_id: string;
  readonly round: number;
  readonly kickoff: string;
  readonly home_id: string;
  readonly away_id: string;
  readonly venue: string | null;
}

async function matchesInDb(): Promise<MatchRow[]> {
  return sql<MatchRow[]>`
    select id, competition_id, round, kickoff, home_id, away_id, venue
      from matches order by id
  `;
}

async function snapshot(): Promise<Record<string, unknown[]>> {
  const tables = ['competitions', 'teams', 'matches', 'observations', 'calendar_loads'];
  const out: Record<string, unknown[]> = {};
  for (const table of tables) {
    out[table] = await sql.unsafe(`select * from ${table} order by 1`);
  }
  return out;
}

describe('CA-4 — loading the synthetic fixture on a clean schema', () => {
  test('1. competitions, teams and matches hold exactly what the file declares', async () => {
    const result = await load(sql);

    const competitions = await sql`select id, name, season, "group" from competitions`;
    expect(competitions).toEqual([
      { id: 'futgal-preferente-g1', name: 'Preferente Futgal', season: '2026/27', group: '1' },
    ]);

    const teams = await sql`select id, canonical_name from teams order by id`;
    expect(teams).toEqual([
      { id: 'cd-exemplo', canonical_name: 'CD Exemplo' },
      { id: 'rc-celta-b', canonical_name: 'RC Celta B' },
      { id: 'sd-inventada', canonical_name: 'SD Inventada' },
      { id: 'ud-ourense', canonical_name: 'UD Ourense' },
    ]);

    const matches = await matchesInDb();
    expect(matches.map((row) => row.id)).toEqual(ALL_IDS);
    // Each id is the one of CA-3; each kickoff is the instant of CA-2.
    expect(matches.find((row) => row.id === OURENSE_CELTA)).toEqual({
      id: OURENSE_CELTA,
      competition_id: 'futgal-preferente-g1',
      round: 1,
      kickoff: '2026-09-06T15:00:00.000Z',
      home_id: 'ud-ourense',
      away_id: 'rc-celta-b',
      venue: 'O Couto',
    });
    expect(matches.find((row) => row.id === EXEMPLO_INVENTADA)?.venue).toBeNull();
    expect(matches.find((row) => row.id === CELTA_EXEMPLO)?.kickoff).toBe(
      '2026-09-13T10:00:00.000Z',
    );

    expect([...result.inserted].sort()).toEqual(ALL_IDS);
    expect(result.updated).toEqual([]);
    expect(result.orphans).toEqual([]);
    expect(result.teams_inserted).toBe(4);
  });

  test('2. loading the same file again changes nothing and reports nothing', async () => {
    await load(sql);
    const before = await snapshot();

    const result = await load(sql);

    expect(result.inserted).toEqual([]);
    expect(result.updated).toEqual([]);
    expect(result.orphans).toEqual([]);
    expect(result.teams_inserted).toBe(0);

    const after = await snapshot();
    // Everything identical except the load record, which grows by one (CA-5.1).
    for (const table of ['competitions', 'teams', 'matches', 'observations']) {
      expect(after[table]).toEqual(before[table]);
    }
    expect(after['calendar_loads']).toHaveLength(2);
  });

  test('3. a changed kickoff and venue update the row, are reported, and the id does not move', async () => {
    await load(sql);

    const moved = variant((draft) => {
      draft.rounds[0]!.matches[0]!.kickoff = '2026-09-07 12:00';
      draft.rounds[0]!.matches[0]!.venue = 'Campo alternativo';
    });
    const result = await load(sql, moved);

    expect(result.updated).toEqual([OURENSE_CELTA]);
    expect(result.inserted).toEqual([]);

    const row = (await matchesInDb()).find((match) => match.id === OURENSE_CELTA);
    expect(row?.kickoff).toBe('2026-09-07T10:00:00.000Z');
    expect(row?.venue).toBe('Campo alternativo');
    expect((await matchesInDb()).map((match) => match.id)).toEqual(ALL_IDS);
  });

  test('4. a match missing from the file is reported as an orphan and STAYS in the database', async () => {
    await load(sql);

    const shorter = variant((draft) => {
      draft.rounds[1]!.matches.splice(0, 1); // drops rc-celta-b vs cd-exemplo
    });
    const result = await load(sql, shorter);

    expect(result.orphans).toEqual([CELTA_EXEMPLO]);
    expect((await matchesInDb()).map((match) => match.id)).toEqual(ALL_IDS);
  });

  test('4b. orphans are computed only over the rounds the file declares', async () => {
    await load(sql);

    const onlyRoundOne = variant((draft) => {
      draft.rounds.splice(1, 1);
    });
    const result = await load(sql, onlyRoundOne);

    // Round 2 is not declared, so its matches are not orphans: nobody said
    // anything about them.
    expect(result.orphans).toEqual([]);
    expect((await matchesInDb()).map((match) => match.id)).toEqual(ALL_IDS);
  });

  test('5. an Observation written against a match survives the reload that moved it', async () => {
    await load(sql);
    await sql`
      insert into observations
        (id, match_id, source, observed_at, status, home_score, away_score, confidence, raw_ref)
      values
        ('obs-cal-0001', ${OURENSE_CELTA}, 'ceroacero', '2026-09-06T15:40:00Z',
         'live', 1, 0, 0.7,
         'ceroacero/futgal-preferente-g1/2026-09-06/2026-09-06t15-40-00.000z-a1b2c3d4e5f6.html')
    `;

    await load(
      sql,
      variant((draft) => {
        draft.rounds[0]!.matches[0]!.kickoff = '2026-09-07 12:00';
      }),
    );

    const rows = await sql<{ match_id: string }[]>`
      select match_id from observations where id = 'obs-cal-0001'
    `;
    expect(rows).toEqual([{ match_id: OURENSE_CELTA }]);

    const fk = await sql<{ constraint_name: string }[]>`
      select constraint_name from information_schema.table_constraints
       where table_name = 'observations' and constraint_type = 'FOREIGN KEY'
    `;
    expect(fk.length).toBeGreaterThan(0);
  });

  describe('6. identity is immutable in the database; kickoff and venue are not', () => {
    beforeEach(async () => {
      await load(sql);
    });

    test.each([
      ['home_id', sql => sql`update matches set home_id = 'cd-exemplo' where id = ${OURENSE_CELTA}`],
      ['away_id', sql => sql`update matches set away_id = 'cd-exemplo' where id = ${OURENSE_CELTA}`],
      ['round', sql => sql`update matches set round = 9 where id = ${OURENSE_CELTA}`],
      [
        'competition_id',
        sql => sql`update matches set competition_id = 'other' where id = ${OURENSE_CELTA}`,
      ],
    ] as [string, (sql: Sql) => Promise<unknown>][])('%s is rejected naming the identity', async (_column, run) => {
      await expect(run(sql)).rejects.toThrow(/immutable|RN-13/);
    });

    test('kickoff and venue are admitted', async () => {
      await sql`update matches set kickoff = '2026-09-08T18:00:00Z' where id = ${OURENSE_CELTA}`;
      await sql`update matches set venue = 'Outro campo' where id = ${OURENSE_CELTA}`;

      const row = (await matchesInDb()).find((match) => match.id === OURENSE_CELTA);
      expect(row?.kickoff).toBe('2026-09-08T18:00:00.000Z');
      expect(row?.venue).toBe('Outro campo');
    });
  });

  test('7. a file whose competition has a known id but another name is rejected, and nothing changes', async () => {
    await load(sql);
    const before = await snapshot();

    const renamed = variant((draft) => {
      draft.competition.name = 'Preferente Renomeada';
    });

    await expect(load(sql, renamed)).rejects.toThrow(CompetitionRedefinedError);
    await expect(load(sql, renamed)).rejects.toThrow(/futgal-preferente-g1/);
    expect(await snapshot()).toEqual(before);
  });

  test('8. all or nothing: a hand-inserted row that collides with the unique index aborts the whole load', async () => {
    // Competition and teams exist; round 1 already has ud-ourense at home
    // under an id the loader would never derive.
    await sql`insert into competitions (id, name, season, "group")
              values ('futgal-preferente-g1', 'Preferente Futgal', '2026/27', '1')`;
    await sql`insert into teams (id, canonical_name) values
              ('ud-ourense', 'UD Ourense'), ('rc-celta-b', 'RC Celta B'),
              ('cd-exemplo', 'CD Exemplo'), ('sd-inventada', 'SD Inventada')`;
    await sql`insert into matches (id, competition_id, round, kickoff, home_id, away_id, venue)
              values ('manual-collision', 'futgal-preferente-g1', 1, '2026-09-06T15:00:00Z',
                      'ud-ourense', 'cd-exemplo', null)`;
    const before = await snapshot();

    await expect(load(sql)).rejects.toThrow(/matches_one_home_per_round/);

    expect(await snapshot()).toEqual(before);
    expect(await sql`select id from calendar_loads`).toEqual([]);
  });
});

describe('CA-5 — every load leaves a record', () => {
  interface LoadRow {
    readonly id: number;
    readonly competition_id: string;
    readonly declared_by: string;
    readonly declared_at: string;
    readonly loaded_at: string;
    readonly file_digest: string;
    readonly rounds: number[];
    readonly matches_count: number;
    readonly inserted: number;
    readonly updated: number;
  }

  const loads = () =>
    sql<LoadRow[]>`
      select id, competition_id, declared_by, declared_at, loaded_at, file_digest,
             rounds, matches_count, inserted, updated
        from calendar_loads order by id
    `;

  test('the first load writes one row with who, when, which file, and what it did', async () => {
    const bytes = calendarBytes(calendarFixture);
    const result = await loadSchedule(sql, declareCalendar(bytes), { clock: frozen });

    const rows = await loads();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      id: result.load_id,
      competition_id: 'futgal-preferente-g1',
      declared_by: 'Persoa de Proba',
      // The file says +02:00; the database says Z.
      declared_at: '2026-09-02T08:00:00.000Z',
      loaded_at: T_LOAD,
      file_digest: createHash('sha256').update(bytes).digest('hex'),
      rounds: [1, 2],
      matches_count: 4,
      inserted: 4,
      updated: 0,
    });
  });

  test('1. a second identical load adds ANOTHER row with inserted = 0: loading is a fact', async () => {
    await load(sql);
    await load(sql);

    const rows = await loads();
    expect(rows).toHaveLength(2);
    expect(rows[1]?.inserted).toBe(0);
    expect(rows[1]?.updated).toBe(0);
    expect(rows[1]?.file_digest).toBe(rows[0]?.file_digest);
  });

  test('the counters follow what the load did', async () => {
    await load(sql);
    await load(
      sql,
      variant((draft) => {
        draft.rounds[0]!.matches[0]!.kickoff = '2026-09-07 12:00';
      }),
    );

    const rows = await loads();
    expect(rows[1]?.inserted).toBe(0);
    expect(rows[1]?.updated).toBe(1);
    expect(rows[1]?.file_digest).not.toBe(rows[0]?.file_digest);
  });

  test('2. UPDATE and DELETE on calendar_loads are refused by the database', async () => {
    await load(sql);

    await expect(sql`update calendar_loads set declared_by = 'outra persoa'`).rejects.toThrow(
      /append-only/,
    );
    await expect(sql`delete from calendar_loads`).rejects.toThrow(/append-only/);
    expect(await loads()).toHaveLength(1);
  });

  test('3. declared_by = "" is refused by the database: the empty string is nobody', async () => {
    await load(sql);

    await expect(sql`
      insert into calendar_loads
        (competition_id, declared_by, declared_at, loaded_at, file_digest, rounds,
         matches_count, inserted, updated)
      values
        ('futgal-preferente-g1', '', '2026-09-02T08:00:00Z', '2026-09-02T12:00:00Z',
         ${'0'.repeat(64)}, ${sql.array([1])}::integer[], 0, 0, 0)
    `).rejects.toThrow(/declared_by/);
  });
});
