/**
 * Branded identifiers (SPEC-001 CA-3).
 *
 * Branding is what makes "an ObservationId where a MatchId belongs" a
 * compile-time error instead of a runtime surprise.
 */
import { z } from 'zod';

const identifier = () => z.string().min(1);

export const CompetitionIdSchema = identifier().brand<'CompetitionId'>();
export const TeamIdSchema = identifier().brand<'TeamId'>();
export const MatchIdSchema = identifier().brand<'MatchId'>();
export const ObservationIdSchema = identifier().brand<'ObservationId'>();
/** The identifier of a source (`futgal`, `ceroacero`, `corresponsal`, …). */
export const SourceIdSchema = identifier().brand<'SourceId'>();

export type CompetitionId = z.infer<typeof CompetitionIdSchema>;
export type TeamId = z.infer<typeof TeamIdSchema>;
export type MatchId = z.infer<typeof MatchIdSchema>;
export type ObservationId = z.infer<typeof ObservationIdSchema>;
export type SourceId = z.infer<typeof SourceIdSchema>;

/** A season as the RFGF writes it, e.g. `2026/27`. */
export const SeasonSchema = z.string().min(1);

/**
 * Every instant of the canonical model is an ISO 8601 UTC string with a `Z`
 * suffix, never a `Date` (ADR-006): the type crosses to the frontend as JSON.
 */
export const InstantSchema = z.iso.datetime({ offset: false });
export type Instant = z.infer<typeof InstantSchema>;
