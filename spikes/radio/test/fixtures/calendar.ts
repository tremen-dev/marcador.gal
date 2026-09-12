/** SYNTHETIC declared calendars (ADR-009 §3): invented teams, hours and rounds. */
import type { DeclaredCalendar } from '../../src/cost.ts';

export const preferente: DeclaredCalendar = {
  competition: { id: 'futgal-preferente-g1', season: '2026/27' },
  timezone: 'Europe/Madrid',
  rounds: [
    {
      round: 1,
      matches: [
        { kickoff: '2026-09-19 17:00' },
        { kickoff: '2026-09-19 17:00' },
        { kickoff: '2026-09-20 12:00' },
      ],
    },
    { round: 2, matches: [{ kickoff: '2026-09-26 17:00' }] },
  ],
};

export const terceira: DeclaredCalendar = {
  competition: { id: 'terceira-rfef-g1', season: '2026/27' },
  timezone: 'Europe/Madrid',
  rounds: [
    {
      round: 1,
      matches: [
        { kickoff: '2026-09-19 17:00' },
        { kickoff: '2026-09-19 18:30' },
        { kickoff: '2026-09-20 17:00' },
      ],
    },
  ],
};
