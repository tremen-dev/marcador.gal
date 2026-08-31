/**
 * Castellano literals. Castellano is the option, not the default (D-2), and it
 * lives under its own URL prefix `/es` rather than in client state.
 *
 * This bundle carries ONLY the site namespace. `qualifiers` stays in `gl.ts`
 * and belongs to the spec that builds the scoreboard interface; pulling it in
 * here would make SPEC-004 answer for translations it has no page to show.
 */
import type { SiteBundle } from './site-bundle';

export const es = {
  site: {
    documentTitle: 'El proyecto — marcador.gal',
    heading: 'marcador.gal',

    aboutHeading: 'Quién está detrás',
    about:
      'marcador.gal es un proyecto de tremen.dev, llevado por Alberto Fojo. ' +
      'No hay empresa ni equipo detrás: una sola persona trabajando por cuenta propia. ' +
      'La dirección de contacto es {mailbox}.',

    measuringHeading: 'Qué se va a medir',
    measuring:
      'El proyecto está preparado para medir cuatro cosas sobre las fuentes públicas de ' +
      'resultados: la latencia con la que aparece cada marcador, la cobertura de los ' +
      'partidos, los conflictos entre fuentes y los minutos de operación manual que hacen ' +
      'falta. Las competiciones del estudio son Terceira RFEF G1 y Preferente Futgal G1. ' +
      'La medición todavía no ha empezado y no hay ninguna cifra. ' +
      'La fuente oficial de las dos competiciones no se rastrea, porque su fichero ' +
      'robots.txt no lo permite y respetarlo es una norma del proyecto: esa es una de las ' +
      'razones por las que el estudio está parado.',

    purposeHeading: 'Para qué',
    purpose:
      'La medición sirve para decidir una sola cosa: si el proyecto es viable. ' +
      'El resultado es un informe interno, no un producto.',

    noProductHeading: 'Todavía no hay producto',
    noProduct:
      'Hoy no hay nada que usar: ni marcador público, ni aplicación, ni cuenta que ' +
      'crear. Esta página existe para decir quién está detrás y qué se va a medir, ' +
      'y nada más.',

    crawlerHeading: 'El rastreador',
    crawlerLink: 'Cómo se leen las páginas públicas, y cómo pedir que pare',

    otherLanguage: 'Galego',
  } satisfies SiteBundle,
} as const;
