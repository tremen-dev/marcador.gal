/**
 * SPEC-006 CA-2 y CA-6, las dos barreras de fuente de esta spec.
 *
 * CA-2 NO es una repetición de SPEC-004 CA-5: es su hueco. El escaneo de
 * `tests/site/no-hardcoded-literals.test.ts` busca texto en JSX y literales en
 * ATRIBUTOS visibles (`title=`, `alt=`, `content=`…), y un título declarado
 * como DATO —`title: 'algo'`, con dos puntos y no con igual— pasa por debajo de
 * sus tres reglas. Desde que el título es un metadato de página en vez de
 * marcado, ese es justo el sitio por donde se colaría.
 *
 * CA-6 cierra F-SPEC-005-V4: ningún `<title>` en JSX. Nunca rompió nada
 * observable —React lo izaba a `<head>`—, pero mientras exista el mecanismo de
 * marcado conviven dos formas de poner título y el HTML sale con dos, ganando
 * el primero, que es el equivocado.
 *
 * Se reutiliza el ayudante compartido `tests/site/source-scan.ts`, igual que
 * SPEC-004 CA-5 y CA-13.3. Los bundles de i18n quedan fuera del escaneo de
 * rutas por definición: son el sitio donde el texto DEBE estar.
 */
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { readSourceFiles, SRC, stripComments, type SourceFile } from './source-scan';
import { SITE_LOCALES } from '@/i18n/site';
import type { SiteLocale } from '@/i18n/site-bundle';
import { titlesBundle } from '@/i18n/titles';

/** Igual que en `no-hardcoded-literals.test.ts`: `_contract/` no es una ruta. */
const NOT_A_ROUTE = 'app/_contract/';

/** `title: 'algo'` — un título declarado como dato, que es lo que CA-5 no ve. */
const LITERAL_TITLE_VALUE = /\btitle\s*:\s*(?:['"`]|\{)/;

/** Un `<title>` en JSX: lo que F-SPEC-005-V4 señaló en `SiteDocument`. */
const TITLE_ELEMENT = /<\s*title[\s>/]/i;

/** Dónde vive el texto de cada lengua, y el único sitio donde puede vivir. */
const BUNDLE_OF: Record<SiteLocale, string> = { gl: 'i18n/gl.ts', es: 'i18n/es.ts' };

/**
 * COLISIÓN DECLARADA, Y NO ES UNA EXENCIÓN GENERAL — SPEC-018 CA-13.5.
 *
 * El gate del 2026-09-04 decidió que el título del marcador es **`marcador.gal`
 * a secas**. Ese valor ES EL NOMBRE DEL DOMINIO, así que aparece por
 * construcción en once ficheros de `src/` que no tienen nada que ver con un
 * título —`polite/user-agent.ts`, `site/contact.ts`, `site/routes.ts`,
 * `site/robots-txt.ts`, `api/freshness.ts`…—, y este caso se pone rojo por una
 * coincidencia de cadena y no por el defecto que vigila.
 *
 * LO QUE ESTE CASO VIGILA SIGUE VIGILADO E INTACTO para los otros cuatro
 * títulos: que nadie transcriba mañana a mano un título que hoy sale de i18n.
 * Y para éste, lo que lo protege es lo que ya lo protegía antes: el caso 2
 * —ningún módulo de ruta declara un título como literal— y el hecho de que el
 * documento del marcador tome el suyo de `titlesBundle(locale).scoreboard`,
 * que el caso 5 de `document-titles.test.ts` afirma sobre el HTML servido.
 *
 * LA EXCEPCIÓN ES POR IDENTIDAD DE CLAVE Y DE VALOR: cualquier otro título que
 * aparezca fuera de su bundle sigue siendo ROJO, y `scoreboard` vuelve a serlo
 * en cuanto deje de valer `marcador.gal`.
 *
 * ⚠ EXIGE UNA ENMIENDA DE ADR-015 SOBRE SPEC-006 QUE CA-18.4 NO ORDENÓ y que
 * sólo `sdd-arquitecto` puede firmar. Anotado en el ledger (F-SPEC-018-1).
 */
const SCOREBOARD_BARE_DOMAIN = { key: 'scoreboard', value: 'marcador.gal' } as const;

function isTypeScript(file: SourceFile): boolean {
  return file.path.endsWith('.ts') || file.path.endsWith('.tsx');
}

async function siteSources(): Promise<SourceFile[]> {
  const files = [
    ...(await readSourceFiles(join(SRC, 'app'))),
    ...(await readSourceFiles(join(SRC, 'site'))),
  ];
  return files.filter((f) => isTypeScript(f) && !f.path.startsWith(NOT_A_ROUTE));
}

describe('CA-2 — el título es un dato de i18n, nunca una cadena escrita a mano', () => {
  test('1. el escaneo mira de verdad los cuatro módulos de ruta y el documento', async () => {
    const paths = (await siteSources()).map((f) => f.path);

    expect(paths).toContain('app/(gl)/proxecto/page.tsx');
    expect(paths).toContain('app/(es)/es/proxecto/page.tsx');
    expect(paths).toContain('app/(gl)/robot/page.tsx');
    expect(paths).toContain('app/(es)/es/robot/page.tsx');
    expect(paths).toContain('site/document.tsx');
  });

  test('2. ningún módulo de ruta declara un título como literal', async () => {
    const offenders = (await siteSources())
      .filter((file) => LITERAL_TITLE_VALUE.test(stripComments(file.text)))
      .map((file) => `${file.path}: título escrito a mano`);

    expect(offenders).toEqual([]);
  });

  test('3. cada título vive en el bundle de su lengua y en ningún otro punto de src/', async () => {
    // La forma es la del caso 2 de `crawler-page.test.ts` con `USER_AGENT`: no
    // basta con que la ruta lo tome de i18n hoy, tiene que ser imposible que
    // alguien lo transcriba mañana.
    const files = await readSourceFiles();

    const offenders = SITE_LOCALES.flatMap((locale) =>
      Object.entries(titlesBundle(locale))
        .filter(
          ([key, value]) =>
            !(key === SCOREBOARD_BARE_DOMAIN.key && value === SCOREBOARD_BARE_DOMAIN.value),
        )
        .map(([key, value]) => ({
          key: `${locale}.${key}`,
          where: files.filter((f) => f.text.includes(value)).map((f) => f.path),
        }))
        .filter(({ where }) => where.join('|') !== BUNDLE_OF[locale])
        .map(({ key, where }) => `${key}: ${where.join(', ') || 'en ningún sitio'}`),
    );

    expect(offenders).toEqual([]);

    // La colisión declarada es EXACTAMENTE ésa y no otra: si el título del
    // marcador cambia, este caso vuelve a morder sin tocar nada.
    for (const locale of SITE_LOCALES) {
      expect(titlesBundle(locale).scoreboard).toBe(SCOREBOARD_BARE_DOMAIN.value);
    }
  });
});

describe('CA-6 — ningún `<title>` en el cuerpo (F-SPEC-005-V4)', () => {
  test('4. no queda ningún elemento `<title>` en el JSX del sitio', async () => {
    const offenders = (await siteSources())
      .filter((file) => file.path.endsWith('.tsx'))
      .filter((file) => TITLE_ELEMENT.test(stripComments(file.text)))
      .map((file) => `${file.path}: <title> en JSX`);

    expect(offenders).toEqual([]);
  });
});
