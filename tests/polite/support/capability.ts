/**
 * CA-2 — the declared lists, and the detectors built on them (ADR-016).
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
 *
 * WHAT CHANGED ON THE FIFTH ROUND IS NOT THE GRAIN: IT IS WHO READS.
 * The specifiers, the clauses and the bare identifiers all come out of
 * `readModule` — the compiler's own tree (`tests/mirror/support/imports.ts`) —
 * because a reader of regular expressions decided wrong three times about
 * questions a parser answers on its own (F-SPEC-008-V27). And the LIST OF
 * FILES stopped being `git`'s: `git ls-files --exclude-standard` inherits
 * `.gitignore`, whose line 17 hides everything under any `robots/` directory
 * for a reason that is legitimate and untouchable — third-party `robots.txt`
 * files stay out of the repository (ADR-009 §3) — and a
 * `src/ingest/robots/side.ts` with an
 * unrestricted `cheerio.fromURL` left `tests/polite` at 76/76
 * (F-SPEC-008-V28). NO RULE THAT EXISTS FOR SOMETHING ELSE DECIDES WHAT CODE
 * GETS AUDITED.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import {
  readModule,
  registerSyntheticSource,
  resolveModule,
} from '../../mirror/support/imports';
import { stripComments } from '../../support/source-tree';
import type { ModuleReading, ModuleSpecifier } from '../../mirror/support/imports';

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

export interface ScanExclusion {
  /** A path prefix, relative to the repository root. A directory ends in `/`. */
  readonly path: string;
  /** Why it is not audited. Same obligation as a package entry's motive. */
  readonly motive: string;
}

/**
 * CA-2.6 — WHAT THE SCAN DOES NOT READ, AND WHY. THE SCAN'S OWN LIST.
 *
 * Until the fifth round this list did not exist, because the file list came
 * from `git ls-files --exclude-standard` and the exclusions were `.gitignore`'s
 * — a file written to keep third-party data out of the repository, not to
 * decide what code is audited. It hid everything under any `robots/`
 * directory, and a file under one went unread (F-SPEC-008-V28).
 *
 * Today there is exactly one entry, and it is the one that justifies itself.
 * The day a root needs a second one, its motive has to be written here; if the
 * motive is «there are files in there that get in the way», the frontier is
 * drawn wrong.
 */
export const SCAN_EXCLUSIONS: readonly ScanExclusion[] = [
  {
    path: 'node_modules/',
    motive: 'Installed dependencies. Not our code, and CA-2.3 judges the specifier as written, not what it resolves to.',
  },
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
  // The reader of CA-2.3 pays for itself with an entry, like anything else.
  // `typescript` is already a declared dependency — it is what compiles this —
  // and from the amendment of 2026-09-01 it is also what READS the frontier.
  // The specifier is judged AS WRITTEN (CA-2.3, «what it resolves to is the
  // business of package-lock.json»), so the entries are the two subpaths the
  // reader actually writes; both sort between `react` and `vitest/config`.
  // It is the first entry whose only importer lives in `tests/`, which is
  // outside the roots of CA-2.6: it is declared all the same, because a list
  // of dependencies missing the guardian's own would lie about what this
  // repository uses. NO NAME IN EITHER SURFACE ASKS A THIRD PARTY FOR BYTES,
  // which is the only thing that would have needed a signature.
  {
    specifier: 'typescript/unstable/ast',
    surface: [
      'SyntaxKind',
      'isCallExpression',
      'isElementAccessExpression',
      'isExportDeclaration',
      'isIdentifier',
      'isImportDeclaration',
      'isPropertyAccessExpression',
      'isStringLiteral',
    ],
    motive:
      'The syntax tree CA-2.3 reads from. In typescript@7 the classic API does not exist: the root package exports only `version` and `versionMajorMinor`, and the tree lives under `unstable/ast`. Only the kind table and the predicates the reader uses — none of them opens anything.',
  },
  {
    specifier: 'typescript/unstable/sync',
    surface: ['API'],
    motive:
      'Opens the real project (`updateSnapshot({ openProjects })`) so the reader judges the same program the compiler compiles. It talks to the compiler binary over stdio pipes and NOT over a socket, which is why it does not disturb the trap of CA-2.1 (measured, sonda J).',
  },
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
  /** The file with comments removed. Kept for the criteria that quote prose. */
  readonly code: string;
  /** What the compiler's tree says about this file. THE ONE READER. */
  readonly reading: ModuleReading;
  readonly specifiers: readonly ModuleSpecifier[];
}

