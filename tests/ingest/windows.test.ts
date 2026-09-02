/**
 * CA-1 — la elegibilidad es una función pura con los bordes exactos
 * (ADR-019 §2 y §3).
 *
 * Ventana de partido: `kickoff − PRE ≤ t < kickoff + POST`, con PRE = 10 min y
 * POST = 150 min como constantes nombradas en UN solo sitio. Jornada de
 * medición declarada: intervalo `[from, to)` sobre el `kickoff`. La lista nace
 * vacía y sin ella NADA es elegible: el fallo cerrado es el estado natural
 * (RN-11, ADR-008 §5.2).
 *
 * Todo instante es cadena ISO 8601 `Z`, nunca `Date` (ADR-006).
 */
import { describe, expect, test } from 'vitest';
import {
  MATCH_WINDOW,
  POST_KICKOFF_MS,
  PRE_KICKOFF_MS,
  eligibleCompetitions,
  isInMatchWindow,
} from '@/ingest/windows';
import { CompetitionIdSchema } from '@/model/ids';
import type { MeasurementWindow } from '@/ingest/windows';
import type { Instant } from '@/model/ids';

const T = '2026-09-06T17:00:00.000Z' as Instant;
const MINUTE_MS = 60_000;

/** `t + ms`, como cadena `Z`. El único sitio del test que suma tiempo. */
function plus(instant: string, ms: number): Instant {
  return new Date(Date.parse(instant) + ms).toISOString() as Instant;
}

const COMPETITION = CompetitionIdSchema.parse('futgal-preferente-g1');
const OTHER = CompetitionIdSchema.parse('rfef-tercera-g1');

/** Una jornada declarada que cubre el día entero de `T`. */
const DAY: MeasurementWindow = {
  from: '2026-09-06T00:00:00.000Z' as Instant,
  to: '2026-09-07T00:00:00.000Z' as Instant,
  motive: 'xornada sintética de test',
};

const matchAt = (kickoff: Instant, competition_id = COMPETITION) => ({ kickoff, competition_id });

describe('CA-1 — los números viven en un solo sitio y son los de ADR-019 §2', () => {
  test('PRE = 10 min y POST = 150 min, constantes nombradas', () => {
    expect(PRE_KICKOFF_MS).toBe(10 * MINUTE_MS);
    expect(POST_KICKOFF_MS).toBe(150 * MINUTE_MS);
    expect(MATCH_WINDOW).toEqual({ preMs: PRE_KICKOFF_MS, postMs: POST_KICKOFF_MS });
  });
});

describe('CA-1 — la ventana de partido: `[kickoff − PRE, kickoff + POST)`', () => {
  test('un partido con `kickoff = t + PRE` es elegible; con un minuto más, no', () => {
    expect(isInMatchWindow(plus(T, PRE_KICKOFF_MS), T)).toBe(true);
    expect(isInMatchWindow(plus(T, PRE_KICKOFF_MS + MINUTE_MS), T)).toBe(false);

    expect(eligibleCompetitions([matchAt(plus(T, PRE_KICKOFF_MS))], [DAY], T)).toEqual([
      COMPETITION,
    ]);
    expect(
      eligibleCompetitions([matchAt(plus(T, PRE_KICKOFF_MS + MINUTE_MS))], [DAY], T),
    ).toEqual([]);
  });

  test('con `kickoff = t − POST + 1 min` es elegible; con `kickoff = t − POST`, no', () => {
    expect(isInMatchWindow(plus(T, -POST_KICKOFF_MS + MINUTE_MS), T)).toBe(true);
    expect(isInMatchWindow(plus(T, -POST_KICKOFF_MS), T)).toBe(false);

    expect(
      eligibleCompetitions([matchAt(plus(T, -POST_KICKOFF_MS + MINUTE_MS))], [DAY], T),
    ).toEqual([COMPETITION]);
    expect(eligibleCompetitions([matchAt(plus(T, -POST_KICKOFF_MS))], [DAY], T)).toEqual([]);
  });

  test('el borde se mueve al mover POST en su único sitio: el número no está repetido', () => {
    // El mecanismo del «único sitio» es el parámetro: la implementación lee
    // los bordes de `MATCH_WINDOW` (derivado de las constantes) y no lleva un
    // 150 escrito dentro. Si alguien duplicara el número, este caso —que
    // mueve POST una vez y ve moverse el borde— dejaría de pasar.
    const shorter = { preMs: PRE_KICKOFF_MS, postMs: POST_KICKOFF_MS - MINUTE_MS };
    const edge = plus(T, -POST_KICKOFF_MS + MINUTE_MS);

    expect(isInMatchWindow(edge, T)).toBe(true);
    expect(isInMatchWindow(edge, T, shorter)).toBe(false);

    expect(eligibleCompetitions([matchAt(edge)], [DAY], T, shorter)).toEqual([]);
    // Y el default ES la constante: pasarla explícita no cambia nada.
    expect(eligibleCompetitions([matchAt(edge)], [DAY], T, MATCH_WINDOW)).toEqual([COMPETITION]);
  });
});

describe('CA-1 — la jornada de medición declarada acota el conjunto (ADR-019 §3)', () => {
  test('en ventana pero con `kickoff` fuera de toda jornada declarada: NO elegible', () => {
    const outside: MeasurementWindow = {
      from: '2026-09-01T00:00:00.000Z' as Instant,
      to: '2026-09-02T00:00:00.000Z' as Instant,
      motive: 'outra xornada, que non cubre o kickoff',
    };

    expect(eligibleCompetitions([matchAt(T)], [outside], T)).toEqual([]);
  });

  test('con la lista de jornadas VACÍA nada es elegible: el estado natural', () => {
    expect(eligibleCompetitions([matchAt(T)], [], T)).toEqual([]);
  });

  test('los bordes `[from, to)` de la jornada: `kickoff = from` entra, `kickoff = to` no', () => {
    const window: MeasurementWindow = {
      from: T,
      to: plus(T, 2 * MINUTE_MS),
      motive: 'xornada de dous minutos para os bordes',
    };

    // `kickoff = from`, y `t` dentro de su ventana de partido.
    expect(eligibleCompetitions([matchAt(T)], [window], T)).toEqual([COMPETITION]);
    // `kickoff = to`, también en ventana de partido respecto de `t`: lo que lo
    // excluye es el borde derecho abierto de la jornada.
    expect(eligibleCompetitions([matchAt(plus(T, 2 * MINUTE_MS))], [window], T)).toEqual([]);
  });
});

describe('CA-1 — la selección agrupa por competición y es pura', () => {
  test('devuelve cada competición elegible una vez, en orden de aparición', () => {
    const matches = [
      matchAt(T),
      matchAt(plus(T, MINUTE_MS)),
      matchAt(T, OTHER),
      // En ventana no, aunque la jornada lo cubra.
      matchAt(plus(T, PRE_KICKOFF_MS + MINUTE_MS), OTHER),
    ];

    expect(eligibleCompetitions(matches, [DAY], T)).toEqual([COMPETITION, OTHER]);
  });

  test('el instante viaja como cadena `Z` y una que no lo es revienta con nombre', () => {
    expect(() => isInMatchWindow('mañana por la tarde' as Instant, T)).toThrow(
      /not an ISO 8601 UTC instant/,
    );
    expect(() => eligibleCompetitions([matchAt(T)], [DAY], 'ayer' as Instant)).toThrow(
      /not an ISO 8601 UTC instant/,
    );
  });
});
