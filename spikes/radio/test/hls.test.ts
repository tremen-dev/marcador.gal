import { describe, expect, it } from 'vitest';
import { cadenceMs, parsePlaylist, pickVariant } from '../src/hls.ts';
import { MASTER, mediaPlaylist } from './fixtures/playlists.ts';

const BASE = 'https://stream.example.test/radio/playlist.m3u8';

describe('parsePlaylist', () => {
  it('reads a master playlist and resolves variant URLs', () => {
    const p = parsePlaylist(MASTER, BASE);
    expect(p.kind).toBe('master');
    if (p.kind !== 'master') return;
    expect(p.variants).toHaveLength(2);
    expect(p.variants[0]).toEqual({
      url: 'https://stream.example.test/radio/hi/playlist.m3u8',
      bandwidth: 128000,
      codecs: 'mp4a.40.2',
    });
    expect(pickVariant(p).bandwidth).toBe(64000);
  });

  it('reads a media playlist: sequence numbers, durations, discontinuity, PDT', () => {
    const p = parsePlaylist(mediaPlaylist(100, 3, { discontinuityAt: 101, pdt: '2026-09-19T15:00:00.000Z' }), BASE);
    expect(p.kind).toBe('media');
    if (p.kind !== 'media') return;
    expect(p.targetDuration).toBe(10);
    expect(p.mediaSequence).toBe(100);
    expect(p.segments.map((s) => s.sequence)).toEqual([100, 101, 102]);
    expect(p.segments.map((s) => s.discontinuity)).toEqual([false, true, false]);
    expect(p.segments[0]?.programDateTime).toBe('2026-09-19T15:00:00.000Z');
    expect(p.segments[0]?.url).toBe('https://stream.example.test/radio/seg-100.ts');
    expect(p.segments.reduce((a, s) => a + s.duration, 0)).toBe(30);
  });

  it('refuses something that is not an M3U8', () => {
    expect(() => parsePlaylist('<html>', BASE)).toThrow(/EXTM3U/);
  });

  it('cadence is the target duration, never faster (RN-11 aclaración 2026-09-12)', () => {
    const p = parsePlaylist(mediaPlaylist(1, 1), BASE);
    if (p.kind !== 'media') throw new Error('media expected');
    expect(cadenceMs(p)).toBe(10_000);
  });
});
