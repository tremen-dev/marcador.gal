/**
 * Constructors for the branded identifiers of the canonical model.
 *
 * SPEC-002 adds no identifier of its own: `SourceId`, `CompetitionId` and
 * `MatchId` come from `src/model/ids.ts` untouched. This file only spares
 * every call site from writing `SourceIdSchema.parse(...)`.
 */
import { CompetitionIdSchema, MatchIdSchema, SourceIdSchema } from '@/model/ids';
import type { CompetitionId, MatchId, SourceId } from '@/model/ids';

export const sourceId = (value: string): SourceId => SourceIdSchema.parse(value);
export const competitionId = (value: string): CompetitionId => CompetitionIdSchema.parse(value);
export const matchId = (value: string): MatchId => MatchIdSchema.parse(value);
