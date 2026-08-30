/**
 * `npm run db:migrate`. Node 22 runs TypeScript directly, so there is no build
 * step and no extra dependency to keep the runner alive (ADR-006).
 */
import { main } from './migrate.ts';

await main();
