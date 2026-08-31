/**
 * CA-1, CA-2, CA-3, CA-11, CA-12 y CA-15 — el informe del modo sin referencia.
 *
 * La regla que ordena toda la spec, y que vale para cada campo: **«no lo hemos
 * comprobado» tiene que ser distinguible de «no lo había», en el JSON y en la
 * prosa.** Un `false`, un `0`, una lista vacía o una clave ausente son todos
 * indistinguibles de una medición que salió negativa. Lo no medido se declara,
 * con nombre propio y valor propio.
 *
 * El fallo concreto que esto cierra está medido y no supuesto: en
 * `verdict.ts` de SPEC-002, `some(e => !futgalErrorSignatures.has(sig(e)))` con
 * el conjunto VACÍO —que es lo que hay sin capturar futgal— es `true` para cada
 * error replicado, y el informe afirmaría un origen común aguas arriba de futgal
 * cuando lo único cierto es que no hemos mirado.
 */
import { describe, expect, test } from 'vitest';
import { MirrorReportSchema } from '@/mirror/analysis/report';
import { ModalReportSchema } from '@/mirror/analysis/mode';
import {
  DECLARED_LIMITATIONS,
  REFERENCELESS_CONFLICT_WARNING_TEXT,
  ReferencelessReasonSchema,
  ReferencelessReportSchema,
  UNMEASURED_CANDIDATE_VERDICTS,
} from '@/mirror/analysis/referenceless/report';
import { CONFLICT_METRIC_WARNING_TEXT } from '@/mirror/analysis/report';
import { canonicalInstant, instantToEpochMs } from '@/mirror/instants';
import { analyseFixture } from '../support/report';
import { lockstepPlan, merge, padding, transientError } from '../support/plans';
import {
  analyseReferenceless,
  candidatesPlan,
  referencelessReportsByReason,
} from '../support/referenceless';
import type { Instant } from '@/model/ids';

const DAY_MS = 24 * 60 * 60 * 1000;

const MIRRORED = () => candidatesPlan(padding(6), padding(6));
const REPLICATED = () =>
  candidatesPlan(
    merge(transientError('e1', 2), padding(5)),
    merge(transientError('e1', 3), padding(5)),
  );

/** Every key name that appears anywhere in a JSON value, at any depth. */
function keysOf(value: unknown, found: string[] = []): readonly string[] {
  if (Array.isArray(value)) {
    for (const item of value) keysOf(item, found);
  } else if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      found.push(key);
      keysOf(child, found);
    }
  }
  return found;
}

describe('CA-1 — el modo se declara y no se infiere', () => {
  test('1. el informe lleva modo sin-referencia y referencia null', async () => {
    const { report } = await analyseReferenceless(MIRRORED());

    expect(report.modo).toBe('sin-referencia');
    expect(report.referencia).toBeNull();
    expect(report.spec).toBe('SPEC-003');
  });

  test('2. las cuatro combinaciones contra la unión discriminada', async () => {
    const { report } = await analyseReferenceless(MIRRORED());
    const withReference = {
      ...(await analyseFixture(lockstepPlan())).report,
      modo: 'con-referencia' as const,
      referencia: 'futgal',
    };

    // Las dos válidas.
    expect(ModalReportSchema.safeParse(report).success).toBe(true);
    expect(ModalReportSchema.safeParse(withReference).success).toBe(true);

    // Las dos inválidas: un sin-referencia con referencia no nula, y un
    // con-referencia con referencia nula. Olvidar el flag tiene que dar un
    // error, no un informe parecido.
    expect(
      ModalReportSchema.safeParse({ ...report, referencia: 'futgal' }).success,
    ).toBe(false);
    expect(
      ModalReportSchema.safeParse({ ...withReference, referencia: null }).success,
    ).toBe(false);
  });

  test('3. un modo que no existe no valida', async () => {
    const { report } = await analyseReferenceless(MIRRORED());

    expect(ModalReportSchema.safeParse({ ...report, modo: 'a-medias' }).success).toBe(false);
  });
});

