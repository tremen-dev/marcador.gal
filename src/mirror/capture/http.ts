/**
 * The single exit path of phase A (CA-2).
 *
 * Every request the capturer makes is built here and nowhere else. That is not
 * tidiness: RN-11's user-agent duty is only provable if there is one door, and
 * `tests/mirror/capture/robots.test.ts` case 8 fails if a second one appears.
 */
import type { HttpFetcher, HttpRequest, HttpResponse } from './ports';

/** Thrown before any I/O when a request would leave without identifying us. */
export class MissingUserAgentError extends Error {
  override readonly name = 'MissingUserAgentError';
  readonly url: string;

  constructor(url: string) {
    super(`RN-11: refusing to request ${JSON.stringify(url)} without a User-Agent`);
    this.url = url;
  }
}

/** Thrown when a source answers with something other than 2xx. */
export class HttpStatusError extends Error {
  override readonly name = 'HttpStatusError';
  readonly status: number;

  constructor(url: string, status: number) {
    super(`${url} answered ${status}`);
    this.status = status;
  }
}

/**
 * Thrown when a source answers 3xx (SPEC-003 CA-10, F-SPEC-002-22).
 *
 * The redirection is NOT followed, so the tick fails with zero bytes archived.
 * `resultados-futbol.com` answers a whole 301 to `besoccer.es` (ADR-008 §2):
 * following it would ask one `robots.txt` for permission and download from
 * another host, archiving the bytes under the wrong `SourceId` — RN-11 broken
 * without a single test going red. Because no request ever changes host, the
 * URL robots.txt was checked against and the URL actually downloaded are the
 * same BY CONSTRUCTION.
 *
 * A 3xx is a failure and not a rescue: that a source has moved is a fact the
 * operator has to see, not something the capturer should settle on its own.
 */
export class RedirectNotFollowedError extends Error {
  override readonly name = 'RedirectNotFollowedError';
  readonly status: number;
  readonly requested: string;
  readonly location: string | null;

  constructor(url: string, status: number, location: string | null) {
    super(
      `RN-11: refusing to follow the ${status} of ${url} to ` +
        `${location ?? '(no Location header)'} — a redirection would change host without ` +
        'the robots.txt of the destination having been consulted (SPEC-003 CA-10)',
    );
    this.status = status;
    this.requested = url;
    this.location = location;
  }
}

/** Builds a request that carries the declared User-Agent, or refuses to. */
export function politeRequest(url: string, userAgent: string): HttpRequest {
  if (userAgent.trim().length === 0) throw new MissingUserAgentError(url);
  return { url, headers: { 'User-Agent': userAgent } };
}

/** Performs a polite request and returns the body, or throws. */
export async function politeFetch(
  fetcher: HttpFetcher,
  url: string,
  userAgent: string,
): Promise<HttpResponse> {
  const response = await fetcher.fetch(politeRequest(url, userAgent));
  if (response.status >= 300 && response.status < 400) {
    throw new RedirectNotFollowedError(url, response.status, response.location ?? null);
  }
  if (response.status < 200 || response.status >= 300) {
    throw new HttpStatusError(url, response.status);
  }
  return response;
}

/**
 * `HttpFetcher` over the platform `fetch`. Used by the CLI, not by tests.
 *
 * `redirect: 'manual'` is the whole point (SPEC-003 CA-10): without it the
 * platform follows a 3xx silently and hands back a 200 from a host nobody
 * asked robots.txt about.
 */
export const globalFetcher: HttpFetcher = {
  fetch: async (request: HttpRequest): Promise<HttpResponse> => {
    const response = await globalThis.fetch(request.url, {
      headers: { ...request.headers },
      redirect: 'manual',
    });
    return {
      status: response.status,
      body: new Uint8Array(await response.arrayBuffer()),
      location: response.headers.get('location'),
    };
  },
};
