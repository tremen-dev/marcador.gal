/**
 * The reference corpus a PERSON writes by hand (SPEC-019 CA-3), the blind
 * judging sheet (CA-3.3) and the two figures: goal-phrase hit rate per engine
 * × chunk length, and WER over the five contiguous minutes (CA-3.4).
 *
 * The corpus lives in `data/corpus/<session>.json` and NEVER enters git
 * (CA-3.5). Its shape:
 *
 *   {
 *     "sessionId": "...",
 *     "criteria": "<written BEFORE judging: what counts as teams recognisable / score correct>",
 *     "goalPhrases": [
 *       { "id": 1, "offsetSeconds": 123.0, "competition": "terceira-rfef-g1",
 *         "homeAsSaid": "o Arenteiro", "awayAsSaid": "o Boiro", "score": "1-0" | null }
 *     ],
 *     "reference": { "startOffsetSeconds": 600, "endOffsetSeconds": 900, "lines": ["…"] }
 *   }
 *
 * `score: null` is «sin marcador explícito» — the figure of `_epica.md`
 * *Fuera*: those phrases are counted, judged on teams only, and never on
 * score. Offsets are seconds of session audio (the concatenation of the
 * archived segments in sequence order), which is what a person listening to
 * `chunks/` can write down.
 *
 * BLIND JUDGING: the sheet shows, per phrase and per chunk length, the
 * transcripts of every engine under random letters; the letter → engine map
 * is written to a separate key file the judge does not open. `unblind()` joins
 * them back. Names of people never appear in the report: rows carry teams and
 * scores only, as the corpus does.
 */
import type { ExchangeMeta } from './asr/run.ts';
import type { Archive } from './archive.ts';
import { wer, type WerResult } from './wer.ts';

export interface GoalPhrase {
  readonly id: number;
  readonly offsetSeconds: number;
  readonly competition: string;
  readonly homeAsSaid: string;
  readonly awayAsSaid: string;
  /** `"H-A"`, or null when the score was not said explicitly. */
  readonly score: string | null;
}

export interface Corpus {
  readonly sessionId: string;
  readonly criteria: string;
  readonly goalPhrases: readonly GoalPhrase[];
  readonly reference: { readonly startOffsetSeconds: number; readonly endOffsetSeconds: number; readonly lines: readonly string[] };
}

export interface SheetItem {
  readonly phraseId: number;
  readonly targetSeconds: number;
  readonly container: string;
  /** Random letter → transcript text (or null if that engine has no transcript for the chunk). */
  readonly candidates: Readonly<Record<string, string | null>>;
  /** Filled by the judge: letter → verdict. */
  verdicts: Record<string, { teams: boolean; score: boolean | null } | null>;
}

export interface Sheet {
  readonly sessionId: string;
  readonly criteria: string;
  readonly items: SheetItem[];
}

/** letter → `engine|model`, per item index. Kept apart from the sheet. */
export type SheetKey = Record<number, Record<string, string>>;

export function transcriptFor(exchanges: readonly ExchangeMeta[], engineKey: string, targetSeconds: number, container: string, offsetSeconds: number): ExchangeMeta | null {
  return (
    exchanges.find(
      (x) =>
        `${x.engine}|${x.model}` === engineKey &&
        x.targetSeconds === targetSeconds &&
        x.container === container &&
        x.origin === 'laptop' &&
        offsetSeconds >= x.startOffsetSeconds &&
        offsetSeconds < x.endOffsetSeconds,
    ) ?? null
  );
}

export function engineKeys(exchanges: readonly ExchangeMeta[]): string[] {
  return [...new Set(exchanges.map((x) => `${x.engine}|${x.model}`))].sort();
}

const LETTERS = 'ABCDEFGH';

export async function buildSheet(
  corpus: Corpus,
  exchanges: readonly ExchangeMeta[],
  archive: Archive,
  random: () => number = Math.random,
): Promise<{ sheet: Sheet; key: SheetKey }> {
  const engines = engineKeys(exchanges);
  const lengths = [...new Set(exchanges.map((x) => x.targetSeconds))].sort((a, b) => a - b);
  const containers = [...new Set(exchanges.filter((x) => x.outcome === 'transcribed').map((x) => x.container))].sort();
  const items: SheetItem[] = [];
  const key: SheetKey = {};
  for (const phrase of corpus.goalPhrases) {
    for (const targetSeconds of lengths) {
      for (const container of containers) {
        const shuffled = [...engines].sort(() => random() - 0.5);
        const candidates: Record<string, string | null> = {};
        const map: Record<string, string> = {};
        for (const [i, engineKey] of shuffled.entries()) {
          const letter = LETTERS[i]!;
          map[letter] = engineKey;
          const x = transcriptFor(exchanges, engineKey, targetSeconds, container, phrase.offsetSeconds);
          const bytes = x?.transcriptKey === null || x === null ? null : await archive.get(x.transcriptKey);
          candidates[letter] = bytes === null ? null : new TextDecoder().decode(bytes);
        }
        key[items.length] = map;
        items.push({ phraseId: phrase.id, targetSeconds, container, candidates, verdicts: {} });
      }
    }
  }
  return { sheet: { sessionId: corpus.sessionId, criteria: corpus.criteria, items }, key };
}

