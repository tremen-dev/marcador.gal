/**
 * SPEC-019 CA-3.4 — `wer.ts` has tests: at least five (reference, hypothesis)
 * pairs of KNOWN WER — identical, one substitution, one insertion, one
 * deletion, and a combination — plus the declared normalisation (lower case,
 * no punctuation, no accents). Every string here is SYNTHETIC (ADR-009 §3).
 */
import { describe, expect, it } from 'vitest';
import { normalizeForWer, tokenize, wer, werAggregate } from '../src/wer.ts';

describe('normalizeForWer (CA-3.4, the declared normalisation)', () => {
  it('lower-cases, strips accents and punctuation, collapses whitespace', () => {
    expect(normalizeForWer('  Gol do ARENTEIRO!! 1–0, ¡xa!  ')).toBe('gol do arenteiro 1 0 xa');
  });

  it('keeps digits and the letters of galego (ñ is a letter, not an accent)', () => {
    expect(normalizeForWer('Señor, 3-2 no Pazo')).toBe('señor 3 2 no pazo');
  });

  it('tokenizes on whitespace after normalising', () => {
    expect(tokenize('Un, dous; TRES.')).toEqual(['un', 'dous', 'tres']);
  });
});

describe('wer (CA-3.4, five pairs of known WER)', () => {
  it('identical → 0', () => {
    const r = wer('o equipo local marca o primeiro', 'o equipo local marca o primeiro');
    expect(r).toMatchObject({ substitutions: 0, insertions: 0, deletions: 0, referenceWords: 6, wer: 0 });
  });

  it('one substitution over five words → 0.2', () => {
    const r = wer('marcou o equipo local agora', 'marcou o equipo visitante agora');
    expect(r).toMatchObject({ substitutions: 1, insertions: 0, deletions: 0, referenceWords: 5 });
    expect(r.wer).toBeCloseTo(0.2, 10);
  });

  it('one insertion over four words → 0.25', () => {
    const r = wer('un dous tres catro', 'un dous e tres catro');
    expect(r).toMatchObject({ substitutions: 0, insertions: 1, deletions: 0, referenceWords: 4 });
    expect(r.wer).toBeCloseTo(0.25, 10);
  });

  it('one deletion over four words → 0.25', () => {
    const r = wer('un dous tres catro', 'un dous catro');
    expect(r).toMatchObject({ substitutions: 0, insertions: 0, deletions: 1, referenceWords: 4 });
    expect(r.wer).toBeCloseTo(0.25, 10);
  });

  it('a combination (1 substitution + 1 insertion + 1 deletion over 6) → 0.5', () => {
    // ref: a b c d e f · hyp: a X c e f g — b→X (sub), d deleted, g inserted
    // = 3 edits over 6 reference words, and no cheaper alignment exists.
    const r = wer('a b c d e f', 'a X c e f g');
    expect(r.substitutions + r.insertions + r.deletions).toBe(3);
    expect(r).toMatchObject({ substitutions: 1, insertions: 1, deletions: 1, referenceWords: 6 });
    expect(r.wer).toBeCloseTo(0.5, 10);
  });

  it('is computed AFTER normalisation, so case, accents and punctuation cost nothing', () => {
    expect(wer('Gol de Ourense: 2-1.', 'gol de ourense 2 1').wer).toBe(0);
  });

  it('an empty reference is refused rather than divided by zero', () => {
    expect(() => wer('', 'algo')).toThrow(/reference/);
  });

  it('can exceed 1 when the hypothesis inserts more than the reference has', () => {
    expect(wer('un', 'un dous tres').wer).toBeCloseTo(2, 10);
  });
});

describe('werAggregate (the five minutes are several reference lines)', () => {
  it('sums edits and reference words over all pairs, not the mean of the WERs', () => {
    const r = werAggregate([
      ['un dous tres catro', 'un dous tres catro'], // 0 / 4
      ['a b', 'a c'], // 1 / 2
    ]);
    expect(r).toMatchObject({ substitutions: 1, insertions: 0, deletions: 0, referenceWords: 6 });
    expect(r.wer).toBeCloseTo(1 / 6, 10);
  });
});
