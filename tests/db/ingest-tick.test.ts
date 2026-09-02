/**
 * CA-2, CA-3 (conducción), CA-4 y CA-5 — el tick conduce el camino entero
 * fuente → archivo → `Observation` persistida, con estado durable y
 * composición construida DE NUEVO por tick, como un arranque en frío
 * (RN-01, RN-09, RN-10, RN-11; ADR-004, ADR-006, ADR-019).
 *
 * Importar `_harness` REVIENTA sin `DATABASE_URL_TEST`: sin base real estos
 * criterios son UNMET, no *skipped* (gate del 2026-08-29). `npm run test:db`.
 *
 * Lo ÚNICO compartido entre ticks es lo durable de verdad: Postgres (ritmo,
 * calendario, alias, observaciones, registro) y el raw store (el archivo).
 * Reloj, fetcher, gate y adaptador se construyen otra vez en cada tick.
 *
 * Los datos son SINTÉTICOS de punta a punta: calendario inventado, alias
 * inventados y páginas generadas por `tests/fixtures/ceroacero.ts` (ADR-009).
 */
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { declareAliasCatalog } from '@/alias/catalog';
import { catalogMatchResolver } from '@/alias/resolver';
import { declareCalendar } from '@/calendar/declared';
import { loadAliasCatalog, PostgresAliasStore } from '@/db/aliases';
import { loadSchedule } from '@/db/calendar';
import { PostgresMatchStore } from '@/db/matches';
import { migrate } from '@/db/migrate';
import { PostgresObservationStore } from '@/db/observations';
import { SourceAdapter } from '@/ingest/adapter';
import { CEROACERO_ENTRY, defaultRegistry } from '@/ingest/sources';
import { composeTickPorts, runIngestTick } from '@/ingest/tick';
import { CompetitionIdSchema, TeamIdSchema } from '@/model/ids';
import { ObservationSchema } from '@/model/observation';
import { RobotsGate } from '@/polite/policy';
import { USER_AGENT } from '@/polite/user-agent';
import { ceroaceroPage } from '../fixtures/ceroacero';
import { FakeClock, MemoryRawStore, spyFetcher } from '../ingest/support/doubles';
import { connect, dropEverything } from './_harness';
import type { MeasurementWindow } from '@/ingest/windows';
import type { TickPorts } from '@/ingest/tick';
import type { HttpRequest, HttpResponse } from '@/polite/http';
import type { Instant } from '@/model/ids';
import type { RawRef, RawStore } from '@/raw/store';
import type { Sql } from '@/db/client';

const sql: Sql = connect();

const SEASON = '2026/27';
const PREFERENTE_URL = CEROACERO_ENTRY.competitions[0]![1];
const TERCERA_URL = CEROACERO_ENTRY.competitions[1]![1];
const ROBOTS_URL = 'https://www.ceroacero.es/robots.txt';
const PAIR_PREFERENTE = 'ceroacero/futgal-preferente-g1';
const PAIR_TERCERA = 'ceroacero/rfef-tercera-g1';
const ROBOTS_TURN = 'robots/https://www.ceroacero.es';

/** 2026-09-06, Europa/Madrid en CEST (UTC+2): 17:00 local = 15:00Z. */
const T1 = '2026-09-06T15:00:00.000Z' as Instant;

const WINDOWS: readonly MeasurementWindow[] = [
  {
    from: '2026-09-06T00:00:00.000Z' as Instant,
    to: '2026-09-07T00:00:00.000Z' as Instant,
    motive: 'xornada sintética de test (nunca real: ADR-009)',
  },
];

/** El robots real de ceroacero prohíbe un solo path, y no es ninguno nuestro. */
const ROBOTS_ALLOW = 'User-agent: *\nDisallow: /zzmap_v3.php\n';
const ROBOTS_FORBID_EDITIONS = 'User-agent: *\nDisallow: /edicion/\n';

/** Una fila resoluble `live` 2-1 y una fila cuyos equipos no resuelven (CA-4). */
const PAGE = ceroaceroPage([
  {
    id: '90002',
    slug: '2026-09-06-sd-inventada-cf-suposto',
    home: 'SD Inventada',
    away: 'CF Suposto',
    result: '2-1',
    cellClass: 'live',
  },
  {
    id: '90007',
    slug: '2026-09-06-cd-exemplo-fs-desconecido-fc',
    home: 'CD Exemplo FS',
    away: 'Descoñecido FC',
    result: '20:00',
  },
]);

