/**
 * SYNTHETIC hand-written matchday (ADR-009 §3): invented teams, hours and
 * source. The real one is typed by a person from the RFGF's public web into
 * `data/matchday.json` (SPEC-019 CA-5.2, amended 2026-09-13) and never
 * versioned.
 */
import type { HandWrittenMatchday } from '../../src/cost.ts';

export const matchday: HandWrittenMatchday = {
  source: { url: 'https://example.invalid/rfgf/xornada-3', consultedOn: '2026-09-13' },
  timezone: 'Europe/Madrid',
  competitions: [
    {
      id: 'futgal-preferente-g1',
      matchday: 'xornada 3',
      matches: [
        { home: 'Sintético A', away: 'Sintético B', kickoff: '2026-09-19 17:00' },
        { home: 'Sintético C', away: 'Sintético D', kickoff: '2026-09-19 17:00' },
        { home: 'Sintético E', away: 'Sintético F', kickoff: '2026-09-20 12:00' },
      ],
    },
    {
      id: 'terceira-rfef-g1',
      matchday: 'xornada 3',
      matches: [
        { home: 'Sintético G', away: 'Sintético H', kickoff: '2026-09-19 17:00' },
        { home: 'Sintético I', away: 'Sintético J', kickoff: '2026-09-19 18:30' },
        { home: 'Sintético K', away: 'Sintético L', kickoff: '2026-09-20 17:00' },
      ],
    },
  ],
};