describe('CA-2 — los veredictos por candidata se declaran no medidos', () => {
  test('4. el esquema EXIGE el bloque, con su estado, su referencia prevista y su dictamen', async () => {
    const { report } = await analyseReferenceless(MIRRORED());

    expect(report.veredictos_por_candidata.estado).toBe('no_medidos');
    expect(report.veredictos_por_candidata.referencia_prevista).toBe('futgal');
    expect(report.veredictos_por_candidata.dictamen).toBe('2026-08-31');

    const { veredictos_por_candidata: _dropped, ...without } = report;
    expect(ReferencelessReportSchema.safeParse(without).success).toBe(false);
  });

  test('5. el motivo nombra robots.txt, el Disallow y RN-11', async () => {
    const { report } = await analyseReferenceless(MIRRORED());

    expect(report.veredictos_por_candidata.motivo).toContain('robots.txt');
    expect(report.veredictos_por_candidata.motivo).toContain('Disallow: /');
    expect(report.veredictos_por_candidata.motivo).toContain('RN-11');
  });

  test('6. `sources: []` no es representable en este modo', async () => {
    const { report } = await analyseReferenceless(MIRRORED());

    expect(ReferencelessReportSchema.safeParse({ ...report, sources: [] }).success).toBe(false);
  });

  test('7. ninguna clave del JSON se llama `sources` ni `reference`', async () => {
    const { report } = await analyseReferenceless(REPLICATED());
    const keys = keysOf(JSON.parse(JSON.stringify(report)));

    // Una lista vacía se lee como «se midió y no salió nada»; dos INCONCLUSO,
    // como «se midió y fue indeciso». Ninguna de las dos es verdad.
    expect(keys).not.toContain('sources');
    expect(keys).not.toContain('reference');
  });
});

describe('CA-3 — la prueba de origen común se separa de su atribución', () => {
  test('8. un error replicado por las dos: probado, no comprobado, no atribuido', async () => {
    const { fixture, report } = await analyseReferenceless(REPLICATED());

    expect(report.pair.counters.replicated_errors_total).toBe(1);
    expect(report.pair.origen_comun_probado).toBe(true);
    expect(report.pair.atribucion_de_origen).toBe('no_comprobada');
    expect(report.pair.origen_atribuido_a).toBeNull();

    // CA-14: las cuatro claves de la cita existen en el store.
    const cited = report.pair.evidence.replicated_errors[0]!.raw_keys;
    expect(cited).toHaveLength(4);
    for (const key of cited) expect(await fixture.store.get(key)).not.toBeNull();
  });

  test('9. sin error replicado, el origen común no se da por probado', async () => {
    const { report } = await analyseReferenceless(MIRRORED());

    expect(report.pair.counters.replicated_errors_total).toBe(0);
    expect(report.pair.origen_comun_probado).toBe(false);
    expect(report.pair.atribucion_de_origen).toBe('no_comprobada');
  });

  test('10. el JSON no contiene la cadena origen_comun_distinto_de_futgal', async () => {
    const { report } = await analyseReferenceless(REPLICATED());

    expect(JSON.stringify(report)).not.toContain('origen_comun_distinto_de_futgal');
    // Ni los contadores que se derivaban de la referencia: con el conjunto
    // vacío, «ausentes de futgal» sería el total, dicho como si se hubiese
    // mirado.
    expect(JSON.stringify(report)).not.toContain('absent_from_reference');
    expect(JSON.stringify(report)).not.toContain('also_in_reference');
  });
});

