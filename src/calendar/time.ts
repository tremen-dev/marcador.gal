/**
 * Wall-clock time to instant, AT THE EDGE (SPEC-010 CA-2, ADR-006, ADR-017 §4).
 *
 * The declared calendar carries `kickoff` as the RFGF publishes it and a
 * person reads it: local time in `Europe/Madrid`, `YYYY-MM-DD HH:MM`. This is
 * the one place where that local time becomes the ISO 8601 UTC string with a
 * `Z` of the canonical model; nothing further in ever sees a local hour again.
 *
 * `Date` APPEARS HERE AS A TRANSIENT CONVERTER AND NOWHERE ELSE in
 * `src/calendar/` or in the three repositories — the same licence
 * `src/polite/clock.ts` takes. Nothing outside receives one: the return type
 * is `Instant`, a string.
 *
 * What does not exist is rejected instead of resolved in silence: the hour the
 * spring change skips (`2027-03-28 02:30`) and the hour the autumn change
 * repeats (`2026-10-25 02:30`) both throw, each with its own error, naming the
 * time. Better that the machine complains out loud than that a person is wrong
 * quietly (ADR-017 §*Alternativas*).
 *
 * `Intl` from Node does the timezone arithmetic. No dependency (ADR-017 §5).
 */
import type { Instant } from '@/model/ids';

/** Wall-clock time in a timezone: `YYYY-MM-DD HH:MM`. */
const WALL_TIME = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/;

/** Thrown when a string is not `YYYY-MM-DD HH:MM`, or is not a real date. */
export class MalformedWallTimeError extends Error {
  override readonly name = 'MalformedWallTimeError';
  readonly wallTime: string;

  constructor(wallTime: string, reason: string) {
    super(`${JSON.stringify(wallTime)} ${reason}`);
    this.wallTime = wallTime;
  }
}

/** Thrown for a wall-clock time the timezone skips (the spring gap). */
export class NonexistentWallTimeError extends Error {
  override readonly name = 'NonexistentWallTimeError';
  readonly wallTime: string;
  readonly timeZone: string;

  constructor(wallTime: string, timeZone: string) {
    super(`${wallTime} does not exist in ${timeZone}: the clock skips it`);
    this.wallTime = wallTime;
    this.timeZone = timeZone;
  }
}

/** Thrown for a wall-clock time the timezone repeats (the autumn overlap). */
export class AmbiguousWallTimeError extends Error {
  override readonly name = 'AmbiguousWallTimeError';
  readonly wallTime: string;
  readonly timeZone: string;
  readonly candidates: readonly Instant[];

  constructor(wallTime: string, timeZone: string, candidates: readonly Instant[]) {
    super(
      `${wallTime} is ambiguous in ${timeZone}: it happens twice (${candidates.join(' and ')})`,
    );
    this.wallTime = wallTime;
    this.timeZone = timeZone;
    this.candidates = candidates;
  }
}

interface WallParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
}

function parseWallTime(wallTime: string): WallParts {
  const match = WALL_TIME.exec(wallTime);
  if (match === null) {
    throw new MalformedWallTimeError(wallTime, 'is not a wall-clock time of the form YYYY-MM-DD HH:MM');
  }
  const [, year, month, day, hour, minute] = match.map(Number) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  const parts: WallParts = { year, month, day, hour, minute };

  // `Date.UTC` rolls `2026-02-30` over to March; the round trip catches it.
  const asIfUtc = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (
    asIfUtc.getUTCFullYear() !== year ||
    asIfUtc.getUTCMonth() !== month - 1 ||
    asIfUtc.getUTCDate() !== day ||
    asIfUtc.getUTCHours() !== hour ||
    asIfUtc.getUTCMinutes() !== minute
  ) {
    throw new MalformedWallTimeError(wallTime, 'is not a date');
  }
  return parts;
}

/** The wall-clock parts an instant shows in a timezone, read through `Intl`. */
function wallPartsAt(epochMs: number, timeZone: string): WallParts {
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(epochMs));

  const read = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(formatted.find((part) => part.type === type)?.value);

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
  };
}

function sameWall(a: WallParts, b: WallParts): boolean {
  return (
    a.year === b.year &&
    a.month === b.month &&
    a.day === b.day &&
    a.hour === b.hour &&
    a.minute === b.minute
  );
}

/** The offset (in ms) the timezone applies at an instant: local minus UTC. */
function offsetAt(epochMs: number, timeZone: string): number {
  const local = wallPartsAt(epochMs, timeZone);
  const asIfUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
  // Truncate to the minute on both sides so the second/millisecond part of
  // `epochMs` does not leak into the offset.
  return asIfUtc - Math.floor(epochMs / 60_000) * 60_000;
}

const HALF_A_DAY_MS = 12 * 60 * 60 * 1000;

/**
 * The instant at which a timezone's clocks show a wall-clock time.
 *
 * The wall time is read as if it were UTC, and each offset the zone uses
 * around that moment — the one in force twelve hours before and the one in
 * force twelve hours after, which are the two sides of any transition —
 * yields a candidate instant. A candidate is kept only if the zone's clocks
 * really show the wall time at it. None kept: the time is skipped. Two kept:
 * the time is repeated. One: that is the instant.
 */
export function wallTimeToInstant(wallTime: string, timeZone: string): Instant {
  const wanted = parseWallTime(wallTime);
  const asIfUtc = Date.UTC(
    wanted.year,
    wanted.month - 1,
    wanted.day,
    wanted.hour,
    wanted.minute,
  );

  const offsets = new Set([
    offsetAt(asIfUtc - HALF_A_DAY_MS, timeZone),
    offsetAt(asIfUtc + HALF_A_DAY_MS, timeZone),
  ]);

  const candidates: Instant[] = [];
  for (const offset of offsets) {
    const candidate = asIfUtc - offset;
    if (sameWall(wallPartsAt(candidate, timeZone), wanted)) {
      candidates.push(new Date(candidate).toISOString() as Instant);
    }
  }
  candidates.sort();

  if (candidates.length === 0) throw new NonexistentWallTimeError(wallTime, timeZone);
  if (candidates.length > 1) throw new AmbiguousWallTimeError(wallTime, timeZone, candidates);
  return candidates[0]!;
}
