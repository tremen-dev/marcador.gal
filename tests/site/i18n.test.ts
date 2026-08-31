/**
 * CA-4 (paridad de bundles), CA-7 (D-1: inspiración, no sucesión) y la
 * cláusula de longitud de CA-8.1.
 *
 * D-2 dice «nunca hardcodeados» y galego por defecto. La paridad se exige
 * sobre el espacio de nombres del SITIO: `qualifiers` sigue siendo de `gl.ts`
 * y de la spec que construya la interfaz del marcador, como declara su propia
 * cabecera.
 */
import { describe, expect, test } from 'vitest';
import { es } from '@/i18n/es';
import { gl } from '@/i18n/gl';
import { SITE_LOCALES, siteBundle } from '@/i18n/site';
import type { SiteBundle } from '@/i18n/site-bundle';
import { MAILBOX } from '@/site/contact';

/**
 * CA-8.2, F-SPEC-004-5. La página no puede afirmar una medición EN CURSO: la
 * ventana de observación no se ha corrido y una de las dos competiciones no es
 * capturable hoy (ADR-008 §1, RN-11). La carta a la RFGF dice «hoxe non o
 * fago»; si el sitio dice lo contrario, la desmiente su propio enlace, que es
 * el daño que EPIC-003 existe para evitar.
 *
 * CA-8.2 fija el CONTENIDO —las cuatro cifras y las dos competiciones—, no el
 * tiempo verbal, así que la redacción veraz lo cumple entero. Esta lista es la
 * barrera contra la recaída, con la misma forma que las de CA-6 y CA-7.
 */
const NOT_MEASURING_YET = [
  'esta a medir',
  'estase a medir',
  'estamos a medir',
  'esta medindo',
  'esta midiendo',
  'estamos midiendo',
  'competicions medidas',
  'competiciones medidas',
  'fontes medidas',
  'fuentes medidas',
];

/** CA-7: la lista negra atrapa el descuido; el verificador lee y atrapa la insinuación. */
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

function deaccent(text: string): string {
  return text.normalize('NFD').replaceAll(/\p{Diacritic}/gu, '').toLowerCase();
}

function values(bundle: SiteBundle): string[] {
  return Object.values(bundle);
}

/** Sentences, counted the way a reader counts them. */
function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

describe('CA-4 — paridad de bundles', () => {
  test('1. los dos bundles del sitio tienen exactamente las mismas claves', () => {
    expect(Object.keys(gl.site).sort()).toEqual(Object.keys(es.site).sort());
  });

  test('2. la paridad se comprueba en las dos direcciones, clave a clave', () => {
    const glKeys = new Set(Object.keys(gl.site));
    const esKeys = new Set(Object.keys(es.site));

    expect([...glKeys].filter((k) => !esKeys.has(k))).toEqual([]);
    expect([...esKeys].filter((k) => !glKeys.has(k))).toEqual([]);
  });

  test('3. ninguna clave está vacía en ninguna de las dos lenguas', () => {
    const empty = SITE_LOCALES.flatMap((locale) =>
      Object.entries(siteBundle(locale))
        .filter(([, value]) => value.trim() === '')
        .map(([key]) => `${locale}.${key}`),
    );

    expect(empty).toEqual([]);
  });

  test('4. `qualifiers` sigue siendo de gl.ts y no entra en la paridad del sitio', () => {
    expect(Object.keys(gl.qualifiers)).toEqual([
      'provisional',
      'confirmado',
      'pendente_de_confirmar',
      'sen_sinal',
    ]);
    expect(es).not.toHaveProperty('qualifiers');
  });
});

describe('CA-7 — D-1: inspiración, no sucesión', () => {
  test('5. ningún término de sucesión aparece en ninguno de los dos bundles', () => {
    const hits = SITE_LOCALES.flatMap((locale) => {
      const text = deaccent(values(siteBundle(locale)).join(' \n '));
      return NOT_A_SUCCESSION.filter((term) => text.includes(term)).map(
        (term) => `${locale}: ${term}`,
      );
    });

    expect(hits).toEqual([]);
  });

  test('6. «quen está detrás» nombra a tremen.dev y a Alberto Fojo, sin apoyarse en nada anterior', () => {
    for (const locale of SITE_LOCALES) {
      const about = siteBundle(locale).about;
      expect(about).toContain('tremen.dev');
      expect(about).toContain('Alberto Fojo');
    }
  });
});

describe('CA-8.1 — «quen está detrás»: tres o cuatro frases, y ni una más', () => {
  test('7. el bloque no pasa de cuatro oraciones en ninguna lengua', () => {
    const counted = SITE_LOCALES.map((locale) => ({
      locale,
      count: sentences(siteBundle(locale).about.replace('{mailbox}', MAILBOX)).length,
    }));

    // Ni menos de tres ni más de cuatro. El límite superior es el que importa:
    // es donde la épica avisa que se incumple D-1, contando la historia.
    expect(counted.filter(({ count }) => count < 3 || count > 4)).toEqual([]);
  });

  test('8. el buzón se interpola, no se escribe: el bundle lleva el hueco', () => {
    for (const locale of SITE_LOCALES) {
      expect(siteBundle(locale).about).toContain('{mailbox}');
      expect(siteBundle(locale).about).not.toContain(MAILBOX);
    }
  });
});

describe('CA-8.2 — lo que se mide, sin afirmar que ya se está midiendo', () => {
  test('9. ninguna clave del sitio afirma una medición en curso', () => {
    const hits = SITE_LOCALES.flatMap((locale) => {
      const text = deaccent(values(siteBundle(locale)).join(' \n '));
      return NOT_MEASURING_YET.filter((term) => text.includes(term)).map(
        (term) => `${locale}: ${term}`,
      );
    });

    expect(hits).toEqual([]);
  });

  test('10. dice por qué una de las dos competiciones no se puede leer hoy', () => {
    // Es la afirmación que sostiene la carta —«respectar o robots.txt é unha
    // norma do proxecto»— y la única razón por la que el sitio puede nombrar
    // las dos competiciones sin contradecirla.
    for (const locale of SITE_LOCALES) {
      expect(siteBundle(locale).measuring).toContain('robots.txt');
    }
  });
});
