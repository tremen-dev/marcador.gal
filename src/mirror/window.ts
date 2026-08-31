/**
 * The record of what phase A actually managed to capture (CA-5).
 *
 * This module is shared by both phases and belongs to neither: phase A writes
 * it, phase B reads it before it dares say anything. It contains no parsing —
 * see CA-3 — so importing it from the capturer does not put phase B's
 * extractor anywhere near phase A.
 *
 * Why the window log exists at all: if one source loses twenty minutes and the
 * other does not, futgal "leads" on every event of those twenty minutes. A
 * network outage would read as proof of mirroring. So an incomplete window
 * does not get a verdict.
 */
import type { CompetitionId, Instant, SourceId } from '@/model/ids';

/** What happened to one attempt on one pair. */
export type TickOutcome = 'ok' | 'failed' | 'skipped';

export interface TickRecord {
  readonly source: SourceId;
  readonly competition_id: CompetitionId;
  readonly at: Instant;
  readonly outcome: TickOutcome;
  /** Why it was skipped or why it failed. `null` for `ok`. */
  readonly reason: string | null;
  /** The archive key, for `ok`. `null` otherwise. */
  readonly raw_ref: string | null;
}

export interface WindowLog {
  readonly ticks: readonly TickRecord[];
}

/**
 * A pair below this share of successful ticks invalidates the whole window.
 * Declared hypothesis (§5): 90 % of an hour is six lost minutes, which is
 * about the most that can be lost before the gaps start manufacturing leads.
 */
export const MIN_TICK_SUCCESS_RATIO = 0.9;

export interface PairCoverage {
  readonly source: SourceId;
  readonly competition_id: CompetitionId;
  readonly ok: number;
  readonly failed: number;
  readonly skipped: number;
  readonly attempted: number;
  /** `ok / attempted`, or 0 for a pair that was never attempted. */
  readonly ratio: number;
}

/** Coverage per pair, ordered by ratio and then by pair, so it is stable. */
export function windowCoverage(log: WindowLog): readonly PairCoverage[] {
  const byPair = new Map<string, { source: SourceId; competition_id: CompetitionId; ok: number; failed: number; skipped: number }>();

  for (const tick of log.ticks) {
    const key = `${tick.source}/${tick.competition_id}`;
    const entry = byPair.get(key) ?? {
      source: tick.source,
      competition_id: tick.competition_id,
      ok: 0,
      failed: 0,
      skipped: 0,
    };
    entry[tick.outcome] += 1;
    byPair.set(key, entry);
  }

  return [...byPair.entries()]
    .map(([key, entry]) => {
      const attempted = entry.ok + entry.failed + entry.skipped;
      return {
        source: entry.source,
        competition_id: entry.competition_id,
        ok: entry.ok,
        failed: entry.failed,
        skipped: entry.skipped,
        attempted,
        ratio: attempted === 0 ? 0 : entry.ok / attempted,
        key,
      };
    })
    .sort((a, b) => a.ratio - b.ratio || a.key.localeCompare(b.key))
    .map(({ key: _key, ...pair }) => pair);
}

export interface WindowValidity {
  readonly valid: boolean;
  readonly coverage: readonly PairCoverage[];
  /** The pairs that fell below the threshold. Empty when valid. */
  readonly below: readonly PairCoverage[];
}

/**
 * The WORST pair decides, never the average: a 100 % source next to a 50 % one
 * averages 75 % and looks survivable, and it is precisely the case that
 * fabricates leads out of an outage (CA-5, case 3).
 */
export function windowValidity(log: WindowLog): WindowValidity {
  const coverage = windowCoverage(log);
  const below = coverage.filter((pair) => pair.ratio < MIN_TICK_SUCCESS_RATIO);
  return { valid: coverage.length > 0 && below.length === 0, coverage, below };
}

/**
 * Thrown by phase B when asked to judge a window that is not fit to judge.
 *
 * The refusal is not mute (CA-5, enmienda 2026-08-31 §6). It carries the
 * coverage of EVERY pair and not only of the ones that fell below the
 * threshold, plus the threshold itself, because what the operator has to
 * decide is not "which pair broke" but "is the whole hour to be repeated" —
 * and five healthy pairs next to one at 50 % is a different situation from six
 * at 50 %. It reads as a table, worst pair first, because that is the pair
 * that decided.
 */
export class InvalidWindowError extends Error {
  override readonly name = 'InvalidWindowError';
  readonly below: readonly PairCoverage[];
  /** Every (source, competition) pair of the window, worst ratio first. */
  readonly coverage: readonly PairCoverage[];

  constructor(below: readonly PairCoverage[], coverage: readonly PairCoverage[]) {
    const threshold = `${(MIN_TICK_SUCCESS_RATIO * 100).toFixed(0)} %`;
    const detail =
      coverage.length === 0
        ? 'the window has no ticks at all'
        : `${below.length} of ${coverage.length} (source, competition) pairs below the required ` +
          `${threshold} of successful ticks. Coverage of every pair: ` +
          coverage
            .map(
              (pair) =>
                `${pair.source}/${pair.competition_id} at ${(pair.ratio * 100).toFixed(1)} % ` +
                `(${pair.ok}/${pair.attempted}) ${pair.ratio < MIN_TICK_SUCCESS_RATIO ? 'BELOW' : 'ok'}`,
            )
            .join('; ');
    super(`CA-5: refusing to judge an invalid window — ${detail}`);
    this.below = below;
    this.coverage = coverage;
  }
}

/** Phase B calls this before anything else. It refuses; it does not guess. */
export function assertWindowValid(log: WindowLog): void {
  const validity = windowValidity(log);
  if (!validity.valid) throw new InvalidWindowError(validity.below, validity.coverage);
}
