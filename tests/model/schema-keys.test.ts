/**
 * The extractor CA-14 leans on. If it stopped finding fields, CA-14 would pass
 * by comparing two empty sets — so it gets its own test, and it runs in the
 * suite that does not need a database.
 */
import { describe, expect, test } from 'vitest';
import {
  CompetitionSchema,
  DecisionSchema,
  MatchSchema,
  ObservationSchema,
  TeamAliasSchema,
  TeamSchema,
} from '@/model';
import { schemaKeys } from '../schema-keys';

const sorted = (keys: ReadonlySet<string>) => [...keys].sort();

describe('schemaKeys', () => {
  test('reads a plain object schema', () => {
    expect(sorted(schemaKeys(CompetitionSchema))).toEqual(['group', 'id', 'name', 'season']);
  });

  test('reads a team, whose aliases are a relation', () => {
    expect(sorted(schemaKeys(TeamSchema))).toEqual(['aliases', 'canonical_name', 'id']);
  });

  test('takes the union of the branches of a discriminated union', () => {
    expect(sorted(schemaKeys(TeamAliasSchema))).toEqual([
      'alias',
      'confirmed_at',
      'confirmed_by',
      'season',
      'source',
      'status',
      'team_id',
    ]);
  });

  test('unwraps .readonly() and unions the score branches', () => {
    expect(sorted(schemaKeys(ObservationSchema))).toEqual([
      'away_score',
      'confidence',
      'home_score',
      'id',
      'match_id',
      'observed_at',
      'raw_ref',
      'source',
      'status',
    ]);
  });

  test('unwraps .readonly() over a plain object', () => {
    expect(sorted(schemaKeys(DecisionSchema))).toEqual([
      'away_score',
      'decided_at',
      'home_score',
      'match_id',
      'provisional',
      'rule',
      'status',
      'supporting_observation_ids',
      'version',
    ]);
  });

  test('reads a match', () => {
    expect(sorted(schemaKeys(MatchSchema))).toEqual([
      'away_id',
      'competition_id',
      'home_id',
      'id',
      'kickoff',
      'round',
      'venue',
    ]);
  });
});
