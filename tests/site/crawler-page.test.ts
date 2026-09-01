/**
 * SPEC-005 CA-2, CA-3, CA-5, CA-6 y CA-13 sobre el HTML que sirven `/robot` y
 * `/es/robot`.
 *
 * Se renderiza la composición REAL de cada ruta —su root layout más su
 * página—, igual que `pages.test.ts`: si mañana la ruta deja de usar el
 * documento del sitio, estos tests dejan de decir la verdad y hay que verlo.
 *
 * La página existe para que un tercero pueda COMPROBAR lo que la carta afirma.
 * Cada frase suya es un hecho sobre cómo rastreamos, ante quien puede
 * contrastarlo con sus propios registros: por eso la lista de abajo no es de
 * estilo, y por eso el literal del user-agent se importa en vez de escribirse.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { readSourceFiles } from './source-scan';
import EsLayout from '@/app/(es)/layout';
import EsCrawlerPage from '@/app/(es)/es/robot/page';
import GlLayout from '@/app/(gl)/layout';
import GlCrawlerPage from '@/app/(gl)/robot/page';
import { crawlerBundle } from '@/i18n/crawler';
import type { CrawlerBundle } from '@/i18n/crawler-bundle';
import { es } from '@/i18n/es';
import { gl } from '@/i18n/gl';
import { SITE_LOCALES } from '@/i18n/site';
import type { SiteLocale } from '@/i18n/site-bundle';
import { USER_AGENT } from '@/mirror/user-agent';
import { MAILBOX } from '@/site/contact';
import { CRAWLER_PATH } from '@/site/routes';

const ROUTES = {
  gl: { layout: GlLayout, page: GlCrawlerPage },
  es: { layout: EsLayout, page: EsCrawlerPage },
} as const;

function render(locale: SiteLocale): string {
  const { layout, page } = ROUTES[locale];
  return renderToStaticMarkup(createElement(layout, null, createElement(page)));
}

const HTML = { gl: render('gl'), es: render('es') } as const;
const LOCALES: readonly SiteLocale[] = ['gl', 'es'];

/** El texto de una clave, ya interpolado, tal y como se lee en la página. */
function text(locale: SiteLocale, key: keyof CrawlerBundle): string {
  return crawlerBundle(locale)[key].replaceAll('{mailbox}', MAILBOX);
}

/** Los tramos de un literal que NO están en el HTML, con la clave que falta. */
function missingFrom(html: string, value: string, label: string): string[] {
  return value
    .split(MAILBOX)
    .filter((chunk) => chunk.trim().length > 0 && !html.includes(chunk))
    .map(() => label);
}

