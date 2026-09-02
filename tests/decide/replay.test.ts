/**
 * CA-14 — replay: los mismos dos logs producen el mismo log de decisiones
 * (RN-10, D-5, D-6, ADR-021 §2).
 *
 * El material es un cuerpo SINTÉTICO con la forma de `ceroacero.es`, archivado
 * en el raw store y leído por el camino de SPEC-008 (`read`, sin red). Sobre
 * HTML REAL no se replaya en este repositorio, y se dice por qué: ADR-009
 * prohíbe versionar HTML de terceros, así que `tests/fixtures/` es y sigue
 * siendo sintético (CA-14.4).
 */
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeAll, describe, expect, test } from 'vitest';
import { PRODUCTION_CONFIG } from '@/decide/rules';
import { replayInstants, replayMatch } from '@/decide/replay';
import { SourceAdapter } from '@/ingest/adapter';
import { CEROACERO_ENTRY, sourceRegistry } from '@/ingest/sources';
import { instantOf } from '@/polite/clock';
import { RobotsGate } from '@/polite/policy';
import { MemoryRateLimit } from '@/polite/rate-limit';
import { USER_AGENT } from '@/polite/user-agent';
import { ceroaceroPage } from '../fixtures/ceroacero';
import { FakeClock, MemoryRawStore, RESOLVE_ALL, spyFetcher } from '../ingest/support/doubles';
import { MATCH } from './support/engine';
import type { FixtureRow } from '../fixtures/ceroacero';
import type { Instant, MatchId } from '@/model/ids';
import type { Match } from '@/model/match';
import type { Observation } from '@/model/observation';
import type { RawRef } from '@/raw/key';

const MINUTE = 60_000;
const KICKOFF_MS = Date.parse('2026-09-06T17:00:00.000Z');
const stamp = (minutes: number): Instant => instantOf(KICKOFF_MS + minutes * MINUTE);

/** Tres partidos de la misma jornada, con su fila en cada captura. */
const A = { id: '90001', slug: '2026-09-06-a', home: 'SD Inventada', away: 'CF Suposto' };
const B = { id: '90002', slug: '2026-09-06-b', home: 'CD Exemplo', away: 'UD Mostra' };
const C = { id: '90003', slug: '2026-09-06-c', home: 'FC Terceiro', away: 'RA Cuarto' };

const live = (game: typeof A, result: string): FixtureRow => ({
  id: game.id,
  slug: game.slug,
  home: game.home,
  away: game.away,
  result,
  cellClass: 'live',
});

/**
 * La jornada, minuto a minuto: un gol (A, 0-0 → 1-0), un salto de más de dos
 * goles (A, 1-0 → 4-0), un silencio —no hay más capturas— y un final, que con
 * una sola fuente capturable solo puede llegar por el timeout de RN-06.
 */
const CAPTURES: readonly (readonly [number, readonly FixtureRow[]])[] = [
  [0, [live(A, '0-0'), live(B, '0-0'), live(C, '0-0')]],
  [10, [live(A, '1-0'), live(B, '0-0'), live(C, '0-0')]],
  [20, [live(A, '4-0'), live(B, '1-0'), live(C, '0-0')]],
];

/**
 * El `MatchId` que `RESOLVE_ALL` da a cada fila: `m:<source_ref>`, y el
 * `source_ref` de `ceroacero.es` es el `href` de la celda del resultado
 * (`src/ingest/ceroacero.ts`, `identitySelector`).
 */
const matchIdOf = (game: typeof A): MatchId =>
  `m:/partido/${game.slug}/${game.id}` as MatchId;

const registry = sourceRegistry([CEROACERO_ENTRY]);
const target = registry.targets()[0]!;

let LOG: readonly Observation[] = [];
/** Lo que salió del proceso durante la construcción del material: nada. */
let REQUESTS: readonly { readonly url: string }[] = [];

/** El `Match` declarado de A: el kickoff que RN-06 necesita. */
const matchA: Match = { ...MATCH, id: matchIdOf(A) };

beforeAll(async () => {
  const clock = new FakeClock('2026-09-06T17:00:00.000Z');
  const store = new MemoryRawStore();
  const spy = spyFetcher(clock);
  const adapter = new SourceAdapter({
    registry,
    fetcher: spy.fetcher,
    store,
    clock,
    robots: new RobotsGate({ fetcher: spy.fetcher, store, userAgent: USER_AGENT }),
    rateLimit: new MemoryRateLimit(),
    resolver: RESOLVE_ALL,
  });

  const observations: Observation[] = [];

  for (const [minute, rows] of CAPTURES) {
    const at = stamp(minute);
    // Archivado ANTES de mirarlo (RN-10), y releído DESDE EL ARCHIVO: lo que
    // no se puede leer de vuelta no se puede replayar.
    const ref: RawRef = await store.put(
      {
        source: target.source,
        competition_id: target.competition_id,
        fetched_at: at,
        ext: target.ext,
      },
      ceroaceroPage(rows),
    );
    const archived = await store.get(ref);
    if (archived === null) throw new Error('el archivo no se puede releer');

    const result = await adapter.read(target, archived.body, ref, at);
    observations.push(...result.observations);
  }

  // Lo que salió del proceso queda registrado y se afirma en un caso: el
  // camino es `read`, sin red.
  REQUESTS = spy.requests;
  LOG = observations;
});

/** Solo el log del partido A, que es el que lleva el gol y el salto. */
const logOfA = (): readonly Observation[] =>
  LOG.filter((observation) => observation.match_id === matchIdOf(A));

