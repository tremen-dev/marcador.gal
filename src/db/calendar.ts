/**
 * Loading a declared calendar into Postgres (SPEC-010 §4, CA-4, CA-5;
 * ADR-017 §2).
 *
 * `postgres.js` with tagged SQL and no ORM (ADR-006). ONE TRANSACTION, and
 * inside it, in this order:
 *
 *   1. `competitions`: insert if absent; if present with another name, season
 *      or group, REFUSE — a competition is not redefined from a calendar.
 *   2. `teams`: insert the new ones; a changed `canonical_name` is updated and
 *      reported.
 *   3. `matches`, by the derived id: insert, or update `kickoff`/`venue` when
 *      they changed, or nothing. The identity never moves: a match whose
 *      identity changed IS ANOTHER MATCH, and the database's own trigger
 *      would refuse the update anyway (migration 0003).
 *   4. ORPHANS: matches of this competition, IN THE ROUNDS THE FILE DECLARES,
 *      that the file does not name. Reported. NEVER DELETED — deleting is a
 *      different act from loading, and today it has no spec.
 *   5. One row in `calendar_loads`: who declared, when, from which bytes
 *      (digest), which rounds, how many matches, what the load did.
 *
 * If any step fails, NOTHING is written — the load record included.
 *
 * The clock is injected (`src/polite/clock.ts`, the one place the wall clock
 * is read, ADR-014 §1). Instants cross as `Z` strings: `createClient`
 * converts them, and `Date` does not appear here (ADR-006).
 *
 * This module makes NO network request. RN-11 is not exercised: there is
 * nobody to ask (ADR-017 §1).
 */
import { declaredMatches } from '@/calendar/declared';
import type { DeclaredCalendar } from '@/calendar/declared';
import type { CompetitionId, MatchId, TeamId } from '@/model/ids';
import type { Match } from '@/model/match';
import { epochMsOf, instantOf, systemClock } from '@/polite/clock';
import type { Clock } from '@/polite/clock';
import type { TransactionSql } from 'postgres';
import { pgIntArray, pgTextArray } from './arrays';
import type { Sql } from './client';

/** Thrown when a file names a competition that exists with other data. */
export class CompetitionRedefinedError extends Error {
  override readonly name = 'CompetitionRedefinedError';
  readonly competitionId: CompetitionId;

  constructor(competitionId: CompetitionId, stored: string, declared: string) {
    super(
      `competition ${competitionId} already exists as ${stored} and the calendar declares it as ${declared}: ` +
        'a competition is not redefined from a calendar',
    );
    this.competitionId = competitionId;
  }
}

export interface LoadResult {
  readonly inserted: readonly MatchId[];
  readonly updated: readonly MatchId[];
  /** In the database, in a declared round, not in the file. Still there. */
  readonly orphans: readonly MatchId[];
  readonly teams_inserted: number;
  readonly teams_renamed: readonly TeamId[];
  /** `calendar_loads.id` of the row this load wrote. */
  readonly load_id: number;
}

export interface LoadOptions {
  readonly clock?: Clock;
}

interface CompetitionRow {
  readonly name: string;
  readonly season: string;
  readonly group: string;
}

interface TeamRow {
  readonly id: string;
  readonly canonical_name: string;
}

interface StoredMatchRow {
  readonly id: string;
  readonly kickoff: string;
  readonly venue: string | null;
}

const describeCompetition = (row: CompetitionRow): string =>
  `(name ${JSON.stringify(row.name)}, season ${row.season}, group ${row.group})`;

