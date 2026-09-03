/**
 * THE READ-ONLY DOOR: read the decision log of one match WITHOUT handing over
 * the capability RN-08 denies (SPEC-017 CA-12, ADR-024 §5, F-SPEC-013-11).
 *
 * WHY THIS FILE EXISTS AT ALL, said plainly because it is a deviation from the
 * letter of SPEC-017 §1 and the implementer wrote it knowing that.
 *
 * The panel has to SHOW the live `Decision` and its log (CA-12.1, CA-12.2) —
 * «con el contexto de todas las fuentes y del histórico delante» is the letter
 * of RN-01 and the reason the operator's 1.0 is not exercised blind. And the
 * frontier of SPEC-013 CA-13 makes that impossible from outside `src/decide/`
 * by two independent mechanisms, both of which must keep passing untouched:
 *
 *   1. `PostgresDecisionStore`, `DecisionStore` and `DecisionVersionConflictError`
 *      are red in ANY file that is not a declared decision writer;
 *   2. naming the table `decisions` in a SQL template is red in ANY such file.
 *
 * So a reader of decisions cannot live in `src/admin/` and cannot live in
 * `src/db/admin.ts` either. It lives HERE, inside the one module RN-08 gives
 * the capability to, and it hands back PLAIN VALUES: `Decision` objects, which
 * are the canonical model the frontend already receives, and NO STORE — not a
 * `DecisionStore`, not an `EnginePorts`, not a `CyclePorts`.
 *
 * It is the same shape and the same precedent as `./engine-entry.ts`, which
 * SPEC-015 added for the writing half: a NEW FILE in `src/decide/`, no
 * existing file of SPEC-013 edited, `DECISION_WRITERS` unchanged at two
 * entries, and the caller imports it BY NAME — an `import * as` over
 * `src/decide/` would be an offence, and rightly so.
 *
 * AND IT DOES NOT REACH `src/polite/http.ts`. It composes the durable
 * repository directly instead of borrowing `composeCyclePorts`, which drags
 * the platform fetcher in: the panel's routes are entry points of SPEC-009 and
 * SPEC-008 CA-2.8 asserts that an entry point that is not driven cannot reach
 * the exit door (SPEC-017 CA-13.2).
 */
import { PostgresDecisionStore } from '@/db/decisions';
import type { Sql } from '@/db/client';
import type { Decision } from '@/model/decision';
import type { MatchId } from '@/model/ids';

/**
 * What one match's decision log looks like from outside. VALUES AND NOTHING
 * ELSE: no port, no store, no connection.
 */
export interface MatchDecisionLog {
  readonly match_id: MatchId;
  /** The live `Decision`: the highest `version`. `null` when there is none. */
  readonly live: Decision | null;
  /** The whole log, oldest version first (RN-13: nothing is ever rewritten). */
  readonly log: readonly Decision[];
}

export interface ReadDecisionsInput {
  readonly sql: Sql;
  readonly matchId: MatchId;
}

/** Reads the decision log of one match. The ONLY read door out of `src/decide/`. */
export async function readMatchDecisions(
  input: ReadDecisionsInput,
): Promise<MatchDecisionLog> {
  const decisions = new PostgresDecisionStore(input.sql);
  const log = await decisions.listByMatch(input.matchId);

  return {
    match_id: input.matchId,
    live: log.length === 0 ? null : (log[log.length - 1] ?? null),
    log,
  };
}
