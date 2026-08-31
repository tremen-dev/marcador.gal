/**
 * CA-8 — adelanto, retraso y empate, con la tolerancia declarada.
 *
 * τ = 90 s is a declared hypothesis, not truth: at one capture per minute
 * (RN-11) two unsynchronised sources can look 60 s apart purely from the phase
 * of their sampling, and 30 s more absorb network latency and cron jitter.
 * The boundary cases are written out one by one because a `>=` where the spec
 * says `>` moves every 90-second observation from *empate* to *adelanto*, and
 * an adelanto is the one signal that proves independence.
 */
import { describe, expect, test } from 'vitest';
import { TAU_MS, classifyLead } from '@/mirror/analysis/compare';

const AT = (seconds: number) =>
  new Date(Date.UTC(2026, 8, 5, 17, 0, seconds)).toISOString();

describe('CA-8 — la tolerancia declarada', () => {
  test('1. τ vale 90 s y viaja en el informe', () => {
    expect(TAU_MS).toBe(90_000);
  });

  test('2. B llega 91 s antes que A: adelanto de B', () => {
    expect(classifyLead(AT(91), AT(0)).classification).toBe('lead_b');
  });

  test('3. B llega 90 s antes que A: empate, porque el criterio es estrictamente mayor', () => {
    expect(classifyLead(AT(90), AT(0)).classification).toBe('tie');
  });

  test('4. B llega 89 s antes que A: empate', () => {
    expect(classifyLead(AT(89), AT(0)).classification).toBe('tie');
  });

  test('5. A llega 91 s antes que B: retraso de B', () => {
    expect(classifyLead(AT(0), AT(91)).classification).toBe('lead_a');
  });

  test('6. A llega 90 s antes que B: empate', () => {
    expect(classifyLead(AT(0), AT(90)).classification).toBe('tie');
  });

  test('7. A llega 89 s antes que B: empate', () => {
    expect(classifyLead(AT(0), AT(89)).classification).toBe('tie');
  });

  test('8. simultáneos: empate, y la diferencia observada es 0', () => {
    const result = classifyLead(AT(0), AT(0));

    expect(result.classification).toBe('tie');
    expect(result.difference_ms).toBe(0);
  });

  test('9. first_seen indefinido en B: el evento es exclusivo de A, no un adelanto', () => {
    const result = classifyLead(AT(0), null);

    expect(result.classification).toBe('only_a');
    expect(result.difference_ms).toBeNull();
  });

  test('10. first_seen indefinido en A: exclusivo de B', () => {
    expect(classifyLead(null, AT(0)).classification).toBe('only_b');
  });

  test('11. indefinido en las dos: el evento no existe para este par', () => {
    expect(classifyLead(null, null).classification).toBe('neither');
  });

  test('12. la diferencia observada se registra con signo: positiva cuando B adelanta', () => {
    expect(classifyLead(AT(120), AT(0)).difference_ms).toBe(120_000);
    expect(classifyLead(AT(0), AT(120)).difference_ms).toBe(-120_000);
  });
});
