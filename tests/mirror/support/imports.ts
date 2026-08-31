/**
 * A static import graph over the TypeScript sources, for the structural half
 * of CA-3: phase A must not be able to reach phase B's extractor, and the
 * cheapest honest way to state that is "no path in the import graph gets
 * there".
 *
 * Deliberately crude — it reads `import` statements with a regexp — because
 * the alternative is a compiler API dependency for one assertion. It resolves
 * the two forms this repository uses: `@/…` and relative paths.
 */
import { readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

const IMPORT_PATTERN = /(?:^|\n)\s*(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]/g;

async function readIfPresent(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
}

async function resolveModule(specifier: string, fromFile: string): Promise<string | null> {
  let base: string;
  if (specifier.startsWith('@/')) base = join(SRC, specifier.slice(2));
  else if (specifier.startsWith('.')) base = resolve(dirname(fromFile), specifier);
  else return null; // a package, not our source

  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts')]) {
    if ((await readIfPresent(candidate)) !== null && candidate.endsWith('.ts')) return candidate;
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

    for (const match of source.matchAll(IMPORT_PATTERN)) {
      const resolved = await resolveModule(match[1]!, file);
      if (resolved !== null) pending.push(resolved);
    }
  }

  return new Set([...seen].map((file) => relative(ROOT, file)));
}
