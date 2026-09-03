/**
 * The outbound half: the ONLY module that knows Telegram's shapes
 * (ADR-022 §1, SPEC-015 §1).
 *
 * WHAT IT SENDS AND HOW, AND WHY THERE IS NO HTTP CLIENT HERE.
 *
 * Telegram lets a webhook answer the very `POST` it received with the method
 * call in the body of the response, which is what this module renders. That is
 * NOT a shortcut: this repository has a closed outbound frontier — one exit
 * door, `src/polite/http.ts` (ADR-014 §4), and a declared list of what may be
 * imported (SPEC-008 CA-2.3, SPEC-009 CA-1) — and the list's own header says
 * that «declaring a name whose job is to ask a third party for bytes» is what
 * still needs a HUMAN SIGNATURE. Adding `grammy` to it is exactly that, and
 * SPEC-015 CA-15.3 foresees exactly ONE new entry in that list, tied to a
 * criterion that is deferred (CA-5.5).
 *
 * So the reply path that needs NO new capability is the one that ships, and the
 * `grammy` adapter — needed for anything the bot would send OUTSIDE an update,
 * `setMyCommands` included — is deferred with its follow-up written
 * (F-SPEC-015-13). `TelegramApi` below is the port that adapter will implement;
 * everything else composes against it, never against a client.
 *
 * NOTHING THAT LEAVES HERE IS A PLAIN STRING. Every visible field is `BotText`,
 * which only `src/i18n/bot.ts` can produce, so a literal written anywhere in
 * `src/bot/` does not fail a scan — IT DOES NOT COMPILE (CA-12.2).
 */
import { BOT_COMMANDS } from './commands';
import { botBundle } from '@/i18n/bot';
import type { BotLocale, BotText } from '@/i18n/bot';

/**
 * Where a reply goes. It is TRANSIENT and it is never archived nor persisted:
 * `chat.id` is not in the whitelist of CA-3.1, and the pending proposal holds
 * no Telegram identifier at all (ADR-022 §4).
 */
export interface ChatRef {
  readonly chat_id: number;
}

/** One button of the inline keyboard. Its label is text, so it is `BotText`. */
export interface InlineButton {
  readonly label: BotText;
  /** The callback payload. Ours, opaque to the person, never text. */
  readonly data: string;
}

/** What the bot answers with. One message, one idea (D-8). */
export interface OutboundMessage {
  readonly chat: ChatRef;
  readonly text: BotText;
  /** Rows of buttons. Absent when the message asks for nothing. */
  readonly keyboard?: readonly (readonly InlineButton[])[] | undefined;
}

/** The acknowledgement Telegram expects for a pressed button. */
export interface OutboundCallbackAnswer {
  readonly callback_query_id: string;
  readonly text: BotText | null;
}

export type Outbound =
  | { readonly kind: 'message'; readonly message: OutboundMessage }
  | { readonly kind: 'callback'; readonly answer: OutboundCallbackAnswer }
  | { readonly kind: 'none' };

/** Nothing to say. The shape the negative frontiers of CA-1 answer with. */
export const NOTHING_TO_SEND: Outbound = { kind: 'none' };

export const message = (message: OutboundMessage): Outbound => ({ kind: 'message', message });

/**
 * The port the deferred `grammy` adapter will implement (F-SPEC-015-13). It is
 * declared HERE and now so the rest of the bot composes against a port and not
 * against a client, exactly as `src/bot/llm.ts` does for the model.
 */
export interface TelegramApi {
  send(outbound: Outbound): Promise<void>;
  /** Registers the command menu of one language set (CA-12.3). */
  setCommands(locale: BotLocale, commands: readonly CommandMenuEntry[]): Promise<void>;
}

export interface CommandMenuEntry {
  readonly command: string;
  readonly description: BotText;
}

/**
 * The `setMyCommands` payload of one language, WITH ITS DESCRIPTIONS OUT OF THE
 * BUNDLE (CA-12.3). Registered for `gl` and `es`, with `gl` as the default set
 * — the one Telegram serves when the client's language matches neither.
 */
export function commandMenu(locale: BotLocale): readonly CommandMenuEntry[] {
  const bundle = botBundle(locale);
  return BOT_COMMANDS.map((command) => ({
    command: command.name,
    description: bundle[command.description],
  }));
}

/** The bot's own card, also from the bundle and not from BotFather (CA-12.3). */
export function botProfile(locale: BotLocale): {
  readonly description: BotText;
  readonly about: BotText;
} {
  const bundle = botBundle(locale);
  return { description: bundle.botDescription, about: bundle.botAbout };
}

/**
 * The body of the webhook's answer: the method call Telegram executes for us.
 *
 * `new Response(JSON.stringify(...))` is built by the handler, never
 * `Response.json` — the declared surface of the `Response` global concedes the
 * constructor and nothing else (CA-1.5, SPEC-009 CA-1).
 */
export function webhookBody(outbound: Outbound): Readonly<Record<string, unknown>> {
  if (outbound.kind === 'message') {
    const { message: sent } = outbound;
    return {
      method: 'sendMessage',
      chat_id: sent.chat.chat_id,
      text: sent.text,
      ...(sent.keyboard === undefined
        ? {}
        : {
            reply_markup: {
              inline_keyboard: sent.keyboard.map((row) =>
                row.map((button) => ({ text: button.label, callback_data: button.data })),
              ),
            },
          }),
    };
  }
  if (outbound.kind === 'callback') {
    return {
      method: 'answerCallbackQuery',
      callback_query_id: outbound.answer.callback_query_id,
      ...(outbound.answer.text === null ? {} : { text: outbound.answer.text }),
    };
  }
  return {};
}
