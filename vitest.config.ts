import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { readModule, resolveModule } from './tests/mirror/support/imports.ts';

/**
 * SPEC-014 — THE SUITE THAT WRITES IN THE TREE AND THE SUITE THAT READS IT.
 *
 * `npm test` was red one run in five with nothing broken, in `main`, with three
 * different victims. The cause is one: `tests/polite/architecture.test.ts`
 * writes REAL FILES INSIDE THE REPOSITORY — eight paths, two of them at the
 * root — and removes them in its `finally`, because its positive controls are
 * only true if the file exists (ADR-016 §4). A dozen other suites walk that
 * same tree. Vitest runs files in parallel, so reader and writer land in
 * different workers over shared state: either the walk catches the file and a
 * set assertion has ONE FILE TOO MANY, or it catches it between the `readdir`
 * and the `readFile` and the run dies with `ENOENT`.
 *
 * The fix is a partition, and the whole of it lives here: two projects that
 * never run at the same time. The guardian that keeps it honest is
 * `tests/config/partition.test.ts`.
 *
 * WHY THE RULE IS «CAN REACH `node:fs`» AND NOT «WALKS THE REAL TREE».
 * The narrow list would be fifteen files today, and it would be closed by
 * SOMEONE'S READING OF THE CODE — which is what ADR-016 §3.1 refuses. «Can
 * reach the file system through the repository's import graph» is closed by the
 * module graph the compiler resolves, which exists outside this file. The price
 * is measured and paid on purpose: 41 of 100 files run in series, 26 of them
 * without touching the shared tree. Narrowing the rule to buy time back is
 * reintroducing the hand-written list; the way out, when the budget of CA-8.4
 * gets close, is the shared lock declared out of scope in the spec.
 */

const ROOT = fileURLToPath(new URL('.', import.meta.url));

/** The glob the universe of `npm test` is derived from. Declared once (CA-2.1). */
export const TEST_INCLUDE: readonly string[] = ['tests/**/*.test.ts'];

/**
 * The exclusions that were always here, unchanged by SPEC-014.
 *
 * The suites that need real credentials are NOT here, and they are not skipped
 * either: they live in `vitest.integration.config.ts` and fail loudly without
 * them (`npm run test:db`, `npm run test:blob`). The gate of 2026-08-29 ruled
 * that without credentials the affected criteria are UNMET, not skipped — so
 * they must never make this suite green by silence.
 *
 * BOTH PROJECTS CARRY THIS LIST VERBATIM. That is what makes the union of the
 * partition exact by construction: whatever the walk below over- or
 * under-collects, a file matching the glob and not excluded here runs in
 * exactly one of the two groups.
 */
export const TEST_EXCLUSIONS: readonly string[] = [
  '**/node_modules/**',
  'tests/db/**',
  'tests/raw/blob.contract.test.ts',
];

/** The capability the partition is drawn around (CA-3). */
export const FILE_SYSTEM_MODULES: readonly string[] = ['node:fs', 'node:fs/promises'];

export const PARALLEL_GROUP = 'parallel';
export const SERIALIZED_GROUP = 'serialized';

/** `groupOrder`: groups run from lowest to highest, and never at the same time. */
const PARALLEL_ORDER = 0;
const SERIALIZED_ORDER = 1;

// ─────────────────────────────────────────────────────────────────────────────
// The universe.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Every `tests/**\/*.test.ts` of the repository, as paths relative to the root.
 *
 * A SUPERSET of what runs on purpose: nothing here is filtered by
 * `TEST_EXCLUSIONS`, because both projects carry those exclusions themselves. A
 * file classified here that the exclusions drop simply never runs — and a file
 * this walk missed still runs, in the parallel group, instead of vanishing.
 * Over-collecting is harmless; under-collecting is not, and this is the shape
 * that keeps the dangerous direction closed.
 *
 * `readdir` and not a glob library: `node:fs/promises` concedes `readdir` in
 * `ALLOWED_PACKAGES` and this file is inside the roots ADR-014 §4 audits.
 */
