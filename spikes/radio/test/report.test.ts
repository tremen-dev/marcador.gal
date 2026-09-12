import { describe, expect, it } from 'vitest';
import type { ListenReport } from '../src/listen.ts';
import { containerTable, overlapBetween, priceTable, projectionTable, table } from '../src/report.ts';
import type { ExchangeMeta } from '../src/asr/run.ts';
import { matchday } from './fixtures/matchday.ts';

function report(sessionId: string, first: number, last: number): ListenReport {
  return {
    sessionId,
    playlistUrl: 'u',
    mediaPlaylistUrl: null,
    region: 'fra1',
    userAgent: 'ua',
    invokedAt: '2026-09-19T15:00:00.000Z',
    robots: { url: 'r', key: null, verdict: { status: 'allowed', httpStatus: 200, reason: '' } },
    container: 'mpeg-ts',
    targetDurationSeconds: 10,
    segmentCount: last - first + 1,
    totalBytes: 0,
    audioSeconds: (last - first + 1) * 10,
    discontinuities: 0,
    gaps: [],
    firstSequence: first,
    lastSequence: last,
    firstSegmentAt: null,
    startupMs: 1200,
    endedAt: '',
    listenedMs: 660_000,
    playlistRequests: 0,
    segmentRequests: 0,
    bytesPerAudioMinute: null,
    stopReason: 'minutes-elapsed',
    error: null,
    segmentsKey: '',
  };
}

describe('overlapBetween (CA-1.3)', () => {
  it('measures shared sequences as overlap seconds', () => {
    const o = overlapBetween(report('a', 100, 165), report('b', 160, 225), 10);
    expect(o).toMatchObject({ sharedSequences: 6, overlapSeconds: 60, gapSequences: 0, gapSeconds: 0 });
  });

  it('measures a hole as gap seconds', () => {
    const o = overlapBetween(report('b', 170, 225), report('a', 100, 165), 10);
    expect(o).toMatchObject({ sharedSequences: 0, overlapSeconds: 0, gapSequences: 4, gapSeconds: 40 });
  });
});

describe('tables', () => {
  it('renders markdown with — for null', () => {
    expect(table(['a', 'b'], [[1, null]])).toBe('| a | b |\n|---|---|\n| 1 | — |');
  });

  it('engine × container verdicts (CA-2.1)', () => {
    const base: ExchangeMeta = {
      sessionId: 's', chunkId: 'c', targetSeconds: 20, chunkDurationSeconds: 20, startOffsetSeconds: 0, endOffsetSeconds: 20,
      engine: 'google', model: 'chirp_2', container: 'mpeg-ts', origin: 'laptop', sentAt: '', receivedAt: '', latencyMs: 1, status: 400,
      rawKey: 'k', transcriptKey: null, parameters: {}, outcome: 'rejected', reason: 'HTTP 400 INVALID_ARGUMENT: bad audio',
    };
    const t = containerTable([base, { ...base, container: 'wav', status: 200, outcome: 'transcribed', reason: null }]);
    expect(t).toContain('| google (chirp_2) | mpeg-ts | rechazado | 0 | 0 | 1 | HTTP 400 INVALID_ARGUMENT: bad audio |');
    expect(t).toContain('| google (chirp_2) | wav | aceptado | 1 | 0 | 0 | — |');
  });

  it('prices: list vs measured, saying whether they match (CA-5.1)', () => {
    const t = priceTable({ engines: { 'google:chirp_2': { usdPerMinute: 0.016, consultedOn: '2026-09-20', evidence: 'data/costs/google.png' } }, functionUsdPerInvocation: null, functionEvidence: null });
    expect(t).toContain('| google:chirp_2 | 0.0160 | 60 min gratis al mes y 300 $ de crédito inicial | 0.0160 | 2026-09-20 | data/costs/google.png | sí |');
    expect(t).toContain('| openai:gpt-4o-transcribe | 0.0060 | — | — | — | — | — |');
  });

  it('projection is marked as an estimate, names the hand-written matchday, its source and the minutes with overlap (CA-5.2)', () => {
    const t = projectionTable(matchday, { engines: {}, functionUsdPerInvocation: 0.01, functionEvidence: 'data/costs/vercel.png' });
    expect(t).toContain('**Estimación**');
    expect(t).toContain('futgal-preferente-g1 xornada 3 (3 partidos) + terceira-rfef-g1 xornada 3 (3 partidos)');
    expect(t).toContain('https://example.invalid/rfgf/xornada-3');
    expect(t).toContain('consultada el 2026-09-13');
    // The list is copied whole into the report: every match with its kickoff.
    expect(t).toContain('| futgal-preferente-g1 | Sintético A – Sintético B | 2026-09-19 17:00 |');
    expect(t).toContain('| terceira-rfef-g1 | Sintético K – Sintético L | 2026-09-20 17:00 |');
    expect(t).toContain('**570**');
    expect(t).toContain('**627**');
    expect(t).toContain('| google:chirp_2 | 0.0160 | lista | 10.03 | 20.06 | 341.09 |');
    expect(t).toContain('57 invocaciones por jornada');
  });
});
