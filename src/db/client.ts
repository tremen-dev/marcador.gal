/**
 * Postgres access with `postgres.js` and tagged SQL, no ORM (ADR-001, ADR-006).
 *
 * The driver is deliberately provider-agnostic: ADR-004 asks to reconsider the
 * platform after the spike, and tying data access to Neon's serverless driver
 * would tie us before that conversation happens.
 */
import postgres from 'postgres';
import type { Sql } from 'postgres';

export type { Sql };

/** Thrown when the connection string a command needs is not configured. */
export class MissingDatabaseUrlError extends Error {
  override readonly name = 'MissingDatabaseUrlError';

  constructor(variable: string, why: string) {
    super(`${variable} is not set. ${why}`);
  }
}

/**
 * The connection string for tests.
 *
 * It throws instead of returning undefined ON PURPOSE. The gate of 2026-08-29
 * ruled that without a real Postgres the criteria that depend on it are UNMET,
 * not skipped: a suite that is green because it tested nothing is the worst
 * possible outcome.
 */
export function requireTestDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env['DATABASE_URL_TEST'];
  if (url === undefined || url.length === 0) {
    throw new MissingDatabaseUrlError(
      'DATABASE_URL_TEST',
      'SPEC-001 CA-7 (Postgres half), CA-13..CA-17, CA-18.3 and CA-19.3 must run ' +
        'against a real (Neon test branch) Postgres; ' +
        'the gate of 2026-08-29 ruled that without it those criteria are UNMET, ' +
        'not skipped. Set it and run `npm run test:db` again.',
    );
  }
  return url;
}

export function requireDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env['DATABASE_URL'];
  if (url === undefined || url.length === 0) {
    throw new MissingDatabaseUrlError('DATABASE_URL', 'It is required to reach Postgres.');
  }
  return url;
}

/**
 * A client. `postgres.js` returns `any` from queries by design, so every read
 * is parsed with its zod schema on the way out of the database — which is the
 * only reason CA-14 (schema/zod parity) can exist at all.
 */
export function createClient(url: string): Sql {
  return postgres(url, {
    // Vercel functions are short-lived (ADR-004); a fat pool buys nothing.
    max: 5,
    // Instants cross as ISO 8601 UTC strings, never as Date (ADR-006). The
    // conversion lives here, in the data-access layer, not in the callers.
    types: {
      date: {
        to: 1184,
        from: [1082, 1114, 1184],
        serialize: (value: string) => value,
        parse: (value: string) => new Date(value).toISOString(),
      },
    },
    onnotice: () => {},
  });
}
