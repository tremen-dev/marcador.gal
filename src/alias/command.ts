/**
 * `npm run alias:cargar -- <ruta>` (SPEC-011 CA-7, ADR-018 §2).
 *
 * The load of a declared alias catalogue is an ACT OF A PERSON, run from
 * their machine against `DATABASE_URL`: in Vercel there is no disk to load
 * from and no shell to do it in (ADR-004). This is the command that act
 * takes, with the same form as `src/calendar/command.ts`.
 *
 * Order of the three failures, on purpose:
 *
 *   1. the file is read and validated WHOLE before anything else, so an
 *      invalid file exits 1 naming the entry and NO CONNECTION IS OPENED;
 *   2. then the connection string is required — missing, exit 1 with the
 *      message of `MissingDatabaseUrlError`;
 *   3. only then a client is opened, the load runs in one transaction, and
 *      the client is closed whatever happened.
 *
 * `main` receives its I/O injected — environment, streams, client factory,
 * loader — so it is tested without a child process. The entry point that runs
 * under Node is `./cli.ts`.
 *
 * Output is for the operator and is plain text on stdout, English like the
 * other commands of this repository (`db:migrate`, `calendario:cargar`,
 * `mirror:*`): it is not the product's interface (D-2 governs what the public
 * sees). The language question is already open for ALL commands at once as
 * F-SPEC-010-9; this command follows the house form and falls under the same
 * pending ruling.
 */
import { InvalidCatalogError, readAliasCatalogFile } from './catalog';
import type { DeclaredAliasCatalog } from './catalog';
import { loadAliasCatalog } from '@/db/aliases';
import type { AliasLoadResult } from '@/db/aliases';
import { MissingDatabaseUrlError, requireDatabaseUrl } from '@/db/client';
import type { Sql } from '@/db/client';

export interface CommandIo {
  readonly env: NodeJS.ProcessEnv;
  readonly stdout: (line: string) => void;
  readonly stderr: (line: string) => void;
  /** Opens a client for a connection string. `main` closes what it opens. */
  readonly openClient: (url: string) => Sql;
  /** The loader. Defaults to `loadAliasCatalog`; injectable for the tests. */
  readonly load?: (sql: Sql, file: DeclaredAliasCatalog) => Promise<AliasLoadResult>;
}

export const USAGE = 'usage: npm run alias:cargar -- <alias/<temporada>/<source_id>.json>';

function report(result: AliasLoadResult): string[] {
  const lines = [`inserted: ${result.inserted.length}`];
  for (const entry of result.inserted) {
    lines.push(`  inserted: ${JSON.stringify(entry.alias)} -> ${entry.team_id}`);
  }
  lines.push(`removed: ${result.removed.length}`);
  // A removed entry STOPPED RESOLVING with this load (ADR-018 §2): the
  // operator has to see which spelling that was.
  for (const entry of result.removed) {
    lines.push(`  removed (no longer resolves): ${JSON.stringify(entry.alias)} -> ${entry.team_id}`);
  }
  lines.push(`load id: ${result.load_id}`);
  return lines;
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Exit code: 0 loaded, 1 anything else. */
export async function main(argv: readonly string[], io: CommandIo): Promise<number> {
  const [path] = argv;
  if (path === undefined) {
    io.stderr(USAGE);
    return 1;
  }

  // 1. The file, whole, before touching anything.
  let file: DeclaredAliasCatalog;
  try {
    file = await readAliasCatalogFile(path);
  } catch (error) {
    if (error instanceof InvalidCatalogError) {
      io.stderr(error.message);
    } else {
      io.stderr(`cannot read ${path}: ${describe(error)}`);
    }
    return 1;
  }

  // 2. The connection string.
  let url: string;
  try {
    url = requireDatabaseUrl(io.env);
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      io.stderr(error.message);
      return 1;
    }
    throw error;
  }

  // 3. The load, and the client closed whatever happens.
  const sql = io.openClient(url);
  try {
    const result = await (io.load ?? loadAliasCatalog)(sql, file);
    for (const line of report(result)) io.stdout(line);
    return 0;
  } catch (error) {
    io.stderr(`load failed, nothing was written: ${describe(error)}`);
    return 1;
  } finally {
    await sql.end();
  }
}
