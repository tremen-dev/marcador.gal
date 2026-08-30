/**
 * CA-6 (RN-13, type level) — an Observation cannot be modified, and the ports
 * offer no way to try. Inverted tests: see the header of `rn12.test-d.ts`.
 */
import { describe, expect, test } from 'vitest';
import type { DecisionStore, ObservationStore } from '@/db/ports';
import type { Decision, MatchId, Observation, ObservationId } from '@/model';

declare const obs: Observation;
declare const decision: Decision;
declare const observations: ObservationStore;
declare const decisions: DecisionStore;
declare const observationId: ObservationId;
declare const matchId: MatchId;

// @ts-expect-error RN-13: an Observation is a historical fact, not a draft.
obs.home_score = 3;

// @ts-expect-error RN-13: a correction is a new Observation, not an amendment.
obs.status = 'finished';

// @ts-expect-error RN-13: a Decision log is append-only.
decision.home_score = 3;

// @ts-expect-error `ObservationStore` has no update: nothing to amend.
observations.update(obs);

// @ts-expect-error `ObservationStore` has no delete: it never existed.
observations.delete(observationId);

// @ts-expect-error `DecisionStore` has no update.
decisions.update(decision);

// @ts-expect-error `DecisionStore` has no delete.
decisions.delete(matchId);

/** Invariant type equality: no assignability slack in either direction. */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/** The port surface is EXACTLY these three names — no more, no fewer. */
const observationStoreSurface: Equals<
  keyof ObservationStore,
  'append' | 'getById' | 'listByMatch'
> = true;

const decisionStoreSurface: Equals<
  keyof DecisionStore,
  'append' | 'getLatestByMatch' | 'listByMatch'
> = true;

describe('CA-6 — RN-13 at the type level', () => {
  test('the port surfaces are exactly the ones RN-13 allows', () => {
    expect(observationStoreSurface && decisionStoreSurface).toBe(true);
  });
});
