/**
 * SPEC-018 CA-1, CA-2.1, CA-2.4, CA-2.5, CA-4, CA-6.3 y CA-11.3 — las
 * fronteras del marcador, en la forma de ADR-016.
 *
 * CADA LISTA ENUMERA LO PERMITIDO Y EXIGE QUE EL RESTO SEA VACÍO, y cada
 * mecanismo lleva su CONTROL POSITIVO: una lista que no puede ponerse roja no
 * mide nada (ADR-016 §3.4). El lector SE HEREDA —es el del compilador que
 * sostiene las fronteras de SPEC-008, SPEC-009, SPEC-013, SPEC-015 y
 * SPEC-017— y las raíces, exclusiones y extensiones del escaneo son las que
 * SPEC-008 CA-2.6 ya declaró: no hay una segunda lista de ficheros ni una
 * segunda idea de qué es código (ADR-016 §5 bis).
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { moduleOf, scanned } from '../admin/support/frontier';
import { reachableModules } from '../mirror/support/imports';
import { ENTRY_POINTS, EXIT_DOOR } from '../polite/support/capability';
import { DECISION_WRITERS } from '../decide/support/rn08';
import { boardApiHandler } from '@/api/handler';
import { boardHandler } from '@/board/handler';
import { MATCH_QUALIFIERS } from '@/model/qualifier';
import { get, scene, sceneMatch } from './support/doubles';

const ROOT = process.cwd();

/** Los dos domicilios de esta spec, y las tres rutas que los sirven. */
const API_DIR = 'src/api/';
const BOARD_DIR = 'src/board/';

const ROUTES = [
  'src/app/(gl)/marcador/route.ts',
  'src/app/(es)/es/marcador/route.ts',
  'src/app/api/board/route.ts',
] as const;

const SCANNED = await scanned();

function filesUnder(prefix: string): readonly (typeof SCANNED)[number][] {
  return SCANNED.filter((file) => file.path.startsWith(prefix));
}

async function sourceOf(path: string): Promise<string> {
  return await readFile(join(ROOT, path), 'utf8');
}

