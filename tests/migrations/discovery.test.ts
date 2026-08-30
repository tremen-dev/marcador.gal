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
    [
      'CA-19 the closed list of engine rules',
      "rule in ('RN-01', 'RN-02', 'RN-03', 'RN-04', 'RN-05', 'RN-06', 'RN-07')",
    ],
    ['CA-15 the cardinality CHECK', 'cardinality(supporting_observation_ids) >= 1'],
    ['CA-15 the supporting-observations trigger', 'decisions_supporting_observations_exist'],
    ['CA-16 the observations immutability trigger', 'observations_are_immutable'],
    ['CA-16 the decisions immutability trigger', 'decisions_are_immutable'],
    ['CA-17 the confirmer CHECK', 'team_aliases_confirmed_needs_person'],
    ['CA-17 the proposed CHECK', 'team_aliases_proposed_has_no_person'],
    ['CA-17 the two-different-teams CHECK', 'matches_two_different_teams'],
    ['CA-12 raw_ref is NOT NULL', 'raw_ref      text             not null'],
    ['CA-7 the observations scoreboard CHECK', 'observations_score_matches_status'],
    ['CA-7 the observations non-negativity CHECK', 'observations_scores_non_negative'],
    ['CA-18 the decisions scoreboard CHECK', 'decisions_score_matches_status'],
    ['CA-18 the decisions non-negativity CHECK', 'decisions_scores_non_negative'],
  ])('%s is present', async (_what, fragment) => {
    expect(await sql()).toContain(fragment);
  });

  /**
   * CA-19: a shape CHECK would let `RN-13` through — it matches `^RN-[0-9]{2}$`
   * and is a real rule of reglas.md, just not one of the engine.
   */
  test('the rule CHECK is a closed list and not a shape', async () => {
    expect(await sql()).not.toContain("rule ~ '^RN-");
  });

  /**
   * CA-18: the two tables carry the SAME scoreboard rule. Comparing the text of
   * the two CHECKs is crude, but it is the level at which a divergence would
   * appear as a diff and not as a silent hole in what we publish.
   */
  test('decisions and observations carry the same scoreboard rule', async () => {
    const text = await sql();
    const pattern =
      /constraint (?:observations|decisions)_score_matches_status\s+check\s+\(([\s\S]*?)\),\s*\n\s*\n/g;
    const bodies = [...text.matchAll(pattern)].map((match) =>
      (match[1] ?? '').replace(/\s+/gu, ' ').trim(),
    );

    expect(bodies).toHaveLength(2);
    expect(bodies[0]).toBe(bodies[1]);
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
