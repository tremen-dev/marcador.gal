/**
 * The zod schema of the model's proposal, and the five shapes of refusal
 * (RN-09, D-4, ADR-022 §6, SPEC-015 CA-5.6, CA-6.3).
 *
 * IT IS OURS AND NO PROVIDER CONTRIBUTES IT. It is one of the four things
 * ADR-022 §6 keeps on this side of the port precisely because it does not move
 * when the provider changes.
 *
 * AND WITH AN INTERCHANGEABLE PROVIDER IT STOPS BEING A PRECAUTION AND BECOMES
 * THE PRINCIPAL GUARDIAN: the weaker the model, the harder this validation
 * works. A model that returns broken JSON, that hallucinates a match that was
 * not among the candidates, or that fills a scoreboard in a branch that has
 * none HAS TO FALL HERE, NOT IN THE CONFIRMATION CARD. That is why the five
 * refusals are enumerated instead of trusting the answer to come back well.
 *
 * THE IDENTITY OF THE MATCH IS NOT SEARCHED FOR: IT IS OFFERED (ADR-022 §5).
 * The `match_id` has to be ONE OF THE CANDIDATES HANDED OVER IN THIS
 * CONVERSATION — a real `match_id` of another match of the calendar is refused
 * just the same, and a case proves it (CA-6.3). The catalogue of aliases of
 * ADR-018 is deliberately not used here, and `src/bot/` does not import
 * `src/alias/`: its all-or-nothing resolves the stable spellings of a SOURCE,
 * not those of somebody writing one-handed from a touchline, and loading a
 * catalogue sweeps the `proposed` rows of its `(source, season)`
 * (F-SPEC-011-4).
 */
import { z } from 'zod';
import { MATCH_STATUSES } from '@/model/match';
import { MatchIdSchema } from '@/model/ids';
import type { MatchCandidate } from './prompt';
import type { MatchId } from '@/model/ids';
import type { MatchStatus } from '@/model/match';

/** The states whose branch carries a scoreboard (`src/model/match.ts`). */
const SCORED: readonly MatchStatus[] = ['live', 'finished', 'suspended'];

const scoreShape = {
  home_score: z.int().min(0),
  away_score: z.int().min(0),
};

const unscoredShape = {
  home_score: z.null(),
  away_score: z.null(),
};

const base = {
  /**
   * `null` IS A LEGITIMATE ANSWER, and it is what keeps the model from
   * guessing: «cero candidatos o más de uno no se adivinan, vuelven a la
   * persona» (ADR-022 §5). A proposal with no identity reaches the person as a
   * keyboard of canonical names, and until she presses one there is no
   * `Observation` (CA-6.4, CA-7.1).
   */
  match_id: MatchIdSchema.nullable(),
  minute: z.int().min(0).nullable(),
};

/**
 * The shape the model has to answer with. A discriminated union, like
 * `ObservationSchema`: the branch decides whether a scoreboard exists, so «a
 * scoreboard in a branch that has none» is refused by the type and not by an
 * `if`.
 */
export const ProposalSchema = z.discriminatedUnion('status', [
  z.object({ ...base, status: z.literal('live'), ...scoreShape }),
  z.object({ ...base, status: z.literal('finished'), ...scoreShape }),
  z.object({ ...base, status: z.literal('suspended'), ...scoreShape }),
  z.object({ ...base, status: z.literal('scheduled'), ...unscoredShape }),
  z.object({ ...base, status: z.literal('postponed'), ...unscoredShape }),
]);

export type Proposal = z.infer<typeof ProposalSchema>;

/**
 * The five refusals of CA-5.6, plus the model's own «I could not identify one»,
 * which is not a defect of the answer but an answer.
 */
export type ProposalRejection =
  /** 1. The bytes are not JSON, or not the object the schema describes. */
  | 'unparseable'
  /** 2. A `match_id` that was not among the candidates handed over. */
  | 'unknown_match'
  /** 3. A negative scoreboard. */
  | 'negative_score'
  /** 4. A status outside `MATCH_STATUSES`. */
  | 'unknown_status'
  /** 5. A scoreboard present in a branch that has none, or absent in one that does. */
  | 'scoreboard_mismatch'
  /**
   * The model says it does not recognise any of the candidates. It is NOT a
   * refusal of the answer — it is an answer — and it is kept in the union so
   * the five refusals of CA-5.6 read as the five they are.
   */
  | 'not_identified';

export type ProposalOutcome =
  | { readonly ok: true; readonly proposal: Proposal }
  | { readonly ok: false; readonly reason: ProposalRejection };

const reject = (reason: ProposalRejection): ProposalOutcome => ({ ok: false, reason });

function decode(body: Uint8Array): unknown {
  try {
    return JSON.parse(new TextDecoder().decode(body));
  } catch {
    return undefined;
  }
}

/**
 * Reads a raw answer and gives back a validated proposal or a NAMED refusal.
 *
 * The refusals are classified BEFORE the union is parsed, so each one has its
 * own name instead of the single `unparseable` a discriminated union would
 * collapse them into. `ProposalSchema.parse` is still the last word: nothing
 * comes out of here that the schema has not accepted.
 */
export function validateProposal(
  body: Uint8Array,
  candidates: readonly MatchCandidate[],
): ProposalOutcome {
  const decoded = decode(body);
  if (decoded === null || typeof decoded !== 'object') return reject('unparseable');

  const raw = decoded as Record<string, unknown>;

  if (typeof raw['status'] !== 'string' || !MATCH_STATUSES.includes(raw['status'] as MatchStatus)) {
    return reject('unknown_status');
  }
  const status = raw['status'] as MatchStatus;

  const scored = SCORED.includes(status);
  const home = raw['home_score'];
  const away = raw['away_score'];
  if (scored !== (typeof home === 'number' && typeof away === 'number')) {
    return reject('scoreboard_mismatch');
  }
  if (typeof home === 'number' && typeof away === 'number' && (home < 0 || away < 0)) {
    return reject('negative_score');
  }

  const parsed = ProposalSchema.safeParse(raw);
  if (!parsed.success) return reject('unparseable');

  const identified = parsed.data.match_id;
  if (
    identified !== null &&
    !candidates.some((candidate) => candidate.match_id === identified)
  ) {
    return reject('unknown_match');
  }

  return { ok: true, proposal: parsed.data };
}

/** The candidate a validated proposal points at. Never a lookup by name. */
export function candidateOf(
  candidates: readonly MatchCandidate[],
  matchId: MatchId | null,
): MatchCandidate | null {
  if (matchId === null) return null;
  return candidates.find((candidate) => candidate.match_id === matchId) ?? null;
}

/** A proposal whose identity a person has already settled. */
export type IdentifiedProposal = Proposal & { readonly match_id: MatchId };

export function isIdentified(proposal: Proposal): proposal is IdentifiedProposal {
  return proposal.match_id !== null;
}