export interface HitRateRow {
  readonly engine: string;
  readonly targetSeconds: number;
  readonly container: string;
  readonly phrases: number;
  readonly judged: number;
  readonly withExplicitScore: number;
  readonly withoutExplicitScore: number;
  /** teams AND score, over phrases with explicit score. */
  readonly hits: number;
  readonly hitRate: number | null;
  readonly teamsOnly: number;
  readonly scoreOnly: number;
  readonly neither: number;
  /** teams recognised over ALL judged phrases (explicit score or not). */
  readonly teamsRate: number | null;
  /** No transcript existed for the chunk (rejected/empty): counted as a miss. */
  readonly noTranscript: number;
}

export function unblind(corpus: Corpus, sheet: Sheet, key: SheetKey): HitRateRow[] {
  const byPhrase = new Map(corpus.goalPhrases.map((p) => [p.id, p]));
  const acc = new Map<string, { row: Omit<HitRateRow, 'hitRate' | 'teamsRate'> }>();
  for (const [index, item] of sheet.items.entries()) {
    const phrase = byPhrase.get(item.phraseId);
    if (phrase === undefined) continue;
    const map = key[index] ?? {};
    for (const [letter, engine] of Object.entries(map)) {
      const k = `${engine}|${item.targetSeconds}|${item.container}`;
      const entry = acc.get(k) ?? {
        row: { engine, targetSeconds: item.targetSeconds, container: item.container, phrases: 0, judged: 0, withExplicitScore: 0, withoutExplicitScore: 0, hits: 0, teamsOnly: 0, scoreOnly: 0, neither: 0, noTranscript: 0 },
      };
      const r = { ...entry.row };
      r.phrases++;
      const explicit = phrase.score !== null;
      if (explicit) r.withExplicitScore++;
      else r.withoutExplicitScore++;
      const verdict = item.verdicts[letter];
      const transcript = item.candidates[letter];
      if (transcript === null || transcript === undefined) {
        r.noTranscript++;
        r.judged++;
        r.neither++;
      } else if (verdict !== null && verdict !== undefined) {
        r.judged++;
        const teams = verdict.teams;
        const score = explicit ? verdict.score === true : false;
        if (explicit) {
          if (teams && score) r.hits++;
          else if (teams) r.teamsOnly++;
          else if (score) r.scoreOnly++;
          else r.neither++;
        } else if (teams) r.teamsOnly++;
        else r.neither++;
      }
      acc.set(k, { row: r });
    }
  }
  return [...acc.values()]
    .map(({ row }) => ({
      ...row,
      hitRate: row.withExplicitScore === 0 ? null : row.hits / row.withExplicitScore,
      teamsRate: row.judged === 0 ? null : (row.hits + row.teamsOnly) / row.judged,
    }))
    .sort((a, b) => a.engine.localeCompare(b.engine) || a.targetSeconds - b.targetSeconds || a.container.localeCompare(b.container));
}

export interface WerRow {
  readonly engine: string;
  readonly targetSeconds: number;
  readonly container: string;
  readonly chunksCovered: number;
  readonly chunksMissing: number;
  readonly result: WerResult | null;
}

/** WER over the reference minutes: the reference lines joined vs. the transcripts of the chunks covering [start, end), joined. */
export async function werRows(corpus: Corpus, exchanges: readonly ExchangeMeta[], archive: Archive): Promise<WerRow[]> {
  const { startOffsetSeconds: start, endOffsetSeconds: end, lines } = corpus.reference;
  const reference = lines.join(' ');
  const groups = new Map<string, ExchangeMeta[]>();
  for (const x of exchanges) {
    if (x.origin !== 'laptop') continue;
    if (x.endOffsetSeconds <= start || x.startOffsetSeconds >= end) continue;
    const k = `${x.engine}|${x.model}|${x.targetSeconds}|${x.container}`;
    groups.set(k, [...(groups.get(k) ?? []), x]);
  }
  const rows: WerRow[] = [];
  for (const [k, xs] of groups) {
    const [engine, model, target, container] = k.split('|') as [string, string, string, string];
    const ordered = [...xs].sort((a, b) => a.startOffsetSeconds - b.startOffsetSeconds);
    const texts: string[] = [];
    let missing = 0;
    for (const x of ordered) {
      const bytes = x.transcriptKey === null ? null : await archive.get(x.transcriptKey);
      if (bytes === null) missing++;
      else texts.push(new TextDecoder().decode(bytes));
    }
    rows.push({
      engine: `${engine}|${model}`,
      targetSeconds: Number(target),
      container,
      chunksCovered: texts.length,
      chunksMissing: missing,
      result: texts.length === 0 ? null : wer(reference, texts.join(' ')),
    });
  }
  return rows.sort((a, b) => a.engine.localeCompare(b.engine) || a.targetSeconds - b.targetSeconds || a.container.localeCompare(b.container));
}
