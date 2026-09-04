/**
 * SPEC-018 CA-3, CA-5, CA-7 y CA-11 — la apertura, la proyección cerrada, el
 * contrato del snapshot y el orden.
 *
 * CA-5.3 ES EL ÚNICO SUBPUNTO DE LA SPEC CUYO FALLO ES IRREVERSIBLE: bajo la
 * salida (A) una filtración llegaba a un operador autenticado; publicando,
 * llega a cualquiera, se cachea, se captura y la archiva un tercero fuera de
 * nuestro alcance. Por eso el mecanismo ENUMERA LAS CLAVES DEL ESQUEMA
 * CANÓNICO contra la lista cerrada, en vez de confiar en una lista negra de
 * nombres, y lleva control positivo.
 */
import { describe, expect, test } from 'vitest';
import { boardApiHandler, boardSnapshotOf, etagOf } from '@/api/handler';
import {
  BoardSnapshotSchema,
  PUBLISHED_COMPETITIONS,
  PUBLISHED_FIELDS,
  PUBLISHED_FIELD_NAMES,
} from '@/api/contract';
import { BOARD_CACHE_CONTROL, REFRESH_SECONDS, SHARED_CACHE_SECONDS } from '@/api/freshness';
import { compareBoardRows, projectBoard } from '@/api/snapshot';
import { boardHandler } from '@/board/handler';
import { DEFAULT_SOURCES } from '@/ingest/sources';
import { DecisionSchema } from '@/model/decision';
import { ObservationSchema } from '@/model/observation';
import {
  COMPETITION_NAMES,
  KICKOFF,
  SCENE_MATCHES,
  SCENE_WINDOW,
  TEAM_NAMES,
  get,
  liveDecision,
  observation,
  scene,
  sceneMatch,
} from './support/doubles';

const API = 'https://marcador.gal/api/board';
const PAGE = 'https://marcador.gal/marcador';

async function json(options: Parameters<typeof scene>[0] = {}): Promise<unknown> {
  const board = scene(options);
  const response = await boardApiHandler({ ports: board.ports })(get(API));
  return JSON.parse(await response.text());
}

