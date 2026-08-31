/**
 * Window shapes the criteria keep needing: a mirror, an independent source, a
 * static day-2 window, one with a replicated error.
 */
import { everyMinute, merge, plan } from './archive';
import { CEROACERO, FUTGAL, RESULTADOS } from './targets';
import type { Cell, Plan, Shot } from './archive';

export { everyMinute, merge, plan } from './archive';

export const live = (home: number, away: number): Omit<Cell, 'id'> => ({
  status: 'live',
  home_score: home,
  away_score: away,
});

export const scheduled = (kickoff: string | null): Omit<Cell, 'id'> => ({
  status: 'scheduled',
  home_score: null,
  away_score: null,
  kickoff,
});

/** 0-0 until `changeAt`, then 1-0. */
export function goalAt(id: string, changeAt: number, length = 10): readonly Shot[] {
  return everyMinute(
    id,
    Array.from({ length }, (_unused, minute) => (minute < changeAt ? live(0, 0) : live(1, 0))),
  );
}

/** One value, never changing: an event, but no timing to measure. */
export function constant(id: string, length = 10): readonly Shot[] {
  return everyMinute(
    id,
    Array.from({ length }, () => live(0, 0)),
  );
}

/** A match nobody plays: the day-2 window, in reposo. */
export function atRest(id: string, kickoff: string | null, length = 10): readonly Shot[] {
  return everyMinute(
    id,
    Array.from({ length }, () => scheduled(kickoff)),
  );
}

/** Matches every source reports identically, to clear N_min. */
export function padding(count: number, length = 10): readonly Shot[] {
  return merge(...Array.from({ length: count }, (_unused, i) => goalAt(`p${i}`, 5, length)));
}

/** 0-0, then a wrong 1-0 for two captures, then 0-0 again. */
export function transientError(id: string, wrongFrom: number, length = 10): readonly Shot[] {
  return everyMinute(
    id,
    Array.from({ length }, (_unused, minute) =>
      minute >= wrongFrom && minute < wrongFrom + 2 ? live(1, 0) : live(0, 0),
    ),
  );
}

/** Three sources moving in lockstep: nothing proves anything about anybody. */
export function lockstepPlan(): Plan {
  const shots = padding(6);
  return plan([FUTGAL, shots], [CEROACERO, shots], [RESULTADOS, shots]);
}

/** A window where both candidates lead futgal in two matches each. */
export function bothIndependentPlan(): Plan {
  const late = merge(goalAt('m1', 6), goalAt('m2', 6), padding(4));
  const early = merge(goalAt('m1', 3), goalAt('m2', 3), padding(4));
  return plan([FUTGAL, late], [CEROACERO, early], [RESULTADOS, early]);
}
