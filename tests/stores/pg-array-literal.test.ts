/**
 * The array parameters of the repositories are written as Postgres array
 * literals BY US, with a cast, and not handed to `postgres.js` as JS arrays.
 *
 * Why: the driver infers a parameter's type at query-build time from the
 * array-type map it fetches AFTER connecting, so the first statement of a
 * fresh connection serialises `['a', 'b']` as the text `a,b` — «malformed
 * array literal» — which is exactly what two concurrent instances of the
 * engine, each with its own connection, would hit on their first Decision
 * (SPEC-010 CA-8.5, measured). A literal we build is the same on every
 * connection. Pure; `npm test`.
 */
import { describe, expect, test } from 'vitest';
import { pgIntArray, pgTextArray } from '@/db/arrays';

describe('pgTextArray', () => {
  test('quotes every element and wraps them in braces', () => {
    expect(pgTextArray(['obs-0001', 'obs-0002'])).toBe('{"obs-0001","obs-0002"}');
  });

  test('escapes backslashes and double quotes inside an element', () => {
    expect(pgTextArray(['a"b', 'c\\d'])).toBe('{"a\\"b","c\\\\d"}');
  });

  test('an empty list is the empty array literal', () => {
    expect(pgTextArray([])).toBe('{}');
  });

  test('an element with a comma or a brace stays one element', () => {
    expect(pgTextArray(['x,y', '{z}'])).toBe('{"x,y","{z}"}');
  });
});

describe('pgIntArray', () => {
  test('writes the integers unquoted', () => {
    expect(pgIntArray([1, 2, 23])).toBe('{1,2,23}');
  });

  test('refuses anything that is not a safe integer', () => {
    expect(() => pgIntArray([1.5])).toThrow(/integer/);
    expect(() => pgIntArray([Number.NaN])).toThrow(/integer/);
  });
});
