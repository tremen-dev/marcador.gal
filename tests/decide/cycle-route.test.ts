/**
 * CA-12.2, CA-12.3 y CA-12.4 — la ruta cambia UNA línea, la enmienda de
 * ADR-015 está escrita, y las specs cerradas no ganan ni una línea.
 *
 * Y CA-10.4: `migrations/` no añade ninguna columna a las tablas del modelo
 * canónico, que es lo que permite derivar los cualificadores sin tocar
 * `src/model/` (ADR-021 §6, migración 0003).
 */
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { readSourceTree, stripComments } from '../support/source-tree';

const ROUTE = 'src/app/api/cron/ingest/route.ts';
const LEDGER_012 =
  'docs/epicas/EPIC-002-instrumentacion-de-las-cuatro-cifras/SPEC-012-cron-de-ingesta-el-tick-que-abre-ventanas-por-partido-y-persiste-observation.ledger.md';

const read = async (path: string): Promise<string> =>
  await readFile(join(process.cwd(), path), 'utf8');

describe('CA-12.2 — la ruta cambia SOLO la función que inyecta al handler', () => {
  test('1. inyecta el ciclo de `src/decide/` y sigue delegando la autenticación', async () => {
    const code = stripComments(await read(ROUTE));

    expect(code).toContain("import { productionCycle } from '@/decide/cycle';");
    expect(code).toContain("import { cronIngestHandler } from '@/ingest/cron';");
    expect(code).toContain('cronIngestHandler({ tick: productionCycle, env: process.env })');
    expect(code).not.toContain('productionCronTick');
  });

  test('2. y sigue sin contener lógica: ni condicional, ni base, ni secreto', async () => {
    const code = stripComments(await read(ROUTE));

    for (const forbidden of ['if (', 'CRON_SECRET', 'await ', 'sql', 'Response(']) {
      expect(code, `la ruta ha ganado lógica: ${forbidden}`).not.toContain(forbidden);
    }
    // Lo único que exporta: el modo dinámico y el `GET` que delega.
    expect(code).toContain("export const dynamic = 'force-dynamic';");
    expect(code).toContain('export function GET(request: Request): Promise<Response>');
    expect(code).toContain('return handler(request);');
  });

  test('3. `src/ingest/cron.ts` NO se toca: conserva sus tres exportaciones', async () => {
    const code = stripComments(await read('src/ingest/cron.ts'));

    expect(code).toContain("export const CRON_INGEST_PATH = '/api/cron/ingest';");
    expect(code).toContain('export function cronIngestHandler(');
    expect(code).toContain('export function productionCronTick(');
  });
});

describe('CA-12.3 — la enmienda de ADR-015 está escrita, con sus cinco partes', () => {
  test('4. bajo `## Enmienda —` en el ledger de SPEC-012, y nombra `SPEC-012 CA-7`', async () => {
    const ledger = await read(LEDGER_012);
    const headings = ledger.match(/^## Enmienda — .+$/gm) ?? [];

    expect(headings.length).toBeGreaterThanOrEqual(2);
    const letter = headings.find((heading) => heading.includes('LETRA de CA-7'));
    expect(letter, 'no hay enmienda de la letra de CA-7').toBeDefined();

    const body = ledger.slice(ledger.indexOf(letter!));
    expect(body).toContain('CA-7');
    expect(body).toContain('ADR-021 §4');
    expect(body).toContain('ADR-015');
  });

  test('5. y están los cinco puntos de ADR-015 §3', async () => {
    const ledger = await read(LEDGER_012);
    const start = ledger.indexOf('## Enmienda — 2026-09-02: SPEC-013 cambia la LETRA de CA-7');
    expect(start).toBeGreaterThan(-1);
    const body = ledger.slice(start, ledger.indexOf('## Enmienda —', start + 10));

    expect(body).toMatch(/1\. \*\*Qué afirmaba CA-7/);
    expect(body).toMatch(/2\. \*\*Qué lo invalida/);
    expect(body).toMatch(/3\. \*\*Con qué se sustituye/);
    expect(body).toMatch(/4\. \*\*El veredicto sigue en pie/);
    expect(body).toMatch(/5\. \*\*Qué lo despierta/);
  });

  test('6. y la migración 0006 tiene la suya, sobre la aserción enumerante de CA-6', async () => {
    const ledger = await read(LEDGER_012);
    const start = ledger.indexOf('## Enmienda — 2026-09-02: `migrations/0006`');
    expect(start).toBeGreaterThan(-1);
    const body = ledger.slice(start);

    expect(body).toMatch(/1\. \*\*Qué afirmaba CA-6/);
    expect(body).toMatch(/2\. \*\*Qué lo invalida/);
    expect(body).toMatch(/3\. \*\*Con qué se sustituye/);
    expect(body).toMatch(/4\. \*\*El veredicto sigue en pie/);
    expect(body).toMatch(/5\. \*\*Qué lo despierta/);
  });
});

describe('CA-12.4 — las specs cerradas no ganan ni una línea', () => {
  test('7. ni `src/ingest/`, ni `src/polite/`, ni `src/calendar/`, ni `src/alias/` importan `@/decide`', async () => {
    const tree = await readSourceTree();
    const closed = tree.filter((file) =>
      ['ingest/', 'polite/', 'calendar/', 'alias/'].some((dir) => file.path.startsWith(dir)),
    );

    expect(closed.length).toBeGreaterThanOrEqual(20);
    for (const file of closed) {
      expect(file.code, `${file.path} importa del motor`).not.toContain('@/decide');
    }
  });

  test('8. el ciclo compone sobre sus API PÚBLICAS, y va en la dirección correcta', async () => {
    const cycle = stripComments(await read('src/decide/cycle.ts'));

    expect(cycle).toContain("from '@/ingest/tick'");
    expect(cycle).toContain("from '@/ingest/windows'");
    expect(cycle).toContain("from '@/ingest/measurement'");
  });
});

describe('CA-10.4 — `migrations/` no gana ninguna columna del modelo canónico', () => {
  test('9. ninguna migración altera `decisions` ni `observations`', async () => {
    const dir = join(process.cwd(), 'migrations');
    const files = (await readdir(dir)).filter((file) => file.endsWith('.sql')).sort();

    expect(files).toContain('0006_alerts.sql');

    for (const file of files) {
      const text = (await readFile(join(dir, file), 'utf8')).toLowerCase();
      expect(text, `${file} altera una tabla del modelo canónico`).not.toMatch(
        /alter\s+table\s+(?:public\.)?(?:decisions|observations)\b/,
      );
    }
  });

  test('10. y `0006` crea UNA tabla, que no es del modelo canónico', async () => {
    const text = await readFile(join(process.cwd(), 'migrations/0006_alerts.sql'), 'utf8');

    expect(text.match(/create table /g)).toHaveLength(1);
    expect(text).toContain('create table alerts');
    expect(text).toContain('reject_amendment');
    expect(text).toMatch(/rule\s+text\s+not null check \(rule in \('RN-05', 'RN-07'\)\)/);
  });
});
