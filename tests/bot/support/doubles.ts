/**
 * Los dobles del bot, y la escena sintética sobre la que corre.
 *
 * TODOS REGISTRAN SI FUERON LLAMADOS, porque tres criterios de SPEC-015 no
 * afirman lo que pasa sino LO QUE NO PASA —CA-1.1, CA-2.1 y CA-13—: «cero
 * objetos crudos, cero filas, ninguna llamada al modelo». Un doble que solo
 * devuelve valores no puede sostener eso.
 *
 * Y REGISTRAN INSTANTES, porque CA-4.1 afirma un ORDEN: el `put` del mensaje
 * termina ANTES de que se construya el prompt, y el `put` de la respuesta del
 * modelo ANTES de que se valide con zod (RN-10).
 *
 * Nada de aquí toca la red, el reloj ni la base. La mitad con base vive en
 * `tests/db/bot-*.test.ts`, que es donde CA-7.1 se afirma contra Postgres, que
 * es como lo pide el ledger.
 */
import { MemoryRawStore } from '../../mirror/support/memory-store';
import { CORRESPONDENT_WINDOW } from '@/bot/windows';
import { parseCatalog } from '@/bot/correspondents';
import type { BotPorts } from '@/bot/webhook';
import type { CorrespondentId } from '@/bot/correspondents';
import type { ModelAnswer, ModelPort } from '@/bot/llm';
import type {
  CorrespondentState,
  CorrespondentStateStore,
  PendingProposal,
  ProposalStore,
  RejectionCounter,
  RejectionReason,
  TeamNameStore,
} from '@/bot/ports';
import type { MatchStore } from '@/calendar/ports';
import type { ObservationStore } from '@/db/ports';
import type { EngineOutcomeSummary } from '@/decide/engine-entry';
import type { MeasurementWindow } from '@/ingest/windows';
import type { Instant, MatchId, ObservationId, TeamId } from '@/model/ids';
import type { Match } from '@/model/match';
import type { Observation } from '@/model/observation';

/** El registro de llamadas: lo que sostiene las tres fronteras negativas. */
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
}

export class MemoryProposalStore implements ProposalStore {
  readonly rows = new Map<string, PendingProposal>();

  put(proposal: PendingProposal): Promise<PendingProposal> {
    this.rows.set(proposal.id, proposal);
    return Promise.resolve(proposal);
  }

  getById(id: string): Promise<PendingProposal | null> {
    return Promise.resolve(this.rows.get(id) ?? null);
  }

  remove(id: string): Promise<boolean> {
    return Promise.resolve(this.rows.delete(id));
  }

  removeExpired(at: Instant): Promise<number> {
    let removed = 0;
    for (const [id, row] of new Map(this.rows)) {
      if (row.expires_at <= at) {
        this.rows.delete(id);
        removed += 1;
      }
    }
    return Promise.resolve(removed);
  }

  latestOf(correspondentId: CorrespondentId): Promise<PendingProposal | null> {
    const mine = [...this.rows.values()]
      .filter((row) => row.correspondent_id === correspondentId)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return Promise.resolve(mine[0] ?? null);
  }

  pick(id: string, matchId: MatchId): Promise<PendingProposal | null> {
    const row = this.rows.get(id);
    if (row === undefined || row.match_id !== null) return Promise.resolve(null);
    const picked: PendingProposal = { ...row, match_id: matchId };
    this.rows.set(id, picked);
    return Promise.resolve(picked);
  }
}

export class MemoryStateStore implements CorrespondentStateStore {
  readonly rows = new Map<string, CorrespondentState>();

  get(id: CorrespondentId): Promise<CorrespondentState | null> {
    return Promise.resolve(this.rows.get(id) ?? null);
  }

  #upsert(id: CorrespondentId, patch: Partial<CorrespondentState>): void {
    const current = this.rows.get(id) ?? {
      correspondent_id: id,
      locale: null,
      notice_sent_at: null,
      opted_out_at: null,
    };
    this.rows.set(id, { ...current, ...patch });
  }

  setLocale(id: CorrespondentId, locale: 'gl' | 'es'): Promise<void> {
    this.#upsert(id, { locale });
    return Promise.resolve();
  }

  markNoticeSent(id: CorrespondentId, at: Instant): Promise<void> {
    if (this.rows.get(id)?.notice_sent_at == null) this.#upsert(id, { notice_sent_at: at });
    return Promise.resolve();
  }

  optOut(id: CorrespondentId, at: Instant): Promise<void> {
    this.#upsert(id, { opted_out_at: at });
    return Promise.resolve();
  }
}

export class MemoryRejectionCounter implements RejectionCounter {
  readonly counts = new Map<RejectionReason, number>();

