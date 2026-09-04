/**
 * The panel's stylesheet — DERIVED FROM `src/design/`, WITH NOT ONE VALUE OF
 * ITS OWN (ADR-026, ADR-025 §2, §3 and §4.1, ADR-013, SPEC-017 CA-10).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NOT ONE COLOUR, FAMILY, RADIUS OR STEP IS WRITTEN HERE (CA-10.1).
 *
 * The `:root` block is GENERATED from `TOKEN_CORRESPONDENCE` and everything
 * below it uses `var(--…)`. There is no `#rrggbb` and no font name in this
 * file, and a case asserts exactly that over this source: if somebody writes
 * one, a named case goes red. That is what makes «one home for the tokens»
 * (ADR-026 §3.1) true by construction instead of by discipline — the same
 * shape `RN01_WEIGHTS` gave the weights of RN-01.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT IS INHERITED FROM THE SYSTEM, AND WHAT IS NOT.
 *
 * INHERITED (ADR-026 §1 and §3): the palette, the two families, the spacing
 * step, the radii and the five typographic roles.
 *
 * NOT INHERITED, because the system does not comply and ADR-013 and ADR-025
 * win over it (ADR-026 §4, CA-10.7 to CA-10.12):
 *
 *   * `--fg-prov` DOES NOT EXIST. `provisional` and `confirmado` are both
 *     served with `--fg` and BOTH carry a text label — `confirmado` included,
 *     which the system leaves mute. Here the normal one is `provisional`
 *     (ADR-008 §1), and dimming it would make the screen lie about the
 *     reliability of the datum (D-6, RN-12). It is entry 1 of EPIC-004's
 *     inventory, answered before the first line of CSS.
 *   * `confirmado` IS NOT PAINTED WITH THE BRAND ACCENT (ADR-026 §2.3). The
 *     brand green already means brand, links, active nav and headings; a green
 *     that means six things means none.
 *   * NO GLYPH AND NO ABBREVIATION. The system writes `?`, `!`, `FIN`, `APR`
 *     and `DESC`; none of the five is in `dominio.md` and none is translatable
 *     (D-2). Every state and every qualifier comes out of `src/i18n/` with its
 *     registered literal, and `live` is *En xogo*, never *Directo*.
 *   * THE TOUCH FLOOR IS 44 px, NOT THE SYSTEM'S CONCESSION. Its compact row
 *     measures ≈34 px and its primary button ≈43 px; ADR-025 §3 is intact and
 *     wins (ADR-026 §5). There is no compact row here anyway.
 *   * FOCUS, KEYBOARD AND FORM CONTROLS ARE INVENTED WITHIN THE LANGUAGE, not
 *     applied from it: the system has zero `:focus`, zero `outline`, zero
 *     `tabindex`, zero `aria-*` and zero `<input>`, `<textarea>`, `<select>`,
 *     `<button>` and `<label>` in its ten files (ADR-026 §4.6). That is
 *     declared in CA-10.15 and it is the honest description of this file: the
 *     controls below are new, and only their vocabulary is the system's.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE FONTS ARE SELF-HOSTED (ADR-026 §3.5, CA-10.6). Not one `@import`, not
 * one request to a third party from the browser of whoever opens the panel.
 * The faces are served from our own origin and only the weights the roles use
 * are loaded.
 *
 * AND THE SHEET IS SERVED INLINE, which is the strictest reading of what
 * survives of ADR-025 §4.2 — «hoja propia, alcanzable solo desde sus rutas»:
 * there is no URL that serves it, so nothing outside the panel can reach it
 * even by accident, and `src/app/globals.css` is neither edited nor loaded
 * (ADR-025 §4.1, intact).
 */
import { rootBlock } from '@/design/system';
import {
  FOCUS_RING_PX,
  HAIRLINE_PX,
  INPUT_FONT_PX,
  LOADED_FACES,
  FONT_DIRECTORY,
  MEASURE,
  RADIUS,
  SPACE,
  TOUCH_TARGET_PX,
  TYPE,
} from '@/design/tokens';
import type { TypeRole } from '@/design/tokens';

