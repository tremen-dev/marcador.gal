/**
 * SPEC-018 CA-15.2 — la paridad con el sistema, ENSANCHADA A RADIOS Y ESCALA.
 *
 * FICHERO NUEVO, no un ensanche de `tests/design/parity.test.ts`: aquél es la
 * suite de SPEC-017, que está cerrada, y SPEC-018 CA-17.2 (i) prohíbe
 * ensanchar por conveniencia una suite ajena. El precedente de escribir un
 * fichero propio es SPEC-007 con `identity.test.ts`. El caso de paridad de
 * SPEC-017 —el que afirma que las divergencias declaradas siguen siendo tres—
 * **pasa sin tocar una aserción** (CA-15.4).
 *
 * QUÉ SE PUEDE COMPARAR Y QUÉ NO, DECLARADO (ADR-016 §6, ADR-026 §3.3):
 * `docs/diseno/_tokens.css` declara SÓLO color y familia, así que la paridad
 * de valores sólo alcanza a eso y ya la cubre SPEC-017. **Los radios y el paso
 * de espacio están DECLARADOS EN PROSA** en `docs/diseno/Main.dc.html` —«paso
 * de espazo 4 px · 4 · 8 · 12 · 16 · 24 · 32 · 48. Radios 8 · 10 · 14 · 999»—
 * y esa prosa SÍ se puede leer y comparar, que es lo que hace este fichero.
 *
 * LO QUE SIGUE SIN PODER COMPARARSE CONTRA NADA son los cinco valores de
 * `MEASURE` y `HAIRLINE_PX`: el sistema no los declara en ninguna forma. Lo que
 * nombrarlos compra no es paridad, es que una segunda hoja no pueda inventar un
 * sexto en silencio. **F-SPEC-017-10 NO se cierra aquí**: su destino sigue
 * siendo EPIC-004 y su disparador el deshielo.
 */
import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';
import { HAIRLINE_PX, MEASURE, RADIUS, SPACE, TYPE } from '@/design/tokens';
import { BOARD_STYLESHEET } from '@/board/view/styles';
import { PANEL_STYLESHEET } from '@/admin/view/styles';

const SYSTEM_PROSE = 'docs/diseno/Main.dc.html';

describe('CA-15.2 — la escala y los radios del código son los DECLARADOS por el sistema', () => {
  test('1. el paso de espacio es el que la prosa del sistema declara', async () => {
    const prose = await readFile(SYSTEM_PROSE, 'utf8');

    // La frase existe: si el artefacto deja de declararla, este caso lo dice
    // antes de que nadie invente un paso nuevo.
    expect(prose).toContain('4 · 8 · 12 · 16 · 24 · 32 · 48');
    expect([...SPACE]).toEqual([4, 8, 12, 16, 24, 32, 48]);
  });

  test('2. y los cuatro radios también', async () => {
    const prose = await readFile(SYSTEM_PROSE, 'utf8');

    expect(prose).toContain('8 · 10 · 14 · 999');
    expect(Object.values(RADIUS)).toEqual([8, 10, 14, 999]);
  });

  test('3. los cinco roles tipográficos llevan los números que el sistema escribe', async () => {
    const prose = await readFile(SYSTEM_PROSE, 'utf8');

    for (const [name, role] of Object.entries(TYPE)) {
      expect(prose, `el sistema ya no declara el rol ${name}`).toContain(
        `${role.px} / ${role.weight}`,
      );
    }
  });

  test('4. NINGUNA de las dos hojas declara un radio o un paso fuera de las dos listas', () => {
    for (const [name, sheet] of [
      ['panel', PANEL_STYLESHEET],
      ['marcador', BOARD_STYLESHEET],
    ] as const) {
      const radii = [...sheet.matchAll(/border-radius:(\d+)px/g)].map((match) =>
        Number(match[1]),
      );
      const illegalRadii = radii.filter(
        (value) => !Object.values(RADIUS).includes(value as never),
      );
      expect(illegalRadii, `${name}: radios fuera de la escala`).toEqual([]);

      const gaps = [...sheet.matchAll(/(?:padding|margin|gap):([^;}]+)/g)]
        .flatMap((match) => [...match[1]!.matchAll(/(\d+)px/g)].map((px) => Number(px[1])))
        .filter((value) => value !== 0);
      const illegalGaps = gaps.filter((value) => !(SPACE as readonly number[]).includes(value));
      expect(illegalGaps, `${name}: pasos fuera de la escala`).toEqual([]);
    }
  });

  test('5. CONTROL POSITIVO: un radio de 7 px pondría rojo el mecanismo', () => {
    const synthetic = '.x{border-radius:7px}';
    const radii = [...synthetic.matchAll(/border-radius:(\d+)px/g)].map((match) =>
      Number(match[1]),
    );

    expect(radii.filter((value) => !Object.values(RADIUS).includes(value as never))).toEqual([7]);
  });

  test('6. y los cinco valores que el sistema NO declara tienen nombre en `src/design/`', () => {
    // No es paridad —no hay contra qué compararlos— y se declara así. Lo que
    // compra es un solo domicilio: F-SPEC-017-18, cerrado.
    expect(MEASURE.bodyLeading).toBeGreaterThan(1);
    expect(MEASURE.fieldMaxRem).toBeGreaterThan(0);
    expect(MEASURE.textAreaMinRem).toBeGreaterThan(0);
    expect(MEASURE.pageMaxRem).toBeGreaterThan(0);
    expect(HAIRLINE_PX).toBe(1);
  });
});
