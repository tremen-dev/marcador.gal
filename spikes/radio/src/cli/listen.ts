/**
 * `npm run listen -- --minutes 11 [--session <id>]` — the SAME session code as
 * the function, run on the laptop with the disk archive. It is the fallback
 * of CA-1.2 («descarga al portátil») and the way to capture the half hour if
 * the temporary project is not up yet; it does NOT measure CA-1 (that needs
 * the function) — its report says `region: "laptop"`.
 */
import { listenSession } from '../listen.ts';
import { args, disk, stamp } from './common.ts';

const a = args();
const streamUrl = process.env['SPIKE_STREAM_URL'];
if (!streamUrl) {
  console.error('SPIKE_STREAM_URL is not set (CA-0.3 first)');
  process.exit(2);
}
const minutes = Number(a.get('minutes') ?? '11');
const sessionId = a.get('session') ?? `${stamp()}-laptop`;
const report = await listenSession(
  { playlistUrl: streamUrl, minutes, sessionId, region: 'laptop' },
  {
    archive: disk(),
    now: Date.now,
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    fetch: async (url, init) => {
      const res = await fetch(url, { headers: init.headers, cache: 'no-store' });
      return { status: res.status, bytes: async () => new Uint8Array(await res.arrayBuffer()) };
    },
  },
);
console.log(JSON.stringify(report, null, 2));
process.exit(report.stopReason === 'robots-disallowed' || report.stopReason === 'error' ? 1 : 0);
