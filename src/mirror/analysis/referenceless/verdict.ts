/**
 * El veredicto del cruce **sin referencia** (CA-3, CA-4, CA-5, CA-6, CA-7).
 *
 * El dominio de veredictos de este modo es exactamente **{ESPEJO, INCONCLUSO}**.
 * No es pesimismo: es leer CA-12 de SPEC-002 —«lo desconocido no es
 * independencia»— con el instrumento que hay. Este modo puede **refutar** la
 * segunda vía de RN-02; no puede **establecerla**.
 *
 * El motivo entero, que es la decisión más cara de la spec: SPEC-002 CA-15.1
 * dice, y es exacto, que «que C1 adelante a C2 no prueba que el par sea
 * independiente: prueba que C2 no es origen de C1». Esa propiedad —«ninguna es
 * origen de la otra»— la satisfacen **por construcción** dos espejos de un
 * tercero. Un espejo *sí* puede adelantar a otro espejo; lo que no puede es
 * adelantar a **su** origen. Con la referencia presente, el hueco lo tapaban los
 * dos veredictos por candidata; sin ellos, el adelanto mutuo queda solo y es
 * compatible con la hipótesis que dice refutar. Y hay un mecanismo concreto: a 1
 * captura/minuto (RN-11) y con τ = 90 s, dos espejos del mismo origen con
 * refresco irregular producen diferencias que superan τ en las dos direcciones
 * sin que ninguna observe nada por su cuenta.
 *
 * Las señales no se tiran: se cuentan, se citan, viajan enteras en el informe y
 * producen INCONCLUSO con motivo propio, que es una cosa muy distinta de «no
 * encontramos nada».
 *
 * **Y este módulo no consume, ni puede consumir, firmas de error de la
 * referencia.** Con futgal ausente ese conjunto estaría vacío, y
 * `some(e => !vacio.has(e))` es `true` para todo error replicado: el informe
 * afirmaría un origen común aguas arriba de futgal cuando lo único cierto es que
 * no hemos mirado. El arreglo no es poner el flag a `false` —eso diría que el
 * origen común SÍ es futgal, que tampoco se ha comprobado—: es que el campo deje
 * de existir y lo sustituya una declaración de no-comprobación.
 */
import { MIN_LEAD_EVENTS, MIN_LEAD_MATCHES, N_MIN } from '@/mirror/thresholds';
import type { PairAnalysis } from '../compare';

/** CA-4: {ESPEJO, INCONCLUSO}, y nada más. */
export type ReferencelessVerdict = 'ESPEJO' | 'INCONCLUSO';

/** Los seis motivos de la regla de decisión de CA-6, en su orden. */
export type ReferencelessReason =
  | 'muestra_insuficiente'
  | 'error_replicado'
  | 'independencia_no_demostrable_sin_referencia'
  | 'sin_contenido_propio'
  | 'adelantos_en_una_sola_direccion'
  | 'sin_senal';

export interface ReferencelessVerdictResult {
  readonly verdict: ReferencelessVerdict;
  readonly reason: ReferencelessReason;
  /** CA-5. El tipo es el literal `false`: `true` no es representable. */
  readonly rn02_segunda_via_entre_automaticas: false;
  /** El veredicto se sostiene solo en un indicio (CA-6, ramas 4a y 4b). */
  readonly mirror_indication: boolean;
  /** CA-7. Nombrar origen es una atribución, y este modo no puede atribuir. */
  readonly espejo_de: null;
  /** CA-3.1. `true` si y solo si hay ≥ 1 error replicado entre las dos. */
  readonly origen_comun_probado: boolean;
  /** CA-3.2. Literal, y el único valor que este modo puede emitir. */
  readonly atribucion_de_origen: 'no_comprobada';
  /** CA-3.3. */
  readonly origen_atribuido_a: null;
}

