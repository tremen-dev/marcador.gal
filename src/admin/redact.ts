/**
 * What gets archived, and it is A TOTAL WHITELIST (ADR-024 §6, SPEC-017 CA-3;
 * RN-10, D-5).
 *
 * BY DEFAULT IT IS DISCARDED, NOT BY DEFAULT KEPT. The archived object holds
 * EXACTLY the keys of the list below and nothing else, and the assertion of
 * CA-3.1 is over the set of key paths WALKED IN DEPTH — not over a list of
 * forbidden names, which is what a blacklist would be (ADR-016 §3.5). A field
 * nobody has thought of yet is outside without anybody having to know it
 * exists.
 *
 * WHAT IS ARCHIVED IS WHAT THE OPERATOR DECLARES, AND NOTHING THE REQUEST
 * BRINGS: no headers, no IP, no user-agent, no cookie, no session value
 * (CA-3.2). The object is built by COPYING the whitelist out of a declared
 * shape, never by deleting what is forbidden out of the request.
 *
 * THE MOTIVE GOES VERBATIM, BYTE FOR BYTE (CA-3.4). It is the half of RN-12
 * that no column carries — `rule` says which rule and
 * `supporting_observation_ids` says over what, but WHY A PERSON LOWERED A
 * SCOREBOARD is nowhere else — and redacting it would destroy the substrate
 * RN-10 exists to keep.
 *
 * WHAT THIS MECHANISM DOES NOT REACH, declared where it judges (ADR-016 §6,
 * CA-3.9): THE CONTENT OF THE MOTIVE ITSELF. If the person writes a referee's
 * name in there, there it stays. It is unavoidable, and it is declared so
 * nobody reads the criterion as promising more.
 */
import type { AdminAction } from './archive';
import type { OperatorId } from './session';
import type { Instant, MatchId } from '@/model/ids';
import type { MatchStatus } from '@/model/match';

/** One key that survives redaction, with the reason it does. */
export interface ArchivedActionKey {
  /** The key in the archived object. Flat: this object has no nesting. */
  readonly key: string;
  /** Why it survives. Obligatory, like an entry of `ALLOWED_PACKAGES`. */
  readonly motive: string;
}

/**
 * THE WHITELIST. Nine keys, and the two identifiers of the target are mutually
 * exclusive: a correction carries a `match_id`, an acknowledgement carries an
 * `alert_id`, and neither carries the other.
 */
export const ARCHIVED_ACTION_KEYS: readonly ArchivedActionKey[] = [
  {
    key: 'operator_id',
    motive:
      'The declared pseudonym, and THE ONLY DURABLE HOME of who did this (ADR-024 §6). No column of migration 0008 can hold it, on purpose: the project keeps one regime for «who did this». The chain of RN-12 ends here.',
  },
  {
    key: 'match_id',
    motive:
      'The match the operator acted on, derived from the declared calendar (ADR-017). It is what ties the archived object to the `Observation` and to the retention window it hangs from (ADR-020 §2).',
  },
  {
    key: 'alert_id',
    motive:
      'The row of `alerts` that was acknowledged. Present only for an acknowledgement, which publishes nothing (RN-05, CA-6.6).',
  },
  {
    key: 'action',
    motive:
      'Which of the four operations of ADR-024 §6 this was. It is also the second segment of the archive key, so a replay can tell three kinds of object apart under one prefix.',
  },
  {
    key: 'status',
    motive:
      'The state the operator proposes, out of the five of `dominio.md`. RN-06 reserves `postponed` and `suspended` to the official source or a human, and the official one is not capturable (ADR-008 §1): this is the only way in.',
  },
  {
    key: 'home_score',
    motive:
      'The home half of the proposed scoreboard. Reprocessable substrate: a corrected parser re-run over the archive has to reach the same `Observation`.',
  },
  {
    key: 'away_score',
    motive: 'The away half, for the same reason and under the same scoreboard rule (SPEC-001 CA-18).',
  },
  {
    key: 'reason',
    motive:
      'THE MOTIVE WRITTEN BY THE PERSON, VERBATIM (CA-3.4). The half of RN-12 no column carries: without it D-6 —«un marcador publicado siempre sabe de dónde viene»— is satisfied in words only.',
  },
  {
    key: 'issued_at',
    motive:
      "The ticket's `issued_at`: when the form was put in front of the person. Raw material of the FOURTH FIGURE of EPIC-002 (ADR-024 §4 and §8).",
  },
  {
    key: 'submitted_at',
    motive:
      'When the action arrived. With `issued_at` it is the duration of one action, which is the only exact part of the fourth figure (CA-8.4).',
  },
];

/**
 * The declared shape of an action, as the panel understands it AFTER reading
 * the form and the ticket. It is the ONLY thing the redactor is ever given:
 * there is no path from a `Request` to the archive.
 */
export interface DeclaredAction {
  readonly operator_id: OperatorId;
  readonly match_id?: MatchId | undefined;
  readonly alert_id?: number | undefined;
  readonly action: AdminAction;
  readonly status?: MatchStatus | undefined;
  readonly home_score?: number | null | undefined;
  readonly away_score?: number | null | undefined;
  readonly reason: string;
  readonly issued_at: Instant;
  readonly submitted_at: Instant;
}

/**
 * Builds the archived object BY COPYING THE WHITELIST. A key that is absent
 * from the declared action is absent from the result; no key outside the list
 * can appear, by construction.
 *
 * `keys` is a parameter so the positive controls of CA-3.3 can run THE SAME
 * function over a different list — shortened, or widened with a forbidden key
 * — and see a named case go red. There is no second redactor.
 */
export function redactAction(
  action: DeclaredAction,
  keys: readonly ArchivedActionKey[] = ARCHIVED_ACTION_KEYS,
): Readonly<Record<string, unknown>> {
  const source = action as unknown as Record<string, unknown>;
  const archived: Record<string, unknown> = {};

  for (const declared of keys) {
    const value = source[declared.key];
    if (value === undefined) continue;
    archived[declared.key] = value;
  }

  return archived;
}

/** Every key path of an object, walked in depth. What CA-3.1 asserts over. */
export function keyPaths(value: unknown, prefix = ''): readonly string[] {
  if (value === null || typeof value !== 'object') {
    return prefix === '' ? [] : [prefix];
  }

  const paths: string[] = [];
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    paths.push(...keyPaths(nested, prefix === '' ? key : `${prefix}.${key}`));
  }
  return paths;
}
