/**
 * `DecisionStore` on Postgres (SPEC-010 CA-8; SPEC-001 CA-6, F-SPEC-001-3;
 * RN-12, ADR-004, ADR-006, ADR-017 §5).
 *
 * Implements the port of `./ports.ts` AS IT IS: no method added, none
 * removed. No `update`, no `delete`: a Decision log is append-only and the
 * highest version per match is the live one (dominio.md). A type test pins it.
 *
 * `postgres.js` with tagged SQL, no ORM (ADR-006). Every write is parsed with
 * `DecisionSchema` ON THE WAY IN — before a single query — which is the first
 * net of RN-12 (`rule` in the engine's vocabulary, at least one supporting
 * observation); the `CHECK`s and the trigger of migration 0001 are the second,
 * inherited and not reimplemented (CA-8.4, CA-8.6). Every read is parsed ON
 * THE WAY OUT. Instants cross as `Z` strings; `Date` does not appear here.
 *
 * THE VERSION IS ARBITRATED BY THE DATABASE (ADR-017 §5). Migration 0003
 * requires `version = max + 1` per match and the primary key of 0001 lets
 * exactly one of two concurrent writers of the same version win. Both
 * refusals surface here as ONE named error, `DecisionVersionConflictError`,
 * distinguishable from any other failure: the engine that receives it knows
 * the log moved under its feet and decides what to do; it does NOT compute
 * its version hoping to be alone (F-SPEC-008-V13, applied to the entity that
 * reaches the screen). Every other error — the foreign key, the RN-12 trigger,
 * the CHECKs — comes out unwrapped, as SPEC-001 wrote it.
 */
import { DecisionSchema } from '@/model/decision';
import type { Decision } from '@/model/decision';
import type { MatchId } from '@/model/ids';
import { pgTextArray } from './arrays';
import type { Sql } from './client';
import type { DecisionStore } from './ports';

/**
 * Thrown when the database refuses the version: it is not `max + 1`, or
 * another writer took it first.
 */
export class DecisionVersionConflictError extends Error {
  override readonly name = 'DecisionVersionConflictError';
  readonly matchId: MatchId;
  readonly version: number;

  constructor(matchId: MatchId, version: number, reason: string) {
    super(`decision version ${version} for match ${matchId} was refused by the database: ${reason}`);
    this.matchId = matchId;
    this.version = version;
  }
}

const COLUMNS = [
  'match_id',
  'status',
  'home_score',
  'away_score',
  'provisional',
  'rule',
  'decided_at',
  'supporting_observation_ids',
  'version',
] as const;

/** The two shapes the database's arbitration takes (migration 0003). */
function isVersionConflict(error: unknown): error is { readonly message: string } {
  if (error === null || typeof error !== 'object') return false;
  const { code, constraint_name, message } = error as {
    code?: string;
    constraint_name?: string;
    message?: string;
  };
  // Two writers, same version: the primary key (match_id, version) of 0001.
  if (code === '23505' && constraint_name === 'decisions_pkey') return true;
  // A gap, or a first version that is not 1: the contiguity trigger of 0003.
  return code === '23000' && typeof message === 'string' && message.includes('not contiguous');
}

export class PostgresDecisionStore implements DecisionStore {
  readonly #sql: Sql;

  constructor(sql: Sql) {
    this.#sql = sql;
  }

  async append(decision: Decision): Promise<Decision> {
    // Zod first. Nothing below runs for a value the model does not accept.
    const valid = DecisionSchema.parse(decision);

    const sql = this.#sql;
    // Written as a literal, not handed over as a JS array: see `./arrays.ts`.
    const support = pgTextArray(valid.supporting_observation_ids);

    try {
      const inserted = await sql<Record<string, unknown>[]>`
        insert into decisions
          (match_id, status, home_score, away_score, provisional,
           rule, decided_at, supporting_observation_ids, version)
        values
          (${valid.match_id}, ${valid.status}, ${valid.home_score}, ${valid.away_score},
           ${valid.provisional}, ${valid.rule}, ${valid.decided_at}, ${support}::text[],
           ${valid.version})
        returning ${sql(COLUMNS)}
      `;
      return DecisionSchema.parse(inserted[0]);
    } catch (error) {
      if (isVersionConflict(error)) {
        throw new DecisionVersionConflictError(valid.match_id, valid.version, error.message);
      }
      throw error;
    }
  }

  async getLatestByMatch(matchId: MatchId): Promise<Decision | null> {
    const sql = this.#sql;
    const rows = await sql<Record<string, unknown>[]>`
      select ${sql(COLUMNS)} from decisions
       where match_id = ${matchId}
       order by version desc
       limit 1
    `;
    return rows.length === 0 ? null : DecisionSchema.parse(rows[0]);
  }

  async listByMatch(matchId: MatchId): Promise<readonly Decision[]> {
    const sql = this.#sql;
    const rows = await sql<Record<string, unknown>[]>`
      select ${sql(COLUMNS)} from decisions
       where match_id = ${matchId}
       order by version asc
    `;
    return rows.map((row) => DecisionSchema.parse(row));
  }
}
