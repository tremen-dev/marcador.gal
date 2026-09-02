/**
 * Synthetic declared alias catalogues (SPEC-011 CA-1, ADR-018 §1).
 *
 * SYNTHETIC ONLY. Not one of these spellings is real: the real catalogue of
 * `ceroacero.es` is an act of the operator with the domain rulings in front of
 * them (SPEC-011 §Fuera de alcance), and `tests/fixtures/` never holds real
 * third-party data (ADR-009). The teams are the four of the synthetic calendar
 * fixture of SPEC-010; the spellings are invented.
 *
 * `ud-ourense` has THREE entries on purpose (a team may have many spellings;
 * one spelling has exactly one team), and one of them carries an accent so the
 * Unicode half of the normalisation (NFC, SPEC-001 CA-5) has something real to
 * bite on in CA-1.4 and CA-5.1.
 */

/** The declared catalogue as a person writes it: plain JSON, not yet parsed. */
export interface AliasCatalogFixture {
  readonly source: string;
  readonly season: string;
  readonly declared_by: string;
  readonly declared_at: string;
  readonly source_note?: string;
  readonly aliases: readonly { readonly alias: string; readonly team_id: string }[];
}

export const ALIAS_SOURCE = 'ceroacero';
export const ALIAS_SEASON = '2026/27';

export const aliasCatalogFixture: AliasCatalogFixture = {
  source: ALIAS_SOURCE,
  season: ALIAS_SEASON,
  declared_by: 'Persoa de Proba',
  declared_at: '2026-09-02T11:00:00+02:00',
  source_note: 'Fixture sintético: ningunha grafía real (ADR-009).',
  aliases: [
    { alias: 'Ourense', team_id: 'ud-ourense' },
    { alias: 'UD Ourense', team_id: 'ud-ourense' },
    { alias: 'Unión Deportiva Ourense', team_id: 'ud-ourense' },
    { alias: 'Celta de Vigo B', team_id: 'rc-celta-b' },
    { alias: 'CD Exemplo', team_id: 'cd-exemplo' },
    { alias: 'Inventada SD', team_id: 'sd-inventada' },
  ],
};

/** The bytes a person's file would hold, for the digest of CA-3. */
export function aliasCatalogBytes(fixture: AliasCatalogFixture): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(fixture, null, 2)}\n`);
}

/** A deep copy to mutate in a variant without touching the fixture. */
export function cloneAliasCatalog(fixture: AliasCatalogFixture): AliasCatalogFixture {
  return structuredClone(fixture);
}
