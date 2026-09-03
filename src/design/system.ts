/**
 * THE CORRESPONDENCE WITH `docs/diseno/`, AND THE CLOSED LIST OF DECLARED
 * DIVERGENCES (ADR-026 §3.3 and §3.4, SPEC-017 CA-10.2 and CA-10.3).
 *
 * «Seguir el sistema» without a mechanism is a sentence. With a mechanism it is
 * this: a table that says, name by name, which token of the code IS which token
 * of `docs/diseno/_tokens.css`, and a list — closed, with a motive per entry —
 * of everything that deliberately does NOT match. `tests/design/parity.test.ts`
 * reads the system's file and demands that the complement be EMPTY: **a token
 * of `_tokens.css` that is neither copied nor declared as a divergence is
 * RED**, and nobody has to know it exists (ADR-016 §3.1).
 *
 * It is the shape of `MEASUREMENT_WINDOWS` (ADR-019 §3), `ALLOWED_PACKAGES`
 * (ADR-016 §3.2) and the declared independent pairs (ADR-021 §7).
 *
 * `docs/diseno/` IS NOT EDITED (ADR-026 §3.7). It stays an artefact of
 * EPIC-004, which is frozen. WHAT MOVES, MOVES IN THE LIST BELOW — and the day
 * EPIC-004 thaws, that list is the agenda of the reconciliation.
 *
 * THE GUARD, WRITTEN WHERE IT BITES (ADR-026 §Consecuencias): the list is debt
 * with a shape. It is born with three entries; the day somebody cannot say
 * what is served by reading `docs/diseno/`, THE ARTEFACT IS OBSOLETE AND HAS
 * TO BE RECONCILED, not the list extended.
 */
import { COLORS, FAMILIES } from './tokens';
import type { ColorToken, FamilyToken } from './tokens';

/** The file this project's tokens are read against. Read, never imported. */
export const SYSTEM_TOKENS_FILE = 'docs/diseno/_tokens.css';

/** One row of the table: a token of the code, and the one it copies. */
export interface TokenCorrespondence {
  /** The key in `COLORS` or in `FAMILIES`. */
  readonly code: ColorToken | FamilyToken;
  /** The custom property this project emits. ANGLICISED (divergence 3). */
  readonly emitted: string;
  /**
   * The custom property of `_tokens.css` it copies, or `null` when the value is
   * one of the three the system uses WITH NO TOKEN (ADR-026 §3.2, source 3).
   */
  readonly system: string | null;
  /** Written when the row does not explain itself. */
  readonly motive?: string;
}

/**
 * THE TABLE. Sixteen rows: the fourteen colours of `_tokens.css` that are
 * copied, the two families, and the three colours the system uses with no
 * token, which get a name here on the way in.
 */
export const TOKEN_CORRESPONDENCE: readonly TokenCorrespondence[] = [
  { code: 'bg', emitted: '--bg', system: '--bg' },
  { code: 'bgElevated', emitted: '--bg-elevated', system: '--bg-elev' },
  { code: 'bgStep', emitted: '--bg-step', system: '--bg-step' },
  { code: 'line', emitted: '--line', system: '--line' },
  { code: 'lineStrong', emitted: '--line-strong', system: '--line-strong' },
  { code: 'fg', emitted: '--fg', system: '--fg' },
  { code: 'fgMuted', emitted: '--fg-muted', system: '--fg-muted' },
  { code: 'fgDim', emitted: '--fg-dim', system: '--fg-dim' },
  { code: 'brand', emitted: '--brand', system: '--marca' },
  { code: 'brandDeep', emitted: '--brand-deep', system: '--marca-deep' },
  { code: 'brandInk', emitted: '--brand-ink', system: '--marca-ink' },
  {
    code: 'accentLive',
    emitted: '--accent-live',
    system: '--directo',
    motive:
      "The accent of a match being played. The NAME is anglicised because `--directo` would put back into the code the label `dominio.md` retired on 2026-09-03 — `live` is *En xogo*, in one single form, on any surface (ADR-026 §4.4). `live` is the identifier of `MATCH_STATUSES`, so the English name is the model's own.",
  },
  { code: 'amber', emitted: '--amber', system: '--amber' },
  { code: 'alert', emitted: '--alert', system: '--alerta' },
  { code: 'sans', emitted: '--sans', system: '--sans' },
  { code: 'mono', emitted: '--mono', system: '--mono' },
  {
    code: 'bgSubtle',
    emitted: '--bg-subtle',
    system: null,
    motive:
      'IN USE IN THE SYSTEM WITH NO TOKEN (#131211): the background of a sticky head and of the bottom bar in three artboards. Named on the way in, because a value with no name gets copied and a token gets reused (ADR-026 §3.2, source 3).',
  },
  {
    code: 'bgLive',
    emitted: '--bg-live',
    system: null,
    motive:
      'IN USE WITH NO TOKEN (#1E1A16): the tint of the row of a match being played, in five places of `Componentes.dc.html` and in the three list artboards.',
  },
  {
    code: 'lineRow',
    emitted: '--line-row',
    system: null,
    motive:
      'IN USE WITH NO TOKEN (#1D1A16): the separator between rows, softer than `--line`, in the two list templates.',
  },
];

