/**
 * One listening session (SPEC-019 CA-1): robots.txt archived and obeyed,
 * then the playlist and its segments at the stream's cadence for N minutes,
 * every body archived byte for byte with its sha256 in the name, and a JSON
 * report with what CA-1.1 asks: segments, bytes, seconds of audio, gaps with
 * their instant, start instant, first-segment instant and region.
 *
 * Pure over its dependencies — `fetch`, a clock, a sleeper and an archive —
 * so the same code runs inside the Vercel function (`api/listen.ts`) and on
 * the laptop (`src/cli/listen.ts`), and so a test can drive it with doubles.
 */
import { createHash } from 'node:crypto';
import { type Container, extensionFor, mimeFor, sniffContainer } from './container.ts';
import { type MediaPlaylist, cadenceMs, parsePlaylist, pickVariant } from './hls.ts';
import { robotsUrlOf, robotsVerdict, type RobotsVerdict } from './robots.ts';
import { USER_AGENT } from './user-agent.ts';
import type { Archive } from './archive.ts';

export interface ListenDeps {
  readonly fetch: (url: string, init: { headers: Record<string, string> }) => Promise<{
    readonly status: number;
    readonly bytes: () => Promise<Uint8Array>;
  }>;
  /** Epoch milliseconds. */
  readonly now: () => number;
  readonly sleep: (ms: number) => Promise<void>;
  readonly archive: Archive;
}

export interface ListenOptions {
  readonly playlistUrl: string;
  readonly minutes: number;
  /** Groups everything of this invocation under `sessions/<sessionId>/`. */
  readonly sessionId: string;
  readonly region: string | null;
}

export interface Gap {
  readonly at: string;
  readonly kind: 'sequence-jump' | 'fetch-failed' | 'playlist-failed';
  readonly fromSequence: number | null;
  readonly toSequence: number | null;
  readonly detail: string;
}

export interface ArchivedSegment {
  readonly sequence: number;
  readonly duration: number;
  readonly discontinuity: boolean;
  readonly programDateTime: string | null;
  readonly url: string;
  readonly key: string;
  readonly bytes: number;
  readonly sha256: string;
  readonly fetchedAt: string;
  readonly fetchMs: number;
  /** Seconds of session audio before this segment (sum of previous durations). */
  readonly offsetSeconds: number;
}

export interface ListenReport {
  readonly sessionId: string;
  readonly playlistUrl: string;
  readonly mediaPlaylistUrl: string | null;
  readonly region: string | null;
  readonly userAgent: string;
  readonly invokedAt: string;
  readonly robots: { readonly url: string; readonly key: string | null; readonly verdict: RobotsVerdict };
  readonly container: Container | null;
  readonly targetDurationSeconds: number | null;
  readonly segmentCount: number;
  readonly totalBytes: number;
  readonly audioSeconds: number;
  readonly discontinuities: number;
  readonly gaps: readonly Gap[];
  readonly firstSequence: number | null;
  readonly lastSequence: number | null;
  readonly firstSegmentAt: string | null;
  /** Invocation → first segment archived. */
  readonly startupMs: number | null;
  readonly endedAt: string;
  readonly listenedMs: number;
  readonly playlistRequests: number;
  readonly segmentRequests: number;
  readonly bytesPerAudioMinute: number | null;
  readonly stopReason: 'minutes-elapsed' | 'robots-disallowed' | 'endlist' | 'error';
  readonly error: string | null;
  readonly segmentsKey: string;
}

const HEADERS = { 'user-agent': USER_AGENT };

function iso(ms: number): string {
  return new Date(ms).toISOString();
}

function compact(ms: number): string {
  return iso(ms).replaceAll(/[-:.]/g, '').replace('T', 't').replace('Z', 'z');
}

