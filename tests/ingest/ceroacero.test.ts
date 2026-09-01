/**
 * CA-8 — extracción de `ceroacero.es`: media fila es peor que ninguna.
 *
 * Los fixtures son SINTÉTICOS (`tests/fixtures/ceroacero.ts`, ADR-009 §3). La
 * calibración de los selectores se hizo contra el HTML archivado en `raw/`.
 */
import { describe, expect, test } from 'vitest';
import { extractCeroacero } from '@/ingest/ceroacero';
import { UnreadableRowError } from '@/ingest/ports';
import { BROKEN_ROW, FIVE_BRANCHES, ceroaceroPage } from '../fixtures/ceroacero';

const rows = extractCeroacero(ceroaceroPage(FIVE_BRANCHES));

describe('CA-8 — la forma de la página de competición', () => {
  test('1. lee una fila por partido de la jornada, y solo de la jornada', () => {
    // El fixture lleva DOS señuelos con partidos de otra competición: el
    // widget de cabecera y una segunda tabla con la misma forma de fila fuera
    // de la tarjeta de la jornada. Un selector demasiado ancho los trae.
    expect(rows).toHaveLength(5);
    expect(rows.map((r) => r.source_ref)).not.toContain('/partido/otra-liga/999');
    expect(rows.map((r) => r.home_name)).not.toContain('Outra Competición A');
  });

  test('2. la identidad es la que escribe la fuente, sin tocarla', () => {
    expect(rows.map((r) => r.source_ref)).toEqual([
      '/partido/2026-09-06-atletico-sintetico-union-ficticia/90001',
      '/partido/2026-09-06-sd-inventada-cf-suposto/90002',
      '/partido/2026-09-06-cd-exemplo-ud-mostra/90003',
      '/partido/2026-09-06-club-proba-sc-figurado/90004',
      '/partido/2026-09-06-ad-hipotese-cf-quimera/90005',
    ]);
  });

  test('3. los dos nombres son los que escribe la fuente: ni canónicos ni normalizados a la RFGF', () => {
    expect(rows.map((r) => [r.home_name, r.away_name])).toEqual([
      ['Atlético Sintético', 'Unión Ficticia'],
      ['SD Inventada', 'CF Suposto'],
      ['CD Exemplo', 'UD Mostra'],
      ['Club Proba', 'SC Figurado'],
      ['AD Hipótese', 'CF Quimera'],
    ]);
  });

  test('4. el `status` cubre las cinco ramas del modelo', () => {
    expect(rows.map((r) => r.status)).toEqual([
      'scheduled',
      'live',
      'finished',
      'postponed',
      'suspended',
    ]);
  });

  test('5. el marcador está cuando lo hay, y es null cuando no se ha jugado', () => {
    expect(rows.map((r) => [r.home_score, r.away_score])).toEqual([
      [null, null],
      [2, 1],
      [3, 0],
      [null, null],
      [1, 1],
    ]);
  });

  test('6. la hora está cuando la hay, y solo cuando la hay', () => {
    expect(rows.map((r) => r.kickoff)).toEqual(['20:00', null, null, null, null]);
  });
});

describe('CA-8 — una fila que no se puede leer entera aborta nombrándose', () => {
  test('7. una fila sin equipo visitante lanza, y el mensaje la nombra', () => {
    const page = ceroaceroPage([...FIVE_BRANCHES, BROKEN_ROW]);

    expect(() => extractCeroacero(page)).toThrow(UnreadableRowError);
    expect(() => extractCeroacero(page)).toThrow(/90006/);
  });

  test('8. y no produce media fila: no hay resultado parcial que recoger', () => {
    const page = ceroaceroPage([...FIVE_BRANCHES, BROKEN_ROW]);
    let produced: unknown = 'no se ejecutó';

    try {
      produced = extractCeroacero(page);
    } catch {
      produced = 'lanzó';
    }

    expect(produced).toBe('lanzó');
  });

  test('9. una fila con marcador declarado en juego pero sin marcador legible también aborta', () => {
    const page = ceroaceroPage([
      {
        id: '90007',
        slug: '2026-09-06-sd-media-cf-fila',
        home: 'SD Media',
        away: 'CF Fila',
        result: '',
        cellClass: 'live',
      },
    ]);

    expect(() => extractCeroacero(page)).toThrow(UnreadableRowError);
    expect(() => extractCeroacero(page)).toThrow(/90007/);
  });

  test('9b. un estado declarado que EXIGE marcador y no lo trae es media fila, y aborta', () => {
    // `Suspendido` sin marcador: el modelo dice que un partido suspendido
    // tiene marcador, la fuente no lo escribe, y la única salida honesta es
    // no producir la fila. Inventarle un 0-0 sería peor que no leerla.
    const page = ceroaceroPage([
      {
        id: '90009',
        slug: '2026-09-06-sd-suspensa-cf-sen-cifra',
        home: 'SD Suspensa',
        away: 'CF Sen Cifra',
        result: 'Suspendido',
      },
    ]);

    expect(() => extractCeroacero(page)).toThrow(UnreadableRowError);
    expect(() => extractCeroacero(page)).toThrow(/90009/);
  });

  test('10. y no se le inventa ningún valor: una celda vacía no es un 0-0', () => {
    const page = ceroaceroPage([
      {
        id: '90008',
        slug: '2026-09-06-sd-baleira-cf-nada',
        home: 'SD Baleira',
        away: 'CF Nada',
        result: '',
      },
    ]);

    expect(() => extractCeroacero(page)).toThrow(UnreadableRowError);
  });
});
