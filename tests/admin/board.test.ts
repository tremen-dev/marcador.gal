/**
 * CA-6 (la mitad que se calcula) y CA-12 — la bandeja y el tablero.
 *
 * «Abierta» SE CALCULA, NO SE GUARDA (CA-6.4): una alerta está abierta si no
 * tiene acuse, y no hay ninguna columna de estado detrás. Y el tablero SE
 * ORDENA POR LO QUE NECESITA A UNA PERSONA, no por cualificador (CA-12.3).
 */
import { describe, expect, test } from 'vitest';
import { matchesWithOpenAlerts, splitTray } from '@/admin/alerts';
import { boardRank, boardRow, lastObservedAt, matchDetail, orderBoard, supportingOf } from '@/admin/board';
import { qualifierOf } from '@/decide/qualifier';
import { MatchSchema } from '@/model/match';
import { ObservationIdSchema } from '@/model/ids';
import { ObservationSchema } from '@/model/observation';
import { KICKOFF, SCENE_MATCH, liveDecision } from './support/doubles';
import type { Alert } from '@/decide/alert';
import type { Instant } from '@/model/ids';
import type { Observation } from '@/model/observation';

function alert(id: number, raisedAt: Instant, rule: Alert['rule'] = 'RN-05', reason = 'discrepan'): Alert {
  return {
    id,
    match_id: SCENE_MATCH.id,
    rule,
    raised_at: raisedAt,
    reason,
    observation_ids: [ObservationIdSchema.parse('obs-0001')],
  };
}

function observation(id: string, observedAt: Instant, source = 'ceroacero'): Observation {
  return ObservationSchema.parse({
    id,
    match_id: SCENE_MATCH.id,
    source,
    observed_at: observedAt,
    confidence: 0.7,
    raw_ref: 'ceroacero/futgal-preferente-g1/2026-03-21/2026-03-21t17-00-00.000z-a1b2c3d4e5f6.html',
    status: 'live',
    home_score: 1,
    away_score: 0,
  });
}

describe('CA-6.4 y CA-6.5 — abiertas y reconocidas, calculadas y ordenadas', () => {
  const alerts = [
    alert(1, '2026-03-21T17:50:00.000Z'),
    alert(2, '2026-03-21T18:05:00.000Z', 'RN-07', 'sen sinal 15 min'),
    alert(3, '2026-03-21T17:30:00.000Z'),
  ];

  test('1. una alerta sin acuse está ABIERTA; con acuse, reconocida', () => {
    const tray = splitTray(alerts, new Map([[3, '2026-03-21T17:35:00.000Z' as Instant]]));

    expect(tray.open.map((entry) => entry.alert.id)).toEqual([2, 1]);
    expect(tray.acknowledged.map((entry) => entry.alert.id)).toEqual([3]);
    expect(tray.acknowledged[0]?.acked_at).toBe('2026-03-21T17:35:00.000Z');
  });

  test('2. las dos mitades van por instante DESCENDENTE, y la regla viaja con ellas', () => {
    const tray = splitTray(alerts, new Map());

    expect(tray.open.map((entry) => entry.alert.raised_at)).toEqual([
      '2026-03-21T18:05:00.000Z',
      '2026-03-21T17:50:00.000Z',
      '2026-03-21T17:30:00.000Z',
    ]);
    expect(tray.open.map((entry) => entry.alert.rule)).toEqual(['RN-07', 'RN-05', 'RN-05']);
    expect(tray.open.map((entry) => entry.alert.reason)).toContain('sen sinal 15 min');
  });

  test('3. sin acuse todo está abierto: no hay ningún estado que consultar', () => {
    const tray = splitTray(alerts, new Map());

    expect(tray.acknowledged).toEqual([]);
    expect(matchesWithOpenAlerts(tray)).toEqual(new Set([SCENE_MATCH.id]));
  });
});

describe('CA-6.8 — el acuse es de UNA FILA, no de una condición', () => {
  test('4. la condición vuelve con otro motivo ⇒ otra fila, y aparece ABIERTA', () => {
    const first = alert(1, '2026-03-21T17:50:00.000Z', 'RN-05', 'ceroacero 1-0 · operador 2-0');
    const acks = new Map([[1, '2026-03-21T17:55:00.000Z' as Instant]]);

    // Solo la primera: reconocida, bandeja de abiertas vacía.
    expect(splitTray([first], acks).open).toEqual([]);

    // El motor escribe otra fila porque el motivo —su huella— cambió.
    const second = alert(2, '2026-03-21T18:10:00.000Z', 'RN-05', 'ceroacero 1-0 · operador 3-0');
    const tray = splitTray([first, second], acks);

    expect(tray.open.map((entry) => entry.alert.id)).toEqual([2]);
    expect(tray.acknowledged.map((entry) => entry.alert.id)).toEqual([1]);
  });
});

