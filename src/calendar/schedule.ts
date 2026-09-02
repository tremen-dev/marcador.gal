/**
 * The shape of a declared calendar (SPEC-010 §2, ADR-017 §1).
 *
 * A declared calendar is a JSON file a PERSON writes from the RFGF's public
 * calendar: the competition, the teams with their canonical name, the matches
 * by round with local wall-clock time and venue, and who declared it and when.
 * It is the denominator of the coverage figure and the list a match is
 * identified against. It is obtained from no source over the network (RN-11
 * is not exercised: there is nobody to ask).
 *
 * This schema is the contract. The whole file is validated before anything is
 * touched, and what is wrong is rejected NAMING THE ROW — the round and the
 * match, or the team — because the reader is the person who typed it.
 *
 * WHAT ONLY THIS SCHEMA GUARANTEES, said here as ADR-016 §6 asks: that a team
 * plays at most once per round, INCLUDING the crossed case (home in one match,
 * away in another of the same round). The two unique indexes of migration
 * 0003 cover "twice at home" and "twice away"; the crossed case stays out of
 * the database on purpose, because the seed of `tests/db/_harness.ts`
 * (SPEC-001, done) has exactly that shape in its round 23 (ADR-017 §3).
 *
 * `Date` does not appear here. The wall-clock time stays a string; the
 * conversion to an instant is the job of `./time.ts`, at the edge (CA-2).
 */
import { z } from 'zod';
import { CompetitionSchema } from '@/model/competition';

/**
 * A closed list of ONE value. A second timezone is a diff with its motive,
 * never something the loader arbitrates (ADR-016 §3.2 by analogy).
 */
export const SCHEDULE_TIMEZONES = ['Europe/Madrid'] as const;
export type ScheduleTimezone = (typeof SCHEDULE_TIMEZONES)[number];

/** `kebab-case`: what a `TeamId` declared by a person has to look like. */
export const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** A season as the RFGF writes it: `2026/27`. */
export const RFGF_SEASON = /^\d{4}\/\d{2}$/;

/** Wall-clock time in the file's timezone: `YYYY-MM-DD HH:MM`. */
export const WALL_TIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

const DeclaredTeamIdSchema = z
  .string()
  .regex(KEBAB_CASE, 'a team id has to be kebab-case (`ud-ourense`), not this');

export const ScheduleTeamSchema = z.object({
  id: DeclaredTeamIdSchema,
  /** The canonical RFGF name. The schema cannot know it is; `sdd-competicion` can. */
  canonical_name: z.string().min(1),
});

export const ScheduleMatchSchema = z.object({
  home_id: DeclaredTeamIdSchema,
  away_id: DeclaredTeamIdSchema,
  kickoff: z.string().regex(WALL_TIME, 'kickoff has to be written as YYYY-MM-DD HH:MM'),
  venue: z.string().min(1).nullable(),
});

export const ScheduleRoundSchema = z.object({
  /** `jornada`. */
  round: z.int().min(1),
  matches: z.array(ScheduleMatchSchema),
});

const ScheduleShape = z.object({
  competition: CompetitionSchema.extend({
    season: z.string().regex(RFGF_SEASON, 'season has to be written as the RFGF does, YYYY/YY (2026/27)'),
  }),
  timezone: z.enum(SCHEDULE_TIMEZONES),
  /** A person. The empty string is the shape «nobody declared it» takes. */
  declared_by: z.string().min(1, 'declared_by has to name a person; the empty string is nobody'),
  /** An ISO 8601 instant, offset allowed here; normalised to `Z` when loaded. */
  declared_at: z.iso.datetime({ offset: true }),
  source_note: z.string().min(1).optional(),
  teams: z.array(ScheduleTeamSchema).min(1),
  rounds: z.array(ScheduleRoundSchema).min(1),
});

type ScheduleShape = z.infer<typeof ScheduleShape>;

function matchLabel(round: number, home: string, away: string): string {
  return `round ${round}, match ${home}-${away}`;
}

/**
 * The checks no field can make on its own, each one naming the row.
 */