const serveOk = (request: HttpRequest): HttpResponse =>
  request.url === ROBOTS_URL
    ? { status: 200, body: new TextEncoder().encode(ROBOTS_ALLOW) }
    : { status: 200, body: PAGE };

const serveNoRobots = (request: HttpRequest): HttpResponse =>
  request.url === ROBOTS_URL ? { status: 404, body: new Uint8Array() } : serveOk(request);

const serveForbidding = (request: HttpRequest): HttpResponse =>
  request.url === ROBOTS_URL
    ? { status: 200, body: new TextEncoder().encode(ROBOTS_FORBID_EDITIONS) }
    : { status: 200, body: PAGE };

/** El archivo compartido entre composiciones, como el Blob de producción. */
const sharedStore = new MemoryRawStore();

const declared = (value: unknown): Uint8Array => new TextEncoder().encode(JSON.stringify(value));

/**
 * UNA composición, construida entera de nuevo: lo que hace un arranque en
 * frío de Vercel (ADR-004). Solo `sql` y el `store` que se le pase persisten.
 */
function coldComposition(
  at: string,
  options: {
    readonly store?: RawStore;
    readonly respond?: (request: HttpRequest) => HttpResponse;
    readonly season?: string;
    readonly windows?: readonly MeasurementWindow[];
  } = {},
) {
  const clock = new FakeClock(at);
  const spy = spyFetcher(clock, options.respond ?? serveOk);
  const ports = composeTickPorts({
    sql,
    store: options.store ?? sharedStore,
    fetcher: spy.fetcher,
    clock,
    season: options.season ?? SEASON,
    windows: options.windows ?? WINDOWS,
  });
  return { ports, spy, run: () => runIngestTick(ports) };
}

interface AttemptRow {
  readonly source: string;
  readonly competition_id: string;
  readonly attempted_at: string;
  readonly outcome: string;
  readonly reason: string | null;
  readonly raw_ref: string | null;
  readonly observations_count: number;
  readonly unresolved_names: string[];
}

const attemptRows = async (): Promise<AttemptRow[]> =>
  await sql<AttemptRow[]>`
    select source, competition_id, attempted_at, outcome, reason, raw_ref,
           observations_count, unresolved_names
      from ingest_attempts order by id
  `;

const rhythmPairs = async (): Promise<string[]> =>
  (await sql<{ pair: string }[]>`select pair from request_rhythm order by pair`).map(
    (row) => row.pair,
  );

beforeAll(async () => {
  await dropEverything(sql);
  await migrate(sql);

  // Calendario declarado de las DOS competiciones del registro (SPEC-010).
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
              // 17:00 local = 15:00Z: en ventana en T1.
              { home_id: 'sd-inventada', away_id: 'cf-suposto', kickoff: '2026-09-06 17:00', venue: 'Campo Sintético' },
              // 23:00 local = 21:00Z: en ventana 6 h después de T1 (CA-3.3).
              { home_id: 'cd-exemplo', away_id: 'ud-mostra', kickoff: '2026-09-06 23:00', venue: null },
            ],
          },
        ],
      }),
    ),
  );
  await loadSchedule(
    sql,
    declareCalendar(
      declared({
        competition: {
          id: 'rfef-tercera-g1',
          name: 'Tercera RFEF Grupo 1',
          season: SEASON,
          group: '1',
        },
        timezone: 'Europe/Madrid',
        declared_by: 'Persoa de Proba',
        declared_at: '2026-09-02T10:00:00+02:00',
        source_note: 'Fixture sintético: ningunha xornada real (ADR-009).',
        teams: [
          { id: 'fc-terceiro', canonical_name: 'FC Terceiro' },
          { id: 'ra-cuarto', canonical_name: 'RA Cuarto' },
        ],
        rounds: [
          {
            round: 1,
            // 23:00 local = 21:00Z: sin nada en ventana en T1 (CA-2).
            matches: [{ home_id: 'fc-terceiro', away_id: 'ra-cuarto', kickoff: '2026-09-06 23:00', venue: null }],
          },
        ],
      }),
    ),
  );

  // Catálogo de alias: dos filas `confirmed` que cubren el partido (CA-4).
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

  // Y una grafía de un tercer equipo solo `proposed`: NO resuelve (RN-09).
  await sql`
    insert into team_aliases (team_id, alias, source, season, status)
    values ('cd-exemplo', 'CD Exemplo FS', 'ceroacero', ${SEASON}, 'proposed')
  `;
});

