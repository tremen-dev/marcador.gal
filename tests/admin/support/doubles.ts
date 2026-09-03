/**
 * Los dobles del panel, y la escena sintética sobre la que corre.
 *
 * TODOS REGISTRAN SI FUERON LLAMADOS, porque varios criterios de SPEC-017 no
 * afirman lo que pasa sino LO QUE NO PASA —CA-1.1, CA-4.2, CA-6.6, CA-7.1,
 * CA-11.2—: «401 sin invocar ningún puerto», «cero objetos crudos, cero filas»,
 * «reconocer no publica nada». Un doble que solo devuelve valores no puede
 * sostener eso.
 *
 * Y REGISTRAN EL ORDEN, porque CA-3.5 afirma uno: el `put` del objeto de la
 * acción termina ANTES de que se construya la `Observation` (RN-10).
 *
 * Nada de aquí toca la red, el reloj ni la base. La mitad con base vive en
 * `tests/db/admin-*.test.ts`, que es donde CA-4, CA-5 y CA-6 se afirman contra
 * Postgres, que es como lo pide el ledger.
 */
import { MemoryRawStore } from '../../mirror/support/memory-store';
import { MatchSchema } from '@/model/match';
import {
  ADMIN_SESSION_COOKIE,
  newSession,
  operatorDigest,
  OperatorIdSchema,
  signSession,
} from '@/admin/session';
import { signTicket } from '@/admin/ticket';
import { adminHandler } from '@/admin/handler';
import type { AdminAction } from '@/admin/archive';
import type { AdminPorts, AlertAck, AlertAckStore } from '@/admin/ports';
import type { AdminAlertReader, MatchDecisions } from '@/admin/ports';
import type { OperatorActionLog, OperatorActionRecord, TeamNameReader } from '@/admin/ports';
import type { OperatorId } from '@/admin/session';
import type { MatchStore } from '@/calendar/ports';
import type { Alert } from '@/decide/alert';
import type { EngineOutcomeSummary } from '@/decide/engine-entry';
import type { ObservationStore } from '@/db/ports';
import type { MeasurementWindow } from '@/ingest/windows';
import type { Decision } from '@/model/decision';
import type { Instant, MatchId, ObservationId, TeamId } from '@/model/ids';
import type { Match } from '@/model/match';
import type { Observation } from '@/model/observation';
import type { Clock } from '@/polite/clock';

/** El registro de llamadas: lo que sostiene las fronteras negativas. */
export class CallLog {
  readonly calls: string[] = [];

  record(name: string): number {
    this.calls.push(name);
    return this.calls.length - 1;
  }

  indexOf(name: string): number {
    return this.calls.indexOf(name);
  }

  count(name: string): number {
    return this.calls.filter((call) => call === name).length;
  }

  get empty(): boolean {
    return this.calls.length === 0;
  }
}

export class RecordingRawStore extends MemoryRawStore {
  readonly log: CallLog;

  constructor(log: CallLog) {
    super();
    this.log = log;
  }

  override async put(
    meta: Parameters<MemoryRawStore['put']>[0],
    body: Uint8Array,
  ): ReturnType<MemoryRawStore['put']> {
    const key = await super.put(meta, body);
    this.log.record(`put:${meta.competition_id}`);
    return key;
  }

  /**
   * Todo lo archivado, con su CLAVE y su META además del cuerpo. CA-3.2 dice
   * «ni un byte», y un byte también cabe en el nombre del objeto o en sus
   * metadatos, así que el recorrido no puede quedarse en el cuerpo.
   */
  async archived(): Promise<readonly { key: string; meta: string; body: string }[]> {
    const out: { key: string; meta: string; body: string }[] = [];
    for (const key of await this.list('')) {
      const object = await this.get(key);
      if (object !== null) {
        out.push({
          key,
          meta: JSON.stringify(object.meta),
          body: new TextDecoder().decode(object.body),
        });
      }
    }
    return out;
  }

