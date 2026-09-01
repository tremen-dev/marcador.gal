/**
 * CA-7.7 and CA-8.7 (type level) — the Postgres repositories have no `update`
 * and no `delete`, like the ports of SPEC-001 CA-6 (RN-13).
 *
 * Inverted tests: if either class ever grew one of those methods, the
 * directive would become unused and `tsc` would fail with
 * "Unused '@ts-expect-error' directive".
 */
import { describe, expect, test } from 'vitest';
import type { PostgresDecisionStore } from '@/db/decisions';
import type { PostgresObservationStore } from '@/db/observations';
import type { DecisionStore, ObservationStore } from '@/db/ports';
import type { Decision, MatchId, Observation, ObservationId } from '@/model';

declare const observations: PostgresObservationStore;
declare const decisions: PostgresDecisionStore;
declare const obs: Observation;
declare const decision: Decision;
declare const observationId: ObservationId;
declare const matchId: MatchId;

// @ts-expect-error `PostgresObservationStore` has no update: nothing to amend (RN-13).
observations.update(obs);

// @ts-expect-error `PostgresObservationStore` has no delete: it never existed (RN-13).
observations.delete(observationId);

// @ts-expect-error `PostgresDecisionStore` has no update.
decisions.update(decision);

// @ts-expect-error `PostgresDecisionStore` has no delete.
decisions.delete(matchId);

/** And each class is assignable to the port of SPEC-001, as it is. */
const observationPort: ObservationStore = observations;
const decisionPort: DecisionStore = decisions;

/** The PUBLIC surface of each class is exactly the port's. */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

const observationSurface: Equals<keyof PostgresObservationStore, keyof ObservationStore> = true;
const decisionSurface: Equals<keyof PostgresDecisionStore, keyof DecisionStore> = true;

describe('CA-7.7 / CA-8.7 — no update, no delete', () => {
  test('the repositories expose exactly the ports', () => {
    expect(observationSurface && decisionSurface).toBe(true);
    void observationPort;
    void decisionPort;
  });
});
