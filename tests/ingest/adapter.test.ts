/**
 * CA-4, CA-5 y CA-7 — archivar antes de parsear, ninguna petición descortés, y
 * el ritmo de RN-11 impuesto dentro del adaptador y no por quien lo llama.
 */
import { describe, expect, test } from 'vitest';
import { SourceAdapter } from '@/ingest/adapter';
import { CEROACERO_ENTRY, sourceRegistry } from '@/ingest/sources';
import { MissingUserAgentError, RedirectNotFollowedError } from '@/polite/http';
import { RobotsGate } from '@/polite/policy';
import { USER_AGENT, USER_AGENT_PATTERN } from '@/polite/user-agent';
import { FIVE_BRANCHES, ceroaceroPage } from '../fixtures/ceroacero';
import {
  FailingRawStore,
  FakeClock,
  MemoryRawStore,
  RESOLVE_ALL,
  RobotsOnlyRawStore,
  spyFetcher,
} from './support/doubles';
import type { HttpRequest, HttpResponse } from '@/polite/http';
import type { RowExtractor, SourceRow } from '@/ingest/ports';
import type { RawStore } from '@/raw/store';

const START = '2026-09-06T17:00:00.000Z';
const PAGE = ceroaceroPage(FIVE_BRANCHES);

/** El `robots.txt` real de ceroacero prohíbe UNA ruta, y no es la nuestra. */
const ROBOTS_ALLOW = ['User-agent: *', 'Disallow: /zzmap_v3.php', ''].join('\n');
/** Su gemelo prohibitivo, para el escenario 1 de CA-5. */
const ROBOTS_DENY = ['User-agent: *', 'Disallow: /edicion/', ''].join('\n');

function serve(robotsTxt: string, page: Uint8Array = PAGE) {
  return (request: HttpRequest): HttpResponse =>
    request.url.endsWith('/robots.txt')
      ? { status: 200, body: new TextEncoder().encode(robotsTxt) }
      : { status: 200, body: page };
}

interface HarnessOptions {
  readonly respond?: (request: HttpRequest) => HttpResponse | Promise<HttpResponse>;
  readonly store?: RawStore;
  readonly userAgent?: string;
  readonly extract?: RowExtractor;
  readonly competitions?: readonly (readonly [(typeof CEROACERO_ENTRY)['competitions'][0][0], string])[];
}

function harness(options: HarnessOptions = {}) {
  const clock = new FakeClock(START);
  const store = options.store ?? new MemoryRawStore();
  const spy = spyFetcher(clock, options.respond ?? serve(ROBOTS_ALLOW));
  const userAgent = options.userAgent ?? USER_AGENT;
  const entry = {
    ...CEROACERO_ENTRY,
    ...(options.extract === undefined ? {} : { extract: options.extract }),
    ...(options.competitions === undefined ? {} : { competitions: options.competitions }),
  };
  const registry = sourceRegistry([entry]);

  const adapter = new SourceAdapter({
    registry,
    fetcher: spy.fetcher,
    store,
    clock,
    robots: new RobotsGate({ fetcher: spy.fetcher, store, userAgent }),
    resolver: RESOLVE_ALL,
    userAgent,
  });

  return { adapter, clock, spy, store, registry, targets: registry.targets() };
}

