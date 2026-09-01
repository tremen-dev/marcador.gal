/**
 * CA-3 — the identity of a match is DERIVED and stable (ADR-017 §3).
 *
 * Pure. `npm test`.
 *
 * `<competition_id>-<season>-j<round>-<home_id>-<away_id>`, with `2026/27`
 * written `2026-27`. Nothing in it depends on the hour, which is what lets an
 * `Observation` survive a reload that only moved the kickoff (RN-13).
 */
import { describe, expect, test } from 'vitest';
import { matchId, seasonSlug } from '@/calendar/ids';
import { MatchIdSchema } from '@/model/ids';
import type { CompetitionId, TeamId } from '@/model/ids';

const COMPETITION = 'futgal-preferente-g1' as CompetitionId;
const OURENSE = 'ud-ourense' as TeamId;
const CELTA_B = 'rc-celta-b' as TeamId;

describe('CA-3 — matchId', () => {
  test('produces exactly the id ADR-017 §3 writes as its example', () => {
    expect(matchId(COMPETITION, '2026/27', 1, OURENSE, CELTA_B)).toBe(
      'futgal-preferente-g1-2026-27-j1-ud-ourense-rc-celta-b',
    );
  });

  test('the same input produces the same output', () => {
    expect(matchId(COMPETITION, '2026/27', 1, OURENSE, CELTA_B)).toBe(
      matchId(COMPETITION, '2026/27', 1, OURENSE, CELTA_B),
    );
  });

  test('swapping home and away produces ANOTHER id', () => {
    expect(matchId(COMPETITION, '2026/27', 1, CELTA_B, OURENSE)).not.toBe(
      matchId(COMPETITION, '2026/27', 1, OURENSE, CELTA_B),
    );
  });

  test('changing the round produces another id', () => {
    expect(matchId(COMPETITION, '2026/27', 2, OURENSE, CELTA_B)).not.toBe(
      matchId(COMPETITION, '2026/27', 1, OURENSE, CELTA_B),
    );
  });

  test('the result satisfies MatchIdSchema and matches ^[a-z0-9-]+$', () => {
    const id = matchId(COMPETITION, '2026/27', 23, CELTA_B, OURENSE);

    expect(MatchIdSchema.safeParse(id).success).toBe(true);
    expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  test('the season slug is the season with the slash turned into a hyphen', () => {
    expect(seasonSlug('2026/27')).toBe('2026-27');
  });
});
