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
 * things we do not fix: THE EXPORTED SURFACE OF THE PACKAGES WE ALREADY HAVE —
 * which exists outside this test, in the installed package — and the ways
 * ECMAScript gives of obtaining a capability. They grow WHEN A REAL DEPENDENCY
 * ARRIVES — one line per package and one per name, in a file called this, in a
 * diff a reviewer reads.
 *
 * And they are closed AT THE GRAIN OF THE CAPABILITY, which is the correction
 * of 2026-09-01: conceding a package whole left the old question alive —«is
 * this one a way out?»— and that question was answered with a blacklist of
 * thirteen names that did not have `cheerio` on it. Conceding a surface makes
 * the question disappear (F-SPEC-008-V15).
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import {
  moduleSpecifiers,
  resolveModule,
  withoutImportStatements,
} from '../../mirror/support/imports';
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
 * CA-2.3 — WHAT MAY BE IMPORTED FROM OUTSIDE THE REPOSITORY, AND WHICH NAMES.
 *
 * A PACKAGE IS NOT CONCEDED. A SURFACE IS. That is the whole change of the
 * amendment of 2026-09-01, and it exists because the previous version conceded
 * `cheerio` entire — and `cheerio` IS an HTTP client: since 1.0 it exports
 * `fromURL`, which resolves the URL, opens the connection and hands back the
 * document. Eleven lines in `src/ingest/preflight.ts` sent a real request with
 * no `User-Agent`, no `robots.txt` and no turn, with the suite at 748/748
 * (F-SPEC-008-V15). It did not go round any detector: it came in through the
 * front door, because the specifier was a literal and it was on the list.
 *
 * The obligation it replaces — «no entry is a way out» — had been mechanised
 * with A LIST OF THIRTEEN FORBIDDEN NAMES, and `cheerio` was not on it because
 * nobody knew it was one. A blacklist had survived inside the criterion
 * written to abolish blacklists. WITH THE CONCESSION AT THE GRAIN OF THE
 * CAPABILITY THE QUESTION DISAPPEARS: nobody has to decide whether a package
 * is a door, because the package is not conceded. `fromURL` is red without
 * anybody naming it, and so is the next one. THERE IS NO BLACKLIST HERE, AND
 * ADDING ONE BACK WOULD BE THE DEFECT RETURNING.
 *
 * An EMPTY surface is legitimate and says something exact: a package this
 * repository takes no capability from. `next` and `react` are that today —
 * only their types are imported, and `verbatimModuleSyntax` erases those.
 *
 * The list grows when a real dependency arrives, and that is natural (Alberto
 * Fojo, 2026-09-01): one line per package AND ONE PER NAME, in a file called
 * this, in a diff a reviewer reads. What still needs a human signature is
 * declaring a name whose job is to ask a third party for bytes.
 */
export interface PackageEntry {
  /** The literal specifier, exactly as it is written in an import. */
  readonly specifier: string;
  /** The names that may cross the frontier. `default` names the default export. */
  readonly surface: readonly string[];
  /** Written when the entry does not explain itself (obligation 3). */
  readonly motive?: string;
}

export const ALLOWED_PACKAGES: readonly PackageEntry[] = [
  { specifier: '@vercel/blob', surface: ['get', 'list', 'put'] },
  // `load` and nothing else. `fromURL` is the way out that F-SPEC-008-V15 came
  // through, and it stays outside by not being written here.
  { specifier: 'cheerio', surface: ['load'] },
  { specifier: 'next', surface: [] },
  { specifier: 'node:crypto', surface: ['createHash'] },
  { specifier: 'node:fs', surface: ['existsSync'] },
  { specifier: 'node:fs/promises', surface: ['mkdir', 'readFile', 'readdir', 'writeFile'] },
  {
    specifier: 'node:module',
    surface: ['registerHooks'],
    motive:
      'src/mirror/cli/node-resolve.ts registers a resolution hook so the CLIs can run in TypeScript. It is the one module-resolution capability outside src/polite/, and it is named, not tolerated in silence.',
  },
  { specifier: 'node:path', surface: ['dirname', 'join', 'relative', 'resolve', 'sep'] },
  { specifier: 'node:url', surface: ['fileURLToPath', 'pathToFileURL'] },
  { specifier: 'postgres', surface: ['default'] },
  { specifier: 'react', surface: [] },
  {
    specifier: 'vitest/config',
    surface: ['defineConfig'],
    motive:
      'CA-2.6 obliges the scan to cover vitest.config.ts and vitest.integration.config.ts, which are executable versioned code outside tests/, and those import the configuration helper.',
  },
  { specifier: 'zod', surface: ['z'] },
];

