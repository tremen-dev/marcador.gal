/**
 * Los dobles del motor: observaciones sintéticas, escenas y relojes falsos.
 *
 * Todo es SINTÉTICO: no hay HTML de terceros, ni fuente real, ni jornada
 * declarada (ADR-009). Las cinco filas de «No» de SPEC-013 §6 —las que hoy no
 * se pueden ejercer con fuentes reales— se prueban desde aquí, y su INERCIA en
 * producción se prueba contra la configuración real (CA-3.4).
 */
import { declareIndependence } from '@/decide/independence';
import { PRODUCTION_CONFIG, decide } from '@/decide/rules';
import { CEROACERO, CORRESPONDENT, OFFICIAL, OPERATOR } from '@/decide/roles';
import { DEFAULT_THRESHOLDS } from '@/decide/thresholds';
import { RN01_WEIGHTS } from '@/ingest/sources';
import { MatchIdSchema, ObservationIdSchema, SourceIdSchema } from '@/model/ids';
import type { IndependentPair } from '@/decide/independence';
import type { LatestAlerts } from '@/decide/ports';
import type { Rn01Role } from '@/decide/roles';
import type { DecideConfig, DecideInput, DecideResult } from '@/decide/rules';
import type { DecideThresholds } from '@/decide/thresholds';
import type { Decision, DecisionRule } from '@/model/decision';
import type { Instant, MatchId, ObservationId, SourceId } from '@/model/ids';
import type { Match, MatchStatus } from '@/model/match';
import type { Observation } from '@/model/observation';
import type { RawRef } from '@/raw/key';

export const MINUTE = 60_000;

export const MATCH_ID: MatchId = MatchIdSchema.parse('futgal-preferente-g1-2026-27-j1-a-b');
export const KICKOFF = '2026-09-06T17:00:00.000Z';

/** `raw_ref` con la forma exacta que produce `rawKey` (SPEC-001 CA-10). */
const RAW_REF =
  'ceroacero/futgal-preferente-g1/2026-09-06/2026-09-06t17-00-00.000z-a1b2c3d4e5f6.html' as RawRef;

export const BESOCCER: SourceId = SourceIdSchema.parse('besoccer');
export { CEROACERO, CORRESPONDENT, OFFICIAL, OPERATOR };

/** Dos fuentes que NO existen en producción, para la vía 2 de RN-02 (CA-3). */
export const SYNTHETIC_A: SourceId = SourceIdSchema.parse('fonte-sintetica-a');
export const SYNTHETIC_B: SourceId = SourceIdSchema.parse('fonte-sintetica-b');

export const SYNTHETIC_ROLES: Readonly<Record<string, Rn01Role>> = {
  [OPERATOR]: 'operator',
  [OFFICIAL]: 'official',
  [CORRESPONDENT]: 'correspondent',
  [CEROACERO]: 'aggregator',
  [BESOCCER]: 'aggregator',
  [SYNTHETIC_A]: 'aggregator',
  [SYNTHETIC_B]: 'aggregator',
};

/** El peso de RN-01 que le toca a cada fuente por su rol. Nunca un número suelto. */
const WEIGHT_OF: Readonly<Record<string, number>> = {
  [OPERATOR]: RN01_WEIGHTS.operator,
  [OFFICIAL]: RN01_WEIGHTS.official,
  [CORRESPONDENT]: RN01_WEIGHTS.correspondent,
  [CEROACERO]: RN01_WEIGHTS.aggregator,
  [BESOCCER]: RN01_WEIGHTS.aggregator,
  [SYNTHETIC_A]: RN01_WEIGHTS.aggregator,
  [SYNTHETIC_B]: RN01_WEIGHTS.aggregator,
};

export const MATCH: Match = {
  id: MATCH_ID,
  competition_id: 'futgal-preferente-g1' as Match['competition_id'],
  round: 1,
  kickoff: KICKOFF,
  home_id: 'sd-inventada' as Match['home_id'],
  away_id: 'cf-suposto' as Match['away_id'],
  venue: 'Campo Sintético',
};

/** `KICKOFF + ms`, como cadena `Z`. El único sitio del test que suma tiempo. */
export function at(ms: number): Instant {
  return new Date(Date.parse(KICKOFF) + ms).toISOString();
}

export function plus(instant: string, ms: number): Instant {
  return new Date(Date.parse(instant) + ms).toISOString();
}

