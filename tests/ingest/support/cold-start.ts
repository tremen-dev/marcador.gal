/**
 * CA-14.2 and CA-14.3 — the shape of a COLD START, written once.
 *
 * The real shape of production is a new instance per tick: ADR-004 says there
 * is no live process on Vercel. So this battery does not drive one adapter
 * many times — it BUILDS THE ADAPTER AGAIN, `instances` times, each one with
 * its own rhythm port freshly created, sharing only the durable store.
 *
 * Run against the durable implementation it must yield ONE request (CA-14.2).
 * Run against the memory one it yields `instances` requests, and that is the
 * positive control (CA-14.3): it is the exact reproduction of F-SPEC-008-V13,
 * and the proof that CA-14.2 does not pass by accident.
 *
 * Only requests to the TARGET are counted. The `robots.txt` of an origin is
 * budgeted apart (ADR-014 §3.2) and, since the turn is taken before the gate
 * is consulted, a denied instance never asks for one either.
 */
import { SourceAdapter } from '@/ingest/adapter';
import { RobotsGate } from '@/polite/policy';
import { USER_AGENT } from '@/polite/user-agent';
import { CEROACERO_ENTRY, sourceRegistry } from '@/ingest/sources';
import { FIVE_BRANCHES, ceroaceroPage } from '../../fixtures/ceroacero';
import { FakeClock, MemoryRawStore, RESOLVE_ALL, spyFetcher } from './doubles';
import type { RateLimit } from '@/polite/rate-limit';
import type { HttpRequest, HttpResponse } from '@/polite/http';

/** ceroacero's real `robots.txt` forbids ONE path, and it is not ours. */
const ROBOTS_ALLOW = ['User-agent: *', 'Disallow: /zzmap_v3.php', ''].join('\n');
const PAGE = ceroaceroPage(FIVE_BRANCHES);

const serve = (request: HttpRequest): HttpResponse =>
  request.url.endsWith('/robots.txt')
    ? { status: 200, body: new TextEncoder().encode(ROBOTS_ALLOW) }
    : { status: 200, body: PAGE };

export interface ColdStartOptions {
  /** How many times the whole adapter is built again, as a cold start does. */
  readonly instances: number;
  /** A NEW port per instance. The durable one shares only its store. */
  readonly makeRateLimit: () => RateLimit | Promise<RateLimit>;
  /** Milliseconds the clock moves between one construction and the next. */
  readonly advanceMsBetween?: number;
  readonly start?: string;
}

export interface ColdStartResult {
  readonly kinds: readonly ('captured' | 'skipped')[];
  /** Requests that LEFT towards the competition page. RN-11 counts these. */
  readonly targetRequests: number;
  readonly reasons: readonly (string | null)[];
}

export async function coldStart(options: ColdStartOptions): Promise<ColdStartResult> {
  const startMs = Date.parse(options.start ?? '2026-09-06T17:00:00.000Z');
  const advance = options.advanceMsBetween ?? 0;

  // Shared on purpose: the archive and the socket are NOT the memory of the
  // rhythm. What is rebuilt every round is the adapter and its port.
  const store = new MemoryRawStore();
  const registry = sourceRegistry([{ ...CEROACERO_ENTRY, competitions: [CEROACERO_ENTRY.competitions[0]!] }]);
  const target = registry.targets()[0]!;

  const kinds: ('captured' | 'skipped')[] = [];
  const reasons: (string | null)[] = [];
  let targetRequests = 0;

  for (let round = 0; round < options.instances; round += 1) {
    const clock = new FakeClock(new Date(startMs + round * advance).toISOString());
    const spy = spyFetcher(clock, serve);

    const adapter = new SourceAdapter({
      registry,
      fetcher: spy.fetcher,
      store,
      clock,
      // A NEW gate too: a cold start has no cached policy either.
      robots: new RobotsGate({ fetcher: spy.fetcher, store, userAgent: USER_AGENT }),
      rateLimit: await options.makeRateLimit(),
      resolver: RESOLVE_ALL,
    });

    const outcome = await adapter.capture(target, clock.now());
    kinds.push(outcome.kind);
    reasons.push(outcome.kind === 'skipped' ? outcome.reason : null);
    targetRequests += spy.forUrl(target.url).length;
  }

  return { kinds, targetRequests, reasons };
}
