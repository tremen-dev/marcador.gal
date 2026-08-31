/**
 * The pairwise comparison of two sources (CA-8, CA-9, CA-10, CA-15).
 *
 * Written symmetrically — `a` and `b`, never "the source" and "the candidate" —
 * for one reason: CA-15 crosses the two candidates with each other, where
 * neither is the reference. Against futgal, `a` is futgal and a `lead_b` reads
 * "S adelanta a F"; between candidates, both directions are read.
 *
 * Nothing here consults a clock or the network. Everything is derived from the
 * timeline, which is derived from the archive (CA-7).
 */
import { MIN_PERSISTENT_CAPTURES, TAU_MS } from '@/mirror/thresholds';
import { instantToEpochMs } from '@/mirror/instants';
import { capturesOf, seriesOf, valueKey } from './timeline';
import type { Capture, MatchValue, Reading, Timeline } from './timeline';
import type { Instant, MatchId, SourceId } from '@/model/ids';

export { TAU_MS } from '@/mirror/thresholds';

/**
 * The six outcomes of comparing two `first_seen`.
 *
 * `only_a` / `only_b` are NOT leads: an event one source never reported is
 * exclusive content, and treating it as an infinite lead would let a match
 * missing from one page prove the independence of the other.
 */
export type LeadClassification = 'lead_a' | 'lead_b' | 'tie' | 'only_a' | 'only_b' | 'neither';

export interface LeadResult {
  readonly classification: LeadClassification;
  /** `first_seen(a) − first_seen(b)`; positive means b was earlier. */
  readonly difference_ms: number | null;
}

/**
 * CA-8. `>` and not `>=`: at exactly τ the difference is still inside what the
 * instrument cannot resolve, so it is an empate.
 */
export function classifyLead(
  firstSeenA: string | null,
  firstSeenB: string | null,
  tauMs: number = TAU_MS,
): LeadResult {
  if (firstSeenA === null && firstSeenB === null) {
    return { classification: 'neither', difference_ms: null };
  }
  if (firstSeenB === null) return { classification: 'only_a', difference_ms: null };
  if (firstSeenA === null) return { classification: 'only_b', difference_ms: null };

  const difference_ms = instantToEpochMs(firstSeenA) - instantToEpochMs(firstSeenB);

  if (difference_ms > tauMs) return { classification: 'lead_b', difference_ms };
  if (-difference_ms > tauMs) return { classification: 'lead_a', difference_ms };
  return { classification: 'tie', difference_ms };
}

/** When a source first reported a value, and in which capture. */
interface FirstSeen {
  readonly at: Instant;
  readonly raw_key: string;
  /** False when this was the first value the source ever showed for the match. */
  readonly transition: boolean;
}

export interface EventComparison {
  readonly match_id: MatchId;
  readonly value: MatchValue;
  readonly value_key: string;
  readonly first_seen_a: Instant | null;
  readonly first_seen_b: Instant | null;
  readonly raw_key_a: string | null;
  readonly raw_key_b: string | null;
  readonly classification: LeadClassification;
  readonly difference_ms: number | null;
}

/** A value one source abandoned and the other abandoned in the same way. */
export interface ReplicatedError {
  readonly match_id: MatchId;
  readonly wrong: MatchValue;
  readonly corrected: MatchValue;
  /** The four captures that sustain the claim (CA-14). */
  readonly raw_keys: readonly [string, string, string, string];
}

/**
 * The three facts whose persistent disagreement DICTATES independence.
 *
 * Three and not four: the spelling of the team came out of here by the
 * amendment of 2026-08-31 §1 and lives in `SpellingDivergence`. It is not a
 * fact that stopped being computed — it is a fact that stopped voting, and
 * keeping it out of this union is what makes "it is not summed into the
 * persistent discrepancies in any key" true by construction rather than by
 * everyone remembering to filter (CA-10.4, CA-13).
 */
export type DiscrepancyFact = 'existence' | 'kickoff' | 'finished_result';

export interface PersistentDiscrepancy {
  readonly match_id: MatchId;
  readonly fact: DiscrepancyFact;
  readonly value_a: string;
  readonly value_b: string;
  readonly captures_a: number;
  readonly captures_b: number;
  readonly raw_keys: readonly string[];
}

/**
 * CA-10.4. The two sources write the name of a team differently (after the
 * stingy normalisation of `normalizeAlias`).
 *
 * Its own type, and not a `PersistentDiscrepancy` with a flag, because the
 * whole point of the amendment is that it does NOT enter a verdict, in either
 * direction: all the probative force of CA-10.2 is that **a mirror
 * converges**, and the name is precisely the field where a mirror does not
 * converge by construction — an aggregator copies the scoreboard and renders
 * the name from its own team base. The signal fires with the same probability
 * under both hypotheses, so it carries no information.
 *
 * It is still computed and still cited (CA-14): it is the audit surface of the
 * manual pairing of CA-6 — whoever wrote it can check against the archive what
 * each source called each team — and the first real input of the alias
 * catalogue of RN-09.
 */
