/**
 * `npm run mirror:analizar-sin-referencia -- <log.json> <pairing.json>
 * <calibracion.json>` — la fase B del modo **sin referencia** (SPEC-003).
 *
 * Es el hermano de `analizar.ts` y no su sustituto: aquel cruza cada candidata
 * contra futgal y este las cruza **entre sí**, sin referencia. Los dos van a
 * convivir — si la RFGF autoriza, SPEC-002 se corre tal cual—, así que son dos
 * comandos y dos ficheros de hallazgo, no uno con un modo escondido en un flag.
 *
 * `besoccer` y no `resultados-futbol` (ADR-008 §2): `resultados-futbol.com` no
 * es una fuente, es un 301 a `besoccer.es`.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { BlobRawStore } from '@/raw/blob.ts';
import { DiskRawStore } from '@/raw/disk.ts';
import { sourceId } from '@/mirror/ids.ts';
import { analyzeInMode } from '@/mirror/analysis/mode.ts';
import { writeReferencelessFindings } from '@/mirror/analysis/referenceless/findings.ts';
import { PairingSchema, buildPairingIndex } from '@/mirror/analysis/pairing.ts';
import { ExtractorCalibrationSchema, loadExtractors } from '@/mirror/analysis/sources.ts';
import type { WindowLog } from '@/mirror/window.ts';
import type { RawStore } from '@/raw/store.ts';

/** Las dos candidatas de peso 0.7 (RN-01, ADR-008 §2). Ninguna es «la fuente». */
const CANDIDATES = ['ceroacero', 'besoccer'] as const;

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(resolve(path), 'utf8')) as unknown;
}

export async function main(argv: readonly string[]): Promise<void> {
  const [logPath, pairingPath, calibrationPath, temporalWindow] = argv;
  if (logPath === undefined || pairingPath === undefined || calibrationPath === undefined) {
    throw new Error(
      'usage: mirror:analizar-sin-referencia -- <log.json> <pairing.json> ' +
        '<calibracion.json> [ventana-temporal]',
    );
  }

  const log = (await readJson(logPath)) as WindowLog;
  const pairing = buildPairingIndex(PairingSchema.parse(await readJson(pairingPath)));
  const extractors = loadExtractors(
    ExtractorCalibrationSchema.parse(await readJson(calibrationPath)),
  );

  const store: RawStore =
    process.env['BLOB_READ_WRITE_TOKEN'] === undefined
      ? new DiskRawStore(resolve('raw'))
      : new BlobRawStore();

  // El modo se declara aquí, explícitamente: no hay valor por defecto (CA-1).
  const report = await analyzeInMode({
    modo: 'sin-referencia',
    store,
    keys: log.ticks
      .filter((tick) => tick.outcome === 'ok' && tick.raw_ref !== null)
      .map((tick) => tick.raw_ref!),
    log,
    extractors,
    pairing,
    candidates: [sourceId(CANDIDATES[0]), sourceId(CANDIDATES[1])],
    ...(temporalWindow === undefined ? {} : { temporalWindow }),
  });

  if (report.modo !== 'sin-referencia') throw new Error('unreachable: mode was declared');

  const written = await writeReferencelessFindings(report, resolve('.'));

  console.log(`modo: ${report.modo} (referencia: ninguna)`);
  console.log(
    `${report.pair.candidatas.join(' x ')}: ${report.pair.verdict} (${report.pair.reason}) — ` +
      `rn02_segunda_via_entre_automaticas=${report.pair.rn02_segunda_via_entre_automaticas}`,
  );
  console.log(
    `veredictos por candidata: ${report.veredictos_por_candidata.estado} ` +
      `(referencia prevista: ${report.veredictos_por_candidata.referencia_prevista})`,
  );
  console.log(
    `purga prevista: ${report.retencion_del_archivo.purga_prevista} · ` +
      `purga máxima: ${report.retencion_del_archivo.purga_maxima} (${report.retencion_del_archivo.adr})`,
  );
  console.log(`written: ${written.markdown} and ${written.json}`);
}
