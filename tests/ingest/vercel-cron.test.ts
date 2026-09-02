/**
 * CA-8 — `vercel.json` declara exactamente el cron decidido (ADR-004,
 * ADR-019 §1).
 *
 * El `path` se compara contra la CONSTANTE declarada en `src/ingest/` — no
 * contra un segundo literal escrito aquí — y de la constante deriva la
 * ubicación del fichero de la ruta: un `route.ts` de Next no puede exportar
 * constantes propias, así que la constante vive fuera y este test comprueba
 * que el fichero existe donde ella dice.
 */
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { CRON_INGEST_PATH } from '@/ingest/cron';

describe('CA-8 — un cron, cada minuto, hacia la ruta de CA-7', () => {
  test('1. `vercel.json` declara UN cron con `* * * * *` y el path de la constante', async () => {
    const raw = await readFile(join(process.cwd(), 'vercel.json'), 'utf8');
    const config = JSON.parse(raw) as { crons?: readonly { path: string; schedule: string }[] };

    expect(config.crons).toHaveLength(1);
    expect(config.crons![0]).toEqual({ path: CRON_INGEST_PATH, schedule: '* * * * *' });
  });

  test('2. el fichero de la ruta existe donde la constante dice', () => {
    expect(CRON_INGEST_PATH.startsWith('/')).toBe(true);
    expect(existsSync(join(process.cwd(), 'src/app', CRON_INGEST_PATH, 'route.ts'))).toBe(true);
  });
});
