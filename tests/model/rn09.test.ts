/**
 * CA-4 (RN-09) — the runtime half of the alias invariant.
 */
import { describe, expect, test } from 'vitest';
import { TeamAliasSchema } from '@/model';
import { confirmedByNobody, proposedWithConfirmer } from '../types/rn09.test-d';

describe('CA-4 — RN-09 at runtime', () => {
  test('rejects a confirmed alias whose confirmer is the empty string', () => {
    // The empty string is exactly the shape "nobody confirmed it" takes.
    expect(TeamAliasSchema.safeParse(confirmedByNobody).success).toBe(false);
  });

  test('rejects a proposed alias that carries a confirmer', () => {
    expect(TeamAliasSchema.safeParse(proposedWithConfirmer).success).toBe(false);
  });

  test('accepts a proposed alias with no trace of confirmation', () => {
    const proposed = {
      team_id: 'ud-ourense',
      alias: 'Ourense CF',
      source: 'ceroacero',
      season: '2026/27',
      status: 'proposed',
    };

    expect(TeamAliasSchema.safeParse(proposed).success).toBe(true);
  });
});