afterAll(async () => {
  await sql.end();
});

describe('CA-2.2 — sin nada elegible el tick no hace nada, y ese es el estado natural', () => {
  test('1. antes de toda ventana: ni petición, ni turno, ni fila de registro', async () => {
    const tick = coldComposition('2026-09-06T14:00:00.000Z');
    const summary = await tick.run();

    expect(tick.spy.requests).toEqual([]);
    expect(await rhythmPairs()).toEqual([]);
    expect(await attemptRows()).toEqual([]);
    expect(summary.attempts).toEqual({ ok: 0, skipped: 0, failed: 0 });
    expect(summary.observations).toBe(0);
  });

  test('2. con la lista de jornadas VACÍA nada es elegible, aunque haya partido en ventana', async () => {
    const tick = coldComposition(T1, { windows: [] });
    await tick.run();

    expect(tick.spy.requests).toEqual([]);
    expect(await rhythmPairs()).toEqual([]);
    expect(await attemptRows()).toEqual([]);
  });
});

describe('CA-2, CA-3.1, CA-4 y CA-5 — el primer tick recorre el camino entero', () => {
  test('3. una petición hacia la competición elegible, ninguna hacia la otra', async () => {
    const tick = coldComposition(T1);
    const summary = await tick.run();

    // El robots salió ANTES que la página, una vez cada uno (CA-3.1).
    expect(tick.spy.requests.map((request) => request.url)).toEqual([ROBOTS_URL, PREFERENTE_URL]);
    expect(tick.spy.forUrl(TERCERA_URL)).toEqual([]);

    // El ritmo durable tiene el par elegible y el turno del robots; del par
    // no elegible no hay fila (CA-2).
    expect(await rhythmPairs()).toEqual([PAIR_PREFERENTE, ROBOTS_TURN]);

    // El robots quedó archivado bajo `<source>/robots/…` (RN-10, ADR-014 §3.4).
    const robotsKeys = sharedStore.keys.filter((key) => key.startsWith('ceroacero/robots/'));
    expect(robotsKeys).toHaveLength(1);

    expect(summary.at).toBe(T1);
    expect(summary.attempts).toEqual({ ok: 1, skipped: 0, failed: 0 });
    expect(summary.observations).toBe(1);
  });

  test('4. CA-4 — `observations` contiene EXACTAMENTE una fila, validada y con su raw_ref', async () => {
    const rows = await sql<Record<string, unknown>[]>`
      select id, match_id, source, observed_at, status, home_score, away_score,
             confidence, raw_ref
        from observations
    `;
    expect(rows).toHaveLength(1);

    const observation = ObservationSchema.parse(rows[0]);
    expect(observation.source).toBe('ceroacero');
    expect(observation.confidence).toBe(0.7);
    expect(observation.observed_at).toBe(T1);
    expect(observation.status).toBe('live');
    expect(observation.home_score).toBe(2);
    expect(observation.away_score).toBe(1);

    // Al partido que el calendario declaró para ese par de equipos.
    const matches = await new PostgresMatchStore(sql).listByTeams(
      CompetitionIdSchema.parse('futgal-preferente-g1'),
      TeamIdSchema.parse('sd-inventada'),
      TeamIdSchema.parse('cf-suposto'),
    );
    expect(matches.map((match) => match.id)).toContain(observation.match_id);

    // El `raw_ref` apunta al objeto archivado por ESE tick, y el objeto existe.
    const archived = await sharedStore.get(observation.raw_ref);
    expect(archived).not.toBeNull();
    expect(observation.raw_ref.startsWith('ceroacero/futgal-preferente-g1/2026-09-06/')).toBe(
      true,
    );
  });

  test('5. CA-4.1 y CA-5 — el intento quedó registrado entero, con los nombres no resueltos', async () => {
    const rows = await attemptRows();
    expect(rows).toHaveLength(1);

    const attempt = rows[0]!;
    expect(attempt.source).toBe('ceroacero');
    expect(attempt.competition_id).toBe('futgal-preferente-g1');
    // El instante del reloj falso, como cadena `Z`, de punta a punta (CA-2.3).
    expect(attempt.attempted_at).toBe(T1);
    expect(attempt.outcome).toBe('ok');
    expect(attempt.reason).toBeNull();
    expect(attempt.observations_count).toBe(1);
    // La fila no resuelta no produjo `Observation` y sus DOS nombres quedaron
    // íntegros: la cola de trabajo del catálogo de alias (RN-09).
    expect(attempt.unresolved_names).toEqual(['CD Exemplo FS', 'Descoñecido FC']);

    const observation = (await sql<{ raw_ref: string }[]>`select raw_ref from observations`)[0]!;
    expect(attempt.raw_ref).toBe(observation.raw_ref);
  });

  test('6. CA-4.4 — `decisions` está vacía: el tick no escribió ninguna (RN-08, D-3)', async () => {
    const rows = await sql<{ count: string }[]>`select count(*) from decisions`;
    expect(Number(rows[0]!.count)).toBe(0);
  });

  test('7. CA-4.3 — reprocesar el MISMO cuerpo archivado deja `observations` idéntica', async () => {
    const before = await sql<Record<string, unknown>[]>`
      select * from observations order by id
    `;
    const rawRef = before[0]!['raw_ref'] as RawRef;
    const archived = await sharedStore.get(rawRef);
    expect(archived).not.toBeNull();

    // La lectura y el `append`, otra vez, sobre los mismos bytes: ids
    // deterministas (SPEC-008 CA-10) + `append` idempotente (SPEC-010 CA-7.4).
    const clock = new FakeClock(T1);
    const spy = spyFetcher(clock);
    const adapter = new SourceAdapter({
      registry: defaultRegistry(),
      fetcher: spy.fetcher,
      store: sharedStore,
      clock,
      robots: new RobotsGate({ fetcher: spy.fetcher, store: sharedStore, userAgent: USER_AGENT }),
      rateLimit: { takeTurn: () => Promise.resolve(true) },
      resolver: catalogMatchResolver({
        source: CEROACERO_ENTRY.source,
        season: SEASON,
        aliases: new PostgresAliasStore(sql),
        matches: new PostgresMatchStore(sql),
      }),
    });

    const target = defaultRegistry().targets()[0]!;
    const result = await adapter.read(target, archived!.body, rawRef, T1 as Instant);
    const store = new PostgresObservationStore(sql);
    for (const observation of result.observations) await store.append(observation);

    expect(await sql<Record<string, unknown>[]>`select * from observations order by id`).toEqual(
      before,
    );
    // Y el replay no tocó la red: ni robots ni página.
    expect(spy.requests).toEqual([]);
  });
});

