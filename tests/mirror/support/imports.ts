/**
 * THE ONE READER OF WHAT A FILE IMPORTS, AND IT IS THE COMPILER'S OWN TREE.
 *
 * It was born for the structural half of SPEC-002 CA-3 — phase A must not be
 * able to reach phase B's extractor, and the cheapest honest way to state that
 * is "no path in the import graph gets there". SPEC-008 CA-2.3, CA-2.5 and the
 * order control of CA-2.1 lean on the same walk, and CA-2.3 now names the
 * mechanism: THE SPECIFIERS AND THE CLAUSES COME OUT OF THE SYNTAX TREE THAT
 * THE TYPESCRIPT COMPILER PRODUCES — the same one that compiles this project —
 * AND NOT OUT OF A TEXT PATTERN.
 *
 * WHY IT STOPPED BEING A REGULAR EXPRESSION, and it is not taste. The same
 * reader decided wrong three times about a question a parser answers on its
 * own:
 *
 *   1. `FROM_PATTERN` used `[\s\S]*?`, so `cheerio['from' + 'URL']` ate half a
 *      line and manufactured a false specifier (fixed in the fourth round);
 *   2. the three patterns were anchored at the start of a statement, so
 *      `const noop = 0; import { execFileSync } from 'node:child_process';`
 *      WAS NOT SEEN — and it did not fail closed, IT WENT SILENT. Twelve
 *      characters separated green from red, with a package that is not even on
 *      the list sending a real request (F-SPEC-008-V27);
 *   3. the list of files it read came from `git ls-files --exclude-standard`,
 *      which inherits `.gitignore` (F-SPEC-008-V28 — that one lives in
 *      `capability.ts`).
 *
 * Anchoring the pattern at `;` instead of `\n` would have covered that one case
 * and left the next one open. The defect was never in WHAT is conceded: it was
 * that WHOEVER READS THE DIFF WAS NOT READING WHAT THE COMPILER READS.
 *
 * THREE OBLIGATIONS OF CA-2.3 LIVE HERE, and all three are checkable:
 *
 *   1. ONE READER. There is no second way of finding out what a file imports.
 *      CA-2.3's closure, CA-2.5's graph walk and CA-2.1's installation-order
 *      control all come through `readModule`.
 *   2. NOTHING IS LOST IN SILENCE, and it is checked AGAINST THE COMPILER: the
 *      enumeration is published next to `compilerModules`, which is the
 *      compiler's own list of module literals for the file, so a caller can
 *      demand that ours covers it. A file the compiler cannot parse comes back
 *      `unparseable`, which is red.
 *   3. THE POSITION IN THE LINE DOES NOT CHANGE THE VERDICT. It cannot: the
 *      tree has no lines.
 *
 * WHAT IT COSTS, said out loud (the amendment of 2026-09-01 §5): the guardian
 * of a hard rule now depends on an API that `typescript@7` publishes as
 * `unstable`, and it launches the compiler binary as a subprocess. It breaks
 * LOUDLY — an import error, not a silence — which is the whole difference with
 * what it replaces. The subprocess talks over `stdio` pipes and NOT over a
 * socket, which is why it does not disturb CA-2.1's trap (measured).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import {
  SyntaxKind,
  isCallExpression,
  isElementAccessExpression,
  isExportDeclaration,
  isIdentifier,
  isImportDeclaration,
  isPropertyAccessExpression,
  isStringLiteral,
} from 'typescript/unstable/ast';
import { API } from 'typescript/unstable/sync';
import type { Node, SourceFile } from 'typescript/unstable/ast';
import type { NodeHandle, Project, Symbol as ResolvedSymbol } from 'typescript/unstable/sync';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');
const TSCONFIG = join(ROOT, 'tsconfig.json');

export interface ImportBinding {
  /**
   * The name AS THE MODULE EXPORTS IT — never the alias. `import { get as
   * blobGet }` binds `get`: renaming on the way in cannot widen a surface.
   */
  readonly name: string;
  readonly kind: 'named' | 'default' | 'namespace';
  /** The identifier it is bound to here. What a namespace's members hang off. */
  readonly local: string;
}