describe('CA-4 — archivar antes de parsear, sin modo degradado (RN-10)', () => {
  test('1. el `put` ocurre ANTES de que el lector vea un solo byte', async () => {
    const order: string[] = [];
    const store = new MemoryRawStore();
    const watched: RawStore = {
      put: async (meta, body) => {
        order.push('put');
        return await store.put(meta, body);
      },
      get: (key) => store.get(key),
      list: (prefix) => store.list(prefix),
    };
    const extract: RowExtractor = (body): readonly SourceRow[] => {
      order.push('read');
      return CEROACERO_ENTRY.extract(body);
    };

    const h = harness({ store: watched, extract });
    const target = h.targets[0]!;
    const outcome = await h.adapter.capture(target, h.clock.now());
    expect(outcome.kind).toBe('captured');
    if (outcome.kind !== 'captured') return;
    await h.adapter.read(target, outcome.body, outcome.raw_ref, outcome.at);

    // Dos `put`: el del robots.txt y el de la página. El lector va después.
    expect(order).toEqual(['put', 'put', 'read']);
  });

  test('2. el `raw_ref` devuelto es el que llevan TODAS las `Observation`', async () => {
    const h = harness();
    const target = h.targets[0]!;
    const outcome = await h.adapter.capture(target, h.clock.now());
    if (outcome.kind !== 'captured') throw new Error('esperaba una captura');

    const { observations } = await h.adapter.read(
      target,
      outcome.body,
      outcome.raw_ref,
      outcome.at,
    );

    expect(observations.length).toBe(5);
    expect([...new Set(observations.map((o) => o.raw_ref))]).toEqual([outcome.raw_ref]);
    expect(await h.store.get(outcome.raw_ref)).not.toBeNull();
  });

  test('3. si el `put` de la página falla no se parsea nada, y el error sale sin envolver', async () => {
    // El robots.txt SÍ se archiva: lo que falla es el `put` de la página, que
    // es exactamente el caso que RN-10 prohíbe degradar.
    const read: string[] = [];
    const extract: RowExtractor = (body) => {
      read.push('read');
      return CEROACERO_ENTRY.extract(body);
    };
    const h = harness({ store: new RobotsOnlyRawStore(), extract });

    await expect(h.adapter.capture(h.targets[0]!, h.clock.now())).rejects.toThrow(
      'blob store unreachable',
    );
    expect(read).toEqual([]);
  });

  test('4. y el tick lo registra como fallido, sin `raw_ref` y sin resultado parcial', async () => {
    const h = harness({ store: new RobotsOnlyRawStore() });

    const records = await h.adapter.tick();

    expect(records).toHaveLength(2);
    for (const record of records) {
      expect(record.outcome).toBe('failed');
      expect(record.raw_ref).toBeNull();
      expect(record.reason).toContain('blob store unreachable');
    }
  });

  test('5. y si lo que falla es archivar el `robots.txt`, se falla cerrado', async () => {
    // Sin política archivada no hay política en vigor, y sin política en vigor
    // no sale ninguna petición hacia ese origen (ADR-014 §3.3).
    const h = harness({ store: new FailingRawStore() });

    const records = await h.adapter.tick();

    expect(records.map((r) => r.outcome)).toEqual(['failed', 'skipped']);
    expect(records[1]?.reason).toContain('no robots.txt policy in force');
    expect(records.every((r) => r.raw_ref === null)).toBe(true);
  });
});

describe('CA-5 — ninguna petición sale sin permiso, sin identificarse o cambiando de host', () => {
  test('5. política que prohíbe la URL: cero peticiones al objetivo y motivo con RN-11', async () => {
    const h = harness({ respond: serve(ROBOTS_DENY) });
    const target = h.targets[0]!;

    const outcome = await h.adapter.capture(target, h.clock.now());

    expect(outcome.kind).toBe('skipped');
    if (outcome.kind !== 'skipped') return;
    expect(h.spy.forUrl(target.url)).toHaveLength(0);
    expect(outcome.reason).toContain('/edicion/galicia-preferente-autonomica-grupo-1-26-27/222309');
    expect(outcome.reason).toContain('RN-11');
    // Nada archivado bajo la competición: lo único que hay es el robots.txt.
    expect((h.store as MemoryRawStore).keys.filter((k) => !k.includes('/robots/'))).toEqual([]);
  });

  test('6. user-agent vacío: `MissingUserAgentError` ANTES de cualquier I/O', async () => {
    // El doble del puerto registra si LE PREGUNTARON. La comprobación vive al
    // principio del camino del adaptador, no dentro de la puerta de salida:
    // con la UA vacía no se abre una política, no se toca el archivo y no se
    // llega siquiera a mirar el robots.txt.
    const asked: string[] = [];
    const clock = new FakeClock(START);
    const store = new MemoryRawStore();
    const spy = spyFetcher(clock, serve(ROBOTS_ALLOW));
    const registry = sourceRegistry([CEROACERO_ENTRY]);
    const adapter = new SourceAdapter({
      registry,
      fetcher: spy.fetcher,
      store,
      clock,
      robots: {
        allows: async (url: string) => {
          asked.push(url);
          return { allowed: true, reason: null, policyRawRef: null };
        },
      },
      resolver: RESOLVE_ALL,
      userAgent: '   ',
    });

    await expect(adapter.capture(registry.targets()[0]!, clock.now())).rejects.toThrow(
      MissingUserAgentError,
    );
    expect(asked).toEqual([]);
    expect(spy.requests).toHaveLength(0);
    expect(store.size).toBe(0);
  });

  test('7. y en el camino normal toda petición lleva exactamente `USER_AGENT`', async () => {
    const h = harness();

    await h.adapter.tick();

    expect(h.spy.requests.length).toBeGreaterThan(0);
    for (const request of h.spy.requests) {
      expect(request.headers['User-Agent']).toBe(USER_AGENT);
    }
    expect(USER_AGENT).toMatch(USER_AGENT_PATTERN);
  });

  test('8. un 3xx: `RedirectNotFollowedError`, cero bytes archivados y el `Location` en el motivo', async () => {
    const h = harness({
      respond: (request) =>
        request.url.endsWith('/robots.txt')
          ? { status: 200, body: new TextEncoder().encode(ROBOTS_ALLOW) }
          : {
              status: 301,
              body: new Uint8Array(),
              location: 'https://www.besoccer.es/competicion/resultados/galicia/2027/grupo1',
            },
    });
    const target = h.targets[0]!;

    await expect(h.adapter.capture(target, h.clock.now())).rejects.toThrow(
      RedirectNotFollowedError,
    );
    await expect(h.adapter.capture(target, h.clock.now())).rejects.toThrow(/besoccer\.es/);
    expect((h.store as MemoryRawStore).keys.filter((k) => !k.includes('/robots/'))).toEqual([]);
  });

  test('9. la URL consultada a robots.txt y la descargada son la misma, por construcción', async () => {
    const h = harness();
    const target = h.targets[0]!;

    await h.adapter.capture(target, h.clock.now());

    const asked = h.spy.requests.filter((r) => !r.url.endsWith('/robots.txt'));
    expect(asked.map((r) => r.url)).toEqual([target.url]);
    // Y el robots.txt consultado es el del MISMO origen, no el de otro host.
    expect(h.spy.requests[0]?.url).toBe(`${new URL(target.url).origin}/robots.txt`);
  });
});

