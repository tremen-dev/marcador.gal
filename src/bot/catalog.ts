/**
 * The declared catalogue of correspondents, RESOLVED AT BUILD TIME
 * (ADR-022 §2, SPEC-015 CA-2.8, SPEC-016 CA-1 and CA-2).
 *
 * IT IS A SEPARATE MODULE FROM `./correspondents.ts` ON PURPOSE, and the
 * separation is a criterion and not tidiness: SPEC-015 CA-2.5 asks that the
 * loader of the MAPPING have no code path that reads a file of the repository,
 * asserted over its IMPORT GRAPH and not with a `grep`. This module imports
 * `./correspondents.ts`, never the reverse.
 *
 * WHY A STATIC IMPORT AND NOT A FILE READ (SPEC-016). ADR-022 §2 already said
 * «validado con zod e importado como módulo»; SPEC-015 shipped a path
 * computation instead, and it broke the deployment. Under Node the expression
 * was ordinary and the whole suite stayed green; the bundler read it as a
 * reference to a resource to resolve at build time and refused to compile. A
 * static import removes two layers at once: nothing to resolve at run time, and
 * nothing that has to be traced into the serverless bundle.
 *
 * WHY A CLOSED REGISTRY AND NOT A NAME COMPUTED FROM THE SEASON. A static
 * import pins the season at build time; that cannot be avoided. What can be
 * avoided is that it break silently, so the season → catalogue table is
 * written out, one entry per file, and three cases hold it: the key equals the
 * `season` inside its own JSON, `ACTIVE_SEASON` is one of the keys, and every
 * key has its file. Adding a season is one import, one entry and a deployment,
 * which is the price ADR-022 §2 already accepted for an alta.
 *
 * AND AN UNDECLARED SEASON THROWS, it never yields an empty catalogue. The bot
 * is delivered switched off and an EMPTY CATALOGUE IS THE NORMAL CONFIGURATION
 * (ADR-022 §7), so an empty one by mistake would be indistinguishable from
 * correct operation. Closed and noisy, not silent.
 */
import catalog2026_27 from '../../corresponsais/2026-27.json' with { type: 'json' };
import { parseCatalog } from './correspondents';
import type { CorrespondentCatalog } from './correspondents';

/** Season → the catalogue bundled for it. Unparsed: `loadCatalog` validates. */
export type DeclaredCatalogs = ReadonlyMap<string, unknown>;

/**
 * THE CLOSED REGISTRY. One entry per file of `corresponsais/`, no more and no
 * fewer — a case asserts both directions against the directory.
 *
 * A `Map` and not a plain object, for two reasons that are the same reason: no
 * inherited key can ever answer a lookup (`'toString'` is not a season), and
 * `Map` is a declared global of the capability frontier (SPEC-009 CA-1) while
 * `Object.hasOwn` and `Object.keys` are not in its declared surface. Staying
 * inside the frontier beats widening it for a lookup.
 */
export const SEASON_CATALOGS: DeclaredCatalogs = new Map<string, unknown>([
  ['2026/27', catalog2026_27],
]);

/** A season that nobody declared. Distinguishable on purpose. */
export class UndeclaredSeasonError extends Error {
  constructor(
    readonly season: string,
    readonly declared: readonly string[],
  ) {
    // `.toString()` on the array, and not the obvious helper: SPEC-016 CA-1.1
    // asks that no path arithmetic survive in this module, and the check is a
    // blunt one over the source. The comma-separated form is the same.
    super(`undeclared season '${season}'; declared: ${declared.toString()}`);
    this.name = 'UndeclaredSeasonError';
  }
}

/** `2026/27` is a season as the RFGF writes it; the file is `2026-27.json`. */
export function catalogFileName(season: string): string {
  return `${season.replaceAll('/', '-')}.json`;
}

/**
 * The catalogue of a season. SYNCHRONOUS: there is no longer any I/O to wait
 * for. Parsed with zod, which REFUSES THE WHOLE FILE if one `correspondent_id`
 * does not match `corresponsal-\d+`.
 *
 * The second parameter is the same seam the file-reading version had, moved
 * from a directory to the registry itself; it is what lets a case exercise the
 * all-or-nothing with a synthetic catalogue.
 */
export function loadCatalog(
  season: string,
  catalogs: DeclaredCatalogs = SEASON_CATALOGS,
): CorrespondentCatalog {
  if (!catalogs.has(season)) {
    throw new UndeclaredSeasonError(season, [...catalogs.keys()]);
  }
  return parseCatalog(catalogs.get(season));
}

/** A catalogue with nobody in it. Built on purpose, never a failure path. */
export function emptyCatalog(season: string): CorrespondentCatalog {
  return parseCatalog({ season, correspondents: [] });
}
