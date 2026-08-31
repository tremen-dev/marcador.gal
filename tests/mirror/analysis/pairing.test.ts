/**
 * CA-6 (RN-09) — el cruce se declara a mano y no se adivina nunca.
 *
 * Guessing contaminates the verdict in the dangerous direction: two matches
 * wrongly joined look like disagreement, and disagreement is what reads as
 * independence. So there is no similarity match anywhere — not a fuzzy one,
 * not a normalised-name one — and an identity the file does not carry stops
 * the analysis by name.
 *
 * Case 4 is `dominio.md`'s own example: "UD Ourense" ≠ "Ourense CF".
 */
import { describe, expect, test } from 'vitest';
import {
  AmbiguousPairingError,
  PairingSchema,
  UnmappedMatchError,
  buildPairingIndex,
} from '@/mirror/analysis/pairing';
import { matchId } from '@/mirror/ids';
import { caught } from '../support/caught';
import { CEROACERO, FUTGAL } from '../support/targets';
import type { ExtractedMatch } from '@/mirror/analysis/extract';

const PAIRING = PairingSchema.parse({
  window: '2026-09-05 tarde',
  matches: [
    {
      match_id: 'm-ourense-arosa',
      refs: { futgal: '4471', ceroacero: 'ca-99' },
    },
    {
      match_id: 'm-ourensecf-celta-b',
      refs: { futgal: '4472', ceroacero: 'ca-100' },
    },
  ],
});

const match = (parts: Partial<ExtractedMatch> & { source_ref: string }): ExtractedMatch => ({
  home_name: 'UD Ourense',
  away_name: 'Arosa SC',
  status: 'live',
  home_score: 0,
  away_score: 0,
  kickoff: '17:00',
  ...parts,
});

describe('CA-6 — el emparejamiento manual', () => {
  test('1. una identidad declarada resuelve al MatchId canónico', () => {
    const index = buildPairingIndex(PAIRING);

    expect(index.resolve(FUTGAL, match({ source_ref: '4471' }))).toBe(matchId('m-ourense-arosa'));
    expect(index.resolve(CEROACERO, match({ source_ref: 'ca-99' }))).toBe(
      matchId('m-ourense-arosa'),
    );
  });

  test('2. una identidad que el fichero no mapea aborta con error con nombre', () => {
    const index = buildPairingIndex(PAIRING);

    expect(() => index.resolve(FUTGAL, match({ source_ref: '9999' }))).toThrow(UnmappedMatchError);
  });

  test('3. el error nombra el partido, no solo el identificador', () => {
    const index = buildPairingIndex(PAIRING);

    const message = caught(() =>
      index.resolve(
        FUTGAL,
        match({ source_ref: '9999', home_name: 'CD Barco', away_name: 'Alondras CF' }),
      ),
    ).message;

    expect(message).toContain('CD Barco');
    expect(message).toContain('Alondras CF');
    expect(message).toContain('9999');
    expect(message).toContain('futgal');
  });

  test('4. dos equipos de nombre parecido NO se unen por parecido de cadenas', () => {
    const index = buildPairingIndex(PAIRING);

    const a = index.resolve(FUTGAL, match({ source_ref: '4471', home_name: 'UD Ourense' }));
    const b = index.resolve(FUTGAL, match({ source_ref: '4472', home_name: 'Ourense CF' }));

    expect(a).not.toBe(b);
    // And a third spelling nobody declared does not fall back to either.
    expect(() =>
      index.resolve(FUTGAL, match({ source_ref: 'ourense', home_name: 'Ourense' })),
    ).toThrow(UnmappedMatchError);
  });

  test('5. una identidad reclamada por dos partidos es un error del fichero, no un desempate', () => {
    const ambiguous = PairingSchema.parse({
      window: 'w',
      matches: [
        { match_id: 'a', refs: { futgal: '1' } },
        { match_id: 'b', refs: { futgal: '1' } },
      ],
    });

    expect(() => buildPairingIndex(ambiguous)).toThrow(AmbiguousPairingError);
  });

  test('6. el fichero se valida: una clave de más lo invalida', () => {
    expect(
      PairingSchema.safeParse({
        window: 'w',
        matches: [{ match_id: 'a', refs: { futgal: '1' }, nota: 'sobra' }],
      }).success,
    ).toBe(false);
    expect(PairingSchema.safeParse({ matches: [] }).success).toBe(false);
  });

  test('7. el índice sabe decir qué fuentes cubre cada partido', () => {
    const index = buildPairingIndex(PAIRING);

    expect(index.matchIds()).toEqual([
      matchId('m-ourense-arosa'),
      matchId('m-ourensecf-celta-b'),
    ]);
  });
});
