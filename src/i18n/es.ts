/**
 * Castellano literals. Castellano is the option, not the default (D-2), and it
 * lives under its own URL prefix `/es` rather than in client state.
 *
 * This bundle carries the site namespace (SPEC-004), the crawler namespace of
 * `/es/robot` (SPEC-005) and the document titles of the two castellano routes
 * (SPEC-006). `qualifiers` stays in `gl.ts` and belongs to the spec that builds
 * the scoreboard interface; pulling it in here would make SPEC-004 answer for
 * translations it has no page to show.
 */
import type { CrawlerBundle } from './crawler-bundle';
import type { SiteBundle } from './site-bundle';
import type { TitlesBundle } from './titles-bundle';

export const es = {
  titles: {
    project: 'El proyecto — marcador.gal',
    crawler: 'El rastreador — marcador.gal',
  } satisfies TitlesBundle,

  site: {
    heading: 'marcador.gal',

    aboutHeading: 'Quién está detrás',
    about:
      'marcador.gal es un proyecto de tremen.dev. ' +
      'La dirección de contacto es {mailbox}. ' +
      'Escribe ahí para cualquier cosa que tenga que ver con este sitio o con el ' +
      'rastreador, y respondemos.',
    umbrellaLink: 'tremen.dev — el paraguas de este proyecto',

    measuringHeading: 'Qué se va a medir',
    measuring:
      'El objeto del estudio son las opciones de obtener los resultados del fútbol ' +
      'gallego: qué vías hay para leerlos y cuánto trabajo llevan. ' +
      'La medición todavía no ha empezado y no hay ninguna cifra. ' +
      'La fuente oficial de las competiciones que se quieren medir no se rastrea, ' +
      'porque su fichero robots.txt no lo permite y respetarlo es una norma del ' +
      'proyecto: esa es una de las razones por las que el estudio está parado.',

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

  crawler: {
    heading: 'El rastreador de marcador.gal',

    intro:
      'Esta página explica cómo marcador.gal lee páginas públicas de resultados de fútbol: ' +
      'con qué nombre se identifica, con qué ritmo pide, qué respeta y qué hace con lo que ' +
      'lee. Está aquí para que cualquiera que vea ese nombre en su registro de acceso pueda ' +
      'comprobarlo sin tener que preguntar.',

    contact:
      'Si prefieres que no leamos tu sitio, escribe a {mailbox} y dejamos de hacerlo. ' +
      'Basta con pedirlo: no hace falta alegar nada ni dar explicaciones.',

    userAgentHeading: 'Con qué nombre nos identificamos',
    userAgent: 'En cada petición va esta cadena de identificación, y es exactamente esta:',
    userAgentNote:
      'El primer trozo, el que va antes de la barra, es el nombre con el que se nos puede ' +
      'nombrar en un fichero robots.txt; es lo único que miramos al comprobar si un sitio ' +
      'nos deja pasar.',

    rateHeading: 'Con qué frecuencia',
    rate:
      'Como máximo una petición por minuto a cada sitio y por cada competición. ' +
      'Las peticiones no gastadas no se acumulan: un minuto sin pedir no da derecho a dos ' +
      'en el siguiente.',

    robotsHeading: 'El fichero robots.txt',
    robots:
      'Respetamos siempre el fichero robots.txt del sitio. Si una regla que nos afecta ' +
      'prohíbe una ruta, no la pedimos, y no hay excepción: no la levanta identificarse de ' +
      'otra manera, ni bajar todavía más el ritmo, ni que la medición dure solo una hora. ' +
      'Y si no tenemos cargada la política de un sitio, tampoco le pedimos nada. ' +
      'Hay fuentes que hoy no leemos precisamente por eso.',

    noRepublishHeading: 'Qué no hacemos con lo que leemos',
    noRepublish:
      'No republicamos los datos de nadie. Esto es una medición, y el resultado es un ' +
      'informe interno. No hay marcador público, ni fichero de datos, ni nada que se pueda ' +
      'consultar fuera del proyecto.',

    storageHeading: 'Qué guardamos y cuánto tiempo',
    storage:
      'Guardamos la respuesta tal y como llega, antes de interpretarla, para poder repetir ' +
      'el análisis sin tener que pedir nada otra vez. Ese archivo se borra a los 30 días de ' +
      'terminar la ventana de observación. Se puede prorrogar una sola vez, por escrito y ' +
      'motivada, y nunca más allá de los 90 días.',

    stopHeading: 'Cómo pedir que pare',
    stop:
      'Escribe a {mailbox} y paramos. Basta con pedirlo. También sirve añadir una regla en ' +
      'tu propio robots.txt: lo leemos antes de cada ventana de observación y lo respetamos.',

    otherLanguage: 'Galego',
  } satisfies CrawlerBundle,
} as const;
