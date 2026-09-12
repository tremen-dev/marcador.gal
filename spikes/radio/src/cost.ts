/**
 * Cost (SPEC-019 CA-5): the list prices the épica cited on 2026-09-12, the
 * measured price per minute the operator reads from each billing panel after
 * the session, and the projection per matchday: minutes of listening = the
 * UNION of the match windows `[kickoff − 10 min, kickoff + 150 min)` (ADR-019
 * §2) of ONE MATCHDAY WRITTEN BY HAND —the matches of Preferente Futgal G1
 * and Terceira RFEF G1 of the capture afternoon, typed by a person from the
 * RFGF's public web into `data/matchday.json`— plus 10 % of overlap (ADR-029
 * §3); then per matchday, per the two matchdays of the épica, and per season
 * (34 matchdays), per engine. THE FIGURE IS AN ESTIMATE and the table says
 * so, and says where the list came from (URL and date of consultation).
 *
 * No declared calendar is read: `calendario/2026-27/` does not exist
 * (F-SPEC-010-1) and this spike does not create it. CA-5.2 was amended on
 * 2026-09-13 (F-SPEC-019-3) to say exactly this.
 *
 * The window numbers are COPIED from `src/ingest/windows.ts` (PRE 10 min,
 * POST 150 min) on 2026-09-12, for the same reason the User-Agent is: the
 * spike cannot import `src/`.
 */

export const PRE_KICKOFF_MIN = 10;
export const POST_KICKOFF_MIN = 150;
export const OVERLAP_FRACTION = 0.1;
export const MATCHDAYS_IN_EPIC = 2;
export const MATCHDAYS_IN_SEASON = 34;
/** ADR-029 §3: a 10-minute cron → six invocations per hour of window. */
export const INVOCATIONS_PER_HOUR = 6;

/** List prices in USD per minute of audio, as the épica cited them on 2026-09-12 (CA-5.1). */
export const LIST_PRICES_USD_PER_MIN = {
  'google:chirp_2': { price: 0.016, note: '60 min gratis al mes y 300 $ de crédito inicial', consultedOn: '2026-09-12' },
  'openai:gpt-4o-transcribe': { price: 0.006, note: '', consultedOn: '2026-09-12' },
  'openai:whisper-1': { price: 0.006, note: '', consultedOn: '2026-09-12' },
  'openai:gpt-4o-mini-transcribe': { price: 0.003, note: '', consultedOn: '2026-09-12' },
  'deepgram:nova-3': { price: 0.0077, note: 'sin galego probable; no probado', consultedOn: '2026-09-12' },
  'assemblyai:universal-streaming': { price: 0.0025, note: 'galego por verificar; no probado', consultedOn: '2026-09-12' },
} as const;

export interface Interval {
  readonly startMs: number;
  readonly endMs: number;
}

/** Total length, in minutes, of the union of intervals. */
export function unionMinutes(intervals: readonly Interval[]): number {
  const sorted = [...intervals].sort((a, b) => a.startMs - b.startMs);
  let total = 0;
  let current: Interval | null = null;
  for (const i of sorted) {
    if (current === null || i.startMs > current.endMs) {
      if (current !== null) total += current.endMs - current.startMs;
      current = { ...i };
    } else if (i.endMs > current.endMs) {
      current = { startMs: current.startMs, endMs: i.endMs };
    }
  }
  if (current !== null) total += current.endMs - current.startMs;
  return total / 60_000;
}

export function matchWindow(kickoffMs: number): Interval {
  return { startMs: kickoffMs - PRE_KICKOFF_MIN * 60_000, endMs: kickoffMs + POST_KICKOFF_MIN * 60_000 };
}

/** Minutes a matchday is listened to: union of its windows, plus the overlap. */
export function listeningMinutes(kickoffsMs: readonly number[]): { readonly windowMinutes: number; readonly withOverlapMinutes: number } {
  const windowMinutes = unionMinutes(kickoffsMs.map(matchWindow));
  return { windowMinutes, withOverlapMinutes: windowMinutes * (1 + OVERLAP_FRACTION) };
}

export interface CostProjection {
  readonly engine: string;
  readonly usdPerMinute: number;
  readonly source: 'measured' | 'list';
  readonly perMatchdayUsd: number;
  readonly perEpicUsd: number;
  readonly perSeasonUsd: number;
}

export function projectCost(engine: string, usdPerMinute: number, source: CostProjection['source'], minutesPerMatchday: number): CostProjection {
  const perMatchdayUsd = usdPerMinute * minutesPerMatchday;
  return {
    engine,
    usdPerMinute,
    source,
    perMatchdayUsd,
    perEpicUsd: perMatchdayUsd * MATCHDAYS_IN_EPIC,
    perSeasonUsd: perMatchdayUsd * MATCHDAYS_IN_SEASON,
  };
}

/** CA-5.3: the function's cost per 11-minute invocation, projected. */
export function projectFunctionCost(usdPerInvocation: number, windowMinutesPerMatchday: number): { readonly invocationsPerMatchday: number; readonly perMatchdayUsd: number; readonly perSeasonUsd: number } {
  const invocationsPerMatchday = Math.ceil((windowMinutesPerMatchday / 60) * INVOCATIONS_PER_HOUR);
  const perMatchdayUsd = invocationsPerMatchday * usdPerInvocation;
  return { invocationsPerMatchday, perMatchdayUsd, perSeasonUsd: perMatchdayUsd * MATCHDAYS_IN_SEASON };
}

// ── The hand-written matchday (CA-5.2, amended 2026-09-13) ──

/**
 * One matchday typed by a person from the RFGF's public web. Lives in
 * `data/matchday.json` (gitignored) and is copied whole into the report.
 * `source` is mandatory: the table has to say where the list came from.
 */
export interface HandWrittenMatchday {
  readonly source: { readonly url: string; readonly consultedOn: string };
  readonly timezone: string;
  readonly competitions: readonly {
    readonly id: string;
    /** As the RFGF names it, e.g. `xornada 3`. */
    readonly matchday: string;
    readonly matches: readonly { readonly home: string; readonly away: string; readonly kickoff: string }[];
  }[];
}

/**
 * `YYYY-MM-DD HH:MM` in `timeZone` → epoch ms. Done with `Intl`, by asking
 * what UTC instant the zone shows as that wall time (two passes cover the DST
 * offset change).
 */
export function wallTimeToEpochMs(wall: string, timeZone: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(wall);
  if (m === null) throw new Error(`not a wall time: ${wall}`);
  const [y, mo, d, h, mi] = m.slice(1).map(Number) as [number, number, number, number, number];
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  const offsetAt = (ms: number): number => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(ms));
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const shown = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
    return shown - ms;
  };
  let guess = asUtc - offsetAt(asUtc);
  guess = asUtc - offsetAt(guess);
  return guess;
}

/** Kickoffs (epoch ms) of the hand-written matchday, and what it names. Refuses a list without its source. */
export function kickoffsOfMatchday(matchday: HandWrittenMatchday): { readonly kickoffsMs: number[]; readonly used: string[] } {
  if (!matchday.source?.url || !matchday.source.consultedOn) throw new Error('the hand-written matchday must say its source: url and consultedOn');
  const kickoffsMs: number[] = [];
  const used: string[] = [];
  for (const c of matchday.competitions) {
    used.push(`${c.id} ${c.matchday} (${c.matches.length} partidos)`);
    for (const match of c.matches) kickoffsMs.push(wallTimeToEpochMs(match.kickoff, matchday.timezone));
  }
  if (kickoffsMs.length === 0) throw new Error('the hand-written matchday has no matches');
  return { kickoffsMs, used };
}
