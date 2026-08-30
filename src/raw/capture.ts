/**
 * RN-10 / D-5 — the raw response is archived BEFORE it is parsed.
 *
 * This is the only sanctioned path from a raw response to a parser. Adapters
 * go through it; that no other path exists is the business of their own specs.
 *
 * There is deliberately no degraded mode: if the archive fails, nothing is
 * parsed. An Observation without its raw is an Observation nobody can
 * reprocess or replay, which is the whole reason RN-10 exists.
 */
import type { RawObjectMeta, RawRef, RawStore } from './store';

export type RawParser<T> = (body: Uint8Array, rawRef: RawRef) => T | Promise<T>;

export async function captureThenParse<T>(
  store: RawStore,
  meta: RawObjectMeta,
  body: Uint8Array,
  parse: RawParser<T>,
): Promise<T> {
  // The `await` is load-bearing: parsing must not start until the bytes are
  // safely archived. `parse` then receives the reference, so the Observation
  // it produces cannot invent its own `raw_ref`.
  const rawRef = await store.put(meta, body);

  return await parse(body, rawRef);
}
