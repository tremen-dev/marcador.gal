/**
 * `ObservationStore` on Postgres (SPEC-010 CA-7; SPEC-001 CA-6, F-SPEC-001-3;
 * RN-13, ADR-006, ADR-017 §5).
 *
 * Implements the port of `./ports.ts` AS IT IS: no method added, none
 * removed. There is no `update` and no `delete` here for the same reason there
 * is none in the port — an Observation is a historical fact and a correction
 * is a NEW Observation (RN-13). A type test pins it.
 *
 * `postgres.js` with tagged SQL, no ORM (ADR-006). Every write is parsed with
 * `ObservationSchema` ON THE WAY IN — before a single query — and every read
 * is parsed ON THE WAY OUT, because the driver returns `any`. Instants cross
 * as `Z` strings (`createClient` converts them); `Date` does not appear here.
 *
 * `append` IS IDEMPOTENT FOR THE SAME OBSERVATION and refuses, with a named
 * error, a DIFFERENT one under the same id (ADR-017 §5). It is the rule of
 * `RawKeyConflictError` in the raw store — a key already written is not
 * overwritten in silence with different bytes — and it is what makes the
 * deterministic replay of a matchday (SPEC-008 CA-10) harmless without
 * loosening RN-13: different content still fails.
 */
import { ObservationSchema } from '@/model/observation';
import type { Observation } from '@/model/observation';
import type { MatchId, ObservationId } from '@/model/ids';
import type { Sql } from './client';
import type { ObservationStore } from './ports';

/** Thrown when a DIFFERENT Observation arrives under an id already stored. */
export class ObservationConflictError extends Error {
  override readonly name = 'ObservationConflictError';
  readonly id: ObservationId;

  constructor(id: ObservationId) {
    super(
      `observation ${id} already exists with different content: an Observation is never rewritten (RN-13); a correction is a new Observation`,
    );
    this.id = id;
  }
}

const COLUMNS = [
  'id',
  'match_id',
  'source',
  'observed_at',
  'status',
  'home_score',
  'away_score',
  'confidence',
  'raw_ref',
] as const;

/** Structural equality of two parsed Observations, key by key. */
function sameObservation(a: Observation, b: Observation): boolean {
  return COLUMNS.every((column) => a[column] === b[column]);
}

export class PostgresObservationStore implements ObservationStore {
  readonly #sql: Sql;

  constructor(sql: Sql) {
    this.#sql = sql;
  }

  async append(observation: Observation): Promise<Observation> {
    // Zod first. Nothing below runs for a value the model does not accept.
    const valid = ObservationSchema.parse(observation);

    // Bound to a local first: oxlint's `no-unused-private-class-members` does
    // not see a private field used as a tagged template (as in rate-limit.ts).
    const sql = this.#sql;

    const inserted = await sql<Record<string, unknown>[]>`
      insert into observations ${sql(valid, ...COLUMNS)}
      on conflict (id) do nothing
      returning ${sql(COLUMNS)}
    `;
    if (inserted.length === 1) return ObservationSchema.parse(inserted[0]);

    // The id was already there. Same content: the replay is harmless and the
    // stored row is the answer. Different content: refused by name.
    const stored = await this.getById(valid.id);
    if (stored === null) {
      // Someone deleted it between the two statements — which RN-13 forbids
      // and the trigger prevents. Not a case to handle gracefully.
      throw new Error(`unreachable: observation ${valid.id} conflicted and then vanished`);
    }
    if (!sameObservation(stored, valid)) throw new ObservationConflictError(valid.id);
    return stored;
  }

  async getById(id: ObservationId): Promise<Observation | null> {
    const sql = this.#sql;
    const rows = await sql<Record<string, unknown>[]>`
      select ${sql(COLUMNS)} from observations where id = ${id}
    `;
    return rows.length === 0 ? null : ObservationSchema.parse(rows[0]);
  }

  async listByMatch(matchId: MatchId): Promise<readonly Observation[]> {
    const sql = this.#sql;
    const rows = await sql<Record<string, unknown>[]>`
      select ${sql(COLUMNS)} from observations
       where match_id = ${matchId}
       order by observed_at asc, id asc
    `;
    return rows.map((row) => ObservationSchema.parse(row));
  }
}
