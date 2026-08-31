/**
 * CA-10 (mitad de contenido, día 2) — las señales que no dependen del reloj.
 *
 * The replicated error carries the weight because two independent sources can
 * agree on every right answer — the real scoreboard is one — but not on the
 * wrong ones. The same wrong value and the same correction is the fingerprint
 * of a common origin, and it does not depend on the resolution of the
 * instrument, which RN-11 caps at one minute.
 *
 * The persistent discrepancy has to be persistent for the mirror image of the
 * same reason: a mirror with refresh lag disagrees with its origin transiently
 * ALL the time. What tells own data apart is that the difference does not
 * converge.
 */
import { describe, expect, test } from 'vitest';
import { comparePair, isRetraction } from '@/mirror/analysis/compare';
import { verdictAgainstReference } from '@/mirror/analysis/verdict';
import { MIN_PERSISTENT_CAPTURES } from '@/mirror/thresholds';
import { buildFixture, everyMinute, merge, plan } from '../support/archive';
import { CEROACERO, FUTGAL } from '../support/targets';
import type { Cell, Shot } from '../support/archive';

const live = (home: number, away: number): Omit<Cell, 'id'> => ({
  status: 'live',
  home_score: home,
  away_score: away,
});

const scheduled = (kickoff: string): Omit<Cell, 'id'> => ({
  status: 'scheduled',
  home_score: null,
  away_score: null,
  kickoff,
});

function goalAt(id: string, changeAt: number, length = 10): readonly Shot[] {
  return everyMinute(
    id,
    Array.from({ length }, (_unused, minute) => (minute < changeAt ? live(0, 0) : live(1, 0))),
  );
}

/** Matches both sources report identically, so N clears N_min (CA-11). */
function padding(count: number, length = 10): readonly Shot[] {
  return merge(...Array.from({ length: count }, (_unused, i) => goalAt(`p${i}`, 5, length)));
}

/** 0-0, then the wrong 1-0 for two captures, then back to 0-0. */
function transientError(id: string, wrongFrom: number, length = 10): readonly Shot[] {
  return everyMinute(
    id,
    Array.from({ length }, (_unused, minute) =>
      minute >= wrongFrom && minute < wrongFrom + 2 ? live(1, 0) : live(0, 0),
    ),
  );
}

async function analyse(futgal: readonly Shot[], candidate: readonly Shot[]) {
  const fixture = await buildFixture(plan([FUTGAL, futgal], [CEROACERO, candidate]));
  const analysis = comparePair(fixture.timeline, FUTGAL, CEROACERO);
  return { fixture, analysis, verdict: verdictAgainstReference(analysis) };
}

describe('CA-10.1 — error replicado', () => {
  test('una corrección se distingue de un gol: bajar es retractarse, subir es jugar', () => {
    expect(isRetraction(live(1, 0) as never, live(0, 0) as never)).toBe(true);
    expect(isRetraction(live(0, 0) as never, live(1, 0) as never)).toBe(false);
    expect(
      isRetraction({ status: 'finished', home_score: 1, away_score: 0 }, live(1, 0) as never),
    ).toBe(true);
  });

  test('(a) un error transitorio replicado → ESPEJO, citando las cuatro claves', async () => {
    const { analysis, verdict, fixture } = await analyse(
      merge(transientError('m1', 2), padding(5)),
      merge(transientError('m1', 3), padding(5)),
    );

    expect(analysis.replicated_errors).toHaveLength(1);
    expect(analysis.replicated_errors[0]!.raw_keys).toHaveLength(4);
    expect(verdict.verdict).toBe('ESPEJO');

    for (const key of analysis.replicated_errors[0]!.raw_keys) {
      expect(await fixture.store.get(key)).not.toBeNull();
    }
  });

  test('(a-bis) un error que solo comete F no es replicado', async () => {
    const { analysis, verdict } = await analyse(
      merge(transientError('m1', 2), padding(5)),
      merge(goalAt('m1', 99), padding(5)),
    );

    expect(analysis.replicated_errors).toHaveLength(0);
    // It may still come out ESPEJO through CA-10's other clause — S adds
    // nothing of its own and never moves out of step — but NOT through the
    // replicated error, which is the strong signal and is absent here.
    expect(verdict.reason).not.toBe('error_replicado');
    expect(verdict.mirror_indication).toBe(true);
  });
});

describe('CA-10.3 — contenido exclusivo', () => {
  test('(b) S con un hecho que F no tiene → no ESPEJO', async () => {
    const { analysis, verdict } = await analyse(
      padding(6),
      merge(padding(6), goalAt('solo-de-s', 5)),
    );

    expect(analysis.exclusives_b).toBeGreaterThan(0);
    expect(verdict.verdict).not.toBe('ESPEJO');
  });
});

describe('CA-10.2 — discrepancia persistente', () => {
  test('el umbral declarado son 3 capturas consecutivas de ambas', () => {
    expect(MIN_PERSISTENT_CAPTURES).toBe(3);
  });

  test('(c) horarios distintos en 2 capturas que luego convergen → NO es persistente', async () => {
    const futgal = merge(
      everyMinute('m1', Array.from({ length: 10 }, () => scheduled('17:00'))),
      padding(5),
    );
    const candidate = merge(
      everyMinute(
        'm1',
        Array.from({ length: 10 }, (_unused, minute) =>
          scheduled(minute < 2 ? '18:00' : '17:00'),
        ),
      ),
      padding(5),
    );

    const { analysis, verdict } = await analyse(futgal, candidate);

    expect(analysis.persistent_discrepancies).toHaveLength(0);
    expect(verdict.reason).not.toBe('discrepancia_persistente');
  });

  test('(d) los mismos horarios distintos en 3 capturas → INDEPENDIENTE', async () => {
    const futgal = merge(
      everyMinute('m1', Array.from({ length: 10 }, () => scheduled('17:00'))),
      padding(5),
    );
    const candidate = merge(
      everyMinute(
        'm1',
        Array.from({ length: 10 }, (_unused, minute) =>
          scheduled(minute < 3 ? '18:00' : '17:00'),
        ),
      ),
      padding(5),
    );

    const { analysis, verdict } = await analyse(futgal, candidate);

    expect(analysis.persistent_discrepancies).toHaveLength(1);
    expect(analysis.persistent_discrepancies[0]).toMatchObject({
      fact: 'kickoff',
      value_a: '17:00',
      value_b: '18:00',
    });
    expect(verdict.verdict).toBe('INDEPENDIENTE');
    expect(verdict.reason).toBe('discrepancia_persistente');
  });

  test('(e) un partido que solo una fuente tiene, sostenido, es discrepancia de existencia', async () => {
    const { analysis } = await analyse(padding(6), merge(padding(6), goalAt('solo-de-s', 5)));

    expect(
      analysis.persistent_discrepancies.some((discrepancy) => discrepancy.fact === 'existence'),
    ).toBe(true);
  });
});
