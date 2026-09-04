/**
 * The scoreboard's stylesheet — DERIVED FROM `src/design/`, WITH NOT ONE VALUE
 * OF ITS OWN (SPEC-018 CA-15; ADR-026, ADR-025 §2, §3 and §4.1, ADR-013).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NOT ONE COLOUR, FAMILY, RADIUS, STEP OR MEASURE IS WRITTEN HERE (CA-15.1).
 *
 * The `:root` block is GENERATED from `TOKEN_CORRESPONDENCE` and everything
 * below it uses `var(--…)`. There is no `#rrggbb` and no font name in this
 * file, and a case asserts exactly that over this source with a positive
 * control. It is what makes «one home for the tokens» (ADR-026 §3.1) true by
 * construction instead of by discipline.
 *
 * `MEASURE` and `HAIRLINE_PX` arrive with this spec (F-SPEC-017-18, CA-15.2):
 * the five values SPEC-017 wrote straight into the panel's sheet now have a
 * name in `src/design/`, and NEITHER OF THE TWO SHEETS contains a literal
 * measure any more.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT THIS SHEET DOES THAT THE PANEL'S DOES NOT.
 *
 *   * THE REFRESH NOTICE IS NOT A STATE AND IS NOT A QUALIFIER (CA-8.3,
 *     ADR-027 §4.2). `.transport` uses NONE of the `s-*` or `q-*` classes and
 *     its rule references NEITHER `--accent-live`, NOR `--amber`, NOR
 *     `--alert`: those already mean something else, and painting «the page
 *     could not refresh» with them is how a person on a touchline comes to
 *     believe the match stopped when what stopped was their phone. A positive
 *     control asserts that using one of those tokens turns a named case red.
 *   * A FAILED REFRESH DIMS NOTHING (ADR-027 §5). There is no rule in this
 *     sheet that fades, greys or hides a row: a stale page shows the last thing
 *     it knew, whole. Dimming the scoreboard because the network failed would
 *     be switching off a datum for a reason that is not the datum's
 *     (ADR-013 §6).
 *   * THE TEAM CELL NEVER ELLIPSES (CA-10.2). There is no `text-overflow` in
 *     this file, and that is load-bearing: in Terceira RFEF there are reserve
 *     sides told apart by one final letter, so `CD Lugo B` cut to `CD Lugo` is
 *     TWO CLUBS WITH THE SAME TEXT ON SCREEN. If it does not fit, the row grows
 *     and the table scrolls inside its own container.
 *   * `provisional` AND `confirmado` ARE SERVED THE SAME (ADR-026 §2): both
 *     with the main text colour, both with their label, `confirmado` WITH NO
 *     ADDITIONAL MARK (ADR-027 §8.2). Here the normal one is `provisional`
 *     (ADR-008 §1), and dimming it would make the screen lie about the
 *     reliability of the datum (D-6, RN-12).
 *
 * THE FONTS ARE SELF-HOSTED (ADR-026 §3.5, CA-1.5). Not one `@import`, not one
 * request to a third party from the browser of whoever opens this page — which
 * matters more here than in the panel, because here whoever opens it is
 * anybody. `TYPE.display` IS NOT USED AND ITS FACE IS NOT LOADED, and that is a
 * decision and not an oversight (CA-15.3): `display` is «the scoreboard of the
 * MATCH CARD» and this screen is A LIST. `LOADED_FACES` does not grow, and
 * F-SPEC-017-9 keeps its trigger — the first interface that uses the `display`
 * role.
 *
 * AND THE SHEET IS SERVED INLINE, which is the strictest reading of what
 * survives of ADR-025 §4.2: there is no URL that serves it, and
 * `src/app/globals.css` is neither edited nor loaded — a route handler is
 * wrapped by no layout, which is what makes ADR-025 §4.1 true here by
 * construction (CA-15.8).
 */
import { rootBlock } from '@/design/system';
import {
  FOCUS_RING_PX,
  FONT_DIRECTORY,
  HAIRLINE_PX,
  INPUT_FONT_PX,
  LOADED_FACES,
  MEASURE,
  RADIUS,
  SPACE,
  TOUCH_TARGET_PX,
  TYPE,
} from '@/design/tokens';
import type { TypeRole } from '@/design/tokens';

export { FOCUS_RING_PX, TOUCH_TARGET_PX } from '@/design/tokens';

/** One step of the declared scale, by index. Nothing outside it is legal. */
function space(step: 0 | 1 | 2 | 3 | 4 | 5 | 6): string {
  return `${SPACE[step]}px`;
}

/**
 * A typographic role, AS LONGHANDS. NEVER the `font` shorthand (F-SPEC-018-V1).
 *
 * The shorthand said the same four things in less room and did a fifth one it
 * never mentions: `font` RESETS every other font property to its initial value
 * — `font-variant-numeric` and `font-feature-settings` among them. So the rule
 * that carries ADR-013 §3 was being undone by every later rule that named a
 * role, and the digits of the scoreboard came out tabular ONLY BECAUSE `--mono`
 * is monospaced. Measured in the browser: with the shorthand,
 * `font-variant-numeric` computed `normal` on the three cells that carry digits,
 * and `111111` / `000000` measure 42.66 and 58.59 px the day one of them moves
 * to `--sans`.
 *
 * THE FIX IS TO STOP EMITTING THE RESET, not to re-emit the two properties
 * after it. Re-ordering repairs the two properties we happen to know about
 * today, and only for as long as every future rule remembers the order — the
 * shorthand resets eight more it never names. Longhands remove the construct
 * that resets, so no rule of this sheet can switch off a font property it does
 * not mention, in any order. It costs a few bytes of CSS and it buys that the
 * guarantee stops depending on discipline.
 */