export interface ModuleSpecifier {
  /** The module named, when the specifier is a static string literal. */
  readonly text: string | null;
  /** What was written between the parentheses or quotes, verbatim. */
  readonly raw: string;
  readonly kind: 'static' | 'side-effect' | 'dynamic';
  /**
   * `import type …` / `import { type X }`. `verbatimModuleSyntax` erases these
   * whole: they cross no capability, so CA-2.3 asks them for no surface.
   */
  readonly typeOnly: boolean;
  /** What crosses the frontier. Empty for a type-only or side-effect import. */
  readonly bindings: readonly ImportBinding[];
  /**
   * The clause could not be reduced to a list of names. FAIL CLOSED: a surface
   * that cannot be enumerated is not a surface, and `export * from 'pkg'` is
   * exactly the whole-namespace concession CA-2.3 refuses.
   */
  readonly unreadableClause: boolean;
}

/** How a namespace binding (`import * as ns`) is touched away from its import. */
export interface NamespaceRead {
  readonly local: string;
  /**
   * `member` — `ns.x`, and `x` has to be in the declared surface.
   * `computed` — `ns['from' + 'URL']`, which no enumeration can read.
   * `value` — the namespace itself passed, returned or re-exported, from where
   * every member is reachable off-file.
   */
  readonly kind: 'member' | 'computed' | 'value';
  readonly member: string | null;
}

export interface ModuleReading {
  /** Path relative to the repository root, with forward slashes. */
  readonly path: string;
  readonly specifiers: readonly ModuleSpecifier[];
  /**
   * The module literals THE COMPILER ITSELF registers for this file. This is
   * what makes «nothing was lost in silence» a case and not a claim: it is not
   * us deciding whether we missed one.
   */
  readonly compilerModules: readonly string[];
  /** The compiler could not parse the file, or could not see it at all. Red. */
  readonly unparseable: boolean;
  readonly namespaceReads: readonly NamespaceRead[];
  /**
   * Every identifier used as a BARE REFERENCE — not as the name of a
   * declaration, not as the right-hand side of a `.` — which is what CA-2.4
   * needs and what a text pattern cannot tell apart from prose, from a method
   * called `fetch`, or from `globalThis`.
   */
  readonly bareIdentifiers: ReadonlySet<string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// The compiler, opened once, with an overlay so synthetic controls never touch
// the disk (measured: sonda H of the amendment).
// ─────────────────────────────────────────────────────────────────────────────

const overlay = new Map<string, string>();
/** Overlay paths already open in the compiler whose text has since changed. */
const changedPaths = new Set<string>();
/**
 * Real files the project did not have when the snapshot was taken.
 *
 * A file that appears after the snapshot —the positive control of CA-2.6 writes
 * one, because proving that the FILE LIST is ours means putting a file on the
 * disk— must not come back as «unparseable». FAILING CLOSED IS FOR WHAT WE
 * CANNOT READ, NOT FOR WHAT WE HAVE NOT OPENED YET.
 */
const openedOnDemand = new Set<string>();
let overlayVersion = 0;

function readFileOrUndefined(path: string): string | undefined {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return undefined;
  }
}

const compilerApi = new API({
  cwd: ROOT,
  fs: {
    readFile: (path: string) => overlay.get(path) ?? readFileOrUndefined(path),
    fileExists: (path: string) => overlay.has(path) || existsSync(path),
    directoryExists: (path: string) => existsSync(path),
    getAccessibleEntries: (path: string) => {
      try {
        const entries = readdirSync(path, { withFileTypes: true });
        return {
          files: entries.filter((entry) => entry.isFile()).map((entry) => entry.name),
          directories: entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name),
        };
      } catch {
        return { files: [], directories: [] };
      }
    },
    realpath: (path: string) => path,
  },
});

type Snapshot = ReturnType<typeof compilerApi.updateSnapshot>;

let snapshot: Snapshot | null = null;
let snapshotVersion = -1;

