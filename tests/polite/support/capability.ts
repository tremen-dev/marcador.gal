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
  freeReferences,
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
 * THE LIST GOVERNS BOTH SIDES: what gets read (`scannedSources`) and what the
 * coverage asks `git` for (`versionedSources`). An exclusion that silenced only
 * one of the two would be the F-SPEC-008-V33 shape all over again.
 *
 * The second entry arrives with JavaScript declared (F-SPEC-008-V37), and it
 * arrives AS AN EXCLUSION WITH ITS MOTIVE and not as a silence, which is the
 * whole of what CA-2.6 asks: being outside has to be a declared decision. If a
 * motive is ever «there are files in there that get in the way», the frontier
 * is drawn wrong.
 */
export const SCAN_EXCLUSIONS: readonly ScanExclusion[] = [
  {
    path: 'node_modules/',
    motive: 'Installed dependencies. Not our code, and CA-2.3 judges the specifier as written, not what it resolves to.',
  },
  {
    path: 'docs/diseno/',
    motive:
      "The sources of EPIC-004's design system, and not application code: `_logic.js` is not even standalone JavaScript — it is a block `build.mjs` injects into the artboards — and nothing under `src/` imports either. It is the same frontier the quality gate already drew: `_logic.js` broke `oxlint` on 2026-09-01 and `.oxlintrc.json` has ignored `docs/diseno/` since (commit 5b632df, «Gate de calidad: oxlint ignora docs/diseno, que no es codigo»). It is written here, and not left to silence, because CA-2.6 asks that being outside be a declared decision.",
  },
  // The six entries below arrive with SPEC-009 CA-2, when the COVERAGE stopped
  // asking `git` and started walking the whole repository tree
  // (F-SPEC-008-V35). From then on, every code file OUTSIDE the walk is
  // outside by one of these lines — never by a rule written for something
  // else, `.gitignore` included.
  {
    path: 'tests/',
    motive:
      "The guardian's own code. ADR-016 §4 draws the frontier at «every code file outside `tests/`», the closed suites are counted file by file by each spec's CA of gates, and judging the guardian against its own lists would make every synthetic evasion it writes an offence of the suite that writes it.",
  },
  {
    path: '.git/',
    motive:
      "git's object database, hooks and metadata. It holds the history of the code, not the code: nothing in it runs, and walking it would audit every version ever written instead of the one that ships.",
  },
  {
    path: '.next/',
    motive:
      "Next's build output, regenerated by `next build` from the very sources the scan already reads. Auditing the compilation would judge the compiler's spelling, not ours — and it is full of generated `.js` by design.",
  },
  {
    path: '.claude/',
    motive:
      'Ephemeral agent worktrees (`.claude/worktrees/`): full checkouts of this same repository. Their code is audited where it lives — each checkout runs its own suite — and a walk that read them would judge every branch in progress against this one\'s lists.',
  },
  {
    path: 'raw/',
    motive:
      'The local DiskRawStore root (ADR-005): third-party payloads archived before parsing (RN-10), never code this repository runs, and ADR-009 keeps their content out of the repository. The walk does not read what the raw store guards.',
  },
  {
    path: 'next-env.d.ts',
    motive:
      "Generated by `next dev`/`next build` on every start, and declaration-only: it emits no runtime binding. `.gitignore` hides it too, but for git's reasons; this line is the scan's own decision, which is what CA-2.6 demands.",
  },
];

export interface ScanExtension {
  /** The file-name suffix, dot included, exactly as a file name ends. */
  readonly suffix: string;
  /** Why it is code this repository runs. Same obligation as a package entry. */
  readonly motive: string;
}

