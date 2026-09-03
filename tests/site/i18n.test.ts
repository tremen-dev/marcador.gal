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
import type { SiteBundle, SiteLocale } from '@/i18n/site-bundle';
import { MAILBOX } from '@/site/contact';

/**
 * CA-8.2, F-SPEC-004-5 y F-SPEC-004-8. La página no puede afirmar una medición
 * EN CURSO —la ventana de observación no se ha corrido— ni atribuir a UNA de
 * las dos competiciones lo que le pasa a una FUENTE. La carta a la RFGF dice
 * «hoxe non o fago» sobre las dos; si el sitio dice lo contrario, la desmiente
 * su propio enlace, que es el daño que EPIC-003 existe para evitar.
 *
 * Las dos últimas formas son la recaída concreta de F-SPEC-004-8: decir «unha
 * das dúas competicións non se pode ler» insinúa que la otra sí se está
 * leyendo, y de la fuente que la carta nombra. Es falso: el hallazgo
 * `docs/epicas/EPIC-001-spike-ingesta/hallazgos/fontes-capturables.md` mide 50
 * nombres de equipo en CADA una de las dos (líneas 34–35).
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
  'unha das duas competicions',
  'una de las dos competiciones',
  // AMPLIADO POR SPEC-007 CA-5. Al dejar de nombrar las competiciones, el
  // referente pasa a ser «las competiciones que se quieren medir», y la
  // recaída de F-SPEC-004-8 puede volver por una puerta nueva: restringir el
  // hecho a UN subconjunto. `ceroacero.es` sirve HOY las dos
  // (`hallazgos/fontes-capturables.md:34-35`, 50 nombres de equipo en cada
  // una); lo que no es capturable es la FUENTE OFICIAL de ambas
  // (`fontes-capturables.md:66`, `dominio.md:57`, ADR-008 §1). La barrera se
  // amplía, no se relaja.
  'dunha das competicions',
  'de una de las competiciones',
  'dunha competicion',
  'de una competicion',
];

/**
 * F-SPEC-004-8. El hecho verdadero, y el que sostiene la carta: lo que hoy no
 * se puede rastrear no es una competición, es la FUENTE OFICIAL de las dos
 * (`fontes-capturables.md:66` — «`futgal.es`, la oficial y de peso 1.0, no es
 * capturable: su `robots.txt` prohíbe el rastreo (ADR-008 §1)»).
 *
 * Se fijan los tramos que cargan el hecho, no la frase entera: la redacción
 * puede mejorarse, pero no puede dejar de decir «fuente oficial», el
 * referente completo y `robots.txt`. Sin ningún tercero nombrado, que es otra
 * exigencia del finding.
 *
 * MODULADO POR SPEC-007 CA-5. `das duas competicions` / `de las dos
 * competiciones` deja de ser exigible porque las competiciones ya no se
 * nombran (CA-4), y lo que se exige pasa a ser un referente que abarque TODO
 * el objeto del estudio, no un subconjunto. `a fonte oficial` y `robots.txt`
 * se conservan intactos: son el hecho, y costaron tres vueltas.
 */
const OFFICIAL_SOURCE_NOT_CRAWLED: Record<SiteLocale, readonly string[]> = {
  gl: ['a fonte oficial', 'das competicions que se queren medir', 'robots.txt'],
  es: ['la fuente oficial', 'de las competiciones que se quieren medir', 'robots.txt'],
};

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

  test('4. `qualifiers` no entra en la paridad del sitio, y desde SPEC-017 existe en las dos lenguas', () => {
    // ENMIENDA DEL 2026-09-03 (ADR-015, SPEC-017 CA-9.6). Hasta hoy este caso
    // afirmaba además `expect(es).not.toHaveProperty('qualifiers')`, porque
    // `qualifiers` vivía SOLO en `gl.ts` y su cabecera decía que el castellano
    // era «de la spec que construya el marcador». El gate de SPEC-017 decidió
    // el 2026-09-03 que los cuatro cualificadores SE TRADUCEN, y el disparador
    // era el que SPEC-015 dejó escrito: «el primer artefacto que enseñe un
    // cualificador a una persona en castellano», que es el panel del operador.
    //
    // Lo que este caso protege NO CAMBIA y por eso sigue aquí: `qualifiers` es
    // un espacio de nombres PROPIO y NO entra en la paridad del sitio (SPEC-004
    // CA-4), que es lo que se afirma abajo comprobando que no aparece entre las
    // claves de `site`. La enmienda está escrita en el ledger de SPEC-004.
    const CLAVES = ['provisional', 'confirmado', 'pendente_de_confirmar', 'sen_sinal'];

    expect(Object.keys(gl.qualifiers)).toEqual(CLAVES);
    expect(Object.keys(es.qualifiers)).toEqual(CLAVES);

    // La paridad del SITIO no las ve: siguen siendo otro espacio de nombres.
    expect(Object.keys(gl.site)).not.toContain('qualifiers');
    expect(Object.keys(es.site)).not.toContain('qualifiers');
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

  /**
   * MODULADO POR SPEC-007 CA-1 (ADR-012 §1, aprobado el 2026-09-01). Este caso
   * exigía además `Alberto Fojo`. Sigue exigiendo `tremen.dev` —el paraguas se
   * nombra, y sin él la página quedaría sin responsable— y pasa a exigir lo
   * contrario sobre la persona: que no salga. La lista negra de D-1 (caso 5)
   * NO se toca; lo que se modula es la comprobación de identidad que viajaba
   * de prestado dentro de CA-7 de SPEC-004.
   *
   * La barrera ancha —los tres espacios de nombres y el HTML de las cuatro
   * rutas— vive en `tests/site/identity.test.ts`; aquí queda solo lo que este
   * caso decía de `about`.
   */
  test('6. «quen está detrás» nombra a tremen.dev y a ninguna persona', () => {
    for (const locale of SITE_LOCALES) {
      const about = siteBundle(locale).about;
      expect(about).toContain('tremen.dev');
      expect(deaccent(about)).not.toContain('alberto');
      expect(deaccent(about)).not.toContain('fojo');
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

  test('10. dice que la fuente oficial de las DOS competiciones no se rastrea, y por qué', () => {
    // Es la afirmación que sostiene la carta —«necesito ler as páxinas
    // públicas de Terceira RFEF G1 e Preferente Futgal G1 … hoxe non o fago,
    // precisamente porque o seu robots.txt non mo permite e respectalo é unha
    // norma do proxecto» (docs/negocio/carta-rfgf-acceso.md:49-52)—: las dos,
    // no una. Así el sitio refuerza la carta en vez de desmentirla.
    const missing = SITE_LOCALES.flatMap((locale) => {
      const measuring = deaccent(siteBundle(locale).measuring);
      return OFFICIAL_SOURCE_NOT_CRAWLED[locale]
        .filter((fragment) => !measuring.includes(deaccent(fragment)))
        .map((fragment) => `${locale}: ${fragment}`);
    });

    expect(missing).toEqual([]);
  });
});