function currentSnapshot(): Snapshot {
  if (snapshot === null || snapshotVersion !== overlayVersion) {
    // An open file's text is the one the compiler read WHEN IT WAS OPENED.
    // Measured, one at a time: `fileChanges.changed` alone does not move it,
    // `fileChanges.invalidateAll` alone does not move it, and closing alone
    // does not move it either. CLOSING AND DECLARING THE CHANGE, THEN
    // REOPENING, DOES — and it costs 1 ms, where `invalidateAll` costs 160.
    // Without it two controls at the same synthetic path would both be judged
    // against the first one's source, which is the exact class of silence this
    // round exists to remove.
    if (changedPaths.size > 0) {
      const changed = [...changedPaths];
      compilerApi.updateSnapshot({
        openProjects: [TSCONFIG],
        closeFiles: changed,
        fileChanges: { changed },
      });
      changedPaths.clear();
    }
    snapshot = compilerApi.updateSnapshot({
      openProjects: [TSCONFIG],
      openFiles: [...overlay.keys(), ...openedOnDemand],
    });
    snapshotVersion = overlayVersion;
  }
  return snapshot;
}

/**
 * Declares synthetic source text at `path` without writing it.
 *
 * The positive controls of CA-2.3 have to judge code that does not exist —
 * `src/ingest/preflight.ts` with `fromURL` is the eighth evasion written as a
 * case — and writing it to disk would leave a mutation behind on a failure.
 */
