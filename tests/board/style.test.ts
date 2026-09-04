/**
 * SPEC-018 CA-15 — la hoja del marcador: derivada de `src/design/`, sin un
 * valor propio, sobre el suelo de ADR-025 y sin heredar lo que el sistema no
 * cumple.
 *
 * El contraste SE CALCULA, no se estima: se reutiliza `contrast` de la suite
 * del panel, que es la fórmula de luminancia relativa de WCAG sobre los tokens
 * que `src/design/` declara. **Se importa, no se copia**: una segunda fórmula
 * sería una segunda idea de qué es contraste.
 *
 * DECLARADO DONDE JUZGA (ADR-016 §6, CA-16.3): todo lo de este fichero es
 * ESTÁTICO Y NO VE UN DISEÑO CALCULADO. Que el recorrido con teclado funcione,
 * que el foco se vea, que a 360 px no haya desplazamiento horizontal del cuerpo
 * y que el refresco y su fallo se vean SOLO LO VE UN NAVEGADOR, y lo comprueba
 * una persona con capturas en `_qa/SPEC-018/` (ADR-025 §5, CA-16).
 */
import { describe, expect, test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { BOARD_STYLESHEET } from '@/board/view/styles';
import { PANEL_STYLESHEET } from '@/admin/view/styles';
import {
  COLORS,
  FOCUS_RING_PX,
  FONT_DIRECTORY,
  LOADED_FACES,
  MEASURE,
  TOUCH_TARGET_PX,
  TYPE,
} from '@/design/tokens';
import { DECLARED_DIVERGENCES, rootBlock } from '@/design/system';
import { MATCH_QUALIFIERS } from '@/model/qualifier';
import { contrast } from '../admin/style.test';
import {
  computedStyle,
  digitsWidthPx,
  tabularFigures,
  unresolvableSelectors,
} from './cascade';
import type { StyledElement } from './cascade';

/**
 * La hoja SIN el bloque `:root`, que es el único sitio donde un valor
 * hexadecimal puede aparecer — y aparece GENERADO desde
 * `TOKEN_CORRESPONDENCE`, no escrito. Lo que CA-15.1 prohíbe es declarar un
 * valor propio en una regla.
 */
const RULES = BOARD_STYLESHEET.replace(/:root\{[^}]*\}/, ':root{}');

/**
 * LAS TRES CELDAS QUE LLEVAN CIFRAS — `time`, `score` y `last` — LEÍDAS DEL
 * MANEJADOR, no escritas aquí. Si mañana una de ellas cambia de clase, el
 * modelo cambia con ella en vez de quedarse midiendo un elemento que ya no
 * existe; y si desaparece, el `toEqual` de abajo lo dice.
 */
async function digitCells(): Promise<readonly (StyledElement & { field: string })[]> {
  const handler = await readFile('src/board/handler.ts', 'utf8');
  const cells = [...handler.matchAll(/'(time|score|last)',\s*'([a-z-]+)'\)/g)].map((match) => ({
    field: match[1]!,
    tag: 'td',
    classes: [match[2]!],
  }));

  expect(cells.map((cell) => cell.field).sort()).toEqual(['last', 'score', 'time']);
  return cells;
}

/**
 * LA MUTACIÓN CON LA QUE SE PROBÓ QUE EL CASO 14 MUERDE, y es exactamente la
 * hoja que había antes de F-SPEC-018-V1: una regla con atajo `font:` que
 * alcanza a la celda del marcador DESPUÉS de la que declara `tabular-nums`.
 */
function withFontShorthandBack(): string {
  const { weight, px, leading } = TYPE.score;
  return `${BOARD_STYLESHEET}\n.score{font:${weight} ${px}px/${leading} var(--mono)}`;
}

