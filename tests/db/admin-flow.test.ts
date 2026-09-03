/**
 * CA-4.1, CA-4.4, CA-5 entero, CA-6.7, CA-6.8 y CA-8.3 — la jornada sintética
 * del panel, CON POSTGRES REAL Y EL MOTOR REAL.
 *
 * ES EL CENTRO DE LA SPEC: «lo que publica el panel sale confirmado, nunca
 * provisional» y «hoy solo un humano puede aplazar un partido» son
 * afirmaciones sobre lo que el MOTOR hace con una `Observation` de peso 1.0, y
 * con un doble del motor no se pueden hacer.
 *
 * Importar `_harness` REVIENTA sin `DATABASE_URL_TEST`: sin base real estos
 * criterios son UNMET, no *skipped* (gate del 2026-08-29). `npm run test:db`.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { migrate } from '@/db/migrate';
import {
  PostgresAdminAlertReader,
  PostgresAlertAckStore,
  PostgresOperatorActionLog,
  PostgresTeamNameReader,
} from '@/db/admin';
import { PostgresMatchStore } from '@/db/matches';
import { PostgresObservationStore } from '@/db/observations';
import { runEngineForMatch } from '@/decide/engine-entry';
import { readMatchDecisions } from '@/decide/read-entry';
import { qualifierOf } from '@/decide/qualifier';
import { adminHandler } from '@/admin/handler';
import { supportingOf } from '@/admin/board';
import { TICKET_FIELD, signTicket } from '@/admin/ticket';
import {
  ADMIN_SESSION_COOKIE,
  newSession,
  signSession,
} from '@/admin/session';
import { CEROACERO, OPERATOR } from '@/decide/roles';
import { RN01_WEIGHTS } from '@/ingest/sources';
import { observationId } from '@/ingest/observations';
import { ObservationSchema } from '@/model/observation';
import { epochMsOf, instantOf } from '@/polite/clock';
import { connect, dropEverything } from './_harness';
import { RecordingRawStore, CallLog } from '../admin/support/doubles';
import {
  OPERATOR_ONE,
  SCENE_SECRET,
  sceneEnv,
} from '../admin/support/doubles';
import type { AdminAction } from '@/admin/archive';
import type { AdminPorts } from '@/admin/ports';
import type { Sql } from '@/db/client';
import type { Instant, MatchId } from '@/model/ids';
import type { Observation } from '@/model/observation';
import type { Decision } from '@/model/decision';

const sql: Sql = connect();

const MATCH_ID = 'futgal-preferente-g1-2026-27-j23-panel' as MatchId;
const KICKOFF: Instant = '2026-03-21T17:00:00.000Z';
const WINDOW = {
  from: '2026-03-21T00:00:00.000Z' as Instant,
  to: '2026-03-22T00:00:00.000Z' as Instant,
  motive: 'Escena sintética de la suite de base de SPEC-017. No es una jornada real.',
};

const RAW_REF_CEROACERO =
  'ceroacero/futgal-preferente-g1/2026-03-21/2026-03-21t17-30-00.000z-a1b2c3d4e5f6.html';

let store: RecordingRawStore;
let clockNow: Instant = '2026-03-21T17:45:00.000Z';

function ports(): AdminPorts {
  return {
    store,
    observations: new PostgresObservationStore(sql),
    matches: new PostgresMatchStore(sql),
    teams: new PostgresTeamNameReader(sql),
    alerts: new PostgresAdminAlertReader(sql),
    acks: new PostgresAlertAckStore(sql),
    actions: new PostgresOperatorActionLog(sql),
    clock: { now: () => clockNow },
    windows: [WINDOW],
    // LA PUERTA ESTRECHA y LA PUERTA DE LECTURA, importadas POR NOMBRE.
    runEngine: (matchId: MatchId, at: Instant) => runEngineForMatch({ sql, matchId, now: at }),
    readDecisions: async (matchId: MatchId) => {
      const read = await readMatchDecisions({ sql, matchId });
      return { live: read.live, log: read.log };
    },
  };
}

function sessionCookie(): string {
  return `${ADMIN_SESSION_COOKIE}=${signSession(SCENE_SECRET, newSession(OPERATOR_ONE, clockNow))}`;
}

async function submit(
  fields: Readonly<Record<string, string>>,
  action: AdminAction,
  target: string,
): Promise<Response> {
  const ticket = signTicket(SCENE_SECRET, {
    operator_id: OPERATOR_ONE,
    action,
    target,
    issued_at: clockNow,
  });

  return await adminHandler({ ports: ports(), env: sceneEnv(), locale: 'gl' })(
    new Request('https://marcador.gal/admin', {
      method: 'POST',
      headers: new Headers({
        cookie: sessionCookie(),
        'content-type': 'application/x-www-form-urlencoded',
      }),
      // El vale explícito del caso 20 GANA: por eso va primero y `fields` lo
      // puede sobrescribir.
      body: new URLSearchParams({ [TICKET_FIELD]: ticket, ...fields }).toString(),
    }),
  );
}

/** Una corrección del operador: estado y marcador tal cual los teclea. */
async function correct(
  status: string,
  home: number,
  away: number,
  reason = 'o marcador estaba mal',
): Promise<Response> {
  return await submit(
    {
      intento: 'accion',
      accion: 'correccion',
      partido: MATCH_ID,
      estado: status,
      goles_casa: `${home}`,
      goles_fora: `${away}`,
      motivo: reason,
    },
    'correccion',
    MATCH_ID,
  );
}

