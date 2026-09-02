/**
 * CA-5 — the resolver resolves all or nothing, only through confirmed aliases,
 * and uses nothing but catalogue and calendar (ADR-018 §3, RN-09).
 *
 * In-memory doubles of `AliasStore` and `MatchStore` over the synthetic
 * fixtures: no network, no clock, no database — `npm test`. The calendar's
 * matches come out of `declaredMatches`, so the `MatchId` asserted here is the
 * derived identity of SPEC-010 CA-3, not a string invented by this test.
 */
import { describe, expect, test } from 'vitest';
import { catalogMatchResolver } from '@/alias/resolver';
import type { AliasStore } from '@/alias/ports';
import { declaredMatches } from '@/calendar/declared';
import { matchId } from '@/calendar/ids';
import { parseSchedule } from '@/calendar/schedule';
import type { MatchStore } from '@/calendar/ports';
import type { CompetitionId, SourceId, TeamId } from '@/model/ids';
import type { Match } from '@/model/match';
import { TeamAliasSchema } from '@/model/team';
import type { TeamAlias } from '@/model/team';
import type { MatchResolver, SourceRow } from '@/ingest/ports';
import { ALIAS_SEASON, ALIAS_SOURCE, aliasCatalogFixture } from '../fixtures/aliases';
import { CALENDAR_COMPETITION_ID, CALENDAR_SEASON, calendarFixture } from '../fixtures/calendar';

const COMPETITION = CALENDAR_COMPETITION_ID as CompetitionId;
const SOURCE = ALIAS_SOURCE as SourceId;

/** The fixture's entries as CONFIRMED aliases, as a load would leave them. */
const CATALOG: readonly TeamAlias[] = aliasCatalogFixture.aliases.map((entry) =>
  TeamAliasSchema.parse({
    team_id: entry.team_id,
    alias: entry.alias,
    source: ALIAS_SOURCE,
    season: ALIAS_SEASON,
    status: 'confirmed',
    confirmed_by: aliasCatalogFixture.declared_by,
    confirmed_at: '2026-09-02T09:00:00Z',
  }),
);

const MATCHES: readonly Match[] = declaredMatches(parseSchedule(calendarFixture));

/** The one match of the resolvable pair, by its derived identity (CA-3 of SPEC-010). */
const OURENSE_CELTA = matchId(
  COMPETITION,
  CALENDAR_SEASON,
  1,
  'ud-ourense' as TeamId,
  'rc-celta-b' as TeamId,
);

function aliasStoreOf(catalog: readonly TeamAlias[]): AliasStore {
  return {
    listBySource: (source, season) =>
      Promise.resolve(catalog.filter((entry) => entry.source === source && entry.season === season)),
  };
}

function matchStoreOf(matches: readonly Match[]): MatchStore {
  return {
    getById: (id) => Promise.resolve(matches.find((match) => match.id === id) ?? null),
    listByRound: (competitionId, round) =>
      Promise.resolve(
        matches.filter((match) => match.competition_id === competitionId && match.round === round),
      ),
    listByTeams: (competitionId, homeId, awayId) =>
      Promise.resolve(
        matches.filter(
          (match) =>
            match.competition_id === competitionId &&
            match.home_id === homeId &&
            match.away_id === awayId,
        ),
      ),
    listKickoffsBetween: () => Promise.resolve([]),
  };
}

function resolverOver(catalog: readonly TeamAlias[], matches: readonly Match[]): MatchResolver {
  return catalogMatchResolver({
    source: SOURCE,
    season: ALIAS_SEASON,
    aliases: aliasStoreOf(catalog),
    matches: matchStoreOf(matches),
  });
}

function row(home: string, away: string, over: Partial<SourceRow> = {}): SourceRow {
  return {
    source_ref: '/partido/2026-09-06-sintetico/90001',
    home_name: home,
    away_name: away,
    status: 'live',
    home_score: 1,
    away_score: 0,
    kickoff: '17:00',
    ...over,
  };
}