export async function testUniverse(): Promise<readonly string[]> {
  const entries = await readdir(join(ROOT, 'tests'), { recursive: true });
  return entries
    .map((entry) => `tests/${entry.replaceAll(sep, '/')}`)
    .filter((path) => path.endsWith('.test.ts'))
    .sort();
}

// ─────────────────────────────────────────────────────────────────────────────
// The graph. ONE READER, and it is the compiler's own tree.
// ─────────────────────────────────────────────────────────────────────────────

interface Node {
  /** Project files this one imports, relative to the root. */
  readonly edges: readonly string[];
  /** The file-system module this one imports directly, or `null`. */
  readonly fileSystem: string | null;
  /** Why this file cannot be judged. Empty when it can. */
  readonly unreadable: readonly string[];
  /** It carries a specifier that is not a static literal (CA-3.5 residue). */
  readonly nonLiteral: boolean;
}

/**
 * The `.js` → `.ts` substitution the compiler does, so a specifier written the
 * way NodeNext spells it still lands on the file it names. Nothing in the
 * repository writes one today; it is here because CA-3.2 asks the resolution to
 * cover it, and because a specifier that does not land is red (CA-3.3), not
 * silence.
 */
function typescriptTwin(specifier: string): string | null {
  if (specifier.endsWith('.js')) return `${specifier.slice(0, -3)}.ts`;
  if (specifier.endsWith('.jsx')) return `${specifier.slice(0, -4)}.tsx`;
  if (specifier.endsWith('.mjs')) return `${specifier.slice(0, -4)}.ts`;
  if (specifier.endsWith('.cjs')) return `${specifier.slice(0, -4)}.ts`;
  return null;
}

/**
 * Whether a literal specifier names something that EXISTS in the tree without
 * being a module this reader can follow — `../globals.css` is the live case.
 *
 * The same widening SPEC-008 made for the same reason, and spelled here rather
 * than imported from `tests/polite/support/capability.ts` because importing
 * that module makes Vite warn, three times per run, about extensionless
 * imports it cannot load natively. What it is NOT is a second reader of
 * imports: the specifiers still come from the one AST reader, and this only
 * says whether a path escapes the tree.
 */
function existsInsideRepository(specifier: string, fromFile: string): boolean {
  const base = specifier.startsWith('@/')
    ? join(ROOT, 'src', specifier.slice(2))
    : resolve(dirname(join(ROOT, fromFile)), specifier);
  if (!base.startsWith(ROOT)) return false;
  return existsSync(base);
}

async function readNode(file: string): Promise<Node> {
  const reading = readModule(file);
  if (reading.unparseable) {
    return {
      edges: [],
      fileSystem: null,
      unreadable: [`${file}: the compiler cannot parse this file, or cannot see it at all`],
      nonLiteral: false,
    };
  }

  const edges: string[] = [];
  const unreadable: string[] = [];
  let fileSystem: string | null = null;
  let nonLiteral = false;

  for (const specifier of reading.specifiers) {
    const text = specifier.text;
    if (text === null) {
      // CA-3.5: declared residue. A specifier nobody can read names no module,
      // so this reader cannot follow it. It is COUNTED and not tolerated in
      // silence: `tests/polite/containment.test.ts` writes one on purpose —
      // `await import('node:' + 'http')`, case 7, the positive control of a
      // closed spec — and the guardian asks that no file of the PARALLEL group
      // carry one anywhere in its graph, which is where the residue could
      // decide a group behind our backs.
      nonLiteral = true;
      continue;
    }
    if (FILE_SYSTEM_MODULES.includes(text)) {
      fileSystem = text;
      continue;
    }
    if (!text.startsWith('.') && !text.startsWith('@/')) continue; // a package, not our source

    let resolved = await resolveModule(text, file);
    if (resolved === null) {
      const twin = typescriptTwin(text);
      if (twin !== null) resolved = await resolveModule(twin, file);
    }
    if (resolved === null) {
      // Wider than TypeScript's resolution, and the same widening SPEC-008
      // already made: a side-effect import of `../globals.css` names a file
      // that IS in the tree and carries no imports of its own, so it closes the
      // walk instead of opening a hole. What it is not is a module this reader
      // can follow, so it adds no edge.
      if (existsInsideRepository(text, file)) continue;
      // FAIL CLOSED (CA-3.3): a literal specifier this reader cannot place is
      // a file we cannot judge, and it says so naming itself.
      unreadable.push(`${file}: ${text} does not resolve inside the repository`);
      continue;
    }
    edges.push(resolved.startsWith(ROOT) ? resolved.slice(ROOT.length) : resolved);
  }

  return { edges, fileSystem, unreadable, nonLiteral };
}

