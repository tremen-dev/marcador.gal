/**
 * CA-6, the half that needs Postgres — `main` with a REAL client: the counts
 * it prints are the counts the load made.
 *
 * Importing `_harness` THROWS without `DATABASE_URL_TEST`: without a real
 * Postgres this half is UNMET, not skipped. The rest of CA-6 is
 * `tests/calendar/command.test.ts` (`npm test`).
 */
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { main } from '@/calendar/command';
import type { CommandIo } from '@/calendar/command';
import type { Sql } from '@/db/client';
import { calendarBytes, calendarFixture, cloneCalendar } from '../fixtures/calendar';
import type { CalendarFixture } from '../fixtures/calendar';
import { DATABASE_URL_TEST, connect, resetAndMigrate } from './_harness';

let sql: Sql;
let dir: string;

beforeAll(async () => {
  sql = connect();
  await resetAndMigrate(sql);
  dir = await mkdtemp(join(tmpdir(), 'calendario-db-'));
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

describe('CA-6 — main against the real database', () => {
  test('the first load prints 4 inserted, 0 updated, 0 orphans and the load id, and exits 0', async () => {
    const file = join(dir, 'primeira.json');
    await writeFile(file, calendarBytes(calendarFixture));

    const run = await runMain(file);

    expect(run.err).toBe('');
    expect(run.code).toBe(0);
    expect(run.out).toMatch(/inserted:\s*4/);
    expect(run.out).toMatch(/updated:\s*0/);
    expect(run.out).toMatch(/orphans:\s*0/);

    const loads = await sql<{ id: number }[]>`select id from calendar_loads order by id`;
    expect(loads).toHaveLength(1);
    expect(run.out).toContain(String(loads[0]?.id));
  });

  test('a second load with one match moved and one dropped prints 0 / 1 / 1 and names the orphan', async () => {
    const changed = cloneCalendar(calendarFixture) as {
      -readonly [K in keyof CalendarFixture]: CalendarFixture[K];
    };
    const rounds = structuredClone(changed.rounds) as {
      round: number;
      matches: { home_id: string; away_id: string; kickoff: string; venue: string | null }[];
    }[];
    rounds[0]!.matches[0]!.kickoff = '2026-09-07 12:00';
    rounds[1]!.matches.splice(0, 1);
    changed.rounds = rounds;
    const file = join(dir, 'segunda.json');
    await writeFile(file, calendarBytes(changed));

    const run = await runMain(file);

    expect(run.code).toBe(0);
    expect(run.out).toMatch(/inserted:\s*0/);
    expect(run.out).toMatch(/updated:\s*1/);
    expect(run.out).toMatch(/orphans:\s*1/);
    expect(run.out).toContain('futgal-preferente-g1-2026-27-j2-rc-celta-b-cd-exemplo');
    expect(await sql`select id from calendar_loads`).toHaveLength(2);
  });

  test('a competition redefined by the file exits 1 with the error, and writes no load row', async () => {
    const renamed = { ...calendarFixture, competition: { ...calendarFixture.competition, name: 'Outra' } };
    const file = join(dir, 'renomeada.json');
    await writeFile(file, calendarBytes(renamed));

    const run = await runMain(file);

    expect(run.code).toBe(1);
    expect(run.err).toMatch(/already exists/);
    expect(await sql`select id from calendar_loads`).toHaveLength(2);
  });
});
