/**
 * SPEC-018 CA-6.4 — la lectura en lote, CONTRA POSTGRES.
 *
 * Devuelve, para cada partido, LA MISMA `Decision` VIGENTE que
 * `readMatchDecisions` devolvería una a una — y las observaciones que la
 * sostienen —, en DOS consultas cualquiera que sea el número de partidos.
 *
 * Corre con `npm run test:db` y necesita `DATABASE_URL_TEST`. Sin un Postgres
 * real este criterio está INCUMPLIDO, no saltado: es la decisión del gate del
 * 2026-08-29 que `_harness.ts` hace cumplir al importarse.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { readBoardLogs } from '@/decide/board-entry';
import { readMatchDecisions } from '@/decide/read-entry';
import { PostgresDecisionStore } from '@/db/decisions';
import { PostgresBoardCompetitionNames, PostgresBoardTeamNames } from '@/db/board';
import { DecisionSchema } from '@/model/decision';
import { connect, resetAndMigrate, seed, truncateFacts, SEED } from './_harness';
import type { Sql } from '@/db/client';
import type { MatchId } from '@/model/ids';

const sql: Sql = connect();

beforeAll(async () => {
  await resetAndMigrate(sql);
});

afterAll(async () => {
  await sql.end();
});

beforeEach(async () => {
  await truncateFacts(sql);
  await seed(sql);
});

const MATCH = SEED.matchId as MatchId;
const OTHER = SEED.otherMatchId as MatchId;

async function append(overrides: Readonly<Record<string, unknown>>): Promise<void> {
  await new PostgresDecisionStore(sql).append(
    DecisionSchema.parse({
      match_id: MATCH,
      status: 'live',
      home_score: 1,
      away_score: 0,
      provisional: true,
      rule: 'RN-03',
      decided_at: '2026-03-21T17:36:00.000Z',
      supporting_observation_ids: [SEED.observationB],
      version: 1,
      ...overrides,
    }),
  );
}

describe('CA-6.4 — la lectura en lote contra la base', () => {
  test('1. devuelve la MISMA `Decision` vigente que `readMatchDecisions` una a una', async () => {
    await append({ version: 1 });
    await append({ version: 2, home_score: 2, decided_at: '2026-03-21T17:50:00.000Z' });
    await append({
      match_id: OTHER,
      version: 1,
      home_score: 0,
      away_score: 0,
      supporting_observation_ids: [SEED.observationOther],
      decided_at: '2026-03-21T17:40:00.000Z',
    });

    const batch = await readBoardLogs({ sql, matchIds: [MATCH, OTHER] });

    const oneByOne = await Promise.all(
      [MATCH, OTHER].map(async (matchId) => await readMatchDecisions({ sql, matchId })),
    );

    expect(batch).toHaveLength(2);
    for (const [index, entry] of batch.entries()) {
      expect(entry.match_id).toBe(oneByOne[index]!.match_id);
      expect(entry.live).toEqual(oneByOne[index]!.live);
    }

    // Y la vigente es la de VERSIÓN MÁS ALTA, que es lo que dice `dominio.md`.
    expect(batch[0]!.live?.version).toBe(2);
    expect(batch[0]!.live?.home_score).toBe(2);
  });

  test('2. devuelve las observaciones que sostienen la vigente, y ninguna más', async () => {
    await append({ version: 1, supporting_observation_ids: [SEED.observationB] });

    const [entry] = await readBoardLogs({ sql, matchIds: [MATCH] });

    expect(entry!.supporting.map((observation) => observation.id)).toEqual([SEED.observationB]);
    // La otra observación del mismo partido existe y NO sale: lo que se
    // devuelve son los apoyos de la `Decision`, no el log entero.
    expect(entry!.supporting.map((observation) => observation.id)).not.toContain(
      SEED.observationA,
    );
  });

  test('3. un partido sin ninguna `Decision` sale con `live: null` y sin apoyos', async () => {
    const [entry] = await readBoardLogs({ sql, matchIds: [MATCH] });

    expect(entry!.live).toBeNull();
    expect(entry!.supporting).toEqual([]);
  });

  test('4. con la lista vacía no se consulta nada', async () => {
    expect(await readBoardLogs({ sql, matchIds: [] })).toEqual([]);
  });

  test('5. y los dos lectores de nombres canónicos devuelven lo que el calendario declaró', async () => {
    const teams = await new PostgresBoardTeamNames(sql).namesOf([
      SEED.homeId as never,
      SEED.awayId as never,
    ]);
    expect(teams.get(SEED.homeId as never)).toBe('RC Celta B');
    expect(teams.get(SEED.awayId as never)).toBe('UD Ourense');

    const competitions = await new PostgresBoardCompetitionNames(sql).namesOf([
      SEED.competitionId as never,
    ]);
    expect(competitions.get(SEED.competitionId as never)).toBe('Preferente Futgal');

    // Y con la lista vacía no se consulta nada.
    expect((await new PostgresBoardTeamNames(sql).namesOf([])).size).toBe(0);
    expect((await new PostgresBoardCompetitionNames(sql).namesOf([])).size).toBe(0);
  });
});
