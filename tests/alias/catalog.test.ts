/**
 * CA-1 — the declared catalogue is validated whole, and what a person mistypes
 * is rejected NAMING the entry or the field (SPEC-011 §2, ADR-018 §1, §4).
 *
 * A pure function: no network, no database, `npm test` (CA-1). The collision
 * cases (3, 4, 5) are the conflict the database's primary key cannot see —
 * it compares exact text, `normalizeAlias` does not (ADR-018 §4) — so the ONE
 * place they are closed is this schema.
 */
import { describe, expect, test } from 'vitest';
import { InvalidCatalogError, parseAliasCatalog } from '@/alias/catalog';
import { aliasCatalogFixture, cloneAliasCatalog } from '../fixtures/aliases';
import type { AliasCatalogFixture } from '../fixtures/aliases';

type Mutable<T> = { -readonly [K in keyof T]: Mutable<T[K]> };

function variant(edit: (draft: Mutable<AliasCatalogFixture>) => void): AliasCatalogFixture {
  const draft = cloneAliasCatalog(aliasCatalogFixture) as Mutable<AliasCatalogFixture>;
  edit(draft);
  return draft;
}

/** Parses a variant and hands back the error message, which MUST name the row. */
function rejectionOf(fixture: AliasCatalogFixture): string {
  let caught: unknown;
  try {
    parseAliasCatalog(fixture);
  } catch (error) {
    caught = error;
  }
  expect(caught, 'expected the catalogue to be rejected, and it validated').toBeInstanceOf(
    InvalidCatalogError,
  );
  return (caught as InvalidCatalogError).message;
}

describe('CA-1 — the synthetic fixture validates', () => {
  test('the fixture parses whole, with every entry present', () => {
    const catalog = parseAliasCatalog(aliasCatalogFixture);

    expect(catalog.source).toBe('ceroacero');
    expect(catalog.season).toBe('2026/27');
    expect(catalog.declared_by).toBe('Persoa de Proba');
    expect(catalog.aliases).toHaveLength(6);
    // A team may have many entries; ud-ourense has three (SPEC-011 §2).
    expect(catalog.aliases.filter((entry) => entry.team_id === 'ud-ourense')).toHaveLength(3);
  });
});

describe('CA-1 — each mistake is rejected naming the entry or the field', () => {
  test('1. a team_id that is not kebab-case', () => {
    const message = rejectionOf(
      variant((draft) => {
        draft.aliases[1]!.team_id = 'UD_Ourense';
      }),
    );

    expect(message).toContain('UD_Ourense');
    expect(message).toMatch(/kebab-case/);
  });

  test('2. an empty alias', () => {
    const message = rejectionOf(
      variant((draft) => {
        draft.aliases[0]!.alias = '';
      }),
    );

    expect(message).toMatch(/alias/);
    expect(message).toMatch(/empty|nonempty|at least/i);
  });

  test('3. two entries whose normalised form collides (internal double space)', () => {
    const message = rejectionOf(
      variant((draft) => {
        draft.aliases.push({ alias: 'UD  Ourense', team_id: 'ud-ourense' });
      }),
    );

    expect(message).toContain('UD  Ourense');
    expect(message).toContain('UD Ourense');
    expect(message).toMatch(/collide|normalis/i);
  });

  test('4. two entries whose normalised form collides (composed and decomposed Unicode)', () => {
    const message = rejectionOf(
      variant((draft) => {
        // The same spelling as `Unión Deportiva Ourense`, with the accent
        // decomposed (o + combining acute). One thing for `normalizeAlias`.
        draft.aliases.push({ alias: 'Unio\u0301n Deportiva Ourense', team_id: 'ud-ourense' });
      }),
    );

    expect(message).toContain('n Deportiva Ourense');
    expect(message).toMatch(/collide|normalis/i);
  });

  test('5. the same exact entry twice', () => {
    const message = rejectionOf(
      variant((draft) => {
        draft.aliases.push({ alias: 'Ourense', team_id: 'ud-ourense' });
      }),
    );

    expect(message).toContain('Ourense');
    expect(message).toMatch(/collide|normalis|twice/i);
  });

  test('6. declared_by empty: the empty string is nobody', () => {
    const message = rejectionOf(
      variant((draft) => {
        draft.declared_by = '';
      }),
    );

    expect(message).toContain('declared_by');
    expect(message).toMatch(/person|nobody/i);
  });

  test('7. the season written as the directory (2026-27), not as the RFGF (2026/27)', () => {
    const message = rejectionOf(
      variant((draft) => {
        draft.season = '2026-27';
      }),
    );

    expect(message).toContain('season');
    expect(message).toContain('2026-27');
  });

  test('8. a source that is not kebab-case', () => {
    const message = rejectionOf(
      variant((draft) => {
        draft.source = 'CeroACero';
      }),
    );

    expect(message).toContain('source');
    expect(message).toContain('CeroACero');
  });

  test('9. a declared_at that is not an ISO 8601 instant', () => {
    const message = rejectionOf(
      variant((draft) => {
        draft.declared_at = 'onte pola tarde';
      }),
    );

    expect(message).toContain('declared_at');
  });

  test('10. an empty aliases list: emptying a catalogue is another act, and it has no spec', () => {
    const message = rejectionOf(
      variant((draft) => {
        draft.aliases = [];
      }),
    );

    expect(message).toContain('aliases');
    expect(message).toMatch(/empty|at least/i);
  });

  test('and a file that is not even an object is rejected as a file', () => {
    expect(() => parseAliasCatalog(42)).toThrow(InvalidCatalogError);
  });
});
