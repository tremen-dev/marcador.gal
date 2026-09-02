/**
 * The confirmation card and its keyboard (SPEC-015 CA-7.6, CA-6.4, CA-6.5;
 * ADR-013 translated to this channel).
 *
 * IT SHOWS THE CANONICAL NAMES OF THE RFGF, taken from the declared calendar,
 * AND NEVER THE TEXT THE PERSON WROTE (CA-6.5). Somebody who types «ourense»
 * reads «UD Ourense» back, which is what makes the confirmation worth
 * something: what is confirmed is the identity the system will store, not the
 * one the person believes they named.
 *
 * THE STATE GOES WITH TEXT, NEVER WITH A GLYPH ALONE. That is ADR-013 —
 * «ningún estado se codifica solo con color» — carried into a channel with no
 * colour: here the equivalent of a colour is an emoji, so there is none. Each
 * field carries its label, and the value of the state comes from the SHARED
 * `statuses` namespace, so the bot and the scoreboard cannot drift apart
 * (CA-12.5).
 *
 * AND THERE IS NO CONSENT BUTTON ANYWHERE (CA-14.7). The legal basis is not
 * consent (ADR-023 §4), and a button that is not the basis misleads
 * (art. 13.1.c). The only buttons this module builds are Confirm, Discard, the
 * choice among ambiguous candidates and the choice of language.
 */
import { LABELLED_LINE, MATCH_LINE, botBundle, botStatus, fill, joinLines } from '@/i18n/bot';
import type { BotLocale, BotText } from '@/i18n/bot';
import type { InlineButton, OutboundMessage, ChatRef } from './telegram';
import type { MatchCandidate } from './prompt';
import type { Proposal } from './proposal';

/** The callback payloads. Ours, opaque, and never text in any language. */
export const CONFIRM = 'c';
export const DISCARD = 'd';
export const CHOOSE = 'm';
export const LANGUAGE = 'l';

export const confirmData = (proposalId: string): string => `${CONFIRM}:${proposalId}`;
export const discardData = (proposalId: string): string => `${DISCARD}:${proposalId}`;
export const chooseData = (matchId: string): string => `${CHOOSE}:${matchId}`;
export const languageData = (locale: BotLocale): string => `${LANGUAGE}:${locale}`;

export interface CallbackAction {
  readonly kind: typeof CONFIRM | typeof DISCARD | typeof CHOOSE | typeof LANGUAGE;
  readonly argument: string;
}

/** Reads a callback payload. Anything unreadable is `null`, never a guess. */
export function parseCallbackData(data: string): CallbackAction | null {
  const separator = data.indexOf(':');
  if (separator < 1) return null;

  const kind = data.slice(0, separator);
  const argument = data.slice(separator + 1);
  if (argument.length === 0) return null;
  if (kind === CONFIRM || kind === DISCARD || kind === CHOOSE || kind === LANGUAGE) {
    return { kind, argument };
  }
  return null;
}

/** No value. An ASCII hyphen: no literal of `src/bot/` needs a diacritic. */
const NO_VALUE = '-';

function scoreOf(proposal: Proposal): string {
  if (proposal.home_score === null || proposal.away_score === null) return NO_VALUE;
  return `${proposal.home_score}-${proposal.away_score}`;
}

/**
 * The card. Four lines with their labels — match, scoreboard, minute, state —
 * plus the hint, and it fits on a screen without scrolling (D-8).
 */
export function confirmationCard(input: {
  readonly locale: BotLocale;
  readonly chat: ChatRef;
  readonly proposalId: string;
  readonly proposal: Proposal;
  readonly candidate: MatchCandidate;
}): OutboundMessage {
  const bundle = botBundle(input.locale);
  const line = (label: BotText, value: string): BotText =>
    fill(LABELLED_LINE, { label, value });

  return {
    chat: input.chat,
    text: joinLines(
      bundle.cardHeading,
      fill(MATCH_LINE, { home: input.candidate.home, away: input.candidate.away }),
      line(bundle.cardScoreLabel, scoreOf(input.proposal)),
      line(bundle.cardMinuteLabel, input.proposal.minute === null ? NO_VALUE : `${input.proposal.minute}`),
      line(bundle.cardStatusLabel, botStatus(input.locale, input.proposal.status)),
      bundle.cardHint,
    ),
    keyboard: [
      [
        { label: bundle.cardConfirm, data: confirmData(input.proposalId) },
        { label: bundle.cardDiscard, data: discardData(input.proposalId) },
      ],
    ],
  };
}

/** The keyboard of CA-6.4: more than one plausible candidate, the person chooses. */
export function ambiguityMessage(input: {
  readonly locale: BotLocale;
  readonly chat: ChatRef;
  readonly candidates: readonly MatchCandidate[];
}): OutboundMessage {
  const bundle = botBundle(input.locale);
  return {
    chat: input.chat,
    text: bundle.errAmbiguous,
    keyboard: input.candidates.map((candidate): readonly InlineButton[] => [
      {
        label: fill(MATCH_LINE, { home: candidate.home, away: candidate.away }),
        data: chooseData(candidate.match_id),
      },
    ]),
  };
}

/** The `/lingua` keyboard (CA-11.3). Two buttons, both from the bundle. */
export function languageMessage(locale: BotLocale, chat: ChatRef): OutboundMessage {
  const bundle = botBundle(locale);
  return {
    chat,
    text: bundle.languagePrompt,
    keyboard: [
      [
        { label: bundle.languageGalego, data: languageData('gl') },
        { label: bundle.languageCastelan, data: languageData('es') },
      ],
    ],
  };
}