function excluded(path: string): boolean {
  return SCAN_EXCLUSIONS.some((exclusion) =>
    exclusion.path.endsWith('/') ? path.startsWith(exclusion.path) : path === exclusion.path,
  );
}

/**
 * CA-2.6 — EVERY `.ts`/`.tsx` UNDER THE DECLARED ROOTS, FROM THE FILE TREE.
 *
 * Not from `git`. `git ls-files --exclude-standard` inherits `.gitignore`, and
 * a rule written to protect third-party data — everything under any `robots/`
 * directory, ADR-009 §3 — ended up deciding which code gets audited:
 * `src/ingest/robots/side.ts` with an
 * unrestricted `cheerio.fromURL` left `tests/polite` at 76/76, measured
 * (F-SPEC-008-V28). The exclusions here are the scan's OWN, declared above
 * with their motive.
 *
 * The price is the right one and it is said out loud: a junk file with a `.ts`
 * extension under a root IS RED. Stopping being red is deleting it or
 * declaring an exclusion with its motive.
 */
export function scannedSources(): readonly string[] {
  const files: string[] = [];

  function walk(directory: string): void {
    let entries;
    try {
      entries = readdirSync(join(ROOT, directory), { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const path = directory === '' ? entry.name : `${directory}/${entry.name}`;
      if (entry.isDirectory()) {
        if (!excluded(`${path}/`)) walk(path);
        continue;
      }
      if (!entry.isFile()) continue;
      if (excluded(path)) continue;
      if (path.endsWith('.ts') || path.endsWith('.tsx')) files.push(path);
    }
  }

  for (const root of SCAN_ROOTS) {
    if (root.endsWith('/')) walk(root.slice(0, -1));
    else if (!excluded(root) && existsSync(join(ROOT, root))) files.push(root);
  }

  return files.sort();
}

/**
 * Every `.ts`/`.tsx` `git` knows about outside `tests/`.
 *
 * `git` KEEPS WHAT IT IS THE AUTHORITY ON: what is versioned. That is what the
 * coverage case needs — «every versioned file outside `tests/` falls under a
 * declared root» — and nothing else. WHAT GETS READ is `scannedSources()`, and
 * the two lists are different on purpose: under the roots, the read list has
 * to be the wider of the two.
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

/** Everything the scan covers, read once, through the one reader. */
export async function scanRepository(): Promise<readonly ScannedFile[]> {
  const files: ScannedFile[] = [];

  for (const path of scannedSources()) {
    const text = await readFile(path, 'utf8');
    const reading = readModule(path);
    files.push({ path, text, code: stripComments(text), reading, specifiers: reading.specifiers });
  }

  return files;
}

/**
 * Builds a file out of synthetic text, for the positive controls.
 *
 * Nothing is written to disk: the text is declared to the compiler through the
 * reader's overlay (sonda H), so a failing control leaves no mutation behind.
 */
export function syntheticFile(path: string, text: string): ScannedFile {
  registerSyntheticSource(path, text);
  const reading = readModule(path);
  return { path, text, code: stripComments(text), reading, specifiers: reading.specifiers };
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
 * CA-2.3, the namespace half — `import * as ns` obliges every `ns.x` to be
 * declared.
 *
 * A namespace is the whole export object handed over in one binding, so
 * without this the surface would be a formality: `import * as cheerio` and
 * then `cheerio.fromURL(url)` is the same capability by another spelling.
 * Three things are offences, and each is a different way of escaping the
 * enumeration:
 *
 *   1. a member that is not declared — the point of the criterion;
 *   2. a COMPUTED access — `ns['from' + 'URL']` — which no enumeration can
 *      read, and is the same shape as a non-literal specifier (F-SPEC-008-V7);
 *   3. the namespace ESCAPING AS A VALUE — passed, returned, re-exported —
 *      because from there every member is reachable off-file.
 *
 * All three come off the tree: the reader already knows which identifiers are
 * references and which are the names of declarations, which is the difference
 * between a use of `cheerio` and the `cheerio` of its own import.
 */
function namespaceOffences(file: ScannedFile, local: string, entry: PackageEntry): string[] {
  const offences: string[] = [];

  for (const read of file.reading.namespaceReads) {
    if (read.local !== local) continue;
    if (read.kind === 'computed') {
      offences.push(
        `${file.path}: computed access on the namespace \`${local}\` of ${entry.specifier}`,
      );
      continue;
    }
    if (read.kind === 'value') {
      offences.push(
        `${file.path}: the namespace \`${local}\` of ${entry.specifier} escapes as a value`,
      );
      continue;
    }
    if (read.member !== null && !entry.surface.includes(read.member)) {
      offences.push(
        `${file.path}: ${entry.specifier} does not declare \`${read.member}\` in its surface`,
      );
    }
  }

  return offences;
}

/**
 * CA-2.3 — every module specifier is a declared entry of the allowed list, or
 * a path that resolves inside the repository, AND EVERY NAME THAT CROSSES THAT
 * FRONTIER IS IN THE SURFACE THE ENTRY DECLARES. What is not there is red, and
 * nobody needs to know it exists.
 *
 * FIRST, TWO THINGS THAT ARE RED BEFORE ANY LIST IS CONSULTED, and they are
 * what makes «fail closed» a case instead of a claim (CA-2.3, obligation 2):
 *
 *   - a file the compiler cannot parse, or cannot see at all;
 *   - a module THE COMPILER NAMES that this reader did not enumerate. That is
 *     the one that would have caught the ninth evasion: an `import` written
 *     after another statement on the same line was invisible to the old reader
 *     AND REPORTED NOTHING (F-SPEC-008-V27). It is checked as a multiset, so
 *     «two imports on one line, sees the first and loses the second» is red
 *     too.
 *
 * Then, red by construction, inside `src/polite/` included:
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

  if (file.reading.unparseable) {
    return [`${file.path}: the compiler cannot parse this file`];
  }

  const enumerated = new Map<string, number>();
  for (const specifier of file.specifiers) {
    if (specifier.text === null) continue;
    enumerated.set(specifier.text, (enumerated.get(specifier.text) ?? 0) + 1);
  }
  const counted = new Map<string, number>();
  for (const named of file.reading.compilerModules) {
    const seen = (counted.get(named) ?? 0) + 1;
    counted.set(named, seen);
    if ((enumerated.get(named) ?? 0) < seen) {
      offences.push(
        `${file.path}: the compiler names ${named} and the reader did not enumerate it`,
      );
    }
  }

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
 *
 * IT IS READ OFF THE SAME TREE, from the fifth round on. The text pattern this
 * replaces could not tell a bare `fetch` from an interface member called
 * `fetch` (it flagged one in `src/polite/http.ts` that is a declaration, not a
 * use), it needed comments stripped first because half of this repository's
 * prose quotes the very lines it hunted, and A NAME WRITTEN WITH UNICODE
 * ESCAPES —`globalThis`— WAS THE SAME IDENTIFIER FOR THE COMPILER AND A
 * DIFFERENT ONE FOR THE PATTERN. The tree has none of those three problems.
 */
const CAPABILITY_NAMES: readonly (readonly [string, string])[] = [
  ['globalThis', 'globalThis'],
  ['fetch', 'bare `fetch`'],
  ['XMLHttpRequest', 'XMLHttpRequest'],
  ['WebSocket', 'WebSocket'],
  ['EventSource', 'EventSource'],
  ['navigator', 'navigator'],
  ['eval', 'eval'],
  // The constructor is the capability however it is spelled, so a bare
  // reference counts and not only `new Function(…)`.
  ['Function', 'new Function'],
  ['require', 'require'],
];

export function capabilityOffences(file: ScannedFile): readonly string[] {
  if (file.reading.unparseable) return [`${file.path}: the compiler cannot parse this file`];

  return CAPABILITY_NAMES.filter(([name]) => file.reading.bareIdentifiers.has(name)).map(
    ([, label]) => `${file.path}: ${label}`,
  );
}