describe('CA-11 — el informe declara qué preguntas NO responde', () => {
  /**
   * Las cinco afirmaciones, cada una con lo que su texto tiene que decir. Se
   * comprueba el **contenido** y no solo el identificador: una afirmación
   * presente y vaciada es una limitación que dejó de declararse, y el
   * identificador solo no lo ve.
   */
  const REQUIRED: readonly (readonly [string, readonly string[]])[] = [
    ['espejo_de_futgal_no_medido', ['espejo de futgal', 'robots.txt', 'RN-11']],
    ['origen_comun_sin_atribuir', ['sin atribuir', 'no de quién']],
    ['independiente_no_emitible', ['no puede emitir INDEPENDIENTE', 'NO es']],
    ['metrica_de_conflictos_no_legible', ['métrica de conflictos', 'fuente oficial']],
    ['latencia_cobertura_operacion_no_medidas', ['Latencia', 'cobertura', 'calendario oficial']],
  ];
  const ids = REQUIRED.map(([id]) => id);

  test('11. las cinco afirmaciones están en el JSON de los SEIS motivos, íntegras', async () => {
    // Un informe de cada uno de los motivos de CA-6, no dos que dan los dos
    // ESPEJO: cuatro de los seis son INCONCLUSO, que es justo la mitad del
    // dominio en la que un lector desconfía y en la que nada miraba.
    for (const [reason, report] of await referencelessReportsByReason()) {
      expect(report.pair.reason).toBe(reason);
      expect(report.limitaciones_declaradas.map((limit) => limit.id)).toEqual(ids);
      // Íntegras: ni sustituidas por el ensamblador ni recortadas.
      expect(report.limitaciones_declaradas).toEqual(DECLARED_LIMITATIONS);

      for (const [id, phrases] of REQUIRED) {
        const limit = report.limitaciones_declaradas.find((each) => each.id === id);
        expect(limit).toBeDefined();
        expect(limit!.texto.length).toBeGreaterThan(40);
        for (const phrase of phrases) expect(limit!.texto).toContain(phrase);
      }
    }
  });

  test('12. y la prosa las repite en castellano corrido, en los seis', async () => {
    for (const [, report] of await referencelessReportsByReason()) {
      for (const limit of report.limitaciones_declaradas) {
        expect(report.prose).toContain(limit.texto);
      }
    }
  });

  test('13. un bloque vacío no valida', async () => {
    const { report } = await analyseReferenceless(MIRRORED());

    expect(
      ReferencelessReportSchema.safeParse({ ...report, limitaciones_declaradas: [] }).success,
    ).toBe(false);
    expect(
      ReferencelessReportSchema.safeParse({
        ...report,
        limitaciones_declaradas: report.limitaciones_declaradas.slice(1),
      }).success,
    ).toBe(false);
  });
});

describe('CA-12 — la advertencia de la métrica de conflictos es incondicional', () => {
  test('14. está en los DOS veredictos y en los seis motivos, y su texto no es el de SPEC-002', async () => {
    for (const [reason, report] of await referencelessReportsByReason()) {
      expect(report.pair.reason).toBe(reason);
      expect(report.conflict_metric_warning.hard_cut_15_percent_applies).toBe(false);
      expect(report.conflict_metric_warning.text).not.toBe(CONFLICT_METRIC_WARNING_TEXT);
      // El texto entero, y no una subcadena: en un INCONCLUSO es donde un
      // lector podría creer que la advertencia no aplica, así que degradarla
      // ahí tiene que poner esto rojo.
      expect(report.conflict_metric_warning.text).toBe(REFERENCELESS_CONFLICT_WARNING_TEXT);
      // El motivo propio del modo: no es que ninguna candidata haya salido
      // INDEPENDIENTE, es que ninguna se ha medido contra la fuente oficial.
      expect(report.conflict_metric_warning.text).toContain('ninguna se ha medido');
      expect(report.prose).toContain(report.conflict_metric_warning.text);
    }
  });

  test('15. la advertencia no es nulable en este modo', async () => {
    const { report } = await analyseReferenceless(MIRRORED());

    expect(
      ReferencelessReportSchema.safeParse({ ...report, conflict_metric_warning: null }).success,
    ).toBe(false);
  });
});

