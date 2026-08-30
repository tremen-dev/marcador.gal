import { z } from 'zod';
import { RawRefSchema } from '../raw/key';
import { InstantSchema, MatchIdSchema, ObservationIdSchema, SourceIdSchema } from './ids';
import { scoredShape, unscoredShape } from './score';

const observationBase = {
  id: ObservationIdSchema,
  match_id: MatchIdSchema,
  source: SourceIdSchema,
  observed_at: InstantSchema,
  confidence: z.number().min(0).max(1),
  /** RN-10: no Observation exists without the raw response behind it. */
  raw_ref: RawRefSchema,
};

/**
 * The five branches. The scoreboard rule lives in `./score.ts` and is shared
 * with `Decision` (CA-18): what we publish is protected by the same rule as
 * what we observe.
 */
export const LiveObservationSchema = z.object({
  ...observationBase,
  status: z.literal('live'),
  ...scoredShape,
});
export const FinishedObservationSchema = z.object({
  ...observationBase,
  status: z.literal('finished'),
  ...scoredShape,
});
export const SuspendedObservationSchema = z.object({
  ...observationBase,
  status: z.literal('suspended'),
  ...scoredShape,
});
export const ScheduledObservationSchema = z.object({
  ...observationBase,
  status: z.literal('scheduled'),
  ...unscoredShape,
});
export const PostponedObservationSchema = z.object({
  ...observationBase,
  status: z.literal('postponed'),
  ...unscoredShape,
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
