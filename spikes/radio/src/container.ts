/**
 * What container a segment is in, read from its FIRST BYTES and never from its
 * name (SPEC-019 CA-1.4, CA-7.3). MPEG-TS segments share the `.ts` extension
 * with TypeScript, so the name says nothing; the sync byte does.
 */

export type Container = 'mpeg-ts' | 'adts-aac' | 'fmp4' | 'id3-aac' | 'wav' | 'mp3' | 'unknown';

const TS_PACKET = 188;

export function sniffContainer(bytes: Uint8Array): Container {
  if (bytes.length >= TS_PACKET * 2 && bytes[0] === 0x47 && bytes[TS_PACKET] === 0x47) return 'mpeg-ts';
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WAVE') return 'wav';
  if (bytes.length >= 8) {
    const box = ascii(bytes, 4, 8);
    if (box === 'ftyp' || box === 'styp' || box === 'moof' || box === 'moov' || box === 'sidx') return 'fmp4';
  }
  if (bytes.length >= 3 && ascii(bytes, 0, 3) === 'ID3') {
    // ID3v2 header then either ADTS (AAC in HLS audio-only streams) or MP3.
    const size = id3Size(bytes);
    const body = bytes.subarray(10 + size);
    if (isAdtsSync(body)) return 'id3-aac';
    if (isMp3Sync(body)) return 'mp3';
    return 'unknown';
  }
  if (isAdtsSync(bytes)) return 'adts-aac';
  if (isMp3Sync(bytes)) return 'mp3';
  return 'unknown';
}

/** Whether these bytes are AUDIO/VIDEO rather than text — the CA-7.3 check. */
export function isMediaContainer(container: Container): boolean {
  return container !== 'unknown';
}

/** The extension the archive gives a segment of this container. */
export function extensionFor(container: Container): string {
  switch (container) {
    case 'mpeg-ts':
      return 'ts';
    case 'adts-aac':
    case 'id3-aac':
      return 'aac';
    case 'fmp4':
      return 'm4s';
    case 'wav':
      return 'wav';
    case 'mp3':
      return 'mp3';
    case 'unknown':
      return 'bin';
  }
}

/** The MIME type an ASR engine is told the bytes are. */
export function mimeFor(container: Container): string {
  switch (container) {
    case 'mpeg-ts':
      return 'video/mp2t';
    case 'adts-aac':
    case 'id3-aac':
      return 'audio/aac';
    case 'fmp4':
      return 'audio/mp4';
    case 'wav':
      return 'audio/wav';
    case 'mp3':
      return 'audio/mpeg';
    case 'unknown':
      return 'application/octet-stream';
  }
}

function ascii(bytes: Uint8Array, from: number, to: number): string {
  let s = '';
  for (let i = from; i < to; i++) s += String.fromCharCode(bytes[i] ?? 0);
  return s;
}

function id3Size(bytes: Uint8Array): number {
  if (bytes.length < 10) return 0;
  return (
    ((bytes[6]! & 0x7f) << 21) | ((bytes[7]! & 0x7f) << 14) | ((bytes[8]! & 0x7f) << 7) | (bytes[9]! & 0x7f)
  );
}

/** ADTS: 12 sync bits set, layer bits 00. */
function isAdtsSync(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0xff && (bytes[1]! & 0xf6) === 0xf0;
}

/** MPEG audio frame: 11 sync bits set, layer bits not 00, version bits not 01. */
function isMp3Sync(bytes: Uint8Array): boolean {
  if (bytes.length < 2 || bytes[0] !== 0xff || (bytes[1]! & 0xe0) !== 0xe0) return false;
  const layer = (bytes[1]! & 0x06) >> 1;
  const version = (bytes[1]! & 0x18) >> 3;
  return layer !== 0 && version !== 1;
}
