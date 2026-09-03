/**
 * The command set (SPEC-015 CA-12.3, CA-12.4; ruling of `sdd-lingua` §2).
 *
 * Telegram restricts a command to `a-z`, `0-9` and `_`, at most 32 characters:
 * NO ACCENTS AND NO `ñ`. None of the correct galego forms needs one, so the
 * restriction costs nothing here — `axuda` (RAG), not `ayuda` (castilianism)
 * and not `ajuda` (lusism).
 *
 * THE NAMES ARE NOT TEXT IN ANY LANGUAGE and stay here; their DESCRIPTIONS are
 * text a person reads in the client's menu, so they live in the bundle and are
 * registered for `gl` and `es` with `gl` as the default set (ADR-022 §8).
 *
 * AND THERE IS NO `/estado`, on purpose (ruling §2). *Estado* is a term of the
 * canonical model — `MatchStatus` — and the confirmation card shows it with
 * that very label. A command meaning «where is your conversation» would put two
 * senses of the same word on one screen. `/partidos` says what it does and
 * collides with nothing.
 */
import type { BotBundle } from '@/i18n/bot-bundle';

export interface BotCommand {
  /** As Telegram accepts it: no slash, `a-z0-9_` only. */
  readonly name: string;
  /** The bundle key of its menu description. Never a literal. */
  readonly description: keyof BotBundle;
}

/** What Telegram accepts as a command name. Asserted, not assumed. */
export const TELEGRAM_COMMAND_PATTERN = /^[a-z0-9_]{1,32}$/;

/**
 * The eight commands. `/start` is imposed by Telegram; the other seven are
 * §2 of the ruling plus the two ADR-023 §5 obliges — `/privacidade`, which
 * reprints the notice, and `/baixa`, which is the right to object made
 * exercisable in the act.
 */
export const BOT_COMMANDS: readonly BotCommand[] = [
  { name: 'start', description: 'cmdStart' },
  { name: 'axuda', description: 'cmdHelp' },
  { name: 'partidos', description: 'cmdMatches' },
  { name: 'cancelar', description: 'cmdCancel' },
  { name: 'lingua', description: 'cmdLanguage' },
  { name: 'privacidade', description: 'cmdPrivacy' },
  { name: 'baixa', description: 'cmdOptOut' },
  { name: 'parar', description: 'cmdStop' },
];

/** The command a message starts with, or `null`. `/axuda@bot` counts. */
export function commandOf(text: string): string | null {
  const match = /^\/([a-z0-9_]{1,32})(?:@[A-Za-z0-9_]+)?(?:\s|$)/.exec(text.trim());
  const name = match?.[1];
  if (name === undefined) return null;
  return BOT_COMMANDS.some((command) => command.name === name) ? name : null;
}