describe('CA-7 — el ritmo lo impone el adaptador, no quien lo llama (RN-11)', () => {
  test('10. 20 s de tick durante 5 minutos: como mucho 5 peticiones por par', async () => {
    const h = harness();
    const [first, second] = h.targets;

    for (let elapsed = 0; elapsed < 5 * 60_000; elapsed += 20_000) {
      await h.adapter.tick();
      h.clock.advance(20_000);
    }

    expect(h.spy.forUrl(first!.url).length).toBeLessThanOrEqual(5);
    expect(h.spy.forUrl(second!.url).length).toBeLessThanOrEqual(5);
    // Control: el limitador no está apagando el adaptador entero.
    expect(h.spy.forUrl(first!.url).length).toBe(5);
    expect(h.spy.forUrl(second!.url).length).toBe(5);
  });

  test('11. los ticks suprimidos no producen registro de fallo ni de petición', async () => {
    const h = harness();

    const firstPass = await h.adapter.tick();
    h.clock.advance(20_000);
    const suppressed = await h.adapter.tick();

    expect(firstPass).toHaveLength(2);
    expect(suppressed).toEqual([]);
    expect(h.spy.forUrl(h.targets[0]!.url)).toHaveLength(1);
  });

  test('12. el instante se sella ANTES del await: un intento fallido consume su minuto', async () => {
    // Si el sello viviera detrás del `await`, un objetivo que falla nunca lo
    // recibiría y se reintentaría en CADA pase del cron: 3 peticiones por
    // minuto a un sitio que ya está diciendo que no.
    const h = harness({
      respond: (request) =>
        request.url.endsWith('/robots.txt')
          ? { status: 200, body: new TextEncoder().encode(ROBOTS_ALLOW) }
          : { status: 500, body: new Uint8Array() },
    });
    const target = h.targets[0]!;

    await h.adapter.tick();
    h.clock.advance(20_000);
    await h.adapter.tick();
    h.clock.advance(20_000);
    await h.adapter.tick();

    expect(h.spy.forUrl(target.url)).toHaveLength(1);
  });

  test('13. y un objetivo prohibido se pregunta una vez por minuto, no en cada pase', async () => {
    const h = harness({ respond: serve(ROBOTS_DENY) });

    const first = await h.adapter.tick();
    h.clock.advance(20_000);
    const second = await h.adapter.tick();

    expect(first.map((r) => r.outcome)).toEqual(['skipped', 'skipped']);
    expect(second).toEqual([]);
  });
});