/** Un cambio de estado: el marcador vigente se arrastra. */
async function changeStatus(status: string, reason = 'aprazado por néboa'): Promise<Response> {
  return await submit(
    { intento: 'accion', accion: 'estado', partido: MATCH_ID, estado: status, motivo: reason },
    'estado',
    MATCH_ID,
  );
}

/** Ratificar lo vigente: sin escribir ningún marcador. */
async function ratify(reason = 'vino do campo e é correcto'): Promise<Response> {
  return await submit(
    { intento: 'accion', accion: 'ratificacion', partido: MATCH_ID, motivo: reason },
    'ratificacion',
    MATCH_ID,
  );
}

/** Una observación automática de `ceroacero`, y el motor corriendo detrás. */
async function fromCeroacero(
  status: 'live' | 'finished' | 'suspended',
  home: number,
  away: number,
  at: Instant,
  ref = `${at}`,
): Promise<Observation> {
  const observation = ObservationSchema.parse({
    id: observationId(RAW_REF_CEROACERO, ref),
    match_id: MATCH_ID,
    source: CEROACERO,
    observed_at: at,
    confidence: RN01_WEIGHTS.aggregator,
    raw_ref: RAW_REF_CEROACERO,
    status,
    home_score: home,
    away_score: away,
  });

  await new PostgresObservationStore(sql).append(observation);
  await runEngineForMatch({ sql, matchId: MATCH_ID, now: at });
  return observation;
}

async function decisions(): Promise<readonly Decision[]> {
  return (await readMatchDecisions({ sql, matchId: MATCH_ID })).log;
}

async function live(): Promise<Decision | null> {
  return (await readMatchDecisions({ sql, matchId: MATCH_ID })).live;
}

async function observations(): Promise<readonly Observation[]> {
  return await new PostgresObservationStore(sql).listByMatch(MATCH_ID);
}

async function countOf(table: string): Promise<number> {
  const rows = await sql.unsafe<{ count: string }[]>(`select count(*)::text as count from ${table}`);
  return Number(rows[0]?.count ?? '0');
}

