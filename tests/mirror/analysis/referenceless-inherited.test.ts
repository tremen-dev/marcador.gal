/**
 * CA-14 — lo heredado se hereda de verdad, y se prueba.
 *
 * Este modo hereda de SPEC-002 sin reinterpretación: el determinismo de su
 * CA-7, la cita de cada afirmación de su CA-14, τ, N_min, los mínimos de
 * adelanto, las tres capturas de persistencia, y el contador de grafía sin voto.
 *
 * El determinismo es además donde CA-15 se rompería solo: si el bloque de
 * retención consultase el reloj, dos ejecuciones con relojes distintos darían
 * JSON distintos y `sdd-verificador` dejaría de poder juzgar una ventana que no
 * presenció.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { analyzeWithoutReference } from '@/mirror/analysis/referenceless/analyze';
import { renderReferencelessFindings } from '@/mirror/analysis/referenceless/findings';
import { MIN_PERSISTENT_CAPTURES, MIN_LEAD_EVENTS, N_MIN, TAU_MS } from '@/mirror/thresholds';
import { buildFixture } from '../support/archive';
import {
  atRest,
  everyMinute,
  goalAt,
  merge,
  padding,
  scheduled,
  transientError,
} from '../support/plans';
import { BESOCCER, CEROACERO, analyseReferenceless, candidatesPlan } from '../support/referenceless';
import type { Cell, Fixture, Shot } from '../support/archive';
import type { ReferencelessReport } from '@/mirror/analysis/referenceless/report';

/** A match one source renders with its own team names (CA-10.4 de SPEC-002). */
function spelled(id: string, home: string, away: string, length = 4): readonly Shot[] {
  const cell: Omit<Cell, 'id'> = { ...scheduled('17:00'), home, away };
  return everyMinute(
    id,
    Array.from({ length }, () => cell),
  );
}

/**
 * Una ventana con de todo: adelantos en las dos direcciones, contenido
 * exclusivo, un error replicado, una discrepancia persistente de horario y tres
 * divergencias de grafía.
 */
const rich = () =>
  candidatesPlan(
    merge(
      goalAt('m1', 2),
      goalAt('m2', 2),
      goalAt('m3', 8),
      transientError('e1', 2),
      padding(4),
      goalAt('solo-de-c1', 5),
      atRest('x', '17:00'),
      merge(...['d1', 'd2', 'd3'].map((id) => spelled(id, `UD ${id}`, `UD v${id}`))),
    ),
    merge(
      goalAt('m1', 8),
      goalAt('m2', 8),
      goalAt('m3', 2),
      transientError('e1', 3),
      padding(4),
      atRest('x', '18:00'),
      merge(...['d1', 'd2', 'd3'].map((id) => spelled(id, `CF ${id}`, `CF v${id}`))),
    ),
  );

const run = (fixture: Fixture, keys: readonly string[]) =>
  analyzeWithoutReference({
    store: fixture.store,
    keys,
    log: fixture.log,
    extractors: fixture.extractors,
    pairing: fixture.pairing,
    candidates: [CEROACERO, BESOCCER],
  });

/** Todas las claves que el informe cita, en cualquier sitio. */
function citedKeys(report: ReferencelessReport): readonly string[] {
  const evidence = report.pair.evidence;
  return [
    ...evidence.leads.flatMap((item) => item.raw_keys),
    ...evidence.exclusives.flatMap((item) => item.raw_keys),
    ...evidence.replicated_errors.flatMap((item) => item.raw_keys),
    ...evidence.persistent_discrepancies.flatMap((item) => item.raw_keys),
    // Sin voto, no sin cita: siguen sujetas a CA-14 de SPEC-002.
    ...evidence.spelling_divergences.flatMap((item) => item.raw_keys),
  ];
}

afterEach(() => {
  vi.useRealTimers();
});

