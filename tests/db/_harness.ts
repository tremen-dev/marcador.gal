/**
 * Shared setup for the Postgres suites (CA-13..CA-17).
 *
 * Importing this module THROWS when `DATABASE_URL_TEST` is missing. That is
 * deliberate and it is the gate's decision of 2026-08-29: without a real
 * Postgres those criteria are UNMET, not skipped.
 *
 * The connection is expected to point at a disposable Neon test branch: the
 * harness drops and recreates the `public` schema.
 */
import { createClient, requireTestDatabaseUrl } from '@/db/client';
import { migrate } from '@/db/migrate';
import type { Sql } from '@/db/client';

/** Throws at import time if the credential is absent. Loudly, on purpose. */
export const DATABASE_URL_TEST: string = requireTestDatabaseUrl();

export function connect(): Sql {
  return createClient(DATABASE_URL_TEST);
}

/** A pristine schema with migration 0001 applied. */
export async function resetAndMigrate(sql: Sql): Promise<void> {
  await dropEverything(sql);
  await migrate(sql);
}

export async function dropEverything(sql: Sql): Promise<void> {
  await sql.unsafe('drop schema if exists public cascade; create schema public;');
}

/**
 * `TRUNCATE` does not fire FOR EACH ROW triggers, which is what lets the tests
 * clean up between cases without weakening RN-13 (CA-16).
 */
export async function truncateFacts(sql: Sql): Promise<void> {
  await sql.unsafe('truncate observations, decisions cascade');
}

export const SEED = {
  competitionId: 'futgal-preferente-g1',
  homeId: 'rc-celta-b',
  awayId: 'ud-ourense',
  matchId: 'futgal-preferente-g1-2026-27-j23',
  otherMatchId: 'futgal-preferente-g1-2026-27-j23-other',
  observationA: 'obs-0001',
  observationB: 'obs-0002',
  observationOther: 'obs-9001',
  rawRef: 'futgal/futgal-preferente-g1/2026-03-21/2026-03-21t17-00-00.000z-a1b2c3d4e5f6.html',
} as const;

/** Two teams, one competition, two matches and three observations. */
export async function seed(sql: Sql): Promise<void> {
  await sql`
    insert into competitions (id, name, season, "group")
    values (${SEED.competitionId}, 'Preferente Futgal', '2026/27', '1')
    on conflict do nothing
  `;

  await sql`
    insert into teams (id, canonical_name)
    values (${SEED.homeId}, 'RC Celta B'), (${SEED.awayId}, 'UD Ourense')
    on conflict do nothing
  `;

  await sql`
    insert into matches (id, competition_id, round, kickoff, home_id, away_id, venue)
    values
      (${SEED.matchId}, ${SEED.competitionId}, 23, '2026-03-21T17:00:00Z',
       ${SEED.homeId}, ${SEED.awayId}, 'Barreiro'),
      (${SEED.otherMatchId}, ${SEED.competitionId}, 23, '2026-03-21T17:00:00Z',
       ${SEED.awayId}, ${SEED.homeId}, 'O Couto')
    on conflict do nothing
  `;

  await sql`
    insert into observations
      (id, match_id, source, observed_at, status, home_score, away_score, confidence, raw_ref)
    values
      (${SEED.observationA}, ${SEED.matchId}, 'futgal', '2026-03-21T17:35:00Z',
       'live', 1, 0, 1.0, ${SEED.rawRef}),
      (${SEED.observationB}, ${SEED.matchId}, 'ceroacero', '2026-03-21T17:36:00Z',
       'live', 1, 0, 0.7, ${SEED.rawRef}),
      (${SEED.observationOther}, ${SEED.otherMatchId}, 'futgal', '2026-03-21T17:35:00Z',
       'live', 0, 0, 1.0, ${SEED.rawRef})
  `;
}