describe('CA-2.1 y CA-3.2 — arranque en frío en el mismo minuto, y dentro de las 6 h', () => {
  test('8. composición nueva en el mismo minuto: nada sale y nada se registra', async () => {
    const tick = coldComposition('2026-09-06T15:00:30.000Z');
    const summary = await tick.run();

    expect(tick.spy.requests).toEqual([]);
    expect(await attemptRows()).toHaveLength(1);
    expect(summary.attempts).toEqual({ ok: 0, skipped: 0, failed: 0 });
  });

  test('9. con el reloj adelantado 60 s: UNA página, y CERO robots (la política se releyó)', async () => {
    const tick = coldComposition('2026-09-06T15:01:00.000Z');
    const summary = await tick.run();

    expect(tick.spy.forUrl(PREFERENTE_URL)).toHaveLength(1);
    expect(tick.spy.forUrl(ROBOTS_URL)).toHaveLength(0);
    expect(summary.attempts).toEqual({ ok: 1, skipped: 0, failed: 0 });
  });
});

describe('CA-3.3 — pasadas las 6 h del reloj falso, el robots se pide UNA vez y se sigue', () => {
  test('10. a las 21:00Z el robots caducó: una petición de robots, y las dos páginas', async () => {
    const tick = coldComposition('2026-09-06T21:00:00.000Z');
    const summary = await tick.run();

    expect(tick.spy.forUrl(ROBOTS_URL)).toHaveLength(1);
    expect(tick.spy.forUrl(PREFERENTE_URL)).toHaveLength(1);
    expect(tick.spy.forUrl(TERCERA_URL)).toHaveLength(1);
    expect(summary.attempts).toEqual({ ok: 2, skipped: 0, failed: 0 });

    expect(sharedStore.keys.filter((key) => key.startsWith('ceroacero/robots/'))).toHaveLength(2);
  });
});

