/**
 * Makes Node resolve the module graph of this repository (F-SPEC-002-V4).
 *
 * The repository declares one alias, `@/*` → `./src/*`, in `tsconfig.json` and
 * in `vitest.config.ts`. Both vitest and `tsc` honour it; **Node does not**,
 * and Node is who runs the two CLIs of SPEC-002. The same goes for the
 * extensionless relative specifiers of SPEC-001 (`import … from './store'`):
 * a bundler resolves them, ESM has no extension resolution and refuses.
 *
 * So the alias is declared in the third place it has to exist. This is the
 * option the verification left open — "elegir rutas relativas o declarar el
 * alias donde Node lo vea" — and it is the one that touches no code of
 * SPEC-001: `src/raw/` and `src/model/` are reused exactly as they are, which
 * is what the spec asks for in *Entidades y reglas afectadas*.
 *
 * The hook is deliberately narrow. It only rewrites specifiers whose IMPORTER
 * lives under `src/`, so nothing inside `node_modules` changes meaning, and it
 * only ever resolves to a `.ts` file that exists — anything else falls through
 * to Node's own resolution untouched.
 */
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** The directory the `@/` alias points at, taken from this file's own place. */
const SRC = fileURLToPath(new URL('../../', import.meta.url));
const SRC_URL = pathToFileURL(SRC).href;

/** The candidates a bundler would try, restricted to TypeScript sources. */
function resolveTypeScript(path: string): string | null {
  for (const candidate of [path, `${path}.ts`, join(path, 'index.ts')]) {
    if (candidate.endsWith('.ts') && existsSync(candidate)) {
      return pathToFileURL(candidate).href;
    }
  }
  return null;
}

function targetOf(specifier: string, parentURL: string): string | null {
  if (specifier.startsWith('@/')) return join(SRC, specifier.slice(2));
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    return fileURLToPath(new URL(specifier, parentURL));
  }
  return null;
}

/**
 * Installs the resolution. Called for its side effect by the two CLI entries,
 * which then import their `main` DYNAMICALLY: a static import would be linked
 * before this module's body ever ran, and the hook would arrive too late.
 */
export function registerProjectResolution(): void {
  registerHooks({
    resolve(specifier, context, nextResolve) {
      const parentURL = context.parentURL;
      if (parentURL === undefined || !parentURL.startsWith(SRC_URL)) {
        return nextResolve(specifier, context);
      }

      const target = targetOf(specifier, parentURL);
      const url = target === null ? null : resolveTypeScript(target);
      if (url === null) return nextResolve(specifier, context);

      return { url, shortCircuit: true };
    },
  });
}
