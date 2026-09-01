/**
 * The doubles the adapter's criteria need: a clock the test drives, a fetcher
 * that records what LEAVES the process, a raw store in memory and one that
 * always fails, and a `MatchResolver` that resolves only what it is told.
 *
 * They are ingest's own and not `tests/mirror/support/`'s on purpose: the
 * measuring instrument of EPIC-001 is scaffolding this epic does not hang
 * from (ADR-014, alternatives).
 */
import { rawKey } from '@/raw/store';
import { CompetitionIdSchema, MatchIdSchema, SourceIdSchema } from '@/model/ids';
import type { Clock } from '@/polite/clock';
import type { HttpFetcher, HttpRequest, HttpResponse } from '@/polite/http';
import type { Instant, MatchId } from '@/model/ids';
import type { RawObject, RawObjectMeta, RawRef, RawStore } from '@/raw/store';
import type { MatchResolver, SourceRow } from '@/ingest/ports';

export const CEROACERO = SourceIdSchema.parse('ceroacero');
export const FUTGAL = SourceIdSchema.parse('futgal');
export const TERCERA = CompetitionIdSchema.parse('rfef-tercera-g1');
export const PREFERENTE = CompetitionIdSchema.parse('futgal-preferente-g1');

export class FakeClock implements Clock {
  #epochMs: number;

  constructor(start: string) {
    this.#epochMs = Date.parse(start);
  }

  now(): Instant {
    return new Date(this.#epochMs).toISOString() as Instant;
  }

  advance(ms: number): void {
    if (ms < 0) throw new Error('FakeClock cannot go backwards');
    this.#epochMs += ms;
  }
}

export interface RecordedRequest {
  readonly url: string;
  readonly at: string;
  readonly headers: Readonly<Record<string, string>>;
}

export interface SpyFetcher {
  readonly fetcher: HttpFetcher;
  readonly requests: readonly RecordedRequest[];
  forUrl(url: string): readonly RecordedRequest[];
}

export function spyFetcher(
  clock: Clock,
  respond: (request: HttpRequest) => HttpResponse | Promise<HttpResponse> = () => ({
    status: 200,
    body: new TextEncoder().encode('<html><body>ok</body></html>'),
  }),
): SpyFetcher {
  const requests: RecordedRequest[] = [];

  return {
    fetcher: {
      fetch: async (request: HttpRequest): Promise<HttpResponse> => {
        requests.push({ url: request.url, at: clock.now(), headers: { ...request.headers } });
        return await respond(request);
      },
    },
    requests,
    forUrl: (url: string) => requests.filter((request) => request.url === url),
  };
}

export class MemoryRawStore implements RawStore {
  readonly #objects = new Map<string, RawObject>();

  put(meta: RawObjectMeta, body: Uint8Array): Promise<RawRef> {
    const key = rawKey(meta, body);
    this.#objects.set(key, { key, meta, body });
    return Promise.resolve(key);
  }

  get(key: string): Promise<RawObject | null> {
    return Promise.resolve(this.#objects.get(key) ?? null);
  }

  list(prefix: string): Promise<readonly string[]> {
    return Promise.resolve([...this.#objects.keys()].filter((k) => k.startsWith(prefix)).sort());
  }

  get keys(): readonly string[] {
    return [...this.#objects.keys()].sort();
  }

  get size(): number {
    return this.#objects.size;
  }
}

/** A store whose `put` always rejects, and that records nothing (CA-4). */
export class FailingRawStore implements RawStore {
  readonly failure: Error;
  size = 0;

  constructor(message = 'blob store unreachable') {
    this.failure = new Error(message);
  }

  put(): Promise<RawRef> {
    return Promise.reject(this.failure);
  }

  get(): Promise<RawObject | null> {
    return Promise.resolve(null);
  }

  list(): Promise<readonly string[]> {
    return Promise.resolve([]);
  }
}

/**
 * A store that archives the `robots.txt` and fails on everything else, so a
 * test can tell the two `put`s apart: the policy gets in, the page does not.
 */
export class RobotsOnlyRawStore implements RawStore {
  readonly #inner = new MemoryRawStore();

  put(meta: RawObjectMeta, body: Uint8Array): Promise<RawRef> {
    if (meta.competition_id !== 'robots') {
      return Promise.reject(new Error('blob store unreachable'));
    }
    return this.#inner.put(meta, body);
  }

  get(key: string): Promise<RawObject | null> {
    return this.#inner.get(key);
  }

  list(prefix: string): Promise<readonly string[]> {
    return this.#inner.list(prefix);
  }

  get keys(): readonly string[] {
    return this.#inner.keys;
  }
}

/** Resolves only the identities it was given. It never invents one (RN-09). */
export function resolverFor(known: readonly string[]): MatchResolver {
  return {
    resolve: async (row: SourceRow): Promise<MatchId | null> =>
      known.includes(row.source_ref) ? MatchIdSchema.parse(`m:${row.source_ref}`) : null,
  };
}

/** Resolves every row. For the criteria that are not about RN-09. */
export const RESOLVE_ALL: MatchResolver = {
  resolve: async (row: SourceRow): Promise<MatchId> => MatchIdSchema.parse(`m:${row.source_ref}`),
};

/** Resolves nothing. */
export const RESOLVE_NONE: MatchResolver = {
  resolve: async (): Promise<MatchId | null> => null,
};
