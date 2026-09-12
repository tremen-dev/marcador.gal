/**
 * The tables of the report (SPEC-019 CA-6.2), generated from `data/` so that
 * every figure in `hallazgos/spike-radio-galega.md` has a file behind it.
 * Pure builders over already-read inputs; `cli/report.ts` does the reading.
 * Output is Markdown the operator pastes into the report.
 */
import type { ExchangeMeta } from './asr/run.ts';
import { type HitRateRow, type WerRow } from './corpus.ts';
import { type CostProjection, LIST_PRICES_USD_PER_MIN, listeningMinutes, projectCost, projectFunctionCost } from './cost.ts';
import { latencyRows } from './latency.ts';
import type { ListenReport } from './listen.ts';

export function table(headers: readonly string[], rows: readonly (readonly (string | number | null)[])[]): string {
  const cell = (v: string | number | null): string => (v === null ? '—' : typeof v === 'number' ? formatNumber(v) : v);
  return [`| ${headers.join(' | ')} |`, `|${headers.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`)].join('\n');
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(Math.abs(n) < 1 ? 4 : 2);
}

// ── CA-1: invocations, and the overlap between two of them ──────────────────

export interface Overlap {
  readonly a: string;
  readonly b: string;
  readonly sharedSequences: number;
  readonly overlapSeconds: number;
  readonly gapSequences: number;
  readonly gapSeconds: number;
}

/** Sequence-number overlap or gap between two invocations (CA-1.3). */
export function overlapBetween(a: ListenReport, b: ListenReport, segmentSeconds: number): Overlap {
  if (a.firstSequence === null || a.lastSequence === null || b.firstSequence === null || b.lastSequence === null) {
    return { a: a.sessionId, b: b.sessionId, sharedSequences: 0, overlapSeconds: 0, gapSequences: 0, gapSeconds: 0 };
  }
  const [first, second] = a.firstSequence <= b.firstSequence ? [a, b] : [b, a];
  const shared = Math.max(0, Math.min(first.lastSequence!, second.lastSequence!) - second.firstSequence! + 1);
  const gap = Math.max(0, second.firstSequence! - first.lastSequence! - 1);
  return {
    a: a.sessionId,
    b: b.sessionId,
    sharedSequences: shared,
    overlapSeconds: shared * segmentSeconds,
    gapSequences: gap,
    gapSeconds: gap * segmentSeconds,
  };
}

export function invocationsTable(reports: readonly ListenReport[]): string {
  return table(
    ['Invocación', 'Región', 'Invocada', 'Arranque (ms)', 'Escucha efectiva (s)', 'Segmentos', 'Audio (s)', 'Bytes', 'Bytes/min audio', 'Huecos', 'Discont.', 'Parada', 'Primera seq', 'Última seq'],
    reports.map((r) => [
      r.sessionId,
      r.region,
      r.invokedAt,
      r.startupMs,
      Math.round(r.listenedMs / 1000),
      r.segmentCount,
      r.audioSeconds,
      r.totalBytes,
      r.bytesPerAudioMinute,
      r.gaps.length,
      r.discontinuities,
      r.stopReason,
      r.firstSequence,
      r.lastSequence,
    ]),
  );
}

export function gapsTable(reports: readonly ListenReport[]): string {
  const rows = reports.flatMap((r) => r.gaps.map((g) => [r.sessionId, g.at, g.kind, g.fromSequence, g.toSequence, g.detail] as const));
  return rows.length === 0 ? '_Sin huecos._' : table(['Invocación', 'Instante', 'Tipo', 'Desde seq', 'Hasta seq', 'Detalle'], rows);
}

export function overlapTable(reports: readonly ListenReport[]): string {
  const rows: (string | number | null)[][] = [];
  for (let i = 0; i < reports.length; i++) {
    for (let j = i + 1; j < reports.length; j++) {
      const a = reports[i]!;
      const b = reports[j]!;
      const o = overlapBetween(a, b, a.targetDurationSeconds ?? b.targetDurationSeconds ?? 0);
      rows.push([o.a, o.b, o.sharedSequences, o.overlapSeconds, o.gapSequences, o.gapSeconds]);
    }
  }
  return rows.length === 0 ? '_Una sola invocación: sin solape que medir._' : table(['A', 'B', 'Segmentos compartidos', 'Solape (s)', 'Segmentos de hueco', 'Hueco (s)'], rows);
}

