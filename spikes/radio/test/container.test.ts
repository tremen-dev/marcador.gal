/** Synthetic byte patterns only (ADR-009 §3): no real segment is versioned. */
import { describe, expect, it } from 'vitest';
import { extensionFor, isMediaContainer, sniffContainer } from '../src/container.ts';

function tsPackets(count: number): Uint8Array {
  const bytes = new Uint8Array(188 * count);
  for (let i = 0; i < count; i++) bytes[188 * i] = 0x47;
  return bytes;
}

describe('sniffContainer (CA-1.4, CA-7.3: by content, never by name)', () => {
  it('MPEG-TS: 0x47 at 0 and at 188', () => {
    expect(sniffContainer(tsPackets(2))).toBe('mpeg-ts');
  });

  it('ADTS AAC: 0xFFF sync, layer 00', () => {
    expect(sniffContainer(new Uint8Array([0xff, 0xf1, 0x50, 0x80, 0x00, 0x1f, 0xfc]))).toBe('adts-aac');
  });

  it('ID3-prefixed AAC (audio-only HLS)', () => {
    const header = [0x49, 0x44, 0x33, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00];
    expect(sniffContainer(new Uint8Array([...header, 0xff, 0xf1, 0x50]))).toBe('id3-aac');
  });

  it('fMP4: an ftyp/styp/moof box at offset 4', () => {
    const styp = new Uint8Array([0, 0, 0, 24, 0x73, 0x74, 0x79, 0x70, 0, 0, 0, 0]);
    expect(sniffContainer(styp)).toBe('fmp4');
  });

  it('WAV: RIFF....WAVE', () => {
    const wav = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45]);
    expect(sniffContainer(wav)).toBe('wav');
  });

  it('TypeScript source is not a media container, whatever its extension', () => {
    expect(sniffContainer(new TextEncoder().encode('export const x = 1;\n'))).toBe('unknown');
    expect(isMediaContainer('unknown')).toBe(false);
    expect(isMediaContainer('mpeg-ts')).toBe(true);
  });

  it('gives each container its archive extension', () => {
    expect(extensionFor('mpeg-ts')).toBe('ts');
    expect(extensionFor('id3-aac')).toBe('aac');
    expect(extensionFor('fmp4')).toBe('m4s');
  });
});
