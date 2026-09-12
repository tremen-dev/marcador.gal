import { describe, expect, it } from 'vitest';
import type { ExchangeMeta } from '../src/asr/run.ts';
import { kickoffsOfRound, listeningMinutes, projectCost, projectFunctionCost, unionMinutes, wallTimeToEpochMs } from '../src/cost.ts';
import { latencyRows, percentile } from '../src/latency.ts';
import { preferente, terceira } from './fixtures/calendar.ts';

function meta(over: Partial<ExchangeMeta>): ExchangeMeta {
  return {
    sessionId: 's',
    chunkId: 'c',
    targetSeconds: 20,
    chunkDurationSeconds: 20,
    startOffsetSeconds: 0,
    endOffsetSeconds: 20,
    engine: 'google',
    model: 'chirp_2',
    container: 'wav',
    origin: 'laptop',
    sentAt: '2026-09-19T15:00:00.000Z',
    receivedAt: '2026-09-19T15:00:01.000Z',
    latencyMs: 1000,
    status: 200,
    rawKey: 'k',
    transcriptKey: null,
    parameters: {},
    outcome: 'transcribed',
    reason: null,
    ...over,
  };
}

describe('percentile (nearest rank, CA-4)', () => {
  it('p50 and p95 of 1..20 are 10 and 19', () => {
    const v = Array.from({ length: 20 }, (_, i) => i + 1);
    expect(percentile(v, 0.5)).toBe(10);
    expect(percentile(v, 0.95)).toBe(19);
  });

  it('groups by engine × chunk length × origin × container and leaves rejections out', () => {
    const xs = [
      ...Array.from({ length: 20 }, (_, i) => meta({ latencyMs: (i + 1) * 100 })),
      meta({ latencyMs: 99_999, outcome: 'rejected' }),
      meta({ latencyMs: 5000, targetSeconds: 30, origin: 'vercel' }),
    ];
    const rows = latencyRows(xs);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ engine: 'google', targetSeconds: 20, origin: 'laptop', n: 20, p50Ms: 1000, p95Ms: 1900 });
    expect(rows[0]?.chunkPlusP95S).toBeCloseTo(21.9, 6);
    expect(rows[0]?.marginToObservationS).toBeCloseTo(38.1, 6);
    expect(rows[1]).toMatchObject({ targetSeconds: 30, origin: 'vercel', n: 1, p95Ms: 5000, chunkPlusP95S: 35, marginToDecisionS: 85 });
  });
});

describe('cost projection (CA-5.2, CA-5.3)', () => {
  it('unions overlapping intervals', () => {
    expect(unionMinutes([{ startMs: 0, endMs: 60_000 }, { startMs: 30_000, endMs: 120_000 }, { startMs: 300_000, endMs: 360_000 }])).toBe(3);
  });

  it('converts a Europe/Madrid wall time to UTC across DST', () => {
    expect(new Date(wallTimeToEpochMs('2026-09-19 17:00', 'Europe/Madrid')).toISOString()).toBe('2026-09-19T15:00:00.000Z');
    expect(new Date(wallTimeToEpochMs('2026-12-19 17:00', 'Europe/Madrid')).toISOString()).toBe('2026-12-19T16:00:00.000Z');
  });

  it('round 1 of both competitions → union of windows, plus 10 % overlap', () => {
    const { kickoffsMs, used } = kickoffsOfRound([preferente, terceira], 1);
    expect(used).toEqual(['futgal-preferente-g1 2026/27 jornada 1 (3 partidos)', 'terceira-rfef-g1 2026/27 jornada 1 (3 partidos)']);
    const m = listeningMinutes(kickoffsMs);
    // Saturday: 17:00 ×3 and 18:30 → [16:50, 21:00) = 250 min. Sunday: 12:00 → 160 min; 17:00 → 160 min. Total 570.
    expect(m.windowMinutes).toBe(570);
    expect(m.withOverlapMinutes).toBeCloseTo(627, 6);
  });

  it('projects per matchday, épica (2) and season (34)', () => {
    const p = projectCost('google:chirp_2', 0.016, 'list', 627);
    expect(p.perMatchdayUsd).toBeCloseTo(10.032, 6);
    expect(p.perEpicUsd).toBeCloseTo(20.064, 6);
    expect(p.perSeasonUsd).toBeCloseTo(341.088, 6);
  });

  it('projects the function cost at six invocations per hour of window', () => {
    const f = projectFunctionCost(0.01, 570);
    expect(f.invocationsPerMatchday).toBe(57);
    expect(f.perMatchdayUsd).toBeCloseTo(0.57, 6);
  });
});
