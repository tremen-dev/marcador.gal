/**
 * SPEC-018 CA-14 — la voz de la pantalla: sin primera persona del singular, sin
 * promesa de directo, y sin vocabulario de sucesión.
 *
 * FICHERO NUEVO A PROPÓSITO, con el precedente exacto de
 * `tests/site/identity.test.ts` (SPEC-007): lo que esta spec AÑADE no cabe en
 * los casos de SPEC-004, que están cerrados, y ensancharlos «ya que estamos»
 * es justo lo que SPEC-018 CA-17.2 (i) prohíbe. El molde —lista cerrada con su
 * motivo, `deaccent`, recorrido de espacios de nombres, control positivo— es el
 * de allí.
 *
 * CIERRA F-SPEC-007-10, cuyo disparador escrito es literalmente esta spec.
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
 * LOS TRES ESPACIOS QUE LA BARRERA ALCANZA: `site`, `titles` y el del marcador.
 *
 * ALCANCE DECLARADO DENTRO DEL PROPIO MECANISMO (ADR-016 §6, CA-14.2): **la
 * barrera NO alcanza `bot`**, y no por descuido. El bot habla en 1.ª persona
 * del singular POR DICTAMEN DE `sdd-lingua` REGISTRADO EN SPEC-015 §1 —«Son o
 * bot de marcador.gal»— y meterlo aquí lo pondría en rojo siendo correcto. No
 * hay contradicción con ADR-012 §1: lo que ese ADR prohíbe es nombrar a una
 * persona física o declarar cuántas hay, y el bot habla en 1.ª persona
 * DECLARÁNDOSE MÁQUINA.
 *
 * `crawler` y `admin` tampoco entran: el primero porque su voz es el plural
 * institucional y ya lo vigila SPEC-005, el segundo porque no es texto público.
 */
const NAMESPACES: Record<SiteLocale, readonly Readonly<Record<string, string>>[]> = {
  gl: [gl.site, gl.titles, gl.board],
  es: [es.site, es.titles, es.board],
};

/**
 * LA LISTA CERRADA DE PRIMERA PERSONA DEL SINGULAR, con su motivo escrito
 * (ADR-016 §3.2). Sale del dictamen de `sdd-lingua` §5.1 y se compara POR
 * PALABRA COMPLETA sobre el texto desacentuado y en minúsculas.
 *
 * LO QUE EL MECANISMO NO ALCANZA, DECLARADO (ADR-016 §6, CA-14.2): quedan
 * FUERA de la lista las formas ambiguas `son` (gl., también 3.ª del plural —
 * «os datos son»), `vin`/`vi`, `mi` y `sei`/`sé` (gl., también sustantivo),
 * porque incluirlas produciría falsos positivos sobre texto correcto. Ahí la
 * barrera es REVISIÓN, NO TEST, y esta línea es la constancia.
 *
 * Y queda fuera UNA MÁS que el dictamen no previó: **`min`**, pronombre galego
 * de 1.ª persona tras preposición, que es también LA ABREVIATURA DE *minuto*
 * que el propio `sdd-lingua` §3.2 propone en cinco literales de esta misma
 * pantalla («Actualizado hai {n} min»). Incluirla pondría rojo texto correcto
 * escrito por el mismo dictamen, que es exactamente el criterio con el que él
 * deja fuera las otras cuatro. Anotado como salvedad en el ledger de SPEC-018.
 */
const FIRST_PERSON_SINGULAR = [
  // Pronombres y posesivos.
  'eu',
  'comigo',
  'conmigo',
  'meu',
  'mina',
  'meus',
  'minas',
  'yo',
  'mio',
  'mia',
  'mios',
  'mias',
  // Formas verbales galegas.
  'estou',
  'teno',
  'fago',
  'vou',
  'podo',
  'quero',
  'vexo',
  'digo',
  'creo',
  'penso',
  'escribo',
  'respondo',
  'recollo',
  'gardo',
  'mido',
  'atopo',
  'entendo',
  'entendin',
  'fun',
  'tiven',
  'puiden',
  'souben',
  // Formas verbales castellanas.
  'soy',
  'estoy',
  'tengo',
  'hago',
  'voy',
  'puedo',
  'quiero',
  'veo',
  'pienso',
  'recojo',
  'guardo',
  'encuentro',
  'entiendo',
  'entendi',
  'fui',
  'tuve',
  'pude',
  'supe',
] as const;

/** Las formas ambiguas que quedan fuera, con su motivo. Se afirma que no están. */
const DELIBERATELY_OUT = ['son', 'vin', 'vi', 'mi', 'sei', 'se', 'min'] as const;

/** Palabras completas del texto desacentuado. */
function words(text: string): readonly string[] {
  return deaccent(text).split(/[^a-z0-9]+/u).filter((word) => word.length > 0);
}

function everyValue(locale: SiteLocale): string {
  return NAMESPACES[locale].flatMap((namespace) => Object.values(namespace)).join(' \n ');
}

