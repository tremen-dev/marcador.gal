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
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { headerComment, readSourceFiles, SRC } from './source-scan';
import { UMBRELLA_URL } from '@/site/umbrella';
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

const UMBRELLA_MODULE = 'site/umbrella.ts';

const PROJECT_HTML = {
  gl: HTML['gl /proxecto'],
  es: HTML['es /es/proxecto'],
} as const;

describe('CA-2 — el paraguas se nombra y se enlaza: el enlace es estructural', () => {
  test('6. la sección «quen está detrás» lleva un <a href> real al paraguas', () => {
    for (const locale of SITE_LOCALES) {
      // Un `<a href>`, no texto plano y no un `mailto:`: el lector tiene que
      // poder mirar bajo qué paraguas está esto (ADR-012 §2).
      expect(PROJECT_HTML[locale]).toContain(`<a href="${UMBRELLA_URL}"`);
      expect(PROJECT_HTML[locale]).not.toContain(`mailto:${UMBRELLA_URL}`);
    }
  });

  test('7. su etiqueta visible sale de una clave de i18n de los dos bundles (D-2)', () => {
    // Y las dos lenguas dicen cosas distintas: si la clave existiera pero
    // fuese la misma cadena, sería un literal disfrazado de i18n.
    expect(gl.site.umbrellaLink).not.toEqual(es.site.umbrellaLink);

    for (const locale of SITE_LOCALES) {
      const label = siteBundle(locale).umbrellaLink;
      expect(label.trim().length).toBeGreaterThan(0);
      expect(PROJECT_HTML[locale]).toContain(`>${label}</a>`);
    }
  });

  test('8. y `about` sigue nombrando tremen.dev en prosa: un enlace solo no lo dice', () => {
    for (const locale of SITE_LOCALES) {
      expect(siteBundle(locale).about).toContain('tremen.dev');
    }
  });

  test('9. la URL sale de UNA constante de src/site, y no de site/contact.ts', async () => {
    const files = await readSourceFiles();
    const carriers = files.filter((f) => f.text.includes(UMBRELLA_URL)).map((f) => f.path);

    // Misma forma que el caso 2 de `contact.test.ts`: una sola definición y
    // todo lo demás la referencia. `site/contact.ts` queda expresamente
    // fuera — su caso 4 exige que no exporte nada más que el buzón, y meter
    // esto ahí sería tumbar una barrera de SPEC-004 en vez de modularla.
    expect(carriers).toEqual([UMBRELLA_MODULE]);
    expect(UMBRELLA_MODULE).not.toBe('site/contact.ts');

    const source = await readFile(join(SRC, UMBRELLA_MODULE), 'utf8');
    expect([...source.matchAll(/^export const (\w+)/gm)].map((m) => m[1])).toEqual([
      'UMBRELLA_URL',
    ]);
  });

  test('10. la cabecera de esa constante lleva escrito el contrato', async () => {
    const header = headerComment(await readFile(join(SRC, UMBRELLA_MODULE), 'utf8'));

    // El aviso tiene que alcanzar a quien edite ESA línea, en el momento en
    // que la edita: lo único que se le pide a esta URL es que resuelva, y si
    // se cae, el que responde es el buzón (ADR-012 §2 y §3).
    expect(header).toContain('names no person');
    expect(header).toContain('that it resolves');
    expect(header).toContain('THE MAILBOX IS NOT TO BE TOUCHED');
    expect(header).toContain('ADR-012');
  });
});
