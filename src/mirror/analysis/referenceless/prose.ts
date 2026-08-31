/**
 * La prosa del informe sin referencia (CA-5, CA-11, CA-12, CA-15).
 *
 * Generada y no escrita a mano, por el mismo motivo que el JSON: el análisis
 * tiene que ser repetible byte a byte (SPEC-002 CA-7) y un párrafo tecleado
 * después de leer los números no es ni repetible ni auditable contra el archivo.
 *
 * Lo que esta prosa tiene que decir y el JSON solo no dice: **por qué** la
 * bandera de RN-02 es `false`, distinguiendo «se probó origen común» de «no se
 * pudo demostrar independencia» (CA-5). Un lector podría leer «INCONCLUSO por
 * independencia no demostrable» como una casi-independencia, y esa es
 * exactamente la confianza falsa que esta familia de specs existe para cerrar.
 */
import {
  DECLARED_LIMITATIONS,
  REFERENCELESS_CONFLICT_WARNING_TEXT,
  UNMEASURED_CANDIDATE_VERDICTS,
} from './report';
import { SPEC_003_LEDGER as SPEC_003_LEDGER_PATH } from './retention';
import type { ArchiveRetention } from './retention';
import type { ReferencelessVerdictResult } from './verdict';
import type { PairAnalysis } from '../compare';

/** Por qué la bandera es `false`, con el motivo de este desenlace y no otro. */
function whyFalse(verdict: ReferencelessVerdictResult): string {
  switch (verdict.reason) {
    case 'error_replicado':
      return (
        'Por qué la bandera de RN-02 es false: **se probó origen común**. Las dos replican el ' +
        'mismo valor equivocado y la misma corrección, y dos fuentes que observan por su cuenta ' +
        'coinciden en los aciertos —el marcador real es uno— pero no en los fallos. La segunda ' +
        'vía de RN-02 entre automáticas queda cerrada, con evidencia y de forma definitiva. Lo ' +
        'que NO se sabe es de quién es ese origen: probarlo y atribuirlo son cosas distintas.'
      );
    case 'independencia_no_demostrable_sin_referencia':
      return (
        'Por qué la bandera de RN-02 es false: **no se pudo demostrar independencia**, que no es ' +
        'lo mismo que haber probado lo contrario y tampoco es una casi-independencia. Las ' +
        'señales que con referencia dictarían INDEPENDIENTE están aquí, contadas y citadas, y no ' +
        'bastan: un espejo sí puede adelantar a otro espejo, y una discrepancia persistente ' +
        'prueba que no leen la misma copia, no que alguna observe el hecho. Por CA-12 de ' +
        'SPEC-002, lo desconocido no es independencia: el motor se diseña con una sola vía.'
      );
    case 'muestra_insuficiente':
      return (
        'Por qué la bandera de RN-02 es false: **la muestra no llegó al mínimo declarado**, así ' +
        'que no se pudo demostrar independencia ni probar origen común. La respuesta es ampliar ' +
        'la ventana, no bajar el umbral. Por CA-12 de SPEC-002, mientras tanto se trata como ' +
        'espejo y el motor se diseña con una sola vía.'
      );
    case 'sin_contenido_propio':
    case 'adelantos_en_una_sola_direccion':
      return (
        'Por qué la bandera de RN-02 es false: **hay indicio de espejo y ninguna prueba de ' +
        'independencia**. El indicio no atribuye origen a nadie —C2 rezagada respecto de C1 es ' +
        'igual de compatible con «C2 copia de C1» que con «las dos copian de O con retardos ' +
        'distintos»— y por eso el veredicto no nombra espejo de nadie. La segunda vía de RN-02 ' +
        'entre automáticas no se abre.'
      );
    case 'sin_senal':
      return (
        'Por qué la bandera de RN-02 es false: **la ventana no dio ninguna señal**, ni de origen ' +
        'común ni de independencia. No se pudo demostrar independencia, y por CA-12 de SPEC-002 ' +
        'lo desconocido no la satisface: el motor se diseña con una sola vía.'
      );
  }
}