export interface ObservationSpec {
  readonly source: SourceId;
  /** Instante de la observación. Por defecto, el kickoff. */
  readonly at?: Instant | undefined;
  readonly status: MatchStatus;
  readonly home?: number | undefined;
  readonly away?: number | undefined;
  /** Sobrescribe el peso de RN-01: RN-13 congela lo observado (CA-1.2). */
  readonly confidence?: number | undefined;
  readonly id?: string | undefined;
}

export function observation(spec: ObservationSpec): Observation {
  const scored =
    spec.status === 'live' || spec.status === 'finished' || spec.status === 'suspended';
  const observedAt = spec.at ?? KICKOFF;

  return {
    id: ObservationIdSchema.parse(spec.id ?? `${spec.source}@${observedAt}`),
    match_id: MATCH_ID,
    source: spec.source,
    observed_at: observedAt,
    status: spec.status,
    home_score: scored ? (spec.home ?? 0) : null,
    away_score: scored ? (spec.away ?? 0) : null,
    confidence: spec.confidence ?? WEIGHT_OF[spec.source] ?? RN01_WEIGHTS.aggregator,
    raw_ref: RAW_REF,
  } as Observation;
}

export interface DecisionSpec {
  readonly status: MatchStatus;
  readonly home?: number | undefined;
  readonly away?: number | undefined;
  readonly provisional?: boolean | undefined;
  readonly rule?: DecisionRule | undefined;
  readonly version?: number | undefined;
  readonly at?: Instant | undefined;
  readonly support?: readonly ObservationId[] | undefined;
}

export function decision(spec: DecisionSpec): Decision {
  const scored =
    spec.status === 'live' || spec.status === 'finished' || spec.status === 'suspended';

  return {
    match_id: MATCH_ID,
    status: spec.status,
    home_score: scored ? (spec.home ?? 0) : null,
    away_score: scored ? (spec.away ?? 0) : null,
    provisional: spec.provisional ?? true,
    rule: spec.rule ?? 'RN-03',
    decided_at: spec.at ?? KICKOFF,
    supporting_observation_ids: spec.support ?? [ObservationIdSchema.parse('obs-seed')],
    version: spec.version ?? 1,
  } as Decision;
}

export const NO_ALERTS: LatestAlerts = { conflict: null, silence: null };

export interface Scene {
  readonly observations: readonly Observation[];
  readonly previous?: Decision | null | undefined;
  readonly now: Instant;
  readonly kind?: 'observation' | 'time' | undefined;
  readonly incoming?: Observation | undefined;
  readonly alerts?: LatestAlerts | undefined;
  readonly roles?: Readonly<Record<string, Rn01Role>> | undefined;
  readonly independence?: readonly IndependentPair[] | undefined;
  readonly thresholds?: Partial<DecideThresholds> | undefined;
  /** Usa la configuración REAL de producción, no la sintética (CA-3.4). */
  readonly production?: boolean | undefined;
  readonly match?: Match | undefined;
}

/** La última observación de cada fuente, como la construye el aplicador. */
export function latestBySource(
  observations: readonly Observation[],
): ReadonlyMap<SourceId, Observation> {
  const latest = new Map<SourceId, Observation>();
  for (const observation of observations) {
    const known = latest.get(observation.source);
    if (known === undefined || Date.parse(known.observed_at) <= Date.parse(observation.observed_at)) {
      latest.set(observation.source, observation);
    }
  }
  return latest;
}

export function configOf(scene: Scene): DecideConfig {
  if (scene.production === true) return PRODUCTION_CONFIG;

  return {
    roles: scene.roles ?? SYNTHETIC_ROLES,
    independence: declareIndependence(scene.independence ?? []),
    thresholds: { ...DEFAULT_THRESHOLDS, ...scene.thresholds },
  };
}

export function inputOf(scene: Scene): DecideInput {
  return {
    kind: scene.kind ?? 'time',
    incoming: scene.incoming,
    match: scene.match ?? MATCH,
    previous: scene.previous ?? null,
    latestBySource: latestBySource(scene.observations),
    latestAlerts: scene.alerts ?? NO_ALERTS,
    now: scene.now,
    config: configOf(scene),
  };
}

/** Una escena, decidida. */
export function run(scene: Scene): DecideResult {
  return decide(inputOf(scene));
}

/** La tupla publicada de una `Decision`, para comparar secuencias. */
export function published(value: Decision): string {
  return `${value.status} ${String(value.home_score)}-${String(value.away_score)}`;
}
