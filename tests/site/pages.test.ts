/**
 * CA-2, CA-3, CA-6, CA-8, CA-9 y CA-10 sobre el HTML que sirven las dos rutas
 * del sitio.
 *
 * Se renderiza la composición REAL de cada ruta —su root layout más su
 * página—, no una copia de conveniencia: si mañana la ruta deja de usar el
 * documento del sitio, estos tests dejan de decir la verdad y hay que verlo.
 *
 * Lo que este fichero NO puede comprobar, y por eso lo comprueba el
 * verificador sobre el despliegue: las cabeceras de la respuesta (CA-10) y el
 * ancho de 360 px sin scroll horizontal (CA-9, Playwright).
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { stripComments } from './source-scan';
import EsLayout from '@/app/(es)/layout';
import EsProjectPage from '@/app/(es)/es/proxecto/page';
import GlLayout from '@/app/(gl)/layout';
import GlProjectPage from '@/app/(gl)/proxecto/page';
import { es } from '@/i18n/es';
import { gl } from '@/i18n/gl';
import type { SiteLocale } from '@/i18n/site-bundle';
import { MAILBOX } from '@/site/contact';
import { CRAWLER_PATH, PROJECT_PATH } from '@/site/routes';
import { UMBRELLA_URL } from '@/site/umbrella';

const ROUTES = {
  gl: { layout: GlLayout, page: GlProjectPage, bundle: gl.site },
  es: { layout: EsLayout, page: EsProjectPage, bundle: es.site },
} as const;

function render(locale: SiteLocale): string {
  const { layout, page } = ROUTES[locale];
  return renderToStaticMarkup(createElement(layout, null, createElement(page)));
}

const HTML = { gl: render('gl'), es: render('es') } as const;
const LOCALES: readonly SiteLocale[] = ['gl', 'es'];

/** El texto de una clave, ya interpolado, tal y como se lee en la página. */
function text(locale: SiteLocale, key: keyof typeof gl.site): string {
  return ROUTES[locale].bundle[key].replace('{mailbox}', MAILBOX);
}

/**
 * Los tramos de un literal que NO están en el HTML. Se devuelven en vez de
 * afirmarse uno a uno para que el fallo diga qué clave falta, y no solo que
 * falta algo.
 */
function missingFrom(html: string, value: string, label: string): string[] {
  return value
    .split(MAILBOX)
    .filter((chunk) => chunk.trim().length > 0 && !html.includes(chunk))
    .map(() => label);
}

describe('CA-2 — galego por defecto', () => {
  test('1. /proxecto sirve lang="gl"', () => {
    expect(HTML.gl).toContain('<html lang="gl"');
  });

  test('2. todo el texto visible de /proxecto sale del bundle gl', () => {
    const missing = (Object.keys(gl.site) as (keyof typeof gl.site)[]).flatMap((key) =>
      missingFrom(HTML.gl, text('gl', key), `gl.site.${key}`),
    );

    expect(missing).toEqual([]);
  });

  test('3. /proxecto no sirve ni una frase del bundle es', () => {
    expect(HTML.gl).not.toContain(es.site.aboutHeading);
    expect(HTML.gl).not.toContain(text('es', 'about'));
    expect(HTML.gl).not.toContain(es.site.noProduct);
  });
});

describe('CA-3 — castellano, con URL propia y sin JavaScript', () => {
  test('4. /es/proxecto sirve lang="es"', () => {
    expect(HTML.es).toContain('<html lang="es"');
  });

  test('5. todo el texto visible de /es/proxecto sale del bundle es', () => {
    const missing = (Object.keys(es.site) as (keyof typeof es.site)[]).flatMap((key) =>
      missingFrom(HTML.es, text('es', key), `es.site.${key}`),
    );

    expect(missing).toEqual([]);
  });

  test('6. el conmutador de lengua es un <a href>, no un botón con manejador', () => {
    expect(HTML.gl).toContain(`<a href="${PROJECT_PATH.es}"`);
    expect(HTML.es).toContain(`<a href="${PROJECT_PATH.gl}"`);

    for (const locale of LOCALES) {
      expect(HTML[locale]).not.toContain('<button');
      expect(HTML[locale]).not.toMatch(/\bon[a-z]+=/);
    }
  });
});

