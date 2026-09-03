/**
 * Castellano literals. Castellano is the option, not the default (D-2), and it
 * lives under its own URL prefix `/es` rather than in client state.
 *
 * This bundle carries the site namespace (SPEC-004), the crawler namespace of
 * `/es/robot` (SPEC-005), the document titles of the two castellano routes
 * (SPEC-006), the bot namespace (SPEC-015) and, since 2026-09-03, the panel
 * namespace and the four QUALIFIERS (SPEC-017).
 *
 * Until that date this header said that `qualifiers` stayed in `gl.ts` and
 * belonged «to the spec that builds the scoreboard interface», because pulling
 * it in would have made SPEC-004 answer for translations it had no page to
 * show. THAT PAGE NOW EXISTS: the operator's panel is the first artefact of
 * the real system that shows a person a qualifier, which is the trigger
 * SPEC-015 wrote down (SPEC-017 CA-9.6). The literals come from
 * `docs/fundacion/dominio.md`, where the gate of 2026-09-03 wrote them.
 */
import type { MatchQualifier } from '../model/qualifier';
import type { AdminBundle } from './admin-bundle';
import type { BotBundle } from './bot-bundle';
import type { CrawlerBundle } from './crawler-bundle';
import type { SiteBundle } from './site-bundle';
import type { StatusesBundle } from './statuses-bundle';
import type { TitlesBundle } from './titles-bundle';

