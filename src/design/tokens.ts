/**
 * THE ONE DEFINITION OF THE DESIGN SYSTEM IN CODE (ADR-026 §3.1, SPEC-017
 * CA-10.1).
 *
 * `docs/diseno/` is the design system of this project and is BINDING for the
 * product (ADR-026 §1). This module is the only place where a colour, a type
 * family, a radius or a value of a scale is written down: no interface
 * declares one of its own. It is the same discipline `RN01_WEIGHTS`
 * (`src/ingest/sources.ts`) imposed on the weights of RN-01 — ONE HOME, AND
 * THEY ARE NOT COPIED.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE EACH THING COMES FROM, AND WHY IT IS THREE SOURCES AND NOT ONE
 * (ADR-026 §3.2, in its order of authority).
 *
 *   1. `docs/diseno/_tokens.css` — the colours and the two families. It is the
 *      DECLARED reference of the system and the same table ADR-013 calculated
 *      its contrasts over, so adopting it is coherent with what is approved.
 *      `tests/design/parity.test.ts` checks it TOKEN BY TOKEN.
 *   2. The scales declared IN PROSE in `docs/diseno/Main.dc.html` — «paso de
 *      espazo 4 px · 4 · 8 · 12 · 16 · 24 · 32 · 48. Radios 8 · 10 · 14 · 999»
 *      and the five named typographic roles. WHAT IS ADOPTED IS WHAT IS
 *      DECLARED, NOT WHAT IS PRACTISED: the system itself breaks its own scale
 *      (gaps of 3, 5, 6, 7, 10, 14, 28; radii of 7, 12, 6), and the product
 *      does not inherit the breach of a rule the system wrote for itself.
 *   3. The three colours IN USE WITH NO TOKEN — `#131211`, `#1E1A16`,
 *      `#1D1A16` — which get a name on the way in, because a value with no
 *      name gets copied and a token gets reused.
 *
 * WHY `_tokens.css` IS NOT IMPORTED AT RUNTIME (ADR-026, alternatives): it
 * would tie the application to a FROZEN artefact of another epic, it would
 * drag its `@import` of Google Fonts into production, and it is not the source
 * of truth even inside the system — no artboard uses it.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT IS NOT CHECKABLE, DECLARED WHERE IT IS WRITTEN (ADR-016 §6,
 * ADR-026 §3.3, SPEC-017 CA-10.4): the parity test only covers COLOUR AND TYPE
 * FAMILY, which is all `_tokens.css` declares. SPACING, RADII, THE TYPE SCALE
 * AND DENSITY CANNOT BE CHECKED AGAINST ANYTHING — in the system they live in
 * prose and in inline hexadecimals the system does not respect. There the
 * adherence is held by HUMAN REVIEW, not by a test. Destination: EPIC-004,
 * turning its scales into tokens; trigger: the thaw.
 */

/**
 * The colours, ANGLICISED (declared divergence 3 of ADR-026 §3.4). The
 * correspondence with the system's names is explicit and auditable in
 * `./system.ts`; `--directo` is not kept because it would put back into the
 * code the label `dominio.md` retired on 2026-09-03 — `live` is *En xogo*.
 */
export const COLORS = {
  /** `--bg`. The ground of every surface this ADR governs. Dark-only (§3.6). */
  bg: '#111110',
  /** `--bg-elev`. A card, a panel, anything that sits above the ground. */
  bgElevated: '#1A1815',
  /** `--bg-step`. The next step up: a table head, a pill. */
  bgStep: '#221F1A',
  /** `--line`. The ordinary rule. */
  line: '#2A2620',
  /** `--line-strong`. The rule that has to be seen: a border of a control. */
  lineStrong: '#3D362C',
  /** `--fg`. The text that carries a datum. 18.4:1 over `bg`. */
  fg: '#F5F1EA',
  /** `--fg-muted`. A label, a caption. Still ≥ 4.5:1 (ADR-013 §6). */
  fgMuted: '#A7A5A0',
  /** `--fg-dim`. The dimmest the system goes. NEVER for a datum. */
  fgDim: '#716F6C',
  /** `--marca`. Brand, headings, links, active nav. NEVER a state (ADR-013 §1). */
  brand: '#56DB8F',
  /** `--marca-deep`. The brand pressed. */
  brandDeep: '#35C177',
  /** `--marca-ink`. Text over the brand. */
  brandInk: '#04160C',
  /**
   * `--directo`, anglicised. The accent of a match being played. ADR-013 §1
   * blinds ember ↔ `live`, so this colour means that and nothing else.
   */
  accentLive: '#FF6B00',
  /** `--amber`. The warning: *pendente de confirmar* (RN-06 by timeout). */
  amber: '#F0B135',
  /** `--alerta`, anglicised. *Sen sinal* (RN-07) and an open alert (RN-05). */
  alert: '#FF655A',
  /**
   * IN USE IN THE SYSTEM WITH NO TOKEN (ADR-026 §3.2, source 3): a surface a
   * shade above the ground, for a sticky head or a bottom bar.
   */
  bgSubtle: '#131211',
  /** IN USE WITH NO TOKEN: the tint of a row of a match being played. */
  bgLive: '#1E1A16',
  /** IN USE WITH NO TOKEN: the separator between rows, softer than `line`. */
  lineRow: '#1D1A16',
} as const;

export type ColorToken = keyof typeof COLORS;

