/**
 * The two adapters and the driver, with doubles (no key, no provider). What is
 * tested is their SHAPE: the request they build, that the raw body is
 * archived before it is parsed, that a rejection is «no transcrito» and not
 * «vacío», and that nothing asks for diarization (CA-2.2, CA-2.3, CA-2.4).
 * Bodies are synthetic.
 */
import { describe, expect, it } from 'vitest';
import { memoryArchive } from '../src/archive.ts';
import { groupIntoChunks } from '../src/chunks.ts';
import { googleEngine } from '../src/asr/google.ts';
import { openAiEngine } from '../src/asr/openai.ts';
import { mentionsForbidden, type Fetch } from '../src/asr/port.ts';
import { readExchanges, runChunk } from '../src/asr/run.ts';

const audio = new Uint8Array([0xff, 0xf1, 0x50, 0x80, 0x00, 0x1f, 0xfc]);
let clock = Date.parse('2026-09-19T15:30:00.000Z');
const now = () => (clock += 250);

function fakeFetch(status: number, body: string, seen: { url: string; init: RequestInit }[] = []): Fetch {
  return async (url, init) => {
    seen.push({ url, init });
    return new Response(body, { status, headers: { 'content-type': 'application/json' } });
  };
}

describe('google (Speech-to-Text v2, chirp)', () => {
  const engine = googleEngine({ projectId: 'proj', location: 'europe-west4', model: 'chirp_2', apiKey: 'k' });

  it('builds a v2 recognize request with gl-ES, the model and NO diarization (CA-2.4)', async () => {
    const seen: { url: string; init: RequestInit }[] = [];
    const x = await engine.send({ audio, container: 'adts-aac', chunkId: 'c' }, fakeFetch(200, '{"results":[]}', seen), now);
    expect(seen[0]?.url).toBe('https://europe-west4-speech.googleapis.com/v2/projects/proj/locations/europe-west4/recognizers/_:recognize');
    const body = JSON.parse(String(seen[0]?.init.body)) as { config: Record<string, unknown>; content: string };
    expect(body.config).toEqual({
      autoDecodingConfig: {},
      languageCodes: ['gl-ES'],
      model: 'chirp_2',
      features: { enableAutomaticPunctuation: true },
    });
    expect(body.content).toBe(Buffer.from(audio).toString('base64'));
    expect((seen[0]?.init.headers as Record<string, string>)['x-goog-api-key']).toBe('k');
    expect(JSON.stringify(x.parameters)).not.toContain('k"');
    expect(mentionsForbidden(x.parameters)).toEqual([]);
    expect(x.latencyMs).toBe(250);
  });

  it('parses a transcript, an empty result and an error as three different outcomes (CA-2.3)', () => {
    const enc = (s: string) => new TextEncoder().encode(s);
    expect(engine.parse(enc('{"results":[{"alternatives":[{"transcript":"gol do local"}]}]}'), 200)).toEqual({ kind: 'transcribed', text: 'gol do local' });
    expect(engine.parse(enc('{"results":[]}'), 200)).toEqual({ kind: 'empty' });
    const rejected = engine.parse(enc('{"error":{"code":400,"status":"INVALID_ARGUMENT","message":"Audio format not supported"}}'), 400);
    expect(rejected.kind).toBe('rejected');
    expect(rejected.kind === 'rejected' && rejected.reason).toMatch(/INVALID_ARGUMENT 400: Audio format not supported/);
  });
});

describe('openai (audio/transcriptions)', () => {
  const engine = openAiEngine({ apiKey: 'sk-test', model: 'gpt-4o-transcribe' });

  it('builds a multipart request with model, language gl, json, and the file named by container (CA-2.4)', async () => {
    const seen: { url: string; init: RequestInit }[] = [];
    const x = await engine.send({ audio, container: 'mpeg-ts', chunkId: '20s-1-2' }, fakeFetch(200, '{"text":"ola"}', seen), now);
    expect(seen[0]?.url).toBe('https://api.openai.com/v1/audio/transcriptions');
    const form = seen[0]?.init.body as FormData;
    expect(form.get('model')).toBe('gpt-4o-transcribe');
    expect(form.get('language')).toBe('gl');
    expect(form.get('response_format')).toBe('json');
    const file = form.get('file') as File;
    expect(file.name).toBe('20s-1-2.ts');
    expect(file.type).toBe('video/mp2t');
    expect((seen[0]?.init.headers as Record<string, string>)['authorization']).toBe('Bearer sk-test');
    expect(JSON.stringify(x.parameters)).not.toContain('sk-test');
    expect(mentionsForbidden(x.parameters)).toEqual([]);
  });

  it('parses text, empty text and an error (CA-2.3)', () => {
    const enc = (s: string) => new TextEncoder().encode(s);
    expect(engine.parse(enc('{"text":"gol"}'), 200)).toEqual({ kind: 'transcribed', text: 'gol' });
    expect(engine.parse(enc('{"text":"  "}'), 200)).toEqual({ kind: 'empty' });
    const r = engine.parse(enc('{"error":{"message":"Invalid file format.","type":"invalid_request_error","code":null}}'), 400);
    expect(r).toMatchObject({ kind: 'rejected', reason: expect.stringMatching(/invalid_request_error/) as string });
  });
});