describe('CA-6 — no hay promesa de producto', () => {
  const FORBIDDEN = [
    'patrocinio',
    'patrocinar',
    'patrocinador',
    'sponsor',
    'lista de espera',
    'lista de agarda',
    'newsletter',
    'subscríbete',
    'apúntate',
    'próximamente',
    'en breve',
    'lanzamento',
    'lanzamiento',
  ];

  test('7. ninguna ruta sirve un formulario, un campo ni una imagen', () => {
    for (const locale of LOCALES) {
      expect(HTML[locale]).not.toContain('<form');
      expect(HTML[locale]).not.toContain('<input');
      expect(HTML[locale]).not.toContain('<img');
    }
  });

  test('8. ningún término de la lista negra aparece en ninguna ruta', () => {
    for (const locale of LOCALES) {
      const lower = HTML[locale].toLowerCase();

      expect(FORBIDDEN.filter((term) => lower.includes(term))).toEqual([]);
    }
  });

  test('9. no hay ninguna fecha: sin año no hay fecha de disponibilidad', () => {
    for (const locale of LOCALES) {
      expect(HTML[locale]).not.toMatch(/\b(?:19|20)\d{2}\b/);
    }
  });
});

describe('CA-8 — lo que la página de proyecto tiene que decir', () => {
  test('10. quién está detrás, con el buzón como mailto tomado de la constante', () => {
    for (const locale of LOCALES) {
      expect(HTML[locale]).toContain(ROUTES[locale].bundle.aboutHeading);
      expect(missingFrom(HTML[locale], text(locale, 'about'), locale)).toEqual([]);
      expect(HTML[locale]).toContain(`href="mailto:${MAILBOX}"`);
    }
  });

  /**
   * MODULADO POR SPEC-007 CA-4 (ADR-012, aprobado el 2026-09-01). Este caso
   * exigía las cuatro métricas y las dos competiciones por su nombre
   * canónico. Alberto Fojo pidió el 2026-09-01 lo contrario: «tampouco quero
   * que sexa tan específico co que se vai medir; con dicir que se medirán as
   * opcións de obter resultados do fútbol galego abonda». La cláusula deja de
   * exigir la enumeración y pasa a PROHIBIRLA.
   *
   * La lista negra se aplica al espacio `site` y al HTML de las dos rutas de
   * proyecto, NUNCA al sitio entero: `/robot` sirve la cadena literal del
   * user-agent, que contiene `medicion de latencia` (SPEC-005 CA-2), y una
   * barrera global la pondría en rojo.
   */
  test('11. qué se mide, dicho en general: ni una competición ni una métrica', () => {
    const NO_COMPETITIONS = [
      'terceira rfef',
      'tercera rfef',
      'preferente futgal',
      'futgal',
      'rfef',
      'g1',
    ];
    const NO_METRICS = ['latencia', 'cobertura', 'conflitos', 'conflictos', 'operacion manual'];
    const FORBIDDEN = [...NO_COMPETITIONS, ...NO_METRICS];

    const deaccent = (value: string): string =>
      value.normalize('NFD').replaceAll(/\p{Diacritic}/gu, '').toLowerCase();

    for (const locale of LOCALES) {
      // El espacio `site` entero, no solo `measuring`: si la enumeración se
      // mudase a `noProduct` la página seguiría diciendo lo mismo.
      const bundle = deaccent(Object.values(ROUTES[locale].bundle).join(' \n '));
      expect(FORBIDDEN.filter((term) => bundle.includes(term))).toEqual([]);
      expect(FORBIDDEN.filter((term) => deaccent(HTML[locale]).includes(term))).toEqual([]);

      // Y lo que sí dice: el objeto del estudio, en general.
      const measuring = deaccent(text(locale, 'measuring'));
      expect(measuring).toMatch(/opcions|opciones/);
      expect(measuring).toMatch(/resultados do futbol galego|resultados del futbol gallego/);
      expect(missingFrom(HTML[locale], text(locale, 'measuring'), locale)).toEqual([]);
    }
  });

  test('12. para qué: decidir si es viable, y el resultado es un informe interno', () => {
    for (const locale of LOCALES) {
      const purpose = text(locale, 'purpose').toLowerCase();
      expect(purpose).toContain('viable');
      expect(purpose).toContain('informe interno');
      expect(missingFrom(HTML[locale], text(locale, 'purpose'), locale)).toEqual([]);
    }
  });

  test('13. que todavía no hay producto', () => {
    for (const locale of LOCALES) {
      expect(HTML[locale]).toContain(ROUTES[locale].bundle.noProductHeading);
      expect(missingFrom(HTML[locale], text(locale, 'noProduct'), locale)).toEqual([]);
    }
  });

  test('14. un enlace a la página del rastreador', () => {
    expect(HTML.gl).toContain(`<a href="${CRAWLER_PATH.gl}"`);
    expect(HTML.es).toContain(`<a href="${CRAWLER_PATH.es}"`);
    for (const locale of LOCALES) {
      expect(HTML[locale]).toContain(ROUTES[locale].bundle.crawlerLink);
    }
  });
});

