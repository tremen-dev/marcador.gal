/**
 * CA-11 y CA-12 — el aplicador persiste, la base arbitra la versión, `alerts`
 * es append-only, y el ciclo corre DENTRO del tick (ADR-017 §5, ADR-021 §3,
 * §4 y §5, ADR-006, ADR-019, RN-12).
 *
 * Importar `_harness` REVIENTA sin `DATABASE_URL_TEST`: sin base real estos
 * criterios son UNMET, no *skipped* (gate del 2026-08-29). `npm run test:db`.
 *
 * Los datos son SINTÉTICOS de punta a punta: calendario inventado, alias
 * inventados y páginas generadas por `tests/fixtures/ceroacero.ts` (ADR-009).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { declareAliasCatalog } from '@/alias/catalog';
import { declareCalendar } from '@/calendar/declared';
import { PostgresAlertStore } from '@/db/alerts';
import { loadAliasCatalog } from '@/db/aliases';
import { loadSchedule } from '@/db/calendar';
import { PostgresDecisionStore } from '@/db/decisions';
import { PostgresMatchStore } from '@/db/matches';
import { migrate, readMigrations } from '@/db/migrate';
import { PostgresObservationStore } from '@/db/observations';
import { applyEngine } from '@/decide/apply';
import { composeCyclePorts, runCycle } from '@/decide/cycle';
import { replayMatch } from '@/decide/replay';
import { PRODUCTION_CONFIG } from '@/decide/rules';
import { CEROACERO_ENTRY } from '@/ingest/sources';
import { DecisionSchema } from '@/model/decision';
import { ObservationIdSchema, SourceIdSchema } from '@/model/ids';
import { ObservationSchema } from '@/model/observation';
import { instantOf } from '@/polite/clock';
import { ceroaceroPage } from '../fixtures/ceroacero';
import { FakeClock, MemoryRawStore, spyFetcher } from '../ingest/support/doubles';
import { connect, dropEverything } from './_harness';
import type { EnginePorts } from '@/decide/apply';
import type { CyclePorts } from '@/decide/cycle';
import type { Sql } from '@/db/client';
import type { DecisionStore } from '@/db/ports';
import type { MeasurementWindow } from '@/ingest/windows';
import type { Decision } from '@/model/decision';
import type { Instant, MatchId } from '@/model/ids';
import type { Observation } from '@/model/observation';
import type { HttpRequest, HttpResponse } from '@/polite/http';
import type { RawRef } from '@/raw/key';

const sql: Sql = connect();

const SEASON = '2026/27';
const MINUTE = 60_000;
/** 2026-09-06, Europa/Madrid en CEST (UTC+2): 17:00 local = 15:00Z. */
const KICKOFF = '2026-09-06T15:00:00.000Z';
const KICKOFF_MS = Date.parse(KICKOFF);
const stamp = (minutes: number): Instant => instantOf(KICKOFF_MS + minutes * MINUTE);

const CEROACERO = SourceIdSchema.parse('ceroacero');
const RAW_REF =
  'ceroacero/futgal-preferente-g1/2026-09-06/2026-09-06t15-00-00.000z-a1b2c3d4e5f6.html' as RawRef;

const ROBOTS_URL = 'https://www.ceroacero.es/robots.txt';
const ROBOTS_ALLOW = 'User-agent: *\nDisallow: /zzmap_v3.php\n';

const WINDOWS: readonly MeasurementWindow[] = [
  {
    from: '2026-09-06T00:00:00.000Z' as Instant,
    to: '2026-09-07T00:00:00.000Z' as Instant,
    motive: 'xornada sintética de test (nunca real: ADR-009)',
  },
];

/** El partido en ventana, y otro fuera de toda ventana declarada. */
const IN_WINDOW = { home: 'sd-inventada', away: 'cf-suposto' };
const OUT_OF_WINDOW = { home: 'cd-exemplo', away: 'ud-mostra' };