describe('CA-15 (ADR-009) — el informe declara su fecha de purga', () => {
  test('16. el bloque es obligatorio y no nulable, con paridad estricta', async () => {
    const { report } = await analyseReferenceless(MIRRORED());

    const { retencion_del_archivo: block, ...without } = report;
    expect(ReferencelessReportSchema.safeParse(without).success).toBe(false);
    expect(
      ReferencelessReportSchema.safeParse({ ...report, retencion_del_archivo: null }).success,
    ).toBe(false);
    expect(
      ReferencelessReportSchema.safeParse({
        ...report,
        retencion_del_archivo: { ...block, sobra: 1 },
      }).success,
    ).toBe(false);

    const { nota: _dropped, ...missingKey } = block;
    expect(
      ReferencelessReportSchema.safeParse({ ...report, retencion_del_archivo: missingKey })
        .success,
    ).toBe(false);
  });

  test('17. el ancla es el archivo: fin_de_ventana es exactamente window.end', async () => {
    const { report } = await analyseReferenceless(MIRRORED());

    expect(report.retencion_del_archivo.fin_de_ventana).toBe(report.window.end);
  });

  test('18. las dos fechas recomputadas a mano coinciden al milisegundo', async () => {
    const { report } = await analyseReferenceless(MIRRORED());
    const end = instantToEpochMs(report.window.end);

    expect(report.retencion_del_archivo.purga_prevista).toBe(canonicalInstant(end + 30 * DAY_MS));
    expect(report.retencion_del_archivo.purga_maxima).toBe(canonicalInstant(end + 90 * DAY_MS));
  });

  test('19. retrasar la última captura un día desplaza las dos fechas un día exacto', async () => {
    const start = '2026-09-05T17:00:00.000Z';
    const later = canonicalInstant(instantToEpochMs(start) + DAY_MS);

    const before = (await analyseReferenceless(MIRRORED(), { start })).report;
    const after = (await analyseReferenceless(MIRRORED(), { start: later })).report;

    const shift = (a: Instant, b: Instant) => instantToEpochMs(b) - instantToEpochMs(a);
    expect(shift(before.window.end, after.window.end)).toBe(DAY_MS);
    expect(
      shift(before.retencion_del_archivo.purga_prevista, after.retencion_del_archivo.purga_prevista),
    ).toBe(DAY_MS);
    expect(
      shift(before.retencion_del_archivo.purga_maxima, after.retencion_del_archivo.purga_maxima),
    ).toBe(DAY_MS);
  });

  test('20. un tick failed posterior a la última captura ok no mueve ninguna fecha', async () => {
    const plan = MIRRORED();
    const base = (await analyseReferenceless(plan)).report;

    // El ancla es el archivo y no el log, a propósito: un tick fallido no
    // archiva ni un byte, así que no alarga nada de lo que hay que conservar.
    const withLateFailure = (
      await analyseReferenceless(plan, {
        log: (log) => ({
          ...log,
          ticks: [
            ...log.ticks,
            {
              ...log.ticks[0]!,
              at: canonicalInstant(instantToEpochMs(base.window.end) + 10 * 60 * 1000),
              outcome: 'failed' as const,
              reason: 'network',
              raw_ref: null,
            },
          ],
        }),
      })
    ).report;

    expect(withLateFailure.retencion_del_archivo).toEqual(base.retencion_del_archivo);
  });

  test('21. un informe cuyo window.end es null no valida', async () => {
    const { report } = await analyseReferenceless(MIRRORED());

    expect(
      ReferencelessReportSchema.safeParse({
        ...report,
        window: { ...report.window, end: null },
      }).success,
    ).toBe(false);
  });

  test('22. la prosa lleva las tres fechas y dice cómo leerlas', async () => {
    const { report } = await analyseReferenceless(MIRRORED());
    const block = report.retencion_del_archivo;

    expect(report.prose).toContain(block.fin_de_ventana);
    expect(report.prose).toContain(block.purga_prevista);
    expect(report.prose).toContain(block.purga_maxima);
    expect(report.prose).toContain('ADR-009');
    expect(report.prose).toContain('prórroga');
    expect(report.prose).toContain('no se reescribe');
    expect(report.prose).toContain(
      'docs/epicas/EPIC-001-spike-ingesta/' +
        'SPEC-003-test-de-espejo-sin-referencia-el-cruce-entre-candidatas.ledger.md',
    );
  });
});

/**
 * **Los seis desenlaces, y no solo los dos ESPEJO.**
 *
 * CA-2 dice «dado **el** informe de este modo» y CA-15 dice «dado **cualquier**
 * informe de este modo». Los casos 4-5 y 16-22 de arriba corren sobre un solo
 * plan, que da ESPEJO: la presencia y la forma de los dos bloques las garantiza
 * el esquema en toda ruta, pero su **contenido** no lo garantizaba nada en la
 * mitad INCONCLUSO del dominio. Medido en la ronda anterior: vaciando el
 * `motivo` y falseando `purga_prevista` **solo cuando el veredicto es
 * INCONCLUSO**, la suite entera seguía verde.
 */