describe('CA-3.4 — origen sin robots.txt: fallo cerrado, motivo registrado y reintento con turno', () => {
  test('11. sin robots servido: ni una página, dos intentos `skipped` y UN intento de robots', async () => {
    const emptyStore = new MemoryRawStore();
    const before = (await attemptRows()).length;

    const tick = coldComposition('2026-09-06T21:02:00.000Z', {
      store: emptyStore,
      respond: serveNoRobots,
    });
    const summary = await tick.run();

    // Un solo intento de robots para el origen: el segundo par lo suprime el
    // turno durable, no la memoria de la instancia.
    expect(tick.spy.forUrl(ROBOTS_URL)).toHaveLength(1);
    expect(tick.spy.forUrl(PREFERENTE_URL)).toHaveLength(0);
    expect(tick.spy.forUrl(TERCERA_URL)).toHaveLength(0);
    expect(summary.attempts).toEqual({ ok: 0, skipped: 2, failed: 0 });

    const rows = (await attemptRows()).slice(before);
    expect(rows.map((row) => row.outcome)).toEqual(['skipped', 'skipped']);
    for (const row of rows) {
      expect(row.reason).toMatch(/no robots\.txt policy in force/);
      expect(row.reason).toMatch(/RN-11/);
      expect(row.raw_ref).toBeNull();
    }

    // Y un segundo tick en el MISMO minuto no añade ningún intento de robots:
    // en total, uno por minuto y origen, no uno por composición.
    const again = coldComposition('2026-09-06T21:02:30.000Z', {
      store: emptyStore,
      respond: serveNoRobots,
    });
    await again.run();
    expect(again.spy.requests).toEqual([]);
  });
});

describe('CA-3.5 — control positivo: el `RobotsGate` en memoria pide en CADA composición nueva', () => {
  test('12. dos composiciones, dos peticiones de robots: el defecto latente, reproducido', async () => {
    // Es la misma conducción que el caso 9 —composición nueva, política ya
    // pedida hace un minuto— con la pieza vieja en el sitio de la nueva. El
    // resultado ESPERADO es la descortesía: F-SPEC-008-V13 un módulo más
    // allá, y lo que esta spec cierra (ADR-019 §4).
    const robotsRequests: number[] = [];

    for (const at of ['2026-09-06T21:03:00.000Z', '2026-09-06T21:04:00.000Z']) {
      const store = new MemoryRawStore();
      const clock = new FakeClock(at);
      const spy = spyFetcher(clock, serveOk);
      const ports: TickPorts = {
        ...composeTickPorts({ sql, store, fetcher: spy.fetcher, clock, season: SEASON, windows: WINDOWS }),
        // La pieza del instrumento supervisado, donde NO debe estar (CA-14.8).
        robots: new RobotsGate({ fetcher: spy.fetcher, store, userAgent: USER_AGENT }),
      };
      await runIngestTick(ports);
      robotsRequests.push(spy.forUrl(ROBOTS_URL).length);
    }

    // Cada arranque en frío vuelve a pedirlo: hasta una petición de robots
    // por minuto y origen. Con el gate durable (caso 9) fueron CERO.
    expect(robotsRequests).toEqual([1, 1]);
  });
});

