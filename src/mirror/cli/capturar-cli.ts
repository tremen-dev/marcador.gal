/**
 * `npm run mirror:capturar`. Node 22 runs TypeScript directly (ADR-006).
 */
import { main } from './capturar.ts';

await main(process.argv.slice(2));
