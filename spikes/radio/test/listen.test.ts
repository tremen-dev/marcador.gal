/**
 * CA-1 driven with doubles: a fake stream that advances one segment per
 * target duration, a fake clock, and an in-memory archive that records the
 * ORDER of writes. Everything synthetic (ADR-009 §3).
 */
import { describe, expect, it } from 'vitest';
import { memoryArchive } from '../src/archive.ts';
import { listenSession, type ListenDeps } from '../src/listen.ts';
import { USER_AGENT } from '../src/user-agent.ts';
import { MASTER, mediaPlaylist } from './fixtures/playlists.ts';

const PLAYLIST = 'https://stream.example.test/radio/playlist.m3u8';
const T0 = Date.parse('2026-09-19T15:00:00.000Z');

function tsSegment(seq: number): Uint8Array {
  const bytes = new Uint8Array(188 * 4);
  for (let i = 0; i < 4; i++) bytes[188 * i] = 0x47;
  bytes[1] = seq & 0xff; // makes each segment's digest distinct
  return bytes;
}

interface FakeStream {
  robots: { status: number; body: string } | 'error';
  /** sequence → present? Missing ones fail with 404. */
  missing: Set<number>;
  /** How the playlist window advances with the clock. */
  window: (nowMs: number) => { first: number; count: number };
  master: boolean;
  jumpAfter?: { sequence: number; skip: number };
}

function fakeDeps(stream: FakeStream) {
  let now = T0;
  const archive = memoryArchive();
  const requests: { url: string; ua: string; at: number }[] = [];
  const sleeps: number[] = [];
  const deps: ListenDeps = {
    now: () => now,
    sleep: async (ms) => {
      sleeps.push(ms);
      now += ms;
    },
    archive,
    fetch: async (url, init) => {
      requests.push({ url, ua: init.headers['user-agent'] ?? '', at: now });
      now += 50; // every request costs 50 ms
      const text = (status: number, body: string) => ({ status, bytes: async () => new TextEncoder().encode(body) });
      if (url.endsWith('/robots.txt')) {
        if (stream.robots === 'error') throw new Error('ECONNREFUSED');
        return text(stream.robots.status, stream.robots.body);
      }
      if (url === PLAYLIST && stream.master) return text(200, MASTER);
      if (url.endsWith('.m3u8')) {
        let { first, count } = stream.window(now);
        if (stream.jumpAfter !== undefined && first > stream.jumpAfter.sequence) first += stream.jumpAfter.skip;
        return text(200, mediaPlaylist(first, count));
      }
      const m = /seg-(\d+)\.ts$/.exec(url);
      const seq = Number(m?.[1]);
      if (stream.missing.has(seq)) return { status: 404, bytes: async () => new Uint8Array() };
      return { status: 200, bytes: async () => tsSegment(seq) };
    },
  };
  return { deps, archive, requests, sleeps };
}

const allowAll = { status: 200, body: 'User-agent: *\nDisallow: /nada/\n' };
/** Three-segment window; a new segment every 10 s. */
const advancing = (nowMs: number) => ({ first: 100 + Math.floor((nowMs - T0) / 10_000), count: 3 });

