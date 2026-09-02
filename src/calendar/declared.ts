/**
 * The pure half of loading a declared calendar (SPEC-010 §4, ADR-017 §2).
 *
 * Bytes in, a validated calendar with the digest of those bytes out; and from
 * a validated calendar, the `Match` rows the database will receive — with the
 * derived identity of `./ids.ts` and the kickoff instant of `./time.ts`. No
 * SQL here: that half is `src/db/calendar.ts`.
 *
 * The file is validated WHOLE before anything downstream sees it — the schema
 * AND the kickoff conversion: a kickoff the timezone skips or repeats is
 * rejected by `declareCalendar` itself, naming the round and the match, like
 * every other mistake a person can make in the file (CA-1, CA-2). So the CLI
 * refuses it before opening a connection, and the loader receives rows it can
 * write without converting anything (F-SPEC-010-10).
 *
 * `Date` does not appear here (ADR-006).
 */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import type { Match } from '@/model/match';
import type { CompetitionId, TeamId } from '@/model/ids';
import { matchId } from './ids';
import { InvalidScheduleError, parseSchedule } from './schedule';
import type { Schedule } from './schedule';
import {
  AmbiguousWallTimeError,
  MalformedWallTimeError,
  NonexistentWallTimeError,
  wallTimeToInstant,
} from './time';

/**
 * A declared calendar as read from a file: the bytes, their digest, what they
 * say, and the `Match` rows they stand for (identity of CA-3, kickoff of CA-2).
 */
export interface DeclaredCalendar {
  readonly bytes: Uint8Array;
  /** sha256 of the bytes, hex. What `calendar_loads.file_digest` records. */
  readonly digest: string;
  readonly schedule: Schedule;
  /** `declaredMatches(schedule)`, computed once here so the whole file is validated. */
  readonly matches: readonly Match[];
}

export function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/**
 * Validates the bytes of a declared calendar, WHOLE — schema and kickoffs —
 * and keeps their digest.
 */
export function declareCalendar(bytes: Uint8Array): DeclaredCalendar {
  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder('utf8', { fatal: true }).decode(bytes));
  } catch (error) {
    throw new InvalidScheduleError([
      {
        path: '',
        message: `the file is not JSON: ${error instanceof Error ? error.message : String(error)}`,
      },
    ]);
  }
  const schedule = parseSchedule(json);
  return { bytes, digest: sha256Hex(bytes), schedule, matches: declaredMatches(schedule) };
}

/** Reads and validates a declared calendar from disk. The loader's only I/O. */
export async function readCalendarFile(path: string): Promise<DeclaredCalendar> {
  return declareCalendar(await readFile(path));
}

/**
 * The `Match` rows a declared calendar stands for, in file order.
 *
 * The identity is derived (CA-3) and the kickoff converted at the edge (CA-2).
 * A wall-clock time the timezone skips or repeats is an error OF THE FILE, so
 * it is reported as one, naming the round and the match.
 */
export function declaredMatches(schedule: Schedule): readonly Match[] {
  const competitionId = schedule.competition.id as CompetitionId;
  const matches: Match[] = [];

  for (const round of schedule.rounds) {
    for (const declared of round.matches) {
      const homeId = declared.home_id as TeamId;
      const awayId = declared.away_id as TeamId;
      const label = `round ${round.round}, match ${declared.home_id}-${declared.away_id}`;

      let kickoff;
      try {
        kickoff = wallTimeToInstant(declared.kickoff, schedule.timezone);
      } catch (error) {
        if (
          error instanceof NonexistentWallTimeError ||
          error instanceof AmbiguousWallTimeError ||
          error instanceof MalformedWallTimeError
        ) {
          throw new InvalidScheduleError([{ path: label, message: `kickoff ${error.message}` }]);
        }
        throw error;
      }

      matches.push({
        id: matchId(competitionId, schedule.competition.season, round.round, homeId, awayId),
        competition_id: competitionId,
        round: round.round,
        kickoff,
        home_id: homeId,
        away_id: awayId,
        venue: declared.venue,
      });
    }
  }

  return matches;
}
