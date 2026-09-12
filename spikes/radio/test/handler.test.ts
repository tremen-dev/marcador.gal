import { describe, expect, it } from 'vitest';
import { memoryArchive } from '../src/archive.ts';
import { openAiEngine } from '../src/asr/openai.ts';
import { handle, type HandlerDeps } from '../src/handler.ts';
import type { ListenReport } from '../src/listen.ts';

function deps(over: Partial<HandlerDeps> = {}): HandlerDeps & { calls: { minutes: number; sessionId: string }[] } {
  const calls: { minutes: number; sessionId: string }[] = [];
  return {
    calls,
    secret: 's3cret',
    region: 'fra1',
    archive: memoryArchive(),
    listen: async (o) => {
      calls.push({ minutes: o.minutes, sessionId: o.sessionId });
      return { sessionId: o.sessionId, region: o.region, segmentCount: 0 } as unknown as ListenReport;
    },
    engine: (id) => {
      if (id !== 'openai') throw new Error(`no engine ${id}`);
      return openAiEngine({ apiKey: 'k', model: 'whisper-1' });
    },
    fetch: async () => new Response('{"text":"ola"}', { status: 200 }),
    now: () => 1,
    newSessionId: () => 'generated',
    ...over,
  };
}

const auth = { authorization: 'Bearer s3cret' };

describe('handle (the function, fail closed)', () => {
  it('401 without SPIKE_SECRET, whatever the header', async () => {
    const d = deps({ secret: undefined });
    const r = await handle(new Request('https://f/api/listen', { headers: auth }), d);
    expect(r.status).toBe(401);
    expect(d.calls).toEqual([]);
  });

  it('401 with the wrong bearer', async () => {
    const d = deps();
    expect((await handle(new Request('https://f/api/listen', { headers: { authorization: 'Bearer nope' } }), d)).status).toBe(401);
    expect(d.calls).toEqual([]);
  });

  it('listen: 11 minutes by default, capped at 12, session id generated or given', async () => {
    const d = deps();
    await handle(new Request('https://f/api/listen', { headers: auth }), d);
    await handle(new Request('https://f/api/listen?minutes=99&session=abc', { headers: auth }), d);
    expect(d.calls).toEqual([
      { minutes: 11, sessionId: 'generated' },
      { minutes: 12, sessionId: 'abc' },
    ]);
  });

  it('relay: sends an uploaded chunk from the function and archives the raw body with origin vercel (CA-4.2)', async () => {
    const d = deps();
    const chunk = { id: '20s-1-2', targetSeconds: 20, sequences: [1, 2], keys: [], durationSeconds: 20, startOffsetSeconds: 0, endOffsetSeconds: 20 };
    await d.archive.put('sessions/s/relay/20s-1-2.json', new TextEncoder().encode(JSON.stringify({ chunk, container: 'adts-aac' })), 'application/json');
    await d.archive.put('sessions/s/relay/20s-1-2.aac', new Uint8Array([0xff, 0xf1]), 'audio/aac');
    const r = await handle(new Request('https://f/api/listen?mode=relay&session=s&chunk=20s-1-2&engine=openai', { headers: auth }), d);
    expect(r.status).toBe(200);
    const meta = (await r.json()) as { origin: string; outcome: string; rawKey: string; region: string };
    expect(meta).toMatchObject({ origin: 'vercel', outcome: 'transcribed', region: 'fra1' });
    expect(await d.archive.get(meta.rawKey)).not.toBeNull();
  });

  it('relay: 404 for a chunk nobody uploaded, 400 for an unknown engine', async () => {
    const d = deps();
    expect((await handle(new Request('https://f/api/listen?mode=relay&session=s&chunk=x&engine=openai', { headers: auth }), d)).status).toBe(404);
    await d.archive.put('sessions/s/relay/x.json', new TextEncoder().encode(JSON.stringify({ chunk: { id: 'x', keys: [] }, container: 'wav' })), 'application/json');
    await d.archive.put('sessions/s/relay/x.wav', new Uint8Array([1]), 'audio/wav');
    expect((await handle(new Request('https://f/api/listen?mode=relay&session=s&chunk=x&engine=nope', { headers: auth }), d)).status).toBe(400);
  });
});
