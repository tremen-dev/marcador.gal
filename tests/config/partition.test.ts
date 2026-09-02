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
import { rmSync, writeFileSync } from 'node:fs';
import { builtinModules, isBuiltin } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import config, {
  TEST_INCLUDE,
  TEST_EXCLUSIONS,
  FILE_SYSTEM_BUILTIN,
  PARALLEL_GROUP,
  SERIALIZED_GROUP,
  isFileSystemModule,
  partitionOffences,
  partitionTestFiles,
  testUniverse,
} from '../../vitest.config.ts';
import { registerSyntheticSource } from '../mirror/support/imports.ts';

/**
 * EVERY SPELLING NODE ACCEPTS FOR A BUILTIN, FROM NODE'S OWN TABLE.
 *
 * `builtinModules` lists the modules this runtime carries; the ones that may
 * only be written with the prefix (`node:test`, `node:sea`) appear in it
 * already prefixed. Both spellings of each are offered to `isBuiltin`, which is
 * Node's own answer to «does this specifier name a builtin», and only what it
 * accepts survives. Nothing here is a list of names: the closure of CA-3 lives
 * in `node:module`, which exists outside this test and outside this repository
 * (ADR-016 §3.1).
 *
 * It lives HERE and not in `vitest.config.ts` because `vitest.config.ts` is
 * inside `SCAN_ROOTS` and the surface ADR-014 §4 concedes for `node:module` is
 * `registerHooks` and nothing else. Widening it would be editing a file of a
 * closed spec (CA-4.2, ADR-015). `tests/` is outside the roots by a declared
 * exclusion, so the guardian pays for the enumeration and the configuration
 * carries only the rule the guardian proves equal to it.
 */
const ROOT = fileURLToPath(new URL('../..', import.meta.url));

