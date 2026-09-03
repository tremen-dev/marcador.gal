/**
 * CA-6.1 — LOS CUATRO FILTROS, cada uno por separado, con su partido que entra
 * y su partido que no (ADR-017, ADR-022 §5, ADR-019 §3).
 *
 * Y CA-8.6 en su mitad pura: las cinco ramas de estado se pueden producir desde
 * el bot, `postponed` y `suspended` incluidas, porque RN-06 las concede a la
 * fuente oficial **o a un humano** y el corresponsal es humano (RN-01).
 */
import { describe, expect, test } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import { inMeasurementWindow } from '@/ingest/windows';
import { candidatesFor, inCorrespondentWindow, matchdayIsOpen } from '@/bot/candidates';
import { CORRESPONDENT_WINDOW } from '@/bot/windows';
import { validateProposal } from '@/bot/proposal';
import { MATCH_STATUSES } from '@/model/match';
import {
  COMPETITION,
  DECLARED_MATCHDAY,
  FOREIGN_MATCH_ID,
  HOME_NAME,
  AWAY_NAME,
  KICKOFF,
  MATCH_ID,
  NOW,
  OTHER_MATCH_ID,
  syntheticMatches,
} from './support/doubles';
import type { NamedMatch } from '@/bot/candidates';
import type { Instant } from '@/model/ids';

const NAMED: readonly NamedMatch[] = syntheticMatches().map((match) => ({
  match,
  home: HOME_NAME,
  away: AWAY_NAME,
}));

const base = {
  matches: NAMED,
  competitions: [COMPETITION],
  windows: DECLARED_MATCHDAY,
  at: NOW as Instant,
};

describe('CA-6.1 — filtro 1: el partido está en el CALENDARIO DECLARADO', () => {
  test('1. lo que no está en el calendario no es candidato, y no hay otra vía', () => {
    expect(candidatesFor({ ...base, matches: [] })).toEqual([]);
    expect(candidatesFor(base).length).toBe(2);
  });
});

describe('CA-6.1 — filtro 2: la ventana DEL CORRESPONSAL', () => {
  test('2. dentro de la ventana entra; tres horas y un minuto antes, no', () => {
    const inside = new Date(
      Date.parse(KICKOFF) - CORRESPONDENT_WINDOW.preMs + 60_000,
    ).toISOString() as Instant;
    const outside = new Date(
      Date.parse(KICKOFF) - CORRESPONDENT_WINDOW.preMs - 60_000,
    ).toISOString() as Instant;

    expect(inCorrespondentWindow(KICKOFF, inside)).toBe(true);
    expect(inCorrespondentWindow(KICKOFF, outside)).toBe(false);
    expect(candidatesFor({ ...base, at: outside })).toEqual([]);
  });

  test('3. y después del POST tampoco', () => {
    const after = new Date(
      Date.parse(KICKOFF) + CORRESPONDENT_WINDOW.postMs,
    ).toISOString() as Instant;
    expect(inCorrespondentWindow(KICKOFF, after)).toBe(false);
    expect(candidatesFor({ ...base, at: after })).toEqual([]);
  });

  test('4. la ventana del corresponsal es MÁS ANCHA que la del tick, y por eso existe', () => {
    // Una persona puede avisar de un aplazamiento dos horas antes de la hora
    // prevista; a un tercero no se le pide nada tan pronto (ADR-019 §2).
    expect(CORRESPONDENT_WINDOW.preMs).toBeGreaterThan(10 * 60 * 1000);
    expect(CORRESPONDENT_WINDOW.postMs).toBeGreaterThan(150 * 60 * 1000);
  });
});

describe('CA-6.1 — filtro 3: las competiciones QUE EL CATÁLOGO declara', () => {
  test('5. el partido de otra competición no es candidato aunque esté en ventana', () => {
    const ids = candidatesFor(base).map((candidate) => candidate.match_id);
    expect(ids).toContain(MATCH_ID);
    expect(ids).toContain(OTHER_MATCH_ID);
    expect(ids).not.toContain(FOREIGN_MATCH_ID);
  });

  test('6. y si el catálogo la declara, sí lo es', () => {
    const ids = candidatesFor({
      ...base,
      competitions: [COMPETITION, 'rfef-tercera-g1'],
    }).map((candidate) => candidate.match_id);
    expect(ids).toContain(FOREIGN_MATCH_ID);
  });
});

