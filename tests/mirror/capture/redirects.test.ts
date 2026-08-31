/**
 * CA-10 (RN-11) — ninguna petición cambia de host en silencio.
 *
 * Es F-SPEC-002-22, y este modo lo vuelve inmediato: `resultados-futbol.com`
 * hace **301 entero a `besoccer.es`** (ADR-008 §2), así que el par de la
 * ventana sin referencia apunta hoy a un host que se alcanza por redirección.
 * Siguiendo la redirección, el capturador pediría permiso a un `robots.txt` y
 * descargaría de **otro**, archivando HTML bajo el `SourceId` equivocado:
 * incumple RN-11 sin que ningún test se ponga rojo y contamina el único
 * artefacto que sobrevive al spike.
 *
 * Un 3xx es un **fallo**, no un rescate: que la fuente se haya mudado es un
 * hecho que el operador tiene que ver, no algo que el capturador resuelva por
 * su cuenta. Como ninguna petición cambia de host, la URL sobre la que se
 * comprobó `robots.txt` y la descargada son la misma **por construcción**.
 *
 * Los dos primeros casos usan `globalFetcher` contra servidores locales de
 * verdad, porque el fallo que se cierra vive exactamente ahí: en el `fetch` de
 * la plataforma, que sigue redirecciones salvo que se le diga que no.
 */
import { readFile, readdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { Capturer } from '@/mirror/capture/capturer';
import { globalFetcher } from '@/mirror/capture/http';
import { allowAllRobots, robotsRegistry } from '@/mirror/capture/robots';
import { FakeClock } from '../support/fake-clock';
import { MemoryRawStore } from '../support/memory-store';
import { CEROACERO, TERCERA } from '../support/targets';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

const START = '2026-09-05T17:00:00.000Z';

/** A server that answers 200 with a body, and one that 301s to its origin. */
let destination: Server;
let mover: Server;
let destinationOrigin: string;
let moverOrigin: string;

async function listen(server: Server): Promise<string> {
  await new Promise<void>((ready) => server.listen(0, '127.0.0.1', ready));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

beforeAll(async () => {
  destination = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/html' });
    response.end('<html><body><table></table></body></html>');
  });
  destinationOrigin = await listen(destination);

  mover = createServer((_request, response) => {
    response.writeHead(301, { location: `${destinationOrigin}/directo` });
    response.end();
  });
  moverOrigin = await listen(mover);
});

afterAll(async () => {
  await new Promise<void>((closed) => destination.close(() => closed()));
  await new Promise<void>((closed) => mover.close(() => closed()));
});

function capturerFor(url: string) {
  const store = new MemoryRawStore();
  const capturer = new Capturer({
    targets: [{ source: CEROACERO, competition_id: TERCERA, url, ext: 'html' }],
    fetcher: globalFetcher,
    store,
    clock: new FakeClock(START),
    // robots.txt is not what is under test here: the point is that even with
    // permission for the URL we ASKED for, the bytes of another host never
    // reach the archive.
    robots: robotsRegistry([[url, allowAllRobots()]]),
  });
  return { store, capturer };
}

describe('CA-10 (RN-11) — un 3xx es un fallo, no un rescate', () => {
  test('1. un 301 a otro origen no se sigue: cero capturas archivadas', async () => {
    const { store, capturer } = capturerFor(`${moverOrigin}/tercera/directo`);

    await capturer.tick();

    expect(store.size).toBe(0);
  }, 30_000);

  test('2. y queda un tick failed cuyo motivo lleva el código, la URL pedida y el Location', async () => {
    const requested = `${moverOrigin}/tercera/directo`;
    const { capturer } = capturerFor(requested);

    await capturer.tick();

    const ticks = capturer.log().ticks;
    expect(ticks).toHaveLength(1);
    expect(ticks[0]!.outcome).toBe('failed');
    expect(ticks[0]!.reason).toContain('301');
    expect(ticks[0]!.reason).toContain(requested);
    expect(ticks[0]!.reason).toContain(`${destinationOrigin}/directo`);
    expect(ticks[0]!.raw_ref).toBeNull();
  }, 30_000);

  test('3. un 200 se archiva igual que siempre: sin regresión', async () => {
    const { store, capturer } = capturerFor(`${destinationOrigin}/tercera/directo`);

    await capturer.tick();

    expect(capturer.log().ticks[0]!.outcome).toBe('ok');
    expect(store.size).toBe(1);
  }, 30_000);
});

describe('CA-10 (RN-11) — la puerta única no sigue redirecciones', () => {
  test('4. ningún camino de salida construye una petición sin redirect: manual', async () => {
    const dir = join(process.cwd(), 'src/mirror/capture');
    const files = (await readdir(dir)).filter((file) => file.endsWith('.ts'));
    const platformCallers: string[] = [];
    const manual: string[] = [];

    for (const file of files) {
      const source = await readFile(join(dir, file), 'utf8');
      // Strip comments so prose about `redirect: 'manual'` does not count as
      // an implementation, the way case 8 of robots.test.ts strips them.
      const code = source
        .replaceAll(/\/\*[\s\S]*?\*\//g, '')
        .replaceAll(/\/\/.*$/gm, '')
        // A method SIGNATURE — `fetch(request: X): Promise<Y>;` — is a
        // declaration of the port, not a call to the platform. A call has no
        // return-type annotation after its parentheses.
        .replaceAll(/^\s*fetch\s*\([^)]*\)\s*:.*$/gm, '');
      if (!/globalThis\.fetch\s*\(|(?<![.\w])fetch\s*\(/.test(code)) continue;
      platformCallers.push(file);
      if (/redirect\s*:\s*'manual'/.test(code)) manual.push(file);
    }

    // Hermano del caso 8 de robots.test.ts: si aparece un segundo camino de
    // salida que llama al fetch de la plataforma, tendrá que declararlo también.
    expect(platformCallers).toEqual(['http.ts']);
    expect(manual).toEqual(platformCallers);
  });
});