export interface SpellingDivergence {
  readonly match_id: MatchId;
  readonly spelling_a: string;
  readonly spelling_b: string;
  readonly captures_a: number;
  readonly captures_b: number;
  readonly raw_keys: readonly string[];
}

export interface PairAnalysis {
  readonly a: SourceId;
  readonly b: SourceId;
  readonly events: readonly EventComparison[];
  /** Events both sources reported. The N of CA-11. */
  readonly n_comparable: number;
  readonly leads_a: number;
  readonly leads_b: number;
  readonly lead_matches_a: number;
  readonly lead_matches_b: number;
  readonly ties: number;
  readonly exclusives_a: number;
  readonly exclusives_b: number;
  readonly replicated_errors: readonly ReplicatedError[];
  readonly persistent_discrepancies: readonly PersistentDiscrepancy[];
  /** CA-10.4. Registered, cited, counted apart — and never a vote. */
  readonly spelling_divergences: readonly SpellingDivergence[];
  /** `first_seen(a) − first_seen(b)` for every comparable event, sorted. */
  readonly observed_differences_ms: readonly number[];
  /**
   * `completa` once the window contains at least one value CHANGE both sources
   * saw. Without one there is no timing to measure, and "0 adelantos" is not a
   * fact about the sources — it is a fact about the window (spec §Diseño 4).
   */
  readonly temporal_half: 'completa' | 'pendiente';
}

export function comparePair(timeline: Timeline, a: SourceId, b: SourceId): PairAnalysis {
  const events: EventComparison[] = [];
  const differences: number[] = [];
  const leadMatchesA = new Set<MatchId>();
  const leadMatchesB = new Set<MatchId>();
  let leadsA = 0;
  let leadsB = 0;
  let ties = 0;
  let exclusivesA = 0;
  let exclusivesB = 0;
  let comparable = 0;
  let temporalComplete = false;

  for (const match_id of timeline.match_ids) {
    const firstSeenA = firstSeenOf(timeline, a, match_id);
    const firstSeenB = firstSeenOf(timeline, b, match_id);
    const values = new Map<string, MatchValue>();
    for (const [key, value] of valuesOf(timeline, a, match_id)) values.set(key, value);
    for (const [key, value] of valuesOf(timeline, b, match_id)) values.set(key, value);

    for (const key of [...values.keys()].sort()) {
      const seenA = firstSeenA.get(key) ?? null;
      const seenB = firstSeenB.get(key) ?? null;
      const lead = classifyLead(seenA?.at ?? null, seenB?.at ?? null);

      events.push({
        match_id,
        value: values.get(key)!,
        value_key: key,
        first_seen_a: seenA?.at ?? null,
        first_seen_b: seenB?.at ?? null,
        raw_key_a: seenA?.raw_key ?? null,
        raw_key_b: seenB?.raw_key ?? null,
        classification: lead.classification,
        difference_ms: lead.difference_ms,
      });

      switch (lead.classification) {
        case 'lead_a':
          leadsA += 1;
          leadMatchesA.add(match_id);
          break;
        case 'lead_b':
          leadsB += 1;
          leadMatchesB.add(match_id);
          break;
        case 'tie':
          ties += 1;
          break;
        case 'only_a':
          exclusivesA += 1;
          break;
        case 'only_b':
          exclusivesB += 1;
          break;
        default:
          break;
      }

      if (seenA !== null && seenB !== null) {
        comparable += 1;
        differences.push(lead.difference_ms!);
        if (seenA.transition && seenB.transition) temporalComplete = true;
      }
    }
  }

  const divergences = contentDivergences(timeline, a, b);

  return {
    a,
    b,
    events,
    n_comparable: comparable,
    leads_a: leadsA,
    leads_b: leadsB,
    lead_matches_a: leadMatchesA.size,
    lead_matches_b: leadMatchesB.size,
    ties,
    exclusives_a: exclusivesA,
    exclusives_b: exclusivesB,
    replicated_errors: replicatedErrors(timeline, a, b),
    persistent_discrepancies: divergences.persistent,
    spelling_divergences: divergences.spelling,
    observed_differences_ms: [...differences].sort((x, y) => x - y),
    temporal_half: temporalComplete ? 'completa' : 'pendiente',
  };
}

function valuesOf(
  timeline: Timeline,
  source: SourceId,
  match_id: MatchId,
): ReadonlyMap<string, MatchValue> {
  const values = new Map<string, MatchValue>();
  for (const reading of seriesOf(timeline, source, match_id)) {
    values.set(valueKey(reading.value), reading.value);
  }
  return values;
}