export { FOCUS_RING_PX, INPUT_FONT_PX, TOUCH_TARGET_PX } from '@/design/tokens';

/** One step of the declared scale, by index. Nothing outside it is legal. */
function space(step: 0 | 1 | 2 | 3 | 4 | 5 | 6): string {
  return `${SPACE[step]}px`;
}

/** A typographic role, as a `font` shorthand plus whatever it declares. */
function role(name: keyof typeof TYPE): string {
  const declared: TypeRole = TYPE[name];
  const lines = [
    `font:${declared.weight} ${declared.px}px/${declared.leading} var(--${declared.family})`,
  ];
  if (declared.tracking !== undefined) lines.push(`letter-spacing:${declared.tracking}`);
  if (declared.uppercase === true) lines.push('text-transform:uppercase');
  return `${lines.join(';')};`;
}

/** The self-hosted faces, one `@font-face` each. No URL leaves our origin. */
function faces(): string {
  return LOADED_FACES.map(
    (face) =>
      `@font-face{font-family:'${face.family}';font-style:normal;font-weight:${face.weight};font-display:swap;src:url('${FONT_DIRECTORY}${face.file}') format('woff2')}`,
  ).join('\n');
}

/**
 * The whole stylesheet, as text. Everything that carries a value comes from
 * `src/design/`; what is written here is structure.
 */
