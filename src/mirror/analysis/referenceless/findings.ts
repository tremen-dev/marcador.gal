/**
 * CA-13 — dónde aterriza el veredicto del modo sin referencia.
 *
 * Fichero propio, y no una variante del de SPEC-002: dos informes con el mismo
 * nombre y preguntas distintas es la peor forma de perder una medición
 * irrepetible. Corriendo los dos modos quedan cuatro ficheros, y este dice en
 * su **primera línea** qué modo lo produjo, para que quien lo abra dentro de
 * seis meses no tenga que deducirlo de la ausencia de una sección.
 *
 * Generado y no escrito a mano, como el de SPEC-002: la prosa que alguien
 * teclearía tras leer los números no es repetible (CA-7) ni comprobable contra
 * el archivo (CA-14).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { ReferencelessReport } from './report';

export const REFERENCELESS_FINDINGS_DIR = 'docs/epicas/EPIC-001-spike-ingesta/hallazgos';
export const REFERENCELESS_FINDINGS_MARKDOWN =
  `${REFERENCELESS_FINDINGS_DIR}/test-de-espejo-sin-referencia.md`;
export const REFERENCELESS_FINDINGS_JSON =
  `${REFERENCELESS_FINDINGS_DIR}/test-de-espejo-sin-referencia.json`;

function pairSection(report: ReferencelessReport): string {
  const pair = report.pair;
  const temporal = pair.counters.temporal;

  return [
    `### ${pair.candidatas[0]} × ${pair.candidatas[1]} — el cruce entre candidatas`,
    '',
    `**Veredicto: ${pair.verdict}** (${pair.reason}).`,
    `\`rn02_segunda_via_entre_automaticas\`: **${pair.rn02_segunda_via_entre_automaticas}**.`,
    `Origen común probado: **${pair.origen_comun_probado}**. ` +
      `Atribución de origen: **${pair.atribucion_de_origen}**. ` +
      `Origen atribuido a: **${pair.origen_atribuido_a === null ? 'null' : pair.origen_atribuido_a}**.`,
    `Espejo de: **${pair.espejo_de === null ? 'null' : pair.espejo_de}** ` +
      '(este modo no atribuye origen: nombrarlo sería una atribución, CA-7).',
    '',
    '| Contador | Valor |',
    '|---|---|',
    `| N comparables / N_min | ${pair.counters.n_comparable} / ${pair.counters.n_min} |`,
    `| Exclusivos de la primera / de la segunda | ${pair.counters.exclusive_to_first} / ${pair.counters.exclusive_to_second} |`,
    `| Errores replicados | ${pair.counters.replicated_errors_total} |`,
    `| Discrepancias persistentes | ${pair.counters.persistent_discrepancies} |`,
    `| Divergencias de grafía (**se registran, no dictan**) | ${pair.counters.spelling_divergences} |`,
    temporal === null
      ? '| Adelantos en un sentido / en el otro / empates | mitad temporal pendiente |'
      : `| Adelantos en un sentido / en el otro / empates | ${temporal.leads_first_over_second} / ${temporal.leads_second_over_first} / ${temporal.ties} |`,
    '',
    pair.prose,
    '',
  ].join('\n');
}

export function renderReferencelessFindings(report: ReferencelessReport): string {
  return [
    `# Hallazgo — Test de espejo **sin referencia** (modo \`${report.modo}\`, ${report.spec})`,
    '',
    '> Documento **generado** por `npm run mirror:analizar-sin-referencia`. No se edita a mano:',
    '> es función del archivo raw y del fichero de emparejamiento (SPEC-002 CA-7), y cada',
    '> afirmación cita las capturas que la sostienen (SPEC-002 CA-14). El JSON está al lado.',
    '>',
    '> **No es el informe de SPEC-002.** Aquel cruza cada candidata contra futgal; este las cruza',
    '> entre sí, sin referencia, y responde MENOS. Lo que no responde está escrito abajo.',
    '',
    '## Ventana',
    '',
    `- Inicio: \`${report.window.start ?? 'sin capturas'}\``,
    `- Fin: \`${report.window.end}\``,
    `- Válida (≥ ${(report.window.min_tick_success_ratio * 100).toFixed(0)} % de ticks exitosos por par declarado): **${report.window.valid}**`,
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
    '> Son hipótesis declaradas, no verdad recibida, y se heredan de SPEC-002 sin cambio.',
    '> Viajan aquí para poder recalcular un veredicto **sin volver a capturar**.',
    '',
    `- τ = ${report.thresholds.tau_ms / 1000} s`,
    `- N_min = ${report.thresholds.n_min}`,
    `- Adelantos mínimos: ${report.thresholds.min_lead_events} en ${report.thresholds.min_lead_matches} partidos (${report.thresholds.min_lead_events_each_direction} en cada dirección)`,
    `- Capturas consecutivas para una discrepancia persistente: ${report.thresholds.persistent_discrepancy_captures}`,
    '',
    '## Veredictos por candidata contra la referencia',
    '',
    `**Estado: \`${report.veredictos_por_candidata.estado}\`.** Referencia prevista: ` +
      `\`${report.veredictos_por_candidata.referencia_prevista}\`. Dictamen de ` +
      `\`sdd-legal-datos\`: ${report.veredictos_por_candidata.dictamen}.`,
    '',
    `> ${report.veredictos_por_candidata.motivo}`,
    '',
    '## Veredicto del cruce',
    '',
    pairSection(report),
    '## Advertencia sobre la métrica de conflictos',
    '',
    `> ${report.conflict_metric_warning.text}`,
    '',
    '## Lo que este informe NO responde',
    '',
    ...report.limitaciones_declaradas.map((limit) => `- **${limit.id}** — ${limit.texto}`),
    '',
    '## Retención del archivo',
    '',
    `- ADR: ${report.retencion_del_archivo.adr}`,
    `- Fin de ventana (ancla): \`${report.retencion_del_archivo.fin_de_ventana}\``,
    `- Purga prevista (${report.retencion_del_archivo.plazo_dias} días): \`${report.retencion_del_archivo.purga_prevista}\``,
    `- Purga máxima (${report.retencion_del_archivo.techo_dias} días, techo duro): \`${report.retencion_del_archivo.purga_maxima}\``,
    `- Prórrogas permitidas: ${report.retencion_del_archivo.prorrogas_permitidas}`,
    '',
    `> ${report.retencion_del_archivo.nota}`,
    '',
    '## Resumen',
    '',
    report.prose,
    '',
  ]
    .filter((line, index, all) => !(line === '' && all[index - 1] === ''))
    .join('\n');
}

/** Escribe los dos artefactos de ESTE modo. No toca los de SPEC-002. */
export async function writeReferencelessFindings(
  report: ReferencelessReport,
  root: string,
): Promise<{ readonly markdown: string; readonly json: string }> {
  const markdown = join(root, REFERENCELESS_FINDINGS_MARKDOWN);
  const json = join(root, REFERENCELESS_FINDINGS_JSON);

  await mkdir(dirname(markdown), { recursive: true });
  await writeFile(markdown, renderReferencelessFindings(report), 'utf8');
  await writeFile(json, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  return { markdown, json };
}
