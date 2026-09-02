/**
 * CA-1 — the declared calendar is validated whole before anything is touched,
 * and what a person writes wrong is rejected NAMING THE ROW.
 *
 * Pure: no network, no database. `npm test`.
 *
 * Twelve variants, each one a single edit of the synthetic fixture, and each
 * one has to fail with an error that names the round and the match — or the
 * team — so the person who wrote the file knows where to look. Case 5 is the
 * crossed case (home in one match, away in another of the same round), which
 * ONLY the schema closes: the database cannot, and the spec says why (§3,
 * ADR-017 §3).
 */
import { describe, expect, test } from 'vitest';
import { InvalidScheduleError, parseSchedule, SCHEDULE_TIMEZONES } from '@/calendar/schedule';
import { calendarFixture, cloneCalendar } from '../fixtures/calendar';
import type { CalendarFixture } from '../fixtures/calendar';

type Mutable<T> = { -readonly [K in keyof T]: Mutable<T[K]> };

function variant(edit: (draft: Mutable<CalendarFixture>) => void): CalendarFixture {
  const draft = cloneCalendar(calendarFixture) as Mutable<CalendarFixture>;
  edit(draft);
  return draft;
}

function failure(input: unknown): InvalidScheduleError {
  try {
    parseSchedule(input);
  } catch (error) {
    if (error instanceof InvalidScheduleError) return error;
    throw error;
  }
  throw new Error('parseSchedule accepted a file it had to reject');
}

describe('CA-1 — the synthetic fixture validates', () => {
  test('the fixture parses and keeps what it declares', () => {
    const schedule = parseSchedule(calendarFixture);

    expect(schedule.competition.id).toBe('futgal-preferente-g1');
    expect(schedule.teams).toHaveLength(4);
    expect(schedule.rounds.map((round) => round.round)).toEqual([1, 2]);
    expect(schedule.rounds[0]?.matches[1]?.venue).toBeNull();
  });

  test('the timezone list is closed and has exactly one value', () => {
    expect([...SCHEDULE_TIMEZONES]).toEqual(['Europe/Madrid']);
  });

  test('`source_note` is optional: a file without it is still a declaration', () => {
    const { source_note: _dropped, ...withoutNote } = calendarFixture;
    expect(() => parseSchedule(withoutNote)).not.toThrow();
  });

  test('something that is not even an object is rejected as a schedule', () => {
    expect(() => parseSchedule('not a calendar')).toThrow(InvalidScheduleError);
    expect(() => parseSchedule(null)).toThrow(InvalidScheduleError);
  });
});

