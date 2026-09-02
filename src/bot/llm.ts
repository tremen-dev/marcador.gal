/**
 * THE PORT OF THE MODEL. No SDK, no client, no provider named (ADR-022 §6,
 * SPEC-015 CA-5.9, CA-5.10).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT IS NOT HERE, AND WHY IT IS NOT HERE YET.
 *
 * CA-5 carries a precondition no other criterion has: it is not implemented
 * until there is a chosen provider and its DPA is stored and dated in
 * `docs/legal/` (ADR-023 §6.4). One does not write a client against a provider
 * with no data-processing contract, even if the code were identical. So
 * `src/bot/models/<provider>.ts` DOES NOT EXIST, and everything on this side of
 * the port does: the signature, the prompt builder, the zod schema of the
 * proposal with its five shapes of refusal, and the archiving of the raw answer
 * before validating it. The rest of the bot composes against THIS, so the day
 * an adapter arrives it is a new file and not a rewrite (CA-5.9).
 *
 * AND THE TRAP THAT HAS TO BE SEEN (ADR-023 §3 ter, F-SPEC-015-11): the port
 * makes changing provider cheap IN CODE AND ONLY IN CODE. The legal analysis
 * does not travel with the adapter — contract of processor, basis of the
 * international transfer, retention of the sub-processor, and whether it trains
 * on the content — and every candidate reopens all four from zero.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THE PORT HANDS BACK BYTES AND NOT A PARSED PROPOSAL.
 *
 * RN-10 orders the raw answer archived BEFORE it is parsed, and CA-4.1 asserts
 * that order with doubles that record instants. If the port gave back an
 * already-validated proposal, the parsing would have happened inside the
 * adapter, before any archive, and the order would be unassertable. So the port
 * returns the provider's answer AS BYTES, the domain archives it, and only then
 * does zod look at it. ADR-022 §6 lists that archive as one of the four things
 * that stay on this side and do not move when the provider changes.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NOTHING PROPRIETARY CROSSES (CA-5.10). No content blocks, no reasoning or
 * effort parameter names, no headers, no provider error codes, and NO MODEL
 * IDENTIFIER — which lives inside its adapter and nowhere else. A type of the
 * domain that spells any of those is the adapter leaking, and then changing
 * provider stops being writing an adapter.
 */
import type { PromptInput } from './prompt';

/**
 * WHAT THE PORT RECEIVES IS THE RENDERED PROMPT, and that is a decision with a
 * reason (see the ledger of SPEC-015).
 *
 * ADR-022 §6 keeps FOUR things on this side of the port, and two of them decide
 * this signature: the prompt builder, and the archiving of the raw answer
 * before validating it. CA-4.1 asserts the ORDER of that archiving with doubles
 * that record instants — «el `put` del mensaje termina antes de que
 * `buildPrompt` sea llamado» — and an order can only be asserted over calls the
 * domain makes. So the domain renders the prompt (`./prompt.ts`, whose input
 * type cannot carry identity, CA-5.1) and hands the adapter a string; the
 * adapter's whole job is one `POST` with a JSON body.
 */
export type ModelRequest = string;

/** Kept exported so the leak test of CA-5.2 names the type it judges. */
export type { PromptInput };

/** Why a call did not produce bytes. OUR vocabulary, never a provider's code. */
export type ModelFailureReason = 'unconfigured' | 'unavailable';

export type ModelAnswer =
  | { readonly ok: true; readonly body: Uint8Array }
  | { readonly ok: false; readonly reason: ModelFailureReason };

/**
 * The port. One operation, in the vocabulary of the problem: in goes the text
 * and the candidates, out comes the provider's answer as bytes or a refusal
 * this side can name.
 */
export interface ModelPort {
  propose(prompt: ModelRequest): Promise<ModelAnswer>;
}

/**
 * The port with no adapter behind it, which is the state of the deployment
 * until the precondition of ADR-023 §6.4 is met.
 *
 * It fails CLOSED and NAMED: the bot answers `errServiceDown` from the bundle
 * and writes nothing. It is the same shape as the empty list of measurement
 * windows — the natural state of a deployment that has not been turned on, not
 * an error mode.
 */
export function unconfiguredModel(): ModelPort {
  return {
    propose: () => Promise.resolve({ ok: false, reason: 'unconfigured' }),
  };
}
