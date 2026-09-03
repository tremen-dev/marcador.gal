/**
 * SPEC-016 — el catálogo de corresponsales se resuelve en COMPILACIÓN.
 *
 * The defect this file guards is one the suite CANNOT see on its own: under
 * Node, `fileURLToPath(new URL('../../corresponsais', import.meta.url))` is a
 * perfectly ordinary path computation and every test stayed green, while the
 * bundler reads the same expression as a REFERENCE TO A RESOURCE resolved at
 * build time and `npm run build` failed. The real guardian of that is the
 * bundler itself (CA-3.1, now a gate); what these cases hold is the shape that
 * makes the bundler right: a static `import` and a CLOSED REGISTRY of seasons.
 *
 * ADR-022 §2 already said «validado con zod e importado como módulo». This is
 * not a new design; it is the ADR restored.
 */
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  SEASON_CATALOGS,
  UndeclaredSeasonError,
  catalogFileName,
  emptyCatalog,
  loadCatalog,
} from '@/bot/catalog';
import { ACTIVE_SEASON } from '@/ingest/measurement';
import { stripComments } from '../site/source-scan';

const CATALOG_SOURCE = join(process.cwd(), 'src', 'bot', 'catalog.ts');
const CATALOGS_DIR = join(process.cwd(), 'corresponsais');

/** A catalogue that zod must refuse WHOLE (SPEC-015 CA-2.8, not relaxed). */
const POISONED = {
  season: '2026/27',
  correspondents: [
    { correspondent_id: 'corresponsal-01', competitions: ['c'], alta: '2026-03-01', activo: true },
    { correspondent_id: 'corresponsal-xove', competitions: ['c'], alta: '2026-03-01', activo: true },
  ],
};

describe('CA-1 — el catálogo entra en el paquete en tiempo de compilación', () => {
  test('1. `catalog.ts` no lee disco ni calcula rutas: ni `readFile`, ni `fileURLToPath`, ni `join`, ni `CATALOG_DIR`', async () => {
    const code = stripComments(await readFile(CATALOG_SOURCE, 'utf8'));

    expect(code).not.toMatch(/readFile/);
    expect(code).not.toMatch(/fileURLToPath/);
    expect(code).not.toMatch(/import\.meta\.url/);
    expect(code).not.toMatch(/\bjoin\b/);
    expect(code).not.toMatch(/CATALOG_DIR/);
    expect(code).not.toMatch(/node:fs/);
  });

  test('2. y el contenido llega por `import` estático del JSON versionado, con atributo de tipo', async () => {
    const code = stripComments(await readFile(CATALOG_SOURCE, 'utf8'));

    // El atributo de tipo es lo que hace que Node y el empaquetador lo lean
    // igual, que es exactamente lo que faltaba.
    expect(code).toMatch(
      /import\s+\w+\s+from\s+'\.\.\/\.\.\/corresponsais\/2026-27\.json'\s+with\s+\{\s*type:\s*'json'\s*\}/,
    );
  });

  test('3. sigue pasando por `parseCatalog`: un catálogo sintético inválido se rechaza ENTERO', () => {
    expect(() => loadCatalog('2026/27', new Map([['2026/27', POISONED]]))).toThrow(/invalid_format|regex/);
  });

  test('4. y una clave de más también, porque el esquema estricto de SPEC-015 no se relaja', () => {
    const extra = {
      season: '2026/27',
      correspondents: [{ ...POISONED.correspondents[0], telegram_user_id: 1 }],
    };

    expect(() => loadCatalog('2026/27', new Map([['2026/27', extra]]))).toThrow(/unrecognized|Unrecognized/);
  });

  test('5. `loadCatalog` es SÍNCRONA: no devuelve promesa y no hay E/S que esperar', () => {
    const catalog = loadCatalog(ACTIVE_SEASON);

    expect(catalog).not.toBeInstanceOf(Promise);
    expect(catalog.season).toBe(ACTIVE_SEASON);
    expect(catalog.correspondents).toEqual([]);
  });

  test('6. `emptyCatalog` NO es el camino de fallo de `loadCatalog`, solo lo que su nombre dice', async () => {
    const code = stripComments(await readFile(CATALOG_SOURCE, 'utf8'));
    const body = /export function loadCatalog[\s\S]*?\n\}/.exec(code)?.[0] ?? '';

    expect(body).not.toBe('');
    expect(body).not.toMatch(/emptyCatalog/);
    // Y sigue existiendo, construido a propósito y vacío.
    expect(emptyCatalog('2026/27').correspondents).toEqual([]);
  });
});

describe('CA-2 — la temporada se selecciona por un registro declarado', () => {
  test('7. el registro es cerrado y hoy tiene exactamente una entrada: `2026/27`', () => {
    expect([...SEASON_CATALOGS.keys()]).toEqual(['2026/27']);
  });

  test('8. para cada entrada, la clave es idéntica al campo `season` de su JSON', () => {
    for (const [season, declared] of SEASON_CATALOGS) {
      // Copiar el fichero del año pasado bajo una clave nueva serviría la
      // temporada equivocada en silencio; esto lo impide.
      expect(loadCatalog(season).season).toBe(season);
      expect((declared as { season: string }).season).toBe(season);
    }
  });

  test('9. `ACTIVE_SEASON` es una clave del registro', () => {
    expect([...SEASON_CATALOGS.keys()]).toContain(ACTIVE_SEASON);
  });

  test('10. una temporada no declarada LANZA, nombrando la pedida y las declaradas', () => {
    const thrown = ((): unknown => {
      try {
        return loadCatalog('2099/00');
      } catch (error) {
        return error;
      }
    })();

    expect(thrown).toBeInstanceOf(UndeclaredSeasonError);
    expect((thrown as Error).message).toContain('2099/00');
    expect((thrown as Error).message).toContain('2026/27');
  });

  test('11. y NUNCA devuelve un catálogo vacío, que es la configuración normal del bot apagado', () => {
    // Un vacío por error sería indistinguible del funcionamiento correcto.
    // Fallo cerrado y RUIDOSO.
    expect(() => loadCatalog('2027/28')).toThrow(UndeclaredSeasonError);
    expect(() => loadCatalog('')).toThrow(UndeclaredSeasonError);
  });

  test('12. cada clave del registro tiene su fichero en `corresponsais/`, y no sobra ninguno', async () => {
    // Este caso lee disco, y PUEDE: corre bajo Node, nunca dentro del paquete.
    const onDisk = (await readdir(CATALOGS_DIR)).filter((name) => name.endsWith('.json')).sort();
    const declared = [...SEASON_CATALOGS.keys()].map(catalogFileName).sort();

    expect(declared).toEqual(onDisk);
  });

  test('13. y el nombre del fichero sigue derivándose de la temporada de la RFGF', () => {
    expect(catalogFileName('2026/27')).toBe('2026-27.json');
  });
});