/** The entry a specifier names, or `null` when it is not declared. */
export function packageEntry(
  specifier: string,
  allowed: readonly PackageEntry[] = ALLOWED_PACKAGES,
): PackageEntry | null {
  return allowed.find((entry) => entry.specifier === specifier) ?? null;
}

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

/** A regular expression source that matches `identifier` and nothing longer. */
function identifierPattern(local: string, tail: string): RegExp {
  return new RegExp(`(?<![.\\w$])${local.replaceAll(/[$]/g, '\\$&')}${tail}`, 'g');
}

/**
 * CA-2.3, the namespace half — `import * as ns` obliges every `ns.x` to be
 * declared.
 *
 * A namespace is the whole export object handed over in one binding, so
 * without this the surface would be a formality: `import * as cheerio` and
 * then `cheerio.fromURL(url)` is the same capability by another spelling. Three
 * things are offences here and each is a different way of escaping the
 * enumeration:
 *
 *   1. a member that is not declared — the point of the criterion;
 *   2. a COMPUTED access — `ns['from' + 'URL']` — which no enumeration can
 *      read, and is the same shape as a non-literal specifier (F-SPEC-008-V7);
 *   3. the namespace ESCAPING AS A VALUE — passed, returned, re-exported —
 *      because from there every member is reachable off-file.
 */
function namespaceOffences(file: ScannedFile, local: string, entry: PackageEntry): string[] {
  const code = withoutImportStatements(file.code);
  const offences: string[] = [];

  if (identifierPattern(local, '\\s*\\[').test(code)) {
    offences.push(`${file.path}: computed access on the namespace \`${local}\` of ${entry.specifier}`);
  }

  for (const match of code.matchAll(identifierPattern(local, '\\s*\\.\\s*([A-Za-z_$][\\w$]*)'))) {
    const member = match[1]!;
    if (!entry.surface.includes(member)) {
      offences.push(`${file.path}: ${entry.specifier} does not declare \`${member}\` in its surface`);
    }
  }

  if (identifierPattern(local, '(?![\\w$])(?!\\s*[.[])').test(code)) {
    offences.push(`${file.path}: the namespace \`${local}\` of ${entry.specifier} escapes as a value`);
  }

  return offences;
}

/**
 * CA-2.3 — every module specifier is a declared entry of the allowed list, or
 * a path that resolves inside the repository, AND EVERY NAME THAT CROSSES THAT
 * FRONTIER IS IN THE SURFACE THE ENTRY DECLARES. What is not there is red, and
 * nobody needs to know it exists.
 *
 * Red by construction, inside `src/polite/` included:
 *
 *   - a specifier that IS NOT A STATIC LITERAL — `import(MOD)`,
 *     `import('node:' + 'https')` — because an import nobody can read closes
 *     no door (F-SPEC-008-V7);
 *   - a DYNAMIC `import()` of a package entry, which hands over the whole
 *     namespace and cannot be closed at the site of the import;
 *   - a SIDE-EFFECT import of a package entry, which imports no name and so
 *     cannot satisfy this closure.
 *
 * The last two stop being red the day an entry declares that shape with its
 * motive written, which is a diff and not an arbitration.
 *
 * `import type` does not count: `verbatimModuleSyntax` erases it whole, it
 * crosses no capability, and asking it for a surface would be a toll.
 */
export async function importOffences(
  file: ScannedFile,
  allowed: readonly PackageEntry[] = ALLOWED_PACKAGES,
): Promise<readonly string[]> {
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

    const entry = packageEntry(text, allowed);
    if (entry === null) {
      offences.push(`${file.path}: ${text} is not a declared package entry`);
      continue;
    }

    if (specifier.kind === 'dynamic') {
      offences.push(`${file.path}: dynamic import() of the package entry ${text}`);
      continue;
    }
    if (specifier.kind === 'side-effect') {
      offences.push(`${file.path}: side-effect import of the package entry ${text}`);
      continue;
    }
    if (specifier.unreadableClause) {
      offences.push(`${file.path}: the import clause of ${text} cannot be read`);
      continue;
    }
    if (specifier.typeOnly) continue;

    for (const binding of specifier.bindings) {
      if (binding.kind === 'namespace') {
        offences.push(...namespaceOffences(file, binding.local, entry));
        continue;
      }
      if (!entry.surface.includes(binding.name)) {
        offences.push(`${file.path}: ${text} does not declare \`${binding.name}\` in its surface`);
      }
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
