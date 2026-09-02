/**
 * CA-9 — sin base de datos no sale nada (RN-11, SPEC-008 CA-14.7).
 *
 * Es la herencia de CA-14.7 conducida por el punto de entrada real: el tick
 * compuesto con un `Sql` que revienta no manda NINGUNA petición — ni de
 * robots ni de página —, no archiva nada, y el error sale nombrando la causa.
 * Sin estado del ritmo no hay ritmo demostrable, y eso falla cerrado.
 */
import { describe, expect, test } from 'vitest';
import { composeTickPorts, runIngestTick } from '@/ingest/tick';
import { FakeClock, MemoryRawStore, spyFetcher } from './support/doubles';
import type { MeasurementWindow } from '@/ingest/windows';
import type { Instant } from '@/model/ids';
import type { Sql } from '@/db/client';

const WINDOWS: readonly MeasurementWindow[] = [
  {
    from: '2026-09-06T00:00:00.000Z' as Instant,
    to: '2026-09-07T00:00:00.000Z' as Instant,
    motive: 'xornada sintética de test',
  },
];

/** Un `Sql` sin base detrás: toda consulta revienta nombrando la causa. */
const brokenSql = (() => {
  throw new Error('database is down: connection refused');
}) as unknown as Sql;

describe('CA-9 — el tick falla cerrado cuando la base no está', () => {
  test('1. ninguna petición llega al fetcher, nada se archiva, y el error nombra la causa', async () => {
    const clock = new FakeClock('2026-09-06T15:00:00.000Z');
    const spy = spyFetcher(clock);
    const store = new MemoryRawStore();

    const ports = composeTickPorts({
      sql: brokenSql,
      store,
      fetcher: spy.fetcher,
      clock,
      season: '2026/27',
      windows: WINDOWS,
    });

    await expect(runIngestTick(ports)).rejects.toThrow(/database is down: connection refused/);

    expect(spy.requests).toEqual([]);
    expect(store.size).toBe(0);
  });
});
