/** CA-3 with a synthetic corpus, synthetic transcripts and a fixed shuffle. */
import { describe, expect, it } from 'vitest';
import { memoryArchive } from '../src/archive.ts';
import type { ExchangeMeta } from '../src/asr/run.ts';
import { buildSheet, type Corpus, unblind, werRows } from '../src/corpus.ts';

const corpus: Corpus = {
  sessionId: 's',
  criteria: 'teams: both sides recognisable as said; score: the two numbers, in digits or words, in the right order',
  goalPhrases: [
    { id: 1, offsetSeconds: 5, competition: 'terceira-rfef-g1', homeAsSaid: 'o Exemplo', awayAsSaid: 'a Inventada', score: '1-0' },
    { id: 2, offsetSeconds: 25, competition: 'terceira-rfef-g1', homeAsSaid: 'o Exemplo', awayAsSaid: 'a Inventada', score: null },
  ],
  reference: { startOffsetSeconds: 0, endOffsetSeconds: 40, lines: ['gol do exemplo un a cero', 'segue o partido na inventada'] },
};

function x(over: Partial<ExchangeMeta> & { engine: string; model: string; startOffsetSeconds: number; transcriptKey: string | null }): ExchangeMeta {
  return {
    sessionId: 's',
    chunkId: `20s-${over.startOffsetSeconds}`,
    targetSeconds: 20,
    chunkDurationSeconds: 20,
    endOffsetSeconds: over.startOffsetSeconds + 20,
    container: 'wav',
    origin: 'laptop',
    sentAt: '',
    receivedAt: '',
    latencyMs: 1,
    status: 200,
    rawKey: 'r',
    parameters: {},
    outcome: over.transcriptKey === null ? 'empty' : 'transcribed',
    reason: null,
    ...over,
  };
}

async function setup() {
  const archive = memoryArchive();
  const enc = (s: string) => new TextEncoder().encode(s);
  await archive.put('t/g/0', enc('Gol do Exemplo, un a cero!'), 'text/plain');
  await archive.put('t/g/20', enc('segue o partido na Inventada'), 'text/plain');
  await archive.put('t/o/0', enc('gol do templo un cero'), 'text/plain');
  const exchanges = [
    x({ engine: 'google', model: 'chirp_2', startOffsetSeconds: 0, transcriptKey: 't/g/0' }),
    x({ engine: 'google', model: 'chirp_2', startOffsetSeconds: 20, transcriptKey: 't/g/20' }),
    x({ engine: 'openai', model: 'gpt-4o-transcribe', startOffsetSeconds: 0, transcriptKey: 't/o/0' }),
    x({ engine: 'openai', model: 'gpt-4o-transcribe', startOffsetSeconds: 20, transcriptKey: null }),
  ];
  return { archive, exchanges };
}

describe('buildSheet + unblind (CA-3.3, blind)', () => {
  it('the sheet hides the engine; the key restores it; rates are per engine × length × container', async () => {
    const { archive, exchanges } = await setup();
    let seed = 0;
    const { sheet, key } = await buildSheet(corpus, exchanges, archive, () => (seed++ % 2 === 0 ? 0.9 : 0.1));
    expect(sheet.items).toHaveLength(2); // 2 phrases × 1 length × 1 container
    expect(JSON.stringify(sheet)).not.toMatch(/google|openai/);
    expect(Object.values(key[0]!).sort()).toEqual(['google|chirp_2', 'openai|gpt-4o-transcribe']);

    // The judge fills verdicts by letter only.
    for (const item of sheet.items) {
      for (const [letter, text] of Object.entries(item.candidates)) {
        if (text === null) continue;
        const hasTeams = /exemplo/i.test(text) || /inventada/i.test(text);
        const hasScore = /un (a )?cero/i.test(text);
        item.verdicts[letter] = { teams: hasTeams, score: hasScore };
      }
    }
    const rows = unblind(corpus, sheet, key);
    const google = rows.find((r) => r.engine === 'google|chirp_2')!;
    const openai = rows.find((r) => r.engine === 'openai|gpt-4o-transcribe')!;
    expect(google).toMatchObject({ phrases: 2, withExplicitScore: 1, withoutExplicitScore: 1, hits: 1, hitRate: 1, teamsOnly: 1, teamsRate: 1, noTranscript: 0 });
    expect(openai).toMatchObject({ phrases: 2, hits: 0, hitRate: 0, scoreOnly: 1, noTranscript: 1, neither: 1, teamsRate: 0 });
  });
});

describe('werRows (CA-3.4 over the reference minutes)', () => {
  it('joins the chunks covering the reference and counts the missing ones', async () => {
    const { archive, exchanges } = await setup();
    const rows = await werRows(corpus, exchanges, archive);
    const google = rows.find((r) => r.engine === 'google|chirp_2')!;
    expect(google).toMatchObject({ chunksCovered: 2, chunksMissing: 0 });
    expect(google.result?.wer).toBe(0);
    const openai = rows.find((r) => r.engine === 'openai|gpt-4o-transcribe')!;
    expect(openai).toMatchObject({ chunksCovered: 1, chunksMissing: 1 });
    expect(openai.result!.wer).toBeGreaterThan(0.5);
  });
});
