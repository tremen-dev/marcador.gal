/**
 * `npm run calendario:cargar -- <ruta>`. Node 22 runs TypeScript directly, so
 * there is no build step (ADR-006).
 *
 * The resolution hook goes first and the real entry point is imported
 * DYNAMICALLY, exactly as the three `src/mirror/cli/*-cli.ts` do: Node does
 * not resolve `@/…` nor the extensionless imports of `src/model/` on its own,
 * and a static import would be linked before this module's body ran
 * (F-SPEC-002-V4).
 */
import { registerProjectResolution } from '../mirror/cli/node-resolve.ts';

registerProjectResolution();

const { main } = await import('./command.ts');
const { createClient } = await import('../db/client.ts');

process.exitCode = await main(process.argv.slice(2), {
  env: process.env,
  stdout: (line) => process.stdout.write(`${line}\n`),
  stderr: (line) => process.stderr.write(`${line}\n`),
  openClient: createClient,
});