/**
 * CA-2.6 — WHAT COUNTS AS A FILE OF CODE, DECLARED NEXT TO THE ROOTS.
 *
 * THE FOURTH LIST WRITTEN INSIDE A FUNCTION, AND THE LAST ONE OF ITS FAMILY.
 * The roots, the exclusions and the package entries were already declared; this
 * one lived in an `endsWith('.ts') || endsWith('.tsx')` inside
 * `scannedSources()` AND, SEPARATELY, in a `'*.ts', '*.tsx'` pathspec inside
 * `versionedSources()`. Two lists of extensions are two chances for one of them
 * to fall short, and that is literally what happened: neither matched `.mts`,
 * so a `src/ingest/door.mts` with `node:child_process` was NOT READ (CA-2.3,
 * CA-2.4) and the coverage case DID NOT MISS IT either — `lint exit=0`,
 * `npm test` 772/772, `tests/polite` 86/86 (F-SPEC-008-V33).
 *
 * And unlike F-SPEC-008-V28, which needed `git add -f`, THAT FILE REACHES
 * PRODUCTION WITH A PLAIN `git add`. One letter of a file name separated green
 * from red.
 *
 * From here on there is ONE declaration and both lists derive from it: what is
 * read (`scannedSources`) and what the coverage asks `git` for
 * (`versionedSources`). The list is closed at every moment: A NEW EXTENSION IS
 * A DIFF WITH ITS MOTIVE, like an entry of `ALLOWED_PACKAGES`, AND NEVER AN
 * ARBITRATION.
 */
export const SCAN_EXTENSIONS: readonly ScanExtension[] = [
  { suffix: '.ts', motive: 'The ordinary module of this project.' },
  {
    suffix: '.tsx',
    motive: 'The same with JSX: the routes of src/app/ and the components of src/site/.',
  },
  {
    suffix: '.mts',
    motive:
      "TypeScript's explicit ESM module. Node runs it and a plain `git add` commits it, which is the whole of F-SPEC-008-V33: a src/ingest/door.mts with node:child_process left the three gates green because neither of the two lists matched it.",
  },
  {
    suffix: '.cts',
    motive:
      'The CommonJS twin of .mts, and it is declared BEFORE anybody writes one. A list that only grows after the measurement is a list that arrives late.',
  },
  // JAVASCRIPT, AND IT IS NOT A FORMALITY: THIS PROJECT COMPILES IT AND RUNS
  // IT. The list stopped at TypeScript's family, so `.js`, `.jsx`, `.mjs` and
  // `.cjs` were outside BY SIDE EFFECT AND NOT BY DECLARED DECISION — neither
  // an entry nor an exclusion with a motive — which is exactly what CA-2.6
  // guarantees does not happen. Measured: `src/app/(gl)/vprobe/route.js` with
  // `node:child_process` is COMPILED by `next build` (`ƒ /vprobe` in the
  // production route table), SERVED by `next start`, commits with a plain
  // `git add`, and left `lint exit=0`, `npm test` 775/775, `tests/polite`
  // 89/89 and `test:db` 144/144 with NEITHER LIST SEEING IT (F-SPEC-008-V37).
  // Worse than the `.mts` of F-SPEC-008-V33 in the dimension that decided its
  // destination: that one was an orphan, THIS ONE IS A LIVE HTTP ENDPOINT.
  {
    suffix: '.js',
    motive:
      'Next compiles and serves a route written in plain JavaScript — measured, `ƒ /vprobe` in the production route table — and Node runs it. It is code this repository ships (F-SPEC-008-V37).',
  },
  {
    suffix: '.jsx',
    motive:
      'The same with JSX. Declared BEFORE anybody writes one, like .cts: nothing here forbids a route or a component in .jsx, and a list that waits for the measurement arrives late.',
  },
  {
    suffix: '.mjs',
    motive:
      "JavaScript's explicit ESM module. Node runs it directly, and it is the cheap variant of the same evasion: `src/ingest/vdoor.mjs` left the same four numbers green (F-SPEC-008-V37).",
  },
  {
    suffix: '.cjs',
    motive:
      'The CommonJS twin of .mjs. Declared for the same reason as .cts, and it matters one notch more here: CA-2.4 closes `require`, and `require` is what a .cjs writes.',
  },
];

/** True when the file name ends in one of the declared extensions. */
export function isCodeFile(
  path: string,
  extensions: readonly ScanExtension[] = SCAN_EXTENSIONS,
): boolean {
  return extensions.some((extension) => path.endsWith(extension.suffix));
}

/**
 * The `git` pathspec of the SAME declaration — never a second list.
 *
 * `versionedSources()` used to write `'*.ts', '*.tsx'` by hand here, and that
 * is the half of F-SPEC-008-V33 that made the hole invisible to the coverage
 * case as well as to the reader.
 */
