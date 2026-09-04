/**
 * THE CONTRACT OF WHAT IS PUBLISHED — a closed list of fields, with a motive
 * per entry, and nothing else gets out (SPEC-018 CA-5, ADR-027 §10).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY A PROJECTION AND NOT THE CANONICAL `Decision`.
 *
 * It is a binding ruling of `sdd-legal-datos` (§4.1) and, with publication
 * decided, it stops being a precaution and becomes THE FRONTIER: what enters
 * here is read by anybody, for ever, and cannot be taken back. The easy path
 * steps on it — `read-entry.ts` hands back `Decision`, «the canonical model the
 * frontend already receives», and serving it as it is leaks four things that
 * are not the reader's:
 *
 *   * `rule`, which is eloquent: `RN-01` says «the operator imposed their
 *     precedence», `RN-04` says «a scoreboard was taken down», `RN-02` says
 *     «two independent sources agreed» — which after ADR-008 §1 is information
 *     about the architecture of the sources all by itself;
 *   * `supporting_observation_ids`, whose ids are opaque but WHOSE CARDINALITY
 *     IS NOT: two ids in a row say «there are two sources» without naming one;
 *   * `version`, which is the number of rectifications of that match;
 *   * `raw_ref`, and this one is terminal: the key of the raw store carries THE
 *     NAME OF THE SOURCE INSIDE THE STRING (ADR-009), so publishing a
 *     `raw_ref` is publishing the source even if nobody meant to — not in
 *     HTML, not in JSON, not in an attribute, not in a comment.
 *
 * Out too: `confidence` —publishing «0.7» is publishing the nature of the
 * source without naming it—, `operator_id` and `correspondent_id` —pseudonyms,
 * and pseudonymisation does not take a datum out of the GDPR while the
 * re-identification key exists, which this project has (ADR-022 §2, ADR-023)—,
 * and THE ALERTS AND THE CONFLICTS, because RN-05 says literally that the
 * conflict is not published and the tray belongs to the panel. *Sen sinal*
 * does come out — but as the QUALIFIER OF THE MATCH, never as «source X has
 * been quiet for fifteen minutes».
 *
 * AND THE TRACE OF RN-12 IS NOT SHOWN, AND THAT DOES NOT BREACH D-6
 * (ADR-027 §10.4): the subject of «a published scoreboard knows where it comes
 * from» is THE SYSTEM, and the verb of RN-12 is «records», not «shows».
 * Traceability is already met by the log, by the `CHECK`s of migration 0001
 * and by the type of `SupportingObservationIdsSchema`, and its declared
 * audience is the operator (RN-01, through `read-entry.ts`, which the panel
 * consumes) and the verifier.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NO INSTANT OF OURS CARRIES SECONDS (CA-8.1).
 *
 * Every instant that leaves here is ROUNDED TO THE MINUTE and spelled
 * `YYYY-MM-DDTHH:MMZ`. `observed_at` is OUR clock, not the source's, and our
 * cadence is already published by RN-11 and by `/robot`, so it reveals nothing
 * about anybody; what WOULD be a residue is a public log, match by match and
 * to the second, of when we asked. Rounding to the minute closes that without
 * taking anything away from whoever is looking, and a `<time datetime>` with a
 * minute-rounded value is still valid for accessibility.
 */
import { z } from 'zod';
import { MATCH_QUALIFIERS } from '@/model/qualifier';
import { MATCH_STATUSES } from '@/model/match';
import { CompetitionIdSchema } from '@/model/ids';
import type { CompetitionId } from '@/model/ids';

/** One field of the projection, with the motive that lets it out. */
export interface PublishedField {
  /** The key, exactly as it is serialized. */
  readonly field: string;
  /** Why this may be published. Obligatory, every entry (ADR-016 §3.2). */
  readonly motive: string;
}

/**
 * THE CLOSED LIST. Anything not here does not come out, in any format, and a
 * case that enumerates the keys of the canonical schemas against this list
 * goes red if it does (CA-5.2). It is not a blacklist of forbidden names: it
 * is the enumeration of what is allowed, and the rest has to be empty
 * (ADR-016 §3.1).
 */