export function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export async function listenSession(opts: ListenOptions, deps: ListenDeps): Promise<ListenReport> {
  const base = `sessions/${opts.sessionId}`;
  const invoked = deps.now();
  const deadline = invoked + opts.minutes * 60_000;
  const segments: ArchivedSegment[] = [];
  const gaps: Gap[] = [];
  let playlistRequests = 0;
  let segmentRequests = 0;
  let container: Container | null = null;
  let targetDuration: number | null = null;
  let mediaPlaylistUrl: string | null = null;
  let discontinuities = 0;
  let audioSeconds = 0;
  let totalBytes = 0;
  let stopReason: ListenReport['stopReason'] = 'minutes-elapsed';
  let error: string | null = null;

  // ── robots.txt, archived BEFORE the first playlist request (CA-1.2, §3) ──
  const robotsUrl = robotsUrlOf(opts.playlistUrl);
  let robotsKey: string | null = null;
  let verdict: RobotsVerdict;
  try {
    const res = await deps.fetch(robotsUrl, { headers: HEADERS });
    const body = await res.bytes();
    robotsKey = `${base}/robots/${new URL(robotsUrl).host}-${compact(deps.now())}-${res.status}.txt`;
    await deps.archive.put(robotsKey, body, 'text/plain');
    verdict = robotsVerdict({ status: res.status, body: new TextDecoder().decode(body) }, opts.playlistUrl);
  } catch (e) {
    verdict = robotsVerdict({ error: String(e) }, opts.playlistUrl);
  }

  const report = (): ListenReport => {
    const first = segments[0] ?? null;
    return {
      sessionId: opts.sessionId,
      playlistUrl: opts.playlistUrl,
      mediaPlaylistUrl,
      region: opts.region,
      userAgent: USER_AGENT,
      invokedAt: iso(invoked),
      robots: { url: robotsUrl, key: robotsKey, verdict },
      container,
      targetDurationSeconds: targetDuration,
      segmentCount: segments.length,
      totalBytes,
      audioSeconds,
      discontinuities,
      gaps,
      firstSequence: first?.sequence ?? null,
      lastSequence: segments.at(-1)?.sequence ?? null,
      firstSegmentAt: first?.fetchedAt ?? null,
      startupMs: first === null ? null : Date.parse(first.fetchedAt) - invoked,
      endedAt: iso(deps.now()),
      listenedMs: deps.now() - invoked,
      playlistRequests,
      segmentRequests,
      bytesPerAudioMinute: audioSeconds > 0 ? Math.round((totalBytes / audioSeconds) * 60) : null,
      stopReason,
      error,
      segmentsKey: `${base}/segments.json`,
    };
  };

  if (verdict.status === 'disallowed') {
    stopReason = 'robots-disallowed';
    return finish();
  }

  async function fetchPlaylist(url: string): Promise<MediaPlaylist> {
    playlistRequests++;
    const res = await deps.fetch(url, { headers: HEADERS });
    const body = await res.bytes();
    await deps.archive.put(`${base}/playlists/${compact(deps.now())}-${res.status}.m3u8`, body, 'application/vnd.apple.mpegurl');
    if (res.status < 200 || res.status >= 300) throw new Error(`playlist ${url} returned ${res.status}`);
    const playlist = parsePlaylist(new TextDecoder().decode(body), url);
    if (playlist.kind === 'master') {
      const variant = pickVariant(playlist);
      mediaPlaylistUrl = variant.url;
      return fetchPlaylist(variant.url);
    }
    mediaPlaylistUrl = url;
    return playlist;
  }

  async function finish(): Promise<ListenReport> {
    const out = report();
    await deps.archive.put(`${base}/segments.json`, new TextEncoder().encode(JSON.stringify(segments, null, 2)), 'application/json');
    await deps.archive.put(`${base}/listen-${compact(deps.now())}.json`, new TextEncoder().encode(JSON.stringify(out, null, 2)), 'application/json');
    return out;
  }

  let lastSequence: number | null = null;
  try {
    while (deps.now() < deadline) {
      const loadedAt = deps.now();
      let playlist: MediaPlaylist;
      try {
        playlist = await fetchPlaylist(opts.playlistUrl);
      } catch (e) {
        gaps.push({ at: iso(deps.now()), kind: 'playlist-failed', fromSequence: lastSequence, toSequence: null, detail: String(e) });
        await deps.sleep(Math.min(deadline - deps.now(), (targetDuration ?? 5) * 1000));
        continue;
      }
      targetDuration = playlist.targetDuration;

      for (const segment of playlist.segments) {
        if (lastSequence !== null && segment.sequence <= lastSequence) continue;
        if (deps.now() >= deadline) break;
        if (lastSequence !== null && segment.sequence > lastSequence + 1) {
          gaps.push({
            at: iso(deps.now()),
            kind: 'sequence-jump',
            fromSequence: lastSequence,
            toSequence: segment.sequence,
            detail: `${segment.sequence - lastSequence - 1} segment(s) missed between playlist reloads`,
          });
        }
        segmentRequests++;
        const started = deps.now();
        try {
          const res = await deps.fetch(segment.url, { headers: HEADERS });
          if (res.status < 200 || res.status >= 300) throw new Error(`segment ${segment.sequence} returned ${res.status}`);
          const bytes = await res.bytes();
          const fetchedAt = deps.now();
          const digest = sha256(bytes);
          const sniffed = sniffContainer(bytes);
          container ??= sniffed;
          const key = `${base}/segments/${String(segment.sequence).padStart(8, '0')}-${compact(fetchedAt)}-${digest}.${extensionFor(sniffed)}`;
          await deps.archive.put(key, bytes, mimeFor(sniffed));
          if (segment.discontinuity) discontinuities++;
          segments.push({
            sequence: segment.sequence,
            duration: segment.duration,
            discontinuity: segment.discontinuity,
            programDateTime: segment.programDateTime,
            url: segment.url,
            key,
            bytes: bytes.length,
            sha256: digest,
            fetchedAt: iso(fetchedAt),
            fetchMs: fetchedAt - started,
            offsetSeconds: audioSeconds,
          });
          audioSeconds += segment.duration;
          totalBytes += bytes.length;
        } catch (e) {
          gaps.push({ at: iso(deps.now()), kind: 'fetch-failed', fromSequence: segment.sequence, toSequence: segment.sequence, detail: String(e) });
        }
        lastSequence = segment.sequence;
      }

      if (playlist.endList) {
        stopReason = 'endlist';
        break;
      }
      // The stream's cadence, and never faster (RN-11 aclaración 2026-09-12).
      const wait = cadenceMs(playlist) - (deps.now() - loadedAt);
      const remaining = deadline - deps.now();
      if (remaining <= 0) break;
      await deps.sleep(Math.max(0, Math.min(wait, remaining)));
    }
  } catch (e) {
    stopReason = 'error';
    error = String(e);
  }
  return finish();
}
