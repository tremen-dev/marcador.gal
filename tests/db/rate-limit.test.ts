/**
 * CA-14, the durable half — the one that only a real Postgres can answer.
 *
 * Importing `_harness` THROWS without `DATABASE_URL_TEST`. That is the gate's
 * decision of 2026-08-29 and it applies here word for word: without it CA-14.2
 * (durable half), CA-14.4, CA-14.5 (durable half) and CA-14.6 are **UNMET, not
 * skipped**.
 *
 * `npm run test:db`.
 */
import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { PostgresRateLimit } from '@/db/rate-limit';
import { MIN_REQUEST_INTERVAL_MS } from '@/polite/rate-limit';
import { coldStart } from '../ingest/support/cold-start';
import { stripComments } from '../support/source-tree';
import { rateLimitContract } from '../polite/rate-limit-contract';
import { connect, resetAndMigrate } from './_harness';
import type { Sql } from '@/db/client';

const sql: Sql = connect();

beforeAll(async () => {
  await resetAndMigrate(sql);
});

afterAll(async () => {
  await sql.end();
});

/** CA-14.5 — the SAME battery as the memory implementation, no second copy. */
rateLimitContract('PostgresRateLimit', (intervalMs) =>
  Promise.resolve(
    intervalMs === undefined ? new PostgresRateLimit(sql) : new PostgresRateLimit(sql, intervalMs),
  ),
);

const T0 = Date.parse('2026-09-06T17:00:00.000Z');

describe('CA-14 — migración 0002 y el estado durable del ritmo', () => {
  test('1. `migrations/0002` está aplicada y la tabla existe con su clave', async () => {
    const applied = await sql<{ version: string }[]>`
      select version from schema_migrations order by version
    `;
    expect(applied.map((row) => row.version)).toContain('0002');

    const columns = await sql<{ column_name: string; data_type: string }[]>`
      select column_name, data_type
      from information_schema.columns
      where table_name = 'request_rhythm'
      order by column_name
    `;
    expect(columns).toEqual([
      { column_name: 'last_request_at', data_type: 'timestamp with time zone' },
      { column_name: 'pair', data_type: 'text' },
    ]);
  });

  test('2. lo único que se persiste es un instante por par: nada del modelo canónico', async () => {
    // La frontera de la enmienda es exacta: ni `Observation` ni `Decision`
    // tocan la base de datos en esta spec (F-SPEC-001-3 sigue en pie). Si
    // alguien cuelga aquí una clave ajena, este caso cae.
    const rows = await sql<{ pair: string }[]>`select pair from request_rhythm`;
    for (const row of rows) expect(row.pair).toMatch(/^[^/]+\/[^/]+$/);
  });
});

describe('CA-14.2 — instancia nueva por tick: el ritmo sobrevive al proceso', () => {
  beforeEach(async () => {
    await sql`delete from request_rhythm`;
  });

  test('3. diez `SourceAdapter` construidos por separado, reloj parado: UNA petición', async () => {
    // Ni un bucle largo ni un proceso vivo: el adaptador se construye DIEZ
    // VECES, cada uno con su propio puerto recién creado, compartiendo
    // únicamente el almacén durable. Es literalmente lo que hace un arranque
    // en frío de Vercel, y es donde F-SPEC-008-V13 medía diez peticiones.
    const result = await coldStart({
      instances: 10,
      makeRateLimit: () => new PostgresRateLimit(sql),
    });

    expect(result.targetRequests).toBe(1);
    expect(result.kinds.filter((kind) => kind === 'captured')).toHaveLength(1);
    expect(result.kinds.filter((kind) => kind === 'skipped')).toHaveLength(9);

    // Y las nueve traen el motivo legible del limitador, no un silencio.
    for (const reason of result.reasons.filter((value) => value !== null)) {
      expect(reason).toContain('RN-11');
      expect(reason).toContain('ceroacero/futgal-preferente-g1');
    }
  });

  test('4. con el reloj adelantado 60 s entre construcciones, salen DIEZ', async () => {
    // El control del control: si el caso 3 diera 1 porque el adaptador está
    // roto y no pide nunca, este caso también daría 1.
    const result = await coldStart({
      instances: 10,
      advanceMsBetween: MIN_REQUEST_INTERVAL_MS,
      makeRateLimit: () => new PostgresRateLimit(sql),
    });

    expect(result.targetRequests).toBe(10);
  });
});

