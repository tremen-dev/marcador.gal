/**
 * SPEC-014 — THE GUARDIAN OF THE PARTITION.
 *
 * `npm test` used to be red one run in five with nothing broken. One suite —
 * `tests/polite/architecture.test.ts` — writes real files inside the repository
 * and deletes them in its `finally`, because its positive controls are only
 * true if the file exists (ADR-016 §4). A dozen other suites walk that same
 * tree. Vitest runs files in parallel, so reader and writer land in different
 * workers over shared state, and the run dies either with ONE FILE TOO MANY in
 * a set assertion or with `ENOENT` between the `readdir` and the `readFile`.
 *
 * The correction lives whole in `vitest.config.ts`: two projects that never
 * overlap. This file is the guardian that keeps the partition honest, and it
 * asserts what the criteria ask, in their order:
 *
 *   CA-1.1 — the shape of the two projects, ON THE RESOLVED OBJECT.
 *   CA-2   — the partition is exact: union, empty intersection.
 *   CA-3   — membership is decided BY THE IMPORT GRAPH, fails closed, and
 *            concedes no exemption by name.
 *   CA-5.1 — the shared configuration is declared once and both inherit it.
 *   CA-6.3 — the positive control of the membership mechanism.
 *
 * WHY IT IMPORTS `vitest.config.ts` AND NOT A COPY OF ITS RULE: the config is
 * what decides, so it is the config that must be judged. Reading it as text
 * would be judging its spelling.
 */
import { describe, expect, it } from 'vitest';
import config, {
  TEST_INCLUDE,
  TEST_EXCLUSIONS,
  FILE_SYSTEM_MODULES,
  PARALLEL_GROUP,
  SERIALIZED_GROUP,
  partitionOffences,
  partitionTestFiles,
  testUniverse,
} from '../../vitest.config.ts';
import { registerSyntheticSource } from '../mirror/support/imports.ts';

type Project = {
  readonly extends?: unknown;
  readonly test?: {
    readonly name?: string;
    readonly include?: readonly string[];
    readonly exclude?: readonly string[];
    readonly fileParallelism?: boolean;
    readonly sequence?: { readonly groupOrder?: number };
    readonly typecheck?: { readonly enabled?: boolean; readonly include?: readonly string[] };
  };
};

const resolved = await config({ command: 'serve', mode: 'test' });
const projects = (resolved.test?.projects ?? []) as readonly Project[];
const names = projects.map((project) => project.test?.name ?? '<unnamed>');
const byName = new Map(projects.map((project, index) => [names[index]!, project]));
const parallel = byName.get(PARALLEL_GROUP)!;
const serialized = byName.get(SERIALIZED_GROUP)!;

/**
 * What a project's `exclude` adds on top of the exclusions that were always
 * there — which is, by construction, the other group.
 *
 * By position and not by filtering: a file may be BOTH in the original
 * exclusions and in a group (`tests/raw/blob.contract.test.ts` is), and
 * filtering by membership would silently drop it and read as a hole.
 */
function addedExclusions(project: Project): readonly string[] {
  const exclude = project.test?.exclude ?? [];
  expect(exclude.slice(0, TEST_EXCLUSIONS.length)).toEqual(TEST_EXCLUSIONS);
  return exclude.slice(TEST_EXCLUSIONS.length);
}

describe('CA-1.1 — los dos grupos existen y llevan los dos mecanismos', () => {
  it('1. la configuración declara exactamente dos proyectos, nombrados', () => {
    expect(projects.length).toBe(2);
    expect([...names].sort()).toEqual([PARALLEL_GROUP, SERIALIZED_GROUP].sort());
  });

  it('2. el grupo serializado lleva `fileParallelism: false`', () => {
    expect(serialized.test?.fileParallelism).toBe(false);
  });

  it('3. y un `sequence.groupOrder` estrictamente mayor que el del paralelo', () => {
    // The two are not redundant and the criterion names them apart because CA-6
    // switches each off on its own. `groupOrder` is the DOCUMENTED mechanism —
    // «If you don't set this option, all projects run in parallel» — and
    // `fileParallelism: false` alone gave zero overlaps in the measurement but
    // that guarantee is emergent and nowhere written.
    const parallelOrder = parallel.test?.sequence?.groupOrder;
    const serializedOrder = serialized.test?.sequence?.groupOrder;
    expect(typeof parallelOrder).toBe('number');
    expect(typeof serializedOrder).toBe('number');
    expect(serializedOrder!).toBeGreaterThan(parallelOrder!);
  });
});

