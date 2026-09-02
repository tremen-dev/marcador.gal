/**
 * CA-13 — RN-08: la capacidad de escribir una `Decision` está ENUMERADA, y lo
 * que el mecanismo no alcanza está escrito (RN-08, D-3, ADR-016).
 *
 * El criterio no busca lo prohibido: enumera lo permitido y exige que el resto
 * sea VACÍO. Las raíces, las exclusiones y el lector son los que SPEC-008
 * CA-2.6 y SPEC-009 ya declararon — un solo lector (ADR-016 §5 bis).
 *
 * SEGUNDA VUELTA (F-SPEC-013-7): la frontera se evadió con `import * as d` +
 * `d.PostgresDecisionStore` y los tres gates en verde. Los controles positivos
 * de abajo son ahora TRES —el nombre, la superficie ilegible de un módulo con
 * capacidad, y el textual—, uno por mecanismo, como pide ADR-016 §3.4, y la
 * evasión de aquella vuelta es un caso con nombre.
 */
import { readFile } from 'node:fs/promises';
import { beforeAll, describe, expect, test } from 'vitest';
import { syntheticFile } from '../polite/support/capability';
import { stripComments } from '../support/source-tree';
import {
  DECISION_CAPABILITY_NAMES,
  DECISION_WRITERS,
  decisionHandoverOffences,
  decisionImportOffences,
  decisionOffences,
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

  test('3. el conjunto de ficheros que cruzan la capacidad y no están en la lista es VACÍO', async () => {
    const offenders = (await Promise.all(SCANNED.map(async (file) => decisionOffences(file)))).flat();

    expect(offenders).toEqual([]);
  });
});

