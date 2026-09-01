/**
 * CA-2.1 y CA-2.2 — contención EN EJECUCIÓN (ADR-014 §4, ADR-016).
 *
 * El criterio viejo leía el árbol buscando palabras y se rodeó siete veces en
 * dos vueltas. Éste no lee: **pone la trampa sobre la capacidad**. Se
 * sustituyen por trampas todas las salidas de red de la plataforma —
 * `globalThis.fetch` y `node:http`, `node:https`, `node:http2`, `node:net`,
 * `node:tls`, `node:dgram`— y luego se conducen los puntos de entrada. Toda
 * trampa que se dispara tiene que atribuirse, POR SU PILA, a
 * `src/polite/http.ts`.
 *
 * LAS TRAMPAS SE INSTALAN ANTES DE CUALQUIER `import` DE `src/`, y por eso este
 * fichero no tiene un solo import estático de `@/…`: una segunda puerta puede
 * capturar la referencia en el ámbito del módulo —`const { fetch: send } =
 * globalThis`, que es exactamente F-SPEC-008-V6— e instalarla después la
 * dejaría pasar. `vi.mock` se iza por encima de todo; el `globalThis.fetch` se
 * sustituye en el cuerpo, y los módulos de `src/` entran por `await import()`.
 *
 * Por qué esto no se rodea como se rodeaba lo anterior: `const { fetch: send }
 * = globalThis` OBTIENE LA TRAMPA, porque la trampa **es** lo que hay en
 * `globalThis.fetch`; y `await import('node:' + 'https')` obtiene el módulo
 * simulado, porque la simulación vive en el registro de módulos y no en el
 * texto del especificador. Ninguna de las dos depende de cómo se escriba la
 * línea.
 *
 * Quedan fuera de la atribución `@vercel/blob` y `postgres`: son nuestra
 * propia infraestructura, están en `ALLOWED_PACKAGES`, y RN-11 habla de la
 * fuente, no del almacén. Aquí no se toca ninguno de los dos.
 */
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test, vi } from 'vitest';
import { reachableModules } from '../mirror/support/imports';
import { ENTRY_POINTS } from './support/capability';
// `import type` se borra por completo (`verbatimModuleSyntax`), así que NO es
// un `import` de `src/` en ejecución y no adelanta nada a las trampas.
import type { HttpFetcher } from '@/polite/http';

// ─────────────────────────────────────────────────────────────────────────────
// Las trampas. `vi.hoisted` las construye por encima de todo lo demás.
// ─────────────────────────────────────────────────────────────────────────────

interface Trip {
  /** Qué puerta se abrió. */
  readonly gate: string;
  readonly url: string;
  /** La pila del disparo: es lo que atribuye la salida a un fichero. */
  readonly stack: string;
}

const trap = vi.hoisted(() => {
  const trips: { gate: string; url: string; stack: string }[] = [];

  const record = (gate: string, url: string): void => {
    trips.push({ gate, url, stack: new Error(`network trap: ${gate}`).stack ?? '' });
  };

  /**
   * Un módulo de red de la plataforma, con sus puertas sustituidas por
   * grabadoras que ADEMÁS lanzan: una trampa que dejase pasar el paquete no
   * sería una trampa. El resto del módulo se conserva —tipos, constantes— para
   * no romper por accidente a quien lo importe sin abrir nada.
   */
  const netModule = async (
    name: string,
    importOriginal: () => Promise<unknown>,
  ): Promise<Record<string, unknown>> => {
    const original = (await importOriginal()) as Record<string, unknown>;
    const door =
      (verb: string) =>
      (...args: unknown[]): never => {
        const first = args[0];
        record(`${name}.${verb}`, typeof first === 'string' ? first : JSON.stringify(first ?? ''));
        throw new Error(`network trap: ${name}.${verb}`);
      };

    const doors = {
      request: door('request'),
      get: door('get'),
      connect: door('connect'),
      createConnection: door('createConnection'),
      createSocket: door('createSocket'),
      Socket: door('Socket'),
    };

    return { ...original, ...doors, default: { ...original, ...doors } };
  };

  return { trips, record, netModule };
});

vi.mock('node:http', async (io) => trap.netModule('node:http', io));
vi.mock('node:https', async (io) => trap.netModule('node:https', io));
vi.mock('node:http2', async (io) => trap.netModule('node:http2', io));
vi.mock('node:net', async (io) => trap.netModule('node:net', io));
vi.mock('node:tls', async (io) => trap.netModule('node:tls', io));
vi.mock('node:dgram', async (io) => trap.netModule('node:dgram', io));

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

// ─────────────────────────────────────────────────────────────────────────────
// La red simulada: lo que la trampa contesta para que el camino siga vivo.
// ─────────────────────────────────────────────────────────────────────────────

const ROBOTS_TXT = ['User-agent: *', 'Disallow: /zzmap_v3.php', ''].join('\n');
const PAGE_HTML = '<html><body><table id="fixture_games"></table></body></html>';

function urlOf(input: unknown): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return String((input as { url?: unknown }).url ?? input);
}

const REAL_FETCH = globalThis.fetch;

globalThis.fetch = (async (input: unknown): Promise<Response> => {
  const url = urlOf(input);
  trap.record('globalThis.fetch', url);
  return url.endsWith('/robots.txt')
    ? new Response(ROBOTS_TXT, { status: 200 })
    : new Response(PAGE_HTML, { status: 200 });
}) as typeof globalThis.fetch;

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

// ─────────────────────────────────────────────────────────────────────────────
// Los dos juicios, escritos como funciones para que los controles muerdan.
// ─────────────────────────────────────────────────────────────────────────────

