/**
 * CA-2.1 y CA-2.2 — contención EN EJECUCIÓN (ADR-014 §4, ADR-016).
 *
 * LA TRAMPA BAJÓ AL SOCKET, y no es un refinamiento: el mecanismo anterior era
 * falso. Sustituía por trampas los MÓDULOS de red en el registro que el runner
 * gobierna —`vi.mock('node:net')` y compañía—, y una dependencia de
 * `node_modules` está EXTERNALIZADA: abre sus sockets por debajo de ese
 * registro. Medido, no supuesto: con `cheerio.fromURL` saliendo por la puerta
 * de atrás, `containment.test.ts` daba 13/13 y la trampa registraba CERO
 * disparos mientras un paquete real llegaba a un servidor (F-SPEC-008-V15).
 *
 * Ahora la trampa va sobre `net.Socket.prototype.connect`, que es EL PUNTO POR
 * EL QUE PASA TODA SALIDA DE SOCKET DEL PROCESO —lo atraviesan
 * `cheerio.fromURL` (por `undici`), `globalThis.fetch`, `node:http`,
 * `net.connect` y `net.createConnection`, y también el TLS, porque `TLSSocket`
 * no tiene `connect` propio—. El criterio exige LA PROPIEDAD Y NO EL SÍMBOLO:
 * una trampa puesta solo sobre `net.connect` NO ve `node:http`, que captura su
 * fábrica de conexión al cargarse. Si la plataforma mueve el punto, se mueve el
 * test y no el criterio, y lo que avisa es el caso 16.
 *
 * LAS TRAMPAS SE INSTALAN ANTES DE CUALQUIER `import` DE `src/`, y por eso este
 * fichero no tiene un solo import estático de `@/…`: una segunda puerta puede
 * capturar la referencia en el ámbito del módulo —`const { fetch: send } =
 * globalThis`, que es exactamente F-SPEC-008-V6— e instalarla después la
 * dejaría pasar. EL ORDEN ES UN MECANISMO DE ESTE CRITERIO y tiene su propio
 * control: el caso 17 (F-SPEC-008-V17).
 *
 * NINGUNA PETICIÓN SALE HACIA UN TERCERO. La trampa DENIEGA por defecto, y solo
 * un caso que lo pide explícitamente deja pasar una conexión, siempre a un
 * servidor local propio en `127.0.0.1` (RN-11).
 *
 * Quedan fuera de la atribución `@vercel/blob` y `postgres`: son nuestra propia
 * infraestructura, están declarados en CA-2.3, y RN-11 habla de la fuente, no
 * del almacén. Aquí no se toca ninguno de los dos.
 */
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { Socket } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as cheerio from 'cheerio';
import { afterAll, describe, expect, test, vi } from 'vitest';
import { reachableModules } from '../mirror/support/imports';
import { ENTRY_POINTS } from './support/capability';
// `import type` se borra por completo (`verbatimModuleSyntax`), así que NO es
// un `import` de `src/` en ejecución y no adelanta nada a las trampas.
import type { Server } from 'node:http';
import type { HttpFetcher } from '@/polite/http';

// ─────────────────────────────────────────────────────────────────────────────
// El registro de disparos, y los dos puntos donde se pone la trampa.
// ─────────────────────────────────────────────────────────────────────────────

interface Trip {
  /** Qué puerta se abrió. */
  readonly gate: string;
  readonly url: string;
  /** La pila del disparo: es lo que atribuye la salida a un fichero. */
  readonly stack: string;
}

const trips: Trip[] = [];

function record(gate: string, url: string): void {
  trips.push({ gate, url, stack: new Error(`network trap: ${gate}`).stack ?? '' });
}

/** Un destino de `127.0.0.1`, que es el único que un control puede permitir. */
const LOOPBACK = /^(?:127\.0\.0\.1|::1|localhost)(?::|$)/;

/** Qué deja pasar la trampa del socket. `none` es el estado normal. */
const socketTrap = { allow: 'none' as 'none' | 'loopback' };

interface ConnectOptions {
  readonly host?: string;
  readonly hostname?: string;
  readonly port?: number | string;
  readonly path?: string;
}

