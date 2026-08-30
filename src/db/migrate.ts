/**
 * Migration runner (ADR-006): numbered SQL files, applied in lexicographic
 * order, one transaction per file, one row per applied version. No ORM, no
 * generated migrations, and no automatic rollback — undoing is done by writing
 * the next migration.
 */
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { createClient, requireDatabaseUrl } from './client.ts';
import type { Sql } from './client.ts';

/** Default location of the migration files, relative to the repository root. */
export const MIGRATIONS_DIR = fileURLToPath(new URL('../../migrations', import.meta.url));

const FILE_PATTERN = /^(\d{4})_[a-z0-9_]+\.sql$/;

export interface Migration {
  readonly version: string;
  readonly file: string;
}

export async function readMigrations(dir: string = MIGRATIONS_DIR): Promise<Migration[]> {
  const files = await readdir(dir);

  return files
    .filter((file) => FILE_PATTERN.test(file))
    .sort()
    .map((file) => {
      const version = FILE_PATTERN.exec(file)?.[1];
      if (version === undefined) throw new Error(`unreachable: ${file} matched but has no version`);
      return { version, file };
    });
}

async function ensureLedger(sql: Sql): Promise<void> {
  await sql`
    create table if not exists schema_migrations (
      version    text        primary key,
      applied_at timestamptz not null default now()
    )
  `;
}

/**
 * Applies the pending migrations and returns the versions it applied. Running
 * it again applies nothing and returns an empty array (CA-13).
 */
export async function migrate(sql: Sql, dir: string = MIGRATIONS_DIR): Promise<string[]> {
  await ensureLedger(sql);

  const applied = new Set(
    (await sql<{ version: string }[]>`select version from schema_migrations`).map(
      (row) => row.version,
    ),
  );

  const pending = (await readMigrations(dir)).filter(
    (migration) => !applied.has(migration.version),
  );

  for (const migration of pending) {
    const statements = await readFile(join(dir, migration.file), 'utf8');

    await sql.begin(async (tx) => {
      await tx.unsafe(statements);
      await tx`insert into schema_migrations (version) values (${migration.version})`;
    });
  }

  return pending.map((migration) => migration.version);
}

/** `npm run db:migrate`. */
export async function main(): Promise<void> {
  const sql = createClient(requireDatabaseUrl());
  try {
    const applied = await migrate(sql);
    if (applied.length === 0) {
      process.stdout.write('schema is up to date; nothing applied\n');
    } else {
      process.stdout.write(`applied: ${applied.join(', ')}\n`);
    }
  } finally {
    await sql.end();
  }
}
