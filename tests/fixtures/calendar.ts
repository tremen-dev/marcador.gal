/**
 * Synthetic declared calendars (SPEC-010 CA-1, ADR-017 §1).
 *
 * SYNTHETIC ONLY. Not one of these rounds exists: the RFGF publishes its
 * calendar and nobody has yet ruled on copying it into the repository
 * (F-SPEC-010-1), and `tests/fixtures/` never holds real third-party data
 * (ADR-009). The canonical names are the ones this repository already uses in
 * other synthetic fixtures; the pairings and hours are invented.
 *
 * Two rounds, four teams, one `venue: null`. The pairs are laid out so that
 * `listByTeams(competition, 'ud-ourense', 'rc-celta-b')` finds exactly one
 * match and the inverted pair finds none (CA-9).
 */

/** The declared calendar as a person writes it: plain JSON, not yet parsed. */
export interface CalendarFixture {
  readonly competition: {
    readonly id: string;
    readonly name: string;
    readonly season: string;
    readonly group: string;
  };
  readonly timezone: string;
  readonly declared_by: string;
  readonly declared_at: string;
  readonly source_note?: string;
  readonly teams: readonly { readonly id: string; readonly canonical_name: string }[];
  readonly rounds: readonly {
    readonly round: number;
    readonly matches: readonly {
      readonly home_id: string;
      readonly away_id: string;
      readonly kickoff: string;
      readonly venue: string | null;
    }[];
  }[];
}

export const CALENDAR_COMPETITION_ID = 'futgal-preferente-g1';
export const CALENDAR_SEASON = '2026/27';

export const calendarFixture: CalendarFixture = {
  competition: {
    id: CALENDAR_COMPETITION_ID,
    name: 'Preferente Futgal',
    season: CALENDAR_SEASON,
    group: '1',
  },
  timezone: 'Europe/Madrid',
  declared_by: 'Persoa de Proba',
  declared_at: '2026-09-02T10:00:00+02:00',
  source_note: 'Fixture sintético: ningunha xornada real (ADR-009).',
  teams: [
    { id: 'ud-ourense', canonical_name: 'UD Ourense' },
    { id: 'rc-celta-b', canonical_name: 'RC Celta B' },
    { id: 'cd-exemplo', canonical_name: 'CD Exemplo' },
    { id: 'sd-inventada', canonical_name: 'SD Inventada' },
  ],
  rounds: [
    {
      round: 1,
      matches: [
        {
          home_id: 'ud-ourense',
          away_id: 'rc-celta-b',
          kickoff: '2026-09-06 17:00',
          venue: 'O Couto',
        },
        {
          home_id: 'cd-exemplo',
          away_id: 'sd-inventada',
          kickoff: '2026-09-06 18:00',
          venue: null,
        },
      ],
    },
    {
      round: 2,
      matches: [
        {
          home_id: 'rc-celta-b',
          away_id: 'cd-exemplo',
          kickoff: '2026-09-13 12:00',
          venue: 'Barreiro',
        },
        {
          home_id: 'sd-inventada',
          away_id: 'ud-ourense',
          kickoff: '2026-09-13 17:00',
          venue: 'Campo Inventado',
        },
      ],
    },
  ],
};

/**
 * A second competition, for the criteria that read across competitions
 * (CA-9 `listKickoffsBetween`). Different teams on purpose: `teams` is one
 * table for the whole database.
 */
export const OTHER_CALENDAR_COMPETITION_ID = 'terceira-rfef-g1';

export const otherCalendarFixture: CalendarFixture = {
  competition: {
    id: OTHER_CALENDAR_COMPETITION_ID,
    name: 'Terceira RFEF',
    season: CALENDAR_SEASON,
    group: '1',
  },
  timezone: 'Europe/Madrid',
  declared_by: 'Persoa de Proba',
  declared_at: '2026-09-02T10:30:00Z',
  teams: [
    { id: 'cf-suposto', canonical_name: 'CF Suposto' },
    { id: 'ud-mostra', canonical_name: 'UD Mostra' },
    { id: 'sc-figurado', canonical_name: 'SC Figurado' },
    { id: 'cf-quimera', canonical_name: 'CF Quimera' },
  ],
  rounds: [
    {
      round: 1,
      matches: [
        {
          home_id: 'cf-suposto',
          away_id: 'ud-mostra',
          kickoff: '2026-09-06 17:30',
          venue: 'Campo Suposto',
        },
        {
          home_id: 'sc-figurado',
          away_id: 'cf-quimera',
          kickoff: '2026-09-13 17:00',
          venue: null,
        },
      ],
    },
  ],
};

/** The bytes a person's file would hold, for the digest of CA-5. */
export function calendarBytes(fixture: CalendarFixture): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(fixture, null, 2)}\n`);
}

/** A deep copy to mutate in a variant without touching the fixture. */
export function cloneCalendar(fixture: CalendarFixture): CalendarFixture {
  return structuredClone(fixture);
}
