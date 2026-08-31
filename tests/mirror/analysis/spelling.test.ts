/**
 * CA-10.4 y CA-15.4 — la divergencia de grafía se registra y NO dicta.
 *
 * Es el corazón de la enmienda 1 del 2026-08-31 y el caso que el CA declara
 * que «no puede faltar». La fuerza probatoria de CA-10.2 está en que **un
 * espejo converge**; la grafía es justo el campo donde un espejo **no converge
 * por construcción**, porque un agregador copia el marcador y rinde el nombre
 * desde su propia base de equipos. La señal dispara con la misma probabilidad
 * bajo las dos hipótesis, o sea que no lleva información: dictar con ella daría
 * INDEPENDIENTE de todo contra todo, y RN-02 abriría su segunda vía sobre una
 * independencia no demostrada. Que es, palabra por palabra, la confianza falsa
 * del §Problema.
 *
 * No se borra la señal, se le quita el voto (CA-14): es la superficie de
 * auditoría del emparejamiento manual de CA-6 y el primer insumo del catálogo
 * de alias de RN-09.
 */
import { describe, expect, test } from 'vitest';
import {
  MirrorReportSchema,
  PersistentDiscrepancyEvidenceSchema,
} from '@/mirror/analysis/report';
import { analyseFixture } from '../support/report';
import { everyMinute, lockstepPlan, merge, padding, plan, scheduled } from '../support/plans';
import { atRest } from '../support/plans';
import { CEROACERO, FUTGAL, RESULTADOS } from '../support/targets';
import type { MirrorReport } from '@/mirror/analysis/report';
import type { Cell, Shot } from '../support/archive';

/** The three matches the sources spell differently. */
const DIVERGENT = ['d1', 'd2', 'd3'] as const;

/** A match at rest that one source renders with its own team names. */
function spelled(id: string, home: string, away: string, length = 4): readonly Shot[] {
  const cell: Omit<Cell, 'id'> = { ...scheduled('17:00'), home, away };
  return everyMinute(
    id,
    Array.from({ length }, () => cell),
  );
}

function spelling(prefix: string): readonly Shot[] {
  return merge(...DIVERGENT.map((id) => spelled(id, `${prefix} ${id}`, `${prefix} v${id}`)));
}

/**
 * The day-2 window of the amendment: twelve matches at rest, of which three are
 * spelled differently by each of the three sources. Nothing else differs — same
 * `status`, same scoreboard, same kickoff — so the ONLY signal in the window is
 * the one that must not vote. N = 12 ≥ N_min, and the temporal half is
 * `pendiente` because nothing ever changes value.
 */
const spellingOnly = () => {
  const shared = merge(...Array.from({ length: 9 }, (_unused, i) => atRest(`m${i}`, '17:00', 4)));
  return plan(
    [FUTGAL, merge(shared, spelling('UD'))],
    [CEROACERO, merge(shared, spelling('CF'))],
    [RESULTADOS, merge(shared, spelling('SD'))],
  );
};

/** A window that already says ESPEJO by the weak indication, plus spellings. */
const lockstepSpelled = () =>
  plan(
    [FUTGAL, merge(padding(6), spelling('UD'))],
    [CEROACERO, merge(padding(6), spelling('CF'))],
    [RESULTADOS, merge(padding(6), spelling('SD'))],
  );

/** The same window with every source spelling the names the same way. */
const lockstepUnspelled = () =>
  plan(
    [FUTGAL, merge(padding(6), spelling('UD'))],
    [CEROACERO, merge(padding(6), spelling('UD'))],
    [RESULTADOS, merge(padding(6), spelling('UD'))],
  );

const verdicts = (report: MirrorReport) => [
  ...report.sources.map((source) => `${source.source}:${source.verdict}/${source.reason}`),
  `par:${report.pair.verdict}/${report.pair.reason}`,
];