export function extensionPathspec(
  extensions: readonly ScanExtension[] = SCAN_EXTENSIONS,
): readonly string[] {
  return extensions.map((extension) => `*${extension.suffix}`);
}

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
  // `calendario:cargar` (SPEC-010 CA-6): loads a declared calendar against
  // `DATABASE_URL` from the operator's machine. It reads one local file and
  // talks to our own Postgres; it asks no third party for anything.
  'src/calendar/cli.ts',
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

function excluded(
  path: string,
  exclusions: readonly ScanExclusion[] = SCAN_EXCLUSIONS,
): boolean {
  return exclusions.some((exclusion) =>
    exclusion.path.endsWith('/') ? path.startsWith(exclusion.path) : path === exclusion.path,
  );
}

/**
 * CA-2.6 — EVERY FILE OF CODE UNDER THE DECLARED ROOTS, FROM THE FILE TREE.
 *
 * WHAT COUNTS AS CODE IS `SCAN_EXTENSIONS` AND NOT AN `endsWith` WRITTEN HERE
 * (F-SPEC-008-V33). The walk asks the declaration; it does not keep its own
 * opinion about file names.
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
/**
 * What one walk of the tree found: the code files it read, and the entries it
 * REFUSED to classify. Every dirent lands in exactly one fate — file judged,
 * directory walked, excluded by a declared entry, or refused naming itself —
 * because the silent fourth fate is measured (F-SPEC-009-V1, below).
 */
interface TreeWalk {
  readonly files: string[];
  readonly refusals: string[];
}

