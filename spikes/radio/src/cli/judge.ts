/**
 * `npm run judge -- --session <id> build` → writes `data/judge/<id>-sheet.json`
 *   (what the judge sees: transcripts under random letters) and
 *   `data/judge/<id>-key.json` (letter → engine; DO NOT OPEN before judging).
 * `npm run judge -- --session <id> tally` → unblinds and prints the CA-3.3
 *   rows. The corpus is `data/corpus/<id>.json` (shape in `src/corpus.ts`),
 *   written by a person, with the criteria written BEFORE building the sheet.
 */
import { readExchanges } from '../asr/run.ts';
import { buildSheet, type Corpus, type Sheet, type SheetKey, unblind } from '../corpus.ts';
import { hitRateTable } from '../report.ts';
import { args, disk, need, readJson } from './common.ts';

const a = args();
const sessionId = need(a, 'session');
const action = a.get('_0') ?? a.get('_1') ?? 'build';
const archive = disk();
const corpus = await readJson<Corpus>(archive, `corpus/${sessionId}.json`);
if (!corpus.criteria || corpus.criteria.trim().length === 0) {
  console.error('the corpus has no criteria: write them BEFORE judging (CA-3.3)');
  process.exit(1);
}
const exchanges = await readExchanges(archive, sessionId);

if (action === 'build') {
  const { sheet, key } = await buildSheet(corpus, exchanges, archive);
  await archive.put(`judge/${sessionId}-sheet.json`, new TextEncoder().encode(JSON.stringify(sheet, null, 2)), 'application/json');
  await archive.put(`judge/${sessionId}-key.json`, new TextEncoder().encode(JSON.stringify(key, null, 2)), 'application/json');
  console.log(`sheet: data/judge/${sessionId}-sheet.json (${sheet.items.length} items). Fill "verdicts" per letter: {"teams": true|false, "score": true|false|null}. Do not open the key.`);
} else if (action === 'tally') {
  const sheet = await readJson<Sheet>(archive, `judge/${sessionId}-sheet.json`);
  const key = await readJson<SheetKey>(archive, `judge/${sessionId}-key.json`);
  console.log(hitRateTable(unblind(corpus, sheet, key)));
} else {
  console.error(`unknown action ${action}`);
  process.exit(2);
}