describe('runChunk (the driver: raw before parse, native then WAV)', () => {
  const chunk = groupIntoChunks(
    [
      { sequence: 1, duration: 10, discontinuity: false, key: 'sessions/s/segments/1.aac', offsetSeconds: 0 },
      { sequence: 2, duration: 10, discontinuity: false, key: 'sessions/s/segments/2.aac', offsetSeconds: 10 },
    ],
    20,
  )[0]!;

  async function setup() {
    const archive = memoryArchive();
    await archive.put('sessions/s/segments/1.aac', audio, 'audio/aac');
    await archive.put('sessions/s/segments/2.aac', audio, 'audio/aac');
    return archive;
  }

  it('archives the raw body BEFORE the transcript and the meta (CA-2.2)', async () => {
    const archive = await setup();
    const engine = openAiEngine({ apiKey: 'k', model: 'whisper-1' });
    const metas = await runChunk(chunk, 'adts-aac', [engine], { sessionId: 's', origin: 'laptop', containers: 'native' }, { archive, fetch: fakeFetch(200, '{"text":"un dous"}'), now });
    expect(metas).toHaveLength(1);
    const order = archive.writes.filter((k) => k.includes('/asr/') || k.includes('/transcripts/'));
    expect(order[0]).toMatch(/\/asr\/openai\/20s-1-2\.adts-aac\.laptop\..*\.200\.json$/);
    expect(order[1]).toMatch(/\/transcripts\/openai\/20s-1-2\.adts-aac\.laptop\.txt$/);
    expect(order[2]).toBe(`${order[0]}.meta.json`);
    expect(metas[0]).toMatchObject({ outcome: 'transcribed', container: 'adts-aac', latencyMs: 250, rawKey: order[0] });
    expect((await readExchanges(archive, 's'))[0]?.chunkId).toBe('20s-1-2');
  });

  it('falls back to WAV when the native container is rejected, and records the rejection as such (CA-2.1, CA-2.3)', async () => {
    const archive = await setup();
    let calls = 0;
    const fetch: Fetch = async () => {
      calls++;
      return calls === 1
        ? new Response('{"error":{"message":"Invalid file format.","type":"invalid_request_error"}}', { status: 400 })
        : new Response('{"text":"gol do local dous a un"}', { status: 200 });
    };
    const decodeToWav = async () => new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45]);
    const engine = openAiEngine({ apiKey: 'k', model: 'gpt-4o-transcribe' });
    const metas = await runChunk(chunk, 'adts-aac', [engine], { sessionId: 's', origin: 'laptop', containers: 'native-then-wav' }, { archive, fetch, now, decodeToWav });
    expect(metas.map((m) => [m.container, m.outcome])).toEqual([
      ['adts-aac', 'rejected'],
      ['wav', 'transcribed'],
    ]);
    expect(metas[0]?.reason).toMatch(/Invalid file format/);
    expect(await archive.get('sessions/s/chunks/20s-1-2.wav')).not.toBeNull();
  });

  it('refuses to decode inside the function (no decoder → error, never silent)', async () => {
    const archive = await setup();
    const engine = googleEngine({ projectId: 'p', location: 'global', model: 'chirp', accessToken: 't' });
    await expect(
      runChunk(chunk, 'adts-aac', [engine], { sessionId: 's', origin: 'vercel', containers: 'wav' }, { archive, fetch: fakeFetch(200, '{}'), now }),
    ).rejects.toThrow(/never inside the function/);
  });
});