export interface Partition {
  /** Every test file the glob names, exclusions aside. */
  readonly universe: readonly string[];
  /** Those whose import graph reaches `node:fs`/`node:fs/promises`. */
  readonly serialized: readonly string[];
  /** All the rest. */
  readonly parallel: readonly string[];
  /** Entry → the chain from it to the file-system module it reaches. */
  readonly witness: ReadonlyMap<string, readonly string[]>;
  /** Fail-closed diagnostics, each naming its file. Non-empty means RED. */
  readonly unreadable: readonly string[];
  /** Files in the graph carrying a specifier that is not a static literal. */
  readonly nonLiteral: readonly string[];
  /** Test files whose graph contains one of those, so the residue could bite. */
  readonly nonLiteralReach: readonly string[];
}

/**
 * Which group each test file belongs to, decided by the import graph.
 *
 * > A test file belongs to the SERIALIZED group if and only if its transitive
 * > import graph inside the repository — itself plus every module of `tests/`
 * > and of `src/` it reaches — contains `node:fs` or `node:fs/promises`.
 *
 * There is no list of exempt files here and there is nowhere to put one: the
 * only inputs are the universe and the graph (CA-3.4, ADR-016 §3.3).
 */
export async function partitionTestFiles(entries?: readonly string[]): Promise<Partition> {
  const universe = entries ?? (await testUniverse());
  const nodes = new Map<string, Node>();

  const load = async (file: string): Promise<Node> => {
    const known = nodes.get(file);
    if (known !== undefined) return known;
    const node = await readNode(file);
    nodes.set(file, node);
    for (const edge of node.edges) await load(edge);
    return node;
  };
  for (const entry of universe) await load(entry);

  const serialized: string[] = [];
  const parallel: string[] = [];
  const witness = new Map<string, readonly string[]>();
  const nonLiteralReach: string[] = [];

  for (const entry of universe) {
    const chain = chainTo(entry, nodes, (node) => node.fileSystem !== null);
    if (chain === null) parallel.push(entry);
    else {
      serialized.push(entry);
      const last = nodes.get(chain.at(-1)!)!;
      witness.set(entry, [...chain, last.fileSystem!]);
    }
    if (chainTo(entry, nodes, (node) => node.nonLiteral) !== null) nonLiteralReach.push(entry);
  }

  const unreadable: string[] = [];
  const nonLiteral: string[] = [];
  for (const [file, node] of [...nodes].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    unreadable.push(...node.unreadable);
    if (node.nonLiteral) nonLiteral.push(file);
  }

  return { universe, serialized, parallel, witness, unreadable, nonLiteral, nonLiteralReach };
}

/** The shortest chain of files from `entry` to one the predicate accepts. */
function chainTo(
  entry: string,
  nodes: ReadonlyMap<string, Node>,
  accepts: (node: Node) => boolean,
): string[] | null {
  const came = new Map<string, string | null>([[entry, null]]);
  const queue = [entry];

  while (queue.length > 0) {
    const file = queue.shift()!;
    const node = nodes.get(file);
    if (node === undefined) continue;
    if (accepts(node)) {
      const chain: string[] = [];
      let step: string | null = file;
      while (step !== null) {
        chain.unshift(step);
        step = came.get(step) ?? null;
      }
      return chain;
    }
    for (const edge of node.edges) {
      if (came.has(edge)) continue;
      came.set(edge, file);
      queue.push(edge);
    }
  }
  return null;
}

