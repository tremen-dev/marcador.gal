/**
 * `npm run calendario:cargar -- <ruta>` (SPEC-010 CA-6, ADR-017 §2).
 *
 * The load of a declared calendar is an ACT OF A PERSON, run from their
 * machine against `DATABASE_URL`: in Vercel there is no disk to load from and
 * no shell to do it in (ADR-004). This is the command that act takes.
 *
 * Order of the three failures, on purpose:
 *
 *   1. the file is read and validated WHOLE before anything else — schema and
 *      kickoff conversion alike — so an invalid file, a kickoff the timezone
 *      skips included, exits 1 naming the row and NO CONNECTION IS OPENED
 *      (CA-1, CA-2, CA-6; F-SPEC-010-10);
 *   2. then the connection string is required — missing, exit 1 with the
 *      message of `MissingDatabaseUrlError`;
 *   3. only then a client is opened, the load runs in one transaction, and the
 *      client is closed whatever happened.
 *
 * `main` receives its I/O injected — environment, streams, client factory,
 * loader — so it is tested without a child process, like `migrate.main`. The
 * entry point that runs under Node is `./cli.ts`.
 *
 * Output is for the operator and is plain text on stdout, English like the
 * other commands of this repository (`db:migrate`, `mirror:*`): it is not the
 * product's interface (D-2 governs what the public sees).
 */
import { MissingDatabaseUrlError, requireDatabaseUrl } from '@/db/client';
import type { Sql } from '@/db/client';
import { loadSchedule } from '@/db/calendar';
import type { LoadResult } from '@/db/calendar';
import type { DeclaredCalendar } from './declared';
import { readCalendarFile } from './declared';
import { InvalidScheduleError } from './schedule';

export interface CommandIo {
  readonly env: NodeJS.ProcessEnv;
  readonly stdout: (line: string) => void;
  readonly stderr: (line: string) => void;
  /** Opens a client for a connection string. `main` closes what it opens. */
  readonly openClient: (url: string) => Sql;
  /** The loader. Defaults to `loadSchedule`; injectable for the tests. */
  readonly load?: (sql: Sql, file: DeclaredCalendar) => Promise<LoadResult>;
}

export const USAGE = 'usage: npm run calendario:cargar -- <calendario/<temporada>/<competition_id>.json>';

function report(result: LoadResult): string[] {
  const lines = [
    `inserted: ${result.inserted.length}`,
    `updated: ${result.updated.length}`,
    `orphans: ${result.orphans.length}`,
  ];
  for (const orphan of result.orphans) lines.push(`  orphan (still in the database): ${orphan}`);
  lines.push(`teams inserted: ${result.teams_inserted}`);
  for (const team of result.teams_renamed) lines.push(`  team renamed: ${team}`);
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
  let file: DeclaredCalendar;
  try {
    file = await readCalendarFile(path);
  } catch (error) {
    if (error instanceof InvalidScheduleError) {
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
    const result = await (io.load ?? loadSchedule)(sql, file);
    for (const line of report(result)) io.stdout(line);
    return 0;
  } catch (error) {
    io.stderr(`load failed, nothing was written: ${describe(error)}`);
    return 1;
  } finally {
    await sql.end();
  }
}
