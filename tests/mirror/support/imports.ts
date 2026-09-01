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

/** `import … from '…'` and `export … from '…'`, anchored at the statement. */
const FROM_PATTERN = /(?:^|\n)\s*(?:import|export)[\s\S]*?from\s*(['"])([^'"]*)\1/g;
/** `import '…'` — a side-effect import names a module and pulls it in. */
const SIDE_EFFECT_PATTERN = /(?:^|\n)\s*import\s*(['"])([^'"]*)\1/g;
/** `import(…)`, literal or not. The argument is captured raw and judged after. */
const DYNAMIC_PATTERN = /\bimport\s*\(\s*([^)]*)\)/g;
/** A dynamic argument that is a single, whole, static string literal. */
const STATIC_LITERAL = /^(['"])([^'"]*)\1$/;

export interface ModuleSpecifier {
  /** The module named, when the specifier is a static string literal. */
  readonly text: string | null;
  /** What was written between the parentheses or quotes, verbatim. */
  readonly raw: string;
  readonly kind: 'static' | 'side-effect' | 'dynamic';
}

/**
 * Every module specifier of a source file, comments already out.
 *
 * A `dynamic` entry whose `text` is `null` is a specifier that CANNOT BE READ
 * — `import(MOD)`, `import('node:' + 'https')` — and SPEC-008 CA-2.3 makes
 * that red by construction: an import nobody can read closes no door.
 */
export function moduleSpecifiers(source: string): readonly ModuleSpecifier[] {
  const code = stripComments(source);
  const found: ModuleSpecifier[] = [];

  for (const match of code.matchAll(FROM_PATTERN)) {
    found.push({ text: match[2]!, raw: match[2]!, kind: 'static' });
  }
  for (const match of code.matchAll(SIDE_EFFECT_PATTERN)) {
    found.push({ text: match[2]!, raw: match[2]!, kind: 'side-effect' });
  }
  for (const match of code.matchAll(DYNAMIC_PATTERN)) {
    const raw = match[1]!.trim();
    const literal = STATIC_LITERAL.exec(raw);
    found.push({ text: literal === null ? null : literal[2]!, raw, kind: 'dynamic' });
  }

  return found;
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