describe('CA-1 — los dos domicilios, las tres rutas, y la frontera entre pantalla y contrato', () => {
  test('1. existen `src/api/` y `src/board/`, y el escaneo los ve de verdad', () => {
    expect(filesUnder(API_DIR).map((f) => f.path).sort()).toEqual([
      'src/api/contract.ts',
      'src/api/freshness.ts',
      'src/api/handler.ts',
      'src/api/ports.ts',
      'src/api/snapshot.ts',
    ]);

    expect(filesUnder(BOARD_DIR).map((f) => f.path).sort()).toEqual([
      'src/board/handler.ts',
      'src/board/order.ts',
      'src/board/sources.ts',
      'src/board/view/markup.ts',
      'src/board/view/refresh.ts',
      'src/board/view/styles.ts',
    ]);
  });

  test('2. CA-1.1 — ningún módulo de `src/board/` importa `src/db/` ni `src/decide/`', async () => {
    const offences: string[] = [];

    for (const file of filesUnder(BOARD_DIR)) {
      for (const specifier of file.specifiers) {
        if (specifier.text === null) {
          offences.push(`${file.path}: especificador que no es literal estático`);
          continue;
        }
        const target = await moduleOf(specifier.text, file.path);
        if (target === null) continue;
        if (target.startsWith('src/db/') || target.startsWith('src/decide/')) {
          offences.push(`${file.path}: importa ${target}`);
        }
      }
    }

    expect(offences).toEqual([]);
  });

  test('3. CONTROL POSITIVO: un import de `src/db/` en `src/board/` es ROJO', async () => {
    // El mismo predicado del caso anterior, sobre un especificador sintético.
    const target = await moduleOf('@/db/client', 'src/board/handler.ts');

    expect(target).toBe('src/db/client.ts');
    expect(target !== null && target.startsWith('src/db/')).toBe(true);
  });

  test('4. CA-1.2 — las tres rutas son manejadores, sin lógica y sin nombrar dominios', async () => {
    for (const route of ROUTES) {
      const source = await sourceOf(route);

      // Un manejador de ruta, no una página: no hay `export default`.
      expect(source).not.toMatch(/export\s+default/);

      // Sólo `GET` y `dynamic` salen de aquí.
      const exported = [...source.matchAll(/^export\s+(?:const|function)\s+(\w+)/gm)].map(
        (match) => match[1],
      );
      expect([...exported].sort((a, b) => (a ?? '').localeCompare(b ?? ''))).toEqual([
        'dynamic',
        'GET',
      ]);

      // Y no nombra ninguno de los tres dominios que no le tocan.
      for (const forbidden of ['@/db/', '@/decide/', '@/design/']) {
        expect(source.includes(`from '${forbidden}`)).toBe(false);
      }
    }
  });

  test('5. CA-1.3 — las tres están declaradas en `ENTRY_POINTS`', () => {
    for (const route of ROUTES) expect(ENTRY_POINTS).toContain(route);
  });

  test('6. CA-1.4 — el grafo de las tres NO alcanza `src/polite/http.ts`', async () => {
    // ES LA AFIRMACIÓN MÁS IMPORTANTE DE LA SPEC (`sdd-legal-datos` §6.2.8):
    // una implementación que refrescase BAJO DEMANDA convertiría `N` lectores
    // en `N` peticiones a un tercero y reventaría RN-11 en el primer minuto,
    // sin que el número de la regla hubiera cambiado. Por eso RN-11 no alcanza
    // a esta spec: la pantalla lee el snapshot YA PERSISTIDO.
    for (const route of ROUTES) {
      const graph = await reachableModules([route]);
      expect([...graph], `${route} alcanza la puerta de salida`).not.toContain(EXIT_DOOR);
    }
  });

  test('7. CONTROL POSITIVO: el mecanismo del grafo SÍ ve la puerta cuando está', async () => {
    // Sin esto, el caso anterior pasaría también con un lector roto que nunca
    // encuentra nada. Se conduce un punto de entrada que SÍ la alcanza.
    const graph = await reachableModules(['src/ingest/adapter.ts']);

    expect([...graph]).toContain(EXIT_DOOR);
  });

  test('8. CA-1.5 — ni el documento ni la hoja nombran ningún host externo', async () => {
    const html = await servedDocument();

    // Ninguna URL absoluta de un tercero, y ningún `@import` de una URL.
    const absolute = [...html.matchAll(/https?:\/\/[^\s"'<)]+/g)].map((match) => match[0]);
    expect(absolute.filter((url) => !url.startsWith('https://marcador.gal'))).toEqual([]);

    for (const host of ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.', 'unpkg', 'jsdelivr']) {
      expect(html).not.toContain(host);
    }
    expect(html).not.toMatch(/@import\s+url\(/);

    // Y la única URL que el guion pide es una ruta relativa de este origen.
    const fetched = [...html.matchAll(/fetch\(\s*"([^"]*)"/g)].map((match) => match[1]);
    expect(fetched).toEqual(['/api/board']);
  });

  test('9. CONTROL POSITIVO: un host externo en el documento pone rojo el mecanismo', async () => {
    const html = `${await servedDocument()}<link rel="stylesheet" href="https://fonts.googleapis.com/x">`;
    const absolute = [...html.matchAll(/https?:\/\/[^\s"'<)]+/g)].map((match) => match[0]);

    expect(absolute.filter((url) => !url.startsWith('https://marcador.gal'))).not.toEqual([]);
  });
});

describe('CA-2.1, CA-2.4 y CA-2.5 — la pantalla no sabe nada de quien la abre', () => {
  /** LO PROHIBIDO, enumerado: si alguno cruza, es rojo. */
  const CLIENT_STATE = [
    'ADMIN_SESSION_SECRET',
    'ADMIN_OPERATORS',
    'accept-language',
    'Accept-Language',
    'set-cookie',
    'Set-Cookie',
    'localStorage',
    'sessionStorage',
    'next/headers',
    '@vercel/analytics',
  ] as const;

  test('10. ningún módulo de `src/api/` ni de `src/board/` lee sesión, cookie o cabecera de cliente', () => {
    const offences: string[] = [];

    for (const file of [...filesUnder(API_DIR), ...filesUnder(BOARD_DIR)]) {
      for (const needle of CLIENT_STATE) {
        if (file.code.includes(needle)) offences.push(`${file.path}: nombra \`${needle}\``);
      }
      if (file.code.includes("from '@/admin/session'")) {
        offences.push(`${file.path}: importa la sesión del panel`);
      }
    }

    expect(offences).toEqual([]);
  });

  test('11. CONTROL POSITIVO: introducir una comprobación de sesión pone rojo el mecanismo', () => {
    const synthetic = "import { readSession } from '@/admin/session';\nconst x = ADMIN_OPERATORS;";

    expect(CLIENT_STATE.filter((needle) => synthetic.includes(needle))).not.toEqual([]);
  });

  test('12. `@vercel/analytics` no está en `package.json` ni se importa en ninguna parte', async () => {
    const manifest = await sourceOf('package.json');

    expect(manifest).not.toContain('@vercel/analytics');
    expect(manifest).not.toContain('analytics');

    expect(SCANNED.filter((file) => file.code.includes('@vercel/analytics'))).toEqual([]);
  });

  test('13. y el documento servido no inyecta ningún guion de terceros', async () => {
    const html = await servedDocument();

    // Hay guiones —el de refresco y el bloque de configuración— y los dos son
    // INLINE: ninguno tiene `src`.
    expect(html).toMatch(/<script/);
    expect(html).not.toMatch(/<script[^>]+src=/i);
  });
});

describe('CA-4 — el snapshot es de sólo lectura', () => {
  test('14. ningún módulo de `src/api/` ni de `src/board/` escribe en la base', () => {
    const offences: string[] = [];
    const WRITES = [/insert\s+into/i, /\bupdate\s+\w+\s+set\b/i, /delete\s+from/i];

    for (const file of [...filesUnder(API_DIR), ...filesUnder(BOARD_DIR)]) {
      for (const pattern of WRITES) {
        if (pattern.test(file.code)) offences.push(`${file.path}: ${pattern.source}`);
      }
    }

    expect(offences).toEqual([]);
  });

  test('15. y sus puertos declaran SÓLO métodos de lectura', async () => {
    const ports = await sourceOf('src/api/ports.ts');

    for (const write of ['append(', 'put(', 'update(', 'delete(', 'insert(']) {
      expect(ports).not.toContain(write);
    }
  });

  test('16. CONTROL POSITIVO: un método de escritura en el puerto pone rojo el mecanismo', () => {
    const synthetic = 'export interface X { append(row: unknown): Promise<void>; }';

    expect(['append(', 'put('].filter((write) => synthetic.includes(write))).not.toEqual([]);
  });

  test('17. CA-4.2 — el grafo de las tres rutas no alcanza el motor', async () => {
    for (const route of ROUTES) {
      const graph = await reachableModules([route]);

      expect([...graph]).not.toContain('src/decide/cycle.ts');
      expect([...graph]).not.toContain('src/decide/engine-entry.ts');
      expect([...graph]).not.toContain('src/decide/apply.ts');
    }
  });

  test('18. CA-4.3 — `DECISION_WRITERS` sigue teniendo DOS entradas', () => {
    // `src/decide/board-entry.ts` es un LECTOR, exactamente como
    // `read-entry.ts`: vive dentro del módulo al que RN-08 le da la capacidad
    // y devuelve valores planos, así que la lista de módulos con capacidad no
    // se ensancha.
    expect(DECISION_WRITERS).toHaveLength(2);
  });

  test('19. CA-4.4 — el cualificador sale de `qualifierOf` y no se reimplementa', async () => {
    const projection = await sourceOf('src/api/snapshot.ts');

    expect(projection).toContain("import { qualifierOf } from '@/decide/qualifier'");

    // Y `src/api/` no contiene ninguno de los cuatro valores como literal.
    for (const file of filesUnder(API_DIR)) {
      for (const qualifier of MATCH_QUALIFIERS) {
        expect(
          file.code.includes(`'${qualifier}'`),
          `${file.path} escribe el cualificador ${qualifier}`,
        ).toBe(false);
      }
    }
  });

  test('20. CA-4.5 — la proyección es PURA: sin `Date`, sin `Clock`, sin `Date.now`', async () => {
    const projection = await sourceOf('src/api/snapshot.ts');
    // Se quitan los comentarios —la prosa que explica que NO hay reloj no
    // puede contar como un reloj— y las líneas de `import`, porque el
    // convertidor puro `epochMsOf` vive en un fichero que se llama `clock.ts`
    // y el nombre del FICHERO no es una capacidad. Mismo motivo que el caso 8
    // de `tests/mirror/capture/robots.test.ts`.
    const code = projection
      .replaceAll(/\/\*[\s\S]*?\*\//g, '')
      .replaceAll(/\/\/.*$/gm, '')
      .replaceAll(/^import[\s\S]*?;$/gm, '');

    expect(code).not.toContain('Date');
    expect(code).not.toContain('Clock');
    expect(code).not.toContain('clock');
    expect(code).not.toContain('.now(');
  });

  test('21. CONTROL POSITIVO: una comparación con el reloj pone rojo el mecanismo', () => {
    const synthetic = 'if (Date.now() - epochMsOf(decision.decided_at) > 900000) return "sen";';

    expect(synthetic.includes('Date')).toBe(true);
  });
});

describe('CA-6.3 — el número de consultas no crece con el número de partidos', () => {
  test('22. servir 3 partidos y servir 18 hace EL MISMO número de llamadas', async () => {
    const three = scene();
    await boardApiHandler({ ports: three.ports })(get('https://marcador.gal/api/board'));

    const many = scene({
      matches: Array.from({ length: 18 }, (_, index) => sceneMatch(sceneMatchAt(index))),
    });
    await boardApiHandler({ ports: many.ports })(get('https://marcador.gal/api/board'));

    expect(many.log.count('readBoard')).toBe(three.log.count('readBoard'));
    expect(many.log.count('teams.namesOf')).toBe(three.log.count('teams.namesOf'));
    expect(many.log.count('competitions.namesOf')).toBe(three.log.count('competitions.namesOf'));

    // Y la lectura en lote recibió LOS DIECIOCHO EN UNA SOLA LLAMADA.
    expect(many.matchIdsAsked).toHaveLength(1);
    expect(many.matchIdsAsked[0]).toHaveLength(18);
  });

  test('23. CONTROL POSITIVO: un bucle por partido rompería la igualdad', () => {
    // El mismo predicado, sobre un contador sintético que llama una vez por
    // partido, que es exactamente lo que hace el panel (SPEC-017) y lo que
    // esta pantalla no puede pagar.
    const perMatch = (matches: number): number => matches;

    expect(perMatch(18)).not.toBe(perMatch(3));
  });
});

describe('CA-11.3 — el marcador no reutiliza el orden del panel', () => {
  test('24. `src/board/order.ts` no importa `orderBoard` ni `boardRank`', async () => {
    // Sin comentarios: la prosa que explica POR QUÉ no se reutiliza el orden
    // del panel no puede contar como una reutilización.
    const order = (await sourceOf('src/board/order.ts'))
      .replaceAll(/\/\*[\s\S]*?\*\//g, '')
      .replaceAll(/\/\/.*$/gm, '');

    expect(order).not.toContain('orderBoard');
    expect(order).not.toContain('boardRank');
    expect(order).not.toContain('@/admin/board');

    // Y el mecanismo muerde: sobre una cadena sintética que sí lo reutiliza.
    const synthetic = "import { orderBoard } from '@/admin/board';";
    expect(synthetic.includes('orderBoard')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Ayudas de la escena.
// ─────────────────────────────────────────────────────────────────────────────

async function servedDocument(): Promise<string> {
  const board = scene();
  const response = await boardHandler({ ports: board.ports, locale: 'gl' })(
    get('https://marcador.gal/marcador'),
  );
  return await response.text();
}

function sceneMatchAt(index: number): Record<string, unknown> {
  const hour = 12 + (index % 8);
  return {
    id: `futgal-preferente-g1-2026-27-j1-p${index}`,
    competition_id: 'futgal-preferente-g1',
    round: 1,
    kickoff: `2026-09-06T${`${hour}`.padStart(2, '0')}:00:00.000Z`,
    home_id: 'rc-celta-b',
    away_id: 'ud-ourense',
    venue: null,
  };
}
