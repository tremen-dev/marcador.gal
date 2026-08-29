import { z } from 'zod';
import { CompetitionIdSchema, SeasonSchema } from './ids';

/** A competition-season-group, e.g. Preferente Futgal G1 2026/27. */
export const CompetitionSchema = z.object({
  id: CompetitionIdSchema,
  name: z.string().min(1),
  season: SeasonSchema,
  group: z.string().min(1),
});

export type Competition = z.infer<typeof CompetitionSchema>;
