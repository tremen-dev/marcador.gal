/**
 * CA-12.1, CA-12.2 y CA-5.1 — los invariantes de TIPO de SPEC-015.
 *
 * Prueba invertida, como el resto de `tests/types/`: si el invariante deja de
 * sostenerse, la directiva `@ts-expect-error` queda sin usar y `npm run
 * typecheck` falla. Aquí eso significa tres cosas:
 *
 *   1. una lengua incompleta NO COMPILA (CA-12.1);
 *   2. un literal visible escrito en `src/bot/` NO COMPILA (CA-12.2) — que es
 *      el control positivo que el criterio pide, en la forma en la que este
 *      mecanismo es exacto: `Confirmar` es una palabra ASCII sin espacios,
 *      indistinguible de un identificador para cualquier escaneo de prosa;
 *   3. el tipo de entrada del constructor del prompt NO PUEDE transportar
 *      identidad (CA-5.1).
 */
import type { BotBundle } from '@/i18n/bot-bundle';
import type { BotText } from '@/i18n/bot';
import type { OutboundMessage } from '@/bot/telegram';
import type { PromptInput } from '@/bot/prompt';
import type { EngineOutcomeSummary } from '@/decide/engine-entry';
import { botBundle } from '@/i18n/bot';
import { es } from '@/i18n/es';
import { gl } from '@/i18n/gl';

// ── CA-12.1 — las dos lenguas satisfacen el MISMO contrato ───────────────────
const galego: BotBundle = gl.bot;
const castelan: BotBundle = es.bot;
void galego;
void castelan;

const swapped: typeof gl.bot = es.bot;
void swapped;

// @ts-expect-error a un bundle al que le falta todo lo demás no se le deja pasar
const incomplete: BotBundle = { cardConfirm: 'Confirmar' };
void incomplete;

// @ts-expect-error y una clave de más tampoco: el contrato es cerrado
const extra: BotBundle = { ...gl.bot, cardEmoji: '⚽' };
void extra;

// ── CA-12.2 — un literal visible en `src/bot/` NO COMPILA ────────────────────
declare const chat: OutboundMessage['chat'];

// El camino legítimo: el texto sale del bundle.
const fromBundle: OutboundMessage = { chat, text: botBundle('gl').cardConfirm };
void fromBundle;

// @ts-expect-error CA-12.2: un literal en galego impecable es incumplimiento de D-2 igual
const hardcodedGalego: OutboundMessage = { chat, text: 'Confirmar' };
void hardcodedGalego;

declare const anyString: string;
// @ts-expect-error CA-12.2: y una cadena cualquiera tampoco es texto del bundle
const hardcodedAny: OutboundMessage = { chat, text: anyString };
void hardcodedAny;

// Y `BotText` sí es una cadena: se interpola y se compara como tal.
declare const branded: BotText;
const asString: string = branded;
void asString;

// ── CA-5.1 — el tipo de entrada del prompt no puede llevar identidad ─────────
declare const candidates: PromptInput['candidates'];

const legitimate: PromptInput = { text: 'x', candidates };
void legitimate;

// @ts-expect-error CA-5.1: no hay campo para el corresponsal
const withCorrespondent: PromptInput = { text: 'x', candidates, correspondent_id: 'corresponsal-01' };
void withCorrespondent;

// @ts-expect-error CA-5.1: ni para un identificador de chat
const withChat: PromptInput = { text: 'x', candidates, chat_id: 42 };
void withChat;

// @ts-expect-error CA-5.1: ni para un nombre
const withName: PromptInput = { text: 'x', candidates, first_name: 'Alberto' };
void withName;

// ── CA-9.2 — el tipo de retorno de la entrada estrecha no lleva almacén ──────
declare const summary: EngineOutcomeSummary;

// @ts-expect-error CA-9.2: no devuelve `DecisionStore`
void summary.decisions.append;

// @ts-expect-error CA-9.2: ni `AlertStore`
void summary.alerts.append;

// @ts-expect-error CA-9.2: ni `EnginePorts`
void summary.ports;