function deaccent(value: string): string {
  return value
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

describe('CA-2 — identidad página ↔ código, carácter a carácter', () => {
  test('1. las dos rutas sirven la cadena `USER_AGENT` exacta', () => {
    for (const locale of LOCALES) {
      expect(HTML[locale]).toContain(USER_AGENT);
    }
  });

  test('2. el literal no está escrito a mano en ningún bundle ni componente del sitio', async () => {
    const files = await readSourceFiles();

    // Nadie transcribe la cadena entera, ni siquiera el módulo que la define:
    // allí se COMPONE de sus partes.
    expect(files.filter((f) => f.text.includes(USER_AGENT)).map((f) => f.path)).toEqual([]);

    // Y el propósito declarado —el tramo que un copiar-pegar arrastraría—
    // vive en un solo fichero.
    expect(files.filter((f) => f.text.includes('medicion de latencia')).map((f) => f.path)).toEqual([
      'mirror/user-agent.ts',
    ]);
  });

  test('3. la página lo importa: si la constante cambia, el HTML cambia con ella', () => {
    // Se comprueba contra el valor de hoy además de contra la constante, para
    // que este caso no pueda pasar comparando el valor consigo mismo.
    for (const locale of LOCALES) {
      expect(HTML[locale]).toContain(
        'marcador.gal/0.0.1 (+https://marcador.gal/robot; medicion de latencia)',
      );
    }
  });
});

describe('CA-3 — la página no habla el idioma del repositorio', () => {
  test('4. ninguna de las dos rutas contiene un identificador interno', () => {
    for (const locale of LOCALES) {
      const upper = HTML[locale].toUpperCase();
      const found = ['SPEC-', 'RN-', 'EPIC-', 'ADR-'].filter((marker) => upper.includes(marker));

      expect(found).toEqual([]);
    }
  });
});

describe('CA-5 — el buzón sigue delante', () => {
  test('5. el buzón es un enlace mailto y sale de la constante única', () => {
    for (const locale of LOCALES) {
      expect(HTML[locale]).toContain(`href="mailto:${MAILBOX}"`);
    }
  });

  test('6. está en el primer bloque: antes del segundo encabezado del documento', () => {
    // Es la ÚNICA compensación del riesgo que el gate aceptó: al salir el
    // `mailto:` de la cabecera, un operador que ve el user-agent en su registro
    // ya no tiene el correo delante. Si esto se degrada, se pierde lo que
    // RN-11 protegía.
    for (const locale of LOCALES) {
      const headings = [...HTML[locale].matchAll(/<h[1-6][\s>]/g)].map((m) => m.index);

      expect(headings.length).toBeGreaterThanOrEqual(2);

      const mailbox = HTML[locale].indexOf(`mailto:${MAILBOX}`);
      expect(mailbox).toBeGreaterThan(-1);
      expect(mailbox).toBeLessThan(headings[1]!);
    }
  });

  test('7. y va acompañado de la frase que dice que ahí se pide que paremos, y que se para', () => {
    for (const locale of LOCALES) {
      expect(missingFrom(HTML[locale], text(locale, 'contact'), `${locale}.contact`)).toEqual([]);
    }
  });
});

describe('CA-6 — las afirmaciones comprobables de la carta, publicadas', () => {
  /** Las seis, cada una con su clave. El orden es el de la spec. */
  const CLAIMS: readonly (keyof CrawlerBundle)[] = [
    'userAgent',
    'rate',
    'robots',
    'noRepublish',
    'storage',
    'stop',
  ];

  test('8. cada afirmación tiene su propia clave de i18n, en las dos lenguas', () => {
    for (const locale of LOCALES) {
      const bundle = crawlerBundle(locale);
      const missing = CLAIMS.filter((key) => bundle[key].trim().length === 0);

      expect(missing).toEqual([]);
    }
  });

  test('9. y cada una se sirve entera en las dos rutas', () => {
    const missing = LOCALES.flatMap((locale) =>
      CLAIMS.flatMap((key) => missingFrom(HTML[locale], text(locale, key), `${locale}.${key}`)),
    );

    expect(missing).toEqual([]);
  });

  test('10. el tope está dicho en número, no en adjetivo: una petición por minuto', () => {
    for (const locale of LOCALES) {
      const rate = deaccent(text(locale, 'rate'));

      expect(rate).toMatch(/unha peticion|una peticion/);
      expect(rate).toContain('por minuto');
      expect(rate).toMatch(/competicion/);
    }
  });

  test('11. respetar robots.txt no admite excepción, y hay fuentes que hoy no se leen por eso', () => {
    for (const locale of LOCALES) {
      const robots = deaccent(text(locale, 'robots'));

      expect(robots).toContain('robots.txt');
      expect(robots).toMatch(/sempre|siempre/);
      expect(robots).toMatch(/non hai excepcion|no hay excepcion/);
      // La regla general, sin citar a nadie (CA-13).
      expect(robots).toMatch(/fontes que hoxe non lemos|fuentes que hoy no leemos/);
    }
  });

  test('12. no se republica el dato de terceros: esto es medición y el resultado es un informe interno', () => {
    for (const locale of LOCALES) {
      const claim = deaccent(text(locale, 'noRepublish'));

      expect(claim).toMatch(/non republicamos|no republicamos/);
      expect(claim).toContain('informe interno');
    }
  });

  test('13. qué se guarda y cuánto: crudo antes de interpretar, 30 días, una prórroga, techo de 90', () => {
    for (const locale of LOCALES) {
      const claim = deaccent(text(locale, 'storage'));

      expect(claim).toMatch(/antes de interpretala|antes de interpretarla/);
      expect(claim).toContain('30 dias');
      expect(claim).toContain('90 dias');
      expect(claim).toMatch(/prorrogar|prorroga/);
      expect(claim).toMatch(/unha soa vez|una sola vez/);
    }
  });

  test('14. cómo pedir que paremos, y que basta con pedirlo', () => {
    for (const locale of LOCALES) {
      const claim = deaccent(text(locale, 'stop'));

      expect(claim).toContain(deaccent(MAILBOX));
      expect(claim).toMatch(/abonda con pedilo|basta con pedirlo/);
    }
  });

  test('15. y nada más: la página no anuncia producto, no pide correo y no vende nada', () => {
    const FORBIDDEN = [
      'patrocinio',
      'patrocinar',
      'patrocinador',
      'sponsor',
      'lista de espera',
      'lista de agarda',
      'newsletter',
      'subscribete',
      'apuntate',
      'proximamente',
      'en breve',
      'lanzamento',
      'lanzamiento',
    ];

    for (const locale of LOCALES) {
      const lower = deaccent(HTML[locale]);

      expect(FORBIDDEN.filter((term) => lower.includes(term))).toEqual([]);
      expect(HTML[locale]).not.toContain('<form');
      expect(HTML[locale]).not.toContain('<input');
      expect(HTML[locale]).not.toContain('<img');
    }
  });

  test('16. D-1: no se presenta como sucesión de nada', () => {
    const NOT_A_SUCCESSION = [
      'marcadorgalego',
      'relevo',
      'sucesor',
      'sucesora',
      'sucesion',
      'continuacion',
      'continuadora',
      'herdeiro',
      'herdeira',
      'volve',
      'regresa',
    ];

    for (const locale of LOCALES) {
      const lower = deaccent(HTML[locale]);

      expect(NOT_A_SUCCESSION.filter((term) => lower.includes(term))).toEqual([]);
    }
  });

  test('17. mala cobertura y cero analítica: nada de fuera, ningún script, ninguna fecha', () => {
    for (const locale of LOCALES) {
      expect(HTML[locale]).not.toMatch(/<script/i);
      expect(HTML[locale]).not.toMatch(/<link[^>]+rel="stylesheet"[^>]+href="https?:/i);
      expect(HTML[locale]).not.toMatch(/\bon[a-z]+=/);
      expect(HTML[locale]).not.toMatch(/\b(?:19|20)\d{2}\b/);

      // La única URL absoluta admitida es la nuestra, y va dentro del
      // user-agent: es texto, no una petición a un tercero.
      const absolute = [...HTML[locale].matchAll(/https?:\/\/[^\s"'<)]+/g)].map((m) => m[0]);
      expect(absolute.filter((url) => !url.startsWith('https://marcador.gal'))).toEqual([]);
    }
  });
});

describe('CA-13 — la página del rastreador no cita a ningún tercero', () => {
  /**
   * Más ancha que `futgal` a propósito: la razón vale igual para cualquier
   * fuente, y una lista que solo atrape el caso de hoy se queda corta el día
   * que haya otro. El caso concreto se queda en la carta, que es donde tiene
   * un destinatario y una conversación.
   */
  const THIRD_PARTIES = ['futgal', 'ceroacero', 'besoccer', 'resultados-futbol', 'rfgf'];

  test('18. ninguna de las dos rutas nombra a ninguna fuente', () => {
    for (const locale of LOCALES) {
      const lower = deaccent(HTML[locale]);

      expect(THIRD_PARTIES.filter((term) => lower.includes(term))).toEqual([]);
    }
  });

  test('19. la prohibición es de ESTAS rutas, no del sitio: /proxecto sigue nombrando las competiciones', () => {
    // Si la lista se acotara mal, SPEC-004 CA-8.2 y esta spec chocarían. Los
    // nombres canónicos de las competiciones que se miden siguen donde estaban.
    expect(gl.site.measuring).toContain('Preferente Futgal G1');
    expect(es.site.measuring).toContain('Preferente Futgal G1');
  });
});

describe('paridad de bundles del rastreador', () => {
  test('20. las dos lenguas tienen exactamente las mismas claves, y ninguna vacía', () => {
    expect(Object.keys(gl.crawler).sort()).toEqual(Object.keys(es.crawler).sort());

    const empty = SITE_LOCALES.flatMap((locale) =>
      Object.entries(crawlerBundle(locale))
        .filter(([, value]) => value.trim() === '')
        .map(([key]) => `${locale}.${key}`),
    );

    expect(empty).toEqual([]);
  });

  test('21. el buzón se interpola, no se escribe: los bundles llevan el hueco', () => {
    for (const locale of SITE_LOCALES) {
      const values = Object.values(crawlerBundle(locale));

      expect(values.filter((value) => value.includes(MAILBOX))).toEqual([]);
      expect(values.filter((value) => value.includes('{mailbox}')).length).toBeGreaterThan(0);
    }
  });

  test('22. el conmutador de lengua apunta a la gemela de esta página, no a la de proyecto', () => {
    expect(HTML.gl).toContain(`<a href="${CRAWLER_PATH.es}"`);
    expect(HTML.es).toContain(`<a href="${CRAWLER_PATH.gl}"`);
  });
});
