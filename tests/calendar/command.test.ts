/**
 * CA-6 — the CLI loads a file against `DATABASE_URL`, counts what it did, and
 * fails clearly.
 *
 * `main` receives its I/O injected — the environment, the two streams, the
 * client factory and the loader — so the command is tested here WITHOUT a
 * child process and without a database (`npm test`), like `migrate.main`. The
 * half that needs Postgres (a real load through `main`) is
 * `tests/db/cli.test.ts`. The two cases at the end DO spawn Node on
 * `src/calendar/cli.ts`: the entry point runs under Node, not under vitest,
 * and Node does not resolve `@/…` on its own (F-SPEC-002-V4) — a CLI that is
 * green in vitest and does not start is a closed door.
 */
import { execFile } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { beforeAll, describe, expect, test } from 'vitest';
import { main } from '@/calendar/command';
import type { CommandIo } from '@/calendar/command';
import type { LoadResult } from '@/db/calendar';
import type { Sql } from '@/db/client';
import { calendarBytes, calendarFixture, cloneCalendar } from '../fixtures/calendar';
import type { CalendarFixture } from '../fixtures/calendar';

const run = promisify(execFile);
const CLI = join(process.cwd(), 'src/calendar/cli.ts');

let dir: string;
let validFile: string;
let invalidFile: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'calendario-'));
  validFile = join(dir, 'valido.json');
  invalidFile = join(dir, 'invalido.json');
  await writeFile(validFile, calendarBytes(calendarFixture));

  const broken = cloneCalendar(calendarFixture) as { -readonly [K in keyof CalendarFixture]: CalendarFixture[K] };
  const rounds = structuredClone(broken.rounds) as {
    round: number;
    matches: { home_id: string; away_id: string; kickoff: string; venue: string | null }[];
  }[];
  rounds[0]!.matches[0]!.home_id = 'club-fantasma';
  broken.rounds = rounds;
  await writeFile(invalidFile, calendarBytes(broken));
});

interface Harness {
  readonly io: CommandIo;
  readonly out: string[];
  readonly err: string[];
  readonly opened: string[];
  readonly ended: () => number;
}

function harness(overrides: Partial<CommandIo> = {}, env: Record<string, string> = {}): Harness {
  const out: string[] = [];
  const err: string[] = [];
  const opened: string[] = [];
  let ended = 0;
  const fakeSql = { end: async () => { ended += 1; } } as unknown as Sql;
  const io: CommandIo = {
    // Next's types demand NODE_ENV on ProcessEnv; the command reads only DATABASE_URL.
    env: env as NodeJS.ProcessEnv,
    stdout: (line) => out.push(line),
    stderr: (line) => err.push(line),
    openClient: (url) => {
      opened.push(url);
      return fakeSql;
    },
    load: () => Promise.reject(new Error('the test did not stub the loader')),
    ...overrides,
  };
  return { io, out, err, opened, ended: () => ended };
}

const RESULT: LoadResult = {
  inserted: ['a', 'b'] as never,
  updated: ['c'] as never,
  orphans: [] as never,
  teams_inserted: 4,
  teams_renamed: [],
  load_id: 7,
};

