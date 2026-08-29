import { z } from 'zod';
import { RawRefSchema } from '../raw/key';
import { InstantSchema, MatchIdSchema, ObservationIdSchema, SourceIdSchema } from './ids';

/** A goal count: a non-negative integer. `-1` and `1.5` are not scores. */
const ScoreSchema = z.int().min(0);

const observationBase = {
  id: ObservationIdSchema,
  match_id: MatchIdSchema,
  source: SourceIdSchema,
  observed_at: InstantSchema,
  confidence: z.number().min(0).max(1),
  /** RN-10: no Observation exists without the raw response behind it. */
  raw_ref: RawRefSchema,
};

const scored = {
  home_score: ScoreSchema,
  away_score: ScoreSchema,
};

const unscored = {
  home_score: z.null(),
  away_score: z.null(),
};

/**
 * `suspended` carries a scoreboard because a match suspended at minute 60 has
 * one; `postponed` does not, because it was never played.
 */
export const LiveObservationSchema = z.object({
  ...observationBase,
  status: z.literal('live'),
  ...scored,
});
export const FinishedObservationSchema = z.object({
  ...observationBase,
  status: z.literal('finished'),
  ...scored,
});
export const SuspendedObservationSchema = z.object({
  ...observationBase,
  status: z.literal('suspended'),
  ...scored,
});
export const ScheduledObservationSchema = z.object({
  ...observationBase,
  status: z.literal('scheduled'),
  ...unscored,
});
export const PostponedObservationSchema = z.object({
  ...observationBase,
  status: z.literal('postponed'),
  ...unscored,
});

/**
 * What a source says at an instant. Never edited, never deleted (RN-13): the
 * schema ends in `.readonly()`, so parsed values come out frozen.
 */
export const ObservationSchema = z
  .discriminatedUnion('status', [
    LiveObservationSchema,
    FinishedObservationSchema,
    SuspendedObservationSchema,
    ScheduledObservationSchema,
    PostponedObservationSchema,
  ])
  .readonly();

export type Observation = z.infer<typeof ObservationSchema>;
