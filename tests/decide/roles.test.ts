/**
 * CA-1 — los pesos son los de la `Observation`; los roles, una tabla que falla
 * cerrado (RN-01, ADR-021 §8.4).
 *
 * La mitad de este criterio que necesita el reducer —CA-1.2, el umbral se
 * evalúa contra `observation.confidence` y no contra la tabla— vive en
 * `rules.test.ts`, junto al reducer que la ejerce.
 */
import { describe, expect, test } from 'vitest';
import {
  CEROACERO,
  CORRESPONDENT,
  OFFICIAL,
  OPERATOR,
  SOURCE_ROLES,
  UnknownSourceRoleError,
  isHuman,
  isOfficial,
  roleOf,
} from '@/decide/roles';
import { RN01_WEIGHTS, defaultRegistry } from '@/ingest/sources';
import { SourceIdSchema } from '@/model/ids';
import type { Rn01Role } from '@/decide/roles';

const ALL_ROLES: readonly Rn01Role[] = [
  'operator',
  'official',
  'paid_api',
  'correspondent',
  'aggregator',
  'club_tweet',
];

describe('CA-1 — la tabla de roles se apoya en RN01_WEIGHTS y no copia sus números', () => {
  test('1. cada rol que declara es una clave de `RN01_WEIGHTS`', () => {
    const weights = Object.keys(RN01_WEIGHTS);

    for (const role of Object.values(SOURCE_ROLES)) {
      expect(weights).toContain(role);
    }

    // Y el escaneo mide algo: la tabla no está vacía.
    expect(Object.keys(SOURCE_ROLES).length).toBeGreaterThanOrEqual(5);
  });

  test('2. toda `SourceId` del registro de producción tiene rol', () => {
    const sources = defaultRegistry().entries.map((entry) => entry.source);

    expect(sources.length).toBeGreaterThan(0);
    for (const source of sources) {
      expect(() => roleOf(source)).not.toThrow();
    }
  });

  test('3. `operator`, `official` y `correspondent` están declarados', () => {
    expect(roleOf(OPERATOR)).toBe('operator');
    expect(roleOf(OFFICIAL)).toBe('official');
    expect(roleOf(CORRESPONDENT)).toBe('correspondent');
    expect(roleOf(CEROACERO)).toBe('aggregator');
  });
});

describe('CA-1.1 — fallo cerrado: una fuente sin rol es un error con nombre', () => {
  test('4. pedir el rol de una `SourceId` desconocida LANZA y nombra la fuente', () => {
    const unknown = SourceIdSchema.parse('fonte-inventada');

    // El resultado esperado es la excepción, no un valor por defecto.
    expect(() => roleOf(unknown)).toThrow(UnknownSourceRoleError);
    expect(() => roleOf(unknown)).toThrow(/fonte-inventada/);
  });

  test('5. y nunca devuelve un rol «se asume automática»', () => {
    let returned: unknown = 'no llegó a devolver nada';
    try {
      returned = roleOf(SourceIdSchema.parse('outra-fonte'));
    } catch (error) {
      returned = error;
    }

    expect(returned).toBeInstanceOf(UnknownSourceRoleError);
    expect(ALL_ROLES).not.toContain(returned);
  });
});

describe('CA-1.3 — «humano» en RN-04 y RN-06 son los dos (RN-01)', () => {
  test.each([
    ['operator', true],
    ['correspondent', true],
    ['official', false],
    ['paid_api', false],
    ['aggregator', false],
    ['club_tweet', false],
  ] as const)('6. isHuman(%s) === %s', (role, expected) => {
    expect(isHuman(role)).toBe(expected);
  });

  test('7. y los seis roles están cubiertos por los casos de arriba', () => {
    expect([...ALL_ROLES].sort()).toEqual(
      ['aggregator', 'club_tweet', 'correspondent', 'official', 'operator', 'paid_api'],
    );
  });

  test('8. `isOfficial` es cierto SOLO para la fuente oficial', () => {
    for (const role of ALL_ROLES) {
      expect(isOfficial(role)).toBe(role === 'official');
    }
  });
});