beforeAll(async () => {
  await dropEverything(sql);
  await migrate(sql);
  await sql`
    insert into competitions (id, name, season, "group")
    values ('futgal-preferente-g1', 'Preferente Futgal', '2026/27', '1')
    on conflict do nothing
  `;
  await sql`
    insert into teams (id, canonical_name)
    values ('ud-ourense', 'UD Ourense'), ('rc-celta-b', 'RC Celta B')
    on conflict do nothing
  `;
  await sql`
    insert into matches (id, competition_id, round, kickoff, home_id, away_id, venue)
    values (${MATCH_ID}, 'futgal-preferente-g1', 23, ${KICKOFF}::timestamptz,
            'ud-ourense', 'rc-celta-b', 'O Couto')
    on conflict do nothing
  `;
});

beforeEach(async () => {
  await sql.unsafe(
    'truncate alert_acks, operator_actions, alerts, observations, decisions cascade',
  );
  store = new RecordingRawStore(new CallLog());
  clockNow = '2026-03-21T17:45:00.000Z';
});

afterAll(async () => {
  await sql.end();
});

describe('CA-5.1 — bajar un marcador: `RN-01` con discrepancia, `RN-04` sin ella', () => {
  test('1. con una fuente automática que dice otra cosa, sale `RN-01` y gana el operador', async () => {
    await fromCeroacero('live', 2, 0, '2026-03-21T17:30:00.000Z');
    expect((await live())?.home_score).toBe(2);

    await correct('live', 1, 0, 'o 2-0 era un erro: só houbo un gol');

    const published = await live();
    expect(published?.rule).toBe('RN-01');
    expect(published?.home_score).toBe(1);
    expect(published?.away_score).toBe(0);
    expect(published?.status).toBe('live');
  });

  test('2. sin ninguna otra fuente que le contradiga, sale `RN-04`', async () => {
    await correct('live', 2, 0, 'primeira publicación desde o panel');
    expect((await live())?.home_score).toBe(2);

    clockNow = '2026-03-21T17:50:00.000Z';
    await correct('live', 1, 0, 'baixo o marcador: anularon o segundo');

    const published = await live();
    expect(published?.rule).toBe('RN-04');
    expect(published?.home_score).toBe(1);
  });
});

describe('CA-5.2 — aplazar y suspender: LA ÚNICA VÍA QUE HOY EXISTE', () => {
  test('3. `postponed` se aplica y se publica', async () => {
    await changeStatus('postponed', 'aprazado pola federación');

    const published = await live();
    expect(published?.status).toBe('postponed');
    expect(published?.home_score).toBeNull();
    expect(published?.provisional).toBe(false);
  });

  test('4. `suspended` también, arrastrando el marcador vigente', async () => {
    await fromCeroacero('live', 1, 1, '2026-03-21T17:30:00.000Z');

    clockNow = '2026-03-21T17:46:00.000Z';
    await changeStatus('suspended', 'suspendido por sarabia');

    const published = await live();
    expect(published?.status).toBe('suspended');
    expect(published?.home_score).toBe(1);
    expect(published?.away_score).toBe(1);
  });

  test('5. y ES la única vía: `futgal` no es capturable y `ceroacero` no puede', async () => {
    // La fuente oficial no está en `DEFAULT_SOURCES` (ADR-008 §1) y un
    // agregador no puede llevar un partido a `postponed`: RN-06 lo reserva.
    await fromCeroacero('live', 0, 0, '2026-03-21T17:30:00.000Z');
    const before = await live();
    expect(before?.status).toBe('live');

    // `ceroacero` diciendo `suspended` no es una transición que RN-06 le
    // conceda desde `live`, así que el estado publicado no se mueve.
    await fromCeroacero('suspended', 0, 0, '2026-03-21T17:40:00.000Z', 'susp');
    expect((await live())?.status).toBe('live');

    // El operador sí.
    clockNow = '2026-03-21T17:46:00.000Z';
    await changeStatus('suspended', 'árbitro suspende o partido');
    expect((await live())?.status).toBe('suspended');
  });
});

