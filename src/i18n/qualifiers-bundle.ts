/**
 * The contract of the qualifier namespace (SPEC-018 CA-13.4).
 *
 * ITS OWN NAMESPACE, EXTRACTED AND NOT COPIED. The four qualifiers already
 * lived in `gl.qualifiers` and `es.qualifiers` since SPEC-017; what was
 * missing was a CONTRACT and a RESOLVER of their own, so that a second
 * interface can read them without importing the panel's bundle
 * (`src/i18n/admin.ts`). The scoreboard is that second interface.
 *
 * It is the shape `statuses-bundle.ts` already has, and for the same reason
 * written there: keeping the four words inside `AdminBundle` would guarantee
 * that one day the panel and the scoreboard say different things about the
 * same qualifier, which is exactly what `dominio.md` exists to prevent.
 *
 * The KEYS are `MATCH_QUALIFIERS` (`src/model/qualifier.ts`) and the type says
 * so, so adding a fifth qualifier and forgetting a language is a
 * `npm run typecheck` failure and not a screen with a hole in it.
 *
 * The VALUES are the ones `docs/fundacion/dominio.md` registers and they are
 * NOT TOUCHED by this extraction: not one literal changes, and the panel's
 * i18n case stays green without touching an assertion (CA-13.4).
 *
 * THE IDENTIFIER IS NOT TRANSLATED: `MATCH_QUALIFIERS` stays in galego
 * (SPEC-001 CA-8). Two of the four are identical in both languages —
 * *Provisional* and *Confirmado* — and that is correct, not something to fix.
 *
 * LEXICAL BARRIER (ADR-027 §4.4, SPEC-018 CA-8.4): the words *actualizar* and
 * *actualizado* may NOT appear in any value of this namespace, and *sinal* /
 * *señal* live ONLY here — never in the scoreboard's own namespace. Two
 * absences, one case, and a whole class of error closed: a match with no
 * signal is a fact of the match, and a page that could not refresh is a fact
 * of the page.
 */
import type { MatchQualifier } from '../model/qualifier';

export type QualifiersBundle = Readonly<Record<MatchQualifier, string>>;
