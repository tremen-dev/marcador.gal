/**
 * SPEC-018 CA-17.3 — la permanencia de las URL del sitio, EN UN SOLO CASO.
 *
 * CIERRA F-SPEC-004-9 · F-SPEC-005-2, cuyo disparador escrito es «cualquier
 * trabajo que toque rutas del sitio» y cuya nota advierte que **«la barrera
 * correcta es una sola sobre las cuatro URL; escribirla a trozos es cómo llegó
 * a estar a medias»**. Por eso este fichero es NUEVO y por eso el caso es
 * ÚNICO: la afirmación se hace con LITERALES, no comparando la constante
 * consigo misma, que es lo que hacía que la barrera anterior no midiera nada.
 *
 * Y DECLARA LA ASIMETRÍA DENTRO DEL PROPIO CASO, porque las cinco direcciones
 * no llevan la misma promesa.
 */
import { describe, expect, test } from 'vitest';
import { CRAWLER_PATH, PROJECT_PATH, SCOREBOARD_PATH, SITE_ORIGIN } from '@/site/routes';
import { SITE_REDIRECTS } from '@/site/redirects';

/**
 * GRUPO 1 — LAS CUATRO QUE NO SE MUEVEN NUNCA (ADR-010 §5).
 *
 * `/robot` es la más dura de las dos: **viaja dentro del `User-Agent` de cada
 * petición que este proyecto hace** (ADR-011), y terceros la copian en sus
 * registros y en su `robots.txt`. Romperla no es un 404: es una identidad que
 * se evapora. `/proxecto` es su hermana porque es a donde apunta la carta a la
 * RFGF y a donde redirige `/`.
 */
const PERMANENT: readonly (readonly [string, string])[] = [
  ['PROJECT_PATH.gl', '/proxecto'],
  ['PROJECT_PATH.es', '/es/proxecto'],
  ['CRAWLER_PATH.gl', '/robot'],
  ['CRAWLER_PATH.es', '/es/robot'],
];

/**
 * GRUPO 2 — LA DEL MARCADOR, QUE **NO** LLEVA ESA PROMESA (ADR-027 §1).
 *
 * Puede moverse algún día, y **no lleva disparador escrito a propósito**: el
 * gate del 2026-09-04 descartó tanto tomar la raíz ahora como dejar puesto un
 * disparador para hacerlo. Moverla exige **una decisión nueva**, no una
 * condición cumplida. La afirmación de aquí es de VALOR, no de permanencia:
 * hoy vale esto, y si cambia hay que verlo en un diff.
 */
const TODAY: readonly (readonly [string, string])[] = [
  ['SCOREBOARD_PATH.gl', '/marcador'],
  ['SCOREBOARD_PATH.es', '/es/marcador'],
];

const VALUES: Readonly<Record<string, string>> = {
  'PROJECT_PATH.gl': PROJECT_PATH.gl,
  'PROJECT_PATH.es': PROJECT_PATH.es,
  'CRAWLER_PATH.gl': CRAWLER_PATH.gl,
  'CRAWLER_PATH.es': CRAWLER_PATH.es,
  'SCOREBOARD_PATH.gl': SCOREBOARD_PATH.gl,
  'SCOREBOARD_PATH.es': SCOREBOARD_PATH.es,
};

describe('CA-17.3 — las direcciones del sitio, afirmadas con literales y en dos grupos', () => {
  test('1. las seis valen exactamente lo que valen, y `/` sigue redirigiendo a `/proxecto`', () => {
    // GRUPO 1: las cuatro que no se mueven nunca. Se afirman con la cadena
    // escrita aquí a mano, NO con la constante comparada consigo misma — que
    // es exactamente el defecto que F-SPEC-004-9 · F-SPEC-005-2 describe.
    for (const [name, literal] of PERMANENT) {
      expect(VALUES[name], `${name} se movió, y NO puede moverse (ADR-010 §5)`).toBe(literal);
    }

    // GRUPO 2: la del marcador. Mismo mecanismo, OTRA promesa: aquí el caso
    // dice «hoy vale esto», no «esto no se mueve nunca».
    for (const [name, literal] of TODAY) {
      expect(VALUES[name], `${name} cambió de valor`).toBe(literal);
    }

    // Y el origen canónico, que es el nombre que viaja en la carta.
    expect(SITE_ORIGIN).toBe('https://marcador.gal');

    // `/` SIGUE REDIRIGIENDO A `/proxecto`. El gate del 2026-09-04 descartó
    // EXPRESAMENTE tomar la raíz para el marcador, y ADR-010 §5 queda intacto.
    const root = SITE_REDIRECTS.find(
      (redirect) => redirect.source === '/' && redirect.has === undefined,
    );
    expect(root).toBeDefined();
    expect(root!.destination).toBe(PROJECT_PATH.gl);
    expect(root!.permanent).toBe(true);

    // Y la del marcador NO está entre las redirecciones: no se toma la raíz.
    expect(
      SITE_REDIRECTS.filter((redirect) => redirect.destination === SCOREBOARD_PATH.gl),
    ).toEqual([]);

    // La barrera no es vacua: las seis direcciones son distintas dos a dos.
    expect(new Set(Object.values(VALUES)).size).toBe(6);
  });
});
