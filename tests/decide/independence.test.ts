/**
 * CA-3.1 y CA-3.5 — la lista cerrada de pares declarados independientes: su
 * FORMA, su simetría y su falsedad por defecto (RN-02, ADR-021 §7).
 *
 * CA-3.2, CA-3.3 y CA-3.4 —la vía se ejerce con una lista inyectada, y con la
 * de producción no se dispara— viven en `rules.test.ts`, que es donde hay un
 * reducer que las ejerza.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { INDEPENDENT_PAIRS, areIndependent, declareIndependence } from '@/decide/independence';
import { BESOCCER, CEROACERO, OFFICIAL, OPERATOR } from '@/decide/roles';
import { SourceIdSchema } from '@/model/ids';

const A = SourceIdSchema.parse('fonte-a');
const B = SourceIdSchema.parse('fonte-b');

describe('CA-3.1 — por defecto FALSA, y simétrica', () => {
  test('1. con la lista de producción, `(ceroacero, besoccer)` NO son independientes', () => {
    // Es el par que la tentación pediría: dos agregadores de 0.7 que hoy son
    // lo único que se podría cruzar. `dominio.md` es explícito — pueden ser
    // espejos ENTRE SÍ, y lo desconocido se trata como espejo (SPEC-002 CA-12).
    expect(areIndependent(CEROACERO, BESOCCER)).toBe(false);
    expect(areIndependent(BESOCCER, CEROACERO)).toBe(false);
  });

  test('2. ningún par de la tabla de roles es independiente hoy', () => {
    const sources = [OPERATOR, OFFICIAL, CEROACERO, BESOCCER];

    for (const a of sources) {
      for (const b of sources) {
        expect(areIndependent(a, b)).toBe(false);
      }
    }
  });

  test('3. una fuente no es independiente de sí misma', () => {
    const declared = declareIndependence([{ a: A, b: B, motive: 'sintético' }]);

    expect(areIndependent(A, A, declared)).toBe(false);
    expect(areIndependent(B, B, declared)).toBe(false);
  });

  test('4. y declarado un par, la relación es SIMÉTRICA', () => {
    const declared = declareIndependence([{ a: A, b: B, motive: 'sintético' }]);

    expect(areIndependent(A, B, declared)).toBe(true);
    expect(areIndependent(B, A, declared)).toBe(true);
    // Y no se contagia a nadie más.
    expect(areIndependent(A, CEROACERO, declared)).toBe(false);
  });
});

describe('CA-3.5 — se comprueba la FORMA, no el contenido (ADR-016 §3.2)', () => {
  test('5. la lista está exportada con nombre y hoy nace VACÍA (ADR-008 §1)', () => {
    expect(INDEPENDENT_PAIRS).toEqual([]);
  });

  test('6. cada entrada futura lleva pares literales y su motivo escrito al lado', async () => {
    // El contenido crece con un diff, no con una firma: lo que este caso fija
    // es que una entrada sin motivo no compila el contrato de la lista.
    const source = await readFile(join(process.cwd(), 'src/decide/independence.ts'), 'utf8');

    expect(source).toContain('export interface IndependentPair');
    expect(source).toMatch(/readonly a: SourceId/);
    expect(source).toMatch(/readonly b: SourceId/);
    expect(source).toMatch(/readonly motive: string/);
    expect(source).toMatch(/^export const INDEPENDENT_PAIRS/m);

    for (const entry of INDEPENDENT_PAIRS) {
      expect(entry.motive.trim().length).toBeGreaterThan(0);
    }
  });
});
