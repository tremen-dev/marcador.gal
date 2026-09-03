/**
 * The bot's ports on Postgres (SPEC-015; ADR-006, ADR-022 §4, migration 0007).
 *
 * Implements the ports of `src/bot/ports.ts` AS THEY ARE. `postgres.js` with
 * tagged SQL, no ORM (ADR-006): every write is parsed with zod ON THE WAY IN,
 * before a single query, and every read ON THE WAY OUT, because the driver
 * returns `any`. Instants cross as `Z` strings (`createClient` converts them)
 * and are normalised on the way in with the converter of `src/polite/clock.ts`,
 * for the same reason and in the same way as `observed_at`, `decided_at` and
 * `raised_at`: the repositories of this repository treat an instant alike.
 *
 * `ProposalStore` HAS A `remove`, and that is not a weakening of RN-13. RN-13
 * governs the LOG OF HISTORICAL FACTS — `Observation` and `Decision` — and a
 * pending proposal is an act in progress, like an `ingest_attempt`. Deleting it
 * IS resolving it, and it is what keeps the `correspondent_id` from having a
 * second durable home (ADR-022 §4, CA-10.2).
 *
 * `RejectionCounter` WRITES AN AGGREGATE AND NOTHING ELSE: day, reason, count.
 * There is no statement here that could put a person in that table, and the
 * table has no column that could hold one (migration 0007).
 */
import { z } from 'zod';
import { CorrespondentIdSchema } from '@/bot/correspondents';
import { ProposalSchema } from '@/bot/proposal';
import { InstantSchema, MatchIdSchema, TeamIdSchema } from '@/model/ids';
import { RawRefSchema } from '@/raw/key';
import { epochMsOf, instantOf } from '@/polite/clock';
import type {
  CorrespondentState,
  CorrespondentStateStore,
  PendingProposal,
  ProposalStore,
  RejectionCounter,
  RejectionReason,
  TeamNameStore,
} from '@/bot/ports';
import type { CorrespondentId } from '@/bot/correspondents';
import type { BotLocale } from '@/i18n/bot';
import type { Instant, MatchId, TeamId } from '@/model/ids';
import type { Sql } from './client';

const LocaleSchema = z.enum(['gl', 'es']);

const PendingProposalSchema = z
  .object({
    id: z.string().min(1),
    correspondent_id: CorrespondentIdSchema,
    match_id: MatchIdSchema.nullable(),
    proposal: ProposalSchema,
    message_raw_ref: RawRefSchema,
    proposal_raw_ref: RawRefSchema,
    created_at: InstantSchema,
    expires_at: InstantSchema,
  })
  .readonly();

const RowSchema = z.object({
  id: z.string(),
  correspondent_id: CorrespondentIdSchema,
  match_id: MatchIdSchema.nullable(),
  status: z.string(),
  home_score: z.number().nullable(),
  away_score: z.number().nullable(),
  minute: z.number().nullable(),
  message_raw_ref: RawRefSchema,
  proposal_raw_ref: RawRefSchema,
  created_at: InstantSchema,
  expires_at: InstantSchema,
});

const COLUMNS = [
  'id',
  'correspondent_id',
  'match_id',
  'status',
  'home_score',
  'away_score',
  'minute',
  'message_raw_ref',
  'proposal_raw_ref',
  'created_at',
  'expires_at',
] as const;

/** The proposal as the database will hand it back: instants in the stored form. */
function storedForm(pending: PendingProposal): PendingProposal {
  return PendingProposalSchema.parse({
    ...pending,
    created_at: instantOf(epochMsOf(pending.created_at)),
    expires_at: instantOf(epochMsOf(pending.expires_at)),
  });
}

function fromRow(row: unknown): PendingProposal {
  const parsed = RowSchema.parse(row);
  return PendingProposalSchema.parse({
    id: parsed.id,
    correspondent_id: parsed.correspondent_id,
    match_id: parsed.match_id,
    proposal: {
      match_id: parsed.match_id,
      status: parsed.status,
      home_score: parsed.home_score,
      away_score: parsed.away_score,
      minute: parsed.minute,
    },
    message_raw_ref: parsed.message_raw_ref,
    proposal_raw_ref: parsed.proposal_raw_ref,
    created_at: parsed.created_at,
    expires_at: parsed.expires_at,
  });
}

export class PostgresProposalStore implements ProposalStore {
  readonly #sql: Sql;

  constructor(sql: Sql) {
    this.#sql = sql;
  }

  async put(pending: PendingProposal): Promise<PendingProposal> {
    const valid = storedForm(PendingProposalSchema.parse(pending));
    const sql = this.#sql;

    const rows = await sql<Record<string, unknown>[]>`
      insert into bot_proposals
        (id, correspondent_id, match_id, status, home_score, away_score, minute,
         message_raw_ref, proposal_raw_ref, created_at, expires_at)
      values
        (${valid.id}, ${valid.correspondent_id}, ${valid.match_id},
         ${valid.proposal.status}, ${valid.proposal.home_score},
         ${valid.proposal.away_score}, ${valid.proposal.minute},
         ${valid.message_raw_ref}, ${valid.proposal_raw_ref},
         ${valid.created_at}, ${valid.expires_at})
      returning ${sql(COLUMNS)}
    `;
    const row = rows[0];
    if (row === undefined) throw new Error('unreachable: insert returned no row');
    return fromRow(row);
  }

