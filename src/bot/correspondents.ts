/**
 * The two halves of who a correspondent is (ADR-022 §2, SPEC-015 CA-2).
 *
 * THE CATALOGUE IS VERSIONED. THE MAPPING NEVER IS.
 *
 * `corresponsais/<temporada>.json` holds `correspondent_id`, the competitions
 * that person covers, the date of their alta and whether they are active. No
 * `telegram_user_id`, no name, no contact. The mapping
 * `telegram_user_id → correspondent_id` lives in the environment variable
 * `TELEGRAM_CORRESPONDENTS` and NOWHERE ELSE — not in Postgres, not in a file
 * of this repository.
 *
 * It is the reasoning ADR-009 §3 wrote, in those words, for third-party HTML —
 * *git no se purga, se reescribe*, and therefore «sin excepción, porque su
 * incumplimiento no es reversible» — applied to a worse datum: a transversal
 * personal identifier, stable for life, shared with every bot that person uses,
 * in a PUBLIC repository. The rule does not change if the repository goes
 * private: a private one is made public with one click, and a deletion request
 * would still force rewriting history.
 *
 * WHY THIS MODULE IMPORTS ONLY `zod` (CA-2.5). The criterion is not «nobody
 * greps for `readFile` here»: it is that THE MAPPING LOADER HAS NO CODE PATH
 * THAT READS A FILE OF THE REPOSITORY, asserted over its import graph. So the
 * reading of the catalogue file lives in `./catalog.ts`, which imports THIS
 * one and not the other way round. Nothing reachable from here touches
 * `node:fs`.
 *
 * AND THE SHAPE OF THE IDENTIFIER IS A BARRIER, not a convention (CA-2.8):
 * `corresponsal-\d+` and nothing else. `corresponsal-xove` or
 * `corresponsal-alberto`, in a public repository and crossed with the declared
 * calendar, identify a person in a small comarca. The zod schema refuses the
 * whole file, not the row: a catalogue half-loaded is a catalogue nobody can
 * reason about (ADR-018 §3, all-or-nothing, borrowed).
 */
import { z } from 'zod';

/** `corresponsal-01`, `corresponsal-02`. A local token with nothing inside. */
export const CORRESPONDENT_ID_PATTERN = /^corresponsal-\d+$/;

export const CorrespondentIdSchema = z
  .string()
  .regex(CORRESPONDENT_ID_PATTERN)
  .brand<'CorrespondentId'>();

export type CorrespondentId = z.infer<typeof CorrespondentIdSchema>;

export const CorrespondentSchema = z
  .object({
    correspondent_id: CorrespondentIdSchema,
    /** The competitions this person covers. Nothing outside them is a candidate. */
    competitions: z.array(z.string().min(1)).min(1),
    /** ISO date of the alta, for the record. Not an instant: a day. */
    alta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    activo: z.boolean(),
  })
  .strict()
  .readonly();

export type Correspondent = z.infer<typeof CorrespondentSchema>;

/**
 * The catalogue. BORN EMPTY, like the list of declared matchdays: with nothing
 * here the bot recognises nobody, which is half of «SPEC-015 entrega un bot
 * apagado» (ADR-022 §7).
 */
export const CorrespondentCatalogSchema = z
  .object({
    season: z.string().min(1),
    correspondents: z.array(CorrespondentSchema),
  })
  .strict()
  .readonly();

export type CorrespondentCatalog = z.infer<typeof CorrespondentCatalogSchema>;

/** Parses a catalogue. Refuses the WHOLE file if one row is malformed. */
export function parseCatalog(value: unknown): CorrespondentCatalog {
  return CorrespondentCatalogSchema.parse(value);
}

/** The entry of a `correspondent_id`, or `null`. */
export function correspondentOf(
  catalog: CorrespondentCatalog,
  id: CorrespondentId,
): Correspondent | null {
  return catalog.correspondents.find((entry) => entry.correspondent_id === id) ?? null;
}

/** The mapping, as it is read from the environment. */
export type CorrespondentMap = ReadonlyMap<string, CorrespondentId>;

/** The name of the variable. Written once, so the frontier has one thing to watch. */
export const CORRESPONDENT_MAP_VARIABLE = 'TELEGRAM_CORRESPONDENTS';

const MapSchema = z.record(z.string().regex(/^\d+$/), CorrespondentIdSchema);

/**
 * Reads the mapping from the environment. An absent or unreadable value is an
 * EMPTY MAP and never an exception: a deployment with nothing configured
 * recognises nobody, which is the state the bot is born in. It is the same
 * closed failure the empty list of measurement windows gives the tick.
 */
export function readCorrespondentMap(
  env: Readonly<Record<string, string | undefined>>,
): CorrespondentMap {
  const raw = env[CORRESPONDENT_MAP_VARIABLE];
  if (typeof raw !== 'string' || raw.trim().length === 0) return new Map();

  const parsed = MapSchema.safeParse(jsonOrNull(raw));
  if (!parsed.success) return new Map();

  return new Map(Object.entries(parsed.data));
}

function jsonOrNull(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * The `correspondent_id` behind a Telegram sender, or `null`.
 *
 * `null` is the answer for a sender that is not mapped AND for one that is
 * mapped but not active in the catalogue: the caller cannot tell them apart,
 * and neither can the person (CA-2.2).
 */
export function resolveCorrespondent(
  map: CorrespondentMap,
  catalog: CorrespondentCatalog,
  telegramUserId: number,
): Correspondent | null {
  const id = map.get(`${telegramUserId}`);
  if (id === undefined) return null;

  const entry = correspondentOf(catalog, id);
  if (entry === null || !entry.activo) return null;
  return entry;
}
