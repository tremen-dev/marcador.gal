/**
 * Resolving a language to the panel's bundle — and the TYPE that makes D-2 a
 * compile error instead of a habit (SPEC-017 CA-9.2, CA-9.3).
 *
 * THE LANGUAGE COMES FROM THE URL, NEVER FROM THE CLIENT (ADR-022 §8 by
 * analogy, CA-9.2): `/admin` is galego and `/es/admin` is castellano, exactly
 * as the public site does it (`src/i18n/site.ts`). No module of `src/admin/`
 * reads `Accept-Language`, and a case asserts it — inferring the language from
 * the client would empty D-2 of content WITHOUT ANYBODY SEEING IT, because the
 * result looks like it works.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * `AdminText`: WHY A BRANDED STRING AND NOT A CONVENTION.
 *
 * The same mechanism as `BotText`, and for the same reason: a scan for prose
 * cannot tell `Confirmar` from an identifier. So the markup surface takes
 * `AdminText` and nothing else, and the ONLY producer of an `AdminText` is
 * this module — `asAdminText` is not exported, and everything that leaves here
 * comes from a bundle. A visible literal written inside `src/admin/` does not
 * fail a scan: IT DOES NOT COMPILE.
 *
 * The derived operations stay here for the same reason: `fill` interpolates
 * into an `AdminText` and gives back an `AdminText`, and `joinText` composes
 * them. Neither can manufacture one out of nothing.
 */
import { es } from './es';
import { gl } from './gl';
import { qualifiersBundle } from './qualifiers';
import { statusesBundle } from './statuses';
import type { AdminBundle, AdminLocale } from './admin-bundle';
import type { MatchStatus } from '../model/match';
import type { MatchQualifier } from '../model/qualifier';

/**
 * The brand. `declare const` emits no runtime binding — the symbol exists only
 * for the type — so nothing of this survives compilation.
 */
declare const ADMIN_TEXT: unique symbol;

/** A string that came out of an i18n bundle. There is no other way to get one. */
export type AdminText = string & { readonly [ADMIN_TEXT]: true };

/** The bundle of one language, every value already branded. */
export type AdminTextBundle = Readonly<Record<keyof AdminBundle, AdminText>>;

/** NOT EXPORTED, and that is the whole mechanism of CA-9.3. */
function asAdminText(value: string): AdminText {
  return value as AdminText;
}

/**
 * A structural template that is not text in any language: `{home} - {away}`,
 * punctuation and placeholders, identical in galego and in castellano. It
 * lives HERE, and not in `AdminBundle`, for the same two reasons `MATCH_LINE`
 * does in `bot.ts`: keeping it out leaves the parity case honest, and putting
 * it in `src/admin/` would need a cast — the one escape hatch CA-9.3 closes.
 *
 * The separator of the scoreboard is a plain hyphen, coherent with tabular
 * digits (D-8, ADR-013 §3), and the order is home - away.
 */
export const ADMIN_MATCH_LINE: AdminText = asAdminText('{home} - {away}');

/** `{home}-{away}` for the scoreboard cell itself. Digits and one hyphen. */
export const ADMIN_SCORE_LINE: AdminText = asAdminText('{home}-{away}');

/**
 * The third structural template: a bare datum. It is what carries an instant,
 * an identifier or a canonical name of the RFGF into the markup — none of
 * which is text in any language, and all of which the markup surface still has
 * to receive as `AdminText` for CA-9.3 to hold.
 */
export const ADMIN_VALUE: AdminText = asAdminText('{value}');

/** Galego first: it is the default (D-2). */
export const ADMIN_LOCALES: readonly AdminLocale[] = ['gl', 'es'];

/** The language of the panel when no prefix says otherwise (D-2). */
export const DEFAULT_ADMIN_LOCALE: AdminLocale = 'gl';

const BUNDLES: Record<AdminLocale, AdminBundle> = { gl: gl.admin, es: es.admin };

/** The raw contract of a language. Used by the parity tests and nothing else. */
export function rawAdminBundle(locale: AdminLocale): AdminBundle {
  return BUNDLES[locale];
}

function brand(bundle: AdminBundle): AdminTextBundle {
  const branded: Record<string, AdminText> = {};
  for (const [key, value] of Object.entries(bundle)) branded[key] = asAdminText(value);
  return branded as AdminTextBundle;
}

const BRANDED: Record<AdminLocale, AdminTextBundle> = { gl: brand(gl.admin), es: brand(es.admin) };

/** The bundle every module of `src/admin/` reads its text from. */
export function adminBundle(locale: AdminLocale): AdminTextBundle {
  return BRANDED[locale];
}

/**
 * The visible form of a match status, from the SHARED namespace (CA-9.5). The
 * panel does not keep its own copy of these five words.
 */
export function adminStatus(locale: AdminLocale, status: MatchStatus): AdminText {
  return asAdminText(statusesBundle(locale)[status]);
}

/**
 * The visible form of a qualifier, in BOTH languages (CA-9.6).
 *
 * The panel is the first artefact of the real system that shows a person a
 * qualifier, which is the trigger SPEC-015 left written. The gate of
 * 2026-09-03 decided they ARE translated, and `sdd-arquitecto` wrote the two
 * columns in `docs/fundacion/dominio.md` the same day: the literals come from
 * there and are not invented here.
 *
 * SINCE SPEC-018 (CA-13.4) THEY COME THROUGH `src/i18n/qualifiers.ts`, the
 * namespace's own resolver, extracted so that the scoreboard does not have to
 * import the panel's bundle to name a qualifier. NOT ONE LITERAL CHANGED and
 * the panel's i18n case stays green without touching an assertion.
 *
 * TWO OF THE FOUR ARE IDENTICAL IN BOTH
 * LANGUAGES AND THAT IS CORRECT — *Provisional* and *Confirmado* — and it is
 * not something to «fix». THE IDENTIFIER IS NOT TRANSLATED: `MATCH_QUALIFIERS`
 * stays in galego (SPEC-001 CA-8).
 */
export function adminQualifier(locale: AdminLocale, qualifier: MatchQualifier): AdminText {
  return asAdminText(qualifiersBundle(locale)[qualifier]);
}

/**
 * Interpolates `{placeholders}`. The values are plain strings on purpose: what
 * gets interpolated are CANONICAL NAMES of the RFGF and numbers, and a
 * canonical name is never translated in either language (`dominio.md`). A
 * placeholder with no value is left as written, because silently emptying it
 * would hide the defect.
 */
export function fill(template: AdminText, values: Readonly<Record<string, string>>): AdminText {
  return asAdminText(
    template.replaceAll(/\{([a-zA-Z_]+)\}/g, (whole, name: string) => values[name] ?? whole),
  );
}

/** Composes several branded fragments into one. Density first (D-8). */
export function joinText(...parts: readonly AdminText[]): AdminText {
  return asAdminText(parts.join(' '));
}

/** A number as text of the interface. Digits are not prose in any language. */
export function digits(value: number): AdminText {
  return asAdminText(`${value}`);
}

export type { AdminBundle, AdminLocale };
