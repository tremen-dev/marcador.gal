/**
 * The engine: RN-01..RN-07 as ONE pure function (SPEC-013, ADR-021 §1 and §2).
 *
 * No `await`, no clock of its own, no database, no network. The clock enters
 * as `now` (ISO 8601 UTC string, ADR-006) and the data enter as values. That
 * is not aesthetics: the reducer is the piece a whole matchday has to be
 * REPLAYABLE on from the archive (RN-10, D-5), and a function that goes to the
 * database halfway does not replay.
 *
 * ITS ONLY STATE ARE THE TWO LOGS. The retention of RN-04, the discrepancy of
 * RN-05 and the silence of RN-07 create no table: everything the engine needs
 * is already written, and written immutably in `observations` (RN-13) and
 * `decisions`. A third log could desynchronise from the two that already hold
 * the answer, and derived state never lies because it is not stored.
 *
 * THE ORDER OF EVALUATION is `reglas.md`'s, with ONE documented exception:
 *
 *   RN-01 (who leads) → RN-05 (is this a conflict?) → RN-06 (may the status
 *   move?) → RN-04 (may the scoreboard move?) → RN-06 again (has the clock run
 *   out?) → RN-02/RN-03 (qualify) → RN-07 (is it silent?)
 *
 * RN-05 is evaluated BEFORE RN-04 although `reglas.md` lists it after, and the
 * reason is written here so nobody has to guess it: when a discrepancy has
 * persisted past the grace, RN-05 says the conflict IS NOT PUBLISHED, full
 * stop — so there is no scoreboard whose monotonicity could still be in
 * question. Reading it the other way round would make `held` name RN-04 in
 * half the conflicts (whenever the more recent of the two disagreeing sources
 * happens to be the lower one) and CA-6.2 would hold only by luck. During the
 * grace there is NO conflict yet, so RN-04 governs whole — which is exactly
 * what CA-6.4 asks: two sources taking turns do not make the scoreboard go
 * backwards.
 *
 * A `Decision` IS EMITTED ONLY WHEN THE PUBLISHED TUPLE CHANGES — `status`,
 * `home_score`, `away_score`, `provisional`, and whether the rule is RN-07 —
 * never one per tick. That is the condition that makes replaying the log
 * produce the same log (CA-14) and that keeps a quiet match from generating
 * 150 rows.
 */
import { epochMsOf } from '@/polite/clock';
import { attribute } from './attribution';
import { PRODUCTION_INDEPENDENCE } from './independence';
import { SOURCE_ROLES, isHuman, isOfficial, roleOf } from './roles';
import { DEFAULT_THRESHOLDS } from './thresholds';
import type { NewAlert } from './alert';
import type { IndependenceRelation } from './independence';
import type { LatestAlerts } from './ports';
import type { Rn01Role } from './roles';
import type { DecideThresholds } from './thresholds';
import type { Decision, DecisionRule } from '@/model/decision';
import type { Instant, ObservationId, SourceId } from '@/model/ids';
import type { Match, MatchStatus } from '@/model/match';
import type { Observation } from '@/model/observation';

/** Roles, independence and thresholds: everything the reducer is configured by. */
export interface DecideConfig {
  readonly roles: Readonly<Record<string, Rn01Role>>;
  readonly independence: IndependenceRelation;
  readonly thresholds: DecideThresholds;
}

/** The configuration of production. Its independence list is empty (CA-3.4). */
export const PRODUCTION_CONFIG: DecideConfig = {
  roles: SOURCE_ROLES,
  independence: PRODUCTION_INDEPENDENCE,
  thresholds: DEFAULT_THRESHOLDS,
};

/**
 * The two triggers, discriminated (ADR-021 §3).
 *
 * `observation` is the reducer of `reglas.md` as written. `time` is what makes
 * `kickoff + 110 min` (RN-06), the fifteen minutes of RN-07 and the
 * persistence of a discrepancy (RN-05) executable: the three fire when NOTHING
 * arrives. Both variants cross the same chain of rules; there are not two
 * engines.
 */
export interface DecideInput {
  readonly kind: 'observation' | 'time';
  /** Only on `observation`. The reducer reads the log through `latestBySource`. */
  readonly incoming?: Observation | undefined;
  /** For the kickoff of RN-06. */
  readonly match: Match;
  /** The live `Decision`, or `null` when nothing has been published yet. */
  readonly previous: Decision | null;
  /** The latest observation of each source of this match. */
  readonly latestBySource: ReadonlyMap<SourceId, Observation>;
  readonly latestAlerts: LatestAlerts;
  readonly now: Instant;
  readonly config: DecideConfig;
}