export const PANEL_STYLESHEET = `
${faces()}

:root{${rootBlock()}}

*,*::before,*::after{box-sizing:border-box}

html{-webkit-text-size-adjust:100%;color-scheme:dark}

body{
  margin:0;
  padding:${space(2)} ${space(1)} ${space(6)};
  background:var(--bg);
  color:var(--fg);
  font-family:var(--sans);
  font-size:${INPUT_FONT_PX}px;
  line-height:${MEASURE.bodyLeading};
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
  overflow-wrap:anywhere;
}

/*
 * F-SPEC-017-18, CLOSED BY SPEC-018 CA-15.2. This used to repeat a bare 20.
 * It now takes the size from the ONE role of the system that declares a 20 —
 * score (20 / 600) — while keeping the family of team, because docs/diseno/
 * declares five roles and NONE of them is a 20 px sans heading, and inventing
 * a sixth role would be editing a frozen artefact (ADR-026 §3.7). The value is
 * no longer written here; where it comes from is auditable.
 */
h1{margin:0 0 ${space(2)};${role('team')}font-size:${TYPE.score.px}px}
h2{margin:${space(4)} 0 ${space(1)};${role('eyebrow')}color:var(--brand)}
h3{margin:${space(2)} 0 ${space(0)};${role('eyebrow')}color:var(--fg-muted)}
p{margin:0 0 ${space(1)}}

.soft{color:var(--fg-muted)}

/* ADR-013 §3: every digit of a scoreboard, an hour or a minute is tabular. */
.num,.score,.instant,td,th,input[type="number"]{
  font-family:var(--mono);
  font-variant-numeric:tabular-nums;
  font-feature-settings:'tnum' 1;
}
.score{${role('score')}color:var(--fg)}
.instant{${role('status')}color:var(--fg-muted)}

/*
 * THE FOUR QUALIFIERS. provisional and confirmado carry THE SAME colour —
 * the main one — and both carry their label; the other two carry a colour
 * because they are conditions and not the normal case, and they carry their
 * label too (ADR-026 §2, ADR-013 §2 and §6).
 */
.q-provisional,.q-confirmado{color:var(--fg)}
.q-pendente-de-confirmar{color:var(--amber)}
.q-sen-sinal{color:var(--alert)}

/* The five states. live is the ember of ADR-013 §1, and nothing else is. */
.s-live{color:var(--accent-live)}
.s-postponed,.s-suspended{color:var(--amber)}
.s-scheduled,.s-finished{color:var(--fg-muted)}

/* The one wide element scrolls INSIDE ITS OWN CONTAINER (ADR-025 §3.2). */
.scroller{overflow-x:auto}

/*
 * THE TABLE IS AS WIDE AS ITS CONTENT AND SCROLLS INSIDE .scroller. With
 * width:100% the columns squeezed and a canonical RFGF name broke character by
 * character at 360 px — measured. The name of a club is not a string to be
 * chopped (dominio.md: it is never translated, and it is not mangled either),
 * and D-8 asks for a screen that reads with bad coverage. ADR-025 §3.2 is
 * satisfied all the same: what scrolls is the container, never the body.
 */
table{border-collapse:collapse;width:max-content;min-width:100%}
th,td{padding:${space(1)};border-bottom:${HAIRLINE_PX}px solid var(--line-row);text-align:left;white-space:nowrap;overflow-wrap:normal}
th{${role('eyebrow')}color:var(--fg-dim);background:var(--bg-step);white-space:nowrap}
td{${role('team')}color:var(--fg)}
tbody tr:hover{background:var(--bg-elevated)}

/* ADR-025 §3, INTACT: every interactive control is at least 44 x 44 px. */
a,button,input,select,textarea,summary{min-height:${TOUCH_TARGET_PX}px}

a{
  display:inline-flex;
  align-items:center;
  min-width:${TOUCH_TARGET_PX}px;
  padding:0 ${space(0)};
  color:var(--brand);
  text-decoration:none;
}
a:hover{color:var(--fg);text-decoration:underline}

button{
  min-width:${TOUCH_TARGET_PX}px;
  padding:${space(1)} ${space(2)};
  border:${HAIRLINE_PX}px solid var(--brand);
  border-radius:${RADIUS.sm}px;
  background:var(--brand);
  color:var(--brand-ink);
  font:600 ${INPUT_FONT_PX}px/1 var(--sans);
  cursor:pointer;
}
button:hover{background:var(--brand-deep);border-color:var(--brand-deep)}

label{display:block;margin:${space(1)} 0 ${space(0)};${role('status')}color:var(--fg-muted)}

input,select,textarea{
  width:100%;
  max-width:${MEASURE.fieldMaxRem}rem;
  padding:${space(1)};
  border:${HAIRLINE_PX}px solid var(--line-strong);
  border-radius:${RADIUS.sm}px;
  background:var(--bg-step);
  color:var(--fg);
  /* ADR-025 §3.1, and it WINS over the 15 px of the system's team role. */
  font-size:${INPUT_FONT_PX}px;
  font-family:var(--sans);
}

textarea{min-height:${MEASURE.textAreaMinRem}rem}

/*
 * ADR-025 §2.1, INTACT and now permanent (ADR-026 §5) — the system has NO
 * focus state at all, so this comes from ADR-025 and not from it. A real
 * outline on the perimeter, never a change of background or of text colour,
 * and the browser's own ring is never switched off anywhere in this sheet.
 *
 * The ring is --fg and not --brand on purpose: the brand green already
 * means brand, link, heading and active nav, and ADR-026 §2.3 says a colour
 * that means six things means none. --fg over --bg is 18.4:1, far above
 * the 3:1 the rule asks — the test CALCULATES it.
 */
:focus-visible{
  outline:${FOCUS_RING_PX}px solid var(--fg);
  outline-offset:${FOCUS_RING_PX}px;
  border-radius:${RADIUS.sm}px;
}

fieldset{
  margin:0 0 ${space(2)};
  padding:${space(1)};
  border:${HAIRLINE_PX}px solid var(--line);
  border-radius:${RADIUS.lg}px;
  background:var(--bg-elevated);
}
legend{padding:0 ${space(0)};${role('eyebrow')}color:var(--brand)}

.row{border-top:${HAIRLINE_PX}px solid var(--line);padding:${space(1)} 0}
.notice{
  border:${HAIRLINE_PX}px solid var(--line-strong);
  border-radius:${RADIUS.md}px;
  padding:${space(1)};
  margin:0 0 ${space(2)};
  background:var(--bg-elevated);
  color:var(--fg);
}
ul{margin:0;padding:0;list-style:none}
main{max-width:${MEASURE.pageMaxRem}rem;margin:0 auto}
`;