function walkTree(
  directory: string,
  found: TreeWalk,
  extensions: readonly ScanExtension[],
  exclusions: readonly ScanExclusion[],
  base: string,
): void {
  let entries;
  try {
    entries = readdirSync(join(base, directory), { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const path = directory === '' ? entry.name : `${directory}/${entry.name}`;
    // A SYMLINK IS NEITHER OF THE TWO SHAPES THE WALK CAN JUDGE, AND UNTIL THE
    // SECOND ROUND OF SPEC-009 IT FELL THROUGH IN SILENCE: not a file, not a
    // directory, not behind any root or declared exclusion — an accident of
    // `readdirSync(withFileTypes)`, not even «a rule written for something
    // else». Measured twice with the three gates green (F-SPEC-009-V1): a
    // `robots/evil-link.ts` at the root and a `src/ingest/robots/evil.ts`
    // UNDER A SCAN ROOT, imported from `adapter.ts`, both pointing at a file
    // with `cheerio.fromURL` that nobody judged — and with a DIRECTORY
    // symlink the hole is a whole tree. The walk does not follow links —
    // following would audit files outside the repository under a path inside
    // it — so it REFUSES them by construction, naming themselves. Leaving the
    // scan takes a declared exclusion with its motive, like everything else.
    if (entry.isSymbolicLink()) {
      if (!excluded(path, exclusions) && !excluded(`${path}/`, exclusions)) {
        found.refusals.push(
          `${path}: a symbolic link, which the walk refuses by construction (F-SPEC-009-V1)`,
        );
      }
      continue;
    }
    if (entry.isDirectory()) {
      if (!excluded(`${path}/`, exclusions)) walkTree(path, found, extensions, exclusions, base);
      continue;
    }
    // The same fate for anything else the platform can put in a directory — a
    // FIFO, a socket, a device: what the walk cannot classify is red, never
    // silent (ADR-016 §5 bis, the same obligation the reader carries).
    if (!entry.isFile()) {
      if (!excluded(path, exclusions)) {
        found.refusals.push(`${path}: neither a file nor a directory, which the walk refuses by construction`);
      }
      continue;
    }
    if (excluded(path, exclusions)) continue;
    if (isCodeFile(path, extensions)) found.files.push(path);
  }
}

export function scannedSources(
  extensions: readonly ScanExtension[] = SCAN_EXTENSIONS,
  exclusions: readonly ScanExclusion[] = SCAN_EXCLUSIONS,
): readonly string[] {
  const found: TreeWalk = { files: [], refusals: [] };

  for (const root of SCAN_ROOTS) {
    if (root.endsWith('/')) {
      walkTree(root.slice(0, -1), found, extensions, exclusions, ROOT);
    } else if (
      !excluded(root, exclusions) &&
      isCodeFile(root, extensions) &&
      existsSync(join(ROOT, root))
    ) {
      found.files.push(root);
    }
  }

  return found.files.sort();
}

/**
 * SPEC-009 CA-2 — every file of code in the WHOLE repository tree, walked from
 * the root, THROUGH THE SAME WALK and the same declared lists as
 * `scannedSources`. What the coverage judges.
 *
 * Not from `git`, and this time not even for the half `git` seemed made for.
 * F-SPEC-008-V35 measured the hole: under the roots the READING had stopped
 * inheriting `.gitignore`, but the COVERAGE — the case that makes «being
 * outside the scan» a declared decision — still came from
 * `git ls-files --exclude-standard`, and `git` does not see what `.gitignore`
 * hides. A `robots/side.ts` at the repository root, imported from
 * `src/ingest/adapter.ts` through a relative path `resolvesInsideRepository`
 * accepts, left `lint exit=0`, `npm test` 772/772 and `tests/polite` 86/86
 * with nothing in `git status`: `.gitignore:17` hides every `robots/`
 * directory for a reason that is legitimate and untouchable (ADR-009 §3), and
 * that rule was deciding what code got audited — one layer further out than
 * F-SPEC-008-V28.
 *
 * The file tree is the one list no other rule owns. Everything this walk does
 * not visit is behind a root or an exclusion DECLARED ABOVE WITH ITS MOTIVE;
 * a code file anywhere else is red, naming itself, whether or not `git` has
 * ever heard of it.
 */
export function repositorySources(
  extensions: readonly ScanExtension[] = SCAN_EXTENSIONS,
  exclusions: readonly ScanExclusion[] = SCAN_EXCLUSIONS,
): readonly string[] {
  const found: TreeWalk = { files: [], refusals: [] };
  walkTree('', found, extensions, exclusions, ROOT);
  return found.files.sort();
}

/**
 * SPEC-009 CA-2 — WHAT THE WALK REFUSES TO CLASSIFY, over the whole tree.
 *
 * The dirents the ONE walk cannot judge: symlinks first of all, and anything
 * else that is neither a file nor a directory. Until the second round they
 * fell through in silence — «being outside the scan» was an accident of
 * `readdirSync(withFileTypes)` and not a declared decision, which is the exact
 * defect CA-2 exists to close, one mechanism further in than F-SPEC-008-V35.
 * Measured (F-SPEC-009-V1, 2026-09-02): a symlink of code was invisible to
 * `scannedSources`, `versionedSources` and `repositorySources` AT ONCE, under
 * a root and outside them, with the three gates green.
 *
 * A refusal is red by construction, naming the path: case 2l keeps this list
 * EMPTY on the real tree, and the only way out is a declared exclusion with
 * its motive. The walk never follows a link — resolving one would audit a file
 * outside the repository under a path inside it, and a directory link would
 * graft a whole foreign tree.
 *
 * `base` exists for the battery (E12a): the reproduction runs the SAME walk
 * and the SAME declared lists over a synthetic tree outside the repository,
 * because a real symlink written by a test would race this very guardian.
 */
export function walkRefusals(
  extensions: readonly ScanExtension[] = SCAN_EXTENSIONS,
  exclusions: readonly ScanExclusion[] = SCAN_EXCLUSIONS,
  base: string = ROOT,
): readonly string[] {
  const found: TreeWalk = { files: [], refusals: [] };
  walkTree('', found, extensions, exclusions, base);
  return found.refusals.sort();
}

/**
 * Every file of code `git` knows about outside `tests/`.
 *
 * `git` KEEPS WHAT IT IS THE AUTHORITY ON: what is versioned. That is what the
 * coverage case needs — «every versioned file outside `tests/` falls under a
 * declared root» — and nothing else. WHAT GETS READ is `scannedSources()`, and
 * the two lists are different on purpose: under the roots, the read list has
 * to be the wider of the two.
 *
 * WHAT THEY ARE NOT ALLOWED TO DIFFER IN IS THE EXTENSIONS. The pathspec is
 * DERIVED from the same declaration `scannedSources()` asks, because writing it
 * by hand here is exactly how the coverage stopped missing what the reader
 * stopped reading (F-SPEC-008-V33).
 *
 * AND THEY ASK THE SAME EXCLUSIONS TOO, from F-SPEC-008-V37 on. With `.js` and
 * `.mjs` declared, `git` starts listing `docs/diseno/`, which is EPIC-004's
 * design-system source and not application code; it leaves the coverage by
 * being A DECLARED EXCLUSION WITH ITS MOTIVE — what CA-2.6 asks — and not by a
 * second list written here.
 */
export function versionedSources(
  extensions: readonly ScanExtension[] = SCAN_EXTENSIONS,
  exclusions: readonly ScanExclusion[] = SCAN_EXCLUSIONS,
): readonly string[] {
  return execFileSync(
    'git',
    [
      'ls-files',
      '--cached',
      '--others',
      '--exclude-standard',
      ...extensionPathspec(extensions),
    ],
    { encoding: 'utf8' },
  )
    .split('\n')
    // `tests/` leaves through the same declared exclusion the walk asks — one
    // declaration, never a second filter written here (SPEC-009 CA-2).
    .filter((path) => path.length > 0 && !excluded(path, exclusions))
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
 * SPEC-009 CA-1 — the capability of the HOST is conceded, never forbidden.
 *
 * This replaces `CAPABILITY_NAMES`, and the reason is measured, not taste.
 * CA-2.4 of SPEC-008 claimed that without an import «ECMAScript gives exactly
 * three ways of reaching a capability» and that the set was «closed by the
 * language, not by us». Both halves were false: the mechanism was NINE
 * FORBIDDEN NAMES — a blacklist living inside the criterion written to abolish
 * blacklists (ADR-016 §3.5) — and the set was open: `process` is a global of
 * the host, not of ECMAScript, and `process.getBuiltinModule(id)` has been
 * stable API since Node 22, handing back any internal module WITH NO IMPORT
 * AT ALL. Eleven lines sent a real request with no `User-Agent`, no
 * `robots.txt` and no turn, with the three gates green (F-SPEC-008-V34).
 * Patching that by adding `process` to the list would have been the defect
 * returning: a blacklist grows one name after every evasion, and it has no
 * last entry.
 *
 * So the mechanism turned around, exactly as `ALLOWED_PACKAGES` did: a file
 * may use, as a FREE reference — one the compiler says the file itself does
 * not bind —, only an identifier DECLARED HERE, and only inside the surface
 * the entry concedes. `process.getBuiltinModule` is red because `env`,
 * `stdout` and `argv` are the declared surface and `getBuiltinModule` is not
 * on it — NOBODY HAD TO KNOW IT EXISTS. The same fate awaits the next one.
 *
 * Who says what is free is the checker, not us (`freeReferences`, the one
 * reader): a reference is bound only by a declaration that EMITS a binding.
 * `declare const fetch` binds nothing at runtime — the emitted JavaScript
 * reaches the host's global — so ambient declarations do not count, and
 * neither does a `.d.ts`. Type positions are exempt for the same reason
 * `import type` is: erasure leaves nothing behind them.
 *
 * The list is closed by something that exists outside this test — the global
 * surface the platform publishes — and it grows like every other list here:
 * one entry, its motive, in a diff a reviewer reads. Two axes per entry: may
 * the identifier itself be TAKEN AS A VALUE (called, constructed, passed —
 * from there every member is reachable off-file), and which MEMBERS may be
 * read off it. What still needs a human signature is declaring an entry whose
 * job is to ask a third party for bytes — which is why `globalThis` and
 * `fetch` are not here, and why the single `globalThis.fetch` of the door
 * (`src/polite/http.ts`, ADR-014 §4) stays AN OFFENCE that case 9 pins to
 * exactly one place instead of an entry that would concede it everywhere.
 */
export interface GlobalEntry {
  /** The identifier, exactly as the compiler resolves it. */
  readonly identifier: string;
  /**
   * Whether the bare identifier may be used AS A VALUE — called, constructed,
   * passed on. `false` concedes only the declared members.
   */
  readonly asValue: boolean;
  /** The members that may be read off it. Nothing else, `[]` is legitimate. */
  readonly surface: readonly string[];
  /** Why this repository takes this from the host. Obligatory, every entry. */
  readonly motive: string;
}

export const ALLOWED_GLOBALS: readonly GlobalEntry[] = [
  {
    identifier: 'Buffer',
    asValue: false,
    surface: ['from'],
    motive:
      "Node's byte buffer. `src/raw/` decodes stored bodies and hashes them (`Buffer.from`); the constructor itself is not taken.",
  },
  {
    identifier: 'Date',
    asValue: true,
    surface: ['UTC', 'parse'],
    motive:
      'Instants CROSS the system as ISO 8601 UTC strings, never as `Date` (ADR-006); parsing and formatting at the edge is what `Date.parse` and a locally-scoped `new Date` are for (`src/polite/clock.ts`, `src/mirror/instants.ts`).',
  },
  {
    identifier: 'Error',
    asValue: true,
    surface: [],
    motive: 'Throwing and subclassing errors. Every `throw new Error(…)` of `src/` is this entry.',
  },
  {
    identifier: 'Intl',
    asValue: false,
    surface: ['DateTimeFormat'],
    motive:
      "Timezone arithmetic for the declared calendar without a dependency (ADR-017 §5): `src/calendar/time.ts` derives an offset from `Intl.DateTimeFormat` parts. Type positions (`Intl.DateTimeFormatPartTypes`) are erased by the compiler and never judged.",
  },
  {
    identifier: 'JSON',
    asValue: false,
    surface: ['parse', 'stringify'],
    motive:
      'The serialization boundary: raw-store metadata, CLI configs and reports are JSON on disk, and the model crosses to the client by JSON (ADR-006).',
  },
  {
    identifier: 'Map',
    asValue: true,
    surface: [],
    motive: 'Keyed collections all over `src/`: registries, rate-limit turns, analysis pairing.',
  },
  {
    identifier: 'Math',
    asValue: false,
    surface: ['ceil', 'floor'],
    motive:
      'Arithmetic on windows and turns (`src/mirror/window.ts`) and truncation to the minute (`src/calendar/time.ts`). No randomness is taken.',
  },
  {
    identifier: 'Number',
    asValue: true,
    surface: ['isFinite', 'isNaN', 'isSafeInteger'],
    motive:
      'Parsing counted things — scores, ports, tick numbers — and validating them, integers before they enter a SQL array included (`src/db/arrays.ts`).',
  },
  {
    identifier: 'Object',
    asValue: false,
    surface: ['entries'],
    motive: 'Iterating declared records, e.g. the robots files of a capture config.',
  },
  {
    identifier: 'Promise',
    asValue: true,
    surface: ['resolve'],
    motive: 'The async runtime this codebase is written on. Constructed for sleeps and adapters.',
  },
  {
    identifier: 'RegExp',
    asValue: true,
    surface: [],
    motive: 'Building anchored patterns from literals (`src/polite/robots.ts` compiles rules).',
  },
  {
    identifier: 'Response',
    asValue: true,
    surface: [],
    motive:
      "The App Router's route contract: `src/app/robots.txt/route.ts` answers with a `Response`. RECEIVING one is not this entry; only building our own.",
  },
  {
    identifier: 'Set',
    asValue: true,
    surface: [],
    motive: 'Deduplication: seen files, seen URLs, seen competition ids.',
  },
  {
    identifier: 'String',
    asValue: true,
    surface: ['raw'],
    motive: 'Coercion of unknowns for messages, and `String.raw` in SQL-adjacent templates.',
  },
  {
    identifier: 'TextDecoder',
    asValue: true,
    surface: [],
    motive: 'Decoding stored raw bytes back into text for analysis (RN-10: bytes first).',
  },
  {
    identifier: 'TypeError',
    asValue: true,
    surface: [],
    motive:
      'Thrown by `src/db/arrays.ts` when a non-integer would corrupt an int array before it reaches SQL.',
  },
  {
    identifier: 'URL',
    asValue: true,
    surface: [],
    motive: 'Parsing and resolving the URLs of targets and of `robots.txt` origins (RN-11).',
  },
  {
    identifier: 'Uint8Array',
    asValue: true,
    surface: [],
    motive: 'The byte contract of the raw store: `RawStore.put` takes bytes, not text (RN-10).',
  },
  {
    identifier: 'console',
    asValue: false,
    surface: ['log'],
    motive:
      'The CLIs of `src/mirror/cli/` report to the operator on stdout. Nothing else of the console is taken.',
  },
  {
    identifier: 'process',
    asValue: false,
    surface: ['argv', 'env', 'exitCode', 'stderr', 'stdout'],
    motive:
      'The host process, at the NARROWEST surface that runs the CLIs: arguments in, environment read, progress out. `getBuiltinModule` is deliberately NOT here — it hands back any internal module with no import (F-SPEC-008-V34) — and it stays out by not being written, not by being named.',
  },
  {
    identifier: 'setTimeout',
    asValue: true,
    surface: [],
    motive: 'The sleep of the rate limiter (RN-11: waiting is the mechanism).',
  },
  {
    identifier: 'undefined',
    asValue: true,
    surface: [],
    motive: "ECMAScript's absent value. It concedes nothing, and the scan uses it everywhere.",
  },
];

/** The entry a free identifier names, or `null` when it is not declared. */
export function globalEntry(
  identifier: string,
  allowed: readonly GlobalEntry[] = ALLOWED_GLOBALS,
): GlobalEntry | null {
  return allowed.find((entry) => entry.identifier === identifier) ?? null;
}

/**
 * SPEC-009 CA-1 — every free reference of the file is judged against the
 * declared list, and against NOTHING else. What is not declared is red,
 * naming the file and the identifier; a member outside the declared surface is
 * red naming the member; a computed access on a free identifier is red by
 * construction, like everything an enumeration cannot read.
 *
 * WHAT THIS JUDGMENT DOES NOT PROMISE, WRITTEN WHERE IT JUDGES (ADR-016 §6,
 * F-SPEC-009-V2). A member is judged ONLY when its base is a free identifier.
 * A member read off ANY OTHER expression — a literal, a call result, a bound
 * local — is never judged, at any depth; and because every value's
 * `constructor.constructor` is `Function`, the `eval` capability is reachable
 * without writing `eval`, `Function`, or any free identifier at all:
 * `(''.constructor.constructor)("return process.getBuiltinModule('node:child_process')")()`
 * hands back `node:child_process` whole, measured on 2026-09-02 with the
 * three gates green. CA-1.3 keeps the NAMES red; the capability behind them
 * stays open. No mechanism closes it without a blacklist — judging
 * `constructor` by its name would be a name again (ADR-016 §3.5) — so it
 * stays a DECLARED, MEASURED residue: E12b in the battery is its executable
 * example and keeps this very paragraph in place. What narrows it is the
 * runtime containment of CA-2.1 — the expression still has to open a socket
 * to send a byte — and what would close it is coverage, which this project
 * does not measure (EPIC-MEJORA, ADR-016 §Consecuencias negativas 2).
 */
export function capabilityOffences(
  file: ScannedFile,
  allowed: readonly GlobalEntry[] = ALLOWED_GLOBALS,
): readonly string[] {
  if (file.reading.unparseable) return [`${file.path}: the compiler cannot parse this file`];

  const offences = new Set<string>();
  for (const reference of freeReferences(file.path)) {
    const entry = globalEntry(reference.name, allowed);
    if (entry === null) {
      offences.add(`${file.path}: \`${reference.name}\` is not a declared global identifier`);
      continue;
    }
    if (reference.use === 'computed') {
      offences.add(`${file.path}: computed access on the global \`${reference.name}\``);
      continue;
    }
    if (reference.use === 'value') {
      if (!entry.asValue) {
        offences.add(
          `${file.path}: the global \`${reference.name}\` is not conceded as a bare value`,
        );
      }
      continue;
    }
    if (reference.member !== null && !entry.surface.includes(reference.member)) {
      offences.add(
        `${file.path}: the global \`${reference.name}\` does not declare \`${reference.member}\` in its surface`,
      );
    }
  }

  return [...offences];
}
