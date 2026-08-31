/**
 * `npm run mirror:analizar -- <log.json> <pairing.json> <calibracion.json>` —
 * phase B.
 *
 * Repeatable, without the network and without a database: it reads the archive
 * phase A wrote, crosses it and writes the finding. Re-run it as many times as
 * the calibration takes; the window it judges is the same one every time
 * (CA-7).
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { BlobRawStore } from '@/raw/blob.ts';
import { DiskRawStore } from '@/raw/disk.ts';
import { sourceId } from '@/mirror/ids.ts';
import { analyze } from '@/mirror/analysis/analyze.ts';
import { writeFindings } from '@/mirror/analysis/findings.ts';
import { PairingSchema, buildPairingIndex } from '@/mirror/analysis/pairing.ts';
import { ExtractorCalibrationSchema, loadExtractors } from '@/mirror/analysis/sources.ts';
import type { WindowLog } from '@/mirror/window.ts';
import type { RawStore } from '@/raw/store.ts';

const REFERENCE = 'futgal';
const CANDIDATES = ['ceroacero', 'resultados-futbol'] as const;

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(resolve(path), 'utf8')) as unknown;
}

export async function main(argv: readonly string[]): Promise<void> {
  const [logPath, pairingPath, calibrationPath, temporalWindow] = argv;
  if (logPath === undefined || pairingPath === undefined || calibrationPath === undefined) {
    throw new Error(
      'usage: mirror:analizar -- <log.json> <pairing.json> <calibracion.json> [ventana-temporal]',
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

  const report = await analyze({
    store,
    keys: log.ticks
      .filter((tick) => tick.outcome === 'ok' && tick.raw_ref !== null)
      .map((tick) => tick.raw_ref!),
    log,
    extractors,
    pairing,
    reference: sourceId(REFERENCE),
    candidates: [sourceId(CANDIDATES[0]), sourceId(CANDIDATES[1])],
    ...(temporalWindow === undefined ? {} : { temporalWindow }),
  });

  const written = await writeFindings(report, resolve('.'));

  for (const source of report.sources) {
    console.log(
      `${source.source}: ${source.verdict} — rn02_segunda_via_entre_automaticas=${source.rn02_segunda_via_entre_automaticas}`,
    );
  }
  console.log(`${report.pair.sources.join(' x ')}: ${report.pair.verdict}`);
  console.log(`written: ${written.markdown} and ${written.json}`);
}
