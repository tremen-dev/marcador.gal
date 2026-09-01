/**
 * CA-9, CA-10 y CA-13 — la `Observation` que produce el adaptador, su
 * determinismo al reproducir el archivo, y que la identidad no se adivina.
 */
import { describe, expect, test } from 'vitest';
import { readRows } from '@/ingest/observations';
import { ObservationSchema } from '@/model/observation';
import { CompetitionIdSchema, MatchIdSchema, SourceIdSchema } from '@/model/ids';
import type { MatchResolver, SourceRow } from '@/ingest/ports';
import type { RawRef } from '@/raw/key';

const CEROACERO = SourceIdSchema.parse('ceroacero');
const TERCERA = CompetitionIdSchema.parse('rfef-tercera-g1');
const AT = '2026-09-06T18:12:00.000Z';

const RAW_REF =
  'ceroacero/rfef-tercera-g1/2026-09-06/2026-09-06t18-12-00.000z-abcdef012345.html' as RawRef;
const OTHER_RAW_REF =
  'ceroacero/rfef-tercera-g1/2026-09-06/2026-09-06t18-13-00.000z-0123456789ab.html' as RawRef;

const LIVE: SourceRow = {
  source_ref: '/partido/2026-09-06-sd-inventada-cf-suposto/90002',
  home_name: 'SD Inventada',
  away_name: 'CF Suposto',
  status: 'live',
  home_score: 2,
  away_score: 1,
  kickoff: null,
};

const SCHEDULED: SourceRow = {
  source_ref: '/partido/2026-09-06-atletico-sintetico-union-ficticia/90001',
  home_name: 'Atlético Sintético',
  away_name: 'Unión Ficticia',
  status: 'scheduled',
  home_score: null,
  away_score: null,
  kickoff: '20:00',
};

const UNKNOWN: SourceRow = {
  source_ref: '/partido/2026-09-06-sd-descoñecida-cf-sen-alias/90099',
  home_name: 'SD Descoñecida',
  away_name: 'CF Sen Alias',
  status: 'finished',
  home_score: 0,
  away_score: 0,
  kickoff: null,
};

/**
 * Doble del puerto `MatchResolver`. Resuelve por el texto de la fuente y
 * SOLO las filas que conoce: nunca inventa un `MatchId` (RN-09).
 */
function resolverFor(known: readonly string[]): MatchResolver {
  return {
    resolve: async (row: SourceRow) =>
      known.includes(row.source_ref) ? MatchIdSchema.parse(`m:${row.source_ref}`) : null,
  };
}

const ALL = resolverFor([LIVE.source_ref, SCHEDULED.source_ref, UNKNOWN.source_ref]);

async function read(rows: readonly SourceRow[], options?: { readonly weight?: number }) {
  return await readRows({
    rows,
    source: CEROACERO,
    competitionId: TERCERA,
    confidence: options?.weight ?? 0.7,
    observedAt: AT,
    rawRef: RAW_REF,
    resolver: ALL,
  });
}

describe('CA-9 — la forma de la `Observation`', () => {
  test('1. valida contra `ObservationSchema` antes de salir del adaptador', async () => {
    const { observations } = await read([LIVE]);

    expect(observations).toHaveLength(1);
    expect(() => ObservationSchema.parse(observations[0])).not.toThrow();
  });

  test('2. lleva la fuente y el marcador de la fila', async () => {
    const [observation] = (await read([LIVE])).observations;

    expect(observation?.source).toBe('ceroacero');
    expect(observation?.status).toBe('live');
    expect(observation?.home_score).toBe(2);
    expect(observation?.away_score).toBe(1);
  });

  test('3. el `confidence` sale del peso que se le pasa, no de una constante interna', async () => {
    // RN-01: el peso vive en el registro de fuentes. Si cambia allí, cambia
    // aquí — y este caso es la prueba de que no hay un 0.7 escondido dentro.
    const original = (await read([LIVE])).observations[0];
    const reweighted = (await read([LIVE], { weight: 1 })).observations[0];

    expect(original?.confidence).toBe(0.7);
    expect(reweighted?.confidence).toBe(1);
  });

  test('4. `observed_at` es cadena ISO 8601 UTC con Z, nunca un `Date` (ADR-006)', async () => {
    const [observation] = (await read([LIVE])).observations;

    expect(typeof observation?.observed_at).toBe('string');
    expect(observation?.observed_at).toBe(AT);
    expect(observation?.observed_at).toMatch(/Z$/);
    expect(observation?.observed_at).not.toBeInstanceOf(Date);
  });

  test('5. `raw_ref` es obligatorio y apunta al objeto archivado', async () => {
    const [observation] = (await read([LIVE])).observations;

    expect(observation?.raw_ref).toBe(RAW_REF);
  });

  test('6. sale congelada, y ningún camino la reescribe (RN-13)', async () => {
    const [observation] = (await read([LIVE])).observations;

    expect(Object.isFrozen(observation)).toBe(true);
    expect(() => {
      (observation as unknown as { home_score: number }).home_score = 9;
    }).toThrow(/read only|not extensible|Cannot assign/);
    expect(observation?.home_score).toBe(2);
  });

  test('7. una rama sin marcador sale con los dos a null', async () => {
    const [observation] = (await read([SCHEDULED])).observations;

    expect(observation?.status).toBe('scheduled');
    expect(observation?.home_score).toBeNull();
    expect(observation?.away_score).toBeNull();
  });
});

