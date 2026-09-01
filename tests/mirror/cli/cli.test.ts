/**
 * Los dos CLI, ejecutados de verdad (F-SPEC-002-V4).
 *
 * Todo lo demás de SPEC-002 se prueba dentro de vitest, que resuelve el alias
 * `@/…` por configuración. Quien corre la ventana es **Node**, que no lo
 * resuelve, así que el código podía estar entero y verde y la puerta por la que
 * se entra seguir cerrada. Estos casos arrancan los dos comandos como
 * subprocesos —el flujo real, sin dobles— y por eso son los únicos de la suite
 * que hacen HTTP y tocan el disco por el camino del operador.
 *
 * El caso 3 es además la mitad que le faltaba a CA-5 (F-SPEC-002-V2): sobre una
 * ventana inválida la fase B se niega y **no escribe nada** en `hallazgos/`.
 */
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { DiskRawStore } from '@/raw/disk';
import { USER_AGENT } from '@/polite/user-agent';
import { FINDINGS_DIR, FINDINGS_JSON, FINDINGS_MARKDOWN } from '@/mirror/analysis/findings';
import { buildFixture, FIXTURE_COMPETITION, FIXTURE_EXTRACTOR_CONFIG } from '../support/archive';
import { padding, plan } from '../support/plans';
import { CEROACERO, FUTGAL, RESULTADOS } from '../support/targets';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import type { WindowLog } from '@/mirror/window';

const run = promisify(execFile);

const REPO = process.cwd();
const CAPTURAR = join(REPO, 'src/mirror/cli/capturar-cli.ts');
const ANALIZAR = join(REPO, 'src/mirror/cli/analizar-cli.ts');

/** The window of the fixture: six matches, three sources, N = 12. */
const WINDOW = () => {
  const shots = padding(6);
  return plan([FUTGAL, shots], [CEROACERO, shots], [RESULTADOS, shots]);
};

const PAIRING = {
  window: 'fixture cli',
  matches: Array.from({ length: 6 }, (_unused, index) => ({
    match_id: `p${index}`,
    refs: {
      [FUTGAL]: `p${index}`,
      [CEROACERO]: `p${index}`,
      [RESULTADOS]: `p${index}`,
    },
  })),
};

const CALIBRATION = {
  [FUTGAL]: FIXTURE_EXTRACTOR_CONFIG,
  [CEROACERO]: FIXTURE_EXTRACTOR_CONFIG,
  [RESULTADOS]: FIXTURE_EXTRACTOR_CONFIG,
};

