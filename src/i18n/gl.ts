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
 *
 * `crawler` is the namespace of `/robot` (SPEC-005). Separate from `site` on
 * purpose: the presence tests of the project page walk every key of the site
 * namespace, so text that belongs to another page cannot live there.
 *
 * `titles` is the namespace of the document titles (SPEC-006), one key per
 * page. Separate for the same reason taken to its extreme: a title is never
 * served in the body of any page, so no presence test over the HTML could find
 * it. It is a DATUM each route declares, not markup the document emits.
 */
import type { MatchQualifier } from '../model/qualifier';
import type { CrawlerBundle } from './crawler-bundle';
import type { SiteBundle } from './site-bundle';
import type { TitlesBundle } from './titles-bundle';

export const gl = {
  qualifiers: {
    provisional: 'Provisional',
    confirmado: 'Confirmado',
    pendente_de_confirmar: 'Pendente de confirmar',
    sen_sinal: 'Sen sinal',
  } satisfies Record<MatchQualifier, string>,

  titles: {
    project: 'O proxecto — marcador.gal',
    crawler: 'O rastrexador — marcador.gal',
  } satisfies TitlesBundle,

  site: {
    heading: 'marcador.gal',

    aboutHeading: 'Quen está detrás',
    about:
      'marcador.gal é un proxecto de tremen.dev. ' +
      'O enderezo de contacto é {mailbox}. ' +
      'Escribe aí para calquera cousa que teña que ver con este sitio ou co ' +
      'rastrexador, e respondemos.',
    umbrellaLink: 'tremen.dev — o paraugas deste proxecto',

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

  crawler: {
    heading: 'O rastrexador de marcador.gal',

    intro:
      'Esta páxina explica como marcador.gal le páxinas públicas de resultados de fútbol: ' +
      'con que nome se identifica, con que ritmo pide, que respecta e que fai co que le. ' +
      'Está aquí para que calquera que vexa ese nome no seu rexistro de acceso poida ' +
      'comprobalo sen ter que preguntar.',

    contact:
      'Se prefires que non leamos o teu sitio, escribe a {mailbox} e deixamos de facelo. ' +
      'Abonda con pedilo: non fai falta alegar nada nin dar explicacións.',

    userAgentHeading: 'Con que nome nos identificamos',
    userAgent: 'En cada petición vai esta cadea de identificación, e é exactamente esta:',
    userAgentNote:
      'O primeiro anaco, o que vai antes da barra, é o nome co que se nos pode nomear nun ' +
      'ficheiro robots.txt; é o único que miramos ao comprobar se un sitio nos deixa pasar.',

    rateHeading: 'Con que frecuencia',
    rate:
      'Como máximo unha petición por minuto a cada sitio e por cada competición. ' +
      'As peticións non gastadas non se acumulan: un minuto sen pedir non dá dereito a ' +
      'dúas no seguinte.',

    robotsHeading: 'O ficheiro robots.txt',
    robots:
      'Respectamos sempre o ficheiro robots.txt do sitio. Se unha regra que nos afecta ' +
      'prohibe unha ruta, non a pedimos, e non hai excepción: non a levanta identificarse ' +
      'doutro xeito, nin baixar aínda máis o ritmo, nin que a medición dure só unha hora. ' +
      'E se non temos cargada a política dun sitio, tampouco lle pedimos nada. ' +
      'Hai fontes que hoxe non lemos precisamente por iso.',

    noRepublishHeading: 'Que non facemos co que lemos',
    noRepublish:
      'Non republicamos os datos de ninguén. Isto é unha medición, e o resultado é un ' +
      'informe interno. Non hai marcador público, nin ficheiro de datos, nin nada que se ' +
      'poida consultar fóra do proxecto.',

    storageHeading: 'Que gardamos e canto tempo',
    storage:
      'Gardamos a resposta tal e como chega, antes de interpretala, para poder repetir a ' +
      'análise sen ter que pedir nada outra vez. Ese arquivo bórrase aos 30 días de ' +
      'rematar a xanela de observación. Pódese prorrogar unha soa vez, por escrito e ' +
      'motivada, e nunca máis alá dos 90 días.',

    stopHeading: 'Como pedir que pare',
    stop:
      'Escribe a {mailbox} e paramos. Abonda con pedilo. Tamén serve engadir unha regra no ' +
      'teu propio robots.txt: lémolo antes de cada xanela de observación e respectámolo.',

    otherLanguage: 'Castellano',
  } satisfies CrawlerBundle,
} as const;

export type GalegoBundle = typeof gl;