describe('CA-14.1 — la página no habla en primera persona del singular', () => {
  test('1. ningún valor de `site`, `titles` ni del marcador lleva una forma de la lista', () => {
    const hits = SITE_LOCALES.flatMap((locale) => {
      const found = new Set(words(everyValue(locale)));
      return FIRST_PERSON_SINGULAR.filter((form) => found.has(form)).map(
        (form) => `${locale}: ${form}`,
      );
    });

    expect(hits).toEqual([]);
  });

  test('2. CONTROL POSITIVO: una cadena con una de las formas pone el caso en ROJO', () => {
    const synthetic = 'Isto é o que eu vexo desde aquí, e non teño máis que dicir.';
    const found = new Set(words(synthetic));

    expect(FIRST_PERSON_SINGULAR.filter((form) => found.has(form)).sort()).toEqual([
      'eu',
      'teno',
      'vexo',
    ]);
  });

  test('3. la barrera no es vacua: recorre tres espacios y bastante texto', () => {
    for (const locale of SITE_LOCALES) {
      expect(NAMESPACES[locale]).toHaveLength(3);
      expect(everyValue(locale).length).toBeGreaterThan(1500);
    }
    expect(FIRST_PERSON_SINGULAR.length).toBeGreaterThan(30);
  });

  test('4. CA-14.2 — el alcance NO llega al bot, y el bot SÍ habla en primera persona', () => {
    // Si la barrera se ensanchase al repositorio, `BotBundle` se pondría rojo
    // siendo correcto. Esto lo deja medido en vez de dicho.
    const botWords = new Set(words(Object.values(gl.bot).join(' \n ')));
    const inBot = FIRST_PERSON_SINGULAR.filter((form) => botWords.has(form));

    expect(inBot.length).toBeGreaterThan(0);
    expect(NAMESPACES.gl).not.toContain(gl.bot);
  });

  test('5. y las formas ambiguas quedan declaradamente FUERA de la lista', () => {
    for (const ambiguous of DELIBERATELY_OUT) {
      expect(FIRST_PERSON_SINGULAR as readonly string[]).not.toContain(ambiguous);
    }
  });
});

describe('CA-14.3 — la pantalla no promete lo que el sistema no hace', () => {
  const NO_LIVE_PROMISE = [
    'directo',
    'en vivo',
    'tempo real',
    'tiempo real',
    'ao instante',
    'al instante',
    'inmediato',
  ] as const;

  test('6. ninguna clave del marcador promete directo ni tiempo real', () => {
    const hits = SITE_LOCALES.flatMap((locale) => {
      const text = deaccent(Object.values(NAMESPACES[locale][2]!).join(' \n '));
      return NO_LIVE_PROMISE.filter((term) => text.includes(term)).map(
        (term) => `${locale}: ${term}`,
      );
    });

    expect(hits).toEqual([]);
  });

  test('7. CONTROL POSITIVO: la lista muerde sobre una cadena que sí lo promete', () => {
    const synthetic = deaccent('O marcador en directo, en tempo real e ao instante.');

    expect(NO_LIVE_PROMISE.filter((term) => synthetic.includes(term)).sort()).toEqual([
      'ao instante',
      'directo',
      'tempo real',
    ]);
  });

  test('8. y `live` se dice de UNA sola manera: *En xogo* / *En juego*', () => {
    expect(gl.statuses.live).toBe('En xogo');
    expect(es.statuses.live).toBe('En juego');
  });
});

describe('CA-14.4 — la lista negra de sucesión de D-1 alcanza al espacio nuevo', () => {
  /**
   * LOS ONCE TÉRMINOS DE `tests/site/i18n.test.ts` caso 5, aplicados AQUÍ al
   * espacio del marcador. El caso de SPEC-004 NO se toca: se ensancha en un
   * fichero nuevo, con el precedente de `identity.test.ts`.
   *
   * Esta pantalla es la primera que se va a parecer de verdad a
   * marcadorgalego.gal, así que es la primera en la que un literal de sucesión
   * es tentador — y `volve` es la trampa concreta que `sdd-lingua` §3.3 avisó:
   * `admin` dice «Volve cargar o taboleiro» y copiarlo aquí sería rojo.
   */
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
  ] as const;

  test('9. ningún término de sucesión aparece en el bundle del marcador', () => {
    const hits = SITE_LOCALES.flatMap((locale) => {
      const text = deaccent(Object.values(NAMESPACES[locale][2]!).join(' \n '));
      return NOT_A_SUCCESSION.filter((term) => text.includes(term)).map(
        (term) => `${locale}: ${term}`,
      );
    });

    expect(hits).toEqual([]);
  });

  test('10. CONTROL POSITIVO: «Volve cargar a páxina» pondría el caso en ROJO', () => {
    const synthetic = deaccent('Volve cargar a páxina.');

    expect(NOT_A_SUCCESSION.filter((term) => synthetic.includes(term))).toEqual(['volve']);
    // Y lo que el bundle dice de verdad evita la trampa.
    expect(gl.board.reloadHint).toBe('Carga a páxina de novo.');
  });
});
