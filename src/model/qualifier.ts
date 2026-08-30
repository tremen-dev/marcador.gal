/**
 * Score qualifiers (SPEC-001 CA-8).
 *
 * The identifiers are English (`MatchQualifier`), the VALUES are the terms of
 * dominio.md and are never translated nor anglicised: they are galego domain
 * vocabulary (CLAUDE.md §Lenguas, D-2). `pendente_de_confirmar` is not
 * `pending_confirmation`.
 *
 * Deriving which qualifier a Decision gets is out of scope for SPEC-001: it
 * needs RN-07's 15-minute threshold and belongs to the decision engine.
 */
export const MATCH_QUALIFIERS = [
  'provisional',
  'confirmado',
  'pendente_de_confirmar',
  'sen_sinal',
] as const;

export type MatchQualifier = (typeof MATCH_QUALIFIERS)[number];