function firstSeenOf(
  timeline: Timeline,
  source: SourceId,
  match_id: MatchId,
): ReadonlyMap<string, FirstSeen> {
  const seen = new Map<string, FirstSeen>();
  let initial: string | null = null;

  for (const reading of seriesOf(timeline, source, match_id)) {
    const key = valueKey(reading.value);
    initial ??= key;
    if (seen.has(key)) continue;
    seen.set(key, { at: reading.fetched_at, raw_key: reading.raw_key, transition: key !== initial });
  }

  return seen;
}

/** A run of consecutive captures showing the same value. */
interface Run {
  readonly value: MatchValue;
  readonly first_key: string;
}

function runsOf(timeline: Timeline, source: SourceId, match_id: MatchId): readonly Run[] {
  const runs: Run[] = [];
  let previous: string | null = null;

  for (const reading of seriesOf(timeline, source, match_id)) {
    const key = valueKey(reading.value);
    if (key === previous) continue;
    runs.push({ value: reading.value, first_key: reading.raw_key });
    previous = key;
  }

  return runs;
}

const STATUS_ORDER: Readonly<Record<string, number>> = {
  scheduled: 0,
  live: 1,
  finished: 2,
};

/**
 * Whether replacing `from` with `to` is a CORRECTION rather than progress.
 *
 * The spec defines a replicated error as "F reports v and then replaces it
 * with v'". Read literally that would include every goal, and every goal is
 * reported by every source, so every pair would come out ESPEJO. What the
 * design section actually names is "un error **transitorio** … el mismo
 * marcador equivocado y la misma corrección", and what tells a correction from
 * progress is that it goes BACKWARDS: a score that drops (RN-04 forbids that
 * without an official source or a human, so a source doing it is retracting),
 * or a state that regresses. See F-SPEC-002-4.
 */
export function isRetraction(from: MatchValue, to: MatchValue): boolean {
  if (from.home_score !== null && to.home_score !== null && to.home_score < from.home_score) {
    return true;
  }
  if (from.away_score !== null && to.away_score !== null && to.away_score < from.away_score) {
    return true;
  }
  if (from.status === to.status) return false;
  if (from.status === 'finished') return true;
  if (from.status === 'postponed') return true;

  const before = STATUS_ORDER[from.status];
  const after = STATUS_ORDER[to.status];
  if (before === undefined || after === undefined) return false;
  return after < before;
}

/**
 * CA-10.1. Two independent sources can agree on every right answer — the real
 * scoreboard is one — but not on the wrong ones. The same wrong value followed
 * by the same correction is the fingerprint of a common origin, and unlike the
 * temporal signal it does not depend on the resolution of the instrument.
 */
function replicatedErrors(timeline: Timeline, a: SourceId, b: SourceId): readonly ReplicatedError[] {
  const found: ReplicatedError[] = [];

  for (const match_id of timeline.match_ids) {
    const retractionsA = retractionsOf(timeline, a, match_id);
    const retractionsB = retractionsOf(timeline, b, match_id);

    for (const [signature, inA] of retractionsA) {
      const inB = retractionsB.get(signature);
      if (inB === undefined) continue;
      found.push({
        match_id,
        wrong: inA.from.value,
        corrected: inA.to.value,
        raw_keys: [inA.from.first_key, inA.to.first_key, inB.from.first_key, inB.to.first_key],
      });
    }
  }

  return found;
}

function retractionsOf(
  timeline: Timeline,
  source: SourceId,
  match_id: MatchId,
): ReadonlyMap<string, { from: Run; to: Run }> {
  const retractions = new Map<string, { from: Run; to: Run }>();
  const runs = runsOf(timeline, source, match_id);

  for (let index = 1; index < runs.length; index += 1) {
    const from = runs[index - 1]!;
    const to = runs[index]!;
    if (!isRetraction(from.value, to.value)) continue;
    retractions.set(`${valueKey(from.value)}→${valueKey(to.value)}`, { from, to });
  }

  return retractions;
}

/**
 * The facts this pass follows: the three that decide, plus the spelling, which
 * is measured the same way and reported apart (CA-10.4).
 */
type TrackedFact = DiscrepancyFact | 'team_spelling';

/** The value of one fact for one source at one moment, or `null` if unknown. */
function factValue(fact: TrackedFact, reading: Reading | null): string | null {
  if (fact === 'existence') return reading === null ? 'absent' : 'present';
  if (reading === null) return null;
  if (fact === 'kickoff') return reading.kickoff ?? 'sen hora';
  if (fact === 'team_spelling') return `${reading.home_name} | ${reading.away_name}`;
  if (reading.value.status !== 'finished') return null;
  return `${reading.value.home_score}-${reading.value.away_score}`;
}