describe('CA-5.3 — corregir un estado equivocado (ADR-021 §8.3, las dos mitades)', () => {
  test('6. un `finished` cerrado antes de tiempo vuelve a `live` DESDE EL PANEL', async () => {
    await fromCeroacero('finished', 2, 1, '2026-03-21T17:30:00.000Z');
    await fromCeroacero('finished', 2, 1, '2026-03-21T17:31:00.000Z', 'segunda');
    // Dos coincidentes cierran el partido para una fuente automática (RN-06).
    // Si el motor no llegó a `finished`, el caso siguiente no mediría nada.
    const closed = await live();
    expect(closed).not.toBeNull();

    clockNow = '2026-03-21T17:46:00.000Z';
    await changeStatus('live', 'a fonte pechou o partido antes de tempo');

    expect((await live())?.status).toBe('live');
  });

  test('7. y la MISMA transición desde `ceroacero` se ignora', async () => {
    // Publicado `finished` por el operador...
    await correct('finished', 2, 1, 'rematou o partido');
    expect((await live())?.status).toBe('finished');

    // ...y `ceroacero` diciendo `live` no lo reabre: `finished → live` no está
    // en la tabla que RN-06 concede a una fuente automática.
    await fromCeroacero('live', 2, 1, '2026-03-21T17:50:00.000Z', 'reabrir');

    expect((await live())?.status).toBe('finished');
  });
});

describe('CA-5.4 — lo que publica el panel sale CONFIRMADO, nunca provisional', () => {
  test('8. `provisional === false` por la primera vía de RN-02, con peso 1.0', async () => {
    await correct('live', 1, 0, 'é a razón de que esta spec exista');

    const published = await live();
    expect(published?.provisional).toBe(false);

    const support = supportingOf(published!, await observations());
    expect(support.some((entry) => entry.source === OPERATOR)).toBe(true);
    expect(support.some((entry) => entry.confidence >= 0.9)).toBe(true);
  });
});

describe('CA-5.5 — un salto de más de 2 goles del operador NO se retiene', () => {
  test('9. un `0-4` desde el panel se publica en el acto', async () => {
    await correct('live', 0, 0, 'comeza o partido');
    expect((await live())?.home_score).toBe(0);

    clockNow = '2026-03-21T17:50:00.000Z';
    await correct('live', 0, 4, 'catro goles seguidos, vin o partido');

    const published = await live();
    expect(published?.away_score).toBe(4);
    expect(published?.provisional).toBe(false);
  });

  test('10. y el MISMO salto desde `ceroacero` SÍ se retiene', async () => {
    await fromCeroacero('live', 0, 0, '2026-03-21T17:30:00.000Z');
    expect((await live())?.away_score).toBe(0);

    await fromCeroacero('live', 0, 4, '2026-03-21T17:40:00.000Z', 'salto');

    // Retenido: lo publicado sigue siendo el 0-0 (RN-04, peso 0.7 < 0.9).
    expect((await live())?.away_score).toBe(0);
  });
});

describe('CA-5.6 — ratificar lo vigente: de *provisional* a *confirmado*', () => {
  test('11. basta con ratificar, SIN escribir ningún marcador', async () => {
    await fromCeroacero('live', 1, 0, '2026-03-21T17:30:00.000Z');

    const before = await live();
    expect(before?.provisional).toBe(true);
    expect(qualifierOf(before!, supportingOf(before!, await observations()))).toBe('provisional');

    clockNow = '2026-03-21T17:35:00.000Z';
    await ratify('vin o 1-0 no campo');

    const after = await live();
    expect(after?.version).toBe((before?.version ?? 0) + 1);
    expect(after?.home_score).toBe(1);
    expect(after?.away_score).toBe(0);
    expect(after?.provisional).toBe(false);
    expect(qualifierOf(after!, supportingOf(after!, await observations()))).toBe('confirmado');
  });
});

