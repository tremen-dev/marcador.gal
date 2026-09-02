/**
 * SPEC-011 CA-4 (type level) — the alias port and its Postgres repository
 * have no `insert`, no `update` and no `delete`: writing goes through
 * `loadAliasCatalog` and nowhere else (SPEC-011 §4), like SPEC-010 CA-7.7.
 *
 * Inverted tests: if the class ever grew one of those methods, the directive
 * would become unused and `tsc` would fail with
 * "Unused '@ts-expect-error' directive".
 */
import { describe, expect, test } from 'vitest';
import type { AliasStore } from '@/alias/ports';
import type { PostgresAliasStore } from '@/db/aliases';
import type { SourceId } from '@/model/ids';
import type { TeamAlias } from '@/model/team';

declare const store: PostgresAliasStore;
declare const alias: TeamAlias;
declare const source: SourceId;

// @ts-expect-error `PostgresAliasStore` has no insert: writing is `loadAliasCatalog`.
store.insert(alias);

// @ts-expect-error `PostgresAliasStore` has no update: a correction is a reload of the file.
store.update(alias);

// @ts-expect-error `PostgresAliasStore` has no delete: retiring an alias is a reload too (ADR-018 §2).
store.delete(alias);

/** And the class is assignable to the port, as it is. */
const port: AliasStore = store;

/** The PUBLIC surface of the class is exactly the port's one method. */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

const surface: Equals<keyof PostgresAliasStore, keyof AliasStore> = true;

describe('CA-4 — no insert, no update, no delete', () => {
  test('the repository exposes exactly the port', () => {
    expect(surface).toBe(true);
    void port;
    void source;
  });
});