/**
 * Host y puerto de una llamada a `connect`.
 *
 * Node normaliza los argumentos antes de llegar aquí: `args[0]` es un
 * array-like `[options, callback]`, sea cual sea la forma con la que se llamó.
 */
function connectTarget(args: readonly unknown[]): string {
  const first = args[0];
  const indexed =
    first !== null && typeof first === 'object' && '0' in first
      ? (first as Record<string, unknown>)['0']
      : first;

  if (indexed === null || typeof indexed !== 'object') return 'unreadable-target';

  const options = indexed as ConnectOptions;
  const host = options.host ?? options.hostname ?? options.path ?? '?';
  return options.port === undefined ? host : `${host}:${String(options.port)}`;
}

interface MutableSocketPrototype {
  connect: (this: Socket, ...args: unknown[]) => Socket;
}

const socketPrototype = Socket.prototype as unknown as MutableSocketPrototype;
const REAL_CONNECT = socketPrototype.connect;
const REAL_FETCH = globalThis.fetch;

// ── INSTALACIÓN DE LAS TRAMPAS ───────────────────────────────────────────────
// Va aquí, y aquí es load-bearing: por encima no hay ni un `import` de `src/`.

socketPrototype.connect = function (this: Socket, ...args: unknown[]): Socket {
  const target = connectTarget(args);
  record('net.Socket.connect', target);
  if (socketTrap.allow === 'none' || !LOOPBACK.test(target)) {
    throw new Error(`network trap: socket to ${target}`);
  }
  return REAL_CONNECT.apply(this, args);
};

const ROBOTS_TXT = ['User-agent: *', 'Disallow: /zzmap_v3.php', ''].join('\n');
const PAGE_HTML = '<html><body><table id="fixture_games"></table></body></html>';

function urlOf(input: unknown): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return String((input as { url?: unknown }).url ?? input);
}

/**
 * Lo que la red simulada contesta. Es una VARIABLE y no una rama dentro de la
 * trampa a propósito: un caso que quisiera otro `robots.txt` cambiaría esto y
 * NUNCA `globalThis.fetch`. Reasignar el global después de los `import` sería
 * exactamente el error que este fichero existe para no cometer — un módulo que
 * capturó la referencia en su ámbito seguiría con la anterior, y el caso
 * mediría el orden de las asignaciones en vez de la contención.
 */
let robotsTxt = ROBOTS_TXT;

globalThis.fetch = (async (input: unknown): Promise<Response> => {
  const url = urlOf(input);
  record('globalThis.fetch', url);
  return url.endsWith('/robots.txt')
    ? new Response(robotsTxt, { status: 200 })
    : new Response(PAGE_HTML, { status: 200 });
}) as typeof globalThis.fetch;

// ─────────────────────────────────────────────────────────────────────────────
// Las simulaciones de módulos de `src/`. `vi.mock` se iza por encima de todo.
// ─────────────────────────────────────────────────────────────────────────────

/** CA-2.1 — cuántas veces se llamó a `politeFetch`, la única salida legítima. */
const polite = vi.hoisted(() => ({ calls: [] as string[] }));

vi.mock('@/polite/http', async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  const real = original['politeFetch'] as (...args: unknown[]) => Promise<unknown>;

  return {
    ...original,
    politeFetch: async (...args: unknown[]): Promise<unknown> => {
      const url = args[1];
      polite.calls.push(typeof url === 'string' ? url : JSON.stringify(url ?? ''));
      return await real(...args);
    },
  };
});

/** CA-2.2 — la política REAL, instrumentada: a qué URL dijo que sí. */
const policy = vi.hoisted(() => ({ asked: [] as string[], allowed: [] as string[] }));

vi.mock('@/polite/robots', async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  const realParse = original['parseRobots'] as (
    text: string,
    userAgent: string,
  ) => { isAllowed(url: string): boolean };

  return {
    ...original,
    parseRobots: (text: string, userAgent: string) => {
      const real = realParse(text, userAgent);
      return {
        isAllowed(url: string): boolean {
          const verdict = real.isAllowed(url);
          policy.asked.push(url);
          if (verdict) policy.allowed.push(url);
          return verdict;
        },
      };
    },
  };
});