/** Si los adelantos de una dirección superan el mínimo declarado (CA-15.1). */
function leadsAreEnough(events: number, matches: number): boolean {
  return events >= MIN_LEAD_EVENTS && matches >= MIN_LEAD_MATCHES;
}

/**
 * CA-6, total y ordenada. Un solo argumento, y es el análisis del par: no hay
 * dónde colar un conjunto de firmas de referencia (CA-3).
 */
export function verdictWithoutReference(analysis: PairAnalysis): ReferencelessVerdictResult {
  const origen_comun_probado = analysis.replicated_errors.length > 0;
  const decided = decide(analysis);

  return {
    ...decided,
    rn02_segunda_via_entre_automaticas: false,
    espejo_de: null,
    origen_comun_probado,
    atribucion_de_origen: 'no_comprobada',
    origen_atribuido_a: null,
  };
}

function decide(analysis: PairAnalysis): {
  readonly verdict: ReferencelessVerdict;
  readonly reason: ReferencelessReason;
  readonly mirror_indication: boolean;
} {
  // 1. Muestra insuficiente. La puerta de CA-11 de SPEC-002, sin cambio.
  if (analysis.n_comparable < N_MIN) {
    return { verdict: 'INCONCLUSO', reason: 'muestra_insuficiente', mirror_indication: false };
  }

  // 2. Fuerte-espejo: un error replicado. MANDA aunque concurra una señal de
  // independencia, y aquí el modo se aparta a propósito del paso 2 de la regla
  // de SPEC-002 CA-10: allí concurrían dos señales FUERTES y una tenía que
  // estar mal, así que INCONCLUSO era lo honesto; aquí la señal de
  // independencia no es concluyente por construcción, así que no hay
  // contradicción que resolver — hay una prueba y un indicio en contra.
  if (analysis.replicated_errors.length > 0) {
    return { verdict: 'ESPEJO', reason: 'error_replicado', mirror_indication: false };
  }

  const aLeads = leadsAreEnough(analysis.leads_a, analysis.lead_matches_a);
  const bLeads = leadsAreEnough(analysis.leads_b, analysis.lead_matches_b);

  // 3. Señal de independencia: adelantos mutuos suficientes o una discrepancia
  // persistente. No prueba independencia sin referencia, así que no dicta
  // INDEPENDIENTE; pero es una SEÑAL, y por eso va antes que los indicios.
  if ((aLeads && bLeads) || analysis.persistent_discrepancies.length > 0) {
    return {
      verdict: 'INCONCLUSO',
      reason: 'independencia_no_demostrable_sin_referencia',
      mirror_indication: false,
    };
  }

  // 4a. Sincronía. Exige la mitad temporal `completa` porque en una ventana en
  // reposo no hay ningún cambio de valor: todo sale empate y la cláusula
  // dispararía siempre, que sería un hecho sobre la ventana y no sobre las
  // fuentes (SPEC-002 CA-10, ratificado por su enmienda §4).
  const lockstep =
    analysis.temporal_half === 'completa' &&
    analysis.exclusives_a === 0 &&
    analysis.exclusives_b === 0 &&
    analysis.leads_a === 0 &&
    analysis.leads_b === 0;

  if (lockstep) {
    return { verdict: 'ESPEJO', reason: 'sin_contenido_propio', mirror_indication: true };
  }

  // 4b. Adelantos en UNA SOLA dirección. Indicio y no señal (F-SPEC-002-21,
  // cerrado aquí para este modo): C2 rezagada respecto de C1 es igual de
  // compatible con «C2 copia de C1» que con «las dos copian de O con retardos
  // distintos», así que el indicio cede ante la rama 3 y nunca nombra origen.
  if (aLeads !== bLeads) {
    return {
      verdict: 'ESPEJO',
      reason: 'adelantos_en_una_sola_direccion',
      mirror_indication: true,
    };
  }

  // 5. En otro caso.
  return { verdict: 'INCONCLUSO', reason: 'sin_senal', mirror_indication: false };
}
