/**
 * El camino de una acción, en el orden exacto de §2 de la spec — CA-2.1,
 * CA-4.2, CA-6.6, CA-8.1, CA-8.2, CA-11.1, CA-11.2 y CA-11.3.
 *
 * Es la mitad SIN BASE. La mitad contra Postgres —CA-4.1, CA-4.4, CA-5 y
 * CA-6.7/6.8— vive en `tests/db/admin-flow.test.ts`, que es como lo pide el
 * ledger: sin `DATABASE_URL_TEST` esos criterios son UNMET, no *skipped*.
 */
import { describe, expect, test } from 'vitest';
import { TICKET_FIELD } from '@/admin/ticket';
import { OPERATOR } from '@/decide/roles';
import { RN01_WEIGHTS } from '@/ingest/sources';
import { MEASUREMENT_WINDOWS } from '@/ingest/measurement';
import { ObservationIdSchema } from '@/model/ids';
import { epochMsOf, instantOf } from '@/polite/clock';
import {
  KICKOFF,
  NOW,
  OUTSIDE_MATCH,
  SCENE_MATCH,
  SCENE_WINDOW,
  getPanel,
  liveDecision,
  postToPanel,
  scene,
  sessionTokenOf,
  ticketOf,
} from './support/doubles';
import type { MatchDecisions } from '@/admin/ports';

const TARGET = SCENE_MATCH.id;
const REASON = 'a fonte pechou o partido antes de tempo';

function correction(ticketAt = NOW): Readonly<Record<string, string>> {
  return {
    intento: 'accion',
    accion: 'correccion',
    partido: TARGET,
    [TICKET_FIELD]: ticketOf('correccion', TARGET, ticketAt),
    estado: 'live',
    goles_casa: '2',
    goles_fora: '1',
    motivo: REASON,
  };
}

