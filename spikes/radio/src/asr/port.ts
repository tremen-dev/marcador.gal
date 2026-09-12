/**
 * The ASR port of the spike (SPEC-019 CA-2): bytes in, BYTES OUT. An engine
 * builds ONE request, sends it and hands back the raw body with its timing;
 * it never parses on the way back. Parsing is a separate call the driver makes
 * AFTER the raw body is archived (CA-2.2, RN-10 in spirit).
 *
 * CA-2.4: no engine asks for diarization, speaker labels or voice
 * identification. `parameters()` returns exactly what is sent, so the report
 * can list it and a test can assert what is absent.
 */
import type { Container } from '../container.ts';

export type EngineId = 'google' | 'openai';

export const LANGUAGE = { bcp47: 'gl-ES', iso639_1: 'gl' } as const;

export interface AsrInput {
  readonly audio: Uint8Array;
  readonly container: Container;
  /** Used for the multipart filename and for logging only. */
  readonly chunkId: string;
}

export interface AsrExchange {
  readonly engine: EngineId;
  readonly model: string;
  readonly url: string;
  /** The exact non-secret parameters sent (CA-2.4). */
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly sentAt: string;
  readonly receivedAt: string;
  readonly latencyMs: number;
  readonly status: number;
  readonly rawBody: Uint8Array;
  readonly rawExtension: 'json' | 'txt';
}

export type AsrOutcome =
  | { readonly kind: 'transcribed'; readonly text: string }
  /** Accepted by the engine, but nothing came back: «aceptado pero vacío». */
  | { readonly kind: 'empty' }
  /** Refused by the engine: the reason AS THE ENGINE RETURNED IT (CA-2.3). */
  | { readonly kind: 'rejected'; readonly reason: string };

export type Fetch = (url: string, init: RequestInit) => Promise<Response>;

export interface AsrEngine {
  readonly id: EngineId;
  readonly model: string;
  parameters(input: Pick<AsrInput, 'container'>): Readonly<Record<string, unknown>>;
  send(input: AsrInput, fetch: Fetch, now: () => number): Promise<AsrExchange>;
  /** Called ONLY after `rawBody` is archived. */
  parse(rawBody: Uint8Array, status: number): AsrOutcome;
}

/** The words no request may carry (CA-2.4, ADR-028 §6), checked by a test. */
export const FORBIDDEN_PARAMETER_WORDS = ['diariz', 'speaker', 'voice', 'biometric', 'identif'] as const;

export function mentionsForbidden(parameters: Readonly<Record<string, unknown>>): string[] {
  const text = JSON.stringify(parameters).toLowerCase();
  return FORBIDDEN_PARAMETER_WORDS.filter((w) => text.includes(w));
}

export async function timedFetch(url: string, init: RequestInit, fetch: Fetch, now: () => number): Promise<{
  readonly status: number;
  readonly body: Uint8Array;
  readonly sentAt: string;
  readonly receivedAt: string;
  readonly latencyMs: number;
}> {
  const sent = now();
  const res = await fetch(url, init);
  const body = new Uint8Array(await res.arrayBuffer());
  const received = now();
  return {
    status: res.status,
    body,
    sentAt: new Date(sent).toISOString(),
    receivedAt: new Date(received).toISOString(),
    latencyMs: received - sent,
  };
}