const replayOfA = () =>
  replayMatch({
    match: matchA,
    observations: logOfA(),
    config: PRODUCTION_CONFIG,
    until: stamp(115),
  });

describe('CA-14 — el material: sintético, archivado y releído', () => {
  test('1. el log tiene las tres capturas por los tres partidos', () => {
    expect(LOG).toHaveLength(9);
    // Y ni una petición ha salido: el camino es `read`, sin red.
    expect(REQUESTS).toEqual([]);
    expect(logOfA()).toHaveLength(3);
    expect(logOfA().map((observation) => [observation.home_score, observation.away_score])).toEqual(
      [
        [0, 0],
        [1, 0],
        [4, 0],
      ],
    );
  });

  test('2. y la línea temporal es minuto a minuto, como el cron real', () => {
    const instants = replayInstants({
      match: matchA,
      observations: logOfA(),
      config: PRODUCTION_CONFIG,
      until: stamp(115),
    });

    expect(instants[0]).toBe(stamp(0));
    expect(instants.at(-1)).toBe(stamp(115));
    expect(instants).toHaveLength(116);
  });
});

describe('CA-14.1 — el mismo log, dos veces, es el MISMO log', () => {
  test('3. mismo número de filas, mismas reglas, mismos marcadores, mismas versiones', () => {
    const first = replayOfA();
    const second = replayOfA();

    // Comparación profunda, no por muestreo.
    expect(second).toEqual(first);
    expect(second.decisions).toEqual(first.decisions);
    expect(second.alerts).toEqual(first.alerts);
  });

  test('4. y el log dice lo que la jornada dice: gol, salto retenido, silencio y final', () => {
    const { decisions, alerts } = replayOfA();

    const rules = decisions.map((value) => value.rule);
    const scores = decisions.map((value) => `${value.status} ${String(value.home_score)}-${String(value.away_score)}`);

    // El gol: 0-0 y después 1-0. El salto a 4-0 NO aparece: una sola fuente de
    // 0.7 no lo libera (RN-04), y no hay segunda fuente capturable.
    expect(scores).toContain('live 0-0');
    expect(scores).toContain('live 1-0');
    // El 4-0 NO se publica NUNCA: ni en vivo, ni al terminar. Con una sola
    // fuente capturable la segunda que lo liberaría no existe (ADR-008 §1).
    expect(scores.filter((value) => value.includes('4-0'))).toEqual([]);
    expect(scores.at(-1)).toBe('finished 1-0');

    // El silencio, y una sola vez.
    expect(rules.filter((rule) => rule === 'RN-07')).toHaveLength(1);
    expect(alerts.filter((alert) => alert.rule === 'RN-07')).toHaveLength(1);

    // Y el final, que con una sola fuente solo llega por el timeout de RN-06.
    expect(decisions.at(-1)?.status).toBe('finished');

    // Las versiones son contiguas desde 1, que es lo que la base exige.
    expect(decisions.map((value) => value.version)).toEqual(
      decisions.map((_value, index) => index + 1),
    );
  });

  test('5. y los tres partidos de la jornada se replayan por separado, cada uno el suyo', () => {
    for (const game of [A, B, C]) {
      const match: Match = { ...MATCH, id: matchIdOf(game) };
      const log = LOG.filter((observation) => observation.match_id === matchIdOf(game));
      const once = replayMatch({ match, observations: log, config: PRODUCTION_CONFIG, until: stamp(115) });
      const twice = replayMatch({ match, observations: log, config: PRODUCTION_CONFIG, until: stamp(115) });

      expect(twice).toEqual(once);
      expect(once.decisions.length).toBeGreaterThan(0);
      for (const decision of once.decisions) expect(decision.match_id).toBe(matchIdOf(game));
    }
  });
});

describe('CA-14.3 — `decide` no toca el reloj del sistema', () => {
  const REAL_NOW = Date.now;

  afterEach(() => {
    Date.now = REAL_NOW;
  });

  test('6. con `Date.now` envenenado, el replay entero sigue en verde', () => {
    const clean = replayOfA();

    Date.now = (): number => {
      throw new Error('el motor leyó el reloj del sistema');
    };

    const poisoned = replayOfA();
    expect(poisoned).toEqual(clean);
  });

  test('7. y el control positivo de que el veneno muerde', () => {
    Date.now = (): number => {
      throw new Error('el motor leyó el reloj del sistema');
    };

    expect(() => Date.now()).toThrow('el motor leyó el reloj del sistema');
  });
});

describe('CA-14.4 — sobre HTML real no se replaya aquí, y se dice por qué', () => {
  test('8. `tests/fixtures/` no contiene ni un byte de HTML de terceros', async () => {
    // ADR-009 §3: nunca se versiona HTML real de terceros, y es irreversible si
    // se incumple, porque git no se purga, se reescribe. Lo que hay aquí son
    // GENERADORES escritos a mano.
    const entries = await readdir(join(process.cwd(), 'tests/fixtures'));

    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.endsWith('.ts'), `${entry} no es un generador sintético`).toBe(true);
    }
    expect(entries).toContain('ceroacero.ts');
  });

  test('9. y replayar el archivo de producción es un acto del operador, no de esta spec', () => {
    // Empaquetarlo como CLI es de la spec de las cuatro cifras, que es quien lo
    // necesita (SPEC-013 §Fuera de alcance). Lo que esta spec demuestra es que
    // el replay es determinista y que funciona DESDE CUERPOS ARCHIVADOS, y eso
    // es lo que hacen los casos 1 a 5.
    expect(replayOfA().decisions.length).toBeGreaterThan(0);
  });
});
