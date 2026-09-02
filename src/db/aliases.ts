/**
 * Loading a declared alias catalogue into Postgres, and reading it back
 * (SPEC-011 §3, §4; ADR-018 §2).
 *
 * `postgres.js` with tagged SQL and no ORM (ADR-006). ONE TRANSACTION, and
 * inside it, in this order:
 *
 *   1. every `team_id` of the file has to exist in `teams` — the calendar
 *      declares the teams (SPEC-010), not this file. One missing REFUSES the
 *      whole load, naming it.
 *   2. DELETE every row of `team_aliases` of this `(source, season)` —
 *      whatever its status, `proposed` included (ADR-018 §2) — and INSERT
 *      exactly the file's entries, all `confirmed`, with `confirmed_by` and
 *      `confirmed_at` from the declaration. This is the DELIBERATE
 *      contradiction with the calendar's «report and never delete»
 *      (ADR-017 §2): a match is a fact with history hanging off it; an alias
 *      is LIVE ROUTING, and a stale confirmed alias keeps routing
 *      observations to the wrong match while it exists.
 *   3. Rows of OTHER sources and OTHER seasons are not touched.
 *   4. One row in `alias_loads`: who declared, when, from which bytes
 *      (digest), how many entries, what the replacement did.
 *
 * If any step fails, NOTHING is written — the load record included.
 *
 * The clock is injected (`src/polite/clock.ts`, ADR-014 §1). Instants cross
 * as `Z` strings: `createClient` converts them, and `Date` does not appear
 * here (ADR-006). This module makes NO network request (RN-11 is not
 * exercised) and calls no LLM (ADR-018 §1).
 */
import type { AliasEntry, DeclaredAliasCatalog } from '@/alias/catalog';
import type { AliasStore } from '@/alias/ports';
import type { SourceId, TeamId } from '@/model/ids';
import { TeamAliasSchema } from '@/model/team';
import type { TeamAlias } from '@/model/team';
import { epochMsOf, instantOf, systemClock } from '@/polite/clock';
import type { Clock } from '@/polite/clock';
import { pgTextArray } from './arrays';
import type { Sql } from './client';

/** Thrown when a file names a team the declared calendar never declared. */
export class UnknownTeamError extends Error {
  override readonly name = 'UnknownTeamError';
  readonly teamId: TeamId;

  constructor(teamId: string) {
    super(
      `team ${teamId} does not exist in teams: the teams are declared by the calendar ` +
        '(SPEC-010), not by the alias catalogue — load the calendar first, or fix the entry',
    );
    this.teamId = teamId as TeamId;
  }
}

export interface AliasLoadResult {
  /** Entries of the file whose `(alias, team_id)` pair was not in the base. */
  readonly inserted: readonly AliasEntry[];
  /** Pairs that were in the base for this `(source, season)` and left with the load. */
  readonly removed: readonly AliasEntry[];
  /** `alias_loads.id` of the row this load wrote. */
  readonly load_id: number;
}

export interface AliasLoadOptions {
  readonly clock?: Clock;
}

const pairKey = (entry: { readonly alias: string; readonly team_id: string }): string =>
  JSON.stringify([entry.alias, entry.team_id]);

const byPair = (a: AliasEntry, b: AliasEntry): number =>
  a.alias < b.alias ? -1 : a.alias > b.alias ? 1 : a.team_id < b.team_id ? -1 : 1;

