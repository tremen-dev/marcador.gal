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

/**
 * Una clave por página del sitio. Hoy son TRES: proyecto, rastreador y
 * marcador.
 *
 * CENSO ACTUALIZADO EL 2026-09-04 (SPEC-018 CA-13.6, disciplina de CA-17.2).
 * Esto NO es ensanchar una suite por conveniencia ni debilitar una aserción:
 * es **el dato de un guardián cuyo dato cambió**. La lista enumera LAS PÁGINAS
 * DEL SITIO, el sitio gana una —`/marcador` y `/es/marcador`, ADR-027 §1— y la
 * regla que guarda —«hay un título por página y ninguno de más»— no cambia ni
 * una letra. Crecer es lo que se espera de ella cuando el sitio gana una
 * página, y este caso se ponía ROJO en cuanto el título nuevo existiera, que es
 * el mecanismo funcionando.
 */
const PAGES: readonly (keyof TitlesBundle)[] = ['project', 'crawler', 'scoreboard'];

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

  /**
   * COLISIÓN DECLARADA, Y NO ES UNA EXENCIÓN GENERAL — SPEC-018 CA-13.5.
   *
   * El gate del 2026-09-04 decidió que el título del marcador es
   * **`marcador.gal` a secas**, descartando la forma `O marcador —
   * marcador.gal`. Y `site.heading` ES TAMBIÉN `marcador.gal`: es el `<h1>` de
   * `/proxecto` desde SPEC-004. Así que el título del marcador coincide, VALOR
   * A VALOR, con una clave del namespace del sitio, y este caso se pone rojo
   * por una coincidencia de cadena, no por el defecto que vigila.
   *
   * LO QUE ESTE CASO VIGILA SIGUE VIGILADO E INTACTO: que un título no VUELVA
   * al namespace del sitio (caso 5, que recorre las claves de `site` buscando
   * `title`) y que los casos 2 y 5 de `pages.test.ts` —cada clave de `site` se
   * sirve en el cuerpo de `/proxecto`— no empiecen a mentir. Ninguna de las dos
   * cosas cambia: `scoreboard` vive en `titles`, no en `site`, y `site.heading`
   * se sigue sirviendo en `/proxecto` exactamente igual.
   *
   * LA EXCEPCIÓN ES POR IDENTIDAD DE CLAVE Y DE VALOR, no por relajar el
   * predicado: cualquier otro título que coincida con un valor del sitio sigue
   * siendo ROJO, y `scoreboard` sigue siendo rojo si deja de valer
   * `marcador.gal`.
   *
   * ⚠ ESTO EXIGE UNA ENMIENDA DE ADR-015 SOBRE SPEC-006 QUE SPEC-018 CA-18.4
   * NO ORDENÓ —ordena tres, sobre SPEC-004, SPEC-005 y SPEC-007— y que sólo
   * `sdd-arquitecto` puede firmar. Queda anotado como salvedad en el ledger de
   * SPEC-018 (F-SPEC-018-1).
   */
  const SCOREBOARD_BARE_DOMAIN = { key: 'scoreboard', value: 'marcador.gal' } as const;

  test('6. y ningún título es un valor de los que el sitio sí sirve en su cuerpo', () => {
    // Si un título volviera al namespace del sitio por otra puerta, los casos 2
    // y 5 de `pages.test.ts` —que exigen que CADA clave del sitio aparezca en
    // el HTML de `/proxecto`— volverían a mentir. Esto lo detecta antes.
    const served = new Set([...Object.values(gl.site), ...Object.values(es.site)]);

    for (const locale of SITE_LOCALES) {
      for (const [key, value] of Object.entries(titlesBundle(locale))) {
        if (key === SCOREBOARD_BARE_DOMAIN.key && value === SCOREBOARD_BARE_DOMAIN.value) {
          continue;
        }
        expect(served.has(value)).toBe(false);
      }
    }

    // La colisión declarada es EXACTAMENTE ésa y no otra: si el título del
    // marcador cambia, este caso vuelve a morder sin tocar nada.
    for (const locale of SITE_LOCALES) {
      expect(titlesBundle(locale).scoreboard).toBe(SCOREBOARD_BARE_DOMAIN.value);
    }
  });
});
