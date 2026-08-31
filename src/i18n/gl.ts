/**
 * Galego literals. Galego is the default language (D-2); every user-visible
 * string lives in an i18n bundle from day one and is never hardcoded.
 *
 * The KEYS of `qualifiers` are the domain terms of dominio.md and must stay in
 * step with `MATCH_QUALIFIERS` (SPEC-001 CA-8). The VALUES are what the
 * interface shows.
 *
 * `qualifiers` belongs to SPEC-001 and to the spec that builds the scoreboard
 * interface; it is NOT part of the site namespace and does not take part in
 * its bundle parity (SPEC-004 CA-4).
 *
 * `site` is the namespace of the public project site (SPEC-004). Its shape is
 * `SiteBundle`, shared with `es.ts`, so a missing key is a typecheck failure.
 */
import type { MatchQualifier } from '../model/qualifier';
import type { SiteBundle } from './site-bundle';

export const gl = {
  qualifiers: {
    provisional: 'Provisional',
    confirmado: 'Confirmado',
    pendente_de_confirmar: 'Pendente de confirmar',
    sen_sinal: 'Sen sinal',
  } satisfies Record<MatchQualifier, string>,

  site: {
    documentTitle: 'O proxecto — marcador.gal',
    heading: 'marcador.gal',

    aboutHeading: 'Quen está detrás',
    about:
      'marcador.gal é un proxecto de tremen.dev, levado por Alberto Fojo. ' +
      'Non hai empresa nin equipo detrás: unha soa persoa traballando por conta propia. ' +
      'O enderezo de contacto é {mailbox}.',

    measuringHeading: 'Que se vai medir',
    measuring:
      'O proxecto está preparado para medir catro cousas sobre as fontes públicas de ' +
      'resultados: a latencia con que aparece cada marcador, a cobertura dos partidos, ' +
      'os conflitos entre fontes e os minutos de operación manual que fan falta. ' +
      'As competicións do estudo son Terceira RFEF G1 e Preferente Futgal G1. ' +
      'A medición aínda non comezou e non hai ningunha cifra. ' +
      'A fonte oficial das dúas competicións non se rastrexa, porque o seu ficheiro ' +
      'robots.txt non o permite e respectalo é unha norma do proxecto: esa é unha das ' +
      'razóns polas que o estudo está parado.',

    purposeHeading: 'Para que',
    purpose:
      'A medición serve para decidir unha soa cousa: se o proxecto é viable. ' +
      'O resultado é un informe interno, non un produto.',

    noProductHeading: 'Aínda non hai produto',
    noProduct:
      'Hoxe non hai nada que usar: nin marcador público, nin aplicación, nin conta que ' +
      'crear. Esta páxina existe para dicir quen está detrás e que se vai medir, ' +
      'e nada máis.',

    crawlerHeading: 'O rastrexador',
    crawlerLink: 'Como se len as páxinas públicas, e como pedir que pare',

    otherLanguage: 'Castellano',
  } satisfies SiteBundle,
} as const;

export type GalegoBundle = typeof gl;