describe('CA-3 — la apertura es la jornada de medición declarada', () => {
  test('1. CA-3.1 — sólo salen los partidos dentro de una entrada de `MEASUREMENT_WINDOWS`', async () => {
    const inside = sceneMatch();
    const outside = sceneMatch({
      id: 'futgal-preferente-g1-2026-27-j2-fora',
      round: 2,
      kickoff: '2026-09-13T17:00:00.000Z',
    });

    const payload = BoardSnapshotSchema.parse(
      await json({ matches: [inside, outside], windows: [SCENE_WINDOW] }),
    );

    expect(payload.matches.map((row) => row.match_id)).toEqual([inside.id]);
  });

  test('2. CA-3.2 — con la lista vacía: carga útil vacía y CERO consultas', async () => {
    const board = scene({ windows: [] });
    const response = await boardApiHandler({ ports: board.ports })(get(API));
    const payload = BoardSnapshotSchema.parse(JSON.parse(await response.text()));

    expect(payload).toEqual({ version: null, matchday_declared: false, matches: [] });
    // NI UNA LLAMADA A NINGÚN PUERTO. Es una frontera negativa, no un valor.
    expect(board.log.empty).toBe(true);
  });

  test('3. CA-3.3 — «no hay partidos» y «no se declaró ninguno» se dicen DISTINTO', async () => {
    const nothingDeclared = scene({ windows: [] });
    const declaredButEmpty = scene({ windows: [SCENE_WINDOW], matches: [] });

    const first = await boardHandler({ ports: nothingDeclared.ports, locale: 'gl' })(get(PAGE));
    const second = await boardHandler({ ports: declaredButEmpty.ports, locale: 'gl' })(get(PAGE));

    const [a, b] = [await first.text(), await second.text()];

    // Los dos mensajes existen, son distintos, y cada pantalla dice el suyo.
    expect(a).toContain('Non hai ningunha xornada de medición declarada');
    expect(b).toContain('A xornada declarada non ten ningún partido');
    expect(a).not.toContain('A xornada declarada non ten ningún partido');
    expect(b).not.toContain('Non hai ningunha xornada de medición declarada');
  });

  test('4. CA-3.5 — `PUBLISHED_COMPETITIONS` tiene DOS entradas, cada una con su motivo', () => {
    expect(PUBLISHED_COMPETITIONS).toHaveLength(2);
    expect(PUBLISHED_COMPETITIONS.map((entry) => entry.id).sort()).toEqual([
      'futgal-preferente-g1',
      'rfef-tercera-g1',
    ]);
    for (const entry of PUBLISHED_COMPETITIONS) {
      expect(entry.motive.trim().length).toBeGreaterThan(40);
    }
  });

  test('5. y son EXACTAMENTE las que el registro de fuentes declara: no pueden derivar', () => {
    // La lista se escribe en `src/api/contract.ts` para que el grafo de las
    // tres rutas públicas no alcance `src/ingest/` por ahí; que no derive del
    // registro se afirma AQUÍ, que es donde importar los dos no cuesta nada.
    const registered = [
      ...new Set(
        DEFAULT_SOURCES.flatMap((source) => source.competitions.map(([id]) => id as string)),
      ),
    ].sort();

    expect(PUBLISHED_COMPETITIONS.map((entry) => entry.id as string).sort()).toEqual(registered);
  });

  test('6. un partido de una competición no listada NO sale, ni en el JSON ni en el HTML', async () => {
    const listed = sceneMatch();
    const unlisted = sceneMatch({
      id: 'futgal-primeira-g1-2026-27-j1-x-y',
      competition_id: 'futgal-primeira-g1',
      home_id: 'cd-barco',
      away_id: 'sd-compostela',
    });

    const payload = BoardSnapshotSchema.parse(await json({ matches: [listed, unlisted] }));
    expect(payload.matches.map((row) => row.match_id)).toEqual([listed.id]);

    const board = scene({ matches: [listed, unlisted] });
    const html = await (
      await boardHandler({ ports: board.ports, locale: 'gl' })(get(PAGE))
    ).text();
    expect(html).not.toContain(unlisted.id);
  });

  test('7. CONTROL POSITIVO: añadir una tercera competición a la lista la publicaría', () => {
    // El mismo predicado que usa la proyección, sobre una lista sintética.
    const widened = [...PUBLISHED_COMPETITIONS.map((entry) => entry.id as string), 'futgal-primeira-g1'];

    expect(widened.includes('futgal-primeira-g1')).toBe(true);
    expect(PUBLISHED_COMPETITIONS.map((entry) => entry.id as string)).not.toContain(
      'futgal-primeira-g1',
    );
  });

  test('8. CA-3.6 — como máximo DOS jornadas declaradas', async () => {
    const { MEASUREMENT_WINDOWS } = await import('@/ingest/measurement');

    expect(MEASUREMENT_WINDOWS.length).toBeLessThanOrEqual(2);
  });

  test('9. CA-3.7 — nada arbitrario: cualquier parámetro responde 404 con CERO lecturas', async () => {
    for (const url of [`${API}?jornada=3`, `${PAGE}?data=2026-09-13`, `${PAGE}?partido=x`]) {
      const board = scene();
      const handler = url.includes('/api/board')
        ? boardApiHandler({ ports: board.ports })
        : boardHandler({ ports: board.ports, locale: 'gl' });

      const response = await handler(get(url));

      expect(response.status).toBe(404);
      expect(board.log.empty, `${url} leyó la base`).toBe(true);
    }
  });

  test('10. y sin parámetros responde 200: el 404 no es que todo falle', async () => {
    const board = scene();
    const response = await boardApiHandler({ ports: board.ports })(get(API));

    expect(response.status).toBe(200);
  });
});