export const PUBLISHED_FIELDS: readonly PublishedField[] = [
  {
    field: 'match_id',
    motive:
      'The identity of the row. It is OURS: derived by this project from the declared calendar — competition, season, round and the two team ids (ADR-017) — so it names nothing of anybody and reveals no source. It is published because the refresh script needs a stable key to SUBSTITUTE VALUES instead of rebuilding rows (CA-9.3), and because a JSON reader that cannot tell two rows apart is a JSON that has to be re-read whole.',
  },
  {
    field: 'competition_id',
    motive:
      'Which of the two published competitions the row belongs to. It is a declared identifier of ours and it is what the screen groups by (CA-11.1). Bounded by `PUBLISHED_COMPETITIONS` below.',
  },
  {
    field: 'competition_name',
    motive:
      'The canonical RFGF name, entire and never abbreviated: it is the heading of the group (CA-11.1). It comes from the declared calendar, which is a HUMAN DECLARATION and not a datum of any source (ADR-017).',
  },
  {
    field: 'round',
    motive:
      '*Jornada* (`dominio.md`). It is the unit of the measurement and of the retention, and it is what tells a reader that this is one matchday and not a season. Declared, not observed.',
  },
  {
    field: 'kickoff',
    motive:
      'The hour the match starts, rounded to the minute. Declared by a person from the calendar published by the RFGF (ADR-017), never derived from a crawled source. In these two competitions the Saturday/Sunday spread is the norm, so an hour with no date is ambiguous (CA-11.5).',
  },
  {
    field: 'home',
    motive:
      'The canonical RFGF name of the home side. NEVER translated, NEVER abbreviated, NEVER truncated (`dominio.md`, ADR-013 §4): in Terceira RFEF there are reserve teams told apart by a single final letter, so `CD Lugo B` cut to `CD Lugo` is two clubs with the same text on screen.',
  },
  {
    field: 'away',
    motive: 'The same, for the away side. Same rule, same motive.',
  },
  {
    field: 'status',
    motive:
      'One of the five states of `dominio.md`. It is half of what a person opens this screen for, and RN-06 keeps its table of transitions closed. Its visible literal comes from `statusesBundle`, shared with the bot and the panel.',
  },
  {
    field: 'home_score',
    motive:
      'The scoreboard. It is the one field of the row that comes from a third party, and it is the whole point of the screen. `null` where the state has none (`scheduled`, `postponed`), which `migrations/0001` already enforces.',
  },
  {
    field: 'away_score',
    motive: 'The other half of the scoreboard. Same rule, same motive.',
  },
  {
    field: 'qualifier',
    motive:
      'How much the scoreboard beside it can be believed (RN-02, RN-03). It comes from `qualifierOf` (`src/decide/qualifier.ts`), NEVER reimplemented, and it is `null` when no `Decision` exists — the absence of a datum IS NOT a qualifier (ADR-027 §6.3). Publishing the scoreboard without it would be publishing a number whose reliability the reader cannot see, against D-6.',
  },
  {
    field: 'last_observed_at',
    motive:
      "The row's clock: the SOURCE's, not the datum's (ADR-027 §4.1). It is the newest `observed_at` of the observations that sustain the live `Decision`, rounded to the minute. `decided_at` in the row would be MISLEADING — the engine does not emit a `Decision` per tick, so it cannot tell «nothing happened» from «nobody looked» — and this one is what says whether that 1-0 is to be believed. It is what makes an honest `Rematado 0-0` of a match nobody could postpone (CA-10.6).",
  },
];

/** The set of published field names, for the enumeration of CA-5.2. */
export const PUBLISHED_FIELD_NAMES: readonly string[] = PUBLISHED_FIELDS.map(
  (entry) => entry.field,
);

/** One published competition, with the motive that puts it in the window. */
export interface PublishedCompetition {
  readonly id: CompetitionId;
  readonly motive: string;
}

