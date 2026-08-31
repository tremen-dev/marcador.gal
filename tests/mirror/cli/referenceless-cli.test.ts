/**
 * El CLI del modo sin referencia, ejecutado de verdad, y la mitad de CA-9 que
 * solo se ve desde fuera: sobre una ventana inválida la fase B **se niega y no
 * escribe nada** en `hallazgos/`.
 *
 * Quien corre la ventana es Node, que no resuelve el alias `@/…`: el código
 * podía estar entero y verde y la puerta por la que se entra seguir cerrada
 * (F-SPEC-002-V4). Por eso este caso arranca el comando como subproceso.
 */
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, test } from 'vitest';
import { DiskRawStore } from '@/raw/disk';
import { FINDINGS_JSON, FINDINGS_MARKDOWN } from '@/mirror/analysis/findings';
import {
  REFERENCELESS_FINDINGS_DIR,
  REFERENCELESS_FINDINGS_JSON,
  REFERENCELESS_FINDINGS_MARKDOWN,
} from '@/mirror/analysis/referenceless/findings';
import { buildFixture, FIXTURE_COMPETITION, FIXTURE_EXTRACTOR_CONFIG } from '../support/archive';
import { padding } from '../support/plans';
import {
  BESOCCER,
  CEROACERO,
  PREFERENTE_G1,
  candidatesPlan,
} from '../support/referenceless';
import type { WindowLog } from '@/mirror/window';

const run = promisify(execFile);
const ANALIZAR = join(process.cwd(), 'src/mirror/cli/analizar-sin-referencia-cli.ts');

const WINDOW = () => candidatesPlan(padding(6), padding(6));

const PAIRING = {
  window: 'fixture sin referencia',
  matches: Array.from({ length: 6 }, (_unused, index) => ({
    match_id: `p${index}`,
    refs: { [CEROACERO]: `p${index}`, [BESOCCER]: `p${index}` },
  })),
};

const CALIBRATION = {
  [CEROACERO]: FIXTURE_EXTRACTOR_CONFIG,
  [BESOCCER]: FIXTURE_EXTRACTOR_CONFIG,
};

/** El entorno del operador: sin token de Blob, así que el store es el disco. */
function operatorEnv(): NodeJS.ProcessEnv {
  const { BLOB_READ_WRITE_TOKEN: _dropped, ...rest } = process.env;
  return rest;
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function workspace(log?: (base: WindowLog) => WindowLog): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'mirror-sr-cli-'));
  const fixture = await buildFixture(WINDOW(), { store: new DiskRawStore(join(root, 'raw')) });

  await writeJson(join(root, 'ventana.json'), log === undefined ? fixture.log : log(fixture.log));
  await writeJson(join(root, 'pairing.json'), PAIRING);
  await writeJson(join(root, 'calibracion.json'), CALIBRATION);

  return root;
}

describe('`mirror:analizar-sin-referencia` corre la fase B del modo sin referencia', () => {
  test('1. escribe sus dos ficheros y no toca los de SPEC-002', async () => {
    const root = await workspace();

    const { stdout } = await run(
      'node',
      [ANALIZAR, 'ventana.json', 'pairing.json', 'calibracion.json'],
      { cwd: root, env: operatorEnv() },
    );

    expect(stdout).toContain('sin-referencia');
    expect(stdout).toContain('rn02_segunda_via_entre_automaticas=false');

    expect(existsSync(join(root, REFERENCELESS_FINDINGS_MARKDOWN))).toBe(true);
    expect(existsSync(join(root, REFERENCELESS_FINDINGS_JSON))).toBe(true);
    expect(existsSync(join(root, FINDINGS_MARKDOWN))).toBe(false);
    expect(existsSync(join(root, FINDINGS_JSON))).toBe(false);

    const report = JSON.parse(
      await readFile(join(root, REFERENCELESS_FINDINGS_JSON), 'utf8'),
    ) as { spec: string; modo: string; pair: { candidatas: readonly string[] } };

    expect(report.spec).toBe('SPEC-003');
    expect(report.modo).toBe('sin-referencia');
    expect(report.pair.candidatas).toEqual([CEROACERO, BESOCCER]);
  }, 30_000);

  test('2. CA-9 — con un par declarado sin un solo tick se niega y no escribe nada', async () => {
    const root = await workspace((base) => ({
      ...base,
      // Los cuatro pares que la ventana DEBÍA cubrir. Solo dos corrieron.
      declared_pairs: [
        { source: CEROACERO, competition_id: FIXTURE_COMPETITION },
        { source: BESOCCER, competition_id: FIXTURE_COMPETITION },
        { source: CEROACERO, competition_id: PREFERENTE_G1 },
        { source: BESOCCER, competition_id: PREFERENTE_G1 },
      ],
    }));

    const failure = await run(
      'node',
      [ANALIZAR, 'ventana.json', 'pairing.json', 'calibracion.json'],
      { cwd: root, env: operatorEnv() },
    ).then(
      () => null,
      (error: { code: number; stderr: string }) => error,
    );

    expect(failure).not.toBeNull();
    expect(failure!.stderr).toContain('InvalidWindowError');
    // Los cuatro pares, con su ratio y su marca, y el umbral exigido.
    expect(failure!.stderr).toContain('2 of 4 (source, competition) pairs');
    expect(failure!.stderr).toContain(`${CEROACERO}/${PREFERENTE_G1} at 0.0 % (0/0) BELOW`);
    expect(failure!.stderr).toContain(`${BESOCCER}/${PREFERENTE_G1} at 0.0 % (0/0) BELOW`);
    expect(failure!.stderr).toContain('90 %');

    // La AUSENCIA del fichero es el punto: un informe bien formado sobre una
    // ventana rota es indistinguible en disco de uno legítimo.
    expect(existsSync(join(root, REFERENCELESS_FINDINGS_DIR))).toBe(false);
  }, 30_000);
});