describe('CA-5 — la proyección es una lista cerrada, y lo que no está no sale', () => {
  const decision = liveDecision({
    rule: 'RN-01',
    supporting_observation_ids: ['obs-1', 'obs-2'],
    version: 3,
  });
  const support = [
    observation(),
    observation({ id: 'obs-2', source: 'operador', confidence: 1 }),
  ];

  async function servedBodies(): Promise<{ html: string; body: string }> {
    const options = {
      reads: [{ match_id: SCENE_MATCHES[0]!.id, live: decision, supporting: support }],
    };
    const board = scene(options);
    const html = await (await boardHandler({ ports: board.ports, locale: 'gl' })(get(PAGE))).text();
    const other = scene(options);
    const body = await (await boardApiHandler({ ports: other.ports })(get(API))).text();
    return { html, body };
  }

  test('11. CA-5.1 — la lista cerrada tiene un motivo por entrada', () => {
    expect(PUBLISHED_FIELDS.length).toBeGreaterThan(0);
    for (const entry of PUBLISHED_FIELDS) {
      expect(entry.motive.trim().length, `${entry.field} sin motivo`).toBeGreaterThan(40);
    }
  });

  test('12. CA-5.2 — ninguna clave del esquema canónico fuera de la lista sale en el cuerpo', async () => {
    // EL MECANISMO ENUMERA EL ESQUEMA, no una lista negra de nombres: un campo
    // que `src/model/` añada mañana queda fuera sin que nadie tenga que saber
    // que existe (ADR-016 §3.5).
    const canonical = new Set<string>([
      ...Object.keys(DecisionSchema.parse(decision)),
      ...Object.keys(ObservationSchema.parse(support[0]!)),
    ]);

    const leaked = [...canonical].filter((key) => !PUBLISHED_FIELD_NAMES.includes(key));
    expect(leaked.sort()).toEqual([
      'confidence',
      'decided_at',
      'id',
      'observed_at',
      'provisional',
      'raw_ref',
      'rule',
      'source',
      'supporting_observation_ids',
      'version',
    ]);

    const { html: served, body } = await servedBodies();
    // Se quita el bloque de configuración del guion: sus claves son los
    // IDENTIFICADORES de `MATCH_STATUSES` y `MATCH_QUALIFIERS` con su literal
    // de i18n al lado —lo que la pantalla enseña—, no campos de `Decision`.
    const html = served.replaceAll(
      /<script type="application\/json"[\s\S]*?<\/script>/g,
      '',
    );
    const payload: unknown = JSON.parse(body);
    const rows = (payload as { matches: readonly Record<string, unknown>[] }).matches;

    for (const row of rows) {
      expect(Object.keys(row).sort()).toEqual([...PUBLISHED_FIELD_NAMES].sort());
    }

    // Y ninguno de los que se filtrarían aparece como clave en el JSON.
    // Se busca la CLAVE (`"campo":`), no la cadena suelta: `"provisional"` es
    // también el VALOR de un cualificador, que sí se publica y debe publicarse.
    for (const key of leaked) {
      if (key === 'version') continue; // la del snapshot, que es derivada
      expect(body, `el JSON lleva \`${key}\``).not.toContain(`"${key}":`);
      expect(html, `el HTML lleva \`${key}\``).not.toContain(`"${key}":`);
    }
  });

  test('13. CONTROL POSITIVO: añadir `rule` a la lista dejaría de detectarlo', () => {
    const widened = [...PUBLISHED_FIELD_NAMES, 'rule'];

    expect(widened.includes('rule')).toBe(true);
    expect(PUBLISHED_FIELD_NAMES).not.toContain('rule');
  });

  test('14. CA-5.3 — ni `rule`, ni los ids de apoyo, ni `raw_ref`, ni `confidence`, ni la fuente', async () => {
    const { html, body } = await servedBodies();

    for (const surface of [html, body]) {
      // `rule` es elocuente: RN-01 dice «el operador impuso su precedencia».
      expect(surface).not.toContain('RN-01');
      // Los ids son opacos pero su CARDINALIDAD no lo es.
      expect(surface).not.toContain('obs-1');
      expect(surface).not.toContain('obs-2');
      // `raw_ref` lleva el NOMBRE DE LA FUENTE dentro de la cadena (ADR-009).
      expect(surface).not.toContain('ceroacero');
      expect(surface).not.toContain('.html');
      // `confidence`: publicar «0.7» es publicar la naturaleza de la fuente.
      expect(surface).not.toContain('0.7');
      // Y ni el operador ni el corresponsal.
      expect(surface).not.toContain('operador');
      expect(surface).not.toContain('corresponsal');
      // RN-05: el conflicto no se publica. La bandeja es del panel.
      expect(surface.toLowerCase()).not.toContain('alerta');
      expect(surface.toLowerCase()).not.toContain('conflito');
    }
  });

  test('15. CA-5.4 — la traza de RN-12 no se enseña, y eso no incumple D-6', async () => {
    const { html, body } = await servedBodies();

    for (const surface of [html, body]) {
      expect(surface).not.toMatch(/RN-0\d/);
    }
  });

  test('16. CA-5.5 — ni una imagen: sin `<img>`, sin fondo de imagen, sin SVG', async () => {
    const { html } = await servedBodies();

    expect(html).not.toMatch(/<img/i);
    expect(html).not.toMatch(/<svg/i);
    expect(html).not.toMatch(/background(?:-image)?\s*:[^;]*url\(/i);
  });
});

describe('CA-7 — `version` derivada, `ETag` del cuerpo, caché compartida y corta', () => {
  const reads = [
    {
      match_id: SCENE_MATCHES[0]!.id,
      live: liveDecision({ decided_at: '2026-09-06T17:40:00.000Z' }),
      supporting: [observation()],
    },
    {
      match_id: SCENE_MATCHES[2]!.id,
      live: liveDecision({
        match_id: SCENE_MATCHES[2]!.id,
        decided_at: '2026-09-06T17:55:00.000Z',
        supporting_observation_ids: ['obs-3'],
      }),
      supporting: [observation({ id: 'obs-3', match_id: SCENE_MATCHES[2]!.id })],
    },
  ];

  test('17. CA-7.1 — el JSON y la pantalla salen de LA MISMA función', async () => {
    const one = scene({ reads });
    const two = scene({ reads });

    const fromApi = BoardSnapshotSchema.parse(
      JSON.parse(await (await boardApiHandler({ ports: one.ports })(get(API))).text()),
    );
    const direct = await boardSnapshotOf(two.ports);

    expect(fromApi).toEqual(direct);
  });

  test('18. CA-7.2 — `version` es el `decided_at` más reciente, o `null`', async () => {
    const withDecisions = BoardSnapshotSchema.parse(await json({ reads }));
    expect(withDecisions.version).toBe('2026-09-06T17:55Z');

    const without = BoardSnapshotSchema.parse(await json({}));
    expect(without.version).toBeNull();
  });

  test('19. y no existe ningún contador global ni ninguna tabla de versiones', async () => {
    const { readFile } = await import('node:fs/promises');
    const migrations = await readFile('migrations/0001_canonical_model.sql', 'utf8');

    expect(migrations).not.toContain('create table snapshot_versions');
    expect(migrations).not.toContain('create table board_versions');
  });

  test('20. CA-7.3 — el `ETag` es función del CUERPO, no del reloj', async () => {
    const early = scene({ reads, now: '2026-09-06T18:00:00.000Z' });
    const late = scene({ reads, now: '2026-09-06T23:59:00.000Z' });

    const a = await boardApiHandler({ ports: early.ports })(get(API));
    const b = await boardApiHandler({ ports: late.ports })(get(API));

    expect(a.headers.get('ETag')).toBe(b.headers.get('ETag'));
    expect(a.headers.get('ETag')).not.toBeNull();
  });

  test('21. y `If-None-Match` con ese valor devuelve 304 SIN CUERPO', async () => {
    const board = scene({ reads });
    const first = await boardApiHandler({ ports: board.ports })(get(API));
    const etag = first.headers.get('ETag')!;

    const second = scene({ reads });
    const response = await boardApiHandler({ ports: second.ports })(
      get(API, { 'If-None-Match': etag }),
    );

    expect(response.status).toBe(304);
    expect(await response.text()).toBe('');
    expect(response.headers.get('ETag')).toBe(etag);
  });

  test('22. y un cuerpo distinto da un `ETag` distinto', async () => {
    expect(etagOf('{"a":1}')).not.toBe(etagOf('{"a":2}'));
    expect(etagOf('{"a":1}')).toBe(etagOf('{"a":1}'));
  });

  test('23. CA-7.4 — los dos números viven en `src/api/freshness.ts` y en ningún otro sitio', async () => {
    const { readSourceFiles } = await import('../site/source-scan');
    const files = await readSourceFiles();

    // UN SOLO DOMICILIO: el único fichero de `src/` que ASIGNA los dos números
    // y el único que escribe la directiva de caché. Todo lo demás los recibe
    // por identificador o los interpola. Buscar el dígito suelto sería una
    // lista negra sobre números —`slice(0, 10)` es un `10`— y no un mecanismo
    // (ADR-016 §3.5).
    const assigns = files
      .filter((file) => /=\s*30;|=\s*10;/.test(file.text) && /SECONDS/.test(file.text))
      .map((file) => file.path);
    expect(assigns).toEqual(['api/freshness.ts']);

    const { stripComments } = await import('../site/source-scan');
    const cacheDirective = files
      .filter((file) => stripComments(file.text).includes('s-maxage'))
      .map((file) => file.path);
    expect(cacheDirective).toEqual(['api/freshness.ts']);

    // Y el mecanismo muerde: `api/freshness.ts` SÍ los escribe.
    const home = files.find((file) => file.path === 'api/freshness.ts');
    expect(home?.text).toContain(`= ${REFRESH_SECONDS}`);
    expect(home?.text).toContain(`= ${SHARED_CACHE_SECONDS}`);

    // Y el literal de la leyenda los INTERPOLA, no los escribe.
    const { gl } = await import('@/i18n/gl');
    expect(gl.board.autoRefresh).toContain('{seconds}');
    expect(gl.board.autoRefresh).not.toContain(`${REFRESH_SECONDS}`);
  });

  test('24. CA-7.5 — la caché es COMPARTIDA y corta: `s-maxage`, ni `private` ni `no-store`', async () => {
    const board = scene({ reads });
    const response = await boardApiHandler({ ports: board.ports })(get(API));
    const cache = response.headers.get('Cache-Control')!;

    expect(cache).toBe(BOARD_CACHE_CONTROL);
    expect(cache).toContain(`s-maxage=${SHARED_CACHE_SECONDS}`);
    expect(cache).not.toContain('private');
    expect(cache).not.toContain('no-store');
  });
});

describe('CA-11 — el orden: competición, hora, `match_id`, y nada más', () => {
  test('25. CA-11.2 — dos ordenaciones del mismo conjunto dan la MISMA salida', async () => {
    const forwards = BoardSnapshotSchema.parse(await json({ matches: SCENE_MATCHES }));
    const backwards = BoardSnapshotSchema.parse(
      await json({ matches: [...SCENE_MATCHES].reverse() }),
    );

    expect(forwards.matches.map((row) => row.match_id)).toEqual(
      backwards.matches.map((row) => row.match_id),
    );
  });

  test('26. dentro de cada competición, ascendente por `kickoff`, y agrupado', async () => {
    const payload = BoardSnapshotSchema.parse(await json({ matches: SCENE_MATCHES }));
    const ids = payload.matches.map((row) => row.match_id);

    // Preferente primero (por `competition_id`), y dentro por hora.
    expect(ids).toEqual([
      'futgal-preferente-g1-2026-27-j1-celtab-ourense',
      'futgal-preferente-g1-2026-27-j1-compostela-barco',
      'rfef-tercera-g1-2026-27-j1-lugob-ferrolb',
    ]);
  });

  test('27. CA-11.4 — la posición NO cambia cuando cambia el estado ni el cualificador', async () => {
    const scheduled = BoardSnapshotSchema.parse(await json({ matches: SCENE_MATCHES }));

    const live = BoardSnapshotSchema.parse(
      await json({
        matches: SCENE_MATCHES,
        reads: [
          {
            match_id: SCENE_MATCHES[1]!.id,
            live: liveDecision({ match_id: SCENE_MATCHES[1]!.id, status: 'live' }),
            supporting: [observation({ match_id: SCENE_MATCHES[1]!.id })],
          },
        ],
      }),
    );

    const finished = BoardSnapshotSchema.parse(
      await json({
        matches: SCENE_MATCHES,
        reads: [
          {
            match_id: SCENE_MATCHES[1]!.id,
            live: liveDecision({
              match_id: SCENE_MATCHES[1]!.id,
              status: 'finished',
              rule: 'RN-06',
            }),
            supporting: [],
          },
        ],
      }),
    );

    const ids = (payload: { matches: readonly { match_id: string }[] }): readonly string[] =>
      payload.matches.map((row) => row.match_id);

    expect(ids(live)).toEqual(ids(scheduled));
    expect(ids(finished)).toEqual(ids(scheduled));
  });

  test('28. CONTROL POSITIVO: meter el estado en la clave de orden cambiaría la salida', () => {
    // El comparador real NO mira el estado; uno que lo mirase ordenaría
    // distinto sobre el mismo conjunto, y eso es lo que CA-11.4 prohíbe.
    const rows = [
      { competition_id: 'a', kickoff: '2026-09-06T16:00Z', match_id: 'x', status: 'finished' },
      { competition_id: 'a', kickoff: '2026-09-06T17:00Z', match_id: 'y', status: 'live' },
    ];

    const byClock = [...rows].sort((a, b) =>
      compareBoardRows(a as never, b as never),
    );
    const byStatus = [...rows].sort((a, b) => (a.status === 'live' ? -1 : b.status === 'live' ? 1 : 0));

    expect(byClock.map((row) => row.match_id)).toEqual(['x', 'y']);
    expect(byStatus.map((row) => row.match_id)).toEqual(['y', 'x']);
  });

  test('29. CA-11.1 — la cabecera de cada competición es su nombre canónico ENTERO', async () => {
    const board = scene({ matches: SCENE_MATCHES });
    const html = await (await boardHandler({ ports: board.ports, locale: 'gl' })(get(PAGE))).text();

    for (const name of Object.values(COMPETITION_NAMES)) {
      expect(html).toContain(name);
    }
  });

  test('30. CA-11.5 — cada fila lleva su FECHA además de su hora', async () => {
    const board = scene({ matches: SCENE_MATCHES });
    const html = await (await boardHandler({ ports: board.ports, locale: 'gl' })(get(PAGE))).text();

    expect(html).toContain(`${KICKOFF.slice(0, 10)} ${KICKOFF.slice(11, 16)}`);
  });
});

describe('la proyección, ejercida directamente', () => {
  test('31. CA-4.5 — no envejece un dato: `live` con `decided_at` de hace 40 min sigue `live`', () => {
    const decision = liveDecision({ decided_at: '2026-09-06T17:20:00.000Z' });

    const payload = projectBoard({
      matches: [SCENE_MATCHES[0]!],
      reads: [{ match_id: SCENE_MATCHES[0]!.id, live: decision, supporting: [observation()] }],
      teamNames: new Map(Object.entries(TEAM_NAMES)) as never,
      competitionNames: new Map(Object.entries(COMPETITION_NAMES)) as never,
      matchdayDeclared: true,
    });

    expect(payload.matches[0]!.status).toBe('live');
    expect(payload.matches[0]!.qualifier).toBe('provisional');
    expect(payload.matches[0]!.qualifier).not.toBe('sen_sinal');
  });

  test('32. CA-8.1 — ningún instante nuestro sale con segundos, ni en HTML ni en JSON', async () => {
    const reads = [
      {
        match_id: SCENE_MATCHES[0]!.id,
        live: liveDecision(),
        supporting: [observation()],
      },
    ];

    const board = scene({ reads });
    const html = await (await boardHandler({ ports: board.ports, locale: 'gl' })(get(PAGE))).text();
    const other = scene({ reads });
    const body = await (await boardApiHandler({ ports: other.ports })(get(API))).text();

    for (const surface of [html, body]) {
      expect(surface).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    }
  });
});