describe('CA-2 — la partición es exacta', () => {
  it('1. la unión de los dos grupos es el universo entero, sin sobras', async () => {
    const partition = await partitionTestFiles();
    const union = [...partition.serialized, ...partition.parallel].sort();
    expect(union).toEqual([...partition.universe].sort());
  });

  it('2. la intersección es vacía', async () => {
    const partition = await partitionTestFiles();
    const both = partition.serialized.filter((file) => partition.parallel.includes(file));
    expect(both).toEqual([]);
  });

  it('3. el universo sale del glob declarado, no de una lista escrita a mano', async () => {
    // CA-2.1: what the two projects select is derived from `tests/**/*.test.ts`
    // minus the exclusions the configuration already declared. Both are
    // constants of `vitest.config.ts`, and both projects carry them verbatim.
    expect(TEST_INCLUDE).toEqual(['tests/**/*.test.ts']);
    expect(TEST_EXCLUSIONS).toEqual([
      '**/node_modules/**',
      'tests/db/**',
      'tests/raw/blob.contract.test.ts',
    ]);
    expect(parallel.test?.include).toEqual(TEST_INCLUDE);
    expect(serialized.test?.include).toEqual(TEST_INCLUDE);
    for (const pattern of TEST_EXCLUSIONS) {
      expect(parallel.test?.exclude).toContain(pattern);
      expect(serialized.test?.exclude).toContain(pattern);
    }
    const universe = await testUniverse();
    expect(universe.length).toBeGreaterThan(0);
    expect(universe.every((file) => file.startsWith('tests/') && file.endsWith('.test.ts'))).toBe(
      true,
    );
  });

  it('4. y ningún fichero se cae de los dos: cada grupo excluye exactamente al otro', async () => {
    // THE FAILURE MODE THIS CLOSES: a file that falls out of both `include`
    // lists STOPS RUNNING AND NOTHING GOES RED. Here each project keeps the
    // original glob and excludes the other group by name, so the union is exact
    // by construction and this assertion is what proves the construction held.
    const partition = await partitionTestFiles();
    expect(addedExclusions(parallel).slice().sort()).toEqual([...partition.serialized].sort());
    expect(addedExclusions(serialized).slice().sort()).toEqual([...partition.parallel].sort());
  });
});

describe('CA-3 — la pertenencia la decide el grafo de imports', () => {
  it('1. ningún fichero del grupo paralelo alcanza el sistema de ficheros', async () => {
    const partition = await partitionTestFiles();
    const trespassers = partition.parallel.filter((file) => partition.witness.has(file));
    expect(trespassers).toEqual([]);
  });

  it('2. y todo fichero que lo alcanza está en el grupo serializado', async () => {
    const partition = await partitionTestFiles();
    const reaching = [...partition.witness.keys()].sort();
    expect([...partition.serialized].sort()).toEqual(reaching);
    // Not a formality: if the graph reader ever went silent, both sides would
    // be empty and this would still pass. The count is the anchor.
    expect(reaching.length).toBeGreaterThan(0);
  });

  it('3. el testigo nombra la cadena, del fichero de test al que importa `node:fs`', async () => {
    const partition = await partitionTestFiles();
    for (const [entry, chain] of partition.witness) {
      expect(chain[0]).toBe(entry);
      expect(FILE_SYSTEM_MODULES).toContain(chain.at(-1));
    }
  });

  it('4. y el escritor real del árbol está dentro, que es de lo que trata la spec', async () => {
    const partition = await partitionTestFiles();
    expect(partition.serialized).toContain('tests/polite/architecture.test.ts');
  });

  it('5. FALLA CERRADO: un fichero que el lector no sabe parsear es rojo nombrándose', async () => {
    registerSyntheticSource(
      'src/spec014-control-unparseable.ts',
      'export const broken = ;\n',
    );
    registerSyntheticSource(
      'tests/spec014-control-unparseable.test.ts',
      "import '../src/spec014-control-unparseable.ts';\n",
    );
    const partition = await partitionTestFiles(['tests/spec014-control-unparseable.test.ts']);
    expect(partition.unreadable.join('\n')).toContain('src/spec014-control-unparseable.ts');
    expect(partition.unreadable.join('\n')).toContain('cannot parse');
  });

  it('6. FALLA CERRADO: un especificador literal que no sabe colocar es rojo nombrándose', async () => {
    registerSyntheticSource(
      'tests/spec014-control-unplaceable.test.ts',
      "import './there-is-no-such-module.ts';\n",
    );
    const partition = await partitionTestFiles(['tests/spec014-control-unplaceable.test.ts']);
    expect(partition.unreadable.join('\n')).toContain('there-is-no-such-module.ts');
    expect(partition.unreadable.join('\n')).toContain('does not resolve');
  });

  it('7. y sobre los ficheros de verdad no hay ni uno ilegible', async () => {
    const partition = await partitionTestFiles();
    expect(partition.unreadable).toEqual([]);
  });

  it('8. la resolución sigue `@/…` y la sustitución `.js` → `.ts` del compilador', async () => {
    registerSyntheticSource(
      'tests/spec014-control-resolution.test.ts',
      "import '@/raw/disk.js';\n",
    );
    const partition = await partitionTestFiles(['tests/spec014-control-resolution.test.ts']);
    expect(partition.unreadable).toEqual([]);
    // `src/raw/disk.ts` reaches the file system: the alias and the extension
    // substitution both had to land for this to be true.
    expect(partition.serialized).toEqual(['tests/spec014-control-resolution.test.ts']);
  });

  it('9. CA-3.5 — el residuo declarado, medido: ningún fichero paralelo depende de él', async () => {
    // What this mechanism does NOT promise to see: a file reaching the file
    // system without a static `import` of `node:fs`/`node:fs/promises` inside
    // the repository's graph — through `node:child_process`, through
    // `process.getBuiltinModule`, through a non-literal specifier, or through a
    // dependency of `node_modules`.
    //
    // MEASURED CORRECTION TO THE SPEC (F-SPEC-014-1): the criterion says «cero
    // ficheros de test caen ahí». The non-literal half is NOT zero — there is
    // exactly one, `tests/polite/containment.test.ts`, whose case 7 writes
    // `await import('node:' + 'http')` on purpose as a positive control of a
    // closed spec. It does not bite: that file reaches `node:fs` through
    // literal imports and is already serialized.
    //
    // So the case asserts what actually matters, and it is stronger than a
    // count: NO FILE OF THE PARALLEL GROUP HAS A NON-LITERAL SPECIFIER ANYWHERE
    // IN ITS GRAPH. The day one appears, this goes red naming it and somebody
    // decides — instead of the residue deciding in silence.
    const partition = await partitionTestFiles();
    const blind = partition.nonLiteralReach.filter((file) => partition.parallel.includes(file));
    expect(blind).toEqual([]);
    expect(partition.nonLiteral).toEqual(['tests/polite/containment.test.ts']);
  });
});

