/**
 * The ports of the bot (SPEC-015 §1; ADR-022 §4, §8; ADR-023 §4).
 *
 * New interfaces in a new file, like the ports of SPEC-010, SPEC-011 and
 * SPEC-013: a new capability fits in a new interface, and `src/db/ports.ts` is
 * the contract of a spec that is done. The Postgres implementations live in
 * `src/db/bot.ts`, which is where every implementation of a port of this
 * repository lives.
 *
 * THE PENDING PROPOSAL IS NOT THE CANONICAL MODEL and RN-13 does not reach it:
 * it records an act in progress, as `ingest_attempts` records an act of the
 * tick. It is the ONLY row that names the `correspondent_id` besides
 * `correspondent_state`, and IT IS DELETED WHEN IT RESOLVES — confirmed,
 * discarded or expired — so it is not a second durable home (ADR-022 §4,
 * CA-10.2).
 *
 * AND IT HOLDS NO TELEGRAM IDENTIFIER, on purpose. It does not need one: the
 * callback itself brings everything needed to answer it and edit the card.
 * Keeping the `chat_id` «for convenience» was considered and rejected — it
 * would be a Telegram identifier stored in exchange for nothing.
 */
import type { CorrespondentId } from './correspondents';
import type { Proposal } from './proposal';
import type { BotLocale } from '@/i18n/bot';
import type { Instant, MatchId, TeamId } from '@/model/ids';
import type { RawRef } from '@/raw/key';

/** A proposal waiting for a person. Transitory, durable while it waits. */
export interface PendingProposal {
  readonly id: string;
  readonly correspondent_id: CorrespondentId;
  /** `null` while the identity is still the person's to settle (CA-6.4). */
  readonly match_id: MatchId | null;
  readonly proposal: Proposal;
  /** The archived message this came from: it becomes the `raw_ref` (CA-4.2). */
  readonly message_raw_ref: RawRef;
  /** The archived answer of the model. Dangling on purpose (CA-4.3). */
  readonly proposal_raw_ref: RawRef;
  readonly created_at: Instant;
  readonly expires_at: Instant;
}

export interface ProposalStore {
  /** Records a pending proposal. */
  put(proposal: PendingProposal): Promise<PendingProposal>;
  /** The pending proposal, or `null` if it never existed or was resolved. */
  getById(id: string): Promise<PendingProposal | null>;
  /** Deletes it. `true` when there was a row. Resolving is deleting. */
  remove(id: string): Promise<boolean>;
  /** Deletes everything that expired at or before `at`. Returns how many. */
  removeExpired(at: Instant): Promise<number>;
  /** The newest pending proposal of one correspondent, or `null`. For `/cancelar`. */
  latestOf(correspondentId: CorrespondentId): Promise<PendingProposal | null>;
  /** Settles the identity a person chose on the ambiguity keyboard (CA-6.4). */
  pick(id: string, matchId: MatchId): Promise<PendingProposal | null>;
}

/** What the bot remembers about a person between conversations. */
export interface CorrespondentState {
  readonly correspondent_id: CorrespondentId;
  /** The EXPLICIT preference. `null` means galego, which is the default (D-2). */
  readonly locale: BotLocale | null;
  /** When the art. 13 notice was sent. `null` means it never was (CA-14.2). */
  readonly notice_sent_at: Instant | null;
  /** When they exercised the baja. `null` means they have not (CA-14.5). */
  readonly opted_out_at: Instant | null;
}

export interface CorrespondentStateStore {
  get(id: CorrespondentId): Promise<CorrespondentState | null>;
  setLocale(id: CorrespondentId, locale: BotLocale): Promise<void>;
  markNoticeSent(id: CorrespondentId, at: Instant): Promise<void>;
  /** The baja: from here on this person is treated as unauthorised (CA-2.2). */
  optOut(id: CorrespondentId, at: Instant): Promise<void>;
}

/** Why an update was refused. A CLOSED list, and no person fits in it. */
export const REJECTION_REASONS = ['unauthorised', 'out_of_matchday', 'notice_pending'] as const;

export type RejectionReason = (typeof REJECTION_REASONS)[number];

/**
 * The aggregate counter of CA-2.1. An update that Telegram already pushed at us
 * has been received whether we like it or not; what the spec can guarantee is
 * that IT LEAVES NO TRACE. So it is counted, and the count has no column
 * capable of holding a person — a case asserts that by reading the schema of
 * the table, not the code.
 */
export interface RejectionCounter {
  record(reason: RejectionReason, at: Instant): Promise<void>;
}

/** The canonical names of the RFGF, for the card. Read-only, from the calendar. */
export interface TeamNameStore {
  namesOf(ids: readonly TeamId[]): Promise<ReadonlyMap<TeamId, string>>;
}
