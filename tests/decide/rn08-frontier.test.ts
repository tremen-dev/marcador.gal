/**
 * CA-13 — RN-08: la capacidad de escribir una `Decision` está ENUMERADA, y lo
 * que el mecanismo no alcanza está escrito (RN-08, D-3, ADR-016).
 *
 * El criterio no busca lo prohibido: enumera lo permitido y exige que el resto
 * sea VACÍO. Las raíces, las exclusiones y el lector son los que SPEC-008
 * CA-2.6 y SPEC-009 ya declararon — un solo lector (ADR-016 §5 bis).
 */
import { readFile } from 'node:fs/promises';
import { beforeAll, describe, expect, test } from 'vitest';
import { syntheticFile } from '../polite/support/capability';
import { stripComments } from '../support/source-tree';
import {
  DECISION_CAPABILITY_NAMES,
  DECISION_WRITERS,
  decisionImportOffences,
  decisionSqlOffences,
  holdsDecisionCapability,
  scanned,
} from './support/rn08';
import type { ScannedFile } from '../polite/support/capability';

let SCANNED: readonly ScannedFile[];

beforeAll(async () => {
  SCANNED = await scanned();
});

describe('CA-13 — la lista, y el resto vacío', () => {
  test('1. `DECISION_WRITERS` tiene DOS entradas, cada una con su motivo escrito', () => {
    expect(DECISION_WRITERS).toHaveLength(2);

    for (const writer of DECISION_WRITERS) {
      expect(writer.paths.length).toBeGreaterThan(0);
      expect(writer.motive.trim().length).toBeGreaterThan(40);
    }

    expect(DECISION_WRITERS.flatMap((writer) => [...writer.paths]).sort()).toEqual([
      'src/db/alerts.ts',
      'src/db/decisions.ts',
      'src/decide/',
    ]);
  });

  test('2. el escaneo mide algo: lee todo el código bajo las raíces declaradas', () => {
    expect(SCANNED.length).toBeGreaterThan(60);
    expect(SCANNED.map((file) => file.path)).toContain('src/decide/rules.ts');
    expect(SCANNED.map((file) => file.path)).toContain('src/ingest/tick.ts');
  });

  test('3. el conjunto de ficheros que cruzan la capacidad y no están en la lista es VACÍO', () => {
    const offenders = SCANNED.flatMap((file) => decisionImportOffences(file));

    expect(offenders).toEqual([]);
  });
});

describe('CA-13.1 — control positivo de CADA mecanismo, no de la batería', () => {
  test('4. un fichero fuera de la lista que importe `@/db/decisions` es ROJO', () => {
    const intruder = syntheticFile(
      'src/ingest/publish.ts',
      [
        "import { PostgresDecisionStore } from '@/db/decisions';",
        "import type { Sql } from '@/db/client';",
        'export const publish = (sql: Sql) => new PostgresDecisionStore(sql);',
      ].join('\n'),
    );

    expect(decisionImportOffences(intruder)).toEqual([
      'src/ingest/publish.ts: crosses `PostgresDecisionStore` and is not a declared decision writer',
    ]);
  });

  test('5. y también si solo pide el TIPO del puerto, que `import type` borra', () => {
    const intruder = syntheticFile(
      'src/site/publisher.ts',
      [
        "import type { DecisionStore } from '@/db/ports';",
        'export const hold = (store: DecisionStore): DecisionStore => store;',
      ].join('\n'),
    );

    expect(decisionImportOffences(intruder)).toEqual([
      'src/site/publisher.ts: crosses `DecisionStore` and is not a declared decision writer',
    ]);
  });

  test('6. vaciar la lista de NOMBRES VIGILADOS deja el mecanismo sin medir nada', () => {
    // El control del propio detector: si el conjunto vacío del caso 3 fuese
    // vacío porque no se vigila nada, esto lo dice.
    const crossing = SCANNED.filter(
      (file) => decisionImportOffences(file, DECISION_CAPABILITY_NAMES, []).length > 0,
    );

    expect(crossing.map((file) => file.path).sort()).toEqual([
      'src/db/decisions.ts',
      'src/decide/apply.ts',
      'src/decide/cycle.ts',
    ]);

    const withNoNames = SCANNED.filter(
      (file) => decisionImportOffences(file, [], []).length > 0,
    );
    expect(withNoNames).toEqual([]);
  });

  test('7. el mecanismo TEXTUAL tiene su propio control positivo', () => {
    const intruder = syntheticFile(
      'src/ingest/backdoor.ts',
      [
        "import type { Sql } from '@/db/client';",
        'export async function sneak(sql: Sql): Promise<void> {',
        '  await sql`insert into decisions (match_id) values (${1})`;',
        '}',
      ].join('\n'),
    );

    expect(decisionSqlOffences(intruder)).toEqual([
      'src/ingest/backdoor.ts: names the table `decisions` in a SQL template and is not a declared decision writer',
    ]);
  });

  test('8. y sobre el árbol real, el mecanismo textual también da vacío', () => {
    expect(SCANNED.flatMap((file) => decisionSqlOffences(file))).toEqual([]);

    // Y mide algo: el fichero que SÍ escribe la tabla está en la lista.
    const writer = SCANNED.find((file) => file.path === 'src/db/decisions.ts');
    expect(writer).toBeDefined();
    expect(decisionSqlOffences(writer!, [])).toHaveLength(1);
  });
});

