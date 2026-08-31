/**
 * The minimal extractor of phase B (spec, *Fuera de alcance*: identity of the
 * match, `status` and scoreboard — it resolves no alias, builds no
 * `Observation` and writes nothing to Postgres).
 *
 * It is selector-driven on purpose. The three real pages have not been seen
 * yet and cannot be invented; what CAN be written and tested today is the
 * machinery, so that the day of the window the only thing to calibrate is a
 * handful of CSS selectors, with the archive already safe (RN-10).
 */
import { describe, expect, test } from 'vitest';
import { UnextractableRowError, tableExtractor } from '@/mirror/analysis/extract';
import type { ExtractorConfig } from '@/mirror/analysis/extract';
import { FUTGAL } from '../support/targets';

const CONFIG: ExtractorConfig = {
  rowSelector: 'tr.match',
  refSelector: null,
  refAttribute: 'data-id',
  homeSelector: '.home',
  awaySelector: '.away',
  scoreSelector: '.score',
  statusSelector: '.status',
  kickoffSelector: '.kickoff',
  statusWords: {
    finalizado: 'finished',
    'en xogo': 'live',
    aprazado: 'postponed',
    suspendido: 'suspended',
    programado: 'scheduled',
  },
};

const extractor = tableExtractor(FUTGAL, CONFIG);

const html = (rows: string) =>
  new TextEncoder().encode(`<html><body><table>${rows}</table></body></html>`);

const row = (parts: {
  id: string;
  home: string;
  away: string;
  score: string;
  status: string;
  kickoff?: string;
}) => `
  <tr class="match" data-id="${parts.id}">
    <td class="home">${parts.home}</td>
    <td class="score">${parts.score}</td>
    <td class="away">${parts.away}</td>
    <td class="status">${parts.status}</td>
    <td class="kickoff">${parts.kickoff ?? ''}</td>
  </tr>`;

describe('extractor mínimo', () => {
  test('1. una fila rinde identidad, equipos, estado y marcador', () => {
    const matches = extractor.extract(
      html(
        row({
          id: '4471',
          home: 'UD Ourense',
          away: 'Arosa SC',
          score: '2-1',
          status: 'En xogo',
          kickoff: '17:00 h',
        }),
      ),
    );

    expect(matches).toEqual([
      {
        source_ref: '4471',
        home_name: 'UD Ourense',
        away_name: 'Arosa SC',
        status: 'live',
        home_score: 2,
        away_score: 1,
        kickoff: '17:00',
      },
    ]);
  });

  test('2. un partido sin jugar no tiene marcador, y eso es null, no 0', () => {
    const matches = extractor.extract(
      html(row({ id: '1', home: 'A', away: 'B', score: '-', status: 'Programado' })),
    );

    expect(matches[0]!.home_score).toBeNull();
    expect(matches[0]!.away_score).toBeNull();
    expect(matches[0]!.status).toBe('scheduled');
  });

  test('3. marcadores con espacios y guiones raros se leen igual', () => {
    const matches = extractor.extract(
      html(row({ id: '1', home: 'A', away: 'B', score: '3 – 0', status: 'Finalizado' })),
    );

    expect(matches[0]).toMatchObject({ home_score: 3, away_score: 0, status: 'finished' });
  });

  test('4. un estado desconocido se infiere del marcador, no se inventa', () => {
    const withScore = extractor.extract(
      html(row({ id: '1', home: 'A', away: 'B', score: '1-0', status: '45’' })),
    );
    const withoutScore = extractor.extract(
      html(row({ id: '2', home: 'A', away: 'B', score: '', status: '' })),
    );

    expect(withScore[0]!.status).toBe('live');
    expect(withoutScore[0]!.status).toBe('scheduled');
  });

  test('5. una fila sin identidad no se extrae a medias: falla con nombre', () => {
    const broken = new TextEncoder().encode(
      '<table><tr class="match"><td class="home">A</td><td class="away">B</td></tr></table>',
    );

    expect(() => extractor.extract(broken)).toThrow(UnextractableRowError);
  });

  test('6. varias filas conservan el orden del documento', () => {
    const matches = extractor.extract(
      html(
        row({ id: 'a', home: 'A', away: 'B', score: '0-0', status: 'En xogo' }) +
          row({ id: 'b', home: 'C', away: 'D', score: '1-1', status: 'En xogo' }),
      ),
    );

    expect(matches.map((m) => m.source_ref)).toEqual(['a', 'b']);
  });

  test('7. el kickoff se normaliza a HH:MM; sin hora reconocible, null', () => {
    const withTime = extractor.extract(
      html(row({ id: '1', home: 'A', away: 'B', score: '-', status: 'Programado', kickoff: 'Sáb. 17.30' })),
    );
    const without = extractor.extract(
      html(row({ id: '2', home: 'A', away: 'B', score: '-', status: 'Programado', kickoff: '--' })),
    );

    expect(withTime[0]!.kickoff).toBe('17:30');
    expect(without[0]!.kickoff).toBeNull();
  });
});
