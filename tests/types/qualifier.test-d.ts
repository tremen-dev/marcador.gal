/**
 * CA-8 (type level) — the union has exactly those four members.
 *
 * Both directions are asserted: `Exclude<...>` catches a member added, and the
 * reverse assignment catches a member removed or renamed.
 */
import { describe, expect, test } from 'vitest';
import type { MatchQualifier } from '@/model';

type Expected = 'provisional' | 'confirmado' | 'pendente_de_confirmar' | 'sen_sinal';

/** No member of the union outside the four terms of dominio.md. */
type NoExtras = Exclude<MatchQualifier, Expected> extends never ? true : false;
/** No term of dominio.md missing from the union. */
type NoneMissing = Exclude<Expected, MatchQualifier> extends never ? true : false;

const noExtras: NoExtras = true;
const noneMissing: NoneMissing = true;

// @ts-expect-error `pending_confirmation` is the anglicised form CA-8 forbids.
const anglicised: MatchQualifier = 'pending_confirmation';
void anglicised;

describe('CA-8 — MatchQualifier at the type level', () => {
  test('the union is exactly the four galego terms', () => {
    expect(noExtras && noneMissing).toBe(true);
  });
});