describe('CA-9 / CA-10 — mala cobertura, sin terceros y sin rastro', () => {
  test('15. no hay ningún script ni hoja de estilo de un origen externo', () => {
    for (const locale of LOCALES) {
      expect(HTML[locale]).not.toMatch(/<script[^>]+src=/i);
      expect(HTML[locale]).not.toMatch(/<link[^>]+rel="stylesheet"[^>]+href="https?:/i);
    }
  });

  /**
   * MODULADO POR SPEC-007 CA-2.4 (ADR-012 §2, aprobado el 2026-09-01). Este
   * caso prohibía TODA URL absoluta, que es más estricto que el CA que dice
   * implementar: CA-10 habla de que el HTML no haga «ninguna petición a un
   * tercero», y un `<a href>` no pide nada — la descarga la decide el
   * visitante al hacer clic, y hasta entonces no sale un byte.
   *
   * La barrera SE ESTRECHA, no se levanta: se sigue prohibiendo toda URL
   * absoluta en un atributo que descargue por sí solo, y se admite
   * exactamente una en un `href` de `<a>`, la del paraguas. Forma y
   * precedente: los casos finales de `crawler-page.test.ts`.
   */
  test('16. la única URL absoluta del HTML es la del paraguas, y va en un href de <a>', () => {
    for (const locale of LOCALES) {
      // Nada que el navegador descargue solo.
      expect(HTML[locale]).not.toMatch(/\b(?:src|srcset)\s*=\s*["']?https?:/i);
      expect(HTML[locale]).not.toMatch(/<link[^>]+href=["']?https?:/i);
      expect(HTML[locale]).not.toMatch(/url\(\s*['"]?(?:https?:)?\/\//i);

      // Y una sola URL absoluta en todo el documento: la del paraguas.
      const absolute = [...HTML[locale].matchAll(/https?:\/\/[^\s"'<)]+/g)].map((m) => m[0]);
      expect(absolute).toEqual([UMBRELLA_URL]);
      expect(HTML[locale]).toContain(`<a href="${UMBRELLA_URL}"`);
    }
  });

  test('17. la hoja de estilo no descarga fuentes ni nada de fuera', async () => {
    // Se quitan los comentarios: la prosa que explica que NO hay @font-face no
    // puede contar como un @font-face. Mismo motivo que el caso 8 de
    // `tests/mirror/capture/robots.test.ts`.
    const css = stripComments(await readFile(join(process.cwd(), 'src/app/globals.css'), 'utf8'));

    expect(css).not.toContain('@import');
    expect(css).not.toContain('@font-face');
    expect(css).not.toMatch(/url\(\s*['"]?(?:https?:)?\/\//);
  });

  test('18. el sitio no toca cookies ni cabeceras de petición', async () => {
    const sources = await Promise.all(
      [
        'src/app/(gl)/layout.tsx',
        'src/app/(gl)/proxecto/page.tsx',
        'src/app/(es)/layout.tsx',
        'src/app/(es)/es/proxecto/page.tsx',
        'src/site/document.tsx',
        'src/site/project-page.tsx',
      ].map(async (p) => stripComments(await readFile(join(process.cwd(), p), 'utf8'))),
    );

    for (const source of sources) {
      expect(source).not.toContain('next/headers');
      expect(source).not.toContain('cookie');
      expect(source).not.toContain("'use client'");
    }
  });
});
