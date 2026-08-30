/**
 * CA-4 (RN-09, type level) — a confirmed alias without a person does not
 * compile. Inverted tests: see the header of `rn12.test-d.ts`.
 */
import { describe, expectTypeOf, test } from 'vitest';
import type { SourceId, TeamAlias, TeamId } from '@/model';

const TEAM_ID = 'ud-ourense' as TeamId;
const SOURCE = 'futgal' as SourceId;

const identity = {
  team_id: TEAM_ID,
  alias: 'UD Ourense',
  source: SOURCE,
  season: '2026/27',
} as const;

/** 1. A confirmed alias with no person who confirmed it. */
// @ts-expect-error RN-09: `confirmed` requires `confirmed_by`.
export const confirmedWithoutWho: TeamAlias = {
  ...identity,
  status: 'confirmed',
  confirmed_at: '2026-03-01T09:00:00.000Z',
};

/** 2. A confirmed alias with no moment of confirmation. */
// @ts-expect-error RN-09: `confirmed` requires `confirmed_at`.
export const confirmedWithoutWhen: TeamAlias = {
  ...identity,
  status: 'confirmed',
  confirmed_by: 'alberto',
};

/** 3. A proposed alias carrying a field that belongs to the other branch. */
// @ts-expect-error a `proposed` alias has no confirmer: nobody confirmed it.
export const proposedWithConfirmer: TeamAlias = {
  ...identity,
  status: 'proposed',
  confirmed_by: 'alberto',
};

/** Runtime-only case, exported for `tests/model/rn09.test.ts`. */
export const confirmedByNobody = {
  ...identity,
  status: 'confirmed',
  confirmed_by: '',
  confirmed_at: '2026-03-01T09:00:00.000Z',
};

describe('CA-4 — RN-09 at the type level', () => {
  test('narrowing by status exposes the confirmer only on the confirmed branch', () => {
    const alias: TeamAlias = {
      ...identity,
      status: 'confirmed',
      confirmed_by: 'alberto',
      confirmed_at: '2026-03-01T09:00:00.000Z',
    };

    if (alias.status === 'confirmed') {
      expectTypeOf(alias.confirmed_by).toEqualTypeOf<string>();
      expectTypeOf(alias.confirmed_at).toEqualTypeOf<string>();
    }
  });
});