  /** Todo lo archivado, decodificado. Lo que CA-3.2 recorre byte a byte. */
  async bodies(): Promise<readonly string[]> {
    const out: string[] = [];
    for (const key of await this.list('')) {
      const object = await this.get(key);
      if (object !== null) out.push(new TextDecoder().decode(object.body));
    }
    return out;
  }
}

export class MemoryObservationStore implements ObservationStore {
  readonly rows: Observation[] = [];
  readonly log: CallLog;

  constructor(log: CallLog) {
    this.log = log;
  }

  append(observation: Observation): Promise<Observation> {
    this.log.record('observations.append');
    const known = this.rows.find((row) => row.id === observation.id);
    if (known !== undefined) return Promise.resolve(known);
    this.rows.push(observation);
    return Promise.resolve(observation);
  }

  getById(id: ObservationId): Promise<Observation | null> {
    this.log.record('observations.getById');
    return Promise.resolve(this.rows.find((row) => row.id === id) ?? null);
  }

  listByMatch(matchId: MatchId): Promise<readonly Observation[]> {
    this.log.record('observations.listByMatch');
    return Promise.resolve(this.rows.filter((row) => row.match_id === matchId));
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

export class MemoryAlertReader implements AdminAlertReader {
  readonly rows: Alert[];
  readonly log: CallLog;

  constructor(log: CallLog, rows: readonly Alert[] = []) {
    this.log = log;
    this.rows = [...rows];
  }

  listByMatches(matchIds: readonly MatchId[]): Promise<readonly Alert[]> {
    this.log.record('alerts.listByMatches');
    const wanted = new Set<string>(matchIds);
    return Promise.resolve(this.rows.filter((row) => wanted.has(row.match_id)));
  }

  getById(id: number): Promise<Alert | null> {
    this.log.record('alerts.getById');
    return Promise.resolve(this.rows.find((row) => row.id === id) ?? null);
  }
}

export class MemoryAckStore implements AlertAckStore {
  readonly rows: AlertAck[] = [];
  readonly log: CallLog;

  constructor(log: CallLog) {
    this.log = log;
  }

  append(ack: AlertAck): Promise<boolean> {
    this.log.record('acks.append');
    if (this.rows.some((row) => row.alert_id === ack.alert_id)) return Promise.resolve(false);
    this.rows.push(ack);
    return Promise.resolve(true);
  }

  ackedAt(alertIds: readonly number[]): Promise<ReadonlyMap<number, Instant>> {
    this.log.record('acks.ackedAt');
    const wanted = new Set(alertIds);
    return Promise.resolve(
      new Map(
        this.rows
          .filter((row) => wanted.has(row.alert_id))
          .map((row) => [row.alert_id, row.acked_at]),
      ),
    );
  }
}

export class MemoryActionLog implements OperatorActionLog {
  readonly rows: OperatorActionRecord[] = [];
  readonly log: CallLog;

  constructor(log: CallLog) {
    this.log = log;
  }

  append(record: OperatorActionRecord): Promise<void> {
    this.log.record('actions.append');
    this.rows.push(record);
    return Promise.resolve();
  }

  listBetween(from: Instant, to: Instant): Promise<readonly OperatorActionRecord[]> {
    this.log.record('actions.listBetween');
    return Promise.resolve(
      this.rows.filter((row) => from <= row.submitted_at && row.submitted_at < to),
    );
  }
}

/** Un reloj fijo. Los instantes son cadenas ISO, nunca `Date` (ADR-006). */
export function fixedClock(now: Instant): Clock {
  return { now: () => now };
}

// ─────────────────────────────────────────────────────────────────────────────
// La escena.
// ─────────────────────────────────────────────────────────────────────────────

export const OPERATOR_ONE: OperatorId = OperatorIdSchema.parse('operador-01');
export const OPERATOR_TWO: OperatorId = OperatorIdSchema.parse('operador-02');

/** El secreto de la escena. Cumple el suelo de 32 caracteres de ADR-024 §3. */
export const SCENE_SECRET = 'un-secreto-de-mais-de-32-caracteres-para-a-escena';

/** La clave del operador de la escena. Solo su digest viaja al entorno. */
export const OPERATOR_ONE_SECRET = 'clave-do-operador-de-proba-2026';

export function sceneEnv(
  overrides: Readonly<Record<string, string | undefined>> = {},
): Readonly<Record<string, string | undefined>> {
  return {
    ADMIN_SESSION_SECRET: SCENE_SECRET,
    ADMIN_OPERATORS: JSON.stringify({
      [OPERATOR_ONE]: operatorDigest(OPERATOR_ONE_SECRET),
    }),
    ...overrides,
  };
}

export const KICKOFF: Instant = '2026-03-21T17:00:00.000Z';
export const NOW: Instant = '2026-03-21T18:00:00.000Z';

/** Una jornada declarada que contiene el `kickoff` de la escena (ADR-019 §3). */
export const SCENE_WINDOW: MeasurementWindow = {
  from: '2026-03-21T00:00:00.000Z',
  to: '2026-03-22T00:00:00.000Z',
  motive: 'Escena sintética de las suites de SPEC-017. No es una jornada real.',
};

export const SCENE_MATCH: Match = MatchSchema.parse({
  id: 'futgal-preferente-g1-2026-27-j23-celtab-ourense',
  competition_id: 'futgal-preferente-g1',
  round: 23,
  kickoff: KICKOFF,
  home_id: 'rc-celta-b',
  away_id: 'ud-ourense',
  venue: 'Barreiro',
});

/** Un partido del calendario cuyo `kickoff` cae FUERA de toda jornada (CA-11.2). */
export const OUTSIDE_MATCH: Match = MatchSchema.parse({
  ...SCENE_MATCH,
  id: 'futgal-preferente-g1-2026-27-j24-fora',
  round: 24,
  kickoff: '2026-04-04T17:00:00.000Z',
});

export interface SceneOptions {
  readonly windows?: readonly MeasurementWindow[] | undefined;
  readonly matches?: readonly Match[] | undefined;
  readonly alerts?: readonly Alert[] | undefined;
  readonly decisions?: ReadonlyMap<string, MatchDecisions> | undefined;
  readonly now?: Instant | undefined;
}

export interface Scene {
  readonly log: CallLog;
  readonly store: RecordingRawStore;
  readonly observations: MemoryObservationStore;
  readonly matches: MemoryMatchStore;
  readonly teams: MemoryTeamNames;
  readonly alerts: MemoryAlertReader;
  readonly acks: MemoryAckStore;
  readonly actions: MemoryActionLog;
  readonly engineCalls: { match_id: MatchId; now: Instant }[];
  readonly ports: AdminPorts;
}

const NO_DECISIONS: MatchDecisions = { live: null, log: [] };

/** La escena entera, con todos sus puertos registrando. */
export function scene(options: SceneOptions = {}): Scene {
  const log = new CallLog();
  const store = new RecordingRawStore(log);
  const observations = new MemoryObservationStore(log);
  const matches = new MemoryMatchStore(log, options.matches ?? [SCENE_MATCH, OUTSIDE_MATCH]);
  const teams = new MemoryTeamNames(log, {
    'rc-celta-b': 'RC Celta B',
    'ud-ourense': 'UD Ourense',
  });
  const alerts = new MemoryAlertReader(log, options.alerts ?? []);
  const acks = new MemoryAckStore(log);
  const actions = new MemoryActionLog(log);
  const engineCalls: { match_id: MatchId; now: Instant }[] = [];
  const decisions = options.decisions ?? new Map<string, MatchDecisions>();

  const ports: AdminPorts = {
    store,
    observations,
    matches,
    teams,
    alerts,
    acks,
    actions,
    clock: fixedClock(options.now ?? NOW),
    windows: options.windows ?? [SCENE_WINDOW],
    runEngine: (matchId: MatchId, at: Instant): Promise<EngineOutcomeSummary> => {
      log.record('runEngine');
      engineCalls.push({ match_id: matchId, now: at });
      return Promise.resolve({
        match_id: matchId,
        decided: true,
        provisional: false,
        alerts: 0,
        abandoned: false,
        reason: null,
      });
    },
    readDecisions: (matchId: MatchId): Promise<MatchDecisions> => {
      log.record('readDecisions');
      return Promise.resolve(decisions.get(matchId) ?? NO_DECISIONS);
    },
  };

  return { log, store, observations, matches, teams, alerts, acks, actions, engineCalls, ports };
}

/** Una `Decision` vigente sintética, para las escenas que necesitan una. */
export function liveDecision(overrides: Partial<Decision> = {}): Decision {
  return {
    match_id: SCENE_MATCH.id,
    status: 'live',
    home_score: 1,
    away_score: 0,
    provisional: true,
    rule: 'RN-03',
    decided_at: '2026-03-21T17:40:00.000Z',
    supporting_observation_ids: ['obs-0001'],
    version: 1,
    ...overrides,
  } as Decision;
}

// ─────────────────────────────────────────────────────────────────────────────
// El transporte: peticiones al panel, tal y como las hace un navegador.
// ─────────────────────────────────────────────────────────────────────────────

/** Una sesión válida de `operador-01` en el instante de la escena. */
export function sessionTokenOf(now: Instant = NOW, who: OperatorId = OPERATOR_ONE): string {
  return signSession(SCENE_SECRET, newSession(who, now));
}

export function cookieHeader(token: string): string {
  return `${ADMIN_SESSION_COOKIE}=${token}`;
}

export interface PostOptions {
  readonly fields: Readonly<Record<string, string>>;
  readonly token?: string | undefined;
  readonly locale?: 'gl' | 'es' | undefined;
  readonly env?: Readonly<Record<string, string | undefined>> | undefined;
  /**
   * Las cabeceras que un navegador manda de verdad —`user-agent`, la IP que
   * pone el proxy, el `referer`— y que CA-3.2 exige que NO aparezcan en ningún
   * byte de lo archivado. Sin esto, los `not.toContain` de ese criterio son
   * vacuos: no se puede afirmar que no aparece algo que nunca entró
   * (F-SPEC-017-V1).
   */
  readonly headers?: Readonly<Record<string, string>> | undefined;
  /** La URL del envío. CA-7.4 la necesita para mandar el vale EN LA QUERY. */
  readonly url?: string | undefined;
}

/** La petición tal y como la construye un navegador, cabeceras incluidas. */
export function panelRequest(options: PostOptions): Request {
  const token = options.token ?? sessionTokenOf();
  const headers = new Headers({ 'content-type': 'application/x-www-form-urlencoded' });
  if (token.length > 0) headers.set('cookie', cookieHeader(token));
  for (const [name, value] of Object.entries(options.headers ?? {})) headers.set(name, value);

  return new Request(options.url ?? 'https://marcador.gal/admin', {
    method: 'POST',
    headers,
    body: new URLSearchParams(options.fields).toString(),
  });
}

/** Un envío del panel: `POST` con formulario, y la cookie que trae el navegador. */
export async function postToPanel(built: Scene, options: PostOptions): Promise<Response> {
  return await adminHandler({
    ports: built.ports,
    env: options.env ?? sceneEnv(),
    locale: options.locale ?? 'gl',
  })(panelRequest(options));
}

/** Un `GET` del panel con sesión. Lo que sirve el tablero y sus vales. */
export async function getPanel(
  built: Scene,
  options: { readonly token?: string | undefined; readonly url?: string | undefined } = {},
): Promise<Response> {
  const token = options.token ?? sessionTokenOf();
  const headers = new Headers({ cookie: cookieHeader(token) });

  return await adminHandler({ ports: built.ports, env: sceneEnv(), locale: 'gl' })(
    new Request(options.url ?? 'https://marcador.gal/admin', { headers }),
  );
}

/** Un vale firmado con el secreto de la escena. */
export function ticketOf(
  action: AdminAction,
  target: string,
  issuedAt: Instant = NOW,
  who: OperatorId = OPERATOR_ONE,
): string {
  return signTicket(SCENE_SECRET, { operator_id: who, action, target, issued_at: issuedAt });
}
