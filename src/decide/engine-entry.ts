/**
 * THE NARROW DOOR: run the engine over one match WITHOUT handing over the
 * capability RN-08 denies (ADR-022 §9, SPEC-015 CA-9, F-SPEC-013-11).
 *
 * `applyEngine` needs an `EnginePorts` that carries a `DecisionStore` inside,
 * and `composeCyclePorts` gives back as much: importing either would put the
 * caller in possession of the capability to write a `Decision`. That is
 * LITERALLY the residue F-SPEC-013-11, whose written trigger is «el día que un
 * módulo fuera de `src/decide/` importe cualquier cosa de `src/decide/` que
 * devuelva un almacén de decisiones» — and that day is today, because the bot
 * has to call the engine.
 *
 * So this is a NEW FILE with an entry whose RETURN TYPE CONTAINS NO STORE: not
 * a `DecisionStore`, not an `AlertStore`, not `EnginePorts`, not `CyclePorts`.
 * The caller imports it BY NAME — an `import * as` over `src/decide/` would be
 * an offence, and rightly so. `src/decide/` is already inside
 * `DECISION_WRITERS`, so this file WIDENS NOTHING and forces no edit to any
 * file of SPEC-013.
 *
 * WHAT THIS CLOSES AND WHAT IT DOES NOT (CA-9.6, ADR-016 §6). It closes the
 * trigger of F-SPEC-013-11 FOR THIS CALLER. IT DOES NOT CLOSE THE RESIDUE:
 * `composeCyclePorts` is still public surface and the next caller will be able
 * to get from it what this one does not. Destination: EPIC-MEJORA; updated
 * trigger: the next spec that already has to touch `src/decide/cycle.ts` for a
 * reason of its own, which is when unpublishing it stops being touching a
 * closed spec with no cause.
 *
 * AND THE ENGINE RUNS ON THE SPOT, not on the next tick. ADR-021 §3 declares
 * TWO triggers — an `Observation` arrives; nothing arrives and the clock moved
 * — and this is the first in its most literal form. §4 of the same ADR fixes
 * when it runs INSIDE the tick, which is what the tick needed to know, not an
 * exclusivity. Waiting for the next minute would add up to 60 s to the fastest
 * human source of the system, right on top of the first figure the epic
 * measures.
 *
 * THIS FILE DOES NOT REACH `src/polite/http.ts`. It composes the durable
 * repositories directly instead of borrowing `composeCyclePorts`, which drags
 * the platform fetcher in: the webhook route is an entry point of CA-2.5 and
 * SPEC-008 CA-2.8 asserts that an entry point that is not driven cannot reach
 * the exit door.
 */
import { PostgresAlertStore } from '@/db/alerts';
import { PostgresDecisionStore } from '@/db/decisions';
import { PostgresMatchStore } from '@/db/matches';
import { PostgresObservationStore } from '@/db/observations';
import { applyEngine } from './apply';
import { PRODUCTION_CONFIG } from './rules';
import type { DecideConfig } from './rules';
import type { Sql } from '@/db/client';
import type { Instant, MatchId } from '@/model/ids';

/**
 * What one pass over one match produced. NUMBERS AND NAMES, NO PORTS: this is
 * the whole of what the narrow door gives back, and CA-9.2 asserts it over the
 * type the compiler publishes.
 */
export interface EngineOutcomeSummary {
  readonly match_id: MatchId;
  /** Whether a `Decision` was appended. The engine wrote it, never the caller. */
  readonly decided: boolean;
  /** Whether that decision came out provisional (RN-03). `null` if none did. */
  readonly provisional: boolean | null;
  /** How many alert rows this pass wrote. */
  readonly alerts: number;
  /** True when the log moved twice and the match was left for the next tick. */
  readonly abandoned: boolean;
  readonly reason: string | null;
}

export interface RunEngineInput {
  readonly sql: Sql;
  readonly matchId: MatchId;
  readonly now: Instant;
  readonly config?: DecideConfig | undefined;
}

/** Runs the engine over one match. The ONLY door out of `src/decide/` for a caller. */
export async function runEngineForMatch(input: RunEngineInput): Promise<EngineOutcomeSummary> {
  const outcome = await applyEngine(
    {
      matches: new PostgresMatchStore(input.sql),
      observations: new PostgresObservationStore(input.sql),
      decisions: new PostgresDecisionStore(input.sql),
      alerts: new PostgresAlertStore(input.sql),
      config: input.config ?? PRODUCTION_CONFIG,
    },
    input.matchId,
    input.now,
  );

  return {
    match_id: outcome.match_id,
    decided: outcome.decision !== null,
    provisional: outcome.decision === null ? null : outcome.decision.provisional,
    alerts: outcome.alerts.length,
    abandoned: outcome.abandoned,
    reason: outcome.reason,
  };
}