export async function loadSchedule(
  sql: Sql,
  file: DeclaredCalendar,
  options: LoadOptions = {},
): Promise<LoadResult> {
  const clock = options.clock ?? systemClock;
  const { schedule } = file;
  const competitionId = schedule.competition.id as CompetitionId;
  const matches = declaredMatches(schedule);
  const rounds = schedule.rounds.map((round) => round.round);

  return sql.begin(async (tx) => {
    // 1. The competition.
    const existing = await tx<CompetitionRow[]>`
      select name, season, "group" from competitions where id = ${competitionId}
    `;
    const declared: CompetitionRow = {
      name: schedule.competition.name,
      season: schedule.competition.season,
      group: schedule.competition.group,
    };
    if (existing.length === 0) {
      await tx`
        insert into competitions (id, name, season, "group")
        values (${competitionId}, ${declared.name}, ${declared.season}, ${declared.group})
      `;
    } else {
      const stored = existing[0]!;
      if (
        stored.name !== declared.name ||
        stored.season !== declared.season ||
        stored.group !== declared.group
      ) {
        throw new CompetitionRedefinedError(
          competitionId,
          describeCompetition(stored),
          describeCompetition(declared),
        );
      }
    }

    // 2. The teams.
    const teamIds = schedule.teams.map((team) => team.id);
    const storedTeams = new Map(
      (
        await tx<TeamRow[]>`
          select id, canonical_name from teams where id = any(${pgTextArray(teamIds)}::text[])
        `
      ).map((row) => [row.id, row.canonical_name]),
    );
    const newTeams = schedule.teams.filter((team) => !storedTeams.has(team.id));
    if (newTeams.length > 0) {
      await tx`
        insert into teams ${sql(
          newTeams.map((team) => ({ id: team.id, canonical_name: team.canonical_name })),
          'id',
          'canonical_name',
        )}
      `;
    }
    const renamed: TeamId[] = [];
    for (const team of schedule.teams) {
      const stored = storedTeams.get(team.id);
      if (stored !== undefined && stored !== team.canonical_name) {
        await tx`update teams set canonical_name = ${team.canonical_name} where id = ${team.id}`;
        renamed.push(team.id as TeamId);
      }
    }

    // 3. The matches, and 4. the orphans — both against what the database
    // holds for this competition in the declared rounds.
    const storedMatches = new Map(
      (
        await tx<StoredMatchRow[]>`
          select id, kickoff, venue from matches
           where competition_id = ${competitionId} and round = any(${pgIntArray(rounds)}::integer[])
        `
      ).map((row) => [row.id, row]),
    );

    const inserted: MatchId[] = [];
    const updated: MatchId[] = [];
    for (const match of matches) {
      const stored = storedMatches.get(match.id);
      if (stored === undefined) {
        await insertMatch(tx, match);
        inserted.push(match.id);
      } else if (stored.kickoff !== match.kickoff || stored.venue !== match.venue) {
        await tx`
          update matches set kickoff = ${match.kickoff}, venue = ${match.venue}
           where id = ${match.id}
        `;
        updated.push(match.id);
      }
    }

    const declaredIds = new Set<string>(matches.map((match) => match.id));
    const orphans = [...storedMatches.keys()]
      .filter((id) => !declaredIds.has(id))
      .sort()
      .map((id) => id as MatchId);

    // 5. The record of the act.
    const loadedAt = clock.now();
    const declaredAt = instantOf(epochMsOf(schedule.declared_at));
    const [load] = await tx<{ id: number }[]>`
      insert into calendar_loads
        (competition_id, declared_by, declared_at, loaded_at, file_digest, rounds,
         matches_count, inserted, updated)
      values
        (${competitionId}, ${schedule.declared_by}, ${declaredAt}, ${loadedAt},
         ${file.digest}, ${pgIntArray(rounds)}::integer[], ${matches.length},
         ${inserted.length}, ${updated.length})
      returning id
    `;
    if (load === undefined) throw new Error('unreachable: calendar_loads insert returned no row');

    return {
      inserted,
      updated,
      orphans,
      teams_inserted: newTeams.length,
      teams_renamed: renamed,
      load_id: load.id,
    };
  });
}

async function insertMatch(tx: TransactionSql, match: Match): Promise<void> {
  await tx`
    insert into matches (id, competition_id, round, kickoff, home_id, away_id, venue)
    values (${match.id}, ${match.competition_id}, ${match.round}, ${match.kickoff},
            ${match.home_id}, ${match.away_id}, ${match.venue})
  `;
}
