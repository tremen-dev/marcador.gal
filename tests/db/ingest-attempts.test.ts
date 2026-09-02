/**
 * CA-5.2 y CA-6 — `migrations/0005`: el registro de intentos de ingesta es
 * durable y append-only (ADR-019 §5, RN-13 por analogía, ADR-006).
 *
 * Importar `_harness` REVIENTA sin `DATABASE_URL_TEST`: sin base real estos
 * criterios son UNMET, no *skipped* (gate del 2026-08-29). `npm run test:db`.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { migrate, readMigrations } from '@/db/migrate';
import { PostgresIngestAttemptLog } from '@/db/ingest-attempts';
import { CompetitionIdSchema, SourceIdSchema } from '@/model/ids';
import { connect, dropEverything } from './_harness';
import type { IngestAttempt } from '@/ingest/attempts';
import type { Instant } from '@/model/ids';
import type { Sql } from '@/db/client';

const sql: Sql = connect();

const AT = '2026-09-06T17:00:00.000Z' as Instant;

const OK_ATTEMPT: IngestAttempt = {
  source: SourceIdSchema.parse('ceroacero'),
  competition_id: CompetitionIdSchema.parse('futgal-preferente-g1'),
  attempted_at: AT,
  outcome: 'ok',
  reason: null,
  raw_ref: 'ceroacero/futgal-preferente-g1/2026-09-06/2026-09-06t17-00-00.000z-abcdef123456.html',
  observations_count: 1,
  unresolved_names: ['Atlético Sintético', 'Unión Ficticia'],
};

beforeAll(async () => {
  await dropEverything(sql);
});

afterAll(async () => {
  await sql.end();
});

describe('CA-6 — `migrations/0005` se aplica en orden y una segunda vez no hace nada', () => {
  /**
   * Las versiones EN DISCO, leídas del propio descubrimiento del runner.
   *
   * Esto era el literal `['0001','0002','0003','0004','0005']`. **SPEC-013
   * CA-11 añade `migrations/0006`** (la tabla `alerts`, ADR-021 §5), así que
   * una aserción que ENUMERA las migraciones deja de ser cierta POR UNA
   * DECISIÓN y no por un defecto — la misma forma de F-SPEC-008-1,
   * F-SPEC-012-3 y las tres enmiendas anteriores (SPEC-001 CA-13, SPEC-010
   * CA-10, SPEC-011 CA-8), con la vía de ADR-015 ya sancionada. La enmienda
   * está escrita en el ledger de SPEC-012.
   *
   * Se generaliza CONSERVANDO TODO LO QUE AFIRMABA: `migrate` aplica
   * exactamente lo que hay en disco, en orden, las cinco versiones que CA-6
   * conocía siguen estando, y la lista no puede pasar descubriendo nada.
   */
  const onDisk = async (): Promise<string[]> =>
    (await readMigrations()).map((migration) => migration.version);

  test('1. sobre un esquema vacío, `migrate` aplica en orden lo que hay en disco', async () => {
    const expected = await onDisk();

    expect(expected.length).toBeGreaterThanOrEqual(5);
    expect(expected).toEqual([...expected].sort());
    for (const version of ['0001', '0002', '0003', '0004', '0005']) {
      expect(expected).toContain(version);
    }

    expect(await migrate(sql)).toEqual(expected);
  });

  test('2. la segunda ejecución devuelve `[]`', async () => {
    expect(await migrate(sql)).toEqual([]);
  });

  test('3. la tabla existe, con sus columnas y sin tocar el modelo canónico', async () => {
    const columns = await sql<{ column_name: string; data_type: string }[]>`
      select column_name, data_type
        from information_schema.columns
       where table_schema = 'public' and table_name = 'ingest_attempts'
       order by column_name
    `;
    expect(columns).toEqual([
      { column_name: 'attempted_at', data_type: 'timestamp with time zone' },
      { column_name: 'competition_id', data_type: 'text' },
      { column_name: 'id', data_type: 'integer' },
      { column_name: 'observations_count', data_type: 'integer' },
      { column_name: 'outcome', data_type: 'text' },
      { column_name: 'raw_ref', data_type: 'text' },
      { column_name: 'reason', data_type: 'text' },
      { column_name: 'source', data_type: 'text' },
      { column_name: 'unresolved_names', data_type: 'ARRAY' },
    ]);
  });
});

describe('CA-5 — una fila por intento, entera y con el instante como cadena `Z`', () => {
  beforeEach(async () => {
    // TRUNCATE, no DELETE: los triggers FOR EACH ROW no se disparan, así el
    // test limpia sin debilitar el append-only (mismo truco que el harness).
    await sql`truncate ingest_attempts`;
  });

  test('4. `append` escribe el intento entero y vuelve tal cual se escribió', async () => {
    const log = new PostgresIngestAttemptLog(sql);
    await log.append(OK_ATTEMPT);

    const rows = await sql<Record<string, unknown>[]>`
      select source, competition_id, attempted_at, outcome, reason, raw_ref,
             observations_count, unresolved_names
        from ingest_attempts
    `;
    expect(rows).toEqual([{ ...OK_ATTEMPT, unresolved_names: [...OK_ATTEMPT.unresolved_names] }]);
    // El instante cruza como cadena `Z`, nunca `Date` (ADR-006).
    expect(rows[0]?.['attempted_at']).toBe(AT);
  });

  test('5. `skipped` y `failed` exigen motivo; `ok` exige no llevarlo', async () => {
    const log = new PostgresIngestAttemptLog(sql);

    await expect(
      log.append({ ...OK_ATTEMPT, outcome: 'skipped', reason: null, raw_ref: null }),
    ).rejects.toThrow(/reason|check/i);
    await expect(log.append({ ...OK_ATTEMPT, reason: 'sobra un motivo en ok' })).rejects.toThrow(
      /reason|check/i,
    );
    // Y un `outcome` inventado no entra.
    await expect(
      log.append({ ...OK_ATTEMPT, outcome: 'meh' as IngestAttempt['outcome'] }),
    ).rejects.toThrow(/outcome|check/i);
  });

  test('6. CA-5.2 — `update` y `delete` los rechaza la base (`reject_amendment`)', async () => {
    const log = new PostgresIngestAttemptLog(sql);
    await log.append(OK_ATTEMPT);

    await expect(sql`update ingest_attempts set outcome = 'failed'`).rejects.toThrow(
      /append-only/i,
    );
    await expect(sql`delete from ingest_attempts`).rejects.toThrow(/append-only/i);

    const rows = await sql<{ outcome: string }[]>`select outcome from ingest_attempts`;
    expect(rows).toEqual([{ outcome: 'ok' }]);
  });
});