/**
 * THE SECOND BOUND, AND IT BOUNDS A DIFFERENT AXIS (ADR-027 §3.b, CA-3.5).
 *
 * `MEASUREMENT_WINDOWS` bounds WHEN; this list bounds WHAT. Without it,
 * loading the declared calendar of a third competition would publish it
 * WITHOUT ANYBODY DECIDING ANYTHING — and a third competition is point 2 of
 * the re-ruling trigger (ADR-027 §3.d), which no test can watch.
 *
 * The identifiers are the ones the source registry already uses
 * (`src/ingest/sources.ts`), and a case asserts that the two lists agree, so
 * they cannot drift. They are written here rather than imported so that the
 * graph of the three public routes does not reach `src/ingest/` and, through
 * it, the exit door of RN-11 (CA-1.4): the screen asks nobody for anything.
 */
export const PUBLISHED_COMPETITIONS: readonly PublishedCompetition[] = [
  {
    id: CompetitionIdSchema.parse('futgal-preferente-g1'),
    motive:
      'Preferente Futgal Grupo 1. One of the two competitions of the spike (EPIC-002): it is the galego half of the question the measurement answers, and its declared calendar is the denominator of the coverage figure.',
  },
  {
    id: CompetitionIdSchema.parse('rfef-tercera-g1'),
    motive:
      'Terceira RFEF Grupo 1. The other half: the national category with a galego group, which is what lets the measurement compare «lo galego» with «lo nacional» in the same matchday.',
  },
];

/** The set of published competition ids. */
export const PUBLISHED_COMPETITION_IDS: readonly CompetitionId[] = PUBLISHED_COMPETITIONS.map(
  (entry) => entry.id,
);

/** True when a competition is one of the two this project publishes. */
export function isPublishedCompetition(id: CompetitionId): boolean {
  return PUBLISHED_COMPETITION_IDS.includes(id);
}

/**
 * An instant as this contract publishes it: ISO 8601 UTC, ROUNDED TO THE
 * MINUTE (`2026-09-06T17:00Z`). No second ever leaves here (CA-8.1).
 */
export const PublishedInstantSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z$/, 'a published instant is minute-rounded UTC');

export type PublishedInstant = z.infer<typeof PublishedInstantSchema>;

/** One row of the board, and EXACTLY the fields of `PUBLISHED_FIELDS`. */
export const BoardRowSchema = z.object({
  match_id: z.string().min(1),
  competition_id: z.string().min(1),
  competition_name: z.string().min(1),
  round: z.int().min(1),
  kickoff: PublishedInstantSchema,
  home: z.string().min(1),
  away: z.string().min(1),
  status: z.enum(MATCH_STATUSES),
  home_score: z.int().min(0).nullable(),
  away_score: z.int().min(0).nullable(),
  /** `null` when no `Decision` exists: the absence of a datum is not one. */
  qualifier: z.enum(MATCH_QUALIFIERS).nullable(),
  last_observed_at: PublishedInstantSchema.nullable(),
});

export type BoardRowPayload = z.infer<typeof BoardRowSchema>;

/**
 * The whole payload.
 *
 * `version` IS DERIVED, NOT A COLUMN (ADR-027 §7.1): it is the newest
 * `decided_at` of the set served, or `null` when the set has no `Decision`.
 * There is no global counter and no version table — a counter is durable
 * shared state, ADR-004 does not give it and ADR-021 §2 avoids it on purpose.
 *
 * DECLARED WITHIN THE CRITERION (ADR-016 §6, CA-7.6): the derived `version`
 * DOES NOT tell apart two snapshots with the same maximum `decided_at` and
 * different content — if the list of matches changed with nothing decided. The
 * `ETag` does, because it is of the body. THE `version` IS INFORMATION FOR
 * WHOEVER READS THE JSON, NOT THE CACHE MECHANISM, and no change detection may
 * be built on it.
 *
 * `matchday_declared` is what tells «there is no matchday declared» apart from
 * «the declared matchday holds no match» (CA-3.3): the first is an operational
 * fault only whoever looks finds out about; the second is information.
 */
export const BoardSnapshotSchema = z.object({
  version: PublishedInstantSchema.nullable(),
  matchday_declared: z.boolean(),
  matches: z.array(BoardRowSchema),
});

export type BoardSnapshot = z.infer<typeof BoardSnapshotSchema>;
