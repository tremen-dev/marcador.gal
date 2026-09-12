/**
 * OpenAI `POST /v1/audio/transcriptions` (SPEC-019 CA-2, the second engine
 * decided at the gate of 2026-09-12). Model `gpt-4o-transcribe` by default;
 * `OPENAI_ASR_MODEL` can switch to `whisper-1` or `gpt-4o-mini-transcribe`.
 * Language `gl` (ISO 639-1). Multipart body: the audio as a file with the
 * container's extension and MIME type — which is the CA-2.1 question for this
 * engine: does it take `.ts`/`.aac` as served, or only WAV?
 *
 * `OPENAI_API_KEY` → Bearer; the key never travels in `parameters()`.
 * NO diarization, NO speaker labels (CA-2.4): `response_format: json` and
 * nothing else.
 */
import { extensionFor, mimeFor } from '../container.ts';
import { type AsrEngine, type AsrExchange, type AsrInput, type AsrOutcome, type Fetch, LANGUAGE, timedFetch } from './port.ts';

export interface OpenAiConfig {
  readonly apiKey: string;
  readonly model: string;
  readonly baseUrl?: string;
}

export function openAiConfigFromEnv(env: NodeJS.ProcessEnv): OpenAiConfig {
  const apiKey = env['OPENAI_API_KEY'];
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  return { apiKey, model: env['OPENAI_ASR_MODEL'] ?? 'gpt-4o-transcribe' };
}

export function openAiEngine(config: OpenAiConfig): AsrEngine {
  const url = `${config.baseUrl ?? 'https://api.openai.com'}/v1/audio/transcriptions`;
  return {
    id: 'openai',
    model: config.model,
    parameters({ container }) {
      return {
        url,
        method: 'POST',
        multipart: {
          model: config.model,
          language: LANGUAGE.iso639_1,
          response_format: 'json',
          file: `<audio as ${mimeFor(container)}, .${extensionFor(container)}>`,
        },
      };
    },
    async send(input: AsrInput, fetch: Fetch, now: () => number): Promise<AsrExchange> {
      const form = new FormData();
      form.set('model', config.model);
      form.set('language', LANGUAGE.iso639_1);
      form.set('response_format', 'json');
      form.set('file', new Blob([Buffer.from(input.audio)], { type: mimeFor(input.container) }), `${input.chunkId}.${extensionFor(input.container)}`);
      const r = await timedFetch(url, { method: 'POST', headers: { authorization: `Bearer ${config.apiKey}` }, body: form }, fetch, now);
      return {
        engine: 'openai',
        model: config.model,
        url,
        parameters: this.parameters(input),
        sentAt: r.sentAt,
        receivedAt: r.receivedAt,
        latencyMs: r.latencyMs,
        status: r.status,
        rawBody: r.body,
        rawExtension: 'json',
      };
    },
    parse(rawBody: Uint8Array, status: number): AsrOutcome {
      const text = new TextDecoder().decode(rawBody);
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        return { kind: 'rejected', reason: `HTTP ${status}, non-JSON body: ${text.slice(0, 200)}` };
      }
      const obj = json as { error?: { message?: string; type?: string; code?: string | null }; text?: string };
      if (status < 200 || status >= 300 || obj.error !== undefined) {
        const e = obj.error ?? {};
        return { kind: 'rejected', reason: `HTTP ${status} ${e.type ?? ''} ${e.code ?? ''}: ${e.message ?? text.slice(0, 200)}`.trim() };
      }
      const transcript = (obj.text ?? '').trim();
      return transcript.length === 0 ? { kind: 'empty' } : { kind: 'transcribed', text: transcript };
    },
  };
}
