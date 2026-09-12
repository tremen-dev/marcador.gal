/**
 * Latency per chunk (SPEC-019 CA-4): p50 and p95 of the engine's response
 * time, per engine × chunk length × origin, over the exchanges of CA-2; and
 * the CA-4.3 sum «chunk length + p95» against the 60 s of the épica and the
 * 120 s of ADR-021.
 *
 * Percentiles are NEAREST-RANK (the value at ceil(p·n)), so a p95 is always
 * a latency that actually happened, and the verifier can recompute it by
 * sorting the meta files.
 */
import type { ExchangeMeta } from './asr/run.ts';

export const OBSERVATION_BUDGET_S = 60;
export const DECISION_BUDGET_S = 120;

export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) throw new Error('percentile of nothing');
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.max(1, Math.ceil(p * sorted.length));
  return sorted[rank - 1]!;
}

export interface LatencyRow {
  readonly engine: string;
  readonly model: string;
  readonly targetSeconds: number;
  readonly origin: ExchangeMeta['origin'];
  readonly container: string;
  readonly n: number;
  readonly p50Ms: number;
  readonly p95Ms: number;
  readonly minMs: number;
  readonly maxMs: number;
  /** chunk length + p95, in seconds (CA-4.3). */
  readonly chunkPlusP95S: number;
  readonly marginToObservationS: number;
  readonly marginToDecisionS: number;
}

/** Only exchanges the engine ACCEPTED count: a rejection's latency is not a transcription's. */
export function latencyRows(exchanges: readonly ExchangeMeta[]): LatencyRow[] {
  const groups = new Map<string, ExchangeMeta[]>();
  for (const x of exchanges) {
    if (x.outcome === 'rejected') continue;
    const key = `${x.engine}|${x.model}|${x.targetSeconds}|${x.origin}|${x.container}`;
    groups.set(key, [...(groups.get(key) ?? []), x]);
  }
  const rows: LatencyRow[] = [];
  for (const [key, xs] of groups) {
    const [engine, model, target, origin, container] = key.split('|') as [string, string, string, ExchangeMeta['origin'], string];
    const ms = xs.map((x) => x.latencyMs);
    const targetSeconds = Number(target);
    const p95Ms = percentile(ms, 0.95);
    const chunkPlusP95S = targetSeconds + p95Ms / 1000;
    rows.push({
      engine,
      model,
      targetSeconds,
      origin,
      container,
      n: ms.length,
      p50Ms: percentile(ms, 0.5),
      p95Ms,
      minMs: Math.min(...ms),
      maxMs: Math.max(...ms),
      chunkPlusP95S,
      marginToObservationS: OBSERVATION_BUDGET_S - chunkPlusP95S,
      marginToDecisionS: DECISION_BUDGET_S - chunkPlusP95S,
    });
  }
  return rows.sort((a, b) => a.engine.localeCompare(b.engine) || a.targetSeconds - b.targetSeconds || a.origin.localeCompare(b.origin) || a.container.localeCompare(b.container));
}
