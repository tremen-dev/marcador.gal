/**
 * The prose of the report (CA-13).
 *
 * "Veredicto accionable, no log": a paragraph per source that says what is
 * DONE in consequence, not what was counted. It is generated and not written
 * by hand for the same reason the JSON is: the analysis has to be repeatable
 * byte for byte (CA-7), and a paragraph typed after reading the numbers is
 * neither repeatable nor checkable.
 *
 * In Spanish, like every document of this repository. The verdicts keep their
 * canonical spelling from `dominio.md` and are not translated.
 */
import { CONFLICT_METRIC_WARNING_TEXT } from './report';
import type { PairAnalysis } from './compare';
import type { PairReport, SourceReport } from './report';
import type { PairVerdictResult, VerdictResult } from './verdict';
import type { SourceId } from '@/model/ids';

function counts(analysis: PairAnalysis): string {
  return (
    `N = ${analysis.n_comparable} eventos comparables; ` +
    `${analysis.leads_b} adelantos en ${analysis.lead_matches_b} partidos, ` +
    `${analysis.leads_a} retrasos, ${analysis.ties} empates; ` +
    `${analysis.exclusives_b} eventos exclusivos suyos y ${analysis.exclusives_a} de la referencia; ` +
    `${analysis.replicated_errors.length} errores replicados y ` +
    `${analysis.persistent_discrepancies.length} discrepancias persistentes`
  );
}

/**
 * CA-10.4 y CA-13. La grafía se nombra aparte y se dice, en la misma frase,
 * que no vota y por qué. No es cortesía: quien lee este informe es quien
 * escribe la spec del motor, y un contador de divergencias sin esa frase al
 * lado es una invitación a leerlas como prueba de independencia, que es
 * exactamente la confianza falsa que la enmienda quita.
 */
function spellingNote(count: number): string {
  if (count === 0) return '';
  return (
    ` Aparte, y sin voto: ${count} divergencias de grafía en los nombres de equipo. Se registran y ` +
    'la grafía **no dicta** veredicto (CA-10.4) — un agregador copia el marcador y rinde el nombre ' +
    'desde su propia base de equipos, así que la señal dispara igual con espejo que con ' +
    'independencia y no lleva información. Quedan citadas con sus capturas como superficie de ' +
    'auditoría del emparejamiento de CA-6 y como primer insumo del catálogo de alias de RN-09.'
  );
}

export function proseSource(
  reference: SourceId,
  analysis: PairAnalysis,
  verdict: VerdictResult,
  temporalComplete: boolean,
): string {
  const head = `${analysis.b} frente a ${reference}: **${verdict.verdict}** (${verdict.reason}). ${counts(analysis)}.`;

  const consequence =
    verdict.verdict === 'INDEPENDIENTE'
      ? `Qué se hace: ${analysis.b} cuenta como fuente independiente a efectos de RN-02, así que su ` +
        'coincidencia con otra fuente de peso ≥ 0,7 habilita la segunda vía y permite publicar confirmado.'
      : `Qué se hace: ${analysis.b} NO cuenta como fuente independiente a efectos de RN-02. ` +
        'Su segunda vía exige independencia demostrada, y lo desconocido no satisface la precondición: ' +
        'el motor se diseña con una sola vía para esta fuente, y lo que ella sostenga sola se publica provisional (RN-03).';

  const pending = temporalComplete
    ? ''
    : ' La mitad temporal está pendiente: esta ventana no contuvo cambios de valor que las dos fuentes ' +
      'viesen, así que el veredicto se apoya solo en señales de contenido y solo puede mejorar.';

  const caveat = verdict.mirror_indication
    ? ' Hay indicio de espejo —ningún contenido propio y ningún desajuste temporal—, que por CA-9 es indicio y no prueba.'
    : '';

  return `${head} ${consequence}${pending}${caveat}${spellingNote(analysis.spelling_divergences.length)}`;
}

export function prosePair(
  analysis: PairAnalysis,
  verdict: PairVerdictResult,
  temporalComplete: boolean,
): string {
  const head =
    `${analysis.a} × ${analysis.b} (CA-15): **${verdict.verdict}** (${verdict.reason}). ` +
    `N = ${analysis.n_comparable}; adelantos ${analysis.leads_a} en un sentido y ${analysis.leads_b} en el otro.`;

  const consequence =
    verdict.verdict === 'INDEPENDIENTE'
      ? 'Qué se hace: las dos candidatas son independientes entre sí, así que el par satisface por sí mismo ' +
        'la segunda vía de RN-02 aunque ninguna lo sea de futgal.'
      : 'Qué se hace: el par NO habilita la segunda vía de RN-02 entre fuentes automáticas. ' +
        'Dos agregadores que beben del mismo origen no cuentan como independientes.';

  const upstream = verdict.origen_comun_distinto_de_futgal
    ? ' Hay al menos un error replicado por las dos y ausente de futgal: eso prueba un origen común ' +
      'aguas arriba que NO es futgal, y es un hallazgo que ningún otro cruce puede producir.'
    : '';

  const mirrorOf =
    verdict.espejo_de === null
      ? ''
      : ` Los adelantos van en una sola dirección, así que la rezagada se trata como espejo de ${verdict.espejo_de}.`;

  const pending = temporalComplete ? '' : ' Mitad temporal pendiente.';

  // CA-15.4: simétrica, y aquí el argumento es MÁS fuerte —son dos agregadores,
  // cada uno con su propia base de equipos, así que la señal dispararía incluso
  // para dos reventas literales del mismo feed.
  const spelling = spellingNote(analysis.spelling_divergences.length);

  return `${head} ${consequence}${upstream}${mirrorOf}${pending}${spelling}`;
}

export function proseSummary(
  sources: readonly SourceReport[],
  pair: PairReport,
  warning: { readonly text: string } | null,
): string {
  const lines = [
    'Test de espejo entre fuentes automáticas (SPEC-002).',
    ...sources.map((source) => source.prose),
    pair.prose,
  ];

  if (warning !== null) {
    lines.push(warning.text === '' ? CONFLICT_METRIC_WARNING_TEXT : warning.text);
  }

  const anyRoute =
    sources.some((source) => source.rn02_segunda_via_entre_automaticas) ||
    pair.rn02_segunda_via_entre_automaticas;

  lines.push(
    anyRoute
      ? 'Conclusión: RN-02 conserva su segunda vía entre fuentes automáticas.'
      : 'Conclusión: RN-02 se queda sin segunda vía entre fuentes automáticas. El corresponsal ' +
        '(peso 0,8, independiente de cualquier scraper por construcción) sigue pudiendo formar par ' +
        'con un agregador: esta medición no lo cubre y no lo niega.',
  );

  return lines.join('\n\n');
}
