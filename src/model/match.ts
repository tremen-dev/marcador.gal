import { z } from 'zod';
import { CompetitionIdSchema, InstantSchema, MatchIdSchema, TeamIdSchema } from './ids';

/** The five states of dominio.md. Order is not meaningful. */
export const MATCH_STATUSES = [
  'scheduled',
  'live',
  'finished',
  'postponed',
  'suspended',
] as const;

export const MatchStatusSchema = z.enum(MATCH_STATUSES);
export type MatchStatus = z.infer<typeof MatchStatusSchema>;

/** States that have a scoreboard: the ball has been kicked. */
export const STATUSES_WITH_SCORE = ['live', 'finished', 'suspended'] as const;
/** States that do not: nothing has been played yet. */
export const STATUSES_WITHOUT_SCORE = ['scheduled', 'postponed'] as const;

export const MatchSchema = z.object({
  id: MatchIdSchema,
  competition_id: CompetitionIdSchema,
  /** `jornada` in docs and UI. */
  round: z.int().min(1),
  kickoff: InstantSchema,
  home_id: TeamIdSchema,
  away_id: TeamIdSchema,
  venue: z.string().min(1).nullable(),
});

export type Match = z.infer<typeof MatchSchema>;
