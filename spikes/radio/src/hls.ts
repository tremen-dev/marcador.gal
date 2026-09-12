/**
 * HLS playlists (RFC 8216), the little of them the spike needs (SPEC-019 CA-1).
 *
 * Two kinds: a MASTER playlist lists variants (`#EXT-X-STREAM-INF`); a MEDIA
 * playlist lists segments (`#EXTINF`). The stream is consumed AT ITS OWN
 * CADENCE (RN-11, aclaración 2026-09-12; ADR-028 §9): the playlist is reloaded
 * no more often than `#EXT-X-TARGETDURATION` says, and never more than one
 * playlist per segment. `cadenceMs()` is that rule as a number.
 */

export interface MediaSegment {
  /** Media sequence number of this segment (monotonic per stream). */
  readonly sequence: number;
  /** Declared duration in seconds (`#EXTINF`). */
  readonly duration: number;
  /** Absolute URL. */
  readonly url: string;
  /** `#EXT-X-DISCONTINUITY` precedes this segment. */
  readonly discontinuity: boolean;
  /** `#EXT-X-PROGRAM-DATE-TIME`, if the playlist carries it. */
  readonly programDateTime: string | null;
}

export interface MediaPlaylist {
  readonly kind: 'media';
  readonly targetDuration: number;
  readonly mediaSequence: number;
  readonly discontinuitySequence: number;
  readonly endList: boolean;
  readonly segments: readonly MediaSegment[];
}

export interface Variant {
  readonly url: string;
  readonly bandwidth: number | null;
  readonly codecs: string | null;
}

export interface MasterPlaylist {
  readonly kind: 'master';
  readonly variants: readonly Variant[];
}

export type Playlist = MediaPlaylist | MasterPlaylist;

export function parsePlaylist(text: string, baseUrl: string): Playlist {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  if (lines[0] !== '#EXTM3U') throw new Error('hls: not an M3U8 playlist (missing #EXTM3U)');
  if (lines.some((l) => l.startsWith('#EXT-X-STREAM-INF'))) return parseMaster(lines, baseUrl);
  return parseMedia(lines, baseUrl);
}

function parseMaster(lines: readonly string[], baseUrl: string): MasterPlaylist {
  const variants: Variant[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (!line.startsWith('#EXT-X-STREAM-INF:')) continue;
    const attrs = parseAttributes(line.slice('#EXT-X-STREAM-INF:'.length));
    const next = lines.slice(i + 1).find((l) => l.length > 0 && !l.startsWith('#'));
    if (next === undefined) continue;
    const bandwidth = attrs.get('BANDWIDTH');
    variants.push({
      url: new URL(next, baseUrl).toString(),
      bandwidth: bandwidth === undefined ? null : Number(bandwidth),
      codecs: attrs.get('CODECS') ?? null,
    });
  }
  return { kind: 'master', variants };
}

function parseMedia(lines: readonly string[], baseUrl: string): MediaPlaylist {
  let targetDuration = 0;
  let mediaSequence = 0;
  let discontinuitySequence = 0;
  let endList = false;
  const segments: MediaSegment[] = [];
  let pendingDuration: number | null = null;
  let pendingDiscontinuity = false;
  let pendingPdt: string | null = null;

  for (const line of lines) {
    if (line.startsWith('#EXT-X-TARGETDURATION:')) targetDuration = Number(line.split(':')[1]);
    else if (line.startsWith('#EXT-X-MEDIA-SEQUENCE:')) mediaSequence = Number(line.split(':')[1]);
    else if (line.startsWith('#EXT-X-DISCONTINUITY-SEQUENCE:')) discontinuitySequence = Number(line.split(':')[1]);
    else if (line === '#EXT-X-ENDLIST') endList = true;
    else if (line === '#EXT-X-DISCONTINUITY') pendingDiscontinuity = true;
    else if (line.startsWith('#EXT-X-PROGRAM-DATE-TIME:')) pendingPdt = line.slice('#EXT-X-PROGRAM-DATE-TIME:'.length);
    else if (line.startsWith('#EXTINF:')) {
      const value = line.slice('#EXTINF:'.length).split(',')[0] ?? '0';
      pendingDuration = Number(value);
    } else if (line.length > 0 && !line.startsWith('#')) {
      if (pendingDuration === null) continue;
      segments.push({
        sequence: mediaSequence + segments.length,
        duration: pendingDuration,
        url: new URL(line, baseUrl).toString(),
        discontinuity: pendingDiscontinuity,
        programDateTime: pendingPdt,
      });
      pendingDuration = null;
      pendingDiscontinuity = false;
      pendingPdt = null;
    }
  }
  if (targetDuration <= 0) throw new Error('hls: media playlist without #EXT-X-TARGETDURATION');
  return { kind: 'media', targetDuration, mediaSequence, discontinuitySequence, endList, segments };
}

function parseAttributes(text: string): Map<string, string> {
  const out = new Map<string, string>();
  const re = /([A-Z0-9-]+)=("([^"]*)"|[^,]*)/g;
  for (const m of text.matchAll(re)) out.set(m[1]!, m[3] ?? m[2] ?? '');
  return out;
}

/**
 * How long to wait before reloading the playlist: the target duration, in
 * ms. RFC 8216 §6.3.4 allows reloading sooner when the playlist did not
 * change; we do NOT, so that there is never more than one playlist request
 * per segment (RN-11 aclaración 2026-09-12).
 */
export function cadenceMs(playlist: MediaPlaylist): number {
  return Math.max(1, playlist.targetDuration) * 1000;
}

/** The variant to follow from a master playlist: the lowest bandwidth audio. */
export function pickVariant(master: MasterPlaylist): Variant {
  const sorted = [...master.variants].sort((a, b) => (a.bandwidth ?? Infinity) - (b.bandwidth ?? Infinity));
  const first = sorted[0];
  if (first === undefined) throw new Error('hls: master playlist without variants');
  return first;
}
