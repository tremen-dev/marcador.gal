/**
 * CA-9 atravesando el reducer — RN-12: la regla decisiva, en los pares
 * adyacentes que se dan de verdad en el motor.
 *
 * El orden en aislamiento vive en `attribution.test.ts`; aquí se comprueba que
 * lo que el reducer LE PASA a esa función es lo que RN-12 describe.
 */
import { describe, expect, test } from 'vitest';
import { DECISION_RULES } from '@/model/decision';
import { CONFLICT_GRACE_MS } from '@/decide/thresholds';
import {
  BESOCCER,
  CEROACERO,
  CORRESPONDENT,
  MINUTE,
  OFFICIAL,
  OPERATOR,
  at,
  decision,
  observation,
  run,
} from './support/engine';
import type { Decision } from '@/model/decision';

const MET = (value: Decision | null): Decision => {
  if (value === null) throw new Error('esperaba una `Decision` y no salió ninguna');
  return value;
};

describe('CA-9 — los tres pares adyacentes que el criterio nombra', () => {
  test('1. `scheduled → live` con una sola fuente de 0.8 registra RN-06, no RN-03', () => {
    const play = observation({
      source: CORRESPONDENT,
      at: at(1 * MINUTE),
      status: 'live',
      home: 0,
      away: 0,
    });

    const emitted = MET(
      run({
        observations: [play],
        previous: decision({ status: 'scheduled', provisional: true, rule: 'RN-03', version: 1 }),
        now: at(1 * MINUTE),
        kind: 'observation',
        incoming: play,
      }).decision,
    );

    // Cumple RN-06 Y RN-03 a la vez, y se registra la DECISIVA.
    expect(emitted.rule).toBe('RN-06');
    expect(emitted.provisional).toBe(true);
  });

  test('2. una bajada de marcador que además cambia el estado registra RN-04', () => {
    const lowerAndClose = observation({
      source: CORRESPONDENT,
      at: at(95 * MINUTE),
      status: 'finished',
      home: 1,
      away: 1,
    });

    const emitted = MET(
      run({
        observations: [lowerAndClose],
        previous: decision({
          status: 'live',
          home: 2,
          away: 1,
          provisional: true,
          rule: 'RN-03',
          version: 3,
        }),
        now: at(95 * MINUTE),
        kind: 'observation',
        incoming: lowerAndClose,
      }).decision,
    );

    expect(emitted.status).toBe('finished');
    expect(emitted.rule).toBe('RN-04');
  });

  test('3. una decisión del operador que además cambia el estado registra RN-01', () => {
    const automatic = observation({
      source: CEROACERO,
      at: at(94 * MINUTE),
      status: 'live',
      home: 2,
      away: 1,
    });
    const operator = observation({
      source: OPERATOR,
      at: at(95 * MINUTE),
      status: 'finished',
      home: 2,
      away: 2,
    });

    const emitted = MET(
      run({
        observations: [automatic, operator],
        previous: decision({
          status: 'live',
          home: 2,
          away: 1,
          provisional: true,
          rule: 'RN-03',
          version: 3,
        }),
        now: at(95 * MINUTE),
        kind: 'observation',
        incoming: operator,
      }).decision,
    );

    expect(emitted.status).toBe('finished');
    expect(emitted.rule).toBe('RN-01');
  });

  test('4. y RN-07 cede ante RN-04 pero gana a RN-06 dentro del reducer', () => {
    // El silencio y la transición no pueden concurrir en el motor —RN-07 solo
    // aplica a `live`, y una transición a `live` trae observación nueva—, así
    // que el par que sí se da es RN-04 con RN-07: liberar un salto retenido
    // mientras el partido lleva 15 min sin señal se registra como RN-04.
    const jump = observation({
      source: CEROACERO,
      at: at(30 * MINUTE),
      status: 'live',
      home: 5,
      away: 1,
    });
    const seconded = observation({
      source: BESOCCER,
      at: at(30 * MINUTE),
      status: 'live',
      home: 5,
      away: 1,
    });

    const emitted = MET(
      run({
        observations: [jump, seconded],
        previous: decision({
          status: 'live',
          home: 2,
          away: 1,
          provisional: true,
          rule: 'RN-03',
          version: 2,
        }),
        now: at(50 * MINUTE),
        kind: 'time',
      }).decision,
    );

    expect(emitted.rule).toBe('RN-04');
  });
});

