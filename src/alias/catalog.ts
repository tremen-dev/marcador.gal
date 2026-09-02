/**
 * The shape of a declared alias catalogue (SPEC-011 §2, ADR-018 §1).
 *
 * A declared alias catalogue is a JSON file a PERSON writes, one per source
 * and season: each spelling that source uses for a team, tied to the canonical
 * `TeamId` of the declared calendar, plus who declared it and when. DECLARING
 * IS CONFIRMING (RN-09, ADR-018 §1): every entry lands in `team_aliases` as
 * `confirmed`. No LLM call is part of this mechanism, and nothing here touches
 * the network (RN-11 is not exercised).
 *
 * This schema is the contract. The whole file is validated before anything is
 * touched, and what is wrong is rejected NAMING THE ENTRY OR THE FIELD,
 * because the reader is the person who typed it (CA-1).
 *
 * WHAT ONLY THIS SCHEMA GUARANTEES, said here as ADR-016 §6 asks: that no two
 * entries collide AFTER `normalizeAlias`. The primary key of `team_aliases`
 * compares exact text, so «UD Ourense» and «UD  Ourense» are two rows for the
 * database and ONE thing for the resolver — and they could point at different
 * teams. A row inserted by hand through SQL can violate this; a declared
 * catalogue cannot (ADR-018 §4).
 *
 * Case and accents are SIGNIFICANT (SPEC-001 CA-5, gate 2026-08-29): «CELTA B»
 * and «Celta B» are two entries. This file inherits that decision.
 */
import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { sha256Hex } from '@/calendar/declared';
import { KEBAB_CASE, RFGF_SEASON } from '@/calendar/schedule';
import { normalizeAlias } from '@/model/team';

export const AliasEntrySchema = z.object({
  /** The spelling exactly as the source writes it. Never normalised on disk. */
  alias: z.string().min(1, 'an alias cannot be empty'),
  team_id: z
    .string()
    .regex(KEBAB_CASE, 'a team id has to be kebab-case (`ud-ourense`), not this'),
});

const CatalogShape = z.object({
  /**
   * Kebab-case, and DELIBERATELY not validated against the ingest registry
   * (`src/ingest/sources.ts`): the correspondent also writes names, and its
   * source does not live in that registry (SPEC-011 §2).
   */
  source: z
    .string()
    .regex(KEBAB_CASE, 'a source id has to be kebab-case (`ceroacero`), not this'),
  season: z
    .string()
    .regex(RFGF_SEASON, 'season has to be written as the RFGF does, YYYY/YY (2026/27)'),
  /** A person. The empty string is the shape «nobody declared it» takes. */
  declared_by: z.string().min(1, 'declared_by has to name a person; the empty string is nobody'),
  /** An ISO 8601 instant, offset allowed here; normalised to `Z` when loaded. */
  declared_at: z.iso.datetime({ offset: true }),
  source_note: z.string().min(1).optional(),
  aliases: z
    .array(AliasEntrySchema)
    .min(
      1,
      'aliases has to hold at least one entry: the empty list would empty the ' +
        'catalogue, which is a different act and today has no spec (ADR-018)',
    ),
});

type CatalogShape = z.infer<typeof CatalogShape>;

/**
 * The check no entry can make on its own: no two entries may collide after the
 * one normalisation of SPEC-001 CA-5 (trim, collapse of internal whitespace,
 * NFC). This covers the exact duplicate, the internal double space and the
 * composed/decomposed Unicode pair alike, naming both spellings.
 */
function crossChecks(catalog: CatalogShape, ctx: z.RefinementCtx): void {
  const seen = new Map<string, string>();
  catalog.aliases.forEach((entry, index) => {
    const normalized = normalizeAlias(entry.alias);
    const first = seen.get(normalized);
    if (first !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['aliases', index, 'alias'],
        message:
          `alias ${JSON.stringify(entry.alias)} collides with alias ` +
          `${JSON.stringify(first)} after normalisation: one spelling has exactly one entry`,
      });
      return;
    }
    seen.set(normalized, entry.alias);
  });
}