describe('CA-13.2 — un fichero que el lector no sepa clasificar es ROJO', () => {
  test('9. y se comprueba contra lo que el compilador publica, no contra nosotros', () => {
    const broken = syntheticFile(
      'src/ingest/unreadable.ts',
      ['export const half = (((;;;', "import { PostgresDecisionStore } from '@/db/decisions';"].join(
        '\n',
      ),
    );

    expect(broken.reading.unparseable).toBe(true);
    expect(decisionImportOffences(broken)).toEqual([
      'src/ingest/unreadable.ts: the compiler cannot parse this file',
    ]);
  });

  test('10. el lector SE HEREDA: es el de SPEC-008/SPEC-009, no uno nuevo', async () => {
    const guard = stripComments(
      await readFile(new URL('./support/rn08.ts', import.meta.url), 'utf8'),
    );

    // Ni abre el compilador por su cuenta, ni pasea el árbol de ficheros, ni
    // reimplementa la lectura de imports: todo eso llega de un solo sitio.
    expect(guard).toContain("from '../../polite/support/capability'");
    expect(guard).not.toMatch(/typescript\/unstable/);
    expect(guard).not.toMatch(/readdir|readdirSync|execFileSync/);
  });
});

describe('CA-13.3 — el residuo, declarado DENTRO del criterio (ADR-016 §6)', () => {
  test('11. el mecanismo estático NO alcanza al SQL compuesto en ejecución', () => {
    // El ejemplo ejecutable del residuo: el nombre de la tabla no aparece en
    // ninguna plantilla y la capacidad no cruza ninguna frontera de módulo que
    // el lector vea. Los DOS mecanismos lo dan por bueno, y eso está escrito.
    const residue = syntheticFile(
      'src/ingest/composed.ts',
      [
        "import type { Sql } from '@/db/client';",
        'export async function sneak(sql: Sql, table: string): Promise<void> {',
        "  await sql.unsafe('insert into ' + table + ' (match_id) values (1)');",
        '}',
      ].join('\n'),
    );

    expect(decisionImportOffences(residue)).toEqual([]);
    expect(decisionSqlOffences(residue)).toEqual([]);
  });

  test('12. y el residuo lleva destino y disparador ESCRITOS, en el módulo que lo deja', async () => {
    const guard = await readFile(new URL('./support/rn08.ts', import.meta.url), 'utf8');

    expect(guard).toContain('EPIC-MEJORA');
    expect(guard).toContain('compuesto en tiempo de ejecución');
    expect(guard).toMatch(/insuficiente/i);
  });
});

describe('CA-13.4 — ninguna exención por nombre de fichero (ADR-016 §3.3)', () => {
  test('13. no existe ninguna lista de exclusiones propia de este criterio', () => {
    // La única lista es `DECISION_WRITERS`, y es de MÓDULOS CON CAPACIDAD. Las
    // raíces y las exclusiones del escaneo son las de SPEC-008 CA-2.6, que
    // tienen sus propios casos: aquí no se añade ni se afloja ninguna.
    const declared = DECISION_WRITERS.flatMap((writer) => [...writer.paths]);

    expect(declared).not.toContain('src/ingest/');
    expect(declared).not.toContain('src/site/');
    expect(holdsDecisionCapability('src/ingest/tick.ts')).toBe(false);
    expect(holdsDecisionCapability('src/decide/rules.ts')).toBe(true);
  });

  test('14. y el mecanismo se aplica igual a todos: no hay atajo por ruta', async () => {
    const guard = stripComments(
      await readFile(new URL('./support/rn08.ts', import.meta.url), 'utf8'),
    );

    expect(guard).not.toMatch(/\bEXEMPT|\bEXCLUS|\bIGNORE/i);
    // La única comparación de rutas es la de la lista declarada, y vive en una
    // sola función que recibe la lista por parámetro (y por tanto se puede
    // vaciar desde un caso, como hacen los controles 6 y 8).
    const comparisons = guard.match(/path\s*(?:===|\.startsWith)/g) ?? [];
    expect(comparisons).toHaveLength(2);
  });
});

describe('CA-13.5 — `src/ingest/` sigue sin mencionar `DecisionStore`', () => {
  test('15. ningún fichero de `src/ingest/` cruza la frontera', () => {
    const ingest = SCANNED.filter((file) => file.path.startsWith('src/ingest/'));

    expect(ingest.length).toBeGreaterThanOrEqual(8);
    expect(ingest.flatMap((file) => decisionImportOffences(file))).toEqual([]);
    expect(ingest.flatMap((file) => decisionSqlOffences(file))).toEqual([]);
  });

  test('16. y el motor llama a la ingesta, nunca al revés', () => {
    const cycle = SCANNED.find((file) => file.path === 'src/decide/cycle.ts');
    expect(cycle).toBeDefined();
    expect(cycle!.specifiers.map((specifier) => specifier.text)).toContain('@/ingest/tick');

    const ingestImports = SCANNED.filter((file) => file.path.startsWith('src/ingest/')).flatMap(
      (file) => file.specifiers.map((specifier) => specifier.text ?? ''),
    );
    expect(ingestImports.filter((text) => text.startsWith('@/decide'))).toEqual([]);
  });
});
