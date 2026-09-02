/**
 * `MatchStore` on Postgres (SPEC-010 CA-9, ADR-006, ADR-017 §5).
 *
 * Read-only over what `loadSchedule` wrote. `postgres.js` with tagged SQL,
 * no ORM; every row is parsed with `MatchSchema` ON THE WAY OUT, because the
 * driver returns `any`. `kickoff` crosses as a `Z` string (`createClient`
 * converts it); `Date` does not appear here.
 */
import type { MatchStore } from '@/calendar/ports';
import type { CompetitionId, Instant, MatchId, TeamId } from '@/model/ids';
import { MatchSchema } from '@/model/match';
import type { Match } from '@/model/match';
import type { Sql } from './client';

const COLUMNS = ['id', 'competition_id', 'round', 'kickoff', 'home_id', 'away_id', 'venue'] as const;

export class PostgresMatchStore implements MatchStore {
  readonly #sql: Sql;

  constructor(sql: Sql) {
    this.#sql = sql;
  }

  async getById(id: MatchId): Promise<Match | null> {
    const sql = this.#sql;
    const rows = await sql<Record<string, unknown>[]>`
      select ${sql(COLUMNS)} from matches where id = ${id}
    `;
    return rows.length === 0 ? null : MatchSchema.parse(rows[0]);
  }

  async listByRound(competitionId: CompetitionId, round: number): Promise<readonly Match[]> {
    const sql = this.#sql;
    const rows = await sql<Record<string, unknown>[]>`
      select ${sql(COLUMNS)} from matches
       where competition_id = ${competitionId} and round = ${round}
       order by kickoff asc, id asc
    `;
    return rows.map((row) => MatchSchema.parse(row));
  }

  async listByTeams(
    competitionId: CompetitionId,
    homeId: TeamId,
    awayId: TeamId,
  ): Promise<readonly Match[]> {
    const sql = this.#sql;
    const rows = await sql<Record<string, unknown>[]>`
      select ${sql(COLUMNS)} from matches
       where competition_id = ${competitionId} and home_id = ${homeId} and away_id = ${awayId}
       order by kickoff asc, id asc
    `;
    return rows.map((row) => MatchSchema.parse(row));
  }

  async listKickoffsBetween(from: Instant, to: Instant): Promise<readonly Match[]> {
    const sql = this.#sql;
    const rows = await sql<Record<string, unknown>[]>`
      select ${sql(COLUMNS)} from matches
       where kickoff >= ${from}::timestamptz and kickoff < ${to}::timestamptz
       order by kickoff asc, id asc
    `;
    return rows.map((row) => MatchSchema.parse(row));
  }
}
