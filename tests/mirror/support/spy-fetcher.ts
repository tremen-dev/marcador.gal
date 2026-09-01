/**
 * An `HttpFetcher` that records every request the capturer builds, with the
 * instant of the (fake) clock at which it was built.
 *
 * It records requests, not responses: CA-1 and CA-2 are both about what LEAVES
 * the process, which is the only part of RN-11 that the sites being scraped
 * can feel.
 */
import { instantToEpochMs } from '@/mirror/instants';
import type { Clock } from '@/polite/clock';
import type { HttpFetcher, HttpRequest, HttpResponse } from '@/polite/http';

export interface RecordedRequest {
  readonly url: string;
  readonly at: string;
  readonly headers: Readonly<Record<string, string>>;
}

export interface SpyFetcher {
  readonly fetcher: HttpFetcher;
  readonly requests: readonly RecordedRequest[];
  /** Requests for a URL, in order, as epoch milliseconds. */
  timesFor(url: string): readonly number[];
}

export function spyFetcher(
  clock: Clock,
  respond: (request: HttpRequest) => HttpResponse | Promise<HttpResponse> = () => ({
    status: 200,
    body: new TextEncoder().encode('<html><body>ok</body></html>'),
  }),
): SpyFetcher {
  const requests: RecordedRequest[] = [];

  const fetcher: HttpFetcher = {
    fetch: async (request: HttpRequest): Promise<HttpResponse> => {
      requests.push({ url: request.url, at: clock.now(), headers: { ...request.headers } });
      return await respond(request);
    },
  };

  return {
    fetcher,
    requests,
    timesFor: (url: string) =>
      requests.filter((r) => r.url === url).map((r) => instantToEpochMs(r.at)),
  };
}
