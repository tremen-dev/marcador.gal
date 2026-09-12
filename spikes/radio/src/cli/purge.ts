/**
 * `npm run purge -- --session <id> [--blob] [--all]` — the purge of CA-0.4 /
 * CA-7.5: removes `data/sessions/<id>/` (and, with `--blob`, the same prefix
 * in the Blob store of the temporary project), printing date, paths and
 * counts for the acuse in the ledger. `--all` also removes the corpus, the
 * judge sheets and the reports under `data/`.
 */
import { args, blob, disk, need } from './common.ts';

const a = args();
const sessionId = need(a, 'session');
const local = disk();
const acuse: Record<string, unknown> = { purgedAt: new Date().toISOString(), session: sessionId };
acuse['disk'] = { prefix: `data/sessions/${sessionId}/`, removed: await local.purge(`sessions/${sessionId}/`) };
if (a.has('all')) {
  acuse['diskCorpus'] = { prefix: 'data/corpus/', removed: await local.purge('corpus/') };
  acuse['diskJudge'] = { prefix: 'data/judge/', removed: await local.purge('judge/') };
  acuse['diskRobots'] = { prefix: 'data/robots/', removed: await local.purge('robots/') };
}
if (a.has('blob')) {
  const remote = blob();
  acuse['blob'] = { prefix: `spike-radio/sessions/${sessionId}/`, removed: await remote.purge(`sessions/${sessionId}/`) };
}
console.log(JSON.stringify(acuse, null, 2));
