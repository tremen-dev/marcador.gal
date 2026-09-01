/**
 * The rhythm of RN-11 made durable (SPEC-008 CA-14, migration 0002).
 *
 * `postgres.js` with tagged SQL and no ORM (ADR-006). One statement, and it is
 * the whole implementation:
 *
 *   insert … on conflict (pair) do update … where <last is at or before the
 *   limit> returning …
 *
 * It returns a row when it grants the turn and none when it denies it, and two
 * concurrent instances CANNOT both win: the second waits on the row lock and
 * then re-evaluates the `where` against what the first wrote. That is the one
 * property the archive cannot give, and the reason this is a table (ledger,
 * «Enmienda — 2026-09-01» §4).
 *
 * THE INTERVAL IS NOT WRITTEN HERE (CA-14.6). `MIN_REQUEST_INTERVAL_MS` lives
 * in `src/polite/rate-limit.ts`; this class receives the LIMIT INSTANT already
 * computed and its SQL carries no arithmetic over time. Move the constant and
 * both implementations move together.
 *
 * The `do update` sets the stamp to the CURRENT instant, never to the previous
 * one plus a minute, so unspent turns do not pile up — which is literally what
 * `/robot` promises in Galician and in Spanish (SPEC-005, ADR-011).
 *
 * FAILING IS FAILING CLOSED (CA-14.7). If the query throws, this method
 * throws, and the caller sends nothing: without state of the rhythm there is
 * no demonstrable rhythm, and ADR-014 §3.3 already settled that in production
 * that is resolved by closing.
 */
import { instantOf } from '@/polite/clock';
import { MIN_REQUEST_INTERVAL_MS, turnLimitMs } from '@/polite/rate-limit';
import type { Sql } from './client';
import type { RateLimit } from '@/polite/rate-limit';

export class PostgresRateLimit implements RateLimit {
  readonly #sql: Sql;
  readonly #intervalMs: number;

  constructor(sql: Sql, intervalMs: number = MIN_REQUEST_INTERVAL_MS) {
    this.#sql = sql;
    this.#intervalMs = intervalMs;
  }

  async takeTurn(key: string, epochMs: number): Promise<boolean> {
    const now = instantOf(epochMs);
    const limit = instantOf(turnLimitMs(epochMs, this.#intervalMs));

    // Bound to a local first: oxlint's `no-unused-private-class-members` does
    // not see a private field used as a TAGGED TEMPLATE with type arguments,
    // and the gate of ADR-007 has to stay green without an inline disable.
    const sql = this.#sql;

    const granted = await sql<{ pair: string }[]>`
      insert into request_rhythm (pair, last_request_at)
      values (${key}, ${now}::timestamptz)
      on conflict (pair) do update
        set last_request_at = excluded.last_request_at
        where request_rhythm.last_request_at <= ${limit}::timestamptz
      returning pair
    `;

    return granted.length === 1;
  }
}
