/**
 * The `Observation` that is born when a person presses the button (RN-01,
 * RN-12, RN-13, ADR-021 §8.4, SPEC-015 CA-8).
 *
 * `source` IS EXACTLY `'corresponsal'`, with no suffix and no variant, and the
 * value is IMPORTED from `src/decide/roles.ts` rather than spelled here.
 * `roleOf` fails closed against a `SourceId` that is not in `SOURCE_ROLES`
 * (ADR-021 §8.4), so a `corresponsal:01` would blow the engine up and force
 * touching files of a spec that is `hecho`. THE PERSON STAYS OUT OF EVERY JOIN
 * THE ENGINE MAKES, which is at once the cheap technical decision and the
 * strong privacy one (ADR-022 §2, ADR-023 §4).
 *
 * `confidence` IS READ FROM `RN01_WEIGHTS.correspondent`, never written inline:
 * the numbers of RN-01 have one home and this is not it (`src/ingest/sources.ts`).
 *
 * THE `id` IS DERIVED with the same shape `src/ingest/` already uses —
 * `observationId(rawRef, sourceRef)` — with the PROPOSAL as `sourceRef`. So
 * confirming the same object twice is idempotent and `append` gives back the
 * stored row instead of duplicating (CA-8.4), which is what keeps RN-13 an
 * invariant with an edge instead of a promise.
 *
 * ALL FIVE BRANCHES CAN BE PRODUCED FROM HERE, `postponed` and `suspended`
 * included. RN-06 concedes those two to the official source OR TO A HUMAN, and
 * RN-01's clarification says «Humano en RN-04 y RN-06 son los dos»: a
 * correspondent alone, at 0.8, can lower a scoreboard and postpone a match.
 * What separates them from the operator is the weight, not the permission —
 * and with the official source not capturable today (ADR-008 §1), ONLY A
 * PERSON CAN POSTPONE.
 */
import { CORRESPONDENT } from '@/decide/roles';
import { RN01_WEIGHTS } from '@/ingest/sources';
import { observationId } from '@/ingest/observations';
import { ObservationSchema } from '@/model/observation';
import type { Instant } from '@/model/ids';
import type { Observation } from '@/model/observation';
import type { PendingProposal } from './ports';
import type { MatchId } from '@/model/ids';

/**
 * Builds the `Observation` of a confirmed proposal.
 *
 * There is no path that builds one without a `raw_ref`: `ObservationSchema`
 * forbids it (RN-10), and the reference is the one of the MESSAGE, which is the
 * reprocessable substrate — not the model's answer and not the confirmation
 * (CA-4.2).
 */
export type ConfirmedProposal = PendingProposal & { readonly match_id: MatchId };

export function correspondentObservation(
  pending: ConfirmedProposal,
  observedAt: Instant,
): Observation {
  const base = {
    id: observationId(pending.message_raw_ref, pending.id),
    match_id: pending.match_id,
    source: CORRESPONDENT,
    observed_at: observedAt,
    confidence: RN01_WEIGHTS.correspondent,
    raw_ref: pending.message_raw_ref,
  };

  // `parse` and not a cast: the schema is the contract, and it ends in
  // `.readonly()`, so what comes out is frozen (RN-13).
  return ObservationSchema.parse({
    ...base,
    status: pending.proposal.status,
    home_score: pending.proposal.home_score,
    away_score: pending.proposal.away_score,
  });
}
