/**
 * Las fronteras de capacidad de SPEC-017 — CA-1.7, CA-1.8, CA-1.9, CA-2.2,
 * CA-2.3, CA-2.4, CA-9.2, CA-9.5 y CA-13.
 *
 * Todas en la forma de ADR-016: se enumera lo permitido, se exige que el resto
 * sea VACÍO, hay control positivo POR MECANISMO, no hay ninguna exención por
 * nombre de fichero, y el residuo de cada una está declarado DENTRO del
 * criterio (en la spec) y repetido aquí donde el mecanismo juzga.
 */
import { describe, expect, test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { ENTRY_POINTS, syntheticFile, versionedSources } from '../polite/support/capability';
import { reachableModules } from '../mirror/support/imports';
import { DECISION_WRITERS } from '../decide/support/rn08';
import {
  ADMIN_DOMAIN,
  ADMIN_SECRET_NAMES,
  ADMIN_SECRET_READERS,
  DECISION_NAMES_FORBIDDEN_IN_ADMIN,
  MUTATED_TABLES,
  moduleOf,
  mutationOffences,
  nameOffences,
  scanned,
  textOffences,
} from './support/frontier';
import { ADMIN_OPERATORS_VARIABLE, ADMIN_SESSION_SECRET_VARIABLE } from '@/admin/session';
import { ADMIN_PATHS } from '@/admin/handler';

const SCANNED = await scanned();
const ADMIN_FILES = SCANNED.filter((file) => file.path.startsWith(ADMIN_DOMAIN));
const ROUTES = [ADMIN_PATHS.gl, ADMIN_PATHS.es].map((path) =>
  path === '/admin' ? 'src/app/(gl)/admin/route.ts' : 'src/app/(es)/es/admin/route.ts',
);

describe('CA-1.7 — el secreto y el catálogo solo los nombra el módulo declarado', () => {
  test('1. el escaneo mide algo: `src/admin/` está entero y no es un conjunto vacío', () => {
    const paths = ADMIN_FILES.map((file) => file.path);

    expect(paths.length).toBeGreaterThan(8);
    expect(paths).toContain('src/admin/session.ts');
    expect(paths).toContain('src/admin/handler.ts');
    expect(paths).toContain('src/admin/view/styles.ts');
  });

  test('2. los nombres vigilados salen del MÓDULO, nunca de una copia del test', () => {
    expect([...ADMIN_SECRET_NAMES]).toEqual([
      ADMIN_OPERATORS_VARIABLE,
      ADMIN_SESSION_SECRET_VARIABLE,
    ]);
  });

  test('3. el complemento de `ADMIN_SECRET_READERS` es VACÍO, en todo el código', () => {
    const offences = SCANNED.flatMap((file) =>
      textOffences(file, ADMIN_SECRET_NAMES, ADMIN_SECRET_READERS),
    );

    expect(offences).toEqual([]);
  });

  test('4. cada entrada de la lista llega con su motivo escrito (ADR-016 §3.2)', () => {
    expect(ADMIN_SECRET_READERS.length).toBeGreaterThan(0);
    for (const holder of ADMIN_SECRET_READERS) {
      expect(holder.paths.length).toBeGreaterThan(0);
      expect(holder.motive.length).toBeGreaterThan(60);
    }
  });
});

describe('CA-1.8 — control positivo POR MECANISMO (ADR-016 §3.4)', () => {
  test('5. un fichero FUERA de la lista que nombre una de las variables es ROJO', () => {
    for (const name of ADMIN_SECRET_NAMES) {
      const evasion = syntheticFile(
        `src/probe/reader-${name}.ts`,
        `export const stolen = process.env['${name}'];`,
      );

      expect(textOffences(evasion, ADMIN_SECRET_NAMES, ADMIN_SECRET_READERS)).toEqual([
        `src/probe/reader-${name}.ts: names \`${name}\``,
      ]);
    }
  });

  test('6. vaciar la lista de NOMBRES VIGILADOS deja el mecanismo sin medir nada', () => {
    // El control del propio detector: si el conjunto vacío del caso 3 fuese
    // vacío porque no se vigila nada, esto lo dice.
    const crossing = SCANNED.filter(
      (file) => textOffences(file, ADMIN_SECRET_NAMES, []).length > 0,
    );
    expect(crossing.map((file) => file.path).sort()).toEqual(['src/admin/session.ts']);

    const withNoNames = SCANNED.filter((file) => textOffences(file, [], []).length > 0);
    expect(withNoNames).toEqual([]);
  });

  test('7. un fichero que el LECTOR NO SABE CLASIFICAR es rojo, y lo dice el compilador', () => {
    const unreadable = syntheticFile(
      'src/probe/unreadable-session.ts',
      "const where = '@/admin' + '/session';\nconst m = await import(where);\nexport const x = m;",
    );

    expect(nameOffences(unreadable, ['whatever'], [])).toEqual([
      'src/probe/unreadable-session.ts: specifier is not a static literal — where',
    ]);
  });
});

describe('CA-1.9 — ninguna exención por nombre de fichero (ADR-016 §3.3)', () => {
  test('8. este criterio no tiene ninguna lista de exclusiones propia', async () => {
    const source = await readFile('tests/admin/support/frontier.ts', 'utf8');

    expect(source).not.toContain('EXCLUDED');
    expect(source).not.toContain('IGNORED');
    expect(source).not.toContain('ALLOWED_FILES');
    expect(source).not.toContain('EXEMPT');
    // Y el escaneo se HEREDA: no hay una segunda idea de qué ficheros hay.
    expect(source).toContain("from '../../bot/support/frontier'");
  });

  test('9. y el juicio sale SOLO de lo declarado: lista sintética invertida', () => {
    const loader = SCANNED.find((file) => file.path === 'src/admin/session.ts');
    expect(loader).toBeDefined();
    if (loader === undefined) return;

    expect(textOffences(loader, ADMIN_SECRET_NAMES, []).length).toBe(2);
    expect(textOffences(loader, ADMIN_SECRET_NAMES, ADMIN_SECRET_READERS)).toEqual([]);
  });
});

describe('CA-1.11 — RESIDUO DECLARADO donde el mecanismo juzga (ADR-016 §6)', () => {
  /**
   * ESTE MECANISMO NO ALCANZA a un módulo que reciba el catálogo YA LEÍDO, por
   * inyección, desde un módulo autorizado: la capacidad ahí no cruza ninguna
   * frontera que el lector vea. Es el mismo residuo que SPEC-015 CA-2.7
   * declaró para el mapeo del bot. **Destino: EPIC-MEJORA; disparador: el día
   * que un módulo fuera de `ADMIN_SECRET_READERS` reciba el catálogo por
   * inyección.**
   *
   * Tampoco alcanza a que no haya límite de intentos ni revocación: eso no es
   * una frontera de código, está en ADR-024 §3 y tiene su propio disparador
   * (el segundo operador).
   */
  test('10. un módulo que reciba el catálogo por parámetro NO lo ve este mecanismo', () => {
    const injected = syntheticFile(
      'src/probe/injected-catalog.ts',
      [
        "import type { OperatorCatalog } from '@/admin/session';",
        'export function leak(catalog: OperatorCatalog): string[] {',
        '  return [...catalog.values()];',
        '}',
      ].join('\n'),
    );

    // Verde, y está declarado: el fichero no nombra ninguna de las variables.
    expect(textOffences(injected, ADMIN_SECRET_NAMES, ADMIN_SECRET_READERS)).toEqual([]);
  });

  test('11. y hoy NADIE de `src/admin/` recibe el catálogo así, salvo el handler', async () => {
    // El disparador está escrito; esto mide que todavía no ha ocurrido fuera
    // del propio encaminador, que lo obtiene llamando al módulo autorizado.
    const holders: string[] = [];
    for (const file of ADMIN_FILES) {
      if (/OperatorCatalog/.test(file.code)) holders.push(file.path);
    }

    expect(holders.sort()).toEqual(['src/admin/handler.ts', 'src/admin/session.ts']);
  });
});

describe('CA-2.2 y CA-2.3 — `DECISION_WRITERS` no crece y `src/admin/` no cruza', () => {
  test('12. `DECISION_WRITERS` sigue teniendo EXACTAMENTE dos entradas', () => {
    // El caso de SPEC-013 que lo afirma pasa sin tocar una aserción; esto lo
    // repite donde SPEC-017 lo necesita.
    expect(DECISION_WRITERS).toHaveLength(2);
    const paths = DECISION_WRITERS.flatMap((writer) => writer.paths);
    expect(paths).not.toContain('src/admin/');
    for (const path of paths) expect(path.startsWith('src/admin')).toBe(false);
  });

  test('13. ningún módulo de `src/admin/` cruza ninguno de los cinco nombres', () => {
    const offences = ADMIN_FILES.flatMap((file) =>
      nameOffences(file, DECISION_NAMES_FORBIDDEN_IN_ADMIN, []),
    );

    expect(offences).toEqual([]);
  });

  test('14. control positivo por deletreo: los cuatro cruces son ROJOS', () => {
    const shapes: readonly (readonly [string, string])[] = [
      ['binding', "import { PostgresDecisionStore } from '@/db/decisions';\nexport const x = PostgresDecisionStore;"],
      ['bare', "declare const PostgresDecisionStore: unknown;\nexport const x = PostgresDecisionStore;"],
      ['member', "import * as d from '@/db/decisions';\nexport const x = d.PostgresDecisionStore;"],
      ['type', "import type { DecisionStore } from '@/db/ports';\nexport function f(s: DecisionStore): DecisionStore { return s; }"],
    ];

    for (const [name, text] of shapes) {
      const evasion = syntheticFile(`src/admin/probe-${name}.ts`, text);
      expect(
        nameOffences(evasion, DECISION_NAMES_FORBIDDEN_IN_ADMIN, []).length,
        `${name}`,
      ).toBeGreaterThan(0);
    }
  });

  test('15. y una superficie ilegible sobre `src/decide/` también', async () => {
    const evasion = syntheticFile(
      'src/admin/probe-star.ts',
      "export * from '@/decide/cycle';",
    );

    // El especificador resuelve DENTRO de `src/decide/`, que es un escritor.
    expect(await moduleOf('@/decide/cycle', 'src/admin/probe-star.ts')).toBe(
      'src/decide/cycle.ts',
    );
    // Y el módulo real no tiene ninguna reexportación de esa forma.
    for (const file of ADMIN_FILES) {
      expect(file.code, `${file.path}`).not.toMatch(/export\s+\*\s+from\s+['"]@\/decide/);
      expect(file.code, `${file.path}`).not.toMatch(/import\s+\*\s+as\s+\w+\s+from\s+['"]@\/decide/);
    }
    expect(evasion.path).toBe('src/admin/probe-star.ts');
  });

  test('16. las dos puertas que SÍ usa se importan POR NOMBRE, y no traen almacén', () => {
    const handler = ADMIN_FILES.find((file) => file.path === 'src/admin/handler.ts');
    expect(handler).toBeDefined();

    expect(handler?.code).toContain("import { runEngineForMatch } from '@/decide/engine-entry'");
    expect(handler?.code).toContain("import { readMatchDecisions } from '@/decide/read-entry'");
  });
});

describe('CA-2.4 — ningún `update` ni `delete` sobre las cuatro tablas', () => {
  test('17. el complemento es VACÍO en todo `src/admin/`', () => {
    const offences = ADMIN_FILES.flatMap((file) => mutationOffences(file.code, file.path));

    expect(offences).toEqual([]);
  });

  test('18. control positivo: el mecanismo caza las cuatro formas', () => {
    for (const table of MUTATED_TABLES) {
      expect(mutationOffences(`sql\`update ${table} set x = 1\``, 'p.ts')).toEqual([
        `p.ts: mutates \`${table}\``,
      ]);
      expect(mutationOffences(`sql\`delete from ${table}\``, 'p.ts')).toEqual([
        `p.ts: mutates \`${table}\``,
      ]);
    }
  });

  /**
   * RESIDUO DECLARADO DENTRO DEL CRITERIO (ADR-016 §6, CA-2.4): este segundo
   * mecanismo es TEXTUAL y por tanto NO ALCANZA A SQL COMPUESTO EN EJECUCIÓN.
   * Es el mismo límite que SPEC-013 CA-13.3 ya declaró, en otro sitio, y no se
   * promete más de lo que ve.
   */
  test('19. y no alcanza a un nombre de tabla compuesto en ejecución', () => {
    const composed = "const t = 'obser' + 'vations';\nawait sql.unsafe('update ' + t + ' set x=1');";

    expect(mutationOffences(composed, 'p.ts')).toEqual([]);
  });
});

describe('CA-9.2 y CA-9.5 — la lengua sale de la URL, y no hay un segundo juego de estados', () => {
  test('20. ningún módulo de `src/admin/` lee `Accept-Language`', () => {
    for (const file of ADMIN_FILES) {
      expect(file.code.toLowerCase(), `${file.path}`).not.toContain('accept-language');
      expect(file.code, `${file.path}`).not.toContain('navigator.language');
    }
  });

  test('21. y la lengua es un dato de la RUTA: cada `route.ts` la nombra', async () => {
    for (const route of ROUTES) {
      const source = await readFile(route, 'utf8');
      expect(source).toMatch(/productionAdminHandler\('(gl|es)'\)/);
    }
  });

  test('22. `src/admin/` no contiene NINGÚN literal visible de estado', async () => {
    const { gl } = await import('@/i18n/gl');
    const { es } = await import('@/i18n/es');
    const visible = [...Object.values(gl.statuses), ...Object.values(es.statuses)];

    for (const file of ADMIN_FILES) {
      for (const word of visible) {
        expect(file.code, `${file.path} — ${word}`).not.toContain(word);
      }
    }

    // Y el mecanismo mide algo: las cinco formas existen y no están vacías.
    expect(new Set(visible).size).toBeGreaterThan(5);
  });

  test('23. ni ningún literal visible de cualificador', async () => {
    const { gl } = await import('@/i18n/gl');
    const { es } = await import('@/i18n/es');
    const visible = [...Object.values(gl.qualifiers), ...Object.values(es.qualifiers)];

    for (const file of ADMIN_FILES) {
      for (const word of visible) {
        expect(file.code, `${file.path} — ${word}`).not.toContain(word);
      }
    }
  });
});

describe('CA-13 — los puntos de entrada, y el panel no le pide nada a nadie', () => {
  test('24. las dos rutas están declaradas en `ENTRY_POINTS`, con su motivo', async () => {
    for (const route of ROUTES) {
      expect(ENTRY_POINTS).toContain(route);
      expect(versionedSources()).toContain(route);
    }

    const declaration = await readFile('tests/polite/support/capability.ts', 'utf8');
    expect(declaration).toContain('SPEC-017 CA-13.1');
  });

  test('25. EL GRAFO DE LAS RUTAS NO ALCANZA `src/polite/http.ts` (CA-13.2)', async () => {
    for (const route of ROUTES) {
      const graph = await reachableModules([route]);
      expect([...graph], `${route}`).not.toContain('src/polite/http.ts');
    }
  });

  test('26. control positivo: añadirle la puerta de salida lo pone ROJO', async () => {
    syntheticFile(
      'src/admin/probe-exit.ts',
      [
        "import { politeFetch } from '@/polite/http';",
        'export const door = politeFetch;',
      ].join('\n'),
    );

    const graph = await reachableModules(['src/admin/probe-exit.ts']);
    expect([...graph]).toContain('src/polite/http.ts');
  });

  test('27. la respuesta se construye con `new Response`, NUNCA con `Response.json`', () => {
    for (const file of ADMIN_FILES) {
      expect(file.code, `${file.path}`).not.toContain('Response.json');
    }

    const handler = ADMIN_FILES.find((file) => file.path === 'src/admin/handler.ts');
    expect(handler?.code).toContain('new Response(');
    expect(handler?.code).toContain('JSON.stringify(');
  });

  test('28. los ficheros de ruta no tienen lógica: solo importan `src/admin/handler.ts`', async () => {
    for (const route of ROUTES) {
      const file = SCANNED.find((candidate) => candidate.path === route);
      expect(file, `${route}`).toBeDefined();

      const targets: string[] = [];
      for (const specifier of file?.specifiers ?? []) {
        if (specifier.text === null) continue;
        const target = await moduleOf(specifier.text, route);
        if (target !== null) targets.push(target);
      }

      expect(targets, `${route}`).toEqual(['src/admin/handler.ts']);
      // Y por tanto nada de `src/db/`, `src/raw/` ni `src/decide/`.
      for (const target of targets) {
        expect(target.startsWith('src/db/')).toBe(false);
        expect(target.startsWith('src/raw/')).toBe(false);
        expect(target.startsWith('src/decide/')).toBe(false);
      }
    }
  });
});
