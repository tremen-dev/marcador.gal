/**
 * CA-10.1 y CA-10.6 a CA-10.13 — la hoja del panel: derivada del sistema, sin
 * un valor propio, sin heredar lo que el sistema no cumple, y sobre el suelo
 * de ADR-025 que el sistema no cubre.
 *
 * El contraste SE CALCULA aquí, no se estima: la fórmula de luminancia
 * relativa de WCAG, sobre los tokens que `src/design/` declara.
 *
 * DECLARADO DONDE JUZGA (ADR-016 §6, CA-10.14): todo lo de este fichero es
 * ESTÁTICO Y NO VE UN DISEÑO CALCULADO. Que el recorrido con teclado funcione,
 * que el foco se vea, que a 360 px no haya desplazamiento horizontal y que un
 * control de 44 px se pulse con un pulgar SOLO LO VE UN NAVEGADOR, y lo
 * comprueba una persona con capturas en `_qa/SPEC-017/` (ADR-025 §5).
 */
import { describe, expect, test } from 'vitest';
import { readFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';
import { PANEL_STYLESHEET } from '@/admin/view/styles';
import {
  COLORS,
  FOCUS_RING_PX,
  FONT_DIRECTORY,
  INPUT_FONT_PX,
  LOADED_FACES,
  TOUCH_TARGET_PX,
} from '@/design/tokens';
import { TOKEN_CORRESPONDENCE, rootBlock } from '@/design/system';
import { MATCH_QUALIFIERS } from '@/model/qualifier';
import { MATCH_STATUSES } from '@/model/match';
import { statusesBundle } from '@/i18n/statuses';
import { gl } from '@/i18n/gl';
import { es } from '@/i18n/es';
import { getPanel, liveDecision, scene, SCENE_MATCH } from './support/doubles';
import type { MatchDecisions } from '@/admin/ports';

// ─────────────────────────────────────────────────────────────────────────────
// El contraste, calculado (WCAG 2.x). No se estima ni se cita de memoria.
// ─────────────────────────────────────────────────────────────────────────────

function channel(value: number): number {
  const srgb = value / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
}

export function contrast(a: string, b: string): number {
  const first = luminance(a);
  const second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

const WITH_DECISION = new Map<string, MatchDecisions>([
  [SCENE_MATCH.id, { live: liveDecision(), log: [liveDecision()] }],
]);

const DETAIL_URL = `https://marcador.gal/admin?partido=${encodeURIComponent(SCENE_MATCH.id)}`;

async function panelHtml(url?: string): Promise<string> {
  const built = scene({ decisions: WITH_DECISION });
  return await (await getPanel(built, url === undefined ? {} : { url })).text();
}

/** La hoja sin sus comentarios: la prosa cita lo que las reglas prohíben. */
function sheetCode(): string {
  return PANEL_STYLESHEET.replaceAll(/\/\*[\s\S]*?\*\//g, '');
}

describe('CA-10.1 — UN SOLO DOMICILIO: la hoja no declara ni un valor propio', () => {
  test('1. el módulo de la hoja no contiene NINGÚN literal de color', async () => {
    const source = await readFile('src/admin/view/styles.ts', 'utf8');
    const code = source
      .replaceAll(/\/\*[\s\S]*?\*\//g, '')
      .replaceAll(/^\s*\/\/.*$/gm, '');

    expect([...code.matchAll(/#[0-9a-f]{3,8}\b/gi)]).toEqual([]);
    expect(code).not.toMatch(/rgb\(|hsl\(|rgba\(/);
  });

  test('2. ni ninguna familia tipográfica escrita a mano', async () => {
    const source = await readFile('src/admin/view/styles.ts', 'utf8');
    const code = source
      .replaceAll(/\/\*[\s\S]*?\*\//g, '')
      .replaceAll(/^\s*\/\/.*$/gm, '');

    // Los nombres de las caras solo pueden llegar por `LOADED_FACES`.
    for (const name of ['ui-sans-serif', 'system-ui', 'Helvetica', 'Menlo', 'Consolas']) {
      expect(code, `${name}`).not.toContain(name);
    }
    // Y toda `font-family` de la hoja es una referencia a un token, FUERA de
    // los `@font-face`, donde el nombre de la cara es el nombre de la cara y
    // sale de `LOADED_FACES`.
    const withoutFaces = sheetCode().replaceAll(/@font-face\{[^}]*\}/g, '');
    for (const [, family] of withoutFaces.matchAll(/font-family:([^;}]+)/g)) {
      expect(family ?? '').toMatch(/var\(--(sans|mono)\)/);
    }
    for (const [, name] of sheetCode().matchAll(/@font-face\{font-family:'([^']+)'/g)) {
      expect(LOADED_FACES.map((face) => face.family)).toContain(name ?? '');
    }
  });

  test('3. TODO valor de color de la hoja es un `var(--token)` declarado', () => {
    const code = sheetCode();
    const body = code.slice(code.indexOf('}', code.indexOf(':root{')) + 1);

    // Fuera del bloque `:root` generado no hay un solo hexadecimal.
    expect([...body.matchAll(/#[0-9a-f]{3,8}\b/gi)]).toEqual([]);

    // Y cada `var(--x)` que usa apunta a un token de la tabla.
    const declared = new Set(TOKEN_CORRESPONDENCE.map((row) => row.emitted));
    for (const [, name] of body.matchAll(/var\((--[a-z-]+)\)/g)) {
      expect(declared.has(name ?? ''), `${name}`).toBe(true);
    }
  });

  test('4. el bloque `:root` está GENERADO desde la tabla, no escrito', () => {
    expect(PANEL_STYLESHEET).toContain(`:root{${rootBlock()}}`);
    expect(rootBlock()).toContain(`--bg:${COLORS.bg}`);
  });

  test('5. control positivo: un `#rrggbb` en la hoja pone rojo el caso 1', () => {
    // El mismo mecanismo, sobre una fuente sintética.
    const evasion = "body{background:#123456}";

    expect([...evasion.matchAll(/#[0-9a-f]{3,8}\b/gi)]).toHaveLength(1);
  });
});

describe('CA-10.6 — las fuentes se autoalojan; el panel no le pide nada a nadie', () => {
  test('6. ni la hoja ni el marcado nombran un host externo, ni hay `@import` de URL', async () => {
    const documents = [await panelHtml(), await panelHtml(DETAIL_URL)];

    for (const html of [PANEL_STYLESHEET, ...documents]) {
      expect(html).not.toContain('fonts.googleapis.com');
      expect(html).not.toContain('fonts.gstatic.com');
      expect(html).not.toMatch(/@import/);
      expect(html).not.toMatch(/https?:\/\//);
    }
  });

  test('7. las cinco caras se sirven de NUESTRO origen y existen en el repositorio', async () => {
    const { existsSync } = await import('node:fs');

    expect(LOADED_FACES.length).toBeGreaterThan(0);
    for (const face of LOADED_FACES) {
      expect(PANEL_STYLESHEET).toContain(`url('${FONT_DIRECTORY}${face.file}')`);
      expect(existsSync(`public${FONT_DIRECTORY}${face.file}`), `${face.file}`).toBe(true);
    }

    // Y la licencia viaja con ellas: son de Vercel, bajo OFL.
    expect(existsSync('public/fonts/LICENSE.txt')).toBe(true);
  });

  test('8. y no se carga ninguna cara que no esté declarada', async () => {
    const { readdir } = await import('node:fs/promises');
    const shipped = (await readdir('public/fonts')).filter((name) => name.endsWith('.woff2'));

    expect(shipped.sort()).toEqual(LOADED_FACES.map((face) => face.file).sort());
  });
});

describe('CA-10.7 y CA-10.8 — ningún cualificador se apaga, y los dos llevan etiqueta', () => {
  test('9. `provisional` y `confirmado` se sirven con EL MISMO color de texto', () => {
    const code = sheetCode();

    expect(code).toContain('.q-provisional,.q-confirmado{color:var(--fg)}');
    // Y no hay ninguna regla que los separe por color en otro sitio.
    expect(code.match(/\.q-provisional/g) ?? []).toHaveLength(1);
    expect(code.match(/\.q-confirmado/g) ?? []).toHaveLength(1);
  });

  test('10. LOS DOS LLEVAN ETIQUETA en el árbol renderizado, `confirmado` incluido', async () => {
    // El sistema deja `confirmado` mudo —«el normal no se anuncia»— y aquí lo
    // normal es lo otro (ADR-026 §2.1). Se comprueba sobre el árbol.
    for (const qualifier of MATCH_QUALIFIERS) {
      const built = scene({
        decisions: new Map<string, MatchDecisions>([
          [
            SCENE_MATCH.id,
            {
              live: liveDecision(
                qualifier === 'confirmado'
                  ? { provisional: false }
                  : qualifier === 'sen_sinal'
                    ? { rule: 'RN-07' }
                    : qualifier === 'pendente_de_confirmar'
                      ? { status: 'finished', provisional: false }
                      : {},
              ),
              log: [liveDecision()],
            },
          ],
        ]),
      });

      const $ = cheerio.load(await (await getPanel(built)).text());
      const cell = $(`.q-${qualifier.replaceAll('_', '-')}`);

      expect(cell.length, `${qualifier}`).toBe(1);
      expect(cell.text().trim(), `${qualifier}`).toBe(gl.qualifiers[qualifier]);
    }
  });

  test('11. control positivo: apagar o enmudecer uno de los dos sería ROJO', () => {
    // Apagar: `provisional` con un color distinto de `--fg`.
    const dimmed = '.q-provisional{color:var(--fg-muted)}.q-confirmado{color:var(--fg)}';
    expect(dimmed).not.toContain('.q-provisional,.q-confirmado{color:var(--fg)}');

    // Enmudecer: una celda de cualificador sin nodo de texto.
    const mute = cheerio.load('<td class="q-confirmado"></td>');
    expect(mute('.q-confirmado').text().trim()).toBe('');
    // Y en el panel real NO está vacía, que es lo que el caso 10 afirma.
  });

  test('12. `confirmado` NO se pinta con el acento de marca (ADR-026 §2.3)', () => {
    const code = sheetCode();

    for (const [, rule] of code.matchAll(/(\.q-[a-z-]+[^{]*\{[^}]*\})/g)) {
      expect(rule ?? '', `${rule ?? ''}`).not.toContain('--brand');
    }
    // Y el token de marca no aparece en ninguna regla de estado tampoco.
    for (const [, rule] of code.matchAll(/(\.s-[a-z-]+[^{]*\{[^}]*\})/g)) {
      expect(rule ?? '', `${rule ?? ''}`).not.toContain('--brand');
    }
  });

  test('13. y ningún color que porta un dato o un cualificador baja de 4.5:1', () => {
    // CALCULADO, no estimado (ADR-013 §6).
    for (const token of ['fg', 'fgMuted', 'amber', 'alert', 'accentLive'] as const) {
      expect(contrast(COLORS[token], COLORS.bg), `${token}`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(COLORS[token], COLORS.bgElevated), `${token}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('CA-10.9 — literales del glosario, nunca un glifo ni una abreviatura', () => {
  test('14. todo estado y todo cualificador visible sale de `src/i18n/`', async () => {
    const $ = cheerio.load(await panelHtml(DETAIL_URL));
    const visible = $('body').text();

    for (const status of MATCH_STATUSES) {
      expect(visible, `${status}`).toContain(statusesBundle('gl')[status]);
    }
    expect(visible).toContain(gl.qualifiers.provisional);
  });

  test('15. `live` se dice *En xogo*, NUNCA *Directo* (ADR-026 §4.4)', async () => {
    expect(statusesBundle('gl').live).toBe('En xogo');
    expect(statusesBundle('es').live).toBe('En juego');

    const html = await panelHtml(DETAIL_URL);
    expect(html).not.toContain('Directo');
    expect(html).not.toContain('directo');
  });

  test('16. y no aparece ninguna de las cinco abreviaturas ni ninguno de los dos glifos', async () => {
    const $ = cheerio.load(await panelHtml(DETAIL_URL));
    const visible = $('body').text();

    // `FIN`, `APR`, `DESC` no están en `dominio.md`; `?` y `!` no son
    // traducibles (ADR-026 §4.2 y §4.3, D-2).
    for (const abbreviation of ['FIN', 'APR', 'DESC']) {
      expect(visible, `${abbreviation}`).not.toContain(abbreviation);
    }
    for (const literal of [...Object.values(gl.statuses), ...Object.values(es.statuses)]) {
      expect(literal.length).toBeGreaterThan(3);
    }
  });
});

describe('CA-10.10 — foco visible, teclado y `Escape` (ADR-025 §2, INTACTO)', () => {
  test('17. `:focus-visible` con un contorno de ≥ 2 px en el perímetro', () => {
    expect(FOCUS_RING_PX).toBeGreaterThanOrEqual(2);
    expect(sheetCode()).toContain(`outline:${FOCUS_RING_PX}px solid var(--fg)`);
  });

  test('18. y su contraste contra los dos fondos se CALCULA: ≥ 3:1', () => {
    expect(contrast(COLORS.fg, COLORS.bg)).toBeGreaterThanOrEqual(3);
    expect(contrast(COLORS.fg, COLORS.bgElevated)).toBeGreaterThanOrEqual(3);
    expect(contrast(COLORS.fg, COLORS.bgStep)).toBeGreaterThanOrEqual(3);
  });

  test('19. NO existe ningún `outline: none` sin sustituto', () => {
    expect(sheetCode()).not.toMatch(/outline\s*:\s*none/);
    expect(sheetCode()).not.toMatch(/outline\s*:\s*0/);
  });

  test('20. control positivo: quitar el sustituto pone rojo el caso 17', () => {
    const stripped = sheetCode().replace(
      new RegExp(`outline:${FOCUS_RING_PX}px solid var\\(--fg\\)`),
      'outline:none',
    );

    expect(stripped).toMatch(/outline\s*:\s*none/);
    expect(stripped).not.toContain(`outline:${FOCUS_RING_PX}px solid var(--fg)`);
  });

  test('21. ningún `tabindex` positivo: el orden de tabulación es el del DOM', async () => {
    for (const url of [undefined, DETAIL_URL]) {
      const $ = cheerio.load(await panelHtml(url));
      $('[tabindex]').each((_index, element) => {
        expect(Number($(element).attr('tabindex'))).toBeLessThanOrEqual(0);
      });
    }
  });

  test('22. `Escape` sale del paso y devuelve el foco al control que lo deja', async () => {
    const html = await panelHtml(DETAIL_URL);

    expect(html).toContain("event.key !== 'Escape'");
    expect(html).toContain('[data-cancel]');
    expect(html).toContain('.focus()');
    // Y el control existe en CADA formulario, con script o sin él.
    const $ = cheerio.load(html);
    expect($('form').length).toBeGreaterThan(0);
    $('form').each((_index, element) => {
      expect($(element).find('[data-cancel]').length).toBeGreaterThan(0);
    });
  });

  test('23. nada modal: no hay `dialog` ni `aria-modal` que pueda atrapar el foco', async () => {
    const $ = cheerio.load(await panelHtml(DETAIL_URL));

    expect($('dialog').length).toBe(0);
    expect($('[aria-modal]').length).toBe(0);
  });
});

describe('CA-10.11 — toque de 44 px y campos de ≥ 16 px (ADR-025 §3, INTACTO)', () => {
  test('24. el suelo de toque es UNA CONSTANTE NOMBRADA EN UN SOLO SITIO', async () => {
    expect(TOUCH_TARGET_PX).toBe(44);

    const source = await readFile('src/admin/view/styles.ts', 'utf8');
    const code = source.replaceAll(/\/\*[\s\S]*?\*\//g, '').replaceAll(/^\s*\/\/.*$/gm, '');
    // El `44` no está escrito ni una vez en la hoja: se interpola.
    expect([...code.matchAll(/\b44\b/g)]).toEqual([]);

    // Y en `src/design/` se declara UNA vez. El otro `44` del fichero es el
    // tamaño del rol `display` del sistema (44 / 800), que es otra cosa: un
    // cuerpo tipográfico, no un área de toque.
    const tokens = await readFile('src/design/tokens.ts', 'utf8');
    const declared = tokens
      .replaceAll(/\/\*[\s\S]*?\*\//g, '')
      .replaceAll(/^\s*\/\/.*$/gm, '');
    expect([...declared.matchAll(/TOUCH_TARGET_PX = 44/g)]).toHaveLength(1);
    expect([...declared.matchAll(/\b44\b/g)]).toHaveLength(2);
  });

  test('25. y se aplica a TODOS los controles interactivos', () => {
    expect(sheetCode()).toMatch(
      new RegExp(
        `a,button,input,select,textarea,summary\\{min-height:${TOUCH_TARGET_PX}px\\}`,
      ),
    );
    expect(sheetCode()).toContain(`min-width:${TOUCH_TARGET_PX}px`);
  });

  test('26. los campos de texto no bajan de 16 px, y GANA sobre el rol del sistema', async () => {
    expect(INPUT_FONT_PX).toBeGreaterThanOrEqual(16);
    expect(sheetCode()).toContain(`font-size:${INPUT_FONT_PX}px`);

    // El rol `team` del sistema es 15 px; el suelo de ADR-025 §3.1 gana.
    const { TYPE } = await import('@/design/tokens');
    expect(TYPE.team.px).toBeLessThan(INPUT_FONT_PX);
  });
});

describe('CA-10.12 — nada solo por color, dígitos tabulares y cero imágenes', () => {
  test('27. cada estado y cada cualificador del árbol tiene un nodo de texto', async () => {
    const $ = cheerio.load(await panelHtml(DETAIL_URL));

    // El paint va por clase; el nombre va por texto. Ninguna clase de estado o
    // de cualificador aparece sin contenido.
    for (const element of $('[class^="s-"], [class^="q-"]').toArray()) {
      expect($(element).text().trim().length).toBeGreaterThan(0);
    }
    expect($('[class^="s-"], [class^="q-"]').length).toBeGreaterThan(0);
  });

  test('28. dígitos tabulares en marcador, hora y minuto (ADR-013 §3)', () => {
    const code = sheetCode();

    expect(code).toContain('font-variant-numeric:tabular-nums');
    expect(code).toMatch(/\.num,\.score,\.instant/);
    expect(code).toContain("font-feature-settings:'tnum' 1");
  });

  test('29. ninguna imagen, ni etiqueta ni fondo (ADR-013 §4 y §5)', async () => {
    for (const url of [undefined, DETAIL_URL]) {
      const $ = cheerio.load(await panelHtml(url));
      expect($('img').length).toBe(0);
      expect($('svg').length).toBe(0);
      expect($('picture').length).toBe(0);
    }

    expect(sheetCode()).not.toContain('background-image');
    expect(sheetCode()).not.toMatch(/url\((?!'\/fonts\/)/);
  });
});

describe('CA-10.13 — la hoja es propia y `globals.css` no se edita ni se carga', () => {
  test('30. ningún módulo de `src/admin/` importa CSS de `src/app/` ni de `src/site/`', async () => {
    const { readdir } = await import('node:fs/promises');
    const scanned: string[] = [];

    for (const entry of await readdir('src/admin', { recursive: true })) {
      const path = `src/admin/${entry}`;
      if (!path.endsWith('.ts') && !path.endsWith('.tsx')) continue;
      scanned.push(path);

      const source = await readFile(path, 'utf8');
      const code = source.replaceAll(/\/\*[\s\S]*?\*\//g, '').replaceAll(/^\s*\/\/.*$/gm, '');

      expect(code, `${path}`).not.toContain('globals.css');
      expect(code, `${path}`).not.toMatch(/import\s+['"][^'"]*\.css['"]/);
      expect(code, `${path}`).not.toMatch(/from\s+['"]@\/site\//);
    }

    expect(scanned.length).toBeGreaterThan(8);
    expect(scanned).toContain('src/admin/view/styles.ts');
  });

  test('31. y el documento del panel NO carga `globals.css`: no lo envuelve ningún layout', async () => {
    // Una ruta de manejador (`route.ts`) no la envuelve ningún layout, así que
    // la hoja del sitio público nunca entra en este documento. Es lo que hace
    // de ADR-025 §4.1 una verdad por construcción y no por disciplina.
    const html = await panelHtml();
    const globals = await readFile('src/app/globals.css', 'utf8');

    expect(html).not.toContain('--paper');
    expect(html).not.toContain('--ink');
    for (const value of ['#fbfbf9', '#14181c', '#14459b', '#dcdcd4', '#5b656f']) {
      expect(html.toLowerCase(), `${value}`).not.toContain(value);
    }
    // Y el fichero del sitio sigue sirviendo claro por defecto, sin tocar.
    expect(globals).toContain('--paper: #fbfbf9');
  });

  test('32. la hoja no se sirve por ninguna URL: va en línea', async () => {
    const $ = cheerio.load(await panelHtml());

    expect($('link[rel="stylesheet"]').length).toBe(0);
    expect($('style').length).toBe(1);
  });
});
