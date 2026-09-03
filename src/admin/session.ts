/**
 * Who is at the other end of the panel, and it is the weakest thing in the
 * project ON PURPOSE (ADR-024 §2 and §3, SPEC-017 CA-1).
 *
 * THE PROBLEM IS OF CHANNEL, NOT OF CRYPTOGRAPHY. The two precedents of
 * authentication in this repository — `CRON_SECRET` and the webhook's
 * `secret_token` — authenticate A MACHINE that can put a header on every
 * request. A browser does not put headers, and a person does not retype a
 * 32-character secret every time they lower a scoreboard. So there is exactly
 * one exchange: the operator hands the secret over ONCE and gets a signed
 * cookie back.
 *
 * THE CATALOGUE AND THE SECRET GO IN THE ENVIRONMENT AND NEITHER IS EVER
 * VERSIONED. Here ADR-024 §2 departs from ADR-022 §2 — which versions the
 * correspondent catalogue and only keeps the mapping out — and the motive is
 * written: there are no two separable halves here, because WHAT HAS TO BE KEPT
 * IS THE CREDENTIAL. It is the reasoning of ADR-009 §3 — *git no se purga, se
 * reescribe*, and therefore «sin excepción, porque su incumplimiento no es
 * reversible» — applied to the credential of the surface with weight 1.0 AND
 * PRECEDENCE. `ADMIN_OPERATORS` holds DIGESTS, not secrets, so reading the
 * production variable does not hand anybody a session; and WHO MAY READ IT IS
 * A CAPABILITY FRONTIER (CA-1.7), whose one entry is this file.
 *
 * IT FAILS CLOSED, IN THREE FORMS AND WITH NO GRADATION (CA-1.1, CA-1.2):
 *
 *   * `ADMIN_SESSION_SECRET` absent, empty or shorter than 32 characters ⇒ a
 *     NAMED ERROR, never a secret that is accepted, and no route of the panel
 *     does anything — not even read;
 *   * `ADMIN_OPERATORS` absent, empty or unreadable ⇒ nobody gets in, and this
 *     module NEVER THROWS for it: it gives back the empty catalogue, exactly
 *     as `readCorrespondentMap` does. A panel that blows up on boot and a panel
 *     that is switched off must not be confusable;
 *   * an invalid signature, a tampered cookie, an expired `expires_at` or an
 *     `operator_id` that is no longer in the catalogue ⇒ NO SESSION, and the
 *     answer is THE SAME in the four cases (CA-1.4).
 *
 * THE EXPIRY LIVES INSIDE THE SIGNATURE, not in the cookie's `Max-Age`, which
 * is a suggestion to the client and not a guarantee of the server: moving the
 * `Max-Age` does not lengthen a session, and a case asserts it (CA-1.5).
 *
 * THERE IS NO `===` AGAINST THE SECRET OR ITS DIGEST ANYWHERE IN THIS MODULE
 * (CA-1.3). The comparison is constant-time, written out, and an unknown
 * `operator_id` does not short-circuit either: it compares against a digest
 * that no SHA-256 can produce, so «this operator does not exist» and «this
 * secret is wrong» take the same path and the same time.
 *
 * WHAT THIS DESIGN DOES NOT GIVE, written so nobody supposes it (ADR-024 §3):
 * no revocation of an already-issued session before it expires, no limit on
 * attempts, and no second factor. What makes it acceptable TODAY is what makes
 * the purge ceremony of ADR-009 §4 acceptable: there is ONE operator, it is
 * the author, and this is measurement. The trigger that reopens it is written:
 * THE SECOND OPERATOR.
 */
import { createHash, createHmac } from 'node:crypto';
import { z } from 'zod';
import { epochMsOf, instantOf } from '@/polite/clock';
import type { Instant } from '@/model/ids';

/** The name of the catalogue variable. Written once: the frontier watches it. */
export const ADMIN_OPERATORS_VARIABLE = 'ADMIN_OPERATORS';

/** The name of the secret variable. Written once, for the same reason. */
export const ADMIN_SESSION_SECRET_VARIABLE = 'ADMIN_SESSION_SECRET';

/**
 * The floor under a usable signing secret. A named constant in one place, like
 * `PRE`/`POST` (ADR-019 §2) and the 6 h of ADR-014 §3.2: revising it is a diff.
 */
export const MIN_SESSION_SECRET_LENGTH = 32;