describe('listenSession (CA-1)', () => {
  it('archives robots.txt before the first playlist and the first segment (CA-1.2, §3)', async () => {
    const { deps, archive } = fakeDeps({ robots: allowAll, missing: new Set(), window: advancing, master: false });
    await listenSession({ playlistUrl: PLAYLIST, minutes: 1, sessionId: 's1', region: 'fra1' }, deps);
    expect(archive.writes[0]).toMatch(/^sessions\/s1\/robots\/stream\.example\.test-.*-200\.txt$/);
    expect(archive.writes[1]).toMatch(/^sessions\/s1\/playlists\//);
    expect(archive.writes[2]).toMatch(/^sessions\/s1\/segments\/00000100-.*-[0-9a-f]{64}\.ts$/);
  });

  it('stops without asking for the playlist when robots.txt disallows the path (fail closed)', async () => {
    const { deps, requests } = fakeDeps({
      robots: { status: 200, body: 'User-agent: *\nDisallow: /radio/\n' },
      missing: new Set(),
      window: advancing,
      master: false,
    });
    const r = await listenSession({ playlistUrl: PLAYLIST, minutes: 1, sessionId: 's2', region: null }, deps);
    expect(r.stopReason).toBe('robots-disallowed');
    expect(r.segmentCount).toBe(0);
    expect(requests.map((q) => q.url)).toEqual(['https://stream.example.test/robots.txt']);
  });

  it('a robots.txt that cannot be fetched also stops the session', async () => {
    const { deps } = fakeDeps({ robots: 'error', missing: new Set(), window: advancing, master: false });
    const r = await listenSession({ playlistUrl: PLAYLIST, minutes: 1, sessionId: 's3', region: null }, deps);
    expect(r.stopReason).toBe('robots-disallowed');
    expect(r.robots.verdict.reason).toMatch(/unreachable/);
  });

  it('sends the User-Agent of ADR-011 on every request', async () => {
    const { deps, requests } = fakeDeps({ robots: allowAll, missing: new Set(), window: advancing, master: false });
    await listenSession({ playlistUrl: PLAYLIST, minutes: 1, sessionId: 's4', region: null }, deps);
    expect(requests.length).toBeGreaterThan(3);
    expect(new Set(requests.map((q) => q.ua))).toEqual(new Set([USER_AGENT]));
  });

  it('follows the stream at its cadence: sleeps the target duration, one playlist per segment (RN-11)', async () => {
    const { deps, sleeps } = fakeDeps({ robots: allowAll, missing: new Set(), window: advancing, master: false });
    const r = await listenSession({ playlistUrl: PLAYLIST, minutes: 1, sessionId: 's5', region: null }, deps);
    // 60 s of listening at a 10 s cadence: 3 segments in the first window, then one new per reload.
    expect(r.stopReason).toBe('minutes-elapsed');
    expect(r.segmentCount).toBe(3 + 5);
    expect(r.playlistRequests).toBeLessThanOrEqual(r.segmentCount);
    for (const ms of sleeps.slice(0, -1)) expect(ms).toBeGreaterThanOrEqual(10_000 - 500);
    expect(r.audioSeconds).toBe(80);
    expect(r.firstSequence).toBe(100);
    expect(r.lastSequence).toBe(107);
    expect(r.gaps).toEqual([]);
    expect(r.container).toBe('mpeg-ts');
    expect(r.startupMs).toBeGreaterThan(0);
    expect(r.bytesPerAudioMinute).toBe(Math.round((r.totalBytes / 80) * 60));
    expect(r.region).toBeNull();
  });

  it('follows a master playlist into its lowest-bandwidth variant', async () => {
    const { deps } = fakeDeps({ robots: allowAll, missing: new Set(), window: advancing, master: true });
    const r = await listenSession({ playlistUrl: PLAYLIST, minutes: 0.5, sessionId: 's6', region: null }, deps);
    expect(r.mediaPlaylistUrl).toBe('https://stream.example.test/radio/lo/playlist.m3u8');
    expect(r.segmentCount).toBeGreaterThan(0);
  });

  it('records a failed segment as a gap with its instant, and a sequence jump too (CA-1.1)', async () => {
    const { deps } = fakeDeps({
      robots: allowAll,
      missing: new Set([101]),
      window: advancing,
      master: false,
      jumpAfter: { sequence: 102, skip: 4 },
    });
    const r = await listenSession({ playlistUrl: PLAYLIST, minutes: 1, sessionId: 's7', region: null }, deps);
    const kinds = r.gaps.map((g) => g.kind);
    expect(kinds).toContain('fetch-failed');
    expect(kinds).toContain('sequence-jump');
    const jump = r.gaps.find((g) => g.kind === 'sequence-jump');
    expect(jump).toMatchObject({ fromSequence: 104, toSequence: 107 });
    expect(Date.parse(jump!.at)).toBeGreaterThan(T0);
  });

  it('writes the segment index and the report JSON into the archive at the end', async () => {
    const { deps, archive } = fakeDeps({ robots: allowAll, missing: new Set(), window: advancing, master: false });
    const r = await listenSession({ playlistUrl: PLAYLIST, minutes: 0.5, sessionId: 's8', region: null }, deps);
    const index = JSON.parse(new TextDecoder().decode((await archive.get(r.segmentsKey))!)) as { sequence: number; sha256: string; key: string }[];
    expect(index).toHaveLength(r.segmentCount);
    for (const s of index) expect(s.key).toContain(s.sha256);
    expect((await archive.list('sessions/s8/listen-')).length).toBe(1);
  });
});