describe('CA-9.1 — RN-05 nunca aparece en `rule`', () => {
  const AHEAD = observation({
    source: CEROACERO,
    at: at(50 * MINUTE),
    status: 'live',
    home: 2,
    away: 1,
  });
  const BEHIND = observation({
    source: BESOCCER,
    at: at(49 * MINUTE),
    status: 'live',
    home: 1,
    away: 1,
  });
  const VIGENTE = decision({
    status: 'live',
    home: 1,
    away: 1,
    provisional: true,
    rule: 'RN-03',
    version: 4,
  });

  test('5. cuando ES conflicto no emite `Decision` (CA-6.2)', () => {
    const result = run({
      observations: [AHEAD, BEHIND],
      previous: VIGENTE,
      now: new Date(Date.parse(AHEAD.observed_at) + CONFLICT_GRACE_MS + 1).toISOString(),
    });

    expect(result.decision).toBeNull();
    expect(result.held?.rule).toBe('RN-05');
  });

  test('6. y durante la gracia lo publicado se atribuye por el orden normal', () => {
    const emitted = MET(
      run({ observations: [AHEAD, BEHIND], previous: VIGENTE, now: at(51 * MINUTE) }).decision,
    );

    expect(emitted.rule).toBe('RN-03');
  });

  test('7. una discrepancia con el operador dentro enruta al escalón 1: RN-01', () => {
    const operator = observation({
      source: OPERATOR,
      at: at(49 * MINUTE),
      status: 'live',
      home: 3,
      away: 1,
    });

    const emitted = MET(
      run({
        observations: [AHEAD, operator],
        previous: VIGENTE,
        now: at(60 * MINUTE),
      }).decision,
    );

    expect(emitted.rule).toBe('RN-01');
  });

  test('8. y con la oficial dentro, tampoco es RN-05', () => {
    const official = observation({
      source: OFFICIAL,
      at: at(49 * MINUTE),
      status: 'live',
      home: 3,
      away: 1,
    });

    const emitted = MET(
      run({ observations: [AHEAD, official], previous: VIGENTE, now: at(60 * MINUTE) }).decision,
    );

    expect(emitted.rule).toBe('RN-02');
  });
});

describe('CA-9.2 y CA-9.3 — el vocabulario cerrado, y el suelo', () => {
  test('9. toda `rule` emitida sale de `DECISION_RULES`', () => {
    const scenes = [
      run({
        observations: [observation({ source: CEROACERO, at: at(5 * MINUTE), status: 'live', home: 1, away: 0 })],
        now: at(5 * MINUTE),
      }),
      run({
        observations: [observation({ source: OFFICIAL, at: at(5 * MINUTE), status: 'live', home: 1, away: 0 })],
        now: at(5 * MINUTE),
      }),
      run({
        observations: [observation({ source: OPERATOR, at: at(-30 * MINUTE), status: 'postponed' })],
        now: at(-30 * MINUTE),
      }),
    ];

    for (const scene of scenes) {
      const emitted = MET(scene.decision);
      expect(DECISION_RULES).toContain(emitted.rule);
      expect(emitted.rule).not.toBe('RN-05');
    }
  });

  test('10. y cuando la regla es el suelo, cuál coincide con la columna `provisional`', () => {
    const provisional = MET(
      run({
        observations: [
          observation({ source: CEROACERO, at: at(20 * MINUTE), status: 'live', home: 2, away: 0 }),
        ],
        previous: decision({
          status: 'live',
          home: 1,
          away: 0,
          provisional: true,
          rule: 'RN-03',
          version: 2,
        }),
        now: at(20 * MINUTE),
      }).decision,
    );
    expect(provisional.rule).toBe('RN-03');
    expect(provisional.provisional).toBe(true);

    const confirmed = MET(
      run({
        observations: [
          observation({ source: OFFICIAL, at: at(20 * MINUTE), status: 'live', home: 2, away: 0 }),
        ],
        previous: decision({
          status: 'live',
          home: 1,
          away: 0,
          provisional: true,
          rule: 'RN-03',
          version: 2,
        }),
        now: at(20 * MINUTE),
      }).decision,
    );
    expect(confirmed.rule).toBe('RN-02');
    expect(confirmed.provisional).toBe(false);
  });
});
