/**
 * `AlertStore` on Postgres (SPEC-013 CA-11, ADR-021 §5, migration 0006).
 *
 * Implements the port of `src/decide/ports.ts` AS IT IS: two operations.
 * Append-only is the BASE's business (`reject_amendment`, like `decisions`,
 * `calendar_loads` and `ingest_attempts`), not a discipline of this class.
 *
 * `postgres.js` with tagged SQL, no ORM (ADR-006). Every write is parsed with
 * `NewAlertSchema` ON THE WAY IN — before a single query — and every read is
 * parsed with `AlertSchema` ON THE WAY OUT, because the driver returns `any`.
 * Instants cross as `Z` strings (`createClient` converts them); `Date` does
 * not appear here. `raised_at` is normalised on the way in to the form the
 * database returns, with the converter of `src/polite/clock.ts`, for the same
 * reason and in the same way as `observed_at` and `decided_at`: the
 * repositories treat an instant alike.
 *
 * The array goes out as a LITERAL with a cast (`pgTextArray`, SPEC-010 CA-8.5):
 * the driver's array inference is unreliable on the first statement of a fresh
 * connection, and a cold start on Vercel is exactly that (F-SPEC-010-6).
 */
import { AlertSchema, NewAlertSchema } from '@/decide/alert';
import type { Alert, NewAlert } from '@/decide/alert';
import type { AlertStore, LatestAlerts } from '@/decide/ports';
import type { MatchId } from '@/model/ids';
import { epochMsOf, instantOf } from '@/polite/clock';
import { pgTextArray } from './arrays';
import type { Sql } from './client';

const COLUMNS = ['id', 'match_id', 'rule', 'raised_at', 'reason', 'observation_ids'] as const;

/** The alert as the database will hand it back: its instant in the stored form. */
function storedForm(alert: NewAlert): NewAlert {
  return NewAlertSchema.parse({
    ...alert,
    raised_at: instantOf(epochMsOf(alert.raised_at)),
  });
}

export class PostgresAlertStore implements AlertStore {
  readonly #sql: Sql;

  constructor(sql: Sql) {
    this.#sql = sql;
  }

  async append(alert: NewAlert): Promise<Alert> {
    // Zod first. Nothing below runs for a value the schema does not accept.
    const valid = storedForm(NewAlertSchema.parse(alert));

    // Bound to a local first: oxlint's `no-unused-private-class-members` does
    // not see a private field used as a tagged template (as in rate-limit.ts).
    const sql = this.#sql;
    const observations = pgTextArray(valid.observation_ids);

    const inserted = await sql<Record<string, unknown>[]>`
      insert into alerts (match_id, rule, raised_at, reason, observation_ids)
      values
        (${valid.match_id}, ${valid.rule}, ${valid.raised_at}, ${valid.reason},
         ${observations}::text[])
      returning ${sql(COLUMNS)}
    `;
    return AlertSchema.parse(inserted[0]);
  }

  async latestByMatch(matchId: MatchId): Promise<LatestAlerts> {
    const sql = this.#sql;
    // One statement, one row per rule: `distinct on` is what the index of 0006
    // is ordered for.
    const rows = await sql<Record<string, unknown>[]>`
      select distinct on (rule) ${sql(COLUMNS)}
        from alerts
       where match_id = ${matchId}
       order by rule, raised_at desc, id desc
    `;

    const parsed = rows.map((row) => AlertSchema.parse(row));
    return {
      conflict: parsed.find((alert) => alert.rule === 'RN-05') ?? null,
      silence: parsed.find((alert) => alert.rule === 'RN-07') ?? null,
    };
  }
}
