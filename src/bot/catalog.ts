/**
 * Reading the declared catalogue of correspondents from the repository
 * (ADR-022 §2, SPEC-015 CA-2.8).
 *
 * IT IS A SEPARATE MODULE FROM `./correspondents.ts` ON PURPOSE, and the
 * separation is a criterion and not tidiness: CA-2.5 asks that the loader of
 * the MAPPING have no code path that reads a file of the repository, asserted
 * over its IMPORT GRAPH and not with a `grep`. Reading the catalogue is
 * legitimate — the catalogue is the half that IS versioned — so the reading
 * lives here, and this module imports `./correspondents.ts`, never the reverse.
 *
 * The catalogue is BORN EMPTY (`corresponsais/2026-27.json`). Giving somebody
 * an alta or a baja therefore costs a deployment, which is the price ADR-022
 * accepted for not giving this the full shape of ADR-018 with one correspondent
 * (F-SPEC-015-3, trigger: the second correspondent). The IMMEDIATE baja does
 * not cost a deployment: it is a durable exclusion row (CA-14.5).
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parseCatalog } from './correspondents';
import type { CorrespondentCatalog } from './correspondents';

/** Where the declared catalogues live, relative to the repository root. */
export const CATALOG_DIR = fileURLToPath(new URL('../../corresponsais', import.meta.url));

/** `2026/27` is a season as the RFGF writes it; the file is `2026-27.json`. */
export function catalogFileName(season: string): string {
  return `${season.replaceAll('/', '-')}.json`;
}

/**
 * The catalogue of a season. Parsed with zod, which REFUSES THE WHOLE FILE if
 * one `correspondent_id` does not match `corresponsal-\d+`.
 */
export async function loadCatalog(
  season: string,
  dir: string = CATALOG_DIR,
): Promise<CorrespondentCatalog> {
  const raw = await readFile(join(dir, catalogFileName(season)), 'utf8');
  return parseCatalog(JSON.parse(raw));
}

/** A catalogue with nobody in it. What a deployment with no file would mean. */
export function emptyCatalog(season: string): CorrespondentCatalog {
  return parseCatalog({ season, correspondents: [] });
}
