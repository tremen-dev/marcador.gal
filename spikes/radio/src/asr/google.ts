/**
 * Google Cloud Speech-to-Text v2, synchronous `recognize` (SPEC-019 CA-2).
 * Model: `chirp_2` by default (Proxecto Nós transcribed Radio Galega with it,
 * consulted 2026-09-12); `GOOGLE_STT_MODEL` can switch to `chirp` or
 * `chirp_3`. Language `gl-ES`. Synchronous recognition takes up to 60 s of
 * audio — our chunks are 20–30 s.
 *
 * Auth is one of two, and the KEY NEVER TRAVELS in `parameters()`:
 *   - `GOOGLE_ACCESS_TOKEN` (from `gcloud auth print-access-token`) → Bearer;
 *   - `GOOGLE_API_KEY` → `x-goog-api-key` header.
 * Plus `GOOGLE_PROJECT_ID` and `GOOGLE_STT_LOCATION` (a region where the
 * model is served; `europe-west4` keeps the audio in the EU — see the DPA
 * note in the ledger).
 *
 * `autoDecodingConfig` lets the service sniff the container: that is exactly
 * the CA-2.1 question — does it take MPEG-TS/AAC as served, or only WAV?
 *
 * NO `diarizationConfig`, NO speaker labels (CA-2.4, ADR-028 §6).
 */
import { mimeFor } from '../container.ts';
import { type AsrEngine, type AsrExchange, type AsrInput, type AsrOutcome, type Fetch, LANGUAGE, timedFetch } from './port.ts';

export interface GoogleConfig {
  readonly projectId: string;
  readonly location: string;
  readonly model: string;
  readonly accessToken?: string;
  readonly apiKey?: string;
}

export function googleConfigFromEnv(env: NodeJS.ProcessEnv): GoogleConfig {
  const projectId = env['GOOGLE_PROJECT_ID'];
  if (!projectId) throw new Error('GOOGLE_PROJECT_ID is not set');
  const accessToken = env['GOOGLE_ACCESS_TOKEN'];
  const apiKey = env['GOOGLE_API_KEY'];
  if (!accessToken && !apiKey) throw new Error('neither GOOGLE_ACCESS_TOKEN nor GOOGLE_API_KEY is set');
  return {
    projectId,
    location: env['GOOGLE_STT_LOCATION'] ?? 'europe-west4',
    model: env['GOOGLE_STT_MODEL'] ?? 'chirp_2',
    ...(accessToken ? { accessToken } : {}),
    ...(apiKey ? { apiKey } : {}),
  };
}

export function googleEngine(config: GoogleConfig): AsrEngine {
  const host = config.location === 'global' ? 'speech.googleapis.com' : `${config.location}-speech.googleapis.com`;
  const url = `https://${host}/v2/projects/${config.projectId}/locations/${config.location}/recognizers/_:recognize`;

  const recognitionConfig = (container: AsrInput['container']) => ({
    autoDecodingConfig: {},
    languageCodes: [LANGUAGE.bcp47],
    model: config.model,
    features: { enableAutomaticPunctuation: true },
    // What the container is, for the report; the API does not read it.
    _sentContentType: mimeFor(container),
  });

  return {
    id: 'google',
    model: config.model,
    parameters({ container }) {
      const { _sentContentType, ...cfg } = recognitionConfig(container);
      return { url, method: 'POST', config: cfg, content: '<base64 audio>', contentTypeOfAudio: _sentContentType };
    },
    async send(input: AsrInput, fetch: Fetch, now: () => number): Promise<AsrExchange> {
      const { _sentContentType: _unused, ...cfg } = recognitionConfig(input.container);
      const body = JSON.stringify({ config: cfg, content: Buffer.from(input.audio).toString('base64') });
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (config.accessToken) headers['authorization'] = `Bearer ${config.accessToken}`;
      else if (config.apiKey) headers['x-goog-api-key'] = config.apiKey;
      const r = await timedFetch(url, { method: 'POST', headers, body }, fetch, now);
      return {
        engine: 'google',
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
      const obj = json as { error?: { code?: number; status?: string; message?: string }; results?: { alternatives?: { transcript?: string }[] }[] };
      if (status < 200 || status >= 300 || obj.error !== undefined) {
        const e = obj.error ?? {};
        return { kind: 'rejected', reason: `HTTP ${status} ${e.status ?? ''} ${e.code ?? ''}: ${e.message ?? text.slice(0, 200)}`.trim() };
      }
      const transcript = (obj.results ?? [])
        .map((r) => r.alternatives?.[0]?.transcript ?? '')
        .filter((t) => t.trim().length > 0)
        .join(' ')
        .trim();
      return transcript.length === 0 ? { kind: 'empty' } : { kind: 'transcribed', text: transcript };
    },
  };
}
