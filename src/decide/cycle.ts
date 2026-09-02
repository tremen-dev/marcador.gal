/**
 * The cycle: ingest first, engine after, IN THE SAME INVOCATION (SPEC-013
 * CA-12, ADR-021 §4, ADR-019 §1).
 *
 * It computes the matches in window with the eligibility function of
 * `src/ingest/windows.ts` (ADR-019 §2 and §3) — reused AS IT IS, edge
 * included, F-SPEC-012-2 and all —, runs the ingest tick of SPEC-012, and then
 * passes the engine over those same matches.
 *
 * WHY IN THE SAME TICK, and the first reason decides: LATENCY. The figure of
 * EPIC-002 asks for < 120 s between the goal and the published datum, and a
 * second cron for the engine would add up to 60 s to a chain that already
 * spends up to 60 s in the ingest tick — half the budget, given away by a
 * plumbing decision. Second: `vercel.json` keeps declaring ONE cron (SPEC-012
 * CA-8 intact) and RN-11 keeps ONE emitter of requests.
 *
 * AND WHY IT LIVES HERE AND NOT IN `src/ingest/`: SPEC-008 CA-12 forbids
 * `src/ingest/` to mention `DecisionStore` or build a `Decision`, and that
 * frontier is the only executable barrier RN-08 has today. THE ENGINE CALLS
 * THE INGEST, NEVER THE OTHER WAY ROUND: the dependency goes in the direction
 * the rule wants.
 *
 * This AMENDS THE LETTER of SPEC-012 CA-7 —«delega entera en la función del
 * tick de `src/ingest/`»— which now delegates in this cycle, which calls the
 * tick. The substance of CA-7 is whole (the route authenticates, fails closed
 * without `CRON_SECRET` and holds no logic) and the amendment is written in
 * SPEC-012's ledger by the way ADR-015 sanctions.
 *
 * A FAILURE ON ONE MATCH DOES NOT STOP THE OTHERS and does not revert the
 * ingest already persisted: the observations are written, and the engine reads
 * from what is written on the next tick (ADR-021 §2).
 */
import { PostgresAlertStore } from '@/db/alerts';
import { PostgresDecisionStore } from '@/db/decisions';
import { createClient, requireDatabaseUrl } from '@/db/client';
import { ACTIVE_SEASON, MEASUREMENT_WINDOWS } from '@/ingest/measurement';
import { composeTickPorts, runIngestTick } from '@/ingest/tick';
import { MATCH_WINDOW, inMeasurementWindow, isInMatchWindow } from '@/ingest/windows';
import { epochMsOf, instantOf } from '@/polite/clock';
import { systemClock } from '@/polite/clock';
import { globalFetcher } from '@/polite/http';
import { BlobRawStore } from '@/raw/blob';
import { applyEngine } from './apply';
import { PRODUCTION_CONFIG } from './rules';
import type { AlertStore } from './ports';
import type { DecideConfig } from './rules';
import type { Sql } from '@/db/client';
import type { DecisionStore } from '@/db/ports';
import type { TickComposition, TickPorts, TickSummary } from '@/ingest/tick';
import type { Match } from '@/model/match';

/** Everything one cycle drives: the tick's ports plus the engine's. */
export interface CyclePorts extends TickPorts {
  readonly decisions: DecisionStore;
  readonly alerts: AlertStore;
  readonly config: DecideConfig;
}

/** The cycle's summary: the tick's, plus what the engine did. */
export interface CycleSummary extends TickSummary {
  /** How many `Decision` this cycle appended. */
  readonly decisions: number;
  /** How many alert rows it wrote. */
  readonly alerts: number;
  /** Matches the engine ran over, and the ones it could not finish. */
  readonly engine: { readonly matches: number; readonly failed: number };
}

export interface CycleComposition extends TickComposition {
  readonly config?: DecideConfig | undefined;
}

/**
 * The production shape of the ports: the DURABLE implementations, built anew
 * per cycle as a cold start does (ADR-004). It adds two repositories to
 * `composeTickPorts` and touches nothing of `src/ingest/`.
 */
export function composeCyclePorts(input: CycleComposition): CyclePorts {
  return {
    ...composeTickPorts(input),
    decisions: new PostgresDecisionStore(input.sql),
    alerts: new PostgresAlertStore(input.sql),
    config: input.config ?? PRODUCTION_CONFIG,
  };
}

/** The matches eligible at `at`, by ADR-019 §2 and §3, reused as they are. */
function eligibleMatches(
  candidates: readonly Match[],
  ports: CyclePorts,
  at: string,
): readonly Match[] {
  return candidates.filter(
    (match) =>
      isInMatchWindow(match.kickoff, at) && inMeasurementWindow(match.kickoff, ports.windows),
  );
}

/** One pass: eligibility → ingest → engine, in that order and one invocation. */
export async function runCycle(ports: CyclePorts): Promise<CycleSummary> {
  const at = ports.clock.now();
  const atMs = epochMsOf(at);

  // The same interval the tick asks for (ADR-019 §2). If the base is
  // unreachable this THROWS and nothing has left yet (SPEC-012 CA-9).
  const candidates = await ports.matches.listKickoffsBetween(
    instantOf(atMs - MATCH_WINDOW.postMs),
    instantOf(atMs + MATCH_WINDOW.preMs),
  );
  const eligible = eligibleMatches(candidates, ports, at);

  // INGEST FIRST: the engine decides over what has just arrived.
  const tick = await runIngestTick(ports);

  let decisions = 0;
  let alerts = 0;
  let failed = 0;

  for (const match of eligible) {
    try {
      const outcome = await applyEngine(
        {
          matches: ports.matches,
          observations: ports.observations,
          decisions: ports.decisions,
          alerts: ports.alerts,
          config: ports.config,
        },
        match.id,
        at,
      );
      if (outcome.decision !== null) decisions += 1;
      alerts += outcome.alerts.length;
      if (outcome.abandoned) failed += 1;
    } catch {
      // One match's failure does not stop the others, and does not revert the
      // ingest already persisted (CA-12.5).
      failed += 1;
    }
  }

  return {
    ...tick,
    decisions,
    alerts,
    engine: { matches: eligible.length, failed },
  };
}

let productionSql: Sql | null = null;

/**
 * The production cycle: the durable implementations (Postgres, Blob), the
 * system clock, the platform fetcher and the DECLARED configuration — season
 * and measurement windows (`src/ingest/measurement.ts`). Composed again on
 * every invocation, which on Vercel is every instance (ADR-004); only the
 * connection pool is kept.
 *
 * This is the function the cron route injects into the handler (CA-12.2). The
 * route keeps authenticating, keeps failing closed without `CRON_SECRET` and
 * keeps holding no logic.
 */
export function productionCycle(): Promise<CycleSummary> {
  productionSql ??= createClient(requireDatabaseUrl());

  return runCycle(
    composeCyclePorts({
      sql: productionSql,
      store: new BlobRawStore(),
      fetcher: globalFetcher,
      clock: systemClock,
      season: ACTIVE_SEASON,
      windows: MEASUREMENT_WINDOWS,
    }),
  );
}