export function registerSyntheticSource(path: string, text: string): void {
  const absolute = resolve(ROOT, path);
  if (overlay.get(absolute) === text) return;
  if (overlay.has(absolute)) changedPaths.add(absolute);
  overlay.set(absolute, text);
  overlayVersion += 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reading one file.
// ─────────────────────────────────────────────────────────────────────────────

function relativePath(absolute: string): string {
  return relative(ROOT, absolute).replaceAll('\\', '/');
}

function bindingsOfImportClause(clause: Node | undefined): {
  typeOnly: boolean;
  bindings: ImportBinding[];
  unreadableClause: boolean;
} {
  const bindings: ImportBinding[] = [];
  if (clause === undefined) return { typeOnly: false, bindings, unreadableClause: false };

  const anyClause = clause as unknown as {
    phaseModifier?: number;
    name?: { text: string };
    namedBindings?: {
      kind: number;
      name?: { text: string };
      elements?: readonly {
        propertyName?: { text: string };
        name: { text: string };
        isTypeOnly: boolean;
      }[];
    };
  };

  // `import type { … }` is erased whole by `verbatimModuleSyntax`.
  if (anyClause.phaseModifier === SyntaxKind.TypeKeyword) {
    return { typeOnly: true, bindings, unreadableClause: false };
  }

  if (anyClause.name !== undefined) {
    bindings.push({ name: 'default', kind: 'default', local: anyClause.name.text });
  }

  const named = anyClause.namedBindings;
  if (named !== undefined) {
    if (named.kind === SyntaxKind.NamespaceImport && named.name !== undefined) {
      bindings.push({ name: '*', kind: 'namespace', local: named.name.text });
    } else if (named.kind === SyntaxKind.NamedImports && named.elements !== undefined) {
      for (const element of named.elements) {
        // An inline `type` name is erased too, so it concedes nothing.
        if (element.isTypeOnly) continue;
        const name = element.propertyName?.text ?? element.name.text;
        bindings.push({
          name,
          kind: name === 'default' ? 'default' : 'named',
          local: element.name.text,
        });
      }
    } else {
      return { typeOnly: false, bindings, unreadableClause: true };
    }
  }

  return { typeOnly: false, bindings, unreadableClause: false };
}

function specifierOfExport(node: Node, text: string): ModuleSpecifier {
  const declaration = node as unknown as {
    isTypeOnly: boolean;
    exportClause?: {
      kind: number;
      elements?: readonly {
        propertyName?: { text: string };
        name: { text: string };
        isTypeOnly: boolean;
      }[];
    };
  };

  if (declaration.isTypeOnly) {
    return {
      text,
      raw: text,
      kind: 'static',
      typeOnly: true,
      bindings: [],
      unreadableClause: false,
    };
  }

  const clause = declaration.exportClause;
  // `export * from 'pkg'` (no clause) and `export * as ns from 'pkg'` both hand
  // over the whole namespace, which is the concession CA-2.3 refuses.
  if (clause === undefined || clause.kind !== SyntaxKind.NamedExports || clause.elements === undefined) {
    return { text, raw: text, kind: 'static', typeOnly: false, bindings: [], unreadableClause: true };
  }

  const bindings: ImportBinding[] = [];
  for (const element of clause.elements) {
    if (element.isTypeOnly) continue;
    const name = element.propertyName?.text ?? element.name.text;
    bindings.push({ name, kind: name === 'default' ? 'default' : 'named', local: element.name.text });
  }

  return { text, raw: text, kind: 'static', typeOnly: false, bindings, unreadableClause: false };
}

/** `n.parent.name === n` and friends: is this identifier a NAME, not a use? */
function isDeclarationName(node: Node): boolean {
  const parent = node.parent as unknown as
    | { name?: { index: number }; propertyName?: { index: number } }
    | undefined;
  if (parent === undefined) return false;
  const index = (node as unknown as { index: number }).index;
  if (parent.name?.index === index) return true;
  if (parent.propertyName?.index === index) return true;
  return false;
}

function collectReferences(
  file: SourceFile,
): { namespaceReads: NamespaceRead[]; bareIdentifiers: Set<string> } {
  const namespaceReads: NamespaceRead[] = [];
  const bareIdentifiers = new Set<string>();

  const walk = (node: Node): void => {
    if (isIdentifier(node) && !isDeclarationName(node)) {
      const parent = node.parent;
      const index = (node as unknown as { index: number }).index;
      const local = (node as unknown as { text: string }).text;

      if (
        parent !== undefined &&
        isPropertyAccessExpression(parent) &&
        (parent.expression as unknown as { index: number }).index === index
      ) {
        namespaceReads.push({
          local,
          kind: 'member',
          member: (parent.name as unknown as { text: string }).text,
        });
      } else if (
        parent !== undefined &&
        isElementAccessExpression(parent) &&
        (parent.expression as unknown as { index: number }).index === index
      ) {
        namespaceReads.push({ local, kind: 'computed', member: null });
      } else if (parent !== undefined && parent.kind === SyntaxKind.QualifiedName) {
        const qualified = parent as unknown as { left: { index: number }; right: { text: string } };
        if (qualified.left.index === index) {
          namespaceReads.push({ local, kind: 'member', member: qualified.right.text });
        }
      } else {
        namespaceReads.push({ local, kind: 'value', member: null });
      }

      bareIdentifiers.add(local);
    }

    node.forEachChild(walk);
  };

  file.forEachChild(walk);
  return { namespaceReads, bareIdentifiers };
}

// ─────────────────────────────────────────────────────────────────────────────
// SPEC-009 CA-1 — free identifiers, and it is THE COMPILER who says what binds.
//
// `bareIdentifiers` collects every identifier used as a reference — locals,
// imports and globals alike — which is what CA-2.4 could afford while its
// criterion was a list of nine forbidden names. A whitelist of GLOBALS needs
// the opposite cut: only the identifiers the file does NOT bind. Writing our
// own scope analysis would be a list of declaration forms — the exact family
// of defect ADR-016 §5 bis names — so the question goes to the checker: the
// symbol a reference resolves to, and where that symbol's declarations live.
//
// A reference is FREE when any of these holds, and each one fails closed:
//
//   - the checker resolves NO symbol for it (nothing we can prove binds it);
//   - the symbol has no declarations at all (`globalThis` is like that);
//   - none of its declarations lives in the file itself (a global of the
//     platform, or something leaking across files);
//   - its in-file declarations are all AMBIENT — `declare const fetch`,
//     `declare global { var sneak }`, or anything in a `.d.ts` — because an
//     ambient declaration emits NO binding: at runtime that reference resolves
//     to the host's global, and a reader that believed the declaration would
//     hand the capability over. Describing a capability is not creating it.
//
// TYPE POSITIONS ARE EXEMPT, for the same reason `import type` is exempt in
// CA-2.3: the emitted JavaScript contains nothing for them
// (`verbatimModuleSyntax`, type erasure), so they cross no capability, and
// asking a `Promise<void>` annotation for a surface would be a toll. What is a
// type position comes off the tree — the compiler's own `FirstTypeNode..
// LastTypeNode` range, type parameters, and the erased halves of a heritage
// clause (`implements`, and `extends` of an interface; `extends` of a CLASS is
// a value use and is judged).
// ─────────────────────────────────────────────────────────────────────────────

/** One use of an identifier the file does not bind. What CA-1 judges. */
export interface FreeReference {
  /** The identifier, as the compiler reads it — Unicode escapes resolved. */
  readonly name: string;
  /**
   * `member` — `name.x`, and `x` must be in the entry's declared surface.
   * `computed` — `name[…]`, which no enumeration can read.
   * `value` — the identifier itself used as a value: called, constructed,
   * passed, spread. Conceded only when the entry says so.
   */
  readonly use: 'member' | 'computed' | 'value';
  readonly member: string | null;
}

interface FreeCandidate {
  readonly node: Node;
  readonly reference: FreeReference;
  readonly shorthand: Node | null;
}

/** `parent.label === node`: a control-flow label is syntax, not a reference. */
function isLabel(node: Node): boolean {
  const parent = node.parent as unknown as { label?: { index: number } } | undefined;
  if (parent === undefined) return false;
  return parent.label?.index === (node as unknown as { index: number }).index;
}

/** A lowercase JSX tag compiles to a string literal, not to a reference. */
function isIntrinsicJsxTag(node: Node): boolean {
  const parent = node.parent;
  if (parent === undefined) return false;
  const kind = parent.kind;
  if (
    kind !== SyntaxKind.JsxOpeningElement &&
    kind !== SyntaxKind.JsxSelfClosingElement &&
    kind !== SyntaxKind.JsxClosingElement
  ) {
    return false;
  }
  const tag = (parent as unknown as { tagName?: { index: number } }).tagName;
  if (tag?.index !== (node as unknown as { index: number }).index) return false;
  const text = (node as unknown as { text: string }).text;
  return text.length > 0 && text[0] === text[0]!.toLowerCase();
}

/** Erased at emit: type nodes, type parameters, the type half of a heritage. */
function inTypePosition(node: Node): boolean {
  for (let current = node.parent; current !== undefined; current = current.parent) {
    if (current.kind >= SyntaxKind.FirstTypeNode && current.kind <= SyntaxKind.LastTypeNode) {
      return true;
    }
    if (current.kind === SyntaxKind.TypeParameter) return true;
    if (current.kind === SyntaxKind.HeritageClause) {
      const clause = current as unknown as { token: number; parent?: { kind: number } };
      if (clause.token === SyntaxKind.ImplementsKeyword) return true;
      return clause.parent?.kind === SyntaxKind.InterfaceDeclaration;
    }
  }
  return false;
}

function candidateOf(node: Node): FreeCandidate {
  const parent = node.parent;
  const index = (node as unknown as { index: number }).index;
  const name = (node as unknown as { text: string }).text;

  if (parent !== undefined && parent.kind === SyntaxKind.ShorthandPropertyAssignment) {
    // `{ fetch }` — the name is a declaration AND a reference to the value.
    return { node, reference: { name, use: 'value', member: null }, shorthand: parent };
  }
  if (
    parent !== undefined &&
    isPropertyAccessExpression(parent) &&
    (parent.expression as unknown as { index: number }).index === index
  ) {
    return {
      node,
      reference: {
        name,
        use: 'member',
        member: (parent.name as unknown as { text: string }).text,
      },
      shorthand: null,
    };
  }
  if (
    parent !== undefined &&
    isElementAccessExpression(parent) &&
    (parent.expression as unknown as { index: number }).index === index
  ) {
    return { node, reference: { name, use: 'computed', member: null }, shorthand: null };
  }
  return { node, reference: { name, use: 'value', member: null }, shorthand: null };
}

function collectFreeCandidates(file: SourceFile): FreeCandidate[] {
  const candidates: FreeCandidate[] = [];

  const walk = (node: Node): void => {
    if (isIdentifier(node)) {
      const shorthand =
        node.parent !== undefined && node.parent.kind === SyntaxKind.ShorthandPropertyAssignment;
      if (
        (shorthand || !isDeclarationName(node)) &&
        !isLabel(node) &&
        !isIntrinsicJsxTag(node) &&
        !inTypePosition(node)
      ) {
        candidates.push(candidateOf(node));
      }
    }
    node.forEachChild(walk);
  };

  file.forEachChild(walk);
  return candidates;
}

/**
 * Whether a declaration handle names something that emits NO runtime binding.
 * Cached per declaration: the same handle backs many references.
 */
const ambientVerdicts = new Map<string, boolean>();

function isAmbientDeclaration(handle: NodeHandle, project: Project): boolean {
  const path = String(handle.path);
  const key = `${path}:${handle.index}`;
  const cached = ambientVerdicts.get(key);
  if (cached !== undefined) return cached;

  let ambient = false;
  if (path.endsWith('.d.ts')) {
    ambient = true;
  } else {
    const declaration = handle.resolve(project);
    if (declaration === undefined) {
      // Cannot even look at it: nothing proves it binds. FAIL CLOSED.
      ambient = true;
    } else {
      for (let current: Node | undefined = declaration; current !== undefined; current = current.parent) {
        const modifiers = (current as unknown as { modifiers?: readonly { kind: number }[] })
          .modifiers;
        if (modifiers?.some((modifier) => modifier.kind === SyntaxKind.DeclareKeyword) === true) {
          ambient = true;
          break;
        }
      }
    }
  }

  ambientVerdicts.set(key, ambient);
  return ambient;
}

const freeReadings = new Map<string, readonly FreeReference[]>();

/**
 * Every identifier `path` uses as a FREE reference, in value position, judged
 * by the compiler's own symbol resolution. THE SAME ONE READER: same compiler,
 * same tree, same overlay as `readModule`.
 *
 * A file the compiler cannot parse returns nothing here — its red is
 * `readModule(path).unparseable`, which every caller checks first.
 */
export function freeReferences(path: string): readonly FreeReference[] {
  const absolute = resolve(ROOT, path);
  const key = `${overlayVersion}:${absolute}`;
  const cached = freeReadings.get(key);
  if (cached !== undefined) return cached;

  const project = currentSnapshot().getDefaultProjectForFile(absolute);
  const file = project?.program.getSourceFile(absolute);
  if (project === undefined || file === undefined) {
    freeReadings.set(key, []);
    return [];
  }

  const candidates = collectFreeCandidates(file);
  const plain = candidates.filter((candidate) => candidate.shorthand === null);
  const symbols = new Map<Node, ResolvedSymbol | undefined>();
  const resolved = project.checker.getSymbolAtLocation(plain.map((candidate) => candidate.node));
  plain.forEach((candidate, position) => symbols.set(candidate.node, resolved[position]));
  for (const candidate of candidates) {
    if (candidate.shorthand !== null) {
      // `getSymbolAtLocation` on a shorthand name answers for the PROPERTY,
      // which is declared right there; the VALUE it reads is another symbol.
      symbols.set(
        candidate.node,
        project.checker.getShorthandAssignmentValueSymbol(candidate.shorthand),
      );
    }
  }

  const lowerAbsolute = absolute.toLowerCase();
  const free: FreeReference[] = [];
  for (const candidate of candidates) {
    const symbol = symbols.get(candidate.node);
    if (symbol !== undefined) {
      const inFile = symbol.declarations.filter(
        (declaration) => String(declaration.path).toLowerCase() === lowerAbsolute,
      );
      const binds = inFile.some((declaration) => !isAmbientDeclaration(declaration, project));
      if (binds) continue;
    }
    free.push(candidate.reference);
  }

  freeReadings.set(key, free);
  return free;
}

const readings = new Map<string, ModuleReading>();

/**
 * What a file imports, what names cross with it, and what the compiler says it
 * imports. THE ONE READER.
 */
export function readModule(path: string): ModuleReading {
  const absolute = resolve(ROOT, path);
  const key = `${overlayVersion}:${absolute}`;
  const cached = readings.get(key);
  if (cached !== undefined) return cached;

  const reading = read(absolute);
  readings.set(key, reading);
  return reading;
}

function read(absolute: string): ModuleReading {
  const path = relativePath(absolute);
  let project = currentSnapshot().getDefaultProjectForFile(absolute);
  let file = project?.program.getSourceFile(absolute);

  // The file exists but this snapshot's program does not carry it: open it and
  // ask again, once. See `openedOnDemand`.
  if (file === undefined && !openedOnDemand.has(absolute) && existsSync(absolute)) {
    openedOnDemand.add(absolute);
    overlayVersion += 1;
    project = currentSnapshot().getDefaultProjectForFile(absolute);
    file = project?.program.getSourceFile(absolute);
  }

  // FAIL CLOSED. A file nobody can parse — or that no project can see — is not
  // a file with no imports: it is a file we cannot judge.
  if (project === undefined || file === undefined) {
    return {
      path,
      specifiers: [],
      compilerModules: [],
      unparseable: true,
      namespaceReads: [],
      bareIdentifiers: new Set(),
    };
  }
  if (project.program.getSyntacticDiagnostics(absolute).length > 0) {
    return {
      path,
      specifiers: [],
      compilerModules: [],
      unparseable: true,
      namespaceReads: [],
      bareIdentifiers: new Set(),
    };
  }

  const specifiers: ModuleSpecifier[] = [];

  for (const statement of file.statements) {
    if (isImportDeclaration(statement)) {
      const text = (statement.moduleSpecifier as unknown as { text: string }).text;
      const clause = statement.importClause as unknown as Node | undefined;
      if (clause === undefined) {
        specifiers.push({
          text,
          raw: text,
          kind: 'side-effect',
          typeOnly: false,
          bindings: [],
          unreadableClause: false,
        });
        continue;
      }
      specifiers.push({ text, raw: text, kind: 'static', ...bindingsOfImportClause(clause) });
      continue;
    }

    if (isExportDeclaration(statement) && statement.moduleSpecifier !== undefined) {
      const text = (statement.moduleSpecifier as unknown as { text: string }).text;
      specifiers.push(specifierOfExport(statement, text));
    }
  }

  const walkDynamic = (node: Node): void => {
    if (isCallExpression(node) && node.expression.kind === SyntaxKind.ImportKeyword) {
      const argument = node.arguments[0];
      const literal = argument !== undefined && isStringLiteral(argument);
      specifiers.push({
        text: literal ? (argument as unknown as { text: string }).text : null,
        raw: argument === undefined ? '' : sourceTextOf(file, argument),
        kind: 'dynamic',
        typeOnly: false,
        bindings: [],
        unreadableClause: false,
      });
    }
    node.forEachChild(walkDynamic);
  };
  file.forEachChild(walkDynamic);

  const { namespaceReads, bareIdentifiers } = collectReferences(file);

  return {
    path,
    specifiers,
    compilerModules: [...file.imports].map((literal) => (literal as unknown as { text: string }).text),
    unparseable: false,
    namespaceReads,
    bareIdentifiers,
  };
}

function sourceTextOf(file: SourceFile, node: Node): string {
  try {
    const text = (file as unknown as { text: string }).text;
    const start = (node as unknown as { pos: number }).pos;
    const end = (node as unknown as { end: number }).end;
    return text.slice(start, end).trim();
  } catch {
    return '';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// The graph.
// ─────────────────────────────────────────────────────────────────────────────

/** The project file a specifier names, or `null` if it is a package. */
export async function resolveModule(
  specifier: string,
  fromFile: string,
): Promise<string | null> {
  let base: string;
  if (specifier.startsWith('@/')) base = join(SRC, specifier.slice(2));
  else if (specifier.startsWith('.')) base = resolve(dirname(resolve(ROOT, fromFile)), specifier);
  else return null; // a package, not our source

  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    join(base, 'index.ts'),
    join(base, 'index.tsx'),
  ];

  for (const candidate of candidates) {
    if (!candidate.endsWith('.ts') && !candidate.endsWith('.tsx')) continue;
    if (overlay.has(candidate) || existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Every project file reachable from `entryFiles`, as paths relative to the
 * repository root. Includes the entries themselves.
 */
export async function reachableModules(entryFiles: readonly string[]): Promise<Set<string>> {
  const seen = new Set<string>();
  const pending = entryFiles.map((file) => resolve(ROOT, file));

  while (pending.length > 0) {
    const file = pending.pop()!;
    if (seen.has(file)) continue;
    if (!overlay.has(file) && !existsSync(file)) continue;
    seen.add(file);

    for (const specifier of readModule(file).specifiers) {
      if (specifier.text === null) continue;
      const resolved = await resolveModule(specifier.text, file);
      if (resolved !== null) pending.push(resolved);
    }
  }

  return new Set([...seen].map((file) => relativePath(file)));
}