describe('CA-5.7 y CA-4.4 — nada de esto es un `UPDATE` (RN-13)', () => {
  test('12. cada operación deja UNA fila nueva en cada log, y ninguna anterior cambia', async () => {
    await fromCeroacero('live', 1, 0, '2026-03-21T17:30:00.000Z');
    const firstDecisions = await decisions();
    const firstObservations = await observations();

    clockNow = '2026-03-21T17:35:00.000Z';
    await correct('live', 2, 0, 'marcou o segundo');

    expect((await observations()).length).toBe(firstObservations.length + 1);
    expect((await decisions()).length).toBe(firstDecisions.length + 1);

    // Y las anteriores siguen ahí, con su `version` y sin un byte cambiado.
    const log = await decisions();
    expect(log.slice(0, firstDecisions.length)).toEqual(firstDecisions);
  });

  test('13. dos correcciones seguidas dejan DOS filas en `observations`', async () => {
    await correct('live', 1, 0, 'primeiro gol');
    clockNow = '2026-03-21T17:50:00.000Z';
    await correct('live', 2, 0, 'segundo gol');

    const rows = (await observations()).filter((entry) => entry.source === OPERATOR);
    expect(rows).toHaveLength(2);
    expect(new Set(rows.map((entry) => entry.id)).size).toBe(2);
  });

  test('14. y un `update` sobre `observations` o `decisions` recibe el error del trigger', async () => {
    await correct('live', 1, 0, 'unha corrección calquera');

    await expect(sql`update observations set home_score = 9`).rejects.toThrow(
      /amend|inmutable|immutable|append/i,
    );
    await expect(sql`update decisions set home_score = 9`).rejects.toThrow(
      /amend|inmutable|immutable|append/i,
    );
  });
});

describe('CA-4.1 — RN-12: la cadena llega hasta el operador Y SU MOTIVO', () => {
  test('15. `Decision` → apoyos → `Observation` → `raw_ref` → objeto crudo → los dos', async () => {
    const reason = 'baixo o marcador porque a fonte contou dúas veces o mesmo gol ⚽';
    await correct('live', 1, 0, reason);

    // 1. La `Decision` vigente y sus apoyos.
    const published = await live();
    expect(published).not.toBeNull();
    expect(published?.supporting_observation_ids.length).toBeGreaterThan(0);

    // 2. Las `Observation` que la sostienen.
    const support = supportingOf(published!, await observations());
    const mine = support.find((entry) => entry.source === OPERATOR);
    expect(mine).toBeDefined();

    // 3. Su `raw_ref`, y el objeto crudo que hay detrás.
    const object = await store.get(mine?.raw_ref ?? '');
    expect(object).not.toBeNull();

    // 4. Y dentro, el `operator_id` Y EL MOTIVO. Los dos están.
    const archived = JSON.parse(new TextDecoder().decode(object!.body)) as {
      operator_id: string;
      reason: string;
    };
    expect(archived.operator_id).toBe(OPERATOR_ONE);
    expect(archived.reason).toBe(reason);
  });

  test('16. y el `operator_id` NO está en ninguna fila de ninguna tabla', async () => {
    await correct('live', 1, 0, 'unha corrección calquera');

    for (const table of ['observations', 'decisions', 'alert_acks', 'operator_actions']) {
      const rows = await sql.unsafe<Record<string, unknown>[]>(`select * from ${table}`);
      expect(JSON.stringify(rows), `${table}`).not.toContain(OPERATOR_ONE);
    }
  });
});