// A partir de aquí, y SOLO a partir de aquí, entra `src/`.
const { globalFetcher } = await import('@/polite/http');
const { RobotsGate } = await import('@/polite/policy');
const { MemoryRateLimit } = await import('@/polite/rate-limit');
const { USER_AGENT } = await import('@/polite/user-agent');
const { SourceAdapter } = await import('@/ingest/adapter');
const { CEROACERO_ENTRY, sourceRegistry } = await import('@/ingest/sources');
const { DiskRawStore } = await import('@/raw/disk');
const { Capturer } = await import('@/mirror/capture/capturer');
const { robotsRegistry, parseRobots } = await import('@/polite/robots');
const capturarCli = await import('@/mirror/cli/capturar');
// Se cargan los grafos de las otras dos CLI: una puerta que capture la
// referencia en el ámbito del módulo dispararía aquí.
await import('@/mirror/cli/analizar');
await import('@/mirror/cli/analizar-sin-referencia');

const START = '2026-09-06T17:00:00.000Z';
const EXIT_DOOR = 'src/polite/http.ts';

const clock = { now: () => START as never };

afterAll(() => {
  socketPrototype.connect = REAL_CONNECT;
  globalThis.fetch = REAL_FETCH;
});

// ─────────────────────────────────────────────────────────────────────────────
// Un servidor local propio. NUNCA un tercero (RN-11).
// ─────────────────────────────────────────────────────────────────────────────

interface LocalServer {
  readonly origin: string;
  /** Las peticiones que LLEGARON, con su `User-Agent` o `null`. */
  readonly received: { path: string; ua: string | null }[];
  close(): Promise<void>;
}

