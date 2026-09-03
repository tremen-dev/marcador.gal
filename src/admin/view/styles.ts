/**
 * The panel's OWN stylesheet — and it does not share one line with
 * `src/app/globals.css` nor with `docs/diseno/` (ADR-025 §4, SPEC-017 CA-10).
 *
 * IT LIVES IN A FILE OF ITS OWN, IT DECLARES ITS OWN VALUES, AND IT IS REACHED
 * ONLY FROM THE PANEL'S ROUTES. Nothing here is imported from, derived from or
 * copied out of the public site's stylesheet or the frozen design system:
 *
 *   * `src/app/globals.css` IS NOT EDITED and IS NOT REACHED. The panel's
 *     routes are `route.ts` handlers, not pages, so no root layout wraps them
 *     and the site's stylesheet never loads on this document. That is not a
 *     detail of taste — entry 6 of EPIC-004's inventory says the public site
 *     and the scoreboard «no son variante y base, son dos bases opuestas» and
 *     that «hoy no chocan porque NO COMPARTEN UNA LÍNEA DE CSS». Keeping it
 *     that way is what leaves the conflict cheap the day EPIC-004 thaws.
 *   * NOT ONE VALUE OF `docs/diseno/` IS COPIED (ADR-025 §4.3). It is frozen
 *     WITH A KNOWN CONTRADICTION INSIDE — entry 1 of the inventory: it paints
 *     the dominant state as the exception — and copying its numbers would be
 *     inheriting that with code on top.
 *
 * WHAT IT DOES INHERIT, because it is rule and not style (ADR-025 §4, last
 * paragraph): ADR-013 entire. §2 (no state and no qualifier is told apart by
 * colour alone — here NOTHING is told apart by colour at all, which is the
 * strongest form of complying), §3 (tabular digits), §4 and §5 (no images, no
 * crest, no club palette), §6 (≥ 4.5:1 for anything that carries a datum).
 *
 * AND THE FLOOR OF ADR-025 §2 AND §3, WHICH IS A FLOOR AND NOT A DESIGN:
 *
 *   * `:focus-visible` with an outline of at least `FOCUS_RING_PX` and a
 *     contrast of at least 3:1 against the surface it is drawn on, and the
 *     browser's own ring is never switched off without one;
 *   * every interactive control is at least `TOUCH_TARGET_PX` square;
 *   * text inputs are at least `INPUT_FONT_PX`, because below 16 px Safari on
 *     iOS zooms on focus and throws the screen out — on a phone, on the touch
 *     line, correcting a scoreboard;
 *   * nothing scrolls the body sideways at 360 px: the wide thing here is the
 *     board, and it scrolls INSIDE ITS OWN CONTAINER.
 *
 * THE PANEL IS GOING TO BE UGLY, AND THAT IS CORRECT (ADR-025 §Consecuencias).
 * A floor of accessibility is not a design, and entry 5 of EPIC-004's
 * inventory keeps its trigger: the thaw.
 */

/** ADR-025 §3. A named constant in ONE place; revising it is a diff. */
export const TOUCH_TARGET_PX = 44;

/** ADR-025 §2.1. The focus ring is at least this thick. */
export const FOCUS_RING_PX = 2;

/** ADR-025 §3.1. Below this, Safari on iOS zooms when a field takes focus. */
export const INPUT_FONT_PX = 16;

/**
 * The palette, declared here and nowhere else. Four values, chosen for
 * contrast and for nothing else — there is no identity in them and there is
 * not meant to be (ADR-025 §1: this ADR does not choose a palette).
 *
 * Measured against `#ffffff` (the surface): `#101010` is 19.8:1 (ADR-013 §6
 * asks ≥ 4.5:1 for anything that carries a datum), `#575757` is 7.0:1, and the
 * focus ring `#0b3d91` is 11.1:1 — far above the 3:1 of ADR-025 §2.1. The test
 * CALCULATES these, it does not take this comment's word for them.
 */
