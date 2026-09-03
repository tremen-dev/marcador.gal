/**
 * The three raw objects of a confirmed observation, archived BEFORE being
 * parsed (RN-10, D-5, ADR-022 §3, SPEC-015 CA-4).
 *
 * There are TWO INCOMING EVENTS, not one — the message and the callback — plus
 * the model's answer, and all three are raw responses that get parsed. So all
 * three are archived, under the same regime and the same whitelist.
 *
 * THE `Observation` POINTS AT THE MESSAGE, and the other two are DANGLING ON
 * PURPOSE. The message is the reprocessable substrate; the model's answer and
 * the confirmation have no `Observation` that cites them, and that is
 * LEGITIMATE DECLARED STATE, with the precedent of ADR-020 §4 in the opposite
 * direction. A case asserts it as an expected result, not as a tolerance
 * (CA-4.3).
 *
 * THE KEY, AND THE IRREGULARITY IT CARRIES (CA-4.4, F-SPEC-015-2). The raw
 * store's key is `<source>/<competition_id>/<day>/<instant>-<digest>.<ext>`,
 * and `competition_id` IS NOT KNOWN BEFORE PARSING a free message — nor can it
 * be derived from the catalogue, because one correspondent may cover two
 * competitions. So the `source` is `corresponsal` for all three, SO THE PURGE
 * HAS ONE SINGLE PREFIX (ADR-023 §2), and the second segment carries the EVENT
 * KIND out of a closed list of three. Whoever reads a key under `corresponsal/`
 * has to know this, which is why it is written here and in the ADR and not in
 * a passing comment.
 */
import { captureThenParse } from '@/raw/capture';
import type { RawObjectMeta, RawRef, RawStore } from '@/raw/store';

/** The source segment of every key of this archive. ONE prefix for the purge. */
export const CORRESPONDENT_ARCHIVE_SOURCE = 'corresponsal';

/** The prefix ADR-023 §2 purges. Derived, never written twice. */
export const CORRESPONDENT_ARCHIVE_PREFIX = `${CORRESPONDENT_ARCHIVE_SOURCE}/`;

/**
 * The closed list of event kinds that occupy the SECOND segment of the key,
 * where every other source of this project writes a `competition_id`.
 */
export const ARCHIVE_EVENT_KINDS = ['mensaxe', 'proposta', 'confirmacion'] as const;

export type ArchiveEventKind = (typeof ARCHIVE_EVENT_KINDS)[number];

/** Everything archived by this module is JSON we built ourselves. */
const ARCHIVE_EXT = 'json';

/** The bytes of a redacted object. `Buffer.from` is the declared way to bytes. */
export function encode(value: unknown): Uint8Array {
  return Buffer.from(JSON.stringify(value), 'utf8');
}

export function archiveMeta(kind: ArchiveEventKind, at: string): RawObjectMeta {
  return {
    source: CORRESPONDENT_ARCHIVE_SOURCE,
    competition_id: kind,
    fetched_at: at,
    ext: ARCHIVE_EXT,
  };
}

/**
 * Archives one object and hands its reference to the parser. It is
 * `captureThenParse` and nothing else: the ONE sanctioned path from raw bytes
 * to a parser (RN-10). There is deliberately no degraded mode — if the archive
 * fails, nothing is parsed.
 */
export async function archiveThenParse<T>(
  store: RawStore,
  kind: ArchiveEventKind,
  at: string,
  value: unknown,
  parse: (rawRef: RawRef) => T | Promise<T>,
): Promise<T> {
  return await captureThenParse(store, archiveMeta(kind, at), encode(value), (_body, rawRef) =>
    parse(rawRef),
  );
}

/** Archives one object and gives back only its reference. */
export async function archive(
  store: RawStore,
  kind: ArchiveEventKind,
  at: string,
  value: unknown,
): Promise<RawRef> {
  return await archiveThenParse(store, kind, at, value, (rawRef) => rawRef);
}
