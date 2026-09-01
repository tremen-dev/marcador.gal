/**
 * CA-6 (ADR-014 §3) — la política de un origen se obtiene, se archiva y caduca.
 *
 * En producción no hay disco ni un momento «antes»: el cron es un tick de un
 * minuto sin nadie mirando. Así que el `robots.txt` se pide por la misma
 * puerta cortés, se archiva antes de parsearse (RN-10 no tiene excepción por
 * tipo de respuesta) y se falla cerrado sin él.
 */
import { describe, expect, test } from 'vitest';
import { SourceAdapter } from '@/ingest/adapter';
import { CEROACERO_ENTRY, sourceRegistry } from '@/ingest/sources';
import { ROBOTS_MAX_AGE_MS, RobotsGate } from '@/polite/policy';
import { MemoryRateLimit } from '@/polite/rate-limit';
import { USER_AGENT } from '@/polite/user-agent';
import { FIVE_BRANCHES, ceroaceroPage } from '../fixtures/ceroacero';
import { FakeClock, MemoryRawStore, RESOLVE_ALL, spyFetcher } from './support/doubles';
import type { HttpRequest, HttpResponse } from '@/polite/http';
import type { RawObjectMeta, RawRef, RawStore } from '@/raw/store';

const START = '2026-09-06T17:00:00.000Z';
const ROBOTS_TXT = ['User-agent: *', 'Disallow: /zzmap_v3.php', ''].join('\n');
const PAGE = ceroaceroPage(FIVE_BRANCHES);
const ROBOTS_URL = 'https://www.ceroacero.es/robots.txt';

function harness(
  respond: (request: HttpRequest) => HttpResponse | Promise<HttpResponse> = (request) =>
    request.url.endsWith('/robots.txt')
      ? { status: 200, body: new TextEncoder().encode(ROBOTS_TXT) }
      : { status: 200, body: PAGE },
) {
  const clock = new FakeClock(START);
  const store = new MemoryRawStore();
  const spy = spyFetcher(clock, respond);
  const registry = sourceRegistry([CEROACERO_ENTRY]);
  const adapter = new SourceAdapter({
    registry,
    fetcher: spy.fetcher,
    store,
    clock,
    robots: new RobotsGate({ fetcher: spy.fetcher, store, userAgent: USER_AGENT }),
    rateLimit: new MemoryRateLimit(),
    resolver: RESOLVE_ALL,
  });

  return { adapter, clock, spy, store, registry };
}

describe('CA-6 — se obtiene por la misma puerta y se archiva antes de parsearse', () => {
  test('1. antes de capturar nada, pide el `robots.txt` del origen', async () => {
    const h = harness();

    await h.adapter.tick();

    expect(h.spy.requests[0]?.url).toBe(ROBOTS_URL);
    expect(h.spy.requests[0]?.headers['User-Agent']).toBe(USER_AGENT);
  });

  test('2. y lo archiva con la clave de ADR-014 §3.4, antes que la página', async () => {
    const h = harness();

    await h.adapter.tick();

    const [first] = h.store.keys.filter((key) => key.includes('/robots/'));
    expect(first).toMatch(
      /^ceroacero\/robots\/2026-09-06\/2026-09-06t17-00-00\.000z-[0-9a-f]{12}\.txt$/,
    );
    expect(await h.store.get(first!)).not.toBeNull();
  });

  test('3. el `put` del robots.txt precede al `put` de la página', async () => {
    const order: string[] = [];
    const inner = new MemoryRawStore();
    const clock = new FakeClock(START);
    const spy = spyFetcher(clock, (request) =>
      request.url.endsWith('/robots.txt')
        ? { status: 200, body: new TextEncoder().encode(ROBOTS_TXT) }
        : { status: 200, body: PAGE },
    );
    const watched: RawStore = {
      put: async (meta: RawObjectMeta, body: Uint8Array): Promise<RawRef> => {
        order.push(meta.competition_id);
        return await inner.put(meta, body);
      },
      get: (key) => inner.get(key),
      list: (prefix) => inner.list(prefix),
    };
    const registry = sourceRegistry([CEROACERO_ENTRY]);
    const adapter = new SourceAdapter({
      registry,
      fetcher: spy.fetcher,
      store: watched,
      clock,
      robots: new RobotsGate({ fetcher: spy.fetcher, store: watched, userAgent: USER_AGENT }),
      rateLimit: new MemoryRateLimit(),
      resolver: RESOLVE_ALL,
    });

    await adapter.capture(registry.targets()[0]!, clock.now());

    expect(order).toEqual(['robots', 'futgal-preferente-g1']);
  });
});