/**
 * What a claimed partition gets wrong against the graph's verdict.
 *
 * The guardian of CA-3.1, written as a function so CA-6.3 can switch the
 * mechanism off — move a file that reaches `node:fs` into the parallel group —
 * and read the red instead of waiting for a flake that may not come.
 */
export function partitionOffences(
  claimed: { readonly serialized: readonly string[]; readonly parallel: readonly string[] },
  truth: Partition,
): readonly string[] {
  const offences: string[] = [];
  const claimedSerialized = new Set(claimed.serialized);
  const claimedParallel = new Set(claimed.parallel);

  for (const file of claimed.parallel) {
    const chain = truth.witness.get(file);
    if (chain !== undefined) {
      offences.push(`${file}: runs in the parallel group and reaches ${chain.join(' → ')}`);
    }
  }
  for (const file of truth.witness.keys()) {
    if (!claimedSerialized.has(file)) {
      offences.push(`${file}: reaches the file system and is not in the serialized group`);
    }
  }
  for (const file of truth.universe) {
    if (!claimedSerialized.has(file) && !claimedParallel.has(file)) {
      offences.push(`${file}: is in neither group, so it would stop running in silence`);
    }
    if (claimedSerialized.has(file) && claimedParallel.has(file)) {
      offences.push(`${file}: is in both groups`);
    }
  }
  return offences;
}

// ─────────────────────────────────────────────────────────────────────────────
// The configuration.
// ─────────────────────────────────────────────────────────────────────────────

export default defineConfig(async () => {
  const { serialized, parallel, unreadable } = await partitionTestFiles();

  // FAIL CLOSED (CA-3.3). A file this reader cannot judge does not get put in
  // the fast group by default: the suite refuses to start, naming it.
  if (unreadable.length > 0) {
    throw new Error(
      `SPEC-014: the import graph cannot be read, so the partition cannot be drawn:\n${unreadable.join('\n')}`,
    );
  }

  return {
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    // Vitest has no Next in front of it, so it needs the JSX runtime spelled out
    // to be able to render the site's routes to a string (SPEC-004 CA-2, CA-3).
    // Explicit and not inherited from tsconfig on purpose: `next build` rewrites
    // that field on its own, and the suite should not move when it does.
    oxc: { jsx: { runtime: 'automatic' as const } },
    test: {
      // The two projects inherit everything above with `extends: true`: the
      // alias and the JSX runtime are declared ONCE and both receive them
      // (CA-5.1). Copying them would be two places to forget.
      projects: [
        {
          extends: true as const,
          test: {
            name: PARALLEL_GROUP,
            include: [...TEST_INCLUDE],
            exclude: [...TEST_EXCLUSIONS, ...serialized],
            sequence: { groupOrder: PARALLEL_ORDER },
            // CA-3, CA-4, CA-6 de SPEC-001: los invariantes se prueban a nivel
            // de TIPO. Los ficheros .test-d.ts usan @ts-expect-error: si el
            // invariante deja de sostenerse, la directiva queda sin usar y tsc
            // falla. Es la prueba invertida. Vive en el grupo paralelo — en uno
            // solo, para no correr dos veces — y por eso nunca solapa con el
            // serializado (CA-1.3, CA-5.2).
            typecheck: {
              enabled: true,
              include: ['tests/**/*.test-d.ts'],
              tsconfig: './tsconfig.json',
            },
          },
        },
        {
          extends: true as const,
          test: {
            name: SERIALIZED_GROUP,
            include: [...TEST_INCLUDE],
            exclude: [...TEST_EXCLUSIONS, ...parallel],
            // The two mechanisms of CA-1, and they are not redundant.
            // `sequence.groupOrder` is the DOCUMENTED one — «If you don't set
            // this option, all projects run in parallel» — and it is what keeps
            // this group away from the other. `fileParallelism: false` is what
            // keeps it away from ITSELF: the writer and the readers are both in
            // here.
            fileParallelism: false,
            sequence: { groupOrder: SERIALIZED_ORDER },
          },
        },
      ],
    },
  };
});