const declared = (value: unknown): Uint8Array => new TextEncoder().encode(JSON.stringify(value));

/** La página sintética: una fila `live` 2-1 del partido en ventana. */
const PAGE = ceroaceroPage([
  {
    id: '90002',
    slug: '2026-09-06-sd-inventada-cf-suposto',
    home: 'SD Inventada',
    away: 'CF Suposto',
    result: '2-1',
    cellClass: 'live',
  },
]);

const serveOk = (request: HttpRequest): HttpResponse =>
  request.url === ROBOTS_URL
    ? { status: 200, body: new TextEncoder().encode(ROBOTS_ALLOW) }
    : { status: 200, body: PAGE };

let matchId: MatchId;
let outOfWindowId: MatchId;

const sharedStore = new MemoryRawStore();

beforeAll(async () => {
  await dropEverything(sql);
  await migrate(sql);

  await loadSchedule(
    sql,
    declareCalendar(
      declared({
        competition: {
          id: 'futgal-preferente-g1',
          name: 'Preferente Futgal',
          season: SEASON,
          group: '1',
        },
        timezone: 'Europe/Madrid',
        declared_by: 'Persoa de Proba',
        declared_at: '2026-09-02T10:00:00+02:00',
        source_note: 'Fixture sintético: ningunha xornada real (ADR-009).',
        teams: [
          { id: 'sd-inventada', canonical_name: 'SD Inventada' },
          { id: 'cf-suposto', canonical_name: 'CF Suposto' },
          { id: 'cd-exemplo', canonical_name: 'CD Exemplo' },
          { id: 'ud-mostra', canonical_name: 'UD Mostra' },
        ],
        rounds: [
          {
            round: 1,
            matches: [
              // 17:00 local = 15:00Z: en ventana.
              {
                home_id: IN_WINDOW.home,
                away_id: IN_WINDOW.away,
                kickoff: '2026-09-06 17:00',
                venue: 'Campo Sintético',
              },
              // Al día siguiente: fuera de toda jornada declarada.
              {
                home_id: OUT_OF_WINDOW.home,
                away_id: OUT_OF_WINDOW.away,
                kickoff: '2026-09-07 17:00',
                venue: null,
              },
            ],
          },
        ],
      }),
    ),
  );

  await loadAliasCatalog(
    sql,
    declareAliasCatalog(
      declared({
        source: 'ceroacero',
        season: SEASON,
        declared_by: 'Persoa de Proba',
        declared_at: '2026-09-02T10:00:00+02:00',
        aliases: [
          { alias: 'SD Inventada', team_id: 'sd-inventada' },
          { alias: 'CF Suposto', team_id: 'cf-suposto' },
        ],
      }),
    ),
  );

  const rows = await sql<{ id: string; home_id: string }[]>`
    select id, home_id from matches order by kickoff
  `;
  matchId = rows.find((row) => row.home_id === IN_WINDOW.home)!.id as MatchId;
  outOfWindowId = rows.find((row) => row.home_id === OUT_OF_WINDOW.home)!.id as MatchId;
});

afterAll(async () => {
  await sql.end();
});

beforeEach(async () => {
  await sql.unsafe('truncate observations, decisions, alerts cascade');
  await sql.unsafe('truncate ingest_attempts, request_rhythm cascade');
});

// ─────────────────────────────────────────────────────────────────────────────
// Ayudas
// ─────────────────────────────────────────────────────────────────────────────

function enginePorts(overrides: Partial<EnginePorts> = {}): EnginePorts {
  return {
    matches: new PostgresMatchStore(sql),
    observations: new PostgresObservationStore(sql),
    decisions: new PostgresDecisionStore(sql),
    alerts: new PostgresAlertStore(sql),
    config: PRODUCTION_CONFIG,
    ...overrides,
  };
}

interface ObservationSpec {
  readonly at: Instant;
  readonly home: number;
  readonly away: number;
  readonly source?: string;
  readonly confidence?: number;
  readonly match?: MatchId;
}

