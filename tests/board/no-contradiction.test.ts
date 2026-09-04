/**
 * SPEC-018 CA-18.5 — la barrera que impide que la contradicción vuelva.
 *
 * FICHERO NUEVO Y PROPIO, con el precedente de `tests/site/identity.test.ts`:
 * lo que esta spec AÑADE no cabe en los casos de SPEC-004 ni de SPEC-005, y la
 * corrección de aquéllos ya se hizo donde tocaba (CA-18.1 y CA-18.2, con sus
 * dos enmiendas de ledger).
 *
 * QUÉ IMPIDE, EXACTAMENTE: que una spec futura restaure por copiar-pegar la
 * frase que el 2026-09-04 dejó de ser cierta. No es una precaución teórica —el
 * bundle del bot ya se contradecía con `noRepublish` desde el 2026-09-03 y
 * nadie lo vio, porque el marcador no existía (CA-18.7)—.
 */
import { describe, expect, test } from 'vitest';
import { es } from '@/i18n/es';
import { gl } from '@/i18n/gl';
import { SITE_LOCALES } from '@/i18n/site';
import type { SiteLocale } from '@/i18n/site-bundle';

function deaccent(value: string): string {
  return value
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * LAS CUATRO FRASES QUE YA NO PUEDEN VOLVER, desacentuadas y en minúsculas.
 *
 * Las tres primeras son las que `crawler.noRepublish` y `site.noProduct`
 * decían y dejaron de ser ciertas al publicarse el marcador; la cuarta es la
 * cola de la primera, que es la que sobrevive más fácilmente a un recorte.
 */
const RETIRED_CLAIMS = [
  'marcador publico',
  'non republicamos',
  'no republicamos',
  'nada que se poida consultar fora do proxecto',
  'nada que se pueda consultar fuera del proyecto',
] as const;

/** Los dos espacios públicos donde vivían. `bot` y `admin` no son de aquí. */
const PUBLIC_NAMESPACES: Record<SiteLocale, readonly Readonly<Record<string, string>>[]> = {
  gl: [gl.site, gl.crawler],
  es: [es.site, es.crawler],
};

function everyValue(locale: SiteLocale): string {
  return PUBLIC_NAMESPACES[locale]
    .flatMap((namespace) => Object.values(namespace))
    .join(' \n ');
}

describe('CA-18.5 — la contradicción no puede volver', () => {
  test('1. ninguna clave de `site` ni de `crawler` contiene ya ninguna de las frases retiradas', () => {
    const hits = SITE_LOCALES.flatMap((locale) => {
      const text = deaccent(everyValue(locale));
      return RETIRED_CLAIMS.filter((claim) => text.includes(claim)).map(
        (claim) => `${locale}: «${claim}»`,
      );
    });

    expect(hits).toEqual([]);
  });

  test('2. CONTROL POSITIVO: reponer una de esas cadenas pone el caso en ROJO', () => {
    const restored = deaccent(
      'Non republicamos os datos de ninguén. Non hai marcador público, nin ficheiro de datos.',
    );

    expect(RETIRED_CLAIMS.filter((claim) => restored.includes(claim)).sort()).toEqual([
      'marcador publico',
      'non republicamos',
    ]);
  });

  test('3. y la versión ESTRECHADA tampoco vale: la frase se va, no se matiza', () => {
    // «Non republicamos… salvo unha pantalla de medición» pasaría el caso 12
    // viejo de `crawler-page.test.ts` y sería exactamente lo que un tercero
    // enseñaría. ADR-027 §3.c lo prohíbe y este control lo demuestra: la
    // barrera muerde sobre la frase, no sobre su ausencia de matiz.
    const narrowed = deaccent(
      'Non republicamos os datos de ninguén, salvo unha pantalla de medición.',
    );

    expect(RETIRED_CLAIMS.filter((claim) => narrowed.includes(claim))).toEqual([
      'non republicamos',
    ]);
  });

  test('4. la barrera no es vacua: mira los dos espacios y bastante texto', () => {
    for (const locale of SITE_LOCALES) {
      expect(PUBLIC_NAMESPACES[locale]).toHaveLength(2);
      expect(everyValue(locale).length).toBeGreaterThan(2000);
    }
  });

  test('5. y lo que SÍ dicen ahora es lo que la enmienda ordena', () => {
    for (const locale of SITE_LOCALES) {
      const noProduct = deaccent(
        locale === 'gl' ? gl.site.noProduct : es.site.noProduct,
      );
      const noRepublish = deaccent(
        locale === 'gl' ? gl.crawler.noRepublish : es.crawler.noRepublish,
      );

      // La mitad que NO podía cambiar, porque es lo que mantiene el art. 10
      // LSSI fuera: no hay aplicación ni cuenta que crear (CA-2.7, CA-18.1).
      expect(noProduct).toMatch(/nin aplicacion|ni aplicacion/);
      expect(noProduct).toMatch(/conta que crear|cuenta que crear/);
      // Y la pantalla se declara, con su acotación.
      expect(noProduct).toMatch(/pantalla publica/);
      expect(noProduct).toMatch(/xornadas declaradas|jornadas declaradas/);

      // La promesa reconstruida de `/robot`.
      expect(noRepublish).toMatch(/redistribucion en bloque/);
      expect(noRepublish).toMatch(/non hai historico|no hay historico/);
    }
  });

  test('6. CA-18.7 — el bot ya decía «sae no marcador»: la contradicción es anterior a esta spec', () => {
    // No se corrige nada del bot aquí —no hace falta: ahora es cierto— y se
    // deja medido para que la enmienda de SPEC-005 no sea una afirmación
    // suelta.
    expect(deaccent(gl.bot.ackNotPublication)).toContain('sae no marcador');
    expect(deaccent(gl.bot.noticeLegalBasis)).toContain('un marcador publicado');
  });
});
