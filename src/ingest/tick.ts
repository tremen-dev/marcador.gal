/**
 * The ingest tick: composition, not new capture code (SPEC-012 §1, ADR-019).
 *
 * One pass, per eligible pair: eligibility (ADR-019 §2 and §3) → turn
 * (SPEC-008 CA-14) → robots (ADR-019 §4) → capture and archive (RN-10) →
 * read → resolution with the REAL resolver of SPEC-011 (RN-09, season handed
 * in, never deduced) → `ObservationStore.append` (idempotent, SPEC-010). It
 * ENDS THERE: no `Decision` is built or written (RN-08, D-3) — the engine is
 * the next spec — and no figure is computed.
 *
 * It drives the pieces of three done specs WITHOUT touching their files
 * (ADR-011 §6): `SourceAdapter` does the asking and archiving, and its own
 * `tick()` already owns the turn semantics — a suppressed turn produces no
 * request AND no record. What this module adds on top is exactly what
 * ADR-019 adds: the eligibility frontier, the durable robots gate, the read
 * and persist tail, and the durable attempt record (§5).
 *
 * COMPOSED AGAIN ON EVERY TICK. There is no live process (ADR-004): nothing
 * here may keep state in the instance, and everything durable lives behind
 * the ports — Postgres and the raw store. `composeTickPorts` builds the
 * production shape from a `Sql` and a `RawStore`; if the base is down, the
 * eligibility query throws before any request leaves (fails closed,
 * SPEC-008 CA-14.7, CA-9).
 */
import { catalogMatchResolver } from '@/alias/resolver';
import { PostgresAliasStore } from '@/db/aliases';
import { PostgresIngestAttemptLog } from '@/db/ingest-attempts';
import { PostgresMatchStore } from '@/db/matches';
import { PostgresObservationStore } from '@/db/observations';
import { PostgresRateLimit } from '@/db/rate-limit';
import { epochMsOf, instantOf } from '@/polite/clock';
import { DurablePolicyGate } from '@/polite/policy-durable';
import { USER_AGENT } from '@/polite/user-agent';
import { SourceAdapter } from './adapter';
import { eligibleCompetitions, MATCH_WINDOW } from './windows';
import { defaultRegistry, sourceRegistry } from './sources';
import type { TickRecord } from './adapter';
import type { AliasStore } from '@/alias/ports';
import type { MatchStore } from '@/calendar/ports';
import type { Sql } from '@/db/client';
import type { ObservationStore } from '@/db/ports';
import type { Instant } from '@/model/ids';
import type { Clock } from '@/polite/clock';
import type { HttpFetcher } from '@/polite/http';
import type { PolicyGate } from '@/polite/policy';
import type { RateLimit } from '@/polite/rate-limit';
import type { RawStore } from '@/raw/store';
import type { IngestAttemptLog } from './attempts';
import type { IngestTarget, SourceEntry, SourceRegistry } from './sources';
import type { MeasurementWindow } from './windows';

/** Everything one tick drives. Durable state lives BEHIND these ports. */
export interface TickPorts {
  readonly registry: SourceRegistry;
  readonly matches: MatchStore;
  readonly aliases: AliasStore;
  readonly observations: ObservationStore;
  readonly attempts: IngestAttemptLog;
  readonly rateLimit: RateLimit;
  readonly robots: PolicyGate;
  readonly store: RawStore;
  readonly fetcher: HttpFetcher;
  readonly clock: Clock;
  /** Declared configuration (SPEC-011): the resolver's season. Never deduced. */
  readonly season: string;
  /** The declared measurement windows (ADR-019 §3). Empty means: do nothing. */
  readonly windows: readonly MeasurementWindow[];
}

/** The tick's summary: diagnostic, not public API (ADR-019 §1). */
export interface TickSummary {
  readonly at: Instant;
  /** Attempt counters by outcome. Suppressed turns are NOT here on purpose. */
  readonly attempts: { readonly ok: number; readonly skipped: number; readonly failed: number };
  /** How many `Observation` this tick persisted. */
  readonly observations: number;
}

export interface TickComposition {
  readonly sql: Sql;
  readonly store: RawStore;
  readonly fetcher: HttpFetcher;
  readonly clock: Clock;
  readonly registry?: SourceRegistry;
  readonly season: string;
  readonly windows: readonly MeasurementWindow[];
}

/**
 * The production shape of the ports: the DURABLE implementations, built anew
 * per tick as a cold start does (ADR-004). The rhythm is `PostgresRateLimit`
 * (SPEC-008 CA-14) and the robots gate is the durable one of ADR-019 §4 —
 * nothing in-memory survives here, and nothing in-memory is constructed.
 */
export function composeTickPorts(input: TickComposition): TickPorts {
  const rateLimit = new PostgresRateLimit(input.sql);

  return {
    registry: input.registry ?? defaultRegistry(),
    matches: new PostgresMatchStore(input.sql),
    aliases: new PostgresAliasStore(input.sql),
    observations: new PostgresObservationStore(input.sql),
    attempts: new PostgresIngestAttemptLog(input.sql),
    rateLimit,
    robots: new DurablePolicyGate({
      fetcher: input.fetcher,
      store: input.store,
      rateLimit,
      userAgent: USER_AGENT,
    }),
    store: input.store,
    fetcher: input.fetcher,
    clock: input.clock,
    season: input.season,
    windows: input.windows,
  };
}

