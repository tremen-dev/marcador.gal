/**
 * HOW MANY AUTOMATIC SOURCES THIS PROJECT HAS — DERIVED, NEVER TYPED
 * (SPEC-018 CA-13.8).
 *
 * The degradation notice says «there is ONE automatic source, so the normal
 * thing is that the scoreboard is provisional and arrives late». That sentence
 * is an assertion about our own activity, made on a public page, and the motive
 * for deriving its number has a date: `lapreferente.com` IS VERIFIED ON
 * 2026-09-06 (row 1 of the calendar of commitments), two days before the
 * deployment. A PUBLIC NOTICE THAT WAS FALSE ABOUT OUR OWN ACTIVITY WOULD BE
 * BORN FALSE ON ITS FIRST DAY.
 *
 * So the number comes from `DEFAULT_SOURCES` (`src/ingest/sources.ts`) — the
 * one place where «what this project can capture today» is written — and not
 * from a constant somebody has to remember to update. Declaring a second
 * source flips the notice to its plural literal, and the named case of
 * CA-13.8 that asserts the notice tracks the registry is what makes that a
 * visible change instead of a silent lie.
 *
 * THE COST, WRITTEN: this puts the source registry on the import graph of a
 * public page. It is safe and a case asserts it (CA-1.4): the registry reaches
 * NO exit door — `src/polite/http.ts` is not on its graph — so the screen still
 * asks nobody for anything, and the only URL it fetches is a relative path of
 * its own origin. What it buys is that the sentence cannot drift from the fact.
 */
import { DEFAULT_SOURCES } from '@/ingest/sources';

/** How many automatic sources are declared today. One (ADR-008 §1). */
export const AUTOMATIC_SOURCES: number = DEFAULT_SOURCES.length;