const FACTS: readonly TrackedFact[] = ['existence', 'kickoff', 'finished_result', 'team_spelling'];

export interface ContentDivergences {
  /** The three facts that dictate INDEPENDIENTE (CA-10.2). */
  readonly persistent: readonly PersistentDiscrepancy[];
  /** The fourth, which does not (CA-10.4). Never mixed into the above. */
  readonly spelling: readonly SpellingDivergence[];
}

/**
 * CA-10.2 and CA-10.4, in one pass over the window.
 *
 * A mirror with refresh lag disagrees with its origin transiently all the
 * time; what tells own data apart is that the difference does NOT converge. So
 * the run has to survive `MIN_PERSISTENT_CAPTURES` captures OF EACH source —
 * counted per source, because three captures of one and none of the other is
 * not persistence, it is a gap.
 *
 * The spelling is measured with the same yardstick and returned in its own
 * list. Same evidence, same citations, no vote.
 */
function contentDivergences(timeline: Timeline, a: SourceId, b: SourceId): ContentDivergences {
  const found: PersistentDiscrepancy[] = [];
  const spelling: SpellingDivergence[] = [];
  const captures = [...capturesOf(timeline, a), ...capturesOf(timeline, b)].sort((x, y) =>
    x.fetched_at === y.fetched_at
      ? x.raw_key.localeCompare(y.raw_key)
      : x.fetched_at.localeCompare(y.fetched_at),
  );

  const byCapture = new Map<string, Reading>();
  for (const reading of timeline.readings) {
    byCapture.set(`${reading.raw_key}\u0000${reading.match_id}`, reading);
  }

  const current = new Map<string, Reading | null>();
  const started = new Set<SourceId>();
  const runs = new Map<string, { a: number; b: number; keys: string[] }>();
  const recorded = new Set<string>();

  // Grouped into ROUNDS by instant. "Three consecutive captures of both" is a
  // count of rounds each source took part in, not of raw captures: with the
  // two sources sampling at the same instants, counting captures one by one
  // would need six of them to reach three each.
  for (const round of roundsOf(captures)) {
    for (const capture of round) {
      started.add(capture.source);
      for (const match_id of timeline.match_ids) {
        current.set(
          `${capture.source}\u0000${match_id}`,
          byCapture.get(`${capture.raw_key}\u0000${match_id}`) ?? null,
        );
      }
    }

    if (!started.has(a) || !started.has(b)) continue;

    const contributedA = round.filter((capture) => capture.source === a).length;
    const contributedB = round.filter((capture) => capture.source === b).length;
    const roundKeys = round.map((capture) => capture.raw_key);

    for (const match_id of timeline.match_ids) {
      const readingA = current.get(`${a}\u0000${match_id}`) ?? null;
      const readingB = current.get(`${b}\u0000${match_id}`) ?? null;

      for (const fact of FACTS) {
        const runKey = `${match_id}\u0000${fact}`;
        const valueA = factValue(fact, readingA);
        const valueB = factValue(fact, readingB);

        if (valueA === null || valueB === null || valueA === valueB) {
          runs.set(runKey, { a: 0, b: 0, keys: [] });
          continue;
        }

        const run = runs.get(runKey) ?? { a: 0, b: 0, keys: [] };
        run.a += contributedA;
        run.b += contributedB;
        run.keys.push(...roundKeys);
        runs.set(runKey, run);

        if (
          run.a >= MIN_PERSISTENT_CAPTURES &&
          run.b >= MIN_PERSISTENT_CAPTURES &&
          !recorded.has(runKey)
        ) {
          recorded.add(runKey);
          if (fact === 'team_spelling') {
            spelling.push({
              match_id,
              spelling_a: valueA,
              spelling_b: valueB,
              captures_a: run.a,
              captures_b: run.b,
              raw_keys: [...run.keys],
            });
          } else {
            found.push({
              match_id,
              fact,
              value_a: valueA,
              value_b: valueB,
              captures_a: run.a,
              captures_b: run.b,
              raw_keys: [...run.keys],
            });
          }
        }
      }
    }
  }

  return { persistent: found, spelling };
}

/** Captures grouped by instant, in chronological order. */
function roundsOf(captures: readonly Capture[]): readonly (readonly Capture[])[] {
  const byInstant = new Map<string, Capture[]>();
  for (const capture of captures) {
    const round = byInstant.get(capture.fetched_at) ?? [];
    round.push(capture);
    byInstant.set(capture.fetched_at, round);
  }
  return [...byInstant.entries()].sort(([x], [y]) => x.localeCompare(y)).map(([, round]) => round);
}
