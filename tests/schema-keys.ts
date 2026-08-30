/**
 * The set of field names a zod schema describes.
 *
 * Used by CA-14 to compare the canonical schemas against
 * `information_schema.columns`. Unwraps `.readonly()` and takes the UNION of
 * the branches of a discriminated union, because a branch-dependent key
 * (`confirmed_by`) is still a column.
 *
 * It is tested on its own (`tests/model/schema-keys.test.ts`) so that CA-14
 * cannot pass because the extractor quietly returned nothing.
 */
import type { ZodType } from 'zod';

interface AnyDef {
  readonly type?: string;
  readonly innerType?: unknown;
  readonly options?: readonly unknown[];
  readonly shape?: Record<string, unknown>;
}

function defOf(schema: unknown): AnyDef {
  const def = (schema as { def?: AnyDef }).def;
  if (def === undefined) {
    throw new Error('not a zod schema: no `def`');
  }
  return def;
}

export function schemaKeys(schema: ZodType): ReadonlySet<string> {
  const keys = new Set<string>();
  collect(schema, keys);
  if (keys.size === 0) {
    throw new Error('schemaKeys found no field; the extractor is broken, not the schema');
  }
  return keys;
}

function collect(schema: unknown, into: Set<string>): void {
  const def = defOf(schema);

  if (def.innerType !== undefined) {
    collect(def.innerType, into);
    return;
  }

  if (def.options !== undefined) {
    for (const option of def.options) collect(option, into);
    return;
  }

  if (def.shape !== undefined) {
    for (const key of Object.keys(def.shape)) into.add(key);
    return;
  }

  throw new Error(`schemaKeys does not know how to walk a zod "${String(def.type)}"`);
}
