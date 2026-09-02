/**
 * CA-6 — RN-05: el conflicto no se publica, se alerta, y SOLO cuando persiste
 * (RN-05, ADR-021 §8.2, gate del 2026-09-02 que cerró F-SPEC-013-1).
 *
 * La letra que se implementa es la NUEVA: durante la ventana de gracia **sí se
 * publica** la observación más reciente marcada *provisional* (RN-03), y
 * `CONFLICT_GRACE` gobierna **solo la alerta**.
 */
import { describe, expect, test } from 'vitest';
import { CONFLICT_GRACE_MS } from '@/decide/thresholds';
import {
  BESOCCER,
  CEROACERO,
  MINUTE,
  OFFICIAL,
  OPERATOR,
  at,
  decision,
  observation,
  published,
  run,
} from './support/engine';
import type { Alert } from '@/decide/alert';
import type { Decision } from '@/model/decision';

const MET = (value: Decision | null): Decision => {
  if (value === null) throw new Error('esperaba una `Decision` y no salió ninguna');
  return value;
};

/** Dos fuentes de 0.7 que discrepan, y ninguna oficial. */
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
const DISAGREEING = [AHEAD, BEHIND];

/** La vigente: 1-1, que es lo que la rezagada sigue diciendo. */
const VIGENTE = decision({
  status: 'live',
  home: 1,
  away: 1,
  provisional: true,
  rule: 'RN-03',
  version: 4,
});

/** El instante en el que la discrepancia cumple la gracia: la más reciente + GRACE. */
const DEADLINE = Date.parse(AHEAD.observed_at) + CONFLICT_GRACE_MS;
const beforeBorder = new Date(DEADLINE - 1).toISOString();
const afterBorder = new Date(DEADLINE + 1).toISOString();

describe('CA-6.1 — durante la gracia NO es conflicto, y SE PUBLICA', () => {
  test('1. sale la más reciente de las dos, marcada provisional, y `held` es null', () => {
    const result = run({
      observations: DISAGREEING,
      previous: VIGENTE,
      now: at(50 * MINUTE),
    });

    const emitted = MET(result.decision);
    expect(published(emitted)).toBe('live 2-1');
    expect(emitted.provisional).toBe(true);
    expect(result.held).toBeNull();
    expect(result.alerts).toEqual([]);
  });

  test('2. y es «mejor provisional a tiempo»: no se gasta un minuto de latencia', () => {
    // La `Decision` sale en el mismo instante de la observación, no
    // `CONFLICT_GRACE` después.
    const emitted = MET(
      run({ observations: DISAGREEING, previous: VIGENTE, now: at(50 * MINUTE) }).decision,
    );

    expect(emitted.decided_at).toBe(at(50 * MINUTE));
  });
});

describe('CA-6.2 — pasada la gracia SÍ es conflicto: alerta, ninguna `Decision`', () => {
  test('3. justo ANTES del borde: SÍ hubo `Decision` y ninguna alerta', () => {
    const result = run({
      observations: DISAGREEING,
      previous: VIGENTE,
      now: beforeBorder,
    });

    expect(result.decision).not.toBeNull();
    expect(result.alerts).toEqual([]);
    expect(result.held).toBeNull();
  });

  test('4. justo DESPUÉS del borde: NO hay `Decision` y sí alerta', () => {
    const result = run({
      observations: DISAGREEING,
      previous: VIGENTE,
      now: afterBorder,
    });

    expect(result.decision).toBeNull();
    expect(result.held?.rule).toBe('RN-05');
    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0]?.rule).toBe('RN-05');
    expect(result.alerts[0]?.raised_at).toBe(afterBorder);
    expect([...(result.alerts[0]?.observation_ids ?? [])].sort()).toEqual(
      [AHEAD.id, BEHIND.id].sort(),
    );
  });

  test('5. y la vigente se mantiene TAL CUAL: no se despublica nada', () => {
    // «Se mantiene la última confirmada» se lee «se mantiene la VIGENTE»
    // (ADR-021 §8.2): la lectura literal obligaría a despublicar el partido
    // entero al primer desacuerdo, y eso contradice RN-03.
    const result = run({ observations: DISAGREEING, previous: VIGENTE, now: afterBorder });

    expect(result.decision).toBeNull();
    expect(published(VIGENTE)).toBe('live 1-1');
  });
});