describe('CA-6.1 y CA-6.2 — vive seis horas, ni una más ni una menos', () => {
  test('4. dentro de las 6 h no vuelve a pedirlo, aunque haya decenas de ticks', async () => {
    const h = harness();

    // 30 pases de cinco minutos: dos horas y media de ventana.
    for (let pass = 0; pass < 30; pass += 1) {
      await h.adapter.tick();
      h.clock.advance(5 * 60_000);
    }

    expect(h.spy.forUrl(ROBOTS_URL)).toHaveLength(1);
    // Y el ritmo de las páginas sigue vivo: no se ha bloqueado nada.
    expect(h.spy.forUrl(h.registry.targets()[0]!.url).length).toBe(30);
  });

  test('5. pasadas las 6 h lo pide UNA vez y sigue', async () => {
    const h = harness();

    await h.adapter.tick();
    h.clock.advance(ROBOTS_MAX_AGE_MS);
    await h.adapter.tick();
    h.clock.advance(60_000);
    await h.adapter.tick();

    expect(h.spy.forUrl(ROBOTS_URL)).toHaveLength(2);
    expect(h.store.keys.filter((key) => key.includes('/robots/'))).toHaveLength(2);
  });

  test('6. y un minuto antes de las 6 h todavía no lo pide', async () => {
    const h = harness();

    await h.adapter.tick();
    h.clock.advance(ROBOTS_MAX_AGE_MS - 60_000);
    await h.adapter.tick();

    expect(h.spy.forUrl(ROBOTS_URL)).toHaveLength(1);
  });
});

describe('CA-6.3 — se falla cerrado', () => {
  test('7. si la petición del `robots.txt` falla, no sale ninguna hacia ese origen', async () => {
    const h = harness((request) =>
      request.url.endsWith('/robots.txt')
        ? { status: 503, body: new Uint8Array() }
        : { status: 200, body: PAGE },
    );

    const records = await h.adapter.tick();

    expect(h.spy.requests.filter((r) => !r.url.endsWith('/robots.txt'))).toEqual([]);
    expect(records.map((r) => r.outcome)).toEqual(['skipped', 'skipped']);
    for (const record of records) {
      expect(record.reason).toContain('no robots.txt policy in force');
      expect(record.reason).toContain('RN-11');
    }
    expect(h.store.size).toBe(0);
  });

  test('8. y tampoco se reintenta el `robots.txt` en cada tick: pedir de más es descortés', async () => {
    const h = harness((request) =>
      request.url.endsWith('/robots.txt')
        ? { status: 503, body: new Uint8Array() }
        : { status: 200, body: PAGE },
    );

    for (let pass = 0; pass < 10; pass += 1) {
      await h.adapter.tick();
      h.clock.advance(60_000);
    }

    expect(h.spy.forUrl(ROBOTS_URL)).toHaveLength(1);
  });

  test('9. una política caducada es silencio con fecha vieja: al caducar y fallar, se cierra', async () => {
    let serveRobots = true;
    const h = harness((request) => {
      if (!request.url.endsWith('/robots.txt')) return { status: 200, body: PAGE };
      return serveRobots
        ? { status: 200, body: new TextEncoder().encode(ROBOTS_TXT) }
        : { status: 503, body: new Uint8Array() };
    });

    await h.adapter.tick();
    expect(h.spy.forUrl(h.registry.targets()[0]!.url)).toHaveLength(1);

    serveRobots = false;
    h.clock.advance(ROBOTS_MAX_AGE_MS);
    const records = await h.adapter.tick();

    expect(records.map((r) => r.outcome)).toEqual(['skipped', 'skipped']);
    expect(h.spy.forUrl(h.registry.targets()[0]!.url)).toHaveLength(1);
  });
});

/**
 * CA-6.1 — las seis horas son SEIS HORAS.
 *
 * Los casos 4, 5, 6 y 9 mueven el reloj en múltiplos de `ROBOTS_MAX_AGE_MS`,
 * así que prueban «hay una caducidad y es consistente» y no «son seis horas»:
 * cambiar la constante a 12 h los dejaba a los cuatro en verde, con la suite
 * entera en 748/748 (F-SPEC-008-V19). Es la patología de F-SPEC-004-9 —el caso
 * asertando contra la constante en vez de contra el literal— y las 6 h son una
 * de las decisiones que las *Notas para el gate humano* §3 subieron a firma:
 * una firma humana sobre un número que ningún test sujeta es una firma sobre
 * nada.
 *
 * Se atan con las DOS formas, porque la primera sola sería una tautología de
 * una línea: el literal, y —el que de verdad lo sujeta— el comportamiento a
 * los dos lados del borde, movido con LITERALES ABSOLUTOS que no derivan de la
 * constante.
 */
describe('CA-6.1 — las 6 h que el gate humano firmó, atadas por literales', () => {
  const FIVE_HOURS_FIFTY_NINE_MS = 5 * 60 * 60 * 1000 + 59 * 60 * 1000;
  const SIX_HOURS_ONE_MINUTE_MS = 6 * 60 * 60 * 1000 + 60 * 1000;

  test('10. la constante es exactamente seis horas (ADR-014 §3.2)', () => {
    expect(ROBOTS_MAX_AGE_MS).toBe(6 * 60 * 60 * 1000);
  });

  test('11. a 5 h 59 min todavía NO vuelve a pedirlo', async () => {
    const h = harness();

    await h.adapter.tick();
    h.clock.advance(FIVE_HOURS_FIFTY_NINE_MS);
    await h.adapter.tick();

    expect(h.spy.forUrl(ROBOTS_URL)).toHaveLength(1);
  });

  test('12. a 6 h 01 min lo pide UNA vez más, y solo una', async () => {
    const h = harness();

    await h.adapter.tick();
    h.clock.advance(SIX_HOURS_ONE_MINUTE_MS);
    await h.adapter.tick();
    // Y el tick siguiente, ya dentro de la ventana nueva, no vuelve a pedirlo.
    h.clock.advance(60_000);
    await h.adapter.tick();

    expect(h.spy.forUrl(ROBOTS_URL)).toHaveLength(2);
  });
});
