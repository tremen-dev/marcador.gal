/**
 * The prompt builder, and the TYPE that stops identity travelling (ADR-022 §6,
 * SPEC-015 CA-5.1, CA-5.2, CA-5.3).
 *
 * `buildPrompt(input: { text, candidates }): string`. There is NO field capable
 * of carrying a correspondent, a chat identifier or a name — LET THE TYPE STOP
 * IT, NOT THE DISCIPLINE — and a type-level case asserts it over the published
 * type and not over the body of the function
 * (`tests/types/spec015-bot.test-d.ts`).
 *
 * NEITHER THE SYSTEM PROMPT NOR THE OUTPUT SCHEMA NAMES A PERSON, and the
 * candidate context IS NOT INDEXED BY PERSON: they are matches with a
 * `match_id` and a canonical name, nothing else. Sending the
 * `correspondent_id` «for context» was considered and rejected (ADR-022,
 * alternatives): it adds nothing to the parsing and takes the pseudonym out of
 * the domain where it is safe.
 *
 * WHAT THIS DOES NOT REACH, declared where it judges (ADR-016 §6, CA-5.8): the
 * correspondent writing their OWN name inside the text, which does travel. It
 * is theirs and it is unavoidable, and it is treated in the notice (CA-14.3).
 * And it does not reach what the provider does with what it receives: their
 * retention is not ours to command, and it is declared in the notice
 * (ADR-023 §3), not promised here.
 *
 * NO LITERAL OF THIS MODULE IS VISIBLE TEXT. The prompt is not shown to
 * anybody: it is an instruction to a machine, in the vocabulary of the model
 * and not of the person, so D-2 does not reach it — as it does not reach a SQL
 * template or a `robots.txt` rule.
 */
import type { Instant, MatchId } from '@/model/ids';

/**
 * One candidate, as the model receives it: the identity comes from the DECLARED
 * CALENDAR (ADR-017), which is the list of authority, and the names are the
 * canonical ones of the RFGF. The model chooses among these; it never writes a
 * name and never invents a match.
 */
export interface MatchCandidate {
  readonly match_id: MatchId;
  readonly home: string;
  readonly away: string;
  readonly kickoff: Instant;
}

/**
 * THE INPUT TYPE. Two fields, and there is no third: `exactOptionalPropertyTypes`
 * and the closed object shape make anything else a compile error.
 */
export interface PromptInput {
  readonly text: string;
  readonly candidates: readonly MatchCandidate[];
}

/** The instruction. English, like every identifier of this repository. */
const SYSTEM = [
  'You read one short message written by a football correspondent at a ground.',
  'Answer with one JSON object and nothing else.',
  'Fields: match_id, status, home_score, away_score, minute.',
  'match_id MUST be one of the candidate ids given below. Never invent one.',
  'status is one of: scheduled, live, finished, postponed, suspended.',
  'home_score and away_score are integers >= 0 for live, finished and suspended;',
  'they are null for scheduled and postponed.',
  'minute is an integer >= 0 or null.',
  'The first team named is the home team.',
  'If the message does not identify one of the candidates, answer {"match_id": null}.',
].join('\n');

function candidateLine(candidate: MatchCandidate): string {
  return `${candidate.match_id}\t${candidate.home}\t${candidate.away}\t${candidate.kickoff}`;
}

/** Renders the prompt. Its output is archived only as part of the answer, never alone. */
export function buildPrompt(input: PromptInput): string {
  return [
    SYSTEM,
    'CANDIDATES (id, home, away, kickoff):',
    ...input.candidates.map(candidateLine),
    'MESSAGE:',
    input.text,
  ].join('\n');
}
