/**
 * `npm run report -- --sessions <id>[,<id>,<id>] [--corpus <id>]
 *   [--calendar ../../calendario/2026-27] [--costs data/costs.json]`
 *
 * Writes `data/report/<stamp>.md` with the tables of CA-1..CA-5 from the
 * archive, each with the files that sustain it named. The operator pastes
 * them into `docs/epicas/EPIC-005-.../hallazgos/spike-radio-galega.md` and
 * writes the prose (CA-6.3..CA-6.6) by hand.
 *
 * `costs.json` shape (written by the operator after reading the panels):
 *   { "engines": { "google:chirp_2": { "usdPerMinute": 0.016, "consultedOn": "2026-..", "evidence": "data/costs/google.png" } },
 *     "functionUsdPerInvocation": 0.0123, "functionEvidence": "data/costs/vercel.png" }
 */
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { readExchanges } from '../asr/run.ts';
import { type Corpus, unblind, werRows, type Sheet, type SheetKey } from '../corpus.ts';
import { type DeclaredCalendar, kickoffsOfRound } from '../cost.ts';
import { containerTable, gapsTable, hitRateTable, invocationsTable, latencyTable, type MeasuredCosts, overlapTable, parametersTable, priceTable, projectionTable, werTable } from '../report.ts';
import { args, DATA_ROOT, disk, listenReports, need, readJson, readJsonFile, stamp } from './common.ts';

const a = args();
const sessions = need(a, 'sessions').split(',');
const corpusId = a.get('corpus') ?? sessions[0]!;
const archive = disk();

const reports = (await Promise.all(sessions.map((s) => listenReports(archive, s)))).flat();
const exchanges = (await Promise.all(sessions.map((s) => readExchanges(archive, s)))).flat();

const parts: string[] = [`<!-- generado por spikes/radio/src/cli/report.ts el ${new Date().toISOString()} sobre data/sessions/{${sessions.join(',')}} -->`];

parts.push('## CA-1 — Invocaciones', '', `Ficheros: ${sessions.map((s) => `data/sessions/${s}/listen-*.json`, '').join(', ')}; segmentos en \`data/sessions/<id>/segments/\`, índice \`segments.json\`; robots.txt en \`data/sessions/<id>/robots/\`.`, '', invocationsTable(reports), '', '### Huecos', '', gapsTable(reports), '', '### Solape entre invocaciones (por número de secuencia)', '', overlapTable(reports));
for (const r of reports) parts.push('', `- ${r.sessionId}: robots.txt \`${r.robots.key ?? '(no archivado)'}\` → ${r.robots.verdict.status} (${r.robots.verdict.reason}); contenedor **${r.container ?? '?'}**, duración de segmento declarada ${r.targetDurationSeconds ?? '?'} s, ${r.bytesPerAudioMinute ?? '?'} bytes por minuto de audio.`);

parts.push('', '## CA-2 — Motor × contenedor', '', `Ficheros: \`data/sessions/<id>/asr/<motor>/\` (${exchanges.length} respuestas crudas con su .meta.json).`, '', containerTable(exchanges), '', '### Parámetros exactos enviados (CA-2.4)', '', parametersTable(exchanges));

parts.push('', '## CA-3 — Acierto en frases de gol y WER', '');
try {
  const corpus = await readJson<Corpus>(archive, `corpus/${corpusId}.json`);
  parts.push(`Corpus: \`data/corpus/${corpusId}.json\` (${corpus.goalPhrases.length} frases de gol, ${corpus.goalPhrases.filter((p) => p.score === null).length} sin marcador explícito; referencia de ${corpus.reference.endOffsetSeconds - corpus.reference.startOffsetSeconds} s). Criterio escrito antes de juzgar: «${corpus.criteria}».`, '');
  try {
    const sheet = await readJson<Sheet>(archive, `judge/${corpusId}-sheet.json`);
    const key = await readJson<SheetKey>(archive, `judge/${corpusId}-key.json`);
    parts.push(hitRateTable(unblind(corpus, sheet, key)));
  } catch {
    parts.push('_Sin hoja de juicio todavía (`npm run judge -- --session <id> build`)._');
  }
  parts.push('', '### WER global (normalización: minúsculas, sin acentos, sin puntuación; `src/wer.ts`)', '', werTable(await werRows(corpus, exchanges, archive)));
} catch {
  parts.push('_Sin corpus todavía (`data/corpus/<id>.json`)._');
}

parts.push('', '## CA-4 — Latencia por trozo', '', 'Fuente: `sentAt`/`receivedAt` de cada `.meta.json`; percentiles por rango más cercano.', '', latencyTable(exchanges));

parts.push('', '## CA-5 — Coste', '');
const costs: MeasuredCosts = a.has('costs') ? await readJsonFile<MeasuredCosts>(a.get('costs')!) : { engines: {}, functionUsdPerInvocation: null, functionEvidence: null };
parts.push(priceTable(costs), '');
const calendars: DeclaredCalendar[] = [];
const calendarDir = a.get('calendar') ?? join(DATA_ROOT, '..', '..', '..', 'calendario', '2026-27');
try {
  for (const f of (await readdir(calendarDir)).filter((f) => f.endsWith('.json')).sort()) calendars.push(await readJsonFile<DeclaredCalendar>(join(calendarDir, f)));
} catch {
  parts.push(`_No se pudo leer el calendario declarado en \`${calendarDir}\`: la proyección de CA-5.2 queda sin jornada._`, '');
}
const { kickoffsMs, used } = kickoffsOfRound(calendars, 1);
parts.push(projectionTable(kickoffsMs, used, costs));

const key = `report/${stamp()}.md`;
await archive.put(key, new TextEncoder().encode(parts.join('\n')), 'text/markdown');
console.log(`data/${key}`);