/** CA-2.1 — un disparo sin `src/polite/http.ts` en su pila es una segunda puerta. */
function unattributed(trips: readonly Trip[]): readonly Trip[] {
  return trips.filter((trip) => !trip.stack.includes(EXIT_DOOR));
}

/**
 * CA-2.2 — contención de conjuntos: lo que salió está dentro de lo que la
 * política contestó `true`, con UNA excepción nombrada — el `robots.txt` de un
 * origen, que es la única petición que ninguna política puede gatear
 * (ADR-014 §3.1).
 */
function ungated(trips: readonly Trip[], allowed: readonly string[]): readonly string[] {
  const permitted = new Set(allowed);
  return [...new Set(trips.map((trip) => trip.url))].filter(
    (url) => !permitted.has(url) && !url.endsWith('/robots.txt'),
  );
}

function reset(): void {
  trap.trips.length = 0;
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

    expect(trap.trips).toHaveLength(1);
    expect(trap.trips[0]?.gate).toBe('globalThis.fetch');
    // Y la trampa de los módulos también: se comprueba abriendo una de verdad.
    const https = await import('node:https');
    expect(() => (https as unknown as { request: (u: string) => void }).request('https://x/')).toThrow(
      /network trap/,
    );
    expect(trap.trips.map((trip) => trip.gate)).toContain('node:https.request');
  });

  test('2. el camino de `src/ingest/` con el `globalFetcher` REAL: todo atribuido', async () => {
    reset();
    const { adapter, registry } = ingestAdapter(globalFetcher);

    await adapter.tick();

    // Algo salió, o el caso no prueba nada.
    expect(trap.trips.length).toBeGreaterThan(0);
    // Y todo lo que salió lleva la puerta en su pila.
    expect(unattributed(trap.trips)).toEqual([]);
    // Y el número de disparos coincide con el de llamadas a `politeFetch`.
    expect(trap.trips).toHaveLength(polite.calls.length);
    expect(trap.trips.map((trip) => trip.url).sort()).toEqual([...polite.calls].sort());
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

    expect(trap.trips.length).toBeGreaterThan(0);
    expect(unattributed(trap.trips)).toEqual([]);
    expect(trap.trips).toHaveLength(polite.calls.length);
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
    expect(trap.trips).toEqual([]);
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
    expect(trap.trips).toEqual([]);
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

    expect(trap.trips).toHaveLength(1);
    // Y lo que la hace una INFRACCIÓN y no una salida: su pila no nombra la
    // puerta. Si algún día este caso diera `[]`, la atribución dejó de medir.
    expect(unattributed(trap.trips)).toHaveLength(1);
    expect(polite.calls).toEqual([]);
  });

  test('7. control positivo: `import(\'node:\' + \'https\')` obtiene el módulo simulado', async () => {
    // F-SPEC-008-V7, ejecutada. En estático es roja por construcción
    // (CA-2.3, caso 5); aquí se comprueba lo otro que hace falta: que la
    // trampa vive en el REGISTRO DE MÓDULOS, así que el especificador
    // calculado no la esquiva.
    reset();
    const gate = (await import('node:' + 'https')) as unknown as {
      request: (url: string) => void;
    };

    expect(() => gate.request('https://www.ceroacero.es/tarde/1')).toThrow(/network trap/);
    expect(trap.trips).toHaveLength(1);
    expect(unattributed(trap.trips)).toHaveLength(1);
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
    expect(ungated(trap.trips, policy.allowed)).toEqual([]);
    expect(trap.trips.some((trip) => trip.url.endsWith('/robots.txt'))).toBe(true);
  });

  test('9. una URL que la política PROHÍBE no sale', async () => {
    reset();
    const forbidding = ['User-agent: *', 'Disallow: /edicion/', ''].join('\n');
    const previous = globalThis.fetch;
    globalThis.fetch = (async (input: unknown): Promise<Response> => {
      const url = urlOf(input);
      trap.record('globalThis.fetch', url);
      return url.endsWith('/robots.txt')
        ? new Response(forbidding, { status: 200 })
        : new Response(PAGE_HTML, { status: 200 });
    }) as typeof globalThis.fetch;

    try {
      const { adapter, registry } = ingestAdapter(globalFetcher);
      const records = await adapter.tick();

      expect(records.map((record) => record.outcome)).toEqual(['skipped']);
      expect(policy.allowed).toEqual([]);
      expect(trap.trips.map((trip) => trip.url)).toEqual([
        `${new URL(registry.targets()[0]!.url).origin}/robots.txt`,
      ]);
      expect(ungated(trap.trips, policy.allowed)).toEqual([]);
    } finally {
      globalThis.fetch = previous;
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
    expect(ungated(trap.trips, policy.allowed)).toEqual([
      'https://www.ceroacero.es/edicion/nadie-pregunto/7',
    ]);
  });

  test('11. y el `robots.txt` es la ÚNICA excepción, nombrada', () => {
    const trips: Trip[] = [
      { gate: 'globalThis.fetch', url: 'https://x.es/robots.txt', stack: EXIT_DOOR },
      { gate: 'globalThis.fetch', url: 'https://x.es/pagina', stack: EXIT_DOOR },
    ];

    expect(ungated(trips, ['https://x.es/pagina'])).toEqual([]);
    expect(ungated(trips, [])).toEqual(['https://x.es/pagina']);
  });
});

describe('CA-2.8 — lo que este criterio NO promete, dicho dentro del criterio', () => {
  test('12. la plataforma sigue teniendo su `fetch`: la trampa es del test, no del código', () => {
    // Si esto fallara, el fichero habría dejado el proceso roto para el resto
    // de la suite, y un test que rompe a los demás no es evidencia de nada.
    expect(typeof REAL_FETCH).toBe('function');
    expect(globalThis.fetch).not.toBe(REAL_FETCH);
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