describe('CA-5 — all or nothing over catalogue and calendar', () => {
  test('1. confirmed spellings resolve to the derived MatchId — extra spaces and decomposed Unicode included', async () => {
    const resolver = resolverOver(CATALOG, MATCHES);

    // `normalizeAlias` irons out the double spaces and the decomposed accent
    // (SPEC-001 CA-5); the spelling is still the confirmed one.
    const resolved = await resolver.resolve(
      row('  Unio\u0301n   Deportiva Ourense ', 'Celta de Vigo B'),
      COMPETITION,
    );

    expect(resolved).toBe(OURENSE_CELTA);
  });

  test('2. a name that is not in the catalogue resolves to null — home, away, or both', async () => {
    const resolver = resolverOver(CATALOG, MATCHES);

    expect(await resolver.resolve(row('SD Descoñecida', 'Celta de Vigo B'), COMPETITION)).toBeNull();
    expect(await resolver.resolve(row('UD Ourense', 'CF Sen Alias'), COMPETITION)).toBeNull();
    expect(await resolver.resolve(row('SD Descoñecida', 'CF Sen Alias'), COMPETITION)).toBeNull();
  });

  test('3. the canonical name of a team WITHOUT a confirmed alias resolves to null (RN-09)', async () => {
    const resolver = resolverOver(CATALOG, MATCHES);

    // `SD Inventada` is the canonical_name of sd-inventada in the calendar,
    // and it is NOT an entry of the catalogue (the entry is `Inventada SD`).
    // That the source guesses the canonical name is not a confirmation.
    expect(await resolver.resolve(row('SD Inventada', 'UD Ourense'), COMPETITION)).toBeNull();
  });

  test('4. a proposed alias for that same name still resolves to null: only confirmed resolves', async () => {
    const proposed = TeamAliasSchema.parse({
      team_id: 'sd-inventada',
      alias: 'SD Inventada',
      source: ALIAS_SOURCE,
      season: ALIAS_SEASON,
      status: 'proposed',
    });
    const resolver = resolverOver([...CATALOG, proposed], MATCHES);

    expect(await resolver.resolve(row('SD Inventada', 'UD Ourense'), COMPETITION)).toBeNull();
  });

  test('5. zero matches for the resolved pair is null, and so are two: ambiguity is not broken', async () => {
    const pair = MATCHES.find((match) => match.id === OURENSE_CELTA);
    expect(pair).toBeDefined();

    const none = resolverOver(CATALOG, []);
    expect(await none.resolve(row('UD Ourense', 'Celta de Vigo B'), COMPETITION)).toBeNull();

    // A second match of the SAME ordered pair (a format that is not
    // double-round): the resolver does not pick by hour or by anything else.
    const duplicated: Match = { ...pair!, id: `${OURENSE_CELTA}-other` as Match['id'], round: 99 };
    const two = resolverOver(CATALOG, [...MATCHES, duplicated]);
    expect(await two.resolve(row('UD Ourense', 'Celta de Vigo B'), COMPETITION)).toBeNull();
  });

  test('6. source_ref and kickoff change nothing, and case stays significant', async () => {
    const resolver = resolverOver(CATALOG, MATCHES);

    const a = await resolver.resolve(
      row('UD Ourense', 'Celta de Vigo B', { source_ref: '/partido/a/1', kickoff: '17:00' }),
      COMPETITION,
    );
    const b = await resolver.resolve(
      row('UD Ourense', 'Celta de Vigo B', { source_ref: '/partido/b/2', kickoff: null }),
      COMPETITION,
    );
    expect(a).toBe(OURENSE_CELTA);
    expect(b).toBe(OURENSE_CELTA);

    // Another case of the SAME confirmed spelling: not the same spelling
    // (SPEC-001 CA-5, case and accents significant).
    expect(await resolver.resolve(row('celta de vigo b', 'UD Ourense'), COMPETITION)).toBeNull();
  });
});
