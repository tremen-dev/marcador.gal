/**
 * CA-8 — RN-07: el silencio se publica y se alerta, UNA VEZ (RN-07, RN-08,
 * ADR-021 §6).
 *
 * El silencio emite `Decision` porque entrar en *sen sinal* cambia lo que ve el
 * usuario, y nada llega al usuario sin pasar por el motor (RN-08). Si no se
 * publicase, la pantalla estaría enseñando un cualificador que ninguna
 * `Decision` sostiene.
 */
import { describe, expect, test } from 'vitest';
import { qualifierOf } from '@/decide/qualifier';
import { SILENCE_MS } from '@/decide/thresholds';
import { CEROACERO, MINUTE, at, decision, observation, plus, run } from './support/engine';
import type { Alert } from '@/decide/alert';
import type { Decision } from '@/model/decision';

const MET = (value: Decision | null): Decision => {
  if (value === null) throw new Error('esperaba una `Decision` y no salió ninguna');
  return value;
};

const LAST = observation({
  source: CEROACERO,
  at: at(30 * MINUTE),
  status: 'live',
  home: 1,
  away: 0,
});

const LIVE = decision({
  status: 'live',
  home: 1,
  away: 0,
  provisional: true,
  rule: 'RN-03',
  version: 2,
});

describe('CA-8.1 — el silencio emite `Decision` y alerta, y su borde son 15 min', () => {
  test('1. a los 15 min exactos: `Decision` con el mismo estado y marcador, `rule: RN-07`', () => {
    const now = plus(LAST.observed_at, SILENCE_MS);
    const result = run({ observations: [LAST], previous: LIVE, now, kind: 'time' });

    const emitted = MET(result.decision);
    expect(emitted.status).toBe('live');
    expect([emitted.home_score, emitted.away_score]).toEqual([1, 0]);
    expect(emitted.rule).toBe('RN-07');
    expect(emitted.version).toBe(3);
  });

  test('2. y una alerta `RN-07`, con las observaciones implicadas', () => {
    const now = plus(LAST.observed_at, SILENCE_MS);
    const result = run({ observations: [LAST], previous: LIVE, now, kind: 'time' });

    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0]?.rule).toBe('RN-07');
    expect(result.alerts[0]?.raised_at).toBe(now);
    expect(result.alerts[0]?.observation_ids).toEqual([LAST.id]);
  });

  test('3. un milisegundo antes: ni `Decision` ni alerta', () => {
    const result = run({
      observations: [LAST],
      previous: LIVE,
      now: plus(LAST.observed_at, SILENCE_MS - 1),
      kind: 'time',
    });

    expect(result.decision).toBeNull();
    expect(result.alerts).toEqual([]);
  });

  test('4. y de ahí sale el cualificador *sen sinal* (ADR-021 §6)', () => {
    const emitted = MET(
      run({
        observations: [LAST],
        previous: LIVE,
        now: plus(LAST.observed_at, SILENCE_MS),
        kind: 'time',
      }).decision,
    );

    expect(qualifierOf(emitted, [LAST])).toBe('sen_sinal');
  });
});

describe('CA-8.2 — una sola vez por episodio', () => {
  test('5. entradas `time` sucesivas no producen más `Decision` ni más alertas', () => {
    const raisedAt = plus(LAST.observed_at, SILENCE_MS);
    const first = run({ observations: [LAST], previous: LIVE, now: raisedAt, kind: 'time' });
    const announced = MET(first.decision);
    const alert: Alert = { ...first.alerts[0]!, id: 1 };

    let decisions = 0;
    let alerts = 0;
    for (let minute = 1; minute <= 10; minute += 1) {
      const result = run({
        observations: [LAST],
        previous: announced,
        now: plus(raisedAt, minute * MINUTE),
        kind: 'time',
        alerts: { conflict: null, silence: alert },
      });
      if (result.decision !== null) decisions += 1;
      alerts += result.alerts.length;
    }

    expect(decisions).toBe(0);
    expect(alerts).toBe(0);
  });

  test('6. y un episodio NUEVO —tras volver la señal— sí alerta otra vez', () => {
    const raisedAt = plus(LAST.observed_at, SILENCE_MS);
    const alert: Alert = {
      match_id: LIVE.match_id,
      rule: 'RN-07',
      raised_at: raisedAt,
      reason: 'anterior',
      observation_ids: [LAST.id],
      id: 1,
    };

    const returned = observation({
      source: CEROACERO,
      at: plus(raisedAt, 5 * MINUTE),
      status: 'live',
      home: 2,
      away: 0,
    });

    const result = run({
      observations: [returned],
      previous: decision({
        status: 'live',
        home: 1,
        away: 0,
        provisional: true,
        rule: 'RN-07',
        version: 3,
      }),
      now: plus(returned.observed_at, SILENCE_MS),
      kind: 'time',
      alerts: { conflict: null, silence: alert },
    });

    expect(result.alerts).toHaveLength(1);
  });
});

