/**
 * CA-7.1 CONTRA LA BASE, CA-8, CA-9.4/9.5 y CA-10.2/10.3 — la jornada
 * sintética entera, con Postgres real y el motor real.
 *
 * ES EL CRITERIO MÁS IMPORTANTE DE LA SPEC, y por eso se afirma aquí y no con
 * un doble: «antes del botón, `observations` no tiene ninguna fila para ese
 * partido» (punto 3 de «Para el verificador» del ledger).
 *
 * Importar `_harness` REVIENTA sin `DATABASE_URL_TEST`: sin base real estos
 * criterios son UNMET, no *skipped* (gate del 2026-08-29). `npm run test:db`.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { migrate } from '@/db/migrate';
import {
  PostgresCorrespondentStateStore,
  PostgresProposalStore,
  PostgresRejectionCounter,
  PostgresTeamNameStore,
} from '@/db/bot';
import { PostgresMatchStore } from '@/db/matches';
import { PostgresObservationStore } from '@/db/observations';
import { runEngineForMatch } from '@/decide/engine-entry';
import { handleUpdate } from '@/bot/webhook';
import { confirmData, discardData } from '@/bot/card';
import { CORRESPONDENT } from '@/decide/roles';
import { roleOf } from '@/decide/roles';
import { RN01_WEIGHTS } from '@/ingest/sources';
import { observationId } from '@/ingest/observations';
import { botBundle } from '@/i18n/bot';
import { connect, dropEverything } from './_harness';
import { MemoryRawStore } from '../mirror/support/memory-store';
import {
  CORRESPONDENT_ID,
  DECLARED_MATCHDAY,
  MATCH_ID,
  NOW,
  TEST_CATALOG,
  TEST_MAP,
  jsonAnswer,
} from '../bot/support/doubles';
import { telegramCallbackUpdate, telegramMessageUpdate } from '../fixtures/telegram';
import type { BotPorts } from '@/bot/webhook';
import type { ModelAnswer, ModelPort } from '@/bot/llm';
import type { Outbound } from '@/bot/telegram';
import type { Sql } from '@/db/client';
import type { Instant, MatchId } from '@/model/ids';

const sql: Sql = connect();
const GL = botBundle('gl');

const PLAYER_TEXT = 'marcou Brais Sintético no 70, 2-1 Ourense';

/** Claves con la forma que `rawKey()` produce, para la fila caducada de CA-10.2. */
const EXPIRED_MESSAGE_REF =
  'corresponsal/mensaxe/2026-03-21/2026-03-21t17-00-00.000z-0123456789ab.json';
const EXPIRED_PROPOSAL_REF =
  'corresponsal/proposta/2026-03-21/2026-03-21t17-00-01.000z-0123456789ac.json';

class OneShotModel implements ModelPort {
  #answer: ModelAnswer;
  calls = 0;

  constructor(answer: ModelAnswer) {
    this.#answer = answer;
  }

  answerWith(answer: ModelAnswer): void {
    this.#answer = answer;
  }

