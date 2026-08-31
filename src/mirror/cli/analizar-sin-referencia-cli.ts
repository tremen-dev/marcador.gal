/**
 * `npm run mirror:analizar-sin-referencia`. Node 22 ejecuta TypeScript
 * directamente (ADR-006).
 *
 * El hook de resolución va primero y el punto de entrada real se importa de
 * forma DINÁMICA: un import estático se enlazaría —y sus especificadores `@/…`
 * se resolverían— antes de que corriese el cuerpo de este módulo
 * (F-SPEC-002-V4).
 */
import { registerProjectResolution } from './node-resolve.ts';

registerProjectResolution();

const { main } = await import('./analizar-sin-referencia.ts');

await main(process.argv.slice(2));
