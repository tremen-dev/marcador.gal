/**
 * CA-7, the half that needs Postgres — `main` with a REAL client: the counts
 * it prints are the counts the load made.
 *
 * Importing `_harness` THROWS without `DATABASE_URL_TEST`: without a real
 * Postgres this half is UNMET, not skipped. The rest of CA-7 is
 * `tests/alias/command.test.ts` (`npm test`).
 */
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { main } from '@/alias/command';
import type { CommandIo } from '@/alias/command';
import { declareCalendar } from '@/calendar/declared';
import { loadSchedule } from '@/db/calendar';
import type { Sql } from '@/db/client';
import {
  aliasCatalogBytes,
  aliasCatalogFixture,
  cloneAliasCatalog,
} from '../fixtures/aliases';
import type { AliasCatalogFixture } from '../fixtures/aliases';
import { calendarBytes, calendarFixture } from '../fixtures/calendar';
import { DATABASE_URL_TEST, connect, resetAndMigrate } from './_harness';

type Mutable<T> = { -readonly [K in keyof T]: Mutable<T[K]> };

let sql: Sql;
let dir: string;

beforeAll(async () => {
  sql = connect();
  await resetAndMigrate(sql);
  // The teams come from the calendar (SPEC-010): the catalogue never declares them.
  await loadSchedule(sql, declareCalendar(calendarBytes(calendarFixture)));
  dir = await mkdtemp(join(tmpdir(), 'alias-db-'));
});

afterAll(async () => {
  await sql.end();
});

interface Run {
  readonly code: number;
  readonly out: string;
  readonly err: string;
}

async function runMain(path: string): Promise<Run> {
  const out: string[] = [];
  const err: string[] = [];
  const io: CommandIo = {
    env: { ...process.env, DATABASE_URL: DATABASE_URL_TEST },
    stdout: (line) => out.push(line),
    stderr: (line) => err.push(line),
    // The real client. `main` closes what it opens.
    openClient: connect,
  };
  const code = await main([path], io);
  return { code, out: out.join('\n'), err: err.join('\n') };
}

describe('CA-7 — main against the real database', () => {
  test('the first load prints 6 inserted, 0 removed and the load id, and exits 0', async () => {
    const file = join(dir, 'primeiro.json');
    await writeFile(file, aliasCatalogBytes(aliasCatalogFixture));

    const run = await runMain(file);

    expect(run.err).toBe('');
    expect(run.code).toBe(0);
    expect(run.out).toMatch(/inserted:\s*6/);
    expect(run.out).toMatch(/removed:\s*0/);

    const loads = await sql<{ id: number }[]>`select id from alias_loads order by id`;
    expect(loads).toHaveLength(1);
    expect(run.out).toContain(String(loads[0]?.id));
  });

  test('a second load with one entry retired prints it by spelling: it stopped resolving', async () => {
    const edited = cloneAliasCatalog(aliasCatalogFixture) as Mutable<AliasCatalogFixture>;
    edited.aliases = edited.aliases.filter((entry) => entry.alias !== 'Ourense');
    const file = join(dir, 'segundo.json');
    await writeFile(file, aliasCatalogBytes(edited));

    const run = await runMain(file);

    expect(run.code).toBe(0);
    expect(run.out).toMatch(/inserted:\s*0/);
    expect(run.out).toMatch(/removed:\s*1/);
    expect(run.out).toContain('"Ourense"');
    expect(await sql`select id from alias_loads`).toHaveLength(2);
  });

  test('a team the calendar never declared exits 1 naming it, and writes no load row', async () => {
    const ghost = cloneAliasCatalog(aliasCatalogFixture) as Mutable<AliasCatalogFixture>;
    ghost.aliases.push({ alias: 'Pantasma FC', team_id: 'cf-pantasma' });
    const file = join(dir, 'pantasma.json');
    await writeFile(file, aliasCatalogBytes(ghost));

    const run = await runMain(file);

    expect(run.code).toBe(1);
    expect(run.err).toContain('cf-pantasma');
    expect(run.err).toMatch(/load failed, nothing was written/);
    expect(await sql`select id from alias_loads`).toHaveLength(2);
  });
});
