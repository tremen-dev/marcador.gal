import { z } from 'zod';
import { InstantSchema, SeasonSchema, SourceIdSchema, TeamIdSchema } from './ids';

/** The two states of an alias. A LLM proposes; a person confirms (RN-09). */
export const TEAM_ALIAS_STATUSES = ['proposed', 'confirmed'] as const;

const aliasIdentity = {
  team_id: TeamIdSchema,
  alias: z.string().min(1),
  source: SourceIdSchema,
  season: SeasonSchema,
};

/**
 * A proposed alias. `confirmed_by` / `confirmed_at` are declared as
 * `never` so that the branch does not merely omit them: writing them is a
 * compile error and a parse error, which is what "proposed" has to mean.
 */
export const ProposedTeamAliasSchema = z.object({
  ...aliasIdentity,
  status: z.literal('proposed'),
  confirmed_by: z.never().optional(),
  confirmed_at: z.never().optional(),
});

/**
 * A confirmed alias always carries the person who confirmed it and when.
 * `confirmed_by` is `.min(1)` because the empty string is exactly the shape
 * "nobody confirmed it" takes (RN-09, CA-4).
 */
export const ConfirmedTeamAliasSchema = z.object({
  ...aliasIdentity,
  status: z.literal('confirmed'),
  confirmed_by: z.string().min(1),
  confirmed_at: InstantSchema,
});

/** Identity is `(alias, source, season)`; see dominio.md. */
export const TeamAliasSchema = z.discriminatedUnion('status', [
  ProposedTeamAliasSchema,
  ConfirmedTeamAliasSchema,
]);

export type TeamAlias = z.infer<typeof TeamAliasSchema>;

export const TeamSchema = z.object({
  id: TeamIdSchema,
  /** The canonical RFGF name. "UD Ourense" is not "Ourense CF". */
  canonical_name: z.string().min(1),
  aliases: z.array(TeamAliasSchema),
});

export type Team = z.infer<typeof TeamSchema>;
