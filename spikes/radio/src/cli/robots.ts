/**
 * `npm run robots` — CA-0.3 helper: fetches the robots.txt of the host of
 * SPIKE_STREAM_URL with the User-Agent of ADR-011, ARCHIVES it under
 * `data/robots/`, and prints the verdict for the playlist path. Nothing else
 * is requested. Run it before the first capture and cite the file in CA-0.3.
 */
import { robotsUrlOf, robotsVerdict } from '../robots.ts';
import { USER_AGENT } from '../user-agent.ts';
import { disk, stamp } from './common.ts';

const streamUrl = process.env['SPIKE_STREAM_URL'];
if (!streamUrl) {
  console.error('SPIKE_STREAM_URL is not set (write CA-0.3 in the ledger first)');
  process.exit(2);
}
const url = robotsUrlOf(streamUrl);
const archive = disk();
let verdict;
try {
  const res = await fetch(url, { headers: { 'user-agent': USER_AGENT }, cache: 'no-store' });
  const body = new Uint8Array(await res.arrayBuffer());
  const key = `robots/${new URL(url).host}-${stamp()}-${res.status}.txt`;
  await archive.put(key, body, 'text/plain');
  console.log(`archived: data/${key}`);
  verdict = robotsVerdict({ status: res.status, body: new TextDecoder().decode(body) }, streamUrl);
} catch (e) {
  verdict = robotsVerdict({ error: String(e) }, streamUrl);
}
console.log(JSON.stringify({ url, target: streamUrl, userAgent: USER_AGENT, verdict }, null, 2));
process.exit(verdict.status === 'allowed' ? 0 : 1);
