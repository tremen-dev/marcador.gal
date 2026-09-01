/**
 * Postgres array literals, written by us (SPEC-010 CA-8.5, measured).
 *
 * `postgres.js` infers a parameter's type when the query is BUILT, from an
 * array-type map it only fills after connecting. On the first statement of a
 * fresh connection that map is empty, `['a', 'b']` goes out as the text `a,b`,
 * and the server answers «malformed array literal». Two concurrent instances
 * of the engine, each with its own connection, would hit exactly that on
 * their first Decision — so the repositories do not hand the driver a JS
 * array: they write the literal (`{"a","b"}`) and cast it (`::text[]`), which
 * is the same on every connection and at every moment.
 *
 * Reading is not affected: the driver registers its array PARSERS before the
 * first result arrives, so `text[]` still comes back as a JS array.
 */

function quoteElement(value: string): string {
  return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

/** `['a', 'b']` → `{"a","b"}`. Use with a `::text[]` cast. */
export function pgTextArray(values: readonly string[]): string {
  return `{${values.map(quoteElement).join(',')}}`;
}

/** `[1, 2]` → `{1,2}`. Use with an `::integer[]` cast. */
export function pgIntArray(values: readonly number[]): string {
  for (const value of values) {
    if (!Number.isSafeInteger(value)) {
      throw new TypeError(`pgIntArray: ${String(value)} is not an integer`);
    }
  }
  return `{${values.join(',')}}`;
}