describe('CA-10 — el replay desde el archivo es determinista', () => {
  test('8. los mismos bytes, resolver e instante producen `Observation` idénticas, `id` incluido', async () => {
    const first = await read([LIVE, SCHEDULED]);
    const second = await read([LIVE, SCHEDULED]);

    expect(second.observations).toEqual(first.observations);
    expect(second.observations.map((o) => o.id)).toEqual(first.observations.map((o) => o.id));
  });

  test('9. el `id` no es un contador: cambiar el ORDEN de las filas no lo mueve', async () => {
    const forwards = (await read([LIVE, SCHEDULED])).observations;
    const backwards = (await read([SCHEDULED, LIVE])).observations;

    const byRef = (list: typeof forwards) =>
      Object.fromEntries(list.map((o) => [o.match_id, o.id]));

    expect(byRef(backwards)).toEqual(byRef(forwards));
    // Y dos filas distintas de la MISMA captura no comparten id.
    expect(forwards[0]?.id).not.toBe(forwards[1]?.id);
    expect(forwards[0]?.id).toMatch(/^[0-9a-f]{32}$/);
  });

  test('10. dos capturas distintas del mismo partido producen `id` distintos', async () => {
    const first = await readRows({
      rows: [LIVE],
      source: CEROACERO,
      competitionId: TERCERA,
      confidence: 0.7,
      observedAt: AT,
      rawRef: RAW_REF,
      resolver: ALL,
    });
    const second = await readRows({
      rows: [LIVE],
      source: CEROACERO,
      competitionId: TERCERA,
      confidence: 0.7,
      observedAt: AT,
      rawRef: OTHER_RAW_REF,
      resolver: ALL,
    });

    expect(second.observations[0]?.id).not.toBe(first.observations[0]?.id);
  });
});

describe('CA-13 — la identidad no se adivina nunca (RN-09)', () => {
  const PARTIAL = resolverFor([LIVE.source_ref, SCHEDULED.source_ref]);

  async function readPartial() {
    return await readRows({
      rows: [LIVE, SCHEDULED, UNKNOWN],
      source: CEROACERO,
      competitionId: TERCERA,
      confidence: 0.7,
      observedAt: AT,
      rawRef: RAW_REF,
      resolver: PARTIAL,
    });
  }

  test('11. un resolver que resuelve dos de tres produce DOS `Observation`', async () => {
    const { observations } = await readPartial();

    expect(observations).toHaveLength(2);
    expect(observations.map((o) => o.match_id)).toEqual([
      `m:${LIVE.source_ref}`,
      `m:${SCHEDULED.source_ref}`,
    ]);
  });

  test('12. y ninguna por la tercera', async () => {
    const { observations } = await readPartial();

    expect(observations.map((o) => o.match_id)).not.toContain(`m:${UNKNOWN.source_ref}`);
  });

  test('13. la fila no resuelta vuelve en una lista aparte, íntegra', async () => {
    const { unresolved } = await readPartial();

    expect(unresolved).toEqual([UNKNOWN]);
    expect(unresolved[0]?.home_name).toBe('SD Descoñecida');
    expect(unresolved[0]?.away_name).toBe('CF Sen Alias');
    expect(unresolved[0]?.source_ref).toBe(UNKNOWN.source_ref);
  });

  test('14. un resolver que no resuelve nada no produce ninguna `Observation`', async () => {
    const { observations, unresolved } = await readRows({
      rows: [LIVE, SCHEDULED, UNKNOWN],
      source: CEROACERO,
      competitionId: TERCERA,
      confidence: 0.7,
      observedAt: AT,
      rawRef: RAW_REF,
      resolver: resolverFor([]),
    });

    expect(observations).toEqual([]);
    expect(unresolved).toHaveLength(3);
  });

  test('15. el `match_id` no sale nunca del texto de la fuente', async () => {
    const { observations } = await read([LIVE]);

    // Sale del resolver, que es quien lo sabe. El doble lo prefija con `m:`
    // justamente para que un `match_id` fabricado a partir del `source_ref`
    // se distinga de uno resuelto.
    expect(observations[0]?.match_id).toBe(`m:${LIVE.source_ref}`);
    expect(observations[0]?.match_id).not.toBe(LIVE.source_ref);
  });
});
