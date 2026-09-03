/**
 * The contract of the match-status namespace (SPEC-015 CA-12.5).
 *
 * ITS OWN NAMESPACE, AND SHARED ON PURPOSE. The bot is the first place in the
 * real system where a person is shown a `MatchStatus`, but it will not be the
 * last: the scoreboard shows the same five words. Keeping them inside
 * `BotBundle` would guarantee that one day the bot and the scoreboard say
 * different things about the same state, which is exactly what `dominio.md`
 * exists to prevent.
 *
 * The KEYS are `MATCH_STATUSES` (`src/model/match.ts`) and the type says so,
 * so adding a sixth state and forgetting a language is a `npm run typecheck`
 * failure and not a card with a hole in it.
 *
 * The VALUES are the ones `docs/fundacion/dominio.md` registers, and they were
 * registered BEFORE being used, which is what the glossary's own header
 * demands. `live` is **En xogo**, in one single form and everywhere in the
 * product (decided by Alberto Fojo, 2026-09-03): the state/filter distinction
 * `sdd-lingua` recommended was expressly discarded.
 */
import type { MatchStatus } from '../model/match';

export type StatusesBundle = Readonly<Record<MatchStatus, string>>;
