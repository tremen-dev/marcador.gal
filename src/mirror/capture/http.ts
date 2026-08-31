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
  if (response.status < 200 || response.status >= 300) {
    throw new HttpStatusError(url, response.status);
  }
  return response;
}

/** `HttpFetcher` over the platform `fetch`. Used by the CLI, not by tests. */
export const globalFetcher: HttpFetcher = {
  fetch: async (request: HttpRequest): Promise<HttpResponse> => {
    const response = await globalThis.fetch(request.url, { headers: { ...request.headers } });
    return { status: response.status, body: new Uint8Array(await response.arrayBuffer()) };
  },
};
