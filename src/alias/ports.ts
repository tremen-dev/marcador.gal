/**
 * The port for READING the alias catalogue (SPEC-011 §4, ADR-018).
 *
 * A NEW interface in a new file, like `MatchStore` (`src/calendar/ports.ts`):
 * `src/db/ports.ts` is the contract of SPEC-001, which is done, and a new
 * capability fits in a new interface (ADR-011 §6 applied to a port).
 *
 * ONE method, and it returns the `proposed` entries too: who filters by status
 * is `resolveConfirmedAlias` (`src/model/team.ts`), not the port — a store
 * that hid `proposed` would make «only confirmed resolves» untestable against
 * the real thing.
 *
 * Writing goes through `loadAliasCatalog` (`src/db/aliases.ts`) and nowhere
 * else: there is no `insert`, `update` or `delete` here.
 */
import type { SourceId } from '@/model/ids';
import type { TeamAlias } from '@/model/team';

export interface AliasStore {
  /** The aliases of one source and season, by alias then team_id. */
  listBySource(source: SourceId, season: string): Promise<readonly TeamAlias[]>;
}
