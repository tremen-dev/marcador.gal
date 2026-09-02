/**
 * The real `MatchResolver` (SPEC-011 §5, ADR-018 §3): the alias catalogue with
 * its human confirmation plus the loaded calendar. It implements the port of
 * `src/ingest/ports.ts` AS DEFINED THERE, without touching that file
 * (ADR-011 §6), and closes its «DEFINED HERE AND NOT IMPLEMENTED».
 *
 * All or nothing, in three steps and no more:
 *
 *   1. `home_name` and `away_name` through `resolveConfirmedAlias`
 *      (`src/model/team.ts`, SPEC-001) — REUSED, NOT REIMPLEMENTED: only a
 *      `confirmed` alias resolves, by exact match after `normalizeAlias`.
 *   2. Both resolved → `MatchStore.listByTeams(competition, home, away)`.
 *   3. Exactly ONE match → that `MatchId`. Zero or more than one → `null`:
 *      ambiguity is not broken by hour or by any heuristic — the row goes back
 *      whole to a person (SPEC-008 CA-13, RN-09).
 *
 * What this resolver does NOT do, written so nobody adds it to help: it does
 * not compare against `canonical_name` (that the source guesses the canonical
 * name is not a confirmation, RN-09); it does not use `source_ref` or
 * `kickoff` of the row; it reads neither the clock nor the network. With the
 * same catalogue, the same calendar and the same bytes it resolves the same:
 * the deterministic replay of SPEC-008 CA-10 is preserved. The season is
 * HANDED IN by the caller's configuration, never deduced.
 */
import type { MatchStore } from '@/calendar/ports';
import type { CompetitionId, MatchId, SourceId } from '@/model/ids';
import { resolveConfirmedAlias } from '@/model/team';
import type { MatchResolver, SourceRow } from '@/ingest/ports';
import type { AliasStore } from './ports';

export interface CatalogMatchResolverInput {
  readonly source: SourceId;
  readonly season: string;
  readonly aliases: AliasStore;
  readonly matches: MatchStore;
}

export function catalogMatchResolver(input: CatalogMatchResolverInput): MatchResolver {
  const { source, season, aliases, matches } = input;

  return {
    async resolve(row: SourceRow, competitionId: CompetitionId): Promise<MatchId | null> {
      const catalog = await aliases.listBySource(source, season);

      const homeId = resolveConfirmedAlias(catalog, { source, season, alias: row.home_name });
      if (homeId === null) return null;
      const awayId = resolveConfirmedAlias(catalog, { source, season, alias: row.away_name });
      if (awayId === null) return null;

      const candidates = await matches.listByTeams(competitionId, homeId, awayId);
      if (candidates.length !== 1) return null;
      return candidates[0]!.id;
    },
  };
}
