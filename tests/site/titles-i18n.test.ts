/**
 * SPEC-006 CA-3 — los títulos de documento viven en un espacio de nombres
 * propio, con paridad de lenguas, y el namespace del sitio ya no los lleva.
 *
 * Misma forma que `tests/site/i18n.test.ts` para el namespace del sitio y que
 * el caso 20 de `tests/site/crawler-page.test.ts` para el del rastreador.
 *
 * Y la razón de que sea un namespace aparte es la que ya está escrita en la
 * cabecera de `src/i18n/crawler-bundle.ts`: los casos 2 y 5 de
 * `tests/site/pages.test.ts` recorren CADA clave del namespace del sitio y
 * exigen que se sirva en el HTML de `/proxecto`. Un título no se sirve en el
 * cuerpo de ninguna página — es el caso extremo de esa regla, no una excepción
 * a ella.
 *
 * La mitad de TIPO de este criterio —CA-3a, que olvidar una lengua rompa el
 * `typecheck`— vive en `tests/site/titles.test-d.ts`.
 */
import { describe, expect, test } from 'vitest';
import { es } from '@/i18n/es';
import { gl } from '@/i18n/gl';
import { SITE_LOCALES } from '@/i18n/site';
import { titlesBundle } from '@/i18n/titles';
import type { TitlesBundle } from '@/i18n/titles-bundle';

/** Una clave por página del sitio. Hoy son dos: proyecto y rastreador. */
const PAGES: readonly (keyof TitlesBundle)[] = ['project', 'crawler'];

describe('CA-3b — paridad de lenguas del namespace de títulos', () => {
  test('1. las dos lenguas tienen exactamente las mismas claves', () => {
    expect(Object.keys(gl.titles).sort()).toEqual(Object.keys(es.titles).sort());
  });

  test('2. la paridad se comprueba en las dos direcciones, clave a clave', () => {
    const glKeys = new Set(Object.keys(gl.titles));
    const esKeys = new Set(Object.keys(es.titles));

    expect([...glKeys].filter((k) => !esKeys.has(k))).toEqual([]);
    expect([...esKeys].filter((k) => !glKeys.has(k))).toEqual([]);
  });

  test('3. ninguna clave está vacía en ninguna de las dos lenguas', () => {
    const empty = SITE_LOCALES.flatMap((locale) =>
      Object.entries(titlesBundle(locale))
        .filter(([, value]) => value.trim() === '')
        .map(([key]) => `${locale}.${key}`),
    );

    expect(empty).toEqual([]);
  });

  test('4. hay un título por cada página del sitio, en las dos lenguas, y ninguno de más', () => {
    for (const locale of SITE_LOCALES) {
      const bundle = titlesBundle(locale);

      expect(PAGES.filter((key) => bundle[key].trim().length === 0)).toEqual([]);
    }

    expect(Object.keys(gl.titles).sort()).toEqual([...PAGES].sort());
    expect(Object.keys(es.titles).sort()).toEqual([...PAGES].sort());
  });
});

describe('CA-3c — el namespace del sitio ya no contiene el título', () => {
  test('5. ni `documentTitle` ni ninguna otra clave de título queda en el bundle del sitio', () => {
    for (const bundle of [gl.site, es.site]) {
      expect(Object.keys(bundle)).not.toContain('documentTitle');
      expect(Object.keys(bundle).filter((key) => key.toLowerCase().includes('title'))).toEqual([]);
    }
  });

  test('6. y ningún título es un valor de los que el sitio sí sirve en su cuerpo', () => {
    // Si un título volviera al namespace del sitio por otra puerta, los casos 2
    // y 5 de `pages.test.ts` —que exigen que CADA clave del sitio aparezca en
    // el HTML de `/proxecto`— volverían a mentir. Esto lo detecta antes.
    const served = new Set([...Object.values(gl.site), ...Object.values(es.site)]);

    for (const locale of SITE_LOCALES) {
      for (const value of Object.values(titlesBundle(locale))) {
        expect(served.has(value)).toBe(false);
      }
    }
  });
});