describe('CA-14.4 — dos que llegan a la vez, uno solo sale', () => {
  beforeEach(async () => {
    await sql`delete from request_rhythm`;
  });

  test('5. dos concesiones concurrentes sobre el mismo par y el mismo instante', async () => {
    // Es el caso que producen una invocación manual, un reintento del cron o
    // un despliegue solapado, y el único que un doble en memoria NO puede
    // simular: dos instancias que leen «me toca» a la vez. La sentencia
    // `insert … on conflict … where … returning …` lo resuelve en un solo
    // paso atómico, así que la segunda espera el cerrojo de la fila y vuelve a
    // evaluar el `where` contra lo que escribió la primera.
    const key = 'ceroacero/concurrent-pair';
    const a = new PostgresRateLimit(sql);
    const b = new PostgresRateLimit(sql);

    const granted = await Promise.all([a.takeTurn(key, T0), b.takeTurn(key, T0)]);

    expect(granted.filter(Boolean)).toHaveLength(1);
  });

  test('6. y con diez a la vez sigue saliendo exactamente uno', async () => {
    const key = 'ceroacero/concurrent-ten';
    const ports = Array.from({ length: 10 }, () => new PostgresRateLimit(sql));

    const granted = await Promise.all(ports.map((port) => port.takeTurn(key, T0)));

    expect(granted.filter(Boolean)).toHaveLength(1);
  });
});

describe('CA-14.6 — el número vive donde vivía, y el SQL no lo repite', () => {
  test('7. la implementación durable recibe el instante límite, no un intervalo', async () => {
    // El SQL no lleva aritmética sobre el tiempo: si la llevara, cambiar
    // `MIN_REQUEST_INTERVAL_MS` no movería a esta implementación y el caso 6
    // de la batería de contrato —que la corre con 10 000 ms— fallaría aquí y
    // no en la de memoria.
    const impl = stripComments(
      await readFile(new URL('../../src/db/rate-limit.ts', import.meta.url), 'utf8'),
    );
    // El SQL no lleva el número ni la palabra: recibe el instante límite.
    expect(impl).not.toMatch(/\b60[_ ]?000\b/);
    expect(impl).toMatch(/intervalMs: number = MIN_REQUEST_INTERVAL_MS/);
    expect(impl).toContain('turnLimitMs');
    const statement = /insert into request_rhythm[\s\S]*?returning pair/.exec(impl)?.[0];
    expect(statement, 'no se encuentra la sentencia del ritmo').toBeDefined();
    expect(statement).not.toMatch(/\binterval\b/i);
    expect(statement).not.toMatch(/\d/);

    const migration = await readFile(
      new URL('../../migrations/0002_request_rhythm.sql', import.meta.url),
      'utf8',
    );
    expect(migration).not.toMatch(/\binterval\s/i);

    const key = 'ceroacero/interval-lives-once';
    const tight = new PostgresRateLimit(sql, 10_000);
    await tight.takeTurn(key, T0);

    expect(await tight.takeTurn(key, T0 + 9_999)).toBe(false);
    expect(await tight.takeTurn(key, T0 + 10_000)).toBe(true);

    // Y el intervalo por defecto sigue siendo el declarado en `src/polite/`.
    const key2 = 'ceroacero/interval-default';
    const plain = new PostgresRateLimit(sql);
    await plain.takeTurn(key2, T0);
    expect(await plain.takeTurn(key2, T0 + MIN_REQUEST_INTERVAL_MS - 1)).toBe(false);
    expect(await plain.takeTurn(key2, T0 + MIN_REQUEST_INTERVAL_MS)).toBe(true);
  });
});
