/**
 * THE BATCH READ DOOR: read the live `Decision` of MANY matches, and the
 * observations that sustain each one, WITHOUT handing over the capability
 * RN-08 denies (SPEC-018 CA-6, ADR-027 §2).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS FILE LIVES IN `src/decide/` AND NOT IN `src/db/`, WRITTEN IN ITS
 * HEADER BECAUSE CA-6.2 ASKS FOR IT THERE.
 *
 * The frontier of SPEC-013 CA-13 makes it RED to name `PostgresDecisionStore`,
 * `DecisionStore` or the table `decisions` in any file that is not a declared
 * decision writer, by two independent mechanisms that must both keep passing
 * untouched. So a batch reader of decisions cannot live in `src/api/`, cannot
 * live in `src/board/` and cannot live in `src/db/board.ts` either. It lives
 * HERE, inside the one module RN-08 gives the capability to, and it hands back
 * PLAIN VALUES: `Decision` and `Observation` objects — the canonical model the
 * frontend already receives — and NO STORE: not a `DecisionStore`, not an
 * `EnginePorts`, not a `CyclePorts`.
 *
 * It is the third door of the same family and the same shape as
 * `./engine-entry.ts` (SPEC-015, the writing half) and `./read-entry.ts`
 * (SPEC-017, the reading half by match, ratified by `sdd-arquitecto`): a NEW
 * FILE in `src/decide/`, no existing file of SPEC-013 edited,
 * `DECISION_WRITERS` UNCHANGED AT TWO ENTRIES, and the caller imports it BY
 * NAME — an `import * as` over `src/decide/` would be an offence, and rightly
 * so. IT ENLARGES NO CAPABILITY: it gives back the same thing, for more
 * matches and in fewer trips.
 *
 * AND IT DOES NOT REACH `src/polite/http.ts`. It composes the durable
 * repository directly instead of borrowing `composeCyclePorts`, which drags
 * the platform fetcher in: the three routes of SPEC-018 are entry points of
 * SPEC-009 and CA-1.4 asserts that their graph cannot reach the exit door.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY IT IS BATCH, WHICH IS THE WHOLE REASON IT EXISTS (ADR-027, Contexto 2).
 *
 * `readMatchDecisions` reads ONE match, and the panel makes TWO queries per
 * match. For the panel that is correct: one person looks at it, behind a
 * signed session, and it does not refresh itself. A PUBLIC SCREEN THAT RELOADS
 * EVERY HALF MINUTE IN `N` BROWSERS CANNOT PAY `2 × matches` QUERIES PER TURN,
 * with a base that is ingesting at the same time — and the ingest has priority
 * over the screen, because with no `Decision` there is nothing to show.
 *
 * SO THE NUMBER OF QUERIES IS CONSTANT IN THE NUMBER OF MATCHES: exactly two,
 * whatever `matchIds.length` is. A case with a counting double asserts that
 * serving 2 matches and serving 18 makes the same number of queries, and its
 * positive control replaces this with a loop of `readMatchDecisions` and goes
 * red.
 *
 * THE SQL IS WRITTEN HERE, and it may be: this file is inside `src/decide/`,
 * which is the first entry of `DECISION_WRITERS`, so naming the table is not
 * an offence of the frontier — and it is READ-ONLY SQL. There is no `insert`,
 * no `update` and no `delete` in this module, and `RN-13` is not touched.
 */
import { DecisionSchema } from '@/model/decision';
import { ObservationSchema } from '@/model/observation';
import { pgTextArray } from '@/db/arrays';
import type { Sql } from '@/db/client';
import type { Decision } from '@/model/decision';
import type { MatchId, ObservationId } from '@/model/ids';
import type { Observation } from '@/model/observation';

/**
 * What one match looks like from outside. VALUES AND NOTHING ELSE: no port, no
 * store, no connection.
 */
export interface BoardMatchLog {
  readonly match_id: MatchId;
  /** The live `Decision`: the highest `version`. `null` when there is none. */
  readonly live: Decision | null;
  /**
   * The observations `live.supporting_observation_ids` names, in log order.
   * Empty when there is no live `Decision` — which is the normal case before
   * the first tick, and what the screen shows as *Sen marcador publicado*.
   */
  readonly supporting: readonly Observation[];
}

export interface ReadBoardInput {
  readonly sql: Sql;
  readonly matchIds: readonly MatchId[];
}

const DECISION_COLUMNS = [
  'match_id',
  'status',
  'home_score',
  'away_score',
  'provisional',
  'rule',
  'decided_at',
  'supporting_observation_ids',
  'version',
] as const;

const OBSERVATION_COLUMNS = [
  'id',
  'match_id',
  'source',
  'observed_at',
  'status',
  'home_score',
  'away_score',
  'confidence',
  'raw_ref',
] as const;

/**
 * Reads the live `Decision` of every match and the observations that sustain
 * it. TWO QUERIES, whatever the number of matches.
 *
 * The first uses `distinct on (match_id) … order by match_id, version desc`,
 * which is the same «the highest version is the live one» that
 * `getLatestByMatch` implements one match at a time (`dominio.md`). The second
 * reads ONLY the observations the decisions name, so the payload of the second
 * query is bounded by the first and does not grow with the log of a match.
 */
export async function readBoardLogs(input: ReadBoardInput): Promise<readonly BoardMatchLog[]> {
  if (input.matchIds.length === 0) return [];

  const sql = input.sql;
  const wantedMatches = pgTextArray(input.matchIds);

  const decisionRows = await sql<Record<string, unknown>[]>`
    select distinct on (match_id) ${sql(DECISION_COLUMNS)}
      from decisions
     where match_id = any (${wantedMatches}::text[])
     order by match_id, version desc
  `;

  const live = new Map<string, Decision>();
  const wantedObservations: ObservationId[] = [];
  for (const row of decisionRows) {
    const decision = DecisionSchema.parse(row);
    live.set(decision.match_id, decision);
    for (const id of decision.supporting_observation_ids) wantedObservations.push(id);
  }

  const observations = new Map<string, Observation>();
  if (wantedObservations.length > 0) {
    const observationRows = await sql<Record<string, unknown>[]>`
      select ${sql(OBSERVATION_COLUMNS)}
        from observations
       where id = any (${pgTextArray(wantedObservations)}::text[])
       order by observed_at asc, id asc
    `;
    for (const row of observationRows) {
      const observation = ObservationSchema.parse(row);
      observations.set(observation.id, observation);
    }
  }

  return input.matchIds.map((matchId) => {
    const decision = live.get(matchId) ?? null;
    const supporting =
      decision === null
        ? []
        : decision.supporting_observation_ids
            .map((id) => observations.get(id))
            .filter((observation): observation is Observation => observation !== undefined);

    return { match_id: matchId, live: decision, supporting };
  });
}
