/**
 * The half of the migration story that does not need a database: which files
 * the runner picks up, and that migration 0001 still DECLARES the artefacts
 * CA-15, CA-16 and CA-17 depend on.
 *
 * This is a canary, not the criterion. Whether Postgres actually ENFORCES them
 * is CA-15..CA-17 and only `npm run test:db` against a real Neon branch can
 * say so.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { MIGRATIONS_DIR, readMigrations } from '@/db/migrate';

describe('the migration runner finds its files', () => {
  test('0001 is the first migration and is named as ADR-006 requires', async () => {
    const migrations = await readMigrations();

    expect(migrations[0]).toEqual({
      version: '0001',
      file: '0001_canonical_model.sql',
    });
  });

  test('versions are unique and sorted', async () => {
    const versions = (await readMigrations()).map((migration) => migration.version);

    expect(versions).toEqual([...versions].sort());
    expect(new Set(versions).size).toBe(versions.length);
  });
});

describe('0001 declares the invariants the Postgres criteria will check', () => {
  const sql = async () =>
    readFile(join(MIGRATIONS_DIR, '0001_canonical_model.sql'), 'utf8');

  test.each([
    ['the six tables', /create table (competitions|teams|team_aliases|matches|observations|decisions)/g, 6],
  ])('%s', async (_what, pattern, count) => {
    expect((await sql()).match(pattern)?.length).toBe(count);
  });

  test.each([
    ['CA-15 the rule shape CHECK', "rule ~ '^RN-[0-9]{2}$'"],
    ['CA-15 the cardinality CHECK', 'cardinality(supporting_observation_ids) >= 1'],
    ['CA-15 the supporting-observations trigger', 'decisions_supporting_observations_exist'],
    ['CA-16 the observations immutability trigger', 'observations_are_immutable'],
    ['CA-16 the decisions immutability trigger', 'decisions_are_immutable'],
    ['CA-17 the confirmer CHECK', 'team_aliases_confirmed_needs_person'],
    ['CA-17 the proposed CHECK', 'team_aliases_proposed_has_no_person'],
    ['CA-17 the two-different-teams CHECK', 'matches_two_different_teams'],
    ['CA-12 raw_ref is NOT NULL', 'raw_ref      text             not null'],
  ])('%s is present', async (_what, fragment) => {
    expect(await sql()).toContain(fragment);
  });

  test('the immutability triggers are FOR EACH ROW, so TRUNCATE still works', async () => {
    // CA-16 depends on this: a statement-level trigger would fire on TRUNCATE
    // and the tests could not clean up.
    const text = await sql();
    const rowTriggers = text.match(/for each row\s+execute function reject_amendment\(\)/g);

    expect(rowTriggers?.length).toBe(2);
    expect(text).not.toContain('or truncate');
  });
});
