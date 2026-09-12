/**
 * `npm run pull -- --session <id>` — mirrors `sessions/<id>/` from the Blob
 * store of the temporary project into `data/`, byte for byte, same keys.
 * Everything after CA-1 happens cold on the laptop over this copy.
 */
import { args, blob, disk, need } from './common.ts';

const a = args();
const sessionId = need(a, 'session');
const from = blob();
const to = disk();
const keys = await from.list(`sessions/${sessionId}/`);
let copied = 0;
for (const key of keys) {
  if ((await to.get(key)) !== null) continue;
  const bytes = await from.get(key);
  if (bytes === null) continue;
  await to.put(key, bytes, 'application/octet-stream');
  copied++;
}
console.log(`${keys.length} objects under sessions/${sessionId}/, ${copied} copied to data/`);