describe('CA-2 y CA-15 sobre los seis desenlaces, INCONCLUSO incluido', () => {
  test('24. el barrido cubre de verdad los dos veredictos y los seis motivos', async () => {
    const reports = await referencelessReportsByReason();

    // Este caso es la red de la red: si alguien cambia los planes de la tabla y
    // los seis vuelven a dar ESPEJO, los tres barridos de abajo seguirían
    // pasando sin mirar nunca un INCONCLUSO — que es exactamente el fallo que
    // costó esta vuelta.
    expect(reports.map(([reason]) => reason)).toEqual(
      ReferencelessReasonSchema.options as readonly string[],
    );
    for (const [reason, report] of reports) expect(report.pair.reason).toBe(reason);

    // Tres y tres: `muestra_insuficiente`, `independencia_no_demostrable_sin_
    // referencia` y `sin_senal` son INCONCLUSO; los otros tres, ESPEJO.
    const verdicts = new Set(reports.map(([, report]) => report.pair.verdict));
    expect([...verdicts].sort()).toEqual(['ESPEJO', 'INCONCLUSO']);
    expect(reports.filter(([, report]) => report.pair.verdict === 'INCONCLUSO')).toHaveLength(3);
    expect(reports.filter(([, report]) => report.pair.verdict === 'ESPEJO')).toHaveLength(3);
  });

  test('25. (CA-2) el bloque de veredictos no medidos es el mismo en los seis', async () => {
    for (const [reason, report] of await referencelessReportsByReason()) {
      expect(report.pair.reason).toBe(reason);

      const block = report.veredictos_por_candidata;
      expect(block.estado).toBe('no_medidos');
      expect(block.referencia_prevista).toBe('futgal');
      expect(block.dictamen).toBe('2026-08-31');
      // El motivo entero, que es lo que un esquema con `z.string().min(1)` no
      // puede sostener: nombra robots.txt, el Disallow y RN-11.
      expect(block.motivo).toContain('robots.txt');
      expect(block.motivo).toContain('Disallow: /');
      expect(block.motivo).toContain('RN-11');
      expect(block).toEqual(UNMEASURED_CANDIDATE_VERDICTS);
      expect(report.prose).toContain(block.motivo);

      // Y en ninguno de los seis reaparecen las claves de SPEC-002.
      const keys = keysOf(JSON.parse(JSON.stringify(report)));
      expect(keys).not.toContain('sources');
      expect(keys).not.toContain('reference');
    }
  });

  test('26. (CA-15) las tres fechas se sostienen en los seis, recomputadas a mano', async () => {
    for (const [reason, report] of await referencelessReportsByReason()) {
      expect(report.pair.reason).toBe(reason);

      const block = report.retencion_del_archivo;
      const end = instantToEpochMs(report.window.end);

      expect(block.adr).toBe('ADR-009');
      expect(block.fin_de_ventana).toBe(report.window.end);
      expect(block.plazo_dias).toBe(30);
      expect(block.prorrogas_permitidas).toBe(1);
      expect(block.techo_dias).toBe(90);
      expect(block.purga_prevista).toBe(canonicalInstant(end + 30 * DAY_MS));
      expect(block.purga_maxima).toBe(canonicalInstant(end + 90 * DAY_MS));

      // CA-15.4: y la prosa las repite, también en los INCONCLUSO.
      expect(report.prose).toContain(block.fin_de_ventana);
      expect(report.prose).toContain(block.purga_prevista);
      expect(report.prose).toContain(block.purga_maxima);
    }
  });
});

describe('el informe con referencia de SPEC-002 no se toca', () => {
  test('23. sigue validando contra su propio esquema, sin modo ni referencia', async () => {
    const { report } = await analyseFixture(lockstepPlan());

    expect(MirrorReportSchema.safeParse(report).success).toBe(true);
    expect(Object.keys(report)).not.toContain('modo');
  });
});