describe('CA-14 — el determinismo de SPEC-002 CA-7, heredado', () => {
  test('1. dos ejecuciones producen un JSON byte a byte idéntico', async () => {
    const fixture = await buildFixture(rich());

    expect(JSON.stringify(await run(fixture, fixture.keys))).toBe(
      JSON.stringify(await run(fixture, fixture.keys)),
    );
  });

  test('2. con las claves barajadas produce el mismo resultado', async () => {
    const fixture = await buildFixture(rich());
    const inOrder = JSON.stringify(await run(fixture, fixture.keys));

    expect(JSON.stringify(await run(fixture, [...fixture.keys].reverse()))).toBe(inOrder);
    expect(
      JSON.stringify(await run(fixture, [...fixture.keys].sort((a, b) => (a < b ? 1 : -1)))),
    ).toBe(inOrder);
  });

  /**
   * El caso 3 de `determinism.test.ts` corrido sobre este modo. Es donde CA-15
   * se rompe solo: un bloque de retención que consultase el reloj daría fechas
   * distintas en 2026 y en 2027.
   */
  test('3. no depende del reloj: 2026 y 2027 dan el mismo informe', async () => {
    const fixture = await buildFixture(rich());

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-06T09:00:00.000Z'));
    const morning = await run(fixture, fixture.keys);

    vi.setSystemTime(new Date('2027-01-01T23:59:59.000Z'));
    const newYear = await run(fixture, fixture.keys);

    expect(JSON.stringify(newYear)).toBe(JSON.stringify(morning));
    // Y en particular las tres fechas de la retención, que es lo que la
    // tentación de mirar el reloj movería.
    expect(newYear.retencion_del_archivo).toEqual(morning.retencion_del_archivo);
    // El documento también, no solo el JSON.
    expect(renderReferencelessFindings(newYear)).toBe(renderReferencelessFindings(morning));
  });

  test('4. el informe no está vacío: la comparación mide algo', async () => {
    const fixture = await buildFixture(rich());
    const report = await run(fixture, fixture.keys);

    expect(JSON.stringify(report).length).toBeGreaterThan(1000);
    expect(report.pair.counters.n_comparable).toBeGreaterThanOrEqual(N_MIN);
  });
});

describe('CA-14 — las citas de SPEC-002 CA-14, heredadas', () => {
  test('5. toda clave citada devuelve algo con store.get()', async () => {
    const { fixture, report } = await analyseReferenceless(rich());

    for (const key of citedKeys(report)) {
      expect(await fixture.store.get(key), `clave colgada: ${key}`).not.toBeNull();
    }
  });

  test('6. el recorrido mide algo: hay citas de los cinco tipos', async () => {
    const { report } = await analyseReferenceless(rich());
    const evidence = report.pair.evidence;

    expect(evidence.leads.length).toBeGreaterThan(0);
    expect(evidence.exclusives.length).toBeGreaterThan(0);
    expect(evidence.replicated_errors.length).toBeGreaterThan(0);
    expect(evidence.persistent_discrepancies.length).toBeGreaterThan(0);
    expect(evidence.spelling_divergences.length).toBeGreaterThan(0);
    expect(citedKeys(report).length).toBeGreaterThan(10);
  });

  test('7. una clave inventada NO pasa la comprobación: el test sabe fallar', async () => {
    const { fixture } = await analyseReferenceless(rich());

    expect(await fixture.store.get('ceroacero/rfef-tercera-g1/2026-09-05/inventada.html')).toBeNull();
  });
});

describe('CA-14 — los umbrales heredados viajan sin cambio', () => {
  test('8. τ, N_min, los mínimos de adelanto y las capturas de persistencia', async () => {
    const { report } = await analyseReferenceless(rich());

    expect(report.thresholds.tau_ms).toBe(TAU_MS);
    expect(report.thresholds.n_min).toBe(N_MIN);
    expect(report.thresholds.min_lead_events).toBe(MIN_LEAD_EVENTS);
    expect(report.thresholds.min_lead_events_each_direction).toBe(MIN_LEAD_EVENTS);
    expect(report.thresholds.persistent_discrepancy_captures).toBe(MIN_PERSISTENT_CAPTURES);
  });

  test('9. la grafía se cuenta aparte y no se suma a las discrepancias persistentes', async () => {
    const { report } = await analyseReferenceless(rich());

    expect(report.pair.counters.spelling_divergences).toBeGreaterThan(0);
    expect(report.pair.counters.spelling_divergences).toBe(
      report.pair.evidence.spelling_divergences.length,
    );
    expect(report.pair.counters.persistent_discrepancies).toBe(
      report.pair.evidence.persistent_discrepancies.length,
    );
    // Ni una divergencia de grafía dentro de las discrepancias persistentes.
    for (const discrepancy of report.pair.evidence.persistent_discrepancies) {
      expect(['existence', 'kickoff', 'finished_result']).toContain(discrepancy.fact);
    }
  });
});
