/**
 * Reading the source tree, for the criteria that are architecture and not
 * behaviour (SPEC-008 CA-2 and CA-12).
 *
 * A prohibition that only lives in an ADR is a prohibition that gets broken
 * the day nobody re-reads the ADR — which is exactly how F-SPEC-002-23 was
 * born. So the two frontiers of ADR-014 §4 are assertions over the tree.
 *
 * Precedent for the shape: case 8 of `tests/mirror/capture/robots.test.ts` and
 * `tests/site/source-scan.ts`.
 */
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

export const SRC = join(process.cwd(), 'src');

export interface SourceFile {
  /** Path relative to `src/`, with forward slashes. */
  readonly path: string;
  /** The file as written. */
  readonly text: string;
  /**
   * The file with block and line comments removed. Prose ABOUT a pattern must
   * not count as an implementation of it — half of this repository's comments
   * quote the very lines these detectors hunt for.
   */
  readonly code: string;
}

export function stripComments(source: string): string {
  return source.replaceAll(/\/\*[\s\S]*?\*\//g, '').replaceAll(/^\s*\/\/.*$/gm, '');
}

/** Every file under `src/`, whatever its extension, sorted by path. */
export async function readSourceTree(dir: string = SRC): Promise<readonly SourceFile[]> {
  const files: SourceFile[] = [];

  async function walk(current: string): Promise<void> {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }
      const text = await readFile(full, 'utf8');
      files.push({
        path: relative(SRC, full).replaceAll('\\', '/'),
        text,
        code: stripComments(text),
      });
    }
  }

  await walk(dir);
  return files.sort((a, b) => a.path.localeCompare(b.path));
}