describe('CA-6.3 — control positivo del mecanismo de pertenencia', () => {
  it('1. mover al grupo paralelo un fichero que alcanza `node:fs` pone rojo al guardián, nombrándolo', async () => {
    const truth = await partitionTestFiles();
    const moved = 'tests/polite/architecture.test.ts';
    expect(truth.serialized).toContain(moved);

    const tampered = {
      serialized: truth.serialized.filter((file) => file !== moved),
      parallel: [...truth.parallel, moved],
    };
    const offences = partitionOffences(tampered, truth);
    expect(offences.length).toBeGreaterThan(0);
    expect(offences.join('\n')).toContain(moved);
  });

  it('2. y sobre la partición que la configuración publica no hay ninguna infracción', async () => {
    const truth = await partitionTestFiles();
    const claimed = {
      serialized: addedExclusions(parallel),
      parallel: addedExclusions(serialized),
    };
    expect(partitionOffences(claimed, truth)).toEqual([]);
  });

  it('3. quitar un fichero de los dos grupos también es rojo, nombrándolo', async () => {
    // The other half of CA-2's failure mode, as a control: a partition that
    // loses a file is an offence, not a silence.
    const truth = await partitionTestFiles();
    const dropped = truth.parallel[0]!;
    const offences = partitionOffences(
      { serialized: truth.serialized, parallel: truth.parallel.filter((f) => f !== dropped) },
      truth,
    );
    expect(offences.join('\n')).toContain(dropped);
  });

  it('4. y no hay ninguna exención por nombre: el guardián no consulta ninguna lista de ficheros', async () => {
    // CA-3.4 / ADR-016 §3.3. The only inputs of `partitionOffences` are the
    // claimed partition and the graph's verdict; there is nowhere to write an
    // exemption. Stated as a case so that adding one is a visible red.
    const truth = await partitionTestFiles();
    for (const file of truth.serialized) {
      const offences = partitionOffences(
        {
          serialized: truth.serialized.filter((candidate) => candidate !== file),
          parallel: [...truth.parallel, file],
        },
        truth,
      );
      expect(offences.join('\n')).toContain(file);
    }
  });
});

describe('CA-5.1 — la configuración compartida se declara una vez', () => {
  it('1. los dos proyectos heredan del config raíz en vez de copiarlo', () => {
    expect(parallel.extends).toBe(true);
    expect(serialized.extends).toBe(true);
  });

  it('2. el alias de `@` y el runtime de JSX viven en el raíz, no en los proyectos', () => {
    expect(resolved.resolve?.alias).toBeTruthy();
    expect(resolved.oxc).toEqual({ jsx: { runtime: 'automatic' } });
  });

  it('3. CA-5.2 — el typecheck sobre `.test-d.ts` sigue declarado, y en un solo grupo', () => {
    const declaring = projects.filter((project) => project.test?.typecheck?.enabled === true);
    expect(declaring.length).toBe(1);
    expect(declaring[0]!.test?.typecheck?.include).toEqual(['tests/**/*.test-d.ts']);
  });
});