function crossChecks(schedule: ScheduleShape, ctx: z.RefinementCtx): void {
  const declared = new Set<string>();
  schedule.teams.forEach((team, index) => {
    if (declared.has(team.id)) {
      ctx.addIssue({
        code: 'custom',
        path: ['teams', index, 'id'],
        message: `team ${team.id} is declared twice`,
      });
    }
    declared.add(team.id);
  });

  const rounds = new Set<number>();
  schedule.rounds.forEach((round, roundIndex) => {
    if (rounds.has(round.round)) {
      ctx.addIssue({
        code: 'custom',
        path: ['rounds', roundIndex, 'round'],
        message: `round ${round.round} is declared twice`,
      });
    }
    rounds.add(round.round);

    const playing = new Set<string>();
    round.matches.forEach((match, matchIndex) => {
      const path = ['rounds', roundIndex, 'matches', matchIndex];
      const label = matchLabel(round.round, match.home_id, match.away_id);

      for (const side of ['home_id', 'away_id'] as const) {
        if (!declared.has(match[side])) {
          ctx.addIssue({
            code: 'custom',
            path: [...path, side],
            message: `${label}: ${side} ${match[side]} is not declared in teams`,
          });
        }
      }

      if (match.home_id === match.away_id) {
        ctx.addIssue({
          code: 'custom',
          path: [...path, 'away_id'],
          message: `${label}: a team cannot play against itself`,
        });
      }

      // A team plays at most once per round, whichever side it is on. This is
      // the ONE place the crossed case is closed (§3).
      for (const side of ['home_id', 'away_id'] as const) {
        if (playing.has(match[side])) {
          ctx.addIssue({
            code: 'custom',
            path: [...path, side],
            message: `${label}: team ${match[side]} plays more than once in round ${round.round}`,
          });
        }
        playing.add(match[side]);
      }
    });
  });
}

/** The contract of a declared calendar. Parse with `parseSchedule`. */
export const ScheduleSchema = ScheduleShape.superRefine(crossChecks);

export type Schedule = z.infer<typeof ScheduleSchema>;
export type ScheduleTeam = z.infer<typeof ScheduleTeamSchema>;
export type ScheduleMatch = z.infer<typeof ScheduleMatchSchema>;
export type ScheduleRound = z.infer<typeof ScheduleRoundSchema>;

/** One thing wrong with the file, with the path to it. */
export interface ScheduleIssue {
  readonly path: string;
  readonly message: string;
}

/**
 * Thrown when a declared calendar is not one. Every issue is a line of the
 * message, with its path, so the person who typed the file can find the row.
 */
export class InvalidScheduleError extends Error {
  override readonly name = 'InvalidScheduleError';
  readonly issues: readonly ScheduleIssue[];

  constructor(issues: readonly ScheduleIssue[]) {
    super(
      [
        'the declared calendar is invalid:',
        ...issues.map((issue) => `  ${issue.path || '(file)'}: ${issue.message}`),
      ].join('\n'),
    );
    this.issues = issues;
  }
}

function valueAt(input: unknown, path: readonly PropertyKey[]): unknown {
  let current: unknown = input;
  for (const key of path) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<PropertyKey, unknown>)[key];
  }
  return current;
}

/**
 * Where in the FILE an issue is, in the words of the person who wrote it: the
 * round number and the match (not the array indexes), or the team. A field
 * that fails on its own — a malformed kickoff, an id that is not kebab-case —
 * gets the row it belongs to prefixed here, so every line names the row.
 */
function locate(input: unknown, path: readonly PropertyKey[]): string {
  const [head, index] = path;
  if (head === 'rounds' && typeof index === 'number') {
    const round = valueAt(input, ['rounds', index, 'round']);
    const label = `round ${typeof round === 'number' ? round : `#${index + 1}`}`;
    if (path[2] === 'matches' && typeof path[3] === 'number') {
      const home = valueAt(input, ['rounds', index, 'matches', path[3], 'home_id']);
      const away = valueAt(input, ['rounds', index, 'matches', path[3], 'away_id']);
      return `${label}, match ${String(home)}-${String(away)}`;
    }
    return label;
  }
  if (head === 'teams' && typeof index === 'number') {
    const id = valueAt(input, ['teams', index, 'id']);
    return `team ${typeof id === 'string' ? id : `#${index + 1}`}`;
  }
  return '';
}

/**
 * Validates a declared calendar WHOLE. Nothing else looks at the file before
 * this has said yes.
 */
export function parseSchedule(input: unknown): Schedule {
  const result = ScheduleSchema.safeParse(input);
  if (result.success) return result.data;

  throw new InvalidScheduleError(
    result.error.issues.map((issue) => {
      const where = locate(input, issue.path);
      const value = valueAt(input, issue.path);
      const got =
        typeof value === 'string' || typeof value === 'number' ? ` (got ${JSON.stringify(value)})` : '';
      // The cross checks already name the row in their own message.
      const prefix = where !== '' && !issue.message.startsWith(where) && issue.code !== 'custom'
        ? `${where}: `
        : '';
      return {
        path: issue.path.map(String).join('.'),
        message: `${prefix}${issue.message}${got}`,
      };
    }),
  );
}
