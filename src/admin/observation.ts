/**
 * The `Observation` of weight 1.0 that is born when the operator submits
 * (RN-01, RN-12, RN-13, ADR-021 §8.4, ADR-024 §5, SPEC-017 CA-2 and CA-4).
 *
 * `source` IS EXACTLY `'operador'`, with no suffix and no variant, and the
 * value is IMPORTED from `src/decide/roles.ts` rather than spelled here.
 * `roleOf` fails closed against a `SourceId` that is not in `SOURCE_ROLES`
 * (ADR-021 §8.4), so an `operador:01` would blow the engine up and force
 * touching files of a spec that is `hecho`. THE PERSON STAYS OUT OF EVERY JOIN
 * THE ENGINE MAKES (ADR-024 §2, §6).
 *
 * `confidence` IS READ FROM `RN01_WEIGHTS.operator`, never written inline: the
 * numbers of RN-01 have one home and this is not it (`src/ingest/sources.ts`).
 * A `1` typed here would be the same number by coincidence, which is exactly
 * how two copies of a rule start.
 *
 * THE `id` IS DERIVED FROM WHAT THE PERSON DECLARED, AND THAT IS WHAT MAKES
 * CA-7.5 TRUE. The ticket is not single-use (ADR-024 §4), so an identical
 * resend inside the TTL has to be harmless — and it is, because the id is a
 * digest of the ticket-bound action: the operator, the operation, the target,
 * the ticket's `issued_at`, the proposed state and scoreboard, and the motive.
 *
 * `submitted_at` AND THE `raw_ref` ARE DELIBERATELY OUTSIDE THAT DIGEST, and
 * it has to be said because it is the one place this differs from the bot. The
 * bot derives its id from two archive references that DO NOT MOVE between two
 * presses of the same button (the pending proposal is stored). Here the server
 * stamps `submitted_at` itself, so two identical resends produce different
 * bytes and therefore different archive keys; deriving from the key would make
 * the resend a second row and CA-7.5 false. What the id derives from is the
 * whole of what the person declared — which is the archived object minus the
 * server's own timestamp — so the same action is the same `Observation`, and a
 * DIFFERENT action (another ticket, another instant, another value) is another
 * one. Both archived objects survive; a dangling raw object is legitimate
 * declared state (ADR-020 §4).
 *
 * ALL FIVE BRANCHES CAN BE PRODUCED FROM HERE, `postponed` and `suspended`
 * included. RN-06 concedes those two to the official source OR TO A HUMAN, the
 * official one is not capturable (ADR-008 §1), and the correspondent's 0.8
 * publishes *provisional*: THIS IS THE ONLY ROUTE TO A CONFIRMED SCOREBOARD OR
 * A POSTPONED MATCH THAT THE SYSTEM HAS.
 */
import { createHash } from 'node:crypto';
import { OPERATOR } from '@/decide/roles';
import { RN01_WEIGHTS } from '@/ingest/sources';
import { ObservationIdSchema } from '@/model/ids';
import { ObservationSchema } from '@/model/observation';
import { STATUSES_WITH_SCORE } from '@/model/match';
import type { AdminAction } from './archive';
import type { OperatorId } from './session';
import type { Instant, MatchId, ObservationId } from '@/model/ids';
import type { MatchStatus } from '@/model/match';
import type { Observation } from '@/model/observation';
import type { RawRef } from '@/raw/key';

/** What the operator proposed for one match. The five branches, as they are. */
export interface OperatorProposal {
  readonly status: MatchStatus;
  readonly home_score: number | null;
  readonly away_score: number | null;
}

/** True for the three states that carry a scoreboard (SPEC-001 CA-18). */
export function hasScoreboard(status: MatchStatus): boolean {
  return (STATUSES_WITH_SCORE as readonly string[]).includes(status);
}

export interface OperatorObservationInput {
  readonly operator_id: OperatorId;
  readonly action: AdminAction;
  readonly match_id: MatchId;
  readonly proposal: OperatorProposal;
  readonly reason: string;
  /** The ticket's `issued_at`. Part of the identity of the action. */
  readonly issued_at: Instant;
  readonly observed_at: Instant;
  /** RN-10: there is no path that builds an `Observation` without one. */
  readonly raw_ref: RawRef;
}

/**
 * The identifier of one operator action, DERIVED AND NEVER DRAWN. The same
 * declaration produces the same id, down to the byte; there is no randomness
 * here and no clock beyond the ticket's own instant.
 */
export function operatorObservationId(
  input: Omit<OperatorObservationInput, 'observed_at' | 'raw_ref'>,
): ObservationId {
  const declared = JSON.stringify([
    input.operator_id,
    input.action,
    input.match_id,
    input.issued_at,
    input.proposal.status,
    input.proposal.home_score,
    input.proposal.away_score,
    input.reason,
  ]);
  return ObservationIdSchema.parse(
    createHash('sha256').update(declared, 'utf8').digest('hex').slice(0, 32),
  );
}

/** Builds the `Observation` of one operator action. */
export function operatorObservation(input: OperatorObservationInput): Observation {
  const base = {
    id: operatorObservationId(input),
    match_id: input.match_id,
    source: OPERATOR,
    observed_at: input.observed_at,
    confidence: RN01_WEIGHTS.operator,
    raw_ref: input.raw_ref,
  };

  // `parse` and not a cast: the schema is the contract, and it ends in
  // `.readonly()`, so what comes out is frozen (RN-13).
  return ObservationSchema.parse(
    hasScoreboard(input.proposal.status)
      ? {
          ...base,
          status: input.proposal.status,
          home_score: input.proposal.home_score,
          away_score: input.proposal.away_score,
        }
      : { ...base, status: input.proposal.status, home_score: null, away_score: null },
  );
}