  record(reason: RejectionReason): Promise<void> {
    this.counts.set(reason, (this.counts.get(reason) ?? 0) + 1);
    return Promise.resolve();
  }

  get total(): number {
    return [...this.counts.values()].reduce((sum, count) => sum + count, 0);
  }
}

export class MemoryObservationStore implements ObservationStore {
  readonly rows: Observation[] = [];

  append(observation: Observation): Promise<Observation> {
    const known = this.rows.find((row) => row.id === observation.id);
    if (known !== undefined) return Promise.resolve(known);
    this.rows.push(observation);
    return Promise.resolve(observation);
  }

  getById(id: ObservationId): Promise<Observation | null> {
    return Promise.resolve(this.rows.find((row) => row.id === id) ?? null);
  }

  listByMatch(matchId: MatchId): Promise<readonly Observation[]> {
    return Promise.resolve(this.rows.filter((row) => row.match_id === matchId));
  }
}

export class MemoryMatchStore implements MatchStore {
  readonly matches: readonly Match[];

  constructor(matches: readonly Match[]) {
    this.matches = matches;
  }

  getById(id: MatchId): Promise<Match | null> {
    return Promise.resolve(this.matches.find((match) => match.id === id) ?? null);
  }

  listByRound(): Promise<readonly Match[]> {
    return Promise.resolve([]);
  }

  listByTeams(): Promise<readonly Match[]> {
    return Promise.resolve([]);
  }

  listKickoffsBetween(from: Instant, to: Instant): Promise<readonly Match[]> {
    return Promise.resolve(
      this.matches.filter((match) => from <= match.kickoff && match.kickoff < to),
    );
  }
}

export class MemoryTeamNames implements TeamNameStore {
  readonly names: ReadonlyMap<string, string>;

  constructor(names: Readonly<Record<string, string>>) {
    this.names = new Map(Object.entries(names));
  }

  namesOf(ids: readonly TeamId[]): Promise<ReadonlyMap<TeamId, string>> {
    const found = new Map<TeamId, string>();
    for (const id of ids) {
      const name = this.names.get(id);
      if (name !== undefined) found.set(id, name);
    }
    return Promise.resolve(found);
  }
}

/**
 * EL DOBLE DEL MODELO. Con él en su sitio, los otros catorce criterios avanzan
 * sin proveedor elegido (ADR-023 §6.4): sustituirlo por un adaptador real no
 * toca una sola aserción, que es lo que CA-5.9 exige.
 */
export class FakeModel implements ModelPort {
  readonly log: CallLog;
  readonly prompts: string[] = [];
  #answer: ModelAnswer;

  constructor(log: CallLog, answer: ModelAnswer) {
    this.log = log;
    this.#answer = answer;
  }

  answerWith(answer: ModelAnswer): void {
    this.#answer = answer;
  }

