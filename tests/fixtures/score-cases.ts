/**
 * The truth table of "scoreboard vs status", ONE dataset for TWO schemas.
 *
 * CA-7 (`Observation`) and CA-18 (`Decision`) are the same criterion applied to
 * the two entities: what we observe and what we publish are protected by the
 * same rule. The spec is explicit that the tests share this file — «un solo
 * fichero de datos, dos esquemas»— so that the day the two diverge it has to be
 * a written decision and not a maintenance slip.
 *
 * `tests/db/scores.test.ts` reuses it for the Postgres level as well.
 *
 * `suspended` carries a scoreboard because a match suspended at minute 60 has
 * one; `postponed` does not, because it was never played.
 */
import { STATUSES_WITHOUT_SCORE, STATUSES_WITH_SCORE } from '@/model';
import type { MatchStatus } from '@/model';

export { STATUSES_WITHOUT_SCORE, STATUSES_WITH_SCORE };

/**
 * How the case sets the scoreboard. `absent` means the keys are not there at
 * all, which zod distinguishes from `null` and an `INSERT` does not — the
 * Postgres level skips those cases for that reason.
 */
export type ScoreCaseKind = 'value' | 'null' | 'absent' | 'negative' | 'fractional';

export interface ScoreCase {
  readonly label: string;
  readonly status: MatchStatus;
  /** Spread over the entity's base fixture. May be empty (`absent`). */
  readonly scores: Readonly<Record<string, number | null>>;
  readonly kind: ScoreCaseKind;
  readonly accepts: boolean;
}

type Draft = Omit<ScoreCase, 'label' | 'status'>;

/** States that have a scoreboard: the ball has been kicked. */
const WITH_SCORE_DRAFTS: readonly Draft[] = [
  { kind: 'value', scores: { home_score: 2, away_score: 0 }, accepts: true },
  { kind: 'value', scores: { home_score: 0, away_score: 0 }, accepts: true },
  { kind: 'null', scores: { home_score: null, away_score: null }, accepts: false },
  { kind: 'absent', scores: {}, accepts: false },
  { kind: 'negative', scores: { home_score: -1, away_score: 0 }, accepts: false },
  { kind: 'fractional', scores: { home_score: 1.5, away_score: 0 }, accepts: false },
];

/** States that do not: nothing has been played yet. */
const WITHOUT_SCORE_DRAFTS: readonly Draft[] = [
  { kind: 'null', scores: { home_score: null, away_score: null }, accepts: true },
  { kind: 'value', scores: { home_score: 0, away_score: 0 }, accepts: false },
  { kind: 'value', scores: { home_score: 3, away_score: 1 }, accepts: false },
  { kind: 'negative', scores: { home_score: -1, away_score: null }, accepts: false },
  { kind: 'fractional', scores: { home_score: 1.5, away_score: null }, accepts: false },
];

function expand(statuses: readonly MatchStatus[], drafts: readonly Draft[]): ScoreCase[] {
  return statuses.flatMap((status) =>
    drafts.map((draft) => ({
      ...draft,
      status,
      label: `${status} ${draft.kind} ${JSON.stringify(draft.scores)} → ${
        draft.accepts ? 'accepts' : 'rejects'
      }`,
    })),
  );
}

export const SCORE_CASES: readonly ScoreCase[] = [
  ...expand([...STATUSES_WITH_SCORE], WITH_SCORE_DRAFTS),
  ...expand([...STATUSES_WITHOUT_SCORE], WITHOUT_SCORE_DRAFTS),
];

/** A status no schema knows. Shared so both criteria reject the same word. */
export const UNKNOWN_STATUS = 'aprazado';