describe('CA-6.1 — filtro 4: la JORNADA DE MEDICIÓN declarada', () => {
  test('7. con la lista vacía no hay candidatos, calendario cargado o no', () => {
    expect(candidatesFor({ ...base, windows: [] })).toEqual([]);
    expect(matchdayIsOpen({ ...base, windows: [] })).toBe(false);
  });

  test('8. con una jornada que NO cubre el kickoff, tampoco', () => {
    const elsewhere = [
      { from: '2026-04-01T00:00:00.000Z', to: '2026-04-02T00:00:00.000Z', motive: 'otra' },
    ];
    expect(candidatesFor({ ...base, windows: elsewhere })).toEqual([]);
  });

  test('9. con la jornada inyectada, sí', () => {
    expect(matchdayIsOpen(base)).toBe(true);
    expect(candidatesFor(base).length).toBe(2);
  });
});

describe('CA-13.3 — la comprobación usa LA FUNCIÓN QUE YA EXISTE', () => {
  test('9b. `matchdayIsOpen` y `candidatesFor` llaman a `inMeasurementWindow`, no a una copia', async () => {
    const source = await readFile('src/bot/candidates.ts', 'utf8');
    expect(source).toContain("from '@/ingest/windows'");
    expect(source).toContain('inMeasurementWindow');

    // Y NO hay una segunda implementación en ningún fichero de `src/bot/`: lo
    // que se busca es la aritmética de un intervalo `[from, to)` sobre
    // `windows`, que es lo que una copia tendría que escribir.
    const files = await readdir('src/bot');
    const offenders: string[] = [];
    for (const file of files.filter((name) => name.endsWith('.ts'))) {
      const text = await readFile(`src/bot/${file}`, 'utf8');
      const code = text.replaceAll(/\/\*[\s\S]*?\*\//g, '').replaceAll(/^\s*\/\/.*$/gm, '');
      if (/\.from\b[\s\S]{0,80}\.to\b/.test(code)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });

  test('9c. control positivo: la misma comprobación sobre la función real da lo mismo', () => {
    // Si `matchdayIsOpen` tuviese una aritmética propia, este caso y el 7/9 de
    // arriba podrían discrepar. Se corre la función heredada al lado.
    expect(inMeasurementWindow(KICKOFF, DECLARED_MATCHDAY)).toBe(matchdayIsOpen(base));
    expect(inMeasurementWindow(KICKOFF, [])).toBe(matchdayIsOpen({ ...base, windows: [] }));
  });
});

describe('CA-6.5 — los candidatos llevan el nombre CANÓNICO y el `match_id`', () => {
  test('10. nada del texto de la persona entra aquí', () => {
    const [first] = candidatesFor(base);
    expect(first?.home).toBe(HOME_NAME);
    expect(first?.away).toBe(AWAY_NAME);
    expect(first?.match_id).toBe(MATCH_ID);
    expect(first?.kickoff).toBe(KICKOFF);
  });
});

describe('CA-8.6 — las cinco ramas de estado se pueden producir desde el bot', () => {
  const candidates = candidatesFor(base);

  for (const status of MATCH_STATUSES) {
    test(`11. rama \`${status}\``, () => {
      const scored = status === 'live' || status === 'finished' || status === 'suspended';
      const outcome = validateProposal(
        Buffer.from(
          JSON.stringify({
            match_id: MATCH_ID,
            status,
            home_score: scored ? 1 : null,
            away_score: scored ? 0 : null,
            minute: scored ? 55 : null,
          }),
          'utf8',
        ),
        candidates,
      );

      expect(outcome).toMatchObject({ ok: true, proposal: { status } });
    });
  }

  test('12. y `postponed` y `suspended` NO son un caso especial: RN-06 los da a un humano', () => {
    // «Humano en RN-04 y RN-06 son los dos» (RN-01). Con la fuente oficial no
    // capturable (ADR-008 §1), SOLO PUEDE APLAZAR UNA PERSONA.
    expect(MATCH_STATUSES).toContain('postponed');
    expect(MATCH_STATUSES).toContain('suspended');
  });
});
