/**
 * The five states of the mirror test are the five states of the canonical
 * model, not a copy of them.
 *
 * SPEC-002 adds nothing to `src/model/` and must not drift from it. `MatchStatus`
 * is derived with `Observation['status']`, so this file only has to prove the
 * two runtime lists — the extractor's `MATCH_STATUSES` and the zod enum the
 * calibration file validates against — cover exactly that union. If SPEC-00N
 * ever gives `Observation` a sixth branch, these assertions stop compiling
 * instead of the mirror test quietly ignoring it.
 */
import { MATCH_STATUSES } from '@/mirror/analysis/extract';
import { MatchStatusSchema } from '@/mirror/analysis/sources';
import type { MatchStatus } from '@/mirror/analysis/extract';
import type { z } from 'zod';

type Listed = (typeof MATCH_STATUSES)[number];
type Validated = z.infer<typeof MatchStatusSchema>;

/** Nothing in the model is missing from the extractor's list. */
const noneMissing: Exclude<MatchStatus, Listed> extends never ? true : false = true;
/** Nothing in the extractor's list is foreign to the model. */
const noneExtra: Exclude<Listed, MatchStatus> extends never ? true : false = true;
/** And the zod enum the calibration validates against is the same set. */
const schemaMissing: Exclude<MatchStatus, Validated> extends never ? true : false = true;
const schemaExtra: Exclude<Validated, MatchStatus> extends never ? true : false = true;

// @ts-expect-error a state the model does not have is not assignable
const notAStatus: MatchStatus = 'abandoned';

// @ts-expect-error and the runtime list cannot be widened by accident either
const notListed: Listed = 'abandoned';

export const assertions = [noneMissing, noneExtra, schemaMissing, schemaExtra, notAStatus, notListed];