describe('CA-8.3 — cuando vuelve una observación, se sale del silencio', () => {
  const silent = decision({
    status: 'live',
    home: 1,
    away: 0,
    provisional: true,
    rule: 'RN-07',
    version: 3,
  });

  test('7. con marcador nuevo: la regla es RN-03 y deja de estar *sen sinal*', () => {
    const returned = observation({
      source: CEROACERO,
      at: at(50 * MINUTE),
      status: 'live',
      home: 2,
      away: 0,
    });

    const emitted = MET(
      run({
        observations: [returned],
        previous: silent,
        now: at(50 * MINUTE),
        kind: 'observation',
        incoming: returned,
      }).decision,
    );

    expect(emitted.rule).toBe('RN-03');
    expect(qualifierOf(emitted, [returned])).not.toBe('sen_sinal');
  });

  test('8. y AUNQUE NO CAMBIE NADA MÁS: el escalón 5 de RN-12 mueve el cualificador', () => {
    // «La `Decision` solo mueve el marcador **o su cualificador**». Salir del
    // silencio es lo segundo, así que emite igual.
    const returned = observation({
      source: CEROACERO,
      at: at(50 * MINUTE),
      status: 'live',
      home: 1,
      away: 0,
    });

    const emitted = MET(
      run({
        observations: [returned],
        previous: silent,
        now: at(50 * MINUTE),
        kind: 'observation',
        incoming: returned,
      }).decision,
    );

    expect([emitted.home_score, emitted.away_score]).toEqual([1, 0]);
    expect(emitted.rule).toBe('RN-03');
    expect(emitted.version).toBe(4);
  });
});

describe('CA-8.4 — RN-07 SOLO aplica a `live`', () => {
  test('9. un `scheduled` sin observaciones durante horas no produce nada', () => {
    const declared = observation({
      source: CEROACERO,
      at: at(-6 * 60 * MINUTE),
      status: 'scheduled',
    });

    const result = run({
      observations: [declared],
      previous: decision({ status: 'scheduled', provisional: true, rule: 'RN-03', version: 1 }),
      now: at(-30 * MINUTE),
      kind: 'time',
    });

    expect(result.decision).toBeNull();
    expect(result.alerts).toEqual([]);
  });

  test('10. y un `finished` tampoco, por muchas horas que pasen', () => {
    const closed = observation({
      source: CEROACERO,
      at: at(100 * MINUTE),
      status: 'finished',
      home: 2,
      away: 1,
    });

    const result = run({
      observations: [closed],
      previous: decision({
        status: 'finished',
        home: 2,
        away: 1,
        provisional: true,
        rule: 'RN-03',
        version: 4,
      }),
      now: at(400 * MINUTE),
      kind: 'time',
    });

    expect(result.decision).toBeNull();
    expect(result.alerts).toEqual([]);
  });
});

describe('CA-8.5 — un partido sin NINGUNA observación no existe (RN-12)', () => {
  test('11. una entrada `time` sobre un partido sin observaciones no produce nada', () => {
    const result = run({ observations: [], previous: null, now: at(60 * MINUTE), kind: 'time' });

    expect(result.decision).toBeNull();
    expect(result.alerts).toEqual([]);
    expect(result.held).toBeNull();
  });

  test('12. ni siquiera pasado el timeout de RN-06', () => {
    const result = run({ observations: [], previous: null, now: at(200 * MINUTE), kind: 'time' });

    expect(result).toEqual({ decision: null, alerts: [], held: null });
  });
});
