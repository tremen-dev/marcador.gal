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

/**
 * La hoja SIN el bloque `:root`, que es el único sitio donde un valor
 * hexadecimal puede aparecer — y aparece GENERADO desde
 * `TOKEN_CORRESPONDENCE`, no escrito. Lo que CA-15.1 prohíbe es declarar un
 * valor propio en una regla.
 */
const RULES = BOARD_STYLESHEET.replace(/:root\{[^}]*\}/, ':root{}');

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
    expect(BOARD_STYLESHEET).not.toContain(
      `font:${TYPE.display.weight} ${TYPE.display.px}px/${TYPE.display.leading}`,
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

  test('14. CA-15.7 — dígitos tabulares en marcador, hora e instantes (ADR-013 §3)', () => {
    expect(BOARD_STYLESHEET).toContain('font-variant-numeric:tabular-nums');
    expect(BOARD_STYLESHEET).toMatch(/\.num,\.score,\.instant,td,th\{/);
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
});