// ── CA-2: engine × container ────────────────────────────────────────────────

export function containerTable(exchanges: readonly ExchangeMeta[]): string {
  const groups = new Map<string, { accepted: number; rejected: number; empty: number; reasons: Set<string> }>();
  for (const x of exchanges) {
    const k = `${x.engine}|${x.model}|${x.container}`;
    const g = groups.get(k) ?? { accepted: 0, rejected: 0, empty: 0, reasons: new Set<string>() };
    if (x.outcome === 'transcribed') g.accepted++;
    else if (x.outcome === 'empty') g.empty++;
    else {
      g.rejected++;
      if (x.reason !== null) g.reasons.add(x.reason.slice(0, 120));
    }
    groups.set(k, g);
  }
  const rows = [...groups.entries()].sort().map(([k, g]) => {
    const [engine, model, container] = k.split('|');
    const verdict = g.accepted > 0 && g.rejected === 0 && g.empty === 0 ? 'aceptado' : g.accepted === 0 && g.rejected > 0 ? 'rechazado' : g.accepted === 0 && g.empty > 0 ? 'aceptado pero vacío' : 'mixto';
    return [`${engine} (${model})`, container ?? '', verdict, g.accepted, g.empty, g.rejected, [...g.reasons].join('; ') || null];
  });
  return table(['Motor', 'Contenedor', 'Veredicto', 'Transcritos', 'Vacíos', 'Rechazados', 'Motivo (tal como lo devolvió el motor)'], rows);
}

export function parametersTable(exchanges: readonly ExchangeMeta[]): string {
  const seen = new Map<string, string>();
  for (const x of exchanges) {
    const k = `${x.engine} (${x.model}) · ${x.container}`;
    if (!seen.has(k)) seen.set(k, JSON.stringify(x.parameters));
  }
  return table(['Motor · contenedor', 'Parámetros exactos enviados (sin credenciales)'], [...seen.entries()].map(([k, v]) => [k, `\`${v}\``]));
}

// ── CA-3 ────────────────────────────────────────────────────────────────────

export function hitRateTable(rows: readonly HitRateRow[]): string {
  return table(
    ['Motor', 'Trozo (s)', 'Contenedor', 'Frases', 'Con marcador explícito', 'Sin marcador explícito', 'Aciertos (equipos+marcador)', 'Tasa', 'Solo equipos', 'Solo marcador', 'Ninguno', 'Sin transcripción', 'Equipos reconocibles (tasa)'],
    rows.map((r) => [r.engine, r.targetSeconds, r.container, r.phrases, r.withExplicitScore, r.withoutExplicitScore, r.hits, r.hitRate === null ? null : `${(r.hitRate * 100).toFixed(1)} %`, r.teamsOnly, r.scoreOnly, r.neither, r.noTranscript, r.teamsRate === null ? null : `${(r.teamsRate * 100).toFixed(1)} %`]),
  );
}

export function werTable(rows: readonly WerRow[]): string {
  return table(
    ['Motor', 'Trozo (s)', 'Contenedor', 'Trozos cubiertos', 'Trozos sin transcripción', 'Palabras de referencia', 'S', 'I', 'D', 'WER'],
    rows.map((r) => [r.engine, r.targetSeconds, r.container, r.chunksCovered, r.chunksMissing, r.result?.referenceWords ?? null, r.result?.substitutions ?? null, r.result?.insertions ?? null, r.result?.deletions ?? null, r.result === null ? null : `${(r.result.wer * 100).toFixed(1)} %`]),
  );
}

// ── CA-4 ────────────────────────────────────────────────────────────────────