export const es = {

  statuses: {
    scheduled: 'Programado',
    live: 'En juego',
    finished: 'Finalizado',
    postponed: 'Aplazado',
    suspended: 'Suspendido',
  } satisfies StatusesBundle,

  bot: {
    botDescription:
      'Recojo los resultados del fútbol gallego que mandan los corresponsales desde el campo.',
    botAbout: 'El bot de marcador.gal para corresponsales.',

    cmdStart: 'Empezar',
    cmdHelp: 'Cómo se escribe un resultado',
    cmdMatches: 'Los partidos abiertos ahora',
    cmdCancel: 'Descartar lo que está pendiente',
    cmdLanguage: 'Galego o castellano',
    cmdPrivacy: 'Qué se hace con tus datos',
    cmdOptOut: 'Dejar de enviar resultados',
    cmdStop: 'Dejar de recibir avisos',

    startWho: 'Soy el bot de marcador.gal. Recojo los resultados que mandas desde el campo.',
    startWhat: 'Escríbeme cuando cambie algo: quién juega, cómo va y el minuto. Nada más.',
    startNotPublished:
      'Lo que mandas no sale publicado tal cual: se compara con el resto de fuentes antes de llegar al marcador.',
    startHelpHint: 'Escribe /axuda para ver ejemplos.',

    noticeController:
      'Este bot es de marcador.gal, un proyecto de tremen.dev. Para cualquier cosa que tenga que ver con tus datos, escribe a {mailbox}.',
    noticeWhat:
      'Guardo el texto que escribes, la fecha del mensaje y un identificador interno tuyo. No guardo tu nombre, ni tu alias de Telegram, ni tu número.',
    noticePurpose:
      'Me sirve para llevar los resultados al marcador y para poder revisar después de dónde salió cada dato.',
    noticeLegalBasis:
      'La base no es el consentimiento: es que el bot no funciona si no sabe quién envía, y el interés legítimo de poder auditar un marcador publicado.',
    noticeAiProvider:
      'El texto que escribes se manda a un proveedor de inteligencia artificial para interpretarlo. El plazo que ese proveedor guarda no lo decidimos nosotros.',
    noticeRetention:
      'El archivo se borra a los 30 días de terminar la jornada. Se puede prorrogar una sola vez, por escrito y motivada, y nunca más allá de los 90 días.',
    noticeRights:
      'Puedes pedir acceso, rectificación, supresión u oposición. Escribe /baixa para dejar de enviar, o a {mailbox} para el resto.',
    noticeDoNotSend:
      'No hace falta que mandes nombres de jugadores, de árbitros ni nada sobre la salud de nadie. Basta con quién juega, cómo va y el minuto.',
    noticeLink: 'Tienes la información completa en https://marcador.gal/es/privacidade.',

    helpIntro: 'Escribe como hablas. Entiendo cosas como estas:',
    helpExamples:
      '2-1 en el minuto 70, Ourense - Celta B\nya ha terminado, 3-1\nsuspendido por la niebla',
    helpOrder: 'Primero el equipo de casa. «Ourense - Celta B» es 2 del Ourense y 1 del Celta B.',
    helpIfWrong: 'Si no doy con el partido, añade los nombres de los equipos.',
    helpCommands:
      '/partidos — los partidos abiertos ahora\n/cancelar — descartar lo que está pendiente\n/lingua — galego o castellano',

    parsing: 'Lo estoy leyendo…',

    cardHeading: 'Esto es lo que he entendido:',
    cardScoreLabel: 'Marcador',
    cardMinuteLabel: 'Minuto',
    cardStatusLabel: 'Estado',
    cardConfirm: 'Confirmar',
    cardDiscard: 'Descartar',
    cardHint: 'Si algo no cuadra, descarta y escríbelo otra vez.',
    cardExpired: 'Ha pasado demasiado tiempo. Escríbelo otra vez, por si ha cambiado algo.',

    ackRegistered: 'Registrado: {home} {homeScore} - {awayScore} {away}.',
    ackNotPublication:
      'Todavía no está publicado. Se compara con el resto de fuentes y, si procede, sale en el marcador.',
    ackDiscarded: 'Descartado. No se ha registrado nada.',

    languagePrompt: '¿En qué lengua quieres que te hable?',
    languageGalego: 'Galego',
    languageCastelan: 'Castellano',
    languageChanged: 'Hecho. Sigo en castellano.',

    openMatchesHeading: 'Partidos abiertos ahora:',

    optOutDone:
      'No acepto más mensajes tuyos. Lo que ya quedó registrado no se borra. Para borrar lo que te identifica, escribe a {mailbox}: lo hace una persona y te contesta por escrito.',

    errNotAuthorised: 'No te reconozco. Este bot solo atiende a corresponsales dados de alta.',
    errNotUnderstood:
      'No he entendido el mensaje. Prueba así: «2-1 en el minuto 70, Ourense - Celta B».',
    errMatchNotFound: 'No encuentro ese partido. Comprueba los nombres de los equipos o mira /partidos.',
    errAmbiguous: 'Hay más de un partido que cuadra. Elige cuál:',
    errServiceDown: 'No puedo guardarlo ahora mismo. Vuelve a probar en un minuto.',
    errNoOpenMatch: 'Ahora mismo no hay ningún partido abierto.',
    errNothingPending: 'No tienes nada pendiente de confirmar.',
  } satisfies BotBundle,

  /**
   * Los cuatro cualificadores en castellano. SE AÑADEN EL 2026-09-03 (SPEC-017
   * CA-9.6), y el disparador es el que SPEC-015 dejó escrito: «el primer
   * artefacto que enseñe un cualificador a una persona en castellano» es el
   * panel del operador, que enseña uno por partido.
   *
   * LOS LITERALES SE COPIAN DE `docs/fundacion/dominio.md`, donde el gate los
   * escribió el mismo día, y no se inventan aquí. Dos de los cuatro son
   * IDÉNTICOS a la forma galega —*Provisional* y *Confirmado*— y eso es
   * correcto, no algo que arreglar. El IDENTIFICADOR no se traduce: las claves
   * siguen siendo las de `MATCH_QUALIFIERS` (SPEC-001 CA-8), en galego.
   */
  qualifiers: {
    provisional: 'Provisional',
    confirmado: 'Confirmado',
    pendente_de_confirmar: 'Pendiente de confirmar',
    sen_sinal: 'Sin señal',
  } satisfies Record<MatchQualifier, string>,

  admin: {
    title: 'Panel del operador — marcador.gal',

    accessHeading: 'Entrar en el panel',
    accessOperator: 'Operador',
    accessSecret: 'Clave',
    accessSubmit: 'Entrar',
    accessRefused: 'No entras con esos datos.',

    boardHeading: 'Partidos de las jornadas declaradas',
    boardEmpty: 'No hay ninguna jornada de medición declarada, así que no hay nada que operar.',
    boardMatch: 'Partido',
    boardStatus: 'Estado',
    boardScore: 'Marcador',
    boardQualifier: 'Cualificador',
    boardLastSeen: 'Última observación',
    boardOpenAlerts: 'Alertas abiertas',
    boardNever: 'Nunca',
    boardNoDecision: 'Sin decisión publicada',
    boardDetail: 'Ver el detalle',

    detailHeading: 'Detalle del partido',
    detailObservations: 'Observaciones por fuente',
    detailDecisions: 'Registro de decisiones',
    detailSource: 'Fuente',
    detailConfidence: 'Peso',
    detailObservedAt: 'Observado a las',
    detailVersion: 'Versión',
    detailRule: 'Regla',
    detailSupport: 'Apoyos',
    detailBack: 'Volver al tablero',

    formCorrection: 'Corregir el marcador',
    formStatusChange: 'Cambiar el estado',
    formRatify: 'Ratificar lo vigente',
    formStatus: 'Estado',
    formHomeScore: 'Goles de casa',
    formAwayScore: 'Goles de fuera',
    formReason: 'Motivo',
    formReasonHint: 'Escribe por qué haces esto. Sin motivo no se publica nada.',
    formSubmit: 'Publicar',
    formCancel: 'Cancelar',

    trayHeading: 'Bandeja de alertas',
    trayOpen: 'Abiertas',
    trayAcknowledged: 'Reconocidas',
    trayEmpty: 'No hay ninguna alerta.',
    trayAcknowledge: 'Reconocer',
    trayReason: 'Motivo de la alerta',
    trayRaisedAt: 'Levantada a las',
    trayNotPublished: 'Reconocer una alerta no publica nada.',

    ackPublished: 'Queda publicado: {home} {homeScore}-{awayScore} {away}, {qualifier}.',
    ackAcknowledged: 'Alerta reconocida. No se ha publicado nada.',
    errEmptyReason: 'Falta el motivo. No se ha archivado nada y no se ha publicado nada.',
    errOutOfMatchday: 'Ese partido no está en ninguna jornada declarada.',
    errUnknownAlert: 'Esa alerta no existe o no es de un partido de las jornadas declaradas.',
    errNothingToRatify: 'Todavía no hay nada publicado que ratificar.',
    errTicketMalformed: 'El formulario ha llegado sin vale. Vuelve a cargar el tablero.',
    errTicketTampered: 'El vale no cuadra con su firma. Vuelve a cargar el tablero.',
    errTicketOtherOperator: 'Ese vale es de otro operador.',
    errTicketExpired: 'El vale ha caducado. Vuelve a cargar el tablero y hazlo otra vez.',
    errSessionExpired: 'La sesión ha caducado. Entra otra vez.',
  } satisfies AdminBundle,

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
