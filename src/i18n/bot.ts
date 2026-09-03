/**
 * Resolving a language to the bot's bundle — and the TYPE that makes D-2 a
 * compile error instead of a habit (SPEC-015 CA-12.1, CA-12.2).
 *
 * THE LANGUAGE NEVER COMES FROM THE CLIENT (ADR-022 §8). Telegram does not
 * offer galego, so almost every galician correspondent arrives with
 * `language_code: 'es'`; inferring the language from it would empty D-2 of
 * content WITHOUT ANYBODY SEEING IT, because the result — everyone in
 * castellano — looks like it works. The language is a stored, explicit
 * preference per correspondent, galego by default. `language_code` is not even
 * in the whitelist of what gets archived (CA-3.1), so it does not exist inside
 * the process.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * `BotText`: WHY A BRANDED STRING AND NOT A CONVENTION.
 *
 * CA-12.2 asks that no visible string live inside `src/bot/`, and adds the
 * sentence that decides the mechanism: «un literal en galego impecable escrito
 * en `src/bot/` es incumplimiento de D-2 igual». A scan for prose cannot say
 * that — `Confirmar` and `Marcador` are ASCII words with no accent and no
 * space, indistinguishable from an identifier.
 *
 * So the outbound surface takes `BotText` and nothing else, and the ONLY
 * producer of a `BotText` is this module: `asBotText` is not exported, and
 * everything that leaves here comes from the bundle. A literal written in
 * `src/bot/` does not fail a scan — IT DOES NOT COMPILE.
 *
 * The two derived operations stay here for the same reason: `fill` interpolates
 * into a `BotText` and gives back a `BotText`, and `joinLines` composes them.
 * Neither can manufacture one out of nothing.
 */
import { es } from './es';
import { gl } from './gl';
import { statusesBundle } from './statuses';
import type { BotBundle, BotLocale } from './bot-bundle';
import type { MatchStatus } from '../model/match';

/**
 * The brand. `declare const` emits no runtime binding — the symbol exists only
 * for the type — so nothing of this survives compilation.
 */
declare const BOT_TEXT: unique symbol;

/** A string that came out of an i18n bundle. There is no other way to get one. */
export type BotText = string & { readonly [BOT_TEXT]: true };

/** The bundle of one language, every value already branded. */
export type BotTextBundle = Readonly<Record<keyof BotBundle, BotText>>;

/** NOT EXPORTED, and that is the whole mechanism of CA-12.2. */
function asBotText(value: string): BotText {
  return value as BotText;
}

/**
 * TWO STRUCTURAL TEMPLATES THAT ARE NOT TEXT IN ANY LANGUAGE.
 *
 * `{label}: {value}` and `{home} - {away}` are punctuation and placeholders,
 * identical in galego and in castellano — the ruling of `sdd-lingua` writes
 * `cardMatch` as literally `{home} - {away}` in both. They live HERE, and not
 * in `BotBundle`, for two reasons: keeping them out leaves the parity case of
 * CA-12.1 honest instead of forcing it to declare two keys as legitimately
 * identical; and putting them in `src/bot/` would need a cast, which is the
 * one escape hatch CA-12.2 exists to close.
 *
 * The separator of the scoreboard is a plain hyphen with no spaces around the
 * digits, in both languages, coherent with tabular numbers (D-8, ADR-013,
 * ruling §5.j), and the order is home - away.
 */
export const LABELLED_LINE: BotText = asBotText('{label}: {value}');
export const MATCH_LINE: BotText = asBotText('{home} - {away}');

/** Galego first: it is the default (D-2). */
export const BOT_LOCALES: readonly BotLocale[] = ['gl', 'es'];

/** The language of a correspondent with no stored preference (CA-11.4). */
export const DEFAULT_BOT_LOCALE: BotLocale = 'gl';

const BUNDLES: Record<BotLocale, BotBundle> = { gl: gl.bot, es: es.bot };

/** The raw contract of a language. Used by the parity tests and by nothing else. */
export function rawBotBundle(locale: BotLocale): BotBundle {
  return BUNDLES[locale];
}

function brand(bundle: BotBundle): BotTextBundle {
  const branded: Record<string, BotText> = {};
  for (const [key, value] of Object.entries(bundle)) branded[key] = asBotText(value);
  return branded as BotTextBundle;
}

const BRANDED: Record<BotLocale, BotTextBundle> = { gl: brand(gl.bot), es: brand(es.bot) };

/** The bundle every module of `src/bot/` reads its text from. */
export function botBundle(locale: BotLocale): BotTextBundle {
  return BRANDED[locale];
}

/**
 * The visible form of a match status, from the SHARED namespace (CA-12.5).
 * The bot does not keep its own copy of these five words.
 */
export function botStatus(locale: BotLocale, status: MatchStatus): BotText {
  return asBotText(statusesBundle(locale)[status]);
}

/**
 * Interpolates `{placeholders}`. The values are plain strings on purpose: what
 * gets interpolated are CANONICAL NAMES of the RFGF and numbers, and a
 * canonical name is never translated in either language (`dominio.md`,
 * CA-12.6). A placeholder with no value is left as written, because silently
 * emptying it would hide the defect.
 */
export function fill(template: BotText, values: Readonly<Record<string, string>>): BotText {
  return asBotText(
    template.replaceAll(/\{([a-zA-Z_]+)\}/g, (whole, name: string) => values[name] ?? whole),
  );
}

/** Composes several branded lines into one message. Density first (D-8). */
export function joinLines(...lines: readonly BotText[]): BotText {
  return asBotText(lines.join('\n'));
}

export type { BotBundle, BotLocale };