describe('CA-12.1 — lo que el operador ve por partido', () => {
  const observations = [
    observation('obs-0001', '2026-03-21T17:40:00.000Z'),
    observation('obs-0002', '2026-03-21T17:55:00.000Z', 'corresponsal'),
  ];

  test('5. nombres canónicos, estado, marcador, cualificador y última observación', () => {
    const live = liveDecision();
    const row = boardRow({
      match: SCENE_MATCH,
      home: 'RC Celta B',
      away: 'UD Ourense',
      live,
      observations,
      open_alerts: 0,
    });

    expect(row.home).toBe('RC Celta B');
    expect(row.away).toBe('UD Ourense');
    expect(row.status).toBe('live');
    expect(row.home_score).toBe(1);
    expect(row.away_score).toBe(0);
    expect(row.last_observed_at).toBe('2026-03-21T17:55:00.000Z');
    // EL CUALIFICADOR SALE DE `qualifierOf`, NUNCA REIMPLEMENTADO.
    expect(row.qualifier).toBe(qualifierOf(live, supportingOf(live, observations)));
  });

  test('6. sin `Decision` vigente no se inventa ningún cualificador', () => {
    const row = boardRow({
      match: SCENE_MATCH,
      home: 'RC Celta B',
      away: 'UD Ourense',
      live: null,
      observations: [],
      open_alerts: 0,
    });

    expect(row.qualifier).toBeNull();
    expect(row.last_observed_at).toBeNull();
    expect(lastObservedAt([])).toBeNull();
  });

  test('7. el detalle trae TODAS las observaciones y el log entero (CA-12.2)', () => {
    const live = liveDecision();
    const previous = liveDecision({ version: 1, home_score: 0, rule: 'RN-03' });
    const current = liveDecision({ version: 2, home_score: 1, rule: 'RN-01' });

    const detail = matchDetail(
      boardRow({
        match: SCENE_MATCH,
        home: 'RC Celta B',
        away: 'UD Ourense',
        live,
        observations,
        open_alerts: 0,
      }),
      observations,
      [previous, current],
    );

    expect(detail.observations.map((entry) => entry.source)).toEqual([
      'corresponsal',
      'ceroacero',
    ]);
    expect(detail.decisions.map((entry) => entry.version)).toEqual([2, 1]);
    expect(detail.decisions.map((entry) => entry.rule)).toEqual(['RN-01', 'RN-03']);
  });
});

describe('CA-12.3 — el tablero se ordena por lo que NECESITA A UNA PERSONA', () => {
  const other = MatchSchema.parse({ ...SCENE_MATCH, id: 'outro', kickoff: KICKOFF });

  function rowOf(
    id: string,
    options: { alerts?: number; qualifier?: 'sen_sinal' | 'provisional'; status?: 'live' | 'finished' },
  ) {
    return {
      match: MatchSchema.parse({ ...other, id }),
      home: 'A',
      away: 'B',
      status: options.status ?? 'finished',
      home_score: 0,
      away_score: 0,
      qualifier: options.qualifier ?? 'provisional',
      last_observed_at: null,
      open_alerts: options.alerts ?? 0,
    } as const;
  }

  test('8. alerta abierta, después *sen sinal*, después `live`, después el resto', () => {
    const rows = [
      rowOf('d-resto', {}),
      rowOf('c-live', { status: 'live' }),
      rowOf('b-sen-sinal', { qualifier: 'sen_sinal' }),
      rowOf('a-alerta', { alerts: 2 }),
    ];

    expect(orderBoard(rows).map((row) => row.match.id)).toEqual([
      'a-alerta',
      'b-sen-sinal',
      'c-live',
      'd-resto',
    ]);
    expect(rows.map((row) => boardRank(row))).toEqual([3, 2, 1, 0]);
  });

  test('9. y NO por cualificador: `confirmado` no adelanta a `provisional`', () => {
    const rows = [
      { ...rowOf('provisional-live', { status: 'live' }), qualifier: 'provisional' as const },
      { ...rowOf('confirmado-resto', {}), qualifier: 'confirmado' as const },
    ];

    // El `live` va primero por ser `live`, no por su cualificador; y el
    // `confirmado` no adelanta a nadie por serlo.
    expect(orderBoard(rows).map((row) => row.match.id)).toEqual([
      'provisional-live',
      'confirmado-resto',
    ]);
  });

  /**
   * DECLARADO DENTRO DEL CRITERIO (CA-12.4), porque despierta un inventario
   * congelado: esta ordenación **NO contesta la entrada 1 del inventario de
   * EPIC-004** —cuál de los dos cualificadores es el normal en la pantalla del
   * marcador—. En un panel ninguno de los dos es decoración y la pregunta no se
   * plantea; en el marcador sí, y la contesta la spec del snapshot. **La
   * entrada conserva su disparador.**
   */
  test('10. el orden no mira el cualificador salvo para *sen sinal*, que es trabajo', () => {
    const rank = (qualifier: 'provisional' | 'confirmado' | 'sen_sinal') =>
      boardRank({ ...rowOf('x', {}), qualifier });

    expect(rank('provisional')).toBe(rank('confirmado'));
    expect(rank('sen_sinal')).toBeLessThan(rank('provisional'));
  });
});