describe('CA-13.1 — control positivo de CADA mecanismo, no de la batería', () => {
  test('4. MECANISMO 1: un fichero fuera de la lista que importe `@/db/decisions` es ROJO', () => {
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

  test('6. LA EVASIÓN DE F-SPEC-013-7: `import * as d` y `d.PostgresDecisionStore` es ROJA', async () => {
    // El fichero exacto con el que el verificador rodeó la frontera el
    // 2026-09-02 con los tres gates en verde. El binding de un namespace se
    // llama `*` y el miembro de un acceso a propiedad no es una referencia
    // desnuda: por eso hacen falta las lecturas de miembro.
    const evasion = syntheticFile(
      'src/probe/namespace-evasion.ts',
      [
        "import postgres from 'postgres';",
        "import * as d from '@/db/decisions';",
        '',
        'export function evade(sql: postgres.Sql): unknown {',
        '  return new d.PostgresDecisionStore(sql);',
        '}',
      ].join('\n'),
    );

    // El mecanismo del NOMBRE lo ve, y NOMBRA lo que se está prohibiendo.
    expect(decisionImportOffences(evasion)).toEqual([
      'src/probe/namespace-evasion.ts: crosses `PostgresDecisionStore` and is not a declared decision writer',
    ]);
    // Y el de la SUPERFICIE ILEGIBLE lo ve por su cuenta: dos mecanismos
    // independientes, que es lo que hace que cerrar uno no dependa del otro.
    expect(await decisionHandoverOffences(evasion)).toEqual([
      'src/probe/namespace-evasion.ts: binds the whole namespace `d` of the decision writer src/db/decisions.ts',
    ]);
  });

  test('7. y las dos variantes que el namespace permite: el alias, y el `import()` con nombre', () => {
    const alias = syntheticFile(
      'src/probe/alias.ts',
      [
        "import * as d from '@/db/decisions';",
        'const store = d;',
        'export const make = (sql: unknown) => new store.PostgresDecisionStore(sql as never);',
      ].join('\n'),
    );
    expect(decisionImportOffences(alias)).toEqual([
      'src/probe/alias.ts: crosses `PostgresDecisionStore` and is not a declared decision writer',
    ]);

    const deferred = syntheticFile(
      'src/probe/deferred.ts',
      [
        "const d = await import('@/db/decisions');",
        'export const make = (sql: unknown) => new d.PostgresDecisionStore(sql as never);',
      ].join('\n'),
    );
    expect(decisionImportOffences(deferred)).toEqual([
      'src/probe/deferred.ts: crosses `PostgresDecisionStore` and is not a declared decision writer',
    ]);
  });

  test('8. FALLO CERRADO: un módulo que el compilador nombra y el lector no enumeró', () => {
    // `import d = require(…)` no deja especificador que leer: el lector no
    // modela esa declaración. Lo que lo caza no es una regla contra esa
    // sintaxis —sería una lista de formas, ADR-016 §3.5— sino que el compilador
    // SÍ nombra el módulo y el lector no lo enumeró. Vale igual para cualquier
    // sintaxis futura que este lector no sepa leer.
    const required = syntheticFile(
      'src/probe/required.ts',
      ["import d = require('@/db/decisions');", 'export const store = d;'].join('\n'),
    );

    expect(required.specifiers).toEqual([]);
    expect(decisionImportOffences(required)).toEqual([
      'src/probe/required.ts: the compiler names @/db/decisions and the reader did not enumerate it',
    ]);
  });

  test('9. FALLO CERRADO: un especificador que no es un literal estático', () => {
    const composed = syntheticFile(
      'src/probe/composed-specifier.ts',
      [
        "const where = '@/db/' + 'decisions';",
        'const d = await import(where);',
        'export const store = d;',
      ].join('\n'),
    );

    expect(decisionImportOffences(composed)).toEqual([
      'src/probe/composed-specifier.ts: specifier is not a static literal — where',
    ]);
  });

  test('10. vaciar la lista de NOMBRES VIGILADOS deja el mecanismo sin medir nada', () => {
    // El control del propio detector: si el conjunto vacío del caso 3 fuese
    // vacío porque no se vigila nada, esto lo dice.
    const crossing = SCANNED.filter(
      (file) => decisionImportOffences(file, DECISION_CAPABILITY_NAMES, []).length > 0,
    );

    // ASERCIÓN DERIVADA, y crece con los ficheros REALES que tienen la
    // capacidad — no con la frontera, que no se toca (precedente de cómo se
    // enmienda una aserción derivada: F-SPEC-011-1).
    //
    // `src/decide/engine-entry.ts` llega con **SPEC-015 CA-9**: la puerta
    // estrecha por la que el bot llama al motor SIN obtener la capacidad de
    // escribir una `Decision` (ADR-022 §9, contestando al disparador de
    // F-SPEC-013-11). Compone `PostgresDecisionStore` dentro de `src/decide/`,
    // que YA ESTÁ en `DECISION_WRITERS`, así que la lista de módulos con
    // capacidad NO SE ENSANCHA: lo que crece es esta enumeración de quién la
    // cruza, que es exactamente lo que este control mide.
    expect(crossing.map((file) => file.path).sort()).toEqual([
      'src/db/decisions.ts',
      'src/decide/apply.ts',
      'src/decide/cycle.ts',
      'src/decide/engine-entry.ts',
    ]);

    const withNoNames = SCANNED.filter(
      (file) => decisionImportOffences(file, [], []).length > 0,
    );
    expect(withNoNames).toEqual([]);
  });

  test('11. MECANISMO 1 bis: las cuatro formas de entregar la superficie entera son ROJAS', async () => {
    const shapes: readonly (readonly [string, string, string])[] = [
      [
        'src/probe/star.ts',
        "export * from '@/db/decisions';",
        'src/probe/star.ts: hands over the whole namespace of the decision writer src/db/decisions.ts',
      ],
      [
        'src/probe/star-as.ts',
        "export * as decisions from '@/db/decisions';",
        'src/probe/star-as.ts: hands over the whole namespace of the decision writer src/db/decisions.ts',
      ],
      [
        'src/probe/dynamic.ts',
        "export const load = async () => await import('@/db/decisions');",
        'src/probe/dynamic.ts: dynamic import() of the decision writer src/db/decisions.ts',
      ],
      [
        'src/probe/side-effect.ts',
        "import '@/db/decisions';\nexport const nothing = 1;",
        'src/probe/side-effect.ts: side-effect import of the decision writer src/db/decisions.ts',
      ],
    ];

    for (const [path, source, offence] of shapes) {
      expect(await decisionHandoverOffences(syntheticFile(path, source))).toEqual([offence]);
    }
  });

  test('12. y la forma que el mecanismo del NOMBRE no puede ver, que es por la que existe', async () => {
    // `(await import(…)).X` no deja identificador que mirar: el miembro cuelga
    // de una expresión, no de un nombre, así que el lector no publica ninguna
    // lectura de miembro. El mecanismo del nombre lo da por bueno y lo dice; el
    // de la superficie ilegible lo caza por el especificador.
    const inline = syntheticFile(
      'src/probe/inline.ts',
      [
        'export const make = async (sql: unknown) =>',
        "  new (await import('@/db/decisions')).PostgresDecisionStore(sql as never);",
      ].join('\n'),
    );

    expect(inline.reading.namespaceReads.filter((read) => read.member !== null)).toEqual([]);
    expect(decisionImportOffences(inline)).toEqual([]);
    expect(await decisionHandoverOffences(inline)).toEqual([
      'src/probe/inline.ts: dynamic import() of the decision writer src/db/decisions.ts',
    ]);
  });

  test('13. y vaciar la lista apaga también ESTE mecanismo, que es su control', async () => {
    const star = syntheticFile('src/probe/blind.ts', "export * from '@/db/decisions';");

    expect(await decisionHandoverOffences(star)).toHaveLength(1);
    expect(await decisionHandoverOffences(star, [])).toEqual([]);

    // Y sobre el árbol real no hay ninguna entrega de superficie entera.
    const real = (
      await Promise.all(SCANNED.map(async (file) => decisionHandoverOffences(file)))
    ).flat();
    expect(real).toEqual([]);
  });

  test('14. el mecanismo TEXTUAL tiene su propio control positivo', () => {
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

  test('15. y sobre el árbol real, el mecanismo textual también da vacío', () => {
    expect(SCANNED.flatMap((file) => decisionSqlOffences(file))).toEqual([]);

    // Y mide algo: el fichero que SÍ escribe la tabla está en la lista.
    const writer = SCANNED.find((file) => file.path === 'src/db/decisions.ts');
    expect(writer).toBeDefined();
    expect(decisionSqlOffences(writer!, [])).toHaveLength(1);
  });
});

describe('CA-13.2 — un fichero que el lector no sepa clasificar es ROJO', () => {
  test('16. y se comprueba contra lo que el compilador publica, no contra nosotros', async () => {
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
    // Y el otro mecanismo del grafo falla igual de cerrado, no en silencio.
    expect(await decisionHandoverOffences(broken)).toEqual([
      'src/ingest/unreadable.ts: the compiler cannot parse this file',
    ]);
  });

  test('17. el lector SE HEREDA: es el de SPEC-008/SPEC-009, no uno nuevo', async () => {
    const guard = stripComments(
      await readFile(new URL('./support/rn08.ts', import.meta.url), 'utf8'),
    );

    // Ni abre el compilador por su cuenta, ni pasea el árbol de ficheros, ni
    // reimplementa la lectura de imports ni la resolución de módulos: todo eso
    // llega de los dos módulos de soporte que ya sostienen SPEC-008 y SPEC-009.
    expect(guard).toContain("from '../../polite/support/capability'");
    expect(guard).toContain("from '../../mirror/support/imports'");
    expect(guard).not.toMatch(/typescript\/unstable/);
    expect(guard).not.toMatch(/readdir|readdirSync|execFileSync|existsSync/);
  });
});

describe('CA-13.3 — el residuo, declarado DENTRO del criterio (ADR-016 §6)', () => {
  test('18. el mecanismo estático NO alcanza al SQL compuesto en ejecución', async () => {
    // El ejemplo ejecutable del residuo: el nombre de la tabla no aparece en
    // ninguna plantilla y la capacidad no cruza ninguna frontera de módulo que
    // el lector vea. Los TRES mecanismos lo dan por bueno, y eso está escrito.
    const residue = syntheticFile(
      'src/ingest/composed.ts',
      [
        "import type { Sql } from '@/db/client';",
        'export async function sneak(sql: Sql, table: string): Promise<void> {',
        "  await sql.unsafe('insert into ' + table + ' (match_id) values (1)');",
        '}',
      ].join('\n'),
    );

    expect(await decisionOffences(residue)).toEqual([]);
  });

  test('19. y el SEGUNDO residuo: la capacidad entregada como TIPO ESTRUCTURAL, sin nombrarla', async () => {
    // Un módulo que recibe `{ append, getLatestByMatch }` escrito a mano nunca
    // deletrea `DecisionStore`, y un mecanismo de NOMBRES no puede verlo. Se
    // declara aquí porque ADR-016 §6 obliga a declarar lo que no se alcanza, y
    // no se disfraza de cerrado.
    const structural = syntheticFile(
      'src/probe/structural.ts',
      [
        "import type { Decision } from '@/model';",
        'export async function publish(',
        '  store: { append: (decision: Decision) => Promise<void> },',
        '  decision: Decision,',
        '): Promise<void> {',
        '  await store.append(decision);',
        '}',
      ].join('\n'),
    );

    expect(await decisionOffences(structural)).toEqual([]);
  });

  test('20. lo que PARECE residuo y no lo es: la reexportación en cadena se cierra sola', async () => {
    // Quien reexporta el módulo entero entrega una superficie ilegible de un
    // módulo con capacidad — rojo por el mecanismo 1 bis…
    const chain = syntheticFile('src/probe/chain.ts', "export * from '@/db/decisions';");
    expect(await decisionOffences(chain)).toEqual([
      'src/probe/chain.ts: hands over the whole namespace of the decision writer src/db/decisions.ts',
    ]);

    // …y quien reexporta el NOMBRE lo nombra en su cláusula, incluso
    // renombrándolo, porque el binding es el nombre tal y como lo exporta el
    // módulo y nunca el alias — rojo por el mecanismo del nombre…
    const renamed = syntheticFile(
      'src/probe/renamed.ts',
      "export { PostgresDecisionStore as Store } from '@/db/decisions';",
    );
    expect(await decisionOffences(renamed)).toEqual([
      'src/probe/renamed.ts: crosses `PostgresDecisionStore` and is not a declared decision writer',
    ]);

    // …y el consumidor de la cadena vuelve a deletrear el nombre en su propio
    // fichero, así que la cadena es roja en los dos extremos y no hay ningún
    // sitio por el que el nombre llegue sin escribirse.
    const consumer = syntheticFile(
      'src/probe/consumer.ts',
      [
        "import { PostgresDecisionStore } from '@/probe/chain';",
        'export const make = (sql: unknown) => new PostgresDecisionStore(sql as never);',
      ].join('\n'),
    );
    expect(await decisionOffences(consumer)).toEqual([
      'src/probe/consumer.ts: crosses `PostgresDecisionStore` and is not a declared decision writer',
    ]);
  });

  test('21. y los dos residuos llevan destino y disparador ESCRITOS, en el módulo que los deja', async () => {
    const guard = await readFile(new URL('./support/rn08.ts', import.meta.url), 'utf8');

    expect(guard).toContain('EPIC-MEJORA');
    expect(guard).toContain('compuesto en tiempo de ejecución');
    expect(guard).toContain('ESTRUCTURAL, SIN NOMBRARLA');
    expect(guard).toMatch(/insuficiente/i);
    // Dos residuos, dos destinos y dos disparadores: ninguno queda en «algún
    // día», que es la mitad que ADR-016 §6 exige y la que se olvida.
    const flat = guard.replace(/\s*\n\s*\*\s*/g, ' ');
    expect(flat.match(/Destino: EPIC-MEJORA; disparador: el día que/g) ?? []).toHaveLength(2);
  });
});

describe('CA-13.4 — ninguna exención por nombre de fichero (ADR-016 §3.3)', () => {
  test('22. no existe ninguna lista de exclusiones propia de este criterio', () => {
    // La única lista es `DECISION_WRITERS`, y es de MÓDULOS CON CAPACIDAD. Las
    // raíces y las exclusiones del escaneo son las de SPEC-008 CA-2.6, que
    // tienen sus propios casos: aquí no se añade ni se afloja ninguna.
    const declared = DECISION_WRITERS.flatMap((writer) => [...writer.paths]);

    expect(declared).not.toContain('src/ingest/');
    expect(declared).not.toContain('src/site/');
    expect(holdsDecisionCapability('src/ingest/tick.ts')).toBe(false);
    expect(holdsDecisionCapability('src/decide/rules.ts')).toBe(true);
  });

  test('23. y el mecanismo se aplica igual a todos: no hay atajo por ruta', async () => {
    const guard = stripComments(
      await readFile(new URL('./support/rn08.ts', import.meta.url), 'utf8'),
    );

    expect(guard).not.toMatch(/\bEXEMPT|\bEXCLUS|\bIGNORE/i);
    // La única comparación de rutas es la de la lista declarada, y vive en una
    // sola función que recibe la lista por parámetro (y por tanto se puede
    // vaciar desde un caso, como hacen los controles 10, 13 y 15). Los dos
    // mecanismos del grafo consultan esa función y ninguno compara rutas por
    // su cuenta: la lista se lee en las dos direcciones, pero es una sola.
    const comparisons = guard.match(/path\s*(?:===|\.startsWith)/g) ?? [];
    expect(comparisons).toHaveLength(2);
    expect(guard.match(/holdsDecisionCapability\(/g) ?? []).toHaveLength(5);
  });
});

describe('CA-13.5 — `src/ingest/` sigue sin mencionar `DecisionStore`', () => {
  test('24. ningún fichero de `src/ingest/` cruza la frontera', async () => {
    const ingest = SCANNED.filter((file) => file.path.startsWith('src/ingest/'));

    expect(ingest.length).toBeGreaterThanOrEqual(8);
    const offences = (await Promise.all(ingest.map(async (file) => decisionOffences(file)))).flat();
    expect(offences).toEqual([]);
  });

  test('25. y el motor llama a la ingesta, nunca al revés', () => {
    const cycle = SCANNED.find((file) => file.path === 'src/decide/cycle.ts');
    expect(cycle).toBeDefined();
    expect(cycle!.specifiers.map((specifier) => specifier.text)).toContain('@/ingest/tick');

    const ingestImports = SCANNED.filter((file) => file.path.startsWith('src/ingest/')).flatMap(
      (file) => file.specifiers.map((specifier) => specifier.text ?? ''),
    );
    expect(ingestImports.filter((text) => text.startsWith('@/decide'))).toEqual([]);
  });
});