/**
 * The two families. The names of the faces are the system's; the fallbacks are
 * the system's too. THE FONT FILES ARE SELF-HOSTED and no interface of this
 * project asks a third party for one (ADR-026 §3.5, CA-10.6).
 */
export const FAMILIES = {
  /** `--sans`. */
  sans: "'Geist',ui-sans-serif,system-ui,-apple-system,'Helvetica Neue',Arial,sans-serif",
  /** `--mono`. Tabular digits live here (ADR-013 §3). */
  mono: "'Geist Mono',ui-monospace,'SF Mono',Menlo,Consolas,monospace",
} as const;

export type FamilyToken = keyof typeof FAMILIES;

/**
 * The spacing step, DECLARED in `Main.dc.html`: «paso de espazo 4 px ·
 * 4 · 8 · 12 · 16 · 24 · 32 · 48». Nothing outside this list is a legal gap.
 */
export const SPACE = [4, 8, 12, 16, 24, 32, 48] as const;

/** The radii, DECLARED in `Main.dc.html`: «Radios 8 · 10 · 14 · 999». */
export const RADIUS = { sm: 8, md: 10, lg: 14, pill: 999 } as const;

/** One typographic role of the system, as `Main.dc.html` writes it. */
export interface TypeRole {
  readonly px: number;
  readonly weight: number;
  readonly family: FamilyToken;
  readonly leading: number;
  /** `letter-spacing`, when the role declares one. */
  readonly tracking?: string;
  readonly uppercase?: boolean;
}

/**
 * The five roles the system names, with the numbers it writes beside each one
 * (`44 / 800`, `20 / 600`, `15 / 500`, `13 / 600`, `11 / 600`).
 */
export const TYPE: Readonly<Record<'display' | 'score' | 'team' | 'status' | 'eyebrow', TypeRole>> =
  {
    /** «Marcador da ficha de partido». */
    display: { px: 44, weight: 800, family: 'sans', leading: 1, tracking: '-0.045em' },
    /** «Marcador na lista. Mono e tabular: as columnas non bailan». */
    score: { px: 20, weight: 600, family: 'mono', leading: 1 },
    /** «Nome canónico RFGF. Nunca se traduce». */
    team: { px: 15, weight: 500, family: 'sans', leading: 1.2, tracking: '-0.01em' },
    /** «Minuto, hora de saque». The abbreviations of the system do NOT come. */
    status: { px: 13, weight: 600, family: 'mono', leading: 1 },
    /** «Cabeceira de competición». */
    eyebrow: { px: 11, weight: 600, family: 'mono', leading: 1, tracking: '0.15em', uppercase: true },
  };

/**
 * ADR-025 §3, INTACT AND NOW PERMANENT (ADR-026 §5). A named constant in ONE
 * place, so revising it is a diff.
 *
 * THE SYSTEM DECLARES A CONCESSION BELOW THIS FLOOR — the compact row drops to
 * «40» and measures ≈34 px, and its primary button comes out at ≈43 px
 * (ADR-026 §4.5) — AND THE FLOOR WINS: ADR-025 §1 says a design system may
 * RAISE §2 and §3, never lower them. There is no compact row here anyway.
 */
export const TOUCH_TARGET_PX = 44;

/** ADR-025 §2.1: the focus ring is at least this thick. */
export const FOCUS_RING_PX = 2;

/**
 * ADR-025 §3.1: below 16 px Safari on iOS zooms when a field takes focus, and
 * throws the screen out — on a phone, on the touch line, correcting a
 * scoreboard. The `team` role of the system is 15 px; THE FLOOR WINS, and it
 * is written here rather than left to whoever writes the next stylesheet.
 */
export const INPUT_FONT_PX = 16;

/**
 * The faces this project actually loads, AND NO OTHERS (ADR-026 §3.5: «carga
 * solo los pesos que se usan»). The system's `@import` asked for SEVEN weights
 * of Geist and used five; these five faces are the ones the panel's roles need.
 *
 * `display` (44 / 800) IS NOT HERE, and it is not an oversight: the panel does
 * not use that role — it has no match card, it has a work queue and forms — so
 * loading its face would be loading a weight nobody uses. THE ROLE STAYS
 * DECLARED above because `src/design/` is the home of the system's language for
 * every interface, and the snapshot's match card will want it.
 *
 * AND WHOEVER NEEDS IT HAS A DECISION WAITING, written here so it is not a
 * surprise: Vercel ships weight 800 of Geist only as an ITALIC static face
 * (`Geist-ExtraBoldItalic.woff2`); the upright ones are 700 (`Bold`) and 900
 * (`Black`). Getting exactly 800 upright means the variable face
 * (`Geist-Variable.woff2`), which is one file carrying every weight — and that
 * trades «only the weights used» for one request. It is a real trade-off and
 * it belongs to the spec that first needs `display`, not to this one.
 */
export const LOADED_FACES = [
  { family: 'Geist', weight: 400, file: 'Geist-Regular.woff2' },
  { family: 'Geist', weight: 500, file: 'Geist-Medium.woff2' },
  { family: 'Geist', weight: 600, file: 'Geist-SemiBold.woff2' },
  { family: 'Geist Mono', weight: 500, file: 'GeistMono-Medium.woff2' },
  { family: 'Geist Mono', weight: 600, file: 'GeistMono-SemiBold.woff2' },
] as const;

/** Where the self-hosted faces are served from. OUR OWN ORIGIN, always. */
export const FONT_DIRECTORY = '/fonts/';
