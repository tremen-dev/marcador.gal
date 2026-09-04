/**
 * Los dobles del marcador, y la escena sintética sobre la que corre.
 *
 * TODOS REGISTRAN SI FUERON LLAMADOS Y CUÁNTAS VECES, porque varios criterios
 * de SPEC-018 no afirman lo que pasa sino LO QUE NO PASA —CA-3.2 («cero
 * consultas»), CA-3.7 («404 con cero lecturas»), CA-4.1 («no escribe nada»),
 * CA-6.3 («el número de consultas no crece con el número de partidos»)—. Un
 * doble que solo devuelve valores no puede sostener eso.
 *
 * Nada de aquí toca la red, el reloj ni la base. La mitad con base vive en
 * `tests/db/board-batch.test.ts`, que es donde CA-6.4 se afirma contra
 * Postgres.
 */
import { DecisionSchema } from '@/model/decision';
import { MatchSchema } from '@/model/match';
import { ObservationSchema } from '@/model/observation';
import type { BoardMatchRead, BoardPorts, CompetitionNameReader, TeamNameReader } from '@/api/ports';
import type { MatchStore } from '@/calendar/ports';
import type { MeasurementWindow } from '@/ingest/windows';
import type { Decision } from '@/model/decision';
import type { CompetitionId, Instant, MatchId, TeamId } from '@/model/ids';
import type { Match } from '@/model/match';
import type { Observation } from '@/model/observation';
import type { Clock } from '@/polite/clock';

/** El registro de llamadas: lo que sostiene las fronteras negativas. */
export class CallLog {
  readonly calls: string[] = [];

  record(name: string): void {
    this.calls.push(name);
  }

  count(name: string): number {
    return this.calls.filter((call) => call === name).length;
  }

  get empty(): boolean {
    return this.calls.length === 0;
  }
}

export class MemoryMatchStore implements MatchStore {
  readonly matches: readonly Match[];
  readonly log: CallLog;

  constructor(log: CallLog, matches: readonly Match[]) {
    this.log = log;
    this.matches = matches;
  }

  getById(id: MatchId): Promise<Match | null> {
    this.log.record('matches.getById');
    return Promise.resolve(this.matches.find((match) => match.id === id) ?? null);
  }

  listByRound(): Promise<readonly Match[]> {
    this.log.record('matches.listByRound');
    return Promise.resolve([]);
  }

  listByTeams(): Promise<readonly Match[]> {
    this.log.record('matches.listByTeams');
    return Promise.resolve([]);
  }

  listKickoffsBetween(from: Instant, to: Instant): Promise<readonly Match[]> {
    this.log.record('matches.listKickoffsBetween');
    return Promise.resolve(
      this.matches.filter((match) => from <= match.kickoff && match.kickoff < to),
    );
  }
}

export class MemoryTeamNames implements TeamNameReader {
  readonly names: ReadonlyMap<string, string>;
  readonly log: CallLog;

  constructor(log: CallLog, names: Readonly<Record<string, string>>) {
    this.log = log;
    this.names = new Map(Object.entries(names));
  }

  namesOf(ids: readonly TeamId[]): Promise<ReadonlyMap<TeamId, string>> {
    this.log.record('teams.namesOf');
    const found = new Map<TeamId, string>();
    for (const id of ids) {
      const name = this.names.get(id);
      if (name !== undefined) found.set(id, name);
    }
    return Promise.resolve(found);
  }
}

export class MemoryCompetitionNames implements CompetitionNameReader {
  readonly names: ReadonlyMap<string, string>;
  readonly log: CallLog;

  constructor(log: CallLog, names: Readonly<Record<string, string>>) {
    this.log = log;
    this.names = new Map(Object.entries(names));
  }

  namesOf(ids: readonly CompetitionId[]): Promise<ReadonlyMap<CompetitionId, string>> {
    this.log.record('competitions.namesOf');
    const found = new Map<CompetitionId, string>();
    for (const id of ids) {
      const name = this.names.get(id);
      if (name !== undefined) found.set(id, name);
    }
    return Promise.resolve(found);
  }
}

/** Un reloj fijo. Los instantes son cadenas ISO, nunca `Date` (ADR-006). */
export function fixedClock(now: Instant): Clock {
  return { now: () => now };
}

// ─────────────────────────────────────────────────────────────────────────────
// La escena.
// ─────────────────────────────────────────────────────────────────────────────

export const KICKOFF: Instant = '2026-09-06T17:00:00.000Z';
export const NOW: Instant = '2026-09-06T18:00:00.000Z';

/** Una jornada declarada que contiene los `kickoff` de la escena. */
export const SCENE_WINDOW: MeasurementWindow = {
  from: '2026-09-06T00:00:00.000Z',
  to: '2026-09-07T00:00:00.000Z',
  motive: 'Escena sintética de las suites de SPEC-018. No es una jornada real.',
};