  propose(): Promise<ModelAnswer> {
    this.calls += 1;
    return Promise.resolve(this.#answer);
  }
}

let store: MemoryRawStore;
let model: OneShotModel;
let ports: BotPorts;

const textOf = (outbound: Outbound): string =>
  outbound.kind === 'message' ? outbound.message.text : '';

async function seedCalendar(): Promise<void> {
  await sql`
    insert into competitions (id, name, season, "group")
    values ('futgal-preferente-g1', 'Preferente Futgal', '2026/27', '1')
    on conflict do nothing
  `;
  await sql`
    insert into teams (id, canonical_name)
    values ('ud-ourense', 'UD Ourense'), ('rc-celta-b', 'Celta B')
    on conflict do nothing
  `;
  await sql`
    insert into matches (id, competition_id, round, kickoff, home_id, away_id, venue)
    values (${MATCH_ID}, 'futgal-preferente-g1', 23, '2026-03-21T17:00:00Z',
            'ud-ourense', 'rc-celta-b', 'O Couto')
    on conflict do nothing
  `;
}

function compose(): BotPorts {
  return {
    store,
    proposals: new PostgresProposalStore(sql),
    state: new PostgresCorrespondentStateStore(sql),
    rejections: new PostgresRejectionCounter(sql),
    observations: new PostgresObservationStore(sql),
    matches: new PostgresMatchStore(sql),
    teams: new PostgresTeamNameStore(sql),
    model,
    clock: { now: () => NOW as Instant },
    catalog: TEST_CATALOG,
    map: TEST_MAP,
    windows: DECLARED_MATCHDAY,
    // LA PUERTA ESTRECHA, importada POR NOMBRE (CA-9.3). El bot no obtiene
    // ningún almacén de decisiones de ella (CA-9.2).
    runEngine: (matchId: MatchId, now: Instant) => runEngineForMatch({ sql, matchId, now }),
  };
}

beforeAll(async () => {
  await dropEverything(sql);
  await migrate(sql);
  await seedCalendar();
});

beforeEach(async () => {
  await sql.unsafe(
    'truncate bot_proposals, correspondent_state, bot_rejections, observations, decisions, alerts cascade',
  );
  store = new MemoryRawStore();
  model = new OneShotModel(
    jsonAnswer({ match_id: MATCH_ID, status: 'live', home_score: 2, away_score: 1, minute: 70 }),
  );
  ports = compose();
  await ports.state.markNoticeSent(CORRESPONDENT_ID as never, NOW as Instant);
});

afterAll(async () => {
  await sql.end();
});

async function countOf(table: string): Promise<number> {
  const rows = await sql.unsafe<{ count: string }[]>(`select count(*)::text as count from ${table}`);
  return Number(rows[0]?.count ?? '0');
}

describe('CA-7.1 — ANTES del botón, `observations` no tiene ninguna fila', () => {
  test('1. la tarjeta existe, la propuesta pendiente existe, y la base está vacía', async () => {
    const card = await handleUpdate(telegramMessageUpdate(), ports);

    expect(textOf(card)).toContain(GL.cardHeading);
    expect(await countOf('bot_proposals')).toBe(1);

    // ESTE es el criterio central de la spec, contra la base y no contra un doble.
    expect(await countOf('observations')).toBe(0);
    expect(await countOf('decisions')).toBe(0);
  });
});

describe('CA-8 — la `Observation` que nace tras el botón', () => {
  test('2. `source` es exactamente `corresponsal`, y `roleOf` no lanza', async () => {
    await handleUpdate(telegramMessageUpdate(), ports);
    const pending = await sql<{ id: string }[]>`select id from bot_proposals`;
    const id = pending[0]?.id;
    expect(id).toBeDefined();
    if (id === undefined) return;

    await handleUpdate(telegramCallbackUpdate(confirmData(id)), ports);

    const rows = await sql<Record<string, unknown>[]>`
      select source, confidence, raw_ref, status, home_score, away_score, match_id, id
        from observations
    `;
    expect(rows.length).toBe(1);
    expect(rows[0]?.['source']).toBe('corresponsal');
    expect(roleOf(CORRESPONDENT)).toBe('correspondent');
  });

  test('3. y `roleOf` SÍ lanza con `corresponsal:01`: es la razón de la decisión', () => {
    // Se deja medido, no supuesto: un sufijo reventaría el motor y obligaría a
    // tocar ficheros de una spec que está `hecho` (ADR-021 §8.4, ADR-022 §2).
    expect(() => roleOf('corresponsal:01' as never)).toThrow(/no RN-01 role declared/);
  });

  test('4. `confidence` es `RN01_WEIGHTS.correspondent`, leído y no escrito inline', async () => {
    await handleUpdate(telegramMessageUpdate(), ports);
    const [pending] = await sql<{ id: string }[]>`select id from bot_proposals`;
    if (pending === undefined) throw new Error('no pending proposal');
    await handleUpdate(telegramCallbackUpdate(confirmData(pending.id)), ports);

    const [row] = await sql<{ confidence: string }[]>`select confidence from observations`;
    expect(Number(row?.confidence)).toBe(RN01_WEIGHTS.correspondent);
    expect(RN01_WEIGHTS.correspondent).toBe(0.8);
  });

  test('5. `raw_ref` apunta al objeto del MENSAJE, y ese objeto existe', async () => {
    await handleUpdate(telegramMessageUpdate(), ports);
    const [pending] = await sql<{ id: string; message_raw_ref: string }[]>`
      select id, message_raw_ref from bot_proposals
    `;
    if (pending === undefined) throw new Error('no pending proposal');
    await handleUpdate(telegramCallbackUpdate(confirmData(pending.id)), ports);

    const [row] = await sql<{ raw_ref: string }[]>`select raw_ref from observations`;
    expect(row?.raw_ref).toBe(pending.message_raw_ref);
    expect(await store.get(pending.message_raw_ref)).not.toBeNull();
  });

  test('6. el `id` se DERIVA, y confirmar dos veces es idempotente', async () => {
    await handleUpdate(telegramMessageUpdate(), ports);
    const [pending] = await sql<{ id: string; message_raw_ref: string }[]>`
      select id, message_raw_ref from bot_proposals
    `;
    if (pending === undefined) throw new Error('no pending proposal');

    await handleUpdate(telegramCallbackUpdate(confirmData(pending.id)), ports);
    const [row] = await sql<{ id: string }[]>`select id from observations`;
    expect(row?.id).toBe(observationId(pending.message_raw_ref, pending.id));

    // La fila ya no existe, así que un segundo callback no escribe nada.
    await handleUpdate(telegramCallbackUpdate(confirmData(pending.id)), ports);
    expect(await countOf('observations')).toBe(1);
  });

  test('7. ninguna columna de `observations` lleva el `correspondent_id`', async () => {
    await handleUpdate(telegramMessageUpdate(), ports);
    const [pending] = await sql<{ id: string }[]>`select id from bot_proposals`;
    if (pending === undefined) throw new Error('no pending proposal');
    await handleUpdate(telegramCallbackUpdate(confirmData(pending.id)), ports);

    const [row] = await sql<Record<string, unknown>[]>`select * from observations`;
    expect(JSON.stringify(row)).not.toContain(CORRESPONDENT_ID);
  });
});

describe('CA-9 — el bot no publica: escribe `Observation` y llama al motor', () => {
  test('8. tras confirmar existe una `Decision`, provisional, y la escribe el MOTOR', async () => {
    await handleUpdate(telegramMessageUpdate(), ports);
    const [pending] = await sql<{ id: string }[]>`select id from bot_proposals`;
    if (pending === undefined) throw new Error('no pending proposal');
    await handleUpdate(telegramCallbackUpdate(confirmData(pending.id)), ports);

    const decisions = await sql<
      { match_id: string; provisional: boolean; supporting_observation_ids: string[] }[]
    >`
      select match_id, provisional, supporting_observation_ids from decisions
    `;
    expect(decisions.length).toBe(1);
    expect(decisions[0]?.match_id).toBe(MATCH_ID);
    // 0.8 < 0.9, así que sale PROVISIONAL (RN-03).
    expect(decisions[0]?.provisional).toBe(true);

    const [observation] = await sql<{ id: string }[]>`select id from observations`;
    expect(decisions[0]?.supporting_observation_ids).toContain(observation?.id);
  });

  test('9. la `Decision` NO transporta nada del texto del mensaje', async () => {
    model.answerWith(
      jsonAnswer({ match_id: MATCH_ID, status: 'live', home_score: 2, away_score: 1, minute: 70 }),
    );
    await handleUpdate(telegramMessageUpdate({ text: PLAYER_TEXT }), ports);
    const [pending] = await sql<{ id: string }[]>`select id from bot_proposals`;
    if (pending === undefined) throw new Error('no pending proposal');
    await handleUpdate(telegramCallbackUpdate(confirmData(pending.id)), ports);

    const rows = await sql<Record<string, unknown>[]>`select * from decisions`;
    expect(rows.length).toBe(1);
    expect(JSON.stringify(rows)).not.toContain('Brais');
    expect(JSON.stringify(rows)).not.toContain('Sintético');
  });

  test('10. y el acuse dice que TODAVÍA NO está publicado, sin nombrar el motor', async () => {
    await handleUpdate(telegramMessageUpdate(), ports);
    const [pending] = await sql<{ id: string }[]>`select id from bot_proposals`;
    if (pending === undefined) throw new Error('no pending proposal');

    const ack = await handleUpdate(telegramCallbackUpdate(confirmData(pending.id)), ports);

    expect(textOf(ack)).toContain('Rexistrado: UD Ourense 2 - 1 Celta B.');
    expect(textOf(ack)).toContain(GL.ackNotPublication);
    expect(textOf(ack).toLowerCase()).not.toContain('motor');
  });
});

describe('CA-10 — el `correspondent_id` tiene un solo domicilio durable', () => {
  test('11. tras una jornada sintética entera, `bot_proposals` está VACÍA', async () => {
    // Confirmada.
    await handleUpdate(telegramMessageUpdate({ updateId: 1 }), ports);
    const [first] = await sql<{ id: string }[]>`select id from bot_proposals`;
    if (first === undefined) throw new Error('no pending proposal');
    await handleUpdate(telegramCallbackUpdate(confirmData(first.id), { updateId: 2 }), ports);

    // Descartada.
    model.answerWith(
      jsonAnswer({ match_id: MATCH_ID, status: 'live', home_score: 3, away_score: 1, minute: 80 }),
    );
    await handleUpdate(telegramMessageUpdate({ text: '3-1 no 80', updateId: 3 }), ports);
    const [second] = await sql<{ id: string }[]>`select id from bot_proposals`;
    if (second === undefined) throw new Error('no second proposal');
    await handleUpdate(telegramCallbackUpdate(discardData(second.id), { updateId: 4 }), ports);

    // Caducada: una fila cuya caducidad ya pasó, resuelta por el mismo camino.
    await sql`
      insert into bot_proposals
        (id, correspondent_id, match_id, status, home_score, away_score, minute,
         message_raw_ref, proposal_raw_ref, created_at, expires_at)
      values ('p-expired', ${CORRESPONDENT_ID}, ${MATCH_ID}, 'live', 1, 1, 20,
              ${EXPIRED_MESSAGE_REF}, ${EXPIRED_PROPOSAL_REF},
              '2026-03-21T17:00:00Z', '2026-03-21T17:05:00Z')
    `;
    await handleUpdate(telegramCallbackUpdate(confirmData('p-expired'), { updateId: 5 }), ports);

    expect(await countOf('bot_proposals')).toBe(0);
  });

  test('12. la cadena de RN-12 se recorre entera: Decision → Observation → crudo → seudónimo', async () => {
    await handleUpdate(telegramMessageUpdate(), ports);
    const [pending] = await sql<{ id: string }[]>`select id from bot_proposals`;
    if (pending === undefined) throw new Error('no pending proposal');
    await handleUpdate(telegramCallbackUpdate(confirmData(pending.id)), ports);

    const [decision] = await sql<{ supporting_observation_ids: string[] }[]>`
      select supporting_observation_ids from decisions
    `;
    const observationRef = decision?.supporting_observation_ids?.[0];
    expect(observationRef).toBeDefined();

    const [observation] = await sql<{ raw_ref: string }[]>`
      select raw_ref from observations where id = ${observationRef ?? ''}
    `;
    expect(observation?.raw_ref).toBeDefined();

    const archived = await store.get(observation?.raw_ref ?? '');
    expect(archived).not.toBeNull();

    const body = JSON.parse(new TextDecoder().decode(archived?.body ?? new Uint8Array())) as {
      correspondent_id: string;
    };
    expect(body.correspondent_id).toBe(CORRESPONDENT_ID);
  });

  test('13. y el contador de rechazos sigue siendo un agregado sin persona', async () => {
    await handleUpdate(telegramMessageUpdate({ senderId: 9999 }), ports);

    const rows = await sql<{ day: string; reason: string; count: number }[]>`
      select day::text as day, reason, count from bot_rejections
    `;
    expect(rows.length).toBe(1);
    expect(rows[0]?.reason).toBe('unauthorised');
    expect(rows[0]?.count).toBe(1);
    expect(JSON.stringify(rows)).not.toContain(CORRESPONDENT_ID);
  });
});