/** One thing the code deliberately does NOT take from the system. */
export interface Divergence {
  /** What diverges, named as the system names it. */
  readonly from: string;
  /** Why. Obligatory, like an entry of `ALLOWED_PACKAGES` (ADR-016 §3.2). */
  readonly motive: string;
}

/**
 * THE THREE DIVERGENCES, and they are exactly the three ADR-026 §3.4 motivates.
 * A fourth one is a diff with its motive AND a line in an ADR — not an
 * arbitration taken while writing a stylesheet.
 */
export const DECLARED_DIVERGENCES: readonly Divergence[] = [
  {
    from: '--fg-prov',
    motive:
      "ADR-026 §2: no qualifier is told apart by being dimmed. `provisional` and `confirmado` are BOTH served with `--fg` and BOTH carry a text label — `confirmado` included, which the system leaves mute («el normal no se anuncia»). In this project, with one automatic source of weight 0.7 (ADR-008 §1), the normal one is `provisional`: dimming it would make the screen lie about the reliability of the datum, against D-6 and RN-12. The token does not exist in the code AT ALL, because a token called `--fg-prov` is a written invitation to reintroduce the error (ADR-013 §6: «distinguir es distinguir dos cosas legibles, no borrar una»).",
  },
  {
    from: "@import url('https://fonts.googleapis.com/css2?family=Geist…')",
    motive:
      "ADR-026 §3.5: no interface of this project asks a third party for a font at load time. The `@import` is the first line of the ten files of the system and it would put a request from EVERY VISITOR to `fonts.googleapis.com` and `fonts.gstatic.com`, carrying their IP and their user-agent — in a project that wrote ADR-023 entire about processors and transfers. Geist is Vercel's and is redistributable under the OFL: the faces are SELF-HOSTED under `public/fonts/`, served from our own origin, and only the six weights the roles use are loaded (the system asked for seven and used five).",
  },
  {
    from: 'the names of the tokens are in galego',
    motive:
      "`CLAUDE.md` §Lenguas: identifiers go in English. The system writes `--marca`, `--marca-deep`, `--marca-ink`, `--directo` and `--alerta`; the code writes `--brand`, `--brand-deep`, `--brand-ink`, `--accent-live` and `--alert`. And `--directo` carries a second reason of its own: it perpetuates the label `dominio.md` retired on 2026-09-03. The table above makes the translation explicit and auditable, so the traceability survives without the error surviving with it.",
  },
];

/** The value of one token of the code, whichever of the two records it is in. */
export function valueOf(code: ColorToken | FamilyToken): string {
  return code in COLORS
    ? COLORS[code as ColorToken]
    : FAMILIES[code as FamilyToken];
}

/** The row of the table for an emitted custom property, or `null`. */
export function correspondenceOf(
  emitted: string,
  table: readonly TokenCorrespondence[] = TOKEN_CORRESPONDENCE,
): TokenCorrespondence | null {
  return table.find((row) => row.emitted === emitted) ?? null;
}

/**
 * The `:root` block this project serves, DERIVED from the table and from the
 * two records. It is written nowhere by hand, which is what makes CA-10.1
 * («no interface declares a colour of its own») true by construction rather
 * than by discipline.
 */
export function rootBlock(table: readonly TokenCorrespondence[] = TOKEN_CORRESPONDENCE): string {
  return table.map((row) => `${row.emitted}:${valueOf(row.code)}`).join(';');
}