export async function loadAliasCatalog(
  sql: Sql,
  file: DeclaredAliasCatalog,
  options: AliasLoadOptions = {},
): Promise<AliasLoadResult> {
  const clock = options.clock ?? systemClock;
  // Already validated whole by `declareAliasCatalog` (CA-1), digest kept.
  const { catalog, digest } = file;
  const { source, season } = catalog;

  return sql.begin(async (tx) => {
    // 1. Every team the file names has to exist already.
    const teamIds = [...new Set(catalog.aliases.map((entry) => entry.team_id))];
    const known = new Set(
      (
        await tx<{ id: string }[]>`
          select id from teams where id = any(${pgTextArray(teamIds)}::text[])
        `
      ).map((row) => row.id),
    );
    const missing = teamIds.filter((id) => !known.has(id));
    if (missing.length > 0) throw new UnknownTeamError(missing[0]!);

    // 2. What the base held for this (source, season), then the replacement.
    const before = await tx<{ alias: string; team_id: string }[]>`
      select alias, team_id from team_aliases
       where source = ${source} and season = ${season}
    `;
    await tx`delete from team_aliases where source = ${source} and season = ${season}`;

    const confirmedAt = instantOf(epochMsOf(catalog.declared_at));
    await tx`
      insert into team_aliases ${sql(
        catalog.aliases.map((entry) => ({
          team_id: entry.team_id,
          alias: entry.alias,
          source,
          season,
          status: 'confirmed',
          confirmed_by: catalog.declared_by,
          confirmed_at: confirmedAt,
        })),
        'team_id',
        'alias',
        'source',
        'season',
        'status',
        'confirmed_by',
        'confirmed_at',
      )}
    `;

    const beforePairs = new Set(before.map(pairKey));
    const filePairs = new Set(catalog.aliases.map(pairKey));
    const inserted = catalog.aliases
      .filter((entry) => !beforePairs.has(pairKey(entry)))
      .map((entry) => ({ alias: entry.alias, team_id: entry.team_id }))
      .sort(byPair);
    const removed = before
      .filter((row) => !filePairs.has(pairKey(row)))
      .map((row) => ({ alias: row.alias, team_id: row.team_id }))
      .sort(byPair);

    // 4. The record of the act.
    const loadedAt = clock.now();
    const [load] = await tx<{ id: number }[]>`
      insert into alias_loads
        (source, season, declared_by, declared_at, loaded_at, file_digest,
         aliases_count, inserted, removed)
      values
        (${source}, ${season}, ${catalog.declared_by}, ${confirmedAt}, ${loadedAt},
         ${digest}, ${catalog.aliases.length}, ${inserted.length}, ${removed.length})
      returning id
    `;
    if (load === undefined) throw new Error('unreachable: alias_loads insert returned no row');

    return { inserted, removed, load_id: load.id };
  });
}

const COLUMNS = [
  'team_id',
  'alias',
  'source',
  'season',
  'status',
  'confirmed_by',
  'confirmed_at',
] as const;

/**
 * Frozen on the way out, like `Observation` (RN-13 by habit): the catalogue a
 * resolver reads is not a thing to edit in place.
 */
const FrozenTeamAliasSchema = TeamAliasSchema.readonly();

interface StoredAliasRow {
  readonly team_id: string;
  readonly alias: string;
  readonly source: string;
  readonly season: string;
  readonly status: string;
  readonly confirmed_by: string | null;
  readonly confirmed_at: string | null;
}

/**
 * `AliasStore` on Postgres (SPEC-011 §4). Read-only over what
 * `loadAliasCatalog` wrote — plus whatever a future spec writes as
 * `proposed`: the port does not filter by status, `resolveConfirmedAlias`
 * does. Every row is parsed with `TeamAliasSchema` ON THE WAY OUT, because
 * the driver returns `any`; `confirmed_at` crosses as a `Z` string
 * (`createClient` converts it) and `Date` does not appear here (ADR-006).
 */
export class PostgresAliasStore implements AliasStore {
  readonly #sql: Sql;

  constructor(sql: Sql) {
    this.#sql = sql;
  }

  async listBySource(source: SourceId, season: string): Promise<readonly TeamAlias[]> {
    const sql = this.#sql;
    const rows = await sql<StoredAliasRow[]>`
      select ${sql(COLUMNS)} from team_aliases
       where source = ${source} and season = ${season}
       order by alias asc, team_id asc
    `;
    return rows.map((row) =>
      FrozenTeamAliasSchema.parse(
        // The `proposed` branch declares `confirmed_by`/`confirmed_at` as
        // `never` (SPEC-001): the SQL `null` must not reach it.
        row.status === 'confirmed'
          ? row
          : {
              team_id: row.team_id,
              alias: row.alias,
              source: row.source,
              season: row.season,
              status: row.status,
            },
      ),
    );
  }
}
