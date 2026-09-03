/**
 * CA-10 (los subpuntos 1 a 6), CA-1.10 y la mitad de CA-12 que se ve — el
 * suelo de interfaz de ADR-025, cumplido y COMPROBADO.
 *
 * DECLARADO DONDE JUZGA (ADR-016 §6, CA-10.7): los subpuntos 1 a 6 son
 * ESTÁTICOS Y NO VEN UN DISEÑO CALCULADO. Que el recorrido con teclado
 * funcione de verdad, que el foco se vea de verdad, que a 360 px no haya
 * desplazamiento horizontal de verdad y que un control de 44 px se pueda pulsar
 * con un pulgar SOLO LO VE UN NAVEGADOR, y lo comprueba una persona con
 * capturas en `_qa/SPEC-017/` (ADR-025 §5). Automatizarlo es una spec propia,
 * con disparador escrito: la primera spec que construya la interfaz del
 * marcador.
 *
 * El contraste SE CALCULA aquí, no se estima: la fórmula de luminancia
 * relativa de WCAG, sobre los valores que la propia hoja declara.
 */
import { describe, expect, test } from 'vitest';
import { readFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';
import {
  FOCUS_RING_PX,
  INPUT_FONT_PX,
  PANEL_COLORS,
  PANEL_STYLESHEET,
  TOUCH_TARGET_PX,
} from '@/admin/view/styles';
import { MATCH_QUALIFIERS } from '@/model/qualifier';
import { MATCH_STATUSES } from '@/model/match';
import { statusesBundle } from '@/i18n/statuses';
import { gl } from '@/i18n/gl';
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
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

const WITH_DECISION = new Map<string, MatchDecisions>([
  [SCENE_MATCH.id, { live: liveDecision(), log: [liveDecision()] }],
]);

async function panelHtml(url?: string): Promise<string> {
  const built = scene({ decisions: WITH_DECISION });
  return await (await getPanel(built, url === undefined ? {} : { url })).text();
}

const DETAIL_URL = `https://marcador.gal/admin?partido=${encodeURIComponent(SCENE_MATCH.id)}`;

describe('CA-10.1 — foco visible, de al menos 2 px y con contraste ≥ 3:1', () => {
  test('1. la hoja declara `:focus-visible` con un contorno en el perímetro', () => {
    expect(PANEL_STYLESHEET).toContain(':focus-visible');
    expect(PANEL_STYLESHEET).toMatch(
      new RegExp(`outline:\\s*${FOCUS_RING_PX}px solid`),
    );
    expect(FOCUS_RING_PX).toBeGreaterThanOrEqual(2);
  });

  test('2. y su contraste contra el fondo se CALCULA: ≥ 3:1 (ADR-025 §2.1)', () => {
    expect(contrast(PANEL_COLORS.focus, PANEL_COLORS.surface)).toBeGreaterThanOrEqual(3);
  });

  test('3. NO existe ningún `outline: none` sin sustituto', () => {
    expect(PANEL_STYLESHEET).not.toMatch(/outline:\s*none/);
    expect(PANEL_STYLESHEET).not.toMatch(/outline:\s*0/);
  });

  test('4. control positivo: quitar el sustituto pone ROJO este mecanismo', () => {
    // El mismo mecanismo, sobre una hoja sintética a la que se le quita el
    // contorno. Si el detector estuviera apagado, esto pasaría en verde.
    const stripped = PANEL_STYLESHEET.replace(
      new RegExp(`outline:\\s*${FOCUS_RING_PX}px solid[^;]*;`),
      'outline: none;',
    );

    expect(stripped).toMatch(/outline:\s*none/);
    expect(stripped).not.toMatch(new RegExp(`outline:\\s*${FOCUS_RING_PX}px solid`));
  });

  test('5. y ADR-013 §6: todo color que porta un dato está por encima de 4.5:1', () => {
    expect(contrast(PANEL_COLORS.ink, PANEL_COLORS.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(PANEL_COLORS.inkSoft, PANEL_COLORS.surface)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('CA-10.2 — toque de 44 px y campos de al menos 16 px', () => {
  test('6. el suelo de toque es UNA CONSTANTE NOMBRADA EN UN SOLO SITIO', () => {
    expect(TOUCH_TARGET_PX).toBe(44);
    // La hoja la interpola: no hay un `44px` escrito a mano en ninguna parte.
    expect(PANEL_STYLESHEET).toContain(`min-height: ${TOUCH_TARGET_PX}px`);
    expect(PANEL_STYLESHEET).toContain(`min-width: ${TOUCH_TARGET_PX}px`);
  });

  test('7. y se aplica a TODOS los controles interactivos', () => {
    const rule = /a,\s*button,\s*input,\s*select,\s*textarea,\s*summary\s*\{[^}]*min-height/;
    expect(PANEL_STYLESHEET).toMatch(rule);
  });

  test('8. los campos de texto no bajan de 16 px (ADR-025 §3.1)', () => {
    expect(INPUT_FONT_PX).toBeGreaterThanOrEqual(16);
    expect(PANEL_STYLESHEET).toContain(`font-size: ${INPUT_FONT_PX}px`);
  });

  test('9. control positivo: el número no está escrito dos veces en la hoja', async () => {
    const source = await readFile('src/admin/view/styles.ts', 'utf8');
    const code = source.replaceAll(/\/\*[\s\S]*?\*\//g, '').replaceAll(/^\s*\/\/.*$/gm, '');

    // El literal `44` aparece EXACTAMENTE una vez: en la constante.
    expect([...code.matchAll(/\b44\b/g)]).toHaveLength(1);
  });
});

describe('CA-10.3 — ningún estado ni cualificador se distingue solo por color', () => {
  test('10. cada estado presente en el árbol tiene un nodo de TEXTO que lo nombra', async () => {
    const $ = cheerio.load(await panelHtml(DETAIL_URL));
    const visible = $('body').text();

    // El estado de la `Decision` vigente es `live`, y está escrito.
    expect(visible).toContain(statusesBundle('gl').live);

    // Y las cinco formas están disponibles en el selector, todas como texto.
    for (const status of MATCH_STATUSES) {
      expect(visible).toContain(statusesBundle('gl')[status]);
    }
  });

  test('11. y cada cualificador presente también', async () => {
    const $ = cheerio.load(await panelHtml());
    const visible = $('body').text();

    // El de la escena es *provisional*, y aparece escrito con todas las letras.
    expect(visible).toContain(gl.qualifiers.provisional);

    // Y los cuatro tienen forma visible declarada, en las dos lenguas.
    for (const qualifier of MATCH_QUALIFIERS) {
      expect(gl.qualifiers[qualifier].length).toBeGreaterThan(0);
    }
  });

  test('12. la hoja NO usa color para significar nada: no hay clase de estado', () => {
    // La forma más fuerte de cumplir ADR-013 §2 es no pintar ninguno.
    for (const status of MATCH_STATUSES) {
      expect(PANEL_STYLESHEET).not.toContain(`.${status}`);
    }
    for (const qualifier of MATCH_QUALIFIERS) {
      expect(PANEL_STYLESHEET).not.toContain(`.${qualifier}`);
    }
  });
});

describe('CA-10.4 y CA-10.5 — dígitos tabulares y NINGUNA imagen', () => {
  test('13. marcador, hora y minuto van tabulares (ADR-013 §3)', () => {
    expect(PANEL_STYLESHEET).toContain('font-variant-numeric: tabular-nums');
    expect(PANEL_STYLESHEET).toMatch(/\.num[^{]*\{[\s\S]*?tabular-nums/);
    expect(PANEL_STYLESHEET).toContain('.score');
    expect(PANEL_STYLESHEET).toContain('.instant');
  });

  test('14. y las celdas que llevan dígitos llevan la clase', async () => {
    const $ = cheerio.load(await panelHtml());
    expect($('.score').length + $('.instant').length + $('.num').length).toBeGreaterThan(0);
  });

  test('15. el panel no renderiza NINGUNA imagen, ni de fondo', async () => {
    for (const url of [undefined, DETAIL_URL]) {
      const $ = cheerio.load(await panelHtml(url));
      expect($('img').length).toBe(0);
      expect($('svg').length).toBe(0);
      expect($('picture').length).toBe(0);
    }

    expect(PANEL_STYLESHEET).not.toContain('background-image');
    expect(PANEL_STYLESHEET).not.toContain('url(');
  });
});

describe('CA-10.6 — la hoja del panel no comparte una línea con `globals.css`', () => {
  test('16. ningún módulo de `src/admin/` importa CSS de fuera de sí mismo', async () => {
    const { readdir } = await import('node:fs/promises');
    const files = await readdir('src/admin', { recursive: true });
    const scanned: string[] = [];

    for (const entry of files) {
      const path = `src/admin/${entry}`;
      if (!path.endsWith('.ts') && !path.endsWith('.tsx')) continue;
      scanned.push(path);

      // Se lee el CÓDIGO sin comentarios: la prosa de esta spec cita
      // `globals.css` y `docs/diseno/` para decir que NO se tocan, y un
      // escaneo que cazara la prosa cazaría justo a quien lo explica.
      const source = await readFile(path, 'utf8');
      const code = source.replaceAll(/\/\*[\s\S]*?\*\//g, '').replaceAll(/^\s*\/\/.*$/gm, '');

      expect(code, `${path}`).not.toContain('globals.css');
      expect(code, `${path}`).not.toContain('docs/diseno');
      // Ni ningún `import` de un `.css`, esté donde esté.
      expect(code, `${path}`).not.toMatch(/import\s+['"][^'"]*\.css['"]/);
    }

    // Y el escaneo mide algo: `src/admin/` está entero y no es un conjunto vacío.
    expect(scanned.length).toBeGreaterThan(8);
    expect(scanned).toContain('src/admin/view/styles.ts');
  });

  /**
   * LO QUE «NO COMPARTIR UNA LÍNEA» PROTEGE SON LOS VALORES (ADR-025 §4 y su
   * motivo: entrada 6 del inventario de EPIC-004, «no son variante y base, son
   * dos bases opuestas»). Dos hojas cualesquiera de este planeta escriben
   * `body {` igual, y exigir lo contrario sería un criterio que no se puede
   * cumplir.
   *
   * Así que se enumeran LAS COINCIDENCIAS ESTRUCTURALES, con su motivo al lado
   * y en la forma de ADR-016, y se exige que el resto sea VACÍO. Una línea
   * nueva compartida —un color, una tipografía, un espaciado— es roja sin que
   * nadie tenga que saber que existe.
   */
  const STRUCTURAL_COINCIDENCES: readonly { line: string; motive: string }[] = [
    {
      line: 'body {',
      motive:
        'El selector del cuerpo del documento. Es un nombre de HTML, no un valor: cualquier hoja que dé estilo a una página lo escribe, y exigir que no coincida sería exigir que una de las dos no exista.',
    },
    {
      line: 'margin: 0;',
      motive:
        'El reseteo del margen por defecto del navegador. Es la ausencia de un valor, no un valor: `0` no lo eligió nadie, lo impone que los navegadores traen un margen que ninguna de las dos hojas quiere.',
    },
    {
      line: 'overflow-wrap: anywhere;',
      motive:
        'Que una cadena larga se parta en vez de empujar la página de lado. Es D-8 aplicada al ancho de 360 px, la misma regla en los dos sitios porque el problema es el mismo, y no transporta ninguna decisión de identidad: no hay color, ni tipografía, ni espaciado dentro.',
    },
  ];

  test('17. y NO COMPARTE NINGÚN VALOR con `globals.css` ni con `docs/diseno/`', async () => {
    const globals = await readFile('src/app/globals.css', 'utf8');

    const meaningful = (sheet: string): Set<string> =>
      new Set(
        sheet
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 3 && !line.startsWith('/*') && !line.startsWith('*')),
      );

    const ours = meaningful(PANEL_STYLESHEET);
    const theirs = meaningful(globals);
    const declared = new Set(STRUCTURAL_COINCIDENCES.map((entry) => entry.line));

    const shared = [...ours].filter((line) => theirs.has(line) && !declared.has(line));
    expect(shared).toEqual([]);

    // Cada coincidencia declarada llega con su motivo, y TODAS son reales: una
    // entrada que ya no coincide es una entrada que sobra (ADR-016 §3.2).
    for (const entry of STRUCTURAL_COINCIDENCES) {
      expect(entry.motive.length).toBeGreaterThan(60);
      expect(ours.has(entry.line) && theirs.has(entry.line), `${entry.line}`).toBe(true);
    }

    // Y NINGÚN VALOR de `globals.css` se copia: sus cinco variables no existen
    // aquí, ni por nombre ni por valor.
    for (const token of ['--ink', '--paper', '--link', '--rule', '--ink-soft']) {
      expect(PANEL_STYLESHEET).not.toContain(token);
    }
    for (const value of ['#fbfbf9', '#14181c', '#14459b', '#dcdcd4', '#5b656f']) {
      expect(PANEL_STYLESHEET).not.toContain(value);
    }
  });

  test('17 bis. ni un solo color de `docs/diseno/` aparece en la hoja del panel', async () => {
    const { readdir } = await import('node:fs/promises');
    const design: string[] = [];

    for (const entry of await readdir('docs/diseno', { recursive: true })) {
      const path = `docs/diseno/${entry}`;
      if (!path.endsWith('.css') && !path.endsWith('.html') && !path.endsWith('.js')) continue;
      design.push(await readFile(path, 'utf8'));
    }

    const colours = new Set(
      design.flatMap((text) => [...text.matchAll(/#[0-9a-fA-F]{6}\b/g)].map(([hex]) => hex.toLowerCase())),
    );

    // El blanco y el negro puros NO son valores que nadie eligiese: son el
    // papel y la tinta por defecto, y aparecen en cualquier hoja del mundo.
    // Declararlos aquí es lo que impide que este caso se afloje en silencio
    // más adelante con una lista que crezca sin motivo (ADR-016 §3.2).
    const NOT_A_TOKEN = new Set(['#ffffff', '#000000']);

    expect(colours.size).toBeGreaterThan(20);
    for (const hex of Object.values(PANEL_COLORS)) {
      if (NOT_A_TOKEN.has(hex.toLowerCase())) continue;
      expect(colours.has(hex.toLowerCase()), `${hex}`).toBe(false);
    }

    // Y el mecanismo no está apagado: un color REAL del sistema congelado sí
    // lo caza. Se toma del propio conjunto medido, no de una copia escrita.
    const anyDesignColour = [...colours].find((hex) => !NOT_A_TOKEN.has(hex));
    expect(anyDesignColour).toBeDefined();
    expect(colours.has(anyDesignColour ?? '')).toBe(true);
  });

  test('18. el documento del panel no carga NADA: ni hoja externa, ni fuente, ni script remoto', async () => {
    const $ = cheerio.load(await panelHtml());

    expect($('link').length).toBe(0);
    expect($('script[src]').length).toBe(0);
    // La hoja va en línea, que es «alcanzable solo desde sus propias rutas» en
    // su forma más estricta: no hay URL que la sirva (ADR-025 §4.2).
    expect($('style').length).toBe(1);
  });
});

describe('CA-1.10 — el panel no se anuncia, y `robots.txt` NO cambia', () => {
  test('19. cabecera `X-Robots-Tag` y `meta name="robots"` en todas sus rutas', async () => {
    const built = scene({ decisions: WITH_DECISION });

    for (const url of ['https://marcador.gal/admin', DETAIL_URL]) {
      const answer = await getPanel(built, { url });
      expect(answer.headers.get('x-robots-tag')).toBe('noindex, nofollow');

      const $ = cheerio.load(await answer.text());
      expect($('meta[name="robots"]').attr('content')).toBe('noindex, nofollow');
    }
  });

  test('20. y el formulario de acceso también, que es lo que ve quien no entra', async () => {
    const built = scene();
    const answer = await getPanel(built, { token: 'no-es-un-token' });

    expect(answer.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(cheerio.load(await answer.text())('meta[name="robots"]').attr('content')).toBe(
      'noindex, nofollow',
    );
  });

  test('21. `robots.txt` NO nombra `/admin`: listarlo publicaría la ruta', async () => {
    const { buildRobotsTxt } = await import('@/site/robots-txt');
    const served = buildRobotsTxt();

    expect(served).not.toContain('/admin');
    expect(served).not.toContain('Disallow: /admin');
  });
});

describe('CA-10 (ADR-025 §2.3 y §2.5) — teclado: cancelar existe y nada atrapa el foco', () => {
  test('22. cada formulario lleva su cancelación, alcanzable con el teclado', async () => {
    const $ = cheerio.load(await panelHtml(DETAIL_URL));

    expect($('form').length).toBeGreaterThan(0);
    $('form').each((_index, element) => {
      expect($(element).find('[data-cancel]').length).toBeGreaterThan(0);
    });
  });

  test('23. el orden de tabulación es el del DOM: no hay ningún `tabindex` positivo', async () => {
    for (const url of [undefined, DETAIL_URL]) {
      const $ = cheerio.load(await panelHtml(url));
      $('[tabindex]').each((_index, element) => {
        expect(Number($(element).attr('tabindex'))).toBeLessThanOrEqual(0);
      });
    }
  });

  test('24. nada modal: no hay `dialog` ni `aria-modal` que pueda atrapar el foco', async () => {
    const $ = cheerio.load(await panelHtml(DETAIL_URL));

    expect($('dialog').length).toBe(0);
    expect($('[aria-modal]').length).toBe(0);
  });
});