async function localServer(): Promise<LocalServer> {
  const received: { path: string; ua: string | null }[] = [];
  const server: Server = createServer((request, response) => {
    received.push({ path: request.url ?? '', ua: request.headers['user-agent'] ?? null });
    response.setHeader('content-type', 'text/html');
    // Sin `keep-alive` no queda ningún socket vivo que cerrar a la brava, que
    // es lo que hacía saltar un `ECONNRESET` sin dueño al cerrar el servidor.
    response.setHeader('connection', 'close');
    response.end('<html><body><table><tr><td>a</td></tr><tr><td>b</td></tr></table></body></html>');
  });
  server.keepAliveTimeout = 1;
  server.on('connection', (socket) => socket.on('error', () => undefined));

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number };

  return {
    origin: `http://127.0.0.1:${address.port}`,
    received,
    close: async () => {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}

/** Un control que sale de verdad, y solo a `127.0.0.1`. */
async function allowingLoopback<T>(run: () => Promise<T>): Promise<T> {
  socketTrap.allow = 'loopback';
  try {
    return await run();
  } finally {
    socketTrap.allow = 'none';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Los dos juicios, escritos como funciones para que los controles muerdan.
// ─────────────────────────────────────────────────────────────────────────────

/** CA-2.1 — un disparo sin `src/polite/http.ts` en su pila es una segunda puerta. */
function unattributed(list: readonly Trip[]): readonly Trip[] {
  return list.filter((trip) => !trip.stack.includes(EXIT_DOOR));
}

/**
 * CA-2.2 — contención de conjuntos: lo que salió está dentro de lo que la
 * política contestó `true`, con UNA excepción nombrada — el `robots.txt` de un
 * origen, que es la única petición que ninguna política puede gatear
 * (ADR-014 §3.1).
 */
function ungated(list: readonly Trip[], allowed: readonly string[]): readonly string[] {
  const permitted = new Set(allowed);
  return [...new Set(list.map((trip) => trip.url))].filter(
    (url) => !permitted.has(url) && !url.endsWith('/robots.txt'),
  );
}

function reset(): void {
  trips.length = 0;
  polite.calls.length = 0;
  policy.asked.length = 0;
  policy.allowed.length = 0;
}

/** Un `HttpFetcher` doble: no toca la plataforma, así que no puede disparar. */
function doubleFetcher() {
  const requests: string[] = [];
  return {
    requests,
    fetcher: {
      fetch: (request: { url: string }) => {
        requests.push(request.url);
        return Promise.resolve({
          status: 200,
          body: new TextEncoder().encode(
            request.url.endsWith('/robots.txt') ? ROBOTS_TXT : PAGE_HTML,
          ),
        });
      },
    },
  };
}

function ingestAdapter(fetcher: HttpFetcher) {
  const store = new DiskRawStore(join(RAW_ROOT, `ingest-${Math.random().toString(36).slice(2)}`));
  const registry = sourceRegistry([
    { ...CEROACERO_ENTRY, competitions: [CEROACERO_ENTRY.competitions[0]!] },
  ]);

  return {
    registry,
    adapter: new SourceAdapter({
      registry,
      fetcher,
      store,
      clock,
      robots: new RobotsGate({ fetcher, store, userAgent: USER_AGENT }),
      rateLimit: new MemoryRateLimit(),
      resolver: { resolve: () => Promise.resolve(null) },
    }),
  };
}

const RAW_ROOT = await mkdtemp(join(tmpdir(), 'containment-'));

describe('CA-2.1 — la única salida que se dispara es la de `src/polite/http.ts`', () => {
  test('1. la trampa está puesta y muerde: el escenario mide algo', async () => {
    reset();
    await globalFetcher.fetch({ url: 'https://www.ceroacero.es/robots.txt', headers: {} });

    expect(trips).toHaveLength(1);
    expect(trips[0]?.gate).toBe('globalThis.fetch');

    // Y la del socket también, con una conexión cruda hacia fuera: se registra
    // Y SE DENIEGA, porque una trampa que deja pasar el paquete no es trampa.
    reset();
    expect(() => new Socket().connect({ host: '192.0.2.1', port: 80 })).toThrow(/network trap/);
    expect(trips.map((trip) => trip.gate)).toEqual(['net.Socket.connect']);
  });

  test('2. el camino de `src/ingest/` con el `globalFetcher` REAL: todo atribuido', async () => {
    reset();
    const { adapter, registry } = ingestAdapter(globalFetcher);

    await adapter.tick();

    // Algo salió, o el caso no prueba nada.
    expect(trips.length).toBeGreaterThan(0);
    // Y todo lo que salió lleva la puerta en su pila.
    expect(unattributed(trips)).toEqual([]);
    // Y el número de disparos coincide con el de llamadas a `politeFetch`.
    expect(trips).toHaveLength(polite.calls.length);
    expect(trips.map((trip) => trip.url).sort()).toEqual([...polite.calls].sort());
    expect(registry.targets()).toHaveLength(1);
  });

  test('3. la CLI de captura de `src/mirror/`, conducida entera: todo atribuido', async () => {
    reset();
    const cwd = process.cwd();
    const work = await mkdtemp(join(tmpdir(), 'capturar-'));

    try {
      await writeFile(join(work, 'robots-ceroacero.txt'), ROBOTS_TXT, 'utf8');
      await writeFile(
        join(work, 'config.json'),
        JSON.stringify({
          window: 'containment',
          duration_minutes: 1,
          tick_seconds: 60,
          targets: [
            {
              source: 'ceroacero',
              competition_id: 'futgal-preferente-g1',
              url: 'https://www.ceroacero.es/edicion/contencion/1',
              ext: 'html',
            },
          ],
          robots_files: { 'https://www.ceroacero.es': 'robots-ceroacero.txt' },
        }),
        'utf8',
      );

      process.chdir(work);
      await capturarCli.main([join(work, 'config.json'), join(work, 'log.json')]);
    } finally {
      process.chdir(cwd);
    }

    expect(trips.length).toBeGreaterThan(0);
    expect(unattributed(trips)).toEqual([]);
    expect(trips).toHaveLength(polite.calls.length);
  });

  test('4. con un `HttpFetcher` DOBLE no se dispara ninguna trampa', async () => {
    reset();
    const spy = doubleFetcher();
    const { adapter } = ingestAdapter(spy.fetcher);

    await adapter.tick();

    // El camino se recorrió entero…
    expect(spy.requests.length).toBeGreaterThan(0);
    expect(polite.calls.length).toBeGreaterThan(0);
    // …y no tocó la plataforma ni una vez.
    expect(trips).toEqual([]);
  });

  test('5. y el `Capturer` del instrumento, con un doble, tampoco', async () => {
    reset();
    const spy = doubleFetcher();
    const store = new DiskRawStore(join(RAW_ROOT, 'capturer'));

    const capturer = new Capturer({
      targets: [
        {
          source: 'ceroacero' as never,
          competition_id: 'futgal-preferente-g1' as never,
          url: 'https://www.ceroacero.es/edicion/contencion/2',
          ext: 'html',
        },
      ],
      fetcher: spy.fetcher,
      store,
      clock,
      robots: robotsRegistry([['https://www.ceroacero.es', parseRobots(ROBOTS_TXT, USER_AGENT)]]),
      rateLimit: new MemoryRateLimit(),
    });

    await capturer.tick();

    expect(spy.requests).toHaveLength(1);
    expect(trips).toEqual([]);
  });

  test('6. control positivo: una segunda puerta se dispara Y NO se atribuye', async () => {
    // F-SPEC-008-V6, ejecutada: `const { fetch: send } = globalThis` con la
    // cabecera armada por `join`. Con el guardián viejo convivía con la suite
    // entera en verde. Aquí la trampa la caza, porque la trampa ES lo que hay
    // en `globalThis.fetch` — da igual cómo se escriba la línea.
    reset();
    const { fetch: send } = globalThis;
    const KEY = ['User', 'Agent'].join('-');
    const headers: Record<string, string> = {};
    headers[KEY] = USER_AGENT;
    await send('https://www.ceroacero.es/edicion/por-la-puerta-de-atras/9', { headers });

    expect(trips).toHaveLength(1);
    // Y lo que la hace una INFRACCIÓN y no una salida: su pila no nombra la
    // puerta. Si algún día este caso diera `[]`, la atribución dejó de medir.
    expect(unattributed(trips)).toHaveLength(1);
    expect(polite.calls).toEqual([]);
  });

  test("7. control positivo: `import('node:' + 'http')` no esquiva la trampa", async () => {
    // F-SPEC-008-V7, ejecutada. En estático es roja por construcción
    // (CA-2.3, caso 5); aquí se comprueba lo otro que hace falta: que un
    // especificador calculado no sirve de nada, porque la trampa NO vive en el
    // registro de módulos —vive en el objeto por el que pasa la capacidad—.
    // `node:http` es además el caso que una trampa puesta solo sobre
    // `net.connect` NO vería: captura su fábrica de conexión al cargarse.
    reset();
    const gate = (await import('node:' + 'http')) as unknown as {
      request: (url: string) => { on(event: string, handler: (error: Error) => void): void };
    };

    const failure = await new Promise<Error>((resolve) => {
      try {
        gate.request('http://127.0.0.1:1/tarde/1').on('error', resolve);
      } catch (error) {
        resolve(error as Error);
      }
    });

    expect(failure.message).toMatch(/network trap/);
    expect(trips).toHaveLength(1);
    expect(unattributed(trips)).toHaveLength(1);
  });
});

describe('CA-2.2 — ninguna petición sale sin que la política real haya dicho que sí', () => {
  test('8. lo que salió está CONTENIDO en lo que la política permitió', async () => {
    reset();
    const { adapter, registry } = ingestAdapter(globalFetcher);

    await adapter.tick();

    // La política real fue consultada, y de verdad: no es un doble.
    expect(policy.asked).toContain(registry.targets()[0]!.url);
    expect(policy.allowed).toContain(registry.targets()[0]!.url);
    // Y el conjunto de lo que salió cabe dentro, salvo el `robots.txt`.
    expect(ungated(trips, policy.allowed)).toEqual([]);
    expect(trips.some((trip) => trip.url.endsWith('/robots.txt'))).toBe(true);
  });

  test('9. una URL que la política PROHÍBE no sale', async () => {
    reset();
    robotsTxt = ['User-agent: *', 'Disallow: /edicion/', ''].join('\n');

    try {
      const { adapter, registry } = ingestAdapter(globalFetcher);
      const records = await adapter.tick();

      expect(records.map((record) => record.outcome)).toEqual(['skipped']);
      expect(policy.allowed).toEqual([]);
      expect(trips.map((trip) => trip.url)).toEqual([
        `${new URL(registry.targets()[0]!.url).origin}/robots.txt`,
      ]);
      expect(ungated(trips, policy.allowed)).toEqual([]);
    } finally {
      robotsTxt = ROBOTS_TXT;
    }
  });

  test('10. control positivo: una petición cuyo permiso lo concedió otro código', async () => {
    // El test tiene que ponerse rojo si sale una petición que la política real
    // no permitió. Se comprueba sobre el juicio, no sobre el árbol: es la
    // forma que tendría un segundo parser que SÍ decidiera (CA-2.8).
    reset();
    await globalFetcher.fetch({
      url: 'https://www.ceroacero.es/edicion/nadie-pregunto/7',
      headers: { 'User-Agent': USER_AGENT },
    });

    expect(policy.allowed).toEqual([]);
    expect(ungated(trips, policy.allowed)).toEqual([
      'https://www.ceroacero.es/edicion/nadie-pregunto/7',
    ]);
  });

  test('11. y el `robots.txt` es la ÚNICA excepción, nombrada', () => {
    const sample: Trip[] = [
      { gate: 'globalThis.fetch', url: 'https://x.es/robots.txt', stack: EXIT_DOOR },
      { gate: 'globalThis.fetch', url: 'https://x.es/pagina', stack: EXIT_DOOR },
    ];

    expect(ungated(sample, ['https://x.es/pagina'])).toEqual([]);
    expect(ungated(sample, [])).toEqual(['https://x.es/pagina']);
  });
});

describe('CA-2.8 — lo que este criterio NO promete, dicho dentro del criterio', () => {
  test('12. la plataforma sigue teniendo su `fetch`: la trampa es del test, no del código', () => {
    // Si esto fallara, el fichero habría dejado el proceso roto para el resto
    // de la suite, y un test que rompe a los demás no es evidencia de nada.
    expect(typeof REAL_FETCH).toBe('function');
    expect(globalThis.fetch).not.toBe(REAL_FETCH);
    expect(typeof REAL_CONNECT).toBe('function');
    expect(socketPrototype.connect).not.toBe(REAL_CONNECT);
  });

  test('13. el residuo es finito y nombrable, y aquí queda acotado', async () => {
    // CA-2.1 sólo ve los caminos que se ejecutan. Aquí se conducen dos puntos
    // de entrada con el `globalFetcher` real: el API público de `src/ingest/`
    // y la CLI de captura. Los demás no se conducen — y lo que acota el
    // residuo es que NINGUNO DE ELLOS PUEDE ALCANZAR LA PUERTA por el grafo de
    // imports: sin `src/polite/http.ts` en su grafo no hay salida legítima que
    // conducir, y cualquier otra sería roja en estático por CA-2.3 o CA-2.4.
    const DRIVEN = ['src/ingest/adapter.ts', 'src/mirror/cli/capturar-cli.ts'];

    for (const entry of ENTRY_POINTS) {
      if (DRIVEN.includes(entry)) continue;
      const graph = await reachableModules([entry]);
      expect([...graph], `${entry} alcanza la puerta y no se conduce`).not.toContain(EXIT_DOOR);
    }

    // Y los dos que sí se conducen la alcanzan, o el caso no medía nada.
    for (const entry of DRIVEN) {
      expect([...(await reachableModules([entry]))]).toContain(EXIT_DOOR);
    }
  });
});

/**
 * CA-2.1 — los controles del mecanismo, que son PARTE DEL CRITERIO.
 *
 * «La trampa no se da por buena porque exista: se mide.» Los tres primeros son
 * los que la enmienda del 2026-09-01 exige; el cuarto es el orden de
 * instalación, que el CA declara mecanismo a efectos de CA-2.7.
 */
describe('CA-2.1 — la trampa se mide, no se supone', () => {
  test('14. control positivo: una DEPENDENCIA de `node_modules` dispara la trampa', async () => {
    // Es la reproducción exacta de F-SPEC-008-V15. `cheerio.fromURL` va por
    // `undici`, que vitest EXTERNALIZA, así que sus `node:net`/`node:tls` no
    // pasaban por el registro de módulos que el mecanismo anterior sustituía:
    // salía un paquete de verdad y la trampa registraba CERO disparos. Contra
    // el socket, se ve.
    reset();
    const server = await localServer();

    try {
      const $ = await allowingLoopback(async () => await cheerio.fromURL(`${server.origin}/x`));

      // El paquete salió de verdad —el servidor local lo vio, y SIN
      // `User-Agent`, que es media RN-11 incumplida—…
      expect($('tr')).toHaveLength(2);
      expect(server.received).toHaveLength(1);
      expect(server.received[0]?.ua).toBeNull();
      // …y la trampa lo vio salir, y no lo atribuye a la puerta.
      expect(trips.map((trip) => trip.gate)).toEqual(['net.Socket.connect']);
      expect(unattributed(trips)).toHaveLength(1);
      expect(polite.calls).toEqual([]);
    } finally {
      await server.close();
    }
  });

  test('15. control positivo: la trampa puede NEGAR, no solo contar', async () => {
    // Una trampa que cuenta y no puede impedir demuestra observación, no
    // contención. Negando, el paquete no llega al servidor local.
    reset();
    const server = await localServer();

    try {
      await expect(cheerio.fromURL(`${server.origin}/y`)).rejects.toThrow(/network trap/);

      expect(trips.map((trip) => trip.gate)).toEqual(['net.Socket.connect']);
      expect(server.received).toEqual([]);
    } finally {
      await server.close();
    }
  });

  test('16. el punto es una PROPIEDAD, no un símbolo: lo atraviesan las cinco puertas', async () => {
    // Medido el 2026-09-01 sobre Node 26 y escrito como caso para que el día
    // que la plataforma mueva el punto se entere alguien. `node:http` es el
    // que una trampa puesta solo sobre `net.connect` NO vería.
    const net = await import('node:net');
    const http = await import('node:http');

    const doors: readonly (readonly [string, (origin: string) => Promise<unknown>])[] = [
      ['globalThis.fetch (el real)', async (origin) => await (await REAL_FETCH(origin)).text()],
      ['cheerio.fromURL', async (origin) => await cheerio.fromURL(origin)],
      [
        'node:http.get',
        async (origin) =>
          await new Promise((resolve) => {
            http.get(origin, (response) => {
              response.resume();
              response.on('end', resolve);
            });
          }),
      ],
      [
        'net.connect',
        async (origin) =>
          await new Promise((resolve) => {
            const socket = net.connect(Number(new URL(origin).port), '127.0.0.1', () => {
              socket.destroy();
              resolve(null);
            });
            socket.on('error', () => undefined);
          }),
      ],
      [
        'net.createConnection',
        async (origin) =>
          await new Promise((resolve) => {
            const socket = net.createConnection(
              { port: Number(new URL(origin).port), host: '127.0.0.1' },
              () => {
                socket.destroy();
                resolve(null);
              },
            );
            socket.on('error', () => undefined);
          }),
      ],
    ];

    for (const [name, drive] of doors) {
      reset();
      const server = await localServer();
      try {
        await allowingLoopback(async () => await drive(server.origin));
        expect(trips.map((trip) => trip.gate), `${name} no pasa por el punto`).toContain(
          'net.Socket.connect',
        );
      } finally {
        await server.close();
      }
    }
  });

  test('17. y el ORDEN de instalación es un mecanismo, con su control (F-SPEC-008-V17)', async () => {
    // Mover la instalación después del primer `import` de `src/` —sin ninguna
    // otra mutación— dejaba los trece casos en verde, y el CA declara el orden
    // load-bearing con esas palabras: «instalarla después la dejaría pasar».
    // Un formateador o una limpieza que mueva esas dos líneas degrada CA-2.1 en
    // silencio, y esto es lo único que puede verlo.
    const source = await readFile(new URL(import.meta.url), 'utf8');

    const socketInstall = source.indexOf('socketPrototype.connect = function');
    const fetchInstall = source.indexOf('globalThis.fetch = (async');
    const firstSrcImport = source.indexOf("await import('@/");

    expect(socketInstall).toBeGreaterThan(-1);
    expect(fetchInstall).toBeGreaterThan(-1);
    expect(firstSrcImport).toBeGreaterThan(-1);
    expect(socketInstall).toBeLessThan(firstSrcImport);
    expect(fetchInstall).toBeLessThan(firstSrcImport);

    // Y no hay ningún `import` estático de `src/` que se adelante a las dos:
    // los `import type` se borran enteros y no cuentan.
    expect(source).not.toMatch(/^import\s+(?!type\b)[^;]*from\s+'@\//m);
  });
});
