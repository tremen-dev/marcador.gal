/**
 * Grouping segments into chunks of ~20 s and ~30 s (SPEC-019 CA-2, ADR-029 §3).
 *
 * Chunks follow SEGMENT BOUNDARIES — no audio is cut — so «20 s» means «the
 * consecutive segments whose declared durations first reach 20 s». The same
 * segments produce both groupings; a chunk never spans a gap (a jump in the
 * sequence numbers) or a discontinuity, because concatenated bytes across
 * either are not one continuous stream.
 */

export interface ChunkableSegment {
  readonly sequence: number;
  readonly duration: number;
  readonly discontinuity: boolean;
  /** Archive key of the segment's bytes. */
  readonly key: string;
  /** Offset in seconds from the start of the session's contiguous audio. */
  readonly offsetSeconds: number;
}

export interface Chunk {
  /** `<lengthSeconds>s-<firstSequence>-<lastSequence>`. */
  readonly id: string;
  readonly targetSeconds: number;
  readonly sequences: readonly number[];
  readonly keys: readonly string[];
  readonly durationSeconds: number;
  /** [start, end) in seconds of session audio. */
  readonly startOffsetSeconds: number;
  readonly endOffsetSeconds: number;
}

export function groupIntoChunks(segments: readonly ChunkableSegment[], targetSeconds: number): readonly Chunk[] {
  const ordered = [...segments].sort((a, b) => a.sequence - b.sequence);
  const chunks: Chunk[] = [];
  let current: ChunkableSegment[] = [];
  let duration = 0;

  const flush = (): void => {
    if (current.length === 0) return;
    const first = current[0]!;
    const last = current.at(-1)!;
    chunks.push({
      id: `${targetSeconds}s-${first.sequence}-${last.sequence}`,
      targetSeconds,
      sequences: current.map((s) => s.sequence),
      keys: current.map((s) => s.key),
      durationSeconds: duration,
      startOffsetSeconds: first.offsetSeconds,
      endOffsetSeconds: last.offsetSeconds + last.duration,
    });
    current = [];
    duration = 0;
  };

  let previous: ChunkableSegment | null = null;
  for (const segment of ordered) {
    const breaks = previous !== null && (segment.sequence !== previous.sequence + 1 || segment.discontinuity);
    if (breaks) flush();
    current.push(segment);
    duration += segment.duration;
    if (duration >= targetSeconds) flush();
    previous = segment;
  }
  // A trailing remainder shorter than the target is still a chunk: audio is
  // never dropped, and the report can see it is short by its duration.
  flush();
  return chunks;
}

/** The chunk whose audio span contains the instant `offsetSeconds`. */
export function chunkAt(chunks: readonly Chunk[], offsetSeconds: number): Chunk | null {
  return chunks.find((c) => offsetSeconds >= c.startOffsetSeconds && offsetSeconds < c.endOffsetSeconds) ?? null;
}
