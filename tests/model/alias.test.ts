/**
 * CA-5 (RN-09, behaviour) — only a confirmed alias resolves.
 *
 * The normalisation is deliberately stingy: trim, collapse of internal
 * whitespace and NFC, and nothing else. Case, punctuation and accents are
 * significant, so "Ourense CF" and "ourense cf" are two aliases and each needs
 * its own human confirmation. That decision was taken at the gate on
 * 2026-08-29 and is measured, not assumed: the manual cost is one of the four
 * figures EPIC-001 has to produce.
 */
import { describe, expect, test } from 'vitest';
import type { SourceId, TeamAlias, TeamId } from '@/model';
import { resolveConfirmedAlias } from '@/model';

const OURENSE = 'ud-ourense' as TeamId;
const BERGANTINOS = 'bergantinos-fc' as TeamId;
const FUTGAL = 'futgal' as SourceId;
const CEROACERO = 'ceroacero' as SourceId;
const SEASON = '2026/27';

const confirmed = (
  team_id: TeamId,
  alias: string,
  source: SourceId,
  season: string,
): TeamAlias => ({
  team_id,
  alias,
  source,
  season,
  status: 'confirmed',
  confirmed_by: 'alberto',
  confirmed_at: '2026-03-01T09:00:00.000Z',
});

const catalog: readonly TeamAlias[] = [
  confirmed(OURENSE, 'UD Ourense', FUTGAL, SEASON),
  confirmed(BERGANTINOS, 'Bergantiños FC'.normalize('NFC'), FUTGAL, SEASON),
  {
    team_id: OURENSE,
    alias: 'Ourense CF',
    source: FUTGAL,
    season: SEASON,
    status: 'proposed',
  },
];

describe('CA-5 — resolveConfirmedAlias', () => {
  test('1. a confirmed alias of the same source and season resolves', () => {
    expect(resolveConfirmedAlias(catalog, { source: FUTGAL, season: SEASON, alias: 'UD Ourense' })).toBe(
      OURENSE,
    );
  });

  test('2. a proposed alias never resolves', () => {
    expect(
      resolveConfirmedAlias(catalog, { source: FUTGAL, season: SEASON, alias: 'Ourense CF' }),
    ).toBeNull();
  });

  test('3. a confirmed alias of another source does not resolve', () => {
    expect(
      resolveConfirmedAlias(catalog, { source: CEROACERO, season: SEASON, alias: 'UD Ourense' }),
    ).toBeNull();
  });

  test('4. a confirmed alias of another season does not resolve', () => {
    expect(
      resolveConfirmedAlias(catalog, { source: FUTGAL, season: '2025/26', alias: 'UD Ourense' }),
    ).toBeNull();
  });

  test('5. surplus whitespace is normalised away', () => {
    expect(
      resolveConfirmedAlias(catalog, {
        source: FUTGAL,
        season: SEASON,
        alias: '   UD    Ourense  ',
      }),
    ).toBe(OURENSE);
  });

  test('5b. NFD and NFC forms of the same name are the same alias', () => {
    const nfd = 'Bergantiños FC'.normalize('NFD');

    expect(nfd).not.toBe('Bergantiños FC'.normalize('NFC'));
    expect(resolveConfirmedAlias(catalog, { source: FUTGAL, season: SEASON, alias: nfd })).toBe(
      BERGANTINOS,
    );
  });

  test.each([
    ['case', 'ud ourense'],
    ['punctuation', 'U.D. Ourense'],
    ['a trailing dot', 'UD Ourense.'],
  ])('6. a difference in %s does not resolve', (_what, alias) => {
    expect(resolveConfirmedAlias(catalog, { source: FUTGAL, season: SEASON, alias })).toBeNull();
  });

  test('6b. a difference in accents does not resolve', () => {
    expect(
      resolveConfirmedAlias(catalog, { source: FUTGAL, season: SEASON, alias: 'Bergantinos FC' }),
    ).toBeNull();
  });

  test('an alias absent from the catalog resolves to null', () => {
    expect(
      resolveConfirmedAlias(catalog, { source: FUTGAL, season: SEASON, alias: 'Racing de Ferrol' }),
    ).toBeNull();
  });

  test('an empty catalog resolves to null', () => {
    expect(
      resolveConfirmedAlias([], { source: FUTGAL, season: SEASON, alias: 'UD Ourense' }),
    ).toBeNull();
  });
});
