/**
 * CA-10 — los cuatro cualificadores se DERIVAN, sin columna nueva
 * (ADR-021 §6, SPEC-001 CA-8, ADR-013).
 *
 * La función es pura y TOTAL: dada la `Decision` vigente y sus observaciones de
 * apoyo devuelve exactamente uno de los cuatro valores de `MATCH_QUALIFIERS`,
 * y nunca lanza.
 */
import { describe, expect, test } from 'vitest';
import { qualifierOf } from '@/decide/qualifier';
import { MATCH_QUALIFIERS } from '@/model/qualifier';
import { MATCH_STATUSES } from '@/model/match';
import type { Decision, DecisionRule, Instant, MatchStatus, Observation } from '@/model';
import {
  MATCH_ID,
  OBSERVATION_ID,
  OTHER_OBSERVATION_ID,
  RAW_REF,
  SOURCE_CEROACERO,
  SOURCE_FUTGAL,
} from '../fixtures/model';

const AT = '2026-03-21T18:00:00.000Z' as Instant;

function decisionWith(
  status: MatchStatus,
  options: { rule?: DecisionRule; provisional?: boolean } = {},
): Decision {
  const scored = status === 'live' || status === 'finished' || status === 'suspended';
  return {
    match_id: MATCH_ID,
    status,
    home_score: scored ? 2 : null,
    away_score: scored ? 1 : null,
    provisional: options.provisional ?? false,
    rule: options.rule ?? 'RN-02',
    decided_at: AT,
    supporting_observation_ids: [OBSERVATION_ID],
    version: 1,
  } as Decision;
}

function observationWith(status: MatchStatus): Observation {
  const scored = status === 'live' || status === 'finished' || status === 'suspended';
  return {
    id: OBSERVATION_ID,
    match_id: MATCH_ID,
    source: SOURCE_CEROACERO,
    observed_at: AT,
    status,
    home_score: scored ? 2 : null,
    away_score: scored ? 1 : null,
    confidence: 0.7,
    raw_ref: RAW_REF,
  } as Observation;
}

describe('CA-10 — un caso por valor, en el orden de ADR-021 §6', () => {
  test('1. `sen_sinal` si la regla vigente es RN-07', () => {
    expect(qualifierOf(decisionWith('live', { rule: 'RN-07' }), [observationWith('live')])).toBe(
      'sen_sinal',
    );
  });

  test('2. `pendente_de_confirmar` si es `finished` y ninguna apoyo dice `finished`', () => {
    expect(
      qualifierOf(decisionWith('finished', { rule: 'RN-06' }), [observationWith('live')]),
    ).toBe('pendente_de_confirmar');
  });

  test('3. `provisional` si `provisional`', () => {
    expect(
      qualifierOf(decisionWith('live', { rule: 'RN-03', provisional: true }), [
        observationWith('live'),
      ]),
    ).toBe('provisional');
  });

  test('4. `confirmado` en otro caso', () => {
    expect(qualifierOf(decisionWith('live'), [observationWith('live')])).toBe('confirmado');
  });

  test('5. el orden manda: `sen_sinal` gana a `provisional`', () => {
    expect(
      qualifierOf(decisionWith('live', { rule: 'RN-07', provisional: true }), [
        observationWith('live'),
      ]),
    ).toBe('sen_sinal');
  });

  test('6. y `pendente_de_confirmar` gana a `provisional`', () => {
    expect(
      qualifierOf(decisionWith('finished', { rule: 'RN-06', provisional: true }), [
        observationWith('live'),
      ]),
    ).toBe('pendente_de_confirmar');
  });
});

describe('CA-10.1 — es TOTAL: cinco ramas por dos valores de `provisional`', () => {
  test('7. siempre devuelve uno de los cuatro y nunca lanza', () => {
    for (const status of MATCH_STATUSES) {
      for (const provisional of [false, true]) {
        for (const rule of ['RN-01', 'RN-02', 'RN-03', 'RN-04', 'RN-06', 'RN-07'] as const) {
          for (const support of [[], [observationWith(status)], [observationWith('live')]]) {
            const decision = decisionWith(status, { rule, provisional });
            const qualifier = qualifierOf(decision, support);
            expect(MATCH_QUALIFIERS).toContain(qualifier);
          }
        }
      }
    }
  });

  test('8. tampoco lanza sin ninguna observación de apoyo', () => {
    expect(() => qualifierOf(decisionWith('finished'), [])).not.toThrow();
    expect(qualifierOf(decisionWith('finished'), [])).toBe('pendente_de_confirmar');
  });
});

describe('CA-10.2 — un `finished` con apoyo que dice `finished` NO es pendente', () => {
  test('9. sale `confirmado` o `provisional` según RN-02', () => {
    const support = [observationWith('finished')];

    expect(qualifierOf(decisionWith('finished', { provisional: false }), support)).toBe(
      'confirmado',
    );
    expect(qualifierOf(decisionWith('finished', { provisional: true }), support)).toBe(
      'provisional',
    );
  });

  test('10. y basta con que UNA de las apoyo lo diga', () => {
    const support: readonly Observation[] = [
      observationWith('live'),
      { ...observationWith('finished'), id: OTHER_OBSERVATION_ID, source: SOURCE_FUTGAL },
    ];

    expect(qualifierOf(decisionWith('finished'), support)).toBe('confirmado');
  });
});

describe('CA-10.3 — el cualificador no borra `provisional`', () => {
  test('11. un partido puede ser a la vez `sen_sinal` y `provisional: true`', () => {
    const decision = decisionWith('live', { rule: 'RN-07', provisional: true });

    expect(qualifierOf(decision, [observationWith('live')])).toBe('sen_sinal');
    // La columna sigue legible al lado. Cómo se enseñan los dos es de la
    // interfaz (ADR-013), no de aquí.
    expect(decision.provisional).toBe(true);
  });

  test('12. y `pendente_de_confirmar` con `provisional: true` también', () => {
    const decision = decisionWith('finished', { rule: 'RN-06', provisional: true });

    expect(qualifierOf(decision, [observationWith('live')])).toBe('pendente_de_confirmar');
    expect(decision.provisional).toBe(true);
  });
});