describe('CA-15.1 — un solo domicilio: ni un color, ni una familia, ni un radio propios', () => {
  test('1. ninguna regla de la hoja declara un `#rrggbb` ni un nombre de fuente', () => {
    expect(RULES).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);

    for (const family of ['Helvetica', 'Arial', 'system-ui', 'ui-sans-serif', 'Menlo']) {
      expect(RULES).not.toContain(family);
    }
  });

  test('2. su `:root` sale de `rootBlock()`, no está escrito a mano', () => {
    expect(BOARD_STYLESHEET).toContain(`:root{${rootBlock()}}`);
  });

  test('3. CONTROL POSITIVO: escribir un color pone rojo el mecanismo', () => {
    const synthetic = `${RULES}\n.x{color:#ff0000}`;

    expect(synthetic).toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  test('4. y sólo usa `var(--…)` de los tokens que la tabla de correspondencia declara', () => {
    const emitted = new Set(rootBlock().split(';').map((pair) => pair.split(':')[0]));
    const used = new Set(
      [...BOARD_STYLESHEET.matchAll(/var\((--[a-z-]+)\)/g)].map((match) => match[1]!),
    );

    expect([...used].filter((token) => !emitted.has(token))).toEqual([]);
  });
});

describe('CA-15.2 — F-SPEC-017-18 cerrado: ninguna de las DOS hojas lleva un valor de escala', () => {
  /** Los cinco que vivían fuera de su domicilio, ahora en `src/design/`. */
  test('5. `MEASURE` y `HAIRLINE_PX` existen y las dos hojas los usan', async () => {
    expect(Object.keys(MEASURE).sort()).toEqual([
      'bodyLeading',
      'fieldMaxRem',
      'pageMaxRem',
      'textAreaMinRem',
    ]);

    expect(PANEL_STYLESHEET).toContain(`line-height:${MEASURE.bodyLeading}`);
    expect(BOARD_STYLESHEET).toContain(`line-height:${MEASURE.bodyLeading}`);
    expect(PANEL_STYLESHEET).toContain(`max-width:${MEASURE.pageMaxRem}rem`);
    expect(BOARD_STYLESHEET).toContain(`max-width:${MEASURE.pageMaxRem}rem`);
  });

  test('6. y NINGUNA de las dos FUENTES escribe un valor de escala literal', async () => {
    const sources = await Promise.all(
      ['src/admin/view/styles.ts', 'src/board/view/styles.ts'].map(
        async (path) => [path, await readFile(path, 'utf8')] as const,
      ),
    );

    for (const [path, source] of sources) {
      const code = source
        .replaceAll(/\/\*[\s\S]*?\*\//g, '')
        .replaceAll(/\/\/.*$/gm, '');

      // Ni `20px`, ni `22rem`, ni `5rem`, ni `60rem`, ni `1.45`, ni `1px solid`.
      expect(code, `${path}: px literal`).not.toMatch(/[^{$]\b\d+px\b/);
      expect(code, `${path}: rem literal`).not.toMatch(/\b\d+rem\b/);
      expect(code, `${path}: line-height literal`).not.toMatch(/line-height:\d/);
    }
  });

  test('7. y `h1` toma su tamaño del rol que lo declara, en vez de repetir un 20', () => {
    expect(PANEL_STYLESHEET).toContain(`font-size:${TYPE.score.px}px`);
    expect(BOARD_STYLESHEET).toContain(`font-size:${TYPE.score.px}px`);
  });
});

describe('CA-15.3 — el rol `display` no se usa y su cara NO se carga', () => {
  test('8. `LOADED_FACES` no crece, y la hoja del marcador no referencia `TYPE.display`', async () => {
    // `display` es «el marcador de la FICHA DE PARTIDO» y esta pantalla es una
    // LISTA. Cargar la cara variable de Geist para no usarla sería pagar un
    // fichero con todos los pesos dentro contra el «sólo los pesos que se
    // usan» de ADR-026 §3.5. F-SPEC-017-9 conserva su disparador: la primera
    // interfaz que use el rol `display`.
    expect(LOADED_FACES).toHaveLength(5);
    expect(LOADED_FACES.map((face) => face.file)).not.toContain('Geist-Variable.woff2');

    const source = await readFile('src/board/view/styles.ts', 'utf8');
    const code = source.replaceAll(/\/\*[\s\S]*?\*\//g, '').replaceAll(/\/\/.*$/gm, '');

    expect(code).not.toContain("role('display')");
    expect(code).not.toContain('TYPE.display');
    // El rol entero, no su número suelto: `44` es también `TOUCH_TARGET_PX`.
    // EN LA FORMA EN QUE LA HOJA LO EMITE HOY, que desde F-SPEC-018-V1 son
    // longhands y no el atajo `font:`. La aserción no se debilita: sigue
    // pidiendo los tres números del rol seguidos, sólo que escritos como se
    // escriben ahora.
    expect(BOARD_STYLESHEET).not.toContain(
      `font-weight:${TYPE.display.weight};font-size:${TYPE.display.px}px;line-height:${TYPE.display.leading}`,
    );
  });

  test('9. y las caras se sirven de NUESTRO propio origen, sin un solo `@import`', () => {
    expect(BOARD_STYLESHEET).not.toContain('@import');

    for (const face of LOADED_FACES) {
      expect(BOARD_STYLESHEET).toContain(`url('${FONT_DIRECTORY}${face.file}')`);
    }
  });
});

describe('CA-15.4 — `docs/diseno/` no se edita y las divergencias siguen siendo TRES', () => {
  test('10. la lista de divergencias declaradas no crece', () => {
    expect(DECLARED_DIVERGENCES).toHaveLength(3);
  });
});

describe('CA-15.5 a CA-15.9 — el suelo de ADR-025, intacto', () => {
  test('11. CA-15.5 — `:focus-visible` con indicador de ≥ 2 px y contraste ≥ 3:1 CALCULADO', () => {
    expect(BOARD_STYLESHEET).toContain(`outline:${FOCUS_RING_PX}px solid var(--fg)`);
    expect(FOCUS_RING_PX).toBeGreaterThanOrEqual(2);

    // El anillo es `--fg` sobre los dos fondos que puede tener detrás.
    expect(contrast(COLORS.fg, COLORS.bg)).toBeGreaterThanOrEqual(3);
    expect(contrast(COLORS.fg, COLORS.bgElevated)).toBeGreaterThanOrEqual(3);
  });

  test('12. y no hay ni un `outline:none` sin sustituto, ni un `tabindex` positivo', async () => {
    expect(BOARD_STYLESHEET).not.toMatch(/outline\s*:\s*(?:none|0)/);

    const markup = await readFile('src/board/view/markup.ts', 'utf8');
    const handler = await readFile('src/board/handler.ts', 'utf8');
    for (const source of [markup, handler]) {
      expect(source).not.toMatch(/tabindex\s*=\s*["']?[1-9]/);
    }
  });

  test('13. CA-15.6 — todo control llega a 44 × 44 px, con el valor de `TOUCH_TARGET_PX`', () => {
    expect(BOARD_STYLESHEET).toContain(`min-height:${TOUCH_TARGET_PX}px`);
    expect(BOARD_STYLESHEET).toContain(`min-width:${TOUCH_TARGET_PX}px`);
    expect(TOUCH_TARGET_PX).toBe(44);
  });

  /**
   * CA-15.7 SE MIDE, NO SE BUSCA (F-SPEC-018-V1). Este caso decía que la CADENA
   * `font-variant-numeric:tabular-nums` estaba en la hoja. Estaba, y la
   * propiedad computaba `normal` en las tres celdas con cifras: el atajo `font:`
   * de `role()` la reiniciaba tres reglas más abajo.
   *
   * Ahora se resuelve la CASCADA y se mide la anchura, Y SE MIDE EN UNA CARA
   * PROPORCIONAL a propósito. En `--mono` los dos anchos coinciden diga lo que
   * diga la hoja —72,25 px los dos, medido— así que medir en mono contesta que
   * sí por el motivo equivocado. En `sans`, `111111` y `000000` miden 42,66 y
   * 58,59 px salvo que las figuras tabulares estén encendidas: ahí la igualdad
   * sólo puede venir de la declaración, que es lo que ADR-013 §3 exige.
   *
   * Sus dos controles positivos son los casos 19 y 20, al final del bloque para
   * no renumerar los que el ledger ya cita.
   */
  test('14. CA-15.7 — las tres celdas con cifras MIDEN igual `111111` y `000000` (ADR-013 §3)', async () => {
    const cells = await digitCells();
    const offenders: string[] = [];

    for (const cell of cells) {
      const style = computedStyle(BOARD_STYLESHEET, cell);
      const label = `${cell.field} → <td class="${cell.classes.join(' ')}">`;
      const ones = digitsWidthPx('111111', style);
      const zeros = digitsWidthPx('000000', style);

      // LA MEDIDA, en una tipografía proporcional: sólo `tabular-nums` las iguala.
      if (ones !== zeros) {
        offenders.push(
          `${label}: 111111 mide ${ones.toFixed(2)} px y 000000 mide ${zeros.toFixed(2)} px`,
        );
      }
      // Y el diagnóstico, para que un rojo diga POR QUÉ: el valor COMPUTADO, no
      // la cadena de la hoja.
      if (style.get('font-variant-numeric') !== 'tabular-nums') {
        offenders.push(`${label}: font-variant-numeric computa ${style.get('font-variant-numeric')}`);
      }
      if (style.get('font-feature-settings') !== "'tnum' 1") {
        offenders.push(
          `${label}: font-feature-settings computa ${style.get('font-feature-settings')}`,
        );
      }
    }

    expect(offenders).toEqual([]);

    // Lo que el resolutor no sabe decidir, comprobado en vez de supuesto
    // (ADR-016 §6): ningún selector con combinador ni ninguna pseudoclase que
    // declare una propiedad de fuente alcanza a estas tres celdas.
    expect(unresolvableSelectors(BOARD_STYLESHEET, cells)).toEqual([]);
  });

  test('15. CA-15.8 — la hoja es propia: ningún módulo de `src/board/` importa CSS', async () => {
    const { readSourceFiles } = await import('../site/source-scan');
    const files = await readSourceFiles();

    const { stripComments } = await import('../site/source-scan');
    const offenders = files
      .filter((file) => file.path.startsWith('board/'))
      .map((file) => ({ path: file.path, code: stripComments(file.text) }))
      .filter((file) => /\.css['"]/.test(file.code) || file.code.includes('globals.css'))
      .map((file) => file.path);

    expect(offenders).toEqual([]);
  });

  test('16. CA-15.9 — la tabla desplaza DENTRO de su contenedor, nunca el cuerpo', () => {
    expect(BOARD_STYLESHEET).toContain('.scroller{overflow-x:auto}');
    expect(BOARD_STYLESHEET).toContain('table{border-collapse:collapse;width:max-content;min-width:100%}');
    // Y el cuerpo no declara ningún desplazamiento horizontal propio.
    expect(BOARD_STYLESHEET).not.toMatch(/body\{[^}]*overflow-x/);
  });

  test('17. CA-12.5 — ningún color que porte un cualificador baja de 4.5:1, CALCULADO', () => {
    // Los dos que llevan color son condiciones, no el caso normal, y llevan su
    // etiqueta de texto al lado SIEMPRE (ADR-026 §2.4, ADR-013 §6).
    for (const token of ['amber', 'alert', 'fg', 'fgMuted', 'accentLive'] as const) {
      expect(contrast(COLORS[token], COLORS.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(COLORS[token], COLORS.bgElevated)).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('18. y los cuatro cualificadores tienen su regla, sin ninguno apagado', () => {
    for (const qualifier of MATCH_QUALIFIERS) {
      expect(BOARD_STYLESHEET).toContain(`.q-${qualifier.replaceAll('_', '-')}`);
    }
    // `--fg-prov` NO EXISTE en el código, ni con ese nombre ni con otro.
    expect(BOARD_STYLESHEET).not.toContain('--fg-prov');
    // Y ninguna REGLA apaga un cualificador con el token más apagado.
    expect(RULES).not.toMatch(/\.q-[a-z-]+\{[^}]*--fg-dim/);
  });

  test('19. CONTROL POSITIVO de CA-15.7: devolver el atajo `font:` pone rojo el caso 14', async () => {
    const cells = await digitCells();
    const score = cells.find((cell) => cell.field === 'score')!;
    const style = computedStyle(withFontShorthandBack(), score);

    // El atajo reinicia las dos propiedades que sostienen ADR-013 §3…
    expect(style.get('font-variant-numeric')).toBe('normal');
    expect(style.get('font-feature-settings')).toBe('normal');
    // …y con ellas apagadas la medida las separa, que es el rojo del caso 14.
    expect(digitsWidthPx('111111', style)).not.toBe(digitsWidthPx('000000', style));
    expect(digitsWidthPx('111111', style)).toBeCloseTo(42.66, 2);
    expect(digitsWidthPx('000000', style)).toBeCloseTo(58.59, 2);
  });

  test('20. y LA TRAMPA que el caso viejo no veía: en `--mono` la hoja rota pasa igual', () => {
    const style = computedStyle(withFontShorthandBack(), { tag: 'td', classes: ['score'] });

    // Misma hoja rota, misma declaración muerta…
    expect(tabularFigures(style)).toBe(false);
    // …y en una monoespaciada los dos anchos coinciden de todos modos: 72,25 px
    // los dos, medido en el navegador. Por eso CA-15.7 se mide en `sans`, y por
    // eso la familia NO puede ser el mecanismo que sostiene ADR-013 §3.
    expect(digitsWidthPx('111111', style, 'mono')).toBe(digitsWidthPx('000000', style, 'mono'));
    expect(digitsWidthPx('111111', style, 'mono')).toBeCloseTo(72.25, 2);
  });
});