  async getById(id: string): Promise<PendingProposal | null> {
    const sql = this.#sql;
    const rows = await sql<Record<string, unknown>[]>`
      select ${sql(COLUMNS)} from bot_proposals where id = ${id}
    `;
    const row = rows[0];
    return row === undefined ? null : fromRow(row);
  }

  async remove(id: string): Promise<boolean> {
    const sql = this.#sql;
    const rows = await sql<Record<string, unknown>[]>`
      delete from bot_proposals where id = ${id} returning id
    `;
    return rows.length > 0;
  }

  async latestOf(correspondentId: CorrespondentId): Promise<PendingProposal | null> {
    const sql = this.#sql;
    const rows = await sql<Record<string, unknown>[]>`
      select ${sql(COLUMNS)} from bot_proposals
       where correspondent_id = ${correspondentId}
       order by created_at desc, id desc
       limit 1
    `;
    const row = rows[0];
    return row === undefined ? null : fromRow(row);
  }

  async pick(id: string, matchId: MatchId): Promise<PendingProposal | null> {
    const sql = this.#sql;
    const rows = await sql<Record<string, unknown>[]>`
      update bot_proposals set match_id = ${MatchIdSchema.parse(matchId)}
       where id = ${id} and match_id is null
      returning ${sql(COLUMNS)}
    `;
    const row = rows[0];
    return row === undefined ? null : fromRow(row);
  }

  async removeExpired(at: Instant): Promise<number> {
    const sql = this.#sql;
    const cutoff = instantOf(epochMsOf(InstantSchema.parse(at)));
    const rows = await sql<Record<string, unknown>[]>`
      delete from bot_proposals where expires_at <= ${cutoff} returning id
    `;
    return rows.length;
  }
}

const StateRowSchema = z.object({
  correspondent_id: CorrespondentIdSchema,
  locale: LocaleSchema.nullable(),
  notice_sent_at: InstantSchema.nullable(),
  opted_out_at: InstantSchema.nullable(),
});

const STATE_COLUMNS = [
  'correspondent_id',
  'locale',
  'notice_sent_at',
  'opted_out_at',
] as const;

export class PostgresCorrespondentStateStore implements CorrespondentStateStore {
  readonly #sql: Sql;

  constructor(sql: Sql) {
    this.#sql = sql;
  }

  async get(id: CorrespondentId): Promise<CorrespondentState | null> {
    const sql = this.#sql;
    const rows = await sql<Record<string, unknown>[]>`
      select ${sql(STATE_COLUMNS)} from correspondent_state where correspondent_id = ${id}
    `;
    const row = rows[0];
    return row === undefined ? null : StateRowSchema.parse(row);
  }

  async setLocale(id: CorrespondentId, locale: BotLocale): Promise<void> {
    const sql = this.#sql;
    const valid = LocaleSchema.parse(locale);
    await sql`
      insert into correspondent_state (correspondent_id, locale)
      values (${id}, ${valid})
      on conflict (correspondent_id) do update set locale = excluded.locale
    `;
  }

  async markNoticeSent(id: CorrespondentId, at: Instant): Promise<void> {
    const sql = this.#sql;
    const when = instantOf(epochMsOf(InstantSchema.parse(at)));
    await sql`
      insert into correspondent_state (correspondent_id, notice_sent_at)
      values (${id}, ${when})
      on conflict (correspondent_id) do update
        set notice_sent_at = coalesce(correspondent_state.notice_sent_at, excluded.notice_sent_at)
    `;
  }

  async optOut(id: CorrespondentId, at: Instant): Promise<void> {
    const sql = this.#sql;
    const when = instantOf(epochMsOf(InstantSchema.parse(at)));
    await sql`
      insert into correspondent_state (correspondent_id, opted_out_at)
      values (${id}, ${when})
      on conflict (correspondent_id) do update
        set opted_out_at = coalesce(correspondent_state.opted_out_at, excluded.opted_out_at)
    `;
  }
}

/**
 * The aggregate counter. It writes a day, a reason of the closed list and a
 * number, and there is no third argument it could be handed.
 */
export class PostgresRejectionCounter implements RejectionCounter {
  readonly #sql: Sql;

  constructor(sql: Sql) {
    this.#sql = sql;
  }

  async record(reason: RejectionReason, at: Instant): Promise<void> {
    const sql = this.#sql;
    const day = InstantSchema.parse(at).slice(0, 10);
    await sql`
      insert into bot_rejections (day, reason, count)
      values (${day}, ${reason}, 1)
      on conflict (day, reason) do update set count = bot_rejections.count + 1
    `;
  }
}

/** The canonical names of the RFGF, read from the declared calendar's teams. */
export class PostgresTeamNameStore implements TeamNameStore {
  readonly #sql: Sql;

  constructor(sql: Sql) {
    this.#sql = sql;
  }

  async namesOf(ids: readonly TeamId[]): Promise<ReadonlyMap<TeamId, string>> {
    if (ids.length === 0) return new Map();
    const sql = this.#sql;
    const rows = await sql<{ id: string; canonical_name: string }[]>`
      select id, canonical_name from teams where id in ${sql([...ids])}
    `;
    return new Map(
      rows.map((row) => [TeamIdSchema.parse(row.id), z.string().min(1).parse(row.canonical_name)]),
    );
  }
}
