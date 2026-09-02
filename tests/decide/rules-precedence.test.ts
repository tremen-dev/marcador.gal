/**
 * CA-4 — la precedencia del operador resuelve el empate a 1.0 y no es un
 * conflicto (RN-01, RN-05 salvedad, RN-12 escalón 1).
 * CA-5 — RN-04: un marcador no baja, y un salto de más de dos goles se retiene
 * (RN-04, ADR-021 §8.1).
 */
import { describe, expect, test } from 'vitest';
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

// ─────────────────────────────────────────────────────────────────────────────
// CA-4
// ─────────────────────────────────────────────────────────────────────────────

const officialSays = observation({
  source: OFFICIAL,
  at: at(50 * MINUTE),
  status: 'live',
  home: 2,
  away: 1,
});

const operatorSays = observation({
  source: OPERATOR,
  at: at(52 * MINUTE),
  status: 'live',
  home: 1,
  away: 1,
});

const vigente = decision({
  status: 'live',
  home: 2,
  away: 1,
  provisional: false,
  rule: 'RN-02',
  version: 3,
});

describe('CA-4 — se publica lo que dice el operador, confirmado, con `rule: RN-01`', () => {
  test('1. la oficial dice 2-1 y el operador la contradice: gana el operador', () => {
    const result = run({
      observations: [officialSays, operatorSays],
      previous: vigente,
      now: at(52 * MINUTE),
      kind: 'observation',
      incoming: operatorSays,
    });

    const emitted = MET(result.decision);
    expect([emitted.home_score, emitted.away_score]).toEqual([1, 1]);
    expect(emitted.provisional).toBe(false);
    expect(emitted.rule).toBe('RN-01');
  });

  test('2. CA-4.1: NO se emite alerta de conflicto y no se retiene nada', () => {
    const result = run({
      observations: [officialSays, operatorSays],
      previous: vigente,
      now: at(52 * MINUTE),
    });

    expect(result.alerts).toEqual([]);
    expect(result.held).toBeNull();
  });

  test('3. CA-4.1: y sigue sin ser conflicto pasada la gracia entera', () => {
    // Una discrepancia en la que interviene el operador NO es un conflicto,
    // por mucho que persista (RN-05, salvedad).
    const result = run({
      observations: [officialSays, operatorSays],
      previous: vigente,
      now: at(72 * MINUTE),
    });

    expect(result.alerts.filter((alert) => alert.rule === 'RN-05')).toEqual([]);
    expect(MET(result.decision).rule).toBe('RN-01');
  });
});

describe('CA-4.2 — el caso simétrico, y el corresponsal que no tiene precedencia', () => {
  test('4. la oficial contradice DESPUÉS y el operador sigue ganando', () => {
    const officialLater = observation({
      source: OFFICIAL,
      at: at(60 * MINUTE),
      status: 'live',
      home: 2,
      away: 1,
    });

    const result = run({
      observations: [operatorSays, officialLater],
      previous: vigente,
      now: at(60 * MINUTE),
      kind: 'observation',
      incoming: officialLater,
    });

    const emitted = MET(result.decision);
    expect([emitted.home_score, emitted.away_score]).toEqual([1, 1]);
    expect(emitted.rule).toBe('RN-01');
  });

  test('5. el corresponsal (0.8) frente a la oficial PIERDE, por peso y no por rol', () => {
    const correspondentSays = observation({
      source: CORRESPONDENT,
      at: at(60 * MINUTE),
      status: 'live',
      home: 3,
      away: 1,
    });

    const result = run({
      observations: [officialSays, correspondentSays],
      previous: decision({ status: 'live', home: 1, away: 1, version: 1 }),
      now: at(60 * MINUTE),
    });

    const emitted = MET(result.decision);
    expect([emitted.home_score, emitted.away_score]).toEqual([2, 1]);
    expect(emitted.rule).not.toBe('RN-01');
  });
});

