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
import type { AdminBundle } from './admin-bundle';
import type { BoardBundle } from './board-bundle';
import type { BotBundle } from './bot-bundle';
import type { CrawlerBundle } from './crawler-bundle';
import type { QualifiersBundle } from './qualifiers-bundle';
import type { SiteBundle } from './site-bundle';
import type { StatusesBundle } from './statuses-bundle';
import type { TitlesBundle } from './titles-bundle';

export const gl = {

  statuses: {
    scheduled: 'Programado',
    live: 'En xogo',
    finished: 'Rematado',
    postponed: 'Aprazado',
    suspended: 'Suspendido',
  } satisfies StatusesBundle,

  bot: {
    botDescription:
      'Recollo os resultados do fútbol galego que mandan os corresponsais desde o campo.',
    botAbout: 'O bot de marcador.gal para corresponsais.',

    cmdStart: 'Comezar',
    cmdHelp: 'Como se escribe un resultado',
    cmdMatches: 'Os partidos abertos agora',
    cmdCancel: 'Descartar o que está pendente',
    cmdLanguage: 'Galego ou castelán',
    cmdPrivacy: 'Que se fai cos teus datos',
    cmdOptOut: 'Deixar de enviar resultados',
    cmdStop: 'Deixar de recibir avisos',

    startWho: 'Son o bot de marcador.gal. Recollo os resultados que mandas desde o campo.',
    startWhat: 'Escríbeme cando cambie algo: quen xoga, como vai e o minuto. Nada máis.',
    startNotPublished:
      'O que mandas non sae publicado tal cal: compárase co resto de fontes antes de chegar ao marcador.',
    startHelpHint: 'Escribe /axuda para ver exemplos.',

    noticeController:
      'Este bot é de marcador.gal, un proxecto de tremen.dev. Para calquera cousa que teña que ver cos teus datos, escribe a {mailbox}.',
    noticeWhat:
      'Gardo o texto que escribes, a data da mensaxe e un identificador interno teu. Non gardo o teu nome, nin o teu alias de Telegram, nin o teu número.',
    noticePurpose:
      'Sérveme para levar os resultados ao marcador e para poder revisar despois de onde saíu cada dato.',
    noticeLegalBasis:
      'A base non é o consentimento: é que o bot non funciona se non sabe quen envía, e o interese lexítimo de poder auditar un marcador publicado.',
    noticeAiProvider:
      'O texto que escribes mándase a un provedor de intelixencia artificial para interpretalo. O prazo que ese provedor garda non o decidimos nós.',
    noticeRetention:
      'O arquivo bórrase aos 30 días de rematar a xornada. Pódese prorrogar unha soa vez, por escrito e motivada, e nunca máis alá dos 90 días.',
    noticeRights:
      'Podes pedir acceso, rectificación, supresión ou oposición. Escribe /baixa para deixar de enviar, ou a {mailbox} para o resto.',
    noticeDoNotSend:
      'Non fai falta que mandes nomes de xogadores, de árbitros nin nada sobre a saúde de ninguén. Abonda con quen xoga, como vai e o minuto.',
    noticeLink: 'Tes a información completa en https://marcador.gal/privacidade.',

    helpIntro: 'Escribe como falas. Entendo cousas coma estas:',
    helpExamples:
      '2-1 no minuto 70, Ourense - Celta B\nxa rematou, 3-1\nsuspendido pola néboa',
    helpOrder: 'Primeiro o equipo da casa. «Ourense - Celta B» é 2 do Ourense e 1 do Celta B.',
    helpIfWrong: 'Se non dou co partido, engade os nomes dos equipos.',
    helpCommands:
      '/partidos — os partidos abertos agora\n/cancelar — descartar o que está pendente\n/lingua — galego ou castelán',

    parsing: 'Estou a lelo…',

    cardHeading: 'Isto foi o que entendín:',
    cardScoreLabel: 'Marcador',
    cardMinuteLabel: 'Minuto',
    cardStatusLabel: 'Estado',
    cardConfirm: 'Confirmar',
    cardDiscard: 'Descartar',
    cardHint: 'Se algo non cadra, descarta e escríbeo outra vez.',
    cardExpired: 'Pasou demasiado tempo. Escríbeo outra vez, por se cambiou algo.',

    ackRegistered: 'Rexistrado: {home} {homeScore} - {awayScore} {away}.',
    ackNotPublication:
      'Aínda non está publicado. Compárase co resto de fontes e, se procede, sae no marcador.',
    ackDiscarded: 'Descartado. Non se rexistrou nada.',

    languagePrompt: 'En que lingua queres que che fale?',
    languageGalego: 'Galego',
    languageCastelan: 'Castelán',
    languageChanged: 'Feito. Sigo en galego.',

    openMatchesHeading: 'Partidos abertos agora:',

    optOutDone:
      'Non acepto máis mensaxes túas. O que xa quedou rexistrado non se borra. Para borrar o que te identifica, escribe a {mailbox}: faino unha persoa e contéstache por escrito.',

    errNotAuthorised: 'Non te recoñezo. Este bot só atende a corresponsais dados de alta.',
    errNotUnderstood: 'Non entendín a mensaxe. Proba así: «2-1 no minuto 70, Ourense - Celta B».',
    errMatchNotFound: 'Non atopo ese partido. Comproba os nomes dos equipos ou mira /partidos.',
    errAmbiguous: 'Hai máis dun partido que cadra. Escolle cal:',
    errServiceDown: 'Non podo gardalo agora mesmo. Volve probar nun minuto.',
    errNoOpenMatch: 'Agora mesmo non hai ningún partido aberto.',
    errNothingPending: 'Non tes nada pendente de confirmar.',
  } satisfies BotBundle,
  qualifiers: {
    provisional: 'Provisional',
    confirmado: 'Confirmado',
    pendente_de_confirmar: 'Pendente de confirmar',
    sen_sinal: 'Sen sinal',
  } satisfies QualifiersBundle,

  /**
   * The scoreboard (SPEC-018). *Sinal* / *señal* DO NOT appear here — they
   * live only in `qualifiers` — and *actualizar* / *actualizado* do not
   * appear there (ADR-027 §4.4). The two absences are one case.
   */
  board: {
    heading: 'O marcador',

    competitionHeading: '{competition}',
    roundLabel: 'Xornada {round}',

    colTime: 'Hora',
    colHome: 'Casa',
    colAway: 'Fóra',
    colScore: 'Marcador',
    colStatus: 'Estado',
    colQualifier: 'Cualificador',
    colLastData: 'Último dato',

    statusInline: 'Estado',
    qualifierInline: 'Cualificador',

    noScoreYet: 'Sen marcador publicado',
    suspendedReserve:
      'Suspendido: o marcador non é definitivo ata que decida o Comité de Competición.',

    lastDataNow: 'Agora mesmo',
    lastDataMinutes: 'Hai {n} min',
    lastDataNone: 'Aínda non',

    refreshedNow: 'Actualizado agora mesmo',
    refreshedMinutes: 'Actualizado hai {n} min',
    refreshFailed: 'Non se puido actualizar. O que ves é de hai {n} min.',
    reloadHint: 'Carga a páxina de novo.',
    autoRefresh: 'Esta páxina actualízase soa cada {seconds} segundos.',

    publishedNever: 'Aínda non se publicou ningún marcador.',
    publishedAt: 'Última publicación: hai {n} min.',

    emptyNoMatchday:
      'Non hai ningunha xornada de medición declarada, así que non hai nada que amosar.',
    emptyNoMatches: 'A xornada declarada non ten ningún partido.',

    noticeHeading: 'Que é isto',
    noticeMeasurement: 'Isto é unha medición, non un produto.',
    noticeNotOfficial: 'Non é oficial: non vén da RFGF nin de futgal.es.',
    noticeSingleSource:
      'Hai unha soa fonte automática, así que o normal é que o marcador sexa provisional e que chegue con atraso.',
    noticeSeveralSources:
      'Hai {sources} fontes automáticas, así que o marcador pode chegar con atraso.',
    noticeStop: 'Para pedir que pare, abonda con escribir a {mailbox}.',

    crawlerLink: 'Como se len as páxinas públicas, e como pedir que pare',
    projectLink: 'Que é marcador.gal',
    mailboxLink: 'Escribir ao buzón',

    otherLanguage: 'Castellano',
  } satisfies BoardBundle,

  admin: {
    title: 'Panel do operador — marcador.gal',

    accessHeading: 'Entrar no panel',
    accessOperator: 'Operador',
    accessSecret: 'Clave',
    accessSubmit: 'Entrar',
    accessRefused: 'Non entras con eses datos.',

    boardHeading: 'Partidos das xornadas declaradas',
    boardEmpty: 'Non hai ningunha xornada de medición declarada, así que non hai nada que operar.',
    boardMatch: 'Partido',
    boardStatus: 'Estado',
    boardScore: 'Marcador',
    boardQualifier: 'Cualificador',
    boardLastSeen: 'Última observación',
    boardOpenAlerts: 'Alertas abertas',
    boardNever: 'Nunca',
    boardNoDecision: 'Sen decisión publicada',
    boardDetail: 'Ver o detalle',

    detailHeading: 'Detalle do partido',
    detailObservations: 'Observacións por fonte',
    detailDecisions: 'Rexistro de decisións',
    detailSource: 'Fonte',
    detailConfidence: 'Peso',
    detailObservedAt: 'Observado ás',
    detailVersion: 'Versión',
    detailRule: 'Regra',
    detailSupport: 'Apoios',
    detailBack: 'Volver ao taboleiro',

    formCorrection: 'Corrixir o marcador',
    formStatusChange: 'Cambiar o estado',
    formRatify: 'Ratificar o vixente',
    formStatus: 'Estado',
    formHomeScore: 'Goles da casa',
    formAwayScore: 'Goles de fóra',
    formReason: 'Motivo',
    formReasonHint: 'Escribe por que fas isto. Sen motivo non se publica nada.',
    formSubmit: 'Publicar',
    formCancel: 'Cancelar',

    trayHeading: 'Bandexa de alertas',
    trayOpen: 'Abertas',
    trayAcknowledged: 'Recoñecidas',
    trayEmpty: 'Non hai ningunha alerta.',
    trayAcknowledge: 'Recoñecer',
    trayReason: 'Motivo da alerta',
    trayRaisedAt: 'Levantada ás',
    trayNotPublished: 'Recoñecer unha alerta non publica nada.',

    ackPublished: 'Quedou publicado: {home} {homeScore}-{awayScore} {away}, {qualifier}.',
    ackAcknowledged: 'Alerta recoñecida. Non se publicou nada.',
    errEmptyReason: 'Falta o motivo. Non se arquivou nada e non se publicou nada.',
    errOutOfMatchday: 'Ese partido non está en ningunha xornada declarada.',
    errUnknownAlert: 'Esa alerta non existe ou non é dun partido das xornadas declaradas.',
    errNothingToRatify: 'Aínda non hai nada publicado que ratificar.',
    errTicketMalformed: 'O formulario chegou sen vale. Volve cargar o taboleiro.',
    errTicketTampered: 'O vale non cadra coa súa sinatura. Volve cargar o taboleiro.',
    errTicketOtherOperator: 'Ese vale é doutro operador.',
    errTicketExpired: 'O vale caducou. Volve cargar o taboleiro e faino outra vez.',
    errSessionExpired: 'A sesión caducou. Entra outra vez.',
  } satisfies AdminBundle,

  titles: {
    project: 'O proxecto — marcador.gal',
    crawler: 'O rastrexador — marcador.gal',
    /**
     * `marcador.gal` A SECAS. Decidido por Alberto Fojo el 2026-09-04
     * (SPEC-018 CA-13.5), descartando la forma `O marcador — marcador.gal`
     * que sigue el patrón de las otras dos: la portada del marcador no
     * repite el dominio detrás de un guion.
     */
    scoreboard: 'marcador.gal',
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
      'O obxecto do estudo son as opcións de obter os resultados do fútbol galego: ' +
      'que vías hai para lelos e canto traballo levan. ' +
      'A medición aínda non comezou e non hai ningunha cifra. ' +
      'A fonte oficial das competicións que se queren medir non se rastrexa, porque ' +
      'o seu ficheiro robots.txt non o permite e respectalo é unha norma do proxecto: ' +
      'esa é unha das razóns polas que o estudo está parado.',

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