/**
 * How long a session lasts: HOURS, NOT DAYS, because a matchday lasts an
 * afternoon (gate note §9). A named constant, so changing it is a diff and not
 * an arbitration.
 */
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

/** The cookie's name. It says nothing about who holds it. */
export const ADMIN_SESSION_COOKIE = 'marcador_operador';

/** `operador-01`, `operador-02`. A local token with nothing inside (CA-1.6). */
export const OPERATOR_ID_PATTERN = /^operador-\d+$/;

/**
 * The shape is a BARRIER, not a convention. `operador-alberto` or
 * `operador-xove`, in a public repository and crossed with the declared
 * calendar, identify a person; `operador-01` does not. It is the same decision
 * `corresponsal-\d+` took (ADR-022 §2) and the same reason.
 */
export const OperatorIdSchema = z.string().regex(OPERATOR_ID_PATTERN).brand<'OperatorId'>();

export type OperatorId = z.infer<typeof OperatorIdSchema>;

/** A SHA-256 digest in hex. What the environment holds; never the secret. */
const DigestSchema = z.string().regex(/^[0-9a-f]{64}$/);

/**
 * `{"<operator_id>": "<digest>"}`. The WHOLE object is refused if one key does
 * not match the shape: a catalogue half-loaded is a catalogue nobody can
 * reason about (ADR-018 §3, all-or-nothing, borrowed).
 */
export const OperatorCatalogSchema = z.record(OperatorIdSchema, DigestSchema);

export type OperatorCatalog = ReadonlyMap<OperatorId, string>;

/**
 * A digest no SHA-256 output can equal, used when the `operator_id` is not in
 * the catalogue. It exists so the comparison ALWAYS RUNS: returning early for
 * an unknown operator is itself an oracle, and it would also be a comparison
 * against the stored digest, which CA-1.3 forbids.
 */
const NO_SUCH_OPERATOR = '-'.repeat(64);

/**
 * Constant-time comparison, written out.
 *
 * It compares EVERY character of both strings whatever it finds, so the time
 * it takes does not depend on how many leading characters matched. The lengths
 * are folded into the same accumulator instead of short-circuiting, because
 * returning early on a length mismatch is itself an oracle.
 *
 * THIS IS THE SECOND IMPLEMENTATION IN THE REPOSITORY, and it is declared, not
 * hidden: `constantTimeEquals` also lives in `src/bot/webhook.ts` (SPEC-015,
 * `hecho`), and the panel cannot import it without dragging the whole graph of
 * the bot into a route of its own. Destination: EPIC-MEJORA; trigger: the
 * third (SPEC-017 §Fuera de alcance).
 */
export function constantTimeEquals(a: string, b: string): boolean {
  let difference = a.length ^ b.length;
  const length = a.length > b.length ? a.length : b.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (a.codePointAt(index) ?? 0) ^ (b.codePointAt(index) ?? 0);
  }
  return difference === 0;
}

/** Why a configured signing secret cannot be used. Three, and no fourth. */
export type SessionSecretFault = 'absent' | 'empty' | 'too_short';

/**
 * Thrown when the signing secret is unusable. IT IS AN ERROR WITH A NAME
 * (CA-1.1): a short secret is never quietly accepted, and a variable that is
 * missing can never look like a permission.
 */
export class UnusableSessionSecretError extends Error {
  override readonly name = 'UnusableSessionSecretError';
  readonly fault: SessionSecretFault;

  constructor(fault: SessionSecretFault) {
    super(
      `${ADMIN_SESSION_SECRET_VARIABLE} is unusable (${fault}): the panel signs sessions and ` +
        `tickets with it and refuses to run without at least ${MIN_SESSION_SECRET_LENGTH} ` +
        'characters (ADR-024 §3). No route of the panel does anything until it is set.',
    );
    this.fault = fault;
  }
}

/**
 * The signing secret, or a NAMED ERROR. There is no third outcome and no
 * default: a variable that is missing must not resemble a permission.
 */
export function readSessionSecret(env: Readonly<Record<string, string | undefined>>): string {
  const raw = env[ADMIN_SESSION_SECRET_VARIABLE];
  if (typeof raw !== 'string') throw new UnusableSessionSecretError('absent');
  if (raw.length === 0) throw new UnusableSessionSecretError('empty');
  if (raw.length < MIN_SESSION_SECRET_LENGTH) throw new UnusableSessionSecretError('too_short');
  return raw;
}

