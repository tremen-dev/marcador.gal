/**
 * CA-9 — RN-12: se registra la regla DECISIVA, con su orden de desempate.
 *
 * El orden es literal el de `reglas.md`: RN-01 > RN-04 > RN-07 > RN-06 >
 * RN-02/RN-03. Un caso por escalón, un caso por cada par adyacente concurrente,
 * y la afirmación que esta spec le debe a RN-12: **RN-05 no entra en el orden,
 * porque no emite** (CA-9.1).
 *
 * Los casos que ejercen el orden ATRAVESANDO el reducer —una transición con
 * una sola fuente de 0.8 registra RN-06 y no RN-03, etc.— viven en
 * `rules.test.ts`; aquí se prueba la función de atribución en aislamiento.
 */
import { describe, expect, test } from 'vitest';
import { ATTRIBUTION_ORDER, attribute } from '@/decide/attribution';
import { DECISION_RULES } from '@/model/decision';
import type { AttributionInput } from '@/decide/attribution';

const NOTHING: AttributionInput = {
  operatorPrecedence: false,
  monotonicity: false,
  silence: false,
  statusChanged: false,
  provisional: false,
};

const every = (input: Partial<AttributionInput>): AttributionInput => ({ ...NOTHING, ...input });

/** Las 32 combinaciones de los cuatro escalones altos por los dos de abajo. */
function allInputs(): readonly AttributionInput[] {
  const flags = ['operatorPrecedence', 'monotonicity', 'silence', 'statusChanged'] as const;
  const inputs: AttributionInput[] = [];
  for (let mask = 0; mask < 16; mask += 1) {
    for (const provisional of [false, true]) {
      const input: Record<string, boolean> = { provisional };
      flags.forEach((flag, index) => {
        input[flag] = (mask & (1 << index)) !== 0;
      });
      inputs.push(input as unknown as AttributionInput);
    }
  }
  return inputs;
}

describe('CA-9 — un caso por escalón, en el orden de `reglas.md`', () => {
  test('1. escalón 1: la precedencia del operador se registra como RN-01', () => {
    expect(attribute(every({ operatorPrecedence: true }))).toBe('RN-01');
  });

  test('2. escalón 2: bajar un marcador (o liberar un salto retenido) es RN-04', () => {
    expect(attribute(every({ monotonicity: true }))).toBe('RN-04');
  });

  test('3. escalón 3: el silencio es RN-07', () => {
    expect(attribute(every({ silence: true }))).toBe('RN-07');
  });

  test('4. escalón 4: cambiar el `status` es RN-06', () => {
    expect(attribute(every({ statusChanged: true }))).toBe('RN-06');
  });

  test('5. escalón 5, el suelo: RN-02 si confirmada, RN-03 si provisional', () => {
    expect(attribute(every({ provisional: false }))).toBe('RN-02');
    expect(attribute(every({ provisional: true }))).toBe('RN-03');
  });

  test('6. y el orden está declarado con nombre, no repartido por ramas', () => {
    expect(ATTRIBUTION_ORDER).toEqual(['RN-01', 'RN-04', 'RN-07', 'RN-06']);
  });
});

describe('CA-9 — un caso por cada par adyacente concurrente', () => {
  test('7. RN-01 con RN-04: el operador baja un marcador y gana el escalón 1', () => {
    expect(attribute(every({ operatorPrecedence: true, monotonicity: true }))).toBe('RN-01');
  });

  test('8. RN-04 con RN-07: liberar un salto durante un silencio gana RN-04', () => {
    expect(attribute(every({ monotonicity: true, silence: true }))).toBe('RN-04');
  });

  test('9. RN-07 con RN-06: entrar en silencio cambiando de estado gana RN-07', () => {
    expect(attribute(every({ silence: true, statusChanged: true }))).toBe('RN-07');
  });

  test('10. RN-06 con RN-02/RN-03: una transición gana al suelo', () => {
    expect(attribute(every({ statusChanged: true, provisional: true }))).toBe('RN-06');
    expect(attribute(every({ statusChanged: true, provisional: false }))).toBe('RN-06');
  });

  test('11. y los no adyacentes también: RN-01 gana a los tres de abajo a la vez', () => {
    expect(
      attribute(
        every({
          operatorPrecedence: true,
          monotonicity: true,
          silence: true,
          statusChanged: true,
          provisional: true,
        }),
      ),
    ).toBe('RN-01');
  });
});

describe('CA-9.1 — RN-05 nunca aparece en `rule`', () => {
  test('12. ninguna de las 32 combinaciones produce RN-05', () => {
    const produced = new Set(allInputs().map((input) => attribute(input)));

    expect(produced.has('RN-05' as never)).toBe(false);
    // Y el escaneo mide algo: sí produce las cinco que puede producir.
    expect([...produced].sort()).toEqual(['RN-01', 'RN-02', 'RN-03', 'RN-04', 'RN-06', 'RN-07']);
  });

  test('13. RN-05 no entra en el orden PORQUE NO EMITE, y esta spec lo declara', () => {
    // El encargo que RN-12 le hacía a la spec del motor: «si la spec del motor
    // llega a definir una `Decision` para la retención, es ella quien tiene que
    // decir dónde entra RN-05». No la define, así que no entra.
    expect(ATTRIBUTION_ORDER).not.toContain('RN-05');
    expect([...ATTRIBUTION_ORDER, 'RN-02', 'RN-03']).toHaveLength(6);
  });
});

describe('CA-9.2 y CA-9.3 — el vocabulario cerrado y el suelo sin desempate', () => {
  test('14. toda atribución sale del vocabulario cerrado de `DECISION_RULES`', () => {
    for (const input of allInputs()) {
      expect(DECISION_RULES).toContain(attribute(input));
    }
  });

  test('15. RN-02 y RN-03 nunca concurren: cuál sale coincide con `provisional`', () => {
    for (const input of allInputs()) {
      const rule = attribute(input);
      if (rule !== 'RN-02' && rule !== 'RN-03') continue;

      expect(rule === 'RN-03').toBe(input.provisional);
      expect(rule === 'RN-02').toBe(!input.provisional);
    }
  });
});
