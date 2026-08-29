/**
 * CA-8 — the qualifiers of dominio.md are a type, and they are in galego.
 *
 * This test fails the day someone anglicises a value to
 * `pending_confirmation`, because the array and the galego i18n bundle would
 * stop agreeing.
 */
import { describe, expect, test } from 'vitest';
import { MATCH_QUALIFIERS } from '@/model';
import { gl } from '@/i18n/gl';

describe('CA-8 — MatchQualifier', () => {
  test('the array is exactly the four terms of dominio.md', () => {
    expect([...MATCH_QUALIFIERS]).toEqual([
      'provisional',
      'confirmado',
      'pendente_de_confirmar',
      'sen_sinal',
    ]);
  });

  test('the array matches the keys of the galego i18n bundle', () => {
    expect(Object.keys(gl.qualifiers).sort()).toEqual([...MATCH_QUALIFIERS].sort());
  });

  test('every qualifier has a galego literal, none of them empty', () => {
    for (const qualifier of MATCH_QUALIFIERS) {
      expect(gl.qualifiers[qualifier].length).toBeGreaterThan(0);
    }
  });

  test('the galego literals are the ones dominio.md writes', () => {
    expect(gl.qualifiers).toEqual({
      provisional: 'Provisional',
      confirmado: 'Confirmado',
      pendente_de_confirmar: 'Pendente de confirmar',
      sen_sinal: 'Sen sinal',
    });
  });
});
