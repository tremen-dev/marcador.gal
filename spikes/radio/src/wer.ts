/**
 * Word error rate (SPEC-019 CA-3.4).
 *
 * WER = (S + I + D) / N over the reference's N words, with S, I, D the edits of
 * a minimal word-level Levenshtein alignment. The normalisation is DECLARED
 * here and the report cites it (CA-3.4): lower case, accents removed (NFD and
 * the combining marks dropped — `ñ` survives because it is decomposed and put
 * back as a letter, not as a mark we keep), every character that is not a
 * letter or a digit becomes a space, and whitespace collapses.
 *
 * This is the only module of the spike the spec asks to be tested (§Usuarios):
 * a number that depends on a calculation.
 */

export interface WerResult {
  readonly substitutions: number;
  readonly insertions: number;
  readonly deletions: number;
  readonly referenceWords: number;
  readonly wer: number;
}

/** The declared normalisation, in one place. */
export function normalizeForWer(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    // Combining marks except the tilde of ñ (U+0303 over n). We put ñ back
    // first so the sweep never sees its mark.
    .replaceAll('ñ', 'ñ')
    .replaceAll(/[̀-ͯ]/g, '')
    .replaceAll(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replaceAll(/\s+/g, ' ');
}

export function tokenize(text: string): readonly string[] {
  const normalized = normalizeForWer(text);
  return normalized.length === 0 ? [] : normalized.split(' ');
}

interface Edits {
  readonly substitutions: number;
  readonly insertions: number;
  readonly deletions: number;
}

/** Minimal edit counts between two word sequences (Levenshtein with backtrace). */
function alignWords(reference: readonly string[], hypothesis: readonly string[]): Edits {
  const n = reference.length;
  const m = hypothesis.length;
  // cost[i][j] = minimal edits between ref[0..i) and hyp[0..j)
  const cost: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 0; i <= n; i++) cost[i]![0] = i;
  for (let j = 0; j <= m; j++) cost[0]![j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const same = reference[i - 1] === hypothesis[j - 1] ? 0 : 1;
      cost[i]![j] = Math.min(
        cost[i - 1]![j - 1]! + same, // match / substitution
        cost[i - 1]![j]! + 1, // deletion (reference word not in hypothesis)
        cost[i]![j - 1]! + 1, // insertion (hypothesis word not in reference)
      );
    }
  }
  // Backtrace to split the total into S, I, D. Ties prefer substitution, then
  // deletion, then insertion — any tie-break gives the same total.
  let i = n;
  let j = m;
  let substitutions = 0;
  let insertions = 0;
  let deletions = 0;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const same = reference[i - 1] === hypothesis[j - 1] ? 0 : 1;
      if (cost[i]![j] === cost[i - 1]![j - 1]! + same) {
        substitutions += same;
        i--;
        j--;
        continue;
      }
    }
    if (i > 0 && cost[i]![j] === cost[i - 1]![j]! + 1) {
      deletions++;
      i--;
      continue;
    }
    insertions++;
    j--;
  }
  return { substitutions, insertions, deletions };
}

export function wer(reference: string, hypothesis: string): WerResult {
  const ref = tokenize(reference);
  if (ref.length === 0) throw new Error('wer: the reference has no words; refusing to divide by zero');
  const hyp = tokenize(hypothesis);
  const edits = alignWords(ref, hyp);
  return {
    ...edits,
    referenceWords: ref.length,
    wer: (edits.substitutions + edits.insertions + edits.deletions) / ref.length,
  };
}

/** WER over several (reference, hypothesis) pairs: edits summed, words summed. */
export function werAggregate(pairs: readonly (readonly [reference: string, hypothesis: string])[]): WerResult {
  let substitutions = 0;
  let insertions = 0;
  let deletions = 0;
  let referenceWords = 0;
  for (const [reference, hypothesis] of pairs) {
    const r = wer(reference, hypothesis);
    substitutions += r.substitutions;
    insertions += r.insertions;
    deletions += r.deletions;
    referenceWords += r.referenceWords;
  }
  if (referenceWords === 0) throw new Error('wer: no reference words at all');
  return {
    substitutions,
    insertions,
    deletions,
    referenceWords,
    wer: (substitutions + insertions + deletions) / referenceWords,
  };
}