describe('CA-6.3 — `CONFLICT_GRACE` gobierna SOLO la alerta', () => {
  test('6. lo publicado durante la gracia se atribuye por el orden normal: RN-03', () => {
    const emitted = MET(
      run({ observations: DISAGREEING, previous: VIGENTE, now: at(51 * MINUTE) }).decision,
    );

    expect(emitted.rule).toBe('RN-03');
    expect(emitted.rule).not.toBe('RN-05');
  });

  test('7. y RN-06 si además cambia el estado, nunca RN-05', () => {
    const aheadLive = observation({
      source: CEROACERO,
      at: at(5 * MINUTE),
      status: 'live',
      home: 1,
      away: 0,
    });
    const behindLive = observation({
      source: BESOCCER,
      at: at(4 * MINUTE),
      status: 'live',
      home: 0,
      away: 0,
    });

    const emitted = MET(
      run({
        observations: [aheadLive, behindLive],
        previous: decision({ status: 'scheduled', version: 1 }),
        now: at(5 * MINUTE),
      }).decision,
    );

    expect(emitted.status).toBe('live');
    expect(emitted.rule).toBe('RN-06');
  });

  test('8. el plazo no decide QUÉ se publica: decide si se abre alerta', () => {
    const during = run({ observations: DISAGREEING, previous: VIGENTE, now: beforeBorder });
    const after = run({ observations: DISAGREEING, previous: VIGENTE, now: afterBorder });

    expect(during.alerts).toHaveLength(0);
    expect(after.alerts).toHaveLength(1);
    // Lo que cambia entre los dos instantes es la alerta y la retención, y la
    // regla de lo publicado durante la gracia nunca es RN-05.
    expect(MET(during.decision).rule).not.toBe('RN-05');
  });
});

describe('CA-6.4 — la monotonía sigue aplicando durante la gracia', () => {
  test('9. dos fuentes alternándose no hacen retroceder el marcador', () => {
    // Cada observación nueva reinicia la gracia, así que nunca hay conflicto:
    // lo que impide la oscilación es RN-04 (CA-5.1), no RN-05.
    const steps = [
      observation({ source: CEROACERO, at: at(40 * MINUTE), status: 'live', home: 1, away: 0 }),
      observation({ source: BESOCCER, at: at(41 * MINUTE), status: 'live', home: 0, away: 0 }),
      observation({ source: CEROACERO, at: at(42 * MINUTE), status: 'live', home: 2, away: 0 }),
      observation({ source: BESOCCER, at: at(43 * MINUTE), status: 'live', home: 1, away: 0 }),
      observation({ source: CEROACERO, at: at(44 * MINUTE), status: 'live', home: 2, away: 0 }),
      observation({ source: BESOCCER, at: at(45 * MINUTE), status: 'live', home: 2, away: 0 }),
    ];

    let previous: Decision | null = null;
    const sequence: string[] = [];

    for (let index = 0; index < steps.length; index += 1) {
      const incoming = steps[index]!;
      const result = run({
        observations: steps.slice(0, index + 1),
        previous,
        now: incoming.observed_at,
        kind: 'observation',
        incoming,
      });
      if (result.decision !== null) {
        previous = result.decision;
        sequence.push(published(result.decision));
      }
    }

    // La secuencia publicada no retrocede: cada marcador es ≥ el anterior.
    expect(sequence.length).toBeGreaterThan(0);
    const homes = sequence.map((value) => Number(value.split(' ')[1]?.split('-')[0]));
    expect(homes).toEqual([...homes].sort((a, b) => a - b));
    expect(homes.at(-1)).toBe(2);
  });
});

describe('CA-6.5 — si la rezagada se pone al día dentro de la gracia, no hay alerta', () => {
  test('10. no se abre ninguna alerta, y la `Decision` no cambia', () => {
    const caughtUp = observation({
      source: BESOCCER,
      at: at(51 * MINUTE),
      status: 'live',
      home: 2,
      away: 1,
    });
    const alreadyPublished = decision({
      status: 'live',
      home: 2,
      away: 1,
      provisional: true,
      rule: 'RN-03',
      version: 5,
    });

    const result = run({
      observations: [AHEAD, caughtUp],
      previous: alreadyPublished,
      now: at(51 * MINUTE),
      kind: 'observation',
      incoming: caughtUp,
    });

    // No hay nada retenido que liberar: durante la gracia ya se publicó.
    expect(result.alerts).toEqual([]);
    expect(result.held).toBeNull();
    // La tupla publicada es la misma (CA-2.3), así que no se emite nada nuevo.
    expect(result.decision).toBeNull();
  });

  test('11. y salvo que la coincidencia activase la vía 2 de RN-02, que hoy nadie satisface', () => {
    const caughtUp = observation({
      source: BESOCCER,
      at: at(51 * MINUTE),
      status: 'live',
      home: 2,
      away: 1,
    });
    const alreadyPublished = decision({
      status: 'live',
      home: 2,
      away: 1,
      provisional: true,
      rule: 'RN-03',
      version: 5,
    });

    // Con la lista de producción: nada cambia (CA-3.4).
    expect(
      run({
        observations: [AHEAD, caughtUp],
        previous: alreadyPublished,
        now: at(51 * MINUTE),
        production: true,
      }).decision,
    ).toBeNull();

    // Con un par declarado independiente: la coincidencia confirma, y ESO sí
    // mueve el cualificador, que es parte de la tupla publicada.
    const confirmed = run({
      observations: [AHEAD, caughtUp],
      previous: alreadyPublished,
      now: at(51 * MINUTE),
      independence: [{ a: CEROACERO, b: BESOCCER, motive: 'sintético: doble de CA-6.5' }],
    });

    expect(MET(confirmed.decision).provisional).toBe(false);
    expect(confirmed.alerts).toEqual([]);
  });
});