export const PREFERENTE = 'futgal-preferente-g1';
export const TERCEIRA = 'rfef-tercera-g1';

export const COMPETITION_NAMES: Readonly<Record<string, string>> = {
  [PREFERENTE]: 'Preferente Futgal Grupo 1',
  [TERCEIRA]: 'Terceira RFEF Grupo 1',
};

export const TEAM_NAMES: Readonly<Record<string, string>> = {
  'rc-celta-b': 'RC Celta B',
  'ud-ourense': 'UD Ourense',
  'cd-lugo-b': 'CD Lugo B',
  'sd-compostela': 'SD Compostela',
  'racing-ferrol-b': 'Racing de Ferrol B',
  'cd-barco': 'CD Barco',
};

export function sceneMatch(overrides: Readonly<Record<string, unknown>> = {}): Match {
  return MatchSchema.parse({
    id: 'futgal-preferente-g1-2026-27-j1-celtab-ourense',
    competition_id: PREFERENTE,
    round: 1,
    kickoff: KICKOFF,
    home_id: 'rc-celta-b',
    away_id: 'ud-ourense',
    venue: 'Barreiro',
    ...overrides,
  });
}

/** Los tres partidos de la escena base: dos competiciones, tres horas. */
export const SCENE_MATCHES: readonly Match[] = [
  sceneMatch(),
  sceneMatch({
    id: 'futgal-preferente-g1-2026-27-j1-compostela-barco',
    round: 1,
    kickoff: '2026-09-06T18:30:00.000Z',
    home_id: 'sd-compostela',
    away_id: 'cd-barco',
  }),
  sceneMatch({
    id: 'rfef-tercera-g1-2026-27-j1-lugob-ferrolb',
    competition_id: TERCEIRA,
    round: 1,
    kickoff: '2026-09-06T16:00:00.000Z',
    home_id: 'cd-lugo-b',
    away_id: 'racing-ferrol-b',
  }),
];

/** Una `Decision` vigente sintética, para las escenas que necesitan una. */
export function liveDecision(overrides: Readonly<Record<string, unknown>> = {}): Decision {
  return DecisionSchema.parse({
    match_id: SCENE_MATCHES[0]!.id,
    status: 'live',
    home_score: 1,
    away_score: 0,
    provisional: true,
    rule: 'RN-03',
    decided_at: '2026-09-06T17:40:00.000Z',
    supporting_observation_ids: ['obs-1'],
    version: 1,
    ...overrides,
  });
}

/** Una `Observation` sintética que sostiene una `Decision`. */
export function observation(overrides: Readonly<Record<string, unknown>> = {}): Observation {
  return ObservationSchema.parse({
    id: 'obs-1',
    match_id: SCENE_MATCHES[0]!.id,
    source: 'ceroacero',
    observed_at: '2026-09-06T17:38:00.000Z',
    status: 'live',
    home_score: 1,
    away_score: 0,
    confidence: 0.7,
    // La forma que produce `rawKey()`. Lleva el NOMBRE DE LA FUENTE dentro de
    // la cadena (ADR-009), que es por lo que CA-5.3 prohíbe publicarlo.
    raw_ref:
      'ceroacero/futgal-preferente-g1/2026-09-06/2026-09-06t17-38-00z-0123456789ab.html',
    ...overrides,
  });
}

export interface SceneOptions {
  readonly windows?: readonly MeasurementWindow[] | undefined;
  readonly matches?: readonly Match[] | undefined;
  readonly reads?: readonly BoardMatchRead[] | undefined;
  readonly now?: Instant | undefined;
}

export interface Scene {
  readonly log: CallLog;
  readonly ports: BoardPorts;
  readonly matchIdsAsked: MatchId[][];
}

/** La escena entera, con todos sus puertos registrando. */
export function scene(options: SceneOptions = {}): Scene {
  const log = new CallLog();
  const matchIdsAsked: MatchId[][] = [];
  const reads = options.reads ?? [];

  const ports: BoardPorts = {
    matches: new MemoryMatchStore(log, options.matches ?? SCENE_MATCHES),
    teams: new MemoryTeamNames(log, TEAM_NAMES),
    competitions: new MemoryCompetitionNames(log, COMPETITION_NAMES),
    windows: options.windows ?? [SCENE_WINDOW],
    readBoard: (matchIds: readonly MatchId[]) => {
      log.record('readBoard');
      matchIdsAsked.push([...matchIds]);
      return Promise.resolve(
        matchIds.map(
          (matchId) =>
            reads.find((read) => read.match_id === matchId) ?? {
              match_id: matchId,
              live: null,
              supporting: [],
            },
        ),
      );
    },
    clock: fixedClock(options.now ?? NOW),
  };

  return { log, ports, matchIdsAsked };
}

/** Una petición GET al marcador o al contrato. */
export function get(url: string, headers: Readonly<Record<string, string>> = {}): Request {
  return new Request(url, { method: 'GET', headers });
}
