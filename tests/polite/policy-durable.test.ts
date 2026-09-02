/**
 * CA-3 (mitad de unidad) — la vigencia del `robots.txt` sobrevive al proceso
 * (ADR-019 §4, ADR-014, RN-10, RN-11).
 *
 * El gate durable reparte la memoria entre lo que ya existe: EL ARCHIVO
 * recuerda lo que volvió (el `robots.txt` más reciente bajo
 * `<source>/robots/` dentro de las 6 h, releído y parseado con `parseRobots`)
 * y EL TURNO DURABLE recuerda lo que salió (el derecho a intentar un refresco,
 * clave `robots/<origin>`). Aquí se prueba el gate solo, con dobles; la
 * conducción por ticks con Postgres de verdad es de `tests/db/`.
 */
import { describe, expect, test } from 'vitest';
import { DurablePolicyGate, robotsTurnKey } from '@/polite/policy-durable';
import { MemoryRateLimit } from '@/polite/rate-limit';
import { ROBOTS_MAX_AGE_MS } from '@/polite/policy';
import { USER_AGENT } from '@/polite/user-agent';
import { FakeClock, MemoryRawStore, spyFetcher } from '../ingest/support/doubles';
import type { RateLimit } from '@/polite/rate-limit';
import type { RawStore } from '@/raw/store';
import type { HttpRequest, HttpResponse } from '@/polite/http';

const ORIGIN = 'https://www.exemplo-sintetico.es';
const PAGE_URL = `${ORIGIN}/edicion/competicion-sintetica/1`;
const FORBIDDEN_URL = `${ORIGIN}/privado/nada`;
const ROBOTS_URL = `${ORIGIN}/robots.txt`;

const ROBOTS_TXT = ['User-agent: *', 'Disallow: /privado/', ''].join('\n');

const serveRobots = (request: HttpRequest): HttpResponse =>
  request.url === ROBOTS_URL
    ? { status: 200, body: new TextEncoder().encode(ROBOTS_TXT) }
    : { status: 200, body: new TextEncoder().encode('<html></html>') };

const serveNoRobots = (request: HttpRequest): HttpResponse =>
  request.url === ROBOTS_URL
    ? { status: 404, body: new Uint8Array() }
    : { status: 200, body: new TextEncoder().encode('<html></html>') };

/** Una composición NUEVA, como un arranque en frío: solo persisten los puertos. */
function freshGate(
  store: RawStore,
  rateLimit: RateLimit,
  clock: FakeClock,
  respond: (request: HttpRequest) => HttpResponse = serveRobots,
) {
  const spy = spyFetcher(clock, respond);
  const gate = new DurablePolicyGate({
    fetcher: spy.fetcher,
    store,
    rateLimit,
    userAgent: USER_AGENT,
  });
  return { gate, spy };
}

describe('CA-3.1 — el primer uso pide el robots, lo archiva ANTES de parsear, y decide', () => {
  test('pide una vez, archiva bajo `<source>/robots/…` y permite la página', async () => {
    const store = new MemoryRawStore();
    const clock = new FakeClock('2026-09-06T17:00:00.000Z');
    const { gate, spy } = freshGate(store, new MemoryRateLimit(), clock);

    const decision = await gate.allows(PAGE_URL, 'exemplo', clock.now());

    expect(decision.allowed).toBe(true);
    expect(decision.reason).toBeNull();
    expect(spy.forUrl(ROBOTS_URL)).toHaveLength(1);
    // Archivado bajo la clave de ADR-014 §3.4, y la decisión lo referencia.
    expect(store.keys.filter((key) => key.startsWith('exemplo/robots/'))).toHaveLength(1);
    expect(decision.policyRawRef).toBe(store.keys[0]);
  });

  test('RN-10 como estructura: si el archivo revienta, no se parsea y el error sale', async () => {
    const store = new MemoryRawStore();
    const failing: RawStore = {
      put: () => Promise.reject(new Error('blob is down')),
      get: (key) => store.get(key),
      list: (prefix) => store.list(prefix),
    };
    const clock = new FakeClock('2026-09-06T17:00:00.000Z');
    const { gate } = freshGate(failing as unknown as MemoryRawStore, new MemoryRateLimit(), clock);

    await expect(gate.allows(PAGE_URL, 'exemplo', clock.now())).rejects.toThrow(/blob is down/);
  });
});

