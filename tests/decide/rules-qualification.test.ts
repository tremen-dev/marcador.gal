/**
 * CA-1.2, CA-2 y CA-3 — el peso que se evalúa, el cualificador de la
 * `Decision` entera en las cinco ramas, y la segunda vía de RN-02.
 */
import { describe, expect, test } from 'vitest';
import { RN01_WEIGHTS } from '@/ingest/sources';
import {
  BESOCCER,
  CEROACERO,
  CORRESPONDENT,
  KICKOFF,
  MINUTE,
  OFFICIAL,
  OPERATOR,
  SYNTHETIC_A,
  SYNTHETIC_B,
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

describe('CA-1.2 — el umbral se evalúa contra `observation.confidence`', () => {
  test('1. una observación de `ceroacero` con `confidence: 0.95` sale CONFIRMADA', () => {
    // Posible porque RN-13 congela lo observado: el `confidence` es un hecho
    // histórico como el marcador (RN-01, aclaración del 2026-09-02).
    const result = run({
      observations: [
        observation({ source: CEROACERO, at: at(5 * MINUTE), status: 'live', home: 2, away: 1, confidence: 0.95 }),
      ],
      now: at(5 * MINUTE),
    });

    expect(MET(result.decision).provisional).toBe(false);
  });

  test('2. y la tabla de pesos de hoy NO cambia ese resultado', () => {
    // El peso de `ceroacero` en la tabla sigue siendo 0.7: si el reducer lo
    // leyese de ahí, el caso anterior habría salido provisional.
    expect(RN01_WEIGHTS.aggregator).toBe(0.7);

    const sameSourceAtTableWeight = run({
      observations: [
        observation({ source: CEROACERO, at: at(5 * MINUTE), status: 'live', home: 2, away: 1 }),
      ],
      now: at(5 * MINUTE),
    });

    expect(MET(sameSourceAtTableWeight.decision).provisional).toBe(true);
  });
});

/** Las cinco ramas, una por caso, con su cualificador esperado. */
const BRANCHES = [
  {
    branch: 'scheduled',
    scene: () => ({
      observations: [observation({ source: CEROACERO, at: at(-30 * MINUTE), status: 'scheduled' })],
      now: at(-30 * MINUTE),
      previous: null,
    }),
    provisional: true,
    rule: 'RN-03',
  },
  {
    branch: 'live',
    scene: () => ({
      observations: [
        observation({ source: CEROACERO, at: at(5 * MINUTE), status: 'live', home: 1, away: 0 }),
      ],
      now: at(5 * MINUTE),
      previous: decision({ status: 'scheduled', version: 1 }),
    }),
    provisional: true,
    rule: 'RN-06',
  },
  {
    branch: 'finished',
    scene: () => ({
      observations: [
        observation({ source: OFFICIAL, at: at(95 * MINUTE), status: 'finished', home: 2, away: 1 }),
      ],
      now: at(95 * MINUTE),
      previous: decision({ status: 'live', home: 2, away: 1, version: 2 }),
    }),
    provisional: false,
    rule: 'RN-06',
  },
  {
    branch: 'postponed',
    scene: () => ({
      observations: [observation({ source: OPERATOR, at: at(-60 * MINUTE), status: 'postponed' })],
      now: at(-60 * MINUTE),
      previous: null,
    }),
    provisional: false,
    rule: 'RN-06',
  },
  {
    branch: 'suspended',
    scene: () => ({
      observations: [
        observation({ source: CORRESPONDENT, at: at(60 * MINUTE), status: 'suspended', home: 1, away: 0 }),
      ],
      now: at(60 * MINUTE),
      previous: decision({ status: 'live', home: 1, away: 0, version: 1 }),
    }),
    provisional: true,
    rule: 'RN-06',
  },
] as const;

describe('CA-2 — RN-02 y RN-03 califican la `Decision` entera, en las cinco ramas', () => {
  test.each(BRANCHES)('3. rama $branch: `provisional` es la negación de RN-02', (branchCase) => {
    const result = run(branchCase.scene());
    const emitted = MET(result.decision);

    expect(emitted.status).toBe(branchCase.branch as MatchStatus);
    expect(emitted.provisional).toBe(branchCase.provisional);
    expect(emitted.rule).toBe(branchCase.rule);
  });

  test('4. en las dos ramas sin marcador el cualificador califica el ESTADO', () => {
    const scheduled = MET(run(BRANCHES[0].scene()).decision);
    const postponed = MET(run(BRANCHES[3].scene()).decision);

    // Sin marcador que poner en gris, y aun así calificadas: `scheduled`
    // sostenida solo por 0.7 es provisional, `postponed` del operador no.
    expect([scheduled.home_score, scheduled.away_score]).toEqual([null, null]);
    expect(scheduled.provisional).toBe(true);
    expect([postponed.home_score, postponed.away_score]).toEqual([null, null]);
    expect(postponed.provisional).toBe(false);
  });
});

describe('CA-2.1 — una fuente de peso ≥ 0.9 basta', () => {
  test('5. `confirmado` con UNA sola observación', () => {
    const result = run({
      observations: [
        observation({ source: OFFICIAL, at: at(5 * MINUTE), status: 'live', home: 1, away: 0 }),
      ],
      now: at(5 * MINUTE),
      previous: decision({ status: 'scheduled', version: 1 }),
    });

    const emitted = MET(result.decision);
    expect(emitted.provisional).toBe(false);
    expect(emitted.supporting_observation_ids).toHaveLength(1);
  });
});

describe('CA-2.2 — ninguna tercera opción, y ninguna rama exenta', () => {
  test('6. toda `Decision` emitida tiene `provisional` en `true` o en `false`', () => {
    for (const branchCase of BRANCHES) {
      const emitted = MET(run(branchCase.scene()).decision);

      expect(typeof emitted.provisional).toBe('boolean');
      // Y su valor es exactamente la negación de la condición de RN-02: sin
      // par independiente declarado, «peso ≥ 0.9».
      const support = emitted.supporting_observation_ids;
      expect(support.length).toBeGreaterThan(0);
      expect(emitted.provisional).toBe(branchCase.provisional);
    }
  });

  test('7. y no hay camino del reducer que emita sin evaluarla', () => {
    // Las cinco ramas, y también los caminos que no vienen de una observación
    // nueva: el silencio de RN-07 y el `finished` por timeout de RN-06.
    const silence = MET(
      run({
        observations: [
          observation({ source: CEROACERO, at: at(5 * MINUTE), status: 'live', home: 1, away: 0 }),
        ],
        now: at(25 * MINUTE),
        previous: decision({ status: 'live', home: 1, away: 0, version: 1 }),
      }).decision,
    );
    expect(typeof silence.provisional).toBe('boolean');

    const timeout = MET(
      run({
        observations: [
          observation({ source: CEROACERO, at: at(100 * MINUTE), status: 'live', home: 1, away: 0 }),
        ],
        now: at(111 * MINUTE),
        previous: decision({ status: 'live', home: 1, away: 0, version: 1 }),
      }).decision,
    );
    expect(typeof timeout.provisional).toBe('boolean');
  });
});

describe('CA-2.3 — el motor no emite una `Decision` por tick', () => {
  test('8. diez entradas `time` sobre un partido tranquilo: CERO decisiones', () => {
    const previous = decision({ status: 'live', home: 1, away: 0, version: 1 });
    const observations = [
      observation({ source: CEROACERO, at: at(10 * MINUTE), status: 'live', home: 1, away: 0 }),
    ];

    let emitted = 0;
    for (let minute = 11; minute <= 20; minute += 1) {
      const result = run({ observations, previous, now: at(minute * MINUTE), kind: 'time' });
      if (result.decision !== null) emitted += 1;
      expect(result.held).toBeNull();
      expect(result.alerts).toEqual([]);
    }

    expect(emitted).toBe(0);
  });
});

describe('CA-2.4 — `decided_at`, `version` y el apoyo de RN-12', () => {
  test('9. en las cinco ramas: `decided_at` es el `now` inyectado como cadena `Z`', () => {
    for (const branchCase of BRANCHES) {
      const scene = branchCase.scene();
      const emitted = MET(run(scene).decision);

      expect(emitted.decided_at).toBe(scene.now);
      expect(emitted.decided_at.endsWith('Z')).toBe(true);
    }
  });

  test('10. `version` es `previous.version + 1`, o 1 sin previa', () => {
    for (const branchCase of BRANCHES) {
      const scene = branchCase.scene();
      const emitted = MET(run(scene).decision);
      const expected = scene.previous === null ? 1 : scene.previous.version + 1;

      expect(emitted.version).toBe(expected);
    }
  });

  test('11. y `supporting_observation_ids` nunca está vacío (RN-12)', () => {
    for (const branchCase of BRANCHES) {
      expect(MET(run(branchCase.scene()).decision).supporting_observation_ids.length)
        .toBeGreaterThanOrEqual(1);
    }
  });
});

describe('CA-3.2 — la vía 2 de RN-02, con una lista INYECTADA', () => {
  const twoSynthetic = [
    observation({ source: SYNTHETIC_A, at: at(4 * MINUTE), status: 'live', home: 2, away: 1 }),
    observation({ source: SYNTHETIC_B, at: at(5 * MINUTE), status: 'live', home: 2, away: 1 }),
  ];

  test('12. dos coincidentes declaradas independientes: CONFIRMADA con las dos', () => {
    const result = run({
      observations: twoSynthetic,
      now: at(5 * MINUTE),
      independence: [{ a: SYNTHETIC_A, b: SYNTHETIC_B, motive: 'sintético: doble de CA-3.2' }],
    });

    const emitted = MET(result.decision);
    expect(emitted.provisional).toBe(false);
    expect([...emitted.supporting_observation_ids].sort()).toEqual(
      twoSynthetic.map((value) => value.id).sort(),
    );
  });

  test('13. sin la lista, el MISMO escenario sale provisional', () => {
    expect(MET(run({ observations: twoSynthetic, now: at(5 * MINUTE) }).decision).provisional)
      .toBe(true);
  });
});

describe('CA-3.3 — la vía exige AMBAS ≥ 0.7', () => {
  test('14. con una de las dos en 0.5, no se confirma', () => {
    const result = run({
      observations: [
        observation({ source: SYNTHETIC_A, at: at(4 * MINUTE), status: 'live', home: 2, away: 1 }),
        observation({
          source: SYNTHETIC_B,
          at: at(5 * MINUTE),
          status: 'live',
          home: 2,
          away: 1,
          confidence: 0.5,
        }),
      ],
      now: at(5 * MINUTE),
      independence: [{ a: SYNTHETIC_A, b: SYNTHETIC_B, motive: 'sintético: doble de CA-3.3' }],
    });

    expect(MET(result.decision).provisional).toBe(true);
  });
});

describe('CA-3.4 — y con la lista de PRODUCCIÓN no se dispara (ADR-008 §1)', () => {
  const twoAggregators = [
    observation({ source: CEROACERO, at: at(4 * MINUTE), status: 'live', home: 2, away: 1 }),
    observation({ source: BESOCCER, at: at(5 * MINUTE), status: 'live', home: 2, away: 1 }),
  ];

  test('15. con la lista inyectada, las dos de 0.7 confirman', () => {
    const result = run({
      observations: twoAggregators,
      now: at(5 * MINUTE),
      independence: [{ a: CEROACERO, b: BESOCCER, motive: 'sintético: doble de CA-3.4' }],
    });

    expect(MET(result.decision).provisional).toBe(false);
  });

  test('16. con la configuración REAL de producción, el mismo escenario sale PROVISIONAL', () => {
    // Es la forma ejecutable de «el motor nace con una sola vía en RN-02»
    // (ADR-008 §1): la lista de producción está vacía, ningún par la satisface,
    // y la rama está implementada y probada aunque hoy no se ejerza.
    const result = run({ observations: twoAggregators, now: at(5 * MINUTE), production: true });

    expect(MET(result.decision).provisional).toBe(true);
  });

  test('17. y el kickoff declarado es el que la escena dice', () => {
    // Control de que las escenas de arriba miden algo: la transición
    // `scheduled → live` de CA-3 depende del kickoff, no del azar.
    expect(KICKOFF).toBe('2026-09-06T17:00:00.000Z');
  });
});
