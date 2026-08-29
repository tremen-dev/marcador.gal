/**
 * Galego literals. Galego is the default language (D-2); every user-visible
 * string lives in an i18n bundle from day one and is never hardcoded.
 *
 * The KEYS of `qualifiers` are the domain terms of dominio.md and must stay in
 * step with `MATCH_QUALIFIERS` (SPEC-001 CA-8). The VALUES are what the
 * interface shows.
 *
 * SPEC-001 only needs the qualifiers; the castellano bundle and the rest of
 * the interface literals belong to the spec that builds the UI.
 */
import type { MatchQualifier } from '../model/qualifier';

export const gl = {
  qualifiers: {
    provisional: 'Provisional',
    confirmado: 'Confirmado',
    pendente_de_confirmar: 'Pendente de confirmar',
    sen_sinal: 'Sen sinal',
  } satisfies Record<MatchQualifier, string>,
} as const;

export type GalegoBundle = typeof gl;