describe('CA-1 — each mistake is rejected naming the round and the match, or the team', () => {
  test('1. a home_id that is not declared in teams', () => {
    const error = failure(
      variant((draft) => {
        draft.rounds[0]!.matches[0]!.home_id = 'club-fantasma';
      }),
    );
    expect(error.message).toMatch(/round 1/);
    expect(error.message).toMatch(/club-fantasma/);
    expect(error.message).toMatch(/not declared in teams/);
  });

  test('2. home_id === away_id', () => {
    const error = failure(
      variant((draft) => {
        draft.rounds[0]!.matches[0]!.away_id = 'ud-ourense';
      }),
    );
    expect(error.message).toMatch(/round 1/);
    expect(error.message).toMatch(/ud-ourense/);
    expect(error.message).toMatch(/against itself|same team/);
  });

  test('3. the same team twice at home in one round', () => {
    const error = failure(
      variant((draft) => {
        draft.rounds[0]!.matches[1]!.home_id = 'ud-ourense';
      }),
    );
    expect(error.message).toMatch(/round 1/);
    expect(error.message).toMatch(/ud-ourense/);
    expect(error.message).toMatch(/more than once/);
  });

  test('4. the same team twice away in one round', () => {
    const error = failure(
      variant((draft) => {
        draft.rounds[0]!.matches[1]!.away_id = 'rc-celta-b';
      }),
    );
    expect(error.message).toMatch(/round 1/);
    expect(error.message).toMatch(/rc-celta-b/);
    expect(error.message).toMatch(/more than once/);
  });

  test('5. the crossed case: home in one match and away in another of the same round', () => {
    // Only the schema closes this one (§3): the two unique indexes of
    // migration 0003 cannot see it, and the seed of SPEC-001 depends on that.
    const error = failure(
      variant((draft) => {
        draft.rounds[0]!.matches[1]!.away_id = 'ud-ourense';
      }),
    );
    expect(error.message).toMatch(/round 1/);
    expect(error.message).toMatch(/ud-ourense/);
    expect(error.message).toMatch(/more than once/);
  });

  test('6. two teams with the same id', () => {
    const error = failure(
      variant((draft) => {
        draft.teams[1]!.id = 'ud-ourense';
      }),
    );
    expect(error.message).toMatch(/team/);
    expect(error.message).toMatch(/ud-ourense/);
    expect(error.message).toMatch(/declared twice|duplicate/);
  });

  test('7. declared_by: "" — the empty string is «nobody»', () => {
    const error = failure(
      variant((draft) => {
        draft.declared_by = '';
      }),
    );
    expect(error.message).toMatch(/declared_by/);
  });

  test('8. a team id that is not kebab-case', () => {
    const error = failure(
      variant((draft) => {
        draft.teams[0]!.id = 'UD_Ourense';
        draft.rounds[0]!.matches[0]!.home_id = 'UD_Ourense';
        draft.rounds[1]!.matches[1]!.away_id = 'UD_Ourense';
      }),
    );
    expect(error.message).toMatch(/team/);
    expect(error.message).toMatch(/UD_Ourense/);
    expect(error.message).toMatch(/kebab-case/);
  });

  test('9. timezone: "UTC" — the list is closed', () => {
    const error = failure(
      variant((draft) => {
        draft.timezone = 'UTC';
      }),
    );
    expect(error.message).toMatch(/timezone/);
    expect(error.message).toMatch(/Europe\/Madrid/);
  });

  test('10. round: 0', () => {
    const error = failure(
      variant((draft) => {
        draft.rounds[0]!.round = 0;
      }),
    );
    expect(error.message).toMatch(/round/);
    expect(error.message).toMatch(/>=\s*1|at least 1|Too small/);
  });

  test('11. the same round declared twice', () => {
    const error = failure(
      variant((draft) => {
        draft.rounds[1]!.round = 1;
      }),
    );
    expect(error.message).toMatch(/round 1/);
    expect(error.message).toMatch(/declared twice|duplicate/);
  });

  test('12. a kickoff without the form YYYY-MM-DD HH:MM', () => {
    const error = failure(
      variant((draft) => {
        draft.rounds[1]!.matches[0]!.kickoff = '2026-09-13T12:00:00Z';
      }),
    );
    expect(error.message).toMatch(/round 2/);
    expect(error.message).toMatch(/kickoff/);
    expect(error.message).toMatch(/YYYY-MM-DD HH:MM/);
  });

  test('and the season has to be written as the RFGF writes it, 2026/27', () => {
    const error = failure(
      variant((draft) => {
        draft.competition.season = '2026-2027';
      }),
    );
    expect(error.message).toMatch(/season/);
    expect(error.message).toMatch(/2026\/27|YYYY\/YY/);
  });

  test('the error is one error, not a JSON dump: every issue is on its own line', () => {
    const error = failure(
      variant((draft) => {
        draft.declared_by = '';
        draft.timezone = 'UTC';
      }),
    );
    expect(error.name).toBe('InvalidScheduleError');
    expect(error.issues.length).toBeGreaterThanOrEqual(2);
    expect(error.message.split('\n').length).toBeGreaterThanOrEqual(2);
  });
});