describe('CA-6.7 y CA-6.8 — el acuse: idempotente, y de UNA FILA', () => {
  async function raiseAlert(reason: string, at: Instant): Promise<number> {
    const rows = await sql<{ id: number }[]>`
      insert into alerts (match_id, rule, raised_at, reason, observation_ids)
      values (${MATCH_ID}, 'RN-05', ${at}::timestamptz, ${reason}, '{"obs-x"}'::text[])
      returning id
    `;
    return rows[0]?.id ?? 0;
  }

  async function acknowledge(alertId: number, reason = 'xa o mirei'): Promise<Response> {
    return await submit(
      { intento: 'accion', accion: 'acuse', alerta: `${alertId}`, motivo: reason },
      'acuse',
      `${alertId}`,
    );
  }

  test('17. reconocer no publica NADA: cero `Observation`, cero `Decision`', async () => {
    const alertId = await raiseAlert('ceroacero 1-0 vs corresponsal 2-0', '2026-03-21T17:40:00.000Z');

    await acknowledge(alertId);

    expect(await countOf('alert_acks')).toBe(1);
    expect(await countOf('observations')).toBe(0);
    expect(await countOf('decisions')).toBe(0);
  });

  test('18. reconocer DOS VECES es idempotente: no escribe segunda fila', async () => {
    const alertId = await raiseAlert('ceroacero 1-0 vs corresponsal 2-0', '2026-03-21T17:40:00.000Z');

    await acknowledge(alertId);
    clockNow = '2026-03-21T17:47:00.000Z';
    const second = await acknowledge(alertId, 'volvo a mirar');

    expect(second.status).toBe(200);
    expect(await countOf('alert_acks')).toBe(1);
    // Y los DOS actos se registran: la cifra tiene que ver los dos.
    expect(await countOf('operator_actions')).toBe(2);
  });

  test('19. el acuse es de una FILA: la condición vuelve con otro motivo y aparece ABIERTA', async () => {
    const first = await raiseAlert('ceroacero 1-0 vs operador 2-0', '2026-03-21T17:40:00.000Z');
    await acknowledge(first);

    const reader = new PostgresAdminAlertReader(sql);
    const acks = new PostgresAlertAckStore(sql);

    const afterFirst = await reader.listByMatches([MATCH_ID]);
    const ackedFirst = await acks.ackedAt(afterFirst.map((alert) => alert.id));
    expect([...ackedFirst.keys()]).toEqual([first]);

    // El motor escribe otra fila porque el motivo —su huella— cambió.
    const second = await raiseAlert('ceroacero 1-0 vs operador 3-0', '2026-03-21T17:55:00.000Z');

    const afterSecond = await reader.listByMatches([MATCH_ID]);
    const ackedSecond = await acks.ackedAt(afterSecond.map((alert) => alert.id));

    expect(afterSecond).toHaveLength(2);
    expect(ackedSecond.has(second)).toBe(false);
    expect(ackedSecond.has(first)).toBe(true);
  });
});

describe('CA-8.3 — `submitted_at − started_at` sobre varias acciones, contra la base', () => {
  test('20. el total sale de las filas que la jornada dejó escritas', async () => {
    const gaps = [4, 1, 6];

    for (const [index, gap] of gaps.entries()) {
      clockNow = instantOf(epochMsOf('2026-03-21T17:45:00.000Z') + index * 10 * 60_000);
      const issuedAt = instantOf(epochMsOf(clockNow) - gap * 60_000);

      await submit(
        {
          intento: 'accion',
          accion: 'correccion',
          partido: MATCH_ID,
          estado: 'live',
          goles_casa: `${index}`,
          goles_fora: '0',
          motivo: `corrección ${index}`,
          [TICKET_FIELD]: signTicket(SCENE_SECRET, {
            operator_id: OPERATOR_ONE,
            action: 'correccion',
            target: MATCH_ID,
            issued_at: issuedAt,
          }),
        },
        'correccion',
        MATCH_ID,
      );
    }

    const log = new PostgresOperatorActionLog(sql);
    const rows = await log.listBetween('2026-03-21T00:00:00.000Z', '2026-03-22T00:00:00.000Z');

    expect(rows).toHaveLength(gaps.length);
    const total = rows.reduce(
      (sum, row) => sum + (epochMsOf(row.submitted_at) - epochMsOf(row.started_at)),
      0,
    );
    expect(total).toBe(gaps.reduce((sum, gap) => sum + gap, 0) * 60_000);
  });
});
