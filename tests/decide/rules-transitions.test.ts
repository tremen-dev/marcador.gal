/**
 * CA-7 — RN-06: las transiciones de estado, con su tabla CERRADA para las
 * fuentes automáticas (RN-06, ADR-021 §8.3).
 */
import { describe, expect, test } from 'vitest';
import { qualifierOf } from '@/decide/qualifier';
import { FINISH_TIMEOUT_MS, LIVE_LEAD_MS } from '@/decide/thresholds';
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
import type { MatchStatus } from '@/model/match';

const MET = (value: Decision | null): Decision => {
  if (value === null) throw new Error('esperaba una `Decision` y no salió ninguna');
  return value;
};

const SCHEDULED = decision({ status: 'scheduled', provisional: true, rule: 'RN-03', version: 1 });

describe('CA-7.1 — `scheduled → live` con la primera observación DESPUÉS de kickoff − 2 min', () => {
  test('1. justo en `kickoff − 2 min`: transiciona', () => {
    const play = observation({
      source: CEROACERO,
      at: at(-LIVE_LEAD_MS),
      status: 'live',
      home: 0,
      away: 0,
    });

    const result = run({
      observations: [play],
      previous: SCHEDULED,
      now: at(-LIVE_LEAD_MS),
      kind: 'observation',
      incoming: play,
    });

    expect(MET(result.decision).status).toBe('live');
  });

  test('2. un milisegundo ANTES: no transiciona, y la observación se guarda igual', () => {
    const tooEarly = observation({
      source: CEROACERO,
      at: at(-LIVE_LEAD_MS - 1),
      status: 'live',
      home: 0,
      away: 0,
    });

    const result = run({
      observations: [tooEarly],
      previous: SCHEDULED,
      now: at(-LIVE_LEAD_MS - 1),
      kind: 'observation',
      incoming: tooEarly,
    });

    expect(result.decision).toBeNull();
    // RN-13: el motor no la borra ni la edita. Sigue entera.
    expect(tooEarly.status).toBe('live');
  });
});

describe('CA-7.2 — `live → finished`: las tres vías de RN-06', () => {
  const live = decision({
    status: 'live',
    home: 2,
    away: 1,
    provisional: true,
    rule: 'RN-03',
    version: 3,
  });

  test('3. por fuente OFICIAL', () => {
    const closes = observation({
      source: OFFICIAL,
      at: at(95 * MINUTE),
      status: 'finished',
      home: 2,
      away: 1,
    });

    const emitted = MET(
      run({ observations: [closes], previous: live, now: at(95 * MINUTE) }).decision,
    );
    expect(emitted.status).toBe('finished');
    expect(emitted.provisional).toBe(false);
  });

  test('4. por DOS FUENTES COINCIDENTES —coincidentes, no independientes—', () => {
    const one = observation({
      source: CEROACERO,
      at: at(95 * MINUTE),
      status: 'finished',
      home: 2,
      away: 1,
    });
    const two = observation({
      source: BESOCCER,
      at: at(96 * MINUTE),
      status: 'finished',
      home: 2,
      away: 1,
    });

    const emitted = MET(
      run({ observations: [one, two], previous: live, now: at(96 * MINUTE) }).decision,
    );

    expect(emitted.status).toBe('finished');
    // Y el cualificador de esa `Decision` lo sigue decidiendo RN-02/RN-03, que
    // SÍ exige independencia declarada: dos espejos cierran el partido, pero no
    // lo confirman.
    expect(emitted.provisional).toBe(true);
  });

  test('5. una SOLA fuente automática no cierra el partido', () => {
    const alone = observation({
      source: CEROACERO,
      at: at(95 * MINUTE),
      status: 'finished',
      home: 2,
      away: 1,
    });

    expect(run({ observations: [alone], previous: live, now: at(95 * MINUTE) }).decision)
      .toBeNull();
  });

  test('6. por `kickoff + 110 min` SIN SEÑAL, con reloj falso', () => {
    const stale = observation({
      source: CEROACERO,
      at: at(100 * MINUTE),
      status: 'live',
      home: 2,
      away: 1,
    });

    const emitted = MET(
      run({
        observations: [stale],
        previous: live,
        now: at(FINISH_TIMEOUT_MS),
        kind: 'time',
      }).decision,
    );

    expect(emitted.status).toBe('finished');
    expect([emitted.home_score, emitted.away_score]).toEqual([2, 1]);
  });

  test('7. y un milisegundo antes del timeout, sigue `live`', () => {
    const stale = observation({
      source: CEROACERO,
      at: at(100 * MINUTE),
      status: 'live',
      home: 2,
      away: 1,
    });

    expect(
      run({
        observations: [stale],
        previous: live,
        now: at(FINISH_TIMEOUT_MS - 1),
        kind: 'time',
      }).decision,
    ).toBeNull();
  });
});

