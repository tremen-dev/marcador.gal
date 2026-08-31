/**
 * CA-2 (RN-11) — cortesía comprobable, no prometida.
 *
 * Two halves. The first is robots.txt: a forbidden path produces zero requests
 * and one recorded skip WITH a reason, because "we respected robots.txt" has
 * to be something the archive can be asked, not something a comment claims.
 * The second is the User-Agent: identifiable, with a contact, on every request
 * that leaves — and test 6 is the one that matters, because it fails if a new
 * exit path is ever added that builds a request by hand.
 */
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { Capturer } from '@/mirror/capture/capturer';
import { MissingUserAgentError, politeRequest } from '@/mirror/capture/http';
import { allowAllRobots, parseRobots, robotsRegistry } from '@/mirror/capture/robots';
import { USER_AGENT, USER_AGENT_PATTERN } from '@/mirror/user-agent';
import { FakeClock } from '../support/fake-clock';
import { MemoryRawStore } from '../support/memory-store';
import { spyFetcher } from '../support/spy-fetcher';
import { CEROACERO, TERCERA } from '../support/targets';

const START = '2026-09-05T17:00:00.000Z';

const ROBOTS_TXT = `# fixture
User-agent: *
Disallow: /edicion/
Allow: /edicion/publica/

User-agent: BadBot
Disallow: /
`;

const FORBIDDEN = 'https://www.ceroacero.es/edicion/tercera-rfef-grupo-1/live';
const ALLOWED = 'https://www.ceroacero.es/edicion/publica/tercera-rfef-grupo-1';

function capturerFor(url: string) {
  const clock = new FakeClock(START);
  const spy = spyFetcher(clock);
  const capturer = new Capturer({
    targets: [{ source: CEROACERO, competition_id: TERCERA, url, ext: 'html' }],
    fetcher: spy.fetcher,
    store: new MemoryRawStore(),
    clock,
    robots: robotsRegistry([
      ['https://www.ceroacero.es', parseRobots(ROBOTS_TXT, USER_AGENT)],
    ]),
  });
  return { spy, capturer };
}

describe('CA-2 (RN-11) — robots.txt', () => {
  test('1. una ruta prohibida no se pide, y queda registrada como omitida con motivo', async () => {
    const { spy, capturer } = capturerFor(FORBIDDEN);

    await capturer.tick();

    expect(spy.requests).toHaveLength(0);
    const ticks = capturer.log().ticks;
    expect(ticks).toHaveLength(1);
    expect(ticks[0]!.outcome).toBe('skipped');
    expect(ticks[0]!.reason).toMatch(/robots/i);
    expect(ticks[0]!.reason).toContain('/edicion/tercera-rfef-grupo-1/live');
  });

  test('2. una ruta permitida se pide una vez, con la UA exacta', async () => {
    const { spy, capturer } = capturerFor(ALLOWED);

    await capturer.tick();

    expect(spy.requests).toHaveLength(1);
    expect(spy.requests[0]!.headers['User-Agent']).toBe(USER_AGENT);
    expect(capturer.log().ticks[0]!.outcome).toBe('ok');
  });

  test('3. un host sin robots.txt cargado se omite: no se presume permiso', async () => {
    const clock = new FakeClock(START);
    const spy = spyFetcher(clock);
    const capturer = new Capturer({
      targets: [
        { source: CEROACERO, competition_id: TERCERA, url: 'https://otro.example/x', ext: 'html' },
      ],
      fetcher: spy.fetcher,
      store: new MemoryRawStore(),
      clock,
      robots: robotsRegistry([['https://www.ceroacero.es', allowAllRobots()]]),
    });

    await capturer.tick();

    expect(spy.requests).toHaveLength(0);
    expect(capturer.log().ticks[0]!.outcome).toBe('skipped');
    expect(capturer.log().ticks[0]!.reason).toMatch(/robots\.txt/);
  });

  test('4. el grupo que manda es el nuestro, no el del primer bloque del fichero', () => {
    const policy = parseRobots(
      'User-agent: BadBot\nDisallow: /\n\nUser-agent: *\nDisallow: /privado/\n',
      USER_AGENT,
    );

    expect(policy.isAllowed('https://x.example/publico')).toBe(true);
    expect(policy.isAllowed('https://x.example/privado/a')).toBe(false);
  });

  test('5. entre Allow y Disallow gana la regla más específica', () => {
    const policy = parseRobots(ROBOTS_TXT, USER_AGENT);

    expect(policy.isAllowed(FORBIDDEN)).toBe(false);
    expect(policy.isAllowed(ALLOWED)).toBe(true);
  });
});

describe('CA-2 (RN-11) — user-agent', () => {
  test('6. la UA declarada es identificable y lleva contacto', () => {
    expect(USER_AGENT).toMatch(USER_AGENT_PATTERN);
    expect(USER_AGENT).toContain('marcador.gal');
  });

  test('7. construir una petición sin UA no compila un camino alternativo: lanza', () => {
    expect(() => politeRequest('https://x.example/a', '')).toThrow(MissingUserAgentError);
    expect(() => politeRequest('https://x.example/a', '   ')).toThrow(MissingUserAgentError);
  });

  test('8. politeRequest es el ÚNICO camino de salida del módulo de captura', async () => {
    const dir = join(process.cwd(), 'src/mirror/capture');
    const files = (await readdir(dir)).filter((f) => f.endsWith('.ts'));
    const callers: string[] = [];

    for (const file of files) {
      const source = await readFile(join(dir, file), 'utf8');
      // Strip block comments so prose about `.fetch(` does not count.
      const code = source.replaceAll(/\/\*[\s\S]*?\*\//g, '');
      if (/\.fetch\s*\(/.test(code)) callers.push(file);
    }

    // If a second file ever calls the fetcher directly, it will not have gone
    // through politeRequest and RN-11's user-agent duty stops being provable.
    expect(callers).toEqual(['http.ts']);
  });

  test('9. toda petición que sale lleva la cabecera, sin excepción', async () => {
    const { spy, capturer } = capturerFor(ALLOWED);

    await capturer.tick();
    await capturer.tick();

    expect(spy.requests.length).toBeGreaterThan(0);
    for (const request of spy.requests) {
      expect(request.headers['User-Agent']).toBe(USER_AGENT);
    }
  });
});