describe('CA-2.1 — las tres que publican producen UNA `Observation`; la cuarta, cero', () => {
  test('1. `correccion` produce una `Observation` de `operador` a peso 1.0 y llama al motor', async () => {
    const built = scene();

    await postToPanel(built, { fields: correction() });

    expect(built.observations.rows).toHaveLength(1);
    const observation = built.observations.rows[0];
    expect(observation?.source).toBe(OPERATOR);
    expect(observation?.confidence).toBe(RN01_WEIGHTS.operator);
    expect(observation?.raw_ref).toMatch(/^operador\//);
    expect(built.engineCalls).toEqual([{ match_id: TARGET, now: NOW }]);
  });

  test('2. `estado` y `ratificacion` también, y en ese orden: archivo, Observation, motor', async () => {
    const withLive = new Map<string, MatchDecisions>([
      [TARGET, { live: liveDecision(), log: [liveDecision()] }],
    ]);

    for (const action of ['estado', 'ratificacion'] as const) {
      const built = scene({ decisions: withLive });

      await postToPanel(built, {
        fields: {
          intento: 'accion',
          accion: action,
          partido: TARGET,
          [TICKET_FIELD]: ticketOf(action, TARGET, NOW),
          estado: 'suspended',
          motivo: REASON,
        },
      });

      expect(built.observations.rows, `${action}`).toHaveLength(1);
      expect(built.engineCalls, `${action}`).toHaveLength(1);
      expect(
        built.log.indexOf(`put:${action}`),
        `${action}`,
      ).toBeLessThan(built.log.indexOf('observations.append'));
      expect(built.log.indexOf('observations.append'), `${action}`).toBeLessThan(
        built.log.indexOf('runEngine'),
      );
    }
  });

  test('3. `acuse` produce CERO `Observation` y CERO llamadas al motor (RN-05, CA-6.6)', async () => {
    const built = scene({
      alerts: [
        {
          id: 1,
          match_id: TARGET,
          rule: 'RN-05',
          raised_at: '2026-03-21T17:50:00.000Z',
          reason: 'ceroacero dice 1-0 e o corresponsal 2-0',
          observation_ids: [ObservationIdSchema.parse('obs-0001')],
        },
      ],
    });

    await postToPanel(built, {
      fields: {
        intento: 'accion',
        accion: 'acuse',
        alerta: '1',
        [TICKET_FIELD]: ticketOf('acuse', '1', NOW),
        motivo: 'xa o mirei, arbitro eu',
      },
    });

    expect(built.acks.rows).toHaveLength(1);
    expect(built.observations.rows).toEqual([]);
    expect(built.engineCalls).toEqual([]);
    // Y SÍ archiva: RN-10 no tiene excepción por tipo de acción.
    expect(built.store.size).toBe(1);
  });
});

describe('CA-4.2 — el motivo es obligatorio, y se rechaza ANTES de archivar', () => {
  test('4. un motivo vacío o de solo espacios: cero crudos, cero `Observation`', async () => {
    for (const motivo of ['', '   ', '\n\t ']) {
      const built = scene();

      await postToPanel(built, { fields: { ...correction(), motivo } });

      expect(built.store.size, `${JSON.stringify(motivo)}`).toBe(0);
      expect(built.observations.rows, `${JSON.stringify(motivo)}`).toEqual([]);
      expect(built.engineCalls, `${JSON.stringify(motivo)}`).toEqual([]);
    }
  });

  test('5. PERO SÍ deja fila en `operator_actions`: costó tiempo (CA-8.2)', async () => {
    const built = scene();

    await postToPanel(built, { fields: { ...correction(), motivo: '  ' } });

    expect(built.actions.rows).toHaveLength(1);
    expect(built.actions.rows[0]?.outcome).toBe('rejected_empty_reason');
    expect(built.actions.rows[0]?.raw_ref).toBeNull();
  });
});

describe('CA-8 — la cuarta cifra queda medible, y es una COTA INFERIOR', () => {
  test('6. una fila por acción con sesión y vale válidos, con sus dos instantes', async () => {
    const built = scene();
    const issuedAt = instantOf(epochMsOf(NOW) - 3 * 60 * 1000);

    await postToPanel(built, { fields: correction(issuedAt) });

    expect(built.actions.rows).toEqual([
      {
        action: 'correccion',
        match_id: TARGET,
        alert_id: null,
        started_at: issuedAt,
        submitted_at: NOW,
        outcome: 'accepted',
        raw_ref: built.observations.rows[0]?.raw_ref ?? null,
      },
    ]);
  });

  test('7. una petición rechazada ANTES de la sesión no deja ninguna fila', async () => {
    const built = scene();

    await postToPanel(built, { fields: correction(), token: 'no-es-un-token' });

    expect(built.actions.rows).toEqual([]);
  });

  test('8. y `submitted_at − started_at` se computa sobre varias acciones', async () => {
    const built = scene();
    const minutes = [5, 2, 8];

    for (const gap of minutes) {
      await postToPanel(built, {
        fields: {
          ...correction(instantOf(epochMsOf(NOW) - gap * 60_000)),
          motivo: `${REASON} (${gap})`,
        },
      });
    }

    const total = built.actions.rows.reduce(
      (sum, entry) => sum + (epochMsOf(entry.submitted_at) - epochMsOf(entry.started_at)),
      0,
    );

    expect(built.actions.rows).toHaveLength(minutes.length);
    expect(total).toBe(minutes.reduce((sum, gap) => sum + gap, 0) * 60_000);
  });

  /**
   * DECLARADO DENTRO DEL PROPIO CRITERIO (CA-8.4), y la épica obliga a
   * publicarlo al lado de la cifra: **esto es una COTA INFERIOR**. No cuenta
   * leer la pantalla, ni esperar, ni decidir sin enviar, ni el tiempo entre dos
   * acciones, ni la vuelta al bot o al campo. La cuarta cifra SIGUE
   * NECESITANDO EL CRONÓMETRO que la tabla de métricas de EPIC-002 ya pide.
   */
  test('9. lo que la tabla NO ve: mirar la pantalla y decidir sin enviar', async () => {
    const built = scene();

    // El operador carga el tablero, lo mira dos minutos y no envía nada.
    await getPanel(built);
    await getPanel(built);

    expect(built.actions.rows).toEqual([]);
  });
});

describe('CA-11 — nace apagado, y la llave es EL PARTIDO, no el reloj', () => {
  test('10. con `MEASUREMENT_WINDOWS` de PRODUCCIÓN el tablero está vacío', async () => {
    // Con las listas de producción, no con dobles: SPEC-017 entrega un panel
    // apagado, como SPEC-012 entregó un cron que no pide nada.
    expect(MEASUREMENT_WINDOWS).toEqual([]);

    const built = scene({ windows: MEASUREMENT_WINDOWS });
    const page = await (await getPanel(built)).text();

    expect(page).toContain('non hai nada que operar');
    expect(built.log.calls).not.toContain('teams.namesOf');
  });

  test('11. y ninguna operación es posible: cero archivo, cero filas', async () => {
    const built = scene({ windows: MEASUREMENT_WINDOWS });

    await postToPanel(built, { fields: correction() });

    expect(built.store.size).toBe(0);
    expect(built.observations.rows).toEqual([]);
    expect(built.engineCalls).toEqual([]);
    expect(built.actions.rows[0]?.outcome).toBe('rejected_out_of_matchday');
  });

  test('12. un partido FUERA de toda jornada: error con nombre, cero archivo', async () => {
    const built = scene();

    await postToPanel(built, {
      fields: {
        ...correction(),
        partido: OUTSIDE_MATCH.id,
        [TICKET_FIELD]: ticketOf('correccion', OUTSIDE_MATCH.id, NOW),
      },
    });

    expect(built.store.size).toBe(0);
    expect(built.observations.rows).toEqual([]);
    expect(built.actions.rows).toEqual([
      {
        action: 'correccion',
        match_id: OUTSIDE_MATCH.id,
        alert_id: null,
        started_at: NOW,
        submitted_at: NOW,
        outcome: 'rejected_out_of_matchday',
        raw_ref: null,
      },
    ]);
  });

  test('13. LA LLAVE SE APLICA AL PARTIDO, NO AL INSTANTE: el lunes se corrige', async () => {
    // El reloj está DESPUÉS del `to` de la jornada. Una corrección sobre un
    // partido de esa jornada FUNCIONA (ADR-024 §9, lo contrario que el bot).
    const monday = '2026-03-23T09:30:00.000Z';
    expect(epochMsOf(monday)).toBeGreaterThan(epochMsOf(SCENE_WINDOW.to));
    expect(epochMsOf(KICKOFF)).toBeLessThan(epochMsOf(SCENE_WINDOW.to));

    const built = scene({ now: monday });

    await postToPanel(built, {
      fields: correction(monday),
      // La sesión se emite el lunes: si se reusara la de NOW estaría caducada
      // y el caso estaría midiendo la sesión, no la llave de la jornada.
      token: sessionTokenOf(monday),
    });

    expect(built.observations.rows).toHaveLength(1);
    expect(built.engineCalls).toEqual([{ match_id: TARGET, now: monday }]);
    expect(built.actions.rows[0]?.outcome).toBe('accepted');
  });
});
