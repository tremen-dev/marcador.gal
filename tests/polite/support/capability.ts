/**
 * CA-2 — the three declared lists, and the detectors built on them (ADR-016).
 *
 * The criterion stopped looking for what is forbidden. It ENUMERATES WHAT IS
 * ALLOWED and demands the rest be empty. That matters because the previous
 * mechanism could not finish: a list of ways to write a call grows with the
 * imagination of whoever goes round it, and two rounds of verification proved
 * it — three evasions closed, three new ones written (F-SPEC-008-10, V6, V7,
 * V8).
 *
 * The lists below are not lists of ways to write something. They are closed by
 * things we do not fix: the platform's exit surface, the dependencies we
 * already have, and the ways ECMAScript gives of obtaining a capability. They
 * grow WHEN A REAL DEPENDENCY ARRIVES — one line, in a file called this, in a
 * diff a reviewer reads.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { moduleSpecifiers, resolveModule } from '../../mirror/support/imports';
import { stripComments } from '../../support/source-tree';
import type { ModuleSpecifier } from '../../mirror/support/imports';

/**
 * CA-2.6 — WHERE THE SCAN LOOKS.
 *
 * `src/` is not the whole of the executable code and never was: `next.config.ts`
 * runs on every build and `src/site/redirects.ts` is reachable from nowhere
 * else, and the two vitest configurations are executable TypeScript at the
 * root as well. ADR-014 §4 says «in a script»; there is no `scripts/` today,
 * but there is executable configuration.
 */
export const SCAN_ROOTS: readonly string[] = [
  'src/',
  'next.config.ts',
  'vitest.config.ts',
  'vitest.integration.config.ts',
];

/**
 * CA-2.3 — WHAT MAY BE IMPORTED FROM OUTSIDE THE REPOSITORY.
 *
 * Twelve of these are the spec's own list. `vitest/config` is the thirteenth
 * and it is DECLARED AND NOT SMUGGLED: CA-2.6 obliges the scan to cover every
 * versioned `.ts`/`.tsx` outside `tests/`, which is exactly what pulls
 * `vitest.config.ts` and `vitest.integration.config.ts` in, and those import
 * the vitest configuration helper. The spec enumerated the packages of `src/`
 * and the roots of a wider scan, and the two do not meet. It is written here,
 * with its motive, because that is what this file is for — and it is reported
 * as a deviation in the ledger rather than hidden by narrowing the roots.
 *
 * `node:module` also carries its motive: `src/mirror/cli/node-resolve.ts`
 * registers a resolution hook so the CLIs can run in TypeScript. It is the one
 * module-resolution capability outside `src/polite/`, and it is named.
 *
 * NOTHING HERE IS AN HTTP CLIENT. The day one arrives — `undici`, `axios`,
 * anything — it is one line in this array, and that line is the conversation.
 */
export const ALLOWED_PACKAGES: readonly string[] = [
  '@vercel/blob',
  'cheerio',
  'next',
  'node:crypto',
  'node:fs',
  'node:fs/promises',
  'node:module',
  'node:path',
  'node:url',
  'postgres',
  'react',
  'vitest/config',
  'zod',
];

/**
 * CA-2.5 — WHERE EXECUTION CAN START.
 *
 * A file nobody imports is red. To stop being red it has to be imported — and
 * then CA-2.3 and CA-2.4 apply to it and CA-2.1 reaches it — or it has to be
 * added here, which is a visible diff in a file that is called this.
 */
export const ENTRY_POINTS: readonly string[] = [
  // Executable configuration at the root.
  'next.config.ts',
  'vitest.config.ts',
  'vitest.integration.config.ts',
  // Every route of the App Router (ADR-001, ADR-004).
  'src/app/(es)/es/proxecto/page.tsx',
  'src/app/(es)/es/robot/page.tsx',
  'src/app/(es)/layout.tsx',
  'src/app/(gl)/layout.tsx',
  'src/app/(gl)/proxecto/page.tsx',
  'src/app/(gl)/robot/page.tsx',
  'src/app/_contract/model-client.tsx',
  'src/app/robots.txt/route.ts',
  // The commands of `package.json`.
  'src/db/cli.ts',
  'src/mirror/cli/analizar-cli.ts',
  'src/mirror/cli/analizar-sin-referencia-cli.ts',
  'src/mirror/cli/capturar-cli.ts',
  // The public API of `src/ingest/`: the adapter is the way in and out.
  'src/ingest/adapter.ts',
];

/** The three destinations CA-2.5 names. Nothing under them may be orphaned. */
export const CONTAINED_DIRS: readonly string[] = ['src/ingest/', 'src/polite/', 'src/site/'];

/** The one module that is allowed to hold a way out (ADR-014 §1). */
export const COURTESY_DIR = 'src/polite/';

/** The single exit door of the whole repository (ADR-014 §4). */
export const EXIT_DOOR = 'src/polite/http.ts';

const ROOT = process.cwd();

export interface ScannedFile {
  /** Path relative to the repository root, with forward slashes. */
  readonly path: string;
  readonly text: string;
  /** The file with comments removed: prose about a pattern is not a use of it. */
  readonly code: string;
  readonly specifiers: readonly ModuleSpecifier[];
}

