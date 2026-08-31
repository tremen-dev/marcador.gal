/**
 * Shared helper for the tests that READ THE SOURCE CODE (SPEC-004 CA-5 and
 * CA-13.3). Both criteria are barriers that only work if they are assertions,
 * so both need to walk the tree the same way. Precedent: case 8 of
 * `tests/mirror/capture/robots.test.ts`.
 */
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

export const SRC = join(process.cwd(), 'src');

export interface SourceFile {
  /** Path relative to `src/`, with forward slashes. */
  readonly path: string;
  readonly text: string;
}

/** Every `.ts`/`.tsx` file under `dir`, depth-first, sorted by path. */
export async function readSourceFiles(dir: string = SRC): Promise<SourceFile[]> {
  const files: SourceFile[] = [];

  async function walk(current: string): Promise<void> {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }
      if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.tsx')) continue;
      files.push({
        path: relative(SRC, full).replaceAll('\\', '/'),
        text: await readFile(full, 'utf8'),
      });
    }
  }

  await walk(dir);
  files.sort((a, b) => a.path.localeCompare(b.path));
  return files;
}

/** Strips block and line comments so prose about a pattern does not count. */
export function stripComments(source: string): string {
  return source.replaceAll(/\/\*[\s\S]*?\*\//g, '').replaceAll(/^\s*\/\/.*$/gm, '');
}

/** The leading block comment of a module, or '' if it has none. */
export function headerComment(source: string): string {
  return /^\s*\/\*[\s\S]*?\*\//.exec(source)?.[0] ?? '';
}
