/**
 * The raw object of an operator's action, archived BEFORE anything is parsed
 * (RN-10, D-5, ADR-024 §6, SPEC-017 CA-3).
 *
 * RN-10 HAS NO EXCEPTION BY SOURCE, and `dominio.md` names this case
 * explicitly: the `raw_ref` is obligatory always, «incluye las correcciones
 * hechas a mano desde el panel: son la observación con más poder del sistema».
 * A hand-made correction with no raw object behind it would be the ONE
 * `Observation` of the system nobody could reproduce, and precisely the one
 * that would most need reproducing.
 *
 * THE KEY, AND THE IRREGULARITY IT CARRIES (CA-3.7). The raw store's key is
 * `<source>/<competition_id>/<day>/<instant>-<digest>.<ext>`, and there is no
 * `competition_id` here: the panel operates on a match, and the match's
 * competition is not what the purge hangs from. So the `source` segment is
 * `operador` for everything this module writes — SO THE PURGE HAS ONE SINGLE
 * PREFIX (ADR-020 §2) — and the SECOND segment carries the KIND OF ACTION out
 * of a closed list. It is exactly the irregularity `CORRESPONDENT_ARCHIVE_SOURCE`
 * already declared (SPEC-015 CA-4.4), for exactly the same reason, and it is
 * written here and in ADR-024 §6 rather than left in a passing comment.
 *
 * THE ARCHIVE IS THE ONLY DURABLE HOME OF THE `operator_id` AND OF THE MOTIVE
 * (ADR-024 §6). No column of `migrations/0008` can hold either, and that is a
 * decision, not an omission: the project keeps ONE regime for «who did this».
 */
import { captureThenParse } from '@/raw/capture';
import type { RawObjectMeta, RawRef, RawStore } from '@/raw/store';

/** The source segment of every key of this archive. ONE prefix for the purge. */
export const OPERATOR_ARCHIVE_SOURCE = 'operador';

/** The prefix ADR-020 §2 purges. Derived, never written twice. */
export const OPERATOR_ARCHIVE_PREFIX = `${OPERATOR_ARCHIVE_SOURCE}/`;

/**
 * THE CLOSED LIST OF WHAT AN OPERATOR CAN DO, and it is the same list twice:
 * the vocabulary of the panel's operations, and the SECOND SEGMENT of every
 * key of this archive, where every automatic source of this project writes a
 * `competition_id` (CA-3.7).
 *
 * Three of them publish — they end in an `Observation` of weight 1.0 and a
 * call to the engine — and the fourth, `acuse`, publishes NOTHING: RN-05 says
 * the conflict is not published, and acknowledging it does not publish it
 * either (CA-6.6).
 *
 * The values are domain vocabulary and stay in galego, like
 * `ARCHIVE_EVENT_KINDS` of the bot and like `MATCH_QUALIFIERS`; the
 * identifiers around them are English (CLAUDE.md §Lenguas).
 */
export const ADMIN_ACTIONS = ['correccion', 'estado', 'ratificacion', 'acuse'] as const;

export type AdminAction = (typeof ADMIN_ACTIONS)[number];

/** The three that end in an `Observation`. `acuse` is not one of them. */
export const PUBLISHING_ACTIONS = ['correccion', 'estado', 'ratificacion'] as const;

export type PublishingAction = (typeof PUBLISHING_ACTIONS)[number];

/** True when this action produces an `Observation` and runs the engine. */
export function publishes(action: AdminAction): action is PublishingAction {
  return (PUBLISHING_ACTIONS as readonly string[]).includes(action);
}

/** Everything archived by this module is JSON we built ourselves. */
const ARCHIVE_EXT = 'json';

/** The bytes of a redacted object. `Buffer.from` is the declared way to bytes. */
export function encode(value: unknown): Uint8Array {
  return Buffer.from(JSON.stringify(value), 'utf8');
}

export function archiveMeta(action: AdminAction, at: string): RawObjectMeta {
  return {
    source: OPERATOR_ARCHIVE_SOURCE,
    competition_id: action,
    fetched_at: at,
    ext: ARCHIVE_EXT,
  };
}

/**
 * Archives one action and hands its reference to the parser. It is
 * `captureThenParse` and nothing else: the ONE sanctioned path from raw bytes
 * to a parser (RN-10). There is deliberately no degraded mode — if the archive
 * fails, nothing is built and nothing is written.
 */
export async function archiveThenParse<T>(
  store: RawStore,
  action: AdminAction,
  at: string,
  value: unknown,
  parse: (rawRef: RawRef) => T | Promise<T>,
): Promise<T> {
  return await captureThenParse(store, archiveMeta(action, at), encode(value), (_body, rawRef) =>
    parse(rawRef),
  );
}

/** Archives one action and gives back only its reference. */
export async function archive(
  store: RawStore,
  action: AdminAction,
  at: string,
  value: unknown,
): Promise<RawRef> {
  return await archiveThenParse(store, action, at, value, (rawRef) => rawRef);
}
