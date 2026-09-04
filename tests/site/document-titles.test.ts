/**
 * SPEC-006 CA-1 — cada ruta declara su propio título, y el del rastreador no es
 * el del proyecto.
 *
 * Es F-SPEC-005-1 escrito como aserción. El defecto no era cosmético: quien
 * recibe la carta abre `https://marcador.gal/robot` porque esa dirección viaja
 * dentro del user-agent, y la pestaña le decía «O proxecto — marcador.gal».
 *
 * Los cuatro módulos de ruta se importan UNO A UNO por su ruta literal, no
 * recorriendo un directorio: si mañana desaparece o se mueve uno, esto deja de
 * compilar, que es justo lo que tiene que pasar.
 *
 * Lo que este fichero NO puede comprobar, y por eso lo comprueba el verificador
 * sobre el servidor real: que el `<title>` salga dentro de `<head>` en el HTML
 * servido y que no quede ninguno después de `</head>` (CA-6).
 */
import type { Metadata } from 'next';
import { describe, expect, test } from 'vitest';
import { boardDocument } from '@/board/handler';
import { SCOREBOARD_PATH } from '@/site/routes';
import { metadata as esCrawler } from '@/app/(es)/es/robot/page';
import { metadata as esProject } from '@/app/(es)/es/proxecto/page';
import { metadata as glCrawler } from '@/app/(gl)/robot/page';
import { metadata as glProject } from '@/app/(gl)/proxecto/page';
import { titlesBundle } from '@/i18n/titles';

/**
 * El título declarado por una ruta, cuando es una cadena. Next admite otras
 * formas —`{ template, default }`, `{ absolute }`, `null`—; ninguna es lo que
 * esta spec declara, y si alguien la introduce el caso 1 la ve.
 */
function declaredTitle(metadata: Metadata): string | null {
  return typeof metadata.title === 'string' ? metadata.title : null;
}

/**
 * El título que el documento del marcador SIRVE DE VERDAD, leído del HTML.
 *
 * `/marcador` no es una `page.tsx` y no declara `metadata`: es un manejador de
 * ruta (ADR-027 §1), así que su título viaja en el marcado. Se lee del
 * documento servido en vez de importar la constante, que es lo mismo que este
 * fichero le exige a las otras cuatro rutas: que el título salga del bundle y
 * no de una transcripción.
 */
function servedTitle(locale: 'gl' | 'es'): string | null {
  const html = boardDocument(
    locale,
    { version: null, matchday_declared: false, matches: [] },
    '2026-09-06T17:00:00.000Z',
    '"x"',
  );
  const found = /<title>([^<]*)<\/title>/.exec(html);
  return found?.[1] ?? null;
}

/**
 * Cada ruta, el título que le toca y el que NO le toca. La segunda columna es
 * la que muerde: intercambiar la clave entre `/robot` y `/proxecto` pone rojo
 * el caso en vez de comparar un valor consigo mismo.
 *
 * CENSO ACTUALIZADO EL 2026-09-04 (SPEC-018 CA-13.6, disciplina de CA-17.2):
 * el sitio gana una página en cada lengua y esta lista ENUMERA LAS RUTAS DEL
 * SITIO. La regla que guarda —cada ruta sirve el título de su propia clave, y
 * no el de otra— no cambia ni una letra; lo que crece es su censo.
 */
const ROUTES = [
  {
    path: '/proxecto',
    declared: declaredTitle(glProject),
    own: titlesBundle('gl').project,
    foreign: titlesBundle('gl').crawler,
  },
  {
    path: '/robot',
    declared: declaredTitle(glCrawler),
    own: titlesBundle('gl').crawler,
    foreign: titlesBundle('gl').project,
  },
  {
    path: '/es/proxecto',
    declared: declaredTitle(esProject),
    own: titlesBundle('es').project,
    foreign: titlesBundle('es').crawler,
  },
  {
    path: '/es/robot',
    declared: declaredTitle(esCrawler),
    own: titlesBundle('es').crawler,
    foreign: titlesBundle('es').project,
  },
  {
    path: SCOREBOARD_PATH.gl,
    declared: servedTitle('gl'),
    own: titlesBundle('gl').scoreboard,
    foreign: titlesBundle('gl').project,
  },
  {
    path: SCOREBOARD_PATH.es,
    declared: servedTitle('es'),
    own: titlesBundle('es').scoreboard,
    foreign: titlesBundle('es').project,
  },
] as const;

describe('CA-1 — cada ruta sirve el título de su propia clave de i18n', () => {
  test('1. todas las rutas declaran un título, y ninguna lo deja sin declarar', () => {
    const missing = ROUTES.filter(
      (route) => route.declared === null || route.declared.trim().length === 0,
    ).map((route) => route.path);

    expect(missing).toEqual([]);
  });

  test('2. cada una declara la clave que le toca, y no la de la otra página', () => {
    const wrong = ROUTES.filter((route) => route.declared !== route.own).map(
      (route) => `${route.path}: declara «${route.declared ?? 'nada'}»`,
    );

    expect(wrong).toEqual([]);
  });

  test('3. y ninguna declara el título de la otra página de su misma lengua', () => {
    // F-SPEC-005-1 en una línea: `/robot` NO sirve el título de `/proxecto`, y
    // `/es/robot` NO sirve el de `/es/proxecto`.
    const inherited = ROUTES.filter((route) => route.declared === route.foreign).map(
      (route) => route.path,
    );

    expect(inherited).toEqual([]);
  });

  test('4. los títulos son distintos entre sí dos a dos, salvo el par de una misma página', () => {
    // El marcador sirve `marcador.gal` en LAS DOS LENGUAS —decisión del gate
    // del 2026-09-04, SPEC-018 CA-13.5—, así que las seis rutas producen CINCO
    // títulos distintos. Lo que este caso protege sigue en pie y se afirma
    // abajo, ruta a ruta: ninguna sirve el título de OTRA página.
    const declared = ROUTES.map((route) => route.declared ?? 'nada');

    expect(new Set(declared).size).toBe(ROUTES.length - 1);
    expect(titlesBundle('gl').scoreboard).toBe(titlesBundle('es').scoreboard);

    for (const route of ROUTES) {
      const others = ROUTES.filter(
        (candidate) => candidate.own !== route.own && candidate.path !== route.path,
      );
      expect(others.filter((candidate) => candidate.own === route.declared)).toEqual([]);
    }
  });

  test('5. el título de una ruta cambia si cambia su bundle: no está transcrito', () => {
    // La barrera de que NO esté escrito a mano vive en `title-source.test.ts`
    // (CA-2). Aquí se fija la otra mitad: los cuatro valores declarados son
    // exactamente los dos bundles de títulos, sin sobras ni faltas.
    const byText = (a: string, b: string): number => a.localeCompare(b);
    const declared = new Set(ROUTES.map((route) => route.declared ?? 'nada'));
    const bundled = new Set([
      ...Object.values(titlesBundle('gl')),
      ...Object.values(titlesBundle('es')),
    ]);

    expect([...declared].sort(byText)).toEqual([...bundled].sort(byText));
  });
});
