/** SYNTHETIC playlists (ADR-009 §3). No real host, no real segment. */

export const MASTER = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=128000,CODECS="mp4a.40.2"
hi/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=64000,CODECS="mp4a.40.2"
lo/playlist.m3u8
`;

export function mediaPlaylist(mediaSequence: number, count: number, opts: { discontinuityAt?: number; pdt?: string } = {}): string {
  const lines = ['#EXTM3U', '#EXT-X-VERSION:3', '#EXT-X-TARGETDURATION:10', `#EXT-X-MEDIA-SEQUENCE:${mediaSequence}`];
  for (let i = 0; i < count; i++) {
    const seq = mediaSequence + i;
    if (opts.discontinuityAt === seq) lines.push('#EXT-X-DISCONTINUITY');
    if (opts.pdt !== undefined && i === 0) lines.push(`#EXT-X-PROGRAM-DATE-TIME:${opts.pdt}`);
    lines.push('#EXTINF:10.000,', `seg-${seq}.ts`);
  }
  return `${lines.join('\n')}\n`;
}
