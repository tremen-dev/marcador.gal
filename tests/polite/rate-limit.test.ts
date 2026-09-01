/**
 * CA-14 — the rhythm of RN-11 survives the process. The half that needs no
 * database: the port's shape (CA-14.1), the memory implementation against the
 * shared contract battery (CA-14.5), and the frontier with `src/mirror/`
 * (CA-14.8).
 *
 * The durable half lives in `tests/db/rate-limit.test.ts` and runs with
 * `npm run test:db`. Without `DATABASE_URL_TEST` those criteria are UNMET, not
 * skipped (gate of 2026-08-29).
 */
import { describe, expect, test } from 'vitest';
import { MIN_REQUEST_INTERVAL_MS, MemoryRateLimit, pairKey } from '@/polite/rate-limit';
import { readSourceTree } from '../support/source-tree';
import { rateLimitContract } from './rate-limit-contract';

rateLimitContract('MemoryRateLimit', (intervalMs) =>
  Promise.resolve(intervalMs === undefined ? new MemoryRateLimit() : new MemoryRateLimit(intervalMs)),
);

const TREE = await readSourceTree();

function fileAt(path: string): string {
  const file = TREE.find((entry) => entry.path === path);
  if (file === undefined) throw new Error(`${path} is not in the tree`);
  return file.code;
}

describe('CA-14.1 — el puerto tiene UNA operación: concede y sella a la vez', () => {
  test('1. la interfaz `RateLimit` declara exactamente un método', () => {
    // Entre preguntar y sellar cabe otra instancia, y ése es el fallo que
    // CA-14 arregla. Si el puerto recupera un `isDue`, este caso cae.
    const source = fileAt('polite/rate-limit.ts');
    const body = /export interface RateLimit\s*\{([\s\S]*?)\n\}/.exec(source)?.[1];

    expect(body, 'no existe `export interface RateLimit`').toBeDefined();
    const methods = [...body!.matchAll(/^\s{2}(\w+)\s*\(/gm)].map((match) => match[1]);
    expect(methods).toEqual(['takeTurn']);
  });

  test('2. no queda ninguna forma de preguntar sin sellar en `src/polite/`', () => {
    // `isDue`/`stamp` era el par que se sustituye. Que no exista en ningún
    // sitio es lo que impide reintroducir el hueco por descuido.
    for (const file of TREE) {
      expect(file.code, `${file.path} vuelve a partir el turno en dos`).not.toMatch(
        /\b(?:isDue|stamp)\s*\(/,
      );
    }
  });

  test('3. las implementaciones exponen ese método y nada más de cara al puerto', () => {
    const limit = new MemoryRateLimit();

    expect(typeof limit.takeTurn).toBe('function');
    expect(
      Object.getOwnPropertyNames(Object.getPrototypeOf(limit) as object).filter(
        (name) => name !== 'constructor',
      ),
    ).toEqual(['takeTurn']);
  });

  test('4. el puerto es OBLIGATORIO en las opciones del `SourceAdapter`, sin default', () => {
    const source = fileAt('ingest/adapter.ts');

    // Igual que `robots`: declarado sin `?` y sin `??` que lo rellene.
    expect(source).toMatch(/readonly rateLimit: RateLimit;/);
    expect(source).not.toMatch(/rateLimit\s*\?\s*:/);
    expect(source).not.toMatch(/rateLimit\s*\?\?/);
    // Y el adaptador ya no se fabrica el suyo.
    expect(source).not.toMatch(/new\s+\w*RateLimit\w*\s*\(/);
  });
});

describe('CA-14.8 — el instrumento se queda en memoria, y la ingesta no puede', () => {
  test('5. la CLI de `src/mirror/` construye la implementación EN MEMORIA', () => {
    expect(fileAt('mirror/cli/capturar.ts')).toMatch(/new MemoryRateLimit\s*\(/);
  });

  test('6. ningún módulo bajo `src/ingest/` puede construirla', () => {
    // No es «no la construye»: es que no la nombra, así que no la tiene a
    // mano. La frontera de §4 es exacta —lo desplegado usa el durable; lo que
    // un operador supervisa a mano, no— y ésta es la mitad que la vigila.
    const ingest = TREE.filter((file) => file.path.startsWith('ingest/'));

    expect(ingest.length).toBeGreaterThan(0);
    for (const file of ingest) {
      expect(file.code, `${file.path} nombra la implementación en memoria`).not.toMatch(
        /\bMemoryRateLimit\b/,
      );
    }
  });

  test('7. y el número sigue viviendo en `src/polite/rate-limit.ts`', () => {
    // CA-14.6: el intervalo no se muda a `src/db/` ni se reescribe en el SQL.
    expect(MIN_REQUEST_INTERVAL_MS).toBe(60_000);
    expect(fileAt('polite/rate-limit.ts')).toContain('export const MIN_REQUEST_INTERVAL_MS');

    const others = TREE.filter((file) => file.path !== 'polite/rate-limit.ts');
    for (const file of others) {
      expect(file.code, `${file.path} declara un segundo intervalo`).not.toMatch(
        /\bMIN_REQUEST_INTERVAL_MS\s*=/,
      );
    }
  });

  test('8. la clave sigue siendo el par (fuente, competición)', () => {
    expect(pairKey('ceroacero', 'rfef-tercera-g1')).toBe('ceroacero/rfef-tercera-g1');
  });
});
