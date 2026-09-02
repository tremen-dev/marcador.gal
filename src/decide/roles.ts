/**
 * `SourceId` → role of RN-01, and it FAILS CLOSED (SPEC-013 CA-1,
 * ADR-021 §8.4).
 *
 * RN-01's aclaración of 2026-09-02 draws the line this module lives on: the
 * NUMBER the engine compares against RN-02's threshold is the `confidence`
 * frozen in the `Observation` (RN-13), never the table of today. What the
 * table contributes is IDENTITY, not number — who is the operator, who is the
 * official source, who is human — which is what the precedence of RN-01 and
 * the «humano» of RN-04 and RN-06 need.
 *
 * So the roles are the KEYS of `RN01_WEIGHTS` (`src/ingest/sources.ts`,
 * SPEC-008) and the weights are imported, never copied: the numbers of RN-01
 * have one home and this is not it. That the table lives in the ingest module
 * is a residue with its destination written (SPEC-013 §Fuera de alcance,
 * EPIC-MEJORA): copying it here would be worse, and moving it would touch
 * files of a spec that is `hecho`.
 *
 * AND IT FAILS CLOSED. A `SourceId` with no entry is an error WITH A NAME,
 * never «assume it is automatic» (ADR-021 §8.4): a source nobody classified is
 * a source whose observations would silently get the weakest set of powers,
 * and that is exactly the shape of a defect nobody sees.
 */
import { RN01_WEIGHTS } from '@/ingest/sources';
import { SourceIdSchema } from '@/model/ids';
import type { SourceId } from '@/model/ids';

/** The six roles of RN-01. Its keys, never a second list. */
export type Rn01Role = keyof typeof RN01_WEIGHTS;

/**
 * The identifiers, spelled as `dominio.md` and `src/model/ids.ts` spell them.
 *
 * The VALUES are domain vocabulary and are not anglicised — `corresponsal`,
 * `operador` — for the same reason `MATCH_QUALIFIERS` keeps `pendente_de_confirmar`
 * (CLAUDE.md §Lenguas, D-2). The identifiers around them are English.
 */
export const OPERATOR: SourceId = SourceIdSchema.parse('operador');
export const CORRESPONDENT: SourceId = SourceIdSchema.parse('corresponsal');
/** `futgal.es`, the RFGF. Not capturable today (ADR-008 §1); its role is not. */
export const OFFICIAL: SourceId = SourceIdSchema.parse('futgal');
export const CEROACERO: SourceId = SourceIdSchema.parse('ceroacero');
export const BESOCCER: SourceId = SourceIdSchema.parse('besoccer');

/**
 * The table. One entry per source this project knows, capturable or not.
 *
 * `futgal` is here although ADR-008 §1 keeps it out of `DEFAULT_SOURCES`: the
 * day it becomes capturable it is an adapter and a weight, and the engine
 * already has the seat (SPEC-013 §Fuera de alcance). The two human sources are
 * here although no door lets their observations in yet: the bot and the panel
 * are the next two specs, and this is the half of them the engine owes.
 */
export const SOURCE_ROLES: Readonly<Record<string, Rn01Role>> = {
  [OPERATOR]: 'operator',
  [OFFICIAL]: 'official',
  [CORRESPONDENT]: 'correspondent',
  [CEROACERO]: 'aggregator',
  [BESOCCER]: 'aggregator',
};

/** Thrown when a `SourceId` has no role. Never a default (ADR-021 §8.4). */
export class UnknownSourceRoleError extends Error {
  override readonly name = 'UnknownSourceRoleError';
  readonly source: SourceId;

  constructor(source: SourceId) {
    super(
      `no RN-01 role declared for source ${JSON.stringify(source)}: the engine does not assume ` +
        'one (ADR-021 §8.4). Declare it in src/decide/roles.ts.',
    );
    this.source = source;
  }
}

/** The role of a source, or a named error. There is no third outcome. */
export function roleOf(
  source: SourceId,
  table: Readonly<Record<string, Rn01Role>> = SOURCE_ROLES,
): Rn01Role {
  const role = table[source];
  if (role === undefined) throw new UnknownSourceRoleError(source);
  return role;
}

/**
 * «Humano», in RN-04 and RN-06, IS BOTH (RN-01, aclaración of 2026-08-31).
 *
 * The operator is not the narrow reading of the word: a correspondent alone,
 * at 0.8, can lower a scoreboard and postpone a match, and what it publishes
 * comes out *provisional* because 0.8 < 0.9. What separates them is the
 * weight, not the permission.
 */
export function isHuman(role: Rn01Role): boolean {
  return role === 'operator' || role === 'correspondent';
}

/** The official source of RN-04, RN-05 and RN-06: the RFGF. */
export function isOfficial(role: Rn01Role): boolean {
  return role === 'official';
}