function role(name: keyof typeof TYPE): string {
  const declared: TypeRole = TYPE[name];
  const lines = [
    `font-weight:${declared.weight}`,
    `font-size:${declared.px}px`,
    `line-height:${declared.leading}`,
    `font-family:var(--${declared.family})`,
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
export const BOARD_STYLESHEET = `
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

main{max-width:${MEASURE.pageMaxRem}rem;margin:0 auto}

h1{margin:0 0 ${space(2)};${role('team')}font-size:${TYPE.score.px}px}
h2{margin:${space(4)} 0 ${space(1)};${role('eyebrow')}color:var(--brand)}
p{margin:0 0 ${space(1)}}

.soft{color:var(--fg-muted)}

/*
 * ADR-013 §3: every digit of a scoreboard, an hour or an age is tabular. THIS
 * DECLARATION SURVIVES THE RULES BELOW because role() emits longhands and no
 * rule of this sheet carries a font shorthand — see role(), which explains why.
 * It is the ONLY thing that makes the digits align: the family is not the
 * mechanism, and case 14 of tests/board/style.test.ts measures it in a
 * PROPORTIONAL face so that --mono cannot answer for it.
 *
 * (No backticks in this comment, and it is not a style: they live inside a
 * template literal, so one of them ends the stylesheet.)
 */
.num,.score,.instant,td,th{
  font-family:var(--mono);
  font-variant-numeric:tabular-nums;
  font-feature-settings:'tnum' 1;
}
.score{${role('score')}color:var(--fg)}
.instant{${role('status')}color:var(--fg-muted)}

/*
 * THE FOUR QUALIFIERS. provisional and confirmado carry THE SAME colour — the
 * main one — and both carry their label, confirmado WITHOUT ANY ADDITIONAL
 * MARK; the other two carry a colour because they are conditions and not the
 * normal case, and they carry their label too (ADR-026 §2, ADR-027 §8,
 * ADR-013 §2 and §6).
 */
.q-provisional,.q-confirmado{color:var(--fg)}
.q-pendente-de-confirmar{color:var(--amber)}
.q-sen-sinal{color:var(--alert)}

/* The five states. live is the ember of ADR-013 §1, and nothing else is. */
.s-live{color:var(--accent-live)}
.s-postponed,.s-suspended{color:var(--amber)}
.s-scheduled,.s-finished{color:var(--fg-muted)}

/*
 * THE PAGE'S CLOCK — the TRANSPORT's, and it lives OUTSIDE THE TABLE
 * (ADR-027 §4). Neutral tokens only: no state token and no qualifier token
 * touches this rule, ever.
 */
.transport{
  border:${HAIRLINE_PX}px solid var(--line-strong);
  border-radius:${RADIUS.md}px;
  padding:${space(1)};
  margin:0 0 ${space(2)};
  background:var(--bg-elevated);
  color:var(--fg-muted);
  ${role('status')}
}

/* The degradation notice. Visible with no interaction, before the table. */
.notice{
  border:${HAIRLINE_PX}px solid var(--line);
  border-radius:${RADIUS.lg}px;
  padding:${space(1)} ${space(2)};
  margin:0 0 ${space(2)};
  background:var(--bg-elevated);
  color:var(--fg);
}
.notice h2{margin:0 0 ${space(0)}}

/* The one wide element scrolls INSIDE ITS OWN CONTAINER (ADR-025 §3.2). */
.scroller{overflow-x:auto}

/*
 * THE TABLE IS AS WIDE AS ITS CONTENT AND SCROLLS INSIDE .scroller, and the
 * team cell NEVER ellipses: a canonical RFGF name is not a string to be
 * chopped (dominio.md, CA-10.2). ADR-025 §3.2 is satisfied all the same: what
 * scrolls is the container, never the body.
 */
table{border-collapse:collapse;width:max-content;min-width:100%}
th,td{padding:${space(1)};border-bottom:${HAIRLINE_PX}px solid var(--line-row);text-align:left;white-space:nowrap;overflow-wrap:normal}
th{${role('eyebrow')}color:var(--fg-dim);background:var(--bg-step)}
td{${role('team')}color:var(--fg)}
.team{font-family:var(--sans)}

/* ADR-025 §3, INTACT: every interactive control is at least 44 x 44 px. */
a,summary{min-height:${TOUCH_TARGET_PX}px}

a{
  display:inline-flex;
  align-items:center;
  min-width:${TOUCH_TARGET_PX}px;
  padding:0 ${space(0)};
  color:var(--brand);
  text-decoration:none;
}
a:hover{color:var(--fg);text-decoration:underline}

/*
 * ADR-025 §2.1, INTACT and now permanent (ADR-026 §5). A real outline on the
 * perimeter, never a change of background or of text colour, and the browser's
 * own ring is never switched off anywhere in this sheet. The ring is --fg and
 * not --brand on purpose: the brand green already means brand, link, heading
 * and active nav, and a colour that means six things means none (ADR-026 §2.3).
 * --fg over --bg is 18.4:1, far above the 3:1 the rule asks — the test
 * CALCULATES it.
 */
:focus-visible{
  outline:${FOCUS_RING_PX}px solid var(--fg);
  outline-offset:${FOCUS_RING_PX}px;
  border-radius:${RADIUS.sm}px;
}

nav{margin-top:${space(4)}}
ul{margin:0;padding:0;list-style:none}
`;