/** The environment of the operator: no Blob token, so the store is the disk. */
function operatorEnv(): NodeJS.ProcessEnv {
  const { BLOB_READ_WRITE_TOKEN: _dropped, ...rest } = process.env;
  return rest;
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

/** Prepares a temporary cwd holding the three input files phase B needs. */
async function phaseBWorkspace(log?: (base: WindowLog) => WindowLog) {
  const root = await mkdtemp(join(tmpdir(), 'mirror-cli-'));
  const fixture = await buildFixture(WINDOW(), { store: new DiskRawStore(join(root, 'raw')) });

  await writeJson(join(root, 'ventana.json'), log === undefined ? fixture.log : log(fixture.log));
  await writeJson(join(root, 'pairing.json'), PAIRING);
  await writeJson(join(root, 'calibracion.json'), CALIBRATION);

  return root;
}

describe('F-SPEC-002-V4 — los dos CLI arrancan y hacen su trabajo', () => {
  let server: Server;
  let origin: string;
  const received: { url: string; userAgent: string | undefined }[] = [];

  beforeAll(async () => {
    server = createServer((request, response) => {
      received.push({ url: request.url ?? '', userAgent: request.headers['user-agent'] });
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end('<html><body><table></table></body></html>');
    });
    await new Promise<void>((ready) => server.listen(0, '127.0.0.1', ready));
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise<void>((closed) => server.close(() => closed()));
  });

  test('1. `mirror:capturar` corre la fase A entera: pide, archiva y escribe el registro', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mirror-cli-'));

    await writeFile(join(root, 'robots.txt'), 'User-agent: *\nDisallow:\n', 'utf8');
    await writeJson(join(root, 'config.json'), {
      window: 'ventana de prueba',
      duration_minutes: 1,
      tick_seconds: 60,
      targets: [
        {
          source: FUTGAL,
          competition_id: FIXTURE_COMPETITION,
          url: `${origin}/futgal`,
          ext: 'html',
        },
        {
          source: CEROACERO,
          competition_id: FIXTURE_COMPETITION,
          url: `${origin}/ceroacero`,
          ext: 'html',
        },
      ],
      robots_files: { [origin]: 'robots.txt' },
    });

    const { stdout } = await run('node', [CAPTURAR, 'config.json', 'ventana.json'], {
      cwd: root,
      env: operatorEnv(),
    });

    expect(stdout).toContain('ventana de prueba');

    const log = JSON.parse(await readFile(join(root, 'ventana.json'), 'utf8')) as WindowLog;
    expect(log.ticks).toHaveLength(2);
    expect(log.ticks.every((tick) => tick.outcome === 'ok')).toBe(true);
    expect(log.ticks.every((tick) => tick.raw_ref !== null)).toBe(true);

    // RN-11 by the real exit path, not by a spy: the site saw our UA.
    expect(received.map((request) => request.url).sort()).toEqual(['/ceroacero', '/futgal']);
    expect(received.every((request) => request.userAgent === USER_AGENT)).toBe(true);

    // RN-10: the bytes are on disk under the key the log cites.
    const store = new DiskRawStore(join(root, 'raw'));
    for (const tick of log.ticks) expect(await store.get(tick.raw_ref!)).not.toBeNull();
  }, 30_000);

  test('2. `mirror:analizar` corre la fase B entera y escribe el hallazgo', async () => {
    const root = await phaseBWorkspace();

    const { stdout } = await run(
      'node',
      [ANALIZAR, 'ventana.json', 'pairing.json', 'calibracion.json'],
      { cwd: root, env: operatorEnv() },
    );

    expect(stdout).toContain(CEROACERO);
    expect(stdout).toContain('rn02_segunda_via_entre_automaticas=');
    expect(existsSync(join(root, FINDINGS_MARKDOWN))).toBe(true);
    expect(existsSync(join(root, FINDINGS_JSON))).toBe(true);

    const report = JSON.parse(await readFile(join(root, FINDINGS_JSON), 'utf8')) as {
      spec: string;
      sources: readonly { source: string }[];
    };
    expect(report.spec).toBe('SPEC-002');
    expect(report.sources.map((source) => source.source)).toEqual([CEROACERO, RESULTADOS]);
  }, 30_000);

  test('3. CA-5 — sobre una ventana inválida se niega y no escribe nada en hallazgos/', async () => {
    const root = await phaseBWorkspace((base) => ({
      ticks: [
        ...base.ticks,
        ...Array.from({ length: 12 }, () => ({
          ...base.ticks.find((tick) => tick.source === CEROACERO)!,
          outcome: 'failed' as const,
          reason: 'network',
          raw_ref: null,
        })),
      ],
    }));

    const failure = await run('node', [ANALIZAR, 'ventana.json', 'pairing.json', 'calibracion.json'], {
      cwd: root,
      env: operatorEnv(),
    }).then(
      () => null,
      (error: { code: number; stderr: string }) => error,
    );

    expect(failure).not.toBeNull();
    expect(failure!.stderr).toContain('InvalidWindowError');
    // The ABSENCE of the file is the point (CA-5, enmienda §6): a well-formed
    // report over a broken window is indistinguishable on disk from a
    // legitimate one, and the spec of the engine reads the file, not this test.
    expect(existsSync(join(root, FINDINGS_DIR))).toBe(false);
  }, 30_000);
});
