import { describe, expect, it } from 'vitest';
import { chunkAt, groupIntoChunks, type ChunkableSegment } from '../src/chunks.ts';

function segments(count: number, duration = 10, from = 1): ChunkableSegment[] {
  return Array.from({ length: count }, (_, i) => ({
    sequence: from + i,
    duration,
    discontinuity: false,
    key: `segments/${from + i}.ts`,
    offsetSeconds: i * duration,
  }));
}

describe('groupIntoChunks (CA-2: segment boundaries, two groupings of the same audio)', () => {
  it('10 s segments into 20 s chunks: pairs', () => {
    const chunks = groupIntoChunks(segments(6), 20);
    expect(chunks.map((c) => c.sequences)).toEqual([[1, 2], [3, 4], [5, 6]]);
    expect(chunks[0]).toMatchObject({ id: '20s-1-2', durationSeconds: 20, startOffsetSeconds: 0, endOffsetSeconds: 20 });
  });

  it('10 s segments into 30 s chunks: triples', () => {
    const chunks = groupIntoChunks(segments(6), 30);
    expect(chunks.map((c) => c.sequences)).toEqual([[1, 2, 3], [4, 5, 6]]);
  });

  it('6 s segments reach 20 s at the fourth segment (24 s): boundaries are not cut', () => {
    const chunks = groupIntoChunks(segments(8, 6), 20);
    expect(chunks.map((c) => c.durationSeconds)).toEqual([24, 24]);
  });

  it('a gap in sequence numbers closes the chunk', () => {
    const s = [...segments(3), ...segments(3, 10, 10)];
    const chunks = groupIntoChunks(s, 30);
    expect(chunks.map((c) => c.sequences)).toEqual([[1, 2, 3], [10, 11, 12]]);
  });

  it('a discontinuity closes the chunk, and a short tail is kept as a short chunk', () => {
    const s = segments(5).map((seg) => (seg.sequence === 3 ? { ...seg, discontinuity: true } : seg));
    const chunks = groupIntoChunks(s, 30);
    expect(chunks.map((c) => c.sequences)).toEqual([[1, 2], [3, 4, 5]]);
    expect(chunks[0]?.durationSeconds).toBe(20);
  });

  it('chunkAt finds the chunk containing an instant', () => {
    const chunks = groupIntoChunks(segments(6), 20);
    expect(chunkAt(chunks, 25)?.id).toBe('20s-3-4');
    expect(chunkAt(chunks, 60)).toBeNull();
  });
});
