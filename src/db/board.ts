/**
 * The two READ-ONLY name readers the scoreboard needs, on Postgres
 * (SPEC-018 CA-5.1; ADR-006, ADR-017 §5).
 *
 * A NEW FILE, not an edit: `src/db/admin.ts` is the home of the panel's
 * implementations and it carries WRITE templates (`alert_acks`,
 * `operator_actions`). Importing it from `src/api/` would put those templates
 * on the graph of a surface whose whole criterion is that it writes nothing
 * (CA-4.1), and editing it would be touching a closed spec's file for a
 * motive that is not its own (CA-17.2 (i)).
 *
 * Both read from the DECLARED CALENDAR (`teams`, `competitions`), which is a
 * HUMAN DECLARATION and not a datum of any source (ADR-017): the canonical
 * RFGF names are the best defensive piece this project has the day it
 * publishes, because the selection, the order and the names are ours and what
 * is taken from a third party reduces to ONE VOLATILE FIELD PER MATCH.
 *
 * `postgres.js` with tagged SQL, no ORM. There is NO `insert`, NO `update` and
 * NO `delete` in this file, and there never can be: what writes the calendar is
 * `loadSchedule` (`src/db/calendar.ts`) and nothing else.
 *
 * THE NAMES ARE NEVER TRANSLATED, NEVER ABBREVIATED, NEVER TRUNCATED
 * (`dominio.md`, ADR-013 §4, `sdd-competicion` §6). In Terceira RFEF there are
 * reserve sides told apart by one final letter.
 */
import { pgTextArray } from './arrays';
import type { Sql } from './client';
import type { CompetitionNameReader, TeamNameReader } from '@/api/ports';
import type { CompetitionId, TeamId } from '@/model/ids';

export class PostgresBoardTeamNames implements TeamNameReader {
  readonly #sql: Sql;

  constructor(sql: Sql) {
    this.#sql = sql;
  }

  async namesOf(ids: readonly TeamId[]): Promise<ReadonlyMap<TeamId, string>> {
    if (ids.length === 0) return new Map();
    const sql = this.#sql;

    const rows = await sql<{ id: string; canonical_name: string }[]>`
      select id, canonical_name from teams where id = any (${pgTextArray(ids)}::text[])
    `;
    return new Map(rows.map((row) => [row.id as TeamId, row.canonical_name]));
  }
}

/**
 * The canonical name of a competition, ENTIRE. `competitions.name` is what the
 * declared calendar wrote — «Preferente Futgal Grupo 1», «Terceira RFEF Grupo
 * 1» — and it is the heading of the group on the screen (CA-11.1), never
 * abbreviated.
 */
export class PostgresBoardCompetitionNames implements CompetitionNameReader {
  readonly #sql: Sql;

  constructor(sql: Sql) {
    this.#sql = sql;
  }

  async namesOf(ids: readonly CompetitionId[]): Promise<ReadonlyMap<CompetitionId, string>> {
    if (ids.length === 0) return new Map();
    const sql = this.#sql;

    const rows = await sql<{ id: string; name: string }[]>`
      select id, name from competitions where id = any (${pgTextArray(ids)}::text[])
    `;
    return new Map(rows.map((row) => [row.id as CompetitionId, row.name]));
  }
}
