/**
 * The pure half of the load (SPEC-010 §4, steps 1 and the identity/time of
 * CA-2 and CA-3 applied to a whole file): bytes → validated calendar with its
 * digest → the `Match` rows the database will receive.
 *
 * Pure: no database. `npm test`. The SQL half is `tests/db/calendar-load.test.ts`.
 */
import { createHash } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { declareCalendar, declaredMatches } from '@/calendar/declared';
import { InvalidScheduleError, parseSchedule } from '@/calendar/schedule';
import { MatchSchema } from '@/model/match';
import { calendarBytes, calendarFixture, cloneCalendar } from '../fixtures/calendar';
import type { CalendarFixture } from '../fixtures/calendar';

type Mutable<T> = { -readonly [K in keyof T]: Mutable<T[K]> };

function variant(edit: (draft: Mutable<CalendarFixture>) => void): CalendarFixture {
  const draft = cloneCalendar(calendarFixture) as Mutable<CalendarFixture>;
  edit(draft);
  return draft;
}

describe('declareCalendar — bytes to a validated calendar with its digest', () => {
  test('keeps the bytes, validates the schedule and computes the sha256 of the bytes', () => {
    const bytes = calendarBytes(calendarFixture);
    const declared = declareCalendar(bytes);

    expect(declared.bytes).toBe(bytes);
    expect(declared.schedule.competition.id).toBe('futgal-preferente-g1');
    expect(declared.digest).toBe(createHash('sha256').update(bytes).digest('hex'));
    expect(declared.digest).toMatch(/^[0-9a-f]{64}$/);
  });

  test('bytes that are not JSON are rejected as an invalid calendar, not as a crash', () => {
    expect(() => declareCalendar(new TextEncoder().encode('{ not json'))).toThrow(
      InvalidScheduleError,
    );
    expect(() => declareCalendar(new TextEncoder().encode('{ not json'))).toThrow(/JSON/);
  });

  test('a file CA-1 rejects is rejected here, with the same error', () => {
    const bad = variant((draft) => {
      draft.declared_by = '';
    });
    expect(() => declareCalendar(calendarBytes(bad))).toThrow(InvalidScheduleError);
  });

  // F-SPEC-010-10: the file is validated WHOLE here, the kickoff conversion of
  // CA-2 included, so nothing downstream — the CLI, the loader — sees a
  // calendar whose hours do not exist.
  test('carries the Match rows of the calendar, converted once (F-SPEC-010-10)', () => {
    const declared = declareCalendar(calendarBytes(calendarFixture));

    expect(declared.matches).toHaveLength(4);
    expect(declared.matches).toEqual(declaredMatches(declared.schedule));
    expect(declared.matches[0]?.kickoff).toBe('2026-09-06T15:00:00.000Z');
  });

  test('a kickoff that does not exist is rejected HERE, naming the round and the match', () => {
    const gap = variant((draft) => {
      draft.rounds[1]!.matches[1]!.kickoff = '2027-03-28 02:30';
    });

    expect(() => declareCalendar(calendarBytes(gap))).toThrow(InvalidScheduleError);
    expect(() => declareCalendar(calendarBytes(gap))).toThrow(/round 2, match sd-inventada-ud-ourense/);
    expect(() => declareCalendar(calendarBytes(gap))).toThrow(/does not exist/);
  });

  test('an ambiguous kickoff is rejected HERE, naming the round and the match', () => {
    const overlap = variant((draft) => {
      draft.rounds[0]!.matches[0]!.kickoff = '2026-10-25 02:30';
    });

    expect(() => declareCalendar(calendarBytes(overlap))).toThrow(InvalidScheduleError);
    expect(() => declareCalendar(calendarBytes(overlap))).toThrow(/round 1, match ud-ourense-rc-celta-b/);
    expect(() => declareCalendar(calendarBytes(overlap))).toThrow(/ambiguous/);
  });
});

describe('declaredMatches — the Match rows of a calendar', () => {
  test('one Match per declared match, id of CA-3, kickoff of CA-2, venue as declared', () => {
    const matches = declaredMatches(declareCalendar(calendarBytes(calendarFixture)).schedule);

    expect(matches).toHaveLength(4);
    for (const match of matches) expect(MatchSchema.safeParse(match).success).toBe(true);

    expect(matches[0]).toEqual({
      id: 'futgal-preferente-g1-2026-27-j1-ud-ourense-rc-celta-b',
      competition_id: 'futgal-preferente-g1',
      round: 1,
      kickoff: '2026-09-06T15:00:00.000Z',
      home_id: 'ud-ourense',
      away_id: 'rc-celta-b',
      venue: 'O Couto',
    });
    expect(matches[1]?.venue).toBeNull();
    expect(matches[3]?.kickoff).toBe('2026-09-13T15:00:00.000Z');
  });

  test('a kickoff that does not exist is rejected naming the round and the match', () => {
    const gap = variant((draft) => {
      draft.rounds[1]!.matches[1]!.kickoff = '2027-03-28 02:30';
    });
    // `parseSchedule` alone: `declareCalendar` refuses this file since F-SPEC-010-10.
    const schedule = parseSchedule(gap);

    expect(() => declaredMatches(schedule)).toThrow(InvalidScheduleError);
    expect(() => declaredMatches(schedule)).toThrow(/round 2, match sd-inventada-ud-ourense/);
    expect(() => declaredMatches(schedule)).toThrow(/does not exist/);
  });

  test('an ambiguous kickoff is rejected naming the round and the match', () => {
    const overlap = variant((draft) => {
      draft.rounds[0]!.matches[0]!.kickoff = '2026-10-25 02:30';
    });
    const schedule = parseSchedule(overlap);

    expect(() => declaredMatches(schedule)).toThrow(/round 1, match ud-ourense-rc-celta-b/);
    expect(() => declaredMatches(schedule)).toThrow(/ambiguous/);
  });
});