  propose(prompt: string): Promise<ModelAnswer> {
    this.log.record('model');
    this.prompts.push(prompt);
    return Promise.resolve(this.#answer);
  }

  get calls(): number {
    return this.log.count('model');
  }
}

export function jsonAnswer(value: unknown): ModelAnswer {
  return { ok: true, body: Buffer.from(JSON.stringify(value), 'utf8') };
}

export function rawAnswer(text: string): ModelAnswer {
  return { ok: true, body: Buffer.from(text, 'utf8') };
}

// ─────────────────────────────────────────────────────────────────────────────
// La escena sintética.
// ─────────────────────────────────────────────────────────────────────────────

export const SEASON = '2026/27';
export const COMPETITION = 'futgal-preferente-g1';
export const OTHER_COMPETITION = 'rfef-tercera-g1';
export const HOME_ID = 'ud-ourense';
export const AWAY_ID = 'rc-celta-b';
export const HOME_NAME = 'UD Ourense';
export const AWAY_NAME = 'Celta B';

export const KICKOFF = '2026-03-21T17:00:00.000Z';
export const NOW = '2026-03-21T17:35:00.000Z';

export const MATCH_ID = 'futgal-preferente-g1-2026-27-j23-ourense-celta';
export const OTHER_MATCH_ID = 'futgal-preferente-g1-2026-27-j23-other';
export const FOREIGN_MATCH_ID = 'rfef-tercera-g1-2026-27-j23-foreign';

export const CORRESPONDENT_ID = 'corresponsal-01';

export function syntheticMatches(): readonly Match[] {
  return [
    {
      id: MATCH_ID as MatchId,
      competition_id: COMPETITION as Match['competition_id'],
      round: 23,
      kickoff: KICKOFF,
      home_id: HOME_ID as TeamId,
      away_id: AWAY_ID as TeamId,
      venue: 'O Couto',
    },
    {
      id: OTHER_MATCH_ID as MatchId,
      competition_id: COMPETITION as Match['competition_id'],
      round: 23,
      kickoff: KICKOFF,
      home_id: AWAY_ID as TeamId,
      away_id: HOME_ID as TeamId,
      venue: null,
    },
    {
      // Otra competición: entra en la ventana y NO es candidato (CA-6.1).
      id: FOREIGN_MATCH_ID as MatchId,
      competition_id: OTHER_COMPETITION as Match['competition_id'],
      round: 23,
      kickoff: KICKOFF,
      home_id: HOME_ID as TeamId,
      away_id: AWAY_ID as TeamId,
      venue: null,
    },
  ];
}

/** Una jornada declarada que cubre el `kickoff` de la escena. */
export const DECLARED_MATCHDAY: readonly MeasurementWindow[] = [
  {
    from: '2026-03-21T00:00:00.000Z',
    to: '2026-03-22T00:00:00.000Z',
    motive: 'jornada sintética de prueba; no es una jornada declarada de producción',
  },
];

export const TEST_CATALOG = parseCatalog({
  season: SEASON,
  correspondents: [
    { correspondent_id: CORRESPONDENT_ID, competitions: [COMPETITION], alta: '2026-03-01', activo: true },
    { correspondent_id: 'corresponsal-02', competitions: [COMPETITION], alta: '2026-03-01', activo: false },
    { correspondent_id: 'corresponsal-03', competitions: [COMPETITION], alta: '2026-03-01', activo: true },
  ],
});

export const SENDER_ID = 4242;
export const INACTIVE_SENDER_ID = 4343;
export const SECOND_SENDER_ID = 4444;
export const UNKNOWN_SENDER_ID = 9999;

export const TEST_MAP: ReadonlyMap<string, CorrespondentId> = new Map([
  [`${SENDER_ID}`, CORRESPONDENT_ID as CorrespondentId],
  [`${INACTIVE_SENDER_ID}`, 'corresponsal-02' as CorrespondentId],
  [`${SECOND_SENDER_ID}`, 'corresponsal-03' as CorrespondentId],
]);

export interface Scene {
  readonly ports: BotPorts;
  readonly log: CallLog;
  readonly store: RecordingRawStore;
  readonly proposals: MemoryProposalStore;
  readonly state: MemoryStateStore;
  readonly rejections: MemoryRejectionCounter;
  readonly observations: MemoryObservationStore;
  readonly model: FakeModel;
  readonly engineCalls: MatchId[];
}

export interface SceneOptions {
  readonly windows?: readonly MeasurementWindow[];
  readonly answer?: ModelAnswer;
  readonly now?: Instant;
  readonly noticeSent?: boolean;
}

/** Una escena entera, con la jornada declarada INYECTADA salvo que se diga otra cosa. */
export function scene(options: SceneOptions = {}): Scene {
  const log = new CallLog();
  const store = new RecordingRawStore(log);
  const proposals = new MemoryProposalStore();
  const state = new MemoryStateStore();
  const rejections = new MemoryRejectionCounter();
  const observations = new MemoryObservationStore();
  const model = new FakeModel(
    log,
    options.answer ??
      jsonAnswer({ match_id: MATCH_ID, status: 'live', home_score: 2, away_score: 1, minute: 70 }),
  );
  const engineCalls: MatchId[] = [];
  const now = options.now ?? NOW;

  if (options.noticeSent !== false) {
    void state.markNoticeSent(CORRESPONDENT_ID as CorrespondentId, now);
    void state.markNoticeSent('corresponsal-03' as CorrespondentId, now);
  }

  const ports: BotPorts = {
    store,
    proposals,
    state,
    rejections,
    observations,
    matches: new MemoryMatchStore(syntheticMatches()),
    teams: new MemoryTeamNames({ [HOME_ID]: HOME_NAME, [AWAY_ID]: AWAY_NAME }),
    model,
    clock: { now: () => now },
    catalog: TEST_CATALOG,
    map: TEST_MAP,
    windows: options.windows ?? DECLARED_MATCHDAY,
    runEngine: (matchId) => {
      log.record('engine');
      engineCalls.push(matchId);
      return Promise.resolve({
        match_id: matchId,
        decided: true,
        provisional: true,
        alerts: 0,
        abandoned: false,
        reason: null,
      } satisfies EngineOutcomeSummary);
    },
  };

  return { ports, log, store, proposals, state, rejections, observations, model, engineCalls };
}

/** La ventana del corresponsal, expuesta para los casos que la afirman. */
export { CORRESPONDENT_WINDOW };
