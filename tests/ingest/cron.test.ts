/**
 * CA-7 — la ruta del cron autentica, falla cerrado y delega (ADR-019 §1).
 *
 * El handler se prueba SIN proceso hijo, como `migrate.main`: la función del
 * tick y el entorno van inyectados, y un espía afirma que sin autorización el
 * tick NO se invoca — ni turno, ni petición, ni fila, porque no se llega a él.
 */
import { describe, expect, test } from 'vitest';
import { CRON_INGEST_PATH, cronIngestHandler } from '@/ingest/cron';
import type { TickSummary } from '@/ingest/tick';
import type { Instant } from '@/model/ids';

const SUMMARY: TickSummary = {
  at: '2026-09-06T15:00:00.000Z' as Instant,
  attempts: { ok: 1, skipped: 0, failed: 0 },
  observations: 1,
};

function spyTick(): { tick: () => Promise<TickSummary>; calls: () => number } {
  let calls = 0;
  return {
    tick: () => {
      calls += 1;
      return Promise.resolve(SUMMARY);
    },
    calls: () => calls,
  };
}

const request = (headers: Record<string, string> = {}): Request =>
  new Request(`https://marcador.gal${CRON_INGEST_PATH}`, { headers });

describe('CA-7 — sin autorización no se hace NINGÚN trabajo', () => {
  test('1. sin header `Authorization`: 401 y el tick no se invoca', async () => {
    const spy = spyTick();
    const handler = cronIngestHandler({ tick: spy.tick, env: { CRON_SECRET: 'segredo' } });

    const response = await handler(request());

    expect(response.status).toBe(401);
    expect(spy.calls()).toBe(0);
  });

  test('2. con un bearer distinto de `CRON_SECRET`: 401 y el tick no se invoca', async () => {
    const spy = spyTick();
    const handler = cronIngestHandler({ tick: spy.tick, env: { CRON_SECRET: 'segredo' } });

    const response = await handler(request({ authorization: 'Bearer outro' }));

    expect(response.status).toBe(401);
    expect(spy.calls()).toBe(0);
  });

  test('3. SIN `CRON_SECRET` en el entorno rechaza aunque el header traiga algo (fallo cerrado)', async () => {
    const spy = spyTick();

    for (const env of [{}, { CRON_SECRET: '' }]) {
      const handler = cronIngestHandler({ tick: spy.tick, env });
      const response = await handler(request({ authorization: 'Bearer segredo' }));
      expect(response.status).toBe(401);
    }
    expect(spy.calls()).toBe(0);
  });
});

describe('CA-7 — con el bearer correcto delega entera y devuelve el resumen', () => {
  test('4. 200 con el JSON del tick: contadores de intentos por outcome', async () => {
    const spy = spyTick();
    const handler = cronIngestHandler({ tick: spy.tick, env: { CRON_SECRET: 'segredo' } });

    const response = await handler(request({ authorization: 'Bearer segredo' }));

    expect(response.status).toBe(200);
    expect(spy.calls()).toBe(1);
    expect(await response.json()).toEqual({
      at: '2026-09-06T15:00:00.000Z',
      attempts: { ok: 1, skipped: 0, failed: 0 },
      observations: 1,
    });
  });
});