describe('CA-7.3 — el `finished` por timeout no tiene apoyo que diga `finished`', () => {
  test('8. y de ahí sale su cualificador *pendente de confirmar*', () => {
    const stale = observation({
      source: CEROACERO,
      at: at(100 * MINUTE),
      status: 'live',
      home: 2,
      away: 1,
    });

    const emitted = MET(
      run({
        observations: [stale],
        previous: decision({ status: 'live', home: 2, away: 1, version: 3 }),
        now: at(FINISH_TIMEOUT_MS),
      }).decision,
    );

    expect(emitted.supporting_observation_ids).toEqual([stale.id]);
    expect(stale.status).not.toBe('finished');
    expect(qualifierOf(emitted, [stale])).toBe('pendente_de_confirmar');
  });
});

describe('CA-7.4 — `postponed` y `suspended` SOLO por oficial o humano', () => {
  test('9. una observación `postponed` de `ceroacero` (0.7) NO transiciona', () => {
    const postponed = observation({
      source: CEROACERO,
      at: at(-30 * MINUTE),
      status: 'postponed',
    });

    expect(
      run({
        observations: [postponed],
        previous: SCHEDULED,
        now: at(-30 * MINUTE),
        kind: 'observation',
        incoming: postponed,
      }).decision,
    ).toBeNull();
  });

  test('10. la misma del `correspondent` (0.8) SÍ, y sale `provisional: true`', () => {
    const postponed = observation({
      source: CORRESPONDENT,
      at: at(-30 * MINUTE),
      status: 'postponed',
    });

    const emitted = MET(
      run({ observations: [postponed], previous: SCHEDULED, now: at(-30 * MINUTE) }).decision,
    );

    expect(emitted.status).toBe('postponed');
    expect(emitted.provisional).toBe(true);
  });

  test('11. y la del `operator` sale `provisional: false`', () => {
    const postponed = observation({
      source: OPERATOR,
      at: at(-30 * MINUTE),
      status: 'postponed',
    });

    const emitted = MET(
      run({ observations: [postponed], previous: SCHEDULED, now: at(-30 * MINUTE) }).decision,
    );

    expect(emitted.status).toBe('postponed');
    expect(emitted.provisional).toBe(false);
  });

  test('12. `suspended` sigue la misma tabla: automática no, humano sí', () => {
    const live = decision({
      status: 'live',
      home: 1,
      away: 0,
      provisional: true,
      rule: 'RN-03',
      version: 2,
    });

    const automatic = observation({
      source: CEROACERO,
      at: at(60 * MINUTE),
      status: 'suspended',
      home: 1,
      away: 0,
    });
    expect(run({ observations: [automatic], previous: live, now: at(60 * MINUTE) }).decision)
      .toBeNull();

    const human = observation({
      source: CORRESPONDENT,
      at: at(60 * MINUTE),
      status: 'suspended',
      home: 1,
      away: 0,
    });
    expect(
      MET(run({ observations: [human], previous: live, now: at(60 * MINUTE) }).decision).status,
    ).toBe('suspended');
  });
});

