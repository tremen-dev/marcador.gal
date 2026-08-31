/**
 * Every threshold of SPEC-002, in ONE place.
 *
 * §5 of the gate notes: none of these is received truth. They are declared
 * hypotheses, they travel inside the report next to the data actually
 * observed, and the point of that is to be able to recompute a verdict with a
 * different threshold WITHOUT capturing the window again. Keeping them here —
 * and not inlined at the site that uses them — is what makes "the report
 * records the thresholds it used" cheap enough to be true.
 */

export const SECOND_MS = 1_000;
export const MINUTE_MS = 60 * SECOND_MS;

/**
 * RN-11, read as one request per minute per (source, competition) pair. See
 * spec §Diseño 3: this reading is load-bearing, not a detail.
 */
export const MIN_REQUEST_INTERVAL_MS = MINUTE_MS;

/**
 * CA-8. Two sources sampled once a minute can look up to 60 s apart purely
 * from the phase of their sampling; 30 s more absorb network latency and cron
 * jitter. A difference above this is a real adelanto, below it is the
 * instrument.
 */
export const TAU_MS = 90 * SECOND_MS;

/**
 * CA-11. An hour of football over 8-9 matches yields of the order of 15-25
 * events between goals and state transitions. Below ten, the distribution of
 * leads is noise. If the real window falls short the answer is to widen the
 * window, not to lower this.
 */
export const N_MIN = 10;

/**
 * CA-9. One adelanto would logically be enough — a mirror cannot lead — but a
 * single one is indistinguishable from one broken extractor on one match.
 * Requiring two DIFFERENT matches buys robustness against exactly that.
 */
export const MIN_LEAD_EVENTS = 2;
export const MIN_LEAD_MATCHES = 2;

/**
 * CA-10.2. A mirror with refresh lag disagrees with its origin transiently all
 * the time; what tells own data apart is that the difference does NOT
 * converge. Three consecutive captures of BOTH sources is the declared floor.
 */
export const MIN_PERSISTENT_CAPTURES = 3;
