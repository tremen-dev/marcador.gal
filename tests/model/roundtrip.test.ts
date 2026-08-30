/**
 * CA-2 — The types cross to the frontend without deforming.
 *
 * ADR-001 chose Node for this shared contract. Without this test the decision
 * has no evidence. The other half of CA-2 lives in
 * `src/app/_contract/model-client.tsx` and is checked by `npm run typecheck`.
 */
import { describe, expect, test } from 'vitest';
import type { ZodType } from 'zod';
import {
  CompetitionSchema,
  DecisionSchema,
  MatchSchema,
  ObservationSchema,
  TeamAliasSchema,
  TeamSchema,
} from '@/model';
import {
  competitionFixture,
  decisionFixture,
  matchFixture,
  observationFixture,
  teamAliasFixture,
  teamFixture,
} from '../fixtures/model';

const entities: ReadonlyArray<{
  readonly name: string;
  readonly schema: ZodType;
  readonly fixture: unknown;
}> = [
  { name: 'Competition', schema: CompetitionSchema, fixture: competitionFixture },
  { name: 'Team', schema: TeamSchema, fixture: teamFixture },
  { name: 'TeamAlias', schema: TeamAliasSchema, fixture: teamAliasFixture },
  { name: 'Match', schema: MatchSchema, fixture: matchFixture },
  { name: 'Observation', schema: ObservationSchema, fixture: observationFixture },
  { name: 'Decision', schema: DecisionSchema, fixture: decisionFixture },
];

describe.each(entities)('$name', ({ schema, fixture }) => {
  test('survives JSON.stringify + reparse with the same schema', () => {
    const parsed: unknown = schema.parse(fixture);
    const reparsed: unknown = schema.parse(JSON.parse(JSON.stringify(parsed)));

    expect(reparsed).toEqual(parsed);
  });

  test('carries no value that JSON cannot represent (no Date, ADR-006)', () => {
    const parsed: unknown = schema.parse(fixture);

    expect(JSON.parse(JSON.stringify(parsed))).toEqual(parsed);
  });
});