describe('CA-6 — main, without a child process', () => {
  test('a valid file: the counts and the load id go to stdout, exit 0, the client is closed', async () => {
    const h = harness(
      { load: () => Promise.resolve(RESULT) },
      { DATABASE_URL: 'postgres://example.invalid/marcador' },
    );

    const code = await main([validFile], h.io);

    expect(code).toBe(0);
    expect(h.opened).toEqual(['postgres://example.invalid/marcador']);
    expect(h.out.join('\n')).toMatch(/inserted:\s*2/);
    expect(h.out.join('\n')).toMatch(/updated:\s*1/);
    expect(h.out.join('\n')).toMatch(/orphans:\s*0/);
    expect(h.out.join('\n')).toMatch(/load(_id| id)?:?\s*#?7/);
    expect(h.err).toEqual([]);
    expect(h.ended()).toBe(1);
  });

  test('orphans are listed by id, so the operator sees WHICH matches the file forgot', async () => {
    const h = harness(
      { load: () => Promise.resolve({ ...RESULT, orphans: ['futgal-x-j1-a-b'] as never }) },
      { DATABASE_URL: 'postgres://example.invalid/marcador' },
    );

    await main([validFile], h.io);

    expect(h.out.join('\n')).toMatch(/orphans:\s*1/);
    expect(h.out.join('\n')).toContain('futgal-x-j1-a-b');
  });

  test('an invalid file: the CA-1 error naming the row on stderr, exit 1, NO connection opened', async () => {
    const h = harness({}, { DATABASE_URL: 'postgres://example.invalid/marcador' });

    const code = await main([invalidFile], h.io);

    expect(code).toBe(1);
    expect(h.opened).toEqual([]);
    expect(h.err.join('\n')).toMatch(/round 1/);
    expect(h.err.join('\n')).toMatch(/club-fantasma/);
    expect(h.err.join('\n')).toMatch(/not declared in teams/);
    expect(h.out).toEqual([]);
  });

  test('a file that does not exist: exit 1, the path on stderr, no connection', async () => {
    const h = harness({}, { DATABASE_URL: 'postgres://example.invalid/marcador' });

    const code = await main([join(dir, 'non-existe.json')], h.io);

    expect(code).toBe(1);
    expect(h.opened).toEqual([]);
    expect(h.err.join('\n')).toContain('non-existe.json');
  });

  test('without DATABASE_URL: exit 1 with the MissingDatabaseUrlError message, no connection', async () => {
    const h = harness({}, {});

    const code = await main([validFile], h.io);

    expect(code).toBe(1);
    expect(h.opened).toEqual([]);
    expect(h.err.join('\n')).toMatch(/DATABASE_URL is not set/);
  });

  test('without a path: usage on stderr, exit 1', async () => {
    const h = harness({}, { DATABASE_URL: 'postgres://example.invalid/marcador' });

    const code = await main([], h.io);

    expect(code).toBe(1);
    expect(h.err.join('\n')).toMatch(/usage: .*calendario:cargar/);
    expect(h.opened).toEqual([]);
  });

  test('a load that fails in the database: exit 1, the error on stderr, the client still closed', async () => {
    const h = harness(
      { load: () => Promise.reject(new Error('competition x already exists as y')) },
      { DATABASE_URL: 'postgres://example.invalid/marcador' },
    );

    const code = await main([validFile], h.io);

    expect(code).toBe(1);
    expect(h.err.join('\n')).toContain('already exists');
    expect(h.ended()).toBe(1);
  });
});

describe('CA-6 — the entry point starts under Node', () => {
  /** The operator's environment minus the database: nothing may be reached. */
  function envWithout(...names: string[]): NodeJS.ProcessEnv {
    const env = { ...process.env };
    for (const name of names) delete env[name];
    return env;
  }

  test('an invalid file exits 1 naming the row, with no DATABASE_URL needed', async () => {
    const outcome = await run('node', [CLI, invalidFile], {
      env: envWithout('DATABASE_URL'),
    }).then(
      () => ({ code: 0, stderr: '' }),
      (error: { code?: number; stderr?: string }) => ({ code: error.code, stderr: error.stderr ?? '' }),
    );

    expect(outcome.code).toBe(1);
    expect(outcome.stderr).toMatch(/round 1/);
    expect(outcome.stderr).toMatch(/club-fantasma/);
  });

  test('a valid file without DATABASE_URL exits 1 with the MissingDatabaseUrlError message', async () => {
    const outcome = await run('node', [CLI, validFile], {
      env: envWithout('DATABASE_URL'),
    }).then(
      () => ({ code: 0, stderr: '' }),
      (error: { code?: number; stderr?: string }) => ({ code: error.code, stderr: error.stderr ?? '' }),
    );

    expect(outcome.code).toBe(1);
    expect(outcome.stderr).toMatch(/DATABASE_URL is not set/);
  });
});
