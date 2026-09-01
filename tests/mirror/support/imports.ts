/**
 * A static import graph over the TypeScript sources.
 *
 * It was born for the structural half of SPEC-002 CA-3 — phase A must not be
 * able to reach phase B's extractor, and the cheapest honest way to state that
 * is "no path in the import graph gets there". SPEC-008 CA-2.3, CA-2.5 and
 * CA-2.6 lean on the same walk, and WIDENING IT IS PART OF THAT CRITERION:
 * until today it only read `import`/`export … from '…'`, so it saw neither the
 * SIDE-EFFECT imports —`src/app/(gl)/layout.tsx` has one— nor the DYNAMIC ones
 * —the three `src/mirror/cli/*-cli.ts` have one— and it silently refused to
 * resolve `.tsx` at all, which is most of `src/site/` and all of `src/app/`.
 * A closure that cannot see three kinds of edge is not a closure.
 *
 * Deliberately crude — it reads the source with regular expressions — because
 * the alternative is a compiler API dependency. Comments are stripped first:
 * half of this repository's prose quotes the very lines these patterns hunt
 * for. It resolves the two forms this repository uses: `@/…` and relative
 * paths, with or without a `.ts`/`.tsx` extension.
 */
import { readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { stripComments } from '../../support/source-tree';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

/**
 * `import … from '…'` and `export … from '…'`, anchored at the statement. The
 * first group is THE CLAUSE — what crosses the frontier — because SPEC-008
 * CA-2.3 stopped conceding packages and started conceding SURFACES: it is no
 * longer enough to know which module was named, one has to know which names
 * came out of it.
 */
const FROM_PATTERN = /(?:^|\n)\s*(?:import|export)\b([^;'"]*?)\bfrom\s*(['"])([^'"]*)\2/g;
/** `import '…'` — a side-effect import names a module and pulls it in. */
const SIDE_EFFECT_PATTERN = /(?:^|\n)\s*import\s*(['"])([^'"]*)\1/g;
/** `import(…)`, literal or not. The argument is captured raw and judged after. */
const DYNAMIC_PATTERN = /\bimport\s*\(\s*([^)]*)\)/g;
/** A dynamic argument that is a single, whole, static string literal. */
const STATIC_LITERAL = /^(['"])([^'"]*)\1$/;
/** A bare JavaScript identifier. */
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

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
   * The clause could not be read. FAIL CLOSED: a surface that cannot be
   * enumerated is not a surface, and `export * from` a package is exactly the
   * whole-namespace concession CA-2.3 refuses.
   */
  readonly unreadableClause: boolean;
}

function binding(name: string, local: string): ImportBinding {
  return { name, kind: name === 'default' ? 'default' : 'named', local };
}

/** The names a `{ … }` list lets through, or `null` when it cannot be read. */
function parseNamedList(inner: string): ImportBinding[] | null {
  const bindings: ImportBinding[] = [];

  for (const piece of inner.split(',')) {
    const item = piece.trim();
    if (item === '') continue;

    const typed = /^type\s+([\s\S]+)$/.exec(item);
    const body = typed === null ? item : typed[1]!.trim();

    const aliased = /^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/.exec(body);
    const name = aliased === null ? body : aliased[1]!;
    const local = aliased === null ? body : aliased[2]!;

    if (!IDENTIFIER.test(name) || !IDENTIFIER.test(local)) return null;
    // An inline `type` name is erased too, so it concedes nothing.
    if (typed === null) bindings.push(binding(name, local));
  }

  return bindings;
}

/** What an `import`/`export … from` clause lets through. */
function parseClause(clause: string): {
  typeOnly: boolean;
  bindings: ImportBinding[];
  unreadableClause: boolean;
} {
  const trimmed = clause.trim();
  const typeOnly = /^type\b/.test(trimmed);
  const rest = typeOnly ? trimmed.slice(4).trim() : trimmed;

  // A type-only import is erased whole: no name crosses, nothing to declare.
  if (typeOnly) return { typeOnly, bindings: [], unreadableClause: false };
  if (rest === '') return { typeOnly, bindings: [], unreadableClause: false };

  const brace = rest.indexOf('{');
  const head = (brace === -1 ? rest : rest.slice(0, brace)).replace(/,\s*$/, '').trim();
  const bindings: ImportBinding[] = [];

  if (head !== '') {
    const namespace = /^\*\s+as\s+([A-Za-z_$][\w$]*)$/.exec(head);
    if (namespace !== null) {
      bindings.push({ name: '*', kind: 'namespace', local: namespace[1]! });
    } else if (IDENTIFIER.test(head)) {
      bindings.push({ name: 'default', kind: 'default', local: head });
    } else {
      // `export * from 'pkg'` lands here, and so does anything else this
      // reader cannot name. Red, and on purpose.
      return { typeOnly, bindings, unreadableClause: true };
    }
  }

  if (brace !== -1) {
    const body = rest.slice(brace);
    const close = body.lastIndexOf('}');
    if (close === -1 || body.slice(close + 1).trim() !== '') {
      return { typeOnly, bindings, unreadableClause: true };
    }
    const named = parseNamedList(body.slice(1, close));
    if (named === null) return { typeOnly, bindings, unreadableClause: true };
    bindings.push(...named);
  }

  return { typeOnly, bindings, unreadableClause: false };
}

/**
 * Every module specifier of a source file, comments already out, WITH THE
 * NAMES IT LETS THROUGH.
 *
 * A `dynamic` entry whose `text` is `null` is a specifier that CANNOT BE READ
 * — `import(MOD)`, `import('node:' + 'https')` — and SPEC-008 CA-2.3 makes
 * that red by construction: an import nobody can read closes no door.
 */
export function moduleSpecifiers(source: string): readonly ModuleSpecifier[] {
  const code = stripComments(source);
  const found: ModuleSpecifier[] = [];

  for (const match of code.matchAll(FROM_PATTERN)) {
    found.push({ text: match[3]!, raw: match[3]!, kind: 'static', ...parseClause(match[1]!) });
  }
  for (const match of code.matchAll(SIDE_EFFECT_PATTERN)) {
    found.push({
      text: match[2]!,
      raw: match[2]!,
      kind: 'side-effect',
      typeOnly: false,
      bindings: [],
      unreadableClause: false,
    });
  }
  for (const match of code.matchAll(DYNAMIC_PATTERN)) {
    const raw = match[1]!.trim();
    const literal = STATIC_LITERAL.exec(raw);
    found.push({
      text: literal === null ? null : literal[2]!,
      raw,
      kind: 'dynamic',
      typeOnly: false,
      bindings: [],
      unreadableClause: false,
    });
  }

  return found;
}

/**
 * The source with its `import`/`export … from` statements removed.
 *
 * What is left is where a namespace's members are actually READ, which is what
 * CA-2.3 has to enumerate. Without this, `import * as cheerio from 'cheerio'`
 * would read as a use of `cheerio` itself.
 */
export function withoutImportStatements(code: string): string {
  return code
    .replaceAll(/(?:^|\n)\s*(?:import|export)\b[^;'"]*?\bfrom\s*(['"])[^'"]*\1;?/g, '\n')
    .replaceAll(/(?:^|\n)\s*import\s*(['"])[^'"]*\1;?/g, '\n');
}

async function readIfPresent(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
}

/** The project file a specifier names, or `null` if it is a package. */
export async function resolveModule(
  specifier: string,
  fromFile: string,
): Promise<string | null> {
  let base: string;
  if (specifier.startsWith('@/')) base = join(SRC, specifier.slice(2));
  else if (specifier.startsWith('.')) base = resolve(dirname(fromFile), specifier);
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
    if ((await readIfPresent(candidate)) !== null) return candidate;
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
    const source = await readIfPresent(file);
    if (source === null) continue;
    seen.add(file);

    for (const specifier of moduleSpecifiers(source)) {
      if (specifier.text === null) continue;
      const resolved = await resolveModule(specifier.text, file);
      if (resolved !== null) pending.push(resolved);
    }
  }

  return new Set([...seen].map((file) => relative(ROOT, file)));
}
