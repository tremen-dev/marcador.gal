/**
 * CA-7.6 y CA-6.8 — los umbrales viven en `src/decide/thresholds.ts`, cada uno
 * en UN SOLO SITIO y con la cita de la regla de la que salen.
 *
 * La mitad que importa de CA-6.8 —cambiar `CONFLICT_GRACE` ahí mueve el borde
 * de CA-6.2 sin tocar ningún otro número— se ejerce contra el reducer en
 * `rules.test.ts`, que es donde hay un borde que mirar.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  BIG_JUMP_GOALS,
  CONFIRMED_WEIGHT,
  CONFLICT_GRACE_MS,
  DEFAULT_THRESHOLDS,
  FINISH_TIMEOUT_MS,
  INDEPENDENT_WEIGHT,
  LIVE_LEAD_MS,
  SILENCE_MS,
} from '@/decide/thresholds';

const MINUTE_MS = 60_000;
const FILE = join(process.cwd(), 'src/decide/thresholds.ts');

describe('CA-7.6 — los tres umbrales de RN-06 y RN-07 son los de la regla', () => {
  test('1. RN-06: kickoff − 2 min y kickoff + 110 min; RN-07: 15 min', () => {
    expect(LIVE_LEAD_MS).toBe(2 * MINUTE_MS);
    expect(FINISH_TIMEOUT_MS).toBe(110 * MINUTE_MS);
    expect(SILENCE_MS).toBe(15 * MINUTE_MS);
  });

  test('2. y los pesos de RN-02 no se inventan: 0.9 y 0.7', () => {
    expect(CONFIRMED_WEIGHT).toBe(0.9);
    expect(INDEPENDENT_WEIGHT).toBe(0.7);
    expect(BIG_JUMP_GOALS).toBe(2);
  });

  test('3. `CONFLICT_GRACE` = 3 min (ADR-021 §8.2), elegido y no medido', () => {
    expect(CONFLICT_GRACE_MS).toBe(3 * MINUTE_MS);
  });

  test('4. y todos viajan juntos en `DEFAULT_THRESHOLDS`, sin un séptimo número suelto', () => {
    expect(DEFAULT_THRESHOLDS).toEqual({
      liveLeadMs: LIVE_LEAD_MS,
      finishTimeoutMs: FINISH_TIMEOUT_MS,
      silenceMs: SILENCE_MS,
      conflictGraceMs: CONFLICT_GRACE_MS,
      confirmedWeight: CONFIRMED_WEIGHT,
      independentWeight: INDEPENDENT_WEIGHT,
      bigJumpGoals: BIG_JUMP_GOALS,
    });
  });
});

describe('CA-7.6 y CA-6.8 — cada número, en un solo sitio, con su cita', () => {
  test('5. cada constante se declara UNA vez, y la cita de su regla está al lado', async () => {
    const source = await readFile(FILE, 'utf8');

    const declarations: readonly (readonly [string, string])[] = [
      ['LIVE_LEAD_MS', 'RN-06'],
      ['FINISH_TIMEOUT_MS', 'RN-06'],
      ['SILENCE_MS', 'RN-07'],
      ['CONFLICT_GRACE_MS', 'ADR-021 §8.2'],
      ['CONFIRMED_WEIGHT', 'RN-02'],
      ['INDEPENDENT_WEIGHT', 'RN-02'],
      ['BIG_JUMP_GOALS', 'RN-04'],
    ];

    for (const [name, citation] of declarations) {
      const declared = source.match(new RegExp(`^export const ${name} `, 'gm'));
      expect(declared?.length, `${name} no se declara exactamente una vez`).toBe(1);

      // La cita va en el comentario que precede a la declaración.
      const before = source.slice(0, source.indexOf(`export const ${name} `));
      expect(before.slice(-900), `${name} no cita su regla`).toContain(citation);
    }
  });

  test('6. y ningún otro fichero de `src/` repite estos números con estos nombres', async () => {
    // El detector es débil a propósito y se dice: mide el NOMBRE, no el valor.
    // Lo que cierra la duplicación de verdad es que el reducer los recibe
    // siempre por configuración, y eso lo ejerce `rules.test.ts`.
    const { readSourceTree } = await import('../support/source-tree');
    const tree = await readSourceTree();

    const names = [
      'LIVE_LEAD_MS',
      'FINISH_TIMEOUT_MS',
      'SILENCE_MS',
      'CONFLICT_GRACE_MS',
      'BIG_JUMP_GOALS',
    ];

    for (const file of tree) {
      if (file.path === 'decide/thresholds.ts') continue;
      for (const name of names) {
        expect(file.code, `${file.path} vuelve a declarar ${name}`).not.toContain(
          `const ${name} `,
        );
      }
    }
  });
});