describe('CA-6.6 — mientras la MISMA discrepancia persiste, una sola fila', () => {
  const firstAlert = (): Alert => {
    const raised = run({ observations: DISAGREEING, previous: VIGENTE, now: afterBorder }).alerts[0];
    if (raised === undefined) throw new Error('esperaba una alerta de conflicto');
    return { ...raised, id: 1 };
  };

  test('12. diez entradas `time` seguidas producen UNA fila', () => {
    const alert = firstAlert();
    let rows = 1;

    for (let minute = 1; minute <= 10; minute += 1) {
      const result = run({
        observations: DISAGREEING,
        previous: VIGENTE,
        now: new Date(Date.parse(afterBorder) + minute * MINUTE).toISOString(),
        alerts: { conflict: alert, silence: null },
        kind: 'time',
      });
      rows += result.alerts.length;
      // Y sigue sin publicarse nada: el conflicto no se publica.
      expect(result.decision).toBeNull();
    }

    expect(rows).toBe(1);
  });

  test('13. una discrepancia DISTINTA —otros valores— sí produce una segunda', () => {
    const alert = firstAlert();
    const moved = observation({
      source: CEROACERO,
      at: at(55 * MINUTE),
      status: 'live',
      home: 3,
      away: 1,
    });

    const result = run({
      observations: [moved, BEHIND],
      previous: VIGENTE,
      now: new Date(Date.parse(moved.observed_at) + CONFLICT_GRACE_MS + 1).toISOString(),
      alerts: { conflict: alert, silence: null },
    });

    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0]?.reason).not.toBe(alert.reason);
  });
});

describe('CA-6.7 — con la oficial (o el operador) dentro, no es conflicto', () => {
  test('14. si una de las dos es la OFICIAL, se publica lo que dice la oficial', () => {
    const officialSays = observation({
      source: OFFICIAL,
      at: at(49 * MINUTE),
      status: 'live',
      home: 1,
      away: 1,
    });

    const result = run({
      observations: [AHEAD, officialSays],
      previous: decision({ status: 'live', home: 0, away: 0, version: 1 }),
      now: afterBorder,
    });

    const emitted = MET(result.decision);
    expect(published(emitted)).toBe('live 1-1');
    expect(emitted.provisional).toBe(false);
    expect(result.alerts).toEqual([]);
  });

  test('15. y si interviene el operador, tampoco (CA-4.1)', () => {
    const operatorSays = observation({
      source: OPERATOR,
      at: at(49 * MINUTE),
      status: 'live',
      home: 1,
      away: 1,
    });

    const result = run({
      observations: [AHEAD, operatorSays],
      previous: decision({ status: 'live', home: 0, away: 0, version: 1 }),
      now: afterBorder,
    });

    expect(result.alerts).toEqual([]);
    expect(MET(result.decision).rule).toBe('RN-01');
  });
});

describe('CA-6.8 — `CONFLICT_GRACE` vive en UN SOLO SITIO', () => {
  test('16. cambiarlo mueve el borde de CA-6.2, sin tocar ningún otro número', () => {
    const longer = CONFLICT_GRACE_MS * 3;
    const stillGrace = new Date(Date.parse(AHEAD.observed_at) + longer - 1).toISOString();
    const nowConflict = new Date(Date.parse(AHEAD.observed_at) + longer + 1).toISOString();

    // Con el plazo alargado, el instante que ANTES era conflicto ya no lo es.
    const notYet = run({
      observations: DISAGREEING,
      previous: VIGENTE,
      now: afterBorder,
      thresholds: { conflictGraceMs: longer },
    });
    expect(notYet.alerts).toEqual([]);
    expect(notYet.decision).not.toBeNull();

    // El borde se ha movido entero, y solo él.
    expect(
      run({
        observations: DISAGREEING,
        previous: VIGENTE,
        now: stillGrace,
        thresholds: { conflictGraceMs: longer },
      }).alerts,
    ).toEqual([]);
    expect(
      run({
        observations: DISAGREEING,
        previous: VIGENTE,
        now: nowConflict,
        thresholds: { conflictGraceMs: longer },
      }).alerts,
    ).toHaveLength(1);
  });

  test('17. y con el plazo a cero, toda discrepancia es conflicto de inmediato', () => {
    const result = run({
      observations: DISAGREEING,
      previous: VIGENTE,
      now: at(50 * MINUTE),
      thresholds: { conflictGraceMs: 0 },
    });

    expect(result.decision).toBeNull();
    expect(result.alerts).toHaveLength(1);
  });
});
