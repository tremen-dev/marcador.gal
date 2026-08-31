/**
 * `npm run mirror:capturar -- <config.json> <log.json>` — phase A.
 *
 * Archives and does not parse (CA-3). It runs equally well inside a Vercel Cron
 * tick or as a supervised local process for the hour: the criteria constrain
 * the archive and the rhythm, not the host (spec, *Fuera de alcance*).
 *
 * Node 22 runs TypeScript directly, so there is no build step (ADR-006).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { BlobRawStore } from '@/raw/blob.ts';
import { DiskRawStore } from '@/raw/disk.ts';
import { competitionId, sourceId } from '@/mirror/ids.ts';
import { USER_AGENT } from '@/mirror/user-agent.ts';
import { Capturer } from '@/mirror/capture/capturer.ts';
import { WindowConfigSchema } from '@/mirror/capture/config.ts';
import { globalFetcher } from '@/mirror/capture/http.ts';
import { parseRobots, robotsRegistry } from '@/mirror/capture/robots.ts';
import { systemClock } from '@/mirror/capture/ports.ts';
import type { CaptureTarget } from '@/mirror/capture/ports.ts';
import type { RawStore } from '@/raw/store.ts';

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

export async function main(argv: readonly string[]): Promise<void> {
  const [configPath, logPath] = argv;
  if (configPath === undefined || logPath === undefined) {
    throw new Error('usage: mirror:capturar -- <config.json> <log.json>');
  }

  const config = WindowConfigSchema.parse(
    JSON.parse(await readFile(resolve(configPath), 'utf8')),
  );

  const robots: [string, ReturnType<typeof parseRobots>][] = [];
  for (const [origin, file] of Object.entries(config.robots_files)) {
    const text = await readFile(resolve(dirname(configPath), file), 'utf8');
    robots.push([origin, parseRobots(text, USER_AGENT)]);
  }

  const targets: CaptureTarget[] = config.targets.map((target) => ({
    source: sourceId(target.source),
    competition_id: competitionId(target.competition_id),
    url: target.url,
    ext: target.ext,
  }));

  const store: RawStore =
    process.env['BLOB_READ_WRITE_TOKEN'] === undefined
      ? new DiskRawStore(resolve('raw'))
      : new BlobRawStore();

  const capturer = new Capturer({
    targets,
    fetcher: globalFetcher,
    store,
    clock: systemClock,
    robots: robotsRegistry(robots),
  });

  const ticks = Math.ceil((config.duration_minutes * 60) / config.tick_seconds);
  for (let tick = 0; tick < ticks; tick += 1) {
    await capturer.tick();
    await sleep(config.tick_seconds * 1000);
  }

  const log = capturer.log();
  await writeFile(resolve(logPath), `${JSON.stringify(log, null, 2)}\n`, 'utf8');

  const ok = log.ticks.filter((entry) => entry.outcome === 'ok').length;
  console.log(
    `window ${config.window}: ${log.ticks.length} ticks, ${ok} ok, log written to ${logPath}`,
  );
}