describe('CA-3.2 y CA-3.3 — la vigencia vive en el archivo, no en la instancia', () => {
  test('composición nueva dentro de las 6 h: decide SIN pedir el robots', async () => {
    const store = new MemoryRawStore();
    const rhythm = new MemoryRateLimit();
    const clock = new FakeClock('2026-09-06T17:00:00.000Z');

    await freshGate(store, rhythm, clock).gate.allows(PAGE_URL, 'exemplo', clock.now());

    clock.advance(60_000);
    const second = freshGate(store, rhythm, clock);
    const decision = await second.gate.allows(PAGE_URL, 'exemplo', clock.now());

    expect(decision.allowed).toBe(true);
    expect(second.spy.forUrl(ROBOTS_URL)).toHaveLength(0);
    // Y aplica la política releída: la ruta prohibida sigue prohibida.
    const forbidden = await second.gate.allows(FORBIDDEN_URL, 'exemplo', clock.now());
    expect(forbidden.allowed).toBe(false);
    expect(forbidden.reason).toMatch(/robots\.txt disallows \/privado\/nada \(RN-11\)/);
  });

  test('pasadas las 6 h, la siguiente composición lo pide UNA vez y sigue', async () => {
    const store = new MemoryRawStore();
    const rhythm = new MemoryRateLimit();
    const clock = new FakeClock('2026-09-06T17:00:00.000Z');

    await freshGate(store, rhythm, clock).gate.allows(PAGE_URL, 'exemplo', clock.now());

    clock.advance(ROBOTS_MAX_AGE_MS);
    const later = freshGate(store, rhythm, clock);
    const decision = await later.gate.allows(PAGE_URL, 'exemplo', clock.now());

    expect(decision.allowed).toBe(true);
    expect(later.spy.forUrl(ROBOTS_URL)).toHaveLength(1);
    expect(store.keys.filter((key) => key.startsWith('exemplo/robots/'))).toHaveLength(2);
  });
});

describe('CA-3.4 — sin robots servido: fallo cerrado, y el reintento con turno durable', () => {
  test('sin política y sin refresco logrado, nada sale y el motivo lo dice', async () => {
    const store = new MemoryRawStore();
    const clock = new FakeClock('2026-09-06T17:00:00.000Z');
    const { gate, spy } = freshGate(store, new MemoryRateLimit(), clock, serveNoRobots);

    const decision = await gate.allows(PAGE_URL, 'exemplo', clock.now());

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/no robots\.txt policy in force/);
    expect(decision.reason).toMatch(/RN-11/);
    expect(spy.forUrl(ROBOTS_URL)).toHaveLength(1);
    expect(spy.forUrl(PAGE_URL)).toHaveLength(0);
  });

  test('dos composiciones en el mismo minuto: UN intento de robots, no dos', async () => {
    const store = new MemoryRawStore();
    const rhythm = new MemoryRateLimit();
    const clock = new FakeClock('2026-09-06T17:00:00.000Z');

    const first = freshGate(store, rhythm, clock, serveNoRobots);
    await first.gate.allows(PAGE_URL, 'exemplo', clock.now());

    const second = freshGate(store, rhythm, clock, serveNoRobots);
    const decision = await second.gate.allows(PAGE_URL, 'exemplo', clock.now());

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/RN-11/);
    expect(second.spy.forUrl(ROBOTS_URL)).toHaveLength(0);

    // Con el minuto cumplido, el derecho a reintentar vuelve.
    clock.advance(60_000);
    const third = freshGate(store, rhythm, clock, serveNoRobots);
    await third.gate.allows(PAGE_URL, 'exemplo', clock.now());
    expect(third.spy.forUrl(ROBOTS_URL)).toHaveLength(1);
  });

  test('la clave del turno es la del origen, aparte del par (ADR-014 §3.2)', () => {
    expect(robotsTurnKey(ORIGIN)).toBe(`robots/${ORIGIN}`);
  });
});