describe('CA-7.5 — la tabla es CERRADA para las fuentes automáticas', () => {
  const REFUSED = [
    {
      what: 'finished → live',
      previous: decision({
        status: 'finished',
        home: 2,
        away: 1,
        provisional: true,
        rule: 'RN-03',
        version: 4,
      }),
      says: observation({
        source: CEROACERO,
        at: at(100 * MINUTE),
        status: 'live',
        home: 2,
        away: 1,
      }),
      now: at(100 * MINUTE),
    },
    {
      what: 'live → scheduled',
      previous: decision({
        status: 'live',
        home: 2,
        away: 1,
        provisional: true,
        rule: 'RN-03',
        version: 4,
      }),
      says: observation({ source: CEROACERO, at: at(60 * MINUTE), status: 'scheduled' }),
      now: at(60 * MINUTE),
    },
    {
      what: 'postponed → live',
      previous: decision({ status: 'postponed', provisional: true, rule: 'RN-03', version: 2 }),
      says: observation({
        source: CEROACERO,
        at: at(20 * MINUTE),
        status: 'live',
        home: 1,
        away: 0,
      }),
      now: at(20 * MINUTE),
    },
  ] as const;

  test.each(REFUSED)('13. $what desde una automática NO produce `Decision`', (refused) => {
    const result = run({
      observations: [refused.says],
      previous: refused.previous,
      now: refused.now,
      kind: 'observation',
      incoming: refused.says,
    });

    expect(result.decision).toBeNull();
  });

  test('14. y la lista de lo permitido para una automática es exactamente ésta', () => {
    // La enumeración de lo permitido, y el resto vacío: lo que RN-06 escribe
    // es todo lo que una fuente automática puede provocar.
    const allowed = ['scheduled→live', 'live→finished'];
    const all: string[] = [];

    for (const from of ['scheduled', 'live', 'finished', 'postponed', 'suspended'] as const) {
      for (const to of ['scheduled', 'live', 'finished', 'postponed', 'suspended'] as const) {
        if (from === to) continue;
        all.push(`${from}→${to}`);
      }
    }

    const forbidden = all.filter((transition) => !allowed.includes(transition));
    expect(forbidden).toHaveLength(18);

    for (const transition of forbidden) {
      const [from, to] = transition.split('→') as [MatchStatus, MatchStatus];
      const scored = (status: MatchStatus): boolean =>
        status === 'live' || status === 'finished' || status === 'suspended';

      const previous = decision({
        status: from,
        home: scored(from) ? 1 : undefined,
        away: scored(from) ? 0 : undefined,
        provisional: true,
        rule: 'RN-03',
        version: 3,
      });
      const says = observation({
        source: CEROACERO,
        at: at(60 * MINUTE),
        status: to,
        home: scored(to) ? 1 : undefined,
        away: scored(to) ? 0 : undefined,
      });

      const result = run({
        observations: [says],
        previous,
        now: at(60 * MINUTE),
        kind: 'observation',
        incoming: says,
      });

      const emitted = result.decision;
      expect(emitted === null || emitted.status === from, `${transition} transicionó`).toBe(true);
    }
  });

  /**
   * Para cada destino, un origen DISTINTO y sin marcador —`postponed` o
   * `scheduled`—, para que lo que se mida sea la transición y no la retención
   * de RN-04, que es otra regla.
   */
  const originFor = (target: MatchStatus) => (target === 'postponed' ? 'scheduled' : 'postponed');

  test.each(['scheduled', 'live', 'finished', 'postponed', 'suspended'] as const)(
    '15. la OFICIAL puede llevar el partido a %s',
    (target) => {
      const scored = target === 'live' || target === 'finished' || target === 'suspended';
      const says = observation({
        source: OFFICIAL,
        at: at(60 * MINUTE),
        status: target,
        home: scored ? 3 : undefined,
        away: scored ? 2 : undefined,
      });

      const emitted = MET(
        run({
          observations: [says],
          previous: decision({
            status: originFor(target),
            provisional: true,
            rule: 'RN-03',
            version: 5,
          }),
          now: at(60 * MINUTE),
        }).decision,
      );

      expect(emitted.status).toBe(target);
    },
  );

  test.each(['scheduled', 'live', 'finished', 'postponed', 'suspended'] as const)(
    '16. y el HUMANO —el corresponsal, 0.8— también, a %s',
    (target) => {
      const scored = target === 'live' || target === 'finished' || target === 'suspended';
      const says = observation({
        source: CORRESPONDENT,
        at: at(60 * MINUTE),
        status: target,
        home: scored ? 3 : undefined,
        away: scored ? 2 : undefined,
      });

      const emitted = MET(
        run({
          observations: [says],
          previous: decision({
            status: originFor(target),
            provisional: true,
            rule: 'RN-03',
            version: 5,
          }),
          now: at(60 * MINUTE),
        }).decision,
      );

      expect(emitted.status).toBe(target);
      // Y lo que publica sale *provisional*, porque 0.8 < 0.9 (RN-03).
      expect(emitted.provisional).toBe(true);
    },
  );
});