export function latencyTable(exchanges: readonly ExchangeMeta[]): string {
  return table(
    ['Motor', 'Trozo (s)', 'Origen', 'Contenedor', 'n', 'p50 (ms)', 'p95 (ms)', 'mín', 'máx', 'trozo + p95 (s)', 'Margen a 60 s', 'Margen a 120 s'],
    latencyRows(exchanges).map((r) => [`${r.engine} (${r.model})`, r.targetSeconds, r.origin, r.container, r.n, r.p50Ms, r.p95Ms, r.minMs, r.maxMs, r.chunkPlusP95S, r.marginToObservationS, r.marginToDecisionS]),
  );
}

// ── CA-5 ────────────────────────────────────────────────────────────────────

export interface MeasuredCosts {
  /** engine key (`google:chirp_2`) → { usdPerMinute, consultedOn, evidence } read from the billing panel AFTER the session. */
  readonly engines: Readonly<Record<string, { readonly usdPerMinute: number; readonly consultedOn: string; readonly evidence: string }>>;
  /** Vercel: USD per 11-minute invocation, from the usage panel of the temporary project. */
  readonly functionUsdPerInvocation: number | null;
  readonly functionEvidence: string | null;
}

export function priceTable(measured: MeasuredCosts): string {
  const keys = new Set([...Object.keys(LIST_PRICES_USD_PER_MIN), ...Object.keys(measured.engines)]);
  return table(
    ['Motor', 'Precio de lista ($/min, 2026-09-12)', 'Nota', 'Medido ($/min)', 'Consultado', 'Evidencia', '¿Coinciden?'],
    [...keys].sort().map((k) => {
      const list = (LIST_PRICES_USD_PER_MIN as Record<string, { price: number; note: string }>)[k];
      const m = measured.engines[k];
      const match = list === undefined || m === undefined ? null : Math.abs(list.price - m.usdPerMinute) < 1e-9 ? 'sí' : 'no';
      return [k, list?.price ?? null, list?.note || null, m?.usdPerMinute ?? null, m?.consultedOn ?? null, m?.evidence ?? null, match];
    }),
  );
}

export function projectionTable(kickoffsMs: readonly number[], used: readonly string[], measured: MeasuredCosts): string {
  const minutes = listeningMinutes(kickoffsMs);
  const projections: CostProjection[] = [];
  for (const [k, v] of Object.entries(LIST_PRICES_USD_PER_MIN)) {
    const m = measured.engines[k];
    projections.push(m === undefined ? projectCost(k, v.price, 'list', minutes.withOverlapMinutes) : projectCost(k, m.usdPerMinute, 'measured', minutes.withOverlapMinutes));
  }
  const head = [
    `Jornada usada: ${used.join(' + ') || '(ningún calendario cargado)'}.`,
    `Minutos de ventana (unión de [kickoff − 10, kickoff + 150)): **${minutes.windowMinutes.toFixed(0)}**; con el 10 % de solape de ADR-029 §3: **${minutes.withOverlapMinutes.toFixed(0)}**.`,
  ].join('\n');
  const body = table(
    ['Motor', '$/min', 'Origen del precio', 'Por jornada ($)', 'Dos jornadas de la épica ($)', 'Temporada, 34 jornadas ($)'],
    projections.map((p) => [p.engine, p.usdPerMinute, p.source === 'measured' ? 'medido' : 'lista', p.perMatchdayUsd, p.perEpicUsd, p.perSeasonUsd]),
  );
  const fn =
    measured.functionUsdPerInvocation === null
      ? '_Coste de la función: sin cifra del panel de Vercel todavía (CA-5.3)._'
      : (() => {
          const f = projectFunctionCost(measured.functionUsdPerInvocation, minutes.windowMinutes);
          return `Función (CA-5.3): ${measured.functionUsdPerInvocation} $ por invocación de 11 min (${measured.functionEvidence ?? 'sin evidencia citada'}); ${f.invocationsPerMatchday} invocaciones por jornada → ${f.perMatchdayUsd.toFixed(2)} $ por jornada, ${f.perSeasonUsd.toFixed(2)} $ por temporada.`;
        })();
  return `${head}\n\n${body}\n\n${fn}`;
}
