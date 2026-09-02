/**
 * The declared configuration of the deployment (SPEC-012, ADR-019 §3;
 * SPEC-011 for the season).
 *
 * THE LIST OF MEASUREMENT WINDOWS IS BORN EMPTY, AND THAT IS THE DELIVERABLE:
 * with nothing declared here, the cron asks for NOTHING, calendar loaded or
 * not. That is what makes «es medición, no producción» (RN-11) true in the
 * shape of the code: the deployment is structurally incapable of polling the
 * whole season (ADR-008 §5.2), and the answer to «is this still measurement?»
 * stops depending on the operator's discipline.
 *
 * ADDING AN ENTRY IS AN ACT OF THE OPERATOR, a diff with its motive — like an
 * entry of `ALLOWED_PACKAGES` (ADR-016 §3.2 by analogy) — and it has TWO
 * WRITTEN PRECONDITIONS (SPEC-012 §Fuera de alcance, ADR-020 §3):
 *
 *   1. the ruling of `sdd-legal-datos` on capturing a whole matchday of
 *      `ceroacero.es` (the open question of SPEC-008 notas §7), and
 *   2. the purge date of the matchday's archive, WRITTEN BEFORE the matchday
 *      runs, beside the entry and in the ledger of the spec that governs the
 *      measurement. A matchday whose purge date is not written is not
 *      declared. Without the acknowledgement of the previous purge, the next
 *      matchday is not declared either.
 *
 * Each interval is `[from, to)` over kickoffs, ISO 8601 UTC strings
 * (ADR-006), with its motive («jornada N de medición, cargada el …»).
 *
 * THE ACTIVE SEASON IS DECLARED, NEVER DEDUCED (SPEC-011: «the season is
 * handed in by the caller's configuration»): it is what the tick gives the
 * alias resolver, and deducing it from the base or the source would reopen
 * that decision through the back door (ADR-019, alternatives).
 */
import type { MeasurementWindow } from './windows';

/** The season the resolver works against. RFGF spelling, `YYYY/YY`. */
export const ACTIVE_SEASON = '2026/27';

/**
 * The declared measurement windows. EMPTY on purpose: the first real entry
 * waits for the two preconditions above, and adding it is a reviewed diff.
 */
export const MEASUREMENT_WINDOWS: readonly MeasurementWindow[] = [];