/** One pass. See the module comment for the whole path. */
export async function runIngestTick(ports: TickPorts): Promise<TickSummary> {
  const at = ports.clock.now();
  const atMs = epochMsOf(at);

  // ADR-019 §2: the exact interval whose kickoffs have `at` in window. If the
  // base is unreachable, this THROWS and nothing has left yet (CA-9).
  const candidates = await ports.matches.listKickoffsBetween(
    instantOf(atMs - MATCH_WINDOW.postMs),
    instantOf(atMs + MATCH_WINDOW.preMs),
  );
  const eligible = eligibleCompetitions(candidates, ports.windows, at);

  const counters = { ok: 0, skipped: 0, failed: 0 };
  let persisted = 0;

  // A pair that is not eligible spends no turn, produces no request and
  // leaves no record: below this line only eligible pairs exist (ADR-019 §5).
  for (const entry of ports.registry.entries) {
    const competitions = entry.competitions.filter(([competitionId]) =>
      eligible.includes(competitionId),
    );
    if (competitions.length === 0) continue;

    const { adapter, targets } = eligibleAdapter(ports, entry, competitions);

    // `SourceAdapter.tick()` owns the turn semantics (SPEC-008 §4): a
    // suppressed turn produces NO record, a granted one produces exactly one.
    for (const record of await adapter.tick()) {
      const outcome = await settle(ports, adapter, targets, record);
      counters[outcome.outcome] += 1;
      persisted += outcome.persisted;
    }
  }

  return { at, attempts: counters, observations: persisted };
}

/** The adapter for ONE source, restricted to its eligible competitions. */
function eligibleAdapter(
  ports: TickPorts,
  entry: SourceEntry,
  competitions: SourceEntry['competitions'],
): { adapter: SourceAdapter; targets: ReadonlyMap<string, IngestTarget> } {
  const registry = sourceRegistry([{ ...entry, competitions }]);

  const adapter = new SourceAdapter({
    registry,
    fetcher: ports.fetcher,
    store: ports.store,
    clock: ports.clock,
    robots: ports.robots,
    rateLimit: ports.rateLimit,
    // The REAL resolver (SPEC-011, ADR-018): the confirmed catalogue plus the
    // loaded calendar, all or nothing. The season is the declared one.
    resolver: catalogMatchResolver({
      source: entry.source,
      season: ports.season,
      aliases: ports.aliases,
      matches: ports.matches,
    }),
  });

  const targets = new Map<string, IngestTarget>(
    registry.targets().map((target) => [target.competition_id, target]),
  );
  return { adapter, targets };
}

/**
 * The tail of one attempt: read the archived body, persist what resolved, and
 * record the attempt whole (ADR-019 §5). A failure here — archive read,
 * resolution, persistence — leaves the attempt `failed` WITH ITS REASON and
 * does not stop the next pair (CA-5.1).
 */
async function settle(
  ports: TickPorts,
  adapter: SourceAdapter,
  targets: ReadonlyMap<string, IngestTarget>,
  record: TickRecord,
): Promise<{ outcome: 'ok' | 'skipped' | 'failed'; persisted: number }> {
  // The record's ids come back widened to `string`; the target carries the
  // branded ones the attempt record and `read` demand, from the same registry.
  const target = targets.get(record.competition_id);
  if (target === undefined) {
    throw new Error(`unreachable: no target for ${record.source}/${record.competition_id}`);
  }

  const head = {
    source: target.source,
    competition_id: target.competition_id,
    attempted_at: record.at,
    raw_ref: record.raw_ref,
  } as const;

  if (record.outcome !== 'ok' || record.raw_ref === null) {
    await ports.attempts.append({
      ...head,
      outcome: record.outcome,
      reason: record.reason ?? `capture did not produce a reference (${record.outcome})`,
      observations_count: 0,
      unresolved_names: [],
    });
    return { outcome: record.outcome, persisted: 0 };
  }

  let persisted = 0;
  try {
    // The bytes are re-read FROM THE ARCHIVE, not kept from the response:
    // what cannot be read back from the raw store cannot be replayed either,
    // and this is the path the replay of CA-4.3 exercises for real (RN-10).
    const archived = await ports.store.get(record.raw_ref);
    if (archived === null) {
      throw new Error(`archived object ${record.raw_ref} cannot be read back`);
    }

    const result = await adapter.read(target, archived.body, record.raw_ref, record.at);
    for (const observation of result.observations) {
      await ports.observations.append(observation);
      persisted += 1;
    }

    await ports.attempts.append({
      ...head,
      outcome: 'ok',
      reason: null,
      observations_count: persisted,
      // Whole and in page order (RN-09): the alias catalogue's work queue.
      unresolved_names: result.unresolved.flatMap((row) => [row.home_name, row.away_name]),
    });
    return { outcome: 'ok', persisted };
  } catch (error) {
    await ports.attempts.append({
      ...head,
      outcome: 'failed',
      reason: describe(error),
      observations_count: persisted,
      unresolved_names: [],
    });
    return { outcome: 'failed', persisted };
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

