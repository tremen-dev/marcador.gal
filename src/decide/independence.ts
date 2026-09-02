/**
 * The second way of RN-02: independence is a DECLARED relation, and its list
 * is born EMPTY (SPEC-013 CA-3, ADR-021 §7).
 *
 * `dominio.md` fixes that independence is MEASURED — it is SPEC-002's verdict
 * and its instrument — and that what is unknown is treated as a mirror
 * (SPEC-002 CA-12). Deducing it at publication time would put what we publish
 * behind an unsupervised analysis; so the engine reads a closed list of pairs
 * with their motive written beside them, the shape of `MEASUREMENT_WINDOWS`
 * (ADR-019 §3) and of `ALLOWED_PACKAGES` (ADR-016 §3.2).
 *
 * IT IS SYMMETRIC AND FALSE BY DEFAULT. Two sources are not independent until
 * a verdict says so, and no pair says so today: with `futgal.es` not
 * capturable there is one automatic source (ADR-008 §1), and the two
 * aggregators that could be crossed may be mirrors OF EACH OTHER — which is
 * the case that would leave RN-02 without a second way without anybody seeing
 * it (`dominio.md`, besoccer).
 *
 * So the way is written, tested whole with doubles, and INERT in production.
 * The day `futgal.es` comes back, or SPEC-002 rules, the engine is not
 * rewritten: an entry is added with its motive.
 */
import type { SourceId } from '@/model/ids';

/** One declared pair. The motive is not optional: an entry without one lies. */
export interface IndependentPair {
  readonly a: SourceId;
  readonly b: SourceId;
  /** Which verdict declared them independent, and when. */
  readonly motive: string;
}

/**
 * THE LIST OF PRODUCTION, AND IT IS EMPTY.
 *
 * That is not an omission: it is «el motor nace con una sola vía en RN-02»
 * (ADR-008 §1, `_epica.md` of EPIC-002) written in the shape of the code.
 * Nothing reaches *confirmado* by this way today, and a criterion says so.
 */
export const INDEPENDENT_PAIRS: readonly IndependentPair[] = [];

/** The relation as the reducer consults it: symmetric, closed, default false. */
export interface IndependenceRelation {
  areIndependent(a: SourceId, b: SourceId): boolean;
}

/** Builds the relation out of a declared list. Injected whole by the tests. */
export function declareIndependence(
  pairs: readonly IndependentPair[],
): IndependenceRelation {
  return {
    areIndependent(a: SourceId, b: SourceId): boolean {
      // A source is not independent of itself: one source is one source, and
      // the second way of RN-02 asks for TWO.
      if (a === b) return false;
      return pairs.some(
        (pair) => (pair.a === a && pair.b === b) || (pair.a === b && pair.b === a),
      );
    },
  };
}

/** The production relation. Nothing satisfies it (ADR-008 §1). */
export const PRODUCTION_INDEPENDENCE: IndependenceRelation =
  declareIndependence(INDEPENDENT_PAIRS);

/** Convenience for the criteria that ask the production relation directly. */
export function areIndependent(
  a: SourceId,
  b: SourceId,
  relation: IndependenceRelation = PRODUCTION_INDEPENDENCE,
): boolean {
  return relation.areIndependent(a, b);
}
