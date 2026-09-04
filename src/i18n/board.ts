/**
 * Resolving a language to the scoreboard's bundle — and the TYPE that makes
 * D-2 a compile error instead of a habit (SPEC-018 CA-13.1, CA-13.2).
 *
 * THE LANGUAGE COMES FROM THE URL, NEVER FROM THE CLIENT (ADR-027 §3.a):
 * `/marcador` is galego and `/es/marcador` is castellano, exactly as the public
 * site and the panel do it. No module of `src/board/` or of `src/api/` reads
 * `Accept-Language`, and a case asserts it — inferring the language from the
 * client would empty D-2 of content WITHOUT ANYBODY SEEING IT, and it would
 * also make the response depend on who asks, which is what forbids the shared
 * cache of CA-7.5.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * `BoardText`: A BRANDED STRING, the same mechanism as `AdminText` and
 * `BotText`.
 *
 * A scan for prose cannot tell `Confirmar` from an identifier. So the markup
 * surface takes `BoardText` and nothing else, and the ONLY producer of a
 * `BoardText` is this module — `asBoardText` is not exported, and everything
 * that leaves here comes from a bundle. A visible literal written inside
 * `src/board/` or `src/api/` does not fail a scan: IT DOES NOT COMPILE.
 */
import { es } from './es';
import { gl } from './gl';
import { qualifiersBundle } from './qualifiers';
import { statusesBundle } from './statuses';
import type { BoardBundle } from './board-bundle';
import type { SiteLocale } from './site-bundle';
import type { MatchStatus } from '../model/match';
import type { MatchQualifier } from '../model/qualifier';

/**
 * The brand. `declare const` emits no runtime binding — the symbol exists only
 * for the type — so nothing of this survives compilation.
 */
declare const BOARD_TEXT: unique symbol;

/** A string that came out of an i18n bundle. There is no other way to get one. */
export type BoardText = string & { readonly [BOARD_TEXT]: true };

/** The bundle of one language, every value already branded. */
export type BoardTextBundle = Readonly<Record<keyof BoardBundle, BoardText>>;

/** NOT EXPORTED, and that is the whole mechanism of CA-13.2. */
function asBoardText(value: string): BoardText {
  return value as BoardText;
}

/**
 * A structural template that is not text in any language: digits and one
 * hyphen. It lives HERE and not in `BoardBundle` for the same two reasons
 * `ADMIN_SCORE_LINE` does in `admin.ts` — keeping it out leaves the parity case
 * honest, and putting it in `src/board/` would need a cast, which is the one
 * escape hatch CA-13.2 closes.
 *
 * The separator is a plain hyphen, coherent with tabular digits (ADR-013 §3),
 * and the order is home - away.
 */
export const BOARD_SCORE_LINE: BoardText = asBoardText('{home}-{away}');

/**
 * The third structural template: a bare datum. It carries a canonical RFGF
 * name, an hour or a number into the markup — none of which is text in any
 * language, and all of which the markup surface still has to receive as
 * `BoardText` for CA-13.2 to hold.
 */
export const BOARD_VALUE: BoardText = asBoardText('{value}');

/** Galego first: it is the default (D-2). */
export const BOARD_LOCALES: readonly SiteLocale[] = ['gl', 'es'];

/** The language of the scoreboard when no prefix says otherwise (D-2). */
export const DEFAULT_BOARD_LOCALE: SiteLocale = 'gl';

const BUNDLES: Record<SiteLocale, BoardBundle> = { gl: gl.board, es: es.board };

/** The raw contract of a language. Used by the parity tests and nothing else. */
export function rawBoardBundle(locale: SiteLocale): BoardBundle {
  return BUNDLES[locale];
}

function brand(bundle: BoardBundle): BoardTextBundle {
  const branded: Record<string, BoardText> = {};
  for (const [key, value] of Object.entries(bundle)) branded[key] = asBoardText(value);
  return branded as BoardTextBundle;
}

const BRANDED: Record<SiteLocale, BoardTextBundle> = { gl: brand(gl.board), es: brand(es.board) };

/** The bundle every module of `src/board/` reads its text from. */
export function boardBundle(locale: SiteLocale): BoardTextBundle {
  return BRANDED[locale];
}

/**
 * The visible form of a match status, from the SHARED namespace (CA-13.4). The
 * scoreboard does not keep its own copy of these five words, and `live` is
 * *En xogo* — never *Directo* (`dominio.md`, ADR-026 §4.4).
 */
export function boardStatus(locale: SiteLocale, status: MatchStatus): BoardText {
  return asBoardText(statusesBundle(locale)[status]);
}

/**
 * The visible form of a qualifier, from the SHARED namespace (CA-13.4), with
 * the COMPLETE literal of `dominio.md` — never an abbreviation and never a
 * glyph (ADR-027 §8.1).
 */
export function boardQualifier(locale: SiteLocale, qualifier: MatchQualifier): BoardText {
  return asBoardText(qualifiersBundle(locale)[qualifier]);
}

/**
 * Interpolates `{placeholders}`. The values are plain strings on purpose: what
 * gets interpolated are CANONICAL NAMES of the RFGF and numbers, and a
 * canonical name is never translated in either language (`dominio.md`). A
 * placeholder with no value is left as written, because silently emptying it
 * would hide the defect.
 */
export function fillBoard(
  template: BoardText,
  values: Readonly<Record<string, string>>,
): BoardText {
  return asBoardText(
    template.replaceAll(/\{([a-zA-Z_]+)\}/g, (whole, name: string) => values[name] ?? whole),
  );
}

/** A number as text of the interface. Digits are not prose in any language. */
export function boardDigits(value: number): BoardText {
  return asBoardText(`${value}`);
}

export type { BoardBundle };
