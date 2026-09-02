/**
 * `IngestAttemptLog` on Postgres (SPEC-012 CA-5, ADR-019 §5, migration 0005).
 *
 * Implements the port of `src/ingest/attempts.ts` AS IT IS: one operation.
 * Append-only is the BASE's business (`reject_amendment`, like
 * `calendar_loads` and `alias_loads`), not a discipline of this class.
 *
 * `postgres.js` with tagged SQL, no ORM (ADR-006). The instant crosses as a
 * `Z` string (`createClient` converts it); `Date` does not appear here. The
 * array goes out as a literal with a cast (`pgTextArray`, SPEC-010 CA-8.5):
 * the driver's array inference is unreliable on a fresh connection.
 */
import { pgTextArray } from './arrays';
import type { IngestAttempt, IngestAttemptLog } from '@/ingest/attempts';
import type { Sql } from './client';

export class PostgresIngestAttemptLog implements IngestAttemptLog {
  readonly #sql: Sql;

  constructor(sql: Sql) {
    this.#sql = sql;
  }

  async append(attempt: IngestAttempt): Promise<void> {
    // Bound to a local first: oxlint's `no-unused-private-class-members` does
    // not see a private field used as a tagged template (as in rate-limit.ts).
    const sql = this.#sql;

    await sql`
      insert into ingest_attempts
        (source, competition_id, attempted_at, outcome, reason, raw_ref,
         observations_count, unresolved_names)
      values
        (${attempt.source}, ${attempt.competition_id},
         ${attempt.attempted_at}::timestamptz, ${attempt.outcome},
         ${attempt.reason}, ${attempt.raw_ref}, ${attempt.observations_count},
         ${pgTextArray(attempt.unresolved_names)}::text[])
    `;
  }
}