export const PANEL_COLORS = {
  surface: '#ffffff',
  ink: '#101010',
  inkSoft: '#575757',
  rule: '#b4b4b4',
  focus: '#0b3d91',
} as const;

/**
 * The whole stylesheet, as text. It is served inline in the panel's document
 * and from nowhere else, which is «alcanzable solo desde sus propias rutas»
 * (ADR-025 §4.2) in its strictest form: there is no URL that serves it.
 */
export const PANEL_STYLESHEET = `
*, *::before, *::after { box-sizing: border-box; }

html { -webkit-text-size-adjust: 100%; color-scheme: light; }

body {
  margin: 0;
  padding: 1rem 0.75rem 4rem;
  background: ${PANEL_COLORS.surface};
  color: ${PANEL_COLORS.ink};
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  font-size: 1rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

h1 { margin: 0 0 1rem; font-size: 1.25rem; font-weight: 600; }
h2 { margin: 1.75rem 0 0.5rem; font-size: 1rem; font-weight: 600; }
h3 { margin: 1.25rem 0 0.375rem; font-size: 0.9375rem; font-weight: 600; }
p { margin: 0 0 0.75rem; }

.soft { color: ${PANEL_COLORS.inkSoft}; }

/* ADR-013 §3: every digit of a scoreboard, an hour or a minute is tabular. */
.num, .score, .instant, td, th, input[type="number"] {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
}

/* The one wide thing scrolls INSIDE ITS OWN CONTAINER (ADR-025 §3.2). */
.scroller { overflow-x: auto; }

table { border-collapse: collapse; width: 100%; font-size: 0.9375rem; }
th, td { padding: 0.5rem 0.5rem; border-bottom: 1px solid ${PANEL_COLORS.rule}; text-align: left; }
th { font-weight: 600; }

/* ADR-025 §3: every interactive control is at least 44 x 44 px. */
a, button, input, select, textarea, summary {
  min-height: ${TOUCH_TARGET_PX}px;
}

a {
  display: inline-flex;
  align-items: center;
  min-width: ${TOUCH_TARGET_PX}px;
  padding: 0 0.25rem;
  color: ${PANEL_COLORS.ink};
  text-decoration: underline;
}

button {
  min-width: ${TOUCH_TARGET_PX}px;
  padding: 0.5rem 0.875rem;
  border: 1px solid ${PANEL_COLORS.ink};
  background: ${PANEL_COLORS.surface};
  color: ${PANEL_COLORS.ink};
  font: inherit;
  cursor: pointer;
}

label { display: block; margin: 0.75rem 0 0.25rem; font-size: 0.9375rem; }

input, select, textarea {
  width: 100%;
  max-width: 22rem;
  padding: 0.5rem;
  border: 1px solid ${PANEL_COLORS.ink};
  background: ${PANEL_COLORS.surface};
  color: ${PANEL_COLORS.ink};
  /* ADR-025 §3.1: never below 16 px, or iOS zooms on focus. */
  font-size: ${INPUT_FONT_PX}px;
  font-family: inherit;
}

textarea { min-height: 5rem; }

/*
 * ADR-025 §2.1 — the focus ring: a real outline on the perimeter, never a
 * change of background or of text colour. The browser's own ring is never
 * switched off anywhere in this sheet, with or without a replacement.
 */
:focus-visible {
  outline: ${FOCUS_RING_PX}px solid ${PANEL_COLORS.focus};
  outline-offset: ${FOCUS_RING_PX}px;
}

fieldset { margin: 0 0 1rem; padding: 0.75rem; border: 1px solid ${PANEL_COLORS.rule}; }
legend { padding: 0 0.25rem; font-weight: 600; }

.row { border-top: 1px solid ${PANEL_COLORS.rule}; padding: 0.75rem 0; }
.notice { border: 1px solid ${PANEL_COLORS.ink}; padding: 0.75rem; margin: 0 0 1rem; }
`;