export function proseReferencelessPair(
  analysis: PairAnalysis,
  verdict: ReferencelessVerdictResult,
  temporalComplete: boolean,
): string {
  const head =
    `${analysis.a} × ${analysis.b}, cruce sin referencia (SPEC-003): ` +
    `**${verdict.verdict}** (${verdict.reason}). ` +
    `N = ${analysis.n_comparable} eventos comparables; ` +
    `${analysis.leads_a} adelantos en un sentido y ${analysis.leads_b} en el otro ` +
    `(${analysis.lead_matches_a} y ${analysis.lead_matches_b} partidos); ` +
    `${analysis.exclusives_a} eventos exclusivos de la primera y ${analysis.exclusives_b} de la ` +
    `segunda; ${analysis.replicated_errors.length} errores replicados y ` +
    `${analysis.persistent_discrepancies.length} discrepancias persistentes.`;

  const origin = verdict.origen_comun_probado
    ? 'Origen común: **probado** (hay al menos un error replicado por las dos, con sus cuatro ' +
      'capturas citadas). Atribución de origen: **no comprobada**, y no puede serlo con esta ' +
      'ventana: identificar la tercera fuente exige observarla, y aquí no se ha observado ninguna.'
    : 'Origen común: **no probado** en esta ventana — que no es lo mismo que descartado. ' +
      'Atribución de origen: **no comprobada**.';

  const indication = verdict.mirror_indication
    ? ' El veredicto se sostiene en un **indicio**, no en una prueba, y por eso `espejo_de` es ' +
      'null: nombrar origen sería una atribución.'
    : '';

  const pending = temporalComplete
    ? ''
    : ' La mitad temporal está **pendiente**: esta ventana no contuvo cambios de valor que las ' +
      'dos fuentes viesen, así que el veredicto se apoya solo en señales de contenido.';

  const spelling =
    analysis.spelling_divergences.length === 0
      ? ''
      : ` Aparte, y sin voto: ${analysis.spelling_divergences.length} divergencias de grafía en ` +
        'los nombres de equipo. Se registran y **no dictan** (SPEC-002 CA-10.4 y CA-15.4), y aquí ' +
        'el argumento es más fuerte que allí: son dos agregadores, cada uno con su propia base de ' +
        'equipos, así que la señal dispararía incluso para dos reventas literales del mismo feed.';

  return `${head} ${origin}${indication} ${whyFalse(verdict)}${pending}${spelling}`;
}

export function proseReferencelessSummary(
  pairProse: string,
  retention: ArchiveRetention,
): string {
  return [
    'Test de espejo **sin referencia**: el cruce entre las dos candidatas (SPEC-003, modo ' +
      '`sin-referencia`). Ninguna de las dos es «la fuente»: se cruzan entre sí, y no hay ' +
      'referencia contra la que medirlas.',
    pairProse,
    `Veredictos por candidata contra la referencia: **${UNMEASURED_CANDIDATE_VERDICTS.estado}**. ` +
      UNMEASURED_CANDIDATE_VERDICTS.motivo,
    REFERENCELESS_CONFLICT_WARNING_TEXT,
    'Qué preguntas NO responde este informe:',
    ...DECLARED_LIMITATIONS.map((limit) => `- ${limit.texto}`),
    'Conclusión sobre RN-02: este modo **nunca** abre la segunda vía entre fuentes automáticas. ' +
      'Puede refutarla —un ESPEJO la cierra con evidencia y de forma definitiva— y no puede ' +
      'establecerla, así que la bandera `rn02_segunda_via_entre_automaticas` es false en todos ' +
      'los desenlaces. El corresponsal (peso 0,8, independiente de cualquier scraper por ' +
      'construcción) sigue pudiendo formar par con un agregador: esta medición no lo cubre y no ' +
      'lo niega.',
    proseRetention(retention),
  ].join('\n\n');
}

/** CA-15.4. Las tres fechas en castellano corrido, y cómo se leen. */
export function proseRetention(retention: ArchiveRetention): string {
  return (
    `Retención del archivo que sostiene este informe (${retention.adr}). La ventana terminó el ` +
    `${retention.fin_de_ventana} —el \`fetched_at\` de la última captura archivada, que es el ` +
    'ancla: ni el reloj, ni el log—. El plazo son ' +
    `${retention.plazo_dias} días, así que la **purga prevista** es el ${retention.purga_prevista}; ` +
    `se admite ${retention.prorrogas_permitidas} prórroga escrita y motivada en el ledger de ` +
    'SPEC-003 antes de que expire ese plazo, y el techo son ' +
    `${retention.techo_dias} días, así que la **purga máxima** es el ${retention.purga_maxima}. ` +
    'Cómo se leen: antes de la purga prevista, las capturas citadas deberían existir; entre las ' +
    'dos fechas existen solo si esa prórroga se escribió —este fichero **no se reescribe**, así ' +
    'que no puede saberlo y el ledger sí—; después de la purga máxima no existen, y ese techo no ' +
    'admite prórroga: es la única de las tres fechas que ninguna decisión posterior puede mover. ' +
    'Este informe no dice si la purga ya ocurrió, y es deliberado: saberlo exigiría compararse ' +
    'con la fecha de hoy y rompería la reproducibilidad byte a byte de SPEC-002 CA-7. El lector ' +
    'compara. El acuse de purga —fecha real, prefijos y número de claves borradas— vive en ' +
    `${SPEC_003_LEDGER_PATH}. Tras la purga, las citas no quedan rotas: la clave lleva el sha256 ` +
    'del cuerpo, así que siguen nombrando exactamente los bytes que las sostuvieron. Dejan de ' +
    'ser recuperables, no de ser verificables contra una copia.'
  );
}
