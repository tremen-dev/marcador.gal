import { z } from 'zod';

/**
 * The scoreboard rule, written ONCE and used by the two entities that carry a
 * scoreboard: `Observation` (CA-7) and `Decision` (CA-18).
 *
 * What we publish has to be protected at least as much as what we observe, so
 * the two are not "the same rule twice": they are the same rule. If they ever
 * have to diverge, this file is where the divergence has to be written down.
 *
 * `suspended` carries a scoreboard because a match suspended at minute 60 has
 * one; `postponed` does not, because it was never played.
 */

/** A goal count: a non-negative integer. `-1` and `1.5` are not scores. */
export const ScoreSchema = z.int().min(0);

/** The shape of the branches whose match has been played. */
export const scoredShape = {
  home_score: ScoreSchema,
  away_score: ScoreSchema,
} as const;

/** The shape of the branches whose match has not. */
export const unscoredShape = {
  home_score: z.null(),
  away_score: z.null(),
} as const;
