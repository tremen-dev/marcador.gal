/**
 * SPEC-007 CA-1 y CA-2 — la identidad pública del sitio: sin nombre, con
 * paraguas enlazado.
 *
 * Fichero NUEVO a propósito. CA-6.2 autoriza modificar cinco casos de dos
 * ficheros de SPEC-004 y ni uno más, así que lo que esta spec AÑADE —una
 * barrera más ancha que la que había y un enlace que antes no existía— no
 * cabe en ellos: `contact.test.ts` está expresamente cerrado (su caso 4 exige
 * que `site/contact.ts` no exporte nada más que el buzón) y `pages.test.ts`
 * solo tiene abiertos los casos 11 y 16.
 *
 * La barrera de CA-1 se escribe sobre los TRES espacios de nombres —`site`,
 * `crawler` y `titles`— y sobre el HTML de las CUATRO rutas, no sobre `about`.
 * El nombre salió de `about` porque era donde estaba; la razón de ADR-012 §1
 * es que no vuelva a entrar por ningún otro sitio.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import EsLayout from '@/app/(es)/layout';
import EsProjectPage from '@/app/(es)/es/proxecto/page';
import EsCrawlerPage from '@/app/(es)/es/robot/page';
import GlLayout from '@/app/(gl)/layout';
import GlProjectPage from '@/app/(gl)/proxecto/page';
import GlCrawlerPage from '@/app/(gl)/robot/page';
import { es } from '@/i18n/es';
import { gl } from '@/i18n/gl';
import { SITE_LOCALES, siteBundle } from '@/i18n/site';

/**
 * Ninguna grafía ni capitalización: se busca sobre el texto desacentuado y en
 * minúsculas, igual que la lista negra de D-1 (caso 5 de `i18n.test.ts`).
 */
const NO_PERSON = ['alberto', 'fojo'];

/**
 * «Ni si soy uno o mil» (Alberto Fojo, 2026-09-01; ADR-012 §1). No basta con
 * que no salga el nombre: tampoco puede decirse CUÁNTAS personas hay ni bajo
 * qué forma jurídica, que es lo que decía la redacción anterior —«Non hai
 * empresa nin equipo detrás: unha soa persoa traballando por conta propia»—.
 */
const NO_HEADCOUNT = [
  'unha soa persoa',
  'una sola persona',
  'por conta propia',
  'por cuenta propia',
  'autonomo',
  'autonoma',
  'non hai empresa',
  'no hay empresa',
  'nin equipo',
  'ni equipo',
];

function deaccent(text: string): string {
  return text.normalize('NFD').replaceAll(/\p{Diacritic}/gu, '').toLowerCase();
}

/** Los TRES espacios de nombres de un bundle, no solo el del sitio. */
const NAMESPACES = {
  gl: [gl.site, gl.crawler, gl.titles],
  es: [es.site, es.crawler, es.titles],
} as const;

function everyLiteral(locale: 'gl' | 'es'): string {
  return NAMESPACES[locale].flatMap((ns) => Object.values(ns)).join(' \n ');
}

/** Las cuatro rutas del sitio, con su composición real (layout + página). */
const HTML = {
  'gl /proxecto': renderToStaticMarkup(
    createElement(GlLayout, null, createElement(GlProjectPage)),
  ),
  'es /es/proxecto': renderToStaticMarkup(
    createElement(EsLayout, null, createElement(EsProjectPage)),
  ),
  'gl /robot': renderToStaticMarkup(createElement(GlLayout, null, createElement(GlCrawlerPage))),
  'es /es/robot': renderToStaticMarkup(createElement(EsLayout, null, createElement(EsCrawlerPage))),
} as const;

describe('CA-1 — el sitio no nombra a ninguna persona, ni dice cuántas son', () => {
  test('1. ningún espacio de nombres de ninguno de los dos bundles nombra a una persona', () => {
    const hits = SITE_LOCALES.flatMap((locale) => {
      const text = deaccent(everyLiteral(locale));
      return NO_PERSON.filter((term) => text.includes(term)).map((term) => `${locale}: ${term}`);
    });

    expect(hits).toEqual([]);
  });

  test('2. ni declara cuántas personas hay detrás ni bajo qué forma jurídica', () => {
    const hits = SITE_LOCALES.flatMap((locale) => {
      const text = deaccent(everyLiteral(locale));
      return NO_HEADCOUNT.filter((term) => text.includes(term)).map((term) => `${locale}: ${term}`);
    });

    expect(hits).toEqual([]);
  });

  test('3. tampoco el HTML servido de las cuatro rutas, que es lo que se lee', () => {
    const hits = Object.entries(HTML).flatMap(([route, html]) => {
      const text = deaccent(html);
      return [...NO_PERSON, ...NO_HEADCOUNT]
        .filter((term) => text.includes(term))
        .map((term) => `${route}: ${term}`);
    });

    expect(hits).toEqual([]);
  });

  test('4. la barrera no es vacua: mira los tres espacios y las cuatro rutas', () => {
    // Sin esto, un `everyLiteral` que devolviera '' o un HTML vacío darían
    // verde los tres casos anteriores sin comprobar nada. Mismo motivo que el
    // caso 1 de `no-hardcoded-literals.test.ts`.
    for (const locale of SITE_LOCALES) {
      expect(NAMESPACES[locale]).toHaveLength(3);
      expect(everyLiteral(locale).length).toBeGreaterThan(1000);
    }

    expect(Object.keys(HTML)).toHaveLength(4);
    for (const html of Object.values(HTML)) expect(html).toContain('<html lang=');
  });

  test('5. y «quen está detrás» sigue diciendo quién responde: tremen.dev', () => {
    // Quitar el nombre sin dejar paraguas convertiría la página en evasiva,
    // que es lo contrario de para lo que existe (ADR-012 §2).
    for (const locale of SITE_LOCALES) {
      expect(siteBundle(locale).about).toContain('tremen.dev');
    }
  });
});
