/**
 * What gets archived, and it is A TOTAL WHITELIST (ADR-022 §3, SPEC-015 CA-3;
 * RN-10, arts. 5.1.c and 25.2 of the GDPR).
 *
 * RN-10 is satisfied by archiving the REDACTED update, not the whole one. The
 * purpose of the rule is written into the rule itself — «permite reprocesar con
 * un parser corregido y reproducir una jornada entera en tests» — and
 * `first_name`, `last_name`, `username`, `language_code`, `is_bot` and
 * `is_premium` are INERT for that: there is no future parser that reads them.
 *
 * AND THIS IS NOT WHAT ADR-009 REJECTED. That has to be said here, because
 * otherwise somebody will cite the precedent backwards. ADR-009 rejected
 * «retención indefinida con anonimización del HTML archivado» for two reasons:
 * anonymising the raw destroys RN-10, and knowing WHAT TO REDACT would need a
 * reliable parser, which is circular. HERE THE CIRCULARITY DOES NOT EXIST: a
 * Telegram update is structured JSON with a documented, stable schema, so the
 * redaction is a whitelist of KEYS, decidable without interpreting a single
 * word of the domain. It is the difference between redacting a third party's
 * HTML — which you have to understand — and not copying a field of a JSON,
 * which only takes not copying it.
 *
 * BY DEFAULT IT IS DISCARDED, NOT BY DEFAULT KEPT. The archived object holds
 * EXACTLY the paths of the list below and nothing else, and the assertion of
 * CA-3.1 is over the set of key paths walked in depth — not over the six
 * forbidden names, which is what a blacklist would be (ADR-016 §3.5).
 *
 * AND `message.text` GOES VERBATIM, BYTE FOR BYTE. That is what keeps the
 * redaction from destroying the substrate of RN-10, and it is what separates
 * this decision from the one ADR-009 turned down.
 *
 * WHAT THIS MECHANISM DOES NOT REACH, declared where it judges (ADR-016 §6,
 * CA-3.6): the CONTENT of `message.text` itself. If the person signs the
 * message with their own name, there it stays. It is unavoidable and it is
 * treated where it can be — in the notice, which tells them what they do not
 * need to write (CA-14.3). It is not debt; it is the limit of the mechanism,
 * and it is declared so nobody reads the criterion as promising more.
 */

export interface ArchivedKey {
  /** The path in the archived object, dot-separated. */
  readonly path: string;
  /** Why it survives redaction. Obligatory, like an entry of `ALLOWED_PACKAGES`. */
  readonly motive: string;
}

/**
 * THE WHITELIST. Everything else of the update is dropped, including fields
 * nobody has thought of yet, which is the whole point of enumerating what is
 * allowed instead of what is not.
 */
export const ARCHIVED_KEYS: readonly ArchivedKey[] = [
  {
    path: 'update_id',
    motive:
      "Telegram's own sequence number. It is what lets a replay tell two archived objects apart and detect a gap, and it names no person.",
  },
  {
    path: 'correspondent_id',
    motive:
      'The declared pseudonym, archived IN PLACE OF `from.id` and `chat.id`. It is the ONLY durable home of who sent what (ADR-022 §2), and the chain of RN-12 ends here.',
  },
  {
    path: 'message.message_id',
    motive:
      "The identifier of the message inside its chat. It is what a callback refers back to, and without it the card cannot be tied to what produced it.",
  },
  {
    path: 'message.date',
    motive:
      'RAW MATERIAL OF THE FIRST FIGURE OF EPIC-002. Without the instant the person pressed send there is no latency to measure (ADR-022 §3).',
  },
  {
    path: 'message.text',
    motive:
      'The substrate RN-10 exists for: the only thing a corrected parser can be re-run over. VERBATIM, byte for byte (CA-3.4).',
  },
  {
    path: 'callback_query.id',
    motive:
      "The identifier Telegram expects back when a button is answered. Opaque, single-use, and it names no person.",
  },
  {
    path: 'callback_query.data',
    motive:
      'Our own payload: which proposal was confirmed or discarded. It is the evidence that RN-09 was satisfied — that a person pressed the button.',
  },
  {
    path: 'callback_query.message_id',
    motive:
      'The card the button belongs to. It closes the chain message → card → confirmation without any Telegram identifier of a person.',
  },
];

/**
 * The six fields of the update that carry a person and that NO PARSER READS.
 *
 * They are here ONLY so a case can assert they are absent — that is CA-3.2,
 * which checks a consequence. THE MECHANISM IS THE WHITELIST ABOVE: nothing in
 * the redaction consults this list, and a seventh field Telegram adds tomorrow
 * is out without anybody having to know it exists.
 */
export const FORBIDDEN_FIELDS: readonly string[] = [
  'first_name',
  'last_name',
  'username',
  'language_code',
  'is_bot',
  'is_premium',
];

function valueAt(source: unknown, path: readonly string[]): unknown {
  let current = source;
  for (const segment of path) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function setAt(target: Record<string, unknown>, path: readonly string[], value: unknown): void {
  let current = target;
  for (const segment of path.slice(0, -1)) {
    const next = current[segment];
    if (next === undefined) {
      const created: Record<string, unknown> = {};
      current[segment] = created;
      current = created;
      continue;
    }
    current = next as Record<string, unknown>;
  }
  const last = path[path.length - 1];
  if (last !== undefined) current[last] = value;
}

/**
 * Builds the archived object BY COPYING THE WHITELIST, never by deleting what
 * is forbidden. A path that is absent from the source is absent from the
 * result; no path outside the list can appear, by construction.
 *
 * `keys` is a parameter so the positive controls of CA-3.3 can run the SAME
 * function over a different list — shortening it, or widening it with a
 * forbidden path — and see a named case go red. There is no second redactor.
 */
export function redact(
  source: unknown,
  correspondentId: string,
  keys: readonly ArchivedKey[] = ARCHIVED_KEYS,
): Readonly<Record<string, unknown>> {
  const archived: Record<string, unknown> = {};

  for (const key of keys) {
    const path = key.path.split('.');
    const value = path[0] === 'correspondent_id' ? correspondentId : valueAt(source, path);
    if (value === undefined) continue;
    setAt(archived, path, value);
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
