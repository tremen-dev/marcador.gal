/**
 * `npm run mirror:analizar`. Node 22 runs TypeScript directly (ADR-006).
 *
 * The resolution hook goes first and the real entry point is imported
 * DYNAMICALLY: a static import would be linked — and its own `@/…` specifiers
 * resolved — before this module's body ran (F-SPEC-002-V4).
 */
import { registerProjectResolution } from './node-resolve.ts';

registerProjectResolution();

const { main } = await import('./analizar.ts');

await main(process.argv.slice(2));