/**
 * Every `.ts`/`.tsx` of the working tree outside `tests/`. `git` is the
 * authority, and `--others --exclude-standard` is load-bearing: a file that is
 * NOT YET COMMITTED is still code that runs, and it is exactly the shape the
 * verifier's seven evasions took. Listing only `--cached` would have let a new
 * `src/ingest/side-door.ts` pass in green until somebody committed it —
 * measured, not supposed.
 */
export function versionedSources(): readonly string[] {
  return execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '*.ts', '*.tsx'],
    { encoding: 'utf8' },
  )
    .split('\n')
    .filter((path) => path.length > 0 && !path.startsWith('tests/'))
    .sort();
}

/** True when `path` falls under one of the declared roots. */
export function underScanRoots(path: string): boolean {
  return SCAN_ROOTS.some((root) => (root.endsWith('/') ? path.startsWith(root) : path === root));
}

/** Everything the scan covers, read once. */
export async function scanRepository(): Promise<readonly ScannedFile[]> {
  const files: ScannedFile[] = [];

  for (const path of versionedSources()) {
    if (!underScanRoots(path)) continue;
    const text = await readFile(path, 'utf8');
    files.push({ path, text, code: stripComments(text), specifiers: moduleSpecifiers(text) });
  }

  return files;
}

/** Builds a file out of synthetic text, for the positive controls. */
export function syntheticFile(path: string, text: string): ScannedFile {
  return { path, text, code: stripComments(text), specifiers: moduleSpecifiers(text) };
}

/**
 * Whether a relative or `@/…` specifier names a file that EXISTS inside this
 * repository.
 *
 * Wider than the TypeScript resolution of `reachableModules` on purpose: a
 * side-effect import of `../globals.css` resolves inside the repository and is
 * not a capability, so demanding it be a `.ts` would turn CA-2.3 into noise.
 * What matters is that the path does not escape the tree.
 */
export async function resolvesInsideRepository(
  specifier: string,
  fromFile: string,
): Promise<boolean> {
  if ((await resolveModule(specifier, fromFile)) !== null) return true;

  const base = specifier.startsWith('@/')
    ? join(ROOT, 'src', specifier.slice(2))
    : resolve(dirname(join(ROOT, fromFile)), specifier);

  if (!base.startsWith(`${ROOT}/`)) return false;
  return existsSync(base);
}

/**
 * CA-2.3 — every module specifier is a literal of the allowed list, or a path
 * that resolves inside the repository.
 *
 * A specifier that IS NOT A STATIC LITERAL is red by construction, inside
 * `src/polite/` included: `import('node:' + 'https')` obtains a capability
 * nobody reading the file can name, and an import nobody can read closes no
 * door (F-SPEC-008-V7).
 */
export async function importOffences(file: ScannedFile): Promise<readonly string[]> {
  const offences: string[] = [];

  for (const specifier of file.specifiers) {
    if (specifier.text === null) {
      offences.push(`${file.path}: specifier is not a static literal — ${specifier.raw}`);
      continue;
    }

    const text = specifier.text;
    if (text.startsWith('.') || text.startsWith('@/')) {
      if (!(await resolvesInsideRepository(text, file.path))) {
        offences.push(`${file.path}: ${text} does not resolve inside the repository`);
      }
      continue;
    }

    if (!ALLOWED_PACKAGES.includes(text)) {
      offences.push(`${file.path}: ${text} is not in ALLOWED_PACKAGES`);
    }
  }

  return offences;
}

/**
 * CA-2.4 — the ways of reaching a capability WITHOUT an import.
 *
 * Without an import, ECMAScript gives exactly three: the global object, a bare
 * global identifier, and `eval`/`Function`. CA-2.3 closes the import; this
 * closes the other three. It is a set closed by the language, not by us —
 * which is the whole difference with the mechanism this replaced.
 *
 * `require` is here too: it is CommonJS's import, and it is not a literal the
 * import scan can see.
 */
const CAPABILITY_PATTERNS: readonly (readonly [string, RegExp])[] = [
  ['globalThis', /\bglobalThis\b/],
  ['bare `fetch`', /(?<![.\w$'"`])fetch\s*\(/],
  ['XMLHttpRequest', /(?<![.\w$])XMLHttpRequest\b/],
  ['WebSocket', /(?<![.\w$])WebSocket\b/],
  ['EventSource', /(?<![.\w$])EventSource\b/],
  ['navigator', /(?<![.\w$])navigator\b/],
  ['eval', /(?<![.\w$])eval\s*\(/],
  ['new Function', /\bnew\s+Function\s*\(/],
  ['require', /(?<![.\w$])require\s*\(/],
];

/**
 * A module specifier names a module; it neither builds nor calls anything.
 * Without removing it, `from '@/polite/http'` would read as prose about a
 * capability. The specifiers themselves are CA-2.3's business.
 *
 * `require(…)` is NOT removed here: unlike `import`, it is a call, it is not a
 * specifier CA-2.3 can see, and it is one of the four ways of CA-2.4.
 */
function withoutModuleSpecifiers(code: string): string {
  return code.replaceAll(/(?:\bfrom|\bimport)\s*\(?\s*(['"])[^'"]*\1/g, '');
}

export function capabilityOffences(file: ScannedFile): readonly string[] {
  const code = withoutModuleSpecifiers(file.code);

  return CAPABILITY_PATTERNS.filter(([, pattern]) => pattern.test(code)).map(
    ([name]) => `${file.path}: ${name}`,
  );
}
