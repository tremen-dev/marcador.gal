/**
 * CA-4, CA-5, CA-6 y CA-7 — el veredicto del modo sin referencia.
 *
 * Tres cosas se defienden aquí y las tres son declaraciones que el gate firmó:
 *
 * - **INDEPENDIENTE no es emitible.** Un espejo *sí* puede adelantar a otro
 *   espejo; lo que no puede es adelantar a **su** origen. Con futgal presente,
 *   los dos veredictos por candidata tapaban ese hueco; sin ella el adelanto
 *   mutuo queda solo y es compatible con dos hermanas de un origen que no hemos
 *   mirado. Las señales no se tiran: se cuentan, se citan y producen INCONCLUSO
 *   con motivo propio.
 * - **La bandera de RN-02 es `false` en todos los desenlaces**, sin excepción.
 * - **El adelanto en una sola dirección no nombra espejo de nadie.** Nombrar a
 *   C1 como origen de C2 es una *atribución*, y la atribución es justo lo que
 *   este modo no puede hacer: C2 rezagada es igual de compatible con «copia de
 *   C1» que con «las dos copian de O con retardos distintos».
 *
 * Cada caso asserta PRIMERO que las señales que dice tener están y superan su
 * mínimo, para no dar el veredicto correcto por el motivo equivocado.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { verdictWithoutReference } from '@/mirror/analysis/referenceless/verdict';
import { N_MIN } from '@/mirror/thresholds';
import { atRest, constant, goalAt, merge, padding, transientError } from '../support/plans';
import {
  MUTUAL_LEADS,
  ONE_WAY_LEADS,
  REASON_PLANS,
  analyseCandidates,
  candidatesPlan as pair,
} from '../support/referenceless';

describe('CA-4 — INDEPENDIENTE no es emitible, y las señales no se tiran', () => {
  test('1. adelantos mutuos 2 y 2 → INCONCLUSO, no INDEPENDIENTE', async () => {
    const analysis = await analyseCandidates(MUTUAL_LEADS());

    // Primero: las señales están y superan su mínimo declarado, en las DOS
    // direcciones. Sin esto, el INCONCLUSO podría venir de no haber medido nada.
    expect(analysis.leads_a).toBeGreaterThanOrEqual(2);
    expect(analysis.leads_b).toBeGreaterThanOrEqual(2);
    expect(analysis.lead_matches_a).toBeGreaterThanOrEqual(2);
    expect(analysis.lead_matches_b).toBeGreaterThanOrEqual(2);

    const verdict = verdictWithoutReference(analysis);

    expect(verdict.verdict).toBe('INCONCLUSO');
    expect(verdict.reason).toBe('independencia_no_demostrable_sin_referencia');
  });

  test('2. una discrepancia persistente tampoco basta: INCONCLUSO con el mismo motivo', async () => {
    const analysis = await analyseCandidates(
      pair(merge(padding(5), atRest('x', '17:00')), merge(padding(5), atRest('x', '18:00'))),
    );

    expect(analysis.persistent_discrepancies.length).toBeGreaterThanOrEqual(1);
    expect(analysis.persistent_discrepancies[0]!.captures_a).toBeGreaterThanOrEqual(3);
    expect(analysis.persistent_discrepancies[0]!.captures_b).toBeGreaterThanOrEqual(3);

    const verdict = verdictWithoutReference(analysis);

    expect(verdict.verdict).toBe('INCONCLUSO');
    expect(verdict.reason).toBe('independencia_no_demostrable_sin_referencia');
  });
});

describe('CA-6 — la regla de decisión del modo, total y ordenada', () => {
  test('3. rama 1 — N < N_min → INCONCLUSO / muestra_insuficiente', async () => {
    const shots = merge(padding(4), constant('c1'));
    const analysis = await analyseCandidates(pair(shots, shots));

    expect(analysis.n_comparable).toBeLessThan(N_MIN);

    const verdict = verdictWithoutReference(analysis);

    expect(verdict.verdict).toBe('INCONCLUSO');
    expect(verdict.reason).toBe('muestra_insuficiente');
    expect(verdict.origen_comun_probado).toBe(false);
  });

  test('4. rama 2 — un error replicado → ESPEJO / error_replicado, origen común probado', async () => {
    const analysis = await analyseCandidates(
      pair(merge(transientError('e1', 2), padding(5)), merge(transientError('e1', 3), padding(5))),
    );

    expect(analysis.n_comparable).toBeGreaterThanOrEqual(N_MIN);
    expect(analysis.replicated_errors).toHaveLength(1);
    expect(analysis.replicated_errors[0]!.raw_keys).toHaveLength(4);

    const verdict = verdictWithoutReference(analysis);

    expect(verdict.verdict).toBe('ESPEJO');
    expect(verdict.reason).toBe('error_replicado');
    expect(verdict.origen_comun_probado).toBe(true);
  });

  test('5. rama 3 — señal de independencia → INCONCLUSO / no demostrable sin referencia', async () => {
    const analysis = await analyseCandidates(MUTUAL_LEADS());

    const verdict = verdictWithoutReference(analysis);

    expect(verdict.verdict).toBe('INCONCLUSO');
    expect(verdict.reason).toBe('independencia_no_demostrable_sin_referencia');
    expect(verdict.mirror_indication).toBe(false);
  });

  test('6. rama 4a — sincronía → ESPEJO / sin_contenido_propio, por indicio', async () => {
    const shots = padding(6);
    const analysis = await analyseCandidates(pair(shots, shots));

    expect(analysis.temporal_half).toBe('completa');
    expect(analysis.exclusives_a).toBe(0);
    expect(analysis.exclusives_b).toBe(0);
    expect(analysis.leads_a).toBe(0);
    expect(analysis.leads_b).toBe(0);
    expect(analysis.n_comparable).toBeGreaterThanOrEqual(N_MIN);

    const verdict = verdictWithoutReference(analysis);

    expect(verdict.verdict).toBe('ESPEJO');
    expect(verdict.reason).toBe('sin_contenido_propio');
    expect(verdict.mirror_indication).toBe(true);
  });

  test('7. rama 4b — adelantos en una sola dirección → ESPEJO por indicio', async () => {
    const analysis = await analyseCandidates(ONE_WAY_LEADS());

    expect(analysis.leads_a).toBe(4);
    expect(analysis.leads_b).toBe(0);
    expect(analysis.lead_matches_a).toBeGreaterThanOrEqual(2);

    const verdict = verdictWithoutReference(analysis);

    expect(verdict.verdict).toBe('ESPEJO');
    expect(verdict.reason).toBe('adelantos_en_una_sola_direccion');
    expect(verdict.mirror_indication).toBe(true);
  });

  test('8. rama 5 — ninguna señal → INCONCLUSO / sin_senal', async () => {
    const shots = merge(...Array.from({ length: 12 }, (_unused, i) => atRest(`r${i}`, '17:00')));
    const analysis = await analyseCandidates(pair(shots, shots));

    expect(analysis.n_comparable).toBeGreaterThanOrEqual(N_MIN);
    expect(analysis.replicated_errors).toHaveLength(0);
    expect(analysis.persistent_discrepancies).toHaveLength(0);
    // Ventana en reposo: no hay ningún cambio de valor que medir, así que la
    // sincronía no puede disparar (sería un hecho sobre la ventana, no sobre
    // las fuentes).
    expect(analysis.temporal_half).toBe('pendiente');

    const verdict = verdictWithoutReference(analysis);

    expect(verdict.verdict).toBe('INCONCLUSO');
    expect(verdict.reason).toBe('sin_senal');
  });

  /**
   * El desempate de la rama 2 sobre la 3, y es donde el modo se aparta a
   * propósito del paso 2 de la regla de SPEC-002 CA-10: allí concurrían dos
   * señales FUERTES y una tenía que estar mal, así que INCONCLUSO era lo
   * honesto. Aquí la señal de independencia no es concluyente por construcción,
   * así que no hay contradicción que resolver — hay una prueba y un indicio en
   * contra.
   */
  test('9. error replicado Y adelantos mutuos a la vez → ESPEJO, no INCONCLUSO', async () => {
    const analysis = await analyseCandidates(
      pair(
        merge(goalAt('m1', 2), goalAt('m2', 2), goalAt('m3', 8), goalAt('m4', 8), transientError('e1', 2), padding(3)),
        merge(goalAt('m1', 8), goalAt('m2', 8), goalAt('m3', 2), goalAt('m4', 2), transientError('e1', 2), padding(3)),
      ),
    );

    expect(analysis.replicated_errors).toHaveLength(1);
    expect(analysis.lead_matches_a).toBeGreaterThanOrEqual(2);
    expect(analysis.lead_matches_b).toBeGreaterThanOrEqual(2);

    const verdict = verdictWithoutReference(analysis);

    expect(verdict.verdict).toBe('ESPEJO');
    expect(verdict.reason).toBe('error_replicado');
  });

  /**
   * El orden 3 antes que 4, que es lo que **cierra F-SPEC-002-21 para este
   * modo**: un indicio CEDE ante una señal. Adelantos en una sola dirección
   * MÁS una discrepancia persistente no es ESPEJO, es INCONCLUSO.
   */
  test('10. adelantos en una sola dirección Y discrepancia persistente → INCONCLUSO', async () => {
    const analysis = await analyseCandidates(
      pair(
        merge(goalAt('m1', 2), goalAt('m2', 2), goalAt('m3', 2), padding(3), atRest('x', '17:00')),
        merge(goalAt('m1', 8), goalAt('m2', 8), goalAt('m3', 8), padding(3), atRest('x', '18:00')),
      ),
    );

    expect(analysis.leads_a).toBeGreaterThanOrEqual(2);
    expect(analysis.leads_b).toBe(0);
    expect(analysis.persistent_discrepancies.length).toBeGreaterThanOrEqual(1);

    const verdict = verdictWithoutReference(analysis);

    expect(verdict.verdict).toBe('INCONCLUSO');
    expect(verdict.reason).toBe('independencia_no_demostrable_sin_referencia');
  });
});