/** Why nothing was published, when nothing was. */
export interface Held {
  readonly rule: DecisionRule;
  readonly reason: string;
}

export interface DecideResult {
  /** What to append, or `null` when the published tuple did not change. */
  readonly decision: Decision | null;
  readonly alerts: readonly NewAlert[];
  readonly held: Held | null;
}

const NOTHING: DecideResult = { decision: null, alerts: [], held: null };

/** The five fields that make up what the user sees. */
interface Tuple {
  readonly status: MatchStatus;
  readonly home_score: number | null;
  readonly away_score: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reading the two logs
// ─────────────────────────────────────────────────────────────────────────────

function tupleOf(value: Tuple): Tuple {
  return {
    status: value.status,
    home_score: value.home_score,
    away_score: value.away_score,
  };
}

function sameTuple(a: Tuple, b: Tuple): boolean {
  return (
    a.status === b.status && a.home_score === b.home_score && a.away_score === b.away_score
  );
}

/** How a tuple is written into an alert's fingerprint and into a `held` reason. */
function spell(value: Tuple): string {
  return value.home_score === null || value.away_score === null
    ? value.status
    : `${value.status} ${String(value.home_score)}-${String(value.away_score)}`;
}

/**
 * The latest observation of every source, with the incoming one merged in.
 *
 * The applicator builds the map from the log, so the incoming observation is
 * normally already there; merging it makes the reducer answer the same thing
 * whether it is or not, which is what the replay needs (CA-14).
 */
function latestOf(input: DecideInput): readonly Observation[] {
  const latest = new Map<string, Observation>(input.latestBySource);
  const incoming = input.incoming;

  if (incoming !== undefined) {
    const known = latest.get(incoming.source);
    if (known === undefined || epochMsOf(known.observed_at) <= epochMsOf(incoming.observed_at)) {
      latest.set(incoming.source, incoming);
    }
  }

  return [...latest.values()];
}

/**
 * RN-01 — who leads.
 *
 * Weight first, and the weight is the one FROZEN IN THE OBSERVATION
 * (`confidence`), never the table of today (RN-01, aclaración of 2026-09-02):
 * otherwise the same log of observations would produce a different log of
 * decisions depending on when it was replayed, which breaks D-6.
 *
 * Then THE OPERATOR'S PRECEDENCE, which is what settles the 1.0 tie: the
 * operator and the RFGF share the weight and are not interchangeable — «si
 * discrepan, gana el operador». The correspondent has no such precedence: in
 * front of the official source it loses BY WEIGHT, not by role, and this
 * ordering is the reason it does.
 *
 * Then recency, which is what «la observación más reciente de las dos» of
 * CA-6.1 asks for when two sources of the same weight disagree, and finally
 * the source's own name, so the order is total and the replay deterministic.
 */
function rank(
  observations: readonly Observation[],
  config: DecideConfig,
): readonly Observation[] {
  const isOperator = (observation: Observation): boolean =>
    roleOf(observation.source, config.roles) === 'operator';

  return [...observations].sort((a, b) => {
    if (a.confidence !== b.confidence) return b.confidence - a.confidence;
    if (isOperator(a) !== isOperator(b)) return isOperator(a) ? -1 : 1;
    const byTime = epochMsOf(b.observed_at) - epochMsOf(a.observed_at);
    if (byTime !== 0) return byTime;
    return a.source < b.source ? -1 : 1;
  });
}

function latestObservedMs(observations: readonly Observation[]): number {
  let newest = epochMsOf(observations[0]!.observed_at);
  for (const observation of observations) {
    const at = epochMsOf(observation.observed_at);
    if (at > newest) newest = at;
  }
  return newest;
}

// ─────────────────────────────────────────────────────────────────────────────
// The rules
// ─────────────────────────────────────────────────────────────────────────────

/**
 * RN-06 — the transition table, CLOSED FOR AUTOMATIC SOURCES (ADR-021 §8.3).
 *
 * What the rule enumerates is everything an automatic source can provoke; what
 * it does not enumerate — `finished → live`, `live → scheduled`, `postponed →
 * live` — an automatic source does not do: the transition is IGNORED. The
 * `Observation` is stored all the same, because it is a historical fact and is
 * not deleted (RN-13), and if it concurs with another source it falls where it
 * belongs, in RN-05.
 *
 * The official source and the human — operator OR correspondent — can take the
 * match to any of the five states: RN-06 grants them `postponed` and
 * `suspended` in exclusivity and RN-04 grants them lowering a scoreboard, and
 * those are concessions, not a ceiling. Denying them the correction of a wrong
 * state would leave the operator without the function RN-01 attributes to it,
 * arbitrating — and with the official source not capturable (ADR-008 §1) there
 * would be nobody else who could undo it.
 */
function transitionAllowed(
  from: MatchStatus,
  to: MatchStatus,
  lead: Observation,
  agreeingCount: number,
  input: DecideInput,
): boolean {
  if (from === to) return true;

  const role = roleOf(lead.source, input.config.roles);
  if (isOfficial(role) || isHuman(role)) return true;

  const kickoffMs = epochMsOf(input.match.kickoff);

  if (from === 'scheduled' && to === 'live') {
    // «con la primera observación de juego DESPUÉS de kickoff − 2 min».
    return epochMsOf(lead.observed_at) >= kickoffMs - input.config.thresholds.liveLeadMs;
  }

  if (from === 'live' && to === 'finished') {
    // «dos fuentes coincidentes» — and *coincidentes* is what RN-06 says, not
    // *independientes*: two mirrors close the match, and the QUALIFIER of that
    // `Decision` is still decided by RN-02/RN-03, which does ask for declared
    // independence.
    return agreeingCount >= 2;
  }

  return false;
}

/** RN-02 — is what we are about to publish *confirmado*? */
function isConfirmed(
  supporting: readonly Observation[],
  config: DecideConfig,
): boolean {
  const { confirmedWeight, independentWeight } = config.thresholds;

  // Way 1: one observation of weight ≥ 0.9.
  if (supporting.some((observation) => observation.confidence >= confirmedWeight)) return true;

  // Way 2: two DECLARED INDEPENDENT sources of weight ≥ 0.7 that agree. It is
  // written, tested whole with doubles, and inert in production: no pair
  // satisfies it today (ADR-021 §7, ADR-008 §1).
  const weighty = supporting.filter(
    (observation) => observation.confidence >= independentWeight,
  );
  for (const a of weighty) {
    for (const b of weighty) {
      if (config.independence.areIndependent(a.source, b.source)) return true;
    }
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// The reducer
// ─────────────────────────────────────────────────────────────────────────────

export function decide(input: DecideInput): DecideResult {
  const observations = latestOf(input);
  // RN-12 demands support: a `Decision` with no observation behind it does not
  // exist, so a match nobody has observed produces nothing at all (CA-8.5).
  if (observations.length === 0) return NOTHING;

  const { config, previous } = input;
  const thresholds = config.thresholds;
  const nowMs = epochMsOf(input.now);
  const ranked = rank(observations, config);
  const lead = ranked[0]!;
  const leadRole = roleOf(lead.source, config.roles);
  const privileged = isOfficial(leadRole) || isHuman(leadRole);

  // ── RN-05 — is this a conflict? ────────────────────────────────────────────
  const conflict = conflictOf(observations, ranked, nowMs, input);
  if (conflict !== null) return conflict;

  // ── RN-01 — the operator's precedence, which is rung 1 of RN-12 ────────────
  // «Resuelve una discrepancia por precedencia del operador»: the rung asks
  // for a DISCREPANCY. The operator publishing alone explains itself through
  // `supporting_observation_ids`, and recording RN-01 there would make `rule`
  // a synonym of the source column (RN-12, «por qué la decisiva»).
  const operatorPrecedence =
    leadRole === 'operator' &&
    observations.some(
      (observation) =>
        observation.source !== lead.source && !sameTuple(tupleOf(observation), tupleOf(lead)),
    );

  const current: Tuple =
    previous === null
      ? { status: 'scheduled', home_score: null, away_score: null }
      : tupleOf(previous);

  // ── RN-06 — may the status move? ───────────────────────────────────────────
  const agreeingWithLead = observations.filter((observation) =>
    sameTuple(tupleOf(observation), tupleOf(lead)),
  ).length;

  let proposed: Tuple = transitionAllowed(
    current.status,
    lead.status,
    lead,
    agreeingWithLead,
    input,
  )
    ? tupleOf(lead)
    : current;

  // ── RN-04 — monotonicity, and the retention of a jump ──────────────────────
  // WHAT RN-04 HOLDS IS THE SCOREBOARD, NOT THE ENGINE. When it retains, the
  // proposal falls back to what is already published and the chain GOES ON:
  // the match is still live, it can still fall silent (RN-07) and it can still
  // run out of clock (RN-06). Returning here instead would leave a match whose
  // last observation was retained unable to ever go *sen sinal* or to end —
  // measured on the replay of CA-14, where a retained jump swallowed both.
  let monotonicity = false;
  let held: Held | null = null;
  if (
    previous !== null &&
    current.home_score !== null &&
    current.away_score !== null &&
    proposed.home_score !== null &&
    proposed.away_score !== null
  ) {
    const goesDown =
      proposed.home_score < current.home_score || proposed.away_score < current.away_score;

    if (goesDown) {
      // «Un marcador NO BAJA salvo que lo diga la fuente oficial o un humano
      // —operador o corresponsal—».
      if (!privileged) {
        held = {
          rule: 'RN-04',
          reason: `${spell(proposed)} would lower ${spell(current)} from ${lead.source}, which is neither official nor human (RN-04)`,
        };
        proposed = current;
      } else {
        monotonicity = true;
      }
    } else {
      const jump =
        proposed.home_score -
        current.home_score +
        (proposed.away_score - current.away_score);

      // «Un salto de más de 2 goles en una sola observación se retiene hasta
      // segunda fuente». THE RETENTION DOES NOT REACH ≥ 0.9 (ADR-021 §8.1):
      // RN-02 declares that weight enough to publish *confirmado*, and with
      // the official source not capturable a 0-4 from the operator would stay
      // retained for ever, because the second source that would release it
      // does not exist.
      if (jump > thresholds.bigJumpGoals && lead.confidence < thresholds.confirmedWeight) {
        const seconded = observations.some(
          (observation) =>
            observation.source !== lead.source && sameTuple(tupleOf(observation), proposed),
        );
        if (seconded) {
          monotonicity = true;
        } else {
          held = {
            rule: 'RN-04',
            reason: `${spell(proposed)} jumps ${String(jump)} goals over ${spell(current)} on one observation of ${lead.source} (${String(lead.confidence)}): retained until a second source (RN-04)`,
          };
          proposed = current;
        }
      }
    }
  }

  // RN-06, the third way into `finished`: `kickoff + 110 min` with no signal.
  // AFTER RN-04, and that order is load-bearing: a match whose last scoreboard
  // is retained still runs out of clock, and the `Decision` that ends it
  // carries the scoreboard that WAS published, not the retained one. Its
  // support says nothing about `finished`, and that is where its *pendente de
  // confirmar* comes from (ADR-021 §6).
  if (
    proposed.status === 'live' &&
    nowMs >= epochMsOf(input.match.kickoff) + thresholds.finishTimeoutMs
  ) {
    proposed = { ...proposed, status: 'finished' };
  }

  // ── RN-02 / RN-03 — the qualifier of the WHOLE Decision, in all five ───────
  // branches (RN-03, aclaración of 2026-08-31): in the branches with a
  // scoreboard it qualifies the scoreboard, in the two without it qualifies
  // the STATE. There is no third option and no exempt branch.
  const supporting = observations
    .filter((observation) => sameTuple(tupleOf(observation), proposed))
    .sort((a, b) => {
      const byTime = epochMsOf(a.observed_at) - epochMsOf(b.observed_at);
      return byTime !== 0 ? byTime : a.source < b.source ? -1 : 1;
    });
  // Nothing says exactly what we publish — the timeout `finished` of RN-06 is
  // the case — so the lead is what sustains it. RN-12 is never satisfied «for
  // show»: the id points at a real observation of this match.
  const support: readonly Observation[] = supporting.length > 0 ? supporting : [lead];
  const provisional = !isConfirmed(support, config);

  // ── RN-07 — the silence ───────────────────────────────────────────────────
  // ONLY on `live`: a `scheduled` match with no observations for hours is not
  // *sen sinal*, it is a match that has not started. And a `finished` reached
  // by the timeout of RN-06 is not silent either — it is over.
  const silence =
    proposed.status === 'live' &&
    nowMs - latestObservedMs(observations) >= thresholds.silenceMs;

  // ── What is published, and whether it changed ─────────────────────────────
  const wasSilent = previous !== null && previous.rule === 'RN-07';
  const unchanged =
    previous !== null && sameTuple(proposed, current) && provisional === previous.provisional && silence === wasSilent;

  const alerts: NewAlert[] = [];
  if (silence && shouldRaiseSilence(input.latestAlerts, observations)) {
    alerts.push({
      match_id: input.match.id,
      rule: 'RN-07',
      raised_at: input.now,
      reason: `no new observation for ${spellSilence(observations, nowMs)} on a live match (RN-07)`,
      observation_ids: supportIds(observations),
    });
  }

  if (unchanged) return { decision: null, alerts, held };

  const rule = attribute({
    operatorPrecedence,
    monotonicity,
    silence,
    statusChanged: proposed.status !== current.status,
    provisional,
  });

  const decision = {
    match_id: input.match.id,
    status: proposed.status,
    home_score: proposed.home_score,
    away_score: proposed.away_score,
    provisional,
    rule,
    decided_at: input.now,
    supporting_observation_ids: supportIds(support),
    version: previous === null ? 1 : previous.version + 1,
  } as Decision;

  return { decision, alerts, held };
}

/** The ids of a non-empty list of observations, as RN-12's tuple demands. */
function supportIds(observations: readonly Observation[]): [ObservationId, ...ObservationId[]] {
  const [first, ...rest] = observations;
  return [first!.id, ...rest.map((observation) => observation.id)];
}

function spellSilence(observations: readonly Observation[], nowMs: number): string {
  const minutes = (nowMs - latestObservedMs(observations)) / 60_000;
  return `${String(minutes)} min`;
}

/**
 * RN-07's alert is raised ONCE PER EPISODE (CA-8.2). A new episode is one that
 * began after the last alert: if an observation arrived since, the match came
 * back and went silent again.
 */
function shouldRaiseSilence(
  latestAlerts: LatestAlerts,
  observations: readonly Observation[],
): boolean {
  const previous = latestAlerts.silence;
  if (previous === null) return true;
  return epochMsOf(previous.raised_at) < latestObservedMs(observations);
}

/**
 * RN-05 — the conflict, and the reading of ADR-021 §8.2.
 *
 * «Si dos fuentes con peso ≥ 0.7 discrepan y ninguna es oficial: se mantiene la
 * última confirmada y se genera alerta al panel. El conflicto no se publica.»
 * Two readings, both signed on 2026-09-02:
 *
 *   - «la última confirmada» reads «LA VIGENTE». Today there is no `Decision`
 *     *confirmada* by an automatic source, so the literal reading would force
 *     UNPUBLISHING the match at the first disagreement — and that contradicts
 *     RN-03, «mejor provisional a tiempo que confirmado tarde».
 *   - A discrepancy IS A CONFLICT ONLY WHEN IT PERSISTS `CONFLICT_GRACE` after
 *     the more recent of the two observations that disagree. Two sources going
 *     at different speeds disagree for a few seconds on every goal, and that
 *     is latency, not disagreement.
 *
 * AND THE GRACE GOVERNS ONLY THE ALERT (gate of 2026-09-02, F-SPEC-013-1).
 * Before the deadline this returns `null` and the ordinary chain publishes the
 * most recent observation marked *provisional*; the deadline decides whether
 * an alert is opened, not what is published.
 *
 * A discrepancy the OPERATOR takes part in is not a conflict either: it is
 * settled by precedence (RN-01) and published (RN-05, salvedad).
 */
function conflictOf(
  observations: readonly Observation[],
  ranked: readonly Observation[],
  nowMs: number,
  input: DecideInput,
): DecideResult | null {
  const { config } = input;
  const weighty = observations.filter(
    (observation) => observation.confidence >= config.thresholds.independentWeight,
  );
  if (weighty.length < 2) return null;

  const first = tupleOf(weighty[0]!);
  if (weighty.every((observation) => sameTuple(tupleOf(observation), first))) return null;

  // An official source or the operator among them makes it not a conflict:
  // one of the two arbitrates, and what it says is published.
  const arbitrated = weighty.some((observation) => {
    const role = roleOf(observation.source, config.roles);
    return isOfficial(role) || role === 'operator';
  });
  if (arbitrated) return null;

  if (nowMs - latestObservedMs(weighty) < config.thresholds.conflictGraceMs) return null;

  // The fingerprint of THIS discrepancy: while it says the same thing there is
  // no new row; other values produce a second one (CA-6.6).
  const fingerprint = [...weighty]
    .sort((a, b) => (a.source < b.source ? -1 : 1))
    .map((observation) => `${observation.source}=${spell(tupleOf(observation))}`)
    .join(' vs ');

  const previous = input.latestAlerts.conflict;
  const alerts: NewAlert[] =
    previous !== null && previous.reason === fingerprint
      ? []
      : [
          {
            match_id: input.match.id,
            rule: 'RN-05',
            raised_at: input.now,
            reason: fingerprint,
            observation_ids: supportIds(
              ranked.filter((observation) =>
                weighty.some((candidate) => candidate.id === observation.id),
              ),
            ),
          },
        ];

  return {
    decision: null,
    alerts,
    held: {
      rule: 'RN-05',
      reason: `conflict stood past the grace: ${fingerprint} (RN-05)`,
    },
  };
}