describe('CA-3.7 — una URL que la política prohíbe: `skipped`, sin página y sin bytes de página', () => {
  test('13. `Disallow: /edicion/`: el intento queda con la frase de robotsSkipReason', async () => {
    const emptyStore = new MemoryRawStore();
    const before = (await attemptRows()).length;

    const tick = coldComposition('2026-09-06T21:05:00.000Z', {
      store: emptyStore,
      respond: serveForbidding,
    });
    const summary = await tick.run();

    expect(tick.spy.forUrl(ROBOTS_URL)).toHaveLength(1);
    expect(tick.spy.forUrl(PREFERENTE_URL)).toHaveLength(0);
    expect(tick.spy.forUrl(TERCERA_URL)).toHaveLength(0);
    expect(summary.attempts).toEqual({ ok: 0, skipped: 2, failed: 0 });

    const rows = (await attemptRows()).slice(before);
    for (const row of rows) {
      expect(row.reason).toMatch(/robots\.txt disallows \/edicion\//);
      expect(row.reason).toMatch(/RN-11/);
    }

    // Se archivó el robots (RN-10) y NINGÚN byte de página.
    expect(emptyStore.keys.every((key) => key.includes('/robots/'))).toBe(true);
  });
});

describe('CA-4.2 — la temporada es configuración declarada, nunca deducida', () => {
  test('14. con otra temporada la MISMA fila deja de resolver', async () => {
    const before = await sql<{ count: string }[]>`select count(*) from observations`;

    const tick = coldComposition('2026-09-06T21:06:00.000Z', { season: '2027/28' });
    const summary = await tick.run();

    expect(summary.attempts.ok).toBe(2);
    expect(summary.observations).toBe(0);

    const rows = await attemptRows();
    const last = rows.at(-1)!;
    expect(last.observations_count).toBe(0);
    // La fila que ayer resolvía hoy es cola de trabajo: nombres íntegros.
    expect(last.unresolved_names).toContain('SD Inventada');
    expect(last.unresolved_names).toContain('CF Suposto');

    const after = await sql<{ count: string }[]>`select count(*) from observations`;
    expect(after[0]!.count).toBe(before[0]!.count);
  });
});

describe('CA-5.1 — un intento que revienta queda `failed` y no impide el siguiente', () => {
  test('15. el archivo revienta: los dos pares quedan `failed` con su motivo', async () => {
    const failingHtml: RawStore = {
      put: (meta, body) =>
        meta.ext === 'html'
          ? Promise.reject(new Error('blob write failed: quota exceeded'))
          : sharedStore.put(meta, body),
      get: (key) => sharedStore.get(key),
      list: (prefix) => sharedStore.list(prefix),
    };
    const before = (await attemptRows()).length;

    const tick = coldComposition('2026-09-06T21:07:00.000Z', { store: failingHtml });
    const summary = await tick.run();

    // Las dos peticiones de página SALIERON (el fallo es al archivar), y el
    // fallo del primer par no impidió el intento del segundo.
    expect(tick.spy.forUrl(PREFERENTE_URL)).toHaveLength(1);
    expect(tick.spy.forUrl(TERCERA_URL)).toHaveLength(1);
    expect(summary.attempts).toEqual({ ok: 0, skipped: 0, failed: 2 });

    const rows = (await attemptRows()).slice(before);
    expect(rows.map((row) => row.outcome)).toEqual(['failed', 'failed']);
    for (const row of rows) {
      expect(row.reason).toMatch(/blob write failed/);
      expect(row.observations_count).toBe(0);
    }
  });

  test('16. la persistencia revienta: `failed` con motivo, y el segundo par se intenta igual', async () => {
    const before = (await attemptRows()).length;
    const clock = new FakeClock('2026-09-06T21:08:00.000Z');
    const spy = spyFetcher(clock, serveOk);
    const ports: TickPorts = {
      ...composeTickPorts({ sql, store: sharedStore, fetcher: spy.fetcher, clock, season: SEASON, windows: WINDOWS }),
      observations: {
        append: () => Promise.reject(new Error('neon is down: connection refused')),
        getById: () => Promise.resolve(null),
        listByMatch: () => Promise.resolve([]),
      },
    };
    const summary = await runIngestTick(ports);

    expect(spy.forUrl(PREFERENTE_URL)).toHaveLength(1);
    expect(spy.forUrl(TERCERA_URL)).toHaveLength(1);

    const rows = (await attemptRows()).slice(before);
    expect(rows).toHaveLength(2);
    // El preferente tenía una fila resoluble: su `append` reventó → `failed`.
    expect(rows[0]!.outcome).toBe('failed');
    expect(rows[0]!.reason).toMatch(/neon is down/);
    // El tercera no tenía nada que persistir: quedó `ok` con 0.
    expect(rows[1]!.outcome).toBe('ok');
    expect(rows[1]!.observations_count).toBe(0);
    expect(summary.attempts.failed).toBe(1);
  });
});
