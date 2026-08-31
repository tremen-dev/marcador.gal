/**
 * `npm run mirror:analizar`. Node 22 runs TypeScript directly (ADR-006).
 */
import { main } from './analizar.ts';

await main(process.argv.slice(2));