const BUILTIN_SPELLINGS: readonly string[] = [
  ...new Set(
    builtinModules.flatMap((name) => {
      const bare = name.startsWith('node:') ? name.slice(5) : name;
      return [bare, `node:${bare}`];
    }),
  ),
]
  .filter((spelling) => isBuiltin(spelling))
  .sort();

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
      expect(isFileSystemModule(chain.at(-1)!)).toBe(true);
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

  it('10. F-SPEC-014-8 — la capacidad se cierra contra la tabla de builtins de Node, no contra dos grafías', () => {
    // WHAT WENT WRONG THE FIRST TIME: the criterion was a list of two literals,
    // `node:fs` and `node:fs/promises`. Node accepts FOUR spellings for the
    // same two modules — the prefix is optional — and `import { readFileSync }
    // from 'fs'` walked into the parallel group with the guardian at 23/23 and
    // `oxlint --type-aware` at exit 0, because the rule that would force the
    // prefix (`unicorn/prefer-node-protocol`) is of category *style* and
    // `.oxlintrc.json` enables only `correctness`.
    //
    // THE SWEEP IS OVER EVERY BUILTIN THIS RUNTIME HAS, in both spellings, and
    // it demands the rest be empty (ADR-016 §3.1): the day Node adds a module
    // to the `fs` family it appears here without anybody editing a list, and
    // the day the rule widens by accident a hundred-odd builtins go red.
    const family = builtinModules.filter(
      (name) => name === FILE_SYSTEM_BUILTIN || name.startsWith(`${FILE_SYSTEM_BUILTIN}/`),
    );
    const expected = family
      .flatMap((name) => [name, `node:${name}`])
      .filter((spelling) => isBuiltin(spelling))
      .sort();

    // Not a formality: if `builtinModules` ever came back empty this case would
    // pass with both sides empty, and the sweep would prove nothing.
    expect(BUILTIN_SPELLINGS.length).toBeGreaterThan(50);
    expect(expected).toEqual(['fs', 'fs/promises', 'node:fs', 'node:fs/promises']);

    expect(BUILTIN_SPELLINGS.filter((spelling) => isFileSystemModule(spelling))).toEqual(expected);
  });

  it('11. y lo que no es un builtin del sistema de ficheros no entra por parecerse', () => {
    // The negative half of case 10, over the shapes that are NOT builtins and
    // therefore never reach `BUILTIN_SPELLINGS`: a package whose name begins
    // with the same three letters, and our own modules.
    for (const specifier of ['fs-extra', 'fsevents', './fs', '@/fs', '@/raw/disk.ts', 'node:fsx']) {
      expect([specifier, isFileSystemModule(specifier)]).toEqual([specifier, false]);
    }
    // And the four that do, one by one, so a red names the spelling it lost.
    for (const specifier of ['fs', 'node:fs', 'fs/promises', 'node:fs/promises']) {
      expect([specifier, isFileSystemModule(specifier)]).toEqual([specifier, true]);
    }
  });

  it('12. F-SPEC-014-9 — FALLA CERRADO ante un módulo real que no sabe seguir, y su gemelo `.ts` no', async () => {
    // WHAT WENT WRONG THE FIRST TIME: a literal specifier the reader could not
    // place was DISCARDED IN SILENCE whenever the path existed, so a real
    // `.mts` or `.cts` module — which `resolveModule` cannot return, because it
    // only offers `.ts`, `.tsx` and `index.*` — came back with no edges and its
    // importer landed in the parallel group. Nothing said a word.
    //
    // THE CONTROL IS PAIRED AND THE FILES ARE REAL, because that is the whole
    // question: the same source, byte for byte, under three extensions. The
    // `.ts` twin is what proves the reader was working and the extension is
    // what decided (ADR-016 §3.4). They are real files inside the repository
    // and this suite runs in the SERIALIZED group, which is what this spec
    // exists to make safe.
    //
    // It is the same blind spot F-SPEC-008-V33 measured — a `src/ingest/door.mts`
    // with `node:child_process` left the three gates green because neither list
    // matched it — and its motive is written inside `SCAN_EXTENSIONS`, which is
    // the list this reader now asks instead of writing a second one.
    const source = "import { readdirSync } from 'node:fs';\nexport const files = () => readdirSync('src');\n";
    const helpers = {
      ts: 'tests/config/spec014-control-helper.ts',
      mts: 'tests/config/spec014-control-helper.mts',
      cts: 'tests/config/spec014-control-helper.cts',
    } as const;

    try {
      for (const path of Object.values(helpers)) writeFileSync(join(ROOT, path), source);

      const verdicts: Record<string, { group: 'serialized' | 'parallel'; diagnostics: string }> = {};
      for (const [extension, path] of Object.entries(helpers)) {
        const entry = `tests/spec014-control-${extension}.test.ts`;
        registerSyntheticSource(entry, `import './config/spec014-control-helper.${extension}';\n`);
        const partition = await partitionTestFiles([entry]);
        verdicts[extension] = {
          group: partition.serialized.includes(entry) ? 'serialized' : 'parallel',
          diagnostics: partition.unreadable.join('\n'),
        };
      }

      // THE CONTROL: the `.ts` twin is followed, reaches `node:fs`, and is
      // serialized with nothing to report.
      expect(verdicts.ts).toEqual({ group: 'serialized', diagnostics: '' });

      // THE TWO THAT USED TO PASS IN SILENCE: red, and each names itself.
      for (const extension of ['mts', 'cts'] as const) {
        expect([extension, verdicts[extension]!.diagnostics]).toEqual([
          extension,
          expect.stringContaining(`spec014-control-helper.${extension}`),
        ]);
        expect([extension, verdicts[extension]!.diagnostics]).toEqual([
          extension,
          expect.stringContaining('names a file of code this reader cannot follow'),
        ]);
      }
    } finally {
      for (const path of Object.values(helpers)) rmSync(join(ROOT, path), { force: true });
    }
  });

  it('13. y lo que existe sin ser código sigue cerrando el paseo sin ruido: `../globals.css`', async () => {
    // The live case F-SPEC-014-4 describes, and the reason the widening exists
    // at all: `src/app/(gl)/layout.tsx` imports `../globals.css` for its side
    // effect. It is inside the tree, it is not a file of code by the
    // repository's own declaration (`SCAN_EXTENSIONS`), and it carries no
    // imports — so it closes the walk instead of opening a hole, and says
    // nothing. THIS is the half that may stay silent; case 12 is the half that
    // may not, and telling them apart is the whole of F-SPEC-014-9.
    registerSyntheticSource(
      'tests/spec014-control-asset.test.ts',
      "import '../src/app/globals.css';\n",
    );
    const partition = await partitionTestFiles(['tests/spec014-control-asset.test.ts']);
    expect(partition.unreadable).toEqual([]);
    expect(partition.parallel).toEqual(['tests/spec014-control-asset.test.ts']);
  });

  it('14. y un especificador que no nombra nada dentro del árbol sigue siendo rojo', async () => {
    // The third outcome, kept apart from the other two so that a red says
    // WHICH of the three happened: nothing at that path at all.
    registerSyntheticSource(
      'tests/spec014-control-absent.test.ts',
      "import './config/spec014-there-is-no-such-helper.mts';\n",
    );
    const partition = await partitionTestFiles(['tests/spec014-control-absent.test.ts']);
    expect(partition.unreadable.join('\n')).toContain('does not resolve inside the repository');
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