describe('CA-4.3 — el escalón 1 gana aunque cambie el estado o el marcador', () => {
  test('6. el operador cierra el partido contradiciendo a la oficial: `rule` es RN-01', () => {
    const operatorFinishes = observation({
      source: OPERATOR,
      at: at(100 * MINUTE),
      status: 'finished',
      home: 3,
      away: 1,
    });
    const officialLive = observation({
      source: OFFICIAL,
      at: at(99 * MINUTE),
      status: 'live',
      home: 2,
      away: 1,
    });

    const result = run({
      observations: [officialLive, operatorFinishes],
      previous: decision({ status: 'live', home: 2, away: 1, version: 4 }),
      now: at(100 * MINUTE),
    });

    const emitted = MET(result.decision);
    expect(emitted.status).toBe('finished');
    expect(emitted.rule).toBe('RN-01');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CA-5
// ─────────────────────────────────────────────────────────────────────────────

/** La `Decision` vigente de CA-5: 2-1 sostenida por `ceroacero` (0.7). */
const twoOne = decision({
  status: 'live',
  home: 2,
  away: 1,
  provisional: true,
  rule: 'RN-03',
  version: 2,
});

describe('CA-5.1 — un marcador no baja desde una fuente automática', () => {
  test('7. `ceroacero` dice 1-1: no se publica, y `held` nombra RN-04', () => {
    const lower = observation({
      source: CEROACERO,
      at: at(60 * MINUTE),
      status: 'live',
      home: 1,
      away: 1,
    });

    const result = run({
      observations: [lower],
      previous: twoOne,
      now: at(60 * MINUTE),
      kind: 'observation',
      incoming: lower,
    });

    expect(result.decision).toBeNull();
    expect(result.held?.rule).toBe('RN-04');
    // Y la `Observation` existe igualmente (RN-13): el motor no la borra ni la
    // edita — es un valor de entrada y sale intacto.
    expect(lower.home_score).toBe(1);
  });
});

describe('CA-5.2 — un humano SÍ puede bajarlo, y su peso decide el cualificador', () => {
  test('8. el corresponsal (0.8) dice 1-1: se publica provisional, `rule` RN-04', () => {
    const lower = observation({
      source: CORRESPONDENT,
      at: at(60 * MINUTE),
      status: 'live',
      home: 1,
      away: 1,
    });

    const result = run({
      observations: [lower],
      previous: twoOne,
      now: at(60 * MINUTE),
      kind: 'observation',
      incoming: lower,
    });

    const emitted = MET(result.decision);
    expect([emitted.home_score, emitted.away_score]).toEqual([1, 1]);
    expect(emitted.provisional).toBe(true);
    expect(emitted.rule).toBe('RN-04');
  });

  test('9. el operador (1.0) dice 1-1: se publica confirmada, `rule` RN-04', () => {
    const lower = observation({
      source: OPERATOR,
      at: at(60 * MINUTE),
      status: 'live',
      home: 1,
      away: 1,
    });

    const result = run({
      observations: [lower],
      previous: twoOne,
      now: at(60 * MINUTE),
      kind: 'observation',
      incoming: lower,
    });

    const emitted = MET(result.decision);
    expect([emitted.home_score, emitted.away_score]).toEqual([1, 1]);
    expect(emitted.provisional).toBe(false);
    expect(emitted.rule).toBe('RN-04');
  });
});

describe('CA-5.3 — el salto de más de dos goles se retiene hasta segunda fuente', () => {
  const jump = observation({
    source: CEROACERO,
    at: at(60 * MINUTE),
    status: 'live',
    home: 5,
    away: 1,
  });

  test('10. 2-1 → 5-1 (salto de 3) desde una sola fuente: retenido', () => {
    const result = run({
      observations: [jump],
      previous: twoOne,
      now: at(60 * MINUTE),
      kind: 'observation',
      incoming: jump,
    });

    expect(result.decision).toBeNull();
    expect(result.held?.rule).toBe('RN-04');
  });

  test('11. y cuando una SEGUNDA fuente dice también 5-1, se publica con las dos', () => {
    const second = observation({
      source: BESOCCER,
      at: at(61 * MINUTE),
      status: 'live',
      home: 5,
      away: 1,
    });

    const result = run({
      observations: [jump, second],
      previous: twoOne,
      now: at(61 * MINUTE),
      kind: 'observation',
      incoming: second,
    });

    const emitted = MET(result.decision);
    expect([emitted.home_score, emitted.away_score]).toEqual([5, 1]);
    expect(emitted.rule).toBe('RN-04');
    expect([...emitted.supporting_observation_ids].sort()).toEqual([jump.id, second.id].sort());
  });

  test('12. el borde: un salto de EXACTAMENTE 2 goles (2-1 → 4-1) no se retiene', () => {
    const two = observation({
      source: CEROACERO,
      at: at(60 * MINUTE),
      status: 'live',
      home: 4,
      away: 1,
    });

    const result = run({
      observations: [two],
      previous: twoOne,
      now: at(60 * MINUTE),
      kind: 'observation',
      incoming: two,
    });

    const emitted = MET(result.decision);
    expect([emitted.home_score, emitted.away_score]).toEqual([4, 1]);
    expect(result.held).toBeNull();
  });

  test('13. y al otro lado del borde, 3 goles (2-1 → 4-2), sí se retiene', () => {
    const three = observation({
      source: CEROACERO,
      at: at(60 * MINUTE),
      status: 'live',
      home: 4,
      away: 2,
    });

    const result = run({
      observations: [three],
      previous: twoOne,
      now: at(60 * MINUTE),
      kind: 'observation',
      incoming: three,
    });

    expect(result.decision).toBeNull();
    expect(result.held?.rule).toBe('RN-04');
  });
});

describe('CA-5.4 — la retención NO alcanza a ≥ 0.9 (ADR-021 §8.1)', () => {
  test('14. el mismo 5-1 desde el `operator` publica de inmediato', () => {
    // El motivo está escrito en la regla: con la oficial no capturable
    // (ADR-008 §1) la segunda fuente que liberaría un 0-4 del operador NO
    // EXISTE, así que retenerlo lo retendría para siempre — y RN-02 ya declara
    // que ≥ 0.9 basta para publicar confirmado.
    const jump = observation({
      source: OPERATOR,
      at: at(60 * MINUTE),
      status: 'live',
      home: 5,
      away: 1,
    });

    const result = run({
      observations: [jump],
      previous: twoOne,
      now: at(60 * MINUTE),
      kind: 'observation',
      incoming: jump,
    });

    const emitted = MET(result.decision);
    expect([emitted.home_score, emitted.away_score]).toEqual([5, 1]);
    expect(emitted.provisional).toBe(false);
    expect(result.held).toBeNull();
  });

  test('15. y desde la oficial (1.0) tampoco se retiene', () => {
    const jump = observation({
      source: OFFICIAL,
      at: at(60 * MINUTE),
      status: 'live',
      home: 5,
      away: 1,
    });

    const result = run({
      observations: [jump],
      previous: twoOne,
      now: at(60 * MINUTE),
    });

    expect(MET(result.decision).home_score).toBe(5);
  });
});

describe('CA-5.5 — sin `Decision` previa no hay marcador del que bajar', () => {
  test('16. RN-04 no aplica y no impide la primera publicación', () => {
    const first = observation({
      source: CEROACERO,
      at: at(5 * MINUTE),
      status: 'live',
      home: 4,
      away: 3,
    });

    const result = run({
      observations: [first],
      previous: null,
      now: at(5 * MINUTE),
      kind: 'observation',
      incoming: first,
    });

    const emitted = MET(result.decision);
    expect([emitted.home_score, emitted.away_score]).toEqual([4, 3]);
    expect(result.held).toBeNull();
  });
});