async function observe(spec: ObservationSpec): Promise<Observation> {
  const source = SourceIdSchema.parse(spec.source ?? CEROACERO);
  const observation = ObservationSchema.parse({
    id: ObservationIdSchema.parse(`${source}-${spec.at}-${String(spec.home)}${String(spec.away)}`),
    match_id: spec.match ?? matchId,
    source,
    observed_at: spec.at,
    status: 'live',
    home_score: spec.home,
    away_score: spec.away,
    confidence: spec.confidence ?? CEROACERO_ENTRY.weight,
    raw_ref: RAW_REF,
  });
  return await new PostgresObservationStore(sql).append(observation);
}

const decisionRows = async (): Promise<Decision[]> =>
  (await new PostgresDecisionStore(sql).listByMatch(matchId)) as Decision[];

const alertRows = async (): Promise<Record<string, unknown>[]> =>
  await sql<Record<string, unknown>[]>`
    select id, match_id, rule, raised_at, reason, observation_ids from alerts order by id
  `;

/**
 * Un `DecisionStore` que, ANTES de cada `append` que se le indique, mete una
 * escritura CONCURRENTE REAL por otra conexión lógica: la versión que el motor
 * planeó deja de estar libre y la base la rechaza (ADR-017 §5).
 */
function raced(
  inner: DecisionStore,
  races: number,
  support: readonly string[],
): { store: DecisionStore; attempts: () => number } {
  let attempts = 0;

  return {
    store: {
      append: async (decision: Decision): Promise<Decision> => {
        attempts += 1;
        if (attempts <= races) {
          const latest = await inner.getLatestByMatch(decision.match_id);
          await inner.append(
            DecisionSchema.parse({
              match_id: decision.match_id,
              status: 'live',
              home_score: 1,
              away_score: 1,
              provisional: true,
              rule: 'RN-03',
              decided_at: decision.decided_at,
              supporting_observation_ids: support,
              version: latest === null ? 1 : latest.version + 1,
            }),
          );
        }
        return await inner.append(decision);
      },
      getLatestByMatch: (id) => inner.getLatestByMatch(id),
      listByMatch: (id) => inner.listByMatch(id),
    },
    attempts: () => attempts,
  };
}