describe('CA-5 (RN-02) — la bandera es false en todos los desenlaces', () => {
  // Los seis planes viven en `support/referenceless.ts` y no aquí: los barridos
  // de nivel informe (CA-2, CA-11, CA-12, CA-15) recorren exactamente esta
  // tabla. Tenerla dos veces es cómo se llegó a que el veredicto se barriese
  // entero y el informe solo sobre dos planes que daban los dos ESPEJO.
  test.for(REASON_PLANS)('11. %s no habilita la segunda vía', async ([reason, build]) => {
    const verdict = verdictWithoutReference(await analyseCandidates(build()));

    expect(verdict.reason).toBe(reason);
    expect(verdict.rn02_segunda_via_entre_automaticas).toBe(false);
    // CA-4: el dominio de veredictos es exactamente {ESPEJO, INCONCLUSO}.
    expect(['ESPEJO', 'INCONCLUSO']).toContain(verdict.verdict);
  });

  test('12. no existe ninguna rama del módulo de decisión que escriba true', async () => {
    const source = await readFile(
      join(process.cwd(), 'src/mirror/analysis/referenceless/verdict.ts'),
      'utf8',
    );
    const code = source.replaceAll(/\/\*[\s\S]*?\*\//g, '').replaceAll(/\/\/.*$/gm, '');

    expect(code).not.toMatch(/rn02_segunda_via_entre_automaticas\s*:\s*true/);
    expect(code).not.toMatch(/'INDEPENDIENTE'/);
  });
});

describe('CA-7 — el adelanto en una sola dirección no nombra espejo de nadie', () => {
  test('13. C1 adelanta 4 veces y C2 nunca → ESPEJO con espejo_de null', async () => {
    const verdict = verdictWithoutReference(await analyseCandidates(ONE_WAY_LEADS()));

    expect(verdict.verdict).toBe('ESPEJO');
    expect(verdict.mirror_indication).toBe(true);
    expect(verdict.espejo_de).toBeNull();
  });

  test('14. espejo_de es null en todos los desenlaces', async () => {
    for (const [, build] of [
      ['a', MUTUAL_LEADS],
      ['b', ONE_WAY_LEADS],
      ['c', () => pair(padding(6), padding(6))],
      ['d', () => pair(merge(transientError('e1', 2), padding(5)), merge(transientError('e1', 3), padding(5)))],
    ] as const) {
      const verdict = verdictWithoutReference(await analyseCandidates(build()));
      expect(verdict.espejo_de).toBeNull();
    }
  });
});

describe('CA-3 — la prueba de origen común se separa de su atribución', () => {
  test('15. con un error replicado: probado, sin atribuir y sin atribuido', async () => {
    const verdict = verdictWithoutReference(
      await analyseCandidates(
        pair(merge(transientError('e1', 2), padding(5)), merge(transientError('e1', 3), padding(5))),
      ),
    );

    expect(verdict.origen_comun_probado).toBe(true);
    expect(verdict.atribucion_de_origen).toBe('no_comprobada');
    expect(verdict.origen_atribuido_a).toBeNull();
  });

  test('16. la función de veredicto no acepta un conjunto de firmas de referencia', async () => {
    // Un parámetro más sería, con futgal ausente, un conjunto VACÍO, y
    // `some(e => !vacio.has(e))` es true para todo error replicado: el informe
    // afirmaría un origen aguas arriba de futgal sin haber mirado a futgal.
    expect(verdictWithoutReference).toHaveLength(1);

    const source = await readFile(
      join(process.cwd(), 'src/mirror/analysis/referenceless/verdict.ts'),
      'utf8',
    );
    const code = source.replaceAll(/\/\*[\s\S]*?\*\//g, '').replaceAll(/\/\/.*$/gm, '');

    expect(code).not.toMatch(/errorSignature|Signatures/);
    expect(code).not.toMatch(/origen_comun_distinto_de_futgal/);
  });
});