/** The contract of a declared alias catalogue. Parse with `parseAliasCatalog`. */
export const AliasCatalogSchema = CatalogShape.superRefine(crossChecks);

export type AliasCatalog = z.infer<typeof AliasCatalogSchema>;
export type AliasEntry = z.infer<typeof AliasEntrySchema>;

/** One thing wrong with the file, with the path to it. */
export interface CatalogIssue {
  readonly path: string;
  readonly message: string;
}

/**
 * Thrown when a declared alias catalogue is not one. Every issue is a line of
 * the message, with its path, so the person who typed the file can find the
 * entry.
 */
export class InvalidCatalogError extends Error {
  override readonly name = 'InvalidCatalogError';
  readonly issues: readonly CatalogIssue[];

  constructor(issues: readonly CatalogIssue[]) {
    super(
      [
        'the declared alias catalogue is invalid:',
        ...issues.map((issue) => `  ${issue.path || '(file)'}: ${issue.message}`),
      ].join('\n'),
    );
    this.issues = issues;
  }
}

function valueAt(input: unknown, path: readonly PropertyKey[]): unknown {
  let current: unknown = input;
  for (const key of path) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<PropertyKey, unknown>)[key];
  }
  return current;
}

/**
 * Where in the FILE an issue is, in the words of the person who wrote it: the
 * entry's own spelling, not the array index.
 */
function locate(input: unknown, path: readonly PropertyKey[]): string {
  const [head, index] = path;
  if (head === 'aliases' && typeof index === 'number') {
    const alias = valueAt(input, ['aliases', index, 'alias']);
    return typeof alias === 'string' && alias.length > 0
      ? `entry ${JSON.stringify(alias)}`
      : `entry #${index + 1}`;
  }
  return '';
}

/**
 * A declared alias catalogue as read from a file: the bytes, their digest and
 * what they say. The digest is what `alias_loads.file_digest` records (CA-3).
 */
export interface DeclaredAliasCatalog {
  readonly bytes: Uint8Array;
  /** sha256 of the bytes, hex — `sha256Hex` of SPEC-010, reused. */
  readonly digest: string;
  readonly catalog: AliasCatalog;
}

/**
 * Validates the bytes of a declared alias catalogue, WHOLE, and keeps their
 * digest. The loader receives this, so nothing invalid ever reaches a
 * connection (CA-7, the same order as `declareCalendar`).
 */
export function declareAliasCatalog(bytes: Uint8Array): DeclaredAliasCatalog {
  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder('utf8', { fatal: true }).decode(bytes));
  } catch (error) {
    throw new InvalidCatalogError([
      {
        path: '',
        message: `the file is not JSON: ${error instanceof Error ? error.message : String(error)}`,
      },
    ]);
  }
  return { bytes, digest: sha256Hex(bytes), catalog: parseAliasCatalog(json) };
}

/** Reads and validates a declared alias catalogue from disk. The loader's only I/O. */
export async function readAliasCatalogFile(path: string): Promise<DeclaredAliasCatalog> {
  return declareAliasCatalog(await readFile(path));
}

/**
 * Validates a declared alias catalogue WHOLE. Nothing else looks at the file
 * before this has said yes.
 */
export function parseAliasCatalog(input: unknown): AliasCatalog {
  const result = AliasCatalogSchema.safeParse(input);
  if (result.success) return result.data;

  throw new InvalidCatalogError(
    result.error.issues.map((issue) => {
      const where = locate(input, issue.path);
      const value = valueAt(input, issue.path);
      const got =
        typeof value === 'string' || typeof value === 'number'
          ? ` (got ${JSON.stringify(value)})`
          : '';
      // The cross checks already name both spellings in their own message.
      const prefix = where !== '' && issue.code !== 'custom' ? `${where}: ` : '';
      return {
        path: issue.path.map(String).join('.'),
        message: `${prefix}${issue.message}${got}`,
      };
    }),
  );
}
