/**
 * Where the verdict lands (CA-13): the prose in
 * `docs/epicas/EPIC-001-spike-ingesta/hallazgos/test-de-espejo.md` and the JSON
 * next to it.
 *
 * Both are GENERATED from the report, and that is the point: the prose a
 * person would type after reading the numbers is neither repeatable (CA-7) nor
 * checkable against the archive (CA-14). The document is written in Spanish
 * like every document of this repository, and the verdicts keep the canonical
 * spelling of `dominio.md`.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { MirrorReport, PairReport, SourceReport } from './report';

export const FINDINGS_DIR = 'docs/epicas/EPIC-001-spike-ingesta/hallazgos';
export const FINDINGS_MARKDOWN = `${FINDINGS_DIR}/test-de-espejo.md`;
export const FINDINGS_JSON = `${FINDINGS_DIR}/test-de-espejo.json`;

function sourceSection(source: SourceReport): string {
  const temporal = source.counters.temporal;
  return [
    `### ${source.source} frente a ${source.reference}`,
    '',
    `**Veredicto: ${source.verdict}** (${source.reason}).`,
    `\`rn02_segunda_via_entre_automaticas\`: **${source.rn02_segunda_via_entre_automaticas}**.`,
    '',
    '| Contador | Valor |',
    '|---|---|',
    `| N comparables / N_min | ${source.counters.n_comparable} / ${source.counters.n_min} |`,
    `| Exclusivos suyos / de la referencia | ${source.counters.exclusive_to_source} / ${source.counters.exclusive_to_reference} |`,
    `| Errores replicados | ${source.counters.replicated_errors} |`,
    `| Discrepancias persistentes | ${source.counters.persistent_discrepancies} |`,
    temporal === null
      ? '| Adelantos / retrasos / empates | mitad temporal pendiente |'
      : `| Adelantos / retrasos / empates | ${temporal.leads} / ${temporal.lags} / ${temporal.ties} |`,
    '',
    source.prose,
    '',
  ].join('\n');
}

function pairSection(pair: PairReport): string {
  return [
    `### ${pair.sources[0]} × ${pair.sources[1]} (CA-15)`,
    '',
    `**Veredicto: ${pair.verdict}** (${pair.reason}).`,
    `\`rn02_segunda_via_entre_automaticas\`: **${pair.rn02_segunda_via_entre_automaticas}**.`,
    pair.espejo_de === null ? '' : `Espejo de: ${pair.espejo_de}.`,
    pair.origen_comun_distinto_de_futgal
      ? 'Origen común aguas arriba distinto de futgal: **sí**.'
      : '',
    '',
    '| Contador | Valor |',
    '|---|---|',
    `| N comparables / N_min | ${pair.counters.n_comparable} / ${pair.counters.n_min} |`,
    `| Errores replicados (total / también en futgal / ausentes de futgal) | ${pair.counters.replicated_errors_total} / ${pair.counters.replicated_errors_also_in_reference} / ${pair.counters.replicated_errors_absent_from_reference} |`,
    `| Discrepancias persistentes | ${pair.counters.persistent_discrepancies} |`,
    '',
    pair.prose,
    '',
  ]
    .filter((line, index, all) => !(line === '' && all[index - 1] === ''))
    .join('\n');
}

export function renderFindings(report: MirrorReport): string {
  return [
    '# Hallazgo — Test de espejo entre fuentes automáticas (SPEC-002)',
    '',
    '> Documento **generado** por `npm run mirror:analizar`. No se edita a mano:',
    '> es función del archivo raw y del fichero de emparejamiento (CA-7), y cada',
    '> afirmación cita las capturas que la sostienen (CA-14). El JSON está al lado.',
    '',
    '## Ventana',
    '',
    `- Inicio: \`${report.window.start ?? 'sin capturas'}\``,
    `- Fin: \`${report.window.end ?? 'sin capturas'}\``,
    `- Válida (≥ ${(report.window.min_tick_success_ratio * 100).toFixed(0)} % de ticks exitosos por par): **${report.window.valid}**`,
    `- Mitad de contenido: **${report.halves.content}** · mitad temporal: **${report.halves.temporal}**`,
    report.halves.planned_temporal_window === null
      ? ''
      : `- Ventana en vivo prevista que cerrará la mitad temporal: ${report.halves.planned_temporal_window}`,
    '',
    '### Cobertura por par (fuente, competición)',
    '',
    '| Fuente | Competición | ok | fallidos | omitidos | cobertura |',
    '|---|---|---|---|---|---|',
    ...report.window.coverage.map(
      (pair) =>
        `| ${pair.source} | ${pair.competition_id} | ${pair.ok} | ${pair.failed} | ${pair.skipped} | ${(pair.ratio * 100).toFixed(1)} % |`,
    ),
    '',
    '## Umbrales usados',
    '',
    '> Son hipótesis declaradas, no verdad recibida (§5 de las notas del gate).',
    '> Viajan aquí junto al reparto de datos observados para poder recalcular un',
    '> veredicto **sin volver a capturar**.',
    '',
    `- τ = ${report.thresholds.tau_ms / 1000} s`,
    `- N_min = ${report.thresholds.n_min}`,
    `- Adelantos mínimos: ${report.thresholds.min_lead_events} en ${report.thresholds.min_lead_matches} partidos (${report.thresholds.min_lead_events_each_direction} en cada dirección para el par)`,
    `- Capturas consecutivas para una discrepancia persistente: ${report.thresholds.persistent_discrepancy_captures}`,
    '',
    '## Veredictos',
    '',
    ...report.sources.map(sourceSection),
    pairSection(report.pair),
    ...(report.conflict_metric_warning === null
      ? []
      : [
          '## Advertencia sobre la métrica de conflictos',
          '',
          `> ${report.conflict_metric_warning.text}`,
          '',
        ]),
    '## Resumen',
    '',
    report.prose,
    '',
  ]
    .filter((line, index, all) => !(line === '' && all[index - 1] === ''))
    .join('\n');
}

/** Writes both artefacts. Returns the paths written. */
export async function writeFindings(
  report: MirrorReport,
  root: string,
): Promise<{ readonly markdown: string; readonly json: string }> {
  const markdown = join(root, FINDINGS_MARKDOWN);
  const json = join(root, FINDINGS_JSON);

  await mkdir(dirname(markdown), { recursive: true });
  await writeFile(markdown, renderFindings(report), 'utf8');
  await writeFile(json, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  return { markdown, json };
}