describe('CA-10.4 — la grafía no dicta hacia INDEPENDIENTE', () => {
  test('1. grafías distintas y persistentes en 3 capturas, sin otra señal, NO son INDEPENDIENTE', async () => {
    const { report } = await analyseFixture(spellingOnly());

    for (const source of report.sources) {
      expect(source.verdict).toBe('INCONCLUSO');
      expect(source.reason).toBe('sin_senal');
      expect(source.rn02_segunda_via_entre_automaticas).toBe(false);
    }
  });

  test('2. y la divergencia aparece contada y citada en el informe', async () => {
    const { fixture, report } = await analyseFixture(spellingOnly());

    for (const source of report.sources) {
      expect(source.counters.spelling_divergences).toBe(DIVERGENT.length);
      expect(source.evidence.spelling_divergences).toHaveLength(DIVERGENT.length);

      // CA-14: cada afirmación cita capturas que existen en el archivo.
      for (const divergence of source.evidence.spelling_divergences) {
        expect(divergence.raw_keys.length).toBeGreaterThan(0);
        for (const key of divergence.raw_keys) {
          expect(await fixture.store.get(key), `clave colgada: ${key}`).not.toBeNull();
        }
        expect(divergence.spelling_a).not.toBe(divergence.spelling_b);
      }
    }
  });

  test('3. CA-15.4 — el par de candidatas tampoco sale INDEPENDIENTE por la grafía', async () => {
    const { report } = await analyseFixture(spellingOnly());

    // Aquí el argumento es MÁS fuerte: son dos agregadores, cada uno con su
    // propia base de equipos, así que la señal dispararía incluso para dos
    // reventas literales del mismo feed.
    expect(report.pair.verdict).toBe('INCONCLUSO');
    expect(report.pair.rn02_segunda_via_entre_automaticas).toBe(false);
    expect(report.pair.counters.spelling_divergences).toBe(DIVERGENT.length);
  });

  test('4. la ventana no tenía ninguna otra señal: el test mide lo que dice medir', async () => {
    const { report } = await analyseFixture(spellingOnly());

    for (const source of report.sources) {
      expect(source.counters.n_comparable).toBeGreaterThanOrEqual(source.counters.n_min);
      expect(source.counters.persistent_discrepancies).toBe(0);
      expect(source.counters.replicated_errors).toBe(0);
      expect(source.counters.exclusive_to_source).toBe(0);
      expect(source.counters.exclusive_to_reference).toBe(0);
    }
    expect(report.halves.temporal).toBe('pendiente');
  });
});

describe('CA-10.4 — la grafía tampoco dicta hacia ESPEJO', () => {
  test('5. un ESPEJO por indicio sigue siendo ESPEJO con las grafías divergentes', async () => {
    const { report } = await analyseFixture(lockstepSpelled());

    for (const source of report.sources) {
      expect(source.verdict).toBe('ESPEJO');
      expect(source.counters.spelling_divergences).toBeGreaterThan(0);
    }
  });

  test('6. sin voto en las dos direcciones: los veredictos no cambian con ella ni sin ella', async () => {
    const withSpelling = await analyseFixture(lockstepSpelled());
    const without = await analyseFixture(lockstepUnspelled());

    // La única diferencia entre las dos ventanas es cómo se escriben tres
    // nombres. Si la grafía tuviese voto, aunque fuese en un solo sentido,
    // alguno de los tres veredictos cambiaría.
    expect(verdicts(withSpelling.report)).toEqual(verdicts(without.report));
    expect(withSpelling.report.sources[0]!.counters.spelling_divergences).toBeGreaterThan(0);
    expect(without.report.sources[0]!.counters.spelling_divergences).toBe(0);
  });
});

describe('CA-13 — clave propia, nunca sumada a las discrepancias persistentes', () => {
  test('7. el contador de grafía existe y es distinto del de persistentes', async () => {
    const { report } = await analyseFixture(spellingOnly());

    expect(Object.keys(report.sources[0]!.counters)).toContain('spelling_divergences');
    expect(Object.keys(report.pair.counters)).toContain('spelling_divergences');
    expect(report.sources[0]!.counters.persistent_discrepancies).toBe(0);
    expect(report.pair.counters.persistent_discrepancies).toBe(0);
    expect(MirrorReportSchema.safeParse(report).success).toBe(true);
  });

  test('8. el esquema no deja que la grafía vuelva a colarse como discrepancia persistente', async () => {
    const { report } = await analyseFixture(spellingOnly());
    const divergence = report.sources[0]!.evidence.spelling_divergences[0]!;

    // Un contador compartido con un discriminador booleano sería «una
    // invitación a que el primer consumidor que olvide filtrar reintroduzca el
    // fallo». Aquí ni siquiera es representable: `team_spelling` no es un
    // valor legal del hecho de una discrepancia persistente.
    expect(
      PersistentDiscrepancyEvidenceSchema.safeParse({
        match_id: divergence.match_id,
        fact: 'team_spelling',
        value_a: divergence.spelling_a,
        value_b: divergence.spelling_b,
        captures_a: divergence.captures_a,
        captures_b: divergence.captures_b,
        raw_keys: divergence.raw_keys,
      }).success,
    ).toBe(false);
  });

  test('9. la prosa dice que se registra y no dicta, y no promete confirmado', async () => {
    const { report } = await analyseFixture(spellingOnly());

    for (const source of report.sources) {
      expect(source.prose).toContain('divergencias de grafía');
      expect(source.prose).toContain('no dicta');
      expect(source.prose).not.toContain('permite publicar confirmado');
    }
    expect(report.pair.prose).toContain('no dicta');
  });

  test('10. sin divergencias, la prosa no habla de ellas', async () => {
    const { report } = await analyseFixture(lockstepPlan());

    for (const source of report.sources) {
      expect(source.counters.spelling_divergences).toBe(0);
      expect(source.prose).not.toContain('divergencias de grafía');
    }
  });
});
