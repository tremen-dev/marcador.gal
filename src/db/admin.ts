/**
 * The ports of the panel on Postgres (SPEC-017 CA-6, CA-8, CA-12;
 * ADR-006, migration 0008).
 *
 * Implements the ports of `src/admin/ports.ts` AS THEY ARE. Append-only is the
 * BASE's business (`reject_amendment`, like `alerts`, `decisions`,
 * `calendar_loads` and `ingest_attempts`), not a discipline of these classes:
 * there is no `update` and no `delete` anywhere below, and there could not be
 * one — the triggers of 0008 refuse both.
 *
 * `postgres.js` with tagged SQL, no ORM (ADR-006). Instants cross as `Z`
 * strings (`createClient` converts them); `Date` does not appear here.
 * `acked_at` and the two instants of an action are normalised on the way in to
 * the form the database returns, with the converter of `src/polite/clock.ts`,
 * for the same reason and in the same way as `observed_at`, `decided_at` and
 * `raised_at`: the repositories treat an instant alike.
 *
 * THIS FILE DOES NOT NAME THE TABLE `decisions` AND IMPORTS NO DECISION STORE.
 * Reading the decision log is the business of the read-only door of
 * `src/decide/read-entry.ts`, which is inside the module RN-08 gives that
 * capability to. `DECISION_WRITERS` does not grow because of this file.
 */
import { AlertSchema } from '@/decide/alert';
import { epochMsOf, instantOf } from '@/polite/clock';
import type {
  AdminAlertReader,
  AlertAck,
  AlertAckStore,
  OperatorActionLog,
  OperatorActionRecord,
  TeamNameReader,
} from '@/admin/ports';
import type { Alert } from '@/decide/alert';
import type { Instant, MatchId, TeamId } from '@/model/ids';
import { pgIntArray, pgTextArray } from './arrays';
import type { Sql } from './client';

const ALERT_COLUMNS = [
  'id',
  'match_id',
  'rule',
  'raised_at',
  'reason',
  'observation_ids',
] as const;

/**
 * The tray's reader over `alerts`. READ ONLY, and that is the whole surface:
 * the table is a historical fact and the acknowledgement lives beside it.
 */
export class PostgresAdminAlertReader implements AdminAlertReader {
  readonly #sql: Sql;

  constructor(sql: Sql) {
    this.#sql = sql;
  }

  async listByMatches(matchIds: readonly MatchId[]): Promise<readonly Alert[]> {
    if (matchIds.length === 0) return [];
    const sql = this.#sql;
    const ids = pgTextArray(matchIds);

    const rows = await sql<Record<string, unknown>[]>`
      select ${sql(ALERT_COLUMNS)}
        from alerts
       where match_id = any (${ids}::text[])
       order by raised_at desc, id desc
    `;
    return rows.map((row) => AlertSchema.parse(row));
  }

  async getById(id: number): Promise<Alert | null> {
    const sql = this.#sql;
    const rows = await sql<Record<string, unknown>[]>`
      select ${sql(ALERT_COLUMNS)} from alerts where id = ${id}
    `;
    return rows.length === 0 ? null : AlertSchema.parse(rows[0]);
  }
}

/** Acknowledgements. One per alert, and the base is what makes that true. */
export class PostgresAlertAckStore implements AlertAckStore {
  readonly #sql: Sql;

  constructor(sql: Sql) {
    this.#sql = sql;
  }

  async append(ack: AlertAck): Promise<boolean> {
    const sql = this.#sql;
    const ackedAt = instantOf(epochMsOf(ack.acked_at));

    // `on conflict do nothing` is the idempotence of CA-6.7 read off the
    // `unique (alert_id)` of 0008: the second acknowledgement writes no row.
    // It is not an `update` in disguise — the trigger would refuse one.
    const inserted = await sql<{ alert_id: number }[]>`
      insert into alert_acks (alert_id, acked_at, raw_ref)
      values (${ack.alert_id}, ${ackedAt}::timestamptz, ${ack.raw_ref})
      on conflict (alert_id) do nothing
      returning alert_id
    `;
    return inserted.length > 0;
  }

  async ackedAt(alertIds: readonly number[]): Promise<ReadonlyMap<number, Instant>> {
    if (alertIds.length === 0) return new Map();
    const sql = this.#sql;
    const ids = pgIntArray([...alertIds]);

    const rows = await sql<{ alert_id: number; acked_at: string }[]>`
      select alert_id, acked_at
        from alert_acks
       where alert_id = any (${ids}::integer[])
    `;
    return new Map(rows.map((row) => [row.alert_id, row.acked_at as Instant]));
  }
}

const ACTION_COLUMNS = [
  'action',
  'match_id',
  'alert_id',
  'started_at',
  'submitted_at',
  'outcome',
  'raw_ref',
] as const;

/** The register of what the panel did. Append-only, and no person inside. */
export class PostgresOperatorActionLog implements OperatorActionLog {
  readonly #sql: Sql;

  constructor(sql: Sql) {
    this.#sql = sql;
  }

  async append(record: OperatorActionRecord): Promise<void> {
    const sql = this.#sql;

    await sql`
      insert into operator_actions
        (action, match_id, alert_id, started_at, submitted_at, outcome, raw_ref)
      values
        (${record.action}, ${record.match_id}, ${record.alert_id},
         ${instantOf(epochMsOf(record.started_at))}::timestamptz,
         ${instantOf(epochMsOf(record.submitted_at))}::timestamptz,
         ${record.outcome}, ${record.raw_ref})
    `;
  }

  async listBetween(from: Instant, to: Instant): Promise<readonly OperatorActionRecord[]> {
    const sql = this.#sql;
    const rows = await sql<Record<string, unknown>[]>`
      select ${sql(ACTION_COLUMNS)}
        from operator_actions
       where submitted_at >= ${from}::timestamptz and submitted_at < ${to}::timestamptz
       order by submitted_at asc, id asc
    `;
    return rows.map((row) => row as unknown as OperatorActionRecord);
  }
}

/** The canonical names of the RFGF, from the declared calendar (CA-12.1). */
export class PostgresTeamNameReader implements TeamNameReader {
  readonly #sql: Sql;

  constructor(sql: Sql) {
    this.#sql = sql;
  }

  async namesOf(ids: readonly TeamId[]): Promise<ReadonlyMap<TeamId, string>> {
    if (ids.length === 0) return new Map();
    const sql = this.#sql;
    const wanted = pgTextArray(ids);

    const rows = await sql<{ id: string; canonical_name: string }[]>`
      select id, canonical_name from teams where id = any (${wanted}::text[])
    `;
    return new Map(rows.map((row) => [row.id as TeamId, row.canonical_name]));
  }
}