/**
 * The catalogue of operators, as it is read from the environment. An absent,
 * empty or unreadable value is an EMPTY CATALOGUE and NEVER an exception
 * (CA-1.2): a deployment with nothing configured recognises nobody, which is
 * the state the panel is born in (ADR-024 §9).
 */
export function readOperators(
  env: Readonly<Record<string, string | undefined>>,
): OperatorCatalog {
  const raw = env[ADMIN_OPERATORS_VARIABLE];
  if (typeof raw !== 'string' || raw.trim().length === 0) return new Map();

  const parsed = OperatorCatalogSchema.safeParse(jsonOrNull(raw));
  if (!parsed.success) return new Map();

  return new Map(Object.entries(parsed.data) as [OperatorId, string][]);
}

function jsonOrNull(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** The digest of a secret. What the environment holds, and what is compared. */
export function operatorDigest(secret: string): string {
  return createHash('sha256').update(secret, 'utf8').digest('hex');
}

/**
 * Whether this operator offered the right secret. The comparison is
 * constant-time and it ALWAYS RUNS: an unknown `operator_id` compares against
 * a digest nothing can produce, so it takes the same path as a wrong secret.
 */
export function authenticate(
  catalog: OperatorCatalog,
  operatorId: OperatorId,
  offered: string,
): boolean {
  const stored = catalog.get(operatorId) ?? NO_SUCH_OPERATOR;
  return constantTimeEquals(operatorDigest(offered), stored);
}

/** What a session says. The expiry travels INSIDE the signature (CA-1.5). */
export const SessionPayloadSchema = z
  .object({
    operator_id: OperatorIdSchema,
    issued_at: z.iso.datetime({ offset: false }),
    expires_at: z.iso.datetime({ offset: false }),
  })
  .strict()
  .readonly();

export type SessionPayload = z.infer<typeof SessionPayloadSchema>;

function sign(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body, 'utf8').digest('hex');
}

/** `<base64url(payload)>.<hmac>`. Nothing here is readable by the client. */
export function signSession(secret: string, payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${body}.${sign(secret, body)}`;
}

/** The session a person gets after handing the secret over once. */
export function newSession(operatorId: OperatorId, now: Instant): SessionPayload {
  return SessionPayloadSchema.parse({
    operator_id: operatorId,
    issued_at: now,
    expires_at: instantOf(epochMsOf(now) + SESSION_TTL_MS),
  });
}

/**
 * The `operator_id` a cookie proves, or `null`.
 *
 * `null` is the answer for a malformed value, a bad signature, an expired
 * `expires_at` AND an `operator_id` that is no longer in the catalogue. THE
 * CALLER CANNOT TELL THE FOUR APART, and neither can whoever sent the cookie
 * (CA-1.4).
 */
export function readSession(
  secret: string,
  catalog: OperatorCatalog,
  token: string | null,
  now: Instant,
): OperatorId | null {
  if (token === null) return null;

  const cut = token.lastIndexOf('.');
  if (cut <= 0) return null;

  const body = token.slice(0, cut);
  const mac = token.slice(cut + 1);
  if (!constantTimeEquals(mac, sign(secret, body))) return null;

  const parsed = SessionPayloadSchema.safeParse(
    jsonOrNull(Buffer.from(body, 'base64url').toString('utf8')),
  );
  if (!parsed.success) return null;

  // The expiry is READ FROM THE SIGNED PAYLOAD. The cookie's `Max-Age` is a
  // suggestion to the client; this is the server's answer (CA-1.5).
  if (epochMsOf(parsed.data.expires_at) <= epochMsOf(now)) return null;

  // `has`, not a comparison against what is stored: the digest is never an
  // operand of `===` in this module (CA-1.3), and presence is the question.
  if (!catalog.has(parsed.data.operator_id)) return null;

  return parsed.data.operator_id;
}

/**
 * The `Set-Cookie` of a session: `httpOnly`, `Secure`, `SameSite=Strict`,
 * `Path=/` (ADR-024 §3, CA-1.5).
 */
export function sessionSetCookie(token: string, maxAgeSeconds: number): string {
  return [
    `${ADMIN_SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    `Max-Age=${maxAgeSeconds}`,
  ].join('; ');
}

/** The value of one cookie in a `Cookie` header, or `null`. */
export function readCookie(header: string | null, name: string): string | null {
  if (header === null) return null;

  for (const part of header.split(';')) {
    const cut = part.indexOf('=');
    if (cut < 0) continue;
    if (part.slice(0, cut).trim() !== name) continue;
    return part.slice(cut + 1).trim();
  }
  return null;
}
