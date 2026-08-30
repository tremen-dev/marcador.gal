/**
 * The canonical model of marcador.gal (SPEC-001).
 *
 * Every type here is derived exclusively with `z.infer` from the schema next
 * to it: the schema is the single source of truth, and the frontend imports
 * these very types (ADR-001).
 */
export * from './ids';
export * from './competition';
export * from './team';
export * from './match';
export * from './observation';
export * from './decision';
export * from './qualifier';

export { RawRefSchema, RAW_KEY_PATTERN } from '../raw/key';
export type { RawRef } from '../raw/key';