function cyclePorts(at: string, config = PRODUCTION_CONFIG): { ports: CyclePorts; requests: () => number } {
  const clock = new FakeClock(at);
  const spy = spyFetcher(clock, serveOk);
  const ports = composeCyclePorts({
    sql,
    store: sharedStore,
    fetcher: spy.fetcher,
    clock,
    season: SEASON,
    windows: WINDOWS,
    config,
  });
  return { ports, requests: () => spy.requests.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// CA-11
// ─────────────────────────────────────────────────────────────────────────────

describe('CA-11 — el aplicador persiste una fila válida', () => {
  test('1. una observación persistida produce UNA `Decision` que `DecisionSchema` acepta', async () => {
    const observation = await observe({ at: stamp(5), home: 2, away: 1 });

    const outcome = await applyEngine(enginePorts(), matchId, stamp(5));

    expect(outcome.decision).not.toBeNull();
    const rows = await decisionRows();
    expect(rows).toHaveLength(1);

    // Lo LEÍDO de la base vuelve a pasar por el esquema, que es la red de RN-12.
    const stored = DecisionSchema.parse(rows[0]);
    expect(stored.status).toBe('live');
    expect([stored.home_score, stored.away_score]).toEqual([2, 1]);
    expect(stored.version).toBe(1);
    expect(['RN-01', 'RN-02', 'RN-03', 'RN-04', 'RN-05', 'RN-06', 'RN-07']).toContain(stored.rule);
    expect(stored.decided_at).toBe(stamp(5));
    expect(stored.decided_at.endsWith('Z')).toBe(true);
    expect(stored.supporting_observation_ids).toEqual([observation.id]);
  });

  test('2. y sus `supporting_observation_ids` apuntan a observaciones DE ESE partido', async () => {
    await observe({ at: stamp(5), home: 2, away: 1 });
    await applyEngine(enginePorts(), matchId, stamp(5));

    const [stored] = await decisionRows();
    const support = await sql<{ id: string; match_id: string }[]>`
      select id, match_id from observations
       where id = any(${sql.array([...stored!.supporting_observation_ids])}::text[])
    `;

    expect(support).toHaveLength(stored!.supporting_observation_ids.length);
    for (const row of support) expect(row.match_id).toBe(matchId);
  });
});

describe('CA-11.1 — `migrations/0006` se aplica en orden', () => {
  test('3. `migrate` devuelve las seis versiones, y una segunda ejecución `[]`', async () => {
    // Este fichero es, desde hoy, el que ENUMERA las migraciones (enmienda de
    // ADR-015 en el ledger de SPEC-012): heredará la misma el día de `0007`.
    const onDisk = (await readMigrations()).map((migration) => migration.version);

    expect(onDisk).toEqual(['0001', '0002', '0003', '0004', '0005', '0006']);
    expect(await migrate(sql)).toEqual([]);
  });

  test('4. la tabla `alerts` existe con sus columnas, y el modelo canónico no cambia', async () => {
    const columns = await sql<{ column_name: string; data_type: string }[]>`
      select column_name, data_type
        from information_schema.columns
       where table_schema = 'public' and table_name = 'alerts'
       order by column_name
    `;

    expect(columns).toEqual([
      { column_name: 'id', data_type: 'integer' },
      { column_name: 'match_id', data_type: 'text' },
      { column_name: 'observation_ids', data_type: 'ARRAY' },
      { column_name: 'raised_at', data_type: 'timestamp with time zone' },
      { column_name: 'reason', data_type: 'text' },
      { column_name: 'rule', data_type: 'text' },
    ]);

    // CA-10.4: `decisions` y `observations` no ganan ninguna columna.
    const decisionColumns = await sql<{ column_name: string }[]>`
      select column_name from information_schema.columns
       where table_schema = 'public' and table_name = 'decisions'
       order by column_name
    `;
    expect(decisionColumns.map((row) => row.column_name)).toEqual([
      'away_score',
      'created_at',
      'decided_at',
      'home_score',
      'match_id',
      'provisional',
      'rule',
      'status',
      'supporting_observation_ids',
      'version',
    ]);
  });
});

describe('CA-11.2 — `alerts` es append-only: la base rechaza `update` y `delete`', () => {
  beforeEach(async () => {
    await observe({ at: stamp(5), home: 2, away: 1 });
    await new PostgresAlertStore(sql).append({
      match_id: matchId,
      rule: 'RN-07',
      raised_at: stamp(20),
      reason: 'sintético',
      observation_ids: [ObservationIdSchema.parse(`${CEROACERO}-${stamp(5)}-21`)],
    });
  });

  test('5. `update` sobre `alerts` lo rechaza la base', async () => {
    await expect(sql`update alerts set reason = 'otro'`).rejects.toThrow(/append-only/);
  });

  test('6. `delete` sobre `alerts` lo rechaza la base', async () => {
    await expect(sql`delete from alerts`).rejects.toThrow(/append-only/);
  });

  test('7. y la fila sigue ahí, intacta', async () => {
    const rows = await alertRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.['reason']).toBe('sintético');
  });
});

describe('CA-11.3 y CA-11.4 — la versión la arbitra la base', () => {
  test('8. con una `Decision` ya en versión 3, el aplicador produce la 4', async () => {
    const observation = await observe({ at: stamp(5), home: 2, away: 1 });
    const decisions = new PostgresDecisionStore(sql);

    for (const [version, home, away] of [
      [1, 0, 0],
      [2, 1, 0],
      [3, 1, 1],
    ] as const) {
      await decisions.append(
        DecisionSchema.parse({
          match_id: matchId,
          status: 'live',
          home_score: home,
          away_score: away,
          provisional: true,
          rule: 'RN-03',
          decided_at: stamp(version),
          supporting_observation_ids: [observation.id],
          version,
        }),
      );
    }

    const outcome = await applyEngine(enginePorts(), matchId, stamp(6));

    expect(outcome.decision?.version).toBe(4);
    expect(outcome.abandoned).toBe(false);
  });

  test('9. ante UN conflicto, relee, reintenta una vez y acaba en la versión que la base admitió', async () => {
    const observation = await observe({ at: stamp(5), home: 2, away: 1 });
    const race = raced(new PostgresDecisionStore(sql), 1, [observation.id]);

    const outcome = await applyEngine(
      enginePorts({ decisions: race.store }),
      matchId,
      stamp(5),
    );

    expect(outcome.abandoned).toBe(false);
    // Planeó la 1 y la base le dio la 2: la versión NO se calcula a ciegas.
    expect(outcome.decision?.version).toBe(2);
    expect(race.attempts()).toBe(2);

    const rows = await decisionRows();
    expect(rows.map((row) => row.version)).toEqual([1, 2]);
  });

  test('10. y si vuelve a chocar, ABANDONA ese partido sin lanzar, y lo deja registrado', async () => {
    const observation = await observe({ at: stamp(5), home: 2, away: 1 });
    const race = raced(new PostgresDecisionStore(sql), 2, [observation.id]);

    const outcome = await applyEngine(
      enginePorts({ decisions: race.store }),
      matchId,
      stamp(5),
    );

    expect(outcome.abandoned).toBe(true);
    expect(outcome.decision).toBeNull();
    expect(outcome.reason).toMatch(/DecisionVersionConflictError/);
    // Dos intentos y ni uno más: no hay bucle de reintentos.
    expect(race.attempts()).toBe(2);

    // Lo escrito es lo de las escrituras concurrentes, no lo del motor.
    const rows = await decisionRows();
    expect(rows.map((row) => [row.home_score, row.away_score])).toEqual([
      [1, 1],
      [1, 1],
    ]);
  });
});

describe('CA-11.5 — un ciclo que no decide nada no escribe ninguna fila', () => {
  test('11. sin observaciones, ni `decisions` ni `alerts` ganan una fila', async () => {
    const outcome = await applyEngine(enginePorts(), matchId, stamp(5));

    expect(outcome.decision).toBeNull();
    expect(outcome.alerts).toEqual([]);
    expect(await decisionRows()).toEqual([]);
    expect(await alertRows()).toEqual([]);
  });

  test('12. y con la tupla publicada sin cambios, tampoco', async () => {
    await observe({ at: stamp(5), home: 2, away: 1 });
    await applyEngine(enginePorts(), matchId, stamp(5));
    expect(await decisionRows()).toHaveLength(1);

    // Una segunda pasada sobre el mismo material: nada nuevo.
    await applyEngine(enginePorts(), matchId, stamp(6));

    expect(await decisionRows()).toHaveLength(1);
    expect(await alertRows()).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CA-12
// ─────────────────────────────────────────────────────────────────────────────

describe('CA-12 — el ciclo corre dentro del tick, en UNA invocación', () => {
  test('13. una sola invocación persiste la `Observation` Y escribe la `Decision`', async () => {
    const { ports, requests } = cyclePorts(KICKOFF);

    const summary = await runCycle(ports);

    // La ingesta pidió, archivó y persistió.
    expect(requests()).toBeGreaterThan(0);
    expect(summary.observations).toBe(1);
    // Y el motor decidió, en la MISMA invocación.
    expect(summary.decisions).toBe(1);
    expect(summary.engine.matches).toBe(1);
    expect(summary.engine.failed).toBe(0);

    const observations = await sql<{ match_id: string }[]>`select match_id from observations`;
    expect(observations).toHaveLength(1);

    // `decisions` deja de estar vacía por primera vez en el proyecto.
    const rows = await decisionRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe('live');
    expect([rows[0]?.home_score, rows[0]?.away_score]).toEqual([2, 1]);
    expect(rows[0]?.provisional).toBe(true);
  });

  test('14. CA-12.1: el motor corre DESPUÉS de la ingesta', async () => {
    // Si corriese antes, no habría observación sobre la que decidir y la
    // primera invocación no escribiría ninguna `Decision`.
    const { ports } = cyclePorts(KICKOFF);
    const summary = await runCycle(ports);

    expect(summary.observations).toBe(1);
    expect(summary.decisions).toBe(1);
  });

  test('15. CA-12.1: un partido fuera de ventana no produce ni observación ni decisión', async () => {
    const { ports, requests } = cyclePorts(stamp(-6 * 60));

    const summary = await runCycle(ports);

    expect(requests()).toBe(0);
    expect(summary.observations).toBe(0);
    expect(summary.decisions).toBe(0);
    expect(summary.engine.matches).toBe(0);
    expect(await sql<{ match_id: string }[]>`select match_id from decisions`).toEqual([]);

    // Y el de la jornada siguiente nunca es elegible: no hay jornada declarada.
    const outcome = await applyEngine(enginePorts(), outOfWindowId, KICKOFF);
    expect(outcome.decision).toBeNull();
  });

  test('16. CA-12.5: un fallo del motor sobre un partido no revierte la ingesta', async () => {
    const { ports } = cyclePorts(KICKOFF);
    const broken: DecisionStore = {
      append: () => Promise.reject(new Error('el motor se rompió sobre este partido')),
      getLatestByMatch: (id) => ports.decisions.getLatestByMatch(id),
      listByMatch: (id) => ports.decisions.listByMatch(id),
    };

    const summary = await runCycle({ ...ports, decisions: broken });

    expect(summary.engine.failed).toBe(1);
    expect(summary.decisions).toBe(0);
    // La ingesta ya persistida NO se revierte.
    expect(summary.observations).toBe(1);
    expect(await sql<{ id: string }[]>`select id from observations`).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CA-14.2
// ─────────────────────────────────────────────────────────────────────────────

describe('CA-14.2 — el replay coincide con el log que produjo el ciclo REAL', () => {
  test('17. mismas reglas, mismos marcadores y mismas versiones', async () => {
    // El ciclo real, tres invocaciones a un minuto, como el cron.
    for (const minute of [0, 1, 2]) {
      const { ports } = cyclePorts(stamp(minute));
      await runCycle(ports);
    }

    const fromCycle = await decisionRows();
    expect(fromCycle.length).toBeGreaterThan(0);

    const observations = await new PostgresObservationStore(sql).listByMatch(matchId);
    const match = await new PostgresMatchStore(sql).getById(matchId);
    expect(match).not.toBeNull();

    const fromReplay = replayMatch({
      match: match!,
      observations,
      config: PRODUCTION_CONFIG,
      // Los MISMOS instantes que condujo el ciclo: lo que el ciclo no controla
      // —cuándo se le invoca— se le da al replay, y todo lo demás tiene que
      // salir igual.
      instants: [stamp(0), stamp(1), stamp(2)],
    }).decisions;

    expect(fromReplay.map((value) => value.rule)).toEqual(fromCycle.map((value) => value.rule));
    expect(fromReplay.map((value) => value.version)).toEqual(
      fromCycle.map((value) => value.version),
    );
    expect(fromReplay.map((value) => [value.status, value.home_score, value.away_score])).toEqual(
      fromCycle.map((value) => [value.status, value.home_score, value.away_score]),
    );
    expect(fromReplay.map((value) => value.decided_at)).toEqual(
      fromCycle.map((value) => value.decided_at),
    );
    expect(fromReplay.map((value) => [...value.supporting_observation_ids])).toEqual(
      fromCycle.map((value) => [...value.supporting_observation_ids]),
    );
  });
});
